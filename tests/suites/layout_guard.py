"""The layout guard (runtime/layout.js, tools/node/layout_solve.mjs, loom/layout_guard.py; D-169): the engine moves
flexible elements clear of words, other labels and the frame edge, deterministically, and leaves meant overlaps alone.
Kshitij, 2026-10-15: "make something like this here as well so AI agents are not really required to fix small things like
text fitting and overlapping"; "there will always be objects that will need to overlap or collide like a mug on a table.
Make those things possible."

One lesson on the real runtime, one planted case per beat (4 s each):
  b1  two labels drawn on one spot                          one of them moves; then neither is in conflict
  b2  a label over a sentence                               the label moves; the sentence never does
  b3  a mug on a table (objects), a label meant on the mug  nothing moves (objects never move; {overlaps} is honoured)
  b4  a title running past the right edge of the frame      it moves left, fully inside the frame
  b5  a label sweeping across a sentence in 0.3 s           nothing moves (a passing crossing, as the checker judges it)
  b6  a label marked {layout: "fixed"} over a sentence      nothing moves
  b7  a long divider line drawn through a label's words     the label moves off the line (a whiteboard is all strokes:
                                                            the probe's line_through_text, L-462); the line never moves
Then the plan goes into the manifest: a second solve finds nothing to move (the plan is a fixed point), and the
same build solved twice gives the same plan (determinism).
"""
from __future__ import annotations

import importlib.util
import json
import os
import re
import shutil
import subprocess
from pathlib import Path

ENGINE = Path(__file__).resolve().parents[2]


def _rt():
    spec = importlib.util.spec_from_file_location("lg_runtime_film_defects", ENGINE / "tests" / "suites" / "runtime_film_defects.py")
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


_JS = r"""
const dot = (ctx, name, x, y) => { const D = ctx.el(name, { x: x - 10, y: y - 10, w: 20, h: 20, kind: "mark" }); ctx.kit.disc(D.inner, 10, 10, 10, { fill: "accent" }); ctx.m.reveal(D, ctx.start + 0.1); return D; };
const sentence = (ctx, name, x, y, w, words) => { const E = ctx.el(name, { x, y, w, h: 120, kind: "text" });
  ctx.kit.text(E.inner, words, { role: "body", x: 0, y: 0, w, h: 120, maxLines: 2 }); ctx.m.reveal(E, ctx.start + 0.1); return E; };
Loom.scene("b1", { build(ctx) {
  dot(ctx, "dot_a", 700, 600); dot(ctx, "dot_b", 760, 620);
  Loom.treat.label(ctx, "label_a", { x: 760, y: 470, text: "First label", to: [700, 600], t: ctx.start + 0.2 });
  Loom.treat.label(ctx, "label_b", { x: 790, y: 485, text: "Second label", to: [760, 620], t: ctx.start + 0.2 }); } });
Loom.scene("b2", { build(ctx) {
  sentence(ctx, "line_b2", 400, 520, 1000, "A sentence that a label must never cover");
  dot(ctx, "dot_c", 900, 760);
  Loom.treat.label(ctx, "label_c", { x: 900, y: 560, text: "Covering label", to: [900, 760], t: ctx.start + 0.2 }); } });
Loom.scene("b3", { build(ctx) {
  const T = ctx.el("table", { x: 400, y: 620, w: 900, h: 40, kind: "object" }); ctx.kit.rect(T.inner, 0, 0, 900, 40, { fill: "ink", r: 4 }); ctx.m.reveal(T, ctx.start + 0.1);
  const M = ctx.el("mug", { x: 760, y: 500, w: 140, h: 140, kind: "object", overlaps: ["table"] }); ctx.kit.rect(M.inner, 0, 0, 140, 140, { fill: "accent", r: 18 }); ctx.m.reveal(M, ctx.start + 0.1);
  Loom.treat.label(ctx, "label_mug", { x: 830, y: 560, text: "Mug", t: ctx.start + 0.2, overlaps: ["mug"] }); } });
Loom.scene("b4", { build(ctx) {
  const E = ctx.el("title_b4", { x: 1500, y: 300, w: 760, h: 110, kind: "text" });
  ctx.kit.text(E.inner, "Now check your own key files", { role: "title", x: 0, y: 0, w: 760, h: 110, maxLines: 1 }); ctx.m.reveal(E, ctx.start + 0.1); } });
Loom.scene("b5", { build(ctx) {
  sentence(ctx, "line_b5", 400, 520, 1000, "A sentence that a label passes once");
  const L = Loom.treat.label(ctx, "label_sweep", { x: 300, y: 400, text: "Passing label", t: ctx.start + 0.2 });
  Loom.tween(L.mover, { x: 0, y: 0 }, { x: 1300, y: 160, duration: 0.3, ease: "none" }, ctx.start + 2.0, { kind: "travel", beat: ctx.beat.id, name: "label_sweep" }); } });
Loom.scene("b6", { build(ctx) {
  sentence(ctx, "line_b6", 400, 520, 1000, "A sentence under a fixed label");
  Loom.treat.label(ctx, "label_fixed", { x: 900, y: 560, text: "Fixed label", t: ctx.start + 0.2, layout: "fixed" }); } });
Loom.scene("b7", { build(ctx) {
  const D = ctx.el("divider", { x: 300, y: 500, w: 1300, h: 20, kind: "connector" });
  ctx.kit.line(D.inner, 0, 10, 1300, 10, { stroke: "ink", sw: 4 }); ctx.m.reveal(D, ctx.start + 0.1);
  Loom.treat.label(ctx, "label_on_line", { x: 960, y: 510, text: "Crossed label", t: ctx.start + 0.2 }); } });
"""


def _solve(page: Path, browser: str) -> dict:
    out = page / "solve.json"
    r = subprocess.run(["node", str(ENGINE / "tools" / "node" / "layout_solve.mjs"), str(page / "index.html"), str(out)],
                       capture_output=True, text=True, timeout=400, cwd=str(ENGINE), env=dict(os.environ, HYPERFRAMES_BROWSER_PATH=browser))
    assert out.exists(), f"solve wrote nothing: {r.stderr[-800:]}"
    res = json.loads(out.read_text(encoding="utf-8"))
    assert r.returncode == 0 and not res.get("error"), f"solve failed: {res.get('error')} {r.stderr[-600:]}"
    assert not res.get("logs"), f"page errors: {res['logs']}"
    return res


def _with_plan(page: Path, plan: dict) -> None:
    html = (page / "index.html").read_text(encoding="utf-8")
    m = re.search(r"window\.LOOM_MANIFEST = (\{.*?\});</script>", html, re.S)
    man = json.loads(m.group(1))
    man["layout_plan"] = plan
    (page / "index.html").write_text(html[:m.start(1)] + json.dumps(man) + html[m.end(1):], encoding="utf-8")


def check_layout_guard_moves_labels_and_edge_texts_and_leaves_meant_overlaps_alone():
    """runtime/layout.js on six planted beats (module doc): the colliding label, the covering label and the title past the
    edge move; the mug, the table, the mug's label, the passing label and the fixed label stay; with the plan applied a
    second solve moves nothing and finds no conflict; solving twice gives
    the same plan"""
    rt = _rt()
    br = rt._browser()
    if not br:
        return rt._SKIP
    page = rt._lesson(_JS, [{"kind": "bespoke"} for _ in range(7)], rt._ONE, 7)
    try:
        first = _solve(page, br)
        again = _solve(page, br)
        assert first["moves"] == again["moves"] and first["residual"] == again["residual"], "the same build solved twice differs"
        assert first["samples"] >= 30 and first["movables"] >= 8, f"the guard measured too little: {first['samples']} samples, {first['movables']} movables"
        moved = {m["name"]: m for m in first["moves"]}
        b1 = [n for n in ("label_a", "label_b") if n in moved]
        assert len(b1) == 1, f"b1: exactly one of the two labels moves: {list(moved)}"
        assert "label_c" in moved and "line_b2" not in moved, f"b2: the label moves, never the sentence: {list(moved)}"
        assert not {"table", "mug", "label_mug"} & set(moved), f"b3: a mug on its table and a label meant on the mug stay: {list(moved)}"
        t4 = moved.get("title_b4")
        assert t4 and t4["dx"] < 0 and t4["mode"] == "edge", f"b4: the title past the edge moves left: {t4}"
        assert "label_sweep" not in moved and "label_fixed" not in moved, f"b5, b6: a passing crossing and a fixed label stay: {list(moved)}"
        b7 = moved.get("label_on_line")
        assert b7 and "line_through" in b7["before"]["codes"] and "divider" not in moved, f"b7: the label moves off the line: {b7}"
        # as loom/layout_guard.guard_build does: apply the plan and solve again until nothing moves (a moved label's lead is
        # drawn to its new place only on the next build, and may then cross another label: b1, 2026-10-16), at most 3 rounds
        plan, cur, rounds = {}, first, 1
        while cur["moves"] and rounds <= 3:
            for m in cur["moves"]:
                k = f"{m['beat']}/{m['name']}"
                o = plan.get(k) or {"dx": 0, "dy": 0}
                plan[k] = {"dx": o["dx"] + m["dx"], "dy": o["dy"] + m["dy"]}
            _with_plan(page, plan)
            cur = _solve(page, br)
            rounds += 1
        second = cur
        assert len(second["applied"]) == len(plan), f"every planned offset is applied: {second['applied']} of {plan}"
        assert not second["moves"], f"the plan converges (a fixed point) within 3 rounds: {second['moves']}"
        left = [r for r in second["residual"] if r["beat"] in ("b1", "b2", "b4", "b7")]
        assert not left, f"no conflict is left where the guard moved: {left}"
        return f"{len(first['moves'])} moves ({', '.join(sorted(moved))}); a fixed point in {rounds} rounds; deterministic; {first['ms']} ms"
    finally:
        shutil.rmtree(page, ignore_errors=True)


_FIT = r"""
Loom.scene("b1", { build(ctx) {
  const E = ctx.el("ask", { x: 800, y: 400, w: 200, h: 60, kind: "text" });
  ctx.kit.text(E.inner, "?", { role: "title", x: 0, y: 0, w: 200, h: 60, maxLines: 1, align: "center", valign: "middle" }); ctx.m.reveal(E, ctx.start + 0.1);
  const W = ctx.el("too_wide", { x: 300, y: 700, w: 120, h: 60, kind: "text" });
  ctx.kit.text(W.inner, "Unbreakableword", { role: "title", x: 0, y: 0, w: 120, h: 60, maxLines: 1 }); ctx.m.reveal(W, ctx.start + 0.1); } });
"""


def check_layout_guard_grows_a_short_text_box_and_never_shrinks_the_type():
    """kit.text with the guard on (D-169): a "?" at the title floor in a box drawn too short for it gets a taller box (a
    text_box_grown warning, no text_overflow, and its element's declared box grows with it); a word wider than its box is
    still a text_overflow (the type never goes below the floor, the width is the author's); with the guard off both are
    text_overflow errors, as before (the classic way unchanged)"""
    rt = _rt()
    br = rt._browser()
    if not br:
        return rt._SKIP
    got = {}
    for on in (False, True):
        page = rt._lesson(_FIT, [{"kind": "bespoke"}], rt._ONE, 1, style="corporate-clean")
        try:
            if on:
                html = (page / "index.html").read_text(encoding="utf-8")
                m = re.search(r"window\.LOOM_MANIFEST = (\{.*?\});</script>", html, re.S)
                man = json.loads(m.group(1)); man["layout_guard"] = True
                (page / "index.html").write_text(html[:m.start(1)] + json.dumps(man) + html[m.end(1):], encoding="utf-8")
            r = _solve(page, br)
            got[on] = r
        finally:
            shutil.rmtree(page, ignore_errors=True)
    over = lambda r: sorted(e["msg"].split(": ", 1)[-1] for e in r["errors"] if e["code"] == "text_overflow")
    assert over(got[False]) == ['"?"', '"Unbreakableword"'], f"guard off: both overflow, as before: {got[False]['errors']}"
    assert over(got[True]) == ['"Unbreakableword"'], f"guard on: only the too-wide word overflows: {got[True]['errors']}"
    grown = [w for w in got[True]["warnings"] if w["code"] == "text_box_grown"]
    assert len(grown) == 1 and '"?"' in grown[0]["msg"], f"guard on: the short box grows, said as a warning: {got[True]['warnings']}"
    assert not [e for e in got[True]["errors"] if e["code"] in ("text_spill", "text_outside_element")],         f"the grown box and its element agree: {got[True]['errors']}"
    return f"short box grown ({grown[0]['msg'][:70]}...); too-wide word still an error; off unchanged"


def check_layout_guard_plan_entries_drop_when_their_scene_or_kit_changes():
    """loom/layout_guard.manifest_plan: a stored offset applies only while the scene file (or the template definition)
    and the lesson kit it was solved for are unchanged; an edited scene drops its entries, other beats keep theirs, and
    an empty store gives an empty plan (no Chrome needed)"""
    import tempfile
    from loom import layout_guard as LG
    from loom.util import write_json
    root = Path(tempfile.mkdtemp(prefix="lm_lg_"))
    try:
        build = root / "build"
        (build / "scenes").mkdir(parents=True)
        (build / "scenes" / "b01.js").write_text("// one\n", encoding="utf-8")
        (build / "scenes" / "_kit.js").write_text("// kit\n", encoding="utf-8")
        man = {"scenes": [{"beat": "b01", "kind": "bespoke"}, {"beat": "b02", "kind": "template", "template": "x", "props": {"a": 1}}]}

        class P:   # the two things manifest_plan reads from a project
            cfg = {"layout_guard": True}
            def path(self, rel):
                return root / rel
        p = P()
        assert LG.manifest_plan(p, build, man) == {}, "no store: no plan"
        keys = LG._scene_keys(build, man)
        write_json(LG.plan_path(p), {"entries": {"b01/label": {"dx": 10, "dy": 0, "for": keys["b01"]},
                                                 "b02/tag": {"dx": 0, "dy": -8, "for": keys["b02"]}}})
        assert LG.manifest_plan(p, build, man) == {"b01/label": {"dx": 10, "dy": 0}, "b02/tag": {"dx": 0, "dy": -8}}
        (build / "scenes" / "b01.js").write_text("// one, edited\n", encoding="utf-8")
        assert LG.manifest_plan(p, build, man) == {"b02/tag": {"dx": 0, "dy": -8}}, "an edited scene drops only its own entries"
        (build / "scenes" / "_kit.js").write_text("// kit, edited\n", encoding="utf-8")
        assert LG.manifest_plan(p, build, man) == {}, "an edited kit drops every entry"
        return "valid entries kept; an edited scene or kit drops them"
    finally:
        shutil.rmtree(root, ignore_errors=True)
