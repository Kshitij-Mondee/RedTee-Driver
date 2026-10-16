# Loom architecture

## 1. The pipeline

```
request (topic | source docs)
  |  ingest (code, source mode)        source/dossier.json, chunks.json, digest.md   (page-anchored, verbatim)
  |  brief (Opus)                      plan/brief.json          lnd-creative-director
  |  knowledge (Opus, topic mode)      plan/knowledge.json      -> HUMAN APPROVAL GATE
  |  pedagogy (Opus)                   plan/teaching_plan.json  lnd-learning-pedagogy
  |  persona (Sonnet)                  plan/persona.json        lnd-narrator-persona
  |  script (Opus)                     plan/script.json         beats = phrases + job + visual intent + grounding
  |  allocate (code)                   plan/allocation.json     avatar ~10 / template ~50 / motion ~40, rhythm rules
  |  storyboard (Opus)                 plan/storyboard.json     world, stations, camera, joins, one scene per beat
  |  narrate (code)                    audio/narration.wav, timings.json, envelope.json
  |  scenes (Sonnet, per scene)        scenes/<beat>.js | .py  bespoke motion + Manim
  |  compose (code)                    build/ (HyperFrames project) + audio/mix.wav
  |  check (code)                      qa/report.json, qa/sheets/*.jpg
  |  review (Sonnet, optional)         qa/review.json
  v  render (code)                     renders/<id>.mp4 .srt .vtt .transcript.md + qa/render_verify.json
```
Every artifact is a file; every stage records the hashes of what it consumed, so an upstream edit marks
downstream stages `stale` (`py -m loom status`).

## 2. Model stages: agent mode and API mode
Both modes run the SAME prompt packs (`prompts/<stage>.md`) with the SAME skills and are accepted by the
SAME gates (`loom/checks/gates.py`).
- **Agent mode** writes `tasks/<stage>.md` (skills to read, instructions, absolute input paths, output
  path, the accept command). Claude Code/Cowork does the work; `accept` gates it.
- **API mode** (`--api`) inlines the inputs, sends skills + prompt as a cached system block
  (`cache_control: ephemeral`), extracts the fenced artifact, runs the gate, and feeds failures back for
  up to two repair rounds. Usage is logged to `qa/llm_ledger.json`.
- Tiers map to models in `project.json` -> `models` (plan / build / tweak).

## 3. Grounding
- Source mode: chunks are verbatim substrings of their pages (checked at ingest).
- Topic mode: the knowledge sheet is the source; a human approves it; the script gate refuses to run
  until it is approved.
- The script gate rejects any digit not present in the source/facts unless the beat is marked
  hypothetical and framed; every grounding entry must cite a fact, an anchor or `hypothetical`.

## 4. Timing model
Narration is synthesised **phrase by phrase**, so phrase boundaries are measured, not guessed; words
within a phrase are placed by phoneme weight (or exactly, with ElevenLabs alignment). The silence before
each beat is sized to its join (a camera move gets ~1 s). The speaking rate is measured and the voice
re-synthesised once at a calibrated speed to hit the script's `wpm_target`.
Every reveal is an **anchor**: a run of words the beat speaks (`say`, `say_*`, `*_say`, `*_cue`,
`ctx.cue("...")`, Manim `wait_until("...")`). Compose resolves each to seconds; an unspoken anchor is a
build error.

## 5. The canvas runtime (`runtime/`)
- `core.js` - deterministic RNG, the curve library, ONE paused GSAP timeline, the report.
- `style.js` - style pack install, tokens, contrast-aware text colour, type ranges, motion durations.
- `kit.js` - elements (`outer -> mover -> life -> inner` so placement, travel, ambient and
  entrance/exit never fight over one attribute), shapes with the pack's shading (crescent / paper / flat
  / sketch via seeded rough.js), text fitted with real font metrics and type floors, Lucide icons, Open
  Peeps characters, layout helpers.
- `motion.js` - the motion vocabulary (reveal, settle, pop, stamp, drop, converge, grow, draw, unmask,
  iris, assemble, count, typewriter, highlight, emphasis, travel, along, drift) and exits (recede,
  displace, advance, collapse, sink, wipe, iris). Entrance clips and exit clips live on different
  wrappers so an exit can never cancel an entrance.
- `world.js` - stations on one world plane (nested stations for zoom-throughs), the camera as a pure
  function of time (log-space zoom), joins (cut, camera, travel, zoom, canvas, continue), continuity
  (`ctx.held`, storyboard `keep`, motifs), retiring elements in reading order, station visibility.
- `overlay.js` - captions (active word by colour only), section chrome, the presenter, media placement.
- `templates/`, `blueprints/` - the library (props schemas extracted into `runtime/catalog.json|md`).
- `manim/loom_manim.py` - the Manim contract (injected cues, palette, fonts, duration), plus the read
  record the clip store keys on (see `docs/MANIM.md`).

Clock layers (camera, captions, presenter, ambient, visibility) are evaluated from one
timeline-spanning driver, so any seek order lands on the right frame (parallel/segmented renders are
safe). Media (Manim clips) are written into the static HTML so HyperFrames pre-extracts their frames,
then reparented into their station so the camera carries them.

## 6. Gates (what "done" means)
| stage | gate highlights |
|---|---|
| brief | size cap, 3-8 must_cover each anchored, no template names, no generic segment |
| knowledge | numbers listed, contested facts caveated, dashes, human approval |
| pedagogy | observable goals, Bloom verb/level match, no jumps > 1 level, peak >= apply, energy rules, recall budget, quiz feedback, carriers vary, Gagne mandatory events |
| script | phrase length, dashes, redundancy (no transcripts on screen), grounded numbers, citations, quiz pauses, length vs plan |
| storyboard | allocation honoured, props schema (word limits, list sizes), stations/joins valid, bespoke needs a beat sheet, RedTee sample content forbidden, variety warnings |
| scenes | determinism bans, tokens only, cues used, syntax |
| compose | every anchor spoken, camera settle warnings |
| check | runtime errors (text overflow, unresolved cues, scene exceptions), HyperFrames lint/layout/contrast, static holds, chunk budget, contact sheets |
| render | frame-by-frame comparison of the MP4 against the checked preview |
`py tests/run_tests.py` proves each gate can fail.

## 7. Extending
- **A new look**: a style pack (`skills/loom/loom-style-pack`).
- **A new genre**: `packs/genres/<genre>.md` (arc, posture, good/bad, visual kinds).
- **A new narrator**: `packs/personas/<name>.json` (schema `persona`).
- **A new template/blueprint**: `skills/loom/loom-template-author`; then `py -m loom catalog`.
- **A reusable beat design (template)**: tag scenes `// @design id: idea`; at 2 distinct uses the library
  assesses it, a build-tier model writes it with `loom-template-author`, and it goes live only after a
  blind storyboard pick (`docs/COMPONENTS.md`).
- **A reusable small element**: never hand-added. Tag it `// @form id: idea` where scenes build it; the
  element library (`loom/library.py`, `docs/COMPONENTS.md`) counts uses across lessons, assesses at
  `library.promote_after` (3) uses and promotes only confident, topic-independent elements to
  `runtime/components/`, proven in every style pack. Existing scenes are never rewritten.
- **A voice provider**: `loom/narrate/providers.py` (return samples, rate, optional char alignment).
- **RedTee blueprints**: `kind: "redtee"` scenes (`runtime/redtee_catalog.md`); configure
  `loom.config.json` -> `redtee_root`.
