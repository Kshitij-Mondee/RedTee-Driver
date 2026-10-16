"""The isometric infographic engine (2026-10-16, runtime/engines/isometric.js): an isometric board in two registers
(teaching and detail). Offline tests run the real runtime and engine in Node (tools/node/svg_preview.mjs, the same path
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
    """build a lab page for a scene source in the isometric style and render it in Node: ({time: svg text}, report)"""
    from loom import lab
    d = Path(tempfile.mkdtemp(prefix="loomiso_"))
    try:
        f = d / "scene.js"
        f.write_text(scene_src, encoding="utf-8")
        tmp, meta, st, ts = lab.page("iso_test", "isometric", times, file=f)
        out = tmp / "preview"
        r = subprocess.run([which("node") or "node", str(ROOT / "tools/node/svg_preview.mjs"), str(tmp), str(out)],
                           capture_output=True, text=True, timeout=300)
        rep = json.loads((out / "report.json").read_text(encoding="utf-8")) if (out / "report.json").exists() else {}
        assert r.returncode == 0 and rep, f"the node preview failed: {r.stderr[-800:]}"
        assert not rep.get("preview_errors") or all(e.startswith("note:") for e in rep["preview_errors"]), rep.get("preview_errors")
        shots = {round(float(s["t"]), 2): Path(s["file"]).read_text(encoding="utf-8") for s in rep["shots"]}
        shutil.rmtree(tmp, ignore_errors=True)
        return shots, rep
    finally:
        shutil.rmtree(d, ignore_errors=True)


def _head(times, dur=6.0):
    return '// @lab {"title": "test", "styles": ["isometric"], "dur": %s, "times": %s}\n' % (dur, json.dumps(times))


def _codes(rep) -> list[str]:
    return [w.get("code") for w in (rep.get("warnings") or [])] + [e.get("code") for e in (rep.get("errors") or [])]


def check_isometric_engine_lints_and_switches():
    """the engine passes the engine lint (and the lint catches a clock in a copy of it); a lesson uses it unless its
    request says engine off, and only then does get_style_pack carry the engine's guide. Control: engine off gives no
    guide; a copy with Math.random() is refused."""
    from loom import engines as EN
    f = EN.ENGINES_DIR / "isometric.js"
    assert EN.lint(f) == [], EN.lint(f)
    d = Path(tempfile.mkdtemp(prefix="loomisolint_"))
    try:
        bad = d / "isometric.js"
        bad.write_text(f.read_text(encoding="utf-8") + "\nconst jitter = Math.random();\n", encoding="utf-8")
        errs = EN.lint(bad)
        assert any("Math.random" in e for e in errs), f"control: the lint missed Math.random: {errs}"
    finally:
        shutil.rmtree(d, ignore_errors=True)

    class P_:
        def __init__(self, req): self.request = req
    assert EN.enabled_for(P_({}), "isometric") and not EN.enabled_for(P_({"engine": "off"}), "isometric")
    from loom.agents import tools as T

    class C_:
        def __init__(self, req): self.project = P_(dict(req, style="isometric"))
    on, off = T.t_get_style_pack(C_({})), T.t_get_style_pack(C_({"engine": "off"}))
    assert "W.board(ctx" in on.get("engine_text", "") and "engine_text" not in off
    return "lint clean (and a clock is caught); the switch and the engine guide follow the request"


_ORDER = """Loom.scene("iso_test", { build(ctx) {
  const W = ctx.engine, B = W.board(ctx, { name: "b", size: [12, 9], at: 0 });
  const hall = B.put("box", { name: "hall", x: 4, y: 2, w: 3, d: 3, h: 3, tok: "concrete" });
  const r = B.route("r", [[0, 1], [10, 1], [10, 6.5], [0, 6.5]], { at: null, hidden: true });
  const tr = B.put("truck", { name: "truck", route: r, tok: "accent", subject: true });
  tr.travel(r, 0.5, { dur: 8, ease: "linear" });
}});
"""


def _index(svg: str, name: str) -> int:
    i = svg.find(f'class="lm-iso-item" data-kind')
    m = [x.start() for x in re.finditer(r'<g class="lm-iso-item" data-kind="[^"]*" data-name="%s"' % re.escape(name), svg)]
    assert m, f"no item {name} in the frame"
    return m[0]


def check_isometric_painters_order_follows_a_mover_and_is_the_same_twice():
    """a truck driving round a tall building: on the road behind it the truck is drawn BEFORE the building (hidden by
    it); on the road in front, AFTER it; the order is recomputed from the time alone, so two builds give the same
    frames. Control: the two times give different orders and different frames."""
    if not which("node"):
        return "skipped (no node)"
    times = [2.23, 6.77]
    a, rep = _frames(_head(times, 10.0) + _ORDER, times)
    b, _ = _frames(_head(times, 10.0) + _ORDER, times)
    assert a == b, "the same scene drew different frames in two builds"
    assert a[2.23] != a[6.77], "control: two times gave the same frame"
    back, front = a[2.23], a[6.77]
    assert _index(back, "truck") < _index(back, "hall"), "behind the building the truck was drawn after it (in front)"
    assert _index(front, "truck") > _index(front, "hall"), "in front of the building the truck was drawn before it (hidden)"
    assert "iso_order" not in _codes(rep), [w for w in rep.get("warnings", []) if w.get("code") == "iso_order"]
    return "truck behind the hall at 2.2 s, in front at 6.8 s; the same frames twice"


_INTERSECT = """Loom.scene("iso_test", { build(ctx) {
  const W = ctx.engine, B = W.board(ctx, { name: "b", size: [8, 8], at: 0 });
  B.put("box", { name: "p", x: 2, y: 2, w: 3, d: 1, h: 1 });
  B.put("box", { name: "q", x: 3, y: 1.5, w: 1, d: 2.5, h: 0.6 });
}});
"""


def check_isometric_order_check_names_boxes_that_cannot_be_sorted():
    """two solids that occupy the same space have no true painter's order: the board's audit names them (iso_order).
    Control: the truck-and-building scene, whose boxes only touch or stand apart, raises nothing."""
    if not which("node"):
        return "skipped (no node)"
    _, rep = _frames(_head([0.5], 2.0) + _INTERSECT, [0.5])
    assert "iso_order" in _codes(rep), f"two crossing boxes were not named: {_codes(rep)}"
    _, rep2 = _frames(_head([0.5], 10.0) + _ORDER, [0.5])
    assert "iso_order" not in _codes(rep2), _codes(rep2)
    return "crossing boxes named; clean scene silent"


_FOCUS = """Loom.scene("iso_test", { build(ctx) {
  const W = ctx.engine, B = W.board(ctx, { name: "b", size: [8, 6], at: 0 });
  const a = B.put("box", { name: "a", x: 1, y: 2, w: 1.5, d: 1.5, h: 1.5, tok: "accent", subject: true });
  const b = B.put("box", { name: "b2", x: 5, y: 2, w: 1.5, d: 1.5, h: 1.5, tok: "accent2" });
  B.focus([a], 1.0, { dur: 0.5 });
}});
"""


def _fills(svg: str, name: str) -> list[str]:
    i = _index(svg, name)
    j = svg.find('class="lm-iso-item"', i + 20)
    # the faces (each carries a stroke of its own colour against seams); the cast shadow polygon has none
    return re.findall(r'<polygon points="[^"]*" fill="(#[0-9a-fA-F]{6})" stroke="#', svg[i:j if j > 0 else len(svg)])


def _rgb(h):
    return [int(h[k:k + 2], 16) for k in (1, 3, 5)]


def _luma(h):
    r, g, b = _rgb(h)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def check_isometric_three_tones_and_focus_plus_context():
    """a solid shows three tones of its token, the top lightest and the right face darkest; under focus+context the
    other solid turns grey (its own lightness) while the subject keeps its hue exactly. Control: before the focus the
    other solid is in colour."""
    if not which("node"):
        return "skipped (no node)"
    times = [0.5, 2.0]
    f, rep = _frames(_head(times, 3.0) + _FOCUS, times)
    before_b, after_b = _fills(f[0.5], "b2"), _fills(f[2.0], "b2")
    a0, a1 = _fills(f[0.5], "a"), _fills(f[2.0], "a")
    assert len(set(before_b[:3])) == 3, f"a box should show three tones: {before_b}"
    ls = sorted(_luma(c) for c in before_b[:3])
    assert ls[2] - ls[0] > 20, f"the tones are too close to read: {before_b[:3]}"
    grey = lambda c: max(_rgb(c)) - min(_rgb(c)) < 22  # noqa: E731  (grey lifted toward the cool field)
    assert not any(grey(c) for c in before_b[:3]), f"control: the other box was grey before the focus: {before_b}"
    assert all(grey(c) for c in after_b[:3]), f"the other box did not turn to context grey: {after_b}"
    assert a0[:3] == a1[:3], f"the subject changed colour under its own focus: {a0} -> {a1}"
    return f"three tones {before_b[:3]}; context {after_b[:3]}; subject kept {a1[:3]}"


_TALLY = """Loom.scene("iso_test", { build(ctx) {
  const W = ctx.engine, B = W.board(ctx, { name: "b", size: [6, 6], at: 0, plinth: false });
  const E = ctx.el("tally", { x: 1200, y: 120, w: 560, h: 400, kind: "card" });
  B.tally(E, { n: 8, per: 125, total: TOTAL, icon: "truck", tok: "accent2", cols: 8, title: "Deliveries", label: "parcels", at: 0.5, by: 2.5 });
}});
"""


def _numbers(svg: str) -> list[str]:
    return re.findall(r">(\d{1,3}(?:,\d{3})*)<", svg)


def check_isometric_tally_adds_up_and_counts_with_its_units():
    """an Isotype tally's number is always the units on screen times their value: 1,000 when all eight 125s are there,
    a multiple of 125 on the way; a total that does not add up is an error (iso_count_mismatch). Control: the right
    total raises nothing."""
    if not which("node"):
        return "skipped (no node)"
    times = [1.2, 3.2]
    f, rep = _frames(_head(times, 4.0) + _TALLY.replace("TOTAL", "1000"), times)
    assert "iso_count_mismatch" not in _codes(rep), _codes(rep)
    end = [int(x.replace(",", "")) for x in _numbers(f[3.2])]
    mid = [int(x.replace(",", "")) for x in _numbers(f[1.2])]
    assert 1000 in end, f"the tally does not read 1,000 at the end: {end}"
    assert any(0 < v < 1000 and v % 125 == 0 for v in mid), f"midway the count is not a whole number of units: {mid}"
    _, rep2 = _frames(_head([0.6], 4.0) + _TALLY.replace("TOTAL", "999"), [0.6])
    assert "iso_count_mismatch" in _codes(rep2), f"a total that does not add up was not caught: {_codes(rep2)}"
    data = [d for d in rep.get("data", []) if d.get("builder") == "iso_tally"]
    assert data and data[0]["values"]["total"] == 1000, data
    return f"mid {mid}, end {end}; 999 caught; the report holds the tally for the grounding checks"


_PIN = """Loom.scene("iso_test", { build(ctx) {
  const W = ctx.engine, B = W.board(ctx, { name: "b", size: [12, 8], at: 0 });
  const a = B.put("box", { name: "a", x: 2, y: 2, w: 1, d: 1, h: 1, tok: "accent2" });
  B.put("truck", { name: "s", x: 4, y: 0.5, tok: "accent", subject: true });
  B.pin(a, "Loading bay", { at: 0.5, SIDE });
}});
"""


def check_isometric_pins_keep_off_the_subject():
    """a pin with side "auto" is placed where it covers no subject (no iso_pin_covers_subject); forced onto the subject's
    side it covers it and says so. Control: the forced pin is named."""
    if not which("node"):
        return "skipped (no node)"
    _, rep = _frames(_head([1.0], 2.0) + _PIN.replace("SIDE", 'side: "auto"'), [1.0])
    assert "iso_pin_covers_subject" not in _codes(rep), _codes(rep)
    _, rep2 = _frames(_head([1.0], 2.0) + _PIN.replace("SIDE", 'side: "right", lift: 70'), [1.0])
    assert "iso_pin_covers_subject" in _codes(rep2), f"control: a pin over the subject was not named: {_codes(rep2)}"
    errs = [e for e in rep.get("errors", []) if e.get("code") in ("text_spill", "tight_inset", "text_overflow")]
    assert not errs, errs
    return "auto pin clear of the subject; a forced one is named; its words fit their plate"


_MEANING = """Loom.scene("iso_test", { build(ctx) {
  const W = ctx.engine, B = W.board(ctx, { name: "b", size: [12, 8], at: 0 });
  B.put("box", { name: "x1", x: 1, y: 1, tok: "accent2", role: "servers" });
  B.put("box", { name: "x2", x: 4, y: 1, tok: "accent2", role: ROLE2 });
  B.route("r", [[0, 6], ROUTE2], { at: 0.2 });
}});
"""


def check_isometric_meaning_and_grid_rules_are_named():
    """one hue, one meaning: a second meaning for accent2 is named (iso_hue_two_meanings); a route off the grid axes is
    named (iso_route_diagonal). Control: the same hue with the same meaning and an axis-aligned route raise nothing."""
    if not which("node"):
        return "skipped (no node)"
    _, bad = _frames(_head([0.5], 2.0) + _MEANING.replace("ROLE2", '"offices"').replace("ROUTE2", "[5, 9]"), [0.5])
    assert "iso_hue_two_meanings" in _codes(bad) and "iso_route_diagonal" in _codes(bad), _codes(bad)
    _, good = _frames(_head([0.5], 2.0) + _MEANING.replace("ROLE2", '"servers"').replace("ROUTE2", "[8, 6]"), [0.5])
    assert "iso_hue_two_meanings" not in _codes(good) and "iso_route_diagonal" not in _codes(good), _codes(good)
    return "a second meaning and a diagonal route named; the clean version silent"


def check_isometric_lab_scenes_render_with_no_problem():
    """the engine's three lab scenes (teaching, detail, both on one board) render in Chrome with no problem.
    Needs a browser."""
    if not browser():
        return "skipped (no browser here)"
    from loom import lab as LB
    d = Path(tempfile.mkdtemp(prefix="loomisol_"))
    try:
        for sc, ts in (("iso_teach", [7.6, 15.4]), ("iso_diorama", [12.2, 21.6]), ("iso_lesson", [13.4, 19.0])):
            r = LB.strip(sc, "isometric", ts, out_dir=d / sc, frames_dir=d / sc / "f")
            assert not r["errors"], (sc, r["errors"][:4])
    finally:
        shutil.rmtree(d, ignore_errors=True)
    return "the three lab scenes render with no problem"


# ---------------------------------------------------------------- the stress-test findings (2026-10-16), each with a control

_STREAM = """Loom.scene("iso_test", { build(ctx) {
  const W = ctx.engine, B = W.board(ctx, { name: "b", size: [12, 8], at: 0 });
  const r = B.route("lane", [[0.5, 4], [11, 4]], { at: 0.1, dur: 0.3 });
  for (let i = 0; i < 4; i++) {
    const t = 0.5 + i * 1.5, cr = B.put("crate", { name: "c" + i, route: r, s: 0.5, at: t, enter: "drop" });
    cr.travel(r, t + 0.3, { dur: 1.0, ease: "linear" });
    cr.exit(t + 1.3, { kind: "sink", dur: 0.3 });
  }
  EXTRA
}});
"""


def check_isometric_order_check_knows_when_items_are_there():
    """iso_order is time-aware: four crates that pass the same start point one after another (each gone before the next
    arrives) raise nothing. Controls: a wall standing on their lane (they pass through it while it stands) is named, and
    two crates dropped on the same spot at the same moment are named."""
    if not which("node"):
        return "skipped (no node)"
    _, ok = _frames(_head([1.0], 8.0) + _STREAM.replace("EXTRA", ""), [1.0])
    assert "iso_order" not in _codes(ok), [w.get("msg") for w in ok.get("warnings", []) if w.get("code") == "iso_order"]
    _, wall = _frames(_head([1.0], 8.0) + _STREAM.replace("EXTRA", 'B.put("box", { name: "wall", x: 6, y: 3.4, w: 0.4, d: 1.2, h: 1.2 });'), [1.0])
    msgs = [w.get("msg", "") for w in wall.get("warnings", []) if w.get("code") == "iso_order"]
    assert msgs and "wall" in msgs[0], f"control: a crate passing through a wall was not named: {msgs}"
    twin = 'B.put("crate", { name: "twin", route: r, s: 0.5, at: 0.5, enter: "drop" });'
    _, tw = _frames(_head([1.0], 8.0) + _STREAM.replace("EXTRA", twin), [1.0])
    msgs2 = [w.get("msg", "") for w in tw.get("warnings", []) if w.get("code") == "iso_order"]
    assert msgs2 and "twin" in msgs2[0] and "c0" in msgs2[0], f"control: two crates in one place at one time were not named: {msgs2}"
    return "a stream at one point silent; a wall on the lane and a twin crate named"


_CUE = """Loom.scene("iso_test", { build(ctx) {
  const W = ctx.engine, B = W.board(ctx, { name: "b", size: [12, 9], at: 0 });
  B.put("cloud", { name: "high", x: 1, y: 1, z: 2.5 });
  B.put("cloud", { name: "low", x: 5, y: 1 });
  B.put("box", { name: "quiet", x: 9, y: 1, z: 2.0, w: 0.6, d: 0.6, h: 0.6, cue: false });
  B.put("box", { name: "back", x: 4, y: 0.2, w: 2, d: 1, h: 4, tok: "concrete" });
  B.put("box", { name: "front", x: 4, y: 5, w: 2, d: 1, h: 4, tok: "concrete" });
  B.route("up", [[1, 3, 0.4], [1, 3, 2], [10, 3, 2]], { AIR, tok: "accent2", at: 0.2, dur: 0.5 });
}});
"""


def _group(svg: str, name: str) -> str:
    i = _index(svg, name)
    j = svg.find('<g class="lm-iso-item"', i + 20)
    return svg[i:j if j > 0 else len(svg)]


def check_isometric_floating_things_and_air_routes_have_a_height_cue():
    """a cloud floating at z 2.5 gets a height cue (a soft shadow under it and a dashed stem down); one on the ground and
    one with cue: false get none. An air route is drawn among the solids: behind a tall box in front of it, over one
    behind it, with a dotted trace on the ground and a stem from its corner. Control: air: "over" draws the route after
    every solid (the old way), and has no stems among them."""
    if not which("node"):
        return "skipped (no node)"
    f, _ = _frames(_head([1.5], 2.0) + _CUE.replace("AIR", "air: true"), [1.5])
    s = f[1.5]
    hi, lo, qu = _group(s, "high"), _group(s, "low"), _group(s, "quiet")
    assert '<g class="lm-iso-cue"' in hi and re.search(r'stroke-dasharray="3 5"[^>]*opacity="0.6"', hi), "the floating cloud has no stem"
    assert "lm-iso-cue" not in lo and "lm-iso-cue" not in qu, "a cloud on the ground, or one with cue: false, got a height cue"
    seg = [m.start() for m in re.finditer(r'class="lm-iso-route lm-iso-airseg" data-name="up" data-seg="2"', s)]
    assert seg, "the air route's long segment is not among the solids"
    assert _index(s, "back") < seg[0] < _index(s, "front"), "the air route is not between the box behind it and the box in front"
    assert 'class="lm-iso-trace"' in s and re.search(r'class="lm-iso-stem" data-name="up" data-point="2"', s), "no ground trace or corner stem"
    g, _ = _frames(_head([1.5], 2.0) + _CUE.replace("AIR", 'air: "over"'), [1.5])
    s2 = g[1.5]
    air = s2.find('<g class="lm-iso-air"><g class="lm-iso-route" data-name="up"')
    assert air > _index(s2, "front") and "lm-iso-airseg" not in s2, "control: air \"over\" did not draw the route above every solid"
    sol = s2[s2.find('<g class="lm-iso-solids">'):s2.find('<g class="lm-iso-air">')]
    assert "lm-iso-stem" not in sol, "control: an over-everything route put stems among the solids"
    return "floating cloud cued, grounded and cue:false ones not; the air route sits between the back and front boxes; \"over\" is on top"


_SCREEN = """Loom.scene("iso_test", { build(ctx) {
  const W = ctx.engine, B = W.board(ctx, { name: "b", size: [8, 6], at: 0 });
  B.put("screen", { name: "dash", x: 2, y: 2, w: 4.2, h: 1.6, PANELS });
}});
"""


def _quads(group: str, colour: str) -> list:
    out = []
    for m in re.finditer(r'<polygon points="([^"]+)" fill="%s" stroke="none"' % re.escape(colour), group, re.I):
        P = [tuple(float(v) for v in p.split(",")) for p in m.group(1).split()]
        if len(P) == 4:
            out.append(P)
    return out


def check_isometric_screen_kind_shows_bars_a_line_and_rows():
    """the screen kind shows content on its face: bars whose heights follow their values (1 : 2 : 4, the third in the
    highlight hue), a line chart and rows, in their own tokens. Control: a screen with no panels has none of it."""
    if not which("node"):
        return "skipped (no node)"
    panels = ('panels: [{ show: "bars", values: [1, 2, 4], hi: 2, hiTok: "neg" }, { show: "line", values: [1, 3, 2], tok: "accent3" }, '
              '{ show: "rows", values: [0.5, 1.0], tok: "steel", dot: "steel" }]')
    f, rep = _frames(_head([1.0], 2.0) + _SCREEN.replace("PANELS", panels), [1.0])
    g = _group(f[1.0], "dash")
    blue, red = _quads(g, "#2C6BDE"), _quads(g, "#D43C4C")
    assert len(blue) == 2 and len(red) == 1, f"bars: {len(blue)} in accent2 and {len(red)} in neg (want 2 and 1)"
    h = [abs(q[3][1] - q[0][1]) for q in blue + red]
    assert abs(h[1] / h[0] - 2) < 0.05 and abs(h[2] / h[0] - 4) < 0.08, f"bar heights do not follow the values: {h}"
    assert _quads(g, "#12998C"), "no line chart in its token"
    assert len(_quads(g, "#7D8899")) >= 4, "no rows"
    assert not rep.get("errors"), rep.get("errors")
    f2, _ = _frames(_head([1.0], 2.0) + _SCREEN.replace("PANELS", "panels: []"), [1.0])
    g2 = _group(f2[1.0], "dash")
    assert not _quads(g2, "#2C6BDE") and not _quads(g2, "#12998C"), "control: a screen with no panels still shows content"
    return f"bars {', '.join(f'{v:.1f}' for v in h)} px (1:2:4); line and rows drawn; an empty screen shows nothing"


_STACKPIN = """Loom.scene("iso_test", { build(ctx) {
  const W = ctx.engine, B = W.board(ctx, { name: "b", size: [10, 8], at: 0 });
  const plate = B.put("plate", { name: "dock", x: 3, y: 3, w: 2.6, d: 2.0, tok: "accent2" });
  const q = B.stack("queue", { kind: "crate", s: 0.4, n: 8, cols: 4, rows: 2, x: 3.3, y: 3.4, z: 0.16, at: 0.5, by: 1.6, label: "waiting", pinTok: "neg" });
  B.pin([8, 1.5, 0], "A spot", { at: 0.5, side: "up-left", name: "spot" });
  B.focus([plate, q], 2.0, { dur: 0.4, amount: 0.9 });
}});
"""


def _pin_opacity(svg: str, name: str) -> float:
    i = svg.find(f'data-name="{name}"')
    assert i > 0, f"no pin {name}"
    m = re.search(r'class="lm-iso-pin" opacity="([\d.]+)"', svg[i:])
    return float(m.group(1))


def check_isometric_stack_count_pin_stands_on_a_unit_and_keeps_its_colour():
    """B.stack's count pin stands on a unit of the stack and follows the stack's focus: with the stack in focus it stays
    at full strength. Control: a pin on a bare world point fades to context under the same focus (and both are full
    before it)."""
    if not which("node"):
        return "skipped (no node)"
    times = [1.8, 3.0]
    f, rep = _frames(_head(times, 3.5) + _STACKPIN, times)
    before = (_pin_opacity(f[1.8], "queue_count"), _pin_opacity(f[1.8], "spot"))
    after = (_pin_opacity(f[3.0], "queue_count"), _pin_opacity(f[3.0], "spot"))
    assert before == (1.0, 1.0), f"control: the pins were not full before the focus: {before}"
    assert after[0] > 0.95, f"the stack's count pin faded under the stack's own focus: {after[0]}"
    assert after[1] < 0.6, f"control: a pin on a bare point did not fade under focus: {after[1]}"
    return f"count pin {after[0]:.2f}, point pin {after[1]:.2f} under focus (both 1.00 before)"


_CROWD = """Loom.scene("iso_test", { build(ctx) {
  const W = ctx.engine, B = W.board(ctx, { name: "b", size: [12, 8], at: 0 });
  B.put("plate", { name: "station", x: 5, y: 3, w: 2.4, d: 2.4, tok: "accent2" });
  // made in one order, shown in another: the last one made appears first
  B.pin([6.0, 4.0, 0.16], "Orders waiting", { at: 0.9, SIDE, name: "p_a" });
  B.pin([6.3, 4.2, 0.16], "Pack", { at: 0.7, SIDE, name: "p_b" });
  B.pin([6.1, 4.5, 0.16], "Your order", { at: 0.5, SIDE, name: "p_c" });
}});
"""


def _plates(svg: str, names) -> dict:
    out = {}
    for n in names:
        m = re.search(r'data-name="%s" data-w="(\d+)" data-h="(\d+)" data-kind="label" transform="translate\(([-\d.]+) ([-\d.]+)\)"' % n, svg)
        assert m, f"no plate {n}"
        w, h, x, y = (float(v) for v in m.groups())
        out[n] = (x, y, w, h)
    return out


def check_isometric_crowded_pins_fan_out_or_are_named():
    """three pins on points a few px apart, at one station, made in a different order than they appear: with side
    "auto" their plates fan out (no two plates touch) and nothing is named. Control: forced to one side at one leader
    length they crowd, and iso_pin_crowd names them."""
    if not which("node"):
        return "skipped (no node)"
    f, rep = _frames(_head([1.5], 2.0) + _CROWD.replace("SIDE", 'side: "auto"'), [1.5])
    assert "iso_pin_crowd" not in _codes(rep), [w.get("msg") for w in rep.get("warnings", []) if w.get("code") == "iso_pin_crowd"]
    P = _plates(f[1.5], ["p_a", "p_b", "p_c"])
    ks = list(P)
    for i in range(3):
        for j in range(i + 1, 3):
            a, b = P[ks[i]], P[ks[j]]
            sep = a[0] + a[2] <= b[0] or b[0] + b[2] <= a[0] or a[1] + a[3] <= b[1] or b[1] + b[3] <= a[1]
            assert sep, f"plates {ks[i]} and {ks[j]} touch: {a} {b}"
    _, bad = _frames(_head([1.5], 2.0) + _CROWD.replace("SIDE", 'side: "right", lift: 70'), [1.5])
    msgs = [w.get("msg", "") for w in bad.get("warnings", []) if w.get("code") == "iso_pin_crowd"]
    assert msgs and any('"Pack"' in m or '"Your order"' in m for m in msgs), f"control: crowded pins were not named: {msgs}"
    return f"auto plates apart; forced ones named ({len(msgs)} warning(s))"


_ICON = """Loom.scene("iso_test", { build(ctx) {
  const W = ctx.engine, B = W.board(ctx, { name: "b", size: [6, 6], at: 0, plinth: false });
  const E = ctx.el("tally", { x: 1200, y: 120, w: 560, h: 400, kind: "card" });
  B.tally(E, { n: 4, per: 250, total: 1000, ICON tok: "accent2", cols: 4, label: "requests", at: 0.5, by: 1.5 });
}});
"""


def check_isometric_tally_icon_follows_the_noun():
    """a tally with no icon picks it from the noun it counts ("requests": the request pictogram, reported as its unit);
    an icon that does not match the noun is named (iso_tally_icon). Control: the matching icon raises nothing."""
    if not which("node"):
        return "skipped (no node)"
    _, rep = _frames(_head([2.0], 2.5) + _ICON.replace("ICON", ""), [2.0])
    d = [x for x in rep.get("data", []) if x.get("builder") == "iso_tally"]
    assert d and d[0]["values"]["unit"] == "request", d
    _, bad = _frames(_head([2.0], 2.5) + _ICON.replace("ICON", 'icon: "order",'), [2.0])
    assert "iso_tally_icon" in _codes(bad), f"an order icon counting requests was not named: {_codes(bad)}"
    _, good = _frames(_head([2.0], 2.5) + _ICON.replace("ICON", 'icon: "request",'), [2.0])
    assert "iso_tally_icon" not in _codes(good), _codes(good)
    return "requests counted with the request pictogram; an order icon named; the matching one silent"


_WIDEN = """Loom.scene("iso_test", { build(ctx) {
  const W = ctx.engine, B = W.board(ctx, { name: "b", size: [14, 14], plinth: false, unit: 80, at: 0 });
  B.flow("f", { axis: "row", x: 0, y: 10, w: 2.4, d: 2.4, gap: 1.4, at: 0.5, by: 6.5, WIDEN
    steps: [{ label: "One", kind: "laptop" }, { label: "Two", kind: "crate" }, { label: "Three", kind: "van" }] });
}});
"""


def _zoom(svg: str) -> float:
    m = re.search(r'class="lm-iso-cam" transform="translate\(960 540\) scale\(([\d.]+)\)', svg)
    return float(m.group(1)) if m else 1.0


def check_isometric_widen_opens_close_and_pulls_back():
    """B.flow({widen: true}) (B.widen) opens close on the first station and pulls back as the others arrive: the zoom
    falls from the first station to the last. Control: without it the camera stays at the opening view."""
    if not which("node"):
        return "skipped (no node)"
    times = [1.4, 6.9]
    f, rep = _frames(_head(times, 7.5) + _WIDEN.replace("WIDEN", "widen: true,"), times)
    z0, z1 = _zoom(f[1.4]), _zoom(f[6.9])
    assert z0 > 1.3 and z0 > z1 + 0.3, f"the camera did not open close and pull back: {z0} -> {z1}"
    assert "iso_cam_overlap" not in _codes(rep), _codes(rep)
    g, _ = _frames(_head(times, 7.5) + _WIDEN.replace("WIDEN", ""), times)
    assert _zoom(g[1.4]) == _zoom(g[6.9]) == 1.0, "control: without widen the camera moved"
    return f"zoom {z0:.2f} on the first station, {z1:.2f} with all three"


_CUT = """Loom.scene("iso_test", { build(ctx) {
  const W = ctx.engine, B = W.board(ctx, { name: "b", size: [8, 8], at: 0 });
  const hall = B.put("box", { name: "hall", x: 1, y: 1, w: 2, d: 2, h: 2 });
  B.put("box", { name: "shed", x: 5, y: 5, w: 1, d: 1, h: 1 });
  B.camera(2.0, hall, { zoom: 3, dur: %s });
}});
"""


def check_isometric_camera_dur_zero_is_a_cut_from_its_first_frame():
    """B.camera(t, target, {dur: 0}) is a cut: the frame AT t already shows the new framing (st-iso-order b14 showed one
    frame of the whole board before the dock, and dur 0 used to fly the default 0.9 s; D-190). Control: dur 0.6 is a move,
    so the frame at t is still the old framing and the frame 0.3 s later is between the two."""
    if not which("node"):
        return "skipped (no node)"
    times = [1.9, 2.0, 2.3, 3.0]
    a, _ = _frames(_head(times, 4.0) + _CUT % "0", times)
    assert a[2.0] != a[1.9], "control: the cut changed nothing"
    assert a[2.0] == a[2.3] == a[3.0], "dur 0 is not a cut: the frame at its time (or after) still moves"
    b, _ = _frames(_head(times, 4.0) + _CUT % "0.6", times)
    assert b[2.0] == b[1.9] and b[2.3] != b[2.0] and b[2.3] != b[3.0], "control: a 0.6 s move must still move"
    return "dur 0 framed at its own frame and held; dur 0.6 still moved"
