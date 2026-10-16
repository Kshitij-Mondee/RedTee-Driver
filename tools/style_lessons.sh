#!/usr/bin/env bash
# The four style test lessons (2026-10-16). Kshitij: "render a video for each of these styles. All videos should be
# around 3 minutes. I want the entire pipelines to run"; topics chosen by him from the suggestions; the preset
# opus-plan-sol-code ("use gpt sol for writing visual code. Sonnet for rest and opus for storyboarding and planning").
# Operator only while they run: no engine or prompt edits until all four finish.
#
#   bash tools/style_lessons.sh          (starts or resumes all four, side by side; writes docs/research/2026-10-16-style-lessons/)
set -u
cd "$(dirname "$0")/.."
OUT=docs/research/2026-10-16-style-lessons
WHO="agent, unattended per Kshitij (style test lessons, 2026-10-16)"
mkdir -p "$OUT"
py tools/engine_hash.py > "$OUT/engine_fingerprint_at_launch.json" 2>/dev/null
for id in st-bp-cooling st-holo-ai st-sc-2fa st-iso-order; do
  if [ -s "$OUT/run-$id.out" ]; then verb="resume"; else verb="run --runner loom --mode api --preset opus-plan-sol-code"; fi
  ( py -m loom shuttle $verb "$id" --budget 30 --approve-as "$WHO" >> "$OUT/run-$id.out" 2>&1
    echo "exit $? at $(date +%H:%M:%S)" >> "$OUT/run-$id.out" ) &
done
wait
for id in st-bp-cooling st-holo-ai st-sc-2fa st-iso-order; do echo "$id: $(tail -1 $OUT/run-$id.out)"; done | tee "$OUT/ALL_DONE"
