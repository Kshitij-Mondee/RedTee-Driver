# The blueprint engine: how a scene uses it (2026-10-16)

A lesson in the blueprint style has `ctx.engine`: a technical drawing drafted live on the cyanotype sheet, in the
drafting order an engineer uses, lettered in a single-stroke technical hand, with one quiet glowing nib at the
drawing head. Use it for every line, part, dimension, note and word on the sheet. Designed art (people, icons, devices)
is placed as before; the engine is for what a draughtsman would draw. People are never drawn with the engine: until a
designed blueprint character kit exists, a person is a Lucide icon (`kit.icon(E.inner, "user-round", ...)`) with a
lettered role beside it (style guide s8).

## Two registers: choose per beat
- **Detail** (a few beats of a lesson): how a thing is built or how a part moves. Parts in drafting order with centre
  lines, hidden edges and hatching, dimensions (live when a measure changes), balloons, a section line, a FIG
  rewrite into an exploded view, a stepping mechanism, the title block's verdict. Dense on purpose, and short.
- **Teaching** (most beats): explaining. Cards, connectors, one idea a frame, lettering large, card bodies printed
  quickly, a revision cloud for "this changed", a tracing overlay for "this is proposed", the general-notes column for
  the lesson's points. No dimensions unless a measure is the point.
A lesson moves between them like a person at a drawing table: explain on a calm sheet, lean in for the detail, lean
back. The lab scenes show both: `py -m loom lab bp_engine_teach --style blueprint`, `bp_engine_detail`.

## The calls
```js
const W = ctx.engine, D = W.sheet(ctx);                 // once per scene: the pen's schedule and its nib

// an element is where the drawing goes; draw into it in element-local px
const body = ctx.el("valve_body", { x: 420, y: 470, w: 560, h: 360, kind: "card", exit: "recede" });
let t = D.part(body, {                                   // drafting order: centre, paper + outline, detail, hidden, hatch
  centre: W.centre(-50, 180, 610, 180),
  outline: W.rect(70, 80, 420, 200),
  detail: W.circle(35, 70, 9),
  hidden: W.hidden([[0, 130], [560, 130]]),
  hatch: W.hatch([[250, 88], [310, 88], [310, 272], [250, 272]]),
}, { at: ctx.cue("the valve body") - 0.3, by: ctx.cue("bolted") + 0.3 });

const lab = ctx.el("valve_label", { x: 420, y: 880, w: 560, h: 50, kind: "text", exit: "wipe" });
t = D.letter(lab, "Gate valve, body", { role: "label", at: t });
```

**Drawing.** `D.draw(E, marks, {at, by | dur, pen, parallel, sound})` returns the time the pen finishes. `by` fits the
strokes so the drawing ends on a spoken word. `parallel: true` draws sheet furniture beside the pen (no nib; it never
waits and is never late). Catching up (2026-10-16): a run with no `by` that starts more than 0.1 s late (the pen was
busy) is drawn faster, at most 1.8 x, so one slow part does not push every later word further from its cue.

**`by` and `quick` on every annotation (2026-10-16).** `D.fig`, `D.balloon`, `D.dim`, `D.leader` and `D.notes` (its
title) take `{by}` (the whole call ends on that word: the window is shared by its runs) and `{quick: true}` (printed
beside the pen in a short window, `dur` to set it; it never waits for the pen). Dense sheets need them: three sheets of
the 2026-10-16 stress test took about 92 s because figures, balloons and dimensions could only go at the pen's own speed.

**Parts.** `D.part(E, {centre, outline, detail, hidden, hatch, paper}, {at, by, pen})`. Each closed outline is filled
with the sheet (paper) so what is behind it is hidden from the moment it starts; `paper: "surface"` gives a lighter face,
`paper: false` none.

**Lettering.** `D.letter(E, text, {role | size, caps, align, valign, maxLines, at, by, pen, quick, pace})`.
- Roles: title, lead, label, caption.
- `caps: true` for notes and title-block fields.
- `quick: true` prints it fast beside the pen (card bodies, notes).
- Pace (2026-10-16): with no `by`, the pen letters at the pace of speech, `pace` s a character (0.052 by default, a
  space 60 % of that), at any size. A seven-word phrase of 44 characters letters in 2.16 s (3.2 words a second); it
  took 3.6 s as a label and 4.5 s as a lead before. `pace: 0.08` letters more deliberately.
- A hyphen is a short stroke (`on-call`); a real minus sign (U+2212) keeps the long one. Mixed-case words are set
  without extra letter spacing (capitals keep 0.08 of the size); `track` overrides.

The words are also on the page as text the checks read.

**Marks (element-local px):**
- Lines and outlines: `W.line`, `W.path(points)`, `W.polygon(points)`, `W.rect`, `W.roundRect`, `W.circle`, `W.arc`,
  `W.ellipse`.
- Drafting conventions: `W.centre(x0,y0,x1,y1)` (chain line), `W.hidden(points)`, `W.phantom(points)` (a cutting plane,
  or another position of a part), `W.centreMark(cx,cy,r)`, `W.hatch(polygon, {angle, spacing})` (parallel section lines).
- Shapes: `W.gear(cx,cy,r,teeth)`, `W.cloud(x,y,w,h)` (revision cloud), `W.arrow(x0,y0,x1,y1)` (flow, filled head).

Weights: `{weight: "outline" | "detail" | "thin" | "hair"}`.

**Annotations:**
- `D.dim(E, x0,y0,x1,y1, {off, side, value, unit, text, ends: "arrow"|"tick", at, by, quick})` returns
  `{t, set(value, at, dur)}`: a live figure counts to a new value as a part moves. With `by`, the lines take 55 % of the
  window and the figure the rest.
- `D.balloon(E, n, cx, cy, {to: [x, y], at, by, quick})`: a numbered balloon on a leader that ends on the part with a
  dot. `quick` suits a row of balloons while the pen drafts the next part.
- `D.leader(E, points, {note, noteSide, at, by})`.
- `D.section(E, x0,y0,x1,y1, {label: "A", look, at, by})`.

**Figures, the record and the sheet:**
- `D.fig(E, "Fig. 1", {sub, at, by, quick})` returns `{next(label, sub, at, {by, quick})}`: the old label struck
  through, the next lettered in its place. The sub-title sits a clear gap (0.4 of the size, at least 8 px) under the
  double underline (2026-10-16: the second rule used to touch the sub-title's capitals).
- `D.titleBlock(E, [[label, value], ...], {at})` returns `{fill(i, value, at, pen), stamp(text, {tone, at, x, y, w,
  rotate})}`. The labels are printed with the frame; the pen letters the values. `fill` on a field that has a value
  replaces it (the old one fades, 0.2 s): SHEET 2 OF 3 becomes 3 OF 3. The stamp is the verdict: one colour, once. Its
  box is measured from its lettering (2026-10-16: "APPROVED" overflowed); a `w` narrower than the word grows, with
  `bp_stamp_grown`.
- `D.revisions(E, {at})` returns `{add(rev, desc, date, at)}`: change control as a table.
- `D.notes(E, {title, lines, at, by, quick})` returns `{add(text, at)}`: a general-notes column (`by` / `quick` on its
  title; the notes themselves print quickly unless `lettered: true`).
- `D.border(E, {cols, rows})`: the sheet's border with its zone references, drawn in parallel.

**Motion:**
- `D.explode([{el, dx, dy}], {at, gap, dur, back, backGap})`: parts leave in turn and return.
- `D.extrude(E, polygon, {depth, angle, at, turnAt, dur, from, to})`: projection as a camera; a flat face gains depth.
- `D.step(E, {cx, cy, step, every, from, to})`: a mechanism stepping like an escapement.

**Teaching:**
- `D.card(E, title, {body, index, at, by, pen})`.
- `D.connect(E, x0,y0,x1,y1, {elbow, points, label, labelAt, labelSeg, labelSide, labelGap, at, by})`. The label
  sits on its own line (2026-10-16; it used to float at the path's midpoint plus an offset): beside the point `labelAt`
  (0 to 1 along the path, 0.5 by default) or beside the middle of segment `labelSeg` (an index, or "first", "last",
  "longest"); above a horizontal run and right of a vertical one unless `labelSide` says "below" or "left"; `labelGap`
  px clear (8). Its box is the size of its lettering. `labelDx` / `labelDy` nudge it; a call that gives only those
  (no labelAt, labelSeg or labelSide) keeps the first version's place, so older scenes do not move.
- `D.cloud(E, x,y,w,h, {rev, revAt, revGap, at})`: the delta triangle sits off a corner (`revAt` "ne" by default,
  "nw", "se", "sw") and moves out along the diagonal until it clears the scallops by `revGap` px (8).
- `D.overlay(E, {tag, at, lift})`: a tracing sheet; draw the proposal into its element.

## The look and the objects (the wow pass, 2026-10-16)

Kshitij, after the stress test: "The cool factor and the wow factor ... feels like it's gone" (diagnosis and plan:
`docs/research/2026-10-16-wow-hologram-blueprint.md`). Render with the pack's paper on: `"fx": {"background":
"cyanotype", "vignette": 0.32}` in a lab header (a lesson takes the pack's fx).

- **The look is on by default:** `W.sheet(ctx, {glow, occlude, paperAlpha})`.
  - `glow` (true): every element's marks sit in one ink group with a faint two-pass bloom; the nib glows.
  - `occlude` (true): a part's paper is translucent (`paperAlpha`, 0.3 on the field, 0.6 on a card's surface), so the
    sheet's mottle and creases show through it. What is behind it is hidden by a mask instead: the lines of an element
    lower in the page lose the part's shape from the moment its paper is down.
  - A mask is still. While a part moves (an explode, a travel, a mechanism) or after it leaves, its holes close and its
    paper turns 0.9 solid.
  - Cost, measured on 12 stress frames: about 0.3 s more a frame (6.3 s look off, 10.1 s on; the bloom is about two
    thirds of it). `glow: false` saves most of it for a long lesson.
- `D.extrude(E, face, {ratio | depth, angle, at, by, turnAt, dur, from, to})`: the face is drafted flat, then grows depth
  (`ratio` 0.35 of its size by default, 0.5 at most reads as an object).
  - The visible side faces are shaded (the upper one lit, the others in shadow) and edged in the outline weight.
  - The unseen back edges are hidden lines.
  - Convex faces read best. `D.lastSolid` reports the faces.
- `D.mechanism(E, parts, {at, by, rps, dir, from, to, step})` returns `{t, omega, groups}`.
  - Parts, in the order the motion passes: `{gear: [cx, cy, r, teeth]}` or `{pulley: [cx, cy, r]}`.
  - Each after the first has a `link`: `"mesh"` (the other way, by the tooth ratio), `"belt"` or `"chain"` (the same way,
    by the radius ratio; drawn, its links run at the rim speed) or `"shaft"`.
  - `icon: "fan"` on a part traces a Lucide icon on the wheel that turns with it.
  - Gears share one pitch (tooth depth 0.45 of it, with backlash) and are phased to interleave. Place a meshing pair at
    `r1 + r2 - 0.85 x depth` (about 13 px for 30 px teeth); `bp_mesh_fit` warns otherwise.
  - Drafting order: wheels, then belts and chains behind them. `step: {every, ease}` makes it step like an escapement.
  - Vocabulary for drawings: `W.shaft(x0,y0,x1,y1,r)`, `W.pulley(cx,cy,r)`, `W.belt([x,y],r1,[x,y],r2)`,
    `W.gear(..., {mesh: true, depth})`.
- `D.icon(E, "server", x, y, size, {at, by, dur, pen, weight, parallel})`: a Lucide icon traced by the pen in the
  drafting line.
  - Parsed with no DOM (paths with curves and arcs, rects, circles, lines), so the Node preview and Chrome agree.
  - The name must be a string literal so compose embeds it; an unknown name is `bp_icon_unknown` and draws nothing.
  - `W.icon(...)` gives the marks.
- `D.hero(E, shape, {at, by, tone, light, shadow, shadowAlpha, glowAlpha, draw, another})`: the one real thing on a
  sheet.
  - Its outline is drafted, then it gains a volume (one gradient lit from `light`, -135 = top left), a soft glow in its
    tone, and a shadow (`shadow: [dx, dy]`, false for none) that falls across the lines under it. It hides what is
    behind it.
  - `draw: false` adds the volume to a part already drafted.
  - A second hero on one sheet warns `bp_hero_twice` unless it says `another` (a new figure).
- `D.camera(sheetEl)` returns `{establish(t, dur), close(rect, t, {cut | dur}), track(points, t, dur, {zoom}),
  pan(rects, t, dur, {hold})}`.
  - Needs the whole drawing inside one element (`parent: sheetEl.inner` on every part). Built on `Loom.cam.frame`, and
    the nib draws inside the sheet so it moves with it.
  - A camera between two sheets or stations (a zoom-through, a cut to the next sheet) is the storyboard's `join_in`, not
    this: that belongs to planning.
- Lab scene: `docs/research/2026-10-16-style-stress/blueprint_wow.js`. It shows a close-up on the chassis extruding,
  the processor as the hero over the board, a belt drive and a gear train turning, traced icons, then the whole sheet.

## The rules it already keeps (do not re-implement them)
- **One nib for the film,** never two; on top of its station; it hops between strokes and fades when the pen rests.
  A call that asks to start while the pen is busy starts when it is free (`bp_pen_late` above 0.3 s). Plan the order
  as a draughtsman would: what the narration names first, its annotations after.
- **On the word.** Start a part about 0.3 s before its cue and give it a `by` just after the cue.
- **Line hierarchy and conventions** come from the vocabulary; colours are pack tokens (cyan for the named part, amber
  for figures, coral or mint for a verdict, muted for the narrow lines).
- **No sound by default;** `sound: true` on one draw gives one short pen sound, and on a stamp one thump.

## Density (the lesson is 5 to 10 minutes, not a 1-minute film)
- **Detail register:** at most 1 beat in 3, at most 7 parts and 4 dimensions on a sheet, and 1 moving part at a time.
- **Teaching register:**
  - 3 to 5 cards, and each card's body at most 2 lines;
  - one connector label a frame;
  - the notes column at most 5 notes;
  - a revision cloud or an overlay at most once a section.
- **Carry the sheet:** keep the drawing on its station across beats (`keep` / `ctx.held`) and let the camera lean in for
  the detail and back out for the teaching.
