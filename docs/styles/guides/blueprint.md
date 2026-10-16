# blueprint: the style guide

STATUS: SECOND VERSION (2026-10-16): the blueprint engine (`runtime/engines/blueprint.js`, sections 17 to 21) and the two
registers, learned from lemo-opuscar's blueprint style and rebuilt as Loom's own. First version 2026-10-15 (D-178). Built at Kshitij's request ("make a video in engineering/ blueprint style. If
this style doesn't exist or isn't refined, do it first"; he chose a new blueprint look beside the light engineering pack,
which stays as it is). Proven on lab strips in Chrome (s16), not yet on a lesson or an encoded MP4: the first lesson in
this style is its first real test, and its frames update s12.

Pack: `packs/styles/blueprint.json`. Examples: `scenes_examples/style_blueprint_request_path.js` (recipe R1),
`scenes_examples/style_blueprint_detail_callout.js` (recipe R2). A guide compares versions within its own style only
(D-122): "better" here means closer to a clean technical drawing, never closer to another style.

## 1. Purpose and register

A technical drawing in white on deep cyanotype blue. The frame is one drafting sheet: a still grid behind, parts drawn
as crisp outlines, notes in monospace like annotations, one cyan mark on what the narration names. It feels exact,
calm and made by an engineer for engineers: nothing decorative, every line means something, and the drawing is
built in front of the viewer the way a draughtsman builds a sheet (outline first, then detail, then notes).

Fits: system design, architecture, failure modes (what breaks, where, and what takes over), protocols and request
paths, infrastructure, how a thing is built or assembled, technical onboarding. Audience: engineers and technical
staff, corporate adults (CLAUDE.md rule 11), never a classroom.

Never for: soft skills, people stories, wellbeing, warm consumer onboarding, children. A lesson whose meaning lives in
faces and feelings belongs in an illustrated style. A blueprint can hold a small person (s8), never a scene about one.

References (study, never copy or republish):
- **Technical drawing conventions** (ISO 128 line conventions, ASME Y14.2; summarised in
  [epcland.com](https://epcland.com/?p=50197) and the ISO 128-2:2020 listing at
  [BSI](https://accord-checkout.bsigroup.com/products/technical-product-documentation-general-principles-of-representation-basic-conventions-for-lines)).
  Take: the line hierarchy (wide continuous lines for visible edges; narrow lines for dimensions, extensions and leaders;
  dashed lines for hidden parts; chain lines for centres and axes), dimensions with extension lines, leaders that end
  on the part, a title block. Do not take: drafting rules for their own sake (no tolerances, no hatching standards, no
  third-angle projections in a lesson about software).
- **Cyanotype blueprints** (the white-on-Prussian-blue print look). Take: the deep blue field, white lines, a faint grid,
  restraint. Do not take: paper stains, folds, fake wear (texture is not information; D-100).
- **"Blueprint" editing styles for how-to video** ([captions.ai](https://captions.ai/styles/blueprint)): a gridded
  background, annotation marks and arrows that make a process instructional. Take: annotations that point at the thing.
  Do not take: footage under a grid; Loom draws the system itself.

## 2. Palette roles

Hex values are copied from `packs/styles/blueprint.json` as it is on 2026-10-15. Ratios measured with
`loom.checks.style_lint.contrast` (s16).

| token | hex | role | may appear | must never | area share |
|---|---|---|---|---|---|
| field | #11376B | the sheet: deep cyanotype blue, with the drafting grid drawn over it by the fx layer | everywhere behind | as text; as a fill inside a part (the line shading already puts the field inside coloured outlines) | 70 to 85 % |
| field2 | #0C2C59 | the sheet's darker edge (the fx gradient), a band, a recessed area | backgrounds of a zone, the grid's darker end | as text | 0 to 10 % |
| surface | #16437F | a part's face: a box, a card, a panel, a title block (1.2:1 on the field: it reads by its outline, not its fill) | every part that is a thing | as the only edge of a thing (it needs its outline) | 10 to 25 % |
| surface2 | #0F3263 | an inner compartment, a slot, an inactive part | slots, inner boxes, empty states | as text | 2 to 8 % |
| ink | #F2F6FC | all words; the outline of parts (line shading draws neutral parts in ink) | text, outlines | as a large fill (a white block is a hole in the sheet) | 3 to 8 % (lines and words) |
| muted | #A9C1E3 | secondary words, narrow lines: dimensions, extensions, centre lines, hidden-part dashes | annotations, captions under parts, the path not taken | as the named thing | 1 to 4 % |
| line | #DCE8F7 | connectors and arrows between parts, rules | strokes 1.25 to 2.5 px | as text under 24 px | 1 to 3 % |
| accent | #7FE3FF | cyan: THE part the narration names now; its leader and callout | one part (or one family of parts that are the same thing) per frame | decoration, the grid, a second meaning, words longer than a term | under 3 % |
| accent2 | #FFC65C | amber: measures and warnings: a dimension's figure, a size, a timing, a limit | figures on dimensions, a short warning tag | a part's outline when it is not a measure or a warning; long text | under 2 % |
| accent3 | #FF8A7A | coral: failure: the part that broke, the request refused | a failed part's outline, a refusal note | as fill behind white words (ink on accent3 is 2.11:1: use onAccent) | under 2 % |
| accent4 | #7DE8B5 | mint: healthy, done, the path that works | a tick, a healthy state, the final path | as decoration where pos means "works" | under 2 % |
| pos | #7DE8B5 | outcome good (same hex as accent4) | ticks, "works", "passed" | anything that is not an outcome | under 2 % |
| neg | #FF8A7A | outcome bad (same hex as accent3) | crosses, "failed", "refused" | anything that is not an outcome | under 2 % |
| shadow | #071D3D | the turn card's ground, a person's outline and hair | `roles.turn_card`, characters' ink | as text | 0 % in a normal frame |
| onAccent | #0A2A55 | words on a cyan, amber, coral or mint fill (a pill, a quiz letter) | text on accent fills | as a fill | under 1 % |
| caption_active | #FFC65C | the spoken word in the caption | captions only | anywhere else | 0 % |

Text pairs measured (allowed): ink on field 10.86:1, ink on surface 9.03:1, ink on field2 12.74:1, muted on field
6.41:1, muted on surface 5.33:1, accent on field 8.04:1, accent2 on field 7.56:1, accent4 on field 7.90:1, onAccent on
accent 9.72:1, onAccent on accent2 9.14:1. Allowed only at 30 px or larger: accent3 on field 5.14:1, accent3 on
surface 4.28:1. Forbidden: ink on accent3 (2.11:1), any text on field over surface (1.2:1 is a fill difference, not a
contrast).

One cyan, placed: at any moment one part (or one family) is cyan. When the narration moves on, the cyan moves with it
(off the old part, onto the new). Amber means "a measure or a limit", coral means "broke or refused", mint means "works";
each keeps that one meaning for the whole lesson.

## 3. Type

| role | family | sizes (px, pack) | weight | use |
|---|---|---|---|---|
| display, hero | Space Grotesk | 100 to 144, 88 to 128 | 700 | the lesson title, a chapter number; rare |
| title | Space Grotesk | 56 to 80 | 700 (500 for a quiet title) | a sheet's title, a question |
| lead | Inter | 32 to 40 | 600 | one line that frames the drawing |
| body | Inter | 30 to 36 | 400, 600 | sentences (few: a blueprint speaks in labels) |
| label | JetBrains Mono (pack `fonts.roles.label`) | 24 to 28 | 400, 700 | part names, notes, dimension figures, the title block's head |
| caption | JetBrains Mono (`fonts.roles.caption`) | 20 to 24 | 400 | small annotations, the title block's fields |

- Part names and notes are lower case in mono (`load balancer`, `server A`), as a label on a drawing; the title block and
  a detail note are upper case (`DETAIL A (x3)`, `SHEET 2 OF 4`), tracked by the mono face's own width, never by extra
  letter spacing.
- Numbers on dimensions carry their unit with a space (`120 ms`, `5 slots`, `2 GB`), in amber, in the label role.
- One sentence on screen at most, and only when the narration needs it held; the drawing and its labels carry the rest.
- Never: italics, all-caps sentences, a fourth face, a size below the pack's floor (the guard grows a box that is too
  short, never shrinks the type: D-169).

## 4. Shape language

The drafting line hierarchy is the shape language:

| line | width | token | dash | for |
|---|---|---|---|---|
| visible edge (wide) | the pack's 2.5 px (`shape.stroke`) | ink (neutral parts) or the part's tone | none | the outline of every part |
| connector | 2.5 px, arrowhead | line | none | a request, data or control moving between parts |
| dimension, extension, leader (narrow) | 1.25 px | muted (accent for the named part's leader) | none | a measure, the lines that carry it, a note's pointer |
| hidden or not taken (narrow) | 2 px | muted | `"12 9"` | a path not taken yet, a part behind another, a planned part |
| centre or axis (narrow) | 1.25 px | muted | `"26 7 5 7"` (chain) | the axis of a part, a symmetry, a queue's line |

- Parts are rectangles with a 4 px radius (`shape.radius`), drawn with `kit.rect(..., {fill: "surface"})`: the pack's
  `line` shading draws a neutral fill with an ink outline, and a coloured fill as the field with that colour's outline
  (so a coloured part is an outline, never a block).
- A dimension: two extension lines, a dimension line between them with small closed arrowheads (the engine's default,
  `D.dim`; ticks with `ends: "tick"`), the figure centred on it in amber. A flow arrow is a heavier line with a larger
  head, so the two never read alike (2026-10-16; the first version used ticks only).
- A leader ends ON the part it names (inside its outline, or touching it), never in the air beside it.
- A detail callout: a narrow ellipse round the part, a narrow leader to an enlarged view in its own frame, the view's
  note in mono (`DETAIL A (x3)`).
- A title block: bottom right, two narrow rules dividing it, upper-case mono, drawn once and kept for the lesson.
- Labels and tags (`Loom.treat.label`) are pills with a narrow outline in their tone and mono words; they sit on a
  leader to the part. The layout guard moves them clear of words, other labels and the frame edge when a lesson has it
  on (D-169).
- Never: drop shadows (`shape.shadow` is none), gradients on parts, filled colour blocks, rounded blobs, hand-drawn
  wobble, icons as decoration.

## 5. Light, shading, depth and texture

- The field is one shader layer (`fx.background: "drafting"`, runtime/fx.js): a still grid, minor lines every 40 world px
  and major lines every 200, drawn toward the ink colour (5.5 % and 11 % at intensity 1), on a vertical gradient from
  field2 to field. It follows the camera like the sheet it is drawn on. No moving light: calm backgrounds.
- The pack's `ambient` is `none` on purpose: the grid lives in the shader, not in DOM nodes (a per-dot ambient made a page
  of 96,163 nodes and checks 50 times slower: docs/research/2026-10-10-why-checks-are-slow.md).
- Shading is `line`: no light, no shade, no depth cues on parts. Depth is shown the drafting way: a part behind another
  is dashed (hidden), a section is a separate view (a detail callout), never perspective.
- Vignette 0.22: the sheet darkens a little at its edges so the drawing sits in the middle. Grain 0 (D-100).
- `ctx.iso` (isometric) may be used for a physical system (a rack, a building) where the third dimension is the point;
  its boxes take the line shading. Use it rarely: the sheet is the default view.

## 6. Composition

- The drawing fills about 60 to 75 % of the safe area (`kit.SAFE`: 96 px sides, 84 px top, the bottom 150 px kept for
  captions). A blueprint frame looks empty when its drawing is small: draw larger rather than adding parts.
- Lay parts on the grid: x and y on multiples of 40 (the minor grid), part sizes on multiples of 20. Aligned parts read as
  designed; parts off the grid read as placed.
- Flow reads left to right (request paths, pipelines) or top to bottom (layers, a stack). One direction per sheet.
- The named part is near the frame's centre of attention, not at an edge; move the camera to it rather than squeezing it.
- Notes sit on leaders in empty grid space, never over another part's words; the title block keeps the bottom right
  above the caption band (its bottom at y 930 at most).
- Density: 3 to 7 parts on a sheet. More than 7 is a second sheet (a cut or a camera move), or a detail callout.
- Captions: the pack's caption pill is dark navy (`rgba(7,29,61,0.9)`) with ink words and the spoken word in amber; keep
  drawing out of the band below y 930.

## 7. Motion

Personality `calm` (pack: enter 0.5 s, move 0.4 s, exit 0.3 s, draw 1.1 s, stagger 0.08 s, no overshoot).

- The signature move is **drawing on**: a part's outline draws (`m.draw` on its rect, `ctx.style.dur("draw")`), then its
  words fade in at about 70 % of the draw. Structure before content: outlines, then connectors, then notes.
- Connectors draw INTO what follows (`m.draw` on a `kit.arrow` result lands the head as the stroke arrives).
- A request, a packet or a token travels (`m.travel`) along the path; it is gone when it arrives (fade it), never parked
  on a part's name.
- The cyan moves by fading a highlight outline in and out (recipe R1), never by recolouring the part's own shape.
- Exits are quiet: a part that is no longer needed fades (0.3 s); a broken part stays, outlined in coral, while the
  narration talks about it.
- Camera: pan and zoom across one sheet inside a topic (`join_in` continue or camera); a cut between topics; a wipe only
  at a section change, like turning to the next sheet (`join_note` in the pack).
- Never: bounces, pops with overshoot, spins, shakes, particles, a scanning light.

## 8. People and living characters

A blueprint is about the system. People are rare, small and drawn as outlines (the pack's characters: outline and hair
in `shadow`, cloth `accent`; background people are `silhouette`). No designed character kit exists for this style yet
(CLAUDE.md rule 11: characters come from designed kits, Claude Design first, `skills/lnd/lnd-character-design`); until one
exists, a person appears only as a small role marker beside a part ("on-call engineer"), never as the subject of a beat.
Request: s15.

**Until the kit exists (2026-10-16): a person is a Lucide icon.** Place `kit.icon(E.inner, "user-round", {size, color:
"ink"})` (or `users-round` for a team) in its own element, at 80 to 110 px, with its role lettered under it by the engine
(`D.letter(E, "engineer on call", {role: "label"})`) and a connector from the part it serves. Never draw a person with
the engine's marks or with `Loom.svg` in scene code (CLAUDE.md rule 11: characters come only from designed kits); the
stress test of 2026-10-16 used exactly this and it read as a role marker. When a designed blueprint kit lands, it
replaces the icon and this paragraph.

## 9. Objects, icons, data and UI

- Icons: Lucide, stroke 1.9 (`icons.stroke`), in ink or the part's tone, inside a part (a database cylinder, a lock), never
  floating alone at hero size.
- Data: a value is a dimension or a figure in amber, not a chart, unless the change over time is the point. A chart, when
  needed, is drawn as a drawing: narrow axes in muted, the series as a wide line in ink, the named point in cyan.
- UI and code: a screen is a part (an outlined rect) with mono lines inside; a terminal is the same with a `$` prompt in
  muted. Never a realistic screenshot.
- Queues, buffers, slots: rows of small `surface2` squares inside the part (recipe R2); a filled slot gets a disc.

## 10. Templates in this style

Bespoke scenes are the norm in this style (the drawing is the explanation). When a template is used:
- `title.card`: fine; the title in Space Grotesk on the grid. Keep it short.
- `definition`: fine; the term takes `roles.term` (cyan).
- `process.flow`, `list.steps`, `timeline`: fine; check the steps' labels fit at the label floor (24 px). Prefer a bespoke
  sheet when the steps are parts of one system.
- `compare.two`: fine for two designs side by side; each side is its own small drawing.
- `quiz.question`: the letters are cyan discs with onAccent letters (`roles.quiz_letter`).
- `avatar`: avoid (s8).
Unverified for this style beyond `lab_tpl_definition` (s16): look at each template's strip before relying on it.

## 11. Recipes (code)

Real APIs only (`docs/SCENE_API.md`; runtime/kit.js, motion.js, treat.js). Full versions: the two example scenes.

**R1. A part drawn on, words after, and a highlight that can move** (from `style_blueprint_request_path.js`):
```js
const part = (name, x, y, w, h, words, t) => {
  const E = ctx.el(name, { x, y, w, h, kind: "card" });
  E.box = kit.rect(E.inner, 0, 0, w, h, { fill: "surface", r: 4 });
  E.words = kit.text(E.inner, words, { role: "label", x: 18, y: 0, w: w - 36, h, align: "center", valign: "middle", maxLines: 2 });
  m.draw(E.box, t, { dur: ctx.style.dur("draw") });
  Loom.tween(E.words, { opacity: 0 }, { opacity: 1, duration: 0.3 }, t + ctx.style.dur("draw") * 0.7, { kind: "reveal", beat: ctx.beat.id, name });
  m.reveal(E, t, { dy: 0, dur: 0.01 });
  E.mark = (tone) => Loom.svg("rect", { x: -3, y: -3, width: w + 6, height: h + 6, rx: 6, fill: "none", stroke: Loom.style.c(tone), "stroke-width": 3, opacity: 0 }, E.inner);
  return E;
};
```
Then `const hl = lb.mark("accent")` and fade `hl` in on the part's word and out when the narration moves on.

**R2. A dimension** (narrow lines, ticks, amber figure):
```js
const D = ctx.el("dim_latency", { x: 1220, y: 150, w: 300, h: 90, kind: "label" });
const lines = [kit.line(D.inner, 0, 40, 0, 96, { stroke: "muted", sw: 1.25 }), kit.line(D.inner, 300, 40, 300, 96, { stroke: "muted", sw: 1.25 }),
               kit.line(D.inner, 0, 52, 300, 52, { stroke: "muted", sw: 1.25 }),
               kit.line(D.inner, -7, 59, 7, 45, { stroke: "muted", sw: 1.25 }), kit.line(D.inner, 293, 59, 307, 45, { stroke: "muted", sw: 1.25 })];
const fig = kit.text(D.inner, "120 ms", { role: "label", x: 60, y: 0, w: 180, h: 40, align: "center", valign: "middle", color: "accent2", maxLines: 1 });
m.reveal(D, t, { dy: 0, dur: 0.01 });
lines.forEach((L, i) => m.draw(L, t + i * 0.05, { dur: 0.5 }));
```

**R3. Hidden and centre lines:** `kit.line(p, x1, y1, x2, y2, { stroke: "muted", sw: 2, dash: "12 9" })` for a path not
taken; `{ stroke: "muted", sw: 1.25, dash: "26 7 5 7" }` for an axis. Draw them with `m.draw` like any line.

**R4. A note on a leader:** `Loom.treat.label(ctx, "note_no_answer", { x, y, text: "no answer", to: [px, py], tone: "accent3", t })`;
`to` is a point inside the part. With the layout guard on, the label may be moved clear; a label meant to sit on its part
says `overlaps: ["server_a"]`.

**R5. A detail callout:** a narrow `Loom.svg("ellipse", ...)` round the part (stroke accent, 1.5 px), a narrow leader
(`kit.line`, accent, 1.25 px) to a framed enlarged view, and the note `DETAIL A (x3)` in the label role, accent
(`style_blueprint_detail_callout.js`).

**R6. A travelling request that leaves no trace:**
```js
const tok = ctx.el("request", { x: 380, y: 466, w: 28, h: 28, kind: "token" });
kit.disc(tok.inner, 14, 14, 11, { fill: "accent2" });
m.reveal(tok, t0, { dy: 0 });
m.travel(tok, t0 + 0.6, { x: 220, y: 0, dur: 0.9 });
Loom.tween(tok.inner, { opacity: 1 }, { opacity: 0, duration: 0.25 }, t0 + 1.45, { kind: "exit", beat: ctx.beat.id, name: "request" });
```

## 12. Failure modes seen in real frames

Seen while building this style's examples (lab strips, 2026-10-15):
| seen | why | rule |
|---|---|---|
| no grid at all on the first strips | the shared `blueprint` shader mixes 5 % toward ink, tuned for the light engineering field; invisible on deep blue | this pack uses its own `drafting` background (s5) |
| the highlight never showed | a colour tween on `kit.rect`'s result changes its group; the outline's own stroke attribute wins | highlight with a separate outline faded in and out (R1) |
| the request token parked on the balancer's name | a travel ends where it ends; nothing removed it | fade a token when it arrives (R6) |
| a dimension's figure printed over the enlarged slots | the dimension was placed by hand at the slots' height | dimensions sit outside what they measure, under or beside it (s4) |
| outlines in four colours on lab scenes | coloured fills under `line` shading become coloured outlines | neutral parts take `surface`; colour only for a meaning (s2) |
| the FIG underline cut the sub-title; the delta sat on the cloud's scallops; "APPROVED" overflowed its stamp; `on-call` read "on - call"; connector labels floated off their lines (stress test, 2026-10-16, `docs/research/2026-10-16-style-stress/`) | fixed offsets and estimated widths in the engine; Hershey's "-" is a minus sign | the engine measures them now (engine guide; `check_blueprint_fig_rules_clear_the_subtitle` and four more tests) |
| dense sheets drafted slowly (about 92 s for three) and lettering fell behind speech (1.6 to 1.9 words a second) | one pen; figures, balloons and dimensions only at its speed | lettering at 3.2 words a second, catch-up when late, `by` / `quick` on every annotation (`check_blueprint_lettering_keeps_pace_and_by_quick_reach_every_call`) |
Add each failure a lesson shows here, with its lesson and beat.

## 13. Polish checklist (yes or no, on the contact sheet)

1. Is the drafting grid visible but quiet behind every frame?
2. Is every part a white outline on the sheet, with no shadow and no colour block?
3. Is exactly one part (or one family) cyan, and is it the part the narration names now?
4. Does amber appear only on measures and limits, coral only on failures, mint only on what works?
5. Are part names mono, lower case, inside their parts or on leaders that end on them?
6. Do dimensions have extension lines, ticks and an amber figure with its unit, outside what they measure?
7. Are paths not taken dashed, and axes chain-dashed, and nothing else dashed?
8. Is every word at or above its role's floor (24 px labels, 30 px body)?
9. Does the drawing fill 60 to 75 % of the safe area, on the 40 px grid?
10. Are there 7 parts or fewer on a sheet?
11. Does every connector draw into the part it reaches, and every token leave when it arrives?
12. Is nothing in the caption band (below y 930) except captions?
13. Do labels clear each other, words and the frame edge (the layout guard's residual list is empty, or each one is meant)?
14. Does motion only draw on, travel, fade: no bounce, pop, spin or scanning light?
15. Is the title block (if used) bottom right, kept, and quiet?

## 14. Gaps

| gap | size |
|---|---|
| A designed character kit for this style (outline people, small), Claude Design first (s8) | L |
| The bloom and the occlusion masks cost about 0.3 s a frame on a dense sheet (12-frame strip: 6.3 s to 10.1 s); a cheaper bloom, or one bloom for the whole sheet, if lesson renders are too slow | M |
| Ink breakup on the paper's grain (left out: an SVG noise filter on every element costs more than it adds) | S |
| A "sheet on the table" opening (the sheet on dark cloth with a drop shadow) is a shader option (runtime/fx.js), not the engine | S |
| ~~A helper for dimensions, leaders and callouts~~: built 2026-10-16 as the blueprint engine (s17) | done |
| A lesson in this style (its first real test) and its MP4 judged after H.264 (the grid at 5.5 % may band or vanish) | M |
| The light sweep and spotlight `fxMoment`s were made for light fields; judged once on this field in `lab_fx` (they read), not in a lesson | S |
| Templates beyond `lab_tpl_definition` not looked at in this style | S |
| No kept library (`assets/kept/blueprint`) yet: the first lessons build it (D-163) | S |

## 15. Engine and asset requests

- **Style engine (D-175), only if Kshitij picks it:** `runtime/engines/blueprint.js` with `dimension`, `leader`,
  `callout`, `titleBlock` and `hidden` drawing through `ctx.el` and kit, so authors stage the system instead of
  redrawing drafting conventions in every beat.
- **Character kit** (s8): outline people in the pack's tokens, small, for role markers.

## 16. Verified on 2026-10-15

- `py -c "from loom.checks.style_lint import lint_all; print(lint_all().get('blueprint'))"`: no problems (lint_family and
  lint_style both empty).
- Contrast pairs in s2: `loom.checks.style_lint.contrast` on the pack's palette.
- Lab strips in Chrome, looked at: `lab_one_board`, `lab_matrix_build`, `lab_tpl_definition`, `lab_story_set`, `lab_fx` and
  the two example scenes (`docs/styles/demos/lab/*__blueprint.jpg`). The examples rendered with 0 problems after the
  fixes in s12.
- `tests/suites/style_system.py` includes the pack in `PACKS` (every drawn weight is a loaded face; the turn card's words
  read on its ground; the guide's palette table matches the pack).
- Not verified: a composed lesson, an MP4, the speech and caption checks on a lesson in this style.

## 17. The engine and the two registers (2026-10-16)

Kshitij, 2026-10-16: lemo-opuscar's blueprint is "proper BLUEPRINT which is good for explaining some diagrams ... but
not for a consistent 5-10 minute video. So ... our blueprint should also be complex at places where it needs to be and
needs to show moving parts or motion but then can be a bit more relaxed at places where we need to explain or teach".
Opuscar is the inspiration, not the goal: nothing of its code or look is copied.

**The engine** (`runtime/engines/blueprint.js`, how to call it: `docs/styles/engines/blueprint.md`) drafts the sheet
live: the line hierarchy and the dash conventions, drafting order with paper occlusion, a single-stroke technical hand
(Hershey Sans), dimensions that measure (live figures), balloons, leaders, section lines, FIG rewrites, the title block
with its verdict, revisions, general notes, exploded views, oblique projection and stepping mechanisms. One quiet nib
at the drawing head (no hand, no sound by default).

**Two registers**, chosen per beat:

| register | for | what is on the sheet | density |
|---|---|---|---|
| teaching (most beats) | explaining a process, a system, a decision, a rule | cards lettered large, connectors with a label, a revision cloud when something changed, a tracing overlay for a proposal, the general-notes column | 3 to 5 cards; one idea a frame |
| detail (at most 1 beat in 3) | how a thing is built, where it breaks, how a part moves | parts in drafting order, hidden edges, hatching, dimensions, balloons, a section, an exploded view, a stepping mechanism, the stamp | up to 7 parts, 4 dimensions, 1 moving part at a time |

The camera leans in for the detail and back out for the teaching; the sheet is kept across beats (`ctx.held`), so the
lesson reads as one drawing that grows, not as slides.

**Ours, beyond opuscar** (Loom's signature for lessons):
- the teaching register itself (cards, connectors, quick-printed bodies);
- the revision cloud with its delta as "this changed", and the tracing overlay as "this is proposed";
- the general-notes column as the lesson's running recap;
- live dimensions tied to the narration's numbers, which the speech check and the grounding gates already verify;
- the title block's revision table as change control;
- every word readable by the layout checks.

**Lab scenes:** `bp_engine_teach` and `bp_engine_detail`. Looked at in the Node preview on 2026-10-16
(`tools/lab_preview.py`); the Chrome strip and a composed lesson are still to be looked at (s16).

**The wow pass (2026-10-16).** Kshitij: "The cool factor and the wow factor ... feels like it's gone. Opuscar frames
looked definitely better." Loom's own answer, nothing copied: the cyanotype paper (runtime/fx.js), paper that shows
through every part while what is behind stays hidden, a faint bloom on every line and a glowing nib, flat parts turned
into objects by oblique extrusion, mechanisms that turn (gears, belts, chains), Lucide icons traced in the drafting line,
and one real thing a sheet with a volume and a shadow. The camera helpers move over one sheet. How to call them:
the engine guide, "The look and the objects". Proof: `blueprint_wow.js` and the stress scene, rendered with the paper
in `docs/research/2026-10-16-style-stress/out_blueprint_wow/`.

Rules for the wow:
- One real thing a sheet, the part the narration is about. Never a hero on every figure: then nothing is.
- Extrude a part when what it IS matters (a chassis, a chip, a cabinet). A diagram of a flow stays flat.
- A mechanism moves only while the narration is about it, or in the detail register.
- Every word stays on the paper with its contrast (the bloom is faint, and the checks pass with it on).

## 18. Camera grammar

| move | what it says | serves |
|---|---|---|
| the whole sheet, held | the system as one drawing; the record | an overview; the verdict; the recap |
| lean in on one part (a 1.6 to 2.2x push: `Loom.cam.frame(E, rect, t, dur)`, or a camera join) | "look here" | the detail register; a failure point |
| track along a path (a pipe, a request, a cable, a chain of steps) | cause and effect | how it works; a sequence |
| locked off while the pen works | deliberation | a revision; a decision being written |
| projection as camera (`D.extrude`, 0 to 1) | the flat plan gains depth | from plan to thing; "what it really is" |
| a pan from FIG. 1 to FIG. 2 (or a `D.fig` rewrite) | versions, steps, time | before and after; stages; revisions |
| pull back out after a detail | back to the whole | returning to teaching |

Transitions: a cut on a section change; a camera move within one sheet; never a dissolve between drawings.

## 19. Sound palette

Low and passive (as decided for the whiteboard engine, D-179): no sound on every stroke.
- **Music:** `calm_focus`; a mechanical, contrapuntal colour suits it (plucked or mallet lines over a steady pulse).
  Music follows the grid (D-173) where the lesson opts in.
- **Foley, at most a few a beat:** one pen scratch on the payoff draw (`sound: true`), a soft click as exploded parts seat
  (`D.explode({click: true})`), one stamp thump on the verdict.
- **Silence:** keep a beat of quiet before a verdict or a failure.

## 20. Native moves (with what they fit in corporate lessons)

| move | the call | fits content like |
|---|---|---|
| drafting order | `D.part` | how a system is built; onboarding to a product; a site layout |
| a live dimension | `D.dim(...).set` | latency budgets, tolerances, capacity limits, SLAs, a cost that grows |
| FIG. 1 to FIG. 2 | `D.fig(...).next` | before and after a change; versions; maturity stages |
| exploded view | `D.explode` | what a thing is made of; a stack's layers; a team's parts |
| section line and hatching | `D.section`, `W.hatch` | what is inside; hidden risk; the layer people forget |
| stepping mechanism | `D.step`, `W.gear` | a process that advances in steps; a pipeline; a cadence |
| title block as story | `D.titleBlock(...).stamp`, `D.revisions` | approvals, change control, compliance sign-off, incident timelines |
| revision cloud | `D.cloud` | "this changed": a policy update, a new step, a fix |
| tracing overlay | `D.overlay` | a proposal over today's process; a future state |
| general notes | `D.notes` | the lesson's rules collected as they are taught |

## 21. Variation space for lessons

- **Structures:**
  - one sheet that grows (teaching, then detail, then the record);
  - two sheets compared, today against proposed (an overlay);
  - a revision history, REV A to REV D, one per section;
  - a teardown: start from the finished drawing and take it apart to the idea.
- **Openings:**
  - a single centre line across an empty sheet;
  - the stamp first (REJECTED lands, then what was rejected is drawn);
  - the title block filled in, then the drawing.
- **Endings:**
  - pull back to the whole sheet with the notes column full;
  - the verdict stamped;
  - a revision row added for the change the lesson asks for.

