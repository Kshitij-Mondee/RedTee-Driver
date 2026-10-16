# Stress test: blueprint, screencast, hologram, isometric (2026-10-16)

Kshitij, 2026-10-16: "inspect them all and try to render difficult and detailed frames from each of them, around 3 per
style and then get back to me with the jpg. I want to see how our implementation of these styles look and if they can
handle complex designs and visuals."

One hard lab scene per style, written to the engine guides with real API calls only. One agent wrote each scene and
fixed its own authoring mistakes over 3 to 4 rounds; no engine file was changed. The frames are the three busiest
moments of each scene, at 1920 x 1080. The orchestrator looked at all 12 full size. The ratings are the orchestrator's
judgement of each frame for a corporate L&D lesson. Styles are not compared with each other (D-122); each is judged
against its own purpose.

- Scenes: `blueprint_stress.js`, `screencast_stress.js`, `hologram_stress.js`, `isometric_stress.js`
- One JPG per style: `<style>_stress_3frames.jpg`; all four: `all_four_styles_stress.jpg`
- Full-size frames: `out_<style>/frames/`

| Style | Frame | What it shows | Rating | What is wrong |
| --- | --- | --- | --- | --- |
| blueprint | 1 (30.35 s) | load balancer, plan view: 6 balloons and a parts list, 4 dimensions (one live), section A-A, hatching, fans turning, a PSU sliding | 7.5 | `D.fig`'s double underline cuts the subtitle (every figure); the "hot air out" leader crosses PSU A |
| blueprint | 2 (58.2 s) | request path: 8 components, 7 labelled connectors, 4 requests in flight, title block | 7 | connector labels float away from their lines (a label sits at the path's midpoint plus an offset) |
| blueprint | 3 (92.4 s) | teaching: 3 cards, a revision cloud, a proposed tracing overlay, general notes, stamp | 6.5 | `D.cloud`'s delta triangle overlaps its scallops; card lettering is widely spaced and harder to read; the person is a Lucide icon (no blueprint people); "2 OF 3" on figure 3 (the scene's slip) |
| screencast | 1 (6.95 s) | code editor: tree, tabs, 20 lines, edited markers, a highlighted line, a callout | 4 | there is no code region: the code is a table in a proportional font, with no syntax colour and the indentation lost (`kit.text` splits on whitespace), no caret; the right column is cut at the frame edge |
| screencast | 2 (21.45 s) | terminal deploy beside a release dashboard, health checks, a click, a toast | 6 | the terminal is a light table (header row, hairlines, a proportional font): it does not read as a terminal; no chart region; cards cannot update |
| screencast | 3 (35.0 s) | SaaS admin: settings toggles, a 9-row table with avatars, three numbered callouts, a toast | 7 | four overlays at once (the guide says 2; not warned); callout 1 covers a tab; the toast covers rows; `A.step` badges fail `tight_inset` (4 errors) |
| hologram | 1 (12.4 s) | command centre: globe with arcs and six points, ranked panel, signal trace, radar, gauges | 7 | arcs and traffic draw over point labels ("Frankfurt", "Mumbai"); six points crowd the rim; three loops at once (`holo_loops`, kept on purpose) |
| hologram | 2 (29.0 s) | LLM explainer: 28-node layer mesh, token stream, attention, next-word odds, confidence | 6 | no bar piece: the odds bars are empty outlines and the small ones are slivers; the highlighted attention link barely stands out; the lower centre is empty |
| hologram | 3 (42.5 s) | three tiers with a callout, an approval card, a who-does-what panel, a presenter | 6 | the presenter is a full-colour cartoon rig (no hologram people), which breaks the look; `H.flow` column arrows point down while the data flows up |
| isometric | 1 (12.0 s) | cloud region: cut-away hall of racks, pod, three halls, cooling, power, vans, fibre pulses, a tracked request, legend | 7.5 | the request's air route draws on top of the buildings; the floating gateway cloud has no height cue, so it looks stuck to Hall B |
| isometric | 2 (24.6 s) | warehouse flow: four stations with live bars, moving crates, the slow station highlighted, queue count, note card | 7 | three pins crowd the Pack station; `iso_order` warns 28 times on crates that are never there at once (the check ignores when an item leaves) |
| isometric | 3 (37.4 s) | operations room: 5 desks, 6 people, wall dashboard, duty lead, a link to the warehouse, legend, note | 7 | people are faceless pictograms (no isometric character kit); the dashboard is two plain boxes (no screen kind) |

## What each style can and cannot do yet

- **Blueprint** handles dense technical drawings best of the four: real drafting conventions, readable at full density.
  Limits: one pen for the film makes dense sheets slow (about 92 s of drafting for three sheets; figures, balloons and
  dimensions cannot be sped up); hyphens draw as long dashes in `D.letter`; the stamp box is narrower than its word; no
  people.
- **Screencast** is credible for SaaS and admin screens. It is weak for developer content: it has no code editor, no
  terminal and no chart region. The page clips (D-176) already render real code (Shiki) and a real terminal (xterm), so
  the screencast engine could use them.
- **Hologram** does command-centre density well. It lacks a bar piece and hologram people. Emphasis in a dense frame
  (one link among fifty, a warning row) relies on colour alone.
- **Isometric** produces the most polished dioramas, with correct depth in all three. It lacks people with any detail,
  a screen object and a height cue for floating things. Its order check is blind to time.

## Engine findings to fix (none changed in this test)

1. blueprint: `D.fig` underline crosses the subtitle; `D.cloud` triangle overlaps the scallops; `titleBlock.stamp`
   default width; hyphens in `D.letter`; `by` and `quick` do not apply to figures, balloons and dimensions; connector
   labels only at the midpoint.
2. screencast: a code region (mono, syntax colour, indentation, caret) and a terminal region; a chart region; `A.cell`
   on cards; a warning past two overlays; `A.step` badge inset; the zoom-text warning skipped when `scale` is given.
3. hologram: a bar piece; `panel.set(..., "warn")` with a word, not only a colour; `M.linkStatus` with weight; labels
   over globe arcs; `H.flow` direction; per-gauge decimals; space between value and unit; the scanner blip label.
4. isometric: `iso_order` aware of when items leave; air routes and floating things with a height cue (a shadow, a
   stem); a screen kind; `B.stack`'s pin anchored to an item.
5. All four: people. Hologram, blueprint and isometric have no character kit in their look (A-07 for isometric).

Not verified: motion between the sampled frames, an MP4 encode, and these scenes inside a composed lesson with its
checks.

## After the fixes (2026-10-16, D-187)

All findings above were fixed (see CHANGELOG), and hologram and blueprint got wow passes. Before and after sheets:
`<style>_before_after.jpg`; the hero moments: `hologram_wow_hero.jpg` and `blueprint_wow_hero.jpg`. Every "after"
render has the pack's shader layer on.

Left, small:
- **screencast:**
  - the toast covers the chart's x labels;
  - the zoomed editor runs off the right edge;
  - a highlight hides the diff tint;
  - the tokenizer has no multi-line state;
  - `sc_lesson`'s toast zoom warns about small text.
- **hologram:**
  - the drone reads thin;
  - six globe points warn by design;
  - the glow after H.264 is unknown.
- **blueprint:**
  - the chain shows faintly through its sprocket;
  - a moving part's paper turns solid instead of being masked;
  - the hero glow is subtle;
  - "sheet on the table" is a shader option still to add.
- **isometric:**
  - a stem ignores moving things under it;
  - the pin crowd check runs at first appearance only;
  - leaders can cross solids;
  - a floating subject's ring stays on the ground.

People kits are designed art for all three styles.
