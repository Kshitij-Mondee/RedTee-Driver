"""The lesson kit gate (2026-10-08, docs/strategy/2026-10-08-pipeline-architecture.md section 5.2).

A lesson kit is `scenes/_kit.js`: the lesson's own sets, screens, devices and parts, written once as code and
composed by its bespoke beats with `Loom.lesson.<id>(ctx, parent, opts)`. Cowork's best lessons work this way by
hand (mfa-story's sign-in page and phone in b01, groupthink's room and bubbles); the critique of the architecture
study measured that most of their craft lives there, not in per-beat choreography.

The gate is static and cheap: the parts the storyboard declares exist, nothing nondeterministic, tokens only, no
beat registration, no em or en dashes. The picture is proven by the beats' own snapshots (and, on the PC, a kit
strip); this gate does not claim to have seen it.
"""
from __future__ import annotations

import re

from ..util import read_json

KIT = "scenes/_kit.js"
_BANNED = [
    (r"\bMath\.random\s*\(", "Math.random: use Loom.rng(\"seed\") (frames are a pure function of time)"),
    (r"\bnew\s+Date\b|\bDate\.now\s*\(", "Date: no wall clock in scene code"),
    (r"\b(setTimeout|setInterval|requestAnimationFrame)\s*\(", "timers: everything runs on the timeline"),
    (r"\b(fetch|XMLHttpRequest)\b", "network: a kit draws, it never loads"),
    (r"repeat\s*:\s*-1", "repeat: -1 never ends"),
    (r"Loom\.scene\s*\(", "Loom.scene: a kit registers parts, never a beat"),
]
_HEX = re.compile(r"""["'`]#[0-9a-fA-F]{3,8}["'`]""")


def declared(project) -> list[dict]:
    """The kit parts the lesson builds: a part with `reuse` is loaded from the style's library (loom/kept.py, D-163), not
    written in scenes/_kit.js."""
    sb = read_json(project.path("plan/storyboard.json"), {}) or {}
    return [p for p in ((sb.get("kit") or {}).get("parts")) or [] if not p.get("reuse")]


def kit_errors(project, source: str | None = None) -> tuple[list[str], list[str]]:
    """(errors, warnings) for the lesson kit. `source` checks a draft instead of the file on disk."""
    parts = declared(project)
    f = project.path(KIT)
    if source is None:
        if not f.exists():
            return ([f"{KIT}: missing (the storyboard declares {len(parts)} kit part(s))"] if parts else []), []
        source = f.read_text(encoding="utf-8")
    E, W = [], []
    code = re.sub(r"/\*.*?\*/", "", source, flags=re.S)
    code = re.sub(r"//[^\n]*", "", code)
    for pat, why in _BANNED:
        if re.search(pat, code):
            E.append(f"{KIT}: {why}")
    if _HEX.search(code):
        E.append(f"{KIT}: a hex colour literal: colours come from tokens (ctx.c(\"token\") or Loom.style), so a restyle restyles the kit")
    if re.search("[–—―]", source):
        E.append(f"{KIT}: em or en dash in the kit")
    if not re.search(r"Loom\.lesson\s*=\s*Loom\.lesson\s*\|\|", code):
        E.append(f"{KIT}: start with `Loom.lesson = Loom.lesson || {{}};` so every part hangs on Loom.lesson")
    defined = set(re.findall(r"Loom\.lesson\.([A-Za-z_]\w*)\s*=", code)) | set(re.findall(r"Loom\.lesson\[\s*[\"'](\w+)[\"']\s*\]\s*=", code))
    for p in parts:
        if p.get("id") not in defined:
            E.append(f"{KIT}: part '{p.get('id')}' (declared in the storyboard kit) is not defined: Loom.lesson.{p.get('id')} = function (ctx, parent, opts) {{ ... }}")
    extra = sorted(defined - {p.get("id") for p in parts})
    if extra:
        W.append(f"{KIT}: parts not declared in the storyboard kit: {', '.join(extra)} (declare them, or keep them private helpers)")
    # beats that should use a part but never call it (the kit exists to be composed)
    sb = read_json(project.path("plan/storyboard.json"), {}) or {}
    files = {s.get("beat"): project.path(f"scenes/{s.get('scene') or s['beat']}.js") for s in sb.get("scenes") or [] if s.get("kind") == "bespoke"}
    for p in parts:
        for b in p.get("beats") or []:
            fp = files.get(b)
            if fp is not None and fp.exists() and f"Loom.lesson.{p['id']}" not in fp.read_text(encoding="utf-8"):
                W.append(f"{b}: the kit part '{p['id']}' is declared for this beat but the scene does not use it")
            if b not in files:
                W.append(f"kit part '{p['id']}': beat {b} is not a bespoke beat (only bespoke scenes compose kit parts)")
    return E, W
