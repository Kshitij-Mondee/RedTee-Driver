# Stepped time and line boil (`runtime/stepped.js`, `Loom.stepped`)

D-114. Built 2026-10-06 by prim_a. Hand-made animation updates its drawings on twos, threes or fours: every 2, 3 or
4 frames at 24 fps, which is 12, 8 or 6 drawings a second (one every 0.083, 0.125 or 0.167 s). Motion that holds and
then jumps at that rate is the cheapest visible difference between hand-made and code motion. A line that boils,
redrawn slightly differently on each step, is the second.

## API

| Call | Returns | What it does |
|---|---|---|
| `Loom.stepped.ease(base, dur, hz)` | ease function (`.steps`, `.hz`) | Pure maths: progress is quantised to `n = round(dur * hz)` steps (at least 1), then passed through `base`. `base` is a function or a `Loom.ease` name. It is never pack-gated. |
| `Loom.stepped.on(E, {hz, force})` | hz, or 0 if refused | Every LATER tween or drive on `E`, or on anything inside it, steps at `hz`. This covers `m.reveal`, `m.pop`, `m.settle`, `m.travel`, `m.draw`, clip entrances, exits and `m.morph`, with no other change to scene code. |
| `Loom.stepped.off(E)` | | Later tweens on `E` are smooth again. Earlier ones keep their stepping. |
| `Loom.stepped.wrap(fn, {hz, force})` | `fn()`'s result | Every tween or drive CREATED inside `fn` steps, which suits a whole passage. |
| `Loom.stepped.boil(E, t0, t1, o)` | `t1` | Line boil on `E` between `t0` and `t1`. |
| `Loom.stepped.hzFor(node)` | hz, or 0 | The stepping rate in force for a node. |
| `Loom.stepped.allowed(o)` | bool | The pack gate (see below). |
| `Loom.stepped.defaultHz()` | number | `pack.motion.stepped.hz`, else 6. |

### `boil` options

| Option | Default | Meaning |
|---|---|---|
| `hz` | `pack.motion.stepped.boil_hz`, else 8 | Redraws a second (8 = on threes). |
| `amp` | `pack.motion.stepped.boil`, else 1.2 | Roughly the typical displacement in px (the filter scale is `4 * amp`). |
| `freq` | `pack.motion.stepped.boil_freq`, else 0.035 | Noise frequency. Lower values give longer, lazier wobbles. |
| `cycle` | 3 | The number of different drawings the boil loops through. 3 is the classic loop; 0 gives a new drawing on every step. |
| `seed` | `"boil:" + E.name` | Seed for `Loom.rng`, which picks the drawings. |
| `force` | false | Boil in a non-illustrated pack. |

The boil puts one `feTurbulence` plus `feDisplacementMap` filter on `E.life` (or on the node passed). The filter
region is set in user space from `E.w`/`E.h` (or `getBBox`) with a margin, so thin lines are never clipped away. A
`Loom.drive` over `[t0, t1]` picks the step from elapsed time and sets the turbulence `seed`. Outside the window the
filter is removed, so the line is clean.

## Pack behaviour

Hand-made time is an ILLUSTRATED register. `on`, `wrap` and `boil` act only when the pack's
`look_family === "illustrated"`, or when the call passes `{force: true}`. In an editorial or technical pack they warn
with `stepped_off_for_pack` and leave the motion smooth, so a scene written for `story-cartoon` restyles cleanly into
`corporate-clean`. `Loom.stepped.ease()` is plain maths and is not gated.

Optional pack field (no pack declares it yet; do not add it without the owner):

```json
"motion": { "stepped": { "hz": 6, "boil": 1.2, "boil_hz": 8, "boil_freq": 0.035 } }
```

It sets the defaults only. Declaring it does NOT step every tween in the pack: stepping stays a per-element or
per-passage choice, because a stepped camera or a stepped caption would read as a fault.

## How the switch works (and its limit)

`core.js` and `motion.js` are not edited. At load, `stepped.js` wraps `Loom.tween` and `Loom.drive` once. Every
`m.*` call reaches them by property lookup, so it goes through the wrapper.

- **Tweens:** if the tween's target is a registered node, or sits inside one (found by walking `parentNode`), or
  the tween is created inside `wrap()`, its ease is replaced by `Loom.stepped.ease(sameEase, duration, hz)`. GSAP
  string eases are resolved with `gsap.parseEase`, and a missing ease becomes GSAP's default `power1.out`.
- **Drives** carry no target. They are stepped when created inside `wrap()`, when `meta.node` sits inside a
  registered node (morph passes it), or when `meta.name` is a registered element's name. `travel`, `along` and
  `drift` pass the name.
- Stepped report entries in `Loom.report.tweens` get `stepped: hz`. Calls are listed in `Loom.report.stepped`.
- A drive opts out with `meta.nostep`, or with `meta.stepped` if it is already quantised (boil does this).
- **Limit:** GSAP eases see progress, not time. Steps are therefore `round(dur * hz)` equal slices of each tween,
  counted from that tween's own start. They are not on a global 24 fps grid, so two stepped tweens that start at
  different times step out of phase. This is invisible in practice, but it is not identical to animating on a frame
  grid.
- **Limit:** the wrapper only sees tweens created AFTER `on()`. Call `on()` before the entrances.
- **Limit:** a drive written by hand with neither `meta.node` nor a registered `meta.name` is not stepped by `on()`.
  Wrap it in `wrap()`, or pass `Loom.stepped.ease(...)` as its ease.

Time that lands exactly on a step boundary belongs to the LATER step. The quantiser adds 1e-4 of a step because
GSAP rounds time, and 1e-6 was not enough: t = 1.0 at 8 Hz fell in the earlier step in the browser.

## When to use it, and when not to

- **Use it** in illustrated packs on drawn things: characters' pose changes, props, hand-drawn diagrams, and a
  passage that should feel made by hand. Use boil on outlined shapes while a shot holds, so a held frame is never
  frozen.
- **Do not** step text that is being read, captions, data values being compared, or camera moves. The judder
  hurts reading.
- **Do not** step and boil everything. Pick the drawn layer and leave the type and interface smooth.
- **Do not** use it in editorial or technical packs unless the beat calls for a hand-made aside (`force: true`).

## Example

```js
const E = ctx.el("bean", { x: 300, y: 400, w: 260, h: 260 });
kit.disc(E.inner, 130, 130, 120, { fill: "accent" });
Loom.stepped.on(E, { hz: 6 });                 // on fours, illustrated packs only
m.pop(E, ctx.cue("w2"));                       // unchanged motion call: now steps
m.travel(E, ctx.cue("w5"), { x: 900 });        // the drive steps too
Loom.stepped.boil(E, ctx.cue("w2"), ctx.end, { amp: 1.4 });
// a passage: Loom.stepped.wrap(() => { m.reveal(A, t); m.draw(arrow, t + 0.3); }, { hz: 8 });
```

## Proof

- Lab: `py -m loom lab lab_stepped` writes `docs/styles/demos/lab/lab_stepped__story-cartoon.jpg` and
  `lab_stepped__whiteboard.jpg`. The same card and travel run smooth and on fours, beside the eased curve and its
  staircase, with an outlined shape boiling at 8 Hz and an x3 inset of its edge.
- Tests in `tests/suites/primitives_morph_stepped.py`:
  - `primitive_stepped_ease_holds`: values hold inside a step, jump at the boundary and reach 1.
  - `primitive_stepped_switch_and_pack_gate`: in node, `m.settle` on a switched element is stepped, an unswitched
    element is not, and a `wrap()` drive steps. The editorial pack refuses with a warning, and `force` opts in.
  - `primitive_stepped_lab_holds_in_frames`: real browser frames. Inside one step the stepped card and the boil are
    pixel-identical while the smooth card moves, and both change across the boundary.
- With `stepped.js` and `morph.js` replaced by empty placeholders, existing labs (`lab_springs`, `lab_hold`,
  `lab_joins`) render pixel-identical to their renders with these files. The hook does nothing when nothing is
  switched on.

## Still unverified

- Not yet used in a lesson or a full compose render. The boil filter's render cost over a long beat on the real
  HyperFrames pipeline is not measured. SVG filters are re-rasterised every frame, so a large boiled element may
  slow rendering.
- Boil on rough.js sketch shapes works in the lab (whiteboard), but stacking the two wobbles has not been judged by
  the owner.
- An element whose name is reused by another element in the same lesson would also step that element's drives
  (name registry). Elements should have unique names.
- The interaction with other wrappers of `Loom.tween` or `Loom.drive` added later by other files is untested. Each
  wrapper must call the one it replaced, as this file does.
