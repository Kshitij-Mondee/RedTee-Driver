"""Shuttle on its own agents (loom/shuttle/loop.py, D-165; Kshitij, 2026-10-12: "I don't want shuttle running claude code
sessions. I want proper agents and functional stuff. I want the idea and pipeline architecture to be as similar as
possible."). Offline: the mock provider speaks Anthropic, OpenAI and Gemini; the rails, the server and the sub-agent
definitions are the real ones."""
from __future__ import annotations

import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from agents_runtime import mock_env  # noqa: E402
from shuttle_rails import lesson  # noqa: E402
from loom.shuttle import launch as LA  # noqa: E402
from loom.shuttle import loop as LP  # noqa: E402
from loom.shuttle import rails as RL  # noqa: E402
from loom.util import LoomError, read_json, write_json  # noqa: E402

LEAD = "lead agent of a Shuttle session"
SUB = "You are a Shuttle sub-agent"


def _script() -> list:
    """A lead that reads its status, delegates two researchers in one call, spawns both in one turn, collects and ends;
    each researcher reads its brief with its token and answers. Steps are matched in order: the later a step is in the
    conversation, the earlier it is listed. Matches are unquoted words: Gemini's tool results arrive JSON-escaped."""
    return [
        {"name": "lead ends", "match": {"system_contains": LEAD, "last_tool_result_contains": "collected"},
         "reply": {"text": "Session done: two researchers ran and were collected."}},
        {"name": "lead collects", "match": {"system_contains": LEAD, "last_tool_result_contains": "Brief read"},
         "reply": {"tool": "mcp__loom__collect", "args": {"token": "all"}}},
        {"name": "lead spawns both", "match": {"system_contains": LEAD, "last_tool_result_contains": "delegated"},
         "reply": {"tools": [{"name": "Agent", "args": {"subagent_type": "shuttle-researcher", "prompt": "You are the Shuttle researcher. Your owner token: own-researcher-1"}},
                             {"name": "Agent", "args": {"subagent_type": "shuttle-researcher", "prompt": "You are the Shuttle researcher. Your owner token: own-researcher-2"}}]}},
        {"name": "lead delegates", "match": {"system_contains": LEAD, "last_tool_result_contains": "phases"},
         "reply": {"tool": "mcp__loom__delegate", "args": {"jobs": [{"agent": "researcher", "brief": "Find what grounds the claim about spacing."},
                                                                    {"agent": "researcher", "brief": "Find what grounds the claim about recall."}]}}},
        {"name": "lead reads its status", "match": {"system_contains": LEAD}, "reply": {"tool": "mcp__loom__lesson_status", "args": {}}},
        {"name": "researcher answers", "match": {"system_contains": SUB, "last_tool_result_contains": "THE LEAD"},
         "reply": {"text": "Brief read; the claim is grounded in the knowledge sheet.", "delay_s": 0.8}, "repeat": 2},
        {"name": "researcher 1 reads", "match": {"system_contains": SUB, "user_contains": "own-researcher-1"},
         "reply": {"tool": "mcp__loom__read_artifact", "args": {"name": "brief:own-researcher-1", "owner": "own-researcher-1"}, "delay_s": 0.8}},
        {"name": "researcher 2 reads", "match": {"system_contains": SUB, "user_contains": "own-researcher-2"},
         "reply": {"tool": "mcp__loom__read_artifact", "args": {"name": "brief:own-researcher-2", "owner": "own-researcher-2"}, "delay_s": 0.8}},
    ]


def _rows(p) -> list:
    f = p.path("logs/shuttle/calls.jsonl")
    return [json.loads(x) for x in f.read_text(encoding="utf-8").splitlines() if x.strip()] if f.exists() else []


def agents_shuttle_own_agents_run_a_session_on_every_provider():
    """One P7 session on the loom runner, for an Anthropic-, an OpenAI-, a Gemini- and a Qwen-routed model: the lead calls loom-mcp's
    tools in process, delegates two researchers in one call and spawns both in one turn (they run side by side), each
    researcher reads its own brief with its owner token (the server sees it as that sub-agent), the lead collects and
    ends; every model call is one exact cost row naming the agent and the provider; the session is saved for a retry"""
    out = []
    for alias, provider in (("mock-small", "anthropic"), ("mock-strong", "openai"), ("mock-gem", "gemini"), ("mock-qwen", "qwen")):
        with mock_env(_script()) as mk, lesson("P6", kit_beat="b10") as p:
            # qwen (D-168) speaks the OpenAI wire format at its own base and key: point both at the mock
            keep_q = {k: os.environ.get(k) for k in ("LOOM_QWEN_BASE", "DASHSCOPE_API_KEY")}
            os.environ.update(LOOM_QWEN_BASE=mk.openai_base, DASHSCOPE_API_KEY="test-key")
            st = LP.run_session(p, "api", alias, ("P7", "P7"), "SHUTTLE SESSION for the test: phase P7.", "sess-" + alias, resume=False,
                                env_extra=None, server_env={"LOOM_SHUTTLE_SEQ_TOKENS": "1"}, approve_as=None, budget_left=None,
                                preset={"agents": {"*": alias}})
            assert not mk.unmatched if hasattr(mk, "unmatched") else True
            assert st.result and not st.result["is_error"] and st.result["num_turns"] == 5, (alias, st.result, st.killed)
            assert "Session done" in st.result["result"], st.result
            rows = _rows(p)
            lead = [r for r in rows if r["agent"] == "lead"]
            subs = [r for r in rows if r["agent"] == "shuttle-researcher"]
            assert len(lead) == 5 and len(subs) == 4, (alias, [(r["agent"], r.get("turn")) for r in rows])
            assert all(r["provider"] == provider and r["runner"] == "loom" and r["notional"] is False and r["phase"] == "P7" for r in rows), rows[0]
            assert len({r["agent_id"] for r in subs}) == 2, "two researchers, each its own agent"
            toks = RL.Rails(p).load()["tokens"]
            assert {k: v["status"] for k, v in toks.items() if k.startswith("own-researcher")} == {"own-researcher-1": "collected", "own-researcher-2": "collected"}, toks
            assert all(len(v.get("brief_read") or []) >= 1 for k, v in toks.items() if k.startswith("own-researcher")), "each read its own brief"
            callers = [read_json(f) for f in p.path("logs/shuttle/callers").glob("*.json")]
            assert sum(1 for c in callers if c.get("agent_type") == "shuttle-researcher") == 2, callers
            tr = [json.loads(x) for x in p.path("logs/shuttle/trace.jsonl").read_text(encoding="utf-8").splitlines()]
            starts = [t["at"] for t in tr if t.get("event") == "subagent_start"]
            ends = [t["at"] for t in tr if t.get("event") == "subagent_end"]
            assert len(starts) == 2 and max(starts) < min(ends), f"the two researchers ran side by side: {starts} {ends}"
            res = [t for t in tr if t.get("event") == "session_result"][-1]
            assert res["runner"] == "loom" and abs(res["cli_cost_usd"] - sum(r["usd"] for r in rows)) < 1e-5, res
            sess = read_json(p.path("logs/shuttle/session.json"))
            assert sess["lead_provider"] == provider and "shuttle-researcher" in sess["agents"], sess
            saved = read_json(p.path(f"logs/shuttle/sessions/sess-{alias}.json"))
            assert len(saved["messages"]) >= 10, len(saved["messages"])
            assert p.path("logs/llm_calls.jsonl").exists()
            for k, v in keep_q.items():
                os.environ.pop(k, None) if v is None else os.environ.__setitem__(k, v)
        out.append(f"{provider}: 5 lead + 4 researcher calls, ${sum(r['usd'] for r in rows):.4f}")
    return "; ".join(out)


def agents_shuttle_own_agents_refuse_what_the_session_does_not_have():
    """The Agent tool runs only Shuttle sub-agents of the session's phases; a tool not in an agent's list is refused; Read
    reads engine files only (never .env); a sub-agent passing another's token is refused by the server as under Claude Code;
    a budget too small for the next call stops the session through the rails"""
    from loom.agents.llm.types import ToolCall
    with mock_env([]) , lesson("P6", kit_beat="b10") as p:
        s = LP.Session(p, "api", "mock-small", ("P7", "P7"), "s-ref", None, None, {"LOOM_SHUTTLE_SEQ_TOKENS": "1"}, {"agents": {"*": "mock-small"}})
        try:
            lead = LP.Agent(s, "lead", "mock-small", ["x"], LP._specs(s.server, []), 5)
            bad = json.loads(s.spawn(lead, {"subagent_type": "Explore", "prompt": "go"})[0])
            assert "no Shuttle sub-agent" in bad["error"], bad
            off = json.loads(s.spawn(lead, {"subagent_type": "shuttle-fact-finder", "prompt": "go"})[0])
            assert "not for this session's phases" in off["error"], off
            r = json.loads(s.dispatch(lead, ToolCall("1", "mcp__loom__no_such_tool", {}))[0])
            assert "not one of your tools" in r["error"], r
            assert "error" in LP.read_file(".env") and "error" in LP.read_file("../outside.txt")
            assert LP.read_file("CLAUDE.md")["lines"][0] == 1
            d = s.server.call("delegate", {"agent": "researcher", "brief": "find it"})[0]
            sub = LP.Agent(s, "shuttle-researcher", "mock-small", ["x"], LP._specs(s.server, []), 5, agent_type="shuttle-scene-author")
            res = json.loads(s.dispatch(sub, ToolCall("2", "mcp__loom__read_artifact", {"name": f"brief:{d['token']}", "owner": d["token"]}))[0])
            assert "belongs to" in str(res) or "refused" in str(res), res
            noown = json.loads(s.dispatch(sub, ToolCall("3", "mcp__loom__submit_kit", {"api": "x"}))[0])
            assert "pass your owner token" in noown["error"], noown
            RL.Rails(p).update(lambda st: st.__setitem__("budget", {"usd": 0.000001}))
            from loom.agents.llm.types import Message
            lead.run([Message("user", "start")])
            assert s.stream.killed and s.stream.killed.startswith("budget"), s.stream.killed
            assert RL.Rails(p).load()["stop"]["reason"] == "budget"
        finally:
            s.close()
    return "foreign and off-phase agents, unknown tools, .env, another's token, a missing token and the budget all refused"


def agents_shuttle_own_agents_are_reviewed_by_another_family_and_launched_by_run():
    """The skeptic and the critic come from another provider than the lead's (a Gemini lead gets Claude); the launcher
    sends --runner loom to the loop with the preset (sub-agent models included), refuses the loom runner on the
    subscription and a sub-agent preset on the CLI runner, and the API's default preset is opus-plan (D-167)"""
    from loom.shuttle.server import Server
    with mock_env([]), lesson("P6", kit_beat="b10") as p:
        write_json(p.path("logs/shuttle/session.json"), {"lead_provider": "gemini"})
        os.environ.pop("LOOM_SHUTTLE_CRITIC", None)
        crit = Server(str(p.root)).reviewer("critic")
        from loom.agents.llm import registry as R
        assert R.model(crit)["provider"] != "gemini", crit
        write_json(p.path("logs/shuttle/session.json"), {"lead_provider": "anthropic"})
        assert R.model(Server(str(p.root)).reviewer("critic"))["provider"] != "anthropic"
        seen = []

        def fake(project, mode, lead, group, prompt, session, resume, **k):
            seen.append((RL.gkey(group), lead, (k.get("preset") or {}).get("agents")))
            RL.Rails(project).update(lambda st: st.__setitem__("stop", {"reason": "budget", "detail": "test ends", "at": RL.now()}))
            return LA.Stream(project, mode, "x", RL.gkey(group), None)

        keep = LP.run_session
        LP.run_session = fake
        os.environ["LOOM_ALLOW_NO_WEBGL"] = "1"
        try:
            LA.run(p, mode="api", runner="loom", preset="gemini-pro")
            assert seen and seen[0][1] == "gemini-3.1-pro" and seen[0][2] == {"*": "gemini-3.1-pro"}, seen
            for kw, want in (({"mode": "subscription", "runner": "loom"}, "--mode api"), ({"mode": "api", "runner": "cli", "preset": "gemini-pro"}, "only the loom runner")):
                try:
                    LA.run(p, **kw)
                    raise AssertionError(f"accepted: {kw}")
                except LoomError as e:
                    assert want in str(e), e
            assert LA.cfg()["default_preset"]["api"] == "opus-plan"
        finally:
            LP.run_session = keep
            os.environ.pop("LOOM_ALLOW_NO_WEBGL", None)
    return f"critic for a Gemini lead: {crit}; the loom runner launched with the gemini-pro preset; two refusals; api default opus-plan"
