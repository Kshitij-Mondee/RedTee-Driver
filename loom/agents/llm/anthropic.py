"""Anthropic Messages API adapter (D-115)."""
from __future__ import annotations

import json

from .base import Provider
from .types import BadRequest, Message, Request, Response, ToolCall, Usage

STOP = {"end_turn": "end", "stop_sequence": "end", "tool_use": "tool", "max_tokens": "max_tokens", "refusal": "refusal"}
RESPOND_TOOL = "respond"


def _content_user(m: Message) -> list:
    blocks = [{"type": "image", "source": {"type": "base64", "media_type": mime, "data": b64}} for mime, b64 in m.images]
    if m.content:
        blocks.append({"type": "text", "text": m.content})
    return blocks or [{"type": "text", "text": "(empty)"}]


def _content_assistant(m: Message) -> list:
    if m.extra.get("anthropic_content"):          # replay exactly what the model returned (thinking blocks included)
        return m.extra["anthropic_content"]
    blocks = [{"type": "text", "text": m.content}] if m.content else []
    blocks += [{"type": "tool_use", "id": c.id, "name": c.name, "input": c.args} for c in m.tool_calls]
    return blocks or [{"type": "text", "text": "(no text)"}]


def to_messages(msgs: list[Message]) -> list[dict]:
    out: list[dict] = []
    for m in msgs:
        if m.role == "tool":
            block = {"type": "tool_result", "tool_use_id": m.tool_call_id, "content": m.content or "(empty)"}
            if m.is_error:
                block["is_error"] = True
            if out and out[-1]["role"] == "user" and all(b.get("type") == "tool_result" for b in out[-1]["content"]):
                out[-1]["content"].append(block)
            else:
                out.append({"role": "user", "content": [block]})
        elif m.role == "assistant":
            out.append({"role": "assistant", "content": _content_assistant(m)})
        else:
            c = _content_user(m)
            if out and out[-1]["role"] == "user":   # a user note after tool results joins the same turn
                out[-1]["content"].extend(c)
            else:
                out.append({"role": "user", "content": c})
    return out


class Anthropic(Provider):
    name = "anthropic"

    no_ttl = False      # set once the API refuses the 1-hour lifetime: the run carries on with the 5-minute one

    def build(self, req: Request):
        cc = {"type": "ephemeral"}
        if req.cache_ttl == "1h" and not Anthropic.no_ttl:
            cc = {"type": "ephemeral", "ttl": "1h"}     # every breakpoint the same: a longer lifetime may not follow a shorter
        system = [{"type": "text", "text": s} for s in req.system if s]
        if req.cache and system:
            system[-1]["cache_control"] = dict(cc)
            if len(system) > 1:
                # a second breakpoint after the shared reading: another role with the same reading (and the same
                # tools) reads it from the cache even though its own card differs (4 breakpoints at most: tools,
                # this, the end of system, the newest turn)
                system[0]["cache_control"] = dict(cc)
        tools = [{"name": t.name, "description": t.description, "input_schema": t.parameters} for t in req.tools]
        choice = req.tool_choice
        if req.response_schema and not tools:
            # structured answer through a forced tool: works on every Claude model
            tools = [{"name": RESPOND_TOOL, "description": "Give your answer.", "input_schema": req.response_schema}]
            choice = RESPOND_TOOL
        if req.cache and tools:
            tools[-1]["cache_control"] = dict(cc)
        msgs = to_messages(req.messages)
        if req.cache and msgs and msgs[-1]["role"] == "user" and msgs[-1]["content"]:
            # a moving breakpoint on the newest turn: every later turn (and a resumed fix session) reads the whole
            # conversation so far from the cache instead of paying for it again
            last = msgs[-1]["content"][-1]
            if last.get("type") in ("text", "tool_result", "image"):
                msgs[-1]["content"][-1] = dict(last, cache_control=dict(cc))
        body = {"model": req.model, "max_tokens": req.max_tokens, "messages": msgs}
        if system:
            body["system"] = system
        if tools:
            body["tools"] = tools
            if req.effort and (req.caps or {}).get("thinking", "adaptive") != "none" and choice not in ("auto", "none"):
                choice = "auto"     # forced tool use is not allowed together with thinking
            body["tool_choice"] = {"auto": {"type": "auto"}, "any": {"type": "any"}, "none": {"type": "none"}}.get(choice, {"type": "tool", "name": choice})
        # thinking by the model's capability (models.json `thinking`): adaptive (the default), budget (an explicit
        # token budget: Haiku 4.5 refuses adaptive, bench 2026-10-06), or none
        mode = (req.caps or {}).get("thinking", "adaptive")
        if req.effort and mode == "adaptive":
            body["thinking"] = {"type": "adaptive"}
            body["output_config"] = {"effort": req.effort}
        elif req.effort and mode == "budget":
            bt = {"low": 2048, "medium": 6000, "high": 12000}.get(req.effort, 4000)
            bt = max(1024, min(bt, int(body.get("max_tokens", 8000)) - 1024))
            body["thinking"] = {"type": "enabled", "budget_tokens": bt}
        elif req.temperature is not None:
            body["temperature"] = req.temperature
        headers = {"x-api-key": self.key, "anthropic-version": "2023-06-01"}
        return f"{self.base}/messages", headers, body

    def parse(self, req: Request, b: dict, latency: float) -> Response:
        text, calls = [], []
        for blk in b.get("content") or []:
            if blk.get("type") == "text":
                text.append(blk.get("text", ""))
            elif blk.get("type") == "tool_use":
                calls.append(ToolCall(blk["id"], blk["name"], blk.get("input") or {}))
        u = b.get("usage") or {}
        cached, write = int(u.get("cache_read_input_tokens") or 0), int(u.get("cache_creation_input_tokens") or 0)
        usage = Usage(input=int(u.get("input_tokens") or 0) + cached + write, cached=cached, cache_write=write,
                      output=int(u.get("output_tokens") or 0),
                      thinking=int(((u.get("output_tokens_details") or {}).get("thinking_tokens")) or 0),
                      cache_write_1h=int((u.get("cache_creation") or {}).get("ephemeral_1h_input_tokens") or 0))
        stop = STOP.get(b.get("stop_reason"), "other")
        if req.response_schema and not req.tools and calls and calls[0].name == RESPOND_TOOL:
            text, calls, stop = [json.dumps(calls[0].args)], [], "end"
        return Response(text="".join(text), tool_calls=calls, stop=stop, usage=usage, model=b.get("model", req.model),
                        provider=self.name, latency_s=latency, raw_id=b.get("id", ""), extra={"anthropic_content": b.get("content") or []})

    def complete(self, req: Request) -> Response:
        try:
            return super().complete(req)
        except BadRequest as e:
            if req.cache_ttl == "1h" and not Anthropic.no_ttl and "ttl" in str(e).lower():
                Anthropic.no_ttl = True     # UNVERIFIED on the live API: fall back to the 5-minute cache, once, and say so
                from ...util import warn
                warn("anthropic: the 1-hour cache lifetime was refused; using the 5-minute one for this run")
                return super().complete(req)
            raise

    def list_models(self) -> list[str]:
        st, body, _ = self._http("GET", f"{self.base}/models?limit=1000", {"x-api-key": self.key, "anthropic-version": "2023-06-01"}, None, 60)
        if st != 200:
            raise self.error_from(st, body, {})
        return sorted(m["id"] for m in body.get("data", []))
