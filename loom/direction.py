"""Direction cards per style (D-189): what a style's strong calls are and when each fits, read by the planners.

The engines can do more than the films showed (L-474): the hologram test lesson passed every gate with no hero, and the
blueprint one kept one plant layout for most of its length, because nothing in planning asked for those calls. A card
is `packs/direction/<style>.md`, at most CARD_MAX bytes, written in Loom's own direction from the style's engine guide
(`docs/styles/engines/<style>.md`, which stays the scene authors' full reference). It reaches:
  - Relay's storyboard_outline and storyboard roles, in their task message (agents/conductor.py);
  - Shuttle's P5 session, in its start message (shuttle/launch.py), and both pipelines' `get_style_pack`
    (`direction_card`, first).
Only a lesson that uses the style's engine gets the card: with `"engine": "off"` (the classic way) its calls do not exist.

`storyboard_warnings` is the soft check the storyboard gate runs: warnings, never errors (the person and the planner
decide; a style's move is an option, not a rule).
"""
from __future__ import annotations

import json
from pathlib import Path

from .util import ENGINE_ROOT

CARDS_DIR = ENGINE_ROOT / "packs" / "direction"
CARD_MAX = 3400            # bytes: the card is in the prompt every time; the engine guide stays on demand (D-163's budget);
                           # 2600 until D-190 added each style's motion and its kind-of-video lines
BP_LAYOUT_SHARE = 0.6      # blueprint: one station carrying more of the narration than this is "one layout"
MIN_BEATS = 6              # the soft check judges a lesson of at least this many beats (a test strip is not a lesson)
HERO_CALLS = ("H.object", "H.hero3d")


def card(style_id: str | None) -> str | None:
    f = CARDS_DIR / f"{style_id}.md"
    return f.read_text(encoding="utf-8") if style_id and f.exists() else None


def styles() -> list[str]:
    return sorted(p.stem for p in CARDS_DIR.glob("*.md")) if CARDS_DIR.exists() else []


def card_for(project) -> str | None:
    """The card of the lesson's style when the lesson uses that style's engine, else None."""
    from .engines import enabled_for
    sid = (getattr(project, "request", None) or {}).get("style")
    return card(sid) if enabled_for(project, sid) else None


def block(project) -> str:
    """The card as a prompt block ('' when the lesson has none)."""
    c = card_for(project)
    if not c:
        return ""
    sid = project.request.get("style")
    return (f"STYLE DIRECTION CARD ({sid}: this style's strong calls and when each fits; plan the ones this lesson's "
            f"content calls for, and say in the plan why a move is left out):\n{c.strip()}")


def _hero_beats(sb: dict) -> list[str]:
    out = []
    for s in sb.get("scenes") or []:
        d = s.get("design") if isinstance(s.get("design"), dict) else {}
        if s.get("hero3d") or d.get("hero") or any(c in json.dumps(d, ensure_ascii=False) for c in HERO_CALLS):
            out.append(s.get("beat"))
    return out


def _narration_words(project) -> dict:
    from .util import read_json
    script = read_json(project.path("plan/script.json"), {"beats": []}) or {"beats": []}
    return {b.get("id"): len(" ".join(b.get("narration") or []).split()) for b in script.get("beats") or []}


def storyboard_warnings(project, sb: dict) -> list[str]:
    """The soft check (L-474): a hologram lesson with no hero beat; a blueprint lesson whose one station carries most
    of the narration. Only for a lesson that uses the style's engine, of MIN_BEATS beats or more."""
    style = sb.get("style")
    scenes = [s for s in sb.get("scenes") or [] if s.get("beat")]
    from .engines import enabled_for, skin_refuses
    if not enabled_for(project, style):
        return []
    W = []
    # D-198: a template whose form the style's essence avoids (its skin refuses it): said, never refused (the person
    # and the planner may still choose it; it is drawn the style's way as far as it goes)
    refused = set(skin_refuses(style))
    for s in scenes:
        if s.get("kind") == "template" and s.get("template") in refused:
            W.append(f"template_not_this_style: {s['beat']} uses {s['template']}, a form the {style} style does not use "
                     f"(packs/essence/{style}.json avoid); stage it the style's own way (packs/direction/{style}.md)")
    if style not in ("hologram", "blueprint") or len(scenes) < MIN_BEATS:
        return W
    # hologram's hero check is an error now (storyboard_errors: holo_heroes_few, D-194)
    if style == "blueprint":
        words = _narration_words(project)
        per, total = {}, 0
        for s in scenes:
            n = words.get(s["beat"]) or 1
            per[s.get("station")] = per.get(s.get("station"), 0) + n
            total += n
        top, n = max(per.items(), key=lambda kv: kv[1])
        if total and n / total > BP_LAYOUT_SHARE:
            k = sum(1 for s in scenes if s.get("station") == top)
            W.append(f"bp_one_layout: station '{top}' carries {n / total:.0%} of the narration ({k} of {len(scenes)} beats). "
                     "A drawing set has many sheets: give the sections their own views (a plan, a section, an elevation, a "
                     "schematic, a detail sheet) and change the sheet at a section boundary; a camera lean-in on one sheet "
                     f"is not a new layout (more than {BP_LAYOUT_SHARE:.0%} warns; packs/direction/blueprint.md)")
    return W


HERO_EVERY = 8          # hologram: at least one hero beat per this many beats (D-194)
HOLO_TEMPLATE_MAX = 0.1  # hologram: at most this share of beats on catalog templates (console UI restyled)


def storyboard_errors(project, sb: dict) -> list[str]:
    """The hard half for hologram (D-194, superseding D-189's warning). Kshitij: "make it so that the video is not made or
    progresses until the hero hologram or holograms are made ... The hologram style needs the holograms more than anything.
    There doesn't need to be just 1 hologram but there has to be lesser normal corporate UI." A hologram lesson (engine on,
    MIN_BEATS beats or more) plans at least one hero beat per HERO_EVERY beats, each 3D hero names a model the library
    has, and at most HOLO_TEMPLATE_MAX of its beats are catalog templates."""
    if sb.get("style") != "hologram":
        return []
    scenes = [s for s in sb.get("scenes") or [] if s.get("beat")]
    from .engines import enabled_for
    if len(scenes) < MIN_BEATS or not enabled_for(project, "hologram"):
        return []
    E = []
    heroes = _hero_beats(sb)
    need = max(1, -(-len(scenes) // HERO_EVERY))
    if len(heroes) < need:
        E.append(f"holo_heroes_few: {len(heroes)} hero beat(s) for {len(scenes)} beats ({', '.join(heroes) or 'none'}); a hologram lesson needs "
                 f"at least {need} (one per {HERO_EVERY} beats, more where the subject is seen working): a `hero3d` for a thing that reads "
                 "better in 3D, else a pushed-SVG hero in `design.hero`. Nothing is narrated or built until they are planned "
                 "(packs/direction/hologram.md)")
    try:
        from .models3d import LIB
        known = {p.stem for p in LIB.glob("*.js")} if LIB.exists() else set()
    except Exception:
        known = set()
    E += subject_errors(sb, scenes, known)
    for s in scenes:
        for name, spec in (s.get("hero3d") or {}).items():
            m = ((spec or {}).get("params") or {}).get("model")
            if known and m and m not in known:
                E.append(f"holo_hero_model: {s['beat']}: hero \"{name}\" names model \"{m}\", which the model library does not have "
                         f"(use_tool([\"three\"]) lists them)")
    tpl = [s["beat"] for s in scenes if s.get("kind") in ("template", "blueprint")]
    if len(tpl) > HOLO_TEMPLATE_MAX * len(scenes):
        E.append(f"holo_ui_templates: {len(tpl)} of {len(scenes)} beats are catalog templates ({', '.join(tpl)}): console UI restyled cyan; at "
                 f"most {HOLO_TEMPLATE_MAX:.0%} in a hologram lesson. Stage them as holograms (packs/essence/hologram.json)")
    return E



def subject_errors(sb: dict, scenes: list, known: set) -> list[str]:
    """D-200: the lesson's central subject reaches the screen as a real 3D hero when it is a physical thing. st-holo-emoto
    (2026-10-16) planned an electric motorcycle; the library had no motorbike, the planner rightly refused the bicycle and
    then drew the bike as a pushed-SVG kit part, which `holo_heroes_few` counted as a hero and Kshitij called "weird
    looking and un-realistic". So a hologram storyboard declares `subject` ({what, physical, model}, or a list of them):
      - none declared: `holo_subject_undeclared`;
      - physical with no model, or one the library does not have: `holo_subject_model_missing`, naming the model to build.
        The run stops here: a model is built to the @model contract and its sheet looked at before planning goes on (a
        drawn stand-in never passes);
      - physical with a library model that no beat's hero3d uses: `holo_subject_not_3d`.
    An abstract subject (`physical: false`: a model, tokens, a pipeline) stays a pushed-SVG hero."""
    raw = sb.get("subject")
    subs = [x for x in (raw if isinstance(raw, list) else [raw]) if isinstance(x, dict) and x.get("what")]
    if not subs:
        return ["holo_subject_undeclared: the storyboard names no `subject`. Declare the lesson's central subject: "
                "\"subject\": {\"what\": \"...\", \"physical\": true|false, \"model\": \"<library id>\"}; a physical thing (a vehicle, a "
                "machine, a device, a planet) is a hero3d of its model, an abstract one a pushed-SVG hero (packs/direction/hologram.md)"]
    used = {((spec or {}).get("params") or {}).get("model") for s in scenes for spec in (s.get("hero3d") or {}).values()}
    E = []
    for x in subs:
        if not x.get("physical"):
            continue
        what, m = str(x["what"])[:60], x.get("model")
        if not m or m not in known:
            mid = m or "<id>"
            E.append(f"holo_subject_model_missing: the subject \"{what}\" is a physical thing and the 3D model library has "
                     f"{'no model named ' + repr(m) if m else 'no model named for it'}. A drawn SVG is not a stand-in, and a "
                     f"near model (a bicycle for a motorbike) misleads. The run stops here until assets/models3d/{mid}.js is "
                     f"built to the @model contract (real proportions, metres, its parts and keys; written like bicycle.js), "
                     f"`py -m loom models check` passes and its sheet (`py -m loom models sheet {mid} --style hologram`) has "
                     f"been looked at; then plan it as a hero3d. Do not declare it abstract to pass (use_tool([\"three\"]) lists the library)")
        elif m not in used:
            E.append(f"holo_subject_not_3d: the subject \"{what}\" has the library model \"{m}\" but no beat's hero3d uses it: "
                     f"put it on screen as a 3D hero (hero3d with params.model \"{m}\") where it is first seen working")
    return E
