"""The toolbox loader (D-137) and the 3D model library (D-138). The loader is code (no model call): use_tool hands an
agent the sections it asks for and logs the load; the menu sits in the planning and building prompts only; a scene's
`tools` reach its worker without asking; the storyboard gate refuses a tool that does not exist. The models obey the
clip laws (cards, determinism, token colours, no words of their own), all load in the real renderer, are a pure
function of time, and an interrupted Three.js render resumes from its kept frames. Each test has a control."""
from __future__ import annotations

import os
import shutil
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))   # tests/: one browser check for every suite
from browser_support import browser  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(Path(__file__).resolve().parent))

from agents_runtime import fresh_project  # noqa: E402
from relay_improvements import _copy_demo, _first_bespoke  # noqa: E402
from loom import ledger as L  # noqa: E402
from loom import models3d as M3  # noqa: E402
from loom import toolbox as TB  # noqa: E402
from loom.agents import tools as T  # noqa: E402
from loom.agents import runtime as RUN  # noqa: E402
from loom.agents.conductor import task_message  # noqa: E402
from loom.util import read_json, write_json  # noqa: E402


def _browser() -> str | None:
    return browser()   # the shared check (tests/browser_support.py): env var, else the HyperFrames Chrome (L-127)


def _tool_loads(p):
    f = p.path("logs/decisions.jsonl")
    if not f.exists():
        return []
    import json
    return [json.loads(x) for x in f.read_text(encoding="utf-8").splitlines() if '"tool_load"' in x]


def agents_use_tool_loads_what_is_asked_and_logs_it():
    """use_tool(["three", "matter", "nope"]): three and physics (an alias) come back with their sections, the 3D model
    list is attached to three, the unknown name is reported with the list of tools, and one tool_load decision is
    logged. Control: a call with only an unknown name loads nothing and logs nothing."""
    with fresh_project() as p:
        _copy_demo(p, subs=("plan",))
        ctx = T.ToolContext(project=p, role="scene", stage="scenes", beat="b03")
        before = len(_tool_loads(p))
        out = T.TOOLS["use_tool"].fn(ctx, names=["three", "matter", "nope"])
        assert out["loaded"] == ["three", "physics"], out["loaded"]
        assert out["sections"]["three"].startswith("## three") and "`phone`" in out["sections"]["three"], "no model list"
        assert out["sections"]["physics"].startswith("## physics")
        assert out["unknown"] == ["nope"] and "skia" in out["tools"]
        assert ctx.state["tools_loaded"] == ["three", "physics"]
        assert len(_tool_loads(p)) == before + 1
        out2 = T.TOOLS["use_tool"].fn(ctx, names=["nope"])
        assert out2["loaded"] == [] and len(_tool_loads(p)) == before + 1, "a failed load was logged"
    return "two tools (one by alias) loaded with the model list; unknown reported; one load logged; control logs none"


def agents_toolbox_menu_is_in_the_planning_and_building_prompts_only():
    """The menu (docs/TOOLBOX.md '## Menu') is in the cached prompt of the storyboard, scene, clip, kit and tweak roles,
    and use_tool is in their tool lists. Control: the brief and script roles have neither."""
    menu = TB.menu()
    assert menu.startswith("## Menu") and "| `three` |" in menu
    for role in RUN.MENU_ROLES:
        assert menu in RUN.role_system(role)[-1], f"{role}: no menu"
        assert "use_tool" in T.ROLE_TOOLS[role], f"{role}: no use_tool"
    for role in ("brief", "script"):
        assert menu not in "".join(RUN.role_system(role)), f"{role}: the menu leaked"
        assert "use_tool" not in T.ROLE_TOOLS[role]
    return f"menu and use_tool in {len(RUN.MENU_ROLES)} roles; not in brief or script"


def agents_scene_tasks_carry_the_tools_their_storyboard_named():
    """A bespoke beat whose storyboard scene says tools: ["physics"] hands its worker the physics section; a three beat
    gets the three section without naming it. Control: the same beat with no tools carries no TOOLS block."""
    with fresh_project() as p:
        _copy_demo(p)
        sc = _first_bespoke(p)
        tm = read_json(p.path("audio/timings.json"))
        bt = next(b for b in tm["beats"] if b["id"] == sc["beat"])
        extra = {"scene": dict(sc), "beat_timing": bt, "file": f"scenes/{sc['beat']}.js", "file_abs": str(p.path(f"scenes/{sc['beat']}.js"))}
        plain = task_message(p, "scene", extra)
        assert "TOOLS LOADED FOR THIS BEAT" not in plain
        extra["scene"]["tools"] = ["physics"]
        msg = task_message(p, "scene", extra)
        assert "TOOLS LOADED FOR THIS BEAT" in msg and "## physics" in msg and "## brush" not in msg
        assert TB.for_scene({"kind": "three"}) == ["three"]
        assert "## three" in TB.handout({"kind": "three"})
    return "named tool handed over, implied three handed over; control: no block without tools"


def pipeline_storyboard_gate_refuses_an_unknown_tool():
    """check_storyboard: a scene naming tools ["teleport"] is refused; ["physics"] passes the same gate. Control: the
    demo storyboard as it is passes."""
    from loom.checks.gates import check_storyboard
    with fresh_project() as p:
        _copy_demo(p)
        E0, _ = check_storyboard(p)
        f = p.path("plan/storyboard.json")
        sb = read_json(f)
        sb["scenes"][0]["tools"] = ["physics"]
        write_json(f, sb)
        E1, _ = check_storyboard(p)
        assert E1 == E0, E1[:3]
        sb["scenes"][0]["tools"] = ["teleport"]
        write_json(f, sb)
        E2, _ = check_storyboard(p)
        assert len(E2) > len(E0) and any("teleport" in e for e in E2), E2[:3]
    return "an unknown tool refused; a real one passes; the demo is unchanged"


def check_model_library_cards_and_laws():
    """models3d.check(): every model in assets/models3d has its card, exports make(), is deterministic, uses no
    literal colour and draws no literal words. Controls: a model with Math.random, a hex colour, a literal word and
    no card is refused on each count; an empty library is red (a zero denominator, Rule 0)."""
    E, _ = M3.check()
    assert not E, E[:5]
    n = len(M3.files())
    assert n >= 20, f"only {n} models"
    keep = M3.LIB
    tmp = Path(tempfile.mkdtemp(prefix="loommodels_"))
    try:
        M3.LIB = tmp
        E, _ = M3.check()
        assert any("no models" in e for e in E), E
        (tmp / "bad.js").write_text("export function make(ctx, THREE, X, opts) { const r = Math.random(); g.fillStyle = '#ff0000';"
                                    " g.fillText('Hello', 0, 0); }\n", encoding="utf-8")
        E, _ = M3.check()
        for want in ("Math.random", "literal colour", "first line", "fillText of a literal"):
            assert any(want in e for e in E), (want, E)
    finally:
        M3.LIB = keep
        shutil.rmtree(tmp, ignore_errors=True)
    return f"{n} models pass; a bad model is refused on four counts; an empty library is red"


def _style():
    from loom.compose import load_style
    return load_style("corporate-clean")


def _job(src, params, w=320, h=240, dur=4.0):
    from loom.three_bridge import faces_of
    st = _style()
    return {"beat": "t", "src": src, "w": w, "h": h, "mb": (1, 0.5),
            "ctxd": {"beat": "t", "duration": dur, "cues": {}, "params": params, "palette": st["palette"], "faces": faces_of(st),
                     "fonts": {"display": st["fonts"]["display"]["family"], "body": st["fonts"]["body"]["family"]},
                     "speech": [0, dur], "size": [w, h]}}


def primitive_every_model_loads_in_the_renderer():
    """One page builds every library model (await X.model for each id, laid out in a row) and renders a frame with no
    error, reading only style tokens. Control: an id that is not in the library makes the render fail."""
    if not _browser():
        return "skipped (no browser here)"
    from loom import three_bridge as TBR
    ids = [c["id"] for c in M3.cards()]
    work = Path(tempfile.mkdtemp(prefix="loomallmodels_"))
    try:
        src = work / "all.js"
        src.write_text("export async function build(ctx, THREE, X) {\n  const st = X.kit.stage(ctx, THREE, X, { frame: [0, 1, 6] });\n"
                       "  const ids = ctx.params.ids; const ms = [];\n"
                       "  for (let i = 0; i < ids.length; i++) { const m = await X.model(ids[i], {}); m.group.position.x = (i - ids.length / 2) * 0.9;"
                       " X.kit.fitHeight(m, 0.8); st.scene.add(m.group); ms.push(m); }\n"
                       "  return { scene: st.scene, camera: st.camera, update(t) { ms.forEach((m) => m.group.rotation.y = t); } };\n}\n",
                       encoding="utf-8")
        d = work / "a"; d.mkdir()
        _, reads = TBR._invoke(dict(_job(src, {"ids": ids}, 640, 240, 1.0), stills=[0.5]), "final", d)
        assert (d / "still_0.50.png").exists()
        assert not reads.get("raw") and reads["palette"], reads
        d2 = work / "b"; d2.mkdir()
        try:
            TBR._invoke(dict(_job(src, {"ids": ids[:1] + ["no_such_model"]}, 160, 120, 1.0), stills=[0.5]), "final", d2)
            raise AssertionError("an unknown model id rendered")
        except Exception as e:  # noqa: BLE001
            assert "no_such_model" in str(e) or "failed" in str(e), str(e)[:300]
    finally:
        shutil.rmtree(work, ignore_errors=True)
    return f"{len(ids)} models built in one page; an unknown id fails the render"


def primitive_a_model_is_a_pure_function_of_time():
    """padlock through model_turntable: the frame at 3.4 s is byte-identical whether rendered after 1.0 s or alone; 1.0 s
    and 3.4 s differ (the shackle opened). Control: that difference is the check's own proof it can fail."""
    if not _browser():
        return "skipped (no browser here)"
    from loom import three_bridge as TBR
    src = ROOT / "scenes_examples" / "three" / "model_turntable.js"
    params = {"model": "padlock", "states": [{"key": "open", "from": 0, "to": 1, "at": 2.0, "dur": 0.9}]}
    work = Path(tempfile.mkdtemp(prefix="loompure_"))
    try:
        a, b = work / "a", work / "b"; a.mkdir(); b.mkdir()
        TBR._invoke(dict(_job(src, params), stills=[1.0, 3.4]), "final", a)
        TBR._invoke(dict(_job(src, params), stills=[3.4]), "final", b)
        x, y, z = (a / "still_3.40.png").read_bytes(), (b / "still_3.40.png").read_bytes(), (a / "still_1.00.png").read_bytes()
        assert x == y, "the same time rendered two different frames"
        assert x != z, "the padlock did not change between 1.0 s and 3.4 s"
    finally:
        shutil.rmtree(work, ignore_errors=True)
    return "same frame in any order; frames differ across the state change"


def primitive_a_three_render_resumes_from_kept_frames():
    """With a frames directory, an interrupted Three.js render keeps its finished frames: a second run reuses them
    (their files are not rewritten) and encodes the same number of frames. Control: deleting one kept frame makes
    the second run render exactly that frame again."""
    if not _browser():
        return "skipped (no browser here)"
    from loom import three_bridge as TBR
    src = ROOT / "scenes_examples" / "three" / "model_turntable.js"
    work = Path(tempfile.mkdtemp(prefix="loomresume_"))
    try:
        fd = work / "frames"
        job = dict(_job(src, {"model": "clock", "states": [{"key": "time", "from": 9, "to": 10, "at": 0, "dur": 0.4}]}, 160, 120, 0.4), frames_dir=fd)
        a = work / "a"; a.mkdir()
        out, _ = TBR._invoke(job, "draft", a)
        frames = sorted(fd.glob("*.png"))
        assert frames and out.exists(), "no frames kept"
        stamp = {f.name: f.stat().st_mtime_ns for f in frames}
        os.remove(frames[1])
        b = work / "b"; b.mkdir()
        out2, _ = TBR._invoke(job, "draft", b)
        again = {f.name: f.stat().st_mtime_ns for f in sorted(fd.glob("*.png"))}
        assert set(again) == set(stamp), "the frame set changed"
        changed = [k for k in again if again[k] != stamp[k]]
        assert changed == [frames[1].name], changed
        assert out2.exists() and out2.stat().st_size > 0
    finally:
        shutil.rmtree(work, ignore_errors=True)
    return f"{len(stamp)} frames kept; a second run re-rendered only the one removed"
