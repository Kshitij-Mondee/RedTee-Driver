"""Study HOW a video explains: find the explaining moments, then read pictures and words together.

    py tools/explain_study.py cues  <video> --words <name.words.json> [--top 8] [--window 30]
    py tools/explain_study.py strip <video> --words <name.words.json> --start 120 --end 180 [--every 3] --out <dir>
    py tools/explain_study.py moments <name.study.json> [--top 4] [--span 10]

moments picks the animation worth watching closely: the windows with the most motion and at most one cut
       (from tools/video_study.py), to strip at 0.5 s. Contact sheets every 10 s step over them (L-134).

cues   ranks windows of the narration by explanation cues: analogies ("it's like", "imagine", "think of"),
       questions ("why", "how does", "what happens"), turns ("but", "the problem", "here's", "actually"),
       restatements ("basically", "in other words", "which means") and quantities ("million", "percent").
       It finds where to look; it does not judge what is there. A person (or Claude) looks at the strip.
strip  draws frames every N seconds across a window, each with the words spoken around it printed below,
       so the picture and the sentence it serves can be read side by side (the unit of explaining).

Works with rough transcripts (tools/transcribe_videos.py, pocketsphinx): cue words survive the noise even when
sentences do not. Research only; not part of the render path. Strips stay in the gitignored research cache:
they contain frames of someone else's video and are for private study, never for publishing.

On-screen text (OCR) was tried and dropped: the study copies are 640x360 and tesseract reads almost nothing at
that size, so "is the spoken word also on screen" is judged by eye from the strips.
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import textwrap
from pathlib import Path

# phrase -> family. Phrases are matched on the lower-case word stream (no punctuation in rough transcripts).
CUES = {
    "analogy": ["it's like", "its like", "is like", "kind of like", "think of", "think about it", "imagine", "picture this",
                "as if", "same as", "the equivalent", "like a", "like an"],
    "question": ["why", "how does", "how do", "what happens", "what if", "so what", "how much", "what does"],
    "turn": ["but", "the problem", "here's", "heres", "actually", "the catch", "the trick", "the secret", "instead", "except"],
    "restate": ["basically", "in other words", "which means", "that means", "simply", "the short version", "put simply", "in short"],
    "quantity": ["million", "billion", "trillion", "percent", "thousand", "hundred", "times"],
}
WEIGHT = {"analogy": 3.0, "restate": 2.0, "question": 1.5, "turn": 1.0, "quantity": 0.5}


def load_words(p):
    d = json.loads(Path(p).read_text(encoding="utf-8"))
    return [w for w in d.get("words", []) if w.get("w")], bool(d.get("rough"))


def hits(words):
    """Every cue occurrence: (time, family, phrase). Multi-word phrases are matched on consecutive words."""
    toks = [w["w"].lower() for w in words]
    out = []
    for fam, phrases in CUES.items():
        for ph in phrases:
            parts = ph.split()
            n = len(parts)
            for i in range(len(toks) - n + 1):
                if toks[i:i + n] == parts:
                    out.append((words[i]["s"], fam, ph))
    return sorted(out)


def rank(words, window=30.0, top=8):
    """Score sliding windows (step window/3) by weighted cue counts; return the best non-overlapping ones."""
    H = hits(words)
    if not words:
        return []
    end = words[-1]["e"]
    step = window / 3
    cand = []
    t = 0.0
    while t < end:
        inside = [h for h in H if t <= h[0] < t + window]
        score = sum(WEIGHT[h[1]] for h in inside)
        if inside:
            fams = {}
            for h in inside:
                fams[h[1]] = fams.get(h[1], 0) + 1
            cand.append({"start": round(t, 1), "end": round(t + window, 1), "score": round(score, 1), "families": fams,
                         "phrases": sorted({h[2] for h in inside})})
        t += step
    cand.sort(key=lambda c: -c["score"])
    picked = []
    for c in cand:
        if all(c["end"] <= p["start"] or c["start"] >= p["end"] for p in picked):
            picked.append(c)
        if len(picked) >= top:
            break
    return sorted(picked, key=lambda c: c["start"])


def said(words, a, b):
    return " ".join(w["w"] for w in words if a <= w["s"] < b)


def frame(v, t, w=384, h=216):
    from PIL import Image
    ff = shutil.which("ffmpeg") or "ffmpeg"
    r = subprocess.run([ff, "-v", "error", "-ss", f"{t:.2f}", "-i", str(v), "-frames:v", "1", "-vf", f"scale={w}:{h}",
                        "-f", "rawvideo", "-pix_fmt", "rgb24", "-"], capture_output=True)
    if len(r.stdout) < w * h * 3:
        return Image.new("RGB", (w, h), (0, 0, 0))
    return Image.frombytes("RGB", (w, h), r.stdout[: w * h * 3])


def font(size):
    from PIL import ImageFont
    for name in ("DejaVuSans.ttf", "arial.ttf", "Arial.ttf", "segoeui.ttf"):
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            pass
    try:
        return ImageFont.load_default(size)
    except TypeError:
        return ImageFont.load_default()


def strip(v, words, start, end, every=3.0, out=Path("."), cols=4, rough=True):
    from PIL import Image, ImageDraw
    f16, f14 = font(16), font(14)
    times = []
    t = start
    while t < end:
        times.append(round(t, 2)); t += every
    tw, th, cap = 384, 216, 96
    rows = (len(times) + cols - 1) // cols
    page = Image.new("RGB", (cols * (tw + 6) + 6, rows * (th + cap + 6) + 30), (18, 18, 18))
    d = ImageDraw.Draw(page)
    d.text((8, 6), f"{Path(v).name}  {start:.0f}-{end:.0f} s  every {every:g} s" + ("  (words: rough ASR)" if rough else ""), fill=(200, 200, 200), font=f16)
    for k, t in enumerate(times):
        x, y = 6 + (k % cols) * (tw + 6), 30 + (k // cols) * (th + cap + 6)
        page.paste(frame(v, t, tw, th), (x, y))
        d.text((x + 4, y + 4), f"{int(t // 60):02d}:{t % 60:04.1f}", fill=(255, 220, 90), font=f16)
        txt = said(words, t - every / 2, t + every / 2)
        for i, line in enumerate(textwrap.wrap(txt, 44)[:5]):
            d.text((x + 3, y + th + 4 + i * 18), line, fill=(235, 235, 235), font=f14)
    out.mkdir(parents=True, exist_ok=True)
    p = out / f"{Path(v).stem}.explain-{int(start):04d}-{int(end):04d}.jpg"
    page.save(p, quality=85)
    return p, len(times)


def moments(study, top=4, span=10, max_cuts=1, skip_end=40.0, gap=15):
    """The animation moments worth a 0.5 s strip: `span`-second windows with the most visual change and at
    most `max_cuts` cuts (continuous animation, not an edit montage), outside the last `skip_end` seconds
    (sponsor and end cards). Windows at least `gap` s apart. Reads a tools/video_study.py study.json (L-134)."""
    ps = study["visual_change"]["per_second"]
    cuts = [c if isinstance(c, (int, float)) else c.get("t") for c in study["cuts"]["times"]]
    last = int(study["duration_s"] - skip_end) - span
    if last < 0:
        return []                                   # too short to have a window outside the end cards
    cand = []
    for s in range(0, last + 1):
        w = ps[s:s + span]
        if len(w) < span:
            break
        n = sum(1 for c in cuts if s <= c < s + span)
        if n <= max_cuts:
            cand.append((round(sum(w) / span, 4), s, n))
    cand.sort(key=lambda x: (-x[0], x[1]))
    out = []
    for score, s, n in cand:
        if all(abs(s - o["start"]) >= gap for o in out):
            out.append({"start": s, "end": s + span, "motion": score, "cuts": n})
        if len(out) == top:
            break
    return out


def main(argv=None):
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest="cmd", required=True)
    m = sub.add_parser("moments"); m.add_argument("study"); m.add_argument("--top", type=int, default=4)
    m.add_argument("--span", type=int, default=10)
    if argv is None:
        argv = sys.argv[1:]
    if argv and argv[0] == "moments":
        a = ap.parse_args(argv)
        st = json.loads(Path(a.study).read_text())
        found = moments(st, a.top, a.span)
        if not found:
            print("no window qualifies (a zero is not a result)"); return 2
        for f in found:
            print(f"  {f['start']:>5} s  motion {f['motion']:.3f}  cuts {f['cuts']}  "
                  f"-> strip --start {f['start']} --end {f['end']} --every 0.5")
        return 0
    c = sub.add_parser("cues"); c.add_argument("video"); c.add_argument("--words", required=True)
    c.add_argument("--top", type=int, default=8); c.add_argument("--window", type=float, default=30.0)
    s = sub.add_parser("strip"); s.add_argument("video"); s.add_argument("--words", required=True)
    s.add_argument("--start", type=float, required=True); s.add_argument("--end", type=float, required=True)
    s.add_argument("--every", type=float, default=3.0); s.add_argument("--out", required=True)
    a = ap.parse_args(argv)
    words, rough = load_words(a.words)
    if not words:
        print("no words in the transcript: nothing to rank (a zero is not a result)"); return 2
    if a.cmd == "cues":
        H = hits(words)
        fam = {}
        for h in H:
            fam[h[1]] = fam.get(h[1], 0) + 1
        mins = (words[-1]["e"] - words[0]["s"]) / 60
        print(f"{Path(a.video).name}: {len(words)} words, {len(H)} cues ({', '.join(f'{k} {v}' for k, v in sorted(fam.items()))}), "
              f"{len(H) / mins:.1f} a minute" + ("  [rough transcript]" if rough else ""))
        for r in rank(words, a.window, a.top):
            print(f"  {int(r['start'] // 60):02d}:{int(r['start'] % 60):02d}-{int(r['end'] // 60):02d}:{int(r['end'] % 60):02d}"
                  f"  score {r['score']:>5}  {r['families']}  {', '.join(r['phrases'][:6])}")
        return 0
    p, n = strip(a.video, words, a.start, a.end, a.every, Path(a.out), rough=rough)
    print(f"{p} ({n} frames)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
