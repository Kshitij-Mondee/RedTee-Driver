"""Slim briefs (L-420, L-422) and errors routed to who can fix them (L-417, L-418, L-421): Kshitij, 2026-10-12, "Build the
slim briefs and the error-routing fixes first. They change exactly what scene writers read and how fix rounds go."
The demo lesson (spacing-sticks): b05 and b10 are its bespoke beats."""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from shuttle_rails import lesson  # noqa: E402
from loom.agents import router as RT  # noqa: E402
from loom.shuttle import launch as LA  # noqa: E402
from loom.shuttle import rails as RL  # noqa: E402
from loom.shuttle.server import BRIEF_PART, Server  # noqa: E402
from loom.util import LoomError, read_json, write_json  # noqa: E402

KIT = ("Loom.lesson = Loom.lesson || {};\n(function () {\n  Loom.lesson.board = function (ctx, parent, opts) {\n"
       "    ctx.kit.text(parent, \"alex signed in\", { role: \"label\", x: 0, y: 0, w: 300, h: 40 });\n"
       + "".join(f"    // padding line {i} of a long kit source, to stand for a real 30 k kit\n" for i in range(400))
       + "    return { setState: function (n, t) { return t; } };\n  };\n})();\n")


def _with_kit(p):
    sb = read_json(p.path("plan/storyboard.json"))
    sb["kit"] = {"parts": [{"id": "board", "what": "the held board", "states": ["blank", "full"], "beats": ["b05", "b10"]}]}
    write_json(p.path("plan/storyboard.json"), sb)
    p.path("scenes/_kit.js").write_text(KIT, encoding="utf-8")
    p.path("logs").mkdir(exist_ok=True)
    p.path("logs/kit_api.md").write_text("board(ctx, parent, {w}): the held board; handle.setState(blank|full, t)\n", encoding="utf-8")


def agents_shuttle_briefs_are_slim_per_role():
    """A scene author's brief: one part, the kit's API note and not its source (read_artifact('kit') on demand), the film
    card's beat map only near its beat; a fixer's: its beat, defects and file, no film card, no style summary; a two-beat
    brief carries the film card, the style and the kit note once (gps-position: 57 k for one beat, 105 k for two, 51 to 105 k
    for a fixer, 30 k of each the kit's source)"""
    with lesson("P6", kit_beat="b10") as p:
        _with_kit(p)
        s = Server(str(p.root))
        one = s.engine_context("scene-author", ["b10"])
        two = s.engine_context("scene-author", ["b05", "b10"])
        fix = s.engine_context("fixer", ["b10"])
        src_line = "padding line 7 of a long kit source"
        assert src_line not in one and src_line not in two and src_line not in fix, "the kit's source is never pasted"
        assert "read_artifact('kit')" in one and "KIT API NOTE:\nboard(" in one, one[-1500:]
        assert len(one) < BRIEF_PART and one.count("THE FILM (") == 1, len(one)
        assert two.count("THE FILM (") == 1 and two.count("STYLE SUMMARY:") == 1 and two.count("KIT API NOTE:\nboard(") == 1, \
            (two.count("THE FILM ("), two.count("STYLE SUMMARY:"), two.count("KIT API NOTE:\nboard("))
        assert "THE FILM (" not in fix and "STYLE SUMMARY:" not in fix and fix.startswith("Fix beat b10"), fix[:300]
        assert "NARRATION AND PHRASE TIMINGS" in fix and "STORYBOARD SPEC FOR THIS SCENE" in fix
        rows = [l for l in one.splitlines() if l.startswith("  b") and " | says: " in l]
        assert 0 < len(rows) <= 7 and any(l.startswith("  b10 ") for l in rows), rows
        assert len(fix) < len(one) < len(two) < 2 * len(one), (len(fix), len(one), len(two))
    return f"scene author {len(one)} chars (one part), two beats {len(two)}, fixer {len(fix)}; no kit source anywhere"


def _report(p, errors: list):
    write_json(p.path("qa/report.json"), {"errors": errors, "warnings": []})
    write_json(p.path("qa/probe.json"), {"errors": []})


def agents_shuttle_errors_go_to_who_can_fix_them():
    """The router: invented words the kit's own code writes go to the kit once, not to each beat showing them (L-417); a
    line of one bespoke beat into another's element goes to both beats (L-418); foreign pixels the measure traces to a
    bespoke beat go to that beat, and only "beats not separable" stays the engine's (L-421)"""
    with lesson("P6", kit_beat="b10") as p:
        _with_kit(p)
        _report(p, [
            "lesson_vocabulary: b05 (bespoke) draws words the lesson never uses ['alex']: \"alex signed in\". Every word ...",
            "lesson_vocabulary: b10 (bespoke) draws words the lesson never uses ['alex']: \"alex signed in\". Every word ...",
            "lesson_vocabulary: b10 (bespoke) draws words the lesson never uses ['zebra']: \"zebra\". Every word ...",
            "lc layout line_into_object @ 60.0: b10: a line of path (b10) runs into packet (b05) at [1, 2, 3, 4] from 60 to 61 s; end it",
            "b10: foreign pixels at 90.0s: 900 px of other beats' pictures on screen (from b05 900 px; box [0, 0, 9, 9]). An element ...",
            "b10: foreign pixels at 95.0s: 700 px of other beats' pictures on screen (from beats not separable; box [0, 0, 9, 9]). An ...",
        ])
        D = RT.route(p)
        kit = [d for v in D["kit"].values() for d in v]
        assert len(kit) == 1 and kit[0]["code"] == "lesson_vocabulary" and "the kit's own text" in kit[0]["detail"], D["kit"]
        sc = {b: [d["code"] for d in v] for b, v in D["scene"].items()}
        assert sc.get("b10", []).count("lesson_vocabulary") == 1, f"'zebra' is b10's own: {sc}"
        assert "line_into_object" in sc.get("b05", []) and "line_into_object" in sc.get("b10", []), sc
        assert "foreign_pixels" in sc.get("b05", []), f"the pixels are b05's: {sc}"
        eng = [d for v in D["engine"].values() for d in v]
        assert len(eng) == 1 and "not separable" in eng[0]["detail"], D["engine"]
    return "kit words to the kit once; a cross-beat line to both beats; traced pixels to their beat; untraceable ones to a person"


def agents_shuttle_an_unowned_error_stops_the_run_and_a_passed_check_ends_fixing():
    """A check whose only errors no agent owns stops the run for a person (no fixer loop) and `resume` lifts it; in P9,
    after a check passed on the current build, delegating a fixer is refused (warnings are P10's)"""
    from loom import flow
    with lesson("P6", kit_beat="b10") as p:
        s = Server(str(p.root))
        keep_run, keep_route = flow.run_code, RT.route

        def run_code(proj, stage, **k):
            if stage == "check":
                raise LoomError("check failed with 1 error(s)")

        flow.run_code = run_code
        RT.route = lambda proj, critic=None, reported=None: {"engine": {"b17": [{"code": "foreign_pixels", "detail": "b17: foreign pixels (from beats not separable)", "count": 1}]}}
        try:
            r = s.t_check({"who": "lead"})
        finally:
            flow.run_code, RT.route = keep_run, keep_route
        assert "END THIS SESSION" in r["next"] and r["engine_only"], r
        st = RL.Rails(p).load()["stop"]
        assert st and st["reason"] == "engine_defect", st
        assert s.call("delegate", {"agent": "fixer", "beats": ["b10"], "brief": "fix it"})[0].get("refused"), "a stopped run spends nothing"
        seen = []
        keep_rs = LA.run_session
        LA.run_session = lambda project, *a, **k: seen.append(1) or (_ for _ in ()).throw(AssertionError("no session while stopped"))
        import os
        os.environ["LOOM_ALLOW_NO_WEBGL"] = "1"
        try:
            write_json(p.path("logs/shuttle/state.json"), dict(read_json(p.path("logs/shuttle/state.json")),
                                                                 run={"mode": "subscription", "runner": "cli", "lead": "sonnet"}))
            assert LA.run(p, mode="subscription", runner="cli", lead="sonnet") == LA.EXIT["failed"]
            LA.run_session = lambda project, mode, lead, group, prompt, session, resume, **k: (
                RL.Rails(project).update(lambda x: x.__setitem__("stop", {"reason": "budget", "detail": "test ends", "at": RL.now()}))
                or LA.Stream(project, mode, "x", RL.gkey(group), None))
            LA.resume(p)
            tr = [json.loads(x) for x in p.path("logs/shuttle/trace.jsonl").read_text(encoding="utf-8").splitlines()]
            assert any(t.get("event") == "engine_defect_lifted" for t in tr), "resume lifts the stop, in the trace"
        finally:
            LA.run_session = keep_rs
            os.environ.pop("LOOM_ALLOW_NO_WEBGL", None)
        # the passed-check rule
        RL.Rails(p).update(lambda x: x.__setitem__("stop", None))
        keep_cur, keep_status = s.rails.current, s.rails.status
        s.rails.current = lambda: "P9"
        s.rails.status = lambda: {"phases": [{"phase": "P9", "missing": []}], "current": "P9", "stop": None, "waiting": None}
        try:
            refused = s.t_delegate({"who": "lead"}, agent="fixer", brief="chase a warning", beats=["b10"])
            s.rails.status = lambda: {"phases": [{"phase": "P9", "missing": ["stage check is pending"]}], "current": "P9", "stop": None, "waiting": None}
            again = s.t_delegate({"who": "lead"}, agent="researcher", brief="look something up")
        finally:
            s.rails.current, s.rails.status = keep_cur, keep_status
        assert "check has passed" in (refused.get("refused") or ""), refused
        assert not again.get("refused") or "check has passed" not in again["refused"], again
    return "engine-only errors stop the run for a person and resume lifts it; no fixer after a passing check in P9"


def agents_shuttle_a_tool_of_no_phase_never_ends_a_session():
    """L-435 (the five-style test, 2026-10-13): report_finding has no phase; the rails' order check took idx(None) and raised,
    and on the loom runner (in process, no MCP loop to catch it) two planning sessions ended mid-phase. Now the rails let a
    tool of no phase through, and Server.call answers any engine error as data instead of raising."""
    with lesson("P1") as p:
        s = Server(str(p.root))
        rl = RL.Rails(p)
        assert rl.allow("report_finding", {"who": "lead"}, {"what": "x"}) is None
        r, _ = s.call("report_finding", {"what": "a test finding", "fix_route": "scene", "beat": "b01"})
        assert "error" not in r or "engine error" not in str(r.get("error")), r
        keep = s.rails.allow
        s.rails.allow = lambda *a, **k: (_ for _ in ()).throw(ValueError("None is not in list"))
        try:
            r2, imgs = s.call("lesson_status", {})
        finally:
            s.rails.allow = keep
        assert "engine error in lesson_status" in r2.get("error", "") and imgs == [], r2
    return "report_finding passes the rails in any phase; an engine exception comes back as an error, not a crash"


def agents_shuttle_a_clone_shares_the_plan_exactly_and_a_slice_starts_at_p8():
    """D-167 (Kshitij, 2026-10-14: "check for the fact that storyboarding or other steps that don't need to be re-done again
    and again and can be common for all models"): `loom slice` over every beat is a CLONE: the plan, the narration and the
    kit byte for byte (only the knowledge sheet's approver line is the clone's own), no scene file, P1 to P7 accepted, so a
    model run starts at P8 and redoes nothing upstream. A part of a lesson is a slice that also starts at P8 (its narration
    cut, its times from 0). Both are made in projects/ under a throwaway id and removed."""
    import hashlib
    import shutil
    from loom import slice as SL
    from loom.project import projects_root
    def h(p): return hashlib.sha256(Path(p).read_bytes()).hexdigest() if Path(p).exists() else None
    src = projects_root() / "gps-position"
    if not (src / "plan/script.json").exists():
        return "skipped: projects/gps-position is not here"
    ids = [b["id"] for b in read_json(src / "plan/script.json")["beats"]]
    made = []
    try:
        c = SL.make("gps-position", "zz-test-clone", f"{ids[0]}-{ids[-1]}", "agent, unattended per test")
        made.append(c.root)
        rels = [f"plan/{f.name}" for f in sorted((src / "plan").glob("*.json"))] + ["audio/timings.json", "audio/narration.wav", "scenes/_kit.js"]
        differ = [r for r in rels if h(src / r) != h(c.root / r)]
        assert differ in ([], ["plan/knowledge.json"]), differ
        if differ:
            a, b = read_json(src / "plan/knowledge.json"), read_json(c.root / "plan/knowledge.json")
            assert {k: v for k, v in a.items() if k != "review"} == {k: v for k, v in b.items() if k != "review"}, "only the approver differs"
        assert not [f for f in (c.root / "scenes").iterdir() if f.name.startswith("b")], "a clone has no scene file"
        assert RL.Rails(c).current() == "P8", RL.Rails(c).status()["phases"][:7]
        s = SL.make("gps-position", "zz-test-slice", "b08-b18", "agent, unattended per test")
        made.append(s.root)
        tm = read_json(s.root / "audio/timings.json")
        assert RL.Rails(s).current() == "P8" and tm["beats"][0]["start"] == 0.0 and [b["id"] for b in tm["beats"]] == ids[7:18]
    finally:
        for d in made:
            shutil.rmtree(d, ignore_errors=True)
    return f"clone: {len(rels)} files identical (approver line aside), P8; slice b08-b18: P8, from 0 s"
