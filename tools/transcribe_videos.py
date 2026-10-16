"""Transcribe videos with word timings, locally, for private study (tools/video_study.py reads the result).

    py tools/transcribe_videos.py <video | folder> --out <dir> [--engine auto|whisper|sphinx] [--model small.en]

Writes <name>.words.json: {"engine", "words": [{"w", "s", "e"}], "segments": [{"s", "e", "text"}]}.
  - whisper (faster-whisper; best): accurate text with punctuation. The model downloads on first use, so run
    this on a machine that can reach Hugging Face: `py -m pip install faster-whisper`.
  - sphinx (pocketsphinx; fallback, no download): rough words with timings, no punctuation. Good enough for
    speech rate, pauses and the gist; not for quotes or sentence length. Marked "rough" in the output.
Resumable: work is done in 60 s chunks cached under <out>/.chunks, so an interrupted run continues.
The transcript stays in the local research cache; notes paraphrase it and never republish it.
"""
from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
from pathlib import Path

CHUNK = 60.0


def dur(v):
    r = subprocess.run([shutil.which("ffprobe") or "ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(v)],
                       capture_output=True, text=True)
    return float(r.stdout.strip() or 0)


def pcm(v, start, length):
    r = subprocess.run([shutil.which("ffmpeg") or "ffmpeg", "-v", "error", "-ss", str(start), "-t", str(length), "-i", str(v),
                        "-ac", "1", "-ar", "16000", "-f", "s16le", "-"], capture_output=True)
    return r.stdout


def sphinx_chunk(buf, t0):
    from pocketsphinx import Decoder
    d = Decoder(samprate=16000)
    d.start_utt(); d.process_raw(buf, full_utt=True); d.end_utt()
    fr = 0.01  # pocketsphinx frames are 10 ms
    words = []
    for s in d.seg():
        w = s.word
        if w.startswith("<") or w.startswith("[") or w in ("<sil>",):
            continue
        w = w.split("(")[0]
        words.append({"w": w, "s": round(t0 + s.start_frame * fr, 2), "e": round(t0 + s.end_frame * fr, 2)})
    return words


def transcribe(v: Path, out: Path, engine="auto", model="small.en"):
    target = out / f"{v.stem}.words.json"
    if target.exists():
        return json.loads(target.read_text())
    use = engine
    if engine == "auto":
        try:
            import faster_whisper  # noqa: F401
            use = "whisper"
        except Exception:
            use = "sphinx"
    if use == "whisper":
        try:
            from faster_whisper import WhisperModel
            m = WhisperModel(model, device="cpu", compute_type="int8")
            segs, _ = m.transcribe(str(v), word_timestamps=True, vad_filter=True)
            W, S = [], []
            for sg in segs:
                S.append({"s": round(sg.start, 2), "e": round(sg.end, 2), "text": sg.text.strip()})
                for w in sg.words or []:
                    W.append({"w": w.word.strip(), "s": round(w.start, 2), "e": round(w.end, 2)})
            rep = {"engine": f"faster-whisper {model}", "rough": False, "words": W, "segments": S}
            target.write_text(json.dumps(rep, indent=1))
            return rep
        except Exception as ex:
            if engine == "whisper":
                raise
            print(f"  whisper unavailable ({ex.__class__.__name__}: {str(ex)[:80]}); using pocketsphinx (rough)")
    cdir = out / ".chunks" / v.stem
    cdir.mkdir(parents=True, exist_ok=True)
    D = dur(v)
    n = int(D // CHUNK) + 1
    for i in range(n):
        cf = cdir / f"{i:04d}.json"
        if cf.exists():
            continue
        cf.write_text(json.dumps(sphinx_chunk(pcm(v, i * CHUNK, CHUNK), i * CHUNK)))
        print(f"  {v.name}: chunk {i + 1}/{n}", flush=True)
    W = [w for i in range(n) for w in json.loads((cdir / f"{i:04d}.json").read_text())]
    # segments: split where the voice pauses for more than 0.6 s (no punctuation from this engine)
    S, cur = [], []
    for k, w in enumerate(W):
        if cur and w["s"] - cur[-1]["e"] > 0.6:
            S.append({"s": cur[0]["s"], "e": cur[-1]["e"], "text": " ".join(x["w"] for x in cur)}); cur = []
        cur.append(w)
    if cur:
        S.append({"s": cur[0]["s"], "e": cur[-1]["e"], "text": " ".join(x["w"] for x in cur)})
    rep = {"engine": "pocketsphinx en-us", "rough": True, "words": W, "segments": S}
    target.write_text(json.dumps(rep, indent=1))
    return rep


def main(argv=None):
    ap = argparse.ArgumentParser()
    ap.add_argument("path"); ap.add_argument("--out", required=True)
    ap.add_argument("--engine", default="auto", choices=["auto", "whisper", "sphinx"]); ap.add_argument("--model", default="small.en")
    a = ap.parse_args(argv)
    src = Path(a.path)
    vids = sorted(p for p in src.iterdir() if p.suffix.lower() in (".mp4", ".webm", ".mkv")) if src.is_dir() else [src]
    out = Path(a.out); out.mkdir(parents=True, exist_ok=True)
    for v in vids:
        rep = transcribe(v, out, a.engine, a.model)
        print(f"{v.name}: {len(rep['words'])} words ({rep['engine']}{', rough' if rep.get('rough') else ''})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
