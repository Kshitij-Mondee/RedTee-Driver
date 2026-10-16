"""Clean beat joins (D-190). Kshitij on the four style test lessons (2026-10-16): "where a new beat is supposed to appear,
old beat is getting flashed again for like a second and sometimes some old elements flicker in the new beats".

Two causes, both in the engine's joins (runtime/world.js, runtime/motion.js):
  held then sent away  a beat held the old beat's elements (keep or ctx.held) only to exit them at its first words. The
                       hold took them out of the join's exit, so a screen cover closed on them, opened on them again, and
                       they left 0.35 s later (st-sc-2fa b14). Now such an exit releases the hold and the join retires them.
  redrawn in place     a beat drew its own copy of what was just there (a token row, a window). The old one left first and
                       the same picture rebuilt from nothing (st-holo-ai b05, b06; st-sc-2fa b24). Now the old one stays
                       until the copy is in and fades under it.

Real runtime in headless Chrome (the runtime_film_defects harness); LOOM_TEST_RUNTIME=<dir> runs them against another
runtime folder. Without a browser they skip, by name.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from runtime_film_defects import _ONE, _SKIP, _browser, _lesson, _run  # noqa: E402

# the effective opacity of each named top-level element, read on its inner group (0 when it or an ancestor is display none / hidden)
_OPAC = r"""function () {
  const out = {};
  for (const e of document.querySelectorAll(".lm-scene > .lm-el")) {
    // the element's own groups (mover, life, inner: motion lives on inner) and everything above it
    const inner = e.querySelector(":scope > .lm-mv > .lm-life > .lm-in");
    let o = 1;
    for (let x = inner || e; x && x !== document.body; x = x.parentElement) {
      const cs = getComputedStyle(x);
      if (cs.display === "none" || cs.visibility === "hidden") { o = 0; break; }
      o *= parseFloat(cs.opacity);
    }
    out[e.getAttribute("data-name")] = +o.toFixed(2);
  }
  const c = document.getElementById("lm-join-cover");
  out.__cover = c && c.style.visibility === "visible" ? 1 : 0;
  out.__swaps = Loom.report.swaps || [];
  return out;
}"""

_CARD = 'const %(v)s = ctx.el("%(n)s", { x: %(x)d, y: 300, w: 600, h: 300, kind: "card" }); ctx.kit.rect(%(v)s.inner, 0, 0, 600, 300, { fill: "accent", r: 8 });'

_SCENES = r"""
Loom.scene("b1", { build(ctx) {
  %(a)s ctx.m.reveal(A, ctx.start + 0.1);
  %(r)s ctx.m.reveal(R, ctx.start + 0.1);
} });
// a screen join (fade): holds both and exits them at its first words (st-sc-2fa b14), then draws something new elsewhere
Loom.scene("b2", { build(ctx) {
  ctx.m.exit(ctx.held("panel"), ctx.start + 0.35, "recede");
  ctx.m.exit(ctx.held("row"), ctx.start + 0.35, "recede");
  %(n2)s ctx.m.reveal(N, ctx.start + 0.2);
} });
// continue: its own copy of the row on the same spot (not held)
Loom.scene("b3", { build(ctx) {
  %(r3)s ctx.m.reveal(R3, ctx.start + 0.3);
} });
// continue: holds the row, exits it at once and draws its copy (the st-holo-ai b05 pattern)
Loom.scene("b4", { build(ctx) {
  ctx.m.exit(ctx.held("row_b3"), ctx.start, "recede");
  %(r4)s ctx.m.reveal(R4, ctx.start + 0.3);
  %(k4)s ctx.m.reveal(K, ctx.start + 0.1);
} });
// control: holds "keeper" and sends it away late, on its own time (placed as written)
Loom.scene("b5", { build(ctx) {
  ctx.m.exit(ctx.held("keeper"), ctx.start + 2.5, "recede");
  ctx.m.exit(ctx.held("row_b4"), ctx.start + 2.5, "recede");
  %(p5)s ctx.m.reveal(PL, ctx.start + 0.1);
} });
// a canvas join whose first drawing arrives late (st-holo-ai b08); also the film's last beat (the end hold has its own
// rules, so the control above sits in a middle beat)
Loom.scene("b6", { build(ctx) { %(n6)s ctx.m.reveal(Z, ctx.start + 0.8); } });
// a cut to a beat whose first drawing arrives 0.7 s in: the cut waits for it, the old picture holds until then
Loom.scene("b7", { build(ctx) { %(n7)s ctx.m.reveal(C7, ctx.start + 0.7); } });
""" % {
    "a": _CARD % {"v": "A", "n": "panel", "x": 100},
    "r": _CARD % {"v": "R", "n": "row", "x": 1000},
    "n2": _CARD % {"v": "N", "n": "fresh", "x": 650},
    "r3": _CARD % {"v": "R3", "n": "row_b3", "x": 1000},
    "r4": _CARD % {"v": "R4", "n": "row_b4", "x": 1000},
    "k4": _CARD % {"v": "K", "n": "keeper", "x": 100},
    "n6": _CARD % {"v": "Z", "n": "last", "x": 650},
    "p5": _CARD % {"v": "PL", "n": "plate", "x": 1000},
    "n7": _CARD % {"v": "C7", "n": "after_cut", "x": 100},
}


def primitive_runtime_old_elements_never_come_back_at_a_join():
    """b1 -> b2 is a fade cover: b2 holds b1's panel and row and exits them at its start. They must be gone once the
    cover opens (before: the cover opened on them and they left after). b2 -> b3 (continue): b3's row copies (b2 drew no row). b3 -> b4 (continue): b4 holds b3's row, exits it
    at once and draws its own copy on the same spot: the place is never empty (old or new fully shown at every sample).
    b5 -> b6 (canvas, the new drawing arriving 0.8 s in): the frame is never empty (st-holo-ai b08). b6 -> b7 (cut, the
    new drawing arriving 0.7 s in): the old picture holds to the cut, which waits for the new drawing, then is gone in
    one frame (st-holo-ai b10, b12, b16, b21).
    Control: b5 holds "keeper" and sends it away at its own time (start + 2.5): still fully shown at start + 2.0."""
    if not _browser():
        return _SKIP
    scenes = [{"kind": "bespoke"},
              {"kind": "bespoke", "join_in": {"type": "fade"}},
              {"kind": "bespoke", "join_in": {"type": "continue"}},
              {"kind": "bespoke", "join_in": {"type": "continue"}},
              {"kind": "bespoke", "join_in": {"type": "continue"}},
              {"kind": "bespoke", "join_in": {"type": "canvas"}},
              {"kind": "bespoke", "join_in": {"type": "cut"}}]
    # beats of 4 s: b2 starts at 4 (cover about 3.6 to 4.4), b4 at 12, b5 at 16
    after_cover = [4.42, 4.5, 4.6, 4.8, 5.0]
    swap = [11.7, 11.9, 12.0, 12.1, 12.2, 12.35, 12.5, 12.7, 12.9, 13.1]
    canvas = [19.7, 19.9, 20.1, 20.3, 20.5, 20.7, 20.9, 21.1]
    cut_hold, cut_after = [23.9, 24.2, 24.5, 24.65], [24.75, 24.9]
    times = after_cover + swap + [18.0, 19.2] + canvas + cut_hold + cut_after
    out = _run(_lesson(_SCENES, scenes, _ONE, 7), _OPAC, times)
    errs = [(e["code"], e["beat"]) for e in out["report"]["errors"]]
    assert not [e for e in errs if e[0] in ("scene_threw", "held_missing")], f"the scenes failed: {errs}"
    S = {s["t"]: s["v"] for s in out["samples"]}
    back = {t: (S[t].get("panel", 0), S[t].get("row", 0)) for t in after_cover if max(S[t].get("panel", 0), S[t].get("row", 0)) > 0.05}
    assert not back, f"held-then-exited elements showed again after the cover opened (t: panel, row): {back}"
    empty = {t: (S[t].get("row_b3", 0), S[t].get("row_b4", 0)) for t in swap if max(S[t].get("row_b3", 0), S[t].get("row_b4", 0)) < 0.9}
    assert not empty, f"the row's place went empty while b4 drew its copy (t: old, new): {empty}"
    assert S[18.0].get("keeper", 0) > 0.9, f"control: a late exit on the scene's own time must stay as written: {S[18.0]}"
    assert S[19.2].get("keeper", 1) < 0.05, f"control: the late exit must still happen: {S[19.2]}"
    blank = {t: (S[t].get("plate", 0), S[t].get("last", 0)) for t in canvas if max(S[t].get("plate", 0), S[t].get("last", 0)) < 0.3}
    assert not blank, f"the canvas join left the frame empty (t: old plate, new): {blank}"
    gap = {t: S[t].get("last", 0) for t in cut_hold if S[t].get("last", 0) < 0.9}
    assert not gap, f"the old picture left before the cut, so the frame went empty (t: old): {gap}"
    late = {t: (S[t].get("last", 0), S[t].get("after_cut", 0)) for t in cut_after if S[t].get("last", 0) > 0.05 or S[t].get("after_cut", 0) < 0.05}
    assert not late, f"after the cut the old picture must be gone and the new one arriving (t: old, new): {late}"
    swaps = out["samples"][0]["v"]["__swaps"]
    assert any(s["how"] == "released" and s["old"] == "panel" for s in swaps), f"the release is not in the report: {swaps}"
    assert any(s["how"] == "held_redrawn" and s["old"] == "row_b3" for s in swaps), f"the in-place swap is not in the report: {swaps}"
    return f"no old element after the cover; the row's place never empty; late exit kept; swaps {len(swaps)}"


# ------------------------------------------------------------------ screencast: the held app at the joins
_SC_APP = """
const SPEC = { chrome: "window", title: "Test", nav: [{ id: "home", label: "Home", icon: "house" }], active: "home",
  pages: { a: { title: "Sign in", content: [{ id: "f", kind: "form", fields: [{ id: "pw", label: "Password", kind: "password", value: "" }],
                actions: [{ id: "go", label: "Sign in", kind: "primary" }] }] },
           b: { title: "Done", content: [{ id: "l", kind: "list", items: [{ id: "x", title: "Signed in" }] }] } }, start: "a" };
"""
_SC_SCENES = _SC_APP + r"""
Loom.scene("b1", { build(ctx) {
  const A = ctx.engine.app(ctx, "app", SPEC, { at: ctx.start, exit: "none" });
  A.type("f.pw", "secret12", { at: ctx.start + 0.8 });
  A.pointerOut(ctx.start + 3.0);
} });
Loom.scene("b2", { build(ctx) {
  const A = ctx.engine.resume(ctx, "app");
  A.pointerOut(ctx.start);                                   // the pointer is already gone: must stay gone
  A.setValue("f.pw", "", ctx.start);                         // cleared on the cut: sc_reset_at_join
  A.go("b", ctx.start + 0.1);                                // a page switch on the cut: sc_change_at_join
  %(extra)s
} });
Loom.scene("b3", { build(ctx) {
  const A = ctx.engine.resume(ctx, "app");
  A.go("a", ctx.start + 2.0);                                // control: a page change on the beat's own time
} });
"""
_SC_BYHAND = """
  const fake = ctx.el("fake_page", { x: 300, y: 300, w: 900, h: 500, kind: "card", exit: "recede" });
  ctx.kit.rect(fake.inner, 0, 0, 900, 500, { fill: "surface", r: 8 }); ctx.m.reveal(fake, ctx.start + 0.5);
  const ptr = ctx.el("settings_pointer", { x: 600, y: 400, w: 40, h: 48, kind: "icon", exit: "recede" });
  ctx.kit.rect(ptr.inner, 0, 0, 40, 48, { fill: "ink", r: 2 }); ctx.m.reveal(ptr, ctx.start + 0.5);
  const tip = ctx.el("tip", { x: 1500, y: 200, w: 200, h: 60, kind: "label", exit: "recede" });   // control: a small label
  ctx.kit.rect(tip.inner, 0, 0, 200, 60, { fill: "accent", r: 8 }); ctx.m.reveal(tip, ctx.start + 0.5);
"""
_PTR = r"""function () {
  const p = document.querySelector(".lm-sc-pointer");
  return { ptr: p ? +parseFloat(p.getAttribute("opacity") || "0").toFixed(2) : null };
}"""


def primitive_runtime_screencast_held_app_keeps_its_picture_at_a_join():
    """b2 opens on the app b1 left (password typed, pointer gone). Its pointerOut on a pointer already gone keeps it gone
    (it flashed at full opacity on every join of st-sc-2fa); clearing the typed field on the cut is sc_reset_at_join (an
    error, b06's "password" cleared to retype it); a page switch on the cut warns sc_change_at_join. A product page and a
    pointer drawn by hand over the app are sc_ui_by_hand and sc_second_pointer (b07's plain settings page and arrow).
    Controls: b3's page change 2 s in, and a small label beside the app, raise nothing."""
    if not _browser():
        return _SKIP
    scenes = [{"kind": "bespoke"}, {"kind": "bespoke", "join_in": {"type": "continue"}}, {"kind": "bespoke", "join_in": {"type": "continue"}}]
    src = _SC_SCENES % {"extra": _SC_BYHAND}
    out = _run(_lesson(src, scenes, _ONE, 3, style="screencast", engine="screencast"), _PTR, [3.9, 4.0, 4.03, 4.07, 4.1, 4.15, 4.2])
    errs = [(e["code"], e["beat"]) for e in out["report"]["errors"]]
    warns = [(w["code"], w["beat"]) for w in out["report"]["warnings"]]
    assert not [e for e in errs if e[0] == "scene_threw"], f"a scene threw: {out['report']['errors']}"
    flash = {s["t"]: s["v"]["ptr"] for s in out["samples"] if (s["v"]["ptr"] or 0) > 0.05}
    assert not flash, f"the pointer, already gone, showed at the join (t: opacity): {flash}"
    assert ("sc_reset_at_join", "b2") in errs, f"clearing the typed field on the cut was not refused: {errs}"
    assert ("sc_change_at_join", "b2") in warns, f"a page switch on the cut did not warn: {warns}"
    assert ("sc_ui_by_hand", "b2") in errs, f"a product page drawn by hand over the app was not refused: {errs}"
    assert ("sc_second_pointer", "b2") in errs, f"a second pointer drawn by hand was not refused: {errs}"
    byhand = [e for e in out["report"]["errors"] if e["code"] == "sc_ui_by_hand"]
    assert not [e for e in byhand if '"tip"' in e["msg"]], f"control: a small label beside the app is no product page: {byhand}"
    assert not [w for w in warns if w[0] == "sc_change_at_join" and w[1] == "b3"], f"control: a page change on the beat's own time warned: {warns}"
    return "pointer stayed gone; reset on the cut refused; page switch on the cut warned; hand-drawn page and pointer refused; controls quiet"


# ------------------------------------------------------------------ the join measure (loom/checks/joins.py), on made frames
def _film(kind_of: dict, style: str = "corporate-clean"):
    """three joins at 10, 20, 30 s; frames from kind_of[beat](offset) -> 'A' | 'B' | 'blank' | 'C' (a picture id)"""
    import numpy as np
    from loom.checks import joins as J
    rng = np.random.default_rng(7)
    pics = {k: rng.integers(30, 220, size=(int(J.H * J.CAPTION_CUT), J.W)).astype(np.float32) for k in "ABCD"}
    pics["blank"] = np.full_like(pics["A"], 200.0)
    beats = [{"id": f"b{i + 1}", "start": 10.0 * i} for i in range(4)]
    man = {"beats": beats, "duration": 40.0, "style": {"id": style}, "scenes": [{"beat": b["id"], "join_in": {"type": "continue"}} for b in beats]}
    frames = {}
    for b in beats[1:]:
        for o in J.JOIN_OFFS:
            frames[round(b["start"] + o, 2)] = pics[kind_of[b["id"]](o)]
    return man, frames


def check_join_measure_finds_the_old_picture_back_an_empty_frame_and_a_one_frame_pop():
    """b2: old A, then B, then A again at 0.33 to 0.63 s, then B (the old beat shown twice) -> join_flashback. b3: a blank
    from 0.1 to 0.8 s between two pictures -> join_blank. b4: one wrong frame at the cut (D for one frame, then C) ->
    join_pop. Control: a clean join (old until 0, new after) raises nothing; a drafting style's long sparse stretch rule
    does not apply."""
    from loom.checks import joins as J
    kinds = {
        "b2": lambda o: "A" if o < 0 else ("B" if o < 0.3 else "A" if o < 0.7 else "B"),
        "b3": lambda o: "B" if o < 0 else ("blank" if o <= 0.8 else "C"),
        "b4": lambda o: "C" if o < 0 else ("D" if o == 0.0 else "A"),
    }
    man, frames = _film(kinds)
    E, W, st = J.analyse(man, frames)
    codes = {(e.split(":")[0], e.split(" ")[1]) for e in E}
    assert ("join_flashback", "b2") in codes, E
    assert ("join_blank", "b3") in codes, E
    assert ("join_pop", "b4") in codes, E
    clean = {"b2": lambda o: "A" if o < 0 else "B", "b3": lambda o: "B" if o < 0 else "C", "b4": lambda o: "C" if o < 0 else "A"}
    man, frames = _film(clean)
    E2, _, _ = J.analyse(man, frames)
    assert not E2, f"control: clean joins raised {E2}"
    return f"flashback, blank and pop found ({st}); clean joins quiet"


# ------------------------------------------------------------------ isometric: the board is drawn by its clock alone
_ISO = r"""
Loom.scene("b1", { build(ctx) {
  const E = ctx.el("board", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
  const B = ctx.engine.board(ctx, { name: "w", size: [10, 10], at: 0, parent: E.inner });
  const hall = B.put("box", { name: "hall", x: 1, y: 1, w: 2, d: 2, h: 2 });
  const shed = B.put("box", { name: "shed", x: 7, y: 7, w: 1, d: 1, h: 1 });
  E.handle = B; window.__B = B;
  B.camera(1.0, hall, { zoom: 3, dur: 0.6 });
  B.camera(2.0, shed, { zoom: 2, dur: 0.6 });
  const road = B.route("road", [[6, 9], [9, 9]], { tok: "line", width: 2, at: 0.2 });
  shed.travel(road, 2.7, { dur: 0.25 });
  B.camera(3.0, hall, { zoom: 3, dur: 0 });
} });
Loom.scene("b2", { build(ctx) { const B = window.__B; B.camera(ctx.start + 1.0, "all", { dur: 0.6 }); } });
"""
_ISOCAM = r"""function () {
  const B = window.__B, t = window.__timelines.main.time(), c = B.camAt(t);
  const want = `translate(960 540) scale(${c.k.toFixed(4)})`;
  return { ok: (B.camG.getAttribute("transform") || "").startsWith(want), dom: B.camG.getAttribute("transform"), want };
}"""


def primitive_runtime_isometric_camera_is_the_clock_at_any_seek():
    """A seek straight into the film (3.4 s, past three camera moves, the last a cut just after a truck's drive ends) and on
    (6.0 s, after b2's move)
    shows the camera the board's clock computes for that time. The moves' drives used to draw the board at their own
    times, so a jump left the last one's framing up (st-iso-order b05: the whole board for a frame in a close-up, D-190).
    Control: the camera does change between the samples."""
    if not _browser():
        return _SKIP
    scenes = [{"kind": "bespoke"}, {"kind": "bespoke", "join_in": {"type": "continue"}}]
    out = _run(_lesson(_ISO, scenes, _ONE, 2, style="isometric", engine="isometric"), _ISOCAM, [3.4, 6.0, 7.5, 3.4, 1.5])
    errs = [e for e in out["report"]["errors"] if e["code"] == "scene_threw"]
    assert not errs, f"a scene threw: {errs}"
    bad = {s["t"]: (s["v"]["dom"], s["v"]["want"]) for s in out["samples"] if not s["v"]["ok"]}
    assert not bad, f"the board's camera is not the clock's at these seeks (t: on screen, the clock's): {bad}"
    doms = {s["v"]["dom"] for s in out["samples"]}
    assert len(doms) >= 2, f"control: the camera never changed across the samples: {doms}"
    return "the board camera equals its clock after jumps to 3.4, 6.0 and 7.5 s and back to 3.4 and 1.5 s"


# ------------------------------------------------------------------ the motion audit (runtime/world.js auditMotion)
_MOVES = r"""
const card = (ctx, n, x, y, w, h, words) => { const E = ctx.el(n, { x, y, w, h, kind: "card" }); ctx.kit.rect(E.inner, 0, 0, w, h, { fill: "accent", r: 8 });
  if (words) ctx.kit.text(E.inner, words, { role: "label", x: 10, y: 10, w: w - 20, h: 40 }); ctx.m.reveal(E, ctx.start + 0.1); return E; };
Loom.scene("b1", { build(ctx) {
  const a = card(ctx, "mover_a", 100, 100, 200, 120), b = card(ctx, "mover_b", 100, 600, 200, 120);
  ctx.m.travel(a, ctx.start + 1.0, { x: 600, y: 0, dur: 1.0 });
  ctx.m.travel(b, ctx.start + 1.4, { x: 600, y: 0, dur: 1.0 });            // overlaps a by 0.6 s: two at once
} });
Loom.scene("b2", { build(ctx) {
  const l = card(ctx, "pair_l", 300, 400, 200, 120), r = card(ctx, "pair_r", 1300, 400, 200, 120);
  ctx.m.travel(l, ctx.start + 1.0, { x: -150, y: 0, dur: 1.0 });           // control: one gesture (same start and end)
  ctx.m.travel(r, ctx.start + 1.0, { x: 150, y: 0, dur: 1.0 });
} });
Loom.scene("b3", { build(ctx) {
  card(ctx, "window", 700, 300, 500, 400);
  const doc = card(ctx, "doc", 100, 400, 200, 200);
  ctx.m.travel(doc, ctx.start + 1.0, { x: 1500, y: 0, dur: 1.2 });         // passes over the window: crosses
  const row = card(ctx, "row", 100, 850, 900, 80, "When are claims due");
  ctx.m.travel(row, ctx.start + 2.6, { scale: 0.6, dur: 0.6 });            // squeezes its words
} });
"""
_NONE = "function () { return 1; }"


def primitive_runtime_motion_audit_names_two_movers_a_crossing_and_squeezed_words():
    """b1: two cards travel at once, 0.6 s overlapping (motion_two_at_once); b3: a page slides across a window on its way
    (motion_crosses) and a row of words shrinks to 60 % (motion_shrinks_words): the st-holo-ai b21, b22 and b06 motions
    Kshitij called awkward (D-190). Control: b2's pair splitting apart (same start, same landing) is one gesture."""
    if not _browser():
        return _SKIP
    scenes = [{"kind": "bespoke"}] + [{"kind": "bespoke", "join_in": {"type": "cut"}} for _ in range(2)]
    out = _run(_lesson(_MOVES, scenes, _ONE, 3), _NONE, [1.0])
    W = [(w["code"], w["beat"]) for w in out["report"]["warnings"]]
    assert ("motion_two_at_once", "b1") in W, W
    assert ("motion_crosses", "b3") in W, W
    assert ("motion_shrinks_words", "b3") in W, W
    assert ("motion_two_at_once", "b2") not in W, f"control: a pair moving as one gesture warned: {W}"
    return "two movers, a crossing and squeezed words named; the one-gesture pair quiet"
