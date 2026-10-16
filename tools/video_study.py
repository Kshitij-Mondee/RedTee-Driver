"""Watch a video the way an animator would study it, and keep every observation tied to a time.

    py tools/video_study.py <video.mp4 | folder> --out <dir> [--sheet-every 10]

Per video it writes <name>.study.json and contact sheets (<name>.sheet-01.jpg ...). It measures:
  - cuts: frame-to-frame changes big enough to be a new shot (5 fps; the colour mix and a visible share of
    pixels must both change, so a lighting shift on a flat area is not counted);
  - visual change per second (how much of the picture changes), and HOLDS (runs where almost nothing moves);
  - the average and spread of shot length and of the gap between visual events;
  - loudness per half second, and the quiet gaps in the soundtrack;
  - the palette (tools/palette_study.py);
  - contact sheets every N seconds, so a person (or Claude) can look at the frames in order.
If <name>.words.json exists in --words-dir (default: --out; from tools/transcribe_videos.py), it adds speech rate,
sentence length, pauses and the text around each cut, so pictures and words can be read together.

Research only; not part of the render path. The videos studied are the requester's own files, used for
private study: notes paraphrase and never republish the narration.
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

import numpy as np

FPS = 5
SW, SH = 160, 90


def ffmpeg():
    return shutil.which("ffmpeg") or "ffmpeg"


def duration(v: Path) -> float:
    ff = shutil.which("ffprobe") or "ffprobe"
    r = subprocess.run([ff, "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(v)], capture_output=True, text=True)
    return float(r.stdout.strip() or 0)


def frames(v: Path, fps=FPS, w=SW, h=SH):
    p = subprocess.Popen([ffmpeg(), "-v", "error", "-i", str(v), "-vf", f"fps={fps},scale={w}:{h}:flags=area", "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                         stdout=subprocess.PIPE)
    n = w * h * 3
    while True:
        b = p.stdout.read(n)
        if len(b) < n:
            break
        yield np.frombuffer(b, np.uint8).reshape(h, w, 3)
    p.wait()


def audio_rms(v: Path, step=0.5):
    p = subprocess.run([ffmpeg(), "-v", "error", "-i", str(v), "-ac", "1", "-ar", "8000", "-f", "s16le", "-"], capture_output=True)
    a = np.frombuffer(p.stdout, np.int16).astype(np.float32) / 32768
    k = int(8000 * step)
    m = len(a) // k
    if m == 0:
        return np.zeros(0)
    rms = np.sqrt((a[: m * k].reshape(m, k) ** 2).mean(1) + 1e-12)
    return 20 * np.log10(rms)


def hist(f):
    q = (f // 32).reshape(-1, 3)
    idx = q[:, 0] * 64 + q[:, 1] * 8 + q[:, 2]
    h = np.bincount(idx, minlength=512).astype(np.float32)
    return h / h.sum()


def study(v: Path, out: Path, sheet_every=10.0, words_dir: Path | None = None) -> dict:
    D = duration(v)
    prev = prevh = None
    change, cuts = [], []
    for i, f in enumerate(frames(v)):
        g = f.astype(np.int16)
        h = hist(f)
        if prev is not None:
            px = float((np.abs(g - prev).max(2) > 24).mean())          # share of pixels that changed visibly
            hd = float(0.5 * np.abs(h - prevh).sum())                   # how much the colour mix changed
            change.append(px)
            # a cut changes the colour mix AND a visible share of pixels. Colour mix alone is not enough: a flat
            # area brightening by a few levels crosses a histogram bin and looks like a new shot (NVIDIA 404.8 s:
            # hist 0.57, pixels 0.0; the 7 real cuts checked had pixels >= 0.77).
            if (hd > 0.45 and px > 0.25) or (px > 0.6 and hd > 0.25):
                cuts.append(round(i / FPS, 2))
        prev, prevh = g, h
    change = np.array(change)
    per_s = [float(change[int(s * FPS): int((s + 1) * FPS)].max()) if len(change[int(s * FPS): int((s + 1) * FPS)]) else 0.0 for s in range(int(D))]
    per_s = np.array(per_s)
    # holds: runs of seconds where under 1% of the picture moves
    holds, run = [], 0
    for s, c in enumerate(per_s):
        if c < 0.01:
            run += 1
        else:
            if run >= 2:
                holds.append({"start": s - run, "seconds": run})
            run = 0
    if run >= 2:
        holds.append({"start": len(per_s) - run, "seconds": run})
    # visual events: seconds where a noticeable part of the picture changes (something arrives, moves, cuts)
    events = np.where(per_s > 0.04)[0]
    gaps = np.diff(events) if len(events) > 1 else np.array([])
    gaps = gaps[gaps > 1]
    shots = np.diff([0.0] + [c for c in cuts] + [D])
    loud = audio_rms(v)
    speechish = loud > (np.median(loud) - 12) if len(loud) else np.array([])
    quiet = []
    run = 0
    for i, s in enumerate(speechish):
        if not s:
            run += 1
        else:
            if run >= 2:
                quiet.append({"start": round((i - run) * 0.5, 1), "seconds": run * 0.5})
            run = 0
    rep = {
        "video": v.name, "duration_s": round(D, 1),
        "cuts": {"count": len(cuts), "per_minute": round(len(cuts) / (D / 60), 2), "times": cuts},
        "shot_length_s": {"median": round(float(np.median(shots)), 1), "p25": round(float(np.percentile(shots, 25)), 1),
                          "p75": round(float(np.percentile(shots, 75)), 1), "max": round(float(shots.max()), 1)},
        "visual_change": {"share_of_seconds_with_motion": round(float((per_s > 0.01).mean()), 3),
                          "median_change_when_moving": round(float(np.median(per_s[per_s > 0.01])) if (per_s > 0.01).any() else 0.0, 3),
                          "per_second": [round(float(x), 3) for x in per_s]},
        "holds": {"count": len(holds), "total_s": int(sum(h["seconds"] for h in holds)), "longest": sorted(holds, key=lambda h: -h["seconds"])[:8]},
        "gap_between_visual_events_s": {"median": round(float(np.median(gaps)), 1) if len(gaps) else None,
                                        "p90": round(float(np.percentile(gaps, 90)), 1) if len(gaps) else None},
        "audio": {"median_db": round(float(np.median(loud)), 1) if len(loud) else None, "quiet_gaps": quiet[:40],
                  "quiet_gap_count": len(quiet)},
    }
    # palette
    try:
        import importlib.util
        sp = importlib.util.spec_from_file_location("palette_study", Path(__file__).with_name("palette_study.py"))
        P = importlib.util.module_from_spec(sp); sp.loader.exec_module(P)
        pal = P.study(v, 0.5)
        pal.pop("per_frame", None); pal.pop("shot_palettes", None)
        rep["palette"] = pal
    except Exception as ex:
        rep["palette"] = {"error": str(ex)}
    # contact sheets
    sheets(v, out, D, sheet_every)
    # words, if a transcript exists
    wj = (words_dir or out) / f"{v.stem}.words.json"
    if wj.exists():
        rep["speech"] = speech(json.loads(wj.read_text(encoding="utf-8")), cuts, D)
    return rep


def sheets(v: Path, out: Path, D: float, every: float, cols=6, rows=6):
    from PIL import Image, ImageDraw
    times = list(np.arange(every / 2, D, every))
    per = cols * rows
    tw, th = 320, 180
    fr = frames(v, fps=1 / every, w=tw, h=th)
    page, k = None, 0
    for i, f in enumerate(fr):
        if i % per == 0:
            if page is not None:
                page.save(out / f"{v.stem}.sheet-{k:02d}.jpg", quality=82)
            k += 1
            page = Image.new("RGB", (cols * (tw + 4) + 4, rows * (th + 22) + 4), (16, 16, 16))
        t = (i + 0.5) * every
        x, y = 4 + (i % per % cols) * (tw + 4), 4 + (i % per // cols) * (th + 22)
        page.paste(Image.fromarray(f), (x, y + 18))
        ImageDraw.Draw(page).text((x + 2, y + 2), f"{int(t // 60):02d}:{int(t % 60):02d}", fill=(255, 220, 90))
    if page is not None:
        page.save(out / f"{v.stem}.sheet-{k:02d}.jpg", quality=82)


def speech(words: dict, cuts: list, D: float) -> dict:
    W = words.get("words") or []
    segs = words.get("segments") or []
    if not W:
        return {"error": "no words"}
    spoken = sum(1 for w in W)
    first, last = W[0]["s"], W[-1]["e"]
    gaps = [W[i + 1]["s"] - W[i]["e"] for i in range(len(W) - 1)]
    pauses = [g for g in gaps if g > 0.6]
    sents = [s for s in segs if s.get("text")]
    import re
    text = " ".join(s["text"] for s in sents)
    sentences = [x for x in re.split(r"(?<=[.!?])\s+", text) if x.strip()]
    lens = [len(x.split()) for x in sentences]
    questions = sum(1 for x in sentences if x.strip().endswith("?"))
    numbers = sum(1 for x in sentences if re.search(r"\d", x))
    # words spoken between consecutive cuts
    return {
        "words": spoken, "wpm": round(spoken / ((last - first) / 60), 1),
        "sentences": len(sentences), "words_per_sentence": {"mean": round(float(np.mean(lens)), 1), "median": float(np.median(lens))},
        "questions": questions, "sentences_with_numbers": numbers,
        "pauses_over_0_6s": len(pauses), "pauses_over_1_5s": sum(1 for g in gaps if g > 1.5),
    }


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("path"); ap.add_argument("--out", required=True); ap.add_argument("--sheet-every", type=float, default=10.0)
    ap.add_argument("--words-dir"); ap.add_argument("--redo", action="store_true")
    a = ap.parse_args(argv)
    src = Path(a.path)
    vids = sorted(p for p in src.iterdir() if p.suffix.lower() in (".mp4", ".webm", ".mkv")) if src.is_dir() else [src]
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    for v in vids:
        t = out / f"{v.stem}.study.json"
        if t.exists() and not a.redo:
            print(f"skip {v.name}"); continue
        rep = study(v, out, a.sheet_every, Path(a.words_dir) if a.words_dir else None)
        t.write_text(json.dumps(rep, indent=1))
        print(f"{v.name}: {rep['duration_s']} s, {rep['cuts']['count']} cuts, median shot {rep['shot_length_s']['median']} s, "
              f"{rep['holds']['count']} holds")
    return 0


if __name__ == "__main__":
    sys.exit(main())
