#!/usr/bin/env bash
# The layout guard trial (D-169; Kshitij, 2026-10-16: "render a proper whiteboard style any corporate lesson on any tech
# topic. I want this to be the test for the Layout Guard Trial. Keep the opus storyboarding, sonnet everything else and
# gpt sol for coding, around 3-4 min video").
# One plan, two arms that differ only in the guard:
#   plan  lg-trial-share-links, P1 to P7 (Opus leads P5, Sonnet the rest, gpt-6.1-sol writes the kit)
#   arms  an exact clone each (py -m loom slice, every beat), P8 to P11 with the same preset:
#         lg-trial-share-links-off (guard off, as every lesson so far) and lg-trial-share-links-on (py -m loom layout on)
# Caps: plan $25, each arm $18. Accepted phases are never redone; a clone that exists is resumed.
set -u
cd "$(dirname "$0")/.."
WHO="agent, unattended per Kshitij (layout guard trial, D-169)"
PRESET=opus-storyboard-sol-code
ID=lg-trial-share-links
OUT=docs/research/layout_trial
mkdir -p "$OUT"
stamp() { date +%H:%M:%S; }
cur_of() { py -m loom shuttle status "$1" 2>/dev/null | head -1 | sed -n 's/.*current \(P[0-9]*\).*/\1/p'; }

echo "== plan $ID from $(stamp)"
if [ ! -d "projects/$ID" ]; then
  py -m loom new "$ID" --topic "Sharing files safely: who can open your link" --style whiteboard --length 3.5 \
    --audience "corporate employees" --isolated \
    --notes "A hand-drawn whiteboard explainer for working adults on sharing documents from cloud storage: what each link setting lets people do (anyone with the link, people in the company, named people), view versus edit, how a link forwarded once reaches people you never meant, and the few checks to make before sharing and when access is no longer needed. Practical, calm, no fear; one marker world, simple props and people as the narration needs them." \
    > "$OUT/new.out" 2>&1 || { echo "new failed: $(tail -3 $OUT/new.out)"; exit 1; }
  py -m loom shuttle run "$ID" --runner loom --mode api --preset "$PRESET" --until P7 --budget 25 --approve-as "$WHO" >> "$OUT/plan.out" 2>&1
else
  py -m loom shuttle resume "$ID" --until P7 --budget 25 >> "$OUT/plan.out" 2>&1
fi
echo "plan exit $? at $(stamp)" >> "$OUT/plan.out"
if [ "$(cur_of $ID)" != "P8" ]; then echo "== the plan is not at P8 ($(cur_of $ID)): the arms are not started"; tail -5 "$OUT/plan.out"; exit 2; fi
last=$(py -c "import json;print(json.load(open('projects/$ID/plan/script.json',encoding='utf-8'))['beats'][-1]['id'])")

echo "== arms from $(stamp) (b01-$last)"
for arm in off on; do
  A="$ID-$arm"
  if [ ! -d "projects/$A" ]; then
    py -m loom slice "$ID" "$A" --beats "b01-$last" --by "$WHO" > "$OUT/slice-$arm.out" 2>&1 || { echo "slice $arm failed"; continue; }
    [ "$arm" = "on" ] && py -m loom layout "$A" on >> "$OUT/slice-$arm.out" 2>&1
    verb="run --runner loom --mode api --preset $PRESET"
  else
    verb="resume"
  fi
  ( py -m loom shuttle $verb "$A" --budget 18 --approve-as "$WHO" >> "$OUT/run-$arm.out" 2>&1
    echo "run $arm exit $? at $(stamp)" >> "$OUT/run-$arm.out" ) &
done
wait
for arm in off on; do tail -1 "$OUT/run-$arm.out"; done
echo "== all done $(stamp)" | tee "$OUT/ALL_DONE"
