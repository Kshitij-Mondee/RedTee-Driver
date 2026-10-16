"""One frame every N seconds of a rendered lesson, labelled with its beat, tiled for a person (or an agent) to LOOK at.

    py tools/frame_review.py <project id> [--mp4 <path>] [--every 2] [--cols 4] [--rows 4]

Writes projects/<id>/qa/frames_2s/<t>.png (full size, from the MP4) and qa/frames_2s/sheet_NN.jpg (cols x rows tiles,
each labelled "<beat> <t>s"), and prints the sheets with the beats each covers. Used for the post-fix proof
(2026-10-07): every beat of a rendered fork is looked at and written up in qa/post_fix_review.md.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))


def beat_at(beats: list[dict], t: float) -> str:
    for b in beats:
        if b["start"] <= t < b["end"]:
            return b["id"]
    return beats[-1]["id"] if beats else "?"


def extract(mp4: Path, out: Path, every: float) -> None:
    """One frame every `every` seconds: output frame i is the video at i x every seconds. `round=up` matters: with the
    fps filter's default rounding each output frame is the LAST input frame of its slot, so the tile labelled 90.0 s
    showed 91.0 s and a frame near a cut was given to the wrong beat (claude fork b11 and b12, 2026-10-08)."""
    subprocess.run(["ffmpeg", "-v", "error", "-i", str(mp4), "-vf", f"fps=1/{every}:round=up", str(out / "f%05d.png")], check=True)


def main(argv=None) -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("id")
    ap.add_argument("--mp4")
    ap.add_argument("--every", type=float, default=2.0)
    ap.add_argument("--cols", type=int, default=4)
    ap.add_argument("--rows", type=int, default=4)
    a = ap.parse_args(argv)
    from PIL import Image, ImageDraw
    from loom.project import Project
    from loom.util import read_json
    p = Project.open(a.id)
    mp4 = Path(a.mp4) if a.mp4 else max(p.path("renders").glob("*.mp4"), key=lambda f: f.stat().st_mtime)
    out = p.path("qa/frames_2s")
    out.mkdir(parents=True, exist_ok=True)
    for f in out.glob("*"):
        f.unlink()
    extract(mp4, out, a.every)
    beats = (read_json(p.path("audio/timings.json"), {}) or {}).get("beats") or []
    frames = sorted(out.glob("f*.png"))
    labelled = []
    for i, f in enumerate(frames):
        t = round(i * a.every, 1)                  # the fps filter's output frame i stands at i x every seconds
        labelled.append((t, beat_at(beats, t), f))
    n = a.cols * a.rows
    tw, th = 480, 270
    sheets = []
    for k in range(0, len(labelled), n):
        part = labelled[k:k + n]
        sheet = Image.new("RGB", (a.cols * (tw + 6) + 6, ((len(part) + a.cols - 1) // a.cols) * (th + 30) + 6), (17, 17, 17))
        d = ImageDraw.Draw(sheet)
        for j, (t, b, f) in enumerate(part):
            x, y = 6 + (j % a.cols) * (tw + 6), 6 + (j // a.cols) * (th + 30)
            sheet.paste(Image.open(f).convert("RGB").resize((tw, th)), (x, y + 24))
            d.text((x + 4, y + 4), f"{b}  {t:.1f}s", fill=(250, 210, 120))
        name = out / f"sheet_{k // n + 1:02d}.jpg"
        sheet.save(name, quality=85)
        sheets.append({"sheet": str(name.relative_to(ROOT)), "from": part[0][0], "to": part[-1][0],
                       "beats": sorted({b for _, b, _ in part}, key=lambda s: (len(s), s))})
    print(json.dumps({"mp4": str(mp4), "frames": len(frames), "sheets": sheets}, indent=1))
    return 0


if __name__ == "__main__":
    sys.exit(main())
