"""The timing grid (D-173): one place every clock in a lesson comes from.

Before it, the narration was the only clock, but each consumer derived its own times from it: join durations lived in
four places (narrate, compose, world.js, material.js), narrate sized its silences from the storyboard's raw join type
while compose later replaced it (a meaning join, a style's seam join), storyboard sound cues never reached the cue table
and were dropped without a word, sections started 0.2 s after their beat, and a cue meant three different instants
(the runtime's 0.08 s lead, the raw word for the mix, -0.06 s for captions).

This module owns the tables and builds `manifest.grid`, which the picture (runtime/grid.js, world.js joins), the music
and sound (narrate/mix.py), the captions and the checks (loom/checks/grid.py) all read:

    grid = {version, duration, fps, cue_lead, join_dur,
            sections: [{id, t0, t1}],                     # exact beat boundaries, tiling [0, duration]
            tempo: {meter, target_bpm, segments: [{section, t0, t1, bpm, bars}], bars: [t]},
            hits: [{id, kind, t, beat, ...}],               # section, beat, speech, join, cue
            sounds: [{id, sound, t, beat, src, ...}]}       # every sound the mix must place, by id

The narration still sets the times (speech cannot move); the tempo is fitted to it: each section holds a whole number
of bars, so a section starts on a downbeat. Music follows that grid only where a lesson or pack asks
(`music.follow_grid`); the bed's default is unchanged until a comparison shows no loss (rule 13).
"""
from __future__ import annotations

GRID_VERSION = 1
FPS = 30
CUE_LEAD = 0.08            # runtime/world.js ctx.cue: a reveal starts this much before its word; sounds on a cue use it too
METER = 4
# a mood's tempo (beats per minute) before it is fitted to the sections; the bed's chord length is `bars_per_chord` bars
TEMPO = {"warm_curious": 88, "calm_focus": 72, "serious": 66, "upbeat": 112}
BARS_PER_CHORD = {"warm_curious": 2, "calm_focus": 2, "serious": 2, "upbeat": 2}

# ---- joins: the one table (compose, narrate, the runtime and the mix read it) ----
JOIN_DUR = {"cut": 0.0, "camera": 0.95, "travel": 1.05, "zoom": 1.25, "canvas": 0.9, "continue": 0.0,
            "iris": 1.1, "wipe": 0.9, "dip": 1.0, "fade": 0.8,
            # material and motif joins (D-114, runtime/material.js Loom.material.DUR carries the same numbers)
            "torn": 0.8, "page": 0.9, "scroll": 0.9, "motif": 0.9, "handoff": 0.8, "fill": 0.8}
MOVE_JOINS = ("camera", "travel", "zoom")
# screen joins (D-90, CINEMA_PLAN B7): a cover in screen space hides the change at its middle (the camera jumps there)
SCREEN_JOINS = ("iris", "wipe", "dip", "fade", "torn", "page", "scroll", "motif", "handoff", "fill")
# what a join MEANS picks its form when the storyboard names only the meaning
MEANING_JOIN = {"into": "iris", "time": "wipe", "era": "dip", "meanwhile": "fade", "shock": "cut",
                "chapter": "cut"}   # D-112: chapter boundaries are hard cuts (26 of 33 in the TED-Ed films measured)
# the joins a style may name as its seam join (a camera pan between two different worlds, D-100); never a dip
SEAM_JOINS = ("cut", "wipe", "fade")
# the silence narration leaves before a beat. A cut needs little; a moving or covering join needs its whole window
# inside the silence, so it is its duration plus a small margin (screen joins got the 0.62 s default before D-173,
# shorter than every one of them)
BEAT_GAP = 0.62
_GAP_FIXED = {"cut": 0.55, "continue": 0.55, "camera": 0.95, "travel": 1.05, "zoom": 1.25, "canvas": 1.0}
# which joins the mix gives a whoosh (and how loud): moving covers and camera moves
JOIN_WHOOSH = {"camera": 0.22, "travel": 0.22, "zoom": 0.3, "wipe": 0.18, "iris": 0.24}


def join_gap(join: str | None) -> float:
    """seconds of silence before a beat that is entered by `join`"""
    if not join:
        return BEAT_GAP
    if join in _GAP_FIXED:
        return _GAP_FIXED[join]
    if join in SCREEN_JOINS:
        return round(JOIN_DUR[join] + 0.05, 3)
    return BEAT_GAP


def join_for_meaning(meaning: str, station, prev_station, stations: dict) -> str:
    """the join that carries a meaning; "into" through a portal into a nested station is the existing zoom"""
    if meaning == "into" and (stations.get(station) or {}).get("parent") == prev_station and prev_station:
        return "zoom"
    return MEANING_JOIN.get(meaning, "cut")


def seam_join(style: dict, sa: dict, sb: dict) -> str:
    """What replaces a camera pan between two worlds: the style's choice (pack `seam_join`; Kshitij, 2026-10-11: "cinematic
    styles prefer smooth carry over transitions whereas cheap corporate style videos wouldn't care"), else a cut, the
    one join with no covered frame. A dip is never chosen here: black adds a meaning nobody planned."""
    j = (style or {}).get("seam_join") or "cut"
    return j if j in SEAM_JOINS else "cut"


def wipe_dir(sa: dict, sb: dict) -> str:
    """A substituted wipe goes the way the camera was going: towards the new station on the canvas."""
    dx, dy = float(sb.get("x") or 0) - float(sa.get("x") or 0), float(sb.get("y") or 0) - float(sa.get("y") or 0)
    if abs(dx) >= abs(dy):
        return "right" if dx >= 0 else "left"
    return "down" if dy > 0 else "up"


def resolve_joins(scenes: list, sb: dict, style: dict) -> list[str]:
    """Settle every scene's `join_in.type` in place (a meaning picks its join; a camera pan between two different worlds
    becomes the style's seam join) and return the warnings. Compose AND narrate call this, so the silence narration
    leaves is sized for the join the film really shows."""
    warnings = []
    stations = {st.get("id"): st for st in ((sb.get("world") or {}).get("stations") or []) if isinstance(st, dict)}
    for i, s in enumerate(scenes):
        ji = s.get("join_in") or {}
        if not ji.get("type") and ji.get("meaning") in MEANING_JOIN and i > 0:
            s.setdefault("join_in", {})["type"] = join_for_meaning(ji["meaning"], s.get("station"), scenes[i - 1].get("station"), stations)
        j = (s.get("join_in") or {}).get("type") or ("cut" if i == 0 else style.get("join_default", "camera"))
        # D-100: a camera pan between two stations that are different worlds shows the seam between them (a hard
        # edge slicing the old headline: phishing b01 to b02, feedback b03 to b04; L-172). Unless the storyboard
        # says the worlds join up (join_in.continuous: true), such a pan becomes the STYLE's seam join (pack
        # `seam_join`: a cinematic style carries over smoothly with a fade, an illustrated one wipes in the direction the
        # camera was going, a corporate or technical one cuts), and compose says so. Never a dip: black means a change
        # of era or mood, a meaning the storyboard did not choose; on screen it read as the film stopping (R-41, R-48).
        if j == "camera" and i > 0 and not (s.get("join_in") or {}).get("continuous"):
            a, b_ = scenes[i - 1], s
            sa, sb_ = stations.get(a.get("station")) or {}, stations.get(b_.get("station")) or {}
            nested = sa.get("parent") == b_.get("station") or sb_.get("parent") == a.get("station")
            wa, wb = (a.get("world") or a.get("station")), (b_.get("world") or b_.get("station"))
            # templates and the presenter sit on the shared field, so a pan between two of them shows no seam;
            # a seam needs at least one side that draws its own world (bespoke, blueprint or media)
            draws = lambda sc: sc.get("kind") not in ("template", "avatar")
            if a.get("station") != b_.get("station") and not nested and wa != wb and (draws(a) or draws(b_)):
                j = seam_join(style, sa, sb_)
                if j == "wipe":
                    s.setdefault("join_in", {}).setdefault("dir", wipe_dir(sa, sb_))
                warnings.append(f"{s['beat']}: camera pan between different worlds ({a.get('station')} -> {b_.get('station')}) would show the seam; using the style's seam join, a {j} (set join_in.continuous: true if they join up)")
        s.setdefault("join_in", {})["type"] = j
    return warnings


def join_window(j: str, dur, prev_beat: dict, beat: dict) -> list[float]:
    """[t0, t1] of the join into `beat` (the runtime and the mix use this window, never their own)"""
    d = float(dur or JOIN_DUR.get(j, 0.9))
    if j in MOVE_JOINS + SCREEN_JOINS:
        prev_end = prev_beat["speech_end"] + prev_beat.get("pause_after", 0)
        t0 = max(prev_end + 0.02, beat["start"] - d * 0.5)
        return [round(t0, 3), round(t0 + d, 3)]
    return [beat["start"], beat["start"]]


# ---- captions: the same word clock ----
CAP_MIN_S = 1.8        # a caption stays at least this long (film.caption_hold_checks)
CAP_TAIL_S = 0.6       # and this long after its last word, where the voice pauses long enough to allow it
CAP_MERGE_CHARS = 60   # a short caption joins its neighbour if the two fit this (one line of the 1500 px caption pill)
CAP_MERGE_WORDS = 11


def captions_from(timings: dict, max_words: int = 7, max_chars: int = 44) -> list[dict]:
    """Caption cues from the word timings (D-180, L-444). A phrase too long for one cue is split evenly (no one- or
    two-word leftover); a cue that would be on screen under CAP_MIN_S joins its neighbour in the same beat when the two
    fit; each cue then holds CAP_TAIL_S past its last word where the pause before the next words allows, and starts a
    little early (never before the previous cue ends) when it still needs time to reach CAP_MIN_S."""
    groups = []                                    # [(beat id, [words])]
    for b in timings["beats"]:
        for ph in b["phrases"]:
            ws = list(ph["words"])
            if not ws:
                continue
            chars = len(" ".join(w["w"] for w in ws))
            n = max(1, -(-len(ws) // max_words), -(-chars // max_chars))
            size = -(-len(ws) // n)
            for i in range(0, len(ws), size):
                groups.append((b["id"], ws[i:i + size]))
    # join a too-short cue with its neighbour (the next one first, else the previous), within its beat
    def text(g): return " ".join(w["w"] for w in g)
    changed = True
    while changed:
        changed = False
        for i, (bid, g) in enumerate(groups):
            nxt = groups[i + 1] if i + 1 < len(groups) else None
            span = (nxt[1][0]["s"] if nxt else g[-1]["e"] + CAP_TAIL_S + 1.0) - g[0]["s"]
            if span >= CAP_MIN_S:
                continue
            for j in (i + 1, i - 1):
                if 0 <= j < len(groups) and groups[j][0] == bid:
                    a_, b_ = (g, groups[j][1]) if j > i else (groups[j][1], g)
                    if len(text(a_ + b_)) <= CAP_MERGE_CHARS and len(a_ + b_) <= CAP_MERGE_WORDS:
                        k = min(i, j)
                        groups[k:k + 2] = [(bid, a_ + b_)]
                        changed = True
                        break
            if changed:
                break
    out = []
    for i, (bid, g) in enumerate(groups):
        nxt = groups[i + 1][1][0]["s"] - 0.06 if i + 1 < len(groups) else None
        t0 = g[0]["s"] - 0.06
        t1 = max(g[-1]["e"] + CAP_TAIL_S, t0 + CAP_MIN_S)
        if nxt is not None:
            t1 = min(t1, nxt)
        t1 = max(t1, g[-1]["e"])                    # it is on screen until its last word is said
        prev = out[-1]["t1"] if out else 0.0
        if t1 - t0 < CAP_MIN_S:                    # start a little early when it still needs time
            t0 = min(t0, t1 - CAP_MIN_S)
        t0 = max(t0, prev)                         # never over the previous cue
        out.append({"t0": round(t0, 3), "t1": round(t1, 3), "words": [{"w": w["w"], "s": w["s"], "e": w["e"]} for w in g]})
    return out


# ---- the grid ----
def grid_sections(tm: dict, script: dict) -> list[dict]:
    """sections on exact beat boundaries, tiling [0, duration]; a lesson with none is one section"""
    out = []
    for sec in script.get("sections") or []:
        bs = [b for b in tm["beats"] if b.get("section") == sec["id"]]
        if bs:
            out.append({"id": sec["id"], "t0": bs[0]["start"], "t1": bs[-1]["end"]})
    if not out and tm["beats"]:
        out = [{"id": "all", "t0": tm["beats"][0]["start"], "t1": tm["beats"][-1]["end"]}]
    out.sort(key=lambda s: s["t0"])
    if out:
        out[0]["t0"] = 0.0
        out[-1]["t1"] = round(float(tm["duration"]), 3)
    return out


def tempo_map(sections: list[dict], mood: str = "warm_curious", bpm: float | None = None) -> dict:
    """Fit a tempo to the narration: each section holds a whole number of bars (so it starts on a downbeat), at the bpm
    closest to the mood's. Returns the segments and every bar line."""
    target = float(bpm or TEMPO.get(mood, TEMPO["warm_curious"]))
    bar_s = 60.0 * METER / target
    segs, bars = [], []
    for sec in sections:
        dur = sec["t1"] - sec["t0"]
        if dur <= 0:
            continue
        n = max(1, int(round(dur / bar_s)))
        segs.append({"section": sec["id"], "t0": sec["t0"], "t1": sec["t1"], "bpm": round(60.0 * METER * n / dur, 3), "bars": n})
        bars += [round(sec["t0"] + k * dur / n, 3) for k in range(n)]
    return {"meter": METER, "target_bpm": target, "segments": segs, "bars": bars}


def build_grid(tm: dict, script: dict, scenes: list, cue_table: dict, music: dict | None = None) -> dict:
    """The lesson's grid from the narration timings, the settled scenes (join_in.type and join_window set) and the cue
    table. Pure: the same inputs give the same grid."""
    music = music or {}
    beats = {b["id"]: b for b in tm["beats"]}
    sections = grid_sections(tm, script)
    hits, sounds = [], []
    # sound times are not rounded: the mix places a sound on a sample, and a rounded time moved the long-standing
    # sounds (quiz ticks, the end chime) by up to half a millisecond against the mixes made before the grid
    first_of = {}
    for b in tm["beats"]:
        first_of.setdefault(b.get("section"), b["id"])
    for sec in sections:
        hits.append({"id": f"section:{sec['id']}", "kind": "section", "t": sec["t0"], "beat": first_of.get(sec["id"])})
    for b in tm["beats"]:
        hits.append({"id": f"beat:{b['id']}", "kind": "beat", "t": b["start"], "beat": b["id"]})
        hits.append({"id": f"speech:{b['id']}", "kind": "speech", "t": b["speech_start"], "end": b["speech_end"], "beat": b["id"]})
    seed = 1
    for s in scenes:
        bid = s["beat"]
        if bid not in beats:
            continue
        j = (s.get("join_in") or {}).get("type")
        jw = s.get("join_window") or [0, 0]
        if jw[1] > jw[0]:
            hits.append({"id": f"join:{bid}", "kind": "join", "t": jw[0], "end": jw[1], "join": j, "beat": bid})
            if j in JOIN_WHOOSH:
                d = jw[1] - jw[0] + (0.2 if j in MOVE_JOINS else 0.0)
                at = jw[0] - (0.05 if j in MOVE_JOINS else 0.0)
                sounds.append({"id": f"join:{bid}", "sound": "whoosh", "t": at, "d": d, "g": JOIN_WHOOSH[j], "seed": seed,
                               "beat": bid, "src": "join"})
                seed += 1
        for anchor, t in sorted((cue_table.get(bid) or {}).items(), key=lambda kv: (kv[1], kv[0])):
            hits.append({"id": f"cue:{bid}:{anchor}", "kind": "cue", "t": round(t - CUE_LEAD, 3), "word": t, "beat": bid})
        for i, e in enumerate(s.get("sfx") or []):
            if not isinstance(e, dict):
                continue
            kind, cue, at = e.get("kind"), e.get("cue"), e.get("at")
            if cue:
                w = (cue_table.get(bid) or {}).get(cue)
                t = None if w is None else round(w - CUE_LEAD, 3)
            else:
                t = at
            snd = {"id": f"sfx:{bid}:{i}", "sound": kind, "t": t, "beat": bid, "src": "storyboard",
                   **{k: e[k] for k in ("f", "g", "d") if k in e}}
            if cue:
                snd["cue"] = cue
            if kind == "whoosh":
                snd["seed"] = seed; seed += 1
            sounds.append(snd)
    # a quiet clock tick through any quiz pause, and a chime on the final beat (the mix's long-standing rules)
    for b in tm["beats"]:
        p = float(b.get("pause_after") or 0)
        if p >= 1.5:
            k, n = 0.0, 0
            while k < p - 0.4:
                sounds.append({"id": f"pause:{b['id']}:{n}", "sound": "tick", "t": b["speech_end"] + 0.3 + k, "g": 0.12,
                               "beat": b["id"], "src": "pause"})
                k += 1.0; n += 1
    if tm["beats"]:
        last = tm["beats"][-1]
        sounds.append({"id": "end", "sound": "chime", "t": last["speech_end"] + 0.1, "f": 1567.98, "g": 0.12, "d": 1.8,
                       "beat": last["id"], "src": "end"})
    hits.sort(key=lambda h: (h["t"], h["kind"], h["id"]))
    sounds.sort(key=lambda h: ((h["t"] if h["t"] is not None else -1), h["id"]))
    return {
        "version": GRID_VERSION, "duration": round(float(tm["duration"]), 3), "fps": FPS, "cue_lead": CUE_LEAD,
        "join_dur": dict(JOIN_DUR),
        "sections": sections,
        "tempo": tempo_map(sections, music.get("mood", "warm_curious"), music.get("bpm")),
        "hits": hits, "sounds": sounds,
    }


def chord_starts(grid: dict, mood: str) -> list[float]:
    """chord changes on the grid's bar lines, every BARS_PER_CHORD bars, restarting at each section (a section's first
    bar always changes chord)"""
    per = BARS_PER_CHORD.get(mood, 2)
    out = []
    for seg in grid["tempo"]["segments"]:
        bar = (seg["t1"] - seg["t0"]) / seg["bars"]
        out += [round(seg["t0"] + k * bar, 3) for k in range(0, seg["bars"], per)]
    return out
