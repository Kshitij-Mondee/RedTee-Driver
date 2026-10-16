"""A lesson made before the kind-of-video rules keeps the rules it was approved under (D-191 follow-up). The bench clone
test cloned gps-position (an explainer of 2026-10-10 with three recall moments) and the new explainer rule refused its
copied plan. A lesson with no `kind_rules` stamp (made before the rules, or a clone of one) keeps the old gates: every
film one recall moment; one created now carries the stamp and gets its kind's rules."""
from __future__ import annotations

import shutil
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def check_kind_rules_apply_to_lessons_made_after_them():
    from loom.checks.gates import _kind_legacy
    from loom.genre import plan_errors
    from loom.project import Project
    from loom.util import read_json, write_json
    d = Path(tempfile.mkdtemp(prefix="loom_legacy_"))
    try:
        write_json(d / "project.json", {"id": "legacy", "topic": "How an online order reaches a customer's door", "mode": "topic",
                                        "request": {"genre": "explainer", "style": "isometric"}})
        old = Project(d)
        assert _kind_legacy(old), "no stamp: a lesson of before the rules"
        new_root = Path(tempfile.mkdtemp(prefix="loom_new_"))
        try:
            import loom.project as LP
            saved = LP.projects_root
            LP.projects_root = lambda: new_root
            try:
                p = Project.create("kind-new", "How an online order reaches a customer's door", None, {"genre": "explainer", "style": "isometric"})
            finally:
                LP.projects_root = saved
            assert read_json(p.path("project.json")).get("kind_rules") == 1 and not _kind_legacy(p), "a new lesson is stamped"
            quiz = {"pacing": {"recall_moments": [{"kind": "quiz", "after_section": "s1"}]}}
            assert plan_errors(p, quiz), "a new explainer with a quiz is refused"
        finally:
            shutil.rmtree(new_root, ignore_errors=True)
        return "an unstamped lesson keeps the old rules; a new one is stamped and its explainer quiz refused"
    finally:
        shutil.rmtree(d, ignore_errors=True)
