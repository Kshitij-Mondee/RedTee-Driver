# corporate-clean: WS6 proof (2026-10-08)

Rendered in Chrome (HyperFrames headless shell) on the runtime of this pass, with `py -m loom lab <scene> --style
corporate-clean --out docs/styles/demos/guides/corporate-clean` and `py -m loom lab --file <example> ...`. The
examples' word timings are estimated from their narration at about 180 wpm (their `@lab` headers say so), not from TTS.

## What was rendered

| strip | what it is |
|---|---|
| `style_corporate_clean_request_route__corporate-clean.jpg` | example R1: an expense request's route across a floor plan |
| `style_corporate_clean_wall_chart__corporate-clean.jpg` | example: a number on the meeting-room screen, then a push in |
| `style_corporate_clean_wall_chart__h264_crf18.mp4` | that example with the pack's fx, 321 frames at 24 fps, H.264 crf 18 (425 KB) |
| `lab_tpl_definition__corporate-clean__{classic,body,rules,tech}.jpg` | the definition template under four seeds |
| `lab_ui_artefacts__corporate-clean.jpg`, `lab_matrix_build__...`, `lab_story_set__...`, `lab_characters__...`, `lab_data__...`, `lab_props_people__...`, `lab_fx__...` | engine lab scenes in this pack |

The lab scenes are engine demos with their own colour choices (a person in `top: "accent"`, a red "after" bar). They
show what the PACK does; where a lab scene breaks a rule by its own literal, that is noted as lab content, not a gap
of the style.

## Section 13 checklist (judged on the two examples; lab strips where they test the pack)

| # | item | result |
|---|---|---|
| 1 | spoken caption word amber on the pill | not judged: lab strips have no captions (a composed lesson does) |
| 2 | one blue element per settled frame, the named one | pass on both examples (the owner's floor tile; the June bar and its tag). Gap in `Loom.ui`: the Report button, the link and my chat bubble are all blue (the guide keeps link and button in accent) |
| 3 | at most two saturated hue families | pass on the examples. Fixed in this proof: the definition template showed amber term, blue rule and teal icon; the pack now sets `roles.term: "accent2"`, so rule and icon follow the term (one amber family) |
| 4 | no pink, purple or pastel wash | pass (the mesh stays blue-only) |
| 5 | text on colour fills white; no line or slate text under 24 px | pass ("Approved", "under 1 day") |
| 6 | pos and neg only as ticks, crosses and small tags | pass on the examples; `lab_data`'s red bar is lab content |
| 7 | labels 28 px or larger as seen, nothing readable below y 930 | pass, measured: no word under 28 px and none below y 930 in either example (at 3.1, 6.7, 7.8, 10.1 and 11.7 s) |
| 8 | content covers 45 % of the safe area | not measured |
| 9 | each motion beat happens somewhere | pass (a floor plan, a meeting-room screen) |
| 10 | furniture neutral | pass after this proof: `lab_story_set` and `lab_props_people` showed books in four accents and a teal plant; the pack now sets `materials.books` (slate, muted, line, surface2), `plant: muted` |
| 11 | people in navy or slate with trousers | pack default verified by test (`characters.cloth: ink`, `bottom: muted`); template people take `roles.person_cloth: [ink, accent3]`, a second person in slate as the guide says; the lab scenes pass accents themselves |
| 12 | one icon family | pass (Lucide) |
| 13 | charts: zero baseline, direct labels, slate context, one blue bar, only spoken values | pass (wall chart) |
| 14 | body copy lighter than names (500 against 700) | pass: every drawn weight is a loaded Inter weight (test `primitive_style_no_pack_draws_a_weight_its_font_did_not_load`) |
| 15 | radii varied by role | not judged |
| 16 | dashed lines dashed in every frame | pass (the "about 3 days" line in every frame it is on screen) |
| 17 | no word cut by the frame edge around a camera move | pass, measured at 11.7 s after the push: 0 cut words |
| 18 | a hold over 4 s changes by its end | pass (no hold over 4 s in either example) |

## H.264 (crf 18, `style_corporate_clean_wall_chart__h264_crf18.mp4`)
Last frame against its source PNG: 44.3 dB PSNR. The darkest corner (bottom left, mean 202) keeps its one hard edge
(largest step 56 in both, a real edge); no banding in the mesh field at 100 %.

## Still unverified
- items 1, 8 and 15; the examples' timings against real narration;
- `fx.spotlight` (0.25, field2) was seen only in `lab_fx` (the other cards wash pale), not in a lesson;
- `fx.vignette_under` at 0.08 is too faint to judge by eye; its layer order is tested.

## Set decorations (2026-10-08, D-133, L-286)
`lab_set_decor__corporate-clean__before.jpg` and `lab_set_decor__corporate-clean.jpg` (scene `scenes_examples/lab/lab_set_decor.js`: the flat office and the meeting room at night, the inside place, the server room, the warehouse, every object kind with no tone). The pack now sets the places' set decorations and more object kinds from the guide's section 2 (guide section 17). Before: blue cells and a blue warehouse of packages over an amber safety line, a teal and amber wall chart, LEDs in green, amber and teal, a blue lock and document header. After: every set decoration and default object in slate (accent3), cables slate and line, the envelope white; accent3 packages measured 13.2 % of the warehouse frame (its share is 3 to 15 %). Compared with this style's own before strip only (D-122).
Still open: the accents drawn inside the objects (the laptop screen's chart and dots, the clock's minute hand; L-287).
