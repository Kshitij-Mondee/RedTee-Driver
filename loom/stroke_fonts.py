"""Single-stroke fonts for engines that write (D-179): hersheytext's SVG fonts (EMS and Hershey, OFL and MIT; npm,
approved 2026-10-15) as compact glyph strokes the runtime can draw.

    {"name", "upm", "cap", "adv", "glyphs": {"A": {"a": advance, "s": [[x, y, x, y, ...], ...]}}}   (font units, y up)

`cap` is the drawn height of "H" (the files' own cap-height can be far off: EMS Readability says 500 and draws 674).
Compose embeds the fonts a lesson's style engine names (manifest.assets.strokeFonts); the lab does the same.
"""
from __future__ import annotations

import re
from functools import lru_cache

from .util import ENGINE_ROOT, LoomError

FONT_DIR = ENGINE_ROOT / "node_modules" / "hersheytext" / "svg_fonts"
_TOK = re.compile(r"[MLCQHVZmlcqhvz]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?")
_ATTR = re.compile(r'([\w:-]+)="([^"]*)"')


def _strokes(d: str) -> list[list[float]]:
    """an SVG glyph path as polylines: M, L, H, V, C and Q (absolute or relative); curves flattened to 8 segments"""
    toks, out, cur = _TOK.findall(d or ""), [], []
    x = y = 0.0
    i, cmd = 0, None
    while i < len(toks):
        if re.fullmatch(r"[A-Za-z]", toks[i]):
            cmd = toks[i]; i += 1
            if cmd in "Zz":
                if cur and len(cur) >= 4:
                    cur += cur[:2]
                continue
        if cmd is None:
            raise LoomError(f"stroke font: a path starts without a command: {d[:40]}")
        rel = cmd.islower(); C = cmd.upper()
        if C == "M":
            nx, ny = float(toks[i]), float(toks[i + 1]); i += 2
            x, y = (x + nx, y + ny) if rel else (nx, ny)
            if len(cur) >= 4:
                out.append(cur)
            cur = [x, y]
            cmd = "l" if rel else "L"        # coordinates after a moveto are linetos
        elif C in "LHV":
            if C == "L":
                nx, ny = float(toks[i]), float(toks[i + 1]); i += 2
                x, y = (x + nx, y + ny) if rel else (nx, ny)
            elif C == "H":
                v = float(toks[i]); i += 1; x = x + v if rel else v
            else:
                v = float(toks[i]); i += 1; y = y + v if rel else v
            cur += [x, y]
        elif C in "CQ":
            k = 6 if C == "C" else 4
            v = [float(t) for t in toks[i:i + k]]; i += k
            if rel:
                v = [v[j] + (x if j % 2 == 0 else y) for j in range(k)]
            pts = [(x, y)] + [(v[j], v[j + 1]) for j in range(0, k, 2)]
            for s_ in range(1, 9):
                u = s_ / 8
                if C == "C":
                    (x0, y0), (x1, y1), (x2, y2), (x3, y3) = pts
                    bx = (1 - u) ** 3 * x0 + 3 * (1 - u) ** 2 * u * x1 + 3 * (1 - u) * u * u * x2 + u ** 3 * x3
                    by = (1 - u) ** 3 * y0 + 3 * (1 - u) ** 2 * u * y1 + 3 * (1 - u) * u * u * y2 + u ** 3 * y3
                else:
                    (x0, y0), (x1, y1), (x2, y2) = pts
                    bx = (1 - u) ** 2 * x0 + 2 * (1 - u) * u * x1 + u * u * x2
                    by = (1 - u) ** 2 * y0 + 2 * (1 - u) * u * y1 + u * u * y2
                cur += [bx, by]
            x, y = pts[-1]
        else:
            raise LoomError(f"stroke font: unsupported path command {cmd}")
    if len(cur) >= 4:
        out.append(cur)
    return [[round(v, 1) for v in st] for st in out]


@lru_cache(maxsize=8)
def load(name: str = "EMSTech") -> dict:
    """the font's glyphs as strokes (read with patterns, not an XML parser: a fixed, local npm file)"""
    f = FONT_DIR / f"{name}.svg"
    if not f.exists():
        raise LoomError(f"stroke font {name} not found in {FONT_DIR} (npm install in the engine folder)")
    txt = f.read_text(encoding="utf-8")
    font = dict(_ATTR.findall(re.search(r"<font\s[^>]*>", txt).group(0)))
    face = dict(_ATTR.findall(re.search(r"<font-face\s[^>]*>", txt, re.S).group(0)))
    adv = float(font.get("horiz-adv-x") or 500)
    glyphs = {}
    for m in re.finditer(r"<glyph\s([^>]*?)/?>", txt, re.S):
        a = dict(_ATTR.findall(m.group(1)))
        u = a.get("unicode")
        if u is None:
            continue
        u = re.sub(r"&#x([0-9a-fA-F]+);", lambda h: chr(int(h.group(1), 16)), u).replace("&quot;", '"').replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&apos;", "'")
        if len(u) != 1:
            continue
        glyphs[u] = {"a": round(float(a.get("horiz-adv-x") or adv), 1), "s": _strokes(a.get("d") or "")}
    H = glyphs.get("H")
    cap = max((y for st in H["s"] for y in st[1::2]), default=None) if H else None
    return {"name": name, "upm": float(face.get("units-per-em") or 1000), "cap": cap or float(face.get("cap-height") or 700),
            "adv": adv, "glyphs": glyphs}


ENGINE_FONTS = {"whiteboard": ["EMSTech"], "blueprint": ["HersheySans1"]}   # blueprint: single-stroke technical lettering (2026-10-16)


def for_style(style_id: str | None) -> dict:
    """the stroke fonts a style's engine writes with ({} for a style without one)"""
    return {n: load(n) for n in ENGINE_FONTS.get(style_id or "", [])}
