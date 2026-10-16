# The isometric engine: how a lesson is directed, storyboarded and built with it (2026-10-16)

A lesson in the isometric style has `ctx.engine`: a working system drawn as a clean isometric infographic on ONE
floating board. Solids are flat three-tone shapes at true 30 degree isometric with no outlines; thin ink is only for
the infographic furniture (map pins on leaders, routes, cut lines, rings, legends). Every frame is a pure function of
time. This page is for the storyboard agent (sections 1 to 5: how to plan) and the scene agent (sections 6 to 9: the
calls). Research behind it: `docs/research/2026-10-16-style-isometric.md`; the look and its rules:
`docs/styles/guides/isometric.md`.

## 1. Two registers: choose per beat

| register | share of a lesson | what is on screen | the camera |
|---|---|---|---|
| **Teaching** | most beats (about 2 in 3) | 1 to 3 stations on pale plates (one object each), one route between them, map pins, at most one note card; iso bars; a three-step flow; a legend | still, or a calm pan to the next idea; close (zoom 1.3 to 1.8) |
| **Detail** | where a system must be SEEN working (about 1 beat in 3, never two long ones in a row) | the diorama: buildings, roads, routes with moving things, a cutaway, an inset, a tracked subject, focus and context, Isotype accumulation, strata | leans in to the detail, follows the subject, pulls back for the scale reveal |

A lesson moves between them like a guide over a model of the site: explain on two or three stations, pull back to show
where they live, lean in where it works, lean back to say what it means. Lab scenes: `iso_teach` (teaching),
`iso_diorama` (detail), `iso_lesson` (both on one board).

## 2. Planning a lesson on one board (storyboard agent)

1. **Pick the system and its ONE subject.** The subject is the thing the learner follows (an order, a request, a truck,
   a patient file, a pallet). It gets the reserved subject hue (`accent`, vermilion) and nothing else ever does.
2. **Write the legend before the boards.** One hue per role, at most 5 legend hues a board (`accent2` blue, `accent3`
   teal, `accent4` amber, plus `pos`/`neg` only for outcomes); everything else is a named material (`concrete`,
   `steel`, `road`, `glass`, `leaf`, `water`, `soil`, `wood`) or neutral. Write the legend into the storyboard: the
   engine warns when a hue gets a second meaning (`iso_hue_two_meanings`).
3. **Lay out the board as stations on a grid.** Size 12 x 8 to 20 x 14 units. Put the stations the narration names
   first on the back-left to front-right row in narration order, so routes run left to right on screen. Leave 1.5 to 2
   units between stations for routes and pins. Stations that must be found in a wide shot get a plate (`B.station`).
4. **Draw the routes on the grid.** Every route is a polyline along one axis at a time (it turns at corners);
   diagonals are refused (`iso_route_diagonal`). A route is drawn before anything moves on it.
5. **Plan the camera path as a list of framings**, one per beat: wide (the whole board, the scale reveal), station
   (zoom 1.3 to 1.8 on one or two stations), detail (zoom 1.8 to 2.6 on one object), follow (a subject on its route).
   The camera pans and zooms in the board's plane only; it never rotates the projection.
6. **Cut to a second board** (a new `W.board` in a new beat, joined by a cut) when the story changes place or time:
   before and after, here and there, a different system, or when a board would hold more than about 12 objects in
   view. Never more than two boards in a lesson section.
7. **Plan the numbers as pictures.** Each number the narration says becomes an Isotype tally (a card) or a stack (on
   the board) or bars; say what one unit is worth (the key) and check that units x value = the number said (the engine
   errors on a mismatch, `iso_count_mismatch`).
8. **People** are the engine's flat Isotype pictograms (`person`: no face, one hue) until a designed isometric
   character kit exists (A-07). Plan people as roles in a system (staff, a team, a queue), never as a person the
   story follows; that needs the kit (Claude Design first, `skills/lnd/lnd-character-design`). Never draw detailed
   people in scene or engine code.
9. **Open close, then widen.** An opening frame that is mostly empty board wastes the first seconds: open close on
   the first station and pull back as the next ones arrive (`B.flow({widen: true})`, or `B.widen` for any list).

## 3. Beat recipes for common corporate topics

| topic | board | teaching beats | detail beats | the subject |
|---|---|---|---|---|
| **Supply chain / order to delivery** | factory, warehouse (`shelf`, `forklift`, `conveyor`), dock, roads, a store | 3-step flow: ordered, packed, shipped; bars of orders a day | cutaway warehouse with picking; parcels stacking (Isotype); a truck tracked to the store; inset on a shelf | one order (a crate or the truck, `accent`) |
| **Data centre** | a hall of `rack`s, cooling (`cylinder` in `water`), power (`box` in `accent4`), strata: network, power | flow: request, network, server; bars of load by hour | cutaway hall; a request on an air route with `flow` pulses; rack inset; tally of requests a second | one request (a small `box`) |
| **Cloud architecture** | `phone`, `laptop`, `cloud` (floating, `z` 1 to 2), `database`, `building` for a region | stations: users, cloud, data; a note on what each does | air routes between regions with flows; focus on the failing region; a stratum for "the network" | one call, or the region that fails |
| **Office or building operations** | a `building` with floors and `rooms` (`desk`s, people), `stairs`, a lobby `plate` | floors as stations; bars of desk use | cutaway floor by floor; people moving one axis at a time; a tracked visitor | one visitor or one team |
| **A hiring or order process** (an abstract process) | plates as steps (no diorama), `laptop`/`phone`/`desk` objects, a `crate` for "the case" | a 3 to 5 step flow in one screen row (`axis: "row"`); a note per step | the case travels the flow; a stack of applications thinning to one; focus on where it waits | the case (`accent`) |
| **A city or site** | `road`s, `building`s, `store`s, `factory`, `tree`s, `van`s | stations for the places that matter | vans on routes, a tracked van, the scale reveal of the whole site | one van or one site |

Opening ideas: the finished board, which then comes apart into its moving parts; one icon multiplying until it is the
site; a question as words laid on the board (`B.floorText`). Endings: the scale reveal with the legend; the subject
alone in colour; an unanswered station (a route that stops at an empty plate).

## 4. Density limits (checked where the engine can)

| | teaching | detail |
|---|---|---|
| objects in view | 1 to 6 | up to 25 (a board), 12 in a close view |
| pins on screen at once | at most 5 | at most 7 (`iso_dense` warns past 7) |
| legend hues on a board | 3 | 5 (`iso_hues` warns past 6) |
| moving things at once | 0 to 1 | 1 to 3, one of them the subject |
| words | a pin is 1 to 3 words; a note card is a title (up to 7 words) and one line | the same; no sentences on the board |
| time per idea | 4 to 8 s a frame | a detail move every 2 to 4 s, then a hold |

A camera move, a cutaway, a focus and an inset are each a beat's event: do not stack two in the same second. Keep a
hold of at least 1.5 s after a scale reveal so the whole picture can be read.

## 5. Sound

Low and passive (D-179): music `calm_focus` (a clean pulse or mallets); at most a soft thud as a stack completes and a
short whoosh-free click as a cutaway opens; never a sound per Isotype unit.

## 6. The calls (scene agent)

```js
const W = ctx.engine;
const B = W.board(ctx, { name: "site", size: [16, 11], at: ctx.cue("our warehouse") - 0.4,
  strata: [{ tok: "surface2", h: 0.14 }, { tok: "accent2", h: 0.16, label: "network" }, { tok: "steel", h: 0.3 }] });
// a later beat resumes it (the board is held across beats; the camera keeps its place):
// const B = W.board(ctx, { hold: "site" });
```
Board options: `size [w, d]` (world units), `unit` (px a unit at zoom 1; fitted to the safe area if omitted),
`centre [x, y]` (screen), `depth`, `strata` (bands on the board's front faces, top first), `lattice: "dots" | "lines" |
"none"`, `plinth: false` (stations float on the ground: the teaching look), `headroom` (the tallest object, units),
`topSafe` (pins fade above this y: a title band), `at`, `enter: "none"`.

**Objects.** `const it = B.put(kind, {x, y, z, dir, tok, at, enter, subject, role, inside, ...size})`.
- `x, y` the footprint's back corner in world units (`route: r` starts it on a route instead); `z` its base height.
- `dir` `"+x" | "+y" | "-x" | "-y"`: the way it faces (a truck's cab, a desk's screen, a shop's front).
- `tok` a palette token or a material; `subject: true` for THE subject (only then `accent`); `role` its legend meaning.
- `at` its entrance time; `enter: "rise"` (grows from its base: buildings, bars, racks), `"drop"` (lands with a short
  settle: vehicles, crates, people), `"draw"` (flat things); without `at` it is there with the board.
- `inside: host` draws it inside a host that has been cut away (a forklift in a hall).
- `cue`: the height cue of a floating thing. An item 0.6 units or more above what stands under it (a cloud, a parcel
  on an air route) gets a soft shadow straight under it and a dashed stem down to it, so it reads as above, not stuck
  to what is behind it; the stem lands on the roof or the ground under it (`B.groundAt(x, y, t)`). `cue: false` none,
  `cue: true` always; `shadowZ` fixes where it lands.

Kinds (`W.kinds()`, each with named parts; `W.describe(kind, opts)` gives its size and parts):

| kind | size options | tell-tale parts |
|---|---|---|
| `box`, `slab`, `cylinder`, `ramp`, `stairs`, `plate` | `w d h`, `r h`, `rise`, `steps`, `top`, `dashed` | three tones; a plate has a pale top, hue sides, a dashed outline |
| `building` | `w d floors fh windows door glass slab inner roof rooms(f, add) facade louvres doors sign units` | floor slabs, window rows, a door, a roof with plant; `facade: "hall"` (a data hall, a depot) gives louvres, shutter doors and a door, a sign plate (a colour, never words) and roof units with fans; `shell` and `roof` are the cutaway skin |
| `factory` | `w d h teeth chimney band` | sawtooth roof with glazing, a chimney with a band, a shutter door |
| `store` | `w d h awning` | shop window, door, sign band, striped awning |
| `desk` | `w d screen chair chairTok` | legs, top, keyboard, monitor with a lit screen, chair |
| `screen` | `w h d legs screen ink panels: [{show, values, tok, hi, hiTok, dot}]` (show: `"bars"`, `"line"` or `"rows"`) | a wall display or kiosk whose face shows bars, a line chart with its area, rows (never words); `hi` picks one bar or row for `hiTok`; the face is the left front, `dir: "-y"` turns it right |
| `rack` | `w d h units lit light unit` | frame, server units with lights (`lit` how many on), boards; the side panel and top are the skin |
| `laptop`, `phone` | `w d open screen` | lid hinged at the back with a lit screen; an upright phone with a screen |
| `database`, `cloud` | `r discs dh`, `s` | three discs with gaps; puffs in two tiers |
| `truck`, `van`, `forklift` | `l w`, `trailer stripe`, `lift load` | cab, windscreen, trailer stripe, wheels; van cab and windscreen; forklift mast, forks, guard, counterweight, a load |
| `container`, `conveyor`, `shelf`, `crate`, `pallet` | `l w h`, `hz belt`, `l d h levels beam goods stock(k, i)`, `s h`, `w d` | ribs and doors; belt and rollers; uprights, beams, decks, pallets with taped goods; taped parcel; slats |
| `tree`, `road`, `person` | `s shape: "pine"`, `len w marks`, `s` | a round crown or a pine; a dark strip with a dashed centre line; a flat Isotype pictogram |

**Item calls.** `it.travel(route, t, {dur | by | speed, ease, face})`, `it.move(t, {to | by, dur})` (one axis at a
time), `it.cut(t, {dist})` (cutaway), `it.tint(t, tok)` (a change of state by colour), `it.exit(t, {kind: "lift" |
"sink"})`, `it.top(t, part)` (a world point for pins), `it.parts`.

**Routes and flows.** `const r = B.route(name, [[x, y, z?], ...], {tok, width, dash, arrow, air, stems, cue, at, dur |
by})`; `r.flow(t0, t1, {n, speed, tok})` runs pulses along it (data, goods, people). `B.road({x, y, len, dir})`.
`air: true` puts each segment among the solids (a hall in front hides it, it passes over what is under it, it enters a
cut-away hall it drops into) with a height cue: a dotted trace on the ground and dashed stems from its corners down to
what stands under them (`stems: false` or `[point indices]`; `cue: false` for neither). `air: "over"` draws it over
everything, the old way. A mover riding a route always draws over its own route.

**Pins (map labels).** `B.pin(target, "Words", {at, until, side: "auto", sub, tok, leader, lift, maxLines, widest})`;
target is an item, a world point or `{anchor}`. A pin is a dot, a leader, a shoulder and a plate in the pack's label
face, measured. It never scales with the camera, follows its anchor, fades rather than be cut by the frame, and with
`side: "auto"` keeps off the subject (top-right preferred). `pin.live(t0, t1, (t) => text)` for a count.
Every other pin on screen at the same time (whichever was made first) is avoided: plates, dots, leaders that cross or
graze a dot; where dots crowd, longer leaders let the plates fan out. A pin that still crowds another wherever it goes
is named (`iso_pin_crowd`): give one an `until`, another anchor, or `side: "auto"`. `of: item | [items]` says whose
focus the pin follows (default its target when that is an item; a pin on a bare point is context under any focus).
`B.stratumPin(i, "Network", {...})` labels a band of the board's edge.

**Camera.** `B.camera(t, target, {zoom, dur, margin, fly, dx, dy})` (target: an item, a list, a world point, a
board-px rect, or `"all"`); `B.reveal(t)` (the scale reveal); `B.home(t)`. `B.widen([[t, items], ...], {max, margin,
dur})` opens close on the first and, at each time, pulls back to frame everything named so far (never closer than
`max`, 1.8); `B.worldRect([x0, y0, z0, x1, y1, z1])` is a camera target for a place not built yet. Cameras come before
pins (pins place by the camera at their time). Zoom is interpolated in log space;
`fly: true` takes the optimal pan-and-zoom path for a move across the board.

**Focus and context, tracking, insets.** `B.focus([items], t)` / `B.unfocus(t)`; `B.track(item, {at, until, label})`
(a "you are here" ring and a pin that follow it); `B.inset(name, {of, centre: [x, y], r, zoom, at, until, label})`
(a live magnified view of the same board; a moving `of` stays centred).

**Numbers.** `B.tally(E, {n, per, total, icon, tok, cols, title, label, at, by, accent: [i0, i1], partial})` (a flat
Isotype card in the scene's element `E`; icons: person, truck, box, building, server, doc, coin, tree, cloud, phone,
car, order, request). The icon is the noun counted: left out, it is picked from the label ("requests": request,
"orders": order, "people" or "staff": person, "parcels": box; `W.iconFor(words)`), and an icon that does not match
the noun is named (`iso_tally_icon`). `B.stack(name, {kind, n, cols, rows, x, y, z, per, label, pinTok, at, by})`
(units piling on the board, with a pin that counts; it returns `{units, anchor, pin, times}`). The count pin stands on
the unit nearest the middle of the top layer and follows the units' focus, so `B.focus([plate, stack])` (a stack
counts as its units) keeps it in colour. `B.bars(name, {x, y, axis: "row", values: [{label, value, tok}], height, at,
by, unit})`.

**Teaching.** `B.station(name, {x, y, w, d, tok, kind, obj, label, at})`; `B.flow(name, {steps: [{label, kind, tok,
obj}], axis: "row" | "x" | "y", x, y, w, d, gap | step, at, by, until, widen})` (`widen: true` or `{max, margin}`: the
camera opens on step 1 and pulls back as each step arrives); `B.note(E, {title, body, tok, index, at})`;
`B.legend(E, [[tok, label], ...], {title, at})`; `B.floorText(name, text, {x, y, axis, role, at})` (words laid on the
board). Helpers: `W.tones(tok)`, `W.cube(g, cx, cy, s, tok)`, `W.icon(g, kind, cx, cy, size, tok)`,
`W.schedule(n, t0, t1)`.

## 7. The rules it already keeps (do not re-implement them)

- **Painter's order is exact**: solids are sorted by box separation on the three axes (only boxes whose screen hexagons
  overlap are ordered), each object's parts the same way, and while anything moves the whole order is sorted again
  each frame (air-route segments and stems included). Objects that occupy the same space AT THE SAME TIME cannot be
  sorted and are named (`iso_order`, with the time): an item lives from its entrance to the middle of its exit and a
  mover is checked along its moves, so a stream of crates that pass one point one after another is fine.
  `B.clashes()` lists them.
- **Lines lead**: a route draws before its mover (`travel` draws it if you did not); a pin's leader before its plate;
  a cut line before the skin slides; an inset's leader before its circle opens.
- **Solids arrive by motion** (rise or drop), never by fading in.
- **Accumulation accelerates**: tally and stack arrivals come faster and faster; the count is exact at every frame.
- **Words are the pack's fonts, measured** (`kit.text`), at or above the type floor whatever the zoom.

## 8. On the word

Start an entrance about 0.3 s before its cue; a route's draw should end as the narration names the destination; a
camera move takes 1.2 to 2 s and starts on the phrase that changes the subject; a cutaway goes on "inside".

## 9. Failure modes to avoid

- A frame that is mostly empty board: frame the stations closer, or make the board smaller (`size`) with `plinth: false`.
- A pin over the subject or a pin cut by the frame edge: let `side: "auto"` place it, give it an `until`, or move the
  camera.
- Two objects in the same space at the same time (`iso_order` names them and when): move them apart, time them
  apart, or put one `inside` the other (a request dropping into a cut-away hall is `inside: hall`).
- A floating thing that looks stuck to the building behind it: leave its height cue on (it is, by default).
- Pins crowding one station (`iso_pin_crowd`): one pin per spot at a time; a count rides the stack's own pin.
- A dashboard drawn as plain boxes: use `screen` with panels.
- A hue for decoration: every hue must be in the legend.
