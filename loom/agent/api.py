"""API mode: run a model stage through the Anthropic Messages API (standard library only).

The system prompt = the stage's skills + engine prompt pack (marked cacheable, so repeated
stages pay the cheap cached-read rate). The user message = the stage's inputs, inlined.
The reply must contain the artifact; it is validated by the SAME accept gates as agent mode,
and failures are fed back for up to two repair rounds.
"""
from __future__ import annotations

import base64
import json
import os
import re
import time
import urllib.error
import urllib.request
from pathlib import Path

from ..stages import BY_NAME
from ..util import ENGINE_ROOT, LoomError, info, read_json, write_json
from .inputs import stage_inputs
from .tasks import read_prompt

API = os.environ.get("LOOM_ANTHROPIC_URL", "https://api.anthropic.com/v1/messages")  # override only for tests
MAX_INLINE = 400_000  # chars of inputs to inline


def _call(model: str, system: list, messages: list, max_tokens: int = 32000) -> dict:
    key = os.environ.get("ANTHROPIC_API_KEY")
    if not key:
        raise LoomError("ANTHROPIC_API_KEY is not set (API mode). Use agent mode, or set the key in <engine>/.env")
    body = json.dumps({"model": model, "max_tokens": max_tokens, "system": system, "messages": messages}).encode()
    for attempt in range(6):
        req = urllib.request.Request(API, data=body, headers={"x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=600) as r:
                return json.loads(r.read())
        except urllib.error.HTTPError as e:
            txt = e.read().decode("utf-8", "replace")
            if e.code in (429, 500, 502, 503, 529) and attempt < 5:
                time.sleep(min(60, 2 ** attempt * 3)); continue
            raise LoomError(f"Anthropic API error {e.code}: {txt[:600]}")
        except urllib.error.URLError as e:
            if attempt < 5:
                time.sleep(3 * (attempt + 1)); continue
            raise LoomError(f"Anthropic API unreachable: {e}")
    raise LoomError("Anthropic API: retries exhausted")


def _inline_inputs(project, stage: str) -> tuple[str, list]:
    parts, images, total = [], [], 0
    for p, why in stage_inputs(project, stage):
        path = Path(p)
        if path.is_dir():
            for f in sorted(path.iterdir()):
                if f.suffix.lower() in (".png", ".jpg", ".jpeg") and len(images) < 40:
                    images.append({"type": "image", "source": {"type": "base64", "media_type": "image/png" if f.suffix.lower() == ".png" else "image/jpeg", "data": base64.b64encode(f.read_bytes()).decode()}})
                elif f.suffix.lower() in (".json", ".md", ".js", ".py"):
                    txt = f.read_text(encoding="utf-8")
                    total += len(txt)
                    if total < MAX_INLINE:
                        parts.append(f"<file path=\"{f}\" purpose=\"{why}\">\n{txt}\n</file>")
            continue
        if path.exists():
            txt = path.read_text(encoding="utf-8")
            total += len(txt)
            if total > MAX_INLINE:
                txt = txt[:20000] + "\n...(truncated)"
            parts.append(f"<file path=\"{path}\" purpose=\"{why}\">\n{txt}\n</file>")
    return "\n\n".join(parts), images


def _extract(text: str, want: str) -> str:
    fence = {"json": r"```(?:json)?\s*\n(.*?)```", "js": r"```(?:js|javascript)\s*\n(.*?)```", "py": r"```(?:python|py)\s*\n(.*?)```"}[want]
    blocks = re.findall(fence, text, re.S)
    if blocks:
        return max(blocks, key=len).strip()
    if want == "json":
        i, j = text.find("{"), text.rfind("}")
        if i >= 0 and j > i:
            return text[i:j + 1]
    return text.strip()


def _ledger(project, stage, model, usage):
    p = project.path("qa/llm_ledger.json")
    led = read_json(p, {"calls": []})
    led["calls"].append({"stage": stage, "model": model, **(usage or {}), "at": time.strftime("%Y-%m-%dT%H:%M:%S")})
    write_json(p, led)
    from .. import ledger as L   # D-97: the same call in the decision ledger, with its token use
    L.log(project, "model_call", node=stage, by={"kind": "model", "model": model, "mode": "api"}, data=usage or {})


def run_stage(project, stage_name: str, accept_fn, extra: str = "", target: Path | None = None, want: str = "json",
              max_repairs: int = 2) -> Path:
    st = BY_NAME[stage_name]
    model = project.cfg.get("models", {}).get(st.tier or "build")
    sys_txt = []
    for s in st.skills:
        f = ENGINE_ROOT / s
        if f.exists():
            sys_txt.append(f"<skill path=\"{s}\">\n{f.read_text(encoding='utf-8')}\n</skill>")
    sys_txt.append(read_prompt(st.prompt))
    system = [{"type": "text", "text": "\n\n".join(sys_txt), "cache_control": {"type": "ephemeral"}}]
    inputs, images = _inline_inputs(project, stage_name)
    out_path = target or project.path(st.out)
    ask = (f"{extra}\n\nReturn the complete artifact for `{out_path.name}` in ONE fenced ```{want} block. Nothing else matters.")
    messages = [{"role": "user", "content": images + [{"type": "text", "text": inputs + "\n\n" + ask}]}]
    for rnd in range(max_repairs + 1):
        info(f"[api] {stage_name}: {model} (round {rnd + 1})")
        res = _call(model, system, messages)
        _ledger(project, stage_name, model, res.get("usage"))
        text = "".join(b.get("text", "") for b in res.get("content", []) if b.get("type") == "text")
        body = _extract(text, want)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        if want == "json":
            try:
                obj = json.loads(body)
            except json.JSONDecodeError as e:
                errs = [f"not valid JSON: {e}"]
                obj = None
            if obj is not None:
                write_json(out_path, obj)
                errs = accept_fn()
        else:
            out_path.write_text(body + "\n", encoding="utf-8")
            errs = accept_fn()
        if not errs:
            return out_path
        messages += [{"role": "assistant", "content": text},
                     {"role": "user", "content": "Your artifact failed these gates:\n- " + "\n- ".join(errs[:40]) + "\n\nReturn the COMPLETE corrected artifact in one fenced block."}]
    raise LoomError(f"{stage_name}: still failing after {max_repairs} repair rounds; see the gates above")
