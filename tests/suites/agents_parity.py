"""Pipeline parity (docs/strategy/2026-10-06-pipeline-parity-plan.md): the full Cowork reading as a cached prefix,
look-before-submit for scene workers, the defect router that sends each problem back to the agent that made it
(resuming its saved session), patches instead of rewrites, and storyboard upgrades of under-rated beats.
Mock providers only; every test is shown able to fail on the case it guards."""
from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from agents_runtime import DEMO, _outline, cast_storyboard, restamp, fresh_project, mock_env  # noqa: E402
from loom.agents import router as RT  # noqa: E402
from loom.agents import tools as T  # noqa: E402
from loom.agents.budget import Budget  # noqa: E402
from loom.agents.conductor import Conductor  # noqa: E402
from loom.agents.llm.anthropic import Anthropic  # noqa: E402
from loom.agents.llm.types import BadRequest, Message, Request, ToolSpec  # noqa: E402
from loom.agents.runtime import parity_files, role_system  # noqa: E402
from loom.util import read_json, write_json  # noqa: E402


def _copy_demo(p, subs=("plan", "audio", "scenes", "media")):
    for sub in subs:
        if (DEMO / sub).exists():
            shutil.rmtree(p.path(sub), ignore_errors=True)
            shutil.copytree(DEMO / sub, p.path(sub))
    cast_storyboard(p)
    write_json(p.path("state.json"), read_json(DEMO / "state.json"))
    restamp(p)


def agents_parity_prefix_is_the_cowork_reading_list():
    """--context parity puts every file the Cowork task file lists for the stage into the role's system prefix (the
    storyboard's 5 skills, guide, catalogue and prompt pack); cards does not. The prefix is byte-identical between
    tasks, which is what lets the provider cache it."""
    files = parity_files("storyboard")
    assert "docs/STORYBOARD_GUIDE.md" in files and "prompts/storyboard.md" in files and len(files) >= 7, files
    par, card = role_system("storyboard", "parity"), role_system("storyboard", "cards")
    for f in files:
        assert f"<<<< {f} >>>>" in par[0], f
        assert f"<<<< {f} >>>>" not in card[0], f
    first_heading = next(l for l in (ROOT / "skills/lnd/lnd-motion-fit/SKILL.md").read_text(encoding="utf-8").splitlines() if l.startswith("## "))
    assert first_heading in par[0] and first_heading not in card[0], first_heading
    assert role_system("storyboard", "parity") == par                       # stable: cacheable
    n_par, n_card = sum(map(len, par)), sum(map(len, card))
    assert n_par > 5 * n_card, (n_par, n_card)
    assert "<<<< " not in role_system("scene", "parity")[0] or "docs/SCENE_API.md" in role_system("scene", "parity")[0]
    try:
        role_system("storyboard", "everything")
        raise AssertionError("an unknown context must be refused")
    except ValueError:
        pass
    return f"storyboard prefix {n_par // 1000}k chars in parity vs {n_card // 1000}k in cards; {len(files)} files, identical on rebuild"


def agents_anthropic_caches_the_conversation_and_the_hour_falls_back():
    """The Anthropic body carries a cache breakpoint on the newest turn (so later turns and a resumed fix read the
    conversation from cache); with the 1-hour lifetime every breakpoint has it; a 400 naming `ttl` drops to the
    5-minute cache once instead of failing the run."""
    a = Anthropic(base="http://127.0.0.1:9", key="k")
    tool = ToolSpec("submit_storyboard", "x", {"type": "object", "properties": {}})
    req = Request(model="claude-sonnet-5-5", system=["S" * 2000], messages=[Message("user", "hello")], tools=[tool], cache_ttl="1h")
    _, _, body = a.build(req)
    marks = [body["system"][-1].get("cache_control"), body["tools"][-1].get("cache_control"), body["messages"][-1]["content"][-1].get("cache_control")]
    assert all(m == {"type": "ephemeral", "ttl": "1h"} for m in marks), marks
    _, _, b5 = a.build(Request(model="x", system=["S"], messages=[Message("user", "hi")], tools=[tool]))
    assert b5["messages"][-1]["content"][-1]["cache_control"] == {"type": "ephemeral"}
    calls = []

    def fake_http(method, url, headers, payload, timeout):
        calls.append(json.dumps(payload))
        if '"ttl"' in calls[-1]:
            return 400, {"type": "error", "error": {"type": "invalid_request_error", "message": "cache_control.ttl: Extra inputs are not permitted"}}, {}
        return 200, {"content": [{"type": "text", "text": "ok"}], "stop_reason": "end_turn", "usage": {"input_tokens": 5, "output_tokens": 1}}, {}
    a._http = fake_http
    Anthropic.no_ttl = False
    try:
        r = a.complete(req)
        assert r.text == "ok" and len(calls) == 2 and '"ttl"' in calls[0] and '"ttl"' not in calls[1], calls
        assert Anthropic.no_ttl
    finally:
        Anthropic.no_ttl = False
    # control: an unrelated 400 still raises
    a._http = lambda *x: (400, {"type": "error", "error": {"type": "invalid_request_error", "message": "messages: bad"}}, {})
    try:
        a.complete(req)
        raise AssertionError("an unrelated 400 must not be swallowed")
    except BadRequest:
        pass
    return "breakpoint on the newest turn; 1h on all three; a refused ttl falls back once; other 400s still raise"


def agents_scene_submit_refused_until_the_worker_looked():
    """submit_scene refuses a file nobody snapshotted (not counted as a resubmission); after a snapshot the same
    submission reaches the gate. Control: with the requirement off, it goes straight to the gate."""
    with fresh_project() as p:
        _copy_demo(p)
        src = (DEMO / "scenes" / "b05.js").read_text(encoding="utf-8")
        ctx = T.ToolContext(p, "scene", "scenes", beat="b05", target=p.path("scenes/b05.js"), extra={"require_snapshot": True})
        r = T.call(ctx, "submit_scene", {"artifact": {"beat": "b05", "source": src}})
        assert r["accepted"] is False and "lab_snapshot" in r["errors"][0] and not ctx.state.get("rounds"), r
        ctx.state["snapshots"] = 1
        r2 = T.call(ctx, "submit_scene", {"artifact": {"beat": "b05", "source": src}})
        assert r2["accepted"] is True and ctx.state["rounds"] == 1, r2
        ctx3 = T.ToolContext(p, "scene", "scenes", beat="b05", target=p.path("scenes/b05.js"), extra={"require_snapshot": False})
        assert T.call(ctx3, "submit_scene", {"artifact": {"beat": "b05", "source": src}})["accepted"] is True
    return "unlooked file refused without using a round; looked-at file judged by the gate; off switch works"


def _fake_check(p):
    """A check report as the engine writes it: probe errors with and without beats, film, compose and hf lines."""
    write_json(p.path("qa/probe.json"), {"errors": [
        {"code": "text_overflow", "msg": "text does not fit at the label floor (30px): \"A very long label\"", "beat": "b03"},
        {"code": "text_overflow", "msg": "text does not fit at the label floor (30px): \"A very long label\"", "beat": "b03"},
        {"code": "scene_threw", "msg": "b05: Cannot read properties of undefined (reading 'x')", "beat": "b05"},
        {"code": "held_missing", "msg": "b10: no element \"page\" in previous scene"},
        {"code": "held_missing", "msg": "b10: no element \"ghost\" in previous scene"},
        {"code": "tight_inset", "msg": "text sits 6.0px from the edge of its shape (needs 7.6px): \"Pause\"", "beat": "b17"},
        {"code": "icon_missing", "msg": "icon not bundled: undefined"},
    ], "warnings": []})
    man = read_json(DEMO / "build" / "manifest.json") if (DEMO / "build/manifest.json").exists() else {"beats": []}
    write_json(p.path("build/manifest.json"), man)
    b8 = next((b for b in man.get("beats") or [] if b["id"] == "b08"), None)
    t8 = (b8["start"] + b8["end"]) / 2 if b8 else 0.0
    write_json(p.path("qa/report.json"), {"ok": False, "errors": [
        "runtime text_overflow: text does not fit at the label floor (30px): \"A very long label\"",
        f"hf layout content_overlap @ {t8:.3f}: Two text blocks overlap and may render unreadable. [#lm-world]",
        f"hf layout content_overlap @ {t8:.3f}: Two text blocks overlap and may render unreadable. [#lm-world]",
        "b12: words cut by the frame edge at 80.1s: \"Ahead\" at [1800, 10, 2000, 90]",
        "b05: empty frame for 2 sampled moment(s) from 30.0s to 33.0s",
        "sample_text: b20 (icon.grid) drew words no prop supplied ['lorem']",
    ], "warnings": []})
    return bool(b8)


def agents_router_sends_each_defect_to_its_owner():
    """Template text and cut words and overlaps -> storyboard; anything inside a bespoke beat -> that scene's worker;
    a held element the storyboard keeps -> storyboard, one the scene asked for itself -> the scene; a template's own
    padding, sample text and unlocated errors -> engine (for a person). Repeats are counted, not repeated."""
    with fresh_project() as p:
        _copy_demo(p, ("plan",))
        located = _fake_check(p)
        D = RT.route(p, critic=[{"beat": "b13", "severity": "major", "problem": "steps crowd the frame", "fix": "fewer steps"},
                                {"beat": "b13", "severity": "minor", "problem": "nit", "fix": "x"}],
                     reported=[{"fix_route": "script", "beat": "b07", "what": "the line cannot be drawn", "by": "storyboard"}])
        sb, sc, en, sp = D["storyboard"], D["scene"], D["engine"], D["script"]
        assert [d["count"] for d in sb["b03"]] == [2], sb.get("b03")                      # two identical probe errors -> one, counted
        assert "b12" in sb and sb["b12"][0]["code"] == "words_cut", sb.keys()
        # since D-143 every critic finding goes to its owner, minors included, each with its severity
        assert "b13" in sb and sorted(d["detail"].split("]")[0] for d in sb["b13"]) == ["[major", "[minor"], sb.get("b13")
        assert set(sc) == {"b05", "b10"}, sc.keys()
        assert {d["code"] for d in sc["b05"]} == {"scene_threw", "empty_frame"}, sc["b05"]
        assert [d["detail"] for d in sc["b10"]] == ['b10: no element "ghost" in previous scene'], sc["b10"]
        assert any("\"page\"" in d["detail"] for d in sb["b10"]), sb.get("b10")             # `page` is in b10's keep: the storyboard's call
        assert "b17" in en and "-" in en and "b20" in en, en.keys()                          # padding, unlocated icon, sample text
        assert sp["b07"][0]["code"] == "reported", sp
        if located:
            assert sb["b08"][0]["count"] == 2, sb.get("b08")                                 # hf time mapped to its beat
        msg = RT.fix_message("storyboard", sb["b03"], "check")
        assert "patch_storyboard" in msg and "b03" in msg and "x2" in msg, msg
    return f"storyboard {RT.count(D, 'storyboard')}, scene {RT.count(D, 'scene')}, script 1, engine {RT.count(D, 'engine')}; repeats counted once"


def agents_patch_storyboard_replaces_only_named_scenes_and_never_leaves_a_broken_one():
    """patch_storyboard swaps one scene by beat and runs the storyboard gate; an unknown beat is refused; a patch the
    gate refuses puts the accepted storyboard back on disk."""
    with fresh_project() as p:
        _copy_demo(p)
        before = read_json(p.path("plan/storyboard.json"))
        sc = json.loads(json.dumps(next(s for s in before["scenes"] if s["beat"] == "b03")))
        sc["props"] = dict(sc.get("props") or {}, title=(sc.get("props") or {}).get("title", "Spacing") + " now")
        ctx = T.ToolContext(p, "storyboard", "storyboard")
        r = T.call(ctx, "patch_storyboard", {"scenes": [sc]})
        assert r["accepted"], r["errors"]
        after = read_json(p.path("plan/storyboard.json"))
        assert next(s for s in after["scenes"] if s["beat"] == "b03") == sc
        assert [s for s in after["scenes"] if s["beat"] != "b03"] == [s for s in before["scenes"] if s["beat"] != "b03"]
        bad = T.call(T.ToolContext(p, "storyboard", "storyboard"), "patch_storyboard", {"scenes": [dict(sc, beat="b99")]})
        assert not bad["accepted"] and "b99" in bad["errors"][0], bad
        broken = dict(sc, station="no-such-station")
        r3 = T.call(T.ToolContext(p, "storyboard", "storyboard"), "patch_storyboard", {"scenes": [broken]})
        assert not r3["accepted"] and any("station" in e for e in r3["errors"]), r3["errors"][:3]
        assert read_json(p.path("plan/storyboard.json")) == after                           # the accepted one is back
    return "one scene swapped, the rest byte-identical; unknown beat refused; a refused patch restores the accepted file"


def agents_storyboard_may_draw_an_underrated_beat_with_a_reason():
    """A template beat drawn as a blueprint is an error without `upgrade_reason` (with a hint), a warning with one,
    and an error again past 25 % of beats."""
    from loom.checks.gates import check_storyboard
    with fresh_project() as p:
        _copy_demo(p)
        sb = read_json(p.path("plan/storyboard.json"))
        motion = next(s for s in sb["scenes"] if s["beat"] == "b04")              # a hero.meter blueprint
        tpl = [s["beat"] for s in sb["scenes"] if s["kind"] == "template"]
        def put(beats, reason):
            d = json.loads(json.dumps(sb))
            for s in d["scenes"]:
                if s["beat"] in beats:
                    s.update({k: v for k, v in motion.items() if k not in ("beat", "station", "join_in")})
                    s.pop("template", None)
                    if reason:
                        s["upgrade_reason"] = reason
            write_json(p.path("plan/storyboard.json"), d)
            return check_storyboard(p)
        E, W = put([tpl[0]], None)
        assert any(f"{tpl[0]}: allocation says 'template'" in e and "upgrade_reason" in e for e in E), E[:4]
        E, W = put([tpl[0]], "the gap between sessions is a change over time")
        assert not any("allocation says" in e for e in E), E[:4]
        assert any("drawn instead, with a reason" in w for w in W), W[:6]
        many = tpl[: max(2, int(len(sb["scenes"]) * 0.25) + 1)]
        E, W = put(many, "the gap between sessions is a change over time")
        assert any("upgraded to drawn scenes" in e for e in E), E[:4]
    return f"no reason: error with hint; reason: warning; {len(many)} upgrades of {len(sb['scenes'])} beats: refused"


def agents_a_fix_resumes_the_owners_own_conversation():
    """A storyboard agent (Anthropic protocol) finishes and its session is saved; a check defect later resumes that
    same conversation: the fix request carries every earlier message unchanged (so it can be read from cache), plus
    one message naming only the defect, and the agent patches instead of rewriting."""
    with fresh_project() as p:
        _copy_demo(p)
        sb = read_json(p.path("plan/storyboard.json"))
        sc = json.loads(json.dumps(next(s for s in sb["scenes"] if s["beat"] == "b03")))
        sc["props"] = dict(sc.get("props") or {}, title="Spacing, shorter")
        write_json(p.path("plan/outline.json"), _outline())
        script = [
            {"match": {"provider": "anthropic", "tool_available": "submit_storyboard", "user_contains": "FIX REQUEST"},
             "reply": {"tool": "patch_storyboard", "args": {"scenes": [sc]}}},
            {"match": {"provider": "anthropic", "tool_available": "submit_storyboard"}, "reply": {"tool": "submit_storyboard", "args": {"artifact": sb}}},
        ]
        with mock_env(script) as m:
            c = Conductor(p, "mock", Budget(2.0), require_snapshot=False)
            r1 = c.run_role("storyboard", "storyboard", alias="mock-small")
            assert r1.status == "accepted", (r1.status, r1.errors, r1.note)
            sess = read_json(c.session_path("storyboard"))
            assert sess["alias"] == "mock-small" and len(sess["messages"]) >= 3, sess.keys()
            first = [x for x in m.requests if x["provider"] == "anthropic"][-1]["body"]["messages"]
            r2 = c.run_role("storyboard", "storyboard", fix="FIX REQUEST from the check.\n- b03 [text_overflow]: too long")
            assert r2.status == "accepted", (r2.status, r2.errors, r2.note)
            fixreq = [x for x in m.requests if x["provider"] == "anthropic"][-1]["body"]
            msgs = fixreq["messages"]
            strip = lambda ms: json.loads(json.dumps(ms).replace(', "cache_control": {"type": "ephemeral", "ttl": "1h"}', "").replace(', "cache_control": {"type": "ephemeral"}', ""))
            assert strip(msgs[:len(first)]) == strip(first), "the resumed conversation must start with the saved one, unchanged"
            assert "FIX REQUEST" in json.dumps(msgs[-1]) and "b03" in json.dumps(msgs[-1])
            assert msgs[-1]["content"][-1].get("cache_control"), "the newest turn carries the cache breakpoint"
            assert next(s for s in read_json(p.path("plan/storyboard.json"))["scenes"] if s["beat"] == "b03")["props"]["title"] == "Spacing, shorter"
            assert c.results[-1]["resumed"] and c.results[-1]["fix"]
    return f"session saved ({len(sess['messages'])} messages); the fix request replays them unchanged and patches one scene"


def agents_repair_sends_check_defects_to_storyboard_and_scene_workers():
    """Conductor.repair after a failed check: the storyboard (no saved session: a new fixer told to read beats and
    patch) and the bespoke beat's worker (its current file in the task) each get only their own defects; engine
    defects go to qa/defects.json for a person; the result is "fixed" so the loop re-runs the code stages."""
    with fresh_project() as p:
        _copy_demo(p)
        _fake_check(p)
        sb = read_json(p.path("plan/storyboard.json"))
        b03 = json.loads(json.dumps(next(s for s in sb["scenes"] if s["beat"] == "b03")))
        src10 = (DEMO / "scenes" / "b10.js").read_text(encoding="utf-8")
        src05 = (DEMO / "scenes" / "b05.js").read_text(encoding="utf-8")
        script = [
            {"match": {"tool_available": "patch_storyboard"}, "reply": {"tool": "patch_storyboard", "args": {"scenes": [b03]}}},
            {"match": {"provider": "gemini", "user_contains": "beat b05"}, "reply": {"tool": "submit_scene", "args": {"artifact": {"beat": "b05", "source": src05}}}},
            {"match": {"provider": "gemini", "user_contains": "beat b10"}, "reply": {"tool": "submit_scene", "args": {"artifact": {"beat": "b10", "source": src10}}}},
        ]
        with mock_env(script) as m:
            c = Conductor(p, "mock", Budget(2.0), require_snapshot=False, scene_workers=2)
            r = c.repair("check")
            assert r == "fixed", r
            roles = sorted((t["role"], t.get("beat")) for t in c.results)
            assert roles == [("scene", "b05"), ("scene", "b10"), ("storyboard", None)], roles
            sbreq = next(x for x in m.requests if x["provider"] == "openai")["body"]
            txt = json.dumps(sbreq)
            assert "b03" in txt and "b12" in txt and "patch_storyboard" in txt and "scene_threw" not in txt, "storyboard gets only its own"
            g = [json.dumps(x["body"]) for x in m.requests if x["provider"] == "gemini"]
            assert any("scene_threw" in t and "YOUR CURRENT FILE" in t for t in g), "the b05 worker gets its defect and its file"
            d = read_json(p.path("qa/defects.json"))
            assert d["routed"]["engine"] and "b17" in d["routed"]["engine"]
            # rounds are bounded: two more repairs, then the storyboard owner is out of rounds
            c.fixes[("storyboard", None)] = c.repair_rounds
            assert c._fix_stage("storyboard", "x") == "failed"
    return "3 owners fixed from one check (storyboard patch, 2 scene workers); engine defects logged; rounds bounded"


def agents_a_changed_spec_reopens_only_that_scene():
    """After a storyboard patch changes a bespoke beat's spec, scenes() gives that beat's file back to its worker
    with the new spec; an unchanged beat is left alone (no call)."""
    with fresh_project() as p:
        _copy_demo(p)
        src10 = (DEMO / "scenes" / "b10.js").read_text(encoding="utf-8")
        script = [{"match": {"provider": "gemini", "user_contains": "spec for your beat changed"},
                   "reply": {"tool": "submit_scene", "args": {"artifact": {"beat": "b10", "source": src10}}}}]
        with mock_env(script) as m:
            c = Conductor(p, "mock", Budget(2.0), require_snapshot=False)
            sb = read_json(p.path("plan/storyboard.json"))
            write_json(p.path("logs/scene_specs.json"), {s["beat"]: c._spec_sha(s) for s in sb["scenes"] if s["kind"] == "bespoke"})
            assert c.scenes() == "ok" and not m.requests                               # nothing changed: no call
            for s in sb["scenes"]:
                if s["beat"] == "b10":
                    s.setdefault("design", {})["treatment"] = "the page fills, line by line, then dims"
            write_json(p.path("plan/storyboard.json"), sb)
            assert c.scenes() == "ok"
            beats = [t["beat"] for t in c.results]
            assert beats == ["b10"], beats
            assert read_json(p.path("logs/scene_specs.json"))["b10"] == c._spec_sha(next(s for s in sb["scenes"] if s["beat"] == "b10"))
    return "unchanged specs: 0 calls; one changed spec: only b10's worker, which records the new spec"


def agents_a_draft_that_was_never_accepted_is_taken_back():
    """A worker that wrote a draft for a snapshot and then failed leaves the file as it was (here: absent), so a later
    run does not mistake an unchecked draft for a finished scene."""
    with fresh_project() as p:
        _copy_demo(p)
        p.path("scenes/b05.js").unlink()
        real = T.TOOLS["lab_snapshot"].fn

        def fake_snapshot(ctx, times, source=None):
            ctx.state["snapshots"] = ctx.state.get("snapshots", 0) + 1
            if source:
                ctx.target.write_text(source, encoding="utf-8")
            return {"image": None, "runtime_errors": []}
        T.TOOLS["lab_snapshot"].fn = fake_snapshot
        draft = "// @design x: y\nLoom.scene('b05', { build(ctx) { const r = Math.random(); } });\n"
        script = [{"match": {"provider": "gemini", "user_contains": "beat b05", "last_tool_result_contains": "runtime_errors"},
                   "reply": {"tool": "submit_scene", "args": {"artifact": {"beat": "b05", "source": draft}}}, "repeat": 9},
                  {"match": {"provider": "gemini", "user_contains": "beat b05"},
                   "reply": {"tool": "lab_snapshot", "args": {"times": [1.0], "source": draft}}, "repeat": 9}]
        try:
            with mock_env(script):
                c = Conductor(p, "mock", Budget(2.0), require_snapshot=True)
                c.scenes()
        finally:
            T.TOOLS["lab_snapshot"].fn = real
        assert c.results and c.results[0]["status"] != "accepted", c.results
        assert not p.path("scenes/b05.js").exists(), "an unaccepted draft must not stay on disk"
    return "draft written by the snapshot, refused by the gate, removed afterwards"


def agents_a_failed_check_is_repaired_and_the_run_continues():
    """Conductor.run: the check fails on a storyboard defect, the defect goes to the storyboard's author, the stages
    the patch made stale run again (code), and the second check passes: exit 0 instead of the old hard stop. Control:
    with no model-owned defect left (engine only), the run stops with 2 and says how to render anyway."""
    from loom import flow
    from loom.util import LoomError
    with fresh_project() as p:
        _copy_demo(p)
        st = read_json(p.path("state.json"))
        for k in ("compose", "check", "review", "render"):
            st["stages"].pop(k, None)
        write_json(p.path("state.json"), st)
        sb = read_json(p.path("plan/storyboard.json"))
        b03 = json.loads(json.dumps(next(s for s in sb["scenes"] if s["beat"] == "b03")))
        b03["props"] = dict(b03.get("props") or {}, title="Short")
        calls = {"check": 0, "narrate": 0}
        real = flow.run_code

        def fake_run_code(project, name, **kw):
            if name in ("narrate", "compose"):
                calls[name] = calls.get(name, 0) + 1
                return flow.mark_done(project, name)
            if name == "check":
                calls["check"] += 1
                if calls["check"] == 1 or engine_only:
                    _fake_check(project)
                    if engine_only:
                        write_json(project.path("qa/probe.json"), {"errors": [{"code": "tight_inset", "msg": "pad", "beat": "b17"}]})
                        write_json(project.path("qa/report.json"), {"errors": ["runtime tight_inset: pad"]})
                    project.set_stage("check", status="rejected", errors=["x"])
                    raise LoomError("check failed with 7 error(s)")
                return flow.mark_done(project, "check")
            return real(project, name, **kw)
        script = [{"match": {"tool_available": "patch_storyboard"}, "reply": {"tool": "patch_storyboard", "args": {"scenes": [b03]}}, "repeat": 3},
                  {"match": {"provider": "gemini"}, "reply": {"tool": "submit_scene", "args": {"artifact": {"beat": "b05", "source": (DEMO / "scenes/b05.js").read_text(encoding="utf-8")}}}, "repeat": 6}]
        flow.run_code = fake_run_code
        try:
            engine_only = False
            with mock_env(script):
                code = Conductor(p, "mock", Budget(3.0), require_snapshot=False, critic=False).run("check")
            assert code == 0, code
            assert calls["check"] == 2 and calls["narrate"] >= 1, calls            # the patch made narration stale; it ran again
            # control: only engine defects -> stop with 2, no model call
            p.set_stage("check", status="rejected")
            engine_only = True
            calls["check"] = 0
            with mock_env([]) as m:
                code2 = Conductor(p, "mock", Budget(3.0), require_snapshot=False, critic=False).run("check")
            assert code2 == 2 and not m.requests, (code2, len(m.requests))
        finally:
            flow.run_code = real
    return "check failed -> storyboard patched -> narration and compose re-run -> check passed (exit 0); engine-only: exit 2, no call"


def agents_limits_never_cut_a_working_agent_short():
    """(Kshitij, 2026-10-07) No per-task dollar cap and output up to the model's maximum by default; a long
    conversation gets a call fitted to the window (less output room) instead of a refusal, and only a window that is
    really full stops; the budget guard prices last turn's prompt as a cache read; Gemini Pro's long-context price
    applies above 200k. Controls: a profile limit still applies; a full window still stops."""
    from loom.agents.llm import registry as R
    from loom.agents.llm.types import Response, Usage
    from loom.agents.runtime import AgentSpec, run_agent
    spec = AgentSpec("storyboard", "mock-strong")
    assert spec.lim("usd") is None and spec.lim("max_tokens") is None and spec.lim("seconds") >= 3600, spec
    assert AgentSpec("storyboard", "mock-strong", limits={"max_tokens": 9000}).lim("max_tokens") == 9000
    sn = R.model("claude-sonnet-5-5")
    assert R.worst_case(sn, 100_000, 1000, cached_tokens=90_000) < R.worst_case(sn, 100_000, 1000) / 3
    gp = R.model("gemini-3.1-pro")
    assert abs(R.cost(gp, Usage(input=250_000)) - 250_000 * 4.0 / 1e6) < 1e-9 and abs(R.cost(gp, Usage(input=150_000)) - 150_000 * 2.0 / 1e6) < 1e-9
    seen = []

    class Rec:
        def complete(self, req):
            seen.append(req.max_tokens)
            return Response(text="", tool_calls=[], stop="end", usage=Usage(input=10, output=1), model="m", provider="openai", latency_s=0.0)
    with fresh_project() as p:
        _copy_demo(p, ("plan",))
        m = R.model("mock-strong")                                    # window 200k, max_out 32k
        # the room is measured after the role's own system prompt (about 8k tokens for the storyboard by 2026-10-17, and
        # it grows with every card and schema line), so the test checks the fitting, not the prompt's size
        from loom.agents.runtime import role_system
        from loom.genre import of as _kind_of
        spec = AgentSpec("storyboard", "mock-strong", limits={"turns": 1})
        sys_chars = sum(map(len, role_system("storyboard", spec.context, p.request.get("style"), _kind_of(p))))
        big = "x" * int((m["context"] - 20_000) * 3.6 - sys_chars)  # leaves about 16k tokens of room
        ctx = T.ToolContext(p, "storyboard", "storyboard")
        r = run_agent(spec, ctx, big, Budget(50.0), provider=Rec())
        assert seen and 8000 <= seen[0] < m["max_out"], (seen, r.note)       # fitted, not refused
        seen.clear()
        full = "x" * int((m["context"] - 2_000) * 3.6 - sys_chars)
        r2 = run_agent(AgentSpec("storyboard", "mock-strong", limits={"turns": 1}), T.ToolContext(p, "storyboard", "storyboard"), full, Budget(50.0), provider=Rec())
        assert not seen and r2.status == "error" and "window" in r2.note, (seen, r2.note)
    return "no task cap, full output by default; a long call fitted to the window; a full window stops; cache-aware guard"


def agents_out_of_credit_stops_cleanly_and_never_approves_unchecked_facts():
    """(bench 2026-10-07) An empty account is a BillingError, not a retry and not a stage "failing its gate": the run
    stops with exit 5 and the same command resumes; OpenAI's insufficient_quota 429 is never retried; a skeptic that
    did not finish leaves the fact sheet unapproved. Controls: a plain rate limit is still retryable; a plain 400 is
    still a BadRequest."""
    from loom.agents.llm.base import Provider
    from loom.agents.llm.types import BillingError, RateLimited
    pv = Provider(base="http://x", key="k")
    pv.name = "anthropic"
    assert isinstance(pv.error_from(400, {"error": {"message": "Your credit balance is too low to access the Anthropic API."}}, {}), BillingError)
    pv.name = "openai"
    e = pv.error_from(429, {"error": {"message": "You exceeded your current quota, please check your plan and billing details.", "code": "insufficient_quota"}}, {})
    assert isinstance(e, BillingError) and not e.retryable
    assert isinstance(pv.error_from(429, {"error": {"message": "Rate limit reached for requests"}}, {}), RateLimited)
    assert type(pv.error_from(400, {"error": {"message": "messages: bad"}}, {})).__name__ == "BadRequest"
    # a run whose provider is out of credit: exit 5, the provider marked, no "failed its gate"
    script = [{"match": {"tool_available": "submit_brief"}, "reply": {"error": {"http": 400, "message": "Your credit balance is too low to access the Anthropic API."}}}]
    with fresh_project() as p, mock_env(script) as m:
        b = Budget(2.0)
        c = Conductor(p, "mock", b, approve_knowledge_as="test")
        prof = dict(c.prof); prof["roles"] = dict(prof["roles"], brief="mock-small")   # mock-small speaks the Anthropic protocol
        c.prof = prof
        code = c.run("brief")
        assert code == 5 and "anthropic" in b.dead and len(m.requests) == 1, (code, b.dead, len(m.requests))
    # the skeptic errors: the knowledge sheet is not approved
    kn = read_json(DEMO / "plan/knowledge.json")
    script2 = [{"match": {"tool_available": "submit_knowledge"}, "reply": {"tool": "submit_knowledge", "args": {"artifact": kn}}},
               {"match": {"tool_available": "submit_skeptic_verdict"}, "reply": {"error": {"http": 400, "message": "mock: scripted invalid request"}}}]
    with fresh_project() as p, mock_env(script2):
        _copy_demo(p, ("plan",))
        write_json(p.path("state.json"), {"stages": {}})
        c = Conductor(p, "mock", Budget(2.0), approve_knowledge_as="test")
        from loom import flow
        flow.mark_done(p, "brief")
        r = c.stage_agent("knowledge")
        assert r == "failed", r
        assert (p.stage_info("knowledge") or {}).get("status") != "done" or read_json(p.path("plan/knowledge.json"))["review"]["status"] != "approved"
    return "credit errors stop the run (exit 5) after one request; quota 429 not retried; no unchecked sheet approved"


def agents_parallel_saves_of_one_file_never_collide():
    """write_json from many threads at once (scene workers saving logs/agents_run.json): every write lands, no
    shared temporary file (the bench crashed on WinError 32 renaming a shared .tmp)."""
    import threading
    from loom.util import write_json as wj
    with fresh_project() as p:
        f = p.path("logs/race.json")
        errs = []

        def go(i):
            try:
                for k in range(30):
                    wj(f, {"i": i, "k": k, "pad": "x" * 2000})
            except Exception as e:  # noqa: BLE001
                errs.append(e)
        ts = [threading.Thread(target=go, args=(i,)) for i in range(8)]
        [t.start() for t in ts]; [t.join() for t in ts]
        assert not errs, errs[:2]
        assert read_json(f)["k"] == 29 and not list(f.parent.glob("race.json*.tmp"))
    return "8 threads x 30 writes: no error, no leftover temporary file"


def agents_outline_and_storyboard_share_one_cached_reading():
    """(cost plan, 2026-10-07) The outline and the storyboard get the same first system block and the same advertised
    tools, so the storyboard reads the 180 KB reading from the cache the outline wrote; Anthropic puts a breakpoint
    after that block. What each role may CALL is still its own: the storyboard cannot submit an outline."""
    a, b = role_system("storyboard_outline", "parity"), role_system("storyboard", "parity")
    assert a[0] == b[0] and a[1] != b[1] and len(a[0]) > 150_000, [len(x) for x in a + b]
    sa, sb_ = [t.name for t in T.specs("storyboard_outline")], [t.name for t in T.specs("storyboard")]
    assert sa == sb_ and "submit_outline" in sa and "patch_storyboard" in sa, (sa, sb_)
    with fresh_project() as p:
        r = T.call(T.ToolContext(p, "storyboard", "storyboard"), "submit_outline", {"artifact": {}})
        assert "not available to the storyboard role" in r.get("error", ""), r
    _, _, body = Anthropic(base="http://x", key="k").build(Request(model="m", system=a, messages=[Message("user", "go")],
                                                                    tools=[ToolSpec("x", "x", {"type": "object", "properties": {}})]))
    assert body["system"][0].get("cache_control") and body["system"][-1].get("cache_control")
    marks = json.dumps(body).count('"cache_control"')
    assert marks <= 4, marks                                                     # the API allows four
    return f"block 1 shared ({len(a[0]) // 1000}k chars), tools identical, calls still role-scoped, {marks} breakpoints"


def agents_a_cold_session_gets_a_cheap_new_fixer_instead_of_a_full_reread():
    """A saved session older than the provider's cache is not resumed (its whole history would be paid for again):
    the fix goes to a new worker with the small role card. A warm one is resumed (tested above)."""
    with fresh_project() as p:
        _copy_demo(p)
        c = Conductor(p, "mock", Budget(2.0), require_snapshot=False, context="parity")
        write_json(c.session_path("storyboard"), {"role": "storyboard", "alias": "mock-strong", "context": "parity", "cache_ttl": None,
                                                  "saved_at": "2026-01-01T00:00:00", "messages": [{"role": "user", "content": "old"}], "system_sha": "x"})
        sb = read_json(p.path("plan/storyboard.json"))
        b03 = next(s for s in sb["scenes"] if s["beat"] == "b03")
        with mock_env([{"match": {"tool_available": "patch_storyboard"}, "reply": {"tool": "patch_storyboard", "args": {"scenes": [b03]}}}]) as m:
            r = c.run_role("storyboard", "storyboard", fix="FIX REQUEST\n- b03: x")
        row = c.results[-1]
        assert r.status == "accepted" and not row["resumed"] and row["context"] == "cards", row
        body = json.dumps(m.requests[-1]["body"])
        assert '"old"' not in body and "<<<< " not in body, "neither the cold history nor the big reading is sent"
        assert c._warm({"saved_at": __import__("time").strftime("%Y-%m-%dT%H:%M:%S"), "cache_ttl": None})
    return "cold session: new fixer on the small card, no old history; a just-saved session counts as warm"


def agents_a_snapshotted_draft_is_submitted_without_writing_it_twice():
    """submit_scene without `source` takes the draft the last lab_snapshot wrote (one copy of the file in the output,
    not two); without a draft it is refused with the reason."""
    with fresh_project() as p:
        _copy_demo(p)
        src = (DEMO / "scenes" / "b05.js").read_text(encoding="utf-8")
        ctx = T.ToolContext(p, "scene", "scenes", beat="b05", target=p.path("scenes/b05.js"), extra={"require_snapshot": True})
        p.path("scenes/b05.js").unlink()
        r0 = T.call(ctx, "submit_scene", {"artifact": {"beat": "b05"}})
        assert "lab_snapshot" in json.dumps(r0) and not ctx.state.get("done"), r0
        ctx.state["snapshots"] = 1
        r1 = T.call(ctx, "submit_scene", {"artifact": {"beat": "b05"}})
        assert not r1["accepted"] and "source is missing" in r1["errors"][0], r1
        p.path("scenes/b05.js").write_text(src, encoding="utf-8"); ctx.state["drafted"] = True
        r2 = T.call(ctx, "submit_scene", {"artifact": {"beat": "b05"}})
        assert r2["accepted"], r2["errors"]
    return "no draft: refused with the reason; with a draft: the file on disk is judged and accepted"
