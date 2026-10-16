"""Fixes from the Shuttle Opus run (feedback-shuttle-opus, 2026-10-08, R-34, L-318 to L-323) that live in the shared
engine: the props gate's indexes (L-321), the snapshot's private build (serial snapshots), the kit continuity probe
(L-319). Shuttle's own fixes are tested in shuttle_rails.py."""
from __future__ import annotations

import json
import shutil
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))   # tests/: one browser check for every suite
from browser_support import browser  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from agents_runtime import DEMO, cast_storyboard, fresh_project  # noqa: E402
from loom.checks import gates as G  # noqa: E402
from loom.util import read_json, write_json  # noqa: E402


def _copy_plan(p):
    for rel in ("plan/storyboard.json", "plan/script.json", "plan/allocation.json", "plan/brief.json", "plan/teaching_plan.json",
                "plan/persona.json", "plan/knowledge.json", "audio/timings.json"):
        src = DEMO / rel
        if src.exists():
            p.path(rel).parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, p.path(rel))
    cast_storyboard(p)


def check_template_indexes_count_from_zero():
    """L-321: a quiz answer written counting from 1 (answer 2 of 2 options) passed the storyboard gate in three lessons
    (Shuttle S1 b12, the Opus run's b13, Relay's feedback-relay-sb b09): no option was marked and the screen said
    "Why not B?" while the narration said B. Every index prop now names the list it counts into."""
    with fresh_project() as p:
        _copy_plan(p)
        f = p.path("plan/storyboard.json")
        sb = read_json(f)
        q = next(s for s in sb["scenes"] if s.get("template") == "quiz.answer")
        n = len(q["props"]["options"])
        E0, _ = G.check_storyboard(p)
        assert not [e for e in E0 if "counts from 0" in e or "same item" in e], E0[:3]           # control: the demo's own quiz
        q["props"].update(answer=n, tempting=n - 1)                                                # one-based, as the runs wrote it
        write_json(f, sb)
        E, _ = G.check_storyboard(p)
        hit = [e for e in E if f"{q['beat']}: props.answer = {n} is not one of props.options" in e]
        assert hit and "counts from 0" in hit[0], E[:5]
        q["props"].update(answer=0, tempting=0)
        write_json(f, sb)
        E, _ = G.check_storyboard(p)
        assert any("props.tempting = 0 is the same item as props.answer" in e for e in E), E[:5]
    from loom.util import ENGINE_ROOT
    cat = read_json(ENGINE_ROOT / "runtime/catalog.json")
    sch = cat["templates"]["chart.bars"]["props"]
    assert G._props_errors(sch, {"series": [{"cat": "a", "value": 1, "say": "a"}, {"cat": "b", "value": 2, "say": "b"}], "highlight": 2})
    assert not [e for e in G._props_errors(sch, {"series": [{"cat": "a", "value": 1, "say": "a"}, {"cat": "b", "value": 2, "say": "b"}],
                                                   "highlight": 1}) if "counts from 0" in e]
    hub = cat["blueprints"]["hero.hub"]["props"]
    bad = G._props_errors(hub, {"hub": {"label": "Hub", "say": "hub"}, "satellites": [{"label": "A", "say": "a"}, {"label": "B", "say": "b"}],
                                "signals": [{"to": 2, "say": "b"}]})
    assert any("props.signals[0].to = 2" in e for e in bad), bad                                   # nested: counts into the root list
    return f"answer {n} of {n} refused (counts from 0), tempting = answer refused; chart highlight and hub signals checked"


OPUS = ROOT / "projects" / "feedback-shuttle-opus"


def pipeline_kit_preview_names_a_part_drawing_outside_its_parent():
    """A kit part draws only into the parent it is given (the kit contract); one that draws into the station instead
    cannot be held by a beat. The kit preview draws each part into its own parent and names a part that escapes it.
    Red: a copy of the Opus run's shipped kit whose name_tag also draws a mark into ctx.g; control: the shipped kit."""
    from loom.shuttle import kitpreview as KP
    if not (OPUS / "scenes/_kit.js").exists():
        return "skipped (the Opus run's kit is not in this folder)"
    shipped = (OPUS / "scenes/_kit.js").read_text(encoding="utf-8")
    escaped = shipped + """
(function () {
  var inner = Loom.lesson.name_tag;
  Loom.lesson.name_tag = function (ctx, parent, opts) {
    ctx.kit.rect(ctx.g, 10, 10, 40, 40, { fill: "surface" });
    return inner(ctx, parent, opts);
  };
})();
"""
    with fresh_project() as p:
        shutil.copy2(OPUS / "plan/storyboard.json", p.path("plan/storyboard.json"))
        good = KP.preview(p, shipped)
        if not good.get("image"):
            return f"skipped (no picture: {good.get('error') or good.get('static_errors')})"
        bad = KP.preview(p, escaped)
        out = [e for e in bad.get("errors") or [] if e.startswith("kit_part_outside_parent")]
        assert len(out) == 1 and "name_tag" in out[0], (bad.get("errors") or [])[:6]
        assert not [e for e in good.get("errors") or [] if e.startswith("kit_part_outside_parent")], good.get("errors")[:6]
    return "a part drawing into the station named (name_tag); the shipped kit: none"


def _opus_copy(scene_files: dict):
    """A scratch copy of the Opus lesson (plan, audio, the given scene files); never the lesson itself."""
    import tempfile
    from loom.project import Project
    root = Path(tempfile.mkdtemp(prefix="loom_pilot_")) / "pilot-probe"
    root.mkdir(parents=True)
    cfg = read_json(OPUS / "project.json")
    cfg["id"] = "pilot-probe"
    write_json(root / "project.json", cfg)
    write_json(root / "state.json", read_json(OPUS / "state.json"))
    for sub in ("plan", "audio", "media"):
        if (OPUS / sub).exists():
            shutil.copytree(OPUS / sub, root / sub)
    (root / "scenes").mkdir()
    for k in ("logs", "qa", "build", "renders"):
        (root / k).mkdir()
    for name, text in scene_files.items():
        (root / "scenes" / name).write_text(text, encoding="utf-8")
    return Project.open(str(root)), root.parent


def pipeline_pilot_check_catches_the_kit_that_cannot_carry_continuity():
    """L-319 on the run's own files: the first continue join (b02 into b03) with the first kit and the first b02 and b03
    (the 17:42 bundle) fails the pilot check, as the full check failed 85 minutes into P7 to P9 (9 overlaps in b03); the
    kit and the two beats the run shipped pass it. Two beats show what eleven showed."""
    from loom.shuttle import rails as RL
    from loom.shuttle.server import Server
    bundle = OPUS / "logs/versions/scenes/20261008T174225_accepted_3d11c343b8.bundle.json"
    if not bundle.exists():
        return "skipped (the Opus run's versions are not in this folder)"
    first = read_json(bundle)
    shipped = {n: (OPUS / "scenes" / n).read_text(encoding="utf-8") for n in ("_kit.js", "b02.js", "b03.js")}
    out = {}
    for label, files in (("first", {n: first[n] for n in ("_kit.js", "b02.js", "b03.js")}), ("shipped", shipped)):
        p, tmp = _opus_copy(files)
        try:
            rl = RL.Rails(p)
            assert rl.pilot_beats() == ["b02", "b03"], rl.pilot_beats()
            for rel in ("scenes/b02.js", "scenes/b03.js"):
                rl.mark_file(rel)
            r = Server(str(p.root)).t_pilot_check({"who": "lead"})
            if r.get("error") or "pass" not in r:
                return f"skipped (the check did not run: {str(r)[:200]})"
            out[label] = r
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
    assert out["first"]["pass"] is False and out["first"]["errors"], out["first"]
    assert out["shipped"]["pass"] is True, out["shipped"]["errors"][:5]
    # the verdict carries its picture: the failing moments (the measured run's lead was refused every look tool after
    # a failing pilot, 2026-10-09), whichever checker found them (HyperFrames' or Loom's, D-154)
    at = sorted({round(float(e.split(" @ ", 1)[1].split(":", 1)[0]), 2) for e in out["first"]["errors"] if " @ " in e})
    assert out["first"].get("image") and at and at[0] in [round(t, 2) for t in out["first"].get("frames_at") or []]         or out["first"].get("image_note"), {k: out["first"].get(k) for k in ("image", "frames_at", "image_note")}
    return f"first kit: {len(out['first']['errors'])} error(s) at the pilot join ({out['first']['errors'][0][:80]}); shipped: pass"


def agents_a_build_rewritten_mid_hash_does_not_stop_the_launcher():
    """L-350: the measured Shuttle run's launcher died with FileNotFoundError (build/runtime/ui_artefacts.js): its cost
    row asks the rails for the current phase, the rails hash the build, and a scene-author's compose in the server
    process was rewriting the build at that moment. The run's session went on with no cost log and no guards.
    build_hash skips a file that vanishes between the listing and the read; the launcher's phase lookup never raises."""
    import tempfile
    from pathlib import Path as _P
    from loom import qa as QA
    d = _P(tempfile.mkdtemp(prefix="loom_bh_")) / "build"
    (d / "runtime").mkdir(parents=True)
    for n in ("index.html", "runtime/a.js", "runtime/ui_artefacts.js"):
        (d / n).write_text(n, encoding="utf-8")
    gone = d / "runtime" / "ui_artefacts.js"
    real_read, real_stat = _P.read_bytes, _P.stat
    # what a skipped file must give: the hash of the same build without it (an empty build's hash is the wrong answer
    # an earlier version of this test accepted: the mutation check of 2026-10-09)
    QA._BUILD_HASHES.clear()
    full = QA.build_hash(d)
    keep = gone.read_bytes(); gone.unlink()
    QA._BUILD_HASHES.clear()
    without = QA.build_hash(d)
    gone.write_bytes(keep)
    empty = _P(tempfile.mkdtemp(prefix="loom_bh_empty_"))
    QA._BUILD_HASHES.clear()
    nothing = QA.build_hash(empty)
    assert len({full, without, nothing}) == 3, "control: the three builds hash alike, so nothing below can fail"

    def vanish_read(self):
        if self == gone:
            raise FileNotFoundError(2, "No such file or directory", str(self))
        return real_read(self)
    _P.read_bytes = vanish_read
    try:
        QA._BUILD_HASHES.clear()
        h = QA.build_hash(d)                                              # the file vanished after the listing
    finally:
        _P.read_bytes = real_read
    assert h == without, f"a file gone before its read: {h}, want the build without it {without}"

    for when in (1, 2):                                                   # gone at the listing's look, or at the stat after it
        calls = {"n": 0}

        def vanish_stat(self, *a, when=when, **k):
            if self == gone:
                calls["n"] += 1
                if calls["n"] >= when:
                    raise FileNotFoundError(2, "No such file or directory", str(self))
            return real_stat(self, *a, **k)
        _P.stat = vanish_stat
        try:
            QA._BUILD_HASHES.clear()
            h2 = QA.build_hash(d)
        finally:
            _P.stat = real_stat
        assert h2 == without, f"a file gone at stat call {when}: {h2}, want the build without it {without} (empty build: {nothing})"
    # a file another process holds open for writing (Windows answers PermissionError, which is_file() does not
    # swallow): the old whole-listing retry gave up after three tries and hashed an empty build
    def locked_stat(self, *a, **k):
        if self == gone:
            raise PermissionError(13, "The process cannot access the file because it is being used by another process", str(self))
        return real_stat(self, *a, **k)
    _P.stat = locked_stat
    try:
        QA._BUILD_HASHES.clear()
        h3 = QA.build_hash(d)
    finally:
        _P.stat = real_stat
    assert h3 == without, f"a locked file: {h3}, want the build without it {without} (empty build: {nothing})"
    QA._BUILD_HASHES.clear()
    from loom.shuttle import launch as LA
    with fresh_project() as p:
        s = LA.Stream(p, "subscription", "none", "P7-P9")
        s.rails.current = lambda: (_ for _ in ()).throw(FileNotFoundError("build/runtime/ui_artefacts.js"))
        assert s._phase() is None                                          # a cost row without a phase, not a dead launcher
    import shutil as _sh
    _sh.rmtree(d.parent, ignore_errors=True)
    return "a file vanishing mid-hash is skipped (read and stat); the launcher's phase lookup returns None instead of raising"


def agents_api_lookup_finds_an_api_name_that_is_not_a_heading():
    """Scene authors and fixers asked get_api_section for 'held', 'ctx.held', 'ctx.el' and 'exits' 12 times in the Opus run
    and again in the measured run, and were told there is no such section: the page documents them inside other sections
    (the ctx table, motion). The lookup now returns the section where the page uses the name, and says so."""
    from loom.agents import tools as T
    c = T.ToolContext(project=None, role="scene", stage="t")
    for name in ("held", "ctx.held", "ctx.el"):
        r = T.t_get_api_section(c, name)
        assert r.get("text") and "ctx.held" in r["text"] and r.get("found_by"), (name, r.get("section"), r.get("error"))
    assert T.t_get_api_section(c, "motion").get("found_by") is None                  # a heading still answers directly
    assert "error" in T.t_get_api_section(c, "no-such-api-term-xyz")
    return "held, ctx.held and ctx.el answered with the ctx section (said as found by use); headings unchanged; unknown refused"


def agents_a_finding_in_other_words_is_logged_not_lost():
    """21 report_finding calls were refused in the Shuttle Opus run and more in the measured run: 'detail' or 'summary'
    instead of 'what', severity 'medium' or 'low', no stage or route. They are mapped to the schema and logged (medium
    counts as major; an unknown route goes to a person; leftovers kept as evidence), and the reply says what was read how.
    Control: an empty finding is still refused."""
    import tempfile
    from loom.agents import tools as T
    from loom.project import Project
    with fresh_project() as p:
        c = T.ToolContext(project=p, role="fixer", stage="scenes")
        r = T.t_report_finding(c, {"detail": "the kit's wall_calendar draws its labels twice", "severity": "medium", "file": "scenes/_kit.js"})
        assert r.get("logged") and r.get("normalized"), r
        got = r["as_logged"]
        assert got["severity"] == "major" and got["fix_route"] == "human" and got["stage"] == "scenes" and "wall_calendar" in got["what"], got
        assert "file: scenes/_kit.js" in got.get("evidence", ""), got
        r2 = T.t_report_finding(c, {"what": "ok as sent", "severity": "minor", "stage": "scenes", "fix_route": "scene"})
        assert r2.get("logged") and not r2.get("normalized"), r2                        # a valid finding is untouched
        assert "error" in T.t_report_finding(c, {})
        rows = p.path("logs/findings.jsonl").read_text(encoding="utf-8").splitlines()
        assert len(rows) == 2
    return "detail/medium/no route logged as what/major/human with the file kept as evidence; a valid one untouched; empty refused"


def agents_skill_lookup_finds_a_style_guide_by_its_id_or_path():
    """The Shuttle Opus run's lead asked for the style guide 7 times ('story-cartoon', 'docs/styles/guides/story-cartoon.md')
    and was refused each time, spending a turn on its large context each; the measured run's lead did it again in its
    first minute (2026-10-09). Both names now find docs/styles/guides/<id>.md; a path outside docs/ and skills/ is not
    read; a name that is nothing is still refused, and the refusal says where guides are."""
    from loom.agents import tools as T
    c = T.ToolContext(project=None, role="lead", stage="t")
    for name in ("story-cartoon", "docs/styles/guides/story-cartoon.md", "docs\\styles\\guides\\story-cartoon"):
        r = T.t_list_skill_sections(c, name)
        assert r.get("sections"), (name, r)
    r = T.t_get_skill_section(c, "story-cartoon", (T.t_list_skill_sections(c, "story-cartoon")["sections"][0]).strip())
    assert r.get("text"), r
    for bad in ("no-such-thing", "../project.json", "loom/agents/tools"):
        r = T.t_list_skill_sections(c, bad)
        assert "error" in r and "style's guide by its id" in r["error"], (bad, r)
    return "story-cartoon found by id, by path and by a Windows path; unknown names and paths outside docs/ and skills/ refused"


def pipeline_render_resumes_once_after_a_capture_page_timeout():
    """L-364 (S0, 2026-10-09): Shuttle's render failed twice with "Navigation timeout of 60000 ms exceeded" when
    HyperFrames started a capture browser for a segment (segment 1 of 5, then 4 of 5); the same segment loaded on the
    next try. The render now resumes once (its kept segments are reused) with a 180 s page-load allowance. Control: any
    other failure is not retried and is raised as before."""
    from types import SimpleNamespace
    from loom import render as RD
    from loom.util import LoomError
    with fresh_project() as p:
        p.path("build").mkdir(exist_ok=True)
        p.path("build/index.html").write_text("<html></html>", encoding="utf-8")
        write_json(p.path("build/manifest.json"), {})
        calls = []
        script = {"runs": []}

        def fake_run(cmd, cwd=None, env=None, timeout=None, check=False):
            calls.append((list(cmd), dict(env or {})))
            out, ok = script["runs"].pop(0)
            if ok:
                p.path(f"renders/{p.id}.mp4").write_bytes(b"mp4")
            return SimpleNamespace(returncode=0 if ok else 1, stdout=out, stderr="")

        keep = {k: getattr(RD, k) for k in ("run", "hyperframes_cmd", "stamp_segments", "export_captions", "verify_render", "poster")}
        RD.run, RD.hyperframes_cmd, RD.stamp_segments = fake_run, (lambda: ["hf"]), (lambda b: "stamp")
        RD.export_captions, RD.poster = (lambda project: None), (lambda project, out, bake=False: None)
        RD.verify_render = lambda project, out: {"checked": 5, "mismatches": []}
        try:
            script["runs"] = [("  72%  Failed: Navigation timeout of 60000 ms exceeded", False), ("done", True)]
            RD.render(p, quality="draft")
            assert len(calls) == 2 and calls[0][0] == calls[1][0] and "--resume" in calls[1][0], calls
            assert calls[1][1].get("PRODUCER_PAGE_NAVIGATION_TIMEOUT_MS") == "180000" and "PRODUCER_PAGE_NAVIGATION_TIMEOUT_MS" not in calls[0][1]
            p.path(f"renders/{p.id}.mp4").unlink()
            calls.clear()
            script["runs"] = [("ffmpeg exited with code 1", False)]
            try:
                RD.render(p, quality="draft")
                raise AssertionError("another failure was swallowed")
            except LoomError as e:
                assert "ffmpeg exited" in str(e) and len(calls) == 1, (str(e)[:80], len(calls))
        finally:
            for k, v in keep.items():
                setattr(RD, k, v)
    return "a page-load timeout resumed the render once with a 180 s allowance; another failure raised at once"


def pipeline_a_beat_that_empties_a_held_element_is_an_error():
    """L-372 (feedback-shuttle-v3, 2026-10-09): b10 held b07's card, clock and people and removed what b07 had drawn in
    them at load, then drew its own: b07's animations ran on drawings no longer on screen and b10's copy (a vague
    bubble, a plain clock, a smiling face) showed in b07's time. The check passed it; the critic found it, and it cost
    three storyboard reopens. Now the runtime checks each beat's holds after its build: removing what the earlier beat
    drew is an error on the beat that did it (routed to its scene); hiding a held element at load is a warning (it does
    nothing on screen). Control: a beat that adds a child to the held element is clean."""
    from loom import flow, qa
    from loom.agents import router as RT
    if not browser():
        return "skipped (no browser here)"
    from shuttle_rails import _demo
    a = ('Loom.scene("b05", { build(ctx) { const E = ctx.el("box", { x: 700, y: 400, w: 520, h: 280, kind: "card", exit: "none" });\n'
         '  ctx.kit.rect(E.inner, 0, 0, 520, 280, { fill: "surface", r: 12 }); ctx.kit.text(E.inner, "first beat", { role: "body", x: 20, y: 20, w: 480, h: 240 });\n'
         '  ctx.m.reveal(E, ctx.start + 0.1); } });\n')
    bodies = {"empties": 'const b = ctx.held("box"); while (b.inner.firstChild) b.inner.removeChild(b.inner.firstChild);\n'
                         '  ctx.kit.rect(b.inner, 0, 0, 520, 280, { fill: "surface2", r: 12 });',
              "hides": 'const b = ctx.held("box"); b.outer.style.display = "none"; const c = ctx.el("box2", { x: 700, y: 400, w: 520, h: 280, kind: "card", exit: "none" });\n'
                       '  ctx.kit.rect(c.inner, 0, 0, 520, 280, { fill: "surface2", r: 12 }); ctx.m.reveal(c, ctx.start + 0.1);',
              "adds": 'const b = ctx.held("box"); const g = Loom.svg("g", { opacity: 0 }, b.inner);\n'
                      '  ctx.kit.rect(g, 20, 200, 480, 60, { fill: "accent", r: 8 }); Loom.tween(g, { opacity: 0 }, { opacity: 1, duration: 0.4 }, ctx.start + 0.3);'}
    got = {}
    for mode, body in bodies.items():
        with fresh_project() as p:
            _demo(p)
            sb = read_json(p.path("plan/storyboard.json"))
            by = {s["beat"]: s for s in sb["scenes"]}
            b06 = by["b06"]
            for k in ("template", "props", "blueprint", "manim", "clip", "params"):
                b06.pop(k, None)
            b06.update(kind="bespoke", scene="b06", station=by["b05"]["station"], keep=["box"], join_in={"type": "continue"})
            write_json(p.path("plan/storyboard.json"), sb)
            p.path("scenes/b05.js").write_text(a, encoding="utf-8")
            p.path("scenes/b06.js").write_text('Loom.scene("b06", { build(ctx) { ' + body + " } });\n", encoding="utf-8")
            flow.run_code(p, "compose", strict=False, mix=False, manim_quality="draft")
            rep = qa.probe(p)
            got[mode] = ([(e.get("code"), e.get("beat")) for e in rep.get("errors") or [] if str(e.get("code", "")).startswith("held_")],
                         [(w.get("code"), w.get("beat")) for w in rep.get("warnings") or [] if str(w.get("code", "")).startswith("held_")])
    assert got["empties"][0] == [("held_content_removed", "b06")], got
    assert got["hides"] == ([], [("held_hidden_at_load", "b06")]), got
    assert got["adds"] == ([], []), got
    assert RT.owner_of("held_content_removed", "b06", {"b06": {"kind": "bespoke"}}) == "scene"
    return "emptying a held element: an error on b06, routed to its scene; hiding at load: a warning; adding a child: clean"


def pipeline_render_verification_runs_in_parallel_and_says_what_was_slow():
    """L-375: feedback-shuttle-v3's 55 frame comparisons took 38 minutes one after another (the MP4 at 20:23, the report at
    21:01). They now run four at a time, in frame order, and the report gives the total and the slowest steps. On a real
    encode: matching frames pass, a frame whose preview has a missing part is a mismatch, every frame is checked."""
    import subprocess as SP
    from PIL import Image, ImageDraw
    from loom import render as RD
    from loom.util import which
    ff = which("ffmpeg")
    if not ff:
        return "skipped (no ffmpeg here)"
    with fresh_project() as p:
        fr = p.path("qa/frames"); fr.mkdir(parents=True, exist_ok=True)
        mp4 = p.path("renders/test.mp4"); mp4.parent.mkdir(exist_ok=True)
        SP.run([ff, "-v", "error", "-y", "-f", "lavfi", "-i", "color=c=0x808080:s=1920x1080:d=4", "-r", "30", "-pix_fmt", "yuv420p", str(mp4)], check=True)
        for t in (0.5, 1.5, 2.5, 3.5):
            im = Image.new("RGB", (1920, 1080), (128, 128, 128))
            if t == 2.5:
                ImageDraw.Draw(im).rectangle([400, 300, 900, 700], fill=(255, 255, 255))   # a part the encode does not have
            im.save(fr / f"{t:.3f}.png")
        v = RD.verify_render(p, mp4)
    assert v["checked"] == 4 and v["of"] == 4, v
    assert [m["t"] for m in v["mismatches"]] == [2.5], v
    assert isinstance(v.get("seconds"), float) and len(v.get("slowest") or []) == 3, v
    return f"4 frames checked in {v['seconds']} s, the one with a missing part flagged, the slowest steps reported"
