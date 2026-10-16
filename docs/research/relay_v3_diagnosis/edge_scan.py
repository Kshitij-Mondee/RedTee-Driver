"""Edge density per frame (share of pixels with a strong local gradient: text, outlines, fills' edges; the vignette and
paper grain stay under it), 10 fps at 384x216 grey, the caption band (bottom 13 %) cropped. Prints stretches under a
threshold (default 0.5 %) and a per-second strip. Usage: edge_scan.py <project dir> [threshold %]"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

P = Path(sys.argv[1])
TH = float(sys.argv[2]) if len(sys.argv) > 2 else 0.5
mp4 = P / "renders" / f"{P.name}.mp4"
W, H, FPS = 384, 216, 10
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(mp4), "-vf", f"fps={FPS},scale={W}:{H},format=gray", "-f", "rawvideo", "-"],
                     capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W)[:, : int(H * 0.87), :].astype(np.int16)
gx = np.abs(np.diff(fr, axis=2))[:, :-1, :]
gy = np.abs(np.diff(fr, axis=1))[:, :, :-1]
edge = ((gx + gy) > 40).reshape(len(fr), -1).mean(axis=1) * 100
np.save(P.parent / f"_edge_{P.name}.npy", edge)
man = json.loads((P / "build/manifest.json").read_text(encoding="utf-8"))


def beat(t):
    for b in man["beats"]:
        if b["start"] - 1e-6 <= t < b["end"]:
            return b["id"]
    return "end"


i, out = 0, []
while i < len(edge):
    if edge[i] < TH:
        j = i
        while j + 1 < len(edge) and edge[j + 1] < TH:
            j += 1
        out.append((i / FPS, (j + 1) / FPS, float(edge[i:j + 1].min())))
        i = j + 1
    else:
        i += 1
print(f"{P.name}: median edge {np.median(edge):.2f} %, stretches under {TH} %: {len(out)}, {sum(b - a for a, b, _ in out):.1f} s")
for a, b, m in out:
    print(f"  {a:6.1f}-{b:6.1f} ({b - a:.1f} s) min {m:.2f} %  {beat(a)}->{beat(b - 0.05)}")
