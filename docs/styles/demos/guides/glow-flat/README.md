# glow-flat: WS6 proof (2026-10-08)

Rendered in Chrome on the runtime of this pass (`py -m loom lab ... --out docs/styles/demos/guides/glow-flat`,
examples with `--file`).

## What was rendered

| strip | what it is |
|---|---|
| `style_glow_flat_handover__glow-flat.jpg` | example: a shift handover between two lit desk islands |
| `style_glow_flat_focus_day__glow-flat.jpg` | example: one working day as a lit rail; meetings batch, a 3 h focus block glows |
| `style_glow_flat_focus_day__h264_crf18.mp4` | focus day with the pack's fx (nebula, grain, vignette under), 273 frames, crf 18 (1200 KB) |
| `lab_tpl_definition__glow-flat__{classic,body,rules,tech}.jpg`, `lab_ui_artefacts__...`, `lab_matrix_build__...`, `lab_story_set__...`, `lab_characters__...`, `lab_data__...`, `lab_props_people__...`, `lab_fx__...` | engine lab scenes in this pack |

## Fixed during the proof
- The office plant pot was the alarm pink (pots were hard-coded accent3): `materials.pot: plum`.
- Calendars drew their header in the alarm pink (`Loom.obj` default tone): `materials.objects: {calendar: violet}`.
- Books and leaves: `materials.books` (muted, violet, plum, surface2), `plant: violet`.
- The turn card was a full-frame cream flash and its dip a pale wash (the guide calls a large ink fill a white
  hole): `roles.turn_card: deep`.
- The monitor body was white (`ink` is light here): `materials.monitor: deep`.
- UI avatars hashed onto the orange accent (item 4): `roles.avatar: [violet, plum, muted]`.

## Section 13 checklist (judged on the two examples)

| # | item | result |
|---|---|---|
| 1 | every bespoke beat starts on a ground or a place with a set | pass (graded ground, desks) |
| 2 | settled brightness 0.30 or more (`tone_checks`) | not measured (a lesson check measures it) |
| 3 | the field family plus one accent family | pass (cyan only); lab sets now in the field family after the fixes above |
| 4 | the accent only on the named thing | pass in the examples; avatars fixed above; lab people's orange tops are lab content |
| 5 | people `ava`/`sam` in muted, waist-up behind furniture | pass |
| 6 | one meaningful glow, no text in a halo, no ring bands | pass: one glow each, a single gradient disc (test), smooth in the MP4 crop |
| 7 | pills near their thing on leaders, apart, outside corners | pass by eye |
| 8 | labels on moving things move with them | pass ("3 open" rides the stack at 8.6 s) |
| 9 | sentences in Nunito, Fredoka on titles, numbers, pills | pass by eye |
| 10 | text 26 px or larger, clear of the caption band | pass, measured (4.4, 6.6, 10.4, 11.0 s) |
| 11 | each change on its spoken word, nothing after 85 % | timings estimated from the narration; not verified against TTS |
| 12 | quiet background life | pass |
| 13 | no burst, vortex or crackle | pass |
| 14 | template share, no `document.page`, no icon on `definition` | lesson level; the lab definition has an icon (lab content) |
| 15 | dashed routes stay dashed | pass (the handover arc in every frame) |
| 16 | MP4 corners free of banding and blocks | pass: 41.4 dB; darkest corner (mean 25) 74 levels in the source, 83 after, largest step 13 to 11; the glow disc is smooth at 100 % |
| 17 | nothing before its cue, nothing stays after | pass in the strips |
| 18 | join frames show a ground and a set | not judged (single-beat examples) |

## Lab problems the pack cannot fix
`lab_ui_artefacts`: `text_overflow` "09:16" at the 26 px label floor (the UI type role, WALLS_AND_NEEDS, M).

## Still unverified
Item 2, 11 and 18; `shape.gloss_toward: plum` was judged only on the definition icon and props (no warm accent fill
large enough to see the difference); `fx.spotlight` (0.35, deep) only in `lab_fx`.

## Set decorations (2026-10-08, D-133, L-286)
`lab_set_decor__glow-flat__before.jpg` and `lab_set_decor__glow-flat.jpg` (scene `scenes_examples/lab/lab_set_decor.js`: the flat office and the meeting room at night, the inside place, the server room, the warehouse, every object kind with no tone). The pack now sets the places' set decorations and more object kinds from the guide's section 2 (guide section 17). Before: a hot pink vessel with orange and yellow cells, orange packages, cyan and yellow chart bars, cables in four accent hues, a yellow safety line. After: a plum vessel with violet and muted cells, core window lights, glow and core LEDs, line, violet and muted cables, muted chart bars with a violet last bar, packages in surface (muted packages measured 13.9 %, over muted's 10 %). Compared with this style's own before strip only (D-122).
Still open: the accents drawn inside the objects (the laptop screen's chart and dots, the clock's minute hand; L-287).
