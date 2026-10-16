# The hologram engine: how to direct, storyboard and build with it (2026-10-16)

A lesson in the hologram style has `ctx.engine`: a calm operations HUD projected in light. It builds every HUD piece
from code (frames with corner brackets, panels that assemble, cards, readouts, a scanner, target locks, a wireframe
globe, a network mesh, a waveform, grids, a timeline scrubber, gauges, callouts, a flow), puts each in one of three depth
layers, and runs every continuous motion as a pure function of time on one clock. Designed art (people, icons,
devices) is placed as before; the engine is for what a HUD would draw. Research and sources:
`docs/research/2026-10-16-style-hologram.md`; the look: `docs/styles/guides/hologram.md`.

Four rules carry the style (each from a source, s2 of the research):
1. **One read per frame** (Coleran): a viewer understands the frame in a second. The panel title states the read; the
   value or the verdict is the biggest thing.
2. **Every word is a story point** (Hansen): no filler text, no fake hex, no lorem coordinates. Every word comes from
   the lesson's knowledge sheet or the narration.
3. **Nothing moves that carries no information** (Noessel's "fuigetry"): no idle loops, no blinking, no spinning for its
   own sake. A loop (sweep, spin, traffic, a wave) runs only inside the window the narration needs.
4. **Colour only for status** (high-performance HMI, SOC practice): cyan is the HUD's ink; amber is a measure or a
   warning, red an alert, green healthy, and each is told twice, colour AND word (`WARN`, `ALERT`, `OK`).

## 1. The two registers (choose per beat; write it in the storyboard)

| register | when | what is on screen | limits |
|---|---|---|---|
| **briefing** (most beats, about 2 in 3) | explaining: a concept, a process, a rule, a number that matters, a verdict | a title, 2 or 3 cards (one read each) or one panel, ONE diagram (a flow, or a small mesh), generous space | at most 4 pieces; at most 1 status change a beat; no scanner, no globe spin, no camera move except a slow push on a section start |
| **analysis** (at most 1 beat in 3, never two in a row longer than 40 s together) | the system has to be seen working: an incident, a trace, a health check, a model under drift | a scan across the system, a lock on one element, live readouts, a globe or mesh with traffic, panels in depth, evidence (a timeline, a wave, gauges) | at most 7 pieces; 1 lock at a time; 1 camera move at a time; at most 2 loops running at once |

**Holograms first, panels last (D-194).** Every beat, briefing ones too, shows a hologram: the subject or its part as
light (`H.hero3d`, `H.object`, `H.plane` sheets in depth, `H.globe`, `H.mesh`, `H.trace`, `H.tokens`). Cards, readouts and
gauges are plates beside it, never the picture. The audit refuses `holo_ui_heavy` when under 75 % of the bespoke beats
show a hologram, and the storyboard gate allows at most 10 % catalog templates.

A lesson moves between them like an analyst at a console: brief, lean in, come back. Inside one beat the switch is
`H.mode("analysis", ctx.cue("..."))`: the briefing pieces recede to 0.3 (nothing is redrawn), the analysis pieces boot.
`H.mode("briefing", t)` brings them back. Across beats keep the HUD (`keep` / `ctx.held`) so the lesson is one console,
not a slideshow.

**Storyboard fields to write for each beat:** `register` (briefing or analysis); the one read; the pieces (by call
name); which spoken words trigger each change (cues); the camera move if any; which pieces are kept for the next beat.

## 2. The calls

```js
const W = ctx.engine, H = W.hud(ctx, { name: "hud" });        // once per scene: three depth layers, the camera, the clock
```
Every piece takes a box (`x, y, w, h`, station px) or a centre (`cx, cy, r`), `depth` (`"far" | "mid" | "near"`, default
mid), `at` (when it starts, usually `ctx.cue("...") - 0.3`), and returns a handle `{E, t, ...state functions}`; `t` is when
its build ends. Status names: `info` (cyan), `warn` (amber), `alert` (red), `ok` (green), `idle` (muted); any pack token
also works.

**Briefing pieces**
- `H.title(name, {x, y, w, h, kicker, text, role, at})`: a kicker on a short rule, then the line (role title by default;
  `role: "lead"` for the analysis header).
- `H.card(name, {x, y, w, h, kicker, value, decimals, unit, label, status, from, roll, at})` -> `{status(st, t)}`: one
  large value (counts up from `from`, or `roll: true` rolls its digits right to left), its unit, a one-line label, an
  optional status tag. Height decides the value's role (hero from 118 px of room, else title).
- `H.flow(name, {x, y, w, h, steps: [{label, sub, status}], dir, by, at})` -> `{step(i, st, t, {word}),
  packet(t, {dur, from, to}), box(i)}`: the briefing diagram; the packet shows only in the gaps (never over a step's
  words) and a step tints while it is inside. `dir` is the way the data moves: `"right"` (or `"row"`, the default),
  `"down"` (or `"col"`), `"left"`, `"up"`; with left and up the first step sits at the right or the bottom, so list the
  steps in flow order and the arrows point the way the data goes. `step(i, st, t)` recolours the brackets AND shows the
  status word in a tag at the step's top right (`{word: "APPROVED"}` for another word, `{word: false}` for none).
- `H.panel(name, {x, y, w, h, title, rows: [[key, value, status], ...], by, valueW, tagRoom, register, at})` ->
  `{set(i, value, t, status), mark(i, status, t, {word, to}), row(i)}`: brackets, the top rule, the title types on, then
  each row arrives with its tick. A status given to `set` or `mark` shows its WORD in a tag (WARN, ALERT, OK, IDLE) as
  well as the colour; `"info"` clears the tag. A row with no tag slot makes room on the word (its key and value move
  left and type on again); `tagRoom: true` (or a word, for its width) reserves the slot in every row from the start,
  the calmer choice when you know a status will come.
- `H.bars(name, {x, y, w, h, title, rows: [[label, value, status]], max, unit, decimals, unitSep, minLen, labelW, valueW,
  rowH, barH, fill, by, at})` -> `{set(i, v, t, dur), mark(i, status, t, {word, to}), bar(i)}`: a ranking or a set of
  probabilities. Filled bars (fill 0.45) with a glowing leading edge on a hairline track (the scale), the label on the
  left and the value OUTSIDE the bar on the right, so a small value always reads; a value above zero is never shorter
  than `minLen` (12 px). Bars grow from zero as their rows arrive; `set` moves a bar (its value counts with it);
  `mark` recolours a bar and shows its word in a tag beside the bar's end, or inside a long bar (`holo_bar_tag_room`
  when there is room for neither).
- `H.vcenter(h, {top, bottom})` -> y: the top of a block `h` tall centred between the top safe line (84) and the
  caption band (930). Lay a briefing composition with it. `holo_top_heavy` warns when a briefing composition, at its
  fullest (before a power-down, a register switch, the end), ends above 72 % of the frame with its middle well above
  the band's middle; `W.hud(ctx, {balance: false})` turns the check off for a deliberate layout.

**Analysis pieces**
- `H.readout(name, {x, y, w, h, title, rows: [[time, text, status]], visible, at})` -> `{push(row, t), mark(i, st, t)}`:
  a log that scrolls up as rows arrive (each push is one row, on the word).
- `H.mesh(name, {x, y, w, h, nodes: [{id, x, y, label, status, r, labelBelow}], links: [[a, b]], traffic: [{path,
  at, dur, every, until, status}], at})` -> `{set(id, st, t), linkStatus(a, b, st, t, {weight, dim, emphasis}),
  send(path, t, {dur, status}), node(id)}`: node and link coordinates are local to the mesh box. `linkStatus` with a
  status other than `line` or `idle` EMPHASISES the link so one stands out among fifty: a stroke `weight` times a
  link's (2.6 by default) with a glow, above the other links; `{dim: 0.3}` fades every other link on the same word;
  `{emphasis: false}` is the colour change alone; a later `linkStatus(a, b, "line", t)` takes the emphasis (and the dim)
  away.
- `H.scanner(name, {cx, cy, r, label, sweeps: [[t0, t1]], speed, blips: [{angle, dist, status, at, label, labelSide}],
  at})`: the sweep turns only inside its windows (at most 120 degrees a second); a blip lights when the sweep first
  passes it, then holds. A blip's `label` is a word on a plate on its outward side (or `labelSide`), lit with the blip;
  the scanner's box grows to hold it.
- `H.lock(target, {at, label, status, labelPos: "above" | "below", labelAlign: "left" | "right", caps, pad})` ->
  `{release(t)}`: brackets start large and turned and close on the target in 0.35 s, with one budgeted flash.
  `target` is an element, any handle, `M.node(id)`, `G.pointAt(id, t)`, `F.box(i)` or a rect `{x, y, w, h}`.
- `H.globe(name, {cx, cy, r, lat, lon, tilt, lon0, spin, spinFrom, spinTo, points: [{id, lon, lat, label,
  labelSide, status}], arcs: [{from, to, at, dur, status, lift, every, until}], labels, land, at})` -> `{status(id, st,
  t), pointAt(id, t), point(id)}`: orthographic latitude and longitude lines (front bright, back dashed and faint); the
  latitude in the middle of the disc is `tilt`; it faces longitude `-lon0`. Stop the spin before a lock (`spinTo`).
  Arcs and their traffic draw UNDER the points and labels (labels sit on plates), so a label always reads. A label goes
  on the point's inward side where the spin stops (over the disc, clear of the pieces beside the globe) unless
  `labelSide` says; labels that would overlap are stacked apart with a short leader (`labels: "fixed"` keeps them at
  their points). More than three labelled points warns `holo_globe_dense`. **Land:** a faint coastline outline (Natural
  Earth 1:110m, the data `runtime/geo.js` reads) when the build carries the geography; today a build carries it when
  the scene's source names `Loom.geo`, so place points with `Loom.geo.city("Mumbai")` (true places, and the land comes
  with them). `land: false` leaves it out; `land: true` warns `holo_globe_no_land` when the data is missing.
- `H.wave(name, {x, y, w, h, label, freq, amp, seed, speed, t0, t1, anomaly: {at, dur, status, x}, at})`: a signal that
  runs only inside [t0, t1]; the anomaly spikes and takes its status colour while it lasts.
- `H.gauge(name, {cx, cy, r, value, max, unit, unitPos, unitSep, decimals, label, warn, alert, invert, kind: "arc" |
  "ring", at})` -> `{set(v, t, dur)}`: the colour follows the thresholds (no second call to turn it red). The unit is
  never glued to the value: on a small gauge (r under 100) it sits under the value, smaller and muted ("0.41" over "s",
  "1234" over "/s"); "%" stays beside it ("5.8%"); on a large gauge it follows with a space ("210 ms"). `unitPos:
  "below" | "inline"` and `unitSep` override.
  `H.gauges(name, {x, y, preset: "RED" | "USE", values, labels, decimals, units, max, r})`: three gauges for a service
  (rate, errors, duration) or a machine (utilisation, saturation, errors); `decimals`, `units` and `max` take one value
  for all or a list, one per gauge (`decimals: [0, 1, 0]`).
- `H.scrubber(name, {x, y, w, h, start, end, events: [{at: 0..1, label, status}], head: [{t, to: 0..1}], at})`: a
  timeline; events light as the head passes them.
- `H.grid(name, {x, y, w, h, kind: "hex" | "dot", cell, opacity, at})`: a still texture, far layer, one pattern.

**The hero moment** (the style's main carrier, D-194: at least one hero per 8 beats, a hero for each subject the lesson
has; the storyboard gate refuses fewer, and the audit refuses a declared hero the scene never places)
- `H.object(name, {model, cx, cy, size, at, pitch, dist, yaw, spin, spinFrom, spinTo, build: {at, dur} | false,
  explode: [{t, to, dur}], explodeMax, hot: [{part, t0, t1}], tone, lift})` -> `{part(id, t), anchor(id, t),
  explode(to, t, dur), turn(deg, t, dur), hot(part, t0, t1), yawAt(t), parts}`: a hero 3D wireframe drawn by the
  engine in true perspective (deterministic SVG, no Three.js). Models: `rack` (cabinet, psu, srv1 to srv6, switch,
  fans), `chip` (substrate, pins, die, cores, lid), `drone` (body, arms, rotors, camera, skids), `datacentre` (hall,
  racks, roof, cooling, power), `lock` (body, shackle, cylinder), `phone` (frame, screen, board, battery, camera). Each
  is CAD-like (boxes with face grids, rings, tubes and longitudinal lines, every part connected). `cy` is where the
  base centre lands (stand it on a pad); `size` is its largest extent in px. A scan plane (an ellipse) rises through it
  and builds it with a near-white edge where it cuts; lines fog with depth (near 0.95, mid 0.6, far 0.26); `hot` lights
  a part near-white; `explode` moves parts along their axes (servers slide out on their rails); the turntable turns
  only inside `[spinFrom, spinTo]`. `part(id, t)` is a lock target, `anchor(id, t)` a point for a datum or a callout
  (stop the turntable first: `holo_lock_moving`). A radial lift sits behind it (`lift: false` to leave it out).
- `H.pad(name, {cx, cy, r, ratio, beam, beams, motes, spin, spinFrom, spinTo, seed, at})`: a projector pad in
  perspective: a base glow, a bright ring with two glow passes, a dashed ring and ticks that turn slowly, faint beams
  falling from `beam` px above, and dust motes drifting up through them (seeded `Loom.rng`, a pure function of time).
  Its spin and motes count as one loop, the object's turntable as another: keep the rest of the frame still.
- `H.stage(name, {focus: [x, y], lift, vignette, dark, at})`: the dark stage for a hero moment, in the far layer under
  every piece: the field taken near-black, a radial lift at the focus, a strong vignette. It is analysis furniture
  (`H.mode("briefing")` dims it); power it down when the hero moment ends.
- `H.chrome(name, {tl, tr, bl, br, bind, inset, rulers, at})`: HUD chrome at the frame's edges in the near layer
  (corner brackets, rulers along the top and the left, small mono status text in caps with wide tracking). The words
  are the author's (a hall, a mode, a system); `bind: OBJ` puts the object's TRUE azimuth and elevation in the bottom
  right, never decorative numbers. It stays above the caption band (930).
- `H.datum(name, {x, y, w, label, value, unit, decimals, roll, tone, to: [x, y], at})` -> `{set(v, t)}`: the analysis
  register's small data plate: the label in small mono caps tracked wide, the value in amber (`tone`, default warn)
  with rolling digits that settle on it, its unit, on a dark plate with a 1 px border and corner ticks; a leader runs
  to `to` (an object's anchor). Recipe: `H.lock(OBJ.part("psu", t), {at: t, label, status: "warn"})`, then
  `H.datum(..., {to: OBJ.anchor("psu", t), at: t + 0.45})`, one lock at a time; the datums stay.
- **Light:** every stroke with a halo carries two soft passes (a wide faint one and a narrow brighter one); an object's
  and a pad's glow passes blend additively (`mix-blend-mode: screen` where it renders). No word is ever inside a glow
  group or a blurred path (tested).
- Lab: `docs/research/2026-10-16-style-stress/hologram_wow.js` (the rack scanned, three parts measured, the
  exploded view).

**Hologram v2** (2026-10-16; why: `docs/research/2026-10-16-hologram-v2.md`). Kshitij: "Keep both, decide wisely
depending on the complexity." Objects that read better in true 3D (a bicycle, a globe, a rack, any library model) are
WebGL heroes; diagrams, readings and the HUD stay SVG, pushed. Prefer these over the wow pass's SVG object and its
brackets-and-caps furniture for a hero moment.
- `H.hero3d(name, {rect, at, depth})` -> `{part(id, t), anchor(id, t, [fx, fy]), parts, asset}`: the 3D hero behind
  the HUD. The clip is the `holo_hero` preset (`runtime/three/presets/holo_hero.js`): a library model
  (`assets/models3d`) as projected light: Fresnel rims, its real edges, scan bands, a scan plane that builds it with a
  hot edge, a hot part, depth fog, a faint flicker and interlace from a seeded hash, a projector pad and beam with
  motes, real bloom and a slight red and blue fringe; glass stays see-through; brightness becomes alpha so it lays on
  the field as light. It arrives as `Loom.assets.hero3d[name] = {src, rect, dur, size, anchors}` and sits at the back
  of the mid layer (the stage under it, every panel over it). `part(id, t)` is a lock target and `anchor(id, t,
  [fx, fy])` a reading's leader end, from the part boxes the bridge exports (sampled every 0.1 s, interpolated). No
  clip: `holo_hero_missing`.
  - Declare it in the scene: `@lab {"hero3d": {"rack": {"rect": [x, y, w, h], "dur": 13, "fps": 12, "params":
    {"model": "server_rack", "opts": {...}, "yaw": -0.95, "turn": [t0, t1, radians], "build": [t0, dur], "elevation":
    14, "zoom": 0.8, "states": [{key, from, to, at, dur}], "hot": [{part, t0, t1}], "explode": {at, dur, parts},
    "look": {"parts": {part: token}, "xray": [parts], "bloom": [s, r, thr]}, "geo": true}}}}` (geo: the coastlines
    for `earth`).
  - In a lesson, put the same spec on the beat's storyboard scene: `{"beat": "b04", "kind": "bespoke", ...,
    "hero3d": {"rack": {"rect": [...], "dur": 9, "params": {...}}}}`; its times are seconds from the beat's start.
    Compose renders it through the clip store (`three_bridge.hero_cached`: keyed on the spec, the model file, the
    look module, the preset and the renderer, so a second compose takes it from the store in well under a second),
    copies it into the build and writes the static footage video HyperFrames seeks; the page finds it as
    `Loom.assets.hero3d["b04:rack"]`, and `R.part(id, t)` / `R.anchor(id, t)` take the lesson's own times. Verified
    in a HyperFrames MP4 (`docs/research/2026-10-16-style-stress/hologram_v2_composed.py`). A lesson hero renders at
    30 fps unless the spec says `fps`.
  - In the lab the page does the same from the scene's `@lab` header (`py -m loom lab`, `lab.strip(..., file=...)`).
    `three_bridge.hero(params, style, size, dur, fps, stills=...)` renders one clip or stills and its anchors. Cost
    (software GL): about 0.22 s a frame at 1000 x 880 (a 13 s rack at 12 fps: 35 s; at 30 fps: about 90 s, once).
  - `server_rack` names each unit (`unit1` at the top; the alert unit is `unit<alertUnit + 1>`); a hot or anchored
    group (`units`) covers the named parts inside it. `padR` sizes the pad; a long model (a bicycle) gets one sized
    to its length.
  - New models: `bicycle` (real proportions: frame, fork, wheels with 32 spokes, drivetrain, saddle, bar) and `earth`
    (Natural Earth coastlines, graticule, pins as parts pin0..pinN, arcs that draw on).
- `H.plane(name, {x, y, w, h, top, side, lit, fill, tone, label, depth, blur, at})` -> `{box, quad}`: a translucent
  sheet of light in slight perspective (`top` narrows the top edge, `side` shortens one side), one lit edge that
  blooms, a fine scan texture, out of focus on the far layer (the sheet only, never its label). No corner brackets.
- `H.reading(name, {x, y, w, label, value, unit, decimals, micro: [lines], size: "hero" | "major" | "minor", tone,
  align, to: [x, y], plate, at})` -> `{set(v, t)}`: the v2 typographic unit: a small sentence-case label (up to two
  lines), one large value in the display face with its unit small beside it, dim micro lines (a precision, a source,
  a time), and an elbow leader with a tick to the part it measures. The value rolls on its reveal.
- `H.tokens(name, {x, y, w, tokens, focus, gap, at, by})` -> `{top(i), box(i)}`: text pieces on a baseline with their
  index (t1, t2 ...), arriving left to right; the focus token is lit.
- `H.arcs(name, {points: {id: [x, y]}, links: [{from, to, w}], lift, strong, label, tone, at, by})`: weighted arcs
  (attention, dependencies): width and light grow with the weight, the strong ones bloom, a weight at or over `label`
  is written above its apex on a dark plate.
- `H.trace(name, {points: [[x, y], ...], at, dur, tone, pulse, label: {at, text, side}})`: the path a value takes (a
  token's state rising through the layers to the scores, a request through a system), a lit line that blooms, one
  pulse along it, an optional small label on a plate.
- `H.dist(name, {x, y, w, title, rows: [[label, p]], decimals, note, pick, at, by})` -> `{pick(i, t)}`: a measured
  distribution (0.618, not 62 %): hairline tracks with light bars; the pick lights and blooms on the word, its words
  turn ink, the note appears.
- `H.title(..., {caps: false})`: the kicker in sentence case, untracked.
- `H.light`: the filter urls (`halation`, `dof`, `scan`) for a scene's own line art. Never put words inside them.
- Lab: `docs/research/2026-10-16-style-stress/hologram_v2_rack.js`, `hologram_v2_bicycle.js`, `hologram_v2_earth.js`
  (WebGL) and `hologram_v2_llm.js` (SVG); before and after: `hologram_v2_before_after.jpg`.

**Shared**
- `H.frame(name, {x, y, w, h, tone, plate, hairline, at})` -> `{status(st, t), dim(t), undim(t)}`: the base of every panel.
- `H.callout(name, {to: [x, y], from: [x, y], side, text, status, w, maxLines, depth, at, until})` -> `{off(t)}`: a ring
  on the thing, a leader, a plate with the words. Give it `until` so annotations never pile up.
- `H.tag(E, parent, x, y, status, t, {word, w})`: a status pill with its word (used inside the pieces).
- `H.power(handle, "up" | "down", t)`: boot a panel open from a bright line, or close it to a line and a point.
- `H.flash(handle, t)`: one outline lift for 0.14 s, budgeted (below).
- `H.mode("analysis" | "briefing", t, {keep: [handles], dim})`: the register switch.

**Camera** (the place camera, `Loom.cam`, on the HUD's layers; far moves least, near most):
- `H.push({to: [x, y], scale, t0, t1})`, `H.pan({dx, dy, t0, t1})`, `H.pull({t0, t1})`;
- `H.through({to, scale, t0, t1})`: push THROUGH the near layer: it is gone within the first tenth of the scale, before
  the zoom can cut a near title mid-word at the frame edge, and comes back the same way on the pull;
- `H.orbit({deg, t0, t1})`: a 2.5D orbit, layers shifting against each other about the mid layer (at most 10 degrees).

The engine marks the HUD `data-bleed` from the first camera move until a pull returns to the whole frame, so a lean-in's
deliberate crop is declared to the film check.

## 3. The rules it already keeps (do not re-implement them)

- **Depth by elevation:** near pieces have a lighter plate, brighter lines and thicker strokes; far ones are darker and
  dimmer (pack `hologram.depth`). Put words on mid and near; the far layer is for a grid or a globe in the background.
- **Words on plates:** every word sits on a dark plate; text is `kit.text` (real metrics, checked against its box and
  floors). Labels are mono (JetBrains Mono), titles Space Grotesk, values in the display face.
- **The flash ledger:** at most three flashes in any one second for the whole film (WCAG 2.3.1); a fourth is moved later
  and warns `holo_flash_rate`. An alert turns on once and holds; it never blinks.
- **No idle motion:** after its reveals a piece is still. The tests prove a resting HUD draws identical frames.
- **One clock:** every continuous motion is computed from time by one clock; a piece that has nothing to change skips the
  DOM, so a resting HUD costs nothing per frame.
- **Glow is an enhancement:** a soft halo stroke under key lines (blurred where filters render); the HUD reads without it.
- **Sound:** none by default; `{sound: true}` on a lock gives one soft tick.
- **People:** the style has no designed hologram character kit yet. `ctx.character` with a full-colour rig in a HUD
  scene warns `holo_character_kit`; a rig made for the style declares `styles: ["hologram"]` in its definition and
  passes. The engine never draws people.
- **Status told twice everywhere:** `P.set` and `P.mark` (panels), `F.step` (flows), `B.mark` (bars) and tags all show
  the word with the colour; a link's status adds weight and glow, not only a hue.

## 4. Camera grammar in depth

| move | the call | what it says | use it for |
|---|---|---|---|
| hold the whole console | none | the system as one picture; the record | a briefing; a recap; the verdict |
| slow push (1.15 to 1.3x, 1.5 s or more) | `H.push` | "this part matters" | the briefing's one change; a section start |
| push through the near layer (1.4 to 1.7x) | `H.through` | leaving the summary for the inside | the switch into analysis onto a mesh or a globe |
| pan across the console | `H.pan` | following a request, a pipeline, a timeline | cause and effect across panels |
| 2.5D orbit (5 to 10 degrees) | `H.orbit` | "look at it from the side": the layers have depth | the moment the analysis is complete; reading a record |
| pull back | `H.pull` | back to the whole | after every lean-in, before a verdict |

Grammar: one move at a time; every move 1.2 s or more, eased; a push is always followed by a pull within the beat or the
next one; never two pushes in a row; no whips, no shakes, no continuous drift. A camera move starts about 0.3 s before
the word that motivates it. Inside a push, put the change (a lock, a status, a callout) after the camera has settled.

## 5. Beat recipes for common corporate topics

Each is a sequence of beats with its register; numbers and names come from the knowledge sheet.

**An incident in a SOC (security operations)**
1. briefing: title (the incident's question), 2 cards (what was hit, how many), a flow of the kill chain (4 steps).
2. analysis: readout (the auth log), mesh (the network), scanner (a host sweep): the scan finds it, `H.lock` names
   it, `H.through` onto the mesh; `M.set(id, "alert")` and `M.send` (the exfiltration path) on the words.
3. analysis, short: evidence row (`H.scrubber` of the timeline, `H.wave` with the anomaly, a gauge crossing its limit).
4. briefing: pull back; `LOG.push` the containment; a panel "Containment" with rows marked `ok`; the lock released.

**How an AI model is monitored in production**
1. briefing: title; cards (accuracy, drift, latency p95) with one read each; a flow of the monitoring loop with a packet.
2. briefing: the one change: drift crosses its threshold (`card.status("warn")`, `F.step(i, "warn")`).
3. analysis: `H.wave` (a feature's distribution over time with an anomaly), `H.gauges` USE for the serving fleet,
   a readout of alerts, `H.lock` on the drifting feature.
4. briefing: the decision (retrain or roll back) as a panel; the verdict card.

**A data pipeline health check**
1. briefing: a flow of the pipeline (ingest, validate, transform, load) with a packet; one card for freshness.
2. analysis: `H.mesh` of the jobs with traffic; `H.gauges` RED for the API at the end; the failing stage locked;
   `M.linkStatus` red on the broken edge; a readout of job runs.
3. briefing: the panel of checks (schema, row count, freshness) with `P.set` on the fixed one; pull back.

**A phishing campaign traced**
1. briefing: title; cards (delivered, clicked); the chain as a flow (email, click, fake login, sign-in try).
2. analysis: `H.mode("analysis")`; the globe boots (`H.power(G, "up")`) with arcs from the senders to HQ and traffic;
   a readout of senders; lock on HQ (`G.pointAt`); `H.through` onto the globe; a callout on the blocked relay.
3. briefing: `H.mode("briefing")`; the globe powers down; the containment panel. (Lab: `holo_lesson`.)

**A digital twin of a site**
1. briefing: the site as a grid layer (`H.grid` hex, far) with a mesh of its assets (pumps, lines, sensors) on mid;
   2 cards (output, uptime).
2. analysis: gauges on the critical assets (thresholds), a wave of one sensor, the scanner over the floor, a lock on
   the asset trending to failure; `H.orbit` 6 degrees to show the layers of the twin.
3. briefing: the maintenance decision as a panel; the asset's gauge `set` back to normal after the fix.

**Network and cloud operations, future-of-work briefings:** the same grammar: a mesh for topology, gauges RED/USE for
health, the globe for regions; for a future-of-work briefing stay in briefing almost entirely (cards and one flow), and
use one analysis beat for the system the change touches.

## 6. Density limits (the lesson is 5 to 10 minutes, not a 1-minute film)

- Briefing: at most 4 pieces, 3 cards in a row, 4 flow steps (5 in a column), 1 status change, 1 diagram, words on
  screen at most 25.
- Analysis: at most 7 pieces, 1 lock, 2 loops at once (a sweep, traffic, a wave or a spin), 1 camera move at a time,
  6 visible log rows, 6 mesh nodes with labels (up to 12 without), 3 globe points with labels, 3 arcs, 3 gauges.
- Per lesson: analysis at most 1 beat in 3; the globe at most twice; `H.orbit` at most twice; flashes only on locks.
- Every analysis beat ends with something kept (a status, a log row, a verdict) the next briefing beat can point at.

## 7. What the lab scenes show

`py tools/lab_preview.py holo_briefing --style hologram` (calm), `holo_analysis` (dense, scan, lock, mesh, push through,
orbit), `holo_lesson` (between registers, globe). Chrome: `py -m loom lab holo_lesson --style hologram`.
