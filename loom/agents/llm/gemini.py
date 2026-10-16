"""Gemini generateContent adapter (D-115). Gemini 3 models attach a thought signature to function calls; the model's
own parts are replayed unchanged on the next turn so the signature travels back (UNVERIFIED against the live API)."""
from __future__ import annotations

import json

from .base import Provider
from .types import Message, Request, Response, ToolCall, Usage

STOP = {"STOP": "end", "MAX_TOKENS": "max_tokens", "SAFETY": "filtered", "RECITATION": "filtered", "PROHIBITED_CONTENT": "filtered",
        "BLOCKLIST": "filtered", "SPII": "filtered", "MALFORMED_FUNCTION_CALL": "other"}


def to_contents(msgs: list[Message]) -> list[dict]:
    out: list[dict] = []
    for m in msgs:
        if m.role == "tool":
            part = {"functionResponse": {"name": m.name or "tool", "response": {"error" if m.is_error else "result": m.content}}}
            if out and out[-1]["role"] == "user" and all("functionResponse" in p for p in out[-1]["parts"]):
                out[-1]["parts"].append(part)
            else:
                out.append({"role": "user", "parts": [part]})
        elif m.role == "assistant":
            parts = m.extra.get("gemini_parts")
            if not parts:
                parts = ([{"text": m.content}] if m.content else []) + [
                    dict({"functionCall": {"name": c.name, "args": c.args}}, **({"thoughtSignature": c.extra["thoughtSignature"]} if c.extra.get("thoughtSignature") else {}))
                    for c in m.tool_calls]
            out.append({"role": "model", "parts": parts or [{"text": "(no text)"}]})
        else:
            parts = [{"inlineData": {"mimeType": mime, "data": b64}} for mime, b64 in m.images]
            parts.append({"text": m.content or "(empty)"})
            if out and out[-1]["role"] == "user" and not any("functionResponse" in p for p in out[-1]["parts"]):
                out[-1]["parts"].extend(parts)
            else:
                out.append({"role": "user", "parts": parts})
    return out


class Gemini(Provider):
    name = "gemini"

    def build(self, req: Request):
        body = {"contents": to_contents(req.messages)}
        sys_text = "\n\n".join(s for s in req.system if s)
        if sys_text:
            body["systemInstruction"] = {"parts": [{"text": sys_text}]}
        gen = {"maxOutputTokens": req.max_tokens}
        if req.temperature is not None and not req.effort:
            gen["temperature"] = req.temperature
        if req.effort:
            gen["thinkingConfig"] = {"thinkingLevel": req.effort}
        if req.tools:
            body["tools"] = [{"functionDeclarations": [{"name": t.name, "description": t.description, "parametersJsonSchema": t.parameters} for t in req.tools]}]
            mode = {"auto": "AUTO", "any": "ANY", "none": "NONE"}.get(req.tool_choice)
            body["toolConfig"] = {"functionCallingConfig": {"mode": mode} if mode else {"mode": "ANY", "allowedFunctionNames": [req.tool_choice]}}
        elif req.response_schema:
            gen["responseMimeType"] = "application/json"
            gen["responseJsonSchema"] = req.response_schema
        body["generationConfig"] = gen
        return f"{self.base}/models/{req.model}:generateContent", {"x-goog-api-key": self.key}, body

    def parse(self, req: Request, b: dict, latency: float) -> Response:
        cand = (b.get("candidates") or [{}])[0]
        parts = (cand.get("content") or {}).get("parts") or []
        text, calls = [], []
        for i, p in enumerate(parts):
            if "functionCall" in p:
                fc = p["functionCall"]
                args = fc.get("args") or {}
                calls.append(ToolCall(f"gc_{i}_{fc.get('name', '')}", fc.get("name", ""), args if isinstance(args, dict) else {"__invalid_json__": json.dumps(args)},
                                      extra={"thoughtSignature": p.get("thoughtSignature")} if p.get("thoughtSignature") else {}))
            elif "text" in p and not p.get("thought"):
                text.append(p["text"])
        u = b.get("usageMetadata") or {}
        thoughts = int(u.get("thoughtsTokenCount") or 0)
        usage = Usage(input=int(u.get("promptTokenCount") or 0), cached=int(u.get("cachedContentTokenCount") or 0),
                      output=int(u.get("candidatesTokenCount") or 0) + thoughts, thinking=thoughts)
        stop = "tool" if calls else STOP.get(cand.get("finishReason"), "other" if cand.get("finishReason") else "end")
        if (b.get("promptFeedback") or {}).get("blockReason"):
            stop = "filtered"
        return Response(text="".join(text), tool_calls=calls, stop=stop, usage=usage, model=b.get("modelVersion", req.model),
                        provider=self.name, latency_s=latency, extra={"gemini_parts": parts})

    def list_models(self) -> list[str]:
        st, body, _ = self._http("GET", f"{self.base}/models?pageSize=1000", {"x-goog-api-key": self.key}, None, 60)
        if st != 200:
            raise self.error_from(st, body, {})
        return sorted(m["name"].split("/", 1)[-1] for m in body.get("models", []))
