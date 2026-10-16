"""Motion per beat: share of frames (10 fps, grey 192x108, caption band cropped) where the picture changes by more than
a threshold from the previous frame; the longest still run in each beat. Usage: motion_scan.py <project dir>..."""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

for arg in sys.argv[1:]:
    P = Path(arg)
    mp4 = P / "renders" / f"{P.name}.mp4"
    W, H, FPS = 192, 108, 10
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(mp4), "-vf", f"fps={FPS},scale={W}:{H},format=gray", "-f", "rawvideo", "-"],
                         capture_output=True, check=True).stdout
    fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W)[:, : int(H * 0.87), :].astype(np.int16)
    d = np.concatenate([[0], (np.abs(np.diff(fr, axis=0)) > 6).reshape(len(fr) - 1, -1).mean(axis=1) * 100])
    moving = d > 0.05
    man = json.loads((P / "build/manifest.json").read_text(encoding="utf-8"))
    kinds = {s["beat"]: (s["kind"] + (" " + s["template"] if s.get("template") else "")) for s in man["scenes"]}
    tot_still = 0
    print(f"== {P.name}: moving {moving.mean():.0%} of frames; still runs of 4 s or more:")
    longest = []
    for b in man["beats"]:
        a, z = int(b["start"] * FPS), int(b["end"] * FPS)
        mv = moving[a:z]
        run, best, best_at = 0, 0, a
        for k, m in enumerate(mv):
            run = 0 if m else run + 1
            if run > best:
                best, best_at = run, a + k - run + 1
        longest.append((b["id"], kinds.get(b["id"], ""), round(float(mv.mean()) * 100), best / FPS, best_at / FPS, b["end"] - b["start"]))
    for bid, k, pct, best, at, dur in longest:
        flag = "  <-- " if best >= 4 else ""
        print(f"  {bid} {k:24s} {dur:5.1f} s  moving {pct:3d} %  longest still {best:4.1f} s from {at:6.1f}{flag}")
    s = sum(x[3] for x in longest if x[3] >= 4)
    print(f"  still runs >= 4 s add up to {s:.1f} s of {len(fr) / FPS:.1f} s")
