"""Style direction cards (D-189, L-474): the planners are told each style's strong calls and when they fit, and the
storyboard gate notes when a lesson leaves the signature moment out. The four style test lessons of 2026-10-16 passed
every gate, yet the hologram one had no hero (no `hero3d`, no `H.object`) and the blueprint one kept one plant layout for
85 % of its narration: nothing in planning asked for those calls.

  cards        one card per engine style, each at most CARD_MAX bytes, no em or en dash, and every engine call it names
               is in that style's engine guide (a planted card naming a call that does not exist is caught: the control)
  reach        Relay's storyboard_outline and storyboard task messages, Shuttle's P5 start message and get_style_pack
               (`direction_card`, first; the guide and engine guide last, so Shuttle's 64,000-character cut of a
               reply drops only their tail) carry the card; a lesson with the engine off, a style with no card and a
               session that does not plan (P7) do not
  soft check   a hologram lesson with no hero beat warns `holo_no_hero` and a blueprint lesson with one station over
               60 % of the narration warns `bp_one_layout`, through the storyboard gate as warnings, never errors;
               controls: a `hero3d` or a `design.hero` beat, sheets per section, the engine off and a short strip are
               quiet; the schema accepts a `hero3d` and refuses one without its params
"""
from __future__ import annotations

import copy
import json
import re
import shutil
import sys
import tempfile
from contextlib import contextmanager
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from loom import direction as D  # noqa: E402
from loom.project import Project  # noqa: E402
from loom.util import read_json, write_json  # noqa: E402

CALL = re.compile(r"`([A-Za-z]{1,4}\.[A-Za-z0-9]+)")


def _card_errors(style: str, text: str) -> list[str]:
    from loom.engines import engine_guide
    guide = engine_guide(style) or ""
    E = []
    if len(text.encode("utf-8")) > D.CARD_MAX:
        E.append(f"{style}: {len(text.encode('utf-8'))} bytes (at most {D.CARD_MAX})")
    if re.search("[–—]", text):
        E.append(f"{style}: an em or en dash")
    for c in sorted(set(CALL.findall(text))):
        if not re.search(re.escape(c) + r"(?![A-Za-z0-9])", guide):
            E.append(f"{style}: names {c}, which its engine guide does not have")
    return E


@contextmanager
def _lesson(scenes: list, style: str, words: dict | None = None, engine: str | None = None):
    """a throwaway lesson folder: project.json, a script whose beats speak `words` words each, and a storyboard"""
    d = Path(tempfile.mkdtemp(prefix="loom_direction_"))
    try:
        req = {"style": style, **({"engine": engine} if engine else {})}
        write_json(d / "project.json", {"id": "dir-test", "topic": "test", "mode": "topic", "request": req})
        write_json(d / "plan/script.json", {"beats": [{"id": s["beat"], "section": "s1",
                                                        "narration": [" ".join(["word"] * (words or {}).get(s["beat"], 10))]} for s in scenes]})
        write_json(d / "plan/storyboard.json", {"style": style, "scenes": scenes})
        yield Project(d)
    finally:
        shutil.rmtree(d, ignore_errors=True)


def _scenes(n: int, station=lambda i: "st", **extra) -> list:
    return [{"beat": f"b{i + 1:02d}", "kind": "bespoke", "station": station(i), "design": {"treatment": "briefing"}, **extra} for i in range(n)]


def _codes(W: list[str]) -> list[str]:
    return [w.split(":", 1)[0] for w in W]


def check_direction_cards_one_per_engine_style_small_and_naming_real_calls():
    from loom.engines import engines
    assert D.styles(), "no direction cards (a zero is red)"
    assert D.styles() == engines(), f"a card per engine style: cards {D.styles()}, engines {engines()}"
    E = []
    for s in D.styles():
        E += _card_errors(s, D.card(s))
    assert not E, E
    bad = D.card("hologram") + "\n- `H.notacall` for a planted test.\n"
    assert any("H.notacall" in e for e in _card_errors("hologram", bad)), "control: a call the guide lacks is caught"
    assert _card_errors("blueprint", "x" * (D.CARD_MAX + 1)), "control: an oversized card is caught"
    sizes = {s: len(D.card(s).encode("utf-8")) for s in D.styles()}
    return f"{len(sizes)} cards, {min(sizes.values())} to {max(sizes.values())} bytes; the planted call and size are caught"


def check_direction_card_reaches_relay_shuttle_p5_and_get_style_pack():
    from loom.agents import conductor as CD
    from loom.agents import tools as T
    from loom.shuttle import launch as LA
    with _lesson(_scenes(6), "hologram") as p:
        for f in ("brief", "persona", "teaching_plan", "allocation", "design_seed", "outline", "knowledge"):
            write_json(p.path(f"plan/{f}.json"), {})
        head = "STYLE DIRECTION CARD (hologram"
        for role in ("storyboard_outline", "storyboard"):
            assert head in CD.task_message(p, role, {}), f"{role}: no direction card"
        assert head not in CD.task_message(p, "script", {}), "the script role is not a planner of staging"
        msg = LA.start_message(p, ("P5", "P6"), {})
        assert head in msg and "hero3d" in msg, "Shuttle's P5 session: no direction card"
        assert head not in LA.start_message(p, ("P7", "P7"), {}), "a P7 session does not get the card"

        class Ctx:
            project = p
        out = T.t_get_style_pack(Ctx())
        assert list(out)[0] == "direction_card" and "hero3d" in out["direction_card"], list(out)[:3]
        assert list(out)[-2:] == ["guide_text", "engine_text"], f"the long texts last, so a cut reply keeps the rest: {list(out)}"
        cfg = read_json(p.path("project.json"))     # the classic way: the engine's calls do not exist
        cfg["request"]["engine"] = "off"
        p.save_cfg(cfg)
        assert head not in CD.task_message(p, "storyboard", {}) and "direction_card" not in T.t_get_style_pack(Ctx())
    with _lesson(_scenes(6), "flat-cosmos") as p:
        assert D.block(p) == "", "a style with no card adds nothing"
    return "outline, storyboard, Shuttle P5 and get_style_pack carry it; engine off, no card and P7 do not"


def check_direction_soft_check_hologram_hero_and_blueprint_layout_with_controls():
    # hologram: no hero beat warns; a hero3d beat, a design.hero beat, an H.object design, the engine off, a short strip
    # are quiet
    with _lesson(_scenes(8), "hologram") as p:
        W = D.storyboard_warnings(p, read_json(p.path("plan/storyboard.json")))
        assert _codes(W) == ["holo_no_hero"], W
    hero = _scenes(8)
    hero[4]["hero3d"] = {"bike": {"rect": [500, 80, 920, 820], "dur": 6, "params": {"model": "bicycle"}}}
    svg = _scenes(8)
    svg[4]["design"]["hero"] = "pushed SVG: the token stream as H.plane layers on H.stage"
    obj = _scenes(8)
    obj[4]["design"]["elements"] = ["H.object(\"rack\", {model: \"rack\"}) on H.pad"]
    for name, sc in (("hero3d", hero), ("design.hero", svg), ("H.object", obj)):
        with _lesson(sc, "hologram") as p:
            assert not D.storyboard_warnings(p, read_json(p.path("plan/storyboard.json"))), f"control {name}: quiet"
    with _lesson(_scenes(8), "hologram", engine="off") as p:
        assert not D.storyboard_warnings(p, read_json(p.path("plan/storyboard.json"))), "control: engine off is quiet"
    with _lesson(_scenes(D.MIN_BEATS - 1), "hologram") as p:
        assert not D.storyboard_warnings(p, read_json(p.path("plan/storyboard.json"))), "control: a short strip is quiet"
    # blueprint: one sheet for most of the narration warns, measured by words, not beats
    one = _scenes(8, station=lambda i: "plant" if i < 6 else f"detail{i}")
    with _lesson(one, "blueprint") as p:
        W = D.storyboard_warnings(p, read_json(p.path("plan/storyboard.json")))
        assert _codes(W) == ["bp_one_layout"] and "75%" in W[0] and "6 of 8 beats" in W[0], W
    with _lesson(one, "blueprint", words={f"b{i:02d}": 40 for i in (7, 8)}) as p:   # the two detail beats speak most
        assert not D.storyboard_warnings(p, read_json(p.path("plan/storyboard.json"))), "control: by words, the plant carries 43 %"
    sheets = _scenes(9, station=lambda i: ("arrangement", "section", "schematic")[i // 3])
    with _lesson(sheets, "blueprint") as p:
        assert not D.storyboard_warnings(p, read_json(p.path("plan/storyboard.json"))), "control: a sheet per section is quiet"
    with _lesson(_scenes(8), "isometric") as p:
        assert not D.storyboard_warnings(p, read_json(p.path("plan/storyboard.json"))), "control: isometric holds one board by design"
    return "holo_no_hero and bp_one_layout warn; hero3d, design.hero, H.object, sheets per section, engine off, short, isometric are quiet"


def check_direction_soft_check_in_the_storyboard_gate_on_the_two_test_lessons():
    """The real evidence through the real gate, on copies (the lessons themselves are never touched): st-holo-ai warns
    holo_no_hero, st-bp-cooling warns bp_one_layout, both as warnings only; one hero3d beat quiets the hologram copy, and
    the schema refuses a hero3d with no params."""
    from loom.checks import gates
    got = []
    for pid, code in (("st-holo-ai", "holo_no_hero"), ("st-bp-cooling", "bp_one_layout")):
        src = ROOT / "projects" / pid
        if not (src / "plan" / "storyboard.json").exists():
            got.append(f"{pid} skipped (its plan is not in this folder)")
            continue
        d = Path(tempfile.mkdtemp(prefix="loom_direction_gate_"))
        try:
            shutil.copy2(src / "project.json", d / "project.json")
            shutil.copytree(src / "plan", d / "plan")
            if (src / "scenes").exists():
                shutil.copytree(src / "scenes", d / "scenes")
            p = Project(d)
            E, W = gates.check_storyboard(p)
            assert code in _codes(W), f"{pid}: {code} not warned: {[w[:60] for w in W]}"
            assert not [e for e in E if code in e], f"{pid}: {code} must never be an error"
            if code == "holo_no_hero":
                sb = read_json(p.path("plan/storyboard.json"))
                sb2 = copy.deepcopy(sb)
                sb2["scenes"][3]["hero3d"] = {"rack": {"rect": [560, 80, 800, 820], "dur": 6, "params": {"model": "server_rack"}}}
                write_json(p.path("plan/storyboard.json"), sb2)
                E2, W2 = gates.check_storyboard(p)
                assert "holo_no_hero" not in _codes(W2), "control: one hero3d beat is quiet"
                assert not [e for e in E2 if "hero3d" in e], f"a valid hero3d is accepted by the schema: {E2[:3]}"
                sb2["scenes"][3]["hero3d"] = {"rack": {"rect": [560, 80, 800, 820], "dur": 6}}
                write_json(p.path("plan/storyboard.json"), sb2)
                E3, _ = gates.check_storyboard(p)
                assert any("params" in e for e in E3), f"the schema refuses a hero3d with no params: {E3[:3]}"
            got.append(f"{pid} warns {code}")
        finally:
            shutil.rmtree(d, ignore_errors=True)
    return "; ".join(got)
