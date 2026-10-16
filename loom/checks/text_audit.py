"""Sample-text detector: every word a TEMPLATE draws must come from the props the storyboard gave it.

This is behavioural, not a code read: it audits the text the runtime actually drew (Loom.report.texts),
beat by beat, against the strings in that scene's props. A word on screen that no prop supplied is a
leak: a hard-coded sample string or a content default (RedTee shipped 48 designs printing invented
facts, including a fabricated citation, from exactly this). Structural words a template legitimately
owns ("Why not", a default "Your turn" kicker) are declared as CHROME: a template-level `chrome: [...]`
list, or `chrome: true` on a prop whose default is structural.

Bespoke scenes get a different audit (below): every word they draw must be in the lesson's own vocabulary.
RedTee scenes are external.
"""
from __future__ import annotations

import re

AUDITED_KINDS = ("template", "blueprint", "avatar")
STOP = {"the", "and", "for", "not", "but", "with", "you", "your", "are", "was", "its", "this", "that", "from",
        "into", "onto", "than", "then", "what", "who", "how", "has", "had", "have", "all", "any", "can"}
_WORD = re.compile(r"[a-z]{3,}")


def words(s: str) -> set[str]:
    return set(_WORD.findall(str(s).lower()))


def _strings(o):
    if isinstance(o, str):
        yield o
    elif isinstance(o, dict):
        for v in o.values():
            yield from _strings(v)
    elif isinstance(o, list):
        for v in o:
            yield from _strings(v)


def _chrome_defaults(spec: dict) -> list[str]:
    out = []
    for k, s in (spec or {}).items():
        if s.get("chrome") and isinstance(s.get("default"), str):
            out.append(s["default"])
        if s.get("of"):
            out += _chrome_defaults(s["of"])
    return out


def allowed_words(props: dict, entry: dict | None) -> set[str]:
    ok = set(STOP)
    for s in _strings(props or {}):
        ok |= words(s)
    if entry:
        for s in entry.get("chrome") or []:
            ok |= words(s)
        for s in _chrome_defaults(entry.get("props") or {}):
            ok |= words(s)
    return ok


def leaks_for(texts: list[dict], props: dict, entry: dict | None) -> list[dict]:
    ok = allowed_words(props, entry)
    out = []
    for t in texts:
        bad = sorted(words(t.get("text", "")) - ok)
        if bad:
            out.append({"text": t.get("text", "")[:120], "words": bad})
    return out


def audit(texts: list[dict], storyboard: dict, catalog: dict) -> list[dict]:
    """texts: runtime report texts ({beat, text}); returns leaks [{beat, template, text, words}]."""
    by_beat = {}
    for t in texts:
        by_beat.setdefault(t.get("beat"), []).append(t)
    out = []
    for sc in storyboard.get("scenes", []):
        if sc.get("kind") not in AUDITED_KINDS:
            continue
        tid = sc.get("template") or sc.get("blueprint") or "avatar"
        entry = (catalog.get("templates") or {}).get(tid) or (catalog.get("blueprints") or {}).get(tid)
        for lk in leaks_for(by_beat.get(sc["beat"], []), sc.get("props") or {}, entry):
            out.append({"beat": sc["beat"], "template": tid, **lk})
    return out


# ------------------------------------------------------------------ bespoke scenes: the lesson's own vocabulary
# A bespoke scene's words are authored per lesson, so the prop audit above cannot judge them. What it can judge: every
# word a scene draws must be a word the lesson already has (its script, storyboard or knowledge sheet). A scene worker
# whose ctx.held failed invented "In yesterday's release planning meeting," in a fallback (bench mixed-value b11 and
# b13, 2026-10-06): no fact sheet, no script line, no storyboard field had those words. A RATCHET before a gate: the
# finished lessons' current leaks are recorded (film_baseline.json, gates `vocab` and `scenes`); anything new fails.
VOCAB_STOP = STOP | {"use", "strict"}
# (suffix, replacement). The first version stripped only -s/-ed/-ing and flagged word forms of the lesson's own words
# on finished lessons ("Verify" where the script says "verified", "taken" for "take", "files" for "file"); a
# finding on reviewed work is a tool bug first (CLAUDE.md rule 12), so word forms now meet at one stem
_SUFFIX = (("ications", "y"), ("ication", "y"), ("ations", ""), ("ation", ""), ("ings", ""), ("ing", ""), ("ies", "y"),
           ("ied", "y"), ("ers", ""), ("er", ""), ("ens", ""), ("en", ""), ("es", ""), ("ed", ""), ("s", ""), ("ly", ""))
# day and month abbreviations stand for the full word (a week drawn as Mon to Fri)
ABBREV = {"mon": "monday", "tue": "tuesday", "tues": "tuesday", "wed": "wednesday", "thu": "thursday", "thur": "thursday",
          "thurs": "thursday", "fri": "friday", "sat": "saturday", "sun": "sunday", "jan": "january", "feb": "february",
          "mar": "march", "apr": "april", "jun": "june", "jul": "july", "aug": "august", "sep": "september", "sept": "september",
          "oct": "october", "nov": "november", "dec": "december"}


def stem(w: str) -> str:
    w = ABBREV.get(w, w)
    for suf, rep in _SUFFIX:
        if w.endswith(suf) and len(w) - len(suf) >= 3:
            w = w[:-len(suf)] + rep
            break
    if len(w) >= 4 and w[-1] == w[-2] and w[-1] not in "lsz":     # planning -> plann -> plan
        w = w[:-1]
    if len(w) >= 4 and w.endswith("e"):                            # take, taken -> tak; file, files -> fil
        w = w[:-1]
    return w


def vocab_words(s: str) -> set[str]:
    return {stem(w) for w in _WORD.findall(str(s).lower())}


def missing_words(s: str, vocab: set[str]) -> list[str]:
    """The words of s (as written, lower case) whose stem the lesson's vocabulary does not have."""
    return sorted({w for w in _WORD.findall(str(s).lower()) if stem(w) not in vocab})


def lesson_vocabulary(project) -> set[str]:
    """Every word of the lesson's script, storyboard and knowledge sheet (stemmed), plus function words."""
    from ..util import read_json
    V = {stem(w) for w in VOCAB_STOP}
    for rel in ("plan/script.json", "plan/storyboard.json", "plan/knowledge.json", "plan/brief.json"):
        for s in _strings(read_json(project.path(rel), {}) or {}):
            V |= vocab_words(s)
    return V


def vocab_leaks(texts: list[dict], storyboard: dict, vocab: set[str]) -> list[dict]:
    """Runtime texts (Loom.report.texts) of BESPOKE beats with words the lesson does not have: [{beat, text, words}]."""
    kinds = {s.get("beat"): s.get("kind") for s in storyboard.get("scenes", [])}
    out = []
    for t in texts or []:
        if kinds.get(t.get("beat")) != "bespoke":
            continue
        bad = missing_words(t.get("text", ""), vocab)
        if bad:
            out.append({"beat": t.get("beat"), "text": str(t.get("text", ""))[:120], "words": bad})
    return out


def js_strings(src: str) -> list[tuple[str, str]]:
    """String literals of JS source, comments skipped: [(text, the 24 characters before it)]. A real tokenizer: a
    regex pairing quotes reads the code BETWEEN two strings as a string (the first version reported 150 'leaks' like
    `, exit: ` in a finished lesson)."""
    out, i, n = [], 0, len(src)
    while i < n:
        c = src[i]
        if c == "/" and i + 1 < n and src[i + 1] == "/":
            j = src.find("\n", i)
            i = n if j < 0 else j
            continue
        if c == "/" and i + 1 < n and src[i + 1] == "*":
            j = src.find("*/", i + 2)
            i = n if j < 0 else j + 2
            continue
        if c in "\"'`":
            q, j, buf = c, i + 1, []
            while j < n and src[j] != q:
                if src[j] == "\\":
                    buf.append(src[j + 1:j + 2])
                    j += 2
                    continue
                if q == "`" and src[j] == "$" and j + 1 < n and src[j + 1] == "{":
                    d, j = 1, j + 2
                    while j < n and d:
                        d += 1 if src[j] == "{" else -1 if src[j] == "}" else 0
                        j += 1
                    buf.append(" ")
                    continue
                buf.append(src[j])
                j += 1
            out.append(("".join(buf), src[max(0, i - 24):i]))
            i = j + 1
            continue
        i += 1
    return out


def scene_literal_leaks(src: str, vocab: set[str]) -> list[dict]:
    """Phrases written into a scene file (string literals of two or more words) whose words the lesson does not
    have. Cue anchors, error messages and code-like strings are skipped."""
    out = []
    for t, pre in js_strings(src):
        if re.search(r"(?:cue|has|error|warn|log|Error)\(\s*$|throw\s+$", pre):
            continue
        if len(re.findall(r"[A-Za-z]{2,}", t)) < 2 or not re.search(r"\s", t.strip()):
            continue
        if re.search(r"[{}();=<>#_]|^\s*[\w\-]+\s*:|\s\.\w", t):
            continue
        bad = missing_words(t, vocab)
        if bad:
            out.append({"text": t[:120], "words": bad})
    return out


def vocab_check(project, texts: list[dict] | None = None) -> tuple[list[str], list[str]]:
    """The check stage's runtime audit of bespoke scenes (texts: the probe's report texts; default qa/probe.json).
    Returns (errors, warnings) after the film-check ratchet (gate `vocab`)."""
    from ..util import read_json
    from .gates import _ratchet
    if texts is None:
        texts = (read_json(project.path("qa/probe.json"), {}) or {}).get("texts") or []
    sb = read_json(project.path("plan/storyboard.json"), {}) or {}
    E = [f"lesson_vocabulary: {lk['beat']} (bespoke) draws words the lesson never uses {lk['words']}: \"{lk['text'][:80]}\". "
         "Every word on screen comes from the script, the storyboard or the knowledge sheet; an invented detail is an "
         "invented fact" for lk in vocab_leaks(texts, sb, lesson_vocabulary(project))]
    return _ratchet(project, "vocab", list(dict.fromkeys(E)))
