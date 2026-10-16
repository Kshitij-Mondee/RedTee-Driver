"""Relay served by Claude Code headless (provider claude_code, aliases cc-*): each role task is one `claude -p` session
with the role's own system prompt and only the role's Relay tools (loom/agents/cc_runner.py, cc_server.py).

Offline: the per-task MCP server over stdio, the Opus-on-the-storyboard rule by model, and the real CLI driven by Loom's
mock server (a fake key, an empty config folder; no subscription and no paid call), on one role and on Relay's planning
chain."""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
from contextlib import contextmanager
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from agents_runtime import DEMO, _outline, _plan, fresh_project  # noqa: E402
from loom.agents import cc_runner as CC  # noqa: E402
from loom.agents import tools as T  # noqa: E402
from loom.agents.budget import Budget  # noqa: E402
from loom.agents.llm import registry as R  # noqa: E402
from loom.agents.llm.mock_server import MockLLM  # noqa: E402
from loom.agents.runtime import AgentSpec, run_agent  # noqa: E402
from loom.util import LoomError, read_json, which, write_json  # noqa: E402

KEY = "cc-test-key-not-a-secret"


@contextmanager
def cli_on_mock(script):
    """Claude Code pointed at the mock: an empty config folder (no login), a fake key, the mock's base URL; the Relay
    adapters (the checkers) at the same mock."""
    cfg = Path(tempfile.mkdtemp(prefix="cc_cfg_"))
    keep = {k: os.environ.get(k) for k in ("ANTHROPIC_API_KEY", "OPENAI_API_KEY", "GEMINI_API_KEY", "LOOM_ANTHROPIC_BASE", "LOOM_OPENAI_BASE",
                                           "LOOM_GEMINI_BASE", "LOOM_ENV_FILE", "LOOM_TEST_FAST_RETRY")}
    with MockLLM(script=script, api_key=KEY, anthropic_stream=True, anthropic_strict_alternation=False) as m:
        CC.ENV_EXTRA.clear()
        CC.ENV_EXTRA.update(CLAUDE_CONFIG_DIR=str(cfg), ANTHROPIC_API_KEY=KEY, ANTHROPIC_BASE_URL=m.base_url)
        os.environ.update(ANTHROPIC_API_KEY=KEY, OPENAI_API_KEY=KEY, GEMINI_API_KEY=KEY, LOOM_ANTHROPIC_BASE=m.anthropic_base,
                          LOOM_OPENAI_BASE=m.openai_base, LOOM_GEMINI_BASE=m.gemini_base, LOOM_ENV_FILE=str(ROOT / "no-such.env"),
                          LOOM_TEST_FAST_RETRY="1")
        try:
            yield m
        finally:
            CC.ENV_EXTRA.clear()
            for k, v in keep.items():
                if v is None:
                    os.environ.pop(k, None)
                else:
                    os.environ[k] = v
            shutil.rmtree(cfg, ignore_errors=True)


def _cc_steps(role_marker: str, tool: str, artifact: dict, done: str = "Submitted.") -> list:
    """A role's scripted turns: match its role card in the system prompt, call its terminal tool, then end."""
    return [{"name": f"{tool} submit", "match": {"system_contains": role_marker, "tool_available": f"mcp__relay__{tool}"},
             "reply": {"tool": f"mcp__relay__{tool}", "args": {"artifact": artifact}}},
            {"name": f"{tool} done", "match": {"system_contains": role_marker, "last_tool_result_contains": "accepted"}, "reply": {"text": done}}]


def agents_cc_server_serves_one_role_and_keeps_the_runtime_guards():
    """The per-task server lists exactly the role's tools, runs them through tools.call (the allow-list and the gate),
    saves the task's state after every call, and keeps the runtime's guards: a sixth identical read stops, an accepted
    submission is not taken again."""
    with fresh_project() as p:
        work = Path(tempfile.mkdtemp(prefix="cc_srv_"))
        try:
            task = work / "task.json"
            write_json(task, {"project": str(p.root), "role": "persona_pick", "stage": "persona", "beat": None, "target": None, "extra": {},
                              "tools": [t.name for t in T.specs("persona_pick")], "terminal": "submit_persona_pick",
                              "limits": {"tool_calls": 80, "repairs": 1}, "state_file": str(work / "state.json"), "model": "test"})
            msgs = [{"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {}}, {"jsonrpc": "2.0", "id": 2, "method": "tools/list"},
                    {"jsonrpc": "2.0", "id": 3, "method": "tools/call", "params": {"name": "submit_brief", "arguments": {"artifact": {}}}},
                    {"jsonrpc": "2.0", "id": 4, "method": "tools/call", "params": {"name": "submit_persona_pick",
                                                                                   "arguments": {"artifact": {"pick": "mentor", "why": "fits the brief"}}}},
                    {"jsonrpc": "2.0", "id": 5, "method": "tools/call", "params": {"name": "submit_persona_pick",
                                                                                   "arguments": {"artifact": {"pick": "analyst", "why": "again"}}}}]
            r = subprocess.run([sys.executable, "-m", "loom.agents.cc_server", "--task", str(task)], input="\n".join(json.dumps(m) for m in msgs) + "\n",
                               capture_output=True, text=True, cwd=str(ROOT), timeout=120, encoding="utf-8")
            by = {m["id"]: m for m in (json.loads(l) for l in r.stdout.splitlines() if l.strip())}
            assert r.stderr == "", r.stderr[-300:]
            assert [t["name"] for t in by[2]["result"]["tools"]] == ["submit_persona_pick"], by[2]
            assert by[3]["result"]["isError"] and "unknown tool" in by[3]["result"]["content"][0]["text"]      # another role's tool
            first = json.loads(by[4]["result"]["content"][0]["text"])
            assert first["accepted"] is True, first
            again = json.loads(by[5]["result"]["content"][0]["text"])
            assert "already accepted" in again.get("note", ""), again                                           # not taken twice
            st = read_json(work / "state.json")
            assert st["done"] and st["value"]["pick"] == "mentor" and st["cc_calls"] == 2, st
        finally:
            shutil.rmtree(work, ignore_errors=True)
    return "1 tool listed for persona_pick; another role's tool refused; accepted once; state saved after the guarded call too"


def agents_cc_opus_never_writes_the_storyboard():
    """Relay's rule (Kshitij, 2026-10-06) holds by the model, not the alias's spelling: cc-opus on the storyboard is
    refused like claude-opus-5-5; the shipped claude-cc profile keeps Sonnet there."""
    cfg = Path(tempfile.mkdtemp(prefix="cc_prof_"))
    try:
        (cfg / "profiles").mkdir()
        shutil.copy2(R.CONFIG / "models.json", cfg / "models.json")
        base = read_json(R.CONFIG / "profiles" / "claude-cc.json")
        for alias, name in (("cc-opus", "bad-cc"), ("claude-opus-5-5", "bad-api"), ("cc-sonnet", "good")):
            d = json.loads(json.dumps(base))
            d["roles"]["storyboard"] = alias
            write_json(cfg / "profiles" / f"{name}.json", d)
        keep = R.CONFIG
        R.CONFIG = cfg
        try:
            for name in ("bad-cc", "bad-api"):
                try:
                    R.profile(name)
                    raise AssertionError(f"{name}: Opus was allowed on the storyboard")
                except LoomError as e:
                    assert "Opus may not write the storyboard" in str(e), e
            assert R.profile("good")["roles"]["storyboard"] == "cc-sonnet"                                      # control
        finally:
            R.CONFIG = keep
        P = R.profile("claude-cc")
        assert "opus" not in R.model(P["roles"]["storyboard"])["id"] and R.model(P["roles"]["brief"])["cli"] == "claude-opus-5-5"
        assert R.model(P["roles"]["skeptic"])["provider"] != "anthropic" and R.model(P["roles"]["critic"])["provider"] != "anthropic"
    finally:
        shutil.rmtree(cfg, ignore_errors=True)
    return "cc-opus and claude-opus-5-5 refused on the storyboard; claude-cc: Opus plans, Sonnet storyboards, Gemini checks"


def agents_cc_opus_storyboard_only_when_a_profile_names_the_decision():
    """D-142 (Kshitij, 2026-10-08): claude-cc-opus-sb puts Opus 5.5 on the storyboard only, by an `opus_storyboard` field
    naming who allowed it and the decision; Sonnet 5.5 (the full model name, not the `sonnet` alias that served
    claude-sonnet-5) writes everything else; Gemini reviews. Controls: the same profile with the field removed, or with a
    field that names no decision, is refused as before."""
    P = R.profile("claude-cc-opus-sb")
    sb = {r for r, a in P["roles"].items() if "opus" in R.model(a)["id"]}
    assert sb == {"storyboard", "storyboard_outline"}, f"Opus roles: {sorted(sb)}"
    writers = [r for r in P["roles"] if r not in sb and R.model(P["roles"][r])["provider"] == "claude_code"]
    assert writers and all(R.model(P["roles"][r])["cli"] == "claude-sonnet-5-5" for r in writers), writers
    for r in ("scene", "kit", "clip", "brief", "script"):
        assert r in writers, f"{r} is not written by Sonnet 5.5"
    assert R.model(P["roles"]["skeptic"])["provider"] == "gemini" and R.model(P["roles"]["critic"])["provider"] == "gemini"
    cfg = Path(tempfile.mkdtemp(prefix="cc_prof_"))
    try:
        (cfg / "profiles").mkdir()
        shutil.copy2(R.CONFIG / "models.json", cfg / "models.json")
        base = read_json(R.CONFIG / "profiles" / "claude-cc-opus-sb.json")
        for name, val in (("no-field", None), ("no-decision", "someone said so")):
            d = json.loads(json.dumps(base))
            d.pop("opus_storyboard")
            if val:
                d["opus_storyboard"] = val
            write_json(cfg / "profiles" / f"{name}.json", d)
        keep = R.CONFIG
        R.CONFIG = cfg
        try:
            for name in ("no-field", "no-decision"):
                try:
                    R.profile(name)
                    raise AssertionError(f"{name}: Opus was allowed on the storyboard")
                except LoomError as e:
                    assert "Opus may not write the storyboard" in str(e), e
        finally:
            R.CONFIG = keep
    finally:
        shutil.rmtree(cfg, ignore_errors=True)
    return "claude-cc-opus-sb: Opus on the storyboard only, Sonnet 5.5 pinned for the rest; refused without the decision"


def agents_cc_runner_serves_a_role_through_claude_p():
    """One Relay role through the real `claude -p` (on the mock): the system prompt is the role's own (not Claude Code's,
    no CLAUDE.md), the only tools offered are the role's, the task's image reaches the model, the submission passes the
    gate, and the call is in llm_calls.jsonl as claude_code with a notional cost and 0 billed."""
    if not which("claude"):
        return "skipped (no claude CLI here)"
    from PIL import Image
    marker = (T.ROLES / "persona_pick.md").read_text(encoding="utf-8").splitlines()[0][:40]
    steps = _cc_steps(marker, "submit_persona_pick", {"pick": "mentor", "why": "warm and practical, as the brief asks"})
    with fresh_project() as p, cli_on_mock(steps) as m:
        img = p.path("qa/test.png")
        img.parent.mkdir(parents=True, exist_ok=True)
        Image.new("RGB", (64, 64), (200, 30, 30)).save(img)
        ctx = T.ToolContext(project=p, role="persona_pick", stage="persona")
        b = Budget(1.0)
        res = run_agent(AgentSpec("persona_pick", "cc-sonnet"), ctx, "Pick the persona.", b, images=[str(img)],
                        session_path=p.path("logs/sessions/persona_pick.json"))
        assert res.status == "accepted" and res.value["pick"] == "mentor" and res.provider == "claude_code", (res.status, res.note, res.value)
        reqs = [q for q in m.requests if q["provider"] == "anthropic" and q.get("body")]
        body = reqs[0]["body"]
        sysm = json.dumps(body.get("system"))
        assert marker in sysm and "You are Claude Code" not in sysm, sysm[:300]
        everything = json.dumps(body)
        assert "Loom Video-Engine - instructions for agents" not in everything and "graphify" not in everything    # no CLAUDE.md
        names = sorted(t.get("name") for t in body.get("tools") or [])
        assert names == ["mcp__relay__submit_persona_pick"], names
        assert any(b2.get("type") == "image" for msg in body["messages"] if isinstance(msg.get("content"), list) for b2 in msg["content"])
        calls = [json.loads(l) for l in p.path("logs/llm_calls.jsonl").read_text(encoding="utf-8").splitlines()]
        assert calls and all(c["provider"] == "claude_code" and c["notional"] and c["billed_usd"] == 0 for c in calls), calls[:2]
        assert b.spent == 0                                                   # --budget counts billed money only
        sess = read_json(p.path("logs/sessions/persona_pick.json"))
        assert sess.get("cc_session_id"), sess
        assert not m.unmatched, m.unmatched[:2]
    return f"accepted through claude -p; {len(reqs)} request(s), only the role's tool, the image delivered, {len(calls)} notional row(s)"


def agents_cc_fix_resumes_the_roles_own_claude_session():
    """The defect router's fix: the role's saved session is resumed (`--resume`), so the model sees its own first task
    and submission, plus one message naming only the defects; the fix is judged by the same gate."""
    if not which("claude"):
        return "skipped (no claude CLI here)"
    from loom.agents.runtime import load_session
    marker = (T.ROLES / "persona_pick.md").read_text(encoding="utf-8").splitlines()[0][:40]
    steps = _cc_steps(marker, "submit_persona_pick", {"pick": "mentor", "why": "first answer"})
    steps += [{"name": "fix submit", "match": {"system_contains": marker, "user_contains": "DEFECT-7"},
               "reply": {"tool": "mcp__relay__submit_persona_pick", "args": {"artifact": {"pick": "analyst", "why": "fixed DEFECT-7"}}}},
              {"name": "fix done", "match": {"system_contains": marker, "last_tool_result_contains": "accepted"}, "reply": {"text": "Fixed."}}]
    with fresh_project() as p, cli_on_mock(steps) as m:
        sp = p.path("logs/sessions/persona_pick.json")
        first = run_agent(AgentSpec("persona_pick", "cc-sonnet"), T.ToolContext(project=p, role="persona_pick", stage="persona"),
                          "Pick the persona. FIRST-TASK-TEXT", Budget(1.0), session_path=sp)
        sess = load_session(sp)
        fix = run_agent(AgentSpec("persona_pick", "cc-sonnet"), T.ToolContext(project=p, role="persona_pick", stage="persona"),
                        "Fix only this: DEFECT-7", Budget(1.0), resume=sess, session_path=sp)
        assert first.status == "accepted" and fix.status == "accepted" and fix.value["pick"] == "analyst", (first.status, fix.status, fix.note)
        bodies = [json.dumps(q["body"]) for q in m.requests if q["provider"] == "anthropic" and q.get("body")]
        resumed = [b for b in bodies if "DEFECT-7" in b]
        assert resumed and all("FIRST-TASK-TEXT" in b and "first answer" in b for b in resumed), "the fix did not resume the session"
        assert read_json(sp)["cc_session_id"] == sess["cc_session_id"]                       # one conversation
        assert not m.unmatched, m.unmatched[:2]
    return f"fix resumed session {sess['cc_session_id'][:8]}: the first task and answer in context, the defect fixed"


def agents_cc_relay_plans_a_lesson_through_claude_p():
    """Relay's own conductor plans a lesson (brief to storyboard, with the skeptic and the animatic look round) on profile
    cc-mock: every authoring role through `claude -p`, the checker through the Anthropic adapter, both on the mock. The
    script's first submission breaks the dash rule and is repaired from the gate's errors inside the same session."""
    if not which("claude"):
        return "skipped (no claude CLI here)"
    from loom.agents.conductor import Conductor
    card = lambda r: (T.ROLES / f"{r}.md").read_text(encoding="utf-8").splitlines()[0][:40]
    bad_script = json.loads(json.dumps(_plan("script")).replace("training", "training " + chr(0x2014) + " really", 1))
    steps = []
    steps += _cc_steps(card("brief"), "submit_brief", _plan("brief"))
    steps += _cc_steps(card("knowledge"), "submit_knowledge", _plan("knowledge"))
    steps += [{"name": "skeptic", "match": {"provider": "anthropic", "tool_available": "submit_skeptic_verdict"},
               "reply": {"tool": "submit_skeptic_verdict", "args": {"artifact": {"verdict": "pass", "checked": ["F1"], "findings": []}}}}]
    steps += _cc_steps(card("pedagogy"), "submit_teaching_plan", _plan("teaching_plan"))
    steps += _cc_steps(card("persona_pick"), "submit_persona_pick", {"pick": "mentor", "why": "the brief asks for a warm colleague"})
    steps += [{"name": "script bad", "match": {"system_contains": card("script"), "tool_available": "mcp__relay__submit_script"},
               "reply": {"tool": "mcp__relay__submit_script", "args": {"artifact": bad_script}}},
              {"name": "script fixed", "match": {"system_contains": card("script"), "last_tool_result_contains": "dashes"},
               "reply": {"tool": "mcp__relay__submit_script", "args": {"artifact": _plan("script")}}}]
    steps += [{"name": "script done", "match": {"system_contains": card("script"), "last_tool_result_contains": "accepted\\\": true"},
               "reply": {"text": "Submitted."}}]
    steps += _cc_steps(card("storyboard_outline"), "submit_outline", _outline())
    steps += _cc_steps(card("storyboard"), "submit_storyboard", _plan("storyboard"))
    steps += [{"name": "look", "match": {"system_contains": card("storyboard"), "tool_available": "mcp__relay__storyboard_stands"},
               "reply": {"tool": "mcp__relay__storyboard_stands", "args": {"note": "every panel shows its line"}}},
              {"name": "look done", "match": {"system_contains": card("storyboard")}, "reply": {"text": "It stands."}, "repeat": 3}]
    with fresh_project() as p, cli_on_mock(steps) as m:
        b = Budget(5.0)
        code = Conductor(p, "cc-mock", b, approve_knowledge_as="agent, unattended (test)").run("storyboard")
        run = read_json(p.path("logs/agents_run.json"))
        rows = [(t["role"], t["status"], t["provider"], t["note"]) for t in run["tasks"]]
        assert code == 0, (code, rows, m.unmatched[:2])
        for stage in ("brief", "knowledge", "pedagogy", "persona", "script", "allocate", "storyboard"):
            assert p.stage_info(stage).get("status") == "done", (stage, p.stage_info(stage))
        provs = {t["role"]: t["provider"] for t in run["tasks"]}
        assert provs["brief"] == "claude_code" and provs["skeptic"] == "anthropic", provs
        scr = next(t for t in run["tasks"] if t["role"] == "script")
        assert scr["repairs"] == 1, scr                                                     # repaired from the gate's errors
        calls = [json.loads(l) for l in p.path("logs/llm_calls.jsonl").read_text(encoding="utf-8").splitlines()]
        assert any(c["provider"] == "claude_code" for c in calls) and any(c["provider"] == "anthropic" for c in calls)
        assert b.spent > 0 and all(c.get("billed_usd", c["usd"]) == 0 for c in calls if c["provider"] == "claude_code")
    return f"7 stages done through claude -p (+ the skeptic on the adapter); script repaired once; {len(m.requests)} requests"
