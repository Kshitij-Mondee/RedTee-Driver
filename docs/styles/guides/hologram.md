# hologram: the style guide

STATUS: FIRST VERSION (2026-10-16), built with its engine (`runtime/engines/hologram.js`, sections 17 to 21) at Kshitij's
request: "Make sure all these styles are implemented as polished styles and with perfect code, style, engine, etc
everything", better than lemo-opuscar's hologram-hud "as an engine, as a visual style, in its output quality and
efficiency, and in its direction and storyboarding". Proven on Node preview strips only (s16): the Chrome strip, a
composed lesson and an encoded MP4 are its next tests.

Pack: `packs/styles/hologram.json`. Engine guide for the storyboard and scene agents: `docs/styles/engines/hologram.md`.
Research with sources and dates: `docs/research/2026-10-16-style-hologram.md`. Lab scenes: `holo_briefing`,
`holo_analysis`, `holo_lesson` (`scenes_examples/lab/`). A guide compares versions within its own style only (D-122):
"better" here means a clearer, calmer, more exact HUD, never closer to another style.

## 1. Purpose and register

An operations console projected in light: hairline cyan frames with corner brackets, dark plates under every word,
panels that assemble rule by rule, data that arrives on the word, and depth in three layers. It feels precise, quiet
and trustworthy, the screen a capable analyst would want at 2 a.m., not a film prop. Every frame has one read.

Fits: security operations and cybersecurity incidents, AI systems and model monitoring, data pipelines and analytics,
digital twins and site monitoring, network and cloud operations, observability, future-of-work briefings about systems.
Audience: corporate adults (CLAUDE.md rule 11), technical and non-technical; never a classroom, never a sci-fi trailer.

Never for: soft skills, people stories, wellbeing, history and humanities, children, warm consumer onboarding. A lesson
whose meaning lives in faces belongs in an illustrated style; a HUD can hold a role marker (s8), never a scene about a
person.

Two registers (s17): **briefing** for explaining (most beats) and **analysis** for the moments the system has to be seen
working (at most 1 beat in 3).

## 2. Palette roles

Hex values are copied from `packs/styles/hologram.json` (2026-10-16). Ratios measured with
`loom.checks.style_lint.contrast` (s16).

| token | hex | role | may appear | must never | area share |
|---|---|---|---|---|---|
| field | #06131C | the console's field: a deep blue-teal, not black (no halation) | everywhere behind | as text | 70 to 85 % |
| field2 | #0A1C28 | a recessed zone, the vignette's edge | backgrounds of a zone | as text | 0 to 10 % |
| surface | #0D2433 | a plate: under every word, a panel's face (lighter when near, darker when far) | panels, cards, tags, callouts | as the only edge of a panel (it has brackets) | 10 to 25 % |
| surface2 | #0A1A26 | an inner well, an inactive slot | wells, empty states | as text | 0 to 5 % |
| ink | #E3F6FC | words and values: an off-white with a little cyan, never #FFFFFF | text | as a large fill | 3 to 8 % |
| muted | #8DB4C4 | keys, kickers, units, time stamps, secondary words | labels | as the named thing | 2 to 5 % |
| line | #4FA7BF | hairlines, links, ticks, track lines, grids | strokes 1 to 2 px | as text under 24 px | 2 to 5 % |
| accent | #3EE3F2 | cyan: the HUD's own ink (brackets, rules, rings, sweeps) and the thing the narration names | structure, the named part | a status (it is not "ok") | 3 to 6 % |
| accent2 | #FFB547 | amber: a measure or a warning (`warn`) | a WARN tag, a crossed threshold, an arc of traffic under watch | decoration, a resting frame | under 2 % |
| accent3 | #FF5D6C | red: an alert (`alert`); R/(R+G+B) = 0.56, not a WCAG "saturated red" | an ALERT tag, the part under attack, an anomaly | decoration; ink on it (2.68:1); blinking | under 2 % |
| accent4 | #4FE3A0 | green: healthy, done (`ok`) | an OK tag, a contained incident, a passed check | decoration | under 2 % |
| pos | #4FE3A0 | outcome good (same as accent4) | ticks, "passed" | anything that is not an outcome | under 2 % |
| neg | #FF5D6C | outcome bad (same as accent3) | crosses, "failed" | anything that is not an outcome | under 2 % |
| shadow | #020A10 | the turn card's ground, a person's outline | `roles.turn_card` | as text | 0 % |
| onAccent | #04141C | words on a filled status pill (rare: tags are outlined) | text on accent fills | as a fill | under 1 % |
| caption_active | #3EE3F2 | the spoken word in the caption | captions only | anywhere else | 0 % |

Text pairs measured (allowed): ink on field 16.87:1, ink on surface 14.31:1, ink on field2 15.59:1, muted on field
8.46:1, muted on surface 7.18:1, accent on field 12.06:1, accent on surface 10.23:1, accent2 on field 10.69:1, accent3 on
field 6.29:1, accent3 on surface 5.34:1, accent4 on field 11.48:1, line on field 6.81:1, onAccent on accent 12.01:1,
on accent2 10.65:1, on accent3 6.27:1, on accent4 11.43:1. Captions: ink 17.81:1 and the active cyan 12.73:1 on the pill
(#020B11). The section label (muted) in the vignetted top-left corner: 5.48:1. Forbidden: ink on accent3 (2.68:1), any
text straight on a grid or a wireframe (put it on a plate).

**Colour only for status** (high-performance HMI): a frame at rest is cyan, ink and muted. Amber, red and green appear
only when something is a warning, an alert or healthy, and always with the word (`WARN`, `ALERT`, `OK`).

## 3. Type

| role | family | sizes (px, pack) | weight | use |
|---|---|---|---|---|
| display, hero | Space Grotesk | 96 to 136, 84 to 120 | 700 | a card's value; a chapter number |
| title | Space Grotesk | 52 to 72 | 700 | a briefing title; a value in a shorter card |
| lead | Inter | 32 to 40 | 600 | the analysis header; flow step labels; units |
| body | Inter | 30 to 36 | 400, 600 | a sentence (rare: a HUD speaks in labels) |
| label | JetBrains Mono (`fonts.roles.label`) | 24 to 30 | 400, 700 | keys, values in panels, log rows, panel titles (caps, tracked 0.08 em) |
| caption | JetBrains Mono (`fonts.roles.caption`) | 22 to 26 | 400, 700 | kickers (caps, 0.1 em), tags, time stamps, node and point labels |

- Mono for anything a machine prints (times, hosts, values in a panel, tags); Space Grotesk for the numbers a person
  reads from across the room; Inter for the human words in a flow.
- Panel titles, kickers and tags are upper case and tracked; host names, labels and log text keep their own case.
- Numbers carry their unit with a space in prose (`210 ms`), the unit smaller and muted beside a card's value.
- Never: text under 22 px, thin weights (light text blooms on a dark field), italics, a fourth face, text inside a glow.

## 4. Shape language

- **Corner brackets** are the signature: four L-shapes at a frame's corners (arms 12 % of the short side, 14 to 34 px) in cyan, over a faint full hairline (35 % line). The brackets carry the status colour when the frame has one.
- **Plates**: flat rectangles, radius 0 (`shape.radius`), no border, opacity by depth (0.55 far, 0.8 mid, 0.92 near).
- **Lines**: 2 px base (`shape.stroke`), scaled by depth (0.8 far, 1.0 mid, 1.2 near); hairlines 1 px; square caps.
- **Nodes** are hexagons with a core dot; **points** on a globe are a ring and a dot; **events** on a timeline are
  diamonds; **tags** are outlined pills (3 px radius) with the status word in its colour.
- **Rings and arcs**: scanner rings at 1, 0.66 and 0.33 of the radius; a gauge is a 270 degree arc (or a full ring) with
  ten ticks outside it.
- Never: drop shadows, gradients on panels, rounded blobs, chamfered sci-fi corners, fake screws, decorative glyph
  strips, lens flares.

## 5. Light, shading, depth and texture

- **Depth is elevation** (Material dark theme): three layers, far (z 0.35), mid (0.7), near (1.15). Near pieces have a
  lighter plate, brighter lines and thicker strokes; far pieces are darker and dimmer. Depth also drives parallax on the
  place camera (s18). No shadows anywhere.
- **Glow is an enhancement**: key strokes (brackets, rings, lock brackets, arcs, the signal) carry a soft halo stroke at
  22 % under them, blurred (2.4 px) only where filters render. Everything reads without it (the Node preview and an
  H.264 encode both lose soft light). Words never glow.
- **The field**: the pack's still dot pattern (`ambient.kind: "dots"`, one tiled pattern) and a faint cyan lift in the
  middle (`ambient.wash`); vignette 0.3; grain 0. A beat may add the engine's own grid layer (`H.grid`, hex or dot, far).
  Nothing in the field moves.

## 6. Composition

- The safe area is 96 px at the sides, 84 px at the top, captions below 930. Lay pieces on a 40 px grid; gutters 40 to
  56 px between panels.
- **Briefing**: a title top left, then a row of 2 or 3 cards, then one diagram; generous space (30 to 45 % of the safe
  area empty).
- **Analysis**: header small (role lead), a summary or log on the left, the live view (mesh or globe) centre, an
  instrument (scanner, gauges) right, an evidence row along the bottom (timeline, wave, gauge). General to specific.
- **Briefing sits centred** in the band between the top safe line (84) and the caption band (930), not crowded at the
  top with the lower third empty: lay the block with `H.vcenter(h)`; `holo_top_heavy` warns otherwise.
- One read per frame: the read is the largest or the only coloured thing.
- Labels never sit over a line or another label: a node label sits on its own plate; a lock's tag goes where there is
  room (`labelPos`, `labelAlign`).

## 6b. The hero moment (the wow, 2026-10-16)

Kshitij, after the stress test: "The cool factor and the wow factor ... feels like it's gone." The first impression of
a hologram is one glowing object in light, not panels on a grid (`docs/research/2026-10-16-wow-hologram-blueprint.md`).
Loom's own version, for one or two beats a lesson in the analysis register:
- **One hero object**, centred, on a **projector pad** (`H.object` on `H.pad`): a dense wireframe in true perspective,
  fogged with depth, built by a rising scan plane, turning on its turntable only while the narration introduces it.
- **A dark stage** (`H.stage`): the field near-black, a lift behind the hero, a strong vignette; **HUD chrome** at the
  frame's edges (`H.chrome`) with few, small words.
- **Values in amber** on small plates (`H.datum`), each led to the part it measures; one lock at a time names the part,
  which turns hot (near-white).
- **An exploded view** for "what is inside": parts move along their axes; one is lit and measured.
- The words stay few, small (22 px caption floor, tracked wide) and on plates; no word inside a glow. Every number
  comes from the knowledge sheet; the chrome's readouts are true (the object's own azimuth), never decoration.
- The briefing beats stay as they are: calm, centred, one read. The hero is the exception that makes the console
  memorable, not the default.

## 6c. Hologram v2: a projection, not a dashboard (2026-10-16)

Kshitij, after the wow pass: "everything feels very basic and AI like. Not something a real hologram would look
like." and "Shouldn't look like AI made UI." The research and the list of tells are in
`docs/research/2026-10-16-hologram-v2.md`; in short:
- **Light is the medium.** Additive colour, no dark fills inside a projected object, brightness says importance, bloom
  only from what is bright, never on words.
- **Two routes, chosen by complexity** (Kshitij's decision): an object that reads better in true 3D (a bicycle, a
  globe, a rack, a device) is a WebGL hero (`H.hero3d`, the `holo_hero` preset); a diagram, a reading or a panel is
  SVG, pushed (`H.plane`, `H.reading`, `H.tokens`, `H.arcs`, `H.dist`).
- **Edges and rims, not grids on boxes.** A hero shows its silhouette and real edges, faint faces, its own detail.
- **A little imperfection, deterministic:** scan bands, a fine interlace, a faint flicker from a seeded hash, a slight
  red and blue fringe on bright edges.
- **Depth by light and focus:** far sheets dimmer and out of focus, near ones crisp.
- **Typography with hierarchy:** one large reading; small sentence-case labels; dim micro detail; mono only for what
  a machine prints. No mono caps everywhere, no brackets on every box: a lock brackets one thing at one moment.
- **Purposeful asymmetry:** one subject leads, readings orbit it at different depths; no equal-weight grid.
- **Data that looks measured:** precision, a unit, a time or a source; in a lesson every number still comes from the
  knowledge sheet.
- Readability gates stay: words on plates or clear field, at the caption floor or above, never inside a glow, a blur
  or a fringe (tested).

Wiring (D-188, Three.js reopened for hologram heroes only): the lab page and compose render a scene's `hero3d`
through the clip store and embed it as `Loom.assets.hero3d`; in a lesson the storyboard beat carries the spec and
HyperFrames seeks the hero as a static footage video (verified in an MP4, 2026-10-16). Captured web pages
(`projects/<id>/assets/pages/*.page.js`) load after the engine in any lesson that has that folder.

## 7. Motion

Personality `calm` (pack: enter 0.45 s, move 0.5 s, exit 0.3 s, draw 0.7 s, stagger 0.07 s, no overshoot).
- **Assembly**: a panel's brackets draw out from each corner (0.28 s), its hairline and plate arrive, the top rule draws,
  the title types on (a block cursor runs across it), then each row arrives with its tick.
- **On the word**: a value changes, a status turns on, a log row arrives, a lock closes, each at its cue (about 0.3 s
  before the word).
- **Loops are windows**: a sweep, a globe's spin, repeating traffic and a running signal run only inside the window the
  narration needs; at most two at once (`holo_loops` warns at three).
- **Boot and power-down**: a panel opens from a bright line; at a section's end it closes to a line and a point.
- **Flashes**: only a lock's confirmation, 0.14 s, budgeted to three in any second for the film.
- Never: flicker, glitch, scan lines rolling, idle spinning, random blinking, bounces, shakes.

## 8. People and living characters

A HUD is about the system. People appear rarely, small, as role markers on a panel (an analyst, an on-call engineer),
from a designed kit (CLAUDE.md rule 11: Claude Design first, `skills/lnd/lnd-character-design`); never drawn in scene or
engine code. No kit exists for this style yet (s14, s15). The pack's characters fall back to outlines in `line` with
`surface` clothes and `silhouette` extras.

Until a kit exists, the engine names the problem instead of hiding it: `ctx.character` with a full-colour rig (ava,
sam, the beans, an imported rig) in a HUD scene warns `holo_character_kit` (the 2026-10-16 stress test showed a
cartoon presenter breaking the look). A rig designed for this style declares `styles: ["hologram"]` in its definition
and passes. Never work around the warning by drawing a person in scene or engine code; leave the person out, or
show the role as a word (a panel row, a tag), until the kit is commissioned.

## 9. Objects, icons, data and UI

- Icons: Lucide at stroke 1.75 (`icons.stroke`), cyan or ink, inside a plate or a node, never floating at hero size.
- Data is the medium: a value is a card, a measure is a gauge with thresholds, a change over time is a wave or a
  timeline, a relationship is a mesh, geography is the globe. Normalise (percentages, per-second rates) so a viewer
  never needs the denominator (Grafana).
- Logs are readouts with time, text and a status tag; never a scrolling wall of fake text.
- A real UI (a mail, a login page) is shown with `Loom.ui` artefacts inside a frame's plate, never re-drawn as HUD.

## 10. Templates in this style

Bespoke scenes on the engine are the norm. Templates work with the pack's tokens:
- `title.card`, `definition`: fine; the term takes cyan.
- `process.flow`, `list.steps`, `timeline`: fine, but `H.flow` and `H.scrubber` are the native forms; prefer them.
- `compare.two`: two `H.panel`s side by side are the native form.
- `quiz.question`: the letters are cyan discs with onAccent letters.
- `avatar`: avoid (s8).
Unverified for this style: no template strip has been looked at yet (s14).

## 11. Recipes (code)

Real calls only (`docs/styles/engines/hologram.md`).

**R1. A briefing row of cards and the one change**
```js
const H = ctx.engine.hud(ctx);
H.title("head", { x: 120, y: 92, w: 1300, h: 170, kicker: "Model operations", text: "What we watch once a model is live", at: 0.3 });
const drift = H.card("drift", { x: 680, y: 310, w: 520, h: 270, kicker: "Input drift", value: 0.08, decimals: 2, label: "distance from training data", at: ctx.cue("drift") - 0.3 });
drift.status("warn", ctx.cue("crosses"));
```

**R2. A scan finds it, a lock names it, the camera leans in through the summary**
```js
const M = H.mesh("net", { x: 740, y: 214, w: 660, h: 452, nodes, links, at: ctx.cue("the network") - 0.3 });
H.scanner("scan", { cx: 1668, cy: 380, r: 150, sweeps: [[ctx.cue("we scan"), ctx.cue("one host")]], blips });
const L = H.lock(M.node("db"), { at: ctx.cue("one host"), label: "anomalous host", labelPos: "below", status: "alert" });
H.through({ to: [1070, 440], scale: 1.55, t0: ctx.cue("look closer") - 0.3, t1: ctx.cue("look closer") + 1.4 });
```

**R3. A log that records it on the word** `const LOG = H.readout("log", {..., rows}); LOG.push(["02:14:19", "bulk read,
40k rows", "alert"], ctx.cue("forty thousand"));`

**R4. Between registers** `H.mode("analysis", ctx.cue("let's trace it"), { keep: [title] })`, then
`H.power(G, "up", t)`; back with `H.mode("briefing", t)` and `H.power(G, "down", t)`.

**R5. A globe that stops before the lock** `H.globe("g", {..., spin: 5, spinFrom: t0, spinTo: t1, points, arcs})`;
`H.lock(G.pointAt("hq", t1 + 0.4), { at: t1 + 0.4, label: "credentials posted", status: "alert" })`.

## 12. Failure modes seen in real frames

Seen while building the lab scenes in the Node preview (2026-10-16):
| seen | why | rule |
|---|---|---|
| dots at the corners of cards before they drew | a zero-length dash still paints its square cap | the engine hides a stroke until it starts (built in) |
| the flow's packet ran over a step's words | it travelled through the box centres | the packet shows only in the gaps; the step tints instead (built in) |
| a lean-in cut the log in half at the frame edge | a zoom about a point crops what is beside it | lean in with `H.through` (the near layer dissolves); the HUD declares the crop with `data-bleed` |
| a lock's tag lay over the scanner and another label | the tag was always above, aligned left | choose `labelPos` and `labelAlign`; leave 40 px round a lock |
| the time stamp ran into the log text | the time column was sized for a guess | the column is measured from `00:00:00` (built in) |
| the alert colour stayed on the wave after the anomaly | the overlay was faded in once and never out | the colour follows the spike (built in) |
| mono labels running past their box in the preview | the preview estimates widths at 0.55 em; JetBrains Mono is 0.6 em | judge widths in Chrome; keep labels 10 % short of the box (s14) |

Seen in the stress test (`docs/research/2026-10-16-style-stress/`, FINDINGS.md) and fixed in the engine the same day:
| seen | why | rule |
|---|---|---|
| next-word odds as empty outlines, the small ones slivers | there was no bar piece; frames stood in for bars | `H.bars`: filled bars, the value outside the bar, a 12 px minimum length (built in) |
| a row set to "warn" changed colour only | `panel.set` lit the row but showed no word | `set` and `mark` show the word in a tag; `tagRoom` reserves the slot |
| the highlighted attention link barely stood out among fifty | `linkStatus` changed the hue only | an emphasised link has weight and glow; `{dim}` fades the rest |
| arcs and traffic over "Frankfurt" and "Mumbai"; six labels crowding the rim | arcs drew after the labels; every label went right | arcs under labels; labels inward and stacked apart; `holo_globe_dense` past three |
| the column flow's arrows pointed down while the data flowed up | `H.flow` had one direction per axis | `dir: "up"` (or left): the arrows follow the data |
| "0.41s", "1.8k/s" run together on a small gauge | the unit was appended with no gap | the unit goes under the value on a small gauge, a space on a large one |
| the scanner's blip `label` did nothing | documented, never drawn | drawn: a word on a plate, lit with the blip |
| a cartoon presenter on the console | no hologram character kit | `holo_character_kit` names it (s8) |
| a push-through cut the title mid-word (holo_lesson 15.6 s) | the near layer faded only late in the push | the near layer is gone within the first tenth of the scale |
| briefing frames crowded at the top, the lower third empty | pieces placed from the top down | `H.vcenter` and `holo_top_heavy` (s6) |
| globe points looked arbitrary | the globe had no land | a faint coastline outline from the geography (needs it in the build, s15) |

## 13. Polish checklist (yes or no, on the contact sheet)

1. Does every frame have one read, the largest or only coloured thing in it?
2. Is every word on a plate, at 22 px or more, in its box?
3. Are amber, red and green only on status, each with its word?
4. Is a resting frame free of amber, red and green?
5. Do near panels read brighter than far ones, and is the far layer free of words?
6. Is nothing moving that the narration does not name (no idle loops)? At most two loops at once?
7. Does each status change, lock and log row land on its word?
8. Is there at most one lock and one camera move at a time, and is every push followed by a pull?
9. Is a briefing beat at most 4 pieces, an analysis beat at most 7?
10. Do labels clear each other, lines and the frame edge (outside a declared camera crop)?
11. Is the field still, and the frame calm enough to read for a whole sentence?
12. Is nothing in the caption band (below y 930)?

## 14. Gaps

| gap | size |
|---|---|
| A still `holo` fx shader (dot grid + soft lift that follows the camera); today the field is the ambient dots (s15) | S |
| The Chrome strip and a composed lesson in this style; an MP4 judged after H.264 (the halo, the hairlines) | M |
| The Node preview under-measures JetBrains Mono (0.55 em estimate against 0.6 em); strips show mono labels longer than Chrome will | S |
| A designed character kit for role markers (s8) | L |
| Template strips in this style (s10) | S |
| No kept library (`assets/kept/hologram`) yet | S |

## 15. Engine and asset requests

- **fx background `holo`** (runtime/fx.js, the lead's file): a still dot grid every 40 world px toward `line` at 6 %, a
  radial lift toward `accent` at 4 % centred at (50 %, 42 %), following the camera like `drafting`; no motion. Then the
  pack sets `fx.background: "holo"` and `ambient.kind: "none"` (one shader layer instead of DOM).
- **Preview font widths** (tools/node/svg_preview.mjs): measure monospace families at 0.6 em.
- **Preview font name** (tools/lab_preview.py install_fonts): the converted Space Grotesk TTF names itself "Space
  Grotesk Light", so cairosvg falls back to DejaVu for every Space Grotesk word; a fontconfig alias fixes it locally.
- **Character kit**: role-marker people in outline for this style (Claude Design first). Its rigs declare
  `styles: ["hologram"]` so `holo_character_kit` lets them pass.
- **Geography for the globe's land** (loom/engines.py `engine_assets`, or the lab and compose geo test): today the
  Natural Earth data is embedded only when a scene's source names `Loom.geo`, so a globe in a scene that does not
  (holo_lesson) has no land. Embedding `assets/geo/world110m.json` for the hologram style when a scene calls
  `H.globe(` would give every globe its coastlines.

## 16. Verified on 2026-10-16

- `lint_style` on the pack: `[]`. Contrast pairs in s2 measured with `loom.checks.style_lint.contrast`.
- `loom.engines.lint(runtime/engines/hologram.js)`: `[]`.
- `py tests/run_tests.py --only hologram`: 5 passed, 1 skipped (the Chrome strip test, no browser here); each test has a
  control that fails (s16 of the engine's report).
- Node preview strips of the three lab scenes looked at frame by frame (`docs/styles/demos/lab/holo_*__hologram__PREVIEW.jpg`).
- Not verified: Chrome rendering, glow blur, the ambient dots and the vignette (the preview draws neither), a composed
  lesson, an MP4, the film and speech checks on a lesson in this style.

Verified after the stress-test fixes (2026-10-16): `py tests/run_tests.py --only hologram`: 16 passed (10 new tests,
each with a control that fails); the stress scene re-rendered in Chrome (`out_hologram_after/frames/`, looked at full
size) and the three lab scenes re-rendered with no problem. Not verified: an MP4, a composed lesson.

## 17. The engine and the two registers (2026-10-16)

**The engine** (`runtime/engines/hologram.js`, how to call it: `docs/styles/engines/hologram.md`) builds the HUD from
code: frames with corner brackets; panels that assemble line by line; cards with one value; a flow; readouts that
scroll; a radial scanner; target locks that close on any element; a wireframe globe with arcs and traffic; a network
mesh with packets; a waveform with an anomaly; hex and dot grids; a timeline scrubber; gauges with thresholds (RED and
USE presets); callouts; boot-up and power-down; the register switch; the camera (push, pan, pull, push through, 2.5D
orbit). Every piece is an element in a depth layer; every continuous motion runs on one clock; flashes are budgeted.
It makes hand-off item T-135 `kit_holo_hud` unnecessary: every piece that item listed exists, with states.

| register | for | what is on screen | density |
|---|---|---|---|
| briefing (most beats) | explaining | a title, 2 or 3 cards or a panel, one diagram | at most 4 pieces; 1 status change |
| analysis (at most 1 beat in 3) | the system seen working | a scan, a lock, live readouts, a globe or mesh with traffic, panels in depth, evidence | at most 7 pieces; 1 lock; 2 loops |

**Ours, beyond opuscar** (whose HUD is a 1-minute product film around one wireframe object):
- the two registers as modes of one HUD (`H.mode`), so a 5 to 10 minute lesson is calm most of the time;
- corporate status semantics told twice (colour and word), a flash ledger for WCAG 2.3.1, no idle motion;
- depth as elevation, with push-through and a 2.5D orbit on the place camera (no real 3D, no motion blur);
- pieces that return state functions, so a held HUD keeps changing across beats;
- systems, not objects: a mesh, a globe, a pipeline, a log, gauges; every word from the lesson.

**Lab scenes:** `holo_briefing`, `holo_analysis`, `holo_lesson`. Looked at in the Node preview on 2026-10-16; Chrome
not yet (s16).

## 18. Camera grammar

| move | what it says | serves |
|---|---|---|
| the whole console, held | the system as one picture; the record | briefing; recap; verdict |
| slow push 1.15 to 1.3x (`H.push`) | "this part matters" | the briefing's one change |
| push through the near layer 1.4 to 1.7x (`H.through`) | leaving the summary for the inside | entering analysis onto a mesh or globe |
| pan across the console (`H.pan`) | following a request, a pipeline, a timeline | cause and effect |
| 2.5D orbit 5 to 10 degrees (`H.orbit`) | the layers have depth; a second look | the end of an analysis; reading the record |
| pull back (`H.pull`) | back to the whole | after every lean-in |

One move at a time, 1.2 s or more, eased in and out; a push is always answered by a pull; no whips, shakes or drift.
Transitions: a camera move inside a topic; a cut between topics; power-down and boot-up at a section change.

## 19. Sound palette

Low and passive (the brief): no sound on every element.
- **Music:** `calm_focus`; a soft pulse with sustained pads suits it; no synth arpeggios, no drops.
- **Foley, at most a few a beat:** one soft tick on a lock (`{sound: true}`), nothing on reveals, nothing on loops.
- **Silence:** a beat of quiet before an alert lands and before the verdict.

## 20. Native moves (with what they fit in corporate lessons)

| move | the call | fits content like |
|---|---|---|
| a panel assembling | `H.panel` | a checklist, a policy's conditions, a runbook's steps, the containment record |
| one value, one read | `H.card` | an SLA, a detection count, a model's accuracy, a cost |
| the scan finds it | `H.scanner` | discovery: an unknown host, a shadow-IT app, an exposed bucket |
| the lock names it | `H.lock` | "this one": the compromised account, the drifting feature, the failing pump |
| traffic on a mesh | `H.mesh(...).send` | a request path, lateral movement, data flowing through a pipeline |
| arcs on a globe | `H.globe` | where attacks come from, regions in a cloud, a supply chain |
| a log on the word | `H.readout(...).push` | an incident timeline, audit evidence, alerts arriving |
| a threshold crossed | `H.gauge(...).set` | error budgets, capacity, latency, utilisation |
| an anomaly on a signal | `H.wave` | a spike in traffic, sensor drift, unusual logins per minute |
| the register switch | `H.mode` | "let's look closer" / "so what does this mean" |
| power-down | `H.power(..., "down")` | closing an incident, retiring a system, a section's end |

## 21. Variation space for lessons

- **Structures:**
  - one console that grows (briefing, analysis, the record);
  - a shift report: three briefing beats and one analysis per incident;
  - before and after: the same mesh in two states (`set`), the gauges back under their limits;
  - a drill-down: global (globe) to network (mesh) to host (panel) with `H.through` at each step.
- **Openings:**
  - a single panel booting up from a line;
  - the alert first (one red tag on an empty console), then what it means;
  - the question as a title, with the console still dark.
- **Endings:**
  - pull back to the whole console with every status green;
  - the analysis panels powering down until only the verdict card is left;
  - a log row added for the action the lesson asks for.
