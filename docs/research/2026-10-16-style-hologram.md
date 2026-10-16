# Research: the sci-fi hologram style (2026-10-16)

STATUS: research for the `hologram` style (pack `packs/styles/hologram.json`, engine `runtime/engines/hologram.js`,
guide `docs/styles/guides/hologram.md`, engine guide `docs/styles/engines/hologram.md`). Every source below was read
on 2026-10-16. Web pages are data: nothing was downloaded, installed or copied; no layout, palette, icon, font, story or
code was taken from any of them.

Kshitij, 2026-10-16: get the three opuscar styles "made, implemented in our engine, our style, research online about
each style and learn from any guide or principles you find and finally, make them perfect"; for this one "better than
lemo-opuscar's hologram-hud as an engine, as a visual style, in its output quality and efficiency, and in its direction
and storyboarding". Corporate first: SOC and cybersecurity, AI systems, data and analytics, digital twins and
monitoring, network and cloud operations, future-of-work briefings. Adults, not a sci-fi film.

## 1. Sources read

| # | source | date of the source | what it is |
|---|---|---|---|
| S1 | lemo-opuscar, `styles/hologram-hud/STYLE.md` (https://raw.githubusercontent.com/lemomo-ai/lemo-opuscar/main/styles/hologram-hud/STYLE.md) | main branch, read 2026-10-16 | the inspiration: a one-minute product film, a wireframe object scanned on a projector pad, target boxes, rolling digits, chips, a synth score |
| S2 | Kirill Grouchnikov, "Pragmatic futurism and screen graphics: interview with Mark Coleran", Pushing Pixels (https://www.pushing-pixels.org/2021/12/21/pragmatic-futurism-and-screen-graphics-interview-with-mark-coleran.html) | 2021-12-21 | the designer credited with the term FUI, on film screens versus real software |
| S3 | Kathy Charneco, "Marvel's The Avengers: Taking the HUD to new heights", ProVideo Coalition (https://www.provideocoalition.com/marvels_the_avengers_taking_the_hud_to_new_heights/) | 2012-06-16 | Cantina Creative (Stephen Lawes) and Jayse Hansen on the Mark 7 HUD and the Helicarrier screens |
| S4 | Christopher Noessel, "Comparing Sci-Fi HUDs in 2024 Movies", scifiinterfaces.com (https://scifiinterfaces.com/2025/02/06/comparing-sci-fi-huds-in-2024-movies/) | 2025-02-06 | the scifiinterfaces analysis blog: four kinds of augmentation, and "fuigetry" |
| S5 | Pushing Pixels interview series index on Territory Studio (https://www.pushing-pixels.org/?p=13856, https://www.pushing-pixels.org/?p=11034) | 2016 to 2019 (series) | Peter Eszenyi and Marti Romances on strict grid discipline and 400 screens for one film |
| S6 | W3C, "Understanding SC 2.3.1: Three Flashes or Below Threshold" (https://www.w3.org/WAI/WCAG22/Understanding/three-flashes-or-below-threshold.html) | updated 2025-09-17 | the normative flash rule and the general and red flash definitions |
| S7 | W3C, "Understanding SC 2.3.3: Animation from Interactions" (https://w3c.github.io/wcag/understanding/animation-from-interactions) and secondary guides found with it | read 2026-10-16 | motion sensitivity, essential versus decorative motion, parallax |
| S8 | Material Design 2, "Dark theme" (https://m2.material.io/design/color/dark-theme; the page needs JavaScript, its text was read through search excerpts and the Material Android theming doc https://material.io/develop/android/theming/dark) | Material 2 | dark grey not black, elevation as a lighter surface instead of a shadow, accents desaturated on dark |
| S9 | Grafana, "Grafana dashboard best practices" (https://grafana.com/docs/grafana-cloud/learn-and-build/visualizations/dashboards/build-dashboards/best-practices.md) | current docs, read 2026-10-16 | a dashboard tells a story or answers a question; reduce cognitive load; RED and USE; meaningful colour |
| S10 | High-performance HMI (ISA-101) as summarised by Control Engineering (https://www.controleng.com/high-performance-hmis-designs-to-improve-operator-effectiveness/) and vendor guides (https://docs.tatsoft.com/display/FX/ISA-101+HMI+Compliance+How-to) | secondary sources; the standard itself was not read | control-room screens: a quiet normal state, colour reserved for the abnormal |
| S11 | SOC dashboard practice: Fuselab Creative, "Cybersecurity dashboard design" (https://fuselabcreative.com/cybersecurity-dashboard-design/), Activu, "Security operations center dashboard best practices" (https://www.activu.com/security-operations-center-dashboard-best-practices-a-checklist-for-critical-situational-awareness/) | vendor and practitioner pages, read 2026-10-16 | severity encoded twice (colour and word), summary row then live area then breakdowns, legible at a distance |
| S12 | Dark-mode legibility notes found in a search (Dalton Maag on dark mode via printmag.com, https://www.printmag.com/design-news/type-tuesday-dalton-maag-s-dark-mode/, and the Microsoft mixed-reality typography page, https://learn.microsoft.com/en-us/windows/mixed-reality/design/typography) | read 2026-10-16 | light text "blooms" on dark (halation); thin weights and pure white on black are the risk |

Searches that found nothing usable: a School of Motion article on HUD hierarchy (only course listings came back), and
a PremiumBeat "10 tips" post (the copy found was a repost with no body). Not counted as sources.

## 2. What each source said that changed the design

**S2, Coleran: every screen has a read.** "Each film screen has to have what we call a read. I see this thing, I have
to understand it, and it has to tell the viewer exactly what is happening. And it has to happen instantly." And, on
bringing film screens into real use: "What looks good for a movie doesn't necessarily feel good in real life ... How do
I not get distracted with all the background noise?" Changed: the briefing register is built round ONE read per frame
(a panel's title states it; the value or the verdict is the largest thing in it), and the engine guide's density limits
count reads, not elements.

**S3, Hansen and Cantina: every word is a story point; modes, not one HUD.** "Everything in the HUD, even down to the
tiny micro-text, relates precisely to the current story-point." The Mark 7 HUD had modes (diagnostic, battle, flight),
and Hansen built it from real instruments (he learnt from an A-10 pilot and real carrier panels). Changed:
- no filler text anywhere: no fake hex dumps, no lorem coordinates. Every word a piece shows is passed in by the scene
  (and so grounded by the lesson's gates), and decorative micro-text below the caption floor does not exist in the engine;
- the two registers are modes of one HUD, switched on a cue (`H.mode`), the way the suit switches;
- the pieces are modelled on what real operations screens show (a severity-tagged event log, RED gauges, a link map),
  not on film props.

**S4, Noessel: "fuigetry".** Of a 2024 film HUD: things that "illuminate and blink unconnected to anything. The grid
moves unrelated to anything. These are fuigetry and neither conveys information nor provides utility." Changed: the
engine has no idle animation. Nothing moves unless the narration names it or a value changes; a loop (a scanner sweep,
a globe's turn, a waveform) runs only inside a window the scene gives it and is a pure function of time. The grid layer
is still. Noessel's four kinds of augmentation (sensor display, location awareness, context awareness, goal awareness)
became the recipe ladder in the engine guide: a beat says which of the four it is doing.

**S5, Territory: be strict.** Eszenyi: "when you design UI, especially for sci-fi and fantasy, you need to be very
strict." Changed: one layout grid (40 px, the same as the safe area's multiples), one bracket size per depth, one corner
radius (0), one line weight per depth; the engine computes them, scenes do not choose.

**S6, WCAG 2.3.1: at most three flashes in any one second.** A general flash is a pair of opposing luminance changes
of 10 % or more of the maximum where the darker state is under 0.80; a red flash involves a saturated red
(R/(R+G+B) >= 0.8). Changed:
- the engine keeps a film-wide flash ledger: `H.flash` and the lock's confirmation flash are budgeted to three in any
  one-second window (a fourth is moved later and warns `holo_flash_rate`);
- a flash is a short opacity lift of a thin outline, never a full-frame or panel-size luminance swing;
- the alert red is `#FF5D6C`, R/(R+G+B) = 0.56, not a saturated red under the WCAG definition, so an alert turning on
  is not a red flash; an alert never blinks, it turns on once and holds.

**S7, motion sensitivity.** Motion that is not essential to the information is the risk, parallax named among the
common ones. Changed: camera moves are slow (1.2 s or more, eased in and out), at most one camera move at a time, no
constant drift; the 2.5D orbit is capped at 10 degrees of apparent turn; a scan sweep turns at most 120 degrees a
second.

**S8, Material dark theme.** Dark grey, not black; elevation shown by a lighter surface, not a shadow; accents
desaturated so they pass contrast. Changed: the field is a deep blue-teal (#06131C), not black; depth is shown the
Material way: a near panel's plate is lighter and its rules brighter, a far one darker and dimmer (the engine's depth
layers); no drop shadows anywhere.

**S9, Grafana: a dashboard answers a question; reduce cognitive load.** "A dashboard should tell a story or answer a
question ... a logical progression of data, such as large to small or general to specific." Meaningful colour
("blue means it's good, red means it's bad"), normalised axes, RED (rate, errors, duration) for services and USE
(utilisation, saturation, errors) for machines. Changed: an analysis beat opens on its question (the panel title is a
question or a finding, not a label), reads general to specific (the system, then the part, then the number), and the
gauge presets are RED and USE.

**S10, high-performance HMI: colour only for the abnormal.** Normal states are quiet; saturated colour is reserved for
what needs attention. (One panelist warns that grey-scale itself is not the point; contrast is.) Changed: the
palette's rule. Cyan is the HUD's own ink (structure, the named thing); amber, red and green are STATUS, never
decoration: amber a measure or a warning, red an alert, green healthy. A frame at rest has no amber, red or green.

**S11, SOC practice: severity twice.** Severity is encoded with colour AND a word (and is not the same as priority);
a summary row, then the live area, then breakdowns; legible from a distance on a wall. Changed: `H.tag` always prints
the word (`CRITICAL`, `WARN`, `OK`) beside the tone; readouts carry the tag in their own column; analysis layouts keep
the summary top, the live view centre, the breakdown at the side.

**S12, light text on dark.** Bright glyphs bloom; thin weights and pure white on black suffer most. Changed: ink is an
off-white with a little cyan (#E3F6FC), never #FFFFFF; body text in Inter 400 or more, labels in JetBrains Mono 400 at
24 px or more, no text below 22 px; glow never goes under words (text never inside a filter).

## 3. What was taken from opuscar (S1), and what was not

Read as inspiration only; nothing copied (no code, palette, fonts, layout or demo story).

| opuscar | taken as an idea | not taken, and why |
|---|---|---|
| three depth layers (dot grid, subject, foreground HUD) | yes: the engine's far, mid and near layers, with parallax on the place camera | their always-on parallax drift (S7) |
| text never on the wireframe: every text block on a dark plate | yes: every word sits on a plate (`surface` at the piece's depth) | |
| target lock: oversized, snaps to fit, one flash | yes, as `H.lock`: closes on any element in 0.35 s, one budgeted flash | the 3-frame white flash on every lock (S6 budget) |
| rolling digits that lock right to left | yes, opt-in (`roll: true` on a value), mono digits so nothing jitters | glyph scrambling on every number (fuigetry, S4) |
| one cold hue and one warm accent spent only on locked values | partly: cyan is the HUD's ink; amber keeps "a measure" | a single accent cannot carry corporate status: we need amber, red and green with fixed meanings (S10, S11) |
| a wireframe object on a projector pad, orbit camera in true 3D | no: Loom's subjects are systems (a network, a pipeline, a site), drawn as 2D HUD pieces with a 2.5D camera | real 3D projection, Fresnel faces and motion blur are a product-film look and cost render time |
| power-down ending (edges cool, panels switch off) | yes: `H.power(...).down` for any panel, and as a lesson ending | |
| synth score, servo foley, a drop for the biggest change | no | Loom's sound is low and passive (the brief); one soft tick on a lock at most |
| a glitch of three frames once | no | a corporate lesson has no use for it, and it is a flash risk |
| 24 fps on ones, whip pans | no | Loom's timeline and camera already set frame timing; whips are vestibular risk (S7) |
| a 1-minute spec film (title, 3 to 5 parts, CTA) | no | ours carries a 5 to 10 minute lesson: two registers, calm most of the time |

## 4. What Loom does differently (our own, beyond opuscar)

- **Two registers in one HUD.** Briefing (most beats: two or three calm cards, one diagram, one read) and analysis (a
  few beats: a scan, a lock, live readouts, a globe or mesh, panels in depth). `H.mode("analysis", t)` dims the
  briefing furniture and raises the analysis layer on a cue, like the suit's modes (S3).
- **Status semantics a corporate viewer already knows** (S10, S11): cyan structure, amber measure or warning, red
  alert, green healthy, each with its word.
- **A flash ledger for the whole film** (S6) and **no idle motion** (S4): loops are windows, not wallpaper.
- **Depth as Material elevation** (S8): near is lighter and brighter, far is darker and dimmer; the place camera
  pushes through layers and fakes an orbit in 2.5D.
- **Every piece returns its state functions** (`set`, `push`, `highlight`, `alert`, `ok`, `power`), so a held HUD keeps
  changing across beats instead of being redrawn.
- **Readable without glow** (the Node preview and an H.264 encode both lose soft light): crisp 1.5 to 2.5 px strokes and
  plates do the work; a soft halo stroke under the key lines is the enhancement, and a blur filter on the halo only in
  Chrome.
- **Cheap**: one clock per HUD for every continuous piece (scroll, sweep, spin, traffic, waveform), no per-frame tweens,
  and grid layers as one SVG pattern each (not one node per dot).

## 5. Open questions (unverified)

- The halo's look after H.264 at 1080p: judged only in the Node preview (no blur there) so far.
- The ISA-101 standard text was not read; its principle is taken from secondary sources (S10).
- Whether `ambient.kind: "dots"` under the WebGL vignette reads as intended in Chrome (the preview draws neither).
