"""Shuttle (D-135): one lead agent owns a lesson from idea to film, on rails the engine enforces.

Relay (`loom/agents/conductor.py`) runs fixed stages through separate role agents; Shuttle gives the whole lesson to one
lead that follows a playbook (`skills/loom/shuttle-director`), delegates focused work to sub-agents (`shuttle/agents/`),
looks at its own frames and goes back when something is wrong. The engine decides what counts as done:

- `rails.py`: the lesson state machine (phases P1 to P11, gates, approvals, reopen, budget, file ownership);
- `server.py`: loom-mcp, the MCP stdio server whose tools check the rails first and reuse `loom/agents/tools.py`;
- `hook.py`: the PreToolUse hook that denies file writes outside loom-mcp;
- `agents.py`: the sub-agent definitions, one source, emitted for Claude Code and for the Agent SDK;
- `launch.py`: `py -m loom shuttle run|resume|status|report`, through `claude -p` (subscription or API key).

Design: docs/strategy/2026-10-08-shuttle-pipeline.md. Platform notes: docs/research/2026-10-08-shuttle-platform.md.
"""
