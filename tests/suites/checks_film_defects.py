"""Check and render defects from the five bench videos (2026-10-07): what the checks could not see, and how a failed
check still became an MP4. Each new check is run on a fixture WITH the defect (it must report it) and WITHOUT it (it
must stay quiet); a measure that measured nothing is red, never a pass.

  foreign pixels   another beat's picture on screen at a beat's settled moment (tools/node/probe.mjs, film.py)
  off frame        a beat's own element more than 15 % outside the frame, a wholly-off word, a cropped figure;
                   an empty station <svg> is not paint (it made every word "occluded" and the count 0)
  blurred beat     the beat's own words blurred (Laplacian), never excused by a hold or rest intent
  records          every element carries its life window (lifeT)
  segments         a render's resumable segments carry the build hash; another build's segments are dropped
  verification     a render that disagrees with its checked build at more than 10 % of frames fails; 0 compared fails
  force            render --force needs --reason and the checked build, and is refused on a thrown scene
  overrides        mark_done over a rejection is logged in the decision ledger
  captions         the style lint measures the caption pill (active 4.5:1, text 7:1)
  ledger kinds     words cut, off frame, foreign pixels and blur have their own kinds (not "other")
  film audit       preshown and exit-none elements, foreign and blur measures, zero denominators
  blank beat       none of a beat's own elements seen in the frame while the voice speaks (B4, 2026-10-08)
  held             the film audit's lingering follows keep in any case and ctx.held (B5, 2026-10-08)

The two browser tests skip by name without a Chrome.
"""
from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ENGINE = Path(__file__).resolve().parents[2]
if str(ENGINE) not in sys.path:
    sys.path.insert(0, str(ENGINE))
_SKIP = "skipped: no Chrome here (set HYPERFRAMES_BROWSER_PATH, or let HyperFrames install its browser)"


def _rt():
    """the runtime suite's lesson builder (one inline lesson page on the real runtime)"""
    import importlib.util
    spec = importlib.util.spec_from_file_location("rtfd_helpers_for_checks", ENGINE / "tests" / "suites" / "runtime_film_defects.py")
    m = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(m)
    return m


def _probe(page_dir: Path, browser: str) -> dict:
    out = page_dir / "probe.json"
    r = subprocess.run(["node", str(ENGINE / "tools" / "node" / "probe.mjs"), str(page_dir / "index.html"), str(out)],
                       capture_output=True, text=True, timeout=400, cwd=str(ENGINE), env=dict(os.environ, HYPERFRAMES_BROWSER_PATH=browser))
    assert r.returncode == 0 and out.exists(), f"probe failed: {r.stderr[-800:]}"
    return json.loads(out.read_text(encoding="utf-8"))


# ------------------------------------------------------------------ foreign pixels (pure)
def check_foreign_pixels_report_other_beats_and_never_pass_blind():
    """film.foreign_checks: 697 px of another beat at the settled moment is an error naming it; 129 px (anti-aliasing at
    held edges, the bench's clean beats) is not; a declared ghost is a warning; a probe with no foreign rows says
    "not measured" and a pass is never claimed; rows for fewer beats than the lesson has is an error"""
    from loom.checks import film as F
    man = {"beats": [{"id": "b01"}, {"id": "b02"}]}
    bad = {"foreign": [{"beat": "b01", "t": 2.0, "px": 697, "by": {"b52": 690}, "box": [0, 0, 10, 10]}, {"beat": "b02", "t": 6.0, "px": 0}]}
    E, W, S = F.foreign_checks(bad, None, {"scenes": []}, man)
    assert len(E) == 1 and "b01" in E[0] and "b52" in E[0] and S["foreign_beats"] == ["b01"], (E, S)
    ok = {"foreign": [{"beat": "b01", "t": 2.0, "px": 129}, {"beat": "b02", "t": 6.0, "px": 0}]}
    assert F.foreign_checks(ok, None, {"scenes": []}, man)[0] == [], "control: anti-aliasing at held edges is not a foreign picture"
    ghost = F.foreign_checks(bad, None, {"scenes": [{"beat": "b01", "intent": "ghost"}]}, man)
    assert not ghost[0] and any("declared ghost" in w for w in ghost[1]), ghost
    blind = F.foreign_checks({}, None, {"scenes": []}, man)
    assert not blind[0] and blind[2]["measured_beats"] == 0 and any("not measured" in w for w in blind[1]), blind
    part = F.foreign_checks({"foreign": bad["foreign"][:1]}, None, {"scenes": []}, man)
    assert any("1 beat(s) of 2" in e for e in part[0]), part
    return "697 px named; 129 px quiet; ghost warns; unmeasured and partial never pass"


# ------------------------------------------------------------------ off frame and the blind spots (pure)
def check_off_frame_rows_are_errors_ratcheted_for_old_lessons_and_a_blind_measure_is_red():
    """film.screen_text_checks: an own element 40 % off frame, a wholly-off word and a figure cropped at the top are
    errors; a held element off frame is a warning; a lesson recorded in film_offframe_baseline.json keeps its known
    beats as warnings and fails on any new one; 0 visible lines while the lesson draws text is a blind measure (red)"""
    from loom.checks import film as F
    rows = [{"beat": "b01", "t": 2.0, "n": 3, "small": [], "cut": [],
             "off": [{"off": True, "name": "card", "kind": "card", "share": 0.4, "words": 0}],
             "off_text": [{"offText": True, "text": "Gone entirely", "rect": [2100, 200, 2400, 260]}], "held_off": []},
            {"beat": "b02", "t": 6.0, "n": 2, "small": [], "cut": [], "off": [{"off": True, "name": "ava", "kind": "character", "share": 0.1,
             "crop": {"top": 120, "side": 0}, "words": 0}], "off_text": [], "held_off": [{"off": True, "held": True, "name": "page", "kind": "document", "share": 0.3}]},
            {"beat": "b03", "t": 9.0, "n": 4, "small": [], "cut": [], "off": [], "off_text": [], "held_off": []}]
    pr = {"screen_text": rows, "texts": [{"beat": "b01", "text": "x"}]}
    E, W, S = F.screen_text_checks(pr, None, {"scenes": []}, lesson="no-such-lesson")
    assert any(e.startswith("b01: off frame") and "40% outside" in e and "Gone entirely" in e for e in E), E
    assert any(e.startswith("b02: off frame") and "cropped 120 px at the top" in e for e in E), E
    assert not any(e.startswith("b03") for e in E), "control: a beat inside the frame"
    assert any("held element is off frame" in w for w in W), W
    old = F.offframe_baseline
    F.offframe_baseline = lambda: {"known-lesson": ["b01"]}
    try:
        E2, W2, _ = F.screen_text_checks(pr, None, {"scenes": []}, lesson="known-lesson")
    finally:
        F.offframe_baseline = old
    assert not any(e.startswith("b01") for e in E2) and any(w.startswith("b01") and "known before" in w for w in W2), (E2, W2)
    assert any(e.startswith("b02") and "new since the baseline" in e for e in E2), E2
    blind = {"screen_text": [{"beat": "b01", "t": 2.0, "n": 0, "small": [], "cut": []}], "texts": [{"beat": "b01", "text": "words"}]}
    assert any("measure is blind" in e for e in F.screen_text_checks(blind, None, {"scenes": []})[0]), "a zero denominator must be red"
    return "own off-frame and figure crop are errors; held warns; baseline ratchets; blind measure red"


# ------------------------------------------------------------------ blur (pure)
def _text_png(path: Path, blur: float = 0.0):
    from PIL import Image, ImageDraw, ImageFilter, ImageFont
    im = Image.new("RGB", (1920, 1080), (240, 236, 228))
    d = ImageDraw.Draw(im)
    try:
        font = ImageFont.load_default(size=64)
    except TypeError:   # an older Pillow: the small bitmap font
        font = ImageFont.load_default()
    d.text((300, 400), "Feedback that lands on the behaviour", fill=(30, 28, 26), font=font)
    if blur:
        im = im.filter(ImageFilter.GaussianBlur(blur))
    im.save(path)
    return [[290, 390, 1500, 480]]


def check_blurred_beat_is_measured_on_its_own_words_and_never_excused():
    """film.frame_checks: a beat whose own words are blurred (a 9 px backplate blur, here a Gaussian of 4.5) is the
    blurred_beat ERROR even with intent hold, and is not misreported as an empty frame; the same words crisp pass"""
    from loom.checks import film as F
    d = Path(tempfile.mkdtemp(prefix="lm_blur_"))
    try:
        boxes = _text_png(d / "sharp.png")
        _text_png(d / "blur.png", 4.5)
        s1, s2 = F.sharpness(d / "sharp.png", boxes), F.sharpness(d / "blur.png", boxes)
        assert s1 and s2 and s1["norm"] > 0.5 > 0.3 > s2["norm"], (s1, s2)
        man = {"beats": [{"id": "b01", "speech_start": 0.0, "speech_end": 4.0}], "scenes": []}
        pr = {"screen_text": [{"beat": "b01", "t": 3.8, "n": 1, "boxes": boxes}]}
        for intent in ("hold", "rest", None):
            sb = {"scenes": [{"beat": "b01", "intent": intent}]}
            E, W, S = F.frame_checks(man, {3.5: d / "blur.png"}, sb, None, probe_rep=pr)
            assert any("blurred_beat" in e for e in E), (intent, E)
            assert not any("empty frame" in e for e in E), f"a blurred beat is not an empty one ({intent}): {E}"
            assert S["blurred_beats"] == ["b01"] and S["blur_measured"] == 1, S
        E, W, S = F.frame_checks(man, {3.5: d / "sharp.png"}, {"scenes": []}, None, probe_rep=pr)
        assert not any("blurred_beat" in e for e in E) and S["blur_measured"] == 1, (E, S)
        return f"sharp {s1['norm']}, blurred {s2['norm']}; blurred under hold, rest and none; sharp passes"
    finally:
        shutil.rmtree(d, ignore_errors=True)


# ------------------------------------------------------------------ element records (pure)
def check_every_element_has_a_life_window():
    """film.record_checks: an element without lifeT (not motif, presenter or scenery) is an error; a runtime with no
    life windows at all says it was not checked (never a pass); 0 elements is red"""
    from loom.checks import film as F
    ok = {"elements": [{"beat": "b1", "name": "a", "kind": "card", "lifeT": [0, 4]}, {"beat": "b1", "name": "m", "kind": "motif"}]}
    assert F.record_checks(ok) == ([], [], {"elements": 2, "without_life": 0, "no_entrance_words": 0}), F.record_checks(ok)
    bad = {"elements": ok["elements"] + [{"beat": "b2", "name": "stuck", "kind": "card", "lifeT": None}]}
    assert any("1 of 3" in e and "b2/stuck" in e for e in F.record_checks(bad)[0]), F.record_checks(bad)
    old = {"elements": [{"beat": "b1", "name": "a", "kind": "card"}]}
    assert not F.record_checks(old)[0] and "not checked" in F.record_checks(old)[1][0]
    assert F.record_checks({"elements": []})[0], "zero elements is a broken build or probe, never a pass"
    return "missing lifeT named; old runtime said; zero red"


# ------------------------------------------------------------------ render integrity (pure)
def check_render_segments_carry_the_build_hash_and_stale_ones_are_dropped():
    """render.stamp_segments: segments made from another build (the stamp differs, or none) are deleted before a
    render; segments of the same build are kept; changing a runtime file changes the hash (it is part of the build)"""
    from loom.render import stamp_segments
    from loom.qa import build_hash
    b = Path(tempfile.mkdtemp(prefix="lm_seg_"))
    try:
        (b / "runtime").mkdir()
        (b / "index.html").write_text("<html></html>", encoding="utf-8")
        (b / "runtime" / "world.js").write_text("// v1", encoding="utf-8")
        seg = b / "renders" / ".hf-segments" / "plan1"
        seg.mkdir(parents=True)
        (seg / "segment_00000.mp4").write_bytes(b"old build")
        h1 = stamp_segments(b)
        assert not (seg / "segment_00000.mp4").exists(), "unstamped segments must be dropped"
        seg.mkdir(parents=True, exist_ok=True)
        (seg / "segment_00000.mp4").write_bytes(b"this build")
        assert stamp_segments(b) == h1 and (seg / "segment_00000.mp4").exists(), "control: the same build keeps its segments"
        (b / "runtime" / "world.js").write_text("// v2", encoding="utf-8")
        h2 = stamp_segments(b)
        assert h2 != h1 and not (seg / "segment_00000.mp4").exists(), "a runtime change must invalidate the segments"
        assert build_hash(b) == h2, "the stamp itself must not change the build hash"
        return f"{h1} -> {h2}: stale segments dropped, same build kept"
    finally:
        shutil.rmtree(b, ignore_errors=True)


def check_render_verification_fails_above_ten_percent_and_on_zero():
    """render.verify_failure: 2 mismatches in 10 sampled frames (20 %) fails the render; 1 in 10 does not; comparing
    0 frames is not a pass"""
    from loom.render import verify_failure
    assert verify_failure({"checked": 10, "mismatches": [{}, {}]}), "20 % must fail"
    assert verify_failure({"checked": 10, "mismatches": [{}]}) is None, "control: 10 % is allowed"
    assert verify_failure({"checked": 0, "mismatches": [], "note": "no preview frames"}), "a zero is not a pass"
    return "20 % fails, 10 % passes, 0 compared fails"


def _tmp_project():
    """a throwaway copy of the demo project's plan (never the real project)"""
    from loom.project import Project
    demo = ENGINE / "projects" / "spacing-sticks"
    d = Path(tempfile.mkdtemp(prefix="lm_chk_"))
    for f in ("project.json", "state.json"):
        shutil.copy2(demo / f, d / f)
    shutil.copytree(demo / "plan", d / "plan")
    for sub in ("qa", "build", "logs"):
        (d / sub).mkdir(exist_ok=True)
    return Project(d)


def check_render_force_needs_a_reason_the_checked_build_and_no_thrown_scene():
    """flow.force_render_allowed: --force without --reason, without a check report, on a build changed since its check,
    or with a scene_threw / tween_threw error is refused; a reasoned force on the checked build is allowed and logged
    with the error count and the build hash"""
    from loom import flow, ledger
    from loom.qa import build_hash
    from loom.util import LoomError, write_json
    p = _tmp_project()
    try:
        (p.path("build") / "index.html").write_text("<html>v1</html>", encoding="utf-8")
        h = build_hash(p.path("build"))

        def refused(reason, rep, needle):
            if rep is None:
                p.path("qa/report.json").unlink(missing_ok=True)
            else:
                write_json(p.path("qa/report.json"), rep)
            try:
                flow.force_render_allowed(p, reason, "rejected")
            except LoomError as e:
                assert needle in str(e), (needle, str(e))
                return True
            raise AssertionError(f"not refused: {needle}")
        refused("", {"errors": ["b01: x"], "build_hash": h}, "--reason")
        refused("proof", None, "no check report")
        refused("proof", {"errors": ["b01: x"], "build_hash": "0000"}, "changed after its check")
        refused("proof", {"errors": ["runtime scene_threw: b03: boom"], "build_hash": h}, "threw")
        refused("proof", {"errors": ["runtime tween_threw: b04: boom"], "build_hash": h}, "threw")
        write_json(p.path("qa/report.json"), {"errors": ["b01: words cut by the frame edge at 2.0s", "b02: off frame at 3.0s"], "build_hash": h})
        assert flow.force_render_allowed(p, "post-fix proof", "rejected") is True
        rec = [r for r in ledger.read(p) if r.get("event") == "override" and r.get("decision") == "force_render"]
        assert rec and rec[-1]["data"]["errors"] == 2 and rec[-1]["data"]["build_hash"] == h and rec[-1]["why"] == "post-fix proof", rec
        assert set(rec[-1]["data"]["kinds"]) == {"words_cut", "off_frame"}, rec[-1]["data"]
        return "no reason, no report, changed build, scene_threw and tween_threw refused; a reasoned force is logged"
    finally:
        shutil.rmtree(p.root, ignore_errors=True)


def check_mark_done_over_a_rejection_is_logged():
    """flow.mark_done on a REJECTED stage by hand is an override in the decision ledger (with its reason and the error
    count); the engine's own mark_done after a pass is not"""
    from loom import flow, ledger
    p = _tmp_project()
    try:
        p.set_stage("pedagogy", status="rejected", errors=["pacing.target_duration_s is 480s but the request asks for about 120s"])
        flow.mark_done(p, "pedagogy", reason="requester: fine with any length")
        rec = [r for r in ledger.read(p) if r.get("event") == "override" and r.get("decision") == "mark_done"]
        assert len(rec) == 1 and rec[0]["node"] == "pedagogy" and rec[0]["data"]["errors"] == 1 and "fine with any length" in rec[0]["why"], rec
        p.set_stage("script", status="rejected", errors=["x"])
        flow.mark_done(p, "script", passed=True)
        flow.mark_done(p, "brief")      # pending, not rejected: nothing overridden
        rec2 = [r for r in ledger.read(p) if r.get("event") == "override"]
        assert len(rec2) == 1, f"control: a pass or a non-rejected stage is not an override: {rec2}"
        return "override logged once, with reason and error count"
    finally:
        shutil.rmtree(p.root, ignore_errors=True)


# ------------------------------------------------------------------ captions (pure)
def check_style_lint_measures_the_caption_pill():
    """style_lint: the active caption word under 4.5:1 or the caption text under 7:1 against the pill composited over
    the field is an error (story-cartoon's old accent2 was 2.03:1); every shipped pack passes now"""
    from loom.checks.style_lint import caption_ratios, lint_all, lint_style
    from loom.util import read_json
    pk = read_json(ENGINE / "packs" / "styles" / "story-cartoon.json")
    old = json.loads(json.dumps(pk))
    old["captions"]["active"] = "accent2"
    assert any("captions.active" in e and "2.0" in e for e in lint_style(old)), lint_style(old)
    dim = json.loads(json.dumps(pk))
    dim["captions"]["fg"] = "muted"
    assert any("captions.fg" in e for e in lint_style(dim)), lint_style(dim)
    bad = {k: v for k, v in lint_all().items() if v}
    assert not bad, bad
    rows = []
    for f in sorted((ENGINE / "packs" / "styles").glob("*.json")):
        cr = caption_ratios(read_json(f))
        rows.append(f"{f.stem} {cr['active_ratio']:.2f}/{cr['fg_ratio']:.2f}")
    return "; ".join(rows)


# ------------------------------------------------------------------ ledger kinds (pure)
def check_ledger_gives_film_defects_their_own_kinds():
    """ledger._kind_of: words cut, off frame, foreign pixels, blurred beat, empty frame, element records and blank beat
    (B4) each have a kind (they all fell in "other")"""
    from loom.ledger import _kind_of
    cases = {"b05: words cut by the frame edge at 2.0s: \"x\"": "words_cut",
             "b05: off frame at 3.0s: card 'x' 40% outside the frame": "off_frame",
             "b07: foreign pixels at 4.0s: 900 px of other beats": "foreign_pixels",
             "b08: blurred_beat: the beat's own words are blurred": "blurred_beat",
             "b09: empty frame for 3 sampled moment(s)": "empty_frame",
             "element records: 2 of 9 element(s) have no life window": "element_records",
             "b13: blank beat at 107.4s: none of its 3 own element(s) is seen in the frame": "blank_beat",
             "blank-beat measure: 0 of 3 beats measured although the probe saw 4 of the beats' own words": "blank_beat_blind"}
    got = {m: _kind_of(m) for m in cases}
    assert got == cases, got
    assert _kind_of("something nobody names") == "other", "control"
    return f"{len(cases)} kinds"


# ------------------------------------------------------------------ the film audit (pure)
def check_film_audit_reports_preshown_exit_none_foreign_blur_and_zero_denominators():
    """tools/film_audit.py on a fixture lesson: an element with no entrance (not scenery) is preshown, an unkept
    exit-none element is listed, foreign pixels and blur come from the probe and check reports with their
    denominators, and a lesson with no elements reports a zero denominator (the CLI exits 2)"""
    sys.path.insert(0, str(ENGINE / "tools"))
    import importlib
    FA = importlib.import_module("film_audit")
    from PIL import Image
    d = Path(tempfile.mkdtemp(prefix="lm_audit_")) / "fixture-lesson"
    try:
        for sub in ("audio", "qa", "plan", "renders"):
            (d / sub).mkdir(parents=True)
        (d / "project.json").write_text(json.dumps({"id": "fixture-lesson", "request": {"length_min": 1}}), encoding="utf-8")
        beats = [{"id": "b01", "start": 0, "end": 4, "speech_start": 0.5, "speech_end": 3.5, "phrases": [{"text": "one two three"}]},
                 {"id": "b02", "start": 4, "end": 8, "speech_start": 4.5, "speech_end": 7.5, "phrases": [{"text": "four five"}]}]
        (d / "audio" / "timings.json").write_text(json.dumps({"beats": beats}), encoding="utf-8")
        els = [{"beat": "b01", "name": "card", "kind": "card", "revealT": None, "exitT": 3.7, "exitKind": "recede", "lifeT": [0, 4.1]},
               {"beat": "b01", "name": "set", "kind": "scenery", "revealT": None, "exitT": 3.7, "exitKind": "recede", "lifeT": [0, 4.1]},
               {"beat": "b01", "name": "panel", "kind": "panel", "revealT": 0.6, "exitT": 3.7, "exitKind": "none", "lifeT": [0, 4.1]},
               {"beat": "b02", "name": "x", "kind": "card", "revealT": 4.6, "exitT": 7.7, "exitKind": "recede", "lifeT": [4, 8]}]
        probe = {"elements": els, "foreign": [{"beat": "b01", "px": 0}, {"beat": "b02", "px": 1200}]}
        (d / "qa" / "probe.json").write_text(json.dumps(probe), encoding="utf-8")
        (d / "plan" / "storyboard.json").write_text(json.dumps({"scenes": [{"beat": "b01", "kind": "bespoke"}, {"beat": "b02", "kind": "bespoke"}]}), encoding="utf-8")
        (d / "qa" / "report.json").write_text(json.dumps({"errors": ["b02: foreign pixels at 6.0s: 1200 px"], "stats": {"film": {"blurred_beats": ["b02"], "blur_measured": 2}}}), encoding="utf-8")
        fr = d / "frames"; fr.mkdir()
        for i in range(16):
            Image.new("RGB", (320, 180), (240, 236, 228) if i % 2 else (20, 20, 20)).save(fr / f"{i:05d}.png")
        out = FA.audit(str(d), fr)
        assert [e["name"] for e in out["preshown"]] == ["card"], out["preshown"]
        assert [e["name"] for e in out["exit_none"]] == ["panel"], out["exit_none"]
        assert out["foreign"] == {"beats": ["b02"], "of": 2, "max_px": 1200}, out["foreign"]
        assert out["blurred"] == {"beats": ["b02"], "of": 2}, out["blurred"]
        assert out["check_errors"] == {"foreign_pixels": 1} and out["elements_with_life"] == 4 and not out.get("zero_denominators"), out
        probe["elements"] = []
        (d / "qa" / "probe.json").write_text(json.dumps(probe), encoding="utf-8")
        assert FA.audit(str(d), fr).get("zero_denominators") == ["elements"], "zero elements must be reported"
        return "preshown, exit-none, foreign, blur and kinds reported; zero denominator named"
    finally:
        shutil.rmtree(d.parent, ignore_errors=True)


# ------------------------------------------------------------------ the probe itself, on built lessons (browser)
_FOREIGN_JS = r"""
Loom.scene("b1", { build(ctx) {
  const A = ctx.el("A", { x: 100, y: 100, w: 400, h: 300, kind: "card" });
  ctx.kit.rect(A.inner, 0, 0, 400, 300, { fill: "accent", r: 8 }); ctx.m.reveal(A, ctx.start + 0.2);
  %(raw)s
} });
Loom.scene("b2", { build(ctx) {
  const B = ctx.el("B", { x: 100, y: 600, w: 400, h: 200, kind: "card" });
  ctx.kit.rect(B.inner, 0, 0, 400, 200, { fill: "accent2", r: 8 }); ctx.m.reveal(B, ctx.start + 0.2);
  // NOT foreign: b2 holds A and builds its own element beside it, inside b1's group (feedback b24, phishing b05 do this)
  const A = ctx.held("A");
  const N = ctx.el("note", { x: 600, y: 100, w: 300, h: 300, kind: "card" });
  ctx.kit.rect(N.inner, 0, 0, 300, 300, { fill: "accent3", r: 8 }); A.outer.parentNode.insertBefore(N.outer, A.outer.nextSibling);
  ctx.m.reveal(N, ctx.start + 0.2);
} });
"""
# the defect: shapes drawn straight into the scene group (no element), so nothing ever exits or gates them
_RAW_STUCK = 'Loom.svg("rect", { x: 1200, y: 100, width: 500, height: 400, fill: Loom.style.c("ink") }, ctx.g);'
_RAW_OWNED = 'const R = ctx.el("R", { x: 1200, y: 100, w: 500, h: 400, kind: "card" }); ctx.kit.rect(R.inner, 0, 0, 500, 400, { fill: "ink" }); ctx.m.reveal(R, ctx.start + 0.2);'


def check_probe_measures_foreign_pixels_on_a_built_lesson():
    """tools/node/probe.mjs on two built lessons: shapes b1 drew straight into its scene group (never exited, never
    gated) give b2 more than 300 foreign px named as b1's, and film.foreign_checks fails it; the same shapes drawn as an
    element leave b2 clean. Every beat is measured"""
    rt = _rt()
    br = rt._browser()
    if not br:
        return _SKIP
    from loom.checks import film as F
    out = {}
    for name, raw in (("stuck", _RAW_STUCK), ("owned", _RAW_OWNED)):
        page = rt._lesson(_FOREIGN_JS % {"raw": raw}, [{"kind": "bespoke"}, {"kind": "bespoke"}], rt._ONE, 2)
        try:
            out[name] = _probe(page, br)
        finally:
            shutil.rmtree(page, ignore_errors=True)
    rows = {r["beat"]: r for r in out["stuck"].get("foreign") or []}
    assert set(rows) == {"b1", "b2"}, f"every beat measured: {out['stuck'].get('foreign_error') or rows}"
    # the stuck shapes are 500 x 400 = 200000 px; b2's own note inside b1's group must not add to them
    assert rows["b2"]["px"] <= 200000 + 300, f"b2's own element built in b1's group was counted as foreign: {rows['b2']}"
    assert rows["b2"]["px"] > 300 and "b1" in (rows["b2"].get("by") or {}), rows["b2"]
    E, _, _ = F.foreign_checks(out["stuck"], None, {"scenes": []}, {"beats": [{"id": "b1"}, {"id": "b2"}]})
    assert any(e.startswith("b2: foreign pixels") for e in E), E
    clean = {r["beat"]: r for r in out["owned"].get("foreign") or []}
    assert set(clean) == {"b1", "b2"} and all(r["px"] <= 300 for r in clean.values()), \
        f"control: shapes drawn as an element, and b2's note built inside b1's group, are not foreign: {clean}"
    return f"stuck: b2 {rows['b2']['px']} px from b1; owned (with b2 building inside b1's group): {max(r['px'] for r in clean.values())} px"


_OFF_JS = r"""
Loom.scene("b1", { build(ctx) {
  const C = ctx.el("card", { x: 1500, y: 300, w: 800, h: 240, kind: "card" });                 // half outside the right edge
  ctx.kit.rect(C.inner, 0, 0, 800, 240, { fill: "surface", r: 12 });
  ctx.kit.text(C.inner, "Words near the edge", { role: "lead", x: 30, y: 0, w: 360, h: 240, maxLines: 1, valign: "middle" });
  ctx.m.reveal(C, ctx.start + 0.2);
  const G = ctx.el("gone", { x: 2100, y: 700, w: 500, h: 100, kind: "text" });                  // wholly off the frame
  ctx.kit.text(G.inner, "Gone entirely", { role: "lead", x: 0, y: 0, w: 500, h: 100, maxLines: 1 }); ctx.m.reveal(G, ctx.start + 0.2);
} });
Loom.scene("b2", { build(ctx) {
  const C = ctx.el("card2", { x: 300, y: 300, w: 800, h: 240, kind: "card" });
  ctx.kit.rect(C.inner, 0, 0, 800, 240, { fill: "surface", r: 12 });
  ctx.kit.text(C.inner, "Words in the frame", { role: "lead", x: 30, y: 0, w: 700, h: 240, maxLines: 1, valign: "middle" });
  ctx.m.reveal(C, ctx.start + 0.2);
  // NOT off frame: a card that flies out on its own motion (an exit), and a lens whose big copy is cut by its clip
  const F = ctx.el("flyer", { x: 1300, y: 650, w: 300, h: 120, kind: "card" });
  ctx.kit.rect(F.inner, 0, 0, 300, 120, { fill: "accent", r: 10 });
  ctx.kit.text(F.inner, "Sent away", { role: "lead", x: 20, y: 0, w: 260, h: 120, maxLines: 1, valign: "middle" });
  ctx.m.reveal(F, ctx.start + 0.2);
  Loom.tween(F.mover, { x: 0, y: 0 }, { x: 1400, y: -900, duration: 0.8, ease: Loom.ease.move }, ctx.start + 1.0, { kind: "travel", beat: ctx.beat.id, name: "flyer" });
  const L = ctx.el("lens", { x: 1500, y: 100, w: 300, h: 300, kind: "magnify" });
  const defs = Loom.svg("defs", {}, L.inner), cid = Loom.uid("lensclip");
  Loom.svg("circle", { cx: 150, cy: 150, r: 140 }, Loom.svg("clipPath", { id: cid, clipPathUnits: "userSpaceOnUse" }, defs));
  const view = Loom.svg("g", { "clip-path": `url(#${cid})` }, L.inner);
  Loom.svg("rect", { x: -600, y: -600, width: 2400, height: 1600, fill: Loom.style.c("accent2") }, view);   // a scaled copy, mostly clipped
  ctx.m.reveal(L, ctx.start + 0.2);
} });
Loom.scene("b3", { build(ctx) { const id = Object.keys(Loom.rig.defs)[0];
  const H = ctx.character("tall", id, { x: 960, y: 420, scale: 1 }); ctx.m.reveal(H, ctx.start + 0.2); } });
"""


def check_probe_measures_off_frame_elements_words_and_figures():
    """tools/node/probe.mjs on a built lesson: b1's own card (half outside) and its wholly-off word are reported and
    fail screen_text_checks; b3's figure cropped at the top is reported; b2 inside the frame is clean (control) and its
    words are SEEN (n > 0: the empty station <svg> no longer counts as paint over them)"""
    rt = _rt()
    br = rt._browser()
    if not br:
        return _SKIP
    from loom.checks import film as F
    page = rt._lesson(_OFF_JS, [{"kind": "bespoke"}, {"kind": "bespoke"}, {"kind": "bespoke"}], rt._ONE, 3)
    try:
        pr = _probe(page, br)
    finally:
        shutil.rmtree(page, ignore_errors=True)
    rows = {r["beat"]: r for r in pr.get("screen_text") or []}
    assert set(rows) == {"b1", "b2", "b3"}, pr.get("screen_text_error") or rows
    b1, b2, b3 = rows["b1"], rows["b2"], rows["b3"]
    assert any(o["name"] == "card" and o["share"] > 0.15 for o in b1.get("off") or []), b1
    assert any("Gone" in o["text"] for o in b1.get("off_text") or []), b1
    assert not b2.get("off") and not b2.get("off_text") and b2.get("n_own", 0) > 0, \
        f"control: b2 is inside and seen; its flyer left on its own motion and its lens is clipped: {b2}"
    assert any(o["kind"] == "character" and o["crop"]["top"] > 24 for o in b3.get("off") or []), b3
    E, _, S = F.screen_text_checks(pr, None, {"scenes": []}, lesson="probe-fixture")
    assert {e.split(":")[0] for e in E if "off frame" in e} == {"b1", "b3"}, E
    return f"b1 card {max(o['share'] for o in b1['off']):.0%} off and a wholly-off word; b3 figure cropped; b2 clean with {b2['n_own']} line(s) seen"


def check_words_with_no_entrance_are_named():
    """film.record_checks warns when an element shows words with no entrance (it appears at the beat's start, not on
    its word, over whatever the beat drew before): claude fork b12's "to whom" sat on its own black narration card
    for 7 s (2026-10-08). An element that is revealed, and scenery, are quiet (control)"""
    from loom.checks import film as F
    rep = {"elements": [{"beat": "b12", "name": "caption_to_whom", "kind": "connector", "revealT": None, "lifeT": [90.9, 98.7]},
                        {"beat": "b12", "name": "caption_when", "kind": "stamp", "revealT": 95.96, "lifeT": [90.9, 98.7]},
                        {"beat": "b12", "name": "sign", "kind": "scenery", "revealT": None, "lifeT": [90.9, 98.7]}],
           "texts": [{"beat": "b12", "text": "to whom", "element": {"name": "caption_to_whom"}},
                     {"beat": "b12", "text": "when", "element": {"name": "caption_when"}},
                     {"beat": "b12", "text": "EXIT", "element": {"name": "sign"}}]}
    E, W, st = F.record_checks(rep)
    assert E == [] and len(W) == 1 and "caption_to_whom" in W[0] and "no_entrance_words" in W[0], (E, W)
    return W[0][:110]


# ------------------------------------------------------------------ blank beats (B4, 2026-10-08)
_GEMINI_ROWS = [  # tools/node/probe.mjs rows of the gemini-balanced original build (before/.../qa/probe.json)
    {"beat": "b15", "t": 128.857, "n": 1, "n_own": 1, "els": 3, "off": [], "cut": []},
    {"beat": "b16", "t": 143.562, "n": 2, "n_own": 2, "els": 6, "cut": [{"text": "Observed", "rect": [1890, 400, 2050, 440]}, {"text": "behavior", "rect": [1890, 450, 2050, 490]}],
     "off": [{"name": "sat_1", "kind": "node", "share": 1, "words": 1}, {"name": "sat_2", "kind": "node", "share": 0.56, "words": 1},
             {"name": "hub", "kind": "node", "share": 0.72, "words": 0}]},
    {"beat": "b30", "t": 266.555, "n": 5, "n_own": 4, "els": 3, "off": [], "cut": []},
    {"beat": "b31", "t": 277.747, "n": 1, "n_own": 0, "els": 4, "cut": [{"text": "Relationship stays intact", "rect": [1700, 900, 2100, 940]}],
     "off": [{"name": "route", "kind": "connector", "share": 0.78, "words": 0}, {"name": "waypoint_1", "kind": "node", "share": 1, "words": 2},
             {"name": "waypoint_2", "kind": "node", "share": 1, "words": 2}]},
]


def check_a_beat_whose_own_elements_are_off_frame_or_absent_is_blank():
    """film.screen_text_checks names a BLANK beat: none of its own elements seen in the frame while the voice speaks.
    gemini b16 and b31 (their nested stations laid the whole picture outside the frame) passed the edge-density
    "empty" measure, which saw the held background; b15 and b30 beside them are clean (control). On a probe that
    counts the beat's own elements, an element never made visible is absent (blank), one inside is seen (quiet);
    a lesson whose own words were seen but whose beats were never measured is a blind measure (red)"""
    from loom.checks import film as F
    E, _, S = F.screen_text_checks({"screen_text": _GEMINI_ROWS}, None, {"scenes": []}, lesson="gemini-fixture")
    blank = sorted({e.split(":")[0] for e in E if "blank beat" in e})
    assert blank == ["b16", "b31"] and S["blank_beats"] == ["b16", "b31"] and S["blank_measured"] == 4, (blank, S, E)
    rows = [{"beat": "b1", "t": 3.0, "n": 0, "n_own": 0, "els": 2, "off": [], "cut": [], "own_measured": 2, "own_in_frame": 0,
             "absent": [{"name": "card", "kind": "card", "why": "not visible"}, {"name": "map", "kind": "card", "why": "off frame"}]},
            {"beat": "b2", "t": 7.0, "n": 1, "n_own": 1, "els": 1, "off": [], "cut": [], "own_measured": 1, "own_in_frame": 1, "absent": []},
            {"beat": "b3", "t": 11.0, "n": 1, "n_own": 0, "els": 1, "off": [], "cut": [], "own_measured": 0, "own_in_frame": 0, "absent": []}]
    E2, _, S2 = F.screen_text_checks({"screen_text": rows}, None, {"scenes": []}, lesson="probe-fixture")
    assert [e.split(":")[0] for e in E2 if "blank beat" in e] == ["b1"] and "not visible" in E2[0] and S2["blank_measured"] == 2, (E2, S2)
    blind = [dict(r, own_measured=0, own_in_frame=0) for r in rows]
    E3, _, S3 = F.screen_text_checks({"screen_text": blind}, None, {"scenes": []}, lesson="probe-fixture")
    assert any("blank-beat measure: 0 of 3 beats measured" in e for e in E3) and S3["blank_measured"] == 0, E3
    return f"gemini {blank} blank, b15 and b30 quiet; probe rows: b1 blank ({E2[0].split('(')[1][:40]}...), b2 seen; 0 measured is red"


_BLANK_JS = r"""
Loom.scene("b1", { build(ctx) {
  // gemini b16 in small: the beat's picture laid out outside the frame, and one element that never becomes visible
  const A = ctx.el("sat_1", { x: 2050, y: 300, w: 300, h: 160, kind: "node" });
  ctx.kit.rect(A.inner, 0, 0, 300, 160, { fill: "surface", r: 12 });
  ctx.kit.text(A.inner, "Observed", { role: "lead", x: 20, y: 0, w: 260, h: 160, maxLines: 1, valign: "middle" }); ctx.m.reveal(A, ctx.start + 0.2);
  const B = ctx.el("hub", { x: 600, y: 1200, w: 400, h: 200, kind: "node" });
  ctx.kit.rect(B.inner, 0, 0, 400, 200, { fill: "accent", r: 12 }); ctx.m.reveal(B, ctx.start + 0.2);
  const C = ctx.el("note", { x: 700, y: 400, w: 500, h: 160, kind: "card" });
  ctx.kit.rect(C.inner, 0, 0, 500, 160, { fill: "surface", r: 12 }); C.outer.style.opacity = 0;
} });
Loom.scene("b2", { build(ctx) {
  const C = ctx.el("card2", { x: 500, y: 350, w: 800, h: 240, kind: "card" });
  ctx.kit.rect(C.inner, 0, 0, 800, 240, { fill: "surface", r: 12 });
  ctx.kit.text(C.inner, "Words in the frame", { role: "lead", x: 30, y: 0, w: 700, h: 240, maxLines: 1, valign: "middle" });
  ctx.m.reveal(C, ctx.start + 0.2);
} });
"""


def check_probe_counts_a_beats_own_elements_in_the_frame():
    """tools/node/probe.mjs on a built lesson: b1 lays its picture outside the frame and leaves one element invisible
    (own_in_frame 0 of 3: blank, an error); b2's card is inside (1 of 1: quiet, the control)"""
    rt = _rt()
    br = rt._browser()
    if not br:
        return _SKIP
    from loom.checks import film as F
    page = rt._lesson(_BLANK_JS, [{"kind": "bespoke"}, {"kind": "bespoke"}], rt._ONE, 2)
    try:
        pr = _probe(page, br)
    finally:
        shutil.rmtree(page, ignore_errors=True)
    rows = {r["beat"]: r for r in pr.get("screen_text") or []}
    assert set(rows) == {"b1", "b2"}, pr.get("screen_text_error") or rows
    b1, b2 = rows["b1"], rows["b2"]
    assert b1.get("own_measured") == 3 and b1.get("own_in_frame") == 0, b1
    assert {x["name"]: x["why"] for x in b1.get("absent") or []} == {"sat_1": "off frame", "hub": "off frame", "note": "not visible"}, b1
    assert b2.get("own_measured") == 1 and b2.get("own_in_frame") == 1, b2
    E, _, S = F.screen_text_checks(pr, None, {"scenes": []}, lesson="probe-fixture")
    assert S["blank_beats"] == ["b1"] and S["blank_measured"] == 2, (S, E)
    return f"b1 0 of {b1['own_measured']} own elements in the frame ({', '.join(x['why'] for x in b1['absent'])}); b2 1 of 1"


# ------------------------------------------------------------------ film audit: who holds an element (B5, 2026-10-08)
def check_film_audit_lingering_follows_keep_in_any_case_and_ctx_held():
    """tools/film_audit.py: an element the next beat keeps as "priya" when it was drawn as "Priya" (the runtime's
    ctx.held takes it, one case-insensitive match), and one a scene held with ctx.held (the record's heldBy), are
    not lingering; a chain of holders is followed to its last beat; an element nobody holds that leaves 3 s after
    its beat is (control), and so is a held one that outstays its last holder. An older probe without heldBy says
    the held measure was not made"""
    sys.path.insert(0, str(ENGINE / "tools"))
    import importlib
    FA = importlib.import_module("film_audit")
    from PIL import Image
    d = Path(tempfile.mkdtemp(prefix="lm_audit_")) / "fixture-held"
    try:
        for sub in ("audio", "qa", "plan", "renders"):
            (d / sub).mkdir(parents=True)
        (d / "project.json").write_text(json.dumps({"id": "fixture-held", "request": {"length_min": 1}}), encoding="utf-8")
        beats = [{"id": f"b0{i + 1}", "start": 4 * i, "end": 4 * i + 4, "speech_start": 4 * i + 0.5, "speech_end": 4 * i + 3.5,
                  "phrases": [{"text": "one two three"}]} for i in range(3)]
        (d / "audio" / "timings.json").write_text(json.dumps({"beats": beats}), encoding="utf-8")
        E = lambda name, ex, by: {"beat": "b01", "name": name, "kind": "card", "revealT": 0.6, "exitT": ex, "exitKind": "recede",  # noqa: E731
                                  "lifeT": [0, ex], "heldBy": by}
        els = [E("Priya", 8.2, []),              # kept by b02's storyboard as "priya"
               E("card", 8.2, ["b02"]),           # held by b02's scene (ctx.held)
               E("chain", 12.0, ["b02", "b03"]),  # held by b02 then b03: its last holder is the last beat
               E("stuck", 7.0, []),               # nobody holds it: lingering 3 s (control)
               E("over", 11.0, ["b02"])]          # held by b02, but leaves 3 s after b02 ends (control)
        (d / "qa" / "probe.json").write_text(json.dumps({"elements": els, "foreign": []}), encoding="utf-8")
        sb = {"scenes": [{"beat": "b01", "kind": "bespoke"}, {"beat": "b02", "kind": "bespoke", "keep": ["priya"]}, {"beat": "b03", "kind": "bespoke"}]}
        (d / "plan" / "storyboard.json").write_text(json.dumps(sb), encoding="utf-8")
        (d / "qa" / "report.json").write_text(json.dumps({"errors": [], "stats": {}}), encoding="utf-8")
        fr = d / "frames"; fr.mkdir()
        for i in range(24):
            Image.new("RGB", (320, 180), (240, 236, 228) if i % 2 else (20, 20, 20)).save(fr / f"{i:05d}.png")
        out = FA.audit(str(d), fr)
        got = {x["name"]: x for x in out["lingering"]}
        assert sorted(got) == ["over", "stuck"], out["lingering"]
        assert got["over"].get("held_to") == "b02" and got["over"]["over_s"] == 3.0 and got["stuck"]["over_s"] == 3.0, got
        assert out["held_measured"] is True, out["held_measured"]
        for e in els:
            e.pop("heldBy")
        (d / "qa" / "probe.json").write_text(json.dumps({"elements": els, "foreign": []}), encoding="utf-8")
        old = FA.audit(str(d), fr)
        assert isinstance(old["held_measured"], str) and "not measured" in old["held_measured"], old["held_measured"]
        return f"lingering {sorted(got)} only (Priya kept as priya, card and chain held); an old probe says held is not measured"
    finally:
        shutil.rmtree(d.parent, ignore_errors=True)


def check_frame_review_frames_stand_at_their_labels():
    """tools/frame_review.py extract: on a 6 s video that changes colour every half second (red, green, blue, white,
    black, yellow, then again), the frames taken every 2 s are the video AT 0, 2 and 4 s (red, black, blue). With the
    fps filter's default rounding each frame was the last of its slot, about a second after its label (green, yellow,
    white), which put a frame near a cut in the wrong beat (claude fork b11 and b12, 2026-10-08)"""
    import importlib.util
    from PIL import Image
    spec = importlib.util.spec_from_file_location("frame_review_t", ENGINE / "tools" / "frame_review.py")
    FR = importlib.util.module_from_spec(spec); spec.loader.exec_module(FR)
    d = Path(tempfile.mkdtemp(prefix="lm_fr_"))
    try:
        cols = ["red", "green", "blue", "white", "black", "yellow"] * 2
        parts = ";".join(f"color=c={c}:s=64x36:d=0.5:r=30[c{i}]" for i, c in enumerate(cols))
        mp4 = d / "v.mp4"
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-filter_complex", parts + ";" + "".join(f"[c{i}]" for i in range(12)) + "concat=n=12:v=1[v]",
                        "-map", "[v]", "-c:v", "libx264", "-pix_fmt", "yuv420p", str(mp4)], check=True)
        out = d / "f"; out.mkdir()
        FR.extract(mp4, out, 2.0)
        frames = sorted(out.glob("f*.png"))
        name = lambda rgb: min({"red": (255, 0, 0), "green": (0, 128, 0), "blue": (0, 0, 255), "white": (255, 255, 255), "black": (0, 0, 0),  # noqa: E731
                                "yellow": (255, 255, 0)}.items(), key=lambda kv: sum((a - b) ** 2 for a, b in zip(kv[1], rgb)))[0]
        got = [name(Image.open(f).convert("RGB").getpixel((32, 18))) for f in frames[:3]]
        assert got == ["red", "black", "blue"], got
        return f"frames at 0, 2, 4 s: {got}"
    finally:
        shutil.rmtree(d, ignore_errors=True)
