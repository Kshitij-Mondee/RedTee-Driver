# story-cartoon: WS6 proof (2026-10-08)

Rendered in Chrome on the runtime of this pass (`py -m loom lab ... --out docs/styles/demos/guides/story-cartoon`,
examples with `--file`). The examples' word timings come from their own `@lab` headers.

## What was rendered

| strip | what it is |
|---|---|
| `style_story_cartoon_two_shot__story-cartoon.jpg` | example: Rina and Joel across a table, "3 of 5" on the board between them |
| `style_story_cartoon_rig_mid_shot__story-cartoon.jpg` | example: Maya (designed rig) presents the notice that carries "$500" |
| `style_story_cartoon_two_shot__h264_crf18.mp4` | the two-shot with the pack's fx (paper, grain, vignette), 180 frames, crf 18 (1570 KB) |
| `lab_tpl_definition__story-cartoon__{classic,body,rules,tech}.jpg`, `lab_ui_artefacts__...`, `lab_matrix_build__...`, `lab_story_set__...`, `lab_characters__...`, `lab_data__...`, `lab_props_people__...`, `lab_fx__...` | engine lab scenes in this pack |

The lab scenes use beans, `ava` and `sam`, and dress people in `top: "accent"` by their own literals; this guide
forbids all of those (items 3 and 4). That is lab content, not the pack.

## Fixed during the proof
- The two-shot's nameplates: `tight_inset` (a 38 px label in a 64 px plate left 6 px around its font box); the plate
  is now 78 px tall. 0 problems after.
- The mid shot cut Maya just under the hip (item 8); she stands 45 px higher, so the frame cuts mid-thigh and the floor
  line sits about 85 px below her hem (item 9).
- Books and plant: `materials.books` (cloth, cloth2, accent3, surface) and `plant: accent4` (sage, the guide's plant
  token; pos stays a verdict colour).
- `roles.person_cloth` is now `[cloth, cloth2]`, one token per slot: with a single token, a dialogue's two non-cast
  people wore the same clothes (found by the full suite; test `primitive_style_person_cloth_keeps_two_people_apart`).

## Section 13 checklist (judged on the two examples)

| # | item | result |
|---|---|---|
| 1 | every beat with a person happens in a place | pass (a room with a table and board; a room with a notice) |
| 2 | each named person the same in every beat | pass within each example (one beat each; across beats unverified) |
| 3 | beans, or `ava`/`sam`, as people | pass in the examples (template person kit, Maya's designed rig); lab content uses them |
| 4 | a person in accent, accent2, pos or neg | pass in the examples (cloth, cloth2, Maya's own kit) |
| 5 | one accent element per frame, the named thing | pass ("3 of 5", "$500") |
| 6 | every number on a prop, the largest type, on screen by its word | pass |
| 7 | two-shot sides and eye level | pass by eye (same sides; eyes level), not measured in px |
| 8 | no head cut, no crop within 80 px of a joint | pass after the fix above |
| 9 | no set line along a head, hand, hem or hip | pass after the fix above |
| 10 | reaction face 150 px or more | not measured |
| 11 | caption word honey on the pill | not judged: no captions in lab strips |
| 12 | no smeared synthetic bold | pass: Patrick Hand loads 400 only and every drawn weight is 400 (test) |
| 13 | hand lettering only on signs, nameplates, numbers, titles | pass (nameplates, the notice's number; sentences in Nunito) |
| 14, 15 | black cards only as turns | not in the examples; `lab_story_set`'s card is a turn |
| 16 | a visible change every 4 s | pass (changes at about 1.4 and 3.7 s in a 7.5 s beat) |
| 17 | extras muted and behind | not in the examples |
| 18 | verdicts with a tick or cross | not in the examples |
| 19 | template beats a quarter or fewer | lesson level, not judged |
| 20 | muted text near a corner, a section label top left | pass (none) |

All words in both examples are 26 px or larger, none cut, none below y 930 (measured at 3.7, 6.4 and 6.8 s).

## Lab problems the pack cannot fix
`text_overflow` at the label floor (30 px) in `lab_ui_artefacts` (11), `lab_matrix_build` (4), `lab_data` (1) and
`lab_tpl_definition` ("e.g."): engine layouts sized for 26 px labels. It needs the UI type role (WALLS_AND_NEEDS,
M), not a pack value.

## H.264 (crf 18)
Last frame: 41.5 dB PSNR; the darkest corner (mean 193) keeps its paper texture (102 levels in the source, 126 after
encoding, largest step 15 to 11): grain survives, no banding.

## Found on a real lesson
The claude-balanced fork (story-cartoon) re-rendered after this pass: template beats show no vignette, because the
template's full-frame backplate covers the layer under the world (bespoke beats keep it). Decided (D-132): kept as is.

## Still unverified
Items 2 (across beats), 7 in px, 10; the vignette (0.32, Kshitij's decision) on a real lesson; the spotlight (0.3,
ink) was seen only in `lab_fx`.

## Set decorations (2026-10-08, D-133, L-286)
`lab_set_decor__story-cartoon__before.jpg` and `lab_set_decor__story-cartoon.jpg` (scene `scenes_examples/lab/lab_set_decor.js`: the flat office and the meeting room at night, the inside place, the server room, the warehouse, every object kind with no tone). The pack now sets the places' set decorations and more object kinds from the guide's section 2 (guide section 17). Before: rust cells, rust packages and lock, a rust document header, cables in four hues. After: cream (field2) and ochre cells on the teal vessel, tan packages in outline, cables in one teal family with line and muted, muted chart bars with a sage last bar, a sage document header. Compared with this style's own before strip only (D-122).
Still open: the accents drawn inside the objects (the laptop screen's chart and dots, the clock's minute hand; L-287).
