#!/usr/bin/env bash
# D-168: the five-style test's Qwen arms (docs/prompts/2026-10-14-kiro-style-test-qwen.md). The Sonnet, Sol and Terra arms
# finished on 2026-10-14 (tools/style_test.sh); every Qwen call was refused (HTTP 403, free quota exhausted, free-tier-only
# mode, L-438). The five Qwen clones (projects/style-<style>-qwen) are exact clones of each style's plan, at P8, and
# `shuttle resume` keeps their preset (scenes-qwen3.8-max: Sonnet leads, qwen3.8-max writes scenes, clips and fixes) and
# their $9 cap. Nothing is cloned or planned again.
# Usage, only after Kshitij has fixed the Alibaba billing and approved the run:
#   bash tools/style_test_qwen.sh preflight     free checks plus ONE tiny paid Qwen call (well under $0.01)
#   bash tools/style_test_qwen.sh run           the five resumes, in two waves (3 then 2), to the final render
#   bash tools/style_test_qwen.sh blind         four-way blind sets per style (Sonnet, Sol, Terra, Qwen), new shuffle
set -u
cd "$(dirname "$0")/.."
OUT=docs/research/style_test
STYLES="whiteboard line-art story-cartoon corporate-clean cinematic-noir"
stamp() { date +%H:%M:%S; }

preflight() {
  py -c "
from loom.agents.llm.base import has_key
import sys
sys.exit(0 if has_key('qwen') else 'no DASHSCOPE_API_KEY in .env: Kshitij adds it himself')" || return 1
  py -c "
from loom.agents.llm import registry as R
import sys
ids = R.PROVIDERS['qwen']().list_models()
sys.exit(0 if 'qwen3.8-max' in ids else 'qwen3.8-max not served by this key')" || return 1
  # the one paid call: a few tokens, so a refused account stops here and not inside five runs
  py -c "
from loom.agents.llm import registry as R
from loom.agents.llm.types import Request, Message
r = R.PROVIDERS['qwen']().complete(Request(model='qwen3.8-max', system=['Answer with one word.'], messages=[Message('user', 'Say ready.')], max_tokens=16, cache=False))
print('qwen answered:', repr(r.text[:40]), r.usage)" || { echo "the Qwen account still refuses: stop and tell Kshitij"; return 1; }
  for s in $STYLES; do
    c=$(py -m loom shuttle status "style-$s-qwen" 2>/dev/null | head -1)
    echo "$c"
    case "$c" in *"current P8"*) ;; *) echo "style-$s-qwen is not at P8 as expected: stop and tell Kshitij"; return 1;; esac
  done
  py -m loom doctor > "$OUT/qwen-doctor.out" 2>&1 && echo "doctor ok" || { echo "py -m loom doctor failed: see $OUT/qwen-doctor.out"; return 1; }
  echo "preflight passed at $(stamp)"
}

fingerprint() {
  py - "$1" <<'X'
import hashlib, json, glob, datetime, sys
files = []
for pat in ["loom/**/*.py", "loom/**/*.json", "loom/**/*.md", "runtime/**/*.js", "tools/node/*.mjs", "packs/styles/*.json",
            "shuttle/agents/*.md", "skills/loom/shuttle-director/SKILL.md"]:
    files += glob.glob(pat, recursive=True)
fp = {f.replace("\\", "/"): hashlib.sha256(open(f, "rb").read()).hexdigest()[:16] for f in sorted(set(files)) if "__pycache__" not in f}
json.dump({"at": datetime.datetime.now().isoformat(timespec="seconds"), "files": fp}, open(sys.argv[1], "w"), indent=0)
X
}

arm() {   # one Qwen clone to its final render; its exit code goes to the end of its own .out
  s=$1
  ( py -m loom shuttle resume "style-$s-qwen" >> "$OUT/run-$s-qwen.out" 2>&1
    echo "run $s qwen exit $? at $(stamp)" >> "$OUT/run-$s-qwen.out" ) &
}

run() {
  fingerprint "$OUT/engine_fingerprint_qwen.json"
  echo "== qwen wave 1 (whiteboard, line-art, story-cartoon) from $(stamp)"
  for s in whiteboard line-art story-cartoon; do echo "== resume $s qwen at $(stamp)" >> "$OUT/run-$s-qwen.out"; arm "$s"; done
  wait
  echo "== qwen wave 2 (corporate-clean, cinematic-noir) from $(stamp)"
  for s in corporate-clean cinematic-noir; do echo "== resume $s qwen at $(stamp)" >> "$OUT/run-$s-qwen.out"; arm "$s"; done
  wait
  for s in $STYLES; do tail -1 "$OUT/run-$s-qwen.out"; done
  echo "== qwen done $(stamp)" | tee "$OUT/QWEN_DONE"
}

blind() {   # per style: the four finished films, shuffled with a new seed, a key, and phone copies made the same way for all four
  for s in $STYLES; do
    f="projects/style-$s-qwen/renders/style-$s-qwen.mp4"
    if [ ! -f "$f" ]; then echo "style-$s: no Qwen render, its blind set is not made"; continue; fi
    d="$OUT/blind4/$s"; mkdir -p "$d/phone"
    py - "$s" "$d" <<'X'
import json, random, shutil, sys
s, d = sys.argv[1], sys.argv[2]
arms = ["sonnet", "sol", "terra", "qwen"]
random.Random(f"blind4-{s}-2026-10-14").shuffle(arms)
key = {}
for letter, m in zip("ABCD", arms):
    shutil.copyfile(f"projects/style-{s}-{m}/renders/style-{s}-{m}.mp4", f"{d}/{letter}.mp4")
    key[letter] = f"style-{s}-{m}"
key["note"] = "open only after rating A to D"
json.dump(key, open(f"{d}/../{s}_KEY_open_after_rating.json", "w"), indent=1)
X
    for x in A B C D; do
      ffmpeg -y -loglevel error -i "$d/$x.mp4" -c:v libx264 -preset medium -crf 26 -vf "scale=1280:-2" -c:a aac -b:a 128k "$d/phone/$x.mp4"
    done
    # a frame sheet of the Qwen film, one frame every 8 s, for the frame read (the frames win over the critic's numbers)
    ffmpeg -y -loglevel error -i "$f" -vf "fps=1/8,scale=480:-2,tile=4x5" -frames:v 1 "$OUT/sheet_${s}_qwen.jpg"
    echo "style-$s: blind set in $d"
  done
}

case "${1:-}" in
  preflight) preflight ;;
  run) run ;;
  blind) blind ;;
  *) echo "usage: bash tools/style_test_qwen.sh preflight|run|blind"; exit 1 ;;
esac
