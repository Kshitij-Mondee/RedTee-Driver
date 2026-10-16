"""Shuttle's PreToolUse hook (D-135): what an agent may not do with Claude Code's own tools.

    py -m loom.shuttle.hook --project <id> [--strict]

Claude Code runs it before every matched tool call with the call as JSON on stdin (tool_name, tool_input, cwd, and
agent_type / agent_id when a sub-agent calls). It answers on stdout with
`{"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny", "permissionDecisionReason": ...}}`
to refuse, or nothing to let the normal permissions decide. It denies:

- Write, Edit, MultiEdit and NotebookEdit into `projects/` (lesson files are written only through loom-mcp, whose tools
  run the gates), into generated files (CLAUDE.md rule 4) and into the RedTee repo (rule 6); with --strict (every
  Shuttle launch) any file write inside the engine at all;
- shell commands (Bash, PowerShell) that write into `projects/` or a generated file, that approve anything
  (`loom approve`: only a person approves, L-218) or force a render (`--force`: a person's decision, D-124); with
  --strict, any shell command;
- a loom-mcp write from a sub-agent without its owner token, or with a token from the lead's own thread.

For every loom-mcp call it also records who called (`logs/shuttle/callers/<tool_use_id>.json`): Claude Code tells hooks
the sub-agent type but not MCP servers, and the server reads the record by the id the CLI sends in `_meta`.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

from ..util import ENGINE_ROOT

GENERATED = ["runtime/catalog.json", "runtime/catalog.md", "runtime/redtee_catalog.md", "runtime/capabilities.json", "runtime/capabilities.md",
             "library/forms.json", "library/FORMS.md", "library/scenes/", "library/tasks/", "library/sheets/", "library/decisions.json",
             "docs/assets/WORLD_PACKS.md", "datasets/", ".claude/agents/shuttle-", "shuttle/build/", "assets/kept/"]
GENERATED_IN_PROJECT = ("build/", "audio/", "qa/")
FILE_TOOLS = ("Write", "Edit", "MultiEdit", "NotebookEdit")
SHELL_TOOLS = ("Bash", "PowerShell")
WRITE_VERBS = re.compile(r"(>>?|\btee\b|\bcp\b|\bmv\b|\brm\b|\bdel\b|\brmdir\b|\bsed\s+-i|\btouch\b|\bmkdir\b|Set-Content|Add-Content|Out-File|"
                         r"New-Item|Remove-Item|Copy-Item|Move-Item|Rename-Item|write_text|write_bytes|open\([^)]*['\"][wax]\+?['\"]|shutil\.)", re.I)


def _rel(path: str, cwd: str) -> str | None:
    """The engine-relative path (forward slashes), or None when outside the engine."""
    p = Path(path)
    if not p.is_absolute():
        p = Path(cwd or ENGINE_ROOT) / p
    try:
        return p.resolve().relative_to(ENGINE_ROOT.resolve()).as_posix()
    except ValueError:
        return None


def _generated(rel: str) -> bool:
    if any(rel == g or (g.endswith("/") and rel.startswith(g)) or (g.endswith("-") and rel.startswith(g)) for g in GENERATED):
        return True
    parts = rel.split("/")
    return len(parts) > 3 and parts[0] == "projects" and (parts[2] + "/") in GENERATED_IN_PROJECT


def decide(event: dict, strict: bool = False) -> str | None:
    """The reason to deny this call, or None."""
    tool = event.get("tool_name") or ""
    ti = event.get("tool_input") or {}
    cwd = event.get("cwd") or str(ENGINE_ROOT)
    if tool in FILE_TOOLS:
        path = ti.get("file_path") or ti.get("notebook_path") or ti.get("path") or ""
        p = Path(path) if path else None
        if p is not None and not p.is_absolute():
            p = Path(cwd) / p
        if p is not None and "redtee_v1_video" in str(p).lower().replace("\\", "/"):
            return "the RedTee_V1_Video repo is read-only from Loom (CLAUDE.md rule 6)"
        rel = _rel(path, cwd) if path else None
        if rel is None:
            return None      # outside the engine (a scratch file): not Loom's to police
        if rel.startswith("projects/"):
            return (f"{rel}: lesson files are written only through the loom tools (submit_*, patch_*), which run the gates; "
                    "never with Write or Edit")
        if _generated(rel):
            return f"{rel} is generated: never edited by hand (CLAUDE.md rule 4); change its source and regenerate it"
        if strict:
            return f"{rel}: a Shuttle session writes nothing in the engine except through the loom tools"
        return None
    if tool in SHELL_TOOLS:
        cmd = str(ti.get("command") or "")
        low = cmd.lower().replace("\\", "/")
        if re.search(r"\bloom\s+approve\b", low):
            return "only a person approves (py -m loom approve is theirs, L-218): call request_approval and end the session"
        if re.search(r"\brender\b", low) and "--force" in low:
            return "a forced render is a person's decision (D-124), never an agent's"
        if strict:
            return "a Shuttle session has no shell: everything goes through the loom tools"
        writes = WRITE_VERBS.search(cmd)
        if writes and ("projects/" in low or any(g.rstrip("-/") in low for g in GENERATED)):
            return "this command writes into a lesson or a generated file: lesson files change only through the loom tools"
        return None
    if tool.startswith("mcp__loom__"):
        name = tool[len("mcp__loom__"):]
        from .rails import TOOLS
        kind, _, who = TOOLS.get(name, ("?", None, "?"))
        agent = event.get("agent_type")
        if who == "token" and agent and not ti.get("owner"):
            return f"{name}: pass your owner token as `owner` (the brief from the lead names it)"
        if ti.get("owner") and not agent:
            return "an owner token is for the sub-agent it was given to: the lead spawns that sub-agent with the Agent tool"
    return None


def project_dir(project: str | None) -> Path | None:
    """A lesson folder from --project: a path holding project.json, or an id under projects/."""
    if not project:
        return None
    p = Path(project)
    return p if (p / "project.json").exists() else ENGINE_ROOT / "projects" / project


def record_caller(event: dict, project: str | None):
    """Who called this loom tool, for the server (keyed by the tool-use id the CLI also sends in the call's _meta)."""
    uid = event.get("tool_use_id")
    if not (project and uid and str(event.get("tool_name", "")).startswith("mcp__loom__")) or not re.fullmatch(r"[A-Za-z0-9_\-]{6,80}", uid):
        return
    d = project_dir(project) / "logs" / "shuttle" / "callers"
    d.mkdir(parents=True, exist_ok=True)
    (d / f"{uid}.json").write_text(json.dumps({"agent_type": event.get("agent_type"), "agent_id": event.get("agent_id"),
                                               "tool": event.get("tool_name"), "session": event.get("session_id")}), encoding="utf-8")


def main(argv=None):
    import argparse
    ap = argparse.ArgumentParser(description="Shuttle's PreToolUse hook")
    ap.add_argument("--project")
    ap.add_argument("--strict", action="store_true")
    a = ap.parse_args(argv)
    raw = sys.stdin.buffer.read().decode("utf-8", errors="replace")
    try:
        event = json.loads(raw or "{}")
    except json.JSONDecodeError:
        event = {}
    why = decide(event, strict=a.strict)
    if not why:
        try:
            record_caller(event, a.project)
        except Exception:  # noqa: BLE001  (a record that cannot be written only costs the cross-check)
            pass
        return 0
    sys.stdout.write(json.dumps({"hookSpecificOutput": {"hookEventName": "PreToolUse", "permissionDecision": "deny",
                                                        "permissionDecisionReason": why}}))
    if a.project:
        try:
            f = project_dir(a.project) / "logs" / "shuttle" / "hook_denials.jsonl"
            f.parent.mkdir(parents=True, exist_ok=True)
            with open(f, "a", encoding="utf-8") as fh:
                fh.write(json.dumps({"tool": event.get("tool_name"), "agent": event.get("agent_type"), "why": why}) + "\n")
        except Exception:  # noqa: BLE001
            pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
