"""Measure what a visual style IS, the same way for a reference video and for a Loom render, so the two can be
compared with numbers instead of adjectives.

    py tools/style_fingerprint.py <video | folder of images | image> [...] [--every 4] [--json out.json] [--label name]

Every frame is reduced to 640 x 360 first (the size of the study copies), then measured:
  drawn      share of 16 x 16 blocks that hold at least one strong edge: how much of the frame has something
             drawn in it. Soft backgrounds (gradients, nebula, paper) do not count; objects and text do
  covered    share of the picture NOT in its single most common colour: how much of the frame is drawn on
             (an empty field with a small card scores low; a full scene or a full-bleed diagram scores high)
  outline    share of pixels that are dark strokes against lighter fills (cartoon outlines, ink lines)
  lightline  share of pixels that are light strokes against darker ground (chalk / math-on-black)
  edges      share of pixels on any strong edge (busy vs calm pictures)
  flat       share of pixels in perfectly flat fills (vector flat vs painted / photographic)
  soft       share of pixels in gentle gradients (soft shading, glows, vignettes)
  grain      texture inside near-flat areas (paper, noise, film grain; compression noise also counts)
  colours    how many colours cover 90% of the picture (after 4-bit quantising): palette economy
  sat        mean saturation of non-dark pixels;  vivid = share of strongly saturated pixels
  light      median lightness (0-255);  dark = share of near-black pixels
  sparse     share of frames that are one colour over 85% of the picture: narration and title cards, and
             also sparse boards (thin lines on black). Both are part of a style, so they are measured too
             (an earlier version skipped them and called 56% of a math video "cards", L-121)
Medians over frames. Research only, not the render path; frames are sampled, never stored.
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np

W, H = 640, 360
METRICS = ["drawn", "covered", "outline", "lightline", "edges", "flat", "soft", "grain", "colours", "sat", "vivid", "light", "dark"]


def _shift_stack(a, r):
    p = np.pad(a, r, mode="edge")
    return [p[r + dy: r + dy + a.shape[0], r + dx: r + dx + a.shape[1]] for dy in range(-r, r + 1) for dx in range(-r, r + 1)]


def _box_std(a, r=2):
    s = np.stack(_shift_stack(a, r)); return s.std(0)


def measure(rgb: np.ndarray) -> dict:
    """One frame (H x W x 3 uint8) -> metrics; `sparse` is True when one colour covers over 85% of it."""
    q = (rgb // 16).reshape(-1, 3).astype(np.int32)
    idx = q[:, 0] * 256 + q[:, 1] * 16 + q[:, 2]
    counts = np.sort(np.bincount(idx, minlength=4096))[::-1]
    share = counts / counts.sum()
    colours = int(np.searchsorted(np.cumsum(share), 0.90) + 1)
    f = rgb.astype(np.float32)
    L = 0.299 * f[..., 0] + 0.587 * f[..., 1] + 0.114 * f[..., 2]
    gx = np.zeros_like(L); gy = np.zeros_like(L)
    gx[:, 1:-1] = L[:, 2:] - L[:, :-2]; gy[1:-1, :] = L[2:, :] - L[:-2, :]
    grad = np.hypot(gx, gy)
    sd = _box_std(L, 2)
    nb = np.stack(_shift_stack(L, 2))
    lmax, lmin = nb.max(0), nb.min(0)
    mx, mn = f.max(2), f.min(2)
    S = np.where(mx > 0, (mx - mn) / np.maximum(mx, 1), 0)
    lit = mx > 40
    nearflat = (sd > 0.3) & (sd < 6)
    e = (grad > 48)[: H // 16 * 16, : W // 16 * 16].reshape(H // 16, 16, W // 16, 16).any(axis=(1, 3))
    return {
        "drawn": float(e.mean()),
        "covered": float(1 - share[0]),
        "outline": float(((L < 70) & (lmax - L > 90)).mean()),
        "lightline": float(((L > 170) & (L - lmin > 90)).mean()),
        "edges": float((grad > 48).mean()),
        "flat": float((sd < 1.0).mean()),
        "soft": float(((sd >= 1.0) & (sd < 6) & (grad < 24)).mean()),
        "grain": float(np.median(sd[nearflat])) if nearflat.any() else 0.0,
        "colours": colours,
        "sat": float(S[lit].mean()) if lit.any() else 0.0,
        "vivid": float(((S > 0.55) & lit).mean()),
        "light": float(np.median(L)),
        "dark": float((L < 40).mean()),
        "sparse": bool(share[0] > 0.85),
    }


def frames_of(path: Path, every: float):
    """Yield H x W x 3 frames from a video (one every `every` seconds), an image, or a folder of images."""
    from PIL import Image
    exts = {".png", ".jpg", ".jpeg", ".webp"}
    if path.is_dir():
        for p in sorted(x for x in path.iterdir() if x.suffix.lower() in exts):
            yield np.asarray(Image.open(p).convert("RGB").resize((W, H), Image.LANCZOS))
        return
    if path.suffix.lower() in exts:
        yield np.asarray(Image.open(path).convert("RGB").resize((W, H), Image.LANCZOS)); return
    ff = shutil.which("ffmpeg") or "ffmpeg"
    p = subprocess.Popen([ff, "-v", "error", "-i", str(path), "-vf", f"fps={1 / every},scale={W}:{H}:flags=lanczos", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                         stdout=subprocess.PIPE)
    n = W * H * 3
    while True:
        b = p.stdout.read(n)
        if len(b) < n:
            break
        yield np.frombuffer(b, np.uint8).reshape(H, W, 3)
    p.wait()


def fingerprint(path: Path, every=4.0) -> dict:
    rows = [measure(fr) for fr in frames_of(Path(path), every)]
    total = len(rows)
    if not rows:
        # zero measured frames is a failed measurement, not a result (Rule 0): say so loudly
        return {"source": str(path), "frames": 0, "measured": 0, "error": "no frames read"}
    med = {k: round(float(np.median([r[k] for r in rows])), 4) for k in METRICS}
    med["colours"] = int(med["colours"])
    return {"source": str(path), "frames": total, "measured": len(rows), "sparse": round(sum(r["sparse"] for r in rows) / total, 3), **med}


def distance(a: dict, b: dict) -> float:
    """A rough style distance: mean absolute difference over metrics scaled to comparable ranges."""
    scale = {"drawn": 0.3, "covered": 0.3, "outline": 0.05, "lightline": 0.05, "edges": 0.15, "flat": 0.5, "soft": 0.3, "grain": 2.0, "colours": 40, "sat": 0.4,
             "vivid": 0.3, "light": 120, "dark": 0.5}
    return round(float(np.mean([min(abs(a[k] - b[k]) / scale[k], 2.0) for k in METRICS])), 3)


def table(rows):
    head = "| source | measured | sparse | " + " | ".join(METRICS) + " |"
    out = [head, "|" + "---|" * (len(METRICS) + 3)]
    for r in rows:
        if r.get("error"):
            out.append(f"| {r.get('label', r['source'])} | 0 | - | " + " | ".join("-" for _ in METRICS) + " |"); continue
        out.append(f"| {r.get('label', Path(r['source']).name)} | {r['measured']} | {r['sparse']} | " + " | ".join(str(r[k]) for k in METRICS) + " |")
    return "\n".join(out)


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("paths", nargs="+"); ap.add_argument("--every", type=float, default=4.0)
    ap.add_argument("--json"); ap.add_argument("--label", action="append", default=[])
    a = ap.parse_args(argv)
    if a.label and len(a.label) != len(a.paths):
        # --label names the i-th input; a single label for many inputs silently renamed the first one and
        # read like a pooled row (L-130). Give one label per input, or none.
        print(f"--label given {len(a.label)} time(s) for {len(a.paths)} input(s): give one per input, or none",
              file=sys.stderr)
        return 2
    rows = []
    for i, p in enumerate(a.paths):
        r = fingerprint(Path(p), a.every)
        if i < len(a.label):
            r["label"] = a.label[i]
        rows.append(r)
        print(f"  {r.get('label', p)}: {r['measured']} of {r['frames']} frames measured", file=sys.stderr)
    print(table(rows))
    if a.json:
        Path(a.json).write_text(json.dumps(rows, indent=1))
    return 1 if any(r.get("error") for r in rows) else 0


if __name__ == "__main__":
    sys.exit(main())
