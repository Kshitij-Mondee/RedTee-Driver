# Whiteboard: the style guide

STATUS: PARTIAL (2026-10-07, round 2 review). Pack: `packs/styles/whiteboard.json`. Round 1 wrote the guide; round 2
(a fresh art director and technical reviewer) re-checked every API, line number and pack value against the code, re-ran
the contrast and rough.js measurements, looked at the blameless-postmortem frames again, and fixed what did not hold.
Every number carries the command that measured it or is marked as an estimate; every API named was checked in
`docs/SCENE_API.md` or `runtime/` (file and line given where it matters). What was not run is marked **unverified**.
Keys and engine fixes that do not exist yet are marked **proposed (not yet read by the runtime)** and listed in section 15.

The style is never ranked against another style (D-122). "Better" here means closer to this style's own purpose and
references.

---

## 1. Purpose and register

A whiteboard lesson shows **the reasoning being drawn while it is spoken**: one confident marker line, black ink with a
single marker colour for the point that matters, the board filling up as the argument builds. It reads as a skilled
workshop facilitator thinking aloud for working adults: clear, practical, a little informal, never a children's doodle
and never a slide deck photographed on a board. It fits onboarding, soft skills, workshops, how-to, process and
decision explainers, "why this rule exists", and short worked examples (a sum, a cause chain, a checklist). It must not
be used for data-dense quantitative lessons (many series, precise axes) or formal policy text that must look
authoritative (both in the pack's `avoid_for`), nor for emotional story scenes that need lit, coloured places.

**Adult, not childish, in measurable terms:** sentence case, no exclamation marks in board text, no smiley faces,
stars, sparkles or doodled suns as decoration (0 per lesson), people only from a designed kit (section 8), and every
drawn thing carries meaning (a shape with no label and no narration cue is removed).

**References** (studied, never copied or republished):

| reference | take | do not take |
|---|---|---|
| RSA Animate, Cognitive Media (Andrew Park), [overview](https://en.wikipedia.org/wiki/Andrew_Park_(animator)), [technique notes](https://linesandcolors.com/2010/08/27/rsa-animate-cognitive-media/) | the drawing follows the speech word by word; earlier drawings are reused and pointed back to; black line carries everything, colour is rare and means something | the visible drawing hand (Loom has none, section 15); caricatures of real people; page-filling density; puns drawn as jokes |
| MinutePhysics (Henry Reich), [about the channel](https://livescience.com/55121-youtube-channel-minute-physics.html) | one idea per board, very few strokes, the drawing is a diagram not an illustration | the stop-motion jitter and the hand in shot; the deliberately rough lettering |
| Neuland visual facilitation, [kit and colour practice](https://www.neuland.com/en/products/visual-facilitation-kit) | "bold with blacks, ground with greys, pop with colours": black for text and contours, grey for depth, one or two colours for accents | marker product choices; the light highlight colours as text |
| Mike Rohde, The Sketchnote Handbook, [publisher page](https://oreilly.com/library/view/the-sketchnote-handbook/9780133088137) | a hierarchy of lettering (title, heading, body), containers, arrows, bullets and dividers built from five basic shapes | the dense page-filling layout of a personal notebook |
| Business whiteboard practice (VideoScribe-style), [colour](https://functioningmedia.substack.com/p/using-color-effectively-in-whiteboard), [timing](https://functioningmedia.substack.com/p/tips-for-keeping-your-whiteboard) | the drawing starts when the voice names the thing and ends as the point completes; each drawing reads in 1 to 2 s; one or two brand colours used sparingly | stock clip-art libraries; a typewriter pretending to be handwriting; a new board for every sentence |

**Reference board (what "finished" looks like in Loom today).** The two example scenes written with this guide:
`scenes_examples/style_whiteboard_handover.js` and `scenes_examples/style_whiteboard_meeting_cost.js`. Round 1 rendered
them in a headless Chrome in the Cowork sandbox through the lab page (`loom/lab.py` `page()` and `strip()`) with a cue
map supplied by a scratch harness, because `py -m loom lab` only finds scenes in `scenes_examples/lab/`
(`loom/lab.py:22`) and its lab `cue(a)` returns `Number(a) || 0` (`loom/lab.py:41`), so every word cue is 0 (fix:
"loom lab --file with @lab cue map", section 15). Round 2 changed both scenes (every element box is now the true bounds of
what it draws; the person's box ends on the desk line; the consequence label moved inside the safe box) and did **not**
re-render them: **unverified** until the lab fix lands or a lesson uses them. The strips are not in the repo; the failure frames in section 12 are, and are the "not this" half.

---

## 2. Palette roles

Measured 2026-10-07 (round 2) with a standalone WCAG 2.x relative-luminance formula in a `python3 -c` one-liner over
the pack hex values; the numbers match round 1's `loom.checks.style_lint contrast` run exactly.

| token | hex | role | may appear | must never appear | share of a frame |
|---|---|---|---|---|---|
| field | #FBFBF8 | the board | everywhere behind | as a text colour | 70 to 80 % |
| field2 | #F2F2EC | a second board tone; also the `wipe` join matte (`world.js:620,640`) | a large back panel | under small coloured text | under 5 % |
| surface | #FFFFFF | card insides (white on white: it barely shows) | inside outlined cards | as text (sketch renders knockout text as ink, `kit.js:347-351`) | 5 to 15 % |
| surface2 | #EEF1F6 | a pale grey-blue fill | a desk top, a tray | as a big flat block (it reads as a slide panel) | under 5 % |
| ink | #1E2430 | the black marker: every outline, every word | everywhere | nowhere excluded | 8 to 15 % |
| muted | #586274 | the grey marker: notes, secondary labels, faded options | notes at label size | headings, the point of the frame | under 3 % |
| line | #1E2430 | connectors and axes (same as ink) | lines, axes | | in ink share |
| accent | #C2410C | the ONE marker colour that marks what the narration stresses | a circle, an underline, one key word | two different meanings in one lesson; structure (numbers, bullets); body text over hachure | under 3 % |
| accent2 | #1A62C4 | the blue marker: structure (kickers, terms, the "e.g." label) | kickers, a term, a second category | as the emphasis mark (that is accent) | under 3 % |
| accent3 | #BE2A5E | third marker (same hex as neg) | category colour when three are needed | next to neg meaning something else | under 2 % |
| accent4 | #1B784D | green marker (same hex as pos) | category colour | next to pos meaning something else; as a solid fill under ink text (2.84:1) | under 2 % |
| pos | #1B784D | right, done, kept | ticks, a "do" side | decoration | under 2 % |
| neg | #BE2A5E | wrong, risk, stop | crosses, a "don't" side | decoration; a highlight of a correct point | under 2 % |
| shadow | #1E2430 | not used (`shape.shadow` is none) | | grey contact shadows (section 5) | 0 |
| onAccent | #FFFFFF | not used in sketch (knockout text becomes ink) | | | 0 |
| caption_active | #DA8D6D | the spoken word in the caption pill ONLY | captions | anywhere on the board | captions only |

**Text pairs, measured** (ratio to field / field2 / surface / surface2):
ink 15.00 / 13.84 / 15.55 / 13.74; muted 5.93 / 5.47 / 6.15 / 5.43; accent 4.99 / 4.61 / 5.18 / 4.57;
accent2 5.65 / 5.21 / 5.85 / 5.17; accent3 and neg 5.50 / 5.08 / 5.70 / 5.04; accent4 and pos 5.27 / 4.87 / 5.47 / 4.83.
The rule: **any colour used as text, at any size, reaches 4.5:1** on the tone it sits on. Every marker colour holds it
on every board tone. Reason: Patrick Hand and Caveat have thin, uneven strokes, and H.264 4:2:0 halves colour
resolution, so luminance contrast is what survives the encode. The `paper` background shader darkens the field by up to
about 6 % in places (`fx.js:64`, estimate from the formula, not measured on a frame), so the ratios above are a ceiling.

**Forbidden pairs (measured):** ink on a solid accent4 fill 2.84:1; ink on a solid accent2 fill 2.66:1 (both happen
only where a template draws a crisp fill, section 10); coloured text on any hachured fill; muted text on field2 below
label size; accent and neg side by side as two "reds" with different meanings (hues 17.5 and 338.9 degrees, 38.6 apart,
measured with `colorsys`); caption_active on the board.

**How many marker colours in one frame:** ink, plus muted for notes, plus **at most two** marker colours, and one of
the two is either accent (emphasis) or a semantic pair (pos with neg). Three or more saturated hues in one frame is the
"crayon box" look (seen: `projects/blameless-postmortem/qa/frames/8.96.png` has blue, orange, raspberry and green).

**Text roles for templates and chrome:** proposed (not yet read by the runtime) pack `roles`, with the value this
style would set. Until they land, scenes pass these tokens by hand and templates keep their hard-coded colours.

| role | whiteboard value | why |
|---|---|---|
| kicker | accent2 | already `kit.kicker`'s default (`kit.js:478`) |
| term | accent2 | the definition template's term (`core.js:91`) |
| verdict | ink, on the field, no pill | a written conclusion, underlined in accent if it is the point |
| date | accent2 | timeline `when` labels (`more.js:395`) |
| quiz_letter | ink | the letter sits in a rough ring, never on a solid disc |
| recap_rule | ink | written, with an accent underline |
| stat_value | ink | a number is written in Caveat; accent only by an underline |
| chapter_kicker | muted | the section chrome colour today (`overlay.js:96`) |
| ui_mark | accent | the one mark on an artefact |
| link | accent2 | |
| button | ink | an outlined rough box with ink words |
| me_bubble | surface2 | the learner's own chat bubble, pale, ink words (13.74:1) |
| person_cloth | accent2 | the pack's `characters.cloth` today |

---

## 3. Type

| role | family | pack range px | use | never |
|---|---|---|---|---|
| display, hero | Caveat 700 | 120 to 180, 110 to 160 | one word or number that is the payoff | sentences |
| title | Caveat 700 | 72 to 104 | the board heading, written terms of a sum, a closing question | below 72 px (Caveat's x-height is small) |
| lead | Patrick Hand 400 | 38 to 48 | labels on drawn things, row text, short statements | more than 2 lines |
| body | Patrick Hand 400 | 34 to 40 | sentences inside a card | over 45 characters a line |
| label | Patrick Hand 400 | 28 to 34 | notes (muted), kickers (caps, 0.2 em, accent2) | coloured text over hachure |
| caption | Patrick Hand 400 | 24 to 28 | tiny annotations, axis numbers | anything the learner must read to follow |

- **Mono:** the pack loads JetBrains Mono 400 but has **no `mono` entry in `type`**, so `kit.text(..., {role: "mono"})`
  raises `unknown_type_role` (`kit.js:415`). Code and file names are written in the `label` or `body` role; mono stays
  out of this style until the pack gives it a range.
- **Weight:** both hand faces load ONE weight (Caveat 700, Patrick Hand 400; `style.js:88` declares only the pack's
  faces). `kit.text` passes any requested weight straight into the CSS font (`kit.js:306-307`), so a weight above 400 on
  a Patrick Hand role makes the browser synthesise a bold that smears the strokes (seen at 203.97 "no checkout test").
  Never pass `weight` to a whiteboard text. 20 calls in `runtime/templates/` still pass 700 or 800 (counted by grep
  `weight: ?(700|800)` over `runtime/templates`: documents.js 3, core.js 6, more.js 9, _helpers.js 2), plus the
  section chrome and the avatar card title in `overlay.js:96,202`. Fix: "font weight clamp to loaded weights (no
  synthetic bold)", section 15. Emphasis is colour, an underline or size, never weight.
- **Case:** sentence case everywhere; caps only for a kicker (`kit.kicker`, at most one per frame, at most 4 words:
  `kit.js:477` warns above that). No italics (Caveat already slants).
- **Numbers that are the point** are written in Caveat at title size (72 px) or larger, so they read as the presenter's
  hand.
- **Line length:** lead and body at most 45 characters a line; a board is read at a glance, not studied.
- **Stroke and type weight agree:** the pack stroke (3.6 px) is about the stem of Patrick Hand at body size
  (estimate by eye on the round 1 strips), so lines and words look like one pen. Emphasis marks (circle, underline)
  go to 5 to 6 px, nothing heavier.

---

**Two faces in an engine lesson** (Kshitij, 2026-10-15, "Two faces"; D-179): when the whiteboard engine draws the
lesson, every word on the board is written by the engine in its single-line marker hand, and only headings (the board
heading, a zone's or a column's heading) are in the display face, Caveat 700, revealed under the hand
(`board.heading`). Patrick Hand stays for captions and for the classic way (`"engine": "off"`). The engine audits the
board when it is built (`wb_face`). Film A showed three faces at once and read as messy.

## 4. Shape language

- **One marker line:** `shape.stroke` 3.6 px, rough.js with the pack's `shape.sketch`: `roughness` 1.1, `bowing` 1.0,
  `single` true, `hachureGap` 10, `fillWeight` 1.8, `fillOpacity` 0.45. All six keys are read by `K.sketch`
  (`kit.js:277-297`); `single` maps to rough.js `disableMultiStroke` (`kit.js:285`). Round 2 ran rough.js under node with
  these options: a single-stroke rectangle has 4 sub-paths where the default has 8, i.e. one line per edge, not two.
  The double stroke read as a software sketch, not a marker (corners at `qa/frames/82.59.png`). Note: the kit reads
  `roughness` and `bowing` with `||`, so a value of 0 is ignored and becomes 1.1 or 1.
- **Icons at the same line:** `kit.icon` sets `stroke-width` inside a group scaled by size / 24 (`kit.js:494`), so the
  drawn line is stroke x size / 24 px. Pass `stroke: 24 * 3.6 / size` to keep the marker line (a 120 px icon at the
  pack's `icons.stroke` 2.4 is a 12 px stroke, heavier than every outline: the cart at 203.97). The `stroke` option is
  real (`kit.js:494`) but not listed in `docs/SCENE_API.md`. Icon sizes 48 to 112 px.
- **Corners:** rough rectangles are square with slight overshoot whatever the radius (rough.js has no rounded
  rectangle; `K.sketch` passes no radius); `shape.radius` is 6 so crisp companions (highlight rings, backing rects)
  match them (a rounded crisp ring around a square rough card at `qa/frames/228.25.png`).
- **Card:** a rough rectangle outline (`kit.rect` or `kit.sketch(g, "rectangle", ...)`) with `fill: "none"` or surface,
  sized to its words with `kit.fit` plus an inset of at least max(6 px, 0.2 x the font size) (`kit.js:458`). Never a
  1350 px row around 400 px of text (262.94).
- **Label:** words beside the thing, within 40 px, with a short hand leader if needed. No pills: in sketch shading
  `kit.pill` becomes a square rough box (`kit.js:218` passes `r`, `kit.js:94` drops it; "several conditions" at 203.97).
  Rounded rects and pills in sketch are proposed (section 15).
- **Badge:** a rough circle (`kit.disc`, sketch branch `kit.js:145`) with an icon at marker weight; hachure inside only
  if it carries a category.
- **Arrow:** a hand arrow: one shaft through `kit.sketch(g, "path", [d])` (straight or one quadratic bend) and an open
  head of two strokes, 22 px each, 0.5 rad either side of the shaft. `kit.arrow` is crisp with a filled triangle head
  even in sketch (`kit.js:190-206`, it calls the crisp `K.path`): it reads as a vector diagram among rough boxes
  (203.97). Recipe 11d. Engine fix: "rough arrows with open heads in sketch shading", section 15.
- **Connector and divider:** one sketch path, slightly bowed. `kit.line` already sketches in this style
  (`kit.js:182`) unless the caller passes `crisp: true`; `kit.path` never sketches (`kit.js:185-188`). A ruled line under
  a sum is drawn before the total.
- **Dashes:** none. A dashed crisp line or box reads as software, and `m.draw` overwrites `stroke-dasharray`
  (`motion.js:87`), so a drawn dashed line ends solid. A "pending" or "blank" thing is a rough box with muted words.
- **Tick and cross:** without a lesson design seed, `kit.mark` draws `kit.disc` with the pos or neg fill
  (`kit.js:226-236`): in sketch that is a rough ink circle with pos or neg hachure at 0.45 and an ink tick or cross
  (`S.on` returns ink in sketch, `style.js:41`). It is not the dark-fill rule (pos and neg are 5.27 and 5.50 to the
  field, under 7). With a design seed the mark takes the seed's treatment (`kit.js:223`, **unverified** in this style).
  For a checklist, a hand tick inside a rough box (handover example) needs no colour at all.
- **Bullet:** a short hand dash or a small rough circle 16 to 20 px; a `kit.disc` with `fill: "ink"` becomes an ink
  ring (dark fills become outlines, `kit.js:280`), so a "dot" bullet is an "o".

---

## 5. Light, shading, depth and texture

- **No light, no shadow, no gradient.** `shape.shadow` is none. Hachure is the only shading.
- **Hachure:** `fillStyle` hachure, `hachureGap` 10, `fillWeight` 1.8, `fillOpacity` 0.45 (applied as the `opacity`
  attribute of the fill paths only, `kit.js:297`), angle -41 (kit default, `kit.js:285`; the pack sets no angle). Use it
  for: a header band of a card, an icon disc, bars of a chart, ONE hero shape. Two hachured areas per frame at most.
  Only ink text sits on hachure, at lead size (38 px) or larger (the header bands at 174.35 read; coloured text over
  hachure does not).
- **A dark fill becomes an outline** (`kit.js:280`: contrast with the field of 7:1 or more, which is ink, line and
  shadow): never ask for an ink-filled shape to get a dark block; it will be a paper-filled ink outline.
- **Texture and finish:** `fx.background` "paper" (fibre texture and a soft lamp falloff, `fx.js:61-65`), vignette 0.08,
  grain 0. `fx.intensity` 0.8 is inert here: the paper shader never reads `u_k` (`fx.js:61-65`). The vignette is drawn
  over everything, ink included (`fx.js:84-89`); proposed `fx.vignette_under: true` (not yet read by the runtime) puts it
  under the drawing so lines keep their black. Paper fibre on a board is a mild material mismatch, not judged on an
  encoded MP4 (**unverified**). No boil, no stepped time (section 7).
- **Spotlight and light sweep:** never. `ctx.fxMoment("spotlight", ...)` dims everything outside a rect with black at
  0.55 (`fx.js:104-106`), which greys the board; the light sweep is additive white (`fx.js:103`) and vanishes on a white
  board. Proposed `fx.spotlight: {strength, tint}` (not yet read by the runtime) would let this style set
  `{strength: 0}`; the emphasis here is a drawn circle or underline.
- **Depth:** none. Things sit on the board, not in a room. A person stands behind a drawn desk line, not in a set.
- **Contact shadows:** some `Loom.obj` objects draw grey ellipse shadows (round 1 `lab_objects` render, frame 05.80,
  not in the repo): on a board an object has no shadow; use icons or rough shapes (section 9).

---

## 6. Composition

- **Frame:** station 1920 x 1080; safe box `{x: 96, y: 84, w: 1728, h: 846}` (`docs/SCENE_API.md` ctx.box); the caption
  band is everything below y 930. Nothing drawn below 930, nothing right of x 1824.
- **Captions:** the pack's pill `rgba(30,36,48,0.95)` (composited over the field: #292F3A), Patrick Hand 38 px at
  weight 400, radius 14, top 948. Caption text (surface) 13.44:1, active word (caption_active) 5.13:1, measured as in
  section 2. The active word differs by colour only (2.62:1 from the other words), never by weight or size, so lines do
  not reflow (`overlay.js:9`).
- **Chapter chrome:** when the manifest has `chrome.section_labels`, the section title is written at x 96, y 44 in the
  label face, caps, 0.18 em tracking, muted, 24 px, weight 800 (`overlay.js:96`; the 800 is a synthetic bold today,
  visible at 203.97 and 228.25). Rules: section titles 4 words or fewer; the board heading starts at y 96 or lower (at
  least 20 px under the chrome text); a board under chrome carries no kicker (two caps labels stacked read as a slide
  header). Proposed role `chapter_kicker` = muted (section 2).
- **The board accumulates.** Heading top-left (x 120, y 96); the argument runs left to right, top to bottom, in the
  order it is spoken; the drawing order is the reading order. Nothing is removed mid-board: a correction is a
  strike-through or a cross over it, never an erase.
- **Density:** 3 to 7 drawn units per board (a unit = one container with its words, one figure, one connector group).
  At the end of a beat roughly a third (30 to 45 %) of the safe box is still empty (estimate from the example scenes,
  not measured). A frame with only a heading (the snapshot frame "Blameless does not mean nobody owns anything",
  `qa/snapshot.jpg` row 2) is a slide, not a board.
- **When to wipe:** start a new board when the topic turns, when the board would pass 7 units, or when the next idea
  would need something removed. One board usually lasts 1 to 4 beats. Joins: section 7.
- **At a new section, carry a little and wipe the rest** (Kshitij, 2026-10-15: "You can carry text and designs over from
  previous frames/sections but not too many so there is enough place for new text and explanation. The rest gets wiped
  off at the end of the section"). Carry only what the new section builds on; everything else leaves at the end of its
  own section. Measured by the check (`board_carry`, the pack's `board.carry`): at a section's first spoken moment, what
  is still on screen from earlier sections covers at most 40 % of the frame and holds at most 10 words. Film A of the
  engine comparison carried its whole matrix through four sections (24 words at sec3) and read as messy.
- **Room around every word:** a word never sits on a line. A label goes beside its box, not on its edge; a heading
  sits above its box; dividers and axes stop short of the words near them; an arrow ends before the words it points
  at; a grid's cells are wider than their words. The check reports any line through a word (`line_through_text`).
- **Focal point:** the one accent mark (a circle, an underline) is the focus; everything else is ink.
- **People:** one person per board (two only for a dialogue, as in the blameless b07 exchange in `qa/snapshot.jpg`
  row 3), a bust 300 to 360 px tall, in the left or right third, over a drawn desk line or inside a drawn frame,
  facing into the board; the bust's bottom edge sits ON the desk line, never below it.
- **Text and pictures:** a label sits beside or under its drawing, within 40 px; a sentence never floats in a big empty
  card; centred card grids are the "slides on a board" tell.

---

## 7. Motion

Personality: calm, drawn, never bounced (`motion.overshoot` false; pack durations enter 0.5, move 0.36, exit 0.3,
draw 0.9, stagger 0.09, count 1.1; read through `Loom.style.dur`, `style.js:74-79`).

- **Entrances that fit:** `m.draw` for every stroke (outlines, connectors, icons, ticks, marks); `m.unmask(E, t,
  {dir: "ltr", dur})` for words (a left to right clip, `motion.js:139-145`: the closest Loom has to writing until
  "single-stroke write-on lettering" lands); `m.reveal(E, t, {dy: 0})` (a fade, no slide) for designed assets that
  cannot be drawn on (peeps, vendor art) and for a hachure fill after its outline.
- **Never in a bespoke whiteboard scene:** `m.pop`, `m.drop`, `m.stamp`, `m.settle`, `m.converge`, `m.iris`,
  `m.spring`, `m.emphasis` scale pulses, slides in from off-board. (Templates still use some of these: section 10.)
- **What m.draw can hide:** it animates only `path`, `line`, `polyline` and `circle` (`motion.js:74`). Anything else in
  the element (text, `rect`, `ellipse`, `polygon`) is visible from frame 0. A drawn element holds strokes only; check
  a Lucide icon's body for `rect` or `ellipse` before drawing it (`clock`, `user`, `ticket`, `moon` are paths and
  circles: checked in `assets/icons/lucide.json`).
- **Draw duration by stroke length:** `S.dur("draw") * clamp(length / 900, 0.3, 1.4)`: 0.27 s floor (any stroke under
  270 px), 0.3 s for a 300 px tick box, 0.9 s for a 900 px card outline, 1.26 s cap (at 1260 px or more). That is about
  1000 px/s, inside the references' "reads in 1 to 2 s" window. A connector that leads its words is capped at 0.45 s.
- **Writing duration by length:** `S.dur("draw") * clamp(chars / 14, 0.45, 1.8)`: 0.41 s minimum, 1.62 s maximum, about
  15.6 characters a second in between.
- **Timing against the voice:** a container or connector may start up to 0.4 s BEFORE its cue; its words start being
  written within 0.4 s AFTER the cue. Drawing connector, then box, then words all after the cue made the words trail
  the voice by about 1 s in the first render of the handover scene (fixed, F16). Nothing new after 85 % of the speech
  (`docs/SCENE_API.md` Rules).
- **Stroke order:** container, then its icon, then its words; arrow shaft, then head; box, then tick; a circle starts
  at the top and overshoots past its start on the side away from other strokes. One exception: a picture that only
  illustrates a written consequence may follow its words (the moon after "Holds overnight" in the handover example).
  Engine fix "stroke order", section 15.
- **One element per stroke group:** `m.draw` shares its duration across paths by length (`motion.js:76-89`), and an
  icon's lengths are in its 24-unit grid, so an icon drawn in the same call as a box gets almost no time. Give icons
  their own element.
- **Hachure and m.draw:** rough.js emits the fill set BEFORE the outline (round 2 ran it under node:
  `sets = fillSketch, path`), and `m.draw` draws paths in DOM order, so the hatching draws first and the outline last.
  Its tween also starts each path at `opacity: 1` (`motion.js:105`), which replaces the 0.45 fill opacity attribute, so
  the hatch lands at full strength (round 1 probe render, not in the repo). Until "m.draw stroke-first, keeps per-path
  opacity and dashes" lands, draw the outline from a `fill: "none"` copy and fade the filled copy in after it (recipe
  11c). Round 2 confirmed under node that the outline of a rough rectangle is identical with and without a fill, so
  the two copies overlap exactly.
- **Emphasis:** ONE per scene, drawn: a marker circle or underline in accent, 5 to 6 px.
- **Ambient:** none (`ambient.kind` none). `Loom.stepped.on` and `Loom.stepped.boil` are ALLOWED by the runtime here
  because the pack's `look_family` is "illustrated" (`stepped.js:49`: no warning will fire), but marker on a board does
  not boil: never call them in this style.
- **Joins (between beats; `world.js:408-455`, covers `world.js:618-646`):**
  - `camera` (the pack's `join_default`, 0.95 s, editorial ease): pans to the next station, which reads as "the next
    part of the board". Use it between boards of one topic.
  - `wipe` with `dir: "right"` (0.9 s): a field2 matte crosses the frame (`world.js:635-640`), which reads as the board
    being wiped clean. Use it at a topic turn, at most once per chapter. The matte is only 1.08:1 against the field
    (field2 on field, same formula), so the wipe edge is faint (**unverified** on a frame).
  - `fade` (0.8 s, through the field colour): a soft topic turn when the next board starts from nothing.
  - `cut`: the first beat only, or a hard change of place.
  - Never `dip` or `iris` (both go through black), never `zoom` punches, never material joins `torn`, `page`, `scroll`
    (other materials, cartoon register); `handoff` is acceptable, `fill` is not (it floods the board with a colour).
- **Moving a drawn thing to the next board:** prefer a camera join and `ctx.held`. `m.travel` writes one drive per call
  with no drive key (`motion.js:211-214`), so chain at most one `m.travel` per element per scene until the shared fix
  "M.travel drive key" lands (section 15).

---

## 8. People and living characters

- **What the code may place:** `kit.peep(parent, member, emotion, {x, y, size, flip, cloth, skin})` (Open Peeps, CC0,
  hand-drawn line busts with flat fills; members woman, man, girl, boy, elder_woman, elder_man; emotions neutral,
  happy, surprised, explaining; keys checked in `assets/peeps/peeps.json`). It is the designed kit closest to this
  style today. Reveal it with a fade; do not `m.draw` it (its fills would show before its lines, `motion.js:74`). In
  workplace lessons use the adult members only (woman, man, elder_woman, elder_man).
- **Peep caveats seen:** the solid ink hair is the darkest mass in the frame (`qa/frames/8.96.png`). `kit.peep` also
  reads `hair` (`kit.js:510`, not in SCENE_API): `hair: "muted"` turns that mass grey (**unverified** on a frame).
  Size 300 to 360 px, never cropped by the caption band.
- **Do not use in this style:** `ctx.character` rigs (flat filled code-drawn figures, a different register:
  round 1 `lab_characters` render; code-drawn people rated 1.86 of 5 in E1, `skills/lnd/lnd-character-design` rule 2);
  `ctx.crowd`; `Loom.place` sets (solid flat-colour rooms, round 1 `lab_props_people` frame 08.60, and the desk and
  laptop at `qa/frames/8.96.png`).
- **Counts of people** in a diagram are pictograms: Lucide `user` or `users` at marker weight (the character skill's
  pictogram exception, `lnd-character-design` section 7), drawn one after another by one `m.draw`.
- **Never** a figure from circles and rectangles in scene code. When the kit lacks a pose, frame the beat without the
  person (the object they handle, a speech bubble, the board alone) and use the asset request A1 (section 15).
- **Proposed pack keys** (not yet read by the runtime): `roles.person_cloth` = accent2 (the one marker slot on a kit
  figure) and `characters.bottom` = "surface" (trousers drawn as an outline with paper inside, so a full figure keeps
  one marker colour). Until they land, busts only, and `cloth` stays the pack's `characters.cloth` (accent2).
- The character prompt library has no marker-on-whiteboard block yet; the nearest is S5 "Hand-drawn ink and wash"
  (`docs/assets/CHARACTER_PROMPTS.md:124`). Request A1 below gives the block to add.

---

## 9. Objects, icons, data and UI

- **Icons:** Lucide line icons at marker weight (section 4), ink by default, accent only when the icon IS the
  stressed thing. Draw them on with `m.draw` in their own element. One icon family per lesson.
- **Objects (`Loom.obj`):** in this style the family is mixed: some pieces sketch, some draw solid flat polygons and
  grey contact shadows (envelope flap, box faces, folder, calendar: round 1 `lab_objects` frame 05.80). Use an icon or
  a few rough shapes instead until "places, objects and data fills through kit.sketch, no contact shadows" lands.
  Proposed `materials: {wood, chair, screen}` (not yet read by the runtime) for this style: `{wood: "field2", chair:
  "surface2", screen: "surface"}`, so a drawn desk is an outline with a pale tone, never a brown block.
- **Numbers:** written, in Caveat, at title size or larger; a worked sum is written term by term with a ruled line
  before the total (meeting-cost example). A rolling counter (`m.count`) is a screen device, not a board one: write the
  final number. Proposed role `stat_value` = ink.
- **Charts:** `Loom.data.barsOn` draws rough hachured bars (round 1 `lab_data` frame 04.60); its line chart axis is
  crisp and the event label can overlap the line (same frame); `Loom.data.tag` is a solid filled tag (same frame), off
  register. Keep charts to one series and 3 to 5 bars, one hachure colour, values written above the bars in ink.
- **Isometric:** `iso` boxes become outlines in sketch, but the grid lines are crisp and thin and the labels are tiny
  (`docs/styles/demos/lab/lab_iso__whiteboard.jpg`, looked at in round 2): no iso in this style.
- **Mail, chat and documents:** `Loom.ui.*` are realistic crisp UI artefacts. On a board, draw a rough frame and write
  the three words that matter; keep the real artefact only for a beat that is explicitly "on screen" (**unverified** in
  whiteboard; not rendered). `ui.button` labels pass weight 700 (`interaction.js:47`): synthetic bold until the weight
  clamp lands. Proposed roles `ui_mark` accent, `link` accent2, `button` ink, `me_bubble` surface2 (section 2).

---

## 10. Templates in this style

Read from the code in round 2 (file and line given) and checked against the blameless-postmortem frames where one
exists. These notes describe a lesson WITHOUT a design seed; with a seed (D-82, the default for new lessons) cards,
marks and icon discs take the seed's treatment, which is sketch-aware in part (`treat.js:111-112`) but **unverified**
in this style. Every template below still passes weight 800 somewhere (section 3) and uses entrances this style avoids
in bespoke scenes; that is engine work, not something a storyboard can fix.

| template | what it does here (code) | set or avoid |
|---|---|---|
| title.card | vertically centred stack (`core.js:60`); kicker `m.drop`, icon disc `m.iris`, title `m.unmask`, a crisp 180 x 8 accent rule (`core.js:51`, `crisp: true`), subtitle `m.settle` | use only as the opener or a chapter divider, never as a board heading; `align: "left"`; no `icon`, no `panel` (a field2 r 60 rect: square in sketch, and it irises); kicker 2 words or none; title 6 words or fewer |
| definition | term in accent2 Caveat drops in (`core.js:91-92`), crisp accent rule 220 x 7 (`core.js:96`), definition unmasks top to bottom, "e.g." card settles; icon disc hachured accent4 with `m.iris` (`core.js:117-118`) | renders well (round 1 `lab_tpl_definition`); leave out `icon` (with it the frame holds accent2, accent and accent4: three marker hues); example 12 words or fewer |
| compare.two | panels slide in 140 px (`m.converge`, `core.js:223`); header band hachured pos, neg or surface2 with an ink header at weight 800 (`core.js:214,219`); item bullets are pos, neg or ACCENT for a neutral side (`core.js:229`); `verdict` is a pill (square rough box, hachured accent2) that stamps (`core.js:245-248`) | `valence: "neg"` only for the "don't" side, and then give the other side `valence: "pos"` (a neutral side's accent bullets beside a neg band are the two-reds failure F9); `verdict: right/wrong` only for a true right/wrong; no top-level `verdict` object (write the conclusion in the next beat); 2 to 4 items per side or the cards stay half empty (82.59) |
| document.page | the page is `kit.rect` fill ink (`documents.js:25`), so in sketch a rough paper page with an ink outline; the header band is a CRISP solid accent4 fill (`documents.js:28-29`) and the title on it is ink at weight 800, because `pickTokenOn` returns ink in sketch (`_helpers.js:144`): ink on accent4 is 2.84:1 (section 2) | do not use in this style until the band honours sketch (predicted from code and the measured pair, not rendered); draw a rough page in a bespoke scene instead (recipe 11b plus `kit.text` lines) |
| list.steps | each row card is 0.78 of the box wide (`core.js:145`, 1348 px) whatever its text; number marker is a hachured accent disc with an ink numeral at weight 800 (`core.js:148-149`); rows `m.settle` | `marker: "tick"` (pos, keeps accent free for the one stressed thing); 3 to 4 items of 8 to 12 words each so rows are not two thirds empty (262.94); for a checklist that builds as spoken prefer the handover recipe |
| process.flow | step discs `m.pop` (no overshoot here); connectors are crisp `kit.arrow` with filled heads (`core.js:291`); labels at weight 800 (`core.js:285`); last step a hachured accent disc; `token` is an ink pill, so a square rough box (`core.js:301`) | 3 to 4 steps; no `token`; for a causal chain drawn as spoken prefer a bespoke board with recipe 11d arrows |
| timeline | spine is a crisp `kit.arrow` with a filled head (`more.js:385`); ticks crisp (`more.js:393`); dots r 14 hachured accent2; `when` in accent2 at weight 800; events `m.settle` | 4 events at most, `when` 2 words or fewer; the spine stays off register until the arrow fix (seen in the blameless "Rule, then timeline" beat, `qa/snapshot.jpg` row 2) |
| quiz.question | kicker "Your turn" drops; options `m.pop`; letter discs hachured accent2 with an ink letter at weight 800 (`more.js:47-48`); pause bar is a crisp rounded accent4 bar (rx 36, opacity 0.55) inside a square rough box (`more.js:59-60`) | options 10 words or fewer; accept the pause bar until rounded rects in sketch land (**unverified** look); never two quizzes on one board |
| quiz.answer | wrong options fade to grey, the right one gets a crisp ring and a mark | renders cleanly (`qa/frames/228.25.png`); the ring matches square corners only because `radius` is 6 |
| recap | thread is a crisp dotted `kit.path` (`more.js:269`); tokens `m.pop`; icon discs with accent2 icons; labels at weight 800 fade from accent2 to ink; `rule` is a hachured accent2 pill that stamps (`more.js:284-286`) | 3 to 4 items, each with an icon that says what it is (a mistake gets `circle-x`, never the default `check`); no `rule` (write the pocket rule on a closing bespoke board) |
| avatar | a rough circle frame and the peep, both `m.iris` (`overlay.js:172-173`); kicker drops; card title at weight 800 in accent2 (`overlay.js:202`); card bullets are accent discs; card settles | no `card.title`; card lines 9 words or fewer; prefer the person on the board (section 8) when the beat explains |

---

## 11. Recipes (code)

Every call below exists and was checked in round 2: `kit.sketch(g, shape, args, o)` (`kit.js:258`), `kit.text`
(`kit.js:411`), `kit.icon` with `stroke` (`kit.js:490-498`), `kit.peep` (`kit.js:501`), `ctx.el`, `ctx.cue`,
`ctx.speechStart` (`docs/SCENE_API.md` ctx), `m.draw` (`motion.js:59`), `m.unmask` (`motion.js:139`), `m.reveal`
(`motion.js:25`), `Loom.style.dur` (`style.js:74`). All colours are tokens, every cue is a string literal, every element
box is the true bounds of what is drawn in it (local coordinates 0..w, 0..h), nothing is random. Times like
`tTotalWritten` and `tMoon` stand for values the scene computed earlier.

**a. Timing helpers (top of every whiteboard scene)**
```js
const S = Loom.style, DRAW = S.dur("draw");
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const drawDur = (len) => DRAW * clamp(len / 900, 0.3, 1.4);
const writeDur = (str) => DRAW * clamp(String(str).length / 14, 0.45, 1.8);
const hand = (g, d, o) => kit.sketch(g, "path", [d], Object.assign({ fill: "none", stroke: "ink" }, o || {}));
```

**b. A box drawn, then its words written, leading the cue**
```js
const t = ctx.cue("still open");
const box = ctx.el("open_box", { x: 790, y: 465, w: 96, h: 130, kind: "row", exit: "recede" });   // the box only
kit.sketch(box.inner, "rectangle", [0, 27, 76, 76], { fill: "none" });
const dB = drawDur(304); m.draw(box, t - 0.35, { dur: dB });
const w = ctx.el("open_words", { x: 902, y: 465, w: 588, h: 130, kind: "text", exit: "wipe" });
kit.text(w.inner, "What is still open", { role: "lead", x: 0, y: 0, w: 588, h: 130, maxLines: 1, valign: "middle" });
m.unmask(w, t - 0.35 + dB * 0.6, { dur: writeDur("What is still open") });
```

**c. A hachured shape drawn in the right order (outline first, hatch after), until the m.draw fix**
```js
const tt = ctx.cue("the busy team");
const line = ctx.el("team_outline", { x: 300, y: 300, w: 400, h: 240, kind: "card", exit: "recede" });
kit.sketch(line.inner, "rectangle", [0, 0, 400, 240], { fill: "none" });   // same shape and args: same seed, same outline
const hatch = ctx.el("team_hatch", { x: 300, y: 300, w: 400, h: 240, kind: "card", exit: "recede" });
kit.sketch(hatch.inner, "rectangle", [0, 0, 400, 240], { fill: "accent2" }); // hatch at the pack's 0.45
m.draw(line, tt, { dur: drawDur(1280) });
m.reveal(hatch, tt + drawDur(1280), { dy: 0 });                               // a fade keeps 0.45; m.draw would not
```

**d. A hand arrow with an open head, in its own element with a true box**
```js
// shaft through (x1, y1) and (x2, y2), bent by `bend` px; head of two 22 px strokes at 0.5 rad
const arrowEl = (name, x1, y1, x2, y2, bend, o) => {
  const L = Math.hypot(x2 - x1, y2 - y1) || 1, mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
  const cx = mx - ((y2 - y1) / L) * bend, cy = my + ((x2 - x1) / L) * bend;
  const a = Math.atan2(y2 - cy, x2 - cx), hs = 22;
  const h1 = [x2 - hs * Math.cos(a - 0.5), y2 - hs * Math.sin(a - 0.5)], h2 = [x2 - hs * Math.cos(a + 0.5), y2 - hs * Math.sin(a + 0.5)];
  const xs = [x1, cx, x2, h1[0], h2[0]], ys = [y1, cy, y2, h1[1], h2[1]], P = 12;   // a quadratic stays inside its hull
  const bx = Math.floor(Math.min(...xs) - P), by = Math.floor(Math.min(...ys) - P);
  const E = ctx.el(name, { x: bx, y: by, w: Math.ceil(Math.max(...xs) + P) - bx, h: Math.ceil(Math.max(...ys) + P) - by, kind: "connector", exit: "recede" });
  const X = (v) => (v - bx).toFixed(1), Y = (v) => (v - by).toFixed(1);
  hand(E.inner, `M${X(x1)} ${Y(y1)} Q${X(cx)} ${Y(cy)} ${X(x2)} ${Y(y2)}`, o);                      // shaft first
  hand(E.inner, `M${X(h1[0])} ${Y(h1[1])} L${X(x2)} ${Y(y2)} L${X(h2[0])} ${Y(h2[1])}`, o);         // then the head
  return { E, len: L * 1.1 };
};
const A = arrowEl("link", 530, 725, 772, 355, -40);
m.draw(A.E, ctx.cue("so it reaches"), { dur: Math.min(0.45, drawDur(A.len)) });
```

**e. The one accent: a marker underline under a written result**
```js
const u = ctx.el("total_underline", { x: 1030, y: 700, w: 700, h: 30, kind: "mark", exit: "recede" });
hand(u.inner, "M0 18 C 180 8, 420 6, 640 12", { stroke: "accent", sw: 6 });
m.draw(u, tTotalWritten - 0.1, { dur: drawDur(640) });
```

**f. A person over a drawn desk line, and an icon at marker weight**
```js
const desk = ctx.el("desk", { x: 110, y: 560, w: 420, h: 20, kind: "scenery", exit: "recede" });
hand(desk.inner, "M0 10 L420 8"); m.draw(desk, ctx.speechStart + 0.4, { dur: drawDur(420) });
// the bust is 340 px: its box ends at y 570, ON the desk line
const p = ctx.el("person", { x: 140, y: 230, w: 360, h: 340, kind: "character", exit: "recede" });
kit.peep(p.inner, "woman", "explaining", { x: 180, y: 170, size: 340 });
m.reveal(p, ctx.speechStart + 0.55, { dy: 0 });
const ic = ctx.el("moon", { x: 1600, y: 290, w: 180, h: 120, kind: "icon", exit: "recede" });
kit.icon(ic.inner, "moon", { x: 90, y: 60, size: 96, stroke: 24 * 3.6 / 96 });   // a 3.6 px line at any size
m.draw(ic, tMoon, { dur: drawDur(300) });
```

**g. A new board at a topic turn (storyboard data, not scene code)**
```json
{ "beat": "b07", "join_in": { "type": "wipe", "dir": "right" } }
```
`join_in.type` and `join_in.dir` are read by `world.js:431` and `world.js:636`; between boards of one topic leave
`join_in` out and the pack's `join_default` camera pan applies.

**How round 1 rendered the examples:** a scratch script imported `loom.lab`, pointed `LAB` at a temp folder holding a
copy of the scene with a `// @lab {"dur": 15.5, "times": [...]}` line added, replaced the lab page's
`cue(a) { return Number(a) || 0; }` with a lookup in a word-to-seconds map, then called `strip(..., out_dir=...,
frames_dir=...)`. 10 frames per scene, 0 errors, 0 warnings. With a real lesson, `py -m loom snapshot <id> --at ...`
is the path (not run in either round).

---

## 12. Failure modes seen in real frames

| # | seen at | what | why | prevention |
|---|---|---|---|---|
| F1 | every captioned frame of blameless-postmortem (e.g. `qa/frames/228.25.png`) | active caption word 3.65:1 on the pill | accent was a mid-tone; the old lint did not composite the pill | FIXED: caption_active 5.13:1 (re-measured round 2); `style_lint` now checks the pill |
| F2 | probe frame "accent label text"; kickers at 82.59 | marker colours at 3.1 to 4.3:1 as small text | bright accents, thin hand faces, 4:2:0 chroma | FIXED: accents deepened, all 4.57:1 or more on every board tone (re-measured round 2) |
| F3 | `qa/frames/82.59.png`, 174.35 | doubled outlines, a software-sketch look | rough.js multi-stroke default | FIXED: `sketch.single` true (8 sub-paths become 4, node run in round 2) |
| F4 | `qa/frames/228.25.png` (quiz.answer) | a crisp rounded green ring around a square rough card | radius 18 used by crisp companions | FIXED: radius 6 |
| F5 | `qa/frames/203.97.png` | crisp straight arrows with filled triangle heads among rough boxes | `kit.arrow` ignores sketch (`kit.js:190-206`) | RULE: hand arrows (11d); ENGINE: rough arrows with open heads |
| F6 | round 1 scratch probe render (not in the repo; reproduce with recipe 11c's two cards, one drawn, one faded) | drawn hachure at full strength, outline drawn last | rough.js emits fill before outline; `m.draw` sets opacity 1 (`motion.js:105`) | RULE: recipe 11c; ENGINE: m.draw stroke-first |
| F7 | `qa/frames/203.97.png` node labels; the section chrome in every frame | smeared synthetic bold in Patrick Hand | templates and chrome ask for 700 or 800 on a 400-only face | RULE: no weight on whiteboard text; ENGINE: font weight clamp |
| F8 | `qa/frames/203.97.png` "several conditions" | pills drawn as square boxes | rough rectangle ignores radius | RULE: no pills; labels are words beside things; ENGINE: rounded rects and pills in sketch |
| F9 | `qa/frames/8.96.png`, 203.97 | two reds side by side with different meanings (orange accent, raspberry neg) | accent and neg are both red-family | RULE: never accent next to neg; compare.two neg side pairs with a pos side (section 10) |
| F10 | `qa/frames/8.96.png` | four marker hues in one frame (blue store, orange hatch, raspberry, green chart) | colour picked per element, not per meaning | RULE: ink plus at most two marker colours (section 2) |
| F11 | `qa/frames/262.94.png`, 82.59, `qa/snapshot.jpg` "Blameless does not mean ..." | a slide on a board: 1350 px rows around 400 px of text, an empty half card, a heading alone | templates lay out to the safe box, not to the words | RULE: size cards to words, 3 to 7 units a board, bespoke boards for reasoning |
| F12 | `qa/snapshot.jpg` (b05 thought bubble, looked at in round 2) | a ghost icon at very low opacity | a faded "not yet" state | RULE: an unknown is an empty drawn box or a "?" written, never a ghost |
| F13 | `qa/frames/8.96.png` (desk and laptop); round 1 `lab_props_people` 08.60, `lab_characters`, `lab_objects` 05.80 | solid flat-colour sets, rigs and objects with grey shadows | places, rigs and some objects do not honour sketch | RULE: peeps, icons and rough shapes only; ENGINE: places, objects and data fills through kit.sketch |
| F14 | `docs/styles/demos/lab/lab_iso__whiteboard.jpg` | thin crisp iso grid, tiny labels | iso lines are crisp | RULE: no iso in this style |
| F15 | round 1 `lab_data` frame 04.60 | a solid filled tag, crisp axis, label over the line | data helpers are flat by design | RULE: write the number; bars only |
| F16 | first render of the handover example (round 1) | words trailing their spoken cue by about 1 s | connector, box and words all scheduled after the cue | RULE: the container leads by up to 0.4 s (section 7) |
| F17 | `qa/snapshot.jpg` row 2, "Rule, then timeline" beat (round 2) | crisp dashed rounded boxes and a crisp spine with a crisp head among rough cards | dashed crisp lines and `kit.arrow` in a bespoke beat | RULE: no dashes, no crisp companions except highlight rings (section 4) |

---

## 13. Polish checklist (yes/no, on the contact sheet and one strip per board)

1. Is every line one marker weight (3.6 px), with only the emphasis mark heavier (5 to 6 px), icons included?
2. Are there no crisp arrows, no filled arrowheads, no dashed lines, no pills and no rounded crisp shapes on the board?
3. Does each frame use ink, muted and at most two marker colours, with the accent on exactly one thing?
4. Is every coloured word on a plain board tone (never on hachure or a solid colour fill)?
5. Does all Patrick Hand text (board, chrome, captions) look single-weight, with no smeared bold?
6. Are headings, key terms and numbers in Caveat at 72 px or more, and is nothing in Caveat smaller?
7. In the strip, is each drawing on screen within 0.4 s of the words that name it, in the order spoken?
8. Is every stroke drawn on and every word written left to right, with only peeps and fills faded in (no pop, drop,
   stamp, settle, slide or bounce in bespoke beats)?
9. Does the board accumulate (nothing erased mid-board; corrections struck through or crossed)?
10. Does each board hold 3 to 7 units, with roughly a third of the safe box still empty at its end?
11. Is everything inside x 96 to 1824 and above y 930, with nothing under the caption pill?
12. Is there at most one person per board (two only for a dialogue), from the peep kit, 300 to 360 px, standing on a
    drawn desk line or in a drawn frame, facing into the board?
13. Are there no code-drawn people, rigs, place sets, iso grids or grey contact shadows?
14. Are there two or fewer hachured areas per frame, each with its outline visible before its hatch?
15. Are there no ghost (faint) placeholders, no spotlight dimming and no boil or stepped motion?
16. Is the last new reveal before 85 % of the speech, with the board at rest while the sentence ends?
17. Do connectors start and end 10 to 20 px from the edges they join, never crossing words?
18. Between boards, is the join a camera pan, a wipe or a fade (never a dip, iris, zoom punch or torn paper)?
19. Does the board read as an adult workplace explainer (sentence case, no decorative doodles, no exclamation marks)?

---

## 14. Gaps (not for the guide to fake)

The full list, with sizes and fallbacks, is section 15. In short: no single-stroke lettering, no drawing hand, no
stroke-order control, `m.draw` mishandles hachure and dashes, arrows, pills, places, objects and data ignore sketch,
one-weight faces are faked bold, the lab cannot render narrated example scenes, and there is no whiteboard character
kit (asset request A1).

---

## 15. Engine and asset requests

Each request uses the shared name agreed across the five style guides. "Fallback" is what this guide does until it
lands. Every pack key here is **proposed (not yet read by the runtime)**.

| request (shared name) | size | what it means for whiteboard | fallback until it lands |
|---|---|---|---|
| pack `roles: {kicker, term, verdict, date, quiz_letter, recap_rule, stat_value, chapter_kicker, ui_mark, link, button, me_bubble, person_cloth}` | M | the values in section 2's role table, read by templates and chrome instead of hard-coded tokens | scenes pass the tokens by hand; template notes in section 10 |
| pack `materials: {wood, chair, screen}` | S | `{wood: "field2", chair: "surface2", screen: "surface"}`: pale tones inside rough outlines | no places or furniture objects; a desk is one hand line (recipe 11f) |
| `fx.spotlight: {strength, tint}` | S | `{strength: 0}`: no dimming on a board | never call `ctx.fxMoment` in this style; emphasis is a drawn circle or underline |
| `fx.vignette_under: true\|false` | S | `true`: the 0.08 vignette sits under the drawing so ink keeps its black | live with the 0.08 vignette over everything (mild) |
| `characters.bottom` | S | `"surface"`: trousers as an outline with paper inside | busts only (peeps) |
| M.travel drive key | S | chained travels of one element render only the first start state | at most one `m.travel` per element per scene; carry things between boards with the camera join and `ctx.held` |
| m.draw stroke-first, keeps per-path opacity and dashes | S | `runtime/motion.js` `M.draw`: strokes before fill sets, tween each path to its own `opacity` attribute instead of 1, keep an existing `stroke-dasharray` | recipe 11c (outline copy drawn, filled copy faded); no dashes |
| font weight clamp to loaded weights (no synthetic bold) | S | `kit.js` `fontStr` and the `overlay.js` chrome, captions and avatar card clamp to the weights the pack loads (or `font-synthesis: none` in `style.js` install) | never pass `weight`; accept bold-looking template headers and chrome; avoid `card.title` |
| loom lab --file with @lab cue map | S | `loom/lab.py`: accept a scene path and a `// @lab {"cues": {...}}` map so `ctx.cue("words")` resolves in the lab | render example scenes with the round 1 scratch harness, or inside a real lesson |
| rough arrows with open heads in sketch shading | S | `kit.arrow` (and `kit.path`) in sketch draw the shaft through `K.sketch(..., "path")` and an open two-stroke head; template accent rules drop `crisp: true` (`core.js:51,96`) | recipe 11d in bespoke scenes; accept crisp arrows in process.flow and timeline |
| rounded rects and pills in sketch | S | `K.sketch` draws a rect with `r > 0` as a rough path with arcs, so pills, the quiz pause box and rounded cards keep their shape | no pills; labels are words beside things |
| places, objects and data fills through kit.sketch, no contact shadows | M | `runtime/places.js`, `objects.js`, `data.js` route fills through `kit.sketch` in sketch shading and drop contact shadows when `shape.shadow` is none; document.page's band too | icons and rough shapes only; no `document.page`; charts as bars only |
| single-stroke write-on lettering | M | Hershey-style single-line glyphs (or a stroked centre line of Caveat) rendered as paths, so `m.draw` writes words stroke by stroke | `m.unmask` left to right at the section 7 writing pace |
| stroke order | S | an `m.draw` option `order` ("outline-first" or "dom") and a per-path delay list, so a figure draws contour, then details | one element per stroke group, scheduled in the section 7 order |
| drawing hand | M (art + engine) | one designed hand asset family (marker grip, two angles) placed at the dash head of the active `m.draw` path; `Loom.hands` has only a PLACEHOLDER set today (`docs/SCENE_API.md`, hands) | no hand in shot |
| asset A1: a marker-on-whiteboard character kit | L (art) | the STYLE block below added to `docs/assets/CHARACTER_PROMPTS.md`, then a kit built from it through `skills/lnd/lnd-character-design` | Open Peeps busts (section 8), adult members only |

**Asset request A1 (Claude Design), a STYLE block for `docs/assets/CHARACTER_PROMPTS.md`:**
```
STYLE: marker on a whiteboard, for workplace explainers to adults. A skilled visual facilitator's drawing, not a doodle.
- Proportions: natural, 6.5 to 7 heads for full figures; busts from mid-chest up.
- Line: one black marker line, even weight about 3.5 px at 1080p for contours and 2.5 px for inner details, rounded
  ends, a slight natural wobble; every contour closed; all strokes as SEPARATE paths in class="lm-outline", in the
  order a person would draw them (head contour, features, hair outline, body), so the engine can draw them on.
- Fill: none, or ONE flat pale tone per figure (skin slot only) in class="lm-shade"; hair is an outline with a few
  inner strokes, never a solid black mass; clothes are outlines with seams and folds.
- Colour: black only, plus one marker colour slot (cloth1) used on at most one garment.
- Face: real eyes (lid line and pupil), brows, a nose as one stroke, a mouth as one or two strokes; 6 expressions.
- Deliver: 6 adults of varied ages, builds and presentation, each as a bust (4 expressions) and a full figure in
  stand, point, present, think; plus a hand holding a marker in two angles (for the drawing hand).
- Reject: dot eyes, ball heads wider than shoulders, solid hair masses, mitten hands, any resemblance to a real
  person or a known franchise.
```

---

## 16. Verified on 2026-10-08 (the WS6 proof)

The section 15 runtime requests marked S shipped on 2026-10-08 (D-128; report
`docs/research/2026-10-08-style-system-report.md`; tests `tests/suites/style_system.py`). Sections 1 to 15 were
written before they landed: where a passage says "proposed", "not yet read by the runtime" or "until X lands", X has
landed, the pack below sets it, and that passage's fallback is no longer needed unless this section says so. The
strips, the measurements and the section 13 checklist results are in
`docs/styles/demos/guides/whiteboard/README.md`; the encoded example is `docs/styles/demos/guides/whiteboard/style_whiteboard_handover__h264_crf18.mp4`.

**What the runtime now reads from this pack:**
- `materials`: wood `field2`, chair `surface2`, screen `surface`
- `roles`: verdict `ink`, quiz_letter `ink`, recap_rule `ink`, stat_value `ink`, chapter_kicker `muted`, ui_mark `accent`, button `ink`, me_bubble `surface2`, turn_card `field`
- `fx.spotlight` `{"strength": 0}`, `fx.vignette_under` `true`
- `characters.bottom` `surface`

**Shared changes every style gets:** words are drawn and measured at a weight the family loaded (no synthetic bold);
`m.draw` draws outlines before fills, keeps each path's own opacity and keeps a dashed line's dashes; a second
`m.travel` of one element no longer shows at load; the lab renders any scene file with its `@lab` cues and words
(`py -m loom lab --file <scene> --out <dir>`); the API agents and the Cowork task files read this guide for the
storyboard and scene stages; `py tools/context_check.py` fails when section 2's palette rows disagree with the pack.

**Verified in Chrome:** both examples draw marker strokes with open arrow heads and rough rounded rects, one
accent, single-weight Patrick Hand (37.7 px at its smallest), Caveat at 79.5 px or larger, nothing below y 930.
Fixed in the proof: the turn card's words were ink on an ink card in this outlined pack (the card now resolves its
colour, and `roles.turn_card: field` writes the sentence on a clean board); the meeting cost's question spilled 7 px
(Caveat overhangs its advance width; fitted 30 px inside); both examples gained `@lab` word timings, so their cues
resolve in the lab. On the crf 18 MP4 the paper keeps its texture (41.4 dB).
**Still unverified:** timing against real narration (items 7, 16), the peep's size in px (item 12), joins (item 18);
places, objects and data through `kit.sketch` (M).

## 17. Set decorations follow the pack (2026-10-08, D-133)

`runtime/places.js` now reads `materials.window_lights`, `vessel`, `cells`, `leds`, `cables`, `chart` and
`safety_line` (L-286), and `Loom.obj` reads `materials.objects` for every kind. Each value below comes from section 2
and is set only where the runtime's fallback breaks a rule there; a key left out keeps its fallback because section 2
allows it. Where an earlier section says `places.js` hard-codes one of these, it no longer does. This section
supersedes the `materials` line of section 16. Strips: `docs/styles/demos/guides/whiteboard/lab_set_decor__whiteboard.jpg` (after)
and `lab_set_decor__whiteboard__before.jpg`, from `scenes_examples/lab/lab_set_decor.js`; record
`docs/research/style-system/red_L276_set_decor.txt`.

**What the runtime now reads from this pack (`materials`, in full):**
- wood `field2`, chair `surface2`, screen `surface`, window_lights `muted`, vessel `field2`, cells `["surface",
  "muted"]`, leds `["muted"]`, cables `["line", "muted"]`, chart `["muted", "ink"]`, safety_line `muted`, objects
  `{document: ink, envelope: surface, calendar: ink, clock: surface, folder: surface, package: surface, building:
  surface, heart: surface, bulb: surface, lock: surface}`

**Why (section 2):** a frame holds ink, muted for notes and at most two marker colours, one of them the emphasis or the
pos and neg pair, so set dressing spends no marker: decorations are muted (the grey marker), ink and line; the vessel
is field2 (a large back panel); objects are surface (a white inside an outline, as inside outlined cards); the
document and calendar headers are ink (a surface document draws its header in the accent, and muted is never a
heading). Left at the fallback: phone surface2 (a pale fill); the laptop reads no tone. Section 9 still keeps places
out of this style.
**Seen on the strips:** the objects are line drawings; the sets carry no marker colour. **Still open:** the field2
vessel nearly vanishes (an outlined style needs an outlined tube, which no token expresses, L-288); the laptop chart's
green bars and blue last bar and the clock's raspberry hand, drawn inside the objects (L-287).
