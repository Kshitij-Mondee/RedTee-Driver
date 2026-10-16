"""Page bridge (D-176): storyboard scenes of kind "page" rendered to transparent WebM clips.

The escape hatch for a beat Loom's runtime cannot draw yet (a real map, a laid-out diagram, a formula, highlighted
code, a terminal, stroke-written lettering, a morph): any ES module page that renders a frame for a time, with the
libraries Kshitij approved on 2026-10-15 (runtime/page/libs.json) and the kit around them (runtime/page/kit.js).
It runs in headless Chromium like the Three.js clips and shares their contract and store: timing and look injected,
clips keyed by source + timing + library versions + the tokens the scene read, drafts for previews.

    {"beat": "b09", "kind": "page", "page": {"file": "scenes/b09_page.js", "rect": [160, 110, 1600, 780],
     "libs": ["d3", "topojson"], "params": {...}, "cues": ["the signal"], "offset": 0, "spill": 1.6}}

A clip is a sealed picture: its parts cannot be held into the next beat, the layout probe cannot read its words, and
a restyle re-renders it. So normal teaching beats stay bespoke scenes; a page clip is for what the runtime lacks.
"""
from __future__ import annotations

import re
import shutil
import tempfile
import time
from pathlib import Path

from . import cues as C
from . import manim_bridge as MB
from .compose import load_style
from .engines import FORBIDDEN
from .render import hf_env
from .util import ENGINE_ROOT, LoomError, file_sha, info, read_json, run, sha, which, write_json

RUNTIME = ENGINE_ROOT / "runtime" / "page"


def libs() -> dict:
    d = read_json(RUNTIME / "libs.json")
    d.pop("_doc", None)
    return d


def lib_versions(names) -> dict:
    """{library: installed npm version}; 'missing' for a library not installed"""
    out = {}
    L = libs()
    for n in sorted(set(names or [])):
        pk = (L.get(n) or {}).get("pkg")
        pj = ENGINE_ROOT / "node_modules" / pk / "package.json" if pk else None
        out[n] = read_json(pj).get("version", "?") if pj and pj.exists() else "missing"
    return out


def scene_file(project, s: dict) -> Path:
    spec = s.get("page") or {}
    return project.path(spec.get("file") or f"scenes/{s['beat']}_page.js")


def lint_scene(src: str, name: str = "page scene") -> list[str]:
    """a page scene stays a pure function of time: no Math.random, clock, timers, animation frames or network
    (P.rng, the t it is given, and P.data for local files)"""
    code = re.sub(r"/\*[\s\S]*?\*/", " ", src)
    code = re.sub(r"(^|[^:\"'])//[^\n]*", r"\1", code)
    E = [f"{name}: uses {what}; frames must be a pure function of time" for pat, what in FORBIDDEN if re.search(pat, code)]
    if not re.search(r"export\s+(async\s+)?function\s+build\b|export\s+const\s+build\b", code):
        E.append(f"{name}: must export build(ctx, P) returning {{ render(t) }}")
    return E


def spec_errors(s: dict) -> list[str]:
    """the storyboard's page spec: known libraries, all installed"""
    spec = s.get("page") or {}
    E = []
    have = libs()
    for n in spec.get("libs") or []:
        if n not in have:
            E.append(f"page: unknown library '{n}' (have: {', '.join(sorted(have))})")
    miss = [n for n, v in lib_versions([n for n in spec.get("libs") or [] if n in have]).items() if v == "missing"]
    if miss:
        E.append(f"page: libraries not installed: {', '.join(miss)} (run npm install in the engine folder)")
    return E


def _runtime_sha() -> str:
    return sha(file_sha(RUNTIME / "render.mjs"), file_sha(RUNTIME / "kit.js"), file_sha(RUNTIME / "libs.json"))


def faces_of(style) -> list[dict]:
    """the style's (and brand's) font files, so text in the page is in the lesson's face"""
    out = []
    for f in style["fonts"].get("faces", []):
        p = Path(f["path"]) if f.get("path") else ENGINE_ROOT / "node_modules" / f["pkg"] / "files" / f["file"]
        if p.exists():
            out.append({"family": f["family"], "weight": f.get("weight", 400), "path": str(p)})
    return out


def code_tokens(blocks: list[dict]) -> list[dict]:
    """Shiki tokens for each {code, lang, theme} (tools/node/shiki_tokens.mjs), made before the render"""
    if not blocks:
        return []
    work = Path(tempfile.mkdtemp(prefix="loom_shiki_"))
    try:
        write_json(work / "in.json", blocks)
        r = run([which("node"), str(ENGINE_ROOT / "tools" / "node" / "shiki_tokens.mjs"), str(work / "in.json"), str(work / "out.json")],
                cwd=ENGINE_ROOT, timeout=300, check=False)
        if r.returncode != 0 or not (work / "out.json").exists():
            raise LoomError(f"code highlighting failed: {((r.stderr or '') + (r.stdout or ''))[-800:]}")
        return read_json(work / "out.json")
    finally:
        shutil.rmtree(work, ignore_errors=True)


def make_ctx(style: dict, dur: float, size, params: dict, cues: dict, speech, libs_: list, beat: str = "lab") -> dict:
    params = dict(params or {})
    if params.get("code"):   # code blocks become coloured tokens here, so the page loads no highlighter
        blocks = params["code"] if isinstance(params["code"], list) else [params["code"]]
        params["code"] = code_tokens([{"code": b.get("code", ""), "lang": b.get("lang", "text"), "theme": b.get("theme", "github-light")} for b in blocks])
    fonts = {"display": style["fonts"]["display"]["family"], "body": style["fonts"]["body"]["family"],
             "mono": (style["fonts"].get("mono") or {}).get("family") or "monospace"}
    return {"beat": beat, "duration": dur, "cues": cues, "params": params, "palette": style["palette"], "fonts": fonts,
            "faces": faces_of(style), "speech": speech, "size": [int(size[0]), int(size[1])], "libs": list(libs_ or [])}


def _prepare(project, s, beat, style) -> dict:
    spec = s.get("page") or {}
    src = scene_file(project, s)
    if not src.exists():
        raise LoomError(f"{s['beat']}: page scene not found: {src}")
    E = spec_errors(s) + lint_scene(src.read_text(encoding="utf-8"), src.name)
    if E:
        raise LoomError(f"{s['beat']}: " + "; ".join(E))
    txt = src.read_text(encoding="utf-8")
    start = beat["start"] + float(spec.get("offset", 0.0))
    dur = round(beat["end"] - start + float(spec.get("spill", 1.6)), 3)
    words = C.beat_words(beat)
    names = C.collect_anchors(spec.get("params") or {}, []) + list(spec.get("cues") or [])
    code = re.sub(r"//.*|/\*[\s\S]*?\*/", "", txt)
    names += re.findall(r"""\bcue\(\s*["'`]([^"'`]+)["'`]""", code)
    cues = {}
    for a in dict.fromkeys(names):
        t, _ = C.resolve(a, words)
        if t is None:
            raise LoomError(f"{s['beat']}: page cue '{a}' is not spoken in this beat. {C.suggest(a, words)}")
        cues[a] = round(t - start, 3)
    rect = spec.get("rect") or [96, 84, 1728, 846]
    w, h = int(rect[2]) // 2 * 2, int(rect[3]) // 2 * 2
    speech = [round(beat["speech_start"] - start, 3), round(beat["speech_end"] - start, 3)]
    ctxd = make_ctx(style, dur, (w, h), spec.get("params") or {}, cues, speech, spec.get("libs") or [], s["beat"])
    timing = {"duration": dur, "cues": cues, "params": ctxd["params"], "speech": speech, "size": [w, h], "libs": ctxd["libs"]}
    look = {"palette": dict(style["palette"]), "fonts": ctxd["fonts"], "font_files": []}
    return {"beat": s["beat"], "src": src, "src_sha": file_sha(src), "ctxd": ctxd, "rect": rect, "start": start, "dur": dur,
            "w": w, "h": h, "scene_class": None, "timing": timing, "look": look, "runtime_sha": _runtime_sha(),
            "full": sha(ctxd), "engine": "page-" + sha(lib_versions(ctxd["libs"]))}


def _invoke(job, quality, work: Path):
    q = MB.QUALITY[quality]
    ctx_path, reads_path, out = work / "ctx.json", work / "reads.json", work / "clip.webm"
    ctxd = dict(job["ctxd"])
    if "libs" not in ctxd:
        ctxd["libs"] = []
    write_json(ctx_path, ctxd)
    env = hf_env(); env["LOOM_FFMPEG"] = which("ffmpeg") or "ffmpeg"
    if job.get("stills"):
        env["LOOM_STILLS"] = ",".join(f"{t:.3f}" for t in job["stills"])
    elif job.get("frames_dir"):
        env["LOOM_FRAMES_DIR"] = str(job["frames_dir"])
    r = run([which("node"), str(RUNTIME / "render.mjs"), str(job["src"]), str(ctx_path), str(out), str(reads_path), str(q["fps"]), str(q["scale"])],
            cwd=ENGINE_ROOT, env=env, timeout=3600, check=False)
    if r.returncode != 0 or not (out.exists() or job.get("stills")):
        raise LoomError(f"{job['beat']}: the page render failed:\n{((r.stderr or '') + (r.stdout or ''))[-1500:]}")
    reads = read_json(reads_path, None) if reads_path.exists() else None
    return out, reads or {"palette": {}, "fonts": {}, "raw": True}


def partial_dir(job, quality) -> Path:
    import os
    root = os.environ.get("LOOM_FRAMES_ROOT")
    base = Path(root) / "page" if root else MB.cache_dir() / "partial"
    return base / f"page-{MB._base(job, quality)}-{sha(job['look'])}"


def render_one(project, s, beat, style, force=False, quality="final") -> dict:
    t0 = time.time()
    job = _prepare(project, s, beat, style)
    if not force:
        for q in (["final", "draft"] if quality == "draft" else ["final"]):
            e = MB.lookup(job, q)
            if e:
                MB._place(project, job, e, q)
                return {"beat": job["beat"], "how": "store", "quality": q, "seconds": round(time.time() - t0, 2)}
    work = Path(tempfile.mkdtemp(prefix="loom_page_"))
    try:
        info(f"page: rendering {job['beat']} ({quality}, {job['w']}x{job['h']}, {job['dur']:.1f}s, libs {job['ctxd']['libs']}) ...")
        job["frames_dir"] = partial_dir(job, quality)
        clip, reads = _invoke(job, quality, work)
        e = MB._store(job, quality, clip, reads, "rendered")
        MB._place(project, job, e, quality)
        shutil.rmtree(job["frames_dir"], ignore_errors=True)
    finally:
        shutil.rmtree(work, ignore_errors=True)
    return {"beat": job["beat"], "how": "rendered", "quality": quality, "seconds": round(time.time() - t0, 2),
            "reads": sorted(reads.get("palette", {})) if not reads.get("raw") else "all"}


def render_all(project, force=False, quality="final", jobs=None, skip_missing=False) -> list[dict]:
    sb = read_json(project.path("plan/storyboard.json"), {"scenes": []})
    todo = [s for s in sb["scenes"] if s["kind"] == "page"]
    if skip_missing:
        todo = [s for s in todo if scene_file(project, s).exists()]
    if not todo:
        return []
    tm = read_json(project.path("audio/timings.json"))
    beats = {b["id"]: b for b in tm["beats"]}
    style = load_style(sb.get("style") or project.request.get("style"))
    bid = sb.get("brand") or project.request.get("brand")
    if bid:
        from .brand import apply_brand, load_brand
        style = apply_brand(style, load_brand(bid))
    return [render_one(project, s, beats[s["beat"]], style, force, quality) for s in todo]
