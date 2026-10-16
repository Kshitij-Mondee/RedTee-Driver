"""The narration speed by kind of video (D-196). Kshitij on the speed tests: "1 sounds a bit too fast ... Teaching - 0.8 sounds
good, explainer - 0.9, product explainer - 0.9 or .95 and onboarding - 0.85 to 1". Before, a calibration measured the rate
over speech time only (pauses removed) against a target that includes them and slowed every Kokoro voice to its 0.7 floor
(47 of 74 calibrated lessons at 0.70 to 0.73; docs/research/2026-10-16-narration/SPEED_FINDING.md).

  auto       a request voice speed of "auto" (the default) becomes the kind's speed, written into the request with why
  named      a speed the request names is kept as it is (the person's choice wins)
  calibrate  the old calibration runs only when the request asks for it (`voice.calibrate: true`), never under 0.8
"""
from __future__ import annotations

import inspect
import shutil
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))


def _project(genre: str, speed):
    from loom.project import Project
    from loom.util import write_json
    d = Path(tempfile.mkdtemp(prefix="loom_speed_"))
    write_json(d / "project.json", {"id": "speed-test", "topic": "Setting up two-step sign-in", "mode": "topic", "kind_rules": 1,
                                    "request": {"genre": genre, "style": "screencast", "voice": {"provider": "kokoro", "voice": "af_heart", "speed": speed}}})
    return d, Project(d)


def check_narration_speed_follows_the_kind_of_video_and_a_named_speed_wins():
    from loom import narrate as N
    from loom.util import read_json
    got = {}
    for genre, want in (("teaching", 0.8), ("explainer", 0.9), ("onboarding", 0.9), ("policy", 0.8), ("soft-skills", 0.85)):
        d, p = _project(genre, "auto")
        try:
            N._resolve_speed(p)
            v = read_json(d / "project.json")["request"]["voice"]
            assert v["speed"] == want and genre in v["speed_by"], (genre, v)
            got[genre] = v["speed"]
        finally:
            shutil.rmtree(d, ignore_errors=True)
    d, p = _project("teaching", 1.05)
    try:
        N._resolve_speed(p)
        assert read_json(d / "project.json")["request"]["voice"]["speed"] == 1.05, "control: a named speed is kept"
    finally:
        shutil.rmtree(d, ignore_errors=True)
    from loom.project import DEFAULT_REQUEST
    assert DEFAULT_REQUEST["voice"]["speed"] == "auto", DEFAULT_REQUEST["voice"]
    src = inspect.getsource(N.narrate)
    assert 'voice.get("calibrate") is not True' in src and "max(0.8," in src, "the calibration is opt-in and never under 0.8"
    assert N.KIND_SPEED["product"] in (0.9, 0.92, 0.95)
    return f"auto speeds {got}; a named 1.05 kept; calibration opt-in, floor 0.8"
