---
name: loom-style-pack
description: Create or change a Loom style pack (Video-Engine folder) - the data file that sets a lesson's whole visual register (palette, fonts, type scale, shape language and shading, motion personality, ambient field, captions, characters, music mood) - so any lesson restyles without touching scene code. Use when asked for a new look for Loom videos ("make it look like Vox / a whiteboard / our brand / corporate / 3Blue1Brown"), to add brand colours or fonts, change easing personality or background, or fix contrast in a style.
---

# Loom style pack

A style pack is ONE JSON file in `packs/styles/<id>.json`. Templates, blueprints and bespoke scenes only
ever ask the pack for colours (tokens), fonts (roles), durations (motion) and shading - so a new pack
restyles every lesson. Start by copying the closest existing pack: `flat-cosmos` (Kurzgesagt-like),
`editorial-paper` (Vox-like), `whiteboard` (hand-drawn, rough.js), `corporate-clean`, `dark-technical`
(3Blue1Brown-like), `engineering`, `line-art`, `cinematic-noir` and `cinematic-dawn` (for the 2.5D depth stage),
and from the 2026-10-01 visual study `story-cartoon` (outlined toon, hand-lettered signs, black turn cards),
`presenter-pop` (big flat diagrams, lime pointer pills) and `chalk-lab` (a board on near-black, serif symbol labels),
`blueprint` (a drafting sheet: white monoline parts on deep cyanotype blue, a still drafting grid from the `drafting`
fx background, mono annotations; D-178), and `glow-flat` (saturated flat colour fields that glow, gloss shapes with no outline, pill labels; inspired by the
newer Kurzgesagt look, D-78; it pairs with the glow kit, `runtime/glow.js`).

## Fields
- `look_family` (required on every new pack; `style_lint` requires it as D-112 lands): `illustrated`, `editorial` or
  `technical`. **Illustrated** means a drawn world (places, objects, figures; cartoon or cinematic illustration):
  story-cartoon, flat-cosmos, glow-flat, whiteboard, cinematic-noir, cinematic-dawn. They get the illustrated-only
  learnings (people, hand-made timing, cartoon joins, springy pops) and a `tone_reference`. Editorial
  (editorial-paper, presenter-pop, corporate-clean) and technical (engineering, blueprint, dark-technical, line-art,
  chalk-lab) get the general learnings only. Unsure? Ask the person.
- `tone_reference` (illustrated packs only): the measured TED-Ed family nearest the pack's drawing
  (`docs/research/vision/tedEd_2026-10/colour_and_tone.md` s2: brightness, saturation, dark, light, warm, cool and
  accent shares), e.g. whiteboard is sketch line on paper (0.82 bright, 0.08 sat), cinematic-noir is dark void,
  single light (0.37). The tone check warns when a lesson strays far.
- `pace`: film-check thresholds. `rest_max_s` is the static hold a declared `rest`, `process_hold` or `hold`
  may run (20 s, warning above); `sparse_edges` (0.02) may drop to 0.01 on a dark-field pack.
- `palette`: field, field2, surface, surface2, ink, muted, line, accent, accent2, accent3, accent4, pos,
  neg, shadow, onAccent. Field = the canvas; surface = cards; ink = text on field and cards. A pack may add
  tokens (glow-flat adds violet, glow, core, deep, plum); builders that use extra tokens must fall back in other
  packs (`Loom.glow.token`).
- `fonts`: display/body/mono families + `faces` (each face: family, weight, woff2 file, @fontsource
  package). Add a font with `npm install @fontsource/<name>` and list its faces. Optional `roles` maps a
  type role to another face, e.g. `"roles": {"label": "mono", "caption": "mono"}` (the engineering pack), or to an
  extra face key such as `"serif"` (chalk-lab sets labels in Fraunces).
- `type`: [min, max] px per role. Floors: body >= 28, label >= 24, caption >= 20 (the lint enforces).
- `shape`: radius, stroke, `shading` (crescent | paper | flat | sketch | line | toon | gloss), shadow (offset | none).
  `gloss` is the glow-flat look: no outline, a darker inner band at the bottom, one soft highlight and a light rim.
  `toon` is the outlined cartoon: flat fill, one crisp cel shade, a dark outline (`shape.outline`, a token,
  default ink) round every rect, disc and polygon. `line` is monoline art: every shape is one even outline, a
  coloured fill becomes the outline colour and the inside is the field, so text on it is ink (the line-art
  pack). Sketch options for rough.js (roughness, bowing, fillStyle, hachureGap, fillWeight, fillOpacity). In
  sketch mode dark fills (contrast >= 7:1 with the field) are drawn as paper-filled outlines and knockout text
  colours (field, surface, onAccent) render as ink, because hachure lets the paper show through.
- `motion`: enter/move/exit/draw/count seconds, stagger, overshoot (false unless the register is playful;
  springy pops on cartoon people and small accents are for illustrated packs only).
- `ambient`: stars | paper | dots | grid | none (+ an optional CSS `wash`).
- `fx`: the shader layer (background nebula | aurora | mesh | paper | blueprint | drafting (a still grid for a dark sheet), intensity, grain, vignette,
  leak, colors as tokens). Grain stays near-off (D-100): finish is material texture in the drawing, a lesson
  opts in, judged on the encoded MP4.
- `captions`, `icons.stroke`, `characters` (skin tones; `hair_colors`, a list of natural hair colours, since
  hair must never be the ink token, which is light on dark styles (L-92); cloth/ink/mouth tokens; `extra`, the
  token for grey crowd figures), `join_default`, `music` (mood: warm_curious | calm_focus | serious | upbeat, root_midi).

## Cinematic packs (R-14)
`cinematic-noir` (near-black night, one warm key, serif titles) and `cinematic-dawn` (warm sunrise, layered
hills) are made for the depth stage (`ctx.depth`). A light pack with mid-tone accents fails the lint on
"readable text colour on accent": darken the accent until it holds 4.5:1 against `onAccent` (dawn did).
The lint also wants accent and accent2 at 3:1 on the field (they are used as large text), so on a light field
those two must be dark enough to read; keep light accents (a lime, a pale teal) for accent3 and accent4
(story-cartoon and presenter-pop, R-21).

## Rules
- Every pack that lessons use gets a guide, `docs/styles/guides/<id>.md` (structure in
  `docs/styles/guides/README.md`), and the pack carries `"guide": "<that path>"`. A token change keeps the guide
  true in the same change. A guide compares versions within its own style only (D-122).
- Design language is structure and type, not only colour: change radius, shading, type contrast and
  motion personality together so the register actually changes.
- One accent, placed (every family): the accent marks the element the narration names (`accent_on`) and keeps
  one meaning; more than two saturated hue families in a frame warns. A pack is a tone setting as much as a
  drawing setting.
- Contrast is computed: run the lint and fix every line it prints:
  `py -c "from loom.checks.style_lint import lint_all; print(lint_all())"`
- Brand colours: map by ROLE (brand primary -> accent, not field) and re-run the lint; darken an accent
  that fails as text rather than dropping it.
- Use only fonts already in `node_modules/@fontsource` unless the person approves a download.

## Prove
Render the smoke lesson in the new style: set `"style": "<id>"` in a project's storyboard, `py -m loom
run <id> compose`, `py -m loom snapshot <id> --at ...`, and look at it. Run the lab strips in the new style
(`py -m loom lab lab_characters --style <id>`, also `lab_iso`, `lab_depth`, `lab_story_set`, `lab_matrix_build`,
`lab_one_board`) and `py tests/run_tests.py`. Measure the look against the references:
`py -m loom lab lab_story_set --style <id> --frames <dir>` then `py tools/style_fingerprint.py <dir>`
(`docs/research/2026-10-01-visual-study.md` has the reference numbers).
No browser where you are (the Cowork sandbox)? `py tools/lab_preview.py <scene> --style <id>` gives an approximate
strip for composition and colour (no blur, no WebGL, estimated text widths). It never replaces the Chrome render.
