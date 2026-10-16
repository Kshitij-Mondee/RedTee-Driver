"""The decision ledger (D-97): every routing decision, tooling choice and outcome, logged as data.

Why: Kshitij's direction (2026-10-02). After many lessons, Loom will hold a library, reusable code and enough data
on *what was decided, by whom, from what, and how it turned out* to move bounded choices to decision models (Jev),
to tune or fine-tune our own models, and to improve the skills. That data only exists if it is written down at the
moment of the decision. This module writes it.

Where: `projects/<id>/logs/decisions.jsonl` (append-only, one JSON object per line) and
`projects/<id>/logs/versions/<stage>/` (every accepted or rejected version of a model stage's artifact, so the
before/after pairs of every correction are kept). `py -m loom ledger export` merges all lessons into
`datasets/decisions.jsonl` (generated: do not hand-edit).

The record (schema v1; fields are optional unless marked):
  v (required)         schema version, 1
  id (required)        sha1 of the record's content without `at`, so the same decision logged twice is detectable
  at (required)        local time, ISO seconds (logs may hold wall clock; frames never read the ledger: rule 3)
  lesson (required)    project id
  event (required)     decision | gate | approval | override | note | outcome | model_call | render
  node                 where in the lesson: "<stage>" or "<stage>:<beat>"
  decision             what was decided: treatment, kind, template, join, shot, world, seed, job, ...
  choice               the value chosen
  options              the values that were possible, when known
  by                   {kind: code|agent|human|model, who, tier, model, mode}; who decided
  features             the compact inputs the decision was made from (what a router would see)
  why                  the stated reason (rationale, rule name, score)
  confidence           0..1 when the decider gives one
  ref                  the id or node this record is about (outcomes point at decisions)
  data                 anything else (errors, counts, hashes)
  backfilled           true when reconstructed from files after the fact (weaker evidence)

Logging must never break the pipeline: every public function swallows its own errors and warns once.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import time
from collections import Counter
from pathlib import Path

from .util import ENGINE_ROOT, read_json, warn

SCHEMA = 1
LOG = Path("logs") / "decisions.jsonl"
VERSIONS = Path("logs") / "versions"
EXPORT = ENGINE_ROOT / "datasets" / "decisions.jsonl"
_warned = set()


def _rj(p) -> dict | None:
    """read_json that returns None for a missing file (util.read_json raises when the default is None)."""
    p = Path(p)
    return read_json(p) if p.exists() else None


def _pdir(p) -> Path:
    # a Project has .root = its folder; a Path ALSO has .root (the drive root, "/"), so test the type first
    if isinstance(p, (str, Path)):
        return Path(p)
    return Path(p.root)


def _quiet(tag, e):
    if tag not in _warned:
        _warned.add(tag)
        warn(f"ledger: {tag} not logged ({e})")


import contextvars

# The model that is running right now, set by the API agents runtime around each task (per thread: scene workers
# run in parallel). Without it, decision and gate records written during an API run named the project's tier
# default (Opus) although Sol or Sonnet wrote the artifact, which corrupts routing and fine-tuning data (L-268).
RUNNING: contextvars.ContextVar = contextvars.ContextVar("loom_running_model", default=None)


def actor(kind: str, tier: str | None = None, project=None, who: str | None = None) -> dict:
    """Who decided. Inside an API agents task the real model comes from RUNNING. In agent mode (Cowork) Loom
    cannot see which model a sub-agent really ran, so it records the recommended model and lets the orchestrator
    say more with the env LOOM_ACTOR (e.g. 'opus sub-agent')."""
    by = {"kind": kind}
    run = RUNNING.get()
    if tier:
        by["tier"] = tier
        if run and kind in ("agent", "model"):
            by["model"] = run.get("model")
            if run.get("provider"):
                by["provider"] = run["provider"]
            if run.get("role"):
                by["role"] = run["role"]
            by["mode"] = "agents"
        else:
            models = (getattr(project, "cfg", None) or {}).get("models", {}) if project is not None else {}
            if models.get(tier):
                by["model"] = models[tier]
            by["mode"] = os.environ.get("LOOM_MODE", "agent")
    w = who or (os.environ.get("LOOM_ACTOR") if kind in ("agent", "model") else None)
    if w:
        by["who"] = w
    return by


def log(p, event: str, **f) -> dict | None:
    try:
        pdir = _pdir(p)
        rec = {"v": SCHEMA, "lesson": pdir.name, "event": event}
        rec.update({k: v for k, v in f.items() if v is not None})
        body = json.dumps(rec, sort_keys=True, ensure_ascii=False, default=str)
        rec["id"] = hashlib.sha1(body.encode("utf-8")).hexdigest()[:16]
        rec["at"] = time.strftime("%Y-%m-%dT%H:%M:%S")
        out = pdir / LOG
        out.parent.mkdir(parents=True, exist_ok=True)
        with open(out, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(rec, ensure_ascii=False, default=str) + "\n")
        return rec
    except Exception as e:  # never break a run for a log line
        _quiet(event, e)
        return None


def read(p) -> list[dict]:
    f = _pdir(p) / LOG
    if not f.exists():
        return []
    out = []
    for line in f.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if line:
            try:
                out.append(json.loads(line))
            except json.JSONDecodeError:
                continue
    return out


def snapshot(p, stage: str, rel: str, status: str) -> str | None:
    """Keep this version of a model stage's artifact (accepted or rejected). Skips an identical repeat."""
    try:
        pdir = _pdir(p)
        src = pdir / rel
        if not src.exists():
            return None
        if src.is_dir():   # a folder of files (scenes): one bundle {name: text}
            files = {f.name: f.read_text(encoding="utf-8", errors="replace") for f in sorted(src.iterdir()) if f.is_file()}
            if not files:
                return None
            blob, suffix = json.dumps(files, sort_keys=True, ensure_ascii=False).encode("utf-8"), ".bundle.json"
        else:
            blob, suffix = src.read_bytes(), src.suffix
        h = hashlib.sha1(blob).hexdigest()[:10]
        d = pdir / VERSIONS / stage
        d.mkdir(parents=True, exist_ok=True)
        if any(x.name.endswith(f"_{h}{suffix}") for x in d.iterdir()):
            return h
        (d / f"{time.strftime('%Y%m%dT%H%M%S')}_{status}_{h}{suffix}").write_bytes(blob)
        return h
    except Exception as e:
        _quiet("snapshot", e)
        return None


# ------------------------------------------------------------------ features (what a router would see)
def beat_features(p) -> dict:
    pdir = _pdir(p)
    sc = read_json(pdir / "plan" / "script.json", {}) or {}
    al = (read_json(pdir / "plan" / "allocation.json", {}) or {}).get("beats") or {}
    tm = {b.get("id"): b for b in ((read_json(pdir / "audio" / "timings.json", {}) or {}).get("beats") or [])}
    F = {}
    for b in sc.get("beats") or []:
        bid = b.get("id")
        nar = b.get("narration") or []
        words = sum(len(str(x).split()) for x in nar)
        t = tm.get(bid) or {}
        F[bid] = {k: v for k, v in {
            "section": b.get("section"), "job": b.get("job"), "delivery": b.get("delivery"),
            "treatment_hint": b.get("treatment_hint"), "animate_score": b.get("animate_score"),
            "change_over_time": b.get("change_over_time"), "recall": (b.get("recall") or {}).get("kind"),
            "words": words, "phrases": len(nar), "on_screen": len(b.get("on_screen") or []),
            "facts": len(b.get("grounding") or []),
            "allocated": (al.get(bid) or {}).get("treatment"), "alloc_score": (al.get(bid) or {}).get("score"),
            "speech_s": round(t["speech_end"] - t["speech_start"], 2) if t.get("speech_end") is not None and t.get("speech_start") is not None else None,
        }.items() if v is not None}
    return F


def _lesson_features(p) -> dict:
    pdir = _pdir(p)
    req = (read_json(pdir / "project.json", {}) or {}).get("request") or {}
    mix = req.get("mix")
    return {k: v for k, v in {"style": req.get("style"), "genre": req.get("genre"), "persona": req.get("persona"),
                              "mix": mix if isinstance(mix, str) else ("custom" if mix else None),
                              "audience": (req.get("audience") or "")[:160] or None}.items() if v}


# ------------------------------------------------------------------ extractors (decisions inside artifacts)
STORY_FIELDS = ("kind", "template", "blueprint", "station", "register", "motion_is", "subject", "world", "story_role")


def storyboard_decisions(p, by: dict, backfilled: bool = False) -> int:
    pdir = _pdir(p)
    sb = read_json(pdir / "plan" / "storyboard.json", {}) or {}
    F = beat_features(pdir)
    lf = _lesson_features(pdir)
    n = 0
    for s in sb.get("scenes") or []:
        bid = s.get("beat")
        choice = {k: s.get(k) for k in STORY_FIELDS if s.get(k) is not None}
        j = s.get("join_in") or {}
        if j:
            choice["join"] = j.get("type")
            if j.get("meaning"):
                choice["join_meaning"] = j["meaning"]
        sh = s.get("shot") or {}
        if sh:
            choice["shot"] = {k: sh.get(k) for k in ("size", "move") if sh.get(k)}
        if s.get("keep"):
            choice["keep"] = s["keep"]
        if s.get("alternatives"):
            choice["alternatives"] = sorted(s["alternatives"])
        refs = (s.get("design") or {}).get("references")
        log(pdir, "decision", node=f"storyboard:{bid}", decision="shot_plan", choice=choice, by=by,
            features=dict(F.get(bid) or {}, **lf), why=(s.get("rationale") or "")[:600] or None,
            data={"props": sorted((s.get("props") or {}).keys()), "references": refs} if (s.get("props") or refs) else None,
            backfilled=backfilled or None)
        n += 1
    return n


def script_decisions(p, by: dict, backfilled: bool = False) -> int:
    pdir = _pdir(p)
    sc = read_json(pdir / "plan" / "script.json", {}) or {}
    n = 0
    for b in sc.get("beats") or []:
        log(pdir, "decision", node=f"script:{b.get('id')}", decision="beat_design",
            choice={k: b.get(k) for k in ("section", "job", "delivery", "treatment_hint", "animate_score", "change_over_time") if b.get(k) is not None},
            by=by, features={"words": sum(len(str(x).split()) for x in b.get("narration") or []), "facts": len(b.get("grounding") or [])},
            why=(b.get("visual_intent") or "")[:400] or None, backfilled=backfilled or None)
        n += 1
    return n


def allocation_decisions(p, res: dict | None = None, backfilled: bool = False) -> int:
    pdir = _pdir(p)
    res = res or read_json(pdir / "plan" / "allocation.json", {}) or {}
    F = beat_features(pdir)
    n = 0
    for bid, a in (res.get("beats") or {}).items():
        log(pdir, "decision", node=f"allocate:{bid}", decision="treatment", choice=a.get("treatment"),
            options=["avatar", "template", "motion", "hybrid"], by={"kind": "code", "who": "loom/allocate.py"},
            features=F.get(bid), why=a.get("reason"), data={"score": a.get("score"), "targets": res.get("targets")},
            backfilled=backfilled or None)
        n += 1
    return n


_CALL = re.compile(r"\b(Loom\.[a-zA-Z]+(?:\.[a-zA-Z]+)?|ctx\.[a-zA-Z]+|kit\.[a-zA-Z]+|m\.[a-zA-Z]+)\s*\(")
_TAG = re.compile(r"@(form|design)\s+([a-z0-9_]+)")


def scene_tooling(p, by: dict, backfilled: bool = False) -> int:
    """Tooling choices per bespoke scene: which builders and motion verbs it used, how long it is, its tags."""
    pdir = _pdir(p)
    n = 0
    for f in sorted((pdir / "scenes").glob("*.js")):
        src = f.read_text(encoding="utf-8", errors="replace")
        calls = Counter(_CALL.findall(src))
        code = [l for l in src.splitlines() if l.strip() and not l.strip().startswith("//")]
        log(pdir, "decision", node=f"scenes:{f.stem}", decision="tooling", choice=sorted(calls),
            by=by, data={"calls": dict(calls.most_common()), "lines": len(code),
                         "tags": sorted({f"{a}:{b}" for a, b in _TAG.findall(src)}),
                         "sha1": hashlib.sha1(src.encode("utf-8")).hexdigest()[:10]},
            backfilled=backfilled or None)
        n += 1
    return n


_BEAT = re.compile(r"\b(b\d{2,3})\b")
_AT = re.compile(r"@ ?([0-9]+(?:\.[0-9]+)?)")


def _beat_of(msg: str, beats: list[dict]) -> str | None:
    m = _BEAT.search(msg)
    if m:
        return m.group(1)
    t = _AT.search(msg)
    if t and beats:
        x = float(t.group(1))
        b = next((b for b in beats if b.get("start", 0) <= x < b.get("end", 0)), None)
        return b.get("id") if b else None
    return None


# film check messages (loom/checks/film.py) -> their own categories, so the ledger can count each defect class
# (2026-10-07: "words cut by the frame edge" and the new off-frame, foreign-pixel and blur errors all fell in "other")
_FILM_KINDS = (("words cut by the frame edge", "words_cut"), (": off frame at", "off_frame"), ("a held element is off frame", "held_off_frame"),
               ("foreign pixels", "foreign_pixels"), ("blurred_beat", "blurred_beat"), ("empty frame", "empty_frame"),
               ("element records", "element_records"), ("on-screen type measured 0", "screen_text_blind"),
               ("text too small", "text_too_small"), (": blank beat at", "blank_beat"), ("blank-beat measure: 0", "blank_beat_blind"),
               ("caption_hold:", "caption_hold"), ("caption hold: 0 caption cues", "caption_hold_blind"))


def _kind_of(msg: str) -> str:
    # "lc ..." is Loom's own layout and contrast audit (qa.lc_lines); "(shadow) lc ..." the same while HyperFrames gates
    m = re.match(r"(?:\(shadow\) )?(runtime \w+|hf \w+ \w+|lc \w+ \w+|browser \w+|variety|compose)", msg)
    if m:
        return m.group(1)
    for k in ("reading floor", "static hold", "nothing developing", "chunks on screen", "double exposure"):
        if k in msg:
            return k
    for needle, kind in _FILM_KINDS:
        if needle in msg:
            return kind
    return "other"


def check_outcomes(p, rep: dict, backfilled: bool = False) -> int:
    """The check is the label for the decisions above: per beat, how many errors and warnings of which kind."""
    pdir = _pdir(p)
    beats = (read_json(pdir / "build" / "manifest.json", {}) or {}).get("beats") or []
    per = {}
    for sev in ("errors", "warnings"):
        for msg in rep.get(sev) or []:
            b = _beat_of(str(msg), beats) or "lesson"
            per.setdefault(b, {"errors": Counter(), "warnings": Counter()})[sev][_kind_of(str(msg))] += 1
    log(pdir, "outcome", node="check", decision="check", choice="pass" if not rep.get("errors") else "fail",
        by={"kind": "code", "who": "loom/qa.py"},
        data={"errors": len(rep.get("errors") or []), "warnings": len(rep.get("warnings") or []),
              "hf": bool(rep.get("hf_ran", True)), "per_beat": {k: {s: dict(v[s]) for s in v} for k, v in per.items()}},
        backfilled=backfilled or None)
    for b, v in per.items():
        if b == "lesson":
            continue
        log(pdir, "outcome", node=f"check:{b}", decision="check", ref=f"storyboard:{b}",
            choice="fail" if v["errors"] else "warn", by={"kind": "code", "who": "loom/qa.py"},
            data={"errors": dict(v["errors"]), "warnings": dict(v["warnings"])}, backfilled=backfilled or None)
    return len(per)


def review_outcomes(p, by: dict | None = None, backfilled: bool = False) -> int:
    pdir = _pdir(p)
    rv = _rj(pdir / "qa" / "review.json")
    if not rv:
        return 0
    n = 0
    for f in rv.get("findings") or []:
        for b in _BEAT.findall(str(f.get("beat") or "")) or ["lesson"]:
            log(pdir, "outcome", node=f"review:{b}", decision="review_finding", ref=f"storyboard:{b}",
                choice=f.get("severity"), by=by or {"kind": "agent", "who": rv.get("reviewer")},
                why=f.get("problem"), data={"fix": f.get("fix"), "status": f.get("status"), "file": f.get("file")},
                backfilled=backfilled or None)
            n += 1
    log(pdir, "outcome", node="review", decision="review_verdict", choice=rv.get("verdict"),
        by=by or {"kind": "agent", "who": rv.get("reviewer")}, backfilled=backfilled or None)
    return n + 1


def seed_decision(p, D: dict | None, by: dict, backfilled: bool = False):
    if not D:
        return None
    seed = D.get("seed") if isinstance(D.get("seed"), dict) else None
    return log(_pdir(p), "decision", node="seed", decision="design_seed", choice=seed, by=by,
               why=D.get("chosen_by"), data={"overrides": D.get("overrides"), "material": D.get("material"),
                                            "cleared": D.get("cleared")}, backfilled=backfilled or None)


# ------------------------------------------------------------------ backfill and export
def backfill(p) -> dict:
    """Reconstruct the decisions a lesson already holds in its files (marked backfilled: weaker evidence, because
    who decided and what was rejected along the way are lost). Run once per old lesson."""
    pdir = _pdir(p)
    if any(r.get("event") == "note" and r.get("decision") == "backfill_done" for r in read(pdir)):
        return {"skipped": "already backfilled"}
    planner = {"kind": "agent", "tier": "plan", "who": "unknown (backfilled)"}
    builder = {"kind": "agent", "tier": "build", "who": "unknown (backfilled)"}
    out = {"script": script_decisions(pdir, planner, True), "allocation": allocation_decisions(pdir, None, True),
           "storyboard": storyboard_decisions(pdir, planner, True), "tooling": scene_tooling(pdir, builder, True)}
    sd = _rj(pdir / "plan" / "design_seed.json")
    out["seed"] = 1 if seed_decision(pdir, sd, {"kind": "code", "who": "loom/seed.py"}, True) else 0
    rep = _rj(pdir / "qa" / "report.json")
    out["check"] = check_outcomes(pdir, rep, True) if rep else 0
    out["review"] = review_outcomes(pdir, None, True)
    try:   # keep today's version of every model stage's artifact as the first entry of its history
        from .stages import STAGES
        out["versions"] = sum(1 for st in STAGES if st.kind == "agent" and snapshot(pdir, st.name, st.out, "backfill"))
    except Exception as e:
        _quiet("backfill versions", e)
    log(pdir, "note", node="ledger", decision="backfill_done", choice=out, by={"kind": "code", "who": "loom/ledger.py"})
    return out


def export(out: Path = EXPORT) -> dict:
    """Merge every lesson's ledger into one dataset (generated)."""
    rows, per = [], Counter()
    for d in sorted((ENGINE_ROOT / "projects").iterdir()):
        if (d / LOG).exists():
            r = unique(read(d))
            rows += r
            per[d.name] = len(r)
    out.parent.mkdir(parents=True, exist_ok=True)
    with open(out, "w", encoding="utf-8") as fh:
        for r in rows:
            fh.write(json.dumps(r, ensure_ascii=False, default=str) + "\n")
    return {"records": len(rows), "lessons": dict(per), "out": str(out),
            "by_event": dict(Counter(r.get("event") for r in rows)),
            "by_decision": dict(Counter(r.get("decision") for r in rows if r.get("decision")))}


def unique(rows: list[dict]) -> list[dict]:
    """Records with the same id are the same decision logged twice (e.g. a backfill that was interrupted and re-run):
    keep the first. The file itself is append-only and is never rewritten."""
    seen, out = set(), []
    for r in rows:
        if r.get("id") in seen:
            continue
        seen.add(r.get("id")); out.append(r)
    return out


def stats(p) -> dict:
    r = unique(read(p))
    return {"records": len(r), "by_event": dict(Counter(x.get("event") for x in r)),
            "by_decision": dict(Counter(x.get("decision") for x in r if x.get("decision"))),
            "backfilled": sum(1 for x in r if x.get("backfilled")),
            "versions": sorted(str(x.relative_to(_pdir(p))) for x in (_pdir(p) / VERSIONS).rglob("*") if x.is_file())
            if (_pdir(p) / VERSIONS).exists() else []}
