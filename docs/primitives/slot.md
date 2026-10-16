# Loom.slot: hold the layout, change its state (D-114)

`runtime/slot.js`. Built by prim_b, 2026-10-06. For merging into `docs/SCENE_API.md`.

## What it is for

TED-Ed films keep one panel, cutaway or held object on screen and change its CONTENTS on the spoken word (one
diagram was held 44 s). Loom used to rebuild a station per beat. A slot is a fixed region whose frame never moves
while what is inside it is replaced, recoloured or relabelled.

**Use it** when the idea is one thing changing state (a document moving through review, a step counter, a held
object that opens, a value that is revised), or a run of items said one after another in the same place.
**Do not use it** when the items must be compared side by side (they never coexist in a slot: use a row or a
table), or when the change is a continuous transformation of one drawing (use `Loom.hold.*` or a morph).

## API

```js
const s = Loom.slot(ctx, name, { x, y, w, h, frame, align, role, token, t, pad, how, color, fill, stripe, exit });
s.show(content, t, { how, dir, speed, exitDur, token })   // -> time the new content has landed
s.sequence([{ at, content, how, dir }...], { rhythm, how, from, to, each })   // -> the times used
s.recolour(token, t, { dur })     // the state colour changes; frame and content stay
s.relabel(text, t)                // same state, new words (erase left to right, write left to right)
s.clear(t, { how })               // the content leaves, the empty frame stays
s.exit(t, kind)                   // content first, then the frame
s.E, s.box, s.token               // the element, the content box (slot-local), the current state token
```

| option | default | meaning |
|---|---|---|
| `x, y, w, h` | 0, 0, 600, 320 | the slot's box in the station |
| `frame` | `"card"` | `"card"` (kit.card plus a state stripe on the left), `"badge"` (a pill filled with the state colour, text in the colour that reads on it), `"none"` (no frame; still clipped) |
| `align` | `"center"` | text alignment inside the content box |
| `role` | `"title"` | kit type role for text contents (type floors apply; an overflow is a `text_overflow` error) |
| `token` | `"accent"` | the starting state colour |
| `t` | first show | when the frame arrives (`settle`); with no `t`, the frame arrives at the first `show` and the content half an entrance later; `t: false` means the caller animates `s.E` itself |
| `pad` | max(24, 9 % of the short side) | inset of the content box (0 for `frame: "none"`) |
| `stripe` | true | card frames only: the state stripe |

**content** is one of:
- a string, or `{ text, token, role, color, align, weight, maxLines, floor, label }`;
- `{ object: "<Loom.obj kind>", state, tone, text }` or `{ icon: "<lucide name>", text }` or `{ draw(g, box), text }`:
  with words, the picture sits left of the text in a wide slot (w >= 1.6 h) and above it (one role smaller) in a
  tall one;
- a function `(g, box) => {...}` that draws into the content group (`box` is in slot-local coordinates).
  Set `fn.floor` or `fn.slotLabel` to give it a reading floor or a name in the report.

`token` on a content sets the state colour: the stripe or badge (and any shape in the visible content drawn in the
old state colour) recolours during the swap window.

**hows** (one per change; the old content's exit and the new content's entrance both follow it):

| how | old content | new content | entrance length (x pack `enter`) |
|---|---|---|---|
| `swap` | fades, rises 14 px | fades in, rises from 18 px | 1.0 |
| `flip` | scaleX to 0 | scaleX from 0 | 0.8 |
| `slide` | moves out in `dir` (left, right, up, down) | comes in from the opposite side | 1.1 |
| `recolour` | fades | fades (the colour change carries it) | 0.9 |
| `relabel` | wiped away left to right | written left to right | 1.2 |
| `stamp` | recedes to 0.92 | lands from 1.3x | 0.7 |

## Timing rules (what it guarantees)

- **No double exposure.** A change at `t`: the old content's exit runs `[t, t + xd]` (`xd` = 0.6 x the new
  entrance, eased in); the new entrance starts at `t + xd` (eased out). The frame does not move.
- **Never interrupts an entrance.** A change cued before the previous content has landed is moved to the end of
  that entrance (`slot_overlap` warning).
- **Reading floor.** A content readable for less than its floor warns `slot_too_fast` (1 to 3 words 0.8 s; more
  words 0.3 s a word, at least 1.2 s; a drawing 0.8 s; or the content's `floor`). Readable = from the end of its
  entrance to the start of its exit. A content that cannot reach its floor before the scene ends warns too.
- **sequence rhythm.** Items without `at` are spread over `[from, to]`: `even`, `accelerate` (gaps shrink by 0.75
  each) or `decelerate` (gaps grow). With `at` given, the cue words own the times and the rhythm shapes the swap
  speed instead (accelerate: each swap up to 35 % quicker; decelerate: up to 35 % slower).
- Changes must be scheduled in time order (`slot_out_of_order` otherwise).

## Report

`Loom.report.slots[]`: `{ beat, name, frame, box, contents: [{ i, label, how, words, floor, t_in0, t_in1, t_out0,
t_out1, shown }], changes: [{ kind, t, token }] }`. Warnings: `slot_too_fast`, `slot_overlap`, `slot_out_of_order`,
`slot_unknown_how`, `slot_empty`; error `slot_bad_frame`. Text contents go through kit.text, so the usual text
audits see every content.

## Pack behaviour

Durations come from the pack's motion (`enter`, `move`), so a snappy pack swaps faster than a calm one. The badge
outline follows the pack (toon, ink, line and sketch shading outline it in `shape.outline`). The card is `kit.card`,
so a design seed's panel treatment applies. Nothing in the slot overshoots, so no pack switch is needed; the slot
is the same grammar in illustrated, editorial and technical packs.

## Example

```js
const s = Loom.slot(ctx, "state", { x: 200, y: 260, w: 900, h: 360, frame: "card", role: "hero" });
s.show({ text: "Draft", token: "accent" }, ctx.cue("draft"));
s.show({ text: "In review", token: "accent4" }, ctx.cue("review"), { how: "flip" });
s.show({ object: "document", text: "Signed" }, ctx.cue("signed"), { how: "stamp" });
s.recolour("pos", ctx.cue("approved"));
```

## Proof

Lab: `py -m loom lab lab_slot` (story-cartoon, corporate-clean), strips in `docs/styles/demos/lab/lab_slot__*.jpg`.
Tests: `tests/suites/primitives_slot_magnify_data.py` (`primitive_slot_*`).

## Still unverified

- Not yet used in a composed lesson: behaviour across a world join (a slot on a station the camera leaves) and the
  film checks' view of a held slot (static-hold and repeated-frame checks) are not tested.
- The reading floor for a drawing (0.8 s) is a choice, not a measured value.
- A slot inside a travelling element (`m.travel` on its parent) was not tried.
- `flip` uses the content's own bounding box as its axis; contents of very different widths flip about slightly
  different centres (not visible in the lab, not measured).
