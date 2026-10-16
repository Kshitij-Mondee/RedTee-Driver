# What Loom can already do (for `loom_map`, `closest_loom_pack`, `loom_status` and `what_loom_lacks`)

Loom draws every frame with code (SVG and GSAP in a headless browser, plus Manim, Skia and three.js clips). It does
not generate images and cannot hand-paint. Judge `loom_status` against this list.

- **Packs (looks):** flat-cosmos (flat, saturated, dark field); glow-flat (saturated flat with glow, gloss
  shading, Kurzgesagt-like); story-cartoon (outlined people in a place); editorial-paper (paper texture,
  muted); chalk-lab (one board, chalk lines); line-art (outlines only); corporate-clean (light, plain);
  engineering (blueprint, technical); presenter-pop (one diagram that fills the frame); cinematic-noir (dark,
  moody); cinematic-dawn (warm cinematic); dark-technical; whiteboard.
- **Shading and texture:** flat, toon or cel with outline, gloss, sketch, line; paper or grain finish (kept near
  off by default).
- **Joins:** cut, camera move between stations, travel, zoom, iris, wipe, dip, fade, continue (hold the
  picture and change it), canvas. Meanings: into, time, era, meanwhile, shock.
- **Shot sizes:** establishing, wide, medium, close, insert, overhead, pov. **Moves:** push, pull, pan; a camera
  on one element (frame a part, follow it).
- **Motion:** reveal, settle, pop, stamp, draw-on, unmask, typewriter, springs, staggered groups, morph-like
  hold-and-transform (lift, heat, peel), travel along paths, counters, charts that build, particles, ambient
  drift.
- **Characters:** 2D rigs with poses, gestures, blinks and lip sync (code-drawn people, imported Claude
  Design characters such as Maya). Walk cycles are basic. There is no frame-by-frame character animation.
- **Places:** office, meeting room, server room, warehouse, inside a body; built in depth layers with
  parallax.
- **Objects:** document, envelope, calendar, clock, phone, laptop, folder, package, building, heart, bulb,
  lock; each has families and states.
- **Data and maps:** bars, unit grids, dip lines, counters, real geography (world map, globe).
- **UI:** mail, inbox, chat and document artefacts with real words; cursor and typing.
- **Sound:** the narration (Kokoro text to speech, with word timings); music from a library chosen by mood, ducked
  under the voice; synthesised sound effects (click, key, card, land, reveal, success, error) placed by the motion
  itself and mixed in the music's key.
- **Templates:** title, definition, quote, list, icon grid, recap, quiz and others: text-led cards.
- **Not possible or weak today:**
  - painterly or brush-textured illustration, hand-drawn line boil and organic frame-by-frame morphs;
  - complex character acting or full-body animation;
  - detailed illustrated backgrounds at TED-Ed density (only with imported assets).
