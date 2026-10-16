"""World packs: the settings a lesson can live in, each with its scenes, its cast and its most common assets.

    py tools/world_packs.py            # validate packs/worlds/*.json, write docs/assets/WORLD_PACKS.md and the
                                       # end-to-end Claude Design prompts in docs/assets/world_prompts/
    py tools/world_packs.py --check    # validate only (exit 1 on a problem)

The JSON files are the source (edit them); WORLD_PACKS.md and the prompt files are generated from them, so the docs
and the data cannot drift. Styles listed per world are the styles such a world is commonly made in, never a ranking
(D-122).

A world with "brief": 2 is fully directed (identity, scale, object construction, and per scene: camera,
composition, light, depth, details, slots, anchors, variants, avoid; docs/research/2026-10-09-set-references.md).
For those worlds each (scene, set style) gets ONE paste-ready prompt that carries everything Claude Design needs:
the set contract with the style's exact palette (packs/set_styles.json, loom/set_styles.py), the return format,
the layout rules, the style's rendering block, the world, the object construction sheet, the scene, a plan-first
order and the quality check. Version 1 worlds keep their shorter prompt in WORLD_PACKS.md until they are directed.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
SRC = ROOT / "packs" / "worlds"
OUT = ROOT / "docs" / "assets" / "WORLD_PACKS.md"
PROMPTS = ROOT / "docs" / "assets" / "world_prompts"
REQ = ("id", "name", "purpose", "styles_common", "scenes", "cast", "assets")
REQ2_WORLD = ("identity", "objects")
REQ2_IDENT = ("place", "architecture", "materials", "inhabited", "scale", "default_light", "motifs", "avoid")
REQ2_SCENE = ("what", "shots", "for", "camera", "composition", "light", "far", "mid", "near", "details", "slots",
              "anchors", "variants", "avoid", "objects")
DASH = re.compile("[–—―]")


def load() -> tuple[list[dict], list[str]]:
    worlds, errs, seen = [], [], set()
    for f in sorted(SRC.glob("*.json")):
        w = json.loads(f.read_text(encoding="utf-8"))
        for k in REQ:
            if not w.get(k):
                errs.append(f"{f.name}: missing {k}")
        if w.get("id") != f.stem:
            errs.append(f"{f.name}: id '{w.get('id')}' must match the file name")
        if w.get("id") in seen:
            errs.append(f"{f.name}: duplicate id")
        seen.add(w.get("id"))
        ids = [s["id"] for s in w.get("scenes", [])]
        if len(ids) != len(set(ids)):
            errs.append(f"{f.name}: duplicate scene ids")
        for tier in ("core", "common", "optional"):
            if tier not in (w.get("assets") or {}):
                errs.append(f"{f.name}: assets.{tier} missing")
        txt = f.read_text(encoding="utf-8")
        if DASH.search(txt):
            errs.append(f"{f.name}: em or en dash")
        if w.get("brief") == 2:
            errs += [f"{f.name}: brief 2 needs {k}" for k in REQ2_WORLD if not w.get(k)]
            errs += [f"{f.name}: identity needs {k}" for k in REQ2_IDENT if not (w.get("identity") or {}).get(k)]
            sids = [x.get("id") for x in w.get("scenes", [])]
            core = [x for x in w.get("scenes", []) if x.get("reuse") in ("high", "medium")]
            if len(core) > 6:
                errs.append(f"{f.name}: {len(core)} high or medium scenes; a world starts with at most 6 (the places its lessons "
                            "actually happen in), more only as low with a reason")
            for s in w.get("scenes", []):
                body = json.dumps({k: v for k, v in s.items() if k != "id"})
                refs = [o for o in sids if o != s.get("id") and re.search(rf"\b{re.escape(o)}\b", body)]
                if refs:
                    errs.append(f"{f.name}: scene {s.get('id')} refers to {refs}; each prompt stands alone, so say it in full")
                miss = [k for k in REQ2_SCENE if k not in s or (not s[k] and k != "slots")]
                if miss:
                    errs.append(f"{f.name}: scene {s.get('id')} needs {miss} (a directed scene states all of them)")
                if "anchor_floor_y" not in " ".join(s.get("anchors") or []):
                    errs.append(f"{f.name}: scene {s.get('id')} has no anchor_floor_y")
                # every set must earn its place (Kshitij, 2026-10-10, D-153): the lesson moments it serves, how likely it
                # is to be chosen, and a reason to keep it when that is low
                if len(s.get("uses") or []) < 4:
                    errs.append(f"{f.name}: scene {s.get('id')} needs 'uses': at least 4 concrete lesson moments it would be chosen for")
                if s.get("reuse") not in ("high", "medium", "low"):
                    errs.append(f"{f.name}: scene {s.get('id')} needs 'reuse': high, medium or low (how often a real lesson would choose it)")
                if s.get("reuse") == "low" and not (s.get("keep") or "").strip():
                    errs.append(f"{f.name}: scene {s.get('id')} is low reuse: drop it, or say why it stays in 'keep'")
                unknown = [o for o in s.get("objects") or [] if o not in (w.get("objects") or {})]
                if unknown:
                    errs.append(f"{f.name}: scene {s.get('id')} names objects with no construction note: {unknown}")
                if len(s.get("details") or []) < 4:
                    errs.append(f"{f.name}: scene {s.get('id')} has fewer than 4 details (a lived-in place needs them)")
                people = re.search(r"\b(a person|people|someone|staff member|worker)s?\b(?! in the)", s.get("what", "") + " " + s.get("mid", ""))
                if people:
                    errs.append(f"{f.name}: scene {s.get('id')} puts people in the set ('{people.group(0)}'); the cast is separate")
        worlds.append(w)
    if not worlds:
        errs.append("no worlds found (a zero is red)")
    return worlds, errs


# ------------------------------------------------------------------ version 1 prompt (short, kept until directed)
def prompt(w: dict) -> str:
    scenes = "\n".join(f" {i}. {s['id']}: {s['what']} ({', '.join(s['shots'])})" + (f"; {s['notes']}" if s.get("notes") else "")
                       for i, s in enumerate(w["scenes"], 1))
    props = "; ".join(w["assets"]["core"]) + ". Then: " + "; ".join(w["assets"]["common"])
    cast = "\n".join(f" - {c['id']}: {c['role']}" for c in w["cast"])
    return f"""```
WORLD PACK: {w['name'].upper()} (for lessons on {w['purpose']}).
[Paste ONE style block from docs/assets/CHARACTER_PROMPTS.md: S1 to S9. Every piece in this pack uses it.]

SETS. Design these {len(w['scenes'])} sets at 1920 x 1080, each as depth layers <g id="back">, <g id="mid">,
<g id="front">, with a floor line (anchor_floor_y), empty wall areas as slot_wall_<n> for signs and screens, and
furniture anchors (desk_top, seat, screen_centre, counter_top, door_threshold as they apply). Leave the middle
third free enough for two characters. Light agrees with the style block; no people in the sets (the cast is
separate); no real brands, logos or readable text.
{scenes}

PROPS (the most common assets for this world; core first). Each its own SVG, front and 3/4 where it matters, text
areas as slot_ rects, moving parts (lids, hands of a clock, needles, doors, drawers) as groups with pivots:
{props}.

CAST (designed to stand in these sets; brief staff with C2 and the public with C15, deliver with the style's
deliverable block):
{cast}

ORDER: deliver the first set ({w['scenes'][0]['id']}) and five core props first; I review them before the rest.
Review every piece against the reject list in Prompt 0+ before delivering.
```"""


# ------------------------------------------------------------------ version 2: end-to-end prompts per scene and style
def _bul(items, ind="- "):
    return "\n".join(ind + x for x in items)


def contract(sid: str) -> str:
    from loom import set_styles as SS
    return f"""SET CONTRACT (the engine depends on every line of it)
FORMAT
- One SVG per set, viewBox="0 0 2400 1350". The visible frame is the centred 1920 x 1080 area; mark it with
  <rect id="frame_safe" x="240" y="135" width="1920" height="1080" fill="none" stroke="none"/>. The far layer covers
  the whole 2400 x 1350 canvas (overscan for camera pushes and pans); mid and near may stop at the frame edge.
- Three top-level groups in this order: <g id="far">, <g id="mid">, <g id="near">. Inside them, one named group per
  object (lowercase snake_case: table, chair_3, wall_screen, window_2). Draw the walls and the floor complete behind
  the furniture, so nothing has a hole when the layers slide apart.
- Light and surface effects go in classed groups inside each depth group: class="lm-shadow" (cast and contact
  shadows), class="lm-light" (light patches), class="lm-atmos" (haze, light shafts), class="lm-texture" (texture
  marks), class="lm-outline" (strokes, only if the style uses outlines), class="lm-hi" (highlight edges),
  class="lm-glow" (glow, only if the style uses it). Base shapes stay outside these groups.
- No <text>, no letters or numbers anywhere, no <image>, no filters, no masks, no clip paths, no external references.
  Gradients only where the style block allows them: two stops, palette colours only.
- Up to 700 KB per file; coordinates as integers or one decimal.
- Every position in the brief below (percent of height, thirds, left and right) refers to the visible 1920 x 1080
  frame, not the canvas.
- A mid or near object cropped by a frame edge continues at least 120 px into the overscan, so a camera move never
  shows its cut edge.

LIGHTS AND LIT THINGS (which palette tones draw them)
- A lit screen face: paper hi (the slot rect sits on it). A screen that is off: screen tones.
- Small lights (an exit sign, an LED, a card reader, a lift indicator): plant hi for green, accent hi for red, with
  lm-glow around them only if the style uses glow.
- A lamp's or a screen's spill on nearby surfaces: light at 0.3 to 0.6 fill-opacity in lm-light (a cool screen spill:
  glass base at 0.1 to 0.2).
- Night window glass: sky deep, with shadow over it at about 0.6 fill-opacity in lm-shadow; distant city lights as
  small light-coloured dots.
- A light or shadow shape lies only on the surface it lands on. Where an object of the same layer stands on that
  surface (a chair on a sunlit floor, a cup in a pane pattern on a table), the shape stops at the object's outline and
  never paints across it; light that falls on the object itself is drawn on the object's own shapes. A shadow or light
  shape laid over a chair makes the chair look like glass (the office sets of 2026-10-12).

PALETTE (use ONLY these exact hex values; the engine recolours a set by material and tone)
{SS.palette_text(sid)}
- A surface in light uses its hi tone, in shade its shade tone, in contact corners and crevices its deep tone.
- light, shadow and haze are only ever used on shapes with fill-opacity or stop-opacity. Whether light and shadow
  are drawn that way or as opaque surface tones is the style block's choice: follow it. Other palette colours are
  opaque, except glass and any wash or glaze the style block asks for.
- Pure #000000 and #FFFFFF are not in the palette: do not use them.

TEXT AND SCREENS
- Wherever words would be (screens, boards, signs, papers, labels), place an empty
  <rect id="slot_<name>" fill="none" stroke="none"/> sized to that area and draw only the object's surface. Abstract
  marks (lines, boxes, arrows on a whiteboard) are allowed; letters, numbers and logos are not.

ANCHORS
- Mark placement points as <circle id="anchor_<name>" r="2" fill="none"/> at the exact spot (feet on the floor, the
  middle of a seat, a table top, a screen centre). Always include anchor_floor_y on the floor line at mid depth.

DRAWING METHOD (the pilot of 2026-10-09 failed here: a program projected 3D boxes into 3,000 straight-edged
polygons, and every chair, cardigan and plant came out as blocks)
- Draw the set as an illustrator, by hand, object by object. Use the plan, the camera and the frame numbers to PLACE
  things and to keep the perspective true, never to model them: do not write a program that builds the picture from
  boxes or projected primitives.
- Soft and rounded things are drawn with curved paths (cubic or quadratic curves): upholstery, cushions, cloth and
  coats, leaves, pots, mugs, jugs, glasses, a lamp shade. Hard furniture has the corner radii and edge thicknesses of
  the real thing, no more: a chair back is a shaped shell, not a slab.
- Every shape belongs to a named object or surface. No unexplained rectangles, slabs or patches (a grey board on a
  chair seat, a mat on the floor) unless the brief names that object.
- Shadows take the shape of the thing that casts them (a chair's legs and seat, a jug's round base); no large soft
  ellipses or blotches standing in for shadows.

NO PEOPLE
- No people, hands, silhouettes or reflections of people. The cast is separate and is placed by the engine.

RIGHTS
- Original design: no real brands, logos, products, artworks or recognisable real buildings; unbranded objects."""


def return_format(w: dict, sid: str, s: dict) -> str:
    base = f"sets/{w['id']}/{s['id']}__{sid}"
    return f"""DELIVERY
1. Keep the set as its own file in this project: {base}.svg. Variants, when I ask for them, as
   {base}__<variant>.svg.
2. manifest.json at the project root:
   {{"batch": "{w['id']}-{s['id']}-{sid}", "assets": [{{"file": "{base}.svg", "kind": "set", "world": "{w['id']}",
     "scene": "{s['id']}", "set_style": "{sid}", "variant": "main", "slots": [...], "anchors": [...],
     "description": "one line"}}]}}
3. index.html as a review page, with the SAME svg markup inline (data-asset="{base}" on the <svg>) and the manifest in
   <script type="application/json" id="loom-manifest">. Show: (a) the set at full size; (b) the parallax check: far,
   mid and near shifted left by 0, 40 and 90 px, so I can see nothing has a hole; (c) the base check: the lm-light,
   lm-shadow and lm-atmos groups hidden, so I can see the room reads without its light; (d) the frame_safe area
   outlined.
4. Never export PNG or JPG; never draw letters. Reply with the file list and your self-review (QUALITY CHECK below)."""


def style_block(sid: str) -> str:
    from loom import set_styles as SS
    st = SS.style(sid)
    return f"""STYLE: {st['name'].upper()} (for {st['for']})
{_bul(st['render'])}
- Light: {st['light']}
- Texture: {st['texture']}
- Depth: {st['depth']}
- Quality bar: {st['quality_bar']}"""


def world_block(w: dict) -> str:
    I = w["identity"]
    return f"""THE WORLD: {w['name'].upper()}
{I['place']}
Architecture:
{_bul(I['architecture'])}
Materials: {I['materials']}
Scale (draw to these real sizes; a person is about 1.75 m):
{_bul(I['scale'])}
Signs of life (every set shows someone works here):
{_bul(I['inhabited'])}
Default light: {I['default_light']}
{('Outside: ' + I['outside']) if I.get('outside') else ''}
Motifs: {I['motifs']}"""


def objects_block(w: dict, s: dict | None = None) -> str:
    keys = (s or {}).get("objects") or list(w["objects"])
    return ("OBJECTS: every object must be a real, recognisable thing built the way the real one is built. A chair is\n"
            "a chair at a glance and in silhouette; nothing is an invented shape, a blob or a hybrid. A style may simplify\n"
            "the surface, never the parts that make an object what it is (seat, back and legs; a lid and a hinge). Build\n"
            "these as described (and anything else in the set the same way: the real object, its real parts and size):\n"
            + _bul([f"{k}: {w['objects'][k]}" for k in keys]))


def scene_block(s: dict) -> str:
    plan = ("Plan (draw from it; positions in the frame below come from this camera):\n" + _bul(s["plan"]) + "\n") if s.get("plan") else ""
    return f"""THE SET TO DRAW: {s['id']}: {s['what']} (shots it serves: {', '.join(s['shots'])}; used for {s['for']})
{plan}Camera: {s['camera']}
Composition: {s['composition']}
Light: {s['light']}
Far layer: {s['far']}
Mid layer: {s['mid']}
Near layer: {s['near']}
{('Motifs this camera can see (draw these; the others are out of view here): ' + s['motifs_here'] + chr(10)) if s.get('motifs_here') else ''}Details that make it specific (include all of them, placed naturally):
{_bul(s['details'])}
{('If space is short: ' + s['keep_first'] + chr(10)) if s.get('keep_first') else ''}{('Dominant materials (the families that carry this picture): ' + ', '.join(s['dominant']) + chr(10)) if s.get('dominant') else ''}Slots: {', '.join(s['slots']) if s['slots'] else 'none'}
Anchors: {', '.join(s['anchors'])}
Variants (ONLY after I approve the main set): {'; '.join(s['variants'])}"""


def check_block(w: dict, sid: str, s: dict | None) -> str:
    from loom import set_styles as SS
    d, st = SS.data(), SS.style(sid)
    return f"""QUALITY CHECK (run it before you reply; redraw what fails and say what you changed)
Layout:
{_bul(d['layout_rules'])}
Real-world sense (nothing absurd):
- The horizon is the one in the camera line; furniture sits ON the floor with contact shadows; nothing floats,
  intersects a wall or passes through another object.
- Sizes agree with the scale list: chairs fit under tables, doors are taller than people, screens and windows are
  the stated sizes, steps and sills are reachable.
- The set was drawn, not modelled: soft things have curved edges, chairs have shaped backs and seats, and no shape is
  an unexplained slab or patch.
- Every object reads at a glance and in silhouette as what it is (a chair as a chair, a plant as a real plant);
  every object listed in the scene is present, and nothing is there that would not be in this place.
- Light has one logic: every cast shadow falls away from the named source at a consistent angle; screens and lamps
  glow only if they are on in this version.
- No people, no letters, numbers or logos; slots are empty rects; the palette is exact.
Not in this style:
{_bul(st['reject'])}
Not in this world:
{_bul(w['identity']['avoid'])}""" + (f"""
Not in this set:
{_bul(s['avoid'])}""" if s else "")


def end_to_end(w: dict, sid: str, s: dict) -> str:
    """ONE paste-ready prompt for Claude Design: everything for one set in one style, in a fresh session."""
    return f"""You are a senior background designer and layout artist. You are drawing ONE SET (a place, without people)
for a code-rendered video engine that makes workplace training and explainer videos for adults. The engine moves a
camera through the set's three depth layers, relights it and recolours it, so the contract below is exact. The set
must look made by a professional for a real production, believable in every object and dimension.

{contract(sid)}

{return_format(w, sid, s)}

{style_block(sid)}

{world_block(w)}

{objects_block(w, s)}

{scene_block(s)}

ORDER
1. Before drawing, write a short plan: the horizon's y in the frame, the vanishing points, the focal point, where the
   light comes from and which way shadows fall, the free zones for characters (with their anchors), and what goes in
   the far, mid and near layers. Then draw the main set only.
2. Run the quality check, fix, then deliver as asked. Do not draw the variants until I approve.

{check_block(w, sid, s)}"""


def batch_prompt(w: dict, sid: str, ids: list[str]) -> str:
    """ONE paste-ready prompt for several sets of the same world in one style, drawn one after another in one session
    (each its own file, its own plan and camera). Shared parts are stated once."""
    from loom import set_styles as SS
    scenes = [next(x for x in w["scenes"] if x["id"] == i) for i in ids]
    keys = []
    for x in scenes:
        keys += [k for k in x["objects"] if k not in keys]
    files = "\n".join(f"   - sets/{w['id']}/{x['id']}__{sid}.svg" for x in scenes)
    blocks = "\n\n".join(f"========== SET {k} of {len(scenes)} ==========\n{scene_block(x)}\nNot in this set:\n{_bul(x['avoid'])}"
                          for k, x in enumerate(scenes, 1))
    return f"""You are a senior background designer and layout artist. You are drawing {len(scenes)} SETS (places, without
people) of one world, in one style, for a code-rendered video engine that makes workplace training and explainer videos
for adults. Each set is its own picture with its own plan and camera; they share the world, the style and the contract
below. The engine moves a camera through each set's three depth layers, relights it and recolours it, so the contract is
exact. Every set must look made by a professional for a real production, believable in every object and dimension.

{contract(sid)}

DELIVERY (for all {len(scenes)} sets)
1. Keep each set as its own file in this project:
{files}
2. ONE manifest.json at the project root listing every set: {{"batch": "{w['id']}-{sid}-batch", "assets": [{{"file": "...svg",
   "kind": "set", "world": "{w['id']}", "scene": "<scene id>", "set_style": "{sid}", "variant": "main", "slots": [...],
   "anchors": [...], "description": "one line"}}, ...]}}
3. index.html as a review page with the SAME svg markup inline (data-asset="sets/{w['id']}/<scene>__{sid}" on each <svg>) and
   the manifest in <script type="application/json" id="loom-manifest">. For each set show: the set at full size; the
   parallax check (far, mid and near shifted left by 0, 40 and 90 px); the base check (lm-light, lm-shadow, lm-atmos
   hidden); the frame_safe area outlined.
4. Never export PNG or JPG; never draw letters. Reply with the file list and your self-review per set.

{style_block(sid)}

{world_block(w)}

{objects_block(w, {"objects": keys})}

{blocks}

ORDER
1. Work ONE set at a time. For each: write its short plan (horizon y, vanishing points, focal point, light direction and
   shadow direction, free zones for characters with their anchors, what goes in far, mid and near), draw it, run the
   quality check, fix, save its file. Only then start the next set.
2. Never reuse one set's geometry, camera or furniture layout for another: each follows its own brief.
3. Do not draw any variants until I approve the main sets.

{check_block(w, sid, None)}"""


def props_prompt(w: dict, sid: str) -> str:
    """the world's props in one style, matching its sets (each its own SVG, same palette)"""
    from loom import set_styles as SS
    a = w["assets"]
    return f"""You are a senior prop designer. You are drawing the PROPS of one world for a code-rendered video engine
that makes workplace training and explainer videos for adults. They must match the sets of this world drawn in the
same style, and every prop must be a real, recognisable object built the way the real one is built.

FORMAT
- One SVG per prop, viewBox sized to the prop with 16 px of margin, the prop standing on its base line; mark the base
  with <circle id="anchor_base" r="2" fill="none"/> and any grip, screen or top with anchor_ circles.
- Groups: <g id="base"> for the shapes, and classed groups as in the set contract: lm-shadow (a contact shadow under
  the prop only), lm-light, lm-texture, lm-outline, lm-hi, lm-glow as the style uses them.
- Moving parts (a laptop lid, clock hands, a door, a drawer, a monitor arm) as their own groups with a pivot anchor.
- Views: front and three-quarter for furniture and devices; one view for small things.
- No text, letters, numbers or logos (slots as empty rects); no images, filters or masks; up to 120 KB per prop.

PALETTE (use ONLY these exact hex values)
{SS.palette_text(sid)}

DELIVERY: props/{w['id']}/<prop>__{sid}.svg each; manifest.json with kind "set_prop", world "{w['id']}",
set_style "{sid}", slots and anchors per file; index.html showing every prop on a neutral ground, at full size and at
quarter size (the silhouette check), with the same svg markup inline (data-asset per svg) and the manifest in
<script type="application/json" id="loom-manifest">.

{style_block(sid)}

{world_block(w)}

{objects_block(w)}

PROPS, core first (deliver the first eight, then wait for my review):
- core: {'; '.join(a['core'])}
- common: {'; '.join(a['common'])}
- optional: {'; '.join(a['optional'])}

QUALITY CHECK: each prop reads at quarter size as exactly what it is; proportions follow the scale list; the style's
rules hold; nothing resembles a real brand. Not in this style:
{_bul(SS.style(sid)['reject'])}"""


def prompt_files(worlds: list[dict]) -> dict[Path, str]:
    """every generated prompt file, {path: text}"""
    from loom import set_styles as SS
    out = {}
    styles = list(SS.data()["styles"])
    idx = ["# World prompts for Claude Design", "",
           "GENERATED by `py tools/world_packs.py` from `packs/worlds/*.json` and `packs/set_styles.json`. Do not edit;",
           "edit the JSON and regenerate.", "",
           "Each file is ONE paste-ready prompt for a fresh Claude Design session: the set contract with the style's exact",
           "palette, the return format, the layout rules, the style, the world, how each object is built, the scene, a",
           "plan-first order and the quality check. Bring the result back with",
           "`py tools/asset_intake.py <export.zip> --batch <name>`; the intake checks the palette, the layers and the slots.",
           "Styles are never ranked against each other (D-122): pick the one the lesson is made in.", ""]
    for w in worlds:
        if w.get("brief") != 2:
            continue
        idx += [f"## {w['name']} (`{w['id']}`)", "", "| scene | " + " | ".join(styles) + " |", "|---" * (len(styles) + 1) + "|"]
        for s in w["scenes"]:
            row = [f"`{s['id']}`" + ("" if s.get("checked") == "plan" else " (draft: not plan-checked)")]
            for sid in styles:
                p = PROMPTS / w["id"] / sid / f"{s['id']}.md"
                note = ("" if s.get("checked") == "plan" else
                        "\n> DRAFT: this scene's camera and layout have not been checked on a plan yet (the meeting room has). "
                        "Expect to correct its geometry after the first delivery.\n")
                out[p] = (f"<!-- GENERATED by py tools/world_packs.py: {w['id']} / {s['id']} / {sid}. Paste everything inside the block. -->\n{note}\n"
                          f"# {w['name']}: {s['id']} in {SS.style(sid)['name']}\n\n```\n{end_to_end(w, sid, s)}\n```\n")
                row.append(f"[prompt]({w['id']}/{sid}/{s['id']}.md)")
            idx.append("| " + " | ".join(row) + " |")
        for k, ids in enumerate(w.get("batches") or [], 1):
            brow = [f"batch {k}: " + ", ".join(ids)]
            for sid in styles:
                name = f"batch_{k}__{'_'.join(ids)}.md"
                p = PROMPTS / w["id"] / sid / name
                out[p] = (f"<!-- GENERATED by py tools/world_packs.py: {w['id']} / batch {k} ({', '.join(ids)}) / {sid}. Paste everything inside the block. -->\n\n"
                          f"# {w['name']}: batch {k} ({', '.join(ids)}) in {SS.style(sid)['name']}\n\n```\n{batch_prompt(w, sid, ids)}\n```\n")
                brow.append(f"[prompt]({w['id']}/{sid}/{name})")
            idx.append("| " + " | ".join(brow) + " |")
        prow = ["props"]
        for sid in styles:
            p = PROMPTS / w["id"] / sid / "props.md"
            out[p] = (f"<!-- GENERATED by py tools/world_packs.py: {w['id']} / props / {sid}. Paste everything inside the block. -->\n\n"
                      f"# {w['name']}: props in {SS.style(sid)['name']}\n\n```\n{props_prompt(w, sid)}\n```\n")
            prow.append(f"[prompt]({w['id']}/{sid}/props.md)")
        idx += ["| " + " | ".join(prow) + " |", ""]
    out[PROMPTS / "README.md"] = "\n".join(idx) + "\n"
    for p, t in out.items():
        if DASH.search(t):
            raise ValueError(f"{p}: an em or en dash in a generated prompt")
    return out


def render(worlds: list[dict]) -> str:
    L = ["# World packs: scenes, cast and the most common assets per setting", "",
         "GENERATED by `py tools/world_packs.py` from `packs/worlds/*.json`. Edit the JSON, then regenerate.", "",
         "**What a world pack is.** The setting a lesson lives in: its scenes (sets in depth layers), its cast, and the",
         "assets that setting almost always needs. An office will always need desks, chairs, screens and mugs: the",
         "`core` list is that, `common` is frequent, `optional` is occasional. Characters are briefed and reviewed with",
         "`skills/lnd/lnd-character-design`; prompts are assembled from `docs/assets/CHARACTER_PROMPTS.md` and the",
         "contract in `docs/ASSET_WISHLIST.md` (Prompt 0, Prompt 0+, Prompt R).", "",
         "**Directed worlds (brief 2)** have one paste-ready prompt per scene and style in `docs/assets/world_prompts/`",
         "(index: `docs/assets/world_prompts/README.md`), with real-world scale and object construction checked against",
         "references (`docs/research/2026-10-09-set-references.md`). The other worlds still carry the short prompt below",
         "until they are directed the same way.", "",
         "**Styles are never compared with each other** (D-122). Each world lists the styles it is commonly made in;",
         "the lesson chooses one, and a whole pack is drawn in that one style.", "",
         "| world | for lessons on | scenes | cast | core assets | directed |", "|---|---|---|---|---|---|"]
    for w in worlds:
        L.append(f"| [{w['name']}](#{w['id']}) | {w['purpose']} | {len(w['scenes'])} | {len(w['cast'])} | {len(w['assets']['core'])} | "
                 f"{'yes' if w.get('brief') == 2 else 'no'} |")
    for w in worlds:
        L += ["", "---", "", f"<a id=\"{w['id']}\"></a>", f"## {w['name']} (`{w['id']}`)", "",
              f"**For lessons on:** {w['purpose']}.", "",
              f"**Commonly made in:** {', '.join(w['styles_common'])} (not a ranking).", ""]
        if w.get("brief") == 2:
            L += [f"**The place:** {w['identity']['place']}", ""]
        L += ["**Scenes**", "", "| id | what | shots |", "|---|---|---|"]
        L += [f"| `{s['id']}` | {s['what']}{(' (' + s['notes'] + ')') if s.get('notes') else ''} | {', '.join(s['shots'])} |" for s in w["scenes"]]
        L += ["", "**Cast**", ""] + [f"- `{c['id']}`: {c['role']}" for c in w["cast"]]
        L += ["", "**Assets**", "", f"- **core (almost always needed):** {'; '.join(w['assets']['core'])}",
              f"- **common:** {'; '.join(w['assets']['common'])}", f"- **optional:** {'; '.join(w['assets']['optional'])}", ""]
        if w.get("brief") == 2:
            L += [f"**Claude Design prompts:** one per scene and style, in `docs/assets/world_prompts/{w['id']}/<style>/<scene>.md`, "
                  f"and the props in `.../<style>/props.md` (index: `docs/assets/world_prompts/README.md`)."]
        else:
            L += ["**Claude Design prompt for this world** (after Prompt 0, Prompt 0+ and Prompt R):", "", prompt(w)]
    return "\n".join(L) + "\n"


def stale(worlds: list[dict]) -> list[str]:
    """generated files that differ from what the sources give (for context_check)"""
    bad = []
    if not OUT.exists() or OUT.read_text(encoding="utf-8") != render(worlds):
        bad.append(str(OUT.relative_to(ROOT)))
    want = prompt_files(worlds)
    for p, t in want.items():
        if not p.exists() or p.read_text(encoding="utf-8") != t:
            bad.append(str(p.relative_to(ROOT)))
    have = set(PROMPTS.rglob("*.md")) if PROMPTS.exists() else set()
    bad += [f"{p.relative_to(ROOT)} (no longer generated)" for p in sorted(have - set(want))]
    return bad


def main() -> int:
    worlds, errs = load()
    for e in errs:
        print("problem:", e)
    if errs:
        return 1
    if "--check" in sys.argv:
        print(f"{len(worlds)} worlds valid")
        return 0
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(render(worlds), encoding="utf-8")
    files = prompt_files(worlds)
    for p in (set(PROMPTS.rglob("*.md")) if PROMPTS.exists() else set()) - set(files):
        p.unlink()
    for p, t in files.items():
        p.parent.mkdir(parents=True, exist_ok=True)
        p.write_text(t, encoding="utf-8")
    print(f"{len(worlds)} worlds -> {OUT.relative_to(ROOT)}; {len(files)} prompt files -> {PROMPTS.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
