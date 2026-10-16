# cinematic-noir: WS6 proof (2026-10-08)

Rendered in Chrome on the runtime of this pass (`py -m loom lab ... --out docs/styles/demos/guides/cinematic-noir`,
examples with `--file`; `lab_depth` is noir's own lab scene).

## What was rendered

| strip | what it is |
|---|---|
| `style_cinematic_noir_after_hours__cinematic-noir.jpg` | example: a night office on a depth stage, one desk lamp, the message lands as amber |
| `style_cinematic_noir_evidence__cinematic-noir.jpg` | example: the message pane lit like a document; danger in red, the move (Report) in amber, a spotlight on it |
| `style_cinematic_noir_after_hours__h264_crf18.mp4` | after hours with the pack's fx (nebula 0.35, grain, leak, vignette under), 240 frames, crf 18 (1428 KB) |
| `lab_depth__cinematic-noir.jpg` | the depth stage: street lamp cone, moon, a figure, a slow push |
| `lab_tpl_definition__cinematic-noir__{classic,body,rules,tech}.jpg`, `lab_ui_artefacts__...`, `lab_matrix_build__...`, `lab_story_set__...`, `lab_characters__...`, `lab_data__...`, `lab_props_people__...`, `lab_fx__...` | engine lab scenes in this pack |

## Fixed during the proof
- The desk monitor's screen was bright amber (noir set no `materials.screen`): `screen: surface2`; its body was
  white (`ink` is the key light here): `materials.monitor: shadow`.
- The turn card was a full-frame cream flash and its dip a pale wash (the guide already told authors to pass
  `ground: "shadow"`): `roles.turn_card: shadow`, so no scene can forget it.
- UI avatars hashed onto amber: `roles.avatar: [accent3, accent4]` (the guide's own advice for senders).
- Books, plant, pot: `materials.books` (surface, surface2, muted, line), `plant: surface2`, `pot: surface`.
- Not changed (Kshitij's decisions): `accent2` equal to `neg`, the extra tokens, the tone reference and ambient wash.

## Section 13 checklist (judged on the two examples, plus `lab_depth`)

| # | item | result |
|---|---|---|
| 1 | one brightest, warmest point, the named thing | pass (the lamp is a cool key; the amber laptop glow lands on "a message lands"; Report in the evidence) |
| 2 | amber only on the named thing or the move | pass in the examples; lab fixes above; lab people's amber tops are lab content |
| 3 | red only on danger | pass (the domain, "within 2 hours", their tags) |
| 4 | words on dark field or a pane, never in a cone or halo | pass |
| 5 | every word 26 px or larger; muted corners readable | pass, measured: smallest word 28.7 px (Inter), titles 69.7 px (Fraunces) |
| 6 | titles and panes still while the scenery drifts | pass |
| 7 | one camera move a shot, no layer edge, no word cut | pass by eye; measured 0 cut words |
| 8 | the bulb inside its shade in every frame | pass |
| 9 | lit areas hard-edged, no soft wash over an eighth of the frame | pass after the turn card fix (its dip was a pale wash) |
| 10 | props face their user, real scale, a contact shadow | decided (D-132): noir sets no `shape.contact_shadow`; a prop's shadow comes from `Loom.obj` or the depth stage; the lab desk stands without one |
| 11 | no code-drawn people | pass in the examples; lab scenes draw rigs (lab content) |
| 12 | UI pane 57 % of the frame or wider, a lit shape behind | pass (about 1180 px) |
| 13 | each sign marked, tagged and led in red | pass |
| 14 | during a spotlight, what appears is inside the lit rect | pass (the move's tag wipes in inside it) |
| 15 | a hold over 4 s changes | pass |
| 16 | no near-black frame over 3 s while the voice speaks | pass |
| 17 | the lesson lifts to a bright band once | lesson level, not judged |
| 18 | MP4 dark corners free of rings and blotches | pass: 42.7 dB; darkest corner (bottom left, mean 12.8 to 12.2) 26 levels in the source, 27 after, largest step 1 to 2; the lamp cone and the amber glow are smooth at 100 % |

## Still unverified
A calibrated display and a platform re-encode (YouTube, LMS); the nebula at intensity 0.35 over a whole lesson;
`fx.spotlight` (0.45) only in the evidence example and `lab_fx`.

## Set decorations (2026-10-08, D-133, L-286)
`lab_set_decor__cinematic-noir__before.jpg` and `lab_set_decor__cinematic-noir.jpg` (scene `scenes_examples/lab/lab_set_decor.js`: the flat office and the meeting room at night, the inside place, the server room, the warehouse, every object kind with no tone). The pack now sets the places' set decorations and more object kinds from the guide's section 2 (guide section 17). Before: amber packages and lock, red (accent2) folders, envelope, chart bar and safety line, a bright accent3 vessel with amber and red cells, red window specks. After: muted window specks and safety line, a surface vessel with line and muted cells, line and muted cables and chart, surface packages, old-paper (accent4) document header, envelope and folder. Compared with this style's own before strip only (D-122).
Still open: the accents drawn inside the objects (the laptop screen's chart and dots, the clock's minute hand; L-287).
