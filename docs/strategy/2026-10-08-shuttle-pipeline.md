# Shuttle: one lead agent on rails (architecture and the Claude Code build prompt)

STATUS: DESIGN + BUILD PROMPT (2026-10-08, Kshitij). Nothing here is built yet. Costs are ESTIMATES.

## 0. Names

| name | what it is | status |
|---|---|---|
| **Relay** | Today's API pipeline: code (`loom/agents/conductor.py`) runs fixed stages and hands each to a separate role agent (brief, knowledge, pedagogy, script, outline, storyboard, scene workers, critic); defects are routed back to the stage that owns them. Like a relay race: each runner sees one leg. | Built (D-115 onward). Kept, improved, and the baseline Shuttle must beat. |
| **Shuttle** | One lead agent owns the whole lesson, from idea to finished film, the way a lesson is made in Cowork. It follows a playbook, loads skills when it needs them, delegates focused work to sub-agents, looks at its own frames, and goes back when something is wrong. The Loom engine is its toolset and its rails: the engine decides what counts as done. Named after the loom's shuttle, which carries one thread across the whole cloth. | This document. |

Both share the same engine, skills, gates, checks, ledger, packs and style guides. Neither replaces Cowork mode.

---

## 1. Why Shuttle

**What it fixes (evidence):**
- The best Loom lessons were made this way: in Cowork one agent reads the director playbook, uses skills on demand,
  sends scene writing and reviews to sub-agents, looks at frames and goes back to the storyboard when a picture fails.
  Relay's agents each see one leg; no one owns the film (post-mortem, section M; 2026-10-08 architecture study).
- Judgement across stages: the lead can revise the storyboard after seeing frames; Relay can only route a defect to the
  stage that owns it.
- One mind briefs every scene, so continuity, cast and kit hold across beats.
- Industry evidence: single-threaded writes with sub-agents that contribute focused work is what works in 2026
  (Cognition, "Multi-agents: what's actually working"); orchestrator plus workers with explicit briefs and artifacts on
  disk, not passed through the lead (Anthropic, multi-agent research system); progressive disclosure of skills (Claude
  Agent SDK skills).

**What it does not fix by itself:**
- Cost: agent loops re-read a growing context (Anthropic measured multi-agent systems at about 15 times the tokens of a
  chat). Shuttle controls it with phase sessions, handoff notes, caching and sub-agents that return summaries.
- A lead that skips steps: every gate, approval and budget is enforced in code by the tools (section 3).
- Taste: still Kshitij, pairwise, within a style (D-109, D-122).

**Cost (ESTIMATE, 2-minute lesson):** about $4 to $10 on the API with a Sonnet lead; close to $0 at the margin on
the Claude Code subscription (rate-limited; non-Claude reviewers still bill). The main saving is no wasted runs: the
lead corrects course instead of failing a gate and stopping.

---

## 2. Architecture

```
                 Kshitij (approvals: facts, plan, final)
                          |
                    [ loom shuttle ]  launcher: subscription mode (Claude Code headless)
                          |                     or API mode (Claude Agent SDK)
                          v
   +------------------- LEAD AGENT (Shuttle) -------------------+
   |  playbook: skills/loom/shuttle-director (loaded first)      |
   |  skills: lnd-* and loom-* on demand (progressive disclosure)|
   |  writes itself: brief, pedagogy, script, storyboard, notes  |
   |  delegates: sub-agents (section 5)                          |
   +--------------------------+----------------------------------+
                              | tool calls only (MCP)
                              v
   +------------------- LOOM TOOL SERVER (loom-mcp) ------------+
   |  RAILS: lesson state machine, gates, approvals, budget,     |
   |         file ownership, invalidation on going back          |
   |  READ: skills, API docs, catalog, capabilities, guides,     |
   |        world packs, examples, facts, beats                  |
   |  WRITE: submit_* (gate runs), patch_*                       |
   |  BUILD: narrate, compose, animatic, snapshot, check,        |
   |         strips, render_clip, render                         |
   |  OTHER-FAMILY CALLS: skeptic, critic (Gemini / OpenAI via   |
   |         loom/agents/llm)                                    |
   |  LEDGER: every call, decision, cost, real model             |
   +--------------------------+----------------------------------+
                              v
            Loom engine (unchanged): runtime, templates, kits, packs, checks, renderer
```

Two launchers, one set of assets (playbook, sub-agent definitions, MCP server, skills):
- **Subscription mode:** `claude -p` (Claude Code headless) with `--mcp-config` pointing at loom-mcp, the sub-agents in
  `.claude/agents/`, the skills in `skills/` (or installed). Bills the Claude subscription; usage limits apply.
- **API mode:** a Python runner on the Claude Agent SDK with the same MCP server, the same sub-agent definitions
  (converted from the same source files) and the same skills. Bills the API key.

---

## 3. The rails (enforced in code, not trusted to the agent)

### 3.1 Lesson state machine
Phases, in order, each ends when its gate passes and is recorded:

| phase | artifact(s) | gate (existing code) | human approval |
|---|---|---|---|
| P1 brief | plan/brief.json | check_brief | |
| P2 facts | plan/knowledge.json (topic) or ingest (source) | check_knowledge + skeptic verdict | **facts** (existing `approve <id> knowledge`) |
| P3 pedagogy | plan/teaching_plan.json | check_pedagogy (length) | |
| P4 persona and script | plan/persona.json, plan/script.json | check_persona, check_script (length, grounding) | |
| P5 storyboard | plan/outline.json, plan/storyboard.json | outline contract, check_storyboard | |
| P6 narration and animatic | audio/timings.json, qa/animatic | check_narration (length) | **plan** (new: script + animatic) |
| P7 lesson kit | scenes/_kit.js (when the storyboard declares a kit) | kit gate (syntax, determinism, tokens, kit lab strip looked at) | |
| P8 beats | scenes/<beat>.js, clips | check_scenes, snapshot-before-submit | |
| P9 compose and check | build/, qa/report.json | compose strict, check (probe, film checks) | |
| P10 critique and fix | qa/review.json | critic findings closed or accepted | |
| P11 render | renders/ | render (needs a passing check; `--force --reason` only by a person) | **final** (Kshitij watches) |

Rules the server enforces:
- A tool for phase N refuses unless phases before N are accepted (and approvals given).
- **Going back is allowed and explicit:** `reopen(phase, reason)` marks that phase and every later phase stale (their
  artifacts kept as versions, D-97), logs it, and counts it against the budget's reopen cap (default 3 per lesson).
- **File ownership:** each write tool writes only its artifact; a sub-agent's token (from `delegate`) allows writes only
  to its assigned files. A PreToolUse hook (Claude Code / SDK) denies Write and Edit on project files outside the
  current owner's list, so the agent cannot hand-edit generated files or other beats.
- **Budget:** per lesson (USD for API mode, tokens or calls for subscription mode), per sub-agent (turns, tool calls),
  per phase. `budget_status` tells the lead what is left; at 100 % every write tool refuses and the run stops cleanly
  with a report (exit code 4, as Relay).
- **Determinism and grounding** stay with the existing gates; nothing in Shuttle relaxes a gate.

### 3.2 Approvals
`request_approval(kind, summary, files)` writes `qa/approvals/<kind>.md` (what to look at, the sheet paths) and pauses
(exit code 3). The person runs `py -m loom approve <id> <kind> --by "<name>" [--notes "..."]`, then `loom shuttle
resume <id>`; notes are handed to the lead. Kinds: facts, plan, final. Unattended runs must say so
(`--approve-as "agent, unattended per <who>"`), recorded.

---

## 4. The lead agent

- **Model:** Sonnet 5.5 by default (D-119: no Opus in the API pipeline). In subscription mode Opus may lead when
  Kshitij chooses it (he allowed Opus in the Claude-only profile).
- **Playbook:** a new skill `skills/loom/shuttle-director/SKILL.md` (the Cowork director playbook, rewritten for tools):
  the phase order, what to read per phase (a short list; the skills come by `get_skill_section`), what to delegate and
  what to write itself, the definition of done per phase, when to reopen, and the lessons that keep recurring
  (AGENT_LEARNINGS distilled to rules).
- **Writes itself:** brief, pedagogy, script, outline, storyboard, the scene and kit briefs, the handoff notes, the
  final summary. This is where judgement pays (planning matters most in every study).
- **Context policy (cost):**
  - one session per phase group (P1 to P4, P5 to P6, P7 to P9, P10 to P11); each starts from the cached playbook prefix
    plus `logs/shuttle/notes.md` (a running, compact lesson notebook the lead maintains: decisions, cast, kit parts,
    open issues) and the accepted artifacts it needs, never the whole transcript;
  - skills arrive as sections, not whole files; tool results are short (paths and summaries, images only when looking);
  - sub-agents return a 1 to 2k summary and file paths, never transcripts.
- **Looks at frames:** after compose it reads contact sheets and strips (images) itself, then asks the critic.

---

## 5. Sub-agents

All are defined once in `shuttle/agents/*.md` (front matter: name, description, model, tools; body: the role
contract) and generated into `.claude/agents/` (subscription mode) and SDK `AgentDefinition`s (API mode). Each gets a
brief from the lead through `delegate(...)`, which records the brief, the file ownership and the limits.

| sub-agent | default model | does | tools allowed | writes | limits | done when |
|---|---|---|---|---|---|---|
| **fact-finder** (topic mode) | Sonnet | drafts the fact sheet from the brief, conservative, with confidence | read tools, `submit_knowledge` | plan/knowledge.json | 12 turns | gate passes |
| **fact-skeptic** | Gemini Flash or GPT Luna (other family), called as a tool | attacks each fact | (server-side call) | skeptic verdict | 1 call + 1 retry | verdict recorded |
| **kit-builder** | Sonnet | writes the lesson kit: sets, screens, devices, parts with named states, using kit characters by id and the style guide | read tools, `lab_snapshot` (kit preview), `submit_kit` | scenes/_kit.js | 25 turns, 2 repair rounds | kit lab strip looked at, gate passes |
| **scene-author** (one per beat, parallel) | Sonnet (Haiku 4.5 or Flash only after a shadow test) | writes one beat from the storyboard spec, using the kit and the style guide | read tools, `lab_snapshot`, `submit_scene`, `report_finding` | scenes/<beat>.js | 20 turns, snapshot before submit | gate passes, snapshot looked at |
| **clip-author** | Sonnet | Manim clip for a maths beat (Skia, Three frozen, D-121) | read tools, `render_clip`, `submit_clip` | scenes/<beat>.py | 15 turns | clip renders, gate passes |
| **frame-critic** | Gemini Flash or GPT (other family), called as a tool | checklist review of contact sheets with narration and props (polarity, labels, accent, childish, off-brief) | (server-side call) | qa/review.json | 1 batch per 40 beats | findings written |
| **fixer** | Haiku 4.5 or Sonnet | applies one scoped fix to one file from a finding (a tweak) | read tools, `lab_snapshot`, `submit_scene` / `patch_*` | the one file named | 8 turns | gate passes, snapshot looked at |
| **researcher** (optional, source mode) | Sonnet | finds and quotes source chunks for a claim | `get_source_chunks`, `get_fact` | notes only | 6 turns | returns quotes with anchors |

Rules: one writer per file; a sub-agent never edits a file it was not given; the lead never edits a beat a sub-agent
owns while it is out; non-Claude reviewers are tools on the server (they keep Loom's multi-provider layer and the
cross-family check).

---

## 6. Tools (loom-mcp)

Built as one MCP server (Python, stdio) on top of existing functions (`loom/agents/tools.py`, `loom/flow.py`,
`loom/checks/*`, `loom/qa.py`, `loom/render.py`). Most exist as Relay tools today; Shuttle exposes them with rails.

| group | tools (existing marked *) | notes |
|---|---|---|
| state | `lesson_status`, `new_lesson`, `reopen(phase, reason)`, `budget_status` | status lists phases, gates, approvals, stale marks, budget left |
| read | `list_skill_sections`*, `get_skill_section`*, `get_api_section`*, `catalog_search`*, `get_catalog_entry`*, `capabilities`*, `get_style_pack`* (with the style guide), `get_world_pack`, `get_example_scene`*, `get_beat`*, `get_fact`*, `get_source_chunks`*, `read_artifact(name)` | results capped and summarised; images only from look tools |
| write (gate runs) | `submit_brief`*, `submit_knowledge`*, `submit_teaching_plan`*, `submit_script`*, `submit_outline`*, `submit_storyboard`*, `submit_kit` (new), `submit_scene`*, `submit_clip`*, `submit_review`*, `patch_storyboard`*, `patch_script`* | each refuses out of phase or outside the caller's ownership |
| build | `narrate`, `animatic`, `compose`, `check`, `lab_snapshot`*, `render_clip`*, `strips(beats)`, `render` | `render` refuses without a passing check; never forced by the agent |
| look | `contact_sheet(beats)`, `frames(times)` | return images for the lead or a sub-agent to look at |
| other families | `skeptic_review`, `critic_review` | call Gemini or OpenAI via `loom/agents/llm`; logged with real model and cost |
| delegate | `delegate(agent, beats or files, brief)` returns an owner token and limits; `collect(token)` returns the sub-agent's summary | in subscription mode the Task tool spawns the sub-agent; `delegate` records ownership and the brief first |
| approvals | `request_approval(kind, summary, files)` | pauses the run |
| ledger | `note(text, kind, beat)`*, automatic record of every tool call with the real model | fixes L-268 (actor) |

---

## 7. Data, cost and observability
- Every model call (lead, sub-agents, other-family tools) goes into `logs/llm_calls.jsonl` with the real model and
  tokens; subscription-mode calls log their usage and a notional API cost.
- `logs/shuttle/trace.jsonl`: phase transitions, reopens, delegations, approvals, budget.
- Final report `logs/shuttle/report.md`: cost per phase and per sub-agent, reopens and why, defects found by which
  check, what the lead looked at.
- Cache discipline: the playbook prefix and skill sections are byte-stable; a zero cache read where one was expected is
  logged as `cache_miss` and shown in the report.

---

## 8. How Shuttle is judged
- **S0:** mock end to end (scripted fake model): every rail refuses what it must; reopen invalidates; approvals pause;
  budget stops; ownership holds. Offline, in the suite.
- **S1:** one lesson in subscription mode on a topic Relay also made (the same request), Kshitij watches both,
  pairwise and blind; cost and wall time measured for both.
- **S2:** API mode on the same topic with a Sonnet lead, measured cost.
- Shuttle becomes the default only if it wins S1 pairwise and S2's cost is within the bounds Kshitij sets (D-97).

---

## 9. The prompt for Claude Code

```
You are working in the Loom Video-Engine folder. Build SHUTTLE, the single-lead-agent pipeline described in
docs/strategy/2026-10-08-shuttle-pipeline.md (read it all first). Relay (the existing pipeline in loom/agents/) stays
and keeps working. Read CLAUDE.md (Rule 0 and addendum), docs/context/README.md, docs/AGENT_LEARNINGS.md (L-239 onward),
docs/AGENTS_RUNBOOK.md, skills/loom/loom-director/SKILL.md, loom/agents/{conductor,runtime,tools,router}.py, loom/flow.py,
loom/stages.py, loom/ledger.py. Windows, Git Bash: `py`, forward slashes. Backup first (../Video-Engine-backup-<date>/
for loom/, tools/, tests/, skills/). No paid model call and no subscription-mode run without asking me first.
No em or en dashes. Never edit generated files. Logs append-only.

STEP 1. Verify the platform before designing code (Rule 0: run it, do not assume).
- Claude Agent SDK for Python: install only if I approve the download; read its current docs (context7 or the web):
  how to define sub-agents (AgentDefinition: description, prompt, tools, model), how skills are loaded, in-process MCP
  servers (create_sdk_mcp_server / @tool), hooks (PreToolUse to deny writes), max turns, budget options, how usage and
  cost are reported, how a session is resumed.
- Claude Code headless: `claude --help`; flags for print mode, --mcp-config, --agents (or .claude/agents/*.md),
  --append-system-prompt, --max-turns, --output-format stream-json, --permission-mode, --allowedTools; how sub-agents
  (Task tool) and skills behave in print mode; that ANTHROPIC_API_KEY must be absent from the child env for
  subscription billing.
- Write what you verified to docs/research/<date>-shuttle-platform.md (flags, sample outputs, anything that differs
  from the design). Where the platform cannot do what the design assumes, adapt the design and say so.

STEP 2. loom-mcp, the tool server with rails (loom/shuttle/).
- `loom/shuttle/rails.py`: the lesson state machine of section 3 (phases, gates from flow/gates, approvals facts/plan/
  final, reopen with stale marks and versions, budget per lesson/phase/sub-agent, file ownership tokens). Pure Python,
  persisted in projects/<id>/logs/shuttle/state.json.
- `loom/shuttle/server.py`: an MCP stdio server exposing the tools of section 6, reusing loom/agents/tools.py functions
  (do not copy logic). Every tool checks rails first and returns a short refusal that names the missing step.
- New pieces: `submit_kit` and the kit gate (syntax via node --check, determinism lint, tokens only, a kit preview scene
  snapshot looked at), compose loading scenes/_kit.js before beat scenes (if not already done by the Relay
  improvements of 2026-10-08: check CHANGELOG), `request_approval` + `py -m loom approve <id> plan|final`,
  `reopen`, `budget_status`, `delegate`/`collect`, `contact_sheet`, `frames`, `skeptic_review`, `critic_review`
  (calling loom/agents/llm with the other family), `read_artifact`, `get_world_pack`.
- Ledger: every tool call logged with the real calling model (the lead or the sub-agent named in the owner token).
- Tests (tests/suites/shuttle_rails.py, offline): out-of-phase refusal, approval pause, reopen invalidation, budget stop,
  ownership refusal, kit gate red and green, each red on purpose first.

STEP 3. Playbook and sub-agents.
- `skills/loom/shuttle-director/SKILL.md`: the lead's operating procedure (section 4), with phase-by-phase reading
  lists (short), definitions of done, delegation briefs (templates per sub-agent with exactly what to pass: beat spec,
  narration with timings, neighbours, cast, kit parts, style guide sections, the files it owns), when to look, when to
  reopen, and the recurring failures from AGENT_LEARNINGS as rules.
- `shuttle/agents/<name>.md` for fact-finder, kit-builder, scene-author, clip-author, fixer, researcher (section 5),
  plus a generator `py -m loom shuttle agents --emit claude|sdk` that writes .claude/agents/*.md and the SDK
  definitions from them (one source, two targets; a test that both carry the same tools and model).
- Hooks: a PreToolUse hook script that denies Write/Edit/Bash writes into projects/<id>/ except through loom-mcp, and
  denies edits to generated files.

STEP 4. Launchers.
- `py -m loom shuttle run <id> [--mode subscription|api] [--lead sonnet|opus] [--budget USD] [--approve-as ...]`,
  `py -m loom shuttle resume <id>`, `py -m loom shuttle status <id>`, `py -m loom shuttle report <id>`.
- Subscription mode: launches `claude -p` with the MCP config, agents, skills, the playbook as appended system prompt,
  stream-json parsed into the ledger (usage, notional cost), ANTHROPIC_API_KEY removed from the child env, phase
  sessions (a new `claude -p` per phase group, starting from notes.md), clean stop and resume on usage limits.
- API mode: the same through the Claude Agent SDK.
- Exit codes as Relay: 0 done, 2 failed, 3 waiting for a person, 4 budget, 5 out of credit.

STEP 5. Prove it without paid calls (S0).
- A mock lead: a scripted fake model (reuse loom/agents/llm/mock_server.py) that walks a small lesson through every
  phase, tries to skip a gate, tries to edit a file it does not own, reopens the storyboard once, hits the budget once.
  Assert the rails refuse and record each case. Run the full suite with and without --browser; context_check.
- Then STOP and report to me: what was built, the verified platform notes, the S0 results, and the exact commands for
  S1 (one subscription-mode lesson on the same request as the last Relay run) and S2 (API mode). Do not run S1 or S2.

LOGS: CHANGELOG, a D- entry (Shuttle added beside Relay; names), L- entries for anything that went wrong,
docs/AGENTS_RUNBOOK.md section for Shuttle, docs/context/STATE.md, and docs/research/<date>-shuttle-build-report.md.
```
