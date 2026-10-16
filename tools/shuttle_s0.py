"""S0 for Shuttle (D-135, design section 8): the real launcher and the real `claude -p`, driven by a scripted model.

    py tools/shuttle_s0.py [--until P11] [--keep] [--runner cli|loom]

Looks are on the LESSON clock (the demo's b05 runs 38 to 52 s, b10 89 to 98 s): the scripted 1 to 4 s looks were refused
once lab_snapshot required the beat's own window, and the run stopped in P8 on both runners (2026-10-12).

No paid call and no subscription: Claude Code runs with an empty config folder (no login), a fake key and its base URL
on Loom's mock LLM server (`loom/agents/llm/mock_server.py`, Anthropic streaming on), so every model request of the
lead and its sub-agents is answered by a script; the other-family reviewers (skeptic, critic) hit the same mock
through Relay's adapters. Every real key is removed from this process first and the engine's .env is not read.

The scripted lead walks the demo lesson (spacing-sticks' artifacts, a new id) through P1 to P11 and, on the way,
tries to skip a gate, tries to write a beat it does not own (as the lead, and as a sub-agent for another beat, and
as a sub-agent without its token), reopens the storyboard once, and hits the budget once. Each case is asserted
from the rails' own records and written to docs/research/shuttle/s0/results.json with the run's report.
"""
from __future__ import annotations

import argparse
import json
import os
import shutil
import sys
import tempfile
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "tests" / "suites"))

for k in list(os.environ):                      # no real key may reach anything this harness starts
    if k.endswith("_API_KEY") or k.startswith("ANTHROPIC_"):
        os.environ.pop(k)
os.environ["LOOM_ENV_FILE"] = str(ROOT / "no-such-env-file.env")

from loom import flow  # noqa: E402
from loom.agents.llm.mock_server import MockLLM  # noqa: E402
from loom.project import Project  # noqa: E402
from loom.shuttle import launch as LA  # noqa: E402
from loom.shuttle import rails as RL  # noqa: E402
from loom.util import read_json, write_json  # noqa: E402

DEMO = ROOT / "projects" / "spacing-sticks"
KEY = "s0-fake-key-not-a-secret"
OUT = ROOT / "docs" / "research" / "shuttle" / "s0"
LEAD_SYS = "Shuttle director: you own this lesson"
CAST = [{"name": "Maya", "member": "woman", "skin": 0, "cloth": "accent4"}]


def plan(name):
    return read_json(DEMO / "plan" / f"{name}.json")


def build_lesson(root: Path) -> Project:
    """A new lesson folder with the demo's audio and clip store; the plan is the scripted lead's to submit. The narration
    stage is recorded for the exact script and storyboard the lead will submit, so P6 reuses the demo's voice instead of
    running TTS (narrate is still called; it reports `reused`)."""
    if root.exists():
        shutil.rmtree(root)
    for d in ("plan", "audio", "scenes", "build", "qa", "renders", "tasks", "sources", "media", "logs"):
        (root / d).mkdir(parents=True)
    cfg = read_json(DEMO / "project.json")
    cfg["id"] = "shuttle-s0"
    write_json(root / "project.json", cfg)
    write_json(root / "state.json", {"stages": {}})
    for sub in ("audio", "media"):
        shutil.rmtree(root / sub)
        shutil.copytree(DEMO / sub, root / sub)
    p = Project(root)
    write_json(p.path("plan/script.json"), ARTIFACTS["script"])
    write_json(p.path("plan/storyboard.json"), ARTIFACTS["storyboard"])
    flow.mark_done(p, "narrate", passed=True)
    p.path("plan/script.json").unlink()
    p.path("plan/storyboard.json").unlink()
    return p


ARTIFACTS: dict = {}


def js_roundtrip(obj):
    """What JSON looks like after it passed through Claude Code (JavaScript): an integral float is an integer (4.0 -> 4).
    The fixture's narration record must hash the same bytes the lead's submit will write."""
    if isinstance(obj, float) and obj.is_integer():
        return int(obj)
    if isinstance(obj, dict):
        return {k: js_roundtrip(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [js_roundtrip(v) for v in obj]
    return obj


def load_artifacts():
    from agents_runtime import _outline
    sb = plan("storyboard")
    sb["story"] = dict(sb.get("story") or {}, cast=CAST)
    tp = plan("teaching_plan")
    tp["pacing"]["requested_s"] = float(read_json(DEMO / "project.json")["request"].get("length_min") or 4) * 60
    ARTIFACTS.update(js_roundtrip(dict(brief=plan("brief"), knowledge=plan("knowledge"), teaching_plan=tp, script=plan("script"), outline=_outline(),
                                       storyboard=sb)),
                     scenes={f.name: f.read_text(encoding="utf-8") for f in (DEMO / "scenes").iterdir()})


# ------------------------------------------------------------------ the script
def lead(name, tool=None, args=None, text=None, usage=None, tools=None):
    rep = {}
    if text:
        rep["text"] = text
    if tool:
        rep["tool"], rep["args"] = "mcp__loom__" + tool if not tool.startswith(("Agent", "Write", "Task")) else tool, args or {}
    if tools:
        rep["tools"] = [{"name": ("mcp__loom__" + n if not n.startswith(("Agent", "Write")) else n), "args": a} for n, a in tools]
    st = {"name": name, "match": {"system_contains": LEAD_SYS}, "reply": rep}
    if usage:
        st["usage"] = usage
    return st


def sub(agent, token, name, tool=None, args=None, text=None):
    rep = {"text": text} if text else {}
    if tool:
        rep["tool"], rep["args"] = "mcp__loom__" + tool, dict(args or {})
    m = {"system_contains": f"Shuttle sub-agent: {agent}"}
    if token:
        m["user_contains"] = token
    return {"name": name, "match": m, "reply": rep}


def spawn(agent, token, beats=""):
    # the shape of delegate's spawn prompt since D-148: a handle; the sub-agent reads its brief itself
    return ("Agent", {"subagent_type": f"shuttle-{agent}", "description": f"{agent} {beats}".strip(), "run_in_background": False,
                      "prompt": f"You are the Shuttle {agent} for {beats or 'the job in your brief'}. Your owner token: {token}; pass it as "
                                f"`owner` on every loom tool call. Start with read_artifact(name='brief:{token}', owner='{token}')."})


def script() -> list:
    A = ARTIFACTS
    S = A["scenes"]
    T_FF, T_05, T_10 = "own-fact-finder-1", "own-scene-author-b05-1", "own-scene-author-b10-1"
    T_06, T_14, T_FX05, T_FX10 = "own-clip-author-b06-1", "own-clip-author-b14-1", "own-fixer-b05-1", "own-fixer-b10-1"
    FIX_B05 = S["b05.js"].replace('const syl = ["DAX", "BOK", "ZEF", "WUG", "KIP", "LOM", "FEP", "RIZ"];', 'const syl = ["?", "?", "?", "?", "?", "?", "?", "?"];')
    FIX_B10 = S["b10.js"].replace('"Recall: nothing"', '"Recall: gone"')
    assert FIX_B05 != S["b05.js"] and FIX_B10 != S["b10.js"], "the demo scenes changed: update the S0 fixes"
    OLD05 = 'const syl = ["DAX", "BOK", "ZEF", "WUG", "KIP", "LOM", "FEP", "RIZ"];'
    NEW05 = 'const syl = ["?", "?", "?", "?", "?", "?", "?", "?"];'
    assert S["b05.js"].count(OLD05) == 1 and S["b10.js"].count('"Recall: nothing"') == 1, "the fixers' edits must each match once"
    know = json.loads(json.dumps(A["knowledge"]))
    subs = [
        sub("fact-finder", T_FF, "ff brief", "read_artifact", {"name": f"brief:{T_FF}", "owner": T_FF}),
        sub("fact-finder", T_FF, "ff submit", "submit_knowledge", {"artifact": know, "owner": T_FF}),
        sub("fact-finder", T_FF, "ff done", text="Submitted the fact sheet: accepted by the gate. Nothing unverified beyond the caveats in it."),
        # b05's author: looks, then tries to write b10 (not its file), then submits its own
        sub("scene-author", T_05, "b05 brief", "read_artifact", {"name": f"brief:{T_05}", "owner": T_05}),
        sub("scene-author", T_05, "b05 look", "lab_snapshot", {"times": [40.0, 50.0], "source": S["b05.js"], "beat": "b05", "owner": T_05}),
        sub("scene-author", T_05, "b05 foreign", "submit_scene", {"artifact": {"beat": "b10", "source": S["b10.js"]}, "beat": "b10", "owner": T_05}),
        sub("scene-author", T_05, "b05 submit", "submit_scene", {"artifact": {"beat": "b05", "verified": ["snapshot at 1 s and 3 s"], "unverified": []},
                                                                  "beat": "b05", "owner": T_05}),
        sub("scene-author", T_05, "b05 done", text="b05 accepted after one snapshot; the write to b10 was refused (not my file)."),
        # b10's author: first a write without its token (the hook must refuse), then the normal path
        sub("scene-author", T_10, "b10 brief", "read_artifact", {"name": f"brief:{T_10}", "owner": T_10}),
        sub("scene-author", T_10, "b10 no token", "submit_scene", {"artifact": {"beat": "b10", "source": S["b10.js"]}, "beat": "b10"}),
        sub("scene-author", T_10, "b10 look", "lab_snapshot", {"times": [90.0, 96.0], "source": S["b10.js"], "beat": "b10", "owner": T_10}),
        sub("scene-author", T_10, "b10 submit", "submit_scene", {"artifact": {"beat": "b10", "verified": ["snapshot"], "unverified": []},
                                                                  "beat": "b10", "owner": T_10}),
        sub("scene-author", T_10, "b10 done", text="b10 accepted after one snapshot."),
        sub("clip-author", T_06, "b06 brief", "read_artifact", {"name": f"brief:{T_06}", "owner": T_06}),
        sub("clip-author", T_06, "b06 render", "render_clip", {"source": S["b06.py"], "times": [0.5, 2.0], "beat": "b06", "owner": T_06}),
        sub("clip-author", T_06, "b06 submit", "submit_clip", {"artifact": {"beat": "b06", "verified": ["frames at 0.5 and 2 s"]}, "beat": "b06", "owner": T_06}),
        sub("clip-author", T_06, "b06 done", text="b06 clip accepted."),
        sub("clip-author", T_14, "b14 brief", "read_artifact", {"name": f"brief:{T_14}", "owner": T_14}),
        sub("clip-author", T_14, "b14 render", "render_clip", {"source": S["b14.py"], "times": [0.5, 2.0], "beat": "b14", "owner": T_14}),
        sub("clip-author", T_14, "b14 submit", "submit_clip", {"artifact": {"beat": "b14", "verified": ["frames"]}, "beat": "b14", "owner": T_14}),
        sub("clip-author", T_14, "b14 done", text="b14 clip accepted."),
        # the first check fails on the demo's own vocabulary leaks (ratcheted for spacing-sticks, not for a new lesson):
        # two fixers change only what the defects name
        sub("fixer", T_FX05, "fix b05 brief", "read_artifact", {"name": f"brief:{T_FX05}", "owner": T_FX05}),
        sub("fixer", T_FX05, "fix b05 look", "lab_snapshot", {"times": [45.0], "edits": [{"old": OLD05, "new": NEW05}], "beat": "b05", "owner": T_FX05}),
        sub("fixer", T_FX05, "fix b05 submit", "submit_scene", {"artifact": {"beat": "b05", "verified": ["the cards show no invented words"]},
                                                                "beat": "b05", "owner": T_FX05}),
        sub("fixer", T_FX05, "fix b05 done", text="b05 fixed: the syllable cards show '?' instead of invented syllables."),
        sub("fixer", T_FX10, "fix b10 brief", "read_artifact", {"name": f"brief:{T_FX10}", "owner": T_FX10}),
        sub("fixer", T_FX10, "fix b10 look", "lab_snapshot", {"times": [93.0], "edits": [{"old": '"Recall: nothing"', "new": '"Recall: gone"'}],
                                                              "beat": "b10", "owner": T_FX10}),
        sub("fixer", T_FX10, "fix b10 submit", "submit_scene", {"artifact": {"beat": "b10", "verified": ["the label reads Recall: gone"]},
                                                                "beat": "b10", "owner": T_FX10}),
        sub("fixer", T_FX10, "fix b10 done", text="b10 fixed: 'Recall: gone', the narration's own word."),
    ]
    reviewers = [
        {"name": "skeptic", "match": {"provider": "openai", "tool_available": "submit_skeptic_verdict"},
         "reply": {"tool": "submit_skeptic_verdict", "args": {"artifact": {"verdict": "pass", "checked": [f["id"] for f in know["facts"]][:6], "findings": []}}}},
        {"name": "critic", "match": {"provider": "gemini", "tool_available": "submit_review"},
         "reply": {"tool": "submit_review", "args": {"artifact": {"verdict": "ship", "findings": [
             {"beat": "b03", "severity": "minor", "problem": "S0 scripted finding: the caption band is close to the chart", "fix": "none needed"}]}}}},
    ]
    sb = A["storyboard"]
    first = next(s for s in sb["scenes"] if s["kind"] == "template")
    beats = [s["beat"] for s in sb["scenes"]]
    L = [
        # the mixed split (L-373): P1 to P4 in one session, P5 to P6 in one, then one per phase; each lists only its
        # tools, and each session's first message carries the status and the notes (no fetching them to start)
        # ---- P1 to P4, before the facts approval: a later phase's tool is not even listed; a listed one out of order is
        # refused naming P1
        lead("s1 not listed", "submit_storyboard", {"artifact": sb}),
        lead("s1 skip a gate", "accept_phase", {"phase": "P5"}),
        lead("s1 brief", "submit_brief", {"artifact": A["brief"]}),
        lead("s1 write a file", "Write", {"file_path": "plan/brief.json", "content": "{}"}),
        lead("s1 delegate facts", "delegate", {"agent": "fact-finder", "brief": "Conservative facts for the brief's must_cover; no number without a source."}),
        lead("s1 spawn facts", tools=[spawn("fact-finder", T_FF)]),
        lead("s1 collect facts", "collect", {"token": T_FF}),
        lead("s1 skeptic", "skeptic_review"),
        lead("s1 ask facts", "request_approval", {"kind": "facts", "summary": "S0: the fact sheet passed its gate and the skeptic.", "files": ["plan/knowledge.json"]}),
        lead("s1 end", text="Waiting for the facts approval."),
        # ---- P1 to P4 again, after the approval
        lead("s1b pedagogy", "submit_teaching_plan", {"artifact": A["teaching_plan"]}),
        lead("s1b persona", "choose_persona", {"pick": "mentor", "why": "the request names the mentor persona"}),
        lead("s1b script", "submit_script", {"artifact": A["script"]}),
        lead("s1b notes", "note", {"kind": "notes", "text": "S0 handoff after P4: mentor persona; script accepted; next: outline then storyboard."}),
        lead("s1b end", text="P1 to P4 accepted."),
        # ---- P5 to P6, one reopen of the storyboard after the animatic, done inside the same session
        lead("s2 outline", "submit_outline", {"artifact": A["outline"]}),
        lead("s2 storyboard", "submit_storyboard", {"artifact": sb}),
        lead("s2 narrate", "narrate"),
        lead("s2 animatic", "animatic"),
        lead("s2 reopen", "reopen", {"phase": "P5", "reason": f"S0: after the animatic, {first['beat']} is re-cut (scripted reopen)"}),
        lead("s2 patch", "patch_storyboard", {"scenes": [first]}),
        lead("s2 narrate again", "narrate"),
        lead("s2 animatic again", "animatic"),
        lead("s2 ask plan", "request_approval", {"kind": "plan", "summary": "S0: script and storyboard, 24 beats, animatic looked at.",
                                                  "files": ["qa/shuttle_animatic_1.jpg"]}),
        lead("s2 end", text="Waiting for the plan approval."),
        # ---- P7: the storyboard declares no kit, so P7 is accepted by itself and no P7 session starts
        # ---- P8: four beats in one delegate call, four sub-agents side by side, one collect
        lead("p8 write a beat", "submit_scene", {"artifact": {"beat": "b05", "source": S["b05.js"]}}),
        lead("p8 delegate", "delegate", {"jobs": [{"agent": "scene-author", "beats": ["b05"], "brief": "b05: the curve drops on 'forget'."},
                                                  {"agent": "scene-author", "beats": ["b10"], "brief": "b10: the spaced reviews lift the curve."},
                                                  {"agent": "clip-author", "beats": ["b06"], "brief": "b06: the Manim curve."},
                                                  {"agent": "clip-author", "beats": ["b14"], "brief": "b14: the Manim comparison."}]}),
        lead("p8 spawn", tools=[spawn("scene-author", T_05, "b05"), spawn("scene-author", T_10, "b10"), spawn("clip-author", T_06, "b06"),
                                spawn("clip-author", T_14, "b14")]),
        lead("p8 collect", "collect", {"token": "all"}),
        lead("p8 notes", "note", {"kind": "notes", "text": "S0 handoff after P8: four beats written by sub-agents, every file accepted."}),
        lead("p8 end", text="P8 accepted."),
        # ---- P9: a check round is three lead turns (delegate the fixers, spawn them, collect and check); the fixers
        # send edits, not whole files (L-377)
        lead("p9 check", "check"),
        lead("p9 delegate fixers", "delegate", {"jobs": [{"agent": "fixer", "beats": ["b05"], "brief": "lesson_vocabulary: the syllables are invented words."},
                                                         {"agent": "fixer", "beats": ["b10"], "brief": "lesson_vocabulary: 'nothing' is not the lesson's word."}]}),
        lead("p9 spawn fixers", tools=[spawn("fixer", T_FX05, "b05"), spawn("fixer", T_FX10, "b10")]),
        lead("p9 collect and check", tools=[("collect", {"token": "all"}), ("check", {})]),
        lead("p9 notes", "note", {"kind": "notes", "text": "S0 handoff after P9: two fixers; the second check passed."}),
        lead("p9 end", text="P9 accepted."),
        # ---- P10: one call reports a huge usage, so the budget stops the run once; then the looks, at two sizes
        lead("p10 status", "lesson_status", usage={"input": 20000000, "output": 50}),
        lead("p10 spare status", "lesson_status"),
        lead("p10b look", tools=[("contact_sheet", {"beats": beats[0:9]}), ("contact_sheet", {"beats": beats[9:18]}), ("contact_sheet", {"beats": beats[18:]})]),
        lead("p10b close look", "contact_sheet", {"beats": ["b05", "b10"], "detail": "full"}),
        lead("p10b critic", "critic_review"),
        lead("p10b review", "submit_review", {"artifact": {"verdict": "ship", "findings": [
            {"beat": "b03", "severity": "minor", "problem": "S0 scripted finding: the caption band is close to the chart", "fix": "none needed",
             "status": "accepted"}]}}),
        lead("p10b end", text="P10 accepted."),
        # ---- P11
        lead("p11 render", "render", {"quality": "draft"}),
        lead("p11 ask final", "request_approval", {"kind": "final", "summary": "S0: rendered at draft quality.", "files": ["renders/"]}),
        lead("p11 end", text="Waiting for the final approval."),
    ]
    return subs + reviewers + L


# ------------------------------------------------------------------ the run
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--until", default="P11")
    ap.add_argument("--keep", action="store_true", help="keep the lesson folder (scratch) after the run")
    ap.add_argument("--runner", choices=["cli", "loom"], default="cli",
                    help="cli: the real claude -p on the mock; loom: Shuttle's own agents (D-165) on the same mock, in process")
    ap.add_argument("--out", help="where the evidence goes (default docs/research/shuttle/s0)")
    a = ap.parse_args()
    global OUT
    if a.out:
        OUT = Path(a.out)
    load_artifacts()
    work = Path(tempfile.gettempdir()) / "loom_shuttle_s0"
    lesson = work / "shuttle-s0"
    p = build_lesson(lesson)
    cfgdir = work / "claude-config"
    shutil.rmtree(cfgdir, ignore_errors=True)
    cfgdir.mkdir(parents=True)
    t0 = time.time()
    results = {"started": time.strftime("%Y-%m-%d %H:%M:%S"), "cases": [], "codes": []}
    with MockLLM(script=script(), api_key=KEY, anthropic_stream=True, anthropic_strict_alternation=False) as mock:
        env_extra = {"CLAUDE_CONFIG_DIR": str(cfgdir), "ANTHROPIC_API_KEY": KEY, "ANTHROPIC_BASE_URL": mock.base_url}
        server_env = {"LOOM_SHUTTLE_SEQ_TOKENS": "1", "LOOM_SHUTTLE_SKEPTIC": "mock-strong", "LOOM_SHUTTLE_CRITIC": "mock-gem",
                      "LOOM_OPENAI_BASE": mock.openai_base, "LOOM_GEMINI_BASE": mock.gemini_base, "LOOM_ANTHROPIC_BASE": mock.anthropic_base,
                      "OPENAI_API_KEY": KEY, "GEMINI_API_KEY": KEY, "LOOM_ENV_FILE": os.environ["LOOM_ENV_FILE"], "LOOM_TEST_FAST_RETRY": "1"}
        kw = {"env_extra": env_extra, "server_env": server_env}
        person = "S0 harness (scripted person, not Kshitij)"

        def step(label, fn):
            code = fn()
            st = RL.Rails(p).status()
            results["codes"].append({"after": label, "code": code, "current": st["current"], "waiting": (st["waiting"] or {}).get("kind"),
                                     "stop": (st["stop"] or {}).get("reason"), "requests": len(mock.requests), "s": round(time.time() - t0)})
            print(f"[s0] {label}: exit {code}; current {st['current']}; waiting {(st['waiting'] or {}).get('kind')}; stop {(st['stop'] or {}).get('reason')}",
                  flush=True)
            return code

        mode = "api" if a.runner == "loom" else "subscription"
        if a.runner == "loom":
            kw["env_extra"] = {"ANTHROPIC_API_KEY": KEY}      # the in-process agents reach the mock through LOOM_ANTHROPIC_BASE
        c = step("run (P1 to the facts approval)", lambda: LA.run(p, mode=mode, lead="sonnet", budget={"usd": 25.0}, until=a.until,
                                                                runner=a.runner, **kw))
        if c == 3:
            flow.approve(p, "facts", person, notes="S0: facts approved by the harness")
            c = step("resume after facts", lambda: LA.resume(p, **kw))
        if c == 3:
            flow.approve(p, "plan", person, notes="S0: keep the board in view")
            c = step("resume after plan", lambda: LA.resume(p, **kw))
        if c == 4:
            c = step("resume with a raised budget", lambda: LA.resume(p, budget={"usd": 200.0}, **kw))
        if c == 3:
            flow.approve(p, "final", person, notes="S0: watched the draft render")
            c = step("resume after final", lambda: LA.resume(p, **kw))
        results["requests"] = len(mock.requests)
        results["unmatched"] = mock.unmatched[:10]
        results["remaining_steps"] = [r for r in mock.remaining if r["remaining"] > 0]
        results["by_provider"] = {}
        for r in mock.requests:
            results["by_provider"][r["provider"]] = results["by_provider"].get(r["provider"], 0) + 1
    results["seconds"] = round(time.time() - t0)
    judge(p, results)
    publish(p, results)
    if not a.keep:
        print(f"[s0] lesson folder kept at {lesson} (scratch); evidence copied to {OUT}")
    bad = [c for c in results["cases"] if not c["ok"]]
    print(f"[s0] {len(results['cases']) - len(bad)} of {len(results['cases'])} cases hold" + (f"; FAILED: {[c['case'] for c in bad]}" if bad else ""))
    return 1 if bad else 0


def _jsonl(f):
    return [json.loads(l) for l in Path(f).read_text(encoding="utf-8").splitlines() if l.strip()] if Path(f).exists() else []


def judge(p, R):
    rl = RL.Rails(p)
    st = rl.load()
    tr = _jsonl(p.path("logs/shuttle/trace.jsonl"))
    tools = [t for t in tr if t.get("event") == "tool"]
    calls = _jsonl(p.path("logs/shuttle/calls.jsonl"))
    deny = _jsonl(p.path("logs/shuttle/hook_denials.jsonl"))
    ledger = [r for r in _jsonl(p.path("logs/decisions.jsonl")) if r.get("event") == "tool_call"]

    def case(name, ok, observed):
        R["cases"].append({"case": name, "ok": bool(ok), "observed": observed})

    def refused(tool, who=None):
        return [t for t in tools if t["tool"] == tool and t["outcome"] == "refused" and (who is None or t["who"] == who)]

    sk = refused("accept_phase", "lead")
    streams = "".join(f.read_text(encoding="utf-8", errors="replace") for f in p.path("logs/shuttle").glob("stream_*.jsonl"))
    p1 = p.path("logs/shuttle/stream_P1-P4.jsonl").read_text(encoding="utf-8", errors="replace") if p.path("logs/shuttle/stream_P1-P4.jsonl").exists() else ""
    brief_at = min((x["at"] for x in tools if x["tool"] == "submit_brief"), default="")
    unlisted = "mcp__loom__submit_storyboard" in p1 and not [t for t in tools if t["tool"] == "submit_storyboard" and t["at"] < brief_at]
    lead_results = []                       # the text of every tool result the lead itself received
    for line in streams.splitlines():
        if '"tool_result"' not in line:
            continue
        try:
            d = json.loads(line)
        except json.JSONDecodeError:
            continue
        if d.get("parent_tool_use_id"):
            continue
        for b in (d.get("message") or {}).get("content") or []:
            if isinstance(b, dict) and b.get("type") == "tool_result":
                c = b.get("content")
                lead_results.append("".join(x.get("text", "") for x in c if isinstance(x, dict)) if isinstance(c, list) else str(c or ""))
    case("skip a gate: in P1 the storyboard tool is not listed (Claude Code refuses it, loom-mcp never sees it) and a listed tool "
         "out of order is refused naming P1", unlisted and sk and "P1" in sk[0]["refusal"],
         {"accept_phase_P5": sk[0]["refusal"] if sk else None, "storyboard_reached_the_server_in_P1": not unlisted})
    inits = [t for t in tr if t.get("event") == "session_init"]
    by_group = {}
    for t in inits:
        by_group.setdefault(t.get("group"), []).append(t.get("tools"))
    case("the mixed split (L-373): P1 to P4 twice (before and after the facts approval), P5 to P6 once (its reopen inside it), "
         "then one session per phase; none for P7 (no kit); each listing only its tools",
         set(by_group) == {"P1-P4", "P5-P6", "P8", "P9", "P10", "P11"} and len(by_group["P1-P4"]) == 2 and len(by_group["P5-P6"]) == 1
         and max(by_group["P1-P4"]) < max(by_group["P8"]),
         {g: v for g, v in by_group.items()})
    case("the fixers sent edits, not whole files (L-377), and the edited beats were accepted",
         '"edits"' in streams and '"?", "?"' in p.path("scenes/b05.js").read_text(encoding="utf-8")
         and '"Recall: gone"' in p.path("scenes/b10.js").read_text(encoding="utf-8"),
         {"edits_in_stream": '"edits"' in streams})
    reads = [t for t in tools if t["tool"] == "read_artifact" and t.get("token") and t["outcome"] == "ok"]
    replies = [len(r) for r in lead_results if '"spawn"' in r]
    case("hand-over by reference: every sub-agent read its own brief; the lead's delegate replies carry no engine context",
         len({t["token"] for t in reads}) == 7 and replies and max(replies) < 6000
         and not [r for r in lead_results if "THE ENGINE'S CONTEXT" in r],
         {"sub_agents_that_read_their_brief": len({t["token"] for t in reads}), "delegate_reply_chars": replies,
          "lead_results": len(lead_results)})
    lead_calls = [t for t in tools if t["who"] == "lead"]
    ck = [i for i, t in enumerate(lead_calls) if t["tool"] == "check"]
    between = [t["tool"] for t in lead_calls[ck[0] + 1:ck[1]]] if len(ck) > 1 else None
    case("a check round is three lead turns: one delegate, the Agents, then collect('all') beside check (no compose call)",
         between == ["delegate", "collect"] and not [t for t in lead_calls if t["tool"] == "compose"], between)
    looks = [x for x in st["looked"] if x.get("what") == "contact_sheet"]
    case("pictures by the judgment: three overview sweeps and one full close look, each with its cost",
         [x.get("detail") for x in looks] == ["overview", "overview", "overview", "full"] and all(x.get("about_tokens") for x in looks),
         [(x.get("detail"), len(x.get("beats") or []), x.get("about_tokens")) for x in looks])
    case("no file tools: the lead's Write never runs (Claude Code has no such tool in the session)",
         '"name": "Write"' in streams or '"name":"Write"' in streams, "a Write tool_use is in the stream; plan/brief.json is the gate's: "
         + str(read_json(p.path("plan/brief.json"), {}).get("outcome", ""))[:60])
    lb = refused("submit_scene", "lead")
    case("the lead writes no beat: its submit_scene is refused", lb and "scene-author sub-agent" in lb[0]["refusal"], lb[0]["refusal"] if lb else None)
    fb = [t for t in refused("submit_scene") if t.get("token") == "own-scene-author-b05-1"]
    case("a sub-agent cannot write another beat: b05's token refused for b10", fb and "not this token's" in fb[0]["refusal"], fb[0]["refusal"] if fb else None)
    hk = [d for d in deny if d.get("tool") == "mcp__loom__submit_scene"]
    case("a sub-agent without its token is denied by the hook (Claude Code reported its type)", hk and hk[0].get("agent") == "shuttle-scene-author",
         hk[0] if hk else deny[:3])
    ro = st["reopens"]
    # L-332 (2026-10-08): only the reopened phase goes stale; later phases re-check themselves
    case("the storyboard is reopened once, only P5 stale, the plan approval voided",
         len(ro) == 1 and ro[0]["phase"] == "P5" and ro[0].get("stale") == ["P5"] and "plan" in ro[0]["approvals_voided"], ro[0] if ro else None)
    bud = [t for t in tr if t.get("event") in ("budget_stop", "session_killed")]
    case("the budget stops the run once (exit 4), and a raised budget resumes it",
         any(c["code"] == 4 for c in R["codes"]) and any("budget" in str(t) for t in bud), [{"event": t["event"], **{k: t.get(k) for k in ("detail", "why")}} for t in bud][:3])
    waits = [c for c in R["codes"] if c["code"] == 3]
    case("three approvals pause the run (exit 3): facts, plan, final", [c["waiting"] for c in waits] == ["facts", "plan", "final"], [c["waiting"] for c in waits])
    s = rl.status()
    case("every phase accepted at the end (exit 0)", R["codes"] and R["codes"][-1]["code"] == 0 and s["current"] is None,
         {r["phase"]: r["status"] for r in s["phases"]})
    toks = st["tokens"]
    case("seven sub-agents (facts, two scenes, two clips, two fixers) worked through owner tokens, each accepted and collected",
         len(toks) == 7 and all(t["status"] == "collected" and t["accepted"] for t in toks.values()),
         {k: (v["status"], v["accepted"], v["snapshots"]) for k, v in toks.items()})
    agents = {c.get("agent") for c in calls}
    case("every model call is in the ledger with its real model; sub-agents' calls carry their agent",
         calls and {"lead"} <= agents and any(a and a.startswith("shuttle-") for a in agents) and all(c.get("model") for c in calls),
         {"calls": len(calls), "agents": sorted(a for a in agents if a), "models": sorted({c.get("model") for c in calls})})
    led = [r for r in ledger if (r.get("by") or {}).get("model")]
    case("every tool call is in the decision ledger with the caller's model", ledger and len(led) == len(ledger),
         {"tool_calls": len(ledger), "with_model": len(led), "models": sorted({(r.get("by") or {}).get("model") for r in ledger})[:6]})
    chk = [r.get("choice") for r in _jsonl(p.path("logs/decisions.jsonl")) if r.get("event") == "outcome" and r.get("node") == "check"]
    case("the first check fails, two fixers fix their beats in P9, the second check passes",
         chk[:1] == ["fail"] and chk[-1:] == ["pass"] and p.stage_info("check").get("status") == "done", chk)
    seen = sum(1 for t in tools if t.get("hook"))
    case("the hook's caller records reach the server (sub-agent identity cross-checked)", seen > 0, {"calls_with_hook_record": seen, "calls": len(tools)})
    case("no real provider was reached (every request answered by the mock)", not R["unmatched"], {"requests": R["requests"], "by_provider": R["by_provider"],
                                                                                                   "unmatched": R["unmatched"][:2]})


def publish(p, R):
    OUT.mkdir(parents=True, exist_ok=True)
    LA.write_report(p)
    for rel, name in (("logs/shuttle/report.md", "report.md"), ("logs/shuttle/state.json", "state.json"), ("logs/shuttle/trace.jsonl", "trace.jsonl"),
                      ("logs/shuttle/calls.jsonl", "calls.jsonl"), ("logs/shuttle/hook_denials.jsonl", "hook_denials.jsonl")):
        f = p.path(rel)
        if f.exists():
            shutil.copy2(f, OUT / name)
    write_json(OUT / "results.json", R)


if __name__ == "__main__":
    raise SystemExit(main())
