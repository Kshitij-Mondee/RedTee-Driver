"""Narration: script phrases -> speech + exact timings.

Each PHRASE is synthesised separately, so phrase boundaries are exact (measured, not guessed).
Words inside a phrase are placed by phoneme weight (or by the provider's own alignment when it
has one: ElevenLabs returns character timestamps). Scripts keep phrases short (<= ~9 words) so
word-level error stays small; the storyboard anchors reveals to words.
"""
from __future__ import annotations

import re
import wave
from pathlib import Path

import numpy as np

from ..util import LoomError, info, read_json, sha, write_json
from . import providers

SR = 24000
LEAD_S = 0.6
TAIL_S = 1.4
GAP_COMMA = 0.2
GAP_STOP = 0.34
# silence before a beat, sized to how the picture gets there (camera moves need room to land): the timing grid's
# table (loom/timing.py, D-173), sized for the join the film really shows
from ..timing import BEAT_GAP, join_gap  # noqa: E402

_WORD = re.compile(r"[\w'’\-\.%$€£]+", re.UNICODE)


def _words(text: str) -> list[str]:
    return [w for w in text.split() if re.search(r"\w", w)]


def _weights(words: list[str], phonemize) -> list[float]:
    out = []
    for w in words:
        core = re.sub(r"[^\w'’]", "", w)
        n = 0
        if phonemize is not None:
            try:
                n = len(re.sub(r"[ˈˌ\s.,!?;:]", "", phonemize(core)))
            except Exception:
                n = 0
        if n <= 0:
            n = max(1, len(core))
        # trailing punctuation gets a little held time (the voice slows into it)
        tail = 1.6 if re.search(r"[,;:]$", w) else 2.4 if re.search(r"[.!?]$", w) else 0.0
        out.append(n + 1.2 + tail)
    return out


def _trim(a: np.ndarray, thr: float = 0.008) -> np.ndarray:
    idx = np.where(np.abs(a) > thr)[0]
    if len(idx) == 0:
        return a
    return a[max(0, idx[0] - int(0.01 * SR)): idx[-1] + int(0.02 * SR)]


def write_wav(path: Path, samples: np.ndarray, sr: int = SR) -> None:
    x = np.clip(samples, -1, 1)
    pcm = (x * 32767).astype(np.int16)
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes(pcm.tobytes())


def read_wav(path: Path) -> tuple[np.ndarray, int]:
    with wave.open(str(path), "rb") as w:
        sr = w.getframerate(); n = w.getnframes(); ch = w.getnchannels()
        data = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float32) / 32767
    if ch > 1:
        data = data.reshape(-1, ch).mean(axis=1)
    return data, sr


# the voice speed by kind of video (D-196), a RANGE per kind (D-197). Kshitij, on the speed tests: "1 sounds a bit too fast
# ... Teaching - 0.8 sounds good, explainer - 0.9, product explainer - 0.9 or .95 and onboarding - 0.85 to 1", then "keep a
# range for all skills like teaching can be 0.75 - .85 and so on so that there is actually decision made after looking at
# the topic and the narration". Policy and soft-skills (not named) are the agent's picks. The script writer chooses the
# speed inside its kind's range (`voice_speed: {value, why}`); without one, `suggest_speed` reads it from the script.
KIND_RANGE = {"teaching": (0.75, 0.85), "explainer": (0.85, 0.95), "product": (0.9, 0.95), "onboarding": (0.85, 1.0),
              "policy": (0.75, 0.85), "soft-skills": (0.8, 0.9)}
DEFAULT_RANGE = (0.8, 0.9)
KIND_SPEED = {k: round((a + b) / 2, 3) for k, (a, b) in KIND_RANGE.items()}   # the middle of each range
DEFAULT_SPEED = 0.85


def kind_of(project) -> str:
    from ..genre import of
    return of(project)


def kind_range(project) -> tuple[float, float]:
    return KIND_RANGE.get(kind_of(project), DEFAULT_RANGE)


def kind_speed(project) -> float:
    return KIND_SPEED.get(kind_of(project), DEFAULT_SPEED)


def suggest_speed(project, script: dict) -> tuple[float, str]:
    """A speed inside the kind's range, from the narration itself: slower for dense words (long words, numbers), long
    sentences and an audience new to the subject; faster for plain, familiar narration. (speed, why)"""
    lo, hi = kind_range(project)
    text = " ".join(" ".join(b.get("narration") or []) for b in script.get("beats") or [])
    words = re.findall(r"[A-Za-z0-9][A-Za-z0-9'%.-]*", text)
    n = max(1, len(words))
    long_share = sum(1 for w in words if len(w.strip(".")) >= 9) / n
    nums = sum(1 for w in words if any(c.isdigit() for c in w)) * 100 / n
    sents = [x for x in re.split(r"[.!?]+", text) if x.strip()]
    msl = n / max(1, len(sents))
    brief = {}
    try:
        brief = read_json(project.path("plan/brief.json"), {}) or {}
    except Exception:
        pass
    aud = (str(brief.get("audience") or "") + " " + str((project.request or {}).get("audience") or "")).lower()
    novice = bool(re.search(r"\b(new to|novice|beginner|non-technical|no prior|first time|unfamiliar)\b", aud))
    # calibrated on the saved scripts: long words run 1 to 8 %, numbers 0 to 3 per 100 words, sentences 5 to 10 words
    d = 0.45 * min(1.0, long_share / 0.08) + 0.25 * min(1.0, nums / 3.0) + 0.15 * min(1.0, max(0.0, msl - 6) / 8)
    d = min(1.0, d + (0.15 if novice else 0.0))
    sp = round(hi - d * (hi - lo), 2)
    why = (f"{kind_of(project)} range {lo}-{hi}; narration density {d:.2f} (long words {long_share:.0%}, {nums:.1f} numbers per 100 "
           f"words, {msl:.1f} words a sentence{', an audience new to it' if novice else ''})")
    return sp, why


def _resolve_speed(project) -> None:
    """`voice.speed: "auto"` (or none) becomes a speed inside the kind's range: the script's own choice (`voice_speed`) when it
    made one inside the range, else suggest_speed's. Written into the request once with its reason (`speed_by`), so a rerun
    says the same and the person sees what was decided and why; the decision ledger records it."""
    voice = dict(project.request.get("voice") or {})
    sp = voice.get("speed")
    if sp not in (None, "", "auto"):
        return
    lo, hi = kind_range(project)
    try:
        script = read_json(project.path("plan/script.json"), {}) or {}
    except Exception:
        script = {}
    vs = script.get("voice_speed") if isinstance(script.get("voice_speed"), dict) else None
    if vs and isinstance(vs.get("value"), (int, float)) and lo - 1e-9 <= float(vs["value"]) <= hi + 1e-9:
        speed, why, by = round(float(vs["value"]), 3), str(vs.get("why") or "")[:300], "script"
    else:
        speed, why = suggest_speed(project, script)
        by = "narration density"
    cfg = project.cfg
    v = cfg["request"].setdefault("voice", {})
    v["speed"] = speed
    v["speed_by"] = f"{by}: {why} (D-197)"
    project.save_cfg(cfg)
    try:
        from .. import ledger as L
        L.log(project, "voice_speed", node="narrate", decision="voice_speed", choice=speed,
              by={"kind": "code" if by != "script" else "agent", "who": "loom/narrate" if by != "script" else "the script writer"},
              data={"range": [lo, hi], "kind": kind_of(project), "why": why})
    except Exception:
        pass
    info(f"narration: voice speed {speed} ({by}; {kind_of(project)} range {lo}-{hi})")


def narrate(project, force: bool = False, calibrate: bool = True) -> dict:
    """Synthesise at the voice speed of the kind of video (D-196), unless the request names one. The old automatic
    calibration (re-synthesise until the script's wpm_target is met) is opt-in now (`voice.calibrate: true`): it measured
    the rate over speech time only, every pause removed, against a target that includes the pauses, so it slowed every
    Kokoro voice to its 0.7 floor and the films played at about 114 words a minute (docs/research/2026-10-16-narration/
    SPEED_FINDING.md)."""
    _resolve_speed(project)
    out = _narrate(project, force)
    script = read_json(project.path("plan/script.json"))
    target = float(script.get("wpm_target") or 150)
    voice = dict(project.request.get("voice") or {})
    # once means once (L-161): speed and measured rate are not proportional, so a second pass can miss again and
    # every later run would re-synthesise the whole lesson. The pass records `calibrated`. Opt-in only (D-196).
    if voice.get("calibrated") or voice.get("calibrate") is not True:
        return out
    if calibrate and voice.get("provider", "kokoro") in ("kokoro", "openai") and abs(out["words_per_minute"] - target) / target > 0.08:
        sp = float(voice.get("speed") or 1.0)
        # never under 0.8 (the slowest kind's speed): below it a Kokoro voice stretches and goes flat (D-196)
        new = round(max(0.8, min(1.25, sp * target / out["words_per_minute"])), 3)
        if abs(new - sp) > 0.01:
            info(f"narration: {out['words_per_minute']} wpm vs target {target}: re-synthesising at speed {new}")
            cfg = project.cfg
            cfg["request"].setdefault("voice", {})["speed"] = new
            cfg["request"]["voice"]["calibrated"] = True
            project.save_cfg(cfg)
            out = _narrate(project, force)
    return out


def settled_joins(project, script: dict) -> dict:
    """{beat: join type} as compose will settle them (a meaning join, a style's seam join; loom/timing.resolve_joins),
    so the silence before a beat fits the join the film shows. Before D-173 narrate read the storyboard's raw type."""
    import copy
    sbp = project.path("plan/storyboard.json")
    if not sbp.exists():
        return {}
    sb = read_json(sbp)
    by_beat = {sc["beat"]: sc for sc in sb.get("scenes", []) if isinstance(sc, dict) and sc.get("beat")}
    scenes = [copy.deepcopy(by_beat[b["id"]]) for b in script["beats"] if b["id"] in by_beat]
    try:
        from ..compose import load_style
        style = load_style(sb.get("style") or project.request.get("style") or "flat-cosmos")
    except LoomError:
        style = {}
    from ..timing import resolve_joins
    resolve_joins(scenes, sb, style)
    return {sc["beat"]: (sc.get("join_in") or {}).get("type") for sc in scenes}


def _narrate(project, force: bool = False) -> dict:
    script = read_json(project.path("plan/script.json"))
    voice = dict(project.request.get("voice") or {})
    prov = providers.get(voice.get("provider", "kokoro"))
    cache = project.path("audio/cache")
    cache.mkdir(parents=True, exist_ok=True)
    phonemize = prov.phonemizer()
    chunks: list[np.ndarray] = [np.zeros(int(LEAD_S * SR), np.float32)]
    t = LEAD_S
    beats_out = []
    n_synth = 0
    joins = settled_joins(project, script)
    ids = [b["id"] for b in script["beats"]]
    for bi, beat in enumerate(script["beats"]):
        phrases_out = []
        s0 = t
        for pi, text in enumerate(beat["narration"]):
            text = text.strip()
            key = sha(prov.name, voice.get("voice"), voice.get("speed", 1.0), prov.version, text)
            wav = cache / f"{key}.wav"
            align = cache / f"{key}.align.json"
            if force or not wav.exists():
                audio, sr, char_align = prov.synth(text, voice)
                if sr != SR:
                    audio = _resample(audio, sr, SR)
                audio = _trim(audio.astype(np.float32))
                write_wav(wav, audio)
                write_json(align, {"chars": char_align} if char_align else {})
                n_synth += 1
            audio, _ = read_wav(wav)
            d = len(audio) / SR
            words = _words(text)
            al = read_json(align, {}).get("chars") if align.exists() else None
            wl = _place_words(words, text, t, d, al, phonemize)
            phrases_out.append({"text": text, "s": round(t, 3), "e": round(t + d, 3), "words": wl})
            chunks.append(audio)
            t += d
            last = pi == len(beat["narration"]) - 1
            if not last:
                g = GAP_COMMA if re.search(r"[,;:]$", text) else GAP_STOP
                chunks.append(np.zeros(int(g * SR), np.float32)); t += g
        s1 = t
        pause = float(beat.get("pause_after_s") or 0)
        nxt = ids[bi + 1] if bi + 1 < len(ids) else None
        gap = join_gap(joins.get(nxt)) + pause
        chunks.append(np.zeros(int(gap * SR), np.float32))
        beats_out.append({"id": beat["id"], "section": beat["section"], "speech_start": round(s0, 3), "speech_end": round(s1, 3),
                          "pause_after": pause, "phrases": phrases_out})
        t += gap
    chunks.append(np.zeros(int(TAIL_S * SR), np.float32))
    t += TAIL_S
    audio = np.concatenate(chunks)
    peak = float(np.max(np.abs(audio))) or 1.0
    audio = audio / peak * 0.9
    write_wav(project.path("audio/narration.wav"), audio)
    # beat windows: each beat owns [boundary before its speech, boundary before the next]
    for i, b in enumerate(beats_out):
        prev_end = beats_out[i - 1]["speech_end"] + beats_out[i - 1]["pause_after"] if i else 0.0
        b["start"] = round(0.0 if i == 0 else (prev_end + b["speech_start"]) / 2, 3)
    for i, b in enumerate(beats_out):
        b["end"] = round(beats_out[i + 1]["start"] if i + 1 < len(beats_out) else t, 3)
    duration = round(len(audio) / SR, 3)
    env = envelope(audio, SR, 30)
    out = {"provider": prov.name, "voice": voice.get("voice"), "sr": SR, "duration": duration, "words_per_minute": _wpm(beats_out),
           "beats": beats_out}
    write_json(project.path("audio/timings.json"), out)
    write_json(project.path("audio/envelope.json"), {"fps": 30, "values": env})
    info(f"narration: {len(beats_out)} beats, {duration:.1f}s, {n_synth} phrases synthesised ({prov.name}:{voice.get('voice')})")
    return out


def _wpm(beats) -> float:
    words = sum(len(w) for b in beats for w in [sum((p["words"] for p in b["phrases"]), [])])
    speech = sum(p["e"] - p["s"] for b in beats for p in b["phrases"])
    return round(words / max(1e-6, speech) * 60, 1)


def _place_words(words, text, t0, d, char_align, phonemize):
    if not words:
        return []
    if char_align:
        # provider alignment: [{"c": char, "s": sec, "e": sec}] over `text`
        out, pos = [], 0
        for w in words:
            i = text.find(w, pos)
            if i < 0:
                break
            j = i + len(w) - 1
            cs = [c for c in char_align if i <= c["i"] <= j]
            if cs:
                out.append({"w": w, "s": round(t0 + cs[0]["s"], 3), "e": round(t0 + cs[-1]["e"], 3)})
            pos = j + 1
        if len(out) == len(words):
            return out
    wts = _weights(words, phonemize)
    tot = sum(wts)
    acc = 0.0
    out = []
    for w, wt in zip(words, wts):
        out.append({"w": w, "s": round(t0 + d * acc / tot, 3), "e": round(t0 + d * (acc + wt) / tot, 3)})
        acc += wt
    return out


def _resample(x: np.ndarray, sr: int, to: int) -> np.ndarray:
    n = int(len(x) * to / sr)
    return np.interp(np.linspace(0, len(x) - 1, n), np.arange(len(x)), x).astype(np.float32)


def envelope(audio: np.ndarray, sr: int, fps: int) -> list[float]:
    hop = sr // fps
    n = len(audio) // hop
    rms = np.sqrt(np.mean(audio[: n * hop].reshape(n, hop) ** 2, axis=1))
    ref = np.percentile(rms[rms > 1e-4], 95) if np.any(rms > 1e-4) else 1.0
    v = np.clip(rms / (ref or 1.0), 0, 1)
    return [round(float(x), 3) for x in v]


def speed_block(project) -> str:
    """The script stage's instruction (D-197): choose the narrator's speed inside the kind's range, and say why."""
    lo, hi = kind_range(project)
    return (f"VOICE SPEED (D-197): this is {'an' if kind_of(project)[:1] in 'aeiou' else 'a'} {kind_of(project)} video; the narrator's speed "
            f"is yours to choose between {lo} and {hi}. Write `voice_speed: {{value, why}}` in the script: the slower end for dense "
            "or technical narration, many numbers or names, or an audience new to the subject; the faster end for plain, "
            "familiar, story-led narration. Say what in this topic and this narration decided it. Without one, narrate reads "
            "it from the script's density.")
