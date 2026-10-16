"""Set styles (packs/set_styles.json): how a place is drawn in each style, and each style's material palette.

A set's colours are material families (wall, floor, wood ... see `families` in the JSON), each with a base, a shade,
a highlight and a deep shade, plus four single colours (ink, light, shadow, haze). The bases are hand-chosen per
style; the other tones are derived here: a shade is the base multiplied toward the style's own shadow colour, a
highlight the base screened toward its light colour, so a style's shades share one temperature and are never just a
darker grey of their base. Every hex in a style is
distinct, so the intake (tools/asset_intake.py) and a later importer can tell each material and tone apart and
recolour a set by family.
"""
from __future__ import annotations

import colorsys
import json
from functools import lru_cache

from .util import ENGINE_ROOT, LoomError

SRC = ENGINE_ROOT / "packs" / "set_styles.json"
TONES = ("base", "shade", "hi", "deep")


@lru_cache(maxsize=1)
def data() -> dict:
    return json.loads(SRC.read_text(encoding="utf-8"))


def style(sid: str) -> dict:
    st = data()["styles"].get(sid)
    if not st:
        raise LoomError(f"no set style '{sid}' (have {', '.join(data()['styles'])})")
    return st


def _hx(h: str) -> tuple[float, float, float]:
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def _mix(a, b, t):
    return tuple(x + (y - x) * t for x, y in zip(a, b))


def _hex(rgb) -> str:
    return "#" + "".join(f"{round(min(1, max(0, v)) * 255):02X}" for v in rgb)


def _lum(rgb) -> float:
    r, g, b = rgb
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def shade_of(base: str, shadow: str, k: float) -> str:
    """the base in shadow: tinted by the style's shadow hue (the shadow colour brought to full brightness) and darkened
    in proportion, k = strength (0 = base). Proportional, so a dark material's shade stays near it and a light one's
    drops further, as real light does; tinted, so shades share the style's temperature instead of going grey."""
    b, s = _hx(base), _hx(shadow)
    top = max(s) or 1
    tint = tuple(x / top for x in s)
    m = _mix((1, 1, 1), tint, min(1.0, k * 0.9))
    dark = 1 - k * 0.5
    return _hex(tuple(x * y * dark for x, y in zip(b, m)))


def light_of(base: str, light: str, k: float) -> str:
    """the base in the key light: mixed toward the light colour, less for dark materials (a black chair in the sun
    is still a black chair)"""
    b, l = _hx(base), _hx(light)
    return _hex(_mix(b, l, k * (0.25 + 0.6 * _lum(b))))


def _lab(rgb):
    def lin(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (lin(c) for c in rgb)
    x, y, z = (0.4124 * r + 0.3576 * g + 0.1805 * b) / 0.95047, 0.2126 * r + 0.7152 * g + 0.0722 * b, (0.0193 * r + 0.1192 * g + 0.9505 * b) / 1.08883
    f = lambda t: t ** (1 / 3) if t > 0.008856 else 7.787 * t + 16 / 116
    return 116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))


def delta_e(a: str, b: str) -> float:
    """CIE76 colour difference between two hexes (about 2.3 is just noticeable; 8 reads clearly as a different tone)"""
    la, lb = _lab(_hx(a)), _lab(_hx(b))
    return sum((x - y) ** 2 for x, y in zip(la, lb)) ** 0.5


MIN_DE = 8.0          # a tone that cannot be told from its base is not a tone: shade, hi and deep each differ by this


def _strong(make, base: str, other: str, k: float) -> str:
    """raise k until the tone is at least MIN_DE from its base (a very light wall's sunlit tone otherwise vanishes)"""
    t = make(base, other, k)
    while delta_e(t, base) < MIN_DE and k < 1.0:
        k = min(1.0, k + 0.05)
        t = make(base, other, k)
    return t


def palette(sid: str) -> dict[str, dict[str, str]]:
    """{family: {base, shade, hi, deep}} for the families, {family: {base}} for the singles; all hexes distinct."""
    st, d = style(sid), data()
    rule, sh, li = st["derive"], st["bases"]["shadow"], st["bases"]["light"]
    out, seen = {}, set()

    def uniq(h: str) -> str:
        n = 0
        while h.upper() in seen:
            n += 1
            r, g, b = _hx(h)
            hh, l, s = colorsys.rgb_to_hls(r, g, b)
            l = min(0.97, max(0.03, l + (0.006 if n % 2 else -0.006) * n))
            h = "#" + "".join(f"{round(v * 255):02X}" for v in colorsys.hls_to_rgb(hh, l, s))
        seen.add(h.upper())
        return h.upper()

    for fam in d["families"]:
        base = st["bases"].get(fam)
        if not base:
            raise LoomError(f"set style {sid}: no base for '{fam}'")
        if fam in d["singles"]:
            out[fam] = {"base": uniq(base)}
            continue
        out[fam] = {"base": uniq(base),
                    "shade": uniq(_strong(shade_of, base, sh, rule["shade"])),
                    "hi": uniq(_strong(light_of, base, li, rule["hi"])),
                    "deep": uniq(_strong(shade_of, base, sh, rule["deep"]))}
    return out


def hexes(sid: str) -> dict[str, str]:
    """{hex: 'family.tone'} for one style"""
    return {v.upper(): f"{fam}.{t}" for fam, tones in palette(sid).items() for t, v in tones.items()}


def palette_text(sid: str) -> str:
    """the palette as the prompt states it: one line per family"""
    d = data()
    lines = []
    for fam, tones in palette(sid).items():
        what = d["families"][fam]
        if fam in d["singles"]:
            lines.append(f"  {fam:<9} {tones['base']}  ({what})")
        else:
            lines.append(f"  {fam:<9} base {tones['base']}  shade {tones['shade']}  hi {tones['hi']}  deep {tones['deep']}  ({what})")
    return "\n".join(lines)
