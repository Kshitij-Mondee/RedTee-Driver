"""A lesson cut down to a run of its beats, ready for its scenes to be written again (D-166; Kshitij, 2026-10-12: "take its
storyboarding and run the scene writers ... on different models"). Nothing is regenerated: the plan, the narration and the
kit are the source lesson's, so only what is written after them can differ.

    py -m loom slice <source> <new id> --beats b08-b18 [--by "agent, unattended per <who>"]

- plan/: brief, knowledge, teaching plan, persona as they are; the script, the allocation, the storyboard and the outline
  keep only the slice's beats (kit parts, devices and the value script follow; the first beat joins by a cut);
- audio/: the narration cut from the first beat's start to the last beat's end, every time in timings.json shifted so the
  slice starts at 0 (the mix is made again by the run);
- scenes/_kit.js and logs/kit_api.md as they are; no beat file: the scenes are what the slice is for;
- project.json: a new id, isolated (it reads and feeds nothing else), its length the slice's, `sliced_from` naming the source;
- the plan stages accepted through their own gates, the allocation and the narration marked done (they are supplied), the
  facts and plan approvals recorded as unattended in the named person's name, the kit's preview recorded: Shuttle starts at P8.
The source lesson is only read.
"""
from __future__ import annotations

import copy
import json
import shutil
import subprocess
from pathlib import Path

from .util import LoomError, info, read_json, which, write_json

PLAN_AS_IS = ("brief.json", "knowledge.json", "persona.json", "design_seed.json")
# gate errors that are properties of the WHOLE lesson, not of a slice: a slice keeps them, as logged overrides (the
# recall moment lives elsewhere in the lesson; a kept name the source's own scene file drew, which the slice's new author
# is told to build by the contract with the next beat, L-409)
SLICE_WAIVE = ("no recall moment", "cannot provide them: its design.elements, beat_sheet or scene file name no such element")


def beat_range(spec: str, ids: list[str]) -> list[str]:
    """b08-b18 (consecutive, in the lesson's order) or b08,b09,b10."""
    if "-" in spec and "," not in spec:
        a, b = spec.split("-", 1)
        if a not in ids or b not in ids or ids.index(a) > ids.index(b):
            raise LoomError(f"--beats {spec}: both ends must be beats of the lesson, in order")
        return ids[ids.index(a):ids.index(b) + 1]
    want = [x.strip() for x in spec.split(",") if x.strip()]
    bad = [x for x in want if x not in ids]
    if bad:
        raise LoomError(f"--beats: not beats of the lesson: {bad}")
    return [x for x in ids if x in want]


def _shift(obj, t0: float):
    """Every time field of a timings beat moved by -t0 (start, end, speech_*, phrases s/e, words s/e)."""
    if isinstance(obj, list):
        return [_shift(x, t0) for x in obj]
    if isinstance(obj, dict):
        out = {}
        for k, v in obj.items():
            if k in ("start", "end", "speech_start", "speech_end", "s", "e") and isinstance(v, (int, float)):
                out[k] = round(v - t0, 3)
            else:
                out[k] = _shift(v, t0)
        return out
    return obj


def _keep_beats(items: list, keep: set) -> list:
    """Items that name beats (`beats`: [...]) keep only the slice's; an item left with none is dropped."""
    out = []
    for it in items or []:
        if isinstance(it, dict) and isinstance(it.get("beats"), list):
            bs = [b for b in it["beats"] if b in keep]
            if not bs:
                continue
            it = dict(it, beats=bs)
        out.append(it)
    return out


def _value_script(vs: list, beats: list) -> list:
    """The value bands from the slice's first beat on: the band in force at the first beat is restated from it."""
    order = {b: i for i, b in enumerate(beats)}
    keep = [v for v in vs or [] if v.get("from") in order]
    before = [v for v in vs or [] if v.get("from") not in order]
    if not keep or keep[0].get("from") != beats[0]:
        if before:
            keep.insert(0, dict(before[-1], **{"from": beats[0]}))
    return keep


def make(source: str, new_id: str, spec: str, by: str) -> "object":
    from .project import Project, projects_root
    if "unattended" not in (by or "").lower():
        raise LoomError('--by must say it is unattended, e.g. "agent, unattended per Kshitij (scene-writer comparison)"')
    src = Project.open(source)
    dst = projects_root() / new_id
    if dst.exists():
        raise LoomError(f"{dst} exists: choose a new id")
    script = read_json(src.path("plan/script.json"))
    ids = [b["id"] for b in script["beats"]]
    beats = beat_range(spec, ids)
    keep = set(beats)
    tm = read_json(src.path("audio/timings.json"))
    by_id = {b["id"]: b for b in tm["beats"]}
    t0, t1 = float(by_id[beats[0]]["start"]), float(by_id[beats[-1]]["end"])
    # every beat: a CLONE, an exact copy of the plan, the narration and the kit (the five-style test, D-167): nothing is
    # cut, shifted or re-encoded, so every clone of a lesson starts from byte-identical inputs (a whole-lesson slice had
    # rewritten the teaching plan's pacing to the measured length and re-encoded the narration, 2026-10-14)
    full = beats == ids
    # the project, isolated, with the slice's length (a clone keeps the request as it is)
    cfg = copy.deepcopy(src.cfg)
    cfg.update(id=new_id, isolated=True, sliced_from={"lesson": src.id, "beats": beats, "t0": t0, "t1": t1, "clone": full})
    cfg.pop("created", None)
    if not full:
        cfg.setdefault("request", {})["length_min"] = round((t1 - t0) / 60.0, 2)
    for d in ("plan", "audio", "scenes", "build", "qa", "renders", "tasks", "sources", "media", "logs"):
        (dst / d).mkdir(parents=True, exist_ok=True)
    write_json(dst / "project.json", cfg)
    write_json(dst / "state.json", {"stages": {}})
    if full:
        return _clone(src, dst, by, beats)
    for f in PLAN_AS_IS:
        if src.path(f"plan/{f}").exists():
            shutil.copy2(src.path(f"plan/{f}"), dst / "plan" / f)
    write_json(dst / "plan/script.json", dict(script, beats=[b for b in script["beats"] if b["id"] in keep]))
    tp = read_json(src.path("plan/teaching_plan.json"), {}) or {}
    if isinstance(tp.get("pacing"), dict):            # the plan's length is the slice's
        for k in ("target_duration_s", "requested_s"):
            if k in tp["pacing"]:
                tp["pacing"][k] = round(t1 - t0)
    write_json(dst / "plan/teaching_plan.json", tp)
    if src.path("plan/allocation.json").exists():
        al = read_json(src.path("plan/allocation.json"))
        bl = al.get("beats")
        al["beats"] = {k: v for k, v in bl.items() if k in keep} if isinstance(bl, dict) else [b for b in bl or [] if (b.get("beat") or b.get("id")) in keep]
        write_json(dst / "plan/allocation.json", al)
    sb = read_json(src.path("plan/storyboard.json"))
    scenes = [copy.deepcopy(s) for s in sb.get("scenes") or [] if s.get("beat") in keep]
    if scenes:
        scenes[0]["join_in"] = {"type": "cut"}           # nothing before it in the slice to continue from or pan from
        scenes[0]["keep"] = []
    sb["scenes"] = scenes
    if sb.get("kit"):
        sb["kit"]["parts"] = _keep_beats(sb["kit"].get("parts"), keep)
        if not sb["kit"]["parts"]:
            sb.pop("kit")
    sb["devices"] = _keep_beats(sb.get("devices"), keep)
    sb["value_script"] = _value_script(sb.get("value_script"), beats)
    write_json(dst / "plan/storyboard.json", sb)
    if src.path("plan/outline.json").exists():
        ol = read_json(src.path("plan/outline.json"))
        ol["devices"] = _keep_beats(ol.get("devices"), keep)
        ol["value_script"] = _value_script(ol.get("value_script"), beats)
        bid = lambda b: b if isinstance(b, str) else (b.get("beat") or b.get("id")) if isinstance(b, dict) else None
        secs = []
        for sec in ol.get("sections") or []:
            if isinstance(sec.get("beats"), list):
                bs = [b for b in sec["beats"] if bid(b) in keep]
                if not bs:
                    continue
                sec = dict(sec, beats=bs)
            secs.append(sec)
        ol["sections"] = secs
        write_json(dst / "plan/outline.json", ol)
    # the narration: cut and shifted
    write_json(dst / "audio/timings.json", dict(tm, duration=round(t1 - t0, 3), beats=_shift([by_id[b] for b in beats], t0)))
    ff = which("ffmpeg")
    if not ff:
        raise LoomError("ffmpeg is needed to cut the narration")
    r = subprocess.run([ff, "-v", "error", "-y", "-ss", f"{t0:.3f}", "-t", f"{t1 - t0:.3f}", "-i", str(src.path("audio/narration.wav")),
                        str(dst / "audio/narration.wav")], capture_output=True, text=True)
    if r.returncode != 0:
        raise LoomError(f"the narration could not be cut: {r.stderr[-300:]}")
    # the kit, as it is
    if src.path("scenes/_kit.js").exists() and sb.get("kit"):
        shutil.copy2(src.path("scenes/_kit.js"), dst / "scenes/_kit.js")
        if src.path("logs/kit_api.md").exists():
            shutil.copy2(src.path("logs/kit_api.md"), dst / "logs/kit_api.md")
    p = Project(dst.resolve())
    accept_plan(p, by)
    info(f"sliced {src.id} {beats[0]} to {beats[-1]} ({len(beats)} beats, {t1 - t0:.1f} s) into {new_id}: Shuttle starts at P8")
    return p


def _clone(src, dst, by: str, beats: list):
    """The whole lesson, copied as it is: plan/*, the narration and its timings, the kit and its API note."""
    from .project import Project
    for f in sorted(src.path("plan").glob("*.json")):
        shutil.copy2(f, dst / "plan" / f.name)
    for rel in ("audio/timings.json", "audio/narration.wav", "scenes/_kit.js", "logs/kit_api.md"):
        if src.path(rel).exists():
            shutil.copy2(src.path(rel), dst / rel)
    p = Project(dst.resolve())
    accept_plan(p, by)
    info(f"cloned {src.id} (all {len(beats)} beats) into {p.id}, plan, narration and kit unchanged: Shuttle starts at P8")
    return p


def accept_plan(p, by: str):
    """The plan stages through their own gates; the supplied code outputs marked done; approvals and the kit preview."""
    from . import flow
    from .stages import active
    errs = {}
    for st in active(p):
        if st.name in ("scenes", "compose", "check", "review", "render"):
            break
        if st.kind == "agent":
            E, _ = flow.accept(p, st.name)
            if E and all(any(w in e for w in SLICE_WAIVE) for e in E):
                flow.mark_done(p, st.name, reason="slice (D-166): whole-lesson properties kept as they are: " + "; ".join(e[:120] for e in E))
                E = []
            if E:
                errs[st.name] = E[:3]
            if st.name == "knowledge":
                k = read_json(p.path("plan/knowledge.json"))
                if (k.get("review") or {}).get("status") != "approved":     # an approved sheet is kept exactly as it is
                    k["review"] = dict(k.get("review") or {}, status="approved", by=by)
                    write_json(p.path("plan/knowledge.json"), k)
                # the facts approval writes the sheet's review (its approver): before any stage that depends on the sheet is
                # accepted, or the teaching plan and the script read as stale (a whole-lesson clone, 2026-10-14)
                flow.approve(p, "facts", by, notes="slice of an approved lesson (D-166)")
                flow.accept(p, "knowledge")
        else:
            flow.mark_done(p, st.name, passed=True, reason="supplied by the slice (the source lesson's own output)")
    if errs:
        raise LoomError(f"the slice's plan does not pass its gates: {json.dumps(errs)[:900]}")
    flow.approve(p, "plan", by, notes="slice of an approved lesson (D-166)")
    from .shuttle import rails as RL
    rl = RL.Rails(p)
    rl.update(lambda st: st.__setitem__("animatic", {"plan": flow.plan_hashes(p)}))
    # the source lesson's fact sheet passed its skeptic and its storyboard its outline; the slice carries both, marked so
    src = (p.cfg.get("sliced_from") or {}).get("lesson")
    rl.update(lambda st: st.setdefault("skeptic", []).append({"hash": rl.knowledge_hash(), "verdict": "pass", "status": "accepted",
                                                              "model": f"carried from {src} (slice, D-166)", "at": RL.now()}))
    if p.path("plan/outline.json").exists():
        rl.update(lambda st: st.__setitem__("outline", {"hash": rl.file_hash("plan/outline.json"), "script": rl.file_hash("plan/script.json"),
                                                         "by": f"carried from {src} (slice, D-166)"}))
    if p.path("scenes/_kit.js").exists():
        rl.update(lambda st: st.__setitem__("kit_preview", {"hash": rl.file_hash("scenes/_kit.js")}))
    p.set_stage("scenes", status="pending")


def cli(args) -> int:
    make(args.source, args.new_id, args.beats, args.by or "agent, unattended per Kshitij (slice for a scene-writer comparison, D-166)")
    return 0
