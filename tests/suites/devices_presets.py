"""Devices and screens are variables (D-140): a three beat names the device_shot preset, and its device, screen and mood
are params the engine swaps after the storyboard (`py -m loom device`, the agents' set_device). A preset beat needs no
author; the storyboard gate checks its params against the preset's card; the swap is validated and logged; the preset
renders every device deterministically. Each test has a control."""
from __future__ import annotations

import json
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
from relay_improvements import _copy_demo  # noqa: E402
from loom import devices as DV  # noqa: E402
from loom import three_bridge as TBR  # noqa: E402
from loom.util import LoomError, read_json, write_json  # noqa: E402

PHONE = {"device": "phone", "screen": {"kind": "code", "title": "t", "code": "1234"}, "notify": {"title": "a", "line": "b"}}


def _device_beat(p, beat="b07", params=None):
    f = p.path("plan/storyboard.json")
    sb = read_json(f)
    sc = next(s for s in sb["scenes"] if s["beat"] == beat)
    for k in ("template", "props", "blueprint", "scene", "design"):
        sc.pop(k, None)
    sc["kind"] = "three"
    sc["three"] = {"preset": "device_shot", "rect": [160, 110, 1600, 780], "params": dict(params or PHONE)}
    write_json(f, sb)
    return sc


def _swaps(p):
    f = p.path("logs/decisions.jsonl")
    return [json.loads(x) for x in f.read_text(encoding="utf-8").splitlines() if '"device_swap"' in x] if f.exists() else []


def pipeline_device_swap_is_validated_logged_and_drops_what_no_longer_fits():
    """swap(b07, laptop): the device changes, the phone-only banner is dropped and said, one device_swap is logged. A
    device that is not in the preset's card is refused and the storyboard is unchanged. Control: a beat that is not a
    device beat is refused."""
    with fresh_project() as p:
        _copy_demo(p, subs=("plan",))
        _device_beat(p)
        r = DV.swap(p, "b07", device="laptop", screen={"kind": "terminal", "lines": ["make test"]})
        sc = next(s for s in read_json(p.path("plan/storyboard.json"))["scenes"] if s["beat"] == "b07")
        assert sc["three"]["params"]["device"] == "laptop" and sc["three"]["params"]["screen"]["kind"] == "terminal"
        assert "notify" not in sc["three"]["params"] and r["dropped"] == ["notify"], r
        assert len(_swaps(p)) == 1
        before = p.path("plan/storyboard.json").read_text(encoding="utf-8")
        try:
            DV.swap(p, "b07", device="toaster"); raise AssertionError("an unknown device was accepted")
        except LoomError as e:
            assert "toaster" in str(e)
        assert p.path("plan/storyboard.json").read_text(encoding="utf-8") == before and len(_swaps(p)) == 1
        try:
            DV.swap(p, "b03", device="phone"); raise AssertionError("a template beat was swapped")
        except LoomError as e:
            assert "not a device beat" in str(e)
    return "device and screen swapped, banner dropped and said, one swap logged; unknown device and non-device beat refused"


def pipeline_a_preset_beat_needs_no_author_and_the_gate_checks_its_params():
    """A device_shot beat is not in scenes_needed and has no clip target (nothing to write); check_storyboard reports a
    device outside the card and an unknown param, and accepts the valid params. Control: the same beat with a file
    instead of a preset is still authored."""
    from loom import flow
    from loom.agents.tools import clip_target
    from loom.checks.gates import check_storyboard
    with fresh_project() as p:
        _copy_demo(p)
        sc = _device_beat(p)
        assert "b07" not in [s["beat"] for s in flow.scenes_needed(p)]
        assert clip_target(p, sc) is None
        E_ok, _ = check_storyboard(p)
        assert not any("preset" in e for e in E_ok), [e for e in E_ok if "preset" in e]
        _device_beat(p, params=dict(PHONE, device="toaster", colour="red"))
        E_bad, _ = check_storyboard(p)
        assert any("toaster" in e for e in E_bad) and any("unknown params" in e for e in E_bad), E_bad[:4]
        f = p.path("plan/storyboard.json"); sb = read_json(f)
        b = next(s for s in sb["scenes"] if s["beat"] == "b07"); b["three"] = {"file": "scenes/b07_three.js"}; write_json(f, sb)
        assert "b07" in [s["beat"] for s in flow.scenes_needed(p)]
    return "preset beat skipped by authors, params gated; control: a file beat is authored"


def _browser() -> str | None:
    return browser()   # the shared check (tests/browser_support.py): env var, else the HyperFrames Chrome (L-127)


def primitive_device_shot_renders_every_device_the_same_way_twice():
    """device_shot renders phone, tablet, laptop, monitor and desk_set from params alone; the same params give the same
    pixels twice; the devices differ from each other (control: the comparison can fail)."""
    if not _browser():
        return "skipped (no browser here)"
    from loom.compose import load_style
    st = load_style("corporate-clean")
    src = TBR.PRESETS / "device_shot.js"
    work = Path(tempfile.mkdtemp(prefix="loomdev_"))
    try:
        shots = {}
        for dev in ["phone", "tablet", "laptop", "monitor", "desk_set", "phone"]:
            d = work / f"{dev}_{len(shots)}"; d.mkdir()
            job = {"beat": "t", "src": src, "w": 240, "h": 136, "mb": (1, 0.5), "stills": [1.5],
                   "ctxd": {"beat": "t", "duration": 2.0, "cues": {}, "params": {"device": dev, "screen": {"kind": "lock", "title": "x"}, "arrive_at": 0.1},
                            "palette": st["palette"], "faces": TBR.faces_of(st), "fonts": {"display": "x", "body": "x"}, "speech": [0, 2], "size": [240, 136]}}
            TBR._invoke(job, "draft", d)
            shots.setdefault(dev, []).append((d / "still_1.50.png").read_bytes())
        assert shots["phone"][0] == shots["phone"][1], "the same params rendered two different phones"
        frames = [v[0] for v in shots.values()]
        assert len(set(frames)) == 5, "two devices rendered the same picture"
    finally:
        shutil.rmtree(work, ignore_errors=True)
    return "five devices from params; the phone twice identical; all five differ"


def primitive_device_shot_frame_does_not_depend_on_the_first_frame_rendered():
    """K.arrive and K.sway keep a home pose; it must not be captured from whatever time is rendered first. The frame at
    3.0 s is the same rendered alone or after 0.2 s (the arrival, when the device is still turning). Control: 0.2 s and
    3.0 s differ."""
    if not _browser():
        return "skipped (no browser here)"
    from loom.compose import load_style
    st = load_style("corporate-clean")
    src = TBR.PRESETS / "device_shot.js"
    work = Path(tempfile.mkdtemp(prefix="loomdevorder_"))
    try:
        out = []
        for i, stills in enumerate(([3.0], [0.2, 3.0])):
            d = work / str(i); d.mkdir()
            job = {"beat": "t", "src": src, "w": 240, "h": 136, "mb": (1, 0.5), "stills": stills,
                   "ctxd": {"beat": "t", "duration": 4.0, "cues": {}, "params": {"device": "tablet", "screen": {"kind": "blank"}, "arrive_at": 0.1},
                            "palette": st["palette"], "faces": TBR.faces_of(st), "fonts": {"display": "x", "body": "x"}, "speech": [0, 4], "size": [240, 136]}}
            TBR._invoke(job, "draft", d)
            out.append(d)
        a, b = (out[0] / "still_3.00.png").read_bytes(), (out[1] / "still_3.00.png").read_bytes()
        assert a == b, "the frame at 3.0 s depends on which frame was rendered first"
        assert (out[1] / "still_0.20.png").read_bytes() != b
    finally:
        shutil.rmtree(work, ignore_errors=True)
    return "same frame alone or after the arrival; control frames differ"


def agents_router_sends_a_device_beats_defects_to_the_storyboard():
    """A defect in a device_shot beat goes to the storyboard (its params are the storyboard's), a throw inside the
    preset to the engine. Control: the same defect on a three beat with its own file still goes to the engine."""
    from loom.agents.router import owner_of, THROW_CODES
    pre = {"b07": {"beat": "b07", "kind": "three", "three": {"preset": "device_shot", "params": {"device": "phone"}}}}
    own = {"b07": {"beat": "b07", "kind": "three", "three": {"file": "scenes/b07_three.js"}}}
    assert owner_of("element_off_frame", "b07", pre) == "storyboard"
    assert owner_of(sorted(THROW_CODES)[0], "b07", pre) == "engine"
    assert owner_of("element_off_frame", "b07", own) == "engine"
    return "preset beat defects to the storyboard, its throws to the engine; control: a file beat stays with the engine"


def pipeline_model_shot_params_name_a_real_model_and_its_keys():
    """model_shot (D-147): the gate refuses a model that is not in the library and a state key the model's card does
    not list, and accepts the model's own keys and `t`. Control: the valid params give no error, so the check can pass."""
    ok = {"kind": "three", "three": {"preset": "model_shot", "rect": [192, 54, 1536, 864],
                                      "params": {"model": "server_rack", "states": [{"key": "load", "from": 0, "to": 1, "say": "x"},
                                                                                    {"key": "t", "from": 0, "to": 1, "say": "y"}]}}}
    assert TBR.preset_errors(ok) == [], TBR.preset_errors(ok)
    bad_model = json.loads(json.dumps(ok)); bad_model["three"]["params"]["model"] = "toaster_9000"
    E = TBR.preset_errors(bad_model)
    assert any("toaster_9000" in e and "not a library model" in e for e in E), E
    bad_key = json.loads(json.dumps(ok)); bad_key["three"]["params"]["states"].append({"key": "explode", "from": 0, "to": 1, "say": "z"})
    E = TBR.preset_errors(bad_key)
    assert any("explode" in e for e in E) and not any("not a library model" in e for e in E), E
    return "unknown model and unknown key refused; the model's keys and t accepted (control passes)"
