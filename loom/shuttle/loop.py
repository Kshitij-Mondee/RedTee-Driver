"""Shuttle's own agents (D-165; Kshitij, 2026-10-12: "I don't want shuttle running claude code sessions. I want proper
agents and functional stuff. I want the idea and pipeline architecture to be as similar as possible.";
docs/strategy/2026-10-12-shuttle-own-agents.md).

`--runner loom` runs a Shuttle session in process on Relay's provider layer (loom/agents/llm: Anthropic, OpenAI, Gemini),
so the lead and its sub-agents may be any model in loom/agents/config/models.json. Everything that makes Shuttle Shuttle
is unchanged and shared with the Claude Code runner: the rails, loom-mcp's tools (called with Server.call), delegate and
collect, the briefs, the playbook, the sub-agent definitions, the session plan and the guards (launch.Stream's).

What this module replaces, and how:
- `claude -p` and its stream: a tool loop per agent (the lead, each sub-agent), one cost row per model call in
  logs/shuttle/calls.jsonl (and logs/llm_calls.jsonl) from the provider's exact usage: no reconcile rows;
- Claude Code's Agent tool: an `Agent` tool with the same fields; several in one lead turn run in parallel threads;
- the PreToolUse hook: the same checks (hook.decide) and the same caller record (logs/shuttle/callers/<use_id>.json);
- Claude Code's Read: a read-only `Read` of engine files for the lead (never .env, never outside the engine);
- auto-compaction: Relay's compaction of old tool results, and old pictures dropped (about 1,500 tokens each);
- `--resume`: the session's messages are saved (logs/shuttle/sessions/<session>.json) and a retry continues them.
"""
from __future__ import annotations

import base64
import io
import json
import os
import threading
import time
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from ..util import ENGINE_ROOT, LoomError, info, read_json, write_json
from . import agents as AG
from . import rails as RL

MCP = AG.MCP
KEEP_PICTURES = 2           # the newest messages that keep their pictures; older ones are told the picture was dropped
READ_MAX = 40000            # characters one Read returns
SUB_PARALLEL = 8            # sub-agents of one lead turn that run at once

PREAMBLE_LEAD = ("You are the lead agent of a Shuttle session in Loom, an engine that makes learning videos. You act only "
                 "through the tools listed for you; the playbook below is how you work. Tool names starting with mcp__loom__ "
                 "are loom-mcp's tools; `Agent` spawns a Shuttle sub-agent (subagent_type and prompt from a delegate result) "
                 "and returns its final words; `Read` reads an engine file. End the session with a short reply and no tool "
                 "call when your playbook says to end it.")
PREAMBLE_SUB = ("You are a Shuttle sub-agent in Loom, an engine that makes learning videos. You act only through the loom tools "
                "listed for you (mcp__loom__*). When your job is done, reply with your summary and no tool call: that reply is "
                "what the lead reads.")


def model_of(alias: str) -> dict:
    """A models.json entry from a Shuttle alias (sonnet, opus: config.json model_ids) or any models.json alias."""
    from ..agents.llm import registry as R
    return R.model(AG.model_id(alias))


def agent_model(name: str, preset: dict | None = None) -> str:
    """The model alias a sub-agent runs on: the preset's `agents` (by name, or "*"), else its definition's model."""
    by = (preset or {}).get("agents") or {}
    a = AG.resolve(name) or {}
    return by.get(name) or by.get("*") or a.get("model") or "sonnet"


# ------------------------------------------------------------------ the session's tools
def _specs(server, extra: list) -> list:
    from ..agents.llm.types import ToolSpec
    out = [ToolSpec(MCP + t["name"], t["description"], t["inputSchema"]) for t in server.list_tools()]
    return out + extra


AGENT_SPEC = {"type": "object", "properties": {
    "subagent_type": {"type": "string", "description": "the sub-agent to run: the `spawn.subagent_type` of a delegate result (shuttle-<name>)"},
    "prompt": {"type": "string", "description": "the `spawn.prompt` of the delegate result, verbatim"},
    "description": {"type": "string", "description": "a few words for the log"},
    "run_in_background": {"type": "boolean", "description": "ignored: a sub-agent always returns before your next turn"}},
    "required": ["subagent_type", "prompt"]}
READ_SPEC = {"type": "object", "properties": {
    "file_path": {"type": "string", "description": "an engine file (relative to the engine folder, or absolute inside it)"},
    "offset": {"type": "integer", "description": "the first line to read (1 = the start)"},
    "limit": {"type": "integer", "description": "how many lines"}}, "required": ["file_path"]}


def read_file(file_path: str, offset: int | None = None, limit: int | None = None) -> dict:
    p = Path(file_path)
    p = (p if p.is_absolute() else ENGINE_ROOT / p).resolve()
    try:
        rel = p.relative_to(ENGINE_ROOT.resolve()).as_posix()
    except ValueError:
        return {"error": "Read reads files inside the engine folder only"}
    if p.name.startswith(".env") or "/.git/" in "/" + rel + "/":
        return {"error": f"{rel} is not readable here"}
    if not p.is_file():
        return {"error": f"{rel} does not exist"}
    lines = p.read_text(encoding="utf-8", errors="replace").splitlines()
    a = max(1, int(offset or 1))
    b = len(lines) if not limit else min(len(lines), a - 1 + int(limit))
    text = "\n".join(f"{i}\t{lines[i - 1]}" for i in range(a, b + 1))
    return {"file": rel, "lines": [a, b], "of": len(lines), "text": text[:READ_MAX] + ("..." if len(text) > READ_MAX else "")}


# ------------------------------------------------------------------ one agent's loop
class Agent:
    """One tool-using agent: the lead of a session, or a sub-agent. `stop()` is checked before every model call."""

    def __init__(self, sess: "Session", name: str, alias: str, system: list, tools: list, max_turns: int, effort: str | None = None,
                 agent_type: str | None = None, parent: str | None = None):
        from ..agents.llm import registry as R
        self.s, self.name, self.alias, self.system, self.tools = sess, name, alias, system, tools
        self.m = model_of(alias)
        self.prov = R.provider_for(self.m)
        self.max_turns, self.effort, self.agent_type = max_turns, effort, agent_type
        self.agent_id = uuid.uuid4().hex[:12]
        self.parent = parent            # the lead's Agent tool-use id that started this sub-agent (None for the lead)
        self.turns = 0

    def _prune(self, msgs: list):
        """Old pictures out: Claude Code compacted a long session; here only the newest KEEP_PICTURES messages keep theirs."""
        seen = 0
        for m in reversed(msgs):
            if m.images:
                seen += 1
                if seen > KEEP_PICTURES:
                    m.content = (m.content or "") + f" [{len(m.images)} older picture(s) dropped from this conversation]"
                    m.images = []

    def run(self, msgs: list, on_turn=None) -> str:
        from ..agents import runtime as RT
        from ..agents.llm import registry as R
        from ..agents.llm.types import (BillingError, BudgetExceeded, ContextOverflow, LLMError, Message, Request)
        last_text, prev_input = "", 0
        while self.turns < self.max_turns:
            why = self.s.stop_reason()
            if why:
                return last_text or f"(stopped: {why})"
            self._prune(msgs)
            chars, nimg = RT._chars(self.system, msgs)
            est = R.estimate_tokens(chars, nimg)
            window = int(self.m.get("context", 200000))
            if est > window * RT.COMPACT_AT:
                RT._compact(msgs)
                chars, nimg = RT._chars(self.system, msgs)
                est = R.estimate_tokens(chars, nimg)
            room = window - est - RT.SAFETY
            if room < RT.MIN_OUT:
                self.s.stream.kill(f"{self.name}: the conversation (~{est} tokens) fills the {window}-token window")
                return last_text
            max_tok = min(int(self.m.get("max_out", 16000)), 32000, room)
            try:
                self.s.check_budget(self.m, est, max_tok, prev_input)
            except BudgetExceeded as e:
                self.s.budget_stop(str(e))
                return last_text
            req = Request(model=self.m["id"], system=self.system, messages=msgs, tools=self.tools, max_tokens=max_tok, effort=self.effort,
                          caps={k: self.m[k] for k in ("thinking", "tools_reasoning") if k in self.m})
            try:
                resp = self.prov.complete(req)
            except BillingError as e:
                self.s.stream.limit = f"{self.m['provider']}: {str(e)[:200]}"
                self.s.stream.kill(f"credit: {str(e)[:200]}")
                return last_text
            except (ContextOverflow, LLMError) as e:
                self.s.rails.trace("agent_error", group=self.s.gname, agent=self.name, error=str(e)[:300])
                if self.agent_type is None:
                    self.s.error = str(e)[:300]
                return last_text or f"(error: {str(e)[:200]})"
            self.turns += 1
            prev_input = min(int(resp.usage.input or 0), est)
            self.s.book(self, resp)
            msgs.append(Message("assistant", resp.text, tool_calls=resp.tool_calls, extra=resp.extra))
            self.s.transcript({"type": "assistant", "parent_tool_use_id": self.parent, "agent": self.agent_type or "lead",
                               "message": {"id": resp.raw_id, "model": resp.model, "stop_reason": resp.stop,
                                           "content": ([{"type": "text", "text": resp.text}] if resp.text else [])
                                           + [{"type": "tool_use", "id": c.id, "name": c.name, "input": c.args} for c in resp.tool_calls],
                                           "usage": vars(resp.usage)}})
            last_text = resp.text or last_text
            if on_turn:
                on_turn(resp)
            if not resp.tool_calls:
                return resp.text
            pictures = []
            results = self.s.dispatch_all(self, resp.tool_calls)
            for tc, (text, imgs, is_err) in zip(resp.tool_calls, results):
                msgs.append(Message("tool", text, tool_call_id=tc.id, name=tc.name, is_error=is_err))
                pictures += imgs
            self.s.transcript({"type": "user", "parent_tool_use_id": self.parent, "agent": self.agent_type or "lead",
                               "message": {"role": "user", "content": [{"type": "tool_result", "tool_use_id": tc.id, "is_error": err,
                                                                        "content": [{"type": "text", "text": text}]
                                                                        + [{"type": "image", "omitted": True}] * len(imgs)}
                                                                       for tc, (text, imgs, err) in zip(resp.tool_calls, results)]}})
            if pictures:
                msgs.append(Message("user", "The pictures your tool calls returned, in order:", images=pictures[:6]))
        return last_text or "(turn limit reached)"


# ------------------------------------------------------------------ one session
class Session:
    """A Shuttle session on its own agents. Its attributes match launch.Stream's (result, init, limit, killed, stderr) so
    launch.run's loop treats both runners alike; its guards are a Stream's."""

    def __init__(self, project, mode: str, lead: str, group: tuple, session: str, role: str | None, approve_as: str | None,
                 server_env: dict | None, preset: dict | None, env_extra: dict | None = None):
        from . import launch as LA
        from .server import Server
        self.p, self.mode, self.lead, self.group, self.session_id, self.role = project, mode, lead, group, session, role
        self.gname = RL.gkey(group)
        self.preset = preset or {}
        self.rails = RL.Rails(project)
        self.stream = LA.Stream(project, mode, "ANTHROPIC_API_KEY", self.gname, None, role=role)
        self.error: str | None = None
        self.usd = 0.0
        self.calls = 0
        self.cache_misses = 0
        self.lock = threading.Lock()
        from ..agents.budget import Budget
        self.ledger = Budget(1e12, ledger=project.path("logs/shuttle/calls.jsonl"))
        lm = model_of(lead)
        # in process, the agents and the server share this process's environment: the launcher's extras (a harness's base
        # URLs and keys) and the server's (session, role, approvals) are set for the session and restored after it
        env = dict(env_extra or {}, **(server_env or {}), LOOM_SHUTTLE_SESSION=self.gname, LOOM_SHUTTLE_LEAD_MODEL=lm["id"])
        if approve_as:
            env["LOOM_SHUTTLE_APPROVE_AS"] = approve_as
        self._env_keep = {k: os.environ.get(k) for k in list(env) + ["LOOM_SHUTTLE_ROLE"]}
        os.environ.pop("LOOM_SHUTTLE_ROLE", None)
        os.environ.update(env)
        self.server = Server(str(project.root))
        sess = read_json(project.path("logs/shuttle/session.json"), {}) if project.path("logs/shuttle/session.json").exists() else {}
        sess.update({"session_id": session, "lead_model": lm["id"], "lead_provider": lm["provider"], "lead_alias": lead, "mode": mode,
                     "runner": "loom", "key_source": "ANTHROPIC_API_KEY" if lm["provider"] == "anthropic" else lm["provider"]})
        write_json(project.path("logs/shuttle/session.json"), sess)

    def close(self):
        for k, v in self._env_keep.items():
            if v is None:
                os.environ.pop(k, None)
            else:
                os.environ[k] = v

    # ---------------------------------------------------------------- the transcript
    def transcript(self, rec: dict):
        """logs/shuttle/stream_<group>.jsonl, in the shape Claude Code's stream-json had (assistant turns with their tool_use
        blocks, user turns with the tool results; a sub-agent's lines carry the lead's Agent tool-use id as
        parent_tool_use_id), so a run reads the same on both runners. Pictures are marked, not stored."""
        line = json.dumps(dict(rec, session_id=self.session_id, runner="loom"), ensure_ascii=False, default=str)
        with self.lock, open(self.p.path(f"logs/shuttle/stream_{self.gname}.jsonl"), "a", encoding="utf-8") as fh:
            fh.write(line + "\n")

    # ---------------------------------------------------------------- guards and money
    def stop_reason(self) -> str | None:
        return self.stream.killed

    def check_budget(self, m: dict, est: int, max_tok: int, prev_input: int):
        from ..agents.budget import Budget
        left = self.rails.budget_status()["left"].get("usd")
        if left is not None:
            Budget(max(0.0, float(left))).check(m, est, max_tok, cached_tokens=prev_input)

    def budget_stop(self, why: str):
        self.rails.update(lambda s: s.__setitem__("stop", {"reason": "budget", "detail": why, "at": RL.now()}))
        self.rails.trace("budget_stop", detail=why, by="loom runner")
        self.stream.kill(f"budget: {why}")

    def book(self, ag: Agent, resp):
        try:
            phase = self.rails.current()
        except Exception:  # noqa: BLE001  (a build rewritten under the status: the row keeps no phase, L-350)
            phase = None
        who = ag.agent_type or "lead"
        expected = ag.turns > 1
        miss = expected and int(resp.usage.input or 0) > 2048 and int(resp.usage.cached or 0) == 0
        rec = {"pipeline": "shuttle", "mode": self.mode, "runner": "loom", "group": self.gname, "phase": phase, "agent": who,
               "role": f"shuttle {who}", "notional": False, "priced_as": ag.alias, "session": self.session_id, "agent_id": ag.agent_id,
               "msg": resp.raw_id, "turn": ag.turns, "stop": resp.stop, "latency_s": round(resp.latency_s, 2), "project": self.p.id,
               "_project_ledger": str(self.p.path("logs/llm_calls.jsonl"))}
        if miss:
            rec["cache_miss"] = True
        c = self.ledger.book(ag.m, resp.usage, rec)
        with self.lock:
            self.usd += c
            self.calls += 1
            self.cache_misses += int(miss)

    # ---------------------------------------------------------------- tools
    def dispatch_all(self, ag: Agent, calls: list) -> list:
        """Results in the calls' order. Agent spawns of one turn run in parallel (as Claude Code ran them); loom tools run
        in order (the server takes one engine call at a time anyway)."""
        out: list = [None] * len(calls)
        spawns = [(i, c) for i, c in enumerate(calls) if c.name == "Agent"]
        for i, c in enumerate(calls):
            if c.name != "Agent":
                out[i] = self.dispatch(ag, c)
        if spawns:
            with ThreadPoolExecutor(max_workers=min(SUB_PARALLEL, len(spawns))) as ex:
                futs = {i: ex.submit(self.spawn, ag, c.args, c.id) for i, c in spawns}
                for i, f in futs.items():
                    try:
                        out[i] = f.result()
                    except Exception as e:  # noqa: BLE001
                        out[i] = (json.dumps({"error": f"the sub-agent failed: {type(e).__name__}: {str(e)[:300]}"}), [], True)
        return out

    def dispatch(self, ag: Agent, tc) -> tuple:
        from . import hook as HK
        from .server import MAX_REPLY
        name, args = tc.name, dict(tc.args or {})
        if name == "Read" and ag.agent_type is None:
            r = read_file(**{k: args.get(k) for k in ("file_path", "offset", "limit")})
            return json.dumps(r, ensure_ascii=False), [], bool(r.get("error"))
        if not name.startswith(MCP):
            return json.dumps({"error": f"unknown tool {name}"}), [], True
        allowed = {t.name for t in ag.tools}
        if name not in allowed:
            return json.dumps({"error": f"{name} is not one of your tools"}), [], True
        event = {"tool_name": name, "tool_input": args, "agent_type": ag.agent_type, "agent_id": ag.agent_id if ag.agent_type else None,
                 "session_id": self.session_id, "tool_use_id": "lr" + uuid.uuid4().hex[:20]}
        why = HK.decide(event, strict=True)
        if why:
            with open(self.p.path("logs/shuttle/hook_denials.jsonl"), "a", encoding="utf-8") as fh:
                fh.write(json.dumps({"tool": name, "agent": ag.agent_type, "why": why, "at": RL.now(), "runner": "loom"}) + "\n")
            return json.dumps({"error": why}), [], True
        HK.record_caller(event, str(self.p.root))
        res, imgs = self.server.call(name[len(MCP):], args, use_id=event["tool_use_id"])
        text = json.dumps(res, ensure_ascii=False, default=str)
        if len(text) > MAX_REPLY:
            text = text[:MAX_REPLY] + '..."[cut]"'
        detail = res.get("detail") if isinstance(res, dict) else None
        return text, pictures(imgs, detail), isinstance(res, dict) and bool(res.get("refused") or res.get("error"))

    def spawn(self, lead: Agent, args: dict, use_id: str | None = None) -> tuple:
        """The Agent tool: run a Shuttle sub-agent to its end and return its final words."""
        from ..agents.llm.types import Message
        from .launch import agent_denies
        st = str(args.get("subagent_type") or "")
        a = AG.resolve(st) if st.startswith(AG.PREFIX) else None
        if a is None:
            return json.dumps({"error": f"no Shuttle sub-agent '{st}': use a delegate result's spawn.subagent_type"}), [], True
        if f"Agent({st})" in agent_denies(RL.parse_range(self.gname)):
            return json.dumps({"error": f"{st} is not for this session's phases"}), [], True
        alias = agent_model(a["name"], self.preset)
        known = {t["name"] for t in self.server.list_tools()} | set(self.server.tools)
        from ..agents.llm.types import ToolSpec
        schemas = {n: (d, s) for n, (d, s, _) in self.server.tools.items()}
        tools = [ToolSpec(MCP + t, schemas[t][0], schemas[t][1]) for t in a["tools"] if t in known and t in schemas]
        sub = Agent(self, st, alias, [PREAMBLE_SUB, AG.full_prompt(a)], tools, int(a.get("max_turns") or 20), a.get("effort"), agent_type=st,
                    parent=use_id)
        sess = read_json(self.p.path("logs/shuttle/session.json"), {}) or {}
        with self.lock:
            sess.setdefault("agents", {})[st] = sub.m["id"]
            write_json(self.p.path("logs/shuttle/session.json"), sess)
        self.rails.trace("subagent_start", group=self.gname, agent=st, model=sub.m["id"], agent_id=sub.agent_id)
        info(f"[shuttle]   {st} ({sub.m['id']}) started")
        final = sub.run([Message("user", str(args.get("prompt") or ""))])
        self.rails.trace("subagent_end", group=self.gname, agent=st, agent_id=sub.agent_id, turns=sub.turns, chars=len(final or ""))
        return json.dumps({"agent": st, "turns": sub.turns, "result": final or "(no summary)"}, ensure_ascii=False), [], False


def pictures(paths: list, detail: str | None = None) -> list:
    """(mime, base64) pairs at the size the judgment needs (server.picture_size), as loom-mcp sent them."""
    from PIL import Image
    from .server import PICTURE, picture_size
    out = []
    for f in (paths or [])[:4]:
        try:
            im = Image.open(f).convert("RGB")
            size = picture_size(im.width, im.height, detail if detail in PICTURE else "full")
            if size != im.size:
                im = im.resize(size, Image.LANCZOS)
            buf = io.BytesIO()
            im.save(buf, "JPEG", quality=80)
            out.append(("image/jpeg", base64.b64encode(buf.getvalue()).decode()))
        except Exception:  # noqa: BLE001  (a picture that cannot be read is left out; the text says what was made)
            continue
    return out


def lead_system(window: tuple | None) -> list:
    """The lead's system blocks, stable first: the preamble, the engine's CLAUDE.md (the lead read it under Claude Code),
    the playbook with its toolbox menu."""
    from .launch import lead_prompt
    claude_md = (ENGINE_ROOT / "CLAUDE.md").read_text(encoding="utf-8") if (ENGINE_ROOT / "CLAUDE.md").exists() else ""
    return [PREAMBLE_LEAD, "THE ENGINE'S INSTRUCTIONS (CLAUDE.md):\n" + claude_md, lead_prompt(window)]


def run_session(project, mode: str, lead: str, group: tuple, prompt: str, session: str, resume: bool, env_extra: dict | None,
                server_env: dict | None, approve_as: str | None, budget_left: float | None, claude: str | None = None,
                role: str | None = None, preset: dict | None = None):
    """launch.run_session's twin on Shuttle's own agents. Returns the session's Stream-like record."""
    from ..agents import runtime as RT
    from ..agents.llm.types import Message, ToolSpec
    from .launch import cfg
    if mode != "api":
        raise LoomError("the loom runner calls the providers' APIs: run it with --mode api (the claude.ai subscription needs --runner cli)")
    s = Session(project, mode, lead, group, session, role, approve_as, server_env, preset, env_extra)
    try:
        window = RL.parse_range(s.gname)
        tools = _specs(s.server, [ToolSpec("Agent", "Run a Shuttle sub-agent (from a delegate result's spawn) and return its final words.", AGENT_SPEC),
                                  ToolSpec("Read", "Read an engine file (docs, skills, code); read-only.", READ_SPEC)])
        lead_ag = Agent(s, "lead", lead, lead_system(window), tools, int(cfg().get("max_turns_per_session", 120)))
        spath = project.path(f"logs/shuttle/sessions/{session}.json")
        msgs = []
        if resume and spath.exists():
            msgs = [RT._msg_in(d) for d in (read_json(spath, {}) or {}).get("messages") or []]
        msgs.append(Message("user", prompt))
        s.rails.trace("session_start", group=s.gname, mode=mode, lead=lead, resume=resume, session=session, role=role, runner="loom")
        s.stream.init = {"session_id": session, "model": lead_ag.m["id"]}
        s.rails.trace("session_init", group=s.gname, session=session, model=lead_ag.m["id"], provider=lead_ag.m["provider"],
                      tools=len(tools), runner="loom")
        s.transcript({"type": "system", "subtype": "init", "model": lead_ag.m["id"], "tools": [t.name for t in tools], "resume": resume})
        s.transcript({"type": "user", "parent_tool_use_id": None, "agent": "lead", "message": {"role": "user", "content": [{"type": "text", "text": prompt}]}})
        info(f"[shuttle] {s.gname}{' ' + role if role else ''}: own agents ({mode}, lead {lead_ag.m['id']}){' resumed' if resume else ''}")

        def on_turn(resp):
            s.stream.guards()
            s.stream.window_guard()

        t0 = time.monotonic()
        final = lead_ag.run(msgs, on_turn=on_turn)
        try:
            write_json(spath, {"session": session, "group": s.gname, "model": lead_ag.m["id"], "saved_at": RL.now(),
                               "messages": [RT._msg_out(m) for m in msgs]})
        except Exception as e:  # noqa: BLE001  (an unsaved session only costs a fresh one on retry)
            info(f"[shuttle] session not saved: {e}")
        s.stream.result = {"is_error": bool(s.error), "result": final, "errors": [s.error] if s.error else [], "num_turns": lead_ag.turns,
                           "total_cost_usd": round(s.usd, 6)}
        s.transcript({"type": "result", "subtype": "error" if s.error else "success", "result": final, "num_turns": lead_ag.turns,
                      "total_cost_usd": round(s.usd, 6), "killed": s.stream.killed})
        s.rails.trace("session_result", group=s.gname, subtype="error" if s.error else "success", turns=lead_ag.turns,
                      cli_cost_usd=round(s.usd, 6), calls=s.calls, cache_misses=s.cache_misses, seconds=round(time.monotonic() - t0, 1),
                      killed=s.stream.killed, runner="loom")
        s.stream.stderr = []
        return s.stream
    finally:
        s.close()
