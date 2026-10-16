"""Find blank stretches in a rendered lesson: frames where (almost) nothing but the paper field, or black, is on screen.
Each frame at 10 fps, grey 192x108; 'content' = share of pixels that differ from the frame's median by more than 14
levels (paper texture and vignette stay under it; text, outlines and fills are over it). Blank = content < 0.4 %,
black = median < 20. The caption pill is cropped off (bottom 13 %) so a caption alone does not count as content.
Prints each blank run with the beats and joins around it. Usage: blank_scan.py <project dir>"""
import json
import subprocess
import sys
from pathlib import Path

import numpy as np

P = Path(sys.argv[1])
mp4 = P / "renders" / f"{P.name}.mp4"
man = json.loads((P / "build/manifest.json").read_text(encoding="utf-8")) if (P / "build/manifest.json").exists() else None
W, H, FPS = 192, 108, 10
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(mp4), "-vf", f"fps={FPS},scale={W}:{H},format=gray", "-f", "rawvideo", "-"],
                     capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W)[:, : int(H * 0.87), :].astype(np.int16)
med = np.median(fr.reshape(len(fr), -1), axis=1)
content = (np.abs(fr - med[:, None, None]) > 14).reshape(len(fr), -1).mean(axis=1)
blank = content < 0.004
black = med < 20
runs, i = [], 0
while i < len(fr):
    if blank[i]:
        j = i
        while j + 1 < len(fr) and blank[j + 1]:
            j += 1
        runs.append((i / FPS, (j + 1) / FPS, "black" if black[i:j + 1].mean() > 0.5 else "paper"))
        i = j + 1
    else:
        i += 1


def where(t):
    if not man:
        return ""
    sc = {s["beat"]: s for s in man["scenes"]}
    for b in man["beats"]:
        if b["start"] - 1e-6 <= t < b["end"]:
            s = sc.get(b["id"], {})
            jw = s.get("join_window") or [0, 0]
            phase = ("in its join (" + str((s.get("join_in") or {}).get("type")) + f" {jw[0]:.2f}-{jw[1]:.2f})") if jw[0] <= t <= jw[1] and jw[1] > jw[0] else \
                    ("before its speech" if t < b["speech_start"] else "after its speech" if t > b["speech_end"] else "while speaking")
            return f"{b['id']} {s.get('kind')} {s.get('template') or ''} {phase} (beat {b['start']:.2f}-{b['end']:.2f}, speech {b['speech_start']:.2f}-{b['speech_end']:.2f})"
    return "after the last beat"


print(f"{mp4.name}: {len(fr) / FPS:.1f} s, {len(runs)} blank run(s), {sum(b - a for a, b, _ in runs):.1f} s blank in all")
for a, b, k in runs:
    print(f"  {a:6.1f} to {b:6.1f} s ({b - a:.1f} s) {k:5s} | starts in {where(a)}")
low = [(i / FPS, round(float(content[i]) * 100, 2)) for i in range(len(fr)) if 0.004 <= content[i] < float(sys.argv[2] if len(sys.argv) > 2 else 0.02)]
print(f"near-blank frames (0.4 to 2 % content): {len(low)}; first: {low[:12]}")
