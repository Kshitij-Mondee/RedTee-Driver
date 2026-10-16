"""What the Relay comparison run found (R-35, feedback-relay-sb; plan docs/research/2026-10-08-relay-fixes-plan.md,
L-324 to L-328, D-143), one test per fix, each red on the engine before it:
`fill: "none"` is no fill; an error raised inside a lesson kit part names the part and goes to the kit's author; an
index prop must point inside its list; a repair that ran nobody ends the run; the claude_code cost is priced from the
tokens, not the CLI's total (cumulative on a resume, and unknown for Sonnet 5.5 in CLI 2.1.283); a task served by
another model than its alias is stopped; an isolated lesson reads no other lesson's seed and is read by none; the
picture critic looks again after its fixes and its minors are routed too."""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from agents_runtime import DEMO, cast_storyboard, restamp, fresh_project, mock_env  # noqa: E402
from loom.agents import router as RT  # noqa: E402
from loom.agents.budget import Budget  # noqa: E402
from loom.agents.conductor import Conductor  # noqa: E402
from loom.util import LoomError, read_json, which, write_json  # noqa: E402


def _copy_demo(p, subs=("plan", "audio", "scenes", "media")):
    for sub in subs:
        if (DEMO / sub).exists():
            shutil.rmtree(p.path(sub), ignore_errors=True)
            shutil.copytree(DEMO / sub, p.path(sub))
    cast_storyboard(p)
    write_json(p.path("state.json"), read_json(DEMO / "state.json"))
    restamp(p)


_KIT_SRC = """Loom.lesson = Loom.lesson || {};
/* a one-part test kit: a desk */
Loom.lesson.desk = function (ctx, parent, opts) {
  const g = Loom.svg("g", {}, parent);
  ctx.kit.rect(g, 0, 0, 300, 40, { fill: "surface", r: 6 });
  return { g };
};
"""


def _with_kit(p, beats=("b05",)):
    sb = read_json(p.path("plan/storyboard.json"))
    sb["kit"] = {"parts": [{"id": "desk", "what": "a desk", "states": ["empty"], "beats": list(beats), "size": [300, 40]}]}
    write_json(p.path("plan/storyboard.json"), sb)
    p.path("scenes/_kit.js").write_text(_KIT_SRC, encoding="utf-8")


# ------------------------------------------------------------------ 1. fill "none", and kit errors that name their part
_LAB_SCENE = """// @lab {"title": "kit part errors (test)", "styles": ["story-cartoon"], "dur": 2.0, "times": [1.0]}
Loom.lesson = Loom.lesson || {};
Loom.lesson.test_desk = function (ctx, parent, opts) {
  ctx.kit.path(parent, "M0 0 L100 0 L100 50 Z", { stroke: "ink", sw: 3, fill: "none" });
  Loom.style.c("not_a_token_in_part");
  return {};
};
Loom.scene("lab_kit_part_errors", {
  build(ctx) {
    const E = ctx.el("holder", { x: 100, y: 100, w: 400, h: 200, kind: "art" });
    Loom.lesson.test_desk(ctx, E.inner, {});
    Loom.style.c("not_a_token_in_scene");
  },
});
"""
_PROBE = r"""function (t) {
  const p = [...document.querySelectorAll("path")].find((x) => x.getAttribute("d") === "M0 0 L100 0 L100 50 Z");
  return { fill: p ? p.getAttribute("fill") : "missing" };
}"""


def agents_relayfix_none_is_no_fill_and_kit_part_errors_name_the_part():
    """`fill: "none"` on a kit path draws no fill and raises nothing (it raised unknown_token and painted the shape
    ink: 36 of the run's 70 final errors); an error raised inside a lesson kit part carries `part`, one raised by the
    scene itself does not. Control: both unknown tokens are reported."""
    from primitives_libraries import _browser, _NODE
    if not _browser():
        return "skipped (no browser here)"
    from loom import lab
    d = Path(tempfile.mkdtemp(prefix="kitpart_"))
    try:
        f = d / "lab_kit_part_errors.js"
        f.write_text(_LAB_SCENE, encoding="utf-8")
        tmp, *_ = lab.page("lab_kit_part_errors", "story-cartoon", times=[0.0], file=f)
        try:
            js = _NODE % {"engine": json.dumps(str(ROOT).replace("\\", "/")), "page": json.dumps(str(tmp / "lab.html").replace("\\", "/")),
                          "probe": _PROBE, "times": json.dumps([1.0])}
            r = subprocess.run(["node", "-e", js], capture_output=True, text=True, timeout=170, cwd=str(ROOT), env=dict(os.environ))
            assert r.returncode == 0, f"harness failed: {r.stderr[-800:]}"
            out = json.loads(r.stdout.strip().splitlines()[-1])
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
    finally:
        shutil.rmtree(d, ignore_errors=True)
    errs = out["report"]["errors"]
    assert out["samples"][0]["v"]["fill"] == "none", f"the path's fill: {out['samples'][0]['v']}"
    assert not [e for e in errs if "token none" in e.get("msg", "")], [e for e in errs if "none" in e.get("msg", "")]
    part = [e for e in errs if "not_a_token_in_part" in e.get("msg", "")]
    scene = [e for e in errs if "not_a_token_in_scene" in e.get("msg", "")]
    assert part and scene, f"both tokens must be reported (control): {errs}"
    assert part[0].get("part") == "test_desk", part[0]
    assert "part" not in scene[0], scene[0]
    return "fill none drew no fill and no error; the part's error names test_desk, the scene's own names none"


# ------------------------------------------------------------------ 2. the router's kit owner
def agents_relayfix_router_sends_kit_part_errors_and_kit_reports_to_the_kit():
    """A probe error with `part` (any code, tight_inset included) goes to the new owner `kit`, not to the scene worker
    or the engine list; a scene worker's report with fix_route "kit" goes there too. Controls: the same beat's own
    error still goes to its scene worker, and a template's tight_inset to the engine."""
    assert "kit" in RT.OWNERS, RT.OWNERS
    with fresh_project() as p:
        _copy_demo(p)
        _with_kit(p)
        write_json(p.path("qa/probe.json"), {"errors": [
            {"code": "unknown_token", "msg": "unknown colour token wood", "beat": "b05", "part": "desk"},
            {"code": "tight_inset", "msg": "text sits 0.0px from the edge of its rect (needs 7.6px): \"Effect\"", "beat": "b05", "part": "desk"},
            {"code": "scene_threw", "msg": "b05: Cannot read properties of undefined (reading 'x')", "beat": "b05"},
            {"code": "tight_inset", "msg": "text sits 6.0px from the edge of its shape (needs 7.6px): \"Pause\"", "beat": "b17"},
        ], "warnings": []})
        write_json(p.path("qa/report.json"), {"ok": False, "errors": [], "warnings": []})
        D = RT.route(p, reported=[{"fix_route": "kit", "beat": "b05", "what": "the desk has no 'open' state", "by": "scene"}])
        kit = [d["code"] for v in D["kit"].values() for d in v]
        assert sorted(kit) == ["reported", "tight_inset", "unknown_token"], D["kit"]
        assert [d["code"] for d in D["scene"].get("b05", [])] == ["scene_threw"], D["scene"]
        assert [d["code"] for d in D["engine"].get("b17", [])] == ["tight_inset"], D["engine"]
        msg = RT.fix_message("kit", [d for v in D["kit"].values() for d in v], "check")
        assert "submit_kit" in msg and "desk" in msg, msg
    return "part errors and kit reports go to the kit; the beat's own error to its worker; a template's inset to the engine"


def agents_relayfix_repair_gives_the_kit_its_defects():
    """Conductor.repair runs the kit worker with its own defects (the kit file in its task) and counts it as a fix;
    the kit's rounds are bounded like every owner's."""
    with fresh_project() as p:
        _copy_demo(p)
        _with_kit(p)
        write_json(p.path("qa/probe.json"), {"errors": [
            {"code": "unknown_token", "msg": "unknown colour token wood", "beat": "b05", "part": "desk"}], "warnings": []})
        write_json(p.path("qa/report.json"), {"ok": False, "errors": [], "warnings": []})
        fixed = _KIT_SRC.replace("a desk */", "a desk, wood fixed */")
        script = [{"match": {"tool_available": "submit_kit"}, "reply": {"tool": "submit_kit", "args": {"artifact": {"source": fixed, "api": "desk(ctx, parent, opts)"}}}}]
        with mock_env(script) as m:
            c = Conductor(p, "mock", Budget(2.0), require_snapshot=False, critic=False)
            r = c.repair("check")
            assert r == "fixed", r
            roles = [(t["role"], t.get("beat")) for t in c.results]
            assert roles == [("kit", None)], roles
            body = json.dumps([q["body"] for q in m.requests if q.get("body")])
            assert "unknown colour token wood" in body and "Loom.lesson.desk" in body, "the kit worker gets its defect and its file"
            assert "wood fixed" in p.path("scenes/_kit.js").read_text(encoding="utf-8")
            c.fixes[("kit", None)] = c.repair_rounds
            assert c.repair("check") == "failed", "the kit's rounds are bounded"
    return "the kit worker fixed its own defect; its rounds are bounded"


# ------------------------------------------------------------------ 3. an index prop must point inside its list
def agents_relayfix_props_index_must_point_inside_its_list():
    """quiz.answer counts options from 0; the run's storyboard wrote answer 3 for the third of three, so no option was
    ever marked and all dimmed. `index_of` in the schema: an index outside its list is refused with the 0-based rule;
    a nested one (hub signals.to) is checked against the root list. Control: answer 2 passes."""
    from loom.checks.gates import _props_errors
    cat = read_json(ROOT / "runtime/catalog.json")
    S = cat["templates"]["quiz.answer"]["props"]
    assert S["answer"].get("index_of") == "options" and S["tempting"].get("index_of") == "options", S["answer"]
    props = {"question": "Which one?", "options": [{"text": "a"}, {"text": "b"}, {"text": "c"}], "answer": 3, "say_answer": "three",
             "explanation": "Because.", "say_explanation": "because", "tempting": 0, "why_not": "Kind only.", "say_why_not": "kind"}
    errs = _props_errors(S, props)
    assert any("answer" in e and "0" in e and "3" in e for e in errs), errs
    ok = dict(props, answer=2)
    assert not _props_errors(S, ok), _props_errors(S, ok)
    hub = cat["blueprints"].get("diagram.hub_spoke") or next((v for v in cat["blueprints"].values() if "signals" in v.get("props", {})), None)
    assert hub and hub["props"]["signals"]["of"]["to"].get("index_of") == "satellites", "hub signals.to has no index_of"
    hp = {"hub": {"label": "Hub", "say": "hub"}, "satellites": [{"label": "A", "say": "a"}, {"label": "B", "say": "b"}],
          "signals": [{"to": 2, "say": "b"}]}
    assert any("signals[0].to" in e for e in _props_errors(hub["props"], hp)), _props_errors(hub["props"], hp)
    return "answer 3 of 3 refused (0-based), answer 2 passes; a nested signal index is checked against its list"


# ------------------------------------------------------------------ 4. a repair that ran nobody ends the run
def agents_relayfix_repair_that_ran_nobody_is_not_a_fix():
    """With every owner out of rounds, repair returns "failed" (the run then stops with exit 2 at once) instead of
    "fixed" (which re-ran the check three times with nothing changed, 16 minutes in R-35)."""
    with fresh_project() as p:
        _copy_demo(p)
        write_json(p.path("qa/probe.json"), {"errors": [
            {"code": "scene_threw", "msg": "b05: Cannot read properties of undefined (reading 'x')", "beat": "b05"}], "warnings": []})
        write_json(p.path("qa/report.json"), {"ok": False, "errors": [], "warnings": []})
        with mock_env([]) as m:
            c = Conductor(p, "mock", Budget(2.0), require_snapshot=False, critic=False)
            c.fixes[("scene", "b05")] = c.repair_rounds
            r = c.repair("check")
            assert r == "failed", r
            assert not c.results and not m.requests, "no model was called"
    return "every round used: repair says failed, calls nobody"


# ------------------------------------------------------------------ 5. claude_code costs from tokens, not the CLI total
def agents_relayfix_reconcile_prices_missing_tokens_not_the_cli_total():
    """The reconcile row is the tokens the CLI's modelUsage reports beyond the rows (minus what the session already
    accounted on an earlier run), priced from models.json. Cases: rows complete -> no row (the CLI's own dollar total,
    2x for an unknown model, is ignored); a resume whose modelUsage is cumulative -> no row; a message the stream
    missed -> one row with exactly its tokens."""
    from loom.agents import cc_runner as CC
    rows = {"input": 1830 + 1953, "cached": 1497, "cache_write": 1485, "output": 24}
    mu = {"claude-sonnet-5-5": {"inputTokens": 801, "outputTokens": 24, "cacheReadInputTokens": 1497, "cacheCreationInputTokens": 1485, "costUSD": 0.0114}}
    assert CC.missing_tokens(mu, {}, {"claude-sonnet-5-5": rows}) == {}, CC.missing_tokens(mu, {}, {"claude-sonnet-5-5": rows})
    prev = {"claude-sonnet-5-5": {"inputTokens": 801, "outputTokens": 24, "cacheReadInputTokens": 1497, "cacheCreationInputTokens": 1485}}
    mu2 = {"claude-sonnet-5-5": {"inputTokens": 1949, "outputTokens": 48, "cacheReadInputTokens": 4529, "cacheCreationInputTokens": 1485, "costUSD": 0.0171}}
    rows2 = {"input": 2028 + 2152, "cached": 1510 + 1522, "cache_write": 0, "output": 24}
    assert CC.missing_tokens(mu2, prev, {"claude-sonnet-5-5": rows2}) == {}, CC.missing_tokens(mu2, prev, {"claude-sonnet-5-5": rows2})
    mu3 = {"claude-sonnet-5-5": dict(mu["claude-sonnet-5-5"], inputTokens=801 + 50, outputTokens=24 + 300)}
    miss = CC.missing_tokens(mu3, {}, {"claude-sonnet-5-5": rows})
    assert miss == {"claude-sonnet-5-5": {"input": 50, "cached": 0, "cache_write": 0, "output": 300}}, miss
    return "complete rows add nothing, a cumulative resume adds nothing, a missed message adds exactly its tokens"


def _cli_mock():
    from relay_claude_code import cli_on_mock, _cc_steps
    return cli_on_mock, _cc_steps


def agents_relayfix_cc_resume_and_unknown_price_add_no_phantom_cost():
    """Through the real claude CLI on the mock: a first session and its resume log no reconcile row (before: $0.0056
    and $0.0139 of phantom cost, the CLI's estimate for a model it does not know, cumulative on the resume), and each
    task's cost equals its rows priced from models.json; the trace records the CLI's costBasis."""
    if not which("claude"):
        return "skipped (no claude CLI here)"
    from loom.agents import tools as T
    from loom.agents.runtime import AgentSpec, run_agent, load_session
    cli_on_mock, _cc_steps = _cli_mock()
    marker = (T.ROLES / "persona_pick.md").read_text(encoding="utf-8").splitlines()[0][:40]
    steps = _cc_steps(marker, "submit_persona_pick", {"pick": "mentor", "why": "first answer"})
    steps += [{"name": "fix submit", "match": {"system_contains": marker, "user_contains": "DEFECT-9"},
               "reply": {"tool": "mcp__relay__submit_persona_pick", "args": {"artifact": {"pick": "analyst", "why": "fixed DEFECT-9"}}}},
              {"name": "fix done", "match": {"system_contains": marker, "last_tool_result_contains": "accepted"}, "reply": {"text": "Fixed."}}]
    with fresh_project() as p, cli_on_mock(steps):
        sp = p.path("logs/sessions/persona_pick.json")
        a = run_agent(AgentSpec("persona_pick", "cc-sonnet"), T.ToolContext(project=p, role="persona_pick", stage="persona"),
                      "Pick the persona.", Budget(1.0), session_path=sp)
        b = run_agent(AgentSpec("persona_pick", "cc-sonnet"), T.ToolContext(project=p, role="persona_pick", stage="persona"),
                      "Fix only this: DEFECT-9", Budget(1.0), resume=load_session(sp), session_path=sp)
        assert a.status == b.status == "accepted", (a.status, b.status)
        rows = [json.loads(l) for l in p.path("logs/llm_calls.jsonl").read_text(encoding="utf-8").splitlines()]
        rec = [r for r in rows if r.get("reconcile")]
        assert not rec, f"phantom reconcile rows: {[(r['task'], r['usd']) for r in rec]}"
        for res in (a, b):
            mine = round(sum(r["usd"] for r in rows if r["task"] == res.task_id), 6)
            assert abs(mine - res.cost_usd) < 1e-5, (res.task_id, mine, res.cost_usd)   # each row is rounded to 6 places
        results = [json.loads(l) for l in Path(b.trace).read_text(encoding="utf-8").splitlines() if '"event": "result"' in l]
        assert results and "cost_basis" in results[-1], results[-1:]
    return f"no reconcile rows; costs {a.cost_usd:.6f} and {b.cost_usd:.6f} are the rows; costBasis traced"


def agents_relayfix_cc_stops_a_task_served_by_another_model():
    """A claude_code task whose first message comes from another model than its alias's id is stopped with
    `served_model_mismatch` (the `sonnet` alias served claude-sonnet-5 for a profile that named and priced Sonnet
    5.5). Control: the same task answered as the alias's own model is accepted."""
    if not which("claude"):
        return "skipped (no claude CLI here)"
    from loom.agents import tools as T
    from loom.agents.runtime import AgentSpec, run_agent
    cli_on_mock, _cc_steps = _cli_mock()
    marker = (T.ROLES / "persona_pick.md").read_text(encoding="utf-8").splitlines()[0][:40]
    bad = [dict(s, reply=dict(s["reply"], model="claude-sonnet-5")) for s in _cc_steps(marker, "submit_persona_pick", {"pick": "mentor", "why": "x"})]
    with fresh_project() as p, cli_on_mock(bad):
        r = run_agent(AgentSpec("persona_pick", "cc-sonnet"), T.ToolContext(project=p, role="persona_pick", stage="persona"),
                      "Pick the persona.", Budget(1.0))
        assert r.status != "accepted" and "served_model_mismatch" in (r.note or "") + json.dumps(r.errors), (r.status, r.note, r.errors)
    good = _cc_steps(marker, "submit_persona_pick", {"pick": "mentor", "why": "x"})
    with fresh_project() as p, cli_on_mock(good):
        r = run_agent(AgentSpec("persona_pick", "cc-sonnet"), T.ToolContext(project=p, role="persona_pick", stage="persona"),
                      "Pick the persona.", Budget(1.0))
        assert r.status == "accepted", (r.status, r.note)
    return "served by claude-sonnet-5 for cc-sonnet: stopped; served by claude-sonnet-5-5: accepted"


# ------------------------------------------------------------------ 6. isolated lessons
def agents_relayfix_isolated_lessons_neither_read_nor_are_read_by_the_seed():
    """`loom new --isolated` (project.json isolated): its design seed reads no other lesson, and no other lesson's
    seed reads it (R-35's seed read the Shuttle film of the comparison). Control: a normal lesson reads its sibling."""
    from loom import seed as SD
    root = Path(tempfile.mkdtemp(prefix="iso_"))
    try:
        def mk(name, created, isolated=False):
            d = root / name
            (d / "plan").mkdir(parents=True)
            write_json(d / "project.json", {"id": name, "created": created, **({"isolated": True} if isolated else {})})
            write_json(d / "plan" / "storyboard.json", {"scenes": []})
            return d
        a = mk("a-normal", "2026-10-08T10:00:00")
        b = mk("b-isolated", "2026-10-08T11:00:00", isolated=True)
        c = mk("c-normal", "2026-10-08T12:00:00")
        assert [n for n, _ in SD.recent_seeds(b)] == [], SD.recent_seeds(b)
        seen_by_c = [n for n, _ in SD.recent_seeds(c)]
        assert seen_by_c == ["a-normal"], seen_by_c
    finally:
        shutil.rmtree(root, ignore_errors=True)
    from loom import cli
    src = Path(cli.__file__).read_text(encoding="utf-8")
    assert "--isolated" in src, "loom new has no --isolated"
    return "isolated: reads none, read by none; a normal lesson reads its sibling"


# ------------------------------------------------------------------ 7. the critic looks again, and minors are routed
def agents_relayfix_critic_looks_again_after_its_fixes_and_minors_are_routed():
    """The picture critic gets a second (last) pass after its first findings were sent out, so the fixes are judged;
    a pass that finds nothing ends the reviews. Every finding goes to its owner, minors included (D-143)."""
    with fresh_project() as p:
        _copy_demo(p)
        write_json(p.path("qa/probe.json"), {"errors": [], "warnings": []})
        write_json(p.path("qa/report.json"), {"ok": True, "errors": [], "warnings": []})
        D = RT.route(p, critic=[{"severity": "minor", "beat": "b05", "problem": "a connector clips a card", "fix": "reroute it"}])
        assert [d["code"] for d in D["scene"].get("b05", [])] == ["critic"], D
        with mock_env([]):
            c = Conductor(p, "mock", Budget(2.0), require_snapshot=False)
            assert c.critic_due()
            c.critic_seen([{"severity": "major", "beat": "b05"}])
            assert c.critic_due(), "a second pass judges the fixes"
            c.critic_seen([{"severity": "minor", "beat": "b05"}])
            assert not c.critic_due(), "two passes at most"
            c2 = Conductor(p, "mock", Budget(2.0), require_snapshot=False)
            c2.critic_seen([])
            assert not c2.critic_due(), "nothing found: no second pass"
    return "minor routed to b05's worker; a second pass after findings, none after a clean pass, never a third"


# ------------------------------------------------------------------ 8. a text overlap is an error only when it is seen
_PAINT_PAGE = """<!doctype html><html><body style="margin:0"><svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080">
<g><text id="a" x="100" y="200" font-size="40">Two texts that collide</text><text id="b" x="110" y="205" font-size="40">Another line here</text></g>
<g><text id="c" x="100" y="500" font-size="40">The old beat line</text><rect x="50" y="440" width="900" height="100" fill="#ffffff"/>
   <text id="d" x="120" y="505" font-size="40">The new beat line</text></g>
<g><text id="e" x="100" y="800" font-size="40">Seen through glass</text><rect x="50" y="740" width="900" height="100" fill="#ffffff" opacity="0.5"/>
   <text id="f" x="120" y="805" font-size="40">Over the glass</text></g>
</svg><script>window.__loom_ready = true;</script></body></html>"""


def agents_relayfix_a_text_overlap_is_an_error_only_when_both_texts_are_seen():
    """HyperFrames compares text boxes; an outgoing beat's text under the next beat's opaque world read as two colliding
    texts and stopped feedback-relay-v2 with exit 2 (b09/b10, L-335). The check now asks what is painted on top: two texts
    in the open collide (real); a text under an opaque later shape is not seen (warning); under a half-transparent one it
    still is (real)."""
    from primitives_libraries import _browser
    if not _browser():
        return "skipped (no browser here)"
    from loom import qa

    class P:
        def __init__(self, root):
            self.root = root

        def path(self, rel):
            return self.root / rel
    d = Path(tempfile.mkdtemp(prefix="paint_"))
    try:
        (d / "build").mkdir()
        (d / "build" / "index.html").write_text(_PAINT_PAGE, encoding="utf-8")
        F = [{"time": 0, "selector": "#a", "containerSelector": "#b"}, {"time": 0, "selector": "#c", "containerSelector": "#d"},
             {"time": 0, "selector": "#e", "containerSelector": "#f"}]
        v = qa.painted_overlaps(P(d), F)
    finally:
        shutil.rmtree(d, ignore_errors=True)
    real = [v[id(f)]["real"] for f in F]
    assert real == [True, False, True], [v[id(f)] for f in F]
    return "open collision: real; under an opaque shape: not seen; under glass: real"


def agents_relayfix_a_bespoke_scenes_own_inset_goes_to_its_author():
    """A tight inset or a contrast failure inside a bespoke beat, raised by the scene's own drawing (no kit part), goes to
    that beat's worker; in a template beat it stays the engine's (the template's own padding). feedback-relay-v2's b10
    label at 5.1 px was sent "to a person" and would have stopped the run (L-336)."""
    with fresh_project() as p:
        _copy_demo(p)
        kinds = {s["beat"]: s["kind"] for s in read_json(p.path("plan/storyboard.json"))["scenes"]}
        tb = next(b for b, k in kinds.items() if k in ("template", "blueprint"))
        assert kinds.get("b05") == "bespoke", kinds.get("b05")
        write_json(p.path("qa/probe.json"), {"errors": [
            {"code": "tight_inset", "msg": "text sits 5.1px from the edge of its rect (needs 7.6px): \"One small step\"", "beat": "b05"},
            {"code": "contrast_aa_failure", "msg": "text contrast 2.1:1 on its card", "beat": "b05"},
            {"code": "tight_inset", "msg": "text sits 6.0px from the edge of its shape (needs 7.6px): \"Pause\"", "beat": tb},
        ], "warnings": []})
        write_json(p.path("qa/report.json"), {"ok": False, "errors": [], "warnings": []})
        D = RT.route(p)
        assert sorted(d["code"] for d in D["scene"].get("b05", [])) == ["contrast_aa_failure", "tight_inset"], D["scene"]
        assert [d["code"] for d in D["engine"].get(tb, [])] == ["tight_inset"], D["engine"]
    return f"b05's own inset and contrast to its worker; the template beat {tb}'s inset to the engine"


def agents_relayfix_quiz_options_carry_no_letter_of_their_own():
    """The quiz templates draw each option's letter (A to D); feedback-relay-v2's storyboard wrote "A: Be more organised"
    and the frame showed the letter twice (b13, L-337). The props gate refuses a leading "A:", "B." or "C)". Controls:
    the words alone pass, and so does an option that merely starts with the word "A"."""
    from loom.checks.gates import _props_errors
    S = read_json(ROOT / "runtime/catalog.json")["templates"]["quiz.question"]["props"]
    base = {"kicker": "Now you", "question": "Which comment?", "say_question": "which",
            "options": [{"text": "A: Be more organised", "say": "a"}, {"text": "B) Send it the day before", "say": "b"}]}
    errs = _props_errors(S, base)
    assert len([e for e in errs if "starts with a letter" in e]) == 2, errs
    ok = json.loads(json.dumps(base))
    ok["options"] = [{"text": "Be more organised", "say": "a"}, {"text": "A plan for the day", "say": "b"}]
    assert not _props_errors(S, ok), _props_errors(S, ok)
    return "\"A:\" and \"B)\" refused; plain words and \"A plan...\" pass"


def agents_relayfix_a_quiz_answer_repeats_its_questions_options():
    """quiz.answer brings the question's options back; feedback-relay-v2's b14 showed other options than b13 asked
    (L-338). The storyboard gate refuses an answer whose options are not the preceding question's, word for word. Control:
    the demo's matching pair passes."""
    from loom.checks.gates import check_storyboard
    with fresh_project() as p:
        _copy_demo(p)
        E, _ = check_storyboard(p)
        assert not [e for e in E if "quiz.answer options" in e], [e for e in E if "quiz" in e]
        sb = read_json(p.path("plan/storyboard.json"))
        ans = next(s for s in sb["scenes"] if s.get("template") == "quiz.answer")
        ans["props"]["options"][1]["text"] = "Three short self-tests on Friday"
        write_json(p.path("plan/storyboard.json"), sb)
        E, _ = check_storyboard(p)
        bad = [e for e in E if "quiz.answer options" in e]
        assert bad and ans["beat"] in bad[0], [e for e in E if "quiz" in e]
    return "matching pair passes; an answer with other option words is refused"


def agents_relayfix_a_scene_only_fix_makes_the_check_stale():
    """Compose's output is the whole build, not index.html: a fix to one scene changes build/scenes/<beat>.js and leaves
    index.html as it was, and the check stayed "done", so the picture critic judged sheets from before the fix
    (feedback-relay-v2, L-339). Control: a new snapshot (an output, not an input) does not make the check stale."""
    from loom import flow
    with fresh_project() as p:
        b = p.path("build")
        (b / "scenes").mkdir(parents=True, exist_ok=True)
        (b / "index.html").write_text("<html>lesson</html>", encoding="utf-8")
        (b / "scenes" / "b05.js").write_text("Loom.scene('b05', {build(){}});", encoding="utf-8")
        p.path("qa").mkdir(exist_ok=True)
        write_json(p.path("qa/report.json"), {"ok": True, "errors": [], "warnings": []})
        flow.mark_done(p, "compose", passed=True)
        flow.mark_done(p, "check", passed=True)
        st = lambda: {r["stage"]: r["status"] for r in flow.status(p)}["check"]
        assert st() == "done", st()
        (b / "snapshots").mkdir(exist_ok=True)
        (b / "snapshots" / "frame-1-at-2.00s.png").write_bytes(b"png")
        assert st() == "done", "a snapshot made the check stale"
        (b / "scenes" / "b05.js").write_text("Loom.scene('b05', {build(){ /* fixed */ }});", encoding="utf-8")
        assert st() == "stale", st()
    return "a scene file change makes the check stale; a snapshot does not"


# ------------------------------------------------------------------ L-346: the robustness pass
def _fake_critic(c, replies):
    """Replace the critic's model call: each call takes the next reply's findings and records what it was shown."""
    from types import SimpleNamespace
    calls = []

    def run_role(role, stage, extra=None, images=None, **kw):
        calls.append({"role": role, "extra": dict(extra or {}), "images": [Path(i).stem for i in images or []]})
        return SimpleNamespace(status="accepted", value={"findings": replies[len(calls) - 1]})
    c.run_role = run_role
    return calls


def _sheets(p, beats):
    p.path("qa/sheets").mkdir(parents=True, exist_ok=True)
    for b in beats:
        p.path(f"qa/sheets/{b}.jpg").write_bytes(b"jpg")


def agents_relayfix_a_later_critic_pass_sees_only_what_changed():
    """The critic's first pass sees every beat; a later pass sees only the beats that changed since, with the earlier
    findings on them to re-check (the critic's later-pass mode); with nothing changed there is no call (R-36's second
    passes judged every sheet again and each found a new set, L-346)."""
    with fresh_project() as p:
        _copy_demo(p)
        sb = read_json(p.path("plan/storyboard.json"))
        beats = [s["beat"] for s in sb["scenes"]]
        _sheets(p, beats)
        with mock_env([]):
            c = Conductor(p, "mock", Budget(2.0), require_snapshot=False)
            calls = _fake_critic(c, [[{"severity": "major", "beat": "b05", "problem": "crowded", "fix": "less"}], []])
            c.critic_findings()
            assert sorted(calls[0]["images"]) == sorted(beats) and "earlier" not in calls[0]["extra"], calls[0]["extra"]
            f = p.path("scenes/b05.js")
            f.write_text(f.read_text(encoding="utf-8") + "\n// fixed\n", encoding="utf-8")
            c.critic_findings()
            assert calls[1]["images"] == ["b05"], calls[1]["images"]
            assert calls[1]["extra"].get("later_pass") and [e["beat"] for e in calls[1]["extra"]["earlier"]] == ["b05"], calls[1]["extra"]
            c2 = Conductor(p, "mock", Budget(2.0), require_snapshot=False)
            calls2 = _fake_critic(c2, [[{"severity": "minor", "beat": "b10", "problem": "x", "fix": "y"}]])
            c2.critic_findings()
            n = len(calls2)
            c2.critic_findings()
            assert len(calls2) == n, "a later pass with nothing changed called the critic"
    return "pass 1 saw every beat; pass 2 only b05 with its earlier finding; nothing changed: no call"


def agents_relayfix_the_last_fixes_get_a_final_look_and_a_blocker_stops_the_render():
    """After the routed passes are used up, beats changed by the last fixes get a verify-only look before the render:
    a blocker stops it, a major or minor is written to qa/review_final.json and named (R-36's last fixes shipped unseen,
    L-346). Controls: nothing changed means no final look; a clean final look renders."""
    import contextlib
    import io
    with fresh_project() as p:
        _copy_demo(p)
        sb = read_json(p.path("plan/storyboard.json"))
        _sheets(p, [s["beat"] for s in sb["scenes"]])
        with mock_env([]):
            for reply, want in (([{"severity": "blocker", "beat": "b10", "problem": "head cut", "fix": "x"}], "failed"),
                                ([{"severity": "major", "beat": "b10", "problem": "crowded", "fix": "x"}], "ok"),
                                ([], "ok")):
                c = Conductor(p, "mock", Budget(2.0), require_snapshot=False)
                c.critic_passes = c.CRITIC_PASSES
                c.critic_sigs = c.beat_sigs()
                c.critic_last = [{"severity": "major", "beat": "b10", "problem": "crowded", "fix": "x"}]
                assert not c.final_review_due(), "nothing changed, yet a final look was due"
                f = p.path("scenes/b10.js")
                f.write_text(f.read_text(encoding="utf-8") + f"\n// fix {want} {len(reply)}\n", encoding="utf-8")
                assert c.final_review_due()
                calls = _fake_critic(c, [reply])
                buf = io.StringIO()
                with contextlib.redirect_stdout(buf), contextlib.redirect_stderr(buf):
                    r = c.final_review()
                assert r == want, (reply, r)
                assert calls[0]["images"] == ["b10"] and calls[0]["extra"].get("earlier"), calls[0]
                assert read_json(p.path("qa/review_final.json"))["findings"] == reply
                assert not c.final_review_due(), "a second final look"
    return "blocker: no render; major: render, written down; clean: render; nothing changed: no look"


def agents_relayfix_the_run_loop_stops_before_the_render_on_a_final_blocker():
    """The test above calls final_review() itself, so removing its one call in the run loop left everything green
    (mutation check, 2026-10-09). Here the loop runs: after a done check with the final look due, a blocker returns 2
    and the render stage never runs; a clean look runs the render. Control: with no final look due the render runs."""
    import contextlib
    import io
    from loom.agents import conductor as CD
    from loom.flow import active
    with fresh_project() as p:
        _copy_demo(p)
        order = [s for s in active(p) if not s.optional]
        names = [s.name for s in order]
        assert "check" in names and "render" in names, names
        real_status, real_run = CD.flow.status, CD.flow.run_code
        ran = []
        CD.flow.status = lambda project: [{"stage": n, "kind": s.kind, "status": "pending" if n == "render" else "done"}
                                          for n, s in ((s.name, s) for s in order)]
        CD.flow.run_code = lambda project, name, **kw: ran.append(name)
        try:
            out = {}
            for case, due, verdict in (("blocker", True, "failed"), ("clean", True, "ok"), ("no look due", False, None)):
                ran.clear()
                c = Conductor(p, "mock", Budget(2.0), require_snapshot=False)
                looked = []
                c.critic_due = lambda: False
                c.final_review_due = lambda due=due: due and not looked
                c.final_review = lambda verdict=verdict: looked.append(1) or verdict
                buf = io.StringIO()
                with contextlib.redirect_stdout(buf), contextlib.redirect_stderr(buf):
                    code = c._pass(order, "render")
                out[case] = (code, list(ran), len(looked))
        finally:
            CD.flow.status, CD.flow.run_code = real_status, real_run
        assert out["blocker"][0] == 2 and "render" not in out["blocker"][1] and out["blocker"][2] == 1, out
        assert out["clean"][0] == 0 and out["clean"][1] == ["render"] and out["clean"][2] == 1, out
        assert out["no look due"][0] == 0 and out["no look due"][1] == ["render"] and out["no look due"][2] == 0, out
    return "blocker: exit 2, no render; clean look: render; no look due: render without one"


def agents_relayfix_a_scene_helper_on_loom_lesson_stays_the_scenes():
    """Only parts scenes/_kit.js defines go to the kit's author; a helper a bespoke scene hung on Loom.lesson itself is
    that scene's (L-346). Control: the kit's own part still goes to the kit."""
    with fresh_project() as p:
        _copy_demo(p)
        _with_kit(p)
        write_json(p.path("qa/probe.json"), {"errors": [
            {"code": "unknown_token", "msg": "unknown colour token wood", "beat": "b05", "part": "desk"},
            {"code": "unknown_token", "msg": "unknown colour token sand", "beat": "b05", "part": "my_own_helper"},
        ], "warnings": []})
        write_json(p.path("qa/report.json"), {"ok": False, "errors": [], "warnings": []})
        D = RT.route(p)
        assert [d["detail"][:9] for d in D["kit"].get("b05", [])] == ["part desk"], D["kit"]
        assert [d["code"] for d in D["scene"].get("b05", [])] == ["unknown_token"], D["scene"]
    return "the kit's part to the kit, the scene's own helper to the scene"


def agents_relayfix_served_model_ids_and_old_sessions():
    """A dated snapshot of the alias's model is the same model; another model is not (in both directions). A resumed
    session saved before its usage was recorded adds no reconcile row (its cumulative totals cannot be split, L-346)."""
    from loom.agents.cc_runner import same_model
    assert same_model("claude-sonnet-5-5", "claude-sonnet-5-5") and same_model("claude-sonnet-5-5-20261001", "claude-sonnet-5-5")
    assert not same_model("claude-sonnet-5", "claude-sonnet-5-5") and not same_model("claude-sonnet-5-5", "claude-sonnet-5")
    assert not same_model("claude-opus-5-5", "claude-sonnet-5-5")
    if not which("claude"):
        return "ids checked; skipped the old-session case (no claude CLI here)"
    from loom.agents import tools as T
    from loom.agents.runtime import AgentSpec, run_agent, load_session
    cli_on_mock, _cc_steps = _cli_mock()
    marker = (T.ROLES / "persona_pick.md").read_text(encoding="utf-8").splitlines()[0][:40]
    steps = _cc_steps(marker, "submit_persona_pick", {"pick": "mentor", "why": "first"})
    steps += [{"name": "fix", "match": {"system_contains": marker, "user_contains": "DEFECT-11"},
               "reply": {"tool": "mcp__relay__submit_persona_pick", "args": {"artifact": {"pick": "analyst", "why": "fixed"}}}},
              {"name": "done", "match": {"system_contains": marker, "last_tool_result_contains": "accepted"}, "reply": {"text": "Fixed."}}]
    with fresh_project() as p, cli_on_mock(steps):
        sp = p.path("logs/sessions/persona_pick.json")
        run_agent(AgentSpec("persona_pick", "cc-sonnet"), T.ToolContext(project=p, role="persona_pick", stage="persona"),
                  "Pick the persona.", Budget(1.0), session_path=sp)
        old = load_session(sp)
        old.pop("cc_model_usage", None)
        old.pop("cc_cli_usd", None)             # as a session saved before L-327's fix
        b = run_agent(AgentSpec("persona_pick", "cc-sonnet"), T.ToolContext(project=p, role="persona_pick", stage="persona"),
                      "Fix only this: DEFECT-11", Budget(1.0), resume=old, session_path=sp)
        assert b.status == "accepted", b.status
        rows = [json.loads(x) for x in p.path("logs/llm_calls.jsonl").read_text(encoding="utf-8").splitlines()]
        rec = [r for r in rows if r.get("reconcile")]
        assert not rec, f"an old session was counted again: {rec}"
        assert "cc_model_usage" in read_json(sp), "the session now records its usage"
    return "dated ids accepted, other models refused; an old session resumed with no reconcile row"


def agents_relayfix_option_letter_forms_and_spacing():
    """Every common letter prefix is refused ("A:", "B.", "C)", "(D)", "A -", "Option A:"), words that merely start with
    the letter are not ("A plan", "Ask first", "B2B", "A.I."), and a quiz pair that differs only in spacing passes."""
    from loom.checks.gates import OPTION_LETTER, check_storyboard
    bad = ["A: Be organised", "B. Send it", "C) Prepare", "(D) Wait", "A - Plan", "Option A: Plan", "a: lower"]
    good = ["A plan for the day", "Ask first", "B2B sales", "A.I. tools help", "Be more organised"]
    assert all(OPTION_LETTER.match(t) for t in bad), [t for t in bad if not OPTION_LETTER.match(t)]
    assert not any(OPTION_LETTER.match(t) for t in good), [t for t in good if OPTION_LETTER.match(t)]
    with fresh_project() as p:
        _copy_demo(p)
        sb = read_json(p.path("plan/storyboard.json"))
        ans = next(s for s in sb["scenes"] if s.get("template") == "quiz.answer")
        ans["props"]["options"][0]["text"] = "  " + ans["props"]["options"][0]["text"].replace(" ", "  ")
        write_json(p.path("plan/storyboard.json"), sb)
        E, _ = check_storyboard(p)
        assert not [e for e in E if "quiz.answer options" in e], [e for e in E if "quiz" in e]
    return "7 prefix forms refused, 5 plain starts allowed; spacing alone does not break a quiz pair"


def agents_relayfix_the_build_hash_rereads_only_a_changed_build():
    """flow.status asks for the build hash on every listing: an unchanged build answers from its file signature, a
    changed file (even the same size) is read again; snapshots never count (L-346)."""
    from loom.qa import build_hash
    d = Path(tempfile.mkdtemp(prefix="bh_"))
    try:
        (d / "scenes").mkdir()
        (d / "index.html").write_text("<html>a</html>", encoding="utf-8")
        f = d / "scenes" / "b01.js"
        f.write_text("aaaa", encoding="utf-8")
        h1 = build_hash(d)
        assert build_hash(d) == h1
        st = f.stat()
        f.write_text("bbbb", encoding="utf-8")
        os.utime(f, ns=(st.st_atime_ns, st.st_mtime_ns + 1_000_000))
        assert build_hash(d) != h1, "a same-size edit was missed"
        (d / "snapshots").mkdir()
        (d / "snapshots" / "x.png").write_bytes(b"p")
        h2 = build_hash(d)
        (d / "snapshots" / "y.png").write_bytes(b"q")
        assert build_hash(d) == h2, "a snapshot changed the hash"
    finally:
        shutil.rmtree(d, ignore_errors=True)
    return "unchanged: same hash; a same-size edit: new hash; snapshots: ignored"


def agents_relayfix_the_build_hash_is_the_same_on_every_os():
    """A lesson made on Windows read 'check stale' on Linux with its build untouched: the hash took the OS's own path
    text and order. The hash is now a fixed spec (backslash-joined parts, ordered by case-folded parts, the form Windows
    always wrote), computed here independently on a tree whose names sort differently by case and by separator. A
    golden value pins it, so this test gives the same answer on Windows, Linux and macOS. Control: the two forms the
    old code produced on each OS are not that value."""
    import hashlib
    from loom.qa import build_hash, _BUILD_HASHES
    d = Path(tempfile.mkdtemp(prefix="bhos_"))
    try:
        for rel, body in (("index.html", "p"), ("Runtime/b.js", "1"), ("runtime.js", "2"), ("runtime-x/a.js", "3"),
                          ("scenes/B02.js", "4"), ("scenes/a01.js", "5")):
            f = d.joinpath(*rel.split("/"))
            f.parent.mkdir(parents=True, exist_ok=True)
            f.write_bytes(body.encode())
        files = [f for f in d.rglob("*") if f.is_file()]

        def spec(key, order):
            h = hashlib.sha256()
            for f in sorted(files, key=order):
                h.update(key(f).encode()); h.update(f.read_bytes())
            return h.hexdigest()[:16]
        parts = lambda f: f.relative_to(d).parts
        want = spec(lambda f: "\\".join(parts(f)), lambda f: [p.lower() for p in parts(f)])
        _BUILD_HASHES.clear()
        got = build_hash(d)
        assert got == want, f"the build hash is not the portable spec: {got} != {want}"
        assert want == "cb19545e4f874df3", f"the spec itself moved: {want} (every recorded lesson hash would go stale)"
        old_posix = spec(lambda f: "/".join(parts(f)), lambda f: list(parts(f)))
        old_win_text_posix_order = spec(lambda f: "\\".join(parts(f)), lambda f: list(parts(f)))
        assert old_posix != want and old_win_text_posix_order != want, "control: the old forms equal the spec, so this cannot fail"
    finally:
        shutil.rmtree(d, ignore_errors=True)
    return f"build hash {got}, the same spec on every OS; the old Linux forms differ ({old_posix}, {old_win_text_posix_order})"


_LAB_NONE = """// @lab {"title": "no colour in the colour maths (test)", "styles": ["story-cartoon"], "dur": 2.0, "times": [1.0]}
Loom.lesson = Loom.lesson || {};
function deskPart(ctx, parent, opts) {
  ctx.kit.rect(parent, 0, 0, 200, 60, { fill: "none", stroke: "ink", r: 8 });
  return {};
}
deskPart.states = ["empty", "full"];
Loom.lesson.test_desk = deskPart;
Loom.scene("lab_none_maths", {
  build(ctx) {
    window.__none = {
      mix: Loom.style.mix("none", "#000000", 0.5),
      shade: Loom.style.shade("none"),
      contrast: Loom.style.contrast("none", "#000000"),
      on: Loom.style.on("none"),
      states: (Loom.lesson.test_desk.states || []).join(","),
      wrapped: !!Loom.lesson.test_desk.__loomPart,
    };
    const E = ctx.el("holder", { x: 100, y: 100, w: 400, h: 200, kind: "art" });
    Loom.lesson.test_desk(ctx, E.inner, {});
  },
});
"""
_PROBE_NONE = r"""function (t) {
  const nan = [...document.querySelectorAll("svg *")].some((e) => [...e.attributes].some((a) => /NaN/.test(a.value)));
  return Object.assign({ nan }, window.__none);
}"""


def agents_relayfix_no_colour_survives_the_colour_maths_and_parts_keep_their_properties():
    """"none" is no colour all the way through: a mix or shade of it stays none, a contrast against it is judged on the
    field, and nothing in the page reads NaN; a kit part keeps what was hung on its function through the runtime's
    wrapper (L-346). Before, the maths read "none" as #NaNNaNNaN."""
    from primitives_libraries import _browser, _NODE
    if not _browser():
        return "skipped (no browser here)"
    from loom import lab
    d = Path(tempfile.mkdtemp(prefix="nonemath_"))
    try:
        f = d / "lab_none_maths.js"
        f.write_text(_LAB_NONE, encoding="utf-8")
        tmp, *_ = lab.page("lab_none_maths", "story-cartoon", times=[0.0], file=f)
        try:
            js = _NODE % {"engine": json.dumps(str(ROOT).replace("\\", "/")), "page": json.dumps(str(tmp / "lab.html").replace("\\", "/")),
                          "probe": _PROBE_NONE, "times": json.dumps([1.0])}
            r = subprocess.run(["node", "-e", js], capture_output=True, text=True, timeout=170, cwd=str(ROOT), env=dict(os.environ))
            assert r.returncode == 0, f"harness failed: {r.stderr[-800:]}"
            out = json.loads(r.stdout.strip().splitlines()[-1])
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
    finally:
        shutil.rmtree(d, ignore_errors=True)
    v = out["samples"][0]["v"]
    assert not out["report"]["errors"], out["report"]["errors"][:3]
    assert v["mix"] == "none" and v["shade"] == "none", v
    assert isinstance(v["contrast"], (int, float)) and v["contrast"] > 1, v
    assert isinstance(v["on"], str) and "NaN" not in v["on"], v
    assert v["nan"] is False, "an attribute in the page reads NaN"
    assert v["states"] == "empty,full" and v["wrapped"] is True, v
    return f"mix and shade of none stay none; contrast {v['contrast']:.1f}; no NaN in the page; the part kept its states"


_LAB_CARD = """// @lab {"title": "presenter card fit (test)", "styles": ["story-cartoon"], "dur": 4.0, "times": [3.5]}
Loom.scene("lab_presenter_card_%(tag)s", {
  build(ctx) {
    Loom.presenter.scene(ctx, { title: "Three parts", kicker: "Before you say it",
      card: { lines: %(lines)s } });
  },
});
"""
_PROBE_CARD = r"""function (t) {
  const card = document.querySelector('g.lm-el[data-name="presenter_card"]');
  const rowEl = document.querySelector('g.lm-el[data-name="presenter_card_1"]');
  const row = rowEl && rowEl.querySelector("text");
  return { w: card ? +card.getAttribute("data-w") : null, inset: card && row ? Math.round(row.getBoundingClientRect().left - card.getBoundingClientRect().left) : null,
           size: row ? parseFloat(row.getAttribute("font-size") || getComputedStyle(row).fontSize) : null };
}"""


def _card_probe(tag, lines):
    from primitives_libraries import _NODE
    from loom import lab
    d = Path(tempfile.mkdtemp(prefix="card_"))
    try:
        f = d / f"lab_presenter_card_{tag}.js"
        f.write_text(_LAB_CARD % {"tag": tag, "lines": json.dumps(lines)}, encoding="utf-8")
        tmp, *_ = lab.page(f"lab_presenter_card_{tag}", "story-cartoon", times=[0.0], file=f)
        try:
            js = _NODE % {"engine": json.dumps(str(ROOT).replace("\\", "/")), "page": json.dumps(str(tmp / "lab.html").replace("\\", "/")),
                          "probe": _PROBE_CARD, "times": json.dumps([3.5])}
            r = subprocess.run(["node", "-e", js], capture_output=True, text=True, timeout=170, cwd=str(ROOT), env=dict(os.environ))
            assert r.returncode == 0, f"harness failed: {r.stderr[-800:]}"
            out = json.loads(r.stdout.strip().splitlines()[-1])
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
    finally:
        shutil.rmtree(d, ignore_errors=True)
    assert not out["report"]["errors"], out["report"]["errors"][:3]
    return out["samples"][0]["v"]


def agents_relayfix_a_presenter_card_fits_short_lines():
    """An avatar card of short lines (three two-word lines) sets them at the lead size and centres their block in the
    card, so they no longer sit on the left of a 1200 px card with the rest empty (feedback-relay-v2 b18, two storyboard
    fixes could not change it, L-347). The card keeps its width. Control: long lines keep the body size and the left
    edge (40 px), as before."""
    from primitives_libraries import _browser
    if not _browser():
        return "skipped (no browser here)"
    short = _card_probe("short", ["What happened", "What it caused", "One step"])
    long = _card_probe("long", ["Say what you saw them do, in the words of the room",
                                "Say what it caused for the people who were there",
                                "Offer one small step they could take next time"])
    assert short["w"] and short["w"] == long["w"], (short, long)
    assert short["size"] and long["size"] and short["size"] > long["size"], (short, long)
    assert long["inset"] < 120 and short["inset"] > long["inset"] + 150, (short, long)   # text box left edge in the card
    return (f"card {short['w']:.0f} px both; short lines {short['size']:.0f} px type, inset {short['inset']:.0f} px; "
            f"long lines {long['size']:.0f} px, inset {long['inset']:.0f} px")
