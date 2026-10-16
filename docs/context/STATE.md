# Loom state (living document; last updated 2026-10-08, Shuttle built beside Relay)

This describes Loom **now**. History lives in `RUNS.md`, `DECISIONS.md`, `../AGENT_LEARNINGS.md` and
`../../CHANGELOG.md`. Every number here is checked against the code by `py tools/context_check.py`. If it
disagrees, the code wins, and you fix this file.

## What Loom is
Loom is a pedagogy-first, code-rendered L&D video engine.
- **Input:** a topic (or a source document).
- **Output:** a narrated, captioned MP4 built on one continuous animated canvas.
- **Who does what:** Opus plans, Sonnet builds, a cheap model tweaks, and code does everything else,
  deterministically.
- **Modes:** agent mode (task files) and API mode. Outside Cowork, two agent pipelines: **Relay** (code runs the stages
  through role agents, `loom/agents/`) and **Shuttle** (one lead agent owns the lesson on rails, `loom/shuttle/`, D-135).

## Subsystems and where they live
| subsystem | where | notes |
|---|---|---|
| CLI and stage graph (14 stages) | `loom/cli.py`, `loom/stages.py`, `loom/flow.py` | `py -m loom status/next/go/task/accept/run/tweak/library` |
| Model stages (agent + API) | `loom/agent/`, `prompts/`, `skills/` | task files in `projects/<id>/tasks/`; API mode repairs against the same gates |
| Shuttle (one lead agent) | `loom/shuttle/`, `shuttle/agents/`, `skills/loom/shuttle-director`, `tools/shuttle_s0.py` | `py -m loom shuttle run`, `resume`, `status`, `report`, `agents`: the lead in `claude -p` (subscription or API key) works only through loom-mcp, whose rails accept phases P1 to P11 by the engine's gates and approvals (facts, plan, final), reopen with stale marks (cap 3), budget per lesson, phase and sub-agent, and owner tokens for six sub-agents; a PreToolUse hook; proven on a scripted model (S0), not on a real one (D-135, `docs/AGENTS_RUNBOOK.md` section 12) |
| Gates | `loom/checks/gates.py`, `loom/checks/story.py`, `loom/checks/film.py`, `loom/checks/text_audit.py`, `loom/qa.py` | brief to scenes gates (since 2026-10-07: length, framing, keep, variety, avatar props, placeholders, cast, the lesson vocabulary); runtime probe (off-frame elements and words, figure crops, foreign pixels); film checks (blurred beats, element life, caption hold: every cue on screen at least max(1.8 s, its spoken words + 0.6 s), since 2026-10-15); HyperFrames lint; static holds; the sample-text audit; contact sheets. New checks are ratchets for finished lessons (`loom/checks/film_baseline.json`, `film_offframe_baseline.json`, `film_caption_baseline.json`) |
| Layout guard (D-169, opt-in) | `runtime/layout.js`, `loom/layout_guard.py`, `tools/node/layout_solve.mjs` | the engine moves labels, tags and edge-crossing texts clear before every probe; a plan per lesson in `layout/plan.json`; `py -m loom layout <id> on` |
| Narration | `loom/narrate/` | Kokoro local by default; phrase timings; music and SFX mix |
| Timing grid (D-173) | `loom/timing.py`, `runtime/grid.js`, `loom/checks/grid.py` | one join table; joins settled once for narrate and compose; `manifest.grid` (exact sections, a tempo fitted so each section starts on a bar, hits, planned sounds by id) read by the runtime (`ctx.hit/bar/onBeat`), the mix (places exactly the planned sounds, records them; `music.follow_grid` opt-in) and the grid check |
| Speech check (D-174) | `loom/narrate/asr.py`, `py -m loom asr` | every narrated phrase transcribed back (faster-whisper, local small.en) in the narrate stage; numbers and names must match; `--accept` after a person listens |
| Compose + render | `loom/compose.py`, `loom/render.py` | HyperFrames project; resumable segmented render; `verify_render` checks the MP4 against the preview |
| Canvas runtime (JS) | `runtime/*.js` | world, camera, joins, kit, motion vocabulary, captions, presenter, components registry |
| Library of templates | `runtime/templates/`, `runtime/blueprints/` | 17 templates and 5 blueprints live (`runtime/catalog.md`) |
| Element components | `runtime/components/` | 0 components (none has earned promotion yet) |
| Element and design library | `loom/library.py`, `library/` | counting, assessment, promotion, blind selection, proofs |
| Style packs | `packs/styles/` | 17 style packs: flat-cosmos, editorial-paper, whiteboard, corporate-clean, dark-technical, engineering, blueprint (D-178), line-art, cinematic-noir, cinematic-dawn, from the visual study (D-74) story-cartoon, presenter-pop, chalk-lab, glow-flat (D-78, Kurzgesagt-inspired), and isometric, hologram and screencast (D-185, each with an engine) |
| Bridges | `loom/manim_bridge.py`, `loom/redtee_bridge.py` | Manim clips; RedTee SVG blueprints, **read-only** |
| Measured layout | `runtime/kit.js` (`kit.fit`, `kit.text`), `docs/LAYOUT.md` | real font metrics and tracking; measure-then-draw; the drawn glyphs are checked against their box, their element and their card inset |
| Brands | `loom/brand.py`, `packs/brands/`, `docs/BRANDS.md` | brand on any style: colours, fonts, logo, rules and locks; contrast lint with suggested shades; storyboard gate; `loom brand`, `loom restyle` |
| Studio | `loom/studio/`, `py -m loom studio` | local web app (P0): brand kits, per-style preview, restyle lessons, render. 127.0.0.1, no login |
| Manim | `loom/manim_bridge.py`, `runtime/manim/loom_manim.py`, `docs/MANIM.md` | clips reused by the colours each scene READ, one shared store (`cache/manim/`), drafts for restyle previews (never rendered), parallel scenes, fixed-colour check; `loom manim`, `loom cache` |
| Expressive motion | `runtime/expressive.js`, `runtime/interaction.js`, `docs/SCENE_API.md` | springs, orchestrated groups, gestures, simulated interaction (window, field, button, toast, cursor, tap, typing), sound events |
| Sound from motion | `loom/narrate/mix.py`, `loom/qa.py` sync_sfx | runtime sound events collected per build and synthesised in the music's key; music can follow the edit |
| Trailers | `loom/trailer.py`, `runtime/trailer.js` | `loom trailer`: a 20-35 s course trailer cut from an approved lesson (EDL remap, lesson narration, tone presets, poster baked as frame 0, card copy) |
| Motion lab | `loom/lab.py`, `scenes_examples/lab/` | `loom lab`: filmstrips of a technique in the real runtime (`docs/styles/demos/lab/`) |
| Shader layer | `runtime/fx.js`, style pack `fx`, `docs/VISUALS_PLUS.md` | WebGL background per style (nebula, aurora, mesh, paper, blueprint), grain, vignette, leak; timed moments (light sweep, spotlight) |
| Clip renderers | `loom/skia_bridge.py`, `loom/three_bridge.py`, `runtime/skia/`, `runtime/three/` | `kind: "skia"` (skia-python, SkSL, backdrop blur, motion blur, resumable frames) and `kind: "three"` (Three.js via headless Chromium), sharing the Manim clip store |
| Page clips (D-176) | `loom/page_bridge.py`, `runtime/page/` (render.mjs, kit.js, libs.json), `docs/PAGE_CLIPS.md` | `kind: "page"`: any page on the approved libraries (d3, topojson + world-atlas, Plot, dagre, KaTeX, Shiki tokens, xterm.js, hersheytext stroke fonts, opentype.js, paper.js) rendered to a transparent clip like the Three.js clips; one browser per worker; 8 capability scenes in `scenes_examples/page/` |
| Style engines (D-175) | `runtime/engines.js`, `loom/engines.py`, `docs/styles/ENGINES.md` | the slot: `runtime/engines/<style>.js` loaded for that style only, `ctx.engine`, linted; no style has one yet (Kshitij picks) |
| Lottie | `runtime/lottie.js`, `assets/lottie/` | `ctx.lottie`: designer animations seeked by the timeline, re-coloured to tokens |
| Characters | `runtime/rig.js`, `runtime/rigs/` | `ctx.character`: 5 rigs (Ava, Sam; outlined Pip, Tess and the grey crowd Extra, D-74), 8 poses, 5 gestures, walk, blink, emotions, lip flaps from word timings; front view only |
| Scenery and toon shading | `runtime/scenery.js`, `runtime/kit.js` | `ctx.scenery` (room, stage, street), desk, sign, `ctx.crowd`, `ctx.narrationCard`; `shape.shading: toon` (outline + cel shade) (D-74) |
| Depth stage and iso kit | `runtime/depth.js`, `runtime/iso.js` | `ctx.depth` (2.5D: parallax dolly, aerial perspective, depth of field, bloom, cones, haze); `ctx.iso` (boxes, tiles, grid, arrows, labels, painter's order) |
| Visual storytelling | `loom/story.py`, `skills/lnd/lnd-visual-storyteller` | storyboard `story`/`shot.size`/`depth`/`light`/`story_role`; suggestions for every kind of video, form by genre, references not rules (D-64, D-67); `loom animatic` |
| Reel | `loom/reel.py` | `loom reel <spec>`: a showcase cut from lab and clip scenes by the real renderers |
| Cost drivers | `loom/cost.py` | `loom cost <id>`: scene kinds, model tasks, clip seconds, render estimate; no tiers or budgets for now (D-67) |
| Options | `loom/options.py` | a beat may carry `alternatives`; `loom options`, `loom switch` (both ways kept; the person chooses, D-70) |
| Palette study (research) | `tools/palette_study.py`, `docs/research/palettes/` | the colours a video uses by role, accent pairs, per-shot palettes; scored against a known palette |
| Video-note screening (research) | `tools/check_video_notes.py` | flags filler or mislabelled AI-written video notes before use (D-72) |
| Video study (research) | `tools/video_study.py`, `tools/transcribe_videos.py`, `docs/research/*/` | cuts, motion, holds, audio gaps, palette, contact sheets, speech numbers; studies of 5 channels (D-73, D-76); `tools/explain_study.py` (explanation cues, word-aligned strips, `moments` for the animation worth a 0.5 s strip, L-134) and `tools/style_fingerprint.py` (what a look is made of, for references and Loom alike) (D-74) |
| Tests | `tests/run_tests.py` | 556 tests (run_tests.py plus tests/suites), offline (the Chrome ones find the browser through one shared check, `tests/browser_support.py`, as `loom doctor` does, and name their skip when there is none; so do the vision lab and cairo ones where OpenCV, symlinks or cairo are missing); each gate is proven able to fail; the 2026-10-07 film-defect suites and the 2026-10-08 style-system suite were each run red on the code before them (`docs/research/bench-fix/red_runs/`, `docs/research/style-system/`) |
| Context | `docs/context/`, `tools/context_check.py`, `tools/engine_hash.py` | this layer |

## Lessons made
| project | style | length | status |
|---|---|---|---|
| `spacing-sticks` | flat-cosmos | 4:11 | rendered (the MP4 predates the fx layer, L-90). An untouched copy (`_ss_base`) passes check with 0 errors on the 2026-10-01 runtime, after the fx overlay fix (L-104) |
| `_ss_story` (fork) | flat-cosmos | 4:11 | spacing-sticks with Maya as a rigged running character, her room and a depth window (b02, b11, b22), with the original illustrated busts kept as alternatives (`loom switch`); check 0 errors; a 21 s cut rendered (`docs/styles/demos/2026-10-01_story_upgrade_before_after.mp4`); full MP4 not rendered here (L-106) |
| `blameless-postmortem` | whiteboard | 5:04 | rendered; passes check with 0 errors; MP4 frames match 88/88. Ships with 5 review majors (b28, b10, b21, b16, b08): layout and pacing, see its RUN_LOG |
| `feedback-that-lands` | corporate-clean (Maya v5 as manager) | 7:10 | REJECTED by Kshitij after watching (D-99); rendered on the PC; composed; Chrome check in the sandbox 0 errors, 17 warnings; sheets looked at; NOT rendered. Review: `docs/research/2026-10-02-step7-review.md` (verdict fix: slide-like middle, cartoon presenter, two drawing languages) |
| `phishing-report` | cinematic-noir, `--mix cinema` | 7:00 | REJECTED by Kshitij after watching (D-99); rendered on the PC; composed; Chrome check in the sandbox 0 errors, 38 warnings; sheets looked at; NOT rendered. Four engine bugs found on its sheets and fixed (L-163 to L-166); verdict fix: bean people, over-full frames |

## Library (see `library/FORMS.md`, generated)
- **Element forms (components):** 37 tagged. Assessed so far: `outcome_tick`, `arrow_into_target` and
  `placeholder_slot` rejected; `icon_label_card` and `verdict_stamp` deferred. `placeholder_slot` was
  since split into `unknown_ring`, `empty_frame` and `empty_slot_row` (L-31).
- **Beat designs (templates):** 12 tagged. `attention_converges` was deferred (one lesson's bookends).
- **Promoted:** nothing yet, which is intended. The template path is proven end to end in
  `library/proofs/2026-09-30-template-promotion/` (archived, not live).

## What is proven, and what is not
- **Proven by running it:**
  - both lessons from brief to MP4;
  - every gate failing on a planted defect;
  - compose determinism;
  - the MP4 matching its preview;
  - API mode against a mock server;
  - Shuttle's launcher and the real `claude -p` (CLI 2.1.283) driven end to end by a scripted model on the mock server (S0,
    `docs/research/shuttle/s0/`): rails, approvals, reopen, budget stop, owner tokens and the hook, offline;
  - the RedTee bridge;
  - the sample-text audit on a composed lesson;
  - the component and template promotion paths, including a blind pick.
- **Not yet proven:**
  - the real Anthropic API (no key);
  - OpenAI and ElevenLabs voices;
  - HeyGen avatars;
  - a full run on Windows. **Partly proven 2026-10-01** on Kshitij's PC:
    - setup ran: npm, the HyperFrames browser, the Kokoro model, the catalog;
    - the suite passed 57, failed 0 and skipped 6, including Manim renders, compose determinism and the animatic.
    - Then, after `pip install -r requirements.txt` (kokoro-onnx, skia-python) and the L-127 fix: 62 passed,
      1 failed, 0 skipped. The failure is fixed (L-129) but not yet re-run.
    - The three new lab strips rendered with 0 problems.
    - Still to see on the PC: a full lesson render.
  - (superseded: "Manim is not installed here" referred to one sandbox; Manim 0.19.1 renders on the PC and in
    the sandbox, found by the R-21 portability audit).

## Styles
- **17 style packs** (isometric, hologram and screencast added 2026-10-16 with their engines, D-185): flat-cosmos, editorial-paper, whiteboard, corporate-clean, dark-technical, engineering, blueprint,
  line-art, cinematic-noir and cinematic-dawn (the last two for the depth stage, R-14), and story-cartoon,
  presenter-pop and chalk-lab (from the 2026-10-01 visual study, R-21; proven in the lab, no lesson built in them yet), and
  glow-flat (R-23, D-78).
- **The style system (D-128, 2026-10-08):** a pack may set `materials`, `roles`, `fx.spotlight`, `fx.vignette_under`,
  `characters.bottom`/`white`, `shape.gloss_toward`/`contact_shadow`, the `document.page` variant and its `guide`;
  untouched packs draw as before. Five packs have guides (`docs/styles/guides/`: corporate-clean, story-cartoon,
  glow-flat, cinematic-noir, whiteboard), proven in Chrome with strips, a checklist and a crf 18 encode each
  (`docs/styles/demos/guides/<id>/README.md`). Styles are never compared with each other (D-122).
- **7 shading grammars:** flat, crescent, paper, sketch, line, toon (outline + one cel shade, R-21) and gloss (inner
  band + highlight, no outline, R-23).
- Engineering and line-art were added in R-8 and proven by restyling both lessons with no model calls
  (0 errors each). Their demo frames are in `docs/styles/demos/`.
- A pack is pure data; a grammar is code.
- Bespoke scenes restyle without edits since D-27. A blameless restyle to corporate-clean leaves 5
  layout errors to fix (L-56).
- Proposals for the next styles, brand overlays and reuse: `docs/strategy/2026-09-30-styles-reuse-and-users.md`
  (P-1 to P-3, pending Kshitij).

## Open work

- **Four style test lessons (2026-10-16, R-69, L-474):** done and accepted (st-bp-cooling, st-holo-ai, st-sc-2fa,
  st-iso-order; $50.22). Open: per-style direction cards in P5 and P6 so planners use each style's strong calls (the
  hologram film had no `hero3d`), and Kshitij's look at the films.

- **Style stress test (2026-10-16, R-66; fixed and wow passes R-67, D-187):** the findings below are fixed; what is left is in FINDINGS.md "After the fixes", plus people kits and a composed lesson per style. Originally: blueprint, screencast, hologram and isometric rendered at their hardest
  (`docs/research/2026-10-16-style-stress/FINDINGS.md`). Open, from it:
  - screencast: code, terminal and chart regions;
  - hologram: a bar piece;
  - blueprint: figure underline, cloud triangle, lettering speed;
  - isometric: a time-aware order check, height cues;
  - people in the three styles without a kit.

- **Blueprint engine (2026-10-16, D-183, R-64):** built (`runtime/engines/blueprint.js`, two registers, the lab scenes
  `bp_engine_detail` and `bp_engine_teach`). Seen only in the Node preview. Open:
  - Kshitij's look at the Chrome strips (`py -m loom lab bp_engine_detail --style blueprint`, and `bp_engine_teach`);
  - the browser test `check_blueprint_lab_scenes_render_with_no_problem`;
  - the first blueprint lesson.
- **Three new styles with engines (2026-10-16, D-185, R-65):** isometric, hologram and screencast are built:
  - each has a pack, an engine, an engine guide, a style guide (sections 1 to 21), research, three lab scenes and tests;
  - all are seen only in the Node preview.

  Open:
  - Kshitij's look at the Chrome strips (`py -m loom lab iso_lesson --style isometric`, `holo_lesson --style hologram`,
    `sc_lesson --style screencast`);
  - the three browser tests;
  - a first lesson in each;
  - H.264 legibility of small UI text (screencast, 20 to 21 px) and thin lines (hologram);
  - the gaps in each guide's section 14.
- **Template hand-off (2026-10-16, D-184):** `docs/assets/HANDOFF_TEMPLATE_LIBRARY.md`, 150 items for a friend's Claude
  Max account. Open: the first batch back, and the three questions in its section 10.
- **Whiteboard engine pilot (2026-10-15, D-179, R-63):**
  - Built in `runtime/engines/whiteboard.js`. It draws with one hand per film, always on top, its arm always from the
    bottom edge (L-461).
  - The with/without comparison finished on `wb-prioritise`: the engine arm cost 32 % less, with fewer calls and fewer
    looks.
  - Rated: Kshitij preferred the engine film (D-181: the engine stays on for new whiteboard lessons). Open: the
    engine arm's lead accepted 3 continuity majors unfixed.
  - Then (D-182): film A still read as messy. New whiteboard engine boards have two faces (`board.heading`, audited as
    `wb_face`), no line through a word (`line_through_text`), and little carried into a section (`board_carry`). The hand
    is now at 0.85. Open: the first whiteboard engine lesson made under these rules, and the first thresholds (40 %, 10
    words).
  - 2026-10-16: the hand keeps pace with the voice (L-465). Research on the style's principles:
    `docs/research/2026-10-16-whiteboard-principles.md` (Fiorella and Mayer 2016; Schneider et al. 2023; Andrew Park).
    Built: the hand draws Lucide icons (`W.icon`, D-186). Open, ranked: compound metaphors Lucide lacks; a camera that follows the work; hand poses (lifted, pointing,
    placing, erasing); a planned end-state board per section; an even pace across beats; the sleeve's colour (it nearly
    matches the accent; Kshitij's call). Open: 17 late hand starts (`wb_pen_late`), where words are written behind the voice.
- **Grid, speech check, engines, page clips (2026-10-15, D-173 to D-176, R-61):** built, each with tests in
  `tests/suites/grid_speech_engines_pages.py`. They apply to new lessons; existing lessons are not updated (Kshitij,
  2026-10-15: "No need to change existing lessons and waste time updating them"). Open: music following the grid stays
  opt-in until a listening comparison on a new lesson; style engines wait for Kshitij to pick a style.
- **Caption hold (2026-10-15, P-c first slice, D-170):** the check is built (`film.caption_hold_checks`, run by `check`); caption
  timing is unchanged. Every cue of every lesson misses the 0.6 s tail by construction (compose holds a cue 0.06 s before its
  first word to 0.3 s after its last), so any lesson not in `film_caption_baseline.json` (42 finished lessons are) fails
  `check` until the follow-up lands: merge or extend short cues in `loom/compose.py` `captions_from` (L-444, OPEN). Closed 2026-10-15 by D-180 (merge plus tail at pauses).

- **Shuttle on its own agents (2026-10-12, D-165):** `--runner loom` is the default (any provider; `--runner cli` keeps Claude
  Code). Proven offline (three provider shapes; the scripted run matches the CLI runner, 16 of 20 on each, L-426 open). Not yet
  run on a real API.
- **Reuse or build, per style (2026-10-12, D-163):** built; the library `assets/kept/` is empty until the first approved
  non-isolated film keeps its parts and beats (or `py -m loom kept keep <lesson>` seeds it from an earlier one). Not yet seen
  in a run: whether storyboards reuse well, and what a reused beat saves.
- **Shuttle's lead carries less (2026-10-09, D-148):** after the measured run (R-40: 1.33 MB of hand-over text through
  the lead, its build session at 314 thousand tokens) Kshitij asked to cut the context. Briefs by reference, one lead
  session per phase with only that phase's tools, a check round in three lead turns, pictures at the size the
  judgement needs, and the engine's places and objects offered to the kit-builder as an option. Proven offline (tests,
  S0 on the mock). Measured on a real lesson (R-44, `feedback-shuttle-v3`): the lead's context per call about halved,
  but the run cost $41.58 against v2's $19.56 (more lead calls, a 2.5 h fix loop from an element-name collision,
  L-372 to L-376 open). Fixed the same day (D-150): the held-element trap is a check error, sub-agents send edits, Opus
  judges and Sonnet fixes in P10, the mixed session split, a parallel render verification; not yet measured on a lesson.

- **Shuttle redoes only what changed (2026-10-08, D-144, L-318 to L-323 closed, L-332 to L-334):** after the Opus run
  (`feedback-shuttle-opus`, R-34: exit 0, $71.27 list price, 5 h 11 min, $18.33 of it overage) Kshitij asked why one
  wrong thing re-wrote everything. A reopen now marks only its own phase; later phases and beat files re-check
  themselves by what they depend on; beat-scoped reopens (cap 8); a pilot pair before the other beats when there is a
  kit; scene-authors in P8 to P10; a converging critic; parallel snapshots; the overage guard; pinned model ids and
  per-model cost reconcile. Open: run a new Shuttle lesson to measure the time and money saved (needs Kshitij's go);
  the comparison with Relay is on the engine before these fixes for both films.

- **Relay upgraded (2026-10-10, D-155, L-386 to L-390; research R-46):** one vision (a code-built film card heads
  every builder's, fixer's and the critic's message; read_artifact; the whole brief to the planners, the look to the
  script; craft notes preloaded), honest tools (lesson-clock snapshots with edits, runtime-error hold, kit reports reach
  the kit, kit preview gate, large labelled sheets, snapshot outside the lock, call log, full tool names), one world
  (gate one_world, a pilot pair with the look handed on). Model placement unchanged (D-142). Verified by R-48
  (`feedback-relay-v3`: 7 / 10 within story-cartoon against v2's 6, $8.85 notional against $11.10). R-49: continue
  chains written in order (L-394 closed), a seam is a fade not black, the last scene leaves with the frame, the stray
  hook fixed; the film re-rendered, 7.5 / 10. R-51 diagnosed it; R-53 (D-160): music always mixed (a snapshot compose
  no longer counts), timeouts kill the process tree, a seam join per style, dips and fades covered only at the middle,
  templates shown at once after a cut; v3 re-rendered with its music, fully blank 0.7 s to 0.1 s. Open: motion (33 % of
  frames moving), show-don't-tell, colour (fixes 5 to 7 of `docs/research/2026-10-10-relay-v3-diagnosis.md`); the
  critic's mid-join reading (L-415).

- **Relay on the subscription (2026-10-08, D-141, L-316, L-317):** provider `claude_code` serves each Relay role
  through `claude -p` with only its own prompt and tools (runbook section 12a; profile `claude-cc`). Proven offline
  through the real CLI on the mock; the first subscription run is the Relay side of the Shuttle comparison
  (`docs/strategy/2026-10-08-relay-comparison-run-prompt.md`, operator only), waiting for Kshitij to start it. Open:
  Shuttle's lead also reads the person's global CLAUDE.md (L-316), to decide after the comparison.

- **Shuttle built (2026-10-08, D-135, L-291 to L-301):** one lead agent on rails beside Relay. Report:
  `docs/research/2026-10-08-shuttle-build-report.md`; platform: `docs/research/2026-10-08-shuttle-platform.md`. Next, each
  needing Kshitij's go: S1 (one subscription lesson on the same request as the last Relay run, judged pairwise and
  blind), S2 (API mode, cost measured); installing the Agent SDK to prove `--runner sdk`. Relay stays the default.

- **Style system done (2026-10-08, D-128, L-269 to L-278):** WS6 and B1 to B7, each with a test red on the old code.
  Report: `docs/research/2026-10-08-style-system-report.md`. Left open: the M and L requests in
  `docs/styles/WALLS_AND_NEEDS.md` (the UI type role, designed casts and sets, sketch places, single-stroke lettering,
  a drawing hand). Scale origins no longer depend on seek order or on GSAP's ticker (D-134, L-289, which closes
  L-270's OPEN), and every seek arrives moving forward, so a frame reached backward is the fresh one (D-172, L-449). The places' set decorations now follow the pack too
  (D-133, L-286, which closes L-276's OPEN); still open there: the accents inside the object drawings (L-287), a
  per-token share check and an outlined vessel for whiteboard (L-288). Noir's contact shadow, glow's extras and story-cartoon's template vignette stay as they are (D-132). Set
  `LOOM_ACCOUNT_SKILLS` so
  `context_check` compares the Cowork skill copies.

- **Bench fixes done (2026-10-07, D-124 to D-127, L-252 to L-266):** every root cause of the five bench videos (RC1 to
  RC20) and the API path's reach (section M) has a fix and a test that fails on the old code. Report with before and
  after numbers per bench: `docs/research/2026-10-07-bench-fix-report.md`. Next: the claude_code provider run
  (`docs/strategy/2026-10-07-claude-code-provider-run-prompt.md`); not started here.

- **E2 rated (2026-10-07, D-121, D-122):** within the illustrated style, the Claude-drawn SVG kit (1.0) rated below today's
  engine (1.67); styles are not compared with each other. Characters and worlds now come from designed kits:
  `skills/lnd/lnd-character-design`, `docs/assets/CHARACTER_PROMPTS.md`, `docs/assets/WORLD_PACKS.md`.

- **Stack review (2026-10-07, DESIGN):** `docs/strategy/2026-10-07-stack-review.md`: keep the engine; change who makes
  the pictures (kit and fill, P0 = the E2 bake-off), library first, ElevenLabs for final voice.

- **Next (2026-10-08):** `docs/strategy/2026-10-08-run-plan.md`: top up Anthropic, finish the three bench lessons
  (smart-mix, claude-core, gemini-director), measure the real cost per lesson, then one Haiku-versus-Sonnet scene test.
- **Priority (Kshitij, 2026-10-02):** the videos to at least 95 % of their potential, visually and as L&D. The
  final goal (speed, cost, decision models, modular brain) is recorded and parked: `docs/strategy/2026-10-02-final-goal.md`
  (D-95). Do not build it yet.
- **Visual maturity plan (D-102, DESIGN):** `docs/strategy/2026-10-03-visual-maturity.md`.
  - E1 done (D-103, D-104): rated 66 of 66. Studio 3.77, new 2.75, rejected 2.30; code-drawn figurative 1.93,
    non-figurative 2.86. Findings: `docs/research/golden/2026-10-03-findings-kshitij.md`.
  - E3 done (D-106 to D-109): four judge versions, best rho 0.34. The vision model does NOT gate taste; Kshitij's look
    does. Findings: `docs/research/golden/2026-10-03-findings-kshitij.md`. Bar: `docs/research/golden/RATING_INTENT.md`.
  - Next: E2, reshaped to test both levers (a designed figurative source; finish on the non-figurative path).
  - The pod volume may hold Qwen3.8-27B from another run: `find_model.py` checks it, and `setup.sh` reuses a
    complete copy.
  - Then E2, a bake-off of 4 ways to make one corporate beat.
  - No new figurative code-drawing until the plan's experiments are done.
- **TED-Ed vision study done (D-101, D-110, 2026-10-05).** 96 films watched on the pod; style guide distilled off
  the pod from the records. Findings and proposals: `docs/research/vision/2026-10-05-tedEd-study.md`; guide and
  technique library: `docs/research/vision/tedEd_2026-10/`. The model describes well and judges badly (it calls 35 %
  of clean professional windows major). The proposals (accent lock, finish strength, path morph, hands, the
  double-exposure gate conflict) wait for Kshitij's choice. Not done: cross-model check (no second model), sound pass.
  - **Full read done (D-111):** `docs/research/vision/2026-10-05-tedEd-full-conclusions.md`.
    - The model is a describer only.
    - 16 instrument and harness bugs are listed.
    - Loom's gates need declared intents and per-register thresholds.
    - The missing primitives, in order: path morph, stepped time, swap-in-place, material joins.
    - The proposed order waits for Kshitij.
- **Overnight 2026-10-06 (D-114 to D-116).**
  - D-114 primitives built and wired (morph, stepped, slot, magnify, data objects, material joins; footage spike;
    hands kit with placeholder art). Lab strips looked at; 25 primitive tests.
  - D-115 agent architecture built (`loom/agents/`, `docs/AGENTS_RUNBOOK.md`): proven on mock providers only. The
    first real calls are Kshitij's bench (`py -m loom agents doctor`, then `agents bench`). The sandbox cannot reach
    OpenAI or Gemini, and its proxy rejects outside Anthropic keys.
  - D-116 showcase: `groupthink-trap`, `quick-question-cost`, `mfa-explained` are planned to storyboard and narrated
    (about 3:10 each). Scenes: unverified drafts in `projects/<id>/scenes_draft/` (cut off by the spend limit, L-220).
    `mfa-explained` is composed and checked (overview sheet read): all scenes present, remaining errors are deliberate
    overlaps plus two 0.5 px insets; render on the PC with `--force` (the sandbox cannot render, L-224).
    2026-10-07: all three are finished (every scene written, 0 runtime errors, overview sheets read); render each on
    the PC with `py -m loom run <id> compose` then `py -m loom run <id> render --force`. Rubric: `docs/rubrics/LESSON_CRAFT_RUBRIC.md`.
- **TED-Ed learnings built (D-112, D-113, 2026-10-06).**
  - Every pack has `look_family`; the illustrated six carry `tone_reference`. Storyboards gain `devices`,
    `value_script`, `accent_on`, scene `intent`, `overlap: "ghost"` and chapter joins; the gates honour declared
    intents, and tone and plan checks warn. Skills (repo and account) carry the general rules for every pack and
    the TED-Ed specific ones for illustrated packs only. Spec: `docs/strategy/2026-10-06-tedEd-learnings-plan.md`.
  - Vision lab v2: every failure of the TED-Ed run has a fix and a test that can fail (admission over the KV cache,
    context refusal, thinking cap, timeouts, phase lock, raw thinking kept, measures v2, calibration scorer v2,
    stale guide refused, `preflight`, `remeasure`, `distill-prep`). Proven on the mock only; unverified until a pod
    run: vLLM's `max_seq_len` log line and real speeds under load.
  - Suite on 2026-10-06 (sandbox, 2 CPUs, no browser): 83 pass, 8 skip (browser or skia-python), 1 fail:
    `manim_scenes_render_in_parallel_with_the_same_result` (parallel 1.5 s vs serial 1.1 s). The Manim code is
    unchanged since 2026-10-03; it is a timing assertion on this sandbox, unverified on the PC.
  - Next, one at a time with a lab proof each: path morph, stepped time, swap-in-place slot, material wipes,
    magnifier inset.
- **NEXT STEP, parked by Kshitij (2026-10-03): fix the rest of BOTH lessons, starting with feedback-that-lands.**
  - Outside the golden segments, nothing was rebuilt. Feedback's rooms, the meeting room, the bean colleague, the
    floating clock and "xxx" calendar, the faint lists and the 10 s holds are unchanged.
  - Most of its scenes draw rooms by hand, so the D-100 engine fixes barely reach them.
  - Plan:
    - re-audit every beat from fresh strips (`py -m loom strips feedback-that-lands --source build`, in budgets);
    - rebuild the rooms with `Loom.place` and real rigs, the update with `Loom.ui`, and the concept beats as
      templates that fill the frame;
    - then do the same for phishing's office beats (b02, b07, b08, b32 to b36) and the beats the film checks flag.
  - Beat list: `docs/research/2026-10-03-frame-audit.md`, "Feedback (47 beats)".
- **Golden segments ready for Kshitij (2026-10-03, D-100, R-25):**
  - phishing b17 to b21 (one real message with evidence cards; preview `projects/phishing-report/qa/preview/b17-b21.mp4`);
  - feedback b37 to b41 (the camera follows the writing).
  - He renders on the PC and watches. No full lesson until he signs a segment off.
  - The film checks also flag shipped beats outside the segments (L-178): phishing b02, b05, b07, b09, b27;
    feedback b04 to b06, b34, b36.
- **Both step 7 lessons REJECTED (Kshitij, 2026-10-03: "AWFUL").** Audit: `docs/research/2026-10-03-frame-audit.md`
  (D-99, L-172). No new full lessons until a 60 s golden segment per lesson meets the bar and he signs it off.
- **Decision models and smaller coders (D-98):** Laya researched; scene code moves to Sonnet or Flash-class models only
  after the plan, the library and shadow-mode parity are in place. Feedback MP4: motion 59 %, gap 7 s.
- **Decision ledger live (D-97):** `projects/<id>/logs/decisions.jsonl` plus versions; `py -m loom note` for your fixes;
  `py -m loom ledger export`. No step or thinking is cut for cost (final-goal rule 0).
- **The delivered phishing MP4 is measured:** motion 47 %, event gap 9 s, 46 holds, worse than stress-signal (step 7 review 7b).
- **Brain proposal (D-96):** `docs/strategy/2026-10-02-brain-architecture.md`. Waiting for Kshitij to choose the order
  (recommended: B0 graph and station ledger, B1 picture critic, inside the quality work).
- **PC run of step 7 (2026-10-02):** check feedback 7 errors, phishing 47 (40 of them overlay false positives, L-169);
  both MP4s rendered (before the render gate, L-168); not watched yet.
- **Step 7 done, plan written (2026-10-02, R-24, D-94).** Two lessons, reviewed, with the plan in
  `docs/strategy/2026-10-02-corporate-readiness-plan.md` (DESIGN).
  - **Next:** phase 0 on the PC (render and watch both lessons), then Kshitij's five decisions in the plan.
  - **The main blocker:** no mature, non-cartoony register. Phase 1 builds `briefing`, `Loom.ui` and `Loom.type`.
- **In flight (2026-10-01, R-21 onward):**
  - **TED-Ed and Kurzgesagt: studied (R-22).** See `docs/research/teded/` and `docs/research/kurz/`, the
    five-channel section of `docs/research/2026-10-01-channels-compared.md`, and D-76.
    - The research cache is on Video-Engine this time, under `cache/research/teded/` and
      `cache/research/kurz/`.
    - Candidates waiting for Kshitij's choice, none built:
      - a denser `flat-cosmos` (colour fields and glow);
      - a comparison-pair builder;
      - a term-card builder;
      - a strip-panel list transition;
      - wishlist prompts G1 to G4;
      - whether to merge cut pairs under 0.5 s apart in `video_study` (L-131).
    - A whisper re-run on the PC would give exact wording; it needs the model download approved.
  - **The saturated flat register (Kurzgesagt-inspired, D-78): pack and builders BUILT, Chrome render pending.**
    - Built: `glow-flat`, the `gloss` grammar, `runtime/glow.js`, and three lab scenes.
    - Previewed without a browser (`tools/lab_preview.py`), then rendered in Chrome on the PC (0 problems; suite
      65/65), matching the preview (L-139). Waiting on Kshitij's verdict.
    - First real lesson: `projects/stress-signal`, rendered (76.7 s, render_verify 36/36). Next: drawn assets
      (Maya in this treatment). Plan: `docs/styles/SATURATED_FLAT_PLAN.md`.
  - **Distinctness:** `docs/styles/DISTINCTNESS_PLAN.md`.
    - Step 1 is built (D-79): the variety ledger and AI-tells lint, with a baseline of three lessons.
    - Step 3 is built (D-80, D-81): the per-lesson design seed (`py -m loom seed`, `runtime/treat.js`). The ledger
      keys essentials by treatment.
      - Proven in the preview with five seeds.
      - Still to do: the Chrome strips on the PC, and the first real lesson with a seed.
    - Steps 2, 4 and 5 are built too (D-82 to D-85): the full AI-tells lint, 12 drawn objects, 5 places with a
      parallax camera. New lessons get a seed by default. Kit cards, marks and template icons follow it.
      - Proven in the preview: `docs/styles/demos/preview/*SEEDS.jpg`.
      - Rendered in Chrome on the PC (2026-10-01): every lab scene and seed is clean, after L-150 and L-151.
    - Open:
      - step 6 (Maya v2, waiting on Claude Design);
      - step 7, the proof: lessons with different intents and styles, watched back to back. Kshitij wants it
        after a pause.
  - **Cinema plan Track B is BUILT (D-92):** data pictures, maps and globes, screen joins, hold-and-transform,
    recipe and ink shades, arrays, finish, subject and world, and the cinema mix. Still to do: Chrome strips on the PC,
    then the Track A cinema pilot (D-91: copy the engine).
  - **Maya v4 is reviewed** (`docs/assets/reviews/2026-10-02-maya-v4.md`): ready. 203/203 pass, and the props are in
    contract hexes. The rig importer should start from `assets/incoming/maya-v4`; one optional knee polish is left.
  - **Cinema plan (D-90, DESIGN):** Kshitij's own explainer skill was studied
    (`docs/research/2026-10-02-explainer-skill-study.md`). Its films beat stress-signal on every picture measure.
    `docs/styles/CINEMA_PLAN.md` proposes a cinema register (Track A) and twelve house upgrades (Track B). It waits on
    three choices: copy the engine in, the order, and the explainer default.
  - **Reference first (D-87):** every design starts from existing references (`docs/REFERENCE_FIRST.md`).
    - Boards so far: the office (rebuilt from it). The other 4 places and 12 objects have none yet
      (`py tools/ref_board.py check`).
    - Open-source sets are listed with licences in `docs/references/SOURCES.md`; downloading any needs
      Kshitij's approval.
    - **Free asset sets (D-88):** approved and indexed in `docs/references/RESOURCES.md`; used through `Loom.art`.
      Fluent Emoji is installed (npm). Open Doodles, Lukasz Adam and Kenney need `py tools/fetch_assets.py` on the
      PC (the sandbox is blocked). The skill `lnd-reference-research` carries the habit to any agent.
  - **Assets from Claude Design:** return Prompt R and `tools/asset_intake.py` are built (D-77).
    - The .zip export does keep separate SVG files (verified with maya-v1 and maya-v2).
    - Maya v2 is reviewed (`docs/assets/reviews/2026-10-01-maya-v2.md`, `tools/rig_review.py`, D-86). Its
      structure is ready for a rig importer (not built yet); 9 drawing fixes go back as same-name files.
    - **Maya v3 "final" is reviewed** (`docs/assets/reviews/2026-10-02-maya-v3.md`, D-89): usable, and the rig
      importer can start from `assets/incoming/maya-v3`. Import the props with `--declared-slots`. Optional polish
      goes back as same-name files.
  - **Channel still to watch from files: 3Blue1Brown.** It was on the original list (2026-09-30) but studied
    only from pages and captions (`docs/research/2026-09-30-reference-channels.md`).
    - Covered from files so far: Crayon Capital (7), Cleo Abram (5), Lucas's Lab (2), TED-Ed (7) and
      Kurzgesagt (7).
    - Supply about 5 videos, then run the same tools.
  - **Character pilot.** Run `docs/ASSET_WISHLIST.md` Prompt 0, then A0 and A1 for Maya only. Judge the result
    against its quality bar before the other seven (L-128).
  - **PC verification.** Re-run `py tests/run_tests.py` after L-129 (expect 66 passed), then render one full
    lesson on the PC (`py -m loom run spacing-sticks render` or a new lesson).
  - **Leaving Cowork.** Follow `docs/PORTABILITY_CHECKLIST.md` in order: git + CI, an API smoke run, a driver for
    agent mode.
  - **Skills: the repo copies in `skills/` are canonical.**
    - Re-saved to the Cowork account on 2026-10-01: `loom-director`, `loom-style-pack`, `lnd-visual-storyteller`
      and `lnd-explainer-craft` (the last two again after R-22).
    - Still older on the account (checked by line count against the repo): `lnd-visual-design`, `lnd-motion-fit`,
      `lnd-motion-choreography-loop`, `lnd-creative-director`, `lnd-motion-craft`, `lnd-learning-pedagogy`,
      `loom-template-author` and `loom-tweak` (L-80).
    - Loom's own stages read the repo copies, so the engine is unaffected; only a plain Cowork chat would see
      the older text.
  - **Engine work for the library:** an asset importer, `ctx.asset` and a rig importer (end of
    `docs/ASSET_WISHLIST.md`). No real lesson has been built in story-cartoon, presenter-pop or chalk-lab yet.
- **Standing direction from Kshitij (do not lose):**
  - Research insights are references, never checklists or fixed templates (D-64).
  - Interesting and learner-friendly while respecting pedagogy; the old principles are dated evidence (D-67).
  - Cost tiers are parked (D-67).
  - Keep both the classic and the new ways, and let the person choose (D-70).
  - Corporate L&D for adults, not teacher-like: get things through (D-74).
  - Think long term, and plan for running outside Cowork (D-75).
  - Never change the RedTee repo. Downloads need his approval. Copyright: study, never republish.
- **Lost with the wedged sandbox (L-123):** the research cache from R-20 and R-21 (rough transcripts, study
  JSON, contact sheets, explanation strips, `fingerprint/all.json`) was never on Video-Engine because `cache/`
  is not synced. Every number is recorded in the study docs; to rebuild the files, re-run the tools on the PC
  against the original video folders.
- The Gemini study (`docs/research/GEMINI_BRIEF.md`, D-66) is superseded by watching the videos locally (D-72,
  D-73). Recent research is already folded in (D-69). The walls per style and what closes them:
  `docs/styles/WALLS_AND_NEEDS.md`.
Every `OPEN` item in `docs/AGENT_LEARNINGS.md`; `context_check` prints how many. The most useful next steps:
- the 5 blameless review majors (template-level layout);
- a runtime probe for elements that outlive their beat (L-6);
- motif continuity checks (L-15);
- write-root enforcement for agents (L-40);
- a stress case for components, as templates now have (L-43, templates only so far).

## Environment notes (for agents)
- **Windows first:** use `py` and forward slashes in Git Bash. `loom.config.json` points `redtee_root` at
  `C:/Users/Admin/Desktop/RedTee_V1_Video`, which is read-only.
- **Since 2026-10-01 the canonical copy is Video-Engine itself** (it now has its own `node_modules` and a
  browser). The sandbox work copy below became unreachable when its disk filled (L-123), so any change made
  there and not yet in Video-Engine is gone; nothing known is missing.
- **In the Cowork sandbox (historical):**
  - Work in `/sessions/practical-funny-cannon/work/loom` (a copy with `node_modules`).
  - Sync to Video-Engine after every step with `work/sync.sh`, which excludes `node_modules` and
    `loom.config.json` and refuses a RedTee destination.
  - `/tmp` can be wiped at any time (L-39).
  - Commands are killed after about 3 minutes, so re-run resumable ones.
  - Chromium is at `/sessions/practical-funny-cannon/tmp/chromium` (`HYPERFRAMES_BROWSER_PATH`).
- **RedTee evidence (2026-09-30):**
  - Every file RedTee's git reports as modified was last written on or before 2026-09-29 13:06 IST.
  - Loom's first file dates from 2026-09-29 20:36.
  - So none of those changes are Loom's.
  - A scan of the RedTee tree (excluding `.git` and `node_modules`) found no file, `.pyc` included,
    modified after 2026-09-29 20:00. The bridge runs RedTee code with `-B` and `PYTHONDONTWRITEBYTECODE`.
