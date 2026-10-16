"""Shuttle's launchers (D-135): `py -m loom shuttle run|resume|status|report|agents`.

One lead agent per lesson, run by Claude Code headless (`claude -p`): P1 to P4 and P5 to P6 in one session each, then
one session per phase (config.json `session_split`: "mixed" since L-373; "phase" for one per phase, D-148; "group"
for the first split, P1-P4, P5-P6, P7-P9, P10-P11, design section 4). Each session starts
from the playbook (`--append-system-prompt-file`), the lesson's notes (`logs/shuttle/notes.md`) and loom-mcp listing
only that session's tools; nothing of an earlier transcript is carried.

Two billing modes, one engine (docs/research/2026-10-08-shuttle-platform.md):
- **subscription**: the child environment has no ANTHROPIC_* variable at all, so Claude Code uses the person's
  claude.ai login. The run is refused before any model call when the CLI's init message reports another key source.
- **api**: the same `claude -p`, with ANTHROPIC_API_KEY from .env and `--max-budget-usd` as a backstop under Shuttle's
  own budget. (The Python Agent SDK drives this same binary over the same stream; `--runner sdk` uses it when it is
  installed: `loom/shuttle/sdk_runner.py`.)

Every assistant message in the stream becomes a line in `logs/llm_calls.jsonl` and `logs/shuttle/calls.jsonl` (real
model, tokens, cache reads and writes, USD at the engine's price table: notional in subscription mode); the session's
init and result go to `logs/shuttle/trace.jsonl`. Exit codes as Relay: 0 done, 2 failed, 3 waiting for a person,
4 budget, 5 out of credit or usage limit.
"""
from __future__ import annotations

import json
import os
import subprocess
import sys
import threading
import time
import uuid
from pathlib import Path

from ..util import ENGINE_ROOT, LoomError, info, read_json, which, write_json
from . import agents as AG
from . import rails as RL

PLAYBOOK = ENGINE_ROOT / "skills" / "loom" / "shuttle-director" / "SKILL.md"
CONFIG = ENGINE_ROOT / "loom" / "shuttle" / "config.json"
KEEP_ENV = {"CLAUDE_CODE_GIT_BASH_PATH"}
DENY_TOOLS = ["Write", "Edit", "MultiEdit", "NotebookEdit", "Bash", "PowerShell", "WebFetch", "WebSearch"]
EXIT = {"done": 0, "failed": 2, "waiting": 3, "budget": 4, "credit": 5}
# a check or a render runs minutes inside one tool call: loom-mcp's calls may take an hour (Claude Code reads a per-server
# `timeout` in ms, else MCP_TOOL_TIMEOUT; seen in CLI 2.1.283)
TOOL_TIMEOUT_MS = 3600000
# lead messages a session may still send once its phases are behind it (the handoff note, collecting the last tokens, the
# summary) before the launcher ends it (D-148)
PAST_WINDOW = 6
LIMIT_WORDS = ("usage limit", "rate limit", "rate_limit", "credit balance", "billing", "quota", "out of credit", "limit reached")


def cfg() -> dict:
    return read_json(CONFIG, {}) or {}


# ------------------------------------------------------------------ the child environment
def child_env(mode: str, extra: dict | None = None) -> dict:
    """The environment `claude -p` runs in. Everything Claude-specific inherited from the shell or from a Claude Code
    session that launched us is dropped (a launch from inside one inherited ANTHROPIC_BASE_URL, CLAUDE_CODE_SIMPLE and
    CLAUDE_AGENT_SDK_MCP_NO_PREFIX, 2026-10-08), and so is every ANTHROPIC_* key: subscription mode must not find one."""
    env = {k: v for k, v in os.environ.items()
           if not (k.startswith("ANTHROPIC_") or k == "CLAUDECODE" or (k.startswith("CLAUDE") and k not in KEEP_ENV))}
    if mode == "api":
        from ..agents.llm.base import env_value   # environment first, then the engine's .env
        key = env_value("ANTHROPIC_API_KEY")
        if not key:
            raise LoomError("api mode needs ANTHROPIC_API_KEY (in the environment or .env)")
        env["ANTHROPIC_API_KEY"] = key
    env["CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC"] = "1"
    env["MCP_TOOL_TIMEOUT"] = str(TOOL_TIMEOUT_MS)
    # CLI 2.1.283 runs agents in the background by default and may move a long MCP call to the background: the lead
    # must wait for its sub-agents' results, and a check or render must finish inside its tool call (S0, 2026-10-08)
    env["CLAUDE_CODE_DISABLE_BACKGROUND_TASKS"] = "1"
    env["CLAUDE_CODE_DISABLE_MCP_TASK_BACKGROUND"] = "1"
    env.setdefault("MCP_TIMEOUT", "60000")
    env["PYTHONIOENCODING"] = "utf-8"
    env["LOOM_SHUTTLE"] = "1"
    env.update(extra or {})
    return env


def expected_key_source(mode: str, env: dict) -> str:
    if mode == "api" or env.get("ANTHROPIC_API_KEY"):
        return "ANTHROPIC_API_KEY"
    return "none"


# ------------------------------------------------------------------ files the CLI reads
# the phases that plan or build pictures: only their sessions carry the toolbox menu (D-148: a tool is chosen in the
# storyboard and used in the kit, the beats and their fixes; P1 to P4 and P11 never pick one)
MENU_PHASES = ("P5", "P10")
# Claude Code's own sub-agents (CLI 2.1.283 lists them in every session's start): the lead never spawns them, so each
# session denies them, with the Shuttle sub-agents that cannot work in its phases (D-148)
BUILTIN_AGENTS = ("claude", "Explore", "general-purpose", "Plan", "statusline-setup")


def _overlaps(window: tuple | None, lo: str, hi: str) -> bool:
    return window is None or not (RL.idx(window[1]) < RL.idx(lo) or RL.idx(window[0]) > RL.idx(hi))


def lead_prompt(window: tuple | None = None) -> str:
    """The lead's appended system prompt: the playbook, then the toolbox menu (D-137) from docs/TOOLBOX.md, the same
    menu Relay's storyboard, scene, clip, kit and tweak roles carry (LOOM_TOOLBOX=off leaves it out, for an A/B). With a
    session `window` (first, last phase), the menu is only in sessions that plan or build pictures (MENU_PHASES)."""
    from .. import toolbox as TB
    text = PLAYBOOK.read_text(encoding="utf-8").rstrip()
    if TB.enabled() and _overlaps(window, *MENU_PHASES):
        text += "\n\n## The toolbox (load a tool's section with use_tool)\n" + TB.menu()
    return text + "\n"


def agent_denies(window: tuple | None) -> list:
    """Agent types a session's lead may not spawn: Claude Code's own, and Shuttle sub-agents outside the window."""
    out = [f"Agent({a})" for a in BUILTIN_AGENTS]
    if window:
        for a in AG.load().values():
            if "any" not in a["phases"] and not any(_overlaps(window, ph, ph) for ph in a["phases"]):
                out.append(f"Agent({AG.PREFIX}{a['name']})")
    return out


LEAD_ISOLATION = {"claudeMdExcludes": ["**/.claude/CLAUDE.md", "**/.claude/rules/**", "**/CLAUDE.local.md"], "autoMemoryEnabled": False}


def write_configs(project, lead_model: str, approve_as: str | None, server_env: dict | None = None, session: str | None = None) -> dict:
    """The CLI's files for one session. `session` ("P8", "P7-P9") makes loom-mcp list only that session's tools."""
    py = Path(sys.executable).as_posix()
    d = project.path("logs/shuttle")
    d.mkdir(parents=True, exist_ok=True)
    senv = {"LOOM_SHUTTLE_LEAD_MODEL": lead_model, "PYTHONIOENCODING": "utf-8", "PYTHONUTF8": "1"}
    if session:
        senv["LOOM_SHUTTLE_SESSION"] = session
    if approve_as:
        senv["LOOM_SHUTTLE_APPROVE_AS"] = approve_as
    senv.update(server_env or {})
    mcp = d / "mcp.json"
    write_json(mcp, {"mcpServers": {"loom": {"type": "stdio", "command": py, "args": ["-m", "loom.shuttle.server", "--project", project.root.as_posix()],
                                             "env": senv, "timeout": TOOL_TIMEOUT_MS}}})
    hook = f'"{py}" -m loom.shuttle.hook --project "{project.root.as_posix()}" --strict'
    settings = d / "settings.json"
    window = RL.parse_range(session) if session else None
    write_json(settings, {"hooks": {"PreToolUse": [{"matcher": "Write|Edit|MultiEdit|NotebookEdit|Bash|PowerShell|mcp__loom__.*",
                                                    "hooks": [{"type": "command", "command": hook, "timeout": 30}]}]},
                          "permissions": {"deny": DENY_TOOLS + agent_denies(window)},
                          # the lead reads the engine's CLAUDE.md (meant for it) and nothing of the person's: their global
                          # ~/.claude/CLAUDE.md (found walking up from the engine folder) and the auto-memory of the person's
                          # own sessions in this folder stay out (L-316's OPEN for Shuttle, closed 2026-10-08)
                          **LEAD_ISOLATION})
    AG.emit_claude()
    sdk = AG.emit_sdk()
    playbook = d / "playbook.md"
    playbook.write_text(lead_prompt(window), encoding="utf-8")
    return {"mcp": mcp, "settings": settings, "agents": sdk, "playbook": playbook}


def command(claude: str, files: dict, lead: str, mode: str, session: str, resume: bool, max_turns: int, budget_left: float | None) -> list:
    builtin = [t for t in cfg().get("allowed_builtin_tools", ["Read", "Glob", "Grep", "Agent", "Task"])]
    # --include-partial-messages: the raw message_delta carries a message's final output tokens; the assistant events repeat
    # the count from the message's start (S1, 2026-10-08: 5 tokens for a message with four tool calls)
    cmd = [claude, "-p", "--output-format", "stream-json", "--verbose", "--include-partial-messages", "--model", AG.model_id(lead),
           "--mcp-config", str(files["mcp"]), "--strict-mcp-config", "--settings", str(files["settings"]), "--setting-sources", "project",
           "--append-system-prompt-file", str(files.get("playbook") or PLAYBOOK), "--permission-mode", "dontAsk", "--max-turns", str(max_turns),
           "--tools", ",".join(t for t in builtin if t != "Task"),
           "--allowedTools", "mcp__loom", *builtin, "--disallowedTools", *DENY_TOOLS]
    cmd += ["--resume", session] if resume else ["--session-id", session]
    if mode == "api" and budget_left is not None:
        cmd += ["--max-budget-usd", f"{max(0.01, budget_left):.2f}"]
    return cmd


# ------------------------------------------------------------------ the stream: usage into the ledger, guards
class Stream:
    """Reads Claude Code's stream-json: logs every model call with its real model, watches the rails (budget stop,
    waiting) and the key source."""

    def __init__(self, project, mode: str, expect_source: str, group: str, proc=None, role: str | None = None):
        self.p, self.mode, self.expect, self.group, self.proc, self.role = project, mode, expect_source, group, proc, role
        self.rails = RL.Rails(project)
        self.msgs: dict = {}               # message id -> {model, usage, agent}
        self.flushed: set = set()
        self.agent_of: dict = {}           # Agent tool_use id -> sub-agent type
        self.init: dict | None = None
        self.result: dict | None = None
        self.limit: str | None = None
        self.limit_from: str | None = None     # "rate" (a rate-limit event) or "result" (the session's error)
        self.killed: str | None = None
        self.after_wait = 0
        self.last_id = None
        self.cache_misses = 0
        self.current: dict = {}            # parent_tool_use_id (or None for the lead) -> the message id being streamed
        self.session_usd = 0.0
        # the session's phases (D-148): once they are behind it (accepted, or an earlier phase reopened), the lead has a few
        # messages for its handoff note and summary, then the session ends and the next phase starts fresh
        self.window = RL.parse_range(group)
        self.past_window = 0
        self.lead_seen: set = set()
        try:
            self.reopens0 = len(self.rails.load().get("reopens") or [])
        except Exception:  # noqa: BLE001
            self.reopens0 = 0

    def _phase(self) -> str | None:
        """The rails' current phase for a cost row; a failure to work it out never stops the stream (a compose rewriting the
        build under the status check killed the measured run's launcher and left its session unguarded, L-350)."""
        try:
            return self.rails.current()
        except Exception as e:  # noqa: BLE001
            self.rails.trace("phase_unknown", group=self.group, error=f"{type(e).__name__}: {str(e)[:200]}")
            return None

    def kill(self, why: str):
        if self.killed:
            return
        self.killed = why
        self.rails.trace("session_killed", why=why, group=self.group)
        if self.proc and self.proc.poll() is None:
            try:
                self.proc.terminate()
            except Exception:  # noqa: BLE001
                pass

    def price(self, model: str) -> dict | None:
        from ..agents.llm import registry as R
        ms = R.models()
        for alias, m in ms.items():
            if m.get("id") == model or alias == model:
                return dict(m, alias=alias)
        fam = next((f for f in ("opus", "sonnet", "haiku") if f in (model or "")), None)
        pick = {"opus": "claude-opus-5-5", "sonnet": "claude-sonnet-5-5", "haiku": "claude-haiku-4-5"}.get(fam)
        return dict(ms[pick], alias=pick, approx=True) if pick in ms else None

    def flush(self, mid: str):
        from ..agents.llm import registry as R
        from ..agents.llm.types import Usage
        if mid in self.flushed or mid not in self.msgs:
            return
        self.flushed.add(mid)
        m = self.msgs[mid]
        if m.get("model") == "<synthetic>":      # Claude Code's own placeholder (an error or a stop notice), not a model call
            self.rails.trace("synthetic_message", group=self.group, agent=m.get("agent") or "lead")
            return
        u = m.get("usage") or {}
        cache_read = int(u.get("cache_read_input_tokens") or 0)
        cw = int(u.get("cache_creation_input_tokens") or 0)
        cw1h = int(((u.get("cache_creation") or {}).get("ephemeral_1h_input_tokens")) or 0)
        inp = int(u.get("input_tokens") or 0) + cache_read + cw
        out = max(int(u.get("output_tokens") or 0), int(m.get("final_output") or 0))
        us = Usage(input=inp, cached=cache_read, cache_write=cw, output=out, cache_write_1h=cw1h)
        pm = self.price(m.get("model") or "")
        usd = R.cost(pm, us) if pm else 0.0
        if m.get("seq", 0) > 1 and inp > 2048 and cache_read == 0:
            self.cache_misses += 1
        cur = self._phase()
        rec = {"at": time.strftime("%Y-%m-%dT%H:%M:%S"), "pipeline": "shuttle", "mode": self.mode, "group": self.group, "phase": cur,
               "agent": m.get("agent") or "lead", "role": f"shuttle {m.get('agent') or 'lead'}", "provider": "anthropic", "model": m.get("model"),
               "input": inp, "cached": cache_read, "cache_write": cw, "cache_write_1h": cw1h, "output": us.output, "usd": round(usd, 6),
               "notional": self.mode != "api", "priced_as": (pm or {}).get("alias"), "session": (self.init or {}).get("session_id"), "msg": mid,
               "project": self.p.id}
        for f in (self.p.path("logs/shuttle/calls.jsonl"), self.p.path("logs/llm_calls.jsonl")):
            f.parent.mkdir(parents=True, exist_ok=True)
            with open(f, "a", encoding="utf-8") as fh:
                fh.write(json.dumps(rec, ensure_ascii=False) + "\n")
        sess = read_json(self.p.path("logs/shuttle/session.json"), {}) if self.p.path("logs/shuttle/session.json").exists() else {}
        if m.get("agent"):
            sess.setdefault("agents", {})[m["agent"]] = m.get("model")
        else:
            sess["lead_model"] = m.get("model")
        write_json(self.p.path("logs/shuttle/session.json"), sess)

    def reconcile(self, result: dict):
        """The CLI's own figures for the session against the rows this session has (a resumed session's figures are
        cumulative, and so are its rows). With per-model token counts (`modelUsage`), the token gap of each model is
        written as reconcile rows priced from the engine's table, shared among the agents that used the model by their
        logged input (`estimated` when more than one): sub-agent messages arrive without their final output count (Opus
        run: 2,795 Sonnet output tokens logged against the CLI's 1,344,736, L-323). The CLI's own cost per model is kept
        in the trace beside the table's. Without token counts, one row for the gap in the session total, as before."""
        from collections import Counter
        from ..agents.llm import registry as R
        from ..agents.llm.types import Usage
        sess = (self.init or {}).get("session_id")
        rows = [r for r in _jsonl(self.p.path("logs/shuttle/calls.jsonl")) if r.get("session") == sess and r.get("pipeline") == "shuttle"]
        mine = sum(float(r.get("usd") or 0) for r in rows)
        total = float(result.get("total_cost_usd") or 0)
        mu = {k: v for k, v in (result.get("modelUsage") or {}).items() if isinstance(v, dict) and "outputTokens" in v}
        if mu:
            audit, out_rows = {}, []
            for model, u in mu.items():
                have_rows = [r for r in rows if r.get("model") == model]
                want = {"input": int(u.get("inputTokens") or 0) + int(u.get("cacheReadInputTokens") or 0) + int(u.get("cacheCreationInputTokens") or 0),
                        "cached": int(u.get("cacheReadInputTokens") or 0), "cache_write": int(u.get("cacheCreationInputTokens") or 0),
                        "output": int(u.get("outputTokens") or 0)}
                have = {k: sum(int(r.get(k) or 0) for r in have_rows) for k in want}
                gap = {k: max(0, want[k] - have[k]) for k in want}
                audit[model] = {"cli_usd": u.get("costUSD"), "rows_usd": round(sum(float(r.get("usd") or 0) for r in have_rows), 6), "gap_tokens": gap}
                if not any(gap.values()):
                    continue
                weights = Counter()
                for r in have_rows:
                    if not r.get("reconcile"):
                        weights[r.get("agent") or "lead"] += int(r.get("input") or 0) or 1
                if not weights:
                    weights["lead" if model == (self.init or {}).get("model") else "sub-agents"] = 1
                tot, pm = sum(weights.values()), self.price(model)
                for agent, w in sorted(weights.items()):
                    g = {k: int(round(v * w / tot)) for k, v in gap.items()}
                    us = Usage(input=g["input"], cached=g["cached"], cache_write=g["cache_write"], output=g["output"])
                    out_rows.append({"at": time.strftime("%Y-%m-%dT%H:%M:%S"), "pipeline": "shuttle", "mode": self.mode, "group": self.group,
                                     "phase": self._phase(), "agent": agent, "role": f"shuttle {agent} (reconcile)", "provider": "anthropic",
                                     "model": model, "input": g["input"], "cached": g["cached"], "cache_write": g["cache_write"], "cache_write_1h": 0,
                                     "output": g["output"], "usd": round(R.cost(pm, us), 6) if pm else 0.0, "notional": self.mode != "api",
                                     "priced_as": (pm or {}).get("alias"), "reconcile": True, "estimated": len(weights) > 1, "session": sess,
                                     "project": self.p.id, "note": "the CLI's per-model tokens for the session minus the rows"})
            for out in (self.p.path("logs/shuttle/calls.jsonl"), self.p.path("logs/llm_calls.jsonl")):
                with open(out, "a", encoding="utf-8") as fh:
                    for rec in out_rows:
                        fh.write(json.dumps(rec, ensure_ascii=False) + "\n")
            self.rails.trace("reconcile", group=self.group, session=sess, cli_usd=total, rows_usd=round(mine, 6),
                             table_usd=round(mine + sum(r["usd"] for r in out_rows), 6), per_model=audit, rows_added=len(out_rows))
            return
        gap = round(total - mine, 6)
        self.rails.trace("reconcile", group=self.group, session=sess, cli_usd=total, rows_usd=round(mine, 6), gap=gap)
        if gap > max(0.001, 0.01 * total):
            rec = {"at": time.strftime("%Y-%m-%dT%H:%M:%S"), "pipeline": "shuttle", "mode": self.mode, "group": self.group,
                   "phase": self._phase(), "agent": "reconcile", "role": "shuttle reconcile", "provider": "anthropic",
                   "model": ",".join(sorted((result.get("modelUsage") or {}).keys())) or None, "input": 0, "cached": 0, "cache_write": 0,
                   "output": 0, "usd": gap, "notional": self.mode != "api", "reconcile": True, "session": sess, "project": self.p.id,
                   "note": "the CLI's session total minus the per-message rows (stream usage undercounts output)"}
            for out in (self.p.path("logs/shuttle/calls.jsonl"), self.p.path("logs/llm_calls.jsonl")):
                with open(out, "a", encoding="utf-8") as fh:
                    fh.write(json.dumps(rec, ensure_ascii=False) + "\n")

    def guards(self):
        """The budget, stop and waiting guards. A failure to read the state is traced and tried again on the next message:
        an exception here ended the launcher and left the session unguarded (S0, 2026-10-09, as L-350)."""
        try:
            self._guards()
        except Exception as e:  # noqa: BLE001
            self.rails.trace("guard_unread", group=self.group, error=f"{type(e).__name__}: {str(e)[:200]}")

    def _guards(self):
        st = self.rails.load()
        if st.get("stop"):
            self.kill(f"rails stop: {st['stop'].get('reason')}")
            return
        over = self.rails.over_budget(st)
        if over:
            self.rails.update(lambda s: s.__setitem__("stop", {"reason": "budget", "detail": over, "at": RL.now()}))
            self.rails.trace("budget_stop", detail=over, by="launcher")
            self.kill(f"budget: {over}")
            return
        if st.get("waiting"):
            self.after_wait += 1
            if self.after_wait > 3:        # told to stop and still going: end the session for it
                self.kill("waiting for a person; the lead kept going")

    def window_guard(self):
        """Called on each new lead message. A session whose phases are behind it ends after PAST_WINDOW more lead messages:
        its last phase is accepted (the next phase gets its own session and tools), or it reopened a phase before its first
        (that phase's work is done in that phase's session). Moving back inside the window (a fixer's draft makes P8 open
        again during P9) is not leaving it."""
        if not self.window or self.killed:
            return
        try:
            st = self.rails.load()
            cur = self.rails.current()
        except Exception as e:  # noqa: BLE001  (a build rewritten mid-hash: decide on the next message, L-350)
            self.rails.trace("phase_unknown", group=self.group, error=f"{type(e).__name__}: {str(e)[:200]}")
            return
        first, last = self.window
        done = cur is None or RL.idx(cur) > RL.idx(last)
        fp = (st.get("fix_plan") or {}).get("status")
        # a P10 judge is done once it has planned the fixes; a fix round once it has reported them done (L-374)
        done = done or (self.role == "judge" and fp == "open") or (self.role == "fix" and fp == "done")
        back = [r for r in (st.get("reopens") or [])[self.reopens0:] if RL.idx(r["phase"]) < RL.idx(first)]
        if not (done or back):
            return
        self.past_window += 1
        if self.past_window > PAST_WINDOW:
            why = ((f"the P10 {self.role}'s part is done" if self.role and cur is not None and RL.idx(cur) <= RL.idx(last) else f"{self.group} is accepted")
                   if done else f"{back[-1]['phase']} was reopened") + "; the next session takes it from here"
            self.kill(f"session over: {why}")

    def line(self, raw: str):
        try:
            d = json.loads(raw)
        except json.JSONDecodeError:
            return
        t = d.get("type")
        if t == "system" and d.get("subtype") == "init":
            self.init = d
            srv = {s.get("name"): s.get("status") for s in d.get("mcp_servers") or []}
            self.rails.trace("session_init", group=self.group, session=d.get("session_id"), model=d.get("model"), key_source=d.get("apiKeySource"),
                             tools=len(d.get("tools") or []), mcp=srv, agents=[a for a in d.get("agents") or [] if a.startswith(AG.PREFIX)],
                             version=d.get("claude_code_version"), permission=d.get("permissionMode"))
            sess = read_json(self.p.path("logs/shuttle/session.json"), {}) if self.p.path("logs/shuttle/session.json").exists() else {}
            sess.update({"session_id": d.get("session_id"), "lead_model": d.get("model"), "key_source": d.get("apiKeySource"), "mode": self.mode,
                         "lead_alias": (read_json(self.rails.file, {}).get("run") or {}).get("lead") if self.rails.file.exists() else None})
            write_json(self.p.path("logs/shuttle/session.json"), sess)
            if (d.get("apiKeySource") or "none") != self.expect:
                self.kill(f"key source is {d.get('apiKeySource')!r}, expected {self.expect!r} for {self.mode} mode: stopped before any model call")
            elif srv.get("loom") not in ("connected", None):
                self.kill(f"loom-mcp did not connect ({srv.get('loom')})")
        elif t == "assistant":
            msg = d.get("message") or {}
            mid = msg.get("id") or uuid.uuid4().hex
            par = d.get("parent_tool_use_id")
            if self.last_id and self.last_id != mid:
                self.flush(self.last_id)
                self.guards()
            if par is None and mid not in self.lead_seen:
                self.lead_seen.add(mid)
                self.window_guard()
            self.last_id = mid
            rec = self.msgs.setdefault(mid, {"seq": len(self.msgs) + 1})
            rec.update(model=msg.get("model"), usage=msg.get("usage") or rec.get("usage"), agent=self.agent_of.get(par) if par else None)
            if rec.get("agent") and msg.get("model") not in (None, "<synthetic>"):
                # the sub-agent's model, recorded at its first message: its tool calls reach loom-mcp before this message is
                # flushed, and the server names the real model from here (S0: the fact-finder's first call said "sonnet")
                sp = self.p.path("logs/shuttle/session.json")
                sess = read_json(sp, {}) if sp.exists() else {}
                if (sess.get("agents") or {}).get(rec["agent"]) != msg["model"]:
                    sess.setdefault("agents", {})[rec["agent"]] = msg["model"]
                    write_json(sp, sess)
            for b in msg.get("content") or []:
                if b.get("type") == "tool_use" and b.get("name") in ("Agent", "Task"):
                    self.agent_of[b.get("id")] = (b.get("input") or {}).get("subagent_type") or "sub-agent"
        elif t == "stream_event":
            ev = d.get("event") or {}
            par = d.get("parent_tool_use_id")
            if ev.get("type") == "message_start":
                self.current[par] = (ev.get("message") or {}).get("id")
            elif ev.get("type") == "message_delta":
                mid = self.current.get(par)
                if mid:
                    self.msgs.setdefault(mid, {"seq": len(self.msgs) + 1})["final_output"] = int((ev.get("usage") or {}).get("output_tokens") or 0)
        elif t == "rate_limit_event":
            info_ = d.get("rate_limit_info") or {}
            self.rails.trace("rate_limit", info=info_, group=self.group)
            rejected = str(info_.get("status", "")).lower() in ("rejected", "blocked")
            overage = bool(info_.get("isUsingOverage") or info_.get("overageInUse"))
            if self.mode == "subscription" and (rejected or overage):
                # past the plan's limit Claude Code goes on as paid overage when the account allows it (overageStatus:
                # allowed). A subscription run stops at once, whichever way the CLI reports it: the Opus run's event was
                # status "rejected" WITH isUsingOverage, the first branch only noted it, and 118 calls billed (L-318)
                self.limit = (f"the subscription's limit is reached{' and the next calls would bill as overage' if overage else ''}: "
                              f"{json.dumps(info_)[:200]}")
                self.limit_from = "rate"
                self.kill(self.limit)
            elif rejected:
                self.limit = f"rate limit: {json.dumps(info_)[:300]}"
                self.limit_from = "rate"
            elif self.limit and self.limit_from == "rate":
                # a later event within the plan: the window has reset, so the earlier flag no longer stands (it turned
                # a finished session into exit 5 in the Opus run, L-318)
                self.rails.trace("rate_limit_cleared", group=self.group, was=self.limit[:120])
                self.limit, self.limit_from = None, None
        elif t == "result":
            if self.last_id:
                self.flush(self.last_id)
            self.result = d
            txt = " ".join(str(x) for x in [d.get("result"), d.get("errors"), d.get("terminal_reason")] if x).lower()
            if d.get("is_error") and (any(w in txt for w in LIMIT_WORDS) or d.get("api_error_status") in (402, 429)):
                self.limit = (d.get("result") or str(d.get("errors")))[:300]
                self.limit_from = "result"
            self.reconcile(d)
            self.rails.trace("session_result", group=self.group, subtype=d.get("subtype"), is_error=d.get("is_error"), turns=d.get("num_turns"),
                             cli_cost_usd=d.get("total_cost_usd"), usage=d.get("usage"), model_usage=d.get("modelUsage"),
                             terminal=d.get("terminal_reason"), result=str(d.get("result"))[:600], cache_misses=self.cache_misses,
                             duration_ms=d.get("duration_ms"))


def run_session(project, mode: str, lead: str, group: tuple, prompt: str, session: str, resume: bool, env_extra: dict | None,
                server_env: dict | None, approve_as: str | None, budget_left: float | None, claude: str | None = None,
                role: str | None = None) -> Stream:
    claude = claude or which("claude")
    if not claude:
        raise LoomError("Claude Code (`claude`) is not on PATH: install it, or run Shuttle in API mode with --runner sdk")
    env = child_env(mode, env_extra)
    gname = RL.gkey(group)
    files = write_configs(project, lead, approve_as, server_env, session=gname)
    max_turns = int(cfg().get("max_turns_per_session", 120))
    cmd = command(claude, files, lead, mode, session, resume, max_turns, budget_left)
    rl = RL.Rails(project)
    rl.trace("session_start", group=gname, mode=mode, lead=lead, resume=resume, session=session, role=role,
             cmd=[c if not c.startswith("sk-") else "<key>" for c in cmd[1:]])
    info(f"[shuttle] {gname}{' ' + role if role else ''}: claude -p ({mode}, lead {lead}){' resumed' if resume else ''}")
    proc = subprocess.Popen(cmd, cwd=str(ENGINE_ROOT), env=env, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    s = Stream(project, mode, expected_key_source(mode, env), gname, proc, role=role)
    err = []
    t = threading.Thread(target=lambda: err.extend(proc.stderr.read().decode("utf-8", "replace").splitlines()[-40:]), daemon=True)
    t.start()
    proc.stdin.write(prompt.encode("utf-8"))
    proc.stdin.close()
    raw = project.path(f"logs/shuttle/stream_{gname}.jsonl")
    try:
        with open(raw, "a", encoding="utf-8") as keep:
            for line in proc.stdout:
                text = line.decode("utf-8", "replace").rstrip("\n")
                keep.write(text + "\n")
                s.line(text)
                if s.result is not None:
                    break
    except BaseException as e:
        # the launcher is going down: never leave its claude -p running unguarded (the D-148 S0 crash left the session
        # and its loom-mcp running with no launcher; in a real run they would go on spending, L-363)
        rl.trace("launcher_error", group=gname, error=f"{type(e).__name__}: {str(e)[:300]}")
        if proc.poll() is None:
            proc.kill()
        raise
    if s.last_id:
        s.flush(s.last_id)       # a killed session (budget, waiting) never sends its result: its last call is still a call
    try:
        proc.wait(timeout=60)
    except subprocess.TimeoutExpired:
        proc.kill()
    t.join(timeout=5)
    s.stderr = err
    if proc.returncode not in (0, None) and not s.result:
        rl.trace("session_error", group=gname, code=proc.returncode, stderr=err[-10:])
    return s


# ------------------------------------------------------------------ the run
def groups(c: dict | None = None) -> list:
    """The session split (config.json `session_split`): mixed (the default, L-373), one per phase (D-148) or the groups."""
    c = cfg() if c is None else c
    return RL.SPLITS.get(c.get("session_split") or "mixed", RL.GROUPS)


def group_of(pid: str, gs: list | None = None) -> tuple:
    gs = gs or groups()
    for a, b in gs:
        if RL.idx(a) <= RL.idx(pid) <= RL.idx(b):
            return (a, b)
    return gs[-1]


NOTES_IN_START = 8000      # characters of the notes the start message carries (their last part when longer)


def status_block(project) -> str:
    """What lesson_status would say at the session's start, for the start message (L-373: each of v3's 26 sessions
    spent its first turns fetching the status and the notes)."""
    rl = RL.Rails(project)
    s, st = rl.status(), rl.load()
    rows = [f"- {r['phase']} {r['name']}: {r['status']}" + (f" (missing: {'; '.join(r['missing'][:3])})" if r["missing"] else "")
            for r in s["phases"]]
    out = ["THE LESSON NOW (lesson_status at this session's start; call it again only after work changes it):"] + rows
    toks = [f"{k} ({v['agent']} {', '.join(v.get('beats') or [])})".rstrip() for k, v in st["tokens"].items() if v["status"] == "open"]
    if toks:
        out.append("open owner tokens: " + ", ".join(toks))
    ver = [f"{b} ({why})" for _, why, b in rl.files_to_verify(st)]
    if ver:
        out.append("beats to verify (the next check decides; rewrite only if it shows an error): " + ", ".join(ver))
    out.append(f"reopens: {RL.Rails.reopen_counts(st)}")
    fp = st.get("fix_plan") or {}
    if fp:
        out.append(f"the last fix plan: {fp.get('status')}, {len(fp.get('fixes') or [])} fixes" + (f"; done: {fp['summary']}" if fp.get("summary") else ""))
    return "\n".join(out)


def notes_block(project) -> str:
    f = project.path("logs/shuttle/notes.md")
    if not f.exists():
        return "THE NOTES: none yet (keep them with note(kind='notes'))."
    t = f.read_text(encoding="utf-8")
    head = "THE NOTES (the earlier sessions' handoffs" + (", their last part; read_artifact('notes') for all" if len(t) > NOTES_IN_START else "") + "):"
    return head + "\n" + t[-NOTES_IN_START:]


ROLE_TEXT = {
    "judge": ("YOUR PART IN P10: THE JUDGE. Look at the sheets, run critic_review, and decide every finding: fix it or accept it "
              "with a reason. Hand the fixes to the build lead with plan_fixes(fixes=[{beat, finding, fix}], why) and end the "
              "session: a build-lead session delegates the fixers and runs the check, and the next judge session runs "
              "critic_review on what changed and submits the review. You do not delegate fixers or scene-authors yourself here."),
    "fix": ("YOUR PART IN P10: THE FIX ROUND for the judge's plan below. Delegate the fixes in one call (delegate(jobs=[...]), the "
            "plan's words as each brief, a join's two beats to one fixer), spawn them all in one turn, then collect(token='all') "
            "and check (it composes), round after round until the check passes; then fixes_done(summary) and end the session. "
            "You do not judge findings, run the critic or submit the review: the judge does, next session."),
}


def start_message(project, group: tuple, notes: dict, retry: str | None = None, role: str | None = None) -> str:
    a, b = group
    names = ", ".join(f"{p} {RL.NAMES[p]}" for p in RL.IDS[RL.idx(a):RL.idx(b) + 1])
    which = f"phase {names}" if a == b else f"phases {names}"
    parts = [f"SHUTTLE SESSION for lesson {project.id}: {which}. Only this session's tools are listed (and its sub-agents').",
             f"Topic: {project.cfg.get('topic')}. Request: {json.dumps(project.request, ensure_ascii=False)}",
             "The lesson's status and the notes are below: do not fetch them again to start. Work by your playbook (the system "
             "prompt): write what the lead writes, delegate what it delegates, look before you accept.",
             f"End the session with a two-line summary when {b} is accepted, when you reopen an earlier phase (its own session does "
             "that work), when a tool tells you to stop, or when you are waiting for a person. Before you end, append a handoff to "
             "the notes: note(kind='notes', text=...) with the decisions, cast, kit parts and open issues the next session needs."]
    if role:
        parts.append(ROLE_TEXT[role])
        if role == "fix":
            fp = RL.Rails(project).load().get("fix_plan") or {}
            parts.append("THE JUDGE'S PLAN:\n" + json.dumps({"why": fp.get("why"), "fixes": fp.get("fixes")}, ensure_ascii=False, indent=1))
    try:
        parts.append(status_block(project))
    except Exception as e:  # noqa: BLE001  (the status is a convenience here; the lead can still ask lesson_status)
        parts.append(f"(the status could not be read for this message: {type(e).__name__}; call lesson_status)")
    parts.append(notes_block(project))
    for kind, rec in notes.items():
        if rec.get("notes"):
            parts.append(f"THE PERSON'S NOTES WITH THE {kind.upper()} APPROVAL ({rec.get('by')}): {rec['notes']}")
    if retry:
        parts.append(retry)
    return "\n\n".join(parts)


def p10_role(rl, group: tuple, judge_model: str, fix_model: str) -> str | None:
    """L-374: in a run whose critique lead (Opus) is not its build lead (Sonnet), P10 alternates: the judge (the critique
    lead) decides the critic's findings and plans the fixes; a fix round on the build lead delegates the fixers and runs
    the check. v3's Opus lead made 146 calls running fix rounds. No split when both leads are the same model."""
    if judge_model == fix_model or not (RL.idx(group[0]) <= RL.idx("P10") <= RL.idx(group[1])):
        return None
    return "fix" if (rl.load().get("fix_plan") or {}).get("status") == "open" else "judge"


def approval_notes(project) -> dict:
    out = {}
    for k in RL.APPROVAL_PHASE:
        f = project.path(f"qa/approvals/{k}.json")
        if f.exists():
            out[k] = read_json(f, {}) or {}
    return out


AUTH_RETRIES = 5
AUTH_WAIT_S = 60


def auth_transient(result: dict | None) -> bool:
    """A session that ended before any model call because the claude.ai login was being refreshed by another Claude Code
    process ("Failed to refresh OAuth token: another Claude Code process is refreshing it ... retry in a minute"): the
    measured run of 2026-10-09 failed on it in 16 seconds, two tries one second apart (L-341)."""
    r = result or {}
    return bool(r.get("is_error")) and "refresh OAuth token" in str(r.get("result") or r.get("errors") or "")


def _mark(rl, cur: str | None) -> tuple | None:
    """(current phase, progress fingerprint) for the retry count; None when it cannot be read now."""
    try:
        return (cur if cur is not None else rl.current(), rl.progress_mark())
    except Exception as e:  # noqa: BLE001
        rl.trace("phase_unknown", error=f"{type(e).__name__}: {str(e)[:200]}")
        return None


def split_by_model(gs: list, lead: str, build_lead: str | None, c: dict) -> list:
    """A session never mixes models: a group whose phases have different leads is cut where the lead changes (with the
    sonnet-only preset, P5 on Opus and P6 on Sonnet become two sessions)."""
    out = []
    for a, b in gs:
        run = None
        for p in RL.IDS[RL.idx(a):RL.idx(b) + 1]:
            m = lead_for((p, p), lead, build_lead, c)
            if run and run[2] == m:
                run[1] = p
            else:
                if run:
                    out.append((run[0], run[1]))
                run = [p, p, m]
        out.append((run[0], run[1]))
    return out


def lead_for(group: tuple, lead: str, build_lead: str | None = None, c: dict | None = None) -> str:
    """The lead's model for one session group. `build_lead` (or config.json `lead_by_group`) puts another model on some
    groups: the Opus run spent $59.35 of its $71.27 in the P7 to P9 session (192 turns re-reading a growing context)
    against $3.37 for planning, so the build runs on Sonnet while Opus plans and judges (Kshitij, 2026-10-09, D-145)."""
    c = cfg() if c is None else c
    if build_lead == "same":
        return lead
    by = {k: v for k, v in (c.get("lead_by_group") or {}).items() if k != "about"}
    if build_lead:
        by = {k: build_lead for k in by} or {"P7-P9": build_lead}
    # a key is a range of phases ("P7-P9") or one phase; it applies to every session inside it, so one setting serves
    # both splits (the P8 session of the per-phase split is inside "P7-P9")
    for k, v in by.items():
        r = RL.parse_range(k)
        if r and RL.idx(r[0]) <= RL.idx(group[0]) and RL.idx(group[1]) <= RL.idx(r[1]):
            return v
    return lead


def run(project, mode: str = "subscription", lead: str | None = None, budget: dict | None = None, approve_as: str | None = None,
        until: str | None = None, env_extra: dict | None = None, server_env: dict | None = None, claude: str | None = None,
        runner: str = "cli", build_lead: str | None = None, preset: str | None = None) -> int:
    c = cfg()
    if runner == "loom" and mode != "api":
        raise LoomError("the loom runner (Shuttle's own agents, D-165) calls the providers' APIs: --mode api (the claude.ai subscription "
                        "needs --runner cli)")
    allowed = list(((c.get("lead") or {}).get("allowed") or {}).get(mode, ["sonnet"]))
    if runner == "loom":
        # any model the provider layer serves may lead (D-165), Opus still only where a decision lets it (D-119, D-164)
        from ..agents.llm import registry as R
        allowed += [k for k, v in R.models().items() if isinstance(v, dict) and v.get("provider") in ("anthropic", "openai", "gemini")
                    and "opus" not in str(v.get("id")) and not k.startswith("mock")]
        allowed += [k for k, v in R.models().items() if isinstance(v, dict) and k.startswith("mock") and os.environ.get("LOOM_TEST_FAST_RETRY")]
    ps = None
    # a run that names no model plan gets the mode's default preset (subscription: opus-plan, Opus for P1 to P5; Kshitij,
    # 2026-10-10: "make opus the default for the storyboarding and the lesson script and planning")
    if preset is None and lead is None and not build_lead:
        preset = ((c.get("default_preset") or {}).get(mode)) or None
    if preset:
        # a named model preset (config.json model_presets): its lead and its per-phase leads replace lead_by_group for this
        # run (Kshitij, 2026-10-10: "a sonnet only mode where everything is done by sonnet except for the storyboarding
        # which is Opus. Opus is not used anywhere else.")
        ps = (c.get("model_presets") or {}).get(preset)
        if not isinstance(ps, dict):
            have = [k for k in (c.get("model_presets") or {}) if k != "about"]
            raise LoomError(f"no model preset '{preset}' (config.json model_presets: {', '.join(have) or 'none'})")
        if ps.get("agents") and runner != "loom":
            raise LoomError(f"preset '{preset}' sets the sub-agents' models, which only the loom runner can do (--runner loom)")
        if build_lead:
            raise LoomError("--preset sets every phase's lead; leave --build-lead out")
        lead = lead or ps.get("lead")
        c = dict(c, lead_by_group={k: v for k, v in (ps.get("lead_by_group") or {}).items() if k != "about"})
        # the planning phases may also take a model the mode allows there only: lead.planning[mode] for groups inside P1 to
        # P5 (D-167: Opus plans on the API), lead.storyboard[mode] for P5 alone (D-164)
        p5 = ((c.get("lead") or {}).get("storyboard") or {}).get(mode) or []
        plan = ((c.get("lead") or {}).get("planning") or {}).get(mode) or []

        def planning(g):
            r = RL.parse_range(g)
            return bool(r) and RL.idx(r[1]) <= RL.idx("P5")

        bad = sorted({m for g, m in c["lead_by_group"].items()
                      if m not in allowed and not (g == "P5" and m in p5) and not (planning(g) and m in plan)})
        if bad:
            raise LoomError(f"preset '{preset}' uses {', '.join(bad)}, not allowed in {mode} mode ({', '.join(allowed)}; D-119)")
    lead = lead or (c.get("lead") or {}).get("default", "sonnet")
    if lead not in allowed:
        raise LoomError(f"lead '{lead}' is not allowed in {mode} mode ({', '.join(allowed)}; D-119: no Opus on the API path)")
    if build_lead and build_lead != "same" and build_lead not in allowed:
        raise LoomError(f"build lead '{build_lead}' is not allowed in {mode} mode ({', '.join(allowed)})")
    if approve_as and "unattended" not in approve_as.lower():
        raise LoomError('--approve-as must say it is unattended, e.g. "agent, unattended per Kshitij" (it is recorded as such)')
    if until and until not in RL.IDS:
        raise LoomError(f"--until is a phase: {', '.join(RL.IDS)}")
    # the render browser must draw WebGL (a pack's fx, Three.js, the brush): on 2026-10-10 it lost it mid-afternoon and a
    # run would have shipped a film without its finish, its numbers not comparable (D-154). LOOM_ALLOW_NO_WEBGL=1 runs anyway.
    if os.environ.get("LOOM_ALLOW_NO_WEBGL") != "1":
        from ..render import render_webgl
        w = render_webgl()
        if not (w.get("software") or {}).get("webgl"):
            raise LoomError("the render browser has no WebGL in HyperFrames' software capture (py -m loom doctor): fx layers, Three.js "
                            "and the brush would not draw, so the film would not be the one the lesson asks for. Restart the machine and "
                            "check again; LOOM_ALLOW_NO_WEBGL=1 runs anyway")
    rl = RL.Rails(project)
    # an agents run treats the template mix as a ceiling, not a quota (D-127; Relay's conductor does the same), so the same
    # request is held to the same storyboard gate in both pipelines. A lesson that already says how is left as it is
    cfg_ = read_json(project.path("project.json"), {}) or {}
    if cfg_.get("request") is not None and "mix_as" not in cfg_["request"]:
        cfg_["request"]["mix_as"] = "ceiling"
        project.save_cfg(cfg_)
        from .. import ledger as L
        L.log(project, "decision", node="shuttle", decision="mix_as", choice="ceiling", by={"kind": "code", "who": "loom/shuttle/launch.py"},
              why="an agents run treats the mix as a ceiling (D-127), as Relay does")

    def setup(st):
        st["mode"] = mode
        st["run"] = {"mode": mode, "lead": lead, "build_lead": build_lead, "preset": preset, "approve_as": approve_as, "until": until,
                     "runner": runner, "split": c.get("session_split") or "mixed",
                     "leads": {RL.gkey(g): lead_for(g, lead, build_lead, c) for g in split_by_model(groups(c), lead, build_lead, c)}, "at": RL.now()}
        if budget:
            st["budget"] = dict(st.get("budget") or {}, **{k: v for k, v in budget.items() if v is not None})
        lim = c.get("budget_limits") or {}
        for key in ("phases", "agents"):             # per-phase and per-sub-agent limits (config.json), unless set already
            if lim.get(key) and not (st.get("budget") or {}).get(key):
                st.setdefault("budget", {})[key] = lim[key]
        if st.get("stop") and st["stop"].get("reason") == "budget" and budget:
            st["stop"] = None                      # a person raised the budget: the stop is lifted, and it says so in the trace
    rl.update(setup)
    rl.trace("run", mode=mode, lead=lead, budget=budget, approve_as=approve_as, until=until, runner=runner)
    if runner == "sdk":
        from . import sdk_runner
        return sdk_runner.run(project, mode, lead, approve_as, until, env_extra, server_env)
    gs = split_by_model(groups(c), lead, build_lead, c)
    retries = int(c.get("session_retries", 1))
    # a session that changed nothing is a failed try (`session_retries` more, then the run fails); one that made progress
    # is not, so a phase entered again after a reopen starts fresh from the notes (D-148). A cap on sessions per phase
    # keeps a session that makes a little progress each time from looping
    cap = int(c.get("max_sessions_per_phase", 6))
    tried: dict = {}
    started: dict = {}
    auth_waits = 0
    while True:
        s = rl.status()
        if s["stop"] and s["stop"].get("reason") == "engine_defect":
            info(f"[shuttle] stopped for a person: {s['stop'].get('detail', '')[:600]}. Look at qa/defects.json and the beat; fix the engine, or "
                 f"decide it stands, then py -m loom shuttle resume {project.id} (L-421)")
            write_report(project)
            return EXIT["failed"]
        if s["stop"]:
            info(f"[shuttle] stopped: {s['stop'].get('reason')} ({s['stop'].get('detail', '')}). Raise the budget with --budget and resume.")
            return EXIT["budget"] if s["stop"].get("reason") == "budget" else EXIT["failed"]
        cur = s["current"]
        if cur is None or (until and RL.idx(cur) > RL.idx(until)):
            info(f"[shuttle] done{' up to ' + until if until else ''}: every phase accepted")
            write_report(project)
            return EXIT["done"]
        if s["waiting"]:
            w = s["waiting"]
            info(f"[shuttle] waiting for a person: {w['kind']} (look at {w.get('file')}), then: py -m loom approve {project.id} {w['kind']} "
                 f"--by \"<name>\" [--notes \"...\"] and py -m loom shuttle resume {project.id}")
            write_report(project)
            return EXIT["waiting"]
        group = group_of(cur, gs)
        glead = lead_for(group, lead, build_lead, c)
        role = p10_role(rl, group, glead, lead_for(("P9", "P9"), lead, build_lead, c))
        if role == "fix":
            glead = lead_for(("P9", "P9"), lead, build_lead, c)       # the fix round runs on the build lead (L-374)
        key = RL.gkey(group) + (f":{role}" if role else "")
        n = tried.get(key, 0)
        if n > retries or started.get(key, 0) >= cap:
            row = next(r for r in s["phases"] if r["phase"] == cur)
            why = (f"after {n} sessions in a row that changed nothing" if n > retries else f"after {started.get(key, 0)} sessions in this run")
            info(f"[shuttle] failed: {cur} ({row['name']}) is still not accepted {why}: " + "; ".join(row["missing"][:3]))
            write_report(project)
            return EXIT["failed"]
        started[key] = started.get(key, 0) + 1
        sess_state = rl.load().get("sessions") or {}
        prev = sess_state.get(key)
        retry = None
        if n > 0:
            row = next(r for r in s["phases"] if r["phase"] == cur)
            retry = (f"THE LAST SESSION ENDED WITH {cur} ({row['name']}) NOT ACCEPTED. Missing: " + "; ".join(row["missing"][:5])
                     + ". Continue from lesson_status.")
        session = prev if (n > 0 and prev) else str(uuid.uuid4())
        left = rl.budget_status()["left"].get("usd")
        before = _mark(rl, cur)
        senv = dict(server_env or {}, **({"LOOM_SHUTTLE_ROLE": role} if role else {}))
        if runner == "loom":
            from .loop import run_session as loom_session
            st = loom_session(project, mode, glead, group, start_message(project, group, approval_notes(project), retry, role=role), session,
                              resume=bool(n > 0 and prev), env_extra=env_extra, server_env=senv, approve_as=approve_as, budget_left=left,
                              role=role, preset=ps)
        else:
            st = run_session(project, mode, glead, group, start_message(project, group, approval_notes(project), retry, role=role), session,
                             resume=bool(n > 0 and prev), env_extra=env_extra, server_env=senv, approve_as=approve_as, budget_left=left,
                             claude=claude, role=role)
        after = _mark(rl, None)
        tried[key] = n + 1 if (after is None or after == before) else 0
        if auth_transient(st.result):
            # the login was mid-refresh in another Claude Code process: no model call was made, so this is not a try of the
            # phase; wait and start the session fresh (the CLI says "retry in a minute")
            auth_waits += 1
            rl.trace("auth_wait", group=key, n=auth_waits, detail=str((st.result or {}).get("result"))[:200])
            if auth_waits > AUTH_RETRIES:
                info(f"[shuttle] the claude.ai login could not be refreshed after {AUTH_RETRIES} waits: close other Claude Code processes "
                     f"or sign in again (claude auth status), then py -m loom shuttle resume {project.id}")
                write_report(project)
                return EXIT["failed"]
            info(f"[shuttle] {key}: the claude.ai login was being refreshed by another Claude Code process; waiting {AUTH_WAIT_S} s "
                 f"({auth_waits} of {AUTH_RETRIES}), then a fresh session (not counted as a try)")
            tried[key] = n
            started[key] -= 1
            time.sleep(AUTH_WAIT_S)
            continue
        rl.update(lambda x: x.setdefault("sessions", {}).__setitem__(key, (st.init or {}).get("session_id") or session))
        if st.limit:
            info(f"[shuttle] stopped by the account's limit: {st.limit}. Everything accepted is kept: py -m loom shuttle resume {project.id} "
                 "after the limit resets.")
            rl.trace("usage_limit", detail=st.limit)
            write_report(project)
            return EXIT["credit"]
        if st.killed and st.killed.startswith("key source"):
            info(f"[shuttle] {st.killed}")
            return EXIT["failed"]
        if st.killed and st.killed.startswith("loom-mcp"):
            info(f"[shuttle] {st.killed}; stderr: {' | '.join(getattr(st, 'stderr', [])[-5:])}")
            return EXIT["failed"]
        if st.result is None and not st.killed:
            info(f"[shuttle] the session ended without a result (stderr: {' | '.join(getattr(st, 'stderr', [])[-5:])})")


def resume(project, **kw) -> int:
    rl0 = RL.Rails(project)
    if ((rl0.load().get("stop") or {}).get("reason")) == "engine_defect":
        # a person looked at the errors no agent owns and resumes: the stop is lifted, and the trace says so (L-421)
        rl0.update(lambda s: s.__setitem__("stop", None))
        rl0.trace("engine_defect_lifted", by="resume")
    st = RL.Rails(project).load()
    r = dict(st.get("run") or {})
    if not r:
        raise LoomError(f"{project.id} has no Shuttle run to resume: py -m loom shuttle run {project.id}")
    args = {"mode": r.get("mode", "subscription"), "lead": r.get("lead"), "approve_as": r.get("approve_as"), "until": r.get("until"),
            "runner": r.get("runner", "cli"), "build_lead": r.get("build_lead"), "preset": r.get("preset")}
    args.update({k: v for k, v in kw.items() if v is not None})
    return run(project, **args)


# ------------------------------------------------------------------ status and report
def status_text(project) -> str:
    rl = RL.Rails(project)
    s = rl.status()
    b = rl.budget_status()
    lines = [f"Shuttle: {project.id}  current {s['current'] or 'done'}" + (f"  WAITING {s['waiting']['kind']}" if s["waiting"] else "")
             + (f"  STOPPED {s['stop'].get('reason')}" if s["stop"] else "")]
    for r in s["phases"]:
        lines.append(f"  {r['phase']:<4} {r['name']:<24} {r['status']:<9} " + ("; ".join(r["missing"][:2]) if r["missing"] else ""))
    lines.append(f"  spent: ${b['spent']['usd']:.4f}{' (notional)' if b.get('note') else ''}, {b['spent']['tokens']} tokens, {b['spent']['calls']} calls; "
                 f"limits {b['limits'] or 'none'}; reopens {b['reopens']}")
    return "\n".join(lines)


def _jsonl(f: Path) -> list[dict]:
    if not f.exists():
        return []
    out = []
    for l in f.read_text(encoding="utf-8").splitlines():
        try:
            out.append(json.loads(l))
        except json.JSONDecodeError:
            pass
    return out


def write_report(project) -> Path:
    """logs/shuttle/report.md: cost per phase and per sub-agent, reopens and why, defects by check, what the lead looked at."""
    rl = RL.Rails(project)
    st = rl.load()
    sp = rl.spent()
    tr = _jsonl(project.path("logs/shuttle/trace.jsonl"))
    calls = _jsonl(project.path("logs/shuttle/calls.jsonl"))
    tools = [t for t in tr if t.get("event") == "tool"]
    from collections import Counter
    by_tool = Counter((t.get("tool"), t.get("outcome")) for t in tools)
    models = Counter(c.get("model") for c in calls)
    cache_in = sum(c.get("cached", 0) for c in calls)
    all_in = sum(c.get("input", 0) for c in calls) or 0
    sessions = [t for t in tr if t.get("event") == "session_result"]
    last_cli, seen = {}, set()
    for t in tr:
        if t.get("event") == "reconcile" and t.get("session"):
            last_cli[t["session"]] = float(t.get("cli_usd") or 0)
    starts = [t for t in tr if t.get("event") == "session_start"]
    for s_, st_ in zip(sessions, starts):
        s_["_resumed"] = bool(st_.get("resume")) and st_.get("session") in seen
        seen.add(st_.get("session"))
    cli_total = sum(last_cli.values()) if last_cli else sum(float(s_.get("cli_cost_usd") or 0) for s_ in sessions)
    L = [f"# Shuttle report: {project.id}", "", f"Mode: {st.get('mode')}; lead: {(st.get('run') or {}).get('lead')}; written {RL.now()[:19]}.", "",
         status_text(project).replace("\n", "\n    "), "", "## Cost (USD at the engine's price table" + ("; notional in subscription mode)" if st.get("mode") != "api" else ")"),
         f"- total ${sp['usd']:.4f}, {sp['tokens']} tokens, {sp['calls']} model calls; cache reads {cache_in} of {all_in} input tokens"
         + (f" ({100 * cache_in / all_in:.0f} %)" if all_in else " (no input: a zero is not a result)"),
         "- by phase: " + ", ".join(f"{k} ${v['usd']:.4f} ({v['calls']})" for k, v in sorted(sp["by_phase"].items())),
         "- by agent: " + ", ".join(f"{k} ${v['usd']:.4f} ({v['calls']})" for k, v in sorted(sp["by_agent"].items())),
         "- models: " + ", ".join(f"{k} x{v}" for k, v in models.items()),
         "- sessions (the CLI's own figures; a resumed session's are cumulative): " + "; ".join(
             f"{s.get('group')}{' (resumed)' if s.get('_resumed') else ''} {s.get('subtype')} {s.get('turns')} turns ${(s.get('cli_cost_usd') or 0):.4f}"
             f" ({s.get('cache_misses', 0)} cache misses)" for s in sessions),
         f"- the CLI's own total, each session counted once: ${cli_total:.4f} (the table above prices the same tokens from the engine's table)", "",
         "## Reopens", f"- used: {RL.Rails.reopen_counts(st)}"] + (
             [f"- {r['at'][:19]} {r['phase']}{' for ' + ', '.join(r['beats']) if r.get('beats') else ''} by {r['by']}: {r['reason']} "
              f"(stale {', '.join(r['stale'])}; voided {', '.join(r['approvals_voided']) or 'none'})" for r in st["reopens"]] or ["- none"]) + [
         "", "## Delegations"] + ([f"- {k} {v['agent']} {v.get('beats') or ''} {v['status']}: {v['calls']} calls, accepted {v['accepted']}, "
                                   f"refused {v.get('refused', 0)}, snapshots {v.get('snapshots', 0)}" for k, v in st["tokens"].items()] or ["- none"]) + [
         "", "## Tool calls (tool, outcome, count)"] + [f"- {k[0]} {k[1]}: {v}" for k, v in sorted(by_tool.items())] + [
         "", "## Refusals by the rails"] + ([f"- {t.get('tool')} ({t.get('who')}): {t.get('refusal')}" for t in tools if t.get("outcome") == "refused"][:60]
                                             or ["- none"]) + [
         "", "## What the lead looked at"] + ([f"- {x['what']} {x.get('beats') or x.get('times') or x.get('sheets') or ''} ({x['by']})" for x in st["looked"]]
                                               or ["- nothing"]) + [
         "", "## Hook denials"] + ([f"- {d.get('tool')} ({d.get('agent') or 'lead'}): {d.get('why')}" for d in _jsonl(project.path('logs/shuttle/hook_denials.jsonl'))]
                                   or ["- none"])
    D = read_json(project.path("qa/defects.json"), {}) if project.path("qa/defects.json").exists() else {}
    if D:
        L += ["", "## Defects from the last check, by owner"] + [f"- {o}: {sum(len(v) for v in b.values())}" for o, b in (D.get("routed") or {}).items()]
    out = project.path("logs/shuttle/report.md")
    out.write_text("\n".join(L) + "\n", encoding="utf-8")
    return out


# ------------------------------------------------------------------ CLI
def cli(args) -> int:
    from ..project import Project
    if args.action == "agents":
        if args.emit in ("claude", "both"):
            for f in AG.emit_claude():
                info(f"wrote {f.relative_to(ENGINE_ROOT).as_posix()}")
        if args.emit in ("sdk", "both"):
            info(f"wrote {AG.emit_sdk().relative_to(ENGINE_ROOT).as_posix()}")
        return 0
    if not args.id:
        raise LoomError(f"shuttle {args.action} needs a lesson id")
    p = Project.open(args.id)
    if args.action == "status":
        print(status_text(p)); return 0
    if args.action == "report":
        print(write_report(p).read_text(encoding="utf-8")); return 0
    if args.action == "waive":
        if not getattr(args, "beat", None):
            raise LoomError("waive needs --beat <beat>, --by <person> and --why <reason>")
        try:
            w = RL.Rails(p).waive_blocker(args.beat, args.by or "", args.why or "")
        except RL.Refusal as e:
            raise LoomError(str(e))
        info(f"[shuttle] {p.id}: the critic's blocker on {w['beat']} is waived by {w['by']}: {w['why']}")
        return 0
    if args.action == "grant-reopen":
        try:
            g = RL.Rails(p).grant_reopens(args.by or "", args.why or "", args.count)
        except RL.Refusal as e:
            raise LoomError(str(e))
        info(f"[shuttle] reopen cap {g['cap_before']} -> {g['cap_after']} ({g['used']} used), granted by {g['by']}; "
             f"resume with py -m loom shuttle resume {p.id}")
        return 0
    budget = {"usd": args.budget, "tokens": args.budget_tokens, "calls": args.budget_calls}
    budget = {k: v for k, v in budget.items() if v is not None} or None
    if args.action == "run":
        runner = args.runner or "loom"
        mode = args.mode or ("api" if runner == "loom" else "subscription")
        return run(p, mode=mode, lead=args.lead, budget=budget, approve_as=args.approve_as, until=args.until, runner=runner,
                   build_lead=getattr(args, "build_lead", None), preset=getattr(args, "preset", None))
    if args.action == "resume":
        return resume(p, lead=args.lead, budget=budget, approve_as=args.approve_as, until=args.until,
                      build_lead=getattr(args, "build_lead", None))
    raise LoomError(f"unknown shuttle action {args.action}")
