# Data as objects: Loom.data.stamp, pile, flood (D-114)

Appended to `runtime/data.js` (the existing builders are unchanged). Built by prim_b, 2026-10-06. For merging into
`docs/SCENE_API.md` next to the D-90 data builders.

## What it is for

TED-Ed films rarely chart a share: they show the things. 37 of 100 people get stamped, a pile of coins grows while
its number runs, a crowd floods a square. These builders turn a share or a total into a count of objects.

**Use them** when the number is a quantity of countable things and the script states it. **Do not use them** for
rates, small differences between shares (two stamp grids at 37 % and 39 % read the same), or values that need
an axis (use `barsOn` or `dipLine`).

## API

```js
Loom.data.stamp(ctx, name, { x, y, w, h, n, cols, share, unit, t, gridT, stagger, token, off, offOpacity, sfx, exit })
Loom.data.pile(ctx, name, { x, y, w, h, unit, count, cols, from, to, decimals, prefix, suffix, role, t, dur, ease, label, token, color })
Loom.data.flood(ctx, name, { region: { x, y, w, h }, glyph, share, n, size, scale, origin, seed, t, dur, token, off, ghost, ghostOpacity, exit })
```
Each returns the element; `E.landed` is when the last unit has arrived.

### stamp
| option | default | meaning |
|---|---|---|
| `n`, `cols` | 100, ceil(sqrt n) | the grid (cells are square: min(w / cols, h / rows)) |
| `share` | 0.5 | stamped units = `round(n * share)`, in reading order (row by row) |
| `unit` | `"dot"` | `dot`, `square`, `house`, `person`, `coin`, `box`, or `(g, cellSize, fillToken) => {}` |
| `t` / `gridT` | `ctx.start + 1.2` / `t - 0.9` | the first stamp / the neutral grid's one calm reveal |
| `stagger` | min(0.09, 1.6 / stamped) | between stamps |
| `token` / `off` | `"accent"` / `"muted"` | stamped / neutral colour (`offOpacity` 0.5) |

A share that is not a whole number of units warns `stamp_rounded`: the picture then shows a different number
than the script says. Stamped units carry `data-loom-stamp="1"`.

### pile
| option | default | meaning |
|---|---|---|
| `count` | 24 | how many unit objects the pile ends with |
| `unit` | `"coin"` | coins stack as flat discs in a few tall stacks; any stamp unit draws as cells |
| `to`, `from` | required, 0 | the counter's end and start value (with `decimals`, `prefix`, `suffix`) |
| `t`, `dur`, `ease` | `ctx.start + 0.3`, 1.6 x pack `count`, `"move"` | one eased progress drives everything |
| `label` | none | a caption under the base |

The counter sits ON the pile and rises with its top. One progress drives the number, the counter's height and the
arrival of every unit: unit i lands when the eased progress passes (i + 1) / count, so the pile and the number never
disagree. Units fall a short distance (1.5 rows) so a unit in the air never crosses the counter.

### flood
| option | default | meaning |
|---|---|---|
| `region` | `{0, 0, 600, 400}` | the area to fill, in the station |
| `size` or `n` | 44 | glyph cell size, or the capacity to aim for (size = sqrt(area / n)) |
| `share` | 0.5 | filled glyphs = `round(capacity * share)` |
| `glyph` | `"dot"` | any stamp unit |
| `origin` | `"bottom"` | `"bottom"`, `"top"`, `"left"`, `"centre"` or `[x, y]` in region coordinates |
| `seed` | `"flood:" + name` | `Loom.rng` seed for the jitter and the uneven front |
| `t`, `dur` | `ctx.start + 0.4`, 2.4 | the front spreads at constant speed from the nearest to the farthest filled glyph |
| `ghost` | true | the empty capacity drawn faintly (0.18) so the share reads against the whole |

Filled glyphs carry `data-loom-flood="1"`.

## Report

Each records into `Loom.report.data` like the D-90 builders: `{ beat, builder: "stamp", name, values: { n, share,
stamped, unit } }`, `{ builder: "pile", values: { count, from, to, text, unit, label } }`, `{ builder: "flood",
values: { capacity, share, filled, glyph, seed } }`. A number check can hold `stamped`, `to` and `filled` to the
script.

## Pack behaviour

Units are drawn flat (`flat: true`, as unitGrid does), so every shading model keeps them legible at small sizes.
Durations come from the pack (`enter`, `count`). No overshoot: the stamp lands from 1.35x eased out.

## Example

```js
Loom.data.stamp(ctx, "share", { x: 110, y: 130, w: 600, h: 600, n: 100, cols: 10, share: 0.37, unit: "person", t: ctx.cue("thirty-seven") });
Loom.data.pile(ctx, "cost", { x: 820, y: 150, w: 320, unit: "coin", count: 36, to: 1200, prefix: "$", t: ctx.cue("cost"), label: "PER YEAR" });
Loom.data.flood(ctx, "crowd", { region: { x: 1250, y: 150, w: 560, h: 560 }, glyph: "person", share: 0.6, seed: 7, t: ctx.cue("most") });
```

## Proof

Lab: `py -m loom lab lab_data_objects` (story-cartoon, engineering), strips in
`docs/styles/demos/lab/lab_data_objects__*.jpg`. Tests: `tests/suites/primitives_slot_magnify_data.py`
(`primitive_stamp_lights_exactly_round_n_times_share`, `primitive_data_objects_record_their_values`).

## Still unverified

- The number-grounding check (`loom/qa.py`) was not changed and not run against these records: whether it reads
  `stamped`, `to` and `filled` as the numbers to ground is for whoever merges this.
- The lab's `report.json` (written by `tools/node/component_sheet.mjs`) does not include `report.data`; the tests
  read the live page instead.
- Very large floods (over a few hundred glyphs) were not timed for build cost.
- A pile with a non-coin unit is implemented but not shown in the lab.
