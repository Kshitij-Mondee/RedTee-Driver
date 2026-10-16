"""Speech check (D-174): every narrated phrase is transcribed back and compared with the script.

TTS can say the wrong thing silently: a number read as another, a name mangled, a word dropped. Timings, cues and
captions are all built on the words the script says, so a phrase the voice did not say breaks them unseen. This runs
faster-whisper over each phrase of audio/narration.wav (cut at the phrase's measured boundaries, 0.6 s of silence
padded each side: short phrases are misheard without it) and compares the words.

Comparison: lower case, punctuation dropped, numbers written out the same way on both sides (so "40", "forty" and
"40." agree; a four-digit year reads as a year), contractions kept whole. A phrase FAILS when
  - a CRITICAL word differs: a number, or a word written with a capital inside the sentence (a name, a product), or
  - the word error rate is above 0.25 (more than one word in four wrong).
Smaller differences (one ordinary word in a long phrase: "a" heard as "the") are warnings; Whisper mishears too.
A person who listened and found the voice right accepts the heard text for that phrase:
`py -m loom asr <id> --accept b07.2` (stored in plan/asr_accept.json, tied to the phrase text; a changed phrase is
checked again).

Results are cached per phrase audio and model (audio/cache/asr/<sha>.json), so re-narrating re-checks only what changed.
The model is local: LOOM_ASR_MODEL (default small.en, already in the Hugging Face cache on Kshitij's PC) and no network
is used (local_files_only). A machine without faster-whisper or the model reports NOT CHECKED as an error, never a pass,
unless the lesson's request says `"asr": "off"` (then a warning says so).
"""
from __future__ import annotations

import difflib
import os
import re

import numpy as np

from ..util import read_json, sha, write_json

SR_IN = 16000
PAD_S = 0.6
WER_MAX = 0.25
DEFAULT_MODEL = "small.en"

_ONES = "zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen".split()
_TENS = "x x twenty thirty forty fifty sixty seventy eighty ninety".split()
_SCALES = [(10 ** 12, "trillion"), (10 ** 9, "billion"), (10 ** 6, "million"), (1000, "thousand")]
_ORD = {"one": "first", "two": "second", "three": "third", "five": "fifth", "eight": "eighth", "nine": "ninth", "twelve": "twelfth"}


def _under_1000(n: int) -> list[str]:
    out = []
    if n >= 100:
        out += [_ONES[n // 100], "hundred"]; n %= 100
    if n >= 20:
        out.append(_TENS[n // 10]); n %= 10
        if n:
            out.append(_ONES[n])
    elif n or not out:
        out.append(_ONES[n])
    return out


def int_words(n: int) -> list[str]:
    if n == 0:
        return ["zero"]
    out = []
    for v, name in _SCALES:
        if n >= v:
            out += _under_1000(n // v) + [name]; n %= v
    if n:
        out += _under_1000(n)
    return out


def year_words(n: int) -> list[str]:
    """1990 -> nineteen ninety; 2005 -> two thousand five; 2024 -> twenty twenty four"""
    hi, lo = divmod(n, 100)
    if 2000 <= n < 2010:
        return int_words(n)
    return _under_1000(hi) + (["hundred"] if lo == 0 else (["oh"] + _under_1000(lo) if lo < 10 else _under_1000(lo)))


def _ordinal(words: list[str]) -> list[str]:
    last = words[-1]
    if last in _ORD:
        return words[:-1] + [_ORD[last]]
    if last.endswith("y"):
        return words[:-1] + [last[:-1] + "ieth"]
    return words[:-1] + [last + "th"]


def number_words(tok: str) -> list[str] | None:
    """a token that is a number, written out; None when it is not one"""
    t = tok.replace(",", "")
    m = re.fullmatch(r"(\d+)(st|nd|rd|th)", t)
    if m:
        return _ordinal(int_words(int(m.group(1))))
    m = re.fullmatch(r"(\d+)(?:\.(\d+))?(%?)", t)
    if not m:
        return None
    whole, frac, pct = m.group(1), m.group(2), m.group(3)
    n = int(whole)
    if not frac and len(whole) == 4 and 1100 <= n <= 2099 and not pct:
        w = year_words(n)
    else:
        w = int_words(n)
    if frac:
        w = w + ["point"] + [_ONES[int(d)] for d in frac]
    if pct:
        w = w + ["percent"]
    return w


_NOT_OUR = {"our", "ours", "four", "hour", "hours", "your", "yours", "pour", "tour", "tours", "flour", "sour", "dour", "contour"}


def _fold(w: str) -> str:
    """British and American spellings compare equal (the voice says them the same): metre/meter, colour/color,
    organise/organize"""
    w = re.sub(r"(?<=[a-z]{2})tre(s?)$", lambda m: "ter" + m.group(1), w)
    if w not in _NOT_OUR:
        w = re.sub(r"(?<=[a-z]{2})our(s|ed|ing|ite|ites|able)?$", lambda m: "or" + (m.group(1) or ""), w)
    return re.sub(r"(?<=[a-z]{3})is(e|es|ed|ing|ation|ations)$", lambda m: "iz" + m.group(1), w)


def words_of(text: str) -> list[tuple[str, bool]]:
    """[(normalised word, critical)] for comparing a phrase with what was heard"""
    out = []
    raw = re.findall(r"[A-Za-z0-9][A-Za-z0-9'’.,%]*", text.replace("-", " ").replace("’", "'"))
    for i, tok in enumerate(raw):
        tok = tok.rstrip(".,")
        num = number_words(tok)
        if num:
            out += [(w, True) for w in num]
            continue
        cap = tok[:1].isupper() and i > 0 and not raw[i - 1].endswith(".")
        w = re.sub(r"[^a-z0-9]", "", tok.lower())   # apostrophes dropped: "satellites'" and "satellite's" sound alike
        if w == "per" and i + 1 < len(raw) and raw[i + 1].lower().startswith("cent"):
            continue
        if w == "cent" and out and out[-1][0] == "per":
            continue
        if w:
            out.append(("percent" if w in ("percent", "pct") else _fold(w), bool(cap)))
    return out


EDGE_FILLER = {"a", "an", "and", "the", "so", "but", "uh", "um", "oh", "ah"}


def compare(expected: str, heard: str) -> dict:
    """{ok, wer, critical: [(want, got)], minor: [(want, got)]}. A filler word Whisper adds at the very start or end of a
    short cut ("And nothing goes up", "A gravity wins") is its artefact, not the voice's, and is ignored."""
    a, b = words_of(expected), words_of(heard)
    while b and b[0][0] in EDGE_FILLER and (not a or a[0][0] != b[0][0]):
        b = b[1:]
    while b and b[-1][0] in EDGE_FILLER and (not a or a[-1][0] != b[-1][0]):
        b = b[:-1]
    aw, bw = [w for w, _ in a], [w for w, _ in b]
    sm = difflib.SequenceMatcher(None, aw, bw, autojunk=False)
    crit, minor, errs = [], [], 0
    for op, i1, i2, j1, j2 in sm.get_opcodes():
        if op == "equal":
            continue
        errs += max(i2 - i1, j2 - j1)
        want, got = " ".join(aw[i1:i2]), " ".join(bw[j1:j2])
        if any(c for _, c in a[i1:i2]) or (op == "insert" and any(c for _, c in b[j1:j2])):
            crit.append((want, got))
        else:
            minor.append((want, got))
    wer = errs / max(1, len(aw))
    return {"ok": not crit and wer <= WER_MAX, "wer": round(wer, 3), "critical": crit, "minor": minor}


# ---------------------------------------------------------------- audio and the model
_MODEL = {}


def load_model(name: str):
    if name in _MODEL:
        return _MODEL[name]
    from faster_whisper import WhisperModel  # noqa: raises ImportError on a machine without it
    m = WhisperModel(name, device="cpu", compute_type="int8", local_files_only=True)
    _MODEL[name] = m
    return m


def _resample(x: np.ndarray, sr: int) -> np.ndarray:
    if sr == SR_IN:
        return x.astype(np.float32)
    n = int(round(len(x) * SR_IN / sr))
    return np.interp(np.arange(n) * sr / SR_IN, np.arange(len(x)), x).astype(np.float32)


def transcribe(model, audio16: np.ndarray, lang: str = "en") -> str:
    pad = np.zeros(int(PAD_S * SR_IN), np.float32)
    segs, _ = model.transcribe(np.concatenate([pad, audio16, pad]), beam_size=5, language=lang, vad_filter=False,
                               condition_on_previous_text=False)
    return " ".join(s.text.strip() for s in segs).strip()


def transcribe_words(model, audio16: np.ndarray, lang: str = "en") -> list[dict]:
    """one pass over the whole narration: [{w, s, e}] (seconds). About 7 times faster than phrase by phrase, and
    Whisper hears each phrase in context"""
    segs, _ = model.transcribe(audio16, beam_size=5, language=lang, word_timestamps=True, condition_on_previous_text=False,
                               vad_filter=False)
    return [{"w": w.word, "s": round(float(w.start), 3), "e": round(float(w.end), 3)} for s in segs for w in (s.words or [])]


def phrase_slices(project):
    """[(phrase id, text, audio at 16 kHz)] cut from audio/narration.wav at the measured phrase boundaries"""
    from . import read_wav
    tm = read_json(project.path("audio/timings.json"))
    x, sr = read_wav(project.path("audio/narration.wav"))
    out = []
    for b in tm["beats"]:
        for k, ph in enumerate(b.get("phrases") or []):
            i0, i1 = max(0, int(ph["s"] * sr)), min(len(x), int(ph["e"] * sr) + 1)
            out.append((f"{b['id']}.{k + 1}", ph["text"], _resample(x[i0:i1], sr), ph["s"], ph["e"]))
    return out


def check_speech(project, model_name: str | None = None, transcriber=None) -> tuple[list[str], list[str], dict]:
    """Errors, warnings and stats for the lesson's narration. `transcriber(audio16) -> text` replaces Whisper in tests."""
    E, W = [], []
    custom = transcriber is not None   # a stand-in (tests): never read or written to the cache
    req = project.request or {}
    if str(req.get("asr", "")).lower() == "off":
        W.append("speech check: off for this lesson (request asr: off); the narration was NOT checked against the script")
        return E, W, {"checked": False, "off": True}
    model_name = model_name or os.environ.get("LOOM_ASR_MODEL") or DEFAULT_MODEL
    lang = "en" if model_name.endswith(".en") else (req.get("language") or "en")
    if transcriber is None:
        try:
            model = load_model(model_name)
        except ImportError:
            E.append("speech check: NOT CHECKED, faster-whisper is not installed (py -m pip install faster-whisper), or set "
                     "\"asr\": \"off\" in the lesson request to skip it knowingly")
            return E, W, {"checked": False}
        except Exception as ex:   # noqa: BLE001  the model is missing locally (no network here) or broken
            E.append(f"speech check: NOT CHECKED, the Whisper model '{model_name}' could not be loaded offline ({str(ex)[:160]}); "
                     "set LOOM_ASR_MODEL to a local model")
            return E, W, {"checked": False}
        transcriber = lambda a: transcribe(model, a, lang)   # noqa: E731
    if not project.path("audio/narration.wav").exists() or not project.path("audio/timings.json").exists():
        E.append("speech check: NOT CHECKED, no audio/narration.wav or audio/timings.json (run the narrate stage)")
        return E, W, {"checked": False}
    accept = read_json(project.path("plan/asr_accept.json"), {}) if project.path("plan/asr_accept.json").exists() else {}
    cache = project.path("audio/cache/asr")
    cache.mkdir(parents=True, exist_ok=True)
    rows, n_fail, n_warn = [], 0, 0
    slices = phrase_slices(project)
    whole = None
    if not custom:
        # one pass over the whole narration (cached by its audio), then each doubtful phrase on its own: a phrase cut
        # alone is heard more exactly at its edges, where a whole pass can give a word to its neighbour
        from . import read_wav
        x, sr = read_wav(project.path("audio/narration.wav"))
        a16 = _resample(x, sr)
        wf = cache / f"whole_{sha((a16 * 32767).astype(np.int16).tobytes(), model_name)}.json"
        if wf.exists():
            whole = read_json(wf)["words"]
        else:
            whole = transcribe_words(model, a16, lang)
            write_json(wf, {"words": whole, "model": model_name})
    for pid, text, audio, s0, s1 in slices:
        heard = None
        if whole is not None:
            heard = "".join(w["w"] for w in whole if s0 - 0.15 <= (w["s"] + w["e"]) / 2 <= s1 + 0.15).strip()
            r0 = compare(text, heard)
            if r0["ok"] and not r0["minor"]:
                rows.append({"phrase": pid, "text": text, "heard": heard, "pass": "whole", **r0})
                continue
        cf = cache / f"{sha((audio * 32767).astype(np.int16).tobytes(), model_name)}.json"
        if not custom and cf.exists():
            heard = read_json(cf)["heard"]
        else:
            heard = transcriber(audio)
            if not custom:
                write_json(cf, {"heard": heard, "model": model_name})
        acc = accept.get(pid) or {}
        if acc.get("text") == text and acc.get("heard") == heard:
            rows.append({"phrase": pid, "text": text, "heard": heard, "ok": True, "accepted": True})
            continue
        r = compare(text, heard)
        rows.append({"phrase": pid, "text": text, "heard": heard, **r})
        if not r["ok"]:
            n_fail += 1
            what = "; ".join(f"\"{w}\" heard as \"{g}\"" for w, g in (r["critical"] or r["minor"])[:3])
            E.append(f"{pid.split('.')[0]}: speech: phrase {pid} \"{text[:60]}\" was heard as \"{heard[:60]}\" ({what}; word error "
                     f"{r['wer']:.0%}). Change the wording or spell the number or name the way it should be said; if you "
                     f"listened and it is right: py -m loom asr <id> --accept {pid}")
        elif r["minor"]:
            n_warn += 1
            W.append(f"{pid.split('.')[0]}: speech: phrase {pid}: "
                     + "; ".join(f"\"{w}\" heard as \"{g}\"" for w, g in r["minor"][:3]) + " (minor; listen if unsure)")
    if not rows:
        E.append("speech check: 0 phrases measured although the lesson is narrated: the check is blind, not the lesson clean")
    write_json(project.path("qa/asr.json"), {"model": model_name, "phrases": rows})
    return E, W, {"checked": True, "phrases": len(rows), "failed": n_fail, "minor": n_warn, "model": model_name}


def accept(project, phrase_id: str) -> dict:
    """record that a person listened to `phrase_id` and the voice is right (stored against its text and what was heard)"""
    rep = read_json(project.path("qa/asr.json"), {})
    row = next((r for r in rep.get("phrases") or [] if r["phrase"] == phrase_id), None)
    if not row:
        raise ValueError(f"no phrase {phrase_id} in qa/asr.json (run py -m loom asr <id> first)")
    f = project.path("plan/asr_accept.json")
    acc = read_json(f, {}) if f.exists() else {}
    acc[phrase_id] = {"text": row["text"], "heard": row["heard"]}
    write_json(f, acc)
    return acc[phrase_id]
