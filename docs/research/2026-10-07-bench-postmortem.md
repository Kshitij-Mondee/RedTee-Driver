# Post-mortem: the five bench videos of 2026-10-06 (why they were bad)

STATUS: FINDINGS (2026-10-07). Fixes are NOT applied yet; the fix prompt is
`docs/strategy/2026-10-07-fix-prompt.md`. Every root cause below was found by an investigator that measured it
(Chrome probes of the composed builds, Laplacian variance and pixel diffs on MP4 frames, logs). Fixes were
prototyped on scratch copies only; nothing in the engine was changed by this analysis.

Projects: `projects/bench-20261006-151439-{claude-balanced,openai-balanced,gemini-balanced,mixed-value,budget}`.
Topic "How to give feedback that changes behaviour, not just feelings", 2 minutes requested, story-cartoon style.

## 1. Ratings (frame review, 1 = unusable, 3 = passable, 5 = studio)

Rated by review agents from contact sheets (one frame every 3 s) plus the narration per beat. These are NOT
Kshitij's ratings, and an agent's eye has not matched his before (L-247); read them as defect counts, not taste.

| video | length (asked 120 s) | craft | teaching clarity | continuity | pacing | overall |
|---|---|---|---|---|---|---|
| claude-balanced | 474 s | 2 | 2 | 1 | 1 | 1 to 1.5 |
| openai-balanced | 683 s | 2 | 2 | 1 | 2 | 1.5 |
| gemini-balanced | 306 s | 2 | 2 | 2 | 1 | 1.5 to 2 |
| mixed-value | 478 s | 2 | 2 | 1 | 2 | 2 |
| budget | 384 s | 2 | 2 | 1 | 2 | 2 |

Defect counts by beat (from the reviews):

| video | beats | stuck | preshown | empty | repeat | static | picture contradicts narration |
|---|---|---|---|---|---|---|---|
| claude | 54 | 22 | 20 | 10 | 19 | 26 | 26 |
| openai | 52 | 5 | 0 | 15 | 9 | 10 | 8 |
| gemini | 35 | 1 to 4 | 0 | 14 | 6 | 14 | 19 |
| mixed | 44 | 11 | 0 | 9 | 8 | 14 | 8 |
| budget | 26 | 6 | 3 | 9 | 6 | 14 | 7 |

What worked, in every video: the quiz runs (claude b34-b38, mixed b23/b26/b27), single clean definition and
worksheet cards, one process flow (budget b07), the camera viewfinder idea (claude b12).

## 2. The first fact: none of these runs had yesterday's pipeline, and all five were force-rendered

- The last model call was 2026-10-06 20:20; the router, parity context, snapshot-before-submit and repair rounds
  landed after 22:05. Scene workers in claude-balanced called `lab_snapshot` 0 times in 25 submits. No critic ran
  (0 calls), no defect routing ran (no `qa/defects.json`).
- Every check FAILED (35, 327, 29, 129, 72 errors) and the pipeline stopped. Each MP4 exists because of a human
  `render --force` (decision ledger `override render force_render`, 2026-10-06 19:26 to 2026-10-07 15:55).
- The claude-balanced MP4 is two builds spliced: segments for 0 to 180 s came from the runtime before the L-246
  guard, because the render resumes segments keyed only on `index.html`. Its first three minutes do not match its
  build.

So the checks saw most of this and were overridden; the rest the checks could not see. Both are fixed below.

## 3. Root causes, by symptom

### A. Elements stuck on screen after their beat, and elements shown before their beat (the "stuck card" problem)

- **RC1. No hidden state without an entrance** (`runtime/world.js:177`, `core.js:88-95`, `world.js:458-483`).
  All beats of a station are built at load into one SVG; only an entrance tween hides an element before its beat.
  Sets, characters, held-or-create fallbacks and anything built by a scene that threw have no entrance, so they
  are visible from t=0 whenever their station (or its parent) is on screen. Measured foreign pixels (painted by a
  beat that is not active): claude b01-b04 22 % (b52's room set and people on top), b48-b49 up to 60 %, b05/b11/b14
  about 40 % (b17); budget b12-b13 about 40 % (b14's "Agreed habit"); mixed b08-b22 13 to 59 %.
- **RC2. `exit: "none"` means never** (`motion.js:237`, `world.js:449-453`): sets exitT but no tween, and nothing
  hides it later. Claude b17's empty red block over b22-b32 and b53-b54; mixed "Project update/Feedback draft"
  panels under b10-b22; budget b14 pieces.
- **RC3. A thrown scene renders silently** (`world.js:341-343`): `scene_threw` is logged and the beat shows other
  beats' leftovers; `tween_threw` switches the callback off so things never move. Causes in scene code: claude
  b17 passed an element as `parent`, b02/b03 held "Priya"/"Dev" while b01 named them "priya"/"dev"; openai b02 null
  held element; mixed b13.
- **RC4. `m.draw` leaves filled paths visible** (`motion.js:90`): the dash hides strokes only, so arrow heads of
  later timelines show early (gemini b28).
- **RC5. Keeping a template's container keeps an empty husk** (openai b13): `keep: ["page"]` holds the card frame
  while its lines exit. 268 `held_missing` errors in openai came from keep lists naming parts that never existed.
- **RC6. Highlight bars float after their card** (mixed 207 s, 354 s): document.page lines are siblings of the page
  and exit 0.05 s apart in build order.

### B. Blurred beats (text unreadable for a whole beat)

- **RC7. Backplate blur lands on the live beat's own group** (`world.js:304-316`). One shared blur filter per
  station; each backplated template sets the filter on every earlier group of its station, and the shared value is
  raised to 9 during the beat. A later backplated beat therefore blurs the earlier one during its own window.
  Measured (Laplacian variance): affected beats 4 to 31, every other beat 400 or more. openai b03 b06 b08 b10 b18
  b20 b22 b24 b26 b30 b34 (the quiz) b39 b41 b43 b48; budget b22; mixed b10 b12; claude b19 b23.
- The film check saw these as "empty frame" (edge density 0) and suppressed them for hold/rest intents, so they
  were misnamed and partly hidden.

### C. Empty frames and empty first seconds

- **RC8. The lead (D-100, `templates/_helpers.js:16`) is missing in compare.two, document.page, process.flow,
  timeline and every hero blueprint.** They wait for the spoken cue, so beats open on a blank frame or an empty card
  for 1 to 7.7 s (gemini b21 7.7 s, b16 6.0 s; mixed b30 6.9 s; openai b48 4.7 s).
- **RC9. Nested stations declared with their own w/h** (`world.js:36`): gemini set 960x540 on three nested
  stations; templates still lay out at 1920x1080, so content lands 2x and mostly off-frame (gemini b16 and b31 read
  as a fully blank beat; b07, b32-b34 cropped). The gate checks `rect` but not `w/h`.
- RC3 (thrown scenes) and RC7 (self-blur) also read as empty.

### D. Content off the frame (cut words, cropped cards, cropped heads)

- **RC10. `shot.focus`/`zoom` on template beats** (`world.js:358`, `67-76`): templates lay out in the full frame
  (`kit.SAFE`), so a sub-station focus crops their own layout. openai gave every template a focus: compare.two
  shifted off the left in all 17 beats, document cards cut in 9 beats, process.flow b18; budget quiz b17.
- **RC11. A bespoke beat's focus crops held content laid out for the full frame**: budget b14, b23; claude b30
  (focus x zoom 1.8 = scale 3.9).
- **RC12. Characters taller than the frame**: bean rigs are 900 units tall, used at scale 1.1 to 1.5, placed with no
  frame check (`rig.js:59`): claude heads cut in b01-b04, b21, b47-b52.
- **The check was half blind**: `tools/node/probe.mjs:52` skips wholly off-frame text (only partly cut words
  count); `probe.mjs:67` counts an empty station `<svg>` as paint so words read as "occluded" (n = 0, never
  measured); cards, panels and characters are never checked.

### E. Unmotivated dim flashes

- **RC13. Spotlight rects resolved before the camera exists** (`world.js:249`): `fxMoment` converts the rect with
  `cameraAt(t0)` at build time, before `planJoins` fills the camera keys, so stations away from the origin get an
  off-screen hole and the shader dims the whole frame 55 % for about a second (claude 228 s, 372 s; mixed 156 s,
  348 s, 384 s; several emphasis moments silently lost too).

### F. Ghosts of the previous beat

- **RC14. The keep veil** (`world.js:286-301`): a template beat with any `keep` gets a 0.82 backplate instead of
  0.94, so the previous template's text shows through at 18 % (openai b10 b12 b48; budget b15 b24).

### G. Length (2 minutes asked, 5 to 11 minutes made)

- **RC15.** Pedagogy never received the length in two runs ("the requester supplied no target length"); the
  storyboard task filters the request on key `length` but it is `length_min` (`conductor.py:102`), so storyboard
  and outline never see it; script tolerance is 1.5x (pedagogy 1.3x); the duration estimate under-reads real
  narration by 6 to 16 %; nothing compares the narrated duration with the request; nothing caps beat count (26 to 54
  beats for 2 minutes; the card says 5 to 8 a minute). The L-236 length errors were then waived by hand
  (`mark_done`, `--keep`), and those bypasses leave no ledger entry.

### H. Invented and placeholder text

- **RC16.** mixed shows "In yesterday's release planning meeting." for 155 s: the Gemini Flash scene worker wrote
  it in a held-or-create fallback (`scenes/b11.js:63`, `b13.js:20`) with `exit: "none"`. The scene task message
  carries only the beat's own spec: no neighbours, no held elements, no cast, though `scene.md` promises
  neighbours. The sample-text audit skips bespoke scenes.
- Storyboard props describing an empty slot in words ("Blank strip", "Reply: left empty", "Request: blank") because
  compare.two and document.page have no empty-slot item; gemini "..." bubbles pass the word-count check.

### I. Sameness: a slide deck, not a film

- **RC17.** The bench mix sets template share 0.5 and is followed beat for beat; "hybrid" may be a plain template
  (`gates.py:343`); the only repetition rule warns on three identical beats in a row, so A-B-A-B alternation passes
  (openai: document.page 20x, compare.two 17x in 52 beats, 14 alternations, 0 warnings); the variety ratchet is
  warning-only. Avatar beats are a 600 px disc and two thirds empty frame: the runtime ignores the props the
  storyboards passed (`overlay.js:84-131`), and no gate validates them.

### J. Characters change between beats

- **RC18.** Nothing ties a name to a look. budget's Jordan has five forms (and changes gender); claude's Priya and
  Dev swap rigs (`pip`, `tess`, `ava`); gemini's colleague changes skin and shirt because `scenario.dialogue` colours
  people by side and `hero.character_moment` uses fixed defaults. `story.cast` is optional and only checks the rig
  exists; workers never see it.

### K. Pictures that contradict the narration

- **RC19.** compare.two `tone: "neg"` draws a red X, so "bad thing" reads as "wrong answer" (gemini b24 marks the
  correct answer with an X); no template has a myth/fact stance (gemini b21 lists the myth under "Objective
  facts"). The critic never ran; had it run, its message carries no narration or props and it sees only the first 40
  sheets.

### L. Captions

- **RC20.** The active caption word uses the pack's accent2 on the dark pill: 2.04:1 in story-cartoon (six packs
  below 3:1). The style lint never checks captions.

### M. Why no Manim, Skia, Three or other helpers were used (added after Kshitij asked, 2026-10-07)

Mostly a missing capability, partly not surfaced, and a little chosen:

- **Cannot (the API path has no way to make them).** `conductor.scenes()` writes only `bespoke` beats; manim,
  skia and three are skipped ("stay in agent mode", `conductor.py:404-405`) and the router files them under
  "engine, authored outside the API path" (`router.py:78`). Yet the storyboard card offers those kinds
  (`roles/storyboard.md:18-27`). A storyboard that chose one would get a beat nobody writes. No worker has a tool to
  render a Manim, Skia or Three clip. In Cowork I write and render those myself, which is why only Cowork lessons
  have them.
- **Not shown (the agents cannot discover most of the toolbox).** `catalog_search` covers templates, blueprints and
  components only (`tools.py:163-169`): rigs, places, object grammars, Loom.data, depth, isometric, fx moments,
  Lottie and the TED-Ed primitives are reachable only if an agent asks for the right SCENE_API section by name. The
  storyboard card's builder choice names five kinds and nothing else. These runs used the short role cards (scene
  prompt 8.5k characters), not the full Cowork reading. Whether the workers ever fetched those sections is not yet
  measured (the fix prompt asks for the tool-call counts from the traces).
- **Chose not to (pushed by settings).** The bench mix set templates to half the beats and the storyboard followed
  it as a quota (L-240); "hybrid" was allowed to be a plain template; nothing capped template reuse.
- **And it never looked.** The storyboard agent submits without seeing its animatic; in Cowork the storyboard is
  revised after looking.

Fix: workstream 5 of `docs/strategy/2026-10-07-fix-prompt.md`.

## 4. What yesterday's pipeline changes already cover, and what they do not

Covered on a new run (not yet proven on one): workers must look before submitting, check defects are routed to
their owner and fixed, the length gate refuses over-long plans, the defect router replaces `--force` as the normal
path. Not covered: RC1 to RC14 (engine), RC15 gaps (a) to (f), RC16 to RC20. Those are the fix prompt.
