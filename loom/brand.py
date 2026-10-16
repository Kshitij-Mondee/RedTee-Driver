"""Brand on any style: an organisation's colours, fonts, logo and house rules, layered on top of ANY style pack.

The style keeps everything that is not brand (grammar, shapes, motion, type sizes); the brand swaps only the
colour tokens it names, the faces it names, and adds a logo layer. Deterministic: no model is involved.

    packs/brands/<id>/brand.json      the brand (edited in the Studio or by hand)
    packs/brands/<id>/logo.svg|png    optional logo
    packs/brands/<id>/fonts/*.woff2   optional uploaded faces

brand.json:
{
  "id": "acme", "name": "Acme Corp",
  "colors": {"primary": "#1F5FD6", "secondary": "#9A5B00", "tertiary": "#0F7A5A", "text": null, "background": null},
  "fonts":  {"display": {"family": "Inter", "weight": 700}, "body": {"family": "Inter", "weight": 400},
             "label": null},                       # family from the registry (fonts_registry()) or an uploaded file
  "logo":   {"file": "logo.svg", "placement": "top-right", "height": 64, "show": "always"},   # or "intro_outro"
  "rules":  {"captions": "on", "notes": "free text shown to creators"},
  "locks":  {"locked": false, "by": null, "at": null, "fields": ["colors", "fonts", "logo"]}
}

Colour roles -> style tokens: primary -> accent, secondary -> accent2, tertiary -> accent4, text -> ink,
background -> field (and field2 / surface2 are derived). A role left null keeps the style's own colour.
"""
from __future__ import annotations

import base64
import colorsys
import copy
import json
import re
from pathlib import Path

from .checks.style_lint import contrast, lint_style
from .util import ENGINE_ROOT, LoomError, read_json, write_json

BRANDS = ENGINE_ROOT / "packs" / "brands"
STYLES = ENGINE_ROOT / "packs" / "styles"
ROLE_TOKEN = {"primary": "accent", "secondary": "accent2", "tertiary": "accent4", "text": "ink", "background": "field"}
PLACEMENTS = ("top-right", "bottom-right", "bottom-left", "top-left")
HEX = re.compile(r"^#[0-9A-Fa-f]{6}$")
ID = re.compile(r"^[a-z0-9][a-z0-9-]{1,40}$")


# ------------------------------------------------------------------ files
def _maybe(p: Path):
    return read_json(p) if p.exists() else None


def brand_dir(bid: str) -> Path:
    if not ID.match(bid or ""):
        raise LoomError(f"brand id must be lowercase letters, digits and dashes: {bid!r}")
    return BRANDS / bid


def list_brands() -> list[dict]:
    out = []
    for d in sorted(BRANDS.iterdir()) if BRANDS.exists() else []:
        b = _maybe(d / "brand.json")
        if b:
            out.append(b)
    return out


def load_brand(bid: str) -> dict:
    b = _maybe(brand_dir(bid) / "brand.json")
    if not b:
        raise LoomError(f"unknown brand '{bid}' (looked in {brand_dir(bid)})")
    return b


def blank(bid: str, name: str) -> dict:
    return {"id": bid, "name": name or bid,
            "colors": {"primary": None, "secondary": None, "tertiary": None, "text": None, "background": None},
            "fonts": {"display": None, "body": None, "label": None},
            "logo": None, "rules": {"captions": None, "notes": ""},
            "locks": {"locked": False, "by": None, "at": None, "fields": ["colors", "fonts", "logo"]}}


def validate(b: dict) -> list[str]:
    E = []
    if not ID.match(b.get("id") or ""):
        E.append("id must be lowercase letters, digits and dashes")
    for role, v in (b.get("colors") or {}).items():
        if role not in ROLE_TOKEN:
            E.append(f"unknown colour role '{role}' (use {', '.join(ROLE_TOKEN)})")
        elif v is not None and not HEX.match(str(v)):
            E.append(f"colours.{role} must be #RRGGBB, got {v!r}")
    reg = fonts_registry()
    for role, f in (b.get("fonts") or {}).items():
        if role not in ("display", "body", "label", "mono"):
            E.append(f"unknown font role '{role}'")
        elif f:
            if f.get("file"):
                if not (brand_dir(b["id"]) / f["file"]).exists():
                    E.append(f"fonts.{role}: uploaded file {f['file']} is missing")
            elif f.get("family") not in reg:
                E.append(f"fonts.{role}: '{f.get('family')}' is not in the font registry (upload a .woff2 instead)")
    lg = b.get("logo")
    if lg:
        if lg.get("placement") not in PLACEMENTS:
            E.append(f"logo.placement must be one of {PLACEMENTS}")
        if not (brand_dir(b["id"]) / (lg.get("file") or "")).exists():
            E.append(f"logo file {lg.get('file')} is missing")
        if lg.get("file_dark") and not (brand_dir(b["id"]) / lg["file_dark"]).exists():
            E.append(f"dark-background logo {lg['file_dark']} is missing")
        # the logo lives in the band OUTSIDE the content safe box: 64px above it, 150px below it (captions band)
        hmax = 56 if str(lg.get("placement", "")).startswith("top") else 96
        if not (24 <= int(lg.get("height") or 0) <= hmax):
            E.append(f"logo.height must be 24-{hmax} px for a {lg.get('placement')} logo (it must stay outside the content area)")
        if lg.get("show") not in ("always", "intro_outro"):
            E.append("logo.show must be 'always' or 'intro_outro'")
    cap = (b.get("rules") or {}).get("captions")
    if cap not in (None, "on", "off"):
        E.append("rules.captions must be on, off or null")
    return E


def save_brand(b: dict, force_locked: bool = False) -> dict:
    """Validate and write. A locked brand refuses changes to its locked fields (unlock first)."""
    E = validate(b)
    if E:
        raise LoomError("brand is invalid:\n- " + "\n- ".join(E))
    d = brand_dir(b["id"]); d.mkdir(parents=True, exist_ok=True)
    old = _maybe(d / "brand.json")
    if old and (old.get("locks") or {}).get("locked") and not force_locked:
        for f in old["locks"].get("fields") or []:
            if json.dumps(old.get(f), sort_keys=True) != json.dumps(b.get(f), sort_keys=True):
                raise LoomError(f"brand '{b['id']}' is locked ({f} cannot change until it is unlocked)")
    write_json(d / "brand.json", b)
    return b


# ------------------------------------------------------------------ fonts
def fonts_registry() -> dict[str, dict]:
    """Families shipped with the engine (@fontsource packages) and the weights on disk."""
    out = {}
    nm = ENGINE_ROOT / "node_modules" / "@fontsource"
    for d in sorted(nm.iterdir()) if nm.exists() else []:
        ws = sorted({int(m.group(1)) for f in (d / "files").glob("*-latin-*-normal.woff2")
                     for m in [re.search(r"-latin-(\d+)-normal\.woff2$", f.name)] if m})
        if ws:
            fam = " ".join(w.capitalize() for w in d.name.split("-"))
            fam = {"Jetbrains Mono": "JetBrains Mono"}.get(fam, fam)
            out[fam] = {"pkg": f"@fontsource/{d.name}", "slug": d.name, "weights": ws}
    return out


def _face_for(family: str, weight: int, bid: str, spec: dict) -> dict:
    if spec.get("file"):
        return {"family": family, "weight": int(spec.get("weight") or weight), "path": str(brand_dir(bid) / spec["file"]),
                "file": f"brand-{bid}-{Path(spec['file']).name}"}
    reg = fonts_registry()[family]
    w = min(reg["weights"], key=lambda x: abs(x - weight))
    return {"family": family, "weight": w, "file": f"{reg['slug']}-latin-{w}-normal.woff2", "pkg": reg["pkg"]}


# ------------------------------------------------------------------ colour maths
def _hex(rgb) -> str:
    return "#" + "".join(f"{max(0, min(255, round(c * 255))):02X}" for c in rgb)


def _rgb(h: str):
    h = h.lstrip("#"); return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def shade(h: str, lightness: float) -> str:
    r, g, b = _rgb(h); hh, ll, ss = colorsys.rgb_to_hls(r, g, b)
    return _hex(colorsys.hls_to_rgb(hh, max(0.0, min(1.0, lightness)), ss))


def nearest_passing(color: str, against: list[str], need: float) -> str | None:
    """The shade of `color` closest in lightness that reaches `need`:1 against every colour in `against`."""
    r, g, b = _rgb(color); hh, l0, ss = colorsys.rgb_to_hls(r, g, b)
    best = None
    for step in range(1, 101):
        for l in (l0 - step / 100, l0 + step / 100):
            if 0 <= l <= 1:
                c = shade(color, l)
                if all(contrast(c, a) >= need for a in against):
                    return c
    return best


# ------------------------------------------------------------------ merge
def apply_brand(style: dict, brand: dict | None) -> dict:
    """The effective look: the style with the brand's colours, faces and rules applied."""
    if not brand:
        return style
    s = copy.deepcopy(style)
    P = s["palette"]
    for role, v in (brand.get("colors") or {}).items():
        if v:
            P[ROLE_TOKEN[role]] = v.upper()
    bg = (brand.get("colors") or {}).get("background")
    if bg:  # derive the neighbours of the field so cards and bands stay related to the new background
        r, g, b = _rgb(bg); _, l, _ = colorsys.rgb_to_hls(r, g, b)
        dark = l < 0.5
        P["field2"] = shade(bg, l + (0.04 if dark else -0.03))
        P["surface2"] = shade(bg, l + (0.06 if dark else -0.05))
    fonts = brand.get("fonts") or {}
    faces = list(s["fonts"].get("faces", []))
    for role in ("display", "body", "label"):
        spec = fonts.get(role)
        if not spec:
            continue
        fam = spec.get("family") or f"Brand {role.title()} ({brand['id']})"
        target = role if role != "label" else "brandlabel"
        weights = [int(spec.get("weight") or 0)] if spec.get("weight") else (s["fonts"].get(role if role != "label" else "body") or {}).get("weights", [400, 700])
        new_faces = [_face_for(fam, w, brand["id"], spec) for w in weights]
        s["fonts"][target] = {"family": fam, "weights": sorted({f["weight"] for f in new_faces})}
        faces += new_faces
        if role == "label":
            s["fonts"].setdefault("roles", {})
            s["fonts"]["roles"].update({"label": "brandlabel", "caption": "brandlabel"})
    seen, uniq = set(), []
    for f in faces:
        k = (f["family"], f["weight"])
        if k not in seen:
            seen.add(k); uniq.append(f)
    s["fonts"]["faces"] = uniq
    s["brand"] = {"id": brand["id"], "name": brand.get("name"), "rules": brand.get("rules") or {}}
    s["id"] = f"{style['id']}+{brand['id']}"
    return s


def _is_dark(hexcol: str) -> bool:
    r, g, b = _rgb(hexcol); return colorsys.rgb_to_hls(r, g, b)[1] < 0.5


def logo_payload(brand: dict | None, style: dict | None = None) -> dict | None:
    """The logo for this look. On a dark field the `file_dark` variant is used; without one, the logo sits on a
    small light plate so a dark wordmark can never vanish (the Harbor Labs preview on dark styles showed it)."""
    lg = (brand or {}).get("logo")
    if not lg:
        return None
    dark = bool(style) and _is_dark(style["palette"]["field"])
    use_dark = dark and lg.get("file_dark") and (brand_dir(brand["id"]) / lg["file_dark"]).exists()
    f = brand_dir(brand["id"]) / (lg["file_dark"] if use_dark else lg["file"])
    mime = "image/svg+xml" if f.suffix.lower() == ".svg" else "image/png"
    return {"src": f"data:{mime};base64," + base64.b64encode(f.read_bytes()).decode(), "placement": lg["placement"],
            "height": int(lg.get("height") or 56), "show": lg.get("show") or "always", "aspect": _aspect(f),
            "plate": bool(dark and not use_dark)}


def _aspect(f: Path) -> float:
    """Width / height of the logo file (SVG width/height or viewBox; PNG header), so layout can reserve its width."""
    try:
        if f.suffix.lower() == ".png":
            d = f.read_bytes()[16:24]
            return int.from_bytes(d[:4], "big") / max(1, int.from_bytes(d[4:], "big"))
        t = f.read_text(encoding="utf-8", errors="ignore")
        vb = re.search(r'viewBox="\s*[-\d.]+[ ,]+[-\d.]+[ ,]+([\d.]+)[ ,]+([\d.]+)', t)
        if vb:
            return float(vb.group(1)) / max(1e-6, float(vb.group(2)))
        w, h = re.search(r'\bwidth="([\d.]+)', t), re.search(r'\bheight="([\d.]+)', t)
        if w and h:
            return float(w.group(1)) / max(1e-6, float(h.group(1)))
    except Exception:  # noqa: BLE001
        pass
    return 3.0


# ------------------------------------------------------------------ lint with suggestions
_TOKEN_NAME = {"accent": "Primary", "accent2": "Secondary", "accent4": "Tertiary", "ink": "Text", "field": "Background",
               "surface": "card", "muted": "secondary text", "line": "line", "accent3": "the style's third accent",
               "pos": "positive", "neg": "negative", "surface2": "tinted card", "field2": "band"}


def _human(msg: str) -> str:
    """Lint messages in the words a brand owner uses (roles, not engine tokens)."""
    m = re.match(r"(\w+) on (\w+) = ([\d.]+):1 < ([\d.]+)", msg)
    if m:
        a, b = _TOKEN_NAME.get(m.group(1), m.group(1)), _TOKEN_NAME.get(m.group(2), m.group(2))
        return f"{a} on the {b.lower()} is too faint ({m.group(3)}:1, needs {m.group(4)}:1)"
    m = re.match(r"no readable text colour on '(\w+)' \(best ([\d.]+):1", msg)
    if m:
        return f"Text on the {_TOKEN_NAME.get(m.group(1), m.group(1))} colour is hard to read ({m.group(2)}:1, needs 4.5:1)"
    return msg


def lint_matrix(brand: dict) -> dict:
    """For every style: the merged look's contrast problems, each with a concrete suggested fix."""
    out = {}
    for p in sorted(STYLES.glob("*.json")):
        st = read_json(p)
        merged = apply_brand(st, brand)
        issues = []
        for msg in lint_style(merged):
            issue = {"msg": msg, "human": _human(msg), "fix": None}
            m = re.match(r"(\w+) on (\w+) = ([\d.]+):1 < ([\d.]+)", msg)
            role_of = {v: k for k, v in ROLE_TOKEN.items()}
            if m:
                fg, bg, _, need = m.group(1), m.group(2), m.group(3), float(m.group(4))
                tok = fg if fg in role_of and (brand.get("colors") or {}).get(role_of[fg]) else bg if bg in role_of and (brand.get("colors") or {}).get(role_of[bg]) else None
                if tok:
                    other = merged["palette"][bg if tok == fg else fg]
                    sug = nearest_passing(merged["palette"][tok], [other], need)
                    if sug:
                        issue["fix"] = {"role": role_of[tok], "from": merged["palette"][tok], "to": sug,
                                        "why": f"{fg} on {bg} needs {need}:1 in {st['id']}"}
            m2 = re.match(r"no readable text colour on '(\w+)'", msg)
            if m2 and m2.group(1) in role_of and (brand.get("colors") or {}).get(role_of[m2.group(1)]):
                tok = m2.group(1)
                P = merged["palette"]
                sug = None
                for cand in (P["ink"], P["field"], P.get("onAccent", "#FFFFFF")):
                    s2 = nearest_passing(P[tok], [cand], 4.5)
                    if s2 and (sug is None or abs(sum(_rgb(s2)) - sum(_rgb(P[tok]))) < abs(sum(_rgb(sug)) - sum(_rgb(P[tok])))):
                        sug = s2
                if sug:
                    issue["fix"] = {"role": role_of[tok], "from": P[tok], "to": sug, "why": f"text on {tok} needs 4.5:1 in {st['id']}"}
            issues.append(issue)
        out[st["id"]] = {"name": st.get("name"), "ok": not issues, "issues": issues, "reads_as": st.get("reads_as", "")}
    return out


# ------------------------------------------------------------------ preview + restyle
PREVIEW_TEMPLATES = ["title.card", "list.steps", "process.flow", "quiz.question", "compare.two", "definition"]


def preview_cases() -> dict[str, dict]:
    """One real props set per preview template, taken from the lessons (first use wins), so previews show
    real content at real lengths rather than invented sample text."""
    from .project import projects_root
    found = {}
    for d in sorted(projects_root().iterdir()):
        if d.name.startswith((".", "_")) or not (d / "plan/storyboard.json").exists():
            continue
        for sc in read_json(d / "plan/storyboard.json").get("scenes", []):
            t = sc.get("template")
            if sc.get("kind") == "template" and t in PREVIEW_TEMPLATES and t not in found:
                found[t] = {"label": f"{d.name}/{sc['beat']}", "params": sc.get("props") or {}}
    return found


def preview(bid: str, styles: list[str] | None = None, out_dir: Path | None = None, templates: list[str] | None = None) -> dict:
    """Render the brand on each style: one sheet per style (rows = templates). Returns {style: {sheet, errors}}."""
    from .library import render_sheet
    b = load_brand(bid)
    cases = preview_cases()
    tpls = [t for t in (templates or PREVIEW_TEMPLATES) if t in cases]
    styles = styles or sorted(p.stem for p in STYLES.glob("*.json"))
    od = out_dir or (brand_dir(bid) / "preview")
    res = {}
    for st in styles:
        errs, sheets = [], []
        for t in tpls:
            r = render_sheet(t, styles=[st], kind="template", cases=[cases[t]], sheet_name=f"{st}__{t.replace('.', '_')}", brand=b, out_dir=od)
            rr = r["styles"][st]
            errs += [f"{t}: {e.get('code')}: {e.get('msg')}" for e in rr["errors"]] + [f"{t}: {x}" for x in rr["console"]]
            errs += [f"{t}: sample text {lk['words']}" for lk in rr.get("leaks", [])]
            sheets.append(r["sheet"])
        res[st] = {"sheets": sheets, "errors": errs, "grid": _grid(sheets, od / f"{st}.jpg", st, b.get("name", bid))}
    prev = (_maybe(od / "preview.json") or {}).get("styles", {})   # previews of other styles are kept
    prev.update(res)
    write_json(od / "preview.json", {"brand": bid, "styles": prev})
    return res


def _grid(sheets: list[str], out: Path, style: str, brand_name: str) -> str | None:
    """One picture per style: the preview frames in a 3 x 2 grid with a caption strip."""
    from PIL import Image, ImageDraw
    ims = []
    for f in sheets:
        try:
            im = Image.open(f).convert("RGB")
            ims.append(im.crop((4, 26, 4 + 480, 26 + 270)) if im.height > 280 else im)
        except Exception:
            pass
    if not ims:
        return None
    cols = 3; rows = (len(ims) + cols - 1) // cols
    g = Image.new("RGB", (cols * 484 + 4, rows * 274 + 34), (24, 24, 28))
    ImageDraw.Draw(g).text((8, 10), f"{brand_name}  on  {style}", fill=(240, 220, 150))
    for i, im in enumerate(ims):
        g.paste(im.resize((480, 270)), (4 + (i % cols) * 484, 30 + (i // cols) * 274))
    g.save(out, quality=86)
    return str(out)


def restyle(pid: str, style: str | None = None, brand: str | None = None, fork_as: str | None = None) -> dict:
    """Switch a lesson's look (style and/or brand) and re-prove it: recompose, run the measured check, and list
    failing beats as tweak tasks. No model call is made for beats that pass."""
    import shutil as _sh
    from .project import Project, projects_root
    from . import flow
    from .util import which
    src = Project.open(pid)
    if fork_as:
        dst = projects_root() / fork_as
        if dst.exists():
            raise LoomError(f"project '{fork_as}' already exists")
        _sh.copytree(src.root, dst, ignore=_sh.ignore_patterns("renders", "build", "qa"))
        cfg = read_json(dst / "project.json"); cfg["id"] = fork_as; write_json(dst / "project.json", cfg)
        src = Project.open(fork_as)
    p = src
    sbp = p.path("plan/storyboard.json"); sb = read_json(sbp)
    before = {"style": sb.get("style"), "brand": sb.get("brand")}
    if style:
        if not (STYLES / f"{style}.json").exists():
            raise LoomError(f"unknown style '{style}'")
        sb["style"] = style
    if brand is not None:
        if brand:
            load_brand(brand)
            sb["brand"] = brand
        else:
            sb.pop("brand", None)
    write_json(sbp, sb)
    E, _ = flow.accept(p, "storyboard")
    if E:
        raise LoomError("storyboard no longer passes its gate:\n- " + "\n- ".join(E[:10]))
    # Manim beats carry the palette baked into their clip: they are re-made in the new look, as DRAFTS for this
    # preview (6 fps, half size) unless the store already holds a clip for it; check and render make them
    # final (D-37..D-39)
    manim_beats = [s["beat"] for s in sb["scenes"] if s.get("kind") == "manim"]
    manim_ok = True
    try:
        import manim  # noqa: F401
    except Exception:
        manim_ok = False
    # narration depends on the script and the joins, never on the look: when the joins are unchanged the
    # existing audio is kept (re-synthesising would be slow and could shift every cue by a few ms)
    old_style = read_json(STYLES / f"{before['style']}.json") if before.get("style") and (STYLES / f"{before['style']}.json").exists() else {}
    new_style = read_json(STYLES / f"{sb['style']}.json")
    joins_same = old_style.get("join_default", "camera") == new_style.get("join_default", "camera")
    if joins_same and p.path("audio/timings.json").exists() and p.path("audio/narration.wav").exists():
        flow.mark_done(p, "narrate", passed=True)   # the look never changes narration (D-36)
    else:
        flow.run_code(p, "narrate")
    try:
        flow.run_code(p, "compose", manim_quality="draft")
    except Exception as e:
        raise LoomError(f"compose failed after restyle: {e}")
    manim_report = getattr(p, "_manim_report", None) or []
    # the QUICK check (probe + measured layout + text audit + lints): the full check still runs before a render
    from .qa import check as _check, snapshot_sheet
    rep = _check(p, sheets=False, run_hf=False)
    tm = read_json(p.path("audio/timings.json"))
    beats = tm["beats"]
    picks = [beats[round(i * (len(beats) - 1) / 5)] for i in range(6)] if len(beats) >= 6 else beats
    frames = snapshot_sheet(p, [round(max(b["speech_start"], b["speech_end"] - 0.15), 2) for b in picks])
    failing = {}
    for e in rep.get("errors", []):
        m = re.search(r"\b(b\d{2})\b", e)
        failing.setdefault(m.group(1) if m else "lesson", []).append(e)
    tasks = []
    from .agent.tweak import tweak
    for beat, errs in sorted(failing.items()):
        if beat == "lesson":
            continue
        tweak(p, f"After a restyle to style '{sb.get('style')}'" + (f" with brand '{sb.get('brand')}'" if sb.get("brand") else "") +
              ", check reports:\n- " + "\n- ".join(errs[:6]) + "\nFix the geometry so the text fits in this style (measure, then draw: kit.fit). Change only numbers or box sizes.", beat=beat)
        tasks.append(sorted(p.path("tasks").glob("tweak-*.md"))[-1].name)
    log = p.path("RUN_LOG.md")
    with open(log, "a", encoding="utf-8") as f:
        f.write(f"\n## Restyle ({before} -> style={sb.get('style')}, brand={sb.get('brand')})\n"
                f"- check: {len(rep.get('errors', []))} error(s); failing beats: {', '.join(k for k in failing if k != 'lesson') or 'none'}\n"
                + ("- Manim: " + ", ".join(f"{m['beat']} {m['how']} ({m['quality']}, {m['seconds']}s)" for m in manim_report)
                   + ("; drafts become full quality at check/render" if any(m["quality"] == "draft" for m in manim_report) else "") + "\n" if manim_report else "")
                + (f"- tweak tasks written: {', '.join(tasks)}\n" if tasks else ""))
    return {"project": p.id, "frames": frames, "before": before, "after": {"style": sb.get("style"), "brand": sb.get("brand")},
            "errors": rep.get("errors", []), "failing_beats": sorted(k for k in failing if k != "lesson"), "tweak_tasks": tasks,
            "manim_beats": manim_beats, "manim_available": manim_ok, "manim": manim_report}
