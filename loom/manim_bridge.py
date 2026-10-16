"""Manim bridge: render storyboard scenes of kind 'manim' to transparent WebM clips.

Timing and style are INJECTED (a JSON context file), so the same scene file re-times itself
when the narration changes and restyles itself when the style pack changes.

Speed (D-37 to D-40). A Manim clip has its colours baked into its pixels, so a new look normally means
drawing every frame again. Three things keep that to the minimum:
1. READ-PRECISE REUSE. While a scene renders, loom_manim records exactly which colour tokens and font
   keys it read. A clip is reused for any later look whose values for THOSE reads are unchanged: a brand
   that only changes a colour this scene never uses costs nothing.
2. ONE SHARED STORE. Clips live in the engine's cache (`cache/manim/`, or $LOOM_CACHE_DIR), keyed by the
   scene source, its timing and its reads. Copies of a lesson, brand previews and going back to an earlier
   look all reuse what was already drawn. Project `media/` holds a copy of the clip in use.
3. DRAFTS FOR PREVIEWS, AND PARALLEL WORK. Restyle previews use a DRAFT clip (6 fps, half size; about
   5x faster). A draft can never reach a video: check and render re-make every draft at full quality
   first, and render refuses a manifest that still holds one. Scenes render in parallel ($LOOM_MANIM_JOBS).
The store is a cache, never the source of truth: deleting it only costs time (`py -m loom cache`).
"""
from __future__ import annotations

import datetime as _dt
import os
import re
import shutil
import tempfile
import threading
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from . import cues as C
from .compose import load_style
from .util import ENGINE_ROOT, LoomError, file_lock, file_sha, info, read_json, run, sha, which, write_json


def _manim_cmd() -> list[str]:
    exe = which("manim")
    if exe:
        return [exe]
    from .util import py_exe
    return [py_exe(), "-m", "manim"]


def _ttf_fonts(style) -> list[str]:
    """Manim renders text through Pango, which needs TTF/OTF: convert the style's WOFF faces once."""
    out = []
    cache = ENGINE_ROOT / "models" / "fonts"
    cache.mkdir(parents=True, exist_ok=True)
    for f in style["fonts"].get("faces", []):
        woff = ENGINE_ROOT / "node_modules" / f["pkg"] / "files" / f["file"].replace(".woff2", ".woff")
        ttf = cache / (Path(f["file"]).stem + ".ttf")
        if not ttf.exists() and woff.exists():
            try:
                from fontTools.ttLib import TTFont
                ft = TTFont(str(woff)); ft.flavor = None; ft.save(str(ttf))
            except Exception:
                continue
        if ttf.exists():
            out.append(str(ttf))
    return out


CLIP_KINDS = ("manim", "skia", "three", "page")   # scene kinds rendered to a transparent clip the camera carries
QUALITY = {"final": {"fps": 30, "scale": 1.0}, "draft": {"fps": 6, "scale": 0.5}}
# loom_manim.py versions whose frames are identical to today's (only the read recorder was added after
# 24fe6aa1): clips they rendered are adopted into the store without drawing them again (see _adopt)
LEGACY_RUNTIME_SHAS = {"24fe6aa174943eef"}
_STORE_LOCK = threading.Lock()


def cache_dir() -> Path:
    d = Path(os.environ.get("LOOM_CACHE_DIR") or (ENGINE_ROOT / "cache")) / "manim"
    d.mkdir(parents=True, exist_ok=True)
    return d


def _manim_version() -> str:
    try:
        import manim
        return str(manim.__version__)
    except Exception:  # noqa: BLE001 - not installed: the key still differs from any real render
        return "none"


def scene_source(project, s) -> Path:
    spec = s.get("manim") or {}
    if spec.get("blueprint"):
        return ENGINE_ROOT / "runtime/manim/blueprints" / (spec["blueprint"].split(".", 1)[-1] + ".py")
    return project.path(spec.get("file") or f"scenes/{s['beat']}.py")


def _prepare(project, s, beat, style) -> dict:
    """Everything a render of this scene depends on, split into TIMING (the base key) and LOOK (matched
    against what the scene actually read)."""
    spec = s.get("manim") or {}
    src = scene_source(project, s)
    if not src.exists():
        raise LoomError(f"{s['beat']}: Manim scene file not found: {src}")
    from .checks.manim_colours import check_source
    bad = check_source(src.read_text(encoding="utf-8"), src.name)
    if bad:
        raise LoomError(f"{s['beat']}: " + "; ".join(bad[:5]))
    offset = float(spec.get("offset", 0.0))
    start = beat["start"] + offset
    # spill: the clip holds its last state past the beat, so a zoom/continue join into the next
    # beat never shows the clip vanishing mid-move (station visibility hides it later)
    dur = round(beat["end"] - start + float(spec.get("spill", 1.6)), 3)
    words = C.beat_words(beat)
    cue_names = C.collect_anchors(spec.get("params") or {}, []) + C.collect_anchors({"say": spec.get("cues") or []}, [])
    for a in spec.get("cues") or []:
        cue_names.append(a)
    txt = src.read_text(encoding="utf-8")
    cue_names += re.findall(r"""(?:wait_until|cue)\(\s*["']([^"']+)["']""", txt)
    # a module-level CUES = ["...", ...] list declares cues used through variables
    for block in re.findall(r"CUES\s*=\s*\[(.*?)\]", txt, re.S):
        cue_names += re.findall(r"""["']([^"']+)["']""", block)
    cues = {}
    for a in dict.fromkeys(cue_names):
        t, how = C.resolve(a, words)
        if t is None:
            raise LoomError(f"{s['beat']}: Manim cue '{a}' is not spoken in this beat. {C.suggest(a, words)}")
        cues[a] = round(t - start, 3)
    rect = spec.get("rect") or [96, 84, 1728, 846]
    w, h = int(rect[2]), int(rect[3])
    w -= w % 2; h -= h % 2
    fonts = {"display": style["fonts"]["display"]["family"], "body": style["fonts"]["body"]["family"]}
    font_files = _ttf_fonts(style)
    ctxd = {"beat": s["beat"], "duration": dur, "cues": cues, "params": spec.get("params") or {},
            "palette": style["palette"], "fonts": fonts, "font_files": font_files,
            "speech": [round(beat["speech_start"] - start, 3), round(beat["speech_end"] - start, 3)], "size": [w, h]}
    runtime = ENGINE_ROOT / "runtime/manim/loom_manim.py"
    timing = {"duration": dur, "cues": cues, "params": ctxd["params"], "speech": ctxd["speech"], "size": [w, h],
              "scene_class": spec.get("scene_class", "Main")}
    look = {"palette": dict(style["palette"]), "fonts": fonts, "font_files": [file_sha(f) for f in font_files]}
    return {"beat": s["beat"], "src": src, "src_sha": file_sha(src), "ctxd": ctxd, "rect": rect, "start": start, "dur": dur,
            "w": w, "h": h, "scene_class": timing["scene_class"], "timing": timing, "look": look,
            "runtime_sha": file_sha(runtime), "full": sha(ctxd)}


def _base(job, quality) -> str:
    # job["engine"] names another clip renderer (skia, three) sharing this store; Manim jobs keep their old keys
    return sha(job["src_sha"], job["timing"], job["runtime_sha"], job.get("engine") or _manim_version(), QUALITY[quality])


def _py() -> str:
    from .util import py_exe
    return py_exe()


def _matches(entry, job) -> bool:
    r = entry["reads"]
    if r.get("raw"):
        return entry.get("full") == job["full"]
    L = job["look"]
    if any(L["palette"].get(k) != v for k, v in r.get("palette", {}).items()):
        return False
    if any(L["fonts"].get(k) != v for k, v in r.get("fonts", {}).items()):
        return False
    if r.get("fonts") and entry.get("font_files") != L["font_files"]:
        return False
    return True


def _index_path(base) -> Path:
    return cache_dir() / f"{base}.json"


def lookup(job, quality) -> dict | None:
    """The stored clip for this scene, timing and quality whose recorded reads agree with this look."""
    idx = read_json(_index_path(_base(job, quality)), {}) or {}
    for e in idx.get("entries", []):
        if _matches(e, job) and (cache_dir() / e["clip"]).exists():
            return dict(e, quality=quality)
    return None


def _store(job, quality, clip: Path, reads: dict, how: str) -> dict:
    base = _base(job, quality)
    eid = sha(base, reads, job["full"] if reads.get("raw") else None, job["look"]["font_files"] if reads.get("fonts") else None)
    entry = {"id": eid, "clip": f"{eid}.webm", "reads": reads, "full": job["full"] if reads.get("raw") else None,
             "font_files": job["look"]["font_files"] if reads.get("fonts") else None, "beat": job["beat"],
             "source": str(job["src"].name), "made_by": how, "quality": quality,
             "created": _dt.datetime.now().isoformat(timespec="seconds")}
    with _STORE_LOCK, file_lock(cache_dir() / ".lock"):
        dst = cache_dir() / entry["clip"]
        if not dst.exists():
            shutil.copy2(clip, dst)
        idx = read_json(_index_path(base), {}) or {"base": base, "entries": []}
        if not any(e["id"] == eid for e in idx["entries"]):
            idx["entries"].append(entry)
            write_json(_index_path(base), idx)
    return entry


def _adopt(project, job) -> dict | None:
    """A clip rendered before the store existed, by a runtime whose frames are identical: its stamp is the
    old whole-context key. Adopt it with reads = the WHOLE context (raw), which is exactly as strict as the
    old cache was, so nothing is drawn again and nothing stale can be reused."""
    media = project.path("media")
    clip, stamp = media / f"{job['beat']}.webm", media / f"{job['beat']}.hash"
    if not (clip.exists() and stamp.exists()):
        return None
    old = stamp.read_text().strip()
    for rt in LEGACY_RUNTIME_SHAS:
        if old == sha(job["src_sha"], job["ctxd"], rt):
            return _store(job, "final", clip, {"palette": {}, "fonts": {}, "raw": True}, "adopted")
    return None


def _invoke_manim(job, quality, work: Path) -> tuple[Path, dict]:
    """Run ManimCE once. Returns (clip, reads). The only function that draws; tests replace it."""
    q = QUALITY[quality]
    w = max(2, int(job["w"] * q["scale"])); h = max(2, int(job["h"] * q["scale"]))
    w -= w % 2; h -= h % 2
    ctx_path, reads_path = work / "ctx.json", work / "reads.json"
    write_json(ctx_path, job["ctxd"])
    shutil.copy2(ENGINE_ROOT / "runtime/manim/loom_manim.py", work / "loom_manim.py")
    shutil.copy2(job["src"], work / "scene.py")
    cmd = _manim_cmd() + ["render", "--format", "webm", "--transparent", "--fps", str(q["fps"]), "-r", f"{w},{h}", "--disable_caching",
                          "--media_dir", str(work / "media"), "-o", "clip", "scene.py", job["scene_class"]]
    env = {"LOOM_MANIM_CTX": str(ctx_path), "LOOM_MANIM_READS": str(reads_path),
           "PYTHONPATH": str(work) + os.pathsep + os.environ.get("PYTHONPATH", "")}
    run(cmd, cwd=work, env=env, timeout=1800)
    found = list((work / "media").rglob("clip.webm"))
    if not found:
        raise LoomError(f"{job['beat']}: manim produced no clip")
    reads = read_json(reads_path, None) if reads_path.exists() else None
    if not reads:
        # no record (an old runtime, or the process died before exit): depend on everything
        reads = {"palette": {}, "fonts": {}, "raw": True}
    return found[0], reads


def _place(project, job, entry, quality):
    media = project.path("media"); media.mkdir(exist_ok=True)
    clip, stamp = media / f"{job['beat']}.webm", media / f"{job['beat']}.hash"
    if not (clip.exists() and stamp.exists() and stamp.read_text().strip() == entry["id"]):
        shutil.copy2(cache_dir() / entry["clip"], clip)
        stamp.write_text(entry["id"])
    write_json(media / f"{job['beat']}.json", {"start": job["start"], "duration": job["dur"], "rect": job["rect"], "quality": quality})
    return clip


def render_one(project, s, beat, style, force=False, quality: str = "final") -> dict:
    """Make sure media/<beat>.webm shows this scene in this look. Returns {beat, how, quality, seconds}:
    how is 'store' (reused), 'adopted' (an older clip taken into the store), or 'rendered'.
    A draft request is satisfied by a FINAL clip when one exists (it is better and free)."""
    import time
    if quality not in QUALITY:
        raise LoomError(f"unknown Manim quality '{quality}' (final or draft)")
    t0 = time.time()
    job = _prepare(project, s, beat, style)
    if not force:
        for q in (["final", "draft"] if quality == "draft" else ["final"]):
            e = lookup(job, q)
            if e:
                _place(project, job, e, q)
                return {"beat": job["beat"], "how": "store", "quality": q, "seconds": round(time.time() - t0, 2)}
        e = _adopt(project, job)
        if e:
            _place(project, job, e, "final")
            return {"beat": job["beat"], "how": "adopted", "quality": "final", "seconds": round(time.time() - t0, 2)}
    work = Path(tempfile.mkdtemp(prefix="loom_manim_"))
    try:
        info(f"manim: rendering {job['beat']} ({quality}, {job['w']}x{job['h']}, {job['dur']:.1f}s) ...")
        clip, reads = _invoke_manim(job, quality, work)
        e = _store(job, quality, clip, reads, "rendered")
        _place(project, job, e, quality)
    finally:
        shutil.rmtree(work, ignore_errors=True)
    return {"beat": job["beat"], "how": "rendered", "quality": quality, "seconds": round(time.time() - t0, 2),
            "reads": sorted(reads.get("palette", {})) if not reads.get("raw") else "all"}


def default_jobs(n: int) -> int:
    env = os.environ.get("LOOM_MANIM_JOBS")
    if env:
        return max(1, int(env))
    return max(1, min(n, os.cpu_count() or 1, 4))


def render_all(project, force: bool = False, quality: str = "final", jobs: int | None = None, skip_missing: bool = False) -> list[dict]:
    """skip_missing: a preview compose (an agent's snapshot) leaves out clips whose file is not written yet; parallel clip
    writers made every scene author's snapshot fail (Shuttle S0, 2026-10-08)."""
    sbp = project.path("plan/storyboard.json")
    if not sbp.exists():
        return []
    sb = read_json(sbp)
    todo = [s for s in sb["scenes"] if s["kind"] == "manim"]
    if skip_missing:
        todo = [s for s in todo if scene_source(project, s).exists()]
    if not todo:
        return []
    tm = read_json(project.path("audio/timings.json"))
    beats = {b["id"]: b for b in tm["beats"]}
    style = load_style(sb.get("style") or project.request.get("style"))
    # the brand is layered exactly as compose layers it (L-68: before 2026-09-30 the bridge skipped this,
    # so a Manim clip under a brand kept the style's own colours)
    brand_id = sb.get("brand") or project.request.get("brand")
    if brand_id:
        from .brand import apply_brand, load_brand
        style = apply_brand(style, load_brand(brand_id))
    n = jobs or default_jobs(len(todo))
    if n == 1:
        res = [render_one(project, s, beats[s["beat"]], style, force, quality) for s in todo]
    else:
        with ThreadPoolExecutor(max_workers=n) as ex:
            res = list(ex.map(lambda s: render_one(project, s, beats[s["beat"]], style, force, quality), todo))
    for r in res:
        if r["how"] != "rendered":
            info(f"manim: {r['beat']} reused ({r['how']}, {r['quality']})")
    return res


def media_quality(project) -> dict:
    """{beat: 'final'|'draft'} for this project's Manim clips as they are now."""
    sb = read_json(project.path("plan/storyboard.json"), {"scenes": []})
    out = {}
    for s in sb["scenes"]:
        if s["kind"] in CLIP_KINDS:
            meta = read_json(project.path(f"media/{s['beat']}.json"), {}) or {}
            out[s["beat"]] = meta.get("quality", "final")
    return out


def has_draft(project) -> bool:
    return any(q == "draft" for q in media_quality(project).values())


def store_status() -> dict:
    d = cache_dir()
    entries = []
    for f in sorted(d.glob("*.json")):
        for e in (read_json(f, {}) or {}).get("entries", []):
            c = d / e["clip"]
            entries.append(dict(e, bytes=c.stat().st_size if c.exists() else 0, index=f.name))
    return {"dir": str(d), "entries": entries, "bytes": sum(e["bytes"] for e in entries)}


def referenced_ids() -> set:
    from .project import projects_root
    return {h.read_text().strip() for h in projects_root().glob("*/media/*.hash")}


def prune(days: float = 30.0, all_unused: bool = False) -> dict:
    """Remove store entries no project uses (and, unless all_unused, older than `days`)."""
    d = cache_dir(); keep = referenced_ids(); removed = []
    cutoff = _dt.datetime.now() - _dt.timedelta(days=days)
    with _STORE_LOCK, file_lock(d / ".lock"):
        for f in sorted(d.glob("*.json")):
            idx = read_json(f, {}) or {}
            left = []
            for e in idx.get("entries", []):
                old = _dt.datetime.fromisoformat(e.get("created", "1970-01-01T00:00:00")) < cutoff
                if e["id"] not in keep and (all_unused or old):
                    (d / e["clip"]).unlink(missing_ok=True); removed.append(e["id"])
                else:
                    left.append(e)
            if left:
                idx["entries"] = left; write_json(f, idx)
            else:
                f.unlink()
    return {"removed": removed, "kept": len(keep)}
