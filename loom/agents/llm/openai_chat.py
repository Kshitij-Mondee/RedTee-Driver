"""OpenAI Chat Completions adapter (D-115). Also serves any OpenAI-compatible server (vLLM, OpenRouter, local models)
through LOOM_OPENAI_BASE or a model entry's `base`."""
from __future__ import annotations

import json

from .base import Provider
from .types import Message, Request, Response, ToolCall, Usage

STOP = {"stop": "end", "tool_calls": "tool", "function_call": "tool", "length": "max_tokens", "content_filter": "filtered"}


def to_messages(system: list[str], msgs: list[Message]) -> list[dict]:
    out: list[dict] = []
    if system:
        out.append({"role": "system", "content": "\n\n".join(s for s in system if s)})
    for m in msgs:
        if m.role == "tool":
            out.append({"role": "tool", "tool_call_id": m.tool_call_id, "content": m.content or "(empty)"})
        elif m.role == "assistant":
            d = {"role": "assistant", "content": m.content or None}
            if m.tool_calls:
                d["tool_calls"] = [{"id": c.id, "type": "function", "function": {"name": c.name, "arguments": json.dumps(c.args)}} for c in m.tool_calls]
            out.append(d)
        else:
            if m.images:
                parts = [{"type": "text", "text": m.content or ""}] + [{"type": "image_url", "image_url": {"url": f"data:{mime};base64,{b64}"}} for mime, b64 in m.images]
                out.append({"role": "user", "content": parts})
            else:
                out.append({"role": "user", "content": m.content or "(empty)"})
    return out


class OpenAIChat(Provider):
    name = "openai"

    def build(self, req: Request):
        body = {"model": req.model, "messages": to_messages(req.system, req.messages), "max_completion_tokens": req.max_tokens}
        if req.tools:
            body["tools"] = [{"type": "function", "function": {"name": t.name, "description": t.description, "parameters": t.parameters}} for t in req.tools]
            body["tool_choice"] = {"auto": "auto", "any": "required", "none": "none"}.get(req.tool_choice, {"type": "function", "function": {"name": req.tool_choice}})
        elif req.response_schema:
            body["response_format"] = {"type": "json_schema", "json_schema": {"name": "answer", "schema": req.response_schema}}
        if req.effort:
            body["reasoning_effort"] = req.effort
        elif req.temperature is not None:
            body["temperature"] = req.temperature
        return f"{self.base}/chat/completions", {"Authorization": f"Bearer {self.key}"}, body

    def parse(self, req: Request, b: dict, latency: float) -> Response:
        ch = (b.get("choices") or [{}])[0]
        msg = ch.get("message") or {}
        calls = []
        for c in msg.get("tool_calls") or []:
            fn = c.get("function") or {}
            try:
                args = json.loads(fn.get("arguments") or "{}")
                if not isinstance(args, dict):
                    args = {"__invalid_json__": fn.get("arguments")}
            except json.JSONDecodeError:
                args = {"__invalid_json__": fn.get("arguments")}
            calls.append(ToolCall(c.get("id") or f"call_{len(calls)}", fn.get("name", ""), args))
        u = b.get("usage") or {}
        usage = Usage(input=int(u.get("prompt_tokens") or 0), cached=int((u.get("prompt_tokens_details") or {}).get("cached_tokens") or 0),
                      output=int(u.get("completion_tokens") or 0), thinking=int((u.get("completion_tokens_details") or {}).get("reasoning_tokens") or 0))
        stop = "refusal" if msg.get("refusal") else STOP.get(ch.get("finish_reason"), "other")
        return Response(text=msg.get("content") or (msg.get("refusal") or ""), tool_calls=calls, stop=stop, usage=usage,
                        model=b.get("model", req.model), provider=self.name, latency_s=latency, raw_id=b.get("id", ""))

    def list_models(self) -> list[str]:
        st, body, _ = self._http("GET", f"{self.base}/models", {"Authorization": f"Bearer {self.key}"}, None, 60)
        if st != 200:
            raise self.error_from(st, body, {})
        return sorted(m["id"] for m in body.get("data", []))


class QwenChat(OpenAIChat):
    """Qwen on Alibaba Model Studio's OpenAI-compatible endpoint (D-168): the same wire format, its own key
    (DASHSCOPE_API_KEY), base (LOOM_QWEN_BASE, default the international endpoint) and provider name in the ledger."""
    name = "qwen"
