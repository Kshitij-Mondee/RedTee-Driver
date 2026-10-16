"""Red runs for tests/suites/relay_upgrade.py (R-46): each mutation puts one pre-upgrade behaviour back in-process,
runs the matching test, and expects it to FAIL; then restores and expects it to PASS. Run from the engine root:
    py docs/research/relay_upgrade/red_runs.py
Writes red_runs.txt beside this file. A test whose feature did not exist before (a new function or tool) is red by
construction on the old engine (ImportError or AttributeError); it is listed with the mutation that removes it."""
from __future__ import annotations

import copy
import io
import sys
import traceback
from contextlib import redirect_stdout
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / "tests" / "suites"))

import relay_upgrade as U  # noqa: E402
from loom import qa as QA  # noqa: E402
from loom.agents import cc_server as CS  # noqa: E402
from loom.agents import conductor as CD  # noqa: E402
from loom.agents import tools as T  # noqa: E402
from loom.agents import runtime as RTM  # noqa: E402
from loom.checks import story as SB  # noqa: E402


def old_prepare(ctx, times, source=None):
    """lab_snapshot_prepare before R-46: times from the beat start, never refused."""
    from loom.util import read_json
    tm = read_json(ctx.project.path("audio/timings.json"), {})
    b = next((x for x in tm.get("beats") or [] if x.get("id") == ctx.beat), None)
    ctx.state["snapshots"] = ctx.state.get("snapshots", 0) + 1
    if source is not None:
        ctx.target.parent.mkdir(parents=True, exist_ok=True)
        ctx.target.write_text(source.rstrip() + "\n", encoding="utf-8")
        ctx.state["drafted"] = True
    priv = QA.private_build(ctx.project)
    return {"build": str(priv), "times": [round(b["start"] + float(t), 2) for t in times[:4]], "beat": ctx.beat, "sha": ""}


def old_sheet(build, times, out, missing=None):
    """snapshot_sheet_build before R-46: three 640 x 360 tiles, no labels, a missing frame dropped silently."""
    from PIL import Image
    snapdir = Path(build) / "snapshots"
    QA.run(QA.hyperframes_cmd() + ["snapshot", "--at", ",".join(f"{t:.2f}" for t in times)], cwd=build, env=QA.hf_env(), timeout=1800)
    got = {round(float(f.stem.split("-at-")[1].rstrip("s")), 2): f for f in snapdir.glob("frame-*-at-*.png")}
    ims = [Image.open(got[round(t, 2)]).convert("RGB").resize((640, 360)) for t in times if round(t, 2) in got]
    sh = Image.new("RGB", (3 * 644, ((len(ims) + 2) // 3) * 364), (17, 17, 17))
    for i, im in enumerate(ims):
        sh.paste(im, ((i % 3) * 644, (i // 3) * 364))
    sh.save(out, quality=88)
    return str(out)


class Swap:
    def __init__(self, obj, name, value):
        self.obj, self.name, self.value = obj, name, value

    def __enter__(self):
        self.keep = getattr(self.obj, self.name)
        setattr(self.obj, self.name, self.value)

    def __exit__(self, *a):
        setattr(self.obj, self.name, self.keep)


class DictSwap:
    def __init__(self, d, key, value):
        self.d, self.key, self.value = d, key, value

    def __enter__(self):
        self.keep = copy.deepcopy(self.d[self.key])
        self.d[self.key] = self.value

    def __exit__(self, *a):
        self.d[self.key] = self.keep


class Both:
    def __init__(self, *cms):
        self.cms = cms

    def __enter__(self):
        for c in self.cms:
            c.__enter__()

    def __exit__(self, *a):
        for c in reversed(self.cms):
            c.__exit__(*a)


_schema_errors = T.schema_errors


def old_schema_errors(obj, path):
    """finding.schema.json before R-46: no "kit" route."""
    e = _schema_errors(obj, path)
    if "finding" in str(path) and isinstance(obj, dict) and obj.get("fix_route") == "kit":
        e = e + ["'kit' is not one of ['knowledge', 'pedagogy', 'script', 'storyboard', 'scene', 'human', 'engine']"]
    return e


snap_params = copy.deepcopy(T.TOOLS["lab_snapshot"].parameters)
snap_params["properties"].pop("edits")

MUTATIONS = [
    ("agents_relayup_snapshot_times_are_on_the_lesson_clock", "times from the beat start, never refused",
     lambda: Swap(T, "lab_snapshot_prepare", old_prepare)),
    ("agents_relayup_snapshot_takes_edits_instead_of_the_whole_file", "no `edits` in lab_snapshot's schema",
     lambda: Swap(T.TOOLS["lab_snapshot"], "parameters", snap_params)),
    ("agents_relayup_a_scene_whose_last_look_threw_is_held", "no hold at submit",
     lambda: Swap(T, "RUNTIME_HOLDS", 0)),
    ("agents_relayup_a_kit_report_reaches_the_kit", "fix_route kit not allowed (read as human)",
     lambda: Both(Swap(T, "FIX_ROUTES", tuple(r for r in T.FIX_ROUTES if r != "kit")), Swap(T, "schema_errors", old_schema_errors))),
    ("agents_relayup_any_role_can_read_the_plan", "no read_artifact for the scene role",
     lambda: DictSwap(T.ROLE_TOOLS, "scene", [x for x in T.ROLE_TOOLS["scene"] if x != "read_artifact"])),
    ("agents_relayup_the_kit_is_previewed_before_it_is_taken", "no kit_preview for the kit role",
     lambda: DictSwap(T.ROLE_TOOLS, "kit", [x for x in T.ROLE_TOOLS["kit"] if x != "kit_preview"])),
    ("agents_relayup_snapshot_sheets_are_large_labelled_and_say_what_is_missing", "the old 3 x 640 sheet",
     lambda: Swap(QA, "snapshot_sheet_build", old_sheet)),
    ("agents_relayup_snapshot_pictures_run_outside_the_lesson_lock_and_calls_are_logged", "lab_snapshot under the server's lock",
     lambda: Swap(CS, "SELF_LOCKED", ())),
    ("agents_relayup_every_builder_and_the_critic_share_the_film_card", "no film card",
     lambda: Swap(CD, "film_card", lambda p: "")),
    ("agents_relayup_a_fresh_storyboard_fixer_sees_the_film", "no film card for a fixer",
     lambda: Swap(CD, "film_card", lambda p: "")),
    ("agents_relayup_craft_notes_are_preloaded_for_the_roles_that_draw_and_judge", "no craft notes",
     lambda: Swap(RTM, "craft_notes", lambda role, style: "")),
    ("agents_relayup_a_template_with_its_own_room_on_a_drawn_station_is_refused", "no people templates checked",
     lambda: Swap(SB, "PEOPLE_TEMPLATES", ())),
    ("agents_relayup_the_pilot_pair_goes_first_and_its_kit_reports_reach_the_kit", "no pilot",
     lambda: Swap(CD.Conductor, "_pilot_jobs", lambda self, jobs, sb: [])),
    ("agents_relayup_the_other_mix_is_named_for_an_illustrated_style", "no note",
     lambda: Swap(CD.Conductor, "mix_note", lambda self: None)),
]
NOT_MUTATED = {
    "agents_relayup_the_planners_get_the_whole_brief_and_the_voice": "red by construction: before R-46 the storyboard message "
    "carried only look/visual_direction/audience/outcome, persona_pick asked for `voice`, the script had no LOOK block "
    "(the three asserts read those strings)",
    "agents_relayup_a_claude_code_prompt_names_tools_in_full": "red by construction: cc_runner.py had no mcp__relay__ name map",
}


def run(name):
    fn = getattr(U, name)
    buf = io.StringIO()
    try:
        with redirect_stdout(buf):
            r = fn()
        return True, str(r)[:160]
    except Exception as e:  # noqa: BLE001
        return False, f"{type(e).__name__}: {str(e)[:200]}"


lines, bad = [], 0
for name, what, mut in MUTATIONS:
    with mut():
        ok_mut, why_mut = run(name)
    ok, why = run(name)
    red_then_green = (not ok_mut) and ok
    bad += not red_then_green
    lines.append(f"{'OK ' if red_then_green else 'BAD'} {name}\n    mutation ({what}): {'PASS (not red!)' if ok_mut else 'FAIL'} {why_mut}\n"
                 f"    restored: {'PASS' if ok else 'FAIL'} {why}")
for name, why in NOT_MUTATED.items():
    lines.append(f"--  {name}\n    {why}")
out = Path(__file__).with_name("red_runs.txt")
out.write_text("\n".join(lines) + f"\n\n{len(MUTATIONS) - bad} of {len(MUTATIONS)} red with the mutation and green restored\n", encoding="utf-8")
print(out.read_text(encoding="utf-8"))
sys.exit(1 if bad else 0)
