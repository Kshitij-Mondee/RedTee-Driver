"""The Relay upgrade (R-46, D-155; research docs/research/2026-10-10-relay-quality-context-research.md, change list
docs/research/2026-10-10-relay-upgrade.md), one test per change, each red on the engine before it
(docs/research/relay_upgrade/red_runs.txt):
- honest tools: snapshot times on the lesson clock, edits instead of whole files, a scene whose last look threw is held,
  the finding's fields shown and the kit route kept, read_artifact, the kit previewed before it is taken, larger
  labelled snapshot sheets that name a missing frame, the snapshot's picture outside the lesson lock, a call log, the
  tools' full names in a claude_code prompt;
- shared vision: the film card in every builder's and the critic's message, the whole brief to the planners, the
  voice to the persona pick, the look to the script, context for a fresh storyboard fixer, craft notes preloaded;
- one world: a template that draws its own people and room on a drawn station is refused; the pilot pair goes first,
  its kit reports reach the kit before the other beats, and its pictures go to them."""
from __future__ import annotations

import json
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from agents_runtime import DEMO, cast_storyboard, restamp, fresh_project  # noqa: E402
from loom.agents import conductor as CD  # noqa: E402
from loom.agents import router as RT  # noqa: E402
from loom.agents import tools as T  # noqa: E402
from loom.agents.budget import Budget  # noqa: E402
from loom.agents.conductor import Conductor, film_card, task_message  # noqa: E402
from loom.util import read_json, write_json  # noqa: E402


def _demo(p, subs=("plan", "audio", "scenes", "media")):
    for sub in subs:
        if (DEMO / sub).exists():
            shutil.rmtree(p.path(sub), ignore_errors=True)
            shutil.copytree(DEMO / sub, p.path(sub))
    cast_storyboard(p)
    write_json(p.path("state.json"), read_json(DEMO / "state.json"))
    restamp(p)


def _beat(p, bid):
    return next(b for b in read_json(p.path("audio/timings.json"))["beats"] if b["id"] == bid)


def _scene_ctx(p, beat="b05", **extra):
    return T.ToolContext(project=p, role="scene", stage="scenes", beat=beat, target=p.path(f"scenes/{beat}.js"),
                         extra=dict(extra), state={})


class _Stub:
    """Swap module attributes for a test; put them back after."""

    def __init__(self, **pairs):
        self.pairs = pairs
        self.keep = []

    def __enter__(self):
        for k, v in self.pairs.items():
            mod, name = k.split(":")
            m = sys.modules[mod]
            self.keep.append((m, name, getattr(m, name)))
            setattr(m, name, v)
        return self

    def __exit__(self, *a):
        for m, name, v in self.keep:
            setattr(m, name, v)


def _no_build(tmp):
    """Snapshot internals stubbed: no compose, a private build folder, a sheet written, a clean probe."""
    def sheet(build, times, out, missing=None):
        Path(out).parent.mkdir(parents=True, exist_ok=True)
        Path(out).write_bytes(b"jpg")
        return str(out)
    return _Stub(**{"loom.flow:run_code": lambda project, name, **kw: None, "loom.qa:private_build": lambda project: tmp,
                    "loom.qa:snapshot_sheet_build": sheet, "loom.qa:probe_build": lambda build, out, env=None: {"errors": [], "layout": {"findings": []}, "contrast": {"findings": []}}})


# ------------------------------------------------------------------ honest tools
def agents_relayup_snapshot_times_are_on_the_lesson_clock():
    """R-46: lab_snapshot took seconds from the beat start while the task's phrase timings (and the scene API's t) are
    on the lesson clock; 48 of 146 snapshot times in feedback-relay-v2 fell outside their beat, 4 scenes were submitted
    unseen. Now a time outside the beat is refused with the beat's span (the draft is still written), and a time inside
    it is photographed as given. Control: b05 starts at 38.01 s, so 0.5 is refused and 40.0 is taken."""
    with fresh_project() as p:
        _demo(p)
        b = _beat(p, "b05")
        tmp = Path(tempfile.mkdtemp(prefix="relayup_")) / "build"
        tmp.mkdir(parents=True)
        ctx = _scene_ctx(p)
        with _no_build(tmp):
            r = T.call(ctx, "lab_snapshot", {"times": [0.5], "source": "// draft one\n"})
            assert "error" in r and "LESSON clock" in r["error"] and f"{b['start']:.2f}" in r["error"], r
            assert ctx.target.read_text(encoding="utf-8").startswith("// draft one") and not ctx.state.get("snapshots"), ctx.state
            t = round(float(b["start"]) + 2.0, 2)
            r2 = T.call(ctx, "lab_snapshot", {"times": [t]})
            assert r2.get("image") and r2.get("times") == [t], r2
            assert ctx.state["last_look"]["times"] == [t] and ctx.state["snapshots"] == 1, ctx.state
    return f"0.5 s refused (b05 runs {b['start']:.2f} to {b['end']:.2f}), draft kept; {t} s photographed as given"


def agents_relayup_snapshot_takes_edits_instead_of_the_whole_file():
    """R-46 (Shuttle L-377): after the first look a worker sends edits ([{old, new}]) to its draft. An `old` that is not
    found exactly once changes nothing. Control: the edited draft is exactly the file a whole re-send would give."""
    with fresh_project() as p:
        _demo(p)
        b = _beat(p, "b05")
        tmp = Path(tempfile.mkdtemp(prefix="relayup_")) / "build"
        tmp.mkdir(parents=True)
        ctx = _scene_ctx(p)
        src = "// one\nconst a = 1;\nconst b = 1;\n"
        with _no_build(tmp):
            assert T.call(ctx, "lab_snapshot", {"times": [b["start"] + 1], "source": src}).get("image")
            bad = T.call(ctx, "lab_snapshot", {"times": [b["start"] + 1], "edits": [{"old": "= 1;", "new": "= 2;"}]})
            assert "error" in bad and "2 times" in bad["error"], bad
            assert ctx.target.read_text(encoding="utf-8") == src
            ok = T.call(ctx, "lab_snapshot", {"times": [b["start"] + 1], "edits": [{"old": "const b = 1;", "new": "const b = 2;"}]})
            assert ok.get("image"), ok
            assert ctx.target.read_text(encoding="utf-8") == src.replace("const b = 1;", "const b = 2;")
    return "an ambiguous edit refused with nothing changed; an exact one applied"


def agents_relayup_a_scene_whose_last_look_threw_is_held():
    """R-46: in feedback-relay-sb 13 of 17 scene sessions submitted with runtime errors still in their snapshot, and
    every one was accepted. Now submit_scene refuses (not counted as a resubmission) a file whose own last look threw,
    or that changed after such a look; a kit part's error is the kit's, so once reported (fix_route kit) the file is
    taken; after RUNTIME_HOLDS refusals it is taken anyway (a worker never loses its scene). Control: a clean look."""
    from loom.agents.tools import _runtime_hold, _sha
    with fresh_project() as p:
        src = "Loom.scene('b05', {build(ctx) {}});\n"
        ctx = _scene_ctx(p, require_snapshot=True)
        ctx.state["last_look"] = {"sha": _sha(src), "errors": ["scene_threw: x is not defined"]}
        r = _runtime_hold(ctx, src)
        assert r and r["accepted"] is False and "exact file" in r["errors"][0] and "rounds" not in ctx.state, r
        r = _runtime_hold(ctx, src + "// changed\n")
        assert r and "changed after a snapshot" in r["errors"][0], r
        assert _runtime_hold(ctx, src) is None                     # RUNTIME_HOLDS (2) used: taken
        ctx2 = _scene_ctx(p, require_snapshot=True)
        ctx2.state["last_look"] = {"sha": _sha(src), "errors": ["kit_part_threw: part desk: none"]}
        ctx2.state["findings"] = [{"fix_route": "kit", "what": "desk throws", "severity": "major", "stage": "scenes"}]
        assert _runtime_hold(ctx2, src) is None                    # reported to the kit: taken
        ctx3 = _scene_ctx(p, require_snapshot=True)
        ctx3.state["last_look"] = {"sha": _sha(src), "errors": []}
        assert _runtime_hold(ctx3, src) is None                    # control: a clean look
    return "held twice (same file, changed file), then taken; a reported kit error and a clean look pass"


def agents_relayup_a_kit_report_reaches_the_kit():
    """R-46: the scene card says report a kit problem with fix_route "kit", but the finding schema had no "kit", so the
    normaliser turned it into "human" and the router never sent it to the kit; and the tool's parameter was a bare
    object, so the fields were never shown (8 of 8 reports in feedback-relay-sb refused and lost). Now the fields are in
    the tool's schema and a kit report is logged and routed as kit. Control: an unknown route still goes to a person."""
    params = T.TOOLS["report_finding"].parameters["properties"]["finding"]
    shown = json.dumps(params)
    assert all(f"REQUIRED" in params["properties"][k]["description"] for k in ("severity", "what", "fix_route")), shown
    assert "kit" in params["properties"]["fix_route"]["description"], shown
    with fresh_project() as p:
        ctx = _scene_ctx(p)
        r = T.call(ctx, "report_finding", {"finding": {"severity": "major", "what": "part desk throws on fill none", "fix_route": "kit",
                                                       "beat": "b05"}})
        assert r.get("logged"), r
        r2 = T.call(ctx, "report_finding", {"finding": {"severity": "medium", "issue": "odd thing", "fix_route": "somebody"}})
        assert r2.get("logged") and r2["as_logged"]["fix_route"] == "human", r2
        rows = [json.loads(x) for x in p.path("logs/findings.jsonl").read_text(encoding="utf-8").splitlines()]
        assert rows[0]["fix_route"] == "kit", rows
        rep = RT.new_reports(p, p.path("logs/findings_routed.json"))
        assert [f["fix_route"] for f in rep] == ["kit"], rep
    return "fields shown; a kit report logged and routed as kit; an unknown route still goes to a person"


def agents_relayup_any_role_can_read_the_plan():
    """R-46: Relay had no read_artifact, so no builder could fetch the brief, the outline or the storyboard's film-level
    parts. Now: film (the card), storyboard:<key>, scene:<beat>, plan files; an unknown name lists what exists."""
    with fresh_project() as p:
        _demo(p)
        ctx = _scene_ctx(p)
        assert "scene" in T.ROLE_TOOLS and "read_artifact" in T.ROLE_TOOLS["scene"] and "read_artifact" in T.ROLE_TOOLS["critic"]
        f = T.call(ctx, "read_artifact", {"name": "film"})
        assert f.get("text", "").startswith("THE FILM"), f
        w = T.call(ctx, "read_artifact", {"name": "storyboard:world"})
        assert "value" in w and w["value"], w
        s = T.call(ctx, "read_artifact", {"name": "scene:b05"})
        assert "Loom.scene" in s.get("text", ""), s
        u = T.call(ctx, "read_artifact", {"name": "secrets"})
        assert "error" in u and "film" in u["have"], u
    return "film, storyboard:world, scene:b05 read; an unknown name refused with the list"


def agents_relayup_the_kit_is_previewed_before_it_is_taken():
    """R-46 (Shuttle D-135): Relay's kit worker could not see its kit. With require_kit_preview, submit_kit refuses a
    source that kit_preview has not drawn (not counted), and takes the previewed draft when `source` is left out.
    Control: without the flag (Shuttle's own gate, tests) nothing changes."""
    from loom.shuttle import kitpreview
    with fresh_project() as p:
        _demo(p)
        sb = read_json(p.path("plan/storyboard.json"))
        sb["kit"] = {"parts": [{"id": "board", "what": "a board", "states": [], "beats": ["b05"]}]}
        write_json(p.path("plan/storyboard.json"), sb)
        kit = "Loom.lesson = Loom.lesson || {};\nLoom.lesson.board = function (ctx, parent, opts) {\n  return {};\n};\n"
        ctx = T.ToolContext(project=p, role="kit", stage="scenes", target=p.path("scenes/_kit.js"), extra={"require_kit_preview": True})
        art = {"source": kit, "parts": ["board"], "api": "board(ctx, parent, opts)", "verified": [], "unverified": []}
        r = T.call(ctx, "submit_kit", {"artifact": art})
        assert r["accepted"] is False and "preview" in r["errors"][0] and "rounds" not in ctx.state, r
        with _Stub(**{"loom.shuttle.kitpreview:preview": lambda project, source: {"image": None, "errors": [], "warnings": []}}):
            pv = T.call(ctx, "kit_preview", {"source": kit})
        assert "error" not in pv and p.path(T.KIT_DRAFT).exists(), pv
        r2 = T.call(ctx, "submit_kit", {"artifact": {k: v for k, v in art.items() if k != "source"}})
        assert r2["accepted"] is True, r2
        ctx2 = T.ToolContext(project=p, role="kit", stage="scenes", target=p.path("scenes/_kit.js"), extra={})
        assert T.call(ctx2, "submit_kit", {"artifact": dict(art, source=kit.replace("{};", "{ a: 1 };"))})["accepted"] is True
    assert kitpreview.preview is not None
    return "refused unpreviewed; the previewed draft taken without re-sending it; no flag, no gate"


def agents_relayup_snapshot_sheets_are_large_labelled_and_say_what_is_missing():
    """R-46: the sheet was always three 640 x 360 tiles (about 520 px a frame once the model's reader scaled it, too small
    for 20 px text), unlabelled, and a frame that did not render vanished. Now one or two frames are 1280 x 720 (stacked),
    three or four a 2 x 2 grid of 960 x 540, each labelled with its time, and a missing time is reported."""
    from PIL import Image
    from loom import qa as QA
    tmp = Path(tempfile.mkdtemp(prefix="relayup_sheet_"))
    build = tmp / "build"
    build.mkdir()

    def fake_run(cmd, cwd=None, env=None, timeout=None, **kw):
        at = cmd[cmd.index("--at") + 1].split(",")
        snap = Path(cwd) / "snapshots"
        snap.mkdir(exist_ok=True)
        for k, t in enumerate(at):
            if t == "9.00":
                continue                                  # this frame "fails to render"
            Image.new("RGB", (1920, 1080), (200, 200, 200)).save(snap / f"frame-{k}-at-{t}s.png")
    try:
        with _Stub(**{"loom.qa:run": fake_run}):
            one = QA.snapshot_sheet_build(build, [1.0], tmp / "one.jpg")
            miss = []
            four = QA.snapshot_sheet_build(build, [1.0, 2.0, 3.0, 9.0], tmp / "four.jpg", missing=miss)
        w1, h1 = Image.open(one).size
        w4, h4 = Image.open(four).size
        assert (w1, h1) == (1284, 724), (w1, h1)
        assert (w4, h4) == (1928, 1088) and miss == [9.0], (w4, h4, miss)
        corner = Image.open(one).convert("RGB").crop((0, 0, 190, 44))
        assert any(px[0] > 200 and px[2] < 140 for px in corner.getdata()), "no time label drawn"
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    return "1 frame 1280 x 720 with its time; 4 asked, 3 drawn in a 2 x 2 grid, 9.0 reported missing"


def agents_relayup_snapshot_pictures_run_outside_the_lesson_lock_and_calls_are_logged():
    """R-46: the claude_code server ran lab_snapshot whole under the cross-process lesson lock (median wait 82 s, max
    557 s) and logged no tool call. Now lab_snapshot takes the lock itself for the draft and compose only, and every
    call is a line in calls.jsonl. Control: a submit still runs under the server's lock."""
    from loom.agents import cc_server as CS
    assert "lab_snapshot" in CS.SELF_LOCKED and "read_artifact".startswith(CS.READ_PREFIXES)
    with fresh_project() as p:
        work = Path(tempfile.mkdtemp(prefix="cc_srv_"))
        try:
            task = work / "task.json"
            write_json(task, {"project": str(p.root), "role": "persona_pick", "stage": "persona", "beat": None, "target": None, "extra": {},
                              "tools": ["submit_persona_pick"], "terminal": "submit_persona_pick",
                              "limits": {"tool_calls": 80, "repairs": 1}, "state_file": str(work / "state.json"), "model": "test"})
            srv = CS.TaskServer(str(task))
            assert callable(srv.ctx.lesson_lock)
            with srv.ctx.lesson_lock():
                pass
            res, _ = srv.call("submit_persona_pick", {"artifact": {"pick": "mentor", "why": "fits"}})
            rows = [json.loads(x) for x in (work / "calls.jsonl").read_text(encoding="utf-8").splitlines()]
            assert rows and rows[0]["tool"] == "submit_persona_pick" and rows[0]["ok"] is True, rows
        finally:
            shutil.rmtree(work, ignore_errors=True)
    return "lab_snapshot locks only its writing half; a lesson lock factory on the context; one log line per call"


def agents_relayup_a_claude_code_prompt_names_tools_in_full():
    """R-46: the cards say "call lab_snapshot" but Claude Code serves mcp__relay__lab_snapshot; 14 calls in
    feedback-relay-v2 went to the bare name, each re-sending a whole scene. The system prompt now maps every name."""
    src = (ROOT / "loom/agents/cc_runner.py").read_text(encoding="utf-8")
    assert "mcp__relay__{n}" in src and "Your tools in this session" in src
    return "the claude_code system prompt maps each bare name to mcp__relay__<name>"


# ------------------------------------------------------------------ shared vision
def agents_relayup_every_builder_and_the_critic_share_the_film_card():
    """R-46: the film's concept, world, cast, devices and value bands were written once by the storyboard and reached the
    scene, kit, clip and critic agents only as fragments of their own beat. The film card (code, no model call) is now
    at the top of each of those messages, the same text for every beat (a cached prefix); before the storyboard it holds
    the brief's part only. Control: the brief and knowledge roles do not get it."""
    with fresh_project() as p:
        _demo(p)
        sb = read_json(p.path("plan/storyboard.json"))
        sb["concept"] = "One desk, one notebook, the same week seen twice."
        write_json(p.path("plan/storyboard.json"), sb)
        card = film_card(p)
        assert card.startswith("THE FILM") and "Concept: One desk" in card and "b05 [bespoke" in card and len(card) <= CD.FILM_CARD_MAX
        tm = {b["id"]: b for b in read_json(p.path("audio/timings.json"))["beats"]}
        sc = next(s for s in sb["scenes"] if s["beat"] == "b05")
        msgs = {"scene": task_message(p, "scene", {"scene": sc, "beat_timing": tm["b05"], "file": "scenes/b05.js", "file_abs": str(p.path("scenes/b05.js"))}),
                "kit": task_message(p, "kit", {}), "critic": task_message(p, "critic", {"beats": ["b05"]})}
        for role, m in msgs.items():
            assert m.startswith(card), role
        sc10 = next(s for s in sb["scenes"] if s["beat"] == "b10")
        m10 = task_message(p, "scene", {"scene": sc10, "beat_timing": tm["b10"], "file": "scenes/b10.js", "file_abs": str(p.path("scenes/b10.js"))})
        assert m10.startswith(card)                                   # the same prefix for every beat
        assert "THE FILM" not in task_message(p, "knowledge", {})
        p.path("plan/storyboard.json").unlink()
        early = film_card(p)
        assert "Concept" not in early and "Topic" in early
    return f"card {len(card)} chars at the top of scene, kit and critic messages, identical for b05 and b10; brief-only before the storyboard"


def agents_relayup_the_planners_get_the_whole_brief_and_the_voice():
    """R-46: the storyboard roles got only the brief's look, visual_direction, audience and outcome (the brief has no
    `look`), so the through-line, arc, what to avoid and the voice never reached the planners; persona_pick asked for
    `voice` (the brief's key is `voice_note`); the script was never told the film's look. Control: the knowledge role's
    message is unchanged in kind."""
    with fresh_project() as p:
        _demo(p)
        b = read_json(p.path("plan/brief.json"))
        b.update(through_line="THROUGHLINE-X", must_avoid=["AVOID-Y"], voice_note="VOICE-Z", visual_direction="VISUAL-W")
        write_json(p.path("plan/brief.json"), b)
        sbm = task_message(p, "storyboard_outline", {})
        assert "THROUGHLINE-X" in sbm and "AVOID-Y" in sbm and "VOICE-Z" in sbm and "PERSONA" in sbm, sbm[:400]
        assert "VOICE-Z" in task_message(p, "persona_pick", {})
        sm = task_message(p, "script", {})
        assert "THE FILM'S LOOK" in sm and "VISUAL-W" in sm and "look_family" in sm
    return "through-line, avoid list and voice reach the planners; the voice reaches the pick; the look reaches the script"


def agents_relayup_a_fresh_storyboard_fixer_sees_the_film():
    """R-46: a storyboard fix in a new session got about 1.3k characters of defects and nothing else (9 sessions in
    feedback-relay-v2). It now gets the film card and the approved outline first."""
    with fresh_project() as p:
        _demo(p)
        write_json(p.path("plan/outline.json"), {"devices": [{"id": "OUTLINE-DEV"}]})
        c = Conductor(p, "mock", Budget(1.0))
        seen = {}

        def fake_run_agent(spec, ctx, task, budget, **kw):
            seen["task"] = task
            from loom.agents.runtime import AgentResult
            return AgentResult("t", spec.role, "accepted", None, [], [], {}, 0.0, 1, 0, 0, "m", "p", 0.0, "")
        with _Stub(**{"loom.agents.conductor:run_agent": fake_run_agent, "loom.agents.llm.registry:available": lambda m: True}):
            c.run_role("storyboard", "storyboard", fix="- b05: the board is cut at the right edge")
    t = seen["task"]
    assert t.startswith("THE FILM") and "OUTLINE-DEV" in t and "b05: the board is cut" in t, t[:300]
    return "film card, outline and the defects in a fresh storyboard fixer's task"


def agents_relayup_craft_notes_are_preloaded_for_the_roles_that_draw_and_judge():
    """R-46: the scene workers of feedback-relay-v2 read no skill section and no style guide (on demand, never asked).
    The style guide's sections for the role and the card's own short list are now in the cached prefix. Control: a
    role with none (brief) and a style without a guide get no guide sections."""
    from loom.agents.runtime import role_system
    s = "\n".join(role_system("scene", "cards", "story-cartoon"))
    assert "## Craft notes" in s and "## 2. Palette roles" in s and "## 13. Polish checklist" in s and "Pass C" in s
    c = "\n".join(role_system("critic", "cards", "story-cartoon"))
    assert "## 12. Failure modes" in c and "## 11. Recipes" not in c
    assert "## Craft notes" not in "\n".join(role_system("brief", "cards", "story-cartoon"))
    assert "style guide" not in "\n".join(role_system("scene", "cards", "flat-cosmos")).split("## Craft notes")[-1][:200]
    return "scene and critic carry their guide sections and skill notes; brief none; a guideless style no guide part"


# ------------------------------------------------------------------ one world
def agents_relayup_a_template_with_its_own_room_on_a_drawn_station_is_refused():
    """R-46: feedback-relay-v2's meeting room changed look at b02 (scenario.dialogue between the drawn b01 and b17) and
    its replay at b06 (hero.character_moment before the drawn b07 to b11). Controls: the same template on its own
    station passes (a cut-away), and a structure template (quiz) on a drawn station passes."""
    from loom.checks.story import world_checks
    sb = {"scenes": [{"beat": "b01", "kind": "bespoke", "station": "room"},
                     {"beat": "b02", "kind": "template", "template": "scenario.dialogue", "station": "room"},
                     {"beat": "b03", "kind": "template", "template": "quiz.question", "station": "room"},
                     {"beat": "b04", "kind": "blueprint", "blueprint": "hero.character_moment", "station": "desk"}]}
    E, _ = world_checks(sb, ["b01", "b02", "b03", "b04"])
    assert len(E) == 1 and E[0].startswith("b02:") and "one_world" in E[0], E
    v2 = ROOT / "projects/feedback-relay-v2"
    if (v2 / "plan/storyboard.json").exists():
        sbv = read_json(v2 / "plan/storyboard.json")
        E2, _ = world_checks(sbv, [b["id"] for b in read_json(v2 / "plan/script.json")["beats"]])
        assert sorted(e.split(":")[0] for e in E2) == ["b02", "b06"], E2
    return "b02 refused; the quiz on the drawn station and the blueprint on its own station pass; feedback-relay-v2: b02 and b06"


def agents_relayup_the_pilot_pair_goes_first_and_its_kit_reports_reach_the_kit():
    """R-46 (Shuttle D-144, L-319): every scene worker started at once, so a kit problem was copied by all of them before
    anyone reported it. With a kit and three or more new bespoke beats, the first two sharing a station (a continue join
    first) are written first; their kit reports send the kit back once before the others start, are not routed again,
    and the others get the pilot's pictures. Control: a fix round has no pilot."""
    def job(beat, station, join=None, fix=None):
        return {"scene": {"beat": beat, "station": station, "join_in": {"type": join} if join else {}}, "fix": fix, "role": "scene"}
    with fresh_project() as p:
        c = Conductor(p, "mock", Budget(1.0))
        sb = {"kit": {"parts": [{"id": "desk"}]}}
        js = [job("b01", "a"), job("b02", "b"), job("b03", "b", "continue"), job("b04", "a")]
        assert [j["scene"]["beat"] for j in c._pilot_jobs(js, sb)] == ["b02", "b03"]
        assert [j["scene"]["beat"] for j in c._pilot_jobs([job("b01", "a"), job("b02", "b"), job("b03", "a")], sb)] == ["b01", "b03"]
        assert c._pilot_jobs(js, {}) == [] and c._pilot_jobs(js[:2], sb) == []
        from loom.agents.runtime import AgentResult
        rep = {"fix_route": "kit", "beat": "b02", "what": "desk throws on fill none", "severity": "major", "stage": "scenes"}
        res = [AgentResult("t", "scene", "accepted", None, [], [rep], {}, 0.0, 1, 0, 0, "m", "p", 0.0, ""),
               AgentResult("t", "scene", "accepted", None, [], [], {}, 0.0, 1, 0, 0, "m", "p", 0.0, "")]
        kit_calls = []
        c.kit = lambda findings=None: kit_calls.append(findings) or "ok"
        out = c._run_pilots(js[1:3], lambda js_: res)
        assert len(kit_calls) == 1 and kit_calls[0] == [rep] and out == res, kit_calls
        assert c.fixes.get(("kit", None)) == 1 and CD._report_key(dict(rep, by="scene")) in c.handled_reports
        p.path("qa").mkdir(parents=True, exist_ok=True)
        p.path("qa/snapshot_b02.jpg").write_bytes(b"jpg")
        look, imgs = c.look_so_far(js[1:3], res)
        assert look == ["b02"] and imgs[0].endswith("snapshot_b02.jpg"), (look, imgs)
        T.call(_scene_ctx(p, "b02"), "report_finding", {"finding": rep})
        reported = [f for f in RT.new_reports(p, p.path("logs/findings_routed.json")) if CD._report_key(f) not in c.handled_reports]
        assert reported == [], reported
    return "pilot b02 + b03 (continue); its kit report sent the kit back once, not routed again; b02's picture handed on"


def agents_relayup_the_other_mix_is_named_for_an_illustrated_style():
    """R-46: the Cowork lesson the Relay film was held against had used the cinema mix (80 % motion), the Relay run the
    classic one. Both stay (rule 11); an illustrated style on the classic mix now says the other exists. Control:
    cinema, or a non-illustrated style, says nothing."""
    with fresh_project() as p:
        cfg = read_json(p.path("project.json"))
        cfg["request"].update(style="story-cartoon", mix=None)
        p.save_cfg(cfg)
        c = Conductor(p, "mock", Budget(1.0))
        assert c.mix_note() and "--mix cinema" in c.mix_note()
        cfg["request"]["mix"] = "cinema"
        p.save_cfg(cfg)
        assert c.mix_note() is None
        cfg["request"].update(mix=None, style="corporate-clean")
        p.save_cfg(cfg)
        assert Conductor(p, "mock", Budget(1.0)).mix_note() is None
    return "story-cartoon on classic names the cinema mix; cinema or corporate-clean say nothing"


# ------------------------------------------------------------------ after the verification run (R-48)
def agents_relayup_beats_that_hold_are_written_after_the_beat_they_hold_from():
    """L-394: feedback-relay-v3's b04, b05 and b06 (one board, `continue` joins) were written at the same time, so b05
    and b06 kept elements b04 had not drawn yet. Jobs now run as chains: a beat that continues from (or keeps) the beat
    before it waits for that beat's worker; separate chains still run in parallel. Controls: a beat on its own starts its
    own chain; a beat whose predecessor is not being written (a fix round) starts a chain too."""
    def job(beat, join=None, keep=None):
        sc = {"beat": beat, "join_in": {"type": join} if join else {}}
        if keep:
            sc["keep"] = keep
        return {"scene": sc, "fix": None, "role": "scene"}
    sb = {"scenes": [{"beat": f"b{k:02d}"} for k in range(1, 9)]}
    js = [job("b06", "continue"), job("b04"), job("b05", "continue"), job("b07"), job("b08", keep=["card"]), job("b02")]
    chs = [[j["scene"]["beat"] for j in ch] for ch in Conductor.chains(js, sb)]
    assert chs == [["b02"], ["b04", "b05", "b06"], ["b07", "b08"]], chs
    alone = [[j["scene"]["beat"] for j in ch] for ch in Conductor.chains([job("b05", "continue")], sb)]
    assert alone == [["b05"]], alone
    return "b04 then b05 then b06 in one chain; b07 then b08 (keep); b02 alone; chains in parallel"


def check_a_seam_between_worlds_takes_the_styles_join():
    """R-48 and R-51: compose replaces a camera pan between two different worlds (it would show the seam) with a join it
    chooses itself. A dip (until R-48) or a fade (R-49) passed through an empty frame. Now it is the style's own seam join
    (pack `seam_join`; Kshitij, 2026-10-11: cinematic styles carry over smoothly, corporate ones need not care): this
    lesson's style wipes in the camera's direction; a style that names none cuts; a dip is never chosen. Control: a dip the
    storyboard asked for stays a dip."""
    from loom.compose import compose, seam_join, wipe_dir
    assert seam_join({"seam_join": "fade"}, {}, {}) == "fade" and seam_join({}, {}, {}) == "cut"
    assert seam_join({"seam_join": "dip"}, {}, {}) == "cut"
    assert wipe_dir({"x": 0}, {"x": 2400}) == "right" and wipe_dir({"x": 2400}, {"x": 0}) == "left"
    assert wipe_dir({"x": 0, "y": 0}, {"x": 0, "y": 1400}) == "down"
    packs = {f.stem: read_json(f) for f in (ROOT / "packs/styles").glob("*.json")}
    assert all(pk.get("seam_join") in ("cut", "wipe", "fade") and pk.get("join_note") for pk in packs.values()), \
        {k: pk.get("seam_join") for k, pk in packs.items()}
    assert packs["cinematic-noir"]["seam_join"] == "fade" and packs["corporate-clean"]["seam_join"] == "cut" \
        and packs["story-cartoon"]["seam_join"] == "wipe"
    with fresh_project() as p:
        _demo(p)
        sb = read_json(p.path("plan/storyboard.json"))
        last = sb["scenes"][-1]
        last["join_in"] = {"type": "dip", "meaning": "time"}
        write_json(p.path("plan/storyboard.json"), sb)
        restamp(p)
        sid = p.request.get("style")
        style = read_json(ROOT / "packs/styles" / f"{sid}.json")
        rep = compose(p, strict=False)
        man = read_json(p.path("build/manifest.json"))
        seams = {w.split(":")[0] for w in rep["warnings"] if "would show the seam" in w}
        sub = [s for s in man["scenes"] if s.get("beat") in seams]
        want = style.get("seam_join") or "cut"
        assert sub and all(s["join_in"]["type"] == want for s in sub), [(s["beat"], s["join_in"]) for s in sub]
        if want == "wipe":
            assert all(s["join_in"].get("dir") in ("left", "right", "up", "down") for s in sub), [s["join_in"] for s in sub]
        mine = next(s for s in man["scenes"] if s.get("beat") == last["beat"])
        assert mine["join_in"]["type"] == "dip", mine["join_in"]
    return f"{len(sub)} seam substitution(s) take {sid}'s {want}; cinematic fades, corporate cuts; the storyboard's dip stays"


def check_a_snapshot_compose_never_counts_as_the_compose():
    """R-51 (L-405): flow.run_code marked every stage done, so a scene worker's lenient, silent snapshot compose marked
    compose done and the conductor skipped the real compose with its mix: feedback-relay-v3 shipped with narration only.
    Now a lenient or silent compose leaves the stage pending, and the full compose marks it done and writes the mix."""
    from loom import flow
    with fresh_project() as p:
        _demo(p)
        mixf = p.path("audio/mix.wav")
        if mixf.exists():
            mixf.unlink()
        flow.run_code(p, "compose", manim_quality="draft", strict=False, mix=False)
        st = {r["stage"]: r["status"] for r in flow.status(p)}
        assert st["compose"] != "done" and not mixf.exists(), (st["compose"], mixf.exists())
        flow.run_code(p, "compose")
        st = {r["stage"]: r["status"] for r in flow.status(p)}
        assert st["compose"] == "done" and mixf.exists(), (st["compose"], mixf.exists())
    return "a snapshot compose leaves compose pending (no mix); the full compose marks it done and writes audio/mix.wav"


def check_a_timeout_ends_the_call_even_when_a_grandchild_holds_the_pipe():
    """R-51 (L-406): util.run's timeout killed only the child and then waited for its pipes, which the browser it had
    started still held: a 600 s probe timeout surfaced after about 95 minutes. Now the whole tree is killed and the call
    ends at the timeout. Control: a command that finishes in time returns its output."""
    import subprocess as sp
    import time as _t
    from loom.util import run
    code = ("import subprocess, sys, time; subprocess.Popen([sys.executable, '-c', 'import time; time.sleep(20)']); "
            "print('started', flush=True); time.sleep(20)")
    t0 = _t.time()
    try:
        run([sys.executable, "-c", code], timeout=2)
        raise AssertionError("no timeout")
    except sp.TimeoutExpired as e:
        took = _t.time() - t0
        assert took < 12, f"the timeout surfaced after {took:.1f} s"
        assert "started" in (e.output or ""), e.output
    ok = run([sys.executable, "-c", "print('fine')"], timeout=30)
    assert ok.returncode == 0 and ok.stdout.strip() == "fine", ok
    return f"timeout at 2 s surfaced after {took:.1f} s (the grandchild would have held it 20 s); a normal call returns"


def check_run_compare_reads_a_relay_lesson():
    """2026-10-12 (https-private-relay): tools/run_compare.py read Shuttle logs only. It now reads a Relay lesson too
    (logs/llm_calls.jsonl, logs/traces, logs/decisions.jsonl) and puts each task in Shuttle's phases: a role's first task in
    its stage's phase, the storyboard's look round (before any kit or scene) in P5, rework before the first critic in P9,
    after it in P10, the critic in P10; a trace's tool time is engine time and a snapshot is a look. Control: a lesson with
    Shuttle logs still goes to the Shuttle reader."""
    import importlib.util
    spec = importlib.util.spec_from_file_location("run_compare", ROOT / "tools" / "run_compare.py")
    RC = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(RC)
    pid = "_tmp_runcompare_relay"
    d = ROOT / "projects" / pid / "logs"
    shutil.rmtree(d.parent, ignore_errors=True)
    (d / "traces").mkdir(parents=True)
    try:
        def row(task, role, at, usd=0.1):
            return {"task": task, "role": role, "at": f"2026-10-12T10:{at}", "input": 1000, "cached": 500, "output": 100, "usd": usd}
        rows = [row("brief-1", "brief", "00:00"), row("storyboard-1", "storyboard", "05:00"), row("storyboard-2", "storyboard", "06:00"),
                row("kit-1", "kit", "07:00"), row("scene-b01-1", "scene", "08:00"), row("scene-b01-2", "scene", "09:00"),
                row("critic-1", "critic", "10:00", 0.05), row("scene-b01-3", "scene", "11:00"), row("storyboard-3", "storyboard", "12:00")]
        (d / "llm_calls.jsonl").write_text("\n".join(json.dumps(r) for r in rows) + "\n", encoding="utf-8")
        (d / "traces" / "scene-b01-1.jsonl").write_text("\n".join(json.dumps(e) for e in [
            {"event": "start", "t": 0.0}, {"event": "model", "t": 2.0}, {"event": "tool", "name": "lab_snapshot", "t": 10.0}]) + "\n", encoding="utf-8")
        (d / "decisions.jsonl").write_text(json.dumps({"node": "check", "decision": "check", "at": "2026-10-12T10:09:30",
                                                        "data": {"errors": 3, "per_beat": {"b01": {"errors": {"text_spill": 3}}}}}) + "\n", encoding="utf-8")
        ph = RC.relay_task_phases(rows)
        want = {"brief-1": "P1", "storyboard-1": "P5", "storyboard-2": "P5", "kit-1": "P7", "scene-b01-1": "P8", "scene-b01-2": "P9",
                "critic-1": "P10", "scene-b01-3": "P10", "storyboard-3": "P10"}
        assert ph == want, ph
        s = RC.stats(pid)
        assert s["kind"] == "relay" and s["phases"]["P5"]["calls"] == 2 and abs(s["phases"]["P10"]["usd"] - 0.25) < 1e-9, s["phases"]["P10"]
        assert s["phases"]["P8"]["looks"] == 1 and abs(s["phases"]["P8"]["engine_s"] - 8.0) < 1e-9, s["phases"]["P8"]
        assert s["checks"] and s["checks"][0]["errors"] == 3 and s["phases"]["P9"]["checks"] == 1, s["checks"]
        assert "P8" in RC.table([s])
        (d / "shuttle").mkdir()
        (d / "shuttle" / "calls.jsonl").write_text(json.dumps({"phase": "P1", "at": "2026-10-12T10:00:00", "usd": 0.2}) + "\n", encoding="utf-8")
        sh = RC.stats(pid)
        assert sh.get("kind") != "relay" and sh["phases"]["P1"]["calls"] == 1, sh["phases"]["P1"]
    finally:
        shutil.rmtree(d.parent, ignore_errors=True)
    return "9 tasks onto P1, P5 (with the look round), P7, P8, P9 (rework before the critic), P10; a look and its 8 s; one check"
