"""Scriptable, deterministic mock LLM HTTP server for testing the multi-provider agent runtime.

Speaks three wire protocols (non-streaming, except Anthropic streaming when `anthropic_stream=True`, which the Shuttle
S0 uses to drive the real `claude -p` CLI with a scripted model):

  Anthropic Messages API      POST /v1/messages                              (x-api-key, anthropic-version)
  OpenAI Chat Completions     POST /v1/chat/completions                      (Authorization: Bearer)
                              GET  /v1/models                                (OpenAI list shape)
  Gemini generateContent      POST /v1beta/models/{model}:generateContent    (x-goog-api-key or ?key=)
                              GET  /v1beta/models

GET /v1/models answers in the Anthropic list shape when the request carries x-api-key or
anthropic-version, and in the OpenAI shape otherwise (both vendors use the same path).

Adapter base URLs: anthropic `<root>/v1`, openai `<root>/v1`, gemini `<root>/v1beta`.

Control endpoints (no auth):
  GET  /mock/requests   -> {"requests": [...], "unmatched": [...], "remaining": [...]}
  GET  /mock/reset      -> clears requests, unmatched, the cache memory, the id counter, and
  POST /mock/reset         restores the initial script (constructor or LOOM_MOCK_SCRIPT) unconsumed
  POST /mock/script     -> body is a list of steps or {"steps": [...]}; replaces the script
  GET  /mock/script     -> the steps with their remaining counts
  GET  /mock/health     -> {"ok": true}

SCRIPT FORMAT
A script is a list of steps. For each provider request the server scans the steps in order and
consumes the FIRST step that still has uses left and whose `match` (all keys optional, all must
hold) fits the request:

  {"name": "optional label",
   "match": {"provider": "anthropic"|"openai"|"gemini", "model": "exact id",
             "tool_available": "submit_x", "last_tool_result_contains": "substr",
             "system_contains": "substr"},
   "reply": one of
       {"text": "..."}
       {"tool": "name", "args": {...}}                 (may be combined with "text")
       {"tools": [{"name": "...", "args": {...}}, ...]}  (parallel calls)
       {"json": {...}}                                  (structured output, returned as text)
       {"error": {"http": 429|500|529|400|401|403|404|503, "retry_after": 1, "message": "..."}}
       {"stop": "max_tokens", "text": "partial"}       ("stop" may also be "safety")
       {"refusal": "..."}
     plus optional "delay_s": 2.5 and optional "thinking": "reasoning text" on any reply,
     and optional "model": "an id" (Anthropic: the message names this model instead of the requested one),
   "usage": {"input": n, "output": n, "cached": n, "thinking": n},   (optional, see below)
   "repeat": k}                                         (optional, default 1)

When no step matches the server replies with the text "ok" and appends an entry to `unmatched`.
Requests refused by auth or validation never consume a step (the real API refuses them before a
model runs).

USAGE ACCOUNTING
`usage.input` is the TOTAL prompt tokens including cached ones; `usage.output` is visible output;
`usage.thinking` is reasoning tokens. Mapping to each wire format:
  Anthropic: input_tokens = input - cache_read - cache_creation (the uncached remainder, as the
             real API reports it); output_tokens = output + thinking.
  OpenAI:    prompt_tokens = input; prompt_tokens_details.cached_tokens = cached;
             completion_tokens = output + thinking; completion_tokens_details.reasoning_tokens = thinking.
  Gemini:    promptTokenCount = input; cachedContentTokenCount = cached; candidatesTokenCount = output;
             thoughtsTokenCount = thinking; totalTokenCount = input + output + thinking.
Defaults: input = round(len(raw request body chars) / 4); output = round(len(reply chars) / 4).
Simulated caching: the cache key is (provider, first 2000 chars of the system prompt). On a repeat
of a key, the system prompt's estimated tokens are reported as cached:
  Anthropic only when the request carries cache_control anywhere (first sight is reported as
            cache_creation_input_tokens, later sights as cache_read_input_tokens);
  OpenAI    automatically, only when the system prompt is >= 1024 tokens, rounded down to a
            multiple of 128 (the real increment);
  Gemini    automatically.

Standard library only. Frames of behaviour are a pure function of (script, request sequence):
ids are derived from a counter, `created` is a fixed epoch, nothing random.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import socket
import sys
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlencode, urlsplit

PROVIDERS = ("anthropic", "openai", "gemini")
MATCH_KEYS = {"provider", "model", "tool_available", "last_tool_result_contains", "system_contains", "user_contains"}
REPLY_KEYS = {"text", "tool", "args", "tools", "json", "error", "stop", "refusal", "delay_s", "thinking", "model"}
STEP_KEYS = {"name", "match", "reply", "usage", "repeat"}
USAGE_KEYS = {"input", "output", "cached", "thinking"}
STOP_VALUES = {"max_tokens", "end_turn", "stop", "safety", "content_filter"}
ERROR_HTTP = {400, 401, 403, 404, 429, 500, 503, 529}
SECRET_HEADERS = {"x-api-key", "authorization", "x-goog-api-key", "api-key", "cookie",
                  "proxy-authorization", "openai-api-key"}
SECRET_QUERY = {"key", "api_key", "apikey"}
REDACTED = "<redacted>"
CREATED_EPOCH = 1767225600  # fixed "created" timestamp (2026-01-01T00:00:00Z) for determinism
CACHE_PREFIX_CHARS = 2000

DEFAULT_MODELS = {
    "anthropic": ["claude-opus-4-5", "claude-sonnet-4-5", "claude-haiku-4-5"],
    "openai": ["gpt-5.1", "gpt-5-mini", "gpt-4.1"],
    "gemini": ["gemini-2.5-pro", "gemini-2.5-flash", "gemini-3-pro-preview"],
}

ANTHROPIC_NAME_RE = re.compile(r"^[a-zA-Z0-9_-]{1,128}$")
OPENAI_NAME_RE = re.compile(r"^[a-zA-Z0-9_-]{1,64}$")
GEMINI_NAME_RE = re.compile(r"^[a-zA-Z_][a-zA-Z0-9_.:-]{0,127}$")


# ----------------------------------------------------------------------------- helpers

def _tok(chars: int) -> int:
    return int(round(chars / 4.0))


def _b62(seed: str, n: int) -> str:
    alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"
    h = int(hashlib.sha256(seed.encode("utf-8")).hexdigest(), 16)
    out = []
    for _ in range(n):
        h, r = divmod(h, 62)
        out.append(alphabet[r])
    return "".join(out)


def _g(d: dict, camel: str, snake: str, default=None):
    """Gemini's REST surface accepts both lowerCamel and snake_case field names."""
    if not isinstance(d, dict):
        return default
    if camel in d:
        return d[camel]
    return d.get(snake, default)


def _has_key(obj, key: str) -> bool:
    if isinstance(obj, dict):
        return key in obj or any(_has_key(v, key) for v in obj.values())
    if isinstance(obj, list):
        return any(_has_key(v, key) for v in obj)
    return False


def _text_of(obj) -> str:
    """Concatenate the human text inside a content value (string, block list, or dict)."""
    if obj is None:
        return ""
    if isinstance(obj, str):
        return obj
    if isinstance(obj, list):
        return "".join(_text_of(x) for x in obj)
    if isinstance(obj, dict):
        if isinstance(obj.get("text"), str):
            return obj["text"]
        if "content" in obj:
            return _text_of(obj["content"])
        return json.dumps(obj, sort_keys=True)
    return str(obj)


def _fmt_seconds(v) -> str:
    f = float(v)
    return str(int(f)) if f == int(f) else str(f)


class MockHTTPError(Exception):
    def __init__(self, status: int, body: dict, headers: dict | None = None, consumed: bool = False):
        super().__init__(f"{status}")
        self.status = status
        self.body = body
        self.headers = headers or {}
        self.consumed = consumed


# ----------------------------------------------------------------------------- error shapes

def anthropic_error(status: int, etype: str, message: str, seq: int = 0, headers=None) -> MockHTTPError:
    body = {"type": "error", "error": {"type": etype, "message": message},
            "request_id": "req_01" + _b62(f"req{seq}", 22)}
    return MockHTTPError(status, body, headers)


def openai_error(status: int, message: str, etype: str, code=None, param=None, headers=None) -> MockHTTPError:
    return MockHTTPError(status, {"error": {"message": message, "type": etype, "param": param, "code": code}},
                         headers)


def gemini_error(code: int, message: str, status: str, details=None, headers=None) -> MockHTTPError:
    err = {"code": code, "message": message, "status": status}
    if details:
        err["details"] = details
    return MockHTTPError(code, {"error": err}, headers)


def scripted_error(provider: str, spec: dict, seq: int) -> MockHTTPError:
    http = int(spec.get("http", 500))
    ra = spec.get("retry_after")
    msg = spec.get("message")
    headers = {}
    if provider == "anthropic":
        if ra is not None:
            headers["retry-after"] = _fmt_seconds(ra)
        etype = {400: "invalid_request_error", 401: "authentication_error", 403: "permission_error",
                 404: "not_found_error", 429: "rate_limit_error", 500: "api_error", 503: "api_error",
                 529: "overloaded_error"}[http]
        default = {429: "Number of request tokens has exceeded your per-minute rate limit "
                        "(mock rate limit).",
                   529: "Overloaded", 500: "Internal server error", 401: "invalid x-api-key",
                   400: "mock: scripted invalid request"}.get(http, "mock: scripted error")
        e = anthropic_error(http, etype, msg or default, seq, headers)
    elif provider == "openai":
        if ra is not None:
            headers["retry-after"] = _fmt_seconds(ra)
        status = 503 if http == 529 else http  # OpenAI has no 529; its overload is a 503
        if status == 429:
            e = openai_error(429, msg or "Rate limit reached for requests (mock). Please try again in "
                             f"{_fmt_seconds(ra if ra is not None else 1)}s.",
                             "requests", "rate_limit_exceeded", None, headers)
        elif status == 401:
            e = openai_error(401, msg or "Incorrect API key provided.", "invalid_request_error",
                             "invalid_api_key", None, headers)
        elif status in (500, 503):
            e = openai_error(status, msg or ("The server had an error while processing your request. "
                                             "Sorry about that!" if status == 500 else
                                             "The engine is currently overloaded, please try again later."),
                             "server_error", None, None, headers)
        else:
            e = openai_error(status, msg or "mock: scripted error", "invalid_request_error", None, None,
                             headers)
    else:
        status = 503 if http == 529 else http
        gstatus = {400: "INVALID_ARGUMENT", 401: "UNAUTHENTICATED", 403: "PERMISSION_DENIED",
                   404: "NOT_FOUND", 429: "RESOURCE_EXHAUSTED", 500: "INTERNAL", 503: "UNAVAILABLE"}[status]
        default = {429: "Resource has been exhausted (e.g. check quota).",
                   503: "The model is overloaded. Please try again later.",
                   500: "An internal error has occurred. Please retry or report in "
                        "https://developers.generativeai.google/guide/troubleshooting",
                   401: "Request had invalid authentication credentials."}.get(status, "mock: scripted error")
        details = None
        if ra is not None:
            details = [{"@type": "type.googleapis.com/google.rpc.RetryInfo",
                        "retryDelay": f"{_fmt_seconds(ra)}s"}]
        e = gemini_error(status, msg or default, gstatus, details, headers)
    e.consumed = True
    return e


# ----------------------------------------------------------------------------- script

def normalise_script(steps) -> list:
    """Validate a script and return internal step records. Raises ValueError on any typo."""
    if isinstance(steps, dict) and "steps" in steps:
        steps = steps["steps"]
    if steps is None:
        steps = []
    if not isinstance(steps, list):
        raise ValueError("script must be a list of steps (or {\"steps\": [...]})")
    out = []
    for i, st in enumerate(steps):
        where = f"script step {i}"
        if not isinstance(st, dict):
            raise ValueError(f"{where}: must be an object")
        bad = set(st) - STEP_KEYS
        if bad:
            raise ValueError(f"{where}: unknown keys {sorted(bad)}")
        match = st.get("match") or {}
        if not isinstance(match, dict) or set(match) - MATCH_KEYS:
            raise ValueError(f"{where}: match has unknown keys {sorted(set(match) - MATCH_KEYS)}")
        if "provider" in match and match["provider"] not in PROVIDERS:
            raise ValueError(f"{where}: match.provider must be one of {PROVIDERS}")
        reply = st.get("reply")
        if not isinstance(reply, dict):
            raise ValueError(f"{where}: reply is required and must be an object")
        bad = set(reply) - REPLY_KEYS
        if bad:
            raise ValueError(f"{where}: reply has unknown keys {sorted(bad)}")
        kinds = [k for k in ("tool", "tools", "json", "error", "refusal") if k in reply]
        if len(kinds) > 1:
            raise ValueError(f"{where}: reply mixes {kinds}; use one of tool/tools/json/error/refusal")
        if not kinds and "text" not in reply and "stop" not in reply:
            raise ValueError(f"{where}: reply needs one of text/tool/tools/json/error/stop/refusal")
        if "tool" in reply:
            if not isinstance(reply["tool"], str) or not isinstance(reply.get("args", {}), dict):
                raise ValueError(f"{where}: tool must be a name string and args an object")
        if "args" in reply and "tool" not in reply:
            raise ValueError(f"{where}: args given without tool")
        if "tools" in reply:
            if not isinstance(reply["tools"], list) or not reply["tools"]:
                raise ValueError(f"{where}: tools must be a non-empty list")
            for c in reply["tools"]:
                if not isinstance(c, dict) or not isinstance(c.get("name"), str) \
                        or not isinstance(c.get("args", {}), dict) or set(c) - {"name", "args"}:
                    raise ValueError(f"{where}: each tools entry is {{name, args}}")
        if "error" in reply:
            err = reply["error"]
            if not isinstance(err, dict) or int(err.get("http", 0)) not in ERROR_HTTP:
                raise ValueError(f"{where}: error.http must be one of {sorted(ERROR_HTTP)}")
            if set(err) - {"http", "retry_after", "message"}:
                raise ValueError(f"{where}: error has unknown keys")
        if "stop" in reply and reply["stop"] not in STOP_VALUES:
            raise ValueError(f"{where}: stop must be one of {sorted(STOP_VALUES)}")
        if "delay_s" in reply and float(reply["delay_s"]) < 0:
            raise ValueError(f"{where}: delay_s must be >= 0")
        usage = st.get("usage") or {}
        if not isinstance(usage, dict) or set(usage) - USAGE_KEYS:
            raise ValueError(f"{where}: usage keys must be within {sorted(USAGE_KEYS)}")
        repeat = st.get("repeat", 1)
        if not isinstance(repeat, int) or repeat < 1:
            raise ValueError(f"{where}: repeat must be an integer >= 1")
        out.append({"index": i, "name": st.get("name"), "match": dict(match), "reply": dict(reply),
                    "usage": dict(usage), "remaining": repeat})
    return out


def load_script_file(path: str) -> list:
    with open(path, "r", encoding="utf-8") as fh:
        return json.load(fh)


def _matches(match: dict, ctx: dict) -> bool:
    if "provider" in match and match["provider"] != ctx["provider"]:
        return False
    if "model" in match and match["model"] != ctx["model"]:
        return False
    if "tool_available" in match and match["tool_available"] not in ctx["tools"]:
        return False
    if "last_tool_result_contains" in match:
        last = ctx["last_tool_result"]
        if last is None or match["last_tool_result_contains"] not in last:
            return False
    if "system_contains" in match and match["system_contains"] not in ctx["system"]:
        return False
    if "user_contains" in match and match["user_contains"] not in ctx.get("body_text", ""):
        return False   # anywhere in the request's messages (added for Loom's scene-worker tests, D-115)
    return True


# ----------------------------------------------------------------------------- shared state

class _State:
    def __init__(self, script, api_key: str, models: dict, anthropic_strict_alternation: bool, anthropic_stream: bool = False):
        self.lock = threading.Lock()
        self.api_key = api_key
        self.models = models
        self.anthropic_strict_alternation = anthropic_strict_alternation
        # Claude Code (the Shuttle launcher's `claude -p`) always streams: with this on, an Anthropic request with
        # stream=true is answered as server-sent events (anthropic_sse) instead of refused (2026-10-08, Shuttle S0)
        self.anthropic_stream = anthropic_stream
        self.initial_script = script if script is not None else []
        self.steps = normalise_script(self.initial_script)
        self.requests: list = []
        self.unmatched: list = []
        self.seen_prefixes: set = set()
        self.seq = 0

    def next_seq(self) -> int:
        with self.lock:
            self.seq += 1
            return self.seq

    def set_script(self, steps) -> int:
        norm = normalise_script(steps)
        with self.lock:
            self.steps = norm
        return len(norm)

    def reset(self):
        norm = normalise_script(self.initial_script)
        with self.lock:
            self.steps = norm
            self.requests = []
            self.unmatched = []
            self.seen_prefixes = set()
            self.seq = 0

    def take(self, ctx: dict):
        with self.lock:
            for st in self.steps:
                if st["remaining"] > 0 and _matches(st["match"], ctx):
                    st["remaining"] -= 1
                    return st
            self.unmatched.append({"seq": ctx["seq"], "provider": ctx["provider"], "model": ctx["model"],
                                   "tools": sorted(ctx["tools"]),
                                   "last_tool_result": (ctx["last_tool_result"] or "")[:200],
                                   "system": ctx["system"][:200]})
            return None

    def cache_check(self, provider: str, system: str, register: bool) -> bool:
        key = (provider, system[:CACHE_PREFIX_CHARS])
        with self.lock:
            seen = key in self.seen_prefixes
            if register:
                self.seen_prefixes.add(key)
            return seen

    def record(self, rec: dict):
        with self.lock:
            self.requests.append(rec)

    def mark_delivered(self, rec: dict, delivered: bool):
        # under the lock: snapshot() serialises the same dict, and a recorded rec changes only here
        with self.lock:
            rec["delivered"] = delivered

    def snapshot(self) -> dict:
        with self.lock:
            return {"requests": json.loads(json.dumps(self.requests)),
                    "unmatched": json.loads(json.dumps(self.unmatched)),
                    "remaining": [{"index": s["index"], "name": s["name"], "remaining": s["remaining"]}
                                  for s in self.steps]}


# ----------------------------------------------------------------------------- reply resolution

def _resolve_reply(step) -> dict:
    """Turn a script reply into a neutral form: text, calls, stop, refusal, thinking, delay, error."""
    r = step["reply"] if step else {"text": "ok"}
    calls = []
    if "tool" in r:
        calls = [(r["tool"], r.get("args", {}))]
    elif "tools" in r:
        calls = [(c["name"], c.get("args", {})) for c in r["tools"]]
    text = r.get("text")
    if "json" in r:
        text = json.dumps(r["json"])
    stop = r.get("stop")
    if stop in ("stop", "end_turn"):
        stop = None
    if stop == "content_filter":
        stop = "safety"
    return {"text": text, "calls": calls, "stop": stop, "refusal": r.get("refusal"),
            "thinking": r.get("thinking"), "delay": float(r.get("delay_s", 0) or 0),
            "error": r.get("error"), "usage": (step or {}).get("usage", {}), "model": r.get("model")}


def _reply_chars(rep: dict) -> int:
    n = len(rep["text"] or "") + len(rep["refusal"] or "")
    for name, args in rep["calls"]:
        n += len(name) + len(json.dumps(args))
    return n


def _kind(rep: dict) -> str:
    if rep["error"]:
        return "error"
    if rep["refusal"] is not None:
        return "refusal"
    if rep["calls"]:
        return "tools" if len(rep["calls"]) > 1 else "tool"
    if rep["stop"]:
        return rep["stop"]
    return "text"


# ----------------------------------------------------------------------------- Anthropic

def anthropic_auth(state: _State, headers: dict, seq: int):
    key = headers.get("x-api-key")
    if not key:
        raise anthropic_error(401, "authentication_error", "x-api-key header is required", seq)
    if key != state.api_key:
        raise anthropic_error(401, "authentication_error", "invalid x-api-key", seq)


def anthropic_validate(state: _State, body: dict, headers: dict, seq: int):
    def bad(msg):
        return anthropic_error(400, "invalid_request_error", msg, seq)

    if not headers.get("anthropic-version"):
        raise bad("anthropic-version: header is required")
    if body.get("stream") and not state.anthropic_stream:
        raise bad("mock: streaming (stream=true) is not supported by the mock server")
    if not body.get("model"):
        raise bad("model: Field required")
    if "max_tokens" not in body:
        raise bad("max_tokens: Field required")
    mt = body["max_tokens"]
    if not isinstance(mt, int) or isinstance(mt, bool) or mt < 1:
        raise bad("max_tokens: Input should be greater than or equal to 1")
    msgs = body.get("messages")
    if msgs is None:
        raise bad("messages: Field required")
    if not isinstance(msgs, list):
        raise bad("messages: Input should be a valid list")
    if not msgs:
        raise bad("messages: at least one message is required")

    tools = body.get("tools") or []
    for k, t in enumerate(tools):
        if not isinstance(t, dict):
            raise bad(f"tools.{k}: Input should be a valid dictionary")
        if "type" in t and t["type"] not in (None, "custom"):
            continue  # server tools (web_search_..., etc.) have their own shapes
        if not ANTHROPIC_NAME_RE.match(str(t.get("name", ""))):
            raise bad(f"tools.{k}.custom.name: String should match pattern '^[a-zA-Z0-9_-]{{1,128}}$'")
        if not isinstance(t.get("input_schema"), dict):
            raise bad(f"tools.{k}.custom.input_schema: Field required")

    tc = body.get("tool_choice")
    if tc is not None:
        if not isinstance(tc, dict) or tc.get("type") not in ("auto", "any", "tool", "none"):
            raise bad("tool_choice: Input tag does not match any of the expected tags: 'auto', 'any', "
                      "'tool', 'none'")
        if tc["type"] == "tool" and not tc.get("name"):
            raise bad("tool_choice.tool.name: Field required")

    th = body.get("thinking")
    if th is not None:
        if not isinstance(th, dict) or th.get("type") not in ("enabled", "disabled", "adaptive"):
            raise bad("thinking: Input tag does not match any of the expected tags: 'enabled', "
                      "'disabled', 'adaptive'")
        if th["type"] == "enabled":
            bt = th.get("budget_tokens")
            if not isinstance(bt, int):
                raise bad("thinking.enabled.budget_tokens: Field required")
            if bt < 1024:
                raise bad("thinking.enabled.budget_tokens: Input should be greater than or equal to 1024")
            if bt >= mt and "interleaved-thinking" not in headers.get("anthropic-beta", ""):
                raise bad("`max_tokens` must be greater than `thinking.budget_tokens`. Please consult "
                          "our documentation at https://docs.claude.com/en/docs/build-with-claude/"
                          "extended-thinking#max-tokens-and-context-window-size")
        if th["type"] in ("enabled", "adaptive"):
            if isinstance(tc, dict) and tc.get("type") in ("any", "tool"):
                raise bad("Thinking may not be enabled when `tool_choice` forces tool use.")
            if "temperature" in body and body["temperature"] != 1:
                raise bad("`temperature` may only be set to 1 when thinking is enabled. Please consult "
                          "our documentation at https://docs.claude.com/en/docs/build-with-claude/"
                          "extended-thinking#feature-compatibility")

    prev_role = None
    pending_ids: list = []  # tool_use ids of the previous assistant message
    for i, m in enumerate(msgs):
        if not isinstance(m, dict):
            raise bad(f"messages.{i}: Input should be a valid dictionary")
        role = m.get("role")
        if role == "system" and state.anthropic_stream:
            continue      # Claude Code sends its own system-role messages (seen 2026-10-08, CLI 2.1.283); not part of alternation
        if role == "system":
            raise bad('messages: Unexpected role "system". The Messages API accepts a top-level `system` '
                      'parameter, not "system" as an input message role.')
        if role not in ("user", "assistant"):
            raise bad(f"messages.{i}.role: Input should be 'user' or 'assistant'")
        if state.anthropic_strict_alternation:
            if i == 0 and role != "user":
                raise bad('messages: first message must use the "user" role')
            if role == prev_role:
                raise bad(f'messages: roles must alternate between "user" and "assistant", but found '
                          f'multiple "{role}" roles in a row')
        content = m.get("content")
        if content is None:
            raise bad(f"messages.{i}.content: Field required")
        blocks = content if isinstance(content, list) else []
        if not isinstance(content, (str, list)):
            raise bad(f"messages.{i}.content: Input should be a valid string or list")
        for j, b in enumerate(blocks):
            if not isinstance(b, dict) or "type" not in b:
                raise bad(f"messages.{i}.content.{j}: Input should be a valid dictionary with a `type`")
            if b["type"] == "tool_use":
                if role != "assistant":
                    raise bad(f"messages.{i}.content.{j}: `tool_use` blocks may only appear in assistant "
                              f"messages")
                if not b.get("id") or not b.get("name"):
                    raise bad(f"messages.{i}.content.{j}.tool_use: `id` and `name` are required")
                if not isinstance(b.get("input"), dict):
                    raise bad(f"messages.{i}.content.{j}.tool_use.input: Input should be a valid dictionary")
            if b["type"] == "image":
                src = b.get("source")
                if not isinstance(src, dict) or src.get("type") not in ("base64", "url", "file"):
                    raise bad(f"messages.{i}.content.{j}.image.source: Input tag does not match any of the "
                              f"expected tags: 'base64', 'url', 'file'")
                if src["type"] == "base64" and (not src.get("media_type") or not src.get("data")):
                    raise bad(f"messages.{i}.content.{j}.image.source.base64: `media_type` and `data` are "
                              f"required")

        # tool_use / tool_result pairing
        results = [b for b in blocks if isinstance(b, dict) and b.get("type") == "tool_result"]
        if pending_ids:
            got = {b.get("tool_use_id") for b in results} if role == "user" else set()
            missing = [x for x in pending_ids if x not in got]
            if missing:
                raise bad(f"messages.{i}: `tool_use` ids were found without `tool_result` blocks immediately "
                          f"after: {', '.join(missing)}. Each `tool_use` block must have a corresponding "
                          f"`tool_result` block in the next message.")
        for j, b in enumerate(blocks):
            if isinstance(b, dict) and b.get("type") == "tool_result":
                if role != "user":
                    raise bad(f"messages.{i}.content.{j}: `tool_result` blocks may only appear in user "
                              f"messages")
                if b.get("tool_use_id") not in pending_ids:
                    raise bad(f"messages.{i}.content.{j}: unexpected `tool_use_id` found in `tool_result` "
                              f"blocks: {b.get('tool_use_id')}. Each `tool_result` block must have a "
                              f"corresponding `tool_use` block in the previous message.")
        pending_ids = [b["id"] for b in blocks if isinstance(b, dict) and b.get("type") == "tool_use"] \
            if role == "assistant" else []
        prev_role = role
    if pending_ids:
        raise bad(f"messages.{len(msgs)}: `tool_use` ids were found without `tool_result` blocks immediately "
                  f"after: {', '.join(pending_ids)}. Each `tool_use` block must have a corresponding "
                  f"`tool_result` block in the next message.")


def anthropic_context(body: dict) -> dict:
    sysv = body.get("system")
    system = sysv if isinstance(sysv, str) else _text_of([b for b in (sysv or []) if isinstance(b, dict)])
    tools = {t.get("name") for t in (body.get("tools") or []) if isinstance(t, dict) and t.get("name")}
    extra = [m.get("content") for m in body.get("messages") or [] if isinstance(m, dict) and m.get("role") == "system"]
    if extra:
        system = system + "\n" + _text_of([{"type": "text", "text": c} if isinstance(c, str) else c for c in extra])
    last = None
    for m in body.get("messages") or []:
        if isinstance(m.get("content"), list):
            for b in m["content"]:
                if isinstance(b, dict) and b.get("type") == "tool_result":
                    last = _text_of(b.get("content"))
    return {"model": body.get("model"), "system": system, "tools": tools, "last_tool_result": last}


def _image_chars(body: dict) -> tuple[int, int]:
    """(base64 characters, image count) of every image block in the messages, tool results included."""
    chars = n = 0

    def walk(x):
        nonlocal chars, n
        if isinstance(x, dict):
            if x.get("type") == "image" and isinstance(x.get("source"), dict):
                chars += len(str(x["source"].get("data") or ""))
                n += 1
            for v in x.values():
                walk(v)
        elif isinstance(x, list):
            for v in x:
                walk(v)
    walk(body.get("messages"))
    return chars, n


def anthropic_response(state: _State, body: dict, ctx: dict, rep: dict, seq: int, raw_len: int) -> dict:
    th = body.get("thinking") or {}
    thinking_text = rep["thinking"]
    if thinking_text is None and th.get("type") == "enabled":
        thinking_text = "Mock reasoning about the request."
    if th.get("type") not in ("enabled", "adaptive"):
        thinking_text = None
    content = []
    if thinking_text is not None:
        content.append({"type": "thinking", "thinking": thinking_text,
                        "signature": "mocksig" + _b62(f"sig{seq}", 40)})
    text = rep["refusal"] if rep["refusal"] is not None else rep["text"]
    if text is not None and (text != "" or not rep["calls"]):
        content.append({"type": "text", "text": text})
    for i, (name, args) in enumerate(rep["calls"]):
        content.append({"type": "tool_use", "id": "toolu_01" + _b62(f"toolu{seq}.{i}", 22), "name": name,
                        "input": args})
    if rep["refusal"] is not None or rep["stop"] == "safety":
        stop = "refusal"
    elif rep["calls"]:
        stop = "tool_use"
    elif rep["stop"] == "max_tokens":
        stop = "max_tokens"
    else:
        stop = "end_turn"

    u = rep["usage"]
    img_chars, imgs = _image_chars(body)
    # an image costs about 1.6k tokens on the real API, not its base64 length: counting the characters made Claude Code
    # think its context was full after one animatic and try to compact (Shuttle S0, 2026-10-08)
    total_in = u.get("input", _tok(max(0, raw_len - img_chars)) + 1600 * imgs)
    creation = read = 0
    if "cached" in u:
        read = u["cached"]
    elif ctx["system"] and _has_key(body, "cache_control"):
        sys_tok = _tok(len(ctx["system"]))
        if state.cache_check("anthropic", ctx["system"], register=True):
            read = sys_tok
        else:
            creation = sys_tok
    read = min(read, total_in)
    creation = min(creation, total_in - read)
    thinking_tok = u.get("thinking", _tok(len(thinking_text)) if thinking_text else 0)
    out_tok = u.get("output", max(1, _tok(_reply_chars(rep))))
    return {
        "id": "msg_01" + _b62(f"msg{seq}", 22),
        "type": "message",
        "role": "assistant",
        "model": rep.get("model") or body.get("model"),
        "content": content,
        "stop_reason": stop,
        "stop_sequence": None,
        "usage": {
            "input_tokens": total_in - read - creation,
            "output_tokens": out_tok + thinking_tok,
            "cache_creation_input_tokens": creation,
            "cache_read_input_tokens": read,
            "cache_creation": {"ephemeral_5m_input_tokens": creation, "ephemeral_1h_input_tokens": 0},
            "service_tier": "standard",
        },
    }


def anthropic_sse(msg: dict) -> bytes:
    """A finished Messages API response as the event stream the real API sends for stream=true: message_start, one
    start/delta/stop per content block (text_delta, input_json_delta, thinking_delta + signature_delta), message_delta
    with the stop reason and output tokens, message_stop."""
    u = dict(msg.get("usage") or {})
    out_tok = u.pop("output_tokens", 0)
    head = dict(msg, content=[], stop_reason=None, stop_sequence=None, usage=dict(u, output_tokens=1))
    ev = [("message_start", {"type": "message_start", "message": head})]
    for i, b in enumerate(msg.get("content") or []):
        if b["type"] == "text":
            start, deltas = {"type": "text", "text": ""}, [{"type": "text_delta", "text": b["text"]}]
        elif b["type"] == "tool_use":
            start = {"type": "tool_use", "id": b["id"], "name": b["name"], "input": {}}
            deltas = [{"type": "input_json_delta", "partial_json": json.dumps(b["input"], ensure_ascii=False)}]
        elif b["type"] == "thinking":
            start = {"type": "thinking", "thinking": ""}
            deltas = [{"type": "thinking_delta", "thinking": b["thinking"]}, {"type": "signature_delta", "signature": b["signature"]}]
        else:
            continue
        ev.append(("content_block_start", {"type": "content_block_start", "index": i, "content_block": start}))
        ev += [("content_block_delta", {"type": "content_block_delta", "index": i, "delta": d}) for d in deltas]
        ev.append(("content_block_stop", {"type": "content_block_stop", "index": i}))
    ev.append(("message_delta", {"type": "message_delta", "delta": {"stop_reason": msg.get("stop_reason"), "stop_sequence": None},
                                 "usage": {"output_tokens": out_tok}}))
    ev.append(("message_stop", {"type": "message_stop"}))
    return "".join(f"event: {k}\ndata: {json.dumps(v, ensure_ascii=False)}\n\n" for k, v in ev).encode("utf-8")


def anthropic_models(state: _State) -> dict:
    ids = state.models["anthropic"]
    data = [{"type": "model", "id": m, "display_name": m, "created_at": "2026-01-01T00:00:00Z"} for m in ids]
    return {"data": data, "has_more": False, "first_id": ids[0] if ids else None,
            "last_id": ids[-1] if ids else None}


# ----------------------------------------------------------------------------- OpenAI

def openai_auth(state: _State, headers: dict):
    auth = headers.get("authorization", "")
    if not auth:
        raise openai_error(401, "You didn't provide an API key. You need to provide your API key in an "
                                "Authorization header using Bearer auth (i.e. Authorization: Bearer YOUR_KEY), "
                                "or as the password field (with blank username) if you're accessing the API "
                                "from your browser and are prompted for a username and password. You can "
                                "obtain an API key from https://platform.openai.com/account/api-keys.",
                           "invalid_request_error", None)
    key = auth[7:] if auth.lower().startswith("bearer ") else auth
    if key != state.api_key:
        masked = (key[:3] + "*" * 4 + key[-4:]) if len(key) > 8 else "*" * 4
        raise openai_error(401, f"Incorrect API key provided: {masked}. You can find your API key at "
                                f"https://platform.openai.com/account/api-keys.",
                           "invalid_request_error", "invalid_api_key")


def openai_validate(body: dict):
    def bad(msg, param=None, code=None):
        return openai_error(400, msg, "invalid_request_error", code, param)

    if body.get("stream"):
        raise bad("mock: streaming (stream=true) is not supported by the mock server", "stream")
    if not body.get("model"):
        raise bad("you must provide a model parameter")
    msgs = body.get("messages")
    if msgs is None:
        raise bad("Missing required parameter: 'messages'.", "messages", "missing_required_parameter")
    if not isinstance(msgs, list) or not msgs:
        raise bad("Invalid 'messages': empty array. Expected an array with minimum length 1, but got an "
                  "empty array instead.", "messages", "empty_array")
    tools = body.get("tools")
    if tools is not None:
        for k, t in enumerate(tools):
            if not isinstance(t, dict) or t.get("type") != "function" or not isinstance(t.get("function"), dict):
                raise bad(f"Missing required parameter: 'tools[{k}].function'.", f"tools[{k}].function",
                          "missing_required_parameter")
            name = t["function"].get("name")
            if not isinstance(name, str) or not OPENAI_NAME_RE.match(name):
                raise bad(f"Invalid 'tools[{k}].function.name': string does not match pattern. Expected a "
                          f"string that matches the pattern '^[a-zA-Z0-9_-]+$'.",
                          f"tools[{k}].function.name", "invalid_value")
    tc = body.get("tool_choice")
    if tc is not None and not tools:
        raise bad("Invalid value for 'tool_choice': 'tool_choice' is only allowed when 'tools' are specified.",
                  "tool_choice")
    if tc is not None and not (tc in ("auto", "required", "none") or
                               (isinstance(tc, dict) and tc.get("type") == "function"
                                and isinstance(tc.get("function"), dict) and tc["function"].get("name"))):
        raise bad("Invalid value for 'tool_choice'.", "tool_choice", "invalid_value")
    rf = body.get("response_format")
    if isinstance(rf, dict) and rf.get("type") == "json_schema":
        js = rf.get("json_schema")
        if not isinstance(js, dict) or not js.get("name"):
            raise bad("Missing required parameter: 'response_format.json_schema.name'.",
                      "response_format.json_schema.name", "missing_required_parameter")

    pending: list = []
    pending_from = None
    for i, m in enumerate(msgs):
        if not isinstance(m, dict):
            raise bad(f"Invalid type for 'messages[{i}]': expected an object.", f"messages[{i}]", "invalid_type")
        role = m.get("role")
        if role not in ("system", "developer", "user", "assistant", "tool", "function"):
            raise bad(f"Invalid value: '{role}'. Supported values are: 'system', 'assistant', 'user', "
                      f"'function', 'tool', and 'developer'.", f"messages[{i}].role", "invalid_value")
        if role == "tool":
            tid = m.get("tool_call_id")
            if not tid:
                raise bad(f"Missing parameter 'tool_call_id': messages with role 'tool' must have a "
                          f"'tool_call_id'.", f"messages.[{i}].tool_call_id")
            if tid not in pending:
                raise bad("Invalid parameter: messages with role 'tool' must be a response to a preceeding "
                          "message with 'tool_calls'.", f"messages.[{i}].role")
            pending.remove(tid)
            continue
        if pending:
            raise bad(f"An assistant message with 'tool_calls' must be followed by tool messages responding "
                      f"to each 'tool_call_id'. The following tool_call_ids did not have response messages: "
                      f"{', '.join(pending)}", f"messages.[{pending_from}].role")
        if role == "user" and isinstance(m.get("content"), list):
            for j, p in enumerate(m["content"]):
                if not isinstance(p, dict) or p.get("type") not in ("text", "image_url", "input_audio", "file"):
                    raise bad(f"Invalid value: '{(p or {}).get('type') if isinstance(p, dict) else p}'. "
                              f"Supported values are: 'text', 'image_url', 'input_audio', 'refusal', "
                              f"'audio', and 'file'.", f"messages[{i}].content[{j}].type", "invalid_value")
                if p["type"] == "image_url" and not (isinstance(p.get("image_url"), dict)
                                                     and p["image_url"].get("url")):
                    raise bad(f"Missing required parameter: 'messages[{i}].content[{j}].image_url'.",
                              f"messages[{i}].content[{j}].image_url", "missing_required_parameter")
        if role == "assistant" and m.get("tool_calls"):
            for k, c in enumerate(m["tool_calls"]):
                base = f"messages[{i}].tool_calls[{k}]"
                if not isinstance(c, dict) or not c.get("id"):
                    raise bad(f"Missing required parameter: '{base}.id'.", f"{base}.id",
                              "missing_required_parameter")
                if c.get("type") != "function":
                    raise bad(f"Missing required parameter: '{base}.type'.", f"{base}.type",
                              "missing_required_parameter")
                fn = c.get("function")
                if not isinstance(fn, dict) or not fn.get("name"):
                    raise bad(f"Missing required parameter: '{base}.function'.", f"{base}.function",
                              "missing_required_parameter")
                if not isinstance(fn.get("arguments"), str):
                    got = type(fn.get("arguments")).__name__
                    got = {"dict": "an object", "list": "an array", "NoneType": "null"}.get(got, got)
                    raise bad(f"Invalid type for '{base}.function.arguments': expected a string, but got "
                              f"{got} instead.", f"{base}.function.arguments", "invalid_type")
            pending = [c["id"] for c in m["tool_calls"]]
            pending_from = i
    if pending:
        raise bad(f"An assistant message with 'tool_calls' must be followed by tool messages responding to "
                  f"each 'tool_call_id'. The following tool_call_ids did not have response messages: "
                  f"{', '.join(pending)}", f"messages.[{pending_from}].role")


def openai_context(body: dict) -> dict:
    sys_parts = []
    for m in body.get("messages") or []:
        if m.get("role") in ("system", "developer"):
            sys_parts.append(_text_of(m.get("content")))
        else:
            break
    tools = {t["function"]["name"] for t in (body.get("tools") or [])
             if isinstance(t, dict) and isinstance(t.get("function"), dict) and t["function"].get("name")}
    last = None
    for m in body.get("messages") or []:
        if m.get("role") == "tool":
            last = _text_of(m.get("content"))
    return {"model": body.get("model"), "system": "\n".join(sys_parts), "tools": tools, "last_tool_result": last}


def openai_response(state: _State, body: dict, ctx: dict, rep: dict, seq: int, raw_len: int) -> dict:
    msg = {"role": "assistant", "content": None, "refusal": None, "annotations": []}
    if rep["refusal"] is not None:
        msg["refusal"] = rep["refusal"]
        finish = "stop"
    else:
        msg["content"] = rep["text"]
        if rep["calls"]:
            msg["tool_calls"] = [{"id": "call_" + _b62(f"call{seq}.{i}", 24), "type": "function",
                                  "function": {"name": n, "arguments": json.dumps(a)}}
                                 for i, (n, a) in enumerate(rep["calls"])]
            finish = "tool_calls"
        elif rep["stop"] == "max_tokens":
            finish = "length"
        elif rep["stop"] == "safety":
            finish = "content_filter"
        else:
            finish = "stop"
    u = rep["usage"]
    prompt = u.get("input", _tok(raw_len))
    if "cached" in u:
        cached = u["cached"]
    else:
        cached = 0
        sys_tok = _tok(len(ctx["system"]))
        if ctx["system"] and state.cache_check("openai", ctx["system"], register=True) and sys_tok >= 1024:
            cached = (sys_tok // 128) * 128
    cached = min(cached, prompt)
    thinking = u.get("thinking", 0)
    out = u.get("output", max(1, _tok(_reply_chars(rep))))
    completion = out + thinking
    return {
        "id": "chatcmpl-" + _b62(f"chatcmpl{seq}", 29),
        "object": "chat.completion",
        "created": CREATED_EPOCH + seq,
        "model": body.get("model"),
        "choices": [{"index": 0, "message": msg, "logprobs": None, "finish_reason": finish}],
        "usage": {
            "prompt_tokens": prompt,
            "completion_tokens": completion,
            "total_tokens": prompt + completion,
            "prompt_tokens_details": {"cached_tokens": cached, "audio_tokens": 0},
            "completion_tokens_details": {"reasoning_tokens": thinking, "audio_tokens": 0,
                                          "accepted_prediction_tokens": 0, "rejected_prediction_tokens": 0},
        },
        "service_tier": "default",
        "system_fingerprint": "fp_mock" + _b62("fp", 6),
    }


def openai_models(state: _State) -> dict:
    return {"object": "list", "data": [{"id": m, "object": "model", "created": CREATED_EPOCH, "owned_by": "system"}
                                       for m in state.models["openai"]]}


# ----------------------------------------------------------------------------- Gemini

def gemini_auth(state: _State, headers: dict, query: dict):
    key = headers.get("x-goog-api-key") or (query.get("key") or [None])[0]
    if not key:
        raise gemini_error(403, "Method doesn't allow unregistered callers (callers without established "
                                "identity). Please use API Key or other form of API consumer identity to call "
                                "this API.", "PERMISSION_DENIED")
    if key != state.api_key:
        raise gemini_error(400, "API key not valid. Please pass a valid API key.", "INVALID_ARGUMENT",
                           [{"@type": "type.googleapis.com/google.rpc.ErrorInfo", "reason": "API_KEY_INVALID",
                             "domain": "googleapis.com",
                             "metadata": {"service": "generativelanguage.googleapis.com"}}])


def gemini_validate(body: dict):
    def bad(msg):
        return gemini_error(400, msg, "INVALID_ARGUMENT")

    contents = body.get("contents")
    if not contents:
        raise bad("* GenerateContentRequest.contents: contents is not specified\n")
    if not isinstance(contents, list):
        raise bad("Invalid JSON payload received. Unknown name \"contents\": Proto field is not repeating, "
                  "cannot start list.")
    tools = body.get("tools") or []
    for k, t in enumerate(tools):
        for d, fd in enumerate(_g(t, "functionDeclarations", "function_declarations", []) or []):
            if not GEMINI_NAME_RE.match(str(fd.get("name", ""))):
                raise bad(f"* GenerateContentRequest.tools[{k}].function_declarations[{d}].name: Invalid "
                          f"function name. Must start with a letter or an underscore. Must be alphameric "
                          f"(a-z, A-Z, 0-9), underscores (_), dots (.), colons (:), or dashes (-), with a "
                          f"maximum length of 128.\n")
    fcc = _g(_g(body, "toolConfig", "tool_config", {}) or {}, "functionCallingConfig",
             "function_calling_config", {}) or {}
    mode = fcc.get("mode")
    if mode is not None and mode not in ("AUTO", "ANY", "NONE", "VALIDATED", "MODE_UNSPECIFIED"):
        raise bad(f"Invalid value at 'tool_config.function_calling_config.mode' "
                  f"(type.googleapis.com/google.ai.generativelanguage.v1beta.FunctionCallingConfig.Mode), "
                  f"\"{mode}\"")

    prev_calls = 0       # number of functionCall parts in the previous content, 0 if none
    prev_role = None
    for i, c in enumerate(contents):
        role = c.get("role", "user") if isinstance(c, dict) else None
        if role not in ("user", "model", "function"):
            raise bad("Please use a valid role: user, model.")
        parts = c.get("parts")
        if not parts:
            raise bad(f"* GenerateContentRequest.contents[{i}].parts: contents.parts must not be empty.\n")
        calls = responses = 0
        for j, p in enumerate(parts):
            fc = _g(p, "functionCall", "function_call")
            fr = _g(p, "functionResponse", "function_response")
            if fc is not None:
                calls += 1
                if "args" in fc and not isinstance(fc["args"], dict):
                    raise bad(f"Invalid value at 'contents[{i}].parts[{j}].function_call.args' "
                              f"(type.googleapis.com/google.protobuf.Struct), {json.dumps(fc['args'])}")
            if fr is not None:
                responses += 1
                if not isinstance(fr.get("response"), dict):
                    raise bad(f"Invalid value at 'contents[{i}].parts[{j}].function_response.response' "
                              f"(type.googleapis.com/google.protobuf.Struct), {json.dumps(fr.get('response'))}")
        if calls and role != "model":
            raise bad("Please ensure that function call turns are model turns.")
        if calls and not (i > 0 and prev_role in ("user", "function")):
            raise bad("Please ensure that function call turn comes immediately after a user turn or after a "
                      "function response turn.")
        if responses:
            if prev_calls == 0:
                raise bad("Please ensure that function response turn comes immediately after a function call "
                          "turn.")
            if responses != prev_calls:
                raise bad("Please ensure that the number of function response parts is equal to the number of "
                          "function call parts of the function call turn.")
        elif prev_calls:
            raise bad("Please ensure that function response turn comes immediately after a function call turn.")
        prev_calls = calls
        prev_role = role


def gemini_context(body: dict, model: str) -> dict:
    si = _g(body, "systemInstruction", "system_instruction") or {}
    system = "".join(p.get("text", "") for p in (si.get("parts") or []) if isinstance(p, dict)) \
        if isinstance(si, dict) else ""
    tools = set()
    for t in body.get("tools") or []:
        for fd in _g(t, "functionDeclarations", "function_declarations", []) or []:
            if fd.get("name"):
                tools.add(fd["name"])
    last = None
    for c in body.get("contents") or []:
        for p in c.get("parts") or []:
            fr = _g(p, "functionResponse", "function_response")
            if fr is not None:
                last = f"{fr.get('name', '')} {json.dumps(fr.get('response'), sort_keys=True)}"
    return {"model": model, "system": system, "tools": tools, "last_tool_result": last}


def gemini_response(state: _State, body: dict, ctx: dict, rep: dict, seq: int, raw_len: int) -> dict:
    gc = _g(body, "generationConfig", "generation_config", {}) or {}
    tc = _g(gc, "thinkingConfig", "thinking_config", {}) or {}
    include = bool(_g(tc, "includeThoughts", "include_thoughts", False))
    thinking_text = rep["thinking"]
    if thinking_text is None and include:
        thinking_text = "Mock reasoning about the request."
    u = rep["usage"]
    prompt = u.get("input", _tok(raw_len))
    if "cached" in u:
        cached = u["cached"]
    else:
        cached = 0
        if ctx["system"] and state.cache_check("gemini", ctx["system"], register=True):
            cached = _tok(len(ctx["system"]))
    cached = min(cached, prompt)
    thoughts = u.get("thinking", _tok(len(thinking_text)) if thinking_text else 0)
    out = u.get("output", max(1, _tok(_reply_chars(rep))))

    if rep["refusal"] is not None or rep["stop"] == "safety":
        cand = {"finishReason": "SAFETY", "index": 0,
                "safetyRatings": [{"category": "HARM_CATEGORY_DANGEROUS_CONTENT", "probability": "HIGH",
                                   "blocked": True}]}
        out = u.get("output", 0)
    else:
        parts = []
        if include and thinking_text:
            parts.append({"text": thinking_text, "thought": True})
        if rep["text"] is not None and (rep["text"] != "" or not rep["calls"]):
            parts.append({"text": rep["text"]})
        signed = str(ctx["model"]).startswith("gemini-3") or bool(tc)
        for i, (name, args) in enumerate(rep["calls"]):
            part = {"functionCall": {"name": name, "args": args}}
            if i == 0 and signed:
                part["thoughtSignature"] = "mocksig" + _b62(f"gsig{seq}", 40)
            parts.append(part)
        finish = "MAX_TOKENS" if rep["stop"] == "max_tokens" else "STOP"
        cand = {"content": {"parts": parts, "role": "model"}, "finishReason": finish, "index": 0}
    usage = {"promptTokenCount": prompt, "candidatesTokenCount": out,
             "totalTokenCount": prompt + out + thoughts,
             "promptTokensDetails": [{"modality": "TEXT", "tokenCount": prompt}]}
    if cached:
        usage["cachedContentTokenCount"] = cached
        usage["cacheTokensDetails"] = [{"modality": "TEXT", "tokenCount": cached}]
    if thoughts:
        usage["thoughtsTokenCount"] = thoughts
    return {"candidates": [cand], "usageMetadata": usage, "modelVersion": ctx["model"],
            "responseId": _b62(f"resp{seq}", 22)}


def gemini_models(state: _State) -> dict:
    return {"models": [{"name": f"models/{m}", "version": "001", "displayName": m, "description": "mock model",
                        "inputTokenLimit": 1048576, "outputTokenLimit": 65536,
                        "supportedGenerationMethods": ["generateContent", "countTokens"]}
                       for m in state.models["gemini"]]}


# ----------------------------------------------------------------------------- HTTP plumbing

GEMINI_PATH = re.compile(r"^/v1beta/models/([^/:]+):([A-Za-z]+)$")
_QUIET = (BrokenPipeError, ConnectionResetError, ConnectionAbortedError, socket.timeout, TimeoutError)


def _redact_headers(headers) -> dict:
    return {k.lower(): (REDACTED if k.lower() in SECRET_HEADERS else v) for k, v in headers.items()}


def _redact_path(path: str) -> str:
    parts = urlsplit(path)
    if not parts.query:
        return path
    q = parse_qs(parts.query, keep_blank_values=True)
    for k in list(q):
        if k.lower() in SECRET_QUERY:
            q[k] = [REDACTED]
    return parts.path + "?" + urlencode(q, doseq=True, safe="<>")


class _Handler(BaseHTTPRequestHandler):
    server_version = "LoomMockLLM/1.0"
    state: _State = None  # set on a per-server subclass

    def log_message(self, *a):  # keep test output clean
        pass

    def handle(self):
        try:
            super().handle()
        except _QUIET:
            pass

    def do_GET(self):
        self._dispatch("GET")

    def do_POST(self):
        self._dispatch("POST")

    # -- io
    def _send(self, status: int, body: dict, headers: dict | None = None) -> bool:
        data = json.dumps(body).encode("utf-8")
        try:
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            for k, v in (headers or {}).items():
                self.send_header(k, v)
            self.end_headers()
            self.wfile.write(data)
            self.wfile.flush()
            return True
        except _QUIET:
            self.close_connection = True
            return False

    def _read_body(self) -> str:
        n = int(self.headers.get("Content-Length") or 0)
        return self.rfile.read(n).decode("utf-8") if n > 0 else ""

    # -- routing
    def _dispatch(self, method: str):
        st = self.state
        url = urlsplit(self.path)
        path = url.path
        try:
            raw = self._read_body() if method == "POST" else ""
        except _QUIET:
            return
        if path.startswith("/mock/"):
            return self._control(method, path, raw)

        hdr = {k.lower(): v for k, v in self.headers.items()}
        provider = None
        action = None
        model = None
        if path == "/v1/messages" and method == "POST":
            provider, action = "anthropic", "generate"
        elif path == "/v1/chat/completions" and method == "POST":
            provider, action = "openai", "generate"
        elif path == "/v1/models" and method == "GET":
            provider = "anthropic" if ("x-api-key" in hdr or "anthropic-version" in hdr) else "openai"
            action = "models"
        elif path == "/v1beta/models" and method == "GET":
            provider, action = "gemini", "models"
        else:
            m = GEMINI_PATH.match(path)
            if m and method == "POST":
                provider, model, action = "gemini", m.group(1), m.group(2)
        if provider is None:
            return self._send(404, {"error": {"message": f"mock: no route for {method} {path}",
                                              "type": "not_found"}})

        seq = st.next_seq()
        rec = {"seq": seq, "provider": provider, "method": method, "path": _redact_path(self.path),
               "model": model, "headers": _redact_headers(self.headers), "body": None, "status": None,
               "step": None, "step_name": None, "reply": None, "unmatched": False, "auth_ok": False,
               "delivered": None}
        status, resp, headers, delay = self._provider(provider, action, model, raw, hdr, url, seq, rec)
        rec["status"] = status
        sse = provider == "anthropic" and status == 200 and isinstance(rec.get("body"), dict) \
            and bool(rec["body"].get("stream")) and action == "generate"
        if sse:
            rec["stream"] = True
        # recorded BEFORE the reply goes out, with delivered None while it is in flight: a client that has its reply
        # must find its request in requests (recorded after the send, a loaded machine let the client read first)
        st.record(rec)
        if delay:
            time.sleep(delay)
        st.mark_delivered(rec, self._send_sse(anthropic_sse(resp), headers) if sse else self._send(status, resp, headers))

    def _send_sse(self, data: bytes, headers: dict | None = None) -> bool:
        try:
            self.send_response(200)
            self.send_header("Content-Type", "text/event-stream")
            self.send_header("Content-Length", str(len(data)))
            for k, v in (headers or {}).items():
                self.send_header(k, v)
            self.end_headers()
            self.wfile.write(data)
            self.wfile.flush()
            return True
        except _QUIET:
            self.close_connection = True
            return False

    def _provider(self, provider, action, model, raw, hdr, url, seq, rec):
        st = self.state
        query = parse_qs(url.query)
        delay = 0.0
        rid = {"anthropic": {"request-id": "req_01" + _b62(f"req{seq}", 22)},
               "openai": {"x-request-id": "req_" + _b62(f"xreq{seq}", 32)},
               "gemini": {}}[provider]
        try:
            if provider == "anthropic":
                anthropic_auth(st, hdr, seq)
            elif provider == "openai":
                openai_auth(st, hdr)
            else:
                gemini_auth(st, hdr, query)
            rec["auth_ok"] = True

            if action == "models":
                body = {"anthropic": anthropic_models, "openai": openai_models, "gemini": gemini_models}[
                    provider](st)
                rec["reply"] = "models"
                return 200, body, rid, 0.0

            if provider == "gemini" and action != "generateContent":
                raise gemini_error(400 if action == "streamGenerateContent" else 404,
                                   f"mock: method '{action}' is not supported by the mock server "
                                   f"(only generateContent)",
                                   "INVALID_ARGUMENT" if action == "streamGenerateContent" else "NOT_FOUND")
            try:
                body = json.loads(raw) if raw else {}
                if not isinstance(body, dict):
                    raise ValueError("not an object")
            except ValueError as e:
                if provider == "anthropic":
                    raise anthropic_error(400, "invalid_request_error", f"There was an error parsing the "
                                                                        f"body: {e}", seq)
                if provider == "openai":
                    raise openai_error(400, "We could not parse the JSON body of your request. (HINT: This "
                                            "likely means you aren't using your HTTP library correctly.)",
                                       "invalid_request_error")
                raise gemini_error(400, f"Invalid JSON payload received. {e}", "INVALID_ARGUMENT")
            rec["body"] = body
            if provider == "anthropic":
                anthropic_validate(st, body, hdr, seq)
                ctx = anthropic_context(body)
                ctx["body_text"] = json.dumps(body.get("messages") or body.get("contents") or [], ensure_ascii=False)
                rec["model"] = ctx["model"]
            elif provider == "openai":
                openai_validate(body)
                ctx = openai_context(body)
                ctx["body_text"] = json.dumps(body.get("messages") or body.get("contents") or [], ensure_ascii=False)
                rec["model"] = ctx["model"]
            else:
                gemini_validate(body)
                ctx = gemini_context(body, model)
                ctx["body_text"] = json.dumps(body.get("messages") or body.get("contents") or [], ensure_ascii=False)

            ctx["provider"] = provider
            ctx["seq"] = seq
            step = st.take(ctx)
            rec["step"] = step["index"] if step else None
            rec["step_name"] = step["name"] if step else None
            rec["unmatched"] = step is None
            rep = _resolve_reply(step)
            rec["reply"] = _kind(rep)
            delay = rep["delay"]
            if rep["error"]:
                e = scripted_error(provider, rep["error"], seq)
                e.headers.update(rid)
                return e.status, e.body, e.headers, delay
            builder = {"anthropic": anthropic_response, "openai": openai_response,
                       "gemini": gemini_response}[provider]
            return 200, builder(st, body, ctx, rep, seq, len(raw)), rid, delay
        except MockHTTPError as e:
            e.headers.update(rid)
            if rec["reply"] is None:
                rec["reply"] = "rejected"
            return e.status, e.body, e.headers, delay

    def _control(self, method: str, path: str, raw: str):
        st = self.state
        if path == "/mock/health":
            return self._send(200, {"ok": True})
        if path == "/mock/requests" and method == "GET":
            return self._send(200, st.snapshot())
        if path == "/mock/reset" and method in ("GET", "POST"):
            st.reset()
            return self._send(200, {"ok": True})
        if path == "/mock/script" and method == "GET":
            return self._send(200, {"remaining": st.snapshot()["remaining"]})
        if path == "/mock/script" and method == "POST":
            try:
                n = st.set_script(json.loads(raw or "null"))
            except (ValueError, TypeError) as e:
                return self._send(400, {"error": {"message": f"mock: bad script: {e}"}})
            return self._send(200, {"ok": True, "steps": n})
        return self._send(404, {"error": {"message": f"mock: no control route {method} {path}"}})


class _Server(ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True

    def handle_error(self, request, client_address):
        exc = sys.exc_info()[1]
        if isinstance(exc, _QUIET):
            return
        super().handle_error(request, client_address)


# ----------------------------------------------------------------------------- public API

class MockLLM:
    """In-process mock LLM server.

        with MockLLM(script=[{"reply": {"text": "hi"}}]) as mock:
            base = mock.base_url              # http://127.0.0.1:<port>
            ...                               # anthropic/openai at base + "/v1", gemini at base + "/v1beta"
            mock.requests, mock.unmatched

    `script=None` loads the JSON file named by LOOM_MOCK_SCRIPT if set, else starts empty.
    """

    def __init__(self, script=None, api_key: str | None = None, host: str = "127.0.0.1", port: int = 0,
                 models: dict | None = None, anthropic_strict_alternation: bool = True, anthropic_stream: bool = False):
        if script is None and os.environ.get("LOOM_MOCK_SCRIPT"):
            script = load_script_file(os.environ["LOOM_MOCK_SCRIPT"])
        if api_key is None:
            api_key = os.environ.get("LOOM_MOCK_API_KEY", "test-key")
        mdl = {k: list(v) for k, v in DEFAULT_MODELS.items()}
        mdl.update(models or {})
        self._state = _State(script, api_key, mdl, anthropic_strict_alternation, anthropic_stream)
        self._host = host
        self._port = port
        self._server: _Server | None = None
        self._thread: threading.Thread | None = None
        self.base_url: str | None = None

    # lifecycle
    def start(self) -> str:
        if self._server is not None:
            return self.base_url
        handler = type("_BoundHandler", (_Handler,), {"state": self._state})
        self._server = _Server((self._host, self._port), handler)
        host, port = self._server.server_address[:2]
        self.base_url = f"http://{host}:{port}"
        self._thread = threading.Thread(target=self._server.serve_forever, name="loom-mock-llm", daemon=True)
        self._thread.start()
        return self.base_url

    def stop(self):
        if self._server is None:
            return
        self._server.shutdown()
        self._server.server_close()
        self._thread.join(timeout=5)
        self._server = None
        self._thread = None

    def serve_forever(self):
        """Blocking variant for the CLI."""
        self.start()
        try:
            while True:
                time.sleep(3600)
        except KeyboardInterrupt:
            self.stop()

    def __enter__(self):
        self.start()
        return self

    def __exit__(self, *exc):
        self.stop()

    # control
    def set_script(self, steps) -> int:
        return self._state.set_script(steps)

    def reset(self):
        self._state.reset()

    @property
    def requests(self) -> list:
        return self._state.snapshot()["requests"]

    @property
    def unmatched(self) -> list:
        return self._state.snapshot()["unmatched"]

    @property
    def remaining(self) -> list:
        return self._state.snapshot()["remaining"]

    # convenience base URLs for adapters
    @property
    def anthropic_base(self) -> str:
        return f"{self.base_url}/v1"

    @property
    def openai_base(self) -> str:
        return f"{self.base_url}/v1"

    @property
    def gemini_base(self) -> str:
        return f"{self.base_url}/v1beta"


def main(argv=None):
    ap = argparse.ArgumentParser(description="Loom mock LLM server (Anthropic, OpenAI, Gemini wire formats)")
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=8799)
    ap.add_argument("--script", help="JSON script file (default: $LOOM_MOCK_SCRIPT)")
    ap.add_argument("--api-key", default=None, help="expected API key (default: $LOOM_MOCK_API_KEY or test-key)")
    ap.add_argument("--anthropic-stream", action="store_true", help="answer Anthropic stream=true as server-sent events (Claude Code)")
    a = ap.parse_args(argv)
    script = load_script_file(a.script) if a.script else None
    mock = MockLLM(script=script, api_key=a.api_key, host=a.host, port=a.port, anthropic_stream=a.anthropic_stream,
                   anthropic_strict_alternation=not a.anthropic_stream)
    print(f"mock LLM listening on {mock.start()}  (anthropic/openai: /v1, gemini: /v1beta)", flush=True)
    mock.serve_forever()


if __name__ == "__main__":
    main()
