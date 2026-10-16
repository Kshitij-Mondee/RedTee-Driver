"""Frames are a pure function of (manifest, time) (CLAUDE.md rule 3), tested where GSAP reads the page (L-270, L-289).

GSAP takes a scale's origin (transformOrigin "50% 50%") from getBBox when the playhead FIRST enters the tween, so the
origin was the element's drawing at whatever time was seeked first: a render that reached a pop frame by frame, one
that jumped into it (a HyperFrames worker starting its segment there) and one that visited a later time first drew
different frames. And GSAP defers a tween's first render ("lazy") until its ticker has ticked once, so what the build
measured (a rig's start pose, the figure check, the memo L-270 saw) depended on whether a rAF came before Loom.boot.

  seek order   a character popping in while it waves and a card stamping in while its line settles draw the SAME
               mid-reveal frames reached in order, by a jump, or after a later time (screenshot hashes); each origin
               is the centre of the element's drawing at its reveal's start
  ticker race  the page after the build, and the figure check it ran, are the same whether GSAP's ticker ticked
               before Loom.boot or not
  backward     a frame reached by seeking BACK to it is the frame a fresh jump draws: two sets at one instant (at 0 s
               and later), two opacity tweens that overlap, two scale tweens with different origins that overlap
               (GSAP renders a backward seek in reverse order, so the earlier tween used to win; L-290, L-302)

Without a browser they skip, by name. LOOM_TEST_RUNTIME=<dir> runs them against another runtime folder (that is how
each was shown to FAIL before the fix: docs/research/determinism/red_runtime_determinism.txt).
"""
from __future__ import annotations

import importlib.util
import sys
from pathlib import Path

ENGINE = Path(__file__).resolve().parents[2]
if str(ENGINE) not in sys.path:
    sys.path.insert(0, str(ENGINE))


def _rt():
    spec = importlib.util.spec_from_file_location("rtfd_helpers_for_determinism", ENGINE / "tests" / "suites" / "runtime_film_defects.py")
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


# ------------------------------------------------------------------ seek order
# ava pops in at 1.0 s while she raises her arm to wave (her drawing grows up and out during the pop); the card stamps
# in at 1.0 s while its line settles up from 160 px below (the card's drawing shrinks during the stamp)
_REVEAL = r"""
Loom.scene("b1", { build(ctx) {
  const A = ctx.character("ava", "ava", { x: 560, y: 1000, scale: 0.9 });
  A.pose("wave", ctx.start + 1.0, { dur: 0.6 }); A.gesture("wave", ctx.start + 1.0, ctx.start + 2.4);
  ctx.m.pop(A.E, ctx.start + 1.0, { dur: 0.8 });
  const C = ctx.el("card", { x: 1100, y: 300, w: 600, h: 400, kind: "card" });
  ctx.kit.rect(C.inner, 0, 0, 600, 280, { fill: "surface", r: 12 });
  const L = ctx.el("line", { x: 40, y: 300, w: 520, h: 80, kind: "card", parent: C });
  ctx.kit.rect(L.inner, 0, 0, 520, 80, { fill: "accent", r: 8 });
  ctx.m.settle(L, ctx.start + 1.0, { dy: 160, dur: 0.8 });
  ctx.m.stamp(C, ctx.start + 1.0, { dur: 0.8 });
} });
"""
# the origin each reveal is DRAWN about, read from its inner group's matrix (a scale s about (ox, oy) is
# matrix(s 0 0 s ox(1-s) oy(1-s))), and the centre of its drawing now. Not GSAP's data-svg-origin memo: that is
# written only when GSAP measures, so after a seek back it can name another tween's origin (2026-10-08)
_ORIGINS = r"""function () {
  const out = {};
  for (const n of ["ava", "card"]) {
    const g = document.querySelector(`.lm-el[data-name="${n}"] .lm-in`), b = g.getBBox();
    const m = g.transform.baseVal.consolidate(), M = m && m.matrix, s = M ? M.a : 1;
    out[n] = { s: +s.toFixed(4), origin: M && Math.abs(1 - s) > 0.02 ? [+(M.e / (1 - s)).toFixed(2), +(M.f / (1 - M.d)).toFixed(2)] : null,
               centre: [+(b.x + b.width / 2).toFixed(2), +(b.y + b.height / 2).toFixed(2)] };
  }
  return out;
}"""
_KEY = [1.1, 1.25, 1.45]


def _reveal_run(rt, times, regions=None):
    page = rt._lesson(_REVEAL, [{"kind": "bespoke", "scene": "b1"}], rt._ONE, 1, dur=4.0)
    return rt._run(page, _ORIGINS, times, regions=regions, hashes=regions is None)


def primitive_runtime_a_scaled_reveal_draws_the_same_frames_whatever_was_seeked_first():
    """the same mid-reveal frames of a pop (a rig that waves while it pops) and a stamp (a card whose line settles
    while it stamps), reached three ways: frame by frame from 0.5 s, by a jump straight in, and after visiting 3.0 s
    first; and each reveal scales about the centre of its element's drawing at the reveal's start (1.0 s). Controls:
    the reveal moves (its frames differ from each other and from the settled frame) and both elements paint"""
    rt = _rt()
    if not rt._browser():
        return rt._SKIP
    seq = [round(0.5 + k / 30, 4) for k in range(31)]
    orders = {"frame by frame": seq + _KEY + [3.0], "jump in": _KEY, "later first": [3.0] + _KEY}
    got = {}
    for name, times in orders.items():
        out = _reveal_run(rt, times)
        assert not out["report"]["errors"], (name, out["report"]["errors"])
        by_t = {}
        for s in out["samples"]:
            by_t[s["t"]] = (s["hash"], s["v"])
        got[name] = by_t
    # control: the reveal is in motion at the sampled times, and they are not the settled picture
    seq_h = [got["frame by frame"][t][0] for t in _KEY + [3.0]]
    assert len(set(seq_h)) == len(seq_h), f"the sampled frames do not move: {seq_h}"
    # control: both elements paint where they stand
    paint = _reveal_run(rt, [1.45], regions={"ava": {"el": "ava", "box": [380, 190, 740, 1000]}, "card": {"el": "card", "box": [1100, 300, 1700, 700]}})["samples"][0]["px"]
    assert paint["ava"] > 0.05 and paint["card"] > 0.05, f"an element paints nothing: {paint}"
    bad = []
    for t in _KEY:
        hs = {name: got[name][t][0][:8] for name in orders}
        if len(set(hs.values())) > 1:
            bad.append(f"{t} s: " + ", ".join(f"{k} {h} (origins {got[k][t][1]['ava']['origin']}, {got[k][t][1]['card']['origin']})" for k, h in hs.items()))
    assert not bad, "the same frame differs with what was seeked before it: " + "; ".join(bad)
    # the origin is the centre of the element's drawing when its reveal starts (measured on a fresh page at 1.0 s),
    # read at 1.1 s where both are still well away from scale 1
    ref = _reveal_run(rt, [1.0])["samples"][0]["v"]
    for name in orders:
        for n in ("ava", "card"):
            o = got[name][_KEY[0]][1][n]["origin"]
            assert o and all(abs(a - b) <= 1.0 for a, b in zip(o, ref[n]["centre"])), f"{name}: {n} scales about {o}, its drawing's centre at 1.0 s is {ref[n]['centre']}"
    return (f"{len(_KEY)} mid-reveal frames identical in 3 seek orders; drawn about ava {got['jump in'][_KEY[0]][1]['ava']['origin']}, "
            f"card {got['jump in'][_KEY[0]][1]['card']['origin']} (drawing centres at 1.0 s {ref['ava']['centre']}, {ref['card']['centre']})")


# ------------------------------------------------------------------ ticker race
# Before GSAP's ticker first ticks, a tween's first render waits in a queue (lazy); after, it is written at once. The
# two states are forced here with GSAP's own API: a tick before the build, or a paused root so the tick renders nothing
# (the state of a page whose fonts came back before the first animation frame).
_PRE = {"ticked": "gsap.ticker.tick();", "unticked": "gsap.globalTimeline.pause(); gsap.ticker.tick();"}
_POST = {"ticked": "", "unticked": "gsap.globalTimeline.resume();"}
# a figure whose arms (her start pose) reach past the frame's left edge, her feet at x 120
_EDGE = r"""
Loom.scene("b1", { build(ctx) {
  const A = ctx.character("ava", "ava", { x: 120, y: 1000, scale: 1 });
  ctx.m.pop(A.E, ctx.start + 1.0, { dur: 0.8 });
} });
"""
_AFTER_BOOT = "window.__built = document.getElementById('lm-world').outerHTML;"


def _edge_run(rt, variant, times, regions=None):
    page = rt._lesson(_EDGE, [{"kind": "bespoke", "scene": "b1"}], rt._ONE, 1, dur=4.0)
    f = page / "index.html"
    html = f.read_text(encoding="utf-8")
    boot = "<script>Loom.boot(window.LOOM_MANIFEST);</script>"
    assert boot in html, "the test page no longer boots as this test expects"
    f.write_text(html.replace(boot, f"<script>{_PRE[variant]} Loom.boot(window.LOOM_MANIFEST).then(() => {{ {_AFTER_BOOT} {_POST[variant]} }});</script>"), encoding="utf-8")
    return rt._run(page, "function () { return window.__built; }", times, regions=regions)


def primitive_runtime_the_build_does_not_depend_on_whether_gsap_ticked_before_boot():
    """the page right after Loom.boot (the whole world's markup) and the figure check the build ran are the same
    whether GSAP's ticker ticked before the build or not. Control: the figure IS cut at the frame (her arm paints in
    the frame's first 30 px at 2.0 s), so the check must warn in both"""
    rt = _rt()
    if not rt._browser():
        return rt._SKIP
    runs = {v: _edge_run(rt, v, [2.0]) for v in _PRE}
    warn = {v: [w["msg"] for w in r["report"]["warnings"] if w["code"] == "figure_cropped"] for v, r in runs.items()}
    built = {v: r["samples"][0]["v"] for v, r in runs.items()}
    assert all(len(b) > 2000 for b in built.values()), "the world was not built"
    paint = _edge_run(rt, "ticked", [2.0], regions={"edge": {"el": "ava", "box": [0, 300, 30, 900]}})["samples"][0]["px"]["edge"]
    assert paint > 0.01, f"control: the figure does not reach the frame's edge (painted share {paint})"
    assert warn["ticked"] == warn["unticked"], f"the figure check depends on the ticker: ticked {warn['ticked']}, unticked {warn['unticked']}"
    assert warn["ticked"], "the figure reaches past the frame's edge but the check did not warn"
    if built["ticked"] != built["unticked"]:
        a, b = built["ticked"], built["unticked"]
        i = next((k for k in range(min(len(a), len(b))) if a[k] != b[k]), min(len(a), len(b)))
        raise AssertionError(f"the built page depends on the ticker; first difference at char {i}: ticked ...{a[max(0, i - 80):i + 80]}... "
                             f"unticked ...{b[max(0, i - 80):i + 80]}...")
    return f"built page identical in both ticker states ({len(built['ticked'])} chars); the figure check warns in both ({warn['ticked'][0][:60]}...)"


# ------------------------------------------------------------------ backward seeks
# GSAP renders a seek that moves backward in reverse order: where two tweens of one element and property touch the
# frame, the EARLIER one is written last. Each case here is one way that happens.
_BACK = r"""
Loom.scene("b1", { build(ctx) {
  // two sets at one instant, at 0 s (a place hidden and shown at once, lab_places) and at 2 s
  const S0 = ctx.el("sets0", { x: 100, y: 100, w: 300, h: 200, kind: "card" });
  ctx.kit.rect(S0.inner, 0, 0, 300, 200, { fill: "accent", r: 8 });
  Loom.set(S0.outer, { opacity: 0 }, 0); Loom.set(S0.outer, { opacity: 1 }, 0);
  const S2 = ctx.el("sets2", { x: 500, y: 100, w: 300, h: 200, kind: "card" });
  ctx.kit.rect(S2.inner, 0, 0, 300, 200, { fill: "accent", r: 8 });
  Loom.set(S2.outer, { opacity: 0 }, 2); Loom.set(S2.outer, { opacity: 1 }, 2);
  // two opacity tweens that overlap: an entrance from 1.0 to 2.0, an exit from 1.5
  const O = ctx.el("overlap", { x: 900, y: 100, w: 300, h: 200, kind: "card" });
  ctx.kit.rect(O.inner, 0, 0, 300, 200, { fill: "accent", r: 8 });
  Loom.tween(O.inner, { opacity: 0 }, { opacity: 1, duration: 1.0, ease: "none" }, 1.0, { kind: "reveal" });
  Loom.tween(O.inner, { opacity: 1 }, { opacity: 0.2, duration: 1.0, ease: "none" }, 1.5, { kind: "exit" });
  // two scale tweens that overlap, about different origins: a grow from the bottom, then a pop about the centre
  const G = ctx.el("origins", { x: 1300, y: 100, w: 400, h: 400, kind: "card" });
  ctx.kit.rect(G.inner, 0, 0, 400, 400, { fill: "accent", r: 8 });
  Loom.tween(G.inner, { scale: 0.3, transformOrigin: "50% 100%" }, { scale: 1, duration: 1.0, ease: "none" }, 1.0, { kind: "grow" });
  Loom.tween(G.inner, { scale: 0.6, transformOrigin: "0% 0%" }, { scale: 1.2, duration: 1.0, ease: "none" }, 1.5, { kind: "pop" });
} });
"""
# what the page draws from: each element's computed opacity and inner transform, and the whole world's markup. Not the
# screenshot: the same markup, captured after a different run of earlier screenshots, differed in 3 pixels (max 11 of
# 765) at one edge, a raster artifact; with no screenshots in between the two paths were pixel-identical (2026-10-15)
_BACK_STATE = r"""function () {
  const out = {};
  for (const n of ["sets0", "sets2", "overlap", "origins"]) {
    const e = document.querySelector(`.lm-el[data-name="${n}"]`), g = e.querySelector(".lm-in");
    out[n] = [getComputedStyle(e).opacity, getComputedStyle(g).opacity, g.getAttribute("transform") || ""].join(" | ");
  }
  out.world = document.getElementById("lm-world").outerHTML;
  return out;
}"""
def _unset(html):
    return html.replace(' style="opacity: 1;"', '')


# (frame, the later times a backward seek comes from)
_BACK_CASES = [(3.0, [5.0, 0.0]), (3.0, [5.0, 2.0]), (1.75, [3.0]), (1.75, [5.0, 1.6])]


def primitive_runtime_a_frame_reached_backward_is_the_frame_a_fresh_jump_draws():
    """four backward paths (to 0 s then 3 s, to 2 s then 3 s, from 3 s to 1.75 s, from 5 s via 1.6 s to 1.75 s) draw
    the same world (its whole markup, each element's computed opacity and transform) as a fresh page that jumps straight
    to the frame. Controls: the fresh frames show every element (sets shown, the overlap mid-fade, the origins
    mid-scale) and the three times differ"""
    rt = _rt()
    if not rt._browser():
        return rt._SKIP
    def run(times):
        page = rt._lesson(_BACK, [{"kind": "bespoke", "scene": "b1"}], rt._ONE, 1, dur=6.0)
        out = rt._run(page, _BACK_STATE, times)
        assert not out["report"]["errors"], out["report"]["errors"]
        return out["samples"]
    fresh = {t: run([t])[0]["v"] for t in sorted({c[0] for c in _BACK_CASES} | {0.5})}
    # controls: what the fresh frames should show
    f3, f175, f05 = fresh[3.0], fresh[1.75], fresh[0.5]
    assert f3["sets0"].startswith("1 ") and f3["sets2"].startswith("1 "), f"control: a set pair does not end shown at 3.0 s: {f3['sets0']}, {f3['sets2']}"
    assert "matrix(1,0,0,1,0,0)" not in f175["origins"] and f175["overlap"].split(" | ")[1] not in ("1", "0"), f"control: nothing mid-tween at 1.75 s: {f175['overlap']}, {f175['origins']}"
    assert len({f05["world"], f175["world"], f3["world"]}) == 3, "control: the frames do not change"
    bad = []
    for t, before in _BACK_CASES:
        v = run(before + [t])[-1]["v"]
        diff = {k: (fresh[t][k], v[k]) for k in v if k != "world" and v[k] != fresh[t][k]}
        # a set crossed backward is reverted to the COMPUTED value GSAP recorded, an inline opacity 1, where a fresh page
        # never wrote one: the same picture (screenshot hashes equal, 2026-10-15), so that one inline value counts as unset
        if diff or _unset(v["world"]) != _unset(fresh[t]["world"]):
            bad.append(f"{t} s after {before}: {diff or 'the markup elsewhere'}")
    assert not bad, "a frame reached backward differs from a fresh jump (fresh, backward): " + "; ".join(bad)
    return f"{len(_BACK_CASES)} backward paths draw the fresh frame (sets at 0 s and 2 s, overlapping opacity, overlapping origins)"
