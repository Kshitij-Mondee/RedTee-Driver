# lemo-opuscar explained: why it is fast, what its architecture has that Loom lacks, and which of its styles fit Loom (2026-10-15)

STATUS: STUDY 2026-10-15. Research only; nothing built. Follows `2026-10-15-lemo-opuscar-study.md` (same session).

**Kshitij's framing for this note (2026-10-15):** lemo-opuscar is **not a benchmark**; many of its outputs are not up
to the mark. It is made for short films; **Loom will not make films**. So this note reads it for understanding and for
the parts that fit corporate L&D, and does not score Loom against it. Within-style pairs only (D-122).

Evidence: the repo at `fdc46d7` (scratchpad clone), its `DEMO.md` build notes, and Loom's own run logs
(`projects/gps-position/RUN_LOG.md`, `projects/https-private-v2/RUN_LOG.md`, RUNS R-55). The "10 to 12 minutes per
finished minute" figure is Kshitij's experience; their README says "about 30 to 60 minutes" a film. Neither was timed
here (none of their code was run).

---

## 1. Why their videos get made so fast

The time per finished minute, as far as we have numbers:

| | time | film length | per finished minute |
|---|---|---|---|
| lemo-opuscar (Kshitij's experience) | 10 to 12 min | 1 min | 10 to 12 min |
| lemo-opuscar (their README) | 30 to 60 min | 30 to 60 s | 30 to 60 min (includes setup) |
| Loom `https-private-v2` (Shuttle) | 71 min | 2:24 | about 30 min |
| Loom `gps-position` (Shuttle) | 159 min | 4:41 | about 34 min |
| Loom `https-private-shuttle-api` (R-55) | 152 min | 2:03 | about 74 min |

It is not one trick. Eight things stack, roughly in order of how much time each saves:

1. **One agent holds the whole film in one head.** The same agent that writes the treatment writes every line of
   drawing code, the score and the mix. Nothing is handed over, re-briefed or re-read. Loom's gps-position took
   **1,000 model calls, 339 looks and 15 scene authors** for 34 beats: every hand-over costs a brief, a cold read of
   the context and a chance to misunderstand (the held_missing round alone was 23 minutes and $3.5).
2. **The hard part of each style is already solved, as code.** Every style ships a working engine in its demo:
   whiteboard's `wb.js` (487 lines: hand-drawn strokes, single-line font written in stroke order, floating pens,
   a timeline that solves pen speed to hit a deadline, eraser, board, camera), dataviz's `engine.js` (paper, pencil,
   ramps, pinned notes, morphs), iso's `engine.js` (projection, depth-sorted queue, three-tone faces, cutaways,
   Isotype grids). The agent reads it after its treatment and builds on the technique. So a film is "the story layer"
   on top of a solved engine, not an engine invented per film.
3. **No gates that send work back.** Their checks either report (12 `cuecheck.py` copies never exit non-zero) or are
   never wired (readcheck, FACTS). Loom's gps-position ran 6 full check rounds (26, 4, 4, 0, 5, 0 errors) and 3
   reopens; the first https-private spent 133 minutes in checks. Loom's checks are why its films are correct; they are
   also most of its wall clock.
4. **No planning chain, no approvals.** One `TREATMENT.md` replaces brief, knowledge sheet, pedagogy, persona, script,
   allocation and storyboard, each of which in Loom is a separate model stage with a schema and a gate, and
   knowledge waits for a human approval.
5. **Short, simple structure.** 50 to 110 s, usually one world (one board, one chart, one diorama) and 6 to 10 shots.
   Loom lessons are 2 to 5 minutes and 18 to 34 beats, each authored and checked, then joined into one world.
6. **Work in parallel.** The score is "forked to a music sub-agent with the cue map" while the main agent draws
   (art-deco, dark-keynote, hologram-hud, microgame, midcentury-toon, pixel-rpg, rubber-hose, woodcut, engraving
   say so in their build notes). Loom's music is code, not an agent, so this is less relevant; its scene authors do run
   in parallel already.
7. **A fast iteration loop.** A full rebuild (voice, whisper, score, events, mix, captions, render, mux) takes **about
   1.5 to 2 minutes** (dataviz, iso, microgame build notes). Renders: 1,100 to 1,400 frames in 25 to 80 s with 2 to 4
   browser workers, because each frame is one Canvas 2D `render(t)` call plus a JPEG screenshot. Loom's render took
   3 to 14 minutes for those lessons, on top of compose and the Chrome probe; seeing a fix takes longer.
8. **One strong model throughout.** Opus 5.5 writes everything ("the styles are tuned for Opus 5.5"). Loom puts Sonnet
   on scene drawing for cost and pays part of it back in looks and fixes (about 17 k output tokens a beat in
   https-private-v2).

**What their speed costs**, in Loom terms: no fact grounding, no teaching plan, no gates that fail, no layout
measurement, no reuse between films, and outputs whose quality varies with the agent's run (which matches Kshitij's
"not up to the mark").

**What Loom could take from this without giving up its gates** (proposals, pending):
- **S1. Style engines as kits.** Give each style a tested engine for its hard part (write-on lettering and pen
  timing for whiteboard; pinned notes and morphs for data; cutaways and Isotype for iso), so scene authors only stage
  the story. This is item 2 above, and it fits D-163 (reuse or build per style).
- **S2. A faster look loop.** A draft render of one beat in seconds (their still and video tools are thin wrappers on
  Playwright screenshots), so an author sees its fix without a full compose.
- **S3. Fewer hand-overs for small lessons.** A single-author path (one model writes all beats of a short lesson with
  the storyboard in context, gates unchanged) is a Shuttle option to measure, not a replacement: keep both and let the
  person choose (D-70). A measured run is needed before any claim.

## 2. Is it architecturally better? What does it have that Loom does not?

**For its job, its architecture is right-sized; for Loom's job, it would be wrong.** It is "a thin harness with thick
knowledge": about 2,100 lines of shared tools, 4,600 words of directing guides, 43 style documents and 43 reference
engines, and one agent trusted to follow prose. Loom is "a thick harness": a 14-stage graph, schemas, gates, a
runtime, a library, logs. A 5-minute lesson that must be true and teach cannot be held by one agent's prose
discipline; Loom's structure is the right answer there.

Things it has, architecturally, that Loom does not (or has only in part):

| # | what | what it is in lemo-opuscar | Loom today |
|---|---|---|---|
| A1 | **An open render contract** | any page that exposes `render(t)`, `DUR`, `READY` (optional `EV`, `TEXTS`) is a film: Canvas 2D, WebGL2, three.js or DOM, chosen per film | partly: bespoke scenes run inside Loom's runtime and compose; Three, Skia and Manim come in as clips through bridges. There is no "any page" escape hatch for one beat |
| A2 | **One timeline drives picture, music, foley, captions and checks** | `timeline.js` (sections, tempo, beats, hit points) exported to JSON, read by the score, the mixer, the captions and cuecheck; the picture locks to the music grid | narration drives timing; music follows the edit (chord changes on section starts, D-47); sound events come from the runtime. There is no shared hit grid that music is written to |
| A3 | **A style is knowledge plus a working engine** | `STYLE.md` (11 fixed sections) next to a reference engine in `demo/` | a style is data (pack JSON) plus a guide (5 of 13 packs); the engine is shared runtime with 7 shading grammars. No per-style engine |
| A4 | **Knowledge loaded on demand** | the plugin sparse-clones the guides and style docs only; a demo's source is fetched with `setup.sh demo <slug>` after the treatment | skills and guides are read whole; no staged loading |
| A5 | **Speech-to-text check of every narration line** | `asr_check.py` (faster-whisper), plus word timestamps | none |
| A6 | **Reading-time check of on-screen text** | `readcheck.mjs` over `window.TEXTS(t)` (built, never used by their demos) | none for on-screen text; the caption-hold check is in progress in its own session |
| A7 | **A sampled-instrument score** | `sampler.py` over five free libraries, `pluck.py` for plucked strings | a synthesised bed |
| A8 | **Divergence by process** | treatment before reading the demo; the 4-of-6 "not the demo again" rule | the variety ledger and AI-tells lint, measured after the fact |
| A9 | **Distribution as a plugin** | marketplace install, tiered installs keyed by checksums, assets with sha256 on a release | a folder and setup scripts; account skill copies drift (L-80) |

**A1 in plain terms (asked by Kshitij, 2026-10-15).** Loom already renders some beats outside its runtime:
`kind: "three"` (`loom/three_bridge.py`) and `kind: "skia"` run a separate program in headless Chromium or skia and
bring the result back as a transparent WebM clip placed in a rectangle of the beat, cached in the shared clip store.
But each kind accepts only its own kind of program (a Three.js scene on `kit3d`, a skia script). The "any page"
idea is one more kind, say `kind: "page"`, whose file is any HTML page exposing `render(t)`, `DUR` and `READY`
(Canvas 2D, a WebGL shader, SVG, a chart or map library), rendered by the same clip path. The trade-off against a
bespoke scene: a clip is a sealed picture. The runtime cannot see inside it, so its parts cannot be held into the
next beat, the layout probe and text checks cannot read its words, a restyle needs a re-render, and the camera can
only move the rectangle. So it is for what the runtime cannot draw yet (a map, a simulation, a special effect), not
for normal teaching beats. Nothing built.

Things Loom has that it lacks entirely: fact grounding with approval, pedagogy, the stage graph with stale marks,
gates proven able to fail (455 tests), layout measurement, the element and design library, brand on any style and
restyle without model calls, model routing, budgets and cost reconcile, append-only logs and `context_check`, native
Windows.

The ones worth taking, in order: **A2** (a hit grid for music and sound, the base of a real score), **A5** (cheap,
catches mispronounced numbers and names), **A3** (style engines, which is also S1 above), **A1** (an escape hatch for a
beat that the runtime cannot draw, rendered as a clip like the Three bridge already does). A4, A8 and A9 are
conveniences.

## 3. Similar styles in both engines, and what Loom could adapt

Pairs below are within one style family: lemo's version against Loom's own pack, never style against style
(D-122). Only styles that serve corporate L&D are listed; the film-only ones (ukiyo-e, cel anime, silent film,
backrooms, rubber hose, spy titles, pixel RPG and the like) are out of scope.

### 3.1 Pairs that already exist in both

| Loom pack | closest lemo style | what lemo's spec does that Loom's pack or guide does not yet |
|---|---|---|
| **whiteboard** | whiteboard | single-line lettering **written in stroke order**; a timeline that solves pen speed so writing finishes on the spoken word; **floating markers with a cast shadow instead of a hand** (no hand art needed); the board as a map the camera travels, ghost marks of old lessons, a glossy sheen; **every stroke makes a sound**; an eraser that rewinds; the full-board view at the end. Loom's own guide lists the first three as its open gaps (`docs/styles/guides/whiteboard.md` sections 14 and 15: no single-stroke lettering, no drawing hand, no stroke order) |
| **line-art** | one-line | one continuous line, scenes that **morph instead of cut**, the camera following the nib, the pen's shadow as the only other object, a stop of the nib as an event, the line turning into a graph |
| **engineering** | blueprint | **drafting order** (the object draws itself as an engineer would), live dimensions that change, "FIG. 1" struck through to "FIG. 2: EXPLODED VIEW" as the transition, **the title block as story** (status field = verdict, revision rows = history: change control, incident timelines) |
| **dark-technical**, **chalk-lab** | dark-keynote, hologram-hud | generated accumulation (hundreds of tickets piling up, by rule), the snap grid (everything lands in one beat), **freeze** (the frame and sound stop: "the second before send"), a number that scrambles and locks, **target lock and local explode** on equipment (ports, sensors, parts), a loupe for two scales |
| **corporate-clean**, **presenter-pop** | swiss-motion | the grid **means** something (columns are weeks, rows are teams), snap = beat, extreme scale contrast (a giant number beside small notes), **re-flow** (everything rearranges around one change: a reorganisation), knife cut (a line deletes an item: budget cuts) |
| **editorial-paper** | halftone-dossier (as a register, used sparingly) | the **case file** frame for investigations and compliance: numbered exhibits, the evidence board, **the stamp** (APPROVED, EXPIRED), **redaction** bars that lift. Loud by nature: one beat or one chapter, not a whole corporate lesson |
| **story-cartoon** | midcentury-toon | **limited animation**: the body is a held drawing and only hands, eyes and mouth move, so a code rig cannot fail at full-body acting; **one hand action per step**; the **round call-out** as the close-up with the step's value in it; **numbered medallions** that open each step; "how to do" rather than "why". Closest to Loom's procedural training, and it lowers the character risk Loom keeps hitting |

### 3.2 Loom has the parts but no style for them

| lemo style | Loom parts that already exist | what a Loom style would add |
|---|---|---|
| **living-screencast** (software walkthrough) | `Loom.ui` window, field, button, toast, mail, inbox, chat, doc; `ui.cursor`, `m.cursorTo`, `m.tap`, `m.typeInto` | the grammar: a real UI redrawn (every label true to the product), the **cursor is the learner**, auto-zoom to the cursor or caret, a keystroke HUD, chapter pills, **spotlight freeze** on the one promise ("Saved", "Encrypted"), rack focus between panes, a time-lapse tag for long work. Software and systems training is one of the most common corporate L&D jobs; the parts are built, the style is not |
| **iso-infographic** (systems and processes) | `ctx.iso` boxes, tiles, grid, arrows, labels, painter's order; `Loom.data.unitGrid` (Isotype counts) | three tones per face from one base colour, **cutaway** (cut line, skin slides away, hatched rims), **focus and context** (everything greys except the subject), a tracked subject with a "you are here" ring, a circular inset, **scale reveal** ending on a finished infographic. Fits supply chains, how a process flows, how a site is laid out |
| **dataviz** (data storytelling) | `Loom.data.counter`, `barsOn`, `dipLine`, `unitGrid`, `tag`; dark-technical and chalk-lab packs | a **chart picker** (the data decides the chart), **the axis arrives when the unit is first named**, notes pinned in data space so rescales keep them, an encoding morph (bars into people), the **empty next cell** for an unknown value, and an honesty rule (never stretch a ramp). Fits KPI, safety-record and survey lessons; the numbers stay grounded by Loom's own gates |
| **pictogram-motion** (catalogue on the beat) | the icon grid template, `Loom.data.unitGrid` | not a style for Loom, a **template**: one card per item, one verb per pictogram, chapter = colour, an icon wall to recap. Fits "the 8 PPE items", "the 6 rules of the site", tool inventories |

### 3.3 What to adapt, in order (proposals, pending Kshitij; none built)

1. **Whiteboard mechanisms (closes Loom's own open gaps).** Single-stroke write-on lettering in stroke order, a pen
   speed solved to the spoken word, and **floating markers instead of a drawn hand** (their v2 dropped hands on
   purpose; Loom's guide is waiting on hand art that may not be needed), with stroke sounds. Then the board-as-map
   camera and the full-board ending. Proven within one style: Loom whiteboard against Loom whiteboard.
2. **A software-training register on `Loom.ui`.** A pack plus a guide for screencast lessons (section 3.2). New
   style, existing parts; high L&D value.
3. **An isometric systems register on `ctx.iso`**, with cutaway, focus and context, Isotype counts and the scale
   reveal.
4. **Data storytelling grammar** in the data templates (chart picker, axis on the unit, pinned notes, morph, empty
   next cell), usable from dark-technical, chalk-lab, corporate-clean and editorial-paper alike.
5. **Limited animation and step grammar for story-cartoon** (held body, one hand action per step, call-out,
   numbered medallion), for procedures.
6. **Blueprint conventions for engineering** (drafting order, title block revisions, exploded view), for change
   control and incident lessons.
7. **Add three sections to every Loom style guide**: a **sound palette** (none of the five guides mentions sound,
   music or foley: 0 matches each), a **camera grammar** table (move, what it expresses, what it can serve) and
   **native moves** (each with "fits content like" examples). This is where lemo's style documents are ahead; in
   palette roles, failure modes and checklists Loom's guides (55 to 65 KB each) are already deeper than lemo's (11 to
   13 KB).

**Correction to the study** (`2026-10-15-lemo-opuscar-study.md`, item 8.1.4 and P-d): it said Loom's packs "mostly
change colours and shading over one grammar", repeating the 2026-10-02 finding. That predates the five style guides
(2026-10-07 and 08, 17 sections each). The true gap is narrower: sound palette, camera grammar and native moves (item
7 above), and per-style engines (A3).
