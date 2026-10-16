"""The toolbox (D-137): five tools beyond plain SVG, one source (docs/TOOLBOX.md) for both pipelines.

- `menu()` is the short part every storyboard, scene, clip, kit and tweak agent has in front of it (cached in the
  API role prompt; read from the page in Cowork).
- `load(names)` returns the sections of the tools asked for, plus anything live (the 3D model list for `three`).
  It is code, not a model: it costs no call, and the only tokens it adds are the sections the agent asked for.
- `for_scene(scene)` is what a beat's worker is handed without asking: the tools its storyboard scene names in
  `tools`, plus the tool its kind implies (a `three` or `skia` beat).
"""
from __future__ import annotations

import re

from .util import ENGINE_ROOT, LoomError

PAGE = ENGINE_ROOT / "docs" / "TOOLBOX.md"
TOOLS = ("physics", "brush", "orb", "three", "skia")
KIND_TOOL = {"three": "three", "skia": "skia"}
ALIASES = {"matter": "physics", "matter.js": "physics", "p5.brush": "brush", "thinking-orbs": "orb", "threejs": "three",
           "three.js": "three", "3d": "three", "models": "three", "models3d": "three", "skia-python": "skia"}


def enabled() -> bool:
    """LOOM_TOOLBOX=off removes the menu, use_tool and the hand-over: the 'before' arm of an A/B (tools/toolbox_ab.py)."""
    import os
    return os.environ.get("LOOM_TOOLBOX", "on").strip().lower() not in ("off", "0", "no")


def _sections() -> dict[str, str]:
    text = PAGE.read_text(encoding="utf-8")
    out, cur, buf = {}, None, []
    for line in text.splitlines():
        m = re.match(r"^##\s+(\S.*?)\s*$", line)
        if m:
            if cur:
                out[cur] = "\n".join(buf).strip()
            cur, buf = m.group(1).strip().lower(), [line]
        elif cur:
            buf.append(line)
    if cur:
        out[cur] = "\n".join(buf).strip()
    return out


def norm(name: str) -> str | None:
    n = str(name or "").strip().lower()
    n = ALIASES.get(n, n)
    return n if n in TOOLS else None


def menu() -> str:
    s = _sections().get("menu")
    if not s:
        raise LoomError("docs/TOOLBOX.md has no '## Menu' section")
    return s


def load(names) -> dict:
    """{loaded: [...], sections: {tool: text}, unknown: [...]} for the tools asked for (one or several)."""
    if isinstance(names, str):
        names = [names]
    secs = _sections()
    loaded, sections, unknown = [], {}, []
    for raw in names or []:
        t = norm(raw)
        if not t:
            unknown.append(raw); continue
        if t in sections:
            continue
        body = secs.get(t)
        if not body:
            raise LoomError(f"docs/TOOLBOX.md has no '## {t}' section")
        if t == "three":
            from .models3d import listing
            body += ("\n\n### The model library now (assets/models3d; a model's full card, with what each key means, is the first "
                     "line of its file: get_example_scene('model:<id>'); its turntable sheet: docs/assets/models3d/<id>__corporate-clean.jpg)\n"
                     + (listing(compact=True) or "(no models)"))
        sections[t] = body; loaded.append(t)
    return {"loaded": loaded, "sections": sections, "unknown": unknown, "known": list(TOOLS)}


def for_scene(scene: dict) -> list[str]:
    """The tools a beat's worker is handed: the scene's `tools` plus the one its kind implies, in a stable order."""
    want = {norm(t) for t in (scene.get("tools") or [])} - {None}
    if scene.get("kind") in KIND_TOOL:
        want.add(KIND_TOOL[scene["kind"]])
    return [t for t in TOOLS if t in want]


def handout(scene: dict) -> str:
    """The text block a scene, clip or kit task carries for its beat (empty when the beat names no tool)."""
    tools = for_scene(scene) if enabled() else []
    if not tools:
        return ""
    got = load(tools)
    return ("TOOLS LOADED FOR THIS BEAT (the storyboard chose them; their sections from docs/TOOLBOX.md):\n\n"
            + "\n\n".join(got["sections"][t] for t in got["loaded"]))


def scene_errors(sb: dict) -> list[str]:
    """The storyboard gate's part: every name in a scene's `tools` is a tool."""
    E = []
    for s in sb.get("scenes") or []:
        for t in s.get("tools") or []:
            if not norm(t):
                E.append(f"{s.get('beat')}: tools names '{t}', which is not a toolbox tool ({', '.join(TOOLS)})")
    return E
