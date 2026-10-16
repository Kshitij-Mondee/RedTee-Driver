"""Style-pack lint: every colour pair a template actually uses for TEXT is computed, not eyeballed."""
from __future__ import annotations

from ..util import ENGINE_ROOT, read_json

REQUIRED = ["field", "field2", "surface", "surface2", "ink", "muted", "line", "accent", "accent2", "accent3", "accent4", "pos", "neg", "shadow"]


def _lum(h):
    h = h.lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    f = lambda v: v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def contrast(a, b):
    la, lb = _lum(a), _lum(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)


def vignette_dark(pack: dict, colour: str, x: float = 96, y: float = 44) -> str:
    """`colour` under the pack's vignette at frame point (x, y), as runtime/fx.js paints it: black over at alpha
    vignette x smoothstep(0.35, 1.05, 1.25 x the distance from the frame centre in frame units). (96, 44) is where the
    section label starts (runtime/overlay.js Loom.chrome)."""
    import math
    v = float((pack.get("fx") or {}).get("vignette") or 0)
    d = math.hypot(x / 1920 - 0.5, y / 1080 - 0.5) * 1.25
    k = min(1.0, max(0.0, (d - 0.35) / 0.7))
    a = v * k * k * (3 - 2 * k)
    h = colour.lstrip("#")
    return "#" + "".join(f"{round(int(h[i:i + 2], 16) * (1 - a)):02x}" for i in (0, 2, 4))


def pill_colour(pack: dict) -> str:
    """The caption pill as the viewer sees it: its rgba composited over the pack's field (runtime/overlay.js does the
    same sum)."""
    import re
    cap = pack.get("captions") or {}
    P = pack["palette"]
    bg = str(cap.get("bg") or "rgba(0,0,0,.7)").strip()
    if bg.startswith("#"):
        return bg
    m = re.match(r"rgba?\(([^)]+)\)", bg)
    v = [float(x) for x in re.split(r"[\s,/]+", m.group(1)) if x] if m else [0, 0, 0, 0.7]
    a = v[3] if len(v) > 3 else 1.0
    f = P["field"].lstrip("#")
    fr = [int(f[i:i + 2], 16) for i in (0, 2, 4)]
    return "#" + "".join(f"{round(a * v[i] + (1 - a) * fr[i]):02x}" for i in range(3))


def caption_ratios(pack: dict) -> dict:
    """{pill, active, fg, active_ratio, fg_ratio}: the caption's active word and its other words against the pill."""
    P = pack["palette"]
    cap = pack.get("captions") or {}
    tok = lambda t: P.get(t, t)   # noqa: E731
    pl = pill_colour(pack)
    act, fg = tok(cap.get("active") or "accent2"), tok(cap.get("fg") or "ink")
    return {"pill": pl, "active": act, "fg": fg, "active_ratio": contrast(act, pl), "fg_ratio": contrast(fg, pl)}


def best_on(P, fill):
    return max(contrast(P[fill], P[t]) for t in ("ink", "field", "onAccent") if t in P)


LOOK_FAMILIES = ("illustrated", "editorial", "technical")
TONE_KEYS = ("brightness", "saturation", "dark_share", "light_share", "warm", "cool", "accent_shots")


def lint_family(pack: dict) -> list[str]:
    """D-112: every pack says which look family it is, because the TED-Ed learnings that are specific to cartoon and
    cinematic films (characters, figure style, hand-made timing, cartoon joins, TED-Ed tone numbers) apply only to
    `illustrated` packs."""
    E = []
    fam = pack.get("look_family")
    if fam not in LOOK_FAMILIES:
        E.append(f"look_family {fam!r} must be one of {', '.join(LOOK_FAMILIES)} (D-112)")
    tr = pack.get("tone_reference")
    if tr is not None:
        if fam != "illustrated":
            E.append("tone_reference is measured on TED-Ed (cartoon and cinematic films): only an illustrated pack may carry it")
        for k in TONE_KEYS:
            v = tr.get(k)
            if not isinstance(v, (int, float)) or not 0 <= v <= 1:
                E.append(f"tone_reference.{k} must be a number from 0 to 1 (got {v!r})")
    return E


def lint_style(pack: dict) -> list[str]:
    P = pack["palette"]; E = lint_family(pack)
    missing = [f"palette missing '{k}'" for k in REQUIRED if k not in P]
    if missing:
        return E + missing
    sketch = pack["shape"].get("shading") in ("sketch", "line")   # fills are outlines: text sits on the field
    pairs = [("ink", "field", 7.0, "body text"), ("ink", "surface", 4.5, "text on cards"), ("muted", "field", 4.5, "secondary text"),
             ("muted", "surface", 3.0, "labels on cards"), ("accent2", "field", 3.0, "large accent text (terms, values)"),
             ("accent", "field", 3.0, "large accent text"), ("line", "field", 3.0, "connectors/axes")]
    for fg, bg, need, what in pairs:
        c = contrast(P[fg], P[bg])
        if c < need:
            E.append(f"{fg} on {bg} = {c:.2f}:1 < {need} ({what})")
    if not sketch:
        for fill in ("accent", "accent2", "accent3", "accent4", "pos", "neg", "surface2"):
            c = best_on(P, fill)
            if c < 4.5:
                E.append(f"no readable text colour on '{fill}' (best {c:.2f}:1 < 4.5)")
    # captions (RC20, 2026-10-07): the active word sat at 1.7 to 3.7:1 on the dark pill in seven light packs (accent2
    # on rgba ink); the lint checked tokens on the field and never the pill
    if pack.get("captions"):
        cr = caption_ratios(pack)
        if cr["active_ratio"] < 4.5:
            E.append(f"captions.active {pack['captions'].get('active')} ({cr['active']}) on the caption pill {cr['pill']} = "
                     f"{cr['active_ratio']:.2f}:1 < 4.5 (the spoken word must read on the pill)")
        if cr["fg_ratio"] < 7.0:
            E.append(f"captions.fg {pack['captions'].get('fg')} ({cr['fg']}) on the caption pill {cr['pill']} = {cr['fg_ratio']:.2f}:1 < 7 (caption text)")
    fx = pack.get("fx") or {}
    # the section label in the top-left corner, where the vignette is darkest (D-154: story-cartoon's muted eyebrow read
    # 2.7:1 there while it passed on the plain field). The vignette darkens the field only (vignette_under) or the label too.
    if float(fx.get("vignette") or 0) > 0:
        tok = (pack.get("roles") or {}).get("section_label") or "muted"
        dark = vignette_dark(pack, P["field"])
        fg = P[tok] if fx.get("vignette_under") else vignette_dark(pack, P[tok])
        c = contrast(fg, dark)
        if c < 3.0:
            E.append(f"the section label ({tok}) in the top-left corner = {c:.2f}:1 on the field darkened by the vignette "
                     f"({dark}) < 3.0: set roles.section_label to a darker token, or a lighter vignette")
    # D-100 (L-173): per-pixel grain reads as grit once H.264 has compressed a 1080p MP4. Kshitij saw it on every
    # dark frame at 0.06. A pack's DEFAULT stays near-off; a lesson may still choose a film finish (storyboard fx).
    if float(fx.get("grain") or 0) > 0.015:
        E.append(f"fx.grain {fx.get('grain')} > 0.015 by default: it reads as grit after compression (set it per lesson instead)")
    if float(fx.get("paper") or 0) > 0.08:
        E.append(f"fx.paper {fx.get('paper')} > 0.08 by default: the texture dirties every object")
    for role, rng in pack["type"].items():
        floor = {"body": 28, "label": 24, "caption": 20}.get(role)
        if floor and rng[0] < floor:
            E.append(f"type.{role} floor {rng[0]}px is below {floor}px")
    return E


def lint_all() -> dict[str, list[str]]:
    return {p.stem: lint_style(read_json(p)) for p in sorted((ENGINE_ROOT / "packs/styles").glob("*.json"))}
