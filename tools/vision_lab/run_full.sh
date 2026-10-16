#!/usr/bin/env bash
# The whole study, unattended, after `prepare` has finished for every selected film (D-113).
#   bash run_full.sh            # starts the server if needed, then every model step, ONE AT A TIME, then packs
# Safe to re-run: every step skips work that is already on disk. Log: /workspace/vision_lab_work/run_full.log
# Steps: server -> selftest -> preflight -> remeasure -> shots -> videos -> calibrate (plant, judge-planted,
#        consistency, report) -> receipts -> validate -> distill-prep -> pack (bundle + raw zip)
# Not here, on purpose:
#   - synthesize: the style guide is distilled OFF the pod from the bundle (D-110; L-209, L-210). Set SYNTH_ON_POD=1
#     to run it here anyway, after everything else, alone on the server.
#   - crossmodel: needs model B, which does not fit beside A.
# Every step runs to the end even if an earlier one failed; the summary at the end lists each step's result and the
# script exits 1 when any step failed. Never start a second heavy step by hand while this runs: the phase lock refuses
# it (L-213).
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
WORK=/workspace/vision_lab_work
LOG=$WORK/run_full.log
mkdir -p "$WORK"
source /root/venv/env.sh
cd "$HERE"
say() { echo "$(date +%H:%M:%S) $*" | tee -a "$LOG"; }
declare -a SUMMARY=()
FAILED=0
step() {
  say "== $*"
  local t0=$SECONDS
  "$@" 2>&1 | tee -a "$LOG"; local rc=${PIPESTATUS[0]}
  local dt=$(( SECONDS - t0 ))
  say "== exit $rc after $(( dt / 60 )) min: $*"
  SUMMARY+=("$(printf '%-44s exit %s  %4d min' "$*" "$rc" $(( dt / 60 )))")
  [ "$rc" = "0" ] || FAILED=1
  return $rc
}

# 1. every film must be prepared first (Whisper uses the GPU; prepare runs with the server stopped)
missing=$(python -c "
import json,os
s=json.load(open('$WORK/selection.json'))['videos']
print(sum(1 for v in s if not os.path.exists(f'$WORK/prep/{v[\"id\"]}/measure.json')))")
if [ "$missing" != "0" ]; then
  say "STOP: $missing selected films are not prepared. Run: pkill -f 'vllm serve'; python vl.py prepare --workers 3"
  exit 2
fi

# 2. the server (started here if it is not answering)
KEY="${VLLM_API_KEY:-EMPTY}"
up() { curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $KEY" http://127.0.0.1:8000/v1/models | grep -q 200; }
if ! up; then
  say "starting the server"
  bash serve.sh qwen38-27b-fp8 | tee -a "$LOG"
  for i in $(seq 1 90); do up && break; sleep 10; done
  up || { say "STOP: the server did not come up in 15 minutes; see $WORK/server.log"; exit 3; }
fi
say "server up"
grep -o "GPU KV cache size: [0-9,]* tokens" "$WORK/server.log" 2>/dev/null | tail -1 | tee -a "$LOG"

step python vl.py selftest || { say "STOP: selftest failed"; exit 4; }
step python vl.py preflight || { say "STOP: preflight found problems (see above); fix them before spending pod time"; exit 5; }
step python vl.py remeasure
step python vl.py shots
step python vl.py videos
step python vl.py calibrate plant
step python vl.py calibrate judge-planted
step python vl.py calibrate consistency
step python vl.py calibrate report
if [ "${SYNTH_ON_POD:-0}" = "1" ]; then step python vl.py synthesize; fi
step python vl.py receipts
step python vl.py validate
step python vl.py distill-prep
step python vl.py pack --force

say "SUMMARY"
for s in "${SUMMARY[@]}"; do say "  $s"; done
say "DONE. Bundle: $(ls -1 $WORK/bundle_*.zip 2>/dev/null | tail -1)  Raw (local only): $(ls -1 $WORK/raw_*.zip 2>/dev/null | tail -1)"
[ "$FAILED" = "0" ] && say "ALL STEPS OK" || say "SOME STEPS FAILED: see the summary; re-running this script resumes them"
exit $FAILED
