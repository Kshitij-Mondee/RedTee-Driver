# Common brief for the D-114 primitive builders (2026-10-06)

You are building new runtime primitives for Loom, the L&D video engine in this folder (Video-Engine). Kshitij
(the owner) asked for them after a 96-film TED-Ed study. Source of the need:
`docs/research/vision/2026-10-05-tedEd-full-conclusions.md` sections 7 and 8, and
`docs/strategy/2026-10-06-tedEd-learnings-plan.md` section 6.

## Paths
- Windows (Read/Edit/Write tools): `C:\Users\Admin\Desktop\Video-Engine\...`
- Linux shell (bash tool): `/sessions/practical-funny-cannon/mnt/Video-Engine/...`
- Use `python3` in the shell. Each shell call is capped near 3 minutes; keep each command short.
- Render browser (shell only): `export HYPERFRAMES_BROWSER_PATH=/sessions/practical-funny-cannon/chromebin/chrome`
- Lab: `python3 -m loom lab <lab_scene_id> [--style <pack>]` renders a filmstrip to `docs/styles/demos/lab/`.
  Read `loom/lab.py` and two existing lab scenes in `scenes_examples/lab/` first (e.g. `lab_springs.js`,
  `lab_joins.js`). LOOK at the strip image (Read tool on the jpg) before you claim anything works.

## Read first
`CLAUDE.md`, `docs/SCENE_API.md`, `runtime/core.js`, `runtime/motion.js`, `runtime/style.js`, the runtime files
named in your own brief, `skills/lnd/lnd-motion-craft/SKILL.md` (easing law), `skills/lnd/lnd-motion-fit/SKILL.md`.

## Hard rules
1. **Determinism:** every frame is a pure function of (manifest, time). No Math.random, Date, timers, rAF,
   network, repeat:-1. Use `Loom.tween`, `Loom.drive`, `Loom.set`, `Loom.call`, `Loom.rng(seed)` only. Seeking to
   any time in any order must give the same picture.
2. **Tokens only for colour** (`ctx.style.c(token)` / `S().c(...)`); durations from `S().dur(...)` or the pack's
   motion; no literal hex in primitives except pure black/white where a join is defined as such.
3. **Pack-driven defaults:** read anything stylistic from the style pack (`packs/styles/*.json`), with a safe
   default when a pack does not declare it. Respect `look_family` (`illustrated` | `editorial` | `technical`):
   hand-made timing and cartoon joins default ON only for illustrated packs; others may opt in per call.
4. **Report what you do** into `Loom.report` like existing primitives (tweens go through Loom.tween/drive, which
   records them; add `Loom.warn`/`Loom.error` with a code for misuse, e.g. morphing between missing paths).
5. **No em or en dashes** anywhere (code comments, docs). Use commas, colons, hyphens.
6. **Never edit generated files** (`runtime/catalog.*`, `projects/*/build/`, `library/forms.json`, `FORMS.md`).
7. **Files you OWN** are listed in your brief. Do not edit any other file except where your brief says so.
   Other builders work in parallel on other files. In particular do NOT edit `tests/run_tests.py`,
   `docs/SCENE_API.md`, `loom/compose.py`, `CHANGELOG.md` or any `docs/context/*` file.
8. The runtime file you own is already registered in `loom/compose.py` RUNTIME_ORDER (it exists as a
   placeholder). Replace its contents.

## Deliverables for each primitive
1. The runtime code (in your owned file), with a header comment saying what it is for, its API and the
   determinism argument.
2. A lab scene `scenes_examples/lab/lab_<name>.js` with a `// @lab {...}` header (title, styles, dur, times)
   that shows the primitive working in at least two packs of different look families. Render it and LOOK at the
   strip. Iterate until it looks right (correct geometry, nothing clipped, nothing popping, legible).
3. Tests in `tests/suites/<area>.py`: plain functions named like
   `def primitive_<name>_<claim>():` that `return "<short summary>"` on success and raise AssertionError on
   failure. They may `from run_tests import ...` nothing; instead write them self-contained: use subprocess to
   run `node` on a small harness, or run `python3 -m loom lab ...` and read the lab's `report.json`. Each test
   must be able to FAIL: show it (temporarily break the input, see it fail, restore) and say so in your report.
   Keep each test under 60 s. If a test needs the browser, skip with a message when HYPERFRAMES_BROWSER_PATH
   is unset (`return "skipped (no browser here)"`).
4. API docs in `docs/primitives/<name>.md`: the API, parameters with defaults, when to use it and when not,
   pack behaviour, one short code example, and what is still unverified. I will merge these into SCENE_API.md.
5. A short report back to me: files written, API summary, lab strip paths you looked at and what you saw,
   tests and how you proved each can fail, anything unverified or left out.
