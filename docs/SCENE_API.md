# Loom scene API (the contract for bespoke scenes, templates and blueprints)

A scene is a function that builds SVG into its station and schedules tweens at ABSOLUTE times taken
from the narration. It runs once, at load, before the paused timeline is registered. Every frame is
then a pure function of time. A scale or rotation's `transformOrigin` (such as `"50% 50%"`) is measured once, as boot enters
that tween at its own start, so it means the element's drawing at that moment, whatever a renderer seeks first (L-289), and a seek that goes back arrives moving forward from the start, so it
draws the frame a fresh page draws (L-449).

```js
Loom.scene("b07", {                 // id = the beat id (or storyboard scene.scene)
  build(ctx, props) { ... },        // props = storyboard scene.props
});
```

## ctx

| member | what it is |
|---|---|
| `ctx.beat` | `{id, start, end, speech_start, speech_end, phrases:[{text,s,e,words:[{w,s,e}]}], pause_after}` |
| `ctx.start`, `ctx.end` | the beat's window on the timeline (seconds) |
| `ctx.speechStart`, `ctx.speechEnd` | when the narration of this beat starts and ends |
| `ctx.cue("words")` | the time those words are spoken (minus an 80 ms lead: emphasis leads, never lags). Resolved by compose: the words MUST be spoken in this beat, and the argument MUST be a string literal (compose reads anchors from the source; `ctx.cue(item.say)` is invisible to it and the scenes gate rejects it) |
| `ctx.has("words")` | whether a cue exists |
| `ctx.at(f)` | `speechStart + f * (speechEnd - speechStart)` (use sparingly: prefer cues) |
| `kit.fit(str, {role, w, h, maxLines, weight, tracking})` | MEASURE without drawing: `{size, lines, width, height, fitted}` with the real font metrics. Size a card to its words before drawing it: `h = fit.height + 2 * inset`. `check` fails text that leaves its box, its element or its card's inset (`docs/LAYOUT.md`) |
| `m.draw(kit.arrow(...), t, {dur, headAt, headDur})` | pass the WHOLE arrow result: the shaft draws and the head lands at `headAt` (0.9) of the draw. Passing `a.path` draws the shaft only |
| `ctx.use(id, params, {x, y, name, exit, parent})` | reuse a library COMPONENT (small element) instead of redrawing it; returns `{el, parts, p}`. See `docs/COMPONENTS.md` and the Components section of `runtime/catalog.md` |
| `ctx.el(name, {x, y, w, h, kind, exit, parent})` | create an ELEMENT: `{outer, mover, life, inner}` groups. Draw into `E.inner` in LOCAL coords (0..w, 0..h) |
| `ctx.group()` / `ctx.shift(g, dx, dy)` | build a block, measure it, then move it (e.g. vertical centring) |
| `ctx.held("name")` | take over an element of the PREVIOUS scene on the same station (it does not re-enter: held). It is shared: removing what the earlier beat drew in it is an error (`held_content_removed`), hiding it at load does nothing (a warning); add children revealed at your time, or exit it and create your own under a new name |
| `ctx.motif("name", {x, y, scale})` | create a world-level object that can travel between stations |
| `ctx.adopt("name")` + `ctx.travelTo(E, {x, y, scale}, t, dur)` | move a motif into this station during the join |
| `ctx.kit` | drawing primitives (below) |
| `ctx.m` | motion vocabulary (below) |
| `ctx.style` / `ctx.c("token")` | style pack; colour tokens (`"none"` or `"transparent"` mean no colour, e.g. `fill: "none"`) |
| `ctx.box` | the safe area `{x:96, y:84, w:1728, h:846}` (bottom 150 px is the caption band) |
| `ctx.station` | `{id, svg, w, h}`; station coords are 0..1920 x 0..1080 |

`kind` is a semantic role (`text`, `card`, `node`, `connector`, `value`, `character`, `instrument`,
`scenery`, `bubble`, `icon`, `token`...). `exit` chooses how it leaves at the next join when it is not
held: `recede` (default), `wipe` (text blocks), `displace` (panels), `collapse` (grown bars), `iris`
(round things), `sink`, `advance` (openers), `none`.

## kit (all colours are TOKENS: field, field2, surface, surface2, ink, muted, line, accent, accent2, accent3, accent4, pos, neg)

- `kit.text(parent, str, {role, x, y, w, h, align, valign, maxLines, color, weight, size})` - fits with
  REAL font metrics to the largest size in the role's range; never below the floor (overflow = build
  error). Roles: display, hero, title, lead, body, label, caption. Returns the `<text>`; `t.__fit` has
  `{size, lines, width, height}`.
- `kit.kicker(parent, str, opts)` - caps label with tracking (<= 4 words).
- `kit.rect / kit.card / kit.pill (parent, x, y, w, h, {fill, r, stroke, shadow})`
- `kit.disc(parent, cx, cy, r, {fill})` - shaded per style (crescent / paper / sketch / flat)
- `kit.line(parent, x1, y1, x2, y2, {stroke, sw, dash})`, `kit.path(parent, d, {...})`,
  `kit.arrow(parent, x1, y1, x2, y2, {bend, stroke})` -> `{path, head}`, `kit.polygon`
- `kit.mark(parent, "yes"|"no", cx, cy, size)` - tick/cross (shape AND colour)
- `kit.icon(parent, lucideName, {x, y, size, color})` - any Lucide icon name
- `kit.peep(parent, member, emotion, {x, y, size, flip, cloth, skin})` - Open Peeps character busts:
  members woman, man, girl, boy, elder_woman, elder_man; emotions neutral, happy, surprised, explaining
- layout: `kit.row(box, n, gap)`, `kit.col(box, n, gap)`, `kit.split(box, frac, gap)`, `kit.inset`,
  `kit.place(E, x, y)`, `kit.vcenter([[E, h], ...], top, bottom, gap)`
- `Loom.th.iconDisc(ctx, parent, cx, cy, r, icon, fillToken, iconToken)`; `Loom.style.pickTokenOn(fill)`
  returns the text token with the best contrast on that fill.

## motion (m.*) - every call takes an absolute time `t`

Entrances: `reveal`, `settle`, `pop`, `stamp`, `drop`, `converge {from}`, `grow {axis:'y'|'x'}`,
`draw` (strokes draw along their paths; use on a path or an element), `unmask {dir:'ltr'|'ttb'}`,
`iris`, `assemble`. Values: `count(textEl, t, {from, to, dur, fmt})`, `typewriter`, `along(E, pathEl,
t, {from, to, dur})` (value travel on a path), `travel(E, t, {x, y, scale})`. Emphasis: `highlight(textEl,
t)`, `emphasis(E, t)` (ONE per scene). Ambient: `drift(E, t0, t1, {amp, period})` (period-locked).
Exits: `m.exit(E, t, kind)` (the engine does this for you at joins).

**Travel puts the element's own (0, 0) at (x, y), scaled about that point** (L-166). On screen,
`x + scale * local`, whatever the element draws above or left of its origin. It is written as a matrix from one
progress value, so the frame is the same whatever was seeked before. Do not tween the same element's `mover`
with GSAP yourself; holds act on `life`.

**What the engine does with leavers** (L-164):
- An element carried away by a camera, travel, zoom or screen join is switched off once it is out of sight. A
  later beat that returns to its station finds the station empty unless it `held` or `adopt`ed the element.
- `exit: "none"` means no exit while the story continues. When the last beat that needs it ends on a cut or
  continue join, give it a real exit (`E.exit = "recede"`), or it stays under the next beat (L-165).

### Element life and framing (2026-10-07, bench fixes; `docs/research/2026-10-07-bench-fix-report.md`)
- **Every element lives only inside the beats that own it** (`Wd.planLife`, world.js). It is drawn from its
  beat's join (or its own earlier reveal) to the end of the join after the LAST beat that holds or keeps it, and
  is switched off (`display: none`) outside that window, whether or not it has an entrance or an exit. An element
  with no entrance no longer shows from t=0, and an unkept `exit: "none"` leaves with its beat. The window is in the
  report as `lifeT`; `check` fails an element without one. Not gated: motifs, the presenter, `E.persist = true`,
  and the scenery of a station declared `persistent: true`.
- **A thrown scene shows its own words.** When `build` throws, the beat draws a plain card of its narration (and
  the error is `scene_threw`); `render --force` refuses a build with a thrown scene (D-124).
- `ctx.held("Priya")` finds an element the previous beat drew as "priya" (case-insensitive, with a
  `held_name_case` warning), also when that beat itself held it. `ctx.el(name, {parent})` takes an element (`E`) or
  a group as its parent; anything else throws a message that names the beat.
- `m.travel` moves ONE element. Given an array (what `ctx.crowd` returns: travel each person) or nothing (a held
  element that is not there), it reports `motion_target` naming the beat, skips that move, and the scene goes on
  building. A thrown scene's fallback card is laid out inside the beat's own focus.
- `E.followers = [parts]`: parts that leave WITH their leader at its exit time (a page's lines and highlight bars).
- `m.draw` hides a filled path (an arrow head) until its stroke arrives.
- **Framing.** A template, blueprint, redtee or avatar beat lays out in the whole 1920x1080 frame: the runtime
  ignores `shot.focus` and `zoom` on it (`shot_framing_ignored` warning; the storyboard gate refuses it, D-125). A
  nested station's space is always one 1920x1080 frame; its `rect` sets its size, and a `w`/`h` on it is ignored
  (`station_size_ignored`) and refused by the gate. A focus on a bespoke beat must not crop what it holds.
- `ctx.fxMoment` keeps the rect in world coordinates and places it with the camera at its own time (it was placed
  before the camera existed, so stations away from the origin got a spotlight off screen that dimmed the frame).
- A character whose head or side leaves its station warns `figure_cropped`; `check` reports it per beat.
- A backplated template never blurs its own group, and a kept WORD element (or anything a template built) gets the
  full 0.94 veil, so the previous template's words do not print through.

Low level (for anything else): `Loom.tween(target, from, to, t, meta)` (always a fromTo),
`Loom.drive((e, raw) => {...}, t, dur, easeName)` (one progress drives many properties),
`Loom.tl.set(target, vars, t)` (discrete swaps, e.g. a character's expression). Easing names: enter,
move, editorial, overshoot, exit, linear.

## Rules (the gates check these)
- No `Math.random` (use `Loom.rng("seed")()`), no `Date`, no timers/rAF, no network, no `repeat: -1`.
- No literal hex colours: tokens only (a style pack must restyle your scene).
- Reveal ON the word (`ctx.cue`). Nothing after ~85% of the speech. Reveal order = narration order.
- One logical label = one `kit.text`. Text never inside filters.
- Semantic element names; stable across edits (tweaks and joins use them).

## Expressive motion (runtime/expressive.js) and simulated interaction (runtime/interaction.js)

| call | what it does |
|---|---|
| `Loom.spring({bounce, visual})` -> `{ease, dur}` | a closed-form spring: `visual` = perceived arrival (s), `dur` = settle time to give the tween. Bounce is clamped to 0 unless the style allows overshoot. Any entrance accepts `{ease, dur}` |
| `m.spring(E, t, {preset, dy, scale, from, sfx})` | arrive on a spring: presets `gentle` (bounce 0), `snappy` (0.15), `lively` (0.3) |
| `m.group(Es, t, {enter, order, stagger, maxTotal, parent: {E, enter}, each, per, sfx})` | orchestrated arrival: `order` forward, reverse, center, edges or shuffle (seeded). The parent arrives first. The whole group stays within 1.2 s. `sfx` sounds on the first and last members only |
| `m.groupExit(Es, t, {order, kind, parent})` | leave in reverse order (default), faster than arriving, then the parent |
| `m.shake(E, t)` / `m.nudge(E, t, {dx, dy})` / `m.press(E, t)` / `m.glow(E, t, {color, sfx})` | gestures on `E.life`: wrong, look here, tapped, payoff. Do not combine with `m.drift` on the same element |
| `ui.window(ctx, {name, x, y, w, h, title})` -> `{E, bar, body}` | an app frame with a title bar (colours are tokens) |
| `ui.field(ctx, parentE, {x, y, w, h, label, role})` | a text field for `m.typeInto` |
| `ui.button(ctx, parentE, {x, y, label, h, w, fill})` -> `{g, x, y, w, h, cx, cy}` | width measured from the label |
| `ui.toast(ctx, {name, x, y, text, icon, tone})` | sized to its words; bring it in with `m.toastIn(E, t)` (a spring and a success chime) |
| `ui.cursor(ctx, {x, y})`, `m.cursorIn(C, t)`, `m.cursorTo(C, x, y, t)` -> arrival time | a pointer on an arc, with a Fitts-like duration (station coordinates) |
| `m.tap(C, target, t, {x, y})` | pointer dip, target press, ripple and click; `target` is an element or a `ui.button` result |
| `m.typeInto(field, str, t, {cps, hold})` -> end time | human-paced typing, a caret on the clock, thinned key sounds |
| `Loom.sfx(kind, t, {g})` | a sound event: click, key, card, land, reveal, success, error, whoosh, pop, tick, chime. The check collects them and the mix tunes them to the music |

| `ctx.lottie(name, id, {x, y, w, h, at, speed, loop, colors})` | a Lottie animation (`assets/lottie/<id>.json`) as an element, seeked by the timeline; `colors: "auto"` maps its colours to the style's accents (runtime/lottie.js) |
| `ctx.fxMoment("light"\|"spotlight", t0, t1, [x, y, w, h])` | a timed shader moment in station coordinates: a light sweep across a payoff, or a spotlight that dims everything else (runtime/fx.js) |

Every word passed to these comes from the scene's props or the script (the sample-text rule still applies).
Beyond the page: `kind: "skia"` and `kind: "three"` scenes render to clips (see `docs/VISUALS_PLUS.md`), and
`kind: "page"` scenes render any page built on the approved libraries (maps, charts, diagrams, formulas, code, a
terminal, stroke lettering, morphs) to a clip (`docs/PAGE_CLIPS.md`, D-176).

| call | what it gives |
|---|---|
| `ctx.hit(id)` | seconds of a named hit of the lesson's timing grid (D-173): `"section:s2"`, `"beat:b07"`, `"join:b07"`, `"cue:b07:the signal"` (a cue's hit is its word minus the 0.08 s lead, the same instant `ctx.cue` gives) |
| `ctx.bar(t, dir)` | the music's bar line nearest `t` (`dir` 0), the next at or after (1), or the last at or before (-1); every section starts on one |
| `ctx.onBeat(t, sub)` | `t` snapped to the nearest music beat (`sub` 2: half beats), so a motion lands where the music can accent it |
| `ctx.engine` | the style's engine api (D-175, `docs/styles/ENGINES.md`) when the lesson uses one: whiteboard (D-179), blueprint (D-183), isometric, hologram and screencast (D-185) have one; `get_style_pack` then carries `engine_text`, from `docs/styles/engines/<style>.md`; an error otherwise |
Lab scenes that exercise each call are in `scenes_examples/lab/`; render them with `py -m loom lab all`.

## Characters, depth and isometric (runtime/rig.js, depth.js, iso.js; D-59 to D-61)
Proven by `py -m loom lab lab_characters|lab_depth|lab_iso`. Every colour is a token; every frame is a
pure function of time.

### Characters
`const ava = ctx.character(name, rigId, {x, y, scale, skin, hair, top, bottom, shoe, flip, parent, pose, emotion})`
- `(x, y)` is where the FEET stand. Rigs: `ava`, `sam` (`runtime/rigs/people.js`, CC0, drawn by code), and the
  outlined cartoon people `pip`, `tess` and the grey crowd figure `extra` (`runtime/rigs/beans.js`, CC0; same
  poses, gestures and walk). Use `extra` for bystanders and crowds so they never compete with the cast.
- `ava.pose(name, t, {dur})`: idle, explain, point, wave, think, shrug, cheer, present (a spring, no overshoot).
- `ava.gesture(kind, t0, t1)`: wave, nod, shake, beat, shrug (additive, eased in and out).
- `ava.talk(t0?, t1?)`: lip flaps from this beat's narration word timings (vowels pick the mouth).
- `ava.emotion(e, t)`: neutral, happy, surprised, concerned, focused. `ava.look(dx, dy, t)`: gaze in -1..1.
- `ava.walk(t0, t1, dx, steps)`: dx in screen pixels (flip and scale are handled).
- Blink, breathing and a head sway run always. `skin` indexes `style.characters.skin`; `hair` indexes
  `characters.hair_colors` (natural colours, never the ink token) or names a token; clothes are tokens.
- `parent: layer` puts the character inside a depth layer, so it moves with the parallax.
- Front view only in v1 (walls: `docs/styles/WALLS_AND_NEEDS.md` s3).

### Scenery (sets that fill the frame)
`const room = ctx.scenery("room" | "stage" | "street", name, o)` -> `{E, floorY, w, h}`
- `room`: `{window, windowX, door, doorX, frame, frameX, shelf, shelfX, wall, floorFill, floor}`; `stage`:
  `{spotX, curtain, light, back}`; `street`: `{sky, ground, lit, seed}` (blocks from a seeded spread).
- `Loom.scenery.desk(parent, x, floorY, w, {monitor, screen})` and `Loom.scenery.sign(parent, x, y, w, h, text,
  {role, fill, post})`: put the number or the rule ON a prop in the set, not beside it.
- `ctx.crowd(name, {x, y, w, count, rows, scale, tone})`: grey extras in rows (seeded, deterministic).
- `ctx.narrationCard(name, text, t, {ground, color, role, cps})`: the black turn card, typed in at `t`; returns
  when the line is complete.
- Everything is drawn through `kit`, so the pack's shading applies (toon outlines, sketch, line, flat).
  Measured reason: `docs/research/2026-10-01-visual-study.md` (reference frames are drawn on 30 to 50%).

### Depth stage (2.5D)
`const st = ctx.depth(name, {dolly: [t0, t1], push, drift, lift, focus, dof, atmosphere, cx, cy})`
- `st.sky(top, bottom)`, `st.glow(x, y, r, token)` (bloom), `st.ridge(z, points, token, {rim})`,
  `st.cone(x, y, w, len, token)` (a light cone), `st.haze(z, top, token)`, `st.layer(z)` (draw anything),
  `st.tone(token, z)` (the colour a token has at depth z).
- z: 0 is far, 1 is near. Near layers move more; layers away from `focus` blur; far layers tone toward the
  field (aerial perspective). Keep text OUT of the stage: titles do not ride the dolly.
- Pair with `cinematic-noir` or `cinematic-dawn`, and `fx` for grain and vignette.

### Isometric
`const iso = ctx.iso({x0, y0, unit})`
- `iso.box(name, x, y, z, w, d, h, {fill, icon})`, `iso.tile(name, x, y, w, d, {fill, z})`,
  `iso.grid(name, x, y, w, d, step)`, `iso.arrow(name, [x,y,z], [x,y,z])` (draw with `m.draw(E.path, t)`,
  reveal `E.head`), `iso.label(name, x, y, z, text, {lift, role})` (the pill hugs its text).
- Call `iso.done()` once, after building: it sorts back to front (painter's order).
- A box's three faces come from ONE token (top as is, left and right darker). In sketch and line styles
  boxes become outlines. Build boxes with `m.grow(box, t)` (they extrude up).

### Glow kit (runtime/glow.js; D-78)
the procedural pieces of the saturated flat register (`glow-flat`). It works in
any pack: glow-only tokens (`glow`, `deep`, `violet`, `plum`, `core`) fall back to standard ones elsewhere. Pass a
token to `kit` through `Loom.glow.token(t)` so it falls back too. Builders that take `ctx` accept `o.parent` (build
into one shot of a multi-shot scene).
- **Grounds and light:**
  - `G.ground(ctx, name, {bloom, bx, by, br, fields, fieldTones, floor, dust, t0, t1})`: a graded field, a
    radial bloom, big soft colour fields, near hills, twinkling dust.
  - `G.shafts(ctx, name, {n, opacity, lean, t0, t1})`: light from above.
  - `G.glowDisc(p, cx, cy, r, token, {rings, spread, opacity, core})`: a glow made of translucent rings, no
    filters.
- **Shapes:**
  - `G.blob(p, cx, cy, r, {fill, seed, lobes, wobble, gloss, glow})`: an organic gloss shape.
  - `G.blobPath(...)` and `G.smooth(points)` for your own.
- **Pressure:**
  - `G.burst(ctx, name, {x, y, r, layers, spikes, t, t1, spin})`: a jagged radial burst that pops at `t`.
  - `G.vortex(ctx, name, {x, y, rings, colors, core, t0, t1, speed})`: turning jagged rings.
  - `G.orbit(ctx, name, {x, y, icons, tones, r0, pull, t0, t1})`: props on gloss discs, spiralling in.
- **Life (loops, all period-locked):**
  - `G.crackle(p, cx, cy, {rx, ry, n, len, t0, t1})`: electric bolts along a silhouette, hidden before `t0`.
  - `G.sparkles(p, {x, y, w, h, n, t0, t1})`.
  - `G.idle(E, t0, t1, {bob, sway, breathe, period})`: on `E.life`, so it never fights an entrance.
  - `G.swarm(ctx, name, {kind: fish | mote | cell, n, area, size, drift, t0, t1})`.
- **Labels and states** (the one change that carries the point, on the word):
  - `G.pill(p, x, y, text, {tone, role, point: [x, y]})`: sized to its text.
  - `G.stat(ctx, name, text, {from, x, y, t, tone})`.
  - `const hud = G.hud(ctx, name, {x, y, title, icons, tone})`, then `hud.dim(i, t)` and `hud.light(i, t)`.
  - `const cmp = G.compare(ctx, name, {left, right, leftTone, rightTone, y, w, h})`; draw into `cmp.L.g` and
    `cmp.R.g`, then `cmp.value(side, text, t)`.
  - `const gg = G.gauge(ctx, name, {x, y, h, n})`, then `gg.move(frac, t, dur)`.
- **Examples:** `scenes_examples/lab/lab_glow_inside.js`, `lab_glow_pressure.js` and `lab_glow_world.js`.
- **Without a browser:** `py tools/lab_preview.py <scene> --style glow-flat` gives an approximate strip (no blur, no
  WebGL, estimated text widths). The Chrome render is the truth.

### Treatments: the essentials in the lesson's own form (runtime/treat.js; D-80, D-81)
The lesson's design seed
(`py -m loom seed <id>`, `style.seed` at runtime) names one treatment per axis, and these builders draw in it. Use
them for every label, speech or thought bubble, panel, icon-as-object and tick or cross: bespoke versions ignore the
seed, and the variety ledger counts them as the classic look. `as: "<treatment>"` forces one for one call.
- **Builders:**
  - `T.label(ctx, name, {x, y, text, to: [px, py], tone, role, t})`: pill, tag, ribbon, underline, stamp or flag.
    The lead to the part is its own element (`name.lead`), drawn first. A flag's pole stands upright on `to`.
  - `T.bubble(ctx, name, {x, y, w, text, tail: [sx, sy], kind: "speech" | "thought", fill, maxLines, t})`: round,
    comic, cloud, note, chat or wobble. A thought always trails puffs.
  - `const P = T.panel(ctx, name, {x, y, w, h, title, fill, tone, t})`: card, paper, glass, frame, cutout or bare.
    Draw content into `P.inner` inside `P.content` ({x, y, w, h}). Colour text with `P.ink` when it is set.
  - `T.badge(ctx, name, {x, y, icon, size, tone, t})`: disc, bare, tile, duotone, ring or seal.
  - `T.mark(ctx, name, {x, y, size, kind: "yes" | "no", on: P, t})`: disc, box, brush or stamp. `on: P` keeps the
    mark legible on the panel's colour.
- **Helpers:**
  - `T.enter(E, t, role)`: the seed's entrance family for that role.
  - `T.outline(x, y, w, h)`: a silhouette in the seed's shape language.
  - `T.body(g, d, fillToken, box)`: fill it with the pack's shading.
  - `T.texture(g, d, box, hex, key)`: the seed's texture.
- **Example:** `scenes_examples/lab/lab_treat_essentials.js`.
- **To see every seed:** `py tools/lab_preview.py lab_treat_essentials --style glow-flat --seeds` (no browser), or
  `py -m loom lab lab_treat_essentials` (Chrome, every seed in every listed pack).

### Objects: things drawn as things (runtime/objects.js; D-83)
Use one for anything the narration names that is
a thing, instead of a hero-size stock icon. The seed picks the family; the object follows the seed's shape
language and the pack's shading. It never draws words or digits of its own: pass `state.label` if it needs one.
- **Calls:**
  - `Loom.obj.draw(ctx, name, kind, {x, y, size, tone, detail: 1-3, family, state, t})` returns an element;
  - `Loom.obj.shape(g, kind, cx, cy, size, o)` draws into a group (props, places).
- **Kinds and their families:**
  - document: sheet, clipboard, stack;
  - envelope: flap, airmail;
  - calendar: wall, tearoff, desk;
  - clock: wall, alarm, square;
  - phone: slab, classic;
  - laptop: laptop, monitor;
  - folder: tab, binder;
  - package: box, crate, parcel;
  - building: tower, house, institution;
  - heart: organ, symbol;
  - bulb: bulb, spark;
  - lock: padlock, shield.
- **States:**
  - document `{stamped}`, envelope `{open}`, folder `{open}`, lock `{open}`, bulb `{on}`, building `{lit}`;
  - calendar `{mark: i, cross: i, label}`, clock `{time: hours}`, phone `{ping}`, laptop `{screen: "chart"|"text"}`;
  - motion: heart `t0`/`t1` beats; clock `t0`/`t1`/`turns` passes time; phone `pingAt`.
- **Icons and seeds:** `Loom.obj.forIcon(lucideName)` maps an icon to its object. In a seeded lesson,
  `Loom.treat.badge` and the templates' icon discs draw the object for icons of 100 px or more.

### Places and the camera (runtime/places.js; D-84)
A motion beat should happen somewhere.
- **Places:** `const P = Loom.place.office|inside|server|meeting|warehouse(ctx, name, o)` returns
  `{E, layers: {far, mid, near}, anchors, floorY, look}`.
  - The anchors are frame points: office `desk, screen, wall, stand, calendar, clock, shelf`; inside `focus,
    vessel, wall`; server `rack, row, stand`; meeting `screen, table, seatL, seatR`; warehouse `pallet, shelf,
    stand`.
  - Put a character in a layer with `parent: P.layers.mid.g`.
  - The seed sets the wall tone, the floor pattern (planks, tiles, dots, speckle), the trim and, unless `side` is
    given, the side.
- **Camera:**
  - `Loom.cam.push(P, {to: [x, y], scale, t0, t1})`, `Loom.cam.pan(P, {dx, dy, t0, t1})` and
    `Loom.cam.pull(P, {t0, t1})` move the layers at their depths (parallax);
  - one place, many moves, played one after another;
  - the camera is a pure function of time.
- **Example:** `scenes_examples/lab/lab_places.js`.

### Drawn sets from the library (runtime/sets.js, loom/sets.py; D-152)
A designed place (Claude Design) from `assets/sets/<world>/<scene>/<set_style>.svg`, on the same place camera.
- **Ask for it in the storyboard:** `"set": "office/meeting_room"` (exact id, optionally `/<variant>`) or
  `"set": {"want": "a meeting room where ..."}`. Words load a set only when they contain the scene's whole name or an
  alias (packs/worlds/<world>.json), name the world when the name is shared, and the set exists in the lesson's own
  set style. Anything else is refused at the storyboard gate with the reason (`py -m loom sets find "<words>" --style S`).
- **Draw it:** `const R = Loom.place.set(ctx, "room")` (the beat's storyboard set) or `Loom.place.set(ctx, "room",
  "office/meeting_room")` (a literal id). It returns `{E, layers: {far, mid, near}, anchors, slots, floorY, card}`:
  - anchors are the set's own points in frame coordinates (meeting room: `floor_y, stand_screen, seat_near,
    table_top, screen_centre`); put a character in a layer with `parent: R.layers.mid.g`;
  - `const S = R.slot("screen")` gives `{g, x, y, w, h}`: draw the screen's content in `S.g` at (0, 0, w, h); it
    rides the screen's layer with the camera;
  - `R.relight(setup, t0, dur)` cross-fades to another light setup the set carries (`R.card.setups`);
  - `Loom.cam.push/pan/pull(R, ...)` as for any place.
- **Words over a set:** put overlay text on a solid panel (`kit.rect` then `kit.text`), never on bare brick or glass.
- **Example:** `scenes_examples/lab/lab_set_meeting_room.js` (strip in `docs/styles/demos/lab/`).

### Under a seed, kit primitives follow it too (D-82)
- `kit.card` draws the seed's panel treatment (text-safe: paper and cutout become a textured or hard-shadowed
  card);
- `kit.mark` draws the seed's mark;
- pass `{classic: true}` to keep the old form for one call.

### Vendor art (runtime/art.js; D-88)
Free, licence-checked illustration sets, placed by reference `set:name`.
- `Loom.art.place(ctx, name, "fluent:hot-beverage", {x, y, size, colors, t, shadow, parent})` makes an element
  with a contact shadow and the seed's entrance. `Loom.art.shape(g, ref, cx, cy, size, {colors})` draws into a
  group.
- `colors: "keep"` draws the art as made; `"auto"` maps each of its colours to the nearest token of the pack.
- **Literal references only:** compose embeds the art whose `set:name` appears as a quoted literal in the scene
  source. An array of literals works; `"fluent:" + name` does not. A missing reference is the `art_missing`
  error.
- Approved sets: `assets/vendor/SOURCES.json`. Search with `py -m loom art <words> [--set fluent]`. Fetch with
  `npm install` (Fluent) and `py tools/fetch_assets.py` (Open Doodles, Lukasz Adam, Kenney).
- Example: `scenes_examples/lab/lab_vendor_art.js`.

### Data as a picture, overlays on worlds, arrays (runtime/data.js; D-90, CINEMA_PLAN B3, B9, B10)
A number is drawn,
not carded; words name a thing that is drawn. Each records what it drew in `Loom.report.data`.
- `Loom.data.counter(ctx, name, {x, y, w, to, from, decimals, prefix, suffix, caption, t, dur})`: a big number that runs.
- `Loom.data.unitGrid(ctx, name, {x, y, w, h, n, cols, lit, unit: "house"|"person"|"dot"|"square"|fn, art, color, t, stagger})`:
  as many things as the quantity, lighting up in order.
- `Loom.data.barsOn(ctx, name, {x, y, w, bars: [{label, value, color, note}], unit, title, max, t})`.
- `Loom.data.dipLine(ctx, name, {x, y, w, h, values, labels, base, mark: {i, label}, title, t, dur})`: the line
  draws itself; the event is marked, with its label on the open side.
- `Loom.data.profile(ctx, name, {x, y, w, h, before: [[x, y]], after: [[x, y]], ticks: [{y, label, color, guide}], t})`.
- `Loom.data.tag(ctx, name, {x, y, text | lines, color, textColor, t})`: solid tags that wipe in.
- `Loom.data.chapter(ctx, name, {kicker, title, sub, t, dur})`: a chapter sting OVER the world (dims it).
- `Loom.array(ctx, name, {x, y, cols, rows, dx, dy, draw(g, i, r, c, rnd), order: "row"|"col"|"random"|"centre", skew, seed, t, stagger})`:
  one thing becomes many, each seeded.
- Example: `scenes_examples/lab/lab_data.js`, `lab_world.js`.

### Real geography (runtime/geo.js; B4)
Natural Earth 1:110m, public domain, embedded only when a scene uses it.
- `Loom.geo.map(ctx, name, {x, y, w, h, bounds: [lonW, latS, lonE, latN], graticule, land, sea, flood: [{c, color, t, dur}], cities, t})`;
  `E.project(lon, lat)` gives station pixels.
- `Loom.geo.globe(ctx, name, {cx, cy, r, lon0, lat0, spin, land, sea, flood, arcs: [{from, to, t, dur, color, lift}], t})`.
- `Loom.geo.city("London")` gives `[lon, lat]`. Countries are named by ISO A3 or by name (France and Norway are `-99`
  in Natural Earth: use the name). An unknown country is the `geo_unknown` error.
- Example: `scenes_examples/lab/lab_geo.js`.

### Hold and transform (runtime/hold.js; B8)
Keep the shot, change it. Holds act on the element's `life` group (L-166).
- `Loom.hold.lift(ctx, lidE, t, {dy, dur, fade})`: a cutaway lid rises off.
- `Loom.hold.heat(shapes, t, {from, to, dur, attr})`: recolour everything drawn in `from` to `to`.
- `Loom.hold.peel(ctx, [outer, ..., inner], t, {gap, scale, dur})`: layers grow past the camera one by one.
- `Loom.hold.breathe(E, t0, t1, {amp, period})`: a slow breath while it holds.
- Example: `scenes_examples/lab/lab_hold.js`.

### Object recipe and ink shades (kit; B5)
`kit.disc(..., {shade: "recipe"})`, `kit.rect(..., {shade: "recipe"})`: edge,
rim, body, light pool, gloss (best on dark or neon packs). `{shade: "ink"}`: a flat fill and an ink outline (the paper
look). Opt-in per call, or a pack's `shape.shading`. Example: `scenes_examples/lab/lab_shades.js`.

### Screen joins (world.js; B7)
`join_in: {type: "iris"|"wipe"|"dip"|"fade", at, from, dir}`, or `join_in.meaning`
(`into`, `time`, `era`, `meanwhile`, `shock`) and compose picks the join. A screen-space cover hides the change at
its middle, where the camera jumps; captions stay above it. `Loom.world.coverAt(kind, p, def, palette)` is the
pure drawing. Example: `scenes_examples/lab/lab_joins.js`.

### Finish (fx.js; B6)
Packs carry grain, vignette and now `paper` (a multiplicative print texture over the whole
picture). Neon and cinematic packs got a stronger vignette; editorial-paper and story-cartoon got paper.

### Imported characters (runtime/rigs/imported.js; D-93)
A Claude Design delivery becomes a rig with
`py tools/rig_import.py assets/incoming/<batch> --id <id>` (writes `assets/rigs/<id>.json`; its own check re-poses
every delivered pose and must match). Compose embeds a rig only when a scene casts it.
- `const maya = ctx.character("maya", "maya", {x, y (feet), scale: 0.42..0.5, pose})`.
- Poses (from the delivery): idle, neutral, explain, present, point, think, chin, listen, shrug, arms_crossed,
  worried, cheer, wave, thumbs_up, hand_over, lean, coffee, phone, type, sit. Sit and type need the scene to draw a
  chair or desk.
- `maya.emotion(e, t)`: neutral, listening, smile or happy, laugh, surprise, concern or worried, sad, doubt, focus
  or thinking, realisation, frustration, relief, pride. Quiet, the delivered expression shows. While she talks or
  blinks, composable eyes, brows and viseme mouths show.
- `maya.talk(t0, t1)`, `maya.gesture("nod"|"beat"|"wave"|"shrug"|"tilt", t0, t1)`, `maya.hold("hand_r", "point", t0, t1)`
  (any slot and drawing: hands, `thigh_l` "seated" ...).
- Deltoids and elbow folds pick their drawing from the arm's angle automatically.
- No walk cycle and no 3/4 view yet (the 3/4 parts exist in the delivery).
- Example: `scenes_examples/lab/lab_maya.js`.

## Real artefacts, the camera on an element, and the film checks (D-100, 2026-10-03)
Why: the step 7 lessons passed every gate and were rejected on sight (frame audit
`docs/research/2026-10-03-frame-audit.md`, L-172). These are general tools, none of them belongs to one lesson.

### UI artefacts (runtime/ui_artefacts.js; reference board `docs/references/ui/mail-chat-doc.md`)
Use these whenever
the lesson is ABOUT a message, an inbox, a chat or a page. Never grey bars where words should be.
| call | gives |
|---|---|
| `Loom.ui.mail(ctx, name, {x, y, w, h?, display?, subject, from: {name, address}, to, time, banner?, paragraphs, link?, button?, attachment?, report?, parent?})` | a reading pane, every word real; `A.parts`, `A.nodes`, `A.text` |
| `Loom.ui.inbox / chat / doc (ctx, name, {...})` | the list, the thread, the page |
| `Loom.ui.build(ctx, A, t, {gap, order, whole})` | the artefact builds in reading order |
| `Loom.ui.at(A, key)` / `Loom.ui.phrase(A, key, phrase, near?)` | a part's or a phrase's rect, in the parent's coordinates (`near` picks one occurrence, a single letter) |
| `Loom.ui.mark(ctx, A, key, phrase, t, {tone, opacity, near})` | a marker sweep behind those words, inside the part |
| `Loom.ui.card(ctx, name, {x, y, w, title, tone, icon, rows})` -> `C.add(i, key, value, t)`, `C.port(i)` | an evidence card sized for all its rows from the start |
| `Loom.ui.wire(ctx, name, from, to, t, {tone, hold})` | a lead from words to a card; `hold` sends it away once followed, so leads never pile up |
- Height hugs the content when `h` is omitted. `display` is the scale the artefact is SEEN at; type grows by 1/display
  within the pack's role ranges.
- `E.ui` holds the artefact object. A later beat that holds `E` gets everything back (`ctx.held("message").ui`).
- Start a lead at the artefact's edge, level with the words, never across the words after them.

### Camera on an element
`Loom.cam.frame(E, rect, t, dur, {margin, ease})` moves E's mover so `rect` (E-local)
fills the frame. It chains across held beats (E.__pos). Use it to follow writing down a page, then frame `{0, 0,
1920, 1080}` to pull back. Pick rects whose top edge falls between lines, so the frame never slices a line.
`Loom.drive(fn, t, dur, ease, {key})`: drives sharing a `key` (a push and its pull back) render only the first
start state at load.

### Props, scale and people
- `Loom.obj.shape(..., "laptop", ..., {state: {facing: "viewer" | "away" | "left" | "right" | "top"}})`: a screen
  faces its user. A top-down desk uses "top".
- `shadow: "wall"` hangs an object on the wall with a cast shadow.
- `O.REAL` and `O.px(kind, personPx)` give real sizes. Declare a hand-drawn object with `ctx.el(name, {real:
  "laptop"})` so the scale check sees it, and `hero: true` for a close-up.
- `ctx.crowd(...)` draws what the pack's `characters.extras` says ("people", "silhouette" or "none"). Give it
  `parent: place.layers.far.g` so the crowd stands in depth.
- `M.exit(E)` also takes `E.lead` and `E.followers`.

### Layering and joins (automatic)
- `H.lead` puts a template's title on screen within 0.6 s of speech (pack `pace.lead_s`).
- A template that continues over a drawn scene gets a backplate (`props.backplate: false` opts out).
- Annotations (text, cards, labels, tags) leave before a camera, travel or zoom move.
- A camera join between different worlds becomes the style's seam join (pack `seam_join`: cinematic styles fade, illustrated ones wipe in the camera's direction, editorial and technical ones cut; each pack's `join_note` says where transitions belong) unless `join_in.continuous: true`. Never a dip: black means a change of era (R-48, R-52). A dip or fade is fully covered only at its middle (about one frame), and a template after a cut or cover shows its first element at once.
- `icon_objects: true` in the storyboard turns hero icons into drawn objects; otherwise a template keeps one icon
  family.
- A chapter card holds the scene's reveals until it has gone (`E.after`).

### Film checks (loom/checks/film.py, run by `check`)
Thresholds come from `DEFAULTS`, overridable by the pack's
`pace`.
| check | level |
|---|---|
| empty frame while the voice speaks | error |
| sparse frame | warning |
| a beat that repeats the frame before it | warning |
| a reveal under a chapter or overlay | error |
| on-screen text under 18 px (after camera and scale) | error; under 26 px is a warning |
| visible words cut by the frame edge | error |
| an object over 2x its real share of a person beside it | warning |
- Exemptions are declared, never silent: storyboard `intent: hold | sparse | dark`; `data-bleed="t0-t1"` on an
  ancestor for a deliberate crop during that window; `hero: true` for a close-up.

### Look at the film
- `py -m loom strips <id> [--source mp4|build] [--beats b17-b21]`: 8 frames per beat and per join.
- `py -m loom strips <id> --beats b17-b21 --preview [--fps 6]`: a watchable MP4 of those beats from the build, with
  the mix. It is resumable: re-run until nothing is missing.

## Primitives from the TED-Ed study (D-114, 2026-10-06)
Full API, defaults, pack behaviour and what is unverified: `docs/primitives/<name>.md`. Lab strips:
`py -m loom lab lab_<name>` (`docs/styles/demos/lab/`). Every one is deterministic (one progress drives all
properties; seeded where random) and draws in tokens.

| primitive | call | use it for | look family |
|---|---|---|---|
| path morph | `Loom.morph.to(pathEl, toD, t, {dur, fill: [a, b]})`, `.chain(path, [d...], times)`, `.shape(kind, box)`, `m.morph` | one drawn shape becomes another (a cell becomes a coin); morph chains as joins | all |
| fill join | `Loom.morph.fill(ctx, name, {from: d, t, token})` | a shape grows to become the next field | all |
| stepped time | `Loom.stepped.on(E, {hz: 6})`, `.wrap(fn, {hz})`, `.ease(base, dur, hz)` | drawings that hold and jump on twos, threes or fours | illustrated by default; others need `force: true` |
| line boil | `Loom.stepped.boil(E, t0, t1, {hz: 8, amp})` | a hand-drawn outline that wobbles per step | illustrated by default |
| swap-in-place slot | `const s = Loom.slot(ctx, name, {x, y, w, h, frame}); s.show(content, t, {how}); s.sequence([...])` | hold the layout, change its state on the spoken word (`how`: swap, flip, slide, recolour, relabel, stamp) | all |
| magnifier | `Loom.magnify(ctx, name, {source, focus, at, zoom, t})` | a lens with a leader line on a detail | all |
| cutaway | `Loom.magnify.cutaway(ctx, name, {source, shape, reveal, t})` | open a window in an object to show its inside | all |
| data as objects | `Loom.data.stamp(...)`, `.pile(...)`, `.flood(...)` | a share as stamped units, a counter riding a pile, a glyph flood | all |
| material joins | storyboard `join_in.type`: `torn`, `page`, `scroll`, `motif` (`shape`), `handoff` (`to`), `fill` (`shape`, `box`) | joins that come from the material in the frame | torn, page, scroll, motif read as cartoon material; handoff and fill suit every family |
| footage layer (spike) | `Loom.footage(ctx, name, {src, x, y, w, h, trim, at, grade})` + storyboard scene `footage: [{name, src, trim, at, consent}]` | consented live footage graded in tokens, with overlays | all; real footage needs consent, downloads need Kshitij's approval |
| hands | `Loom.hands.enter(ctx, name, {pose, from, to, t})`, `.pose`, `.point`, `.place`, `.exit` | hands as presenters | designed families from `assets/hands/` (contract in its README); only the PLACEHOLDER set exists, which warns `hands_placeholder` |

Rules that come with them:
- A swap keeps the frame still: the old content leaves before the new arrives (`slot_too_fast` warns under the reading floor).
- Stepped time and boil are a hand-made texture: never on corporate and technical packs unless the lesson asks.
- A material join is a device: name it in the storyboard's `devices` and use one join material per lesson.
- Hands: no code-drawn hands (D-102). Until a designed family is imported, a lesson that uses `Loom.hands` shows the
  placeholder and the check warns.

## Libraries behind Loom wrappers: physics, real-media brush, AI orb (2026-10-08)
Each library is loaded only when a scene calls its wrapper (`loom/compose.py` VENDOR; the lab does the same), and
each is made a pure function of t: simulated or painted ONCE when the scene is built, then replayed by the
timeline. Research and verdicts: `docs/research/2026-10-08-motion-libraries.md`. Lab: `lab_physics`, `lab_brush`,
`lab_orb`; demo: `docs/styles/demos/2026-10-08_libraries_reel.mp4`.

| wrapper | call | use it for | notes |
|---|---|---|---|
| physics (Matter.js 0.20, MIT) | `const w = Loom.physics.world(ctx, name, {x, y, w, h, t, seconds, gravity, seed, walls, rest}); w.static({...}); w.body(name, {shape: "rect"|"circle"|"polygon", x, y, w, h, r, angle, at, vx, vy, spin, restitution, friction, density, chamfer, draw: (g, W, H) => ...}); w.run()` | things that fall, pile, collide, topple or roll where the motion is the meaning (a backlog piling up, a stack that topples, items sorted into bins) | world-local coords, bodies by their centre; the last quarter of `seconds` brings everything to rest (`rest: false` opts out); warns `physics_not_settled` and `physics_lost`; report `Loom.report.physics` |
| brush (p5.brush 2.2 standalone, MIT) | `Loom.brush.paint(ctx, name, {x, y, w, h, seed, scale, blend, layers: [{at, reveal: "wipe"|"fade", dir, dur, draw: (b, W, H) => ...}]})` | pencil, charcoal, marker and ink lines, watercolour washes and hatching; drawn in the order a hand would draw them | `b` is the p5.brush API in the layer's pixels (`set(name, colour, weight)`, `line`, `rect`, `circle`, `polygon`, `fill`, `fillBleed`, `hatch`, `noStroke` ...); colours via `ctx.c("token")`; `blend: "multiply"` on light paper (default), `"screen"` on dark fields; text stays `kit.text` |
| orb (thinking-orbs 0.3 engine, MIT) | `Loom.orb(ctx, name, {x, y, size, t, until, state, states: [{at, state}], tint, speed})` | the moments an AI assistant works: working, searching, solving, listening, connecting, weaving, composing, breathing, shaping | a motif for AI-literacy lessons, never decoration; tinted by a token; repainted from t on every seek |

Rules that come with them:
- Physics and brush are bakes: never call them per frame, and give each world or painting a `seed` when two in one
  scene must differ.
- A physics world is a device with a meaning (the backlog, the overload), not ambient motion; keep it under 30 bodies.
- Brush marks are art, not words: labels stay SVG text on top, so they stay sharp, sized and checked.

## Layout: the layout guard (runtime/layout.js; D-169, opt-in per lesson)
With the guard on (`py -m loom layout <id> on`), the engine moves labels, tags, stamps and badges clear of words, of
each other and of the frame edge, and pulls a text or card that crosses the frame edge back inside; it moves an element
only to a spot that is fully clear, and the snapshot names what it moved. Keep your x and y as you wrote them.
- Objects never move, and objects overlapping each other is never a fault (a mug on its table).
- Meant overlaps: `ctx.el(name, {..., overlaps: ["table"]})`, `T.label(ctx, name, {..., overlaps: ["mug"]})` (or `"*"`);
  a label put mostly on an object may stay on it.
- `{layout: "fixed"}` keeps an element where it is; `{layout: "flex"}` lets the guard move any element; `"edge"` only
  back inside the frame.
- `kit.text` grows a box too short for its words at the style's floor (a `text_box_grown` warning); `{strictBox: true}`
  keeps the box. A word wider than its box at the floor is still `text_overflow`: give it room or fewer words.

## The lesson kit (2026-10-08)
When two or more bespoke beats show the same made thing, the storyboard declares it once in `kit.parts` and one
kit worker writes `scenes/_kit.js` before the scenes (API path), or the Cowork author does (optional there):
`Loom.lesson = Loom.lesson || {}; Loom.lesson.<id> = function (ctx, parent, opts) { ...draw...; return handle; }`.
Compose loads the kit before every beat scene; a beat composes the part inside its own element:
`const E = ctx.el("signin", {...}); const s = Loom.lesson.signin_page(ctx, E.inner, {w, h}); s.setState("error", t)`.
The kit gate (`loom/checks/kit.py`): declared parts exist, deterministic, tokens only, no `Loom.scene` in the kit.

## The toolbox and the 3D model library (2026-10-08, D-137, D-138)
- **Which tool, when:** `docs/TOOLBOX.md` (Menu, then one section per tool: physics, brush, orb, three, skia). A
  storyboard scene names its tools in `tools`; the scene or clip worker is handed their sections.
- **3D models:** a `kind: "three"` clip loads ready objects with `await X.model(id, opts)` (phone, laptop, monitor,
  desk_set, server_rack, padlock, key, security_key, envelope, document, folder, id_badge, shield, cloud, building,
  globe, gear, bar_chart, credit_card, coin_stack, clock, lightbulb; the live list: `py -m loom models`). A model is
  driven only by its keys (`m.set("open", k)`), stands on y = 0, takes its colours from the style through roles
  (`opts.colors` overrides) and shows only the words passed in. The toolkit `X.kit` (`runtime/three/kit3d.js`) has
  `stage`, `arrive`, `sway`, `progress`, `spring`, `fitHeight`, `mat`, `rbox`, `extrude`, `lathe`, `face`, `drawUI`.
  Turntable sheets: `docs/assets/models3d/`; examples `scenes_examples/three/models_mfa.js`, `model_turntable.js`.

## Topic packs: recipes, moods, presets and device swaps (2026-10-08, D-139, D-140)
- **Recipes** (ready teaching moments on the library wrappers; every word, count and share is an input):
  physics `Loom.physics.sieve | sortIntoBins | contextWindow | inboxFlood | trainTestSplit | nextTokenDraw |
  biasedFunnel | priorityJar | redundancyTopple | puePour (ctx, name, opts)` (`runtime/recipes_physics.js`; each checks
  its stated outcome on the baked poses, `w.posesAt(p)`); brush `Loom.brush.redFlags | markup | sketchSystem | wash`
  (`runtime/recipes_brush.js`; marks only); orb `Loom.orb.toolLoop | retrieval | unsure | approval`
  (`runtime/recipes_orb.js`) and the new orb states `unsure`, `checking`, `paused`. Signatures and when to use each:
  `docs/TOOLBOX.md`. Lab scenes: `scenes_examples/lab/recipe_*.js`.
- **Moods for 3D shots:** `X.kit.stage(ctx, THREE, X, {mood})`; kit helpers `X.kit.flow` (particles along paths),
  `arrow3d`, `label` (a word plate; words from the caller), `temp` (cool to warm), `isDark`.
- **Presets:** a `kind: "three"` beat may name `three.preset` (`runtime/three/presets/<id>.js`, card on line 1) and
  give only params. `device_shot` shows a phone, tablet, laptop, monitor or desk_set with its screen(s) and moments on
  spoken words (`*_say`). `py -m loom device <id> <beat> <device> [--screen JSON] [--mood m]` (and the agents'
  `set_device`) swaps device, screen or mood after the storyboard, validated and logged.
  `model_shot` (D-147) shows one library model or set (`params.model`, its `opts`), drives its card keys on spoken
  words (`states: [{key, from, to, say, dur} | {key, before, value, say}]`, `run: ["t"]` for time-driven keys) and
  frames it by its projected vertices over the whole turn (`zoom`, `turn`, `yaw`, `elevation`, `mood`, `light`).

