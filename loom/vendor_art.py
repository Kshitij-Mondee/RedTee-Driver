"""Vendor art (D-88): free, licence-checked illustration sets, used by reference `set:name` (`Loom.art`).

Approved sets live in `assets/vendor/SOURCES.json` (licence, where it was verified, how it is fetched). Two ways
in:
- npm packages listed in package.json (`npm install` fetches them), e.g. Microsoft Fluent Emoji Flat (MIT);
- `py tools/fetch_assets.py`, which downloads the other approved sets from their official URLs into
  `assets/vendor/<set>/`, with a LICENSE.txt and a SOURCE.json of checksums.

A scene names a piece of art with a literal reference: `Loom.art.place(ctx, "cup", "fluent:hot-beverage", {...})`.
Compose (and the lab) embeds only the art the scene sources reference, so a build carries what it uses. An
unknown reference is an error, and so is a set that is not on the approved list (licence first).
"""
from __future__ import annotations

import base64
import json
import re
from functools import lru_cache
from pathlib import Path

from .util import ENGINE_ROOT, read_json

VENDOR = ENGINE_ROOT / "assets" / "vendor"
REF_RE = re.compile(r'["\']([a-z][a-z0-9-]*):([A-Za-z0-9_./-]+)["\']')


@lru_cache(maxsize=1)
def sources() -> dict:
    return {s["id"]: s for s in read_json(VENDOR / "SOURCES.json", {"sets": []})["sets"]}


@lru_cache(maxsize=4)
def _iconify(path: str) -> dict:
    p = ENGINE_ROOT / path
    return read_json(p, {}) if p.exists() else {}


def resolve(ref: str, lesson: bool = False) -> tuple[dict | None, str | None]:
    """(art, error). art = {ref, set, licence, w, h, body | href}. lesson=True (a lesson build) refuses a set marked
    `cleared: false` (registered for a lab bake-off, licence not cleared for client use: e2gen, B6 2026-10-08)."""
    if ":" not in ref:
        return None, f"art reference '{ref}' must be set:name"
    sid, name = ref.split(":", 1)
    S = sources().get(sid)
    if not S:
        return None, f"art set '{sid}' is not an approved set (assets/vendor/SOURCES.json)"
    if lesson and S.get("cleared") is False:
        return None, f"art set '{sid}' is not cleared for a lesson ({S.get('cleared_note') or S['licence']})"
    lic = {"licence": S["licence"], "set": S["name"]}
    if S.get("kind") == "iconify":
        d = _iconify(S["path"])
        icons = d.get("icons") or {}
        if not icons:
            return None, f"art set '{sid}' is not installed: run `npm install` in the engine folder"
        ic = icons.get(name)
        if not ic:
            return None, f"no art '{name}' in {S['name']}"
        return dict(lic, ref=ref, w=ic.get("width", d.get("width", 16)), h=ic.get("height", d.get("height", 16)), body=ic["body"]), None
    base = VENDOR / sid
    if not base.exists():
        return None, f"art set '{sid}' is not downloaded: run `py tools/fetch_assets.py {sid}`"
    for ext in (".svg", ".png"):
        f = base / (name + ext)
        if f.exists():
            if ext == ".svg":
                s = re.sub(r"<\?xml[^>]*>|<!DOCTYPE[^>]*>|<metadata>[\s\S]*?</metadata>", "", f.read_text(encoding="utf-8", errors="replace"))
                vb = re.search(r'viewBox="([^"]+)"', s)
                v = [float(x) for x in vb.group(1).replace(",", " ").split()] if vb else [0, 0, 100, 100]
                inner = re.sub(r"^[\s\S]*?<svg[^>]*>|</svg>\s*$", "", s.strip())
                if v[0] or v[1]:
                    inner = f'<g transform="translate({-v[0]} {-v[1]})">{inner}</g>'
                return dict(lic, ref=ref, w=v[2], h=v[3], body=inner), None
            from PIL import Image
            with Image.open(f) as im:
                w, h = im.size
            return dict(lic, ref=ref, w=w, h=h, href="data:image/png;base64," + base64.b64encode(f.read_bytes()).decode()), None
    return None, f"no art '{name}' in {S['name']} ({base.relative_to(ENGINE_ROOT)})"


def refs_in(sources_text: list[str]) -> set[str]:
    """every quoted `set:name` literal whose set is an approved set (so arrays of refs work too), plus any
    reference passed to Loom.art.* whatever its set (an unapproved set is then reported, not dropped)"""
    known = set(sources())
    out = set()
    for src in sources_text:
        for m in REF_RE.finditer(src):
            if m.group(1) in known:
                out.add(f"{m.group(1)}:{m.group(2)}")
        for m in re.finditer(r"Loom\.art\.(?:place|shape)\([^;]*?" + REF_RE.pattern, src):
            out.add(f"{m.group(1)}:{m.group(2)}")
    return out


def embed(sources_text: list[str], lesson: bool = False) -> tuple[dict, list[str]]:
    art, errors = {}, []
    for ref in sorted(refs_in(sources_text)):
        a, e = resolve(ref, lesson)
        if e:
            errors.append(e)
        else:
            art[ref] = a
    return art, errors


def catalog() -> list[dict]:
    """every piece of art available now, with its set and licence (for docs and for search)"""
    out = []
    for sid, S in sources().items():
        if S.get("kind") == "iconify":
            for name in sorted((_iconify(S["path"]).get("icons") or {})):
                out.append({"ref": f"{sid}:{name}", "set": S["name"], "licence": S["licence"]})
        else:
            base = VENDOR / sid
            for f in sorted(base.glob("*")) if base.exists() else []:
                if f.suffix in (".svg", ".png"):
                    out.append({"ref": f"{sid}:{f.stem}", "set": S["name"], "licence": S["licence"]})
    return out


def main(argv=None) -> int:
    import argparse
    ap = argparse.ArgumentParser(description="search the approved vendor art")
    ap.add_argument("query", nargs="?", default="")
    ap.add_argument("--set")
    a = ap.parse_args(argv)
    C = [c for c in catalog() if (not a.set or c["ref"].startswith(a.set + ":")) and all(w in c["ref"] for w in a.query.split())]
    for c in C[:200]:
        print(f"{c['ref']:60s} {c['set']} ({c['licence']})")
    print(f"{len(C)} piece(s)" + (" (first 200 shown)" if len(C) > 200 else ""))
    by = {}
    for c in catalog():
        by[c["set"]] = by.get(c["set"], 0) + 1
    print("available: " + ", ".join(f"{k} {v}" for k, v in by.items()) if by else "no vendor art installed yet")
    return 0 if C or not a.query else 1


if __name__ == "__main__":
    import sys
    sys.exit(main())
