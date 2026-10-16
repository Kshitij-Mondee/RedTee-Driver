"""loom_skia: the contract between Loom and a Skia scene (D-53).

A Skia scene draws ONE frame as a pure function of time, with the full Skia API (runtime shaders in SkSL,
image filters and blur, path effects, gradients, blend modes, text shaping), for the hero moments SVG in a
browser cannot reach. The bridge renders every frame to a transparent clip that the camera carries like a
Manim clip, and stores it by what the scene READ (same store and rules as Manim, D-37/D-38).

    from loom_skia import *
    CUES = ["the alert fired"]
    def frame(c, t):                      # c: skia.Canvas already cleared to transparent; t: seconds
        k = ease_out(progress(t, ctx.cue("the alert fired"), 0.6))
        c.drawCircle(W / 2, H / 2, 200 * k, paint("accent"))

- ctx.cue("words") -> seconds from clip start at which those words are spoken (string LITERALS, or CUES)
- ctx.params, ctx.duration; W, H = the clip size in design pixels (draw in these; the bridge scales drafts)
- C.<token> -> a skia colour (int) from the style (+ brand); paint(token, alpha, **kw) -> skia.Paint
- font(role, size=None, bold=True) -> skia.Font in the style's face for that role
- ease_out / ease_in_out / spring(bounce) / progress(t, t0, dur) / lerp / clamp: the same motion laws
- NEVER a fixed colour (skia.ColorWHITE, skia.Color(255, 0, 0), 0xFFFF0000): the scenes gate refuses them.
  Every read of C and ctx.fonts is recorded, so the clip is reused whenever those values are unchanged.
"""
from __future__ import annotations

import atexit
import json
import math
import os

import skia  # noqa: F401  (re-exported for the scene)

_CTX_PATH = os.environ.get("LOOM_SKIA_CTX")
_raw = json.load(open(_CTX_PATH, encoding="utf-8")) if _CTX_PATH and os.path.exists(_CTX_PATH) else {"palette": {}, "cues": {}, "params": {}, "duration": 5, "fonts": {}, "size": [1600, 900]}
_READS = {"palette": {}, "fonts": {}, "raw": False}


def _write_reads():
    out = os.environ.get("LOOM_SKIA_READS")
    if out:
        with open(out, "w", encoding="utf-8") as f:
            json.dump(_READS, f, sort_keys=True)


atexit.register(_write_reads)
W, H = int(_raw.get("size", [1600, 900])[0]), int(_raw.get("size", [1600, 900])[1])


def _hex(v, alpha=1.0):
    h = str(v).lstrip("#")
    r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
    return skia.ColorSetARGB(int(round(255 * max(0.0, min(1.0, alpha)))), r, g, b)


class _Palette:
    def __getattr__(self, k):
        if k.startswith("__"):
            raise AttributeError(k)
        v = _raw.get("palette", {}).get(k)
        _READS["palette"][k] = v
        if v is None:
            raise AttributeError(f"style token '{k}' not in palette")
        return _hex(v)

    def alpha(self, k, a):
        """the token with an alpha, e.g. C.alpha("accent", 0.4)"""
        getattr(self, k)
        return _hex(_raw["palette"][k], a)

    def rgb(self, k):
        """the token as (r, g, b) floats 0..1, for SkSL uniforms"""
        getattr(self, k)
        h = _raw["palette"][k].lstrip("#")
        return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


C = _Palette()


class _Fonts(dict):
    def get(self, k, default=None):
        _READS["fonts"][k] = dict.get(self, k)
        return dict.get(self, k, default)

    def __getitem__(self, k):
        _READS["fonts"][k] = dict.get(self, k)
        return dict.__getitem__(self, k)


class _Ctx:
    def __init__(self, raw):
        self._raw = raw
        self.params = raw.get("params", {})
        self.duration = float(raw.get("duration", 5))
        self.cues = raw.get("cues", {})
        self.fonts = _Fonts(raw.get("fonts", {}))
        self.speech = raw.get("speech", [0, self.duration])

    @property
    def raw(self):
        _READS["raw"] = True
        return self._raw

    def cue(self, anchor):
        if anchor not in self.cues:
            raise KeyError(f"cue '{anchor}' was not resolved for this Skia scene (it must be a word spoken in the beat)")
        return float(self.cues[anchor])


ctx = _Ctx(_raw)

_TYPEFACES = {}


def _typeface(family, bold):
    key = (family, bold)
    if key not in _TYPEFACES:
        tf = None
        for f in _raw.get("font_files", []):
            try:
                cand = skia.Typeface.MakeFromFile(f)
            except Exception:  # noqa: BLE001
                cand = None
            if cand is not None and cand.getFamilyName() == family:
                w = cand.fontStyle().weight()
                if tf is None or (bold and w >= 600) or (not bold and w < 600):
                    tf = cand
        _TYPEFACES[key] = tf or skia.Typeface(family, skia.FontStyle.Bold() if bold else skia.FontStyle.Normal())
    return _TYPEFACES[key]


_SIZES = {"display": 140, "hero": 120, "title": 84, "lead": 44, "body": 36, "label": 30, "caption": 24}


def font(role="body", size=None, bold=True):
    fam = ctx.fonts.get("display" if role in ("display", "hero", "title") else "body", "Sans")
    f = skia.Font(_typeface(fam, bold), size or _SIZES.get(role, 36))
    f.setEdging(skia.Font.Edging.kAntiAlias)
    f.setSubpixel(True)
    return f


def paint(token, alpha=1.0, **kw):
    p = skia.Paint(AntiAlias=True, **kw)
    p.setColor(C.alpha(token, alpha) if alpha != 1.0 else getattr(C, token))
    return p


# ---- the motion laws, as plain functions of time -------------------------------------------------
def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def lerp(a, b, k):
    return a + (b - a) * k


def progress(t, t0, dur):
    return clamp((t - t0) / max(1e-6, dur))


def ease_out(x):          # entrances decelerate (the crisp entrance, cubic-bezier(0.16, 1, 0.3, 1) family)
    return 1 - (1 - clamp(x)) ** 4


def ease_in(x):           # exits accelerate
    return clamp(x) ** 3


def ease_in_out(x):       # A to B moves
    x = clamp(x)
    return 4 * x ** 3 if x < 0.5 else 1 - (-2 * x + 2) ** 3 / 2


def spring(x, bounce=0.0):
    """closed-form spring over normalised time, exact at 0 and 1 (same curve as Loom.spring)"""
    x = clamp(x)
    z = max(0.05, 1 - bounce); w = math.log(1000) / z
    if z >= 1:
        f = lambda p: 1 - math.exp(-w * p) * (1 + w * p)
    else:
        wd = w * math.sqrt(1 - z * z)
        f = lambda p: 1 - math.exp(-z * w * p) * (math.cos(wd * p) + (z * w / wd) * math.sin(wd * p))
    return f(x) + (1 - f(1)) * x


_KEEP = []   # objects Skia must outlive the draw call (pybind temporaries freed early segfault, L-82)


def backdrop_blur(c, rect, sigma=24):
    """frosted glass: blur what is already drawn behind `rect`. Call c.restore() when the glass is done."""
    bd = skia.ImageFilters.Blur(sigma, sigma, skia.TileMode.kClamp, None); pp = skia.Paint(); r = skia.Rect(rect.left(), rect.top(), rect.right(), rect.bottom())
    _KEEP.extend([bd, pp, r])
    c.saveLayer(skia.Canvas.SaveLayerRec(r, pp, bd, 0))


def _end_frame():
    _KEEP.clear()


def shader(sksl, **uniforms):
    """compile SkSL once (cached) and return a skia shader with these float uniforms"""
    import numpy as np
    eff = _SHADERS.get(sksl)
    if eff is None:
        eff = _SHADERS[sksl] = skia.RuntimeEffect.MakeForShader(sksl)
        if eff is None:
            raise ValueError("SkSL did not compile")
    vals = []
    for u in eff.uniforms():
        v = uniforms[u.name]
        vals += list(v) if isinstance(v, (tuple, list)) else [v]
    return eff.makeShader(skia.Data.MakeWithCopy(np.array(vals, dtype=np.float32).tobytes()))


_SHADERS = {}
