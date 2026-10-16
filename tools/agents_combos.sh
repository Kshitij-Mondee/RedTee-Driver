#!/usr/bin/env bash
# One video per model combination, through the API agents (D-115), outside Cowork. Run from the Video-Engine folder
# in Git Bash on the PC (it needs the keys in .env, Kokoro, ffmpeg and Chromium):
#   bash tools/agents_combos.sh                     # all four two-key combinations
#   bash tools/agents_combos.sh openai-balanced     # just one
# Each combination gets its own project (combo-<profile>), the same topic and style, and its own USD cap. The
# knowledge sheet is approved unattended in YOUR name so the run can reach the render: read
# projects/combo-<profile>/plan/knowledge.json before you share any of these videos.
# Exit codes per run: 0 rendered, 2 a gate failed after repairs, 3 waiting at a human gate, 4 budget stop.
set -u
PY=${PY:-py}
TOPIC=${TOPIC:-"How to end a meeting with clear decisions, owners and dates"}
AUDIENCE=${AUDIENCE:-"corporate employees who run or attend team meetings"}
STYLE=${STYLE:-corporate-clean}
LENGTH=${LENGTH:-2}
BUDGET=${BUDGET:-9}          # USD cap per video (an estimate of $4 to $9 for a 2-minute lesson; no real run yet)
PROFILES=${*:-"claude-balanced openai-balanced claude-openai-value two-key-budget"}
APPROVER=${APPROVER:-"Kshitij, unattended combo run"}

$PY -m loom agents doctor --profiles "$(echo $PROFILES | tr ' ' ',')" || { echo "doctor failed: fix the model ids first"; exit 1; }
for P in $PROFILES; do
  ID="combo-$P"
  echo; echo "=== $P -> projects/$ID"
  [ -d "projects/$ID" ] || $PY -m loom new "$ID" --topic "$TOPIC" --audience "$AUDIENCE" --genre explainer --length "$LENGTH" --style "$STYLE" --persona analyst --avatar none --mix cinema
  $PY -m loom agents run "$ID" --profile "$P" --until render --budget "$BUDGET" --approve-knowledge-as "$APPROVER"
  echo "exit $? for $P"
  $PY -m loom agents report "$ID"
done
echo; echo "Videos: projects/combo-*/renders/*.mp4   Costs: py -m loom agents report combo-<profile>"
