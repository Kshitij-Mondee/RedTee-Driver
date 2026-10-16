"""Model catalogue, routing profiles, provider factory and cost arithmetic (D-115)."""
from __future__ import annotations

import json
from pathlib import Path

from ...util import LoomError
from .anthropic import Anthropic
from .base import has_key
from .gemini import Gemini
from .openai_chat import OpenAIChat, QwenChat
from .openai_responses import OpenAIResponses
from .types import Usage

CONFIG = Path(__file__).resolve().parent.parent / "config"
PROVIDERS = {"anthropic": Anthropic, "openai": OpenAIChat, "gemini": Gemini, "qwen": QwenChat}


def models() -> dict:
    return json.loads((CONFIG / "models.json").read_text(encoding="utf-8"))["models"]


def model(alias: str) -> dict:
    m = models().get(alias)
    if not m:
        raise LoomError(f"unknown model alias '{alias}' (loom/agents/config/models.json has: {', '.join(models())})")
    return dict(m, alias=alias)


def profiles() -> list[str]:
    return sorted(p.stem for p in (CONFIG / "profiles").glob("*.json"))


def profile(name: str) -> dict:
    p = CONFIG / "profiles" / f"{name}.json"
    if not p.exists():
        raise LoomError(f"unknown routing profile '{name}' (have: {', '.join(profiles())})")
    P = json.loads(p.read_text(encoding="utf-8"))
    for role, alias in P["roles"].items():
        model(alias)       # every alias must exist (fail early, before any spend)
    # by the model, not the alias's spelling: a claude_code alias (cc-opus) is Opus too. A profile may opt out only by
    # naming who allowed it and the decision (`opus_storyboard`, D-142: Kshitij, 2026-10-08, claude-cc-opus-sb)
    allowed = str(P.get("opus_storyboard") or "").strip()
    if any("opus" in model(P["roles"][r])["id"] for r in ("storyboard", "storyboard_outline") if P["roles"].get(r)) \
            and not ("D-" in allowed and len(allowed) > 8):
        raise LoomError(f"profile '{name}': Opus may not write the storyboard (Kshitij, 2026-10-06), unless the profile's "
                        f"`opus_storyboard` names who allowed it and the decision")
    return P


def provider_for(m: dict, **kw):
    cls = OpenAIResponses if (m["provider"] == "openai" and m.get("api") == "responses") else PROVIDERS[m["provider"]]
    return cls(base=m.get("base"), **kw)


def available(m: dict) -> bool:
    if m["provider"] == "claude_code":           # the claude CLI on the person's login; no key involved
        from ...util import which
        return bool(which("claude"))
    return has_key(m["provider"])


def _tier(m: dict, prompt_tokens: int) -> dict:
    """Gemini 3.1 Pro charges more for prompts above 200k tokens (models.json `long_context`)."""
    lc = m.get("long_context")
    if lc and prompt_tokens > int(lc.get("above", 10 ** 12)):
        return dict(m, **{k: v for k, v in lc.items() if k != "above"})
    return m


def cost(m: dict, u: Usage) -> float:
    """USD for one call: uncached input, cached input, cache writes and output (thinking included in output)."""
    m = _tier(m, u.input)
    fresh = max(0, u.input - u.cached - u.cache_write)
    w1h = min(getattr(u, "cache_write_1h", 0) or 0, u.cache_write)
    cw = m.get("cache_write", m["in"])
    # a 1-hour cache write costs twice the input price on Anthropic (the 5-minute one 1.25x)
    return (fresh * m["in"] + u.cached * m.get("cached_in", m["in"]) + (u.cache_write - w1h) * cw + w1h * m.get("cache_write_1h", 2 * m["in"])
            + u.output * m["out"]) / 1e6


def worst_case(m: dict, prompt_tokens: int, max_tokens: int, cached_tokens: int = 0) -> float:
    """The most one call can cost: the budget guard's number. The prompt the previous turn already sent is priced as a
    cache read (pricing it fresh stopped runs with real money left, 2026-10-07); the rest as a fresh write at the
    higher of the input and cache-write prices; the output at its full allowance."""
    m = _tier(m, prompt_tokens)
    cached = max(0, min(cached_tokens, prompt_tokens))
    fresh = prompt_tokens - cached
    return (cached * m.get("cached_in", m["in"]) + fresh * max(m["in"], m.get("cache_write_1h", 0) or 0, m.get("cache_write", 0) or 0)
            + max_tokens * m["out"]) / 1e6


def estimate_tokens(text_chars: int, images: int = 0) -> int:
    """About 3.6 characters a token for English plus JSON, and about 1,600 tokens per 1080p image (an estimate;
    the providers count differently, the usage reported back is what is booked)."""
    return int(text_chars / 3.6) + 1600 * images
