# TED-Ed learnings into Loom: what is general, what is illustrated only (D-112)

STATUS: SHIPPED (learnings, gates, tooling), 2026-10-06; primitives next. Source: `docs/research/vision/2026-10-05-tedEd-full-conclusions.md` (section numbers
below refer to it).

## Kshitij's direction (2026-10-06)
- **What generalises:**
  - storyboarding and colour grading (tone) apply to every lesson, alongside anything else that holds across styles;
  - so do the gate fixes.
- **What stays scoped:** everything specific to TED-Ed's look applies only to the cartoony and cinematic packs. That
  covers characters, figure style, hand-drawn timing, cartoon joins and tone targets measured on TED-Ed.
- **The tooling:** fix every vision-lab failure, so the next run neither errors nor writes a wrong schema.
- **Scope:** this round is learnings, gates and tooling. New runtime primitives come after, one at a time, each proven
  in the motion lab.

## 1. Look families (new pack field `look_family`)
| look_family | packs | gets |
|---|---|---|
| `illustrated` | story-cartoon, flat-cosmos, glow-flat, whiteboard, cinematic-noir, cinematic-dawn | general + illustrated-only learnings, TED-Ed tone references |
| `editorial` | editorial-paper, presenter-pop, corporate-clean | general learnings only |
| `technical` | engineering, dark-technical, line-art, chalk-lab | general learnings only |

`style_lint` requires the field. Skills say "illustrated packs only" wherever a rule is scoped. (The storyboard
already uses `register: productive|expressive` per scene for something else, so the pack field has its own name.)

## 2. General learnings (every look family)
They held across 12 drawing families in 96 films, and nothing about them is cartoon-specific.

**Storyboarding:**
1. **A device set per lesson** (`storyboard.devices`): 3 to 5 named devices, reused across beats, plus one join
   material. Films are built from a few devices repeated; Loom invented every beat alone (section 8.4).
2. **Hold the layout, change its state** is the default for mechanism and structure beats. One panel, cutaway or
   object stays, and its contents swap, recolour or relabel on the spoken word (section 7.4).
3. **Join placement:** chapter boundaries are hard cuts or a card; gradual joins live inside a topic. A zoom or portal
   enters the object, with the destination drawn inside it (already the D-100 join grammar).
4. **Lists and numbers are objects:**
   - one slot whose contents swap, or items arriving on their words;
   - unit grids stamped to a share, counters on piles;
   - never an icon grid or a bare number card.
5. **Text lives on things:** labels on the object, badges and tags, never a box on a gradient.
6. **Reuse is a device:** a returning set, a callback, a bookend, a recap by replaying the lesson's own images
   (`intent: "callback"`).
7. **Rest is deliberate.** A finished, dense frame may hold while the voice explains (`intent: "rest"` or
   `"process_hold"`). A 0.6 to 1.2 s punctuation beat is a device (`intent: "punctuation"`).
   - Motion share and cut rate are descriptions, never targets: good films sat at 0.60 motion share and at 1 to 31
     joins a minute.

**Colour grading and tone:**

8. **A value script per lesson** (`storyboard.value_script`): one value band for the film, broken deliberately for
   meaning. Examples: a dark beat reserved for the key mechanism, a flood of colour at a turn, colour withheld until
   the payoff.
   - The house arc: a pale open, a slightly richer middle, a lift at the close.
9. **One accent, placed:** a saturated accent on the element the narration names (`accent_on` per scene). It may be
   small (often under 2 % of the frame) and may change per section. A colour that means something keeps that meaning.
   - Check: more than two saturated hue families in a frame is a warning.
10. **Finish is material, judged on the encoded MP4.**
    - Paper, brush and print texture belongs to the drawing, not a full-frame noise overlay.
    - The pack default stays near-off (D-100); a lesson opts in.

**Motion:**

11. **One long eased camera move may carry a whole explanation** (10 to 20 s), and may cross a join.
12. **Entrances are short and eased; items stagger at authored cadences:** about 0.4 to 0.5 s per arrival, about 1.5 s
    per spoken list item.

## 3. Illustrated-only learnings (`look_family: illustrated`)
1. **People:**
   - small in a composed place, faceless or minimal faces, emotion in posture;
   - profile, three-quarter and back views;
   - hands as presenters; silhouette crowds;
   - big faces only with designed rigs.
   - Code never draws figurative content from imagination (D-102 freeze stands).
   - Featureless figures read as professional only when small, in the frame's most detailed place, or posed as
     equal-scale specimens on a field.
2. **Hand-made time:** texture and drawings may step on fours (0.167 s) or threes; stepped pose beats (pose A, pose B,
   the peak on the key word). A primitive will come in the next round; until then, scenes do not fake it.
3. **Cartoon joins:** morph chains, motif-shaped wipes, torn paper and page turns, a dive through a surface. These
   need the coming primitives; storyboards may name them as `devices` and fall back to existing joins.
4. **Mixed media inside one framing system:** border, palette, label style and grain shared. Never two unrelated
   languages without that system.
5. **Springy pops** are allowed on cartoon people and small accents. Corporate and technical packs keep no overshoot.
6. **Tone references** (`pack.tone_reference`, from `colour_and_tone.md`, measured on TED-Ed families): brightness,
   saturation, dark and light share, warm and cool share, accent share. The check warns when a lesson strays far.

## 4. Gates (general)
| check | change |
|---|---|
| empty frame | also accepts `rest`; `punctuation` accepted for runs of 1.2 s or less |
| sparse frame | also accepts `rest`, `process_hold`, `punctuation`; packs may lower `pace.sparse_edges` (dark-field packs 0.01) |
| repeated frame | also accepts `callback`, `rest`, `process_hold` |
| static hold (`qa.py`) | `hold`, `rest`, `process_hold` allow up to `pace.rest_max_s` (20 s) without error, warn above |
| double exposure (`qa.py`) | skipped when the incoming scene declares `join_in.overlap: "ghost"` or `intent: "ghost"` |
| on-screen type | `intent: "diegetic_text"` turns a tiny-text error into a warning (signage, texture text), never for narrated terms |
| tone (new, warnings) | value script against measured brightness per beat; more than two saturated hue families in a settled frame; illustrated packs against their tone reference |

Each change gets a test that passes with the declaration and still fails without it (Rule 0).

## 5. Vision-lab tooling (fixes for the next run)
Every bug in section 5 of the conclusions, plus run safety:
- **Measurement:**
  - pacing over parent shots;
  - the longest still run;
  - `look` over all three stills;
  - chroma share and small-accent detection;
  - the move cap raised, with the overflow counted;
  - short moves classified (jitter, boil, cycle, swap, pan);
  - the cut-count mismatch reconciled;
  - impossible Whisper words dropped.
- **Prompt:**
  - code facts go in as a measured block, with jitter removed;
  - motion events state their provenance;
  - the true previous shot in sampled re-runs.
- **Calls:**
  - KV-aware admission (in-flight prompt plus max_tokens under the cache);
  - a pre-flight time budget per call;
  - thinking-cap detection, kept apart from grammar runaways;
  - the thinking text kept;
  - no identical retry of a timeout;
  - schema errors that keep their reason.
- **Accounting:** cumulative usage, raw files per invocation, receipts that include retries, progress every 5
  minutes.
- **Gates:**
  - `validate` fails on a failed or partial style guide;
  - a configured gate that is missing is red;
  - `run_full` reports every red step;
  - a phase lock stops two heavy phases sharing one server.
- **Calibration:**
  - planted films keep their audio;
  - freezes land on moving footage;
  - scoring by time and box, not label;
  - 15 plants per film;
  - redaction covers every output folder.
- **Synthesis:** off the pod by default (`vl.py distill-prep` writes the batch inputs).
- **Proof:** a mock that simulates real prompt sizes, KV queueing, thinking caps and schema overruns, with `run_full`
  end to end at 0 errors.

## 6. Next round (not now)
These are primitives, each proven in the motion lab with strips Kshitij looks at:
- shape-to-shape path morph;
- stepped time (fours);
- swap-in-place slot;
- material and motif wipes plus colour handoff and fill join;
- magnifier inset;
- data-as-objects forms;
- a footage-layer spike;
- a hands kit (assets).
