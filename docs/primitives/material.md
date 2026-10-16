# Material and motif joins (D-114): torn, page, scroll, motif, handoff, fill

Runtime: `runtime/material.js` (`Loom.material`). Built by prim_c, 2026-10-06. Six new screen joins next to
`iris`, `wipe`, `dip`, `fade`. Like them, each is a cover drawn over the frame as a pure function of the join's
progress p; the camera jumps at p = 0.5 under a cover that is fully opaque from p = 0.42 to 0.58.

## Use from a storyboard

```json
{ "beat": "b07", "station": "lab", "join_in": { "type": "torn", "dir": "right", "seed": 4 } }
{ "beat": "b12", "station": "heart", "join_in": { "type": "motif", "shape": "heart", "from": [560, 520], "at": [1340, 540] } }
{ "beat": "b15", "station": "next", "join_in": { "type": "handoff", "to": "accent2", "from": "left" } }
{ "beat": "b20", "station": "card", "join_in": { "type": "fill", "box": [300, 330, 520, 380], "token": "accent" } }
```

`join_in.type` accepts the six kinds (schema enum, compose `JOIN_DUR` and `SCREEN_JOINS`); `join_in.dur` overrides
the default duration. Compose computes the join window exactly as for the other screen joins; world draws the cover
(`Loom.world.coverAt` delegates these kinds to `Loom.material.coverAt`).

| kind | default dur | parameters (in `join_in`) | what it looks like |
|---|---|---|---|
| `torn` | 0.8 s | `dir` (right, left, up, down; default right), `seed` (default 11), `token` (default field2) | a torn-paper matte with a seeded jagged edge and a slightly darker edge band crosses like a wipe; the trailing edge is torn too |
| `page` | 0.9 s | `corner` (br, bl, tr, tl; default br), `token` (default surface) | a sheet lands from the far corner with a curled flap, then peels from `corner` to reveal the new shot |
| `scroll` | 0.9 s | `dir`, `token` (default field2) | a paper band crosses with a rolled edge (cylinder shading) leading; it rolls away the same way |
| `motif` | 0.9 s | `shape` (circle, heart, hex, drop, leaf, cog, or an SVG path `d`), `from` [x, y] (default `at`), `at` [x, y] (default centre), `token` (default accent) | the shape grows from `from` (on the old shot) until it covers the frame, then a hole of the same shape opens on `at` (an iris of any shape) |
| `handoff` | 0.8 s | `to` (the token the next shot sits on; default field), `from` (an edge: left, right, top, bottom; or [x, y]; default the centre) | the next field colour grows in from the edge or point, then fades off the new shot |
| `fill` | 0.8 s | `shape` (a path `d` in screen px; or a named shape, or a `d` with `viewBox`, mapped into `box`), `box` [x, y, w, h], `at` [x, y] (growth centre; default the shape's fattest point), `token` (default accent) | a shape of the old frame grows until it fills the frame, then fades off the new shot; with only `box`, the box itself grows |

Shapes for `motif` and `fill` scale about their fattest inside point (pole of inaccessibility), so a heart grows
from its body, not its notch. A user `d` should be one closed outline; arcs (`A`) are measured as chords when the
runtime works out how far to scale (it scales 4% past the computed cover, and the frame is fully covered from 0.42
anyway, so an under-estimate can only show as a late snap, never as the camera jump).

## When to use, when not

- Name the meaning first (CINEMA_PLAN B7, lnd-motion-craft): a material join says "a new page of the story",
  "this tears open", "the next chapter". `motif` says "into this idea" in the topic's own shape. `handoff` and `fill`
  say "this becomes the ground of the next thing" (continuity of colour or shape).
- **Look families:** `torn`, `page`, `scroll` and `motif` read as cartoon material and suit `look_family:
  illustrated` packs (story-cartoon, flat-cosmos, glow-flat, whiteboard, cinematic-noir, cinematic-dawn).
  `handoff` and `fill` suit every family. Nothing switches on by pack: joins are chosen per storyboard, so an
  editorial pack may opt in per join.
- In editorial packs `field2` sits very close to `field` (corporate-clean: #EAF0F7 on #F4F7FB), so a `torn` or
  `scroll` matte barely reads there (see the corporate strip). Pass `token: "surface2"` or an accent if you opt in.
- `handoff`: the next shot must actually sit on `to` (draw its backplate in that token), otherwise the fade-off
  reveals the pack field and reads as a colour flash.
- `fill`: give the box (and shape) of a thing that is ON the old shot at that place, so the join starts as that
  thing. At p = 0 it paints only that shape.
- Durations: the existing screen joins run 0.8 to 1.1 s and these match. lnd-motion-craft says a transition in a
  narrated video stays near 400 ms; for a fast cut feel pass `"dur": 0.5` (every kind keeps its covered middle).
- Sound: `loom/narrate/mix.py` gives `wipe` and `iris` a whoosh; the new kinds get no sound yet (not wired).

## Runtime API (pure)

```js
const C = Loom.material.coverAt(kind, p, def, palette);   // {d, fill, opacity, layers}
// d, fill, opacity: the whole cover (fill may be url(#lmmat_...), a gradient the module adds to one hidden defs svg)
// layers: up to 3 shading paths drawn on top ({d, fill, opacity, stroke?, sw?}): page flap and fold shadow, roll shadow
const g = Loom.material.layerGroup(parentSvg);              // once, at build
Loom.material.drawLayers(g, C.layers);                      // every frame
Loom.material.DUR, .KINDS, .FAMILY, .SHAPES, .has(kind)
```

`scenes_examples/lab/lab_material.js` draws covers itself, exactly like `lab_joins.js`:

```js
const C = Loom.world.coverAt("page", p, { corner: "br" }, Loom.style.pack.palette);
cover.setAttribute("d", C.d); cover.setAttribute("fill", C.fill); cover.setAttribute("opacity", C.opacity);
Loom.material.drawLayers(layers, C.layers);
```

Messages: `Loom.error("join_unknown")`, `material_shape` (a shape that is neither named nor a path),
`material_fill_shape` / `material_fill_box` (a fill join without a usable shape: it degrades to a fade in the
token), `material_handoff_from`, `Loom.warn("material_token")` (an unknown colour token). Each is raised once.

## Wiring needed in `runtime/world.js` (not done: outside prim_c's edit scope)

`Wd.installCovers` draws only `{d, fill, opacity}`. The primary path alone is a complete cover (torn and scroll
carry their edge band and roll in their gradient fill), but the PAGE FLAP and the fold and roll SHADOWS are layers.
Two lines in `installCovers` draw them in lessons:

```js
const path = Loom.svg("path", { "fill-rule": "evenodd" }, sv);
const shade = Loom.material ? Loom.material.layerGroup(sv) : null;      // + D-114: material shading layers
...
path.setAttribute("d", C.d); path.setAttribute("fill", C.fill); path.setAttribute("opacity", Number(C.opacity).toFixed(3));
if (shade) Loom.material.drawLayers(shade, C.layers);                   // +
```

Until then a lesson's `page` join shows the sheet with a straight diagonal edge and no visible flap.
Also worth wiring (not mine): `loom/narrate/mix.py` (a paper sound for torn, page, scroll) and the gate warning
text in `loom/checks/gates.py` that lists the join kinds to vary.

## Determinism

Every cover is a pure function of (kind, p, def, palette): arithmetic only; the torn edge comes from
`Loom.rng(def.seed)` and does not change with p. The only side effect is idempotent: the first cover that needs a
gradient adds it, keyed by its content, to one hidden defs svg (not `display:none`: Chrome does not paint gradients
from a display:none subtree), so any seek order draws the same frame.

## Proven (tests/suites/primitives_material_footage_hands.py)

- `primitive_material_covered_mid_clear_ends`: each kind rasterised by cairosvg (independent of the browser) covers
  100% of the frame at p = 0.42, 0.46, 0.5, 0.54, 0.58 and paints nothing at p = 0 and 1 (fill: only its box at 0).
- `primitive_material_moves_between`: each kind is part way at p = 0.2 and 0.8 (no pop).
- `primitive_material_torn_seeded`: same seed same edge, another seed another edge.
- `primitive_material_tables_agree`: runtime `DUR`, compose `JOIN_DUR`/`SCREEN_JOINS` and the schema enum agree.
- `primitive_material_schema_accepts_and_rejects`, `primitive_material_storyboard_gate`: the schema and
  `loom.validate` (what `check_storyboard` runs) accept the six kinds and reject an unknown one.
- Lab strips looked at: `docs/styles/demos/lab/lab_material__story-cartoon.jpg`, `__corporate-clean.jpg`.

## Unverified

- The covers inside a full lesson render (compose, HyperFrames, MP4): only the lab and the node maths were run.
- The page flap and shadows in lessons (needs the wiring above).
- Arbitrary user motif paths with arcs or several subpaths (named shapes and a hand-written box path are tested).
