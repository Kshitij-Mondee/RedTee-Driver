# Bench fix report: RC1 to RC20 and the API path's reach (2026-10-07)

Prompt: `docs/strategy/2026-10-07-fix-prompt.md`. Post-mortem: `docs/research/2026-10-07-bench-postmortem.md`.
Decisions D-124 to D-127; learnings L-252 to L-265. No paid model call was made; the claude_code provider was not
started. Raw outputs: `docs/research/bench-fix/`.

## 0. Step 0: backup, the cut-off session's work, baselines

- Backup (not git): `../Video-Engine-backup-2026-10-07/` (runtime, loom, tools, tests, packs, prompts at session start).
- The originals before the cut-off agents (`../Video-Engine-presession-2026-10-07/`) were rebuilt from the agents'
  own scratch copies; `../Video-Engine-oldtree/` is that pre-session code with junctions to the shared folders. Every
  new suite was run there: all red (`docs/research/bench-fix/red_runs/`), then the tree was restored.
- The list of files the cut-off work changed, and what happened to each: `docs/research/bench-fix/cutoff_files.md`.
- The cut-off work was reviewed file by file (L-265): kept where correct and tested; fixed where broken; reverted:
  `loom/agents/bench.py` and `tests/suites/agents_runtime.py` cut-off versions, the `claude-code-mix` and
  `claude-code-only` profiles (they belong to the next prompt) (`docs/research/bench-fix/reverted/`).
- Correction to the prompt's list: `loom/checks/film.py` blur and foreign checks were the agents' drafts, but
  `tests/suites/checks_film_defects.py`, the `caption_active` tokens, the style-lint caption check and
  `tools/caption_contrast.py` were written by THIS session before it was cut off, not by the four agents.
- The five style passes (guides and pack edits) were kept as they landed; the caption check passes on all 13 packs.
- Baselines at session start: `baseline_tests_nobrowser.txt` (133 passed, 16 failed, 34 skipped),
  `baseline_tests_browser.txt` (161 passed, 18 failed, 4 skipped); pre-session code `presession_tests_nobrowser.txt`
  (141 passed, 8 failed, 18 skipped).

## 1. Per root cause

Red = the test run on the pre-session code (`red_runs/`). "Bench before/after" numbers are in section 2.

| RC | what | fix (file:line) | tests (each red on the old code) |
|---|---|---|---|
| RC1 | elements with no entrance visible from t=0 | element life: `runtime/world.js:566` `Wd.planLife` (each element switched off outside its beat's window; `lifeT` in the report) | `primitive_runtime_element_life_pixels`, `primitive_runtime_five_beat_film_invariants`, `check_every_element_has_a_life_window` |
| RC2 | `exit: "none"` meant never | same life window: an unkept element leaves after its last holder (`world.js:566`) | `primitive_runtime_element_life_pixels`, `primitive_runtime_five_beat_film_invariants` |
| RC3 | a thrown scene rendered silently; held "Priya" vs "priya"; element passed as parent | `world.js:389` scene_threw draws the beat's narration card, inside the beat's own focus (`:401`); `world.js:228` ctx.held case-insensitive (warns `held_name_case`), each element counted once over two hops (`:222`); `world.js:208` ctx.el takes an element as parent or throws naming the beat; `runtime/motion.js:208` m.travel given an array or nothing is a `motion_target` error at build (it crashed in a frame callback); the scenes gate takes a case-only held name as a warning (`loom/checks/gates.py:742`); `render --force` refuses thrown scenes (`loom/flow.py:194`) | `primitive_runtime_held_name_case_and_el_parent`, `primitive_runtime_element_life_pixels`, `primitive_runtime_thrown_scene_card_sits_in_the_frame`, `primitive_runtime_travel_names_a_wrong_target_at_build`, `pipeline_held_case_only_warns_in_the_scenes_gate_as_at_runtime`, `check_render_force_needs_a_reason_the_checked_build_and_no_thrown_scene` |
| RC4 | `m.draw` left filled heads visible | `runtime/motion.js:102` fill-opacity held at 0 until the stroke arrives | `primitive_runtime_element_life_pixels` (arrow head case) |
| RC5 | keep of a container leaves a husk; 268 held_missing | storyboard gate: keep names must exist on the same station; husk warns (`loom/checks/story.py:202`) | `pipeline_keep_names_must_exist_on_the_same_station` |
| RC6 | highlight bars float after their card | document.page lines and bars are the page's followers (`runtime/templates/documents.js:71`; exits cascade `world.js:498`) | `primitive_tpl_document_lines_are_followers_of_the_page`, `primitive_runtime_followers_exit_with_leader` |
| RC7 | backplate blur on the live beat | per-group blur filters, the live group never blurred (`world.js:338`); film check measures each beat's own words (`loom/checks/film.py:78`, `:141`) | `primitive_runtime_backplate_blur_never_on_own_beat`, `check_blurred_beat_is_measured_on_its_own_words_and_never_excused` |
| RC8 | templates without the lead | `runtime/templates/_helpers.js:9` to `:41` (`H.cue`, `leadAt`, `lead`, `structAt`, `leadStruct`), used by compare.two, document.page, process.flow, timeline, heroes, redtee; a compare.two panel is never after its own items (`runtime/templates/core.js:207`) | `primitive_tpl_every_template_shows_its_structure_by_the_lead`, `primitive_tpl_compare_and_page_structure_leads_and_words_still_land`, `primitive_tpl_each_anchor_is_cued_once_per_build`, `primitive_tpl_a_compare_panel_is_never_after_its_own_items` |
| RC9 | nested stations with their own w/h | `world.js:42` w/h ignored (`station_size_ignored`), local space 1920x1080; gate `story.py:42` | `primitive_runtime_nested_station_is_one_frame`, `pipeline_framing_the_runtime_ignores_is_refused` |
| RC10 | shot.focus/zoom on template beats | `world.js:430` FRAME_LAYOUT kinds ignore focus and zoom (`shot_framing_ignored`); gate `story.py:42` (D-125) | `primitive_runtime_frame_layout_beats_ignore_focus`, `pipeline_framing_the_runtime_ignores_is_refused` |
| RC11 | a bespoke focus crops held content | the probe reports own elements and words off frame (`tools/node/probe.mjs`), `film.py:231` errors (ratchet for old lessons); router sends it to the storyboard when the beat's own shot causes it (`loom/agents/router.py:34`) | `check_probe_measures_off_frame_elements_words_and_figures`, `check_off_frame_rows_are_errors_ratcheted_for_old_lessons_and_a_blind_measure_is_red`, `pipeline_router_sends_the_new_defects_to_their_owners` |
| RC12 | characters taller than the frame | `runtime/rig.js:268` `figure_cropped` (head or side out of the station; clip-path aware); probe figure pass | `primitive_runtime_figure_cropped_warns`, `check_probe_measures_off_frame_elements_words_and_figures` |
| RC13 | spotlight rect resolved before the camera | `world.js:271` fxMoment keeps the world rect, resolves the screen rect at draw time | `primitive_runtime_fx_moment_rect_follows_camera`, `primitive_runtime_five_beat_film_invariants` |
| RC14 | 0.82 keep veil shows old words | `world.js:327` kept words or template parts get 0.94; words under a backplate are marked as layering for the HyperFrames audit while covered (`world.js:602` `Wd.planCover`) | `primitive_runtime_backplate_veil_full_over_kept_words`, `primitive_runtime_words_under_a_backplate_are_marked_as_layering` |
| RC15 | length never sent, never held | task messages (`loom/agents/conductor.py:128`, `:147`, `:166`); `requested_s` (`loom/checks/gates.py:146`); `LENGTH_TOL` 1.3, `script_seconds`, `beat_cap`, `check_narration` (`gates.py:371` to `:393`); narrate refuses (`flow.py` run_code) | `pipeline_length_is_sent_stated_and_bounded`, `pipeline_length_estimate_matches_the_narrated_benches`, `agents_the_requested_length_is_enforced_and_sent` |
| RC15 (bypass) | `mark_done` and `--keep` left no trace | `flow.py:36` override logged; `conductor.py` run(regate=False) logs per stage | `check_mark_done_over_a_rejection_is_logged`, `pipeline_keep_and_hand_overrides_are_logged` |
| RC16 | invented and placeholder text; workers without context | `conductor.py:58` `scene_context` (held, neighbours, cast) in the scene task; `loom/checks/text_audit.py:188`, `:205` lesson vocabulary (ratchet); `story.py:335` placeholders; `{"empty": true}` in compare.two and document.page | `pipeline_scene_workers_get_held_elements_neighbours_and_cast`, `pipeline_bespoke_scenes_may_only_draw_the_lessons_words`, `pipeline_placeholder_text_is_refused_and_empty_slots_pass`, `primitive_tpl_empty_slots_draw_a_slot_and_no_words` |
| RC17 | a slide deck: one template, alternation, empty avatar | `story.py:248` template cap, ping-pong, hybrid; avatar props and card (`runtime/overlay.js:114`, `story.py:288`, `:305`); mix as a ceiling in agents runs (D-127) | `pipeline_one_template_cannot_carry_a_lesson`, `pipeline_avatar_props_are_checked_against_the_presenter`, `primitive_tpl_avatar_card_fills_the_frame_and_unknown_keys_are_errors`, `pipeline_the_mix_is_a_ceiling_in_an_agents_run` |
| RC18 | one person, many looks | `story.py:500` `cast_errors` (D-126); `H.person` draws a cast member exactly as the cast says (`_helpers.js`); cast in the scene task | `pipeline_one_person_has_one_look`, `primitive_tpl_a_cast_member_has_one_look_in_every_template` |
| RC19 | tone drew a verdict; no myth stance; critic blind | compare.two `valence`, `verdict`, `stance` (`runtime/templates/core.js:162`, `:170`); `conductor.py:555` critic in batches of 40 with narration, props and a polarity rubric, run on a failed check | `primitive_tpl_compare_valence_is_colour_and_verdict_is_the_mark`, `primitive_tpl_stance_tags_a_myth_and_strikes_it`, `pipeline_the_critic_sees_every_beat_with_its_narration_and_runs_on_a_failed_check` |
| RC20 | caption active word unreadable | pack `caption_active` tokens; `loom/checks/style_lint.py:38` `caption_ratios` (4.5:1 active, 7:1 text, over the composited pill); `overlay.js:53` fallback warns | `check_style_lint_measures_the_caption_pill`, `primitive_tpl_caption_active_word_reads_on_the_pill_in_every_pack` |
| check blindness | probe skipped wholly off words, counted empty svg as paint, no foreign pixels | `tools/node/probe.mjs` (element ownership, clip-path paint boxes, moved-off exemption, settle before every shot, full-resolution confirm), `film.py:284` foreign, `:318` records; `tools/film_audit.py` zero denominators | `check_probe_measures_foreign_pixels_on_a_built_lesson`, `check_foreign_pixels_report_other_beats_and_never_pass_blind`, `check_film_audit_reports_preshown_exit_none_foreign_blur_and_zero_denominators`, `check_ledger_gives_film_defects_their_own_kinds` |
| forced renders | all five forced, one spliced | `flow.py:194` (D-124), `loom/render.py:128`, `:131`, `:144` | `check_render_force_needs_a_reason_the_checked_build_and_no_thrown_scene`, `check_render_segments_carry_the_build_hash_and_stale_ones_are_dropped`, `check_render_verification_fails_above_ten_percent_and_on_zero` |
| section M | no Manim, Skia, Three; most of the toolbox hidden | clip workers (`conductor.py:55`, `loom/agents/tools.py:324`, `:357`), `capabilities` (`loom/capabilities.py`, `tools.py:254`), `get_beat` (`tools.py:194`), examples (`tools.py:227`), look round (`conductor.py:422`, `tools.py:245`), api-path kind refusal (`story.py:29`) | `pipeline_clip_workers_render_manim_skia_and_three`, `pipeline_capabilities_list_every_runtime_builder`, `pipeline_discovery_tools_reach_the_whole_toolbox`, `pipeline_the_storyboard_looks_at_its_animatic_once`, `pipeline_storyboard_refuses_a_kind_nobody_writes` |

## 2. PROOF on the five benches (no paid calls)

**How.** `tools/bench_proof.py`.
- *Before:* each ORIGINAL bench build (its own old runtime, copied to `../Video-Engine-sandbox/before/<id>/`; the bench
  folder only read) measured with today's probe and film checks.
- *After:* each bench forked to `projects/<id>-fix1007` (its inputs copied, the id fixed; `restyle --as` stops at the
  storyboard gate, which now refuses these plans by design), composed with today's runtime and fully checked.
- Light and spotlight moments are measured by `tools/node/fx_moments.mjs` (each moment's screen rect at its own time).
- Per-bench JSON: `docs/research/bench-fix/proof/<bench>_before.json`, `<bench>_after.json`; the snapshots taken
  before the late engine fixes are `<bench>_after_first_check.json`.

| bench | measure | before (original build) | after (fork, today's engine) |
|---|---|---|---|
| openai-balanced | self-blurred beats | 15 of 52: b03, b06, b08, b10, b18, b20, b22, b24 | 0 of 52 |
| openai-balanced | foreign-pixel beats (>300 px) | 2 of 52: b16, b52 | 0 of 52 |
| openai-balanced | off-frame errors | 50 | 1 |
| openai-balanced | template beats first reveal > 1 s (worst) | 14 of 48: b05, b07, b10, b13, b15, b16, b20, b24 (4.73 s) | 1 of 48: b16 (1.07 s) |
| openai-balanced | dim moments off screen | none in this lesson (nothing to measure) | none in this lesson (nothing to measure) |
| openai-balanced | empty or blank errors | 2 | 1 |
| openai-balanced | check errors (kinds) | 359 {'runtime held_missing': 268, 'words_cut': 27, 'off_frame': 23, 'blurred_beat': 15, 'runtime text_spill': 7, 'runtime icon_missing': 6, 'runtime text_outside_element': 3, 'runtime text_overflow': 2, 'hf layout content_overlap': 2, 'foreign_pixels': 2, 'runtime scene_threw': 1, 'runtime tight_inset': 1, 'nothing developing': 1, 'empty_frame': 1} | 286 {'runtime held_missing': 264, 'runtime text_spill': 7, 'runtime icon_missing': 6, 'runtime text_outside_element': 3, 'runtime text_overflow': 2, 'hf layout content_overlap': 2, 'nothing developing': 1, 'off_frame': 1} |
| claude-balanced | self-blurred beats | 2 of 54: b19, b23 | 0 of 54 |
| claude-balanced | foreign-pixel beats (>300 px) | 38 of 54: b01, b02, b03, b04, b05, b06, b07, b08 | 0 of 54 |
| claude-balanced | off-frame errors | 18 | 12 |
| claude-balanced | template beats first reveal > 1 s (worst) | 1 of 28: b41 (3.19 s) | 1 of 28: b41 (1.23 s) |
| claude-balanced | dim moments off screen | 5 of 5: b23 light 197.06s on frame 0, b27 spotlight 227.21s on frame 0, b34 light 293.94s on frame 0, b37 spotlight 336.84s on frame 0, b42 spotlight 371.46s on frame 0 | 0 of 5 |
| claude-balanced | empty or blank errors | 0 | 0 |
| claude-balanced | check errors (kinds) | 97 {'foreign_pixels': 37, 'off_frame': 12, 'runtime held_missing': 9, 'hf contrast contrast_aa_failure': 9, 'hf layout content_overlap': 7, 'words_cut': 6, 'runtime scene_threw': 3, 'runtime unknown_motion_setting': 3, 'runtime held_needs_same_station': 3, 'runtime unknown_token': 2, 'blurred_beat': 2, 'runtime tween_threw': 1, 'runtime text_spill': 1, 'runtime tight_inset': 1, 'runtime text_overflow': 1} | 30 {'off_frame': 12, 'runtime held_missing': 5, 'runtime unknown_motion_setting': 3, 'runtime held_needs_same_station': 3, 'runtime motion_target': 2, 'runtime unknown_token': 2, 'runtime text_spill': 1, 'runtime text_overflow': 1, 'hf layout content_overlap': 1} |
| gemini-balanced | self-blurred beats | 1 of 35: b31 | 0 of 35 |
| gemini-balanced | foreign-pixel beats (>300 px) | 1 of 35: b28 | 0 of 35 |
| gemini-balanced | off-frame errors | 11 | 0 |
| gemini-balanced | template beats first reveal > 1 s (worst) | 12 of 32: b05, b07, b08, b16, b19, b20, b21, b23 (7.73 s) | 2 of 32: b16, b31 (1.23 s) |
| gemini-balanced | dim moments off screen | none in this lesson (nothing to measure) | none in this lesson (nothing to measure) |
| gemini-balanced | empty or blank errors | 0 | 0 |
| gemini-balanced | check errors (kinds) | 36 {'runtime text_overflow': 6, 'off_frame': 6, 'words_cut': 5, 'hf layout content_overlap': 4, 'hf contrast contrast_aa_failure': 4, 'runtime held_missing': 3, 'runtime icon_missing': 3, 'runtime text_outside_element': 2, 'runtime tight_inset': 1, 'foreign_pixels': 1, 'blurred_beat': 1} | 16 {'runtime text_overflow': 6, 'hf contrast contrast_aa_failure': 4, 'runtime held_missing': 3, 'runtime icon_missing': 3} |
| mixed-value | self-blurred beats | 2 of 44: b10, b12 | 0 of 44 |
| mixed-value | foreign-pixel beats (>300 px) | 17 of 44: b08, b09, b10, b11, b12, b13, b15, b16 | 0 of 44 |
| mixed-value | off-frame errors | 1 | 0 |
| mixed-value | template beats first reveal > 1 s (worst) | 2 of 37: b30, b34 (6.89 s) | 1 of 37: b30 (1.07 s) |
| mixed-value | dim moments off screen | 12 of 13: b06 spotlight 61.79s on frame 0, b15 spotlight 154.88s on frame 0, b17 spotlight 175.76s on frame 0, b20 light 205.07s on frame 0, b24 light 245.73s on frame 0, b28 light 296.35s on frame 0, b31 light 329.95s on frame 0, b33 spotlight 348.06s on frame 0 | 0 of 13 |
| mixed-value | empty or blank errors | 1 | 0 |
| mixed-value | check errors (kinds) | 151 {'hf layout content_overlap': 80, 'foreign_pixels': 17, 'runtime text_overflow': 14, 'runtime held_missing': 12, 'runtime icon_missing': 11, 'other': 4, 'runtime text_outside_element': 3, 'nothing developing': 2, 'blurred_beat': 2, 'runtime unknown_token': 1, 'runtime scene_threw': 1, 'runtime tight_inset': 1, 'text_too_small': 1, 'words_cut': 1, 'empty_frame': 1} | 50 {'runtime text_overflow': 14, 'runtime held_missing': 12, 'runtime icon_missing': 11, 'hf layout content_overlap': 5, 'other': 4, 'nothing developing': 2, 'runtime unknown_token': 1, 'runtime scene_threw': 1} |
| budget | self-blurred beats | 1 of 26: b22 | 0 of 26 |
| budget | foreign-pixel beats (>300 px) | 5 of 26: b01, b02, b03, b12, b13 | 0 of 26 |
| budget | off-frame errors | 5 | 2 |
| budget | template beats first reveal > 1 s (worst) | 2 of 14: b12, b15 (2.77 s) | 0 of 14 (0.88 s) |
| budget | dim moments off screen | none in this lesson (nothing to measure) | none in this lesson (nothing to measure) |
| budget | empty or blank errors | 0 | 0 |
| budget | check errors (kinds) | 80 {'runtime held_missing': 34, 'runtime text_overflow': 16, 'runtime icon_missing': 5, 'hf layout content_overlap': 5, 'foreign_pixels': 5, 'runtime text_outside_element': 3, 'words_cut': 3, 'runtime unknown_token': 2, 'off_frame': 2, 'runtime tight_inset': 1, 'nothing developing': 1, 'hf layout text_box_overflow': 1, 'other': 1, 'blurred_beat': 1} | 69 {'runtime held_missing': 34, 'runtime text_overflow': 16, 'runtime icon_missing': 5, 'hf layout content_overlap': 3, 'runtime avatar_props_unknown': 2, 'runtime cast_not_drawable': 2, 'runtime unknown_token': 2, 'runtime text_outside_element': 1, 'nothing developing': 1, 'other': 1, 'words_cut': 1, 'off_frame': 1} |

Reading it:
- **Self-blur, foreign pixels, dim flashes: to 0 on every bench.** The blurred beats before are exactly the
  post-mortem's lists (openai b03 b06 b08 b10 b18 b20 b22 b24 b26 b30 b34 b39 b41 b43 b48; claude b19 b23; mixed b10
  b12; budget b22; gemini b31). Off-screen spotlights: claude 5 of 5 and mixed 12 of 13 before, 0 after.
- **Off-frame errors.**
  - openai 50 to 1, gemini 11 to 0 (b16 and b31, the nested stations with their own w/h, now lay out in one frame),
    mixed 1 to 0.
  - openai's one left is b02, the stand-in shapes I drew on the fork (section 3), placed without its 1.7x focus: the
    check caught my mistake.
  - claude 18 to 12: the 12 are characters cut at the top (rigs at scale 1.5, RC12). They are now errors per beat,
    routed to the scene; the engine reports them and does not move a character itself.
  - budget 5 to 2: b14 and b23, a bespoke beat's own focus cropping what it holds (RC11), reported and routed.
- **Late first reveal** (template beats whose first element arrives more than 1 s after the beat starts):
  - before: openai 14 (worst 4.73 s), gemini 12 (7.73 s), mixed 2 (6.89 s), claude 1 (3.19 s), budget 2 (2.77 s);
  - after: at most 2 per bench, the worst 1.23 s (the lead plus a title's own reveal).
- **Thrown scenes.**
  - Before: openai b02, claude b01 b03 b17 b46, mixed b13.
  - After the engine fixes (element as parent, held over two hops, travel target), 0 on openai and claude.
  - mixed b13 still throws: `consequence_strip is not defined`, a bug in the scene's own code.
- **Check errors fall but do not reach 0.** What is left is the plans' own defects, which the gates now refuse
  (below): openai's 264 `held_missing` come from keep lists naming parts that never existed (RC5).
- **Empty or blank errors:** the film check's "empty" measure did not see gemini's blank nested beats (they read as
  words cut off the frame instead), so that row says little; the off-frame row carries it.

### Storyboard gate rejections per bench (the gate working, not a regression)

The plans are identical before and after; today's gates refuse every one of them:

| bench | pedagogy | script | storyboard | scenes | narration |
|---|---|---|---|---|---|
| openai-balanced | 3: length 3 | 3: script runs ~675s against a 480s plan (x 1, length 1, beat cap 1 | 103: focus on frame layout 51, keep missing 39, allocation 7, placeholder 4, template cap 2 | 1: held missing 1 | 1: length 1 |
| claude-balanced | 3: length 3 | 2: length 1, beat cap 1 | 25: cast 18, allocation 5, placeholder 2 | 21: cast 15, held missing 4, held across stations 2 | 1: length 1 |
| gemini-balanced | 2: length 2 | 2: length 1, beat cap 1 | 14: allocation 4, cast 4, nested w/h 3, placeholder 1, keep missing 1, template cap 1 | 0 | 1: length 1 |
| mixed-value | 3: length 3 | 2: length 1, beat cap 1 | 21: allocation 13, placeholder 7, template cap 1 | 9: invented words 6, held missing 3 | 1: length 1 |
| budget | 2: length 2 | 2: length 1, beat cap 1 | 21: keep missing 9, cast 8, avatar props 2, focus on frame layout 1, template cap 1 | 10: cast 7, held missing 2, invented words 1 | 1: length 1 |

Every bench is refused on length:
- the plan states 270 to 600 s for a 2-minute request;
- the script runs 299 to 675 s against a cap of 156 s;
- 26 to 54 beats against a cap of 20;
- the narration runs 306 to 683 s.

Then each bench's own storyboard faults: openai's focus on 51 template beats and 39 keep names; claude's 18 cast
errors (Priya and Dev swap rigs, RC18); gemini's 3 nested stations with their own size; mixed-value's 7 placeholder
slots ("Blank: yours, kept private") and 6 invented words in scenes ("In yesterday's release planning meeting," in b11
and b13); budget's avatar props the presenter never read, and Jordan in story.cast with no look.

## 3. Rendered forks: openai-balanced and claude-balanced

**How they were rendered.** Both forks were re-composed and re-checked on the final engine, then rendered with
`py -m loom run <fork> render --force --reason "post-fix proof"`.
- Each forced render was logged as an override with its reason, error count and build hash: openai 286 errors,
  claude 30.
- Each render was verified against its checked preview: openai 163 of 163 sampled moments, claude 172 of 172,
  0 mismatches.
- One frame every 2 s was extracted (`tools/frame_review.py`) and every frame was looked at: openai 341 frames on 22
  sheets, claude 237 on 15.
- What I saw, beat by beat, is in each fork's `qa/post_fix_review.md`:
  - `projects/bench-20261006-151439-openai-balanced-fix1007/qa/post_fix_review.md`
  - `projects/bench-20261006-151439-claude-balanced-fix1007/qa/post_fix_review.md`

**Measured on the MP4s** (`tools/film_audit.py` at 2 fps, the original bench MP4s measured the same way):

| | openai before | openai after | claude before | claude after |
|---|---|---|---|---|
| blurred beats | 15 | 0 | 2 | 0 |
| beats with other beats' pictures | 2 | 0 | 38 | 0 |
| frames almost empty while speaking | 92 of 1293 (7.1 %) | 44 (3.4 %) | 0 of 835 | 0 |
| unkept `exit: "none"` elements | 0 | 0 | 8 | 0 |

**What the frames showed, in short.**

*Gone:*
- self-blur;
- other beats' pictures (claude's meeting room no longer carries b52's people);
- off-screen spotlights (claude b27, b37 and the b34 light now land on their panels);
- templates shifted off the frame;
- empty first seconds (each template opens with its structure).

*Left in the films:*
- **openai:** kept dark cards under the next template, unveiled (b10 to b12, b49: the worst frames left; RC5 at the
  gate, no runtime veil); avatar beats two thirds empty; brief blank frames at several joins; a compare.two item before
  its panel (b20, b36, b45: fixed after the render, `primitive_tpl_a_compare_panel_is_never_after_its_own_items`, red
  first); my own off-frame stand-ins in b02.
- **claude:** heads cut off in about a third of the beats (RC12, now an error per beat); Priya and Dev in two different
  rigs and colours (b01 against b47, RC18, refused); b30's 3.9x zoom (RC11); b17's red card with red words (colour
  values passed as tokens); b18, b46 and b13 nearly empty.

**Engine bugs these renders and checks found, each fixed with a test that failed before its fix (L-266):**
- the thrown-scene card cropped by its beat's focus;
- the case-insensitive hold lost on a second hop;
- `m.travel` crashing on an array or on nothing;
- compare.two items before their panel;
- the HyperFrames audit reading words under a backplate as overlapping (found on quick-question-cost, section 4).

## 4. The demo and two recent good lessons

Full check (probe, HyperFrames, sheets, film checks) of each lesson recomposed with today's runtime in a sandbox copy
(`tools/lesson_sandbox.py ... --to ../Video-Engine-sandbox/regress --check`; the lesson keeps its id, so its baseline
applies; the project folder is only read). Logs: `docs/research/bench-fix/regress_check.log`, `regress_qqc_recheck.log`.

| lesson | errors | warnings | compared with |
|---|---|---|---|
| spacing-sticks (the demo) | 0 | 37 | its film-check findings are baseline warnings (`film_baseline.json`) |
| mfa-story (made 2026-10-06, all check errors fixed) | 0 | 38 | the same |
| quick-question-cost (2026-10-06) | 7 | 44 | the same check on the PRE-SESSION code: 10 errors (`regress_qqc_oldcode.log`) |

quick-question-cost, error by error:
- The 7 left are HyperFrames `content_overlap` at 74 to 79 s (b09: a pile of "Quick question?" notes stacked on
  purpose). All 7 occur on the pre-session code too. Nothing new.
- The pre-session code had 3 more: 2 overlaps at 46.2 s (b05's definition over b04's kept page, now marked as
  layering under the backplate) and "stress" 17.2 px at 110.8 s in b12.
- The b12 one: b11's slot badges stayed on screen through b12 although b12 never holds them; with element life they
  leave with b11. Both contact sheets were looked at
  (`../Video-Engine-sandbox/regress_old/quick-question-cost/qa/sheets/b12.jpg` against
  `../Video-Engine-sandbox/regress/quick-question-cost/qa/sheets/b12.jpg`).
- That is a visible change to a finished lesson: if its author wanted the badges in b12, b12 should hold them.

The first run of this comparison found 3 NEW errors at b05: b04's page lines now stay with the kept page (the RC5 and
RC6 fix) under b05's veiled, blurred backplate, and the HyperFrames audit counted them as overlapping b05's words. The
runtime now marks words under a backplate as layering while they are covered
(`primitive_runtime_words_under_a_backplate_are_marked_as_layering`, red first); the recheck shows 0 new.

The recorded baseline for finished lessons (9 lessons, `loom/checks/film_baseline.json`) was re-recorded after every
checker change and reviewed entry by entry. Four checker bugs were found and fixed that way (L-256): word forms, a
cast that demanded skin and cloth of a designed rig, objects in a cast, and an avatar title limit of 9 words (its
frame looked at: 10 words on three clean lines). One finding was confirmed real on its frames: blameless-postmortem's
on-call engineer has two looks (b01 light, b15 darker). quick-question-cost b04 and b18 put a zoom (1.05, 1.04) on a
document.page: true from the plan itself, not looked at on frames (the runtime now ignores it). One is a likely
checker limit: phishing-report b13, a group ("security team") drawn by two rigs (frame looked at). The two lessons
with a confirmed or doubtful finding carry a `loom note`.

## 5. Tests

224 tests (`py tools/context_check.py` counts them from the runner's own prefixes). Outputs in `docs/research/bench-fix/`.

| run | passed | failed | skipped |
|---|---|---|---|
| session start, no browser flag (`baseline_tests_nobrowser.txt`) | 133 | 16 | 34 |
| session start, `--browser` (`baseline_tests_browser.txt`) | 161 | 18 | 4 |
| pre-session code, no browser flag (`presession_tests_nobrowser.txt`) | 141 | 8 | 18 |
| **final, no browser flag** (`final_tests_nobrowser.txt`) | **198** | **8** | **18** |
| **final, `--browser`** (`final_tests_browser.txt`) | **213** | **7** | **4** |

- **Failures in both final runs** (7): `vendor_art_comes_only_from_approved_sets_and_builds_clean`, the three
  `vision_lab_*`, `mock_llm_client_disconnect_is_quiet`, and the two `primitive_material_*`. All of them also fail on
  the pre-session code (section 6).
- **The eighth failure of the no-browser run** is `context_layer_agrees_with_the_code`: the test count changed while
  that run was going. It passes alone, appended to the same file.
- **Skips:** the no-browser run's 18 skip with a named reason (no `--browser`, no cairo). The browser run's 4 skip on
  the missing cairo library, named.
- **Red runs, each on the code before its fix:**
  - the four new suites on the pre-session code (`red_runs/*_on_*`);
  - the tests added during the proof, on the code just before their fix (`red_runs/*_before_fix.txt`: thrown-scene
    card, held over two hops, travel target, backplate layering, compare panel, held case in the gate);
  - the cast check's no-look case: its red run is the crash on budget's plan (`proof_after.log`).
- `py tools/context_check.py`: OK.

## 6. What is not fixed or not verified

**Not verified (no run could show it here):**
- Every agents change (scene context, clip workers, the look round, the critic batches and rubric, the mix as a
  ceiling, the new role cards) was proven on mock providers only. No paid call was made, as asked, so how real models
  use the new context, tools and cards is unknown until the next run.
- Clip workers render real Manim, Skia and Three drafts through their bridges in the test, but only from known-good
  sources sent by the mock; no model has written a clip.
- Workstream 6 (the style system) is in `docs/strategy/2026-10-07-fix-prompt.md` on disk, but it was not in the request
  given in chat and was not started.

**Not fixed (seen, reported, routed; the engine does not repair a plan or a scene):**
- **The five plans themselves.** Length (narration 306 to 683 s for a 120 s request: 2.6 to 5.7 times), keep lists naming parts that never existed
  (openai 264 `held_missing`), focus on templates, avatar props, cast, placeholders. The gates now refuse every one;
  fixing them means re-planning, which takes paid calls.
- **A template that keeps something after a template gets no backplate.** So a kept dark card stays unveiled under
  the next template's words (openai b10, b11, b12, b49). The gate warns on keeping a container, but the frame is still
  poor when a plan does it.
- **Blank moments at joins between template beats** (the outgoing beat has left, the incoming one's first element has
  not arrived). openai: 3.4 % of speaking time (7.1 % before).
- **claude's characters cut at the top** (12 errors, rigs at scale 1.5, RC12), now reported per beat and routed to the
  scene. Not resized by the engine.
- **budget b14 and b23:** a bespoke beat's own focus crops what it holds (RC11). Reported and routed.
- **mixed-value b13** throws on its own undefined variable (`consequence_strip`). Its fallback card shows the beat's
  narration; render refuses it.
- **openai b02:** my fork-only stand-ins render off frame (section 3).

**Checker limits, known:**
- The vocabulary check flags illustrative invented details on purpose: a typo-squatted domain in phishing-report,
  Ebbinghaus nonsense syllables in spacing-sticks. They are baselined for those lessons; a new lesson must name such
  words in its storyboard to pass.
- A cast entry for a group drawn by several rigs reads as two looks (phishing-report b13).
- The film check's "empty" measure missed gemini's blank nested beats; the off-frame measure caught them.

**Failing tests that are not this session's:**
- These also fail on the pre-session code (`presession_tests_nobrowser.txt`):
  - `vision_lab_*` (3): Windows symlink privilege, missing fixtures;
  - `primitive_material_*` (2): no cairo library;
  - `vendor_art_comes_only_from_approved_sets_and_builds_clean`: the e2kit set's licence reads "CC0 1.0 (Loom's own)",
    the test accepts "CC0 1.0" only;
  - `mock_llm_client_disconnect_is_quiet`.
- Not investigated further.

