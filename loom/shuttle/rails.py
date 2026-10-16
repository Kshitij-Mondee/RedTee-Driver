"""Shuttle's rails (D-135): the lesson state machine every loom-mcp tool checks before it acts.

The design is docs/strategy/2026-10-08-shuttle-pipeline.md section 3. Nothing here trusts the lead agent:

- **Phases P1 to P11.** A phase is accepted when the engine's own gates say so (`flow.status`, `checks/*`), plus what
  only Shuttle records (the skeptic's verdict, the outline, the animatic, the kit preview, the critic) and, for P2,
  P6 and P11, a person's approval (facts, plan, final). A tool of phase N refuses until every phase before N is
  accepted, and refuses to rewrite an accepted phase: going back is `reopen(phase, reason)`.
- **Reopen** marks that phase and every later one stale (their artifacts are kept as versions, D-97), voids the
  approvals they hold, revokes the owner tokens they gave out, and counts against a cap (default 3 per lesson). A stale
  phase is accepted again only by new evidence after the reopen: a passing submit, `accept_phase`, or a new approval.
- **Owner tokens.** `delegate` gives a sub-agent a token naming the files it may write; its write tools refuse any
  other file, any call past its cap, and any tool its definition does not list. The lead writes plan artifacts
  only: beats, the kit and the fact sheet are a sub-agent's, through a token.
- **Budget.** Per lesson (USD, tokens or model calls), per phase and per sub-agent, read from
  `logs/shuttle/calls.jsonl` (every model call of the lead, its sub-agents and the other-family reviewers). At 100 %
  every write, build, delegation and review refuses and the run is marked stopped (the launcher exits 4).
- **Approvals.** `request_approval` writes `qa/approvals/<kind>.md` and marks the run waiting (exit 3); only
  `py -m loom approve <id> <kind>` (a person, or `--approve-as "... unattended ..."` recorded as such) ends the wait.

State lives in `projects/<id>/logs/shuttle/state.json`; the trail in `logs/shuttle/trace.jsonl` and the decision ledger.
"""
from __future__ import annotations

import datetime as _dt
import hashlib
import json
import os
import re
import threading
import uuid
from pathlib import Path

from ..util import read_json, write_json

PHASES = [("P1", "brief"), ("P2", "facts"), ("P3", "pedagogy"), ("P4", "persona and script"), ("P5", "storyboard"),
          ("P6", "narration and animatic"), ("P7", "lesson kit"), ("P8", "beats"), ("P9", "compose and check"),
          ("P10", "critique and fix"), ("P11", "render")]
IDS = [p for p, _ in PHASES]
NAMES = dict(PHASES)
APPROVAL_PHASE = {"facts": "P2", "plan": "P6", "final": "P11"}
# one `claude -p` session per group, each starting from the playbook and logs/shuttle/notes.md (design section 4).
# "phase" (the default since D-148): one session per phase, so a session's context holds one phase's work; the measured
# run's P7 to P9 session reached 314 thousand tokens. "group": the first split (P1-P4, P5-P6, P7-P9, P10-P11), kept as
# the classic option (D-70); config.json `session_split` chooses.
# "mixed" (the default since L-373): the measured run after D-148 spent its lead calls on session overhead in the small
# planning phases (26 sessions, each starting from status and notes and ending with a handoff) and restarted P5 and P6
# separately on every storyboard reopen; one session per phase pays where context piles up (the kit, the beats, the
# check, the critique), not before. P1 to P4 and P5 to P6 run as v2 ran them.
SPLITS = {"phase": [(p, p) for p in IDS], "group": [("P1", "P4"), ("P5", "P6"), ("P7", "P9"), ("P10", "P11")],
          "mixed": [("P1", "P4"), ("P5", "P6"), ("P7", "P7"), ("P8", "P8"), ("P9", "P9"), ("P10", "P10"), ("P11", "P11")]}
GROUPS = SPLITS["mixed"]


def gkey(group: tuple) -> str:
    """A session group's name: "P8" for one phase, "P7-P9" for a range."""
    return group[0] if group[0] == group[1] else f"{group[0]}-{group[1]}"


def parse_range(key: str) -> tuple | None:
    """"P7-P9" or "P8" to (first, last); None when it names no phase."""
    a, _, b = str(key or "").partition("-")
    b = b or a
    return (a, b) if a in IDS and b in IDS and IDS.index(a) <= IDS.index(b) else None
REOPEN_CAP = 3
# a reopen that names beats (P4 script lines, P5 storyboard scenes) changes only those: its own, larger cap (L-332)
SCOPED_CAP = 8
SCOPED_PHASES = ("P4", "P5")
OPEN_FINDING = ("blocker", "major")
CLOSED = ("fixed", "accepted")

# tool -> (kind, phase, who). kind: state, read, write, build, look, other, delegate, approval, ledger.
# who: lead (no token), token (a sub-agent's owner token), any.
READ_TOOLS = ("list_skill_sections", "get_skill_section", "get_api_section", "catalog_search", "get_catalog_entry", "capabilities",
              "get_style_pack", "get_world_pack", "get_example_scene", "get_beat", "get_fact", "get_source_chunks", "read_artifact")
TOOLS = {
    **{t: ("read", None, "any") for t in READ_TOOLS},
    "lesson_status": ("state", None, "any"), "budget_status": ("state", None, "any"),
    # the toolbox (D-137 to D-140, as Relay): a tool's section on request; a device beat's device, screen or mood swapped
    "use_tool": ("read", None, "any"), "set_device": ("state", None, "lead"),
    "new_lesson": ("state", None, "lead"), "reopen": ("state", None, "lead"), "accept_phase": ("state", None, "lead"),
    "submit_brief": ("write", "P1", "lead"),
    "submit_knowledge": ("write", "P2", "token"),
    "submit_teaching_plan": ("write", "P3", "lead"),
    "choose_persona": ("write", "P4", "lead"), "submit_script": ("write", "P4", "lead"), "patch_script": ("write", "P4", "lead"),
    "submit_outline": ("write", "P5", "lead"), "submit_storyboard": ("write", "P5", "lead"), "patch_storyboard": ("write", "P5", "lead"),
    "narrate": ("build", "P6", "lead"), "animatic": ("build", "P6", "lead"),
    "kit_preview": ("write", "P7", "token"), "submit_kit": ("write", "P7", "token"),
    "lab_snapshot": ("write", "P8", "token"), "submit_scene": ("write", "P8", "token"), "pilot_check": ("build", "P8", "lead"),
    "render_clip": ("write", "P8", "token"), "submit_clip": ("write", "P8", "token"),
    "compose": ("build", "P9", "lead"), "check": ("build", "P9", "lead"),
    # looking opens in P8 (the pilot, a beat in progress), on whatever build exists: the measured run's lead was refused
    # frames, contact_sheet and strips right after a failing pilot_check (2026-10-09)
    "contact_sheet": ("look", "P8", "any"), "frames": ("look", "P8", "any"), "strips": ("look", "P8", "any"),
    "skeptic_review": ("other", "P2", "lead"), "critic_review": ("other", "P10", "lead"),
    "submit_review": ("write", "P10", "lead"),
    # L-374: in a run whose critique lead is not its build lead, the judge plans the fixes and a fix round reports them done
    "plan_fixes": ("state", "P10", "lead"), "fixes_done": ("state", "P10", "lead"),
    "render": ("build", "P11", "lead"),
    "delegate": ("delegate", None, "lead"), "collect": ("delegate", None, "lead"),
    "request_approval": ("approval", None, "lead"),
    "report_finding": ("ledger", None, "any"), "note": ("ledger", None, "any"),
}
# Which tools a session lists (D-148): only its phases' tools, so the lead does not carry about 50 schemas in every call.
# A tool with a phase is listed in that phase's session; these list wider (the phases they serve, first to last); the
# tools the lead needs in every phase are always listed; sub-agents' tools are listed wherever their cards say they work
# (they reach loom-mcp through the same session). The rails refuse out of phase either way: the list is the context.
LIST_WINDOW = {
    "compose": ("P8", "P11"), "check": ("P8", "P11"), "contact_sheet": ("P8", "P11"), "frames": ("P8", "P11"), "strips": ("P8", "P11"),
    "set_device": ("P5", "P11"), "use_tool": ("P5", "P11"), "get_beat": ("P5", "P11"), "get_api_section": ("P5", "P11"),
    "catalog_search": ("P5", "P11"), "get_catalog_entry": ("P5", "P11"), "get_example_scene": ("P5", "P11"), "get_world_pack": ("P5", "P11"),
}
ALWAYS_LISTED = ("lesson_status", "budget_status", "read_artifact", "list_skill_sections", "get_skill_section", "get_fact", "get_source_chunks",
                 "capabilities", "get_style_pack", "note", "report_finding", "reopen", "accept_phase", "request_approval", "delegate", "collect")
NEVER_LISTED = ("new_lesson",)        # it always refuses: this server's lesson exists


def session_tools(first: str, last: str) -> set:
    """The tool names a session over phases first..last lists."""
    from . import agents as AG
    want = set(range(idx(first), idx(last) + 1))
    out = set(ALWAYS_LISTED)
    for t, (kind, phase, who) in TOOLS.items():
        if t in NEVER_LISTED or t in out:
            continue
        lo, hi = LIST_WINDOW.get(t, (phase, phase) if phase else (None, None))
        if lo and want & set(range(idx(lo), idx(hi) + 1)):
            out.add(t)
    for a in AG.load().values():
        ph = IDS if "any" in a["phases"] else a["phases"]
        if want & {idx(x) for x in ph}:
            out |= {t for t in a["tools"] if t in TOOLS and t not in NEVER_LISTED}
    return out


# the tool that writes each file kind, for owner tokens
FILE_TOOLS = {"submit_knowledge": "knowledge", "kit_preview": "kit", "submit_kit": "kit", "lab_snapshot": "scene", "submit_scene": "scene",
              "render_clip": "clip", "submit_clip": "clip"}
SPENDING = ("write", "build", "look", "other", "delegate", "approval")


def now() -> str:
    return _dt.datetime.now().isoformat(timespec="microseconds")


def sha(obj) -> str:
    if isinstance(obj, (bytes, bytearray)):
        b = bytes(obj)
    elif isinstance(obj, str):
        b = obj.encode("utf-8")
    else:
        b = json.dumps(obj, sort_keys=True, ensure_ascii=False).encode("utf-8")
    return hashlib.sha1(b).hexdigest()[:16]


def idx(pid: str) -> int:
    return IDS.index(pid)


class Refusal(Exception):
    pass


class Rails:
    _locks: dict = {}

    def __init__(self, project):
        self.p = project
        self.file = project.path("logs/shuttle/state.json")
        self.lock = Rails._locks.setdefault(str(self.file), threading.RLock())

    # ------------------------------------------------------------------ state file
    def load(self) -> dict:
        st = read_json(self.file, {}) if self.file.exists() else {}
        st.setdefault("version", 1)
        st.setdefault("lesson", self.p.id)
        for k in ("reopened_at", "evidence", "approval_void", "tokens", "budget", "kit_preview", "outline", "animatic", "critic", "scope",
                  "pilot"):
            st.setdefault(k, {})
        for k in ("reopens", "skeptic", "looked"):
            st.setdefault(k, [])
        st.setdefault("reopen_cap", REOPEN_CAP)
        st.setdefault("scoped_cap", SCOPED_CAP)
        st.setdefault("waiting", None)
        st.setdefault("stop", None)
        return st

    def save(self, st: dict):
        write_json(self.file, st)

    def update(self, fn):
        with self.lock:
            st = self.load()
            out = fn(st)
            self.save(st)
            return out

    def trace(self, event: str, **kv):
        f = self.p.path("logs/shuttle/trace.jsonl")
        f.parent.mkdir(parents=True, exist_ok=True)
        with self.lock, open(f, "a", encoding="utf-8") as fh:
            fh.write(json.dumps(dict(kv, event=event, at=now()), ensure_ascii=False, default=str) + "\n")

    # ------------------------------------------------------------------ engine facts
    def rows(self) -> dict:
        from .. import flow
        return {r["stage"]: r for r in flow.status(self.p)}

    def knowledge_hash(self) -> str | None:
        """The fact sheet without its review block: an approval rewrites `review`, never the facts."""
        f = self.p.path("plan/knowledge.json")
        if not f.exists():
            return None
        d = read_json(f, {}) or {}
        return sha({k: v for k, v in d.items() if k != "review"})

    def file_hash(self, rel: str) -> str | None:
        """Of the text (newlines normalised): Windows writes CRLF, and a preview hashes the source string it was given."""
        f = self.p.path(rel)
        return sha(f.read_text(encoding="utf-8", errors="replace")) if f.exists() and f.is_file() else None

    def approval(self, kind: str, st: dict | None = None) -> dict | None:
        """A person's approval of `kind` that still holds: recorded after any reopen that voided it, and (plan) still
        covering the current script and storyboard, (final) the current render."""
        from .. import flow
        st = st or self.load()
        rec = read_json(self.p.path(f"qa/approvals/{kind}.json"), {}) if self.p.path(f"qa/approvals/{kind}.json").exists() else {}
        if not rec or not rec.get("at"):
            return None
        void = (st.get("approval_void") or {}).get(kind)
        if void and rec["at"] <= void:
            return None
        if kind == "plan" and not flow.plan_approved(self.p):
            return None
        if kind == "facts" and (self.p.stage_info("knowledge") or {}).get("status") != "done":
            return None
        if kind == "final" and rec.get("render") != flow.render_print(self.p):
            return None
        return rec

    def conditions(self, pid: str, rows: dict | None = None, st: dict | None = None) -> list[str]:
        """What phase `pid` still lacks, in the engine's own terms ([] = everything holds)."""
        from .. import flow
        rows = rows if rows is not None else self.rows()
        st = st or self.load()
        miss = []

        def done(*stages):
            for s in stages:
                if s in rows and rows[s]["status"] != "done":
                    miss.append(f"stage {s} is {rows[s]['status']}")

        if pid == "P1":
            done("brief")
        elif pid == "P2":
            if self.p.mode == "source":
                done("ingest")
            else:
                ks = (self.p.stage_info("knowledge") or {}).get("status")
                if ks not in ("done", "needs_approval"):
                    miss.append(f"stage knowledge is {rows.get('knowledge', {}).get('status', 'pending')} (a fact-finder submits it)")
                else:
                    if not self.skeptic_ok(st):
                        miss.append("skeptic_review on the current fact sheet (a 'revise' verdict needs the sheet resubmitted)")
                    if not self.approval("facts", st):
                        miss.append("approval: facts (request_approval('facts', ...), then a person approves)")
        elif pid == "P3":
            done("pedagogy")
        elif pid == "P4":
            done("persona", "script", "allocate")
        elif pid == "P5":
            o = st.get("outline") or {}
            if not (o.get("hash") and o["hash"] == self.file_hash("plan/outline.json") and o.get("script") == self.file_hash("plan/script.json")):
                miss.append("submit_outline for the current script")
            done("storyboard")
        elif pid == "P6":
            done("narrate")
            if rows.get("narrate", {}).get("status") == "done":
                from ..checks.gates import check_narration
                E, _ = check_narration(self.p)
                miss += [f"narration: {e}" for e in E[:3]]
            if (st.get("animatic") or {}).get("plan") != flow.plan_hashes(self.p):
                miss.append("animatic of the current script and storyboard (call animatic and look at it)")
            if not miss and not self.approval("plan", st):
                miss.append("approval: plan (request_approval('plan', ...), then a person approves)")
        elif pid == "P7":
            from ..checks.kit import KIT, declared, kit_errors
            if declared(self.p):
                if not self.p.path(KIT).exists():
                    miss.append(f"{KIT} (a kit-builder submits it)")
                else:
                    E, _ = kit_errors(self.p)
                    miss += E[:3]
                    if (st.get("kit_preview") or {}).get("hash") != self.file_hash(KIT):
                        miss.append("kit_preview of the current kit (looked at before submit_kit)")
        elif pid == "P8":
            done("scenes")
            miss += self.files_missing(st)
            if not self.pilot_ok(st):
                pb = self.pilot_beats()
                miss.append(f"pilot_check of the first continue join ({', '.join(pb)}) with the current kit")
        elif pid == "P9":
            done("compose", "check")
        elif pid == "P10":
            from ..qa import build_hash
            c = st.get("critic") or {}
            if not c.get("build") or c["build"] != build_hash(self.p.path("build")):
                miss.append("critic_review of the current build")
            done("review")
            rv = read_json(self.p.path("qa/review.json"), {}) if self.p.path("qa/review.json").exists() else {}
            open_ = [f for f in rv.get("findings") or [] if f.get("severity") in OPEN_FINDING and f.get("status") not in CLOSED]
            if open_:
                miss.append(f"{len(open_)} blocker or major finding(s) not fixed or accepted (first: {open_[0].get('beat')}: "
                            f"{str(open_[0].get('problem'))[:80]})")
            # a blocker is closed by the critic, not the lead (L-439, L-440): the critic's latest pass on this build must not
            # report one, unless a person waived that beat (py -m loom shuttle waive <id> --beat <b> --by NAME --why ...)
            still = [b for b in c.get("blockers") or [] if not self.waived(b, st)]
            if c.get("build") and c["build"] == build_hash(self.p.path("build")) and still:
                miss.append(f"the critic still reports a blocker on {', '.join(still)}: fix it (a fixer or a scene author), then "
                            f"critic_review again; a blocker closes only when the critic stops reporting it, or by a person's waiver "
                            f"(py -m loom shuttle waive {self.p.id} --beat {still[0]} --by NAME --why REASON), never by the lead's accepted")
        elif pid == "P11":
            done("render")
            if not miss and not self.approval("final", st):
                miss.append("approval: final (request_approval('final', ...), then a person watches and approves)")
        return miss

    def needed_files(self) -> list[str]:
        """Every beat file the storyboard asks someone to write: bespoke scenes and Manim, Skia or Three clips."""
        from .. import flow
        from ..agents import tools as T
        out = []
        for sc in flow.scenes_needed(self.p):
            if sc["kind"] == "bespoke":
                out.append(f"scenes/{sc.get('scene') or sc['beat']}.js")
            else:
                f = T.clip_target(self.p, sc)
                if f is not None:
                    out.append(f.relative_to(self.p.root).as_posix())
        return out

    # ------------------------------------------------------------------ beat files and what each depends on
    def scene_of_file(self, rel: str) -> tuple[str | None, dict | None]:
        """The storyboard scene a beat file is written for (bespoke scene or clip)."""
        from ..agents import tools as T
        sb = read_json(self.p.path("plan/storyboard.json"), {}) or {}
        for sc in sb.get("scenes") or []:
            if sc.get("kind") == "bespoke" and rel == f"scenes/{sc.get('scene') or sc.get('beat')}.js":
                return sc.get("beat"), sc
            if sc.get("kind") in T.CLIP_FILE:
                f = T.clip_target(self.p, sc)
                if f is not None and f.relative_to(self.p.root).as_posix() == rel:
                    return sc.get("beat"), sc
        return None, None

    def kit_parts(self) -> dict:
        """One hash per lesson-kit part (`Loom.lesson.<id> = ...` to the next part) and one for the shared code before the
        first part, so a kit change re-opens only the beats that call a changed part."""
        f = self.p.path("scenes/_kit.js")
        if not f.exists():
            return {}
        src = f.read_text(encoding="utf-8", errors="replace")
        marks = [(m.start(), m.group(1)) for m in re.finditer(r"Loom\.lesson\.([A-Za-z_]\w*)\s*=\s*function", src)]
        out = {"_shared": sha(src[:marks[0][0]] if marks else src)}
        for i, (at, pid) in enumerate(marks):
            out[pid] = sha(src[at:marks[i + 1][0] if i + 1 < len(marks) else len(src)])
        return out

    def file_deps(self, rel: str, kit: dict | None = None) -> dict:
        """What a beat file was written against: its storyboard scene and the kit parts it calls."""
        _, sc = self.scene_of_file(rel)
        f = self.p.path(rel)
        src = f.read_text(encoding="utf-8", errors="replace") if f.exists() else ""
        used = sorted(set(re.findall(r"Loom\.lesson\.([A-Za-z_]\w*)", src)) | set(re.findall(r"Loom\.lesson\[\s*[\"'](\w+)[\"']\s*\]", src)))
        kit = self.kit_parts() if kit is None and used else (kit or {})
        deps = {"scene": sha(sc) if sc else None}
        if used:
            deps["kit"] = {u: kit.get(u) for u in used} | {"_shared": kit.get("_shared")}
        return deps

    def mark_file(self, rel: str):
        """A beat file was accepted (its submit passed, or accept_phase took it as it is): remember its content and what
        it was written against."""
        rec = {"hash": self.file_hash(rel), "deps": self.file_deps(rel), "at": now()}
        self.update(lambda st: st.setdefault("files", {}).__setitem__(rel, rec))

    def file_problem(self, rel: str, acc: dict, kit: dict | None = None, scenes: dict | None = None) -> tuple[str, str] | None:
        """None when the beat file stands as accepted; else (kind, why): kind "unaccepted" (missing, never accepted, or
        changed since) or "inputs" (its storyboard scene or a kit part it calls changed after it was accepted)."""
        if not self.p.path(rel).exists():
            return "unaccepted", "missing"
        rec = acc.get(rel)
        if rec is None:
            return "unaccepted", "not accepted yet"
        if isinstance(rec, str):                      # recorded before 2026-10-08: content only
            rec = {"hash": rec}
        if rec.get("hash") != self.file_hash(rel):
            return "unaccepted", "changed since it was accepted"
        deps = rec.get("deps") or {}
        if deps.get("scene"):
            _, sc = self.scene_of_file(rel) if scenes is None else (None, scenes.get(rel))
            if sc is not None and sha(sc) != deps["scene"]:
                return "inputs", "its storyboard scene changed"            # the change was made for this beat: its author's
        if deps.get("kit"):
            kit = self.kit_parts() if kit is None else kit
            changed = [u for u, h in deps["kit"].items() if kit.get(u) != h]
            if changed:
                # a kit change made for another beat: this beat is checked, not rewritten (Kshitij, 2026-10-09: "any error in
                # any beat only makes the agent rewrite that particular beat"); the next check decides (refresh_verified)
                return "verify", ("the kit's shared code changed" if changed == ["_shared"] else
                                  "kit part(s) " + ", ".join(u for u in changed if u != "_shared") + " changed")
        return None

    def files_missing(self, st: dict | None = None) -> list[str]:
        """Beat files not accepted as they are on disk, and accepted files whose inputs changed since. A draft that
        lab_snapshot wrote is not an accepted beat (S0, 2026-10-08). A storyboard fix to one beat re-opens that beat's
        file only, and a kit change only the beats that call a changed part (L-332): before, a reopen re-opened them all."""
        st = st or self.load()
        acc = st.get("files") or {}
        kit = self.kit_parts()
        bad, changed = [], []
        for rel in self.needed_files():
            pr = self.file_problem(rel, acc, kit)
            if pr and pr[0] == "unaccepted":
                bad.append(rel)
            elif pr and pr[0] == "inputs":
                changed.append(f"{rel} ({pr[1]})")
        out = []
        if bad:
            out.append(f"beat files not accepted yet: {', '.join(bad[:8])}{' ...' if len(bad) > 8 else ''}")
        if changed:
            out.append(f"beat files whose inputs changed since they were accepted: {', '.join(changed[:6])}{' ...' if len(changed) > 6 else ''}"
                       " (a fixer or scene-author changes them, or accept_phase('P8', beats=[...], why=...) takes them as they are)")
        return out

    def files_to_verify(self, st: dict | None = None) -> list[tuple[str, str, str | None]]:
        """(file, why, beat) for accepted beat files whose kit parts changed for another beat: checked, not rewritten."""
        acc = (st or self.load()).get("files") or {}
        kit = self.kit_parts()
        out = []
        for rel in self.needed_files():
            pr = self.file_problem(rel, acc, kit)
            if pr and pr[0] == "verify":
                out.append((rel, pr[1], self.scene_of_file(rel)[0]))
        return out

    def refresh_verified(self, beats_with_errors: set) -> dict:
        """After a check: a beat to verify that shows no error stands as it is (its record is refreshed); one that shows an
        error stays flagged and goes to a fixer with that error. No beat is rewritten for a change it did not need."""
        ok, bad = [], []
        for rel, why, beat in self.files_to_verify():
            if beat in beats_with_errors:
                bad.append(f"{rel} ({why}; the check shows an error in {beat})")
            else:
                self.mark_file(rel)
                ok.append(rel)
        if ok or bad:
            self.trace("verified_after_check", verified=ok, still_to_fix=bad)
        return {"verified": ok, "to_fix": bad}

    # ------------------------------------------------------------------ the pilot pair (L-319)
    def pilot_beats(self) -> list[str]:
        """With a lesson kit: the first continue join into a beat someone writes (the beat before it and that beat).
        The Opus run's kit could not carry continuity (each continue beat redrew the opaque set over what it held: 9
        overlaps in b03 at the first check), and nobody saw it until all 11 beats were written; the pair shows it after
        two. [] when there is no kit or no such join."""
        from ..agents import tools as T
        from ..checks.kit import declared
        if not declared(self.p):
            return []
        scenes = (read_json(self.p.path("plan/storyboard.json"), {}) or {}).get("scenes") or []
        for i, s in enumerate(scenes):
            j = s.get("join_in")
            jt = j.get("type") if isinstance(j, dict) else j
            written = s.get("kind") == "bespoke" or (s.get("kind") in T.CLIP_FILE and T.clip_target(self.p, s) is not None)
            if i and jt == "continue" and written:
                return [scenes[i - 1].get("beat"), s.get("beat")]
        return []

    def pilot_ok(self, st: dict | None = None) -> bool:
        beats = self.pilot_beats()
        if not beats:
            return True
        rec = (st or self.load()).get("pilot") or {}
        return bool(rec.get("pass")) and rec.get("beats") == beats and rec.get("kit") == self.file_hash("scenes/_kit.js")

    def take_files(self, beats: list | None = None, why: str | None = None, by: str = "lead") -> dict:
        """accept_phase('P8'): take the beat files on disk. A file with no record, or changed only in content, is taken as
        it is (as before); a file whose storyboard scene or kit parts changed is taken only when its beat is named, with a
        reason, and that is logged."""
        from .. import ledger as L
        st = self.load()
        acc = st.get("files") or {}
        kit = self.kit_parts()
        taken, need, named = [], [], set(beats or [])
        # a draft is not a beat: a file an owner token was given and never submitted (its author is still on it, was
        # stopped, or gave up) is not taken as it is. The measured run's lead took 10 such drafts after its session restarted
        # (2026-10-09, L-348); the rule "a file with no record is taken as it is" is for lessons made elsewhere.
        drafts = {}
        for tok, rec in (st.get("tokens") or {}).items():
            for f in rec.get("files") or []:
                if f not in acc and not rec.get("accepted"):
                    drafts[f] = f"{tok} ({rec.get('agent')}, {rec.get('status')}) never submitted it"
        for rel in self.needed_files():
            if not self.p.path(rel).exists():
                need.append(f"{rel} (missing)")
                continue
            pr = self.file_problem(rel, acc, kit)
            beat, _ = self.scene_of_file(rel)
            if rel in drafts and beat not in named:
                need.append(f"{rel} (a draft: {drafts[rel]}; collect that token and give the beat to an author)")
                continue
            if rel in drafts and not (why or "").strip():
                # a named draft still needs its reason here, not only in the server tool: the rails are the rule
                need.append(f"{rel} (a draft: {drafts[rel]}; taking it as a beat needs a reason, which is logged)")
                continue
            if rel in drafts:
                # taking a draft no author submitted is a decision: logged with its reason (the mutation check of
                # 2026-10-09 found the reason required by the server and then dropped)
                self.trace("draft_taken", file=rel, beat=beat, draft=drafts[rel], why=why, by=by)
                L.log(self.p, "decision", node="shuttle:P8", decision="take_draft_as_beat", choice=rel,
                      by={"kind": "agent", "who": by, "mode": "shuttle"}, why=why.strip()[:400], data={"draft": drafts[rel]})
            if pr and pr[0] == "verify" and beat not in named:
                continue                              # left for the next check to verify (refresh_verified)
            if pr and pr[0] == "inputs" and beat not in named:
                need.append(f"{rel} ({pr[1]})")
                continue
            self.mark_file(rel)
            taken.append(rel)
            if pr and pr[0] == "inputs":
                self.trace("file_taken", file=rel, beat=beat, inputs=pr[1], why=why, by=by)
                L.log(self.p, "decision", node="shuttle:P8", decision="take_beat_file", choice=rel, by={"kind": "agent", "who": by, "mode": "shuttle"},
                      why=(why or "no reason given")[:400], data={"inputs_changed": pr[1]})
        return {"taken": taken, "need_work": need}

    def skeptic_ok(self, st: dict) -> bool:
        h = self.knowledge_hash()
        sk = st.get("skeptic") or []
        if any(s.get("hash") == h and s.get("verdict") == "pass" for s in sk):
            return True
        # one revision round, as Relay: a 'revise' verdict on an earlier sheet, and the sheet changed after it
        return bool(sk) and sk[-1].get("verdict") == "revise" and sk[-1].get("hash") != h

    def status(self) -> dict:
        """Every phase: accepted, waiting (only a person's approval is missing), stale (reopened, not redone), open."""
        with self.lock:
            st = self.load()
            rows = self.rows()
            out, current = [], None
            for pid, name in PHASES:
                miss = self.conditions(pid, rows, st)
                ra = st["reopened_at"].get(pid)
                ev = st["evidence"].get(pid)
                stale = bool(ra) and not (ev and ev > ra) and not self._approved_after(pid, ra, st)
                if stale:
                    s = "stale"
                    sc = (st.get("scope") or {}).get(pid)
                    miss = [f"reopened at {ra[:19]}" + (f" for {', '.join(sc)} only: patch those beats" if sc else ": redo it")
                            + f", or accept_phase('{pid}') if it still holds"] + miss
                elif not miss:
                    s = "accepted"
                elif all(m.startswith("approval:") for m in miss):
                    s = "waiting"
                else:
                    s = "open"
                if s != "accepted" and current is None:
                    current = pid
                out.append({"phase": pid, "name": name, "status": s, "missing": miss})
            w = st.get("waiting")
            if w and self.approval(w["kind"], st):
                st["waiting"] = None
                self.save(st)
                self.trace("approval_seen", kind=w["kind"])
            return {"phases": out, "current": current, "waiting": st.get("waiting"), "stop": st.get("stop")}

    def _approved_after(self, pid, ra, st) -> bool:
        kind = next((k for k, v in APPROVAL_PHASE.items() if v == pid), None)
        rec = self.approval(kind, st) if kind else None
        return bool(rec and rec.get("at", "") > ra)

    def current(self) -> str | None:
        return self.status()["current"]

    def progress_mark(self) -> str:
        """A fingerprint of the lesson's progress: phase statuses and what each still misses, accepted beat files, reopens,
        tokens and their accepted submits. A session that leaves it unchanged made no progress (the launcher's retry
        count); one per phase re-enters a phase after a reopen, which is not a failed try (D-148)."""
        st = self.load()
        s = self.status()
        return sha({"phases": [(r["phase"], r["status"], r["missing"]) for r in s["phases"]], "files": st.get("files") or {},
                    "reopens": len(st["reopens"]), "waiting": bool(s["waiting"]), "fix_plan": (st.get("fix_plan") or {}).get("status"),
                    "tokens": {k: (v.get("status"), len(v.get("accepted") or [])) for k, v in st["tokens"].items()}})

    # ------------------------------------------------------------------ evidence after a reopen
    def progress(self, pid: str, status: dict | None = None) -> bool:
        """A completing tool or accept_phase succeeded for `pid`: when its conditions hold now, record the evidence
        (it clears a reopen's stale mark)."""
        with self.lock:
            st = self.load()
            if self.conditions(pid, None, st):
                return False
            st["evidence"][pid] = now()
            st.setdefault("scope", {}).pop(pid, None)       # a scoped reopen ends when its phase is accepted again
            self.save(st)
            return True

    # ------------------------------------------------------------------ the rule every tool passes first
    def allow(self, tool: str, caller: dict, args: dict | None = None) -> str | None:
        """None when the call may run; otherwise a short refusal that names the missing step."""
        from . import agents as AG
        if tool not in TOOLS:
            return f"unknown tool {tool}"
        kind, phase, who = TOOLS[tool]
        token = caller.get("token")
        st = self.load()
        if kind in ("read",) or tool in ("lesson_status", "budget_status", "note"):
            return None
        if st.get("stop") and kind in SPENDING:
            return f"the run is stopped ({st['stop'].get('reason')}): {st['stop'].get('detail', '')}. End this session; a person decides what next."
        if st.get("waiting") and tool not in ("report_finding",):
            s = self.status()
            if s["waiting"]:
                k = s["waiting"]["kind"]
                return (f"waiting for a person's '{k}' approval (qa/approvals/{k}.md). Nothing more can be written now: end this "
                        f"session with a two-line summary. The run resumes after `py -m loom approve {self.p.id} {k}`.")
        if kind in SPENDING:
            over = self.over_budget(st)
            if over:
                self.update(lambda s: s.__setitem__("stop", {"reason": "budget", "detail": over, "at": now()}))
                self.trace("budget_stop", detail=over, tool=tool)
                return f"budget: {over}. The run stops here (exit 4); end this session with a two-line summary."
        # who may call it
        if who == "lead" and token:
            return f"{tool} is the lead's; a sub-agent's token cannot call it"
        if who == "token" and not token:
            ag = {"submit_knowledge": "fact-finder", "kit_preview": "kit-builder", "submit_kit": "kit-builder", "lab_snapshot": "scene-author",
                  "submit_scene": "scene-author", "render_clip": "clip-author", "submit_clip": "clip-author"}[tool]
            return (f"{tool} is written by a {ag} sub-agent: delegate('{ag}', ...) gives it an owner token, and it passes that "
                    "token as `owner` (the lead never writes a beat, the kit or the fact sheet itself)")
        status = self.status()
        cur = status["current"]
        phases = {r["phase"]: r for r in status["phases"]}
        if token:
            t = st["tokens"].get(token)
            if not t:
                return f"unknown owner token {token}"
            if t["status"] != "open":
                return f"owner token {token} is {t['status']}: it writes nothing more"
            a = AG.resolve(t["agent"]) or {}
            if tool not in a.get("tools", []) and tool not in ("lesson_status", "budget_status", "report_finding", "note"):
                return f"{tool} is not among the {t['agent']}'s tools ({', '.join(a.get('tools', []))})"
            if t.get("calls", 0) >= t["limits"]["tool_calls"]:
                return f"the {t['agent']} token {token} used its {t['limits']['tool_calls']} tool calls: return your summary to the lead now"
            if cur not in t["phases"]:
                return f"the {t['agent']} works in {'/'.join(t['phases'])}; the lesson is in {cur} ({NAMES.get(cur, 'done')})"
            if tool in FILE_TOOLS and t.get("brief_parts"):
                # a brief is handed over by reference (D-148): nothing is written before all of it is read, so a sub-agent
                # never works from part of its spec, narration timings, held elements or findings
                unread = [k for k in range(1, int(t["brief_parts"]) + 1) if k not in (t.get("brief_read") or [])]
                if unread:
                    reads = " then ".join(f"read_artifact('brief:{token}{'' if k == 1 else f'#{k}'}', owner)" for k in unread)
                    return (f"read your whole brief before you write: part{'s' if len(unread) > 1 else ''} "
                            f"{', '.join(map(str, unread))} of {t['brief_parts']} not read yet ({reads})")
            if tool in FILE_TOOLS:
                target = self.target_of(tool, t, args or {})
                if isinstance(target, str) and target.startswith("refuse:"):
                    return target[7:]
            return None
        if tool in ("reopen", "accept_phase", "collect", "new_lesson", "request_approval", "delegate", "set_device"):
            return None      # each checks its own preconditions (they name the phase they act on)
        if phase is None:
            # a tool of no phase (report_finding, a ledger record): nothing to order it against. idx(None) raised here and,
            # on the loom runner, ended two planning sessions of the five-style test (2026-10-13, L-435)
            return None
        need = idx(phase)
        before = [r for r in status["phases"][:need] if r["status"] != "accepted"]
        if before:
            b = before[0]
            return f"{tool} belongs to {phase} ({NAMES[phase]}); {b['phase']} ({b['name']}) is not accepted yet: " + "; ".join(b["missing"][:3])
        if kind == "write" and phases[phase]["status"] == "accepted":
            return (f"{phase} ({NAMES[phase]}) is accepted; to change it call reopen('{phase}', reason)"
                    + (f", with beats=[...] when the change is limited to some beats (its own cap, no approval voided)" if phase in SCOPED_PHASES else "")
                    + ". Only that phase goes stale: later phases re-check themselves and open only if what they depend on changes")
        sc = (st.get("scope") or {}).get(phase)
        if sc and kind == "write" and phases[phase]["status"] == "stale":
            fix = "patch_storyboard" if phase == "P5" else "patch_script"
            if tool in ("submit_storyboard", "submit_outline", "submit_script"):
                return (f"{phase} is reopened for {', '.join(sc)} only: change those with {fix}; rewriting the whole {NAMES[phase]} "
                        f"needs reopen('{phase}', reason) without beats")
            if tool in ("patch_storyboard", "patch_script"):
                items = (args or {}).get("scenes" if tool == "patch_storyboard" else "beats") or []
                names = [it.get("beat") if tool == "patch_storyboard" else it.get("id") for it in items if isinstance(it, dict)]
                out = [str(n) for n in names if n not in sc]
                if out:
                    return f"{phase} is reopened for {', '.join(sc)} only; {', '.join(out)} is not among them"
                if tool == "patch_storyboard" and any((args or {}).get(k) is not None for k in ("kit", "value_script")):
                    return "a reopen for named beats changes those beats' scenes; the kit and the value script are not theirs (reopen without beats)"
        if kind == "look" and not self.p.path("build/index.html").exists():
            return f"{tool} needs a composed build: call compose first"
        if tool == "critic_review" and phases["P9"]["status"] != "accepted":
            return "critic_review needs a passing check (P9 accepted)"
        return None

    def target_of(self, tool: str, t: dict, args: dict):
        """The file an owner token's write would touch: one it owns, or 'refuse:<why>'."""
        from ..agents import tools as T
        kind = FILE_TOOLS[tool]
        if kind == "knowledge":
            rel = "plan/knowledge.json"
        elif kind == "kit":
            rel = "scenes/_kit.js"
        else:
            beat = args.get("beat") or (t["beats"][0] if len(t.get("beats") or []) == 1 else None)
            if not beat:
                return f"refuse:this token owns {len(t.get('beats') or [])} beats ({', '.join(t.get('beats') or [])}): pass `beat`"
            if beat not in (t.get("beats") or []):
                return f"refuse:beat {beat} is not this token's (it owns {', '.join(t.get('beats') or []) or 'no beat'})"
            sb = read_json(self.p.path("plan/storyboard.json"), {}) or {}
            sc = next((s for s in sb.get("scenes") or [] if s.get("beat") == beat), None)
            if not sc:
                return f"refuse:no storyboard scene for {beat}"
            if kind == "clip":
                if sc.get("kind") not in T.CLIP_FILE:
                    return f"refuse:{beat} is a {sc.get('kind')} beat, not a clip"
                rel = T.clip_target(self.p, sc).relative_to(self.p.root).as_posix()
            else:
                if sc.get("kind") != "bespoke":
                    return f"refuse:{beat} is a {sc.get('kind')} beat, not a bespoke scene"
                rel = f"scenes/{sc.get('scene') or beat}.js"
        if rel not in t["files"]:
            return f"refuse:{rel} is not in this token's files ({', '.join(t['files'])}); one writer per file"
        return rel

    # ------------------------------------------------------------------ reopen
    def reopen(self, phase: str, reason: str, by: str = "lead", beats: list | None = None) -> dict:
        """Go back to `phase`. Only that phase becomes stale. A later phase stays accepted while its own conditions hold
        and opens by itself when something it depends on changes: the engine's input hashes per stage, the plan hashes,
        the kit preview, each beat file's storyboard scene and kit parts, the critic's build, the render. Before
        2026-10-08 every later phase was marked stale too, so a two-number storyboard fix (the Opus run's b13 quiz)
        re-earned P6 to P11 and spent a reopen of the cap (L-332).

        `beats` scopes it to some beats: only their scenes (P5) or script lines (P4) may change. A scoped reopen voids no
        approval (one whose content changes voids itself by hash) and counts against its own cap; a whole reopen voids
        the approvals from `phase` on, revokes the later phases' owner tokens and counts against the reopen cap."""
        from .. import ledger as L
        from ..stages import BY_NAME
        if phase not in IDS:
            raise Refusal(f"no phase {phase}; phases are {', '.join(IDS)}")
        if not (reason or "").strip():
            raise Refusal("reopen needs a reason (it is logged)")
        beats = [b for b in (beats or []) if b]
        if beats:
            if phase not in SCOPED_PHASES:
                raise Refusal(f"a reopen for named beats is for the script (P4) or the storyboard (P5); a beat file is changed in place "
                              f"by a fixer or a scene-author (P8 to P10), no reopen needed")
            if phase == "P5":
                have = {s.get("beat") for s in (read_json(self.p.path("plan/storyboard.json"), {}) or {}).get("scenes") or []}
            else:
                have = {b.get("id") for b in (read_json(self.p.path("plan/script.json"), {}) or {}).get("beats") or []}
            unknown = [b for b in beats if b not in have]
            if unknown:
                raise Refusal(f"no beat {', '.join(unknown)} in the {'storyboard' if phase == 'P5' else 'script'}")
        status = self.status()
        cur = status["current"]
        if cur is not None and idx(phase) > idx(cur):
            raise Refusal(f"nothing to reopen: {phase} is after the current phase {cur}; just work on {cur}")
        with self.lock:
            st = self.load()
            whole = [r for r in st["reopens"] if not r.get("beats")]
            scoped = [r for r in st["reopens"] if r.get("beats")]
            if beats and len(scoped) >= st.get("scoped_cap", SCOPED_CAP):
                raise Refusal(f"the cap for reopens of named beats ({st.get('scoped_cap', SCOPED_CAP)}) is used: ask the person (request_approval "
                              "or end the session with what you would change and why)")
            if not beats and len(whole) >= st.get("reopen_cap", REOPEN_CAP):
                raise Refusal(f"the reopen cap ({st.get('reopen_cap', REOPEN_CAP)}) is used. A change limited to some beats of the script or "
                              f"the storyboard is reopen('{phase}', reason, beats=[...]) (its own cap); otherwise ask the person "
                              "(request_approval or end the session with what you would change and why)")
            t = now()
            versions = {}
            stage_of = {"P1": ["brief"], "P2": ["knowledge"], "P3": ["pedagogy"], "P4": ["persona", "script"], "P5": ["storyboard"],
                        "P8": ["scenes"], "P10": ["review"]}
            st["reopened_at"][phase] = t
            for s in stage_of.get(phase, []):
                if self.p.path(BY_NAME[s].out).exists():
                    versions[s] = L.snapshot(self.p, s, BY_NAME[s].out, "reopened")
            if self.p.path("plan/outline.json").exists() and phase == "P5" and not beats:
                versions["outline"] = L.snapshot(self.p, "outline", "plan/outline.json", "reopened")
            void = [] if beats else [k for k, v in APPROVAL_PHASE.items() if idx(v) >= idx(phase)]
            for k in void:
                st["approval_void"][k] = t
            revoked = []
            for tok, rec in st["tokens"].items():
                if rec["status"] != "open":
                    continue
                if (beats and set(rec.get("beats") or []) & set(beats)) or (not beats and all(idx(x) >= idx(phase) for x in rec["phases"])):
                    rec["status"] = "revoked"
                    revoked.append(tok)
            if beats:
                st["scope"][phase] = beats
            else:
                st["scope"].pop(phase, None)
            entry = {"at": t, "phase": phase, "reason": reason, "by": by, "beats": beats or None, "stale": [phase],
                     "later": "each later phase re-checks itself: it opens only if something it depends on changes",
                     "versions": versions, "approvals_voided": void, "tokens_revoked": revoked}
            st["reopens"].append(entry)
            st["waiting"] = None
            self.save(st)
        self.trace("reopen", **entry)
        L.log(self.p, "decision", node=f"shuttle:{phase}", decision="reopen", choice=phase, by={"kind": "agent", "who": by, "mode": "shuttle"},
              why=reason[:600], data={"beats": beats or None, "voided": void, "revoked": revoked,
                                      "n": len(scoped) + 1 if beats else len(whole) + 1})
        return entry

    @staticmethod
    def reopen_counts(st: dict) -> str:
        whole = len([r for r in st.get("reopens") or [] if not r.get("beats")])
        scoped = len([r for r in st.get("reopens") or [] if r.get("beats")])
        return (f"{whole} of {st.get('reopen_cap', REOPEN_CAP)}; for named beats {scoped} of {st.get('scoped_cap', SCOPED_CAP)}")

    def grant_reopens(self, by: str, why: str, n: int = 1) -> dict:
        """A person lifts this lesson's reopen cap (the lead, its cap used, asked for one: Opus run, 2026-10-08, b13).
        Only the cap changes: what to reopen and how to fix it stay the lead's. Recorded as the person's override."""
        from .. import ledger as L
        if not (by or "").strip() or by.strip().lower().startswith("agent"):
            raise Refusal("a reopen grant is a person's decision: --by names the person")
        if not (why or "").strip():
            raise Refusal("a reopen grant needs its reason (it is logged)")
        if int(n) < 1:
            raise Refusal("grant at least one reopen")
        with self.lock:
            st = self.load()
            before = int(st.get("reopen_cap", REOPEN_CAP))
            entry = {"at": now(), "by": by, "why": why, "n": int(n), "cap_before": before, "cap_after": before + int(n),
                     "used": len([r for r in st["reopens"] if not r.get("beats")])}
            st["reopen_cap"] = before + int(n)
            st.setdefault("grants", []).append(entry)
            self.save(st)
        self.trace("reopen_granted", **entry)
        L.log(self.p, "decision", node="shuttle", decision="reopen_cap", choice=str(entry["cap_after"]), by={"kind": "person", "who": by},
              why=why[:600], data={"cap_before": before, "used": entry["used"]})
        return entry

    def waive_blocker(self, beat: str, by: str, why: str) -> dict:
        """A person ships a beat over the critic's blocker (L-439, L-440: in 4 of the five-style test's 15 films the lead
        marked a critic blocker "accepted" and shipped it; the frames showed three of them real). A blocker closes only when
        the critic's next pass on the changed build no longer reports it, or by this: a person's waiver, never an agent's."""
        from .. import ledger as L
        if not (by or "").strip() or by.strip().lower().startswith("agent"):
            raise Refusal("a blocker waiver is a person's decision: --by names the person (an agent's unattended approval does not count)")
        if not (why or "").strip():
            raise Refusal("a blocker waiver needs its reason (it is logged)")
        entry = {"at": now(), "beat": beat, "by": by, "why": why}
        with self.lock:
            st = self.load()
            st.setdefault("waivers", []).append(entry)
            self.save(st)
        self.trace("blocker_waived", **entry)
        L.log(self.p, "decision", node=f"review:{beat}", decision="blocker_waived", choice=beat, by={"kind": "person", "who": by}, why=why[:600])
        return entry

    def waived(self, beat: str, st: dict | None = None) -> bool:
        st = st if st is not None else self.load()
        return any(w.get("beat") == beat for w in st.get("waivers") or [])

    # ------------------------------------------------------------------ owner tokens
    def delegate(self, agent: str, beats: list | None, files: list | None, brief: str, by_model: str | None = None) -> dict:
        from . import agents as AG
        from ..agents import tools as T
        a = AG.resolve(agent)
        if not a:
            raise Refusal(f"no sub-agent '{agent}'; have: {', '.join(AG.load())}")
        if not (brief or "").strip():
            raise Refusal("a delegation needs its brief (what to pass is in the playbook's delegation templates)")
        cur = self.current()
        if "any" not in a["phases"] and cur not in a["phases"]:
            raise Refusal(f"the {a['name']} works in {'/'.join(a['phases'])}; the lesson is in {cur}")
        if "any" not in a["phases"]:
            first = min(idx(x) for x in a["phases"])
            s = self.status()
            behind = [r for r in s["phases"][:first] if r["status"] != "accepted"]
            if behind:
                raise Refusal(f"{behind[0]['phase']} ({behind[0]['name']}) is not accepted: " + "; ".join(behind[0]["missing"][:2]))
        beats = list(beats or [])
        if a["name"] in ("scene-author", "clip-author") and cur == "P8" and beats and not self.pilot_ok():
            pb = self.pilot_beats()
            other = [b for b in beats if b not in pb]
            if other:
                raise Refusal(f"first the pilot: {' and '.join(pb)}, the first continue join. Delegate those, then pilot_check(); "
                              f"{', '.join(other)} and the other beats follow when it passes. It proves the kit and the continuity "
                              "contract on two beats (the Opus run found its kit could not carry continuity only after all 11 were written)")
        want = []
        sb = read_json(self.p.path("plan/storyboard.json"), {}) or {}
        by_beat = {s.get("beat"): s for s in sb.get("scenes") or []}
        own = a.get("owns", "")
        if "{beat}" in own or a["name"] in ("scene-author", "clip-author", "fixer"):
            if not beats and not files:
                raise Refusal(f"the {a['name']} needs `beats` (the beats it writes)")
            for b in beats:
                sc = by_beat.get(b)
                if not sc:
                    raise Refusal(f"no storyboard scene for beat {b}")
                if sc.get("kind") == "bespoke":
                    want.append(f"scenes/{sc.get('scene') or b}.js")
                elif sc.get("kind") in T.CLIP_FILE:
                    tgt = T.clip_target(self.p, sc)
                    if tgt is None:
                        what = ("a device beat (three preset): the engine draws it from its params; change its device, screen or "
                                "mood with set_device") if sc.get("kind") == "three" else "a Manim blueprint"
                        raise Refusal(f"{b} is {what}: nothing to write")
                    want.append(tgt.relative_to(self.p.root).as_posix())
                else:
                    raise Refusal(f"{b} is a {sc.get('kind')} beat: the storyboard draws it (patch_storyboard after a reopen), no file to write")
                if a["name"] == "scene-author" and sc.get("kind") != "bespoke":
                    raise Refusal(f"{b} is a {sc.get('kind')} clip: delegate it to the clip-author")
                if a["name"] == "clip-author" and sc.get("kind") not in T.CLIP_FILE:
                    raise Refusal(f"{b} is a {sc.get('kind')} beat: delegate it to the scene-author")
        elif own:
            want.append(own)
        for f in files or []:
            if f not in want:
                raise Refusal(f"{f} is not a file the {a['name']} writes for these beats ({', '.join(want) or 'none'})")
        with self.lock:
            st = self.load()
            for tok, rec in st["tokens"].items():
                clash = sorted(set(rec["files"]) & set(want)) if rec["status"] == "open" else []
                if clash:
                    raise Refusal(f"{clash[0]} is owned by the open token {tok} ({rec['agent']}): collect it first (one writer per file)")
            # a scripted replay (S0: the mock lead must name the token in its next reply) asks for predictable tokens, keyed by
            # agent and beats (parallel delegations run in any order) and counted per key
            if os.environ.get("LOOM_SHUTTLE_SEQ_TOKENS"):
                key = f"own-{a['name']}" + (f"-{'-'.join(beats)}" if beats else "")
                tok = f"{key}-{sum(1 for k in st['tokens'] if k.rsplit('-', 1)[0] == key) + 1}"
            else:
                tok = f"own-{a['name']}-{uuid.uuid4().hex[:8]}"
            bp = self.p.path(f"logs/shuttle/briefs/{tok}.md")
            bp.parent.mkdir(parents=True, exist_ok=True)
            bp.write_text(brief.rstrip() + "\n", encoding="utf-8")
            rec = {"agent": a["name"], "model": a["model"], "beats": beats, "files": want, "phases": a["phases"] if "any" not in a["phases"] else IDS,
                   "limits": {"tool_calls": int(a["tool_calls"]), "max_turns": int(a["max_turns"])}, "calls": 0, "status": "open",
                   "created": now(), "phase": cur, "brief": bp.relative_to(self.p.root).as_posix(), "accepted": [], "refused": 0,
                   "errors": [], "snapshots": 0, "findings": 0}
            st["tokens"][tok] = rec
            self.save(st)
        self.trace("delegate", token=tok, agent=a["name"], beats=beats, files=want, phase=cur, by_model=by_model)
        return {"token": tok, **rec}

    def count_call(self, token: str, tool: str, result: dict | None, refused: bool):
        def fn(st):
            t = st["tokens"].get(token)
            if not t:
                return
            t["calls"] = t.get("calls", 0) + 1
            if refused:
                t["refused"] = t.get("refused", 0) + 1
            r = result if isinstance(result, dict) else {}
            if r.get("accepted") is True:
                t["accepted"].append(tool)
            if r.get("accepted") is False:
                t["errors"] = [str(e)[:200] for e in (r.get("errors") or [])][:10]
            if tool in ("lab_snapshot", "render_clip", "kit_preview") and not r.get("error"):
                t["snapshots"] = t.get("snapshots", 0) + 1
            if tool == "report_finding" and r.get("logged"):
                t["findings"] = t.get("findings", 0) + 1
        self.update(fn)

    def collect(self, token: str, force: bool = False) -> dict:
        with self.lock:
            st = self.load()
            t = st["tokens"].get(token)
            if not t:
                raise Refusal(f"unknown owner token {token}")
            if t["status"] == "open" and not t.get("calls") and not force:
                # in S0 the lead collected a fact-finder that was still running in the background; closing the token then
                # would refuse the sub-agent's own submit
                raise Refusal(f"the {t['agent']} has made no loom call yet: if it is still running, wait for its result (spawn with "
                              "run_in_background false); collect(token, force=true) closes it anyway")
            if t["status"] == "open":
                t["status"] = "collected"
                t["collected"] = now()
            self.save(st)
        self.trace("collect", token=token, agent=t["agent"], accepted=t["accepted"], calls=t["calls"])
        return t

    def brief_read(self, token: str, part: int, parts: int):
        """A sub-agent read part `part` of its brief (of `parts`, as the brief is now)."""
        def fn(st):
            t = st["tokens"].get(token)
            if t is not None:
                t["brief_parts"] = int(parts)
                t["brief_read"] = sorted(set(t.get("brief_read") or []) | {int(part)})
        self.update(fn)

    def open_tokens(self, worked_only: bool = True) -> list:
        """The open owner tokens (by default those whose sub-agent made a loom call: it ran, so it can be collected)."""
        st = self.load()
        return [k for k, v in st["tokens"].items() if v["status"] == "open" and (v.get("calls") or not worked_only)]

    # ------------------------------------------------------------------ budget
    def spent(self) -> dict:
        f = self.p.path("logs/shuttle/calls.jsonl")
        out = {"usd": 0.0, "tokens": 0, "calls": 0, "by_phase": {}, "by_agent": {}}
        if not f.exists():
            return out
        for line in f.read_text(encoding="utf-8").splitlines():
            try:
                r = json.loads(line)
            except json.JSONDecodeError:
                continue
            usd = float(r.get("usd") or 0)
            tok = int(r.get("input") or 0) + int(r.get("output") or 0)
            n = 0 if (r.get("reconcile") or r.get("agent") == "reconcile") else 1     # a reconcile row is not a model call
            out["usd"] += usd
            out["tokens"] += tok
            out["calls"] += n
            for key, name in (("by_phase", r.get("phase") or "-"), ("by_agent", r.get("agent") or r.get("role") or "lead")):
                b = out[key].setdefault(name, {"usd": 0.0, "tokens": 0, "calls": 0})
                b["usd"] += usd
                b["tokens"] += tok
                b["calls"] += n
        out["usd"] = round(out["usd"], 6)
        return out

    def over_budget(self, st: dict | None = None) -> str | None:
        st = st or self.load()
        b = st.get("budget") or {}
        sp = self.spent()
        for unit in ("usd", "tokens", "calls"):
            lim = b.get(unit)
            if lim is not None and sp[unit] >= float(lim):
                return f"{unit} {sp[unit]:.4g} of {lim} used for the lesson"
        for pid, lim in (b.get("phases") or {}).items():
            got = sp["by_phase"].get(pid) or {}
            for unit, v in lim.items():
                if got.get(unit, 0) >= float(v):
                    return f"{pid}: {unit} {got.get(unit, 0):.4g} of {v} used"
        for ag, lim in (b.get("agents") or {}).items():
            got = sp["by_agent"].get(ag) or {}
            for unit, v in lim.items():
                if got.get(unit, 0) >= float(v):
                    return f"{ag}: {unit} {got.get(unit, 0):.4g} of {v} used"
        return None

    def budget_status(self) -> dict:
        st = self.load()
        b = st.get("budget") or {}
        sp = self.spent()
        left = {u: (round(float(b[u]) - sp[u], 6) if b.get(u) is not None else None) for u in ("usd", "tokens", "calls")}
        pct = max([sp[u] / float(b[u]) * 100 for u in ("usd", "tokens", "calls") if b.get(u)] or [0])
        return {"limits": b, "spent": sp, "left": left, "used_pct": round(pct, 1), "stop": st.get("stop"),
                "reopens": self.reopen_counts(st),
                "note": "subscription mode: USD is the list price of the tokens (notional), not a bill" if st.get("mode") == "subscription" else ""}

    # ------------------------------------------------------------------ approvals
    def request_approval(self, kind: str, summary: str, files: list | None, approve_as: str | None = None) -> dict:
        if kind not in APPROVAL_PHASE:
            raise Refusal(f"approval kinds: {', '.join(APPROVAL_PHASE)}")
        pid = APPROVAL_PHASE[kind]
        s = self.status()
        row = next(r for r in s["phases"] if r["phase"] == pid)
        behind = [r for r in s["phases"][:idx(pid)] if r["status"] != "accepted"]
        if behind:
            raise Refusal(f"{kind} approval belongs to {pid}; {behind[0]['phase']} is not accepted: " + "; ".join(behind[0]["missing"][:2]))
        rest = [m for m in row["missing"] if not m.startswith("approval:") and not m.startswith("reopened at")]
        if rest:
            raise Refusal(f"{pid} is not ready for a person yet: " + "; ".join(rest[:3]))
        if self.approval(kind):
            return {"approved": True, "note": f"{kind} is already approved"}
        lines = [f"# {kind.capitalize()} approval: {self.p.id}", "", summary.strip(), "", "Look at:"]
        lines += [f"- {f}" for f in files or []] or ["- (no files named)"]
        lines += ["", f"Approve: py -m loom approve {self.p.id} {kind} --by \"<name>\" [--notes \"...\"]",
                  f"Then: py -m loom shuttle resume {self.p.id}   (your notes are handed to the lead)"]
        out = self.p.path(f"qa/approvals/{kind}.md")
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text("\n".join(lines) + "\n", encoding="utf-8")
        if approve_as:
            from .. import flow
            flow.approve(self.p, kind, approve_as, notes="unattended run: approved by the launcher's --approve-as")
            self.trace("approval_unattended", kind=kind, by=approve_as)
            self.progress(pid)
            return {"approved": True, "unattended": approve_as, "file": str(out)}
        self.update(lambda st: st.__setitem__("waiting", {"kind": kind, "at": now(), "file": out.relative_to(self.p.root).as_posix()}))
        self.trace("approval_requested", kind=kind, files=files)
        return {"waiting": kind, "file": out.relative_to(self.p.root).as_posix(),
                "next": "stop now: end this session with a two-line summary. The run resumes after a person approves."}
