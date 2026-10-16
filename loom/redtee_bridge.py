"""RedTee bridge: use the existing, fitted RedTee blueprint library as a Loom template provider.

READ-ONLY by construction: Loom never writes into the RedTee folder. It imports a blueprint's
render(box, params, theme) in a subprocess with bytecode writing disabled, maps Loom's style
palette onto RedTee theme tokens, and re-times the SVG's CSS reveal groups onto narration cues
in the runtime (the CSS animations are switched off and replaced by timeline tweens).

Configure the location once: <engine>/loom.config.json -> {"redtee_root": "C:/.../RedTee_V1_Video"}
or the REDTEE_ROOT environment variable.
"""
from __future__ import annotations

import json
import os
import subprocess
from pathlib import Path

from .util import ENGINE_ROOT, LoomError, py_exe, read_json, sha, write_json


def root() -> Path | None:
    cfg = read_json(ENGINE_ROOT / "loom.config.json", {})
    r = os.environ.get("REDTEE_ROOT") or cfg.get("redtee_root")
    if not r:
        return None
    p = Path(r)
    return p if (p / "common/blueprints/MANIFEST.json").exists() else None


def manifest() -> dict:
    r = root()
    if not r:
        raise LoomError("RedTee bridge: set REDTEE_ROOT or loom.config.json redtee_root to the RedTee_V1_Video folder")
    return {b["id"]: b for b in read_json(r / "common/blueprints/MANIFEST.json")["blueprints"]}


def theme_from_style(style: dict) -> dict:
    P = style["palette"]
    return {"bg": P["field"], "surface": P["surface"], "fill": P["surface"], "fill2": P["surface2"], "ink": P["ink"], "muted": P["muted"],
            "line": P["line"], "card_stroke": P["surface2"], "accent": P["accent"], "accent2": P["accent2"], "accent3": P["accent3"],
            "accent4": P["accent4"], "accent_grad": [P["accent"], P["accent"]], "accent2_grad": [P["accent2"], P["accent2"]],
            "accent3_grad": [P["accent3"], P["accent3"]], "mesh": [P["field2"], P["field"], P["field2"]], "shadow": P["shadow"],
            "pos": P["pos"], "neg": P["neg"], "onAccent": P.get("onAccent", P["field"])}


_RUNNER = r'''
import sys, json, importlib.util, os
sys.dont_write_bytecode = True
root, module, payload = sys.argv[1], sys.argv[2], json.loads(sys.stdin.read())
bp = os.path.join(root, "common", "blueprints")
sys.path.insert(0, bp)
spec = importlib.util.spec_from_file_location("rt_bp", os.path.join(root, module))
mod = importlib.util.module_from_spec(spec); spec.loader.exec_module(mod)
sys.stdout.write(mod.render(payload["box"], payload["params"], payload["theme"]))
'''


def render_svg(project, bp_id: str, params: dict, rect, style: dict) -> str:
    man = manifest()
    if bp_id not in man:
        raise LoomError(f"RedTee blueprint '{bp_id}' not in MANIFEST")
    meta = man[bp_id]
    if meta.get("engine") != "svg":
        raise LoomError(f"RedTee blueprint '{bp_id}' is engine '{meta.get('engine')}': only svg blueprints are bridged")
    box = {"w": int(rect[2]), "h": int(rect[3])}
    theme = theme_from_style(style)
    key = sha(bp_id, params, box, theme)
    cache = project.path("media/redtee"); cache.mkdir(parents=True, exist_ok=True)
    out = cache / f"{bp_id.replace('.', '_')}-{key}.svg"
    if out.exists():
        return out.read_text(encoding="utf-8")
    env = dict(os.environ, PYTHONDONTWRITEBYTECODE="1")
    r = subprocess.run([py_exe(), "-B", "-c", _RUNNER, str(root()), meta["_module"]], input=json.dumps({"box": box, "params": params, "theme": theme}),
                       capture_output=True, text=True, encoding="utf-8", env=env, timeout=120, cwd=str(ENGINE_ROOT))
    if r.returncode != 0 or "<svg" not in r.stdout:
        raise LoomError(f"RedTee render failed for {bp_id}: {r.stderr[-800:]}")
    out.write_text(r.stdout, encoding="utf-8")
    return r.stdout


def missing_content_params(bp_id: str, props: dict) -> list[str]:
    """Every text/list param must be given explicitly: RedTee defaults are SAMPLE content, and a
    sample string must never reach a real lesson (the defect RedTee's own Rule 0 records)."""
    meta = manifest().get(bp_id) or {}
    return [k for k, v in (meta.get("params") or {}).items() if v.get("type") in ("str", "list") and k not in props and v.get("default") not in ("", [], None)]


def write_catalog() -> Path:
    man = manifest()
    lines = ["# RedTee blueprints available through the bridge (generated)", "",
             "Use in a storyboard scene: `{\"kind\": \"redtee\", \"blueprint\": \"<id>\", \"props\": {...all text params...}, \"order_cues\": [\"spoken words for reveal 0\", ...]}`.",
             "Text and list params MUST be supplied (defaults are sample content). `order_cues[i]` is the spoken anchor for the i-th reveal group.", ""]
    for bid, b in sorted(man.items()):
        if b.get("engine") != "svg":
            continue
        ps = ", ".join(f"{k}:{v.get('type')}" for k, v in (b.get("params") or {}).items())
        lines.append(f"- `{bid}` ({b.get('intent')}; {b.get('motion_is', 'staging')}) best for: {', '.join((b.get('best_for') or [])[:5])}. params: {ps}")
    p = ENGINE_ROOT / "runtime/redtee_catalog.md"
    p.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return p
