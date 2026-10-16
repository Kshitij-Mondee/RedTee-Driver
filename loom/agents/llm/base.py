"""HTTP transport, retries and key handling shared by the provider adapters (standard library only, so the engine
gains no SDK dependency and any OpenAI-compatible server works through the same code)."""
from __future__ import annotations

import json
import os
import random
import socket
import time
import urllib.error
import urllib.request
from pathlib import Path

from ...util import ENGINE_ROOT
from .types import AuthError, BadRequest, BillingError, ContextOverflow, LLMError, Overloaded, RateLimited, Request, Response, Unreachable

# qwen (D-168): Alibaba Model Studio's OpenAI-compatible endpoint, its own key and base
KEY_ENV = {"anthropic": "ANTHROPIC_API_KEY", "openai": "OPENAI_API_KEY", "gemini": "GEMINI_API_KEY", "qwen": "DASHSCOPE_API_KEY"}
BASE_ENV = {"anthropic": "LOOM_ANTHROPIC_BASE", "openai": "LOOM_OPENAI_BASE", "gemini": "LOOM_GEMINI_BASE", "qwen": "LOOM_QWEN_BASE"}
DEFAULT_BASE = {"anthropic": "https://api.anthropic.com/v1", "openai": "https://api.openai.com/v1",
                "gemini": "https://generativelanguage.googleapis.com/v1beta",
                "qwen": "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"}
_BILLING_WORDS = ("credit balance is too low", "insufficient_quota", "exceeded your current quota", "billing details",
                  "prepayment credits are depleted", "billing account", "payment required",
                  # Alibaba Model Studio on a free-tier-only account (qwen, 2026-10-14: an HTTP 403 read as a login fault, L-438)
                  "free quota has been exhausted", "use free tier only")
_CONTEXT_WORDS = ("context length", "context window", "too long", "maximum context", "prompt is too long", "exceeds the maximum",
                  "input token count", "too many tokens")


def env_value(name: str) -> str | None:
    """Environment first, then the engine's one .env (rule 8 of RedTee; the key never leaves this process except in
    the provider's auth header)."""
    v = os.environ.get(name)
    if v:
        return v.strip()
    p = Path(os.environ.get("LOOM_ENV_FILE") or (ENGINE_ROOT / ".env"))
    try:
        for line in p.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, val = line.split("=", 1)
                if k.strip() == name:
                    val = val.strip().strip('"').strip("'")
                    return val or None
    except OSError:
        pass
    return None


def has_key(provider: str) -> bool:
    return bool(env_value(KEY_ENV[provider]))


def base_url(provider: str, override: str | None = None) -> str:
    return (override or os.environ.get(BASE_ENV[provider]) or DEFAULT_BASE[provider]).rstrip("/")


def redact(s: str) -> str:
    for p in KEY_ENV.values():
        v = env_value(p)
        if v and len(v) > 8:
            s = s.replace(v, "[redacted]")
    return s


class Provider:
    name = "base"

    def __init__(self, base: str | None = None, key: str | None = None, timeout_s: float = 1800, retries: int = 4):
        self.base = base_url(self.name, base)
        self._key = key
        self.timeout_s, self.retries = timeout_s, retries

    @property
    def key(self) -> str:
        k = self._key or env_value(KEY_ENV[self.name])
        if not k:
            raise AuthError(f"{KEY_ENV[self.name]} is not set (in the environment or {ENGINE_ROOT / '.env'})", provider=self.name)
        return k

    # -------- implemented per provider
    def build(self, req: Request) -> tuple[str, dict, dict]:
        raise NotImplementedError

    def parse(self, req: Request, body: dict, latency: float) -> Response:
        raise NotImplementedError

    def error_from(self, status: int, body: dict | str, headers) -> LLMError:
        text = json.dumps(body) if isinstance(body, dict) else str(body)
        low = text.lower()
        ra = None
        try:
            ra = float(headers.get("retry-after")) if headers and headers.get("retry-after") else None
        except (TypeError, ValueError):
            ra = None
        msg = f"{self.name} HTTP {status}: {redact(text)[:500]}"
        if any(w in low for w in _BILLING_WORDS):
            return BillingError(msg, status, self.name)     # before 429: OpenAI's insufficient_quota is a 429 that never clears
        if status in (401, 403) or "api_key_invalid" in low or "unauthenticated" in low:
            return AuthError(msg, status, self.name)
        if status == 429:
            return RateLimited(msg, status, self.name, ra)
        if status in (500, 502, 503, 504, 529):
            return Overloaded(msg, status, self.name, ra)
        if status == 400 and any(w in low for w in _CONTEXT_WORDS):
            return ContextOverflow(msg, status, self.name)
        if status in (400, 404, 413, 422):
            return BadRequest(msg, status, self.name)
        return LLMError(msg, status, self.name)

    def list_models(self) -> list[str]:
        raise NotImplementedError

    # -------- shared transport
    def _http(self, method: str, url: str, headers: dict, payload: dict | None, timeout: float) -> tuple[int, dict | str, dict]:
        data = json.dumps(payload).encode() if payload is not None else None
        rq = urllib.request.Request(url, data=data, method=method, headers=dict(headers, **({"content-type": "application/json"} if data else {})))
        try:
            with urllib.request.urlopen(rq, timeout=timeout) as r:
                raw = r.read().decode("utf-8", "replace")
                return r.status, (json.loads(raw) if raw.strip() else {}), dict(r.headers)
        except urllib.error.HTTPError as e:
            raw = e.read().decode("utf-8", "replace")
            try:
                body = json.loads(raw)
            except json.JSONDecodeError:
                body = raw
            return e.code, body, dict(e.headers or {})
        except (urllib.error.URLError, socket.timeout, ConnectionError, TimeoutError) as e:
            raise Unreachable(f"{self.name}: {redact(str(e))[:300]}", provider=self.name)

    def complete(self, req: Request) -> Response:
        url, headers, payload = self.build(req)
        last = None
        for attempt in range(self.retries + 1):
            t0 = time.monotonic()
            try:
                status, body, rh = self._http("POST", url, headers, payload, self.timeout_s)
            except Unreachable as e:
                last = e
            else:
                if status == 200 and isinstance(body, dict):
                    return self.parse(req, body, time.monotonic() - t0)
                last = self.error_from(status, body, rh)
                if not last.retryable:
                    raise last
            if attempt < self.retries:
                wait = last.retry_after if getattr(last, "retry_after", None) else min(60.0, 2.0 * (2 ** attempt))
                time.sleep(wait * (0.85 + 0.3 * random.random()) if os.environ.get("LOOM_TEST_FAST_RETRY") is None else 0.01)
        raise last
