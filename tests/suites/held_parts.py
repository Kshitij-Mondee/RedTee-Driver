"""Held kit parts (https-private-relay mess, 2026-10-12): b01's board was held by every beat to 87 s while seven beats drew
their own board over it, because ctx.held gave the element without the kit part's handle and nothing refused a second copy.

  handle      an element a kit part drew carries the part's handle; a later beat drives the same drawing through
              ctx.held(name).handle.setState(state, t); a part drawn inside another part leaves the outer handle in place;
              a reused part (D-163, registered as Loom.lesson["id"] before the kit) is covered the same way
  second copy ctx.el under a held name is kept_element_redrawn; the same part drawn over a held one is part_drawn_twice;
              a second packet elsewhere is a warning only, and a new board after the held one left is no defect

Real runtime in headless Chrome (the runtime_film_defects harness); LOOM_TEST_RUNTIME=<dir> runs them against another
runtime folder (red runs: docs/research/https_private_relay/red_runs_mess.txt). Without a browser they skip, by name.
"""
from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from runtime_film_defects import _ONE, _SKIP, _browser, _lesson, _run  # noqa: E402

# a reused part as kept.py emits it, then a kit that keeps the same object; the board draws a packet inside itself
_KIT = r"""
Loom.lesson = Loom.lesson || {};
Loom.lesson["packet"] = function (ctx, parent, opts) {
  const r = ctx.kit.rect(parent, 0, 0, 200, 120, { fill: "accent", r: 6 }); r.setAttribute("data-part", "packet");
  return { setState(s, t) { Loom.tl.set(r, { attr: { "data-state": s } }, t); } };
};
Loom.lesson = Loom.lesson || {};
Loom.lesson.board = function (ctx, parent, opts) {
  const r = ctx.kit.rect(parent, 0, 0, 1000, 600, { fill: "surface", r: 8 }); r.setAttribute("data-part", "board");
  r.setAttribute("data-state", "idle");
  const inner = Loom.svg("g", { transform: "translate(40 40)" }, parent);
  Loom.lesson.packet(ctx, inner, {});
  return { kind: "board", setState(s, t) { Loom.tl.set(r, { attr: { "data-state": s } }, t); } };
};
// one ring per call, placed by its options (gps-position's range_circles: one satellite's circle per full-frame layer)
Loom.lesson.ring = function (ctx, parent, opts) {
  const g = Loom.svg("g", { transform: `translate(${opts.x} ${opts.y})` }, parent);
  Loom.svg("circle", { cx: 0, cy: 0, r: 90, fill: "none", stroke: ctx.c("accent"), "stroke-width": 6 }, g);
  return { setState() {} };
};
"""

_SCENES = _KIT + r"""
const board = (ctx, name, x, y) => { const E = ctx.el(name, { x, y, w: 1000, h: 600, kind: "scenery" }); Loom.lesson.board(ctx, E.inner, {}); ctx.m.reveal(E, ctx.start + 0.1); return E; };
Loom.scene("b1", { build(ctx) {
  board(ctx, "board", 200, 150);
  const P = ctx.el("packet", { x: 1400, y: 150, w: 200, h: 120, kind: "card" }); Loom.lesson.packet(ctx, P.inner, {}); ctx.m.reveal(P, ctx.start + 0.2);
  const RA = ctx.el("ring_a", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" }); Loom.lesson.ring(ctx, RA.inner, { x: 300, y: 900 }); ctx.m.reveal(RA, ctx.start + 0.2);
} });
Loom.scene("b2", { build(ctx) {
  const B = ctx.held("board"), P = ctx.held("packet");
  window.__h = { board: !!(B && B.handle && B.handle.kind === "board"), partId: B && B.partId, packet: !!(P && P.handle) };
  B.handle.setState("lit", ctx.start + 0.5);
  // a second ring elsewhere, each in a full-frame layer: two rings on screen, not a copy (declared boxes both full frame)
  const RB = ctx.el("ring_b", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" }); Loom.lesson.ring(ctx, RB.inner, { x: 1500, y: 900 }); ctx.m.reveal(RB, ctx.start + 0.3);
} });
Loom.scene("b3", { build(ctx) { board(ctx, "board", 200, 150); } });
Loom.scene("b4", { build(ctx) {
  board(ctx, "board_b4", 260, 190);
  const Q = ctx.el("packet2", { x: 1400, y: 850, w: 200, h: 120, kind: "card" }); Loom.lesson.packet(ctx, Q.inner, {}); ctx.m.reveal(Q, ctx.start + 0.3);
} });
Loom.scene("b5", { build(ctx) {
  ctx.m.exit(ctx.held("board"), ctx.start + 0.1);
  const N = ctx.el("board_b5", { x: 200, y: 150, w: 1000, h: 600, kind: "scenery" }); Loom.lesson.board(ctx, N.inner, {}); ctx.m.reveal(N, ctx.start + 1.0);
} });
"""


def primitive_runtime_a_held_kit_part_keeps_its_handle_and_a_copy_is_refused():
    """b2 drives b01's board through ctx.held("board").handle (the same drawing changes state; the board's handle, not the
    packet drawn inside it); b3 draws a new "board" while holding one (kept_element_redrawn); b4 draws the board part over
    the held board (part_drawn_twice) and a second packet elsewhere (a warning only); b2's second ring in its own
    full-frame layer is a warning, not a copy (what each call drew is compared, not the declared boxes: gps-position b15); b5 exits the held board and then
    draws a new one (no defect). Controls: b2 and b5 raise nothing; the board is drawn by the part exactly once at 6 s."""
    if not _browser():
        return _SKIP
    keep = ["board", "packet", "ring_a"]
    scenes = [{"kind": "bespoke"}] + [{"kind": "bespoke", "keep": keep} for _ in range(4)]
    out = _run(_lesson(_SCENES, scenes, _ONE, 5),
               r"""function () { const b = document.querySelector('.lm-el[data-name="board"] [data-part="board"]');
                   return { h: window.__h || null, state: b && b.getAttribute("data-state"),
                            boards: document.querySelectorAll('.lm-scene[data-beat="b1"] [data-part="board"]').length }; }""",
               [4.2, 6.0])
    R = out["report"]
    errs = [(e["code"], e["beat"]) for e in R["errors"]]
    warns = [(w["code"], w["beat"]) for w in R["warnings"]]
    assert ("scene_threw", "b2") not in errs, f"driving the held board threw (no handle on the held element): {R['errors']}"
    h = out["samples"][1]["v"]["h"]
    assert h and h["board"] and h["partId"] == "board", f"the held board carries no board handle: {h}"
    assert h["packet"], f"a reused part (Loom.lesson[\"packet\"]) left no handle: {h}"
    assert out["samples"][0]["v"]["state"] == "idle" and out["samples"][1]["v"]["state"] == "lit", \
        f"the held board did not change state on b2's time: {[s['v']['state'] for s in out['samples']]}"
    assert out["samples"][1]["v"]["boards"] == 1, f"b1 drew the board part {out['samples'][1]['v']['boards']} times"
    assert ("kept_element_redrawn", "b3") in errs, f"a new element under a held name was not refused: {errs}"
    assert ("part_drawn_twice", "b4") in errs, f"the board part drawn over the held board was not refused: {errs}"
    assert ("part_drawn_again", "b4") in warns, f"control: a second packet elsewhere must be a warning: {warns}"
    assert ("part_drawn_again", "b2") in warns, f"a second ring in its own full-frame layer is a warning, not a copy: {warns}"
    assert not [e for e in R["errors"] if e["code"] == "part_drawn_twice" and "packet" in e["msg"].split(" as ")[0]], \
        f"a second packet elsewhere is not an error: {R['errors']}"
    clean = [c for c in errs if c[1] in ("b1", "b2", "b5") and c[0] in ("kept_element_redrawn", "part_drawn_twice", "scene_threw")]
    assert not clean, f"control: b1, b2 and b5 raise nothing: {clean}"
    return "held board driven through its handle (idle -> lit); redraw by name and by part refused; packet elsewhere warned; hand-over clean"


_B09 = """Loom.scene("b09", { build(ctx) {
  const E = ctx.el("board_el", { x: 600, y: 300, w: 640, h: 380, kind: "card" });
  Loom.lesson.board(ctx, E.inner, {}); ctx.m.reveal(E, ctx.start + 0.1);
} });
"""


def check_a_scene_task_says_what_is_on_screen_and_how_to_drive_it():
    """The scene task's ON SCREEN block gives each held element's box, the kit part drawn into it (found back along the
    keep lists to the beat that drew it) and that part's states, says to drive it through ctx.held(name).handle and never
    to draw it again, and no longer invites a redraw; the previous beat's last look is named when it is attached, and
    _prev_same_station finds that beat only on the same station"""
    from shuttle_rails import lesson
    from loom.agents import conductor as C
    from loom.util import read_json, write_json
    with lesson("P6", kit_beat="b10") as p:
        sb = read_json(p.path("plan/storyboard.json"))
        sb["kit"] = {"parts": [{"id": "board", "what": "the held board", "states": ["blank", "full"], "beats": ["b09", "b10", "b11"]}]}
        for s in sb["scenes"]:
            if s["beat"] in ("b09", "b10", "b11"):
                s.update(kind="bespoke", station="st_notes", keep=[] if s["beat"] == "b09" else ["board_el"])
                s.pop("blueprint", None)
        write_json(p.path("plan/storyboard.json"), sb)
        p.path("scenes/b09.js").write_text(_B09, encoding="utf-8")
        held = {h["name"]: h for h in C.scene_context(p, "b11")["held"]}
        b = held.get("board_el") or {}
        assert b.get("drawn_by") == "b09" and b.get("box") == [600.0, 300.0, 640.0, 380.0], f"box or maker not found back along keep: {b}"
        assert b.get("kit_part") == "board" and b.get("states") == ["blank", "full"], f"the kit part and its states: {b}"
        tm = {x["id"]: x for x in read_json(p.path("audio/timings.json"))["beats"]}
        sc = next(s for s in sb["scenes"] if s["beat"] == "b10")
        ex = {"scene": sc, "beat_timing": tm["b10"], "file": "scenes/b10.js", "file_abs": str(p.path("scenes/b10.js"))}
        msg = C.task_message(p, "scene", ex)
        assert "ON SCREEN WHEN YOUR BEAT STARTS" in msg and "handle.setState" in msg and "part_drawn_twice" in msg, msg[:1500]
        assert '"kit_part":"board"' in msg and "draw the thing yourself" not in msg, "the block names the part and never invites a redraw"
        assert "is attached as a picture" not in msg, "no picture is promised when none is attached"
        assert "b09, is attached as a picture" in C.task_message(p, "scene", dict(ex, prev_frame="b09"))
        assert C.Conductor._prev_same_station("b10", sb) == "b09" and C.Conductor._prev_same_station("b05", sb) is None
    return "box, maker, kit part and states found; drive-not-redraw said; the picture named only when attached"


_NESTED = r"""
Loom.lesson = Loom.lesson || {};
Loom.lesson.board = function (ctx, parent, opts) {
  ctx.kit.rect(parent, 0, 0, 1000, 600, { fill: "surface", r: 8 });
  const B = ctx.el("board_browser", { parent, x: 40, y: 40, w: 300, h: 200, kind: "card" });   // a piece drawn as its own element
  ctx.kit.rect(B.inner, 0, 0, 300, 200, { fill: "accent", r: 6 });
  return { setState() {} };
};
Loom.scene("b1", { build(ctx) {
  const E = ctx.el("board", { x: 200, y: 150, w: 1000, h: 600, kind: "scenery" }); Loom.lesson.board(ctx, E.inner, {}); ctx.m.reveal(E, ctx.start + 0.1);
  const L = ctx.el("lone", { x: 1400, y: 150, w: 200, h: 120, kind: "card" }); ctx.kit.rect(L.inner, 0, 0, 200, 120, { fill: "accent" }); ctx.m.reveal(L, ctx.start + 0.2);
} });
Loom.scene("b2", { build(ctx) { ctx.held("board"); } });
Loom.scene("b3", { build(ctx) { ctx.held("board"); } });
Loom.scene("b4", { build(ctx) { const N = ctx.el("note", { x: 1400, y: 800, w: 200, h: 80, kind: "card" }); ctx.kit.rect(N.inner, 0, 0, 200, 80, { fill: "accent" }); ctx.m.reveal(N, ctx.start + 0.1); } });
"""


def primitive_runtime_a_piece_inside_a_held_element_lives_as_long_as_it():
    """A kit part that draws its pieces as elements inside the board (board_browser in board): the board is held by b2 and
    b3, and the piece must show as long as the board does. Before, each piece took the life of the beat that drew it and
    switched off at b2's start, so the held board was an empty frame to 88 s (https-private-relay run 2, 2026-10-12).
    Controls: an element not inside anything (lone) still leaves after b1; the board and its piece are off in b4."""
    if not _browser():
        return _SKIP
    scenes = [{"kind": "bespoke"}, {"kind": "bespoke"}, {"kind": "bespoke"}, {"kind": "bespoke"}]
    out = _run(_lesson(_NESTED, scenes, _ONE, 4),
               r"""function () {
                   // shown = displayed AND seen: the product of the opacities from the element down to its drawing (a join's
                   // exit fades the mover or life group inside, which neither display nor the outer's opacity shows)
                   const on = (n) => { const g = document.querySelector(`.lm-el[data-name="${n}"]`); if (!g || g.style.display === "none") return false;
                     let op = 1; for (let e = g.querySelector(".lm-in"); e && e !== g.parentNode; e = e.parentNode) op *= +getComputedStyle(e).opacity;
                     return op > 0.9; };
                   return { board: on("board"), piece: on("board_browser"), lone: on("lone") }; }""", [2.0, 6.0, 10.0, 14.5])
    v = [s["v"] for s in out["samples"]]
    assert v[0] == {"board": True, "piece": True, "lone": True}, f"b1 shows all three: {v[0]}"
    assert v[1]["board"] and v[1]["piece"] and v[2]["board"] and v[2]["piece"], f"the piece inside the held board switched off: {v[1]}, {v[2]}"
    assert not v[1]["lone"], f"control: an element not held and not inside a held one leaves after its beat: {v[1]}"
    assert not v[3]["board"] and not v[3]["piece"], f"control: after its last holder the board and its piece are off: {v[3]}"
    life = {(e["beat"], e["name"]): e["lifeT"] for e in out["report"]["elements"]}
    assert life[("b1", "board_browser")] == life[("b1", "board")], f"the piece's life is the board's: {life}"
    return "the piece lives with its held board through b3; a lone element still leaves; all off after the last holder"


def primitive_runtime_a_backplate_blur_is_attached_only_while_it_is_raised():
    """A later backplated template blurs the pictures under it; the blur filter was put on every earlier scene group of
    the station at load (at 0 px) and stayed there for the whole film. HyperFrames' capture stopped painting such a group
    once the camera zoomed in (the filter region grew past what it draws): https-private-relay's b01 group, with the board
    held to 88 s, vanished from b02's push on, while the live DOM said visible (2026-10-12). The filter is now attached
    only inside the cover window. Controls: under the backplate the picture is still blurred 8 px or more."""
    if not _browser():
        return _SKIP
    from runtime_film_defects import _BLUR, _PICTURE
    js = _PICTURE % ("b1", "A", "scenery") + _PICTURE % ("b2", "B", "scenery")
    scenes = [{"kind": "bespoke"}, {"kind": "bespoke"}, {"kind": "template", "template": "t_words"}]
    probe = r"""function () { const g = document.querySelector('.lm-scene[data-beat="b1"]'); return { filt: g.getAttribute("filter") || "" }; }"""
    out = _run(_lesson(js, scenes, _ONE, 3), probe, [2.0, 6.0, 10.0])
    v = {s["t"]: s["v"]["filt"] for s in out["samples"]}
    assert not v[2.0] and not v[6.0], f"b1's group carries the blur filter before any backplate covers it: {v}"
    assert v[10.0], f"control: under b3's backplate b1's group is filtered: {v}"
    bl = _run(_lesson(js, scenes, _ONE, 3), _BLUR, [10.0])
    assert bl["samples"][0]["v"].get("b1", 0) >= 8, f"control: b1 is blurred under the backplate: {bl['samples'][0]['v']}"
    return "no filter on b1 before the backplate; filtered and blurred under it"


_OUTER = r"""
Loom.scene("b1", { build(ctx) {
  const E = ctx.el("board", { x: 200, y: 150, w: 1000, h: 600, kind: "scenery" }); ctx.kit.rect(E.inner, 0, 0, 1000, 600, { fill: "accent", r: 8 });
  Loom.tween(E.outer, { opacity: 0 }, { opacity: 1, duration: 0.8 }, ctx.start + 0.5, { kind: "reveal", name: "board" });
} });
"""


def primitive_runtime_a_tween_on_an_elements_outer_group_goes_to_its_inner():
    """A scene that tweens E.outer (the group the engine places and shows or hides) had it applied there; in
    https-private-relay's b01 HyperFrames' capture then drew no board at all while the live DOM said shown (2026-10-12).
    The tween is moved to E.inner with the warning outer_tweened. Controls: the fade still happens (inner at 0 before,
    1 after) and the outer group carries no opacity of its own."""
    if not _browser():
        return _SKIP
    out = _run(_lesson(_OUTER, [{"kind": "bespoke"}], _ONE, 1),
               r"""function () { const g = document.querySelector('.lm-el[data-name="board"]');
                   return { outer: g.style.opacity || "", inner: +getComputedStyle(g.querySelector(".lm-in")).opacity }; }""", [0.2, 2.0])
    s = [x["v"] for x in out["samples"]]
    warns = [(w["code"], w["beat"]) for w in out["report"]["warnings"]]
    assert ("outer_tweened", "b1") in warns, f"no outer_tweened warning: {warns}"
    assert s[0]["outer"] == "" and s[1]["outer"] == "", f"the outer group was animated: {s}"
    assert s[0]["inner"] < 0.05 and s[1]["inner"] > 0.95, f"control: the fade happens on the inner group: {s}"
    return "the outer tween moved to inner (0 -> 1), outer untouched, warning raised"


def check_a_defect_on_a_held_element_goes_to_the_beat_on_screen():
    """A Loom audit names the beat that DREW the element; when the defect happens in a later beat that holds it, that later
    beat set the state or drew over it, and only it can fix it. https-private-relay run 2c: seven errors on the board's
    pieces at 48 s and 77 to 79 s (b07, b11) went to b01, which could not change them, until it ran out of rounds and the
    run ended exit 2 (2026-10-12, the L-418 class). Controls: a defect inside the drawing beat's own time stays with it;
    an hf line without a beat goes to the beat at its time."""
    import tempfile
    import shutil
    from loom.agents import router as RT
    from loom.project import Project
    from loom.util import write_json
    d = Path(tempfile.mkdtemp(prefix="loom_route_held_"))
    try:
        for sub in ("qa", "build"):
            (d / sub).mkdir()
        write_json(d / "project.json", {"id": "route-held"})
        write_json(d / "build/manifest.json", {"beats": [{"id": "b01", "start": 0, "end": 8.3}, {"id": "b07", "start": 45.0, "end": 52.0},
                                                         {"id": "b11", "start": 73.5, "end": 81.0}]})
        write_json(d / "qa/probe.json", {"errors": []})
        write_json(d / "qa/report.json", {"errors": [
            'lc layout text_covered @ 77: b01 "Value" is partly covered by an opaque shape (86 % of it, its words cut) from 77 to 78 s [pb_tray]',
            'lc contrast contrast_aa_failure @ 48.486: b01 "User" contrast 2.19:1 (needs 3:1) [pb_browser]',
            'lc layout text_covered @ 5: b01 "Submit" is partly covered by an opaque shape [pb_browser]',
            'hf layout content_overlap @ 50: two texts overlap']})
        got = [(x["code"], x["beat"]) for x in RT.collect(Project(d))]
        assert ("text_covered", "b11") in got and ("contrast_aa_failure", "b07") in got, f"held-element defects not sent to the beat on screen: {got}"
        assert ("text_covered", "b01") in got, f"control: a defect in the drawing beat's own time stays with it: {got}"
        assert ("content_overlap", "b07") in got, f"control: an hf line goes to the beat at its time: {got}"
        det = next(x["detail"] for x in RT.collect(Project(d)) if x["beat"] == "b11")
        assert "b01 drew and b11 holds" in det, f"the detail says whose element it is: {det}"
    finally:
        shutil.rmtree(d, ignore_errors=True)
    return "b01's held pieces: 77 s to b11, 48.5 s to b07; 5 s stays b01; hf by time"


def check_a_hung_snapshot_is_killed_in_minutes_and_tried_once_more():
    """L-434 (gps-position session): three parallel lab_snapshots sat in `hyperframes snapshot` until the 30 to 60 min
    timeout, so b03, b06 and b09 of https-slice-terra never got a look and stayed drafts. A look's capture now has a short
    timeout (qa.SNAP_TIMEOUT_S, minutes), the hung browser tree is killed by util.run, and it is tried once more; a
    second hang is a LoomError saying so. Controls: a capture that works on the retry returns its sheet."""
    import subprocess
    import tempfile
    import shutil
    from loom import qa
    from loom.util import LoomError
    from PIL import Image
    assert qa.SNAP_TIMEOUT_S <= 600, f"a look waits {qa.SNAP_TIMEOUT_S} s on a hung capture"
    d = Path(tempfile.mkdtemp(prefix="loom_snaphang_"))
    calls = []
    real = qa.run

    def hang_then_work(cmd, cwd=None, env=None, timeout=None, **kw):
        calls.append(timeout)
        if len(calls) == 1:
            raise subprocess.TimeoutExpired(cmd, timeout)
        (Path(cwd) / "snapshots").mkdir(exist_ok=True)
        Image.new("RGB", (64, 36)).save(Path(cwd) / "snapshots" / "frame-00-at-1.00s.png")

    def always_hang(cmd, cwd=None, env=None, timeout=None, **kw):
        calls.append(timeout)
        raise subprocess.TimeoutExpired(cmd, timeout)
    try:
        qa.run = hang_then_work
        out = qa.snapshot_sheet_build(d, [1.0], d / "sheet.jpg")
        assert Path(out).exists() and len(calls) == 2 and all(c and c <= 600 for c in calls), f"retry after a hang: {calls}"
        calls.clear()
        qa.run = always_hang
        try:
            qa.snapshot_sheet_build(d, [1.0], d / "sheet2.jpg")
            raise AssertionError("two hangs were not an error")
        except LoomError as e:
            assert "timed out" in str(e) and len(calls) == 2, (str(e), calls)
    finally:
        qa.run = real
        shutil.rmtree(d, ignore_errors=True)
    return f"hung capture killed after {qa.SNAP_TIMEOUT_S} s and tried once more; two hangs are a LoomError"
