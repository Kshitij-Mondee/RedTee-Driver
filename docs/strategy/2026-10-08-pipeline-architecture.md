# The Loom pipeline: which architecture makes Cowork-quality lessons for less

STATUS: DESIGN, revised the same day after an independent critique (2026-10-08). Nothing here is built. Every cost
is an ESTIMATE from list prices and measured token counts; every quality claim about Loom is a hypothesis until the
experiments in section 8 run. Asked by Kshitij: find the best agentic pipeline, from scratch if needed, that makes
today's Cowork-quality Loom lessons for much less.

**Names (Kshitij, 2026-10-08):** the current API pipeline is **Relay**; the single-lead-agent pipeline (option B made
safe with rails) is **Shuttle**, specified in `docs/strategy/2026-10-08-shuttle-pipeline.md`. The A+ items below are
Relay improvements; Shuttle uses the same kit, checks and tools.

Inputs: an internal audit (numbers recomputed from `projects/bench-*/logs/llm_calls.jsonl` with `models.json`
prices), three web research passes (systems and papers that make explainer video, slides and motion graphics with
agents; agent patterns and cost techniques; how the market makes explainer video at scale), and a critique that read
the doc against the engine, 7 Cowork scenes in full and a classifier over all 70 (sources: section 10).

---

## 1. The answer

1. **Keep the current pipeline's shape. Do not rewrite Loom.** The stage chain with gates, parallel scene workers,
   defect router, deterministic renderer, checks and ledger is what the best published systems converge on. What is
   wrong is narrower: what the models are asked to write for drawn beats, how late the checks act, and that nobody
   approves the plan before the money is spent.
2. **Where Cowork's quality actually comes from** (critique, measured on mfa-story, groupthink-trap, phishing-report):
   mostly from **lesson-specific drawn sets and parts written once per lesson** (mfa's sign-in page with 6 states and
   phone with 5 states, groupthink's room and morphing bubbles, phishing's funnel world), then from choreography over
   them. 166 distinct designs in 213 tags, 124 used once; forms almost never reach a second lesson. So the unit of
   reuse is the **lesson kit**, not a global vocabulary.
3. **The recommended change, as increments on today's pipeline (option A+):**
   - **Lesson kit stage (new):** one strong-model session writes the lesson's sets and parts as code once, with named
     parts and states, proven by lab strips. Every beat then composes the kit.
   - **Beat Language = the storyboard's `design` block, made typed and compilable.** Today a bespoke beat already has
     `design {treatment, why_motion, elements, beat_sheet [{t_anchor, element, action, motion}], continuity}`
     (STORYBOARD_GUIDE). Make `action` and `motion` verbs from the motion vocabulary, elements kit or engine ids, places
     anchors (grid AND relational: on the sheet, above the person), and let a **compiler** turn it into runtime calls.
     The storyboard model writes it directly; no extra writer hop unless an experiment shows one pays.
   - **Verifier, code first:** the compiler emits expectations (life windows, reveal times per word, allowed overlaps,
     accent, framing); geometry at rest and in flight, and timing predicates, are checked by code with automatic fixes;
     one checklist critic from another model family runs last; taste stays with Kshitij, pairwise.
   - **Human checkpoint before the expensive part:** script plus animatic approved before kit and beats are built.
   - **Code beats stay first-class:** any beat the language cannot express is written as bespoke JavaScript with
     snapshots, as today, with a reason recorded, and no quota (a cap would act as a quota, L-240).
4. **What is cheaper, honestly:** API cost per lesson is **not** dramatically lower than the bench's (section 6: about
   $3 to $8 for 2 minutes with a Sonnet planner). The savings are: (a) no more runs that produce nothing (the bench
   spent $17.92, all unusable), because gates, the checkpoint and code-first checks stop bad work early; (b) cheaper
   beats once the kit exists (composition is short); (c) **the Claude Code subscription**: the same pipeline with
   Claude roles served by Claude Code headless costs $0 per lesson at the margin, limited by rate instead of money.
   For Kshitij's own production that is the largest saving available today.
5. **For a client or at scale** (API billing, many lessons), the cost levers are course-level caching, batch pricing
   for non-interactive stages, and later a small writer fine-tuned on accepted kits and beats (the ledger is the data).

---

## 2. Where we are (measured, 2026-10-08)

| fact | number | source |
|---|---|---|
| Bench 151439, five profiles, "2-minute" request | $1.44 to $5.51 per lesson; lessons ran 306 to 683 s, so $0.13 to $0.86 per minute; none usable | llm_calls.jsonl, post-mortem |
| Both benches | $17.92 over 620 calls | ledger |
| Spend split | uncached input 39 %, output 27 %, thinking 26 %, cache writes 6 %, cache reads 3 % | same |
| Storyboard share of planning | 35 to 70 % (48 to 78 % with the outline) | same, recomputed |
| Sonnet scene without snapshots | $0.06 (and 4 thrown scenes, 0 snapshots) | traces |
| Flash scene with snapshots | about $0.31 per accepted scene | traces |
| Code share of narrated time, recent Cowork lessons | 72 to 96 % (mfa-story, groupthink-trap, phishing-report) | storyboards x timings |
| Cowork scene size | median 2.5k (mfa, library in b01) to 10.5k characters | scenes/ |
| Cowork cost | not recorded (L-220) | |
| Render speed | about 10 frames a second (L-246), so about 6 min for 2 min of video | L-246 |

Why Cowork looks better (audit): full skills read; frames looked at and fixed; iteration on script and storyboard;
Opus planned; a person in the loop; Manim, Skia, Three rendered by hand; neighbours and cast known; the mix chosen per
lesson; **and lesson-specific kits written once and composed** (critique). Several of these now exist in the API path
(snapshots, look round, neighbours, cast, clip workers, capabilities), proven on mocks only.

---

## 3. What the evidence says (ranked; links in section 10; tags from the research passes)

1. **Typed planning hierarchy** (Code2Video: -41 points without the planner; LASEV 42 % vs 92 % publishable;
   CourseBlueprint contract 1.2 vs 5.0 engagement). Loom has it. Keep.
2. **A higher-level API beats raw code and lets smaller models work** (AutoPresent: GPT-4o 28.7 to 56.3 with a slide
   library, an 8B model 2.8 to 37.4; PPTAgent edit operations 95 % vs 74.6 %; Gamma: model writes loose markup, code
   lays it out). The lesson kit plus typed design block is Loom's version.
3. **Deterministic geometric checks beat a visual critic** (SGA: +10.1 vs +1.6, people preferred it 84 %; VLM
   aesthetic scores uncorrelated with layout errors). Loom's own vision judge: rho 0.34 with Kshitij (D-109).
4. **Timing as checkable predicates** (MoVer, SVG plus GSAP like Loom: 58.8 % to 93.6 % with predicate feedback).
   Motion and timing are every model's weakest axis (HeyGen benchmark, 2026: "text is laid out for the final frame,
   not for the path it travels").
5. **Scoped repair with a small budget** (Code2Video ScopeRefine; long self-repair without external signal gives
   little: Olausson, Huang).
6. **Discrete placement** (Code2Video anchor grid and occupancy table: -26.8 quiz points without it; models are
   insensitive to small numeric changes, PaperTalker).
7. **A checklist critic from another family, 1 to 3 rounds** (LASEV rubric critic +40 points publishable;
   ArtifactsBench checklist judging about 91 % agreement; holistic scores weak, VisJudge 0.43).
8. **Strong models for planning, cheap ones only inside strong scaffolding** (frontier models within 12 Elo on HeyGen's
   motion benchmark; successful-video quality flat across models in TheoremExplainAgent).
9. **Approve the storyboard before building** (HeyGen added it, July 2026).
10. **Measured cost levers**: caching (reads 5 to 10 % of input price), batch (50 %), advisor pattern, retrieval
    instead of preloading, diffs instead of rewrites.
11. **Avoid**: pixel video models for teaching content (Veo 3: 2.5 of 100 on TeachQuiz); low-level JSON scene graphs;
    doc-RAG for code (TheoremExplainAgent success 93.8 to 82.1 %); several agents writing one artifact.

Closest published system: Bespoke (MIT, 2026; five stages, HTML slides and code-drawn charts, cross-family validator,
programmatic checks first): about $0.22 per video minute, 87 % rated "standard MOOC or better". Slide-like; Loom aims
higher on motion, which is why kits and timing checks matter.

---

## 4. Architectures considered

| option | what it is | quality (expected) | API cost, 2-min lesson (est.) | verdict |
|---|---|---|---|---|
| A. Today's pipeline, tuned | parity context, snapshots, router, new gates | unmeasured: run plan steps 1 to 4 not run yet | $2 to $3 (run plan estimate) to $5 | **the baseline; run it first (E0)** |
| **A+. A with lesson kit, typed design block, compiler, code-first verifier, checkpoint** | section 1 item 3 | at least Cowork on kit-covered beats (to prove) | $3 to $8 (Sonnet planner; section 6) | **recommended direction** |
| B. One strong agent per lesson (the Cowork way, outside Cowork) | one session builds all, looking at frames | closest to Cowork today | Opus API $15 to $60 (unmeasured); **$0 on the Claude Code subscription, rate-limited** | **use now for Kshitij's own lessons via Claude Code; not for clients at scale** |
| C. Template only (LASEV, Vyond) | model picks and fills templates | the slide look Kshitij rejected | under $0.50 | rejected as the main path |
| D. Generated pixels | video or image models | fails on text, numbers, diagrams | $20 to $300 | rejected for content; image models only to draft kit art |
| E. Fine-tuned small writer | trained on accepted kits and beats | cheapest at volume | under $0.50 at volume | later, on top of A+ |
| F. Motion blueprints from recurring designs | turn split_futures, held_set_rewind, screen_beside_person into parameterised motion templates | good for recurring devices | low | do alongside A+ (the library flywheel) |

---

## 5. A+ in detail

### 5.1 Planning
- Stages as today, each closing at its gate and starting from the **shared cached prefix plus the accepted artifacts**
  (the L-244 shared block). A single long Director conversation was considered and dropped for now: it overflows 200k
  on long lessons, loses its cache at every human pause (knowledge gate, checkpoint) and grows on every gate failure.
  Experiment E4 can test it.
- **Planner model: Sonnet 5.5** under D-119 (no Opus in the API pipeline). Opus only with Kshitij's say-so, or on the
  Claude Code subscription profile where he already allowed it.
- **Thinking stays on for brief to storyboard (D-97).** Cost comes from fewer wasted runs and fewer re-reads, not from
  thinking less.
- The storyboard writes each drawn beat's `design` in the typed form directly and names the kit parts it needs.
- **Checkpoint:** Kshitij or the requester approves script plus animatic before the kit and beats are built.

### 5.2 Lesson kit (new stage)
- One Sonnet session (or Opus on the subscription) writes `scenes/_kit.js`: the lesson's sets, devices, screens and
  parts as named components with states, using kit characters by id (never improvised, D-122), style guide token
  roles, and the engine's places and objects underneath.
- Proven by a kit lab strip (each part, each state), looked at, before beats are built.
- Recurring kits are promoted to world packs and motion blueprints (option F): the flywheel finally has a unit that
  recurs.

### 5.3 Typed design block (Beat Language)
- Same fields as today's `design`, typed: elements are kit parts or engine ids; actions and motions are verbs of the
  motion vocabulary (reveal, settle, travel, morph, stamp, swap, magnify, count, rewind, ...); placement by anchor cell
  or relation; timing by spoken words (robust to re-timed narration); holds and exits by name; one accent.
- Written by the storyboard model; validated and compiled at submit, with deterministic autofix (unknown names
  fuzzy-matched, missing exits added, anchors moved to free cells).
- Every on-screen string is in the spec, so the grounding and sample-text audits cover drawn beats too (they skip
  bespoke code today, RC16).
- Cowork keeps its own way (D-127, standing direction 11): JS scenes remain first-class; the typed block is an option
  Cowork may use, never a forced switch.

### 5.4 Compiler
- Typed block to runtime calls (the calls bespoke scenes make today), deterministic, plus the expectations for the
  Verifier. Unit tests per construct; a lab strip per construct per guided style.
- Size (critique estimate): 3 to 4 weeks for a first version covering the top constructs; 6 to 10 weeks for broad
  coverage.

### 5.5 Verifier
1. Static: schema, ids, token roles from the style guide.
2. Geometry at rest and in flight (bounding boxes every 0.25 s): overlaps against expectations, frame and caption band,
   type size, heads in frame; mechanical fixes applied automatically, the rest returned scoped to the author.
3. Timing predicates from the spec: each element within 0.5 s after its word and never before, exits unless held,
   no blank frame while the voice speaks.
4. Today's film checks.
5. One checklist critic, other family, on contact sheets (polarity, labels, accent on the named thing, nothing
   childish or off-brief); at most 2 rounds per owner through the router.
6. Taste: Kshitij, pairwise within the style (D-109, D-122).

### 5.6 Code beats and clips
As today (bespoke JS with snapshots; Manim through clip workers). Skia and Three stay frozen (D-121, D-122) and are not
part of the typed vocabulary.

### 5.7 Operations
- Cost ledger for every path, Cowork included (L-220: Claude Code transcripts carry usage).
- Course-level shared prefix in one workspace; batch for overnight course builds.
- Ledger keeps spec, verdicts and ratings: data for GEPA prompt compilation and a later small-writer fine-tune.
- Fix found by the audit: on the API path, decision records name the wrong model (`ledger.actor()` uses the tier
  default), which corrupts the routing and fine-tuning data. Fix before any data use.

---

## 6. Cost (ESTIMATES; `models.json` prices: Sonnet 5.5 $2 in, $0.20 cached, $10 out; Opus 5.5 $4, $0.40 cached
in the registry, writes $5 or $8 for the 1-hour cache, $20 out; Flash $0.75, $0.075, $3.75)

2-minute lesson, 16 beats, 3 code beats, Sonnet planner:

| part | cost (est.) |
|---|---|
| Planning stages (85k shared prefix, 15 to 25 turns in all, 45k to 70k output with thinking) | $1.4 to $1.9 |
| Animatic look and revision | $0.1 to $0.2 |
| Fact skeptic | $0.02 to $0.04 |
| Lesson kit (one session, lab strip, 1 to 2 repairs) | $0.6 to $1.5 |
| Typed design blocks (inside the storyboard's output) | +$0.1 to $0.3 |
| 3 code beats with snapshots and repairs | $1.1 to $2.2 |
| Critic | $0.06 to $0.15 |
| Router repairs | $0.15 to $1.2 |
| **Total** | **about $3.5 to $7.5** ($1.75 to $3.75 a minute) |

With an Opus planner add about $1 to $2. If coverage is lower and 6 to 8 beats need code, add $1 to $3. On the Claude
Code subscription, every Claude row costs $0 at the margin (rate-limited); only Gemini or OpenAI checker rows bill.

Cheaper than today only in two senses: no money on runs that cannot be used, and $0 on the subscription. Per minute it
is in the range of the bench (which was unusable). The case for A+ rests on quality and reliability per dollar.

---

## 7. What changes in the repository

| keep | change | new |
|---|---|---|
| runtime, templates, blueprints, kits, packs, style guides, renderer, checks, ledger, gates, router, clip workers, look round, capabilities | storyboard writes typed `design`; checkpoint before kit and beats; ledger actor fix; Verifier upgrades (in-flight geometry, auto-fix, timing predicates) | `kit` stage and kit lab strip; compiler and expectation emitter; motion blueprints from recurring designs |

Nothing changes for existing lessons: `bespoke` stays the code kind.

---

## 8. Experiments, in order (cheap first; each has a stop rule)

- **E0. Baselines (no new code).** Run the run plan's steps 1 to 4 (option A tuned, measured cost and frames), and log
  one Cowork lesson's cost from its Claude Code transcript (closes L-220). Without these, "cheaper" has no denominator.
- **E1. Paper coverage (about a day, no compiler).** Write the typed block v0 down from mfa-story and groupthink-trap.
  Annotate held-out lessons (phishing-report, stress-signal, spacing-sticks): each beat as engine vocabulary, lesson
  kit, or code; weight by narrated seconds and story role. **Go if at least 60 % of narrated seconds are expressible
  with a kit, and at least 50 % of turn and reveal beats.** (Critique estimate: 25 to 40 % without kits, 60 to 75 % with.)
- **E2. Who writes the typed block (automatic metrics, no rating).** 15 held-out `design` blocks with their JS as the
  oracle. Arms: the storyboard model writes it directly; a cheap model (Luna, Haiku 4.5, Flash) from the `design`; the
  same from intent only. Metrics: compiles first time, autofix rate, life windows and cue times against the JS runtime
  trace.
- **E3. Compiler and Verifier v0, one lesson kit, 15 to 20 beats rendered.** Kshitij compares blind and pairwise
  against the Cowork originals, with ties and repeats. **Go if at least 70 % equal or better (lower 90 % bound at least
  55 %) and no loss on turn beats.**
- **E4. Planner.** Stages against one session; Sonnet against Opus (Opus arm only if Kshitij lifts D-119). Resumes
  counted in the cost.
- **E5. One lesson end to end,** against option A tuned and against the Cowork lesson on the same topic, cost measured.

D-97 holds throughout: nothing cheaper ships without a side-by-side.

---

## 9. Risks and open questions
- **Kits are where the craft is, and kits are code.** A+ does not remove expensive authoring; it does it once per
  lesson instead of once per beat. If kits are poor, beats are poor.
- **Coverage** may be below the E1 bar; then A tuned plus kits (without the compiler) is the fallback.
- **Compiler weeks** are only justified after E0 and E1.
- **Taste is human**; the design spends Kshitij's minutes at the checkpoint and the final, pairwise.
- **Prices are unsettled**: the registry has Opus cached reads at $0.40 while the research read $0.20 on Anthropic's
  page; "Haiku 5.5" ($0.10 / $0.50) appears on the page the research read but not in `models.json`; Flash list prices
  rise in 2027 per `models.json`. Re-check before any cost decision.
- **The subscription path** is rate-limited and for Kshitij's own use; client work needs API billing.

---

## 10. Sources (read by the research passes on 2026-10-08; their reports tag each claim as read in full, abstract
only or snippet; numbers are the authors')
- Code2Video https://arxiv.org/abs/2510.01174 ; TheoremExplainAgent https://arxiv.org/abs/2502.19400 ; SGA
  https://arxiv.org/abs/2607.18116 ; MoVer https://arxiv.org/abs/2502.13372 ; LogoMotion https://arxiv.org/abs/2405.07065 ;
  LASEV https://arxiv.org/abs/2602.11790 ; Bespoke https://arxiv.org/abs/2609.26540 ; CourseBlueprint
  https://arxiv.org/abs/2606.20608 ; AutoPresent https://arxiv.org/abs/2501.00912 ; PPTAgent https://arxiv.org/abs/2501.03936 ;
  Paper2Video https://arxiv.org/abs/2510.05096 ; Animation2Code https://arxiv.org/abs/2606.28593
- HeyGen Code2Video benchmark https://www.heygen.com/research/introducing-code2video-benchmark ; HyperFrames
  https://github.com/heygen-com/hyperframes ; HeyGen July 2026 release https://www.heygen.com/blog/heygen-july-2026-release
- Gamma https://vercel.com/customers/gamma-builds-design-first-agents-with-vercel ; v0
  https://vercel.com/blog/how-we-made-v0-an-effective-coding-agent
- Anthropic https://www.anthropic.com/research/building-effective-agents ,
  https://www.anthropic.com/engineering/multi-agent-research-system , https://claude.com/blog/the-advisor-strategy ,
  https://anthropic.com/engineering/advanced-tool-use , https://platform.claude.com/docs/en/about-claude/pricing ;
  Cognition https://cognition.com/blog/multi-agents-working
- GEPA https://arxiv.org/abs/2507.19457 ; LLMCompiler https://arxiv.org/abs/2312.04511 ; self-repair
  https://arxiv.org/abs/2306.09896 , https://arxiv.org/abs/2310.01798 ; judges https://arxiv.org/abs/2507.04952 ,
  https://arxiv.org/abs/2510.22373 , https://arxiv.org/abs/2402.04788
- Prices: https://openai.com/api/pricing/ , https://ai.google.dev/gemini-api/docs/pricing ,
  https://api-docs.deepseek.com/quick_start/pricing , https://invideo.io/blog/ai-video-model-pricing
- Kurzgesagt process https://kurzgesagt.org/youtube/
