#!/usr/bin/env bash
# What is on this volume, and what can go. Read-only: it deletes nothing.
#   bash disk_report.sh            # reports on /workspace (the attached volume)
#   bash disk_report.sh /some/dir  # any other folder
D="${1:-/workspace}"
echo "== volume: $D"
df -h "$D" | tail -1 | awk '{print "size " $2 ", used " $3 ", free " $4 " (" $5 " full)"}'
echo
echo "== biggest folders (top level)"
du -sh "$D"/* "$D"/.[!.]* 2>/dev/null | sort -rh | head -20
echo
echo "== AI models downloaded (Hugging Face caches)"
for c in "$D/hf/hub" "$D/.cache/huggingface/hub" "$D/huggingface/hub" "$HOME/.cache/huggingface/hub"; do
  [ -d "$c" ] && du -sh "$c"/models--* 2>/dev/null | sort -rh | sed "s#$c/models--##; s#--#/#g"
done
find "$D" -maxdepth 4 \( -name "*.safetensors" -o -name "*.gguf" -o -name "*.bin" -o -name "*.pt" -o -name "*.ckpt" \) -size +1G 2>/dev/null \
  | grep -v "/hub/models--" | xargs -r du -sh 2>/dev/null | sort -rh | head -15
echo
echo "== videos"
find "$D" -maxdepth 4 -name "*.mp4" 2>/dev/null | awk -F/ '{OFS="/"; $NF=""; print}' | sort | uniq -c | sort -rn | head -10
echo
echo "== python environments (venvs, conda)"
find "$D" -maxdepth 3 -name "pyvenv.cfg" 2>/dev/null | xargs -r -n1 dirname | xargs -r du -sh 2>/dev/null
[ -d "$D/miniconda3" ] && du -sh "$D/miniconda3"
echo
echo "== largest single files"
find "$D" -type f -size +2G 2>/dev/null | xargs -r du -sh 2>/dev/null | sort -rh | head -15
echo
echo "Needs for the vision lab: model A (Qwen3.8-27B) ~56 GB, venv ~18 GB, Whisper ~3 GB, 100 videos at 480p ~4 GB,"
echo "prepared stills and clips ~4 GB (all estimates). The optional ears model (Qwen3-Omni) needs ~70 GB more."
