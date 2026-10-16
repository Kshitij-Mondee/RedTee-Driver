"""API mode through the Claude Agent SDK for Python (D-135; `py -m loom shuttle run <id> --mode api --runner sdk`).

UNVERIFIED: the SDK is not installed on this PC (its download needs Kshitij's approval). Written against its documented
interface (docs/research/2026-10-08-shuttle-platform.md): `query(prompt, options)` with `ClaudeAgentOptions(mcp_servers,
agents, hooks, allowed_tools, disallowed_tools, permission_mode, max_turns, max_budget_usd, append_system_prompt or
system_prompt preset, setting_sources, cwd, env, resume)`, messages `SystemMessage` (init), `AssistantMessage` (model,
usage, parent_tool_use_id), `ResultMessage` (total_cost_usd, usage, model_usage, session_id).

The SDK drives the same `claude` binary over the same stream-json (its transport is a subprocess), so the default API
runner is the CLI with the key (`launch.run(..., runner="cli")`), which is the path S0 proves. This runner exists for
running Shuttle where only Python is wanted; it reuses the launcher's configs, sub-agent definitions, the same Stream
parser and the same rails, and it is not the default until a run proves it.
"""
from __future__ import annotations

import asyncio
import dataclasses
import json
import uuid

from ..util import LoomError, info
from . import agents as AG
from . import launch as LA
from . import rails as RL


def available() -> bool:
    try:
        import claude_agent_sdk  # noqa: F401
        return True
    except ImportError:
        return False


def _as_dict(msg) -> dict:
    """An SDK message as the stream-json dict the launcher's Stream reads."""
    d = dataclasses.asdict(msg) if dataclasses.is_dataclass(msg) else dict(msg)
    name = type(msg).__name__
    if name == "SystemMessage":
        return dict(d.get("data") or {}, type="system", subtype=d.get("subtype"))
    if name == "AssistantMessage":
        return {"type": "assistant", "parent_tool_use_id": d.get("parent_tool_use_id"),
                "message": {"id": d.get("message_id"), "model": d.get("model"), "usage": d.get("usage"),
                            "content": [dict(b, type="tool_use") if "input" in b else b for b in d.get("content") or []]}}
    if name == "ResultMessage":
        return dict(d, type="result", modelUsage=d.get("model_usage"))
    return dict(d, type=name)


def run(project, mode, lead, approve_as, until, env_extra=None, server_env=None) -> int:
    if mode != "api":
        raise LoomError("the SDK runner is for API mode; subscription mode runs the CLI")
    if not available():
        raise LoomError("the Claude Agent SDK is not installed (pip install claude-agent-sdk): ask Kshitij before downloading it; "
                        "meanwhile `--runner cli` runs API mode through the same engine")
    from claude_agent_sdk import AgentDefinition, ClaudeAgentOptions, query
    agents = {k: AgentDefinition(**{f: v for f, v in d.items() if f in ("description", "prompt", "tools", "model", "maxTurns", "effort")})
              for k, d in AG.sdk_definitions().items()}
    rl = RL.Rails(project)
    env = LA.child_env("api", env_extra)
    while True:
        s = rl.status()
        cur = s["current"]
        if s["stop"]:
            return LA.EXIT["budget"]
        if cur is None or (until and RL.idx(cur) > RL.idx(until)):
            LA.write_report(project)
            return LA.EXIT["done"]
        if s["waiting"]:
            LA.write_report(project)
            return LA.EXIT["waiting"]
        group = LA.group_of(cur)
        gname = RL.gkey(group)
        files = LA.write_configs(project, lead, approve_as, server_env, session=gname)    # this session's tools (D-148)
        left = rl.budget_status()["left"].get("usd")
        opts = ClaudeAgentOptions(
            mcp_servers=str(files["mcp"]), strict_mcp_config=True, agents=agents, model=lead, cwd=str(LA.ENGINE_ROOT), env=env,
            allowed_tools=["mcp__loom", "Read", "Glob", "Grep", "Agent"], disallowed_tools=LA.DENY_TOOLS, permission_mode="dontAsk",
            max_turns=int(LA.cfg().get("max_turns_per_session", 120)), max_budget_usd=left, setting_sources=["project"],
            system_prompt={"type": "preset", "preset": "claude_code", "append": LA.lead_prompt()},
            extra_args={"settings": str(files["settings"])})
        stream = LA.Stream(project, "api", "ANTHROPIC_API_KEY", gname)
        info(f"[shuttle] {gname}: Agent SDK (api, lead {lead})")

        async def go():
            async for m in query(prompt=LA.start_message(project, group, LA.approval_notes(project)), options=opts):
                stream.line(json.dumps(_as_dict(m), default=str))
                if stream.killed:
                    break
        asyncio.run(go())
        if stream.limit:
            return LA.EXIT["credit"]
        if stream.killed and not rl.load().get("stop") and not stream.killed.startswith("session over"):
            return LA.EXIT["failed"]
        if rl.current() == cur and not rl.status()["waiting"] and not rl.load().get("stop") and not stream.killed:
            return LA.EXIT["failed"]
