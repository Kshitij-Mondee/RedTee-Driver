#!/usr/bin/env bash
# D-179: the whiteboard engine with/without comparison, end to end, from the designed hand's zip.
# Kshitij, 2026-10-15: "Build a pilot engine for whiteboard and run the with/without comparison on one new lesson";
# "give me the entire command that I need to run in bash terminal".
#
#   bash tools/wb_engine_ab.sh                (the hand already installed: Kshitij's PNG, tools/hand_from_png.py)
#   bash tools/wb_engine_ab.sh <hand zip>     (a Claude Design hand instead, through tools/asset_intake.py)
#
# 1. brings the hand in through tools/asset_intake.py (a clean intake is the gate) and installs write, write_lifted and
#    rest into assets/engines/whiteboard/hand/;
# 2. renders the engine's lab strip with the hand (docs/styles/demos/lab/wb_engine_handover__whiteboard.jpg) to look at;
# 3. waits for the shared plan of wb-prioritise to reach P8 (resumes it if its run stopped);
# 4. clones the plan twice: wb-prioritise-engine (engine on) and wb-prioritise-classic (engine off);
# 5. runs both to the final render side by side, same scene writer (Terra), same cap ($10 each), on the API;
# 6. writes the comparison (cost, time, looks, checks), film measures, and a blind pair with a sealed key.
# Everything goes to docs/research/wb_engine_ab/. Operator only: change nothing in the engine while it runs.
set -u
cd "$(dirname "$0")/.."
ZIP="${1:-}"
OUT=docs/research/wb_engine_ab
WHO="agent, unattended per Kshitij (whiteboard engine comparison, D-179)"
SRC=wb-prioritise
stamp() { date +%H:%M:%S; }
cur_of() { py -m loom shuttle status "$1" 2>/dev/null | head -1 | sed -n 's/.*current \(P[0-9]*\).*/\1/p'; }
mkdir -p "$OUT"

# ---- 1. the hand: Kshitij's PNG is already installed (tools/hand_from_png.py, 2026-10-15); a Claude Design zip, if
# given, replaces it through the intake
if [ -n "$ZIP" ]; then
  [ -e "$ZIP" ] || { echo "no such file: $ZIP"; exit 2; }
  echo "== 1. intake of the hand ($(stamp))"
  py tools/asset_intake.py "$ZIP" --batch wb-hand-v1 | tee "$OUT/hand_intake.out"
  if [ "${PIPESTATUS[0]}" != "0" ]; then
    echo "!! the hand did not pass the intake (see assets/incoming/wb-hand-v1/INTAKE.md). Fix it in Claude Design and run again."
    exit 1
  fi
  mkdir -p assets/engines/whiteboard/hand
  for pose in write write_lifted rest; do
    f=$(find assets/incoming/wb-hand-v1 -name "$pose.svg" | head -1)
    if [ -n "$f" ]; then cp "$f" "assets/engines/whiteboard/hand/$pose.svg"; echo "   installed $pose.svg"; fi
  done
fi
[ -f assets/engines/whiteboard/hand/write.svg ] || { echo "!! no hand in assets/engines/whiteboard/hand (run tools/hand_from_png.py or give the zip)"; exit 1; }
echo "== 1. the hand: assets/engines/whiteboard/hand/write.svg"

# ---- 2. look at it
echo "== 2. the engine's lab strip with the hand ($(stamp))"
py -m loom lab wb_engine_handover --style whiteboard
echo "   look at docs/styles/demos/lab/wb_engine_handover__whiteboard.jpg (Ctrl+C now to stop before the paid runs)"
sleep 20

# ---- 3. the shared plan at P8
echo "== 3. the shared plan ($(stamp)): $(cur_of $SRC)"
if [ "$(cur_of $SRC)" != "P8" ]; then
  # a run may still be going (it writes plan.out); wait while it changes, then resume if it stopped short of P8
  while [ "$(cur_of $SRC)" != "P8" ] && [ -f "$OUT/plan.out" ] && [ $(( $(date +%s) - $(stat -c %Y "$OUT/plan.out") )) -lt 1200 ] && ! grep -q "^exit" "$OUT/plan.out"; do
    echo "   plan at $(cur_of $SRC), still running ($(stamp))"; sleep 60
  done
  if [ "$(cur_of $SRC)" != "P8" ]; then
    echo "   resuming the plan to P7 ($(stamp))"
    py -m loom shuttle resume $SRC --budget 8 --until P7 --approve-as "$WHO" >> "$OUT/plan.out" 2>&1
  fi
fi
if [ "$(cur_of $SRC)" != "P8" ]; then echo "!! the plan is at $(cur_of $SRC), not P8: see $OUT/plan.out"; exit 1; fi

# ---- 4. two clones of the plan
last=$(py -c "import json;print(json.load(open('projects/$SRC/plan/script.json',encoding='utf-8'))['beats'][-1]['id'])")
for arm in engine classic; do
  id="$SRC-$arm"
  if [ ! -d "projects/$id" ]; then
    py -m loom slice $SRC "$id" --beats "b01-$last" --by "$WHO" > "$OUT/slice-$arm.out" 2>&1 || { echo "!! slice $arm failed"; exit 1; }
  fi
  py - "$id" "$arm" <<'PY'
import json, sys
p = f"projects/{sys.argv[1]}/project.json"
d = json.load(open(p, encoding="utf-8"))
d["request"]["engine"] = "on" if sys.argv[2] == "engine" else "off"
json.dump(d, open(p, "w", encoding="utf-8"), indent=2, ensure_ascii=False)
print(f"   {sys.argv[1]}: engine {d['request']['engine']}")
PY
done
py tools/engine_hash.py > "$OUT/engine_fingerprint_phase_b.json" 2>/dev/null

# ---- 5. both arms to the final render, side by side
echo "== 5. both arms ($(stamp)): Terra writes the scenes, Sonnet leads, cap \$10 each"
for arm in engine classic; do
  id="$SRC-$arm"
  # a clone this script already started is resumed (accepted phases are never redone); a fresh one is run
  if [ -s "$OUT/run-$arm.out" ]; then verb="resume"; else verb="run --runner loom --mode api --preset scenes-gpt-5.6-terra"; fi
  ( py -m loom shuttle $verb "$id" --budget 10 --approve-as "$WHO" >> "$OUT/run-$arm.out" 2>&1
    echo "exit $? at $(stamp)" >> "$OUT/run-$arm.out" ) &
done
wait
for arm in engine classic; do echo "   $arm: $(tail -1 $OUT/run-$arm.out)"; done

# ---- 6. the comparison
echo "== 6. comparison ($(stamp))"
py tools/run_compare.py $SRC-engine $SRC-classic --md "$OUT/compare.md" > "$OUT/compare.out" 2>&1; tail -20 "$OUT/compare.out"
mkdir -p cache/research/wb_engine_ab/films
for arm in engine classic; do cp "projects/$SRC-$arm/renders/$SRC-$arm.mp4" cache/research/wb_engine_ab/films/ 2>/dev/null; done
py tools/video_study.py cache/research/wb_engine_ab/films --out "$OUT/study" --sheet-every 4 > "$OUT/study.out" 2>&1
py - "$OUT" "$SRC" <<'PY'
import json, random, shutil, sys
from pathlib import Path
out, src = Path(sys.argv[1]), sys.argv[2]
films = {a: Path(f"projects/{src}-{a}/renders/{src}-{a}.mp4") for a in ("engine", "classic")}
missing = [a for a, f in films.items() if not f.exists()]
if missing:
    print("!! no final render for:", missing); sys.exit(1)
order = ["engine", "classic"]; random.shuffle(order)
b = out / "blind"; b.mkdir(exist_ok=True)
key = {}
for letter, arm in zip("AB", order):
    shutil.copy2(films[arm], b / f"{letter}.mp4"); key[letter] = arm
json.dump(key, open(out / "blind_KEY_open_after_rating.json", "w"), indent=1)
print("blind pair ready:", b / "A.mp4", b / "B.mp4", "(key sealed in blind_KEY_open_after_rating.json)")
PY
echo "== done $(stamp). Rate A and B, then open the key; the numbers are in $OUT/compare.md and $OUT/study/." | tee "$OUT/ALL_DONE"
