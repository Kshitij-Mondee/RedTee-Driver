# The style system (WS6) and the bench leftovers B1 to B7: report (2026-10-08)

The work asked for in `docs/strategy/2026-10-08-style-system-prompt.md`: workstream 6 of
`docs/strategy/2026-10-07-fix-prompt.md` (the style system), items B1 to B7, the proof and the logs. Same rules as
the bench fixes: a backup first (`../Video-Engine-backup-2026-10-08`), every fix with a test run red on the old code
(records in `docs/research/style-system/red_*.txt`), new checks ratcheted, no paid model calls (none was made; the
claude_code provider was not started), generated files only through their commands, logs appended. Decision D-128;
learnings L-269 to L-278.

Line numbers below are as of this report.

## A. The style system

### A1. Shared runtime changes

| item | fix | test (red on the old code) | before, after | still unverified |
|---|---|---|---|---|
| pack `materials` | `runtime/style.js:66` `S.material`, `:69` `S.materialList`; readers `places.js:190,199,219,372,373,396` (wood, books, chairs, shelving), `places.js:97,215` (pots), `scenery.js:54,115,116` (books, monitor, screen), `objects.js:70` (per-kind tone) | `primitive_style_materials_and_roles_paint_their_call_sites`, `primitive_style_every_role_and_material_site_follows_the_pack` (18 sites) | before: wood, chairs and screens in the accent whatever the pack; after: each follows the pack, an unknown token is `unknown_role_token` | other hard-coded accents in places (L-276, OPEN) |
| pack `roles` | `runtime/style.js:64` `S.role`, `S.roleList`; readers in `kit.js:499` (kicker), `templates/core.js` (term, its rule and icon, verdict, stat value), `templates/more.js` (quiz letter, recap rule, date), `data.js` (chapter kicker), `ui_artefacts.js` (link, button, me bubble, ui mark, avatar list `:42`), `interaction.js` (button), `_helpers.js` (person cloth), `scenery.js:160` (turn card) | same two tests | as above | |
| untouched packs unchanged | every reader falls back to the token it used before | `primitive_style_untouched_packs_draw_byte_identical_to_before`: 11 pack and scene pairs hashed from the runtime before WS6 | identical bytes (GSAP's origin memo excluded, L-270) | whiteboard is not in the set (its sketch paths changed on purpose) |
| `fx.spotlight` {strength, tint} | `runtime/fx.js:95` (the MOMENT shader takes `u_dim`, `c_tint`) | `primitive_style_fx_spotlight_and_vignette_follow_the_pack` | outside alpha 242 at the default 0.55, 110 at 0.25; the tint reaches the layer (220, 37, 37 for neg) | judged only in `lab_fx` and the noir example |
| `fx.vignette_under` | `runtime/fx.js:164` (its own layer before the camera); the lab: `loom/lab.py:83` | the fx test above; `primitive_style_lab_page_draws_the_vignette_under_the_drawing` | before: over the drawing (the lab appended it on top even after the runtime fix); after: under the world | the 0.08 corporate vignette is too faint to see |
| `characters.bottom`, `white` | `runtime/rig.js:41`; contact shadow `rig.js:84`, `scenery.js` desk | `primitive_style_characters_bottom_and_contact_shadow_follow_the_pack` | trousers and eye whites follow the pack; 0.28 shadows under a figure and a desk | |
| M.travel drive key | `runtime/motion.js:249` | `primitive_style_a_second_travel_does_not_jump_at_load` (seeks early first, L-271) | old: (800, 200) at 0.5 s, the second leg's start; new: (200, 200) | |
| m.draw stroke-first, own opacity, dashes | `runtime/motion.js:76` (order, delays), `:94` (dash through a mask), `:111` (own opacity) | `primitive_style_m_draw_draws_outlines_first_and_keeps_dashes_and_opacity` | old: no `data-set`, hachure first, dash replaced, opacity forced to 1; new: outline then hachure, '14 10' kept, 0.45 and 0.5 kept | |
| font weight clamp | `runtime/style.js:91` `S.loadedWeight`; `kit.js:322` (drawn and measured), `overlay.js` (captions, chrome), `ui_artefacts.js` (measures at the drawn weight) | `primitive_style_no_pack_draws_a_weight_its_font_did_not_load` (325 texts, 5 packs) | old: Space Grotesk 300/400/600/800 and others drawn unloaded; new: every drawn weight loaded | captions and chrome are not in the test page (code path shared) |
| `loom lab --file` with cues | `loom/lab.py:36` (`cueOf`: the cues map, then words, then a number, else `lab_cue_unresolved`), `page(file=)`; CLI `loom/cli.py:268` (`--out` on every path) | `primitive_style_lab_file_resolves_its_cues`, `check_style_lab_out_folder_reaches_every_strip_path` | old: `page()` had no file; `--out` unknown; new: 0.9, 6.0, 2.5 resolved | |
| the guide read by the agents | `loom/stages.py:87` `reading_list`; `loom/agent/tasks.py`; `loom/agents/runtime.py` `parity_files`; `loom/agents/tools.py:196` `guide_text`; `loom/agents/conductor.py` | `check_style_guide_reaches_the_storyboard_and_scene_authors` | old: no guide in any reading list; new: storyboard and scenes read it | not run in a real agents lesson (no paid calls) |
| guide against pack | `tools/context_check.py:98` `guide_drift` (section 6) | `check_style_guide_palette_drift_is_caught` | a changed hex, a missing `guide` key and zero rows are each named | |

### A2. The S-sized requests from each guide's section 15
Shipped, each covered by the tests above or below: sketch arrows (open two-stroke heads) and rounded rects
(`kit.js:205`, `:299`, `primitive_style_sketch_arrows_are_open_strokes_and_rects_keep_their_radius`); the marker rule
in sketch (`templates/core.js`); the glow disc as one gradient and the glow defaults in the field family
(`glow.js:90`, `:172`, `primitive_style_glow_is_one_gradient_and_depth_ids_are_unique`); gloss toward a pack token
(`style.js:28`); depth glow and cone `z` with unique ids (`depth.js:63`); the paper `document.page`
(`templates/documents.js:26`, `primitive_style_document_paper_variant_and_the_counter`); counter tabular digits and
the pack's count duration, the dip line in accent (`data.js:46`); UI avatar and me-bubble tones; the nebula mix by
intensity. The M and L requests are in `docs/styles/WALLS_AND_NEEDS.md` (2026-10-08 section).

### A3. Pipeline wiring
See the "guide read by the agents" and "guide against pack" rows. `py tools/context_check.py` reports no drift.

### A4. Proof per style
Strips, measurements and the section 13 checklists: `docs/styles/demos/guides/<id>/README.md`; each guide's section
16 summarises it. One example per style encoded at H.264 crf 18 (24 fps, the pack's fx on):

| style | example | PSNR, last frame | darkest corner, source to MP4 |
|---|---|---|---|
| corporate-clean | wall chart | 44.3 dB | mean 202; one hard edge, no banding |
| story-cartoon | two-shot | 41.5 dB | mean 193; paper grain kept (102 to 126 levels) |
| glow-flat | focus day | 41.4 dB | mean 25; 74 to 83 levels, largest step 13 to 11; the glow disc smooth |
| cinematic-noir | after hours | 42.7 dB | mean 12.8 to 12.2; 26 to 27 levels, largest step 1 to 2; the lamp cone has no rings |
| whiteboard | handover | 41.4 dB | mean 227; paper texture kept |

Found and fixed by looking at the strips (each with a test, red on the old code):
- books, plants, pots, calendar headers and UI avatars in the accent: `materials.books`, `plant`, `pot`, `objects`,
  `roles.avatar` (L-276);
- dark packs: the turn card a cream flash, the monitor body white: `roles.turn_card`, `materials.monitor` (L-275);
- whiteboard: the turn card's words ink on ink (1.00:1); the card now resolves its colour
  (`primitive_style_turn_card_words_read_on_their_card_in_every_pack`, 12.6 to 18.2:1 in all five packs);
- the lab drew the "under" vignette over the drawing (`loom/lab.py:83`);
- corporate's definition template in three hue families (`roles.term` set, so rule and icon follow);
- examples: story-cartoon nameplates (`tight_inset`) and Maya's crop under the hip; the whiteboard question's 7 px
  spill; the corporate and whiteboard examples had no `@lab` header (every cue read 0).

Left as known gaps: engine lab layouts overflow the larger type floors (story-cartoon label 30 px, whiteboard body
34 px): the UI type role (M); noir has no contact shadow value (a choice for Kshitij); `Loom.ui` in corporate has
more than one blue thing.

## B. The bench leftovers

| item | fix | test | before, after | still unverified |
|---|---|---|---|---|
| B1 a kept template part unveiled under the next template | `runtime/world.js:325` (a template that keeps parts of a template counts as a held picture: the veil) | `primitive_runtime_a_kept_template_part_is_veiled_under_the_next_template` | red record `red_B1_kept_veil.txt`; the openai fork's b10 and b12 now show the kept page veiled (strips from the build) | openai's MP4 was not re-rendered (683 s; only the claude fork was asked) |
| B2 blank moments at joins between template beats | `runtime/world.js:556` (on a continue join the exit waits for the incoming beat's first reveal) | `primitive_runtime_a_continue_join_never_leaves_a_speaking_frame_empty` | fixture: old frames at 4.7, 4.9, 5.1 s empty of both beats; new: the outgoing stays until the incoming arrives. Real films: 0 element-less speaking moments at template joins before and after (claude 0 of 188, openai 0 of 472) | cut and canvas joins keep a clean break; the wait was narrowed to beats that hold nothing (L-280) |
| B3 an incoming element over a join's narration card | every cover join already hides the incoming beat until its middle; the claude b12 "to whom" is the scene's own element with no entrance, now named (`loom/checks/film.py:385` `no_entrance_words`) | `primitive_runtime_every_cover_join_hides_the_incoming_beat_until_its_middle` (all 10 kinds), `check_words_with_no_entrance_are_named` | the cover test fails on the pre-session runtime, passes since the bench fixes; b12 now warns | the scene itself is unchanged (needs its author) |
| B4 the "empty" measure missed gemini's blank nested beats | `tools/node/probe.mjs:320` (each beat's own elements in the frame: `own_measured`, `own_in_frame`, `absent`), `loom/checks/film.py:296` (`blank beat` errors; older probes use the off-frame rows; 0 measured with words seen is red); `loom/ledger.py` gives them the kind `blank_beat` | `check_a_beat_whose_own_elements_are_off_frame_or_absent_is_blank`, `check_probe_counts_a_beats_own_elements_in_the_frame` | gemini b16 and b31: 0 blank errors before, 2 after; b15 and b30 quiet | |
| B5 the audit's "lingering" | `tools/film_audit.py:107` (keep names in lower case; the holder chain through `heldBy`); `runtime/world.js:234` and `probe.mjs:181` record who held each element | `check_film_audit_lingering_follows_keep_in_any_case_and_ctx_held`, `primitive_runtime_held_elements_record_their_holders` | the claude fork's "lingering": 10 false (Priya and Dev 14 s, held to b03) before; 5 after, all b51's hand-off to b52 (1.6 to 1.8 s) | |
| B6 pre-existing failures | vendor art: the e2kit entry was wrong (`licence` is a closed value; provenance in `origin`), and e2gen is `cleared: false`, refused by a lesson build (`loom/vendor_art.py:47`, compose); the disconnect test raced a Windows reset (L-272) | `vendor_art_comes_only_from_approved_sets_and_builds_clean`, `mock_llm_client_disconnect_is_quiet` | both FAIL before, PASS after (the disconnect 3 of 3 runs) | |
| B6 environment-only | three `vision_lab_*` (no OpenCV; no symlink privilege) and two `primitive_material_*` (no cairo) are now named skips | | FAIL before, SKIP with the reason after | they run only where those exist |
| B7 skill sync | `tools/skill_sync.py` (drift ignoring frontmatter quoting, blank lines, CRLF and the location line; `.skill` packages with the location line); `tools/context_check.py:134` runs it when `LOOM_ACCOUNT_SKILLS` is set, a named skip otherwise | `check_skill_sync_reports_a_changed_line_but_not_quoting_or_the_location_line`, `check_context_check_compares_account_skills_or_says_it_skipped` | the live account folder: 16 of 16 copies agree | packages were not installed by this pass |

## Proof: the claude-balanced fork re-rendered

The fork was recomposed on the final code, checked (33 errors: the 30 of the post-fix run plus the three
`blank beat` errors of B4: b13, b18, b30) and rendered with `render --force --reason "post-style proof"`; the MP4
matches the checked build at 172 of 172 moments. Every 2 s frame (237, on 15 sheets) was looked at; the review is
`projects/bench-20261006-151439-claude-balanced-fix1007/qa/post_style_review.md`.

| measure (film audit, 2 fps) | post-fix render | final render |
|---|---|---|
| other beats' pictures over 300 px | 0 of 54 | 0 of 54 (largest 0 px) |
| blurred beats | 0 | 0 of 43 |
| "lingering" | 10, all valid holds (B5) | 5: b51 hands off to b52 over 1.6 to 1.8 s (B2, nothing held) |
| empty while speaking | 0 of 835 | 12 of 835: the same sparse frames; the vignette had counted as ink (L-281) |

B1 to B3 where they occurred:
- **B1** occurred on openai (b10, b11, b12, b49); this plan keeps no template part under a template. The openai fork,
  recomposed on today's engine, shows b09's page veiled under b10 and b11's under b12
  (`projects/bench-20261006-151439-openai-balanced-fix1007/qa/strips/rows_01.jpg`).
- **B2**: at the 14 template-to-template continue joins of this film, the build's DOM has no speaking moment where
  neither beat shows an element, before B2 and after (0 of 188); openai's build, 0 of 472 both ways. The openai 3.4 %
  was the audit's pixel measure (low-ink frames at template beat starts), not missing elements. B2's own case is
  fixed and tested.
- **B3**: b12's "to whom" still sits on b12's own black card: the scene's element with no entrance, after a cut, not a
  join cover. The check names it; the scene needs its author.

Found by this proof and fixed (each with a test red before the fix):
- the first post-style render kept b01's crowd and chair up to 4 s into b02, because B2 waited although b02 holds
  Priya and Dev: the wait now applies only when the incoming beat holds nothing (`runtime/world.js:556`,
  `primitive_runtime_a_continue_join_that_holds_something_does_not_wait`, L-280);
- `tools/frame_review.py` labelled each 2 s frame about a second early (`fps=1/2:round=up`,
  `check_frame_review_frames_stand_at_their_labels`, L-285);
- blank beats had no ledger kind (`loom/ledger.py`, `check_ledger_gives_film_defects_their_own_kinds`);
- one `person_cloth` token dressed a dialogue's two people alike: it is a list by slot now
  (`runtime/templates/_helpers.js`, `primitive_style_person_cloth_keeps_two_people_apart`, L-279).

Recorded, not changed: in story-cartoon a template beat shows no vignette (its backplate covers the layer under the
world), a choice for Kshitij (L-281).

## Suites

Baselines before this pass (`docs/research/style-system/baseline_tests_*.txt`): with the browser 213 passed, 7
failed, 4 skipped; without it 198 passed, 8 failed, 18 skipped.

- **Without `--browser`** (final, `final_tests_nobrowser.txt`): 238 passed, 0 failed, 27 skipped, each skip named
  (no Chrome flag, no cairo, no OpenCV, no symlink privilege). One earlier run had two failures: the context check
  (a learning id another session had taken at the same time, L-282, and the test count; both fixed) and
  `mock_llm_openai_unanswered_tool_call_400` once under load (3 of 3 alone, and in the browser run).
- **With `--browser`** (`final_tests_browser.txt`, the final runtime): 254 passed, 1 failed, 9 skipped. The failure is
  `primitive_brush_paints_the_same_marks_and_reveals_them_in_order` in `tests/suites/primitives_libraries.py`, added
  by another session working in this folder at the same time (its brush wrapper, D-129 and D-130); not touched here.
  The two tests added after that run (`check_frame_review_frames_stand_at_their_labels`, the blank-beat ledger kinds)
  are not browser tests and pass in the final run without it.
- `py tools/context_check.py`: OK. With `LOOM_ACCOUNT_SKILLS` set, `tools/skill_sync.py` reports 1 of 16 account copies
  behind the repo: `loom-scene-author`, edited by that other session at 04:09 (the copies all agreed at 02:20).

## What is still unverified
- Word timings in the four estimated `@lab` headers against TTS; a lesson composed in each style end to end.
- L-270: whether a scaled reveal differs by a sub-pixel between two renders of one build.
- The remaining hard-coded accents in `runtime/places.js` (L-276).
- The agents reading the guide in a real (paid) run.

## Decided after the report (D-132)
Kshitij kept the three open values as they are: noir's missing contact shadow, glow-flat's bean extras (with no
crowds in that style), and story-cartoon's template beats without the vignette. Nothing in the gates, the probe or the
agents' prompts depends on them; reopen if one breaks a check or a production agent.

## Closed after the report (D-133, L-286)
The remaining hard-coded accents in `runtime/places.js` (L-276) now follow the pack: `materials.window_lights`,
`vessel`, `cells`, `leds`, `cables` (the server tray: the "meeting room's wall lines" L-276 named), `chart` and
`safety_line`, each falling back to the token it drew before. The five guided packs set them, and more
`materials.objects` kinds, from their guide's section 2 (each guide's section 17). Red on the old runtime, untouched
packs byte-identical: `docs/research/style-system/red_L276_set_decor.txt`. Still open: the accents inside the object
drawings (L-287) and a per-token share check (L-288).
