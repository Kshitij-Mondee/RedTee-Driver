"""The hologram engine (2026-10-16, runtime/engines/hologram.js): a calm operations HUD in two registers (briefing and
analysis). Offline tests run the real runtime and engine in Node (tools/node/svg_preview.mjs, the path
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

LAB = ROOT / "scenes_examples" / "lab"


def _frames(scene_src: str, times: list[float]) -> tuple[dict, dict]:
    """build a lab page for a scene source in the hologram style and render it in Node: ({time: svg text}, report)"""
    from loom import lab
    d = Path(tempfile.mkdtemp(prefix="loomholo_"))
    try:
        f = d / "scene.js"
        f.write_text(scene_src, encoding="utf-8")
        tmp, meta, st, ts = lab.page("holo_test", "hologram", times, file=f)
        out = tmp / "preview"
        r = subprocess.run([which("node") or "node", str(ROOT / "tools/node/svg_preview.mjs"), str(tmp), str(out)],
                           capture_output=True, text=True, timeout=300)
        rep = json.loads((out / "report.json").read_text(encoding="utf-8")) if (out / "report.json").exists() else {}
        assert r.returncode == 0 and rep, f"the node preview failed: {r.stderr[-800:]}"
        shots = {round(float(s["t"]), 2): Path(s["file"]).read_text(encoding="utf-8") for s in rep["shots"]}
        shutil.rmtree(tmp, ignore_errors=True)
        return shots, rep
    finally:
        shutil.rmtree(d, ignore_errors=True)


def _head(times, dur=8.0):
    return '// @lab {"title": "test", "styles": ["hologram"], "dur": %s, "times": %s}\n' % (dur, json.dumps(times))


def _el(svg: str, name: str) -> str:
    """the markup of the element named `name` (its lm-el group, up to the next element's start)"""
    i = svg.find(f'data-name="{name}"')
    assert i >= 0, f"no element {name} in the frame"
    j = svg.find('class="lm-el"', i + 10)
    return svg[i:j if j > 0 else len(svg)]


def _opacity(tag: str) -> float:
    m = re.search(r"opacity:\s*([-\d.e]+)", tag) or re.search(r'opacity="([-\d.e]+)"', tag)
    return float(m.group(1)) if m else 1.0


def _body_opacity(svg: str, name: str) -> float:
    m = re.search(r'<g class="lm-holo-body"[^>]*>', _el(svg, name))
    assert m, f"{name} has no body group"
    return _opacity(m.group(0))


def check_hologram_engine_lints_its_pack_reads_and_the_switch_follows_the_request():
    """the engine passes the engine lint (and a copy with Math.random does not: the control); the pack lints clean; every
    status colour reads on the field and the plate at 4.5:1 or more; the alert red is not a 'saturated red' under WCAG
    2.3.1 (R/(R+G+B) < 0.8), so an alert turning on is never a red flash; a lesson uses the engine unless its request says
    engine off, and only then does get_style_pack carry the engine's guide."""
    from loom import engines as EN
    from loom.checks.style_lint import contrast, lint_style
    assert EN.lint(EN.ENGINES_DIR / "hologram.js") == [], EN.lint(EN.ENGINES_DIR / "hologram.js")
    d = Path(tempfile.mkdtemp(prefix="loomholo_lint_"))
    try:
        bad = d / "hologram.js"
        bad.write_text((EN.ENGINES_DIR / "hologram.js").read_text(encoding="utf-8").replace("const UP = [];", "const UP = []; const r0 = Math.random();"), encoding="utf-8")
        assert any("Math.random" in e for e in EN.lint(bad)), "control: the lint missed Math.random"
    finally:
        shutil.rmtree(d, ignore_errors=True)
    pack = json.loads((ROOT / "packs/styles/hologram.json").read_text(encoding="utf-8"))
    assert lint_style(pack) == [], lint_style(pack)
    P = pack["palette"]
    worst = min(contrast(P[t], P[bg]) for t in ("accent", "accent2", "accent3", "accent4", "ink", "muted") for bg in ("field", "surface"))
    assert worst >= 4.5, f"a status colour reads at {worst:.2f}:1"
    h = P["accent3"].lstrip("#")
    r, g, b = (int(h[i:i + 2], 16) for i in (0, 2, 4))
    assert r / (r + g + b) < 0.8, "the alert red is a saturated red (WCAG 2.3.1 red flash)"

    class P_:
        def __init__(self, req): self.request = req
    assert EN.enabled_for(P_({}), "hologram") and not EN.enabled_for(P_({"engine": "off"}), "hologram")
    from loom.agents import tools as T

    class C_:
        def __init__(self, req): self.project = P_(dict(req, style="hologram"))
    on, off = T.t_get_style_pack(C_({})), T.t_get_style_pack(C_({"engine": "off"}))
    assert "W.hud(ctx" in on.get("engine_text", "") and "engine_text" not in off
    return f"lint clean (Math.random caught in the control); pack clean; worst status contrast {worst:.2f}:1; red ratio {r / (r + g + b):.2f}"


_MODES = """Loom.scene("holo_test", { build(ctx) {
  const W = ctx.engine, H = W.hud(ctx);
  const head = H.title("head", { x: 120, y: 90, w: 1200, h: 160, kicker: "Model operations", text: "What we watch", at: 0.2 });
  const c = H.card("card_a", { x: 120, y: 300, w: 520, h: 270, kicker: "Input drift", value: 0.08, decimals: 2, label: "distance from training", at: 0.8 });
  const p = H.panel("panel_a", { x: 700, y: 300, w: 560, h: 300, title: "Checks", register: "briefing", at: 1.0, rows: [["Schema", "pass"], ["Drift", "0.08"]] });
  c.status("warn", 3.0);
  H.mode("analysis", 4.0, { keep: [head] });
  H.mode("briefing", 6.0);
  void p;
}});
"""


def check_hologram_status_is_told_twice_and_the_registers_are_modes():
    """a status change shows the word AND the colour (the WARN tag appears with the amber brackets, not before); the
    switch to the analysis register dims the briefing pieces (to about 0.3) and the switch back restores them, with
    nothing redrawn. Control: before the change there is no WARN word, and the title (kept) is never dimmed."""
    if not which("node"):
        return "skipped (no node)"
    times = [2.6, 3.6, 5.2, 7.2]
    f, rep = _frames(_head(times) + _MODES, times)
    assert not rep.get("errors"), rep["errors"][:3]
    warn = lambda s: re.findall(r'<g[^>]*opacity:\s*1[^>]*>(?:(?!</g>).)*?>WARN<', _el(s, "card_a"), re.S)  # noqa: E731
    assert ">WARN<" in _el(f[3.6], "card_a") and _el(f[2.6], "card_a").count(">WARN<") == _el(f[3.6], "card_a").count(">WARN<")
    assert warn(f[3.6]) and not warn(f[2.6]), "control: the WARN word is not shown only after the change"
    assert _body_opacity(f[3.6], "card_a") > 0.95 and _body_opacity(f[5.2], "card_a") < 0.4, (_body_opacity(f[3.6], "card_a"), _body_opacity(f[5.2], "card_a"))
    assert _body_opacity(f[5.2], "panel_a") < 0.4 and _body_opacity(f[7.2], "panel_a") > 0.95
    assert _body_opacity(f[5.2], "head") > 0.95, "the kept title was dimmed"
    return "WARN word with the amber status, after the change only; analysis dims the briefing to ~0.3, briefing restores it; the kept title stays"


_SCROLL_LOCK = """Loom.scene("holo_test", { build(ctx) {
  const W = ctx.engine, H = W.hud(ctx);
  const R = H.readout("log", { x: 100, y: 200, w: 640, h: 230, at: 0.3, visible: 2, rows: [["09:01", "first row", "ok"], ["09:02", "second row", "warn"]] });
  R.push(["09:03", "third row", "alert"], 3.0);
  const box = H.frame("target", { x: 1100, y: 300, w: 300, h: 200, at: 0.3 });
  H.lock(box, { at: 4.0, label: "target" });
}});
"""


def _row_states(svg: str) -> list[tuple[float, float]]:
    """(opacity of the row's words, its y shift) for each readout row, in order"""
    el = _el(svg, "log")
    out = []
    for m in re.finditer(r'<g transform="translate\(0 ([-\d.]+)\)"[^>]*>\s*<rect[^>]*>(?:</rect>)?\s*<g opacity="([-\d.]+)"', el):
        out.append((float(m.group(2)), float(m.group(1))))
    return out


def check_hologram_readout_scrolls_on_the_word_and_the_lock_closes():
    """a readout showing two rows: when a third arrives the first slides out (its words fade, it moves up one row) and
    the new one is in; a lock starts large and turned, and closes to the target's size within its 0.35 s. Control: the
    states before the push and before the lock are the other ones."""
    if not which("node"):
        return "skipped (no node)"
    times = [2.5, 3.6, 4.05, 4.6]
    f, rep = _frames(_head(times) + _SCROLL_LOCK, times)
    assert not rep.get("errors"), rep["errors"][:3]
    before, after = _row_states(f[2.5]), _row_states(f[3.6])
    assert len(before) == 3 and len(after) == 3, (before, after)
    assert before[0][0] > 0.95 and before[2][0] < 0.05, f"control: before the push {before}"
    assert after[0][0] < 0.05 and after[0][1] < -40 and after[2][0] > 0.95, f"after the push {after}"
    tr = lambda s: re.search(r'<g opacity="[\d.]+" transform="([^"]+)"', _el(s, "lock_target")).group(1)  # noqa: E731
    rot = lambda s: float(re.search(r"rotate\(([-\d.]+)\)", tr(s)).group(1))  # noqa: E731
    sc = lambda s: float(re.search(r"scale\(([-\d.]+)\)", tr(s)).group(1))  # noqa: E731
    assert rot(f[4.05]) > 20 and sc(f[4.05]) > 1.3, f"control: the lock is not large and turned at its start ({tr(f[4.05])})"
    assert abs(rot(f[4.6])) < 0.01 and abs(sc(f[4.6]) - 1) < 0.01, f"the lock did not close ({tr(f[4.6])})"
    return f"rows before {before[0][0]:.2f}/{before[2][0]:.2f}, after {after[0][0]:.2f}/{after[2][0]:.2f} (shift {after[0][1]:.0f} px); lock {rot(f[4.05]):.0f} deg x{sc(f[4.05]):.2f} then closed"


_REST = """Loom.scene("holo_test", { build(ctx) {
  const W = ctx.engine, H = W.hud(ctx);
  H.panel("p", { x: 100, y: 200, w: 600, h: 300, title: "Checks", at: 0.3, rows: [["Schema", "pass"], ["Drift", "0.08"]] });
  H.mesh("m", { x: 800, y: 200, w: 700, h: 400, at: 0.5, nodes: [{ id: "a", x: 80, y: 200, label: "A" }, { id: "b", x: 500, y: 200, label: "B" }], links: [["a", "b"]] });
  H.globe("g", { cx: 1500, cy: 760, r: 150, at: 0.6 });
  %s
  for (let i = 0; i < 5; i++) H.flash(H.frame("f" + i, { x: 100 + i * 60, y: 700, w: 50, h: 50, at: 0.2 }), 1.0);
}});
"""


def check_hologram_rests_when_nothing_is_said_and_keeps_its_flash_budget():
    """no fuigetry: a HUD whose reveals are done draws the SAME frame at 5 s and 6 s (no idle loop, no blinking grid);
    five flashes asked for at one instant are spread so no second holds more than three (WCAG 2.3.1, holo_flash_rate).
    Control: a scanner sweeping over that interval makes the two frames differ."""
    if not which("node"):
        return "skipped (no node)"
    times = [5.0, 6.0]
    still, rep = _frames(_head(times) + _REST % "", times)
    assert not rep.get("errors"), rep["errors"][:3]
    assert still[5.0] == still[6.0], "the resting HUD moved between 5 s and 6 s (idle motion)"
    moved = sum(1 for w in rep.get("warnings", []) if w.get("code") == "holo_flash_rate")
    assert moved >= 2, f"five flashes at one instant moved {moved} (want at least 2 moved past the budget of 3)"
    when = [1.0] * (5 - moved) + [float(m) for m in re.findall(r"moved to ([\d.]+)s", " ".join(w["msg"] for w in rep["warnings"] if w.get("code") == "holo_flash_rate"))]
    worst = max(sum(1 for x in when if a <= x <= a + 1.0) for a in when)
    assert worst <= 3, f"a one-second window holds {worst} flashes: {sorted(when)}"
    assert not any(w.get("code") == "holo_loops" for w in rep.get("warnings", [])), "a still HUD warned about loops"
    busy = ('H.scanner("s", { cx: 400, cy: 760, r: 120, at: 0.3, sweeps: [[4.0, 7.0]] });'
            ' H.wave("w", { x: 700, y: 820, w: 500, h: 160, at: 0.3, t0: 4.0, t1: 7.0 });'
            ' H.globe("g2", { cx: 1700, cy: 300, r: 120, at: 0.3, spin: 6, spinFrom: 4.5, spinTo: 7.0 });')
    live, rep2 = _frames(_head(times) + _REST % busy, times)
    assert live[5.0] != live[6.0], "control: a sweeping scanner did not change the frame"
    assert any(w.get("code") == "holo_loops" for w in rep2.get("warnings", [])), "three loops at once did not warn holo_loops"
    return f"a resting HUD is still (identical frames); {moved} of 5 flashes moved to keep 3 a second; a sweep moves; three loops at once warn"


def check_hologram_lab_scenes_build_in_node_and_draw_the_same_frames_twice():
    """the three lab scenes (briefing, analysis, the lesson between registers) build with no runtime error and no
    warning in Node, and the analysis scene, the busiest, draws byte-identical frames in two builds. Control: two of
    its times differ."""
    if not which("node"):
        return "skipped (no node)"
    notes = []
    for sc in ("holo_briefing", "holo_analysis", "holo_lesson"):
        src = (LAB / f"{sc}.js").read_text(encoding="utf-8")
        body = src.split("\n", 1)[1].replace(f'Loom.scene("{sc}"', 'Loom.scene("holo_test"')
        meta = json.loads(src.split("\n", 1)[0].split("@lab", 1)[1])
        ts = meta["times"][:3] if sc != "holo_analysis" else meta["times"]
        a, rep = _frames(_head(ts, meta["dur"]) + body, ts)
        assert not rep.get("errors"), (sc, rep["errors"][:3])
        warns = [w for w in rep.get("warnings", []) if str(w.get("code", "")).startswith(("holo_", "text_", "size_"))]
        assert not warns, (sc, warns[:3])
        if sc == "holo_analysis":
            b, _ = _frames(_head(ts, meta["dur"]) + body, ts)
            assert a == b, "the analysis scene drew different frames in two builds"
            assert a[ts[1]] != a[ts[-1]], "control: two times gave the same frame"
        notes.append(f"{sc} {len(ts)} frames")
    return "; ".join(notes) + "; analysis identical twice"


# ------------------------------------------------------------------ the stress-test fixes (FINDINGS.md, 2026-10-16)

def _pal() -> dict:
    return json.loads((ROOT / "packs/styles/hologram.json").read_text(encoding="utf-8"))["palette"]


def _tag_op(tag: str) -> float:
    """the opacity a tag carries: its style when GSAP wrote one, else its attribute"""
    m = re.search(r'style="[^"]*opacity:\s*([-\d.e]+)', tag) or re.search(r'opacity="([-\d.e]+)"', tag)
    return float(m.group(1)) if m else 1.0


def _word_shown(markup: str, word: str) -> bool:
    """a status word is shown: some >WORD< whose own group (the tag's <g>) is at opacity > 0.5"""
    for m in re.finditer(f">{re.escape(word)}<", markup):
        g = markup.rfind("<g", 0, m.start())
        if g >= 0 and _tag_op(markup[g:markup.find(">", g) + 1]) > 0.5:
            return True
    return False


_BARS = """Loom.scene("holo_test", { build(ctx) {
  const H = ctx.engine.hud(ctx);
  const B = H.bars("nb", { x: 120, y: 200, w: 900, h: 330, title: "Next word", max: 100, unit: "%%", at: 0.3, %s
    rows: [["load", 62], ["traffic", 21], ["heat", 9], ["demand", 0.4]] });
  B.set(1, 80, 3.0, 0.5);
  B.mark(0, "ok", 3.0, { word: "PICKED" });
}});
"""


def _bar_fills(svg: str) -> list[tuple[float, float]]:
    """(width, fill-opacity) of each bar's fill in the bars element, in row order"""
    return [(float(m.group(1)), float(m.group(2))) for m in re.finditer(r'<rect [^>]*width="([\d.]+)"[^>]*fill-opacity="([\d.]+)"', _el(svg, "nb"))]


def check_hologram_bars_are_filled_readable_and_move_on_the_word():
    """H.bars: every bar is FILLED (not an outline), a 0.4 % bar is a visible stub (the minimum length, 12 px), the values
    sit outside the bars, a bar moves to its new value on the word (traffic 21 to 80 passes load 62), and mark() shows
    its WORD (PICKED) with the colour. Controls: before the bars arrive every width is 0 and no word shows; with minLen 0
    the small bar is a sliver under 4 px."""
    if not which("node"):
        return "skipped (no node)"
    times = [0.2, 2.6, 4.2]
    f, rep = _frames(_head(times) + _BARS % "", times)
    assert not rep.get("errors"), rep["errors"][:3]
    before, mid, after = (_bar_fills(f[t]) for t in times)
    assert len(mid) == 4, mid
    assert all(w == 0 for w, _ in before), f"control: the bars were drawn before they arrived {before}"
    assert all(op >= 0.3 for _, op in mid), f"a bar is an outline, not a fill {mid}"
    assert mid[3][0] >= 12 and mid[0][0] > mid[1][0] > mid[2][0] > mid[3][0], f"widths {mid}"
    assert after[1][0] > after[0][0], f"traffic did not pass load after set(): {after}"
    nb = lambda t: _el(f[t], "nb")  # noqa: E731
    assert ">62%<" in nb(2.6) and ">80%<" in nb(4.2), "the values are not shown (or did not count to the new value)"
    assert _word_shown(nb(4.2), "PICKED") and not _word_shown(nb(2.6), "PICKED"), "control: the PICKED word is not shown only after mark()"
    g0, rep0 = _frames(_head([2.6]) + _BARS % "minLen: 0,", [2.6])
    sl = _bar_fills(g0[2.6])[3][0]
    assert sl < 4, f"control: with minLen 0 the 0.4 % bar is {sl} px (the minimum length did nothing)"
    return f"fills {[round(w) for w, _ in mid]} px (stub {mid[3][0]:.0f} px, {sl:.1f} px with minLen 0); traffic {after[1][0]:.0f} > load {after[0][0]:.0f} after set; PICKED after mark only"


_PANEL_WORD = """Loom.scene("holo_test", { build(ctx) {
  const H = ctx.engine.hud(ctx);
  const P = H.panel("pw", { x: 120, y: 200, w: 560, h: 300, title: "Busiest", at: 0.3, rows: [["Frankfurt", "38.2k/s"], ["Virginia", "31.0k/s"]] });
  P.set(0, "41.7k/s", 3.0, "warn");
  P.mark(1, "alert", 3.0);
  const Q = H.panel("pr", { x: 800, y: 200, w: 560, h: 300, title: "Reserved", tagRoom: true, at: 0.3, rows: [["Schema", "pass"]] });
  Q.set(0, "fail", 3.0, "alert");
}});
"""


def check_hologram_panel_set_says_the_status_word():
    """panel.set(i, v, t, "warn") shows the WARN word in a tag as well as the colour (the row makes room when it had no tag
    slot); mark(i, "alert") shows ALERT; a panel with tagRoom has the slot ready. Control: before the change neither word
    is shown, and the row's key types on again only where room was made."""
    if not which("node"):
        return "skipped (no node)"
    times = [2.6, 4.0]
    f, rep = _frames(_head(times) + _PANEL_WORD, times)
    assert not rep.get("errors"), rep["errors"][:3]
    pw = {t: _el(f[t], "pw") for t in times}
    pr = {t: _el(f[t], "pr") for t in times}
    assert not _word_shown(pw[2.6], "WARN") and not _word_shown(pw[2.6], "ALERT") and not _word_shown(pr[2.6], "ALERT"), "control: a word showed before the change"
    assert _word_shown(pw[4.0], "WARN") and _word_shown(pw[4.0], "ALERT") and _word_shown(pr[4.0], "ALERT"), "a status changed with no word"
    assert ">41.7k/s<" in pw[4.0] and ">fail<" in pr[4.0]
    return "WARN (set) and ALERT (mark) shown after the change only, with room made; a tagRoom panel says ALERT in its slot"


_LINKS = """Loom.scene("holo_test", { build(ctx) {
  const H = ctx.engine.hud(ctx);
  const nodes = [], links = [];
  for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) nodes.push({ id: "n" + r + "_" + c, x: 60 + c * 120, y: 50 + r * 110, r: 12 });
  for (let r = 0; r < 3; r++) for (let c = 0; c < 6; c++) for (const d of [-1, 0, 1]) if (c + d >= 0 && c + d < 6) links.push(["n" + r + "_" + c, "n" + (r + 1) + "_" + (c + d)]);
  const M = H.mesh("m", { x: 100, y: 150, w: 800, h: 450, nodes, links, at: 0.2 });
  M.linkStatus("n1_2", "n2_3", "warn", 2.0, { dim: 0.3 });
  const M2 = H.mesh("m2", { x: 1000, y: 150, w: 800, h: 450, nodes, links, at: 0.2 });
  M2.linkStatus("n1_2", "n2_3", "warn", 2.0, { emphasis: false });
}});
"""


def _warn_widths(svg: str, name: str, hexc: str) -> list[float]:
    """stroke widths of the visible (opacity > 0.5), non-halo paths in `name` stroked in hexc"""
    out = []
    for m in re.finditer(r"<path [^>]*>", _el(svg, name)):
        tag = m.group(0)
        if f'stroke="{hexc.lower()}"' in tag.lower() and "lm-holo-halo" not in tag and _tag_op(tag) > 0.5:
            out.append(float(re.search(r'stroke-width="([\d.]+)"', tag).group(1)))
    return out


def check_hologram_link_emphasis_has_weight_and_glow():
    """M.linkStatus(a, b, "warn", t) on one link of 45: the link gets a stroke at least 2.4 x a link's width with a glow,
    above the others, and {dim} fades the rest. Controls: before the word nothing is wide; {emphasis: false} is the
    colour change alone (no wider stroke)."""
    if not which("node"):
        return "skipped (no node)"
    times = [1.6, 3.0]
    f, rep = _frames(_head(times) + _LINKS, times)
    assert not rep.get("errors"), rep["errors"][:3]
    amber = _pal()["accent2"].upper()
    base = 1.5
    at3, at1, plain = _warn_widths(f[3.0], "m", amber), _warn_widths(f[1.6], "m", amber), _warn_widths(f[3.0], "m2", amber)
    assert at3 and max(at3) >= 2.4 * base, f"the emphasised link is {at3} px wide (a link is {base})"
    assert "lm-holo-halo" in _el(f[3.0], "m").split("lm-holo-emph", 1)[1][:2000], "no glow under the emphasised link"
    assert not at1 or max(at1) < 2 * base, f"control: a wide amber link before the word {at1}"
    assert plain and max(plain) < 2 * base, f"control: emphasis false still drew a heavy link {plain}"
    dimmed = [_tag_op(m.group(0)) for m in re.finditer(r'<path [^>]*stroke="#4FA7BF"[^>]*stroke-width="1.50"[^>]*>', _el(f[3.0], "m"))]
    assert dimmed and max(dimmed) <= 0.35, f"the other links were not dimmed: {sorted(set(dimmed))[:5]}"
    return f"emphasised link {max(at3)} px with a glow (links {base} px; {max(plain)} px with emphasis false); {len(dimmed)} others dimmed to {max(dimmed)}"


_GLOBE = """Loom.scene("holo_test", { build(ctx) {
  const H = ctx.engine.hud(ctx);
  const c = Loom.geo.city("Mumbai");
  H.globe("g", { cx: 900, cy: 520, r: 320, at: 0.2, lon0: -75, %s
    points: [{ id: "a", lon: c[0], lat: c[1], label: "Mumbai" }, { id: "b", lon: c[0] + 2, lat: c[1] + 2, label: "Pune east" },
             { id: "x", lon: 30, lat: 10, label: "Cairo hub" }, { id: "y", lon: 0, lat: 45, label: "Paris edge" }],
    arcs: [{ from: "a", to: "x", at: 0.8, every: 1.0 }, { from: "b", to: "y", at: 0.9 }] });
}});
"""


def _label_rects(el: str) -> list[tuple[float, float, float, float]]:
    out = []
    pts = el.split('class="lm-holo-points"', 1)[1]
    for m in re.finditer(r'<g opacity="[\d.]+" transform="translate\(([-\d.]+) ([-\d.]+)\)">(.*?)</g>', pts, re.S):
        r = re.search(r'<rect x="([-\d.]+)" y="([-\d.]+)" width="([\d.]+)" height="42"', m.group(3))
        if r:
            x, y = float(m.group(1)) + float(r.group(1)), float(m.group(2)) + float(r.group(2))
            out.append((x, y, x + float(r.group(3)), y + 42))
    return out


def _overlaps(R) -> int:
    return sum(1 for i, a in enumerate(R) for b in R[i + 1:] if a[0] < b[2] and a[2] > b[0] and a[1] < b[3] and a[3] > b[1])


def check_hologram_globe_labels_read_over_arcs_and_land_is_drawn():
    """the globe draws its arcs and traffic UNDER the points and labels (the arcs layer comes first), stacks labels that
    would overlap (two cities 2 degrees apart), draws a faint land outline from the geography when the build has it, and
    warns holo_globe_dense past three labelled points. Controls: labels "fixed" overlap; land false draws no land; three
    points do not warn."""
    if not which("node"):
        return "skipped (no node)"
    f, rep = _frames(_head([3.0]) + _GLOBE % "", [3.0])
    assert not rep.get("errors"), rep["errors"][:3]
    el = _el(f[3.0], "g")
    ia, ip = el.find("lm-holo-arcs"), el.find("lm-holo-points")
    arcs = el[ia:ip]
    assert 0 < ia < ip, "the arcs are not drawn under the points and labels"
    assert re.search(r'<path d="M[^"]{40,}"[^>]*stroke="#FFB547"[^>]*opacity="0\.9', arcs), "control: no visible arc in the arcs layer"
    R = _label_rects(el)
    assert len(R) == 4 and _overlaps(R) == 0, f"labels overlap: {R}"
    land = re.search(r'<path d="(M[^"]+)"[^>]*stroke="#4FA7BF" stroke-width="1.3"', el)
    assert land and land.group(1).count("M") > 20, "no land outline on the globe"
    assert any(w.get("code") == "holo_globe_dense" for w in rep.get("warnings", [])), "four labelled points did not warn"
    g2, rep2 = _frames(_head([3.0]) + _GLOBE % 'labels: "fixed", land: false,', [3.0])
    el2 = _el(g2[3.0], "g")
    assert _overlaps(_label_rects(el2)) > 0, "control: fixed labels did not overlap (the test proves nothing)"
    assert not re.search(r'stroke="#4FA7BF" stroke-width="1.3"', el2), "control: land false still drew land"
    three = (_GLOBE % "").replace(', { id: "y", lon: 0, lat: 45, label: "Paris edge" }', "").replace(', { from: "b", to: "y", at: 0.9 }', "")
    _, rep3 = _frames(_head([3.0]) + three, [3.0])
    assert not any(w.get("code") == "holo_globe_dense" for w in rep3.get("warnings", [])), "control: three points warned"
    return f"arcs under labels; 4 labels apart ({_overlaps(_label_rects(el2))} overlaps when fixed); land with {land.group(1).count('M')} strokes; dense warns at 4, not 3"


_FLOW = """Loom.scene("holo_test", { build(ctx) {
  const H = ctx.engine.hud(ctx);
  H.flow("fl", { x: 120, y: 200, w: 600, h: 700, dir: "%s", at: 0.2, steps: [{ label: "Data" }, { label: "Model" }, { label: "People" }] });
}});
"""


def _heads(svg: str) -> list[tuple[float, float]]:
    """(tip y, base y) of each flow arrowhead"""
    out = []
    for m in re.finditer(r'<polygon points="([-\d.]+),([-\d.]+) ([-\d.]+),([-\d.]+) ([-\d.]+),([-\d.]+)" fill="#4FA7BF"', _el(svg, "fl")):
        v = [float(x) for x in m.groups()]
        out.append((v[1], (v[3] + v[5]) / 2))
    return out


def check_hologram_flow_points_the_way_the_data_moves():
    """H.flow dir "up": the first step is at the bottom and both arrowheads point up (tip above base). Control: dir
    "col" points both down."""
    if not which("node"):
        return "skipped (no node)"
    up, rep = _frames(_head([3.0]) + _FLOW % "up", [3.0])
    assert not rep.get("errors"), rep["errors"][:3]
    hu = _heads(up[3.0])
    assert len(hu) == 2 and all(tip < base for tip, base in hu), f"up arrows {hu}"
    el = _el(up[3.0], "fl")
    assert el.find(">Data<") > 0 and re.search(r'>Data<', el), "no Data step"
    dn, _ = _frames(_head([3.0]) + _FLOW % "col", [3.0])
    hd = _heads(dn[3.0])
    assert len(hd) == 2 and all(tip > base for tip, base in hd), f"control: col arrows {hd}"
    return f"up: tips {[round(t) for t, _ in hu]} above bases; col: down"


_GAUGES = """Loom.scene("holo_test", { build(ctx) {
  const H = ctx.engine.hud(ctx);
  H.gauges("rd", { x: 120, y: 300, r: 70, preset: "RED", values: [1234, 2.6, 412], decimals: %s, at: 0.2 });
  H.gauge("big", { cx: 1400, cy: 500, r: 130, value: 412, max: 1000, unit: "ms", at: 0.2 });
}});
"""


def check_hologram_gauges_take_their_own_decimals_and_keep_units_apart():
    """H.gauges decimals per gauge ([0, 1, 0]: 1234, 2.6, 412) and the unit never glued to the value: on a small gauge
    "ms" and "/s" sit under the value; on a large one the unit follows with a space ("412 ms"); "%" stays close
    ("2.6%"). Control: one decimals value for all gives "412.0" and "1234.0"."""
    if not which("node"):
        return "skipped (no node)"
    f, rep = _frames(_head([3.0]) + _GAUGES % "[0, 1, 0]", [3.0])
    assert not rep.get("errors"), rep["errors"][:3]
    s = f[3.0]
    tx = lambda n: re.findall(r"<tspan[^>]*>([^<]*)</tspan>", _el(s, n))  # noqa: E731
    assert "1234" in tx("rd_0") and "/s" in tx("rd_0") and "2.6%" in tx("rd_1"), (tx("rd_0"), tx("rd_1"))
    assert "412" in tx("rd_2") and "ms" in tx("rd_2") and "412ms" not in tx("rd_2"), tx("rd_2")
    assert "412 ms" in tx("big"), tx("big")
    g, _ = _frames(_head([3.0]) + _GAUGES % "1", [3.0])
    t2 = re.findall(r"<tspan[^>]*>([^<]*)</tspan>", _el(g[3.0], "rd_2")) + re.findall(r"<tspan[^>]*>([^<]*)</tspan>", _el(g[3.0], "rd_0"))
    assert "412.0" in t2 and "1234.0" in t2, f"control: {t2}"
    return f"per-gauge decimals {tx('rd_0')[0]}, {tx('rd_1')[0]}, {tx('rd_2')[:2]}; large gauge '412 ms'; control gives 412.0"


_BLIP = """Loom.scene("holo_test", { build(ctx) {
  const H = ctx.engine.hud(ctx);
  H.scanner("sc", { cx: 900, cy: 500, r: 200, at: 0.2, label: "Host scan", speed: 120, sweeps: [[1.0, 4.0]],
    blips: [{ angle: 90, dist: 0.6, status: "warn", label: "db-07" }, { angle: 250, dist: 0.8, status: "info" }] });
}});
"""


def check_hologram_scanner_blip_labels_light_with_their_blip():
    """a blip's label is drawn (a word on a plate on its outward side, inside the element's box) and lights when the
    sweep reaches the blip (90 degrees at 120 a second: 1.75 s). Control: at 1.5 s it is not shown."""
    if not which("node"):
        return "skipped (no node)"
    f, rep = _frames(_head([1.5, 2.5]) + _BLIP, [1.5, 2.5])
    assert not rep.get("errors"), rep["errors"][:3]
    assert _word_shown(_el(f[2.5], "sc"), "db-07"), "the blip label is not shown after the sweep passed"
    assert not _word_shown(_el(f[1.5], "sc"), "db-07"), "control: the label showed before the sweep reached it"
    return "the db-07 label lights with its blip (after 1.75 s, not at 1.5 s)"


_CAST = """Loom.scene("holo_test", { build(ctx) {
  const H = ctx.engine.hud(ctx);
  H.title("head", { x: 120, y: 92, w: 1200, h: 150, kicker: "People", text: "One person in the loop", at: 0.2 });
  %s
}});
"""


def check_hologram_names_a_full_colour_rig_in_the_hud():
    """a full-colour rig placed in a hologram scene warns holo_character_kit (the style has no designed kit; people are
    never drawn in code). Controls: no person, no warning; a rig declared for the style (styles: ["hologram"]) passes."""
    if not which("node"):
        return "skipped (no node)"
    code = lambda rep: [w for w in rep.get("warnings", []) if w.get("code") == "holo_character_kit"]  # noqa: E731
    _, rep = _frames(_head([1.0]) + _CAST % 'ctx.character("p", "ava", { x: 1600, y: 900, scale: 0.5 });', [1.0])
    assert len(code(rep)) == 1 and "ava" in code(rep)[0]["msg"], rep.get("warnings")
    _, rep0 = _frames(_head([1.0]) + _CAST % "", [1.0])
    assert not code(rep0), "control: a scene with no person warned"
    kit = ('Loom.rig.define("holo_kit_test", Object.assign({}, Loom.rig.defs.ava, { styles: ["hologram"] }));'
           ' ctx.character("p", "holo_kit_test", { x: 1600, y: 900, scale: 0.5 });')
    _, rep1 = _frames(_head([1.0]) + _CAST % kit, [1.0])
    assert not code(rep1), "control: a rig made for the style warned"
    return "holo_character_kit on the ava rig; none with no person or with a hologram rig"


_THROUGH = """Loom.scene("holo_test", { build(ctx) {
  const H = ctx.engine.hud(ctx);
  H.title("head", { x: 120, y: 92, w: 1300, h: 150, kicker: "Phishing", text: "A mail reached three hundred inboxes", at: 0.2 });
  H.frame("box", { x: 1100, y: 400, w: 500, h: 300, at: 0.2 });
  H.through({ to: [1350, 550], scale: 1.5, t0: 2.0, t1: 3.6 });
}});
"""


def _near_op(svg: str) -> float:
    m = re.search(r'data-layer="near"[^>]*>\s*<g class="lm-holo-orbit"[^>]*>', svg)
    assert m, "no near layer"
    return _tag_op(m.group(0).split("<g class", 1)[1])


def check_hologram_push_through_clears_the_near_layer_before_it_crops():
    """H.through: the near layer (the title) is gone by the middle of the push, before the zoom cuts it at the frame
    edge. Control: before the push it is fully there."""
    if not which("node"):
        return "skipped (no node)"
    f, rep = _frames(_head([1.9, 2.8]) + _THROUGH, [1.9, 2.8])
    assert not rep.get("errors"), rep["errors"][:3]
    a, b = _near_op(f[1.9]), _near_op(f[2.8])
    assert a > 0.95, f"control: the near layer is at {a} before the push"
    assert b < 0.05, f"the near layer is at {b} mid push (the title shows cut)"
    return f"near layer {a:.2f} before the push, {b:.2f} mid push"


_BAL = """Loom.scene("holo_test", { build(ctx) {
  const H = ctx.engine.hud(ctx);
  const y = %s;
  H.title("head", { x: 120, y: y, w: 1300, h: 150, kicker: "Model operations", text: "What we watch", at: 0.2 });
  H.card("a", { x: 120, y: y + 210, w: 520, h: 270, kicker: "Drift", value: 8, unit: "%%", label: "from training", at: 0.6 });
  H.card("b", { x: 700, y: y + 210, w: 520, h: 270, kicker: "Latency", value: 210, unit: "ms", label: "p95", at: 0.8 });
}});
"""


def check_hologram_briefing_sits_centred_above_the_captions():
    """a briefing composition crowded at the top (title at 92, cards ending at 572: the lower third empty) warns
    holo_top_heavy; the same block placed with H.vcenter(480) does not (the control)."""
    if not which("node"):
        return "skipped (no node)"
    code = lambda rep: [w for w in rep.get("warnings", []) if w.get("code") == "holo_top_heavy"]  # noqa: E731
    _, rep = _frames(_head([3.0]) + _BAL % "92", [3.0])
    assert not rep.get("errors"), rep["errors"][:3]
    assert code(rep), "a top-heavy briefing did not warn"
    _, rep2 = _frames(_head([3.0]) + _BAL % "H.vcenter(480)", [3.0])
    assert not code(rep2), f"control: the centred block warned {code(rep2)}"
    return "top-heavy briefing warns; H.vcenter places it centred (no warning)"


# ------------------------------------------------------------------ the hero moment (the wow pass, 2026-10-16)

_HERO = """Loom.scene("holo_test", { build(ctx) {
  const H = ctx.engine.hud(ctx);
  H.stage("stage", { at: 0.0 });
  const P = H.pad("pad", { cx: 960, cy: 800, r: 300, beam: 560, at: 0.1, seed: "t", %s });
  const R = H.object("rack", { model: "rack", cx: 960, cy: 800, size: 520, at: 0.5, yaw: -60, spin: 10, spinFrom: 0.5, spinTo: 3.0,
    build: { at: 0.5, dur: 2.0 }, explode: [{ t: 5.0, to: 1, dur: 1.0 }], hot: [{ part: "psu", t0: 3.5 }] });
  H.chrome("chrome", { tl: "Data hall B", bind: R, at: 0.1 });
  H.datum("d", { x: 200, y: 600, w: 300, label: "Power draw", value: 6.2, decimals: 1, unit: "kW", to: R.anchor("psu", 3.2), at: 3.2, %s });
  H.lock(R.part("psu", 3.2), { at: 3.2, label: "Power unit", status: "warn" });
}});
"""


def _segs(svg: str, name: str, part: str | None = None) -> int:
    """the number of drawn segments in an object's core paths (all parts, or one)"""
    el = _el(svg, name)
    if part:
        i = el.find(f'data-part="{part}"')
        el = el[i:el.find("data-part=", i + 12)] if i >= 0 else ""
    return sum(m.group(1).count("M") for m in re.finditer(r'<path d="([^"]*)"[^>]*data-band=', el) if m.group(1) != "M0,0")


def check_hologram_object_scans_fogs_lights_and_explodes():
    """H.object: a rack is built by a rising scan plane (none of it before the scan, part of it midway, all after), its
    lines fog with depth (near band brighter than far), the active part turns hot (near-white) only from its time, the
    servers move on the explode, and the same build draws the same frame twice. Controls: the frame before the scan has
    no segment; the psu is cyan before its hot time; an unknown model is refused."""
    if not which("node"):
        return "skipped (no node)"
    times = [0.4, 1.4, 3.3, 4.0, 6.5]
    f, rep = _frames(_head(times) + _HERO % ("", ""), times)
    assert not rep.get("errors"), rep["errors"][:3]
    n0, n1, n2 = _segs(f[0.4], "rack"), _segs(f[1.4], "rack"), _segs(f[3.3], "rack")
    assert n0 == 0 and 0 < n1 < n2, f"control and build: segments {n0} before, {n1} midway, {n2} built"
    ops = {int(m.group(2)): float(m.group(1)) for m in re.finditer(r'opacity="([\d.]+)" data-band="(\d)"', _el(f[3.3], "rack"))}
    assert ops[0] > ops[1] > ops[2], f"no depth fog: band opacities {ops}"
    psu = lambda s: _el(s, "rack").split('data-part="psu"', 1)[1].split("data-part=", 1)[0]  # noqa: E731
    ink, cyan = _pal()["ink"].lower(), _pal()["accent"].lower()
    assert f'stroke="{cyan}"' in psu(f[3.3]).lower() and f'stroke="{ink}"' in psu(f[4.0]).lower() and f'stroke="{ink}"' not in psu(f[3.3]).lower(), "the psu did not turn hot at its time (control: cyan before)"
    srv = lambda s: re.search(r'data-part="srv1".*?<path d="M([-\d.]+),([-\d.]+)[^"]*"[^>]*data-band', _el(s, "rack"), re.S).groups()  # noqa: E731
    assert srv(f[4.0]) != srv(f[6.5]), "the servers did not move on the explode"
    g, _ = _frames(_head(times) + _HERO % ("", ""), times)
    assert g == f, "the hero drew different frames in two builds"
    bad, rep2 = _frames(_head([1.0]) + _HERO.replace('model: "rack"', 'model: "toaster"') % ("", ""), [1.0])
    assert rep2.get("errors") or not bad, "control: an unknown model was accepted"
    return f"segments 0 / {n1} / {n2} through the scan; fog {ops[0]} > {ops[1]} > {ops[2]}; psu hot from its time; explode moves the servers; identical twice"


def check_hologram_pad_turns_inside_its_window_only():
    """H.pad: the dashed ring and ticks turn and the dust drifts inside the pad's window, and nothing on it moves after the
    window ends (the control: two times after spinTo draw the same pad)."""
    if not which("node"):
        return "skipped (no node)"
    times = [1.5, 2.5, 4.2, 4.8]
    f, rep = _frames(_head(times) + _HERO % ("spinTo: 4.0", ""), times)
    assert not rep.get("errors"), rep["errors"][:3]
    pad = {t: _el(f[t], "pad") for t in times}
    assert pad[1.5] != pad[2.5], "the pad did not move inside its window"
    off = lambda s: re.search(r'stroke-dasharray="22 14"[^>]*stroke-dashoffset="([-\d.]+)"|stroke-dashoffset="([-\d.]+)"[^>]*', s)  # noqa: E731
    assert off(pad[1.5]) and off(pad[1.5]).group(0) != off(pad[2.5]).group(0), "the dashed ring did not turn"
    assert pad[4.2] == pad[4.8], "control: the pad still moved after its window"
    motes = len(re.findall(r'<circle [^>]*fill="#E3F6FC"', pad[2.5]))
    assert motes >= 20, f"only {motes} motes"
    return f"the pad turns and {motes} motes drift inside the window; still after it"


def check_hologram_glow_never_sits_under_words_and_strokes_have_two_passes():
    """the additive glow: an object's lines have two soft passes (a wide faint one, a narrow brighter one) and a HUD
    stroke has two halo paths; no word (text) is ever inside a glow group or a blurred path. Controls: the glow groups
    and halos exist (the check is not vacuous); a stroke with halo false has none."""
    if not which("node"):
        return "skipped (no node)"
    f, rep = _frames(_head([4.0]) + _HERO % ("", ""), [4.0])
    assert not rep.get("errors"), rep["errors"][:3]
    s = f[4.0]
    glows = re.findall(r'<g class="lm-holo-glow"[^>]*>(.*?)</g>', s, re.S)
    assert len(glows) >= 10 and all(g.count("<path") == 2 for g in glows), f"{len(glows)} glow groups"
    assert not any("<text" in g for g in glows), "a word sits inside a glow group"
    assert not re.search(r'<text[^>]*filter=', s), "a word is blurred"
    fr = _el(s, "chrome_tl")
    assert "lm-holo-halo" not in fr, "control: chrome corners are drawn with halo false and still have one"
    corner = _el(s, "lock_rack_psu") if 'data-name="lock_rack_psu"' in s else ""
    assert corner.count("lm-holo-halo") >= 1
    t2, _ = _frames(_head([2.0]) + 'Loom.scene("holo_test", { build(ctx) { const H = ctx.engine.hud(ctx); H.frame("fr", { x: 200, y: 200, w: 400, h: 300, at: 0.2 }); }});\n', [2.0])
    halos = len(re.findall(r'class="lm-holo-halo"', _el(t2[2.0], "fr")))
    assert halos == 8, f"a frame's four corner first arms should carry two halo passes each (got {halos})"
    return f"{len(glows)} two-pass glow groups, no word inside one; a frame's corners carry {halos} halo passes (2 each); chrome has none"


def check_hologram_chrome_reads_the_object_and_the_datum_rolls_amber():
    """H.chrome bound to an object shows its true azimuth, which changes while it turns and holds after (control: two
    times after the turntable stops read the same); the corners sit above the caption band. H.datum shows its value in
    amber with rolling digits that settle on the value (control: roll false shows the value at once)."""
    if not which("node"):
        return "skipped (no node)"
    times = [1.0, 2.0, 3.4, 3.6, 4.6, 5.6]
    f, rep = _frames(_head(times) + _HERO % ("", ""), times)
    assert not rep.get("errors"), rep["errors"][:3]
    az = lambda s: re.search(r">(AZ \d{3}°  EL \d{2}°)<", _el(s, "chrome_br")).group(1)  # noqa: E731
    assert az(f[1.0]) != az(f[2.0]) and az(f[4.6]) == az(f[5.6]), (az(f[1.0]), az(f[2.0]), az(f[4.6]))
    for k in ("bl", "br"):
        m = re.search(r'data-name="chrome_%s" data-w="[\d.]+" data-h="([\d.]+)"[^>]*transform="translate\([-\d.]+ ([-\d.]+)\)"' % k, f[1.0])
        assert m, f"no chrome_{k} element"
        assert float(m.group(2)) + float(m.group(1)) <= 930, f"chrome {k} reaches {float(m.group(2)) + float(m.group(1))} (the caption band starts at 930)"
    val = lambda s: re.findall(r'fill="#FFB547"[^>]*>\s*<tspan[^>]*>([^<]*)<', _el(s, "d"))  # noqa: E731
    assert val(f[4.6]) == ["6.2"], val(f[4.6])
    assert val(f[3.6]) and val(f[3.6]) != ["6.2"], f"the value did not roll (it read {val(f[3.6])} at once)"
    g, _ = _frames(_head([3.6]) + _HERO % ("", "roll: false"), [3.6])
    assert val(g[3.6]) == ["6.2"], f"control: roll false {val(g[3.6])}"
    return f"azimuth {az(f[1.0])} -> {az(f[2.0])}, held at {az(f[4.6])}; the datum rolls ({val(f[3.6])[0]}) then reads 6.2 in amber"


# ------------------------------------------------------------------ hologram v2 (2026-10-16): light, not a dashboard

_V2 = """Loom.scene("holo_test", { build(ctx) {
  const H = ctx.engine.hud(ctx);
  H.stage("stage", { at: 0.0 });
  H.plane("far_plane", { x: 400, y: 200, w: 800, h: 100, top: 0.2, lit: "bottom", label: "Layer 3", depth: "far", at: 0.2 });
  H.plane("near_plane", { x: 380, y: 340, w: 860, h: 100, top: 0.12, lit: "bottom", label: "Layer 1", at: 0.3 });
  const TK = H.tokens("tok", { x: 400, y: 700, w: 800, tokens: ["Why", "is", "Frank", "furt", "hot"], focus: 4, at: 0.4, by: 1.0 });
  const P = {}; for (let i = 0; i < 5; i++) P["t" + i] = TK.top(i);
  H.arcs("att", { points: P, links: [{ from: "t4", to: "t2", w: 0.6 }, { from: "t4", to: "t3", w: 0.3 }, { from: "t4", to: "t0", w: 0.05 }], at: 1.2, by: 1.8 });
  H.reading("rd", { x: 100, y: 400, w: 300, label: "Attention to Frank", value: 0.71, decimals: 2, micro: ["layer 2, head 5"], at: 1.5 });
  const D = H.dist("dist", { x: 1400, y: 300, w: 420, title: "Next word", rows: [["load", 0.618], ["traffic", 0.207]], at: 1.6 });
  D.pick(0, 3.0);
}});
"""


def _filtered_texts(svg: str) -> tuple[int, int, list[str]]:
    """(filtered groups, texts, texts inside a filtered group): a tag walk over the frame's markup"""
    stack, nfilt, ntext, bad = [], 0, 0, []
    for m in re.finditer(r"<(/?)(g|text)\b([^>]*?)(/?)>", svg):
        close, tag, attrs, selfc = m.groups()
        if tag == "g":
            if close:
                if stack:
                    stack.pop()
            elif not selfc:
                f = "filter=" in attrs
                nfilt += f
                stack.append(f)
        elif tag == "text" and not close:
            ntext += 1
            if any(stack):
                bad.append(svg[m.end():m.end() + 60])
    return nfilt, ntext, bad


def check_hologram_v2_light_blooms_lines_never_words():
    """the v2 pieces put their light on line art only: plane edges, strong arcs, the focus underline and the pick bloom
    (halation and fringe), the far plane's sheet is out of focus, and no word sits in any filtered group. Controls:
    the filtered groups exist (the check is not vacuous) and the far plane's sheet carries the depth-of-field filter
    while its label does not."""
    if not which("node"):
        return "skipped (no node)"
    f, rep = _frames(_head([4.0]) + _V2, [4.0])
    assert not rep.get("errors"), rep["errors"][:3]
    s = f[4.0]
    nfilt, ntext, bad = _filtered_texts(s)
    assert nfilt >= 5 and ntext >= 10, f"control: {nfilt} filtered groups, {ntext} texts"
    assert not bad, f"words inside a filter: {bad[:3]}"
    far = _el(s, "far_plane")
    assert re.search(r'<g filter="url\(#lmholo2_[^"]*_dof\)"', far), "the far plane's sheet is not out of focus"
    assert ">Layer 3<" in far and not _filtered_texts(far)[2], "the far plane's label is blurred"
    assert not re.search(r"_dof\)", _el(s, "near_plane")), "a mid plane was blurred"
    return f"{nfilt} filtered groups of line art, {ntext} words, none filtered; far sheet out of focus, its label sharp"


def check_hologram_v2_arcs_weigh_and_the_pick_lights_on_the_word():
    """weighted arcs: the stroke width and light grow with the weight (0.6 > 0.3 > 0.05), a weight is written only for
    arcs at or above the label threshold; the distribution's pick lights only from its time. Controls: before the pick
    its bloom is dark; the 0.05 arc has no number."""
    if not which("node"):
        return "skipped (no node)"
    f, rep = _frames(_head([2.6, 3.6]) + _V2, [2.6, 3.6])
    assert not rep.get("errors"), rep["errors"][:3]
    att = _el(f[3.6], "att")
    widths = sorted(float(w) for w in re.findall(r'<path [^>]*stroke-width="([\d.]+)"[^>]*stroke-linecap="round"', att))
    assert len(widths) == 3 and widths[0] < widths[1] < widths[2], widths
    assert ">0.60<" in att and ">0.30<" in att and ">0.05<" not in att, "control: weight labels"
    pk = lambda s: re.search(r'<g filter="url\(#lmholo2_[^"]*_hal\)" opacity="0"([^>]*)>\s*<rect[^>]*opacity="0.95"', _el(s, "dist"))  # noqa: E731
    op = lambda s: _tag_op('<g opacity="0"' + pk(s).group(1) + ">")  # noqa: E731
    assert pk(f[2.6]) and op(f[2.6]) < 0.05, "control: the pick lit before its time"
    assert op(f[3.6]) > 0.95, "the pick did not light"
    return f"arc widths {widths}; weights written at 0.6 and 0.3 only; the pick dark at 2.6 s, lit at 3.6 s"


_HERO3D = """Loom.scene("holo_test", { build(ctx) {
  %s
  const H = ctx.engine.hud(ctx);
  const R = H.hero3d("rack", { at: 0.2 });
  window.__holoProbe = R.asset ? [R.part("switch", 0.5).rect, R.anchor("switch", 1.0)] : null;
  if (R.asset) H.lock(R.part("switch", 0.5), { at: 0.5, label: "Switch", caps: false });
}});
"""
_ASSET = ('Loom.assets.hero3d = { rack: { src: "data:video/webm;base64,", rect: [500, 60, 1000, 800], dur: 4, fps: 12, size: [1000, 800],'
          ' anchors: [[0, { switch: [100, 100, 50, 20] }], [1, { switch: [200, 100, 50, 20] }]] } };')


def check_hologram_v2_hero3d_points_locks_at_the_rendered_parts():
    """H.hero3d reads the anchors the bridge exported: a part's box in the clip, sampled over time, interpolated and
    placed in the HUD (rect offset), so a lock lands on the part at its time. Control: with no rendered clip it warns
    holo_hero_missing and draws nothing."""
    if not which("node"):
        return "skipped (no node)"
    f, rep = _frames(_head([1.5]) + _HERO3D % _ASSET, [1.5])
    assert not rep.get("errors"), rep["errors"][:3]
    lk = re.search(r'data-name="lock_rack_switch"[^>]*transform="translate\(([-\d.]+) ([-\d.]+)\)"', f[1.5])
    assert lk, "no lock on the hero's part"
    x, y = float(lk.group(1)), float(lk.group(2))
    assert abs(x - (500 + 150 - 12)) < 1.5 and abs(y - (60 + 100 - 12)) < 1.5, f"the lock is at {x},{y} (want 638,148: the part at t 0.5, interpolated)"
    _, rep2 = _frames(_head([1.5]) + _HERO3D % "", [1.5])
    # an error since D-194 (a hero with no rendered clip stops the lesson; it was a warning)
    assert any(w.get("code") == "holo_hero_missing" for w in (rep2.get("errors") or []) + (rep2.get("preview_errors") or [])
               if isinstance(w, dict)) or any("holo_hero_missing" in str(w) for w in (rep2.get("errors") or []) + (rep2.get("preview_errors") or [])),         f"control: a missing hero was not refused: {str(rep2.get('errors'))[:200]} {str(rep2.get('preview_errors'))[:200]}"
    return f"lock at {x:.0f},{y:.0f} from the anchors interpolated at 0.5 s; a missing hero is refused"


def check_hologram_v2_hero_renders_light_with_anchors_as_a_pure_function_of_time():
    """the WebGL hero (holo_hero preset through the bridge): it renders as light (alpha from brightness: the clip's
    corners are fully clear, its brightest lines opaque), exports a box for every named part, the boxes move with the
    turntable, and a frame is the same whether it is drawn after a later one or alone (the bridge samples the anchors
    first). Control: a still at 1.0 drawn after 6.0 equals one drawn alone; with no turn the wheel's box stays put.
    Needs a browser."""
    if not browser():
        return "skipped (no browser here)"
    from PIL import Image
    from loom import three_bridge as T
    d = Path(tempfile.mkdtemp(prefix="loomhero_"))
    try:
        P = {"model": "bicycle", "yaw": -0.5, "turn": [0, 6, 0.8], "build": [0.1, 0.6], "states": [{"key": "spin", "from": 0, "to": 10, "at": 0, "dur": 6}]}
        a = T.hero(P, "hologram", size=(640, 400), dur=6.5, fps=12, out=d / "a" / "h.webm", stills=[6.0, 1.0], step=0.5, work=d / "a")
        b = T.hero(P, "hologram", size=(640, 400), dur=6.5, fps=12, out=d / "b" / "h.webm", stills=[1.0], step=0.5, work=d / "b")
        from PIL import ImageChops
        ia, ib = Image.open(a["stills"][1.0]).convert("RGBA"), Image.open(b["stills"][1.0]).convert("RGBA")
        # the same to within 1/255: the bloom chain's first pass can round one level differently (measured: a frame drawn
        # after another differs by at most 1 on a few pixels; two frames drawn alone are identical). A state carried over
        # (the door that stayed open, 2026-10-16) moves whole parts, far beyond that
        worst = max(ImageChops.difference(ia, ib).getextrema(), key=lambda e: e[1])[1]
        assert worst <= 1, f"a frame drawn after a later one differs from the same frame drawn alone by {worst}/255 (state carried over)"
        px = list(ia.get_flattened_data()) if hasattr(ia, "get_flattened_data") else list(ia.getdata())
        assert ia.getpixel((0, 0))[3] == 0 and ia.getpixel((639, 399))[3] == 0, "the clip's corners are not clear (a box would show)"
        al = sorted(p[3] for p in px)
        assert al[-1] == 255 and al[len(al) // 2] < 60, f"not light over clear: alpha median {al[len(al) // 2]}, max {al[-1]} (a black box would be opaque everywhere)"
        A = a["anchors"]
        assert A and set(A[0][1]) >= {"frame", "front_wheel", "rear_wheel", "drivetrain"}, A[:1]
        fw = lambda an, t: next(v for tt, v in an if abs(tt - t) < 1e-6)["front_wheel"]  # noqa: E731
        assert fw(A, 0.0) != fw(A, 5.0), "the parts did not move with the turntable"
        c = T.hero(dict(P, turn=None), "hologram", size=(640, 400), dur=6.5, fps=12, out=d / "c" / "h.webm", stills=[1.0], step=0.5, work=d / "c")
        assert fw(c["anchors"], 0.0) == fw(c["anchors"], 5.0), "control: with no turn the wheel's box moved"
        return f"light over clear (alpha median {al[len(al) // 2]}, max 255, corners 0), {len(A[0][1])} parts anchored, boxes follow the turn, frames pure to {worst}/255 ({a['seconds']} s)"
    finally:
        shutil.rmtree(d, ignore_errors=True)


# ------------------------------------------------------------------ the hero in a composed lesson (D-188)

def _lesson_mod():
    import importlib.util
    f = ROOT / "docs/research/2026-10-16-style-stress/hologram_v2_composed.py"
    spec = importlib.util.spec_from_file_location("hologram_v2_composed", f)
    m = importlib.util.module_from_spec(spec); spec.loader.exec_module(m)
    return m


def _hero_shows(img, rect) -> tuple[int, float]:
    """(the brightest channel inside the hero's rect, how far its corner area is from the field outside it): a hero that
    is missing has no bright light in its rect; a hero shown as a black box has a corner much darker than the field"""
    x, y, w, h = rect
    crop = img.crop((x, y, x + w, y + h))
    peak = max(max(p[:3]) for p in crop.getdata())
    corner = img.crop((x + 4, y + 4, x + 40, y + 40)).resize((1, 1)).getpixel((0, 0))
    out = img.crop((max(0, x - 44), y + 4, max(4, x - 8), y + 40)).resize((1, 1)).getpixel((0, 0))
    return peak, sum(abs(a - b) for a, b in zip(corner[:3], out[:3])) / 3


def check_hologram_hero_plays_in_a_composed_lesson_and_is_cached():
    """a hologram beat's hero3d in a COMPOSED lesson: compose renders it through the clip store and writes the static
    footage video HyperFrames seeks, the manifest carries its anchors, a second compose takes it from the store, and
    the HyperFrames MP4 shows it as light (a bright hero in its rect, its corner no darker than the field beside it).
    Controls: the same checks fail on the frame with a black box pasted over the rect, and on a region with no hero.
    Needs a browser."""
    if not browser():
        return "skipped (no browser here)"
    import time as _t
    from PIL import Image, ImageDraw
    from loom import compose as CO, render as RD
    M = _lesson_mod()
    rect = [660, 140, 600, 700]
    L = M.TempLesson(dur=3.0, hero=M.hero_spec(3.0, rect=rect))
    try:
        rep = CO.compose(L)
        assert not rep["errors"], rep["errors"]
        html = (L.root / "build/index.html").read_text(encoding="utf-8")
        assert 'id="footage-b01-hero3d_rack"' in html and (L.root / "build/assets/footage/hero_b01_rack.webm").exists(), "no static hero video in the build"
        mf = json.loads((L.root / "build/manifest.json").read_text(encoding="utf-8"))
        A = mf["assets"]["hero3d"]["b01:rack"]
        assert A["anchors"] and "switch" in A["anchors"][0][1], "the manifest carries no anchors"
        t0 = _t.time(); CO.compose(L); t_again = _t.time() - t0
        A2 = json.loads((L.root / "build/manifest.json").read_text(encoding="utf-8"))["assets"]["hero3d"]["b01:rack"]
        assert A2["how"] == "store", f"a second compose rendered the hero again ({A2['how']})"
        try:
            mp4 = RD.render(L, quality="draft")
        except Exception as e:
            mp4 = L.path("renders/hero-lesson.mp4")
            if "render verification" not in str(e) or not mp4.exists():
                raise
        f = M.frames_from(mp4, [2.6], L.root / "frames", tag="test")[0]
        img = Image.open(f).convert("RGB")
        peak, gap = _hero_shows(img, rect)
        assert peak > 150, f"the hero is missing from the render (brightest {peak} in its rect)"
        assert gap < 12, f"the hero's rect shows as a box ({gap:.0f} levels from the field beside it)"
        boxed = img.copy(); ImageDraw.Draw(boxed).rectangle([rect[0], rect[1], rect[0] + 60, rect[1] + 60], fill=(0, 0, 0))
        assert _hero_shows(boxed, rect)[1] >= 12, "control: a black box over the rect's corner was not caught"
        assert _hero_shows(img, [60, 300, 300, 200])[0] <= 150, "control: a region with no hero read as a hero"
        return f"hero in the composed MP4 (peak {peak}, corner {gap:.1f} from the field); second compose {t_again:.1f} s from the store"
    finally:
        L.close()


def check_compose_loads_captured_pages_after_the_engine():
    """a lesson with projects/<id>/assets/pages/*.page.js gets each as a script after the style engine and before the
    scenes (so a screencast page region can find its capture); a lesson without the folder gets none (the control)."""
    from loom import compose as CO
    M = _lesson_mod()
    L = M.TempLesson(dur=2.0, pages={"shop": "window.__pageLoaded = (window.__pageLoaded || 0) + 1;\n"})
    L0 = M.TempLesson(dur=2.0)
    try:
        CO.compose(L, strict=False)
        html = (L.root / "build/index.html").read_text(encoding="utf-8")
        i_eng, i_pg, i_sc = html.find("runtime/engines/hologram.js"), html.find("assets/pages/shop.page.js"), html.find("scenes/b01.js")
        assert (L.root / "build/assets/pages/shop.page.js").exists() and i_pg > 0, "the captured page was not loaded"
        assert i_eng < i_pg < i_sc, f"order: engine {i_eng}, page {i_pg}, scene {i_sc}"
        CO.compose(L0, strict=False)
        assert "assets/pages/" not in (L0.root / "build/index.html").read_text(encoding="utf-8"), "control: a lesson with no pages folder loaded one"
        return "captured pages load after the engine and before the scenes; none without the folder"
    finally:
        L.close(); L0.close()


def check_hologram_lab_scenes_render_with_no_problem():
    """the engine's three lab scenes render in Chrome with no problem. Needs a browser."""
    if not browser():
        return "skipped (no browser here)"
    from loom import lab as LB
    d = Path(tempfile.mkdtemp(prefix="loomholol_"))
    try:
        for sc, ts in (("holo_briefing", [7.8, 19.4]), ("holo_analysis", [11.4, 21.6]), ("holo_lesson", [15.6, 25.6])):
            r = LB.strip(sc, "hologram", ts, out_dir=d / sc, frames_dir=d / sc / "f")
            assert not r["errors"], (sc, r["errors"][:4])
    finally:
        shutil.rmtree(d, ignore_errors=True)
    return "the three lab scenes render with no problem"
