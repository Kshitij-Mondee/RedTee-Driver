# How Loom measures space (text, gaps, insets, boxes)

**Short answer:** measurement and checking are deterministic engine code, not AI. The coordinates
themselves are numbers written in code. For templates that code is engine code; for a bespoke scene an
agent (Sonnet) wrote the numbers once, when it wrote the scene. After that, every render is the same.
An AI reviewer looks at the contact sheets, but it judges; it does not measure.

## 1. What is measured, and by what
| what | how | where |
|---|---|---|
| Width of a line of text | the browser's canvas `measureText` on the actually loaded font face, at the actual size and weight, plus tracking (letter-spacing) per character | `kit.measure` (`runtime/kit.js`) |
| Line breaks | greedy wrap by measured width | `kit.fit` |
| Font size | the largest size in the style's range for that role (for example body 34-40px) at which the wrapped lines fit the box's width, height and `maxLines`. It never goes below the role's floor | `kit.fit` |
| Height of a text block | `(lines - 1) x line box + max(line box, the face's own ascent + descent)`. The line box is `size x lh` (1.36; 1.12 for display and title). Ascent and descent come from the font (`fontBoundingBoxAscent/Descent`) | `kit.fit` |
| Where each baseline sits | like CSS: half the leading above and below the face's ascent + descent | `kit.text` |
| Does it really fit | after drawing, the browser's own box of the laid-out glyphs (`getBBox`) is compared with the numbers the caller gave | `kit.text` (checks below) |
| Card sizes that hug text | "measure, then draw": call `kit.fit(str, {role, w, maxLines})` first, then size the card to `fit.height + 2 x inset` | quiz templates, component example, scenes |

Everything above runs in headless Chromium (the same engine as the final render) with fonts loaded
before anything is built. There is no randomness, no clock and no network, so the same inputs give the
same numbers every time.

## 2. The checks (all deterministic; errors fail `check`)
| check | rule | catches |
|---|---|---|
| `text_overflow` | the text cannot fit its box at the role's floor size | too many words for the space; the fix is a bigger box or fewer words, never smaller type |
| `text_spill` | the drawn glyph box leaves its own text box by more than 2px | the measurement and the rendering disagreeing, as with a font whose ascent is taller than assumed |
| `text_outside_element` | text drawn in an element leaves that element's declared box (`ctx.el(..., {w, h})`) | an element box that lies. The camera, joins and clip reveals trust those boxes |
| `tight_inset` | text sits closer than `max(6px, 0.2 x font size)` to the edge of the shape it sits on (the smallest card, pill, bubble or disc drawn before it in the same group and containing its centre). Single glyphs of 3 characters or fewer are exempt | words touching a card edge (the defect in your screenshot) |
| `sample_text` | a template draws a word no prop supplied | leftover sample content |
| HyperFrames layout | overlapping text blocks, and contrast below WCAG AA | text colliding, unreadable colour |
| static holds, reveal timing | measured from the timeline | nothing moving on screen, reveals landing late |

## 3. What is NOT measured yet (honest gaps)
- **Gaps between separate elements** (card to card, card to arrow) are not checked. They are numbers in
  each template or scene. HyperFrames catches overlapping TEXT, but not two cards 4px apart.
- **Margins to the frame edge** are checked only through the safe box that templates lay out in, and the
  camera-push pivot. There is no general "nothing within N px of the frame" check for bespoke scenes.
- **Spacing is not on a scale.** There are no spacing tokens (4/8/16/24...) in the style packs yet, so
  gaps are consistent only as far as their authors were.
- **Ink versus font box:** insets are measured to the font box, which includes the ascender space. That
  is slightly conservative for lowercase text, and it is why single glyphs are exempt.

These are logged as OPEN items L-53 and L-54 in `docs/AGENT_LEARNINGS.md`.

## 4. The layout guard: the engine moves what it safely can (D-169, opt-in per lesson)
Kshitij asked that agents no longer fix small overlaps and text fits. With the guard on (`py -m loom layout <id> on`):
| what | rule | where |
|---|---|---|
| Flexible elements (label, tag, stamp, badge, callout, note, pill, chip, or `{layout: "flex"}`) | moved out of a conflict held for two samples or more (0.5 s apart): over words (12 px of air), on another label, across an object's edge, past the frame (12 px) or into the caption band (110 px) | `runtime/layout.js` `solve` |
| Edge elements (text, card, list, document, panel, title, kicker) | moved only back inside the frame | same |
| Objects (icon, instrument, object, character, device, figure, prop, document, token, card) | never moved; objects overlapping each other is never a conflict (a mug on its table) | same |
| A move | the nearest of a fixed candidate list (8 directions, 16 to 230 px; at most 160 px for a label; the way back inside the frame unlimited), taken only when it clears everything at every sample; else the element stays and the conflict is left for the author | same |
| Meant overlaps | `ctx.el(name, {overlaps: ["table"]})` or `T.label(..., {overlaps: ["mug"]})`; a label put mostly on an object may stay on it; `{layout: "fixed"}`; `data-layout-allow-overlap` and `data-layout-ignore` | `kit.element`, `treat.label` |
| The plan | `projects/<id>/layout/plan.json`, each offset tied to the hash of its scene and kit; compose puts the valid ones in the manifest; solved again until nothing moves | `loom/layout_guard.py` |
| A text box too short for its words at the floor | grown about its alignment (and its element's box with it), a `text_box_grown` warning; never smaller type; still checked for spill, inset and its card | `kit.text` |
| When | before the probe in `check`, `pilot_check` and every `lab_snapshot` (the author is told what moved) | `qa.check`, `server.pilot_check`, `tools.lab_snapshot_finish` |
Off, nothing changes. Not done: re-wrapping a sentence, resizing a card, re-timing a reveal; a word wider than its box at
the floor is still an error.
