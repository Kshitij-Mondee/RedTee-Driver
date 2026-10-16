"""Shuttle's rails (D-135, docs/strategy/2026-10-08-shuttle-pipeline.md section 3), offline: out-of-phase refusal, the
approval pause, reopen invalidation, the budget stop, owner tokens and the hook, the kit gate red and green, the two
sub-agent targets, the child environment of subscription mode, loom-mcp over stdio, and the stream ledger.

Each test has a control that shows it can fail (the rail patched out, or the opposite input); the red runs on the
mutated rails are recorded in docs/research/shuttle/red_runs.txt."""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
from contextlib import contextmanager
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))   # tests/: one browser check for every suite
from browser_support import browser  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from agents_runtime import DEMO, _outline, cast_storyboard, fresh_project, restamp  # noqa: E402
from loom import flow  # noqa: E402
from loom.agents.llm import registry as R  # noqa: E402
from loom.shuttle import agents as AG  # noqa: E402
from loom.shuttle import hook as HK  # noqa: E402
from loom.shuttle import launch as LA  # noqa: E402
from loom.shuttle import rails as RL  # noqa: E402
from loom.shuttle.server import Server  # noqa: E402
from loom.util import read_json, write_json  # noqa: E402

LEAD = {"who": "lead", "model": "claude-test-lead"}
GOOD_KIT = """// the lesson kit: parts drawn once, composed by the beats
Loom.lesson = Loom.lesson || {};
Loom.lesson.board = function (ctx, parent, opts) {
  const o = opts || {};
  const w = o.w || 600, h = o.h || 360;
  const frame = ctx.kit.rect(parent, 0, 0, w, h, { fill: ctx.c("surface"), stroke: ctx.c("ink"), r: 12 });
  return { frame: frame, setState: function (name, t) { return t; } };
};
"""


def _demo(p, kit_beat: str | None = None):
    for sub in ("plan", "audio", "scenes", "media"):
        if (DEMO / sub).exists():
            shutil.rmtree(p.path(sub), ignore_errors=True)
            shutil.copytree(DEMO / sub, p.path(sub))
    cast_storyboard(p)
    if kit_beat:
        sb = read_json(p.path("plan/storyboard.json"))
        sb["kit"] = {"parts": [{"id": "board", "what": "the held board", "states": ["blank", "full"], "beats": [kit_beat]}]}
        write_json(p.path("plan/storyboard.json"), sb)
    write_json(p.path("state.json"), read_json(DEMO / "state.json"))
    restamp(p)


def _through(p, upto: str):
    """Everything up to `upto` accepted, the way a run leaves it (records, not shortcuts in the rails)."""
    r = RL.Rails(p)
    if RL.idx(upto) >= RL.idx("P2"):
        r.update(lambda st: st["skeptic"].append({"hash": r.knowledge_hash(), "verdict": "pass", "at": RL.now()}))
        flow.approve(p, "facts", "test, unattended")
        restamp(p)
    if RL.idx(upto) >= RL.idx("P5"):
        write_json(p.path("plan/outline.json"), _outline())
        r.update(lambda st: st.__setitem__("outline", {"hash": r.file_hash("plan/outline.json"), "script": r.file_hash("plan/script.json")}))
    if RL.idx(upto) >= RL.idx("P6"):
        r.update(lambda st: st.__setitem__("animatic", {"plan": flow.plan_hashes(p)}))
        flow.approve(p, "plan", "test, unattended")
        for rel in r.needed_files():        # the demo's beat files were accepted when it was made
            r.mark_file(rel)


@contextmanager
def lesson(upto: str | None = None, kit_beat: str | None = None):
    with fresh_project() as p:
        if upto:
            _demo(p, kit_beat)
            _through(p, upto)
        yield p


def _phases(p) -> dict:
    return {r["phase"]: r for r in RL.Rails(p).status()["phases"]}


def _bespoke(p) -> list[str]:
    return [s["beat"] for s in read_json(p.path("plan/storyboard.json"))["scenes"] if s["kind"] == "bespoke"]


# ------------------------------------------------------------------ out of phase
def agents_shuttle_out_of_phase_tool_is_refused():
    """A tool of phase N refuses until every phase before it is accepted, and its refusal names the missing step; the
    server answers the refusal as data, logs it with the caller's model, and never runs the engine."""
    with lesson() as p:
        rl = RL.Rails(p)
        why = rl.allow("submit_storyboard", LEAD, {})
        assert why and "P1 (brief) is not accepted" in why, why
        assert rl.allow("compose", LEAD, {}) and rl.allow("render", LEAD, {}), "build tools must refuse on an empty lesson"
        assert rl.allow("submit_brief", LEAD, {}) is None and rl.allow("get_style_pack", LEAD, {}) is None
        os.environ["LOOM_SHUTTLE_LEAD_MODEL"] = "claude-test-lead"
        try:
            res, _ = Server(str(p.root)).call("submit_storyboard", {"artifact": {"scenes": []}})
        finally:
            os.environ.pop("LOOM_SHUTTLE_LEAD_MODEL", None)
        assert "refused" in res and "P1" in res["refused"], res
        assert not p.path("plan/storyboard.json").exists()
        rec = [json.loads(l) for l in p.path("logs/decisions.jsonl").read_text(encoding="utf-8").splitlines()]
        tc = [r for r in rec if r.get("event") == "tool_call" and r.get("decision") == "submit_storyboard"]
        assert tc and tc[-1]["choice"] == "refused" and tc[-1]["by"]["model"] == "claude-test-lead", tc[-1:]
        # control: with every phase reported accepted, the same call is not refused for its phase
        orig = RL.Rails.status
        RL.Rails.status = lambda self: {"phases": [{"phase": x, "name": n, "status": "accepted", "missing": []} for x, n in RL.PHASES],
                                        "current": None, "waiting": None, "stop": None}
        try:
            assert "is not accepted" not in (rl.allow("submit_storyboard", LEAD, {}) or ""), rl.allow("submit_storyboard", LEAD, {})
            assert rl.allow("compose", LEAD, {}) is None
        finally:
            RL.Rails.status = orig
    return "submit_storyboard, compose and render refused on an empty lesson, naming P1; the refusal logged with the lead's model"


def agents_shuttle_every_read_tool_answers():
    """Every read tool loom-mcp lists answers a valid call with data, not an error (S1, 2026-10-08: get_api_section's
    argument `name` collided with the server's own helper and every call failed with a TypeError)."""
    with lesson("P6") as p:
        srv = Server(str(p.root))
        calls = {"list_skill_sections": {"skill": "lnd-visual-design"}, "get_skill_section": {"skill": "SCENE_API", "section_id": "ctx"},
                 "get_api_section": {"name": "ctx"}, "catalog_search": {"query": "compare two options"},
                 "get_catalog_entry": {"id": "compare.two"}, "capabilities": {}, "get_style_pack": {}, "get_world_pack": {},
                 "get_example_scene": {"tag": "curve"}, "get_beat": {"id": "b05"}, "get_fact": {"id": "F1"},
                 "get_source_chunks": {"query": "forgetting curve"}, "read_artifact": {"name": "genre"}}
        assert set(calls) == set(RL.READ_TOOLS), sorted(set(RL.READ_TOOLS) ^ set(calls))
        bad = {}
        for name, args in calls.items():
            res, _ = srv.call(name, dict(args))
            if not isinstance(res, dict) or res.get("error") or res.get("refused"):
                bad[name] = str(res)[:200]
        assert not bad, bad
    return f"{len(calls)} read tools answered with data"


# ------------------------------------------------------------------ approvals
def agents_shuttle_approval_pauses_the_run():
    """request_approval waits only when the phase is ready, every write then refuses with the approve command, and a
    person's approval (timed, with notes) ends the wait; an unattended approval must say so and never waits."""
    with lesson("P5") as p:
        rl = RL.Rails(p)
        try:
            rl.request_approval("plan", "the plan", ["plan/storyboard.json"])
            raise AssertionError("a plan approval was requested before the animatic was looked at")
        except RL.Refusal as e:
            assert "animatic" in str(e), e
        rl.update(lambda st: st.__setitem__("animatic", {"plan": flow.plan_hashes(p)}))
        assert rl.allow("compose", LEAD, {}) and "P6" in rl.allow("compose", LEAD, {})       # control: refused for its phase, not a wait
        r = rl.request_approval("plan", "script and storyboard, 24 beats", ["qa/animatic.jpg"])
        assert r["waiting"] == "plan" and p.path("qa/approvals/plan.md").exists(), r
        why = rl.allow("narrate", LEAD, {})
        assert why and "waiting for a person's 'plan' approval" in why and "py -m loom approve" in why, why
        assert rl.allow("lesson_status", LEAD, {}) is None and rl.allow("get_beat", LEAD, {}) is None
        assert _phases(p)["P6"]["status"] == "waiting"
        flow.approve(p, "plan", "Kshitij (test)", notes="keep the board in every beat")
        s = rl.status()
        assert s["waiting"] is None and _phases(p)["P6"]["status"] == "accepted", s["phases"][5]
        assert read_json(p.path("qa/approvals/plan.json"))["notes"] == "keep the board in every beat"
        assert "keep the board in every beat" in LA.start_message(p, ("P7", "P9"), LA.approval_notes(p))
    with lesson("P5") as p:
        rl = RL.Rails(p)
        rl.update(lambda st: st.__setitem__("animatic", {"plan": flow.plan_hashes(p)}))
        r = rl.request_approval("plan", "x", [], approve_as="agent, unattended per test")
        assert r["approved"] and read_json(p.path("qa/approvals/plan.json"))["unattended"] is True and rl.status()["waiting"] is None
    return "refused before the animatic; waiting refuses writes and names the command; a timed approval with notes ends it"


# ------------------------------------------------------------------ reopen
def agents_shuttle_reopen_opens_only_what_changed():
    """L-332 (Kshitij: "Why is it re-writing everything if one thing goes wrong?"). A reopen marks only its own phase
    stale; a later phase re-checks itself and opens only when something it depends on changed, and a beat file only
    when its own storyboard scene (or a kit part it calls) changed. A reopen naming beats patches only those, voids no
    approval and has its own cap. Before, every reopen marked P5 to P11 stale and spent one of 3."""
    with lesson("P6") as p:
        rl = RL.Rails(p)
        ph = _phases(p)
        assert all(ph[x]["status"] == "accepted" for x in ("P1", "P5", "P6", "P8", "P9")), {k: v["status"] for k, v in ph.items()}
        assert rl.allow("compose", LEAD, {}) is None                         # control: compose runs before the reopen
        b = _bespoke(p)[0]
        p.set_stage("scenes", status="pending")
        tok = rl.delegate("scene-author", [b], None, "write it")["token"]
        p.set_stage("scenes", status="done")
        restamp(p)
        # a whole reopen: only P5 stale; the approvals from P5 on voided; later work untouched stays accepted
        e = rl.reopen("P5", "the animatic shows b03 as a slide")
        assert e["stale"] == ["P5"] and "plan" in e["approvals_voided"] and tok in e["tokens_revoked"], e
        ph = _phases(p)
        assert ph["P5"]["status"] == "stale" and ph["P6"]["status"] == "waiting", (ph["P5"], ph["P6"])   # its approval was voided
        assert ph["P8"]["status"] == "accepted" and ph["P9"]["status"] == "accepted", (ph["P8"], ph["P9"])
        why = rl.allow("compose", LEAD, {})
        assert why and "P5 (storyboard) is not accepted" in why, why       # still walked in order
        assert any("reopened" in f.name for f in p.path("logs/versions/storyboard").iterdir())
        srv = Server(str(p.root))
        res, _ = srv.call("submit_storyboard", {"artifact": read_json(p.path("plan/storyboard.json"))})
        assert res.get("accepted"), res.get("errors", res)[:3] if isinstance(res.get("errors"), list) else res
        flow.approve(p, "plan", "Kshitij (test)")
        ph = _phases(p)
        assert all(ph[x]["status"] == "accepted" for x in ("P5", "P6", "P7", "P8", "P9")), {x: ph[x]["status"] for x in RL.IDS}
        # a reopen naming one beat: only its scene may change; nothing voided; only its file needs work afterwards
        e = rl.reopen("P5", "b's quiz index counts from 1", beats=[b])
        assert e["beats"] == [b] and e["approvals_voided"] == [] and rl.approval("plan"), e
        sb = read_json(p.path("plan/storyboard.json"))
        res, _ = srv.call("submit_storyboard", {"artifact": sb})
        assert "refused" in res and "patch_storyboard" in res["refused"], res
        other = next(s for s in sb["scenes"] if s["beat"] != b)
        res, _ = srv.call("patch_storyboard", {"scenes": [other]})
        assert "refused" in res and "not among them" in res["refused"], res
        mine = next(s for s in sb["scenes"] if s["beat"] == b)
        mine = dict(mine, subject=(mine.get("subject") or "the beat") + " (patched)")
        res, _ = srv.call("patch_storyboard", {"scenes": [mine]})
        assert res.get("accepted"), res
        ph = _phases(p)
        assert ph["P5"]["status"] == "accepted" and not rl.load()["scope"], (ph["P5"], rl.load()["scope"])
        assert _phases(p)["P6"]["status"] != "accepted"                    # the storyboard changed: narration and animatic again
        restamp(p)                                                         # (narrate is a cached code stage; the test stamps it)
        rl.update(lambda st: st.__setitem__("animatic", {"plan": flow.plan_hashes(p)}))
        flow.approve(p, "plan", "Kshitij (test)")                          # the plan changed: approved again by hash
        assert _phases(p)["P7"]["status"] == "accepted"                    # the kit does not depend on b's scene
        miss = " ".join(_phases(p)["P8"]["missing"])
        assert "its storyboard scene changed" in miss and b in miss, miss
        others = [f for f in rl.needed_files() if f"/{b}." not in f]
        assert others and not any(o in miss for o in others), (others, miss)   # the other beats' files stand
        res, _ = srv.call("accept_phase", {"phase": "P8"})
        assert any(b in x for x in res.get("files_needing_work") or []), res
        res, _ = srv.call("accept_phase", {"phase": "P8", "beats": [b], "why": "the patch changed the subject line, not the drawing"})
        assert res.get("files_taken") and not res.get("files_needing_work") and _phases(p)["P8"]["status"] == "accepted", res
        # the caps: whole reopens 3, named-beat reopens their own 8
        try:
            rl.reopen("P8", "a beat file", beats=[b])
            raise AssertionError("a scoped reopen of P8 was allowed")
        except RL.Refusal as x:
            assert "fixer or a scene-author" in str(x)
        rl.reopen("P5", "two")
        rl.reopen("P5", "three")
        try:
            rl.reopen("P5", "four")
            raise AssertionError("a fourth whole reopen was allowed")
        except RL.Refusal as x:
            assert "cap (3)" in str(x) and "beats=[...]" in str(x), x
        e = rl.reopen("P5", "still allowed for one beat", beats=[b])
        assert e["beats"] == [b] and "3 of 3; for named beats 2 of 8" == RL.Rails.reopen_counts(rl.load())
    return ("whole reopen: P5 stale, P8 and P9 still accepted; scoped: only b patched, nothing voided, only b's file to redo; "
            "caps 3 whole and 8 scoped, counted apart")


def agents_shuttle_a_person_grants_one_more_reopen():
    """The cap used, the lead asks a person; `shuttle grant-reopen` lifts this lesson's cap by the count, only for a
    named person with a reason, logged in the trace, the state and the ledger; the lead then reopens as usual and the
    new cap holds (Opus run, 2026-10-08: b13's quiz index needed P5 with 3 of 3 used)."""
    with lesson("P6") as p:
        rl = RL.Rails(p)
        for why in ("one", "two", "three"):
            rl.reopen("P5", why)
        try:
            rl.reopen("P5", "four")
            raise AssertionError("a fourth reopen was allowed before any grant")       # control
        except RL.Refusal as e:
            assert "cap" in str(e)
        for by, why in (("agent, unattended", "x"), ("", "x"), ("Kshitij (test)", "")):
            try:
                rl.grant_reopens(by, why)
                raise AssertionError(f"grant allowed for by={by!r} why={why!r}")
            except RL.Refusal:
                pass
        g = rl.grant_reopens("Kshitij (test)", "b13's quiz props count from 1; the fix is a storyboard field")
        assert (g["cap_before"], g["cap_after"], g["used"]) == (3, 4, 3), g
        e = rl.reopen("P5", "four, granted")
        assert e["phase"] == "P5" and len(RL.Rails(p).load()["reopens"]) == 4
        try:
            rl.reopen("P5", "five")
            raise AssertionError("the granted cap did not hold")
        except RL.Refusal as e:
            assert "cap (4)" in str(e), e
        tr = [json.loads(l) for l in p.path("logs/shuttle/trace.jsonl").read_text(encoding="utf-8").splitlines() if l.strip()]
        assert any(t.get("event") == "reopen_granted" and t.get("by") == "Kshitij (test)" for t in tr)
        led = p.path("logs/decisions.jsonl").read_text(encoding="utf-8")
        assert '"reopen_cap"' in led and '"person"' in led
    return "cap 3 holds until a named person grants one (agent and empty refused); the fourth reopen runs, the fifth is refused; logged"


# ------------------------------------------------------------------ budget
def agents_shuttle_budget_stops_writes():
    """At 100 % of the lesson budget (USD, tokens or calls), a phase budget or a sub-agent's, every spending tool refuses
    and the run is marked stopped; reads still answer; the launcher's stream guard kills the session."""
    with lesson() as p:
        rl = RL.Rails(p)
        f = p.path("logs/shuttle/calls.jsonl")
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_text(json.dumps({"usd": 0.06, "input": 1000, "output": 200, "phase": "P1", "agent": "lead"}) + "\n", encoding="utf-8")
        rl.update(lambda st: st.__setitem__("budget", {"usd": 1.0}))
        assert rl.allow("submit_brief", LEAD, {}) is None                     # control: under the limit
        rl.update(lambda st: st.__setitem__("budget", {"usd": 0.05}))
        why = rl.allow("submit_brief", LEAD, {})
        assert why and why.startswith("budget:") and "usd 0.06 of 0.05" in why, why
        assert rl.load()["stop"]["reason"] == "budget"
        assert rl.allow("get_skill_section", LEAD, {}) is None and rl.allow("budget_status", LEAD, {}) is None
        assert "stopped (budget)" in rl.allow("delegate", LEAD, {})
        assert rl.budget_status()["used_pct"] >= 100
    with lesson() as p:
        rl = RL.Rails(p)
        f = p.path("logs/shuttle/calls.jsonl")
        f.parent.mkdir(parents=True, exist_ok=True)
        f.write_text(json.dumps({"usd": 0.0, "input": 10, "output": 10, "phase": "P8", "agent": "shuttle-scene-author"}) + "\n", encoding="utf-8")
        rl.update(lambda st: st.__setitem__("budget", {"agents": {"shuttle-scene-author": {"calls": 1}}}))
        assert "shuttle-scene-author: calls" in (rl.over_budget() or ""), rl.over_budget()
        s = LA.Stream(p, "api", "ANTHROPIC_API_KEY", "P1-P4")
        s.guards()
        assert s.killed and s.killed.startswith("budget"), s.killed
    return "lesson USD stop refuses writes and delegation, reads answer; a sub-agent's call cap stops; the stream guard kills"


# ------------------------------------------------------------------ ownership
def agents_shuttle_ownership_refuses_foreign_files():
    """An owner token writes only its files, in its phases, with its agent's tools; one writer per file; the lead
    writes no beat; a token from the lead's thread or a sub-agent without one is refused; collect closes it."""
    with lesson("P6") as p:
        p.set_stage("scenes", status="pending")
        rl = RL.Rails(p)
        b1, b2 = _bespoke(p)[:2]
        manim = next(s["beat"] for s in read_json(p.path("plan/storyboard.json"))["scenes"] if s["kind"] == "manim")
        t = rl.delegate("scene-author", [b1], None, "draw the forgetting curve")
        tok = t["token"]
        assert t["files"] == [f"scenes/{b1}.js"], t["files"]
        for bad, msg in ((lambda: rl.delegate("scene-author", [b1], None, "again"), "owned by the open token"),
                         (lambda: rl.delegate("scene-author", [manim], None, "x"), "clip"),
                         (lambda: rl.delegate("fact-finder", None, None, "x"), "works in P2"),
                         (lambda: rl.delegate("scene-author", [b2], None, ""), "brief")):
            try:
                bad()
                raise AssertionError(f"delegation allowed: {msg}")
            except RL.Refusal as e:
                assert msg in str(e), (msg, str(e))
        me = {"who": "scene-author", "token": tok}
        assert rl.allow("lab_snapshot", me, {"beat": b1}) is None                     # control: its own beat passes the rails
        assert "not this token's" in rl.allow("submit_scene", me, {"beat": b2})
        assert "the lead's" in rl.allow("submit_storyboard", me, {})
        assert "not among the scene-author's tools" in rl.allow("render_clip", me, {"beat": b1})
        assert "written by a scene-author sub-agent" in rl.allow("submit_scene", LEAD, {"beat": b1})
        srv = Server(str(p.root))
        cdir = p.path("logs/shuttle/callers")
        cdir.mkdir(parents=True, exist_ok=True)
        (cdir / "toolu_leadthread1.json").write_text(json.dumps({"agent_type": None}), encoding="utf-8")
        res, _ = srv.call("lab_snapshot", {"times": [1.0], "beat": b1, "owner": tok}, use_id="toolu_leadthread1")
        assert "from the lead's own thread" in res.get("refused", ""), res
        (cdir / "toolu_subnotoken1.json").write_text(json.dumps({"agent_type": "shuttle-scene-author"}), encoding="utf-8")
        res, _ = srv.call("get_beat", {"id": b1}, use_id="toolu_subnotoken1")
        assert "refused" not in res and res.get("beat"), res                 # a sub-agent reads without its token, as itself
        last = [json.loads(l) for l in p.path("logs/shuttle/trace.jsonl").read_text(encoding="utf-8").splitlines()][-1]
        assert last["tool"] == "get_beat" and last["who"] == "scene-author", last
        (cdir / "toolu_subnotoken2.json").write_text(json.dumps({"agent_type": "shuttle-scene-author"}), encoding="utf-8")
        res, _ = srv.call("submit_storyboard", {"artifact": {}}, use_id="toolu_subnotoken2")
        assert "without its owner token" in res.get("refused", ""), res     # but it never acts as the lead
        rl.collect(tok)
        assert "is collected" in rl.allow("lab_snapshot", me, {"beat": b1})
        st = rl.load()["tokens"][tok]
        assert st["refused"] >= 1 or st["calls"] >= 1
    return "own beat passes; another beat, a lead tool, another agent's tool, a second writer, a lead-thread token refused; collect closes"


def agents_shuttle_a_draft_is_not_an_accepted_beat():
    """P8 closes only when every beat file is accepted as it is on disk. Files a snapshot drafted pass the scenes gate but
    are nobody's accepted work: in S0 the clip authors' submits ran the gate over two drafts and closed P8 under the scene
    authors, whose own submits were then refused (2026-10-08)."""
    with lesson("P6") as p:
        rl = RL.Rails(p)
        rl.update(lambda st: st.__setitem__("files", {}))          # every demo file is now only a draft on disk
        p.set_stage("scenes", status="pending")
        need = rl.needed_files()
        assert len(need) == 4 and all(p.path(f).exists() for f in need), need
        srv = Server(str(p.root))
        g = srv.scenes_complete(p.path(need[0]))                    # one accepted, three drafts
        assert g is None and _phases(p)["P8"]["status"] == "open", (g, _phases(p)["P8"])
        assert "beat files not accepted yet" in " ".join(_phases(p)["P8"]["missing"])
        for f in need[1:]:
            g = srv.scenes_complete(p.path(f))
        assert g and g["scenes_gate"] == "pass" and _phases(p)["P8"]["status"] == "accepted", (g, _phases(p)["P8"])
        p.path(need[0]).write_text(p.path(need[0]).read_text(encoding="utf-8") + "\n// a later draft\n", encoding="utf-8")
        assert _phases(p)["P8"]["status"] != "accepted"            # a changed file is a draft again
    return "three drafts kept P8 open; four accepted files closed it; a later draft reopened the question"


def agents_shuttle_a_rewrite_after_p8_needs_no_reopen():
    """L-320: in the Opus run two fixer runs on b05 hit their 8-turn cap and scene-authors were refused after P8 (4 times),
    so the lead reopened P8 for four rewrites. A scene-author now works on named beats in P9 and P10 too, and the fixer
    has room for a real fix (16 turns, 40 calls)."""
    with lesson("P6") as p:
        rl = RL.Rails(p)
        cur = rl.current()
        assert cur in ("P9", "P10"), cur
        b = _bespoke(p)[0]
        r = rl.delegate("scene-author", [b], None, "rewrite it on the continuity contract")
        assert r["token"] and r["files"] == [f"scenes/{b}.js"], r
        f = rl.delegate("fixer", [_bespoke(p)[1]], None, "fix the overlap")
        assert f["limits"]["max_turns"] >= 16 and f["limits"]["tool_calls"] >= 40, f["limits"]
        assert RL.Rails(p).allow("submit_scene", {"who": "scene-author", "token": r["token"]}, {"beat": b}) is None
    return f"in {cur}: a scene-author took {b} without a reopen; the fixer has 16 turns and 40 calls"


KIT_SRC = "Loom.lesson = Loom.lesson || {};\nLoom.lesson.board = function (ctx, parent, opts) {\n  return { setState: function (name, t) {} };\n};\n"


def _replan(p):
    """After a test edits the storyboard: the gate, the stamps, the animatic and the plan approval again (what a run does)."""
    E, _ = flow.accept(p, "storyboard")
    assert not E, E[:3]
    restamp(p)
    rl = RL.Rails(p)
    rl.update(lambda st: st.__setitem__("animatic", {"plan": flow.plan_hashes(p)}))
    flow.approve(p, "plan", "test, unattended")


def agents_shuttle_waits_out_a_login_refresh():
    """L-341: the measured run (2026-10-09) failed in 16 seconds: Claude Code answered "Failed to refresh OAuth token:
    another Claude Code process is refreshing it ... retry in a minute" twice, one second apart, and the launcher counted
    both as failed tries of P1. Now such a session is not a try: the launcher waits and starts a fresh one, up to 5 times."""
    with lesson() as p:
        calls = []
        keep = (LA.run_session, LA.AUTH_WAIT_S)

        class Fake:
            init, killed, limit, stderr = {"session_id": None}, None, None, []

            def __init__(self, result):
                self.result = result

        def fake(project, mode, lead, group, prompt, session, resume, *a, **k):
            calls.append(resume)
            if len(calls) == 1:
                return Fake({"is_error": True, "result": "Failed to refresh OAuth token: another Claude Code process is refreshing it "
                                                         "or exited mid-refresh. This is usually transient; retry in a minute"})
            RL.Rails(project).update(lambda st: st.__setitem__("stop", {"reason": "budget", "detail": "test ends here", "at": RL.now()}))
            return Fake({"is_error": False, "result": "ok"})

        LA.run_session, LA.AUTH_WAIT_S = fake, 0
        try:
            code = LA.run(p, mode="subscription", lead="sonnet")
        finally:
            LA.run_session, LA.AUTH_WAIT_S = keep
        assert calls == [False, False], calls                             # a fresh session after the wait, not a resumed try
        assert code == LA.EXIT["budget"], code                            # the test's own stop, not "failed"
        tr = p.path("logs/shuttle/trace.jsonl").read_text(encoding="utf-8")
        assert '"auth_wait"' in tr
    return "the login-refresh error was waited out and the session started fresh; it did not count as a failed try"


def agents_shuttle_has_relays_toolbox():
    """Kshitij, 2026-10-09: the new tools (physics, brush, orbs, Three.js models and presets, Skia) "implement the same
    effective and properly in this pipeline as well". Parity with Relay (D-137 to D-140): the toolbox tools Relay's
    storyboard, scene, clip, kit and tweak roles have are on loom-mcp; the menu is in the lead's prompt and in the
    building sub-agents' prompts (not the fact-finder's); LOOM_TOOLBOX=off removes it from both, as from Relay."""
    import os
    from loom import toolbox as TB
    from loom.agents import tools as T
    from loom.agents.runtime import MENU_ROLES
    toolbox_tools = {"use_tool", "set_device", "get_example_scene", "capabilities"}
    relay = {t for r in MENU_ROLES for t in T.ROLE_TOOLS.get(r, [])} & toolbox_tools
    with lesson() as p:
        names = {t["name"] for t in Server(str(p.root)).list_tools()}
    assert relay and relay <= names, (relay, sorted(names))
    menu = TB.menu()
    assert menu in LA.lead_prompt()
    agents = AG.load()
    for n in ("scene-author", "clip-author", "kit-builder", "fixer"):
        assert "use_tool" in agents[n]["tools"] and menu in AG.full_prompt(agents[n]), n
    assert menu not in AG.full_prompt(agents["fact-finder"])
    keep = os.environ.get("LOOM_TOOLBOX")
    os.environ["LOOM_TOOLBOX"] = "off"
    try:
        assert menu not in LA.lead_prompt() and menu not in AG.full_prompt(agents["scene-author"])
    finally:
        if keep is None:
            os.environ.pop("LOOM_TOOLBOX", None)
        else:
            os.environ["LOOM_TOOLBOX"] = keep
    return f"loom-mcp has {', '.join(sorted(relay))}; the menu in the lead's and 4 sub-agents' prompts; off removes it"


def agents_shuttle_use_tool_and_the_beats_handover():
    """A sub-agent loads a tool on request (use_tool: the section, for three the live model list; the load is logged),
    and a beat whose storyboard scene names a tool hands that section to its author, and to the kit-builder when the
    beat uses a kit part, without asking (the same task message Relay's workers get)."""
    with lesson("P6", kit_beat="b10") as p:
        rl = RL.Rails(p)
        p.path("scenes/_kit.js").write_text(KIT_SRC, encoding="utf-8")
        rl.update(lambda st: st.__setitem__("kit_preview", {"hash": rl.file_hash("scenes/_kit.js")}))
        rl.update(lambda st: st.__setitem__("pilot", {"beats": rl.pilot_beats(), "pass": True, "kit": rl.file_hash("scenes/_kit.js")}))
        f = p.path("plan/storyboard.json")
        sb = read_json(f)
        next(s for s in sb["scenes"] if s["beat"] == "b10")["tools"] = ["physics"]
        write_json(f, sb)
        _replan(p)
        p.set_stage("scenes", status="pending")
        srv = Server(str(p.root))
        ctx = srv.engine_context("scene-author", ["b10"])
        assert "TOOLS LOADED FOR THIS BEAT" in ctx and "## physics" in ctx, ctx[:300]
        kctx = srv.engine_context("kit-builder", [])
        assert "## physics" in kctx, "the kit-builder was not handed the tool its beats use"
        tok = rl.delegate("scene-author", ["b10"], None, "write it")["token"]
        r, _ = srv.call("use_tool", {"owner": tok, "names": ["three"]})
        assert r.get("loaded") == ["three"] and "model library" in r["sections"]["three"], r
        led = p.path("logs/decisions.jsonl").read_text(encoding="utf-8")
        assert '"tool_load"' in led and "scene-author" in led
    return "b10 names physics: its author and the kit-builder were handed the section; use_tool('three') gave the model list, logged"


def agents_shuttle_set_device_reopens_one_beat():
    """set_device (D-140) in Shuttle: the lead swaps a device beat's device; after P5 it is a reopen of the storyboard for
    that one beat (the scoped cap, no approval voided), then the storyboard gate: P5 is accepted again and nothing else
    is redone. Refused without a reason, for a beat that is not a device beat, and for a sub-agent."""
    with lesson("P6") as p:
        f = p.path("plan/storyboard.json")
        sb = read_json(f)
        sc = next(s for s in sb["scenes"] if s["beat"] == "b07")
        for k in ("template", "props", "blueprint", "scene", "design"):
            sc.pop(k, None)
        sc["kind"] = "three"
        sc["upgrade_reason"] = "the sign-in code on a real phone is the point"
        sc["three"] = {"preset": "device_shot", "rect": [160, 110, 1600, 780],
                       "params": {"device": "phone", "screen": {"kind": "code", "title": "t", "code": "1234"}}}
        write_json(f, sb)
        rl = RL.Rails(p)
        _replan(p)
        assert _phases(p)["P5"]["status"] == "accepted"
        srv = Server(str(p.root))
        r, _ = srv.call("set_device", {"beat": "b07", "device": "laptop"})
        assert "refused" in r or "bad arguments" in str(r), r                  # no reason
        other = next(s["beat"] for s in sb["scenes"] if s["kind"] == "bespoke")
        r, _ = srv.call("set_device", {"beat": other, "device": "laptop", "why": "x"})
        assert "not a device beat" in str(r.get("error")) and r.get("choices"), r
        r, _ = srv.call("set_device", {"beat": "b07", "device": "laptop", "why": "the people in this lesson work on laptops"})
        assert r.get("changed") and "device" in r["changed"] and r["storyboard_gate"] == "pass" and r["reopened_for"] == ["b07"], r
        last = rl.load()["reopens"][-1]
        assert last["beats"] == ["b07"] and last["approvals_voided"] == [], last
        sc2 = next(s for s in read_json(f)["scenes"] if s["beat"] == "b07")
        assert sc2["three"]["params"]["device"] == "laptop"
        assert _phases(p)["P5"]["status"] == "accepted", _phases(p)["P5"]
        assert _phases(p)["P6"]["status"] != "accepted"                    # what depends on b07's scene: narration timing, plan
        _replan(p)
        p.set_stage("scenes", status="pending")
        try:
            rl.delegate("clip-author", ["b07"], None, "write it")
            raise AssertionError("a clip-author was given a device beat")
        except RL.Refusal as e:
            assert "set_device" in str(e), e
        tok = rl.delegate("scene-author", [other], None, "write it")["token"]
        r, _ = srv.call("set_device", {"owner": tok, "beat": "b07", "device": "tablet", "why": "x"})
        assert "refused" in r, r                                              # the lead's only
    return "b07 phone to laptop: one scoped reopen, gate passed, P5 accepted again, nothing voided; refusals hold"


def agents_shuttle_the_build_session_runs_on_sonnet():
    """D-145 (Kshitij, 2026-10-09: "yes make sonnet for build change"): with an Opus lead, the build session (P7 to P9:
    kit, beats, compose, check) runs on Sonnet; planning (P1 to P6) and critique and render (P10, P11) stay on the run's
    lead. The Opus run spent $59.35 of $71.27 in P7 to P9. `--build-lead same|opus` keeps Opus there. D-148: the config key
    "P7-P9" is a range, so with one session per phase it puts P7, P8 and P9 on Sonnet, and the classic split still works."""
    leads = {RL.gkey(g): LA.lead_for(g, "opus") for g in RL.SPLITS["group"]}
    assert leads == {"P1-P4": "opus", "P5-P6": "opus", "P7-P9": "sonnet", "P10-P11": "opus"}, leads
    per = {RL.gkey(g): LA.lead_for(g, "opus") for g in LA.groups({"session_split": "phase"})}
    assert [k for k, v in per.items() if v == "sonnet"] == ["P7", "P8", "P9"] and len(per) == 11, per
    assert LA.groups({}) == RL.SPLITS["mixed"] and LA.groups({"session_split": "group"}) == RL.SPLITS["group"]
    mixed = {RL.gkey(g): LA.lead_for(g, "opus") for g in RL.SPLITS["mixed"]}
    assert mixed == {"P1-P4": "opus", "P5-P6": "opus", "P7": "sonnet", "P8": "sonnet", "P9": "sonnet", "P10": "opus", "P11": "opus"}, mixed
    assert LA.lead_for(("P7", "P9"), "opus", "same") == "opus" and LA.lead_for(("P7", "P9"), "opus", "opus") == "opus"
    assert LA.lead_for(("P7", "P9"), "sonnet") == "sonnet"
    files = {"mcp": Path("m.json"), "settings": Path("s.json")}
    cmd = LA.command("claude", files, LA.lead_for(("P7", "P9"), "opus"), "subscription", "sid", False, 10, None)
    assert cmd[cmd.index("--model") + 1] == "claude-sonnet-5-5", cmd
    with lesson() as p:
        try:
            LA.run(p, mode="api", lead="sonnet", build_lead="opus")
            raise AssertionError("an Opus build lead was allowed on the API path")
        except Exception as e:                                             # noqa: BLE001
            assert "not allowed" in str(e), e
    return ("opus run: P1-P4 opus, P5-P6 opus, P7-P9 sonnet (claude-sonnet-5-5), P10-P11 opus; per phase P7, P8, P9 on sonnet; "
            "--build-lead overrides")


def agents_shuttle_a_kit_change_rewrites_no_other_beat():
    """Kshitij, 2026-10-09: "any error in any beat only makes the agent rewrite that particular beat". A kit part changed
    for one beat leaves the other beats calling it to be verified by the next check, not rewritten: a clean beat
    stands as it is, a beat the check flags goes to a fixer. A beat whose own storyboard scene changed still goes to
    its author (agents_shuttle_reopen_opens_only_what_changed)."""
    with lesson("P6", kit_beat="b10") as p:
        rl = RL.Rails(p)
        kit = p.path("scenes/_kit.js")
        kit.write_text("Loom.lesson = Loom.lesson || {};\nLoom.lesson.board = function (ctx, parent, opts) {\n  return {};\n};\n", encoding="utf-8")
        a, b = _bespoke(p)[:2]
        for beat in (a, b):
            f = p.path(f"scenes/{beat}.js")
            f.write_text(f.read_text(encoding="utf-8") + "\n// draws Loom.lesson.board(ctx, E.inner, {})\n", encoding="utf-8")
            rl.mark_file(f"scenes/{beat}.js")
        assert not rl.files_to_verify() and not rl.files_missing()
        kit.write_text(kit.read_text(encoding="utf-8").replace("return {};", "return { fixedForOneBeat: true };"), encoding="utf-8")
        tv = rl.files_to_verify()
        assert sorted(x[2] for x in tv) == sorted([a, b]) and all("board" in x[1] for x in tv), tv
        assert not rl.files_missing(), rl.files_missing()                  # nothing is sent back for a rewrite
        srv = Server(str(p.root))
        st, _ = srv.call("lesson_status", {})
        assert len(st.get("beats_to_verify") or []) == 2, st.get("beats_to_verify")
        r = rl.refresh_verified({a})                                       # the check flags a only
        assert r["verified"] == [f"scenes/{b}.js"] and len(r["to_fix"]) == 1 and a in r["to_fix"][0], r
        assert [x[2] for x in rl.files_to_verify()] == [a]                 # b stands; a goes to a fixer with its error
        took = rl.take_files()
        assert f"scenes/{a}.js" not in took["taken"] and not took["need_work"], took   # still the check's to decide
    return f"kit part changed: {a} and {b} to verify, none to rewrite; the check flags {a}: {b} stands, {a} to a fixer"


def agents_shuttle_pilot_pair_comes_before_the_other_beats():
    """L-319: with a lesson kit, P8 starts with the first continue join (two beats); the other beats are refused until
    pilot_check passes on the current kit, and a changed kit asks for the pilot again. Without a kit nothing changes."""
    with lesson("P6", kit_beat="b10") as p:
        rl = RL.Rails(p)
        p.path("scenes/_kit.js").write_text("Loom.lesson = Loom.lesson || {};\nLoom.lesson.board = function (ctx, parent, opts) {\n"
                                            "  return { setState: function (name, t) {} };\n};\n", encoding="utf-8")
        rl.update(lambda st: st.__setitem__("kit_preview", {"hash": rl.file_hash("scenes/_kit.js")}))
        p.set_stage("scenes", status="pending")
        restamp(p)
        assert _phases(p)["P7"]["status"] == "accepted", _phases(p)["P7"]
        pb = rl.pilot_beats()
        assert pb == ["b09", "b10"], pb                                    # the demo's first continue join into a written beat
        other = next(b for b in _bespoke(p) if b not in pb)
        try:
            rl.delegate("scene-author", [other], None, "write it")
            raise AssertionError("a beat outside the pilot was delegated before the pilot passed")
        except RL.Refusal as e:
            assert "first the pilot" in str(e) and "b10" in str(e), e
        tok = rl.delegate("scene-author", ["b10"], None, "write the pilot beat")["token"]
        assert tok
        assert any("pilot_check" in m for m in _phases(p)["P8"]["missing"]), _phases(p)["P8"]["missing"]
        p.path("build").mkdir(exist_ok=True)
        p.path("build/index.html").write_text("<html></html>", encoding="utf-8")
        for look in ("frames", "contact_sheet", "strips"):                 # the lead looks at a failing pilot in P8
            assert rl.allow(look, LEAD, {}) is None, (look, rl.allow(look, LEAD, {}))
        rl.update(lambda st: st.__setitem__("pilot", {"beats": pb, "pass": True, "kit": rl.file_hash("scenes/_kit.js")}))
        assert rl.pilot_ok() and rl.delegate("scene-author", [other], None, "write it")["token"]
        kit = p.path("scenes/_kit.js")
        kit.parent.mkdir(parents=True, exist_ok=True)
        kit.write_text((kit.read_text(encoding="utf-8") if kit.exists() else "") + "\n// a changed kit\n", encoding="utf-8")
        assert not rl.pilot_ok()                                           # the pilot was for the old kit
    with lesson("P6") as p:
        assert RL.Rails(p).pilot_beats() == [] and RL.Rails(p).pilot_ok()  # control: no kit, no pilot
    return "with a kit: only b09/b10 until pilot_check passes, then the rest; a changed kit asks again; no kit: no pilot"


def agents_shuttle_pilot_check_verifies_beats_after_a_kit_fix():
    """The measured run (2026-10-09): the pilot failed, the lead fixed the kit, and pilot_check then refused with "submit
    the pilot beats first", because the two beats were "to verify" after the kit change; the lead sent a fixer to
    resubmit them. Verifying them is the pilot's job: a beat waiting only on verification is checked, and a pass keeps
    it as it is. (The compose, the probe and the layout pass are stubbed: what is tested is the gating.)"""
    from loom import flow as FL
    from loom import qa as QA
    with lesson("P6", kit_beat="b10") as p:
        rl = RL.Rails(p)
        p.path("scenes/_kit.js").write_text(KIT_SRC, encoding="utf-8")
        rl.update(lambda st: st.__setitem__("kit_preview", {"hash": rl.file_hash("scenes/_kit.js")}))
        pb = rl.pilot_beats()
        files = [f for f in rl.needed_files() if rl.scene_of_file(f)[0] in pb]
        for f in files:
            p.path(f).write_text(p.path(f).read_text(encoding="utf-8") + "\n// Loom.lesson.board(ctx, E.inner, {})\n", encoding="utf-8")
            rl.mark_file(f)
        p.path("scenes/_kit.js").write_text(KIT_SRC.replace("return {", "return { fixed: true,"), encoding="utf-8")
        assert sorted(x[0] for x in rl.files_to_verify()) == sorted(files), rl.files_to_verify()
        keep = (FL.run_code, QA.private_build, QA.probe_build, QA.hf_check_build, QA.snapshot_sheet_build)
        tmp = p.path("logs/fakebuild/build")
        tmp.mkdir(parents=True, exist_ok=True)
        FL.run_code = lambda project, name, **kw: None
        QA.private_build = lambda project: tmp
        QA.probe_build = lambda build, out, env=None: {"errors": [], "layout": {"findings": []}, "contrast": {"findings": []}}   # a clean probe, Loom's audits included (D-154)
        QA.hf_check_build = lambda build, samples=24: {}
        QA.snapshot_sheet_build = lambda build, times, out: str(out)
        try:
            r = Server(str(p.root)).t_pilot_check({"who": "lead"})
        finally:
            FL.run_code, QA.private_build, QA.probe_build, QA.hf_check_build, QA.snapshot_sheet_build = keep
        assert r.get("pass") is True and "refused" not in r, r
        assert not rl.files_to_verify() and rl.pilot_ok(), (rl.files_to_verify(), rl.load().get("pilot"))
    return f"after a kit fix, {', '.join(pb)} were verified by pilot_check (not resubmitted) and stand as they are"


def agents_shuttle_a_draft_is_not_taken_by_accept_phase():
    """L-348: in the measured run a fresh session's lead called accept_phase('P8') and took 10 drafts that scene-authors
    (stopped mid-work) had written with lab_snapshot and never submitted. A file an owner token was given and never
    submitted is a draft: accept_phase lists it for an author; it is taken only when its beat is named with a reason."""
    with lesson("P6") as p:
        rl = RL.Rails(p)
        p.set_stage("scenes", status="pending")
        b = _bespoke(p)[0]
        rel = f"scenes/{b}.js"
        rl.update(lambda st: st["files"].pop(rel, None))                 # never accepted
        tok = rl.delegate("scene-author", [b], None, "write it")["token"]
        p.path(rel).write_text(p.path(rel).read_text(encoding="utf-8") + "\n// a draft from lab_snapshot\n", encoding="utf-8")
        took = rl.take_files()
        assert rel not in took["taken"] and any(rel in x and "draft" in x and tok in x for x in took["need_work"]), took
        others = [f for f in rl.needed_files() if f != rel]
        assert all(f in took["taken"] for f in others), took                # control: accepted files are still taken
        took_nr = rl.take_files(beats=[b], why=None)
        assert rel not in took_nr["taken"] and any(rel in x and "reason" in x for x in took_nr["need_work"]), took_nr
        why = "REASON-" + b + " the lead looked at it and it is finished"
        took2 = rl.take_files(beats=[b], why=why)
        assert rel in took2["taken"], took2
        led = p.path("logs/decisions.jsonl").read_text(encoding="utf-8") if p.path("logs/decisions.jsonl").exists() else ""
        rows = [json.loads(x) for x in led.splitlines() if "take_draft_as_beat" in x]
        assert len(rows) == 1 and rows[0].get("choice") == rel and why in json.dumps(rows[0]), rows
    return (f"{b}'s unsubmitted draft refused (its token named) and refused when named without a reason; taken when named "
            "with one, and that decision logged with its reason; the others taken")


def agents_shuttle_critic_rejudges_only_what_changed():
    """L-322: five critic passes on the Opus run each judged every sheet and found a partly new set (b05's tag went
    minor, major, absent, major). A later pass judges only the beats whose sheet changed or whose blocker or major is
    still open, re-checks the earlier findings first, is told what the lead accepted, and keeps the record of the
    beats it did not judge. A pass with nothing changed calls no model."""
    from agents_runtime import mock_env
    with lesson("P6") as p:
        beats = [s["beat"] for s in read_json(p.path("plan/storyboard.json"))["scenes"]][:4]
        d = p.path("qa/sheets")
        shutil.rmtree(d, ignore_errors=True)
        d.mkdir(parents=True)
        for b in beats:
            (d / f"{b}.jpg").write_bytes(f"sheet {b} v1".encode())
        a, z = beats[1], beats[2]
        script = [{"name": "pass 1", "match": {"provider": "gemini", "tool_available": "submit_review", "user_contains": "Judge these"},
                   "reply": {"tool": "submit_review", "args": {"artifact": {"verdict": "fix", "findings": [
                       {"beat": a, "severity": "major", "problem": "the tag covers the face", "fix": "move it"},
                       {"beat": z, "severity": "minor", "problem": "the card is late", "fix": "earlier"}]}}}},
                  {"name": "pass 2", "match": {"provider": "gemini", "tool_available": "submit_review", "user_contains": "THIS IS A LATER PASS"},
                   "reply": {"tool": "submit_review", "args": {"artifact": {"verdict": "ship", "findings": []}}}}]
        with mock_env(script) as m:
            srv = Server(str(p.root))
            r1, _ = srv.call("critic_review", {})
            assert r1.get("reviewed") == sorted(beats) and len(r1["findings"]) == 2, r1
            rv = read_json(p.path("qa/review.json"))
            for f in rv["findings"]:
                f.update({"status": "accepted", "reason": "measured: the tag sits on the chest at 0.4 s"} if f["beat"] == a else {"status": "fixed"})
            write_json(p.path("qa/review.json"), rv)
            (d / f"{z}.jpg").write_bytes(f"sheet {z} v2".encode())          # the fixer changed z only
            n = len(m.requests)
            r2, _ = srv.call("critic_review", {})
            assert r2.get("reviewed") == [z] and r2.get("kept_from_earlier") == 1, r2
            body = json.dumps([q.get("body") for q in m.requests[n:]])
            assert "THIS IS A LATER PASS" in body and "the card is late" in body and "the tag covers the face" not in body, body[:400]
            rv = read_json(p.path("qa/review.json"))
            assert [f["beat"] for f in rv["findings"]] == [a] and rv["findings"][0]["status"] == "accepted" and rv["verdict"] == "ship", rv
            n = len(m.requests)
            r3, _ = srv.call("critic_review", {})
            assert r3.get("reviewed") == [] and len(m.requests) == n, r3                   # nothing changed: no model call
            assert RL.Rails(p).load()["critic"]["passes"] == 3
    return f"pass 1 judged {len(beats)} sheets; pass 2 only {z} (changed), with its earlier finding, {a}'s accepted one kept; pass 3 no call"


def agents_shuttle_a_blocker_closes_only_by_the_critic_or_a_person():
    """L-439, L-440: in 4 of the five-style test's 15 films the lead marked a critic blocker "accepted" and shipped it; the
    frames showed three of them real. A blocker the lead accepted is now judged again on the next pass (as an earlier
    finding, not as an accepted one), P10 holds while the critic's latest pass on the build reports a blocker, an agent
    cannot waive it, and a person's waiver (logged) releases it. A pass that no longer reports it closes it."""
    from agents_runtime import mock_env
    from loom.shuttle.rails import Refusal
    with lesson("P6") as p:
        beats = [s["beat"] for s in read_json(p.path("plan/storyboard.json"))["scenes"]][:3]
        d = p.path("qa/sheets")
        shutil.rmtree(d, ignore_errors=True)
        d.mkdir(parents=True)
        for b in beats:
            (d / f"{b}.jpg").write_bytes(f"sheet {b} v1".encode())
        a = beats[1]
        blocker = {"beat": a, "severity": "blocker", "problem": "the desk set vanishes", "fix": "keep the desk"}
        script = [{"name": "pass 1", "match": {"provider": "gemini", "tool_available": "submit_review", "user_contains": "Judge these"},
                   "reply": {"tool": "submit_review", "args": {"artifact": {"verdict": "fix", "findings": [blocker]}}}},
                  {"name": "pass 2", "match": {"provider": "gemini", "tool_available": "submit_review", "user_contains": "THIS IS A LATER PASS"},
                   "reply": {"tool": "submit_review", "args": {"artifact": {"verdict": "fix", "findings": [blocker]}}}}]
        rl = RL.Rails(p)
        with mock_env(script) as m:
            srv = Server(str(p.root))
            r1, _ = srv.call("critic_review", {})
            assert rl.load()["critic"]["blockers"] == [a], rl.load()["critic"]
            rv = read_json(p.path("qa/review.json"))
            for f in rv["findings"]:
                f.update({"status": "accepted", "reason": "the lead thinks it reads fine"})
            write_json(p.path("qa/review.json"), rv)
            n = len(m.requests)
            r2, _ = srv.call("critic_review", {})                           # nothing changed, but the accepted blocker is judged again
            assert r2.get("reviewed") == [a], r2
            body = json.dumps([q.get("body") for q in m.requests[n:]])
            assert "the desk set vanishes" in body and "the lead thinks it reads fine" not in body, body[:400]
        hold = [x for x in rl.conditions("P10") if "still reports a blocker" in x]
        assert hold and a in hold[0] and "waive" in hold[0], rl.conditions("P10")
        try:
            rl.waive_blocker(a, "agent, unattended per Kshitij", "ship it")
            raise AssertionError("an agent waived a blocker")
        except Refusal:
            pass
        rl.waive_blocker(a, "Kshitij", "a held desk is shown in the next beat; this is a deliberate cut")
        assert not [x for x in rl.conditions("P10") if "still reports a blocker" in x], rl.conditions("P10")
        led = p.path("logs/decisions.jsonl").read_text(encoding="utf-8")
        assert "blocker_waived" in led and "deliberate cut" in led
    return f"{a}'s accepted blocker judged again and held P10; an agent's waiver refused; a person's waiver released it (logged)"


def agents_shuttle_snapshots_run_in_parallel_on_private_builds():
    """The Opus run's 102 snapshots ran one at a time (about 50 s each, scene authors queueing behind the engine lock).
    Only the draft and the compose hold the lock now; the picture and the probe run on a private copy of the build. Two
    authors' slow halves overlap, and the copy is removed afterwards."""
    import threading
    import time as _t
    from loom import qa as QA
    with lesson("P6") as p:
        p.set_stage("scenes", status="pending")
        rl = RL.Rails(p)
        beats = _bespoke(p)[:2]
        toks = [rl.delegate("scene-author", [b], None, "write it")["token"] for b in beats]
        srv = Server(str(p.root))
        spans, dirs = [], []
        # both pictures must be in flight at once: each waits for the other inside the slow half. Under a lock the
        # second never arrives and the barrier breaks (red). A fixed sleep made this a race against the locked half's
        # own speed: on a 2-CPU sandbox the compose and copy took 2.5 s and a correct build failed (2026-10-09).
        meet = threading.Barrier(2, timeout=60)

        def slow(where, out):
            t0 = _t.monotonic()
            dirs.append(str(where))
            try:
                meet.wait()
            except threading.BrokenBarrierError:
                pass
            _t.sleep(0.2)
            spans.append((t0, _t.monotonic()))
            Path(out).parent.mkdir(parents=True, exist_ok=True)
            Path(out).write_bytes(b"jpg")
            return str(out)

        keep = (QA.snapshot_sheet, QA.probe, QA.snapshot_sheet_build, QA.probe_build)
        QA.snapshot_sheet = lambda project, times, name="snapshot": slow(project.path("build"), project.path(f"qa/{name}.jpg"))
        QA.probe = lambda project: {"errors": []}
        QA.snapshot_sheet_build = lambda build, times, out, missing=None: slow(build, out)
        QA.probe_build = lambda build, out, env=None: {"errors": [], "layout": {"findings": []}, "contrast": {"findings": []}}   # a clean probe, Loom's audits included (D-154)
        res = [None, None]
        # times on the lesson clock, inside each beat (R-46)
        tm = {b["id"]: b for b in read_json(p.path("audio/timings.json"))["beats"]}
        at = [[round(float(tm[b]["start"]) + 0.5, 2)] for b in beats]
        try:
            th = [threading.Thread(target=lambda i=i: res.__setitem__(i, srv.call("lab_snapshot", {"owner": toks[i], "times": at[i]})[0]))
                  for i in range(2)]
            for t in th:
                t.start()
            for t in th:
                t.join(300)
        finally:
            QA.snapshot_sheet, QA.probe, QA.snapshot_sheet_build, QA.probe_build = keep
        assert all(r and r.get("image") for r in res), res
        assert len(spans) == 2, spans
        (a0, a1), (b0, b1) = spans
        assert max(a0, b0) < min(a1, b1), f"the pictures ran one after the other: {spans}"
        assert str(p.path("build")) not in dirs and not any(Path(d).exists() for d in dirs), dirs
    return "two authors' pictures overlapped, each on its own copy of the build (removed after)"


def agents_shuttle_hook_denies_writes_outside_loom_mcp():
    """The PreToolUse hook: no Write or Edit into a lesson or a generated file, no shell write into a lesson, no approval
    and no forced render by an agent, a sub-agent's loom write needs its token; --strict denies every engine write and
    every shell; the CLI contract (JSON on stdin, a deny decision on stdout) holds in a real subprocess."""
    D = HK.decide
    cwd = str(ROOT)
    W = lambda path: {"tool_name": "Write", "tool_input": {"file_path": path}, "cwd": cwd}
    B = lambda cmd: {"tool_name": "Bash", "tool_input": {"command": cmd}, "cwd": cwd}
    assert "loom tools" in D(W("projects/x/plan/storyboard.json"))
    assert "generated" in D({"tool_name": "Edit", "tool_input": {"file_path": str(ROOT / "runtime/catalog.json")}, "cwd": cwd})
    assert "read-only" in D(W("C:/Users/Admin/Desktop/RedTee_V1_Video/x.py"))
    assert D(W("docs/notes.md")) is None and "Shuttle session" in D(W("docs/notes.md"), strict=True)    # control and strict
    assert "only a person approves" in D(B("py -m loom approve x plan --by me"))
    assert "forced render" in D(B("py -m loom run x render --force --reason y"))
    assert "writes into a lesson" in D(B("echo hi > projects/x/plan/a.json"))
    assert D(B("cat projects/x/plan/a.json")) is None and "no shell" in D(B("ls"), strict=True)
    assert "owner token" in D({"tool_name": "mcp__loom__submit_scene", "tool_input": {"artifact": {}}, "agent_type": "shuttle-scene-author"})
    assert D({"tool_name": "mcp__loom__get_beat", "tool_input": {"id": "b01"}, "agent_type": "shuttle-scene-author"}) is None
    assert "for the sub-agent" in D({"tool_name": "mcp__loom__submit_scene", "tool_input": {"owner": "own-x"}})
    ev = json.dumps({"tool_name": "Write", "tool_input": {"file_path": "projects/x/scenes/b01.js"}, "cwd": cwd})
    r = subprocess.run([sys.executable, "-m", "loom.shuttle.hook", "--strict"], input=ev, capture_output=True, text=True, cwd=str(ROOT), timeout=60)
    out = json.loads(r.stdout)
    assert r.returncode == 0 and out["hookSpecificOutput"]["permissionDecision"] == "deny", (r.returncode, r.stdout, r.stderr[-300:])
    r2 = subprocess.run([sys.executable, "-m", "loom.shuttle.hook"], input=json.dumps({"tool_name": "Read", "tool_input": {}}),
                        capture_output=True, text=True, cwd=str(ROOT), timeout=60)
    assert r2.returncode == 0 and r2.stdout.strip() == "", r2.stdout
    return "11 decisions, strict mode, and the stdin/stdout contract in a subprocess"


# ------------------------------------------------------------------ kit gate
def pipeline_shuttle_kit_gate_red_and_green():
    """P7: a kit is accepted only through kit_preview then submit_kit of the SAME source: refused unseen, refused when
    the static gate fails (Math.random), refused when the source changed after the preview, accepted when previewed.
    Without a browser the lab strip is stubbed (the gate logic is what is tested); with one, the real strip is drawn."""
    from loom import lab
    beat = next(s["beat"] for s in read_json(DEMO / "plan/storyboard.json")["scenes"] if s["kind"] == "bespoke")
    with lesson("P6", kit_beat=beat) as p:
        rl = RL.Rails(p)
        assert _phases(p)["P7"]["status"] == "open" and "scenes/_kit.js" in " ".join(_phases(p)["P7"]["missing"])
        tok = rl.delegate("kit-builder", None, None, "one board, two states")["token"]
        srv = Server(str(p.root))
        art = {"source": GOOD_KIT, "parts": ["board"], "api": "board(ctx, parent, {w, h}) -> {frame, setState}"}
        res, _ = srv.call("submit_kit", {"artifact": art, "owner": tok})
        assert res.get("accepted") is False and "look first" in res["errors"][0], res
        bad, _ = srv.call("kit_preview", {"source": GOOD_KIT.replace("return {", "const r = Math.random();\n  return {"), "owner": tok})
        assert any("Math.random" in e for e in bad.get("static_errors") or []), bad
        real = bool(browser())               # the shared check: the engine's own finder, not only the env var (L-127)
        orig = lab.strip
        if not real:
            def fake_strip(scene, style=None, times=None, out_dir=None, file=None, **kw):
                from PIL import Image
                Path(out_dir).mkdir(parents=True, exist_ok=True)
                f = Path(out_dir) / f"{scene}.jpg"
                Image.new("RGB", (64, 36), (40, 40, 40)).save(f)
                assert "Loom.lesson.board" in Path(file).read_text(encoding="utf-8") and "shuttle_kit_preview" in Path(file).read_text(encoding="utf-8")
                return {"sheet": str(f), "errors": [], "warnings": []}
            lab.strip = fake_strip
        try:
            ok, imgs = srv.call("kit_preview", {"source": GOOD_KIT, "owner": tok})
        finally:
            lab.strip = orig
        assert ok.get("image") and Path(ok["image"]).exists() and not ok.get("errors"), ok
        assert imgs == [ok["image"]]
        changed, _ = srv.call("submit_kit", {"artifact": dict(art, source=GOOD_KIT + "// changed after the look\n"), "owner": tok})
        assert changed.get("accepted") is False and "look first" in changed["errors"][0], changed
        # verified and unverified given as one sentence each, as two kit-builders of the measured run did: still the list
        good, _ = srv.call("submit_kit", {"artifact": dict(art, verified="the strip shows both states of the board",
                                                           unverified="not yet composed with its beats"), "owner": tok})
        assert good.get("accepted"), good
        assert _phases(p)["P7"]["status"] == "accepted", _phases(p)["P7"]
    return (f"unseen, static-red and changed kits refused; the previewed kit accepted ({'real' if real else 'stubbed'} lab strip), "
            "its notes given as sentences")


# ------------------------------------------------------------------ sub-agents: one source, two targets
def agents_shuttle_agents_targets_agree():
    """`shuttle agents --emit claude|sdk` writes both targets from shuttle/agents/*.md: the same tools, model and turn
    limit in each; every tool is a loom-mcp tool the rails know; each prompt carries its Relay card."""
    import tempfile
    tmp = Path(tempfile.mkdtemp(prefix="shuttle_agents_"))
    try:
        files = AG.emit_claude(tmp / "claude")
        sdk_file = AG.emit_sdk(tmp / "agents.json")
        sdk = json.loads(sdk_file.read_text(encoding="utf-8"))
        assert len(files) == len(sdk) == 6, (len(files), sorted(sdk))
        srv_tools = set(Server(str(DEMO)).tools)
        for f in files:
            c = AG.read_claude(f)
            s = sdk[c["name"]]
            assert c["tools"] == s["tools"] and c["model"] == s["model"] and c["maxTurns"] == s["maxTurns"], (c["name"], c, {k: s[k] for k in ("tools", "model", "maxTurns")})
            bare = [t.removeprefix(AG.MCP) for t in c["tools"]]
            assert all(t in RL.TOOLS and t in srv_tools for t in bare), (c["name"], [t for t in bare if t not in RL.TOOLS])
            body = f.read_text(encoding="utf-8")
            src = AG.resolve(c["name"])
            if src.get("card"):
                assert "Shared rules" in body and f"Role card: {src['card']}" in body, c["name"]
        # control: a drifted copy is caught
        d = AG.read_claude(files[0])
        assert d["tools"][:-1] != sdk[d["name"]]["tools"]
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    return "6 sub-agents, tools/model/maxTurns equal in both targets, every tool known to rails and server"


# ------------------------------------------------------------------ subscription mode's environment
def agents_shuttle_subscription_env_has_no_key():
    """Subscription mode's child has no ANTHROPIC_* variable and nothing a launching Claude Code session leaked
    (ANTHROPIC_BASE_URL, CLAUDE_CODE_SIMPLE, CLAUDE_AGENT_SDK_MCP_NO_PREFIX, CLAUDECODE); API mode has the key; the
    expected key source follows."""
    keep = dict(os.environ)
    try:
        os.environ.update(ANTHROPIC_API_KEY="sk-test-x", ANTHROPIC_BASE_URL="http://leak", CLAUDECODE="1", CLAUDE_CODE_SIMPLE="1",
                          CLAUDE_AGENT_SDK_MCP_NO_PREFIX="1", CLAUDE_CODE_GIT_BASH_PATH="C:/git/bin/bash.exe")
        raw = dict(os.environ)
        assert raw.get("ANTHROPIC_API_KEY")                                          # control: the parent has them
        env = LA.child_env("subscription")
        own = {"CLAUDE_CODE_GIT_BASH_PATH", "CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC", "CLAUDE_CODE_DISABLE_BACKGROUND_TASKS",
               "CLAUDE_CODE_DISABLE_MCP_TASK_BACKGROUND"}                     # kept, or set by the launcher on purpose
        leaked = [k for k in env if k.startswith("ANTHROPIC_") or k == "CLAUDECODE" or (k.startswith("CLAUDE") and k not in own)]
        assert not leaked, leaked
        assert env["CLAUDE_CODE_DISABLE_BACKGROUND_TASKS"] == "1" and env["MCP_TOOL_TIMEOUT"] == str(LA.TOOL_TIMEOUT_MS)
        assert env.get("CLAUDE_CODE_GIT_BASH_PATH") and LA.expected_key_source("subscription", env) == "none"
        api = LA.child_env("api")
        assert api["ANTHROPIC_API_KEY"] == "sk-test-x" and "ANTHROPIC_BASE_URL" not in api and LA.expected_key_source("api", api) == "ANTHROPIC_API_KEY"
    finally:
        os.environ.clear()
        os.environ.update(keep)
    return "subscription child has 0 ANTHROPIC_/CLAUDE leaks; api child has the key and no base URL"


# ------------------------------------------------------------------ the stream: real models into the ledger, the key-source guard
def agents_shuttle_stream_logs_real_models_and_guards_the_key():
    """Claude Code's stream-json becomes one ledger line per model call with the real model and the agent that made it
    (a sub-agent's messages carry parent_tool_use_id); a key source other than the mode's kills the session."""
    with lesson() as p:
        s = LA.Stream(p, "subscription", "none", "P1-P4")
        lines = [
            {"type": "system", "subtype": "init", "session_id": "s1", "model": "claude-sonnet-5", "apiKeySource": "none", "tools": ["Agent"],
             "mcp_servers": [{"name": "loom", "status": "connected"}], "agents": ["shuttle-scene-author"]},
            # the raw events carry the final output count; the assistant event repeats the count from the message's start (S1)
            {"type": "stream_event", "event": {"type": "message_start", "message": {"id": "m1"}}},
            {"type": "stream_event", "event": {"type": "message_delta", "usage": {"output_tokens": 300}}},
            {"type": "assistant", "message": {"id": "m1", "model": "claude-sonnet-5", "usage": {"input_tokens": 100, "cache_read_input_tokens": 9000,
             "cache_creation_input_tokens": 500, "output_tokens": 2}, "content": [{"type": "tool_use", "id": "tu1", "name": "Agent",
             "input": {"subagent_type": "shuttle-scene-author"}}]}},
            {"type": "assistant", "parent_tool_use_id": "tu1", "message": {"id": "m2", "model": "claude-haiku-4-5-20251001",
             "usage": {"input_tokens": 50, "output_tokens": 20}, "content": [{"type": "text", "text": "ok"}]}},
            {"type": "result", "subtype": "success", "is_error": False, "num_turns": 2, "total_cost_usd": 1.5, "usage": {},
             "modelUsage": {"claude-sonnet-5": {}}},
        ]
        for d in lines:
            s.line(json.dumps(d))
        calls = [json.loads(l) for l in p.path("logs/shuttle/calls.jsonl").read_text(encoding="utf-8").splitlines()]
        assert [(c["agent"], c["model"]) for c in calls[:2]] == [("lead", "claude-sonnet-5"), ("shuttle-scene-author", "claude-haiku-4-5-20251001")], calls
        assert calls[0]["input"] == 9600 and calls[0]["cached"] == 9000 and calls[0]["output"] == 300 and calls[0]["notional"] is True
        rows = round(calls[0]["usd"] + calls[1]["usd"], 6)
        assert calls[2]["agent"] == "reconcile" and abs(calls[2]["usd"] - (1.5 - rows)) < 1e-5, calls[2:]   # the CLI's total wins
        assert abs(RL.Rails(p).spent()["usd"] - 1.5) < 1e-5
        assert len(p.path("logs/llm_calls.jsonl").read_text(encoding="utf-8").splitlines()) == 3
        sess = read_json(p.path("logs/shuttle/session.json"))
        assert sess["agents"]["shuttle-scene-author"] == "claude-haiku-4-5-20251001" and sess["lead_model"] == "claude-sonnet-5"
        assert not s.killed                                                           # control: the right key source runs
        bad = LA.Stream(p, "subscription", "none", "P1-P4")
        bad.line(json.dumps(dict(lines[0], apiKeySource="ANTHROPIC_API_KEY")))
        assert bad.killed and "key source" in bad.killed, bad.killed
        lim = LA.Stream(p, "subscription", "none", "P1-P4")
        lim.line(json.dumps({"type": "result", "is_error": True, "result": "Claude AI usage limit reached|1760000000"}))
        assert lim.limit and "usage limit" in lim.limit
        ok_ = LA.Stream(p, "subscription", "none", "P1-P4")
        ok_.line(json.dumps({"type": "rate_limit_event", "rate_limit_info": {"status": "allowed", "isUsingOverage": False}}))
        assert not ok_.limit and not ok_.killed                                       # control: within the plan, nothing stops
        ov = LA.Stream(p, "subscription", "none", "P1-P4")
        ov.line(json.dumps({"type": "rate_limit_event", "rate_limit_info": {"status": "allowed", "isUsingOverage": True}}))
        assert ov.limit and "overage" in ov.limit and ov.killed, (ov.limit, ov.killed)   # paid overage is a person's decision
    return "2 calls logged with real models and agents; wrong key source killed; a usage limit read as exit 5"


def agents_shuttle_stream_stops_on_a_rejected_window_with_overage():
    """L-318: the Opus run's event was status "rejected" WITH isUsingOverage, and the session went on billing overage for
    81 minutes. A subscription session stops on either; in API mode a rejected window is noted and a later event within
    the plan clears it, so a finished session is not reported as a limit stop."""
    with lesson() as p:
        ev = lambda **i: json.dumps({"type": "rate_limit_event", "rate_limit_info": i})
        s = LA.Stream(p, "subscription", "none", "P7-P9")
        s.line(ev(status="rejected", rateLimitType="five_hour", overageStatus="allowed", isUsingOverage=True, overageInUse=True))
        assert s.killed and s.limit and "overage" in s.limit, (s.killed, s.limit)
        s2 = LA.Stream(p, "subscription", "none", "P7-P9")
        s2.line(ev(status="rejected", rateLimitType="five_hour", isUsingOverage=False))
        assert s2.killed and s2.limit, (s2.killed, s2.limit)                          # the plan's limit, no overage: stop too
        s3 = LA.Stream(p, "subscription", "none", "P7-P9")
        s3.line(ev(status="allowed_warning", utilization=0.98, isUsingOverage=False))
        assert not s3.killed and not s3.limit                                          # control: a warning runs on
        a = LA.Stream(p, "api", "ANTHROPIC_API_KEY", "P7-P9")
        a.line(ev(status="rejected", rateLimitType="five_hour"))
        assert a.limit and not a.killed
        a.line(ev(status="allowed", rateLimitType="five_hour"))
        assert a.limit is None, a.limit                                               # the window reset: no stale flag
        tr = p.path("logs/shuttle/trace.jsonl").read_text(encoding="utf-8")
        assert '"rate_limit_cleared"' in tr and tr.count('"session_killed"') == 2
    return "rejected with overage killed; rejected alone killed (subscription); a warning runs on; API flag cleared on reset"


def agents_shuttle_pins_full_model_ids_and_counts_a_resumed_session_once():
    """L-323: the CLI's `sonnet` alias served claude-sonnet-5 (383 sub-agent calls in the Opus run) while the price table
    and the request meant Sonnet 5.5. The lead's --model and every sub-agent's model are full ids now (S0 on the real
    CLI: every request named claude-sonnet-5-5). The report counts a resumed session's cumulative CLI figure once."""
    assert AG.model_id("sonnet") == "claude-sonnet-5-5" and AG.model_id("opus") == "claude-opus-5-5"
    assert AG.model_id("claude-haiku-4-5") == "claude-haiku-4-5"                   # a full id passes through
    files = {"mcp": Path("m.json"), "settings": Path("s.json")}
    cmd = LA.command("claude", files, "opus", "subscription", "sid", False, 10, None)
    assert cmd[cmd.index("--model") + 1] == "claude-opus-5-5", cmd
    emitted = AG.emit_sdk()
    assert all(v["model"] == "claude-sonnet-5-5" for v in read_json(emitted).values()), read_json(emitted)
    with lesson() as p:
        rl = RL.Rails(p)
        rl.trace("session_start", group="P10-P11", resume=False, session="s1")
        rl.trace("reconcile", group="P10-P11", session="s1", cli_usd=3.27)
        rl.trace("session_result", group="P10-P11", subtype="success", turns=42, cli_cost_usd=3.27)
        rl.trace("session_start", group="P10-P11", resume=True, session="s1")
        rl.trace("reconcile", group="P10-P11", session="s1", cli_usd=3.45)
        rl.trace("session_result", group="P10-P11", subtype="success", turns=4, cli_cost_usd=3.45)
        text = LA.write_report(p).read_text(encoding="utf-8")
        assert "counted once: $3.4500" in text and "(resumed)" in text, text[:900]
    return "lead and sub-agents on full ids (claude-opus-5-5, claude-sonnet-5-5); a resumed session counted once ($3.45, not $6.72)"


def agents_shuttle_lead_reads_the_engine_claude_md_and_nothing_of_the_persons():
    """L-316 for Shuttle: the lead runs in the engine folder, so Claude Code's walk up to the drive root also found the
    person's own ~/.claude/CLAUDE.md, and auto-memory could add the notes of the person's sessions here. The real CLI,
    on the mock, with the lead's exact command and settings: the engine's CLAUDE.md is there (meant for the lead), the
    person's is not.

    The person's file is planted, not looked for: with CLAUDE_CONFIG_DIR set the CLI reads the user file from THAT
    folder, never ~/.claude, so the earlier version (a fresh empty config dir, the marker taken from ~/.claude) could
    not fail, and it skipped on any machine without a personal file (2026-10-09, shown both ways on the real CLI). The
    config dir is named `.claude` as the real one is, so the lead's exclude globs meet the path they meet in use.
    Control: the plain CLI with the same config dir does send the planted line."""
    import subprocess
    import tempfile
    import uuid
    from loom.agents.llm.mock_server import MockLLM
    from loom.util import ENGINE_ROOT, which
    claude = which("claude")
    if not claude:
        return "skipped (no claude CLI here)"
    marker = "PERSONAL-NOTE-" + uuid.uuid4().hex[:12] + " (a line from the person's own CLAUDE.md)"
    key = "shuttle-test-key"
    root = Path(tempfile.mkdtemp(prefix="shuttle_cfg_"))
    cfg = root / ".claude"
    cfg.mkdir()
    (cfg / "CLAUDE.md").write_text(marker + "\n", encoding="utf-8")

    def ask(cmd, m):
        # the planted folder is both the config dir and the home's .claude, so the CLI finds the person's file whichever
        # of the two its version reads (this sandbox's CLI reads the config dir; the Windows red run of 2026-10-08 read
        # the home's)
        env = LA.child_env("subscription", {"CLAUDE_CONFIG_DIR": str(cfg), "HOME": str(root), "USERPROFILE": str(root),
                                            "ANTHROPIC_API_KEY": key, "ANTHROPIC_BASE_URL": m.base_url})
        r = subprocess.run(cmd, input="Say ok.", capture_output=True, text=True, cwd=str(ENGINE_ROOT), env=env, timeout=180,
                           encoding="utf-8", errors="replace")
        assert m.requests, (r.returncode, r.stderr[-400:])
        return json.dumps([q.get("body") for q in m.requests if q.get("body")])

    script = [{"name": "any", "match": {}, "reply": {"text": "ok"}, "repeat": 6}]
    try:
        with lesson() as p:
            with MockLLM(script=script, api_key=key, anthropic_stream=True, anthropic_strict_alternation=False) as m:
                files = LA.write_configs(p, "sonnet", None)
                bodies = ask(LA.command(claude, files, "sonnet", "subscription", str(uuid.uuid4()), False, 2, None), m)
                n = len(m.requests)
            with MockLLM(script=script, api_key=key, anthropic_stream=True, anthropic_strict_alternation=False) as m2:
                plain = ask([claude, "-p", "--model", "sonnet"], m2)
        assert marker in plain, "control: the plain CLI did not read the planted file, so this test could not fail"
        assert "Loom Video-Engine - instructions for agents" in bodies, "control: the engine's CLAUDE.md did not reach the lead"
        assert marker not in bodies, "the person's CLAUDE.md reached the lead"
    finally:
        shutil.rmtree(root, ignore_errors=True)
    return f"{n} request(s): the engine's CLAUDE.md in, the person's out; control: the plain CLI sends the person's"


def agents_shuttle_reconcile_fills_sub_agent_output_per_model():
    """L-323: sub-agent messages arrive without their final output count (2,795 Sonnet output tokens logged against the
    CLI's 1,344,736 in the Opus run). The session's per-model figures fill the gap per model, priced from the engine's
    table and shared among the agents by their input; a reconcile row is not a model call."""
    with lesson() as p:
        s = LA.Stream(p, "subscription", "none", "P7-P9")
        msg = lambda mid, model, inp, out, par=None, content=None: {"type": "assistant", "parent_tool_use_id": par, "message": {
            "id": mid, "model": model, "usage": {"input_tokens": inp, "output_tokens": out}, "content": content or [{"type": "text", "text": "x"}]}}
        agent = lambda tid, kind: [{"type": "tool_use", "id": tid, "name": "Agent", "input": {"subagent_type": kind}}]
        lines = [{"type": "system", "subtype": "init", "session_id": "s9", "model": "claude-opus-5-5", "apiKeySource": "none",
                  "mcp_servers": [{"name": "loom", "status": "connected"}]},
                 {"type": "stream_event", "event": {"type": "message_start", "message": {"id": "L1"}}},
                 {"type": "stream_event", "event": {"type": "message_delta", "usage": {"output_tokens": 500}}},
                 msg("L1", "claude-opus-5-5", 1000, 3, content=agent("t1", "shuttle-scene-author") + agent("t2", "shuttle-fixer")),
                 msg("A1", "claude-sonnet-5-5", 3000, 4, par="t1"), msg("A2", "claude-sonnet-5-5", 1000, 4, par="t2"),
                 {"type": "result", "subtype": "success", "is_error": False, "num_turns": 3, "total_cost_usd": 0.5,
                  "modelUsage": {"claude-opus-5-5": {"inputTokens": 1000, "outputTokens": 500, "cacheReadInputTokens": 0,
                                                     "cacheCreationInputTokens": 0, "costUSD": 0.01},
                                 "claude-sonnet-5-5": {"inputTokens": 4000, "outputTokens": 8008, "cacheReadInputTokens": 0,
                                                       "cacheCreationInputTokens": 0, "costUSD": 0.09}}}]
        for d in lines:
            s.line(json.dumps(d))
        calls = [json.loads(l) for l in p.path("logs/shuttle/calls.jsonl").read_text(encoding="utf-8").splitlines()]
        rec = [c for c in calls if c.get("reconcile")]
        assert {c["agent"] for c in rec} == {"shuttle-scene-author", "shuttle-fixer"} and all(c["model"] == "claude-sonnet-5-5" for c in rec), rec
        by = {c["agent"]: c for c in rec}
        assert by["shuttle-scene-author"]["output"] == 6000 and by["shuttle-fixer"]["output"] == 2000, by   # 8000 shared 3:1
        assert sum(c["output"] for c in calls if c["model"] == "claude-sonnet-5-5") == 8008                  # the CLI's count
        assert not [c for c in rec if c["model"] == "claude-opus-5-5"]                                     # the lead's was right
        ten = R.cost(R.model("claude-sonnet-5-5"), __import__("loom.agents.llm.types", fromlist=["Usage"]).Usage(output=6000))
        assert abs(by["shuttle-scene-author"]["usd"] - ten) < 1e-6                                         # the engine's table
        sp = RL.Rails(p).spent()
        assert sp["calls"] == 3, sp["calls"]                                                               # rows, not calls
        tr = [json.loads(l) for l in p.path("logs/shuttle/trace.jsonl").read_text(encoding="utf-8").splitlines()]
        r = next(t for t in tr if t.get("event") == "reconcile")
        assert r["per_model"]["claude-sonnet-5-5"]["cli_usd"] == 0.09 and r["rows_added"] == 2
    return "8,000 missing Sonnet output tokens shared 3:1 by input, priced from the table; the lead's left alone; 3 calls counted"


# ------------------------------------------------------------------ a snapshot while clip authors still write
def pipeline_lenient_compose_skips_clip_files_not_written_yet():
    """A snapshot composes leniently while other workers write; a Manim beat whose file is not written yet must be left
    out like a missing bespoke scene, not end the compose (S0, 2026-10-08: every scene author's snapshot failed on
    'Manim scene file not found' while the clip authors worked). The strict compose still refuses it."""
    from loom.util import LoomError
    with lesson() as p:
        _demo(p)
        p.path("scenes/b06.py").unlink()
        flow.run_code(p, "compose", strict=False, mix=False, manim_quality="draft")      # raised on the old code
        done = [r.get("beat") for r in p._manim_report]
        assert "b06" not in done and "b14" in done and p.path("build/index.html").exists(), done
        try:
            flow.run_code(p, "compose", mix=False)
            raise AssertionError("the strict compose accepted a missing Manim file")
        except LoomError as e:
            assert "b06" in str(e), e
    return "the lenient compose skipped the missing b06.py and rendered b14; the strict compose still refuses it"


# ------------------------------------------------------------------ the mock server, as Claude Code meets it
def mock_llm_streams_anthropic_events_and_prices_images_like_the_api():
    """With anthropic_stream on, a stream=true request is answered as server-sent events that reassemble into the scripted
    tool call; a system-role message (Claude Code sends one) is accepted; an image costs about 1.6k input tokens, not
    its base64 length. Off (the default), streaming is still refused, as the other suites expect."""
    import base64
    import urllib.request
    from loom.agents.llm.mock_server import MockLLM
    step = {"match": {"tool_available": "mcp__loom__lesson_status"}, "reply": {"text": "looking", "tool": "mcp__loom__lesson_status", "args": {"a": 1}}}
    img = base64.b64encode(b"\x00" * 600000).decode()
    body = {"model": "claude-sonnet-5", "max_tokens": 100, "stream": True, "system": "x",
            "tools": [{"name": "mcp__loom__lesson_status", "input_schema": {"type": "object"}}],
            "messages": [{"role": "system", "content": "a CLI note"},
                         {"role": "user", "content": [{"type": "text", "text": "hi"},
                                                      {"type": "image", "source": {"type": "base64", "media_type": "image/jpeg", "data": img}}]}]}

    def post(m):
        req = urllib.request.Request(m.anthropic_base + "/messages", data=json.dumps(body).encode(), method="POST",
                                     headers={"x-api-key": "k", "anthropic-version": "2023-06-01", "content-type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=30) as r:
                return r.status, r.headers.get("content-type"), r.read().decode()
        except urllib.error.HTTPError as e:
            return e.code, e.headers.get("content-type"), e.read().decode()

    with MockLLM(script=[step], api_key="k", anthropic_stream=True, anthropic_strict_alternation=False) as m:
        code, ctype, text = post(m)
    assert code == 200 and ctype.startswith("text/event-stream"), (code, ctype, text[:200])
    events = [json.loads(l[6:]) for l in text.splitlines() if l.startswith("data: ")]
    kinds = [e["type"] for e in events]
    assert kinds[0] == "message_start" and kinds[-1] == "message_stop" and "message_delta" in kinds, kinds
    tool = next(e for e in events if e["type"] == "content_block_start" and e["content_block"]["type"] == "tool_use")
    args = "".join(e["delta"]["partial_json"] for e in events if e["type"] == "content_block_delta" and e["delta"]["type"] == "input_json_delta")
    assert tool["content_block"]["name"] == "mcp__loom__lesson_status" and json.loads(args) == {"a": 1}
    stop = next(e for e in events if e["type"] == "message_delta")["delta"]["stop_reason"]
    used = events[0]["message"]["usage"]["input_tokens"]
    assert stop == "tool_use" and 1600 <= used < 3000, (stop, used)            # control: chars/4 would be about 200,000
    with MockLLM(script=[step], api_key="k") as m:
        code, _, text = post(m)
    assert code == 400 and "streaming" in text, (code, text[:200])
    return f"streamed tool call reassembled; an image read as {used} input tokens; streaming still refused by default"


# ------------------------------------------------------------------ the protocol pipes are the protocol's alone
CHILD_SCRIPT = r"""
import os, subprocess, sys
sys.path.insert(0, %(root)r)
from pathlib import Path
from loom.shuttle.server import isolate_stdio
pin, pout = isolate_stdio(Path(%(log)r))
r = subprocess.run([sys.executable, "-c", "import sys; d = sys.stdin.read(); print('CHILD READ', len(d)); sys.stderr.write('child-err')"])
line = pin.readline().decode().strip()
pout.write(("OK " + line + "\n").encode())
"""


def agents_shuttle_server_children_never_touch_the_protocol():
    """After loom-mcp isolates its stdio, a child process (ffmpeg, node, Manim) reads the null device, not the protocol's
    stdin, and writes to the log, not to the protocol's stdout or to stderr (Claude Code does not drain stderr). S0
    blocked twice on these (2026-10-08): narrate's prints filled stderr; the animatic's ffmpeg sat on stdin."""
    import tempfile
    d = Path(tempfile.mkdtemp(prefix="shuttle_stdio_"))
    try:
        log = d / "server.log"
        r = subprocess.run([sys.executable, "-c", CHILD_SCRIPT % {"root": str(ROOT), "log": str(log)}], input="PROTO\n", capture_output=True,
                           text=True, timeout=60)
        assert r.stdout == "OK PROTO\n", (r.stdout, r.stderr[-300:])
        assert r.stderr == "", r.stderr[-300:]
        text = log.read_text(encoding="utf-8")
        assert "CHILD READ 0" in text and "child-err" in text, text
    finally:
        shutil.rmtree(d, ignore_errors=True)
    return "the child read 0 bytes of the protocol's stdin; its output went to the log; stdout carried only the protocol"


# ------------------------------------------------------------------ loom-mcp over stdio
def agents_shuttle_mcp_server_speaks_stdio():
    """`py -m loom.shuttle.server` answers initialize, tools/list and tools/call as JSON-RPC lines; every line on stdout
    parses (the engine's prints go to stderr), a refusal comes back as isError with its reason, an image as image content."""
    with lesson() as p:
        msgs = [{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2025-06-18", "capabilities": {}}},
                {"jsonrpc": "2.0", "method": "notifications/initialized"},
                {"jsonrpc": "2.0", "id": 2, "method": "tools/list"},
                {"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "lesson_status", "arguments": {}}},
                {"jsonrpc": "2.0", "id": 4, "method": "tools/call", "params": {"name": "submit_storyboard", "arguments": {"artifact": {}}}},
                {"jsonrpc": "2.0", "id": 5, "method": "nope"}]
        r = subprocess.run([sys.executable, "-m", "loom.shuttle.server", "--project", str(p.root)], input="\n".join(json.dumps(m) for m in msgs) + "\n",
                           capture_output=True, text=True, cwd=str(ROOT), timeout=120, encoding="utf-8")
        out = [json.loads(l) for l in r.stdout.splitlines() if l.strip()]
        by = {m.get("id"): m for m in out}
        # nothing on stderr: Claude Code does not drain it, and a full pipe blocked narrate for good in S0 (2026-10-08)
        assert not r.stderr.strip(), r.stderr[-400:]
        assert "loom-mcp started" in p.path("logs/shuttle/server.log").read_text(encoding="utf-8")
        assert set(by) == {1, 2, 3, 4, 5}, (sorted(by), r.stderr[-500:])
        assert by[1]["result"]["serverInfo"]["name"] == "loom"
        names = {t["name"] for t in by[2]["result"]["tools"]}
        assert {"lesson_status", "delegate", "kit_preview", "request_approval", "reopen", "critic_review"} <= names and len(names) == len(RL.TOOLS)
        st = json.loads(by[3]["result"]["content"][0]["text"])
        assert st["current"] == "P1" and not by[3]["result"]["isError"], st
        assert by[4]["result"]["isError"] and "P1" in json.loads(by[4]["result"]["content"][0]["text"])["refused"]
        assert by[5]["error"]["code"] == -32601
    return f"{len(out)} JSON-RPC answers, {len(names)} tools listed, a refusal as isError, an unknown method as -32601"
