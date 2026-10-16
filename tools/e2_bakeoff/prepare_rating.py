"""E2: render the bake-off frames and write the blind rating set (docs/research/golden/sets/e2/set.json).

    py tools/e2_bakeoff/prepare_rating.py          # renders e2_a, e2_b, e2_d, and e2_c when its layers exist
    py -m loom golden build --set e2               # normalise the frames exactly like E1 (640x360, one h264 pass, top 86 %)
    py -m loom golden serve --set e2               # rate them blind (about 3 minutes); ratings stay in sets/e2/ratings
    py -m loom golden report --set e2

Three frames per variant (the wide, the two-shot with the report moving, the push on Dev leaning in), plus six E1
frames as anchors so the scale means the same as on 2026-10-03 (four studio frames with people in rooms, one rejected
Loom office, one Loom UI frame). The page shows only opaque ids. Do not look at the strips before rating.
"""
from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
from loom import lab  # noqa: E402
from loom.util import read_json, write_json  # noqa: E402

SET = ROOT / "docs" / "research" / "golden" / "sets" / "e2"
FRAMES = SET / "frames"
TIMES = {"02.50": "wide", "06.00": "two_shot", "14.00": "lean_push"}
ANCHORS = ["ref_kurz_office_three", "ref_crayon_meeting", "ref_teded_greek_town", "ref_kurz_desk_papers",
           "rej_feed_office_stand", "new_phish_b19_close"]


def main() -> int:
    variants = ["a", "b", "d"] + (["c"] if all((ROOT / "assets/vendor/e2gen" / f"{n}.png").exists() for n in ("room", "priya", "dev", "desk", "report")) else [])
    if "c" not in variants:
        print("e2_c skipped: its layers are not generated yet (py tools/e2_bakeoff/generate.py)")
    tmp = SET / "_frames_tmp"
    shutil.rmtree(tmp, ignore_errors=True)
    FRAMES.mkdir(parents=True, exist_ok=True)
    items = []
    for v in variants:
        r = lab.strip(f"e2_{v}", "corporate-clean", out_dir=SET / "strips", frames_dir=tmp)
        if r.get("errors"):
            print(f"e2_{v}: runtime errors {r['errors'][:3]}"); return 2
        for t, label in TIMES.items():
            src = tmp / f"e2_{v}__corporate-clean__{t}.png"
            dst = FRAMES / f"e2_{v}_{label}.png"
            shutil.copy2(src, dst)
            items.append({"key": f"e2_{v}_{label}", "class": f"e2_{v}", "src": f"engine:{dst.relative_to(ROOT).as_posix()}"})
    shutil.rmtree(tmp, ignore_errors=True)
    e1 = read_json(ROOT / "docs/research/golden/golden_set.json")
    by = {it["key"]: it for it in e1["items"]}
    for k in ANCHORS:
        it = dict(by[k]); it["class"] = "anchor_" + it.get("class", "")
        items.append(it)
    write_json(SET / "set.json", {"_about": "E2 bake-off (D-102): one corporate beat, same motion, four art sources; six E1 frames as anchors",
                                  "version": 1, "seed": 202, "repeats": 3, "frame": e1["frame"], "roots": e1["roots"], "items": items})
    print(f"{len(items)} frames in {SET / 'set.json'} ({len(variants)} variants x 3 + {len(ANCHORS)} anchors)")
    print("next: py -m loom golden build --set e2   then   py -m loom golden serve --set e2")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
