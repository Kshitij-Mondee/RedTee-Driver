"""Compose: storyboard + timings + scene code -> a HyperFrames project in <project>/build.

Deterministic. Resolves every narration cue, computes join windows, captions and sections,
bundles only the icons the lesson uses, and writes one index.html whose timeline is a pure
function of time.
"""
from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

from . import cues as C
from .util import ENGINE_ROOT, LoomError, info, read_json, warn, write_json

# Third-party libraries behind Loom wrappers (docs/research/2026-10-08-motion-libraries.md): (trigger in scene code,
# file name in the build, source). Loaded only when a scene's code uses the wrapper, before the runtime modules.
VENDOR = [
    (r"Loom\.physics\b", "matter.min.js", "node_modules/matter-js/build/matter.min.js"),
    (r"Loom\.brush\b", "p5brush.js", "node_modules/p5.brush/dist/brush.js"),
    (r"Loom\.orb\b", "thinking_orbs_engine.js", "assets/vendor/js/thinking_orbs_engine.js"),
]


def vendor_scripts(src: str) -> list:
    """[(build name, source path)] for the libraries this scene code uses."""
    import re as _re
    return [(name, ENGINE_ROOT / rel) for pat, name, rel in VENDOR if _re.search(pat, src or "")]


RUNTIME_ORDER_EXTRA = ["physics.js", "brush.js", "orbs.js", "recipes_physics.js", "recipes_brush.js", "recipes_orb.js"]   # library wrappers (2026-10-08); inert unless a scene calls them
RUNTIME_ORDER = ["core.js", "style.js", "kit.js", "layout.js", "motion.js", "expressive.js", "interaction.js", "ui_artefacts.js", "lottie.js", "rig.js", "iso.js", "depth.js", "scenery.js", "glow.js", "treat.js", "objects.js", "places.js", "sets.js", "art.js", "data.js", "geo.js", "hold.js", "stepped.js", "morph.js", "slot.js", "magnify.js", "material.js", "footage.js", "hands.js", "grid.js", "engines.js"] + RUNTIME_ORDER_EXTRA + ["world.js", "overlay.js", "components.js", "fx.js", "boot.js"]
# the join tables, join resolution and captions live in loom/timing.py (the timing grid, D-173); re-exported here for the
# modules and tests that import them from compose
from .timing import (JOIN_DUR, MEANING_JOIN, MOVE_JOINS, SCREEN_JOINS, SEAM_JOINS, captions_from,  # noqa: F401
                     join_for_meaning, seam_join, wipe_dir)
from . import timing as TG


def imported_rigs(texts) -> dict:
    """the imported rigs (assets/rigs/<id>.json) that these sources cast: ctx.character(name, "<id>") or a story cast rig"""
    have = {p.stem: p for p in (ENGINE_ROOT / "assets" / "rigs").glob("*.json")}
    want = set()
    for x in texts:
        want |= set(re.findall(r'character\(\s*"[^"]*"\s*,\s*"(\w+)"', x)) | set(re.findall(r'"rig"\s*:\s*"(\w+)"', x))
    return {i: read_json(have[i]) for i in sorted(want & set(have))}


def _captions_on(project, brand) -> bool:
    rule = ((brand or {}).get("rules") or {}).get("captions")
    if rule in ("on", "off"):
        return rule == "on"          # a brand rule wins over the lesson's own setting
    return bool(project.request.get("captions", True))


def load_style(name: str) -> dict:
    p = ENGINE_ROOT / "packs" / "styles" / f"{name}.json"
    if not p.exists():
        raise LoomError(f"unknown style pack '{name}' ({p})")
    return read_json(p)


def _icons_used(storyboard: dict, js_sources: list[str], lucide: dict) -> set[str]:
    used = set()
    def walk(o, key=None):
        if isinstance(o, dict):
            for k, v in o.items():
                walk(v, k)
        elif isinstance(o, list):
            for v in o:
                walk(v, key)
        elif isinstance(o, str) and key and "icon" in key and o in lucide:
            used.add(o)
    walk(storyboard)
    lit = re.compile(r"""["'`]([a-z0-9][a-z0-9\-]{1,40})["'`]""")
    for src in js_sources:
        for m in lit.finditer(src):
            if m.group(1) in lucide:
                used.add(m.group(1))
    return used


def music_of(style: dict, sb: dict) -> dict:
    """the lesson's music settings: the pack's, overlaid by the storyboard's (mix.py reads the same)"""
    m = dict((style or {}).get("music") or {})
    m.update((sb or {}).get("music") or {})
    return m


def compose(project, strict: bool = True) -> dict:
    sb = read_json(project.path("plan/storyboard.json"))
    tm = read_json(project.path("audio/timings.json"))
    script = read_json(project.path("plan/script.json"))
    style = load_style(sb.get("style") or project.request.get("style") or "flat-cosmos")
    # brand on any style: the storyboard (or the request) may name a brand that is layered on top
    from .brand import apply_brand, load_brand, logo_payload
    brand_id = sb.get("brand") or project.request.get("brand")
    brand = load_brand(brand_id) if brand_id else None
    style = apply_brand(style, brand)
    # the lesson's design seed (D-81): its own treatment of the essentials, read by runtime/treat.js as style.seed
    from .seed import seed_of, validate as validate_seed
    seed = seed_of(project.root)
    if seed:
        bad = validate_seed(seed)
        if bad:
            raise LoomError("design seed: " + "; ".join(bad))
        style = dict(style, seed=seed)
    build = project.path("build")
    if build.exists():
        for sub in ("runtime", "scenes", "fonts", "media"):
            shutil.rmtree(build / sub, ignore_errors=True)
    for sub in ("runtime/templates", "runtime/blueprints", "runtime/components", "scenes", "fonts", "assets/audio", "media"):
        (build / sub).mkdir(parents=True, exist_ok=True)

    beats = {b["id"]: b for b in tm["beats"]}
    errors, warnings = [], []
    draft_media: list[str] = []
    # -------- scenes: order follows the script's beats --------
    by_beat = {s["beat"]: s for s in sb["scenes"]}
    missing = [b["id"] for b in script["beats"] if b["id"] not in by_beat]
    if missing:
        errors.append(f"storyboard has no scene for beats: {', '.join(missing)}")
    scenes = [dict(by_beat[b["id"]]) for b in script["beats"] if b["id"] in by_beat]

    # -------- bespoke scene code --------
    js_sources = []
    scene_files = []
    for s in scenes:
        if s["kind"] == "bespoke":
            f = project.path(f"scenes/{s.get('scene') or s['beat']}.js")
            if not f.exists():
                errors.append(f"{s['beat']}: bespoke scene file missing: scenes/{f.name}")
                continue
            src = f.read_text(encoding="utf-8")
            js_sources.append(src)
            shutil.copy2(f, build / "scenes" / f.name)
            scene_files.append(f"scenes/{f.name}")
        if s["kind"] in ("manim", "skia", "three", "page"):
            clip = project.path(f"media/{s['beat']}.webm")
            if not clip.exists():
                errors.append(f"{s['beat']}: Manim clip not rendered (py -m loom manim {project.id})")
            else:
                shutil.copy2(clip, build / "media" / clip.name)
                meta = read_json(project.path(f"media/{s['beat']}.json"), {})
                if meta.get("quality") == "draft":
                    draft_media.append(s["beat"])
                s.setdefault("media", {})
                s["media"].update({"src": f"media/{clip.name}", "start": meta.get("start", beats[s["beat"]]["start"]), "duration": meta.get("duration")})
                s["media"].setdefault("rect", (s.get(s["kind"]) or {}).get("rect") or [96, 84, 1728, 846])
        if s["kind"] == "redtee":
            from . import redtee_bridge
            s["svg"] = redtee_bridge.render_svg(project, s["blueprint"], s.get("props") or {}, s.get("rect") or [96, 84, 1728, 846], style)
            s["rect"] = s.get("rect") or [96, 84, 1728, 846]
    # -------- the lesson kit (2026-10-08): the lesson's own sets, screens and parts, written once and composed by its
    # beats (Loom.lesson.<part>(ctx, parent, opts)). It loads before every beat scene; a lesson without one is unchanged
    kit = project.path("scenes/_kit.js")
    if kit.exists():
        js_sources.insert(0, kit.read_text(encoding="utf-8"))
        shutil.copy2(kit, build / "scenes" / kit.name)
        scene_files.insert(0, f"scenes/{kit.name}")
    # -------- reused kit parts (D-163): the style's kept parts the storyboard reuses, loaded before the lesson kit
    from .kept import parts_js as _kept_parts
    kept_js, kept_errors = _kept_parts(project, sb)
    errors.extend(kept_errors)
    if kept_js:
        js_sources.insert(0, kept_js)
        (build / "scenes" / "_kept.js").write_text(kept_js, encoding="utf-8")
        scene_files.insert(0, "scenes/_kept.js")
    # -------- cues --------
    cue_table: dict[str, dict[str, float]] = {}
    for s in scenes:
        b = beats.get(s["beat"])
        if not b:
            errors.append(f"scene for unknown beat {s['beat']}")
            continue
        anchors = C.collect_anchors(s.get("props") or {}, []) + list(s.get("order_cues") or []) \
            + [m["at"] for m in (s.get("fx") or []) if isinstance(m, dict) and m.get("at")]
        # a storyboard sound on a cue (D-173): before the grid these never reached the table and the mix skipped them
        anchors += [e["cue"] for e in (s.get("sfx") or []) if isinstance(e, dict) and e.get("cue")]
        if s["kind"] == "bespoke":
            f = project.path(f"scenes/{s.get('scene') or s['beat']}.js")
            if f.exists():
                anchors += C.anchors_in_js(f.read_text(encoding="utf-8"))
        words = C.beat_words(b)
        tbl = {}
        for a in anchors:
            t, how = C.resolve(a, words)
            if t is None:
                errors.append(f"{s['beat']}: cue \"{a}\" is {how}. {C.suggest(a, words)}")
            else:
                if how == "prefix":
                    warnings.append(f"{s['beat']}: cue \"{a}\" matched loosely (prefix)")
                tbl[a] = t
        cue_table[s["beat"]] = tbl
    # -------- join windows (the timing grid, D-173: the runtime AND the sound mix read these, never their own) --------
    order = [s["beat"] for s in scenes]
    warnings.extend(TG.resolve_joins(scenes, sb, style))
    for i, s in enumerate(scenes):
        j = s["join_in"]["type"]
        b = beats[s["beat"]]
        if i == 0:
            s["join_window"] = [0.0, 0.0]
            continue
        s["join_window"] = TG.join_window(j, (s.get("join_in") or {}).get("dur"), beats[order[i - 1]], b)
        t0, t1 = s["join_window"]
        if t1 > t0:
            d = t1 - t0
            first = min(cue_table.get(s["beat"], {}).values(), default=b["speech_start"])
            if first < t0 + d * 0.6:
                warnings.append(f"{s['beat']}: first reveal ({first:.2f}s) lands before the camera settles ({t0 + d:.2f}s)")
    # -------- assets --------
    lucide = read_json(ENGINE_ROOT / "assets/icons/lucide.json")["icons"]
    # runtime templates/blueprints may use icons too (defaults)
    rt_src = [p.read_text(encoding="utf-8") for p in (ENGINE_ROOT / "runtime").rglob("*.js")]
    icons = _icons_used(sb, js_sources, lucide) | _icons_used({}, rt_src, lucide)
    peeps = read_json(ENGINE_ROOT / "assets/peeps/peeps.json")["peeps"]
    # vendor art (D-88): only what the scenes name with a literal set:name reference, each from an approved set, and
    # cleared for client use (a lab-only set such as e2gen is refused here, B6 2026-10-08)
    from .vendor_art import embed as embed_art
    art, art_errors = embed_art(js_sources, lesson=True)
    errors.extend(art_errors)
    # geography (D-90, B4): Natural Earth (public domain), only when a scene draws a map or a globe
    # the map data: a scene that calls Loom.geo, or the hologram engine's globe (its coastline, 2026-10-16)
    geo = read_json(ENGINE_ROOT / "assets/geo/world110m.json") if any("Loom.geo" in x or ".globe(" in x for x in js_sources) else None
    # imported character rigs (D-93): only the rigs the scenes cast
    rigs = imported_rigs(js_sources + [json.dumps(sb.get("story") or {})])
    # drawn sets (D-152): the storyboard's set, resolved strictly in the lesson's own set style, and literal ids in code
    from .sets import embed as embed_sets, resolve as resolve_set
    sets, set_errors = embed_sets(sb, js_sources, style.get("id") or sb.get("style") or project.request.get("style"))
    errors.extend(set_errors)
    for s in scenes:
        if s.get("set"):
            r = resolve_set(s["set"], style.get("id") or sb.get("style") or project.request.get("style"))
            if r["ok"]:
                s["set_id"] = r["id"]
    # hand families (D-114): only those the scenes name, plus the pack default when it exists (placeholder is built in)
    from .hands_assets import for_sources as hands_for
    hands, hand_errors = hands_for(js_sources, style)
    errors.extend(hand_errors)
    # footage clips (D-114 spike): declared per scene in the storyboard, copied into the build, seeked by HyperFrames
    footage = []
    tm_beats = {b["id"]: b for b in tm["beats"]}
    for s in sb["scenes"]:
        for fdef in s.get("footage") or []:
            srcp = project.path(fdef["src"])
            if not srcp.exists():
                errors.append(f"{s['beat']}: footage '{fdef.get('name')}' source missing: {fdef['src']}")
                continue
            (build / "assets" / "footage").mkdir(parents=True, exist_ok=True)
            shutil.copy2(srcp, build / "assets" / "footage" / srcp.name)
            b = tm_beats.get(s["beat"])
            if not b:
                continue
            trim = fdef.get("trim") or [0, float(fdef.get("dur") or (b["end"] - b["start"]))]
            footage.append({"beat": s["beat"], "name": fdef["name"], "src": f"assets/footage/{srcp.name}",
                            "start": round(b["start"] + float(fdef.get("at") or 0), 3), "duration": round(float(trim[1]) - float(trim[0]), 3),
                            "media_start": round(float(trim[0]), 3)})
    # hologram heroes (D-188): a beat's "hero3d" specs are rendered through the clip store (three_bridge.hero_cached,
    # keyed on the spec, the model, the look and the runtime, so a second compose renders nothing), copied into the
    # build and written as static footage videos that HyperFrames seeks; the page reads Loom.assets.hero3d["<beat>:<name>"]
    hero3d = {}
    for s in sb["scenes"]:
        if not s.get("hero3d"):
            continue
        b = tm_beats.get(s["beat"])
        if not b:
            continue
        from .three_bridge import hero_assets
        try:
            got = hero_assets(s["hero3d"], style, build / "assets" / "footage", src_base="assets/footage/", prefix=f"hero_{s['beat']}_", t0=b["start"])
        except LoomError as e:
            errors.append(f"{s['beat']}: hero3d could not be rendered: {str(e)[:300]}")
            continue
        for name, a in got.items():
            hero3d[f"{s['beat']}:{name}"] = a
            footage.append({"beat": s["beat"], "name": "hero3d_" + name, "src": a["src"], "start": a["t0"], "duration": a["dur"], "media_start": 0})
    # captured web pages (screencast, D-176): projects/<id>/assets/pages/*.page.js load after the engine, so a
    # lesson can show a kind "page" region; only a lesson with that folder carries them
    page_scripts = []
    pdir = project.root / "assets" / "pages"
    if pdir.is_dir():
        (build / "assets" / "pages").mkdir(parents=True, exist_ok=True)
        for pf in sorted(pdir.glob("*.page.js")):
            shutil.copy2(pf, build / "assets" / "pages" / pf.name)
            page_scripts.append(f"assets/pages/{pf.name}")
    # -------- fonts --------
    for face in style["fonts"].get("faces", []):
        src = Path(face["path"]) if face.get("path") else ENGINE_ROOT / "node_modules" / face["pkg"] / "files" / face["file"]
        if not src.exists():
            raise LoomError(f"font file missing: {src} (run npm install in the engine folder)")
        shutil.copy2(src, build / "fonts" / face["file"])
    # -------- runtime --------
    rt = ENGINE_ROOT / "runtime"
    for f in RUNTIME_ORDER:
        shutil.copy2(rt / f, build / "runtime" / f)
    # the style's engine (D-175): runtime/engines/<style id>.js, only for a lesson in that style
    from .engines import engine_file, lint as lint_engine
    from .engines import enabled_for
    eng = engine_file(style.get("id")) if enabled_for(project, style.get("id")) else None
    from .engines import engine_assets   # what the engine needs in the build: its stroke font, its designed hand (D-179)
    eng_scripts = []
    if eng:
        errors.extend(lint_engine(eng))
        (build / "runtime" / "engines").mkdir(parents=True, exist_ok=True)
        shutil.copy2(eng, build / "runtime" / "engines" / eng.name)
        eng_scripts = [f"runtime/engines/{eng.name}"]
    # character rigs (D-59): every rig file travels with the runtime
    (build / "runtime" / "rigs").mkdir(parents=True, exist_ok=True)
    rig_files = sorted((rt / "rigs").glob("*.js"))
    for f in rig_files:
        shutil.copy2(f, build / "runtime" / "rigs" / f.name)
    tpl_files = sorted((rt / "templates").glob("*.js"), key=lambda p: (not p.name.startswith("_"), p.name))
    for f in tpl_files:
        shutil.copy2(f, build / "runtime/templates" / f.name)
    bp_files = sorted((rt / "blueprints").glob("*.js"), key=lambda p: (not p.name.startswith("_"), p.name))
    for f in bp_files:
        shutil.copy2(f, build / "runtime/blueprints" / f.name)
    cmp_files = sorted((rt / "components").glob("*.js")) if (rt / "components").exists() else []
    (build / "runtime/components").mkdir(parents=True, exist_ok=True)
    for f in cmp_files:
        shutil.copy2(f, build / "runtime/components" / f.name)
    nm = ENGINE_ROOT / "node_modules"
    shutil.copy2(nm / "gsap/dist/gsap.min.js", build / "runtime/gsap.min.js")
    need_rough = style["shape"].get("shading") == "sketch"
    # Lottie (D-54): the player and the animations this lesson names (ctx.lottie("name", "<id>", ...))
    import re as _re
    lottie_ids = set()
    for f in project.path("scenes").glob("*.js") if project.path("scenes").exists() else []:
        lottie_ids |= set(_re.findall(r"""\.lottie\(\s*["'][^"']+["']\s*,\s*["']([A-Za-z0-9_\-]+)["']""", f.read_text(encoding="utf-8")))
    lottie_data = {}
    for lid in sorted(lottie_ids):
        lf = ENGINE_ROOT / "assets" / "lottie" / f"{lid}.json"
        if lf.exists():
            lottie_data[lid] = read_json(lf)
        else:
            errors.append(f"Lottie animation '{lid}' not found in assets/lottie/")
    if lottie_data:
        shutil.copy2(nm / "lottie-web/build/player/lottie_svg.min.js", build / "runtime/lottie.min.js")
    if need_rough:
        shutil.copy2(nm / "roughjs/bundled/rough.js", build / "runtime/rough.js")
    # third-party libraries a scene asks for by name (2026-10-08): loaded only when a scene uses them
    all_src = "\n".join(js_sources)
    vendor_files = vendor_scripts(all_src)
    for name, f in vendor_files:
        if not f.exists():
            errors.append(f"library file missing: {f} (run npm install, and node tools/vendor_js.mjs, in the engine folder)")
        else:
            shutil.copy2(f, build / "runtime" / name)
    # -------- audio --------
    mix = project.path("audio/mix.wav")
    if not mix.exists():
        mix = project.path("audio/narration.wav")
        warnings.append("no audio/mix.wav yet: using the bare narration (run the mix)")
    shutil.copy2(mix, build / "assets/audio/mix.wav")
    # -------- sections + captions + presenter --------
    sections = []
    for sec in script["sections"]:
        bs = [b for b in tm["beats"] if b["section"] == sec["id"]]
        if bs:
            sections.append({"id": sec["id"], "title": sec["title"], "t0": bs[0]["start"] + 0.2, "t1": bs[-1]["end"] - 0.2})
    env = read_json(project.path("audio/envelope.json"), {"fps": 30, "values": []})
    manifest = {
        "lesson": {"id": project.id, "title": script["title"]},
        "duration": tm["duration"], "fps": 30,
        "style": style, "fontBase": "fonts",
        "assets": {"icons": {k: lucide[k] for k in sorted(icons)}, "peeps": peeps, "art": art,
                   **(engine_assets(style.get("id")) if eng else {}), **({"geo": geo} if geo else {}), **({"hero3d": hero3d} if hero3d else {}), **({"rigs": rigs} if rigs else {}), **({"sets": sets} if sets else {}), **({"hands": hands} if hands else {})},
        "beats": tm["beats"], "cues": cue_table,
        "world": sb["world"], "scenes": scenes,
        "captions": {"enabled": _captions_on(project, brand), "groups": captions_from(tm)},
        "brand": ({"id": brand["id"], "logo": logo_payload(brand, style)} if brand else None),
        "sections": sections, "chrome": sb.get("chrome") or {"section_labels": True},
        "grid": TG.build_grid(tm, script, scenes, cue_table, music_of(style, sb)),
        "presenter": {"fps": env["fps"], "envelope": env["values"]},
    }
    # the shader layer's per-lesson settings (merged over the style pack's `fx` in the runtime, D-52)
    if sb.get("fx") is not None:
        manifest["fx"] = sb["fx"]
    # the ambient field's per-lesson override (merged over the pack's `ambient` in world.js): {"kind": "none"} turns a
    # pack's dot grid off for a lesson whose meaning lives in small marks (L-227)
    if sb.get("ambient") is not None:
        manifest["ambient"] = sb["ambient"]
    if (sb.get("story") or {}).get("cast"):
        # one person, one look (RC18): templates resolve a person prop that names a cast member from here
        manifest["cast"] = sb["story"]["cast"]
    if sb.get("icon_objects"):
        manifest["icon_objects"] = True   # D-100: drawn objects may stand in for hero icons (opt-in; one family otherwise)
    if draft_media:
        # only present when drafts are in: a final build's manifest is byte-identical to before D-39
        manifest["draft_media"] = draft_media
    # the layout guard (D-169): the lesson's stored plan, only its entries whose scene and kit are unchanged; off, nothing
    from . import layout_guard as LG
    if LG.enabled(project):
        manifest["layout_guard"] = True
        lp = LG.manifest_plan(project, build, manifest)
        if lp:
            manifest["layout_plan"] = lp
    write_json(build / "manifest.json", manifest)
    if lottie_data:
        manifest["lottie"] = lottie_data
    scripts = ["runtime/gsap.min.js"] + (["runtime/rough.js"] if need_rough else []) + (["runtime/lottie.min.js"] if lottie_data else []) \
        + [f"runtime/{n}" for n, f in vendor_files if f.exists()] + [f"runtime/{f}" for f in RUNTIME_ORDER] + [f"runtime/rigs/{f.name}" for f in rig_files] \
        + [f"runtime/templates/{f.name}" for f in tpl_files] + [f"runtime/blueprints/{f.name}" for f in bp_files] \
        + [f"runtime/components/{f.name}" for f in cmp_files] + eng_scripts + page_scripts + scene_files
    videos = [(s["beat"], s["media"]) for s in scenes if s.get("kind") in ("manim", "skia", "three", "page", "media") and (s.get("media") or {}).get("src")]
    html = _html(project.id, manifest, scripts, videos, footage)
    (build / "index.html").write_text(html, encoding="utf-8", newline="\n")
    write_json(build / "hyperframes.json", {"$schema": "https://hyperframes.heygen.com/schema/hyperframes.json", "paths": {"blocks": "compositions", "components": "compositions/components", "assets": "assets"}, "media": {"autoProxy": True}})
    write_json(build / "meta.json", {"id": project.id, "name": project.id})
    report = {"errors": errors, "warnings": warnings, "duration": tm["duration"], "scenes": len(scenes), "icons": len(icons)}
    write_json(project.path("qa/compose.json"), report)
    for w in warnings:
        warn(w)
    if errors and not strict:
        # a preview while other scenes are still being written (an agent's lab_snapshot): one line, not one per beat
        info(f"[preview] composed with {len(errors)} beat(s) not ready yet ({', '.join(e.split(':')[0] for e in errors[:8])}{'...' if len(errors) > 8 else ''})")
    elif errors:
        for e in errors:
            print(f"[error] {e}")
        if strict:
            raise LoomError(f"compose failed with {len(errors)} error(s); see qa/compose.json")
    info(f"composed {len(scenes)} scenes, {tm['duration']:.1f}s -> {build / 'index.html'}")
    return report


def _html(pid: str, manifest: dict, scripts: list[str], videos: list | None = None, footage: list | None = None) -> str:
    tags = "\n".join(f'<script src="{s}"></script>' for s in scripts)
    # media must exist in the STATIC html: HyperFrames discovers and pre-extracts video frames at
    # compile time. The runtime reparents each <video> into its station so the camera carries it.
    vids = "\n".join(
        f'<video id="media-{b}" class="lm-media" src="{m["src"]}" muted playsinline data-start="{round(float(m.get("start") or 0), 3)}" '
        f'data-duration="{round(float(m.get("duration") or 5), 3)}" data-track-index="{20 + i}" style="position:absolute;left:0;top:0;width:{int(m["rect"][2])}px;height:{int(m["rect"][3])}px"></video>'
        for i, (b, m) in enumerate(videos or []))
    # footage layers (D-114): runtime/footage.js finds these by id and paints them; HyperFrames seeks them per frame
    vids += "".join(
        f'\n<video id="footage-{f["beat"]}-{f["name"]}" class="lm-footage" src="{f["src"]}" muted playsinline data-start="{f["start"]}" '
        f'data-duration="{f["duration"]}" data-media-start="{f["media_start"]}" data-track-index="{40 + i}" style="position:absolute;left:0;top:0;width:2px;height:2px;opacity:0"></video>'
        for i, f in enumerate(footage or []))
    data = json.dumps(manifest, ensure_ascii=False).replace("</", "<\\/")
    dur = manifest["duration"]
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=1920, height=1080" />
<title>{manifest['lesson']['title']}</title>
<style>*{{margin:0;padding:0;box-sizing:border-box}}html,body{{width:1920px;height:1080px;overflow:hidden}}#lm-root{{position:relative;width:100%;height:100%;overflow:hidden}}</style>
</head>
<body>
<div id="lm-root" data-composition-id="main" data-start="0" data-duration="{dur}" data-width="1920" data-height="1080" data-fps="30">
<audio id="lm-audio" src="assets/audio/mix.wav" data-start="0" data-duration="{dur}" data-track-index="9"></audio>
{vids}
</div>
{tags}
<script>window.LOOM_MANIFEST = {data};</script>
<script>
  // one paused timeline, registered once the build (after fonts) completes
  Loom.boot(window.LOOM_MANIFEST).then(function () {{ window.__timelines["main"] = Loom.tl; }});
</script>
</body>
</html>
"""
