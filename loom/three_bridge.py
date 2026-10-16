"""Three.js bridge (D-55): render storyboard scenes of kind 'three' (real-time 3D: devices, isometric
systems, objects that turn to show their sides) to transparent WebM clips, through headless Chromium.

Same contract and store as Manim and Skia: timing and look injected, clips keyed by source + timing + the
tokens the scene read, drafts for previews, optional motion blur.

    {"beat": "b09", "kind": "three", "three": {"file": "scenes/b09_three.js", "rect": [160, 110, 1600, 780],
     "params": {...}, "motion_blur": {"samples": 4, "shutter": 0.5}}}
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
from .render import hf_env
from .util import ENGINE_ROOT, LoomError, file_sha, info, read_json, run, sha, which, write_json

RUNTIME = ENGINE_ROOT / "runtime" / "three"
PRESETS = RUNTIME / "presets"


def presets() -> list[str]:
    """Ready Three.js scenes a storyboard can name instead of writing a file (D-140): runtime/three/presets/<id>.js."""
    return sorted(p.stem for p in PRESETS.glob("*.js")) if PRESETS.exists() else []


def scene_file(project, s: dict) -> Path:
    """The module a kind "three" beat renders: its preset (runtime/three/presets/<preset>.js) when it names one, else
    its own file (three.file, default scenes/<beat>_three.js)."""
    spec = s.get("three") or {}
    if spec.get("preset"):
        return PRESETS / f"{spec['preset']}.js"
    return project.path(spec.get("file") or f"scenes/{s['beat']}_three.js")


def preset_card(pid: str) -> dict:
    import json as _json
    f = PRESETS / f"{pid}.js"
    first = f.read_text(encoding="utf-8").split("\n", 1)[0] if f.exists() else ""
    m = re.match(r"//\s*@preset\s+(\{.*\})\s*$", first)
    if not m:
        raise LoomError(f"preset {pid}: the first line must be `// @preset {{...}}`")
    return _json.loads(m.group(1))


SCREEN_KINDS = ("blank", "notification", "code", "lock", "chat", "login", "alert", "list", "diff", "terminal", "link_hover", "prompt", "custom")


def preset_errors(s: dict) -> list[str]:
    """A preset beat's params against the preset's card: required params, choices, screen kinds (D-140)."""
    spec = s.get("three") or {}
    card = preset_card(spec["preset"])
    params = spec.get("params") or {}
    E = []
    for k, rule in (card.get("params") or {}).items():
        if not isinstance(rule, dict):
            continue
        v = params.get(k)
        if rule.get("required") and v in (None, ""):
            E.append(f"preset {spec['preset']}: params.{k} is required (one of {', '.join(rule.get('choices') or [])})")
        elif v is not None and rule.get("choices") and v not in rule["choices"]:
            E.append(f"preset {spec['preset']}: params.{k} '{v}' is not one of {', '.join(rule['choices'])}")
    for sp in [params.get("screen")] + [x.get("screen") for x in params.get("screens") or [] if isinstance(x, dict)]:
        if isinstance(sp, dict) and sp.get("kind") and sp["kind"] not in SCREEN_KINDS:
            E.append(f"preset {spec['preset']}: screen kind '{sp['kind']}' is not one of {', '.join(SCREEN_KINDS)}")
    for k, rule in (card.get("params") or {}).items():          # a library param names a model in assets/models3d
        if isinstance(rule, dict) and rule.get("library") and params.get(k):
            from .models3d import cards as _cards
            have = {c["id"]: c for c in _cards()}
            mc = have.get(params[k])
            if not mc:
                E.append(f"preset {spec['preset']}: params.{k} '{params[k]}' is not a library model (py -m loom models)")
            else:
                ks = set((mc.get("keys") or {}).keys()) | {"t"}
                bad = sorted({s.get("key") for s in params.get("states") or [] if isinstance(s, dict) and s.get("key") not in ks})
                if bad:
                    E.append(f"preset {spec['preset']}: {params[k]} has no keys {bad} (its keys: {', '.join(sorted(ks))})")
    unknown = sorted(set(params) - set(card.get("params") or {}) - {k for k in params if k.endswith("_at")})
    if unknown:
        E.append(f"preset {spec['preset']}: unknown params {unknown}")
    return E


def is_preset(s: dict) -> bool:
    return s.get("kind") == "three" and bool((s.get("three") or {}).get("preset"))


def three_version() -> str:
    p = ENGINE_ROOT / "node_modules" / "three" / "package.json"
    return read_json(p).get("version", "none") if p.exists() else "none"


def _runtime_sha() -> str:
    """The renderer plus the 3D toolkit and model library (D-138): a clip that may load a library model is stored
    under all of them, so a changed model is re-rendered, never reused stale."""
    from .models3d import library_sha
    return sha(file_sha(RUNTIME / "render.mjs"), library_sha())


def faces_of(style) -> list[dict]:
    """the style's (and brand's) font files, so text drawn inside a 3D scene is in the lesson's face"""
    out = []
    for f in style["fonts"].get("faces", []):
        p = Path(f["path"]) if f.get("path") else ENGINE_ROOT / "node_modules" / f["pkg"] / "files" / f["file"]
        if p.exists():
            out.append({"family": f["family"], "weight": f.get("weight", 400), "path": str(p)})
    return out


def _prepare(project, s, beat, style) -> dict:
    spec = s.get("three") or {}
    src = scene_file(project, s)
    if not src.exists():
        raise LoomError(f"{s['beat']}: Three.js scene not found: {src}" + (f" (presets: {', '.join(presets())})" if spec.get("preset") else ""))
    txt = src.read_text(encoding="utf-8")
    start = beat["start"] + float(spec.get("offset", 0.0))
    dur = round(beat["end"] - start + float(spec.get("spill", 1.6)), 3)
    words = C.beat_words(beat)
    names = C.collect_anchors(spec.get("params") or {}, []) + list(spec.get("cues") or [])
    code = re.sub(r"//.*|/\*[\s\S]*?\*/", "", txt)   # a cue named in a comment is not a cue (L-83)
    names += re.findall(r"""\bcue\(\s*["'`]([^"'`]+)["'`]""", code)
    cues = {}
    for a in dict.fromkeys(names):
        t, _ = C.resolve(a, words)
        if t is None:
            raise LoomError(f"{s['beat']}: Three.js cue '{a}' is not spoken in this beat. {C.suggest(a, words)}")
        cues[a] = round(t - start, 3)
    rect = spec.get("rect") or [96, 84, 1728, 846]
    w, h = int(rect[2]) // 2 * 2, int(rect[3]) // 2 * 2
    fonts = {"display": style["fonts"]["display"]["family"], "body": style["fonts"]["body"]["family"]}
    mb = spec.get("motion_blur") or {}
    ctxd = {"beat": s["beat"], "duration": dur, "cues": cues, "params": spec.get("params") or {}, "palette": style["palette"],
            "fonts": fonts, "faces": faces_of(style), "speech": [round(beat["speech_start"] - start, 3), round(beat["speech_end"] - start, 3)], "size": [w, h]}
    timing = {"duration": dur, "cues": cues, "params": ctxd["params"], "speech": ctxd["speech"], "size": [w, h],
              "motion_blur": [int(mb.get("samples", 1)), float(mb.get("shutter", 0.5))]}
    look = {"palette": dict(style["palette"]), "fonts": fonts, "font_files": []}
    return {"beat": s["beat"], "src": src, "src_sha": file_sha(src), "ctxd": ctxd, "rect": rect, "start": start, "dur": dur,
            "w": w, "h": h, "scene_class": None, "timing": timing, "look": look,
            # a hologram hero is also keyed on its look module, so a changed look never reuses a stale clip (other clips' keys unchanged)
            "runtime_sha": sha(_runtime_sha(), file_sha(RUNTIME / "holo.js")) if "holo." in txt or src.name == "holo_hero.js" else _runtime_sha(),
            "full": sha(ctxd), "engine": "three-" + three_version(), "mb": timing["motion_blur"]}


def _invoke(job, quality, work: Path):
    q = MB.QUALITY[quality]
    ctx_path, reads_path, out = work / "ctx.json", work / "reads.json", work / "clip.webm"
    write_json(ctx_path, job["ctxd"])
    samples, shutter = job["mb"] if quality == "final" else (1, 0.5)
    env = hf_env(); env["LOOM_FFMPEG"] = which("ffmpeg") or "ffmpeg"
    if job.get("stills"):
        env["LOOM_STILLS"] = ",".join(f"{t:.3f}" for t in job["stills"])
    elif job.get("frames_dir"):
        # frames persist between attempts (resumable, as Skia); the caller removes the directory once the clip is stored
        env["LOOM_FRAMES_DIR"] = str(job["frames_dir"])
    r = run([which("node"), str(RUNTIME / "render.mjs"), str(job["src"]), str(ctx_path), str(out), str(reads_path), str(q["fps"]), str(q["scale"]),
             str(samples), str(shutter)], cwd=ENGINE_ROOT, env=env, timeout=3600, check=False)
    if r.returncode != 0 or not (out.exists() or job.get("stills")):
        raise LoomError(f"{job['beat']}: the Three.js render failed:\n{((r.stderr or '') + (r.stdout or ''))[-1500:]}")
    reads = read_json(reads_path, None) if reads_path.exists() else None
    return out, reads or {"palette": {}, "fonts": {}, "raw": True}


def partial_dir(job, quality) -> Path:
    """Where an interrupted render keeps its finished frames (keyed like the clip store, so a changed scene, timing,
    look or model library starts clean)."""
    import os
    root = os.environ.get("LOOM_FRAMES_ROOT")          # scratch on a fast local disk, as the reel
    base = Path(root) / "three" if root else MB.cache_dir() / "partial"
    return base / f"three-{MB._base(job, quality)}-{sha(job['look'])}"


def render_one(project, s, beat, style, force=False, quality="final") -> dict:
    t0 = time.time()
    job = _prepare(project, s, beat, style)
    if not force:
        for q in (["final", "draft"] if quality == "draft" else ["final"]):
            e = MB.lookup(job, q)
            if e:
                MB._place(project, job, e, q)
                return {"beat": job["beat"], "how": "store", "quality": q, "seconds": round(time.time() - t0, 2)}
    work = Path(tempfile.mkdtemp(prefix="loom_three_"))
    try:
        info(f"three: rendering {job['beat']} ({quality}, {job['w']}x{job['h']}, {job['dur']:.1f}s) ...")
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
    todo = [s for s in sb["scenes"] if s["kind"] == "three"]
    if skip_missing:   # a preview compose leaves out clips not written yet (see manim_bridge.render_all)
        todo = [s for s in todo if scene_file(project, s).exists()]
    if not todo:
        return []
    if three_version() == "none":
        raise LoomError("this lesson has Three.js scenes but three is not installed: run npm install in the engine folder")
    tm = read_json(project.path("audio/timings.json"))
    beats = {b["id"]: b for b in tm["beats"]}
    style = load_style(sb.get("style") or project.request.get("style"))
    bid = sb.get("brand") or project.request.get("brand")
    if bid:
        from .brand import apply_brand, load_brand
        style = apply_brand(style, load_brand(bid))
    return [render_one(project, s, beats[s["beat"]], style, force, quality) for s in todo]


# ---------------------------------------------------------------- hologram heroes (hologram v2, 2026-10-16)
# Kshitij, 2026-10-16: "Things like bicycle, globes and things that can be visualized better in 3D: use the WebGL 3D
# layer. For others, push the SVG harder." A hero is the holo_hero preset (runtime/three/presets/holo_hero.js): one
# library model as projected light, rendered on black with real bloom, its brightness turned into alpha so it lays on
# the HUD's field as added light. The hologram engine places the clip behind its SVG HUD (H.hero3d) and points its
# locks and datums at the part boxes this exports (anchors, sampled every `step` seconds).

HERO = PRESETS / "holo_hero.js"


def hero(params: dict, style, size=(1100, 900), dur: float = 8.0, fps: int = 12, out: Path | None = None,
         stills: list[float] | None = None, step: float = 0.1, work: Path | None = None) -> dict:
    """Render one hologram hero: a transparent VP9 WebM of [0, dur] at fps (or PNG stills at the given times) and the
    anchors of its parts. Returns {webm | stills, anchors: [[t, {part: [x, y, w, h]}]], size, dur, fps, seconds}."""
    if three_version() == "none":
        raise LoomError("a hologram hero needs three: run npm install in the engine folder")
    t0 = time.time()
    st = load_style(style) if isinstance(style, str) else style
    w, h = int(size[0]) // 2 * 2, int(size[1]) // 2 * 2
    ctxd = {"beat": "hero", "duration": dur, "cues": {}, "params": params, "palette": st["palette"],
            "fonts": {"display": st["fonts"]["display"]["family"], "body": st["fonts"]["body"]["family"]},
            "faces": faces_of(st), "speech": [0, dur], "size": [w, h]}
    if params.get("geo"):                            # coastlines for a globe hero come in the context, never fetched
        ctxd["geo"] = read_json(ENGINE_ROOT / "assets/geo/world110m.json")
    own = work is None
    work = Path(work or tempfile.mkdtemp(prefix="loom_hero_"))
    work.mkdir(parents=True, exist_ok=True)
    try:
        ctx_path, reads_path, clip = work / "ctx.json", work / "reads.json", Path(out or work / "hero.webm")
        write_json(ctx_path, ctxd)
        env = hf_env(); env["LOOM_FFMPEG"] = which("ffmpeg") or "ffmpeg"
        env["LOOM_ANCHORS"] = f"0,{dur:.3f},{step:.3f}"
        if stills:
            env["LOOM_STILLS"] = ",".join(f"{t:.3f}" for t in stills)
        clip.parent.mkdir(parents=True, exist_ok=True)
        r = run([which("node"), str(RUNTIME / "render.mjs"), str(HERO), str(ctx_path), str(clip), str(reads_path), str(fps), "1", "1", "0.5"],
                cwd=ENGINE_ROOT, env=env, timeout=3600, check=False)
        if r.returncode != 0 or not (clip.exists() or stills):
            raise LoomError(f"hologram hero: the Three.js render failed:\n{((r.stderr or '') + (r.stdout or ''))[-1500:]}")
        reads = read_json(reads_path, {}) or {}
        res = {"anchors": reads.get("anchors") or [], "size": [w, h], "dur": dur, "fps": fps, "seconds": round(time.time() - t0, 2)}
        if stills:
            res["stills"] = {t: str(clip.parent / f"still_{t:.2f}.png") for t in stills}
        else:
            res["webm"] = str(clip)
        return res
    finally:
        if own and not stills:
            shutil.rmtree(work, ignore_errors=True) if out else None


def hero_specs(src: str) -> dict:
    """The heroes a hologram scene declares: its @lab header's "hero3d" (in a lesson, the beat's storyboard entry):
    {name: {"rect": [x, y, w, h], "dur": s, "fps": n, "params": {...holo_hero params}}}"""
    import json as _json
    m = re.search(r"@lab\s+(\{.*\})", src.split("\n", 1)[0])
    return (_json.loads(m.group(1)).get("hero3d") if m else None) or {}


def _hero_job(name: str, spec: dict, style, fps: int) -> dict:
    """The clip-store job of one hero: keyed on its spec (params, size, duration, fps), its model file, the hologram look
    module, the preset and the renderer (the runtime hash), like every other clip."""
    from .models3d import LIB
    st = load_style(style) if isinstance(style, str) else style
    params = spec.get("params") or {}
    rect = spec.get("rect") or [410, 90, 1100, 900]
    w, h = int(rect[2]) // 2 * 2, int(rect[3]) // 2 * 2
    dur = float(spec.get("dur") or 8.0)
    model = LIB / f"{params.get('model', '')}.js"
    timing = {"duration": dur, "params": params, "size": [w, h], "fps": fps, "kind": "hero3d"}
    look = {"palette": dict(st["palette"]), "fonts": {"display": st["fonts"]["display"]["family"], "body": st["fonts"]["body"]["family"]}, "font_files": []}
    return {"beat": f"hero_{name}", "src": HERO, "src_sha": sha(file_sha(HERO), file_sha(model) if model.exists() else "nomodel"),
            "timing": timing, "look": look, "runtime_sha": sha(_runtime_sha(), file_sha(RUNTIME / "holo.js")),
            "full": sha(timing, look), "engine": "three-" + three_version(), "style": st, "rect": rect, "w": w, "h": h, "dur": dur, "fps": fps}


def hero_cached(name: str, spec: dict, style, fps: int | None = None, force: bool = False) -> dict:
    """One hero through the shared clip store (the Manim, Skia and Three store): a stored clip and its anchors are
    reused when the spec, the model, the look and the runtime are unchanged; otherwise it is rendered and stored.
    Returns {clip (a path in the store), anchors, size, rect, dur, fps, how: "store" | "rendered", seconds}."""
    t0 = time.time()
    f = int(fps or spec.get("fps") or 30)
    job = _hero_job(name, spec, style, f)
    e = None if force else MB.lookup(job, "final")
    if e:
        an = read_json(MB.cache_dir() / f"{e['id']}.anchors.json", None)
        if an is not None:
            return {"clip": MB.cache_dir() / e["clip"], "anchors": an, "size": [job["w"], job["h"]], "rect": job["rect"], "dur": job["dur"], "fps": f,
                    "how": "store", "seconds": round(time.time() - t0, 2)}
    work = Path(tempfile.mkdtemp(prefix="loom_hero_"))
    try:
        r = hero(spec.get("params") or {}, job["style"], size=(job["w"], job["h"]), dur=job["dur"], fps=f, out=work / "hero.webm", work=work)
        reads = read_json(work / "reads.json", {}) if (work / "reads.json").exists() else {}
        reads = {"palette": (reads or {}).get("palette") or {}, "fonts": (reads or {}).get("fonts") or {}, "raw": False}
        e = MB._store(job, "final", work / "hero.webm", reads, "rendered")
        write_json(MB.cache_dir() / f"{e['id']}.anchors.json", r["anchors"])
        return {"clip": MB.cache_dir() / e["clip"], "anchors": r["anchors"], "size": [job["w"], job["h"]], "rect": job["rect"], "dur": job["dur"], "fps": f,
                "how": "rendered", "seconds": round(time.time() - t0, 2)}
    finally:
        shutil.rmtree(work, ignore_errors=True)


def hero_assets(specs: dict, style, out_dir: Path, src_base: str = "media/", prefix: str = "hero_", fps: int | None = None, t0: float = 0.0) -> dict:
    """Every hero of a scene, cached, copied into out_dir as <prefix><name>.webm: what the page needs as
    Loom.assets.hero3d, {name: {src, rect, dur, fps, size, anchors, t0, how, seconds}}. src is relative to the page
    (src_base + file name); t0 is the timeline time the clip's 0 is (the beat's start in a lesson, 0 in the lab)."""
    out = {}
    out_dir = Path(out_dir); out_dir.mkdir(parents=True, exist_ok=True)
    for name, spec in (specs or {}).items():
        r = hero_cached(name, spec, style, fps=fps)
        dst = out_dir / f"{prefix}{name}.webm"
        shutil.copy2(r["clip"], dst)
        out[name] = {"src": f"{src_base}{dst.name}", "rect": r["rect"], "dur": r["dur"], "fps": r["fps"], "size": r["size"], "anchors": r["anchors"],
                     "t0": round(float(t0) + float(spec.get("at") or 0), 3), "how": r["how"], "seconds": r["seconds"]}
    return out


def hero_lab_strip(file, times: list[float] | None = None, out_dir=None, frames_dir=None, style: str = "hologram", fps: int | None = None) -> dict:
    """The lab strip of a hologram scene with 3D heroes. The lab page renders a scene's hero3d itself now (loom/lab.py,
    through hero_assets and the clip store); this stays as the named entry point and adds the time it took."""
    from . import lab as LB
    t0 = time.time()
    r = LB.strip(None, style, times, out_dir=out_dir, frames_dir=frames_dir, file=file)
    r["seconds"] = {"total": round(time.time() - t0, 2)}
    return r
