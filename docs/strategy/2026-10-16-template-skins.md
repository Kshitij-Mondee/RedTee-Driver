# Template skins: each style draws the shared templates its own way (2026-10-16)

STATUS: PROPOSAL (2026-10-16, night). Nothing built. Waiting for Kshitij's go-ahead. Follows item 1 of
`docs/strategy/2026-10-16-style-adaptation-assessment.md` ("Templates per style, drawn by the style"), D-192 (essences)
and D-193 (components scoped to their styles). Each style is judged against its own purpose, never against another
style (D-122).

## What I saw (run, not read)

`docs/research/2026-10-16-template-skins/before-*.jpg`: `definition`, `list.steps` and `compare.two` rendered in the five
engine styles. Each row has two frames: mid-build (2.4 s) and the end frame (5.9 s). The script and the props (original
text) are next to the sheets (`before_sheet.py`, `before-props.json`).

- **Same layout, new colours.** All five rows have the same boxes in the same places. Only the palette and the faces
  change.
- **Fully formed, never drawn.** At mid-build every part is either whole or absent: in `list.steps` rows 1 and 2 are
  complete and rows 3 and 4 are missing, in every style, whiteboard and blueprint included. The whiteboard frames are
  rough.js sketches that fade in whole. No hand and no nib comes near them.
- **The essences already say this is wrong.** Their `avoid` lists:
  - hologram: "slide templates restyled cyan", "boxed panels of equal weight in a grid", "stock icons in circles";
  - isometric: "flat cards floating over the board", "slide templates";
  - screencast: "slide templates", "hand-drawn panels over the app";
  - blueprint: "UI cards", "templates".
- **This is what engine lessons actually show.** Template beats in the engine-style lessons on disk:
  - `blameless-postmortem` (whiteboard): 15 of 29 beats, ten templates;
  - `st-holo-ai`: 5 of 22 (compare.two, definition, quiz.question, quiz.answer);
  - nine more whiteboard lessons: 2 of 14 or 2 of 25 (the quiz pair);
  - `st-bp-cooling`, `st-iso-order`, `st-sc-2fa`: none.

  The quiz pair, `compare.two` and `definition` are the templates these styles really meet.
- **Read from the code, not seen:** the whiteboard engine's face audit (`wb_face`, `runtime/engines/whiteboard.js` 566)
  errors on any board word that is not written by the engine or set in the display face. Template body text is in the
  body face, so a template beat in a lesson that also uses the board may trip it. Not reproduced.

## The idea

A template is a **teaching contract**. It says what the parts are (term, rule, definition, example), in what order they
come, and on which spoken word each one lands. It also keeps the frame from going empty (D-100). None of that belongs to
a style.

**How a part is made** belongs to the style:
- on a whiteboard, the hand draws it;
- on a blueprint, the nib drafts it;
- in a hologram, it is projected as light;
- in isometric, it stands on the board;
- in a screencast, the product renders it.

So the 17 templates stay as they are. Each style's engine supplies a **skin**: its own way of making every part a
template asks for.

## The mechanism

### Where it plugs in (one site, plus the sheet)

Every template is built at one place: `runtime/world.js` 424 (`T.build(ctx, props)`). The template sheet's own ctx
(`loom/library.py` `_SHEET_JS`) is the second place. Every template takes its tools from the ctx (`const { kit, m } =
ctx`), and so do the helpers in `_helpers.js`. Only three spots call `Loom.svg` directly (core.js 313, more.js 61 and
101 to 108).

The plug-in has two calls:
- **Before the build:** `Loom.skins.apply(ctx, def)` hands that one template build the skin's `kit` and `m`.
- **After the build:** `skin.finish(ctx)` performs the template.

No template file changes for the mechanism itself. The three direct `Loom.svg` spots move onto kit calls (`kit.ring`, a
highlight bar) so the skin can see them.

### A skin has four parts

```
Loom.engines.define("whiteboard", { api, skin: {
  stage(ctx)                 -> what the template lives on (the board, the sheet, the console, the diorama, the app)
  kit:   { rect, card, pill, disc, line, path, arrow, text, kicker, icon, mark, row, peep, ... }   // the material
  enter: { reveal, settle, drop, pop, unmask, draw, iris, stamp, grow, count, along, converge }    // the entrance
  emphasis: { highlight, emphasis }                                                                 // the pointer to a word
  refuse: ["scenario.dialogue"]   // forms that contradict the style (see "Forms a style refuses")
}});
```

- **Stage.** The surface the template is placed on, made once per template scene. It uses the engine's own builder, so
  the template and the style's bespoke beats share one surface.
- **Material.** How each primitive is drawn. A skinned `kit.text` still lays out real, measured text. The words stay on
  the page as text the checks read, at the same place and width, painted by the style's strokes. Whiteboard's `B.write`
  already works this way. So the layout guard, the text-fit checks, the caption checks and `__fit` metrics, which
  templates use to place the next part, keep working.
- **Entrance.** How each part arrives. The classic verbs (settle, pop, drop) mean "appear now". Under a skin they mean
  "this part starts now". The skin decides how it arrives:
  - whiteboard: drawn stroke by stroke;
  - blueprint: drafted in order (centre lines, outline, detail, lettering);
  - hologram: a scan band builds a light plane;
  - isometric: rises out of the board;
  - screencast: loads as UI, a skeleton first and then the content.
- **Emphasis.** How a word that came early is marked when it is spoken. The classic highlight is a sweep. The style
  versions are a hand underline, a dimension tick, a lock bracket, a pin or a selection.

### Record, then perform

Under a skin, a kit call does not draw straight away. It records a part on its element: the element's node maps to its
`E` through `__E`, which already exists. A motion verb records the element, the time and the verb. `finish(ctx)` then
performs every part in time order on the style's single performer: one hand, one nib, one scan, one render loop.

Each part is fitted so it ends before the next part is due. Its `by` is the next part's time, minus a small gap.
Whiteboard's scheduler already does this (`by`, `wb_pen_late`). Because the skin knows every reveal time before it
draws, it can do the drawing-time budget the assessment found missing.

When a part cannot be drawn in its window, the skin picks the part's **light form**:
- a card becomes an open frame (two strokes) instead of four sides;
- a hatch is dropped;
- lettering is written faster, up to whiteboard's existing 1.8x.

It warns `skin_squeezed` when it does. It never lets a part arrive after its word.

### What does not change

- **Props, anchors and the reveal moment.** The template's catalog entry and its storyboard schema stay the same. A part
  starts at the moment it appeared before: the D-100 lead time and `H.structAt` still hold. "On screen" now means
  "being made", so the frame is never empty.
- **Elements.** Exits, held parts (`keep`), joins, the camera, the backplate and the veil all act on elements, which
  the skin does not change. Exits stay classic in the first build.
- **Determinism.** Every stroke, scan and rise is a tween or a drive on the lesson's timeline, posed by the engine's one
  clock. The engines are already linted for this (`loom/engines.py`).
- **Fallthrough, visible.** A primitive or verb a skin does not cover is drawn the classic way. It is logged as
  `skin_fallthrough`, a warning in the report and on the sheet.

  A static test lists every kit primitive and motion verb used in `runtime/templates/*.js` and checks that each skin
  covers them, or names the ones it leaves classic on purpose. Today that is about 30 primitives (text 48 uses, rect 16,
  line 7, card 6, row 6, kicker 5, pill 4, mark 4, icon 4, disc 4, path 3, peep 2, arrow 2 and smaller ones) and 15
  verbs (reveal 19, settle 11, drop 8, pop 7, draw 6, unmask 4, highlight 4, stamp 3, iris 3 and smaller ones).

## Per style: what a template becomes

Each row is that style's own reading of the same contract, judged only against that style's essence.

### Whiteboard: "one hand drawing the idea as it is said"

- **Stage:** the board (`W.board(ctx)`), shared with the section's bespoke beats. A template beat continues the board
  the section is growing, and is wiped with it.
- **Material:**
  - card and rect: `W.roundRect` / `W.rect` (four strokes, corners overshoot);
  - disc: `W.circle`, which never closes;
  - line and rule: a marker underline;
  - arrow: `W.arrow`;
  - icon: `W.icon` (Lucide, drawn, D-186);
  - title, term and header: `B.heading` in the display face;
  - every other word: `B.write` in the marker hand (the "Two faces" rule, D-182, so `wb_face` is met by construction);
  - hatch fills: `W.hatch`, only where the classic fill carried meaning (valence).
- **Entrance:** drawn in reading order, on the word. Frame first, then words, then the mark.
- **Emphasis:** the hand comes back and underlines or circles the spoken word.
- **Signature mappings:**
  - `list.steps`: numbers are written digits in a drawn circle, each row's box drawn before its words.
  - `compare.two`: two columns divided by one drawn line instead of two boxed cards. Less ink, more board.
  - `quiz.question` and `quiz.answer`: options written; the answer is circled and the wrong ones crossed (`W.tick`,
    `W.cross`).
- **Refuses:** nothing.

### Blueprint: "the design drafted live"

- **Stage:** the sheet (`W.sheet(ctx)`) with its border and grid. A template beat gets a FIG number and a line in the
  title block, like any sheet.
- **Material:**
  - card: a drafted outline at outline weight with corner centre marks, no fill;
  - disc and icon: a circle with centre lines (`W.centre`);
  - rule: a thin line with arrowheads, the dimension look;
  - words: single-stroke technical lettering (`D.letter`, Hershey Sans);
  - a number the template states (`stat.hero`, `chart.bars`): a dimension with a live figure (`D.dim`, `d.set`).
- **Entrance:** drafting order through `D.part` (centre lines, outline, detail, hidden, hatching, then lettering), one
  nib for the film.
- **Emphasis:** a balloon or a leader to the word.
- **Signature mappings:**
  - `list.steps`: numbered balloons (`D.balloon`) instead of discs.
  - `compare.two`: VIEW A and VIEW B, two views of one sheet.
  - `process.flow`: parts joined by `D.connect`, flow travelling along the pipe.
  - `definition`: the term as a part callout, the definition in a general-notes block (`D.notes`).
- **Refuses:** `scenario.dialogue` (the essence avoids people).

### Hologram: "the invisible system, reporting itself in light"

- **Stage:** the HUD (`W.hud(ctx)`). The template is placed in the mid depth layer, with parallax from `H.push` when the
  camera moves.
- **Material:**
  - card: a light plane (`H.plane`), a dark plate under the words with a hairline frame, one hot edge and corner
    brackets, never a full equal-weight box;
  - disc and icon: a reticle ring, not an icon in a circle;
  - list rows: readouts, a label with its value;
  - numbers: `H.reading` with its unit, rolling to the value.
- **Entrance:** a scan band builds each plane top to bottom; the words type on. Calm, at most three flashes a second
  (the existing flash ledger).
- **Emphasis:** `H.lock` brackets snap onto the spoken part. Only the active part has the hot edge; the others sit at
  idle tone. This turns "equal-weight grid" into "the system reports one thing at a time".
- **Signature mappings:**
  - `compare.two`: two planes at two depths; the verdict side is locked.
  - `quiz.question`: a decision prompt with options as readouts; the answer is locked `ok`, the others `idle`.
  - `definition`: a term plane with a scan.
- **Refuses:** `scenario.dialogue` and `calendar.plan` (the essence avoids people on the console; a calendar is office
  UI, not a system reporting).

### Isometric: "a working miniature of the whole system"

- **Stage:** the diorama board (`W.board(ctx)`). A template that follows a board beat on the same station stands on
  that board. A template with no board gets a small plinth board of its own, so it never floats.
- **Material:**
  - card: a standing panel, a thin iso block in three tones from its fill token, no outlines, contact shadow on the
    board;
  - disc: a short cylinder token;
  - bars (`chart.bars`): iso bars (`B.bars`);
  - counts: an Isotype tally (`B.tally`);
  - arrows in `process.flow`: floor routes between stations (`B.route`).
- **Entrance:** each panel rises out of the board (grows up from its foot) and its words print after it lands.
- **Emphasis:** a map pin (`B.pin`) on the spoken part, or a tracked ring.
- **The open question, needs your choice:**
  - **Version A:** the words sit on the panel's front face, kept frontal and unskewed, so they read like any text.
    This is easier to read, but the front face is not true isometric.
  - **Version B:** the words are printed on the true 30 degree face. This is truer to the grid, but harder to read at
    lecture distance.

  I propose building A and testing B against it within isometric (D-122 allows versions within one style).
- **Refuses:** `scenario.dialogue` until isometric people exist (the assessment's gap), and `quote`. A quote has no
  place on a working map; the skin warns and draws it as a note on the board (`B.note`).

### Screencast: "the product in use, step by step"

- **Stage:** if the station holds an app shell (`W.app` or `W.resume`), the template renders in its content region, as
  a page of the product. Otherwise the skin opens a minimal shell of its own: window chrome and one page, from the
  lesson's words, never a real product's look.
- **Material:**
  - card: an app card (the shell's radius, 1 px border, its shadow);
  - title: a page heading;
  - pill: a chip or badge;
  - disc and icon: an icon button or avatar;
  - list rows: table or list rows;
  - stat: a KPI tile;
  - document: a document view.
- **Entrance:** a page load. Skeleton blocks first, which meets D-100: the structure is on screen on time. Each part's
  content fills in on its word, with the product's short UI fade. No bounce.
- **Emphasis:** the teaching layer in `accent2`: a callout ring or `A.highlight`. It is never drawn by hand (the
  essence avoids hand-drawn panels over the app).
- **Signature mappings:**
  - `quiz.question`: an in-app dialog ("Check your understanding") with radio options.
  - `quiz.answer`: the pointer selects the answer and the product answers with a toast. The pointer is the learner,
    so it is allowed here.
  - `process.flow`: a stepper component.
  - `calendar.plan`: the app's calendar view.
- **Refuses:** `scenario.dialogue` (the essence avoids people on screen).

### Forms a style refuses

`refuse` is data on the skin. The storyboard gate gives a warning, `template_not_this_style`, when a lesson in that
style picks a refused template. It is a warning, never an error, so the person can still choose it. The direction card
and the essence block name the refused forms to the planner. A refused template with the skin on draws its closest
native form if the skin has one (isometric quote as a board note), else it draws classic and says so.

## Keep both ways

- **The default** follows the engine switch (D-181). A new lesson in an engine style with the engine on gets the skin.
  `"engine": "off"` gets the classic templates, as today.
- **A lesson's choice:** request or storyboard `template_skin: "style" | "classic"`.
- **A beat's choice:** scene `skin: "classic"` in the storyboard (beside `keep` and `fx`, not inside props, so the
  template's schema stays the same).
- **Finished lessons keep what they were approved under.** A lesson without the new `template_skin` stamp keeps classic
  templates, the same rule as the kind-of-video stamp (commit 0f84df9). No existing lesson re-renders differently.
- **`restyle`** to an engine style gives the new style's skin. To a non-engine style, classic.

## Beyond the five engines (a second step, its own proposal)

The registry does not need an engine: `Loom.skins.define("<style>", {...})` works for any pack. The styles the requester
named, and the assessment's non-engine gaps, each get their own skin later. One line each, to show the mechanism holds;
none of this is in the first build:
- **flat-cosmos** and **glow-flat**: cards become shaded crescent objects in space, entrance by `Loom.morph`, emphasis
  by `Loom.glow`;
- **story-cartoon**: the template becomes a prop in the set (a note on a desk, a sign on a wall), placed in the acted
  scene;
- **cinematic-dawn** and **cinematic-noir**: titles in light, a slow push, depth of field on the parts not spoken.

## Proof (the definition of done, per style)

1. **The template sheet shows the build, not only the end.** For a skinned style the sheet keeps three frames per case:
   the first part starting, mid-build and the end. It takes `--skin style|classic` so both ways render.
   - Fixture props (original text) for the 17 core templates go in a new fixtures folder, since today only promoted
     designs have fixtures.
   - `py -m loom library sheet --template <id> --style <s>` makes it reachable from the command line.
2. **A report check, `skin_formed`.** For every part of a skinned template:
   - its reveal kind is the skin's (draw, draft, scan, rise or load), not a classic settle or pop;
   - it starts at its classic time;
   - it ends before the next part is due.

   It reads the report's tween meta, so it costs no frames and gives the same answer on every build. It is red on
   today's code by construction: every part is a settle or a pop.
3. **The existing gates stay green:** layout guard, text audit, `wb_pen_late`, `wb_face`, flash ledger and caption
   checks.
4. **Look at every row.** Contact sheets for every template in every engine style, both ways, mid and end, before any
   claim.
5. **Within-style comparison, on a film.** For each style, one new short lesson rendered with skin and without.
   Kshitij rates within the style, never across styles.

## Order of work

1. **The core:** `Loom.skins` (apply, record, perform, fallthrough), the sheet changes, `skin_formed`, the coverage
   test, the classic and legacy switches.
2. **Whiteboard first.** It is the largest gap (a template appearing whole is "the one thing this style must never
   do"), its template share is the highest (0.3), ten lessons on disk carry its quiz pair, and its scheduler already
   has `by` and the late checks.
3. **Blueprint.** It shares record-then-perform with the nib.
4. **Hologram**, then **screencast**.
5. **Isometric** last, because it carries the legibility test (A against B).

Within each style, the templates the engine lessons use come first: `quiz.question`, `quiz.answer`, `compare.two`,
`definition`, `list.steps`, `title.card`, `recap`, `process.flow`, `document.page`, `scenario.dialogue` where not
refused. The other seven follow.

## Risks I see

- **Drawing time.** At the whiteboard's 950 px a second, a 800 by 500 card outline takes about 2.7 s. That is too slow
  for a list of four cards in one beat. The light forms and the budget fit handle it; `skin_squeezed` shows where it
  bites. Whiteboard `compare.two` drawn as columns rather than cards cuts most of it.
- **Text metrics.** Hand and stroke lettering is wider than the body face at the same size. Templates lay out with
  `kit.fit`, so the skin's `kit.text` must measure in the style's lettering, not the font, or parts collide. The
  whiteboard engine already fits its words to a box (`V.text`); blueprint and hologram need the same.
- **Depth and the camera.** The hologram and isometric stages introduce depth. A template's `ctx.shift` and
  `kit.vcenter` assume a flat group; the stage must keep the template's coordinates flat inside its layer.
- **Coverage drift.** A new template that uses a new kit call would fall through silently. The coverage test turns
  that into a failing test.

## What I need from you

1. **Go-ahead on the mechanism:** a skin per engine, record then perform, templates unchanged.
2. **Isometric:** Version A (frontal words on standing panels) with B tested against it, or another way.
3. **The default:** skin on for new engine-style lessons, classic kept selectable, finished lessons untouched.
4. **The order:** whiteboard first, then blueprint, hologram, screencast, isometric.

## Unverified

- The `wb_face` conflict for a template beat inside a board lesson was read from the code, not reproduced.
- The drawing-time estimate is arithmetic from the scheduler's speed constant, not a render.
- Whether the hologram plane and isometric panel read at 1080p and after H.264 is unknown until the sheets exist.
