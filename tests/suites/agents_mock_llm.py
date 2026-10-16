"""Self-tests for loom/agents/llm/mock_server.py (standard library only, urllib, no network).

Each `mock_llm_<claim>()` returns a short string on success and raises AssertionError on failure.
Run from the repo root:
  python3 -c "import sys; sys.path.insert(0,'tests/suites'); import agents_mock_llm as t; \
[print(n, getattr(t,n)()) for n in dir(t) if n.startswith('mock_llm_')]"
"""
from __future__ import annotations

import io
import json
import os
import socket
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from loom.agents.llm.mock_server import MockLLM  # noqa: E402

KEY = "test-key"
LONG_SYSTEM = "You are the Loom lesson planner. " * 200  # about 6600 chars, about 1650 tokens


# ----------------------------------------------------------------------------- tiny http client

def _call(url, body=None, headers=None, method=None):
    data = None if body is None else json.dumps(body).encode("utf-8")
    req = urllib.request.Request(url, data=data, method=method or ("POST" if data is not None else "GET"))
    req.add_header("Content-Type", "application/json")
    for k, v in (headers or {}).items():
        req.add_header(k, v)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status, json.loads(r.read() or b"null"), dict(r.headers)
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read() or b"null"), dict(e.headers)


def anthropic(base, body, key=KEY, version="2023-06-01", extra=None):
    h = {"anthropic-version": version} if version else {}
    if key is not None:
        h["x-api-key"] = key
    h.update(extra or {})
    return _call(base + "/v1/messages", body, h)


def openai(base, body, key=KEY):
    return _call(base + "/v1/chat/completions", body, {"Authorization": f"Bearer {key}"} if key else {})


def gemini(base, model, body, key=KEY, via_query=False):
    url = f"{base}/v1beta/models/{model}:generateContent"
    if via_query:
        return _call(url + f"?key={key}", body)
    return _call(url, body, {"x-goog-api-key": key} if key else {})


A_TOOLS = [{"name": "submit_plan", "description": "Submit the plan", "input_schema": {
    "type": "object", "properties": {"title": {"type": "string"}}, "required": ["title"]}}]
O_TOOLS = [{"type": "function", "function": {"name": "submit_plan", "description": "Submit the plan",
                                              "parameters": {"type": "object",
                                                             "properties": {"title": {"type": "string"}}}}}]
G_TOOLS = [{"functionDeclarations": [{"name": "submit_plan", "description": "Submit the plan",
                                      "parameters": {"type": "object",
                                                     "properties": {"title": {"type": "string"}}}}]}]


def _a_body(messages=None, **kw):
    b = {"model": "claude-sonnet-4-5", "max_tokens": 1024,
         "messages": messages or [{"role": "user", "content": "plan it"}]}
    b.update(kw)
    return b


def _o_body(messages=None, **kw):
    b = {"model": "gpt-5.1", "messages": messages or [{"role": "user", "content": "plan it"}]}
    b.update(kw)
    return b


def _g_body(contents=None, **kw):
    b = {"contents": contents or [{"role": "user", "parts": [{"text": "plan it"}]}]}
    b.update(kw)
    return b


TOOL_STEP = {"reply": {"tool": "submit_plan", "args": {"title": "Spacing"}}}


# ----------------------------------------------------------------------------- tests

def mock_llm_anthropic_tool_call_shape():
    with MockLLM(script=[dict(TOOL_STEP, match={"provider": "anthropic", "tool_available": "submit_plan"})]) as m:
        st, r, h = anthropic(m.base_url, _a_body(tools=A_TOOLS, tool_choice={"type": "auto"}))
        assert st == 200, (st, r)
        assert r["type"] == "message" and r["role"] == "assistant" and r["id"].startswith("msg_"), r
        assert r["stop_reason"] == "tool_use", r
        tu = [b for b in r["content"] if b["type"] == "tool_use"]
        assert len(tu) == 1 and tu[0]["id"].startswith("toolu_") and tu[0]["name"] == "submit_plan", r
        assert tu[0]["input"] == {"title": "Spacing"}, "input must be an object, not a string"
        u = r["usage"]
        for k in ("input_tokens", "output_tokens", "cache_creation_input_tokens", "cache_read_input_tokens"):
            assert isinstance(u[k], int), (k, u)
        assert h.get("request-id", "").startswith("req_"), h
        # round trip: the tool_result answers the tool_use, so the follow-up is accepted
        msgs = [{"role": "user", "content": "plan it"}, {"role": "assistant", "content": r["content"]},
                {"role": "user", "content": [{"type": "tool_result", "tool_use_id": tu[0]["id"],
                                              "content": "saved"}]}]
        st2, r2, _ = anthropic(m.base_url, _a_body(msgs, tools=A_TOOLS))
        assert st2 == 200 and r2["content"][0]["text"] == "ok" and r2["stop_reason"] == "end_turn", r2
        return f"tool_use {tu[0]['id']} ok, round trip ok"


def mock_llm_openai_tool_call_shape():
    with MockLLM(script=[dict(TOOL_STEP, match={"provider": "openai"})]) as m:
        st, r, _ = openai(m.base_url, _o_body(tools=O_TOOLS, tool_choice="required"))
        assert st == 200, (st, r)
        assert r["object"] == "chat.completion" and r["id"].startswith("chatcmpl-"), r
        ch = r["choices"][0]
        assert ch["index"] == 0 and ch["finish_reason"] == "tool_calls", ch
        msg = ch["message"]
        assert msg["role"] == "assistant" and msg["content"] is None and msg["refusal"] is None, msg
        tc = msg["tool_calls"][0]
        assert tc["type"] == "function" and tc["id"].startswith("call_"), tc
        assert isinstance(tc["function"]["arguments"], str), "arguments must be a JSON string"
        assert json.loads(tc["function"]["arguments"]) == {"title": "Spacing"}
        u = r["usage"]
        assert u["total_tokens"] == u["prompt_tokens"] + u["completion_tokens"], u
        assert "cached_tokens" in u["prompt_tokens_details"] and "reasoning_tokens" in u["completion_tokens_details"]
        msgs = [{"role": "user", "content": "plan it"}, msg,
                {"role": "tool", "tool_call_id": tc["id"], "content": "saved"}]
        st2, r2, _ = openai(m.base_url, _o_body(msgs, tools=O_TOOLS))
        assert st2 == 200 and r2["choices"][0]["message"]["content"] == "ok", r2
        return f"tool_calls {tc['id']} ok, round trip ok"


def mock_llm_gemini_tool_call_shape():
    with MockLLM(script=[dict(TOOL_STEP, match={"provider": "gemini", "model": "gemini-3-pro-preview"})]) as m:
        st, r, _ = gemini(m.base_url, "gemini-3-pro-preview",
                          _g_body(tools=G_TOOLS, toolConfig={"functionCallingConfig": {"mode": "ANY"}}))
        assert st == 200, (st, r)
        cand = r["candidates"][0]
        assert cand["index"] == 0 and cand["finishReason"] == "STOP" and cand["content"]["role"] == "model", cand
        fc_parts = [p for p in cand["content"]["parts"] if "functionCall" in p]
        assert fc_parts and fc_parts[0]["functionCall"] == {"name": "submit_plan", "args": {"title": "Spacing"}}
        assert "thoughtSignature" in fc_parts[0], "gemini-3 function calls carry a thoughtSignature"
        um = r["usageMetadata"]
        assert um["totalTokenCount"] == um["promptTokenCount"] + um["candidatesTokenCount"], um
        assert r["modelVersion"] == "gemini-3-pro-preview", r
        contents = [{"role": "user", "parts": [{"text": "plan it"}]}, cand["content"],
                    {"role": "user", "parts": [{"functionResponse": {"name": "submit_plan",
                                                                     "response": {"result": "saved"}}}]}]
        st2, r2, _ = gemini(m.base_url, "gemini-3-pro-preview", _g_body(contents, tools=G_TOOLS), via_query=True)
        assert st2 == 200 and r2["candidates"][0]["content"]["parts"][0]["text"] == "ok", r2
        return "functionCall ok, ?key= auth ok, round trip ok"


def mock_llm_scripted_429_then_success():
    script = [{"match": {"provider": p}, "reply": {"error": {"http": 429, "retry_after": 1}}}
              for p in ("anthropic", "openai", "gemini")]
    script += [{"reply": {"text": "recovered"}, "repeat": 3}]
    with MockLLM(script=script) as m:
        st, r, h = anthropic(m.base_url, _a_body())
        assert st == 429 and r["type"] == "error" and r["error"]["type"] == "rate_limit_error", r
        assert h.get("retry-after") == "1", h
        st, r, _ = anthropic(m.base_url, _a_body())
        assert st == 200 and r["content"][0]["text"] == "recovered", r

        st, r, h = openai(m.base_url, _o_body())
        assert st == 429 and r["error"]["code"] == "rate_limit_exceeded" and h.get("retry-after") == "1", (r, h)
        assert set(r["error"]) == {"message", "type", "param", "code"}, r
        st, r, _ = openai(m.base_url, _o_body())
        assert st == 200 and r["choices"][0]["message"]["content"] == "recovered", r

        st, r, _ = gemini(m.base_url, "gemini-2.5-flash", _g_body())
        assert st == 429 and r["error"]["status"] == "RESOURCE_EXHAUSTED" and r["error"]["code"] == 429, r
        assert r["error"]["details"][0]["retryDelay"] == "1s", r
        st, r, _ = gemini(m.base_url, "gemini-2.5-flash", _g_body())
        assert st == 200 and r["candidates"][0]["content"]["parts"][0]["text"] == "recovered", r
        assert not m.unmatched, m.unmatched
        return "429 then 200 on all three providers"


def mock_llm_scripted_529_overloaded_mapping():
    with MockLLM(script=[{"reply": {"error": {"http": 529}}, "repeat": 3}]) as m:
        st, r, _ = anthropic(m.base_url, _a_body())
        assert st == 529 and r["error"]["type"] == "overloaded_error", r
        st, r, _ = openai(m.base_url, _o_body())
        assert st == 503 and r["error"]["type"] == "server_error", r
        st, r, _ = gemini(m.base_url, "gemini-2.5-flash", _g_body())
        assert st == 503 and r["error"]["status"] == "UNAVAILABLE", r
        return "529 -> anthropic 529, openai 503, gemini 503"


def mock_llm_anthropic_alternation_violation_400():
    with MockLLM(script=[{"reply": {"text": "should not be consumed"}}]) as m:
        two_users = [{"role": "user", "content": "a"}, {"role": "user", "content": "b"}]
        st, r, _ = anthropic(m.base_url, _a_body(two_users))
        assert st == 400 and r["error"]["type"] == "invalid_request_error", r
        assert "alternate" in r["error"]["message"], r
        st, r, _ = anthropic(m.base_url, _a_body([{"role": "assistant", "content": "x"}]))
        assert st == 400 and "first message" in r["error"]["message"], r
        dangling = [{"role": "user", "content": "go"},
                    {"role": "assistant", "content": [{"type": "tool_use", "id": "toolu_x", "name": "submit_plan",
                                                       "input": {}}]},
                    {"role": "user", "content": "no result here"}]
        st, r, _ = anthropic(m.base_url, _a_body(dangling, tools=A_TOOLS))
        assert st == 400 and "toolu_x" in r["error"]["message"] and "tool_result" in r["error"]["message"], r
        st, r, _ = anthropic(m.base_url, {"model": "claude-sonnet-4-5", "messages": [{"role": "user", "content": "x"}]})
        assert st == 400 and "max_tokens" in r["error"]["message"], r
        st, r, _ = anthropic(m.base_url, _a_body([{"role": "system", "content": "x"},
                                                  {"role": "user", "content": "y"}]))
        assert st == 400 and "system" in r["error"]["message"], r
        assert m.remaining[0]["remaining"] == 1, "a refused request must not consume a script step"
        return "alternation, first role, dangling tool_use, max_tokens, system role all 400"


def mock_llm_openai_unanswered_tool_call_400():
    with MockLLM() as m:
        msgs = [{"role": "user", "content": "go"},
                {"role": "assistant", "content": None,
                 "tool_calls": [{"id": "call_a", "type": "function",
                                 "function": {"name": "submit_plan", "arguments": "{}"}},
                                {"id": "call_b", "type": "function",
                                 "function": {"name": "submit_plan", "arguments": "{}"}}]},
                {"role": "tool", "tool_call_id": "call_a", "content": "done"},
                {"role": "user", "content": "next"}]
        st, r, _ = openai(m.base_url, _o_body(msgs, tools=O_TOOLS))
        assert st == 400 and "call_b" in r["error"]["message"] and "call_a" not in r["error"]["message"], r
        assert r["error"]["type"] == "invalid_request_error", r
        # an unanswered call in the MIDDLE of the history (later calls answered) is still refused
        mid = [{"role": "user", "content": "go"},
               {"role": "assistant", "tool_calls": [{"id": "call_a", "type": "function",
                                                     "function": {"name": "submit_plan", "arguments": "{}"}}]},
               {"role": "user", "content": "interrupt"},
               {"role": "assistant", "tool_calls": [{"id": "call_c", "type": "function",
                                                     "function": {"name": "submit_plan", "arguments": "{}"}}]},
               {"role": "tool", "tool_call_id": "call_c", "content": "done"}]
        st, r, _ = openai(m.base_url, _o_body(mid, tools=O_TOOLS))
        assert st == 400 and "call_a" in r["error"]["message"], (st, r)
        assert r["error"]["param"] == "messages.[1].role", r
        orphan = [{"role": "user", "content": "go"}, {"role": "tool", "tool_call_id": "call_z", "content": "x"}]
        st, r, _ = openai(m.base_url, _o_body(orphan))
        assert st == 400 and "preceeding" in r["error"]["message"], r
        obj_args = [{"role": "user", "content": "go"},
                    {"role": "assistant", "tool_calls": [{"id": "call_a", "type": "function",
                                                          "function": {"name": "f", "arguments": {"a": 1}}}]},
                    {"role": "tool", "tool_call_id": "call_a", "content": "x"}]
        st, r, _ = openai(m.base_url, _o_body(obj_args))
        assert st == 400 and "expected a string" in r["error"]["message"], r
        assert m.requests[0]["step"] is None and len(m.requests) == 4 and not m.unmatched
        return "unanswered call id, orphan tool msg, object arguments all 400"


def mock_llm_gemini_function_response_order_400():
    with MockLLM() as m:
        no_call = [{"role": "user", "parts": [{"text": "go"}]},
                   {"role": "model", "parts": [{"text": "sure"}]},
                   {"role": "user", "parts": [{"functionResponse": {"name": "submit_plan", "response": {"a": 1}}}]}]
        st, r, _ = gemini(m.base_url, "gemini-2.5-flash", _g_body(no_call))
        assert st == 400 and r["error"]["status"] == "INVALID_ARGUMENT", r
        assert "function response turn comes immediately after a function call turn" in r["error"]["message"], r
        unanswered = [{"role": "user", "parts": [{"text": "go"}]},
                      {"role": "model", "parts": [{"functionCall": {"name": "submit_plan", "args": {}}}]},
                      {"role": "user", "parts": [{"text": "forgot the response"}]}]
        st, r, _ = gemini(m.base_url, "gemini-2.5-flash", _g_body(unanswered))
        assert st == 400, r
        count = [{"role": "user", "parts": [{"text": "go"}]},
                 {"role": "model", "parts": [{"functionCall": {"name": "a", "args": {}}},
                                             {"functionCall": {"name": "b", "args": {}}}]},
                 {"role": "user", "parts": [{"functionResponse": {"name": "a", "response": {}}}]}]
        st, r, _ = gemini(m.base_url, "gemini-2.5-flash", _g_body(count))
        assert st == 400 and "number of function response parts" in r["error"]["message"], r
        str_resp = [{"role": "user", "parts": [{"text": "go"}]},
                    {"role": "model", "parts": [{"functionCall": {"name": "a", "args": {}}}]},
                    {"role": "user", "parts": [{"functionResponse": {"name": "a", "response": "text"}}]}]
        st, r, _ = gemini(m.base_url, "gemini-2.5-flash", _g_body(str_resp))
        assert st == 400 and "protobuf.Struct" in r["error"]["message"], r
        return "response without call, call without response, count mismatch, string response all 400"


def mock_llm_auth_failure():
    with MockLLM() as m:
        st, r, _ = anthropic(m.base_url, _a_body(), key="wrong")
        assert st == 401 and r["error"]["type"] == "authentication_error", r
        st, r, _ = anthropic(m.base_url, _a_body(), key=None)
        assert st == 401 and "x-api-key" in r["error"]["message"], r
        st, r, _ = openai(m.base_url, _o_body(), key="sk-wrong-key-123456")
        assert st == 401 and r["error"]["code"] == "invalid_api_key", r
        assert "sk-wrong-key-123456" not in r["error"]["message"], "key must be masked in the error"
        st, r, _ = gemini(m.base_url, "gemini-2.5-flash", _g_body(), key="wrong")
        assert st == 400 and r["error"]["details"][0]["reason"] == "API_KEY_INVALID", r
        st, r, _ = gemini(m.base_url, "gemini-2.5-flash", _g_body(), key=None)
        assert st == 403 and r["error"]["status"] == "PERMISSION_DENIED", r
        st, r, _ = anthropic(m.base_url, _a_body(), version=None)
        assert st == 400 and "anthropic-version" in r["error"]["message"], r
        assert all(not q["auth_ok"] for q in m.requests[:5]) and m.requests[5]["auth_ok"]
    with MockLLM(api_key="custom") as m:
        st, _, _ = anthropic(m.base_url, _a_body(), key="custom")
        assert st == 200
    return "anthropic 401, openai 401, gemini 400 API_KEY_INVALID / 403 missing, custom key ok"


def mock_llm_caching_on_second_call():
    with MockLLM() as m:
        sys_blocks = [{"type": "text", "text": LONG_SYSTEM, "cache_control": {"type": "ephemeral"}}]
        _, r1, _ = anthropic(m.base_url, _a_body(system=sys_blocks))
        _, r2, _ = anthropic(m.base_url, _a_body(system=sys_blocks))
        u1, u2 = r1["usage"], r2["usage"]
        assert u1["cache_creation_input_tokens"] > 0 and u1["cache_read_input_tokens"] == 0, u1
        assert u2["cache_read_input_tokens"] == u1["cache_creation_input_tokens"] and u2["cache_creation_input_tokens"] == 0, u2
        assert u2["input_tokens"] < u1["input_tokens"] + u1["cache_creation_input_tokens"], (u1, u2)
        _, r3, _ = anthropic(m.base_url, _a_body(system="no cache control " + LONG_SYSTEM))
        _, r4, _ = anthropic(m.base_url, _a_body(system="no cache control " + LONG_SYSTEM))
        assert r4["usage"]["cache_read_input_tokens"] == 0, "no cache_control means no Anthropic caching"

        omsgs = [{"role": "system", "content": LONG_SYSTEM}, {"role": "user", "content": "x"}]
        _, o1, _ = openai(m.base_url, _o_body(omsgs))
        _, o2, _ = openai(m.base_url, _o_body(omsgs))
        c1 = o1["usage"]["prompt_tokens_details"]["cached_tokens"]
        c2 = o2["usage"]["prompt_tokens_details"]["cached_tokens"]
        assert c1 == 0 and c2 >= 1024 and c2 % 128 == 0, (c1, c2)
        short = [{"role": "system", "content": "short"}, {"role": "user", "content": "x"}]
        openai(m.base_url, _o_body(short))
        _, o4, _ = openai(m.base_url, _o_body(short))
        assert o4["usage"]["prompt_tokens_details"]["cached_tokens"] == 0, "under 1024 tokens is never cached"

        gb = _g_body(systemInstruction={"parts": [{"text": LONG_SYSTEM}]})
        _, g1, _ = gemini(m.base_url, "gemini-2.5-flash", gb)
        _, g2, _ = gemini(m.base_url, "gemini-2.5-flash", gb)
        assert "cachedContentTokenCount" not in g1["usageMetadata"], g1
        assert g2["usageMetadata"]["cachedContentTokenCount"] > 0, g2
        return (f"anthropic read={u2['cache_read_input_tokens']}, openai cached={c2}, "
                f"gemini cached={g2['usageMetadata']['cachedContentTokenCount']}")


def mock_llm_requests_recorded_with_keys_redacted():
    with MockLLM() as m:
        anthropic(m.base_url, _a_body())
        openai(m.base_url, _o_body())
        gemini(m.base_url, "gemini-2.5-flash", _g_body())
        gemini(m.base_url, "gemini-2.5-flash", _g_body(), via_query=True)
        st, snap, _ = _call(m.base_url + "/mock/requests")
        assert st == 200 and len(snap["requests"]) == 4, snap
        assert [q["provider"] for q in snap["requests"]] == ["anthropic", "openai", "gemini", "gemini"]
        assert snap["requests"][2]["model"] == "gemini-2.5-flash" and snap["requests"][0]["model"] == "claude-sonnet-4-5"
        dumped = json.dumps(snap) + json.dumps(m.requests)
        assert KEY not in dumped, "an API key leaked into the request log"
        assert snap["requests"][0]["headers"]["x-api-key"] == "<redacted>"
        assert snap["requests"][1]["headers"]["authorization"] == "<redacted>"
        assert snap["requests"][2]["headers"]["x-goog-api-key"] == "<redacted>"
        assert "key=%3Credacted%3E" in snap["requests"][3]["path"] or "key=<redacted>" in snap["requests"][3]["path"], \
            snap["requests"][3]["path"]
        assert snap["requests"][0]["body"]["messages"][0]["content"] == "plan it"
        assert len(snap["unmatched"]) == 4, "no script means every request is unmatched"
        _call(m.base_url + "/mock/reset")
        assert m.requests == [] and m.unmatched == []
        return "4 recorded, 0 key leaks, reset clears"


def mock_llm_match_filters_and_unmatched_fallback():
    script = [
        {"name": "after-fail", "match": {"last_tool_result_contains": "FAILED"}, "reply": {"text": "retrying"}},
        {"name": "planner", "match": {"system_contains": "planner", "provider": "openai"},
         "reply": {"json": {"plan": [1, 2]}}},
        {"name": "two-tools", "match": {"tool_available": "submit_plan"},
         "reply": {"tools": [{"name": "submit_plan", "args": {"title": "a"}},
                             {"name": "submit_plan", "args": {"title": "b"}}]}},
    ]
    with MockLLM(script=script) as m:
        st, r, _ = openai(m.base_url, _o_body([{"role": "system", "content": "You are a planner"},
                                               {"role": "user", "content": "x"}],
                                              response_format={"type": "json_schema", "json_schema": {
                                                  "name": "plan", "schema": {"type": "object"}, "strict": True}}))
        assert json.loads(r["choices"][0]["message"]["content"]) == {"plan": [1, 2]}, r
        _, r, _ = anthropic(m.base_url, _a_body(tools=A_TOOLS))
        assert [b["input"]["title"] for b in r["content"] if b["type"] == "tool_use"] == ["a", "b"], r
        ids = [b["id"] for b in r["content"] if b["type"] == "tool_use"]
        msgs = [{"role": "user", "content": "go"}, {"role": "assistant", "content": r["content"]},
                {"role": "user", "content": [{"type": "tool_result", "tool_use_id": ids[0], "content": "FAILED: x"},
                                             {"type": "tool_result", "tool_use_id": ids[1], "content": "ok"}]}]
        _, r, _ = anthropic(m.base_url, _a_body(msgs, tools=A_TOOLS))
        # last tool result is "ok", not FAILED, so the after-fail step does not match
        assert r["content"][0]["text"] == "ok" and len(m.unmatched) == 1, (r, m.unmatched)
        msgs[2]["content"].reverse()
        _, r, _ = anthropic(m.base_url, _a_body(msgs, tools=A_TOOLS))
        assert r["content"][0]["text"] == "retrying", r
        names = [q["step_name"] for q in m.requests]
        assert names == ["planner", "two-tools", None, "after-fail"], names
        return "json, parallel tools, last_tool_result_contains, system_contains, unmatched fallback ok"


def mock_llm_stop_refusal_and_thinking_shapes():
    script = [{"reply": {"stop": "max_tokens", "text": "partial"}, "repeat": 3},
              {"reply": {"refusal": "I can't help with that."}, "repeat": 3},
              {"match": {"provider": "anthropic"}, "reply": {"text": "done", "thinking": "hmm"},
               "usage": {"input": 100, "output": 10, "thinking": 40}},
              {"match": {"provider": "gemini"}, "reply": {"text": "done"}, "usage": {"thinking": 30}}]
    with MockLLM(script=script) as m:
        _, a, _ = anthropic(m.base_url, _a_body())
        _, o, _ = openai(m.base_url, _o_body())
        _, g, _ = gemini(m.base_url, "gemini-2.5-flash", _g_body())
        assert a["stop_reason"] == "max_tokens" and a["content"][0]["text"] == "partial", a
        assert o["choices"][0]["finish_reason"] == "length", o
        assert g["candidates"][0]["finishReason"] == "MAX_TOKENS", g
        _, a, _ = anthropic(m.base_url, _a_body())
        _, o, _ = openai(m.base_url, _o_body())
        _, g, _ = gemini(m.base_url, "gemini-2.5-flash", _g_body())
        assert a["stop_reason"] == "refusal", a
        assert o["choices"][0]["message"]["refusal"] == "I can't help with that." and o["choices"][0]["message"]["content"] is None
        assert g["candidates"][0]["finishReason"] == "SAFETY" and "content" not in g["candidates"][0], g
        _, a, _ = anthropic(m.base_url, _a_body(max_tokens=4096, thinking={"type": "enabled", "budget_tokens": 2048}))
        assert a["content"][0]["type"] == "thinking" and a["content"][0]["signature"], a
        assert a["usage"]["output_tokens"] == 50 and a["usage"]["input_tokens"] == 100, a["usage"]
        _, g, _ = gemini(m.base_url, "gemini-2.5-flash", _g_body(
            generationConfig={"thinkingConfig": {"thinkingBudget": 1024, "includeThoughts": True}}))
        parts = g["candidates"][0]["content"]["parts"]
        assert parts[0].get("thought") is True and parts[1]["text"] == "done", parts
        assert g["usageMetadata"]["thoughtsTokenCount"] == 30, g["usageMetadata"]
        st, r, _ = anthropic(m.base_url, _a_body(max_tokens=4096, thinking={"type": "enabled", "budget_tokens": 2048},
                                                 tool_choice={"type": "any"}, tools=A_TOOLS))
        assert st == 400 and "tool_choice" in r["error"]["message"], r
        return "max_tokens, refusal, thinking blocks and token counts ok"


def mock_llm_models_listing():
    with MockLLM() as m:
        st, r, _ = _call(m.base_url + "/v1/models", headers={"Authorization": f"Bearer {KEY}"})
        assert st == 200 and r["object"] == "list" and r["data"][0]["object"] == "model", r
        st, r, _ = _call(m.base_url + "/v1/models", headers={"x-api-key": KEY, "anthropic-version": "2023-06-01"})
        assert st == 200 and r["data"][0]["type"] == "model" and "has_more" in r, r
        st, r, _ = _call(m.base_url + "/v1beta/models", headers={"x-goog-api-key": KEY})
        assert st == 200 and r["models"][0]["name"].startswith("models/"), r
        return "openai, anthropic and gemini model lists ok"


def mock_llm_script_via_env_and_post():
    fd, path = tempfile.mkstemp(suffix=".json")
    with os.fdopen(fd, "w") as fh:
        json.dump({"steps": [{"reply": {"text": "from env"}}]}, fh)
    old = os.environ.get("LOOM_MOCK_SCRIPT")
    os.environ["LOOM_MOCK_SCRIPT"] = path
    try:
        with MockLLM() as m:
            _, r, _ = anthropic(m.base_url, _a_body())
            assert r["content"][0]["text"] == "from env", r
            st, r, _ = _call(m.base_url + "/mock/script", [{"reply": {"text": "from post"}}])
            assert st == 200 and r["steps"] == 1, r
            _, r, _ = openai(m.base_url, _o_body())
            assert r["choices"][0]["message"]["content"] == "from post", r
            st, r, _ = _call(m.base_url + "/mock/script", [{"reply": {"txt": "typo"}}])
            assert st == 400 and "unknown keys" in r["error"]["message"], r
            _call(m.base_url + "/mock/reset")  # restores the env script, unconsumed
            _, r, _ = anthropic(m.base_url, _a_body())
            assert r["content"][0]["text"] == "from env", r
    finally:
        if old is None:
            os.environ.pop("LOOM_MOCK_SCRIPT", None)
        else:
            os.environ["LOOM_MOCK_SCRIPT"] = old
        os.unlink(path)
    try:
        MockLLM(script=[{"reply": {"tool": "x", "json": {}}}])
    except ValueError:
        return "env script, POST script, typo rejected, reset restores, bad script raises"
    raise AssertionError("a script mixing tool and json must be rejected")


def mock_llm_client_disconnect_is_quiet():
    with MockLLM(script=[{"reply": {"text": "late", "delay_s": 0.4}}, {"reply": {"text": "alive"}}]) as m:
        host, port = m.base_url.rsplit(":", 1)
        body = json.dumps(_a_body()).encode()
        req = (f"POST /v1/messages HTTP/1.1\r\nHost: x\r\nx-api-key: {KEY}\r\nanthropic-version: 2023-06-01\r\n"
               f"Content-Type: application/json\r\nContent-Length: {len(body)}\r\n\r\n").encode() + body
        captured = io.StringIO()
        old_err = sys.stderr
        sys.stderr = captured
        try:
            s = socket.create_connection((host.replace("http://", ""), int(port)))
            s.sendall(req)
            # hang up only once the server has READ the request (it is waiting out the delay): on Windows a reset
            # discards bytes the server has not read yet, so closing straight after sendall never reached the server
            # at all (measured 0 of 5; with this wait 5 of 5 recorded, delivered False; B6, 2026-10-08)
            read_by = time.time() + 5
            while m._state.seq == 0 and time.time() < read_by:
                time.sleep(0.01)
            import struct
            linger = struct.pack("HH", 1, 0) if os.name == "nt" else struct.pack("ii", 1, 0)
            s.setsockopt(socket.SOL_SOCKET, socket.SO_LINGER, linger)  # close with RST
            s.close()  # hang up before the delayed reply
            # the request is recorded before its reply goes out (delivered None until the send ends), so wait for
            # the send's outcome, not only for the record
            deadline = time.time() + 5
            while not (m.requests and m.requests[0]["delivered"] is not None) and time.time() < deadline:
                time.sleep(0.05)
        finally:
            sys.stderr = old_err
        assert m.requests, "the abandoned request was never recorded"
        assert m.requests[0]["delivered"] is False, f"the reply reached a client that had hung up: {m.requests[0]}"
        assert "Traceback" not in captured.getvalue(), captured.getvalue()
        st, r, _ = anthropic(m.base_url, _a_body())
        assert st == 200 and r["content"][0]["text"] == "alive", r
        return f"disconnect swallowed (delivered={m.requests[0]['delivered']}), server still serving"


def mock_llm_request_recorded_before_its_reply():
    # 2026-10-08: under the --browser suite's load a client read MockLLM.requests right after its reply and missed its
    # own request, which the server recorded only after the send. Here every reply is written and then the handler is
    # held 0.4 s, the window a loaded machine gave the client: the request must already be in requests (delivered None
    # while the send is in flight), through MockLLM.requests and /mock/requests, for a JSON and an event-stream reply.
    script = [{"name": n, "reply": {"text": n}} for n in ("json", "http", "sse")]
    with MockLLM(script=script, anthropic_stream=True) as m:
        cls = m._server.RequestHandlerClass  # this server's own handler subclass, so no other mock is touched

        def held(send):
            def wrapper(self, *a, **kw):
                ok = send(self, *a, **kw)
                time.sleep(0.4)
                return ok
            return wrapper
        cls._send, cls._send_sse = held(cls._send), held(cls._send_sse)
        st, _, _ = anthropic(m.base_url, _a_body())
        seen = m.requests
        assert st == 200 and [q["step_name"] for q in seen] == ["json"], seen
        assert seen[0]["delivered"] in (None, True), seen[0]
        st, _, _ = openai(m.base_url, _o_body())
        st2, snap, _ = _call(m.base_url + "/mock/requests")
        assert st == 200 and st2 == 200, (st, st2)
        assert [q["step_name"] for q in snap["requests"]] == ["json", "http"], snap["requests"]
        req = urllib.request.Request(m.base_url + "/v1/messages", data=json.dumps(_a_body(stream=True)).encode(),
                                     method="POST", headers={"x-api-key": KEY, "anthropic-version": "2023-06-01",
                                                             "content-type": "application/json"})
        with urllib.request.urlopen(req, timeout=10) as r:
            text = r.read().decode()
        seen = m.requests
        assert "message_stop" in text and [q["step_name"] for q in seen] == ["json", "http", "sse"], (text[:200], seen)
        assert seen[2].get("stream") is True, seen[2]
        deadline = time.time() + 5
        while any(q["delivered"] is None for q in m.requests) and time.time() < deadline:
            time.sleep(0.05)
        assert [q["delivered"] for q in m.requests] == [True, True, True], m.requests
        return "each request visible before its reply (json, /mock/requests, sse); delivered true once sent"


def mock_llm_concurrent_requests_thread_safe():
    import threading
    n = 24
    with MockLLM(script=[{"reply": {"text": "x", "delay_s": 0.05}, "repeat": n}]) as m:
        results = []

        def go():
            results.append(anthropic(m.base_url, _a_body())[0])
        ts = [threading.Thread(target=go) for _ in range(n)]
        [t.start() for t in ts]
        [t.join() for t in ts]
        assert results.count(200) == n, results
        assert len(m.requests) == n and sorted(q["seq"] for q in m.requests) == list(range(1, n + 1))
        assert m.remaining[0]["remaining"] == 0 and not m.unmatched
        return f"{n} parallel requests, each step consumed exactly once"
