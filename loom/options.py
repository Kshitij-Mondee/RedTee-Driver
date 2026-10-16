"""Options per beat (D-70): both ways stay available, and the person making the video chooses.

A storyboard scene may carry the other treatments it could use, so nothing earlier is lost when a newer
way is tried:

    {"beat": "b02", "kind": "bespoke", "scene": "b02", "option": "acting character", ...,
     "alternatives": {"illustrated bust": {"kind": "blueprint", "blueprint": "hero.character_moment", "props": {...}}}}

    py -m loom options <id>                     # every beat that has a choice, and what it is now
    py -m loom switch <id> <beat> "<option>"    # swap: the current treatment is kept as an alternative

Switching is a data swap, no model call and no scene code lost: a bespoke scene's file stays on disk
while its beat uses a blueprint, so switching back is instant. After a switch, compose and look at the
sheet again. The person asks in plain words ("use the illustrated faces for Maya"); the agent runs this.
"""
from __future__ import annotations

from .util import LoomError, info, read_json, write_json

# the fields that make up a treatment; everything else on the scene (beat, station, joins, shot...) stays
TREATMENT = ("kind", "template", "blueprint", "scene", "props", "design", "register", "motion_is", "depth", "light",
             "manim", "media", "skia", "three", "page", "fx", "sfx", "keep", "order_cues")


def _label(sc: dict) -> str:
    return sc.get("option") or (sc.get("template") or sc.get("blueprint") or (sc.get("kind") + " scene"))


KINDS = ("template", "blueprint", "bespoke", "manim", "avatar", "media", "redtee", "skia", "three", "page")


def validate(sb: dict) -> list[str]:
    """Each alternative must be a real treatment, so a switch can never leave a beat unbuildable."""
    E = []
    for sc in sb.get("scenes", []):
        for name, alt in (sc.get("alternatives") or {}).items():
            if not isinstance(alt, dict) or alt.get("kind") not in KINDS:
                E.append(f"{sc['beat']}: alternative '{name}' needs a kind ({', '.join(KINDS)})")
            elif alt.get("kind") == "blueprint" and not alt.get("blueprint") or alt.get("kind") == "template" and not alt.get("template"):
                E.append(f"{sc['beat']}: alternative '{name}' names no {alt.get('kind')}")
    return E


def listing(project) -> list[dict]:
    sb = read_json(project.path("plan/storyboard.json"))
    out = []
    for sc in sb["scenes"]:
        alts = sc.get("alternatives") or {}
        if alts:
            out.append({"beat": sc["beat"], "now": _label(sc), "alternatives": sorted(alts)})
    return out


def switch(project, beat: str, option: str) -> dict:
    p = project.path("plan/storyboard.json")
    sb = read_json(p)
    sc = next((s for s in sb["scenes"] if s["beat"] == beat), None)
    if not sc:
        raise LoomError(f"no storyboard scene for beat {beat}")
    alts = sc.get("alternatives") or {}
    if option not in alts:
        have = ", ".join(sorted(alts)) or "none"
        raise LoomError(f"{beat}: no option '{option}' (now: '{_label(sc)}'; alternatives: {have})")
    current_name = _label(sc)
    current = {k: sc[k] for k in TREATMENT if k in sc}
    chosen = alts.pop(option)
    for k in TREATMENT:
        sc.pop(k, None)
    sc.update(chosen)
    sc["option"] = option
    alts[current_name] = current
    sc["alternatives"] = alts
    write_json(p, sb)
    from . import ledger as L
    L.log(project, "override", node=f"storyboard:{beat}", decision="switch", choice=option, options=sorted(alts),
          by={"kind": "human"}, data={"from": current_name})
    info(f"{beat}: now '{option}' (kept '{current_name}' as an alternative). Next: py -m loom go {project.id} --until check, then look at qa/sheets/{beat}.jpg")
    return {"beat": beat, "now": option, "kept": current_name}
