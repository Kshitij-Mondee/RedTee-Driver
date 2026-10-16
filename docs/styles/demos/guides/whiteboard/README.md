# whiteboard: WS6 proof (2026-10-08)

Rendered in Chrome on the runtime of this pass (`py -m loom lab ... --out docs/styles/demos/guides/whiteboard`,
examples with `--file`; rough.js loaded as compose loads it). The examples' word timings are estimated from their
narration at about 180 wpm (their `@lab` headers say so), not from TTS.

## What was rendered

| strip | what it is |
|---|---|
| `style_whiteboard_handover__whiteboard.jpg` | example: a shift handover drawn in speech order, one marker circle on the line that matters |
| `style_whiteboard_meeting_cost__whiteboard.jpg` | example: a meeting's cost worked out by hand, term by term, one underline |
| `style_whiteboard_handover__h264_crf18.mp4` | the handover with the pack's fx (paper), 388 frames, crf 18 (538 KB) |
| `lab_tpl_definition__whiteboard__{classic,body,rules,tech}.jpg`, `lab_ui_artefacts__...`, `lab_matrix_build__...`, `lab_story_set__...`, `lab_characters__...`, `lab_data__...`, `lab_props_people__...`, `lab_fx__...` | engine lab scenes in this pack |

Most lab scenes draw what this style forbids (rigs, places, `Loom.ui` panes, pills): they show the pack, not a
whiteboard lesson.

## Fixed during the proof
- The turn card's words did not show: `kit.text` turns knockout tokens to ink in an outlined pack (words on
  hachure), so the card's words were ink on an ink card (1.00:1, test
  `primitive_style_turn_card_words_read_on_their_card_in_every_pack`). The card now passes a resolved colour, and the
  pack sets `roles.turn_card: field` (the sentence written on a clean board).
- The meeting cost's closing question spilled 7 px out of its box (Caveat overhangs its advance width): it is fitted
  30 px inside its element. 0 problems after.
- The two examples had no `@lab` header, so every `ctx.cue` read 0 in the lab: they now carry word timings.

## Section 13 checklist (judged on the two examples)

| # | item | result |
|---|---|---|
| 1 | one marker weight, the emphasis mark heavier | pass by eye |
| 2 | no crisp arrows, filled heads, dashes, pills or crisp rounded shapes | pass: arrows are rough shafts with open heads, rects keep their radius as rough paths (tests) |
| 3 | ink, muted, at most two marker colours, the accent on one thing | pass (one red circle; one underline) |
| 4 | coloured words on the plain board | pass |
| 5 | Patrick Hand single-weight, no smeared bold | pass: every drawn weight is a loaded weight (test) |
| 6 | headings, terms and numbers in Caveat at 72 px or more | pass, measured: Caveat 95.1 px (handover), 79.5 px (meeting cost) at their smallest |
| 7 | each drawing within 0.4 s of its words, in spoken order | order pass; timing against real narration not verified |
| 8 | strokes drawn on, words written left to right | pass ("Who really ne..." mid-write at 14.0 s); outlines draw before hachure (test) |
| 9 | the board accumulates | pass |
| 10 | 3 to 7 units, a third of the box still empty | pass by eye |
| 11 | inside x 96 to 1824, above y 930 | pass, measured: no word below y 930, none cut |
| 12 | at most one person, a peep on a drawn line | pass (one bust on a desk line); its size not measured |
| 13 | no code-drawn people, rigs, places, iso, grey shadows | pass in the examples (lab content draws them) |
| 14 | two or fewer hachured areas, outline before hatch | pass (outline first is now how `m.draw` works, test) |
| 15 | no ghost placeholders, no spotlight dimming | pass (`fx.spotlight.strength: 0`) |
| 16 | the last reveal before 85 % of the speech | not verified (estimated timings) |
| 17 | connectors 10 to 20 px from what they join, never through words | pass by eye |
| 18 | joins between boards | not judged (single-beat examples) |
| 19 | an adult workplace register | pass |

## Lab problems the pack cannot fix
`text_overflow` at the 34 px body floor in `lab_ui_artefacts` (18) and at the label floor in `lab_data`: engine
layouts sized for smaller type (the UI type role, WALLS_AND_NEEDS, M). This style should not use `Loom.ui` panes
anyway.

## H.264 (crf 18)
Last frame: 41.4 dB PSNR; the board's paper keeps its texture (196 levels in the darkest corner, 207 after, largest
step 3 in both).

## Still unverified
Items 7 and 16 against real narration, 12 in px, 18; places, objects and data through `kit.sketch` (M, WALLS_AND_NEEDS).

## Set decorations (2026-10-08, D-133, L-286)
`lab_set_decor__whiteboard__before.jpg` and `lab_set_decor__whiteboard.jpg` (scene `scenes_examples/lab/lab_set_decor.js`: the flat office and the meeting room at night, the inside place, the server room, the warehouse, every object kind with no tone). The pack now sets the places' set decorations and more object kinds from the guide's section 2 (guide section 17). Before: a raspberry vessel, blue window lights and safety line, blue folders and envelope, orange packages and lock, marker colours in the chart and cables. After: muted decorations, line and muted cables, objects as outlines (surface), ink headers on the document and calendar. The field2 vessel nearly vanishes (L-288: an outlined style needs an outlined tube). Compared with this style's own before strip only (D-122).
Still open: the accents drawn inside the objects (the laptop screen's chart and dots, the clock's minute hand; L-287).
