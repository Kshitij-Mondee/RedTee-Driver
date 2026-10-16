"""Sound design: narration + a quiet synthesised music bed + restrained SFX, ducked, -16 LUFS.

Everything is synthesised (no samples, no licences). SFX are placed from the composed
manifest (join windows, scene cues), so sound and picture share one clock.
"""
from __future__ import annotations

import json
import subprocess
import wave
from pathlib import Path

import numpy as np

from ..util import LoomError, info, read_json, which
from . import read_wav

SR = 48000
MOODS = {
    # chord progressions as semitone offsets from the style's root; tempo of chord changes (s)
    "warm_curious": {"chords": [[0, 7, 12, 16], [-3, 4, 9, 12], [-7, 0, 5, 9], [-5, 2, 7, 11]], "bar": 5.5, "bright": 0.08},
    "calm_focus": {"chords": [[0, 7, 14, 16], [-2, 5, 12, 14], [-5, 2, 9, 12], [-7, 0, 7, 11]], "bar": 7.0, "bright": 0.05},
    "serious": {"chords": [[0, 7, 12, 15], [-4, 3, 8, 12], [-7, 0, 5, 8], [-2, 5, 10, 14]], "bar": 7.5, "bright": 0.04},
    "upbeat": {"chords": [[0, 7, 12, 16], [5, 12, 17, 21], [-3, 4, 9, 12], [7, 14, 19, 23]], "bar": 3.5, "bright": 0.10},
}


def _lp(x, a):
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)):
        acc += a * (x[i] - acc); y[i] = acc
    return y


def _lp_fast(x, a):
    # vectorised one-pole via scipy-free recursion in blocks (exact enough for a pad)
    try:
        from scipy.signal import lfilter  # type: ignore
        return lfilter([a], [1, a - 1], x)
    except Exception:
        return _lp(x, a)


def chord_times(D, mood, changes=None):
    """When each chord starts. By default every `bar` seconds; with `changes` (the edit's own boundaries,
    D-47 "music follows the edit") a chord change lands on each boundary, and long stretches are split
    into bars so the harmony still moves."""
    bar = MOODS.get(mood, MOODS["warm_curious"])["bar"]
    if not changes:
        return [k * bar for k in range(int((D + bar) // bar) + 1)]
    pts = sorted({0.0, *[round(float(c), 3) for c in changes if 0 < c < D]})
    out = []
    for a, b in zip(pts, pts[1:] + [D + bar]):
        n = max(1, int(round((b - a) / bar)))
        out += [a + i * (b - a) / n for i in range(n)]
    return out


def chord_at(t, D, mood, changes=None):
    """The chord (semitone offsets from the root) sounding at time t, so SFX can be tuned to the music."""
    M = MOODS.get(mood, MOODS["warm_curious"])
    ts = chord_times(D, mood, changes)
    k = max(0, max(i for i, s in enumerate(ts) if s <= max(0.0, t)))
    return M["chords"][k % len(M["chords"])]


def pad(D, mood, root_midi, changes=None):
    M = MOODS.get(mood, MOODS["warm_curious"])
    N = int(D * SR); t = np.arange(N) / SR
    out = np.zeros(N)
    ts = chord_times(D, mood, changes)
    for k, start in enumerate(ts):
        c = M["chords"][k % len(M["chords"])]
        seg = (ts[k + 1] if k + 1 < len(ts) else start + M["bar"]) - start
        s0 = start - 1.2; s1 = s0 + seg + 2.4
        i0, i1 = max(0, int(s0 * SR)), min(N, int(s1 * SR))
        if i1 > i0:
            tt = t[i0:i1]
            env = np.clip((tt - s0) / 1.8, 0, 1) * np.clip((s1 - tt) / 1.8, 0, 1)
            for off in c:
                f = 440 * 2 ** ((root_midi + off - 69) / 12)
                for det in (-0.1, 0.1):
                    out[i0:i1] += env * np.sin(2 * np.pi * f * 2 ** (det / 12) * tt) * 0.16
    out = _lp_fast(out, M["bright"])
    return out * (0.9 + 0.1 * np.sin(2 * np.pi * 0.08 * t))


def _noise(n, seed):
    return np.random.default_rng(seed).standard_normal(n)


def sfx_whoosh(d=1.0, g=0.3, seed=1):
    n = int(d * SR); tt = np.arange(n) / SR
    env = np.sin(np.pi * tt / d) ** 2
    x = _noise(n, seed)
    # sweeping band: two cascaded one-poles with time-varying coefficient approximated in blocks
    y = np.zeros(n); acc = 0.0; acc2 = 0.0
    a = 0.02 + 0.16 * np.sin(np.pi * tt / d) ** 2
    for i in range(n):
        acc += a[i] * (x[i] - acc); acc2 += a[i] * (acc - acc2); y[i] = acc - acc2 * 0.6
    return y * env * g * 3.0


def sfx_pop(f=880, g=0.2, d=0.14):
    n = int(d * SR); tt = np.arange(n) / SR
    fr = f * (1 + 0.5 * np.exp(-tt * 40))
    return np.sin(2 * np.pi * np.cumsum(fr) / SR) * np.exp(-tt * 26) * g


def sfx_tick(g=0.25):
    n = int(0.04 * SR); x = _noise(n, 7) * np.exp(-np.arange(n) / (0.003 * SR))
    return _lp(x, 0.3) * g


def sfx_chime(f=1318.5, g=0.18, d=1.5):
    n = int(d * SR); tt = np.arange(n) / SR
    return (np.sin(2 * np.pi * f * tt) + 0.4 * np.sin(2 * np.pi * f * 2.01 * tt) + 0.25 * np.sin(2 * np.pi * f * 1.5 * tt)) * np.exp(-tt * 3.0) * g


# ---- the motion's own sound events (D-47): synthesised, tuned to the chord that is sounding ----------
def _midi(m):
    return 440 * 2 ** ((m - 69) / 12)


def sfx_key(i=0, g=0.05):
    # a soft keypress: a short band of noise; pitch and length vary by key index (seeded, deterministic)
    r = np.random.default_rng(1000 + int(i))
    n = int((0.018 + 0.01 * r.random()) * SR)
    x = r.standard_normal(n) * np.exp(-np.arange(n) / (0.004 * SR))
    return (_lp(x, 0.35 + 0.25 * r.random()) - _lp(x, 0.05)) * g


def sfx_click(g=0.1):
    n = int(0.03 * SR); tt = np.arange(n) / SR
    x = np.sin(2 * np.pi * 2400 * tt) * np.exp(-tt * 380) + 0.6 * np.sin(2 * np.pi * 1200 * tt) * np.exp(-tt * 220)
    return x * g


def sfx_card(g=0.08, seed=3):
    d = 0.16; n = int(d * SR); tt = np.arange(n) / SR
    x = _noise(n, seed)
    env = np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 1.5
    return (_lp(x, 0.22) - _lp(x, 0.03)) * env * g * 2.2


def sfx_land(g=0.12):
    n = int(0.22 * SR); tt = np.arange(n) / SR
    f = 95 * (1 + 0.6 * np.exp(-tt * 30))
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 18) + 0.15 * _lp(_noise(n, 11), 0.08) * np.exp(-tt * 40)) * g


def sfx_reveal(root, chord, g=0.14):
    # a soft impact under a short tone on the chord's root: the "arrival" of a payoff
    n = int(0.9 * SR); tt = np.arange(n) / SR
    f0 = _midi(root + chord[0] - 12)
    body = np.sin(2 * np.pi * f0 * tt) * np.exp(-tt * 4.5)
    thud = np.sin(2 * np.pi * np.cumsum(70 * (1 + np.exp(-tt * 25))) / SR) * np.exp(-tt * 14)
    return (0.6 * body + 0.8 * thud) * g


def sfx_success(root, chord, g=0.12):
    # two bell notes from the sounding chord (third, then fifth an octave up): in key by construction
    out = np.zeros(int(1.4 * SR))
    for k, (off, at) in enumerate(((chord[min(2, len(chord) - 1)], 0.0), (chord[-1], 0.11))):
        f = _midi(root + off + 12)
        n = len(out) - int(at * SR); tt = np.arange(n) / SR
        out[int(at * SR):] += (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * f * 2.76 * tt) * np.exp(-tt * 6)) * np.exp(-tt * 3.2) * (0.9 if k else 1.0)
    return out * g


def sfx_marker(g=0.03, seed=5):
    """a felt tip on a board (the whiteboard engine, only when a scene asks, once for a group): short, soft, high and
    quiet, under everything (Kshitij, 2026-10-15: "keep it low and passive. It shouldn't be irritating")"""
    d = 0.22; n = int(d * SR); tt = np.arange(n) / SR
    x = _noise(n, seed)
    band = _lp(x, 0.35) - _lp(x, 0.08)
    env = np.sin(np.pi * np.clip(tt / d, 0, 1)) ** 2
    return band * env * g


def sfx_error(g=0.1):
    out = np.zeros(int(0.36 * SR))
    for at in (0.0, 0.16):
        n = int(0.12 * SR); tt = np.arange(n) / SR
        x = sum(np.sin(2 * np.pi * 150 * h * tt) / h for h in (1, 2, 3, 5)) * np.exp(-tt * 14)
        i = int(at * SR); out[i:i + n] += x
    return _lp(out, 0.25) * g


SFX_GAIN = {"sparse": 0.6, "moderate": 1.0, "rich": 1.25}


def place_events(add, events, root, chord_fn, energy="moderate", seed0=100):
    """Synthesise the runtime's sound events (qa/sfx_events.json). BRAG's mixing rules: effects sit under the
    voice and the music, repeated small sounds stay in the background, and a sparse register thins keys."""
    g0 = SFX_GAIN.get(energy, 1.0)
    seed = seed0
    for k, e in enumerate(sorted(events, key=lambda e: (e["t"], e["kind"], e.get("i") or 0))):
        kind, t = e["kind"], float(e["t"])
        g = e.get("g")
        if kind == "key":
            if energy == "sparse" and (e.get("i") or 0) % 6:
                continue
            add(t, sfx_key(e.get("i") or k, (g or 0.05) * g0))
        elif kind == "click": add(t, sfx_click((g or 0.1) * g0))
        elif kind == "card": add(t, sfx_card((g or 0.08) * g0, seed)); seed += 1
        elif kind == "land": add(t, sfx_land((g or 0.12) * g0))
        elif kind == "reveal": add(t - 0.02, sfx_reveal(root, chord_fn(t), (g or 0.14) * g0))
        elif kind == "success": add(t, sfx_success(root, chord_fn(t), (g or 0.12) * g0))
        elif kind == "error": add(t, sfx_error((g or 0.1) * g0))
        elif kind == "whoosh": add(t - 0.05, sfx_whoosh(0.7, (g or 0.2) * g0, seed)); seed += 1
        elif kind == "pop": add(t, sfx_pop(880, (g or 0.14) * g0))
        elif kind == "tick": add(t, sfx_tick((g or 0.15) * g0))
        elif kind == "chime": add(t, sfx_chime(_midi(root + chord_fn(t)[-1] + 12), (g or 0.12) * g0))
        elif kind == "marker": add(t, sfx_marker(0.03 * (g if g is not None else 1.0) * g0, seed)); seed += 1


def runtime_events(project) -> list:
    """The sound events the runtime recorded for THIS build (written by the check stage), else []."""
    from ..util import file_sha
    f = project.path("qa/sfx_events.json")
    idx = project.path("build/index.html")
    if not f.exists() or not idx.exists():
        return []
    d = read_json(f)
    return d.get("events", []) if d.get("build") == file_sha(idx) else []


def _grid_sound(snd):
    """the signal for one planned sound of the grid (the same synths the mix always used); None for an unknown kind"""
    k, g = snd.get("sound"), snd.get("g")
    if k == "pop": return sfx_pop(snd.get("f", 880), g if g is not None else 0.16)
    if k == "tick": return sfx_tick(g if g is not None else 0.2)
    if k == "chime": return sfx_chime(snd.get("f", 1318.5), g if g is not None else 0.16, snd.get("d", 1.5))
    if k == "whoosh": return sfx_whoosh(snd.get("d", 0.8), g if g is not None else 0.22, snd.get("seed", 1))
    return None


def _legacy_sounds(mf, add):
    """a build composed before the grid (no manifest.grid): the sounds as the mix placed them then"""
    seed = 1
    for s in mf["scenes"]:
        j = (s.get("join_in") or {}).get("type")
        jw = s.get("join_window") or [0, 0]
        if j in ("camera", "travel", "zoom") and jw[1] > jw[0]:
            add(jw[0] - 0.05, sfx_whoosh(jw[1] - jw[0] + 0.2, 0.22 if j != "zoom" else 0.3, seed)); seed += 1
        elif j in ("wipe", "iris") and jw[1] > jw[0]:   # screen joins (D-90, B7): a moving cover gets a whoosh
            add(jw[0], sfx_whoosh(jw[1] - jw[0], 0.18 if j == "wipe" else 0.24, seed)); seed += 1
        for e in s.get("sfx") or []:
            kind = e.get("kind"); cue = e.get("cue"); at = e.get("at")
            t = mf["cues"].get(s["beat"], {}).get(cue) if cue else at
            if t is None:
                continue
            if kind == "pop": add(t, sfx_pop(e.get("f", 880), e.get("g", 0.16)))
            elif kind == "tick": add(t, sfx_tick(e.get("g", 0.2)))
            elif kind == "chime": add(t, sfx_chime(e.get("f", 1318.5), e.get("g", 0.16)))
            elif kind == "whoosh": add(t, sfx_whoosh(e.get("d", 0.8), e.get("g", 0.22), seed)); seed += 1
    # a quiet clock tick through any quiz pause, and a chime on the final beat
    for b in mf["beats"]:
        p = float(b.get("pause_after") or 0)
        if p >= 1.5:
            k = 0.0
            while k < p - 0.4:
                add(b["speech_end"] + 0.3 + k, sfx_tick(0.12)); k += 1.0
    add(mf["beats"][-1]["speech_end"] + 0.1, sfx_chime(1567.98, 0.12, 1.8))


def mix(project) -> Path:
    mf = read_json(project.path("build/manifest.json"))
    D = float(mf["duration"]); N = int(D * SR)
    v, vsr = read_wav(project.path("audio/narration.wav"))
    v = np.interp(np.arange(int(len(v) * SR / vsr)) / SR, np.arange(len(v)) / vsr, v)[:N]
    v = np.pad(v, (0, max(0, N - len(v))))
    style = mf["style"]
    sb = read_json(project.path("plan/storyboard.json"))
    music = dict(style.get("music") or {}); music.update(sb.get("music") or {})
    fx = np.zeros(N)

    def add(at, sig):
        i = int(at * SR); n = min(len(sig), N - i)
        if i >= 0 and n > 0:
            fx[i:i + n] += sig[:n]

    grid = mf.get("grid")
    placed = []
    if grid:
        # the timing grid (D-173): every planned sound has an id and one time; the mix places exactly these and records
        # what it placed (audio/mix_events.json), so the grid check can prove nothing planned was dropped
        for snd in grid.get("sounds") or []:
            sig = _grid_sound(snd)
            if snd.get("t") is None or sig is None:
                continue
            add(float(snd["t"]), sig)
            placed.append({"id": snd["id"], "t": snd["t"], "sound": snd["sound"]})
    else:
        _legacy_sounds(mf, add)
    mood, root = music.get("mood", "warm_curious"), int(music.get("root_midi", 50))
    if music.get("enabled") is False:
        mood = "none"   # a storyboard that turns the music off gets none (before D-173 the flag was never read)
    # music follows the edit (D-47): chord changes land on section starts (or the given boundaries); with
    # music.follow_grid (D-173) they land on the timing grid's bar lines, every few bars, a new chord on each section
    changes = None
    if music.get("follow_grid") and grid and mood != "none":
        from ..timing import chord_starts
        changes = chord_starts(grid, mood)
    elif music.get("follow_edit"):
        changes = music.get("changes") or [sec["t0"] for sec in mf.get("sections") or []]
    ev = runtime_events(project)
    if ev:
        place_events(add, ev, root, lambda t: chord_at(t, D, mood, changes), (sb.get("sfx") or style.get("sfx") or {}).get("energy", "moderate"))
    if grid:
        from ..util import write_json, file_sha
        idx = project.path("build/index.html")
        write_json(project.path("audio/mix_events.json"), {"build": file_sha(idx) if idx.exists() else None,
                                                          "grid_version": grid.get("version"), "placed": placed,
                                                          "music": {"mood": mood, "changes": changes}})
    bed = pad(D, mood, root, changes) if mood != "none" else np.zeros(N)
    venv = _lp_fast(np.abs(v), 0.0015)
    duck = 1 - 0.5 * np.clip(venv / 0.05, 0, 1)
    master = v + bed * float(music.get("level", 0.09)) * duck + fx * 0.6
    tt = np.arange(N) / SR
    master *= np.clip((D - tt) / 0.8, 0, 1) * np.clip(tt / 0.3, 0, 1)
    master = master / (np.max(np.abs(master)) or 1) * 0.89
    raw = project.path("audio/mix_raw.wav")
    pcm = (np.stack([master, master], 1) * 32767).astype(np.int16)
    with wave.open(str(raw), "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    out = project.path("audio/mix.wav")
    ff = which("ffmpeg")
    if ff:
        r = subprocess.run([ff, "-v", "error", "-y", "-i", str(raw), "-af", "loudnorm=I=-16:TP=-1.5:LRA=11", "-ar", str(SR), str(out)], capture_output=True, text=True)
        if r.returncode != 0:
            raise LoomError("ffmpeg loudnorm failed: " + r.stderr[-800:])
    else:
        raw.replace(out)
    dst = project.path("build/assets/audio/mix.wav")
    if dst.parent.exists():
        import shutil
        shutil.copy2(out, dst)
    info(f"mix: {D:.1f}s, music={mood}, -> {out}")
    return out
