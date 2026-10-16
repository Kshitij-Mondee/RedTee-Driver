"""D-148 (Kshitij, 2026-10-09: "is there no way to reduce the context?", then "build the first, second, fourth and ...
library places and objects for the set ... fewer, cheaper lead turns during the check loop ... pictures sent only at the
size the judgment needs ... don't force it to choose the pre made scenes or assets"). The measured run (R-40) put 1.33 MB
of hand-over text through the lead and its P7 to P9 session reached 314 thousand tokens
(docs/research/2026-10-09-measured-run-assets-and-cost.md). Offline: no model call.

Each test has a control that shows it can fail; the red runs on the old code are in docs/research/shuttle/red_runs.txt."""
from __future__ import annotations

import base64
import io
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from shuttle_rails import GOOD_KIT, KIT_SRC, LEAD, _replan, lesson  # noqa: E402
from loom import flow  # noqa: E402
from loom.shuttle import agents as AG  # noqa: E402
from loom.shuttle import launch as LA  # noqa: E402
from loom.shuttle import rails as RL  # noqa: E402
from loom.shuttle import server as SV  # noqa: E402
from loom.shuttle.server import Server  # noqa: E402
from loom.util import LoomError, read_json  # noqa: E402


def _at_p8(p):
    """A lesson in P8 with a kit whose pilot passed: beats may be delegated."""
    rl = RL.Rails(p)
    p.path("scenes/_kit.js").write_text(KIT_SRC, encoding="utf-8")
    rl.update(lambda st: st.__setitem__("kit_preview", {"hash": rl.file_hash("scenes/_kit.js")}))
    rl.update(lambda st: st.__setitem__("pilot", {"beats": rl.pilot_beats(), "pass": True, "kit": rl.file_hash("scenes/_kit.js")}))
    _replan(p)
    p.set_stage("scenes", status="pending")
    return rl


def agents_shuttle_hands_over_by_reference():
    """The first cut: `delegate` stores the sub-agent's whole brief (the lead's part and the engine's context) and returns
    a short spawn prompt; the sub-agent reads its brief with its token; another sub-agent cannot; a long brief comes back
    in parts that rebuild it exactly, each within the reply cap. Control: before, the spawn prompt WAS the whole brief."""
    with lesson("P6", kit_beat="b10") as p:
        rl = _at_p8(p)
        srv = Server(str(p.root))
        r, _ = srv.call("delegate", {"agent": "scene-author", "beats": ["b10"], "brief": "b10: the spaced reviews lift the curve."})
        assert r.get("token"), r
        tok, prompt = r["token"], r["spawn"]["prompt"]
        whole = p.path(r["brief"]["file"]).read_text(encoding="utf-8")
        assert "THE ENGINE'S CONTEXT" in whole and "the spaced reviews lift the curve" in whole and tok in whole
        assert "THE ENGINE'S CONTEXT" not in prompt and f"brief:{tok}" in prompt and len(prompt) < 900, prompt
        carried = len(json.dumps(r))
        assert carried < 2500 and len(whole) > 4 * carried, (carried, len(whole))      # what the lead carries, against what it hands over
        me = {"who": "scene-author", "token": tok}
        no = rl.allow("lab_snapshot", me, {"beat": "b10"})
        assert no and "read your whole brief" in no and f"brief:{tok}" in no, no      # nothing written before the brief is read
        y, _ = srv.call("read_artifact", {"name": f"brief:{tok}"})                     # the lead's read does not count for it
        assert y.get("text") and rl.allow("lab_snapshot", me, {"beat": "b10"}) == no
        b, _ = srv.call("read_artifact", {"name": f"brief:{tok}", "owner": tok})
        assert b.get("text", "").startswith("THE LEAD'S BRIEF") and b["part"] == "1 of 1" and "next" not in b, b
        assert rl.allow("lab_snapshot", me, {"beat": "b10"}) is None, rl.allow("lab_snapshot", me, {"beat": "b10"})
        other = rl.delegate("fixer", ["b05"], None, "fix b05")["token"]
        x, _ = srv.call("read_artifact", {"name": f"brief:{tok}", "owner": other})
        assert "another sub-agent's" in (x.get("refused") or ""), x
        assert y.get("text") == b["text"]                                    # the lead may read any brief
        long = "THE LEAD'S BRIEF:\n" + "".join(f"line {i} of a long fixer brief with its findings\n" for i in range(3000))
        p.path(r["brief"]["file"]).write_text(long, encoding="utf-8")
        got, k, replies, refusals = [], 1, [], []
        while True:
            res, _ = srv.call("read_artifact", {"name": f"brief:{tok}#{k}" if k > 1 else f"brief:{tok}", "owner": tok})
            got.append(res["text"])
            replies.append(SV._content(res, [])["content"][0]["text"])
            refusals.append(rl.allow("lab_snapshot", me, {"beat": "b10"}))
            if "next" not in res:
                break
            k += 1
        assert "".join(got) == long and len(got) == 3, (len(got), len("".join(got)), len(long))
        assert all(len(t) <= SV.MAX_REPLY and "[cut]" not in t for t in replies), [len(t) for t in replies]
        assert "parts 2, 3 of 3" in (refusals[0] or "") and "part 3 of 3" in (refusals[1] or "") and refusals[2] is None, refusals
        rec, _ = srv.call("collect", {"token": tok, "force": True})
        assert rec.get("brief_read") == "3 of 3 parts", rec
    return (f"spawn prompt {len(prompt)} chars, delegate reply {carried} chars, brief {len(whole)} chars read by the sub-agent; "
            f"another token refused; no write before the whole brief is read; a {len(long)}-char brief in {len(got)} parts, rebuilt exactly")


def _names(p, session: str | None) -> set:
    keep = os.environ.pop("LOOM_SHUTTLE_SESSION", None)
    try:
        if session:
            os.environ["LOOM_SHUTTLE_SESSION"] = session
        return {t["name"] for t in Server(str(p.root)).list_tools()}
    finally:
        os.environ.pop("LOOM_SHUTTLE_SESSION", None)
        if keep:
            os.environ["LOOM_SHUTTLE_SESSION"] = keep


def agents_shuttle_a_session_lists_only_its_tools():
    """The fourth cut: a session's loom-mcp lists its phase's tools, the tools every phase needs and its sub-agents' (they
    call through the same server); every tool a sub-agent card names for a phase is in that phase's list. The launcher
    passes the session through mcp.json. Control: without a session every tool is listed (tests, a person's use)."""
    with lesson() as p:
        every = _names(p, None)
        p1, p2, p5, p8, p10, p11, p79 = (_names(p, s) for s in ("P1", "P2", "P5", "P8", "P10", "P11", "P7-P9"))
        assert len(every) == len(RL.TOOLS), (len(every), len(RL.TOOLS))
        assert "submit_brief" in p1 and not {"submit_storyboard", "lab_snapshot", "render", "critic_review", "compose", "narrate"} & p1, p1
        assert {"submit_knowledge", "skeptic_review", "delegate", "collect", "request_approval"} <= p2
        assert {"submit_storyboard", "patch_storyboard", "catalog_search", "use_tool", "set_device", "get_world_pack"} <= p5 and "lab_snapshot" not in p5
        assert {"lab_snapshot", "submit_scene", "render_clip", "pilot_check", "check", "contact_sheet", "read_artifact"} <= p8
        assert not {"submit_brief", "critic_review", "render", "submit_knowledge", "narrate", "submit_storyboard", "new_lesson"} & p8, p8
        assert {"critic_review", "submit_review", "lab_snapshot", "check", "frames"} <= p10 and {"render", "check"} <= p11
        assert p8 <= p79 and "kit_preview" in p79 and "submit_kit" not in p8
        for a in AG.load().values():
            for ph in (RL.IDS if "any" in a["phases"] else a["phases"]):
                assert set(a["tools"]) <= _names(p, ph), (a["name"], ph, set(a["tools"]) - _names(p, ph))
        size = lambda names: sum(len(json.dumps(t)) for t in Server(str(p.root)).list_tools() if t["name"] in names)
        files = LA.write_configs(p, "sonnet", None, session="P8")
        env = read_json(files["mcp"])["mcpServers"]["loom"]["env"]
        assert env.get("LOOM_SHUTTLE_SESSION") == "P8", env
        sizes = {k: size(v) for k, v in (("all", every), ("P1", p1), ("P8", p8))}
    return (f"{len(every)} tools in all ({sizes['all']} chars of schema); P1 lists {len(p1)} ({sizes['P1']} chars), P8 {len(p8)} "
            f"({sizes['P8']}), P10 {len(p10)}; every card's tools listed where it works; mcp.json carries the session")


class _Fake:
    init, killed, limit, stderr = {"session_id": None}, None, None, []

    def __init__(self):
        self.result = {"is_error": False, "result": "ok"}


def agents_shuttle_one_session_per_phase_and_a_reopen_is_not_a_failed_try():
    """The second cut: one lead session per phase. A phase entered again after a reopen starts a fresh session from the
    notes (it made progress: not a failed try); a session that changed nothing is resumed once with what is missing, and
    a second such session fails the run. Control: with the old groups the P6 session after the P5 one was a "retry"."""
    with lesson() as p:
        state = {"cur": "P5", "mark": 0}
        seen = []
        plan = {1: ("P6", 1), 2: ("P5", 2), 3: ("P6", 3), 4: ("P6", 3), 5: ("P6", 3)}    # session -> (current, mark) after it

        def status(self):
            return {"stop": None, "waiting": None, "current": state["cur"],
                    "phases": [{"phase": x, "name": RL.NAMES[x], "status": "open" if x == state["cur"] else "accepted",
                                "missing": ["test: not done"] if x == state["cur"] else []} for x in RL.IDS]}

        def fake(project, mode, lead, group, prompt, session, resume, *a, **k):
            seen.append((RL.gkey(group), resume, "THE LAST SESSION ENDED" in prompt))
            state["cur"], state["mark"] = plan[len(seen)]
            return _Fake()

        keep = (LA.run_session, RL.Rails.status, RL.Rails.progress_mark, RL.Rails.current, LA.cfg)
        LA.run_session = fake
        RL.Rails.status = status
        RL.Rails.progress_mark = lambda self: str(state["mark"])
        RL.Rails.current = lambda self: state["cur"]
        LA.cfg = lambda: dict(keep[4](), session_split="phase")           # the per-phase split, set in config
        try:
            code = LA.run(p, mode="subscription", lead="sonnet")
        finally:
            LA.run_session, RL.Rails.status, RL.Rails.progress_mark, RL.Rails.current, LA.cfg = keep
        assert seen == [("P5", False, False), ("P6", False, False), ("P5", False, False), ("P6", False, False), ("P6", True, True)], seen
        assert code == LA.EXIT["failed"], code
        assert read_json(p.path("logs/shuttle/state.json"))["run"]["split"] == "phase"
        # the default (mixed, L-373): P5 and P6 are one session, so the same reopen is done inside it
        state.update(cur="P5", mark=0)
        seen.clear()
        plan.update({1: ("P5", 1), 2: ("P5", 2), 3: ("P7", 3), 4: ("P7", 3), 5: ("P7", 3)})
        keep = (LA.run_session, RL.Rails.status, RL.Rails.progress_mark, RL.Rails.current)
        LA.run_session = fake
        RL.Rails.status = status
        RL.Rails.progress_mark = lambda self: str(state["mark"])
        RL.Rails.current = lambda self: state["cur"]
        try:
            LA.run(p, mode="subscription", lead="sonnet")
        finally:
            LA.run_session, RL.Rails.status, RL.Rails.progress_mark, RL.Rails.current = keep
        assert {k for k, _, _ in seen} == {"P5-P6", "P7"} and seen[0][0] == "P5-P6" and seen[-1][0] == "P7", seen   # no P5 or P6 session of its own
    return ("per phase: P5, P6, P5 again after a reopen (fresh), P6, P6 resumed once, then the run fails; "
            "mixed (the default): P5-P6 sessions, then P7")


def agents_shuttle_a_session_ends_when_its_phase_is_behind_it():
    """A session whose phase is accepted, or that reopened an earlier phase, gets PAST_WINDOW more lead messages (its
    handoff) and is then ended: the next phase starts fresh with its own tools. Sub-agent messages do not count, and
    going back inside the window (a fixer's draft opens P8 again during P9) is not leaving it."""
    with lesson() as p:
        def msg(i, par=None):
            return json.dumps({"type": "assistant", "parent_tool_use_id": par, "message": {
                "id": f"m{i}", "model": "claude-sonnet-5-5", "usage": {"input_tokens": 10, "output_tokens": 1}, "content": []}})

        now = {"cur": "P9"}
        s = LA.Stream(p, "subscription", "none", "P9")
        s.rails.current = lambda: now["cur"]
        for i in range(30):
            s.line(msg(i))
        now["cur"] = "P8"                                    # a fixer's draft: back inside, not a reopen
        for i in range(30, 60):
            s.line(msg(i))
        assert not s.killed, s.killed
        now["cur"] = "P10"
        for i in range(60, 90):
            s.line(msg(i, par="toolu_sub"))                  # a sub-agent's messages
        for i in range(90, 90 + LA.PAST_WINDOW):
            s.line(msg(i))
        assert not s.killed, s.killed
        s.line(msg(200))
        assert (s.killed or "").startswith("session over") and "P9 is accepted" in s.killed, s.killed
        s2 = LA.Stream(p, "subscription", "none", "P10")
        s2.rails.current = lambda: "P10"
        RL.Rails(p).update(lambda st: st["reopens"].append({"phase": "P5", "beats": ["b03"], "at": RL.now(), "reason": "test"}))
        for i in range(300, 301 + LA.PAST_WINDOW):
            s2.line(msg(i))
        assert s2.killed and "P5 was reopened" in s2.killed, s2.killed
        s3 = LA.Stream(p, "subscription", "none", "P7-P9")   # the classic split: P8 and P9 are inside
        s3.rails.current = lambda: "P9"
        for i in range(400, 440):
            s3.line(msg(i))
        assert not s3.killed, s3.killed
    return f"ended {LA.PAST_WINDOW + 1} lead messages after P9 was accepted, and after a reopen of P5 from P10; not on going back inside"


def agents_shuttle_a_check_round_is_three_lead_turns():
    """Fewer lead turns in the check loop: delegate takes several jobs in one call (a bad job is named, the rest go out);
    collect(token='all') closes every token whose sub-agent worked and names the ones still open; check composes first
    (one call where the measured run spent two before each of its four checks). Control: a compose failure is reported
    as such, not routed as check defects."""
    with lesson("P6", kit_beat="b10") as p:
        _at_p8(p)
        srv = Server(str(p.root))
        r, _ = srv.call("delegate", {"jobs": [{"agent": "fixer", "beats": ["b05"], "brief": "the syllables are invented words"},
                                              {"agent": "fixer", "beats": ["b10"], "brief": "'nothing' is not the lesson's word"},
                                              {"agent": "fixer", "beats": ["b99"], "brief": "no such beat"}]})
        assert len(r.get("delegated") or []) == 2 and r["not_delegated"][0]["job"]["beats"] == ["b99"], r
        assert all(len(d["spawn"]["prompt"]) < 900 for d in r["delegated"])
        t5, t10 = (d["token"] for d in r["delegated"])
        srv.call("lesson_status", {"owner": t5})                         # b05's fixer made a loom call; b10's did not
        c, _ = srv.call("collect", {"token": "all"})
        assert list(c["collected"]) == [t5] and c.get("still_open") == [t10], c
        stages = []
        keep = flow.run_code

        def stub(project, stage, **kw):
            stages.append(stage)
            if stage == "compose" and stub.fail:
                raise LoomError("compose: scenes/b10.js is missing")

        stub.fail = False
        flow.run_code = stub
        try:
            ok = srv.t_check(LEAD)                                       # the tool itself: the rails' P9 gating is tested elsewhere
            stub.fail = True
            bad = srv.t_check(LEAD)
        finally:
            flow.run_code = keep
        assert stages == ["compose", "check", "compose"], stages
        assert ok.get("passed") is True, ok
        assert bad.get("composed") is False and "b10.js" in bad["error_summary"] and "by_owner" not in bad, bad
    return "3 jobs in one delegate call (1 named and refused), collect('all') took the worked token and named the open one, check composed first"


def agents_shuttle_pictures_at_the_size_the_judgment_needs():
    """Pictures by the judgment, and never smaller than before by default (Kshitij: "hopefully none of these upgrades
    actually bring down the quality of the video"; CLAUDE.md rule 13): the overview sweep (up to 9 beats) is sent at the
    size the lead received before D-148, the model's own limit; `full` shows up to 3 beats, each frame about 1.6 times as
    wide; a smaller overview is a setting (config.json pictures.overview_px) that shrinks only the sweep. The reply says
    what each picture costs. No detail means full. Never enlarged."""
    from PIL import Image
    assert SV.picture_size(800, 400, "overview") == (800, 400)
    assert SV.PICTURE["overview"] == SV.PICTURE["full"], SV.PICTURE                 # the default: no cut

    def sent(res, imgs):
        part = next(c for c in SV._content(res, imgs)["content"] if c["type"] == "image")
        return Image.open(io.BytesIO(base64.b64decode(part["data"]))).size

    with lesson("P6") as p:
        p.path("qa/sheets").mkdir(parents=True, exist_ok=True)
        beats = [f"b{i:02d}" for i in range(1, 10)]                         # a sweep is nine beats
        for b in beats:
            Image.new("RGB", (1936, 404), (200, 190, 170)).save(p.path(f"qa/sheets/{b}.jpg"))
        srv = Server(str(p.root))
        ov = srv.t_contact_sheet(LEAD, beats=beats)
        fu = srv.t_contact_sheet(LEAD, beats=beats, detail="full")
        assert ov["detail"] == "overview" and ov["beats"] == beats and "detail='full'" in ov["note"], ov
        assert fu["beats"] == beats[:3] and fu["not_shown"] == beats[3:], fu
        w1, h1 = sent(ov, [ov["image"]])
        w2, h2 = sent(fu, [fu["image"]])
        with Image.open(ov["image"]) as im:
            before = SV.picture_size(*im.size, "full")       # the old reply (width capped at 1600) as the model's limit then cut it
        assert (w1, h1) == before, ((w1, h1), before)
        assert w2 > 1.5 * w1 and w2 * h2 <= SV.PICTURE["full"][1], (w1, w2)
        snap = srv.t_contact_sheet(LEAD, beats=beats[:3])["image"]
        assert sent({"image": snap}, [snap]) == (w2, h2)                    # no detail: full
        keep = SV.PICTURE["overview"]
        SV.PICTURE["overview"] = (1568, 600_000)                            # the cheaper sweep, as a setting
        try:
            w4, h4 = sent(ov, [ov["image"]])
            w5, h5 = sent(fu, [fu["image"]])
        finally:
            SV.PICTURE["overview"] = keep
        assert w4 * h4 <= 600_000 < w1 * h1 and (w5, h5) == (w2, h2), ((w4, h4), (w5, h5))
        st = RL.Rails(p).load()["looked"]
        assert st[-1].get("detail") and st[-1].get("about_tokens"), st[-1]
    return (f"overview of 9 beats {w1}x{h1} as before (~{ov['about_tokens']} tokens), full of 3 beats {w2}x{h2} (frames "
            f"{w2 / w1:.1f} times as wide); the 600k setting shrinks only the sweep, to {w4}x{h4}")


def agents_kit_brief_offers_the_library_and_never_requires_it():
    """Library places and objects for the set, as an option (Kshitij: "don't force it ... if it thinks they are of use,
    then it can"): the kit-builder's task lists the engine's places with their anchors and its objects with their families,
    read from the runtime; the cards and the playbook say it is an option; a kit that uses none still passes the kit gate.
    Control: before, the kit task named no place and the role card named Loom.obj in passing only."""
    from loom.agents.conductor import task_message
    from loom.capabilities import library_sets
    from loom.checks.kit import kit_errors
    lib = library_sets()
    assert {"office", "meeting", "warehouse"} <= set(lib["places"]) and lib["places"]["meeting"] == ["screen", "table", "seatL", "seatR"]
    assert {"calendar", "clock", "laptop", "document"} <= set(lib["objects"]) and "monitor" in lib["objects"]["laptop"]
    with lesson("P6", kit_beat="b10") as p:
        msg = task_message(p, "kit", {})
        assert "THE ENGINE'S LIBRARY (an option, never a requirement)" in msg and "meeting (anchors screen, table, seatL, seatR)" in msg
        assert "If none fits, draw your own" in msg
        E, _ = kit_errors(p, GOOD_KIT)                                   # no library piece in it
        assert not [e for e in E if "place" in e.lower() or "obj" in e.lower()], E
    assert "never a requirement" in AG.full_prompt(AG.resolve("kit-builder"))
    assert "never a requirement" in LA.lead_prompt() and "Your judgement" in LA.lead_prompt()
    assert "never a requirement" in (ROOT / "loom/agents/roles/kit.md").read_text(encoding="utf-8")
    return f"{len(lib['places'])} places and {len(lib['objects'])} objects offered to the kit-builder as an option; a kit without them passes"


def agents_a_state_file_being_replaced_does_not_stop_the_launcher():
    """S0, 2026-10-09: the launcher read logs/shuttle/state.json while loom-mcp replaced it, Windows refused the open
    (PermissionError) and the launcher died, leaving the session unguarded (as L-350). Now a reader waits out a writer as
    the writer already waited out a reader, and a guard that cannot read is traced and tried on the next message."""
    import builtins
    from loom import util as U
    with lesson() as p:
        f = p.path("logs/shuttle/probe.json")
        U.write_json(f, {"ok": 1})
        real, n = builtins.open, {"left": 2}

        def busy(path, *a, **k):
            if str(path) == str(f) and n["left"] > 0:
                n["left"] -= 1
                raise PermissionError(13, "Permission denied", str(path))
            return real(path, *a, **k)

        U.open = busy                                   # the module's own name for open, as a replace in progress
        try:
            got = U.read_json(f)
        finally:
            del U.open
        assert got == {"ok": 1} and n["left"] == 0, (got, n)
        s = LA.Stream(p, "subscription", "none", "P8")
        keep = s.rails.load

        def refuse():
            raise PermissionError(13, "Permission denied", "state.json")

        s.rails.load = refuse
        s.guards()                                      # raised before: the launcher's stack ended here
        s.rails.load = keep
        tr = p.path("logs/shuttle/trace.jsonl").read_text(encoding="utf-8")
        assert '"guard_unread"' in tr
    return "read_json waited out two refused opens; a guard that could not read was traced, not raised"


def agents_a_launcher_that_fails_kills_its_session():
    """L-363 follow-up: the crashed S0 launcher left its claude -p and loom-mcp running with nobody watching the budget
    or the stream (they had to be stopped by hand). Whatever ends the launcher now kills its session first, and the
    error is traced. Control: a session that ends normally is not killed."""
    import io as _io

    class FakeProc:
        killed = 0

        def __init__(self, *a, **k):
            self.stdin, self.stderr = _io.BytesIO(), _io.BytesIO(b"")
            self.stdout = iter([b'{"type": "system", "subtype": "init", "session_id": "s", "apiKeySource": "none", "mcp_servers": []}\n',
                                b'{"type": "result", "subtype": "success", "total_cost_usd": 0}\n'])
            self.returncode = None
            FakeProc.last = self

        def poll(self):
            return self.returncode

        def kill(self):
            FakeProc.killed += 1
            self.returncode = -9

        def wait(self, timeout=None):
            self.returncode = 0 if self.returncode is None else self.returncode
            return self.returncode

    with lesson() as p:
        keep_popen, keep_line = LA.subprocess.Popen, LA.Stream.line
        LA.subprocess.Popen = FakeProc
        try:
            s = LA.run_session(p, "subscription", "sonnet", ("P1", "P1"), "go", "sid", False, None, None, None, None, claude="fake")
            assert s.result and FakeProc.killed == 0, (s.result, FakeProc.killed)          # control: a normal end
            LA.Stream.line = lambda self, raw: (_ for _ in ()).throw(PermissionError(13, "Permission denied", "state.json"))
            try:
                LA.run_session(p, "subscription", "sonnet", ("P1", "P1"), "go", "sid", False, None, None, None, None, claude="fake")
                raise AssertionError("the launcher's error was swallowed")
            except PermissionError:
                pass
        finally:
            LA.subprocess.Popen, LA.Stream.line = keep_popen, keep_line
        assert FakeProc.killed == 1 and FakeProc.last.returncode == -9, FakeProc.killed
        assert '"launcher_error"' in p.path("logs/shuttle/trace.jsonl").read_text(encoding="utf-8")
    return "a normal session ended untouched; a launcher error killed its session first, traced, and was raised"


def agents_shuttle_a_session_lists_only_its_agents_and_its_menu():
    """Kshitij, 2026-10-09: "It should load them only when needed. Check it out." A captured session start (real
    claude -p on the mock) listed Claude Code's five own sub-agents (one with every tool) and all six Shuttle ones in
    every session, and the toolbox menu in P1 to P4 and P11 where no tool is chosen. Each session now denies the agents
    it cannot use (the deny rule removes them from the list, seen in the capture) and carries the menu only from P5 to
    P10. The menu's own lines say when each tool earns a beat; a tool's section loads on request or with its beat.
    Control: without a session (tests, a person's use) the playbook keeps the menu."""
    with lesson() as p:
        def files(s):
            f = LA.write_configs(p, "sonnet", None, session=s)
            return read_json(f["settings"])["permissions"]["deny"], f["playbook"].read_text(encoding="utf-8")
        d1, pb1 = files("P1")
        d2, _ = files("P2")
        d5, pb5 = files("P5")
        d8, pb8 = files("P8")
        d11, pb11 = files("P11")
        menu = "## The toolbox (load a tool's section with use_tool)"
        assert all(f"Agent({a})" in d for a in LA.BUILTIN_AGENTS for d in (d1, d5, d8)), d1
        assert "Agent(shuttle-kit-builder)" in d1 and "Agent(shuttle-researcher)" not in d1 + d8, d1
        assert "Agent(shuttle-fact-finder)" not in d2 and "Agent(shuttle-fact-finder)" in d8
        assert not {"Agent(shuttle-scene-author)", "Agent(shuttle-clip-author)", "Agent(shuttle-fixer)"} & set(d8), d8
        assert all(t in d1 for t in LA.DENY_TOOLS)
        assert menu not in pb1 and menu not in pb11 and menu in pb5 and menu in pb8
        assert menu in LA.lead_prompt()
    return f"P1 denies {len(d1) - len(LA.DENY_TOOLS)} agents and has no menu; P8 denies {len(d8) - len(LA.DENY_TOOLS)}, keeps its four and the menu"


def agents_shuttle_sub_agents_send_edits_not_whole_files():
    """L-377 (feedback-shuttle-v3): about a third of the sub-agents' cost was output, mostly whole files re-sent with each
    snapshot (fixers 333k output tokens, scene-authors 305k, the kit-builder 207k in 20 calls). After the first draft a
    sub-agent sends `edits` ({old, new}); the server applies them to the current draft and the engine gets exactly the
    file a whole re-send would give. An `old` found twice or not at all is refused and nothing is applied; edits and a
    whole source together are refused; the kit is submitted from its last previewed draft without re-typing it."""
    from loom.agents import tools as T
    from loom.shuttle import kitpreview as KP
    with lesson("P6", kit_beat="b10") as p:
        rl = _at_p8(p)
        srv = Server(str(p.root))
        tok = rl.delegate("fixer", ["b05"], None, "fix b05")["token"]
        f = p.path("scenes/b05.js")
        before = f.read_text(encoding="utf-8")
        line = next(l for l in before.splitlines() if l.strip() and before.count(l) == 1 and len(l) > 20)
        seen = {}
        keep = T.lab_snapshot_prepare
        T.lab_snapshot_prepare = lambda ctx, times, source=None: seen.setdefault("source", source) and {"error": "stopped by the test"}
        try:
            r = srv.t_lab_snapshot({"who": "fixer", "token": tok}, times=[1.0], beat="b05", edits=[{"old": line, "new": line + " // edited"}])
            assert seen["source"] == before.replace(line, line + " // edited", 1), "the edited draft is not the whole-file result"
            bad = srv.t_lab_snapshot({"who": "fixer", "token": tok}, times=[1.0], beat="b05", edits=[{"old": "Loom", "new": "X"}])
            assert "times" in bad["error"] and "exactly once" in bad["error"], bad
            none = srv.t_lab_snapshot({"who": "fixer", "token": tok}, times=[1.0], beat="b05", edits=[{"old": "no such text 123", "new": "X"}])
            assert "0 times" in none["error"], none
            both = srv.t_lab_snapshot({"who": "fixer", "token": tok}, times=[1.0], beat="b05", source=before, edits=[{"old": line, "new": line}])
            assert "not both" in both["error"], both
        finally:
            T.lab_snapshot_prepare = keep
        assert f.read_text(encoding="utf-8") == before                 # a refused edit applied nothing
        shots = {}
        keepk = KP.preview
        KP.preview = lambda project, source: shots.setdefault(len(shots), source) and {"image": str(p.path("build/index.html")), "errors": []}
        p.path("build").mkdir(exist_ok=True); p.path("build/index.html").write_text("x", encoding="utf-8")
        try:
            srv.t_kit_preview({"who": "kit-builder"}, source=KIT_SRC)
            out = srv.t_kit_preview({"who": "kit-builder"}, edits=[{"old": "setState: function (name, t) {}", "new": "setState: function (name, t) { return t; }"}])
        finally:
            KP.preview = keepk
        assert shots[1] == KIT_SRC.replace("setState: function (name, t) {}", "setState: function (name, t) { return t; }") and "error" not in out, (shots, out)
        assert p.path("logs/shuttle/kit_draft.js").read_text(encoding="utf-8") == shots[1].rstrip() + "\n"
        assert RL.Rails(p).load()["kit_preview"]["hash"] == RL.sha(shots[1].rstrip() + "\n")
    return "an edit gave exactly the whole-file draft; twice-found, missing, and edits-with-source refused with nothing applied; the kit previewed from edits"


def agents_shuttle_a_session_starts_with_its_status_and_notes():
    """L-373: each of v3's 26 lead sessions spent its first turns on lesson_status and read_artifact('notes'). The start
    message now carries both (the notes' last part when long, with a pointer to the rest). Control: the person's
    approval notes and a retry message are still there."""
    with lesson("P6") as p:
        RL.Rails(p).update(lambda st: st.setdefault("tokens", {}))
        p.path("logs/shuttle").mkdir(parents=True, exist_ok=True)
        p.path("logs/shuttle/notes.md").write_text("cast: Asha and Ben\n" + "x" * 9000 + "\nLAST LINE of the handoff\n", encoding="utf-8")
        m = LA.start_message(p, ("P7", "P7"), {"plan": {"notes": "keep the clock", "by": "Kshitij"}}, retry="THE LAST SESSION ENDED ...")
        assert "THE LESSON NOW" in m and "P6 narration and animatic" in m and "reopens:" in m, m[:400]
        assert "LAST LINE of the handoff" in m and "read_artifact('notes') for all" in m and "cast: Asha" not in m
        assert "do not fetch them again" in m and "keep the clock" in m and "THE LAST SESSION ENDED" in m
    return "the start message carries the status, the notes' last 8000 characters with a pointer, the person's notes and the retry"


def agents_shuttle_opus_judges_and_sonnet_fixes_in_p10():
    """L-374: v3's P10 Opus lead made 146 calls, most of them running fix rounds (delegate, collect, check). When the
    critique lead and the build lead differ, P10 alternates: the judge (Opus) decides every finding and hands the fixes
    over with plan_fixes; a fix round on the build lead (Sonnet) delegates and checks them and reports fixes_done; the
    judge then re-runs the critic and submits the review. The judge cannot delegate fixers, the fix round cannot judge or
    review, a review waits for an open plan. Control: with one model for both (a Sonnet run) there is no split."""
    assert LA.p10_role(None, ("P10", "P10"), "sonnet", "sonnet") is None
    assert LA.p10_role(None, ("P9", "P9"), "opus", "sonnet") is None
    with lesson("P6", kit_beat="b10") as p:
        _at_p8(p)
        rl = RL.Rails(p)
        assert LA.p10_role(rl, ("P10", "P10"), "opus", "sonnet") == "judge"
        keep = os.environ.pop("LOOM_SHUTTLE_ROLE", None)
        try:
            srv = Server(str(p.root))
            os.environ["LOOM_SHUTTLE_ROLE"] = "judge"
            d = srv.t_delegate(LEAD, agent="fixer", brief="fix b05", beats=["b05"])
            assert "plan_fixes" in (d.get("refused") or ""), d
            assert "fix them yourself" not in (srv.t_plan_fixes(LEAD, fixes=[{"beat": "b05", "fix": "move the tag"}], why="critic major").get("refused") or "x")
            assert rl.load()["fix_plan"]["status"] == "open" and LA.p10_role(rl, ("P10", "P10"), "opus", "sonnet") == "fix"
            assert "still open" in (srv.t_submit_review(LEAD, artifact={"verdict": "ship", "findings": []}).get("refused") or "")
            os.environ["LOOM_SHUTTLE_ROLE"] = "fix"
            assert "does not run the critic" in srv.t_critic_review(LEAD)["refused"]
            assert "does not submit" in srv.t_submit_review(LEAD, artifact={})["refused"]
            assert "plan_fixes is for" in srv.t_plan_fixes(LEAD, fixes=[{"beat": "b05", "fix": "x"}], why="y")["refused"]
            tok = rl.delegate("fixer", ["b05"], None, "fix b05")["token"]
            rl.count_call(tok, "lesson_status", {}, False)
            assert "collect your sub-agents first" in srv.t_fixes_done(LEAD, summary="moved the tag")["refused"]
            rl.collect(tok)
            assert srv.t_fixes_done(LEAD, summary="moved the tag").get("done") is True
            assert LA.p10_role(rl, ("P10", "P10"), "opus", "sonnet") == "judge"
            os.environ.pop("LOOM_SHUTTLE_ROLE")
            assert "fix them yourself" in srv.t_plan_fixes(LEAD, fixes=[{"beat": "b05", "fix": "x"}], why="y")["refused"]
        finally:
            os.environ.pop("LOOM_SHUTTLE_ROLE", None)
            if keep:
                os.environ["LOOM_SHUTTLE_ROLE"] = keep
        names = {t["name"] for t in Server(str(p.root)).list_tools()}
        assert {"plan_fixes", "fixes_done"} <= names
        m = LA.start_message(p, ("P10", "P10"), {}, role="judge")
        assert "THE JUDGE" in m and "the last fix plan: done" in m
    # the launcher: an Opus run alternates judge (opus) and fix (sonnet) in P10; the session keys keep them apart
    with lesson() as p:
        state = {"plan": None}
        seen = []

        def status(self):
            return {"stop": self.load().get("stop"), "waiting": None, "current": "P10",
                    "phases": [{"phase": x, "name": RL.NAMES[x], "status": "open" if x == "P10" else "accepted",
                                "missing": ["test"] if x == "P10" else []} for x in RL.IDS]}

        def fake(project, mode, lead, group, prompt, session, resume, *a, **k):
            seen.append((k.get("role"), lead, (k.get("server_env") or {}).get("LOOM_SHUTTLE_ROLE")))
            nxt = {None: "open", "open": "done", "done": "stop"}[state["plan"]]
            if nxt == "stop":
                RL.Rails(project).update(lambda st: st.__setitem__("stop", {"reason": "budget", "detail": "test ends", "at": RL.now()}))
            else:
                state["plan"] = nxt
                RL.Rails(project).update(lambda st: st.__setitem__("fix_plan", {"status": nxt, "fixes": [{"beat": "b05", "fix": "x"}]}))
            return _Fake()

        keep = (LA.run_session, RL.Rails.status)
        LA.run_session, RL.Rails.status = fake, status
        try:
            LA.run(p, mode="subscription", lead="opus")
        finally:
            LA.run_session, RL.Rails.status = keep
        assert [(r, m) for r, m, _ in seen] == [("judge", "opus"), ("fix", "sonnet"), ("judge", "opus")], seen
        assert all(r == e for r, _, e in seen), seen
    return "judge (opus) plans, fix round (sonnet) fixes and reports, judge again; each refusal holds; no split with one model"


def agents_shuttle_sonnet_only_preset_uses_opus_for_the_storyboard_only():
    """Kshitij, 2026-10-10: "a sonnet only mode where everything is done by sonnet except for the storyboarding which is
    Opus. Opus is not used anywhere else." `--preset sonnet-only`: P5 is its own session on Opus (a session never mixes
    models, so the mixed split's P5-P6 is cut), every other session on Sonnet, no P10 judge and fix split; the preset is
    recorded and kept on resume; allowed on the API path since D-164 (Kshitij, 2026-10-12; D-119 refused it before);
    refused with --build-lead and by an unknown name.
    Control: without the preset the default plan is unchanged (P5-P6 on the run's lead)."""
    with lesson() as p:
        seen = []

        def fake(project, mode, lead, group, prompt, session, resume, *a, **k):
            seen.append((RL.gkey(group), lead))
            RL.Rails(project).update(lambda st: st.__setitem__("stop", {"reason": "budget", "detail": "test ends", "at": RL.now()}))
            return _Fake()

        keep = LA.run_session
        LA.run_session = fake
        try:
            LA.run(p, mode="subscription", preset="sonnet-only")
            run = read_json(p.path("logs/shuttle/state.json"))["run"]
            c0 = LA.cfg()["lead"]
            assert c0["allowed"]["api"] == ["sonnet"] and c0["storyboard"]["api"] == ["opus"], "D-164: Opus on the API path for P5"
            assert c0["planning"]["api"] == ["opus"], "D-167: Opus plans P1 to P5 on the API path"
            bad_preset = dict(LA.cfg()["model_presets"], **{"opus-build": {"lead": "sonnet", "lead_by_group": {"P7-P9": "opus"}}})
            keep_cfg = LA.cfg
            LA.cfg = lambda: dict(keep_cfg(), model_presets=bad_preset)
            try:   # on the API path Opus may plan (P1 to P5), never build
                LA.run(p, mode="api", preset="opus-build")
                raise AssertionError("api: Opus on P7 to P9 accepted")
            except LoomError as e:
                assert "not allowed in api mode" in str(e), e
            finally:
                LA.cfg = keep_cfg
            for bad, kw in (("build", {"build_lead": "opus"}), ("name", {"preset": "no-such"})):
                try:
                    LA.run(p, **dict({"mode": "subscription", "preset": "sonnet-only"}, **kw))
                    raise AssertionError(f"{bad}: accepted")
                except LoomError as e:
                    assert ("--build-lead" in str(e)) if bad == "build" else ("no model preset" in str(e)), e
        finally:
            LA.run_session = keep
        assert run["preset"] == "sonnet-only" and run["lead"] == "sonnet", run
        assert run["leads"] == {"P1-P4": "sonnet", "P5": "opus", "P6": "sonnet", "P7": "sonnet", "P8": "sonnet", "P9": "sonnet",
                                "P10": "sonnet", "P11": "sonnet"}, run["leads"]
        assert seen and seen[0] == ("P1-P4", "sonnet"), seen
        c = LA.cfg()
        assert [RL.gkey(g) for g in LA.split_by_model(LA.groups(c), "opus", None, c)][:2] == ["P1-P4", "P5-P6"]      # control
        assert LA.p10_role(None, ("P10", "P10"), "sonnet", "sonnet") is None
    return "sonnet-only: P1-P4 sonnet, P5 opus (its own session), P6 to P11 sonnet; allowed on the API path (D-164); refused with --build-lead and by an unknown name"


def agents_shuttle_opus_plan_is_the_default_preset():
    """Kshitij, 2026-10-10: "make opus the default for the storyboarding and the lesson script and planning". A subscription
    run that names no --preset, --lead or --build-lead takes config.json default_preset (opus-plan): P1-P4 and P5 on Opus,
    P6 to P11 on Sonnet, recorded in the run state. Control: --lead sonnet keeps every session on Sonnet (no preset), and
    --preset sonnet-only still puts Opus on P5 only"""
    with lesson() as p:
        seen = []

        def fake(project, mode, lead, group, prompt, session, resume, *a, **k):
            seen.append((RL.gkey(group), lead))
            RL.Rails(project).update(lambda st: st.__setitem__("stop", {"reason": "budget", "detail": "test ends", "at": RL.now()}))
            return _Fake()

        keep = LA.run_session
        LA.run_session = fake
        try:
            LA.run(p, mode="subscription")
            run = read_json(p.path("logs/shuttle/state.json"))["run"]
        finally:
            LA.run_session = keep
        assert run["preset"] == "opus-plan", run
        assert run["leads"] == {"P1-P4": "opus", "P5": "opus", "P6": "sonnet", "P7": "sonnet", "P8": "sonnet", "P9": "sonnet",
                                "P10": "sonnet", "P11": "sonnet"}, run["leads"]
        assert seen and seen[0] == ("P1-P4", "opus"), seen
    c = LA.cfg()
    # the API's default is sonnet-only since D-165 (Opus on the storyboard only, D-164); the subscription's stays opus-plan
    assert c["default_preset"]["subscription"] == "opus-plan" and c["default_preset"]["api"] == "opus-plan", c["default_preset"]
    return "no plan named: opus-plan on both paths (P1-P5 opus, P6-P11 sonnet; D-158, D-167)"


def agents_shuttle_brief_parts_come_in_order():
    """L-411 (gps-position: 33 sub-agents asked for brief part 2 first, then had their first write refused, each refusal
    carrying a whole scene source): a sub-agent that asks for a later part first gets the first part it has not read, with a
    note; asking again walks the parts in order; once all are read nothing is refused. The spawn prompt names part 1"""
    with lesson("P6", kit_beat="b10") as p:
        rl = _at_p8(p)
        srv = Server(str(p.root))
        r, _ = srv.call("delegate", {"agent": "scene-author", "beats": ["b10"], "brief": "b10: the spaced reviews lift the curve."})
        tok = r["token"]
        long = "THE LEAD'S BRIEF:\n" + "".join(f"line {i} of a long fixer brief with its findings and more words\n" for i in range(2000))
        p.path(r["brief"]["file"]).write_text(long, encoding="utf-8")
        rl.update(lambda st: st["tokens"][tok].update(brief_parts=3, brief_read=[]))
        me = {"who": "scene-author", "token": tok}
        seen = []
        for _ in range(3):
            res, _ = srv.call("read_artifact", {"name": f"brief:{tok}#3", "owner": tok})
            seen.append((res["part"], bool(res.get("note"))))
        assert seen == [("1 of 3", True), ("2 of 3", True), ("3 of 3", False)], seen
        assert rl.allow("lab_snapshot", me, {"beat": "b10"}) is None
        r2, _ = srv.call("delegate", {"agent": "researcher", "beats": ["b10"], "brief": "b10: " + "x" * 120000})
        assert r2["brief"]["parts"] > 1 and "with no #number" in r2["spawn"]["prompt"], r2["spawn"]["prompt"]
    return "asked for part 3 first: served 1, 2, 3 in order; the spawn prompt names part 1"
