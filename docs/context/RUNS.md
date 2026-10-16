# Loom runs (append-only)

Newest first. Each run links to where its full trail lives. Never delete a run; add a correction below
it if something here turns out wrong.

## R-70 (2026-10-16): clean joins, motion, the kind of video (Claude Code; no paid API)
- **Asked:** Kshitij: the joins flash the old beat and old elements flicker; motion is awkward; direction per style and
  storyboarding that knows the kind of video; explainers ask questions they should not; fix the foundations, not the films.
- **Done:** D-190 (joins, motion, the join pass, direction motion lines), D-191 (`loom/genre.py`, kind in every stage and
  gate), the asset hand-off fixes (commissioned `library accept`, optional packages in `tools/cloud_setup.sh`). Tests:
  `clean_joins.py`, `video_kind.py`, `handoff_accept.py`, new isometric and screencast checks.
- **Not done / unverified:** no new lesson rendered with the fixes; the friend's batch-01 not taken in.

## R-69 (2026-10-16): the four style test lessons (Shuttle, API, preset opus-plan-sol-code)
- **Asked:** Kshitij: a 3-minute lesson per upgraded style through the whole pipeline, topics he chose; GPT Sol for
  visual code, Opus for storyboarding and planning, Sonnet for the rest.
- **Done:** all four accepted at every phase, 14:31 to 16:35. st-holo-ai 3:15 $9.79; st-sc-2fa 3:13 $12.42 (one stop at
  P9, caption hold, resumed); st-bp-cooling 3:13 $13.31; st-iso-order 3:09 $14.70. Total $50.22. Plans committed
  (no renders). Run log and study sheets: `docs/research/2026-10-16-style-lessons/`.
- **Look (sampled frames):** isometric about 7, screencast about 7, blueprint about 6.5 to 7, hologram about 4.5 (no
  hero; L-474).
- **Not done / unverified:** audio by ear; whole films in real time; the direction cards (L-474).

## R-68 (2026-10-16): hologram v2 and screencast v2 (Claude Code; no paid API)
- **Asked:** Kshitij: the hologram rack and next-word frames looked "basic and AI like"; screencast should depict real
  references accurately, with a smooth walkthrough; "first improve the hologram and screencast", then four 3-minute
  lessons.
- **Done:**
  - hologram 3D heroes as light, plus SVG v2;
  - screencast page capture, screenshot shells and a smooth walkthrough;
  - the hero proved inside a composed HyperFrames render;
  - 34 more hand-off items;
  - the preset `opus-plan-sol-code`.
  Full suite: 544 passed and 2 failed; both pass alone (a render timeout under load, and the test count, since
  updated).
- **Not done / unverified:** the four test lessons (waiting for Kshitij's topics); page regions inside a composed lesson.

## R-67 (2026-10-16): the four style engines fixed, the wow passes, before and after (Claude Code; no paid API)
- **Asked:** Kshitij: "Fix the engine findings for all four styles, screencast first, then hologram, blueprint and
  isometric"; then the wow for hologram and blueprint.
- **Done:** four agents, one per engine, then two wow passes. All frames were looked at full size by the orchestrator.
  Before and after sheets and hero sheets are in `docs/research/2026-10-16-style-stress/`. Full suite: 533 passed and 2
  failed; both pass alone (the context check's test count, since updated, and a probe timeout under load).
- **Not done / unverified:** composed lessons and MP4s; people kits; the per-style direction cards.

## R-66 (2026-10-16): stress test of blueprint, screencast, hologram and isometric (Claude Code; no paid API)
- **Asked:** Kshitij: "inspect them all and try to render difficult and detailed frames from each of them, around 3 per
  style and then get back to me with the jpg."
- **Done:** one hard lab scene per style, written by four agents to the engine guides with no engine change, and the
  three busiest frames of each rendered. All 12 frames looked at full size. Findings, ratings and the engine fixes are
  in `docs/research/2026-10-16-style-stress/FINDINGS.md`, with one JPG per style.
  - Strongest: blueprint detail sheets and isometric dioramas.
  - Weakest: the screencast code editor and terminal. The engine has no code or terminal region, while the page clips
    already render both.
  - People are missing or off-style in blueprint, hologram and isometric.
- **Not done / unverified:** no engine fixes; motion between frames, MP4 and full-lesson checks were not tried.

## R-65 (2026-10-16): isometric, hologram and screencast styles with engines (Cowork, three sub-agents; no paid calls)
- **Asked:** Kshitij: make the three styles taken from opuscar our own, implemented in the engine, researched online
  and "perfect"; isometric above all.
- **Built (D-185):** per style:
  - a pack, an engine and an engine guide;
  - a style guide (sections 1 to 21) and research (12 to 17 sources each);
  - three lab scenes and a test suite;
  - for the counts: isometric has 26 object kinds and 7 tests; hologram 5 tests; screencast 5 tests.
  The lead integrated the shared files:
  - `PACKS`, the per-engine `engine_note`, `SCENE_API`, `ENGINES.md`, the guides README and STATE;
  - the hand-off sheet (T-134 to T-136 covered);
  - the preview fixes (L-468, L-469).
- **Looked at:**
  - every strip in the Node preview (the agents in three or more rounds each, and the lead on the final strips);
  - after the lead's preview fixes, re-rendered strips in `docs/styles/demos/lab/` for the blueprint, isometric and
    hologram scenes.
- **Tests:** 26 passed, 3 skipped (browser) across the four engine suites and the style checks; `context_check` OK.
- **Not done / unverified:**
  - Chrome strips, lessons and MP4s;
  - H.264 legibility of small UI text and thin lines;
  - colour-blind checks of the isometric legend;
  - the gaps listed in each guide's section 14.

## R-64 (2026-10-16): the blueprint engine, the hand-off library sheet, the next three styles planned (Cowork; no paid calls)
- **Asked:** Kshitij: improve the whole blueprint style using opuscar's blueprint as inspiration (not the goal; complex
  where parts move, relaxed where it teaches); then a hand-off sheet of 100 or more reusable, mostly code-based templates
  and assets with prompts and context for a friend's Claude Max account; then noted three more styles to make our own
  (living screencast, sci-fi hologram, isometric infographic).
- **Built:**
  - D-183: `runtime/engines/blueprint.js`, the lab scenes `bp_engine_detail` and `bp_engine_teach`, the engine guide
    `docs/styles/engines/blueprint.md`, guide sections 17 to 21 and the pack's `reads_as`;
  - D-184: `docs/assets/HANDOFF_TEMPLATE_LIBRARY.md` (150 items), with `commissioned_by`, `family` and `tags` in the
    catalogue;
  - tests: `tests/suites/blueprint_engine.py` (4: 3 run here, 1 needs a browser).
- **Looked at:** the Node preview strips of both lab scenes, iterated about six times. Fixed:
  - pacing (the sheet border moved off the pen);
  - figure collisions;
  - the exploded view leaving the sheet;
  - the cloud shape;
  - card text size;
  - L-466.
- **Not done / unverified:**
  - Chrome strips, a composed blueprint lesson and an MP4 (no browser here);
  - a check of the 150 items' prompts by building one;
  - the next three styles (not started).

## R-63 (2026-10-15): the whiteboard engine with/without comparison, both arms finished (D-179; paid API run by Kshitij)
- **Asked:** Kshitij: "Build a pilot engine for whiteboard and run the with/without comparison on one new lesson."
- **Done:** `wb-prioritise` was planned once, then cloned into an engine arm and a classic arm, and both were run to
  the final render on the same preset with a $10 cap each.
  - Cost: engine $4.64 against classic $6.81 (32 % less); calls 204 against 306; looks 55 against 80.
  - Wall time: P8 took 8 min against 14 min; P9 to P11 took 30 min against 32 min.
  - Critic: the engine arm's 3 majors were accepted unfixed (labels not held in b10 to b12). The classic arm's 4
    blockers were fixed.
  - The hand was fixed between attempts (L-461) and probed clean in the final build.
  - Full trail: `docs/research/wb_engine_ab/` (RUN_LOG, compare.md, study/, blind/).
- **Not done / unverified:**
  - Kshitij's rating of the blind pair; the hand gives the engine arm away.
  - One lesson only, so this is not a measure across lessons.
  - The engine arm's accepted continuity majors.
- **Rating (added 2026-10-15):** Kshitij preferred A, and the key says A = the engine arm. Decision D-181.

## R-62 (2026-10-15): style engines studied from lemo-opuscar (Claude Code; no paid calls)
- **Asked:** Kshitij: learn from opuscar's engines without copying their format; what an engine would require, whether
  it can all be done, whether it improves quality, time and cost.
- **Done:** `docs/research/2026-10-15-style-engines-from-opuscar.md`: wb.js read in full, the dataviz and iso engines'
  APIs; an engine is the medium in five layers (mark, vocabulary, scheduler, performer and camera, surface); what a Loom
  engine needs to keep elements, holds, checks, restyle, cues, the grid and sound working; P8 is 69 to 81 % of the cost
  of the 2026-10-14 whiteboard runs. Recommendation: one pilot engine for a style Kshitij picks, then a within-style
  comparison.
- **Not done / unverified:** the cost and quality effects are estimates until the pilot's comparison; nothing built.

## R-61 (2026-10-15): the timing grid, the speech check, the style engine slot and page clips (Claude Code; no paid calls)
- **Asked:** Kshitij, after the lemo-opuscar study: "get these done": one timing grid shared by picture, music, sound,
  captions and checks; a speech-to-text check on every narration line; a working engine per style next to its rules; an
  "any page" escape hatch, choosing "actual libraries or tools" first; "for specific styles, don't do anything else".
  He approved the npm bundles (d3, topojson-client, world-atlas, Observable Plot, dagre, KaTeX, Shiki, xterm.js,
  opentype.js, hersheytext, paper.js) and the faster-whisper install.
- **Built:** D-173 (`loom/timing.py`, `runtime/grid.js`, `loom/checks/grid.py`), D-174 (`loom/narrate/asr.py`,
  `py -m loom asr`), D-175 (`runtime/engines.js`, `loom/engines.py`, no engine content), D-176 (`loom/page_bridge.py`,
  `runtime/page/`, `tools/node/shiki_tokens.mjs`, 8 capability scenes in `scenes_examples/page/`, `docs/PAGE_CLIPS.md`).
  Tests: `tests/suites/grid_speech_engines_pages.py` (10).
- **Measured:** on a gps-position copy the grid mix equals the old mix sample for sample; the speech check took 53 s and
  failed 3 phrases (two likely voice misreadings of numbers, L-454); a page clip composed into the lesson shows in its
  colours; 8 capability strips looked at (`docs/styles/demos/lab/page_*__corporate-clean.jpg`).
- **Not done / unverified:** music following the grid is opt-in (no listening comparison yet); the speech check's
  false-failure rate on new lessons; nobody has listened to the 3 flagged gps-position phrases; no full lesson rendered
  with a page clip (snapshot only); no style has an engine.

## R-60 (2026-10-15): R-32's three open points checked; backward seeks fixed (Claude Code, no paid calls)
- **Asked:** check whether R-32's three open points still hold, and fix those that do: backward seeks (L-290, L-302),
  the brush watercolour fill, and the unverified multi-worker render and trailer.
- **Done:** backward seeks still drew other frames: `Loom.forwardOnly` (D-172), a test red without it; the brush fill was
  fixed by its own run (R-33) and its test passes; HyperFrames renders of the fixture (PNG frames, 1 against 8 workers,
  long against 7-frame segments) and of the claude fork's trailer (lossless MP4, chronological and out-of-order beats)
  on the runtime with and without the fixes; the fork's 30 reveals forward against backward; the full suite.
- **Result:** in real renders the worker count no longer changes a frame Loom draws (22 of 120 fixture frames and 1 of
  752 trailer frames before). Left: a fresh worker's raster of identical markup (a few pixels) and GSAP's inline
  revert value, neither Loom's. Learning L-449; record section 11 of `docs/research/determinism/red_runtime_determinism.txt`.
- **Not done:** nothing of the three. The full suite's 3 failures are not this change: the world-packs docs and
  `capabilities.json` were stale from another session's `packs/worlds` work (context_check green again since), and
  `check_a_reused_part_draws_what_it_drew_in_its_lesson` timed out under load and passes alone. No `py -m loom note`:
  engine work with no project ledger.

## R-59 (2026-10-15): lemo-opuscar studied and compared with Loom (Claude Code; no paid calls)
- **Asked:** Kshitij: a deep dissection of `github.com/lemomo-ai/lemo-opuscar` (43 code-rendered film styles and
  their tooling), a comparison with Loom in every aspect, its weak points and suggested changes.
- **Done:** shallow clone at `fdc46d7` in the session scratchpad (not in Video-Engine, nothing vendored, none of its
  code run); guides, core tools, release and CI read in full; all 43 style folders surveyed by a read-only sub-agent,
  key claims re-checked by grep. Report: `docs/research/2026-10-15-lemo-opuscar-study.md` (sections 7 to 10:
  comparison table, strengths each way, 17 weak points of theirs, proposals P-a to P-j for Loom, all pending).
- **Not done / unverified:** their films not downloaded (needs Kshitij's approval), so no `video_study` numbers; the
  look is judged from committed stills only. (Superseded the same day, below: Kshitij approved the download.)
- **Then, same day (Kshitij: "Yes, download ... and run video_study on them next to a Loom lesson"):** whiteboard,
  dataviz and iso-infographic films (113 MB) studied beside gps-position, blameless-postmortem and https-private-v2.
  Theirs: 88 to 96 % of seconds moving, holds 3 to 10 %, event gap 2 to 3.5 s, LRA 3.4 to 7.1 LU at -14 LUFS. Loom's:
  48 to 60 %, holds 28 to 38 %, gap 8 to 18 s, LRA 1.9 to 2.5 LU at -16 LUFS; 22 to 28 % of Loom's captions under 1.8 s.
  Section 12 of the study; JSON in `docs/research/lemo_opuscar/`; their sheets local in `cache/research/lemo/out/`.
  Not listened to; one film per style; the iso cut count is a detector artefact (explained in the study).
- **Then (Kshitij: "I am not saying treat this repository as a benchmark ... We won't be making films with loom"):**
  `docs/research/2026-10-15-lemo-opuscar-explained.md`: why it is fast (one agent, solved per-style engines, no
  blocking gates, no planning chain, short films, a 2-minute rebuild loop), what its architecture has that Loom lacks
  (A1 to A9), and within-style pairs with seven style adaptations for L&D (whiteboard mechanisms first, then a
  software-training register on `Loom.ui`, iso systems, data storytelling). Corrects the study's P-d. Nothing built.

## R-58 (2026-10-13): the scene-writer comparison, round 2 on https (Claude Code operator; API, $15.92)
- **Asked:** Kshitij rated round 1 blind (Sonnet best, Terra and Sol good, Luna worst), then "Try again".
- **Result:** https-private-shuttle-api b01 to b12 (corporate-clean, 12 beats, 76 s): Sol passed P9 at $3.63 ($0.24 a beat);
  Sonnet hit its $8 cap in P8 with two drafts ($0.62 a beat); Terra hit its $5 cap after three looks hung an hour in the
  snapshot tool (L-434). Detail: docs/research/scene_writer_comparison/RUN_LOG.md; blind set round2/blind.
- **Not done / unverified:** Kshitij's blind rating of round 2; Terra's arm not a fair reading (the hang); one run an arm.

## R-57 (2026-10-12/13): `https-private-relay` runs 2 to 2d, the mess fixed (Claude Code operator; $9.76 billed)
- **Asked:** Kshitij: "the video is a mess. Were the beats not given the context of other beats ... Fix this. and give me a
  proper report"; "use paid api" for the rewrite, inside the run's $25 cap.
- **Output:** `projects/https-private-relay/renders/https-private-relay.mp4` (run 2d), one board held from 0 to 88 s.
- **What it took:** 17 scenes written again under the held-part fix (L-423) and four more runtime causes of a board that was
  held but not drawn (L-425, L-427 to L-429), a refined copy rule (part_drawn_twice on drawn regions), and a router fix for
  defects on held elements (L-431). Runs: 2 $4.95 (exit 0), 2b $2.17 (exit 0, board still missing), 2c $1.69 (exit 2,
  routing), 2d $0.95 (exit 0).
- **Reports:** `docs/research/2026-10-12-https-private-relay-mess.md`, `docs/research/2026-10-12-relay-architecture-diagnosis.md`.
- **Not done / unverified:** close shots still crop the cards (the plan's camera; the storyboard owns it); b11 left one major;
  the audio not listened to; not rated by Kshitij.

## R-56 (2026-10-12): the scene-writer comparison on a gps-position slice (Claude Code operator; API, $17.63)
- **Asked:** Kshitij: run the scene writers on other models to see which are cheaper yet match Claude; build the slim briefs
  and the routing first (D-166).
- **Result:** five slices of gps-position b08 to b18, Sonnet leading, the scene writers on gpt-6-luna ($1.44, passed, weak
  pictures), gemini-3.8-flash ($3.65, 2 of 11 beats), Sonnet ($6.68, cap, 1 likely false error), gpt-6.1-sol ($3.13, passed,
  close to Sonnet), gpt-5.6-terra ($2.73, passed, fastest, less explanation). Detail:
  `docs/research/2026-10-12-scene-writer-comparison.md`; the blind set for Kshitij in docs/research/scene_writer_comparison/blind.
- **Not done / unverified:** one slice, one run an arm; previews, not renders; Kshitij's blind rating pending.

## R-55 (2026-10-12): `https-private-shuttle-api`, Shuttle on the real API to test the cost estimate (Claude Code operator; API, $21.80)
- **Asked:** Kshitij: "run a shuttle pipeline on real api as well to see if our estimated cost for api was on point. Do it on
  https ... Use opus 5.5 for storyboarding. Sonnet for everything else." (D-164: Opus on P5 on the API path.)
- **Result:** exit 0, every phase accepted, `projects/https-private-shuttle-api/renders/https-private-shuttle-api.mp4` (2:03),
  $21.80 billed, 152 min, against the estimate $16.50 and 71 min (https-private-v2). The price table holds phase for phase;
  the overrun is behaviour: 64 refused looks (two-part briefs), 20 checks with about 16 b17 rounds for an engine-owned error.
  Detail: the lesson's RUN_LOG, `docs/research/2026-10-12-https-private-shuttle-api-comparison.md`.
- **Not done / unverified:** not listened to; the Anthropic invoice not seen (the figure is the API's tokens at the price
  table); one run.

## R-54 (2026-10-12): `https-private-relay`, https-private on Relay via the API (Claude Code operator; $10.62 billed)
- **Asked:** Kshitij: run the prompt `docs/prompts/2026-10-12-relay-https-private-api.md` exactly (paid Anthropic API for this
  one run, Opus on the storyboard, Sonnet elsewhere, $25 cap); "Don't read the code or the script or anything else from any
  other video. First make yours and then compare with the other."
- **Output:** `projects/https-private-relay/renders/https-private-relay.mp4`, 142.8 s, 18 beats (17 bespoke). The run ended
  exit 2 after 65 min (one cross-beat defect left, 4 check errors); rendered with `--force`, logged as an override.
- **Cost and time:** $10.62 billed (Sonnet $8.56, Opus $1.87, Gemini $0.18, Haiku $0.01), 228 calls, 12.3 M tokens in (83 %
  cached), 293 k out; against Shuttle's https-private (273 min, $25.16 notional) and https-private-v2 (71 min, $16.50
  notional). Checks 33, 26, 4 errors (v2: 1, 1, 0).
- **Done besides:** `tools/run_compare.py` reads a Relay lesson (test `check_run_compare_reads_a_relay_lesson`); the
  engine fingerprinted at the suite, the launch and the end (only the other session's Shuttle-only D-164 files changed).
- **Not done / unverified:** one run; the audio not listened to; L-417 and L-418 (routing) and L-419 (a flaky
  test) OPEN. Trail: the lesson's RUN_LOG, the comparison doc.

## R-53 (2026-10-11): the R-51 fixes and feedback-relay-v3 with its music (Claude Code; subscription, $0.24 Gemini)
- **Asked:** Kshitij: "go ahead" with fixes 1 to 4; transitions only where they make sense and look good; each style its own
  kind of transition.
- **Done:** compose bookkeeping (the mix), the process-tree timeout, the style's seam join (D-160: seam_join and join_note in
  every pack), dips and fades covered only at the middle, templates shown at once after a cut or cover; the style golden
  re-recorded; four tests, each shown red (`docs/research/relay_upgrade/red_runs_r52.txt`). v3 re-rendered through the
  pipeline: music back, fully blank 0.7 s to 0.1 s, under-1 %-edge 2.1 s to 0.5 s; run 4 $1.52 notional.
- **Not done:** the motion and show-don't-tell items (fixes 5 and 6 of the plan); the critic's mid-join reading (L-415,
  OPEN); the audio was measured, not listened to.

## R-52 (2026-10-11): `gps-position`, a 4-minute flat-cosmos explainer on the opus-plan default (Claude Code; subscription)
- **Asked:** Kshitij: "make opus the default for the storyboarding and the lesson script and planning" (D-158), then a new
  topic in a fitting style, 4 minutes, through Shuttle.
- **Result:** `projects/gps-position/renders/gps-position.mp4` (4:41), "How GPS knows where you are", flat-cosmos, explainer,
  mentor. 159 min, $36.52 notional, 34 beats, three reopens; checks 26, 4, 4, 0, 5, 0. Detail in the lesson's RUN_LOG and
  `docs/research/2026-10-11-gps-position-comparison.md`.
- **Not done / unverified:** not listened to; one run; the rework it measured (held_missing at 34 beats, the shadow-blind
  inset check, the brief refusals) is listed for the next engine pass (L-409 to L-411).

## R-51 (2026-10-10): feedback-relay-v3 tested and diagnosed (Claude Code; no paid calls)
- **Asked:** Kshitij: run a proper test on the lesson, reflect on it, find why there are blank cut-offs, identify all
  issues, check first whether our changes introduced anything.
- **Done:** the check's report, render verification, blank, edge and motion scans (v3 against v2, Shuttle v2 and the
  Cowork lesson), loudness, every beat at full size. Our changes introduced nothing; the R-49 seam fade is the same gap in
  another colour. Found: no music or sound (a snapshot's compose marks compose done; L-405); a 95-minute check hang
  (L-406); blank moments from covers, compose's seam substitute and late template leads (L-407); an empty board
  held 6 s; a film that moves in 33 % of its frames (L-408); pale colour; tell over show.
- **Not done:** no fix yet (the engine is frozen for a measured Shuttle run); a ranked fix plan in
  `docs/research/2026-10-10-relay-v3-diagnosis.md`.

## R-50 (2026-10-10): Loom's own checker, the check at draw time, and the https-private rerun `https-private-v2` (Claude Code; subscription)
- **Asked:** Kshitij: why the overlap check took so long and a deterministic checker; "make sure that we first check our checker";
  "run the checker immediately after the scene is drawn"; then "do a run for the same video and same topic and everything".
- **Done:** the background drawn as one pattern (98,958 DOM nodes became 3,107); Loom's checker in the probe (D-154: overlap seen by a
  viewer, covered text, redrawn text, contrast), proved on planted defects and a 12-lesson corpus judged on frames, the default;
  the check in every scene author's look, a beat's own errors holding its submission (D-157); text off its card, a line through an
  object, the section label under the vignette, the flag shadow, a WebGL preflight; `tools/run_compare.py`.
- **Result:** `projects/https-private-v2/renders/https-private-v2.mp4`, the https-private request word for word, the same preset:
  71 min and $16.50 against 273 min and $25.16; checks failed on 1, 1, 0 errors against 27, 15, 8, 7, 3, 3; 79 looks against
  215. Detail in the lesson's RUN_LOG and `docs/research/2026-10-10-https-private-v2-comparison.md`.
- **Not done / unverified:** one run is one sample; the audio was not listened to; the kit's clock leak was found by the lead's
  eye, not by a check (a causality rule is open, L-404); drawing is now half the cost (P8 $8.59).

## R-49 (2026-10-10): after R-48: ordered chains, no black seam, one ending, the hook; feedback-relay-v3 re-rendered (Claude Code; subscription)
- **Asked:** Kshitij: "continue" (fix the film's defects and the scene ordering, L-394).
- **Done:** `Conductor.chains` (L-394 closed); compose's seam substitute is a fade; the last scene holds for the outro
  fade; the style golden re-recorded (agreed with the session running the measured Shuttle run; L-402); b11's
  stray hook removed by a scoped fix through Relay's own scene worker; re-rendered through `agents run`. Two of R-48's
  six defects withdrawn after a full-size look (L-401). Three tests, each shown red.
- **Result:** check 0 errors, critic "ship", render verification 40 of 40; 7.5 / 10 within story-cartoon. Follow-up
  cost $1.14 notional. Trail: the lesson's RUN_LOG, `docs/research/2026-10-10-relay-upgrade.md` section 7.
- **Not done:** the full suite not re-run (the measured Shuttle run is in flight on the same machine; the changed
  tests, the Relay and runtime subsets and the style golden were run); the audio not listened to.

## R-48 (2026-10-10): the Relay upgrade (D-155) and its verification run `feedback-relay-v3` (Claude Code; subscription, $0.11 Gemini)
- **Asked:** Kshitij: "I believe that sonnet writes good. it's not its fault. Just go ahead and upgrade the relay pipeline
  and give it all the fixes required."
- **Done:** every R-46 finding fixed in the engine (D-155, `docs/research/2026-10-10-relay-upgrade.md`): the film card,
  read_artifact, the whole brief to the planners, the look to the script, craft notes; lesson-clock snapshots with
  edits, the runtime hold, kit reports routed, the kit preview gate, large labelled sheets, the snapshot outside the
  lock, a call log, full tool names; gate one_world, the pilot pair, the mix note. 16 tests, 14 shown red by mutation
  (`docs/research/relay_upgrade/red_runs.txt`); the full suite 367 passed, 3 failed (two green alone, one D-154's).
- **Verification:** `projects/feedback-relay-v3/renders/feedback-relay-v3.mp4`, the v2 request word for word, the same
  models (D-142). 7 / 10 within story-cartoon (v2 6 / 10). $8.85 notional (v2 $11.10), rework $2.67 (v2 $5.08).
  Detail in the lesson's RUN_LOG and L-394, L-395.
- **Not done / unverified:** the audio was not listened to; continue chains are still written in parallel (L-394,
  OPEN); the film's six defects are listed, not fixed; one run is one sample.

## R-47 (2026-10-10): office scenes plan-checked and batch prompts (Cowork; no paid calls)
- **Asked:** Kshitij: more prompts for the other office scenes; a way to get them done in batch.
- **Done:** nine scenes plan-checked (three agents), reviewed (one agent), corrected; 27 batch prompts (3 batches x 9 styles)
  beside the 90 single-scene prompts; a test. L-379.
- **Not done:** no master floor plan across the sets; nothing drawn yet from the new prompts.

## R-46 (2026-10-10): Relay quality, shared context, tool calls and cost researched (Claude Code; no paid calls)
- **Asked:** Kshitij: why the Relay video does not feel like a Cowork one and what is missing; does tool calling work;
  what to take from Shuttle (skills on demand and more); can the agents share some context so they make one film with
  one vision; where cost can be cut without losing quality. Research and pros and cons, no implementation.
- **Done:** three story-cartoon films compared (Cowork `groupthink-trap`, Shuttle `feedback-shuttle-opus`, Relay
  `feedback-relay-v2`); three read-only audits (context per role, tool calls from the CLI transcripts, Shuttle's
  mechanisms). Findings: builders never see the film's vision and no tool can fetch it; 48 of 146 scene snapshots in
  v2 fell outside their beat (the tool takes beat-relative seconds, the message gives absolute ones); bug reports lost
  to an unshown schema; runtime errors pass submit; the plan fragmented the world (script without a look, 9 template
  beats, 8 stations); the Cowork film used the cinema mix, so it is a direction, not a control; rework was $5.08 of
  $11.10. Survivors: a film card plus `read_artifact` and a concept seed, honest tools, one world by construction.
- **Not done / unverified:** nothing fixed; savings unmeasured; Shuttle's snapshot clock not checked. Next step: the
  script-only experiment (four ways, about $1.5). Trail `docs/research/2026-10-10-relay-quality-context-research.md`.

## R-45 (2026-10-10): set library and loader (Cowork; no paid calls)
- **Asked:** Kshitij: start the loader; arrange scenes in folders by world; load a scene only on an exact or a perfect
  description match.
- **Done:** D-152, the accepted meeting room as the first library set, the loader, a lab strip (look at it:
  docs/styles/demos/lab/lab_set_meeting_room__cinematic-dawn.jpg), 6 tests, docs.
- **Not done:** no lesson uses a set yet; no character in the set's style (2.5D cast) exists to stand in it; the screen
  content is drawn square to the frame, not in the screen's perspective.

## R-44 (2026-10-09): `feedback-shuttle-v3`, the measured Shuttle run after D-148 (Claude Code operator; subscription, $0.17 Gemini)
- **Asked:** Kshitij: if nothing else can cut cost now without losing quality, "render a proper video once again and see
  how much we are saving with cutting the context part".
- **Output:** `projects/feedback-shuttle-v3/renders/feedback-shuttle-v3.mp4` (2:22, 16 beats, a lesson kit), render
  verification 55 of 55; v2's request word for word, `--isolated`, the same models in the same roles (verified per call).
- **Process:** exit 0, 17:07 to 21:02 (3 h 55 min); no intervention. $41.58 at the engine's table (the CLI's own $56.68),
  838 calls; peak 54 % of the five-hour window, no overage.
- **Against v2 (R-40):** the lead's context per call about halved (build session peak 96k against 314k tokens; mean per
  session 23k to 70k against 48k to 146k), and the lead's cost to the first passing check was flat ($8.11 against
  $8.54) because it made more calls (per-phase session overhead, more delegations). Sub-agents to the first passing
  check $11.88 against $4.76 (v2's build session was stopped before its sub-agents were reconciled, so its figure is
  low; this storyboard's beats also took more work). After the first passing check: $21.59 and 2.5 h against $5.01 and
  15 min: a critic blocker on b07 from an element-name collision (an engine trap) took 3 beat-scoped storyboard reopens,
  each cycling five sessions, with Opus driving the P10 fix rounds; the render's verification took 38 min.
- **Not done / unverified:** the saving D-148 was built for is not shown by one run (the plan and the fix loop differ run
  to run); the film not rated against v2 yet beyond the contact sheets. Trail `projects/feedback-shuttle-v3/RUN_LOG.md`,
  `docs/AGENT_LEARNINGS.md` run 48 (L-372 to L-376).

## R-43 (2026-10-09): office meeting-room pilot reviewed (Cowork; no paid calls)
- **Asked:** Kshitij shared three Claude Design zips for judgement.
- **Done:** intake, renders, geometry overlay, parallax and no-light checks, the review with fix messages; prompt and
  intake changes (L-370, L-371).
- **Result:** layout and contract right; furniture modelled from boxes; 2.5D attempt C and the painterly set go to one
  revision round; flat editorial not yet delivered. Trail `docs/assets/reviews/2026-10-09-office-meeting-room-pilot.md`.

## R-42 (2026-10-09): directed world sets and end-to-end Claude Design prompts (Cowork; no paid calls)
- **Asked:** Kshitij: are the world packs precise enough, "I don't want again the same weird boring cartoon looking
  output", "give me proper end to end prompts", "look for each scene reference online", "chairs should look like chairs".
- **Done:** D-149: 9 set styles with palettes, the office world directed and researched, 99 generated prompts (90 scene,
  9 props), the intake's set checks, a gate and 4 tests; two research sub-agents; three review passes on the meeting room.
- **Not done / unverified:** no Claude Design output yet (the pilot is the three meeting-room prompts); 9 office scenes
  are drafts until plan-checked; 17 worlds still v1; no importer renders these sets in lessons. Trail
  `docs/assets/SET_PROMPTS_GUIDE.md`, `docs/AGENT_LEARNINGS.md` run 46.

## R-41 (2026-10-09): pipeline health pass, every logged fix verified, both films rated (Cowork; no paid calls)
- **Asked:** Kshitij: "look at both the video generation api pipelines and make sure they are healthy and see their
  previous run logs and verify everything has been fixed", then "analyze the new videos from both the pipelines frame by
  frame and rate each lesson".
- **Done:** 129 of 129 Relay and Shuttle tests pass with a browser (first run: 126, 1 failing, 6 skipped); 31 fix tests
  with no recorded red run each shown red with the fix off (a sub-agent, in-process mutations only); fixes L-351 to
  L-354 with tests, each red first. Films: every frame scanned for black and frozen stretches, 576 frames looked at,
  crops at full size. Relay `feedback-relay-v2` 6 / 10, Shuttle `feedback-shuttle-v2` 7.5 / 10; defects with times in the
  write-up; the gates' blind spots are L-355 (OPEN).
- **Not done / unverified:** live provider health (`py -m loom agents doctor` cannot reach providers from the sandbox:
  run it on the PC); the hash fix on Windows itself; the audio was not listened to. Trail
  `docs/research/2026-10-09-pipeline-health-and-film-review.md`, `docs/AGENT_LEARNINGS.md` run 44.

## R-40 (2026-10-09): `feedback-shuttle-v2`, the measured Shuttle run on the fixed rails (Claude Code operator; subscription, $0.14 Gemini)
- **Asked:** Kshitij: start the measured run, don't interfere, but fix what would be a headache or waste a lot of time
  in this run, then go back to testing.
- **Output:** `projects/feedback-shuttle-v2/renders/feedback-shuttle-v2.mp4` (2:21, 16 beats, a lesson kit), render
  verification 51 of 51. The request word for word as the Opus run's (R-34), `--isolated`.
- **Process:** exit 0, 05:23 to 07:10 (1 h 47 min). Opus planned and judged, Sonnet built (D-145). One reopen (the kit,
  right after the pilot pair failed on text drawn twice; the pilot passed 10 minutes later); checks 6, 1, 1, 0 errors;
  critic 5 majors then 0 ("ship"); no beat above 3 agents.
- **Cost:** $18.31 logged at the engine's table, plus $1.25 recovered from the stopped session's transcripts: about
  $19.56 (the Opus run: $71.27, of it $18.33 overage). No overage; the five-hour window peaked at 54 %.
- **Interventions:** nine, all tooling, each logged in the lesson's ledger: the login-refresh wait (L-341), the style
  guide lookup, pilot pictures and looks in P8, kit notes as sentences, the pilot verifying after a kit fix, the launcher
  crash on a build rewritten mid-hash (L-350; the orphaned session stopped and resumed), drafts taken as beats (L-348;
  rule fixed, undoing it in the run refused by the permission system), API names, findings in other words (L-349).
- **Not done:** Kshitij's rating of the film; the full Shuttle suite with L-348's test (refused during the live run).
  Trail: `projects/feedback-shuttle-v2/RUN_LOG.md`, `logs/shuttle/report.md`; `docs/AGENT_LEARNINGS.md` run 43.

## R-39 (2026-10-09): the robustness pass on every issue the Relay verification run caught (Claude Code; subscription plus $0.07 Gemini)
- **Asked:** Kshitij: "fix every issue you caught during this run neatly and very robustly".
- **Done:** L-346 (none in the colour maths; kit-part properties kept; only real kit parts to the kit; dated model ids;
  old sessions not counted twice; the painted-overlap pass fails closed; more option-letter forms and spacing in quiz
  pairs; the build hash memoised; a later critic pass sees only changed beats with its earlier findings; a final
  verify-only look before the render, a blocker stops it; designed dimming is not a defect) and L-347 (an avatar card
  of short lines sets them at the lead size, centred in the card). 9 new tests in `tests/suites/relay_fixes.py` (24 in
  all); the full `--browser` suite 354 passed, 9 skipped (missing local libraries), the one failure the docs' test count,
  updated. On the real run (`feedback-relay-v2`, Run 6): pass 1 read 26,169 tokens (18 sheets), pass 2 7,028 (the 2
  changed beats); the final look named the one finding left (b18), which the template change then fixed (Run 7:
  compose, check 0 errors, render, verification 63 of 63).
- **Result:** `projects/feedback-relay-v2/renders/feedback-relay-v2.mp4` (06:14), 143.8 s. Run 6 cost $0.92 notional and
  $0.07 billed; the lesson in all, $10.54 notional and $0.56 billed, 0 reconcile rows. Trail
  `projects/feedback-relay-v2/RUN_LOG.md` (Runs 6, 7); learnings L-346, L-347.
- **Not done:** checked and left as designed: the critic's b04 "leftover character" (b03's own ending frame), b04's
  0.9 s and b13's 1 s near-empty openings at their joins (inside the film check's allowance). A runtime change does not
  re-compose old lessons (by design); this one was re-composed by hand with `py -m loom run`. No `py -m loom note`:
  engine work, logged here.

## R-38 (2026-10-09): `dc-cooling`, "Where the heat goes", a 4-minute data-centre cooling explainer (Cowork; no paid API calls)
- **Asked:** Kshitij: "make me a 4 minute video on any AI/ML or datacenter concept. Use the style you find the most
  suitable... give me the command I'll render".
- **Done:** topic mode, corporate-clean, explainer, analyst persona. Brief to storyboard by Opus sub-agents (knowledge
  approved "agent, unattended per Kshitij"), the lesson kit and 23 bespoke scenes by Sonnet sub-agents, 9 beats as
  the new `model_shot` preset (D-147). Fixes: L-342 (overlay), L-343 (b27 names), L-344 (b32 boxes), L-345 (framing).
- **Result:** strict draft compose, probe 0 errors (157 elements, 32 scenes), 254.1 s of narration. Contact frames of
  b01, b27 to b29 and b32 looked at. **Unverified here:** the full check (needs the final 30 fps clips), the mix, the
  render and its verification. Trail `projects/dc-cooling/RUN_LOG.md`, `docs/AGENT_LEARNINGS.md` run 41.

## R-36 (2026-10-08 to 09): every issue of R-35 fixed and verified, and `feedback-relay-v2` rendered (Claude Code; subscription plus $0.49 Gemini)
- **Asked:** Kshitij, after R-35: "Plan thoroughly and finally fix every single issue and verify".
- **Done:** the plan `docs/research/2026-10-08-relay-fixes-plan.md`; D-143; fixes with tests for L-324 to L-328 (kit
  defects to the kit's author with `fill: "none"` as no colour, cost from tokens not the CLI's total, served-model guard,
  isolated lessons, no empty re-check passes, the critic's second pass and routed minors), then, found while verifying
  on the isolated rerun `projects/feedback-relay-v2`, L-335 (an overlap not on screen), L-336 (a scene's own inset),
  L-337 (option letters twice), L-338 (quiz answer options; page turns read as seams), L-339 (a scene-only fix left
  the check done). 15 tests in `tests/suites/relay_fixes.py`, each red before or shown failing with its fix off
  (`docs/research/relay_fixes/red_runs.txt`); the full `--browser` suite 343 passed, 1 failed (a generated
  capabilities file, regenerated with `py -m loom catalog`, then passing), 9 skipped (missing local libraries).
- **Result:** `projects/feedback-relay-v2/renders/feedback-relay-v2.mp4`, 143.8 s, render verification 63 of 63; exit 0
  on the fifth process (the first stopped at exit 2 on the invisible overlap, the third on the quiz pair, the rest
  rendered). $9.62 notional (subscription), $0.49 billed (Gemini, eight critic passes), 0 reconcile rows. Trail
  `projects/feedback-relay-v2/RUN_LOG.md`; learnings L-329 to L-331 and L-335 to L-339.
- **Not done:** the fixes from the last critic pass are not judged by a third pass (two at most); the film was not
  compared with Shuttle's (the comparison table in `docs/research/2026-10-08-relay-comparison-run.md` describes R-35's
  run, before these fixes). No `py -m loom note`: engine work, logged here and in D-143.

## R-37 (2026-10-08): the Shuttle Opus run's findings fixed; Shuttle redoes only what changed (Claude Code, no paid calls)
- **Asked:** Kshitij, after the film: "Why is it re-writing everything if one thing goes wrong? This is a complete
  waste. Please fix all the above and this."
- **Done:** D-144. Reopen marks only its phase; later phases and beat files re-check themselves by what they depend on;
  beat-scoped reopens (cap 8); a pilot pair and `pilot_check` before the other beats when there is a kit; scene-authors
  in P8 to P10, fixer 16 turns; a critic that judges only what changed; snapshots on private builds outside the lock;
  the overage guard and stale limit flag; per-model cost reconcile, pinned full model ids, a resumed session counted
  once; template index props checked (`index_of`); the lead isolated from the person's CLAUDE.md and auto-memory.
- **Result:** 12 new tests, each red on the code before it (`docs/research/shuttle/red_runs.txt`); the pilot check on the
  Opus run's own first kit fails it (10 errors at 9.696 s) and passes the shipped one. Full offline suite 297 passed,
  1 failed (agents_router_sends_each_defect_to_its_owner: the Relay session changed the router and that test while the
  suite ran; it passes on the files as they are), 44 skipped (browser tests are opt-in; this session's two browser
  tests were run on their own and pass). S0 on the real CLI with every fix: 15 of 15 cases hold, exit 0; every request
  of the lead and its sub-agents named claude-sonnet-5-5.
- **Found on the way:** the Opus run's lead received Kshitij's global ~/.claude/CLAUDE.md (two graphify lines; shown with
  the run's settings on the real CLI), disclosed in its RUN_LOG; a heredoc patch broke `loom/qa.py` for about a minute
  (L-333). Trail: `docs/AGENT_LEARNINGS.md` run 38 (L-332 to L-334), CHANGELOG, runbook section 12.
- **Not done:** no new Shuttle lesson has been run on the fixed rails (needs Kshitij's go): the time and money saved
  are not measured yet.

## R-35 (2026-10-08): `feedback-relay-sb`, the Relay side of the Relay vs Shuttle comparison (Claude Code operator; subscription plus $0.07 Gemini)
- **Asked:** run Relay end to end on the Shuttle request (feedback that changes behaviour, story-cartoon, 2 min,
  corporate employees, mentor) as operator only, log everything, report cost and the film. During the run Kshitij
  changed the placement: "use opus 5.5 only for storyboarding, make sonnet 5.5 write the code".
- **Done:** a first attempt (`feedback-relay-cmp`, profile claude-cc) stopped by that instruction after 4 stages
  ($0.61 notional, $0.004 billed; its Sonnet rows showed `claude-sonnet-5`); D-142 (profile `claude-cc-opus-sb`, the
  registry's opt-in for Opus on the storyboard, `cc-sonnet` pinned to `claude-sonnet-5-5`, a test); then
  `py -m loom agents run feedback-relay-sb --profile claude-cc-opus-sb --until render --budget 3` (19:53 to 21:19 IST).
- **Result:** exit 2, no film: the check still failed after 2 fix rounds (91, 84, then 70 errors three times; 36 of
  the 70 from one kit part, routed to scene workers, never to the kit). 29 tasks, all accepted; one critic pass (1
  blocker, 4 major, 3 minor). Notional $14.14 as logged ($13.16 without a resumed session counted twice), billed
  $0.0656 (Gemini); 5.0 M input tokens, 83 % cached; wall 1 h 26 min. Trail `projects/feedback-relay-sb/RUN_LOG.md`,
  `docs/research/2026-10-08-relay-comparison-run.md`; learnings L-324 to L-328.
- **Not done:** no render, no MP4, no render verification; no retry (exit 2 is not retried by the operator's rules).
  No `py -m loom note`: the operator did not decide inside the lesson; D-142 is in DECISIONS.

## R-34 (2026-10-08): `feedback-shuttle-opus`, Shuttle end to end with an Opus lead on the subscription
- **Asked:** Kshitij: run Shuttle end to end with Claude Code only as the model API (Opus lead, Sonnet sub-agents), no
  interference with the output or the process, and log every cost, error, issue and blocker. Compared later with the
  Relay run on the same request (`feedback-relay-cmp`).
- **Output:** `projects/feedback-shuttle-opus/renders/feedback-shuttle-opus.mp4` (2:12, 15 beats: 11 bespoke, 2
  avatar, 2 quiz templates; a lesson kit), render verification 51 of 51.
- **Process:** exit 0 after 5 h 11 min and 6 sessions; 4 reopens (the fourth granted by Kshitij with the new
  `shuttle grant-reopen` when the cap stopped the run on b13's quiz index); first check 52 errors, last 0; 5 critic
  passes, the lead shipped with 2 majors accepted with reasons. Two operator resumes (a stale limit flag, the cap).
- **Cost:** $71.27 at list price (Claude notional $70.90, Gemini real $0.37); $18.33 of it (118 calls) ran as paid
  overage because the launcher did not stop on a rejected window with overage in use.
- **Open:** the overage guard and the stale flag; a kit continuity check before beats; the fixer cap; a quiz index
  gate; critic convergence; serial snapshots; sub-agent output undercount; sub-agents on Sonnet 5 (CLI alias).
- **Trail:** `projects/feedback-shuttle-opus/RUN_LOG.md`, `logs/shuttle/report.md`; `docs/AGENT_LEARNINGS.md` run 35
  (L-318 to L-323).

## R-33 (2026-10-08): lab_brush's watercolour fill paints the same pixels for one seed (Claude Code, no paid calls)
- **Asked:** the task R-32 flagged: `primitive_brush_paints_the_same_marks_and_reveals_them_in_order` fails under
  `--browser` because lab_brush's layer 2 (the watercolour fill) changes on every load; find where the fill path takes
  randomness, seed it from the layer's seed, keep the test red before and green after, log the finding as an L- entry.
- **Done:** measured that it is not randomness (Math.random only at p5.brush's module init; identical 2D and WebGL
  call streams and identical mask uploads on 8 bakes in one page, 5 different images); found the cause in p5.brush
  2.2.3's composite shader (dFdx/dFdy after a non-uniform early return); patched the shader source from
  `runtime/brush.js` with a named error if the anchors go; a new test that repeats the bake 8 times in one page; the
  look checked (2223 outline pixels move, the soft edge the blur intends; the lab strip 0 problems).
- **Result:** the new test red 3 of 3 before (5 to 7 fills from one seed), the old pair test red 2 of 3 (it passed by
  chance once); both green 5 of 5 after; the guard fires on a changed shader; the full `--browser` suite 284 passed,
  0 failed, 9 skipped (cairo, OpenCV, symlinks). Record
  `docs/research/determinism/red_brush_fill_shader.txt`, scripts and images in `docs/research/determinism/brush_fill/`;
  learning L-304.
- **Not done:** the look on a real GPU is unverified (the old look was undefined there too). No `py -m loom note`:
  engine work with no project ledger to write to.

## R-32 (2026-10-08): scale origins no longer depend on seek order or on GSAP's ticker (Claude Code, no paid calls)
- **Asked:** L-270's OPEN: build a fixture with a scaled reveal of a rig group, render it N times in headless Chrome,
  hash the frames mid-reveal and report whether they differ; if they do, find why getBBox varies and make the origin
  deterministic, with a test red before the fix; log the finding as a new L- entry.
- **Done:** two causes found in GSAP 3.15 and measured (the origin is taken when the playhead first enters a tween;
  first renders wait until the ticker ticks); `lazy: false` and `Loom.settleOrigins` (D-134, narrowed by D-136); two
  tests red on the runtime before, each half of the fix shown to close one of them; the golden byte test's two causes
  found (L-290, and GSAP's inline origin write), the golden re-recorded from the same pre-WS6 runtime; the claude fork
  measured on a scratch copy of its build; the full suite run.
- **Result:** N renders of one seek order never differed, before or after; different seek orders did (about 9 px at
  1.1 s in the fixture; 16 of 30 fork reveals between the forward path and a fresh jump) and no longer do (0 of 30).
  Boot on the fork: 696 ms to 2157 ms. Record `docs/research/determinism/red_runtime_determinism.txt`; learnings
  L-289, L-290, L-302.
- **Not done:** a backward seek still draws the earlier of two overlapping tweens or same-instant sets (L-290, L-302,
  OPEN); lab_brush's watercolour fill paints differently on every load on every runtime (not this change, flagged as
  its own task). No `py -m loom note`: engine work with no project ledger to write to.

## R-31 (2026-10-08): Shuttle built beside Relay, proven on a scripted model (Claude Code, no paid calls)
- **Asked:** build Shuttle as designed in `docs/strategy/2026-10-08-shuttle-pipeline.md`: verify the platform first, then
  loom-mcp with rails, the playbook and sub-agents, the launchers, and S0 without paid calls; stop before S1 and S2.
- **Done:** the platform verified first (`claude --help` and the binary's own schemas, `claude auth status` with a fake key, the
  CLI against a local fake API; the Agent SDK read in its docs, not installed); `loom/shuttle/` (rails, loom-mcp with 49
  tools, the kit preview, the hook, six sub-agents emitted for Claude Code and the SDK, the launchers); the playbook
  `skills/loom/shuttle-director`; `py -m loom approve <id> facts|plan|final --notes`; 15 offline tests, each red with its
  rail mutated out; S0, the real launcher and `claude -p` driven by a scripted model through P1 to P11 (15 of 15 cases:
  skip-a-gate refused, no file tools, foreign beats and tokenless writes refused, one reopen, one budget stop, three
  approval pauses, seven sub-agents, a failed check fixed by two fixers, the draft render matching its checked frames 90
  of 90). The platform check and S0 found the defects logged as L-292 to L-301, each fixed with a test.
- **Result:** `docs/research/2026-10-08-shuttle-build-report.md`, `docs/research/2026-10-08-shuttle-platform.md`,
  `docs/research/shuttle/red_runs.txt`, `docs/research/shuttle/s0/`; D-135; learnings L-291 to L-301.
- **Not done:** S1 (a subscription lesson) and S2 (API mode), by instruction; the Agent SDK runner (the SDK is not
  installed). No `py -m loom note`: the S0 lesson lives in a temporary folder and its ledger is copied with the evidence.

## R-30 (2026-10-08): the places' set decorations follow the pack (Claude Code, no paid calls)
- **Asked:** route the hard-coded accents L-276 left open in `runtime/places.js` (night window lights, the vessel and
  its cells, rack LEDs, the meeting chart, the warehouse safety line) and `Loom.obj` kinds a pack does not name
  through the pack's materials, falling back to today's token; extend the call-site test and run it red on the old
  runtime; keep the byte-identical test green; set the five guided packs from their guides' section 2 only.
- **Done:** seven `materials` keys read in `places.js` (D-133); the server tray's cables too (L-276's "meeting room's
  wall lines, line 350" is that tray); the call-site test at 35 sites, red on the old runtime for the seven place
  sites; untouched packs byte-identical (the golden test, plus a one-off night-window comparison in all five packs);
  pack values with a `_decor_note` each; strips before and after per pack, each looked at against itself only (D-122);
  two shares measured on full-size frames (glow's muted packages moved to surface).
- **Result:** `docs/research/style-system/red_L276_set_decor.txt`, `docs/styles/demos/guides/<id>/lab_set_decor__*.jpg`,
  the lab scene `scenes_examples/lab/lab_set_decor.js`, each guide's section 17; learnings L-286 to L-288.
- **Not done:** the accents inside the object drawings (L-287 OPEN), a per-token share check and an outlined vessel for
  whiteboard (L-288 OPEN). No `py -m loom note`: this was engine work with no project ledger to write to.
- **Addition (same day):** `run <copy> compose` and `check` on scratch copies of three lessons, with and without this
  change (an engine copy holding only `places.js`, `style.js` and the five packs as they were): mfa-story (corporate-clean)
  1 error and 60 warnings on both sides, the same lines (b10 blank beat, the L-277 gate, newer than its stored report);
  phishing-report (cinematic-noir) 59 errors and 62 warnings on both sides, the same lines; feedback-that-lands timed out
  in the HyperFrames check on both sides (unverified). phishing-report's amber desk and window specks come from its own
  scene code (`b07.js:28`, `:57` to `:60`), which no pack value reaches. Two other sessions worked in this folder at
  the same time: one cited L-286 in runtime comments before logging it (now its L-289) and briefly turned the golden
  test red (fixed there, the golden re-recorded); the other left a syntax error in `mock_server.py` (fixed there).
  Rule kept: read the last id from the log at the moment you write, and log before you cite.

## R-29 (2026-10-08): the style system (WS6) and the bench leftovers B1 to B7 (Claude Code, no paid calls)
- **Asked:** workstream 6 of `docs/strategy/2026-10-07-fix-prompt.md` in full, items B1 to B7, the proof and the logs
  (`docs/strategy/2026-10-08-style-system-prompt.md`).
- **Done:**
  - pack `materials`, `roles` and the other section 15 keys read by the runtime, untouched packs byte-identical
    (D-128); the S-sized guide requests; the guide wired into the storyboard and scene authors and `context_check`;
  - B1 to B7, each with a test red on the old code; `tools/skill_sync.py`;
  - the proof in Chrome: every listed lab scene and both examples per style, each strip looked at, the section 13
    checklists, one crf 18 encode per style; fixes found by looking (books, plants, pots, objects, avatars, the dark
    packs' turn card and monitor, the whiteboard card's words, the lab's vignette order);
  - the claude-balanced fork recomposed, checked and re-rendered (`render --force --reason "post-style proof"`).
- **Result:** `docs/research/2026-10-08-style-system-report.md`, `docs/styles/demos/guides/<id>/README.md`, the
  guides' section 16, the fork's `qa/post_style_review.md`; learnings L-269 to L-278.
- **Not done:** the M and L requests (WALLS_AND_NEEDS); installing `.skill` packages (none needed: 16 of 16 agree);
  any real model call.
- **Addition (same day):** the full suite found one more (L-279: `person_cloth` per slot), and the fork's first post-style
  render three (L-280: the B2 wait narrowed; L-281: the audit counted the vignette; L-285: the frame sheets' labels);
  learnings are L-269 to L-281 and L-285.

## R-28 (2026-10-07 to 08): the bench fixes, RC1 to RC20 and the API path's reach (Claude Code, no paid calls)
- **Asked:** fix every root cause of the five bench videos with a test that fails on the old code, prove it on forks
  of the benches without paid calls, and log it (`docs/strategy/2026-10-07-fix-prompt.md`, workstreams 1 to 5).
- **Done:**
  - the cut-off agents' work reviewed, kept, fixed or reverted (L-265);
  - fixes in runtime, templates, checks, render, gates and agents (D-124 to D-127);
  - four new test suites, every test run red on the pre-session code (224 tests in all);
  - five bench forks checked; two rendered, and every 2 s frame looked at;
  - the demo and two recent lessons checked against the pre-session code.
- **Result:** `docs/research/2026-10-07-bench-fix-report.md`, `docs/research/bench-fix/`, the forks'
  `qa/post_fix_review.md`; learnings L-252 to L-266.
- **Not done:** workstream 6 (style system: in the prompt file on disk, not in the request); any real model call; the
  plans themselves (the gates now refuse all five).

## R-27 (2026-10-04 to 05): the TED-Ed vision study on the pod, distilled off it
- **Asked:** watch 96 TED-Ed films with Qwen3.8-27B-FP8 and bring back what it learned.
- **Done:**
  - on the pod: 6,307 shot records, 96 whole-film records, 630-shot consistency re-run (0.82), planted-defect
    test on 10 films;
  - synthesize on the pod failed twice: first on context size (L-209), then on timeouts (L-210, about 5.5 pod
    hours lost);
  - off the pod: 8 batch guides and 6 merges by sub-agents, every evidence id checked by code (D-110).
- **Result:** `docs/research/vision/2026-10-05-tedEd-study.md`, `docs/research/vision/tedEd_2026-10/`.
- **Not done:** cross-model check (no second model), sound pass, a measured word-to-picture sync check.
- **Addendum (same day):** a full line-by-line read by 43 Opus readers. Results are in
  `docs/research/vision/2026-10-05-tedEd-full-conclusions.md` (D-111, L-212, L-213).
  - The readers stopped once on the organisation's spend limit, and resumed after Kshitij's go-ahead.

## R-26 (2026-10-03): the golden set (D-102 E1)
- **Asked:** build the rating page that defines "mature" before anything else is built.
- **Done:**
  - 60 frames picked by looking at contact sheets of every source;
  - built, checked on a keyed sheet, and rebuilt after L-188;
  - `py -m loom golden serve|report`;
  - the server checked end to end (blind session, refused bad input, no path traversal);
  - the page script driven through a fake DOM;
  - test 83.
- **Waiting:** Kshitij rates (about 10 minutes). Then E2 (bake-off) and E3 (the judge's agreement on the pod).
- **Not verified:** how the page looks in his browser. The sandbox has no browser, so the layout has not been
  seen rendered.

## R-25 (2026-10-03): engine fixes from the frame audit, and the golden segments
- **Asked:** do everything in the audit's fix list, generally (no lesson rules), so nothing bad ships outside
  Cowork.
- **Done:**
  - the D-100 tools and checks (see CHANGELOG);
  - phishing b17 to b21 rebuilt (`qa/preview/b17-b21.mp4`, a 6 fps preview from the build);
  - feedback b37 to b41 camera follow and top-down laptop;
  - tests 81 (80 pass, 1 skip: skia not in the sandbox).
- **Waiting:** Kshitij renders on the PC, watches both segments, and signs them off or not.
- **Trail:** `docs/AGENT_LEARNINGS.md` run 23 (L-173 to L-180); D-100; each project's RUN_LOG.

## R-24 (2026-10-02): step 7, two corporate lessons, the review and the corporate plan
- **Asked:**
  - two 5 to 7 minute corporate lessons, each reviewed;
  - what is wrong, what feels off, whether the styles and tone are good enough, and whether Loom has a plain,
    mature, non-cartoony way to show things;
  - a plan to sell to corporates soon.
- **Kshitij chose:** feedback that lands and phishing; one plain and one cinematic; code presenter bookends;
  unattended knowledge approval; Maya "where she fits" (lesson 1, the manager); Maya v5 arrived mid-run.
- **Built:**
  - rig importer and Maya v5 (D-93);
  - `feedback-that-lands` (47 beats, 429.6 s) and `phishing-report` (42 beats, 420.5 s), through compose;
  - the Chrome check in the sandbox: 0 errors each, with sheets;
  - engine fixes from the sheets (L-161 to L-166): station residue, the reading-floor blind spot, `m.travel`
    origin and seek order, holds on `life`, and `quiz.answer` slots;
  - review `docs/research/2026-10-02-step7-review.md` and `qa/review.json` x2;
  - plan `docs/strategy/2026-10-02-corporate-readiness-plan.md` (D-94).
- **Proven in the sandbox:**
  - the new Chrome travel test fails on the old code and passes on the new;
  - the suite of 77: 69 passed, 1 failed, 7 skipped. The failure was `context_layer_...` (STATE said 74 tests); it
    passes after the STATE fix. The Chrome travel test was among the skips and passed on its own with the browser
    set;
  - `context_check` OK.
- **Not verified:** MP4 renders, sound, pacing and motion measures; the HyperFrames layout and contrast check
  (`run_hf=False` in the sandbox); a human read of the unattended knowledge sheets.
- **Trail:** `docs/AGENT_LEARNINGS.md` run 22; D-93, D-94; each lesson's `RUN_LOG.md`.
- **Later the same day (added, not rewritten):** Kshitij asked why it took about 7 h. The answer was the sandbox
  cap, code written per beat, a first-run debugging tax and a frame cache that every fix throws away. He set the
  target as 30 minutes of video in about 90 minutes, and the cost levers. Recorded as the parked final goal (D-95,
  `docs/strategy/2026-10-02-final-goal.md`). Priority stays on video quality.
- **Later still (added, not rewritten): brain design, render gate, ledger (D-96, D-97).**
  - Kshitij rejected copying RedTee's brain, so the brain is now our own design
    (`docs/strategy/2026-10-02-brain-architecture.md`).
  - The PC check found 7 and 47 errors, and render ran past them. Render now refuses without a passing check
    (L-168). Cairo-less preview tests name a skip (L-170).
  - Kshitij: no step or thinking is cut for cost; log every routing and tooling decision for Jev or fine-tunes
    later. Built `loom/ledger.py`, backfilled 8 lessons (776 records), and added test 78.
  - The phishing MP4 measured 47 % motion.

## R-23 (2026-10-01): Maya v1 judged; the glow-flat pack built
- **Asked:** judge Claude Design's Maya model sheet; build the Kurzgesagt-inspired register as a new pack.
- **Built:**
  - the review `docs/assets/reviews/2026-10-01-maya-model-sheet-v1.md`;
  - the intake fixes (L-138);
  - pack `glow-flat`, the `gloss` grammar and `runtime/glow.js` (16 builders);
  - lab scenes `lab_glow_inside`, `lab_glow_pressure` and `lab_glow_world`;
  - `tools/lab_preview.py` and `tools/node/svg_preview.mjs`;
  - tests: the glow builders run clean in glow-flat and flat-cosmos and are deterministic, and a planted
    Math.random scene is caught; the browser lab test now includes the glow scenes.
- **Proven in the sandbox:**
  - pack lint clean;
  - the three scenes previewed, judged and revised from their frames;
  - the suite 59 passed, 0 failed, 6 skipped (65), run as two subsets;
  - `context_check` OK.
- **Not verified:**
  - the Chrome lab render of the glow scenes (PC);
  - every number on preview frames (fingerprint in `docs/styles/SATURATED_FLAT_PLAN.md`);
  - Kshitij's judgement.
- **Trail:** `docs/AGENT_LEARNINGS.md` run 21 (L-135 to L-138); D-78.
- **Later still (added, not rewritten): Maya v4 reviewed.**
  - Intake 203/203 with no remap; 111 page builds rebuilt, 0 missing; 18 files redrawn against v3.
  - Fixed: thumbs-up, notches, props. Improved: side view, knees (a small kink remains).
  - Verdict: ready for the rig importer (`docs/assets/reviews/2026-10-02-maya-v4.md`).
- **Later still (added, not rewritten): Track B built (D-91, D-92).**
  - Kshitij chose: copy the engine (Track A, later), all house upgrades first, cinema mix opt-in.
  - Built B1 to B12. Proven in the preview with six new lab scenes: joins, data, world, geo, shades, hold.
  - Tests 74 (two new: `cinema_mix_...`, `cinema_house_...`). Baseline extended with the two new tells.
  - Maya v4 arrived mid-run. Intake (203/203) and builds (111, 0 missing) were run; the review waits until after
    this.
- **Later still (added, not rewritten): Kshitij's independent explainer skill studied (D-90).**
  - Read its SKILL.md, references and engine; watched both films with `tools/video_study.py` and in full frames;
    ran its engine here (stills about 0.7 s each).
  - Wrote `docs/research/2026-10-02-explainer-skill-study.md` (evidence in `docs/research/explainer_skill/`) and
    `docs/styles/CINEMA_PLAN.md` (DESIGN). Nothing built; three choices are asked of Kshitij.
- **Later still (added, not rewritten): Maya v3 "final" reviewed (D-89).**
  - Intake: 203 assets, 3 fail (the props, unchanged since v2). With `--declared-slots` all 203 pass.
  - `rig_review.py` extended for the page-as-data shape: 100 builds rebuilt from the delivered parts, 0 missing.
    Sheets and close-ups are in `docs/assets/reviews/maya-v3/`.
  - Verdict: usable, and the importer can start. Optional polish prompt in the review.
  - Tests 72 (rig_review and asset_intake extended). Not verified: Chrome rendering of the parts.
- **Later still (added, not rewritten): free asset sets and the reference-research skill (D-88).**
  - Kshitij: "document all resources... get the ones you are confident don't need license or need to be paid for...
    make a skill out of this".
  - Licences read at source; approved: Fluent Emoji (MIT), Open Doodles, Lukasz Adam, Kenney (CC0). Illlustrations
    moved to look-only (premium mixed in).
  - Built: `assets/vendor/SOURCES.json`, `tools/fetch_assets.py`, `loom/vendor_art.py`, `py -m loom art`,
    `runtime/art.js` (`Loom.art`), `lab_vendor_art`.
  - Fluent installed by npm in the sandbox; the other three need `py tools/fetch_assets.py` on the PC (L-153).
  - Written: `docs/references/RESOURCES.md`; the skill `lnd-reference-research` (repo and account).
  - Tests 72. Not verified: the PC fetch, and the Chrome strip of `lab_vendor_art`.
- **Later still (added, not rewritten): reference first (D-87).**
  - Kshitij: designs must start from existing references, and use more tooling.
  - Researched open-source sets and their licences (`docs/references/SOURCES.md`).
  - Looked at Dribbble office and server-room references in the browser (links only).
  - Wrote `docs/REFERENCE_FIRST.md`, the office board and `tools/ref_board.py` (a ratchet, 1 of 17 boards).
  - Added the story note for drawn beats without references.
  - Rebuilt `Loom.place.office` from the board (before/after preview).
  - Skills updated: lnd-visual-design, loom-scene-author, loom-director (repo and account).
  - Tests 71.
- **Later still (added, not rewritten): the Chrome re-runs.**
  - `lab lab_treat_essentials` showed glow-flat 5/5 clean and flat-cosmos 4/5 (stamps at about 5.9 px).
  - After the stamp height fix: flat-cosmos 5/5 clean.
  - So every lab strip is clean in Chrome.
- **Later still (added, not rewritten): Kshitij's PC run.**
  - The suite passed 69/69; that run predates the rig_review test, so there are now 70.
  - `loom lab all`: every strip is clean except four in `lab_treat_essentials` (tight insets on stamp labels and
    the frame title). Fixed as L-150; the Chrome re-run is pending.
- **Later still (added, not rewritten): Maya v2 arrived and was reviewed.**
  - Kshitij's `Documents/Characters` folder was connected. Intake: 171 assets, 168 pass; the three props
    fail.
  - New `tools/rig_review.py` (D-86). All 24 poses were built from the delivered files.
  - Review: `docs/assets/reviews/2026-10-01-maya-v2.md`. The structure is ready for a rig importer; 9 fixes go
    back to Claude Design.
  - L-149; tests 70.
- **Later still (added, not rewritten): distinctness steps 2 to 5 in one pass (Kshitij: "all steps possible right
  now").**
  - Step 2: the lint now has radius and still-beat tells, names its culprit beats, and warns on a missing or
    unused seed. The baseline was re-recorded on purpose (D-85).
  - Step 3: new lessons get a seed by default; kit cards, marks and the templates' icon discs follow it (D-82).
  - Step 4: `runtime/objects.js`, 12 objects (D-83).
  - Step 5: `runtime/places.js`, 5 places and a parallax camera (D-84).
  - Proof: preview sheets for lab_objects, lab_places, lab_tpl_definition and lab_treat_essentials in
    `docs/styles/demos/preview/`. Tests 69. Learnings L-146 to L-148.
  - Not done here: step 6 (Maya v2) needs Claude Design's assets. Kshitij wants step 7 (lessons with different
    intents and styles) after a pause. Chrome strips of the new lab scenes are not rendered yet.
- **Later still (added, not rewritten): distinctness step 3, the design seed.**
  - Kshitij's direction: essentials stay; give them a new shape, design and style per topic (D-80).
  - Built:
    - `packs/seeds/treatments.json`;
    - `loom/seed.py` and `py -m loom seed`;
    - `runtime/treat.js`, with the glow pill following the seed;
    - compose and lab passing `style.seed`, and `tools/lab_preview.py --seeds`;
    - the ledger keyed by treatment (D-81).
  - Proof: `lab_treat_essentials` under five seeds, preview sheets in `docs/styles/demos/preview/*SEEDS.jpg`.
    The test was proven able to fail with the seed ignored.
  - Learnings L-144 and L-145; tests 67. Chrome strips of the new lab scene are still to be rendered on the PC.
- **Later still (added, not rewritten): distinctness step 1.**
  - Kshitij judged stress-signal: promising story, visuals not there yet, AI-like components, and too much
    repetition across videos.
  - Critique and plan: `docs/styles/DISTINCTNESS_PLAN.md`. The variety ledger and AI-tells lint are built
    (D-79, L-143); the baseline is three lessons; tests 66.
- **Later still (added, not rewritten): stress-signal rendered on Kshitij's PC.**
  - 76.7 s; `render_verify` 36 of 36 frames, 0 mismatches.
  - `check` passed (0 errors) after one fix found on the sheets (L-142).
- **Later the same day (added, not rewritten), the first glow-flat lesson:** `projects/stress-signal`
  (about 77 s).
  - Brief to compose was done in the sandbox; Kshitij approved the knowledge sheet.
  - `check` and `render` wait for his PC (RUN_LOG).
  - Also: the glow fixes (crackle, vortex, coral, tickets), L-140 and L-141.
- **Later the same day (added, not rewritten):** on Kshitij's PC the three glow lab strips rendered with 0
  problems, and the suite passed 65 of 65 with 0 skipped. The render matches the preview (L-139). Waiting on his
  verdict.

## R-22 (2026-10-01): TED-Ed and Kurzgesagt studied
- **Asked:** study the TED-Ed (7) and Kurzgesagt (7) folders fully, visuals and storyboarding and anything
  else; the sandbox disk was freed for it.
- **Built:**
  - `docs/research/teded/2026-10-01-teded-study.md` and `docs/research/kurz/2026-10-01-kurzgesagt-study.md`;
  - a five-channel section in `docs/research/2026-10-01-channels-compared.md`;
  - small, sourced additions to `lnd-explainer-craft` and to `lnd-visual-storyteller` section 9;
  - wishlist prompts G1 to G4 and three engine candidates;
  - `style_fingerprint.py` refuses a mismatched `--label` count, with a test (L-130).
- **Proven in the sandbox:**
  - every frame claim was checked on sheets, strips, hold grabs or cut checks;
  - the new fingerprint assertion passes on the new tool and was shown to fail on the old one;
  - one transcript claim (the sugar-cube line) was checked against the words.
- **Not verified:**
  - the exact narration (pocketsphinx is rough; whisper needs a model download, not approved);
  - the full test suite and `context_check` were not re-run on the PC after these edits.
- **Trail:** `docs/AGENT_LEARNINGS.md` run 20 (L-130 to L-132); D-76.
- **Checked at the end of the run (added):**
  - in the sandbox, `py tools/context_check.py` printed OK;
  - the suite printed 57 passed, 0 failed and 6 skipped (the browser and skia tests need the PC).
- **Later the same day (added, not rewritten):** Kshitij asked three things: can Loom make Kurzgesagt-like
  videos; were the detailed 10-second animation moments really seen; and how to get characters back from
  Claude Design.
  - **The 10-second moments:** they had not been studied (L-134). Thirteen windows were then strip-read at
    0.5 s (9 Kurzgesagt, 4 TED-Ed), and the window picker became `explain_study.py moments`.
  - **A frame row drafted before its strip was opened** was rewritten from the frames (L-133).
  - **Answered and recorded:** `docs/styles/SATURATED_FLAT_PLAN.md` (DESIGN, not built).
  - **Claude Design return:** its help page lists no SVG export. Prompt R and `tools/asset_intake.py` were
    added, with a test (D-77). Not verified: that its .zip keeps separate SVG files.

## R-21 (2026-10-01): the visual gain, the explainer craft, and the way out of Cowork
- **Asked:**
  - learn their visual styles and make new or better ones;
  - shape the explainer skill (adults at work, not teacher-like);
  - a checklist for running outside Cowork;
  - a wishlist of characters, props and scenes with Claude Design prompts.
- **Built:**
  - `tools/style_fingerprint.py` and `tools/explain_study.py`;
  - `toon` shading; rigs `pip`, `tess` and `extra`; `runtime/scenery.js`;
  - packs `story-cartoon`, `presenter-pop` and `chalk-lab`;
  - lab scenes `lab_story_set`, `lab_matrix_build` and `lab_one_board`; `loom lab --frames`;
  - skill `lnd-explainer-craft`, wired into the script, storyboard and scenes stages;
  - `docs/research/2026-10-01-visual-study.md`, `docs/PORTABILITY_CHECKLIST.md` and `docs/ASSET_WISHLIST.md`;
  - 5 tests (63).
- **Proven in the sandbox:**
  - the lab renders clean in all three new packs and corporate-clean;
  - the old lesson is pixel-identical (10 of 10 frames);
  - the toon outline sits in Crayon's measured range;
  - 62 tests passed before the disk filled.
- **Not verified:** the hand-rebuilt Video-Engine copy has not been run (L-123, L-124); no real lesson is built in
  the new packs yet.
- **Trail:** `docs/AGENT_LEARNINGS.md` run 19 (L-119 to L-124); D-74, D-75.
- **Later the same day (added, not rewritten):**
  - **On Kshitij's PC:** setup ran (npm, browser, Kokoro, catalog) and the suite passed 57, failed 0 and
    skipped 6.
  - **Fixed on the way:**
    - the animatic length on newer FFmpeg (L-125);
    - skips are now reported as SKIP (L-126);
    - a lab crash I introduced, and browser detection in the tests (L-127).
  - **Character prompts rewritten** after Kshitij judged the first results far too basic (L-128).
  - **Next:** the TED-Ed folder, studied with the tools on the PC because the sandbox is wedged (STATE, Open work).

## R-20 (2026-10-01): watching Crayon Capital, Cleo Abram and Lucas's Lab
- **Asked:** watch the Crayon Capital videos supplied; then the Cleo Abram and Lucas's Lab folders.
- **Built:**
  - `tools/video_study.py` and `tools/transcribe_videos.py` (research only, outside the render path);
  - studies: `docs/research/crayon/`, `cleo/`, `lucas/`, and `docs/research/2026-10-01-channels-compared.md`;
  - storyteller skill section 9 (three registers as references); needs added to `docs/styles/WALLS_AND_NEEDS.md`;
  - 2 tests (58).
- **Found and fixed:** the cut detector counted a lighting change (L-114); a note written from numbers alone
  was wrong and was corrected against frames (L-115).
- **Not verified:** exact wording of any narration (transcripts are rough, L-113); speech rates are corrected
  by an estimate.
- **Trail:** `docs/AGENT_LEARNINGS.md` run 18 (L-113 to L-118); D-73.

## R-19 (2026-10-01): the Gemini notes checked
- **Received:** 22 video notes from Gemini (14 in a file, 8 in chat), then a second batch of 5 (Crayon
  Capital, right URLs but simulated by Gemini's own account).
- **Found:**
  - 1 plausible (BYD, still to be checked against the video);
  - 1 on the wrong URL;
  - 20 filler.
  None were used. The second batch was rejected too (L-112).
- **Built:**
  - `tools/check_video_notes.py`;
  - `docs/research/gemini/VERIFICATION_2026-10-01.md`;
  - the rejected file, kept as evidence in `docs/research/gemini/_rejected/`;
  - brief updates;
  - 1 test.
- **Trail:** `docs/AGENT_LEARNINGS.md` run 17 (L-111); D-72.

## R-18 (2026-10-01): palette study tool
- **Asked:** try Gemini's frame-by-frame colour extraction script on the reference channels.
- **Built:** `tools/palette_study.py` (a rebuild, scored against a known palette: 8 of 9 tokens against 6
  for the script as given); `docs/research/palettes/README.md`; 1 test.
- **Waiting on:** the video files, named `<channel>__<title>.mp4`.
- **Trail:** `docs/AGENT_LEARNINGS.md` run 16 (L-110); D-71.

## R-17 (2026-10-01): both ways kept, the person chooses
- **Asked:** keep both the classic and the new treatments; the video maker chooses (interview, sample
  frames, one prompt to change); keep it simple and human.
- **Built:**
  - `loom/options.py` (`loom options`, `loom switch`, `alternatives`, gate check);
  - interview `look` and brief `look`;
  - storyboard prompt rule 7;
  - skill updates (storyteller, director; repo and account);
  - `_ss_story` b02, b11 and b22 carry the original busts as alternatives;
  - 1 test.
- **Proof:** bust switch pixel-identical to the original lesson; switch back exact.
- **Trail:** `docs/AGENT_LEARNINGS.md` run 15 (L-109); D-70.

## R-16 (2026-10-01): engagement with pedagogy, a real lesson upgraded, recent research
- **Asked:** do not organise storyboarding around dated frameworks alone; no cost labels; make the
  improvement work and be visible; find recent research on attention, learning and recall.
- **Built:**
  - story suggestions for every genre; tiers parked; `loom cost` reports drivers only;
  - `projects/_ss_story` (spacing-sticks with a rigged running character, her room and a depth window;
    check 0 errors);
  - `projects/_ss_base` (an untouched copy used as the baseline);
  - the fx overlay fix (D-68), with a test;
  - the research report and its fold-in to three skills.
- **Outputs:**
  - `docs/styles/demos/2026-10-01_story_upgrade_before_after.mp4` and `.jpg`;
  - `docs/styles/demos/2026-10-01_story_upgrade_after_cut.mp4`;
  - `docs/research/2026-10-01-attention-learning-recall.md`.
- **Not done here:** the full `_ss_story` MP4 (about 50 min in this sandbox; L-106).
- **Trail:** `docs/AGENT_LEARNINGS.md` run 14 (L-102 to L-107); D-67 to D-69.

## R-15 (2026-09-30): references not rules, production tiers, the Gemini brief
- **Asked:** is Gemini enough, or does Claude need the videos; a Gemini prompt; P-5 declined (insights
  must stay references; pedagogy first); label every path by cost so users choose and pay accordingly.
- **Built:** `docs/research/GEMINI_BRIEF.md`; `loom/cost.py` (`loom cost`, `--production`, budget notes);
  `docs/PRODUCTION_TIERS.md`; genre-aware story suggestions in `loom/story.py`; storyteller skill revised
  (repo and account); a tier and storytelling-dial line in every genre pack; 1 new test.
- **Waiting on:** the Gemini run and, optionally, the short clips it nominates (D-66).
- **Trail:** `docs/AGENT_LEARNINGS.md` run 13 (L-100, L-101); D-64 to D-66.

## R-14 (2026-09-30): characters, depth, isometric, storytelling, the styles reel, reference channels
- **Asked:** document all libraries; build P-4 (character rig, depth stage and cinematic packs, iso kit,
  storytelling pass); one short video with every style; the walls per style; then study five reference
  channels and match their quality.
- **Built:** `docs/STACK.md`, `runtime/rig.js`, `runtime/rigs/people.js`, `runtime/depth.js`, `runtime/iso.js`,
  2 style packs, `loom/story.py` (`loom animatic`), `loom/reel.py` (`loom reel`), skill
  `lnd-visual-storyteller`, 3 lab scenes, 5 tests.
- **Outputs:** `docs/styles/demos/2026-09-30_styles_reel.mp4` (38.8 s, 13 segments) and its sheet;
  `docs/styles/WALLS_AND_NEEDS.md`; `docs/research/2026-09-30-reference-channels.md`; animatics in
  `projects/spacing-sticks/qa/` and `projects/blameless-postmortem/qa/`.
- **Not done:** P-5 (rubric checks and pattern templates) awaits the requester; iso templates deferred by
  the promotion rule.
- **Trail:** `docs/AGENT_LEARNINGS.md` run 12 (L-92 to L-99); D-59 to D-63, P-5.

## R-13 (2026-09-30): research into 2D, 2.5D, cinematic and isometric styles
- **Asked:** libraries, tools and methods for 2D character animation, 2.5D, deeper and more cinematic motion
  graphics, isometric, and turning a concept into cinematic storyline visuals.
- **Output:** `docs/strategy/2026-09-30-cinematic-styles-roadmap.md` (proposal P-4).
- **Proofs** (lab strips in `docs/styles/demos/lab/`):
  - `scenes_examples/skia/cinematic_25d.py` (2.5D);
  - `scenes_examples/three/isometric_office.js` (isometric).
  - `ctx.neutral()` was added for neutral light colours in Three.js scenes.
- **Not built:** character rigs, the depth stage, the iso kit, the storytelling pass (awaiting P-4).

## R-12 (2026-09-30): beyond SVG - shaders, Skia, Three.js, Lottie
- **Asked:** all the best capabilities (shader layer, Skia, Lottie, and more), output quality first.
- **Built:** `runtime/fx.js`, `runtime/lottie.js`, `runtime/skia/`, `runtime/three/`,
  `loom/skia_bridge.py`, `loom/three_bridge.py`, lab clip strips, trailer clip re-timing, `fx` in every
  style, 7 tests. Docs: `docs/VISUALS_PLUS.md`.
- **Showcase:** `docs/styles/demos/2026-09-30_fx_showcase_trailer.mp4` (29.4 s, rendered by HyperFrames
  from the `_fxdemo` fork), plus lab strips in `docs/styles/demos/lab/`.
- **Not done:** blameless and spacing-sticks were not re-rendered with the fx layer (L-90).
- **Trail:** `docs/AGENT_LEARNINGS.md` run 11 (L-82 to L-91); D-52 to D-58.

## R-11 (2026-09-30): adopting BRAG and motion/framer; trailers and the motion lab
- **Asked:** adopt the good parts of both skills, improve Loom's skills, and push the visuals; show
  filmstrips plus one clip; keep sound synthesised.
- **Built:**
  - `runtime/expressive.js`, `runtime/interaction.js`, `runtime/trailer.js`;
  - `loom/trailer.py`, `loom/lab.py`;
  - sound events and the in-key mix;
  - the reading-floor and double-exposure checks, mid-join frames, the poster;
  - skills updated (7 in the repo, 3 re-saved to the account).
- **Outputs:**
  - `projects/blameless-postmortem/trailer/blameless-postmortem-trailer.mp4` (29.7 s), with `.jpg` and
    `card.txt`;
  - `docs/styles/demos/lab/*.jpg`.
- **Fixed:** spacing-sticks hero.meter notes (a double exposure), re-rendered; the old MP4 is in
  `renders/archive/`.
- **Trail:** `docs/AGENT_LEARNINGS.md` run 10 (L-74 to L-81); D-43 to D-51.

## R-10 (2026-09-30): faster Manim restyles, all as engine tooling
- **Asked:** make Manim restyles fast (reuse by colours read, drafts, a shared store, parallel) plus a
  fixed-colour check, as engine commands.
- **Built:** `docs/MANIM.md`, `loom manim`, `loom cache`, `loom verify`, 6 tests. Brand colours now
  reach Manim (L-68).
- **Proven:**
  - clips adopted with 0 redraws, and the lesson build is byte-identical;
  - a restyle took 23 s with drafts, and 17 s from the store;
  - the render refused drafts.
- **Not verified here:** the full `check` and `render` path with drafts on a real lesson. It exceeds the
  sandbox's 3-minute limit; it is covered by a test with the stages replaced by stand-ins.
- **Trail:** `docs/AGENT_LEARNINGS.md` run 9 (L-68 to L-73); D-37 to D-42.

## R-9 (2026-09-30): brand on any style, and the Studio P0
- **Asked:** build brand-on-any-style (P-1, approved), with the Studio brand-kit screen in the first
  version.
- **Built:** `loom/brand.py`, the runtime brand layer, the brand gate, `loom brand`, `loom restyle`,
  `loom studio`, `docs/BRANDS.md`, and a fictional demo brand (`packs/brands/harbor-labs`).
- **Proven:**
  - the preview on all 7 styles;
  - 3 lesson restyles with a brand (0 errors, no model calls);
  - the Studio flow in headless Chromium;
  - the original blameless lesson unchanged (88/88).
- **Screenshots and frames:** `docs/styles/demos/2026-09-30_*`.
- **Trail:** `docs/AGENT_LEARNINGS.md` run 8 (L-61 to L-67); D-32 to D-36.

## R-8 (2026-09-30): Engineering and Line Art styles
- **Asked:** explain brand-on-any-style; add the Engineering and Line Art styles now; show demo frames
  only.
- **Built:** the `engineering` and `line-art` packs; the `line` grammar (D-30); `fonts.roles` (D-31);
  label fixes in two templates (L-58); the spill tolerance (L-59).
- **Result:** 4 restyles (2 lessons x 2 styles) with 0 errors and no model calls. Frames in
  `docs/styles/demos/`.
- **Decisions:** D-28 (don't wait for interviews) and D-29 (a mix of creators; tooling is the edge),
  both the requester's.
- **Pending:** P-1, brand-on-any-style (explained in the strategy addendum).
- **Trail:** `docs/AGENT_LEARNINGS.md` run 7 (L-58 to L-60).

## R-7 (2026-09-30): restyle experiment and style strategy
- **Asked:** the styles today and next; parameterisation; less re-invention; the RedTee vision and its
  users.
- **Measured:** a restyle of blameless into corporate-clean with no model calls: 28 errors, 5 after the
  `kit.sketch` fallback (D-27).
- **Written:** `docs/strategy/2026-09-30-styles-reuse-and-users.md`, a proposal with P-1 to P-3 pending
  Kshitij.
- **Trail:** `docs/AGENT_LEARNINGS.md` run 6 (L-55 to L-57).

## R-6 (2026-09-30): measured layout
- **Asked:** fix text not fitting its card (screenshot), and explain how space is measured.
- **Built:**
  - real font metrics and tracking;
  - `kit.fit`, for measure-then-draw;
  - three drawn-glyph checks: box, element and card inset;
  - truthful element boxes in the templates;
  - measured quiz cards;
  - `docs/LAYOUT.md`.
- **Lessons:** both re-checked with 0 errors. Both were re-rendered with the fixed layout; the earlier
  MP4s are archived in `projects/*/renders/archive/`.
- **Trail:** `docs/AGENT_LEARNINGS.md` run 5 (L-48 to L-54); D-23 to D-26;
  `projects/blameless-postmortem/RUN_LOG.md`.

## R-5 (2026-09-30): template promotion, the sample-text detector, and the context layer
- **Asked:**
  - promote beat designs to templates through `loom-template-author` after a couple of uses, with 3
    conditions: props-only text, a test proving check flags sample text, and a real pick in a test
    storyboard;
  - close L-31 to L-38;
  - never touch RedTee;
  - keep every log;
  - manage the context properly.
- **Built:**
  - `loom/checks/text_audit.py` (in `check`);
  - the design pipeline in `loom/library.py` (tags, 2-use threshold, assessment, promote, blind pick,
    candidate hiding, re-proof on change, max-length stress case);
  - the decisions lock;
  - distinct-use counting;
  - the `m.draw` arrow option;
  - this context layer and `tools/context_check.py`.
- **Library:** 12 designs tagged. `attention_converges` reached 2 uses and was deferred. The tag splits
  from L-31 were applied.
- **Proof:** `library/proofs/2026-09-30-template-promotion/`. `cause.converge` was built, picked blind
  (3/3 targets, 0/2 decoys), caught overflowing at a type floor, fixed, and promoted in the proof copy
  only.
- **Regression:** both lessons pass check with 0 errors. The MP4 frames match 88/88 (blameless) and
  73/73 (spacing-sticks).
- **Incident:** a sandbox reset lost the unsynced work, which was redone (L-39, D-21).
- **Trail:** `docs/AGENT_LEARNINGS.md` run 4 (L-39 to L-47); D-15 to D-22 in `DECISIONS.md`.

## R-4 (2026-09-30): element library (components)
- **Asked:** reuse small elements, not scenes; promote after 3 uses; adjustable at use; be smart about
  what is promoted.
- **Built:** `runtime/components.js`, `@form` tags, `loom library`, the component sheet in every style,
  backfill with a comments-only gate.
- **Result:** 33 forms from 15 scenes. 5 were assessed: 3 rejected, 2 deferred, 0 promoted. The mechanism
  was proven with a throwaway `demo_badge`, which was removed afterwards.
- **Trail:** `docs/AGENT_LEARNINGS.md` run 3 (L-31 to L-38); D-9 to D-14.

## R-3 (2026-09-29/30): `blameless-postmortem`, whiteboard sketch, clean engine run
- **Asked:** a new topic in a hand-drawn style, made with Loom's own tooling only.
- **Output:** `projects/blameless-postmortem/renders/blameless-postmortem.mp4` (5:04), with captions and
  a transcript.
- **Process:** engine frozen; every model stage was a sub-agent given only its task file; 10 engine bugs
  fixed openly; 2 review passes.
- **Open at ship:** 5 review majors (b28 arrive frame, b10, b21, b16, b08), all layout and pacing.
- **Trail:** `projects/blameless-postmortem/RUN_LOG.md`; `docs/AGENT_LEARNINGS.md` run 2; D-1 to D-8.

## R-2 (2026-09-29): `spacing-sticks`, flat-cosmos, the first Loom lesson
- **Output:** `projects/spacing-sticks/renders/spacing-sticks.mp4` (4:11).
- **Note:** some content was authored by the orchestrator outside the task-file path. That was
  disclosed when asked, and it is why R-3's protocol exists.
- **Trail:** `docs/AGENT_LEARNINGS.md` run 1.

## R-1 (2026-09-29): tooling research and the first motion-graphics demo (before Loom)
- **Output:** "How a flight booking works" (Kurzgesagt style), made with the HyperFrames plus GSAP stack
  that Loom was then built on.
