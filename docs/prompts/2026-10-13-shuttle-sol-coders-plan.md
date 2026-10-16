# Plan: one film end to end, Opus plans, Sonnet runs, GPT-6.1 Sol codes the visuals (2026-10-13)

Kshitij: "I just want to you test gpt sol for the scene writers and coding stuff as well. I want you to plan out a good video
that we can run end to end, opus 5.5 storyboard and planning, sonnet 5.5 everything else and gpt 6 Sol for scene writers and
coders that code the visuals. Plan this out and we will implement or run this once ready."

Status: PLAN, for Kshitij's go. Nothing is built or run yet. "GPT 6 Sol" is read as `gpt-6.1-sol`, the Sol in
loom/agents/config/models.json and in the scene-writer comparison (D-166).

## 0. Since this plan was written (2026-10-13)

- D-167 (the other session, at Kshitij's request) already lets Opus plan P1 to P5 on the API (`lead.planning.api`, and the
  API's default preset is now opus-plan): item 2 of section 4 is done.
- The five-style test (D-167, docs/research/style_test/RUN_LOG.md, running 6 to 10 hours from 2026-10-13) makes full 1.75
  minute films in five styles with Opus planning, Sonnet managing and Sonnet, Sol and Terra as scene writers, clip authors and
  fixers. Its kit is written by a Sonnet kit-builder and its critic is Gemini Flash. So what this plan adds is narrower now:
  Sol writing the KIT as well, a twin of a film Kshitij already rated (gps-position, 8.5), and Sonnet reviewers. Worth
  deciding after the style test's results, which may answer most of the question.

## 1. What this run answers

Whether Sol can do ALL the visual coding of a whole film, not only beats on a slice with a finished kit. The comparison
(docs/research/2026-10-12-scene-writer-comparison.md, and the blind ratings in scene_writer_comparison/RUN_LOG.md) left it
here: Sol second to Sonnet both rounds ("decent with like 2-3 errors overall, mostly in transition/continuing to the next
beat"; "C better"), at about 40 % of Sonnet's scene-writer cost ($0.22 to $0.24 a beat against $0.55 to $0.62). Never tested:
Sol writing the KIT (the parts every beat composes), Sol writing beats with no kit and plan made for it beforehand, and a
whole film's joins written by Sol.

## 2. The film: gps-position's request, again (recommended)

- The same request word for word as `projects/gps-position` ("How GPS knows where you are", 4 min, flat-cosmos, cinema mix,
  corporate employees, the Kurzgesagt-like notes), as a new lesson `gps-position-sol`, `--isolated`.
- Why this one: you rated gps-position 8.5, and it was made exactly the way you now ask EXCEPT the coders: Opus planned P1 to
  P5 and Sonnet did everything else (the `opus-plan` preset). So the only planned difference is the visual coders, Sonnet
  against Sol, within one style (D-122). Every other choice of topic mixes the coder's effect with a new plan.
- `--isolated` so the style library (D-163) does not hand Sol gps-position's kit and beats: Sol must write the kit itself.
- Alternative if you prefer a new topic: any request you give, but then there is no rated twin to compare with, and the result
  says less about Sol.

## 3. Who does what

Shuttle (one lead on rails) on its own agents, the loom runner (D-165), on the API:

| Work | Model | Shuttle role |
|---|---|---|
| Brief, facts lead, teaching plan, persona, script, outline, storyboard (P1 to P5) | Opus 5.5 | the lead, P1 to P5 sessions |
| Narration, animatic look, kit and beat delegation, check, critique decisions, render (P6 to P11) | Sonnet 5.5 | the lead, P6 to P11 sessions |
| Fact sheet draft (P2), research | Sonnet 5.5 | fact-finder, researcher |
| The kit (P7) | Sol | kit-builder |
| Every bespoke beat (P8) | Sol | scene-author |
| Manim clips (P8), if the storyboard asks for any | Sol | clip-author |
| Every fix of a beat or a clip (P8 to P10) | Sol | fixer |
| Fact skeptic (P2), picture critic (P10) | Sonnet 5.5 | reviewers |
| Persona pick, narration voice | as today (code and Kokoro) | |

Why Shuttle, not Relay: today's diagnosis (docs/research/2026-10-12-relay-architecture-diagnosis.md) found Relay has no agent
that looks at the whole film and decides where a problem is fixed; Shuttle's lead does, both your best ratings (8 and 8.5)
are Shuttle films, and Sol was measured on Shuttle. Testing Sol inside Relay would mix the coder's effect with Relay's gaps.
Relay can be a second arm later with a profile for the same split.

The reviewers on Sonnet: you asked for Sonnet everywhere else. The engine normally picks the critic from another family than
the lead (loom/shuttle/server.py `reviewer`), so a Sonnet critic is set explicitly (`LOOM_SHUTTLE_CRITIC=claude-sonnet-5-5`,
`LOOM_SHUTTLE_SKEPTIC=claude-sonnet-5-5`). It is still another family than the beats' author (Sol), which is the critic's main
job; it is the same family as the planner. Say if you would rather keep Gemini Flash there.

## 4. What has to be built first (small, each with a test shown red first, logged)

1. **A preset `opus-plan-sol`** in loom/shuttle/config.json: lead Sonnet, Opus for P1 to P5, and `agents` {scene-author,
   clip-author, kit-builder, fixer: gpt-6.1-sol}; the fact-finder and researcher stay Sonnet.
2. **Opus may lead P1 to P5 on the API** for a preset that says so. Today the API path allows Opus on P5 only (D-164,
   loom/shuttle/launch.py, the `lead.storyboard.api` rule); your words above are the decision (logged as the next D-id), and
   the rule becomes "Opus where the preset's planning group puts it, P1 to P5, never P6 to P11".
3. **Check the kit-builder takes the preset's model on the loom runner** (the comparison never changed it: its slices kept
   gps-position's kit). If it does not, wire it the way scene-author is wired (loom/shuttle/loop.py `agent_model`).
4. **Pre-flight, no film:** keys for Anthropic and OpenAI; a mock S0 of the preset on the loom runner (rails, delegation, the
   kit-builder and a fixer on the assigned model), free; the full test suite.

## 5. Running it (operator only, as every measured run)

- STATE.md MEASURED RUN IN FLIGHT line; the other session told first; engine fingerprint at the suite, the launch and the end.
- Commands (once built): the lesson created isolated with gps-position's request copied word for word (`--isolated` is a
  flag of lesson creation, not of `shuttle run`), then `py -m loom shuttle run gps-position-sol --runner loom --mode api
  --preset opus-plan-sol --budget 30` with the two reviewer variables set (flags checked against `--help` before launch).
- Claude is only the operator: no edits, no hints mid-run; any intervention logged with `py -m loom note --kind override`.
- Watch points, not interventions: the P7 kit preview (Sol's first kit), the pilot pair in P8 (the look every beat copies),
  the joins (Sol's weak point in the blind rating).

## 6. Cost and time

From gps-position's own run (tools/run_compare.py), with Sol's writer cost at about 40 % of Sonnet's:

| Phase | gps-position (Sonnet coders) | this run (Sol coders), estimate |
|---|---|---|
| P1 to P5 (Opus lead) | $4.92 | about $5 |
| P6 narration and animatic | $1.93 | about $2 |
| P7 kit | $3.00 (lead $0.96, kit $2.04) | about $2 |
| P8 beats | $23.48 (lead $2.96, writers $20.52) | about $11 |
| P9 check and fixes | $2.20 | about $2 |
| P10, P11 and reviewers | $0.99 | about $1.50 (Sonnet critic) |
| **Total** | **$36.52, 159 min** | **about $23, 2.5 to 3 h** |

Proposed cap: **$30** billed, Anthropic and OpenAI together. A cap stop is a result too (it says where Sol spent).

## 7. How it is judged

- The numbers: tools/run_compare.py gps-position gps-position-sol (cost and time per phase, calls, looks, checks, errors).
- The frames: contact sheets and a frame grid of both renders, looked at, defects listed by beat and by join.
- Your blind rating: the two renders as A and B (key in a file opened after), as in the comparison.
- The report: docs/research/<date>-gps-position-sol.md, RUN_LOG, RUNS, AGENT_LEARNINGS.

## 8. Your decisions before it is built

1. The film: gps-position's request again (recommended), or another topic.
2. The pipeline: Shuttle (recommended), or Relay, or both.
3. The critic and the skeptic: Sonnet as you said (planned), or keep Gemini Flash as an outside eye.
4. The cap: $30 (planned).
