"""The agent runtime (D-115): one guarded tool loop for every role.

A task = a role card (system, cached), the artifact's shape (system, cached), one task message (user), the role's
tools. The loop ends only when the role's submit tool accepts the artifact, or when a guard stops it: repair rounds,
turns, tool calls, the same call repeated, wall time, or a budget cap (checked BEFORE every call). Everything is
logged: one line per model call (logs/llm_calls.jsonl) and one trace per task (logs/traces/<task>.jsonl).
"""
from __future__ import annotations

import base64
import hashlib
import json
import time
import uuid
from dataclasses import dataclass, field
from pathlib import Path

from ..util import ENGINE_ROOT, info, read_json
from . import tools as T
from .budget import Budget
from .llm import registry as R
from .llm.types import BillingError, BudgetExceeded, ContextOverflow, LLMError, Message, Request

SCHEMA_FOR = {
    "brief": ENGINE_ROOT / "loom/schemas/brief.schema.json", "knowledge": ENGINE_ROOT / "loom/schemas/knowledge.schema.json",
    "pedagogy": ENGINE_ROOT / "loom/schemas/teaching_plan.schema.json", "script": ENGINE_ROOT / "loom/schemas/script.schema.json",
    "storyboard": ENGINE_ROOT / "loom/schemas/storyboard.schema.json", "storyboard_outline": T.CONTRACTS / "outline.schema.json",
    "skeptic": T.CONTRACTS / "skeptic_verdict.schema.json", "persona_pick": T.CONTRACTS / "persona_pick.schema.json",
    "scene": T.CONTRACTS / "scene_submission.schema.json", "clip": T.CONTRACTS / "scene_submission.schema.json",
    "critic": ENGINE_ROOT / "loom/schemas/review.schema.json",
    "tweak": T.CONTRACTS / "tweak_result.schema.json",
    "kit": T.CONTRACTS / "kit_submission.schema.json",
}
# Limits exist to stop a broken loop, never to cut off a working agent half way (Kshitij, 2026-10-07: "I don't want
# you to put some small cap and then my money is wasted half run"). So: no per-task dollar cap (the run's --budget is
# the only money limit), output up to the model's own maximum (max_tokens None), generous turns and wall time, and the
# context managed by fitting each call to the model's window instead of refusing it (L-242).
DEFAULT_LIMITS = {"turns": 30, "tool_calls": 80, "max_tokens": None, "usd": None, "seconds": 7200, "repairs": 3}
ROLE_LIMITS = {"persona_pick": {"turns": 4, "max_tokens": 4000, "repairs": 1}, "critic": {"turns": 12},
               "storyboard": {"turns": 40, "tool_calls": 150}, "storyboard_outline": {"turns": 30, "tool_calls": 120},
               "scene": {"turns": 30, "tool_calls": 80}, "clip": {"turns": 30, "tool_calls": 60}}
# the storyboard roles read many catalogue entries in parallel turns: 40 calls stopped GPT-6.1 Sol and Sonnet before
# they wrote anything in the real bench (2026-10-06, L-235)
COMPACT_AT = 0.75            # compact old tool results only past 75 % of the model's window (compaction breaks the cache)
MIN_OUT = 8000               # the least output room a call is sent with; below it the window is really full
SAFETY = 4000                # tokens kept free for the provider's own counting differences (our count is an estimate)


# --context parity (2026-10-06, docs/strategy/2026-10-06-pipeline-parity-plan.md): each role reads exactly what the
# Cowork task file for its stage tells a model to read (Stage.skills + the stage's prompt pack), instead of a 6 KB role
# card plus sections fetched on demand. In bench 151439 Claude's storyboard fetched 2 skill sections and its 24 scene
# workers none (L-240); Cowork's storyboard reads about 181 KB. The prefix is the same for every task of a role, so
# it is written to the provider cache once and read back at about a tenth of the price.
CONTEXTS = ("cards", "parity")
PARITY_STAGE = {"brief": "brief", "knowledge": "knowledge", "pedagogy": "pedagogy", "script": "script",
                "storyboard_outline": "storyboard", "storyboard": "storyboard", "scene": "scenes", "clip": "scenes", "kit": "scenes",
                "critic": "review"}
PARITY_NOTE = """## How to use the reading below
It is the same reading the Cowork authoring path gives this stage, written for an agent that works with files.
You work through tools instead:
- where it says read a project file, use get_beat, get_catalog_entry, get_style_pack, get_api_section or get_fact;
- where it says write the artifact or run `py -m loom accept`, call the submit tool your role card names: it runs
  the same gate;
- everything from the skills listed is already here, so do not fetch those sections again.
Your role card comes after the reading. It is the contract for this API path: where they differ, the card wins."""


def parity_files(role: str, style: str | None = None) -> list[str]:
    """The stage's Cowork reading list; for the storyboard and scene roles, plus the lesson style's guide (one cached
    prefix per style)."""
    from ..stages import BY_NAME, reading_list
    st = BY_NAME.get(PARITY_STAGE.get(role, ""))
    if not st:
        return []
    return [f for f in reading_list(st, style) + ([st.prompt] if st.prompt else []) if (ENGINE_ROOT / f).exists()]


MENU_ROLES = ("storyboard_outline", "storyboard", "scene", "clip", "kit", "tweak")

# Craft notes (R-46): the few sections each role's card says to pull, preloaded in the cached prefix. In
# feedback-relay-v2 the 27 scene sessions read no skill section and no style guide (they are on demand, and nobody
# asked; L-240 saw the same), while parity mode pasted whole reading lists (about 280 KB a role). This is the middle:
# the style guide's sections for the role (by number) and the card's own short list, about 10 to 40 KB, the same for
# every task of the role in a lesson, so it is written to the cache once.
CRAFT_GUIDE = {"scene": ("2", "6", "8", "11", "12", "13"), "kit": ("2", "4", "5", "8", "11", "12"), "clip": ("2", "11", "13"),
               "critic": ("2", "6", "8", "12", "13"), "storyboard_outline": ("6", "8", "10"), "storyboard": ("6", "8", "10")}
CRAFT_SKILLS = {
    "scene": [("lnd-motion-choreography-loop", "Pass C · Choreograph - the beat sheet, with a clock"),
              ("lnd-motion-fit", "9.2 The five dependencies that are ALWAYS hard"),
              ("lnd-motion-fit", "9.8 The exit register: what leaves HOW"),
              ("lnd-motion-craft", "Fast in, then HOLD - the reading floor"),
              ("loom-scene-author", "Primitives from the TED-Ed study (D-114): use them, never hand-roll them"),
              ("loom-scene-author", 'Real things, real scale, the film (docs/SCENE_API.md, "Real artefacts"; D-100)')],
    "critic": [("lnd-visual-design", "7c. Fill the frame like a place, or leave it dark on purpose (measured)"),
               ("lnd-visual-design", "7a. Show it in use, and make every frame postable"),
               ("lnd-motion-craft", "No double exposure")],
}


def guide_sections(style: str | None, numbers) -> str:
    """The style guide's numbered sections (`## 2. Palette roles` ...), joined; '' when the style has no guide."""
    import re
    if not style:
        return ""
    pk = read_json(ENGINE_ROOT / "packs/styles" / f"{style}.json", {}) or {}
    g = pk.get("guide")
    if not g or not (ENGINE_ROOT / g).exists():
        return ""
    text = (ENGINE_ROOT / g).read_text(encoding="utf-8")
    parts = re.split(r"(?m)^## (?=\d+\. )", text)
    by = {p.split(".", 1)[0]: "## " + p.strip() for p in parts[1:]}
    return "\n\n".join(by[n] for n in numbers if n in by)


def craft_notes(role: str, style: str | None) -> str:
    out = []
    gs = guide_sections(style, CRAFT_GUIDE.get(role, ()))
    if gs:
        out.append(f"### From the {style} style guide (the contract for a frame in this style)\n\n" + gs)
    for skill, sec in CRAFT_SKILLS.get(role, []):
        r = T.t_get_skill_section(None, skill, sec)
        if isinstance(r, dict) and r.get("text"):
            out.append(f"### {skill}: {sec}\n\n" + r["text"].strip())
    if not out:
        return ""
    return ("## Craft notes (preloaded from the guide and the skills: read them, there is no need to fetch these sections "
            "again; other sections come with get_skill_section)\n\n" + "\n\n".join(out))


def role_system(role: str, context: str = "cards", style: str | None = None) -> list[str]:
    """The stable, cacheable prefix: shared rules + the role card (+ in parity, the stage's whole Cowork reading list),
    then the artifact's shape (+ the catalogue index for the storyboard roles). Identical for every task of the role,
    so providers cache it."""
    if context not in CONTEXTS:
        raise ValueError(f"context must be one of {CONTEXTS}, not {context!r}")
    shared = (T.ROLES / "_shared.md").read_text(encoding="utf-8")
    card = (T.ROLES / f"{role}.md").read_text(encoding="utf-8")
    files = parity_files(role, style) if context == "parity" else []
    if files:
        # block 1 is the reading alone, identical for every role of the same stage (the outline and the storyboard
        # read the same 181 KB): written to the cache once per lesson, read by the next role at a tenth of the price.
        # The role card and the artifact's shape come after it (measured 2026-10-07: the outline and the storyboard
        # each wrote the whole 82k-89k prefix, $0.56 of a $1.24 Anthropic bill).
        reading = [f"<<<< {f} >>>>\n" + (ENGINE_ROOT / f).read_text(encoding="utf-8").strip() for f in files]
        blocks = [shared + "\n\n" + PARITY_NOTE + "\n\n" + "\n\n".join(reading),
                  "# YOUR ROLE CARD (the contract for this API path)\n\n" + card]
    else:
        craft = craft_notes(role, style)
        blocks = [shared + "\n\n" + card + ("\n\n" + craft if craft else "")]
    sch = SCHEMA_FOR.get(role)
    shape = f"## The artifact's exact shape (JSON schema), passed as `artifact` to `{T.TERMINAL[role]}`\n```json\n" + \
        json.dumps(json.loads(sch.read_text(encoding="utf-8")), separators=(",", ":")) + "\n```"
    from .. import toolbox as _TB
    if role in MENU_ROLES and "docs/TOOLBOX.md" not in files and _TB.enabled():
        # the toolbox menu (D-137): in the cached prefix, so it costs a cache read per turn; a tool's own section
        # comes only when the agent asks (use_tool) or when its storyboard scene names it (the task hands it over)
        from .. import toolbox as TB
        shape += "\n\n## The toolbox (load a tool's section with use_tool)\n" + TB.menu()
    if role in ("storyboard", "storyboard_outline") and "runtime/catalog.md" not in files:
        cat = read_json(ENGINE_ROOT / "runtime/catalog.json", {})
        idx = [f"- `{cid}` ({k[:-1]}; {', '.join(e.get('job') or [])}): {(e.get('doc') or '').split('. ')[0][:160]}"
               for k in ("templates", "blueprints", "components") for cid, e in sorted((cat.get(k) or {}).items())]
        shape += "\n\n## Catalogue index (props via get_catalog_entry)\n" + "\n".join(idx)
    blocks[-1] = blocks[-1] + "\n\n" + shape if len(blocks) > 1 else blocks[-1]
    if len(blocks) == 1:
        blocks.append(shape)
    return blocks


@dataclass
class AgentSpec:
    role: str
    model_alias: str
    effort: str | None = None
    limits: dict = field(default_factory=dict)
    context: str = "cards"
    cache_ttl: str | None = None

    def lim(self, k):
        return {**DEFAULT_LIMITS, **ROLE_LIMITS.get(self.role, {}), **self.limits}[k]


@dataclass
class AgentResult:
    task_id: str
    role: str
    status: str
    artifact: str | None
    errors: list
    findings: list
    usage: dict
    cost_usd: float
    turns: int
    tool_calls: int
    repairs: int
    model: str
    provider: str
    seconds: float
    trace: str
    note: str = ""
    value: dict | None = None

    def as_dict(self):
        d = {k: getattr(self, k) for k in ("task_id", "role", "status", "artifact", "errors", "findings", "usage", "cost_usd", "turns",
                                            "tool_calls", "repairs", "model", "provider", "seconds", "trace", "note")}
        return d


def _img(path: str) -> tuple[str, str]:
    p = Path(path)
    return ("image/png" if p.suffix.lower() == ".png" else "image/jpeg", base64.b64encode(p.read_bytes()).decode())


def _chars(system: list[str], msgs: list[Message]) -> tuple[int, int]:
    n = sum(len(s) for s in system) + sum(len(m.content or "") + sum(len(json.dumps(c.args)) for c in m.tool_calls) for m in msgs)
    return n, sum(len(m.images) for m in msgs)


def _compact(msgs: list[Message]):
    """Old tool results become one line each (the model keeps its own calls, so the thread still reads); the last
    four messages are never touched."""
    for m in msgs[:-4]:
        # small results (a catalogue entry, a beat) are never compacted: compacting them told GPT-6.1 Sol to "call the
        # tool again", and it re-read the same entries until the loop guard stopped its storyboard (L-237)
        if m.role == "tool" and len(m.content) > 2500 and not m.content.startswith("[compacted"):
            m.content = f"[compacted: {m.name} result of {len(m.content)} chars; call the tool again if you need it]"


# ------------------------------------------------------------------ sessions: a finished agent can be resumed to fix
def _msg_out(m: Message) -> dict:
    return {"role": m.role, "content": m.content, "images": [list(i) for i in m.images], "tool_call_id": m.tool_call_id, "name": m.name,
            "is_error": m.is_error, "extra": m.extra, "tool_calls": [{"id": c.id, "name": c.name, "args": c.args, "extra": c.extra} for c in m.tool_calls]}


def _msg_in(d: dict) -> Message:
    from .llm.types import ToolCall
    return Message(d["role"], d.get("content") or "", images=[tuple(i) for i in d.get("images") or []],
                   tool_calls=[ToolCall(c["id"], c["name"], c.get("args") or {}, c.get("extra") or {}) for c in d.get("tool_calls") or []],
                   tool_call_id=d.get("tool_call_id"), name=d.get("name"), is_error=bool(d.get("is_error")), extra=d.get("extra") or {})


def system_sha(blocks: list[str]) -> str:
    return hashlib.sha1("\n\x00".join(blocks).encode()).hexdigest()[:16]


def save_session(path: Path, spec: AgentSpec, ctx: T.ToolContext, msgs: list[Message], system: list[str], tid: str, status: str):
    from ..util import write_json
    write_json(path, {"role": spec.role, "alias": spec.model_alias, "context": spec.context, "cache_ttl": spec.cache_ttl, "stage": ctx.stage,
                      "beat": ctx.beat, "target": str(ctx.target) if ctx.target else None, "task_id": tid, "status": status,
                      "system_sha": system_sha(system), "saved_at": time.strftime("%Y-%m-%dT%H:%M:%S"),
                      "messages": [_msg_out(m) for m in msgs]})


def load_session(path: Path) -> dict | None:
    return read_json(path, None) if Path(path).exists() else None


def run_agent(spec: AgentSpec, ctx: T.ToolContext, task: str, budget: Budget, images: list[str] | None = None,
              provider=None, resume: dict | None = None, session_path: Path | None = None) -> AgentResult:
    """Run one agent task. Every gate and decision record written while it runs names the model that really ran
    (ledger.RUNNING, set per thread; L-268)."""
    from .. import ledger as L
    m = R.model(spec.model_alias)
    if m["provider"] == "claude_code":
        # a cc-* model: Claude Code headless serves the role on the subscription, its tool loop calling this role's own
        # tools (cc_runner.py, cc_server.py); the conductor, gates, router and budgets are unchanged
        from .cc_runner import run_agent_cc
        return run_agent_cc(spec, ctx, task, budget, images, resume, session_path)
    tok = L.RUNNING.set({"model": m["id"], "provider": m["provider"], "role": spec.role})
    try:
        return _run_agent(spec, ctx, task, budget, images, provider, resume, session_path)
    finally:
        L.RUNNING.reset(tok)


def _run_agent(spec: AgentSpec, ctx: T.ToolContext, task: str, budget: Budget, images: list[str] | None = None,
               provider=None, resume: dict | None = None, session_path: Path | None = None) -> AgentResult:
    P = ctx.project
    m = R.model(spec.model_alias)
    prov = provider or R.provider_for(m)
    tid = f"{ctx.role}-{ctx.beat + '-' if ctx.beat else ''}{uuid.uuid4().hex[:8]}"
    trace = P.path(f"logs/traces/{tid}.jsonl")
    trace.parent.mkdir(parents=True, exist_ok=True)
    tr = open(trace, "a", encoding="utf-8")
    log = lambda **kv: tr.write(json.dumps(dict(kv, t=round(time.monotonic() - t0, 2)), ensure_ascii=False) + "\n") or tr.flush()
    t0 = time.monotonic()
    system = role_system(spec.role, spec.context, P.request.get("style") if P is not None else None)
    tools = T.specs(spec.role)
    if spec.role == "brief" and P.mode == "topic":
        tools = [t for t in tools if t.name != "get_source_chunks"]   # nothing to search before the knowledge sheet (bench 2026-10-06)
    terminal = T.TERMINAL[spec.role]
    tail = f"\n\nYou have at most {spec.lim('repairs')} resubmissions. End by calling `{terminal}`."
    if resume:
        # a fix: the owner's own conversation, unchanged (so the provider reads it from cache), plus one message that
        # names only its defects. A different system prefix would miss the cache and confuse the thread: say so.
        if resume.get("system_sha") != system_sha(system):
            info(f"  [{spec.role}] note: the instructions changed since this session was saved; its cache will not be reused")
        msgs = [_msg_in(d) for d in resume.get("messages") or []]
        msgs.append(Message("user", task + tail, images=[_img(i) for i in images or []]))
    else:
        msgs = [Message("user", task + tail, images=[_img(i) for i in images or []])]
    warm = ctx.extra.get("_warm")
    warmed_before = warm is not None and warm.is_set()
    misses = 0
    from .llm.types import Usage
    usage, cost, calls, seen, nudges = Usage(), 0.0, 0, {}, 0
    prev_input = 0
    status, note = "limits", ""
    log(event="start", role=spec.role, model=m["id"], provider=m["provider"], tools=[t.name for t in tools], system_chars=sum(map(len, system)))
    turn = 0
    for turn in range(1, spec.lim("turns") + 1):
        if time.monotonic() - t0 > spec.lim("seconds"):
            note = "wall time"; break
        chars, nimg = _chars(system, msgs)
        est = R.estimate_tokens(chars, nimg)
        window = int(m.get("context", 10 ** 9))
        if est > window * COMPACT_AT:
            _compact(msgs)
            chars, nimg = _chars(system, msgs)
            est = R.estimate_tokens(chars, nimg)
        want = spec.lim("max_tokens") or m.get("max_out", 16000)
        want = min(int(want), int(m.get("max_out", want)))
        room = window - est - SAFETY
        if room < MIN_OUT:
            status, note = "error", f"the conversation (~{est} tokens) fills the {window}-token window; nothing more fits"; break
        max_tok = min(want, room)          # fit the call to the window instead of refusing it
        try:
            # the part of the prompt already sent last turn is priced as a cache read (it is one, on every routed provider)
            budget.check(m, est, max_tok, task_left=(spec.lim("usd") - cost) if spec.lim("usd") else None, cached_tokens=prev_input)
        except BudgetExceeded as e:
            status, note = "budget", str(e); log(event="budget_refused", reason=note); break
        # explore, then write: half way through the turn budget with nothing submitted, say so; on the last two turns,
        # require the terminal tool (a Flash brief read sections for 24 turns and never wrote, bench 2026-10-06)
        left = spec.lim("turns") - turn
        submitted = ctx.state.get("rounds", 0) > 0
        choice, effort = "auto", spec.effort
        if not submitted and turn == max(4, spec.lim("turns") // 2):
            msgs.append(Message("user", f"You have read enough to write it. Write the complete artifact now and call `{terminal}`."))
        if not submitted and left < 2:
            choice, effort = terminal, None   # forced tool use cannot run with thinking on Anthropic
        req = Request(model=m["id"], system=system, messages=msgs, tools=tools, tool_choice=choice, max_tokens=max_tok, effort=effort,
                      caps={k: m[k] for k in ("thinking", "tools_reasoning") if k in m}, cache_ttl=spec.cache_ttl)
        try:
            resp = prov.complete(req)
        except ContextOverflow as e:
            status, note = "error", f"context overflow: {e}"; log(event="error", error=note); break
        except BillingError as e:
            log(event="error", error=str(e)[:500]); tr.close()
            budget.dead.add(m["provider"])
            raise
        except LLMError as e:
            status, note = "error", str(e)[:500]; log(event="error", error=note); break
        c = budget.book(m, resp.usage, {"role": spec.role, "task": tid, "project": P.id, "turn": turn, "stop": resp.stop,
                                         "latency_s": round(resp.latency_s, 2), "_project_ledger": str(P.path("logs/llm_calls.jsonl"))})
        cost += c
        usage.add(resp.usage)
        # a prefix the provider has seen (an earlier turn, a resumed session, or a shared prefix another worker just
        # warmed) that reads 0 cached tokens is a cache miss: the whole prompt was billed at the full input price.
        # Count it, so a run that silently lost its cache shows it (the bench's cards runs read only 34 % from cache)
        expected = turn > 1 or bool(resume) or warmed_before
        if expected and est > 2048 and int(getattr(resp.usage, "cached", 0) or 0) == 0:
            misses += 1
            log(event="cache_miss", turn=turn, input=int(resp.usage.input or 0))
        prev_input = min(int(resp.usage.input or 0), est)
        if warm is not None and not warm.is_set():
            warm.set()          # the shared prefix is in the provider cache now: the other workers may start
        msgs.append(Message("assistant", resp.text, tool_calls=resp.tool_calls, extra=resp.extra))
        log(event="model", turn=turn, stop=resp.stop, text_chars=len(resp.text), calls=[tc.name for tc in resp.tool_calls],
            usage=vars(resp.usage), usd=round(c, 6))
        # one line per turn, so a long task never looks stuck (a Gemini Flash brief took 19 turns and 4.6 minutes
        # with nothing on screen, 2026-10-06)
        info(f"  [{spec.role}] turn {turn}: {', '.join(tc.name for tc in resp.tool_calls) or resp.stop}"
             f"  ({resp.latency_s:.1f} s, ${cost:.3f} so far)")
        if not resp.tool_calls:
            if resp.stop == "refusal" or resp.stop == "filtered":
                status, note = "error", f"model {resp.stop}"; break
            nudges += 1
            if nudges > 2:
                note = "the model stopped calling tools"; break
            hint = "Your reply was cut off by the output limit: submit a complete but more compact artifact." if resp.stop == "max_tokens" else ""
            msgs.append(Message("user", f"{hint} Act only through tools. When ready, call `{terminal}` with the complete artifact.".strip()))
            continue
        stop_loop = False
        for tc in resp.tool_calls:
            calls += 1
            key = hashlib.sha1((tc.name + json.dumps(tc.args, sort_keys=True)).encode()).hexdigest()
            seen[key] = seen.get(key, 0) + 1
            is_terminal = tc.name == terminal or (tc.name in T.TOOLS and T.TOOLS[tc.name].terminal and tc.name in T.ROLE_TOOLS.get(spec.role, []))
            if is_terminal:
                # a submission is always judged, even past a limit: refusing the artifact the task exists for wasted a
                # whole storyboard in the real bench (L-235)
                result = T.call(ctx, tc.name, tc.args)
            elif seen[key] >= 6:
                result = {"error": "the same call with the same arguments six times: stopping"}
                stop_loop, note = True, f"loop on {tc.name}"
            elif calls > spec.lim("tool_calls"):
                result = {"error": f"tool-call limit reached: no more reading; write the artifact now and call `{terminal}`"}
                note = "tool-call limit"
                if calls > spec.lim("tool_calls") + 8:
                    stop_loop = True
            elif seen[key] >= 3:
                # a repeat read (often after old results were compacted): answer it, and say so, instead of stopping
                result = T.call(ctx, tc.name, tc.args)
                if isinstance(result, dict):
                    result = dict(result, note=f"you have read this {seen[key]} times; use it and write the artifact")
            else:
                result = T.call(ctx, tc.name, tc.args)
            content = json.dumps(result, ensure_ascii=False)
            if len(content) > T.MAX_RESULT_CHARS + 2000:
                content = content[:T.MAX_RESULT_CHARS] + '..."[cut]"'
            msgs.append(Message("tool", content, tool_call_id=tc.id, name=tc.name, is_error=isinstance(result, dict) and bool(result.get("error"))))
            log(event="tool", name=tc.name, args_sha=key[:10], args_chars=len(json.dumps(tc.args)), result_chars=len(content),
                error=(result.get("error") if isinstance(result, dict) else None), accepted=(result.get("accepted") if isinstance(result, dict) else None))
        if ctx.state.get("done"):
            status = "accepted"; break
        if ctx.state.get("rounds", 0) > spec.lim("repairs"):
            status, note = "rejected", f"still failing after {spec.lim('repairs')} resubmissions"; break
        if stop_loop:
            break
        if ctx.state.get("images"):
            imgs = ctx.state.pop("images")
            msgs.append(Message("user", "Your snapshot:", images=[_img(i) for i in imgs if Path(i).exists()]))
    res = AgentResult(task_id=tid, role=spec.role, status=status, artifact=ctx.state.get("artifact"),
                      errors=ctx.state.get("errors", []) if status != "accepted" else [], findings=ctx.state.get("findings", []),
                      usage=vars(usage), cost_usd=round(cost, 6), turns=turn, tool_calls=calls, repairs=max(0, ctx.state.get("rounds", 0) - 1),
                      model=m["id"], provider=m["provider"], seconds=round(time.monotonic() - t0, 2), trace=str(trace), note=note,
                      value=ctx.state.get("value"))
    log(event="end", **{k: v for k, v in res.as_dict().items() if k not in ("trace",)})
    tr.close()
    if warm is not None and not warm.is_set():
        warm.set()
    if session_path:
        try:
            save_session(Path(session_path), spec, ctx, msgs, system, tid, status)
        except Exception as e:  # noqa: BLE001  (a session that cannot be saved only costs a fresh run later)
            info(f"  [{spec.role}] session not saved: {e}")
    try:
        from .. import ledger as L
        L.log(P, "model_call", node=ctx.stage, by={"kind": "model", "model": m["id"], "provider": m["provider"], "mode": "agents", "role": spec.role},
              data={"status": status, "usd": res.cost_usd, "turns": turn, "tool_calls": calls, "repairs": res.repairs,
                    "cache_misses": misses, **vars(usage)})
        if misses:
            info(f"  [{spec.role}] {misses} cache miss(es): the prefix was billed at the full input price")
    except Exception:  # noqa: BLE001  (logging never blocks a task)
        pass
    return res
