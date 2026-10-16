# Why a check takes 13 minutes, and how to make it seconds (2026-10-10)

Kshitij, after `https-private` (2-minute motion-graphics lesson, corporate-clean, 4 h 33 min, $25.16): "why is just the
overlap checking taking so much time?? And who is doing it?? ... take inspiration from [RedTee_V1_Video] ... I am not
asking you to replace the current way of doing it." A brainstorm loop and a critique loop over the parts that take the
time. Measured, not estimated, unless it says so. RedTee was read only (CLAUDE.md rule 6).

## Who runs the overlap check

`loom/qa.py` `check()` runs, in order: the runtime probe (Loom's own, one page load, 14 s here), Loom's lints, then
`hf_check()`: `hyperframes check --json --samples 24`, the third-party HyperFrames CLI in `node_modules/hyperframes`.
That CLI starts its own headless Chrome, loads the lesson page once, seeks to 24 sample times plus transition
boundaries and a dense motion pass, and at each one runs `window.__hyperframesLayoutAudit` (89 KB,
`dist/commands/layout-audit.browser.js`). The `content_overlap` errors that drove this run's 8 fix rounds come from it.

## Why it took 12 minutes here

At every sample the audit takes **every node of the page** (`root.querySelectorAll("*")`), reads each one's computed
style (`isVisibleElement`, `restoreHitTesting` rewrites pointer-events across the document), probes every text
fragment with a 27-point `elementFromPoint` grid, and runs the overlap and container passes. A Loom page holds the whole
film at once (every beat's drawing; out-of-time ones are only switched off), so the cost per sample follows the size of
the whole page, not what is on screen.

Measured in the browser on both builds (the same audit script, one sample at 30, 60 and 90 s):

| page | DOM nodes | of them background dots | one audit sample |
|---|---|---|---|
| `feedback-shuttle-v3` (story-cartoon) | 4,324 | 0 | 0.2 s |
| `https-private` (corporate-clean) | 98,958 | 96,163 | 8.2 to 13.1 s |

The 96,163 nodes are `<circle>` elements in one SVG in `#lm-ambient`: the style's faint dot grid (`ambient.kind:
"dots"`, r 2.2, opacity 0.22), drawn by `runtime/world.js` as one circle every 48 px across the whole world plane
(-1000 to 21000 by -1000 to 9000). Styles with `dots`: corporate-clean, engineering, chalk-lab; `paper` (editorial-paper)
draws a similar count of random specks; `stars` (flat-cosmos, glow-flat) and `grid` (presenter-pop, dark-technical) far
fewer. One decoration made each check about 50 times slower. It also slows every other browser step a little: snapshots
median 29 s here against 23.7 s in v3; the render's MP4 took 13.5 min here against 6.8 min for v2's (weak evidence:
different films and machine load).

## How RedTee did it in seconds (and what does not transfer)

RedTee's geometry was data before anything rendered: a pure resolver turned declared JSON layouts into boxes; each beat
was one settled SVG drawn by Python; overlap, safe area, fit and font floor were arithmetic on that SVG (transforms
folded in, text width from a calibrated per-glyph table shared with the drawer); times came from the timeline as data
(reveal steps); motion was restricted (entrances only, rigid moves on step boundaries) so the settled frame was the only
state worth checking. Its own browser sampler (`Layer4/harness/motion_audit.mjs`, 24 samples) was a selftest backstop,
not the per-lesson gate. CI: 237 stages in 174 s.

What does not transfer: Loom's scenes are bespoke JavaScript with continuous motion, held elements and camera moves;
geometry is only known by running the scene, and the settled frame is not the only state that matters. What does
transfer: (1) check from recorded geometry, not pixels; (2) take the times from the timeline as data; (3) the browser
audit as a backstop, not the loop's gate; (4) one model shared by drawer and checker.

## Brainstorm (diverge, cluster, stress-test, converge)

Ideas: (1) draw the background as one node (an SVG pattern for dots and grid, one image for paper and stars); (2) a DOM
node budget lint at compose; (3) a Loom-native geometric overlap check from the probe's single page load; (4) check only
what changed (per-beat results cached by input hash); (5) sample at event times (tween boundaries, reveal ends, joins)
instead of a uniform grid; (6) the full HyperFrames audit once, before render; (7) the native check inside each
writer's snapshot; (8) the native check in the pilot; (9) narration: keep the calibrated speed per voice, synthesise
phrases in parallel; (10) parallel HyperFrames browsers; (11) fewer HyperFrames samples; (12) upgrade HyperFrames
(0.8.91 to 0.8.143); (13) declarative layouts as in RedTee; (14) move the background outside the composition root so the
audit does not see it; (15) snapshots compose only the beat and its neighbours.

Clusters: **shrink the page** (1, 2, 14); **check less, the right things** (4, 5, 6); **check differently: geometry, not
pixels** (3, 7, 8); **speed up engine steps** (9, 10, 15).

Survivors, ranked:
1. **The background as one node** (1 with 2). Mechanism: 96,163 circles become one pattern-filled rect; the audit, the
   probe, snapshots and the render stop paying for them. Attack it nearly failed: "is it the same picture?" A regular
   dot or line grid is exactly a tiled pattern; paper and stars use seeded random positions, so they become one image
   drawn once from the same seed. Survived by making it testable: frame-diff old against new on sampled frames per
   affected style, zero difference allowed for dots and grid. Plus a compose lint that names any page above a node
   budget, so the next decoration cannot do this silently. Cheapest validation: re-run the audit timing on
   `https-private` with the pattern (expected under 0.5 s per sample) and diff frames.
2. **A native geometric overlap check, used in the loop; HyperFrames kept as the final gate.** Mechanism (RedTee's
   principle adapted): the probe already loads the page once and records every element, its life window, every tween's
   start and end (`Loom.report.tweens`) and every text. Seek only to event times (each tween boundary, settled frames,
   join windows), read only the text boxes (about 500 here, not 99,000) with their screen transforms, and intersect them
   in Python. Attack: "Loom scenes are not declarative, so mid-flight overlaps are missed" (RedTee avoided them by
   rule). Repair: sample at tween boundaries and mid-points of moves, the times the timeline already records. Attack 2:
   "a second checker that disagrees with HyperFrames". Repair: shadow mode first (rule 13): both run on a few lessons and
   the findings are compared; the native one gates the loop only when it misses nothing HyperFrames finds, and
   HyperFrames still runs once before render.
3. **Check only what changed.** Mechanism: frames are a pure function of (manifest, time), so a beat whose file, kit
   parts, storyboard scene, neighbours and timings did not change has the same result; cache per beat by that hash and
   re-check only changed beats and their joins (the "redo only what changed" rule). Attack: held elements and joins
   cross beats; global lints (variety, value script) are lesson-wide. Repair: include both neighbours in the key; keep
   lesson-wide lints whole (they are cheap).

Cut: (10) parallel browsers: still pays for 99,000 nodes, the fix removes them; (11) fewer samples: less coverage, a
quality cut (rule 13); (12) upgrade: needs a download approval and its gain is unknown; worth a timed test later;
(13) declarative layouts: against Loom's bespoke scenes, a different engine; (14) moving the background out of the
root: hides the cost instead of removing it, and changes what the render composites; (15) partial snapshot compose:
plausible but the snapshot cost is mostly the page and the picture, measure after (1).

## Critique (the check and engine-step architecture, against its goal: catch real defects, fast, every time)

- **Fatal: the page carries the world's decoration as DOM nodes.** Where: `runtime/world.js` ambient (dots, paper,
  stars). Why: every browser step's cost follows node count; one decoration made the check 50 times slower and nobody
  saw it because no gate measures page size. Fix: survivor 1 and a node budget lint.
- **Major: every check re-audits the whole film.** Where: `qa.check` and the fix loop (11 full checks in this run, each
  re-auditing 17 beats for a fixer's change to one or two). Fix: survivor 3; the full audit once before render.
- **Major: overlaps are found late, only by the most expensive tool.** Where: writers' `lab_snapshot` returns the
  picture and runtime errors but no layout audit; overlaps surface at full checks (27, 15, 8, 7, 3, 3, 0 errors over
  8 rounds). Fix: survivor 2, run inside each snapshot, so a beat leaves its writer without overlaps.
- Minor: the pilot check runs the full HyperFrames audit for two beats (11 min here); narration synthesises the whole
  lesson twice to calibrate the voice (6 min); render verification is fine now (27 s, D-150); the probe is fine (14 s).

Protect: frames as a pure function of time (it is what makes caching by hash correct); the probe's recorded elements,
tweens and texts (the data a native check needs); `painted_overlaps` (it already turned false overlap errors into
warnings); the HyperFrames audit's thoroughness as the last gate before render.

Verdict: fix the fatal first. It is small, testable by frame diff, quality-neutral, and on this run's numbers it alone
takes a check from about 13 minutes to about 2 (estimate). Then the native checker in shadow mode, then incremental
checks.
