"""The kind of video in every planning stage (D-191). Kshitij: "are we using different skills for storyboarding for
different kinds of videos? ... it is asking questions in explainer videos which it shouldn't." Before, only the brief
writer saw the kind; the pedagogy and script gates demanded a recall moment in any video, and the four test lessons of
2026-10-16 (three "how X works" topics) were "teaching" by default, each with a quiz ("Now you. Which do you check first?").

  infer      "auto" reads the kind from the topic: the four test topics read explainer, teaching, explainer, explainer;
             a task ("how do I reset", "setting up") reads teaching; a kind the request names always wins
  reach      Relay's brief, pedagogy, script, outline, storyboard and critic task messages and Shuttle's P1, P3, P4, P5
             and P10 start messages carry the VIDEO KIND block; read_artifact('genre') gives the profile; an
             explainer's pedagogy, script and storyboard reading lists lead with lnd-explainer-craft
  gates      an explainer's plan with a recall moment, script with a quiz or a "now you" line, or brief with a check role
             fails; a teaching film with no recall fails; controls: a teaching quiz and an explainer that only shows pass
"""
from __future__ import annotations

import shutil
import sys
import tempfile
from contextlib import contextmanager
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from loom import genre as G  # noqa: E402
from loom.project import Project  # noqa: E402
from loom.util import write_json  # noqa: E402


@contextmanager
def _lesson(topic: str, genre: str = "auto", notes: str = "", brief: dict | None = None):
    d = Path(tempfile.mkdtemp(prefix="loom_kind_"))
    try:
        write_json(d / "project.json", {"id": "kind-test", "topic": topic, "mode": "topic", "kind_rules": 1,
                                        "request": {"style": "flat-cosmos", "genre": genre, "notes": notes, "length_min": 3}})
        # a finished lesson's plan files, read only, so every stage's task message can be built (the tests change the kind,
        # never the lesson)
        src = ROOT / "projects" / "st-iso-order" / "plan"
        for f in src.glob("*.json"):
            (d / "plan").mkdir(parents=True, exist_ok=True)
            shutil.copy2(f, d / "plan" / f.name)
        from loom.util import read_json
        base = {k: v for k, v in (read_json(src / "brief.json", {}) or {}).items() if k != "genre"}   # the lesson's own kind out
        write_json(d / "plan/brief.json", {**base, **(brief or {})})
        yield Project(d)
    finally:
        shutil.rmtree(d, ignore_errors=True)


TOPICS = {
    "How an AI model turns a question into an answer: the question becomes tokens": "explainer",
    "Setting up two-step sign-in and a password manager at work": "teaching",
    "How a cooling system keeps a data centre running: what happens when one part fails": "explainer",
    "How an online order reaches a customer's door": "explainer",
    "How do I reset my password": "teaching",
    "How to give feedback to a peer": "soft-skills",
    "Our travel expense policy": "policy",
    "Welcome to the finance team": "onboarding",
}


def check_video_kind_auto_reads_the_topic_and_a_named_kind_wins():
    bad = {t: (G.infer(t)[0], want) for t, want in TOPICS.items() if G.infer(t)[0] != want}
    assert not bad, f"misread topics (got, wanted): {bad}"
    with _lesson("How an online order reaches a customer's door") as p:
        assert G.resolve(p)[0] == "explainer"
    with _lesson("How an online order reaches a customer's door", genre="teaching") as p:
        assert G.resolve(p) == ("teaching", "the request names it"), "control: a kind the person names must win"
    with _lesson("Something", brief={"genre": "onboarding"}) as p:
        assert G.of(p) == "onboarding", "with auto, the brief's settled kind is used"
    return f"{len(TOPICS)} topics read right; a named kind wins; the brief settles auto"


def check_video_kind_reaches_every_planning_stage_in_both_pipelines():
    from loom.agents.conductor import task_message
    from loom.shuttle import launch as LA
    from loom.stages import BY_NAME, reading_list
    with _lesson("How an online order reaches a customer's door") as p:
        for role in ("brief", "pedagogy", "script", "storyboard_outline", "storyboard"):
            msg = task_message(p, role, {})
            assert "VIDEO KIND: explainer" in msg, f"Relay's {role} task does not carry the kind"
        assert "No quiz" in task_message(p, "script", {}) or "never" in task_message(p, "script", {}).lower()
        for grp in (("P1", "P4"), ("P5", "P6"), ("P10", "P10")):
            assert "VIDEO KIND: explainer" in LA.start_message(p, grp, {}), f"Shuttle {grp} start message lacks the kind"
        assert "VIDEO KIND" not in LA.start_message(p, ("P8", "P8"), {}), "control: a scene session gets no planning block"
        for st in ("pedagogy", "script", "storyboard"):
            assert reading_list(BY_NAME[st], None, "explainer")[0].endswith("lnd-explainer-craft/SKILL.md"), st
        assert reading_list(BY_NAME["pedagogy"], None, "teaching")[0].endswith("lnd-learning-pedagogy/SKILL.md"), "control"
    return "Relay's five planning roles and Shuttle's P1-P4, P5-P6 and P10 carry the kind; explainer reading leads with its craft"


def _plan(recall):
    return {"pacing": {"recall_moments": recall}}


def _script(lines, recall=None, job="build"):
    return {"beats": [{"id": f"b{i + 1:02d}", "job": job if i == len(lines) - 1 else "build", "narration": [ln],
                       **({"recall": recall} if recall and i == len(lines) - 1 else {})} for i, ln in enumerate(lines)]}


def check_video_kind_gates_refuse_quizzes_in_an_explainer_and_demand_recall_in_teaching():
    quiz = {"kind": "quiz", "after_section": "s1", "answer": "a", "tempting_wrong": "b"}
    with _lesson("How an online order reaches a customer's door") as ex:
        assert G.plan_errors(ex, _plan([quiz])), "an explainer's plan with a quiz passed"
        assert not G.plan_errors(ex, _plan([])), "control: an explainer plan with no recall must pass"
        asks = G.script_errors(ex, _script(["The order lands.", "Now you. Which do you check first?"], recall=quiz, job="check"))
        assert any("recall beats" in e for e in asks) and any("questions to the viewer" in e for e in asks), asks
        too_many = G.script_errors(ex, _script(["Where does it go?", "Who packs it?", "And then what?"]))
        assert any("questions in a explainer" in e or "questions in an explainer" in e for e in too_many), too_many
        ok = G.script_errors(ex, _script(["So where does it go next? To the hub.", "The truck leaves at nine."]))
        assert not ok, f"control: an explainer that asks itself one question and answers it must pass: {ok}"
    with _lesson("Setting up two-step sign-in at work") as te:
        assert any("no recall moment" in e for e in G.plan_errors(te, _plan([]))), "a teaching plan with no recall passed"
        assert not G.script_errors(te, _script(["Now you. Which do you check first?"], recall=quiz, job="check")), \
            "control: a teaching quiz must pass"
    # the brief gate: the kind is known, the person's stands, and an explainer's arc has no check
    from loom.checks.gates import check_brief
    arc = [{"role": r, "what": f"the {r} of the order story"} for r in ("hook", "what it is", "how it works", "check", "payoff")]
    b = {"genre": "explainer", "arc_plan": arc}
    with _lesson("How an online order reaches a customer's door", brief=b) as p:
        E, _ = check_brief(p)
        assert any("check or practice role" in e for e in E), E
    return "explainer quiz, recall, viewer prompts, too many questions and a check role refused; teaching recall demanded; controls pass"
