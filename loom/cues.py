"""Cue resolution: anchor phrases (the words a reveal lands on) -> absolute seconds.

An anchor is a short run of words that the narration actually says. Matching is on
normalised tokens (case, punctuation, curly quotes ignored), contiguous, across phrase
boundaries inside ONE beat. A bare token may also match as a prefix ("forget" ~ "forgetting")
- that is reported as a warning so the author can tighten it. Anything that does not resolve
is an ERROR: a reveal with no spoken word under it is exactly the defect this engine exists to
prevent.
"""
from __future__ import annotations

import re
import unicodedata

_PUNCT = re.compile(r"[^\w%$€£\-']+", re.UNICODE)


def norm(tok: str) -> str:
    t = unicodedata.normalize("NFKC", tok).lower().replace("’", "'").replace("‘", "'")
    t = t.strip(".,;:!?\"()[]{}“”«»…")
    t = _PUNCT.sub("", t)
    return t.strip("-'")


def beat_words(beat: dict) -> list[dict]:
    out = []
    for ph in beat["phrases"]:
        for w in ph["words"]:
            out.append({"n": norm(w["w"]), "s": w["s"], "e": w["e"], "w": w["w"]})
    return out


def resolve(anchor: str, words: list[dict]) -> tuple[float | None, str]:
    toks = [norm(x) for x in str(anchor).split() if norm(x)]
    if not toks:
        return None, "empty anchor"
    ns = [w["n"] for w in words]
    L = len(toks)
    for i in range(len(ns) - L + 1):
        if ns[i:i + L] == toks:
            return words[i]["s"], "exact"
    # tolerant: each token is a prefix of the spoken token (plural, -ing), min 4 chars
    for i in range(len(ns) - L + 1):
        if all(len(t) >= 4 and ns[i + k].startswith(t) or ns[i + k] == t for k, t in enumerate(toks)):
            return words[i]["s"], "prefix"
    return None, "not spoken in this beat"


def is_anchor_key(k: str) -> bool:
    """Anchor keys: say, say_*, *_say, cue, *_cue (e.g. say_title, fade_say, title_cue)."""
    return k in ("say", "cue") or k.startswith("say_") or k.endswith("_say") or k.endswith("_cue")


def collect_anchors(obj, out: list[str]) -> list[str]:
    """Every string value under an anchor key (any depth) is an anchor."""
    if isinstance(obj, dict):
        for k, v in obj.items():
            if is_anchor_key(k) and isinstance(v, str) and v.strip():
                out.append(v.strip())
            else:
                collect_anchors(v, out)
    elif isinstance(obj, list):
        for v in obj:
            collect_anchors(v, out)
    return out


_JS_CUE = re.compile(r"""\b(?:cue|has)\(\s*(["'`])((?:(?!\1).){1,120})\1""")


def anchors_in_js(src: str) -> list[str]:
    return [m.group(2).strip() for m in _JS_CUE.finditer(src)]


def suggest(anchor: str, words: list[dict]) -> str:
    toks = [norm(x) for x in anchor.split() if norm(x)]
    spoken = " ".join(w["w"] for w in words)
    hits = [w["w"] for w in words if toks and w["n"][:3] == toks[0][:3]]
    return f"spoken: \"{spoken[:160]}\"" + (f"; near: {', '.join(hits[:4])}" if hits else "")
