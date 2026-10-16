"""OpenAI Responses API adapter (/v1/responses), for reasoning models that refuse function tools with reasoning on
Chat Completions (gpt-6.x: "Function tools with reasoning_effort are not supported ... use /v1/responses", and
reasoning_effort "none" is refused too; bench 2026-10-06, L-230).

Stateless: `store` is false and the model's reasoning comes back encrypted (`include: reasoning.encrypted_content`);
an assistant turn is replayed as the exact output items the model returned (reasoning, function calls, messages), so
the reasoning carries across tool calls without the server keeping the conversation.
"""
from __future__ import annotations

import json
import os
import socket
import urllib.error
import urllib.request

from .base import Provider, redact
from .types import Unreachable
from .types import Message, Request, Response, ToolCall, Usage


def to_input(msgs: list[Message]) -> list[dict]:
    out: list[dict] = []
    for m in msgs:
        if m.role == "tool":
            out.append({"type": "function_call_output", "call_id": m.tool_call_id, "output": m.content or "(empty)"})
        elif m.role == "assistant":
            if m.extra.get("openai_output"):          # replay exactly what the model returned (reasoning included)
                out.extend(m.extra["openai_output"])
                continue
            if m.content:
                out.append({"role": "assistant", "content": [{"type": "output_text", "text": m.content}]})
            for c in m.tool_calls:
                out.append({"type": "function_call", "call_id": c.id, "name": c.name, "arguments": json.dumps(c.args)})
        else:
            parts = [{"type": "input_text", "text": m.content or "(empty)"}]
            parts += [{"type": "input_image", "image_url": f"data:{mime};base64,{b64}"} for mime, b64 in m.images]
            out.append({"role": "user", "content": parts})
    return out


class OpenAIResponses(Provider):
    name = "openai"

    def build(self, req: Request):
        body = {"model": req.model, "input": to_input(req.messages), "max_output_tokens": req.max_tokens, "store": False}
        instr = "\n\n".join(s for s in req.system if s)
        if instr:
            body["instructions"] = instr
        if req.tools:
            body["tools"] = [{"type": "function", "name": t.name, "description": t.description, "parameters": t.parameters, "strict": False}
                             for t in req.tools]
            body["tool_choice"] = {"auto": "auto", "any": "required", "none": "none"}.get(req.tool_choice, {"type": "function", "name": req.tool_choice})
        elif req.response_schema:
            body["text"] = {"format": {"type": "json_schema", "name": "answer", "schema": req.response_schema, "strict": False}}
        if req.effort:
            body["reasoning"] = {"effort": req.effort}
            body["include"] = ["reasoning.encrypted_content"]
        elif req.temperature is not None:
            body["temperature"] = req.temperature
        if not os.environ.get("LOOM_OPENAI_NO_STREAM"):
            # streamed: the connection carries events the whole time, so a long reasoning call is not cut as idle
            # (a 700 s non-streamed call ended in SSL EOF in the real bench, 2026-10-06)
            body["stream"] = True
        return f"{self.base}/responses", {"Authorization": f"Bearer {self.key}"}, body

    def _http(self, method, url, headers, payload, timeout):
        if not (payload and payload.get("stream")):
            return super()._http(method, url, headers, payload, timeout)
        data = json.dumps(payload).encode()
        rq = urllib.request.Request(url, data=data, method=method, headers=dict(headers, **{"content-type": "application/json", "accept": "text/event-stream"}))
        try:
            with urllib.request.urlopen(rq, timeout=min(timeout, 300)) as r:     # the timeout is per read: an idle limit
                st, body = read_sse(r)
                return st, body, dict(r.headers)
        except urllib.error.HTTPError as e:
            raw = e.read().decode("utf-8", "replace")
            try:
                body = json.loads(raw)
            except json.JSONDecodeError:
                body = raw
            return e.code, body, dict(e.headers or {})
        except (urllib.error.URLError, socket.timeout, ConnectionError, TimeoutError) as e:
            raise Unreachable(f"{self.name}: {redact(str(e))[:300]}", provider=self.name)

    def parse(self, req: Request, b: dict, latency: float) -> Response:
        items = b.get("output") or []
        text, calls, refusal = [], [], ""
        for it in items:
            t = it.get("type")
            if t == "function_call":
                try:
                    args = json.loads(it.get("arguments") or "{}")
                    if not isinstance(args, dict):
                        args = {"__invalid_json__": it.get("arguments")}
                except json.JSONDecodeError:
                    args = {"__invalid_json__": it.get("arguments")}
                calls.append(ToolCall(it.get("call_id") or it.get("id") or f"call_{len(calls)}", it.get("name", ""), args))
            elif t == "message":
                for c in it.get("content") or []:
                    if c.get("type") == "output_text":
                        text.append(c.get("text") or "")
                    elif c.get("type") == "refusal":
                        refusal = c.get("refusal") or "refused"
        u = b.get("usage") or {}
        usage = Usage(input=int(u.get("input_tokens") or 0), cached=int((u.get("input_tokens_details") or {}).get("cached_tokens") or 0),
                      output=int(u.get("output_tokens") or 0), thinking=int((u.get("output_tokens_details") or {}).get("reasoning_tokens") or 0))
        status = b.get("status")
        reason = (b.get("incomplete_details") or {}).get("reason")
        if refusal:
            stop = "refusal"
        elif calls:
            stop = "tool"
        elif status == "incomplete" and reason == "max_output_tokens":
            stop = "max_tokens"
        elif status == "incomplete" and reason == "content_filter":
            stop = "filtered"
        elif status == "completed":
            stop = "end"
        else:
            stop = "other"
        # replay items: everything the model produced, minus server-only fields a stateless request may not send back
        replay = []
        for it in items:
            drop = ("status",) if it.get("type") == "reasoning" else ("status", "id")   # call_id carries the pairing
            it = {k: v for k, v in it.items() if k not in drop}
            if it.get("type") == "reasoning" and not it.get("encrypted_content"):
                continue            # without its encrypted content a reasoning item cannot be replayed statelessly
            replay.append(it)
        return Response(text="".join(text) or refusal, tool_calls=calls, stop=stop, usage=usage, model=b.get("model", req.model),
                        provider=self.name, latency_s=latency, raw_id=b.get("id", ""), extra={"openai_output": replay})

    def list_models(self) -> list[str]:
        st, body, _ = self._http("GET", f"{self.base}/models", {"Authorization": f"Bearer {self.key}"}, None, 60)
        if st != 200:
            raise self.error_from(st, body, {})
        return sorted(m["id"] for m in body.get("data", []))


def read_sse(lines) -> tuple[int, dict]:
    """Read a Responses API event stream to its end: the final `response` object of response.completed or
    response.incomplete, or the error. Lines may be bytes or str."""
    final, err, buf = None, None, []
    def handle(data):
        nonlocal final, err
        if not data or data == "[DONE]":
            return
        try:
            ev = json.loads(data)
        except json.JSONDecodeError:
            return
        t = ev.get("type", "")
        if t in ("response.completed", "response.incomplete"):
            final = ev.get("response") or {}
        elif t == "response.failed":
            r = ev.get("response") or {}
            err = (500, {"error": r.get("error") or {"message": "response.failed"}})
        elif t == "error":
            err = (400, {"error": {"message": ev.get("message") or ev.get("error") or "stream error", "code": ev.get("code")}})
    for raw in lines:
        line = raw.decode("utf-8", "replace") if isinstance(raw, bytes) else raw
        line = line.rstrip("\r\n")
        if not line:
            if buf:
                handle("\n".join(buf)); buf = []
            continue
        if line.startswith("data:"):
            buf.append(line[5:].lstrip())
    if buf:
        handle("\n".join(buf))
    if final is not None:
        return 200, final
    if err:
        return err
    return 502, {"error": {"message": "the stream ended without a final response event"}}

