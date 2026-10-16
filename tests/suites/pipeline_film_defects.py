"""Pipeline defects from the five bench videos (2026-10-07), WS4 and WS5 of docs/strategy/2026-10-07-fix-prompt.md:
the length the planners never saw, framing the runtime ignores, keeps that name nothing, one template for a whole
lesson, avatar props nobody draws, placeholder and invented text, scene workers with no context, one person with five
looks, a critic that never ran, a router that could not name the new defects; and what the API path could not reach
(Manim, Skia, Three; most of the toolbox; the storyboard's own animatic; the mix as a quota).

Mock providers only, offline and keyless. Each test runs its check on a case WITH the defect (it must be reported) and
WITHOUT it (it must stay quiet). The clip-worker test needs Manim, skia-python and a Chrome, and skips by name without.
"""
from __future__ import annotations

import json
import math
import re
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))   # tests/: one browser check for every suite
from browser_support import browser  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from agents_runtime import DEMO, _outline, _plan, cast_storyboard, fresh_project, mock_env  # noqa: E402
from loom.util import LoomError, read_json, write_json  # noqa: E402

BENCH = ROOT / "projects"
MIXED = BENCH / "bench-20261006-151439-mixed-value"


def _copy_plan(p, length_min=None):
    for f in (DEMO / "plan").glob("*.json"):
        shutil.copy2(f, p.path("plan") / f.name)
    cast_storyboard(p)
    shutil.copy2(DEMO / "audio" / "timings.json", p.path("audio/timings.json"))
    if length_min is not None:
        cfg = read_json(p.path("project.json"))
        cfg["request"]["length_min"] = length_min
        p.save_cfg(cfg)


# ------------------------------------------------------------------ RC15: the length
def pipeline_length_is_sent_stated_and_bounded():
    """RC15: the storyboard and outline task messages carry the requested length (the request filter asked for key
    `length`, the request has `length_min`); the plan must state it (pacing.requested_s; "no length was requested" is
    refused); the script is held to 1.3x the request and to ceil(8 x length_min x 1.25) beats; the narrated length is
    refused past 1.3x the request when narrate runs, and the stage is marked rejected"""
    from loom import flow
    from loom.agents.conductor import task_message
    from loom.checks import gates as G
    import loom.narrate as N
    with fresh_project() as p:
        _copy_plan(p, length_min=2)
        write_json(p.path("plan/outline.json"), _outline())
        for role in ("storyboard_outline", "storyboard"):
            msg = task_message(p, role, {})
            assert "REQUESTED LENGTH: 2 minutes" in msg and re.search(r'"length_min":\s*2\b', msg), (role, msg[:300])
        tp = read_json(p.path("plan/teaching_plan.json"))
        tp["pacing"]["target_duration_s"] = 120
        tp["pacing"].pop("requested_s", None)
        write_json(p.path("plan/teaching_plan.json"), tp)
        E, _ = G.check_pedagogy(p)
        assert any("requested_s is missing" in e for e in E), E
        tp["pacing"]["requested_s"] = 120
        tp["pacing"]["duration_basis"] = "the requester supplied no target length"
        write_json(p.path("plan/teaching_plan.json"), tp)
        assert any("says no length was requested" in e for e in G.check_pedagogy(p)[0])
        tp["pacing"].pop("duration_basis")
        write_json(p.path("plan/teaching_plan.json"), tp)
        assert not [e for e in G.check_pedagogy(p)[0] if "requested" in e or "length" in e], "control: a plan that states 120 s"
        E, _ = G.check_script(p)
        n = len(read_json(p.path("plan/script.json"))["beats"])
        assert any("the request asks for about 120s (at most 156s)" in e for e in E), E
        assert any(f"{n} beats for a 2-minute request; at most {math.ceil(8 * 2 * 1.25)}" in e for e in E), E
        cfg = read_json(p.path("project.json")); cfg["request"]["length_min"] = 4; p.save_cfg(cfg)
        assert not [e for e in G.check_script(p)[0] if "request asks" in e or "beats for a" in e], "control: the same script for 4 minutes"
        cfg["request"]["length_min"] = 2; p.save_cfg(cfg)
        tm = read_json(p.path("audio/timings.json"))
        tm["duration"] = 200.0
        write_json(p.path("audio/timings.json"), tm)
        assert G.check_narration(p)[0], "200 s for a 2-minute request must be refused"
        real = N.narrate
        N.narrate = lambda project, force=False: None       # the voice itself is not under test
        from loom.narrate import asr as _asr                # nor the speech check (D-174): there is no audio here
        real_asr = _asr.check_speech
        _asr.check_speech = lambda project, **kw: ([], [], {"checked": False, "stub": True})
        try:
            try:
                flow.run_code(p, "narrate")
                raise AssertionError("narrate accepted a narration 1.67x the request")
            except LoomError as e:
                assert "narration runs 200s" in str(e), e
            assert p.stage_info("narrate").get("status") == "rejected", p.stage_info("narrate")
            tm["duration"] = 150.0
            write_json(p.path("audio/timings.json"), tm)
            flow.run_code(p, "narrate")
            assert p.stage_info("narrate").get("status") == "done", "control: 150 s for 120 s requested passes"
        finally:
            N.narrate = real
            _asr.check_speech = real_asr
    return "length sent to storyboard and outline; requested_s required; script 1.3x and 20 beats; narration refused at 200 s"


def pipeline_length_estimate_matches_the_narrated_benches():
    """RC15: the script's duration estimate (1.08 x words / wpm x 60 + 1.0 s a beat + pauses) is within 5 % of the
    narrated length of each of the five bench lessons; the old one (words / wpm x 60 + 0.8 s a beat) read 6 to 14 % short"""
    sys.path.insert(0, str(ROOT / "tools"))
    import importlib
    LC = importlib.import_module("length_calibration")
    rows, skipped = LC.rows(LC.BENCH)
    if not rows:
        return "skipped: the bench lessons of 2026-10-06 are not in projects/ on this machine"
    err = {r["id"]: (r["gate"] - r["narrated"]) / r["narrated"] for r in rows}
    old = {r["id"]: (r["old"] - r["narrated"]) / r["narrated"] for r in rows}
    assert all(abs(v) < 0.05 for v in err.values()), err
    assert sum(1 for v in old.values() if v < -0.05) >= 4, f"control: the old estimate read short on most benches {old}"
    return "; ".join(f"{k.split('-')[-1]} {100 * v:+.1f}% (was {100 * old[k]:+.1f}%)" for k, v in err.items())


# ------------------------------------------------------------------ RC9, RC10, RC5: framing and keep
def pipeline_framing_the_runtime_ignores_is_refused():
    """RC9, RC10: a nested station declaring its own w/h, and shot.focus or zoom on a template, blueprint, redtee or
    avatar beat, are storyboard errors; a bespoke beat may keep its focus; zoom 1 is no zoom"""
    from loom.checks import story as SB
    sb = {"world": {"stations": [{"id": "s", "x": 0, "y": 0}, {"id": "c", "parent": "s", "w": 960, "h": 540, "rect": {"x": 0, "y": 0, "w": 960, "h": 540}},
                                 {"id": "d", "parent": "s", "rect": {"x": 960, "y": 0, "w": 960, "h": 540}}]},
          "scenes": [{"beat": "b1", "kind": "template", "template": "compare.two", "shot": {"focus": [0, 0, 960, 540]}},
                     {"beat": "b2", "kind": "avatar", "shot": {"zoom": 1.5}},
                     {"beat": "b3", "kind": "bespoke", "shot": {"focus": [0, 0, 960, 540]}},
                     {"beat": "b4", "kind": "blueprint", "blueprint": "hero.hub", "shot": {"zoom": 1}}]}
    E = SB.framing_errors(sb)
    assert any(e.startswith("station c:") for e in E) and not any(e.startswith("station d:") for e in E), E
    assert {e.split(":")[0] for e in E if e.startswith("b")} == {"b1", "b2"}, E
    return f"{len(E)} errors: nested w/h, focus on a template, zoom on an avatar; bespoke focus and zoom 1 pass"


def pipeline_keep_names_must_exist_on_the_same_station():
    """RC5: keep names no earlier beat provides are errors (268 held_missing in openai-balanced); keep across stations
    is an error; keeping a template's container without its parts warns (an empty husk); a bespoke beat's design
    element can be kept (control)"""
    from loom.checks import story as SB
    sb = {"scenes": [{"beat": "b1", "station": "s", "kind": "template", "template": "document.page"},
                     {"beat": "b2", "station": "s", "kind": "template", "template": "definition", "keep": ["page"]},
                     {"beat": "b3", "station": "s", "kind": "template", "template": "list.steps", "keep": ["no_such_part"]},
                     {"beat": "b4", "station": "t", "kind": "bespoke", "keep": ["item_1"], "design": {"elements": [{"name": "chart"}]}},
                     {"beat": "b5", "station": "t", "kind": "bespoke", "keep": ["chart"]}]}
    E, W = SB.keep_checks(None, sb, ["b1", "b2", "b3", "b4", "b5"])
    assert any(e.startswith("b3: keep names ['no_such_part']") for e in E), E
    assert any(e.startswith("b4:") and "same station" in e for e in E), E
    assert not any(e.startswith(("b2:", "b5:")) for e in E), f"control: page from document.page and chart from b4's design: {E}"
    assert any(w.startswith("b2:") and "empty husk" in w for w in W), W
    return f"{len(E)} errors, {len(W)} warning"


# ------------------------------------------------------------------ RC17: variety and avatar
def pipeline_one_template_cannot_carry_a_lesson():
    """RC17: one template id over max(2, 15 % of beats) is an error (openai: document.page 20x in 52 beats); A-B-A-B
    alternation warns; a hybrid beat that is a plain template needs its motion layer"""
    from loom.checks import story as SB
    beats = [f"b{i:02d}" for i in range(1, 21)]
    sb = {"scenes": [{"beat": b, "kind": "template", "template": "document.page" if i % 2 else "compare.two"} for i, b in enumerate(beats)]}
    alloc = {"beats": {"b01": {"treatment": "hybrid"}, "b02": {"treatment": "hybrid"}}}
    sb["scenes"][1]["shot"] = {"move": "push"}
    E, W = SB.variety_checks(sb, beats, alloc)
    assert any("'document.page' is used 10 times in 20 beats" in e and "at most 3" in e for e in E), E
    assert any(w.startswith("ping-pong") for w in W), W
    assert any(e.startswith("b01: allocation says hybrid") for e in E) and not any(e.startswith("b02:") for e in E), E
    mixed = {"scenes": [{"beat": b, "kind": "bespoke"} if i % 3 else {"beat": b, "kind": "template", "template": f"t{i}"} for i, b in enumerate(beats)]}
    assert SB.variety_checks(mixed, beats, {}) == ([], []), "control: varied kinds and ids"
    return "cap, ping-pong and hybrid checks fire; a varied lesson is quiet"


def pipeline_avatar_props_are_checked_against_the_presenter():
    """RC17: avatar props the presenter does not read are an error (avatar_props_unknown; storyboards passed layout,
    case_labels, labels, rule); its real spec (catalog `avatar`) checks the card (3 lines at most)"""
    from loom.checks import gates as G
    from loom.checks import story as SB
    SB.avatar_spec.cache_clear()
    spec, keys = SB.avatar_spec()
    assert spec and "card" in spec, "the catalogue has no avatar spec: run py -m loom catalog"
    bad = SB.avatar_errors({"beat": "b1", "kind": "avatar", "props": {"layout": "presenter_with_case", "case_labels": ["Jordan"]}}, G._props_errors)
    assert bad and "case_labels" in bad[0] and "layout" in bad[0], bad
    long = SB.avatar_errors({"beat": "b2", "kind": "avatar", "props": {"title": "The rule", "card": {"lines": [{"text": "a"}, {"text": "b"}, {"text": "c"}, {"text": "d"}]}}}, G._props_errors)
    assert long, "a card of 4 lines must be refused"
    ok = SB.avatar_errors({"beat": "b3", "kind": "avatar", "props": {"title": "The rule", "kicker": "To keep", "card": {"lines": [{"text": "Name it"}]}}}, G._props_errors)
    assert ok == [], ok
    return "unknown keys and a 4-line card refused; a real card passes"


# ------------------------------------------------------------------ RC16: placeholder and invented text
def pipeline_placeholder_text_is_refused_and_empty_slots_pass():
    """RC16: props that describe a slot instead of filling it ("Blank strip", "Reply: left empty", TBD, "...") are
    errors that point to {"empty": true}; an empty item passes"""
    from loom.checks import story as SB
    sc = {"beat": "b1", "kind": "template", "template": "compare.two",
          "props": {"left": {"header": "Request", "say": "request", "items": [{"text": "Blank strip"}, {"text": "TBD"}]},
                    "right": {"header": "Reply: left empty", "say": "reply", "items": [{"text": "..."}, {"empty": True}]}}}
    E = SB.placeholder_errors(sc)
    assert len(E) == 4 and all('"empty": true' in e for e in E), E
    ok = dict(sc, props={"left": {"header": "Request", "say": "request", "items": [{"text": "Send the draft by Friday"}]},
                         "right": {"header": "Reply", "say": "reply", "items": [{"empty": True}]}})
    assert SB.placeholder_errors(ok) == [], "control: real words and an empty item"
    return "4 placeholders refused; empty: true passes"


def pipeline_bespoke_scenes_may_only_draw_the_lessons_words():
    """RC16: a bespoke scene's string literal with words the lesson never uses is reported (the fallback that printed
    "In yesterday's release planning meeting," for 155 s); the lesson's own words pass. On the real mixed-value bench
    files (read only, when present) b11 and b13 are flagged"""
    from loom.checks.text_audit import lesson_vocabulary, scene_literal_leaks, vocab_words
    vocab = vocab_words("Feedback that changes behaviour names what happened and why it mattered. Priya asks Dev for a minute.")
    src = 'Loom.scene("b11", { build(ctx) { const t = "In yesterday\'s release planning meeting,"; const u = "Priya asks Dev"; } });'
    leaks = scene_literal_leaks(src, vocab | vocab_words("in the and for"))
    assert len(leaks) == 1 and "yesterday" in " ".join(leaks[0]["words"]), leaks
    out = "no mixed-value bench here"
    if MIXED.exists():
        from loom.project import Project
        V = lesson_vocabulary(Project.open(str(MIXED)))
        hit = {b: scene_literal_leaks((MIXED / "scenes" / f"{b}.js").read_text(encoding="utf-8"), V) for b in ("b11", "b13")}
        assert all(any("yesterday" in lk["text"].lower() for lk in v) for v in hit.values()), hit
        out = "mixed-value b11 and b13 flagged: " + hit["b11"][0]["text"][:50]
    return out


def pipeline_scene_workers_get_held_elements_neighbours_and_cast():
    """RC16: a scene worker's task names the elements it may hold (names, kinds, the beat that drew them), the
    previous and next beats' narration and elements, and the cast (it saw only its own spec)"""
    from loom.agents.conductor import task_message
    with fresh_project() as p:
        _copy_plan(p)
        sb = read_json(p.path("plan/storyboard.json"))
        by = {s["beat"]: s for s in sb["scenes"]}
        by["b04"].update(kind="template", template="definition", station=by["b05"]["station"])
        write_json(p.path("plan/storyboard.json"), sb)
        tm = read_json(p.path("audio/timings.json"))
        bt = next(b for b in tm["beats"] if b["id"] == "b05")
        msg = task_message(p, "scene", {"scene": by["b05"], "beat_timing": bt, "file": "scenes/b05.js", "devices": []})
        script = {b["id"]: " ".join(b["narration"]) for b in read_json(p.path("plan/script.json"))["beats"]}
        assert "ON SCREEN WHEN YOUR BEAT STARTS (the previous beat is on this station" in msg and re.search(r'"kind":\s*"text"', msg) and "b04" in msg, msg[:600]
        assert script["b04"][:40] in msg and script["b06"][:40] in msg, "the neighbours' narration"
        assert "CAST (one look per person" in msg and "Maya" in msg, "the cast"
        by["b04"]["station"] = "elsewhere"
        write_json(p.path("plan/storyboard.json"), sb)
        msg2 = task_message(p, "scene", {"scene": by["b05"], "beat_timing": bt, "file": "scenes/b05.js", "devices": []})
        assert "ON SCREEN WHEN YOUR BEAT STARTS: nothing you can take" in msg2, "control: another station hands on nothing"
    return "held names, neighbours and cast in the task; nothing held across stations"


# ------------------------------------------------------------------ RC18: one person, one look
def pipeline_one_person_has_one_look():
    """RC18: people with no story.cast are an error; a cast entry without skin or cloth is an error; one name with two
    looks (template props by side, a scene file's rig) is an error; with a cast, a name resolves to the cast's look"""
    from loom.checks import story as SB
    with fresh_project() as p:
        sb = {"scenes": [{"beat": "b1", "kind": "template", "template": "document.page", "props": {"person": {"member": "woman", "name": "Jordan"}}},
                         {"beat": "b2", "kind": "template", "template": "scenario.dialogue",
                          "props": {"left": {"member": "man", "name": "Jordan"}, "right": {"member": "woman", "name": "Sam"}}},
                         {"beat": "b3", "kind": "bespoke"}]}
        E = SB.cast_errors(p, sb)
        assert any("story.cast is empty" in e for e in E) and any("'jordan'" in e and "one person, one look" in e for e in E), E
        sb["story"] = {"cast": [{"name": "Jordan", "member": "woman", "skin": 1, "cloth": "accent"}, {"name": "Sam", "member": "woman"}]}
        E2 = SB.cast_errors(p, sb)
        assert any("story.cast 'Sam' has no skin, cloth" in e for e in E2), E2
        assert not any("Jordan" in e and "draws" in e for e in E2), f"a name that is a cast member is drawn as the cast says: {E2}"
        # a template person drawn from a cast entry with no look at all: that entry's own error, no crash (bench budget,
        # 2026-10-07: the comparison read None as a look and raised)
        sb_nolook = {"story": {"cast": [{"name": "Kim", "role": "the colleague"}]},
                     "scenes": [{"beat": "b1", "kind": "template", "template": "document.page", "props": {"person": {"cast": "Kim", "name": "Kim"}}},
                                {"beat": "b2", "kind": "template", "template": "document.page", "props": {"person": {"cast": "Kim", "name": "Kim"}}}]}
        assert any("story.cast 'Kim' has no rig or member" in e for e in SB.cast_errors(p, sb_nolook)), SB.cast_errors(p, sb_nolook)
        p.path("scenes/b3.js").write_text('Loom.scene("b3", { build(ctx) { const j = ctx.character("jordan", "pip", { x: 900, y: 1000, skin: 2 }); } });', encoding="utf-8")
        E3 = SB.cast_errors(p, sb)
        assert any(e.startswith("b3:") and "Jordan" in e for e in E3), E3
        # controls, from finished lessons (a finding on reviewed work is a tool bug first): a designed rig carries its
        # own look (feedback-that-lands: Maya, rig maya, no skin); a story role nobody draws needs none ('the report')
        sb2 = {"story": {"cast": [{"name": "Maya", "rig": "maya"}, {"name": "the report", "role": "an object"}]},
               "scenes": [{"beat": "b4", "kind": "bespoke"}]}
        p.path("scenes/b4.js").write_text('Loom.scene("b4", { build(ctx) { const m = ctx.character("maya", "maya", { x: 600, y: 1000 }); } });', encoding="utf-8")
        assert SB.cast_errors(p, sb2) == [], SB.cast_errors(p, sb2)
        # what the cast leaves to the rig must still be one look: a second beat that draws her with another skin is refused
        sb2["scenes"].append({"beat": "b5", "kind": "bespoke"})
        p.path("scenes/b5.js").write_text('Loom.scene("b5", { build(ctx) { const m = ctx.character("maya", "maya", { x: 600, y: 1000 }); } });', encoding="utf-8")
        assert SB.cast_errors(p, sb2) == [], "control: the same look twice"
        p.path("scenes/b5.js").write_text('Loom.scene("b5", { build(ctx) { const m = ctx.character("maya", "maya", { x: 600, y: 1000, skin: 3 }); } });', encoding="utf-8")
        assert any(e.startswith("b5:") and "Maya" in e and "b4" in e for e in SB.cast_errors(p, sb2)), SB.cast_errors(p, sb2)
    return "no cast, an incomplete entry and a second look are errors; cast names resolve; a designed rig and an undrawn role pass"


# ------------------------------------------------------------------ RC19: the critic
def pipeline_the_critic_sees_every_beat_with_its_narration_and_runs_on_a_failed_check():
    """RC19: the critic is sent every sheet in batches of 40 (it saw the first 40 only), each beat's narration and
    on-screen props; it runs when the check FAILED, and its findings join the same repair round"""
    from PIL import Image
    from loom import flow
    from loom.agents.budget import Budget
    from loom.agents.conductor import Conductor
    from loom.stages import BY_NAME
    review = {"verdict": "ship", "findings": []}
    script = [{"match": {"tool_available": "submit_review"}, "reply": {"tool": "submit_review", "args": {"artifact": review}}, "repeat": 4}]
    with fresh_project() as p, mock_env(script) as m:
        _copy_plan(p)
        sheets = p.path("qa/sheets"); sheets.mkdir(parents=True, exist_ok=True)
        beats = [b["id"] for b in read_json(p.path("plan/script.json"))["beats"]]
        for i in range(45):     # one sheet per beat, named as qa.contact_sheets names them; a 45-beat lesson
            Image.new("RGB", (64, 36), (i, 40, 80)).save(sheets / f"{beats[i] if i < len(beats) else f'x{i:02d}'}.jpg")
        c = Conductor(p, "mock", Budget(2.0))
        found = c.critic_findings()
        assert found == [], found
        crit = [r for r in m.requests if "submit_review" in json.dumps(r.get("body") or {})]
        assert len(crit) == 2, f"45 sheets must go in 2 batches, not be cut at 40: {len(crit)} critic calls"
        body = json.dumps(crit[0]["body"], ensure_ascii=False)
        n_img = len(re.findall(r'"type": "image"|input_image|image_url|inline_data|inlineData', body))
        assert 0 < n_img <= 40 + 4, n_img
        narr = read_json(p.path("plan/script.json"))["beats"][0]["narration"][0][:30]
        assert narr in body and "props" in body and "which side is right or wrong" in body, "narration, props and the polarity rubric"
    with fresh_project() as p:
        _copy_plan(p)
        c = Conductor(p, "mock", Budget(1.0))
        seen = {}
        c.critic_findings = lambda: seen.setdefault("critic", []) or []
        c.repair = lambda source, critic=None: seen.setdefault("repair", source) and "failed"
        real = flow.run_code

        def boom(project, name, **kw):
            if name == "check":
                raise LoomError("check failed with 3 error(s)")
            return real(project, name, **kw)
        flow.run_code = boom
        try:
            p.set_stage("check", status="pending")
            code = c._pass([BY_NAME["check"]], "check")
        finally:
            flow.run_code = real
        assert "critic" in seen, "the critic did not look at a lesson whose check failed"
        assert code == 2 and "repair" in seen, (code, seen)
    return "45 sheets in 2 calls with narration, props and the polarity line; the critic runs on a failed check"


# ------------------------------------------------------------------ the router
def pipeline_router_sends_the_new_defects_to_their_owners():
    """Router: blurred_beat and foreign pixels go to the engine; an element off frame or a figure cropped goes to the
    storyboard when the beat's own shot focus causes it, else to the scene; scene_threw and tween_threw go to a
    bespoke beat's author and to the engine for a template; the storyboard's fix text names the framing causes"""
    from loom.agents import router as RT
    with fresh_project() as p:
        sb = {"scenes": [{"beat": "b05", "kind": "bespoke", "station": "s"}, {"beat": "b06", "kind": "bespoke", "station": "s", "shot": {"focus": [0, 0, 960, 540]}},
                         {"beat": "b07", "kind": "template", "template": "compare.two", "station": "s"}, {"beat": "b08", "kind": "bespoke", "station": "s"}]}
        write_json(p.path("plan/storyboard.json"), sb)
        write_json(p.path("qa/probe.json"), {"errors": [{"code": "scene_threw", "beat": "b05", "msg": "b05: x is null"},
                                                          {"code": "tween_threw", "beat": "b07", "msg": "b07: bad"}]})
        write_json(p.path("qa/report.json"), {"errors": [
            "b05: blurred_beat: the beat's own words are blurred at 3.0s",
            "b07: foreign pixels at 9.0s: 900 px of other beats' pictures on screen",
            "b05: off frame at 2.0s: card 'x' 40% outside the frame",
            "b06: off frame at 4.0s: card 'y' 60% outside the frame",
            "b08: off frame at 6.0s: character 'ava' cropped 120 px at the top and 0 px at the sides",
            "b07: words cut by the frame edge at 8.0s: \"Vague\" at [-40, 300, 80, 340]"]})
        rows = {(d["beat"], d["code"]): d for d in RT.collect(p)}
        assert ("b05", "blurred_beat") in rows and ("b07", "foreign_pixels") in rows and ("b08", "figure_cropped") in rows, list(rows)
        D = RT.route(p)
        owner = {(b, d["code"]): o for o, g in D.items() for b, ds in g.items() for d in ds}
        want = {("b05", "blurred_beat"): "engine", ("b07", "foreign_pixels"): "engine", ("b05", "element_off_frame"): "scene",
                ("b06", "element_off_frame"): "storyboard", ("b08", "figure_cropped"): "scene", ("b05", "scene_threw"): "scene",
                ("b07", "tween_threw"): "engine", ("b07", "words_cut"): "storyboard"}
        bad = {k: (owner.get(k), v) for k, v in want.items() if owner.get(k) != v}
        assert not bad, bad
        how = RT.fix_message("storyboard", [{"beat": "b07", "code": "words_cut", "detail": "x", "count": 1}], "check") if hasattr(RT, "fix_message") else ""
        src = Path(RT.__file__).read_text(encoding="utf-8")
        assert "shot.focus or zoom on a template" in src, "the storyboard's fix text names the framing causes"
        del how
    return f"{len(want)} defects to their owners"


def pipeline_keep_and_hand_overrides_are_logged():
    """A run with --keep logs, per accepted stage that today's gate would refuse, an override in the decision ledger
    (the bench kept 6-minute plans this way with no trace); a run without --keep re-checks instead (control)"""
    from loom import flow, ledger
    from loom.agents.budget import Budget
    from loom.agents.conductor import Conductor
    with fresh_project() as p:
        _copy_plan(p, length_min=2)
        tp = read_json(p.path("plan/teaching_plan.json")); tp["pacing"]["target_duration_s"] = 600; write_json(p.path("plan/teaching_plan.json"), tp)
        for st in ("brief", "knowledge", "pedagogy"):
            flow.mark_done(p, st, passed=True)       # accepted earlier, under an older gate
        Conductor(p, "mock", Budget(0.5)).run("brief", regate=False)
        rec = [r for r in ledger.read(p) if r.get("event") == "override" and r.get("decision") == "keep"]
        assert any(r["node"] == "pedagogy" and r["data"]["errors"] >= 1 for r in rec), rec
        assert p.stage_info("pedagogy").get("status") == "done", "--keep keeps the stage"
        n = len(rec)
        Conductor(p, "mock", Budget(0.5)).run("brief", regate=True)
        assert len([r for r in ledger.read(p) if r.get("event") == "override" and r.get("decision") == "keep"]) == n, "control: no --keep, no override"
    return f"--keep override logged ({rec[0]['data']['errors']} error(s) waived); a run without --keep logs none"


# ------------------------------------------------------------------ WS5: what the API path can reach
def pipeline_storyboard_refuses_a_kind_nobody_writes():
    """WS5: on the API path a storyboard beat of a kind no agent writes (media) is refused at submit with the kinds
    that are written; manim, skia and three now have a writer and pass"""
    from loom.agents import tools as T
    from loom.checks.story import api_path_kind_errors
    sb = {"scenes": [{"beat": "b1", "kind": "media"}, {"beat": "b2", "kind": "manim"}, {"beat": "b3", "kind": "skia"}, {"beat": "b4", "kind": "three"},
                     {"beat": "b5", "kind": "bespoke"}]}
    E = api_path_kind_errors(sb)
    assert len(E) == 1 and E[0].startswith("b1: kind 'media' has no writer"), E
    with fresh_project() as p:
        _copy_plan(p)
        art = read_json(p.path("plan/storyboard.json"))
        art["scenes"][0]["kind"] = "media"
        r = T.call(T.ToolContext(p, "storyboard", "storyboard"), "submit_storyboard", {"artifact": art})
        assert not r.get("accepted") and any("no writer on the API path" in e for e in r.get("errors") or []), r
    return "media refused at submit; manim, skia and three written"


def pipeline_capabilities_list_every_runtime_builder():
    """WS5: the capabilities tool lists every runtime module that builds something (each declares a @capability line;
    only core, style and boot carry none), the templates, blueprints, rigs, world packs and the three clip renderers,
    and the generated file is current with the code"""
    from loom import capabilities as K
    from loom.agents import tools as T
    caps, missing = K.module_tags()
    assert not missing, f"runtime modules without a @capability line: {missing}"
    have = {f.name for f in (ROOT / "runtime").glob("*.js")}
    tagged = {c["source"].split("/")[-1] for c in caps}
    assert have - tagged == set(K.INFRA), sorted(have - tagged)
    built = K.build()
    on_disk = read_json(K.OUT_JSON, {}) or {}
    assert json.dumps(built["capabilities"], sort_keys=True) == json.dumps(on_disk.get("capabilities"), sort_keys=True), \
        "runtime/capabilities.json is stale: run py -m loom catalog"
    ids = {c["id"] for c in built["capabilities"]}
    need = {"character_rigs", "places_and_camera", "scenery_sets", "objects", "data_pictures", "depth_25d", "isometric", "fx_moments",
            "lottie", "ui_artefacts", "morph", "stepped_time", "swap_slot", "material_joins", "magnifier_and_cutaway", "world_packs",
            "rig_ids", "templates", "blueprints", "clip_manim", "clip_skia", "clip_three"}
    assert need <= ids, sorted(need - ids)
    assert all(c["api_path"] for c in built["capabilities"] if c["id"].startswith("clip_")), "clip kinds without a writer"
    for role in ("storyboard", "storyboard_outline", "scene", "clip"):
        assert "capabilities" in T.ROLE_TOOLS[role], role
    r = T.call(T.ToolContext(None, "scene", "scenes"), "capabilities", {"group": "people"})
    assert {"character_rigs", "rig_ids"} <= {c["id"] for c in r["capabilities"]}, r
    return f"{len(ids)} capabilities; {len(tagged)} modules tagged; the file is current"


def pipeline_discovery_tools_reach_the_whole_toolbox():
    """WS5: get_beat works (it raised on every call: allocation beats are a dict); get_example_scene reaches the lab,
    Manim, Skia and Three examples (it reached two files); SCENE_API's sub-topics resolve by name ("Treatments" failed
    9 times); scene workers can search the catalogue their card names"""
    from loom.agents import tools as T
    from loom.project import Project
    ctx = T.ToolContext(Project.open(str(DEMO)), "scene", "scenes")
    gb = T.t_get_beat(ctx, "b05")
    assert "beat" in gb and "allocation" in gb, gb.keys()
    picks = {q: T.t_get_example_scene(ctx, q).get("file") for q in ("data counter unit grid", "three device turn", "skia hero orb", "manim forgetting curve")}
    assert picks["data counter unit grid"].startswith("lab/") and picks["three device turn"] == "three/device_turn.js" \
        and picks["skia hero orb"] == "skia/hero_orb.py" and picks["manim forgetting curve"].endswith(".py"), picks
    for name in ("Treatments", "Places", "Data as a picture", "UI artefacts", "Primitives from the TED-Ed study"):
        assert T.section_text(ROOT / "docs" / "SCENE_API.md", name), name
    assert {"catalog_search", "get_catalog_entry"} <= set(T.ROLE_TOOLS["scene"])
    return f"get_beat ok; examples {picks}"


def pipeline_the_storyboard_looks_at_its_animatic_once():
    """WS5: after its first accepted submit the storyboard agent is sent its animatic (one panel per beat, nine to an
    image) and one revision round; `storyboard_stands` keeps it and is logged; a round that does not finish leaves the
    accepted storyboard (control)"""
    from loom import ledger
    from loom.agents.budget import Budget
    from loom.agents.conductor import Conductor
    script = [{"match": {"tool_available": "storyboard_stands"}, "reply": {"tool": "storyboard_stands", "args": {"note": "every beat shows its line"}}}]
    with fresh_project() as p, mock_env(script) as m:
        _copy_plan(p)
        p.set_stage("storyboard", status="done")
        r = Conductor(p, "mock", Budget(1.0)).look_at_animatic()
        assert r == "ok", r
        n_beats = len(read_json(p.path("plan/script.json"))["beats"])
        sheets = sorted(p.path("qa").glob("animatic_look_*.jpg"))
        assert len(sheets) == math.ceil(n_beats / 9), (len(sheets), n_beats)
        body = json.dumps(m.requests[-1]["body"], ensure_ascii=False)
        assert "LOOK ROUND" in body and len(re.findall(r'"type": "image"|input_image|image_url|inline_data|inlineData', body)) >= len(sheets), "the panels were not sent"
        assert any(x.get("decision") == "animatic_look" and x.get("choice") == "stands" for x in ledger.read(p))
    with fresh_project() as p, mock_env([]):
        _copy_plan(p)
        r = Conductor(p, "mock", Budget(1.0)).look_at_animatic()
        assert r in ("ok", "failed"), r
        assert read_json(p.path("plan/storyboard.json")) == read_json(DEMO / "plan" / "storyboard.json") | {"story": read_json(p.path("plan/storyboard.json")).get("story")}
    return f"{len(sheets)} animatic sheets sent; stands logged; an unfinished round changes nothing"


def pipeline_the_mix_is_a_ceiling_in_an_agents_run():
    """WS5 (L-240): in an agents run (request mix_as ceiling, set by the conductor) a template-allocated beat may be
    drawn without an upgrade reason or the 25 % cap; outside it the old rule holds (control); the report states the
    share of each kind and capability"""
    from loom import capabilities as K
    from loom.agents.budget import Budget
    from loom.agents.conductor import Conductor
    from loom.checks import gates as G
    with fresh_project() as p:
        _copy_plan(p)
        al = read_json(p.path("plan/allocation.json"))
        sb = read_json(p.path("plan/storyboard.json"))
        tpl = [s for s in sb["scenes"] if (al["beats"].get(s["beat"]) or {}).get("treatment") == "template" and s["kind"] == "template"][:2]
        for s in tpl:
            s["kind"] = "bespoke"
        write_json(p.path("plan/storyboard.json"), sb)
        E, _ = G.check_storyboard(p)
        assert any(f"{tpl[0]['beat']}: allocation says 'template'" in e for e in E), "control: outside an agents run the quota holds"
        Conductor(p, "mock", Budget(0.1))
        assert read_json(p.path("project.json"))["request"]["mix_as"] == "ceiling"
        E2, W2 = G.check_storyboard(p)
        assert not any("allocation says 'template'" in e for e in E2), E2
        assert any("the mix is a ceiling" in w for w in W2), W2
        share = K.usage(p)
        assert share.get("kind:bespoke") and share.get("kind:template"), share
    return f"ceiling in an agents run; share {share}"


def pipeline_clip_workers_render_manim_skia_and_three():
    """WS5: a run whose storyboard has one manim, one skia and one three beat with no files gets three clip workers;
    each renders a draft through its bridge, looks at it (frames sent back), and submits; three clip files result.
    A submit before any render is refused"""
    try:
        import manim  # noqa: F401
        import skia  # noqa: F401
    except Exception as e:  # noqa: BLE001
        return f"skipped: Manim or skia-python is not installed here ({type(e).__name__})"
    if not browser():
        return "skipped: no Chrome here (Three.js clips render in a browser)"
    from loom.agents import tools as T
    from loom.agents.budget import Budget
    from loom.agents.conductor import Conductor
    FX = ROOT / "projects" / "_fxdemo"
    if not (FX / "plan" / "storyboard.json").exists():
        return "skipped: projects/_fxdemo (the clip demo) is not on this machine"
    src = {"b06": (ROOT / "scenes_examples" / "b06.py").read_text(encoding="utf-8"),
           "b11": (FX / "scenes" / "b11_three.js").read_text(encoding="utf-8"),
           "b16": (FX / "scenes" / "b16_skia.py").read_text(encoding="utf-8")}
    script = []
    for b in ("b06", "b11", "b16"):
        script += [{"match": {"user_contains": f"clip for beat {b}"}, "reply": {"tool": "submit_clip", "args": {"artifact": {"beat": b, "verified": [], "unverified": []}}}},
                   {"match": {"user_contains": f"clip for beat {b}"}, "reply": {"tool": "render_clip", "args": {"source": src[b], "times": [1.0, 3.0]}}},
                   {"match": {"user_contains": f"clip for beat {b}"}, "reply": {"tool": "submit_clip", "args": {"artifact": {"beat": b, "verified": ["frames"], "unverified": []}}}}]
    with fresh_project() as p, mock_env(script) as m:
        _copy_plan(p)
        sb = read_json(FX / "plan" / "storyboard.json")
        sb["story"] = dict(sb.get("story") or {}, cast=read_json(p.path("plan/storyboard.json"))["story"]["cast"])
        write_json(p.path("plan/storyboard.json"), sb)
        for f in ("b05.js", "b10.js", "b14.py"):
            shutil.copy2(DEMO / "scenes" / f, p.path("scenes") / f)
        c = Conductor(p, "mock", Budget(3.0), scene_workers=3)
        r = c.scenes()
        rows = {t["beat"]: t for t in c.results}
        assert set(rows) == {"b06", "b11", "b16"} and all(t["role"] == "clip" for t in rows.values()), rows.keys()
        assert all(t["status"] == "accepted" for t in rows.values()), [(b, t["status"], t["errors"][:2]) for b, t in rows.items()]
        assert all(t["tool_calls"] == 3 for t in rows.values()), [(b, t["tool_calls"]) for b, t in rows.items()]
        refused = [r for r in m.requests if "render first: call render_clip" in json.dumps(r.get("body") or {})]
        assert len(refused) >= 3, "each worker's submit before a render must be refused"
        for b in ("b06", "b11", "b16"):
            assert p.path(f"media/{b}.webm").exists(), f"no clip for {b}"
            assert read_json(p.path(f"media/{b}.json"))["quality"] == "draft"
        files = [T.clip_target(p, s) for s in sb["scenes"] if s["beat"] in ("b06", "b11", "b16")]
        assert all(f.exists() for f in files), files
        assert r == "ok", r
    return "manim b06, three b11, skia b16: each rendered, looked at and submitted; 3 clips"


def pipeline_held_case_only_warns_in_the_scenes_gate_as_at_runtime():
    """ctx.held("Priya") where the beat before drew "priya" is a warning in the scenes gate, as it is at runtime
    (held_name_case); a name the beat before never drew is still an error (control). The gate refused the claude fork's
    b02 for a case difference the runtime takes (2026-10-07)"""
    from loom.checks import gates as G
    with fresh_project() as p:
        _copy_plan(p)
        sb = read_json(p.path("plan/storyboard.json"))
        by = {s["beat"]: s for s in sb["scenes"]}
        by["b04"].update(kind="bespoke", station=by["b05"]["station"])
        p.path("scenes/b04.js").write_text('Loom.scene("b04", { build(ctx) { const P = ctx.el("priya", { x: 0, y: 0, w: 10, h: 10 }); } });', encoding="utf-8")
        E, W = G._held_errors(p, sb, by["b05"], 'const a = ctx.held("Priya");')
        assert E == [] and W and "priya" in W[0] and "case" in W[0], (E, W)
        E2, _ = G._held_errors(p, sb, by["b05"], 'const a = ctx.held("Nobody");')
        assert E2 and "held_missing" in E2[0], E2
    return "case-only: a warning; a name never drawn: an error"
