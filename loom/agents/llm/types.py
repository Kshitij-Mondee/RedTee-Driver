"""Provider-neutral request and response types (D-115). Every adapter maps these to and from its wire protocol, so
the agent runtime never sees a vendor format."""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


class LLMError(Exception):
    """Base of provider errors. `retryable` says whether the runtime may try again."""
    retryable = False

    def __init__(self, msg: str, status: int | None = None, provider: str = "", retry_after: float | None = None):
        super().__init__(msg)
        self.status, self.provider, self.retry_after = status, provider, retry_after


class RateLimited(LLMError):
    retryable = True


class Overloaded(LLMError):
    retryable = True


class AuthError(LLMError):
    pass


class BillingError(LLMError):
    """The account is out of credit or over its paid quota: no retry helps and every later call to this provider
    fails the same way, so the run stops cleanly and says so (bench 2026-10-07: Anthropic credit ran out mid-run)."""


class BadRequest(LLMError):
    pass


class ContextOverflow(BadRequest):
    """The prompt does not fit the model's context: never retried unchanged (L-209)."""


class Unreachable(LLMError):
    retryable = True


class BudgetExceeded(Exception):
    """A call was NOT sent because its worst case could cross a budget cap."""


@dataclass
class ToolCall:
    id: str
    name: str
    args: dict
    extra: dict = field(default_factory=dict)    # provider data that must travel back unchanged (Gemini thought signatures)


@dataclass
class Message:
    """role: user | assistant | tool. `content` is text; `images` are (mime, base64) pairs on user messages;
    an assistant message may carry tool_calls; a tool message answers one call (tool_call_id, name)."""
    role: str
    content: str = ""
    images: list[tuple[str, str]] = field(default_factory=list)
    tool_calls: list[ToolCall] = field(default_factory=list)
    tool_call_id: str | None = None
    name: str | None = None
    is_error: bool = False
    extra: dict = field(default_factory=dict)    # provider replay data for assistant turns (thinking blocks, signatures)


@dataclass
class ToolSpec:
    name: str
    description: str
    parameters: dict             # JSON schema of the arguments


@dataclass
class Request:
    model: str                   # the provider's model id
    system: list[str]            # system blocks, stable first (the cacheable prefix), task-specific last
    messages: list[Message]
    tools: list[ToolSpec] = field(default_factory=list)
    tool_choice: str = "auto"    # auto | any | none | <tool name>
    response_schema: dict | None = None
    max_tokens: int = 8000
    effort: str | None = None    # low | medium | high (thinking / reasoning effort), None = provider default
    temperature: float | None = None
    cache: bool = True
    cache_ttl: str | None = None   # "1h" for sessions the defect router may resume later (Anthropic; others ignore it)
    caps: dict = field(default_factory=dict)   # the model's capability flags from models.json (thinking, tools_reasoning)


@dataclass
class Usage:
    input: int = 0               # all prompt tokens, cached included
    cached: int = 0              # prompt tokens read from cache
    cache_write: int = 0
    output: int = 0              # all output tokens, thinking included
    thinking: int = 0
    cache_write_1h: int = 0      # the part of cache_write written with the 1-hour lifetime (priced higher)

    def add(self, o: "Usage"):
        for k in ("input", "cached", "cache_write", "output", "thinking", "cache_write_1h"):
            setattr(self, k, getattr(self, k) + getattr(o, k))


@dataclass
class Response:
    text: str
    tool_calls: list[ToolCall]
    stop: str                    # end | tool | max_tokens | refusal | filtered | other
    usage: Usage
    model: str
    provider: str
    latency_s: float
    raw_id: str = ""
    extra: dict = field(default_factory=dict)
    raw: Any = None
