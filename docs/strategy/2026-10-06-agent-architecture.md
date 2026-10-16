# Loom outside Cowork: the agent architecture (D-115)

STATUS: BUILT 2026-10-06, proven on mock providers only. No paid call has been made: the sandbox network blocks
OpenAI and Gemini and its proxy rejects outside Anthropic keys. Kshitij runs the first real bench on his PC
(`py -m loom agents bench`, section 9). Builds on the brain design (D-96,
`docs/strategy/2026-10-02-brain-architecture.md`) and the no-compromise rule (final-goal doc, rule 0).

## 1. What Kshitij asked for
- Run the whole pipeline outside Claude Cowork, through APIs: Claude, OpenAI (ChatGPT models) and Gemini, so smaller
  models can be used wherever they hold quality.
- Agents only where judgement is needed; a robust Python pipeline everywhere else. No "API call reads the skills
  forever" agents.
- Smart agents with the right tools, well guarded, communicating through fixed schemas, efficient with tokens.
- Production-shaped: works well now, expands later, with the future steps written down.
- Storyboarding on a strong model that is not Opus; best result for the price; compare 3 to 5 model combinations.

## 2. The design rule
**Code decides, agents judge, verifiers check, and every hand-off is a schema.**

- **Code** owns everything deterministic: ingest, allocation, narration, cue resolution, compose, the checks, render,
  routing, budgets, retries, state, logging. A model never routes itself and never decides whether it runs.
- **An agent** exists only where the output is a judgement that no rule can make: what the lesson is (brief), what
  is true (knowledge), how it teaches (pedagogy), what is said (script), what is shown (storyboard), the drawing
  code of a bespoke beat (scene), and whether the frames work (critic).
- **A decision** (a bounded choice from known options) is not an agent: one structured call to a small model with a
  fixed answer schema (persona pick today; template, join and severity choices later, the Jev or Laya slot of D-95).
- **A verifier** never belongs to the worker it checks. The engine's gates are the first verifier (code); the
  skeptic (truth) and the critic (picture) are model verifiers from a different family than the author where the
  profile allows.

## 3. The shape
```
                     project.json (request)                       human gates (knowledge approval, look at sheets)
                           |                                                   ^
        +------------------v--------------------------------------------------+------------------+
        |  CONDUCTOR (code, loom/agents/conductor.py)                                               |
        |  stage graph (loom/stages.py) -> for each runnable stage: code stage, decision, or agent   |
        |  routing profile -> model per role | budget guard | retries and escalation | shadow mode   |
        |  ledger: decisions.jsonl (D-97), llm_calls.jsonl, traces/<task>.jsonl, versions/           |
        +-----+----------------+------------------+------------------+--------------------+----------+
              | TaskSpec       | TaskSpec         | TaskSpec x N     | TaskSpec           | code stages
        [brief/knowledge/ [storyboard:        [scene workers,   [critic: sheets ->  ingest, allocate,
         pedagogy/script]  outline, then       one per bespoke    findings]          narrate, compose,
              |            full storyboard]    beat, parallel]       |               check, render
              v                 v                  v                 v
        AGENT RUNTIME (loom/agents/runtime.py): one tool loop for every role
        role card (system, cached) + task message -> tools -> submit_<artifact> -> gate -> accepted | repair
              |
        TOOLS (loom/agents/tools.py): typed, schema-checked, permission-scoped per role
        read: skill sections, source chunks, facts, catalog, style, beats, examples, API sections
        act:  submit_<artifact> (writes + runs the stage gate), lab_snapshot (renders frames), report_finding
              |
        PROVIDERS (loom/agents/llm/): anthropic | openai (chat) | gemini, one normalised request/response,
        prices and capabilities in loom/agents/config/models.json
```

## 4. Agents, one by one
| role | why an agent | model class (default) | tools | output (schema) | guard |
|---|---|---|---|---|---|
| brief | decides outcome, through-line, arc: judgement | strong | skill sections, source chunks | `submit_brief` (brief.schema) | brief gate |
| knowledge (topic mode) | conservative facts: judgement | strong | skill sections | `submit_knowledge` | knowledge gate, then skeptic, then HUMAN approval |
| skeptic | truth verifier, a different family | small | fact lookup | `submit_skeptic_verdict` (contracts/skeptic) | findings go back to knowledge once |
| pedagogy | how it teaches | strong | skill sections, facts | `submit_teaching_plan` | pedagogy gate |
| persona | a bounded pick among packs/personas | DECISION (small) | none | `submit_persona_pick` | code copies the pack; writes only when the pick is valid |
| script | what is said | strong | facts, skill sections | `submit_script` | script gate (grounding, dashes, timing) |
| storyboard | what is shown: the most judgement-heavy stage | the profile's best non-Opus planner, full thinking | catalog search and entries, style pack, beats, skill sections | pass 1 `submit_outline` (contracts/outline), pass 2 `submit_storyboard` | outline contract + plan checks, then the storyboard gate |
| scene (N, parallel) | bespoke drawing code for one beat | build model | API sections, example scenes, style pack, `lab_snapshot` (sees its own frames) | `submit_scene` | syntax + scenes gate on its file, render-in-the-loop |
| critic | judges contact sheets as pictures | vision model, other family | none (sheets in the message) | `submit_review` (review.schema) | findings must name a beat; routed by code |
| tweak | small scoped edits from a note | cheap | file read | `submit_tweak` | scope check: only the named files |

Stages that stay code: ingest, allocate, narrate, compose, check, render, harvest, seed, cue resolution, continuity
(V5), number grounding (V1/V2), cost and time accounting.

## 5. Contracts (fixed schemas between parts)
- **TaskSpec** (`contracts/task.schema.json`): role, project, stage, target artifact, input refs (paths and hashes),
  constraints, model ref, limits (turns, tool calls, tokens, dollars, seconds), max repair rounds, trace id.
- **AgentResult** (`contracts/result.schema.json`): status (`accepted`, `rejected`, `budget`, `limits`, `error`), the
  artifact path, gate errors left, findings, usage (tokens in, cached, out, thinking), cost, turns, tool calls, model,
  provider, duration, trace path.
- **Finding** (`contracts/finding.schema.json`): severity (blocker, major, minor), where (stage, beat, field or region),
  what, evidence, fix route (`storyboard`, `scene`, `script`, `knowledge`, `human`). Skeptic and critic both emit it.
- **Outline** (`contracts/outline.schema.json`), **SkepticVerdict**, **PersonaPick**, **SceneSubmission**,
  **TweakResult**: the role outputs that had no engine schema.
- Engine artifacts keep their existing schemas (`loom/schemas/*.schema.json`) and gates. Agents never write a file
  except through their submit tool, so an artifact on disk has always passed schema validation.

## 6. Guards (every agent is well behaved by construction)
- **Tool allow-list per role;** arguments validated against each tool's JSON schema before it runs; a tool error is
  returned to the model as data, never raised past the loop.
- **Writes only through submit tools**, only to the stage's own output path (scene workers: only `scenes/<beat>.js`).
- **Limits per task:** turns, tool calls, output tokens, wall time, dollars. Exceeding any stops the task with status
  `limits` or `budget`; nothing is half-written.
- **Budget guard:** before every call the estimated worst case (prompt estimate x input price + max_tokens x output
  price) is checked against what is left of the task, run and provider caps (`--budget`, `--provider-cap`); after the
  call the real usage is booked. A call that could cross a cap is not sent.
- **Loop detection:** the same tool with the same arguments three times ends the task.
- **Terminal tool:** a task ends only through its submit tool (accepted, or out of repair rounds). Free text is not an
  artifact.
- **Repair is narrow:** a failed submit returns the gate errors; after `max_repairs` the conductor escalates one model
  tier once, then marks the stage for a human. It never loops forever and never passes silently.
- **Prompt injection:** source documents and tool results are wrapped as data; `_shared.md` rule 2 says so; the
  submit tools only accept the artifact shape, so injected text cannot add tools or paths.
- **Secrets:** keys read from `.env` at call time, sent only in the provider's auth header, never logged; logs redact
  `key`, `authorization` and `x-api-key`.
- **Human gates stay:** the knowledge sheet stops the run until approved (`--approve-knowledge-as "<name>"` records an
  unattended approval as such); the conductor never renders without a passing check.

## 7. Token efficiency (without cutting thinking where judgement is the product)
1. **Role cards instead of whole skills.** A card is about 0.9k to 1.7k tokens (`loom/agents/roles/`), against 10k to
   55k per skill today; depth arrives by `get_skill_section`, only the section asked for.
2. **Retrieval instead of inlining:** source chunks by query, catalog entries by id, beats by id, API sections by
   name. The storyboard no longer receives the whole catalog; it searches it.
3. **Stable cached prefixes:** shared rules + role card + tool list first and unchanged across calls; Anthropic gets
   `cache_control` on the last system block and the tool list; OpenAI and Gemini cache stable prefixes on their own.
   Scene workers of one lesson share one prefix.
4. **Tool results are compacted:** large results are truncated with a handle; on long loops old tool results are
   replaced by a one-line summary.
5. **Coarse to fine:** the storyboard outline is small and cheap to repair; pass 2 fills it.
6. **Narrow repair:** a failed gate sends back only the errors.
7. **Decisions on small models;** verifiers on small models from another family.
8. **Batch later** (50 % off) for scene workers nobody is waiting on (roadmap).

## 8. Providers
One normalised request (system blocks with cache flags, messages with text, images, tool calls and tool results,
tools, tool choice, response schema, max tokens, effort) and one normalised response (text, tool calls, stop reason,
usage with cached and thinking tokens, latency). Adapters speak each wire protocol with the standard library:
- **anthropic** - Messages API: tool use, `cache_control`, thinking by budget or adaptive, images.
- **openai** - Chat Completions: function tools, `response_format` json_schema, `reasoning_effort`, image URLs.
  The same adapter serves any OpenAI-compatible server (vLLM on the pod, OpenRouter, local).
- **gemini** - generateContent: function declarations, `responseJsonSchema`, `thinkingConfig`, inline images, and
  the thought signatures Gemini 3 returns are passed back unchanged.
Retries: 429 and 5xx with backoff and `retry-after`; never on 400 or 401; a 400 that says the context is too long
raises `ContextOverflow` at once (L-209).

Models, prices and capabilities live in `loom/agents/config/models.json` with the date and page they were read
from. `py -m loom agents doctor` lists each provider's real models with the keys on the machine and fails on any
profile model the provider does not serve (Rule 0: the price table is a promise, the provider is the fact).

## 9. Routing profiles and the bench
Profiles (`loom/agents/config/profiles/*.json`) map each role to a model. Shipped:
| profile | planning (brief, pedagogy, script) | storyboard | scenes | small roles (persona, skeptic, critic) |
|---|---|---|---|---|
| `claude-balanced` | Sonnet 5.5 | Sonnet 5.5 | Sonnet 5.5 | Haiku 4.5 |
| `openai-balanced` | GPT-6.1 Sol | GPT-6.1 Sol | GPT-6.1 Sol | GPT-6 Luna |
| `gemini-balanced` | Gemini 3.1 Pro | Gemini 3.1 Pro | Gemini 3.8 Flash | Gemini 3.5 Flash-Lite |
| `mixed-value` | GPT-6.1 Sol | Sonnet 5.5 | Gemini 3.8 Flash | GPT-6 Luna (critic: Gemini 3.8 Flash, another family) |
| `budget` | Gemini 3.8 Flash | GPT-6.1 Sol | Gemini 3.8 Flash | GPT-6 Luna |

Opus is in no profile's storyboard (Kshitij, 2026-10-06). `py -m loom agents bench --topic "..." --profiles a,b,c
--until storyboard --budget 4` runs the same request through each profile into its own project, gates every stage,
and writes `bench/<run>/REPORT.md`: per profile the stages passed, repair rounds, gate errors and warnings left, plan
check warnings, tokens, cost and time, plus the storyboard's device set and value script side by side for a person
to judge. Profiles whose key is missing are listed as skipped, never silently absent.

## 10. Observability
- `projects/<id>/logs/llm_calls.jsonl`: one line per call (role, provider, model, tokens in, cached, out, thinking,
  cost, latency, stop reason, trace id). Append-only.
- `projects/<id>/logs/traces/<task>.jsonl`: each turn's tool calls (name, argument hash and size), results (size,
  error), and the submit verdicts.
- The decision ledger (D-97) gets `model_call`, `gate` and `routing` records, as agent mode already logs them.
- `py -m loom agents report <id>`: cost, tokens and time per stage and role.

## 11. What is proven, and what is not
**Measured (estimate: characters / 3.6):** the cached system prefix per call, old API mode (whole skills + prompt
pack) against the role card + artifact shape:

| stage | old | new |
|---|---|---|
| brief | 6,030 | 2,551 |
| pedagogy | 10,346 | 2,696 |
| script | 25,987 | 2,653 |
| storyboard | 50,360 | 4,816 |
| scene (per beat) | 49,303 | 2,360 |
| review | 15,662 | 2,410 |

About 9x less prefix per call; depth is fetched per section on demand, so the real saving depends on how many
sections a model asks for (to be measured in the bench traces).

- **Proven on mock providers** (tests in `tests/suites/agents_*.py`): each adapter against its wire protocol (tool
  round trips, caching numbers, errors and retries); the tool loop's guards (allow-list, schema-checked args, loop
  detection, limits, budget refusal before sending); submit tools that write only after the gate; the conductor
  running a lesson's planning stages through agents end to end with gates passing; a broken artifact repaired from
  gate errors; the bench report.
- **Not proven:** any real provider call, real model ids and prices on the day (doctor checks them), quality of any
  profile, Gemini thought-signature handling against the real API, OpenAI's newest models on Chat Completions, scene
  workers on a real model with real snapshots, cost per lesson.

## 12. Future steps (in order; each proven before the next)
1. **Real bench** on Kshitij's PC: 3 to 5 profiles to storyboard on one 2-minute topic; pick defaults from the report
   and his look at the outlines.
2. **Scene workers on real models** with render-in-the-loop, Sonnet-class against Flash-class on the same beats
   (D-98 conditions), shadow mode on.
3. **Shadow mode as data:** every swap of a model runs beside the current one on real lessons; agreement and gate
   outcomes in the ledger; switch only on evidence (rule 0).
4. **Outline animatic + critic (V4 at outline level)** before pass 2, and a simulated learner (V3) after the script.
5. **Batch API** for scene workers and reviews (50 % off), and the 1-hour cache for the shared scene prefix.
6. **Decision models** (Jev, Laya) for bounded choices, trained and judged on the ledger.
7. **The lesson graph** (D-96 B0): field ownership and provenance, incremental re-planning of one beat.
8. **Service shape:** a job queue (one worker per stage kind), a small HTTP API over the conductor, per-tenant keys,
   budgets and storage, OpenTelemetry export of the traces, and an MCP server exposing Loom's tools to outside agents.
9. **Course level:** lessons as sub-graphs sharing truth and objectives (B7).
10. **Evals per role:** golden inputs, planted defects, regression lessons; a role card or model change ships only if
    its eval does not get worse.
