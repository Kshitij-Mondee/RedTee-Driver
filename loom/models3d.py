"""The 3D model library (D-138): reusable, token-coloured, deterministic Three.js models in assets/models3d.

Each model is one ES module, `assets/models3d/<id>.js`, whose first line is its card:

    // @model {"id": "phone", "what": "...", "parts": [...], "keys": {key: what it does}, "best_for": [...],
    //         "not_for": [...], "size": [w, h, d], "sheet": {"opts": {...}, "states": [...], "light": "studio"}}

and which exports `make(ctx, THREE, X, opts) -> handle {group, parts, size, keys, set(key, value)}`. A Three.js
scene loads one with `await X.model(id, opts)` (runtime/three/render.mjs); the shared toolkit is
runtime/three/kit3d.js (X.kit). People are never models: they come from designed character kits.

    py -m loom models                      the list (id, what, keys)
    py -m loom models check                the library gate (cards, determinism, token colours, no words invented)
    py -m loom models sheet [ids] [--style s]   turntable contact sheets -> docs/assets/models3d/<id>__<style>.jpg
"""
from __future__ import annotations

import json
import re
import shutil
from pathlib import Path

from .util import ENGINE_ROOT, LoomError, info, sha

LIB = ENGINE_ROOT / "assets" / "models3d"
KIT = ENGINE_ROOT / "runtime" / "three" / "kit3d.js"
SHEETS = ENGINE_ROOT / "docs" / "assets" / "models3d"
CARD_KEYS = ("id", "pack", "what", "parts", "keys", "best_for", "size")
PACKS = ("devices", "security", "workplace", "datacentre", "ai_ml", "devs", "email")   # a set is a model with "set": true
BANNED = [(re.compile(r"\bMath\.random\b"), "Math.random"), (re.compile(r"\bDate\.now\b|new Date\b"), "wall-clock time"),
          (re.compile(r"\bset(?:Timeout|Interval)\b|requestAnimationFrame"), "timers"),
          (re.compile(r"\bfetch\(|XMLHttpRequest|WebSocket"), "network")]
HEX = re.compile(r"#[0-9a-fA-F]{3,8}\b|\b0x[0-9a-fA-F]{6}\b|rgba?\(\s*\d")


def files() -> list[Path]:
    return sorted(LIB.glob("*.js")) if LIB.exists() else []


def card(path: Path) -> dict:
    first = path.read_text(encoding="utf-8").split("\n", 1)[0]
    m = re.match(r"//\s*@model\s+(\{.*\})\s*$", first)
    if not m:
        raise LoomError(f"{path.name}: the first line must be `// @model {{...}}` (its card)")
    return json.loads(m.group(1))


def cards() -> list[dict]:
    return [card(f) for f in files()]


def library_sha() -> str:
    """What a Three.js clip depends on beyond its own file: the toolkit and every model (a clip is re-rendered when
    any of them changes; models change rarely, so the simple key is the safe one)."""
    parts = [KIT.read_bytes() if KIT.exists() else b""] + [f.read_bytes() for f in files()]
    return sha(*[p.decode("utf-8", "replace") for p in parts])


def check() -> tuple[list[str], list[str]]:
    """The library gate: every model has a full card whose id is its file name, exports make(), is deterministic,
    uses no literal colour, and carries no words of its own (text arrives through opts)."""
    E, W = [], []
    fs = files()
    if not fs:
        E.append("assets/models3d has no models (a zero is red, not green)")
    for f in fs + ([KIT] if KIT.exists() else []):
        src = f.read_text(encoding="utf-8")
        code = re.sub(r"//.*|/\*[\s\S]*?\*/", "", src)
        for rx, why in BANNED:
            if rx.search(code):
                E.append(f"{f.name}: {why} breaks determinism")
        if HEX.search(code):
            E.append(f"{f.name}: a literal colour; use a role or token (X.kit.col / ctx.c) so style and brand apply")
        if re.search("[\u2013\u2014\u2015]", src):
            E.append(f"{f.name}: an em or en dash")
        if f == KIT:
            continue
        # words drawn by fillText must come from opts or a spec, never a literal string (checked before the card, so a
        # model without a card is still read for it)
        for lit in re.findall(r"fillText\(\s*(['\"`])([^'\"`]+)\1", code):
            E.append(f"{f.name}: fillText of a literal '{lit[1][:30]}' (words come from opts)")
        if not re.search(r"export\s+(async\s+)?function\s+make\s*\(", code):
            E.append(f"{f.name}: exports no make(ctx, THREE, X, opts)")
        try:
            c = card(f)
        except LoomError as e:
            E.append(str(e)); continue
        except json.JSONDecodeError as e:
            E.append(f"{f.name}: its card is not JSON ({e})"); continue
        miss = [k for k in CARD_KEYS if not c.get(k)]
        if miss:
            E.append(f"{f.name}: card misses {miss}")
        if c.get("pack") and c["pack"] not in PACKS:
            E.append(f"{f.name}: pack '{c['pack']}' is not one of {PACKS}")
        if c.get("id") != f.stem:
            E.append(f"{f.name}: card id '{c.get('id')}' is not the file name")
        keys = set((c.get("keys") or {}).keys())
        for k in sorted(keys):
            if k != "turn" and f"\"{k}\"" not in code and f"'{k}'" not in code:
                W.append(f"{f.name}: card key '{k}' is not handled in set()")
        if not (SHEETS.exists() and any(SHEETS.glob(f"{f.stem}__*.jpg"))):
            W.append(f"{f.name}: no turntable sheet yet (py -m loom models sheet {f.stem})")
    return E, W


def listing(compact: bool = False) -> str:
    """Every model, grouped by pack. compact: one short line each (id, what, key names) for an agent's prompt; the full
    card of one model is its file's first line."""
    if compact:
        out, cur = [], None
        for c in sorted(cards(), key=lambda c: (PACKS.index(c["pack"]) if c.get("pack") in PACKS else 99, c["id"])):
            if c.get("pack") != cur:
                cur = c.get("pack"); out.append(f"- **{cur}**:")
            what = re.split(r"[:;]", c.get("what", ""), maxsplit=1)[0][:90]
            keys = ", ".join(k for k in (c.get("keys") or {}) if k != "turn")
            out.append(f"  - `{c['id']}`{' (set)' if c.get('set') else ''}: {what}. Keys: {keys}.")
        return "\n".join(out)
    rows = []
    for c in sorted(cards(), key=lambda c: (PACKS.index(c["pack"]) if c.get("pack") in PACKS else 99, c["id"])):
        keys = ", ".join(f"{k} ({v})" for k, v in (c.get("keys") or {}).items())
        rows.append(f"- `{c['id']}` ({c.get('pack', '?')}{', a set' if c.get('set') else ''}): {c['what']}. Keys: {keys}. Best for: {'; '.join(c.get('best_for') or [])}."
                    + (f" Not for: {'; '.join(c['not_for'])}." if c.get("not_for") else ""))
    return "\n".join(rows)


def sheet(ids: list[str] | None = None, style: str = "corporate-clean") -> list[str]:
    """Turntable contact sheets through the real renderer (the lab's clip_strip and model_turntable)."""
    from .lab import OUT, clip_strip
    out = []
    SHEETS.mkdir(parents=True, exist_ok=True)
    for c in cards():
        if ids and c["id"] not in ids:
            continue
        sp = c.get("sheet") or {}
        params = {"model": c["id"], "opts": sp.get("opts") or {}, "states": sp.get("states") or [], "light": sp.get("light") or "studio",
                  "turn": sp.get("turn", 1.8)}
        for k in ("elevation", "mood"):
            if k in sp:
                params[k] = sp[k]
        r = clip_strip("three", "model_turntable", style, times=sp.get("times"), params=params, size=(960, 720),
                       out_name=f"_sheet_{c['id']}__{style}.jpg")
        dst = SHEETS / f"{c['id']}__{style}.jpg"
        shutil.move(r["sheet"], dst)
        info(f"models: {c['id']} [{style}] -> {dst.relative_to(ENGINE_ROOT).as_posix()}")
        out.append(str(dst))
    if ids and not out:
        raise LoomError(f"no model among {ids}; have {[c['id'] for c in cards()]}")
    _ = OUT
    return out


def cli(args) -> int:
    act = args.action or "list"
    if act == "list":
        print(listing() or "(no models)"); return 0
    if act == "check":
        E, W = check()
        for w in W:
            print("  warn:", w)
        for e in E:
            print("  ERROR:", e)
        print(f"models: {len(files())} checked, {len(E)} errors, {len(W)} warnings")
        return 1 if E else 0
    if act == "sheet":
        sheet(args.ids or None, args.style or "corporate-clean"); return 0
    raise LoomError(f"models: unknown action {act}")
