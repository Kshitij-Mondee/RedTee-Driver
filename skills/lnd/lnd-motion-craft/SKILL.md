---
name: lnd-motion-craft
description: Easing, timing, reveal and transition craft for learning and explainer video - the easing law, a small curve library with durations, one-progress-drives-all-properties, reveal order tied to narration, stagger, camera, rest holds, transitions between scenes, word-synced emphasis and captions, and what to animate for smooth playback. Use whenever animating slides, diagrams, text or transitions in any tool, choosing easing curves or durations, syncing highlights to the voice-over, or when motion feels jittery, sluggish, mechanical or "like a slideshow".
---

# Motion craft - how things should move in a teaching video

Motion in a learning video has one job: help the viewer follow the idea. The rules below are
universal animation practice, expressed as numbers so they can be applied in any tool - a timeline
editor, a presentation tool, CSS/SVG, Manim, or a video API. Cubic-bezier values are plain math and
portable to anything that accepts a custom curve.

For WHETHER something should move at all, and the design budget around it, use `lnd-visual-design`.
For WHICH motion a given diagram needs and in what order its parts arrive, use `lnd-motion-fit`.

## What recent evidence adds (references; Loom `docs/research/2026-10-01-attention-learning-recall.md`)
- Animate what changes; hold still for structure. Draw each element as it is named.
- One cue at a time, timed to the word: in video, motion already pulls the eye, and stacked cues (arrow plus
  glow plus zoom plus sound) can backfire.
- Energy at boundaries, calm under explanation: big transitions, music swells and comedy at openings and
  segment ends; a quiet middle makes the reveal distinctive.
- Do not cut like a feed inside one idea: fast cuts fragment an event. A meaningful change every 5 to 15 s,
  with a 2 to 4 s hold after a key reveal, is a working range (estimate, not a tested optimum).

## The easing law

- ENTRANCES ease OUT (arrive with momentum, decelerate into place).
- EXITS ease IN (leave with gravity, accelerate away).
- Never ease-in-out for an enter or an exit; reserve it for A-to-B moves that both start and end on
  screen (panel slides, camera pans).
- One easing family per video: pick the curves once and reuse them everywhere. Mixed easings read as
  jitter, not variety.
- In 96 TED-Ed films measured by code (`docs/research/vision/2026-10-05-tedEd-full-conclusions.md`;
  references, not targets) arrivals ease out, falls ease in, and ease-in-out is the commonest shape
  overall. Long linear moves were real pans: constant speed is not a fault in itself.

## Curve library (cubic-bezier)

| use | curve | duration |
|---|---|---|
| crisp entrance, no overshoot | `cubic-bezier(0.16, 1, 0.3, 1)` | ~0.35-0.45 s |
| standard move (A to B) | `cubic-bezier(0.22, 1, 0.36, 1)` | ~0.25-0.35 s |
| editorial slow fade (in-out) | `cubic-bezier(0.45, 0, 0.55, 1)` | ~0.7-1.0 s |
| playful overshoot (emphasis) | `cubic-bezier(0.34, 1.56, 0.64, 1)` | <= 0.3 s, SPARINGLY, illustrated packs only |
| exit (gravity) | `cubic-bezier(0.55, 0, 1, 0.45)` | ~0.2-0.3 s |

Overshoot is an accent: one per scene at most, only on the emphasised element, and only in illustrated
packs (the films showed none elsewhere).

**Two timings (D-70).** The table is the classic crisp set. The films ran longer (medians): pops 0.4 to
0.6 s, other entrances 0.5 to 1.1 s, transforms 0.7 to 1.3 s. Crisp suits interface-like content; the
longer range, a drawing being explained.

## Separate timing from mapping

One normalised progress (0 to 1, with its easing) should drive every property of a move - position,
opacity, scale - never re-time each property separately. In a timeline editor: one set of keyframes
per move, not staggered keyframes per property. In code: one animation with several targets, and one
duration-and-delay pair per reveal group, not per element. The symptom of violating this: elements of
the same reveal "swimming" at slightly different rates.

## Reveal choreography

- **Reveal order = narration order, ALWAYS.** Anything on screen that is never spoken is a content
  problem; anything spoken before it appears (or long after) is a timing problem. They are two halves of
  one rule.
- **The stagger depends on what binds the group:**
  - **one gesture** (peers, tags, an unspoken set): 60-120 ms apart, the group under ~1.2 s, or the viewer
    waits (the packs' `motion.stagger`).
  - **an authored cadence** (the build is the point: units stamped to a share, a pile counted): about
    0.4 to 0.5 s per arrival.
  - **a spoken list:** each item on its own word, about 1.5 s per item in the films.
  - *Changed (D-112): this was one 60-120 ms rule for every group; the films use all three cadences.*
- **Nothing enters during the last spoken words of a scene.** Motion after the narration has finished
  reads as a mistake, and the transition will cut it off anyway.
- **Hold rule: a revealed element stays put.** Re-layout after a reveal (things shuffling to make room)
  is the single most amateur-looking failure. Reserve the space first, then reveal into it.

## Transitions between scenes

- **Default: a cut, or a ~300 ms fade.** Directional wipes or slides only when the RELATION means
  something (before to after, step to next step).
- **A transition never exceeds ~400 ms** in a narrated video; it steals time from the narration, and the
  script's length was budgeted for speech, not for choreography.
- **A still camera and a moving drawing is the default** (static in 5,158 of 6,307 shot records).
- **One camera move per scene at most:** slow, eased, one axis, never shake or compound. Camera motion
  and element motion at the same time causes nausea; pick one.
- **One long eased move may carry a whole explanation, 10 to 20 s, and may cross a join** (not a
  transition, so not bound by ~400 ms). `Loom.cam.push`/`.pan` take any span; across a join, end it into a
  `camera`, `travel` or `zoom` join, continue beyond, and check the strip.

## Word-synced emphasis and captions

- **Emphasis fires ON the spoken word** (underline, highlight, colour change): lead by <= 80 ms, never
  lag. A late highlight reads as broken.
- **Captions:** 1-2 lines, break at clause boundaries, never orphan a single word on line 2. Active-word
  styling changes ONLY colour or weight, never size or spacing - no reflow while someone is reading.
- **A number being spoken gets its on-screen counterpart revealed AT the number**, not at the start of
  the sentence.

## Springs - a natural arrival, specified the way a designer thinks

A spring is set by two numbers, not by physics constants:
- **bounce:** 0 is a critically damped arrival with no overshoot; 0.15 is a hint; 0.3 is lively.
- **visual duration:** when the eye sees the element arrive.

The settle time is longer than the visual duration. Give the tween the settle time; judge the feel by the
visual duration.
- **bounce 0 is the best default entrance** for cards, panels and toasts. It decelerates more naturally
  than a bezier, and it never overshoots.
- **Bounce is overshoot,** so it follows the overshoot rule: only where the style's motion personality
  allows it (`motion.overshoot: true`), at most once per scene, and only on the emphasised element.
- **Specify a spring as a closed-form curve over normalised time, never as a simulation stepped per
  frame.** A simulated spring is not seekable, and a code-rendered video must be.

## Orchestrating a group - the order says something

- **Parent before children.** The container arrives first; its members start about halfway through it.
  Members arriving into nothing read as debris.
- **The stagger order is a statement:**
  - **forward** (reading order) says a sequence or a list;
  - **centre-out** says "radiating from this focus";
  - **edges-in** says "converging on one point";
  - **shuffled** (seeded) says "an unordered collection";
  - peers never get a slow serial build, because that implies rank.
- **A group that arrives as one gesture lands within ~1.2 s.** If n x stagger would exceed it, compress
  the stagger; never lengthen the group. A cadence or a spoken list is not one gesture (above).
- **A group leaves in REVERSE order, faster than it came** (about 0.6x the stagger). Members go before
  their container.

## Fast in, then HOLD - the reading floor

Pace comes from motion and cuts, never from pulling text away early. Any line the viewer must read stays
fully visible and settled long enough to read it. The clock runs from when its entrance ends until its
exit begins:
- a label (1-3 words): **at least 0.8 s**;
- a sentence: **0.3 s per word, at least 1.2 s**.

A line may SLAM in within 0.3 s and then hold: that reads as punchy AND legible. Text that is only texture
does not need to be readable. If a scene carries more text than its time allows, cut words or split the
scene; never speed the reveal up. A narrated line is still read: the floor applies to it too.

## Rest is deliberate - a finished frame may hold

The films hold a finished, dense frame 7 to 24 s while the voice explains it. Loom's failures were long
holds on EMPTY frames; these are on FINISHED ones.
- **Declare it:** `intent: "rest"`, `"process_hold"` or `"punctuation"` (a 0.6 to 1.2 s beat), up to the
  pack's `pace.rest_max_s` (20 s). The static-hold, empty, sparse and repeated-frame checks honour it (D-112).
- **Earn it:** the frame is complete, the narration is about it, and one slow ambient loop keeps it alive.
- **Motion share and cut rate describe a film; never target them.** Good films sat at 0.60 motion share
  and 1 to 31 joins a minute.
- *Changed (D-112): "holds over 4 s need work" and a motion share near 0.85 described our failures, not
  good films; they now apply only to undeclared holds.*

## No double exposure

A crossfade between two busy layouts makes a muddy double image. Either the old content leaves first and
the new arrives after, or the cut dips through the background. **Look at a still from the middle of every
transition**, not just the settled frames: that is the only place this defect exists. A deliberate ghost
is a device: declare it with `join_in.overlap: "ghost"`.

## Gestures - small, physical, one job each

| gesture | says | shape |
|---|---|---|
| shake | wrong / blocked / no | decaying horizontal oscillation, ~0.4 s, amplitude ~12 px |
| nudge | look here | a small move toward a direction and back, ~0.35 s |
| press | this was tapped | scale down ~4% fast, then back past rest with a spring, ~0.35 s |
| glow | this is the payoff | a halo that swells once and fades, ~0.9 s; no filters |

One gesture per element per scene. A gesture that repeats becomes a tic.

## Simulated interaction - show the thing in use

When the lesson is about a tool or a process, the strongest picture is the tool DOING its job:
entry, then the key action, then the result.
- **Cursor:** moves on a gentle arc. Its duration grows with distance (about 0.3 s plus distance/2400
  px/s, capped under 1 s); it never teleports.
- **Tap:** the pointer dips, the target is pressed, and a small ripple marks the spot.
- **Typing:** a human pace (15-25 characters/s). The caret follows the real text width, and it blinks
  only while idle.
- **Result:** confirmed by something arriving (a toast, a state change), not by a caption saying so.

Every word in a simulated UI is real content from the source, or plainly illustrative UI chrome; never an
invented claim.

## Sound is part of the choreography

- A sound lands at the START of the motion it belongs to (0-0.1 s before its first visible frame), never
  at the end.
- **Accent the first and last of a sequence,** not every item. Repeated small sounds (keys, ticks) sit in
  the background and are thinned.
- **Effects are in the music's key and sit under it and under the voice:** one piece, not a layer laid on
  top.
- Match the family to the gesture: a tap clicks, a card slides, a landing thuds softly, a payoff chimes,
  an error buzzes low. Restraint beats variety.
- In a narrated video the voice owns the timing. The music can follow the EDIT, with chord changes on cuts
  and section starts; reveals never chase the beat.

## Illustrated packs only (look_family: illustrated: story-cartoon, flat-cosmos, glow-flat, whiteboard, cinematic-noir, cinematic-dawn)

Nothing here applies to editorial or technical packs.
- **Hand-made time:** drawings and texture step on fours (0.167 s) or threes; poses step (pose A, pose B,
  the peak on the key word). Use `Loom.stepped.on(E, {hz: 6})` (and `Loom.stepped.boil` for a living outline); never fake the steps by hand (D-114).
- **Springy pops** on cartoon people and small accents only, within the overshoot rule.
- **Morph chains and motif-shaped wipes** (D-114): `Loom.morph.to` / `.chain` inside a scene; the joins `motif`,
  `torn`, `page`, `scroll` in the storyboard. Name the join material in `devices`. Never hand-draw a fake morph.

## The poster frame

The still that represents the video (a thumbnail, a player poster, an LMS card) is the strongest SETTLED
frame: text fully in, not mid-transition. For anything shared outside a player, make it frame 0 as well,
because most platforms thumbnail frame 0.

## Performance and reliability

- **Animate transform and opacity.** Animating filters, blurs and shadows is expensive at high
  resolution, stutters on weak devices and slows rendering. Keep heavy effects for the few scenes that
  are openers, section dividers and payoffs.
- **If the video is rendered from code, every animation must be a pure function of the frame clock** -
  no wall-clock time, no randomness without a fixed seed, no timers - so the same input renders the same
  frames, a render can be resumed or split across machines, and scrubbing lands on the right picture.
