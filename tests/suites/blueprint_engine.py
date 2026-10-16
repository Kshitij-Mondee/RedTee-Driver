"""The blueprint engine (2026-10-16, runtime/engines/blueprint.js): a technical drawing drafted live, in two registers
(detail and teaching). Offline tests run the real runtime and engine in Node (tools/node/svg_preview.mjs, the same path
`tools/lab_preview.py` uses), so they need node but no browser; the strip test needs a browser and skips without one.
Each test has a control that shows it can fail."""
from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))   # tests/: one browser check for every suite
from browser_support import browser  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))

from loom.util import which  # noqa: E402


def _frames(scene_src: str, times: list[float]) -> tuple[dict, dict]:
    """build a lab page for a scene source in the blueprint style and render it in Node: ({time: svg text}, report)"""
    from loom import lab
    d = Path(tempfile.mkdtemp(prefix="loombp_"))
    try:
        f = d / "scene.js"
        f.write_text(scene_src, encoding="utf-8")
        tmp, meta, st, ts = lab.page("bp_test", "blueprint", times, file=f)
        out = tmp / "preview"
        r = subprocess.run([which("node") or "node", str(ROOT / "tools/node/svg_preview.mjs"), str(tmp), str(out)],
                           capture_output=True, text=True, timeout=300)
        rep = json.loads((out / "report.json").read_text(encoding="utf-8")) if (out / "report.json").exists() else {}
        assert r.returncode == 0 and rep, f"the node preview failed: {r.stderr[-800:]}"
        shots = {round(float(s["t"]), 2): Path(s["file"]).read_text(encoding="utf-8") for s in rep["shots"]}
        return shots, rep
    finally:
        shutil.rmtree(d, ignore_errors=True)


def _head(times, dur=6.0):
    return '// @lab {"title": "test", "styles": ["blueprint"], "dur": %s, "times": %s}\n' % (dur, json.dumps(times))


def check_blueprint_engine_lints_letters_and_switches():
    """the engine passes the engine lint; its stroke font (Hershey Sans) parses and is embedded for blueprint lessons only;
    a lesson uses it unless its request says engine off, and only then does get_style_pack carry the engine's guide.
    Control: engine off gives no guide; another style gets no blueprint font."""
    from loom import engines as EN
    from loom.stroke_fonts import load
    assert EN.lint(EN.ENGINES_DIR / "blueprint.js") == [], EN.lint(EN.ENGINES_DIR / "blueprint.js")
    F = load("HersheySans1")
    assert 600 < F["cap"] < 720 and len(F["glyphs"]) > 90 and F["glyphs"]["A"]["s"], (F["cap"], len(F["glyphs"]))
    assert list(EN.engine_assets("blueprint")["strokeFonts"]) == ["HersheySans1"]
    assert "HersheySans1" not in (EN.engine_assets("corporate-clean").get("strokeFonts") or {})

    class P_:
        def __init__(self, req): self.request = req
    assert EN.enabled_for(P_({}), "blueprint") and not EN.enabled_for(P_({"engine": "off"}), "blueprint")
    from loom.agents import tools as T

    class C_:
        def __init__(self, req): self.project = P_(dict(req, style="blueprint"))
    on, off = T.t_get_style_pack(C_({})), T.t_get_style_pack(C_({"engine": "off"}))
    assert "W.sheet(ctx)" in on.get("engine_text", "") and "engine_text" not in off
    return "lint clean; Hershey Sans parsed and embedded for blueprint only; the switch and the guide follow the request"


_ORDER = """Loom.scene("bp_test", { build(ctx) {
  const W = ctx.engine, D = W.sheet(ctx);
  const p = ctx.el("part", { x: 400, y: 300, w: 600, h: 400, kind: "card" });
  D.part(p, { centre: W.centre(-40, 200, 640, 200), outline: W.rect(0, 0, 600, 400), hatch: W.hatch([[0, 0], [200, 0], [200, 400], [0, 400]]) },
         { at: 1.0, by: 4.0 });
  const lb = ctx.el("lab", { x: 400, y: 760, w: 600, h: 60, kind: "text" });
  D.letter(lb, "Housing", { role: "label", at: 4.2, by: 5.0 });
}});
"""


def _paths(svg: str, name: str) -> list[str]:
    """the <path> tags inside the element named `name` (its lm-el group) in a frame"""
    i = svg.find(f'data-name="{name}"')
    assert i >= 0, f"no element {name} in the frame"
    j = svg.find('class="lm-el"', i + 10)
    return re.findall(r"<path [^>]*>", svg[i:j if j > 0 else len(svg)])


def _shown(tag: str) -> bool:
    m = re.search(r'stroke-dashoffset:\s*([-\d.e]+)', tag)
    if m:
        return float(m.group(1)) < 0.5
    if "stroke-dasharray" in tag:
        return False
    return 'opacity:1' in tag.replace(" ", "") or 'opacity="1"' in tag


def check_blueprint_engine_drafts_in_order_and_the_same_twice():
    """drafting order: early in the part's window the centre line's dashes are down while the outline is not yet whole and
    no hatching shows; at the end all of it is drawn and the label is lettered. The same frames come out of two builds.
    Control: two times differ."""
    if not which("node"):
        return "skipped (no node)"
    times = [1.4, 3.1, 5.6]
    a, rep = _frames(_head(times) + _ORDER, times)
    b, _ = _frames(_head(times) + _ORDER, times)
    assert a == b, "the same scene drew different frames in two builds"
    assert a[1.4] != a[5.6], "control: two times gave the same frame"
    early, late = _paths(a[1.4], "part"), _paths(a[5.6], "part")
    dash = [p for p in early if 'stroke-linecap="butt"' in p]
    assert dash and any(_shown(p) for p in dash), "the centre line is not down first"
    outline = [p for p in early if "stroke-dasharray" in p and 'stroke-width="2.50"' in p]
    assert outline and not all(_shown(p) for p in outline), "the outline was whole before the centre line finished"
    hatch_late = [p for p in late if "stroke-dasharray" in p and 'stroke-width="1.05"' in p]
    assert hatch_late and all(_shown(p) for p in hatch_late), f"the hatching is not drawn at the end ({len(hatch_late)} lines)"
    assert not any(_shown(p) for p in early if 'stroke-width="1.05"' in p), "hatching showed before the outline"
    assert all(_shown(p) for p in _paths(a[5.6], "lab") if "stroke-dasharray" in p), "the label is not lettered"
    errs = rep.get("errors") or []
    assert not errs, errs[:3]
    return "centre lines, then outline, then hatching; lettered; the same frames twice; two times differ"


_DIM = """Loom.scene("bp_test", { build(ctx) {
  const W = ctx.engine, D = W.sheet(ctx);
  const d = ctx.el("dims", { x: 400, y: 300, w: 600, h: 200, kind: "label" });
  const h = D.dim(d, 0, 100, 600, 100, { off: 40, value: 0, unit: "mm", at: 0.5 });
  h.set(90, 2.5, 1.0);
  const tb = ctx.el("tblock", { x: 1300, y: 600, w: 420, h: 200, kind: "card" });
  const TB = D.titleBlock(tb, [["Title", "A long title lettered by the pen"], ["Drawn", "Loom"], ["Scale", "1 : 4"], ["Status", ""]], { at: 4.0, dur: 0.4 });
  Loom.warn("bp_dbg_tb", String(TB.t));
}});
"""


def check_blueprint_dimension_counts_live_and_title_block_labels_print_with_the_frame():
    """a live dimension reads its first value before set() and its new value after (the words the checks read follow
    the drawing); the title block's printed field labels are all down with the frame, before the pen letters the values
    (the 2026-10-16 preview showed STATUS still unwritten at the end of a scene: each label waited for the value above
    it). Control: the value read at 1.5 s is not the one at 4.0 s."""
    if not which("node"):
        return "skipped (no node)"
    times = [1.5, 3.9, 4.9]
    f, rep = _frames(_head(times, 8.0) + _DIM, times)
    txt = lambda s: re.findall(r'data-engine-text="blueprint"[^>]*>([^<]*)<', s)  # noqa: E731
    assert "0 mm" in txt(f[1.5]) and "90 mm" not in txt(f[1.5]), txt(f[1.5])
    assert "90 mm" in txt(f[3.9]), f"the live figure did not reach 90 mm: {txt(f[3.9])}"
    tb_end = float(next(w["msg"] for w in rep.get("warnings", []) if w.get("code") == "bp_dbg_tb"))
    assert tb_end > 5.0, f"control: the pen letters the values after 4.9 s ({tb_end:.2f})"
    i = f[4.9].find('>STATUS<')
    assert i > 0, "the STATUS label is not on the page"
    status = re.findall(r"<path [^>]*>", f[4.9][i:i + 4000])[:10]
    assert status and all(_shown(p) for p in status), "the printed label STATUS is not whole when the frame is down"
    return "the live figure reads 0 mm, then 90 mm; every printed label is down with the frame while the pen letters on"


def check_blueprint_lab_scenes_render_with_no_problem():
    """the engine's two lab scenes (the detail and the teaching register) render in Chrome with no problem.
    Needs a browser."""
    if not browser():
        return "skipped (no browser here)"
    from loom import lab as LB
    d = Path(tempfile.mkdtemp(prefix="loombpl_"))
    try:
        for sc, ts in (("bp_engine_detail", [13.2, 25.4]), ("bp_engine_teach", [9.6, 21.4])):
            r = LB.strip(sc, "blueprint", ts, out_dir=d / sc, frames_dir=d / sc / "f")
            assert not r["errors"], (sc, r["errors"][:4])
    finally:
        shutil.rmtree(d, ignore_errors=True)
    return "both registers render with no problem"



# ---------------------------------------------------------------- the 2026-10-16 stress-test findings (FINDINGS.md)
# Each test reads the drawn geometry out of a Node frame (element-local px: the elements sit at 0, 0) and has a control:
# the old geometry or behaviour, which the same measure must reject.

_NUM = re.compile(r"[-\d.]+")


def _seg(svg: str, name: str) -> str:
    """the markup of the element named `name` (up to the next element)"""
    i = svg.find(f'data-name="{name}"')
    assert i >= 0, f"no element {name} in the frame"
    j = svg.find('class="lm-el"', i + 10)
    return svg[i:j if j > 0 else len(svg)]


def _pts(tag: str) -> list[tuple[float, float]]:
    d = re.search(r' d="([^"]*)"', tag).group(1)
    v = [float(x) for x in _NUM.findall(d)]
    return list(zip(v[0::2], v[1::2]))


def _width(tag: str) -> float:
    m = re.search(r'stroke-width="([\d.]+)"', tag)
    return float(m.group(1)) if m else 0.0


def _seg_dist(p, a, b) -> float:
    (px, py), (ax, ay), (bx, by) = p, a, b
    dx, dy = bx - ax, by - ay
    u = max(0.0, min(1.0, ((px - ax) * dx + (py - ay) * dy) / ((dx * dx + dy * dy) or 1)))
    return ((px - ax - u * dx) ** 2 + (py - ay - u * dy) ** 2) ** 0.5


def _poly_dist(pts, poly) -> float:
    """the least distance from points to the closed polygon `poly` (0 when a point is inside it)"""
    ring = list(poly) + [poly[0]]

    def inside(p):
        s = 0
        for a, b in zip(ring, ring[1:]):
            c = (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0])
            s += (c > 0) - (c < 0)
        return abs(s) == len(poly)
    best = 1e9
    for p in pts:
        if inside(p):
            return 0.0
        for a, b in zip(ring, ring[1:]):
            best = min(best, _seg_dist(p, a, b))
    return best


def _dbg(rep: dict) -> dict:
    return json.loads(next(w["msg"] for w in rep.get("warnings", []) if w.get("code") == "bp_dbg"))


_FIG = """Loom.scene("bp_test", { build(ctx) {
  const W = ctx.engine, D = W.sheet(ctx);
  const f = ctx.el("fig", { x: 0, y: 0, w: 700, h: 120, kind: "text" });
  D.fig(f, "Fig. 1", { sub: "Load balancer, plan view", size: 28, at: 0.2 });
  // control: the first version's geometry (second rule at 1.32 size + 6, sub-title at 1.6 size)
  const b = ctx.el("fig_old", { x: 0, y: 0, w: 700, h: 120, kind: "text" });
  D.letter(b, "Fig. 1", { size: 28, caps: true, at: 0.2, parallel: true, dur: 0.3 });
  D.draw(b, [].concat(W.line(0, 28 * 1.32, 120, 28 * 1.32, { weight: "detail" }), W.line(0, 28 * 1.32 + 6, 120, 28 * 1.32 + 6, { weight: "thin" })), { at: 0.6, parallel: true, dur: 0.2 });
  D.letter(b, "Load balancer, plan view", { y: 28 * 1.6, size: 28 * 0.62, caps: true, pen: "muted", at: 0.9, parallel: true, dur: 0.3 });
}});
"""


def _rule_to_sub_gap(seg: str) -> float:
    """the clear px between the lowest rule (a square-capped stroke) and the top of the sub-title (muted lettering)"""
    paths = re.findall(r"<path [^>]*>", seg)
    rules = [p for p in paths if 'stroke-linecap="square"' in p]
    sub = [p for p in paths if 'stroke="#A9C1E3"' in p and 'stroke-linecap="round"' in p]
    assert len(rules) >= 2 and sub, (len(rules), len(sub))
    low = max(max(y for _, y in _pts(p)) + _width(p) / 2 for p in rules)
    top = min(min(y for _, y in _pts(p)) - _width(p) / 2 for p in sub)
    return top - low


def check_blueprint_fig_rules_clear_the_subtitle():
    """D.fig's double underline is clear of the sub-title by at least 4 px (in the stress test the second rule cut the
    sub-title's capitals on every figure). Control: the first version's geometry, drawn by hand, measures under 4 px."""
    if not which("node"):
        return "skipped (no node)"
    f, rep = _frames(_head([3.0], 4.0) + _FIG, [3.0])
    gap, old = _rule_to_sub_gap(_seg(f[3.0], "fig")), _rule_to_sub_gap(_seg(f[3.0], "fig_old"))
    assert gap >= 4, f"the rule is {gap:.1f} px from the sub-title"
    assert old < 4, f"control: the old geometry measured {old:.1f} px clear"
    return f"rule to sub-title {gap:.1f} px (old geometry {old:.1f} px)"


_CLOUD = """Loom.scene("bp_test", { build(ctx) {
  const W = ctx.engine, D = W.sheet(ctx);
  const r = ctx.el("rev", { x: 0, y: 0, w: 1920, h: 1080, kind: "mark" });
  D.cloud(r, 556, 244, 388, 242, { rev: "B", at: 0.2, by: 1.2 });
  const r2 = ctx.el("rev_sw", { x: 0, y: 0, w: 1920, h: 1080, kind: "mark" });
  D.cloud(r2, 200, 600, 300, 200, { rev: "C", revAt: "sw", r: 34, at: 1.4, by: 2.0 });
  // control: the first version's delta, 14 px off the box corner
  const b = ctx.el("rev_old", { x: 0, y: 0, w: 1920, h: 1080, kind: "mark" });
  const s = 32 * 0.78 + 2, tx = 556 + 388 + 14, ty = 244 - 14;
  D.draw(b, [].concat(W.cloud(556, 244, 388, 242, { weight: "detail" }), W.polygon([tx, ty + s * 1.7, tx + s * 1.9, ty + s * 1.7, tx + s * 0.95, ty], { weight: "detail" })), { at: 0.2, dur: 1.0, parallel: true });
}});
"""


def _delta_clearance(seg: str) -> float:
    sq = [p for p in re.findall(r"<path [^>]*>", seg) if 'stroke-linecap="square"' in p]
    cloud = max(sq, key=lambda p: len(_pts(p)))
    tri = next(p for p in sq if len(_pts(p)) == 4)
    return _poly_dist(_pts(cloud), _pts(tri)[:3]) - (_width(cloud) + _width(tri)) / 2


def check_blueprint_cloud_delta_clears_the_scallops():
    """the revision cloud's delta triangle is at least 6 px clear of the scallops at the default corner and at another one
    (the scallops bulge half a scallop past the box; the first version put the delta 14 px off the box corner, on them).
    Control: the first version's placement, drawn by hand, touches the scallops."""
    if not which("node"):
        return "skipped (no node)"
    f, _ = _frames(_head([3.5], 4.0) + _CLOUD, [3.5])
    ne, sw, old = (_delta_clearance(_seg(f[3.5], n)) for n in ("rev", "rev_sw", "rev_old"))
    assert ne >= 6 and sw >= 6, f"the delta is {ne:.1f} px (ne) and {sw:.1f} px (sw) from the scallops"
    assert ne < 30, f"the delta drifted {ne:.1f} px away from its cloud"
    assert old < 6, f"control: the old placement measured {old:.1f} px clear"
    return f"delta clear by {ne:.1f} px (ne), {sw:.1f} px (sw); old placement {old:.1f} px"


_STAMP = """Loom.scene("bp_test", { build(ctx) {
  const W = ctx.engine, D = W.sheet(ctx);
  const a = ctx.el("tb_a", { x: 0, y: 0, w: 320, h: 200, kind: "card" });
  const A = D.titleBlock(a, [["Title", "Order API"], ["Sheet", "2 of 3"], ["Status", ""]], { at: 0.1, dur: 0.3 });
  A.stamp("Approved", { tone: "accent4", at: 3.0, x: 160, y: -70, rotate: 0 });
  A.fill(1, "3 of 3", 3.2);
  const b = ctx.el("tb_b", { x: 0, y: 400, w: 320, h: 200, kind: "card" });
  const B = D.titleBlock(b, [["Title", ""]], { at: 0.1, dur: 0.3 });
  B.stamp("Approved", { tone: "accent4", at: 3.0, x: 160, y: -70, w: 330, rotate: 0 });
}});
"""


def _stamp_fit(seg: str) -> tuple[float, float, float]:
    """(inner rule width, lettering width, the least margin between the lettering and the inner rule) of a stamp"""
    i = seg.find('stroke-width="1.6"')
    assert i > 0, "no stamp in the element"
    rect = seg[seg.rfind("<rect", 0, i):i]
    x, w = float(re.search(r' x="([-\d.]+)"', rect).group(1)), float(re.search(r' width="([-\d.]+)"', rect).group(1))
    letters = re.findall(r"<path [^>]*>", seg[i:seg.find("</g>", i)])
    xs = [(px, _width(p) / 2) for p in letters for px, _ in _pts(p)]
    lo, hi = min(a - h for a, h in xs), max(a + h for a, h in xs)
    return w, hi - lo, min(lo - x, x + w - hi)


def check_blueprint_stamp_box_fits_its_word():
    """the stamp's box is measured from its lettering: "APPROVED" sits inside the inner rule with a margin, by default
    and when the scene asks for a narrower box (it grows, with a warning). A title-block field filled again replaces its
    value (the stress scene's SHEET read 2 OF 3 on figure 3). Control: the first version's default width (8 letters x
    0.82 x size, at least 260 px) is narrower than the lettering."""
    if not which("node"):
        return "skipped (no node)"
    f, rep = _frames(_head([4.5], 5.0) + _STAMP, [4.5])
    w, lw, margin = _stamp_fit(_seg(f[4.5], "tb_a"))
    w2, _, margin2 = _stamp_fit(_seg(f[4.5], "tb_b"))
    assert margin >= 6 and margin2 >= 6, f"the lettering is {margin:.1f} / {margin2:.1f} px from the inner rule"
    assert any(x.get("code") == "bp_stamp_grown" for x in rep.get("warnings", [])), "a too-narrow w grew without a warning"
    size = (56 * 0.78 + 4) * 0.75
    old_inner = max(260, 8 * size * 0.82) - 16
    assert lw > old_inner, f"control: the old default box ({old_inner:.0f} px inside) held the {lw:.0f} px word"
    seg = _seg(f[4.5], "tb_a")
    k_old, k_new = seg.find(">2 OF 3<"), seg.find(">3 OF 3<")
    assert k_old > 0 and k_new > 0, "the sheet field's values are not on the page"
    g_old = seg[seg.rfind("<g", 0, k_old):k_old]
    assert "opacity:0" in g_old.replace(" ", ""), "the old value 2 OF 3 is still showing under 3 OF 3"
    return f"inner rule {w:.0f} px, word {lw:.0f} px, margin {margin:.1f} px (w 330 grew to {w2:.0f}); old default {old_inner:.0f} px inside; a refill replaces"


_HYPH = """Loom.scene("bp_test", { build(ctx) {
  const W = ctx.engine, D = W.sheet(ctx);
  const a = ctx.el("hy", { x: 0, y: 0, w: 900, h: 60, kind: "text" });
  D.letter(a, "on-call engineer", { size: 30, at: 0.1 });
  const b = ctx.el("minus", { x: 0, y: 100, w: 900, h: 60, kind: "text" });
  D.letter(b, "on\\u2212call engineer", { size: 30, at: 0.1, parallel: true });
}});
"""


def _dash_len(seg: str) -> float:
    flat = [p for p in re.findall(r"<path [^>]*>", seg) if len(_pts(p)) == 2 and abs(_pts(p)[0][1] - _pts(p)[1][1]) < 0.5]
    assert flat, "no horizontal stroke in the lettering"
    return max(abs(_pts(p)[1][0] - _pts(p)[0][0]) for p in flat)


def check_blueprint_hyphen_is_short():
    """a hyphen in the technical hand is a short stroke (at most half the cap height), not the font's minus sign as wide
    as an M ("on-call" read "on - call" in the stress test). Control: a real minus sign keeps the long stroke."""
    if not which("node"):
        return "skipped (no node)"
    f, _ = _frames(_head([3.0], 4.0) + _HYPH, [3.0])
    hy, mi = _dash_len(_seg(f[3.0], "hy")), _dash_len(_seg(f[3.0], "minus"))
    assert hy <= 0.5 * 30, f"the hyphen is {hy:.1f} px long at a 30 px cap"
    assert mi > 0.6 * 30, f"control: the minus sign is {mi:.1f} px"
    return f"hyphen {hy:.1f} px, minus {mi:.1f} px at a 30 px cap"


_SPEED = """Loom.scene("bp_test", { build(ctx) {
  const W = ctx.engine, D = W.sheet(ctx), out = {};
  const phrase = "Cached entries now expire after five minutes";
  const a = ctx.el("a", { x: 100, y: 100, w: 1500, h: 60, kind: "text" });
  out.label = D.letter(a, phrase, { role: "label", at: 1.0 }) - 1.0;
  const a2 = ctx.el("a2", { x: 100, y: 180, w: 1500, h: 80, kind: "text" });
  out.lead = D.letter(a2, phrase, { role: "lead", at: 4.0 }) - 4.0;
  const a3 = ctx.el("a3", { x: 100, y: 280, w: 1500, h: 60, kind: "text" });
  out.slow = D.letter(a3, phrase, { role: "label", at: 7.0, pace: 0.1 }) - 7.0;
  // by: a figure, a balloon, a dimension and the notes title end on their word; the controls have no by
  const f = ctx.el("f", { x: 100, y: 400, w: 600, h: 120, kind: "text" });
  out.fig = D.fig(f, "Fig. 2", { sub: "Request path", at: 11.0, by: 11.7 }).t;
  const f2 = ctx.el("f2", { x: 900, y: 400, w: 600, h: 120, kind: "text" });
  out.figFree = D.fig(f2, "Fig. 2", { sub: "Request path", at: 13.0 }).t - 13.0;
  const bl = ctx.el("bl", { x: 0, y: 0, w: 1920, h: 1080, kind: "label" });
  out.balloon = D.balloon(bl, 3, 300, 600, { to: [420, 700], at: 15.0, by: 16.2 });
  out.balloonFree = D.balloon(bl, 4, 600, 600, { to: [720, 700], at: 16.5 }) - 16.5;
  const dm = ctx.el("dm", { x: 0, y: 0, w: 1920, h: 1080, kind: "label" });
  out.dim = D.dim(dm, 100, 900, 700, 900, { value: 800, unit: "mm", at: 18.0, by: 18.5 }).t;
  out.dimFree = D.dim(dm, 900, 900, 1500, 900, { value: 800, unit: "mm", at: 20.0 }).t - 20.0;
  const nt = ctx.el("nt", { x: 1500, y: 100, w: 360, h: 300, kind: "text" });
  out.notes = D.notes(nt, { title: "General notes", at: 22.0, by: 22.5 }).t;
  // quick: a balloon printed beside the pen while it drafts a long part; the control waits for the pen
  const pt = ctx.el("pt", { x: 0, y: 0, w: 1920, h: 1080, kind: "card" });
  out.penFree = D.draw(pt, W.rect(200, 200, 1400, 600), { at: 24.0, dur: 3.0 });
  out.quick = D.balloon(bl, 5, 900, 150, { to: [900, 200], at: 24.5, quick: true });
  out.waited = D.balloon(bl, 6, 1200, 150, { to: [1200, 200], at: 24.5 });
  // catching up: lettering asked for 1 s before the pen is free starts late and is drawn faster than its natural time
  const c = ctx.el("c", { x: 100, y: 960, w: 1500, h: 60, kind: "text" });
  const waitedTo = out.waited;
  out.late = D.letter(c, phrase, { role: "label", at: waitedTo - 1.0 }) - waitedTo;
  Loom.warn("bp_dbg", JSON.stringify(out));
}});
"""


def check_blueprint_lettering_keeps_pace_and_by_quick_reach_every_call():
    """lettering keeps pace with speech: a seven-word phrase (44 characters) letters in 1.6 to 2.6 s at any size (it took
    3.6 s as a label and 4.5 s as a lead before 2026-10-16, about 1.6 to 1.9 words a second); `by` ends a figure, a
    balloon, a dimension and the notes title on their word; `quick` prints a balloon beside the busy pen; a late run
    catches up. Controls: a slow pace fails the speed bound; the same calls without `by` end elsewhere; the same balloon
    without `quick` waits for the pen."""
    if not which("node"):
        return "skipped (no node)"
    _, rep = _frames(_head([30.0], 32.0) + _SPEED, [30.0])
    o = _dbg(rep)
    for k in ("label", "lead"):
        assert 1.6 <= o[k] <= 2.6, f"the seven-word phrase letters in {o[k]:.2f} s as a {k}"
    assert o["slow"] > 2.6, f"control: a slow pace lettered in {o['slow']:.2f} s"
    for k, by in (("fig", 11.7), ("balloon", 16.2), ("dim", 18.5), ("notes", 22.5)):
        assert abs(o[k] - by) < 0.06, f"{k} ends at {o[k]:.2f}, asked by {by}"
    assert abs(o["figFree"] - 0.7) > 0.3 and abs(o["balloonFree"] - 1.2) > 0.3 and abs(o["dimFree"] - 0.5) > 0.3, \
        f"control: without by the calls end at the same times ({o['figFree']:.2f}, {o['balloonFree']:.2f}, {o['dimFree']:.2f})"
    assert o["quick"] <= 25.1, f"a quick balloon ended at {o['quick']:.2f} (the pen was busy until {o['penFree']:.2f})"
    assert o["waited"] > o["penFree"], f"control: the pen's balloon ended at {o['waited']:.2f}, before the pen was free"
    assert o["late"] < o["label"] - 0.2, f"a late phrase took {o['late']:.2f} s (natural {o['label']:.2f} s)"
    return (f"seven words in {o['label']:.2f} s ({7 / o['label']:.1f} words/s) as a label, {o['lead']:.2f} s as a lead "
            f"(pace 0.1: {o['slow']:.2f} s); by met on fig, balloon, dim, notes; quick balloon done at {o['quick']:.2f} beside "
            f"the pen (busy to {o['penFree']:.2f}); a late phrase {o['late']:.2f} s")


_CONN = """Loom.scene("bp_test", { build(ctx) {
  const W = ctx.engine, D = W.sheet(ctx);
  const el = (n) => ctx.el(n, { x: 0, y: 0, w: 1920, h: 1080, kind: "connector" });
  D.connect(el("c1"), 700, 450, 852, 220, { elbow: "h", at: 0.2, label: "check token", labelSeg: 1, labelSide: "left" });
  D.connect(el("c2"), 1370, 680, 1700, 608, { elbow: "v", at: 0.2, label: "miss", labelSeg: "longest" });
  D.connect(el("c3"), 700, 490, 852, 490, { at: 0.2, label: "route", labelSide: "below" });
  D.connect(el("c4"), 200, 800, 900, 800, { at: 0.2, label: "write", labelAt: 0.2 });
  D.connect(el("c5"), 1100, 300, 1400, 500, { at: 0.2, label: "sloped" });
  // control: a label pushed off by a hand offset (as the stress scene's "check token" was, labelDx -135)
  D.connect(el("c_old"), 700, 450, 852, 220, { elbow: "h", at: 0.2, label: "check token", labelSeg: 1, labelSide: "left", labelDx: -135, labelDy: -40 });
}});
"""


def _label_gap(seg: str) -> tuple[float, bool]:
    """(the least distance from a connector's label box to its line, whether the line runs through the box)"""
    path = next(p for p in re.findall(r"<path [^>]*>", seg) if 'stroke-linecap="square"' in p)
    line = _pts(path)
    t = re.search(r'<text x="([-\d.]+)" y="([-\d.]+)" font-size="([\d.]+)"[^>]*textLength="([\d.]+)"', seg)
    x, y, fs, w = (float(t.group(i)) for i in range(1, 5))
    cap = fs * 0.72
    box = [(x, y - cap), (x + w, y - cap), (x + w, y), (x, y)]
    samples = []
    for a, b in zip(line, line[1:]):
        n = max(1, int(((b[0] - a[0]) ** 2 + (b[1] - a[1]) ** 2) ** 0.5))
        samples += [(a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n) for k in range(n + 1)]
    d = _poly_dist(samples, box)
    return d, d == 0.0


def check_blueprint_connector_labels_sit_on_their_line():
    """a connector's label sits beside its own line (3 to 20 px from it, never across it) at the point asked for: a
    segment (by index or "longest"), a side, a position along the path, a sloped run. Control: a label pushed off by a
    hand offset (the stress scene's way round the old midpoint placement) measures more than 20 px away."""
    if not which("node"):
        return "skipped (no node)"
    f, _ = _frames(_head([2.5], 3.0) + _CONN, [2.5])
    got = {n: _label_gap(_seg(f[2.5], n)) for n in ("c1", "c2", "c3", "c4", "c5", "c_old")}
    for n in ("c1", "c2", "c3", "c4", "c5"):
        d, crosses = got[n]
        assert not crosses and 3 <= d <= 20, f"{n}: the label is {d:.1f} px from its line (crosses: {crosses})"
    assert got["c_old"][0] > 20, f"control: the offset label measured {got['c_old'][0]:.1f} px"
    return "labels " + ", ".join(f"{n} {got[n][0]:.1f} px" for n in ("c1", "c2", "c3", "c4", "c5")) + f"; offset label {got['c_old'][0]:.1f} px"



# ---------------------------------------------------------------- the wow pass (2026-10-16, docs/research/2026-10-16-wow-hologram-blueprint.md)

def _attr(tag: str, a: str) -> str | None:
    m = re.search(rf'\s{a}="([^"]*)"', tag)
    return m.group(1) if m else None


def _first(seg: str, cls: str) -> str:
    m = re.search(rf'<[a-zA-Z]+ [^>]*class="{cls}"[^>]*>', seg)
    return m.group(0) if m else ""


def _all(seg: str, cls: str) -> list[str]:
    return re.findall(rf'<[a-zA-Z]+ [^>]*class="{cls}"[^>]*>', seg)


_LOOK = """Loom.scene("bp_test", { build(ctx) {
  const W = ctx.engine, D = W.sheet(ctx);
  const back = ctx.el("back", { x: 0, y: 0, w: 1920, h: 1080, kind: "mark" });
  const front = ctx.el("front", { x: 600, y: 300, w: 400, h: 300, kind: "card" });
  const mover = ctx.el("mover", { x: 1200, y: 300, w: 300, h: 300, kind: "card" });
  const later = ctx.el("later", { x: 0, y: 0, w: 1920, h: 1080, kind: "mark" });
  D.draw(back, W.line(100, 450, 1800, 450), { at: 0.1, dur: 0.4 });
  D.part(front, { outline: W.rect(0, 0, 400, 300) }, { at: 1.0, by: 1.6 });
  D.draw(later, W.line(100, 470, 1800, 470), { at: 1.8, dur: 0.3 });
  D.part(mover, { outline: W.rect(0, 0, 300, 300) }, { at: 2.2, by: 2.6 });
  ctx.m.travel(mover, 3.5, { x: 200, y: 0, dur: 0.6 });
  // control: a sheet with the look off (a flat, solid paper and no bloom)
  const D2 = W.sheet(ctx, { occlude: false, glow: false });
  const pb = ctx.el("plain_back", { x: 0, y: 0, w: 1920, h: 1080, kind: "mark" });
  const pf = ctx.el("plain_front", { x: 600, y: 700, w: 400, h: 200, kind: "card" });
  D2.draw(pb, W.line(100, 800, 1800, 800), { at: 0.1, dur: 0.4, parallel: true });
  D2.part(pf, { outline: W.rect(0, 0, 400, 200) }, { at: 1.0, by: 1.6 });
}});
"""


def _holes(seg: str) -> list[str]:
    return _all(seg, "lm-bp-hole")


def _op(tag: str) -> float:
    v = _attr(tag, "opacity")
    m = re.search(r"opacity:\s*([\d.]+)", tag)
    return float(m.group(1)) if m else float(v) if v is not None else 1.0


def check_blueprint_paper_shows_and_occlusion_holds():
    """a part's paper is translucent (the sheet shows through it) while what is BEHIND it is hidden by a mask from the
    moment its paper is down; a part painted above it is not masked; a part that moves closes its holes and turns nearly
    solid; every element's ink has the bloom and the nib glows. Controls: before the paper is down the hole is shut; a
    sheet with the look off has no masks, a solid paper and no bloom."""
    if not which("node"):
        return "skipped (no node)"
    times = [0.8, 3.0, 4.6]
    f, rep = _frames(_head(times, 5.0) + _LOOK, times)
    back0, back1 = _seg(f[0.8], "back"), _seg(f[3.0], "back")
    assert 'mask="url(#' in _first(back1, "lm-bp-ink"), "the line behind the part is not masked"
    h0, h1 = _holes(back0), _holes(back1)
    assert h1 and any(_op(h) > 0.5 for h in h1), "the hole under the part is shut after its paper is down"
    assert all(_op(h) < 0.5 for h in h0), "control: a hole was open before the part's paper was down"
    paper = _first(_seg(f[3.0], "front"), "lm-bp-paper")
    alpha = float(_attr(paper, "fill-opacity"))
    assert 0.15 <= alpha <= 0.5, f"the part's paper is {alpha} opaque (the sheet should show through)"
    assert "mask=" not in _first(_seg(f[3.0], "later"), "lm-bp-ink"), "a line painted ABOVE the part was masked"
    # the mover: holes open while still, shut once it travels, its paper nearly solid then
    mv_holes_3 = [h for h in _holes(_seg(f[3.0], "back"))]
    mv_holes_46 = [h for h in _holes(_seg(f[4.6], "back"))]
    assert len(mv_holes_3) >= 2 and sum(_op(h) > 0.5 for h in mv_holes_3) == 2, "both parts should hide the line at 3.0 s"
    assert sum(_op(h) > 0.5 for h in mv_holes_46) == 1, "the moving part's hole stayed open after it moved"
    mp = float(_attr(_first(_seg(f[4.6], "mover"), "lm-bp-paper"), "fill-opacity"))
    assert mp >= 0.9, f"the moving part's paper is {mp} (it should turn solid while its holes are shut)"
    assert _attr(_first(back1, "lm-bp-ink"), "filter") == "url(#lm-bp-glow)", "the ink has no bloom"
    assert f[3.0].count("feGaussianBlur") >= 2 and 'id="lm-bp-glow"' in f[3.0], "the bloom filter is missing"
    assert 'filter="url(#lm-bp-soft-nib)"' in f[3.0], "the nib does not glow"
    # control: the look off
    pb, pf = _seg(f[3.0], "plain_back"), _seg(f[3.0], "plain_front")
    assert "mask=" not in _first(pb, "lm-bp-ink") and "filter=" not in _first(pb, "lm-bp-ink"), "control: the plain sheet was masked or bloomed"
    assert float(_attr(_first(pf, "lm-bp-paper"), "fill-opacity")) == 1.0, "control: the plain sheet's paper is not solid"
    assert not (rep.get("errors") or []), rep["errors"][:3]
    return f"paper {alpha}; line behind hidden from the paper's time; a part above unmasked; the mover's hole shuts and its paper turns {mp}; bloom and nib glow; look off: no mask, solid paper"


def check_blueprint_occlusion_reads_on_the_paper():
    """in Chrome, on the cyanotype paper: a line behind a part disappears inside the part, the paper's mottle shows
    through the part, and the part's own outline is bright. Control: the same part with a solid paper (paperAlpha 1)
    shows far less of the paper's texture. Needs a browser."""
    if not browser():
        return "skipped (no browser here)"
    from loom import lab as LB
    from PIL import Image
    src = ('// @lab {"title": "occlusion", "styles": ["blueprint"], "fx": {"background": "cyanotype", "vignette": 0.32}, "dur": 4.0, "times": [3.5]}\n'
           'Loom.scene("bp_occl", { build(ctx) {\n'
           '  const W = ctx.engine, D = W.sheet(ctx), D2 = W.sheet(ctx, { paperAlpha: 1 });\n'
           '  const back = ctx.el("back", { x: 0, y: 0, w: 1920, h: 1080, kind: "mark" });\n'
           '  D.draw(back, [].concat(W.line(80, 400, 1840, 400), W.line(80, 760, 1840, 760)), { at: 0.1, dur: 0.6 });\n'
           '  const a = ctx.el("a", { x: 300, y: 250, w: 520, h: 640, kind: "card" });\n'
           '  D.part(a, { outline: W.rect(0, 0, 520, 640) }, { at: 1.0, by: 1.8 });\n'
           '  const b = ctx.el("b", { x: 1100, y: 250, w: 520, h: 640, kind: "card" });\n'
           '  D2.part(b, { outline: W.rect(0, 0, 520, 640) }, { at: 1.0, by: 1.8 });\n'
           '}});\n')
    d = Path(tempfile.mkdtemp(prefix="loombpo_"))
    try:
        fsrc = d / "bp_occl.js"
        fsrc.write_text(src, encoding="utf-8")
        r = LB.strip("bp_occl", "blueprint", [3.5], out_dir=d, frames_dir=d / "f", file=fsrc)
        assert not r["errors"], r["errors"][:3]
        png = next((d / "f").glob("*.png"))
        im = Image.open(png).convert("L")
        px = im.load()
        lum = lambda x, y: px[x, y]  # noqa: E731
        line_out, line_in = lum(200, 400), lum(560, 400)
        paper_near = (lum(560, 380) + lum(560, 420)) / 2
        assert line_out - paper_near > 60, f"the line outside the part is not bright ({line_out} on {paper_near})"
        assert abs(line_in - paper_near) < 18, f"the line shows through the part ({line_in} on {paper_near})"
        def spread(x0, y0):
            v = [lum(x, y) for x in range(x0, x0 + 400, 4) for y in range(y0, y0 + 160, 4)]
            m = sum(v) / len(v)
            return (sum((a - m) ** 2 for a in v) / len(v)) ** 0.5
        open_, solid = spread(360, 450), spread(1160, 450)
        assert open_ > 1.6 * solid, f"control: the translucent part shows no more texture ({open_:.2f}) than a solid one ({solid:.2f})"
        return f"line {line_out} outside, {line_in} inside on paper {paper_near:.0f}; texture spread {open_:.2f} translucent vs {solid:.2f} solid"
    finally:
        shutil.rmtree(d, ignore_errors=True)


_SOLID = """Loom.scene("bp_test", { build(ctx) {
  const W = ctx.engine, D = W.sheet(ctx);
  const box = ctx.el("box", { x: 300, y: 300, w: 800, h: 500, kind: "card" });
  const t = D.extrude(box, [[100, 200], [500, 200], [500, 400], [100, 400]], { at: 0.2, by: 1.0, turnAt: 1.5, dur: 1.2, ratio: 0.4 });
  Loom.warn("bp_dbg", JSON.stringify({ t, solid: D.lastSolid }));
}});
"""


def check_blueprint_extrude_grows_a_shaded_object():
    """D.extrude drafts a flat face, then grows depth: the faces the oblique view can see (top and right for the default
    angle) are shaded, the top lit and the side in shadow, edged in the outline weight; the edges it cannot see are
    hidden lines. Control: before the turn the drawing is flat (no edges, no faces)."""
    if not which("node"):
        return "skipped (no node)"
    times = [1.2, 2.1, 3.0]
    f, rep = _frames(_head(times, 3.5) + _SOLID, times)
    o = _dbg(rep)
    vis = sorted(tuple(x["edge"]) for x in o["solid"]["faces"] if x["visible"])
    assert vis == [(0, 1), (1, 2)], f"visible faces {vis} (the top and the right expected)"
    lit = [x for x in o["solid"]["faces"] if x["visible"] and x["lit"]]
    assert len(lit) == 1 and tuple(lit[0]["edge"]) == (0, 1), "the top face is not the lit one"
    flat_, mid, end = (_seg(f[t], "box") for t in times)
    assert not _attr(_first(flat_, "lm-bp-edges"), "d"), "control: depth showed before the turn"
    for seg in (mid, end):
        assert _attr(_first(seg, "lm-bp-edges"), "d") and _attr(_first(seg, "lm-bp-hidden"), "d"), "the object has no visible or hidden edges"
        faces = [x for x in _all(seg, "lm-bp-face") if _attr(x, "d")]
        assert len(faces) == 2, f"{len(faces)} shaded faces"
    pts_mid = _pts('<p d="' + _attr(_first(mid, "lm-bp-edges"), "d") + '">')
    pts_end = _pts('<p d="' + _attr(_first(end, "lm-bp-edges"), "d") + '">')
    assert max(x for x, _ in pts_mid) < max(x for x, _ in pts_end), "the depth did not grow"
    return f"top lit and right shaded, back edges hidden; flat before the turn; depth {o['solid']['depth']:.0f} px grows"


_MECH = """Loom.scene("bp_test", { build(ctx) {
  const W = ctx.engine, D = W.sheet(ctx);
  const g = ctx.el("gears", { x: 200, y: 200, w: 900, h: 500, kind: "card" });
  const M = D.mechanism(g, [{ gear: [200, 250, 104, 22] }, { gear: [354.6, 250, 62, 13], link: "mesh" }, { gear: [640, 250, 46, 10], link: "chain" }], { at: 0.2, by: 2.0, from: 2.0, to: 6.0, rps: 0.25 });
  const b = ctx.el("belt", { x: 1100, y: 200, w: 700, h: 500, kind: "card" });
  const B = D.mechanism(b, [{ pulley: [100, 250, 40] }, { pulley: [460, 250, 80], link: "belt", icon: "fan" }], { at: 0.2, by: 2.0, from: 2.0, to: 6.0, rps: 1, parallel: true });
  const bad = ctx.el("bad", { x: 0, y: 0, w: 10, h: 10, kind: "card" });
  D.mechanism(bad, [{ gear: [0, 0, 104, 22] }, { gear: [200, 0, 62, 13], link: "mesh" }], { at: 2.2, by: 3.0, from: 9, to: 9.5 });
  Loom.warn("bp_dbg", JSON.stringify({ g: M.omega, b: B.omega }));
}});
"""


def _rot(seg: str) -> list[float]:
    out = []
    for tag in _all(seg, "lm-bp-wheel"):
        m = re.search(r"rotate\(([-\d.]+)", tag)
        out.append(float(m.group(1)) if m else 0.0)
    return out


def check_blueprint_mechanism_turns_by_its_ratios():
    """D.mechanism turns its parts by their links: a meshed gear the other way by the tooth ratio, a chained or belted
    one the same way by the radius ratio, from `from` on; belt and chain links run; an `icon` turns with its wheel; two
    gears that cannot mesh at their distance warn bp_mesh_fit. Controls: before `from` nothing has turned; a gear pair
    placed at the right distance does not warn."""
    if not which("node"):
        return "skipped (no node)"
    times = [1.5, 3.0, 5.0]
    f, rep = _frames(_head(times, 6.5) + _MECH, times)
    o = _dbg(rep)
    g, b = o["g"], o["b"]
    assert abs(g[1] + g[0] * 22 / 13) < 1e-6 and abs(g[2] - g[1] * 62 / 46) < 1e-6, f"gear speeds {g}"
    assert abs(b[1] - b[0] * 40 / 80) < 1e-6 and b[1] > 0, f"pulley speeds {b}"
    r0, r1, r2 = (_rot(_seg(f[t], "gears")) for t in times)
    assert all(abs(a) < 1e-6 for a in r0), f"control: the gears turned before from ({r0})"
    assert abs(r1[0] - g[0] * 1.0) < 0.05 and abs(r2[0] - g[0] * 3.0) < 0.05, f"gear A at {r1[0]}, {r2[0]}"
    assert r1[1] < 0 < r1[0], "the meshed gear turns the same way"
    b1, b2 = (_rot(_seg(f[t], "belt")) for t in (3.0, 5.0))
    assert b2[1] > b1[1] > 0, "the belted pulley is not turning"
    links = [_attr(x, "stroke-dashoffset") for x in (_first(_seg(f[t], "belt"), "lm-bp-links") for t in (3.0, 5.0))]
    assert links[0] != links[1], "the belt's links do not run"
    fan = _seg(f[3.0], "belt")
    k = fan.find('class="lm-bp-wheel"', fan.find('class="lm-bp-wheel"') + 5)
    assert fan[k:].count("<path") > 8, "the fan icon is not on its wheel"
    fits = [w for w in rep.get("warnings", []) if w.get("code") == "bp_mesh_fit"]
    assert len(fits) == 1 and '"bad"' in fits[0]["msg"], f"bp_mesh_fit warnings: {[w['msg'] for w in fits]}"
    return f"gear deg/s {', '.join(f'{x:.1f}' for x in g)}; belt {b[0]:.0f} to {b[1]:.0f}; still before from; links run; one misplaced pair warns"


_ICON = """Loom.scene("bp_test", { build(ctx) {
  const W = ctx.engine, D = W.sheet(ctx);
  const a = ctx.el("ic", { x: 0, y: 0, w: 1920, h: 1080, kind: "label" });
  D.icon(a, "server", 100, 100, 240, { at: 0.2, dur: 0.8 });
  D.icon(a, "settings", 500, 100, 240, { at: 1.0, dur: 0.8 });
  const n = W.icon("no-such-icon", 900, 100, 240);
  Loom.warn("bp_dbg", JSON.stringify({ n: n.length, server: W.icon("server", 100, 100, 240).length, cog: W.icon("settings", 500, 100, 240).length }));
}});
"""


def check_blueprint_icon_traces_in_the_drafting_line():
    """D.icon traces a Lucide icon (rects, lines, circles and paths with arcs and curves, parsed with no DOM) as pen
    strokes inside its box; an unknown name is an error and draws nothing. Control: the unknown icon gives no strokes."""
    if not which("node"):
        return "skipped (no node)"
    f, rep = _frames(_head([2.5], 3.0) + _ICON, [2.5])
    o = _dbg(rep)
    assert o["server"] >= 4 and o["cog"] >= 2, f"strokes: server {o['server']}, settings {o['cog']}"
    assert o["n"] == 0, "control: an unknown icon drew strokes"
    assert any(e.get("code") == "bp_icon_unknown" for e in rep.get("errors") or []), "an unknown icon was not an error"
    seg = _seg(f[2.5], "ic")
    pts = [p for tag in re.findall(r"<path [^>]*>", seg) if "stroke-dasharray" in tag for p in _pts(tag)]
    inside = [(x, y) for x, y in pts if 90 <= x <= 750 and 90 <= y <= 350]
    assert len(inside) == len(pts) and len(pts) > 60, f"{len(pts) - len(inside)} of {len(pts)} points outside the icons' boxes"
    drawn = [tag for tag in re.findall(r"<path [^>]*>", seg) if "stroke-dasharray" in tag]
    assert drawn and all(_shown(t) for t in drawn), "the icons are not drawn at the end"
    return f"server {o['server']} strokes, settings {o['cog']} strokes, all inside their boxes; an unknown name errors and draws nothing"


_HERO = """Loom.scene("bp_test", { build(ctx) {
  const W = ctx.engine, D = W.sheet(ctx);
  const back = ctx.el("traces", { x: 0, y: 0, w: 1920, h: 1080, kind: "mark" });
  D.draw(back, [].concat(W.line(100, 500, 1800, 500), W.line(100, 560, 1800, 560)), { at: 0.1, dur: 0.4 });
  const h = ctx.el("chip", { x: 700, y: 400, w: 300, h: 300, kind: "card" });
  const t = D.hero(h, W.roundRect(0, 0, 200, 200, 10), { at: 1.0, by: 2.0, shadow: [22, 28] });
  const h2 = ctx.el("chip2", { x: 1200, y: 400, w: 300, h: 300, kind: "card" });
  D.hero(h2, W.circle(100, 100, 80), { at: 2.4, by: 3.0, shadow: false });
  const h3 = ctx.el("chip3", { x: 200, y: 700, w: 300, h: 300, kind: "card" });
  D.hero(h3, W.circle(100, 100, 60), { at: 3.2, by: 3.6, another: true });
  Loom.warn("bp_dbg", JSON.stringify({ t }));
}});
"""


def check_blueprint_hero_has_volume_glow_and_a_shadow():
    """D.hero drafts the one real thing, then gives it a gradient volume, a glow and a shadow offset across the lines
    under it (it also hides them, like a part); a second hero on one sheet warns unless it says `another`. Controls:
    before the outline is drafted, the volume and shadow are not there; `shadow: false` has none."""
    if not which("node"):
        return "skipped (no node)"
    times = [0.9, 3.9]
    f, rep = _frames(_head(times, 4.5) + _HERO, times)
    early, late = _seg(f[0.9], "chip"), _seg(f[3.9], "chip")
    sh, vol, halo = _first(late, "lm-bp-shadow"), _first(late, "lm-bp-volume"), _first(late, "lm-bp-halo")
    assert sh and "translate(22 28)" in sh and _op(sh) > 0.6, f"the shadow: {sh[:160]}"
    assert vol and _attr(vol, "fill").startswith("url(#lm-bp-vol") and _op(vol) > 0.9, "the volume has no gradient"
    gid = _attr(vol, "fill")[5:-1]
    gi = f[3.9].find(f'id="{gid}"')
    assert gi > 0 and f[3.9][gi:f[3.9].find("</linearGradient>", gi)].count("<stop") == 3, "the volume's gradient is missing"
    assert halo and _op(halo) > 0.2, "the hero has no glow"
    assert late.find("lm-bp-shadow") < late.find("lm-bp-ink"), "the shadow is drawn over the hero's own lines"
    assert _op(_first(early, "lm-bp-shadow")) < 0.05 and _op(_first(early, "lm-bp-volume")) < 0.05, "control: the volume showed before the outline"
    assert any(_op(h) > 0.5 for h in _holes(_seg(f[3.9], "traces"))), "the lines under the hero are not hidden"
    assert not _first(_seg(f[3.9], "chip2"), "lm-bp-shadow"), "control: shadow false still drew a shadow"
    twice = [w for w in rep.get("warnings", []) if w.get("code") == "bp_hero_twice"]
    assert len(twice) == 1 and "chip2" in twice[0]["msg"], f"bp_hero_twice: {[w['msg'] for w in twice]}"
    return "volume (3-stop gradient), glow and a shadow at (22, 28) under the lines; hidden traces; none before the outline; a second hero warns"


_CAM = """Loom.scene("bp_test", { build(ctx) {
  const W = ctx.engine, D = W.sheet(ctx);
  const sheet = ctx.el("sheet", { x: 0, y: 0, w: 1920, h: 1080, kind: "card" });
  const p = ctx.el("part", { x: 600, y: 300, w: 400, h: 300, kind: "card", parent: sheet.inner });
  D.part(p, { outline: W.rect(0, 0, 400, 300) }, { at: 0.2, by: 1.0 });
  const C = D.camera(sheet);
  C.close({ x: 600, y: 300, w: 400, h: 300 }, 1.5, { cut: true });
  const t1 = C.track([[700, 400], [900, 500]], 2.0, 1.0, { zoom: 2 });
  const t2 = C.establish(3.5, 0.3);
  const t3 = C.pan([{ x: 0, y: 0, w: 960, h: 540 }, { x: 960, y: 540, w: 960, h: 540 }], 4.2, 0.4, { hold: 0.3 });
  D.draw(p, W.line(50, 150, 350, 150), { at: 1.6, dur: 0.6 });
  Loom.warn("bp_dbg", JSON.stringify({ t1, t2, t3 }));
}});
"""


def _scale(seg: str) -> float:
    m = re.search(r'class="lm-mv"[^>]*transform="[^"]*scale\(([\d.]+)', seg) or re.search(r'class="lm-mv"[^>]*style="[^"]*scale\(([\d.]+)', seg)
    if m:
        return float(m.group(1))
    m = re.search(r'class="lm-mv"[^>]*(?:transform="|style="transform:\s*)matrix\(([\d.]+)', seg)
    return float(m.group(1)) if m else 1.0


def check_blueprint_camera_frames_the_sheet():
    """D.camera(sheetEl) moves the camera over a sheet drawn inside one element: a close-up (a cut), a track along a
    path, an establishing shot of the whole sheet, a pan across figures; the nib draws inside the sheet so it moves with
    it. Control: before the first move the sheet is at scale 1."""
    if not which("node"):
        return "skipped (no node)"
    times = [1.2, 1.7, 3.9, 4.5]
    f, rep = _frames(_head(times, 5.5) + _CAM, times)
    s = {t: _scale(_seg(f[t], "sheet")) for t in times}
    assert abs(s[1.2] - 1) < 0.01, f"control: the sheet was scaled {s[1.2]} before the camera moved"
    assert s[1.7] > 2.5, f"the close-up is at scale {s[1.7]}"
    assert abs(s[3.9] - 1) < 0.02, f"the establishing shot is at scale {s[3.9]}"
    assert s[4.5] > 1.5, f"the pan frames a figure at scale {s[4.5]}"
    nib_at = f[1.7].find("lm-bp-nib")
    assert nib_at > f[1.7].find('data-name="sheet"'), "the nib is not inside the sheet while it draws under the camera"
    return "scale " + ", ".join(f"{t}s {v:.2f}" for t, v in s.items()) + "; the nib draws inside the sheet"
