# The whiteboard engine: how a scene uses it (D-179)

A lesson in the whiteboard style has `ctx.engine`: one hand writes everything on the board, in order, in a clean
single-line marker hand, finishing each part on its spoken words. Use it for every line, box, arrow, mark and word
on the board. Designed art (people from `kit.peep`, kit parts, icons) is placed as before; the engine is for what a
marker would draw.

## The calls
```js
const W = ctx.engine, B = W.board(ctx);                 // once per scene

// make an element with ctx.el (its box is where the drawing goes), then draw into it in element-local px
const card = ctx.el("ticket", { x: 140, y: 650, w: 380, h: 150, kind: "card", exit: "recede" });
let t = B.draw(card, W.roundRect(0, 0, 380, 150, 16), { at: ctx.cue("open ticket") - 0.35, by: ctx.cue("open ticket") + 0.3 });

// words: laid out in the element's box (wrapped and shrunk to fit), written stroke by stroke
const words = ctx.el("ticket_words", { x: 170, y: 672, w: 320, h: 106, kind: "text", exit: "wipe" });
t = B.write(words, "Open at 6 pm", { role: "lead", at: t, by: ctx.cue("six") + 0.4 });

// a heading: the pack's display face (Caveat 700), revealed under the hand as it writes along it
const head = ctx.el("zone_quick", { x: 240, y: 230, w: 520, h: 80, kind: "text", exit: "wipe" });
t = B.heading(head, "Quick wins", { role: "lead", size: 56, at: ctx.cue("Quick") - 0.3, by: ctx.cue("Quick") + 0.5 });

// the one accent of the scene, and the only place a sound is worth it
B.draw(circleEl, W.ellipse(420, 120, 400, 92), { at: ctx.cue("circle it"), pen: "accent", sound: true });
```
- `B.draw(E, marks, {at, by | dur, pen, speed, sound})` returns the time the hand finishes. `by` (or `dur`) fits the
  strokes into the window so the drawing ends on a spoken word; without it the hand draws at its own pace.
- `B.write(E, text, {role | size, align, maxLines, at, by, pen})`: roles title, lead, body, label, caption. Too much text
  for the box shrinks to the role's floor, then warns (`wb_text_floor`): give it a bigger box or fewer words.
- `W.icon("lightbulb", x, y, size)`: a Lucide icon (any of the 1,993 in `assets/icons/lucide.json`) as marks the hand
  draws stroke by stroke: its outline first as its designer ordered it, each stroke from the end nearer the pen, its dots
  last. Draw it with `B.draw` like any mark (`by` to land it on the word). One picture per idea: prefer an icon beside a
  short label to a box of words. Write the name as a string literal (compose embeds the icons a scene names); an unknown
  name is an error (`wb_icon_unknown`). No brand marks.
- `B.heading(E, text, {role | size, align, at, by, pen})`: one line in the display face, shrunk to fit the box (never
  below the label size), revealed left to right under the hand. Headings only: everything else is `B.write`.
- Marks (element-local px): `W.line(x0,y0,x1,y1)`, `W.path(points)`, `W.circle(cx,cy,r)`, `W.ellipse(cx,cy,rx,ry)`,
  `W.rect(x,y,w,h)` (four strokes), `W.roundRect(x,y,w,h,r)` (one stroke), `W.arrow(x0,y0,x1,y1,{bend})` (shaft, then an
  open head), `W.underline(x0,x1,y)`, `W.dashed(points)`, `W.hatch(polygon)`, `W.tick(x,y,s)`, `W.cross(x,y,s)`. Join
  lists with `.concat` to draw them as one group.
- Pens are pack tokens: `ink` (default), `accent` for the one thing that matters, `muted` for a note.
- `W.board(ctx, {marker: false})` hides the hand (a beat that only finishes what is on the board).

## The rules it already keeps (do not re-implement them)
- **One hand for the whole film**, never two on screen: every board in every beat shares it, it is always on top of
  the board, and its arm always comes up from the bottom edge (the engine does this; never draw or move a hand yourself).
  Everything is drawn in the order you call it; a call that asks to start while the hand is busy starts
  when it is free (and says so if that is more than 0.25 s late). Plan the order as a person would draw it: the
  container, then what is in it, then its words.
- **On the word.** Start a part about 0.3 to 0.4 s before its cue and give it a `by` just after the cue, so the words
  are being written as they are spoken. Nothing new after 85 % of the speech.
- **Sizes and fit** come from the pack's type roles; a box is truthful because the element is yours.
- **No sound by default.** `sound: true` gives one short, quiet marker sound for that group: use it at most once or twice
  in a beat, on the payoff, never on routine writing.
- **Two faces, audited.** Every word on the board is `B.write` (the marker hand) or `B.heading` (the display face).
  A kit part's words in an engine lesson are written the same way (`ctx.engine` is there in kit code too). Any other
  word on the board in another face is an error when the lesson is built (`wb_face`). Not the board: captions, the
  chapter chrome, characters, speech bubbles, devices and screens.
- **Room around every word.** A word never sits on a line: labels beside their boxes, headings above them, dividers,
  axes and arrows stopping short of words, grid cells wider than their words. The check reports a line through a word
  (`line_through_text`); the engine's own words are read by every layout check.
- **The board accumulates within a section; a new section carries little.** Draw beside what is there and carry parts
  to the next beat with `keep` / `ctx.held`. Into a new section carry only what it builds on (at most 40 % of the frame
  and 10 words, `board_carry`); let the rest leave at the end of its section.
- **The lab's clean board:** `py -m loom lab wb_engine_board --style whiteboard` (two faces, room around every word, few
  things at once).
