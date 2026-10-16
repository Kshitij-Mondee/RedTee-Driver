# Changelog

## 2026-10-17 - Batch-05 of the asset hand-off: three hologram hero models
- `assets/models3d/holo_laptop.js` (T-137: base, keyboard deck, keys, trackpad, hinge, lid, screen, ports; lid and
  explode keys), `holo_gpu.js` (T-138: shroud, fans, heatsink, pcb, power, bracket, backplate; spin and explode) and
  `holo_building.js` (T-146: ten named floors `floor1` to `floor10`, core, structure, facade sides, lobby, roof plant;
  `plates: false` for the hologram). From the friend's `assets/batch-05` (a575b98); the models alone, batch 04 not taken.
- Turntable sheets made here (corporate-clean, hologram, dark-technical); each also rendered through `H.hero3d` in the
  hologram engine with a part lit, a reading on it and the explode (0 problems). The notes in docs/assets/batches/batch-05.md.

## 2026-10-17 - Batch-03 quality pass: the seven developer components looked at again
- From the friend's `assets/batch-03` (e117237): `_dev_kit.js` (rounded-bottom window bodies, `DK.warnTok`, `DK.tones`,
  `DK.textL`, `DK.para`, low-saturation syntax colours fall back to the text colour); the CI pipeline wraps a name that
  fit its box exactly; the HTTP cards hug their content side by side; the db table keeps its count at the foot; the git
  graph's lanes take distinct tones; two fixtures. All seven accepted again here; the notes in batch-03.md.

## 2026-10-17 - Batch-03 of the asset hand-off: seven developer components (D-193)
- T-001 `dev_terminal`, T-002 `dev_code_editor`, T-003 `dev_diff_view`, T-004 `dev_git_graph`, T-006 `dev_ci_pipeline`,
  T-010 `dev_http_exchange`, T-012 `dev_db_table`, with the shared `_dev_kit.js`; made for the styles that show software as
  screens plus dark-technical, whiteboard and blueprint (chalk-lab for the git graph and the pipeline), accepted here. The
  first batch pushed by the friend's own session (`assets/batch-03`); its notes in docs/assets/batches/batch-03.md. Its
  sheet images were left out, as for batches 01 and 02 (library/sheets/ is not tracked).

## 2026-10-17 - Concepts and examples for hologram and isometric; taste in the whiteboard skin (D-201)
- Essences (hologram, isometric): a concept shown working, then one example; `text-heavy beats` avoided;
  `screen_words: 14`, said in the essence block and warned at the storyboard (`text_heavy`, `loom/essence.py`); the
  teaching fit lowered to 0.45 (isometric onboarding too). Direction cards: a use-and-words section, templates rare.
- Whiteboard skin: no corner brackets. A speech bubble is one hand stroke with its tail; a card with no time for its
  outline is left unboxed, with its siblings.
- scenario.dialogue: each bubble above its own speaker; they overlapped by 280 px in every style.
- Tests: `check_hologram_and_isometric_keep_words_to_labels`, `check_whiteboard_never_draws_a_half_frame`.

## 2026-10-17 - A hologram lesson's physical subject is a real 3D hero, or the storyboard stops for its model (D-200)
- `assets/models3d/electric_motorbike.js` (new): a generic electric motorcycle at real proportions. It has a twin-spar
  frame, a battery pack with cell modules under a hinged cover, a finned controller with high-voltage cables, a mid motor
  (stator coils, magnet rotor), a belt drive, a swingarm and shock, an upside-down fork, 17 inch cast wheels and brake
  discs. Keys: spin, throttle, open_pack, explode. Sheets in corporate-clean, dark-technical and hologram
  (`docs/assets/models3d/electric_motorbike__*.jpg`).
- Storyboard gate (`loom/direction.py` `subject_errors`): a hologram storyboard declares `subject` ({what, physical,
  model}, or a list). It refuses `holo_subject_undeclared`, `holo_subject_model_missing` (it names the model file to
  build) and `holo_subject_not_3d`.
- Schema: storyboard `subject`. Direction card, hologram engine guide and the Shuttle director skill (P5) say it; the
  card stays at 3400 bytes.
- Tests: `check_direction_hologram_physical_subject_needs_its_3d_model` (red on the old gate); the direction fixtures
  declare an abstract subject. `agents_limits_never_cut_a_working_agent_short` now measures the storyboard role's own
  system prompt (about 8k tokens): it left a fixed 16k and failed on 90 more tokens of schema.
- `runtime/capabilities.json|md` regenerated (`py -m loom catalog`) for the new model.

## 2026-10-16 - Template skins: each engine style draws the catalog templates its own way (D-198)
- `runtime/skins.js` (new): `Loom.skins.define` / `build` / `schedule`. A template build under a skin records its parts
  and entrances, then the style performs them in time order; templates unchanged. Built at `world.js`'s one template site
  and on the template sheet.
- Skins in the five engines:
  - `whiteboard.js`: the one hand draws, with `B.unveil` for display-face headings, an `instant` draw for what a beat
    restates at its cut, a per-mark pen, and `fresh()`;
  - `blueprint.js`: the nib drafts, hatching laid in as a wash;
  - `hologram.js`: light planes, a scan, reticles, typed words, the lock;
  - `screencast.js`: a product page that loads;
  - `isometric.js`: A as blocks on plinths, B as one 30 degree wall.
- The switch:
  - `compose.template_skin` puts `template_skin: "style"` in the manifest;
  - `Project.create` stamps `template_skins`;
  - schema: storyboard `template_skin`, scene `skin: "classic"`;
  - no stamp, or `engine: off`, means classic.
- Checks:
  - `loom/checks/skins.py`: `skin_formed`, run by `check`; the probe reports `skins`;
  - `direction.storyboard_warnings`: `template_not_this_style`, from `engines.skin_refuses`;
  - a templates line on each direction card.
- The template sheet:
  - `py -m loom library sheet --template <id|all> --skin classic|style --styles ... --frames ... --variant B`;
  - three frames per case;
  - the film clock is run;
  - a scene record;
  - cases in `library/template_fixtures.json`.
- Tests: `tests/suites/template_skins.py` (8).

## 2026-10-16 - Narration speed: a range per kind, decided per lesson (D-197)
- `loom/narrate`: `KIND_RANGE`, `suggest_speed` (density), `speed_block`; the script's `voice_speed` (schema, gate);
  the VOICE SPEED instruction in Relay's script task and Shuttle's P4. Voice: af_heart.

## 2026-10-16 - Narration speed by kind of video (D-196)
- `loom/narrate`: `voice.speed: "auto"` is the kind's speed (teaching 0.8, explainer 0.9, product 0.92, onboarding 0.9,
  policy 0.8, soft-skills 0.85); the wpm calibration is opt-in and never under 0.8. Voice samples for comparison in
  docs/research/2026-10-16-narration/ (findings in SPEED_FINDING.md).

## 2026-10-16 - Batch-02 of the asset hand-off taken in (D-193)
- Five more app shells (T-154 `app_hris`, T-157 `app_cloud_console`, T-158 `app_analytics`, T-159 `app_project_board`,
  T-162 `app_ide_workspace`), scoped like batch-01 to screencast, corporate-clean, engineering, line-art, editorial-paper
  and presenter-pop, all ten accepted here. Their `_app_kit.js` changes (outlined solid marks, mono text for code and
  terminals) merged three-way with this main's (no word cut to letters, the pack's text floor); `fitWords` returns a string
  again (empty when no whole word fits) for the shells that call it, `fitWordsOrNull` for the text helper. The friend's
  branch was built on f18c870, so its files were brought onto this main by hand (its notes: docs/assets/batches/batch-02.md).

## 2026-10-16 - The product kind of video and its own skill; style and narration reviews (D-195, L-481, L-482)
- New kind `product` (`loom/genre.py`): no quiz, recall or check role; the viewer may be addressed and asked to act
  once. Read from topics like "product demo", "feature launch", "homepage explainer video for our site", "rolling out
  the new". Its craft leads pedagogy, script and storyboard: `skills/product/product-explainer` (truth sheet,
  formats, arcs, showing software, honest claims, sound off and cutdowns, voice, rubric; worked example in
  `reference/`). Genre file `packs/genres/product.md`; `STORY_FORM["product"]`; `--genre product` in the CLI help.
- Skills are looked for in `skills/lnd`, `skills/product`, `skills/loom` (`stages.reading_list`,
  `agents/tools._skill_path`).
- Every essence has a `product` fit; `tests/suites/style_essence.py` reads the kinds from `genre.known()` instead of a
  hand list. Screencast card: a product line, and the owner's own product may carry its brand.
- Test: `check_video_kind_product_is_its_own_kind_led_by_the_product_skill` (red before the profile: all five product
  topics read as teaching or explainer).
- Reviews: `docs/strategy/2026-10-16-style-adaptation-assessment.md`, `docs/strategy/2026-10-16-narration-review.md`
  (with A/B audio in `docs/research/2026-10-16-narration/`); research `docs/research/2026-10-16-product-explainer.md`.
  The skill is also saved to the Cowork account.

## 2026-10-16 - The holograms first; nothing promised left undone (D-194)
- Storyboard gate: `holo_heroes_few`, `holo_hero_model`, `holo_ui_templates` (`loom/direction.py` `storyboard_errors`).
- Hologram engine audit: `holo_hero_unplaced`, `holo_hero_not_drawn`, `holo_ui_heavy`; `holo_hero_missing` an error.
- Check stage: `design_element_missing` (`loom/checks/film.py` `promise_checks`).
- Hologram card, essence and engine guide: holograms carry every beat, several heroes, console UI the minority.

## 2026-10-16 - Components made for their own styles; batch-01 taken in (D-193)
- `styles` on components: the gate renders only those, `catalog_search` filters by the lesson's style, `ctx.use`
  elsewhere is `component_off_style` (`runtime/components.js`, `loom/library.py`, `loom/agents/tools.py`,
  `tools/node/catalog.mjs`).
- Batch-01 from the asset hand-off (T-149 to T-153: `app_email`, `app_chat_workspace`, `app_calendar`, `app_docs_editor`,
  `app_lms_course`, the shared `_app_kit.js`), accepted here; its notes in `docs/assets/batches/batch-01.md`.
  `_app_kit.js` never cuts a word to its letters (a size or two smaller, else an empty line): "Escalatio..." in hologram.

## 2026-10-16 - Each style's essence, the style recommender, borrowed storyboard techniques (D-192)
- `packs/essence/*.json` (17), `loom/essence.py`: the STYLE ESSENCE block in Relay and Shuttle, `get_style_pack` `essence`,
  `mix: "auto"` (native mix), `style_borrowed`, `scene_off_style`, `recommend`, `py -m loom recommend-style`.
- Skills: lnd-explainer-craft (question to picture, moves 16 and 17), lnd-visual-storyteller (three candidate worlds,
  slow and facets joins, camera rhythm, sound-off read), lnd-learning-pedagogy (subgoal labels, takeaways traced, checks
  adults respect), storyboard roles, the explainer genre's other shapes, the interview's `picture` question and style step.
- Research: docs/research/2026-10-16-skills-comparison.md.

## 2026-10-16 - Clean joins and motion, the kind of video in every stage (D-190, D-191, L-476)
- Joins: held-then-exited elements released to the join; same-spot redraws swapped under their copy; cuts wait for the
  new picture; canvas joins empty as the new drawing arrives (`runtime/world.js`, `runtime/motion.js`).
- Isometric: `B.camera` dur 0 is a cut; only the board clock draws (`runtime/engines/isometric.js`).
- Screencast: pointer hide ramps from its level; `sc_reset_at_join`, `sc_change_at_join`, `sc_ui_by_hand`,
  `sc_second_pointer`, `sc_zoom_fast` (`runtime/engines/screencast.js`, its guide's "Joins and the held app").
- The join pass in the check stage: `loom/checks/joins.py`, `tools/node/join_frames.mjs`, `loom/qa.py` `join_checks`.
- The motion audit: `motion_two_at_once`, `motion_crosses`, `motion_shrinks_words`, `camera_restless`.
- `loom/genre.py`: kind profiles, `auto` default, the VIDEO KIND block in Relay and Shuttle, kind-led reading lists, the
  pedagogy, script and brief gates by kind.
- Direction cards: motion and kind-of-video sections (CARD_MAX 3400). Scene-author skill: "Joins".
- Hand-off: `library accept` takes commissioned components; `tools/cloud_setup.sh` installs optional packages one by one.

## 2026-10-16 - Direction cards per style for the planners, and a soft check on the signature moments (D-189, L-475)
- `packs/direction/` holds one card for each of hologram, blueprint, screencast, isometric and whiteboard: the style's
  strong calls and when each fits, at most 2,600 bytes.
- `loom/direction.py`: the loader and `storyboard_warnings`. The card reaches the planners in four places:
  - Relay's storyboard_outline and storyboard task messages (`loom/agents/conductor.py`);
  - Shuttle's P5 start message (`loom/shuttle/launch.py`);
  - `get_style_pack` (`direction_card`, first; the style guide and engine guide now last, so the 64,000-character
    reply cut no longer drops the engine note and the kept library after them).
- `loom/schemas/storyboard.schema.json`: `hero3d` on a scene, described and validated (params with a model).
- `loom/checks/gates.py`: the storyboard gate warns `holo_no_hero` (a hologram lesson with no hero beat) and
  `bp_one_layout` (a blueprint lesson with one station over 60 % of the narration), from 6 beats.
- The outline role card and the Shuttle playbook (P5) name the card. The storyboard role card is unchanged: it was 9
  characters under its 2,000-token cap, so the card reaches that role through its task message only.
- Test suite `tests/suites/style_direction.py`.

## 2026-10-16 - The asset maker's package
- `docs/assets/HANDOFF_TEMPLATE_LIBRARY.md`: 184 items; set-up steps; where each family's work goes (components,
  `assets/models3d/`, Claude Design); the five style engines; screencast's native code, terminal and chart regions in
  "what Loom already has".
- `handoff/Video-Engine-asset-maker.zip` (not in git: archives are ignored). It holds the engine folder without
  lessons, caches, renders, secrets or research images: 4,283 files, 83 MB.

## 2026-10-16 - Hologram v2 (3D heroes as light, SVG pushed) and screencast v2 (real pages, screenshot shells, smooth walkthrough) (D-188, L-473)
- Hologram:
  - `runtime/three/holo.js` and `runtime/three/presets/holo_hero.js`; models `bicycle` and `earth`; `server_rack`
    units;
  - `loom/three_bridge.py` `hero_cached`, `hero_assets` and `hero_lab_strip`;
  - `loom/compose.py` and `loom/lab.py` embed `hero3d`;
  - `runtime/engines/hologram.js` `H.hero3d`, `H.plane`, `H.reading`, `H.tokens`, `H.arcs`, `H.dist`, `H.trace`.
- Screencast:
  - `tools/page_capture.py`, `tools/node/page_capture.mjs` and `tools/screenshot_theme.py`;
  - `kind: "page"` with `A.scrollTo`, `A.webClass` and `A.webSet`;
  - `theme` and `layout` on shells; the spring camera, the pointer settle, inertia, cadence and ripple; `sc_jump`;
  - `loom/compose.py` loads `projects/<id>/assets/pages/*.page.js`.
- Preset `opus-plan-sol-code` in `loom/shuttle/config.json`. Hand-off sheet section 7b: 34 more items. Catalog
  regenerated.

## 2026-10-16 - Pushed to GitHub (RedTee-Driver, private)
- `.gitignore`: no video, audio, archives, lesson images, render folders, session stream logs, secrets, reference bundles or blind-test keys; lessons as plans only. First commit 149e9fa, 6,652 files, checked on GitHub. docs/prompts/2026-10-16-push-to-redtee-driver.md.

## 2026-10-16 - Four style engines fixed; the wow back in hologram and blueprint (D-187, L-472)
- `runtime/engines/screencast.js`: `kind: "code"` (mono, syntax colour, indentation, diff markers, `A.codeType` with a
  caret), `kind: "terminal"` (`A.run`, `A.out`), `kind: "chart"` (`A.series`), `A.card` counts, `sc_overlays_crowded`,
  the step badge inset, the zoom-text warning with `scale`, `A.id`.
- `runtime/engines/hologram.js`: `H.bars`, status words on panels and steps, link emphasis, globe labels and coastlines,
  `H.flow` direction, per-gauge decimals and units, the blip label, `holo_character_kit`, `H.vcenter`, the push-through
  fade; the hero moment `H.object` (rack, chip, drone, datacentre, lock, phone), `H.pad`, `H.stage`, `H.chrome`,
  `H.datum`, two-pass glow.
- `runtime/engines/blueprint.js`: figure and cloud spacing, the stamp fits its word, hyphens, lettering at speech pace and
  catch-up, `by`/`quick` on figures, balloons and dimensions, labels on their lines (`labelAt`, `labelSeg`); translucent
  part paper with masks, glowing lines, `D.extrude`, `D.mechanism`, `W.shaft/pulley/belt`, `D.icon`, `D.hero`,
  `D.camera`.
- `runtime/engines/isometric.js`: time-aware `iso_order`, height cues and air routes in depth, `screen` kind, stack
  pins, crowded pins fan out, `facade: "hall"`, noun icons (`W.iconFor`), `B.widen`.
- `runtime/fx.js` `cyanotype` background; `packs/styles/blueprint.json` uses it. `loom/lab.py` hyphenated cues;
  `loom/compose.py` and `loom/lab.py` embed map data for `.globe(`. Catalog regenerated.

## 2026-10-16 - Chrome fixes for hologram and screencast; the direction-per-style design (L-471)
- `runtime/engines/hologram.js`: the `H.tag` size and inset, the readout tag width, and a thin type-on caret.
- `runtime/engines/screencast.js`:
  - status pills 38 px with a 22 px inset;
  - `A.viewFor` keeps a card out of or whole in a zoomed frame (`sc_zoom_eased`);
  - a band behind the chapter pills.
- `scenes_examples/lab/sc_lesson.js`: zoom 1.35.
- `docs/strategy/2026-10-16-style-direction.md` (DESIGN): how Loom should storyboard per style. One director, a
  direction module per style with cards injected into the outline and storyboard, a `stage` block, and an engine
  storyboard lint. A brainstorm, a critique and a design critique of the three lab strips.

## 2026-10-16 - The layout guard trial ran (D-169, L-470)
- lg-trial-share-links (plan) and its arms -off and -on rendered (total $14.52); the guard moved nothing on an engine whiteboard (no flexible elements). Results: docs/research/layout_trial/RUN_LOG.md; blind pair in docs/research/layout_trial/blind/.

## 2026-10-16 - The whiteboard hand draws Lucide icons (D-186)
- `runtime/engines/whiteboard.js` `W.icon(name, x, y, size)`: each shape traced by the browser and split at subpath
  jumps; the icon's own order, each stroke from the end nearer the pen, dots last as marker dots; an unknown name is
  `wb_icon_unknown`. Engine guide: the call and "one picture per idea". The lab's clean board gives each zone its icon.
- Test: `check_whiteboard_hand_draws_lucide_icons_outline_first_and_dots_last` (alert-octagon lists its dot first;
  control: with dots kept in file order it fails).

## 2026-10-16 - Three new styles with engines: isometric, hologram, screencast (D-185, L-468, L-469)
- New per style:
  - `packs/styles/{isometric,hologram,screencast}.json`;
  - `runtime/engines/{isometric,hologram,screencast}.js`;
  - `docs/styles/engines/*.md`, `docs/styles/guides/*.md`, `docs/research/2026-10-16-style-*.md`;
  - `scenes_examples/lab/{iso_teach,iso_diorama,iso_lesson,holo_briefing,holo_analysis,holo_lesson,sc_tour,sc_walkthrough,sc_lesson}.js`;
  - `tests/suites/{isometric,hologram,screencast}_engine.py`;
  - preview strips in `docs/styles/demos/lab/`.
- Brief: `docs/styles/NEW_STYLE_BRIEF.md`.
- Shared:
  - `tests/suites/style_system.py` PACKS gains the three;
  - `loom/agents/tools.py` gives an `engine_note` per engine (it served the whiteboard wording for every engine);
  - `runtime/engines.js` capability line, the `loom/engines.py` docstring, `docs/SCENE_API.md` ctx.engine,
    `docs/styles/ENGINES.md` and `docs/styles/guides/README.md`;
  - `docs/assets/HANDOFF_TEMPLATE_LIBRARY.md`: T-134 to T-136 marked covered, and family H points at the screencast
    shell.
- Preview tooling: `tools/node/svg_preview.mjs` measures monospace at 0.6 em (L-468); `tools/lab_preview.py` names
  converted fonts after the pack's family (L-469).

## 2026-10-16 - Whiteboard research note; hand test times
- `docs/research/2026-10-16-whiteboard-principles.md` (new). `tests/suites/grid_speech_engines_pages.py`: the hand test
  looks at 10.5 and 11.5 s (the lettering is faster), tests ink inside the arm's own run (the accent ink is near the
  sleeve's colour).

## 2026-10-16 - The blueprint engine; the template hand-off sheet (D-183, D-184, L-466, L-467)
- `runtime/engines/blueprint.js` (new): a drafted sheet in two registers (detail and teaching), one nib, Hershey Sans
  lettering (`loom/stroke_fonts.py` ENGINE_FONTS gains blueprint). Lab scenes `scenes_examples/lab/bp_engine_detail.js` and
  `bp_engine_teach.js`. Engine guide `docs/styles/engines/blueprint.md` (served to agents by get_style_pack); style guide
  `docs/styles/guides/blueprint.md` sections 17 to 21 and the dimension rule in s4; `packs/styles/blueprint.json` reads_as
  and fits (palette unchanged). `docs/styles/ENGINES.md` status and the style_engine capability line updated.
- `docs/assets/HANDOFF_TEMPLATE_LIBRARY.md` (new): 150 commissioned items (136 code components, 14 art), contracts,
  master prompts, inventory, labels. `tools/node/catalog.mjs` and `loom/catalog.py`: a component's `commissioned_by`,
  `family` and `tags` reach the catalogue. `loom/library.py` check_component: a commissioned component with no lesson
  uses is named as such (the promoted_from rule already passed with no uses).
- Tests: `tests/suites/blueprint_engine.py` (lint and switch; drafting order and determinism in Node; the live figure
  and printed title-block labels; the Chrome strip, skipped without a browser).

## 2026-10-16 - The layout guard sees drawn lines; the layout guard trial set up (D-169)
- `runtime/layout.js`: a long drawn line (60 screen px or more, its drawn part only) through a flexible element's words is a conflict (`line_through`), as the probe's `line_through_text` (L-462): on a whiteboard the board is all strokes. Planted case b7 in `tests/suites/layout_guard.py`; the test now solves to a fixed point as `guard_build` does (a moved label's lead is redrawn on the next build). Tried on a copy of wb-prioritise-engine: 6.7 s a pass, 1 move, 1 left for the author (copy removed).
- `loom/shuttle/config.json` preset `opus-storyboard-sol-code` (Opus P5, Sonnet elsewhere, gpt-6.1-sol for scenes, clips, fixes and the kit). `tools/layout_trial.sh` (one plan, two clones: guard off and on). Not run yet: Kshitij asked to wait for the whiteboard session's tests and fixes.

## 2026-10-16 - The whiteboard hand keeps pace with the voice; plan-time carry warning (L-465)
- `runtime/engines/whiteboard.js`: faster lettering (3.4 words a second), catch-up for a late part, `wb_pen_late` an
  error past 1.5 s. `loom/checks/story.py` `carry_warnings` (pack `board.carry.max_kept`: 8), run by the storyboard
  gate. `loom/agents/tools.py`: the engine note names the board rules. Lab scenes fixed (desk after the title; the
  board's fill-ins cue).
- Tests: the pace test and the plan-carry test.

## 2026-10-16 - Fixes after the full suite (L-464)
- `ctx.engine` non-enumerable (`runtime/world.js`, `loom/lab.py`); the whiteboard audit only after a board was used;
  the writing hand moved to `assets/engines/whiteboard/hand/`; `line_through_text` counts only lines that are seen.

## 2026-10-15 - A clean whiteboard board: two faces, room around words, little carried into a section (D-182, L-463)
- `runtime/engines/whiteboard.js`: `board.heading` (the display face revealed under the hand); `audit()` run after the
  build (`wb_face`); the shadow text's family fixed and its box fitted to the drawn letters. `runtime/boot.js` and
  `loom/lab.py` run an engine's audit.
- `tools/node/probe.mjs` `boardAudit`: `board_carry` from the pack's `board.carry`; `packs/styles/whiteboard.json`
  `board.carry` (40 %, 10 words). `loom/qa.py` writes its line.
- `scenes_examples/lab/wb_engine_board.js` (new): the clean board. Guides: `docs/styles/guides/whiteboard.md` sections 3
  and 6, `docs/styles/engines/whiteboard.md`.
- Tests: the two-faces test and the board-carry test.

## 2026-10-15 - The layout check reads a whiteboard: words written by the engine, lines through words; a bigger hand (L-462)
- `tools/node/probe.mjs`: engine-written words (`data-engine-text`) are read by every layout check; new finding
  `line_through_text`; the writing hand is never an opaque shape over words. `loom/qa.py` writes its line;
  `loom/agents/router.py` routes it as `line_into_object`.
- `tools/hand_from_png.py --scale` (default 0.85); `assets/hands/marker/write.svg` regenerated at 0.85.
- Tests: `tests/suites/checks_layout_checker.py` planted cases b18 and b19.

## 2026-10-15 - The whiteboard hand: one per film, on top, its arm from the bottom (D-179, L-461)
- `runtime/engines/whiteboard.js`: one film-wide hand on one schedule, posed by `Loom.clock`, re-appended last in its
  station each frame, turned so its arm leaves by the frame's bottom edge (`Loom.world.cameraAt`), parked down its arm.
- `tools/hand_from_png.py`: `data-arm` (the sleeve's axis and width), sleeve 12000 source px; `loom/engines.py` reads it;
  `assets/hands/marker/write.svg` regenerated. `loom/lab.py`: registered clocks run without fx.
- Test: `check_whiteboard_hand_is_one_on_top_and_rises_from_the_bottom`.

## 2026-10-15 - The blueprint style (D-178, L-459)
- `packs/styles/blueprint.json` (new), `runtime/fx.js` `drafting` background (new; the `blueprint` shader unchanged), `docs/styles/guides/blueprint.md` (new), `scenes_examples/style_blueprint_request_path.js` and `..._detail_callout.js` (new), `tests/suites/style_system.py` PACKS. Skills (loom-style-pack, loom-director, lnd-visual-design), the guides README, STATE (14 packs) and the vision lab schema name it. No lesson made.

## 2026-10-15 - A critic blocker closes only by the critic or a person (D-177, L-458)
- `loom/shuttle/server.py` `critic_review`: a blocker the lead accepted is judged again; the pass records its blocker beats. `loom/shuttle/rails.py`: P10 holds on them; `waive_blocker` (a person only). `py -m loom shuttle waive <id> --beat --by --why`. `skills/loom/shuttle-director/SKILL.md` says so. Test in `tests/suites/shuttle_rails.py`.

## 2026-10-15 - timing grid, speech check, style engine slot, page clips (D-173 to D-176, L-450 to L-457)
- `loom/timing.py` + `runtime/grid.js` + `loom/checks/grid.py`: one join table, joins settled once for narrate and
  compose, `manifest.grid` (exact sections, a fitted tempo, hits, planned sounds); storyboard sound cues reach the mix;
  the mix records what it placed; `music.enabled: false` honoured; `music.follow_grid` opt-in; `ctx.hit/bar/onBeat`.
- `loom/narrate/asr.py`: every narrated phrase transcribed back (faster-whisper, local small.en) in the narrate stage;
  `py -m loom asr <id> [--accept b07.2]`.
- `runtime/engines.js` + `loom/engines.py`: the style engine slot (`runtime/engines/<style>.js`, `ctx.engine`); none built.
- `loom/page_bridge.py` + `runtime/page/{render.mjs,kit.js,libs.json}` + `tools/node/shiki_tokens.mjs`: kind "page"
  clips on the approved libraries; `py -m loom lab page:<name>`; `docs/PAGE_CLIPS.md`, `docs/styles/ENGINES.md`.
- npm: d3, topojson-client, world-atlas, @observablehq/plot, @dagrejs/dagre, katex, shiki, @xterm/xterm, opentype.js,
  hersheytext, paper. pip: faster-whisper. Tests: `tests/suites/grid_speech_engines_pages.py`.

## 2026-10-15 - every seek arrives moving forward (D-172, L-449)
- `runtime/core.js` `Loom.forwardOnly`, installed by `runtime/boot.js` and `runtime/trailer.js`: a backward seek returns
  to -1 s and renders forward, so two sets at one instant, overlapping tweens and overlapping origins draw the frame a
  fresh page draws (L-290, L-302 closed). Test `primitive_runtime_a_frame_reached_backward_is_the_frame_a_fresh_jump_draws`.
- Verified in HyperFrames renders: 1 against 8 workers no longer changes a frame Loom draws (fixture and the claude
  fork's trailer); record `docs/research/determinism/red_runtime_determinism.txt` section 11.

## 2026-10-15 - One browser check for every test (L-448)
- `tests/browser_support.py` (new): every browser test in `tests/run_tests.py` and `tests/suites/*.py` asks it; it uses
  `loom.render.browser_path()` (env var, else the HyperFrames Chrome) and pins the find for the node harnesses, so a plain
  `--browser` run no longer skips 37 tests. Guard test `browser_tests_ask_one_shared_check`. Test infrastructure only.

## 2026-10-15 - Every world directed; the office sets reviewed and filed (D-171, L-445 to L-447)
- `packs/worlds/*.json`: all 17 other worlds are now brief 2 (89 scenes in 18 worlds; 80 plan-checked, 9 abstract
  drafts). Plan checks are in `docs/assets/plan_checks/<world>/`, research in `docs/research/2026-10-13-sets-<world>.md`,
  and the brief in `docs/assets/WORLD_DIRECTING_BRIEF.md`. Metaphor's `machine` is renamed `clockwork_room`.
- Generated: `docs/assets/WORLD_PACKS.md` and `docs/assets/world_prompts/` (1,297 prompt files, including 333 batch prompts).
- `tools/world_packs.py`: the set contract says a light or shadow shape stops at the outline of any object standing on
  its surface (L-445).
- `loom/sets.py`: `add(..., only=)` and the `sets add --only` option (`loom/cli.py`). `resolve`: the more specific name
  wins, and a world word inside a scene's own name is not a world named (L-447).
- Library: office break_room, reception, corridor_lift, open_plan, desk_close and exec_office (lit_25d), and meeting_room
  (story_cartoon). Review: `docs/assets/reviews/2026-10-13-office-sets.md`, images in `office-sets-2026-10-13/`.
- Tests: `tests/suites/sets_library.py` gains three (--only, the specific name, every name loads its own scene).
  Fixtures changed because the library grew ("corner office" is drawn now; the cross-style control uses
  corporate-clean). `tests/suites/world_sets.py`: the version 1 control is built from the office, because no version 1
  world is left.
- Docs: `docs/assets/SET_PROMPTS_GUIDE.md` (every world directed, the batches table, the matcher).

## 2026-10-15 - Caption hold check (D-170, L-444; P-c first slice)
- `loom/checks/film.py`: `caption_hold_checks` (run by `qa.check`) holds every caption cue of the build manifest to at least
  max(1.8 s, its spoken words + 0.6 s), one line per beat with each short cue's time, text, hold and need (`caption_min_s`,
  `caption_tail_s`, a pack's `pace` block may set them); 0 cues while the narration speaks is red; captions off are not judged.
- `loom/checks/film_caption_baseline.json` (new): the ratchet, per beat, for the 42 lessons with a rendered MP4
  (`film.record_caption_baseline`); any other lesson fails. The defect router gives `caption_hold` to the engine; the ledger
  counts it as its own kind. Caption timing unchanged. Test: `tests/suites/caption_hold.py` (red runs in
  `docs/research/caption-hold/red_run_before_check.txt`).

## 2026-10-15 - The layout guard (D-169)
- `runtime/layout.js` (new, after kit.js): `Loom.layout.solve()` moves flexible elements (labels, tags, stamps, badges,
  callouts) clear of words, other labels, object edges, the frame and the caption band, and edge elements (texts, cards)
  back inside the frame; only moves that clear everything; objects never move; `{overlaps: [...]}` and
  `{layout: "fixed"}` honoured. `kit.element` and `treat.label` apply the plan; with the guard on `kit.text` grows a box
  too short for its words at the floor (`text_box_grown` warning) instead of failing.
- `loom/layout_guard.py` (new): the plan store (`projects/<id>/layout/plan.json`, entries tied to scene and kit hashes),
  `guard_build` before the probe in `qa.check`, `pilot_check` and `lab_snapshot` (which reports what moved), compose
  puts the valid plan in the manifest; `py -m loom layout <id> on|off|solve|show`; LOOM_LAYOUT_GUARD. Off by default.
- `tools/node/layout_solve.mjs` (new). Tests: `tests/suites/layout_guard.py`. Docs: `docs/LAYOUT.md` section 4,
  `docs/research/2026-10-15-layout-guard.md`; scene-author skill and the fixer told what the guard owns.

## 2026-10-14 - The Qwen arms handed to Kiro (D-168)
- `tools/style_test_qwen.sh` (preflight, run, blind): resumes the five Qwen clones in two waves and makes four-way blind sets;
  syntax-checked, not run. Prompt for Kiro: `docs/prompts/2026-10-14-kiro-style-test-qwen.md`. RUN_LOG gained the results
  table of the 15 finished films.

## 2026-10-14 - Qwen, exact clones, no crash on a tool of no phase (D-168, L-435 to L-437)
- `loom/agents/llm`: provider `qwen` (QwenChat), key DASHSCOPE_API_KEY, base LOOM_QWEN_BASE; `models.json` qwen3.8-max and mock-qwen;
  `loom/shuttle/config.json` preset scenes-qwen3.8-max.
- `loom/slice.py`: every beat is an exact clone; facts approved before dependent stages. `loom/shuttle/rails.py`: a tool of no
  phase passes the order check; `loom/shuttle/server.py` `call` never raises.
- `tools/style_test.sh`: resumes the plans, four clones per style. Tests in `tests/suites/shuttle_slim_and_routing.py` and
  `shuttle_own_agents.py`.

## 2026-10-13 - Opus plans on the API (D-167)
- `loom/shuttle/config.json` `lead.planning.api` and `default_preset.api` opus-plan; `loom/shuttle/launch.py` `run`: planning groups
  may take `lead.planning[mode]`. Tests updated in `tests/suites/shuttle_context.py` and `shuttle_own_agents.py`.

## 2026-10-13 - A hung look's capture is killed in minutes and tried once more (closes L-434)
- `loom/qa.py` snapshot_sheet_build: `SNAP_TIMEOUT_S` = 420 s per capture (was 1800); on a timeout util.run has killed the
  browser tree, the capture is tried once more, and a second hang is a LoomError that says so (it surfaces to the worker's
  lab_snapshot as an error, never an hour's silence).
- Test (`tests/suites/held_parts.py`, red first): `check_a_hung_snapshot_is_killed_in_minutes_and_tried_once_more`.
- The check's contact-sheet capture (`_snap`, chunks of 30 frames) uses the same bounded helper `_hf_snapshot` (was 1800 s
  each); the limit grows 10 s a frame past 4 (a 30-frame chunk about 11 minutes).

## 2026-10-12 - A defect on a held element goes to the beat on screen (L-431)
- `loom/agents/router.py` collect: an lc line names the beat that drew the element; when its time is outside that beat's
  window and in a later beat, the later beat (the holder) owns it, with a note naming both. `_beat_contains`.
- Test (`tests/suites/held_parts.py`, red first): `check_a_defect_on_a_held_element_goes_to_the_beat_on_screen`.

## 2026-10-12 - The held board is drawn: join exits, backplate blur, outer tweens (L-427 to L-430)
- `runtime/world.js`: an element inside an element the next scene holds is not retired at the join; the backplate blur
  filter is attached by Wd.planCover's clock inside its cover window only (it was on every earlier group from load).
- `runtime/core.js` Loom.tween: a tween on an element's outer group is moved to its inner group, warning `outer_tweened`.
- Tests (`tests/suites/held_parts.py`, each red first): the nested-life test measures seen opacity;
  `primitive_runtime_a_backplate_blur_is_attached_only_while_it_is_raised`,
  `primitive_runtime_a_tween_on_an_elements_outer_group_goes_to_its_inner`.

## 2026-10-12 - part_drawn_twice compares what each call drew, not the declared boxes (L-423 follow-up)
- `runtime/core.js` wrapPart records the nodes a scene-level part call adds (`E.partNodes`, `rec.parts[].nodes`);
  `runtime/world.js` Wd.auditParts measures those nodes' boxes through their transforms in the owner's place and calls
  it a copy at 60 % or more of the two drawings' union (was: the elements' declared boxes over the smaller one).
  Reported by the gps-position session: full-frame layer elements read 100 % for drawings in different places (b12
  clock_face chips). Test `primitive_runtime_a_held_kit_part_keeps_its_handle_and_a_copy_is_refused` gains a ring per
  full-frame layer (red on the previous rule). On https-private-relay's run-1 build every beat it flagged before is still
  flagged; on gps-position's b08-b18 slice 7 errors became 5, each a range_circles call that redraws the whole set
  (every satellite's base circle and the two dots) in its own layer, exactly over the held one.

## 2026-10-12 - slim briefs, errors to who can fix them, the slice for a model comparison (D-166)
- `loom/agents/conductor.py`: `film_card(near=)`; the scene task's brief modes (full, author, fix) and `shared_done`; no kit source.
  `loom/shuttle/server.py` `engine_context`: author and fix briefs, shared sections once; `t_check`: an engine-only failure
  stops the run (`engine_defect`); `t_delegate`: no fixer after a passing check in P9. `loom/shuttle/launch.py`: the stop's
  message, `resume` lifts it.
- `loom/agents/router.py`: kit words, cross-beat lines, traced foreign pixels.
- `loom/slice.py` (new), `py -m loom slice <source> <new id> --beats b08-b18`; `loom/shuttle/config.json` presets
  `scenes-<model>`; `loom/agents/config/models.json` gpt-5.6-terra.
- Tests: `tests/suites/shuttle_slim_and_routing.py` (3).

## 2026-10-12 - Shuttle on its own agents, any model (D-165)
- `loom/shuttle/loop.py` (new): the loom runner: one tool loop per agent on Relay's providers, loom-mcp in process, the `Agent`
  tool (parallel spawns), `Read` for the lead, the hook's checks and caller records, Stream's guards, budget checks before each
  call, exact cost rows (`runner: loom`), old pictures dropped, sessions saved for a retry, `logs/shuttle/stream_<group>.jsonl`
  in Claude Code's shape.
- `loom/shuttle/launch.py` `run`: `--runner loom` (any models.json lead; Opus as before), presets with `agents`; `loom/cli.py`:
  `--runner loom` by default with `--mode api`, free `--lead`/`--build-lead`. `loom/shuttle/config.json`: `default_preset.api`
  sonnet-only, preset `gemini-pro`, Claude as a reviewer option. `loom/shuttle/server.py` `reviewer`: not the lead's provider.
- `tools/shuttle_s0.py`: `--runner`, and its looks on the lesson clock. `skills/loom/shuttle-director/SKILL.md`: Read line.
- Tests: `tests/suites/shuttle_own_agents.py` (3).

## 2026-10-12 - A piece inside a held element lives as long as it (L-425)
- `runtime/world.js` Wd.planLife: an element drawn inside another element (a kit part's pieces inside the board) takes the later of its own life end and its hosts'; the report's lifeT follows. Test (`tests/suites/held_parts.py`, red first): `primitive_runtime_a_piece_inside_a_held_element_lives_as_long_as_it`.

## 2026-10-12 - Held kit parts keep their handle; a second copy is refused (L-423)
- `runtime/core.js` wrapPart: a kit part called by a scene records its handle on the element it is drawn into
  (`E.handle`, `E.partId`; a part drawn inside another part leaves the outer handle) and on the scene (`rec.parts`).
  `ctx.held(name).handle.setState(state, t)` drives the same drawing from a later beat.
- `runtime/world.js`: `kept_element_redrawn` (a bespoke beat's ctx.el under a name it holds, still on screen);
  `Wd.auditParts`: `part_drawn_twice` (the same kit part over a held one, half the smaller box, while the held one shows),
  `part_drawn_again` warning (elsewhere, or sizes not comparable); the report's elements carry `partId`.
- `loom/agents/conductor.py`: the scene task's HELD ELEMENTS block is now ON SCREEN WHEN YOUR BEAT STARTS (each element's
  maker found back along the keep lists, its box, kit part and states; drive, never redraw; the "draw the thing yourself"
  line is gone); `_drawn_as`, `Conductor._prev_same_station`; Relay attaches the previous beat's last look
  (`qa/snapshot_<prev>.jpg`) to the scene worker. Role card `scene.md`, `shuttle/agents/scene-author.md` (regenerated).
- Tests (`tests/suites/held_parts.py`, red first): `primitive_runtime_a_held_kit_part_keeps_its_handle_and_a_copy_is_refused`,
  `check_a_scene_task_says_what_is_on_screen_and_how_to_drive_it`.

## 2026-10-12 - run_compare reads Relay lessons (R-54)
- `tools/run_compare.py`: `relay_stats`, `relay_task_phases` (a Relay lesson's roles onto Shuttle's phases: first task in its
  stage's phase, the storyboard's look round in P5, rework before the first critic in P9 and after it in P10; code stages
  timed from stage and check times), `stats` picks the reader by the lesson's logs.
- Test: `check_run_compare_reads_a_relay_lesson`. `docs/research/https_private_relay/fingerprint.py` (engine fingerprint).

## 2026-10-12 - Shuttle: Opus on the storyboard on the API path (D-164)
- `loom/shuttle/config.json` `lead.storyboard.api` and `loom/shuttle/launch.py`: a preset may give P5 Opus on the API path
  (`--preset sonnet-only`), no other phase or lead; `docs/AGENTS_RUNBOOK.md`; test
  `agents_shuttle_sonnet_only_preset_uses_opus_for_the_storyboard_only` updated (opus-plan is refused on the API).

## 2026-10-12 - reuse or build, per style (D-163)
- `loom/kept.py` (new): the style's library `assets/kept/<style>/{parts,beats}/<name>/{card.json, code.js, still.jpg}`;
  `listing`, `storyboard_errors`, `parts_js`, `beat_start`, `keep` (a kit part cut out of its kit with the parts it calls),
  `py -m loom kept list|keep|remove`.
- `loom/schemas/storyboard.schema.json`: `reuse` on kit parts and scenes; `loom/checks/gates.py`: the storyboard gate checks it;
  `loom/checks/kit.py` `declared`: a reused part is not the kit's to write; `loom/compose.py` and `loom/shuttle/kitpreview.py`:
  reused parts load before the kit (`build/scenes/_kept.js`).
- `loom/agents/conductor.py`: the storyboard task lists the style's library, the kit task the reused parts, the scene task a
  reused beat's starting code; Relay keeps after a passing render. `loom/agents/tools.py` `get_style_pack`: `kept_library`.
  `loom/flow.py` `keep_built` at `approve final`. `loom/shuttle/hook.py`: `assets/kept/` is generated.
- Instructions (Relay's storyboard card stays within its budget: the listing carries the rule): `loom/agents/roles/{kit,scene}.md`, `shuttle/agents/{kit-builder,scene-author}.md`,
  `skills/loom/shuttle-director/SKILL.md`, `docs/STORYBOARD_GUIDE.md`, `docs/AGENTS_RUNBOOK.md` section 16, CLAUDE.md rule 4.
- Tests: `tests/suites/kept_library.py` (3).

## 2026-10-12 - Opus on the storyboard for Relay on the API (D-162)
- `loom/agents/config/profiles/claude-core-opus-sb.json`: claude-core with Opus 5.5 on the storyboard outline and the
  storyboard, allowed by its `opus_storyboard` field; `docs/AGENTS_RUNBOOK.md` 12a.

## 2026-10-12 - the Relay and Shuttle architecture, drawn
- `docs/context/PIPELINES_ARCHITECTURE.html`: the shared stage graph, Relay's conductor and repair loop, Shuttle's lead,
  rails, phases and sub-agents, a side-by-side table and recorded run costs. Checked against `loom/stages.py`,
  `loom/agents/config/profiles/claude-cc.json`, `loom/shuttle/config.json`, `shuttle/agents/*.md` and `RUNS.md`.
- Doc and code disagree in three places, left for their owners: the `conductor.py` comment on the plan gate (off by
  default), the `rails.py` docstring on reopen (only that phase goes stale) and the playbook's "models and sets" for
  the Three.js toolbox (models only).

## 2026-10-11 - the veil check reports only a changing veil (D-161, L-416)
- `tools/node/probe.mjs` `full_frame_veil`: reported when its alpha or covered share moves by `VEIL_CHANGE` (0.15) while
  held; a steady translucent wall wash is a set; alpha floor 0.2. `loom/qa.py` `lc_line` says how much it changed.

## 2026-10-11 - music always mixed, timeouts that end, transitions without held blanks, a seam join per style (D-160, R-53)
- `loom/flow.py`: a lenient or silent compose leaves the compose stage pending (the real compose and its mix run).
- `loom/util.py`: `run` kills the process tree on a timeout (`_run_tree`, `_kill_tree`).
- `loom/compose.py`: `seam_join`, `wipe_dir`; the seam substitute is the style's join. `packs/styles/*.json`: `seam_join`,
  `join_note`. `loom/agents/conductor.py` `_style_summary`: `joins`.
- `runtime/world.js` `coverAt`: a dip or fade is fully covered only at its middle. `runtime/templates/_helpers.js`
  `H.leadAt`: the first element at once after a cut or cover. `tests/suites/style_system_golden.json` re-recorded.
- Tests: `check_a_snapshot_compose_never_counts_as_the_compose`, `check_a_timeout_ends_the_call_even_when_a_grandchild_
  holds_the_pipe`, `check_a_seam_between_worlds_takes_the_styles_join` (replaces the R-49 fade test),
  `primitive_runtime_joins_never_hold_a_blank_frame`.

## 2026-10-11 - continuity names as a contract, shadow-aware inset, briefs in order, calm backgrounds (D-159, L-409 to L-412)
- `loom/agents/conductor.py` `taken_by_next` and the scene task's CONTRACT WITH THE NEXT BEAT; `loom/agents/tools.py`
  `_continuity_contract` in lab_snapshot: missing contract names hold the look, a held_missing for a kept name waits on the
  previous beat (shared, not held).
- `runtime/kit.js` `containerOf`: an offset same-size twin is a shadow, a pure translation counts, the smallest container
  wins; tight_inset names the shape measured against.
- `loom/shuttle/server.py` `_read_brief`: a later part asked first returns the first unread part with a note; the spawn
  prompt says part 1 has no number. `shuttle/agents/*.md` say so.
- `tools/node/probe.mjs` `full_frame_veil` (error once held 10 s, else a warning; one sample is a fade, not reported);
  `loom/qa.py` `lc_line`. `runtime/fx.js` `fx.drift` (default 1) scales the nebula's motion; `packs/styles/flat-cosmos.json`
  intensity 0.45 and drift 0.4; `docs/VISUALS_PLUS.md`.
- Tests: `check_the_next_beats_names_are_a_contract_in_the_look`, `check_the_inset_check_knows_a_drop_shadow`,
  `agents_shuttle_brief_parts_come_in_order`, `check_a_full_frame_veil_is_a_second_background`.

## 2026-10-10 - Opus plans by default (D-158)
- `loom/shuttle/config.json`: `model_presets.opus-plan` (Opus for P1 to P5) and `default_preset.subscription`; `loom/shuttle/launch.py`
  applies it when a run names no plan. Test: `agents_shuttle_opus_plan_is_the_default_preset`.

## 2026-10-10 - the https-private rerun measured; run_compare attributes reconcile rows (R-50, L-403)
- `tools/run_compare.py`: a sub-agent session's reconcile row counts in the phase its session worked in.
- `docs/research/2026-10-10-https-private-v2-comparison.md` (written by the tool) and `projects/https-private-v2/RUN_LOG.md`.

## 2026-10-10 - Relay continue chains in order; a seam is a fade; one ending (R-49, L-402)
- `loom/agents/conductor.py` `Conductor.chains`: a beat that continues from or keeps the beat before it is written after
  it; chains in parallel (the pilot pair too).
- `loom/compose.py`: a camera pan between two worlds becomes a `fade` (through the field), not a `dip` (through black);
  `docs/SCENE_API.md` says so.
- `runtime/world.js`: the final scene no longer recedes element by element; the camera's outro fade takes the frame.
  `tests/suites/style_system_golden.json` re-recorded (`_note_r48`).
- Tests: `agents_relayup_beats_that_hold_are_written_after_the_beat_they_hold_from`,
  `check_a_seam_between_worlds_becomes_a_fade_not_black`, `primitive_runtime_the_last_scene_leaves_with_the_frame`.

## 2026-10-10 - the check at draw time, its last blind spots closed, a WebGL preflight (D-157)
- `loom/agents/tools.py` lab_snapshot: the beat's findings (`check_errors`, `check_warnings`, `shared_with_other_beats`) from Loom's
  checker and the on-screen type measure; the beat's own errors hold submission like runtime errors. `loom/qa.py`: `beat_findings`,
  `lc_findings`, `lc_line`; `probe_build(env=)`. `tools/node/probe.mjs`: LOOM_PROBE_BEATS limits the layout and contrast audits to those
  beats' windows; `text_off_card` and `line_into_object`.
- `runtime/overlay.js`: the section label's colour is `roles.section_label` (muted by default); `packs/styles/story-cartoon.json` sets it
  to ink; `loom/checks/style_lint.py`: `vignette_dark` and the section-label rule. `runtime/treat.js`: a flag on a part has no ground shadow.
- `tools/node/webgl_check.mjs`, `loom/render.py` `render_webgl`, `py -m loom doctor` "render WebGL", and the Shuttle launcher refuses a
  run without it. `tools/run_compare.py` (new): runs side by side, phase by phase (time, calls, tokens, cost, looks, checks and their errors).
- Tests: b16 and b17 in the planted-defect test; `check_a_look_splits_its_beats_own_findings_from_the_ones_it_shares`,
  `check_style_lint_measures_the_section_label_where_the_vignette_darkens_it`, `check_a_flag_on_a_part_has_no_ground_shadow`,
  `check_shuttle_refuses_a_run_without_webgl`; probe stubs in shuttle_rails and relay_upgrade take `env`.

## 2026-10-10 - a redrawn text is a warning in the check, an error at the pilot join (D-154, L-393)
- `tools/node/probe.mjs`: `text_redrawn` findings are warnings (`across` says a later beat redrew an earlier one's);
  `loom/shuttle/server.py` pilot_check counts a redraw across the pilot join as an error.

## 2026-10-10 - Loom's checker: one finding per redraw, a text block's lines unpaired (D-154, L-392)
- `tools/node/probe.mjs`: `text_redrawn` is one finding per pair of beats (the texts and elements listed); two tspans
  of one SVG `<text>` are not compared for overlap (a tilted tag's line boxes meet, its glyphs do not).
- Test: b15 (a two-line text tilted 14 degrees) in the planted-defect test.

## 2026-10-10 - scenes must earn their place (D-156); the painterly meeting room in the library
- `tools/world_packs.py` gate: a directed scene needs `uses` (4+ lesson moments) and `reuse`; a low scene needs `keep`; at
  most 6 high or medium scenes per world. `packs/worlds/office.json`: uses and ratings (4 high, 2 medium, 4 low kept with
  reasons). Test `check_world_gate_makes_every_scene_earn_its_place`.
- `py -m loom sets demand` (loom/sets.py): which world scenes past lessons name in their words (engine vocabulary such as
  "station" ignored). On the 34 lessons: meeting room 14, desk 3, one-to-one 3, the rest 0 to 2.
- `assets/sets/office/meeting_room/painterly.svg` added (approved by Kshitij). It cannot be selected until a style pack
  maps to the painterly set style.
- `docs/assets/SET_PROMPTS_GUIDE.md`: how to choose a world's scenes.

## 2026-10-10 - Loom's checker names redrawn texts (D-154, L-391)
- `tools/node/probe.mjs`: `text_redrawn`, the same words drawn again on themselves (boxes 0.8 alike) for 500 ms; an
  error when a later beat redraws what an earlier beat still shows, a warning within one beat. `qa.lc_lines` formats it,
  `qa.same_finding` matches it to HyperFrames' overlap.
- Tests: b14 in `check_layout_checker_finds_planted_overlaps_and_contrast_and_stays_quiet_on_exempt_cases`;
  `pipeline_pilot_check_catches_the_kit_that_cannot_carry_continuity` reads the failing moments from whichever checker
  ran; the stub probes in `tests/suites/shuttle_rails.py` carry Loom's (empty) audits.

## 2026-10-10 - Relay upgrade: one vision, honest tools, one world (D-155, R-46)
- `loom/agents/conductor.py`: `film_card` heads the scene, kit, clip and critic messages and every fixer's (a fresh
  storyboard fixer also gets the outline); the planners get the whole brief and the narrator; persona_pick reads
  `voice_note`; the script gets THE FILM'S LOOK; the style summary carries palette tokens and roles; the pilot pair
  (`_pilot_jobs`, `_run_pilots`, `look_so_far`): kit reports from the pilot reach the kit before the other beats, its
  pictures go to them; `mix_note`; `require_kit_preview`.
- `loom/agents/tools.py`: `lab_snapshot` on the lesson clock (refuses times outside the beat) and with `edits`;
  `apply_edits` (shared with Shuttle); `_runtime_hold` at `submit_scene`; `read_artifact`; `kit_preview` and the preview
  gate in `submit_kit`; `report_finding` shows its fields; `FIX_ROUTES` with "kit"; `ToolContext.lesson_lock`.
- `loom/agents/contracts/finding.schema.json`: "kit" route. `loom/qa.py` `snapshot_sheet_build`: large labelled frames,
  `missing`. `loom/agents/cc_server.py`: lab_snapshot outside the lesson lock, `calls.jsonl`. `loom/agents/cc_runner.py`:
  full tool names in the system prompt. `loom/agents/runtime.py`: `craft_notes` (guide sections and skill sections per
  role, preloaded).
- `loom/checks/story.py` `world_checks` (gate one_world, ratcheted; finished lessons baselined in film_baseline.json).
- Role cards: scene, kit, critic, clip, script, storyboard, storyboard_outline, _shared. Shuttle: lesson-clock snapshot
  text, the finding's fields, `_edited` through `apply_edits`.
- Tests: `tests/suites/relay_upgrade.py` (16); red runs `docs/research/relay_upgrade/red_runs.py`.

## 2026-10-10 - Loom's own layout checker, proved, the default (D-154)
- `tools/node/probe.mjs`: `layoutAudit` (text overlap, seen or not: clash, cut; `text_covered`, a text partly under an
  opaque filled shape; every 0.5 s and 1 s, samples batched 20 to a call) and `contrastAudit` (WCAG AA, glyphs hidden,
  twice per beat); a text seen nowhere, blurred 1.5 px or more, allow-overlap or nested is not judged; `rep.nodes`.
- `loom/qa.py`: `checker_mode` (`loom` default, `hyperframes`, `shadow`; LOOM_CHECKER or project.json
  `check.checker`), `lc_lines`, `same_finding`, `hf_gating`, `checker_shadow` (`qa/checker_shadow.json`), the
  `page_size` warning over `NODE_BUDGET` (20,000). `loom/shuttle/server.py` pilot_check follows the mode;
  `loom/agents/router.py` and `loom/ledger.py` read `lc` lines.
- `runtime/world.js`: the dots background is one pattern, the paper specks one path (`ambient.nodes: "each"` keeps
  the old way; frames differ by anti-aliasing only).
- `tools/checker_agreement.py` (new): Loom's findings against HyperFrames' on every lesson whose check matches its
  build; record `docs/research/2026-10-10-checker-agreement.json`, write-up `docs/research/2026-10-10-loom-checker-reliability.md`.
- Tests: `check_layout_checker_finds_planted_overlaps_and_contrast_and_stays_quiet_on_exempt_cases` (13 planted cases),
  `check_layout_checker_lines_modes_router_and_shadow_record`.

## 2026-10-10 - all ten office scenes plan-checked; batch prompts (L-379)
- `packs/worlds/office.json`: the nine remaining scenes rewritten from floor plans with every frame position computed by
  the new `tools/set_camera.py` (plan audits in `docs/assets/plan_checks/office/`), then corrected after a review pass
  (a monitor hiding the receptionist, a bicycle in the corridor's escape route, a photo that would show a face, a screen
  edge behind a head, sun on the exec office monitor, joists and pipes that do fall in the overscan); 16 new object
  construction notes; the outside view; exit-sign height above the door head; `batches` (three scenes each).
- `tools/world_packs.py`: lit things and night glass get palette rules; cropped objects continue 120 px into the overscan;
  batch prompts (`docs/assets/world_prompts/<world>/<style>/batch_<k>__<scenes>.md`, the shared parts once, one set at a
  time); no scene is a draft any more. `packs/set_styles.json`: 2.5D haze follows the scene.
- Test: `check_batch_prompts_carry_every_set_once_and_the_shared_parts_once`.

## 2026-10-10 - Shuttle's sonnet-only model preset (D-153)
- `loom/shuttle/config.json` `model_presets` (`sonnet-only`: Sonnet everywhere, Opus for P5 only); `launch.run(preset=)`,
  `--preset` on `py -m loom shuttle run`; the preset is recorded and kept on resume; `launch.split_by_model`: a session
  never mixes models.
- Test: `agents_shuttle_sonnet_only_preset_uses_opus_for_the_storyboard_only` (red without the split by model).

## 2026-10-10 - the set library and the set loader (D-152)
- `loom/sets.py` (new), `py -m loom sets [list|add <batch> --by NAME|find TEXT --style S|check]`: drawn sets filed as
  `assets/sets/<world>/<scene>/<set_style>.svg` with a card (anchors and slots in frame coordinates, setups, approver,
  source batch), promoted only from a passed intake with an approver; `assets/sets/INDEX.md` generated.
- Strict selection: an exact id, or words that contain the scene's whole name or alias (aliases added to every world in
  `packs/worlds/`), naming the world when a name is shared or another world is named; exactly one scene, and only in the
  lesson's own set style. Refused otherwise, with the reason. The storyboard gate reports it; the schema has `set`.
- `runtime/sets.js` (new): `Loom.place.set(ctx, name, id?)` draws a set on the place camera (far, mid, near at the
  places' depths), ids prefixed per use, anchors and slots from the card, `R.slot(name)` for content that rides its layer,
  `R.relight(setup, t0, dur)`. Compose and the lab embed only the sets a lesson asks for; the scene gets `set_id`.
- The first set: `office/meeting_room` in 2.5D lit (Claude Design, accepted by Kshitij, D-151). Lab strip
  `docs/styles/demos/lab/lab_set_meeting_room__cinematic-dawn.jpg`.
- `docs/SCENE_API.md` (drawn sets), `CLAUDE.md` (generated files), `tools/context_check.py` (the set library checks),
  capabilities regenerated. Tests: `tests/suites/sets_library.py` (6).

## 2026-10-10 - box-built sets accepted (D-151)
- `tools/asset_intake.py`: a set drawn only with straight-edged shapes is noted, not failed; `tests/suites/world_sets.py`
  updated. `docs/assets/reviews/2026-10-09-office-meeting-room-pilot.md`: attempt C accepted as delivered.

## 2026-10-09 - Shuttle costs cut where v3's money went (D-150, L-372 to L-377)
- `runtime/world.js`: after each beat builds, its holds are audited: removing what an earlier beat drew in a held element
  is an error on that beat (`held_content_removed`), hiding one at load a warning (`held_hidden_at_load`).
  `loom/agents/router.py` routes the error to the beat's scene. `loom/agents/roles/scene.md`, `docs/SCENE_API.md`: a held
  element is shared.
- `loom/shuttle/server.py`: `edits` on lab_snapshot, kit_preview and render_clip (applied to the current draft, each old
  text found once; the kit's last previewed draft kept in `logs/shuttle/kit_draft.js`, submit_kit takes it);
  `plan_fixes` and `fixes_done` (P10 judge and fix round), with role checks on delegate, critic_review, submit_review.
- `loom/shuttle/launch.py`: the "mixed" split by default (`rails.SPLITS`); the start message carries the status and
  the notes (`status_block`, `notes_block`); P10 alternates a judge on the critique lead and a fix round on the build
  lead when they differ (`p10_role`, `LOOM_SHUTTLE_ROLE`); the stream ends a judge after its plan and a fix round after
  its report. `rails.py`: the two tools, the fix plan in the progress mark. `config.json`: `session_split: "mixed"`.
- `loom/render.py` `verify_render`: four frames at a time, the total and the slowest steps in the report.
- `shuttle/agents/*.md`: scene-author, fixer, kit-builder and clip-author send edits; the playbook: the start message,
  the split, P10's judge and fix round.
- Tests: `pipeline_a_beat_that_empties_a_held_element_is_an_error`, `agents_shuttle_sub_agents_send_edits_not_whole_files`,
  `agents_shuttle_a_session_starts_with_its_status_and_notes`, `agents_shuttle_opus_judges_and_sonnet_fixes_in_p10`,
  `pipeline_render_verification_runs_in_parallel_and_says_what_was_slow`; two Shuttle tests for both splits. `tools/shuttle_s0.py`:
  the mixed split, the fixers' edits.

## 2026-10-09 - the meeting-room pilot reviewed; set prompts draw by hand; the intake refuses box-modelled sets (L-370, L-371)
- Review: `docs/assets/reviews/2026-10-09-office-meeting-room-pilot.md` (3 deliveries: two 2.5D, one painterly; frames,
  overlays, parallax and no-light checks in `docs/assets/reviews/office-meeting-pilot/`).
- `tools/world_packs.py`: every set prompt has a DRAWING METHOD section (draw by hand, curves for soft things, every
  shape a named object, shadows shaped by what casts them) and the quality check repeats it; regenerated.
- `packs/worlds/office.json`: exact construction for the meeting chair and the cardigan.
- `tools/asset_intake.py`: a set drawn only with straight-edged shapes fails; test extended in `tests/suites/world_sets.py`.

## 2026-10-09 - a Shuttle session lists only the agents and the menu its phase needs (L-369, D-148 follow-up)
- `loom/shuttle/launch.py`: each session's settings deny Claude Code's own sub-agents (`BUILTIN_AGENTS`) and the Shuttle
  sub-agents that cannot work in its phases (`agent_denies`); the toolbox menu goes into the lead's prompt only for
  sessions in P5 to P10 (`MENU_PHASES`, `lead_prompt(window)`). Measured on a captured session start.
- Test: `agents_shuttle_a_session_lists_only_its_agents_and_its_menu` (red without each).

## 2026-10-09 - directed world sets: one end-to-end Claude Design prompt per scene and style (D-149, L-365 to L-368)
- `packs/set_styles.json` (new) and `loom/set_styles.py` (new): how a SET is drawn in each of 9 styles (rendering,
  light, texture, depth, quality bar, reject list) and each style's material palette: 17 material families with base,
  shade, highlight and deep tones plus ink, light, shadow and haze, 72 distinct colours per style; shades tinted by the
  style's own shadow colour, every shade and deep tone visibly different from its base; layout rules from
  professional background practice.
- `packs/worlds/office.json` (brief 2): one specific place (a converted 1920s textile mill), real-world scale and
  architecture checked against references, construction notes for 31 objects, and every scene directed (camera,
  composition, light, far, mid and near, details, slots, anchors, variants, avoid, objects). The meeting room is
  plan-checked: a floor plan, a computed camera and the frame position of every focal point and character zone.
- `tools/world_packs.py`: writes `docs/assets/world_prompts/` (90 scene prompts and 9 props prompts for the office,
  plus an index); the gate refuses a directed scene that misses a field, puts people in a set, names an object with
  no construction note or refers to another scene; unchecked scenes are marked draft.
- `tools/asset_intake.py`: world-pack sets and set props are checked against their set style's exact palette, and a
  set's far, mid and near layers, frame_safe, anchor_floor_y and 2400 x 1350 canvas.
- `tools/context_check.py`: every generated prompt file must match its sources. `CLAUDE.md`: the prompts folder is
  generated.
- Docs: `docs/assets/SET_PROMPTS_GUIDE.md`, `docs/research/2026-10-09-set-references.md`; WORLD_PACKS.md regenerated.
- Tests: `tests/suites/world_sets.py` (4, each with a control).

## 2026-10-09 - a render resumes once after a capture page timeout (L-364)
- `loom/render.py`: when a capture browser's page does not load within HyperFrames' 60 s, the render resumes once from
  its kept segments with `PRODUCER_PAGE_NAVIGATION_TIMEOUT_MS=180000` (both pipelines and the CLI). Found by two S0 runs.
- Test: `pipeline_render_resumes_once_after_a_capture_page_timeout` (red on the old renderer).

## 2026-10-09 - the launcher survives a state file being replaced (L-363)
- `loom/util.py` `read_json`: a refused open on Windows (another process replacing the file) is retried, as `write_json`
  already did for its rename. `loom/shuttle/launch.py` `Stream.guards`: a guard that cannot read the state is traced
  (`guard_unread`) and tried on the next message instead of ending the launcher. Found by the D-148 S0 rerun.
- `run_session`: whatever ends the launcher kills its `claude -p` first and traces it (`launcher_error`); the crashed
  S0 launcher had left the session and its loom-mcp running, stopped by hand.
- Tests: `agents_a_state_file_being_replaced_does_not_stop_the_launcher` (red on each old path),
  `agents_a_launcher_that_fails_kills_its_session` (red without the kill).

## 2026-10-09 - Shuttle's lead carries less: briefs by reference, a session per phase, its tools only (D-148, L-356 to L-362)
- `loom/shuttle/server.py`: `delegate` stores the whole brief and returns a short spawn prompt; `delegate(jobs=[...])`;
  `collect(token='all'|tokens)`; `read_artifact('brief:<token>[#k]')` in parts, only the sub-agent's own (or the lead);
  `check` composes first; `contact_sheet`/`frames`/`strips` take `detail` (overview, full) and report what each picture
  costs; a reopen of a phase before the session's says to end the session; `list_tools` lists only the session's tools
  (`LOOM_SHUTTLE_SESSION`).
- `loom/shuttle/rails.py`: `SPLITS` (phase, group), `gkey`, `parse_range`, `session_tools`, `progress_mark`,
  `open_tokens`, `brief_read`; no write by a sub-agent before it has read every part of its brief.
- `loom/shuttle/launch.py`: one session per phase by default (`session_split`), the session passed to loom-mcp, a
  session past its phases ended after 6 lead messages (`PAST_WINDOW`), retries counted only for sessions that changed
  nothing, at most 6 sessions per phase; `lead_by_group` keys are ranges. `sdk_runner.py` the same per session.
- `loom/capabilities.py` `library_sets`, `library_note`; `loom/agents/conductor.py`: the kit task offers the engine's
  places and objects as an option (both pipelines); `loom/agents/roles/kit.md`, `shuttle/agents/kit-builder.md`, the
  playbook (`skills/loom/shuttle-director/SKILL.md`): an option, never a requirement.
- `shuttle/agents/*.md`: each sub-agent reads its brief by reference first. `loom/shuttle/config.json`: `session_split`,
  `max_sessions_per_phase`, `pictures.overview_px` (empty: the sweep at the size the lead saw before).
- Tests: `tests/suites/shuttle_context.py` (7 tests, red runs in `docs/research/shuttle/red_runs.txt`);
  `agents_shuttle_the_build_session_runs_on_sonnet` for both splits. `tools/shuttle_s0.py`: one session per phase, briefs
  read by reference, a check round in three lead turns, the looks at two sizes (four new cases, the gate-skip case rewritten).
- Docs: runbook section 12, `docs/research/2026-10-09-measured-run-assets-and-cost.md` (what was built), STATE.

## 2026-10-09 - pipeline health pass: a portable build hash, four tests that could not fail, a draft's reason logged (R-41, L-351 to L-355)
- `loom/qa.py` `build_hash`: one form on every OS (backslash-joined parts, case-folded part order: what Windows already
  wrote, so no recorded hash changes); each file is listed on its own, so a locked or vanished file is skipped instead
  of the whole listing giving up and hashing an empty build.
- `loom/shuttle/rails.py` `take_files`: a draft named as a beat needs a reason at the rails too, and taking it is logged
  (`take_draft_as_beat` in logs/decisions.jsonl, `draft_taken` in the trace).
- Tests: new `agents_relayfix_the_build_hash_is_the_same_on_every_os`,
  `agents_relayfix_the_run_loop_stops_before_the_render_on_a_final_blocker`; rewritten so they can fail:
  `agents_shuttle_snapshots_run_in_parallel_on_private_builds` (barrier, not a sleep),
  `agents_shuttle_lead_reads_the_engine_claude_md_and_nothing_of_the_persons` (a planted file and a control),
  `agents_a_build_rewritten_mid_hash_does_not_stop_the_launcher` (the hash of the build without the file; a locked file),
  `agents_shuttle_a_draft_is_not_taken_by_accept_phase` (the reason required and logged). Each shown red with its fix off.
- `docs/research/2026-10-09-pipeline-health-and-film-review.md` (the health check, the mutation check of 31 fix tests,
  both films reviewed frame by frame and rated), `docs/research/pipeline_health/` (mutation report, frame crops).
- `docs/context/STATE.md`: test count.

## 2026-10-09 - fixes made during the measured Shuttle run (R-40, L-341, L-350, L-348, L-349)
- `loom/shuttle/launch.py`: a session that fails on a login refresh waits 60 s and starts fresh (`auth_transient`); the
  per-message phase lookup never raises (`Stream._phase`).
- `loom/qa.py` `build_hash`: a file that vanishes between the listing and the read or stat is skipped.
- `loom/shuttle/server.py` `t_pilot_check`: returns a picture of the failing moments; checks pilot beats that are only
  "to verify" and keeps them on a pass. `rails.py`: frames, contact_sheet and strips open from P8; `take_files` does
  not take a draft an owner token never submitted unless named with a reason.
- `loom/agents/tools.py` (both pipelines): a style guide by its id or path; an API name that is not a heading answered
  with the section that uses it; a refused finding mapped to the schema and logged; kit `verified`/`unverified` given as
  a sentence taken as a one-item list.
- Tests: `agents_shuttle_waits_out_a_login_refresh`, `agents_a_build_rewritten_mid_hash_does_not_stop_the_launcher`,
  `agents_shuttle_pilot_check_verifies_beats_after_a_kit_fix`, `agents_skill_lookup_finds_a_style_guide_by_its_id_or_path`,
  `agents_api_lookup_finds_an_api_name_that_is_not_a_heading`, `agents_a_finding_in_other_words_is_logged_not_lost`;
  extended `pipeline_pilot_check_catches_the_kit_that_cannot_carry_continuity`, `pipeline_shuttle_kit_gate_red_and_green`,
  `agents_shuttle_pilot_pair_comes_before_the_other_beats`. The draft rule (L-348) still needs its test run.
- After the run: `agents_shuttle_a_draft_is_not_taken_by_accept_phase` (L-348), red without the rule, green with it;
  the Shuttle suite 37 of 37 plus this one.

## 2026-10-09 - an avatar card of short lines fills its card (L-347)
- `runtime/overlay.js` (the presenter): when every card line fits well inside the card at the lead size, the lines are
  set at the lead size and their block is centred in the card; the card keeps its width. Longer lines draw as before.
- Tests: `tests/suites/relay_fixes.py` `agents_relayfix_a_presenter_card_fits_short_lines`.

## 2026-10-09 - the robustness pass on the Relay fixes (L-346)
- `runtime/style.js`: "none" (and "transparent") flows through the colour arithmetic: a mix or shade of it stays none,
  a contrast against it is judged on the field (it read as #NaNNaNNaN).
- `runtime/core.js`: a kit part's wrapper keeps what the kit hung on the function (states, notes).
- `loom/agents/router.py`: only parts `scenes/_kit.js` defines go to the kit's author (`_kit_parts`); a helper a
  bespoke scene hangs on Loom.lesson stays that scene's.
- `loom/agents/cc_runner.py`: `same_model` accepts a dated snapshot of the alias's model; a resumed session with no
  recorded usage adds no reconcile row and records its usage from then on.
- `loom/qa.py`: the painted-overlap pass fails closed (overlaps stay errors when it cannot run); `build_hash` is
  memoised on the build's file names, sizes and times.
- `loom/checks/gates.py`: the option-letter gate refuses "(D)", "A -" and "Option A:" too (`OPTION_LETTER`); a quiz
  pair is compared word for word with spacing normalised.
- `loom/agents/conductor.py`: a later critic pass sees only the beats changed since the last one, with the earlier
  findings on them (the critic's later-pass mode); after the routed passes, `final_review` looks at the beats the last
  fixes changed: a blocker stops the render, anything less goes to `qa/review_final.json`.
- `loom/agents/roles/critic.md`: a template's designed emphasis (a quiz answer's dimmed options) is not a defect.
- Tests: `tests/suites/relay_fixes.py`, seven after "the robustness pass".

## 2026-10-09 - model_shot preset, a clip on the first beat, and the dc-cooling lesson (D-147, L-342 to L-345)
- `runtime/three/presets/model_shot.js` (new): one library model or set as a preset beat. Params: model (library),
  opts, states on spoken words, run, arrive_say, mood, mood_say, light, elevation, zoom, turn, yaw. The camera fits the
  model's projected vertices at three angles of its turn (InstancedMesh instances included, contact shadows left
  out), so the model fills 88 % of the frame / zoom without cropping.
- `loom/three_bridge.py` `preset_errors`: a `library` param must name a model in assets/models3d, and every state key
  must be on that model's card (or `t`).
- `runtime/overlay.js`: a clip reveal is never scheduled before 0 s (a clip on the first beat revealed at -0.05 s:
  `bad_time`).
- `docs/TOOLBOX.md` (three section and menu row), `docs/SCENE_API.md` (presets): model_shot.
- `runtime/catalog.md`, `runtime/capabilities.json`: regenerated with `py -m loom catalog`.
- Test: `tests/suites/devices_presets.py` `pipeline_model_shot_params_name_a_real_model_and_its_keys`.
- Lesson `projects/dc-cooling` ("Where the heat goes", 32 beats, 254.1 s, corporate-clean): plan to scenes in agent
  mode, 9 model_shot beats; strict draft compose, probe 0 errors over 157 elements and 32 scenes. Not rendered here
  (Kshitij renders it on his PC).

## 2026-10-09 - option letters, quiz pairs, transitions, and a check that goes stale after a scene fix (L-337 to L-339)
- `loom/checks/gates.py`: an option's text may not start with its own letter ("A:", "B.", "C)"): the quiz templates
  draw A to D; a quiz.answer's options must be its question's, word for word, in order.
- `loom/agents/roles/critic.md`: a transition seen mid-join (a page turn's corner, a wipe's edge, a zoom from the last
  frame) is not a defect.
- `loom/flow.py`: compose's output hash is the build hash (`qa.build_hash`), not index.html: a fix to one scene now
  makes the check stale, so the critic and the render never see pictures from before a fix. Lessons checked before
  show their check stale once and re-check (a code stage).
- `runtime/catalog.md`, `runtime/capabilities.json`: regenerated with `py -m loom catalog` (the suite found them stale).
- Tests: `tests/suites/relay_fixes.py` `..._quiz_options_carry_no_letter_of_their_own`,
  `..._a_quiz_answer_repeats_its_questions_options`, `..._a_scene_only_fix_makes_the_check_stale`.

## 2026-10-09 - Shuttle has Relay's toolbox (D-146)
- The toolbox menu (docs/TOOLBOX.md) in the lead's prompt (`launch.lead_prompt`, logs/shuttle/playbook.md, also the SDK
  runner) and in the scene-author, clip-author, kit-builder and fixer prompts (`agents.full_prompt`, Relay's menu roles).
- loom-mcp: `use_tool` (any; the sections, the live 3D model list, the load logged) and `set_device` (the lead; after P5
  a beat-scoped reopen of the storyboard, then its gate). The four building sub-agents list `use_tool`; the fixer also
  `capabilities`. Delegating a device beat is refused with set_device named.
- Playbook: when a tool earns a beat, the storyboard's `tools` list and its hand-over, device beats as `device_shot`
  presets, device defects fixed with set_device.
- Tests: `agents_shuttle_has_relays_toolbox`, `agents_shuttle_use_tool_and_the_beats_handover`,
  `agents_shuttle_set_device_reopens_one_beat` (red on Shuttle without the toolbox). L-340.

## 2026-10-09 - Shuttle: Sonnet builds, Opus plans and judges; an error in a beat rewrites that beat only (D-145)
- `loom/shuttle/launch.py` `lead_for`, `config.json` `lead_by_group` (`P7-P9: sonnet`), `--build-lead sonnet|opus|same`
  (run and resume; recorded in the run state with each group's lead).
- `loom/shuttle/rails.py`: a beat file whose kit part changed for another beat is "to verify" (`files_to_verify`), not
  sent back; `refresh_verified` after each check keeps clean beats and leaves flagged ones for a fixer; `t_check` calls
  it on pass and fail; `lesson_status` lists `beats_to_verify`. A beat whose own storyboard scene changed still needs
  its author. Playbook: join errors to one fixer owning both beats.
- Kshitij's batch-fix idea assessed: `docs/research/2026-10-09-batch-fix-idea.md` (not built yet).
- Tests: `agents_shuttle_the_build_session_runs_on_sonnet`, `agents_shuttle_a_kit_change_rewrites_no_other_beat` (red
  on the code before it).

## 2026-10-09 - what the Relay verification run found: an overlap nobody could see, and a scene's own inset (L-335, L-336)
- `loom/qa.py` `painted_overlaps` with `tools/node/overlap_paint.mjs` (new): each HyperFrames content_overlap error is
  checked at its time against what is painted on top (9 points in the boxes' intersection); when one text is under an
  opaque shape at every point, it is a warning "(not seen: ...)". feedback-relay-v2 stopped with exit 2 on two such
  findings at the b09/b10 join (b09's text under b10's opaque card), which no worker could fix.
- `loom/agents/router.py`: a tight inset or a contrast failure in a bespoke beat, drawn by the scene itself (no kit
  part), goes to that beat's worker; in a template beat it stays the engine's (`OWN_GEOMETRY_CODES`).
- Tests: `tests/suites/relay_fixes.py` `agents_relayfix_a_text_overlap_is_an_error_only_when_both_texts_are_seen`,
  `agents_relayfix_a_bespoke_scenes_own_inset_goes_to_its_author` (record `docs/research/relay_fixes/red_runs.txt`).

## 2026-10-08 - Shuttle redoes only what changed; the Opus run's findings fixed (D-144, L-318 to L-323 closed, L-332 to L-334)
- **Rework (`loom/shuttle/rails.py`, `server.py`):** a reopen marks only its phase stale; later phases re-check
  themselves. Accepted beat files record their storyboard scene and the kit parts they call (`file_deps`,
  `file_problem`); `reopen(..., beats=[...])` for P4/P5 (cap 8, no approval voided); `accept_phase('P8', beats, why)`;
  `lesson_status` and the report show both caps.
- **Pilot pair:** with a lesson kit, P8 delegates the first continue join first and `pilot_check` (lenient compose,
  probe and HyperFrames layout on a private build) gates the rest. The kit preview names a part drawing outside its
  parent.
- **Sub-agents:** scene-author and clip-author in P8 to P10; fixer 16 turns, 40 calls (`shuttle/agents/*.md`, emitted).
- **Critic:** later passes judge only changed beats and open findings; opt-in "later pass" block in
  `conductor.task_message` (Relay unchanged).
- **Snapshots (shared):** `tools.lab_snapshot_prepare/finish`; `qa.private_build`, `probe_build`, `snapshot_sheet_build`,
  `hf_check_build`; the picture and the probe run outside the lock on a private copy.
- **Props gate (shared):** `int` checked; `index_of` and `not` in the template schema (quiz.answer answer, tempting,
  also; chart.bars highlight; hero.hub signals.to); catalogue rebuilt.
- **Launcher:** stops on a rejected window or overage in subscription mode and clears a stale limit flag; per-model
  reconcile from `modelUsage`; reconcile rows are not calls; pinned model ids (`config.json` `model_ids`,
  `agents.model_id`); the report counts a resumed session once.
- Tests: 11 new (`tests/suites/shuttle_rails.py`, `tests/suites/run35_fixes.py`), each red on the code before it
  (`docs/research/shuttle/red_runs.txt`); the old reopen test replaced by `agents_shuttle_reopen_opens_only_what_changed`.

## 2026-10-08 - what the Relay comparison run found, fixed (D-143, L-324 to L-328 closed, L-329 to L-331)
- `runtime/style.js`: `S.c("none")` and `S.c("transparent")` are "no colour" (they raised unknown_token and painted the
  shape ink; a kit's `fill: "none"` drew solid ink, 36 of R-35's 70 final errors). `S.on` judges text on no fill against
  the field; `S.shade("none")` stays none.
- `runtime/core.js`: `Loom.lesson` wraps every kit part as it is assigned; an error or warning raised while a part draws
  carries `part`.
- `loom/agents/router.py`: a new owner `kit` (errors with `part`, and `fix_route: "kit"` reports) with its own fix
  request; every critic finding is routed, minors included, with its severity.
- `loom/agents/conductor.py`: `kit_fix` (the kit's author fixes its defects within its rounds); `repair` counts only
  owners that ran (a pass with every owner out of rounds ends the run at once instead of re-checking); scene fixes out
  of rounds are dropped before the pool starts (the cache-warming wait no longer sits 180 s on a skipped first job);
  the picture critic gets a second and last pass after its first findings (`CRITIC_PASSES = 2`).
- `loom/agents/cc_runner.py`: the reconcile row is the tokens the CLI's `modelUsage` counted beyond the rows, minus what
  the session already accounted (kept in the session file), priced from models.json; the CLI's dollar total (cumulative
  on a resume, and about 2x for Sonnet 5.5, which CLI 2.1.283 prices with `costBasis: "unknown"`) is used only when
  modelUsage is missing. The trace records `cost_basis`. A task answered by another model than its alias's id stops
  with `served_model_mismatch`.
- `loom/agents/config/models.json`: cc-opus calls `claude -p --model claude-opus-5-5` (cc-sonnet already the full name).
- `loom/agents/bench.py`: `agents doctor` prints the CLI model name each claude_code alias sends; `agents report` gives
  `usd_notional` and `usd_billed` beside `usd`.
- `loom/seed.py`, `loom/cli.py`: `py -m loom new ... --isolated` (project.json `isolated`): its design seed reads no
  other lesson and no other lesson reads it.
- `loom/shuttle/server.py`: the check's next-step text names kit defects (to the kit builder).
- `loom/agents/llm/mock_server.py`: a scripted reply may name its `model` (tests of the served-model guard).
- Tests: `tests/suites/relay_fixes.py` (10; nine red on the engine before, one already green from another session's
  L-321 change; record `docs/research/relay_fixes/red_runs.txt`); `relay_claude_code.py` expects cc-opus's full name.

## 2026-10-08 - Shuttle: a person can grant one more reopen
- `py -m loom shuttle grant-reopen <id> --by "<person>" --why "..." [--count 1]` lifts one lesson's reopen cap
  (`rails.grant_reopens`): only for a named person (an "agent ..." name is refused) with a reason; recorded in
  `logs/shuttle/state.json` (`grants`), the trace (`reopen_granted`) and the decision ledger (by kind person). What to
  reopen and how to fix it stay the lead's. Test `agents_shuttle_a_person_grants_one_more_reopen`.
- Why: the Opus run (`feedback-shuttle-opus`) stopped at P10 with 3 of 3 reopens used; b13's quiz props count from 1
  where the template counts from 0, a storyboard field. Kshitij granted one reopen in chat so the lead fixes it itself.

## 2026-10-08 - Relay: Opus on the storyboard only in one named profile, and Sonnet pinned to 5.5 (D-142)
- `loom/agents/llm/registry.py`: Opus on `storyboard` or `storyboard_outline` is still refused, unless the profile's
  `opus_storyboard` field names who allowed it and the decision.
- `loom/agents/config/profiles/claude-cc-opus-sb.json` (new): Opus 5.5 writes the storyboard outline and storyboard;
  Sonnet 5.5 writes every other role, the kit, scenes and clips included; Gemini 3.8 Flash reviews.
- `loom/agents/config/models.json`: `cc-sonnet` runs `claude -p --model claude-sonnet-5-5`; the `sonnet` alias served
  `claude-sonnet-5` in the first comparison attempt (`projects/feedback-relay-cmp`, stopped).
- Tests: `tests/suites/relay_claude_code.py` `agents_cc_opus_storyboard_only_when_a_profile_names_the_decision` (new);
  the two existing refusal tests pass unchanged. `docs/AGENTS_RUNBOOK.md` 12a.

## 2026-10-08 - Relay on the subscription through `claude -p` (D-141, L-316, L-317)
- New provider `claude_code` (models.json aliases `cc-opus`, `cc-sonnet`, `cc-haiku`): `loom/agents/cc_runner.py`
  runs one Relay role task as one `claude -p` session with the role's own system prompt, no built-in tools, no
  CLAUDE.md or memory, and only the role's tools from `loom/agents/cc_server.py` (the per-task MCP server over
  `tools.call`, with the runtime's guards and a cross-process lesson lock). `runtime.run_agent` sends cc-* models
  there; the conductor, gates, router and budgets are unchanged. Fixes resume the role's own session.
- Costs: notional list-price rows (`provider: claude_code`, `billed_usd: 0`) per model message plus a reconcile row;
  `--budget` counts billed money only.
- Profiles `claude-cc` (Opus plans, Sonnet storyboards and builds, Gemini 3.8 Flash checks) and `cc-mock` (tests).
  `registry.profile` refuses Opus on the storyboard by model id, so `cc-opus` is refused like `claude-opus-5-5`.
- `py -m loom agents doctor` checks the claude CLI and its claude.ai login (free).
- Tests: `tests/suites/relay_claude_code.py` (5; three drive the real CLI against the mock server).

## 2026-10-08 - Relay routes a device beat's defects to the storyboard (D-140)
- `loom/agents/router.py`: a defect in a `three.preset` beat goes to the storyboard (its params are the storyboard's;
  it fixes them with `patch_storyboard`), a throw inside the preset to the engine; before, every three beat's defect
  went to the engine and nobody fixed it. Test `agents_router_sends_a_device_beats_defects_to_the_storyboard`.
- Status: Relay has the toolbox menu, `use_tool`, the hand-over, `set_device` (tweak role), `get_example_scene("model:"|
  "preset:")`, capabilities, preset gating and now routing. Shuttle has none of the D-137 to D-140 tools yet beyond
  reading `get_skill_section("TOOLBOX", ...)` (not changed here, on request).

## 2026-10-08 - topic packs: 3D model packs and sets, moods, physics/brush/orb recipes, swappable devices (D-139, D-140, L-311 to L-315)
- **Brainstorm:** `docs/research/2026-10-08-topic-asset-needs.md` (AI for devs, ML, data centres, GenAI, AI for
  non-tech, emails, corporate learning: teaching moments, asset cards with accuracy notes, a ranked build list). Builder
  brief: `docs/research/2026-10-08-model-builder-brief.md`.
- **3D models (46 now, grouped by `pack` in each card):** new tablet; badge_door (with a mantrap pair), shredder;
  balance_scale; envelope gains a disguised attachment; server_rack v2 (door, blanking, airflow, recirculation, A/B
  feeds, top switch); tor_switch, rack_pdu, gpu_server (air or liquid), accelerator_chip, cdu, ups_cabinet,
  generator_set; embedding_space, chunk_cabinet, loss_landscape (descent computed from the surface's gradient),
  neural_lattice, transformer_stack (decoder-only), agent_sandbox; sets (`"set": true`) dc_aisle_pair, dc_hall,
  power_path, dc_security_layers, ci_conveyor, meeting_room, office_floor. Every sheet in
  `docs/assets/models3d/` re-rendered after the kit changes and looked at.
- **Kit (`runtime/three/kit3d.js`):** eight moods (`K.stage({mood})`: cold_aisle, hot_aisle, machine_night,
  latent_space, clean_bench, warm_office, incident, blueprint_iso), `flow` particles, `arrow3d`, `label` word plates,
  `temp`, `isDark`; screen kinds `diff`, `terminal`, `link_hover`, `prompt` (code-like kinds use the full width);
  diffuse materials keep a low specular; `sway` composes with `arrive` (L-311).
- **Devices are variables (D-140):** preset scenes `runtime/three/presets/` (card on line 1); `device_shot` (phone,
  tablet, laptop, monitor, desk_set; screen and later screens, banner, lid, chair and mood on spoken words);
  `three.preset` in the storyboard (no file, no clip worker; params gated by the preset's card); `py -m loom device
  <id> <beat> <device> [--screen] [--mood] [--list]` and the agents' `set_device` (tweak role) swap it, logged as
  `device_swap`; `get_example_scene("model:<id>" | "preset:<id>")`.
- **Recipes (D-139):** `runtime/recipes_physics.js` (sieve, sortIntoBins, contextWindow, inboxFlood, trainTestSplit,
  nextTokenDraw, biasedFunnel, priorityJar, redundancyTopple, puePour; each checks its stated outcome on the baked
  poses), `runtime/recipes_brush.js` (redFlags, markup, sketchSystem, wash), `runtime/recipes_orb.js` (toolLoop,
  retrieval, unsure, approval) and orb states `unsure`, `checking`, `paused` in `runtime/orbs.js`; `physics.js` gains
  `w.posesAt(p)`; lab scenes `scenes_examples/lab/recipe_*.js` with strips.
- **Tests:** `tests/suites/recipes_physics.py` (10), `recipes_brush_orb.py` (6), `devices_presets.py` (4).
- **Reel:** `docs/styles/demos/2026-10-08_topic_packs_reel.mp4` (97 s, 16 segments; spec
  `docs/styles/reels/topic_packs_2026-10-08.json`).
- Docs: TOOLBOX (menu, recipes, packs, moods, devices), SCENE_API, AGENTS_RUNBOOK section 14, storyboard role card,
  prompts (storyboard, scene_author), loom-scene-author and loom-director skills.

## 2026-10-08 - the toolbox loader and the 3D model library (D-137, D-138, L-305 to L-310)
- **Toolbox (D-137):** `docs/TOOLBOX.md` is the one page both pipelines read: a Menu (physics, brush, orb, three, skia:
  when to pick each, when not, cost) and one section per tool. `loom/toolbox.py` serves it. API path: the menu is in the
  cached prompt of the storyboard, scene, clip, kit and tweak roles; `use_tool(names)` returns sections (code, no
  model call; logged as `tool_load`); a storyboard scene's `tools` (schema field; the gate refuses unknown names) hands
  its worker the sections. Cowork: the storyboard and scenes stages read the page; prompts and role cards point to it;
  `get_skill_section("TOOLBOX", ...)` works for any agent. `LOOM_TOOLBOX=off` is the before arm of the A/B
  (`tools/toolbox_ab.py`; `projects/ab-mfa-explained-on|off` prepared, not run: no API access from this sandbox).
- **3D models (D-138):** 22 procedural, token-coloured, deterministic models in `assets/models3d/` (phone, laptop,
  monitor, desk_set, server_rack, padlock, key, security_key, envelope, document, folder, id_badge, shield, cloud,
  building, globe, gear, bar_chart, credit_card, coin_stack, clock, lightbulb), each with an `@model` card, keys and a
  turntable sheet in `docs/assets/models3d/`; toolkit `runtime/three/kit3d.js` (`X.kit`); loader `await X.model(id,
  opts)` in `runtime/three/render.mjs`; `py -m loom models [list|check|sheet]`; capabilities list them; examples
  `scenes_examples/three/models_mfa.js` and `model_turntable.js`; reel `docs/styles/demos/2026-10-08_models3d_reel.mp4`
  (52 s, 10 segments, spec `docs/styles/reels/models3d_2026-10-08.json`).
- **Three.js renderer:** clips are stored under the toolkit and model library hash; resumable frames
  (`LOOM_FRAMES_DIR`, encoded once all exist; `LOOM_FRAMES_ROOT` for a fast scratch disk; the reel uses it too); a
  scene that throws while building fails at once instead of after 120 s.
- Tests: `tests/suites/toolbox_models.py` (8, each with a control). Docs: SCENE_API, AGENTS_RUNBOOK section 13,
  loom-scene-author and loom-director skills, prompts (storyboard, scene_author), role cards (storyboard, scene, clip,
  kit), CLAUDE.md (the sheets are generated).

## 2026-10-08 - lab_brush's watercolour fill paints the same pixels for one seed (L-304)
- `runtime/brush.js`: `fixFillShader`, called on the shared canvas before p5.brush loads, asks for the WebGL2 context
  with p5.brush's own attributes and patches its `shaderSource`: in the composite shader with `u_mask` and
  dFdx/dFdy, the early return for a pixel with no mask moves after the fill's edge blur, so the derivatives run in
  uniform control flow. Before, they were undefined on the wash's edge and one seed painted 2 to 7 different fills
  (on SwiftShader, by thread timing). A p5.brush without the two anchors reports `brush_shader_changed`. Not a seed
  problem: p5.brush's seed() and noiseSeed() already covered every stream the fill reads.
- Tests: `tests/suites/primitives_libraries.py` `primitive_brush_a_fill_bakes_the_same_pixels_every_time` (new, 8
  bakes of one fill in one page after other layers; red on the runtime before:
  `docs/research/determinism/red_brush_fill_shader.txt`). `docs/context/STATE.md`: 293 tests.

## 2026-10-08 - the mock LLM records a request before its reply (L-303)
- `loom/agents/llm/mock_server.py`: `_Handler._dispatch` records the request (`delivered` None) before the scripted
  delay and the send; the new `_State.mark_delivered` sets `delivered` under the state lock once the send ends. Before,
  the record came after the reply was written, so under load a client could read `MockLLM.requests` or `/mock/requests`
  without its own request (`mock_llm_match_filters_and_unmatched_fallback` failed so under `--browser`).
- Tests: `tests/suites/agents_mock_llm.py` `mock_llm_request_recorded_before_its_reply` (new, red on the old ordering:
  `docs/research/mock_llm/red_record_before_reply.txt`); `mock_llm_client_disconnect_is_quiet` (L-272) waits for
  `delivered` to be set, not only for the record, and still expects False. `docs/context/STATE.md`: 292 tests.

## 2026-10-08 - scale origins no longer depend on seek order or on GSAP's ticker (D-134, D-136, L-289, L-290, L-302)
- `runtime/boot.js`, `runtime/trailer.js`: the timelines have `defaults: { lazy: false }`, so the build no longer
  depends on whether a rAF came before it (a rig's start pose and the figure check did).
- `runtime/core.js`: `Loom.tween` records every tween with a scale, rotation, skew or origin; `Loom.settleOrigins`
  (called by boot after the clocks and before the shader layers, and by the trailer) enters each just after its own
  start, in time order, then returns to 0 from before the start. A pop or stamp now draws the same frames whatever was
  seeked first. Boot on a 474 s lesson: about 1.4 s more.
- Tests: `tests/suites/runtime_determinism.py` (2, both red on the runtime before). The golden byte test leaves out
  GSAP's inline `transform-origin: 0px 0px` too; `style_system_golden.json` re-recorded from the same pre-WS6 runtime.
  `docs/SCENE_API.md` says what `transformOrigin` now means. Record: `docs/research/determinism/red_runtime_determinism.txt`.

## 2026-10-08 - Shuttle: one lead agent on rails, built beside Relay (D-135, L-291 to L-301)
- **What:** `loom/shuttle/` runs a lesson with ONE lead agent in Claude Code headless (`claude -p`) that works only
  through loom-mcp (`loom/shuttle/server.py`, MCP over stdio, 49 tools reusing `loom/agents/tools.py`, `flow`, `qa`,
  `story`, `lab`). The rails (`loom/shuttle/rails.py`, state in `logs/shuttle/state.json`): phases P1 to P11 accepted by
  the engine's own gates; approvals facts, plan and final; `reopen` with stale marks, kept versions, voided approvals
  and a cap of 3; a budget per lesson (USD, tokens or calls), phase and sub-agent; owner tokens from `delegate` for six
  sub-agents defined once in `shuttle/agents/*.md` (fact-finder, kit-builder, scene-author, clip-author, fixer,
  researcher) and emitted by `py -m loom shuttle agents --emit claude|sdk` (generated: `.claude/agents/shuttle-*.md`,
  `shuttle/build/agents.json`). Playbook: `skills/loom/shuttle-director`. Hook: `loom/shuttle/hook.py` (no writes into
  lessons or generated files, no approvals or forced renders by an agent, a sub-agent's write needs its token).
- **CLI:** `py -m loom shuttle run|resume|status|report|agents` (`--mode subscription|api`, `--lead sonnet|opus`,
  `--budget`, `--budget-tokens`, `--budget-calls`, `--approve-as`, `--until`, `--runner cli|sdk`); exit codes as Relay.
  `py -m loom approve <id> facts|plan|final --notes "..."` (facts is knowledge's alias; final is new; every approval writes
  `qa/approvals/<kind>.json` with its time and notes).
- **New in the engine:** the kit preview (`loom/shuttle/kitpreview.py`: every declared part drawn in a grid and stepped
  through its states by the lab; `submit_kit` in Shuttle accepts only a previewed source); a lenient compose (an agent's
  snapshot) skips Manim, Skia and Three files not written yet (`render_all(skip_missing=)`), which also fixes Relay's
  parallel clip and scene workers; the mock LLM answers Anthropic `stream=true` as server-sent events, accepts Claude
  Code's system-role messages and prices an image like the API (`anthropic_stream=True`, `--anthropic-stream`).
- **Platform (STEP 1, verified):** `docs/research/2026-10-08-shuttle-platform.md`. API mode runs the same CLI with the key
  (the Python Agent SDK drives that binary; `--runner sdk` is written and unverified, the SDK is not installed).
- **Tests:** `tests/suites/shuttle_rails.py` (15), each run red on its rail mutated out
  (`docs/research/shuttle/red_runs.txt`). **S0:** `tools/shuttle_s0.py` drives the real launcher and `claude -p` with a
  scripted model on the mock (`docs/research/shuttle/s0/`). Report: `docs/research/2026-10-08-shuttle-build-report.md`.

## 2026-10-08 - the places' set decorations follow the pack (D-133, L-286 to L-288)
- `runtime/places.js` reads `materials.window_lights`, `vessel`, `safety_line`, and the lists `cells`, `leds`,
  `cables`, `chart`, each falling back to the token it drew before (untouched packs are byte-identical; a scene's
  `o.vessel` still wins). `S.material` and `S.materialList` doc comments name them.
- The five guided packs set those keys and more `materials.objects` kinds from their guide's section 2, only where the
  fallback breaks a rule there; the reason is in each pack's `materials._decor_note` and the guide's section 17.
- Test: `primitive_style_every_role_and_material_site_follows_the_pack` covers 35 sites (seven place sites, red on the
  old runtime, and every object kind that reads its tone). Record: `docs/research/style-system/red_L276_set_decor.txt`.
  Lab scene `lab_set_decor` (every place, night windows, every object kind); strips in `docs/styles/demos/guides/<id>/`.

## 2026-10-08 - the plan checkpoint is off by default (D-131)
- Kshitij: no stop between the storyboard and the scenes. `agents run` no longer waits for `approve <id> plan`;
  `--plan-gate` opts in (with `--approve-plan-as`), and `--no-plan-gate` is gone. Supersedes that part of the entry
  below. Test: `agents_plan_checkpoint_is_off_unless_asked`. Runbook section 11 updated.

## 2026-10-08 - Relay improvements (plan checkpoint, lesson kit, real model in the ledger, cache misses) and three library wrappers (D-129, D-130, L-282 to L-284)
- Names: the API pipeline is **Relay**; **Shuttle** (one lead agent on rails) is designed with a Claude Code build prompt
  in `docs/strategy/2026-10-08-shuttle-pipeline.md`. Study: `docs/strategy/2026-10-08-pipeline-architecture.md`.
- Relay: `agents run` stops for `py -m loom approve <id> plan` before the kit and scenes (`--approve-plan-as`,
  `--no-plan-gate`); storyboard `kit.parts` and a kit worker writing `scenes/_kit.js` (role card `kit.md`, tool
  `submit_kit`, gate `loom/checks/kit.py`, compose loads the kit first, scene tasks carry it); decision records name the
  model that ran (`ledger.RUNNING`); cache misses counted per task. Tests: `tests/suites/relay_improvements.py` (7).
- Libraries: `Loom.physics` (Matter.js 0.20, baked), `Loom.brush` (p5.brush 2.2.3 standalone, painted once),
  `Loom.orb` (thinking-orbs 0.3.2 engine); loaded only when used (`compose.VENDOR`; `node tools/vendor_js.mjs` builds
  the orb bundle); lab scenes `lab_physics`, `lab_brush`, `lab_orb`; reel `docs/styles/demos/2026-10-08_libraries_reel.mp4`
  and per-library MP4s in `docs/styles/demos/libraries/`; SCENE_API section, scene-author skill, storyboard card rows,
  capabilities regenerated. Tests: `tests/suites/primitives_libraries.py` (4). Verdicts on PixiJS, Anime.js and GSAP
  plugins: `docs/research/2026-10-08-motion-libraries.md`.
- npm: matter-js, p5.brush, thinking-orbs added to package.json (run `npm install` on the PC).

## 2026-10-08 - the style system proof's follow-ups (L-279 to L-281, L-285)
- Found after the entry below, each fixed with a test red before the fix: `roles.person_cloth` is read by slot (a
  token or a list), so a dialogue's two people stay told apart (L-279); the B2 wait applies only when the incoming beat
  holds nothing (the claude fork's b01 crowd stayed 4 s into b02, L-280); `tools/frame_review.py` frames stand at
  their labels (they were a second late, L-285); blank beats have their own ledger kind.
- Recorded for Kshitij: in story-cartoon a template beat shows no vignette (its backplate covers the layer under the
  world), and the film audit had counted the vignette as ink (L-281).
- The claude-balanced fork re-rendered on the final code: `qa/post_style_review.md`. Totals: 238 passed, 0 failed, 27
  named skips without the browser; 254 passed, 1 failed (another session's new brush test), 9 skipped with it.

## 2026-10-08 - the style system (WS6) and the bench leftovers B1 to B7 (D-128, L-269 to L-278)
- Report, per item with the fix, its test, before and after, and what is still unverified:
  `docs/research/2026-10-08-style-system-report.md`. Red runs: `docs/research/style-system/`.
- Pack data the runtime now reads (every reader falls back to its old token, so an untouched pack draws the same
  bytes): `materials` (wood, chair, screen, monitor, books, plant, pot, objects), `roles` (13 template and UI roles,
  `turn_card`, `avatar`), `fx.spotlight`, `fx.vignette_under`, `characters.bottom` and `white`, `shape.gloss_toward`
  and `contact_shadow`, `templates["document.page"].variant`, `guide`. The five packs with guides set them from their
  guides' rules; the values a guide marks as Kshitij's decision are unchanged.
- Runtime fixes from the guides' section 15: drawn weights clamp to the loaded faces and words are measured at the
  weight they are drawn in; `m.draw` draws outlines first, keeps each path's opacity and a dashed line's dashes, and
  takes `order` and `delays`; the travel drive key; sketch arrows (open heads) and rounded rects; the glow disc as one
  gradient and the glow defaults in the field family; depth glow and cone take `z` with unique ids; the counter keeps
  tabular digits and the pack's count duration; the dip line defaults to accent; the narration card's words read on
  any ground.
- Tooling: `loom lab --file <scene> --out <dir>` (the `@lab` cues map, then its words); `--out` on every lab path;
  the lab draws the "under" vignette under the drawing; `tools/skill_sync.py` (drift report and `.skill` packages);
  `context_check` compares each guide's palette with its pack and the account skills when `LOOM_ACCOUNT_SKILLS` is set.
- Pipeline: the storyboard and scene authors read the style's guide (task files, API agents' prefix,
  `get_style_pack.guide_text`, the conductor's style summary).
- B1 a kept template part is veiled under the next template; B2 a continue join's exit waits for the incoming first
  reveal; B3 every cover join hides the incoming beat until its middle (tested for all 10 kinds) and words with no
  entrance are named; B4 the probe counts a beat's own elements in the frame (`blank beat`); B5 the film audit follows
  keep in any case and `ctx.held` (element records carry `heldBy`); B6 the e2kit licence entry, e2gen lab-only, the
  disconnect test's race, environment-only tests as named skips; B7 the skill sync.
- Proof: strips per style with a README and the section 13 checklist (`docs/styles/demos/guides/<id>/`), one example
  per style encoded at crf 18 and judged; the guides gained section 16; the M and L requests went to
  `docs/styles/WALLS_AND_NEEDS.md`. Examples fixed on their strips: story-cartoon nameplates and crop, the whiteboard
  question's spill; the corporate and whiteboard examples gained `@lab` word timings.
- Tests: `tests/suites/style_system.py` (17), `tests/suites/checks_skill_sync.py` (2), and B tests in the film
  suites; every one run on the old code first.

## 2026-10-08 - pipeline architecture study (design only; L-268)
- `docs/strategy/2026-10-08-pipeline-architecture.md`: internal cost audit, three web research passes, an
  independent critique, and the recommendation: keep the pipeline's shape; add a lesson kit stage, a typed and compiled
  `design` block, code-first verification with automatic fixes, and an approval checkpoint before beats are built;
  use the Claude Code subscription for Kshitij's own lessons. Experiments E0 to E5 decide each step. Nothing built.
- Found: API-path decision records name the wrong model (`ledger.actor()`), L-268.

## 2026-10-07 - bench fixes: RC1 to RC20 and the API path's reach, each with a test red on the old code (D-124 to D-127, L-252 to L-266)
- Report with fix locations, tests and before/after numbers per bench: `docs/research/2026-10-07-bench-fix-report.md`.
  Raw outputs, red runs, reverted files and baselines: `docs/research/bench-fix/`.
- Runtime: element life (`Wd.planLife`: every element switched off outside its beats; `lifeT` in the report),
  per-group backplate blur and the full veil over kept words, a thrown scene draws its narration, `ctx.held` case-
  insensitive, `ctx.el` takes an element as parent, followers leave with their leader, `m.draw` hides filled heads,
  frame-layout beats ignore `shot.focus`/`zoom` (D-125), nested stations are one 1920x1080 frame, fx moments placed
  at draw time, `figure_cropped`. Found by the proof on the real benches (L-266): the thrown-scene card is laid out
  inside the beat's focus; `ctx.held` keeps a case-only match over two hops; `m.travel` given an array or nothing is a
  `motion_target` error at build (it crashed in a frame callback); words under a later backplate carry
  `data-layout-allow-overlap` while covered (the HyperFrames audit read them as overlapping).
- Templates: the lead in compare.two, document.page, process.flow, timeline, heroes and redtee; each cue asked once;
  `valence`, `verdict` and `stance` on compare.two (`tone` deprecated), `stance` on document.page; `{"empty": true}`
  slots; document.page lines are followers; the avatar's props and `card`; a cast member drawn as the cast says.
- Checks: the probe measures own elements and words off frame, figure crops and other beats' pixels (element
  ownership, clip-path aware, settled before every shot, full-resolution confirm); film checks for blurred beats,
  foreign pixels and element records; zero denominators are red; finished lessons ratcheted
  (`loom/checks/film_baseline.json`, `film_offframe_baseline.json`); the caption pill lint; the lesson vocabulary for
  bespoke scenes (word forms and day names matched).
- Gates: the requested length stated, sent and held (script and narration 1.3x, about 8 beats a minute; the estimate
  now within 5 % of the narrated benches); framing, keep, variety, avatar props, placeholders, `story.cast` with one
  look per person (D-126); `--keep` and hand `mark_done` logged as overrides. A held name that differs only in case
  is a warning in the scenes gate, as at runtime.
- Render (D-124): `--force` needs `--reason`, the checked build, and no thrown scene; stale segments dropped;
  a verification over 10 % different or of zero frames fails.
- Agents (D-127): scene workers get held elements, neighbours and cast; the critic sees every sheet with narration
  and props and runs on a failed check; the router knows the new defects; clip workers for manim, skia and three;
  `capabilities` generated from `// @capability` lines (`runtime/capabilities.md`); `get_beat` and examples fixed; the
  storyboard looks at its animatic once; the mix is a ceiling in agents runs; role cards for storyboard, scene, clip
  and critic rewritten within budget.
- Tools: `tools/bench_proof.py`, `tools/frame_review.py`, `tools/node/fx_moments.mjs`, `tools/lesson_sandbox.py`,
  `tools/length_calibration.py`, `tools/node/foreign_view.mjs`, `tools/caption_contrast.py`; `tools/film_audit.py`
  reads folders and new measures; `tools/context_check.py` reads the suite prefixes from the runner.
- Tests: 224 (four new suites: runtime, templates, checks and pipeline film defects); every new test red on the
  pre-session code.
- Docs: SCENE_API (element life and framing), STORYBOARD_GUIDE (what the gate refuses), AGENTS_RUNBOOK section 10,
  STATE.
- Proof (no paid calls): five bench forks `projects/bench-20261006-151439-*-fix1007`; self-blur, foreign pixels and
  off-screen spotlights went to 0 on all five; the openai and claude forks rendered and every 2 s frame looked at
  (`qa/post_fix_review.md`); the old storyboards are refused by the new gates.

## 2026-10-07 - five style guides, pack polish, example scenes; bench post-mortem; fix prompts (D-123, L-249 to L-251)
- Post-mortem of the five bench videos: `docs/research/2026-10-07-bench-postmortem.md` (ratings, RC1 to RC20, and
  section M: why the API pipeline used no Manim, Skia or Three).
- Prompts for Claude Code: `docs/strategy/2026-10-07-fix-prompt.md` (workstreams 1 to 6, proof without paid calls)
  and `docs/strategy/2026-10-07-claude-code-provider-run-prompt.md` (claude_code provider; three lessons: Claude only
  with Opus planning, mixed, Gemini only).
- Style guides (D-123): `docs/styles/guides/README.md` plus corporate-clean, story-cartoon, glow-flat,
  cinematic-noir and whiteboard, each written, then reviewed by a second agent against the code; ten example scenes
  `scenes_examples/style_<id>_*.js`.
- Pack changes: corporate-clean (caption_active #FCD34D, accent3 slate #64748B, accent4/pos #0F766E, people in
  ink, blue-only mesh at 0.2); story-cartoon (neg #9B2D4F, caption_active #E9B65C, cloth and cloth2 tokens, extras
  people); glow-flat (line #8E85D8, people in muted, warm hair, vignette 0.35, nebula without accent3, tone
  reference from the measured Kurzgesagt set); cinematic-noir (vignette 0.35, muted #9AA4B6, line #677286);
  whiteboard (marker colours deepened to 4.5:1, single-stroke sketch, stroke 3.6, radius 6, no overshoot,
  caption_active #DA8D6D). All 13 packs pass the lint, including the caption pill check.
- Skills: loom-scene-author reads the style's guide first; loom-style-pack requires a guide per pack.
- Found: agents of a cut-off session landed fix work unlogged (L-250); the fix prompt audits it.

## 2026-10-07 - characters in every style, and world packs (D-122, L-248)
- Principle recorded (CLAUDE.md standing direction, D-122): styles are never compared with each other; characters
  are needed in every style; tests compare versions within one style. D-121's style ranking withdrawn.
- New skill `skills/lnd/lnd-character-design` (any living character, any style; brief, construction, faces,
  non-human anatomy, the rules of 11 style families, variations, rig readiness, who draws, reject list); added to
  the storyboard stage's reading list; saved to the account. Scene role card and loom-scene-author: living
  characters come from kits by id, a missing one is an asset request.
- `docs/assets/CHARACTER_PROMPTS.md`: Prompt 0+ (texture, glow and 2.5D layers; animal and object slot
  families), 11 style blocks, 15 character blocks, 10 deliverable blocks, 13 assembled prompts.
- World packs: 18 worlds in `packs/worlds/*.json` (scenes, cast, core, common and optional assets);
  `docs/assets/WORLD_PACKS.md` generated by `tools/world_packs.py` with a Claude Design prompt per world;
  `tools/context_check.py` fails when the doc is out of date with the JSON.

## 2026-10-07 - E2 rated: findings and D-121 (L-247)
- `docs/research/golden/2026-10-07-e2-findings.md`; stack review, claims ledger and STATE revised.

## 2026-10-07 - runtime: one broken scene can no longer stop a render (L-246)
- `runtime/core.js`: every `Loom.tween` onUpdate and every `Loom.drive` callback runs guarded; a throw is reported
  once as `tween_threw` (with its beat) and that callback is switched off; the rest of the film renders.
- Test `primitive_a_throwing_frame_callback_cannot_stop_a_render` (fails with the guard removed).

## 2026-10-07 - E2 bake-off built; claims ledger; golden sets (L-245)
- `tools/e2_bakeoff/`: one 20 s beat, four art sources, one shared choreography (`make_scenes.py` writes
  `scenes_examples/lab/e2_{a,b,c,d}.js`); `generate.py` (variant C, OpenAI images, run on the PC, asks before
  spending); `prepare_rating.py` (frames plus six E1 anchors into `docs/research/golden/sets/e2/set.json`).
- `assets/vendor/e2kit/`: the kit drawn by Claude (CC0); `e2gen` registered for the generated layers (not cleared for
  client use).
- `py -m loom golden build|serve|report|export --set <name>`: later rating sets in their own folder.
- `docs/research/2026-10-07-claims-ledger.md`; `docs/research/golden/labels_figurative.json` (the E1 split's labels,
  saved at last).

## 2026-10-07 - agents: the same work for less (cost plan, L-244)
- Outline and storyboard share their first system block (the 180 KB reading) and their advertised tools, with an
  Anthropic breakpoint after the reading: the storyboard reads what the outline wrote instead of writing it again.
- 5-minute cache by default (the 1-hour one cost 2x and only paid off when a fix arrived late); a fix for a session
  whose cache has expired goes to a new worker on the small role card instead of re-reading the whole history.
- `submit_scene` without `source` submits the draft the last `lab_snapshot` wrote (the file is not output twice).
- Measured on bench 20261007-003835 (smart-mix planning, Anthropic $1.24): cache writes $0.80, output $0.39 (thinking
  about half of it), cache reads $0.03. Projection for the same planning after these changes: about $0.89 (estimate).

## 2026-10-07 - agents: an empty account stops the run cleanly; no unchecked facts; no save collisions (L-243)
- `BillingError` (Anthropic "credit balance is too low", OpenAI `insufficient_quota`, billing wording): never retried;
  the run stops with exit 5 and says to top up and rerun the same command; the bench skips later profiles that need
  that provider instead of starting them.
- Knowledge: a skeptic that does not finish leaves the sheet unapproved (the bench had approved one unchecked).
- `write_json`: one temporary file per writer and a short retry on a Windows rename refusal; the conductor's log save
  is locked (parallel scene workers crashed the bench with WinError 32).

## 2026-10-07 - agents: three role-fitted profiles and `bench --critic` (D-120)
- `smart-mix` (Sol plans; Sonnet writes script, storyboard and scenes; Gemini Flash checks facts and pictures),
  `claude-core` (its control: Sonnet everywhere, Gemini Flash checks), `gemini-director` (Gemini 3.1 Pro plans and
  storyboards; Sonnet writes script and scenes; Sol facts; Haiku critic). Reasons per role in each description.
- `py -m loom agents bench ... --critic` runs the picture critic in a bench (it was always off there).

## 2026-10-07 - agents: no cap cuts a working agent short (L-242)
- `loom/agents/runtime.py`: no per-task dollar cap (only the run's `--budget`); output up to each model's own maximum
  (64k tokens for Claude, Sol and Gemini; was 16k, 32k for the storyboard, 8k for the critic); turns, tool calls and
  wall time raised (storyboard 40 turns, 150 calls; scenes 30 and 80; 2 hours per task); fix sessions 16 turns.
- The window is managed, not refused: each call gets the output room the model's context has left (at least 8k),
  old tool results are compacted only past 75 % of the window, and only a really full window stops a task.
- Budget guard: last turn's prompt priced as a cache read, the rest as a fresh write; Gemini 3.1 Pro's price above
  200k tokens and Anthropic's 1-hour cache write (2x input) are in `models.json`.
- Inputs arrive whole: task-message parts no longer cut at 20k or 60k characters, tool results at 40k (was 12k).
- HTTP timeout 30 minutes per call (a 64k-token answer needs about 18).

## 2026-10-06 - agents: pipeline parity with Cowork, and defects sent back to their owners (D-119, L-241)
- `--context parity|cards` on `agents run` and `agents bench`: parity puts each stage's full Cowork reading list into
  the role's cached prefix (`loom/agents/runtime.py` `role_system`).
- Anthropic: a moving cache breakpoint on the newest turn; 1-hour cache for storyboard, script and scene sessions,
  falling back once to 5 minutes if the API refuses `ttl`; 1-hour writes priced at 2x input.
- Sessions saved per agent (`logs/sessions/`); `run_role(fix=...)` resumes the owner's own conversation.
- `loom/agents/router.py`: check and critic defects routed to storyboard, scene worker, script or engine
  (`qa/defects.json`); `Conductor.run` repairs a failed check and re-runs the stale code stages (2 rounds per owner,
  `--repair-rounds`). Stale or regated agent stages are re-checked and fixed by their author, not rewritten.
- New tools `patch_storyboard`, `patch_script` (only the changed items; a refused patch restores the accepted file).
- Scene workers: `lab_snapshot(times, source)` drafts, renders and returns this beat's runtime errors; one sheet per
  worker; `submit_scene` refuses until a snapshot was taken; unaccepted drafts are removed; scene specs hashed so a
  changed spec reopens only that worker; the first worker warms the cache before the others start.
- Storyboard gate: a template beat may be drawn with `upgrade_reason` (25 % cap); schema field added.
- `runtime/core.js`: runtime errors raised while a scene builds carry its beat.
- Role cards: `run_gate()` (never a tool) removed; FIX REQUEST and `report_finding(fix_route)` rules; patches.
- Bench report states what was held equal (style, persona, mix, length, context).
- Tests: `tests/suites/agents_parity.py` (11), each shown to fail on a mutation of the code it guards.

## 2026-10-06 - agents: scene workers get 24 turns; bench pedagogy states restored (L-239)
- `loom/agents/runtime.py`: `ROLE_LIMITS["scene"]["turns"]` 16 to 24.
- bench-20261006-151439 claude-balanced, gemini-balanced, budget: `pedagogy` marked done again (artifact unchanged).

## 2026-10-06 - agents: scene snapshots work while other scenes are unwritten; `--keep` (L-238)
- `lab_snapshot` composes leniently and without the mix; `compose(strict=False)` prints one preview line.
- `loom agents run --keep`: resume without re-checking accepted stages against newer gates.

## 2026-10-06 - agents: resumed runs re-check accepted stages; small tool results are never compacted (L-237)

## 2026-10-06 - the requested length is enforced; agents can redo from a stage (L-236)
- `loom/checks/gates.py`: pedagogy target within 0.75 to 1.3 of the request; script errors past 1.5 of the request.
- `loom/agents/conductor.py`: pedagogy and script tasks state the requested length; `--redo <stage>` on `agents run`;
  a kept outline must be newer than the script.

## 2026-10-06 - agents: a resumed storyboard keeps its accepted outline
- `loom/agents/conductor.py`: when `plan/outline.json` passes its contract and checks, pass 1 is not run again.

## 2026-10-06 - agents: limits sized for real storyboards (L-235)
- `loom/agents/runtime.py`: storyboard 100 tool calls, outline 80; a submission is always judged; a repeat read is
  answered with a note (stop at six), a tool-call limit tells the model to write before it stops.

## 2026-10-06 - render: fall back to screenshot capture when fast capture refuses a flat frame (L-234)
- `loom/render.py`: one automatic re-render with `PRODUCER_EXPERIMENTAL_FAST_CAPTURE=false` after "drawElement capture
  failed"; `LOOM_SAFE_CAPTURE=1` uses screenshot capture from the start.

## 2026-10-06 - mfa-story: last check error (the small phone's code fitted its card with no inset; now lead 42 px with a 16 px inset)


## 2026-10-06 - mfa-story: the 10 check errors fixed
- Small text on the small phones and the b07 screen, text-over-text from stacked page states, the b08 page under the
  message and the b09 card over the screens; the value script set to light. Details in `projects/mfa-story/RUN_LOG.md`.

## 2026-10-06 - agents: the topic reaches the agents; OpenAI calls stream (L-232, L-233)
- `loom/agents/conductor.py`: every task message's REQUEST carries the project's topic and mode. Before this, no agent
  saw the topic and the bench lessons were on invented topics.
- `loom/agents/llm/openai_responses.py`: streamed Responses calls (`read_sse`); a cut stream is a retryable 502.
- `loom/agents/runtime.py`: one progress line per agent turn.
- Tests: `agents_every_planning_role_is_told_the_topic`; stream cases added to `agents_bench_fixes_send_what_each_model_accepts`.

## 2026-10-06 - MFA rebuilt as a story; template backplates blur; the agents meet the real providers (D-117, D-118)
- New lesson `projects/mfa-story` (corporate-clean): Maya and a thief at another desk, real sign-in pages and a phone
  in a split frame, 20 bespoke scenes and 1 template; the drawing library `Loom.mfa` sits at the top of b01.js.
  Composed with 0 runtime errors; frames at every beat looked at in the sandbox; not rendered here (L-224).
- `runtime/world.js`: a backplated template blurs the picture under it (L-229); `loom/compose.py` + storyboard schema:
  a lesson's `ambient` overrides its pack's (the MFA lesson turns the dot grid off).
- `quick-question-cost`: b12 their-work page no longer overlaps the moved morning grid; b14 batch ticks replace the
  question marks instead of sitting on the label.
- Agents: `openai_responses.py` (GPT-6.x), Haiku budgeted thinking, write-now nudge and forced terminal tool, topic
  briefs without the source search; profiles `claude-openai-value` and `two-key-budget`; `tools/agents_combos.sh` and
  `.ps1` (one video per combination); tests for the chain to compose and for each provider fix.

## 2026-10-06 - mfa-explained review: two engine bugs fixed, why the lesson did not explain (L-225 to L-227)
- `runtime/motion.js` (`m.draw`): an undrawn round-capped line no longer paints a dot at one end (the "random dots").
  Same fix in `runtime/blueprints/heroes.js`, `runtime/templates/_redtee.js` and the magnifier's leader retract.
- `runtime/magnify.js`: an exit scheduled before the lens lands warns `magnify_exit_early` and is moved after it (the
  lens that stayed open from 62 s to the end of mfa-explained).
- Tests: `primitive_draw_undrawn_stroke_paints_nothing`, `primitive_magnify_exit_before_landing_is_clamped`.
- `projects/mfa-explained/REVIEW_2026-10-06.md`: evidence, causes, and a proposed rebuild. Rubric section 8 added.
- The other two showcase lessons need a recompose to pick up the draw fix.

## 2026-10-07 - all three showcase lessons finished and ready to render (D-116)
- `quick-question-cost`: b16 written (the opening page returns with focus time on the strip); drafts reviewed; b06
  syntax fix, b11 badges at the label role; 0 runtime errors; overview sheet read.
- `groupthink-trap`: b04 to b07, b20, b21 written; one shared room drawing (`Loom.gt` in b01) so every room beat
  matches; later room beats hidden until their own start; every runtime error fixed; overview sheet read.
- `mfa-explained`: lock plates widened; 0 runtime errors.
- Engine: `runtime/world.js` gives a template the backplate veil when the template before it drew into the picture
  and this one keeps it; `runtime/kit.js` ignores a paper-texture group as a text container; the document template's
  header band is drawn crisp so outlining packs do not strike through its title.
- Not run here: `check` (too slow for this sandbox) and render (L-224). Render on the PC.

## 2026-10-06 - overnight showcase: three lessons planned, scenes interrupted by the spend limit (D-116)
- New projects `groupthink-trap` (story-cartoon, TED-Ed style), `quick-question-cost` (editorial-paper) and
  `mfa-explained` (dark-technical): brief, knowledge (approved unattended, recorded as such), pedagogy, persona,
  script, design seed and storyboard all accepted; narration synthesised (about 3:10 each).
- The bespoke scenes were being written by seven parallel authors when the org's monthly spend limit stopped every
  sub-agent. Their unverified drafts are kept in `projects/<id>/scenes_draft/<group>/`; no lesson is composed or rendered.
- `loom/story.py`: the animatic no longer crashes before narration exists (read_json(p, None) raised; L-171 trap).
- `mfa-explained`: scenes completed (b06, b07, b08 by the orchestrator), composed and checked; render left to the PC.
- `runtime/slot.js`: a relabel in a later beat is judged against that beat's end (L-223).
- `docs/rubrics/LESSON_CRAFT_RUBRIC.md`: the craft rubric distilled from the night's approach.

## 2026-10-06 - Loom outside Cowork: the agent architecture (D-115)
- `loom/agents/`: provider adapters for Anthropic Messages, OpenAI Chat Completions and Gemini generateContent
  (standard library only); a guarded tool loop (`runtime.py`); typed, role-scoped tools with submit tools that gate
  (`tools.py`); contracts (`contracts/*.schema.json`); a budget guard that refuses a call before sending
  (`budget.py`); the conductor over the stage graph (`conductor.py`); bench, doctor and report (`bench.py`); role
  cards (`roles/`); models and five routing profiles (`config/`); a mock server that speaks all three protocols.
- CLI: `py -m loom agents run|bench|doctor|report|profiles`. Runbook: `docs/AGENTS_RUNBOOK.md`; design:
  `docs/strategy/2026-10-06-agent-architecture.md`.
- Guards proven on mocks: allow-lists, schema-checked arguments, loop detection, repair limits, budget refusal, no
  self-approved knowledge, scene workers write only their own file, keys never logged. No real provider call yet.

## 2026-10-06 - the TED-Ed primitives (D-114)
- `runtime/morph.js` (path morph, morph chains, fill join), `stepped.js` (stepped time, line boil), `slot.js`
  (swap-in-place), `magnify.js` (lens and cutaway), `data.js` (stamp, pile, flood), `material.js` (torn, page,
  scroll, motif, handoff, fill joins), `footage.js` (spike), `hands.js` (kit, placeholder art only).
- Wiring: world.js draws material shading layers; compose embeds hand families and footage clips; storyboard schema
  gains `footage` and the new join kinds; lab copies media and embeds hands; `loom/hands_assets.py` is the intake.
- Tests now load `tests/suites/*.py` (primitives, mock LLM, agents); 143 tests. Docs: `docs/primitives/`,
  SCENE_API "Primitives from the TED-Ed study", STORYBOARD_GUIDE joins; skills updated where they said "coming".

## 2026-10-06 - vision lab v2: the next pod run cannot fail the way the last one did (D-113)
- `tools/vision_lab/vl.py`: admission over the KV cache, pre-send context refusal, per-call timeouts, thinking-cap
  retry, no identical resend after a timeout, phase lock, thinking text and `raw/calls.jsonl` kept, usage accumulated,
  `server_facts()` from `server.log`, measures v2, true previous shot in re-runs, calibration scorer v2 (time and
  place, label agreement apart, skipped and NOT RUN gates), stale style guide refused and kept out of the bundle,
  `raw_<run>.zip`, commands `preflight`, `remeasure`, `distill-prep`; ingest prints skipped gates as skipped.
- `run_full.sh` rewritten (preflight first, one heavy step at a time, per-step summary, exit code); `config.yaml`
  gains server budgets, contexts, calibration matching and `skip_gates`; `mock_server.py` queues like vLLM, delays,
  thinks to the cap, counts requests.
- Skills `10_shot_annotator.md` (measured facts, provenance) and `40_film_judge.md` (defects are not taste).
- Tests: 4 new vision-lab tests, e2e extended (preflight pass and fail, remeasure, calibrate steps, distill-prep,
  stale guide, raw zip). README and RUNBOOK_GITBASH updated. L-214 to L-217.

## 2026-10-06 - TED-Ed learnings into Loom by look family (D-112)
- Packs: `look_family` on all 13; `tone_reference` on the illustrated six; `pace.sparse_edges` on dark-field packs.
  `style_lint` checks both.
- Storyboard schema: scene `intent` and `accent_on`, `join_in.overlap: "ghost"`, join meaning `chapter`, top-level
  `devices` and `value_script`. `compose` maps chapter to a cut.
- Gates: film checks and lints honour declared intents (empty, sparse, repeat, static hold, double exposure, tiny
  diegetic text); new `tone_checks` (value script vs brightness, hue families, tone reference) and `_plan_checks`
  (devices, value script, accent_on), warnings only. Runtime overshoot only when the pack allows it.
- Skills: lnd-visual-storyteller, lnd-visual-design, lnd-explainer-craft, lnd-motion-craft, lnd-motion-fit,
  loom-director, loom-scene-author, loom-style-pack and `docs/STORYBOARD_GUIDE.md`; illustrated-only rules are marked
  as such. Account copies synced (loom-scene-author's description now uses `{beat}`, L-216).
- Spec: `docs/strategy/2026-10-06-tedEd-learnings-plan.md`.

## 2026-10-05 - the full read of the TED-Ed run (D-111)
- `docs/research/vision/2026-10-05-tedEd-full-conclusions.md`: every record read line by line by 43 readers, checked
  by code. It covers Qwen as describer and judge, how it thought (from metadata), 16 instrument and harness bugs, the
  run's costs, the corrected film grammar, what Loom has and lacks, the gate conflicts and a proposed order.
  Supersedes parts of `2026-10-05-tedEd-study.md` (section 9 lists them).
- `cache/vision_study/deep/` holds the 43 reports (gitignored). CODE_FACTS gets a correction note.

## 2026-10-05 - TED-Ed vision study distilled (D-110)
- `docs/research/vision/2026-10-05-tedEd-study.md`: trust audit of the 96-film bundle, findings, Loom proposals.
- `docs/research/vision/tedEd_2026-10/`: corpus `style_guide.json` (schema-valid) and `.md`, 175-technique library,
  99 rules, code statistics. Distilled off the pod by sub-agents from Qwen's records; every evidence id checked.
- Raw responses and logs kept in `cache/vision_raw/` (gitignored); batch work in `cache/vision_study/`.

## 2026-10-05 - synthesize fits the context (L-209)
- `vl.py synthesize` packs batches by estimated tokens against `models.<x>.context` (new in `config.yaml`), shortens a
  film too big alone (logged), and merges in levels when the batch guides do not fit one call. A context refusal
  (HTTP 400) raises `ContextOverflow` at once instead of four identical retries. `server.synth_workers` (default
  workers / 2) sets batch parallelism. Mock server refuses past `H.context`. Test 87.

## 2026-10-04 - prompt receipts and the hybrid-model server fix (L-196, L-197)
- Video frame rate (L-201): `serve.sh` samples at 4 fps over 1200 s; `lowres.mp4` is made at 1 fps (and remade if older); selftest measures the rate. `maturity` shows progress and survives a failed frame.
- `vl.py selftest` probes how video fps is passed and keeps the way that works; errors keep their cause (L-200).
- `vl.py`: the schema goes into the prompt as well as the grammar; a whitespace runaway is retried without the grammar (L-199).
- `vl.py` sends `VLLM_API_KEY` when the server was started with one, and the selftest says so on HTTP 401 (L-198).
- `vl.py`: every model call records what it carried (skills, rules first, rubric, schema, thinking, media);
  `vl.py receipts` checks it per call kind; `pack` adds `prompt_receipts.json` to the bundle.
- `serve.sh`: `--max-num-seqs 32` (Qwen3.8 is hybrid; vLLM's default of 1024 sequences did not fit on one H100).
- `requirements.txt` and `check-env` name OpenCV (L-195).

## 2026-10-04 - unattended full run (run_full.sh)
- `tools/vision_lab/run_full.sh`: once every film is prepared, it brings up the server and runs selftest, shots, videos,
  synthesize, calibration (plant, judge-planted, consistency, report), receipts, validate and pack, logging to
  `run_full.log`. It was run end to end on the mock server: every step completes and the bundle is packed.
  `server.workers` is 16 (the pilot used 5.8 % of the KV cache at 8).

## 2026-10-04 - E3 closed: the vision judge does not gate taste (D-109)
- Few-shot anchors scored 0.296 on the 54 held-out frames (styled 0.259, pairs 0.233, v1 0.052 on the same frames).
  Taste stays with Kshitij's look; the model describes, measures and (after calibration) finds defects.

## 2026-10-04 - pairwise judge scored 0.276; few-shot anchors (D-108)
- `vl.py maturity --variant anchored`: six of Kshitij's rated frames (with scores) go in front of every call, and it
  is scored on the held-out 54 only. `py -m loom golden export` writes `anchors.json` from `golden_set.json`
  `anchors`. Test 84 covers it.

## 2026-10-04 - the quality bar is style-aware (D-107)
- `docs/research/golden/RATING_INTENT.md`: Kshitij's definition. Name the style, then judge execution on one bar for
  every style; clean is execution, not plainness; a tidy slide-like frame is a 1; no style is more professional
  than another.
- Vision lab:
  - skills `46_maturity_styled` (replacing the unrun craft draft) and `47_maturity_pairwise` record the style first;
  - schema `maturity_styled`; `maturity_pair` adds `style_a` and `style_b`;
  - study rule 8 and the analyst's "corporate translation" no longer push films toward a corporate style.

## 2026-10-04 - first judge calibration fails (D-106); craft and pairwise variants
- `vl.py maturity` (v1) scored rho 0.054 against Kshitij's ratings. New: `--variant styled` (skill
  `46_maturity_styled`, style first, no study rules; D-107) and `--variant pairs` (skill `47_maturity_pairwise`, schema `maturity_pair`,
  both orders, Bradley-Terry; position bias and order consistency reported). Test 84 covers both, including a
  position-biased judge that must come out flat.

## 2026-10-04 - prepare fixes from the pod pilot (L-193, L-194)
- `vl.py prepare`: shots and stills stay inside the picture; Whisper reads the wav as an array; a film without the
  words it should have fails, and is redone next time. Test 86 covers both cases.

## 2026-10-04 - the pod runs the FP8 model already on the volume (D-105)
- `config.yaml`: model A is `Qwen/Qwen3.8-27B-FP8` (complete on the volume; BF16 did not fit), and `whisper_dir: null`
  reuses the cached faster-whisper-large-v3. The runbook uses profile `qwen38-27b-fp8` and 3 prepare workers (8 vCPU).
- `find_model.py`: compares names exactly (the FP8 copy had been hidden, L-192), flags variants, and skips `.locks`.
  Runbook `tar xf` uses `--no-same-owner` (L-191).

## 2026-10-03 - maturity check for the pod, and reuse of weights already on the volume
- `vl.py maturity`: the vision model rates the 60 golden-set frames 1-5, twice each, blind (skill
  `45_maturity_rater.md`, schema `maturity`). A judge that gives every frame the same score exits 1.
  `py -m loom golden export` prepares the frames by opaque id; `golden report --judge` measures agreement.
- `find_model.py`: finds weights another run left on the volume (an HF cache anywhere, or a plain folder) and says
  whether they are complete. `setup.sh` links a complete copy instead of downloading 56 GB again; `serve.sh`
  serves a plain folder under the model's own name.
- Runbook: check the volume before setup; send the golden frames; run `maturity` before the pilot films.
- Tests 84 and 85: a flat mock judge is flagged and a missing frame is refused; absent, partial, unfinished, cached
  and plain weight layouts are told apart, and only complete copies are linked.

## 2026-10-03 - golden-set ratings read (D-104)
- Kshitij rated all 66: studio 3.77, new 2.75, rejected 2.30, and no Loom frame reached 4. Code-drawn people and
  places average 1.93, against 2.86 for UI, documents and data. Findings:
  `docs/research/golden/2026-10-03-findings-kshitij.md`.

## 2026-10-03 - golden set and rating page (D-102 E1, D-103)
- `loom/golden.py` and `py -m loom golden build|serve|report`: 60 frames (20 reference, 20 rejected, 16 new, 4 from
  another AI tool), 66 blind presentations with 6 repeats, a local rating page (`loom/studio/ui/golden.html`,
  port 8830), append-only ratings, a report with per-class means, the rater's own consistency, and Spearman
  agreement for a judge (gate 0.7).
- Every frame gets the same treatment: 640x360, one h264 pass unless it came out of a 360p video, and the bottom 14 %
  cut (Loom burns in captions).
- Spec `docs/research/golden/golden_set.json`, notes `docs/research/golden/README.md`. Frames stay in
  `cache/golden` (gitignored).
- Test 83: video, still and lab-panel frames; a blind session; refused bad ratings; a red report on zero ratings
  and on a flat rater; rho 0.97 for an agreeing judge, -0.97 for an inverted one; only the first may gate.

## 2026-10-03 - visual maturity plan (D-102, DESIGN)
- `docs/strategy/2026-10-03-visual-maturity.md`: why code-drawn scenes look childish, a brainstorm of 17 ideas,
  3 critique rounds, a 6-part plan, and experiments E1 to E4. Nothing is built yet.

## 2026-10-03 - vision lab for a GPU pod (D-101)
- `tools/vision_lab/`: an open vision model on RunPod studies 100 TED-Ed films and judges Loom films. Code
  measures; the model describes; code checks.
  - `vl.py`: check-env, selftest, select, prepare, shots, videos, synthesize, calibrate, judge, validate, status,
    pack, ingest;
  - schemas for shot, video, style guide and judge;
  - skills: rules, annotator, analyst, distiller, judge, Loom capabilities, default rubric;
  - `setup.sh`, `serve.sh` and `mock_server.py`;
  - ground truth from the step-7 audit;
  - README runbook.
- Recommended model: Qwen3.5-122B-A10B-FP8. Second rater: Qwen3.8-27B. On Kshitij's single H100 the roles swap: A is Qwen3.8-27B (BF16), B is the 122B in GPTQ-Int4 (`serve.sh` profiles).
- Design: `docs/strategy/2026-10-03-vision-lab.md`.
- Source resolution is 480p by Kshitij's choice. Stills and clips never upscale. The model is told the resolution and lowers its confidence on small text and thin lines. A 100 GB volume fits the main run; B replaces A's weights for the cross-model step.
- Test 82: an end-to-end mock run on a synthetic film. Its three cuts are found, invented evidence is rejected,
  verbatim narration is redacted, and the bundle carries no media.
- The mock run found 4 bugs before any money was spent (L-181 to L-184).
- Added the same day:
  - full-frame-rate motion curves (easing shapes, stutters, flashes);
  - sound hits and how cuts and movements land on them;
  - an optional ears pass with Qwen3-Omni-30B-A3B (`vl.py sound`, schema `sound`).
- Every ffmpeg call now gets stdin=DEVNULL (L-185).
- Storage split for the 100 GB volume:
  - the volume keeps the weights, videos, prepared clips and results (about 65 GB);
  - the Python env, Whisper and caches live on the pod's disk (about 24 GB, rebuilt by `setup.sh` after a restart).

## 2026-10-03 - engine fixes from the frame audit, and the two golden segments (D-100)
- **Look at the film:**
  - `py -m loom strips <id> [--source mp4|build] [--beats b17-b21]` makes 8 frames per beat and per join;
  - `--preview` writes a watchable MP4 of those beats from the build, with the mix (resumable).
- **Finish:**
  - pack grain is near off (0 to 0.012);
  - `style_lint` fails grain > 0.015 or paper > 0.08 (L-173).
- **Real artefacts:** `runtime/ui_artefacts.js` (`Loom.ui.mail`, `inbox`, `chat`, `doc`, `phrase`, `mark`, `card`,
  `wire`, `at`, `build`). Reference board: `docs/references/ui/mail-chat-doc.md`. Lab: `lab_ui_artefacts`.
- **Props and people:**
  - laptop `facing` (viewer, away, left, right, top);
  - `shadow: "wall"`;
  - scale table `O.REAL`, `O.px` and `ctx.el({real})`;
  - pack `characters.extras` (people in the corporate and cinematic packs, beans in the story packs);
  - `ctx.crowd({parent})`. Lab: `lab_props_people`.
- **Layering and joins:**
  - `H.lead` (titles within 0.6 s of speech);
  - template backplates over drawn scenes;
  - annotations leave before camera moves;
  - camera joins between worlds become dips;
  - cursors recede;
  - chapter `E.after`;
  - one icon family unless `icon_objects`;
  - `M.exit` takes a label's lead and followers;
  - retirement skips elements already sent away (no flash);
  - `Loom.drive` takes a `key`, so a pull back does not show its pushed-in start at load;
  - `Loom.cam.frame` puts a camera on one element.
- **Film checks in `check`** (`loom/checks/film.py` and the probe):
  - empty, sparse and repeated frames;
  - reveals under an overlay;
  - on-screen type size after camera and scale;
  - words cut by the frame edge (`data-bleed="t0-t1"` declares a crop);
  - object scale beside people.

  Each one fails on a planted case.
- **Golden segments:**
  - phishing b17 to b21 rebuilt as one real message with evidence cards (the old scenes are kept in
    `scenes/_v1_2026-10-02/`);
  - feedback b37 to b41: the camera follows the writing and the laptop is seen from above.
- **Tests:** 81 (film checks, UI and props in Chrome, strips pick).

## 2026-10-03 - both step 7 lessons rejected; frame-by-frame audit (D-99)
- `docs/research/2026-10-03-frame-audit.md`: every beat and join of both MP4s at 4 fps (sheets in
  `docs/research/step7/audit/`). Failures by kind, a beat-by-beat table, why it happened, and what changes.
- Ledger: 106 per-beat review findings, 3 lesson-level findings and Kshitij's "reject" verdict, as labels.
- Learning L-172.

## 2026-10-03 - Laya researched; smaller models for scene code, gated (D-98); feedback MP4 measured
- `docs/research/2026-10-03-decision-models-jev-laya.md` (Laya: open, trainable, hype and caveats; a Loom decision
  map).
- `final-goal.md` 2.1b (Laya) and 4.3 (three gates before Sonnet or a Flash-class model writes scenes).
- Step 7 review 7c: the feedback MP4 has motion 59 %, event gap 7 s and 48 holds; logged in the ledger.

## 2026-10-03 - no-compromise rule and the decision ledger (D-97)
- `loom/ledger.py` + hooks:
  - `flow.accept` logs pass and fail with versions, plus per-beat script, storyboard and tooling decisions;
  - allocate, approve, check outcomes, forced render and render;
  - `options.switch`, `tweak`, `seed`, and API model calls.
- CLI: `py -m loom ledger <id|all|export> [--backfill]` and `py -m loom note <id> "<text>" --beat --kind`.
- Backfilled all 8 projects (776 records) and logged this session's corrections as notes.
  `datasets/decisions.jsonl` is generated.
- Docs:
  - final-goal rule 0 (no step or thinking cut for cost, shadow mode before any switch) and section 4.4b (the data
    foundation);
  - the brain doc keeps joins, shots and seed inside the storyboard's thinking;
  - CLAUDE.md rules 4, 9 and 13;
  - the loom-director skill (repo + account) has "Log every decision".
- The PC's phishing MP4 is measured: motion 47 %, event gap 9 s, 46 holds (step 7 review 7b).
- Test 78: `decision_ledger_...` (FAILS with the accept hook disabled).

## 2026-10-02 - brain architecture proposal (D-96); render gate; PC check triage
- `docs/strategy/2026-10-02-brain-architecture.md` (DESIGN): lesson graph, conductor, narrow workers, five verifier
  kinds, coarse-to-fine planning, per-module evals; steps B0 to B7. `final-goal.md` section 4.4 is superseded.
- `loom/flow.py`: render refuses without a passing check; `--force` overrides with a warning (L-168).
- `tests/run_tests.py`: the four cairo-dependent preview tests name a skip when cairo is missing (L-170). The draft
  test asserts the render refusal.
- Step 7 review section 7: the PC check and render results, with error frames cut from the MP4s (L-169).

## 2026-10-02 - final goal recorded and parked (D-95)
- `docs/strategy/2026-10-02-final-goal.md`: a 30-minute lesson in about 90 minutes; think less (effort per stage),
  decision models (Jev) for bounded choices, and Sonnet writing the drawing code; a modular brain like RedTee Layer
  1. It includes the research: Jev, FrugalGPT, RouteLLM and Claude pricing, caching, batch and thinking.
- Priority: video quality to 95 % first. Nothing is built. The corporate plan's status line says so.

## 2026-10-02 - step 7: two corporate lessons made and reviewed; the corporate plan (D-94)
- **Lessons:**
  - `projects/feedback-that-lands` (corporate-clean, Maya as manager): 47 beats, 429.6 s;
  - `projects/phishing-report` (cinematic-noir, `--mix cinema`): 42 beats, 420.5 s.
  - Both composed and checked in Chrome in the sandbox (0 errors), with sheets in `qa/sheets/`. Not rendered.
- **Review:** `docs/research/2026-10-02-step7-review.md`, plus `qa/review.json` in each lesson.
- **Plan:** `docs/strategy/2026-10-02-corporate-readiness-plan.md` (DESIGN).
- **Engine fixes, found on the sheets:**
  - `runtime/world.js`: elements a camera or screen join carried away switch off once out of sight (L-164).
  - `loom/qa.py` + `tools/node/probe.mjs`: the reading floor counts camera exits (`exitKind`) and the real end of
    an entrance (L-164).
  - `runtime/motion.js`: `m.travel` writes its matrix directly, about the element's own origin and independent of
    seek order. `runtime/hold.js` acts on `life` (L-166).
  - `runtime/templates/more.js`: `quiz.answer` gains `also` / `also_why` and `takeaway`, and the catalog was
    rebuilt (L-163).
- **Earlier in the run:**
  - `Loom.array` keeps placement and tween on separate groups, and `Loom.data.tag` measures its text (L-162);
  - narration calibrates once (`voice.calibrated`, L-161).
- **Tests 77:** `travel_moves_...` (preview), `travel_lands_on_its_own_origin_in_chrome_too` (Chrome; fails on the
  old code), and the reading-floor test extended.

## 2026-10-02 - rig importer; Maya v5 imported (D-93)
- `tools/rig_import.py` turns a Claude Design delivery into `assets/rigs/<id>.json` and re-poses every pose to
  check it.
- `runtime/rig.js` gains flat mode, and `runtime/rigs/imported.js` installs imported rigs from embedded data.
- Compose and the lab embed only the rigs a scene casts.
- Maya v5 is reviewed (`docs/assets/reviews/2026-10-02-maya-v5.md`) and imported as `maya`: 20 poses, with the lab
  scene `lab_maya`.

## 2026-10-02 - Maya v4 reviewed: ready for the rig importer
- `docs/assets/reviews/2026-10-02-maya-v4.md` (sheets in `docs/assets/reviews/maya-v4/`).
- Intake 203/203, props in contract hexes. Fixed: thumbs-up pose and the notches. Improved: the side view and the
  bent knees (one optional polish left).

## 2026-10-02 - cinema plan Track B built: data pictures, real maps, screen joins, hold-and-transform (D-92)
- **Runtime:**
  - `runtime/data.js` (counter, unitGrid, barsOn, dipLine, profile, tag, chapter, `Loom.array`);
  - `runtime/geo.js` (Natural Earth map and globe; `assets/geo/world110m.json`, public domain);
  - `runtime/hold.js` (lift, heat, peel, breathe);
  - kit `shade: recipe | ink`;
  - screen joins iris, wipe, dip and fade, with `join_in.meaning`;
  - fx `paper`, and stronger finish levels on the neon, cinematic and paper packs.
- **Plan and checks:**
  - storyboard `subject` and `world`, plus story notes (subject, world, callback);
  - variety tells `labels_over_objects_share` and `one_world_share`, and `lines_per_s` (report only); baseline
    extended;
  - `--mix cinema` (opt-in);
  - prompts ask for drawn worlds and density.
- **Proof:** lab scenes `lab_joins`, `lab_data`, `lab_world`, `lab_geo`, `lab_shades`, `lab_hold` (preview strips in
  `docs/styles/demos/preview/`). Tests 74.

## 2026-10-02 - study: Kshitij's explainer skill vs Loom; cinema plan (D-90, DESIGN)
- `docs/research/2026-10-02-explainer-skill-study.md`: measured comparison (motion share, event gap, frozen share,
  lines of scene code per second) and frame evidence in `docs/research/explainer_skill/`.
- `docs/styles/CINEMA_PLAN.md`: Track A (a cinema register on the skill's engine, behind a Loom bridge) and Track B
  (twelve house upgrades). Awaiting Kshitij's three choices. No code changed.

## 2026-10-02 - Maya v3 reviewed; rig_review reads page builds; intake can use a delivery's declared slots (D-89)
- **Review:** `docs/assets/reviews/2026-10-02-maya-v3.md` and `docs/assets/reviews/maya-v3/`.
  - Fixed: underarm, elbow at rest, 3/4 visemes and hands, idle weight, brow class.
  - Partly: knees in bent poses, side-view depth, the thumbs-up pose.
  - Not done: the props.
- **`tools/rig_review.py`:**
  - `--page`, or `<batch>/_page/index.html`: rebuilds the page's `loom-builds` and baked `data-pose` figures from
    the delivered parts, counting missing and unread parts;
  - `--zoom bN@x,y,w,h` for close-ups;
  - sheets keep each drawing's aspect (L-157).
- **`tools/asset_intake.py --declared-slots`** (opt-in): maps prop colours to the contract via the manifest's
  `base_slots`, and lists each remap.
- **Tests:** rig_review and asset_intake extended (still 72).

## 2026-10-02 - free asset sets, every resource in one place, and the reference-research skill (D-88)
- **Approved sets** (licence read at source, `assets/vendor/SOURCES.json`): Fluent Emoji Flat (MIT, npm, installed),
  Open Doodles, Lukasz Adam free illustrations and the Kenney Furniture Kit (CC0, fetched on the PC with
  `py tools/fetch_assets.py`).
- **Runtime:** `Loom.art.place / shape` (`runtime/art.js`), with `keep` or `auto` colours; compose and the lab embed
  only the literal references a scene names. `py -m loom art <words>` searches. Lab: `lab_vendor_art`.
- **Docs:** `docs/references/RESOURCES.md` indexes every resource. `SOURCES.md` points to it. STACK.md has rows for
  the four sets.
- **Skill:** `skills/lnd/lnd-reference-research` (and the account copy): look at existing work before any complex
  scene, setting, situation or asset.
- **Tests:** 72.

## 2026-10-01 - reference first (D-87): boards, a ratchet, and the office rebuilt from references
- **Process:** `docs/REFERENCE_FIRST.md`. Look at 3 to 6 existing drawn references, write a board, take ideas
  (never drawings) and cite the board.
- **Tooling:**
  - `tools/ref_board.py new|check`: boards, plus a ratchet over the places and objects the runtime draws;
  - `docs/references/SOURCES.md`: open-source sets and their licences; nothing downloaded;
  - the story gate notes drawn beats with no `design.references`.
- **`Loom.place.office` rebuilt:**
  - a one-point perspective room, 3/4 desks with drawers, task chairs with a five-star base;
  - a binder shelf, window light and contact shadows;
  - the old office is kept as `look: "flat"` (`P.officeFlat`);
  - board: `docs/references/places/office.md`, with `office_before_after.jpg`.
- **Skills:** lnd-visual-design adds step 4, "look at existing work"; loom-scene-author and loom-director updated.
- **Tests:** 71.

## 2026-10-01 - PC run: 69/69 tests, every lab strip clean but four (fixed, L-150)
- The stamp labels and the frame-panel title had tight insets in Chrome. They now get more padding.
- A label's lead now leaves from the edge facing its part, so it never crosses the words.
- Stamps are 10 px taller: the Chrome re-run still found flat-cosmos stamps at about 5.9 px. The `tight_inset`
  message now shows one decimal, so "6px, needs 6px" can no longer hide a miss.
- `py -m loom lab <scene>` now renders every style and seed the scene lists (L-151). Before, it rendered only the
  first style, with no seed. `--style` and `--seed` narrow it.

## 2026-10-01 - Maya v2 intake and review; tools/rig_review.py (D-86)
- **`tools/rig_review.py` + `tools/node/rig_review.mjs`:** assembles a character delivery's poses from its own
  files and pose data, runs the joint test, measures expressions on the face region, and sheets the turnaround
  and hands.
- **Maya v2:**
  - intake: 168 of 171 pass;
  - review with evidence: `docs/assets/reviews/2026-10-01-maya-v2.md` and `docs/assets/reviews/maya-v2/`;
  - the delivery's engine is kept in `assets/incoming/maya-v2/_engine/`.
- **Tests:** 70.

## 2026-10-01 - distinctness steps 2 to 5: lint, seed everywhere, objects, places and camera (D-82 to D-85)
- **Objects** (`runtime/objects.js`, `Loom.obj`): 12 drawn objects with families per seed, detail levels and
  states. A hero icon in a seeded lesson becomes the object.
- **Places** (`runtime/places.js`, `Loom.place`):
  - five places: office, inside, server, meeting and warehouse;
  - three layers each; wall tone, floor pattern, trim and side follow the seed;
  - `Loom.cam.push` and `pan` give parallax camera moves from one deterministic driver.
- **Seed:**
  - `go` writes the engine's seed for a new lesson before its storyboard;
  - `--clear` now leaves a marker;
  - `kit.card`, `kit.mark` and the templates' icon discs follow a seed;
  - nothing changes without one.
- **Lint:**
  - new tells `one_radius_share` and `still_share`;
  - every warning names its beats;
  - warnings for a missing seed and for an unused camera habit;
  - the baseline was re-recorded on purpose;
  - the probe records radii.
- **Lab:**
  - new scenes `lab_objects`, `lab_places` and `lab_tpl_definition`;
  - a lab scene can now build catalog templates;
  - `lab_treat_essentials` gained two small icons.
- **Prompts:** the storyboard and scene-author prompts read the seed and use objects and places.
- **Tests:** 69.

## 2026-10-01 - design seed: each lesson draws the essentials in its own form (D-80, D-81)
- **Principle (D-80):** essentials (labels, bubbles, panels, icons, ticks) are kept. Their treatment changes per
  lesson. The variety ledger keys them by treatment, with a new `classic_share` metric (report only).
- **Seed:** `py -m loom seed <id> [--show] [--set axis=option] [--clear]` (`loom/seed.py`;
  vocabulary in `packs/seeds/treatments.json`). It follows the subject's material, moves away from the recent
  lessons and is deterministic. The person can override any axis. A storyboard `design_seed` merges over the file.
- **Runtime:** `runtime/treat.js` (`Loom.treat`).
  - Builders: label, bubble, panel, badge and mark.
  - Each has 4 to 6 treatments, plus a shape language, a texture and an entrance family.
  - `Loom.glow.pill` follows the seed's label.
  - Nothing changes without a seed.
- **Lab and tools:**
  - `scenes_examples/lab/lab_treat_essentials.js`, with five seeds;
  - `py -m loom lab <scene> --seed ...`;
  - `tools/lab_preview.py --seed` and `--seeds`;
  - the probe and the lab reports now carry `treatments`.
- **Tests:** 67, including a design-seed test that was proven able to fail.

## 2026-10-01 - variety ledger and AI-tells lint (distinctness step 1, D-79)
- **`py -m loom variety [id] [--baseline] [--last N]`** (`loom/checks/variety.py`): the signature overlap between
  lessons, what recurs, five AI-tells metrics, and a baseline ratchet (`loom/checks/variety_baseline.json`).
- **`check`** adds the lesson's variety as warnings.
- **Docs:** `docs/styles/DISTINCTNESS_PLAN.md`, the critique of stress-signal and the plan; step 1 built.
- **Tests:** 66.

## 2026-10-01 - glow-flat fixes after the first render; lesson stress-signal started (run R-23, continued)
- **`runtime/glow.js`:**
  - crackle now hugs the figure's outline;
  - the vortex calms its outer rings (`calm`);
  - new builders `coral`, `fan`, `kelp`, `rock` and `ticket`.
- **Lab scenes:** `lab_glow_world` uses a coral reef and real tickets in the comparison panels; `lab_glow_pressure`
  uses the calmer vortex.
- **`tools/lesson_preview.py`:** browser-free frames of a composed lesson's bespoke beats (L-141).
- **`loom/story.py`:** the cast check knows the `bean()` rigs (L-140).
- **`projects/stress-signal` rendered on the PC** (76.7 s; render_verify 36/36).
- **New project `projects/stress-signal`:** a one-minute glow-flat explainer. The brief is accepted; the knowledge
  sheet is a draft awaiting Kshitij's approval.

## 2026-10-01 - glow-flat pack, glow kit, browser-free lab preview, Maya v1 review (run R-23)
- **Style pack `glow-flat`:** a saturated flat register, Kurzgesagt-inspired (techniques only). `flat-cosmos` is
  unchanged (D-78).
- **Shading `gloss`** in `runtime/kit.js`: an inner band, a highlight, no outline. Other packs are untouched.
- **`runtime/glow.js`:**
  - ground, shafts, glowDisc, blob, burst, vortex, orbit, crackle, sparkles, idle, swarm;
  - pill, stat, hud, compare, gauge.

  All are seeded and token-only, with fallbacks for other packs. Loaded after `scenery.js`.
- **Lab scenes:** `lab_glow_inside`, `lab_glow_pressure` and `lab_glow_world`.
- **`tools/lab_preview.py` + `tools/node/svg_preview.mjs`:** approximate lab frames without a browser (L-135).
- **`tools/asset_intake.py`:** review folders skipped, unlisted files reported, accessory palette (L-138).
- **Tests:** 65, and `tests/run_tests.py --only/--exclude` to run a subset.
- **Docs:**
  - `docs/assets/reviews/2026-10-01-maya-model-sheet-v1.md`;
  - `docs/SCENE_API.md` (glow kit);
  - `docs/styles/SATURATED_FLAT_PLAN.md` (now PARTIAL);
  - previews in `docs/styles/demos/preview/`.

## 2026-10-01 - animation moments, the saturated flat plan, Claude Design intake (run R-22, continued)
- **`tools/explain_study.py moments`:** picks the 10 s windows with the most motion and at most one cut, to
  strip at 0.5 s (L-134). Motion sections were added to the TED-Ed and Kurzgesagt studies (13 windows read).
- **`tools/asset_intake.py`:** reads a Claude Design .zip, standalone .html or folder and checks every SVG
  against the asset contract. Return Prompt R is in `docs/ASSET_WISHLIST.md` (D-77).
- **`docs/styles/SATURATED_FLAT_PLAN.md`:** what a Kurzgesagt-inspired register needs. DESIGN only; nothing built.
- **Tests:** 64 (asset intake; moments added to the explain_study test).

## 2026-10-01 - TED-Ed and Kurzgesagt studied (run R-22)
- **Research:**
  - `docs/research/teded/2026-10-01-teded-study.md` (7 lessons) and
    `docs/research/kurz/2026-10-01-kurzgesagt-study.md` (5 newer, 2 older videos);
  - a five-channel section in `docs/research/2026-10-01-channels-compared.md`.
- **Skills (small, sourced additions):**
  - `lnd-explainer-craft`: moves 10 and 11, two emphasis rows, two register measurements;
  - `lnd-visual-storyteller` section 9: the two new channels.
- **Wishlist:** prompts G1 to G4 (material grounds, a painterly layer, a workplace-pressure kit, personified
  mechanisms) and three engine candidates, not built.
- **`tools/style_fingerprint.py`:** refuses a `--label` count that does not match the inputs (L-130), with a test.
- **No pack, rig, template or lesson changed** (D-76).

## 2026-10-01 - new visual registers, explainer craft, portability (run R-21)
- **Measuring tools:** `tools/style_fingerprint.py` measures what a look is made of (drawn, covered, outline,
  soft, colours, saturation and more), the same way for a reference video and a Loom render.
  `tools/explain_study.py` finds explaining moments and draws word-aligned strips.
- **Runtime:**
  - `shape.shading: "toon"` (outline + one cel shade) in `runtime/kit.js`;
  - outlined people `pip`, `tess` and a grey crowd figure `extra` (`runtime/rigs/beans.js`);
  - `runtime/scenery.js`: `ctx.scenery` (room, stage, street), desk, sign, `ctx.crowd` and `ctx.narrationCard`.
- **Style packs:** `story-cartoon`, `presenter-pop` and `chalk-lab`. Lab scenes: `lab_story_set`,
  `lab_matrix_build` and `lab_one_board`. `py -m loom lab ... --frames <dir>` keeps full-size frames.
- **Skill `lnd-explainer-craft`:** listed for the script, storyboard and scenes stages. The storyboard stage now
  also lists `lnd-visual-storyteller` (L-120). Visual-design section 7c on frame fill; genre packs point to the
  new skill.
- **Docs:** `docs/research/2026-10-01-visual-study.md`, `docs/PORTABILITY_CHECKLIST.md` and
  `docs/ASSET_WISHLIST.md`.
- **`tools/context_check.py`:** the historical-number filter now reads the same line only (L-122).
- **Tests:** 63. No existing pack or lesson changes its look.

## 2026-10-01 - watching three reference channels (run R-20)
- `tools/video_study.py`: cuts, visual change, holds, audio gaps, palette and contact sheets per video, plus
  speech rate and pauses from a transcript (`--words-dir`, `--redo`). A cut needs the colour mix and a
  visible share of pixels to change, so a lighting shift is not counted (L-114).
- `tools/transcribe_videos.py`: word timings with faster-whisper, or pocketsphinx marked rough; resumable in
  60 s chunks. Transcripts stay in the gitignored `cache/research/`.
- Studies: Crayon Capital (7 videos), Cleo Abram (5), Lucas's Lab (2), and the three side by side
  (`docs/research/2026-10-01-channels-compared.md`). Storyteller skill section 9 carries them as references;
  needs added to `docs/styles/WALLS_AND_NEEDS.md`. Tests: 58.

## 2026-10-01 - screening AI-written video notes (run R-19)
- `tools/check_video_notes.py`: flags placeholder titles, copied entries, filler metadata and too few
  segments. With `--online` it also compares the URL's real title and channel (YouTube oEmbed).
- `docs/research/gemini/VERIFICATION_2026-10-01.md`: 22 notes checked, 20 filler, none used. The rejected
  file is kept in `_rejected/`.
- `docs/research/GEMINI_BRIEF.md`: a proof-of-watching block, a `CANNOT WATCH` answer, and running the
  checker before sending. Tests: 56.

## 2026-10-01 - palette study tool (run R-18)
- `tools/palette_study.py`: the colours a video uses, by role:
  - the field and its shades;
  - neutrals;
  - accents;
  - which accents appear together;
  - ink-on-field contrast;
  - a palette per shot;
  - `--aggregate` across videos, by channel.
- Rebuilt from a K-means script after measuring both on a Loom lesson with a known palette
  (`docs/research/palettes/README.md`). Tests: 55.

## 2026-10-01 - options, not overwrites: both ways kept, the person chooses (run R-17)
- `loom/options.py`: `py -m loom options <id>` and `py -m loom switch <id> <beat> "<name>"`; storyboard
  `option` and `alternatives`; the storyboard gate checks every alternative is buildable (D-70).
- The project interview asks one `look` question; the brief records `look`; the storyboard prompt honours
  it and, with no preference, uses the established treatment and offers the newer one; "plain" switches
  story suggestions off.
- `projects/_ss_story`: b02, b11, b22 keep the original illustrated busts as alternatives (switching is
  pixel-identical to the original lesson, and exact back).
- Skills: `lnd-visual-storyteller`, `loom-director`, `lnd-creative-director` (interview). Tests: 54.

## 2026-10-01 - engagement with pedagogy, a real lesson upgraded, the fx check fix, recent research (run R-16)
- `loom/story.py`: story suggestions for every kind of video; the genre sets the form of story suggested;
  `story.dial: "off"` switches them off (D-67). `packs/genres/*.md`: "Story form that usually fits".
- Tiers parked: no `--production`, no budget notes, `loom cost` reports drivers only;
  `docs/PRODUCTION_TIERS.md` marked parked.
- `runtime/fx.js`: overlays drawn at a gain and shown at opacity 0.58, so HyperFrames' layout check no
  longer reports text under the grain as hidden (D-68, L-104). A browser test asserts it.
- `runtime/depth.js`: `clip` (a stage seen through a window) and `parent`.
- `projects/_ss_story`: spacing-sticks with Maya as a rigged running character (b02, b11, b22 bespoke),
  story fields, shot sizes and pushes; check 0 errors. `projects/_ss_base`: the untouched baseline.
- Demos: `docs/styles/demos/2026-10-01_story_upgrade_before_after.mp4` and `.jpg`,
  `2026-10-01_story_upgrade_after_cut.mp4`.
- Research: `docs/research/2026-10-01-attention-learning-recall.md`; skills `lnd-visual-storyteller`
  (section 8), `lnd-learning-pedagogy`, `lnd-motion-craft`.
- Tests: 53.

## 2026-09-30 - references not rules, production tiers, the Gemini brief (run R-15)
- `loom/cost.py`, `py -m loom cost <id>`: the production tier a lesson needs (essential, standard,
  cinematic), what pushes it there, model tasks, clip seconds, and a render-time estimate from measured
  rates. `loom new --production`, storyboard `production`; the storyboard gate notes scenes above budget
  (never refuses). `docs/PRODUCTION_TIERS.md`.
- `loom/story.py`: story notes are labelled suggestions, offered by the genre's storytelling dial (none for
  policy), silenced by `story.dial: "low"`; correctness notes unchanged (D-64).
- `skills/lnd/lnd-visual-storyteller`: pedagogy first, a dial per kind of video, questions instead of a
  checklist. `packs/genres/*.md`: a storytelling dial and a typical tier each.
- `docs/research/GEMINI_BRIEF.md`: the prompts for a Gemini study of the reference channels.
- Tests: 52.

## 2026-09-30 - characters, depth stage, isometric kit, visual storytelling, the styles reel (run R-14)
- `docs/STACK.md`: every library, tool and asset source, with version, licence and where it is used.
- `runtime/rig.js`, `runtime/rigs/people.js`: rigged 2D characters (Ava, Sam) with poses, gestures, walk,
  blink, emotions, gaze and lip flaps from word timings; `ctx.character`.
- `runtime/depth.js`: a 2.5D depth stage (`ctx.depth`); style packs `cinematic-noir`, `cinematic-dawn`.
- `runtime/iso.js`: an SVG isometric kit (`ctx.iso`).
- `loom/story.py`: storyboard `story`, `shot.size`, `depth`, `light`, `story_role`; warnings in the
  storyboard gate; `py -m loom animatic <id>`. Skill `skills/lnd/lnd-visual-storyteller`.
- `loom/reel.py`: `py -m loom reel <spec>`; the styles reel `docs/styles/demos/2026-09-30_styles_reel.mp4`.
- `loom/lab.py`: `page()` (shared with the reel) and `strip(out_dir=)`; tests no longer overwrite strips.
- Docs: SCENE_API, STORYBOARD_GUIDE, VISUALS_PLUS, `docs/styles/WALLS_AND_NEEDS.md`,
  `docs/research/2026-09-30-reference-channels.md`. Skills: loom-scene-author, loom-style-pack, loom-director.
- Tests: 51 (5 new).

## 2026-09-30 - research into 2D, 2.5D, cinematic and isometric styles, with two proofs (run R-13)
- `docs/strategy/2026-09-30-cinematic-styles-roadmap.md` (proposal P-4).
- Lab examples: `scenes_examples/skia/cinematic_25d.py` (2.5D) and `scenes_examples/three/isometric_office.js`
  (isometric).
- Three.js scenes gain `ctx.neutral(k)` for neutral light colours (surfaces still use tokens).

## 2026-09-30 - beyond SVG: shader layer, Skia clips, Three.js clips, Lottie (run R-12)
- **`runtime/fx.js`:** a WebGL shader layer.
  - Backgrounds: nebula, aurora, mesh, paper, blueprint; camera-aware and luminance-banded.
  - Grain (frame-hashed), vignette, leak.
  - Moments: light sweep and spotlight, from storyboard `scenes[].fx` or `ctx.fxMoment`.
  - Style packs gain `fx`; storyboard `fx` overrides. The boot installs it after the camera clock.
- **`kind: "skia"`:** `loom/skia_bridge.py`, `runtime/skia/loom_skia.py` (contract) and
  `runtime/skia/render.py`.
  - SkSL `shader()`, `backdrop_blur()`, fonts from the style, tokens and read recording.
  - Motion blur by sub-frame accumulation.
  - Resumable frames and a stills mode.
  - A Skia dialect of the fixed-colour check.
- **`kind: "three"`:** `loom/three_bridge.py` and `runtime/three/render.mjs` (headless Chromium,
  RoomEnvironment, style faces loaded, token colours, motion blur, stills mode). three@0.186 (MIT).
- **Lottie:** `runtime/lottie.js` with `ctx.lottie` (seeked by the timeline; `"auto"`/explicit token
  recolouring). lottie-web@5.13 (MIT). Compose bundles the named animations from `assets/lottie/`.
  `assets/lottie/check_success.json` was generated by code (CC0).
- **Clip store:** clip renderers share the Manim store (engine-separated keys; Manim keys unchanged).
  Compose, flow, qa and the scenes gate know the new kinds.
- **Trailers:** keep and re-time clip beats (`data-playback-start`); `trailer.finish` bakes the poster.
- **`loom lab skia:<name>` / `three:<name>`:** clip stills through the real renderers. Lab scenes
  `lab_fx` and `lab_lottie`; examples in `scenes_examples/skia/hero_orb.py` and
  `scenes_examples/three/device_turn.js`.
- **Probe:** reports `fx` and `lottie`.
- **Other:** `requirements.txt` adds `skia-python`; `package.json` adds `three` and `lottie-web`.
  Docs: `docs/VISUALS_PLUS.md`, SCENE_API, STORYBOARD_GUIDE, loom-scene-author skill. 46 tests.

## 2026-09-30 - BRAG + motion/framer adopted: expressive motion, sound from motion, trailers, motion lab (run R-11)
- **`runtime/expressive.js`:**
  - `Loom.spring` (closed form; bounce clamped by the style's overshoot flag) and `m.spring`;
  - `m.group` / `m.groupExit` (order, parent first, 1.2 s cap, reverse exits);
  - gestures `m.shake`, `m.nudge`, `m.press`, `m.glow`;
  - `Loom.sfx` sound events.
  - Every entrance accepts `o.ease`.
- **`runtime/interaction.js`:** `ui.window`, `ui.field`, `ui.button`, `ui.toast`, `ui.cursor`;
  `m.cursorIn`, `m.cursorTo`, `m.tap`, `m.typeInto`, `m.toastIn`.
- **Sound (`loom/narrate/mix.py`):** synthesised key, click, card, land, reveal, success and error, tuned to
  the sounding chord; `chord_times` / `chord_at`; `music.follow_edit`. `qa.sync_sfx` collects the runtime
  events per build (`qa/sfx_events.json`) and re-mixes only when they change. Mixes of existing lessons
  are byte-identical.
- **Checks:**
  - the reading floor and double exposure (warnings);
  - mid-join frames in contact sheets;
  - the frame cache now hashes the whole build (L-76).
- **Render:** writes a poster (`renders/<id>.jpg`, the densest settled frame in the first half, or
  storyboard `poster`); `bake_poster` makes it frame 0.
- **`loom trailer`:** a 20-35 s course trailer from an approved lesson.
  - `plan` (hook, highlights, payoff, cards);
  - `build` (EDL over the lesson timeline, its own narration, synthesised music that changes on the cuts);
  - `sheet`;
  - `render` (poster baked as frame 0);
  - `card.txt`.
  - Tone presets: default, polished, cinematic, chaotic, deadpan.
- **`loom lab`:** filmstrips of lab scenes in the real runtime. Three lab scenes.
- **Fix:** `hero.meter` notes land on their words, and a replaced note leaves first after its reading
  floor (D-51). spacing-sticks re-rendered; the old MP4 archived.
- **Skills:**
  - lnd-motion-craft: springs, orchestration, reading floor, double exposure, gestures, simulated
    interaction, sound, poster;
  - lnd-visual-design: show it in use, postable frames, checklist lines;
  - lnd-motion-fit: interface instrument law, reverse group exits;
  - lnd-motion-choreography-loop: extra proof frames, lab;
  - lnd-creative-director: trailer tones;
  - loom-scene-author and loom-director.
- **Other:** `docs/SCENE_API.md` Expressive section. 39 tests.

## 2026-09-30 - faster Manim restyles, a shared clip store, and a fixed-colour check (run R-10)
- **`runtime/manim/loom_manim.py`:** records what a scene reads (every `C.<token>`, `ctx.fonts` key, and
  `ctx.raw` use) to `$LOOM_MANIM_READS` at exit. Frames are unchanged.
- **`loom/manim_bridge.py`:**
  - a shared store (`cache/manim/`, `$LOOM_CACHE_DIR`) matched on the recorded reads, with adoption of
    older clips;
  - `quality` final/draft (6 fps, half size); a draft request takes a final clip when one exists;
  - parallel scenes (`$LOOM_MANIM_JOBS`);
  - brand colours now reach Manim (L-68);
  - `media/<beat>.json` records its quality;
  - `store_status`, `prune`, `has_draft`.
- **Compose:** writes `draft_media` to the manifest only when drafts are present, so final builds are
  byte-identical to before.
- **Stages:** check and render re-make drafts at full quality first; `render` refuses a build with
  drafts.
- **`loom restyle`:** uses drafts. The RUN_LOG and the Studio show which beats were reused or redrawn.
- **`loom/checks/manim_colours.py`:** refuses fixed colours in Manim scenes (scenes gate and bridge);
  per-line opt-out with a reason.
- **CLI:** `manim <id> [--draft] [--force] [--jobs]`, `cache status|prune`, `verify <id> [--from --to]`.
  `util.file_lock`.
- **Other:** `.gitignore` covers `cache/`. Docs: `docs/MANIM.md`. 34 tests.

## 2026-09-30 - brand on any style, and the Loom Studio P0 (run R-9)
- **`loom/brand.py`:** brand files `packs/brands/<id>/brand.json` (colours, fonts, logo, rules, locks) layered
  on any style.
  - `apply_brand`: tokens, faces, and the `brandlabel` role.
  - A lint matrix per style, with suggested passing shades.
  - Logo payload: aspect, a dark variant or a plate.
  - `preview` (a 6-template grid per style, from real lesson props).
  - `restyle`: optional fork; narration kept; Manim re-render; quick check; 6 frames; tweak tasks for
    failing beats; a RUN_LOG line.
- **Runtime:** `Loom.brandLayer` places the logo in the band outside the content, always or intro/outro,
  and moves the section label for a top-left logo.
- **Compose:** applies the brand, and a brand captions rule overrides the lesson. Fonts can come from brand
  files.
- **Gate:** the storyboard refuses an unknown or invalid brand, and a merged look that fails contrast in
  that style.
- **CLI:** `brand list|lint|preview`, `restyle`, `studio`. The QA check has a quick mode (`run_hf=False`,
  `sheets=False`).
- **`loom/studio/`:** a local web app (standard library, 127.0.0.1). Brand kits with live contrast and
  one-click fixes; logo and dark-logo upload; placement capped to the band; lock/unlock; per-style
  preview jobs; a lessons view that blocks unreadable combinations; apply look (optionally on a copy);
  render.
- **Demo brand:** `packs/brands/harbor-labs` (fictional). Docs: `docs/BRANDS.md`.
- **Tests:** 28.

## 2026-09-30 - Engineering and Line Art styles (run R-8)
- **New packs:**
  - `engineering`: technical-documentation look; mono labels and captions; dot grid; blueprint blue with
    syntax accents.
  - `line-art`: monoline outlines, where colour lives in the line.
- **New `line` shading grammar** (`kit.lineShape`; rect, disc, pill and polygon are line-aware), and
  `kit.sketch` draws line-art in the line style.
- **`fonts.roles`** maps a type role to another face.
- `Loom.style.outlined()` for grammars where fills are outlines (sketch, line).
- **Template fixes:** process.flow labels measured (up to 2 lines); hero.character_moment idea element
  box made truthful; horizontal spill tolerance max(2px, 0.8%).
- **Proven:** both lessons restyled into both new packs with 0 errors and no model calls. Demo frames in
  `docs/styles/demos/`.
- **Tests:** 26.

## 2026-09-30 - measured layout, portable styles, style strategy (runs R-6, R-7)
- **Measured text layout** (`runtime/kit.js`, `docs/LAYOUT.md`):
  - `kit.measure` counts tracking;
  - baselines use the face's real ascent and descent (CSS-like), replacing the fixed 0.8 x size;
  - `kit.fit` measures without drawing, for measure-then-draw.
- **New check errors, from the browser's glyph boxes:**
  - `text_spill` (text leaves its box);
  - `text_outside_element` (text leaves its `ctx.el`);
  - `tight_inset` (text closer than max(6px, 0.2 x size) to the card it sits on).
  - Each was measured as a warning on both lessons before being made an error.
- **Truthful element boxes** in process.flow, recap, hero.journey and the presenter title; kickers grow
  their element.
- **Quiz question and answer cards** (and the explanation card) are sized from their measured text with a
  20px inset; the pause bar is taller.
- **Scenes:** b13 term box (tweak-05 and tweak-06); b13 card and pill, and the b25/b28 owner chips
  (Sonnet, measure-then-draw).
- **COMPONENTS.md example** rewritten measure-first; the old one is kept, marked superseded.
- **Both lessons re-rendered** with the fixed layout. Their frames match the checked preview: 88/88 and
  73/73. The earlier MP4s are in `projects/*/renders/archive/*-before-R6.*`.
- **`kit.sketch` in non-sketch styles** draws the crisp equivalent (D-27). A zero-model restyle of
  blameless to corporate-clean went from 28 errors to 5 (L-56 open).
- **`docs/strategy/2026-09-30-styles-reuse-and-users.md`:** proposals P-1 to P-3, pending.
- **Tests:** 25.

## 2026-09-30 - template promotion, sample-text detector, context layer (run R-5)
- **Sample-text detector** (`loom/checks/text_audit.py`, run by `check`): every word a template, blueprint
  or avatar beat draws must come from its props or declared chrome (`chrome: [...]`, or `chrome: true` on
  a structural default).
  - Proven on a composed lesson: a hard-coded "Build the mental model" failed `check`, and passed once it
    moved into a prop.
  - The runtime report keeps up to 400 characters of each text (it was 80, which caused false positives).
- **Beat designs become templates** (`loom/library.py`):
  - `// @design id: idea` tags; `_continued` is not counted.
  - Assessed at `library.template_promote_after` distinct uses (default 2).
  - A strict assessment, including a blind `selection_test`.
  - A build-tier promotion through `loom-template-author`.
  - `library accept design:<id>` gates it:
    - no text defaults except chrome;
    - the example and fixtures match the schema;
    - an automatic max-words stress case;
    - every case in every style with 0 errors and 0 leaked words.
  - Then the blind storyboard-tier pick: at least 2 of 3 targets and 0 of 2 decoys, with picked props that
    validate and render.
  - Until then the template is a hidden candidate (`catalog.md` omits it; the storyboard gate refuses it).
    A template changed after it was built is re-proved.
- **Distinct-use counting:** same-lesson scenes re-drawing the same content count once (L-32).
- **Library lock:** `library accept` and harvest writes take `library/.decisions.lock` (re-entrant; a stale
  lock breaks after 10 minutes) (L-38).
- **`m.draw` accepts a whole `kit.arrow` result** and lands the head at `headAt` (0.9) of the draw (L-33).
  The flow template uses it; the render is unchanged (MP4 88/88).
- **Tags:** L-31 splits applied (`tilted_note`, `summary_tag`, `unknown_ring`, `empty_frame`,
  `empty_slot_row`); 15 scenes tagged with `@design`; `attention_converges` deferred.
- **Proof** `library/proofs/2026-09-30-template-promotion/` (archived, not live): `cause.converge` was
  built, picked blind, caught overflowing at a type floor, fixed, and promoted in an isolated copy.
- **Context layer** `docs/context/` (README, STATE, DECISIONS ledger F-1 to F-15 and D-1 to D-22, RUNS
  R-1 to R-5, MANIFEST), plus `tools/context_check.py` (live facts; fails on doc drift, deleted logs,
  duplicate ids, or a write into RedTee) and `tools/engine_hash.py`.
  - The first check found the README claiming 15 tests (it was 23); fixed.
- **Rule 9** in CLAUDE.md and AGENTS.md: context managed, logs append-only.
- **Tests:** 24.

## 2026-09-30 - element library: small reusable components, promoted only when they earn it
- `runtime/components.js`: `Loom.component` registry and `ctx.use(id, params, opts)`.
  - A component fixes an idea and an outline. Params, slots, returned parts and local
    `Loom.component.variant` stay adjustable at the point of use, so no regeneration is needed.
  - Content params (the words and numbers on screen) can never have defaults.
  - Versions: `id` is the latest and `id@n` is pinned.
  - Invalid params report an error and draw nothing.
- `// @form id: idea` tags in scenes are counted by `loom library harvest`, which `go` runs after render.
  - At `library.promote_after` uses (3, from any lessons) a plan-tier assessment decides promote, defer,
    reject or merge.
  - A promote needs high confidence, a topic-independent idea, seen variation and 3 or more concrete
    future topics.
  - A build-tier promotion then writes the component plus fixtures, gated by `library accept`. That
    checks content defaults, banned JS, `promoted_from` and 3 or more distinct-content cases, and renders
    every case in every style pack with zero runtime errors (`library/sheets/<id>.jpg`).
  - This is automatic, with no human gate. Existing scenes are never rewritten.
- Scenes gate: malformed `@form` tags and `ctx.use` of an unknown component are errors; untagged scenes
  get a warning.
- Scene task files now list the style's type ranges (L-12) and the Components section of the catalog.
- `library backfill` / `verify-backfill`: tag old scenes with comments only. The gate compares code with
  comments stripped.
- Backfilled 15 scenes from 2 lessons: 33 forms, 5 reached 3 uses. All 5 were assessed, with 0 promoted
  (3 rejected, 2 deferred). See docs/AGENT_LEARNINGS.md, run 3.
- Tests: 19 (component registry, library counting and assessment strictness, scenes gate on components).

## 2026-09-30 - fixes found by the blameless-postmortem run (whiteboard style)
- Sketch mode: dark fills become paper-filled outlines; knockout text colours render as ink (speech
  bubbles, thought bubbles and document pages were illegible hachure blocks). New `shape.sketch.fillOpacity`
  (whiteboard: 0.45). Thought cloud draws as one silhouette in sketch mode.
- `kit.kicker` grows its box to hold one line at the label floor (whiteboard's 28px floor overflowed 36px).
- `kit.text`: a requested size below the role floor now starts at the floor (warns) instead of failing.
- `kit.disc` accepts `fill: "none"`.
- `document.page` lines leave with their page (exit "none" left them on screen in the next beat).
- Camera `push`: pivots so the scene's content stays inside the safe box (it drove top-aligned kickers into
  the section chrome); pushes less if no pivot fits.
- Whiteboard captions: pill opacity 0.95 so the active word passes 3:1.
- Gates: scenes gate rejects a non-literal `ctx.cue()` argument; props gate supports `requires`
  (quiz.answer `why_not` now requires `tempting`). New test (16 total).
- `verify_render`: a preview frame only counts as a mismatch if no encoded frame within +-3 frames matches
  it (four false positives at fast moves); proven still to fail on a masked frame.
- docs/AGENT_LEARNINGS.md: issues, decisions and approach from both runs, with OPEN items for the agents.

## 2026-09-29 - Loom 0.1.0
- First release: stage graph (brief -> knowledge -> pedagogy -> persona -> script -> allocate -> storyboard
  -> narrate -> scenes -> compose -> check -> review -> render), agent mode + API mode.
- Canvas runtime: world/stations/camera with zoom-throughs, held/travelling/retiring elements, motion
  vocabulary, 17 templates, 5 motion blueprints, presenter, captions, section chrome, ambient fields.
- Style packs: flat-cosmos, editorial-paper, whiteboard, corporate-clean, dark-technical (contrast-linted).
- Narration: Kokoro (default, local), OpenAI and ElevenLabs adapters; phrase-exact timings; automatic
  speaking-rate calibration; synthesised music bed + SFX; -16 LUFS.
- Manim bridge (transparent clips in the canvas, injected timing/palette/fonts); RedTee blueprint bridge
  (read-only).
- Gates: brief, knowledge, pedagogy, persona, script, storyboard, scenes, runtime probe, HyperFrames
  check, static holds, budget, render-vs-preview verification. 15 offline tests.
- Demo: projects/spacing-sticks (4:11).
