"""Relay improvements of 2026-10-08 (docs/strategy/2026-10-08-pipeline-architecture.md, section 5): decision records
name the model that really ran (L-268), cache misses are counted, a plan checkpoint stops the run before the kit
and scenes, and the lesson kit (scenes/_kit.js: written once, composed by the beats). Mock providers only; each test
has a control that shows it can fail."""
from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))   # tests/: one browser check for every suite
from browser_support import browser  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from agents_runtime import DEMO, cast_storyboard, restamp, fresh_project, mock_env  # noqa: E402
from loom import flow, ledger as L  # noqa: E402
from loom.agents import tools as T  # noqa: E402
from loom.agents import runtime as RUN  # noqa: E402
from loom.agents.budget import Budget  # noqa: E402
from loom.agents.conductor import Conductor, task_message  # noqa: E402
from loom.agents.llm.types import Response, ToolCall, Usage  # noqa: E402
from loom.checks.kit import kit_errors  # noqa: E402
from loom.stages import active  # noqa: E402
from loom.util import read_json, write_json  # noqa: E402
import shutil  # noqa: E402

GOOD_KIT = """// the lesson kit: parts drawn once, composed by the beats
Loom.lesson = Loom.lesson || {};
Loom.lesson.board = function (ctx, parent, opts) {
  const o = opts || {};
  const w = o.w || 600, h = o.h || 360;
  const frame = ctx.kit.rect(parent, 0, 0, w, h, { fill: ctx.c("surface"), stroke: ctx.c("ink"), r: 12 });
  return { frame: frame, setState: function (name, t) { return t; } };
};
"""


def _copy_demo(p, subs=("plan", "audio", "scenes", "media")):
    for sub in subs:
        if (DEMO / sub).exists():
            shutil.rmtree(p.path(sub), ignore_errors=True)
            shutil.copytree(DEMO / sub, p.path(sub))
    cast_storyboard(p)
    write_json(p.path("state.json"), read_json(DEMO / "state.json"))
    restamp(p)


def _first_bespoke(p):
    sb = read_json(p.path("plan/storyboard.json"))
    return next(s for s in sb["scenes"] if s["kind"] == "bespoke")


def _declare_kit(p, beat):
    sb = read_json(p.path("plan/storyboard.json"))
    sb["kit"] = {"parts": [{"id": "board", "what": "the held board", "states": ["blank", "full"], "beats": [beat]}]}
    write_json(p.path("plan/storyboard.json"), sb)


class _FakeProvider:
    """Two turns: a report_finding, then plain text (ends the loop after nudges). Records the running model."""

    def __init__(self, cached: int):
        self.cached, self.seen, self.n = cached, [], 0

    def complete(self, req):
        self.n += 1
        self.seen.append(L.RUNNING.get())
        u = Usage(input=20000, cached=self.cached if self.n > 1 else 0, output=50)
        if self.n == 1:
            return Response("", [ToolCall("t1", "report_finding", {"finding": {"kind": "note", "what": "x"}})], "tool", u, req.model, "anthropic", 0.01)
        return Response("done", [], "end", u, req.model, "anthropic", 0.01)


def agents_decision_records_name_the_model_that_ran():
    """L-268: inside an agents task, ledger.actor reports the running model (per thread), not the project's tier
    default; outside one it keeps the old behaviour. Control: the same call without RUNNING gives the tier default."""
    with fresh_project() as p:
        outside = L.actor("agent", "plan", p)
        tok = L.RUNNING.set({"model": "gpt-6.1-sol", "provider": "openai", "role": "storyboard"})
        try:
            inside = L.actor("agent", "plan", p)
        finally:
            L.RUNNING.reset(tok)
        assert inside["model"] == "gpt-6.1-sol" and inside["mode"] == "agents" and inside["role"] == "storyboard", inside
        assert outside.get("model") != "gpt-6.1-sol" and L.RUNNING.get() is None, outside
        # run_agent sets it for the whole task and clears it after
        prov = _FakeProvider(cached=0)
        spec = RUN.AgentSpec("critic", "claude-sonnet-5-5", limits={"turns": 4})
        ctx = T.ToolContext(p, "critic", "review")
        RUN.run_agent(spec, ctx, "judge " + "x" * 12000, Budget(5.0), provider=prov)
        assert prov.seen and all(s and s["model"] == "claude-sonnet-5-5" and s["role"] == "critic" for s in prov.seen), prov.seen
        assert L.RUNNING.get() is None
    return f"inside a task: {inside['model']}; outside: {outside.get('model')}; reset after the task"


def agents_cache_misses_are_counted():
    """A prefix the provider has seen that reads 0 cached tokens is a cache miss: counted in the trace and the
    model_call record. Control: the same run with cached tokens on turn 2 counts none."""
    out = {}
    for cached in (0, 15000):
        with fresh_project() as p:
            spec = RUN.AgentSpec("critic", "claude-sonnet-5-5", limits={"turns": 4})
            ctx = T.ToolContext(p, "critic", "review")
            RUN.run_agent(spec, ctx, "judge " + "x" * 12000, Budget(5.0), provider=_FakeProvider(cached))
            recs = [json.loads(l) for l in p.path("logs/decisions.jsonl").read_text(encoding="utf-8").splitlines()]
            mc = [r for r in recs if r["event"] == "model_call"][-1]
            out[cached] = mc["data"]["cache_misses"]
            trace = next(p.path("logs/traces").glob("critic-*.jsonl")).read_text(encoding="utf-8")
            assert ("cache_miss" in trace) == (cached == 0), trace[-400:]
    assert out[0] >= 1 and out[15000] == 0, out
    return f"no cache: {out[0]} miss(es) counted; cached: {out[15000]}"


def pipeline_plan_checkpoint_stops_before_the_scenes():
    """With the plan gate on, the run stops (exit 3) before the kit and scenes until a person approves the plan, and
    writes qa/approvals/plan.md; --approve-plan-as records an unattended approval and goes on; an approval goes stale
    when the storyboard changes. Control: with the gate off the run goes straight to the scenes."""
    with fresh_project() as p:
        _copy_demo(p)
        p.set_stage("scenes", status="pending")
        order = [s for s in active(p) if not s.optional]
        calls = []

        def make(**kw):
            c = Conductor(p, "mock", Budget(1.0), **kw)
            c.stage_agent = lambda n: (calls.append(n) or "ok")
            return c

        assert make(plan_gate=True)._pass(order, "scenes") == 3 and not calls
        assert p.path("qa/approvals/plan.md").exists() and "approve" in p.path("qa/approvals/plan.md").read_text(encoding="utf-8")
        assert make(plan_gate=False)._pass(order, "scenes") == 0 and calls == ["scenes"]
        calls.clear()
        assert make(plan_gate=True, approve_plan_as="agent, unattended per test")._pass(order, "scenes") == 0 and calls == ["scenes"]
        rec = flow.plan_approved(p)
        assert rec and rec["unattended"] is True, rec
        sb = read_json(p.path("plan/storyboard.json"))
        sb["concept"] = (sb.get("concept") or "") + " (changed)"
        write_json(p.path("plan/storyboard.json"), sb)
        assert flow.plan_approved(p) is None
        assert any(json.loads(l)["event"] == "approval" and json.loads(l).get("node") == "plan"
                   for l in p.path("logs/decisions.jsonl").read_text(encoding="utf-8").splitlines())
    return "gate on: exit 3 and a review note; off: straight on; unattended approval recorded; stale after a change"


def pipeline_kit_gate_refuses_what_it_must():
    """The kit gate: a declared part must exist; Math.random, a hex colour, a Loom.scene registration and a missing
    `Loom.lesson = Loom.lesson || {}` are errors; a good kit passes; a beat that never uses its part warns. Control:
    a storyboard without a kit has no kit errors at all."""
    with fresh_project() as p:
        _copy_demo(p)
        assert kit_errors(p) == ([], [])
        beat = _first_bespoke(p)["beat"]
        _declare_kit(p, beat)
        E, _ = kit_errors(p)
        assert E and "missing" in E[0], E
        bad = {"random": GOOD_KIT.replace("const o", "const r = Math.random(); const o"),
               "hex": GOOD_KIT.replace('ctx.c("surface")', '"#ffffff"'),
               "scene": GOOD_KIT + '\nLoom.scene("b99", { build(ctx) {} });\n',
               "init": GOOD_KIT.replace("Loom.lesson = Loom.lesson || {};", ""),
               "part": GOOD_KIT.replace("Loom.lesson.board =", "Loom.lesson.other =")}
        for k, src in bad.items():
            E, _ = kit_errors(p, source=src)
            assert E, f"{k}: not refused"
        E, W = kit_errors(p, source=GOOD_KIT)
        assert not E, E
        assert any("does not use it" in w for w in W), W
    return "missing, random, hex, a beat registration, no init, a missing part: refused; a good kit passes"


def pipeline_kit_submit_writes_only_a_kit_that_passes():
    """submit_kit runs the gate and node's syntax check; a kit that fails either never stays on disk (every beat
    loads it); a good one is written with its API note for the scene workers, and the scene task message carries it."""
    with fresh_project() as p:
        _copy_demo(p)
        beat = _first_bespoke(p)["beat"]
        _declare_kit(p, beat)
        ctx = T.ToolContext(p, "kit", "scenes", target=p.path("scenes/_kit.js"))
        r = T.call(ctx, "submit_kit", {"artifact": {"source": GOOD_KIT.replace("return {", "return {{")}})
        assert r["accepted"] is False and not p.path("scenes/_kit.js").exists(), r
        ctx = T.ToolContext(p, "kit", "scenes", target=p.path("scenes/_kit.js"))
        r = T.call(ctx, "submit_kit", {"artifact": {"source": GOOD_KIT, "parts": ["board"], "api": "board(ctx, parent, {w, h}) -> {frame, setState}"}})
        assert r["accepted"] is True and p.path("scenes/_kit.js").exists() and p.path("logs/kit_api.md").exists(), r
        tm = read_json(p.path("audio/timings.json"))
        sc = next(s for s in read_json(p.path("plan/storyboard.json"))["scenes"] if s["beat"] == beat)
        msg = task_message(p, "scene", {"scene": sc, "beat_timing": next(b for b in tm["beats"] if b["id"] == beat), "file": f"scenes/{beat}.js"})
        # the kit's API note and its parts, never its source (L-422: 30 k characters in every brief); the source on demand
        assert "THE LESSON KIT" in msg and '"board"' in msg and "KIT API NOTE:" in msg and "read_artifact('kit')" in msg, msg[-900:]
        assert "Loom.lesson.board = function" not in msg, "the kit's source is not pasted into a scene task"
        other = next(s for s in read_json(p.path("plan/storyboard.json"))["scenes"] if s["beat"] != beat and s["kind"] == "bespoke")
        msg2 = task_message(p, "scene", {"scene": other, "beat_timing": next(b for b in tm["beats"] if b["id"] == other["beat"]), "file": "x"})
        assert "THE LESSON KIT" not in msg2
    return "a broken kit is refused and removed; a good kit is written with its API; only its beats are told about it"


def pipeline_kit_is_composed_before_the_beats_and_drawn_by_them():
    """A composed lesson loads scenes/_kit.js before the beat scenes: a beat that calls Loom.lesson.board draws the kit's
    part (its words reach the runtime's text report) with no runtime error. Control: the same lesson without the kit
    file reports the beat's call as a thrown scene."""
    if not browser():
        return "skipped (no browser here)"
    from loom import qa
    kit_src = GOOD_KIT.replace('return { frame: frame', 'ctx.kit.text(parent, "Kit board", { x: 20, y: 20, w: w - 40, h: 60, role: "label", color: "ink" });\n  return { frame: frame')
    out = {}
    for with_kit in (True, False):
        with fresh_project() as p:
            _copy_demo(p)
            sc = _first_bespoke(p)
            beat = sc["beat"]
            _declare_kit(p, beat)
            f = p.path(f"scenes/{sc.get('scene') or beat}.js")
            src = f.read_text(encoding="utf-8")
            hook = "build(ctx"
            i = src.index(hook)
            j = src.index("{", src.index(")", i)) + 1
            src = src[:j] + '\n    { const KE = ctx.el("kit_board", { x: 1300, y: 120, w: 520, h: 300, kind: "card", exit: "recede" }); Loom.lesson.board(ctx, KE.inner, { w: 520, h: 300 }); }\n' + src[j:]
            f.write_text(src, encoding="utf-8")
            if with_kit:
                p.path("scenes/_kit.js").write_text(kit_src, encoding="utf-8")
            flow.run_code(p, "compose", manim_quality="draft", strict=False, mix=False)
            rep = qa.probe(p)
            texts = json.dumps(rep.get("texts") or [])
            errs = [e for e in rep.get("errors") or [] if e.get("beat") == beat or beat in str(e.get("msg", ""))]
            out[with_kit] = ("Kit board" in texts, [e.get("code") for e in errs])
    assert out[True] == (True, []), out[True]
    assert out[False][0] is False and out[False][1], out[False]
    return f"with the kit: drawn, no errors; without it: {out[False][1]}"


def agents_kit_worker_runs_once_before_the_scenes():
    """Conductor.kit: a declared kit is written by one worker (the profile's scene model when it names no kit model)
    and kept while its spec is unchanged; a changed spec sends it back with a FIX REQUEST. Control: no kit, no call."""
    # mock script entries are used once each: one for the first write, one for the rewrite after the spec changes
    script = [{"match": {"provider": "gemini", "user_contains": "lesson kit"},
               "reply": {"tool": "submit_kit", "args": {"artifact": {"source": GOOD_KIT, "parts": ["board"], "api": "board"}}}}] * 2
    with fresh_project() as p:
        _copy_demo(p)
        with mock_env(script) as m:
            # the kit preview gate is its own test (agents_relay_upgrade_*); this one is about writing and keeping the kit
            c = Conductor(p, "mock", Budget(1.0), require_snapshot=False)
            assert c.kit() == "ok" and not m.requests
            beat = _first_bespoke(p)["beat"]
            _declare_kit(p, beat)
            assert c.kit() == "ok" and p.path("scenes/_kit.js").exists()
            n = len(m.requests)
            assert n >= 1 and c.kit() == "ok" and len(m.requests) == n, (n, len(m.requests))
            sb = read_json(p.path("plan/storyboard.json"))
            sb["kit"]["parts"][0]["what"] = "the held board, now with a date strip"
            write_json(p.path("plan/storyboard.json"), sb)
            assert c.kit() == "ok" and len(m.requests) > n
    return f"no kit: no call; declared: written once ({n} call(s)); unchanged: kept; changed: rewritten"


def agents_plan_checkpoint_is_off_unless_asked():
    """D-131 (Kshitij, 2026-10-08): an agents run goes straight from the storyboard to the kit and scenes; the plan
    checkpoint runs only with --plan-gate. Control: the flag turns it on."""
    from loom import cli
    seen = []
    real = cli._dispatch
    cli._dispatch = lambda args: seen.append(args) or 0
    try:
        cli.main(["agents", "run", "x"])
        cli.main(["agents", "run", "x", "--plan-gate"])
    finally:
        cli._dispatch = real
    assert len(seen) == 2, seen
    assert seen[0].plan_gate is False and seen[1].plan_gate is True
    assert not hasattr(seen[0], "no_plan_gate")
