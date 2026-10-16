"""Style engines (D-175): runtime/engines/<style id>.js, the working code next to a style's written rules.

A pack is data, a guide is rules, an engine is the code that solves the style's hard part once (runtime/engines.js has
the contract). This module finds a style's engine and lints it; compose and the lab load it only for that style, and
scenes reach it as `ctx.engine`. Engines (2026-10-16): whiteboard, blueprint, isometric, hologram, screencast; each is built with its style, one at a time, when
Kshitij picks the style (2026-10-15: "for specific styles, don't do anything else").
"""
from __future__ import annotations

import re
from pathlib import Path

from .util import ENGINE_ROOT

ENGINES_DIR = ENGINE_ROOT / "runtime" / "engines"
# what an engine must never do: a frame is a pure function of time (CLAUDE.md rule 3)
FORBIDDEN = [
    (r"\bMath\.random\s*\(", "Math.random (use Loom.rng)"),
    (r"\bDate\.now\s*\(|\bnew\s+Date\s*\(", "the clock (Date)"),
    (r"\bperformance\.now\s*\(", "the clock (performance.now)"),
    (r"\bset(?:Timeout|Interval)\s*\(", "timers"),
    (r"\brequestAnimationFrame\s*\(", "requestAnimationFrame"),
    (r"\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b", "the network"),
]


def engine_file(style_id: str | None) -> Path | None:
    if not style_id:
        return None
    f = ENGINES_DIR / f"{style_id}.js"
    return f if f.exists() else None


def engines() -> list[str]:
    return sorted(p.stem for p in ENGINES_DIR.glob("*.js")) if ENGINES_DIR.exists() else []


def _strip_comments(src: str) -> str:
    src = re.sub(r"/\*.*?\*/", " ", src, flags=re.S)
    return re.sub(r"(^|[^:\"'])//[^\n]*", r"\1", src)


def lint(path: Path) -> list[str]:
    """errors for one engine file: it defines the engine of the style it is named after, a pack of that id exists, and
    it uses nothing that makes a frame depend on anything but time"""
    path = Path(path)
    sid = path.stem
    src = path.read_text(encoding="utf-8")
    code = _strip_comments(src)
    E = []
    if not (ENGINE_ROOT / "packs" / "styles" / f"{sid}.json").exists():
        E.append(f"engine {path.name}: no style pack '{sid}' (an engine is named after its style's id)")
    ids = re.findall(r"""Loom\.engines\.define\(\s*["']([^"']+)["']""", code)
    if ids != [sid]:
        E.append(f"engine {path.name}: must call Loom.engines.define(\"{sid}\", ...) once (found {ids or 'none'})")
    for pat, what in FORBIDDEN:
        if re.search(pat, code):
            E.append(f"engine {path.name}: uses {what}; frames must be a pure function of time")
    return E


def lint_all() -> list[str]:
    return [e for s in engines() for e in lint(ENGINES_DIR / f"{s}.js")]


HAND_DIR = ENGINE_ROOT / "assets" / "engines" / "whiteboard" / "hand"   # not a Loom.hands family (assets/hands, D-114)
HAND_POSES = ("write", "write_lifted", "rest")


def _svg_art(f: Path) -> dict:
    """a designed svg as {body (inner markup), viewBox, anchor, wrist} for the runtime (read with patterns: local art
    that passed tools/asset_intake.py)"""
    txt = f.read_text(encoding="utf-8")
    m = re.search(r"<svg\b([^>]*)>(.*)</svg>", txt, re.S)
    if not m:
        raise ValueError(f"{f.name}: no <svg> root")
    attrs = dict(re.findall(r'([\w:-]+)="([^"]*)"', m.group(1)))
    nums = lambda s: [float(v) for v in re.split(r"[\s,]+", (s or "").strip()) if v]  # noqa: E731
    return {"body": m.group(2).strip(), "viewBox": nums(attrs.get("viewBox") or "0 0 400 640"),
            "anchor": nums(attrs.get("data-anchor") or "200,0"), "wrist": nums(attrs.get("data-wrist") or "200,640"),
            "scale": float(attrs.get("data-scale") or 0.62), "rotate": float(attrs.get("data-rotate") or -8),
            "arm": nums(attrs.get("data-arm")) or None}   # the sleeve's axis: x, y, dx, dy, width (tools/hand_from_png.py)


def enabled_for(project, style_id: str | None) -> bool:
    """a lesson uses its style's engine unless its request says `"engine": "off"` (the classic way, kept: D-70; and the
    with/without comparison of D-179)"""
    return bool(engine_file(style_id)) and str((getattr(project, "request", None) or {}).get("engine", "on")).lower() != "off"


def skin_refuses(style_id: str | None) -> list[str]:
    """D-198: the catalog templates a style's skin refuses (forms its essence avoids: people on a hologram console, a
    quote on an isometric map), read from the `refuse: [...]` of the skin in runtime/engines/<style>.js, the one place the
    list is kept. [] for a style with no engine or no skin."""
    import re
    f = engine_file(style_id)
    if not f:
        return []
    src = f.read_text(encoding="utf-8")
    i, j = src.find("the template skin (D-198)"), src.find("Loom.skins.define(")
    m = re.search(r"refuse: \[([^\]]*)\]", src[i:j]) if i >= 0 and j > i else None
    return re.findall(r'"([a-z.]+)"', m.group(1)) if m else []


ENGINE_GUIDES = ENGINE_ROOT / "docs" / "styles" / "engines"


def engine_guide(style_id: str | None) -> str | None:
    f = ENGINE_GUIDES / f"{style_id}.md"
    return f.read_text(encoding="utf-8") if style_id and f.exists() else None


def engine_assets(style_id: str | None, hand_dir: Path | None = None) -> dict:
    """what a style's engine needs embedded in a build (manifest.assets): the whiteboard engine's stroke font, and its
    designed writing hand when it exists (docs/assets/HAND_PROMPT_WHITEBOARD.md); {} for a style with no engine"""
    if not engine_file(style_id):
        return {}
    from .stroke_fonts import for_style
    out = {"strokeFonts": for_style(style_id)}
    if style_id == "whiteboard":
        import os
        d = Path(hand_dir or os.environ.get("LOOM_WB_HAND_DIR") or HAND_DIR)   # the env var: a stand-in for tests only
        poses = {p: _svg_art(d / f"{p}.svg") for p in HAND_POSES if (d / f"{p}.svg").exists()}
        if "write" in poses:
            out["wbHand"] = poses
    return out
