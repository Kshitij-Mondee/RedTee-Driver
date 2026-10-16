# Stage: scenes (Motion Designer / Scene Author) - Sonnet

Write the bespoke scene the storyboard specifies, as code, following `docs/SCENE_API.md`. Work the
`lnd-motion-choreography-loop`: consider three treatments, settle the timed beat sheet (the storyboard's
`design.beat_sheet` is your starting point, not a cage), stress-test it, then build and PROVE it.

## JavaScript scene (kind: bespoke) -> `scenes/<beat>.js`
```js
Loom.scene("b07", {
  build(ctx, props) {
    const { kit, m } = ctx;             // primitives + motion vocabulary
    const t1 = ctx.cue("draining");     // time the word "draining" is spoken
    const cup = ctx.el("memory_cup", { x: 760, y: 300, w: 400, h: 460, kind: "vessel", exit: "recede" });
    kit.rect(cup.inner, 0, 0, 400, 460, { fill: "surface" });
    m.settle(cup, ctx.start + 0.1);
    // ... value travel, reveals on cues, one emphasis
  },
});
```
- Timing comes ONLY from `ctx.cue("<spoken words>")`, `ctx.start`, `ctx.speechStart/End`, `ctx.at(f)`.
- Colours ONLY from style tokens ("accent", "ink", "surface"...). Durations from the style
  (`ctx.style.dur("enter")`) or the motion vocabulary defaults.
- Deterministic: no Math.random (use `Loom.rng("seed")`), no Date, no timers, no network, no repeat:-1.
- Every element you create goes through `ctx.el(name, {x,y,w,h,kind,exit})` with a SEMANTIC name, so the
  engine can hold it, travel it, or retire it at the join.
- Build grammar (lnd-motion-fit): scaffold before content; a connector draws INTO what follows; a value
  travels from its minimum; the reading is marked when it stops; totals last.
- Nothing arrives after ~70-85% of the beat's speech. One emphasis per scene. Text never below the type
  floors (kit.text enforces them and reports overflow as an error).
- **Measure, then draw.** Size every card, pill and bubble from its words: `const f = kit.fit(label, {role, w,
  maxLines})`, then `h = f.height + 2 * inset` (inset >= max(6, 0.2 x size)). Give `ctx.el` the true box of
  everything it holds (labels included). `check` measures the drawn glyphs and fails text that leaves its box,
  its element, or sits too close to its card's edge (docs/LAYOUT.md).

## Reuse and tag small elements (the element library)
- **Reuse first.** The Components section of `runtime/catalog.md` lists promoted elements. Use one with
  `ctx.use("id", { ...params }, { x, y, name })` instead of redrawing it. Adapt it with params, a `slots`
  entry, the returned `parts`, or a local `Loom.component.variant(...)`; never copy its code.
- **Tag what you build.** Above each small element you draw yourself (a card, a mark, a connector, a
  character bit; NOT the whole scene), write `// @form snake_id: one-line idea without this lesson's nouns`.
  Reuse an existing id from `library/FORMS.md` when the idea is the same, so uses add up. Do not tag
  elements you only hold from the previous scene. Tags are how the library decides what to promote.
- **Tag the beat's design once.** On the first line of the scene write `// @design snake_id: the beat's
  visual argument without lesson nouns` (reuse an id from `library/FORMS.md` when it is the same design).
  If the scene only extends the previous scene's held picture, use `<id>_continued` (not counted).
  Designs that recur become storyboard templates.

## Manim scene (kind: manim) -> `scenes/<beat>.py`
Subclass `LoomScene` from `loom_manim` (read its docstring in `runtime/manim/loom_manim.py`):
colours from `C.<token>`, timing from `self.wait_until("<spoken words>")`, params from `ctx.params`,
finish with `self.hold_to_end()`. The clip renders with a transparent background at `manim.rect` size.

## Tools a scene names (`tools` in its storyboard spec; docs/TOOLBOX.md)
Read the section of each tool the scene names before writing it: `physics` (`Loom.physics.world`), `brush`
(`Loom.brush.paint`), `orb` (`Loom.orb`) live inside a bespoke scene.

## Three.js clip (kind: three) -> `scenes/<beat>_three.js`
`export async function build(ctx, THREE, X)` returning `{scene, camera, update(t)}`. Start from the model library:
`const st = X.kit.stage(ctx, THREE, X, {light: "studio"})`, `const m = await X.model("phone", opts)`, then drive
the model only by its keys (`m.set("notify", X.kit.progress(t, ctx.cue("spoken words"), 0.7))`). The models, their
keys and turntable sheets: `py -m loom models` and `docs/assets/models3d/`. Colours only `ctx.c`/`ctx.hex` or roles;
words only from params. Example: `scenes_examples/three/models_mfa.js`.

A device beat that names `"preset": "device_shot"` has no file to write. Moods for 3D shots: `X.kit.stage(ctx, THREE,
X, {mood})` (cold_aisle, hot_aisle, machine_night, latent_space, clean_bench, warm_office, incident, blueprint_iso).
Physics, brush and orb RECIPES (ready teaching moments) are listed in docs/TOOLBOX.md.

## Skia clip (kind: skia) -> `scenes/<beat>_skia.py`
`from loom_skia import *` and `def frame(c, t)`; colours `C.<token>`/`paint(token)`, times `ctx.cue("words")`.
Example: `scenes_examples/skia/hero_orb.py`. One or two per lesson at most.

## Prove it
`py -m loom accept <id> scenes` (static gates) -> `py -m loom run <id> compose` -> `py -m loom snapshot
<id> --at <times>` and LOOK at the frames. Say what you checked and what is still unverified.

## Essentials, objects and places (D-80 to D-84)
- Labels, speech and thought bubbles, panels, icons-as-objects and ticks: `Loom.treat.*` (they follow the seed).
- A thing the narration names (a document, an envelope, a calendar, a clock, a phone, a laptop, a folder, a
  package, a building, a heart, a bulb, a lock): `Loom.obj.draw(ctx, name, kind, {x, y, size, state, t})`, never a
  hero-size stock icon.
- A place for the beat: `Loom.place.office|inside|server|meeting|warehouse(ctx, name, o)`, explored with
  `Loom.cam.push(P, {to, scale, t0, t1})` or `Loom.cam.pan(P, {dx, t0, t1})` in the seed's camera habit.

## Draw a world, densely (D-90; docs/styles/CINEMA_PLAN.md B12)
- Draw the storyboard's `subject` as a thing in its `world`. Words (pills, cards, tags) name what is drawn; they
  never stand in for it.
- A frame has three layers: a background WITH content (the place, its far props), the subject in the middle
  with parts (3 to 6 per object), and ambient secondary motion (dust, people, lights, steam, drifting camera).
  Repetition with variation makes scale (a hall of racks, a street of houses, a crowd): use `Loom.array`.
- Hold and transform: keep the composition and change it (grow, heat, peel, fill, count up) rather than
  cutting to a new layout inside the beat.
- Budget: the reference films measure about 7.5 lines of scene code per second; Loom lessons have measured
  2.8 (stress-signal) to 8.8 (blameless-postmortem). A 10 s beat of 30 lines is usually an under-drawn frame. `py -m loom variety` reports `lines_per_s`.
- The guardrails still hold: measured text, type floors, one emphasis, determinism.
- **The tools for it:**
  - `Loom.data.*` draws numbers as pictures and tags that name things; `Loom.data.chapter` sets a chapter over the
    world;
  - `Loom.geo.map` / `globe` draw real geography;
  - `Loom.array` makes one thing many;
  - `Loom.hold.lift` / `heat` / `peel` keep the shot and change it;
  - `{shade: "recipe"}` or `"ink"` shade the subject.

  See `docs/SCENE_API.md` and the lab scenes `lab_data`, `lab_geo`, `lab_world`, `lab_hold`, `lab_shades`.
