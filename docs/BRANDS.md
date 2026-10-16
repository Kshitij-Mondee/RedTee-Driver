# Brand on any style (and the Loom Studio)

A **style** is the look: drawing grammar, shapes, motion and type sizes. A **brand** is an organisation's
colours, fonts, logo and house rules, layered on top of *any* style. Whiteboard stays hand-drawn and line
art stays monoline; the brand only swaps colour tokens and faces and adds the logo. Nothing here uses a
model, and the same inputs always give the same frames.

## Quick start
```
py -m loom studio                                    # http://127.0.0.1:8820  (brand kits, lessons)
py -m loom brand list
py -m loom brand lint harbor-labs                    # every style: readable? which shade fixes it?
py -m loom brand preview harbor-labs --styles engineering,line-art
py -m loom restyle <lesson> --style engineering --brand harbor-labs --as <copy-id>
```
`packs/brands/harbor-labs/` is a **fictional** demo brand. Copy its structure for a real one.

## The brand file: `packs/brands/<id>/brand.json`
| field | what it does |
|---|---|
| `colors.primary / secondary / tertiary` | override the style's `accent` / `accent2` / `accent4` tokens |
| `colors.text / background` | override `ink` / `field` (and derive `field2` and `surface2`). Use with care: this changes the style a lot |
| `fonts.display / body / label` | `{family, weight}` from the font registry (the `@fontsource` packages the engine ships), or `{file: "fonts/x.woff2"}` uploaded. `label` also sets captions |
| `logo` | `{file, file_dark?, placement: top-right, top-left, bottom-right or bottom-left, height, show: always or intro_outro}` |
| `rules.captions` | `on` / `off` overrides the lesson's own setting; `null` lets the lesson decide |
| `rules.notes` | free text shown to creators |
| `locks` | `{locked, by, at, fields}`: a locked brand refuses changes to those fields until it is unlocked |

A role left `null` keeps each style's own colour, so a brand can be as small as one primary colour.

## What is checked, and where
- **Contrast in every style:**
  - `lint_matrix` merges the brand into each style and runs the style lint: body text, text on cards,
    secondary text, accents and readable text on each coloured fill.
  - Each failure gets a **suggested shade**: the nearest lightness of your own colour that passes.
  - The Studio applies it in one click. It changes the colour for every style, so the matrix re-runs.
- **The storyboard gate refuses an unreadable merge.** A lesson cannot be composed with a brand whose
  colours fail in that lesson's style.
- **The logo band:**
  - The logo lives outside the content area: the 84px band above it (height up to 56px) or the corner of
    the band below it (up to 96px).
  - A top-left logo moves the section label to its right on the same line.
  - On a dark field the `file_dark` variant is used. Without one, the logo sits on a small white plate, so
    a dark wordmark can never vanish.
- **Fonts change widths,** and the measured-layout checks (`docs/LAYOUT.md`) re-run on every compose.

## Restyle (`py -m loom restyle`)
1. Set the lesson's style and/or brand. With `--as <id>`, a copy is made first and the original is
   untouched.
2. Re-accept the storyboard, which includes the brand gate.
3. Keep the narration when the joins are unchanged (the look never changes the audio).
4. Recompose. Manim beats are reused when the colours they read are unchanged; otherwise they are
   redrawn as quick DRAFTS for this preview (`docs/MANIM.md`), made at full quality by check and render.
5. Run the **quick check**: runtime probe, measured layout, sample-text audit and lints.
6. Snapshot 6 frames (`qa/snapshot.jpg`).
7. Write a tweak task for every failing beat, and append a line to the lesson's RUN_LOG.

The full check (HyperFrames sampling and contact sheets) still runs before a render. The Studio's Render
button does check, then render.

## The Studio (P0)
- **What it is:** a local web app, standard library only, bound to 127.0.0.1 with no login (P0).
- **Brand kits tab:**
  - colours with live contrast checking across every style;
  - fonts from the registry;
  - logo upload, including a dark-background variant;
  - placement and height (capped so the logo stays out of the content);
  - house rules, and lock/unlock with a name;
  - a per-style preview render.
- **Lessons tab:**
  - pick a style and a brand;
  - it warns and blocks when that brand is not readable in that style;
  - Apply look (optionally on a copy) shows the 6 frames and any beats that need a fix;
  - Render video.
- **How work runs:** as `python -m loom` subprocesses, so the UI stays responsive.

Evidence and screenshots are in `docs/styles/demos/2026-09-30_*`.

## Not in P0 (next)
- a per-course style and brand lock;
- per-style colour overrides, for when one brand colour cannot pass in every style;
- uploaded fonts through the Studio UI (the API accepts `.woff2`; the picker lists only registry fonts);
- logo animation;
- auth and roles, so only an admin can unlock;
- an image-to-brand extractor.
