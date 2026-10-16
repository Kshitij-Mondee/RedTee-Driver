"""The style system (WS6, 2026-10-08): what a pack now says, the runtime does; what a pack does not say, it draws as
before. Each test builds a small lesson page on the REAL runtime (tests/suites/runtime_film_defects.py `_lesson`; the
env LOOM_TEST_RUNTIME points it at another runtime, which is how each test was run red on the runtime before WS6) and
reads the DOM, the fx canvases or the Python helpers.

  untouched packs   a pack without roles and materials draws byte-identical SVG to the runtime before WS6 (hashes
                    recorded from it: style_system_golden.json)
  materials         materials.wood paints the desk; roles paint their call sites (kicker, link, button, chat bubble)
  weights           no synthetic bold: every drawn weight is a weight the pack's family loaded, in every pack
  lab --file        a scene file's @lab cues and words resolve; an unknown word is a named warning
  guides            context_check compares each guide's palette table with its pack (a changed hex is caught)
  fx                fx.spotlight strength and tint reach the moment layer; fx.vignette_under puts the vignette below
                    the world
  characters        characters.bottom colours a rig's trousers; shape.contact_shadow puts a shadow under a figure
  motion            a second travel of one element does not jump it at load; m.draw draws outlines first, keeps each
                    path's own opacity and a dashed line's dashes
  shapes            glow discs are one gradient (no bands), the burst default stays in the field family; depth ids are
                    unique; sketch arrows are open strokes and a sketch rect keeps its radius
  templates         document.page paper variant; the counter keeps tabular digits
  pipeline          the storyboard and scene authors read the style's guide; get_style_pack returns it

The browser tests skip by name without a Chrome.
"""
from __future__ import annotations

import copy
import hashlib
import importlib.util
import json
import os
import re
import shutil
import sys
import tempfile
from pathlib import Path

ENGINE = Path(__file__).resolve().parents[2]
if str(ENGINE) not in sys.path:
    sys.path.insert(0, str(ENGINE))
GOLDEN = Path(__file__).with_name("style_system_golden.json")
PACKS = ("corporate-clean", "story-cartoon", "glow-flat", "cinematic-noir", "whiteboard", "blueprint", "isometric", "hologram", "screencast")


def _rt():
    spec = importlib.util.spec_from_file_location("rtfd_helpers_for_style", ENGINE / "tests" / "suites" / "runtime_film_defects.py")
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def _pack(style: str, strip: bool = False, **set_) -> dict:
    """a pack dict; strip=True removes every key WS6 added (an untouched pack); set_ merges top-level groups"""
    from loom.compose import load_style
    p = copy.deepcopy(load_style(style))
    if strip:
        for k in ("roles", "materials", "guide"):
            p.pop(k, None)
        for grp, keys in (("fx", ("spotlight", "vignette_under")), ("characters", ("bottom", "white")), ("shape", ("gloss_toward", "contact_shadow"))):
            for k in keys:
                (p.get(grp) or {}).pop(k, None)
        ((p.get("templates") or {}).get("document.page") or {}).pop("variant", None)
    for grp, val in set_.items():
        if isinstance(val, dict) and isinstance(p.get(grp), dict):
            p[grp] = {**p[grp], **val}
        else:
            p[grp] = val
    return p


def _lab(scene: str) -> tuple[str, float]:
    src = (ENGINE / "scenes_examples" / "lab" / f"{scene}.js").read_text(encoding="utf-8")
    return src, float(json.loads(re.match(r"// @lab (\{.*\})", src).group(1)).get("dur") or 8)


# ------------------------------------------------------------------ untouched packs: byte-identical to before
# pack and lab scene pairs that reach the role and material call sites (lab_places: office desk wood, meeting chairs,
# warehouse shelving, a rig's trousers; lab_tpl_definition: the kicker, the term, its rule and icon; lab_story_set: the
# desk screen). Measured identical on the runtime before WS6 and today's (2026-10-08). Left out, on purpose: whiteboard
# (its sketch paths now carry data-set and round their corners, guide s15), story-cartoon lab_story_set (Patrick Hand
# loads 400 only, so the drawn weight is no longer a fake 700), glow-flat lab_props_people (one gradient disc for the
# stepped rings) and lab_ui_artefacts (words measured at the weight they are drawn in).
_GOLDEN_SET = [("corporate-clean", "lab_places"), ("corporate-clean", "lab_tpl_definition"), ("corporate-clean", "lab_story_set"),
               ("cinematic-noir", "lab_places"), ("cinematic-noir", "lab_tpl_definition"), ("cinematic-noir", "lab_story_set"),
               ("glow-flat", "lab_places"), ("glow-flat", "lab_tpl_definition"), ("glow-flat", "lab_story_set"),
               ("story-cartoon", "lab_places"), ("story-cartoon", "lab_tpl_definition")]
_WORLD = r"""function () { const w = document.getElementById('lm-world');
  return { html: w ? w.outerHTML : '', errs: Loom.report.errors.filter((e) => e.code !== 'cue_unresolved').map((e) => e.code + ': ' + String(e.msg).slice(0, 140)),
           els: Loom.report.elements.length }; }"""


def _world_hash(rt, style: str, scene: str) -> dict:
    src, dur = _lab(scene)
    page = rt._lesson(src, [{"kind": "bespoke", "scene": scene}], rt._ONE, 1, dur=dur, style=_pack(style, strip=True), templates=True)
    v = rt._run(page, _WORLD, [3.0])["samples"][0]["v"]
    # GSAP's origin bookkeeping is left out; the drawing is compared whole. The data-svg-origin memo is written only
    # when GSAP measures an origin, so it names the LAST tween measured (on the runtime these hashes came from it also
    # raced the ticker: 318.06 or 317.67 on one rig group, L-270, L-289). Since boot measures every origin up front
    # (Loom.settleOrigins), groups whose exit lies past 3.0 s also carry GSAP's inline "transform-origin: 0px 0px",
    # the SVG default: the 11 pairs' screenshots at 3.0 s were identical with and without it (2026-10-08)
    html = re.sub(r' data-svg-origin="[^"]*"', "", v["html"])
    html = html.replace(" transform-origin: 0px 0px;", "")
    return {"sha256": hashlib.sha256(html.encode("utf-8")).hexdigest(), "bytes": len(html), "els": v["els"], "errs": v["errs"]}


def record_golden() -> dict:
    """LOOM_TEST_RUNTIME=<the runtime before a change> py -c "...record_golden()": the hashes the test compares with"""
    rt = _rt()
    out = {"_note": "lm-world outerHTML (without GSAP's origin bookkeeping: the data-svg-origin memo and its inline transform-origin: 0px 0px, L-289) at 3.0 s of each lab scene on the pack with every WS6 key stripped, recorded from "
                    f"{rt._runtime()} on 2026-10-08 (tests/suites/style_system.py record_golden)", "combos": {}}
    for style, scene in _GOLDEN_SET:
        out["combos"][f"{style}|{scene}"] = _world_hash(rt, style, scene)
    GOLDEN.write_text(json.dumps(out, indent=1), encoding="utf-8")
    return out


def primitive_style_untouched_packs_draw_byte_identical_to_before():
    """a pack that sets none of the WS6 keys (roles, materials, spotlight, vignette_under, characters.bottom and white,
    gloss_toward, contact_shadow, the paper variant) draws the SAME bytes as the runtime before WS6, in 11 pack and
    scene pairs that reach every role and material call site (hashes recorded from that runtime); each page built
    without errors and with elements (never a blind match)"""
    rt = _rt()
    if not rt._browser():
        return rt._SKIP
    gold = json.loads(GOLDEN.read_text(encoding="utf-8"))["combos"]
    assert set(gold) == {f"{s}|{c}" for s, c in _GOLDEN_SET}, sorted(gold)
    bad = []
    for style, scene in _GOLDEN_SET:
        h = _world_hash(rt, style, scene)
        g = gold[f"{style}|{scene}"]
        # built (never a blind match): no thrown scene, elements, a real picture; the same errors as before (story-cartoon's
        # definition example "e.g." overflows its label floor on both runtimes, a known layout gap, not a WS6 change)
        assert not any(e.startswith("scene_threw") for e in h["errs"]) and h["els"] > 0 and h["bytes"] > 2000, (style, scene, h)
        assert h["errs"] == g["errs"], (style, scene, h["errs"], g["errs"])
        if h["sha256"] != g["sha256"]:
            bad.append(f"{style}/{scene}: {h['bytes']} bytes, before {g['bytes']}")
    assert not bad, "an untouched pack draws differently from before WS6: " + "; ".join(bad)
    return f"{len(_GOLDEN_SET)} pack and scene pairs byte-identical to the runtime before WS6"


# ------------------------------------------------------------------ materials and roles reach their call sites
_COLORS = r"""function () { const out = {};
  for (const el of document.querySelectorAll('.lm-el[data-name]')) {
    const n = el.getAttribute('data-name'), s = new Set();
    for (const x of el.querySelectorAll('*')) for (const a of ['fill', 'stroke']) { const v = x.getAttribute(a); if (v && v[0] === '#') s.add(v.toUpperCase()); }
    out[n] = [...s];
  }
  return out; }"""
_ROLES_JS = r"""
Loom.scene("b1", { build(ctx) {
  Loom.place.office(ctx, "office", { side: "right" });
} });
Loom.scene("b2", { build(ctx) {
  const K = ctx.el("kick", { x: 100, y: 80, w: 600, h: 60, kind: "text" }); ctx.kit.kicker(K.inner, "Key term", { x: 0, y: 0, w: 600, h: 60 }); ctx.m.reveal(K, ctx.start + 0.1);
  const A = Loom.ui.mail(ctx, "msg", { x: 100, y: 160, w: 1100, subject: "Confirm", from: { name: "Payroll", address: "pay@example.com" }, to: "you", time: "09:14",
    paragraphs: ["Please confirm."], link: { text: "Confirm my details", href: "http://example.com" }, button: { text: "Confirm" } });
  Loom.ui.build(ctx, A, ctx.start + 0.1, { gap: 0.05 });
  const C = Loom.ui.chat(ctx, "thread", { x: 1250, y: 160, w: 600, title: "Dana", messages: [{ name: "Dana", text: "Did you send it?" }, { side: "me", text: "Yes" }] });
  Loom.ui.build(ctx, C, ctx.start + 0.1, { gap: 0.05 });
} });
"""


def primitive_style_materials_and_roles_paint_their_call_sites():
    """a pack with materials.wood set to a token the default drawing never uses paints the office desk in it (the
    same pack without the key does not: the control), and roles kicker, link, button and me_bubble set to it paint the
    kicker, the link, the button and my chat bubble in it; the runtime before WS6 ignored both"""
    rt = _rt()
    if not rt._browser():
        return rt._SKIP
    base = _pack("corporate-clean", strip=True)
    scenes = [{"kind": "bespoke"}, {"kind": "bespoke"}]
    plain = rt._run(rt._lesson(_ROLES_JS, scenes, rt._ONE, 2, style=base), _COLORS, [1.0])["samples"][0]["v"]
    used = {c for n in ("office", "kick", "msg", "thread") for c in plain.get(n, [])}
    assert all(n in plain for n in ("office", "kick", "msg", "thread")), sorted(plain)
    free = [k for k, v in base["palette"].items() if v.upper() not in used and k not in ("field", "field2")]
    assert free, f"every palette colour is already in the default drawing: {sorted(used)}"
    tok = free[0]
    hx = base["palette"][tok].upper()
    w = rt._run(rt._lesson(_ROLES_JS, scenes, rt._ONE, 2, style=_pack("corporate-clean", strip=True, materials={"wood": tok},
                                                                 roles={"kicker": tok, "link": tok, "button": tok, "me_bubble": tok})), _COLORS, [1.0])["samples"][0]["v"]
    missing = [n for n in ("office", "kick", "msg", "thread") if hx not in w.get(n, [])]
    assert not missing, f"{tok} ({hx}) did not reach: {missing}"
    return f"desk wood, kicker, link, button and chat bubble follow the pack ({tok} {hx}); without the keys none uses it"


# ------------------------------------------------------------------ no synthetic bold
_WEIGHTS_JS = r"""
Loom.scene("b1", { build(ctx) {
  const roles = Object.keys(Loom.style.pack.type).filter((r) => Array.isArray(Loom.style.pack.type[r]));
  let y = 20;
  for (const r of roles) for (const w of [undefined, 300, 400, 500, 600, 700, 800, 900]) {
    const E = ctx.el(`t_${r}_${w}`, { x: 40 + ((y / 1000) | 0) * 600, y: y % 1000, w: 560, h: 40, kind: "text" });
    ctx.kit.text(E.inner, r + " " + w, { role: r, x: 0, y: 0, w: 560, h: 40, size: 24, weight: w, maxLines: 1 });
    y += 9;
  }
  const K = ctx.el("kick", { x: 1300, y: 40, w: 500, h: 60, kind: "text" }); ctx.kit.kicker(K.inner, "Kicker", { x: 0, y: 0, w: 500, h: 60 });
  const A = Loom.ui.mail(ctx, "msg", { x: 1250, y: 140, w: 650, subject: "Confirm", from: { name: "Payroll", address: "pay@example.com" }, to: "you", time: "09:14",
    paragraphs: ["Please confirm."], link: { text: "Confirm", href: "http://example.com" } });
  Loom.ui.build(ctx, A, 0.1, { gap: 0.02 });
} });
"""
_DRAWN_WEIGHTS = r"""function () { const s = {};
  for (const t of document.querySelectorAll('#lm-world text')) { const k = t.getAttribute('font-family') + '|' + t.getAttribute('font-weight'); s[k] = (s[k] || 0) + 1; }
  return s; }"""


def primitive_style_no_pack_draws_a_weight_its_font_did_not_load():
    """in every pack, every text the kit draws (each type role at no weight and at 300 to 900, a kicker, a mail
    pane with its literal weights) carries a weight that its family has loaded: no synthetic bold or thin (Patrick
    Hand asked for 800 smeared into a fake bold and was measured at 800 but drawn at 400)"""
    rt = _rt()
    if not rt._browser():
        return rt._SKIP
    bad, seen = [], 0
    for style in PACKS:
        pk = _pack(style)
        loaded = {(f["family"], int(f["weight"])) for f in pk["fonts"].get("faces", [])}
        got = rt._run(rt._lesson(_WEIGHTS_JS, [{"kind": "bespoke"}], rt._ONE, 1, style=pk), _DRAWN_WEIGHTS, [3.0])["samples"][0]["v"]
        assert got, f"{style}: no text drawn (a blind measure)"
        for k, n in got.items():
            fam, w = k.split("|")
            seen += n
            if w in ("null", "None", "") or (fam, int(float(w))) not in loaded:
                bad.append(f"{style}: {fam} {w} x{n} (loaded: {sorted(x[1] for x in loaded if x[0] == fam)})")
    assert not bad, bad[:8]
    return f"{seen} texts in {len(PACKS)} packs, every weight loaded"


# ------------------------------------------------------------------ lab --file cues (Python page + browser)
_CUE_SCENE = """// @lab {"title": "cue fixture", "styles": ["corporate-clean"], "dur": 8.0, "times": [1.0], "cues": {"title": 0.9}, "words": [{"w": "The", "s": 5.6}, {"w": "office", "s": 5.8}, {"w": "is", "s": 5.95}, {"w": "gone", "s": 6.08}, {"w": "home", "s": 6.3}]}
Loom.scene("style_cue_fixture", { build(ctx) {
  window.__cues = [ctx.cue("title"), ctx.cue("gone home"), ctx.cue("2.5"), ctx.has("not a word")];
} });
"""


def primitive_style_lab_file_resolves_its_cues():
    """loom lab --file (loom/lab.py page(file=...)): a scene file outside scenes_examples/lab builds by its own id;
    ctx.cue reads the @lab cues map ("title" 0.9), then its words ("gone home": the first word's start minus the
    80 ms lead, 6.0), then a number; an unknown word is not a cue (has() false) and ctx.cue of it is a named
    warning, never a silent 0 (`py -m loom lab --file <f> --out <dir>` builds this page)"""
    rt = _rt()
    if not rt._browser():
        return rt._SKIP
    from loom import lab as LB
    sm = _load_mod("slot_helpers_for_style", "tests/suites/primitives_slot_magnify_data.py")
    d = Path(tempfile.mkdtemp(prefix="lm_cuefile_"))
    try:
        f = d / "style_cue_fixture.js"
        f.write_text(_CUE_SCENE, encoding="utf-8")
        tmp, meta, st, _ = LB.page(None, "corporate-clean", [1.0], file=f)
        try:
            js = sm._NODE % {"engine": json.dumps(str(ENGINE).replace("\\", "/")), "page": json.dumps(str(tmp / "lab.html").replace("\\", "/")),
                             "probe": "function () { return { cues: window.__cues, warn: Loom.report.warnings.map((w) => w.code) }; }", "times": "[1.0]"}
            import subprocess
            r = subprocess.run(["node", "-e", js], capture_output=True, text=True, timeout=150, cwd=str(ENGINE), env=dict(os.environ, HYPERFRAMES_BROWSER_PATH=rt._browser()))
            assert r.returncode == 0, r.stderr[-600:]
            v = json.loads(r.stdout.strip().splitlines()[-1])["samples"][0]["v"]
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
        c = v["cues"]
        assert c[0] == 0.9 and abs(c[1] - 6.0) < 1e-6 and c[2] == 2.5 and c[3] is False, c
        assert "lab_cue_unresolved" not in v["warn"], v["warn"]
        return f"title {c[0]}, 'gone home' {c[1]:.2f}, '2.5' {c[2]}, unknown word not a cue"
    finally:
        shutil.rmtree(d, ignore_errors=True)


def _load_mod(name: str, rel: str):
    spec = importlib.util.spec_from_file_location(name, ENGINE / rel)
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


# ------------------------------------------------------------------ guides against packs (pure)
def check_style_guide_palette_drift_is_caught():
    """tools/context_check.py guide_drift: on a copy of the guides and packs, today's pairs agree (control); one hex
    changed in a guide's section 2 is named with both values; a guide whose pack lost its `guide` key is named; a
    guide with no palette rows is a zero denominator, never a pass"""
    CC = _load_mod("context_check_for_style", "tools/context_check.py")
    tmp = Path(tempfile.mkdtemp(prefix="lm_guides_"))
    try:
        shutil.copytree(ENGINE / "docs" / "styles" / "guides", tmp / "docs" / "styles" / "guides")
        shutil.copytree(ENGINE / "packs" / "styles", tmp / "packs" / "styles")
        assert CC.guide_drift(tmp) == [], CC.guide_drift(tmp)
        guides = sorted(p for p in (tmp / "docs" / "styles" / "guides").glob("*.md") if p.name != "README.md")
        assert len(guides) == len(PACKS), [g.name for g in guides]
        g = tmp / "docs" / "styles" / "guides" / "cinematic-noir.md"
        txt = g.read_text(encoding="utf-8")
        pal = json.loads((tmp / "packs/styles/cinematic-noir.json").read_text(encoding="utf-8"))["palette"]
        old = pal["accent"]
        m = re.search(r"^\|\s*`?accent`?\s*\|\s*(" + re.escape(old) + r")\s*\|", txt, re.M | re.I)
        assert m, "the noir guide has no accent row to change"
        g.write_text(txt[:m.start(1)] + "#123456" + txt[m.end(1):], encoding="utf-8")
        E = CC.guide_drift(tmp)
        assert len(E) == 1 and "accent" in E[0] and "#123456" in E[0] and old.upper() in E[0].upper(), E
        g.write_text(txt, encoding="utf-8")
        pj = tmp / "packs/styles/whiteboard.json"
        pk = json.loads(pj.read_text(encoding="utf-8")); pk.pop("guide"); pj.write_text(json.dumps(pk), encoding="utf-8")
        assert any("whiteboard.json" in e and "guide" in e for e in CC.guide_drift(tmp)), CC.guide_drift(tmp)
        g.write_text(re.sub(r"^\|\s*`?\w+`?\s*\|\s*#[0-9A-Fa-f]{6}\s*\|.*$", "", txt, flags=re.M), encoding="utf-8")
        assert any("cinematic-noir.md" in e and "nothing was compared" in e for e in CC.guide_drift(tmp)), CC.guide_drift(tmp)
        return f"{len(guides)} guides agree; a changed hex ({old} -> #123456), a missing guide key and no rows are named"
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


# ------------------------------------------------------------------ fx: spotlight and vignette_under
_SPOT_JS = r"""
Loom.scene("b1", { build(ctx) {
  const A = ctx.el("card", { x: 100, y: 100, w: 300, h: 200, kind: "card" }); ctx.kit.rect(A.inner, 0, 0, 300, 200, { fill: "surface", r: 8 }); ctx.m.reveal(A, 0.1);
  Loom.fx.moment("spotlight", 1.0, 3.0, [100, 100, 400, 300]);
} });
"""
_FX = r"""function () {
  const px = (id, x, y) => { const cv = document.getElementById(id); if (!cv) return null; const c = document.createElement('canvas'); c.width = cv.width; c.height = cv.height;
    const g = c.getContext('2d'); g.drawImage(cv, 0, 0); const d = g.getImageData(Math.round(x * cv.width / 1920), Math.round(y * cv.height / 1080), 1, 1).data; return [d[0], d[1], d[2], d[3]]; };
  const vig = document.getElementById('lm-fx-vig'), cam = document.getElementById('lm-cam');
  return { moment: px('lm-fx-moment', 1500, 800), inside: px('lm-fx-moment', 250, 200), vigCorner: vig ? px('lm-fx-vig', 4, 4) : null,
           topCorner: px('lm-fx-top', 4, 4), vigBeforeCam: !!(vig && cam && (vig.compareDocumentPosition(cam) & Node.DOCUMENT_POSITION_FOLLOWING)),
           report: Loom.report.fx || null, warn: Loom.report.warnings.map((w) => w.code) }; }"""


def primitive_style_fx_spotlight_and_vignette_follow_the_pack():
    """the spotlight moment dims outside its rect by the pack's fx.spotlight strength, in its tint (a quarter-strength
    red spotlight against the default 0.55 black); inside the rect it does not dim. fx.vignette_under draws the
    vignette on its own layer BEFORE the camera (under the world), and the top layer no longer carries it"""
    rt = _rt()
    if not rt._browser():
        return rt._SKIP
    def run(fx):
        pk = _pack("corporate-clean", strip=True)
        pk["fx"] = {**{k: v for k, v in pk["fx"].items() if not k.startswith("_")}, "background": None, "grain": 0, **fx}
        return rt._run(rt._lesson(_SPOT_JS, [{"kind": "bespoke"}], rt._ONE, 1, style=pk), _FX, [2.0])["samples"][0]["v"]
    d = run({"vignette": 0})
    s = run({"vignette": 0, "spotlight": {"strength": 0.25, "tint": "neg"}})
    if "fx_unavailable" in d["warn"]:
        return "skipped: no WebGL in this browser (fx_unavailable): the fx layers are not drawn"
    assert d["moment"] and s["moment"], (d, s)
    a0, a1 = d["moment"][3], s["moment"][3]
    assert a0 > 40 and 0.3 < a1 / a0 < 0.6, f"outside alpha: default {a0}, strength 0.25 {a1} (want about 0.25/0.55 of it)"
    r, g_, b = s["moment"][:3]
    assert d["moment"][:3] == [0, 0, 0] and r > 3 * max(g_, b, 1), f"tint: default {d['moment']}, neg {s['moment']}"
    assert d["inside"][3] < 0.2 * a0, f"inside the rect it dims: {d['inside']}"
    v = run({"vignette": 0.5, "vignette_under": True})
    assert v["vigCorner"] and v["vigCorner"][3] > 20 and v["vigBeforeCam"], v
    assert v["report"]["vignette_under"] is True and (v["topCorner"] is None or v["topCorner"][3] < 0.25 * v["vigCorner"][3]), v
    o = run({"vignette": 0.5})
    assert o["vigCorner"] is None and o["topCorner"] and o["topCorner"][3] > 20, f"control: without vignette_under the top layer carries it: {o}"
    return f"outside alpha {a0} default, {a1} at 0.25 in neg {s['moment'][:3]}; vignette under the world (corner alpha {v['vigCorner'][3]})"


# ------------------------------------------------------------------ characters: bottom colour and contact shadow
_RIG_JS = r"""
Loom.scene("b1", { build(ctx) {
  const H = ctx.character("who", "ava", { x: 960, y: 900, scale: 0.9 }); ctx.m.reveal(H, 0.1);   // a person rig: thighs and shins wear P.bottom
  Loom.scenery.desk(ctx.g, 300, 1000, 500, {});
} });
"""
_RIG = r"""function () { const el = document.querySelector('.lm-el[data-name="who"]'); const fills = new Set();
  // the limbs are capsules: thick strokes, so a slot colour may be a stroke
  for (const x of el.querySelectorAll('*')) for (const a of ['fill', 'stroke']) { const v = x.getAttribute(a); if (v && v[0] === '#') fills.add(v.toUpperCase()); }
  return { fills: [...fills], contact: [...document.querySelectorAll('ellipse.lm-contact')].map((e) => +e.getAttribute('opacity')) }; }"""


def primitive_style_characters_bottom_and_contact_shadow_follow_the_pack():
    """characters.bottom = neg colours a standing rig's trousers neg and characters.white = caption_active its eye
    whites (defaults field2 and surface: neither colour appears, the control); shape.contact_shadow 0.28 puts a shadow
    ellipse under the figure and under a scenery desk, none without it"""
    rt = _rt()
    if not rt._browser():
        return rt._SKIP
    base = _pack("corporate-clean", strip=True)
    neg = base["palette"]["neg"].upper()
    p = rt._run(rt._lesson(_RIG_JS, [{"kind": "bespoke"}], rt._ONE, 1, style=base), _RIG, [2.0])["samples"][0]["v"]
    white = base["palette"]["caption_active"].upper()
    w = rt._run(rt._lesson(_RIG_JS, [{"kind": "bespoke"}], rt._ONE, 1, style=_pack("corporate-clean", strip=True, characters={"bottom": "neg", "white": "caption_active"},
                                                                                     shape={"contact_shadow": 0.28})), _RIG, [2.0])["samples"][0]["v"]
    assert neg not in p["fills"] and white not in p["fills"] and not p["contact"], f"control: {p}"
    assert neg in w["fills"], f"characters.bottom = neg did not reach the rig: {w['fills']}"
    assert white in w["fills"], f"characters.white = caption_active did not reach the eyes: {w['fills']}"
    assert w["contact"] == [0.28, 0.28], f"one shadow under the figure and one under the desk: {w['contact']}"
    return f"trousers {neg}; contact shadows {w['contact']}"


# ------------------------------------------------------------------ motion: travel key and m.draw
_TRAVEL_JS = r"""
Loom.scene("b1", { build(ctx) {
  const A = ctx.el("mover", { x: 0, y: 0, w: 100, h: 100, kind: "card" }); ctx.kit.rect(A.inner, 0, 0, 100, 100, { fill: "accent", r: 8 });
  A.__pos = { x: 200, y: 200, s: 1 }; A.mover.setAttribute("transform", "translate(200 200) scale(1)"); ctx.m.reveal(A, 0.1);
  ctx.m.travel(A, 1.0, { x: 800, y: 200, dur: 0.6 });
  ctx.m.travel(A, 2.5, { x: 800, y: 700, dur: 0.6 });
} });
"""


def primitive_style_a_second_travel_does_not_jump_at_load():
    """two travels of one element (200,200 -> 800,200 at 1 s -> 800,700 at 2.5 s): at 0.5 s it is still at its
    home, at 2 s at the first leg's end, at 3.5 s at the second's; the second travel used to render its start state
    at load, so the element sat at 800,200 from frame 0 (the drive key, guides s15)"""
    rt = _rt()
    if not rt._browser():
        return rt._SKIP
    probe = r"""function () { const m = document.querySelector('.lm-el[data-name="mover"] .lm-mv'); return m.getAttribute('transform'); }"""
    # the FIRST seek is the early one: a forward seek first rendered both legs in order and hid the load state
    out = rt._run(rt._lesson(_TRAVEL_JS, [{"kind": "bespoke"}], rt._ONE, 1), probe, [0.5, 3.5, 2.0])
    got = {s["t"]: s["v"] for s in out["samples"]}
    pos = {t: tuple(float(x) for x in re.match(r"translate\(([-\d.]+) ([-\d.]+)\)", v).groups()) for t, v in got.items()}
    assert pos[0.5] == (200.0, 200.0) and pos[2.0] == (800.0, 200.0) and pos[3.5] == (800.0, 700.0), pos
    return f"0.5 s {pos[0.5]} (the first seek), 3.5 s {pos[3.5]}, then back to 2 s {pos[2.0]}"


_DRAW_JS = r"""
Loom.scene("b1", { build(ctx) {
  const A = ctx.el("box", { x: 200, y: 200, w: 400, h: 300, kind: "card" }); ctx.kit.rect(A.inner, 0, 0, 400, 300, { fill: "accent", r: 0 });
  ctx.m.draw(A, 1.0, { dur: 1.0 });
  const D = ctx.el("dash", { x: 800, y: 200, w: 600, h: 10, kind: "structure" });
  Loom.svg("path", { d: "M0 5 L600 5", fill: "none", stroke: Loom.style.c("ink"), "stroke-width": 6, "stroke-dasharray": "14 10", opacity: 0.5 }, D.inner);
  ctx.m.draw(D, 1.0, { dur: 1.0 });
} });
"""
_DRAW = r"""function () { const q = (s) => [...document.querySelectorAll(s)];
  const box = q('.lm-el[data-name="box"] path');
  // drawn share of a path: 0 before its draw (offset at or past its length), 1 when the offset reaches 0
  const shown = (n) => { const L = n.getTotalLength(), off = parseFloat(getComputedStyle(n).strokeDashoffset || '0');
    return { drawn: Math.max(0, Math.min(1, 1 - off / L)), op: +getComputedStyle(n).opacity, own: n.getAttribute('opacity') }; };
  const dash = q('.lm-el[data-name="dash"] path').find((n) => !n.closest('mask'));
  return { fill: box.filter((n) => n.getAttribute('data-set') === 'fill').map(shown), stroke: box.filter((n) => n.getAttribute('data-set') !== 'fill').map(shown),
           dash: dash ? { op: +getComputedStyle(dash).opacity, da: dash.getAttribute('stroke-dasharray') } : null }; }"""


def primitive_style_m_draw_draws_outlines_first_and_keeps_dashes_and_opacity():
    """in the sketch pack, m.draw on a rect draws its outline before its hachure fill: 2 % into the draw (1.02 s) the
    outline is under way and the fill not started (in DOM order the hachure came first); at the end the fill is drawn
    at its OWN opacity (the pack's 0.45 hachure, not forced to 1); a dashed path keeps its '14 10' dashes (drawn
    through a mask, not by overwriting the dash array) and ends at its own opacity 0.5"""
    rt = _rt()
    if not rt._browser():
        return rt._SKIP
    out = rt._run(rt._lesson(_DRAW_JS, [{"kind": "bespoke"}], rt._ONE, 1, style="whiteboard"), _DRAW, [1.02, 2.4])
    a, b = out["samples"][0]["v"], out["samples"][1]["v"]
    assert a["fill"] and a["stroke"], f"the sketch rect has fill and stroke paths (data-set): {a}"
    assert all(x["drawn"] == 0 for x in a["fill"]) and any(x["drawn"] > 0 for x in a["stroke"]), f"outline first at 1.02 s: {a}"
    assert all(x["drawn"] == 1 for x in b["fill"] + b["stroke"]), f"all drawn by 2.4 s: {b}"
    own = [x for x in b["fill"] if x["own"] is not None]
    assert own and all(abs(x["op"] - float(x["own"])) < 0.02 for x in own), f"each fill path ends at its own opacity: {b['fill']}"
    assert b["dash"]["da"] == "14 10" and abs(b["dash"]["op"] - 0.5) < 0.02, f"the dash keeps '14 10' and opacity 0.5: {b['dash']}"
    return f"outline before hachure; fill at its own opacity {own[0]['own']}; dash '{b['dash']['da']}' at {b['dash']['op']}"


# ------------------------------------------------------------------ shapes: glow, depth ids, sketch arrow and rect
_SHAPES_JS = r"""
Loom.scene("b1", { build(ctx) {
  const G = ctx.el("glow", { x: 0, y: 0, w: 10, h: 10, kind: "scenery" }); Loom.glow.glowDisc(G.inner, 400, 400, 80, "accent");
  Loom.glow.burst(ctx, "burst", { x: 1400, y: 500, r: 300 });
  const st = Loom.depth.stage(ctx, "deep", {});
  st.glow(300, 300, 40, "ink"); st.glow(600, 300, 40, "ink", { z: 0.4 }); st.cone(900, 100, 120, 400, "ink"); st.cone(1200, 100, 120, 400, "ink");
} });
"""
_SHAPES = r"""function () {
  const disc = document.querySelector('.lm-el[data-name="glow"] .lm-glow');
  const ids = [...document.querySelectorAll('[id]')].map((n) => n.id), dup = ids.filter((x, i) => ids.indexOf(x) !== i);
  const burst = new Set(); for (const x of document.querySelectorAll('.lm-el[data-name="burst"] *')) { const v = x.getAttribute('fill'); if (v && v[0] === '#') burst.add(v.toUpperCase()); }
  const cs = [...disc.querySelectorAll('circle')];
  return { gradientCircles: cs.filter((c) => /^url\(/.test(c.getAttribute('fill') || '')).length,
           rings: cs.filter((c) => !/^url\(/.test(c.getAttribute('fill') || '') && +(c.getAttribute('opacity') || 1) < 0.5).length,
           dup: [...new Set(dup)], burst: [...burst] }; }"""


def primitive_style_glow_is_one_gradient_and_depth_ids_are_unique():
    """glow-flat: a glow disc is ONE circle filled by a radial gradient (the stepped rings banded, worse after H.264);
    the burst's default layers stay in the field family plus the accent (no accent2, accent3 or pos); a depth stage
    with two glows and two cones has no duplicate ids (the second filter used to take the first one's id)"""
    rt = _rt()
    if not rt._browser():
        return rt._SKIP
    pk = _pack("glow-flat")
    v = rt._run(rt._lesson(_SHAPES_JS, [{"kind": "bespoke"}], rt._ONE, 1, style=pk), _SHAPES, [2.0])["samples"][0]["v"]
    assert v["gradientCircles"] == 1 and v["rings"] == 0, f"one gradient disc and no stepped rings (the core is apart): {v}"
    off = {pk["palette"][t].upper() for t in ("accent2", "accent3", "pos")}
    assert v["burst"] and not (set(v["burst"]) & off), f"the burst default left the field family: {v['burst']}"
    assert not v["dup"], f"duplicate ids: {v['dup']}"
    return f"one gradient circle; burst in {len(v['burst'])} field-family colours; no duplicate ids"


_SKETCH_JS = r"""
Loom.scene("b1", { build(ctx) {
  const A = ctx.el("arrow", { x: 0, y: 0, w: 10, h: 10, kind: "structure" }); ctx.kit.arrow(A.inner, 200, 600, 900, 600, { stroke: "ink", sw: 6 });
  const R = ctx.el("pill", { x: 1000, y: 400, w: 600, h: 200, kind: "card" }); ctx.kit.rect(R.inner, 0, 0, 600, 200, { fill: "surface", r: 60 });
} });
"""
_SKETCH = r"""function () {
  const a = document.querySelector('.lm-el[data-name="arrow"]');
  const filledHead = [...a.querySelectorAll('path,polygon')].some((p) => { const f = p.getAttribute('fill'); return f && f !== 'none' && p.tagName.toLowerCase() === 'polygon'; });
  const strokesOnly = [...a.querySelectorAll('path')].every((p) => (p.getAttribute('fill') || 'none') === 'none');
  // the pill's outline: its nearest point to the box corner (1000, 400) in its own frame (the element is at 1000, 400)
  let best = 1e9; for (const p of document.querySelectorAll('.lm-el[data-name="pill"] path')) { if (p.getAttribute('data-set') === 'fill') continue;
    const L = p.getTotalLength(); for (let i = 0; i <= 400; i++) { const q = p.getPointAtLength(L * i / 400); best = Math.min(best, Math.hypot(q.x, q.y)); } }
  return { shaft: !!a.querySelector('.lm-arrow-shaft'), head: !!a.querySelector('.lm-arrow-head'), filledHead, strokesOnly, corner: best }; }"""


def primitive_style_sketch_arrows_are_open_strokes_and_rects_keep_their_radius():
    """whiteboard: kit.arrow is a rough shaft and an open two-stroke head (a marker arrow, never a filled crisp
    triangle), every path unfilled; kit.rect with r 60 keeps its round corners (its outline stays more than 10 px
    from the box corner; the square rough rectangle passed through it)"""
    rt = _rt()
    if not rt._browser():
        return rt._SKIP
    v = rt._run(rt._lesson(_SKETCH_JS, [{"kind": "bespoke"}], rt._ONE, 1, style="whiteboard"), _SKETCH, [2.0])["samples"][0]["v"]
    assert v["shaft"] and v["head"] and v["strokesOnly"] and not v["filledHead"], v
    assert v["corner"] > 10, f"the sketch rect lost its radius: outline {v['corner']:.1f} px from the corner"
    return f"open arrow; rounded sketch rect ({v['corner']:.0f} px from the corner)"


# ------------------------------------------------------------------ templates: document.page paper and the counter
_PAGE_JS = r"""
Loom.scene("b1", { build(ctx) {
  Loom.templates["document.page"].build(ctx, { kind: "notes", title: "Handover notes", lines: [{ text: "Open tickets and owners" }], variant: ctx.beat.id === "b1" ? "paper" : undefined });
  const N = Loom.data.counter(ctx, "count", { x: 1300, y: 700, w: 500, to: 42, t: 0.2 });
} });
"""


def primitive_style_document_paper_variant_and_the_counter():
    """document.page with variant paper (or the pack's templates["document.page"].variant) draws a light page
    (surface) with ink words; the default stays the dark card (ink page, field words); the counter's digits keep
    one width (tabular-nums)"""
    rt = _rt()
    if not rt._browser():
        return rt._SKIP
    pk = _pack("story-cartoon", strip=True)
    # the page's body is its largest filled shape; its lines are elements of their own (line_1 ...)
    probe = r"""function () { const pg = document.querySelector('.lm-el[data-name="page"]'); let best = null, area = -1;
      if (pg) for (const x of pg.querySelectorAll('rect,path')) { const v = x.getAttribute('fill'); if (!v || v[0] !== '#') continue; const b = x.getBBox(); if (b.width * b.height > area) { area = b.width * b.height; best = v; } }
      const words = [...document.querySelectorAll('.lm-el[data-name^="line_"] text')].map((t) => t.getAttribute('fill'));
      const fills = [best];
      const c = document.querySelector('.lm-el[data-name="count"] text');
      return { page: fills[0] || null, words, tabular: c ? (c.getAttribute('style') || '') : null, errs: Loom.report.errors.map((e) => e.code + ': ' + String(e.msg).slice(0, 160)) }; }"""
    src = _PAGE_JS.replace('ctx.beat.id === "b1"', "window.__paper")
    paper = rt._run(rt._lesson("window.__paper = true;\n" + src, [{"kind": "bespoke"}], rt._ONE, 1, style=pk, templates=True), probe, [3.5])["samples"][0]["v"]
    card = rt._run(rt._lesson("window.__paper = false;\n" + src, [{"kind": "bespoke"}], rt._ONE, 1, style=pk, templates=True), probe, [3.5])["samples"][0]["v"]
    P = {k: v.upper() for k, v in pk["palette"].items()}
    assert (paper["page"] or "").upper() == P["surface"] and paper["words"] and all(w.upper() == P["ink"] for w in paper["words"]), paper
    assert (card["page"] or "").upper() == P["ink"] and all(w.upper() == P["field"] for w in card["words"]), card
    assert "tabular-nums" in (paper["tabular"] or ""), paper
    # no prop, the pack says paper (story-cartoon's own templates["document.page"].variant)
    packd = rt._run(rt._lesson("window.__paper = false;\n" + src, [{"kind": "bespoke"}], rt._ONE, 1, style=_pack("story-cartoon"), templates=True), probe, [3.5])["samples"][0]["v"]
    assert (packd["page"] or "").upper() == P["surface"], f"the pack's variant paper was not used: {packd}"
    return f"paper page {paper['page']} with ink words (by prop and by the pack); card page {card['page']}; counter tabular"


# ------------------------------------------------------------------ pipeline: the guide reaches the authors (pure)
def check_style_guide_reaches_the_storyboard_and_scene_authors():
    """loom/stages.py reading_list: the storyboard and scenes stages read the lesson style's guide after their skills,
    other stages do not, a style without a guide adds nothing (the Cowork task file, loom/agent/tasks.py, lists this same
    reading_list); get_style_pack returns the guide's text; parity_files (the API agents' cached prefix) includes it"""
    from loom.stages import BY_NAME, reading_list, style_guide
    g = style_guide("cinematic-noir")
    assert g == "docs/styles/guides/cinematic-noir.md", g
    for st in ("storyboard", "scenes"):
        rl = reading_list(BY_NAME[st], "cinematic-noir")
        assert rl[-1] == g and rl[:-1] == list(BY_NAME[st].skills), (st, rl)
    assert g not in reading_list(BY_NAME["script"], "cinematic-noir") and reading_list(BY_NAME["scenes"], None) == list(BY_NAME["scenes"].skills)
    assert style_guide("no-such-style") is None
    from types import SimpleNamespace
    from loom.agents.tools import t_get_style_pack
    out = t_get_style_pack(SimpleNamespace(project=SimpleNamespace(request={"style": "cinematic-noir"})))
    assert out.get("guide") == g and "## 2." in (out.get("guide_text") or ""), list(out)
    from loom.agents.runtime import parity_files
    assert g in parity_files("scene", "cinematic-noir") and g in parity_files("storyboard", "cinematic-noir"), parity_files("scene", "cinematic-noir")
    assert g not in parity_files("script", "cinematic-noir") and g not in parity_files("scene", None)
    return f"storyboard and scenes read {g}; get_style_pack returns {len(out['guide_text'])} chars of guide; parity files include it"


# ------------------------------------------------------------------ every other role and material call site
# one beat per call site; the beat's scene group must use the role's colour when the pack names it, and not otherwise
_SITES = [
    ("stat_value", 'Loom.templates["stat.hero"].build(ctx, { value: 42, say: "0.3", suffix: "%" });'),
    ("quiz_letter", 'Loom.templates["quiz.question"].build(ctx, { question: "Which one?", say_question: "0.2", options: [{ text: "This" }, { text: "That" }] });'),
    ("recap_rule", 'Loom.templates["recap"].build(ctx, { items: [{ label: "One", say: "0.2" }, { label: "Two", say: "0.4" }], rule: "Keep it short", say_rule: "0.6" });'),
    ("date", 'Loom.templates["timeline"].build(ctx, { events: [{ when: "May", label: "Start", say: "0.2" }, { when: "June", label: "Finish", say: "0.5" }] });'),
    ("verdict", 'Loom.templates["compare.two"].build(ctx, { left: { header: "Before", say: "0.2", items: [{ text: "Slow", say: "0.3" }] }, '
                'right: { header: "After", say: "0.4", items: [{ text: "Fast", say: "0.5" }] }, verdict: { text: "After wins", say: "0.8" } });'),
    ("chapter_kicker", 'Loom.data.chapter(ctx, "ch", { kicker: "Part one", title: "Begin", sub: "Where it starts", t: ctx.start + 0.1 });'),
    ("ui_mark", 'const A = Loom.ui.mail(ctx, "m", { x: 100, y: 100, w: 1100, subject: "Note", from: { name: "Dana", address: "dana@example.com" }, to: "you", '
                'time: "09:00", paragraphs: ["Please confirm the date today."] }); Loom.ui.build(ctx, A, ctx.start + 0.1, { gap: 0.02 }); '
                'const key = Object.keys(A.text).find((k) => A.text[k].str.indexOf("confirm") >= 0); Loom.ui.mark(ctx, A, key, "confirm", ctx.start + 0.5);'),
    ("button", 'const W = ctx.el("w", { x: 100, y: 100, w: 600, h: 300, kind: "card" }); Loom.ui.button(ctx, W, { x: 20, y: 20, label: "Send" });'),
    ("person_cloth", 'Loom.templates["document.page"].build(ctx, { kind: "notes", title: "Notes", lines: [{ text: "One line" }, { text: "Two lines" }], person: { member: "woman" } });'),
    ("chair", 'Loom.place.meeting(ctx, "meet", {});'),
    ("screen", 'Loom.scenery.desk(ctx.g, 300, 1000, 600, { monitor: true });'),
    ("books", 'Loom.scenery.room(ctx, "room", { shelf: true });'),
    ("plant", 'Loom.place.office(ctx, "off", { side: "right" });'),
    ("pot", 'Loom.place.office(ctx, "off2", { side: "right" });'),
    ("objects.calendar", 'Loom.obj.draw(ctx, "cal", "calendar", { x: 700, y: 500, size: 260, t: ctx.start + 0.1 });'),
    ("turn_card", 'Loom.scenery.narrationCard(ctx, "card", "A turn in the story", ctx.start + 0.5);'),
    ("monitor", 'Loom.scenery.desk(ctx.g, 300, 1000, 600, { monitor: true });'),
    ("avatar", 'const A = Loom.ui.inbox(ctx, "box", { x: 100, y: 100, w: 1100, rows: [{ from: "Payroll Team", subject: "Confirm", preview: "Your payment", time: "09:14" }, '
               '{ from: "Dana Okafor", subject: "Notes", preview: "Thanks all", time: "08:52" }] }); Loom.ui.build(ctx, A, ctx.start + 0.1, { gap: 0.02 });'),
    # the places' set decorations (L-276): night window lights, the vessel and its cells, rack LEDs, the tray's cables,
    # the meeting room's wall chart, the warehouse safety line
    ("window_lights", 'Loom.place.meeting(ctx, "night", { night: true });'),
    ("vessel", 'Loom.place.inside(ctx, "ins", {});'),
    ("cells", 'Loom.place.inside(ctx, "ins2", {});'),
    ("leds", 'Loom.place.server(ctx, "srv", {});'),
    ("cables", 'Loom.place.server(ctx, "srv2", {});'),
    ("chart", 'Loom.place.meeting(ctx, "meet2", {});'),
    ("safety_line", 'Loom.place.warehouse(ctx, "wh", {});'),
] + [  # every other Loom.obj kind whose drawing reads its tone (the laptop draws ink and surface2 whatever its tone);
       # the phone reads it in its classic family, the bulb in its spark family
    (f"objects.{k}", f'Loom.obj.draw(ctx, "o_{k}", "{k}", {{ x: 700, y: 500, size: 260, t: ctx.start + 0.1{fam} }});')
    for k, fam in (("document", ""), ("envelope", ""), ("clock", ""), ("phone", ', family: "classic"'), ("folder", ""), ("package", ""),
                   ("building", ""), ("heart", ""), ("bulb", ', family: "spark"'), ("lock", ""))
]
_MATERIALS = ("chair", "screen", "books", "plant", "pot", "objects", "monitor", "window_lights", "vessel", "cells", "leds", "cables", "chart", "safety_line")
_LISTS = ("books", "cells", "leds", "cables", "chart")   # materials read as a list of tokens
# probe colours of their own where a beat holds more than one site (the office uses every other palette colour; a
# meeting room holds the chart and the window, the inside place the vessel and the cells, the server LEDs and cables)
_PROBE = {"plant": ("probe_plant", "#13579B"), "pot": ("probe_pot", "#9B1357"), "window_lights": ("probe_window", "#1D3579"),
          "vessel": ("probe_vessel", "#791D35"), "cells": ("probe_cells", "#35791D"), "leds": ("probe_leds", "#4A8E22"),
          "cables": ("probe_cables", "#8E224A"), "chart": ("probe_chart", "#224A8E"), "safety_line": ("probe_safety", "#5B9F33")}
_SITE_COLORS = r"""function () { const out = {};
  for (const g of document.querySelectorAll('.lm-scene[data-beat]')) { const s = new Set();
    for (const x of g.querySelectorAll('*')) for (const a of ['fill', 'stroke']) { const v = x.getAttribute(a); if (v && v[0] === '#') s.add(v.toUpperCase()); }
    out[g.getAttribute('data-beat')] = [...s]; }
  return { colors: out, errs: Loom.report.errors.filter((e) => e.code !== 'cue_unresolved').map((e) => e.code + ': ' + String(e.msg).slice(0, 120)) }; }"""


def primitive_style_every_role_and_material_site_follows_the_pack():
    """the other call sites, one beat each: stat value, quiz letter, recap rule, timeline date, compare verdict,
    chapter kicker, ui mark, interaction button, a template person's clothes, meeting chairs, the desk screen, the
    room shelf's books, the office plant and its pot (each in a probe colour of its own), an object's default tone (a
    calendar, materials.objects), the turn card's ground (roles.turn_card: noir's card was a cream flash). With every one of those
    roles and materials set to a colour the default drawing never uses, each beat uses it; without them none does
    (the control). The runtime before WS6 had them hard-coded. Added for L-276: the places' set decorations
    (materials.window_lights, vessel, cells, leds, cables, chart, safety_line; each a probe colour of its own, red on
    the runtime before) and every other object kind whose drawing reads its tone (materials.objects; that routing
    was already generic, so those beats pass on the runtime before too)"""
    rt = _rt()
    if not rt._browser():
        return rt._SKIP
    js = "".join(f'Loom.scene("b{i + 1}", {{ build(ctx) {{ {code} }} }});\n' for i, (_, code) in enumerate(_SITES))
    scenes = [{"kind": "bespoke", "join_in": {"type": "cut"}} for _ in _SITES]
    base = _pack("corporate-clean", strip=True)
    plain = rt._run(rt._lesson(js, scenes, rt._ONE, len(_SITES), style=base, templates=True), _SITE_COLORS, [1.0])["samples"][0]["v"]
    assert not plain["errs"], plain["errs"][:4]
    assert len(plain["colors"]) == len(_SITES), sorted(plain["colors"])
    used = {c for cs in plain["colors"].values() for c in cs}
    free = [k for k, v in base["palette"].items() if v.upper() not in used]
    assert free, f"every palette colour is already used: {sorted(used)}"
    # the colours: the first unused palette token, and for the plant and the pot probe tokens added to this test's
    # copy of the pack (the office, which has both, uses every other palette colour)
    tok = free[0]
    assert not ({h for _, h in _PROBE.values()} & used)
    hx = {r: (_PROBE[r][1] if r in _PROBE else base["palette"][tok].upper()) for r, _ in _SITES}
    roles = {r: ([tok] if r == "avatar" else tok) for r, _ in _SITES if r.split(".")[0] not in _MATERIALS}
    probe = lambda r: _PROBE[r][0] if r in _PROBE else tok  # noqa: E731
    mats = {r: ([probe(r)] if r in _LISTS else probe(r)) for r in _MATERIALS if r != "objects"}
    mats["objects"] = {r.split(".", 1)[1]: tok for r, _ in _SITES if r.startswith("objects.")}
    pk = _pack("corporate-clean", strip=True, roles=roles, materials=mats)
    pk["palette"].update({k: h for k, h in _PROBE.values()})
    w = rt._run(rt._lesson(js, scenes, rt._ONE, len(_SITES), style=pk,
                           templates=True), _SITE_COLORS, [1.0])["samples"][0]["v"]
    missing = [f"{r} (b{i + 1}, {hx[r]})" for i, (r, _) in enumerate(_SITES) if hx[r] not in w["colors"].get(f"b{i + 1}", [])]
    assert not missing, f"did not reach: {missing}"
    assert not w["errs"], w["errs"][:3]
    return f"{len(_SITES)} call sites follow the pack ({tok}; probe colours for {', '.join(_PROBE)}); none used them without the keys"


def check_style_lab_out_folder_reaches_every_strip_path():
    """`py -m loom lab <scene> --style <id> --out <dir>` passes the folder to the strip (it was read by --file only, so a
    scene strip landed in docs/styles/demos/lab whatever --out said); --file and --seed paths pass it too"""
    from loom import cli, lab as LB
    got, saved = [], LB.strip
    LB.strip = lambda scene, style=None, times=None, out_dir=None, frames_dir=None, seed=None, file=None, **k: (
        got.append((scene, style, out_dir, file)) or {"scene": scene or "f", "style": style, "errors": [], "warnings": []})
    try:
        cli.main(["lab", "lab_data", "--style", "glow-flat", "--out", "OUTDIR"])
        cli.main(["lab", "--file", "scenes_examples/style_glow_flat_handover.js", "--style", "glow-flat", "--out", "OUTDIR2"])
        cli.main(["lab", "lab_data", "--style", "glow-flat", "--seed", "panel=card", "--out", "OUTDIR3"])
    finally:
        LB.strip = saved
    assert [g[2] for g in got] == ["OUTDIR", "OUTDIR2", "OUTDIR3"], got
    return f"{len(got)} strip calls, each with its --out"


def primitive_style_lab_page_draws_the_vignette_under_the_drawing():
    """loom/lab.py with the pack's fx on and vignette_under: the vignette canvas sits BEFORE the scene svg (under the
    drawing, the field moved to the page behind both) and its corner is dark; it was appended over the drawing, so a
    lab strip showed the vignette over words. Without vignette_under the svg keeps its field (the control)"""
    rt = _rt()
    if not rt._browser():
        return rt._SKIP
    import subprocess
    from loom import lab as LB
    sm = _load_mod("slot_helpers_for_style2", "tests/suites/primitives_slot_magnify_data.py")
    probe = r"""function () { const vig = document.getElementById('lm-fx-vig'), svg = document.querySelector('#root > svg');
      const before = !!(vig && svg && (vig.compareDocumentPosition(svg) & Node.DOCUMENT_POSITION_FOLLOWING));
      return { vig: !!vig, before, field: svg ? +svg.firstChild.getAttribute('opacity') : null }; }"""
    out = {}
    for under in (True, False):
        tmp, *_ = LB.page("lab_fx", "corporate-clean", [1.0], fx={"vignette": 0.5, "vignette_under": under, "background": None, "grain": 0})
        try:
            js = sm._NODE % {"engine": json.dumps(str(ENGINE).replace("\\", "/")), "page": json.dumps(str(tmp / "lab.html").replace("\\", "/")), "probe": probe, "times": "[1.0]"}
            r = subprocess.run(["node", "-e", js], capture_output=True, text=True, timeout=150, cwd=str(ENGINE), env=dict(os.environ, HYPERFRAMES_BROWSER_PATH=rt._browser()))
            assert r.returncode == 0, r.stderr[-600:]
            out[under] = json.loads(r.stdout.strip().splitlines()[-1])["samples"][0]["v"]
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
    assert out[True] == {"vig": True, "before": True, "field": 0}, out[True]
    assert out[False]["vig"] is False and out[False]["field"] == 1, out[False]
    return f"under: vignette canvas before the svg, field on the page; control: {out[False]}"


_CARD_JS = r"""
Loom.scene("b1", { build(ctx) { Loom.scenery.narrationCard(ctx, "card", "But on Friday, nobody checked.", ctx.start + 0.5); } });
"""
_CARD = r"""function () { const el = document.querySelector('.lm-el[data-name="card"]'); const r = el.querySelector('rect,path'), t = el.querySelector('text');
  return { ground: r && r.getAttribute('fill'), text: t && t.getAttribute('fill') }; }"""


def primitive_style_turn_card_words_read_on_their_card_in_every_pack():
    """ctx.narrationCard in each pack, as the pack sets it: the card's words contrast 4.5:1 or more with its ground.
    In whiteboard (an outlined pack) kit.text turned the card's field-coloured words into ink, on an ink card (1:1);
    in the dark packs the default ink card was a full-frame cream flash, now roles.turn_card"""
    rt = _rt()
    if not rt._browser():
        return rt._SKIP
    lum = lambda h: (lambda c: 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2])(  # noqa: E731
        [((v / 255) / 12.92 if v / 255 <= 0.03928 else (((v / 255) + 0.055) / 1.055) ** 2.4) for v in (int(h[1:3], 16), int(h[3:5], 16), int(h[5:7], 16))])
    got, bad = {}, []
    for style in PACKS:
        v = rt._run(rt._lesson(_CARD_JS, [{"kind": "bespoke"}], rt._ONE, 1, style=style), _CARD, [2.0])["samples"][0]["v"]
        a, b = lum(v["ground"]), lum(v["text"])
        c = (max(a, b) + 0.05) / (min(a, b) + 0.05)
        got[style] = round(c, 1)
        if c < 4.5:
            bad.append(f"{style}: {v['text']} on {v['ground']} = {c:.2f}:1")
    assert not bad, bad
    return f"contrast per pack {got}"


_PERSON_JS = r"""
Loom.scene("b1", { build(ctx) { window.__who = [0, 1].map((slot) => Loom.th.person(ctx, {}, { cloth: slot ? "accent4" : "accent", slot }).cloth); } });
"""


def primitive_style_person_cloth_keeps_two_people_apart():
    """roles.person_cloth per slot: a list dresses a dialogue's left and right people in its first and second tokens
    (story-cartoon: cloth, cloth2); one token dresses both; no key keeps the template's side colours (accent,
    accent4). One token for everyone put both dialogue sides in the same clothes (A4 proof, 2026-10-08)"""
    rt = _rt()
    if not rt._browser():
        return rt._SKIP
    probe = "function () { return window.__who; }"
    got = {}
    for label, pk in (("list", _pack("story-cartoon", strip=True, roles={"person_cloth": ["cloth", "cloth2"]})),
                      ("one", _pack("story-cartoon", strip=True, roles={"person_cloth": "muted"})),
                      ("none", _pack("story-cartoon", strip=True))):
        got[label] = rt._run(rt._lesson(_PERSON_JS, [{"kind": "bespoke"}], rt._ONE, 1, style=pk, templates=True), probe, [1.0])["samples"][0]["v"]
    assert got == {"list": ["cloth", "cloth2"], "one": ["muted", "muted"], "none": ["accent", "accent4"]}, got
    return f"{got}"
