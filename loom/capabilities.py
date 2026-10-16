"""What the engine can draw, generated from the code (WS5 discovery, 2026-10-07).

The bench's agents could find templates, blueprints and components (catalog_search) and nothing else: rigs, places,
objects, data pictures, depth, isometric, fx moments, Lottie, UI artefacts and the TED-Ed primitives were reachable only
by asking for a SCENE_API section by its exact name (docs/research/bench-fix/ws5_tool_usage.md). This module lists them,
one line on when to use each, read from:
- each runtime module's `// @capability id | group | api | SCENE_API section | when to use` line (the module states its
  own; INFRA modules carry none);
- the catalogue (templates, blueprints, components, the avatar);
- the rigs (runtime/rigs/*.js, assets/rigs/*.json), the world packs (packs/worlds/*.json);
- the clip renderers (runtime/manim, runtime/skia, runtime/three) and whether the API path has a worker for them.

`py -m loom catalog` writes runtime/capabilities.json and runtime/capabilities.md (generated: never hand-edit). The agents'
`capabilities(group)` tool serves the JSON.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from .util import ENGINE_ROOT, read_json, write_json

INFRA = ("core.js", "style.js", "boot.js")      # the timeline, the style data and boot: no builder of their own
TAG = re.compile(r"^// @capability (.+)$", re.M)
OUT_JSON = ENGINE_ROOT / "runtime" / "capabilities.json"
OUT_MD = ENGINE_ROOT / "runtime" / "capabilities.md"


def module_tags() -> tuple[list[dict], list[str]]:
    """(capabilities from runtime/*.js, modules that should carry a tag and do not)"""
    out, missing = [], []
    for f in sorted((ENGINE_ROOT / "runtime").glob("*.js")):
        m = TAG.search(f.read_text(encoding="utf-8"))
        if not m:
            if f.name not in INFRA:
                missing.append(f.name)
            continue
        parts = [x.strip() for x in m.group(1).split(" | ")]
        if len(parts) != 5:
            missing.append(f"{f.name} (malformed tag: id | group | api | section | when)")
            continue
        cid, group, api, section, when = parts
        out.append({"id": cid, "group": group, "api": api, "section": section, "when": when, "source": f"runtime/{f.name}"})
    return out, missing


def rigs() -> list[str]:
    have = set()
    for f in sorted((ENGINE_ROOT / "runtime" / "rigs").glob("*.js")):
        src = f.read_text(encoding="utf-8")
        have |= set(re.findall(r'person\("(\w+)"', src)) | set(re.findall(r'rig\.define\("(\w+)"', src)) | set(re.findall(r'\bbean\("(\w+)"', src))
    have |= {p.stem for p in (ENGINE_ROOT / "assets" / "rigs").glob("*.json")}
    return sorted(have)


def clip_kinds() -> list[dict]:
    """The clip renderers, and whether the API path writes them (loom/agents/conductor.py CLIP_WORKERS)."""
    try:
        from .agents.conductor import CLIP_WORKERS
    except Exception:   # noqa: BLE001  (an engine without the agents package)
        CLIP_WORKERS = ()
    from .agents.tools import CLIP_FILE
    rows = [("manim", "runtime/manim/loom_manim.py", CLIP_FILE["manim"] + " (a LoomScene), or a manim blueprint with params", "loom-scene-author: Manim scenes",
             "exact mathematics, plots, equations, geometry that moves precisely (Manim, rendered to a transparent clip)"),
            ("skia", "runtime/skia/loom_skia.py", CLIP_FILE["skia"], "TOOLBOX: skia",
             "a painterly or glowing hero image with blur, gradients and light (Skia, a transparent clip)"),
            ("three", "runtime/three/render.mjs", CLIP_FILE["three"], "TOOLBOX: three",
             "a real 3D object or device turning, opening or changing state, or an isometric diorama (Three.js, a transparent "
             "clip); start from the model library (models3d)")]
    out = []
    for kind, src, file, section, when in rows:
        api = kind in CLIP_WORKERS
        out.append({"id": f"clip_{kind}", "group": "clips", "api": f"storyboard kind \"{kind}\"; {file.replace('{beat}', '<beat>')}", "section": section,
                    "when": when + ("" if api else ". NOT on the API path yet: the storyboard gate refuses it there"),
                    "source": src, "api_path": api})
    return out


def build() -> dict:
    caps, missing = module_tags()
    cat = read_json(ENGINE_ROOT / "runtime" / "catalog.json", {}) or {}
    first = lambda d: re.split(r"(?<=[.!?])\s", (d or "").strip(), maxsplit=1)[0][:200]   # noqa: E731
    caps.append({"id": "templates", "group": "frames", "api": "storyboard kind \"template\"", "section": "catalog",
                 "when": "a frame-layout beat (a definition, a list, a comparison, a quiz) laid out in the whole frame; one id at most "
                         "max(2, 15 % of beats) times", "source": "runtime/catalog.json",
                 "items": {k: first(v.get("doc")) for k, v in sorted((cat.get("templates") or {}).items()) if not v.get("candidate")}})
    caps.append({"id": "blueprints", "group": "frames", "api": "storyboard kind \"blueprint\"", "section": "catalog",
                 "when": "a ready-made motion piece (a meter, a character moment, a journey, a hub, a portal)", "source": "runtime/catalog.json",
                 "items": {k: first(v.get("doc")) for k, v in sorted((cat.get("blueprints") or {}).items()) if not v.get("candidate")}})
    if cat.get("components"):
        caps.append({"id": "component_list", "group": "library", "api": "ctx.use(id, params)", "section": "ctx", "when": "promoted small elements",
                     "source": "runtime/catalog.json", "items": {k: v.get("idea", "") for k, v in sorted(cat["components"].items())}})
    if cat.get("avatar"):
        caps.append({"id": "avatar", "group": "people", "api": "storyboard kind \"avatar\"", "section": "Layering and joins",
                     "when": cat["avatar"].get("doc", ""), "source": "runtime/overlay.js", "items": {"props": ", ".join(sorted(cat["avatar"]["props"]))}})
    caps.append({"id": "rig_ids", "group": "people", "api": "ctx.character(name, rigId, ...); story.cast {name, rig or member, skin, cloth}",
                 "section": "Characters", "when": "the designed rigs a person can be drawn with (peep members for templates: woman, man, girl, boy, "
                 "elder_woman, elder_man)", "source": "runtime/rigs, assets/rigs", "items": {r: "" for r in rigs()}})
    worlds = {}
    for f in sorted((ENGINE_ROOT / "packs" / "worlds").glob("*.json")):
        w = read_json(f, {}) or {}
        worlds[w.get("id") or f.stem] = (w.get("name") or "") + (": " + w["purpose"] if w.get("purpose") else "")
    caps.append({"id": "world_packs", "group": "world", "api": "a world's scenes, cast and assets (docs/assets/WORLD_PACKS.md)", "section": "Places and the camera",
                 "when": "pick the world a lesson happens in; its places, people and props are already designed or listed to commission",
                 "source": "packs/worlds", "items": worlds})
    caps += clip_kinds()
    try:                                                     # the 3D model library (D-138): one entry, the models as items
        from .models3d import cards
        ms = cards()
    except Exception:   # noqa: BLE001
        ms = []
    if ms:
        caps.append({"id": "models3d", "group": "clips", "api": "in a kind \"three\" clip: await X.model(id, opts); m.set(key, value)",
                     "section": "TOOLBOX: three", "when": "a ready 3D object with keys you drive from time (a phone with a screen, a padlock "
                     "that opens, a rack that alerts); load the three tool for the details", "source": "assets/models3d",
                     "items": {c["id"]: c.get("what", "") for c in ms}})
    try:                                                     # ready Three.js scenes a storyboard names instead of a file (D-140)
        from .three_bridge import presets, preset_card
        pr = {pid: preset_card(pid).get("what", "") for pid in presets()}
    except Exception:   # noqa: BLE001
        pr = {}
    if pr:
        caps.append({"id": "three_presets", "group": "clips", "api": "storyboard kind \"three\" with three.preset (params only, nothing to write); "
                     "py -m loom device <id> <beat> <device> swaps a device beat later", "section": "TOOLBOX: three",
                     "when": "a ready 3D shot whose content is params: device_shot shows a phone, tablet, laptop, monitor or desk with its "
                     "screen and moments on spoken words, and the device stays swappable after the storyboard", "source": "runtime/three/presets",
                     "items": pr})
    return {"generated_by": "loom/capabilities.py (py -m loom catalog; do not hand-edit)", "missing_tags": missing, "capabilities": caps}


def markdown(d: dict) -> str:
    md = ["# What Loom can draw (generated by `py -m loom catalog`; do not hand-edit)", "",
          "One line each on WHEN to use it. Details: `get_api_section(<section>)`; templates and blueprints: the catalogue.", ""]
    by: dict = {}
    for c in d["capabilities"]:
        by.setdefault(c["group"], []).append(c)
    for g in sorted(by):
        md += [f"## {g}", ""]
        for c in by[g]:
            md.append(f"- **{c['id']}** ({c['source']}; section: {c['section']}): {c['when']}. Call: `{c['api']}`")
            for k, v in (c.get("items") or {}).items():
                md.append(f"  - `{k}`" + (f": {v}" if v else ""))
        md.append("")
    return "\n".join(md)


def write() -> dict:
    d = build()
    write_json(OUT_JSON, d)
    OUT_MD.write_text(markdown(d), encoding="utf-8")
    return d


# what a drawn scene calls, per capability (the `api` column, as patterns over the scene files)
USAGE = {"character_rigs": r"ctx\.character\(", "places_and_camera": r"Loom\.place\.|Loom\.cam\.", "objects": r"Loom\.obj\.",
         "data_pictures": r"Loom\.data\.|Loom\.array\(", "depth_25d": r"ctx\.depth\(", "isometric": r"ctx\.iso\(",
         "fx_moments": r"fxMoment\(", "lottie": r"ctx\.lottie\(", "ui_artefacts": r"Loom\.ui\.(?:mail|inbox|chat|doc)",
         "product_in_use": r"m\.tap\(|m\.typeInto\(|ui\.cursor\(", "morph": r"Loom\.morph\.|m\.morph\(", "stepped_time": r"Loom\.stepped\.",
         "swap_slot": r"Loom\.slot\(", "magnifier_and_cutaway": r"Loom\.magnify", "treatments": r"Loom\.treat\.",
         "scenery_sets": r"ctx\.scenery\(|ctx\.crowd\(", "glow_kit": r"Loom\.glow\.", "hold_and_transform": r"Loom\.hold\.",
         "geography": r"Loom\.geo\.", "vendor_art": r"Loom\.art\.", "springs_and_gestures": r"m\.spring\(|m\.group\(|Loom\.spring\("}


def usage(project) -> dict:
    """The share of the lesson's beats by kind, and how many drawn scenes call each capability (a report, not a gate)."""
    sb = read_json(project.path("plan/storyboard.json"), {}) or {}
    scenes = sb.get("scenes") or []
    n = len(scenes) or 1
    out: dict = {}
    for s in scenes:
        out[f"kind:{s.get('kind')}"] = out.get(f"kind:{s.get('kind')}", 0) + 1
    out = {k: f"{v / n:.0%}" for k, v in sorted(out.items())}
    files = [f.read_text(encoding="utf-8") for f in sorted(project.path("scenes").glob("*.js"))] if project.path("scenes").exists() else []
    for cid, rx in USAGE.items():
        k = sum(1 for src in files if re.search(rx, src))
        if k:
            out[cid] = f"{k} of {len(files)} scene files"
    return out


def library_sets() -> dict:
    """The engine's ready places and objects, read from runtime/places.js and runtime/objects.js: {places: {kind: [anchor]},
    objects: {kind: [family]}}. A kit or a beat may build on them; nothing requires it (D-148)."""
    places, objects = {}, {}
    src = (ENGINE_ROOT / "runtime" / "places.js").read_text(encoding="utf-8")
    kinds = re.search(r"P\.KINDS\s*=\s*\[([^\]]*)\]", src)
    for k in re.findall(r'"(\w+)"', kinds.group(1) if kinds else ""):
        m = re.search(rf"P\.{k}\s*=\s*function(.*?)(?=\n  P\.\w+\s*=|\Z)", src, re.S)
        body = m.group(1) if m else ""
        a = re.search(r"Object\.assign\(R\.anchors,\s*\{(.*?)\}\);", body, re.S)
        places[k] = re.findall(r"[{,]\s*(\w+)\s*:", "{" + a.group(1)) if a else []
    osrc = (ENGINE_ROOT / "runtime" / "objects.js").read_text(encoding="utf-8")
    fam = re.search(r"O\.FAMILIES\s*=\s*\{(.*?)\};", osrc, re.S)
    for k, v in re.findall(r"(\w+):\s*\[([^\]]*)\]", fam.group(1) if fam else ""):
        objects[k] = re.findall(r'"(\w+)"', v)
    return {"places": places, "objects": objects}


def library_note() -> str:
    """The block a kit-builder's brief carries: what the library has, as an option."""
    lib = library_sets()
    if not (lib["places"] or lib["objects"]):
        return ""
    places = "; ".join(f"{k} (anchors {', '.join(v)})" if v else k for k, v in lib["places"].items())
    objects = "; ".join(f"{k} ({', '.join(v)})" for k, v in lib["objects"].items())
    return ("THE ENGINE'S LIBRARY (an option, never a requirement):\n"
            f"- places, `Loom.place.<kind>(ctx, name, {{parent, side}})`, each a set with far, mid and near layers: {places};\n"
            f"- objects, `Loom.obj.shape(g, kind, cx, cy, size, {{family, state}})` into a group, or `Loom.obj.draw(ctx, name, kind, {{...}})`: "
            f"{objects} (states and passing time: get_api_section('Objects: things drawn as things')).\n"
            "If one of them reads as well for this lesson as a drawing of your own would, you may build a part on it and draw only "
            "what is the lesson's own (its words, its screen, its states). If none fits, draw your own. Say which you chose for each "
            "part, and why, in `verified`.")


def lookup(group: str | None = None) -> dict:
    d = read_json(OUT_JSON, {}) or {}
    caps = d.get("capabilities") or []
    if group:
        g = group.lower()
        caps = [c for c in caps if g in c["group"].lower() or g in c["id"].lower() or g in c["when"].lower()]
    slim = [{k: c[k] for k in ("id", "group", "when", "api", "section") if k in c} | ({"items": list(c["items"])[:40]} if c.get("items") else {})
            for c in caps]
    return {"capabilities": slim, "note": "get_api_section(section) for the API; catalog_search for templates and blueprints"}
