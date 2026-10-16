# Loom.magnify: magnifier inset and cutaway (D-114)

`runtime/magnify.js`. Built by prim_b, 2026-10-06. For merging into `docs/SCENE_API.md`.

## What it is for

Pointing at a detail without cutting away from the whole (a ring on the detail, a leader line, a round inset with
the detail magnified), and opening a window in an object to show its inside instead of cutting to a new picture.

**Use the lens** when the detail is too small to read at its real size but its place in the whole matters.
**Use the cutaway** when the inside of a thing is the point (a machine, a wall, a cell) and the outside should
stay on screen. **Do not use either** to enlarge text the scene could simply have drawn bigger, or for a detail
that needs a full scene of its own (use a nested station and a zoom join).

## API

```js
const mg = Loom.magnify(ctx, name, { source, focus: { x, y, r }, at: { x, y, r }, zoom, t, dur, ring, sw, backing, out, parent });
mg.exit(t)        // lens closes, leader retracts into the ring, ring fades; returns when all have gone
mg.E, mg.landed   // the element; when the lens has fully opened

const cw = Loom.magnify.cutaway(ctx, name, { source, shape, win, reveal, t, dur, edge, inside, rim, r, sw, out });
cw.close(t)       // the window closes (0.6x the opening)
cw.inside         // the group the inside is drawn in (station coordinates)
```

| lens option | default | meaning |
|---|---|---|
| `source` | required | an element (`ctx.el`) or an SVG group, NOT an ancestor of where the lens is drawn |
| `focus` | required | the detail, in the station's coordinates; `r` defaults to `at.r / zoom` |
| `at` | `{x: 1400, y: 400, r: 200}` | where the lens sits and its radius |
| `zoom` | `at.r / focus.r` | magnification |
| `t` | `ctx.start + 0.5` | the focus ring starts drawing |
| `dur` | pack `draw` + 1.2 x `enter` | the whole entrance; the three parts scale with it |
| `ring` | `"accent"` | token for the focus ring, leader and lens ring |
| `backing` | `"field"` | token behind the copy inside the lens |
| `out` | none | exit time (same as calling `mg.exit`) |

| cutaway option | default | meaning |
|---|---|---|
| `shape` | `"rect"` | `"rect"` (`win: {x, y, w, h}`), `"circle"` (`win: {x, y, r}`) or an SVG path `d` (`win` = its box, the centre of growth) |
| `reveal` | none | `(g, box) => {...}` drawing the inside in station coordinates, or an element / node to move inside |
| `source` | optional | the object being cut; the cutaway is placed straight above it in z order |
| `edge` / `inside` / `rim` | `"ink"` / `"surface2"` / `"shadow"` | the window outline, the inside fill, the recessed rim |
| `t`, `dur` | `ctx.start + 0.5`, 1.6 x pack `enter` | the window grows from its centre, eased out |

## How it works

- The lens holds an SVG `<use>` of the source, clipped by a circle and scaled about the focus point, so it is a
  LIVE copy: anything the source does (an entrance, a needle that turns, a recolour) is seen in the lens at the
  same moment. If the source sits deeper than `ctx.g`, its parent's static transform is copied at build time.
- Entrance order (connectors draw into what follows): focus ring draws, the leader draws from the ring into the
  lens, the lens irises open (starting as the leader arrives). Exit reverses it at about 0.6x: lens closes, leader
  retracts into the ring, ring fades.
- The `<use>` carries `data-loom-copy="1"` and never goes through `kit.text`: `Loom.report.texts` and the text
  audits do not count it, and the screen-text probe (`#lm-world text`) does not see into a `<use>`.
- The cutaway draws ON TOP of the object, clipped to the window shape: an inside fill, the reveal, a recessed rim,
  then an edge outline. One keyed drive scales the clip and the edge together from the window's centre.

## Report

`Loom.report.magnify[]`: lens `{ beat, name, kind: "lens", focus, at, zoom, t, landed, out }`; cutaway `{ beat,
name, kind: "cutaway", shape, win, t, landed, out }`. Errors: `magnify_no_source`, `magnify_self`. Warnings:
`magnify_overlap` (the lens covers its own focus), `magnify_twice`.

## Pack behaviour

Stroke width from `shape.stroke`; durations from the pack's `draw` and `enter`; an offset-shadow pack gets a lens
shadow; toon and ink packs get an outer ink ring on the lens. No overshoot anywhere, so the same grammar serves
illustrated and technical packs.

## Example

```js
const board = ctx.el("board", { x: 120, y: 300, w: 720, h: 520, kind: "object" });   // ... draw the board
Loom.magnify(ctx, "chip", { source: board, focus: { x: 250, y: 490, r: 50 }, at: { x: 1120, y: 330, r: 230 },
                            t: ctx.cue("chip"), out: ctx.cue("back") });
Loom.magnify.cutaway(ctx, "inside", { source: tankE, shape: "circle", win: { x: 1580, y: 780, r: 128 },
                                     reveal: (g) => drawGears(g), t: ctx.cue("inside") });
```

## Proof

Lab: `py -m loom lab lab_magnify` (flat-cosmos, engineering), strips in `docs/styles/demos/lab/lab_magnify__*.jpg`.
Tests: `tests/suites/primitives_slot_magnify_data.py` (`primitive_magnify_lens_is_a_live_uncounted_copy`).

## Still unverified

- Not used in a composed lesson yet: a lens on a station the camera moves, scales or leaves was not tried (the
  copy follows the source's own transforms, not the camera's, which should be right but is unmeasured).
- A source whose PARENT animates its transform after build is copied with the parent's build-time transform only.
- A source holding elements with `id`s referenced elsewhere (gradients, clip paths) renders through `<use>` as
  expected in Chrome; other renderers (the node SVG preview harness) were not checked.
- The cutaway with a path `d` shape is implemented but not shown in the lab.
