"""Caption hold (2026-10-15, proposal P-c from docs/research/2026-10-15-lemo-opuscar-study.md section 12): every caption
cue stays on screen at least max(1.8 s, its spoken words + 0.6 s). Measured that day, 22 to 28 % of the cues of three
finished lessons ran under 1.8 s (shortest 0.64 s) and nothing checked it.

  caption hold   a planted short cue is an error naming its beat and time; a cue long enough is quiet; a lesson in
                 film_caption_baseline.json keeps its recorded counts as warnings and fails where a beat grows;
                 captions off are not judged; 0 cues while the narration speaks is red; `check` runs it; the
                 defect router sends it to the engine (a person), not to the beat's scene author
"""
from __future__ import annotations


def _manifest(groups, enabled=True):
    beats = [{"id": "b01", "start": 0.0, "end": 2.9, "phrases": [{"words": [{"w": "x", "s": 0.6, "e": 2.0}]}]},
             {"id": "b02", "start": 2.9, "end": 4.9, "phrases": [{"words": [{"w": "x", "s": 3.0, "e": 3.4}]}]},
             {"id": "b03", "start": 4.9, "end": 12.0, "phrases": [{"words": [{"w": "x", "s": 5.0, "e": 7.5}]}]}]
    return {"captions": {"enabled": enabled, "groups": groups}, "beats": beats}


def _cue(t0, t1, words):
    return {"t0": t0, "t1": t1, "words": [{"w": w, "s": s, "e": e} for w, s, e in words]}


OK = _cue(0.54, 2.8, [("Say", 0.6, 0.9), ("it's", 0.9, 1.2), ("night,", 1.2, 2.0)])          # 2.26 s of 2.0 s needed
ORPHAN = _cue(2.94, 3.7, [("map.", 3.0, 3.4)])                                                 # 0.76 s of 1.8 s
LONG_LINE = _cue(4.94, 7.8, [("A", 5.0, 5.2), ("blue", 5.2, 6.0), ("dot", 6.0, 7.5)])          # 2.86 s of 3.1 s
SECOND = _cue(7.9, 9.0, [("appears.", 8.0, 8.6)])                                              # 1.10 s of 1.8 s (b03)


def check_caption_hold_reports_short_cues_by_beat_with_a_ratchet_and_a_red_zero():
    """film.caption_hold_checks: the planted 0.76 s orphan cue (b02) and a 2.86 s cue whose words take 2.5 s (b03) are
    errors with their beat and time; the cue long enough (b01) is quiet; a lesson recorded in film_caption_baseline.json
    keeps its counts as warnings and fails where a beat has more; a pack's pace block sets the thresholds; captions off
    are not judged; 0 cues while the narration speaks is a blind measure (red); qa.check runs the check"""
    import inspect

    from loom import qa
    from loom.checks import film as F
    mf = _manifest([OK, ORPHAN, LONG_LINE, SECOND])
    E, W, S = F.caption_hold_checks(mf, None, lesson="no-such-lesson")
    assert any(e.startswith("b02: caption_hold") and "2.94s" in e and "0.76s of 1.80s" in e for e in E), E
    # D-180 (Kshitij, 2026-10-15: "Merge + tail at pauses"): the 0.6 s tail is owed only as far as the pause before the
    # next words allows (0.44 s here), so this cue needs 2.5 + 0.44 = 2.94 s (3.10 s under D-170's full tail)
    assert any(e.startswith("b03: caption_hold: 2 caption cue(s)") and "4.94s" in e and "2.86s of 2.94s" in e for e in E), E
    assert not any(e.startswith("b01") for e in E), ("control: a cue held long enough", E)
    assert S["cues"] == 4 and S["short"] == 3 and S["under_min"] == 2 and S["min_hold_s"] == 0.76, S
    old = F.caption_baseline
    F.caption_baseline = lambda: {"known-lesson": {"b02": 1, "b03": 1}}
    try:
        E2, W2, S2 = F.caption_hold_checks(mf, None, lesson="known-lesson")
    finally:
        F.caption_baseline = old
    assert not any(e.startswith("b02") for e in E2) and any(w.startswith("b02") and "known before" in w for w in W2), (E2, W2)
    assert any(e.startswith("b03") and "new since the baseline: 1 recorded" in e for e in E2), E2
    assert S2["baselined"] is True
    E3, _, _ = F.caption_hold_checks(mf, {"pace": {"caption_min_s": 0.5, "caption_tail_s": 0.2}}, lesson="no-such-lesson")
    assert not E3, ("a pack's pace block sets the thresholds", E3)
    assert F.caption_hold_checks(_manifest([ORPHAN], enabled=False), None)[:2] == ([], []), "captions off are not judged"
    blind = F.caption_hold_checks(_manifest([]), None)[0]
    assert any("measure is blind" in e for e in blind), ("a zero denominator must be red", blind)
    assert "caption_hold_checks" in inspect.getsource(qa.check), "check must run the caption-hold check"
    # compose times the cues: the error is the engine's, never a bespoke beat's author (who cannot change it)
    from loom import ledger
    from loom.agents import router as R
    line = next(e for e in E if e.startswith("b02"))
    assert R.check_code(line) == "caption_hold" and R.owner_of("caption_hold", "b02", {"b02": {"kind": "bespoke"}}, line) == "engine", line
    assert ledger._kind_of(line) == "caption_hold", ledger._kind_of(line)
    base = F.caption_baseline()
    for lesson in ("gps-position", "blameless-postmortem", "https-private-v2"):
        assert base.get(lesson), f"{lesson}: a finished lesson must be in film_caption_baseline.json"
    return "short cues by beat and time; baseline ratchets; pace thresholds; captions off quiet; blind measure red; wired into check"


def check_caption_timing_merges_short_cues_and_holds_into_pauses():
    """timing.captions_from (D-180, L-444): a phrase split for length is split evenly (no one-word leftover); a cue
    that would be on screen under 1.8 s joins its neighbour in the same beat; every cue holds past its last word into a
    pause, never over the next cue; and the result passes film.caption_hold_checks with the tail owed only at pauses.
    Control: the same words timed the way compose did before (0.06 s lead, 0.3 s tail, cut at the next cue) fail."""
    from loom.timing import captions_from
    from loom.checks import film as F
    def ph(text, s, e):
        ws = text.split(); d = (e - s) / len(ws)
        return {"text": text, "s": s, "e": e, "words": [{"w": w, "s": round(s + i * d, 3), "e": round(s + (i + 1) * d - 0.05, 3)} for i, w in enumerate(ws)]}
    tm = {"beats": [
        {"id": "b01", "start": 0.0, "end": 6.0, "phrases": [ph("Say it's Monday.", 0.6, 1.7), ph("Maya has four requests to sort today.", 1.9, 4.6)]},
        {"id": "b02", "start": 6.0, "end": 12.0, "phrases": [ph("One of them is from a client who is waiting on an answer now.", 6.4, 10.4), ph("Map.", 11.0, 11.4)]}]}
    cues = captions_from(tm)
    texts = [" ".join(w["w"] for w in c["words"]) for c in cues]
    assert texts[0] == "Say it's Monday. Maya has four requests to sort today."[:len(texts[0])] and "Monday." in texts[0], texts
    assert not any(len(c["words"]) <= 2 and c["words"][-1]["w"] != "Map." for c in cues), texts   # no short leftover inside a phrase
    for a, b in zip(cues, cues[1:]):
        assert a["t1"] <= b["t0"] + 1e-6, ("cues never overlap", a, b)
    mf = {"captions": {"enabled": True, "groups": cues}, "beats": tm["beats"]}
    E, W, S = F.caption_hold_checks(mf, None, lesson="no-such-lesson")
    assert S["under_min"] == 0 and S["min_hold_s"] >= 1.8, (S, texts)
    old = []
    flat = [w for b in tm["beats"] for p in b["phrases"] for w in p["words"]]
    for i in range(0, len(flat), 3):
        g = flat[i:i + 3]; old.append({"t0": g[0]["s"] - 0.06, "t1": g[-1]["e"] + 0.3, "words": g})
    for a, b in zip(old, old[1:]):
        a["t1"] = min(a["t1"], b["t0"])
    assert F.caption_hold_checks({"captions": {"enabled": True, "groups": old}, "beats": tm["beats"]}, None, lesson="x")[0], "control"
    return f"{len(cues)} cues, shortest {S['min_hold_s']} s, none short; the old timing fails"
