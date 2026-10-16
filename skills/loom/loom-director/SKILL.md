---
name: loom-director
description: Run the Loom L&D video engine end to end as the agent - from a topic or source document to a rendered, narrated, pedagogically designed lesson. Use whenever someone asks to "make a video/lesson/training/explainer about X" inside the Loom Video-Engine folder, to continue a Loom project ("carry on with spacing-sticks"), or to run any Loom stage (brief, knowledge, pedagogy, persona, script, storyboard, scenes, review). Orchestrates the stage graph, routes each stage to the right model tier (Opus plans, Sonnet builds, a cheap model tweaks), obeys the human gates, logs every decision, and never claims a stage done until its gate passes.
---

# Loom director - run a lesson through the engine

Loom is a folder of files and a CLI (`py -m loom ...`; `python3 -m loom` on Linux/macOS). Every stage
reads and writes plain JSON/JS in `projects/<id>/`. Model stages are written by YOU (agent mode) from a
task file; code stages run with one command. You never skip a gate and you never hand-edit a generated
file (`runtime/catalog.*`, `build/`, `audio/`, `qa/`).

## The loop
```
py -m loom new <id> --topic "..." --audience "..." --genre teaching --length 4 --style flat-cosmos --persona mentor
py -m loom go <id>          # runs every code stage it can; stops at the next model task and prints its path
# -> read tasks/<stage>.md, do exactly what it says, write the artifact
py -m loom accept <id> <stage>   # gates; fix every error and re-run until it passes
py -m loom go <id>          # continue
```
`go` stops with exit code 3 at a model task or a human gate, 0 when done.

## Stage -> model tier -> skill
| stage | tier | read first |
|---|---|---|
| brief | plan (Opus) | `skills/lnd/lnd-creative-director` |
| knowledge (topic mode) | plan (Opus) | `prompts/knowledge.md` - conservative facts only |
| pedagogy | plan (Opus) | `skills/lnd/lnd-learning-pedagogy` |
| persona | build (Sonnet) | `skills/lnd/lnd-narrator-persona`, `packs/personas/` |
| script | plan (Opus) | persona + pedagogy narration contract + `lnd-visual-design` s3 + `lnd-explainer-craft` (a colleague's voice, show it while you say it) |
| design seed (before storyboard) | code | `go` writes the engine's seed for a new lesson (D-82); show it to the person (`py -m loom seed <id> --show`) and apply their changes with `--set` |
| storyboard | plan (Opus) | `docs/REFERENCE_FIRST.md` (look at existing work, cite it in `design.references`), `skills/lnd/lnd-visual-storyteller`, `lnd-explainer-craft` (how each idea becomes a picture, how full the frame is), `docs/STORYBOARD_GUIDE.md`, `runtime/catalog.md`, `docs/TOOLBOX.md` (the five tools beyond SVG, the 3D model packs, moods and recipes; name them per scene in `tools`; plan device beats as the `device_shot` preset so `py -m loom device` can swap them later), `lnd-visual-design`, `lnd-motion-fit`, `lnd-motion-craft`, and the lesson style's guide `docs/styles/guides/<style>.md` when one exists (D-123); a device set and a value script come first (below) |
| animatic (after storyboard, before scenes) | code | `py -m loom animatic <id>`: watch it, fix the plan, then build |
| scenes | build (Sonnet), one task per scene, parallel-safe | `docs/SCENE_API.md`, `lnd-motion-choreography-loop`, the style's guide and its `scenes_examples/style_<style>_*.js`, then other `scenes_examples/` |
| review | build (Sonnet) | contact sheets in `qa/sheets/` |
| tweaks later | tweak (Haiku) | `skills/loom/loom-tweak` |

If you can spawn sub-agents, give each model stage to a sub-agent on the recommended model and give it
the task file path; run the per-scene tasks in parallel.

## Storyboard stage: devices and a value script before beats (D-112)
The 96 studied films are built from a few devices repeated, one join material and one value script; Loom used to
invent each beat alone. When you hand out the storyboard task, ask for these first, and send back a storyboard
that lacks them (fields in `docs/STORYBOARD_GUIDE.md`):
- `devices`: 3 to 5 named devices reused across beats, plus one join material;
- `value_script`: one value band, broken deliberately for meaning (house arc: pale open, richer middle, lift at
  the close);
- `accent_on` per scene: the element the narration names, which carries the one saturated accent.

Then check the plan against the general learnings: mechanism and structure beats hold one layout and change its
state; chapter boundaries are hard cuts or a card; lists and numbers are objects; text sits on things. A finished
frame may rest while the voice explains, declared with an `intent` (`rest`, `process_hold`, `punctuation`,
`callback`, `ghost`, `diegetic_text`), never to quiet a gate on an unfinished frame. Motion share and cut rate are
descriptions, not targets. Shape morph, stepped time, swap slot, material joins, magnifier and data-as-objects
are built (D-114, `docs/SCENE_API.md` "Primitives from the TED-Ed study"); hands and footage exist as a kit and a
spike only (placeholder art, consented clips).

## Looks and assets to know about
- Style packs are in `packs/styles/`; the three from the visual study are `story-cartoon` (a place, outlined people, the number on
  a prop), `presenter-pop` (one diagram that fills the frame and returns) and `chalk-lab` (one board changed by
  additions). `blueprint` (D-178) draws a system as a drafting sheet in white on deep blue, for engineers (guide
  `docs/styles/guides/blueprint.md`). Builders: `ctx.scenery`, `ctx.crowd`, `ctx.narrationCard`, rigs `pip`, `tess`, `extra`
  (`docs/SCENE_API.md`). Research behind them: `docs/research/2026-10-01-visual-study.md`.
- Every pack has a `look_family` (D-112): `illustrated` (story-cartoon, flat-cosmos, glow-flat, whiteboard,
  cinematic-noir, cinematic-dawn), `editorial` (editorial-paper, presenter-pop, corporate-clean) or `technical`
  (engineering, blueprint, dark-technical, line-art, chalk-lab). The storyboard and tone learnings above apply to all;
  people, hand-made timing, cartoon joins, springy pops and the TED-Ed tone references apply to illustrated packs
  only. Every film is professional and clean for corporate adults; not every film looks corporate
  (`docs/research/golden/RATING_INTENT.md`).
- Designed characters, sets and props are planned, not shipped: `docs/ASSET_WISHLIST.md` (contract, prompts,
  quality bar). Until the importer exists, use the code-drawn builders.
- Style guides (D-123): `docs/styles/guides/` holds the precise visual contract for corporate-clean, story-cartoon,
  glow-flat, cinematic-noir and whiteboard (token roles, shape, light, composition, motion, people, per-template
  notes, recipes, a polish checklist). Run the guide's checklist on the contact sheets before render.
- Running outside Cowork: `docs/PORTABILITY_CHECKLIST.md`.

## Human gates (never bypass)
- **knowledge** (topic mode): the fact sheet is the lesson's source. Show it to the requester; only they
  run `py -m loom approve <id> knowledge --by "<name>"`. If you are explicitly told to run unattended,
  record that in `--by` ("agent, unattended per <who>").
- **Before render**: show the requester `qa/sheets/_overview.jpg` and the per-beat sheets.

## The person chooses the look (keep it simple and human)
- Ask the interview's `look` question (plain and clear, some story, or cinematic; illustrated faces, acting
  characters, or none). No preference means: the way Loom made lessons before, with the newer way offered.
- Before render, show the sheets and say which beats have a choice (`py -m loom options <id>`). The person
  changes a beat in one sentence: map it to `py -m loom switch <id> <beat> "<name>"` when an alternative
  exists, or to `py -m loom tweak <id> "<their words>" --beat <beat>` for anything else. Recompose, show
  the sheet again. Nothing earlier is lost by a switch.

## After compose: prove it, then render
1. `py -m loom run <id> check` - runtime probe (text fit, cues, scene errors), HyperFrames layout/contrast
   check, static-hold and budget lints, contact sheets. Errors block. The film checks honour declared intents
   (D-112) and the tone checks only warn (value script, more than two saturated hue
   families, `tone_reference`); when a number and the frames disagree, the frames win.
2. LOOK at `qa/sheets/*.jpg`. Write `qa/review.json` (the review stage) if anything is off, fix it
   (storyboard or scene file), recompose, re-check.
3. `py -m loom run <id> render` - MP4 + SRT + VTT + transcript; then it compares the MP4 to the checked
   frames (`qa/render_verify.json`). It refuses without a passing check (`--force --reason "<why>"` overrides, logged with the error count and build hash; refused outright when a scene threw or the build changed after the check; D-124, L-168). Mismatches mean something previewed but did not render: investigate.

## Trailer, poster and sound (after the lesson renders)
- **Every render writes a poster,** `renders/<id>.jpg`: the densest settled frame in the first half, or
  the storyboard's `poster: {beat}`. Look at it; it becomes the LMS thumbnail.
- **The check collects the motion's sound events** (`qa/sfx_events.json`) and re-mixes when they change.
  A render made straight after compose does the same first.
- **Course trailer:** `py -m loom trailer <id> [--tone default|polished|cinematic|deadpan|chaotic]
  [--beats hook,...,payoff] [--render]`. It is a 20-35 s cut from the lesson's own scenes and narration
  (no model calls).
  - The engine picks the hook, 2-3 highlights (the END of drawn beats, where the picture is whole) and
    the payoff. You may override them with `--beats`.
  - Look at `trailer/sheet.jpg` (`trailer.sheet`) before rendering. The render bakes the title-card
    poster as frame 0 and writes `card.txt` for the course card.
- **New motion primitive?** Prove it in the lab first: `py -m loom lab all`, then look at
  `docs/styles/demos/lab/`.
- **A showcase of looks:** `py -m loom reel <spec.json> [--only N]` cuts one from lab and clip scenes
  (spec example: `docs/styles/reels/styles_2026-09-30.json`).

## After render: feed the element library
`py -m loom go <id>` ends by harvesting the lesson's `@form` (element) and `@design` (whole-beat) tags
(`library/FORMS.md`).
- **When it prints library tasks:** a form has reached 3 uses or a design 2.
  - Run each `assess-*` task on the PLAN tier and each `promote-*` task on the BUILD tier.
  - For a design, also run `select-*` on the PLAN tier, blind: give the agent only the task file.
  - Gate each with `py -m loom library accept <form>` or `accept design:<id>`.
- **Promotion is automatic but strict:** most candidates are rightly deferred or rejected.
- **Look at** `library/sheets/*.jpg` for anything built.
- **Check repetition:** run `py -m loom variety <id>`. Read what recurs across recent lessons and plan the next
  lesson's look to differ (`docs/styles/DISTINCTNESS_PLAN.md`).
- **Then update the context:** `docs/context/RUNS.md`, the lesson's RUN_LOG, and new `L-n` / `D-n`
  entries. Run `py tools/context_check.py`.

## Log every decision (D-97: the data for later routers, decision models and fine-tunes)
- **The engine logs by itself** into `projects/<id>/logs/decisions.jsonl` and keeps every artifact version:
  - every accept (pass or fail);
  - per-beat script, storyboard and tooling decisions;
  - allocation, seed, check outcomes per beat, review findings, switches, tweaks, approvals and renders.
- **You log what the engine cannot see:** every fix, deviation, routing or tooling choice you make outside a task
  file, and why:
  `py -m loom note <id> "<what and why>" --beat <b> --stage <stage> --kind fix|deviation|routing|tooling|finding`.
  This is the correction data; a silent fix is lost data.
- **Say who you are:** set `LOOM_ACTOR` (e.g. "opus sub-agent, storyboard") when running a stage, so the ledger
  knows which model really decided.
- **Never cut a stage or its thinking to save cost** (final-goal rule 0). A cheaper decider replaces one only after
  shadow mode shows no loss.
- **Old lesson with no ledger:** `py -m loom ledger <id> --backfill`. All lessons into one dataset:
  `py -m loom ledger export`.

## Never
- invent a fact, number or quote (the gates catch digits; you must catch the rest);
- edit files outside the stage you are on;
- say "done" without the gate output and without having looked at frames;
- leave a finding, decision or plan only in a chat: write it into Video-Engine.
