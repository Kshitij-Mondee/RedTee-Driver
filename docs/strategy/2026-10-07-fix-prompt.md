# Prompt: fix every defect found in the 2026-10-06 bench videos (for Claude Code)

STATUS: PROMPT (written 2026-10-07). Paste the block below into Claude Code opened in the Video-Engine folder.
Run this BEFORE `docs/strategy/2026-10-07-claude-code-provider-run-prompt.md`. Findings it fixes:
`docs/research/2026-10-07-bench-postmortem.md` (RC1 to RC20).

---

```
You are working in the Loom Video-Engine folder. Read CLAUDE.md (Rule 0 and its addendum in particular),
docs/context/README.md, docs/AGENT_LEARNINGS.md, docs/SCENE_API.md, and
docs/research/2026-10-07-bench-postmortem.md in full before touching code. That post-mortem lists 20 root causes
(RC1 to RC20) with file:line and measured evidence. Your job: fix every one, with a test that FAILS on today's
code and passes after, prove the fixes on the five bench projects without paid model calls, and log it.
Windows, Git Bash: `py`, forward slashes.

RULES
- Rule 0: every claim needs a run. Prove each new test fails on the old code (run it before the fix, or revert the
  fix once and see red). A check whose denominator is zero is red. A new checker is a ratchet before it is a gate:
  record a baseline for old lessons, fail only on growth, and look at frames of any old lesson it flags (a finding
  on reviewed work is a candidate tool bug first).
- Determinism: frames are a pure function of (manifest, time). No Math.random, Date, timers.
- Never hand-edit generated files (runtime/catalog.*, projects/*/build, qa, audio, library generated files,
  docs/assets/WORLD_PACKS.md, datasets/). Regenerate them with their command.
- Never modify the five bench projects in place. Fork them (see PROOF) and work on the forks.
- Logs are append-only. No em or en dashes anywhere. RedTee_V1_Video is read-only. No Opus calls. No downloads
  without asking me.
- The test suite must stay offline and keyless. Browser tests skip with a named reason when no browser exists.

STEP 0. Baseline and safety
1. If the folder is a git repo, commit or stash nothing of mine; just note `git status`. If it is not, copy
   runtime/, loom/, tools/, tests/, packs/, prompts/ to ../Video-Engine-backup-2026-10-07/ so every change can be
   diffed and reverted.
2. IMPORTANT, found later the same day: the four agents of the cut-off session kept running and landed much of
   workstreams 1 to 4 IN PLACE, with no CHANGELOG or learnings entries and no report: for example
   tests/suites/runtime_film_defects.py, templates_film_defects.py, checks_film_defects.py, planLife and lifeT in
   runtime/world.js, the neighbours and length_min changes in loom/agents/conductor.py, a `caption_active` palette
   token in several packs, a caption check in loom/checks/style_lint.py and tools/caption_contrast.py (the test
   count went from 167 to about 200). Treat ALL of it as unreviewed work: for every RC item below, check whether it
   is done, whether its test exists and fails on the old code (use the backup or the agents' scratch copies), and
   whether it is correct; finish what is missing, fix what is wrong, then log it. Five style passes (docs/styles/
   guides/*.md and edits to packs corporate-clean, story-cartoon, glow-flat, cinematic-noir, whiteboard) also
   landed today and are intended: keep them.
   Earlier note, still valid: an earlier session was cut off while four agents edited files in parallel. Find any file changed after
   docs/strategy/2026-10-07-claude-code-provider-run-prompt.md was written
   (`find . -newer docs/strategy/2026-10-07-claude-code-provider-run-prompt.md -type f -not -path "./projects/*"
   -not -name "*.pyc"`). For each one in runtime/, loom/, tools/, tests/: read the change, keep it only if it is
   a correct part of the fixes below and its test passes; otherwise revert it from the backup. Report the list.
3. Run `py tests/run_tests.py` and `py tests/run_tests.py --browser` (if Chrome is available) and save the output
   as the baseline. Run `py tools/context_check.py`.
4. Optional prototypes from the analysis (they may no longer exist; do not depend on them):
   C:/Users/Admin/AppData/Local/Packages/Claude_pzs8sxrjxfjjc/LocalCache/Roaming/Claude/local-agent-mode-sessions/
   076b4394-fb26-4da7-b38f-4718690cecb3/f6167fbc-df11-4e25-851e-e1752bb12a7a/f035b1ff/outputs/rc1 .. rc4
   (patch_blur.py, patch_lead.py, rc2/patch_world.py, rc2/framing_gate.py, rc2/probe_patched.mjs,
   rc3/rc3_runtime.patch, rc3/test_element_life.py, rc3/foreign.mjs, rc1/invariants.mjs, rc4/length.py,
   rc4/cast_check.py). Read them as hints; re-verify everything.

WORKSTREAM 1. Runtime (runtime/world.js, motion.js, core.js, rig.js, fx.js, boot.js)
1. RC1 element life: add Wd.planLife. Every element's outer group is display:none outside its life window: from
   the start of its beat's join (the cover midpoint for screen joins) to the end of the join after its last holder
   (keep and ctx.held extend it). Exempt: motifs, the presenter overlay, chapter chrome, and scenery explicitly
   declared persistent for its station. Report lifeT per element. Check no template measures a bounding box of a
   hidden element at frame time (getBBox returns 0 under display:none); fix any that does.
2. RC2: an unkept element with exit "none" or "held" gets a real recede at continue and cut joins.
3. RC3: a thrown scene is marked broken; if it drew nothing, the beat shows a fallback card with its own narration
   words; scene_threw and tween_threw stay ERRORS. Make ctx.held name matching case-insensitive with a warning
   (claude b02/b03 "Priya" vs "priya"), and make ctx.el accept an element as `parent` (claude b17) or throw a clear
   message naming the beat.
4. RC4: in m.draw, filled paths start at fill-opacity 0 and land at 0.9 of the draw.
5. RC6: planJoins exits a leader's followers with it and skips elements already exited in the same pass.
6. RC7: one blur filter per scene group, raised only while a LATER backplate covers that group; a per-station list
   of raised filters is lowered when a non-backplated beat takes over. Invariant: at every beat's midpoint the live
   beat's own group has blur 0.
7. RC9: nested stations always use 1920x1080 local space (`s.parent ? W : (s.w || W)`, same for h), with
   Loom.warn("station_size_ignored").
8. RC10: for kinds template, blueprint, redtee and avatar, drop shot.focus and shot.zoom and
   Loom.warn("shot_framing_ignored", beat). Bespoke beats keep focus (the probe in WS3 catches crops).
9. RC12: Loom.warn("figure_cropped", beat) when a figure's top or side leaves the frame at its settled time.
10. RC13: fxMoment keeps the world rect and resolves the screen rect at draw time via Wd.cameraAt(t0).
11. RC14: a backplated template over held text-like elements (template pages, cards, text) uses the 0.94 veil;
    `keep` counts as "over a picture" only for names that resolve to an element.
Test file: tests/suites/runtime_film_defects.py. Minimum: a synthetic 5-beat manifest on one station with an
element that has no entrance, one with exit none, a scene that throws, a timeline arrow, and two backplated
templates in a row; assert by pixels (element region vs the same frame with all scene groups hidden) that nothing
shows outside its life, the live beat is never blurred, the spotlight rect is on screen, and seeks in shuffled
order give identical frames.

WORKSTREAM 2. Templates (runtime/templates/**, hero blueprints, runtime/overlay.js; then regenerate the catalog)
1. RC8: wire H.lead into compare.two, document.page (including appear mode), process.flow, timeline body and every
   hero blueprint, so each shows its structure by speech_start + lead with words still highlighted on their cue.
   Compute compare.two's first side without calling ctx.cue twice. Test: every catalog template and blueprint with
   its sample props has its first element revealed by speech_start + lead_s + 0.35.
2. RC6: document.page lines are followers of the page.
3. RC16: add an `empty: true` slot item (an empty ruled line or dashed slot, no words) to compare.two and
   document.page.
4. RC19: split compare.two `tone` into `verdict: right|wrong|none` (draws the mark) and `valence: pos|neg|neutral`
   (colour only). `tone` stays as a deprecated alias for valence with NO mark. Add `stance: myth|fact|none` to
   document.page and compare.two sides (a myth renders with a "myth" label and struck styling). Review quiz reveal
   and recap for the same mix-up.
5. RC17: the avatar kind gets a real props spec (title, kicker, and an optional card of up to 3 short lines laid
   out in the empty side); unknown keys are an error (avatar_props_unknown); the disc shrinks when a card is present.
6. RC20 (runtime side): if the pack's active caption colour is below 4.5:1 against the pill composited over the
   field, use a light fallback and warn once.
7. RC18 (runtime side): template and blueprint person props accept `cast: "<name>"`; the look (rig or member,
   skin, cloth) is resolved from the storyboard's story.cast, never from side or defaults.
Test file: tests/suites/templates_film_defects.py.

WORKSTREAM 3. Checks and render (tools/node/probe.mjs, loom/checks/film.py, qa.py, render.py, flow.py,
ledger.py, style_lint.py, packs/styles caption colours, tools/film_audit.py; render/run argument lines in
loom/cli.py)
1. Probe blind spots (RC10 to RC12): count wholly off-frame text of a beat's OWN elements as cut (held ones warn);
   stop counting empty station <svg>/<g> as paint; add an element pass (own and held top-level elements visible
   >= 0.6 at the settled time, exempt scenery, presenter, motif, chapter, data-bleed): error on an element more
   than 15 % off-frame or carrying a wholly-off word; for figures, error on a top or side crop over 24 px.
   Ratchet with a baseline of old lessons (the analysis flagged groupthink-trap 6 beats, phishing-report b05 b16,
   quick-question-cost b03 b10, stress-signal b10, mfa-explained b07 b10: look at their frames and decide tool bug
   or real).
2. Foreign pixels (RC1, RC2): at each beat's settled time hide every scene group except the active beat and what it
   holds, diff; error above 300 px at 1080p. Record check: every element has lifeT.
3. Blur (RC7): a separate "blurred_beat" measure (Laplacian variance of the frame while the beat's text is
   visible), never suppressed by hold or rest intents. "empty frame" stays for frames that are meant to have
   content and do not.
4. Render integrity: stamp a build hash that covers runtime JS into the segment folder and delete segments when it
   differs (the claude MP4 was two builds spliced). verify_render: a mismatch share above 10 % fails the render.
5. Force: `render --force` requires `--reason`; the override records the error count and the checked build hash;
   it refuses when the build changed after the check, and refuses outright on scene_threw or tween_threw. Log
   overrides for flow.mark_done and --keep in the decision ledger.
6. RC20 lint: captions.active vs pill >= 4.5 and captions.fg vs pill >= 7 in lint_style. Fix the six packs that
   fail today (cinematic-dawn, story-cartoon, corporate-clean, editorial-paper, engineering, line-art) with a light
   active colour that keeps each pack's look; print the ratios.
7. ledger.py: give "words cut", off-frame, foreign pixels and blurred_beat their own categories (not "other").
8. tools/film_audit.py: use the foreign-pixel and blur measures, report preshown elements (revealT None, excluding
   scenery, motif, presenter) and unkept exit-none elements; assert non-empty denominators.
Test file: tests/suites/checks_film_defects.py, including one test per new check that runs it on a fixture with
the defect (red) and without (green).

WORKSTREAM 4. Pipeline (loom/checks/gates.py, text_audit.py, story.py, loom/stages.py, loom/agents/** except
loom/agents/llm/**, prompts/*.md, schemas, docs/STORYBOARD_GUIDE.md, docs/SCENE_API.md sections you change)
1. RC15 length: storyboard and outline task messages carry length_min (`conductor.py:102`); pedagogy must state
   the requested length; script tolerance 1.3x; recalibrate the duration estimate on the five benches (they
   under-read by 6 to 16 %; print the new formula and its error per bench); script error when beats exceed
   ceil(8 x length_min x 1.25); a narrate-stage error when audio/timings.json duration > 1.3 x length_min x 60
   (wire it where narrate is accepted).
2. Framing gates (RC9, RC10): storyboard error on a nested station declaring w/h and on focus or zoom on a
   template, blueprint, redtee or avatar beat; error on keep names no earlier beat can provide where determinable;
   warning on keeping a template container (RC5).
3. RC17 variety: cap uses per template id at max(2, ceil(0.15 x beats)); warn on A-B-A-B ping-pong; a hybrid beat
   that is a plain template must declare its motion layer; validate avatar props against the new spec.
4. RC16 text: storyboard prop lint errors on text with no letters and on meta words (blank, empty, placeholder,
   left empty, kept private, TBD, lorem, sample) and points to `empty: true`. Extend text_audit to bespoke scenes
   as a lesson-vocabulary audit (drawn words must come from the script, storyboard or knowledge), as a ratchet; it
   must flag mixed-value b11/b13 "In yesterday's release planning meeting,".
5. RC16 scene context: the scene task message carries the held elements it may use (names, kinds, owning beat),
   the previous and next beats' narration and element lists, and story.cast. Make scene.md match. Role card line:
   a held-or-create fallback never invents facts; it draws only from the beat's own narration.
6. RC18 cast: story.cast is required when people appear; each name has one look (rig or member, skin, cloth). A
   check (storyboard plus scenes/*.js scan for ctx.character and kit.peep) errors when one name gets two looks.
7. RC19 critic: the critic runs (findings only, routed) even when the check fails; its message carries each
   beat's narration and on-screen props; no 40-sheet cap (batch); rubric line "the picture agrees with the
   narration: polarity, labels, which side is right or wrong". `agents run` always runs it.
8. Router: route the new error kinds: blurred_beat, foreign_pixels, station_size_ignored, shot_framing_ignored to
   the engine or storyboard (not scene authors); element off-frame and figure_cropped to the storyboard if the shot
   causes it, else the scene; scene_threw and tween_threw to the scene owner; the words_cut fix text names the
   framing causes.
Test file: tests/suites/pipeline_film_defects.py.

WORKSTREAM 5. Capabilities the API pipeline cannot reach (post-mortem section M)
First measure, from the five benches' logs/traces: per role, which tools were called and how often
(get_api_section names, get_example_scene tags, catalog_search queries, lab_snapshot). Report it.
1. Manim, Skia and Three in the API path: today conductor.scenes() skips every kind but bespoke
   (`conductor.py:404-405`, "Manim scenes stay in agent mode") and the router sends them to "engine"
   (`router.py:78`), while the storyboard card offers them (`roles/storyboard.md:18-27`). Add scene workers for
   kind manim (a LoomScene file or a manim blueprint with params), skia and three, with role cards built from
   skills/loom/loom-scene-author and docs/SCENE_API.md, a render tool that makes a draft clip and returns frames
   (reuse the Manim draft path and the shared clip store), and their gates. Until a kind has a worker, the
   storyboard gate must refuse it on the API path with a clear message (never a silently empty beat).
2. Discovery: catalog_search covers only templates, blueprints and components (`tools.py:163-169`). Add a
   `capabilities` tool (or extend catalog_search) that lists, with one line on when to use each: character rigs
   and kits, places and scenery, object grammars (Loom.obj), Loom.data pictures, depth (2.5D), isometric, fx
   moments (light, glow, spotlight), Lottie, Loom.ui artefacts, the TED-Ed primitives (morph, stepped, swap slot,
   material wipes, magnifier), world packs, and manim/skia/three once item 1 lands. Generate it from the code and
   catalog (a generated file with a test that it lists every runtime module), never by hand.
3. The storyboard card's builder choice (`roles/storyboard.md` section 4 step 2) names only template, blueprint,
   bespoke, manim and avatar: rewrite it as a decision table covering every capability in item 2 (when each is
   the right picture, with one example), and make the scene card list every SCENE_API section by name.
4. The storyboard agent submits blind: give it the animatic (py -m loom animatic) as images after its first
   submit and one revision round, as Cowork does.
5. Allocation: the bench mix (template 0.5, `bench.py:97`) is followed beat for beat (L-240). For agents runs,
   the mix is a ceiling for templates, not a quota, and the report states the share of each capability used.
Test: a mock run whose storyboard asks for one manim, one skia and one three beat produces three clip files (or,
before item 1, a gate refusal); the capabilities tool lists every module under runtime/ that exports a builder.

WORKSTREAM 6. Style system: make the five style guides true in the runtime, and prove the styles on Chrome
Five styles got a precise guide today (docs/styles/guides/{corporate-clean,story-cartoon,glow-flat,cinematic-noir,
whiteboard}.md, two review rounds each) plus pack fixes and two example scenes each
(scenes_examples/style_<style>_*.js). Read docs/styles/guides/README.md and all five guides, section 15 first:
every guide lists the engine requests it depends on and the fallback it uses until each lands. Nothing in them has
been seen on a Chrome render yet (the sandbox had no browser): you are the first to render them.
1. Shared runtime changes (one name each, used by all five guides):
   - pack `materials: {wood, chair, screen}` read by runtime/places.js and scenery.js instead of hard-coded
     "accent" (desks, shelves, chairs, monitor screens, books); default stays "accent" so other packs do not move;
     set the five packs' values from their guides' section 15;
   - pack `roles: {kicker, term, verdict, date, quiz_letter, recap_rule, stat_value, chapter_kicker, ui_mark, link,
     button, me_bubble, person_cloth}` read by kit.kicker, the templates, data.js and Loom.ui as their default
     colours (defaults = today's tokens); set the five packs' values from their guides;
   - `fx.spotlight: {strength, tint}` and `fx.vignette_under: true|false` in fx.js; `characters.bottom` in rig.js;
   - "M.travel drive key": a second m.travel on one element no longer renders its start state at load;
   - "m.draw stroke-first": strokes before fills (hachure), each path keeps its own opacity, dashes survive;
   - "font weight clamp": kit.text and the overlay never ask for a weight the pack did not load (no synthetic
     bold; Patrick Hand has 400 only); Loom.ui measures text at the weight it draws;
   - "loom lab --file": `py -m loom lab --file <scene.js> --style <id>` with the `@lab` cue map, so the example
     scenes render with their real cue times.
2. Style-specific requests from the guides (each guide's section 15): glow (glowDisc as a radialGradient, burst and
   vortex default colours, gloss shading toward deep or plum); noir (depth cone and glow z option with unique
   gradient ids, Loom.ui avatar and me-bubble tones, nebula mix scaled by intensity); whiteboard (rough arrows with
   open heads in sketch shading, rounded rects and pills in sketch, places/objects/data fills through kit.sketch
   with no contact shadows, a sketched document.page band); story-cartoon (a paper document.page in light
   illustrated packs, contact shadows under rigs and furniture); corporate (Loom.data.counter uses the pack's count
   duration, dipLine default colour not neg). Do the S-sized ones; list the M and L ones in WALLS_AND_NEEDS.md.
3. Pipeline wiring: every pack with a guide carries `"guide"`; the API storyboard and scene agents get the guide
   (get_style_pack returns it, and parity context includes it for those stages); Cowork task files name it
   (loom/stages.py); context_check compares each guide's palette table with its pack and fails on drift.
4. Proof per style, on Chrome (this is where "polished" is decided): for each of the five styles render, with
   `--style <id>`: lab_tpl_definition, lab_ui_artefacts, lab_matrix_build, lab_story_set, lab_characters, lab_data,
   lab_props_people, lab_depth (noir), lab_fx, and the style's two example scenes with `--file`. Save the strips
   to docs/styles/demos/guides/<id>/. LOOK at every strip and run the guide's section 13 polish checklist on it;
   fix what fails (in the runtime, the pack, or the example scene) and re-render until every item passes or is a
   listed gap. Then update each guide's "not verified" notes with what you saw. Encode one example scene per style
   to H.264 (crf 18) and check the darks, gradients and grain the guide talks about.
Tests: tests/suites/style_system.py (materials and roles defaults leave untouched packs byte-identical in the
composed page; a pack setting materials.wood changes the desk colour; no synthetic bold for any pack and role;
lab --file resolves literal cues; context_check catches a changed hex).

PROOF (no paid model calls)
1. Fork each bench project to a new id without touching the original (use `py -m loom restyle <id> --as <new id>`
   with the same style if that copies plan and scenes; otherwise copy the folder to projects/<new id>/ and fix the
   id in project.json). Recompose and run check on each fork.
2. Report per fork, before (original qa) and after: self-blurred beats (Laplacian variance), foreign-pixel beats,
   elements off-frame, late first reveal per template beat, dim moments off-screen, check error kinds and counts.
   Expected: blur, foreign pixels, off-frame templates, nested-station blanks and dim flashes go to 0. The
   storyboard gates SHOULD now reject these storyboards (length, focus on templates, keep names, variety): list
   those errors per bench; that is the gate working, not a regression.
3. Render the openai-balanced fork and the claude-balanced fork (`render --force --reason "post-fix proof"` is
   allowed here only because the storyboard gates now reject the old plans by design), extract one frame every 2 s,
   and LOOK at every beat. Write what you saw per beat in qa/post_fix_review.md of each fork.
4. Run the demo lesson and two recent good lessons (pick from docs/context/RUNS.md) through check: no new false
   errors, or a recorded baseline with the reason.
5. Full suite with and without --browser; context_check.

LOGS
- CHANGELOG entry; L- entries in docs/AGENT_LEARNINGS.md (one per root-cause family: element life, blur, framing,
  lead, check blindness, force render and stale segments, length, scene context and invented text, variety, cast,
  polarity and critic, caption contrast); a D- entry for: force render needs a reason and is refused on thrown
  scenes; focus ignored on frame-layout beats; story.cast required with people. Update docs/context/STATE.md,
  docs/SCENE_API.md, docs/STORYBOARD_GUIDE.md and the runbook where behaviour changed.
- Write docs/research/2026-10-0X-bench-fix-report.md: per RC the fix (file:line), the test, before/after numbers,
  and what is still unverified.

FINAL MESSAGE TO ME
Per RC: fixed or not, the test name, the before/after number. The suite totals. The frames you looked at and what
you saw. Anything you could not fix or verify. Do not start the claude_code provider or any paid run; that is the
next prompt.
```
