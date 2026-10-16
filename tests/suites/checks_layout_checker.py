"""Loom's own layout checker (tools/node/probe.mjs layoutAudit and contrastAudit, 2026-10-10) graded against defects
planted on purpose, never against another checker's verdict or a past film (Kshitij: "make sure that we first check our
checker"; "even the previous motion graphics video had a lot of flaws ... don't take it as the prime example").

One lesson on the real runtime, one case per beat (4 s each), every text drawn where the case needs it:
  b1  two texts on one spot for the whole beat                     overlap ERROR
  b2  a text that sweeps across another in 0.3 s                   a passing crossing, never an error
  b3  a text under an opaque card, another text on the card        not an error (one is not seen)
  b4  the b1 pair marked data-layout-allow-overlap                 exempt
  b5  a 0.2-alpha watermark under a label                          exempt from overlap (not solid), a contrast error
  b6  a tspan nested in its own text                               exempt (nested)
  b7  light grey text on the white field for the whole beat        contrast ERROR
  b8  the b7 grey text under an opaque card                        not judged (not seen)
  b9  ink text on the white field                                  passes (control)
  b10 a card over the lower half of a title, a text on the card    overlap ERROR (a cut: the title's tops show), covered ERROR
  b11 another element's card over the right half of a sentence     covered ERROR (no second text involved)
  b12 a blurred backdrop sentence, a card over half of it           quiet (a focus pull: not meant to be read)
  b13 a sentence crossed out by two thick lines                     quiet (a stroke mark, no fill: v3's X)
  b14 one label drawn twice on itself in one beat                   text_redrawn WARNING (across beats it is an error:
                                                                    run35_fixes' pilot test, L-319's redrawn sets)
  b15 a two-line kit text tilted 14 degrees                         quiet (its lines' boxes overlap, the glyphs do not)
  b16 a sentence running past the right edge of its own card        text_off_card ERROR
  b17 a connector drawn straight through a 40 px object of another   line_into_object ERROR; a second object drawn over
      element                                                       the same line stays quiet (the line passes behind it)
  b18 another element's grid line drawn through the middle of a     line_through_text ERROR (whiteboard film A, 2026-10-15:
      label, running on past it                                     the week strip's cell lines through "Budget report")
  b19 words written the whiteboard engine's way (a shadow text at   line_through_text ERROR: the engine's words are read
      fill-opacity 0 and their own strokes), a divider of another   (they were skipped); their own strokes and b13's
      element through them                                          cross on its sentence stay quiet
Every case must come back measured (the text counted, the sample taken): a check that saw nothing is red.
The browser test skips by name without a Chrome.
"""
from __future__ import annotations

import importlib.util
import shutil
from pathlib import Path

ENGINE = Path(__file__).resolve().parents[2]


def _helpers():
    out = {}
    for name in ("runtime_film_defects", "checks_film_defects"):
        spec = importlib.util.spec_from_file_location(f"lc_{name}", ENGINE / "tests" / "suites" / f"{name}.py")
        m = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(m)
        out[name] = m
    return out["runtime_film_defects"], out["checks_film_defects"]


_JS = r"""
const T = (p, s, x, y, fill, extra) => Loom.svg("text", Object.assign({ x, y, "font-family": "Inter, sans-serif", "font-size": 44, "font-weight": 600, fill }, extra || {}), p, s);
const card = (name, ctx, x, y, w, h) => { const E = ctx.el(name, { x, y, w, h, kind: "card" }); ctx.m.reveal(E, ctx.start + 0.1); return E; };
Loom.scene("b1", { build(ctx) { const E = card("pair", ctx, 300, 300, 900, 200);
  T(E.inner, "Alpha overlap words", 20, 100, "#1F2937"); T(E.inner, "Bravo overlap words", 30, 110, "#1F2937"); } });
Loom.scene("b2", { build(ctx) { const E = card("cross", ctx, 300, 300, 1300, 200);
  T(E.inner, "Standing label here", 400, 100, "#1F2937");
  const mv = Loom.svg("g", {}, E.inner); T(mv, "Sweeping past label", 0, 100, "#1F2937");
  Loom.tween(mv, { x: -900, y: 0 }, { x: 1300, y: 0, duration: 0.3, ease: "none" }, ctx.start + 2.0, { kind: "travel", beat: ctx.beat.id, name: "cross" }); } });
Loom.scene("b3", { build(ctx) { const E = card("under", ctx, 300, 300, 900, 200);
  T(E.inner, "Hidden under card", 20, 100, "#1F2937");
  Loom.svg("rect", { x: 0, y: 0, width: 900, height: 200, fill: "#FFFFFF" }, E.inner);
  T(E.inner, "Shown on the card", 30, 110, "#1F2937"); } });
Loom.scene("b4", { build(ctx) { const E = card("allowed", ctx, 300, 300, 900, 200);
  T(E.inner, "Alpha allowed words", 20, 100, "#1F2937", { "data-layout-allow-overlap": "" }); T(E.inner, "Bravo allowed words", 30, 110, "#1F2937", { "data-layout-allow-overlap": "" }); } });
Loom.scene("b5", { build(ctx) { const E = card("mark", ctx, 300, 300, 900, 200);
  T(E.inner, "WATERMARK WATERMARK", 20, 100, "rgba(31,41,55,0.2)"); T(E.inner, "Label over the mark", 30, 110, "#1F2937"); } });
Loom.scene("b6", { build(ctx) { const E = card("nest", ctx, 300, 300, 900, 200);
  const t = T(E.inner, "Outer text ", 20, 100, "#1F2937"); Loom.svg("tspan", {}, t, "inner part"); } });
Loom.scene("b7", { build(ctx) { const E = card("grey", ctx, 300, 600, 900, 120);
  T(E.inner, "Pale grey sentence", 20, 80, "#D5DAE0"); } });
Loom.scene("b8", { build(ctx) { const E = card("greyhid", ctx, 300, 600, 900, 120);
  T(E.inner, "Pale hidden sentence", 20, 80, "#D5DAE0");
  Loom.svg("rect", { x: 0, y: 0, width: 900, height: 120, fill: "#1F2937" }, E.inner); } });
Loom.scene("b9", { build(ctx) { const E = card("ink", ctx, 300, 600, 900, 120);
  T(E.inner, "Dark ink sentence", 20, 80, "#111827"); } });
Loom.scene("b10", { build(ctx) { const E = card("cut", ctx, 300, 300, 900, 300);
  T(E.inner, "Title cut by card", 20, 80, "#1F2937", { "font-size": 64 });
  Loom.svg("rect", { x: 0, y: 55, width: 900, height: 200, fill: "#FFFFFF", stroke: "#1F2937" }, E.inner);
  T(E.inner, "Card text on top", 30, 100, "#1F2937"); } });
Loom.scene("b11", { build(ctx) { const E = card("line", ctx, 300, 600, 900, 120);
  T(E.inner, "A sentence half under a card", 20, 80, "#1F2937");
  const C = card("cover", ctx, 700, 560, 600, 200); Loom.svg("rect", { x: 0, y: 0, width: 600, height: 200, fill: "#E5E7EB" }, C.inner); } });
Loom.scene("b12", { build(ctx) { const fid = Loom.uid("bl"); const df = Loom.svg("defs", {}, ctx.g);
  Loom.svg("feGaussianBlur", { stdDeviation: 6 }, Loom.svg("filter", { id: fid }, df));
  const E = card("backdrop", ctx, 300, 600, 900, 120); E.inner.setAttribute("filter", `url(#${fid})`);
  T(E.inner, "Blurred backdrop sentence", 20, 80, "#1F2937");
  const C = card("focus", ctx, 700, 560, 600, 200); Loom.svg("rect", { x: 0, y: 0, width: 600, height: 200, fill: "#E5E7EB" }, C.inner); } });
Loom.scene("b13", { build(ctx) { const E = card("struck", ctx, 300, 600, 900, 120);
  T(E.inner, "A sentence crossed out", 20, 80, "#1F2937");
  Loom.svg("line", { x1: 100, y1: 20, x2: 400, y2: 110, stroke: "#B91C1C", "stroke-width": 14 }, E.inner);
  Loom.svg("line", { x1: 400, y1: 20, x2: 100, y2: 110, stroke: "#B91C1C", "stroke-width": 14 }, E.inner); } });
Loom.scene("b14", { build(ctx) { const E = card("twice", ctx, 300, 600, 900, 120);
  T(E.inner, "Label drawn twice", 20, 80, "#1F2937"); T(E.inner, "Label drawn twice", 20, 80, "#1F2937"); } });
Loom.scene("b15", { build(ctx) { const E = card("tilted", ctx, 700, 500, 360, 160);
  const g = Loom.svg("g", { transform: "rotate(-14 180 80)" }, E.inner);
  ctx.kit.text(g, "Short tilted words", { role: "label", x: 20, y: 10, w: 220, h: 140, maxLines: 2, align: "center", valign: "middle" }); } });
Loom.scene("b16", { build(ctx) { const E = card("spill", ctx, 300, 600, 400, 90);
  Loom.svg("rect", { x: 0, y: 0, width: 400, height: 90, fill: "#E5E7EB" }, E.inner);
  T(E.inner, "This sentence runs off its card", 20, 60, "#1F2937"); } });
Loom.scene("b17", { build(ctx) {
  const icon = (name, x, y) => { const O = card(name, ctx, x, y, 40, 40); const g = Loom.svg("g", {}, O.inner); Loom.svg("rect", { x: 0, y: 0, width: 40, height: 40, rx: 6, fill: "#1F2937" }, g); return O; };
  icon("obj_under", 980, 380);
  const Ld = ctx.el("leader", { x: 1000, y: 200, w: 10, h: 600, kind: "connector" }); ctx.m.reveal(Ld, ctx.start + 0.1);
  Loom.svg("line", { x1: 0, y1: 0, x2: 0, y2: 600, stroke: "#B91C1C", "stroke-width": 4 }, Ld.inner);
  icon("obj_over", 980, 640); } });
Loom.scene("b18", { build(ctx) { const E = card("grid_label", ctx, 400, 400, 700, 120);
  T(E.inner, "Planted grid label", 20, 80, "#1F2937");
  const G = ctx.el("grid_line", { x: 200, y: 400, w: 1200, h: 120, kind: "mark" }); ctx.m.reveal(G, ctx.start + 0.1);
  Loom.svg("line", { x1: 0, y1: 64, x2: 1200, y2: 64, stroke: "#1F2937", "stroke-width": 3 }, G.inner); } });
Loom.scene("b19", { build(ctx) { const E = card("engine_words", ctx, 400, 400, 700, 120);
  T(E.inner, "Engine written words", 20, 80, "#1F2937", { "fill-opacity": 0, "data-engine-text": "whiteboard" });
  for (let k = 0; k < 8; k++) Loom.svg("path", { d: `M${30 + k * 50},50 L${50 + k * 50},84`, stroke: "#1F2937", "stroke-width": 4, fill: "none" }, E.inner);
  const D = ctx.el("divider_b19", { x: 600, y: 200, w: 10, h: 600, kind: "mark" }); ctx.m.reveal(D, ctx.start + 0.1);
  Loom.svg("line", { x1: 5, y1: 0, x2: 5, y2: 600, stroke: "#1F2937", "stroke-width": 3 }, D.inner); } });
"""


def check_layout_checker_finds_planted_overlaps_and_contrast_and_stays_quiet_on_exempt_cases():
    """tools/node/probe.mjs layoutAudit and contrastAudit on a lesson with one planted case per beat (module doc): the
    held overlap and the pale text are errors; the crossing, the covered text, the allowed pair, the watermark, the
    nested tspan, the covered pale text and the ink text are not; every case was measured"""
    rt, cf = _helpers()
    br = rt._browser()
    if not br:
        return cf._SKIP
    page = rt._lesson(_JS, [{"kind": "bespoke"} for _ in range(19)], rt._ONE, 19)
    try:
        pr = cf._probe(page, br)
    finally:
        shutil.rmtree(page, ignore_errors=True)
    assert not pr.get("layout_error") and not pr.get("contrast_error"), (pr.get("layout_error"), pr.get("contrast_error"))
    L, C = pr["layout"], pr["contrast"]
    assert L["samples"] >= 70 and L["texts"] >= 12, f"the layout check measured too little: {L['samples']} samples, {L['texts']} texts"
    ov = [f for f in L["findings"] if f["code"] == "content_overlap"]
    rd = [f for f in L["findings"] if f["code"] == "text_redrawn"]
    assert len(rd) == 1 and rd[0]["texts"] == ["Label drawn twice"] and rd[0]["severity"] == "warning", f"b14 drawn twice in one beat: {rd}"
    words = lambda f: f["a"]["text"] + " | " + f["b"]["text"]
    by = lambda key: [f for f in ov if key in words(f)]
    held = by("Alpha overlap")
    assert len(held) == 1 and held[0]["severity"] == "error" and held[0]["held_ms"] >= 3000, f"b1 held overlap: {held}"
    cross = by("Sweeping")
    assert all(f["severity"] != "error" for f in cross), f"b2 a 0.3 s crossing is not an error: {cross}"
    under = by("Hidden under")
    assert all(f["severity"] != "error" for f in under), f"b3 a text under an opaque card is not seen: {under}"
    assert not by("allowed") and not by("WATERMARK") and not by("Outer text") and not by("inner part"), \
        f"exempt cases reported: {[words(f) for f in ov]}"
    cut = by("Title cut")
    assert len(cut) == 1 and cut[0]["severity"] == "error" and cut[0]["kind"] == "cut", f"b10 a title cut by a card: {cut}"
    assert held[0]["kind"] == "clash", held
    assert not [f for f in ov if f["a"]["beat"] == "b15" or f["b"]["beat"] == "b15"], "b15 the lines of one tilted text are one block"
    oc = [f for f in L["findings"] if f["code"] == "text_off_card"]
    assert [(f["text"], f["severity"]) for f in oc] == [("This sentence runs off its card", "error")], f"b16 only: {oc}"
    li = [f for f in L["findings"] if f["code"] == "line_into_object"]
    assert len(li) == 1 and li[0]["severity"] == "error" and li[0]["object"]["el"] == "obj_under" and li[0]["line"]["el"] == "leader", \
        f"b17: the line into obj_under only (obj_over is drawn over the line): {li}"
    tt = sorted((f["text"], (f.get("line") or {}).get("el"), f["severity"]) for f in L["findings"] if f["code"] == "line_through_text")
    assert tt == [("Engine written words", "divider_b19", "error"), ("Planted grid label", "grid_line", "error")], \
        f"b18 and b19 only (b13's cross and b19's own strokes are marks on the words): {tt}"
    errs = [f for f in ov if f["severity"] == "error"]
    assert sorted(words(f) for f in errs) == sorted(words(f) for f in held + cut), f"only b1 and b10 are overlap errors: {[words(f) for f in errs]}"
    assert C["checked"] >= 9 and C["samples"] == 38, f"the contrast check measured too little: {C}"
    cf_ = {f["text"]: f for f in C["findings"]}
    assert "Pale grey sentence" in cf_ and cf_["Pale grey sentence"]["severity"] == "error" and cf_["Pale grey sentence"]["ratio"] < 2, cf_
    assert "Pale hidden sentence" not in cf_, f"b8 a pale text under an opaque card is not judged: {cf_['Pale hidden sentence']}"
    assert "Dark ink sentence" not in cf_, f"b9 ink on white passes: {cf_.get('Dark ink sentence')}"
    # the 0.2 watermark is faint text by WCAG too (its alpha is blended in, as HyperFrames does): exempt from the overlap
    # rule, not from contrast
    assert sorted(t for t, f in cf_.items() if f["severity"] == "error") == ["Pale grey sentence", "WATERMARK WATERMARK"], list(cf_)
    cov = {f["text"]: f for f in L["findings"] if f["code"] == "text_covered"}
    assert sorted(t for t, f in cov.items() if f["severity"] == "error") == ["A sentence half under a card", "Title cut by card"], \
        f"covered: only b10's title and b11's sentence (b3 and b8 wholly hidden, b12 blurred, b13 struck by lines): {cov}"
    assert "Blurred backdrop sentence" not in cf_, f"b12 a blurred backdrop is not judged for contrast: {cf_.get('Blurred backdrop sentence')}"
    return (f"covered: b11 {int(cov['A sentence half under a card']['share'] * 100)} %, b10 title; overlap: b1 clash held {held[0]['held_ms']} ms, b10 cut {cut[0]['seen_ms']} ms, {len(ov)} finding(s) in all, 2 errors; contrast: pale text "
            f"{cf_['Pale grey sentence']['ratio']}:1 error, {C['checked']} checked; layout {L['ms']} ms, contrast {C['ms']} ms")


_CARRY_JS = r"""
const L = (p, s, y) => Loom.svg("text", { x: 0, y, "font-family": "Caveat", "font-size": 40, fill: "#1F2937" }, p, s);
Loom.scene("b1", { build(ctx) {
  const F = ctx.el("full_board", { x: 200, y: 150, w: 1400, h: 700, kind: "card" }); ctx.m.reveal(F, ctx.start + 0.1);
  for (let k = 0; k < 7; k++) L(F.inner, "carried board words here", 60 + k * 90);
  const N = ctx.el("small_note", { x: 1650, y: 900, w: 200, h: 60, kind: "label" }); ctx.m.reveal(N, ctx.start + 0.1);
  L(N.inner, "keep this", 40); } });
Loom.scene("b2", { build(ctx) { ctx.held("full_board"); ctx.held("small_note"); } });
Loom.scene("b3", { build(ctx) { ctx.held("small_note");
  const E = ctx.el("fresh", { x: 200, y: 150, w: 900, h: 100, kind: "text" }); ctx.m.reveal(E, ctx.start + 0.1); L(E.inner, "A fresh section", 60); } });
"""


def check_board_carry_flags_a_section_that_opens_on_a_full_board():
    """Kshitij, 2026-10-15 (whiteboard): carry a few things into a new section, not so many that the new explanation has
    no room; the rest is wiped at the end of its section. The whiteboard pack's board.carry rule, three sections of one
    beat: b2 opens section s2 still showing b1's full board (28 words, most of the frame): board_carry ERROR at b2; b3
    opens s3 carrying only a two-word note: quiet. A pack without the rule: not checked."""
    rt, cf = _helpers()
    br = rt._browser()
    if not br:
        return cf._SKIP
    from loom.compose import load_style
    stl = load_style("whiteboard")
    assert (stl.get("board") or {}).get("carry"), "the whiteboard pack sets board.carry"
    out = {}
    for name, pack in (("rule", stl), ("none", dict(stl, board={}))):
        page = rt._lesson(_CARRY_JS, [{"kind": "bespoke"} for _ in range(3)], rt._ONE, 3, style=pack)
        try:
            f = page / "index.html"
            h = f.read_text(encoding="utf-8")
            for i, sec in ((1, "s1"), (2, "s2"), (3, "s3")):
                a = f'"id": "b{i}", "section": "s"'
                assert a in h, f"the lesson page lists its beats as expected ({a})"
                h = h.replace(a, f'"id": "b{i}", "section": "{sec}"')
            f.write_text(h, encoding="utf-8")
            out[name] = cf._probe(page, br)
        finally:
            shutil.rmtree(page, ignore_errors=True)
    pr = out["rule"]
    assert not pr.get("layout_error"), pr.get("layout_error")
    bc = [f for f in pr["layout"]["findings"] if f["code"] == "board_carry"]
    assert pr.get("board_checked") == 2, f"two section openings checked: {pr.get('board_checked')}"
    assert [(f["beat"], f["severity"]) for f in bc] == [("b2", "error")] and bc[0]["words"] >= 28, f"b2 only: {bc}"
    assert "full_board" in bc[0]["elements"], bc
    none = [f for f in out["none"]["layout"]["findings"] if f["code"] == "board_carry"]
    assert not none and not out["none"].get("board_checked"), f"no rule, not checked: {none}"
    return f"b2 opens on {bc[0]['words']} carried words, {int(bc[0]['share'] * 100)} % of the frame: error; b3 carries a note: quiet; no rule: not checked"


def _probe_rep(errors_only=False):
    ov = {"code": "content_overlap", "severity": "error", "time": 12.5, "t0": 12.0, "t1": 14.0, "held_ms": 2000, "occurrences": 5, "painted": 5,
          "kind": "clash", "seen_ms": 2000, "a": {"text": "Alpha words", "beat": "b03", "el": "left", "tag": "tspan"},
          "b": {"text": "Bravo words", "beat": "b03", "el": "right", "tag": "tspan"}, "rect": [10, 10, 90, 40], "why": "both texts seen overlapping for 2000 ms"}
    cr = {"code": "contrast_aa_failure", "severity": "warning", "time": 30.1, "ratio": 2.1, "required": 4.5, "fg": "rgb(200,200,200)",
          "bg": "rgb(255,255,255)", "text": "Pale words", "beat": "b05", "el": "note", "samples": 1}
    quiet = dict(ov, severity="info", why="a passing crossing (under 500 ms)")
    return {"nodes": 4000, "layout": {"samples": 40, "texts": 12, "ms": 900, "findings": [ov, quiet]},
            "contrast": {"samples": 8, "checked": 30, "passed": 29, "ms": 1200, "findings": [cr]}}


def check_layout_checker_lines_modes_router_and_shadow_record():
    """qa.lc_lines: an error and a warning become "lc ..." lines naming the beat, an info finding is left out, and a
    missing or failed audit is an error (a check that measured nothing never passes); qa.checker_mode reads
    LOOM_CHECKER, then project.json, refuses an unknown name and defaults to loom (D-154); the router takes the beat from an
    lc line; the ledger gives lc lines their own kind; qa.checker_shadow matches a HyperFrames error to Loom's by text
    and time and appends one record per build"""
    import os
    import tempfile
    from loom import qa
    from loom.agents import router
    from loom.ledger import _kind_of
    from loom.util import LoomError, write_json
    E, W = qa.lc_lines(_probe_rep())
    assert len(E) == 1 and E[0].startswith("lc layout content_overlap @ 12.5: b03 \"Alpha words\"") and "[left / right]" in E[0], E
    assert len(W) == 1 and W[0].startswith("lc contrast contrast_aa_failure @ 30.1: b05 \"Pale words\" contrast 2.1:1"), W
    for broken in ({"layout_error": "TypeError: x", "contrast": _probe_rep()["contrast"]}, {"contrast": _probe_rep()["contrast"]}):
        e2, _ = qa.lc_lines(broken)
        assert any("audit_failed" in x for x in e2), e2
    assert _kind_of(E[0]) == "lc layout content_overlap" and _kind_of("(shadow) " + E[0]) == "lc layout content_overlap"

    class P:
        def __init__(self, d, cfg):
            self.d, self.cfg = Path(d), cfg

        def path(self, rel):
            return self.d / rel
    old = os.environ.pop("LOOM_CHECKER", None)
    try:
        assert qa.checker_mode(P(".", {})) == "loom"
        assert qa.checker_mode(P(".", {"check": {"checker": "shadow"}})) == "shadow"
        os.environ["LOOM_CHECKER"] = "hyperframes"
        assert qa.checker_mode(P(".", {"check": {"checker": "loom"}})) == "hyperframes"
        os.environ["LOOM_CHECKER"] = "both"
        try:
            qa.checker_mode(P(".", {}))
            raise AssertionError("an unknown checker was accepted")
        except LoomError:
            pass
    finally:
        os.environ.pop("LOOM_CHECKER", None)
        if old is not None:
            os.environ["LOOM_CHECKER"] = old
    with tempfile.TemporaryDirectory() as d:
        p = P(d, {})
        (p.d / "qa").mkdir(); (p.d / "build").mkdir()
        (p.d / "build" / "index.html").write_text("<html></html>", encoding="utf-8")
        write_json(p.path("build/manifest.json"), {"beats": [{"id": "b01", "start": 0, "end": 20}, {"id": "b03", "start": 20, "end": 40}]})
        write_json(p.path("qa/report.json"), {"errors": [E[0]]})
        got = router.collect(p)
        assert got and got[0]["beat"] == "b03" and got[0]["code"] == "content_overlap" and got[0]["source"] == "lc", got
        hf = {"layout": {"findings": [{"code": "content_overlap", "severity": "error", "time": 12.9, "text": "Bravo words", "selector": "#x > tspan"},
                                      {"code": "content_overlap", "severity": "error", "time": 60.0, "text": "Gamma", "selector": "#y > tspan"}]}}
        lines = ["hf layout content_overlap @ 12.9: Two text blocks overlap. [#x > tspan]", "hf layout content_overlap @ 60.0: Two text blocks overlap. [#y > tspan]"]
        rec = qa.checker_shadow(p, hf, lines, _probe_rep())
        assert rec["hf_errors"] == 2 and rec["found"] == 1 and [m["text"] for m in rec["missed"]] == ["Gamma"] and not rec["loom_only"], rec
        qa.checker_shadow(p, hf, lines, _probe_rep())
        assert len(qa.read_json(p.path("qa/checker_shadow.json"))) == 1, "one record per build"
    return f"{E[0][:70]}...; modes, router beat b03, shadow found 1 of 2"


def check_style_lint_measures_the_section_label_where_the_vignette_darkens_it():
    """loom/checks/style_lint.py: the section label sits in the top-left corner, where story-cartoon's 0.32 vignette
    (Kshitij's decision) darkens the paper to about #b8b2a7; muted read 2.7:1 there (frames of the bench lessons). The
    lint now measures the label's token on the darkened field: story-cartoon without roles.section_label fails, with it
    (ink) passes, and every pack in packs/styles is clean"""
    import copy
    from loom.checks.style_lint import lint_all, lint_style, vignette_dark
    from loom.compose import load_style
    p = load_style("story-cartoon")
    assert vignette_dark(p, p["palette"]["field"]).lower() in ("#b7b1a7", "#b8b2a7"), vignette_dark(p, p["palette"]["field"])
    q = copy.deepcopy(p); q["roles"].pop("section_label", None)
    bad = [e for e in lint_style(q) if "section label" in e]
    assert bad and "2.6" in bad[0], bad
    assert not [e for e in lint_style(p) if "section label" in e]
    dirty = {k: v for k, v in lint_all().items() if v}
    assert not dirty, dirty
    return bad[0][:90]


def check_a_look_splits_its_beats_own_findings_from_the_ones_it_shares():
    """qa.beat_findings (the check at draw time, D-154): an overlap inside b03 and a covered b03 text are b03's own errors
    (they hold its submission); an overlap between b03 and b02 is shared, named, and never holds; b05's findings are not
    b03's; a failed audit is an error (a look that measured nothing)"""
    from loom import qa

    class P:
        id = "fixture"
        def path(self, rel):
            from pathlib import Path
            return Path("/nonexistent") / rel
    ov = lambda a, b, sev="error": {"code": "content_overlap", "severity": sev, "time": 20, "t0": 20, "t1": 22, "why": "both texts seen overlapping for 2000 ms",
                                    "rect": [0, 0, 9, 9], "a": {"text": "A " + a, "beat": a, "el": "x"}, "b": {"text": "B " + b, "beat": b, "el": "y"}}
    pr = {"layout": {"findings": [ov("b03", "b03"), ov("b03", "b02"), ov("b05", "b05"),
                                  {"code": "text_covered", "severity": "error", "time": 21, "t0": 21, "t1": 23, "share": 0.4, "text": "Covered words", "beat": "b03", "el": "z"}]},
          "contrast": {"findings": []}}
    r = qa.beat_findings(P(), pr, "b03")
    assert len(r["errors"]) == 2 and all("b03" in e for e in r["errors"]), r
    assert len(r["shared"]) == 1 and "shared with b02" in r["shared"][0], r
    assert not any("b05" in x for x in r["errors"] + r["shared"]), r
    r2 = qa.beat_findings(P(), {"layout_error": "boom", "contrast": {"findings": []}}, "b03")
    assert any("audit_failed" in e for e in r2["errors"]), r2
    return f"own {len(r['errors'])}, shared {len(r['shared'])}"


_FLAG_JS = r"""
Loom.scene("b1", { build(ctx) {
  const P = ctx.el("part", { x: 900, y: 500, w: 60, h: 60, kind: "object" }); ctx.kit.rect(P.inner, 0, 0, 60, 60, { fill: "ink" }); ctx.m.reveal(P, ctx.start + 0.1);
  Loom.treat.label(ctx, "on_part", { x: 700, y: 300, text: "On the part", as: "flag", to: [930, 500], t: ctx.start + 0.2 });
  Loom.treat.label(ctx, "on_ground", { x: 300, y: 600, text: "On the ground", as: "flag", t: ctx.start + 0.2 });
} });
"""


def check_a_flag_on_a_part_has_no_ground_shadow():
    """runtime/treat.js T.label as flag: a pole standing on a part draws no contact shadow (on https-private's padlock a
    dark ellipse capped the shackle, 92 s); a flag standing on the ground keeps it"""
    rt, cf = _helpers()
    br = rt._browser()
    if not br:
        return cf._SKIP
    page = rt._lesson(_FLAG_JS, [{"kind": "bespoke"}], rt._ONE, 1)
    probe = r"""function () { const n = (name) => { const e = document.querySelector('.lm-el[data-name="' + name + '.lead"]'); return e ? e.querySelectorAll('ellipse').length : -1; };
      return { part: n('on_part'), ground: n('on_ground') }; }"""
    out = rt._run(page, probe, [1.0])
    v = out["samples"][0]["v"]
    assert v == {"part": 0, "ground": 1}, v
    return f"on a part {v['part']} shadow, on the ground {v['ground']}"


def check_shuttle_refuses_a_run_without_webgl():
    """loom/shuttle/launch.run: when the render browser has no WebGL in HyperFrames' software capture (2026-10-10: lost
    mid-afternoon; fx layers, Three.js and the brush would not draw), a run is refused with the reason and the way out,
    before any session; LOOM_ALLOW_NO_WEBGL=1 lets it past the preflight"""
    import os
    from loom import render as R
    from loom.shuttle import launch as LA
    from loom.util import LoomError
    keep_env, keep_fn = os.environ.pop("LOOM_ALLOW_NO_WEBGL", None), R.render_webgl
    try:
        R.render_webgl = lambda: {"software": {"webgl": False}, "probe": {"webgl": False}}
        try:
            LA.run(None, mode="subscription", lead="sonnet")
            raise AssertionError("a run started without WebGL")
        except LoomError as e:
            msg = str(e)
            assert "no WebGL" in msg and "LOOM_ALLOW_NO_WEBGL" in msg, msg
        os.environ["LOOM_ALLOW_NO_WEBGL"] = "1"
        try:
            LA.run(None, mode="subscription", lead="sonnet")
        except LoomError as e:
            assert "WebGL" not in str(e), str(e)
        except Exception:  # noqa: BLE001  (past the preflight: the missing project fails next, which is fine here)
            pass
    finally:
        R.render_webgl = keep_fn
        os.environ.pop("LOOM_ALLOW_NO_WEBGL", None)
        if keep_env is not None:
            os.environ["LOOM_ALLOW_NO_WEBGL"] = keep_env
    return msg[:100]


def check_the_next_beats_names_are_a_contract_in_the_look():
    """L-409 (gps-position: 22 held_missing at the first check, a storyboard reopen to clear): conductor.taken_by_next names
    what the next beat takes from a beat (its keep, binding; this beat's planned elements, advisory) and only when it continues
    on the same station; the look's _continuity_contract makes a missing kept name this beat's own error, a missing planned
    name a warning, and a held_missing for a name this beat keeps a wait on the previous beat (shown, not holding)"""
    import tempfile
    from pathlib import Path
    from loom.agents import tools as T
    from loom.agents.conductor import taken_by_next
    from loom.util import write_json
    with tempfile.TemporaryDirectory() as d:
        root = Path(d)
        (root / "plan").mkdir(); (root / "audio").mkdir()
        write_json(root / "plan/script.json", {"beats": [{"id": "b01"}, {"id": "b02"}, {"id": "b03"}]})
        write_json(root / "plan/storyboard.json", {"scenes": [
            {"beat": "b01", "station": "s", "kind": "bespoke", "design": {"elements": [{"name": "rings"}, {"name": "label"}]}},
            {"beat": "b02", "station": "s", "kind": "bespoke", "keep": ["rings"], "join_in": {"type": "continue"}},
            {"beat": "b03", "station": "other", "kind": "bespoke", "keep": [], "join_in": {"type": "fade"}}]})
        write_json(root / "audio/timings.json", {"beats": [{"id": "b01", "start": 0, "end": 5}, {"id": "b02", "start": 5, "end": 10}]})

        class P:
            def path(self, rel):
                return root / rel
        p = P()
        tb = taken_by_next(p, "b01")
        assert tb == {"beat": "b02", "names": ["rings", "label"], "kept": ["rings"]}, tb
        assert taken_by_next(p, "b02") == {}, "the next beat is on another station: no contract"

        class C:
            project, beat = p, "b01"
            extra = {"scene": {"beat": "b01", "keep": []}}
        rep = {"elements": [{"beat": "b01", "name": "circles", "lifeT": [0.5, 5.0]}]}
        rest, waits, owes, soft = T._continuity_contract(C(), rep, [])
        assert len(owes) == 1 and "keeps ['rings']" in owes[0] and len(soft) == 1 and "['label']" in soft[0], (owes, soft)
        rep_ok = {"elements": [{"beat": "b01", "name": "rings", "lifeT": [0.5, 5.0]}, {"beat": "b01", "name": "label", "lifeT": [1, 5]}]}
        assert T._continuity_contract(C(), rep_ok, [])[2:] == ([], []), "the names built: nothing owed"

        class C2:
            project, beat = p, "b02"
            extra = {"scene": {"beat": "b02", "keep": ["rings"]}}
        err = 'held_missing: b02: no element "rings" in previous scene'
        other = 'held_missing: b02: no element "made_up" in previous scene'
        rest, waits, owes, soft = T._continuity_contract(C2(), {"elements": []}, [err, other])
        assert rest == [other] and len(waits) == 1 and "waits on that beat" in waits[0], (rest, waits)
    return "kept names hold, planned names warn, a kept name the previous beat lacks waits on it"


_SHADOW_JS = r"""
Loom.scene("b1", { build(ctx) {
  const E = ctx.el("chip", { x: 600, y: 400, w: 240, h: 90, kind: "card" }); ctx.m.reveal(E, ctx.start + 0.1);
  Loom.svg("rect", { x: 0, y: 8, width: 240, height: 76, rx: 14, fill: Loom.style.c("shadow"), opacity: 0.4 }, E.inner);   // unclassed shadow
  Loom.svg("rect", { x: 0, y: 0, width: 240, height: 76, rx: 14, fill: Loom.style.c("surface") }, E.inner);
  ctx.kit.text(E.inner, "Label", { role: "label", x: 20, y: 6, w: 200, h: 50, maxLines: 1, align: "center", valign: "top" });   // roomy in the pill, tight against the shadow
} });
Loom.scene("b2", { build(ctx) {
  const E = ctx.el("tight", { x: 600, y: 400, w: 240, h: 90, kind: "card" }); ctx.m.reveal(E, ctx.start + 0.1);
  Loom.svg("rect", { x: 0, y: 0, width: 240, height: 56, rx: 14, fill: Loom.style.c("surface") }, E.inner);
  ctx.kit.text(E.inner, "Label", { role: "label", x: 2, y: 2, w: 236, h: 52, maxLines: 1, align: "left", valign: "middle" });
} });
"""


def check_the_inset_check_knows_a_drop_shadow():
    """runtime/kit.js containerOf (L-410): a pill with an unclassed same-size shadow 8 px below it is measured against the
    pill, so text with room inside the pill raises no tight_inset (gps-position's chip: two kit reopens); a text really
    tight in its pill still does, and the message names the shape it was measured against"""
    rt, cf = _helpers()
    br = rt._browser()
    if not br:
        return cf._SKIP
    page = rt._lesson(_SHADOW_JS, [{"kind": "bespoke"} for _ in range(2)], rt._ONE, 2)
    try:
        pr = cf._probe(page, br)
    finally:
        import shutil as _sh
        _sh.rmtree(page, ignore_errors=True)
    ti = [e for e in pr.get("errors") or [] if e.get("code") == "tight_inset"]
    assert not [e for e in ti if e.get("beat") == "b1"], f"b1: the shadow is not the container: {ti}"
    b2 = [e for e in ti if e.get("beat") == "b2"]
    assert b2 and "measured against the rect" in b2[0]["msg"], f"b2: a tight text still fails, naming the shape: {ti}"
    return b2[0]["msg"][:110]


_VEIL_JS = r"""
const fill = (E, a, extra) => Loom.svg("rect", Object.assign({ x: 0, y: 0, width: E.w || 1920, height: E.h || 1080, fill: "#0E1133", "fill-opacity": a }, extra || {}), E.inner);
Loom.scene("b1", { build(ctx) {
  const E = ctx.el("dusk", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" }); ctx.m.reveal(E, ctx.start + 0.1);   // gps-position b21: 0.25 to 0.75
  const r = fill(E, 1); Loom.tween(r, { attr: { "fill-opacity": 0.25 } }, { attr: { "fill-opacity": 0.75 }, duration: 10, ease: "none" }, ctx.start + 1.0, { kind: "travel", beat: ctx.beat.id, name: "dusk" });
} });
Loom.scene("b2", { build(ctx) {
  const B = ctx.el("backdrop", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" }); ctx.m.reveal(B, ctx.start + 0.1); fill(B, 1);   // a set: opaque
  const D = ctx.el("dim", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" }); ctx.m.reveal(D, ctx.start + 0.1);
  const r = fill(D, 0.5); Loom.tween(r, { opacity: 1 }, { opacity: 0, duration: 0.2, ease: "none" }, ctx.start + 3.0, { kind: "travel", beat: ctx.beat.id, name: "dim" });
  const C = ctx.el("card", { x: 500, y: 400, w: 900, h: 200, kind: "card" }); ctx.m.reveal(C, ctx.start + 0.1);
  Loom.svg("rect", { x: 0, y: 0, width: 900, height: 200, fill: "#FFF6E6" }, C.inner);
} });
Loom.scene("b3", { build(ctx) {
  const E = ctx.el("upper", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" }); ctx.m.reveal(E, ctx.start + 0.1);   // a band growing down the canvas
  const r = fill(E, 0.35, { height: 1080 }); Loom.tween(r, { attr: { height: 540 } }, { attr: { height: 1080 }, duration: 10, ease: "none" }, ctx.start + 1.0, { kind: "travel", beat: ctx.beat.id, name: "upper" });
  const W = ctx.el("set_wall", { x: 0, y: 0, w: 1920, h: 780, kind: "scenery" }); ctx.m.reveal(W, ctx.start + 0.1); fill(W, 0.6);   // a steady wall wash (dc-cooling b04)
} });
"""


def check_a_full_frame_veil_is_a_second_background():
    """tools/node/probe.mjs full_frame_veil (L-412, gps-position b21: a 0.25 to 0.75 dusk rect over the whole frame for 40 s,
    which Kshitij saw as "a completely different shade dividing the entire canvas"): a translucent full-frame shape whose
    alpha climbs over 11 s is an error, and so is a translucent band growing down the frame; a steady translucent wall wash
    (dc-cooling's room, feedback-relay-v2's meeting room), an opaque set backdrop, an opaque card and a steady 3 s dim are
    not reported"""
    rt, cf = _helpers()
    br = rt._browser()
    if not br:
        return cf._SKIP
    page = rt._lesson(_VEIL_JS, [{"kind": "bespoke"} for _ in range(3)], rt._ONE, 3, dur=12.0)
    try:
        pr = cf._probe(page, br)
    finally:
        shutil.rmtree(page, ignore_errors=True)
    assert not pr.get("layout_error"), pr.get("layout_error")
    vf = {f["el"]: f for f in pr["layout"]["findings"] if f["code"] == "full_frame_veil"}
    assert vf.get("dusk", {}).get("severity") == "error" and vf["dusk"]["held_ms"] >= 10000, f"b1 a 12 s veil: {vf}"
    assert vf.get("upper", {}).get("severity") == "error", f"b3 a band across the frame: {vf}"
    assert not {"dim", "backdrop", "card", "set_wall"} & set(vf), f"steady or opaque shapes are not veils: {vf}"
    from loom.qa import lc_line
    line = lc_line("layout", vf["dusk"])
    assert "re-tints the whole field" in line and "dusk" in line, line
    return f"dusk {vf['dusk']['held_ms']} ms changing by {vf['dusk']['change']} error, growing band error; wall, dim, backdrop quiet"
