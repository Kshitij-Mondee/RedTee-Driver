"""Stage orchestration: status, staleness, accept, run, go."""
from __future__ import annotations

import json

from .checks.gates import GATES
from .stages import BY_NAME, active, needs
from .util import LoomError, info, read_json, warn, write_json


def _hash_for(project, name):
    st = BY_NAME[name]
    if name == "compose" and project.path("build/index.html").exists():
        # the whole build a frame depends on, not index.html alone: scene code lives in build/scenes/*.js, so a fix to
        # one scene left index.html unchanged, the check looked done, and the picture critic judged sheets from before
        # the fix (feedback-relay-v2, 2026-10-09, L-339)
        from .qa import build_hash
        return build_hash(project.path("build"))
    return project.artifact_hash(st.out)


def status(project) -> list[dict]:
    rows = []
    for st in active(project):
        rec = project.stage_info(st.name)
        exists = project.path(st.out).exists()
        state = rec.get("status", "pending")
        if state == "done":
            for n in needs(project, st):
                if rec.get("inputs", {}).get(n) != _hash_for(project, n):
                    state = "stale"; break
            if state == "done" and rec.get("output") != _hash_for(project, st.name) and st.kind == "agent":
                state = "edited"  # artifact changed after acceptance: re-accept
        rows.append({"stage": st.name, "kind": st.kind, "tier": st.tier, "status": state, "exists": exists, "out": st.out})
    return rows


def ready(project, name) -> bool:
    rows = {r["stage"]: r for r in status(project)}
    st = BY_NAME[name]
    return all(rows[n]["status"] == "done" for n in needs(project, st))


def mark_done(project, name, warnings=None, reason=None, passed=False):
    """Mark a stage done. The engine's own calls say `passed=True` (its gate or its code just ran clean, or there is
    nothing to do). Any other call on a stage that was REJECTED overrides a refusal: it is logged in the decision ledger
    with its reason (the bench's pedagogy stages were waived by hand this way and left no trace, 2026-10-07)."""
    st = BY_NAME[name]
    before = dict(project.stage_info(name) or {})
    prev, errs = before.get("status"), list(before.get("errors") or [])
    project.set_stage(name, status="done", output=_hash_for(project, name),
                      inputs={n: _hash_for(project, n) for n in needs(project, st)}, warnings=warnings or [])
    if not passed and prev == "rejected":
        from . import ledger as L
        L.log(project, "override", node=name, decision="mark_done", choice=True, by={"kind": "human"},
              why=reason or "no reason given", data={"was": prev, "errors": len(errs)})
        warn(f"{name}: marked done over a rejection ({reason or 'no reason given'}); logged as an override")


def accept(project, name) -> tuple[list[str], list[str]]:
    st = BY_NAME[name]
    if st.kind != "agent":
        raise LoomError(f"'{name}' is a code stage: use `py -m loom run {project.id} {name}`")
    if not project.path(st.out).exists():
        return [f"output missing: {st.out}"], []
    if name == "scenes":
        return accept_scenes(project)
    if st.name == "knowledge" or st.name in GATES:
        E, W = GATES[name](project)
    else:
        E, W = [], []
    if not E:
        mark_done(project, name, W, passed=True)
        if name == "knowledge" and read_json(project.path(st.out))["review"]["status"] != "approved":
            project.set_stage(name, status="needs_approval")
    else:
        project.set_stage(name, status="rejected", errors=E[:50])
    _ledger_accept(project, name, st, E, W)
    return E, W


def _ledger_accept(project, name, st, E, W):
    """D-97: every accept is logged (pass or fail, with its errors), the artifact version is kept, and a passing
    script, storyboard or scenes accept also logs the decisions inside it, one record per beat."""
    from . import ledger as L
    by = L.actor("agent", st.tier, project)
    h = L.snapshot(project, name, st.out, "accepted" if not E else "rejected")
    L.log(project, "gate", node=name, decision="accept", choice="pass" if not E else "fail", by=by,
          data={"errors": E[:30], "warnings": len(W), "version": h})
    if E:
        return
    try:
        if name == "script":
            L.script_decisions(project, by)
        elif name == "storyboard":
            L.storyboard_decisions(project, by)
        elif name == "scenes":
            L.scene_tooling(project, by)
        elif name == "review":
            L.review_outcomes(project, by)
    except Exception as e:  # logging never blocks an accept
        warn(f"ledger: {name} decisions not logged ({e})")


PLAN_APPROVAL = "qa/approvals/plan.json"


def plan_hashes(project) -> dict:
    """What a plan approval covers: the script and the storyboard as they are now. Any change after the approval
    (a fix, a re-cut) makes the approval stale, so the person sees the plan that will actually be built."""
    return {n: project.artifact_hash(BY_NAME[n].out) for n in ("script", "storyboard")}


def plan_approved(project) -> dict | None:
    """The plan approval record if it still matches the current script and storyboard, else None."""
    rec = read_json(project.path(PLAN_APPROVAL), {}) or {}
    if rec.get("hashes") and rec["hashes"] == plan_hashes(project):
        return rec
    return None


def plan_review_note(project) -> str:
    """Write qa/approvals/plan.md: what to look at before approving the plan (the expensive part comes after it)."""
    sb = read_json(project.path("plan/storyboard.json"), {}) or {}
    tm = read_json(project.path("audio/timings.json"), {}) or {}
    kinds = {}
    for s in sb.get("scenes") or []:
        kinds[s.get("kind")] = kinds.get(s.get("kind"), 0) + 1
    sheets = sorted(str(p.relative_to(project.root)).replace("\\", "/") for p in project.path("qa").glob("animatic*.jpg")) \
        if project.path("qa").exists() else []
    dur = tm.get("duration") or (tm.get("beats") or [{}])[-1].get("end")
    lines = ["# Plan review: approve before the kit and scenes are built",
             "",
             f"- Lesson: {project.id}; requested about {project.request.get('length_min', '?')} min; narrated "
             f"{round(dur) if isinstance(dur, (int, float)) else '?'} s; {len(sb.get('scenes') or [])} beats: "
             + ", ".join(f"{k} {v}" for k, v in sorted(kinds.items(), key=lambda kv: str(kv[0]))),
             f"- Script: plan/script.json. Storyboard: plan/storyboard.json. Kit: {'declared' if sb.get('kit') else 'none'}.",
             "- Look at: " + (", ".join(sheets) if sheets else "the animatic (py -m loom animatic " + project.id + ")"),
             "",
             f"Approve: py -m loom approve {project.id} plan --by \"<name>\"   then run the same agents command again.",
             "To change something: edit or tweak, then approve; any later change to the script or storyboard needs a new approval."]
    out = project.path("qa/approvals/plan.md")
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text("\n".join(lines) + "\n", encoding="utf-8")
    return str(out)


def render_print(project) -> str | None:
    """What a final approval covers: the MP4s in renders/ (name, size, modification time), so a new render needs a new look."""
    import hashlib
    d = project.path("renders")
    files = sorted(d.glob("*.mp4")) if d.exists() else []
    if not files:
        return None
    return hashlib.sha1(json.dumps([[f.name, f.stat().st_size, f.stat().st_mtime_ns] for f in files]).encode()).hexdigest()[:16]


def _approval_record(project, kind: str, by: str, notes: str | None, **more) -> dict:
    """qa/approvals/<kind>.json: who approved, when (to the microsecond: Shuttle compares it with its reopen times), the
    person's notes (handed to the lead on resume) and what the approval covers."""
    import datetime as _dt
    rec = {"kind": kind, "by": by, "at": _dt.datetime.now().isoformat(timespec="microseconds"), "notes": notes or "",
           "unattended": "unattended" in by.lower(), **more}
    write_json(project.path(f"qa/approvals/{kind}.json"), rec)
    return rec


def keep_built(project) -> None:
    """Reuse or build (D-163): an approved film's built kit parts and beats go to its style's library (loom/kept.py). A
    failure here never undoes the approval: it is said and logged."""
    try:
        from .kept import keep
        keep(project)
    except Exception as e:  # noqa: BLE001
        info(f"kept: nothing kept ({str(e)[:200]})")
        from . import ledger as L
        L.log(project, "kept", node="library", decision="keep", choice="failed", by={"kind": "engine", "who": "loom.kept"},
              data={"error": str(e)[:400]})


def approve(project, name, by: str, notes: str | None = None):
    """A person's approval. Kinds: knowledge (alias facts), plan (script + storyboard), final (the rendered MP4; Shuttle's
    P11, D-135). Each writes qa/approvals/<kind>.json with its time and the person's notes."""
    if name == "plan":
        for n in ("script", "storyboard"):
            if not project.path(BY_NAME[n].out).exists():
                raise LoomError(f"nothing to approve yet: {BY_NAME[n].out} is missing")
        rec = _approval_record(project, "plan", by, notes, hashes=plan_hashes(project))
        from . import ledger as L
        L.log(project, "approval", node="plan", decision="approve", choice="approved", by={"kind": "human", "who": by},
              data={"hashes": rec["hashes"], "unattended": rec["unattended"], "notes": rec["notes"] or None})
        info(f"plan (script + storyboard) approved by {by}")
        return
    if name == "final":
        rp = render_print(project)
        if not rp or (project.stage_info("render") or {}).get("status") != "done":
            raise LoomError("nothing to approve yet: there is no finished render (renders/*.mp4)")
        rec = _approval_record(project, "final", by, notes, render=rp)
        from . import ledger as L
        L.log(project, "approval", node="render", decision="approve", choice="approved", by={"kind": "human", "who": by},
              data={"render": rp, "unattended": rec["unattended"], "notes": rec["notes"] or None})
        info(f"final film approved by {by}")
        keep_built(project)
        return
    if name not in ("knowledge", "facts"):
        raise LoomError("approval gates: knowledge (or facts), plan, final")
    p = project.path("plan/knowledge.json")
    k = read_json(p)
    k["review"] = {"status": "approved", "by": by, "note": k.get("review", {}).get("note", "")}
    write_json(p, k)
    E, W = GATES["knowledge"](project)
    if E:
        raise LoomError("knowledge sheet fails its gate:\n- " + "\n- ".join(E))
    mark_done(project, "knowledge", W, passed=True)
    rec = _approval_record(project, "facts", by, notes, facts=len(k.get("facts") or []))
    from . import ledger as L
    L.log(project, "approval", node="knowledge", decision="approve", choice="approved", by={"kind": "human", "who": by},
          data={"facts": len(k.get("facts") or []), "unattended": rec["unattended"], "notes": rec["notes"] or None})
    info(f"knowledge sheet approved by {by}")


def run_code(project, name, **kw):
    if name == "ingest":
        from .ingest import ingest
        ingest(project)
    elif name == "allocate":
        from .allocate import allocate
        from . import ledger as L
        L.allocation_decisions(project, allocate(project))
    elif name == "narrate":
        from .narrate import narrate
        narrate(project, force=kw.get("force", False))
        # the measured length against the request (1.3x; RC15): the script's estimate is a forecast, this is the
        # measurement. A narration far over the request goes back to the script's author before any scene is made
        from .checks.gates import check_narration
        NE, NW = check_narration(project)
        # every phrase transcribed back and compared with the script (D-174): a number read wrong, a name mangled or a
        # word dropped goes back to the script's author (reword, spell the number) before any scene is timed to it
        from .narrate.asr import check_speech
        AE, AW, AS = check_speech(project)
        NE, NW = NE + AE, NW + AW
        info(f"narrate: speech check {AS}")
        for w in NW:
            warn(f"narrate: {w}")
        if NE:
            project.set_stage(name, status="rejected", errors=NE[:50])
            raise LoomError("narrate: " + " ".join(NE))
    elif name == "compose":
        from .compose import compose
        from .narrate.mix import mix
        from .manim_bridge import render_all
        # final unless asked: only an interactive restyle preview asks for draft Manim clips (D-39). A lenient compose (a
        # snapshot while other workers still write) leaves out clip files not written yet, as it does bespoke scenes
        skip = not kw.get("strict", True)
        project._manim_report = render_all(project, quality=kw.get("manim_quality", "final"), skip_missing=skip)
        # the other clip renderers share the store and the draft/final rules (D-53, D-55)
        from . import skia_bridge, three_bridge
        project._manim_report += skia_bridge.render_all(project, quality=kw.get("manim_quality", "final"), skip_missing=skip)
        project._manim_report += three_bridge.render_all(project, quality=kw.get("manim_quality", "final"), skip_missing=skip)
        from . import page_bridge   # page clips (D-176): the approved libraries, rendered like the Three.js clips
        project._manim_report += page_bridge.render_all(project, quality=kw.get("manim_quality", "final"), skip_missing=skip)
        compose(project, strict=kw.get("strict", True))
        if kw.get("mix", True):
            mix(project)
    elif name == "check":
        from .qa import check
        from .manim_bridge import has_draft
        if has_draft(project):
            # the full check photographs what the video will show: never a draft (D-39)
            info("check: Manim drafts found; making them at full quality first")
            run_code(project, "compose")
        rep = check(project)
        from . import ledger as L
        try:
            L.check_outcomes(project, rep)
        except Exception as e:
            warn(f"ledger: check outcomes not logged ({e})")
        if rep["errors"]:
            project.set_stage(name, status="rejected", errors=rep["errors"][:50])
            raise LoomError(f"check failed with {len(rep['errors'])} error(s): see {project.path('qa/report.json')}")
    elif name == "render":
        # a render is the delivery: it needs a PASSING check, like `go` does. `run <id> render` used to skip
        # that, and on 2026-10-02 both step 7 lessons were rendered straight after a check that had failed
        # (7 and 47 errors). --force renders anyway and says so (L-168).
        chk = project.stage_info("check").get("status")
        if chk != "done":
            if not kw.get("force"):
                raise LoomError(f"render needs a passing check (check is '{chk or 'pending'}'): fix it, or run with --force --reason \"...\" to render anyway")
            force_render_allowed(project, kw.get("reason"), chk)
        from .render import render
        from .manim_bridge import has_draft
        if has_draft(project):
            info("render: Manim drafts found; making them at full quality first")
            run_code(project, "compose")
        # the motion's sound events must be mixed for THIS build (the check does it; a render straight after
        # compose would otherwise ship a mix without them)
        from .qa import sync_sfx
        sync_sfx(project)
        out = render(project, quality=kw.get("quality", "high"))
        from . import ledger as L
        L.log(project, "render", node="render", decision="render", choice="done", by={"kind": "code", "who": "loom/render.py"},
              data={"quality": kw.get("quality", "high"), "out": str(out) if out else None,
                    "verify": read_json(project.path("qa/render_verify.json"), {}) or None})
    else:
        raise LoomError(f"unknown code stage {name}")
    if name == "compose" and (not kw.get("strict", True) or not kw.get("mix", True)):
        # a scene worker's snapshot or a preview: lenient (beats still being written are left out) and silent (no
        # mix). It is not the stage's output, so it never marks compose done; it leaves it pending, so the real compose
        # runs before the check. Marking it done made the conductor skip that compose, and feedback-relay-v3 shipped with
        # narration only, no music or sound (L-405, R-51)
        project.set_stage(name, status="pending")
        return
    mark_done(project, name, passed=True)


THROWN = ("scene_threw", "tween_threw")


def force_render_allowed(project, reason, chk=None):
    """The rules for `render --force` (D-124, 2026-10-07): all five bench MP4s were forced past failing checks, one
    spliced from two builds. A forced render must say why (--reason), must render the build that was checked (the
    check report carries its build hash), and is refused outright when a scene or a frame callback threw: that beat
    shows nothing of what was planned. The override is logged with the error count and the checked hash."""
    from .qa import build_hash
    if not (reason or "").strip():
        raise LoomError("render --force needs --reason \"why this build ships despite its check\": the override is logged with it")
    rep = read_json(project.path("qa/report.json"), {}) or {}
    if not rep:
        raise LoomError("render --force: there is no check report (qa/report.json): run check first, so the override knows what it overrides")
    now = build_hash(project.path("build"))
    if rep.get("build_hash") != now:
        raise LoomError(f"render --force: the build changed after its check (checked {rep.get('build_hash') or 'an unstamped build'}, "
                        f"now {now}): run check again first")
    errs = rep.get("errors") or []
    thrown = [e for e in errs if any(k in str(e) for k in THROWN)]
    if thrown:
        raise LoomError(f"render --force refused: {len(thrown)} scene or frame callback(s) threw ({str(thrown[0])[:160]}); a thrown "
                        "scene renders nothing of its beat. Fix the scene first (no --force passes this)")
    warn(f"render: forced past a check that is '{chk or 'pending'}' ({len(errs)} error(s)): {reason}")
    from . import ledger as L
    L.log(project, "override", node="render", decision="force_render", choice=True, by={"kind": "human"},
          why=reason, data={"check": chk or "pending", "errors": len(errs), "build_hash": now,
                            "kinds": sorted({L._kind_of(str(e)) for e in errs})[:20]})
    return True


def scenes_needed(project) -> list[dict]:
    """Beats whose picture is a file someone writes: bespoke scenes, Manim scenes (not blueprints), Skia and Three clips."""
    sb = read_json(project.path("plan/storyboard.json"), {"scenes": []})
    # a three beat that names a preset (D-140) has nothing to write: its picture is params on a ready scene
    return [s for s in sb["scenes"] if (s["kind"] in ("bespoke", "skia", "three", "page") and not (s.get("three") or {}).get("preset"))
            or (s["kind"] == "manim" and not (s.get("manim") or {}).get("blueprint"))]


def accept_scenes(project):
    from .agent.scenes import syntax_errors
    E, W = GATES["scenes"](project)
    E += syntax_errors(project)
    if not E:
        mark_done(project, "scenes", W, passed=True)
    else:
        project.set_stage("scenes", status="rejected", errors=E[:50])
    _ledger_accept(project, "scenes", BY_NAME["scenes"], E, W)
    return E, W
