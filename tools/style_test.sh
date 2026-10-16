#!/usr/bin/env bash
# D-167, D-168: the five-style test (docs/research/2026-10-13-stable-styles.md), resumed 2026-10-14 after the session that
# ran it ended (L-435: two planning sessions had crashed on report_finding; fixed). Kshitij, 2026-10-13: "Make of a video for
# each style using each model ... 1.5-2 minutes each and do the entire videos. Planning opus 5.5, sonnet 5.5 manager and the
# above three models doing the scene writing"; 2026-10-14: "add qwen 3.8 max as one of the models for it alongside sonnet,
# sol and terra."
# Phase A: the plans not yet at P8 resume (accepted phases are never redone).
# Phase B: per style, the plan cloned four times (py -m loom slice, every beat) and the four clones run side by side to the
# final render: Sonnet leads; the scene authors, clip authors and fixers are Sonnet, gpt-6.1-sol, gpt-5.6-terra or qwen3.8-max.
# Caps per lesson: Sonnet $16, Sol $9, Terra $10, Qwen $9. A clone that already exists is resumed, not cloned again.
set -u
cd "$(dirname "$0")/.."
WHO="agent, unattended per Kshitij (five-style test, D-167)"
STYLES="whiteboard line-art story-cartoon corporate-clean cinematic-noir"
OUT=docs/research/style_test
mkdir -p "$OUT"
stamp() { date +%H:%M:%S; }
cur_of() { py -m loom shuttle status "$1" 2>/dev/null | head -1 | sed -n 's/.*current \(P[0-9]*\).*/\1/p'; }

echo "== phase A: the plans not at P8 resume, in parallel, $(stamp)"
for s in $STYLES; do
  c=$(cur_of "style-$s")
  if [ "$c" = "P8" ]; then echo "plan $s already at P8"; continue; fi
  b=8; [ "$s" = "story-cartoon" ] && b=12; [ "$s" = "corporate-clean" ] && b=10
  ( py -m loom shuttle resume "style-$s" --budget "$b" --until P7 >> "$OUT/plan-$s.out" 2>&1
    echo "plan $s resume exit $? at $(stamp)" >> "$OUT/plan-$s.out" ) &
done
wait
for s in $STYLES; do echo "plan $s: $(cur_of style-$s)"; done

qwen_ok() { py -c "
from loom.agents.llm import registry as R
from loom.agents.llm.base import has_key
import sys
if not has_key('qwen'): sys.exit('no DASHSCOPE_API_KEY')
ids=R.PROVIDERS['qwen']().list_models()
sys.exit(0 if 'qwen3.8-max' in ids else 'qwen3.8-max not served: ' + ', '.join(sorted(i for i in ids if 'max' in i))[:300])
"; }

echo "== phase B: scenes per style, four models side by side, $(stamp)"
for s in $STYLES; do
  if [ "$(cur_of style-$s)" != "P8" ]; then echo "== style-$s is not at P8: its runs are skipped"; continue; fi
  last=$(py -c "import json;print(json.load(open('projects/style-$s/plan/script.json',encoding='utf-8'))['beats'][-1]['id'])")
  arms="sonnet:scenes-sonnet:16 sol:scenes-gpt-6.1-sol:9 terra:scenes-gpt-5.6-terra:10"
  if qwen_ok > "$OUT/qwen-check-$s.out" 2>&1; then arms="$arms qwen:scenes-qwen3.8-max:9"
  else echo "== style-$s: the Qwen arm is skipped: $(tail -1 $OUT/qwen-check-$s.out)"; fi
  echo "== style-$s: b01-$last, arms [$arms] from $(stamp)"
  for a in $arms; do
    m=${a%%:*}; rest=${a#*:}; preset=${rest%%:*}; cap=${rest#*:}
    id="style-$s-$m"
    if [ ! -d "projects/$id" ]; then
      py -m loom slice "style-$s" "$id" --beats "b01-$last" --by "$WHO" > "$OUT/slice-$s-$m.out" 2>&1 || echo "slice $s $m failed"
      verb="run --runner loom --mode api --preset $preset"
    else
      verb="resume"
    fi
    ( py -m loom shuttle $verb "$id" --budget "$cap" --approve-as "$WHO" >> "$OUT/run-$s-$m.out" 2>&1
      echo "run $s $m exit $? at $(stamp)" >> "$OUT/run-$s-$m.out" ) &
  done
  wait
  for a in $arms; do m=${a%%:*}; tail -1 "$OUT/run-$s-$m.out"; done
done
echo "== all done $(stamp)" | tee "$OUT/ALL_DONE"
