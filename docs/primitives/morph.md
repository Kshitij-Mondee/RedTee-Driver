# Path morph (`runtime/morph.js`, `Loom.morph`)

D-114. Built 2026-10-06 by prim_a. One drawn shape BECOMES another: a cell becomes a coin, a circle becomes a map
outline, an icon grows into the next scene's field. This was the most-cited missing primitive in the 96-film TED-Ed
study. No library: the path maths is in the file.

## API

| Call | Returns | What it does |
|---|---|---|
| `Loom.morph.to(path, toD, t, o)` | end time | Morphs `path` from its current (last scheduled) shape to `toD`, starting at `t`. |
| `Loom.motion.morph(...)` / `m.morph(...)` | end time | The same call, as motion sugar. |
| `Loom.morph.chain(path, [d1, d2, ...], times, o)` | end time | A morph chain, one shape after another (a common cartoon join device). |
| `Loom.morph.fill(ctx, name, o)` | element `E` (`E.path`, `E.endT`, `E.field`) | FILL JOIN: a shape grows into the whole 1920x1080 frame in `o.token`. |
| `Loom.morph.shape(kind, box, o)` | d string | `rect` (`o.r`), `circle`, `ellipse`, `polygon` (`o.n`, `o.rot`), `star` (`o.n`, `o.inner`, `o.rot`). |
| `Loom.morph.reverse(d)` | d string | The same shape wound the other way. Use it to cut a hole: `shape(...) + reverse(shape(...))`. |
| `Loom.morph.path(parent, d, o)` | `<path>` | A morphable path drawn in the pack's outline habit (toon, ink, line and sketch packs get an outline). |
| `Loom.morph.fromElement(el)` | d string | `rect`, `circle`, `ellipse`, `polygon`, `polyline`, `line` or `path` as a path d. |
| `Loom.morph.interpolator(dA, dB, samples)` | `(p) => d` | The pure maths, with no DOM and no timeline. Tests use it. |
| `Loom.morph.parse(d)`, `prepare(dA, dB, o)`, `transform(d, matrix)` | | Lower-level helpers. |

`toD` and each chain entry may be a d string or a shape spec `{kind, box, ...}`, which `shape()` resolves.

### `Loom.morph.to(path, toD, t, o)` options

| Option | Default | Meaning |
|---|---|---|
| `dur` | `pack.motion.morph` if declared, else `S().dur("move") * 2.6` (about 0.9 s) | Seconds. |
| `ease` | `pack.motion.morph_ease` (a `Loom.ease` name) if declared, else `editorial` (slow in-out) | A morph is a move, so it eases in-out. A function or a `Loom.ease` name. |
| `fill` | unchanged | `[fromTok, toTok]`, or one `toTok` that continues from the path's current fill. Mixed on the same progress as the shape. |
| `stroke` | unchanged | The same, for the outline. |
| `samples` | 48 | Minimum segments per subpath. Raise it for detailed outlines such as maps. |
| `collapse` | `"partner"` | How an unmatched subpath shrinks or grows: `"partner"` uses the centroid of the nearest subpath on the other side, `"self"` uses its own centroid. |
| `from` | the path's last scheduled shape | Override the start shape. |
| `hz` | none | Step the morph at `hz` (hand-made time, see `stepped.md`). An element switched on with `Loom.stepped.on` steps without this option. |
| `name`, `content` | the target's name, `true` | Report metadata. |

`chain(path, ds, times, o)`: `times` is an array of start times (one per shape), or a single start time with `o.hold`
seconds (default 0.4) between morphs. `o.fills` and `o.strokes` are arrays with one target token per shape. Other
options apply to every step.

### `Loom.morph.fill(ctx, name, o)`: the fill join

| Option | Default | Meaning |
|---|---|---|
| `from` | required | A d string, a `{kind, box}` spec or a path element. Given a path element (for example one made by `Loom.morph.path`), the join takes over from it seamlessly: same place (its CTM is applied), same fill and outline, and the source is hidden while the join covers it. |
| `t` | 0 | Start time. Before `t` the fill shape is hidden. |
| `dur` | default morph duration x 1.25 | Seconds. |
| `token` | `field2` | The final field colour. **The next scene must start on this colour.** That is the author's job: give the next scene the same field token, or cut to it at `E.endT`. |
| `fromToken` | the source's fill | Start colour, as a token. |
| `bleed` | 8 | px past each frame edge, so no seam shows. |
| `ease`, `samples`, `hz` | as `to` | |

## How it works

Both paths are parsed into absolute cubic Bezier segments per subpath (`M L H V C S Q T A Z`, absolute and relative,
with arcs converted exactly at up to 90 degrees per piece). Each subpath pair is brought to the same segment count by
splitting the longest segment at its arc-length midpoint. De Casteljau splits are exact, so corners stay corners and
the end shapes are exact.

Winding is matched for the whole shape: if B's largest subpath turns the other way from A's, every B subpath is
reversed. B's holes therefore stay holes. Open or zero-area pairs try the reversed list and keep the cheaper one. The
start point is then aligned by the cyclic offset of B that minimises the total squared distance between
corresponding nodes. This choice does not depend on translation or scale.

Subpaths are matched by area order. An unmatched subpath grows from, or shrinks to, a point. At the end where it IS a
point it is left out of the string, so p = 0 is exactly A and p = 1 is exactly B. Every control point is interpolated
from one eased progress value through `Loom.drive`. Every call is recorded in `Loom.report.morphs`, and the drives
appear in `Loom.report.tweens` with kind `morph`.

## When to use it, and when not to

- **Use it** when the change of form IS the idea. Examples: a cell becomes a coin, one category becomes the next, an
  icon becomes the place the next scene happens in (fill join), or a morph chain carries a story across a join.
- **Do not** morph between unrelated shapes for decoration. A morph claims the two things are the same thing
  changing. Use a cut or a screen join otherwise.
- **Do not** morph text. Glyph outlines are not available as paths here; use a swap or a cross-fade.
- **Do not** hand-draw a fake morph from opacity cross-fades. This primitive exists so that does not happen.
- Shapes with very different detail, such as a circle and a coastline, need `samples` near the detailed shape's node
  count, or the coarse shape's points bunch up.

## Pack behaviour

The morph itself is general and works in every pack. `Loom.morph.path` follows the pack's outline habit: toon, ink,
line and sketch packs outline the path in `shape.outline` (or `ink`) at `shape.stroke`, and flat and gloss packs draw
no outline. The shape is always crisp: a sketch pack does not get a rough.js redraw of a morphing path. Pair it with
`Loom.stepped.boil` for a hand-drawn line. Optional pack fields are `motion.morph` (seconds) and
`motion.morph_ease` (a `Loom.ease` name). No pack declares them yet; this file only documents them. The fill join
is a cartoon join: storyboards for editorial or technical packs should prefer the existing screen joins unless the
change of form carries meaning.

## Example

```js
const box = { x: 760, y: 340, w: 400, h: 400 };
const p = Loom.morph.path(ctx.g, Loom.morph.shape("circle", box), { fill: "accent" });
const end = Loom.morph.chain(p, [{ kind: "star", box, n: 5 }, { kind: "rect", box, r: 48 }], [ctx.cue("w3"), ctx.cue("w7")],
  { fills: ["accent2", "accent3"] });
const F = Loom.morph.fill(ctx, "into_next", { from: p, t: end + 0.6, token: "ink" });   // next scene starts on ink
```

Holes: `Loom.morph.shape("polygon", box, { n: 6 }) + Loom.morph.reverse(Loom.morph.shape("circle", inner))`.

## Proof

- Lab: `py -m loom lab lab_morph` writes `docs/styles/demos/lab/lab_morph__story-cartoon.jpg` and
  `lab_morph__corporate-clean.jpg`. The strips show a circle becoming a star and then a rounded rect with the fill
  handing across three tokens, two discs merging into one bar, the bar becoming a hexagon ring as its hole grows, and
  the rect growing into an ink field that a title sits on.
- Tests in `tests/suites/primitives_morph_stepped.py`:
  - `primitive_morph_exact_ends`: checks the end shapes against independent Python geometry, within 0.5 px, and that
    star corners are kept.
  - `primitive_morph_subpaths_and_misuse`: checks subpath counts, the hole's winding, and that `morph_bad_path` is
    reported.
  - `primitive_morph_lab_renders_clean`: renders both packs with 0 errors and checks that frames are identical in
    either seek order.

## Still unverified

- Not yet used in a lesson. It is proven in the lab and in node only.
- Real-world paths (map outlines, Lottie or vendor art paths with hundreds of nodes) are untested. Large `samples`
  values have not been timed. Subdivision is O(N^2) per subpath at build time.
- Morphs between shapes of very different topology (three subpaths into five) have only the area-order rule. The
  pairing may not be the one an animator would choose. Pass shapes with the subpaths in the intended order and
  similar areas, or split the morph.
- Colour mixes in sRGB (`S().mix`, the same as `Loom.hold.heat`), so complementary tokens pass through a muddy middle,
  visible in the corporate-clean strip at 1.1 s. A perceptual mix would be a later improvement.
- The fill join hides its source with the `visibility` attribute. A scene that animates the source's visibility
  itself would conflict.
