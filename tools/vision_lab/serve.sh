#!/usr/bin/env bash
# Start the model server (OpenAI-compatible, port 8000). Pick the profile that matches your GPUs.
#   bash serve.sh qwen38-27b               # A on ONE H100/A100 80GB (BF16)          <- Kshitij's pod
#   bash serve.sh qwen35-122b-int4         # B on ONE 80 GB GPU (4-bit), after stopping A
#   bash serve.sh qwen38-27b-fp8           # on one 48 GB GPU (L40S / A6000)
#   bash serve.sh qwen35-122b-fp8          # A on 2x H200 (TP 2) or 4x H100 (TP 4)
#   bash serve.sh qwen35-397b-fp8          # the largest: 8x H100 or 8x H200
#   bash serve.sh qwen3-omni               # C, the ears (audio + video): one 80 GB GPU, for `vl.py sound`
# Logs: /workspace/vision_lab_work/server.log. Wait for "Application startup complete", then run selftest.
# Stop it with: pkill -f "vllm serve"
# --media-io-kwargs: vLLM 0.30's Qwen3-VL loader samples every video at `fps` (default 2!) up to 768 frames and reads only
# `max_duration` seconds (default 300, shorter than most TED-Ed films). `num_frames` is ignored. So the server samples at 4 fps,
# the highest rate the lab uses (shots, judge), and lower rates live in the files: the whole-film video is made at 1 fps,
# and the loader never takes more frames than a file has (L-201).
# --max-num-seqs 32: Qwen3.8 is a hybrid (attention + Mamba-style) model; each running sequence needs a Mamba cache
# block, and vLLM's default of 1024 sequences failed at start-up on one H100 with only 782 blocks (L-196). The lab sends
# at most server.workers (8) requests at once, so 32 is plenty. Override with SEQS=64 bash serve.sh ...
set -euo pipefail
if [ "${1:-}" = "--print-model" ]; then shift; PRINT=1; else PRINT=0; fi
PROFILE="${1:-qwen38-27b}"
NGPU=$(nvidia-smi -L 2>/dev/null | wc -l || echo 1)
UTIL=0.90
case "$PROFILE" in
  qwen38-27b)       MODEL=Qwen/Qwen3.8-27B;                 TP=1; LEN=131072 ;;
  qwen38-27b-fp8)   MODEL=Qwen/Qwen3.8-27B-FP8;             TP=1; LEN=131072 ;;
  qwen35-122b-int4) MODEL=Qwen/Qwen3.5-122B-A10B-GPTQ-Int4; TP=1; LEN=65536; UTIL=0.95 ;;
  qwen35-122b-fp8)  MODEL=Qwen/Qwen3.5-122B-A10B-FP8;       TP=$([ "$NGPU" -ge 4 ] && echo 4 || echo 2); LEN=262144 ;;
  qwen35-397b-fp8)  MODEL=Qwen/Qwen3.5-397B-A17B-FP8;       TP=8; LEN=262144 ;;
  qwen3-omni)       MODEL=Qwen/Qwen3-Omni-30B-A3B-Instruct;   TP=1; LEN=65536 ;;
  *) echo "unknown profile $PROFILE"; exit 2 ;;
esac
if [ "$PRINT" = 1 ]; then echo "$MODEL"; exit 0; fi
source /root/venv/env.sh            # made by setup.sh (re-run it after a pod restart)
PORT="${PORT:-8000}"
# weights found as a plain folder by find_model.py --link are served from there, under the model's own name
LOCAL="/workspace/hf/local_model_path__${MODEL//\//--}"
SRC="$MODEL"; [ -f "$LOCAL" ] && SRC="$(head -1 "$LOCAL")"
echo "serving $MODEL (from $SRC) on $NGPU GPU(s), tensor parallel $TP, context $LEN, port $PORT"
nohup vllm serve "$SRC" \
  --served-model-name "$MODEL" \
  --port "$PORT" \
  --tensor-parallel-size "$TP" \
  --max-model-len "$LEN" \
  --gpu-memory-utilization "$UTIL" \
  --max-num-seqs "${SEQS:-32}" \
  --reasoning-parser qwen3 \
  --allowed-local-media-path /workspace \
  --limit-mm-per-prompt '{"image": 8, "video": 1, "audio": 1}' \
  --media-io-kwargs '{"video": {"fps": 4, "max_duration": 1200}}' \
  > /workspace/vision_lab_work/server.log 2>&1 &
echo "pid $!  (tail -f /workspace/vision_lab_work/server.log)"
