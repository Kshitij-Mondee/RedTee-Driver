#!/usr/bin/env bash
# Setup on a RunPod pod (Ubuntu with CUDA 12.x, e.g. the "Runpod Pytorch 2.8.0" template).
#
# Where things go:
#   VOLUME  /workspace (kept when the pod stops): model weights, videos, prepared clips, results
#   POD     container disk (wiped when the pod stops): Python env, Whisper, download caches
# After every pod restart run this again: it rebuilds the env (about 10 min) and skips the weights already on the volume.
#   bash setup.sh qwen38-27b
set -euo pipefail
PROFILE="${1:-qwen38-27b}"
HERE="$(cd "$(dirname "$0")" && pwd)"
export HF_HOME=/workspace/hf                 # weights: on the volume
export UV_CACHE_DIR=/root/.cache/uv          # download caches: on the pod
mkdir -p /workspace/hf /workspace/videos/ted-ed /workspace/vision_lab_work /root/whisper

echo "== system packages (pod)"
apt-get update -qq && apt-get install -y -qq ffmpeg fonts-dejavu-core git unzip > /dev/null

echo "== python env on the pod (/root/venv)"
pip install -q -U uv
[ -d /root/venv ] || uv venv /root/venv --python 3.12
source /root/venv/bin/activate
uv pip install -q -U "vllm>=0.17.0" --torch-backend=auto
uv pip install -q -r "$HERE/requirements.txt"
# faster-whisper (CTranslate2) needs cuBLAS 12 and cuDNN 9 on the library path
uv pip install -q nvidia-cublas-cu12 "nvidia-cudnn-cu12>=9,<10"
SITE=$(python -c "import site; print(site.getsitepackages()[0])")
cat > /root/venv/env.sh <<ENV
source /root/venv/bin/activate
export LD_LIBRARY_PATH=$SITE/nvidia/cublas/lib:$SITE/nvidia/cudnn/lib:\${LD_LIBRARY_PATH:-}
export HF_HOME=/workspace/hf
export UV_CACHE_DIR=/root/.cache/uv
ENV

echo "== model weights for profile $PROFILE (on the volume; skipped if already there)"
MODEL=$(bash "$HERE/serve.sh" --print-model "$PROFILE")
# reuse weights already on the volume in any layout (another run's HF cache, or a plain folder): no second 56 GB download
python3 "$HERE/find_model.py" --model "$MODEL" --link || true
if [ -f "/workspace/hf/local_model_path__${MODEL//\//--}" ]; then
  echo "using the weights in $(head -1 "/workspace/hf/local_model_path__${MODEL//\//--}")"
else
  hf download "$MODEL" > /dev/null          # checks a complete copy, resumes a partial one, downloads a missing one
fi
echo "== done. vllm $(python -c 'import vllm; print(vllm.__version__)'); model $MODEL in $HF_HOME"
df -h /workspace | tail -1 | awk '{print "volume: used " $3 " of " $2 ", free " $4}'
df -h / | tail -1 | awk '{print "pod disk: used " $3 " of " $2 ", free " $4}'
echo "every new terminal: source /root/venv/env.sh && cd $HERE"
