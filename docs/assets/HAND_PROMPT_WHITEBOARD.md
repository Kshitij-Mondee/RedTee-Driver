# Claude Design prompt: the whiteboard writing hand (D-179, 2026-10-15)

STATUS: PROMPT, waiting for Kshitij to run it in Claude Design. The whiteboard engine (`runtime/engines/whiteboard.js`)
draws with one hand at a time; until this art lands it shows the marker alone. Kshitij, 2026-10-15: "keep the hand and
not just the marker"; code may not draw a hand (D-102), so the hand is designed.

## How to use it
In one Claude Design session paste, in this order: **Prompt 0** (`docs/ASSET_WISHLIST.md`), **Prompt R** (same file),
then the block below. Review the pilot pose `write` first; paste failures back ("fix these, keep everything else");
then ask for the other two poses "same hand, same line and colours". Export as .zip and run
`py tools/asset_intake.py <file.zip> --batch wb-hand-v1`; a clean intake (exit 0) is the gate, then the files go to
`assets/engines/whiteboard/hand/` (the agent does this step).

## The block
```
SUBJECT: one adult hand writing on a whiteboard with a dry-erase marker, for clean workplace explainer videos.
It is the only part of the presenter we see: it enters the frame from the bottom edge, writes, lifts, and leaves.

STYLE (Loom's own whiteboard look: fresh and clean, not a sketchbook, not a cartoon):
- One clean, even line in dark ink (class="hand-line"), about 3 px at 1080p, rounded ends, no wobble, no hatching,
  no texture. Flat fills only, no gradients, no shadows, no shine.
- Skin: one flat tone (class="hand-skin"), with ONE slightly darker flat shape for the inner palm or the fold of the
  fingers (class="hand-skin-shade"). Short, plain nails as a single line each. No rings, no watch, no logos.
- Sleeve: a plain cuff at the wrist in one flat colour (class="hand-sleeve"), straight and square where it meets the
  bottom edge of the canvas.
- The marker: a modern dry-erase marker held naturally (tripod grip: thumb, index, middle finger), body in a light
  flat colour (class="marker-body") with a dark line, and its NIB and CAP BAND as separate shapes in class="pen":
  the engine recolours "pen" to the ink being used (black, orange, blue).
- Proportions: a real adult hand, five fingers, natural length and joints. Calm and confident, mid-writing.

GEOMETRY (the engine's contract):
- viewBox="0 0 400 640" for every pose. The hand enters from the BOTTOM: the forearm and cuff run straight down to
  the bottom edge, centred; the marker points up and slightly left so the nib is the highest point.
- On the root <svg>: data-anchor="x,y" = the very tip of the nib, in viewBox units; data-wrist="x,640" = the centre of
  the cuff on the bottom edge; data-wrist-width = the cuff's width.
- Every part a separate <path> with its class; ids "hand_write", "hand_write_lifted", "hand_rest" on the root.

POSES (one file each, the same hand, the same size and position of the wrist):
1. write.svg: nib touching the board, fingers in the grip, wrist relaxed.
2. write_lifted.svg: the same grip, nib about 12 viewBox units off the board, wrist slightly raised.
3. rest.svg: the marker still held, hand turned a little away from the board, between sentences.

REJECT: mitten or cartoon-glove hands, four fingers, a fist with no visible grip, a marker floating beside the
fingers, thick outlines, shading or highlights, a hand that reads as a child's, any brand or text on the marker.
```

## What the engine does with it
- `compose` embeds `assets/engines/whiteboard/hand/*.svg` for whiteboard lessons (`manifest.assets.wbHand`).
- The performer places the art so `data-anchor` sits on the drawing tip, swaps `write` and `write_lifted` with the
  hand's lift, uses `rest` while parked, recolours `class="pen"` to the current ink, and rotates the whole hand a
  little with the stroke direction (within 10 degrees) so it does not look pinned.
