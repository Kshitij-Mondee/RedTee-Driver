"""Hand-art intake for `Loom.hands` (D-114). Production home of the reference intake prim_c wrote in its tests.

Hand families live in `assets/hands/<family>/<pose>.svg` (contract: `assets/hands/README.md`). Compose and the lab embed
only the families a scene names (plus the pack's default family when its folder exists), the way vendor art and rigs
travel. A family that a scene names but that has no folder is a compose error; a missing DEFAULT family is not, because
the runtime carries the placeholder set and warns `hands_placeholder` whenever it reaches a frame.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

from .util import ENGINE_ROOT

HANDS = ENGINE_ROOT / "assets" / "hands"
HAND_POSES = ["point", "hold", "pinch", "place", "open", "tap", "grab", "thumbs", "count1", "count2", "count3", "count4", "count5"]
FAMILY_BY_LOOK = {"illustrated": "cartoon", "editorial": "flat", "technical": "line"}   # mirrors runtime/hands.js famDefault


def _svg_attr(s: str, name: str):
    m = re.search(rf'\b{name}="([^"]*)"', s.split(">", 1)[0])
    return m.group(1) if m else None


def embed(families: list[str]) -> tuple[dict, list[str]]:
    """{"<family>/<pose>": {w, h, body, anchor, wrist, wrist_width, licence, placeholder}} for the families given.
    Returns (assets, errors)."""
    out, errs = {}, []
    for fam in families:
        base = HANDS / fam
        if not base.is_dir():
            errs.append(f"hands: no family folder assets/hands/{fam}")
            continue
        for f in sorted(base.glob("*.svg")):
            s = re.sub(r"<\?xml[^>]*>|<!DOCTYPE[^>]*>|<metadata>[\s\S]*?</metadata>", "", f.read_text(encoding="utf-8")).strip()
            side = f.with_suffix(".json")
            meta = json.loads(side.read_text(encoding="utf-8")) if side.exists() else {}
            vb = [float(x) for x in (_svg_attr(s, "viewBox") or "0 0 400 640").replace(",", " ").split()]
            num2 = lambda v: [float(x) for x in v.split()] if isinstance(v, str) else v
            anchor = num2(meta.get("anchor") or _svg_attr(s, "data-anchor") or "")
            wrist = num2(meta.get("wrist") or _svg_attr(s, "data-wrist") or "")
            ww = float(meta.get("wrist_width") or _svg_attr(s, "data-wrist-width") or 0)
            lic = meta.get("licence") or _svg_attr(s, "data-licence")
            if not (anchor and len(anchor) == 2 and wrist and len(wrist) == 2 and ww > 0 and lic):
                errs.append(f"hands: {fam}/{f.stem}: needs data-anchor, data-wrist, data-wrist-width and data-licence")
                continue
            body = re.sub(r"^[\s\S]*?<svg[^>]*>|</svg>\s*$", "", s)
            if vb[0] or vb[1]:
                body = f'<g transform="translate({-vb[0]} {-vb[1]})">{body}</g>'
                anchor = [anchor[0] - vb[0], anchor[1] - vb[1]]; wrist = [wrist[0] - vb[0], wrist[1] - vb[1]]
            out[f"{fam}/{f.stem}"] = {"w": vb[2], "h": vb[3], "body": body.strip(), "anchor": anchor, "wrist": wrist, "wrist_width": ww,
                                     "licence": lic, "placeholder": (meta.get("placeholder") or _svg_attr(s, "data-placeholder")) in (True, "true")}
    return out, errs


def check_family(fam: str) -> list[str]:
    """The contract for one family: all poses, anchor inside the art, wrist on the bottom edge, one size per family;
    the placeholder carries its flag and its visible label, designed art must not."""
    assets, errs = embed([fam])
    errs += [f"{fam}: pose {p} missing" for p in HAND_POSES if f"{fam}/{p}" not in assets]
    sizes = {(a["w"], a["h"]) for a in assets.values()}
    if len(sizes) > 1:
        errs.append(f"{fam}: poses differ in size {sorted(sizes)} (a pose swap would jump)")
    for k, a in assets.items():
        if fam == "placeholder" and not (a["placeholder"] and "PLACEHOLDER" in a["body"]):
            errs.append(f"{k}: the placeholder must be marked data-placeholder and show the PLACEHOLDER label")
        if fam != "placeholder" and (a["placeholder"] or "PLACEHOLDER" in a["body"]):
            errs.append(f"{k}: designed art must not be marked or labelled placeholder")
        if not (0 <= a["anchor"][0] <= a["w"] and 0 <= a["anchor"][1] <= a["h"]):
            errs.append(f"{k}: anchor outside the art")
        if a["wrist"][1] != a["h"]:
            errs.append(f"{k}: the wrist must sit on the bottom edge (hands enter from an edge)")
    return errs


def default_family(style: dict) -> str:
    pk = style or {}
    return (pk.get("hands") or {}).get("family") or FAMILY_BY_LOOK.get(pk.get("look_family"), "flat")


def for_sources(sources: list[str], style: dict) -> tuple[dict, list[str]]:
    """What a build needs: the families the scenes name with a literal `family: "<name>"` inside a Loom.hands call,
    plus the pack's default family if its folder exists. Nothing when no scene uses Loom.hands."""
    used = [s for s in sources if "Loom.hands" in s]
    if not used:
        return {}, []
    named = set()
    for s in used:
        named |= set(re.findall(r"""family\s*:\s*["']([A-Za-z0-9_\-]+)["']""", s))
    named.discard("placeholder")   # the runtime carries it
    fams = sorted(named)
    d = default_family(style)
    if d not in named and (HANDS / d).is_dir():
        fams.append(d)
    return embed(fams)
