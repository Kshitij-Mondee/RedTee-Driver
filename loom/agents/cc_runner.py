"""Relay's role agents served by Claude Code on the person's subscription (provider `claude_code`, aliases cc-*).

Relay calls the providers' APIs; with a cc-* model, `runtime.run_agent` hands the task here instead. One role task is
one `claude -p` session:
- the system prompt is the role's own (`runtime.role_system`, the same blocks the API path sends), replacing Claude
  Code's; no built-in tool, no skill, no CLAUDE.md or memory (an empty working folder, project settings only);
- the tools are exactly the role's Relay tools, served by `loom/agents/cc_server.py` through the same `tools.call`;
- the task message is the conductor's (`task_message`), with its images, sent as a stream-json user message;
- turns follow the role's limits (`--max-turns`), effort its profile (`--effort`); a fix resumes the role's saved
  session (`--resume`), as Relay resumes an API session.
The child environment is Shuttle's subscription environment (no ANTHROPIC_* or CLAUDE* variable; `shuttle/launch.py`);
the run stops before any model call if the CLI reports a key, and at the plan's limit instead of paid overage.
Every model message is a row in logs/llm_calls.jsonl at the engine's list prices (notional, `billed_usd` 0). The rows
are reconciled with the CLI's own TOKEN counts (`modelUsage` in its result), never its dollar total: that total is
cumulative for a resumed session and, for a model the CLI build does not know (`costBasis: "unknown"`, Sonnet 5.5 in
CLI 2.1.283), an estimate about twice the list price (R-35, L-327). A reconcile row carries only tokens the stream did
not report, priced from models.json. `--budget` keeps governing the billed providers only. A task whose first message
comes from another model than its alias's id is stopped (`served_model_mismatch`, L-325).
"""
from __future__ import annotations

import base64
import json
import re
import subprocess
import sys
import threading
import time
import uuid
from pathlib import Path

from ..util import ENGINE_ROOT, LoomError, info, read_json, which, write_json
from . import tools as T
from .llm import registry as R
from .llm.types import BillingError, Usage

LIMIT_WORDS = ("usage limit", "rate limit", "limit reached", "out of credit", "quota", "credit balance")
# tests point Claude Code at the mock server here (a fake key, a base URL, an empty config folder); a real run leaves it empty
ENV_EXTRA: dict = {}
# no memory file reaches a role agent: the walk up from the working folder finds the person's own ~/.claude/CLAUDE.md
# (C:/Users/<name> is a parent of the temp folder), and the user memory loads by default (agents_cc_runner test, 2026-10-08)
CC_SETTINGS = {"claudeMdExcludes": ["**/CLAUDE.md", "**/CLAUDE.local.md", "**/.claude/rules/**"], "autoMemoryEnabled": False}


_TOK = (("input", "inputTokens"), ("cached", "cacheReadInputTokens"), ("cache_write", "cacheCreationInputTokens"), ("output", "outputTokens"))


def missing_tokens(model_usage: dict, prev: dict, rows: dict) -> dict:
    """Tokens the CLI counted (its cumulative `modelUsage`, minus `prev`, what earlier runs of this session already
    accounted) beyond the per-message rows of this run (`rows`: model -> {input (all prompt tokens), cached,
    cache_write, output}). Returns model -> {input, cached, cache_write, output} in the rows' sense, only where
    something is missing."""
    out = {}
    for model, mu in (model_usage or {}).items():
        pv = (prev or {}).get(model) or {}
        rw = (rows or {}).get(model) or {}
        rows_by = {"input": max(0, rw.get("input", 0) - rw.get("cached", 0) - rw.get("cache_write", 0)),
                   "cached": rw.get("cached", 0), "cache_write": rw.get("cache_write", 0), "output": rw.get("output", 0)}
        miss = {k: max(0, int(mu.get(cli) or 0) - int(pv.get(cli) or 0) - rows_by[k]) for k, cli in _TOK}
        if any(miss.values()):
            out[model] = {"input": miss["input"] + miss["cached"] + miss["cache_write"], "cached": miss["cached"],
                          "cache_write": miss["cache_write"], "output": miss["output"]}
    return out


def same_model(served: str | None, expected: str | None) -> bool:
    """The served id is the alias's model: the same id, or that id with a dated snapshot suffix
    (claude-sonnet-5-5-20261001). claude-sonnet-5 is not claude-sonnet-5-5, nor the other way round (L-325, L-346)."""
    if not served or not expected:
        return True
    return served == expected or bool(re.fullmatch(re.escape(expected) + r"-\d{8}", served))


def _priced_model(model_id: str, fallback_alias: str) -> dict:
    """models.json's entry for a served model id (a claude_code alias first), else the task's own alias."""
    ms = R.models()
    for alias, m in ms.items():
        if m.get("provider") == "claude_code" and m.get("id") == model_id:
            return dict(m, alias=alias)
    for alias, m in ms.items():
        if m.get("id") == model_id:
            return dict(m, alias=alias)
    return R.model(fallback_alias)


def _image_block(path: str) -> dict:
    p = Path(path)
    mt = "image/png" if p.suffix.lower() == ".png" else "image/jpeg"
    return {"type": "image", "source": {"type": "base64", "media_type": mt, "data": base64.b64encode(p.read_bytes()).decode()}}


def _json_safe(d: dict) -> dict:
    out = {}
    for k, v in (d or {}).items():
        try:
            json.dumps(v)
            out[k] = v
        except TypeError:
            continue           # threading.Event (_warm) and the like stay in this process
    return out


class _Stream:
    """Usage per model message (the final output count comes from the raw message_delta), the result, the guards."""

    def __init__(self, expect_source: str, expect_model: str | None = None):
        self.expect = expect_source
        self.expect_model = expect_model
        self.mismatch = None
        self.msgs: dict = {}
        self.order: list = []
        self.current: dict = {}
        self.init = None
        self.result = None
        self.limit = None
        self.killed = None
        self.window = None          # the subscription window as the CLI last reported it
        self.model = None
        self.proc = None

    def kill(self, why):
        self.killed = why
        if self.proc and self.proc.poll() is None:
            self.proc.terminate()

    def line(self, raw: str):
        try:
            d = json.loads(raw)
        except json.JSONDecodeError:
            return
        t = d.get("type")
        if t == "system" and d.get("subtype") == "init":
            self.init = d
            self.model = d.get("model")
            if (d.get("apiKeySource") or "none") != self.expect:
                self.kill(f"key source {d.get('apiKeySource')!r}, expected {self.expect!r}: stopped before any model call")
        elif t == "stream_event":
            ev = d.get("event") or {}
            par = d.get("parent_tool_use_id")
            if ev.get("type") == "message_start":
                self.current[par] = (ev.get("message") or {}).get("id")
            elif ev.get("type") == "message_delta" and self.current.get(par):
                self.msgs.setdefault(self.current[par], {})["final_output"] = int((ev.get("usage") or {}).get("output_tokens") or 0)
        elif t == "assistant":
            m = d.get("message") or {}
            mid = m.get("id") or uuid.uuid4().hex
            if mid not in self.order:
                self.order.append(mid)
            rec = self.msgs.setdefault(mid, {})
            rec["model"] = m.get("model") or rec.get("model")
            rec["usage"] = m.get("usage") or rec.get("usage")
            rec.setdefault("tools", [])
            rec["tools"] += [b.get("name") for b in m.get("content") or [] if b.get("type") == "tool_use"]
            if rec["model"] and rec["model"] != "<synthetic>":
                self.model = rec["model"]
                # the alias names one model; a CLI alias may resolve to another (`sonnet` served claude-sonnet-5 for a
                # profile that named and priced Sonnet 5.5, L-325): stop at the first message, before it writes anything
                if self.expect_model and d.get("parent_tool_use_id") is None and not same_model(rec["model"], self.expect_model) \
                        and not self.mismatch:
                    self.mismatch = f"served_model_mismatch: the CLI served {rec['model']}, the alias names {self.expect_model}"
                    self.kill(self.mismatch)
        elif t == "rate_limit_event":
            i = d.get("rate_limit_info") or {}
            self.window = {k: i.get(k) for k in ("status", "rateLimitType", "utilization", "resetsAt", "isUsingOverage")}
            if str(i.get("status", "")).lower() in ("rejected", "blocked"):
                self.limit = f"rate limit: {json.dumps(i)[:200]}"
                self.kill(self.limit)
            elif i.get("isUsingOverage"):
                self.limit = "the subscription's limit is reached and the next calls would bill as overage"
                self.kill(self.limit)
        elif t == "result":
            self.result = d
            txt = " ".join(str(x) for x in [d.get("result"), d.get("errors"), d.get("terminal_reason")] if x).lower()
            if d.get("is_error") and (any(w in txt for w in LIMIT_WORDS) or d.get("api_error_status") in (402, 429)):
                self.limit = (d.get("result") or str(d.get("errors")))[:300]

    def usages(self):
        for mid in self.order:
            m = self.msgs[mid]
            if m.get("model") in (None, "<synthetic>"):
                continue
            u = m.get("usage") or {}
            cr = int(u.get("cache_read_input_tokens") or 0)
            cw = int(u.get("cache_creation_input_tokens") or 0)
            cw1 = int(((u.get("cache_creation") or {}).get("ephemeral_1h_input_tokens")) or 0)
            out = max(int(u.get("output_tokens") or 0), int(m.get("final_output") or 0))
            yield mid, m, Usage(input=int(u.get("input_tokens") or 0) + cr + cw, cached=cr, cache_write=cw, output=out, cache_write_1h=cw1)


def run_agent_cc(spec, ctx, task: str, budget, images=None, resume=None, session_path=None, claude=None, env_extra=None):
    """One Relay role task through `claude -p`. Returns runtime.AgentResult, as `runtime.run_agent` does."""
    from .. import ledger as L
    from ..shuttle.launch import child_env, expected_key_source
    from .runtime import AgentResult, role_system, system_sha
    P = ctx.project
    m = R.model(spec.model_alias)
    claude = claude or which("claude")
    if not claude:
        raise LoomError("the claude_code provider needs Claude Code (`claude`) on PATH")
    tid = f"{ctx.role}-{ctx.beat + '-' if ctx.beat else ''}{uuid.uuid4().hex[:8]}"
    work = P.path(f"logs/cc/{tid}")
    work.mkdir(parents=True, exist_ok=True)
    # an empty, stable folder OUTSIDE the engine: Claude Code reads CLAUDE.md from the working folder and its parents, and the
    # engine's own would reach the role agent; sessions are filed by this folder, so a fix resumes from it
    import tempfile
    cwd = Path(tempfile.gettempdir()) / "loom_cc" / P.id
    cwd.mkdir(parents=True, exist_ok=True)
    from ..genre import of as _kind_of
    system = role_system(spec.role, spec.context, P.request.get("style") if P is not None else None, _kind_of(P) if P is not None else None)
    tools = [t.name for t in T.specs(spec.role)]
    if spec.role == "brief" and P.mode == "topic":
        tools = [t for t in tools if t != "get_source_chunks"]   # as the API path: nothing to search before the facts
    terminal = T.TERMINAL[spec.role]
    # the instructions name tools bare ("call lab_snapshot"); Claude Code serves them as mcp__relay__<name>. R-46: 14 calls
    # in feedback-relay-v2 went to a bare name ("No such tool available"), and each re-sent a whole scene
    names = ", ".join(f"`{n}` is `mcp__relay__{n}`" for n in tools)
    system = list(system) + [f"## Your tools in this session\nEvery tool these instructions name is served with the prefix "
                             f"`mcp__relay__`: {names}. Call them by those full names."]
    (work / "system.md").write_text("\n\n".join(system), encoding="utf-8")
    state_file = work / "state.json"
    write_json(state_file, _json_safe(ctx.state))
    label = f"{m['id']} (claude -p {m['cli']})"
    task_file = work / "task.json"
    write_json(task_file, {"project": str(P.root), "role": spec.role, "stage": ctx.stage, "beat": ctx.beat,
                           "target": str(ctx.target) if ctx.target else None, "extra": _json_safe(ctx.extra), "tools": tools,
                           "terminal": terminal, "limits": {"tool_calls": spec.lim("tool_calls"), "repairs": spec.lim("repairs")},
                           "state_file": str(state_file), "model": label})
    py = Path(sys.executable).as_posix()
    mcp = work / "mcp.json"
    write_json(mcp, {"mcpServers": {"relay": {"type": "stdio", "command": py, "args": ["-m", "loom.agents.cc_server", "--task", str(task_file)],
                                              "env": {"PYTHONPATH": str(ENGINE_ROOT), "PYTHONIOENCODING": "utf-8", "PYTHONUTF8": "1"},
                                              "timeout": 3600000}}})
    env = child_env("subscription", env_extra if env_extra is not None else (ENV_EXTRA or None))
    expect = expected_key_source("subscription", env)
    tail = f"\n\nYou have at most {spec.lim('repairs')} resubmissions. End by calling `{terminal}`."
    sid = (resume or {}).get("cc_session_id")
    trace = P.path(f"logs/traces/{tid}.jsonl")
    trace.parent.mkdir(parents=True, exist_ok=True)
    t0 = time.monotonic()
    usage, cost, turns, msgs_logged = Usage(), 0.0, 0, 0
    status, note, model_id = "limits", "", m["id"]
    # what this session's earlier runs already accounted (the CLI's modelUsage and dollar total are cumulative for it)
    seen = {"mu": dict((resume or {}).get("cc_model_usage") or {}), "usd": float((resume or {}).get("cc_cli_usd") or 0),
            # a session saved before its usage was recorded: its cumulative totals cannot be split, so this run adds no
            # reconcile row rather than counting the earlier session again (L-346)
            "unknown": bool(sid) and "cc_model_usage" not in (resume or {})}

    def one_session(text: str, imgs, session_id: str, resuming: bool):
        nonlocal turns, cost, msgs_logged, model_id
        cmd = [claude, "-p", "--input-format", "stream-json", "--output-format", "stream-json", "--verbose", "--include-partial-messages",
               "--model", m["cli"], "--system-prompt-file", str(work / "system.md"), "--mcp-config", str(mcp), "--strict-mcp-config",
               "--tools", "", "--allowedTools", "mcp__relay", "--permission-mode", "dontAsk", "--setting-sources", "project",
               "--settings", json.dumps(CC_SETTINGS), "--disable-slash-commands", "--max-turns", str(spec.lim("turns"))]
        if spec.effort:
            cmd += ["--effort", spec.effort]
        cmd += ["--resume", session_id] if resuming else ["--session-id", session_id]
        s = _Stream(expect, m["id"])
        proc = subprocess.Popen(cmd, cwd=str(cwd), env=env, stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
        s.proc = proc
        err = []
        th = threading.Thread(target=lambda: err.extend(proc.stderr.read().decode("utf-8", "replace").splitlines()[-30:]), daemon=True)
        th.start()
        content = [{"type": "text", "text": text}] + [_image_block(i) for i in imgs or [] if Path(i).exists()]
        proc.stdin.write((json.dumps({"type": "user", "message": {"role": "user", "content": content}}) + "\n").encode("utf-8"))
        proc.stdin.close()
        with open(trace, "a", encoding="utf-8") as tr:
            tr.write(json.dumps({"event": "start", "role": spec.role, "model": label, "resume": resuming, "session": session_id,
                                 "tools": tools, "t": round(time.monotonic() - t0, 2)}) + "\n")
            for raw in proc.stdout:
                line = raw.decode("utf-8", "replace").rstrip("\n")
                s.line(line)
                if s.result is not None:
                    break
        try:
            proc.wait(timeout=120)
        except subprocess.TimeoutExpired:
            proc.kill()
        th.join(timeout=5)
        mine = 0.0
        rows_by: dict = {}
        with open(trace, "a", encoding="utf-8") as tr:
            for mid, rec, u in s.usages():
                pm = _priced_model(rec.get("model"), spec.model_alias)
                c = R.cost(pm, u)
                mine += c
                usage.add(u)
                rb = rows_by.setdefault(rec.get("model"), {"input": 0, "cached": 0, "cache_write": 0, "output": 0, "cw1h": 0})
                for k in ("input", "cached", "cache_write", "output"):
                    rb[k] += getattr(u, k)
                rb["cw1h"] += u.cache_write_1h
                row = {"role": spec.role, "task": tid, "project": P.id, "turn": msgs_logged + 1, "provider": "claude_code",
                       "model": rec.get("model"), "alias": spec.model_alias, "input": u.input, "cached": u.cached, "cache_write": u.cache_write,
                       "cache_write_1h": u.cache_write_1h, "output": u.output, "thinking": 0, "usd": round(c, 6), "billed_usd": 0.0,
                       "notional": True, "session": session_id, "msg": mid, "at": time.strftime("%Y-%m-%dT%H:%M:%S")}
                msgs_logged += 1
                for f in filter(None, [P.path("logs/llm_calls.jsonl"), getattr(budget, "ledger", None)]):
                    Path(f).parent.mkdir(parents=True, exist_ok=True)
                    with open(f, "a", encoding="utf-8") as fh:
                        fh.write(json.dumps(row, ensure_ascii=False) + "\n")
                tr.write(json.dumps({"event": "model", "msg": mid, "model": rec.get("model"), "calls": rec.get("tools"), "usage": vars(u),
                                     "usd": round(c, 6)}) + "\n")
            r = s.result or {}
            total = float(r.get("total_cost_usd") or 0)
            mu = r.get("modelUsage") if isinstance(r.get("modelUsage"), dict) else None
            recs = []
            if seen["unknown"]:
                pass                           # an older session's earlier totals are not known: add nothing
            elif mu is not None:
                # tokens the stream did not report, priced from models.json (never the CLI's dollar estimate)
                for model, t in missing_tokens(mu, seen["mu"], rows_by).items():
                    rb = rows_by.get(model) or {}
                    w1h = t["cache_write"] if rb.get("cw1h") or not rb else 0
                    u = Usage(input=t["input"], cached=t["cached"], cache_write=t["cache_write"], output=t["output"], cache_write_1h=w1h)
                    recs.append((model, u, R.cost(_priced_model(model, spec.model_alias), u),
                                 "tokens the stream did not report (the CLI's modelUsage), priced from models.json"))
            else:
                # no modelUsage (an old CLI or a crash): the dollar total, minus what this session already accounted
                gap = round(total - seen["usd"] - mine, 6)
                if gap > max(0.001, 0.01 * total):
                    recs.append((s.model, Usage(), gap, "the CLI's session total minus earlier runs and the per-message rows (no modelUsage)"))
            seen["usd"] = total
            if mu is not None:
                seen["unknown"] = False        # from here on this session's totals are known
                seen["mu"] = {k: {cli: int((v or {}).get(cli) or 0) for _k, cli in _TOK} for k, v in mu.items()}
            for model, u, usd, why in recs:
                usage.add(u)
                row = {"role": spec.role, "task": tid, "project": P.id, "provider": "claude_code", "model": model, "alias": spec.model_alias,
                       "input": u.input, "cached": u.cached, "cache_write": u.cache_write, "cache_write_1h": u.cache_write_1h, "output": u.output,
                       "usd": round(usd, 6), "billed_usd": 0.0, "notional": True, "reconcile": True, "session": session_id,
                       "at": time.strftime("%Y-%m-%dT%H:%M:%S"), "note": why}
                with open(P.path("logs/llm_calls.jsonl"), "a", encoding="utf-8") as fh:
                    fh.write(json.dumps(row, ensure_ascii=False) + "\n")
                mine += usd
            cost += mine
            turns += int(r.get("num_turns") or 0)
            if s.model:
                model_id = s.model
            tr.write(json.dumps({"event": "result", "subtype": r.get("subtype"), "is_error": r.get("is_error"), "turns": r.get("num_turns"),
                                 "cli_usd": total, "cost_basis": {k: (v or {}).get("costBasis") for k, v in (mu or {}).items()},
                                 "killed": s.killed, "limit": s.limit, "window": s.window, "stderr": err[-5:] if not r else None,
                                 "t": round(time.monotonic() - t0, 2)}) + "\n")
        return s, (s.init or {}).get("session_id") or session_id

    session_id = sid or str(uuid.uuid4())
    s, session_id = one_session(task + tail, images, session_id, bool(sid))
    st = read_json(state_file, {}) if state_file.exists() else {}
    if s.limit:
        raise BillingError(f"claude_code: {s.limit}", provider="claude_code")
    if s.killed and s.killed.startswith("key source"):
        raise LoomError(f"claude_code: {s.killed}")
    # explore, then write (the API runtime's nudge): the model stopped without a submission, so it is asked once to write
    if not s.mismatch and not st.get("done") and not st.get("rounds") and s.result and not s.result.get("is_error") and not st.get("cc_stop"):
        s, session_id = one_session(f"You have read enough to write it. Write the complete artifact now and call `{terminal}`.",
                                    None, session_id, True)
        st = read_json(state_file, {}) if state_file.exists() else {}
        if s.limit:
            raise BillingError(f"claude_code: {s.limit}", provider="claude_code")
    ctx.state.update(st)
    if s.mismatch:
        status, note = "error", s.mismatch
    elif st.get("done"):
        status = "accepted"
    elif st.get("rounds", 0) > spec.lim("repairs"):
        status, note = "rejected", f"still failing after {spec.lim('repairs')} resubmissions"
    elif st.get("cc_stop"):
        note = st["cc_stop"]
    elif (s.result or {}).get("subtype") == "error_max_turns":
        note = "turn limit"
    elif s.result is None:
        status, note = "error", "the claude session ended without a result"
    res = AgentResult(task_id=tid, role=spec.role, status=status, artifact=st.get("artifact"),
                      errors=st.get("errors", []) if status != "accepted" else [], findings=st.get("findings", []), usage=vars(usage),
                      cost_usd=round(cost, 6), turns=turns, tool_calls=int(st.get("cc_calls", 0)),
                      repairs=max(0, st.get("rounds", 0) - 1), model=model_id, provider="claude_code",
                      seconds=round(time.monotonic() - t0, 2), trace=str(trace), note=note, value=st.get("value"))
    if session_path:
        write_json(Path(session_path), {"role": spec.role, "alias": spec.model_alias, "context": spec.context, "cache_ttl": spec.cache_ttl,
                                        "stage": ctx.stage, "beat": ctx.beat, "target": str(ctx.target) if ctx.target else None,
                                        "task_id": tid, "status": status, "system_sha": system_sha(system),
                                        "saved_at": time.strftime("%Y-%m-%dT%H:%M:%S"), "cc_session_id": session_id, "messages": [],
                                        "cc_model_usage": seen["mu"], "cc_cli_usd": seen["usd"]})
    try:
        L.log(P, "model_call", node=ctx.stage, by={"kind": "model", "model": model_id, "provider": "claude_code", "mode": "agents", "role": spec.role},
              data={"status": status, "usd": res.cost_usd, "billed_usd": 0.0, "notional": True, "turns": turns, "tool_calls": res.tool_calls,
                    "repairs": res.repairs, **vars(usage)})
    except Exception:  # noqa: BLE001
        pass
    info(f"  [{spec.role}] claude -p {m['cli']}: {status} in {turns} turns, {res.tool_calls} tool calls, ${res.cost_usd:.4f} notional"
         + (f" ({note})" if note else ""))
    return res
