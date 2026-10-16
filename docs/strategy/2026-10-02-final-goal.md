# Loom's final goal: fast, cheap and run by a modular brain (RECORDED, not to build yet)

STATUS: RECORDED 2026-10-02 (D-95). Kshitij's direction. **Nothing in this file is to be built yet.**

**The priority now:** get the videos to at least 95 % of their full potential, both visually and as L&D. That work is
`docs/strategy/2026-10-02-corporate-readiness-plan.md`. This file is the destination after it, written down so the
quality work does not make it harder.

## 0. The no-compromise rule (Kshitij, 2026-10-02; outranks everything below)
- **No important step is cut, shortened or skipped to save cost or to gain determinism.** Every stage, gate and
  human look stays.
- **Thinking stays on where judgement is the product:**
  - brief, knowledge, pedagogy, script and, above all, the storyboard run with full thinking;
  - scene authoring and review run at the effort their evals show they need, not at the cheapest effort that
    happens to pass once.
- **A cheaper model, a lower effort or a decision model replaces a call only after shadow mode shows no loss:** it
  runs beside the current decider on real lessons, both answers are logged, and agreement and outcomes are measured
  on held-out lessons. Kshitij agrees before the switch. The evidence decides, not the price.
- **Determinism is about frames, not plans.** A frame is a pure function of the plan files (rule 3). A planner may
  think, explore and vary. Its decisions are written into the plan files and the ledger, so they can be replayed.
- **Savings come first from what costs no quality:** reuse from the library, prompt caching, batch for work nobody
  is waiting on, and incremental recompute of only what changed.
- **Log every decision now** (D-97, `loom/ledger.py`). The future routers, decision models and fine-tunes are
  trained and judged on this data, so it is collected from today, not when it is needed.

## 1. The goal, in Kshitij's words and in numbers
- **Speed:** a **30-minute** lesson from brief to rendered MP4 in about **90 minutes**. This corrects my earlier
  figure, which used a 7-minute lesson.
- **Cost:**
  - think less wherever thinking is not needed (refined the same day by rule 0: thinking stays wherever judgement
    is the product, and especially in the storyboard);
  - let **decision models** (such as Jev) make the bounded choices, where we already know which tool is needed for
    what;
  - polish the skills until **Sonnet writes the drawing code** that Opus writes today.
- **Brain:** a properly **modular brain** that does the storyboarding and the lesson plan. It is our own design, not
  RedTee's structure (D-96, `docs/strategy/2026-10-02-brain-architecture.md`).

## 2. What the research says (2026-10-02; sources at the end)

### 2.1 Decision models: Jev
- **What it is:** a "System One model" from TypeSafe AI, released 15 Sep 2026 in early access. You send a state
  plus typed questions. It returns only answers from the set you defined, each with probabilities and a confidence
  score.
  - Question types: Choice (up to 255 options), Score (an ordered rubric of 2 to 10 levels) and Noul (a 0 to 1
    "is this true?").
  - It cannot write, explain or make code.
- **Vendor figures:**
  - input $0.042 per million tokens, output free;
  - 70 to 500 ms per call;
  - "40x to 200x faster" than frontier LLMs on decision-shaped work;
  - no public benchmarks, by choice.
- **Independent view (DataNorth, one week after launch):** every figure is vendor-supplied; no independent
  evaluation exists yet.
- **Documented weak spots:**
  - text input only, 64k context;
  - not a calculator, and it reads dates as text;
  - accuracy falls on multi-hop reasoning, double negatives, and states padded with irrelevant content;
  - not deterministic, though it is designed for consistency.
  - "Zero hallucinations" means it cannot invent an option, not that it always picks the right one.
- **Its design rule fits Loom:** each question should be a judgement an expert makes in a few seconds. Anything
  that needs a chain of reasoning is split into several questions and combined in code.

#### 2.1b Laya, the open and trainable counterpart (added 2026-10-03)
Laya is an open-source (Apache 2.0) decision model from Convai Innovations, released in September 2026: about 421M
parameters, Jev's question types, local and fine-tunable. It had very fast attention: about 7,900 GitHub stars in
three days, by secondary report. Out of the box it is weaker than Jev on wide option sets and calibration. Tuned on a
task's own labelled data it can match Jev. That makes the decision ledger (D-97) its training set.
Research note: `docs/research/2026-10-03-decision-models-jev-laya.md`.

## 2.2 Routing and cascades
- **FrugalGPT (2023):** three levers to cut cost: prompt adaptation, model approximation, and cascades (cheap model
  first, escalate when needed).
- **RouteLLM (ICLR 2025):** over 85 % lower cost on MT Bench at 95 % of the strong model's quality, sending only
  14 % of queries to the strong model.
- **Industry write-ups (2025-26):** 20 to 60 % savings at the same quality in production. These are secondary
  sources, weaker evidence.

### 2.3 Anthropic's own levers (pricing page, read 2026-10-02)
| model | input / output per MTok | batch (50 % off) |
|---|---|---|
| Fable 5.1 | $10 / $50 | $5 / $25 |
| Opus 5.5 | $4 / $20 | $2 / $10 |
| Sonnet 5.5 | $2 / $10 | $1 / $5 |
| Haiku 4.5 | $1 / $5 | $0.50 / $2.50 |

- **Prompt caching:** a cache read costs 0.1x the input price. A 5-minute write costs 1.25x, a 1-hour write 2x.
  Caching stacks with batch.
- **Thinking is billed as output tokens**, even when it is not shown. Newer models use adaptive thinking steered by
  the `effort` parameter, and `usage.output_tokens_details.thinking_tokens` reports what was spent.
- So unneeded thinking is a real cost (rule 0 decides where it is unneeded). At $20/MTok output on Opus 5.5, unneeded reasoning can be the largest line on
  a planning call (not yet measured in Loom).

## 3. Where Loom spends today (measured where possible)
- **Model stages per lesson** (`py -m loom cost`):
  - feedback-that-lands: 6 plan tasks and 25 build tasks;
  - phishing-report: 6 plan tasks and 34 build tasks.
  - In both, most build tasks are one per bespoke scene: 23 and 32 bespoke beats. Every one is code written from
    nothing.
- **Tokens and money: NOT measured.**
  - Agent mode (Cowork) records no token use.
  - API mode does write a ledger (`loom/agent/api.py`, `_ledger`) and caches the system prompt, but it has no
    effort setting, no batch and no decision layer, and it has not been run on a full lesson.
  - For comparison only: RedTee's own docs say "authoring ~120k tokens/lesson" (not checked here).
- **Wall clock: about 7 3/4 h for two 7-minute lessons** in the sandbox (reconstructed from file times, an
  estimate). The causes:
  - the sandbox's 3-minute cap on each call;
  - most beats written as code;
  - a first-run debugging tax;
  - a frame cache that every fix throws away.

## 4. How the goal is reached (the design to build LATER)

### 4.1 Three kinds of work, three kinds of engine
| kind of work | examples in Loom | who does it |
|---|---|---|
| **Decide** (a bounded choice from known options) | which template or blueprint for a beat; join type and its meaning; shot size and move; seed axes; style pack for a brief; whether a beat needs bespoke motion; severity and fix route for a check warning; whether a reference board is relevant; which model tier a task needs | **code first** (a rule or table), else a **decision model** (Jev-shaped: Choice, Score, Noul), with escalation to an LLM below a confidence threshold |
| **Write** (language or code) | knowledge sheet, script, storyboard design notes, scene code, review notes | an LLM, at the **cheapest tier the skill makes reliable**: Sonnet for scene code and persona, Opus only where judgement is the product (brief, pedagogy, storyboard) |
| **Compute** (deterministic) | allocation, cues, compose, layout fit, checks, render, captions | code. No model, ever (rule 3) |

**Determinism stays intact.** A decision model is not deterministic, so its answers are made at authoring time and
written into the plan files (storyboard, seed, allocation) with their confidence. Frames remain a pure function of
those files. A re-run re-decides only when asked.

### 4.2 Spend thinking where it pays, and prove any reduction (revised under rule 0)
- **Effort per stage, pinned in config and logged on every call:**
  - full thinking for brief, knowledge, pedagogy, script and storyboard. These are never reduced for cost;
  - scene code, review and tweaks start at full effort too. They come down only when shadow-mode evals show no loss.
- **Code decides whether an agent runs** (RedTee rule): agents never route themselves.
- **Cache the constant part** (skills, catalog, SCENE_API, style pack) as a 1-hour cached prefix, shared by every
  scene task of a lesson.
- **Batch** the parallel build tasks (scenes, reviews) when nobody is waiting on them: 50 % off.
- **A cost ledger on every call**, in agent mode too, keyed by stage, model, effort, thinking tokens and cache hits.
  A cost claim has a ledger line behind it.

### 4.3 Sonnet writes the drawing code
The scene skill becomes good enough that Sonnet writes a correct scene first time, at whatever effort its eval shows it needs:
- **A cookbook of approved scenes:** every promoted design (`library/`) carries its scene file as a worked example,
  and the task file pulls the 2 or 3 closest by design tag.
- **Builders, not geometry.** The more a scene calls `Loom.ui`, `Loom.data`, `Loom.place`, `Loom.obj` and templates,
  the less there is to get wrong. Phase 1 and 2 of the corporate plan are this, done for quality.
- **Lints that fail fast and say how to fix**, run in the sub-agent's own loop before review: bounds, overlap,
  reading floor, residue, literal colours.
- **A measured gate:** Sonnet-written scenes vs Opus-written ones on the same beats, judged on sheets and on check
  errors per scene. The skill is "polished" when Sonnet matches Opus there.

**Kshitij's order (2026-10-03, D-98).** Smaller, cheaper models write scene code: Sonnet, and later cheaper still
(a Gemini Flash class model). They do so **only after all three of these hold:**
1. **The plan is solid:** the brain's verifiers (contract, truth, learning, picture, time and continuity) pass at
   the outline and storyboard levels, and the storyboard is made by the strongest planner with full thinking.
2. **The library carries the drawing:** references, templates, blueprints, builders and approved example scenes
   cover what lessons need, so a scene is mostly composition, not invention.
3. **The skills are proven on the cheaper model:** in shadow mode, on the same beats, its scenes match the peak
   model's (check errors per scene, first-time pass rate, the picture critic's verdict and Kshitij's look).

The switch is per model and per kind of scene. A model that matches on template-heavy beats may still need to
stay off hero beats. Every scene records which model wrote it (the ledger's `by.model`, `LOOM_ACTOR`), so the
comparison builds up from today.

### 4.4 The modular brain (SUPERSEDED the same day, D-96)
The first version of this section proposed rebuilding RedTee_V1's Layer 1 shape: four analysts, one storyboard
brain and a course brain. Kshitij rejected that: not a copy of RedTee's structure or agent count, but a better and
more reliable design of our own. That design is `docs/strategy/2026-10-02-brain-architecture.md`. Its shape is one
lesson graph with field ownership and provenance, a code conductor, narrow workers, five kinds of independent
verifier including a picture critic and a simulated learner, coarse-to-fine planning, and per-module evals.

### 4.4b The data foundation (D-97): what is logged now, for later
| data | where | later use |
|---|---|---|
| every decision with its inputs (features), who decided (code, agent tier and model, human), why, options and confidence | `projects/<id>/logs/decisions.jsonl` | routers, decision-model training sets (Jev-style Choice, Score, Noul), and when-to-escalate rules |
| every version of every model-stage artifact, accepted and rejected | `projects/<id>/logs/versions/<stage>/` | supervised pairs (inputs to accepted output), corrections (rejected to accepted), skill examples |
| outcomes: gate errors, check errors per beat, review findings, render verify | the same ledger, linked to the decision by node | labels: which decisions turned out well |
| human overrides: `switch`, `tweak`, seed `--set`, approvals, forced renders | the same ledger | preference data (what a person chose over what the engine chose) |
| orchestrator fixes and deviations | `py -m loom note <id> "<text>" --beat --kind fix\|routing\|tooling\|finding` | correction data, and the reasons behind it |
| model calls with tokens and thinking (API mode) | the same ledger plus `qa/llm_ledger.json` | cost and effort curves |
| all lessons merged | `py -m loom ledger export` writes `datasets/decisions.jsonl` (generated) | one dataset for training and evaluation |

**Data rules:**
- A client's content may sit in these logs. It is used for training only with that client's consent, and it is kept
  per client.
- Backfilled records are marked `backfilled` (weaker evidence).
- The logs are append-only like every other Loom log.

### 4.5 Speed, to reach a 30-minute lesson in about 90 minutes
1. **Run outside the sandbox** (PC or server): parallel narration, render and scene tasks, background jobs, no
   3-minute cap (`docs/PORTABILITY_CHECKLIST.md`).
2. **Library first:** most beats are templates or blueprints with props (seconds, not minutes). Only hero beats are
   bespoke.
3. **Incremental everything:** the frame cache per beat, TTS per phrase (already), render per segment (already), and
   check per changed beat.
4. **Auto-fix instead of warn:** reading-floor auto-hold, chip budget, and literal colours.
5. **Stage timing in `state.json`** (start and end per stage), so each run reports where its 90 minutes went.

## 5. What to keep doing now so this stays reachable (no extra work)
- **Quality work that is also library work:** `Loom.ui`, `Loom.type`, templates that fill the frame, and a
  designed cast. This is the same work the corporate plan already lists.
- **Keep decisions as data:** template, join, shot and seed choices stay as fields in the storyboard, never buried
  in scene code. Then a decision model can take them over later.
- **No new hand-maintained name lists** where a catalog can be generated (RedTee Rule 0 lesson).

## 6. Open questions for later (not now)
- Jev is early access, text only and US-hosted. Before using it: a data-handling check for client documents, and
  an evaluation on Loom's own decisions (agreement with Opus, calibration at 0.9 confidence, p95 latency).
- Is effort tuning enough on its own, so that a decision model is only needed for very high-volume calls (review
  triage, reference scoring)? Measure first.
- Should the Loom brain import RedTee's analyst skills through the bridge (read-only), or keep its own? Decide when
  the modules are designed.

## Sources
- [Introducing System One Models & Jev (TypeSafe AI, 15 Sep 2026)](https://typesafe.ai/blog/introducing-system-one-models-and-jev)
- [Jev: What it is and why this new model matters (DataNorth, 25 Sep 2026)](https://datanorth.ai/blog/jev-what-it-is-and-why-this-new-model-matters)
- [FrugalGPT (arXiv 2305.05176)](https://arxiv.org/pdf/2305.05176)
- [RouteLLM (Berkeley Sky Lab)](https://sky.cs.berkeley.edu/project/routellm/)
- [LLM routing and model cascades (2025 write-up)](https://tianpan.co/blog/2025-11-03-llm-routing-model-cascades)
- [Claude pricing](https://platform.claude.com/docs/en/about-claude/pricing), [prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching), [extended thinking](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)
- RedTee_V1 (read-only): `docs/context/AGENTS_AND_FLOWS.md`, `Layer1/brain/BRAIN_FLOW.md`, `Layer1/models.json`
