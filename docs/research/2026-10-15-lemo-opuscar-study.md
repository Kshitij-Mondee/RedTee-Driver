# Study: lemo-opuscar (an open film-style library for coding agents), dissected and compared with Loom (2026-10-15)

STATUS: STUDY 2026-10-15. Research only. Nothing in Loom's code or render path changed. Every proposal at the end
is pending Kshitij (none built).

**Studied:**
- `github.com/lemomo-ai/lemo-opuscar` at commit `fdc46d7` (2026-10-13), shallow-cloned into the session scratchpad
  (outside Video-Engine; nothing of it is vendored here). 1,760 files, 176 MB checked out.
- Read in full: `README.md`, `AGENTS.md`, `DIRECTOR.md`, `TECHNIQUE.md`, `MAINTAINING.md`, the plugin skill and
  `setup.sh`, every file in `core/render/`, `core/tts/`, `core/audio/sfx.py`, `core/lib.js`, the head of
  `core/audio/sampler.py`, `tools/release.py` (head), `tools/publish.sh`, `tools/web_cuts.sh`,
  `styleboard/build.py` (head), the Pages workflow, the style template, `.gitignore`.
- The 43 style folders were surveyed by a read-only sub-agent (structure, rendering tech, reuse, audio, rigs);
  its findings are folded into section 5 and marked where they rest on its reading.
- Looked at: the gallery cover (`docs/cover.jpg`), the whiteboard frame, the midcentury-toon model sheet.
- Repo metadata from the GitHub API: 2,408 stars, 253 forks, created 2026-09-26, 28 commits, MIT.

**Not done at first (needs Kshitij's approval, downloads):** the films themselves (GitHub `films` release) were not
downloaded, and none of their code was run. Sections 1 to 11 rest on the code and the committed stills.
**Superseded the same day:** Kshitij approved downloading three films; the measured comparison is section 12, and
where it disagrees with sections 1 to 11, section 12 wins. None of their code was run at any point.

---

## 1. What it is, in one paragraph

Lemo-opuscar is **a style library plus a directing method plus a small render toolkit**, packaged as a Claude Code
plugin. It holds 43 film styles (watercolor, ink wash, ukiyo-e, whiteboard, dataviz, isometric infographic,
brick toy, HD-2D, 80s cel anime and so on). Each style is a prose "style prompt" (`STYLE.md`, about 12 KB) and one
demo film made entirely in code (`DEMO.md` plus `demo/` source). A user names a style and a topic; the coding agent
reads three guides (`DIRECTOR.md`, `TECHNIQUE.md`, the style's `STYLE.md`) and acts as a one-person studio: brief,
treatment, look frames, optional storyboard, voice, score, animation, mix, render, self-check. Output is a
30 to 60 s film at 1920x1080, 24 fps, -14 LUFS, with `.srt`, `TREATMENT.md`, `CREDITS` and a one-command `build.sh`.
The author states the styles are tuned for Claude Opus 5.5. A film "takes an agent about 30 to 60 minutes".

It is the same stance as Kshitij's own explainer skill studied on 2026-10-02
(`docs/research/2026-10-02-explainer-skill-study.md`): **the agent draws the subject itself, in a complete look,
with code written per film**, and the engine stays thin.

## 2. Architecture

```
plugin skill (SKILL.md + setup.sh)          -> sparse-clones the library to ~/lemo-opuscar, installs tiers, prints LIB=
AGENTS.md                                   -> routing: find the style, ask once, treatment, look, (storyboard), produce, self-check
DIRECTOR.md   (how to direct)               -> brief, benchmark, story, treatment, look, sound, rhythm, camera, performance, failures, delivery, copyright
TECHNIQUE.md  (how to build)                -> page contract, one timeline, voice, music, mix, subtitles, review loop, 3D, rigs, assets
styles/<slug>/STYLE.md (what the style is)  -> 11 fixed sections: essence, materials, colour logic, type, motion, camera grammar,
                                               sound palette, native moves, pitfalls, engine pointers, variation space
styles/<slug>/DEMO.md + demo/               -> one reference film: story, shots, score, palette, build notes, source (read only AFTER the treatment)
core/                                       -> shared tools: render (Playwright frame capture), readcheck, mux, sampler, pluck, sfx, TTS, ASR check, lib.js
tools/ + styleboard/                        -> maintainer only: release packs, web cuts, gallery, README generation, Pages CI
```

The film itself is a folder the agent writes from scratch (`films/<name>/` in a clone, `<name>/` in skill mode):

```
timeline.js (sections, bpm, beats, hit points)  = the single source of truth
  -> index.html exposing window.DUR, window.render(t), window.READY, window.EV (sound events), window.TEXTS(t) (on-screen text)
  -> node core/render/video.mjs   (N headless Chromium workers, JPEG screenshots piped to ffmpeg, segments concatenated)
  -> mix.py  (score from the timeline with sampler.py / pluck.py / numpy synthesis, foley from window.EV via sfx.py, TTS lines)
  -> sh core/render/mux.sh  (two-pass loudnorm -14 LUFS / TP -1.2, grain added in ffmpeg, refuses damaged audio)
```

There is **no stage graph, no schema, no gate runner, no project state**. Order and quality live in prose; the
agent is trusted to follow it. The machine checks are four commands the agent is told to run.

## 3. How a film gets made (the workflow the guides prescribe)

1. **Brief, asked once.** One message: facts it can't decide, the user's own material (voice, music, logos,
   fonts), language, whether to see a storyboard (default no), missing system tools (`setup.sh deps` reports
   them). Then no more questions.
2. **Benchmark.** Pick one or two reference works for this style *and this topic*; write what to learn and what
   not to take.
3. **Treatment before the demo.** `TREATMENT.md` with **three candidate structures** and the choice, logline and
   arc, benchmark, a shot list with framing, angle, move, duration and *why*, a second-by-second beat sheet, a
   **cue map** (tempo, bar grid, on which beat every cut, action and subtitle lands), a sound design table, and
   subtitle design. Only then may the agent open `DEMO.md` or the demo code, "to learn techniques, never its story".
4. **Prove the look.** A model sheet (turnaround, 3 to 4 expressions, 2 to 3 key poses, palette) when there are
   characters, else three style frames, rendered with the real drawing code.
5. **Storyboard only if asked**: 6 to 9 key shots tiled with `sheet.py`, then stop for approval.
6. **Produce**: voice, ASR check, score, animation, mix, render.
7. **Self-check and deliver**: contact sheets (two passes), 0.2 s strips of key actions, ebur128 and blackdetect
   on the final file, whisper on the final mix, one full-speed viewing with sound, and the **"not the demo again"**
   rule: of structure, opening, signature shot, camera path, score shape and ending, at least four of six must
   differ from the demo.

## 4. The tooling, dissected

### 4.1 Render (`core/render/`, about 500 lines)
- **Page contract** (`core/README.md`): `READY`, `render(t)`, `DUR`, optional `EV` and `TEXTS(t)`. Any frame can
  be rendered alone, in any order; determinism by convention (seeded `mulberry`, `hash`, `vnoise` in `lib.js`),
  **not enforced** by any check.
- **`serve.mjs`**: a static server on 127.0.0.1 with a host check (against DNS rebinding) and a path-escape check;
  a film outside the library is mounted at `/@film/` so pages can still load `/core/...` and `/node_modules/...`.
- **`page.mjs`**: launches Playwright Chromium, exits non-zero on any page error or a missing script or document,
  warns once per missing optional file, waits up to 180 s for `READY` and prints a diagnosis after 20 s; warns when
  WebGL falls back to SwiftShader.
- **`video.mjs`**: splits the frame range across `--workers` (default 3, up to 6) browsers; each evaluates
  `render(f/fps)`, takes a JPEG (q95) screenshot and pipes it to its own ffmpeg (`mjpeg` in, x264 crf 14 out); the
  segments are concatenated losslessly. A per-output lock file with pid and a 12 h age limit, crash-left segment
  cleanup, SIGINT handling, and an optional machine-wide slot limiter (`slot.mjs`, mkdir mutex, heartbeats, memory
  floor) for several renders at once. Grain is added later in ffmpeg because grain drawn in the page makes every
  frame incompressible and slow.
- **`still.mjs`** for review stills (`--range a:b:step`), **`sheet.py`** for contact sheets, **`srt.py`** for subtitles.
- **`readcheck.mjs`**: steps the film at 0.04 s, asks `TEXTS(t)` for every on-screen text with its box, and fails
  any text held less than `CJK/4.5 + other/15 + 1.5 s` (min 1.5 s) or never fully inside the frame. "Not checked"
  (no `TEXTS`) exits 2 and is explicitly not a pass. A typewriter must report its full text from the first frame.
- **`mux.sh`**: two-pass loudnorm to -14 LUFS, true peak -1.2; refuses audio that is missing, has no stream,
  decodes with errors, decodes shorter than its container claims, or has a WAV header that promises more than the
  file holds; pads short audio; never leaves a partial file; re-measures and warns if the film missed the target.

### 4.2 Sound (`core/audio/`, `core/tts/`, about 1,350 lines)
- **`sampler.py`** (670 lines): a real sampled-instrument player over five free libraries (VSCO 2 CE, VCSL, FreePats,
  Karoryfer, Salamander piano; 70 to 415 MB each, fetched on demand). A registry of named instruments
  (`violins`, `cellos_pizz`, `harp`, `clarinet_stac`...), pitch parsing, velocity layers, round-robins, seamless
  crossfade extension of long notes, SFZ parsing, YIN pitch detection for unnamed samples, an LRU cache, a room
  reverb, and `credits(names)` that writes the licence lines. Scores are event lists
  `(time, instrument, pitch, dur, vel, pan)`.
- **`pluck.py`**: Karplus-Strong plucked strings with bends, vibrato, glides and body modes (guqin, pipa,
  shamisen, banjo), numba-accelerated.
- **`sfx.py`**: procedural foley (click, clack, crash, whoosh, creak, thump, step, ding, pop, rumble, ignite, roar,
  heartbeat, radio voice), a compressor, a look-ahead limiter and `add(buf, x, at, gain, pan)`. Driven from
  `window.EV`, so every sound sits on its frame.
- **`tts.py`** (Kokoro, offline) and **`tts_zh.py`** (edge-tts, online Microsoft neural voices). Spell numbers in
  the TTS text, digits in subtitles.
- **`asr_check.py`**: faster-whisper transcribes **every narration line** back and compares it with the script
  (English word for word with 0 to 999 normalised; CJK by character similarity >= 0.92; an `asr` field overrides
  the expected text). Re-generate until it exits 0. It also writes word timestamps for lip sync and placement.

### 4.3 Install and distribution
- **Plugin**: `claude plugin marketplace add lemomo-ai/lemo-opuscar`, then `install`. The skill runs `setup.sh`,
  which sparse-clones the library without demo sources, gallery or big images (`git clone --filter=blob:none
  --sparse`), marks its own clone `lemo.managed` so later runs hard-reset it to `main`, and fetches a demo's source
  only on request (`setup.sh demo <slug>`, after the treatment).
- **Tiers**: core (npm, headless shell, a `.venv` with numpy, scipy, soundfile, soxr, pillow), voice, music, plus
  sample packs and HDRIs from a GitHub `assets` release with sha256 in `tools/assets.json`. Installs are keyed by a
  checksum of the requirement files and the Python version, so a changed requirement reinstalls.
- **Maintainer path**: `styleboard/build.py` generates the gallery, both READMEs' style grids and `AGENTS.md`'s style
  list from `style.json`; `tools/release.py check --strict` blocks big files, local paths, secrets and incomplete
  styles; `publish.sh` uploads films and 720p web cuts; the Pages workflow fails when a gallery card links a film
  missing from the release.

## 5. The styles layer

From the read-only survey of all 43 style folders (sub-agent; the key claims re-checked by grep here: 0 demos
define `window.TEXTS`, 0 `FACTS.md` files, 112 files hardcode `.venv/bin/python`, 0 demos call readcheck).

### 5.1 The two documents per style
- **`STYLE.md`** has 11 fixed numbered sections in all 43 styles (checked mechanically): 1 Essence and what it is
  not, 2 Materials and rendering, 3 Colour logic, 4 Type and subtitles, 5 Motion quality, 6 Camera grammar (a
  table: move, what it expresses, can serve), 7 Sound palette, 8 Native moves (each with "fits content like" and
  three or more examples unlike the demo), 9 Pitfalls of the medium, 10 Engine (pointers into `demo/`), 11 Variation
  space (three structures, three openings, three endings; scene styles add use cases as information-order grammar).
  The template forbids story, arc, beat tables, BPM, key, demo palette and end card in it. Sizes run 10.8 to 13.2 KB,
  so 42 of 43 break the template's own 6 to 11 KB rule.
- **`DEMO.md`** opens with "One example among many. Don't reuse its story, arc, shots, props or timings", then
  story, shots table, score structure, palette and props, end card, build notes, an engine reference with a runnable
  snippet. Its headings drift between demos (6.6 KB to 28.6 KB), and it often repeats `STYLE.md` nearly word for
  word (whiteboard's motion and stroke specs, for example).
- **`style.json`**: 12 uniform keys (slug, num, en, cn, categories, film, line, uses, frame_sec, dur); the gallery,
  both READMEs and `AGENTS.md`'s list are generated from it.

### 5.2 The demos (reference implementations, about 103,000 lines in all)
- **Rendering tech:** 21 Canvas 2D only, 13 Canvas 2D plus a hand-written WebGL2 pass (CRT, paper, print, cel),
  8 three.js (brick-toy, backrooms, glass-product, hd-2d, lowpoly-island, paper-lantern, paper-popup, tilt-shift),
  1 DOM (living-screencast). Demos run 600 to 4,300 lines of JS plus 80 to 1,600 of Python each.
- **Build:** 34 have `build.sh`; 3 have none (brick-toy, cel-anime-80s, hd-2d); 6 run their own render and mux
  pipelines. Only 7 have a `timeline.js` and 12 a `cuecheck.py`, although `TECHNIQUE.md` §3 makes the one timeline the
  rule.
- **Scene styles (4):** engraving, hologram-hud, midcentury-toon, silkscreen-poster read their words from
  `content.json` (and a `content_alt.json` swap test). midcentury-toon's contract: product, hook, 2 to 5 steps each
  with an action (place, tap, press) and a line, a payoff floor plan, a tip, an outro, palette, voice; field limits
  and fallbacks in its `DEMO.md`. Narration is regenerated from content, the score is not ("rerun the music
  sub-agent" by hand).

### 5.3 What is shared, and what is copied
- `core/` holds no brush, stroke, rig, camera, timeline, subtitle or mixer engine; every demo writes its own.
  `/core/lib.js` is imported by 24 demos, yet 20 define their own `clamp`, 23 their own easing, 6 their own
  `mulberry`; 35 Python files define their own `add`/`put`/`place` beside `sfx.add`, 17 their own filters.
- Forks say so in their first line: rubber-hose's `toon.js` is copied from scifi-toon's; lowpoly-island adapts
  `core/three/post.js` (its depth of field breaks on an orthographic camera); ascii-crt rewrites `core/post/crt.js`
  (nothing imports the core one); scifi-toon adapts `asr_check.py`. Byte-identical copies: two `lib.js`, the
  whiteboard and living-screencast `tools/`, three `mux.sh`. About 25 local subtitle exporters, 12 different
  cuecheck scripts, 9 local mux wrappers, 6 private Playwright renderers.

### 5.4 Characters
No skeletons or bones anywhere: every character is a procedural vector draw function taking a pose object.
- **scifi-toon**: its own matrix stack so line width stays constant under zoom, a 12 fps line boil, `noodle()` limbs,
  and **the only audio-driven lip sync**: a 50 ms RMS envelope and a spectral centroid per frame from the voice
  (`voice.py`), mapped to mouth open and width.
- **cel-anime-80s**: a sphere-plus-jaw head with front, 3/4 and side views and expression presets; a fixed 4-shape
  mouth flap, not audio driven.
- **midcentury-toon**: limited animation (held bodies; arms, hands, eyes, mouth and props move), four views,
  two-bone IK by the law of cosines to plant hands on world points, a model sheet rendered from the real code
  (`?test=sheet`).
- **rubber-hose**: hose limbs, gloves with four hand shapes, pie eyes; poses by per-time if/else keyframes (which
  `DIRECTOR.md` §9 itself forbids).
- Two-bone IK recurs in about a dozen demos; brick-toy is the only 3D rig (a `THREE.Group` hierarchy); about 22
  demos ship a model-sheet scene.

### 5.5 Sound in practice
- The pipeline is real: `window.EV` to `events.json`, a `score.py` from events or a beat grid writing stems and sync
  keys, a `mix.py` with a foley table per event type (dataviz: pencil tap, scratch, ruler), voice ducked over music,
  `mux.sh` at -14 LUFS. dataviz maps data values to a pentatonic scale, pure synthesis.
- But **five demos edit stock tracks instead of composing** (brick-toy: Kevin MacLeod; hd-2d: Scott Buckley;
  watercolor: "Wildflowers"; paper-popup and paper-lantern: candidates in `MUSIC.md`, which says none was
  auditioned). game-show's voice is macOS `say`.

### 5.6 Checks in practice
- `cuecheck.py` (12 demos) **only reports**; none exits non-zero.
- **`readcheck.mjs` is never used**: no demo defines `window.TEXTS`, so on every demo it would exit 2 ("not
  checked"), yet `MAINTAINING.md` lists "readcheck passes" as a release gate.
- **No `FACTS.md` exists**, although `MAINTAINING.md` requires one for real events and products and the library has
  such demos (pictogram-motion on the 2026 Asian Games, game-show's history of AI).
- `?test=` scenes in nine demos are visual pages, not assertions. A few ad hoc checkers exist (`check_mix.py`,
  `check_asr.py`, `levels.py`).

So the documented gates are partly aspirational: the guides describe a stricter process than the library's own
films followed. That matches rule 12 here: a claim needs a run.

## 6. Directing craft (what `DIRECTOR.md` teaches)

The order of judgement is stated: **sound, rhythm, camera, directing**; good frames are only the start. The rules
that matter most, condensed:
- One subject, one goal, one turn; a hook in 3 s; an ending that echoes; **one native move** of the medium at the
  emotional peak; cut the extras.
- Sound is half the film: every visible action has a sound of the right material; three layers (ambience, foley,
  music); at least two real silences before the turn; sound as a transition (J and L cuts) at least twice; no
  generic "piano and strings".
- Rhythm: the music grid comes first and the picture locks to it; vary the pace (one acceleration, one breath);
  subtitles >= max(1.8 s, line + 0.6 s); title cards >= 4 s; reading time per text (checked).
- Camera: at least four different moves, one signature shot, transitions made from the medium, the subject at
  least a third of the frame height at key moments; one world-to-screen function for anything that tracks a subject.
- Performance: anticipation, action, follow-through; blend poses with keyframes, never switch them in an `if`;
  props sit between the palms; rolling objects turn by distance / radius; step through key actions at 0.2 s.
- A list of the failures seen most (subject too small, too dark, same colour on same colour, subtitles over the
  subject, gags too fast, blank transition frames, effects that don't track after a camera move).
- Copyright red lines, and a grep for the library's own sign-off before delivery.

## 7. Comparison with Loom, aspect by aspect

| aspect | lemo-opuscar | Loom |
|---|---|---|
| **Purpose** | short art films and promos in 43 named looks, any topic, any audience | corporate L&D lessons (3 to 7 min) for adults, pedagogy first |
| **Typical length** | 30 to 60 s (warns beyond 2 to 3 min) | 2 to 7 min |
| **Input** | a style and a topic, one round of questions | a topic or source documents, genre, audience, persona, style |
| **Planning artifacts** | one prose `TREATMENT.md` (3 structures, shot list, beat sheet, cue map, sound table) | brief, knowledge sheet, teaching plan, persona, script, allocation, storyboard: each a JSON artifact with a schema and a gate |
| **Grounding of facts** | none for user films; `FACTS.md` (claim, URL, quote) only for the library's own real-event demos | knowledge sheet with human approval (topic mode) or verbatim page-anchored chunks (source mode); the script gate refuses ungrounded digits |
| **Pedagogy** | none (story craft only) | outcome, strategy, misconceptions, practice, retrieval; the lnd-* skills |
| **Who does the work** | one agent (Opus 5.5) end to end; no sub-agents, no model routing | Opus plans, Sonnet builds, a cheap model tweaks; Relay (role agents) and Shuttle (lead on rails, six sub-agents), API or subscription |
| **Process control** | prose order; nothing stops a skipped step | a 14-stage graph with hashes and stale marks; `accept` gates; human approval gates; budgets and reopen caps |
| **Machine checks** | `asr_check`, `readcheck`, `mux` loudness, `release.py check` (maintainer); in the demos readcheck is never wired and the 12 `cuecheck.py` copies only report | 455 offline tests (each gate proven able to fail), brief-to-scenes gates, runtime probe (off-frame, crops, foreign pixels), film checks (blurred beats, element life), text audit, layout guard, render verify |
| **Determinism** | convention (seeded rng in `lib.js`); not checked | rule 3 plus compose determinism test plus MP4-matches-preview verify |
| **Rendering** | the agent's own HTML page per film: Canvas 2D, three.js r170, WebGL2 shaders; Playwright screenshots in parallel workers | one continuous world canvas runtime (`runtime/*.js`, 14k lines) on HyperFrames + GSAP; Manim, Skia and Three clips through bridges and a shared clip store |
| **Code per film** | all of it, written fresh (the 43 demos total about 103,000 lines; the shared core is about 2,100) | mostly templates, components, kit and runtime; bespoke beats are small (about 26 lines a beat in stress-signal, per the 2026-10-02 study) |
| **Styles** | 43, each a complete look with its own grammar (materials, type, camera, sound palette, native moves, pitfalls) in prose, plus a demo engine to learn from | 13 packs as data over one grammar set (7 shading grammars), restyle without model calls, brand on any style; 5 packs with guides |
| **Characters** | drawn in code per film: 2.5D rigs, model sheet with turnaround, expressions and poses before shooting | `runtime/rig.js`, 5 rigs, 8 poses, 5 gestures, front view only; designed kits from Claude Design are the direction (D-121) |
| **Text and layout** | no measurement; `readcheck` checks reading time and in-frame boxes only | real font metrics, `kit.fit`, measured glyph checks, layout guard (D-169) |
| **Voice** | Kokoro (EN), edge-tts (ZH, online); the user's own recording welcome | Kokoro default; OpenAI, ElevenLabs paths (unproven); wpm calibration |
| **Voice verification** | **every line transcribed back with Whisper and compared**; word timestamps | none: no ASR check of synthesised narration |
| **Music** | an original score per film from the cue map, in the style's instruments, **real sampled orchestra and folk instruments** plus physical-model strings and synthesis (38 demos compose; 5 edit stock tracks) | a quiet synthesised bed in a mood and root, chord changes on section starts (D-47), ducked |
| **Foley** | every visible action has a sound; events from `window.EV` | runtime sound events synthesised in the music's key (`sync_sfx`) |
| **Loudness** | -14 LUFS, TP -1.2, two-pass, re-measured, damaged audio refused | -16 LUFS, TP -1.5, single-pass loudnorm in `mix.py` |
| **Subtitles** | burned in as part of the style, plus `.srt`; reading-time rule checked for on-screen text | word-synced captions, SRT, VTT, transcript |
| **Reuse** | none by design: demos are references, never templates; "never bend the topic toward the demo" | the element and design library (forms, designs, promotion at 2 or 3 uses), templates, blueprints, `assets/kept/` (D-163) |
| **Variety control** | the "not the demo again" 4-of-6 rule, the three-structures rule, a benchmark per film | the variety ledger and AI-tells lint (D-79), design seeds (D-80) |
| **Review** | contact sheets, 0.2 s strips, ebur128, blackdetect, final-mix whisper, one viewing with sound | contact sheets, strips, film checks, a vision critic (describer only, D-111), Kshitij's rating as the bar |
| **Logging and memory** | none in the repo for user films; production logs kept private (gitignored) | append-only CHANGELOG, DECISIONS, RUNS, AGENT_LEARNINGS (441 learnings, 128 open), decision ledgers, `context_check` |
| **Cost tracking** | "a fair amount of tokens" | per-phase and per-model budgets, cost reconcile, `loom cost` |
| **Testing and CI** | no test suite (the last commit dropped the only test file); CI builds the gallery only | 455 tests offline; no CI yet (PORTABILITY_CHECKLIST) |
| **Platform** | macOS first (`.venv/bin/python`, `sh` scripts, Metal ANGLE default); Windows only through WSL | Windows first (`py`, `Path`, `setup.ps1`), also Linux |
| **Distribution** | a Claude Code plugin from a marketplace, sparse clone, tiered installs with checksums | a folder; `setup.ps1` / `setup.sh`; skills synced by hand to the Cowork account (L-80) |
| **Licensing** | MIT code; CC0, CC BY, OFL assets only, a `CREDITS` file per film; `sampler.credits()` | free asset sets indexed with licences (D-88); downloads need Kshitij's approval |
| **Human gates** | one round of questions; optional storyboard approval | knowledge approval, plan approval, final approval |
| **Size** | about 2,100 lines of shared tools plus 4,600 words of guides plus 43 x 12 KB style prompts | about 26,000 lines of Python, 14,000 of runtime JS, 17,000 of tests, 17 skills |

## 8. What the comparison shows

### 8.1 Where lemo-opuscar is stronger
1. **Sound.** It treats sound as half the film and backs that with real tools: a sampled-instrument score written
   to a cue map, physical-model strings, foley for every action, J and L cuts, planned silences, -14 LUFS with a
   defensive master. Loom's music is a quiet synthesised bed. This is the biggest single gap, and it is cheap to
   close (section 10, P-a).
2. **Verified narration.** `asr_check.py` proves every synthesised line says what the script says before anything
   is timed to it. Loom has no such check; a mispronounced number or a dropped word reaches the film unseen.
3. **Reading time as a gate (as a design, not as practice).** `readcheck.mjs` turns "hold text long enough" into a
   measured, failable check over every on-screen text, with an honest "not checked" exit. Loom gates words per
   minute of narration, not how long each on-screen text stays readable. Their own demos never wire it (5.6), so
   the idea is proven only as code, not as a habit.
4. **A complete look per style.** A `STYLE.md` fixes materials, colour logic, type roles, motion quality, camera
   grammar, sound palette, native moves and the medium's pitfalls. Loom's packs mostly change colours and shading
   over one grammar (the same finding as the 2026-10-02 study, item 7). Note: this is about how a style is
   *specified*, not a comparison of styles (D-122).
5. **Directing rules with numbers.** Four camera moves, one signature shot, two silences, two sound transitions,
   subject at a third of the frame height, 0.2 s action strips, the failures seen most. Loom's skills carry much of
   this, but it is spread and less numeric.
6. **Divergence by construction.** Treatment before reading the demo, three candidate structures, and the 4-of-6
   rule against the demo. Loom's variety ledger measures sameness after the fact.
7. **Characters drawn as a designed set first.** The model sheet with a turnaround, expressions and key poses is
   rendered with the real code before any shot. Loom's rigs are front view only, and D-121 moved Loom to designed
   kits.
8. **Install and distribution.** Plugin, sparse clone, demo-on-demand, tiered installs keyed by checksums, assets
   with sha256 on a release. Loom installs as a folder and its account skills drift (L-80).
9. **Render robustness details**: parallel browser workers, output locks, crash cleanup, grain in ffmpeg not in
   the page, loud failure on page errors and missing scripts, a 20 s READY diagnosis.

### 8.2 Where Loom is stronger
1. **Truth.** Grounding with human approval and a digit gate. Lemo-opuscar has nothing for a user's facts; a
   corporate lesson made its way would carry whatever the model believes.
2. **Teaching.** Outcomes, misconceptions, practice and retrieval. Lemo-opuscar optimises for a film that is
   enjoyable to watch, not one that changes what an adult can do.
3. **Process you can audit.** Stage graph, artifacts with schemas, hashes and stale marks, accept gates, budgets,
   append-only logs, `context_check`. Lemo-opuscar's quality depends on one strong model following prose.
4. **Gates that can fail, tested.** 455 tests, every gate proven red. Lemo-opuscar has none.
5. **Length and reuse.** A 5-minute lesson cannot afford 100 percent fresh code per second; Loom's templates,
   world canvas and library are what make long lessons and restyles possible without model calls.
6. **Layout measurement.** Real font metrics and glyph checks; lemo-opuscar only checks that text boxes are inside
   the frame.
7. **Brand and restyle.** Brand on any style, contrast lint, restyle with no model calls.
8. **Model routing and cost.** Opus, Sonnet, cheap models, other providers, budgets, measured cost per lesson.
9. **Windows.** Loom runs natively on Kshitij's PC; lemo-opuscar needs WSL.

### 8.3 The honest reading
They solve different problems. Lemo-opuscar maximises **the ceiling of one short film** by giving one strong agent
a complete look, a directing method and good sound tools, and by keeping the engine out of the way. Loom maximises
**the floor of a long, correct lesson** through structure, gates and reuse. Loom's open complaint (D-99 "AWFUL",
the frame audits, motion 47 to 59 percent) is a ceiling problem, so the parts of lemo-opuscar worth studying are
exactly its ceiling tools: sound, verified voice, reading time, complete style specifications, the treatment and
the model sheet. Its weak points are the floor Loom already has.

## 9. Weak points of lemo-opuscar, and what we would change there

| # | weak point | evidence | change |
|---|---|---|---|
| W1 | **No grounding of facts** in a user's film | `FACTS.md` only in `MAINTAINING.md`, for library demos | a facts table in the treatment (claim, source, quote) and a check that every number on screen or in the voice appears in it |
| W2 | **Process lives in prose**; nothing enforces order or that checks ran | AGENTS.md workflow, no runner | a tiny `check.sh` that runs asr_check, readcheck, ebur128, blackdetect and the demo-divergence list, and writes one pass/fail report the agent must show |
| W3 | **Determinism is a convention** | `lib.js` seeds; no test | render the same frame twice in different orders and compare hashes (Loom's compose determinism test) |
| W4 | **No test suite, no CI for tools** | last commit removed the only test file | tests for `mux.sh` refusal cases, `readcheck`, `srt.py`, `asr_check` normalisation (the logic is already careful; it is unguarded) |
| W5 | **macOS first** | `.venv/bin/python`, `sh` scripts, Metal default, "on Windows use WSL" | a Python or Node entry point instead of `sh`, `Scripts/python.exe` resolution |
| W6 | **Copied engines per demo** | demos carry their own brush engines, rigs, mixers, cuecheck (survey, section 5) | promote proven pieces into `core/` (cuecheck especially, which TECHNIQUE.md already describes as shared) |
| W7 | **Demos cannot be rebuilt from the repo** | fonts, audio, textures, models gitignored; only `CREDITS` names them | a per-demo fetch manifest with sha256 (as `tools/assets.json` does for the core) |
| W8 | **One model, one agent, no memory** | "tuned for Opus 5.5; other models may not reproduce them"; no production log for user films | a run log in the project folder, and a note of what a weaker model gets wrong per style |
| W9 | **Short form only** | 30 to 60 s default; cost warning past 2 to 3 min | nothing to change for their goal; it is why it does not transfer to lessons as is |
| W10 | **Online dependency for good Chinese voice** | edge-tts needs a network | fine for them; noted because it is a Microsoft service and terms apply |
| W11 | **No layout measurement** | readcheck checks boxes in frame, not overlap or fit | an overlap probe from `TEXTS(t)` boxes against the subject's box |
| W12 | **Review is self-review by the same model** | DIRECTOR.md §11 | a second pass by a fresh agent with only the frames and the treatment |
| W13 | **Documented gates not followed by the library itself** | readcheck never wired, no FACTS.md, cuecheck never fails (5.6) | make `release.py check --strict` run readcheck and require FACTS.md for styles flagged as real events |
| W14 | **Stock music in five demos** despite "original score" | brick-toy, hd-2d, watercolor, paper-popup, paper-lantern (5.5) | either compose or say so in `DEMO.md`; unauditioned candidates should not ship |
| W15 | **Docs repeat themselves** | DEMO.md restates STYLE.md; 42 of 43 STYLE.md over their own size rule | a lint for size and for paragraphs duplicated between the two files |
| W16 | **Poses switched in `if` blocks** in rubber-hose despite DIRECTOR.md §9 | `scenes.js` per-time if/else keyframes | a pose-track helper in `core/` (`track()` already exists in `lib.js`) |
| W17 | **Lip sync only in one demo** | scifi-toon's RMS and centroid envelope | promote it to `core/tts/` and use the word timestamps `asr_check` already writes |

## 10. What Loom should consider (proposals, pending Kshitij; none built)

Ordered by value for the current priority (videos to 95 percent of their potential, D-95 parked items untouched).
Each keeps both ways (D-70) where it replaces something, and each would be built with a test that fails on the
old code. **No code is copied**: lemo-opuscar is MIT, so reuse would be legal with attribution, but rule 11
(study, never republish) and the download rule apply; anything we want we re-write, and any sample library would
be a separate download for Kshitij to approve.

- **P-a. A real score.** Add a sampled-instrument path beside the synth bed (per style a sound palette: instruments,
  articulations, foley materials), written to the storyboard's sections and hit points. Needs a free sample
  library downloaded (VSCO 2 CE is CC0, about 410 MB): Kshitij's approval first. Keep the bed as the classic way.
- **P-b. Narration verified by speech-to-text.** After `narrate`, transcribe each phrase with faster-whisper and
  fail the stage on a mismatch (numbers normalised, an override field for names). Also gives word timings
  independent of the TTS provider. Needs the Whisper model download (about 145 MB): approval first.
- **P-c. A reading-time gate for on-screen text.** Have the runtime report every visible text with its box per
  time (the `TEXTS(t)` idea) and fail any held under `chars/15 + 1.5 s`, or never fully in frame. It also feeds
  the existing off-frame probe.
- (Correction, same day: P-d and item 8.1.4 understate Loom's five style guides, which are deeper than lemo's in
  palette roles, failure modes and checklists; the real gap is sound palette, camera grammar, native moves and
  per-style engines. See `2026-10-15-lemo-opuscar-explained.md` section 3.3, item 7. Kshitij also set the framing
  there: lemo-opuscar is not a benchmark, and Loom does not make films.)
- **P-d. Style specifications as complete looks.** Extend the five pack guides toward the 11-section shape
  (materials, colour logic, type roles, motion quality, camera grammar, sound palette, native moves, pitfalls,
  variation space), one style at a time, never comparing styles (D-122).
- **P-e. Treatment before storyboard.** In the storyboard task, ask for three candidate structures and the choice,
  a benchmark (learn / don't take), and a cue map that the storyboard gate checks against the beats.
- **P-f. Model sheets as a gate for characters.** Before a lesson uses a character, render its sheet (turnaround,
  expressions, key poses) with the real rig and look at it; fits the D-121 kit direction.
- **P-g. Directing numbers into the gates or the critic**: at least two silences before key turns, sound used as a
  transition twice, subject >= 1/3 frame height at key moments, four camera move types per lesson.
- **P-h. Loudness to -14 LUFS two-pass with a re-measure and damaged-audio refusal** (lessons are watched on
  laptops and LMS players; -16 is fine for broadcast, quieter than most web video). Keep -16 as an option.
- **P-i. Grain in the encoder, not the page**, and a check that a lesson's render does not draw per-frame noise
  in the canvas (compression and speed).
- **P-j. Distribution.** Package the Loom skills as a Claude Code plugin with a marketplace entry, which would also
  end the account-copy drift (L-80) and help running outside Cowork (D-75).

What **not** to take: per-film code for everything (it does not scale to 5-minute lessons and loses restyle and
brand), the single-agent no-gate process, and the absence of grounding.

## 11. Suggested next step (superseded by section 12, same day)
If Kshitij approves downloading three of their films from the `films` release (whiteboard, dataviz,
iso-infographic: the three closest to L&D), run `tools/video_study.py` on them as on 2026-10-02 and put the numbers
beside a Loom lesson in the same style family, so section 8 rests on measured frames, not stills.

## 12. Measured: three of their films beside three Loom lessons (2026-10-15, approved by Kshitij)

**What was run.** Kshitij approved the download. `whiteboard.mp4` (56 MB, 111.0 s), `dataviz.mp4` (26 MB, 50.0 s) and
`iso-infographic.mp4` (31 MB, 58.8 s) came from the repo's `films` release (sizes match the release listing), into
the session scratchpad. `py tools/video_study.py --sheet-every 4` ran on them and on three rendered Loom lessons:
`blameless-postmortem` (whiteboard, 5:04), `gps-position` (flat-cosmos, 4:41; the 8.5 bar) and `https-private-v2`
(2:24; the 8 bar). Loudness by `ffmpeg ebur128`; caption pacing from each film's `.srt`. The study JSON is in
`docs/research/lemo_opuscar/`; the contact sheets of their films stay local in `cache/research/lemo/out/` (study,
never republish). Their whiteboard film is about **how GPS works**, the same topic as Loom's `gps-position`, which
makes that pair the fairest one.

| measure | lemo whiteboard (GPS) | lemo dataviz | lemo iso-infographic | Loom gps-position | Loom blameless (whiteboard) | Loom https-private-v2 |
|---|---|---|---|---|---|---|
| length | 111 s | 50 s | 59 s | 281 s | 304 s | 144 s |
| seconds with visible motion | **96 %** | 88 % | 93 % | 60 % (68 % in its first 111 s) | 53 % | 48 % |
| median picture change while moving | **0.074** | 0.084 | 0.289 | 0.022 | 0.019 | 0.021 |
| frozen holds, share of runtime | **4 %** (1 hold) | 10 % | 3 % | 28 % (30 holds) | 30 % (34) | 38 % (14) |
| median gap between visual events | **3.5 s** | 2.5 s | 2.0 s | 9.0 s | 8.0 s | 18.0 s |
| p90 gap between visual events | 6.2 s | 2.9 s | 3.0 s | 28.0 s | 16.6 s | 43.6 s |
| shots (palette study) | 1 (one board) | 1 | 10 | 6 | 1 | 1 |
| integrated loudness | -14.0 LUFS | -14.0 | -14.1 | -16.1 | -16.5 | -16.1 |
| loudness range (LRA) | 3.4 LU | 6.5 | 7.1 | **2.0** | **2.5** | **1.9** |
| true peak | -1.0 dBFS | -1.1 | -1.0 | -1.3 | -1.4 | -1.4 |
| words per minute (over the speech span) | 104 | 70 | 56 | 117 | 112 | 118 |
| caption cues / median cue length | 25 / 2.76 s | 5 / 4.62 s | 6 / 3.40 s | 116 / 2.37 s | 120 / 2.40 s | 56 / 2.47 s |
| caption cues shorter than 1.8 s | 4 of 25 (16 %) | 0 | 0 | **33 of 116 (28 %)** | 26 of 120 (22 %) | 13 of 56 (23 %) |

Notes on the instrument:
- iso-infographic's 25 "cuts" (median shot 0.3 s) are clusters of 0.2 s detections inside about 10 fast fly-through
  transitions (5.2, 17.2, 28.4 to 30.2, 33.6 to 34.4, 35.8, 40.4, 44.8, 49.0, 53.2 to 54.0 s), matching the
  palette study's 10 shots; the real median shot is about 5 s. The cut detector reads a camera move over a busy
  isometric world as cuts (as L-131 noted for close cut pairs).
- Their films are 2 to 6 times shorter. The gap is not a length effect: over the same first 111 s, gps-position moves
  in 68 % of seconds against the whiteboard film's 96 %, with a change per moving second 3.5 times smaller.

**What the frames show** (the sheets, read in order; frames win over numbers):
1. **The subject is the drawing.** The GPS whiteboard draws the pin, the street map, the satellite ring, the
   formula `delay x speed of light = distance`, the two clocks with their tick rulers, the `-7 us` and `+45 us`
   terms: every frame is the noun being said, drawn large. Blameless shows small cards, icons and a lot of empty
   page; gps-position is Loom's closest (the globe, orbits, the light path and the circles do carry the idea), but
   its numbers sit in small pills and half of its frames are a dark field with a few small marks.
2. **Something is always being made.** The marker is in frame and drawing in almost every whiteboard frame; the
   pencil does the same in dataviz. That is where the 96 % comes from. Loom's elements appear and then sit.
3. **One world, travelled.** Both lemo whiteboard and dataviz are a single board or a single chart that the camera
   travels over and the pen keeps adding to; the last shot pulls back to the whole board with everything drawn.
   Loom's one-world canvas has the same idea on paper, but in blameless the page is cleared and refilled beat by
   beat.
4. **Their weaknesses are visible too:** the whiteboard film has two near-blank frames while the camera travels
   (0:10, 0:30), a motion-blurred whip pan (1:10) and very small burned-in subtitles; dataviz's labels are tiny at
   1080p thumbnail size; the end cards carry the library's own sign-off. The whiteboard film breaks their own 1.8 s
   subtitle rule four times, and readcheck was never run on it (5.6).
5. **Sound** (from the numbers; not listened to): theirs has 1.5 to 3.5 times Loom's loudness range and two planned
   quiet gaps in two of the three films; Loom's mix is almost flat (LRA about 2 LU), which matches a quiet bed under
   a steady voice.

**What this changes in section 10.**
- The measurement supports P-a (score) and adds a concrete target: a loudness range above 3 LU and at least two
  quiet gaps per lesson are measurable, so they can be a film check rather than a wish.
- It strengthens P-c with a number that already fails today: **22 to 28 % of Loom's captions are shown for less than
  1.8 s** (shortest 0.64 s). A caption-hold check on `captions.srt` needs no runtime change at all and would be the
  cheapest proposal to build first.
- It adds **P-k, "the drawing hand"**: an always-present maker (pen, pencil, cursor, hand) that draws the subject
  while it is spoken, in the styles where the medium has one (whiteboard, line-art, chalk-lab, editorial-paper). It
  is already on `docs/styles/WALLS_AND_NEEDS.md` ("a drawing hand"); the measured effect on motion share (96 % against
  53 % for Loom's own whiteboard lesson) is the case for doing it next. Within one style only (D-122): the comparison
  that matters is Loom whiteboard against Loom whiteboard with the hand.
- Not supported: copying their pace of words. Their narration is sparser (56 to 104 wpm against Loom's 112 to 118),
  which suits a 1-minute film and would make a 5-minute lesson thinner; Loom's pacing gate stays.
