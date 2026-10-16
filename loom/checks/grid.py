"""Grid checks (D-173): the timing grid is the one clock, and these prove its consumers used it.

- every sound the grid plans (joins, storyboard sounds, quiz-pause ticks, the end chime) was placed in the mix at its
  grid time (audio/mix_events.json, written by the mix for one build). Before the grid, a storyboard sound on a cue was
  dropped silently; now a dropped sound is an error;
- the mix was made for THIS build (a mix left over from another build is an error, never a pass);
- a planned sound with no time (its cue is not spoken) is an error;
- sections start on bar lines and on their first beat (the tempo map is fitted, so this is the grid's own invariant);
- with `music.follow_grid`, every chord change the mix used is on a bar line;
- a join whose window runs into speech (the camera or a cover moving while the narrator talks) is a warning: lessons
  narrated before D-173 left screen joins 0.62 s of silence, shorter than every screen join.
A build with no grid (composed before D-173) is reported as not checked, never as clean.
"""
from __future__ import annotations

from ..util import file_sha, read_json

TOL = 0.0015   # seconds: the grid rounds to 1 ms


def grid_checks(project, manifest: dict) -> tuple[list[str], list[str], dict]:
    E, W = [], []
    grid = manifest.get("grid")
    if not grid:
        W.append("grid: this build has no timing grid (composed before D-173): not checked; recompose the lesson")
        return E, W, {"checked": False}
    stats = {"checked": True, "planned": 0, "placed": 0, "dropped": 0, "unresolved": 0, "joins_into_speech": 0,
             "bars": len(grid.get("tempo", {}).get("bars") or []),
             "bpm": [s["bpm"] for s in grid.get("tempo", {}).get("segments") or []]}
    # ---- sounds ----
    sounds = grid.get("sounds") or []
    stats["planned"] = len(sounds)
    for snd in sounds:
        if snd.get("t") is None:
            stats["unresolved"] += 1
            E.append(f"{snd.get('beat')}: grid: the {snd.get('sound')} planned on cue \"{snd.get('cue')}\" has no time: the cue is not "
                     "spoken in this beat (fix the cue in the storyboard's sfx)")
    idx = project.path("build/index.html")
    me_path = project.path("audio/mix_events.json")
    me = read_json(me_path, {}) if me_path.exists() else {}
    build = file_sha(idx) if idx.exists() else None
    if not me:
        E.append("grid: no audio/mix_events.json: the mix was not made from the grid (run the mix: py -m loom run <id> compose)")
        return E, W, stats
    if me.get("build") != build:
        E.append("grid: the mix was made for another build (audio/mix_events.json names a different index.html): re-run the mix")
        return E, W, stats
    placed = {p["id"]: p for p in me.get("placed") or []}
    stats["placed"] = len(placed)
    for snd in sounds:
        if snd.get("t") is None:
            continue
        p = placed.get(snd["id"])
        if p is None:
            stats["dropped"] += 1
            E.append(f"{snd.get('beat')}: grid: the planned {snd.get('sound')} \"{snd['id']}\" at {snd['t']:.2f}s is not in the mix "
                     "(a sound the storyboard or the edit planned was dropped)")
        elif abs(float(p["t"]) - float(snd["t"])) > TOL:
            stats["dropped"] += 1
            E.append(f"{snd.get('beat')}: grid: \"{snd['id']}\" was placed at {float(p['t']):.3f}s, the grid says {float(snd['t']):.3f}s")
    # ---- the grid's own invariants ----
    bars = grid.get("tempo", {}).get("bars") or []
    beats = {b["id"]: b for b in manifest.get("beats") or []}
    first = {}
    for b in manifest.get("beats") or []:
        first.setdefault(b.get("section"), b)
    for i, sec in enumerate(grid.get("sections") or []):
        if not any(abs(sec["t0"] - x) <= TOL for x in bars):
            E.append(f"grid: section {sec['id']} starts at {sec['t0']:.3f}s, not on a bar line")
        fb = first.get(sec["id"])
        want = 0.0 if i == 0 else (fb["start"] if fb else sec["t0"])
        if abs(sec["t0"] - want) > TOL:
            E.append(f"grid: section {sec['id']} starts at {sec['t0']:.3f}s but its first beat starts at {want:.3f}s")
    mus = me.get("music") or {}
    if (mus.get("changes") is not None) and bool(((manifest.get("style") or {}).get("music") or {}).get("follow_grid") or
                                                  (read_json(project.path("plan/storyboard.json"), {}).get("music") or {}).get("follow_grid")):
        off = [c for c in mus["changes"] if not any(abs(c - x) <= TOL for x in bars)]
        if off:
            E.append(f"grid: {len(off)} chord change(s) of the music are off the bar lines (first at {off[0]:.3f}s)")
    # ---- joins against speech ----
    order = [s["beat"] for s in manifest.get("scenes") or []]
    for h in grid.get("hits") or []:
        if h.get("kind") != "join":
            continue
        b = beats.get(h["beat"])
        i = order.index(h["beat"]) if h["beat"] in order else -1
        pb = beats.get(order[i - 1]) if i > 0 else None
        if not b or not pb:
            continue
        into_next = h["end"] - b["speech_start"]
        into_prev = (pb["speech_end"]) - h["t"]
        over = max(into_next, into_prev)
        if over > 0.05:
            stats["joins_into_speech"] += 1
            W.append(f"{h['beat']}: grid: the {h.get('join')} join ({h['t']:.2f}s to {h['end']:.2f}s) runs {over:.2f}s into speech "
                     "(re-narrate: the silence is now sized for the join the film shows)")
    return E, W, stats
