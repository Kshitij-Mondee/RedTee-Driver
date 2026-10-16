"""loom reel (D-63): a short showcase video cut from the engine's own lab scenes and clip scenes.

    py -m loom reel docs/styles/reels/styles_2026-09-30.json [--only 3] [--list]

A reel SPEC lists segments; each is rendered by the engine's real renderers, never drawn by hand:
  {"kind": "lab",   "scene": "lab_depth", "style": "cinematic-noir", "from": 0.6, "to": 3.6, "label": "...", "sub": "...", "fx": {}}
  {"kind": "skia",  "scene": "hero_orb",  "style": "flat-cosmos", "from": 0.3, "to": 3.3, "label": "..."}
  {"kind": "three", "scene": "device_turn", "style": "engineering", "from": 0.0, "to": 3.0, "label": "..."}
Lab segments are seeked frame by frame in headless Chrome (the same page the motion lab uses); clip segments
go through the Skia or Three.js renderer and are composited over the style's field. Each segment gets a
lower-third label and a dip, is cached by the hash of everything it reads (cache/reel/), and the reel is the
concatenation plus a synthesised music bed (loom/narrate/mix.py), loudness-normalised.
Segments are resumable: a run that is cut short keeps finished segments (and Skia's frames) for the next run.
"""
from __future__ import annotations

import hashlib
import json
import shutil
import subprocess
import tempfile
from pathlib import Path

from .util import ENGINE_ROOT, LoomError, info, read_json, run, which

CACHE = ENGINE_ROOT / "cache" / "reel"


def _partial(key: str) -> Path:
    """Where a clip segment keeps its finished frames between attempts. LOOM_FRAMES_ROOT moves this scratch to a
    fast local disk (a slow network or shared mount writes each 0.5 MB frame in seconds)."""
    import os
    root = os.environ.get("LOOM_FRAMES_ROOT")
    return (Path(root) / "reel" if root else CACHE / "partial") / key
FPS = 24


def _sha(*parts) -> str:
    h = hashlib.sha256()
    for p in parts:
        h.update(p if isinstance(p, bytes) else str(p).encode())
    return h.hexdigest()[:16]


def _runtime_hash() -> str:
    files = sorted((ENGINE_ROOT / "runtime").glob("*.js")) + sorted((ENGINE_ROOT / "runtime" / "rigs").glob("*.js"))
    return _sha(*[f.read_bytes() for f in files])


def _src(seg) -> Path:
    k = seg["kind"]
    if k == "lab":
        return ENGINE_ROOT / "scenes_examples" / "lab" / f"{seg['scene']}.js"
    f = ENGINE_ROOT / "scenes_examples" / k / (seg["scene"] + (".py" if k == "skia" else ".js"))
    if not f.exists() and k == "three" and (ENGINE_ROOT / "runtime" / "three" / "presets" / f"{seg['scene']}.js").exists():
        f = ENGINE_ROOT / "runtime" / "three" / "presets" / f"{seg['scene']}.js"     # a preset scene (D-140)
    return f


def _key(seg) -> str:
    src = _src(seg)
    if not src.exists():
        raise LoomError(f"reel: no {seg['kind']} scene {src}")
    extra = b""
    if seg["kind"] == "skia":
        extra = (ENGINE_ROOT / "runtime/skia/loom_skia.py").read_bytes() + (ENGINE_ROOT / "runtime/skia/render.py").read_bytes()
    if seg["kind"] == "three":
        from .models3d import library_sha   # the toolkit and the 3D models a three scene may load (D-138)
        extra = (ENGINE_ROOT / "runtime/three/render.mjs").read_bytes() + library_sha().encode()
    style = (ENGINE_ROOT / "packs/styles" / f"{seg['style']}.json").read_bytes()
    return _sha(json.dumps(seg, sort_keys=True), src.read_bytes(), style, _runtime_hash() if seg["kind"] == "lab" else extra, "v1")


def _font(size, bold=False):
    from PIL import ImageFont
    for f in (["space-grotesk-latin-700-normal.ttf", "inter-latin-700-normal.ttf"] if bold else ["inter-latin-500-normal.ttf"]):
        p = ENGINE_ROOT / "models" / "fonts" / f
        if p.exists():
            return ImageFont.truetype(str(p), size)
    from .story import _font as F
    return F(size, bold)


def _label_png(seg, i, n, out: Path):
    """The lower third: segment number, the capability, and the engine piece that made it."""
    from PIL import Image, ImageDraw
    im = Image.new("RGBA", (1920, 1080), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    f1, f2, f3 = _font(44, True), _font(28), _font(24, True)
    lab, sub = seg.get("label", seg["scene"]), seg.get("sub") or f"{seg['kind']} / {seg['style']}"
    w = max(d.textlength(lab, font=f1), d.textlength(sub, font=f2)) + 140
    x, y = 72, 1080 - 72 - 128
    d.rounded_rectangle((x, y, x + w, y + 128), radius=18, fill=(10, 12, 18, 205))
    d.rounded_rectangle((x + 22, y + 26, x + 30, y + 102), radius=4, fill=(255, 196, 64, 255))
    d.text((x + 52, y + 18), lab, font=f1, fill=(255, 255, 255, 255))
    d.text((x + 52, y + 76), sub, font=f2, fill=(200, 206, 220, 255))
    tag = f"{i:02d} / {n:02d}"
    tw = d.textlength(tag, font=f3)
    d.rounded_rectangle((1920 - 72 - tw - 40, 60, 1920 - 72, 108), radius=12, fill=(10, 12, 18, 170))
    d.text((1920 - 72 - tw - 20, 70), tag, font=f3, fill=(255, 255, 255, 230))
    im.save(out)


def _frames_lab(seg, work: Path) -> Path:
    from . import lab as LB
    from .render import hf_env
    a, b = float(seg["from"]), float(seg["to"])
    times = [round(a + k / FPS, 4) for k in range(int(round((b - a) * FPS)))]
    tmp, meta, st, times = LB.page(seg["scene"], seg["style"], times, fx=seg.get("fx"))
    try:
        run([which("node"), str(ENGINE_ROOT / "tools/node/component_sheet.mjs"), str(tmp / "lab.html"), str(tmp / "out")], env=hf_env(), timeout=1800)
        rep = read_json(tmp / "out" / "report.json", {})
        errs = [f"{e.get('code')}: {e.get('msg')}" for e in rep.get("errors") or []] + list(rep.get("console") or [])
        if errs:
            info(f"reel:   {seg['scene']} [{seg['style']}] reported: " + "; ".join(errs[:3]))
        fr = work / "frames"; fr.mkdir(exist_ok=True)
        for k, s in enumerate(rep.get("shots") or []):
            shutil.move(s["file"], fr / f"{k:05d}.png")
        return fr
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def _clip_job(seg):
    from .compose import load_style
    from . import manim_bridge as MB
    from .three_bridge import faces_of
    stl = load_style(seg["style"])
    src = _src(seg)
    import re
    m = re.search(r"@lab\s+(\{.*\})", src.read_text(encoding="utf-8"))
    meta = json.loads(m.group(1)) if m else {}
    size = tuple(seg.get("size") or meta.get("size") or (1600, 780))
    dur = float(seg["to"])
    ctxd = {"beat": "reel", "duration": dur, "cues": {}, "params": seg.get("params") or meta.get("params") or {}, "palette": stl["palette"],
            "faces": faces_of(stl), "fonts": {"display": stl["fonts"]["display"]["family"], "body": stl["fonts"]["body"]["family"]},
            "font_files": MB._ttf_fonts(stl), "speech": [0, dur], "size": list(size)}
    return {"beat": "reel", "src": src, "w": size[0], "h": size[1], "mb": tuple(meta.get("motion_blur", [1, 0.5])), "stills": None, "ctxd": ctxd}, stl


def _clip_video(seg, key, work: Path) -> Path:
    """Render the clip (0 .. seg.to) with the engine's renderer; Skia frames persist between attempts."""
    job, stl = _clip_job(seg)
    from . import manim_bridge as MB
    q = MB.QUALITY["final"]
    if seg["kind"] == "skia":
        from .skia_bridge import _env, RUNTIME
        from .util import write_json
        ctx_path, out = work / "ctx.json", work / "clip.webm"
        write_json(ctx_path, job["ctxd"])
        env = _env(); env.update({"LOOM_SKIA_CTX": str(ctx_path), "LOOM_SKIA_READS": str(work / "reads.json"), "LOOM_FFMPEG": which("ffmpeg") or "ffmpeg",
                                  "LOOM_FRAMES_DIR": str(_partial(key))})
        _partial(key).mkdir(parents=True, exist_ok=True)
        samples, shutter = job["mb"]
        r = subprocess.run([MB._py(), str(RUNTIME / "render.py"), str(job["src"]), str(out), str(q["fps"]), str(q["scale"]), str(samples), str(shutter)],
                           cwd=work, env=env, capture_output=True, text=True, timeout=3600)
        if r.returncode != 0 or not out.exists():
            raise LoomError(f"reel: the Skia render of {seg['scene']} failed:\n{(r.stderr or r.stdout)[-1500:]}")
        return out, stl, job
    from .three_bridge import _invoke
    job["frames_dir"] = _partial(key)            # resumable, as the Skia segments
    out, _ = _invoke(job, "final", work)
    return out, stl, job


def segment(seg, i, n, force=False) -> Path:
    key = _key(seg)
    CACHE.mkdir(parents=True, exist_ok=True)
    out = CACHE / f"{key}.mp4"
    if out.exists() and not force:
        info(f"reel: {i:02d} {seg['label']}: stored")
        return out
    work = Path(tempfile.mkdtemp(prefix="loom_reel_"))
    try:
        lab_png = work / "label.png"; _label_png(seg, i, n, lab_png)
        d = float(seg["to"]) - float(seg["from"])
        fade = f"fade=t=in:st=0:d=0.25,fade=t=out:st={d - 0.25:.3f}:d=0.25"
        ff = which("ffmpeg") or "ffmpeg"
        if seg["kind"] == "lab":
            fr = _frames_lab(seg, work)
            cmd = [ff, "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", str(fr / "%05d.png"), "-loop", "1", "-i", str(lab_png),
                   "-filter_complex", f"[1]format=rgba,fade=t=in:st=0.2:d=0.35:alpha=1[l];[0][l]overlay=0:0:shortest=1,{fade},format=yuv420p[v]"]
        else:
            clip, stl, job = _clip_video(seg, key, work)
            field = stl["palette"]["field"]
            W, H = job["w"], job["h"]
            sc = min(1920 / W, 1080 / H) * float(seg.get("zoom", 1.0))
            cw, ch = int(W * sc) // 2 * 2, int(H * sc) // 2 * 2
            cmd = [ff, "-y", "-loglevel", "error", "-f", "lavfi", "-i", f"color=c={field}:s=1920x1080:r={FPS}:d={d:.3f}",
                   "-c:v", "libvpx-vp9", "-ss", f"{float(seg['from']):.3f}", "-t", f"{d:.3f}", "-i", str(clip), "-loop", "1", "-i", str(lab_png),
                   "-filter_complex", f"[1]fps={FPS},scale={cw}:{ch}[c];[0][c]overlay=(W-w)/2:(H-h)/2:shortest=1[b];[2]format=rgba,fade=t=in:st=0.2:d=0.35:alpha=1[l];"
                                      f"[b][l]overlay=0:0:shortest=1,{fade},format=yuv420p[v]"]
        cmd += ["-map", "[v]", "-t", f"{d:.3f}", "-r", str(FPS), "-c:v", "libx264", "-preset", "medium", "-crf", "18", str(work / "seg.mp4")]
        r = subprocess.run(cmd, capture_output=True, text=True)
        if r.returncode != 0:
            raise LoomError(f"reel: encoding {seg['scene']} failed: {r.stderr[-800:]}")
        shutil.move(str(work / "seg.mp4"), out)
        shutil.rmtree(_partial(key), ignore_errors=True)
        info(f"reel: {i:02d} {seg['label']}: rendered ({d:.1f} s)")
        return out
    finally:
        shutil.rmtree(work, ignore_errors=True)


def build(spec_path: str, only: int | None = None, force: bool = False) -> dict:
    spec = read_json(spec_path)
    if not spec:
        raise LoomError(f"reel: no spec at {spec_path}")
    segs = spec["segments"]
    n = len(segs)
    paths = []
    for i, seg in enumerate(segs, 1):
        if only and i != only:
            continue
        paths.append(segment(seg, i, n, force=force and (only == i or not only)))
    if only:
        return {"segment": only, "file": str(paths[0])}
    # the cut: segments back to back (each already dips), a music bed under the whole reel
    work = Path(tempfile.mkdtemp(prefix="loom_reel_cut_"))
    try:
        lst = work / "list.txt"
        lst.write_text("".join(f"file '{p.as_posix()}'\n" for p in paths))
        ff = which("ffmpeg") or "ffmpeg"
        silent = work / "v.mp4"
        subprocess.run([ff, "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", str(lst), "-c", "copy", str(silent)], check=True)
        D = sum(float(s["to"]) - float(s["from"]) for s in segs)
        import numpy as np
        import soundfile as sf
        from .narrate import mix as MX
        cuts, t = [], 0.0
        for s in segs:
            cuts.append(round(t, 3)); t += float(s["to"]) - float(s["from"])
        music = spec.get("music") or {"mood": "upbeat", "root_midi": 50}
        bed = MX.pad(D + 1.0, music["mood"], music["root_midi"], changes=cuts)
        # a soft whoosh into every segment after the first, tuned by nothing: noise, low in the mix
        for c in cuts[1:]:
            w = MX.sfx_whoosh(0.6, 0.12, seed=int(c * 10))
            a = int(max(0, c - 0.3) * MX.SR); bed[a:a + len(w)] += w[: max(0, len(bed) - a)]
        fin = np.clip(bed * (0.9 / max(1e-6, np.abs(bed).max())), -1, 1)
        fi, fo = int(0.4 * MX.SR), int(1.2 * MX.SR)
        fin[:fi] *= np.linspace(0, 1, fi); fin[-fo:] *= np.linspace(1, 0, fo)
        sf.write(work / "music.wav", fin[: int(D * MX.SR)], MX.SR)
        out = ENGINE_ROOT / (spec.get("out") or "docs/styles/demos/reel.mp4")
        out.parent.mkdir(parents=True, exist_ok=True)
        subprocess.run([ff, "-y", "-loglevel", "error", "-i", str(silent), "-i", str(work / "music.wav"), "-af", "loudnorm=I=-18:TP=-2:LRA=11",
                        "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-shortest", str(out)], check=True)
        # a contact sheet: the middle frame of every segment
        from PIL import Image
        cols = 4; rows = (n + cols - 1) // cols
        sheet = Image.new("RGB", (cols * 486 + 6, rows * 280 + 6), (17, 17, 17))
        t = 0.0
        for k, s in enumerate(segs):
            d = float(s["to"]) - float(s["from"])
            f = work / f"m{k}.png"
            subprocess.run([ff, "-y", "-loglevel", "error", "-ss", f"{t + d * 0.62:.3f}", "-i", str(out), "-frames:v", "1", str(f)], check=True)
            sheet.paste(Image.open(f).convert("RGB").resize((480, 270)), (6 + (k % cols) * 486, 6 + (k // cols) * 280))
            t += d
        sheet_path = out.with_suffix(".jpg"); sheet.save(sheet_path, quality=88)
        rep = {"file": str(out), "sheet": str(sheet_path), "duration": round(D, 2), "segments": n}
        info(f"reel: {n} segments, {D:.1f} s -> {out}")
        return rep
    finally:
        shutil.rmtree(work, ignore_errors=True)
