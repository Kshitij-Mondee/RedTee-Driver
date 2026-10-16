"""loom-mcp (D-135): the MCP stdio server Shuttle's lead and sub-agents work through.

    py -m loom.shuttle.server --project <id>

Every tool checks the rails first (`rails.Rails.allow`) and answers a short refusal that names the missing step; then
it runs the engine function Relay's agents already use (`loom/agents/tools.py`, `loom/flow.py`, `loom/qa.py`,
`loom/story.py`, `loom/lab.py`), so a Shuttle artifact passes exactly the gate a Relay or Cowork one does.

Who calls: the lead (no token) or a sub-agent (its `owner` token from `delegate`). The PreToolUse hook records who called
(Claude Code tells hooks the sub-agent type, not MCP servers) in `logs/shuttle/callers/<tool-use id>.json`, and the
server reads it by the id the CLI sends in the call's `_meta`; a token and a caller that disagree are refused. Every call is
logged twice: `logs/shuttle/trace.jsonl` and a `tool_call` record in the decision ledger naming the model that really
called (the lead's, or the sub-agent's from its definition and the session's stream), and gate records written during
the call name it too (`ledger.RUNNING`, L-268).

Protocol: JSON-RPC 2.0, one message per line (MCP stdio). File descriptor 1 is the protocol: the engine's own prints
and any child process (node, ffmpeg) are sent to stderr.
"""
from __future__ import annotations

import base64
import copy
import io
import json
import os
import sys
import threading
import time
import traceback
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

from ..util import ENGINE_ROOT, LoomError, read_json, write_json
from . import rails as RL

PROTOCOL = "2025-06-18"
# reads of the engine's own documents (skills, the scene API, the catalogue, packs, examples) run in parallel; every other
# tool reads or writes the lesson's state and runs one at a time
STATIC = {"list_skill_sections", "get_skill_section", "get_api_section", "catalog_search", "get_catalog_entry", "capabilities",
          "get_style_pack", "get_example_scene", "get_world_pack"}
# tools that take the engine lock themselves, only for the part that touches the lesson (lab_snapshot: the draft and the
# compose; its picture and probe run on a private copy of the build, in parallel)
SELF_LOCKED = {"lab_snapshot"}
MAX_TEXT = 40000
# a sub-agent's brief is read in parts of this many characters (the measured run's longest, a fixer's, was 83 thousand);
# a reply may carry one part as JSON (newlines and quotes escaped), so the reply cap sits above it
BRIEF_PART = 50000
MAX_REPLY = 64000
# pictures by what the judgment needs (D-148), as pixels sent: "full" is the model's own limit (about 1.15 million pixels,
# 1568 on the long side, about 1,500 tokens). A contact sheet's "overview" is a sweep of up to nine beats; "full" shows up
# to three, so each frame is about twice as wide. The overview is sent at the model's own limit too, which is what the lead
# saw before: a smaller one (config.json pictures.overview_px, e.g. 600000) is a cut made for cost, and ships as the
# default only after a shadow run shows the lead catches the same defects with it (CLAUDE.md rule 13; Kshitij, 2026-10-09:
# "hopefully none of these upgrades actually bring down the quality of the video").
def _pictures() -> dict:
    c = (read_json(ENGINE_ROOT / "loom" / "shuttle" / "config.json", {}) or {}).get("pictures") or {}
    full = (1568, 1_150_000)
    return {"full": full, "overview": (1568, int(c.get("overview_px") or full[1]))}


PICTURE = _pictures()
FULL_BEATS = 3          # a close look: at most three beats' sheets in one picture, so each frame is about 450 px wide
SERVER_NOTE = ("Loom's tool server for one lesson. Tools refuse out of phase and name the missing step; lesson_status "
               "says where the lesson is. Sub-agents pass their owner token as `owner`.")


# ------------------------------------------------------------------ schemas
S = {"type": "string"}
OBJ = {"type": "object"}
ART = {"artifact": {"type": "object", "description": "the COMPLETE artifact (its shape: the stage's schema)"}}
OWNER = {"owner": {"type": "string", "description": "your owner token from the lead's delegate() (sub-agents only)"}}
BEAT = {"beat": {"type": "string", "description": "the beat (needed when your token owns more than one)"}}
TIMES = {"type": "array", "items": {"type": "number"}, "minItems": 1, "maxItems": 4}
EDITS = {"edits": {"type": "array", "minItems": 1, "description": "changes to your current draft instead of the whole file: each "
                   "{old, new}, old copied exactly from the draft and found there once",
                   "items": {"type": "object", "properties": {"old": S, "new": S}, "required": ["old", "new"], "additionalProperties": False}}}


def schema(props: dict, req: list | None = None) -> dict:
    return {"type": "object", "properties": dict(props), "required": list(req or []), "additionalProperties": False}


def from_relay(name: str, extra: dict | None = None) -> dict:
    """A Relay tool's own argument schema, plus Shuttle's owner/beat fields."""
    from ..agents import tools as T
    s = copy.deepcopy(T.TOOLS[name].parameters)
    s["properties"].update(extra or {})
    return s


# ------------------------------------------------------------------ the server
class Server:
    def __init__(self, project_id: str):
        from ..project import Project
        self.pid = project_id
        self.p = Project.open(project_id)
        self.rails = RL.Rails(self.p)
        self.states: dict = {}          # (caller, beat) -> a Relay ToolContext.state (snapshots taken, draft written)
        self.lock = threading.Lock()
        self.engine = threading.RLock()
        self.tools = self._registry()
        # the session this server serves ("P8", or "P7-P9" with the classic split), from the launcher; none lists every tool
        self.session_key = os.environ.get("LOOM_SHUTTLE_SESSION") or None

    def window(self) -> tuple | None:
        return RL.parse_range(self.session_key) if self.session_key else None

    # ---------------------------------------------------------------- who is calling, with which model
    def session(self) -> dict:
        return read_json(self.p.path("logs/shuttle/session.json"), {}) if self.p.path("logs/shuttle/session.json").exists() else {}

    def caller(self, args: dict, use_id: str | None = None) -> dict:
        tok = args.pop("owner", None)
        hook = {}
        if use_id:
            # the PreToolUse hook wrote who called (Claude Code reports a sub-agent's type to hooks, never to MCP servers);
            # the CLI sends the same tool-use id in the call's _meta (2.1.283: claudecode/toolUseId)
            f = self.p.path(f"logs/shuttle/callers/{use_id}.json")
            if f.exists():
                hook = read_json(f, {}) or {}
                hook["seen"] = True
        st = self.rails.load()
        sess = self.session()
        if tok:
            t = st["tokens"].get(tok) or {}
            agent = t.get("agent", "?")
            # the sub-agent's model as the stream reported it, else the lead's when it runs the same alias, else the alias
            model = ((sess.get("agents") or {}).get(f"shuttle-{agent}")
                     or (sess.get("lead_model") if t.get("model") and t.get("model") == sess.get("lead_alias") else None) or t.get("model"))
            c = {"who": agent, "token": tok, "model": model}
        else:
            c = {"who": "lead", "model": sess.get("lead_model") or os.environ.get("LOOM_SHUTTLE_LEAD_MODEL") or "lead (model unknown)"}
        if hook:
            at = (hook.get("agent_type") or "").removeprefix("shuttle-")
            c["hook"] = hook
            if at and not tok:
                # a sub-agent without its token: it may read (and log findings) as itself; anything else is refused in call()
                c.update(who=at, no_token=True, model=(sess.get("agents") or {}).get(f"shuttle-{at}") or c.get("model"))
                c["mismatch"] = f"a sub-agent ({at}) called without its owner token: pass `owner`"
            elif tok and not at:
                c["mismatch"] = "an owner token was passed from the lead's own thread: only the sub-agent it was given to may use it"
            elif tok and at and at != c["who"]:
                c["mismatch"] = f"token {tok} belongs to the {c['who']}, not the {at}"
        return c

    # ---------------------------------------------------------------- one call
    def call(self, name: str, args: dict, use_id: str | None = None) -> tuple[dict, list]:
        """(result, images). Never raises. `use_id`: the tool-use id from the request's _meta (the hook's record)."""
        from .. import ledger as L
        import jsonschema
        t0 = time.monotonic()
        args = dict(args or {})
        c = self.caller(args, use_id)
        kind, phase, _ = RL.TOOLS.get(name, ("?", None, "?"))
        images: list = []
        refusal = c.get("mismatch")
        if c.get("no_token") and (kind == "read" or name in ("lesson_status", "budget_status", "report_finding", "note")):
            refusal = None      # S1: scene authors' reads without a token were refused, wasting their turns (2026-10-08)
        if name not in self.tools:
            refusal = f"unknown tool {name}"
        static = name in STATIC or name in SELF_LOCKED
        if not static:
            self.engine.acquire()     # one engine call at a time: parallel sub-agents raced on state.json on Windows (S0, 2026-10-08)
        try:
            return self._call(name, args, c, kind, phase, images, refusal, t0)
        except Exception as e:  # noqa: BLE001
            # never raises: an engine error is the caller's answer, traced, not the end of its session (the MCP loop caught it
            # for Claude Code; the loom runner calls in process, L-435)
            try:
                self.rails.trace("tool", tool=name, who=c.get("who"), outcome="error", error=f"engine error: {type(e).__name__}: {str(e)[:300]}")
            except Exception:  # noqa: BLE001
                pass
            return {"error": f"engine error in {name}: {type(e).__name__}: {str(e)[:300]}"}, []
        finally:
            if not static:
                self.engine.release()

    def _call(self, name, args, c, kind, phase, images, refusal, t0):
        from .. import ledger as L
        import jsonschema
        if not refusal:
            refusal = self.rails.allow(name, c, args)      # the rails first: their refusal names the missing step
        if not refusal:
            try:
                jsonschema.validate(dict(args, **({"owner": c["token"]} if c.get("token") and "owner" in self.tools[name][1]["properties"] else {})),
                                    self.tools[name][1])
            except jsonschema.ValidationError as e:
                refusal = f"bad arguments for {name}: {e.message[:300]}"
        tok = L.RUNNING.set({"model": c.get("model"), "provider": "anthropic", "role": f"shuttle {c['who']}"})
        try:
            if refusal:
                res = {"refused": refusal}
            else:
                try:
                    res = self.tools[name][2](c, **args)
                except RL.Refusal as e:
                    res = {"refused": str(e)}
                except LoomError as e:
                    res = {"error": str(e)[:1500]}
                except Exception as e:  # noqa: BLE001  (a tool never takes the server down)
                    res = {"error": f"{name} failed: {type(e).__name__}: {str(e)[:600]}", "trace": traceback.format_exc()[-1200:]}
        finally:
            L.RUNNING.reset(tok)
        if isinstance(res, dict):
            for key in ("image", "images"):
                v = res.get(key)
                for f in ([v] if isinstance(v, str) else v or []):
                    if isinstance(f, str) and Path(f).exists():
                        images.append(f)
        ms = int((time.monotonic() - t0) * 1000)
        outcome = "refused" if isinstance(res.get("refused"), str) and res["refused"] else "error" if res.get("error") else "ok"
        if c.get("token"):
            self.rails.count_call(c["token"], name, res, outcome == "refused")
        self.rails.trace("tool", tool=name, who=c["who"], model=c.get("model"), token=c.get("token"), outcome=outcome, ms=ms,
                         phase=phase, accepted=res.get("accepted") if isinstance(res, dict) else None,
                         refusal=(res.get("refused") or "")[:300] if outcome == "refused" else None,
                         error=(res.get("error") or "")[:300] if outcome == "error" else None, hook=bool(c.get("hook")))
        L.log(self.p, "tool_call", node=f"shuttle:{phase or '-'}", decision=name, choice=outcome,
              by={"kind": "agent", "who": c["who"], "model": c.get("model"), "mode": "shuttle"},
              data={"call": uuid.uuid4().hex[:10], "ms": ms, "token": c.get("token"), "accepted": res.get("accepted") if isinstance(res, dict) else None,
                    "errors": len(res.get("errors") or []) if isinstance(res, dict) else 0,
                    "refusal": (res.get("refused") or "")[:200] or None})
        return res, images

    # ---------------------------------------------------------------- helpers
    def ctx(self, c: dict, role: str, beat: str | None = None, target: Path | None = None, extra: dict | None = None):
        from ..agents import tools as T
        key = (c.get("token") or "lead", beat)
        with self.lock:
            st = self.states.setdefault(key, {})
        return T.ToolContext(project=self.p, role=role, stage="shuttle", beat=beat, target=target, extra=dict(extra or {}), state=st)

    def relay(self, _tool: str, _c: dict, _role: str = "lead", **args):
        """A Relay tool function for this caller. The parameters are underscored: a tool argument called `name`
        (get_api_section's) collided with them in S1 (2026-10-08)."""
        from ..agents import tools as T
        ctx = self.ctx(_c, _role)
        return T.TOOLS[_tool].fn(ctx, **args)

    def progress(self, pid: str):
        try:
            self.rails.progress(pid)
        except Exception:  # noqa: BLE001
            pass

    def scene_ctx(self, c: dict, tool: str, args: dict):
        from ..agents import tools as T
        t = self.rails.load()["tokens"][c["token"]]
        rel = self.rails.target_of(tool, t, args)
        beat = args.get("beat") or (t["beats"][0] if len(t.get("beats") or []) == 1 else None)
        sb = read_json(self.p.path("plan/storyboard.json"), {}) or {}
        sc = next((s for s in sb.get("scenes") or [] if s.get("beat") == beat), {}) or {}
        extra = {"require_snapshot": True, "scene": sc, "kind": sc.get("kind")}
        role = "clip" if sc.get("kind") in T.CLIP_FILE else "scene"
        return self.ctx(c, role, beat=beat, target=self.p.path(rel), extra=extra)

    def scenes_complete(self, accepted: Path | None = None):
        """After an accepted beat: remember that file as accepted; when every beat file is accepted as it is on disk (a
        draft a snapshot wrote is not), run the scenes gate (P8)."""
        from .. import flow
        if accepted is not None:
            self.rails.mark_file(Path(accepted).relative_to(self.p.root).as_posix())
        if self.rails.files_missing():
            return None
        E, W = flow.accept_scenes(self.p)
        if not E:
            self.progress("P8")
        return {"scenes_gate": "pass" if not E else "fail", "errors": E[:20]}

    # ---------------------------------------------------------------- state tools
    def t_lesson_status(self, c):
        s = self.rails.status()
        st = self.rails.load()
        toks = {k: {x: v[x] for x in ("agent", "beats", "files", "status", "calls")} for k, v in st["tokens"].items() if v["status"] == "open"}
        notes = self.p.path("logs/shuttle/notes.md")
        return {"lesson": self.p.id, "topic": self.p.cfg.get("topic"), "mode": self.p.mode, "request": self.p.request, "current": s["current"],
                "phases": [{k: r[k] for k in ("phase", "name", "status")} | ({"missing": r["missing"][:4]} if r["missing"] else {}) for r in s["phases"]],
                "waiting": s["waiting"], "stop": s["stop"], "open_tokens": toks, "reopens": RL.Rails.reopen_counts(st),
                "beats_to_verify": [f"{b} ({why}): the next check decides; rewrite only if it shows an error"
                                    for _, why, b in self.rails.files_to_verify(st)],
                "budget": {k: v for k, v in self.rails.budget_status().items() if k in ("left", "used_pct")},
                "notes": "read_artifact('notes')" if notes.exists() else "no notes yet: keep logs/shuttle/notes.md with note(kind='notes')"}

    def t_budget_status(self, c):
        return self.rails.budget_status()

    def t_new_lesson(self, c, **kw):
        return {"refused": f"this server serves lesson {self.p.id}, which exists; a new lesson starts with `py -m loom new` and its own run"}

    def t_reopen(self, c, phase: str, reason: str, beats: list | None = None):
        e = self.rails.reopen(phase, reason, by=c["who"], beats=beats)
        fix = "patch_storyboard" if phase == "P5" else "patch_script" if phase == "P4" else "redo it"
        out = {"reopened": phase, "beats": e["beats"], "stale": e["stale"], "approvals_voided": e["approvals_voided"],
               "tokens_revoked": e["tokens_revoked"], "versions_kept": e["versions"], "later_phases": e["later"],
               "next": (f"{fix} for {', '.join(e['beats'])} only" if e["beats"] else f"redo {phase}")
               + "; then lesson_status shows which later phase, if any, needs work because something it depends on changed"}
        win = self.window()
        if win and RL.idx(phase) < RL.idx(win[0]):
            # one session per phase (D-148): an earlier phase's work is done in its own session, with its own tools
            out["next"] = (f"END THIS SESSION NOW: write the handoff with note(kind='notes', text=...): what to change in {phase}"
                           + (f" ({', '.join(e['beats'])})" if e["beats"] else "") + ", why, and what you saw; then a two-line summary. "
                           f"A {phase} session starts next from your notes, with {phase}'s tools ({fix}).")
        return out

    def t_accept_phase(self, c, phase: str, beats: list | None = None, why: str | None = None):
        """Re-run a phase's own gates on what is on disk (after a reopen whose work still holds, or when nothing is left
        to write, e.g. a lesson with no bespoke beats). P8: beat files whose storyboard scene or kit parts changed are
        taken only when their beats are named, with `why`."""
        from .. import flow
        if phase not in RL.IDS:
            return {"refused": f"no phase {phase}"}
        s = self.rails.status()
        behind = [r for r in s["phases"][:RL.idx(phase)] if r["status"] != "accepted"]
        if behind:
            return {"refused": f"{behind[0]['phase']} is not accepted: " + "; ".join(behind[0]["missing"][:2])}
        stages = {"P1": ["brief"], "P3": ["pedagogy"], "P4": ["persona", "script"], "P5": ["storyboard"], "P10": ["review"]}.get(phase, [])
        errs = []
        for stg in stages:
            if self.p.path(flow.BY_NAME[stg].out).exists():
                E, _ = flow.accept(self.p, stg)
                errs += E[:10]
        if phase == "P4" and not errs and (self.p.stage_info("allocate") or {}).get("status") != "done":
            flow.run_code(self.p, "allocate")
        if phase == "P2" and self.p.mode == "source" and (self.p.stage_info("ingest") or {}).get("status") != "done":
            flow.run_code(self.p, "ingest")
        took = None
        if phase == "P8":
            if not flow.scenes_needed(self.p):
                flow.mark_done(self.p, "scenes", passed=True)
            else:
                E, _ = flow.accept_scenes(self.p)
                errs += E[:10]
                if not E:     # the beat files on disk, as they are; one whose inputs changed only when named
                    if beats and not (why or "").strip():
                        return {"refused": "naming beats whose inputs changed takes their files as they are: say why (it is logged)"}
                    took = self.rails.take_files(beats=beats, why=why, by=c["who"])
        ok = self.rails.progress(phase)
        miss = self.rails.conditions(phase)
        out = {"phase": phase, "accepted": ok, "errors": errs, "missing": miss}
        if took is not None:
            out.update(files_taken=len(took["taken"]), files_needing_work=took["need_work"])
        return out

    # ---------------------------------------------------------------- read tools
    def t_get_world_pack(self, c, id: str | None = None):
        d = ENGINE_ROOT / "packs" / "worlds"
        have = sorted(p.stem for p in d.glob("*.json"))
        if not id:
            return {"world_packs": have, "note": "get_world_pack(id) for one pack"}
        f = d / f"{id}.json"
        if not f.exists():
            return {"error": f"no world pack '{id}'", "have": have}
        return read_json(f)

    ARTIFACTS = {"brief": "plan/brief.json", "knowledge": "plan/knowledge.json", "teaching_plan": "plan/teaching_plan.json",
                 "persona": "plan/persona.json", "script": "plan/script.json", "allocation": "plan/allocation.json", "outline": "plan/outline.json",
                 "storyboard": "plan/storyboard.json", "timings": "audio/timings.json", "review": "qa/review.json", "report": "qa/report.json",
                 "defects": "qa/defects.json", "notes": "logs/shuttle/notes.md", "kit": "scenes/_kit.js", "kit_draft": "logs/shuttle/kit_draft.js", "kit_api": "logs/kit_api.md",
                 "skeptic": "qa/skeptic.json", "design_seed": "plan/design_seed.json"}

    def t_read_artifact(self, c, name: str):
        """One of the lesson's files, whole (capped): a plan artifact, the report, the notes, the kit, scene:<beat>,
        brief:<token> (a delegation brief), approval:<kind>."""
        if name == "genre":
            # the kind of video as the engine reads it (D-191: the request's, or with "auto" the brief's or the topic's)
            from ..genre import resolve as _kind, PROFILES as _KINDS
            g, why = _kind(self.p)
            f = ENGINE_ROOT / "packs" / "genres" / f"{g}.md"
            if not f.exists():
                return {"error": f"no genre craft file packs/genres/{g}.md", "have": sorted(x.stem for x in (ENGINE_ROOT / "packs/genres").glob("*.md"))}
            return {"file": f"packs/genres/{g}.md", "genre": g, "why": why, "profile": {k: v for k, v in _KINDS[g].items() if k != "lead"},
                    "lead_skills": _KINDS[g]["lead"], "text": f.read_text(encoding="utf-8")[:MAX_TEXT]}
        if name == "kit_preview":
            kp = self.rails.load().get("kit_preview") or {}
            if not kp.get("image") or not Path(kp["image"]).exists():
                return {"error": "no kit preview yet (the kit-builder draws one with kit_preview)"}
            self._looked(c, "kit_preview")
            return {"image": kp["image"], "errors": kp.get("errors"), "at": kp.get("at"), "matches_kit_on_disk":
                    kp.get("hash") == self.rails.file_hash("scenes/_kit.js")}
        if name.startswith("scene:"):
            b = name.split(":", 1)[1]
            sb = read_json(self.p.path("plan/storyboard.json"), {}) or {}
            sc = next((s for s in sb.get("scenes") or [] if s.get("beat") == b), None)
            rel = f"scenes/{(sc or {}).get('scene') or b}.js"
        elif name.startswith("brief:"):
            return self._read_brief(c, name.split(":", 1)[1])
        elif name.startswith("approval:"):
            k = name.split(":", 1)[1]
            rel = f"qa/approvals/{k}.json" if self.p.path(f"qa/approvals/{k}.json").exists() else f"qa/approvals/{k}.md"
        else:
            rel = self.ARTIFACTS.get(name)
        if not rel:
            return {"error": f"no artifact '{name}'", "have": sorted(self.ARTIFACTS) + ["scene:<beat>", "brief:<token>", "approval:<kind>"]}
        f = self.p.path(rel)
        if not f.exists():
            return {"error": f"{rel} does not exist yet"}
        text = f.read_text(encoding="utf-8", errors="replace")
        if name == "report":
            d = json.loads(text)
            return {"file": rel, "errors": (d.get("errors") or [])[:60], "warnings": (d.get("warnings") or [])[:40], "n_errors": len(d.get("errors") or [])}
        return {"file": rel, "text": text[:MAX_TEXT] + ("\n...[cut]" if len(text) > MAX_TEXT else "")}

    def _read_brief(self, c, ref: str):
        """brief:<token> (part 1) or brief:<token>#<k>. A sub-agent reads its own brief; the lead reads any."""
        tok, _, part = ref.partition("#")
        t = self.rails.load()["tokens"].get(tok)
        if not t:
            return {"error": f"no owner token {tok}"}
        if c.get("token") and c["token"] != tok:
            return {"refused": f"brief:{tok} is another sub-agent's; yours is brief:{c['token']}"}
        if c["who"] != "lead" and not c.get("token") and c["who"] != t.get("agent"):
            return {"refused": f"brief:{tok} is the {t.get('agent')}'s"}
        f = self.p.path(t.get("brief") or "-")
        if not f.exists():
            return {"error": f"the brief of {tok} is missing ({t.get('brief')})"}
        parts = self._brief_parts(f.read_text(encoding="utf-8", errors="replace"))
        try:
            k = int(part or 1)
        except ValueError:
            return {"error": f"brief:{tok}#<part>, a number from 1 to {len(parts)}"}
        if not 1 <= k <= len(parts):
            return {"error": f"brief:{tok} has {len(parts)} part{'s' if len(parts) > 1 else ''}"}
        own = c.get("token") == tok or (not c.get("token") and c["who"] == t.get("agent"))
        asked = k
        if own and k > 1:
            # the parts come in order: an author that asked for part 2 first (gps-position: 33 sub-agents took their prompt
            # for part 1) gets the first part it has not read, and its later write is never refused for it (L-411)
            done = set(int(x) for x in t.get("brief_read") or [])
            k = next((j for j in range(1, k) if j not in done), k)
        if own:
            self.rails.brief_read(tok, k, len(parts))          # the sub-agent's own read (the lead's is not counted)
        out = {"file": t["brief"], "part": f"{k} of {len(parts)}", "text": parts[k - 1]}
        if k != asked:
            out["note"] = f"you asked for part {asked}; part {k} comes first and is here. Read part {asked} next"
        if k < len(parts):
            out["next"] = f"read_artifact('brief:{tok}#{k + 1}') for the rest"
        return out

    # ---------------------------------------------------------------- write tools (the lead's)
    def t_submit_outline(self, c, artifact: dict):
        from ..cli import _default_seed
        r = self.relay("submit_outline", c, artifact=artifact)
        if r.get("accepted"):
            _default_seed(self.p)
            self.rails.update(lambda st: st.__setitem__("outline", {"hash": self.rails.file_hash("plan/outline.json"),
                                                                    "script": self.rails.file_hash("plan/script.json"), "at": RL.now()}))
        return r

    def t_submit_storyboard(self, c, artifact: dict):
        if any("submit_outline" in m for m in self.rails.conditions("P5")):
            return {"refused": "submit_outline first: the storyboard follows an accepted outline of the current script"}
        r = self.relay("submit_storyboard", c, artifact=artifact)
        if r.get("accepted"):
            self.progress("P5")
        return r

    def t_patch_storyboard(self, c, **kw):
        r = self.relay("patch_storyboard", c, **kw)
        if r.get("accepted"):
            self.progress("P5")
        return r

    def _after_script(self, r):
        from .. import flow
        if r.get("accepted"):
            flow.run_code(self.p, "allocate")
            self.progress("P4")
            r["allocation"] = "plan/allocation.json written (code)"
        return r

    def t_submit_script(self, c, artifact: dict):
        return self._after_script(self.relay("submit_script", c, artifact=artifact))

    def t_patch_script(self, c, beats: list):
        return self._after_script(self.relay("patch_script", c, beats=beats))

    def t_choose_persona(self, c, pick: str, why: str):
        from .. import flow
        have = sorted(p.stem for p in (ENGINE_ROOT / "packs/personas").glob("*.json"))
        if pick not in have:
            return {"accepted": False, "errors": [f"pick one of {have}"]}
        write_json(self.p.path("plan/persona.json"), read_json(ENGINE_ROOT / "packs/personas" / f"{pick}.json"))
        E, W = flow.accept(self.p, "persona")
        from .. import ledger as L
        L.log(self.p, "decision", node="persona", decision="persona_pick", choice=pick, by={"kind": "agent", "who": c["who"], "model": c.get("model"),
              "mode": "shuttle"}, why=why[:400])
        return {"accepted": not E, "errors": E, "warnings": W}

    def t_submit_brief(self, c, artifact: dict):
        r = self.relay("submit_brief", c, artifact=artifact)
        if r.get("accepted"):
            self.progress("P1")
        return r

    def t_submit_teaching_plan(self, c, artifact: dict):
        r = self.relay("submit_teaching_plan", c, artifact=artifact)
        if r.get("accepted"):
            self.progress("P3")
        return r

    def t_submit_review(self, c, artifact: dict):
        if self.role() == "fix":
            return {"refused": "the fix round does not submit the review: the judge does, next session"}
        if (self.rails.load().get("fix_plan") or {}).get("status") == "open":
            return {"refused": "a fix plan is still open: the fix round runs it first, then the judge reviews"}
        r = self.relay("submit_review", c, artifact=artifact)
        if r.get("accepted"):
            self.progress("P10")
        return r

    # ---------------------------------------------------------------- write tools (sub-agents, with tokens)
    def t_submit_knowledge(self, c, artifact: dict):
        return self.relay("submit_knowledge", c, _role=c["who"], artifact=artifact)

    def t_lab_snapshot(self, c, times: list, source: str | None = None, beat: str | None = None, edits: list | None = None):
        """Only the draft and the compose hold the engine lock; the picture and the probe run on a private copy of the
        build, so scene authors no longer queue behind each other (the Opus run: 102 snapshots, about 50 s each, one
        at a time). `edits` change the current draft (the beat's file) instead of sending it whole (L-377)."""
        from ..agents import tools as T
        with self.engine:
            ctx = self.scene_ctx(c, "lab_snapshot", {"beat": beat})
            if edits:
                source, err = self._edited(source, edits, ctx.target)
                if err:
                    return {"error": err}
            with T._lock:
                prep = T.lab_snapshot_prepare(ctx, times=times, source=source)
        if prep.get("error"):
            return prep
        r = T.lab_snapshot_finish(ctx, prep)
        ctx.state.pop("images", None)
        return r

    def t_submit_scene(self, c, artifact: dict, beat: str | None = None):
        from ..agents import tools as T
        ctx = self.scene_ctx(c, "submit_scene", {"beat": beat})
        r = T.t_submit_scene(ctx, artifact=artifact)
        if r.get("accepted"):
            g = self.scenes_complete(ctx.target)
            if g:
                r["scenes_gate"] = g
        return r

    @staticmethod
    def _edited(source: str | None, edits: list, base_file) -> tuple:
        """(the whole new draft, None) from `edits` on the current draft, or (None, why): Relay's apply_edits, shared
        since R-46 so both pipelines edit drafts the same way (L-377)."""
        from ..agents.tools import apply_edits
        return apply_edits(source, edits, base_file)

    def t_render_clip(self, c, source: str | None = None, times: list | None = None, beat: str | None = None, edits: list | None = None):
        from ..agents import tools as T
        ctx = self.scene_ctx(c, "render_clip", {"beat": beat})
        if edits:
            source, err = self._edited(source, edits, ctx.target)
            if err:
                return {"error": err}
        if source is None:
            return {"error": "render_clip needs `source` (the whole clip file) or `edits` to your last one"}
        r = T.t_render_clip(ctx, source=source, times=times or [0.5])
        ctx.state.pop("images", None)
        return r

    def t_submit_clip(self, c, artifact: dict, beat: str | None = None):
        from ..agents import tools as T
        ctx = self.scene_ctx(c, "submit_clip", {"beat": beat})
        r = T.t_submit_clip(ctx, artifact=artifact)
        if r.get("accepted"):
            g = self.scenes_complete(ctx.target)
            if g:
                r["scenes_gate"] = g
        return r

    def t_set_device(self, c, beat: str, device: str | None = None, screen: dict | None = None, mood: str | None = None,
                     why: str | None = None):
        """D-140 in Shuttle: swap a device beat's device, screen or mood. Before the storyboard is accepted it is a plain
        storyboard edit; after, it is a reopen of P5 for that one beat (its own cap, no approval voided) followed by the
        storyboard gate, so only that beat and what depends on it are redone (D-144)."""
        from .. import devices as DV
        from .. import flow
        if not (why or "").strip():
            return {"refused": "say why the device changes (it is logged)", "choices": DV.choices()}
        cur = self.rails.current()
        if cur is not None and RL.idx(cur) < RL.idx("P5"):
            return {"refused": f"the lesson is in {cur}: the storyboard (P5) is where device beats are planned"}
        reopened = None
        if self.rails.status()["phases"][RL.idx("P5")]["status"] == "accepted":
            sb = read_json(self.p.path("plan/storyboard.json"), {}) or {}
            sc = next((s for s in sb.get("scenes") or [] if s.get("beat") == beat), None)
            if not sc or sc.get("kind") != "three" or (sc.get("three") or {}).get("preset") != DV.PRESET:
                return {"error": f"{beat} is not a device beat (kind three with preset {DV.PRESET})", "choices": DV.choices()}
            reopened = self.rails.reopen("P5", f"set_device on {beat}: {why}", by=c["who"], beats=[beat])
        try:
            r = DV.swap(self.p, beat, device=device, screen=screen, mood=mood, by={"kind": "agent", "who": c["who"], "model": c.get("model")},
                        why=why)
        except Exception as e:  # noqa: BLE001
            return {"error": str(e)[:600], "choices": DV.choices(), "reopened_for": [beat] if reopened else None,
                    "next": "fix the params and call set_device again, or patch_storyboard this beat"}
        E, W = flow.accept(self.p, "storyboard")
        if not E:
            self.progress("P5")
        return dict(r, storyboard_gate="pass" if not E else "fail", errors=E[:10], reopened_for=[beat] if reopened else None,
                    next="lesson_status shows what depends on this beat (narration timing, the animatic, compose and check, its "
                         "contact sheet for the critic); nothing else is redone")

    def t_pilot_check(self, c):
        """P8, before the other beats (L-319): the first continue join of a lesson with a kit, composed with the beats
        written so far and checked on a private copy of the build: the runtime probe and HyperFrames' layout pass, both
        kept to the two pilot beats. It passes when they show no error; the rest of the beats are delegated after."""
        import shutil
        from .. import flow
        from ..qa import IGNORE_HF, checker_mode, hf_check_build, lc_lines, private_build, probe_build
        beats = self.rails.pilot_beats()
        if not beats:
            return {"pilot": None, "pass": True, "note": "no pilot needed: no lesson kit, or no continue join into a beat someone writes"}
        acc = self.rails.load().get("files") or {}
        files = [f for f in self.rails.needed_files() if self.rails.scene_of_file(f)[0] in beats]
        probs = {f: self.rails.file_problem(f, acc) for f in files}
        # a pilot beat waiting only on verification (its kit part changed after it was accepted) is what this check is for;
        # the measured run's lead was told to "submit the pilot beats first" after a kit fix (2026-10-09)
        open_ = [f"{f} ({pr[1]})" for f, pr in probs.items() if pr and pr[0] != "verify"]
        if open_:
            return {"refused": f"the pilot beats need their authors first ({', '.join(open_)}); then pilot_check"}
        from ..qa import snapshot_sheet_build
        with self.engine:
            flow.run_code(self.p, "compose", manim_quality="draft", strict=False, mix=False)
            priv = private_build(self.p)
        tm = {b["id"]: b for b in (read_json(self.p.path("audio/timings.json"), {}) or {}).get("beats") or []}
        spans = [(float(tm[b]["start"]), float(tm[b]["end"])) for b in beats if b in tm]
        image = None
        try:
            from ..layout_guard import guard_build
            guard_build(priv, beats=beats, project=self.p)   # D-169: the engine's moves before the pilot is judged; off, nothing
            pr = probe_build(priv, priv.parent / "probe.json")
            # overlap and contrast by the lesson's checker (qa.checker_mode): HyperFrames' check, Loom's own audits that
            # the probe just ran (seconds), or both with HyperFrames deciding and Loom's listed beside it
            mode = checker_mode(self.p)
            hf = hf_check_build(priv, 24) if mode in ("hyperframes", "shadow") else {}
            errs = [f"{e.get('beat') or ''} {e.get('code')}: {str(e.get('msg'))[:200]}".strip() for e in pr.get("errors") or []
                    if e.get("beat") in beats or any(str(e.get("msg", "")).startswith(f"{b}:") for b in beats)]
            at = []
            for sec in ("lint", "runtime", "layout", "contrast", "motion"):
                for f in (hf.get(sec) or {}).get("findings", []):
                    t = f.get("time")
                    if f.get("code") in IGNORE_HF or f.get("severity") != "error" or not isinstance(t, (int, float)):
                        continue
                    if any(a <= t < z for a, z in spans):
                        errs.append(f"hf {sec} {f.get('code')} @ {t}: {(f.get('message') or '')[:160]}")
                        at.append(round(float(t), 2))
            shadow = []
            if mode in ("loom", "shadow"):
                le_, lw_ = lc_lines(pr)
                # a later pilot beat drawing again what the earlier still shows is the kit not carrying its parts (L-319):
                # an error here, while the kit can still change; a warning in the full check (D-154)
                for ln in le_ + [w for w in lw_ if " text_redrawn " in w and " draws again " in w]:
                    t = float(ln.split(" @ ", 1)[1].split(":", 1)[0])
                    if " audit_failed " in ln or any(a <= t < z for a, z in spans):
                        (errs if mode == "loom" else shadow).append(ln[:260])
                        if mode == "loom":
                            at.append(round(t, 2))
            # the picture comes with the verdict: the lead judges the pilot by its frames (look tools open in P8 too, but
            # one call is enough): the failing moments first, else each pilot beat's middle (2026-10-09, the measured run)
            times = sorted(set(at))[:3] or [round((a + z) / 2, 2) for a, z in spans]
            times += [round((a + z) / 2, 2) for a, z in spans if len(times) < 4 and round((a + z) / 2, 2) not in times]
            try:
                image = snapshot_sheet_build(priv, times[:4], self.p.path("qa/pilot_check.jpg"))
            except Exception:  # noqa: BLE001  (no browser picture: the verdict still stands, said in the reply)
                image = None
        finally:
            shutil.rmtree(priv.parent, ignore_errors=True)
        ok = not errs
        rec = {"beats": beats, "pass": ok, "errors": errs[:30], "checker": mode, **({"shadow": shadow[:30]} if shadow else {}),
               "kit": self.rails.file_hash("scenes/_kit.js"), "at": RL.now()}
        self.rails.update(lambda st: st.__setitem__("pilot", rec))
        if ok:     # the pilot verified its beats against the current kit: they stand as they are
            for f, pr in probs.items():
                if pr and pr[0] == "verify":
                    self.rails.mark_file(f)
        self.rails.trace("pilot_check", beats=beats, ok=ok, errors=len(errs))
        if ok:
            self.progress("P8")
        return {"pilot": beats, "pass": ok, "errors": errs[:30], **({"image": image, "frames_at": times[:4]} if image else
                                                                   {"image_note": "no picture this time (no browser frame)"}),
                "next": "delegate the other beats now (in parallel)" if ok else
                        "fix what the errors name before the other beats are written: in the kit (reopen('P7', ...) and a kit-builder) or in "
                        "the pilot beats (a fixer); then pilot_check again"}

    KIT_DRAFT = "logs/shuttle/kit_draft.js"

    def t_kit_preview(self, c, source: str | None = None, edits: list | None = None):
        """The kit preview (the 'kit lab strip' of design section 3.1): the draft kit, every declared part drawn in a
        grid and stepped through its states, rendered by the lab in the lesson's style. submit_kit accepts only a kit
        whose exact source was previewed. `edits` change the last previewed draft (else the kit on disk) instead of
        sending the whole kit again (L-377); the previewed draft is kept in logs/shuttle/kit_draft.js."""
        from . import kitpreview
        if edits:
            base = self.p.path(self.KIT_DRAFT) if self.p.path(self.KIT_DRAFT).exists() else self.p.path("scenes/_kit.js")
            source, err = self._edited(source, edits, base)
            if err:
                return {"error": err}
        if not source:
            return {"error": "kit_preview needs `source` (the whole kit) or `edits` to your last previewed draft"}
        out = kitpreview.preview(self.p, source)
        if out.get("image"):
            h = RL.sha(source.rstrip() + "\n")
            self.p.path(self.KIT_DRAFT).parent.mkdir(parents=True, exist_ok=True)
            self.p.path(self.KIT_DRAFT).write_text(source.rstrip() + "\n", encoding="utf-8")
            self.rails.update(lambda st: st.__setitem__("kit_preview", {"hash": h, "image": out["image"], "at": RL.now(), "errors": out.get("errors")}))
        return out

    def t_submit_kit(self, c, artifact: dict):
        from ..agents import tools as T
        artifact = dict(artifact or {})
        if not artifact.get("source") and self.p.path(self.KIT_DRAFT).exists():
            # leave `source` out to submit the draft the last preview drew (no need to type the whole kit again)
            artifact["source"] = self.p.path(self.KIT_DRAFT).read_text(encoding="utf-8")
        src = artifact.get("source") or ""
        if (self.rails.load().get("kit_preview") or {}).get("hash") != RL.sha(src.rstrip() + "\n"):
            return {"accepted": False, "errors": ["look first: call kit_preview(source) with this exact source and read the strip; "
                                                  "a kit nobody looked at is not submitted"], "next": "kit_preview(source)"}
        r = T.t_submit_kit(self.ctx(c, "kit", target=self.p.path("scenes/_kit.js")), artifact=artifact)
        if r.get("accepted"):
            self.progress("P7")
        return r

    def t_report_finding(self, c, finding: dict):
        return self.relay("report_finding", c, _role=c["who"], finding=finding)

    def t_note(self, c, text: str, kind: str = "finding", beat: str | None = None):
        from .. import ledger as L
        if kind == "notes":
            f = self.p.path("logs/shuttle/notes.md")
            f.parent.mkdir(parents=True, exist_ok=True)
            with open(f, "a", encoding="utf-8") as fh:
                fh.write(text.rstrip() + "\n")
            return {"written": "logs/shuttle/notes.md", "note": "the next phase session starts from this file"}
        r = L.log(self.p, "note", node=f"shuttle:{beat}" if beat else "shuttle", decision=kind, choice=text[:2000],
                  by={"kind": "agent", "who": c["who"], "model": c.get("model"), "mode": "shuttle"})
        return {"logged": bool(r)}

    # ---------------------------------------------------------------- build tools
    def t_narrate(self, c):
        from .. import flow
        row = {r["stage"]: r for r in flow.status(self.p)}.get("narrate", {})
        if row.get("status") != "done":
            flow.run_code(self.p, "narrate")
        tm = read_json(self.p.path("audio/timings.json"), {}) or {}
        self.progress("P6")
        return {"narrated": True, "reused": row.get("status") == "done", "duration_s": tm.get("duration"), "beats": len(tm.get("beats") or []),
                "requested_s": float(self.p.request.get("length_min") or 0) * 60}

    def t_animatic(self, c):
        from PIL import Image
        from .. import flow
        from ..story import animatic
        rep = animatic(self.p, use_frames=False)
        panels = sorted(self.p.path("qa/animatic").glob("*.png"))
        sheets = []
        for k in range(0, len(panels), 9):
            part = panels[k:k + 9]
            sheet = Image.new("RGB", (3 * 486 + 6, ((len(part) + 2) // 3) * 276 + 6), (17, 17, 17))
            for i, f in enumerate(part):
                sheet.paste(Image.open(f).convert("RGB").resize((480, 270)), (6 + (i % 3) * 486, 6 + (i // 3) * 276))
            out = self.p.path(f"qa/shuttle_animatic_{k // 9 + 1}.jpg")
            sheet.save(out, quality=82)
            sheets.append(str(out))
        self.rails.update(lambda st: st.__setitem__("animatic", {"plan": flow.plan_hashes(self.p), "sheets": len(sheets), "at": RL.now()}))
        self.rails.update(lambda st: st["looked"].append({"what": "animatic", "sheets": len(sheets), "at": RL.now(), "by": c["who"]}))
        return {"images": sheets, "beats": len(panels), "duration": rep.get("duration"), "timed_by": rep.get("timed_by"),
                "story_notes": rep.get("warnings") or [], "note": "nine panels to an image, in beat order", **self._sent(sheets, "overview")}

    def t_compose(self, c):
        from .. import flow
        flow.run_code(self.p, "compose")
        return {"composed": True, "build": "build/index.html"}

    def t_check(self, c):
        """Compose, then check (D-148: one call, not two; the measured run's lead spent a turn on compose before each of its
        four checks). The check never runs on a stale build."""
        from .. import flow
        from ..agents import router as RT
        try:
            flow.run_code(self.p, "compose")
        except LoomError as e:
            return {"passed": False, "composed": False, "error_summary": str(e)[:600],
                    "next": "the lesson does not compose: lesson_status names the missing or failing beat files"}
        try:
            flow.run_code(self.p, "check")
            ver = self.rails.refresh_verified(set())        # beats waiting on a kit change: no error anywhere, all stand
            self.progress("P9")
            rep = read_json(self.p.path("qa/report.json"), {}) or {}
            return {"passed": True, "warnings": len(rep.get("warnings") or []), "sheets": "qa/sheets/<beat>.jpg (contact_sheet)",
                    **({"verified_beat_files": ver["verified"]} if ver["verified"] else {})}
        except LoomError as e:
            D = RT.route(self.p, critic=None, reported=None)
            write_json(self.p.path("qa/defects.json"), {"source": "check", "routed": D})
            owned = [o for o in RT.OWNERS if D.get(o)]
            if owned == ["engine"]:
                # only errors no agent can fix (L-421: https-private-shuttle-api's lead sent b17's "beats not separable"
                # foreign pixels to a fixer about 16 times, $3.5 and 50 min): the run stops and a person decides
                lines = [f"{b}: {d.get('code')}: {str(d.get('detail'))[:160]}" for b, v in D["engine"].items() for d in v][:6]
                why = "the check fails only on errors no agent owns: " + "; ".join(lines)
                self.rails.update(lambda st: st.__setitem__("stop", {"reason": "engine_defect", "detail": why[:900], "at": RL.now()}))
                self.rails.trace("engine_defect_stop", errors=lines)
                return {"passed": False, "error_summary": str(e)[:300], "engine_only": lines,
                        "next": "END THIS SESSION now with a handoff note: these errors have no agent owner, so no fixer can clear "
                                "them; the run stops and a person decides (qa/defects.json). Do not delegate fixers for them."}
            ver = self.rails.refresh_verified({b for o in RT.OWNERS for b in (D.get(o) or {})})
            return {"passed": False, "error_summary": str(e)[:300],
                    "verified_beat_files": ver["verified"], "changed_and_failing": ver["to_fix"],
                    "by_owner": {o: {b: [f"{d.get('code')}: {str(d.get('detail'))[:180]}" + (f" (x{d['count']})" if d.get("count", 1) > 1 else "")
                                         for d in v][:5] for b, v in D[o].items()}
                                 for o in RT.OWNERS if D.get(o)},
                    "next": "fix by owner: scene defects to fixers, all in ONE delegate(jobs=[...]) call (a join's two beats to one "
                            "fixer), then every Agent in one turn, then collect(token='all') and check again (it composes); kit "
                            "ones (raised inside a kit part) to the kit builder, storyboard ones after reopen('P5', reason, beats), "
                            "engine ones are for a person (qa/defects.json)"}

    def t_render(self, c, quality: str = "high"):
        from .. import flow
        if quality not in ("high", "draft", "standard"):
            return {"refused": "quality: high, standard or draft"}
        flow.run_code(self.p, "render", quality=quality)       # needs a passing check; never forced by an agent
        outs = sorted(str(f.relative_to(self.p.root).as_posix()) for f in self.p.path("renders").glob("*.mp4"))
        return {"rendered": outs, "verify": read_json(self.p.path("qa/render_verify.json"), {}) or None,
                "next": "request_approval('final', summary, files) so a person watches it"}

    # ---------------------------------------------------------------- look tools
    def _looked(self, c, what, **kw):
        self.rails.update(lambda st: st["looked"].append(dict(kw, what=what, at=RL.now(), by=c["who"])))

    @staticmethod
    def _sent(files: list, detail: str) -> dict:
        """What the pictures cost as sent: pixels and the model's own estimate (pixels / 750 tokens)."""
        from PIL import Image
        px = 0
        for f in files:
            try:
                with Image.open(f) as im:
                    w, h = picture_size(im.width, im.height, detail)
                px += w * h
            except Exception:  # noqa: BLE001
                pass
        return {"detail": detail, "about_tokens": int(px / 750)}

    def t_contact_sheet(self, c, beats: list, detail: str = "overview"):
        """Up to 9 beats' sheets at `overview` (a sweep: composition, a blank or broken frame, a big overlap), or up to 3 at
        `full` (a close look: words, small parts, a defect the check or the critic named)."""
        from PIL import Image
        cap = FULL_BEATS if detail == "full" else 9
        files = [self.p.path(f"qa/sheets/{b}.jpg") for b in beats[:cap]]
        have = [f for f in files if f.exists()]
        if not have:
            return {"error": "no contact sheets for these beats: run check first (it draws qa/sheets/<beat>.jpg)"}
        ims = [Image.open(f).convert("RGB") for f in have]
        w = max(i.width for i in ims)
        scale = min(1.0, 1600 / w)
        ims = [i.resize((int(i.width * scale), int(i.height * scale))) for i in ims]
        sheet = Image.new("RGB", (max(i.width for i in ims), sum(i.height + 6 for i in ims)), (17, 17, 17))
        y = 0
        for i in ims:
            sheet.paste(i, (0, y)); y += i.height + 6
        out = self.p.path(f"qa/shuttle_look_{uuid.uuid4().hex[:6]}.jpg")
        sheet.save(out, quality=82)
        sent = self._sent([out], detail)
        self._looked(c, "contact_sheet", beats=[f.stem for f in have], **sent)
        res = {"image": str(out), "beats": [f.stem for f in have], "missing": [f.stem for f in files if not f.exists()], **sent}
        if len(beats) > cap:
            res["not_shown"] = beats[cap:]
            res["note"] = f"{detail}: at most {cap} beats in one picture; ask again for the rest"
        elif detail == "overview":
            res["note"] = "overview: for words and small parts look again with detail='full' (up to 3 beats)"
        return res

    def t_frames(self, c, times: list, detail: str = "full"):
        from ..qa import snapshot_sheet
        out = snapshot_sheet(self.p, [float(t) for t in times[:4]], name=f"shuttle_frames_{uuid.uuid4().hex[:6]}")
        sent = self._sent([out], detail)
        self._looked(c, "frames", times=times[:4], **sent)
        return {"image": out, "times": times[:4], **sent}

    def t_strips(self, c, beats: str, detail: str = "overview"):
        from .. import strips as SP
        rep = SP.sheets(self.p, source="auto", beats=beats)
        files = [str(x) for x in (rep.get("sheets") or rep.get("files") or [])][:4]
        sent = self._sent(files, detail)
        self._looked(c, "strips", beats=beats, **sent)
        return {"images": files, "report": {k: v for k, v in rep.items() if k not in ("sheets", "files")}, **sent}

    # ---------------------------------------------------------------- other families
    def reviewer(self, role: str) -> str:
        from ..agents.llm import registry as R
        cfg = read_json(ENGINE_ROOT / "loom/shuttle/config.json", {}) or {}
        env = os.environ.get(f"LOOM_SHUTTLE_{role.upper()}")
        for alias in ([env] if env else []) + list((cfg.get("reviewers") or {}).get(role) or []):
            try:
                m = R.model(alias)
            except Exception:  # noqa: BLE001
                continue
            # the reviewers are the other family (design section 5): not the lead's provider (D-165: a Gemini lead gets Claude)
            if m["provider"] == (self.session().get("lead_provider") or "anthropic") and not env:
                continue
            if R.available(m):
                return alias
        raise LoomError(f"no other-family model with a key for the {role} (config: loom/shuttle/config.json; keys in .env)")

    def _budget(self):
        from ..agents.budget import Budget
        st = self.rails.load()
        left = self.rails.budget_status()["left"].get("usd")
        return Budget(left if left is not None else 1e9, ledger=self.p.path("logs/shuttle/calls.jsonl"))

    def t_skeptic_review(self, c):
        from ..agents import tools as T
        from ..agents.conductor import task_message
        from ..agents.runtime import AgentSpec, run_agent
        if (self.p.stage_info("knowledge") or {}).get("status") not in ("needs_approval", "done"):
            return {"refused": "no accepted fact sheet yet: the fact-finder submits it first"}
        alias = self.reviewer("skeptic")
        ctx = T.ToolContext(project=self.p, role="skeptic", stage="knowledge")
        r = run_agent(AgentSpec("skeptic", alias, limits={"turns": 6, "repairs": 1}), ctx, task_message(self.p, "skeptic", {}), self._budget())
        v = r.value or {}
        rec = {"hash": self.rails.knowledge_hash(), "verdict": v.get("verdict") if r.status == "accepted" else None, "model": r.model,
               "status": r.status, "findings": len(v.get("findings") or []), "usd": r.cost_usd, "at": RL.now()}
        self.rails.update(lambda st: st["skeptic"].append(rec))
        if r.status != "accepted":
            return {"error": f"the skeptic ({alias}) did not finish: {r.status} {r.note}", "usd": r.cost_usd}
        return {"verdict": v.get("verdict"), "findings": v.get("findings") or [], "model": r.model, "usd": r.cost_usd,
                "next": ("revise: delegate the fact-finder again with these findings, then skeptic_review once more"
                         if v.get("verdict") == "revise" else "request_approval('facts', summary, ['plan/knowledge.json'])")}

    def t_critic_review(self, c, beats: list | None = None):
        if self.role() == "fix":
            return {"refused": "the fix round does not run the critic: finish the fixes, fixes_done(summary), end the session; the judge "
                               "re-runs critic_review"}
        return self._critic_review(c, beats)

    def _critic_review(self, c, beats: list | None = None):
        """The other-family critic. The first pass judges every sheet. A later pass judges only the beats whose sheet
        changed since the last pass plus those with a blocker or major still open, re-checks the earlier findings on
        them first, and is told what the lead accepted (with its reason). Unchanged beats keep their record. The Opus
        run's five passes each judged everything and each found a partly new set (L-322); frames are a pure function of
        time, so an unchanged sheet is an unchanged picture."""
        from ..agents import tools as T
        from ..agents.conductor import task_message
        from ..agents.runtime import AgentSpec, run_agent
        from ..qa import build_hash
        every = sorted(f for f in self.p.path("qa/sheets").glob("*.jpg") if not f.name.startswith("_"))
        if not every:
            return {"error": "no contact sheets: check draws them"}
        hashes = {f.stem: RL.sha(f.read_bytes()) for f in every}
        prev = self.rails.load().get("critic") or {}
        rv = read_json(self.p.path("qa/review.json"), {}) if self.p.path("qa/review.json").exists() else {}
        prior = [f for f in rv.get("findings") or [] if isinstance(f, dict)] if prev.get("sheets") else []
        st0 = self.rails.load()
        # a blocker the lead marked accepted is still the critic's to judge, unless a person waived its beat (L-439, L-440)
        unwaived = lambda f: f.get("severity") == "blocker" and f.get("status") == "accepted" and not self.rails.waived(f.get("beat"), st0)
        if beats:
            want = set(beats) & set(hashes)
        elif prev.get("sheets"):
            changed = {b for b, h in hashes.items() if prev["sheets"].get(b) != h}
            still = {f.get("beat") for f in prior if f.get("severity") in RL.OPEN_FINDING and f.get("status") not in RL.CLOSED}
            still |= {f.get("beat") for f in prior if unwaived(f)}     # a blocker the lead accepted is judged again (L-439)
            want = (changed | still) & set(hashes)
        else:
            want = set(hashes)
        passes = int(prev.get("passes") or 0) + 1
        if not want:
            self.rails.update(lambda st: st.__setitem__("critic", dict(prev, build=build_hash(self.p.path("build")), sheets=hashes, reviewed=[],
                                                                       passes=passes, at=RL.now())))
            return {"findings": [], "reviewed": [], "major": 0, "note": "no sheet changed since the last critic pass and no blocker or major "
                    "is open: the earlier findings stand (qa/review.json)", "next": "submit_review with every finding's status"}
        sheets = [f for f in every if f.stem in want]
        earlier = [{k: f.get(k) for k in ("beat", "severity", "problem", "status")} for f in prior
                   if f.get("beat") in want and (f.get("status") != "accepted" or unwaived(f))]
        accepted = [{k: f.get(k) for k in ("beat", "severity", "problem", "reason")} for f in prior
                    if f.get("beat") in want and f.get("status") == "accepted" and not unwaived(f)]
        alias = self.reviewer("critic")
        parts = [sheets[i:i + 40] for i in range(0, len(sheets), 40)]
        found, usd, model = [], 0.0, None
        for k, part in enumerate(parts):
            extra = {"beats": [s.stem for s in part], "part": f"{k + 1} of {len(parts)}" if len(parts) > 1 else None}
            if prev.get("sheets"):
                inp = {s.stem for s in part}
                extra.update(earlier=[f for f in earlier if f["beat"] in inp], accepted=[f for f in accepted if f["beat"] in inp])
            ctx = T.ToolContext(project=self.p, role="critic", stage="review", extra=extra)
            r = run_agent(AgentSpec("critic", alias), ctx, task_message(self.p, "critic", extra), self._budget(), images=[str(s) for s in part])
            usd += r.cost_usd
            model = r.model
            if r.status != "accepted":
                return {"error": f"the critic ({alias}) did not finish part {k + 1}: {r.status} {r.note}", "usd": usd}
            found += (r.value or {}).get("findings") or []
        # the review the lead completes: earlier findings on beats not judged now, the lead's accepted ones, and this pass
        kept = [f for f in prior if f.get("beat") not in want] + [f for f in prior if f.get("beat") in want and f.get("status") == "accepted" and not unwaived(f)]
        merged = kept + found
        if len(parts) > 1 or kept:
            write_json(self.p.path("qa/review.json"), {"verdict": "fix" if any(f.get("severity") in RL.OPEN_FINDING and f.get("status") not in RL.CLOSED
                                                                               for f in merged) else "ship", "findings": merged})
        major = [f for f in found if f.get("severity") in RL.OPEN_FINDING]
        # the beats this pass found a blocker on, and blockers kept from beats it did not judge: P10 holds on them unless waived
        blockers = sorted({f.get("beat") for f in found if f.get("severity") == "blocker"}
                          | {f.get("beat") for f in kept if f.get("severity") == "blocker" and f.get("beat") not in want})
        self.rails.update(lambda st: st.__setitem__("critic", {"build": build_hash(self.p.path("build")), "findings": len(found), "major": len(major),
                                                               "model": model, "at": RL.now(), "sheets": hashes, "reviewed": sorted(want),
                                                               "passes": passes, "blockers": blockers}))
        return {"findings": found, "major": len(major), "model": model, "usd": round(usd, 6), "reviewed": sorted(want),
                "kept_from_earlier": len(kept), "pass": passes,
                "next": "look at the sheets yourself too; fix each blocker (a fixer per beat; the critic judges it again and it closes when "
                        "the critic stops reporting it: your accepted does not close a blocker, only a person's waiver does) and fix or accept "
                        "each major, then submit_review with every finding's status (fixed or accepted, with a reason), the kept ones included"}

    # ---------------------------------------------------------------- delegation and approvals
    def engine_context(self, agent: str, beats: list) -> str:
        """The data block a sub-agent needs, built by the same code Relay's conductor uses for its workers
        (conductor.task_message: spec, narration with phrase timings, held elements, neighbours, cast, kit API, devices),
        so the lead writes the intent and never retypes the data."""
        from ..agents import tools as T
        from ..agents.conductor import task_message
        a = agent.removeprefix("shuttle-")
        if a == "fact-finder":
            extra = {}
            sk = (self.rails.load().get("skeptic") or [])
            if sk and sk[-1].get("verdict") == "revise" and self.p.path("qa/skeptic.json").exists():
                extra["skeptic"] = read_json(self.p.path("qa/skeptic.json"), {})
            return task_message(self.p, "knowledge", extra)
        if a == "kit-builder":
            return task_message(self.p, "kit", {})
        if a not in ("scene-author", "clip-author", "fixer"):
            return ""
        sb = read_json(self.p.path("plan/storyboard.json"), {}) or {}
        by = {s.get("beat"): s for s in sb.get("scenes") or []}
        tm = {b["id"]: b for b in (read_json(self.p.path("audio/timings.json"), {}) or {}).get("beats") or []}
        outline = read_json(self.p.path("plan/outline.json"), {}) if self.p.path("plan/outline.json").exists() else {}
        parts = []
        shared_done = False
        for b in beats:
            sc = by.get(b)
            if not sc or b not in tm:
                parts.append(f"(no storyboard scene or timings for {b})")
                continue
            clip = sc.get("kind") in T.CLIP_FILE
            target = T.clip_target(self.p, sc) if clip else self.p.path(f"scenes/{sc.get('scene') or b}.js")
            rel = target.relative_to(self.p.root).as_posix() if target else "-"
            # slim briefs (L-422): an author gets the beats near its own, a fixer its beat, defects and file; the sections a
            # multi-beat brief shares (film card, style, kit note) come once, with its first beat
            extra = {"scene": sc, "beat_timing": tm[b], "file": rel, "file_abs": str(target), "kind": sc.get("kind"),
                     "devices": [d for d in outline.get("devices") or [] if b in (d.get("beats") or [])], "require_snapshot": True,
                     "brief": "fix" if a == "fixer" else "author", "shared_done": shared_done}
            if a == "fixer":
                found = []
                D = read_json(self.p.path("qa/defects.json"), {}) if self.p.path("qa/defects.json").exists() else {}
                for owner in ("scene", "storyboard", "script"):
                    found += ((D.get("routed") or {}).get(owner) or {}).get(b) or []
                rv = read_json(self.p.path("qa/review.json"), {}) if self.p.path("qa/review.json").exists() else {}
                found += [f for f in rv.get("findings") or [] if f.get("beat") == b and f.get("status") not in RL.CLOSED]
                extra["findings"] = found
            parts.append(task_message(self.p, "clip" if clip else "scene", extra))
            shared_done = shared_done or not clip
        return "\n\n=====\n\n".join(parts)

    def _brief_parts(self, text: str) -> list[str]:
        """A brief in parts of at most BRIEF_PART characters, cut at a line break where one is near."""
        out = []
        while len(text) > BRIEF_PART:
            cut = text.rfind("\n", BRIEF_PART // 2, BRIEF_PART)
            cut = cut if cut > 0 else BRIEF_PART
            out.append(text[:cut])
            text = text[cut:]
        return out + [text]

    def _delegate_one(self, c, agent: str, brief: str, beats: list | None = None, files: list | None = None) -> dict:
        """Hand-over by reference (D-148): the sub-agent's whole brief (the lead's part and the engine's context for its
        beats) is written to logs/shuttle/briefs/<token>.md and the sub-agent reads it itself; the lead gets back a short
        spawn prompt. Before, `delegate` returned the whole brief and the lead wrote it out again as the Agent prompt: the
        measured run's 31 delegations carried 1.33 MB through the lead, and every later lead turn re-read it."""
        r = self.rails.delegate(agent, beats, files, brief, by_model=c.get("model"))
        tok = r["token"]
        name = "shuttle-" + r["agent"]
        ctx_block = self.engine_context(r["agent"], r["beats"])
        whole = (f"THE LEAD'S BRIEF:\n{brief.rstrip()}\n\n"
                 + (f"THE ENGINE'S CONTEXT (data, built by loom; the same block Relay's workers get):\n{ctx_block}\n\n" if ctx_block else "")
                 + f"Your owner token: {tok}. Pass it as `owner` on every loom tool call. You may write only: "
                 + (", ".join(r["files"]) or "nothing") + ".")
        self.p.path(r["brief"]).write_text(whole + "\n", encoding="utf-8")
        n = len(self._brief_parts(whole + "\n"))
        self.rails.update(lambda st: st["tokens"][tok].update(brief_parts=n, brief_read=[]))    # its writes wait for all n parts
        job = (f"beat{'s' if len(r['beats']) > 1 else ''} {', '.join(r['beats'])}" if r["beats"] else "the job in your brief")
        reads = " then ".join(f"read_artifact(name='brief:{tok}{'' if k == 1 else f'#{k}'}', owner='{tok}')" for k in range(1, n + 1))
        prompt = (f"You are the Shuttle {r['agent']} for {job} of lesson {self.p.id}. Your owner token: {tok}; pass it as `owner` on "
                  f"every loom tool call. Start with {reads}: your brief is there (the lead's brief and the engine's data for your "
                  f"job, {len(whole)} characters{f' in {n} parts' if n > 1 else ''}"
                  + (f"; part 1 is 'brief:{tok}' with no #number, and this message is not part of it" if n > 1 else "")
                  + f"). You may write only: {', '.join(r['files']) or 'nothing'}.")
        return {"token": tok, "agent": name, "files": r["files"], "beats": r["beats"], "limits": r["limits"],
                "brief": {"file": r["brief"], "chars": len(whole), "parts": n},
                "spawn": {"tool": "Agent", "subagent_type": name, "prompt": prompt, "run_in_background": False}}

    def t_delegate(self, c, agent: str | None = None, brief: str | None = None, beats: list | None = None, files: list | None = None,
                   jobs: list | None = None):
        """One sub-agent, or several in one call (`jobs`, each {agent, brief, beats, files}): a check that names five beats
        is one delegate call, then one turn of Agent calls."""
        if self.role() == "judge" and any(a in ("fixer", "scene-author", "clip-author", "kit-builder")
                                          for a in [agent or ""] + [(j or {}).get("agent") or "" for j in jobs or []]):
            return {"refused": "you are the P10 judge: hand the fixes over with plan_fixes(fixes=[{beat, finding, fix}], why) and end the "
                               "session; a build-lead session runs them (L-374)"}
        # a passing check ends P9's fixing (L-421: https-private-shuttle-api's lead sent b17 back after passing checks to chase
        # warnings, and each edit failed the next check): warnings are for P10's review, not another fix round
        builders = ("fixer", "scene-author", "clip-author")
        if self.rails.current() == "P9" and any(a in builders for a in [agent or ""] + [(j or {}).get("agent") or "" for j in jobs or []]):
            row = next((r for r in self.rails.status()["phases"] if r["phase"] == "P9"), {})
            passed = not [m for m in row.get("missing") or [] if "stage compose" in m or "stage check" in m]   # fresh: no edit since
        else:
            passed = False
        if passed:
            return {"refused": "the check has passed on this build: P9 is done. Accept it (accept_phase('P9')); its warnings are for "
                               "P10's review (critic_review), not another fix round"}
        if jobs:
            if agent or brief:
                return {"refused": "pass either one job (agent, brief, beats) or `jobs`, not both"}
            out, refused = [], []
            for j in jobs:
                try:
                    out.append(self._delegate_one(c, j.get("agent") or "", j.get("brief") or "", j.get("beats"), j.get("files")))
                except RL.Refusal as e:
                    refused.append({"job": {k: j.get(k) for k in ("agent", "beats")}, "refused": str(e)})
            return {"delegated": out, **({"not_delegated": refused} if refused else {}),
                    "next": "spawn every delegated job now, all in ONE turn (several Agent calls side by side, subagent_type and prompt "
                            "from each spawn, run_in_background false); when they return, collect(token='all')"}
        if not agent or not (brief or "").strip():
            return {"refused": "delegate needs `agent` and `brief` (or `jobs`, a list of them)"}
        r = self._delegate_one(c, agent, brief, beats, files)
        r["next"] = (f"spawn it now with the Agent tool (subagent_type '{r['agent']}', prompt = spawn.prompt verbatim, run_in_background "
                     f"false: you need its result); when it returns, collect('{r['token']}')")
        return r

    @staticmethod
    def _record(t: dict) -> dict:
        out = {k: t.get(k) for k in ("agent", "beats", "files", "status", "calls", "accepted", "errors", "snapshots", "findings")}
        out["calls_refused"] = t.get("refused", 0)       # not "refused": that key means the call itself was refused
        if t.get("brief_parts"):
            out["brief_read"] = f"{len(t.get('brief_read') or [])} of {t['brief_parts']} parts"
        return out

    def t_collect(self, c, token: str | None = None, tokens: list | None = None, force: bool = False):
        """One token, a list, or 'all' (every open token whose sub-agent made a loom call)."""
        if token == "all" or tokens == ["all"]:
            names = self.rails.open_tokens()
            if not names:
                return {"collected": {}, "note": "no open token whose sub-agent made a loom call",
                        "still_open": self.rails.open_tokens(worked_only=False)}
        else:
            names = list(tokens or []) + ([token] if token else [])
            if not names:
                return {"refused": "collect needs `token` (a token or 'all') or `tokens`"}
        if len(names) == 1 and token and token != "all":
            return self._record(self.rails.collect(token, force=force))
        got, refused = {}, {}
        for k in names:
            try:
                got[k] = self._record(self.rails.collect(k, force=force))
            except RL.Refusal as e:
                refused[k] = str(e)
        left = self.rails.open_tokens(worked_only=False)
        return {"collected": got, **({"not_collected": refused} if refused else {}), **({"still_open": left} if left else {})}

    # ---------------------------------------------------------------- P10: the judge plans, a fix round fixes (L-374)
    def role(self) -> str | None:
        return os.environ.get("LOOM_SHUTTLE_ROLE") or None

    def t_plan_fixes(self, c, fixes: list, why: str):
        """The judge's hand-over: the findings to fix, each {beat, finding, fix}. A fix round on the build lead runs them."""
        if self.role() != "judge":
            return {"refused": "plan_fixes is for the P10 judge in a run whose critique and build leads differ; here, fix them yourself "
                               "(delegate the fixers, collect, check)"}
        if (self.rails.load().get("fix_plan") or {}).get("status") == "open":
            return {"refused": "a fix plan is already open: the fix round runs it first"}
        bad = [f for f in fixes if not isinstance(f, dict) or not f.get("beat") or not (f.get("fix") or f.get("finding"))]
        if bad or not fixes:
            return {"refused": "each fix needs its beat and what to change ({beat, finding, fix})"}
        if not (why or "").strip():
            return {"refused": "say why (it is logged)"}
        plan = {"status": "open", "fixes": fixes, "why": why, "at": RL.now(), "by": c.get("model")}
        self.rails.update(lambda st: st.__setitem__("fix_plan", plan))
        self.rails.trace("fix_plan", fixes=len(fixes), beats=sorted({f["beat"] for f in fixes}), why=why[:300])
        return {"planned": len(fixes), "next": "END THIS SESSION now (write the handoff note first): the build lead runs these fixes and the "
                                                "check; the next judge session re-runs critic_review on what changed and submits the review"}

    def t_fixes_done(self, c, summary: str):
        if self.role() != "fix":
            return {"refused": "fixes_done is for the P10 fix round"}
        fp = self.rails.load().get("fix_plan") or {}
        if fp.get("status") != "open":
            return {"refused": "no open fix plan"}
        left = self.rails.open_tokens()
        if left:
            return {"refused": f"collect your sub-agents first: {', '.join(left)} (collect(token='all'))"}
        self.rails.update(lambda st: st["fix_plan"].update(status="done", summary=(summary or "")[:1500], done_at=RL.now()))
        self.rails.trace("fix_plan_done", summary=(summary or "")[:300])
        return {"done": True, "next": "END THIS SESSION now with the handoff note: the judge re-runs critic_review on what changed"}

    def t_request_approval(self, c, kind: str, summary: str, files: list | None = None):
        who = os.environ.get("LOOM_SHUTTLE_APPROVE_AS") or None
        if who and "unattended" not in who.lower():
            who = None
        return self.rails.request_approval(kind, summary, files, approve_as=who)

    # ---------------------------------------------------------------- the registry
    def _registry(self) -> dict:
        from ..agents.tools import FINDING      # the finding's fields shown to the model (R-46)
        reg = {}

        def add(name, desc, sch, fn):
            reg[name] = (desc, sch, fn)

        relay_read = {
            "list_skill_sections": "List the headings of a skill or guide (e.g. lnd-visual-design, STORYBOARD_GUIDE).",
            "get_skill_section": "Get one section of a skill or guide by its heading.",
            "get_api_section": "Get one section of the Loom scene API (docs/SCENE_API.md).",
            "catalog_search": "Search templates, blueprints and components by what they do.",
            "get_catalog_entry": "One catalogue entry with its props schema.",
            "capabilities": "Everything the engine can draw, one line each on when to use it; `group` filters.",
            "get_style_pack": "The lesson's style pack: its direction card first (direction_card: the style's strong calls and when each fits), then its whole style guide (guide_text).",
            "get_example_scene": "The finished example scene closest to a design or form tag.",
            "get_beat": "One beat: script lines, allocation, timings, storyboard scene.",
            "get_fact": "One knowledge-sheet fact by id.",
            "get_source_chunks": "Search the lesson's facts (topic mode) or source chunks (source mode).",
        }
        for n, d in relay_read.items():
            add(n, d, from_relay(n, OWNER), (lambda n: lambda c, **kw: self.relay(n, c, _role=c["who"], **kw))(n))
        add("get_world_pack", "A world pack (sets, props, palette notes) by id; no id lists them.", schema({"id": S, **OWNER}), self.t_get_world_pack)
        # the toolbox (D-137 to D-140), the same functions Relay's roles call
        add("use_tool", "Load toolbox tools by name (physics, brush, orb, three, skia), one or several: each tool's section of "
            "docs/TOOLBOX.md (for three, the live 3D model list). Code, no model call; the load is logged.",
            from_relay("use_tool", OWNER), lambda c, **kw: self.relay("use_tool", c, _role=c["who"], **kw))
        add("set_device", "The lead's: swap a device beat's device (phone, tablet, laptop, monitor, desk_set), its screen or its mood, "
            "validated and logged; after P5 it reopens the storyboard for that beat only. Say why.",
            schema({"beat": S, "device": S, "screen": OBJ, "mood": S, "why": S}, ["beat", "why"]), self.t_set_device)
        add("read_artifact", "Read one lesson file: brief, knowledge, teaching_plan, persona, script, allocation, outline, storyboard, timings, "
            "review, report, defects, notes, kit, kit_api, kit_preview (the last kit strip, attached), skeptic, design_seed, genre (the request's "
            "genre craft file), scene:<beat>, brief:<token> (a sub-agent's brief; a long one in parts: brief:<token>#2), approval:<kind>.",
            schema({"name": S, **OWNER}, ["name"]), self.t_read_artifact)
        add("lesson_status", "Where the lesson is: every phase (accepted, waiting, stale, open) with what is missing, open owner tokens, "
            "budget left. Call it first in every session.", schema({**OWNER}), self.t_lesson_status)
        add("budget_status", "Budget limits, spent (by phase and by sub-agent), left, and reopens used.", schema({**OWNER}), self.t_budget_status)
        add("new_lesson", "Create a lesson (only when this server's lesson does not exist yet).", schema({"topic": S, "audience": S, "style": S,
            "length_min": {"type": "number"}}), self.t_new_lesson)
        add("reopen", "Go back to a phase: only that phase goes stale (its artifacts kept as versions); each later phase re-checks itself "
            "and opens only if something it depends on changes. `beats` (P4 or P5) limits it to those beats' script lines or scenes: "
            "no approval voided, its own cap (8). Without beats: the phase's and later approvals voided, capped (3). Say why.",
            schema({"phase": S, "reason": S, "beats": {"type": "array", "items": S}}, ["phase", "reason"]), self.t_reopen)
        add("accept_phase", "Re-run a phase's gates on what is on disk (after a reopen whose work still holds, or a phase with nothing "
            "to write). P8: a beat file whose storyboard scene or kit parts changed since it was accepted is taken only when its beat "
            "is in `beats`, with `why` (logged); otherwise it is listed for a fixer or scene-author.",
            schema({"phase": S, "beats": {"type": "array", "items": S}, "why": S}, ["phase"]), self.t_accept_phase)
        # the lead's writes
        add("submit_brief", "P1: submit the complete Production Brief; returns the gate verdict.", schema(ART, ["artifact"]), self.t_submit_brief)
        add("submit_teaching_plan", "P3: submit the complete teaching plan; returns the gate verdict.", schema(ART, ["artifact"]), self.t_submit_teaching_plan)
        add("choose_persona", "P4: the narrator persona from packs/personas (analyst, mentor, storyteller).",
            schema({"pick": S, "why": S}, ["pick", "why"]), self.t_choose_persona)
        add("submit_script", "P4: submit the complete script; the allocation (code) follows a pass.", schema(ART, ["artifact"]), self.t_submit_script)
        add("patch_script", "P4: replace only the named beats of the script (each complete, matched by id).",
            schema({"beats": {"type": "array", "items": OBJ, "minItems": 1}}, ["beats"]), self.t_patch_script)
        add("submit_outline", "P5 pass 1: the storyboard outline (devices, value script, sections); returns the contract verdict.",
            schema(ART, ["artifact"]), self.t_submit_outline)
        add("submit_storyboard", "P5 pass 2: the complete storyboard; returns the gate verdict.", schema(ART, ["artifact"]), self.t_submit_storyboard)
        add("patch_storyboard", "P5: replace only the named scenes (each complete, matched by beat), plus devices, value_script or kit.",
            schema({"scenes": {"type": "array", "items": OBJ, "minItems": 1}, "devices": {"type": "array"}, "value_script": {"type": "array"},
                    "kit": OBJ}, ["scenes"]), self.t_patch_storyboard)
        add("submit_review", "P10: the review of the contact sheets: every finding with `status` fixed or accepted (with a reason).",
            schema(ART, ["artifact"]), self.t_submit_review)
        # sub-agents' writes (owner token)
        add("submit_knowledge", "P2 (fact-finder): submit the complete knowledge sheet (always a draft until a person approves).",
            schema({**ART, **OWNER}, ["artifact", "owner"]), self.t_submit_knowledge)
        add("kit_preview", "P7 (kit-builder): render your draft kit, every part in a grid stepped through its states, in the lesson's style; "
            "returns the strip and the runtime errors. The first time send the whole kit as `source`; after that send only `edits` "
            "([{old, new}], each old text found exactly once in your last previewed draft): the same kit, a fraction of the typing.",
            schema({"source": S, **EDITS, **OWNER}, ["owner"]), self.t_kit_preview)
        add("submit_kit", "P7 (kit-builder): submit scenes/_kit.js ({source, parts, api, verified, unverified}); only a previewed source "
            "(leave `source` out to submit the draft your last preview drew).",
            schema({**ART, **OWNER}, ["artifact", "owner"]), self.t_submit_kit)
        add("lab_snapshot", "P8 (scene-author, fixer): write your draft and photograph your beat at up to 4 times (seconds on the LESSON "
            "clock, the clock of your phrase timings, inside your beat; R-46); returns this beat's runtime errors and the picture. The first time send the whole file as `source`; after that "
            "(and a fixer from the start: its draft is the beat's file) send only `edits` ([{old, new}], each old text found exactly "
            "once in your current draft): the same file, a fraction of the typing.",
            schema({"times": TIMES, "source": S, **EDITS, **BEAT, **OWNER}, ["times", "owner"]), self.t_lab_snapshot)
        add("submit_scene", "P8 (scene-author, fixer): submit your beat's complete scene file ({beat, source}); refused before a snapshot.",
            schema({**ART, **BEAT, **OWNER}, ["artifact", "owner"]), self.t_submit_scene)
        add("render_clip", "P8 (clip-author): render your Manim/Skia/Three clip at draft quality and look at frames; `source` the first "
            "time, then `edits` to your last one.",
            schema({"source": S, "times": TIMES, **EDITS, **BEAT, **OWNER}, ["times", "owner"]), self.t_render_clip)
        add("submit_clip", "P8 (clip-author): submit the clip file you rendered last.", schema({**ART, **BEAT, **OWNER}, ["artifact", "owner"]),
            self.t_submit_clip)
        add("report_finding", "Log a problem outside your own file (a kit part, the storyboard, a tool bug, instructions in the inputs).",
            schema({"finding": FINDING, **OWNER}, ["finding"]), self.t_report_finding)
        add("note", "Log a decision or finding in the ledger; kind 'notes' appends to logs/shuttle/notes.md (the next session starts from it).",
            schema({"text": S, "kind": {"type": "string", "enum": ["notes", "finding", "fix", "deviation", "routing", "tooling", "decision"]},
                    "beat": S, **OWNER}, ["text"]), self.t_note)
        # build
        add("narrate", "P6: narrate the script (TTS, cached per phrase) and measure the length against the request.", schema({}), self.t_narrate)
        add("animatic", "P6: draw the animatic (one panel per beat, timed to the voice) and look at it.", schema({}), self.t_animatic)
        add("pilot_check", "P8, lessons with a kit: after the first continue join's two beats are submitted, compose and check them "
            "(runtime probe and layout) before the other beats are delegated; the other beats are refused until it passes.",
            schema({}), self.t_pilot_check)
        add("compose", "P9: compose the lesson (strict: every beat's file must exist).", schema({}), self.t_compose)
        add("check", "P9: the check (probe, film checks, contact sheets); on a failure, the defects grouped by owner.", schema({}), self.t_check)
        add("render", "P11: render the MP4 (needs a passing check; never forced).", schema({"quality": {"type": "string", "enum": ["high", "standard", "draft"]}}),
            self.t_render)
        # look (D-148: pictures at the size the judgment needs)
        DETAIL = {"detail": {"type": "string", "enum": ["overview", "full"],
                             "description": "overview: a sweep over many beats; full: a close look, larger frames"}}
        add("contact_sheet", "Look at beats' contact sheets (arrive, develop, settled), one image: up to 9 beats at detail 'overview' "
            "(the default: a sweep for composition, a blank or broken frame, an overlap) or up to 3 at 'full' (each frame about twice "
            "as wide: words, small parts, a defect the check or the critic named).",
            schema({"beats": {"type": "array", "items": S, "minItems": 1, "maxItems": 9}, **DETAIL, **OWNER}, ["beats"]), self.t_contact_sheet)
        add("frames", "Look at the composed lesson at up to 4 times (seconds from the lesson start); detail 'full' by default.",
            schema({"times": TIMES, **DETAIL, **OWNER}, ["times"]), self.t_frames)
        add("strips", "Film strips (8 frames per beat and per join) for some beats, e.g. 'b03-b05'; detail 'overview' by default.",
            schema({"beats": S, **DETAIL, **OWNER}, ["beats"]), self.t_strips)
        # other families
        add("skeptic_review", "P2: an other-family model attacks the fact sheet claim by claim; returns its verdict and findings.", schema({}),
            self.t_skeptic_review)
        add("critic_review", "P10: an other-family model judges every contact sheet with its narration and props; returns its findings.",
            schema({"beats": {"type": "array", "items": S}}), self.t_critic_review)
        # delegation and approvals
        JOB = {"agent": S, "brief": S, "beats": {"type": "array", "items": S}, "files": {"type": "array", "items": S}}
        add("delegate", "Give a sub-agent (fact-finder, kit-builder, scene-author, clip-author, fixer, researcher) its brief and an owner token "
            "for its files; several at once with `jobs` (a list of {agent, brief, beats}). The engine adds the data for the beats and "
            "stores the whole brief; you get back a short spawn prompt per job. Spawn them with the Agent tool (all in one turn), then "
            "collect.",
            schema({**JOB, "jobs": {"type": "array", "minItems": 1, "items": schema(JOB, ["agent", "brief"])}}), self.t_delegate)
        add("collect", "Close sub-agents' tokens and get their records (accepted submits, gate errors, snapshots, findings): one `token`, "
            "`tokens`, or token 'all' (every open token whose sub-agent made a loom call). Refused while a sub-agent has made no loom "
            "call (it may still be running); force=true closes it anyway.",
            schema({"token": S, "tokens": {"type": "array", "items": S}, "force": {"type": "boolean"}}), self.t_collect)
        add("plan_fixes", "P10 judge (a run whose critique and build leads differ): hand the fixes you decided to the build lead, each "
            "{beat, finding, fix}; then end the session. A fix round delegates and checks them; you judge again after.",
            schema({"fixes": {"type": "array", "minItems": 1, "items": OBJ}, "why": S}, ["fixes", "why"]), self.t_plan_fixes)
        add("fixes_done", "P10 fix round: the judge's plan is fixed and the check passes; say what changed; then end the session.",
            schema({"summary": S}, ["summary"]), self.t_fixes_done)
        add("request_approval", "Ask a person: facts (P2), plan (P6) or final (P11). Writes qa/approvals/<kind>.md and pauses the run.",
            schema({"kind": {"type": "string", "enum": ["facts", "plan", "final"]}, "summary": S, "files": {"type": "array", "items": S}},
                   ["kind", "summary"]), self.t_request_approval)
        missing = sorted(set(RL.TOOLS) - set(reg))
        assert not missing, f"tools in the rails without a handler: {missing}"
        return reg

    def list_tools(self) -> list[dict]:
        """Every tool, or in a launcher's session only that session's phases' tools (rails.session_tools, D-148)."""
        win = self.window()
        keep = RL.session_tools(*win) if win else None
        out = []
        for n, (d, s, _) in self.tools.items():
            if keep is None or n in keep:
                out.append({"name": n, "description": d, "inputSchema": copy.deepcopy(s)})
        return out


# ------------------------------------------------------------------ MCP stdio
def picture_size(w: int, h: int, detail: str = "full") -> tuple[int, int]:
    """The size a picture is sent at for `detail` (PICTURE): within the long side and the pixel budget, never enlarged."""
    side, px = PICTURE.get(detail) or PICTURE["full"]
    s = min(1.0, side / max(w, h), (px / float(w * h)) ** 0.5)
    return max(1, int(w * s)), max(1, int(h * s))


def _content(res: dict, images: list) -> dict:
    from PIL import Image
    text = json.dumps(res, ensure_ascii=False, default=str)
    if len(text) > MAX_REPLY:
        text = text[:MAX_REPLY] + '..."[cut]"'
    content = [{"type": "text", "text": text}]
    detail = res.get("detail") if isinstance(res, dict) and res.get("detail") in PICTURE else "full"
    for f in images[:4]:
        try:
            im = Image.open(f).convert("RGB")
            size = picture_size(im.width, im.height, detail)
            if size != im.size:
                im = im.resize(size, Image.LANCZOS)
            buf = io.BytesIO()
            im.save(buf, "JPEG", quality=80)
            content.append({"type": "image", "data": base64.b64encode(buf.getvalue()).decode(), "mimeType": "image/jpeg"})
        except Exception as e:  # noqa: BLE001
            content.append({"type": "text", "text": f"(image {f} could not be attached: {e})"})
    return {"content": content, "isError": bool(res.get("refused") or res.get("error"))}


def serve(project_id: str, inp=None, out=None):
    """Read JSON-RPC lines from `inp`, answer on `out` (both binary streams)."""
    srv = Server(project_id)
    wlock = threading.Lock()
    pool = ThreadPoolExecutor(max_workers=8)

    def send(msg):
        data = memoryview((json.dumps(msg, ensure_ascii=False) + "\n").encode("utf-8"))
        with wlock:
            while data:                       # a raw pipe write may take only part of a large reply (an image)
                n = out.write(data)
                data = data[n or 0:]
            out.flush()

    def handle(msg):
        mid, method, params = msg.get("id"), msg.get("method"), msg.get("params") or {}
        try:
            if method == "initialize":
                res = {"protocolVersion": params.get("protocolVersion") or PROTOCOL, "capabilities": {"tools": {"listChanged": False}},
                       "serverInfo": {"name": "loom", "version": "1.0"}, "instructions": SERVER_NOTE}
            elif method == "tools/list":
                res = {"tools": srv.list_tools()}
            elif method == "tools/call":
                r, imgs = srv.call(params.get("name"), params.get("arguments") or {}, (params.get("_meta") or {}).get("claudecode/toolUseId"))
                res = _content(r, imgs)
            elif method == "ping":
                res = {}
            elif mid is None:
                return                                   # a notification (initialized, cancelled): nothing to answer
            else:
                send({"jsonrpc": "2.0", "id": mid, "error": {"code": -32601, "message": f"method not found: {method}"}})
                return
            if mid is not None:
                send({"jsonrpc": "2.0", "id": mid, "result": res})
        except Exception as e:  # noqa: BLE001
            if mid is not None:
                send({"jsonrpc": "2.0", "id": mid, "error": {"code": -32603, "message": f"{type(e).__name__}: {e}"}})

    for raw in inp:
        raw = raw.strip()
        if not raw:
            continue
        try:
            msg = json.loads(raw.decode("utf-8") if isinstance(raw, bytes) else raw)
        except json.JSONDecodeError:
            send({"jsonrpc": "2.0", "id": None, "error": {"code": -32700, "message": "parse error"}})
            continue
        if msg.get("method") == "tools/call":
            pool.submit(handle, msg)
        else:
            handle(msg)
    pool.shutdown(wait=True)


def isolate_stdio(log: Path):
    """The protocol keeps private copies of fds 0 and 1; fd 0 becomes the null device and fds 1 and 2 the log file, so
    nothing the engine runs can touch the protocol. Two blocks in S0 (2026-10-08): narrate's prints filled stderr, which
    Claude Code does not drain, and the animatic's ffmpeg inherited the protocol's stdin and sat on it for good."""
    log.parent.mkdir(parents=True, exist_ok=True)
    proto_in = os.fdopen(os.dup(0), "rb")
    proto_out = os.fdopen(os.dup(1), "wb", buffering=0)
    null = os.open(os.devnull, os.O_RDONLY)
    os.dup2(null, 0)
    fd = os.open(str(log), os.O_WRONLY | os.O_CREAT | os.O_APPEND)
    os.dup2(fd, 1)
    os.dup2(fd, 2)
    sys.stdin = open(os.devnull, "r", encoding="utf-8")
    sys.stdout = sys.stderr = open(fd, "w", encoding="utf-8", buffering=1, closefd=False)
    return proto_in, proto_out


def main(argv=None):
    import argparse
    ap = argparse.ArgumentParser(description="loom-mcp: Shuttle's tool server for one lesson (MCP over stdio)")
    ap.add_argument("--project", required=True)
    a = ap.parse_args(argv)
    from ..project import Project
    proto_in, proto_out = isolate_stdio(Project.open(a.project).path("logs/shuttle/server.log"))
    print(f"--- loom-mcp started {time.strftime('%Y-%m-%d %H:%M:%S')} for {a.project}", flush=True)
    serve(a.project, proto_in, proto_out)


if __name__ == "__main__":
    main()
