# Loom's brain: a proposal for a reliable planning architecture (DESIGN)

STATUS: DESIGN 2026-10-02 (D-96). Kshitij asked for my own design, not a copy of RedTee's analysts. This replaces
section 4.4 of `docs/strategy/2026-10-02-final-goal.md`. Whether parts of it are built before the 95 % quality bar
is his call (section 7).

## 1. What the brain must get right (from our own runs, not from theory)
Every failure below happened in Loom, and most were found only by looking at frames:

| failure | where it came from | what would have stopped it |
|---|---|---|
| the plain lesson's middle was a run of near-empty cards (ten of the eleven beats b08 to b18) | the storyboard chose templates beat by beat and never saw the sequence | judging the PLAN as pictures, at outline level, before any build |
| a headline printed over another; a title over a kept board; leftover text on a returning station | no one owned what is on each station across beats | one owner of cross-beat continuity, in code |
| narration ran 9 s past the picture (quiz tail) | the script and the visual plan were made separately and only met at check | a check that pairs every spoken line with something on screen, at plan time |
| a push zoomed onto empty board | scene code assumed geometry it could not see | scene workers that see their own render and repair against it |
| facts approved "unattended" | no human read the knowledge sheet | a real approval gate for anything sold; a skeptic pass before it |
| the same 4 labels cluttered every frame | each scene author worked alone | budgets checked on the rendered frame, fed back to the author |

The research says the same thing more generally:
- **Multi-agent systems fail mostly from design, not model weakness.** In the MAST study the failures were
  specification issues, misalignment between agents, and weak verification (Berkeley, NeurIPS 2025).
- **Flow beats prompt.** A test-driven generate, run and fix loop more than doubled code accuracy over one strong
  prompt (AlphaCodium: 19 % to 44 %).
- **Render-and-look loops** make vector graphics markedly better than drawing blind (Render-in-the-Loop, IntroSVG,
  GVR-Coder).
- **Use the simplest workflow that passes evaluation;** add autonomy only where the path cannot be fixed but
  progress can be verified (Anthropic, "Building effective agents").
- **Pipelines improve when each module has a metric and examples,** and can be tuned against them (DSPy).
- **Long contexts degrade** ("lost in the middle"), so narrow context per call is a reliability feature.
- **Model judges are biased:** by position, by verbosity, and toward their own family. A judge needs order
  swapping, rubrics and a judge from another family.

**So the design rule:** fewer planners, more and better verifiers, and every decision made where it can be seen.

## 2. The shape: one lesson graph, a conductor, workers and verifiers

```
            requester / source documents
                        |
                  [ M0 Intake ] --------------------------- human gate: brief
                        |
   +--------------------v---------------------+
   |              THE LESSON GRAPH             |   one typed model of the lesson; every value has an
   |  intent > truth > learning > narrative >  |   OWNER, a PROVENANCE (who, inputs, confidence) and
   |  visual plan > shots > build              |   a STATUS; modules write patches, never whole files
   +----^---------------^---------------^------+
        | patches       | verdicts      | dirty nodes
   [ workers ]     [ verifiers ]   [ CONDUCTOR (code) ]
   write one       independent     schedules dirty nodes, routes tier/effort,
   field each      and different   runs repair loops, escalates, asks the human
```

### 2.1 The lesson graph (the core idea)
Today a lesson is a chain of documents (brief, knowledge, plan, script, storyboard, scenes). Each stage rewrites
the whole of the next, so a late discovery means regenerating everything downstream. Instead, one typed graph
holds every layer, linked:

- **intent:** audience, job behaviour, constraints, look;
- **truth:** facts and claims with source anchors and their status (approved, contested, framed as hypothetical);
- **learning:** objectives on a Bloom ladder, misconceptions, practice items, and which facts each one needs;
- **narrative:** the through-line, sections, beats, and spoken lines. Each line links to the facts it voices and
  the objective it serves;
- **visual plan:** per section, a treatment (world, register, artefacts). Per beat: subject, visual intent and
  motion class;
- **shots:** per beat: builder (template, blueprint or bespoke), props, station, camera, join, and what is held
  from the beat before;
- **build:** scene files, renders, frames and check results, linked back to their shot.

Three properties make it reliable:
1. **Ownership.** Each field has exactly one owning module. The script worker cannot change a fact. The shot
   worker cannot change a spoken line; it can only ask for a change, through the conductor. (MAST's
   misalignment failures are agents overwriting each other.)
2. **Provenance.** Every value records who made it, from which inputs (by hash), with what confidence and when.
   Replays, audits ("where did this claim come from?") and cost accounting all read the same record.
3. **Incremental.** When a value changes, only the nodes that depend on it go dirty and are re-made, like a build
   system. A one-line script fix re-plans one beat, re-builds one scene and re-checks one beat. This is the speed
   goal, met by design.

The existing plan files stay as they are: the graph is an index and a set of links over them. It does not replace
them on day one.

### 2.2 The conductor (code, not a model)
- Schedules dirty nodes in dependency order and runs independent ones in parallel.
- Picks the engine for each node from a table: code, a decision call, or a model at a given tier and effort.
  Models never route themselves.
- Runs each node's **generate, verify, repair** loop:
  - at most k rounds;
  - each repair gets only the failing verdict and the field it may change;
  - then escalate one tier;
  - then flag the node for a human. It never loops forever and never silently passes.
- Owns the human gates and their state.
- Keeps the cost and time ledger per node.

### 2.3 Workers: narrow, stateless, one field each
- **A worker gets a context pack:** its node, the nodes it depends on, the relevant library entries and two or
  three approved examples. Never the whole lesson.
  - Long, mixed contexts degrade quality, and a narrow pack is also cheaper.
- **Workers are defined by the decision or artefact they make, not by an expert persona.** How many workers
  there are falls out of the graph, not a fixed count of analysts.
- **High-leverage decisions get candidates, not one shot:**
  - the lesson's central idea or metaphor;
  - the treatment per section;
  - the hook and the payoff.

  2 to 4 candidates are made cheaply, judged in a pairwise tournament (order swapped, a judge from a different
  model family than the author, a rubric), and the winner is kept with the others as alternatives. This is
  D-70's "keep both ways, the person chooses" as a mechanism.
- **Joins, shots and seed axes stay inside the storyboard's thinking** (rule 0 of the final-goal doc). Rules and a
  decision model may PROPOSE them and are logged in shadow mode. They take a decision over only when the ledger
  shows they match the storyboard's choices, and their outcomes, on held-out lessons.

### 2.4 Verifiers: independent, and of different kinds
A verifier never belongs to the worker it checks, and the five kinds catch different failures:

| kind | checks | how |
|---|---|---|
| **V1 contract** | schema, ownership, links (every line has a fact or a hypothetical frame; every objective has practice; every beat has a shot; every shot has a builder) | code |
| **V2 truth** | every claim entailed by its anchor; numbers exact; contested claims caveated | code for numbers and anchors; a skeptic model for entailment; a human for approval |
| **V3 learning** | objectives aligned to practice; misconceptions confronted; load per beat; a **simulated learner** who sees only what the lesson shows and says, answers the practice items, and explains back the key idea | a model with a fixed learner profile; the lesson fails it when the learner cannot answer from what was shown |
| **V4 picture** | the plan and the build judged AS PICTURES: outline animatic, contact sheets, mid-join frames | a vision-capable critic with a rubric (fill, hierarchy, one idea per frame, register match, cartoon tells), plus the existing deterministic checks |
| **V5 time and continuity** | every spoken line has a visual event within a set gap; the reading floor; station state across beats (what is held, what leaves, what returns) | code, from the graph's station ledger, before any scene is written |

- **V4 is the one Loom lacks most.** Every defect in the step 7 review was visible on a frame. The critic runs at
  three altitudes:
  1. on the outline animatic (is the middle a slide deck?);
  2. on each beat's first render (is the zoom on the subject?);
  3. on the final sheets.

  Its findings are patches to specific nodes, not prose.
- **V5's station ledger is a model of what is on screen**, built from the shots alone. It catches residue and
  "held under a template" before code exists. Scene authors stop managing continuity; they read it.

## 3. Coarse to fine: plan at the altitude where change is cheap
Each level is small enough for one model to hold, and is approved as a picture before the next is made:
1. **Spine (about 10 lines):** the through-line, sections, what the learner can do at the end. Gate: Kshitij, or
   the client.
2. **Outline (one line per beat) and a treatment per section.** Rendered as a coarse animatic from placeholders
   (world, subject, builder family). V4 judges the sequence: variety, slide runs, worlds, density. Gate: a look at
   one sheet.
3. **Script and shots per section,** in parallel across sections, each section's worker seeing its neighbours'
   first and last beats.
4. **Build per beat:**
   - templates and blueprints are instant;
   - bespoke beats are written by a narrow scene worker, rendered, judged by V4 on their own frames, and repaired
     against the verdict (render-in-the-loop).
5. **Final check and sheets,** then the requester's look, then render.

The step 7 middle would have been caught at level 2, when a fix costs one outline edit.

## 4. Memory: the brain gets better per lesson, measurably
- **The library** (already in Loom) supplies the workers' examples: approved forms, designs and their scene files.
- **Eval sets per module:**
  - golden inputs with expected properties;
  - planted defects that each verifier must catch, starting with the six from step 7;
  - the earlier lessons as regression.

  A skill or prompt change is accepted only if its module's eval does not get worse. Gates prove they can fail
  (Rule 0), and so do verifiers.
- **Calibration of the judges:** V4's and V3's verdicts are compared with Kshitij's on a sample. A judge that
  disagrees with him is retrained (rubric and examples) before it is trusted.
- **Learnings become rules.** Each new L-entry names the verifier or eval case that now enforces it, as
  AGENT_LEARNINGS already asks.

## 4b. No compromise, and data from day one
- **Rule 0 of the final-goal doc binds this design.** No step is cut for cost or determinism. The storyboard and the
  other planning stages keep full thinking. A cheaper decider replaces a call only after shadow mode shows no loss.
- **Every node already writes to the decision ledger** (D-97): what it decided, from what, who decided, why and the
  outcome. The graph's provenance (2.1) is the same record, so B0 starts from data that exists.

## 5. How this differs from what we have (and from RedTee)
- **Loom today:**
  - a linear chain of documents;
  - big single-agent stages (one storyboard agent for 47 beats);
  - verification mostly after the build;
  - continuity left to each scene author.
- **RedTee:** parallel analysts that fan into one storyboard brain, with contracts and anchors. Its contracts,
  anchors and "flags over silence" are good ideas, and this design keeps them in V1 and V2.
- **This design:**
  - spends its agents on **verification of different kinds** rather than more planners;
  - decides **at the altitude where change is cheap**;
  - makes continuity and ownership **code**;
  - **judges pictures** at plan time;
  - makes each module **measurable on its own**, so models and prompts can be swapped safely. That is also the
    cost goal (D-95).

## 6. Risks and how they are handled
| risk | handling |
|---|---|
| a vision critic hallucinates problems or misses them | calibrated against Kshitij's verdicts; deterministic checks stay the floor; findings must name a node and a region |
| the simulated learner is not a real learner | used as a necessary check (can the key idea be recovered from the lesson?), never as proof of learning; real learner pilots stay in the corporate plan |
| a judge prefers its own family or longer answers | a different model family judges; order is swapped; rubrics score specifics; length is capped |
| repair loops cost more than one good shot | k is small; repairs carry only the failing field; the ledger shows where loops pay, and k is tuned from it |
| the graph becomes a second copy of the truth | the plan files stay canonical at first; the graph indexes them; `context_check` style tests keep the two in agreement |
| over-engineering before quality is reached | build verifiers first (they raise quality now); planners and routing later |

## 7. The plan (each step proven before the next; ordering is Kshitij's)
| step | builds | proof | helps quality now? |
|---|---|---|---|
| **B0** | the lesson graph as links over today's files: ownership map, provenance on every accept, the station ledger | `py -m loom graph <id>` for both step 7 lessons; it finds b42's residue and b22's kept board from the shots alone (V5) | yes |
| **B1** | V4 picture critic on sheets, with rubric, calibration set and planted defects | it finds the six step 7 defects plus the slide-run middle; agreement with Kshitij measured on 40 frames | **yes, the most** |
| **B2** | V3 simulated learner and alignment check | it fails a planted lesson whose quiz asks what was never shown, and passes both step 7 lessons, or says why not | yes |
| **B3** | coarse-to-fine: spine and outline levels, outline animatic, V4 on the outline | the step 7 feedback outline flagged at level 2 for its slide run | yes |
| **B4** | render-in-the-loop scene workers with narrow context packs and verdict-driven repair | first-time scene pass rate up; Sonnet vs Opus on the same beats (D-95) | yes |
| **B5** | candidate tournaments for central idea and section treatments | three candidates per lesson kept as alternatives; Kshitij's pick vs the judge's pick | yes |
| **B6** | conductor routing: tier and effort per node and the decision layer, each switched on only after shadow mode shows no loss (rule 0); cost and time ledger | measured cost and time per finished minute (D-95), with quality unchanged on the module evals | no (cost and speed) |
| **B7** | the course level on the same graph (lessons as subgraphs, shared truth and objectives) | one three-lesson course | later |

**My recommendation:**
- B0 and B1 as part of the quality work (corporate plan phase 4), since they are the checks that see what eyes
  saw.
- B2 and B3 next, then B4.
- B5 to B7 stay with the parked final goal.

## Sources
- [Why Do Multi-Agent LLM Systems Fail? (MAST)](https://arxiv.org/html/2503.13657v2)
- [AlphaCodium: from prompt engineering to flow engineering](https://www.arxiv.org/pdf/2401.08500)
- [Building effective agents (summary)](https://simonwillison.net/2024/Dec/20/building-effective-agents)
- [DSPy](https://arxiv.org/pdf/2310.03714)
- [Lost in the Middle](https://arxiv.org/pdf/2307.03172)
- [Render-in-the-Loop](https://arxiv.org/pdf/2604.20730), [IntroSVG](https://arxiv.org/html/2603.09312v1), [GVR-Coder](https://www.alphaxiv.org/abs/2607.28073.md)
- [Judging the judges: position bias](https://arxiv.org/html/2406.07791v1), [Self-preference bias](https://arxiv.org/pdf/2410.21819)
- [Evaluating and optimizing educational content with LLM judgments](https://arxiv.org/pdf/2403.02795), [Towards valid student simulation](https://arxiv.org/html/2601.05473v1)
