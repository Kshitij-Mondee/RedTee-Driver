"""The narration speed: a range per kind of video, the exact speed decided per lesson (D-196, D-197). Kshitij: "1 sounds a
bit too fast ... Teaching - 0.8 sounds good, explainer - 0.9, product explainer - 0.9 or .95 and onboarding - 0.85 to 1",
then "keep a range for all skills like teaching can be 0.75 - .85 and so on so that there is actually decision made after
looking at the topic and the narration". Before, a calibration measured the rate over speech time only (pauses removed)
and slowed every Kokoro voice to its 0.7 floor (docs/research/2026-10-16-narration/SPEED_FINDING.md).

  decided    "auto" becomes the script's `voice_speed` when it chose one inside the kind's range, else a speed read from the
             narration's density (long words, numbers, sentence length, an audience new to it): denser is slower
  bounds     a script speed outside the range is refused by the script gate and never used; a speed the request names is kept
  reach      Relay's script task and Shuttle's P4 start message carry the VOICE SPEED instruction with the kind's range
  calibrate  the old calibration runs only when the request asks for it, never under 0.8
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


def _project(genre: str, speed, script: dict | None = None, audience: str = "corporate employees"):
    from loom.project import Project
    from loom.util import write_json
    d = Path(tempfile.mkdtemp(prefix="loom_speed_"))
    write_json(d / "project.json", {"id": "speed-test", "topic": "Setting up two-step sign-in", "mode": "topic", "kind_rules": 1,
                                    "request": {"genre": genre, "style": "screencast", "audience": audience,
                                                "voice": {"provider": "kokoro", "voice": "af_heart", "speed": speed}}})
    if script is not None:
        write_json(d / "plan/script.json", script)
    return d, Project(d)


PLAIN = {"beats": [{"id": "b01", "narration": ["Sam opens the app.", "He taps the button.", "It works."]}]}
DENSE = {"beats": [{"id": "b01", "narration": ["Authentication requires a time-based one-time password of 6 digits, regenerated "
                                               "every 30 seconds by the authenticator, derived cryptographically from 1 shared secret "
                                               "provisioned during enrolment through the QR code in 2026."]}]}


def check_narration_speed_is_decided_inside_the_kind_range():
    from loom import narrate as N
    from loom.util import read_json
    seen = {}
    for genre, (lo, hi) in N.KIND_RANGE.items():
        if genre == "product":
            continue   # read as teaching where the product kind is not in this checkout yet
        d, p = _project(genre, "auto", PLAIN)
        try:
            N._resolve_speed(p)
            v = read_json(d / "project.json")["request"]["voice"]
            assert lo <= v["speed"] <= hi and "density" in v["speed_by"], (genre, v)
            seen[genre] = v["speed"]
        finally:
            shutil.rmtree(d, ignore_errors=True)
    # denser narration and a new audience are slower, inside the same range
    d1, p1 = _project("teaching", "auto", PLAIN)
    d2, p2 = _project("teaching", "auto", DENSE, audience="new joiners, non-technical")
    try:
        s1, _ = N.suggest_speed(p1, PLAIN); s2, why2 = N.suggest_speed(p2, DENSE)
        assert s2 < s1 and 0.75 <= s2 <= 0.85 and "new to it" in why2, (s1, s2, why2)
    finally:
        shutil.rmtree(d1, ignore_errors=True); shutil.rmtree(d2, ignore_errors=True)
    # the script's own choice inside the range wins; one outside it is not used
    for value, used in ((0.77, True), (0.95, False)):
        sc = dict(PLAIN, voice_speed={"value": value, "why": "dense steps for people new to the tool"})
        d, p = _project("teaching", "auto", sc)
        try:
            N._resolve_speed(p)
            v = read_json(d / "project.json")["request"]["voice"]
            assert (v["speed"] == value) == used and (v["speed_by"].startswith("script")) == used, (value, v)
        finally:
            shutil.rmtree(d, ignore_errors=True)
    d, p = _project("teaching", 1.05, PLAIN)
    try:
        N._resolve_speed(p)
        assert read_json(d / "project.json")["request"]["voice"]["speed"] == 1.05, "control: a named speed is kept"
    finally:
        shutil.rmtree(d, ignore_errors=True)
    src = inspect.getsource(N.narrate)
    assert 'voice.get("calibrate") is not True' in src and "max(0.8," in src, "the calibration is opt-in and never under 0.8"
    return f"decided in range {seen}; dense and new is slower; script 0.77 used, 0.95 refused; named 1.05 kept"


def check_script_stage_is_told_the_range_and_the_gate_holds_it():
    from loom import narrate as N
    from loom.checks import gates
    from loom.shuttle import launch as LA
    d, p = _project("teaching", "auto", PLAIN)
    try:
        b = N.speed_block(p)
        assert "VOICE SPEED" in b and "0.75" in b and "0.85" in b, b
        assert "VOICE SPEED" in LA.start_message(p, ("P1", "P4"), {}), "Shuttle P4 lacks the speed instruction"
        assert "VOICE SPEED" not in LA.start_message(p, ("P5", "P6"), {}), "control: not in the storyboard session"
        src = inspect.getsource(gates.check_script)
        assert "voice_speed" in src and "outside the" in src, "the script gate holds voice_speed to the range"
    finally:
        shutil.rmtree(d, ignore_errors=True)
    return "the script stage gets the range; the gate refuses a speed outside it"
