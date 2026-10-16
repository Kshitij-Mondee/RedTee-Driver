"""Palette study: what colours a video actually uses, and which ones appear together.

    py tools/palette_study.py <video.mp4 | folder> [--out docs/research/palettes] [--fps 1]
    py tools/palette_study.py --aggregate docs/research/palettes      # across every video studied

A research tool (not part of the render path). It started from a K-means script Gemini suggested and
keeps its idea (sample frames, find the dominant colours, keep per-frame groupings), but was rebuilt after
testing both on a Loom lesson whose exact palette is known (docs/research/palettes/README.md has the
numbers). K-means AVERAGES pixels, so two nearby accents (an orange and a yellow) came back as one colour
that is not in the video, and the background's gradient used up most of each frame's slots. This version:
  - decodes with FFmpeg at a fixed rate, keeping the aspect ratio, colour-converted by FFmpeg;
  - counts real pixel colours (5 bits per channel), then merges bins that look the same (CIELAB distance)
    and keeps the MOST COMMON real colour of each group, so every reported hex exists in the video;
  - separates neutrals (backgrounds, text, lines) from accents (chromatic colours), so a small bright
    accent is not swallowed by a large background;
  - groups frames into shots (colour-histogram change) and reports which accents appear together, how
    often, and how much of the frame they take;
  - is deterministic (no random initialisation) and needs only numpy (FFmpeg does the decoding).
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from collections import Counter
from itertools import combinations
from pathlib import Path

import numpy as np

W, H = 320, 180
MERGE_DE = 7.0        # colours closer than this (CIELAB delta E 76) count as one
CHROMA_ACCENT = 25.0  # an accent is chromatic (chroma above this) ...
ACCENT_FROM_FIELD_L = 15.0  # ... and clearly lighter or darker than the field (not a card or shade of it)
GROUND_DE = 18.0      # colours this close to the frame's field are shades of the background (gradients, glows)
MIN_SHARE = 0.004     # ignore colours under 0.4% of a frame (anti-aliasing, noise)


# ------------------------------------------------------------------ colour maths
def srgb_to_lab(rgb: np.ndarray) -> np.ndarray:
    c = rgb.astype(np.float64) / 255.0
    c = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    M = np.array([[0.4124564, 0.3575761, 0.1804375], [0.2126729, 0.7151522, 0.0721750], [0.0193339, 0.1191920, 0.9503041]])
    xyz = c @ M.T / np.array([0.95047, 1.0, 1.08883])
    f = np.where(xyz > 216 / 24389, np.cbrt(xyz), (24389 / 27 * xyz + 16) / 116)
    return np.stack([116 * f[..., 1] - 16, 500 * (f[..., 0] - f[..., 1]), 200 * (f[..., 1] - f[..., 2])], -1)


def hexof(rgb) -> str:
    return "#{:02X}{:02X}{:02X}".format(*[int(v) for v in rgb])


def rgbof(h: str) -> np.ndarray:
    return np.array([int(h[i:i + 2], 16) for i in (1, 3, 5)], np.uint8)


def contrast(a: np.ndarray, b: np.ndarray) -> float:
    def L(c):
        c = c.astype(float) / 255
        c = np.where(c <= 0.03928, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
        return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
    la, lb = sorted([L(a), L(b)], reverse=True)
    return (la + 0.05) / (lb + 0.05)


# ------------------------------------------------------------------ one frame
def frame_palette(px: np.ndarray) -> list[dict]:
    """Real colours of one frame, merged by perceptual distance; each entry keeps its most common pixel."""
    q = (px >> 3).astype(np.int32)                                   # 5 bits per channel
    key = (q[:, 0] << 10) | (q[:, 1] << 5) | q[:, 2]
    keys, counts = np.unique(key, return_counts=True)
    order = np.argsort(-counts)
    keys, counts = keys[order], counts[order]
    # representative real colour per bin: the bin centre is close enough at 5 bits; refine with the mean of
    # the pixels in the bin (they differ by < 8 per channel, so this cannot invent a new hue)
    rgb = np.stack([(keys >> 10) & 31, (keys >> 5) & 31, keys & 31], -1) * 8 + 4
    lab = srgb_to_lab(rgb)
    n = len(px)
    groups: list[dict] = []
    for i in range(len(keys)):
        if counts[i] / n < MIN_SHARE / 8 and groups:
            break
        for g in groups:
            if np.linalg.norm(g["lab"] - lab[i]) < MERGE_DE:
                g["count"] += counts[i]
                break
        else:
            groups.append({"rgb": rgb[i], "lab": lab[i], "count": int(counts[i])})
    out = []
    field = groups[0]
    for g in groups:
        share = g["count"] / n
        if share < MIN_SHARE:
            continue
        a, b = g["lab"][1], g["lab"][2]
        chroma = float(np.hypot(a, b))
        if g is field:
            role = "field"
        elif np.linalg.norm(g["lab"] - field["lab"]) < GROUND_DE:
            role = "ground"
        elif chroma > CHROMA_ACCENT and abs(g["lab"][0] - field["lab"][0]) > ACCENT_FROM_FIELD_L:
            role = "accent"
        else:
            role = "neutral"
        out.append({"hex": hexof(g["rgb"]), "share": round(float(share), 4), "L": round(float(g["lab"][0]), 1),
                    "chroma": round(chroma, 1), "role": role, "accent": role == "accent"})
    return out


def lab_hist(px: np.ndarray) -> np.ndarray:
    lab = srgb_to_lab(px)
    h, _ = np.histogramdd(lab, bins=(8, 8, 8), range=((0, 100), (-100, 100), (-100, 100)))
    return (h / max(1, h.sum())).ravel()


# ------------------------------------------------------------------ a video
def frames(video: Path, fps: float):
    ff = shutil.which("ffmpeg") or "ffmpeg"
    cmd = [ff, "-v", "error", "-i", str(video), "-vf", f"fps={fps},scale={W}:{H}:flags=area", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"]
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    size = W * H * 3
    i = 0
    while True:
        buf = p.stdout.read(size)
        if len(buf) < size:
            break
        yield i / fps, np.frombuffer(buf, np.uint8).reshape(-1, 3)
        i += 1
    p.wait()


def merge_entries(entries: list[dict], weight: str) -> list[dict]:
    """Merge colours across frames; weight by area share or by number of frames a colour appears in."""
    pool: list[dict] = []
    for e in sorted(entries, key=lambda e: -e["share"]):
        lab = srgb_to_lab(rgbof(e["hex"])[None])[0]
        w = e["share"] if weight == "area" else 1.0
        for g in pool:
            if np.linalg.norm(g["lab"] - lab) < MERGE_DE:
                g["w"] += w; g["frames"] += 1
                break
        else:
            pool.append({"hex": e["hex"], "lab": lab, "w": w, "frames": 1, "chroma": e["chroma"], "L": e["L"], "accent": e["accent"]})
    pool.sort(key=lambda g: -g["w"])
    return pool


def study(video: Path, fps: float = 1.0) -> dict:
    per_frame, shots, cur, prev_h = [], [], None, None
    for t, px in frames(video, fps):
        pal = frame_palette(px)
        # skip near-empty frames (fades to black or white, solid cards)
        if len(pal) == 1 and pal[0]["share"] > 0.97:
            continue
        h = lab_hist(px)
        cut = prev_h is None or 0.5 * np.abs(h - prev_h).sum() > 0.35
        prev_h = h
        if cut:
            cur = {"start": round(t, 2), "frames": []}
            shots.append(cur)
        cur["frames"].append(len(per_frame))
        per_frame.append({"t": round(t, 2), "palette": pal})
    if not per_frame:
        return {"video": str(video), "error": "no frames decoded"}
    all_entries = [e for f in per_frame for e in f["palette"]]
    fields = merge_entries([e for e in all_entries if e["role"] in ("field", "ground")], "area")
    neutrals = merge_entries([e for e in all_entries if e["role"] == "neutral"], "area")
    accents = merge_entries([e for e in all_entries if e["role"] == "accent"], "frames")
    nf = len(per_frame)

    def canon(hx, pool):
        lab = srgb_to_lab(rgbof(hx)[None])[0]
        return min(pool, key=lambda g: np.linalg.norm(g["lab"] - lab))["hex"] if pool else hx

    pairs, per_frame_accents, field_L = Counter(), [], []
    for f in per_frame:
        acc = sorted({canon(e["hex"], accents) for e in f["palette"] if e["accent"]})
        per_frame_accents.append(len(acc))
        for a, b in combinations(acc, 2):
            pairs[(a, b)] += 1
        field_L.append(next(e for e in f["palette"] if e["role"] == "field")["L"] if any(e["role"] == "field" for e in f["palette"]) else f["palette"][0]["L"])
    shot_out = []
    for s in shots:
        es = [e for i in s["frames"] for e in per_frame[i]["palette"]]
        m = merge_entries(es, "area")
        tot = sum(g["w"] for g in m) or 1
        shot_out.append({"start": s["start"], "frames": len(s["frames"]),
                         "palette": [{"hex": g["hex"], "share": round(g["w"] / tot, 3)} for g in m[:8]]})
    field = fields[0] if fields else None
    ink = max(neutrals or accents, key=lambda g: contrast(rgbof(g["hex"]), rgbof(field["hex"]))) if field and (neutrals or accents) else None
    tot_n = sum(g["w"] for g in neutrals) or 1
    tot_f = sum(g["w"] for g in fields) or 1
    return {
        "video": str(video), "sampled_frames": nf, "fps": fps, "shots": len(shots),
        "field": field["hex"] if field else None,
        "field_lightness": {"median": round(float(np.median(field_L)), 1), "dark_share": round(float(np.mean(np.array(field_L) < 35)), 3)},
        "grounds": [{"hex": g["hex"], "area_share": round(g["w"] / tot_f, 3), "L": g["L"]} for g in fields[:6]],
        "ink": ink["hex"] if ink else None, "ink_on_field_contrast": round(contrast(rgbof(ink["hex"]), rgbof(field["hex"])), 2) if ink else None,
        "neutrals": [{"hex": g["hex"], "area_share": round(g["w"] / tot_n, 3), "L": g["L"]} for g in neutrals[:8]],
        "accents": [{"hex": g["hex"], "frames_share": round(g["frames"] / nf, 3), "chroma": g["chroma"], "L": g["L"]} for g in accents[:12]],
        "accents_per_frame": {"mean": round(float(np.mean(per_frame_accents)), 2), "max": int(max(per_frame_accents))},
        "accent_pairs": [{"pair": list(k), "frames_share": round(v / nf, 3)} for k, v in pairs.most_common(15)],
        "shot_palettes": shot_out,
        "per_frame": per_frame,
    }


# ------------------------------------------------------------------ outputs
def swatch(rep: dict, path: Path):
    from PIL import Image, ImageDraw
    im = Image.new("RGB", (1200, 300), (24, 24, 24)); d = ImageDraw.Draw(im)
    d.text((12, 8), Path(rep["video"]).name[:90], fill=(230, 230, 230))
    x = 12
    for n in (rep.get("grounds", [])[:3] + rep["neutrals"][:4]):
        w = max(40, int(300 * n["area_share"])); d.rectangle((x, 30, x + w, 130), fill=tuple(rgbof(n["hex"]))); d.text((x + 4, 134), n["hex"], fill=(200, 200, 200)); x += w + 6
    x = 12
    for a in rep["accents"][:10]:
        d.rectangle((x, 160, x + 100, 240), fill=tuple(rgbof(a["hex"]))); d.text((x + 4, 244), f"{a['hex']} {int(a['frames_share'] * 100)}%", fill=(200, 200, 200)); x += 112
    im.save(path)


def aggregate(folder: Path) -> dict:
    reps = [json.loads(p.read_text()) for p in sorted(folder.glob("*.json")) if p.name != "_aggregate.json"]
    reps = [r for r in reps if "accents" in r]
    by_channel: dict[str, list] = {}
    for r in reps:
        ch = Path(r["video"]).name.split("__")[0]
        by_channel.setdefault(ch, []).append(r)
    out = {"videos": len(reps), "channels": {}}
    for ch, rs in by_channel.items():
        acc = merge_entries([{"hex": a["hex"], "share": a["frames_share"], "chroma": a["chroma"], "L": a["L"], "accent": True} for r in rs for a in r["accents"]], "frames")
        out["channels"][ch] = {
            "videos": len(rs),
            "dark_fields": sum(1 for r in rs if r["field_lightness"]["median"] < 35),
            "median_ink_contrast": round(float(np.median([r["ink_on_field_contrast"] for r in rs])), 2),
            "accents_per_frame_mean": round(float(np.mean([r["accents_per_frame"]["mean"] for r in rs])), 2),
            "recurring_accents": [{"hex": g["hex"], "in_videos": g["frames"]} for g in acc if g["frames"] >= 2][:12],
            "fields": [r["field"] for r in rs],
        }
    return out


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("path", nargs="?"); ap.add_argument("--out", default="docs/research/palettes"); ap.add_argument("--fps", type=float, default=1.0)
    ap.add_argument("--aggregate"); ap.add_argument("--keep-frames", action="store_true", help="keep the per-frame palettes in the JSON (large)")
    a = ap.parse_args(argv)
    if a.aggregate:
        rep = aggregate(Path(a.aggregate)); (Path(a.aggregate) / "_aggregate.json").write_text(json.dumps(rep, indent=1)); print(json.dumps(rep, indent=1)[:3000]); return 0
    src = Path(a.path)
    vids = sorted(p for p in src.iterdir() if p.suffix.lower() in (".mp4", ".webm", ".mkv", ".mov")) if src.is_dir() else [src]
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    for v in vids:
        target = out / (v.stem + ".json")
        if target.exists():
            print(f"skip {v.name} (done)"); continue
        rep = study(v, a.fps)
        if not a.keep_frames:
            rep.pop("per_frame", None)
        target.write_text(json.dumps(rep, indent=1))
        swatch(rep, out / (v.stem + ".png"))
        print(f"{v.name}: field {rep.get('field')}, {len(rep.get('accents', []))} accents, {rep.get('shots')} shots")
    return 0


if __name__ == "__main__":
    sys.exit(main())
