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
    if style not in ("hologram", "blueprint") or len(scenes) < MIN_BEATS:
        return []
    from .engines import enabled_for
    if not enabled_for(project, style):
        return []
    W = []
    if style == "hologram" and not _hero_beats(sb):
        W.append(f"holo_no_hero: no beat of {len(scenes)} has a hero moment (a scene `hero3d`, a `design.hero`, or "
                 f"{' or '.join(HERO_CALLS)} in its design). The style's strength is the lesson's subject made of light: a "
                 "`hero3d` for a thing that reads better in 3D (a bicycle, the earth, a rack, a device), else a pushed-SVG "
                 "hero declared in `design.hero` (packs/direction/hologram.md)")
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
