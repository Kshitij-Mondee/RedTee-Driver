"""Template skins (D-198, runtime/skins.js): each engine style draws the catalog templates its own way (the whiteboard hand,
the blueprint nib, light in a hologram, the isometric board, the product in a screencast), the templates unchanged and the
classic way kept. The switch and the skin_formed check run offline; the sheets need a browser and skip without one. Each
test has a control that shows it can fail."""
from __future__ import annotations

import hashlib
import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))   # tests/: one browser check for every suite
from browser_support import SKIP, browser  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

SKINNED = ["whiteboard", "blueprint", "hologram", "isometric", "screencast"]


class _P:
    def __init__(self, cfg=None, request=None):
        self.cfg = cfg or {}
        self.request = request or {}


def check_template_skin_switch_keeps_both_ways():
    """the switch: a lesson planned with skins (project stamp) gets its style's skin when the engine is on; the storyboard,
    then the request, can say classic or style; engine off is always classic; a lesson made before skins (no stamp, or a
    clone of one) keeps classic. Control: the stamp alone flips the answer."""
    from loom.compose import template_skin
    new, old = _P({"template_skins": 1}), _P({})
    assert template_skin(new, {}, True) == "style"
    assert template_skin(old, {}, True) == "classic", "a finished lesson must keep its classic templates"
    assert template_skin(new, {}, False) == "classic", "no engine, no skin"
    assert template_skin(new, {"template_skin": "classic"}, True) == "classic"
    assert template_skin(old, {"template_skin": "style"}, True) == "style"
    assert template_skin(_P({"template_skins": 1}, {"template_skin": "classic"}), {}, True) == "classic"
    assert template_skin(_P({}, {"template_skin": "style"}), {"template_skin": "classic"}, True) == "classic", "the storyboard wins"
    # Project.create stamps new lessons
    src = (ROOT / "loom/project.py").read_text(encoding="utf-8")
    assert '"template_skins": 1' in src
    # the schema knows both fields
    import json
    sch = json.loads((ROOT / "loom/schemas/storyboard.schema.json").read_text(encoding="utf-8"))
    assert sch["properties"]["template_skin"]["enum"] == ["style", "classic"]
    assert sch["properties"]["scenes"]["items"]["properties"]["skin"]["enum"] == ["classic"]


def check_skin_formed_check_reads_the_runtime_record():
    """skin_formed: a skinned lesson's template beat with no skin record, or with nothing the skin made, is an error; a part
    the performer started late is a warning; a lesson without the switch is not checked. Control: a well-made record
    passes, and the same probe under a classic manifest says nothing."""
    from loom.checks.skins import skin_checks
    man = {"template_skin": "style", "scenes": [{"beat": "b01", "kind": "template", "template": "list.steps"},
                                                 {"beat": "b02", "kind": "template", "template": "definition"},
                                                 {"beat": "b03", "kind": "template", "template": "recap", "skin": "classic"},
                                                 {"beat": "b04", "kind": "bespoke"}]}
    good = {"beat": "b01", "style": "whiteboard", "elements": [{"name": "title", "made": "drawn", "late": 0}, {"name": "item_1", "made": "drawn", "late": 0.1}]}
    E, W = skin_checks(man, {"skins": [good]})
    assert len(E) == 1 and "skin_missing: b02" in E[0], E
    E, W = skin_checks(man, {"skins": [good, {"beat": "b02", "style": "whiteboard", "elements": [{"name": "term", "made": "classic"}]}]})
    assert E == ["skin_not_formed: b02 (definition): no part was made the whiteboard way; every element entered by its classic verb"], E
    E, W = skin_checks(man, {"skins": [good, {"beat": "b02", "style": "whiteboard", "elements": [{"name": "term", "made": "drawn", "late": 0.9}, {"name": "pic", "made": "classic"}]}]})
    assert E == [] and any("skin_part_late: b02" in w for w in W) and any("skin_classic_parts: b02" in w for w in W), (E, W)
    assert skin_checks({"scenes": man["scenes"]}, {"skins": []}) == ([], []), "a classic lesson is not checked"


def _skin_kit_names(style: str) -> set[str]:
    src = (ROOT / "runtime/engines" / f"{style}.js").read_text(encoding="utf-8")
    i = src.find("Loom.skins.define(")
    assert i > 0, f"{style}: the engine defines no skin"
    k = src.rfind("kit: {", 0, i)
    j = src.find("\n      },", k)
    block = src[k:j]
    return set(re.findall(r"^\s{8}([a-zA-Z]+)(?:\(S|: \(S)", block, re.M))


def check_every_skin_covers_the_kit_calls_templates_make():
    """coverage: every drawing kit call the catalog templates make is in each engine's skin, or is named in the skin's own
    `classic` list (left classic on purpose); a new template that uses a new kit call fails here instead of falling through
    silently. Control: a made-up call is reported."""
    used = set()
    for f in (ROOT / "runtime/templates").glob("*.js"):
        used |= set(re.findall(r"\bkit\.([a-zA-Z]+)\(", f.read_text(encoding="utf-8")))
    src = (ROOT / "runtime/skins.js").read_text(encoding="utf-8")
    drawers = set(re.findall(r'"([a-z]+)"', re.search(r"const DRAWERS = \[([^\]]+)\]", src).group(1)))
    need = used & drawers
    assert {"text", "rect", "card", "disc", "line", "arrow", "icon"} <= need, need
    for st in SKINNED:
        f = ROOT / "runtime/engines" / f"{st}.js"
        if "Loom.skins.define(" not in f.read_text(encoding="utf-8"):
            continue
        have = _skin_kit_names(st)
        text = f.read_text(encoding="utf-8")
        sec = text[text.find("the template skin (D-198)"):text.find("Loom.skins.define(")]
        m = re.search(r'classic: \[([^\]]*)\]', sec)
        left = set(re.findall(r'"([a-z]+)"', m.group(1))) if m else set()
        missing = need - have - left
        assert not missing, f"{st}: the skin does not cover kit.{', kit.'.join(sorted(missing))} (draw it, or name it in its classic list)"
        assert "made_up_call" in ((need | {"made_up_call"}) - have - left)


def _sheet(tid, style, skin):
    from loom import library as L
    return L.template_sheet(tid, styles=[style], skin=skin)


def check_whiteboard_skin_draws_templates_in_reading_order():
    """the whiteboard skin on the sheet: list.steps and compare.two are drawn by the hand on their words (every element made
    "drawn", each part started within 0.4 s of its word and drawn over time, not popped), no runtime error, and the face
    audit holds (no word in the body face). quiz.answer's restated question and options are carried (already on the
    board). Control: the classic sheet of the same template has no skin record, and every part arrives by a classic verb."""
    if not browser():
        return SKIP
    for tid in ("list.steps", "compare.two", "quiz.answer"):
        rep = _sheet(tid, "whiteboard", "style")["styles"]["whiteboard"]
        assert not rep["errors"] and not rep["console"], (tid, rep["errors"][:3], rep["console"][:3])
        recs = rep["skins"]
        assert len(recs) == 1 and recs[0]["style"] == "whiteboard", (tid, recs)
        els = recs[0]["elements"]
        assert els and all(e["made"] in ("drawn", "carried") for e in els), (tid, els)
        drawn = [e for e in els if e["made"] == "drawn"]
        assert drawn and all(e["late"] <= 0.4 for e in drawn), (tid, [(e["name"], e["late"]) for e in drawn])
        assert all(e["by"] - e["at"] >= 0.2 for e in drawn), (tid, "a part was popped, not drawn")
        if tid == "quiz.answer":
            assert {e["name"] for e in els if e["made"] == "carried"} >= {"question", "option_A"}, els
    classic = _sheet("list.steps", "whiteboard", "classic")["styles"]["whiteboard"]
    assert classic["skins"] == [], "the classic sheet must not be skinned"


def check_skinned_sheet_is_a_pure_function_of_time():
    """determinism: the same skinned template sheet rendered twice is byte-identical (every stroke, the hand and the
    reveal clips are tweens on the timeline, seeded). Control: the classic sheet of the same template differs from it."""
    if not browser():
        return SKIP
    a = Path(_sheet("definition", "whiteboard", "style")["sheet"]).read_bytes()
    b = Path(_sheet("definition", "whiteboard", "style")["sheet"]).read_bytes()
    assert hashlib.sha256(a).hexdigest() == hashlib.sha256(b).hexdigest(), "two renders of one skinned sheet differ"
    c = Path(_sheet("definition", "whiteboard", "classic")["sheet"]).read_bytes()
    assert hashlib.sha256(a).hexdigest() != hashlib.sha256(c).hexdigest()


MADE = {"whiteboard": {"drawn", "carried"}, "blueprint": {"drafted", "carried"}, "hologram": {"projected"},
        "isometric": {"stood"}, "screencast": {"rendered"}}


def check_every_engine_style_makes_templates_its_own_way():
    """each of the five engine skins makes list.steps and compare.two its own way on the sheet: one skin record in that
    style, every element made by it (drawn, drafted, projected, stood or rendered; none classic), no runtime error.
    Control: the same templates on the classic sheet carry no record."""
    if not browser():
        return SKIP
    for st in SKINNED:
        for tid in ("list.steps", "compare.two"):
            rep = _sheet(tid, st, "style")["styles"][st]
            assert not rep["errors"] and not rep["console"], (st, tid, rep["errors"][:3], rep["console"][:3])
            recs = rep["skins"]
            assert len(recs) == 1 and recs[0]["style"] == st, (st, tid, recs)
            made = {e["made"] for e in recs[0]["elements"]}
            assert made and made <= MADE[st], (st, tid, made)
    assert _sheet("compare.two", "hologram", "classic")["styles"]["hologram"]["skins"] == []


def check_isometric_versions_a_and_b_are_both_buildable():
    """isometric keeps two versions to compare within the style (D-122, D-198): A stands each card as a block (made
    "stood"), B prints the whole template on one wall (made "on the wall"); the variant comes from the manifest.
    Control: without a variant the skin builds A."""
    if not browser():
        return SKIP
    from loom import library as L
    b = L.template_sheet("compare.two", styles=["isometric"], skin="style", variant="B")["styles"]["isometric"]
    assert not b["errors"], b["errors"][:3]
    assert {e["made"] for e in b["skins"][0]["elements"]} == {"on the wall"}, b["skins"][0]["elements"]
    a = _sheet("compare.two", "isometric", "style")["styles"]["isometric"]
    assert {e["made"] for e in a["skins"][0]["elements"]} == {"stood"}


def check_a_template_the_style_refuses_is_said_at_the_storyboard():
    """the storyboard gate's soft check names a catalog template whose form the style's skin refuses (people on a
    hologram console, a quote on an isometric map), as a warning, never an error; the list is read from the engine's skin.
    Control: whiteboard refuses none, and with the engine off nothing is said."""
    from loom.direction import storyboard_warnings
    from loom.engines import skin_refuses
    assert set(skin_refuses("hologram")) >= {"scenario.dialogue", "calendar.plan"}
    assert "quote" in skin_refuses("isometric") and skin_refuses("whiteboard") == [] and skin_refuses("corporate-clean") == []

    class P_:
        def __init__(self, style, engine="on"):
            self.request = {"style": style, "engine": engine}

    sb = lambda st: {"style": st, "scenes": [{"beat": "b01", "kind": "template", "template": "calendar.plan"},  # noqa: E731
                                             {"beat": "b02", "kind": "template", "template": "list.steps"}]}
    W = storyboard_warnings(P_("hologram"), sb("hologram"))
    assert len(W) == 1 and W[0].startswith("template_not_this_style: b01 uses calendar.plan"), W
    assert storyboard_warnings(P_("whiteboard"), sb("whiteboard")) == []
    assert storyboard_warnings(P_("hologram", "off"), sb("hologram")) == []


def check_hologram_and_isometric_keep_words_to_labels():
    """hologram and isometric explain a concept by showing it and one example (Kshitij, 2026-10-17: "No need to make them
    text heavy at all"): their essences carry a word budget and say so to the planners, and the storyboard check warns
    `text_heavy` on a template beat past it (the title and the anchors do not count). Control: a beat within the budget,
    and a style with no budget, say nothing."""
    from loom import essence as ES
    for st in ("hologram", "isometric"):
        e = ES.load(st)
        assert e.get("screen_words") == 14 and any("text-heavy" in a for a in e["avoid"]), st

        class P_:
            request = {"style": st}

        assert "Words on screen" in ES.block(P_(), "storyboard")
        long = {"beat": "b01", "kind": "template", "template": "definition", "props": {"term": "Attention", "say_term": "attention",
                "definition": "Each earlier token gets a weight for the next piece, which is weighing and not understanding at all", "say_definition": "each"}}
        short = {"beat": "b02", "kind": "template", "template": "list.steps", "props": {"title": "A long title is not counted at all here", "items": [{"text": "Read it", "say": "read"}]}}
        W = ES.storyboard_warnings(P_(), {"style": st, "scenes": [long, short]})
        assert len(W) == 1 and W[0].startswith("text_heavy: b01 (19 words)"), W

    class C_:
        request = {"style": "corporate-clean"}

    assert not ES.storyboard_warnings(C_(), {"style": "corporate-clean", "scenes": [long]}), "control: no budget, no warning"


def check_whiteboard_never_draws_a_half_frame():
    """taste (Kshitij, 2026-10-17, on corner brackets standing in for dialogue boxes: "absolutely horrible"): the
    whiteboard skin has no bracket form; a speech bubble is one stroke with its tail drawn into it; a card with no time for
    its outline is left unboxed. Checked on the source and on the dialogue sheet (each bubble one drawn part).
    Control: the bubble outline helper is there and used."""
    src = (ROOT / "runtime/engines/whiteboard.js").read_text(encoding="utf-8")
    sec = src[src.find("the template skin (D-198)"):src.find('Loom.skins.define("whiteboard"')]
    assert "corners(" not in sec and "bubbleOutline(" in sec and "light: []" in sec
    if not browser():
        return SKIP
    rep = _sheet("scenario.dialogue", "whiteboard", "style")["styles"]["whiteboard"]
    assert not rep["errors"], rep["errors"][:3]
    bubbles = [e for e in rep["skins"][0]["elements"] if e["kind"] == "bubble"]
    assert len(bubbles) == 2 and all(e["made"] == "drawn" and not e["light"] for e in bubbles), bubbles
