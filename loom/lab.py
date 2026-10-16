"""Motion lab (D-50): filmstrips of a motion technique, rendered by the engine, not described.

    py -m loom lab <scene> [--style engineering] [--at 0.5,1.2,...]     # one strip
    py -m loom lab all                                                   # every lab scene, each in its styles
    py -m loom lab --file scenes_examples/style_x.js [--style id] [--out dir]   # any scene file (style examples)

A lab scene is an ordinary `Loom.scene(id, {build(ctx) {...}})` file in `scenes_examples/lab/`, written with
ABSOLUTE times (no narration). It runs in the same runtime a lesson uses (kit, motion, expressive,
interaction), is seeked frame by frame in headless Chrome, and comes out as a strip of labelled frames in
`docs/styles/demos/lab/`. It is how a new primitive is PROVEN to look right before any lesson uses it, and
how a scene author sees what a technique does before choosing it.
"""
from __future__ import annotations

import json
import re
import shutil
import tempfile
from pathlib import Path

from .util import ENGINE_ROOT, LoomError, info, read_json, run, which

LAB = ENGINE_ROOT / "scenes_examples" / "lab"
OUT = ENGINE_ROOT / "docs" / "styles" / "demos" / "lab"

_LAB_JS = r"""
(function () {
  const Loom = window.Loom, M = window.__LAB;
  Loom.assets = M.assets;
  if (Loom.rigImported) Loom.rigImported.install();
  Loom.style.install(M.style, "fonts");
  const root = document.getElementById("root");
  // a lab scene's word cues (style guides s15 "loom lab --file", WS6 2026-10-08): the @lab "cues" map first, then the
  // "words" timings (a cue is its first word's start minus the runtime's 80 ms lead), then a number. A word that
  // resolves to nothing is a named warning, not a silent 0 (the example scenes all ran at t = 0 before)
  function cueOf(a, quiet) {
    if (typeof a === "number") return a;
    const s = String(a);
    if (M.cues && Object.prototype.hasOwnProperty.call(M.cues, s)) return +M.cues[s];
    const norm = (x) => String(x).toLowerCase().replace(/[^a-z0-9']+/g, " ").trim();
    if (M.words && M.words.length) {
      // a hyphenated word ("on-call") is two tokens, each keeping its word's start, so a cue "on-call engineer" matches
      // (it never did: the word normalised to one token, "on call"; found by the blueprint stress test, 2026-10-16)
      const want = norm(s).split(" ").filter(Boolean), ws = [];
      for (const w of M.words) for (const t of norm(w.w).split(" ").filter(Boolean)) ws.push({ t, s: w.s });
      for (let i = 0; want.length && i + want.length <= ws.length; i++) {
        let ok = true;
        for (let j = 0; j < want.length; j++) if (ws[i + j].t !== want[j]) { ok = false; break; }
        if (ok) return Math.max(0, ws[i].s - 0.08);
      }
    }
    const n = Number(s);
    if (s.trim() !== "" && !isNaN(n)) return n;
    if (quiet) return null;
    Loom.warn("lab_cue_unresolved", `cue "${s}" is in neither the @lab cues nor its words: it reads 0`);
    return 0;
  }
  (async function () {
    await Loom.style.ready();
    Loom.tl = gsap.timeline({ paused: true });
    const svg = Loom.svg("svg", { width: 1920, height: 1080, viewBox: "0 0 1920 1080", style: "position:absolute;left:0;top:0" }, root);
    Loom.svg("rect", { x: 0, y: 0, width: 1920, height: 1080, fill: Loom.style.c("field") }, svg);
    const g = Loom.svg("g", {}, svg);
    const beat = { id: M.id, start: 0, end: M.dur, speech_start: 0, speech_end: M.dur, phrases: M.words ? [{ text: "", words: M.words }] : [] };
    const ctx = { beat, def: {}, props: {}, g, box: Object.assign({}, Loom.kit.SAFE), kit: Loom.kit, m: Loom.motion, ui: Loom.ui,
      style: Loom.style, c: (t) => Loom.style.c(t), start: 0, end: M.dur, speechStart: 0, speechEnd: M.dur,
      cue(a) { return cueOf(a); }, has(a) { return cueOf(a, true) != null; }, at(f) { return f * M.dur; },
      get engine() { const e = Loom.engines && Loom.engines.current(); if (!e) throw new Error("this style has no engine"); return e.api; },
      hit(id) { return Loom.grid ? Loom.grid.hit(id) : null; }, bar(t) { return t; }, onBeat(t) { return t; },
      el(name, o) { return Loom.kit.element((o && o.parent) || g, name, o); },
      group() { return Loom.svg("g", { class: "lm-block" }, g); }, shift(grp, dx, dy) { grp.setAttribute("transform", `translate(${dx} ${dy})`); } };
    Object.defineProperty(ctx, "engine", { enumerable: false });   // as a lesson's: a copy of ctx never reads it
    ctx.use = (ref, p, o) => Loom.useComponent(ctx, ref, p, o);
    Loom.ctxBeat = beat;
    const moments = [];
    ctx.lottie = (name, id, o) => Loom.lottie.place(ctx, name, id, o);
    ctx.character = (name, rig, o) => Loom.rig.place(ctx, name, rig, o);
    ctx.depth = (name, o) => Loom.depth.stage(ctx, name, o);
    ctx.iso = (o) => Loom.iso.plane(ctx, o);
    ctx.scenery = (kind, name, o) => Loom.scenery[kind](ctx, name, o);
    ctx.crowd = (name, o) => Loom.scenery.crowd(ctx, name, o);
    ctx.narrationCard = (name, text, t, o) => Loom.scenery.narrationCard(ctx, name, text, t, o);
    ctx.fxMoment = (kind, t0, t1, rect) => { moments.push({ kind, t0, t1, rect: rect || [96, 84, 1728, 846] }); return t1; };
    try { Loom.scenes[M.id].build(ctx, {}); } catch (e) { Loom.error("lab_threw", String(e && e.stack || e)); }
    Loom.ctxBeat = null;
    { const EN = Loom.engines && Loom.engines.current(); if (EN && EN.api.audit) EN.api.audit(M); }   // as boot does
    if (M.fx) {
      // the shader layer, as a lesson has it: under the picture (background) and over it (grain, moments)
      Loom.manifest = { fx: M.fx, fx_moments: moments };
      // vignette_under (WS6): the vignette sits under the drawing, above the field. The lab's field is the svg's first
      // rect, so the field moves to the page behind both and the vignette canvas goes before the svg; it was appended
      // over the drawing, so the lab showed the vignette over words a lesson keeps clear (A4 proof, 2026-10-08)
      const under = !!(M.fx.vignette_under && M.fx.vignette);
      if (under) root.style.background = Loom.style.c("field");
      svg.firstChild.setAttribute("opacity", M.fx.background || under ? 0 : 1);   // the shader IS the field
      Loom.fx.install(Loom.manifest, { root, anchors: { ambient: svg, cam: svg, overlay: null } });
    }
    // the film clock, as a lesson has it (boot installs it always): it ran only with fx, so a clock a scene or an engine
    // registers (the whiteboard engine's one hand, 2026-10-15) never ran in the lab
    if (M.fx || Loom.world.clocks.length) {
      const pr = { t: 0 };
      Loom.tl.fromTo(pr, { t: 0 }, { t: M.dur, duration: M.dur, ease: "none", onUpdate: () => { for (const f of Loom.world.clocks) f(pr.t); } }, 0);
    }
    Loom.tl.set({}, {}, M.dur);
    window.__cases = 1; window.__times = M.times;
    // footage layers (D-114) seek their videos asynchronously: the screenshot waits until every seek has landed
    window.__show = (i, t) => { Loom.tl.seek(t, false); return Loom.footage && Loom.footage.settled ? Loom.footage.settled() : null; };
    window.__sheet_ready = true;
  })();
})();
"""


def _hands(src: str, style: dict) -> dict:
    from .hands_assets import for_sources
    assets, errs = for_sources([src], style)
    if errs:
        raise LoomError("; ".join(errs))
    return assets


def _rigs(src: str) -> dict:
    from .compose import imported_rigs
    return imported_rigs([src])


def _sets(src: str, style: str) -> dict:
    """the library sets a lab scene names by literal id, resolved in the strip's own style (D-152)"""
    from .sets import embed
    got, errs = embed({}, [src], style)
    if errs:
        raise LoomError("; ".join(errs))
    return got


def _art(src: str) -> dict:
    """the vendor art a lab scene names (D-88); a missing piece is an error at build time, in the runtime"""
    from .vendor_art import embed
    art, errs = embed([src])
    for e in errs:
        info(f"lab: art: {e}")
    return art


def scenes() -> list[str]:
    return sorted(p.stem for p in LAB.glob("*.js"))


def _meta(src: str) -> dict:
    """`// @lab {"styles": [...], "dur": 6, "times": [...], "title": "..."}` on the first lines of a lab scene."""
    m = re.search(r"//\s*@lab\s+(\{.*\})", src)
    return json.loads(m.group(1)) if m else {}


def scene_id(src: str) -> str | None:
    """The id a scene file registers (`Loom.scene("id", ...)`)."""
    m = re.search(r"""Loom\.scene\(\s*["']([^"']+)["']""", src)
    return m.group(1) if m else None


def page(scene: str, style: str | None = None, times: list[float] | None = None, fx: dict | None = None, seed: dict | None = None,
         file: str | Path | None = None):
    """Build the lab page for a scene (the real runtime, the style, the times to seek). Returns (dir, meta, style id).
    Used by the strip and by the reel (loom/reel.py), which seeks it once per video frame. `file`: any scene file (a
    style example in scenes_examples/), its id read from its Loom.scene call."""
    from .compose import RUNTIME_ORDER, load_style
    from .render import hf_env
    if file is not None:
        f = Path(file)
        if not f.exists():
            raise LoomError(f"no scene file {f}")
        src0 = f.read_text(encoding="utf-8")
        scene = scene_id(src0) or f.stem
    else:
        f = LAB / f"{scene}.js"
    if not f.exists():
        raise LoomError(f"no lab scene {scene} (have: {', '.join(scenes())})")
    src = f.read_text(encoding="utf-8")
    meta = _meta(src)
    st = style or (meta.get("styles") or ["flat-cosmos"])[0]
    dur = float(meta.get("dur", 6))
    times = times or meta.get("times") or [round(dur * i / 7, 2) for i in range(1, 8)]
    tmp = Path(tempfile.mkdtemp(prefix=f"lmlab_{scene}_"))
    stl = load_style(st)
    if seed:   # a design seed (D-81) for this strip: the same scene drawn in another lesson's treatments
        from .seed import validate as validate_seed
        bad = validate_seed(seed)
        if bad:
            raise LoomError("seed: " + "; ".join(bad))
        stl = dict(stl, seed=seed)
    nm = ENGINE_ROOT / "node_modules"
    (tmp / "fonts").mkdir(); (tmp / "rt").mkdir()
    if not (nm / "gsap").exists():
        raise LoomError(f"no node packages in {nm}: run `npm install` in the engine folder (setup.ps1 / setup.sh do it)")
    for face in stl["fonts"].get("faces", []):
        # not `src`: that name is the scene's source text, read again below (L-127)
        font_file = Path(face["path"]) if face.get("path") else nm / face["pkg"] / "files" / face["file"]
        if not font_file.exists():
            raise LoomError(f"font file missing: {font_file} (run npm install in the engine folder)")
        shutil.copy2(font_file, tmp / "fonts" / face["file"])
    scripts = [nm / "gsap/dist/gsap.min.js"] + ([nm / "roughjs/bundled/rough.js"] if stl["shape"].get("shading") == "sketch" else [])
    scripts += [ENGINE_ROOT / "runtime" / x for x in RUNTIME_ORDER if x != "boot.js"]
    scripts += sorted((ENGINE_ROOT / "runtime" / "rigs").glob("*.js"))
    scripts += [ENGINE_ROOT / "runtime/templates/_helpers.js"]
    from .engines import engine_file   # the style's engine (D-175), when it has one
    if engine_file(stl.get("id") or st):
        scripts += [engine_file(stl.get("id") or st)]
    if "Loom.templates[" in src:   # a lab scene that builds catalog templates (D-82: templates under a seed)
        scripts += sorted(p for p in (ENGINE_ROOT / "runtime" / "templates").glob("*.js") if not p.name.startswith("_"))
    scripts += [f]
    # third-party libraries behind Loom wrappers, loaded only when the scene uses them (compose.VENDOR, 2026-10-08)
    from .compose import vendor_scripts
    for k, (name, vf) in enumerate(vendor_scripts(src)):
        if not vf.exists():
            raise LoomError(f"library file missing: {vf} (run npm install, and node tools/vendor_js.mjs, in the engine folder)")
        scripts.insert(1 + k, vf)
    if ".lottie(" in src:
        scripts.insert(1, nm / "lottie-web/build/player/lottie_svg.min.js")
    tags = []
    for i, s in enumerate(scripts):
        shutil.copy2(s, tmp / "rt" / f"{i:02d}_{s.name}")
        tags.append(f'<script src="rt/{i:02d}_{s.name}"></script>')
    fx = meta.get("fx") if fx is None else dict(meta.get("fx") or {}, **fx)   # the reel may switch the style's fx layer on
    if fx is not None:
        fx = dict(stl.get("fx") or {}, **fx)
    M = {"id": scene, "style": stl, "dur": dur, "times": times, "fx": fx, "words": meta.get("words"), "cues": meta.get("cues"),
         "assets": {"icons": read_json(ENGINE_ROOT / "assets/icons/lucide.json")["icons"], "peeps": read_json(ENGINE_ROOT / "assets/peeps/peeps.json")["peeps"],
                    "lottie": {p.stem: read_json(p) for p in (ENGINE_ROOT / "assets" / "lottie").glob("*.json")},
                    "art": _art(src), **({"geo": read_json(ENGINE_ROOT / "assets/geo/world110m.json")} if ("Loom.geo" in src or ".globe(" in src) else {}),
                    **({"rigs": _rigs(src)} if _rigs(src) else {}), **({"hands": _hands(src, stl)} if "Loom.hands" in src else {}),
                    **({"sets": _sets(src, st)} if "Loom.place.set(" in src else {}),
                    **__import__("loom.engines", fromlist=["x"]).engine_assets(stl.get("id") or st)}}
    if meta.get("hero3d"):
        # hologram heroes (D-188): the scene's WebGL heroes, through the clip store, into the page's media folder
        from .three_bridge import hero_assets
        M["assets"]["hero3d"] = hero_assets(meta["hero3d"], stl, tmp / "media", src_base="media/")
    media = ENGINE_ROOT / "scenes_examples" / "lab" / "media"   # lab clips (footage layer, D-114) next to the page
    if media.is_dir() and "Loom.footage" in src:
        shutil.copytree(media, tmp / "media", dirs_exist_ok=True)
    html = ("<!doctype html><html><head><meta charset='utf-8'><style>html,body{margin:0;width:1920px;height:1080px;overflow:hidden}"
            "#root{position:relative;width:1920px;height:1080px}</style></head><body><div id='root'></div>"
            + "".join(tags) + f"<script>window.__LAB={json.dumps(M)};</script><script>{_LAB_JS}</script></body></html>")
    (tmp / "lab.html").write_text(html, encoding="utf-8")
    return tmp, meta, st, times


def seed_tag(seed: dict | None) -> str:
    """a short file-name tag for a seed: its `name`, else its options joined"""
    if not seed:
        return ""
    return str(seed.get("name") or "-".join(f"{v}" for k, v in sorted(seed.items())))[:60]


def strip(scene: str, style: str | None = None, times: list[float] | None = None, out_dir: str | Path | None = None,
          frames_dir: str | Path | None = None, seed: dict | None = None, file: str | Path | None = None) -> dict:
    """out_dir: where the strip goes (tests pass a temp dir so they never overwrite the published strips, L-95).
    frames_dir: also keep each full-size frame there (<scene>__<style>__<t>.png), e.g. for tools/style_fingerprint.py."""
    from PIL import Image, ImageDraw
    from .render import hf_env
    tag = seed_tag(seed)
    tmp, meta, st, times = page(scene, style, times, seed={k: v for k, v in (seed or {}).items() if k != "name"} or None, file=file)
    if file is not None:
        scene = scene_id(Path(file).read_text(encoding="utf-8")) or Path(file).stem
    run([which("node"), str(ENGINE_ROOT / "tools/node/component_sheet.mjs"), str(tmp / "lab.html"), str(tmp / "out")], env=hf_env(), timeout=300)
    rep = read_json(tmp / "out" / "report.json", {"errors": [{"code": "lab_failed", "msg": "no report"}], "shots": [], "console": []})
    shots = rep.get("shots") or []
    cols = min(4, max(1, len(shots))); rows = (len(shots) + cols - 1) // cols
    W_, H_ = 640, 360
    sh = Image.new("RGB", (cols * (W_ + 6) + 6, rows * (H_ + 30) + 46), (17, 17, 17)); d = ImageDraw.Draw(sh)
    d.text((10, 12), f"{meta.get('title', scene)}   [{st}]" + (f"   seed: {tag}" if tag else ""), fill=(255, 220, 90))
    for i, s in enumerate(shots):
        x, y = 6 + (i % cols) * (W_ + 6), 46 + (i // cols) * (H_ + 30)
        sh.paste(Image.open(s["file"]).convert("RGB").resize((W_, H_)), (x, y + 24))
        d.text((x + 4, y + 4), f"t = {s['t']:.2f}s", fill=(220, 220, 220))
    if frames_dir:
        fd = Path(frames_dir); fd.mkdir(parents=True, exist_ok=True)
        for s in shots:
            shutil.copy2(s["file"], fd / f"{scene}__{st}{'__' + tag if tag else ''}__{s['t']:05.2f}.png")
    od = Path(out_dir) if out_dir else OUT
    od.mkdir(parents=True, exist_ok=True)
    out = od / f"{scene}__{st}{'__' + tag if tag else ''}.jpg"
    sh.save(out, quality=88)
    shutil.rmtree(tmp, ignore_errors=True)
    errs = [f"{e.get('code')}: {e.get('msg')}" for e in rep.get("errors") or []] + [c for c in rep.get("console") or []]
    info(f"lab: {scene} [{st}] {len(shots)} frames, {len(errs)} problem(s) -> {out}")
    sfx = rep.get("sfx") or []
    if sfx:
        from collections import Counter
        info("lab:   sound events " + ", ".join(f"{k} x{n}" for k, n in sorted(Counter(e["kind"] for e in sfx).items())))
    return {"scene": scene, "style": st, "seed": tag or None, "sheet": str(out), "errors": errs, "sfx": sfx, "warnings": [f"{w.get('code')}: {w.get('msg')}" for w in rep.get("warnings") or []],
            "objects": rep.get("objects") or [], "figures": rep.get("figures") or [], "tweens": rep.get("tweens") or []}


def scene_strips(sc: str, style: str | None = None, times: list[float] | None = None, frames_dir=None, out_dir=None) -> list[dict]:
    """one scene in every style its @lab meta lists (or the one asked for), under every seed it lists (L-151: a
    single-scene run used to render the first style without seeds, so the seeded strips it was asked to prove were
    never made)"""
    meta = _meta((LAB / f"{sc}.js").read_text(encoding="utf-8"))
    styles = [style] if style else (meta.get("styles") or ["flat-cosmos"])
    return [strip(sc, st, times, out_dir=out_dir, frames_dir=frames_dir, seed=sd) for st in styles for sd in (meta.get("seeds") or [None])]


def all_strips() -> list[dict]:
    out = []
    for sc in scenes():
        meta = _meta((LAB / f"{sc}.js").read_text(encoding="utf-8"))
        for st in meta.get("styles") or ["flat-cosmos"]:
            for sd in meta.get("seeds") or [None]:   # a treatments lab scene lists the seeds it proves (D-81)
                out.append(strip(sc, st, seed=sd))
    return out


def clip_strip(kind: str, name: str, style: str, times: list[float] | None = None, params: dict | None = None,
               dur: float = 4.0, size=(1600, 780), quality: str = "final", out_name: str | None = None) -> dict:
    """A filmstrip of a CLIP scene (kind skia or three) rendered by its real bridge renderer, composited
    over the style's field, so a clip technique is proven before a lesson uses it."""
    import subprocess
    from PIL import Image, ImageDraw
    from .compose import load_style
    from . import manim_bridge as MB
    stl = load_style(style)
    src = ENGINE_ROOT / "scenes_examples" / kind / (name + (".py" if kind == "skia" else ".js"))
    if not src.exists() and kind == "three" and (ENGINE_ROOT / "runtime" / "three" / "presets" / f"{name}.js").exists():
        src = ENGINE_ROOT / "runtime" / "three" / "presets" / f"{name}.js"      # a preset scene (D-140), params given by the caller
    if not src.exists():
        raise LoomError(f"no {kind} lab scene {src}")
    txt = src.read_text(encoding="utf-8")
    m = re.search(r"@lab\s+(\{.*\})", txt)
    meta = json.loads(m.group(1)) if m else {}
    params = params or meta.get("params") or {}
    dur = float(meta.get("dur", dur)); times = times or meta.get("times") or [round(dur * k / 6, 2) for k in range(1, 7)]
    job = {"beat": "lab", "src": src, "w": size[0], "h": size[1], "mb": tuple(meta.get("motion_blur", [1, 0.5])), "stills": times,
           "ctxd": {"beat": "lab", "duration": dur, "cues": {}, "params": params, "palette": stl["palette"], "faces": __import__("loom.three_bridge", fromlist=["x"]).faces_of(stl),
                    "fonts": {"display": stl["fonts"]["display"]["family"], "body": stl["fonts"]["body"]["family"]},
                    "font_files": MB._ttf_fonts(stl), "speech": [0, dur], "size": list(size)}}
    work = Path(tempfile.mkdtemp(prefix=f"lmlab_{kind}_"))
    try:
        if kind == "skia":
            from .skia_bridge import _invoke
        elif kind == "page":   # the page kind (D-176): its own context (libraries, code tokens, faces)
            from .page_bridge import _invoke, make_ctx, lint_scene
            bad = lint_scene(txt, src.name)
            if bad:
                raise LoomError("; ".join(bad))
            job["ctxd"] = make_ctx(stl, dur, size, params, {}, [0, dur], meta.get("libs") or [])
        else:
            from .three_bridge import _invoke
        clip, reads = _invoke(job, quality, work)
        field = stl["palette"]["field"].lstrip("#")
        bgc = tuple(int(field[i:i + 2], 16) for i in (0, 2, 4)) + (255,)
        ims = []
        for t in times:
            f = work / f"still_{t:.2f}.png"
            if f.exists():
                im = Image.open(f).convert("RGBA"); bg = Image.new("RGBA", im.size, bgc); bg.alpha_composite(im)
                ims.append((t, bg.convert("RGB").resize((640, int(640 * size[1] / size[0])))))
        hh = ims[0][1].size[1] if ims else 312
        cols = min(3, max(1, len(ims))); rows = (len(ims) + cols - 1) // cols
        sh = Image.new("RGB", (cols * 646 + 6, rows * (hh + 30) + 46), (17, 17, 17)); d = ImageDraw.Draw(sh)
        d.text((10, 12), f"{meta.get('title', name)}   [{kind}, {style}]", fill=(255, 220, 90))
        for i, (t, im) in enumerate(ims):
            x, y = 6 + (i % cols) * 646, 46 + (i // cols) * (hh + 30)
            sh.paste(im, (x, y + 24)); d.text((x + 4, y + 4), f"t = {t:.2f}s", fill=(220, 220, 220))
        OUT.mkdir(parents=True, exist_ok=True)
        # out_name: a caller's own file name, so parallel callers (model sheets) never share a temporary file
        out = OUT / (out_name or f"{kind}_{name}__{style}.jpg"); sh.save(out, quality=88)
        info(f"lab: {kind}:{name} [{style}] {len(ims)} frames, reads {sorted((reads or {}).get('palette', {}))} -> {out}")
        return {"sheet": str(out), "reads": reads, "errors": []}
    finally:
        shutil.rmtree(work, ignore_errors=True)
