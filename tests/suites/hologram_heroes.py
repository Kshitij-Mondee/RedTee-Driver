"""The holograms first (D-194). Kshitij: "make it so that the video is not made or progresses until the hero hologram or
holograms are made ... Nothing should be forgotten or not done" and "The hologram style needs the holograms more than
anything. There doesn't need to be just 1 hologram but there has to be lesser normal corporate UI."

  audit      the hologram engine's audit, after every scene: a storyboard hero3d the scene never places is
             `holo_hero_unplaced`; a design.hero beat that draws no hologram is `holo_hero_not_drawn`; under 75 % of the
             bespoke beats showing a hologram is `holo_ui_heavy`; H.hero3d with no rendered clip is `holo_hero_missing`
             (errors). Control: every beat with a hologram and the hero placed raises none of the first three
  promises   every element a beat's design promises is drawn, held or named in its code; one nobody wrote is
             `design_element_missing` (on a copy of a real lesson: none missing; a planted promise is caught)
The storyboard half (holo_heroes_few, holo_hero_model, holo_ui_templates) is in tests/suites/style_direction.py.
"""
from __future__ import annotations

import copy
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

_UI = 'const H = ctx.engine.hud(ctx, { name: "hud_%(b)s" }); H.card("card_%(b)s", { x: 300, y: 300, w: 520, h: 270, kicker: "Load", value: 42, unit: "%%", label: "now", at: ctx.start + 0.2 });'
_HOLO = 'const H = ctx.engine.hud(ctx, { name: "hud_%(b)s" }); H.plane("plane_%(b)s", { x: 400, y: 260, w: 900, h: 420, at: ctx.start + 0.2 });'
_HERO = _HOLO + ' H.hero3d("rack", { rect: [500, 120, 800, 760] });'


def _scenes_js(kinds: dict) -> str:
    return "".join('Loom.scene("%s", { build(ctx) { %s } });\n' % (b, code % {"b": b}) for b, code in kinds.items())


def primitive_runtime_hologram_audit_refuses_a_lesson_without_its_holograms():
    from runtime_film_defects import _ONE, _SKIP, _browser, _lesson, _run
    if not _browser():
        return _SKIP
    defs = [{"kind": "bespoke"}, {"kind": "bespoke", "design": {"hero": "the token stream as planes of light"}},
            {"kind": "bespoke"}, {"kind": "bespoke", "hero3d": {"rack": {"rect": [500, 120, 800, 760], "dur": 4, "params": {"model": "server_rack"}}}}]
    bad = {"b1": _UI, "b2": _UI, "b3": _HOLO, "b4": _HOLO}
    out = _run(_lesson(_scenes_js(bad), copy.deepcopy(defs), _ONE, 4, style="hologram", engine="hologram"), "function () { return 1; }", [1.0])
    codes = {(e["code"], e["beat"]) for e in out["report"]["errors"]}
    assert ("holo_hero_unplaced", "b4") in codes, codes
    assert ("holo_hero_not_drawn", "b2") in codes, codes
    assert any(c == "holo_ui_heavy" for c, _ in codes), codes
    good = {"b1": _HOLO, "b2": _HOLO, "b3": _HOLO, "b4": _HERO}
    out2 = _run(_lesson(_scenes_js(good), copy.deepcopy(defs), _ONE, 4, style="hologram", engine="hologram"), "function () { return 1; }", [1.0])
    codes2 = {e["code"] for e in out2["report"]["errors"]}
    assert not codes2 & {"holo_hero_unplaced", "holo_hero_not_drawn", "holo_ui_heavy"}, f"control: {codes2}"
    assert "holo_hero_missing" in codes2, f"a placed hero with no rendered clip is an error, not a warning: {codes2}"
    return f"unplaced, not drawn and UI-heavy refused; the hologram lesson clean of them ({sorted(codes2)})"


def check_every_promised_design_element_is_delivered():
    import shutil
    import tempfile
    from loom.checks.film import promise_checks
    from loom.project import Project
    from loom.util import read_json
    src = ROOT / "projects" / "st-iso-order"
    if not (src / "plan" / "storyboard.json").exists():
        return "skipped: st-iso-order's plan is not in this folder"
    d = Path(tempfile.mkdtemp(prefix="loom_promise_"))
    try:
        shutil.copy2(src / "project.json", d / "project.json")
        shutil.copytree(src / "plan", d / "plan")
        shutil.copytree(src / "scenes", d / "scenes")
        p = Project(d)
        sb = read_json(d / "plan" / "storyboard.json")
        pr = read_json(src / "qa" / "probe.json", {}) or {}
        E, st = promise_checks(p, sb, pr)
        assert not E and st["promised"] > 50, (E, st)
        sb2 = copy.deepcopy(sb)
        beat = next(s for s in sb2["scenes"] if s.get("kind") == "bespoke")
        beat.setdefault("design", {}).setdefault("elements", []).append({"name": "zebra_crossing_marquee", "what": "never built"})
        E2, st2 = promise_checks(p, sb2, pr)
        assert len(E2) == 1 and "zebra_crossing_marquee" in E2[0] and E2[0].startswith("design_element_missing"), E2
        return f"{st['promised']} promises delivered on a copy of st-iso-order; a planted one refused"
    finally:
        shutil.rmtree(d, ignore_errors=True)
