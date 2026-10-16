"""Reuse or build, per style (loom/kept.py, D-163; Kshitij 2026-10-12: "If a scene for the asked style exists, then reuse
otherwise build it. SIMPLE."). The library is assets/kept/<style>/{parts,beats}/<name>; these tests point it at a temp
folder and never touch the real one."""
from __future__ import annotations

import json
import re
import shutil
import sys
import tempfile
from contextlib import contextmanager
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from shuttle_rails import lesson  # noqa: E402
from loom import kept as KP  # noqa: E402
from loom.util import read_json, write_json  # noqa: E402

KIT = """// a lesson kit with a shared helper and a part that calls another
Loom.lesson = Loom.lesson || {};
(function () {
  const pad = (n) => n + 8;
  Loom.lesson.board = function (ctx, parent, opts) {
    const o = opts || {};
    ctx.kit.rect(parent, 0, 0, pad(o.w || 600), 360, { fill: ctx.c("surface"), r: 12 });
    return { setState: function (name, t) { return t; } };
  };
  Loom.lesson.frame = function (ctx, parent, opts) {
    const b = Loom.lesson.board(ctx, parent, { w: 300 });
    return { board: b, setState: function () {} };
  };
})();
"""
SCENE = """// @design held_board: a board fills with the three steps as they are said
Loom.scene("b10", { build(ctx) { const E = ctx.el("board_el", { x: 600, y: 300, w: 640, h: 380, kind: "card" });
  ctx.m.reveal(E, ctx.start + 0.1); Loom.lesson.board(ctx, E.inner, {}); } });
"""


@contextmanager
def _library():
    keep = KP.ROOT
    KP.ROOT = Path(tempfile.mkdtemp(prefix="loom_kept_"))
    try:
        yield KP.ROOT
    finally:
        shutil.rmtree(KP.ROOT, ignore_errors=True)
        KP.ROOT = keep


def _kit_lesson(p):
    sb = read_json(p.path("plan/storyboard.json"))
    sb["kit"] = {"parts": [{"id": "board", "what": "the held board", "states": ["blank", "full"], "beats": ["b10"]},
                           {"id": "frame", "what": "a framed board", "beats": ["b10"]}]}
    write_json(p.path("plan/storyboard.json"), sb)
    p.path("scenes/_kit.js").write_text(KIT, encoding="utf-8")
    p.path("scenes/b10.js").write_text(SCENE, encoding="utf-8")
    return sb


def check_kept_keeps_what_a_lesson_built_and_an_isolated_lesson_feeds_nothing():
    """keep(): every kit part (standalone code, its own id a placeholder, the parts it calls kept with it) and every bespoke
    beat with a scene file go to the lesson's style; keeping again is idempotent; a reused piece only counts a use; an
    isolated lesson (a comparison) neither feeds nor sees the library"""
    with _library(), lesson("P6", kit_beat="b10") as p:
        sb = _kit_lesson(p)
        style = KP.lesson_style(p, sb)
        r = KP.keep(p)
        parts = sorted(k for k in r["kept"] if "/part/" in k)
        assert parts == [f"{style}/part/board", f"{style}/part/frame"], r
        assert f"{style}/beat/held_board" in r["kept"], r
        fr = KP.card(f"{style}/part/frame")
        assert fr["needs"] == ["board"] and fr["from"]["lesson"] == p.id, fr
        js = KP.code(f"{style}/part/frame")
        assert KP.PART_ID in js and "Loom.lesson.board = Loom.lesson.board ||" in js and "const pad" in js, js
        bt = KP.card(f"{style}/beat/held_board")
        assert bt["what"].startswith("a board fills") and bt["needs"] == ["board"], bt
        assert 'Loom.scene("%s"' % KP.BEAT_ID in KP.code(bt["id"]), KP.code(bt["id"])
        n = len(KP.cards(style))
        KP.keep(p)
        assert len(KP.cards(style)) == n, "keeping the same lesson again adds nothing"
        # a later lesson that reuses: a use is counted, nothing new is kept for that piece
        sb["kit"]["parts"][0]["reuse"] = f"{style}/part/board"
        write_json(p.path("plan/storyboard.json"), sb)
        cfg = p.cfg; cfg["id"] = "agents-test-two"; p.save_cfg(cfg)
        r2 = KP.keep(p)
        assert f"{style}/part/board" in r2["used"] and KP.card(f"{style}/part/board")["uses"] == ["agents-test-two"], r2
        assert f"{style}/part/frame_agents_test_two" in r2["kept"], f"another lesson's piece of the same name is kept apart: {r2}"
        # isolated
        cfg = p.cfg; cfg["isolated"] = True; p.save_cfg(cfg)
        assert KP.keep(p)["kept"] == [] and KP.listing(p) == "", "an isolated lesson neither feeds nor sees the library"
    return f"{len(parts)} parts and a beat kept for {style}; a reuse counted; an isolated lesson skipped"


def check_a_storyboard_reuses_only_its_own_styles_pieces_in_both_pipelines():
    """The storyboard gate refuses a reuse that is unknown, of the wrong kind or of another style; a reused part is not the
    kit-builder's (checks.kit.declared), is listed to it as callable and is loaded before the kit; the storyboard writers
    (Relay's task, Shuttle's get_style_pack) see the style's library; a reused beat's author gets its starting code under
    its own beat id"""
    from loom.agents import conductor as C
    from loom.agents.tools import t_get_style_pack
    from loom.checks.kit import declared
    from loom.compose import compose
    with _library(), lesson("P6", kit_beat="b10") as p:
        sb = _kit_lesson(p)
        style = KP.lesson_style(p, sb)
        KP.keep(p)
        other = "whiteboard" if style != "whiteboard" else "corporate-clean"
        od = KP._dir(f"{other}/part/board")
        od.mkdir(parents=True)
        write_json(od / "card.json", {"id": f"{other}/part/board", "kind": "part", "style": other, "name": "board", "what": "a board"})
        (od / "code.js").write_text(KP.code(f"{style}/part/board"), encoding="utf-8")
        E = KP.storyboard_errors({"kit": {"parts": [{"id": "a", "reuse": f"{style}/part/nothing"},
                                                     {"id": "b", "reuse": f"{style}/beat/held_board"},
                                                     {"id": "c", "reuse": f"{other}/part/board"}]},
                                  "scenes": [{"beat": "b01", "kind": "template", "reuse": f"{style}/beat/held_board"}]}, style)
        assert len(E) == 4 and "not in the library" in E[0] and "is a beat" in E[1] and "never across styles" in E[2] and "bespoke" in E[3], E
        # the lesson reuses its board and its beat
        sb["kit"]["parts"][0]["reuse"] = f"{style}/part/board"
        for s in sb["scenes"]:
            if s["beat"] == "b10":
                s["reuse"] = f"{style}/beat/held_board"
        write_json(p.path("plan/storyboard.json"), sb)
        assert KP.storyboard_errors(sb, style) == []
        assert [x["id"] for x in declared(p)] == ["frame"], "a reused part is not the kit-builder's"
        km = C.task_message(p, "kit", {})
        assert "PARTS REUSED FROM THE STYLE'S LIBRARY" in km and f"{style}/part/board" in km, km[-600:]
        lib = C.task_message(p, "storyboard", {})
        assert "THE STYLE'S LIBRARY" in lib and f"{style}/beat/held_board" in lib, lib[-800:]
        assert f"{other}/part/board" not in lib, "another style's piece is never offered (D-122)"

        class Ctx:
            project = p
        assert f"{style}/part/board" in (t_get_style_pack(Ctx()).get("kept_library") or ""), "Shuttle's lead reads it in P5"
        js, errs = KP.parts_js(p)
        assert not errs and 'Loom.lesson["board"] =' in js and KP.PART_ID not in js, js[:400]
        tm = {b["id"]: b for b in read_json(p.path("audio/timings.json"))["beats"]}
        sc = next(s for s in sb["scenes"] if s["beat"] == "b10")
        msg = C.task_message(p, "scene", {"scene": sc, "beat_timing": tm["b10"], "file": "scenes/b10.js", "file_abs": str(p.path("scenes/b10.js"))})
        assert "REUSE: this beat starts from the kept beat" in msg and 'Loom.scene("b10"' in msg and "REUSED PARTS" in msg, msg[-900:]
        # compose loads the reused part before the kit
        p.path("scenes/b10.js").write_text(SCENE, encoding="utf-8")
        compose(p, strict=False)
        built = p.path("build/scenes/_kept.js")
        assert built.exists() and 'Loom.lesson["board"]' in built.read_text(encoding="utf-8"), "compose writes the reused parts"
        html = p.path("build/index.html").read_text(encoding="utf-8") if p.path("build/index.html").exists() else ""
        assert not html or html.find("_kept.js") < html.find("_kit.js") or "_kit.js" not in html, "reused parts load before the kit"
    return "gate refuses 4 bad reuses; kit-builder builds only 'frame'; library in Relay's storyboard task and get_style_pack; starting code under b10; compose loads _kept.js"


_PROBE = r"""function () {
  const e = document.querySelector('[data-name="part_el"]');
  if (!e) return null;
  return e.innerHTML.replace(/\s(id|clip-path|mask|filter|fill|stroke)="url\(#[^"]*\)"/g, "").replace(/\sid="[^"]*"/g, "");
}"""


def check_a_reused_part_draws_what_it_drew_in_its_lesson():
    """A real kit part (https-private-v2's padlock and browser_window), cut out of its kit and loaded under another id,
    draws the same SVG as the lesson's own kit drew it (ids aside), on the real runtime"""
    import importlib.util
    spec = importlib.util.spec_from_file_location("lc_rfd", ROOT / "tests" / "suites" / "runtime_film_defects.py")
    rt = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(rt)
    if not rt._browser():
        return rt._SKIP
    src = (ROOT / "projects/https-private-v2/scenes/_kit.js").read_text(encoding="utf-8")
    out = []
    for pid in ("padlock", "browser_window"):
        if f"Loom.lesson.{pid}" not in src:
            continue
        kept_js, need = KP.part_code(src, pid)
        call = lambda name: ('Loom.scene("b1", { build(ctx) { const E = ctx.el("part_el", { x: 300, y: 200, w: 800, h: 600, kind: "card" });'
                             ' ctx.m.reveal(E, ctx.start + 0.1); Loom.lesson.%s(ctx, E.inner, {}); } });\n' % name)
        a = rt._run(rt._lesson(src + "\n" + call(pid), [{"kind": "bespoke"}], rt._ONE, 1, style="corporate-clean"), _PROBE, [2.0])
        b = rt._run(rt._lesson("Loom.lesson = Loom.lesson || {};\n" + kept_js.replace(KP.PART_ID, "reused_" + pid) + "\n" + call("reused_" + pid),
                               [{"kind": "bespoke"}], rt._ONE, 1, style="corporate-clean"), _PROBE, [2.0])
        va, vb = a["samples"][0]["v"], b["samples"][0]["v"]
        assert va and len(va) > 200, f"{pid}: the lesson's own part drew nothing to compare: {va!r}"
        assert va == vb, f"{pid}: the reused part draws differently ({len(va)} vs {len(vb or '')} chars)"
        out.append(f"{pid} {len(va)} chars identical" + (f" (with {need})" if need else ""))
    assert out, "no part to compare"
    return "; ".join(out)
