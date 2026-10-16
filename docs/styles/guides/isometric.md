# isometric: the style guide

STATUS: FIRST VERSION (2026-10-16), built with its engine (`runtime/engines/isometric.js`, sections 17 to 21). Kshitij
named isometric infographic the most important of the three styles taken from lemo-opuscar (2026-10-16) and asked for
it "better as an engine, as a visual style, in its output quality and efficiency, and above all in its direction and
storyboarding". Opuscar is the inspiration, never the goal: nothing of its code, palette or demo story is copied.
Proven on lab previews in Node (s16), not yet in a Chrome strip, a lesson or an encoded MP4: the first lesson in this
style is its real test, and its frames update s12.

Pack: `packs/styles/isometric.json`. Engine guide (the calls, the two registers, density limits, storyboard planning):
`docs/styles/engines/isometric.md`. Research: `docs/research/2026-10-16-style-isometric.md`. Lab scenes:
`scenes_examples/lab/iso_teach.js`, `iso_diorama.js`, `iso_lesson.js`. A guide compares versions within its own style
only (D-122): "better" here means closer to a clean, legible isometric infographic, never closer to another style.

## 1. Purpose and register

A working system drawn as a clean isometric infographic: flat three-tone solids at true 30 degree isometric on one
floating diorama board, a pale cool ground, thin slate ink only for the infographic furniture. It feels like an annual
report's best spread or a product page that explains an operation: precise, orderly, calm, and complete at a glance.
The board is a model of the place the lesson is about; the camera moves over it like a guide.

Fits: supply chains and logistics, operations, data centres and infrastructure, cloud architecture, facilities and
buildings, a site or a city, a process with places and hand-offs, "how a system works". Audience: corporate adults
(CLAUDE.md rule 11), operations and technical staff, managers who need the whole picture.

Never for: soft skills, feelings and wellbeing, people stories (faces carry those), abstract ideas with no place or
system, children. People appear as Isotype pictograms (no faces); a person the story follows needs a designed kit (s8).

References (studied, never copied): IBM Design Language isometric style (grid, one light, one shadow type; motion along
one axis, camera locked to the angle); Isotype (Neurath, Arntz, Marie Neurath as transformer); categorical colour
guidance (seven categories at most); Imhof's label placement; cutaway illustration (Li et al. 2007); van Wijk and Nuij's
pan-and-zoom. Sources and dates: the research file.

## 2. Palette roles

Hex values copied from `packs/styles/isometric.json` on 2026-10-16. Ratios measured with
`loom.checks.style_lint.contrast` (s16).

| token | hex | role | may appear | must never | area share |
|---|---|---|---|---|---|
| field | #F2F4F7 | the pale cool ground the board floats on | everywhere behind | as a solid's colour | 30 to 50 % |
| field2 | #E5E9EF | a quieter ground band, a second board's ground | backgrounds of a zone | as text | 0 to 10 % |
| surface | #FFFFFF | pin plates, note and legend cards, plate tops, white vans and trailers | furniture, light solids | as text | 5 to 15 % |
| surface2 | #D9DFE7 | the board's top crust, slabs, floor plates, roofs | the board, neutral solids | as text | 20 to 35 % |
| ink | #111823 | all words; the darkest parts (screens' frames) | text, small dark parts | as a large fill | 2 to 5 % |
| muted | #525D6C | secondary words (a pin's sub line, a card's body) | text | as the subject | 1 to 3 % |
| line | #2A3442 | the infographic ink: leaders, routes, cut lines, hatching, racks' frames | strokes 1.2 to 5 px, dark parts | as text under 24 px; on solids as an outline | 1 to 4 % |
| accent | #E85A2F | the SUBJECT hue, reserved: the one thing the learner follows | the subject, its route, its ring and pin bar | any other object (the engine warns, `iso_subject_hue`) | under 4 % |
| accent2 | #2C6BDE | legend hue 1 (blue): digital, data, network, offices | one role per board | a second meaning on the same board | under 15 % |
| accent3 | #12998C | legend hue 2 (teal): delivery, containers, shops | one role per board | a second meaning | under 15 % |
| accent4 | #E9A23B | legend hue 3 (amber): goods, parcels, power, machines | one role per board | text on the field (1.97:1) | under 15 % |
| pos | #22A066 | outcome good (a light on, a healthy state) | outcomes only | a material (trees use leaf) | under 2 % |
| neg | #D43C4C | outcome bad (a fault, a stop) | outcomes only | the subject | under 2 % |
| shadow | #262A40 | the cool dark every right face and cast shadow mixes toward | inside tones; cast shadows at 12 % | as a colour of its own | 0 % direct |
| onAccent | #FFFFFF | words on an accent fill | text on accent2 (4.92:1), neg (4.62:1) | as a fill | under 1 % |
| caption_active | #B93F14 | the spoken word in the caption (the subject hue, dark) | captions only | anywhere else | 0 % |
| concrete | #C8CFD9 | material: walls, halls, docks | buildings | a legend meaning | as needed |
| steel | #7D8899 | material: machines, frames, legs, monitors | machines | a legend meaning | as needed |
| road | #5B6270 | material: roads, belts | roads | a legend meaning | as needed |
| glass | #9FC6E6 | material: windows, screens | windows, screens | a legend meaning | as needed |
| leaf | #5FA95C | material: trees, plants | trees | an outcome | as needed |
| water | #4D9FD6 | material: water, cooling | tanks, water | a legend meaning | as needed |
| soil | #A9825E | material: earth strata, cardboard, trunks | strata, parcels | a legend meaning | as needed |
| wood | #C9A06C | material: pallets, desks, tape | pallets, desks | a legend meaning | as needed |

Text pairs measured (allowed): ink on field 16.17:1, ink on surface 17.82:1, ink on surface2 13.28:1, muted on field
6.07:1, muted on surface 6.69:1, accent2 on field 4.47:1 (30 px and up), line on field 11.42:1, ink on accent 5.03:1,
ink on accent3 5.06:1, ink on accent4 8.23:1, ink on pos 5.33:1, onAccent on accent2 4.92:1, onAccent on neg 4.62:1,
caption_active on the caption pill 5.51:1, caption words on the pill 17.68:1. Allowed only at 30 px or larger: accent
on field 3.21:1, accent3 on field 3.20:1. Forbidden: accent4 or any material as text on the field.

Colour is a legend (s9): one hue, one meaning, for the whole lesson. The subject keeps `accent`; under focus and
context everything else turns to a grey of its own lightness, lifted toward the field.

## 3. Type

| role | family | sizes (px, pack) | weight | use |
|---|---|---|---|---|
| display, hero | Space Grotesk | 100 to 144, 88 to 128 | 700 | a lesson title, a chapter number; rare |
| title | Space Grotesk | 56 to 80 | 700 | a frame's title, an Isotype number, words on the board (`floorText`) |
| lead | Inter | 32 to 40 | 600 | a note card's title |
| body | Inter | 30 to 36 | 400 | a note card's one line |
| label | Inter | 26 to 30 | 600 | pin plates, legend rows |
| caption | Inter | 22 to 24 | 400 | a pin's sub line, a card's index |

- Pins say 1 to 3 words in sentence case ("Distribution centre", "Your parcel"); numbers carry their unit as a sub line.
- Pins never scale with the camera: their words stay at the label size at any zoom (the engine keeps them in screen
  space), so a scale reveal never pushes words under the floor.
- Isotype numbers in Space Grotesk 700, tabular figures, the unit in the label role beside them.
- Never: italics, all-caps sentences, a third face, words laid on a solid's face, a size below the floor.

## 4. Shape language

- **True isometric** (30 degree axes), one projection for the whole lesson, never rotated or tilted.
- **Solids** are boxes, cylinders, wedges and gables on whole or half units, flat colour in three tones, **no
  outlines**; a hairline of the face's own colour hides seams. Windows, screens and stripes are decals on faces.
- **Ink** (`line`, 2 to 5 px) only for furniture: leaders, routes (5 px, round caps), dashed planned routes, cut lines
  (dashed), hatching on cut rims, rings round the subject, a plate's dashed outline (1.6 px at 55 %).
- **Pins**: a dot (surface fill, 2.5 px ink ring) on the feature, a vertical leader, a short shoulder, a white plate
  with a 6 px radius, a hairline and a 6 px colour bar in the target's legend hue.
- **Plates** (stations): a low plinth with a white top, its sides in the station's hue, a dashed outline inset.
- **Cards** beside the board: white, 10 px radius, a hairline, no shadow (the board's shadows are the only ones).
- Never: perspective, outlines on solids, gradients, blur, drop shadows on cards, rounded "toy" blocks.

## 5. Light, shading, depth and texture

- One light from the upper left, fixed: top faces lightest (mixed toward white), left faces the base colour, right
  faces darkest (mixed toward the cool `shadow`). Pale colours keep their top and step their sides down instead.
- One shadow type: a flat parallelogram to the right, `shadow` at 12 %, cast on what the object rests on.
- **Height cue** for anything that floats (0.6 units or more above what is under it: a cloud, a parcel in the air, an
  air route): a soft shadow straight under it and a thin dashed stem (`line`, 1.8 px, with a foot dot) down to the roof
  or ground beneath. An air route also lays a dotted trace on the ground and drops a stem from each corner. Without
  it a floating thing reads as stuck to the face of the building behind it (stress test, 2026-10-16).
- The board floats: a soft stepped shadow under it, strata on its two front faces (bands that can tell a story:
  network, power, soil), a faint dot lattice on its top on whole units.
- Depth is the projection and the painter's order; no fog, no blur. Context (focus+context) is the only "distance".
- Texture: none (D-100). Grain off.

## 6. Composition

- Safe area 96 px sides, 84 px top, the bottom 150 px for captions; frames centre on (960, 507).
- Teaching frames: 1 to 3 stations in one screen row (stations stepping along +x, -y), filling 60 to 75 % of the
  width; one note card in a corner the board leaves free.
- Detail frames: the board fills the safe area; the subject is at least a third of the frame height at key moments.
- Routes run left to right on screen; flows read in narration order.
- Pins sit up-right of their feature by default, never over the subject, never cut by the frame (they fade instead).

## 7. Motion

Personality `smooth` (pack: enter 0.5 s, move 0.45 s, exit 0.3 s, draw 0.7 s, count 1.4 s, no overshoot).

- Solids arrive by motion: buildings and bars **rise** from their base (an exact extrusion); vehicles, crates and
  people **drop** and settle with a 6 % squash. Never a fade on a solid.
- Lines lead: a route draws before its mover; a pin's leader before its plate; a cut line before a skin slides.
- Movement runs along one grid axis at a time; vehicles face their axis and turn at corners.
- Accumulation accelerates (each unit sooner than the last); counts are exact at every frame.
- Camera: log zoom, editorial ease, 1.2 to 2.6 s a move; holds of at least 1.5 s after a reveal.
- Never: bounces, spins, shakes, particles, a camera that rotates the board.

## 8. People and living characters

**Until a designed isometric character kit exists (A-07 in `docs/assets/HANDOFF_TEMPLATE_LIBRARY.md`), people in this
style ARE the engine's pictograms** (`person`): head, body, legs, no face, one hue (their role's, or `line` for staff).
They stand, wait, and step along routes. That is a limit, not a look to imitate: the stress test (2026-10-16) found an
operations room of faceless pictograms reads as a diagram of roles, which is right for "who owns the response" and
wrong for a story about a person. So: use people as roles in a system (a team, a queue, staff at a station); a person
the story follows as a person (a named customer, a manager) waits for the kit (Claude Design first,
`skills/lnd/lnd-character-design`), or the beat cuts to a style that has one. Never draw detailed people (faces,
hands, clothes) in scene code or in the engine.

## 9. Objects, icons, data and UI

- Objects: the engine's library (27 kinds, s17); each has its tell-tale parts (a rack's lit units, a forklift's mast and
  forks, a truck's cab and wheels, a store's awning). Do not draw objects in scene code.
- Colour as a legend: every hue on a board is in its legend (`B.legend`), the subject's hue is reserved.
- Data: Isotype first. A quantity is more units of the same size, never a bigger unit; a part of a unit is a cut
  pictogram; the key says what one unit is worth. Bars are iso columns that grow, with their number drawn as they grow.
- UI: a screen is a lit decal on a `laptop`, `phone` or `desk` monitor. A wall display or a dashboard is the `screen`
  kind: its face shows bars, a line chart and rows (one bar or row in an outcome hue for the thing that is wrong), never
  words; a pin names it. A screen whose words matter is a cut to a flat UI frame (`Loom.ui`), not words on an iso face.
- Isotype tallies count with the pictogram of the noun counted: requests with `request`, orders with `order`, people
  with `person`, parcels with `box`. Left out, the engine picks it from the label; a mismatch is named.
- Halls with no windows (a data hall, a depot) take `facade: "hall"` (louvres, shutter doors, a sign plate, roof
  units): a plain grey box before its cutaway reads as nothing.
- Icons: Lucide only inside flat cards (rare); on the board, objects are solids.

## 10. Templates in this style

Bespoke scenes on the engine are the norm. Templates:
- `title.card`, `definition`, `quiz.question`: fine, flat, on the pale field; keep a small iso cube chip as the accent.
- `process.flow`, `list.steps`: prefer `B.flow` (stations in a row) on the engine.
- `compare.two`: prefer two boards (a cut) or two stations.
- `avatar`: avoid (s8).
Unverified in this style: look at each template's strip before relying on it (s14).

## 11. Recipes (code)

**R1. A teaching frame: three stations in a row.**
```js
const B = ctx.engine.board(ctx, { name: "ops", size: [11, 11], plinth: false, unit: 92, centre: [960, 590], at: 0.2 });
B.flow("steps", { axis: "row", x: 0, y: 8.4, w: 2.6, d: 2.6, gap: 1.6, at: ctx.cue("order") - 0.3, by: ctx.cue("delivered"),
  steps: [{ label: "Order placed", kind: "laptop", tok: "accent2" }, { label: "Packed", kind: "crate", tok: "accent4" },
          { label: "Shipped", kind: "van", tok: "accent3" }] });
```
**R2. The subject on its route, followed.**
```js
const r = B.route("delivery", [[2.4, 9], [13.8, 9], [13.8, 2.4]], { tok: "accent", dash: true });
const truck = B.put("truck", { route: r, tok: "accent", subject: true, at: t0 });
B.focus([truck], t0 + 0.4); B.track(truck, { at: t0 + 0.8, label: "Your parcel" });
truck.travel(r, t0 + 1.4, { dur: 6 }); B.camera(t0 + 1.0, truck, { zoom: 1.5 });
```
**R3. A cutaway with work inside.**
```js
const hall = B.put("building", { x: 1, y: 1, w: 6, d: 4, floors: 1, fh: 2.2, rooms: (f, add) => add("shelf", { x: 0.5, y: 0.5, l: 4.5 }) });
hall.cut(ctx.cue("inside"));
const fl = B.put("forklift", { x: 1.6, y: 3.6, z: 0.12, inside: hall, at: ctx.cue("inside") + 0.6 });
B.inset("aisle", { of: fl, centre: [1600, 260], at: ctx.cue("picking") });
```
**R4. A number that adds up.** `B.tally(E, { n: 40, per: 250, total: 10000, icon: "order", label: "requests" })`.

## 12. Failure modes seen in real frames

Seen while building this style's lab scenes (Node previews, 2026-10-16):
| seen | why | rule |
|---|---|---|
| shelf parts drawn over a warehouse roof | the painter's sort ordered pairs by their bounding rectangles; pairs that cannot occlude gave contradictory answers and made cycles | sort only pairs whose screen hexagons overlap (the engine does); build kinds from boxes that touch, never cross (`iso_order`) |
| a flow along one world axis ran diagonally down the frame and left the board mostly empty | iso axes are diagonals on screen | teaching flows use `axis: "row"` (stations stepping along +x, -y: one screen row) |
| pins slid over the frame's title during a pan | pins follow the camera | `topSafe` on the board, and `until` on teaching pins before a camera move |
| an inset's leader struck through a pin's words | the inset was drawn over the pins | insets live under the pins (the engine's overlay order) |
| the subject's own hue on staff pictograms | one hue was given two meanings | people in `line`; the engine names a second meaning (`iso_hue_two_meanings`) |
| a teaching frame half-filled by a building that belonged to the detail beat | everything was on the board from the start | let detail objects rise as the camera pulls back |
| 28 `iso_order` warnings on a stream of crates that were never there at once | the check ignored when items arrive and leave | the check is time-aware (an item lives from its entrance to the middle of its exit; movers are checked along their moves); stress scene, board 2 |
| a floating gateway cloud looked stuck to Hall B; the request's air route drew over every building | no height cue; air routes were a top layer | height cue (shadow and stem); air routes sorted among the solids with a ground trace and corner stems; stress scene, board 1 |
| three pins crowded the Pack station, their leaders tangled | a pin only avoided pins already on screen when it was made | pins avoid every pin on screen at the same time, fan out with longer leaders, and `iso_pin_crowd` names what still crowds; stress scene, board 2 |
| a stack's count pin faded under focus | it stood on a bare point, and a point is context | it stands on a unit and follows the units' focus; stress scene, board 2 |
| a wall dashboard was two plain boxes | no screen kind | `screen` with bars, a line and rows; stress scene, board 3 |
| a data hall read as a grey box before its cutaway | windows off and nothing in their place | `facade: "hall"`; stress scene, board 1 |
| an opening frame about 70 % empty board | the camera opened on the whole board | open close and widen (`B.flow({widen: true})`, `B.widen`) |
Add each failure a lesson shows here, with its lesson and beat.

## 13. Polish checklist (yes or no, on the contact sheet)

1. Is every solid in three tones of one token, with no outline?
2. Is the subject the only thing in `accent`, and does the legend name every other hue once?
3. Does every route run along the grid, and is it drawn before anything moves on it?
4. Are pins 1 to 3 words, clear of the subject, inside the frame, at most 5 (teaching) or 7 (detail) at once?
5. Do numbers appear as units that add up to the number said?
6. Do solids arrive by rising or dropping, never by fading?
7. Is the teaching frame calm: 1 to 3 stations, one route, at most one note card?
8. Does the detail frame carry real detail (tell-tale parts, something moving, something inside)?
9. Does the camera only pan and zoom, with a hold after each move?
10. Is the bottom 150 px clear for captions?
11. Does the painter's order look right everywhere (nothing showing through a roof or a wall)?
12. Are words at or above the floor at the frame's zoom (pins always are)?

## 14. Gaps

| gap | size |
|---|---|
| Chrome strips, a composed lesson and an H.264 MP4 judged (fine decals at a wide zoom may shimmer) | M |
| Designed isometric people and vehicles beyond pictograms (A-07, A-08 in the hand-off sheet); until then people are the engine's pictograms (s8) | L |
| A floating item's stem ignores movers under it (a van passing under the gateway cloud shows the stem over it) | S |
| Level of detail by zoom (fade fine decals when zoomed far out) | S |
| A restore for a cutaway (put the skin back), exploded floors | S |
| An fx background with the lattice on the ground (today the board carries its own) | S |
| Templates not looked at in this style | S |

## 15. Engine and asset requests

- The lead integrates: `isometric` in `tests/suites/style_system.py` PACKS (the guide-count test counts guides), a
  CHANGELOG and DECISIONS entry, the catalog regeneration.
- Assets: isometric people and vehicle kits (A-07), props (A-08) for scenes that need more than the library.
- T-134 `kit_iso_blocks` is covered by the engine's object library (s17): its kinds, sizes, tones, cutaway (`cut`),
  focus (`B.focus`) and placement are all there.

## 16. Verified on 2026-10-16

- `lint_style` on the pack: no problems (`[]`); `loom/engines.py lint` on the engine: no problems.
- Contrast pairs in s2: `loom.checks.style_lint.contrast` on the pack's palette; captions via `caption_ratios`.
- `python3 tests/run_tests.py --only isometric`: 7 offline tests pass (lint and switch, painter's order with a mover
  and determinism, the order check on crossing boxes, three tones and focus+context, a tally that adds up, pins off the
  subject, meaning and grid rules); the browser test skips here.
- Node previews of `iso_teach`, `iso_diorama`, `iso_lesson` looked at frame by frame (three or more rounds each):
  `docs/styles/demos/lab/*__isometric__PREVIEW.jpg`.
- Not verified: Chrome strips, a composed lesson, an MP4, the speech and caption checks on a lesson in this style.

- Stress-test fixes (2026-10-16, `docs/research/2026-10-16-style-stress/`): `py tests/run_tests.py --only isometric`
  15 tests pass, among them the time-aware order check (control: a wall on the lane and a twin crate are named), the
  height cue and sorted air routes (control: `air: "over"` stays on top), the screen kind (control: no panels, no
  content), the stack's count pin under focus (control: a pin on a point fades), crowded pins (control: forced ones are
  named), the tally icon from its noun and `widen`. After frames: `out_isometric_after/frames/`, looked at full size.

## 17. The engine and the two registers (2026-10-16)

**The engine** (`runtime/engines/isometric.js`; how to call it: `docs/styles/engines/isometric.md`) builds one
retained SVG board inside an element a scene made: a plinth with strata and a lattice, layers for ground items, decals,
solids and air routes, and an overlay for pins and insets. One clock per board makes the camera, the movers, the pins,
the rings and the flows a pure function of time; every move is also a drive on the timeline so the report sees it.

**The object library**: box, slab, cylinder, ramp, stairs, plate, building (floors, windows, a door, a cutaway shell,
rooms, a hall facade), factory, store, desk, screen, rack, laptop, phone, database, cloud, truck, van, forklift,
container, conveyor, shelf, crate, pallet, tree, road, person. Each takes a size and a token, faces one of four directions, and names its parts.

**Two registers**:

| register | for | what is on the board | density |
|---|---|---|---|
| teaching (most beats) | explaining a process, a choice, a rule | stations on plates in one row, one route, pins, a note card, iso bars | 1 to 6 objects, 5 pins |
| detail (about 1 beat in 3) | seeing a system work | the diorama, a cutaway, an inset, a tracked subject, focus and context, Isotype stacks | up to 25 objects, 7 pins, 1 to 3 movers |

**Ours, beyond opuscar**: the teaching register itself (stations in a screen row, iso bars that count, note cards with
legend chips); an exact painter's sort (hexagon overlap, per-frame movers, a check that names what cannot be sorted);
pins in screen space that keep off the subject and never fall under the type floor; a live inset that follows a moving
subject; checked meaning (a hue's second meaning, the subject hue misused, counts that do not add up, diagonal routes,
too many pins or hues); storyboard planning and topic recipes in the engine guide.

## 18. Camera grammar

| move | what it says | serves |
|---|---|---|
| close on 1 to 3 stations (zoom 1.3 to 1.8), held | "this is the idea" | teaching beats |
| a calm pan to the next stations | "and then" | a sequence, the next idea |
| the scale reveal (`B.reveal`) | "here is where it all lives" | after teaching, before detail; the ending |
| lean in on one object (zoom 1.8 to 2.6) | "look inside" | cutaways, insets |
| follow the subject along its route | cause and effect, a journey | a delivery, a request, a case |
| locked while things accumulate | a system filling up | Isotype stacks, queues |
| a cut to a second board | before and after; here and there | change, comparison |

## 19. Sound palette

Low and passive (D-179): `calm_focus` music (a clean pulse, mallets); at most one soft click as a cutaway opens and a
soft thud as a stack completes; no sound per unit; a beat of quiet before a scale reveal.

## 20. Native moves (with what they fit in corporate lessons)

| move | the call | fits content like |
|---|---|---|
| a three-step flow in a row | `B.flow({axis: "row"})` | order to delivery, request to response, apply to hire |
| iso bars that count | `B.bars` | volumes by day, load by hour, cost by site |
| cutaway | `item.cut` | inside a warehouse, a hall of racks, a building's floors |
| a live inset | `B.inset` | a worker at a station, one rack, one shelf |
| tracked subject | `B.track` + `travel` | a parcel, a request, a visitor, a case |
| focus and context | `B.focus` | the one site that fails, the one step that waits |
| Isotype tally and stack | `B.tally`, `B.stack` | requests a second, parcels a day, people per shift |
| strata | `strata`, `B.stratumPin` | the network and power under a site, layers of a stack |
| flows | `route.flow` | data, goods or people moving continuously |
| scale reveal | `B.reveal` | the whole system as the ending |

## 21. Variation space for lessons

- **Structures:** one board that grows (teaching, reveal, detail, teaching); two boards compared (before and after, by a
  cut); a loop route that returns with one number changed each lap; one building floor by floor (cutaway, then a
  camera that steps down).
- **Openings:** the finished board, then taken apart; one unit multiplying into the site; a question laid on the board.
- **Endings:** the scale reveal with the legend; the subject alone in colour; a station left empty (the open question).
