"""Skia bridge (D-53): render storyboard scenes of kind 'skia' to transparent WebM clips with skia-python.

Same contract and the same store as Manim (loom/manim_bridge.py): timing, params and the look are injected
(a JSON context); the clip is keyed by the scene source, its timing and exactly the tokens it READ; draft
quality for previews, final for check and render; optional real motion blur (sub-frame accumulation).

    {"beat": "b05", "kind": "skia", "skia": {"file": "scenes/b05_skia.py", "rect": [160, 110, 1600, 780],
     "motion_blur": {"samples": 5, "shutter": 0.5}, "params": {...}}}
"""
from __future__ import annotations

import os
import re
import shutil
import subprocess
import tempfile
import time
from pathlib import Path

from . import cues as C
from . import manim_bridge as MB
from .compose import load_style
from .util import ENGINE_ROOT, LoomError, file_sha, info, read_json, run, sha, which, write_json

RUNTIME = ENGINE_ROOT / "runtime" / "skia"


def skia_version() -> str:
    try:
        r = subprocess.run([MB._py(), "-c", "import skia; print(skia.__version__)"], capture_output=True, text=True, env=_env(), timeout=60)
        return r.stdout.strip() or "none"
    except Exception:  # noqa: BLE001
        return "none"


def _env() -> dict:
    e = dict(os.environ)
    # a Linux box without libEGL can point skia-python at extracted libraries (see docs/SKIA.md)
    if os.environ.get("LOOM_SKIA_LIBPATH"):
        e["LD_LIBRARY_PATH"] = os.environ["LOOM_SKIA_LIBPATH"] + os.pathsep + e.get("LD_LIBRARY_PATH", "")
    return e


def available() -> bool:
    return skia_version() != "none"


def _prepare(project, s, beat, style) -> dict:
    spec = s.get("skia") or {}
    src = project.path(spec.get("file") or f"scenes/{s['beat']}_skia.py")
    if not src.exists():
        raise LoomError(f"{s['beat']}: Skia scene file not found: {src}")
    from .checks.manim_colours import check_source
    bad = check_source(src.read_text(encoding="utf-8"), src.name, dialect="skia")
    if bad:
        raise LoomError(f"{s['beat']}: " + "; ".join(bad[:5]))
    txt = src.read_text(encoding="utf-8")
    start = beat["start"] + float(spec.get("offset", 0.0))
    dur = round(beat["end"] - start + float(spec.get("spill", 1.6)), 3)
    words = C.beat_words(beat)
    names = C.collect_anchors(spec.get("params") or {}, []) + list(spec.get("cues") or [])
    code = "\n".join(l.split("#", 1)[0] for l in txt.splitlines())   # a cue named in a comment is not a cue (L-83)
    names += re.findall(r"""\bcue\(\s*["']([^"']+)["']""", code)
    for block in re.findall(r"CUES\s*=\s*\[(.*?)\]", txt, re.S):
        names += re.findall(r"""["']([^"']+)["']""", block)
    cues = {}
    for a in dict.fromkeys(names):
        t, _ = C.resolve(a, words)
        if t is None:
            raise LoomError(f"{s['beat']}: Skia cue '{a}' is not spoken in this beat. {C.suggest(a, words)}")
        cues[a] = round(t - start, 3)
    rect = spec.get("rect") or [96, 84, 1728, 846]
    w, h = int(rect[2]) // 2 * 2, int(rect[3]) // 2 * 2
    fonts = {"display": style["fonts"]["display"]["family"], "body": style["fonts"]["body"]["family"]}
    font_files = MB._ttf_fonts(style)
    mb = spec.get("motion_blur") or {}
    ctxd = {"beat": s["beat"], "duration": dur, "cues": cues, "params": spec.get("params") or {}, "palette": style["palette"],
            "fonts": fonts, "font_files": font_files, "speech": [round(beat["speech_start"] - start, 3), round(beat["speech_end"] - start, 3)], "size": [w, h]}
    timing = {"duration": dur, "cues": cues, "params": ctxd["params"], "speech": ctxd["speech"], "size": [w, h],
              "motion_blur": [int(mb.get("samples", 1)), float(mb.get("shutter", 0.5))]}
    look = {"palette": dict(style["palette"]), "fonts": fonts, "font_files": [file_sha(f) for f in font_files]}
    runtime_sha = sha(file_sha(RUNTIME / "loom_skia.py"), file_sha(RUNTIME / "render.py"))
    return {"beat": s["beat"], "src": src, "src_sha": file_sha(src), "ctxd": ctxd, "rect": rect, "start": start, "dur": dur,
            "w": w, "h": h, "scene_class": None, "timing": timing, "look": look, "runtime_sha": runtime_sha, "full": sha(ctxd),
            "engine": "skia-" + skia_version(), "mb": timing["motion_blur"]}


def partial_dir(job, quality) -> Path:
    return MB.cache_dir() / "partial" / f"{MB._base(job, quality)}-{sha(job['look'])}"


def _invoke(job, quality, work: Path):
    q = MB.QUALITY[quality]
    ctx_path, reads_path, out = work / "ctx.json", work / "reads.json", work / "clip.webm"
    write_json(ctx_path, job["ctxd"])
    env = _env(); env.update({"LOOM_SKIA_CTX": str(ctx_path), "LOOM_SKIA_READS": str(reads_path), "LOOM_FFMPEG": which("ffmpeg") or "ffmpeg"})
    if job.get("stills"):
        env["LOOM_STILLS"] = ",".join(f"{t:.3f}" for t in job["stills"])
    else:
        # frames persist between attempts (resumable); the directory is removed once the clip is stored
        env["LOOM_FRAMES_DIR"] = str(partial_dir(job, quality))
    samples, shutter = job["mb"] if quality == "final" else (1, 0.5)
    r = subprocess.run([MB._py(), str(RUNTIME / "render.py"), str(job["src"]), str(out), str(q["fps"]), str(q["scale"]), str(samples), str(shutter)],
                       cwd=work, env=env, capture_output=True, text=True, timeout=3600)
    if r.returncode != 0 or not (out.exists() or job.get("stills")):
        raise LoomError(f"{job['beat']}: the Skia render failed:\n{(r.stderr or r.stdout)[-1500:]}")
    reads = read_json(reads_path, None) if reads_path.exists() else None
    return out, reads or {"palette": {}, "fonts": {}, "raw": True}


def render_one(project, s, beat, style, force=False, quality="final") -> dict:
    t0 = time.time()
    job = _prepare(project, s, beat, style)
    if not force:
        for q in (["final", "draft"] if quality == "draft" else ["final"]):
            e = MB.lookup(job, q)
            if e:
                MB._place(project, job, e, q)
                return {"beat": job["beat"], "how": "store", "quality": q, "seconds": round(time.time() - t0, 2)}
    work = Path(tempfile.mkdtemp(prefix="loom_skia_"))
    try:
        info(f"skia: rendering {job['beat']} ({quality}, {job['w']}x{job['h']}, {job['dur']:.1f}s"
             + (f", motion blur x{job['mb'][0]}" if quality == "final" and job["mb"][0] > 1 else "") + ") ...")
        clip, reads = _invoke(job, quality, work)
        e = MB._store(job, quality, clip, reads, "rendered")
        MB._place(project, job, e, quality)
        shutil.rmtree(partial_dir(job, quality), ignore_errors=True)
    finally:
        shutil.rmtree(work, ignore_errors=True)
    return {"beat": job["beat"], "how": "rendered", "quality": quality, "seconds": round(time.time() - t0, 2),
            "reads": sorted(reads.get("palette", {})) if not reads.get("raw") else "all"}


def render_all(project, force=False, quality="final", jobs=None, skip_missing=False) -> list[dict]:
    sb = read_json(project.path("plan/storyboard.json"), {"scenes": []})
    todo = [s for s in sb["scenes"] if s["kind"] == "skia"]
    if skip_missing:   # a preview compose leaves out clips not written yet (see manim_bridge.render_all)
        todo = [s for s in todo if project.path((s.get("skia") or {}).get("file") or f"scenes/{s['beat']}_skia.py").exists()]
    if not todo:
        return []
    if not available():
        raise LoomError("this lesson has Skia scenes but skia-python is not installed: py -m pip install skia-python")
    tm = read_json(project.path("audio/timings.json"))
    beats = {b["id"]: b for b in tm["beats"]}
    style = load_style(sb.get("style") or project.request.get("style"))
    bid = sb.get("brand") or project.request.get("brand")
    if bid:
        from .brand import apply_brand, load_brand
        style = apply_brand(style, load_brand(bid))
    from concurrent.futures import ThreadPoolExecutor
    n = jobs or MB.default_jobs(len(todo))
    with ThreadPoolExecutor(max_workers=n) as ex:
        return list(ex.map(lambda s: render_one(project, s, beats[s["beat"]], style, force, quality), todo))
