---
name: lnd-motion-choreography-loop
description: The design loop for any visual or animated element of a learning or explainer video - diagram, animated template, Manim scene, transition, effect, icon or illustration - in any tool. Choreographs and stress-tests on paper before building (three treatments, a timed beat sheet, a 13-point stress test, at least two passes), declares what must be adjustable versus fixed, then proves the result with layered checks for text placement, spacing, overlap, overflow, type size, palette and timing, and a look at real frames. Use whenever asked to create, redesign or improve an animated visual or template; whenever "make it more animated / smoother / more eye candy / better flow" is requested; whenever designing the join between two scenes; and before producing any motion.
---

# Motion Choreography Loop

You are the director, not the renderer. This skill forces three things in order, and none may be
skipped even for a small request:

```
  LOOP     brief -> diverge -> compose -> beat sheet -> stress test -> converge   (min 2 passes)
  CONTRACT declare what is fixed and what is adjustable, before building anything
  PROVE    run the layered checks, look at frames, report what you checked
```

**Companion skills.** Obey `lnd-visual-design` - it governs the craft numbers. Obey `lnd-motion-craft`
- it governs easing and reveal law. Use `lnd-motion-fit` for which motion each design needs and in what
order. This skill governs *process, contract and proof*. On a conflict, the craft skills win on craft
numbers; this skill wins on sequence and on evidence.

---

## 0. The brief, in six lines

| | |
|---|---|
| **Outcome** | What must the learner be able to do or recognise afterwards? One sentence. No outcome, no visual. |
| **Cognitive job** | Exactly one of: orient · define · distinguish · sequence · relate · quantify · demonstrate · check · consolidate · transition. Two jobs means two visuals. |
| **Prior knowledge** | The only learner attribute worth branching on. Never branch on a "learning style". |
| **Scene duration** | Motion design without a time budget is guesswork. Derive it from the narration. |
| **Narration** | The exact words, in order. Reveals anchor to words; without the script you are guessing. |
| **Register** | A sober compliance module and a punchy explainer are not the same design at the same intensity. |

Then the gate that rejects more requests than any other:

> **Is the thing being taught itself a change over time?** A process running, a value accumulating, a
> state transforming. If yes, animate the change - that motion *is* content and must be accurate,
> because motion order teaches causal order whether you intend it or not.
>
> If no - a structure, a definition, a taxonomy, a comparison - the correct visual is a **static
> composition with signalling**, and motion is permitted only as staging.

Most requests for "more animation" are requests for better staging of a static composition. Say so.

---

## 1. LOOP

### Pass A · Diverge - three genuinely different treatments

They must differ in *visual argument*, not skin. Three palettes of one layout is one candidate. One of
the three is **always** "static composition + signalling". It wins more often than expected.

Pick the grammar the content shape demands:

| Content shape | Form |
|---|---|
| Process, ordered steps | Left-to-right flow, explicit arrowheads, one arrival at a time |
| Cycle | Ring, consistent rotational direction |
| Hierarchy | Top-down tree |
| Tension or contrast | Two aligned columns, matched row semantics, both sides populated together |
| Part-whole | Filled vessel or stacked bar; a pie only for <=3 slices with one dominant |
| Quantity to compare | Position or length - never area or colour (position > length > angle > area > colour) |
| Sequence over time | Single axis, labels on one side |
| Precise values | A table. When numbers matter more than shape, a diagram is the worse choice |
| A claim someone will resist | A two-character dialogue that voices the objection |
| A failure mode | A risk card: the wrong move on one side, the counter-habit on the other |

### Pass B · Compose - frame the shot

On a 1920x1080 canvas (scale proportionally for others), decided explicitly per candidate:

- **Grid:** 12 columns, ~96 px outer margins. **Proximity beats similarity**: the gap inside a group is
  at most half the gap between groups - 16 px inside a group, >=32 px between groups, >=48 px between
  blocks.
- **One focal point.** Two things competing for first attention is a failed composition.
- **Safe areas:** text inside the **title-safe 90%**, everything meaningful inside **action-safe 95%**.
  Keep the bottom ~12% clear if captions may be burned in.
- **Type against frame height, and role-aware.** A body run (>=25 characters) needs **>=2.6% of frame
  height** (28 px at 1080p). A short label may go to **2.22%** (24 px). Nothing goes below 2.22%. Display
  120-170 px · title 64-96 px · lead 34-40 px · body 30-36 px · label 24-30 px.
- **Line length** 45-75 characters. Sentence case above three words; all caps slows reading, so reserve
  it for kickers of <=4 words with ~0.2 em letter-spacing.
- **Colour** from the theme only (section 2). Contrast computed: >=4.5:1 normal, >=3:1 only above ~3.7%
  of frame height. Never colour alone as the carrier of meaning.
- **Weight the frame.** Content in the vertical middle unless there is a reason; a block in the top third
  over an empty bottom half is a bug.

### Pass C · Choreograph - the beat sheet, with a clock

A storyboard has no clock. Convert candidates into a timed table (template in
`reference/beat-sheet-template.md`):

| t (ms) | element | action | duration | easing | narration anchor |
|---|---|---|---|---|---|
| 0 | kicker | fade + 8 px rise | 400 | ease-out | "Two halves..." |
| 260 | scaffold | draw | 500 | ease-out | - |

- **Order is an argument:** frame -> structure -> focus -> detail -> consequence.
- **Overlap in flight.** Each element's duration exceeds the gap to the next, so two or three are always
  moving. Elements finishing before the next begins is why motion feels mechanical.
- **Anchor to speech.** An element appears as its own words are spoken; on-screen text shares words with
  the narration, in narration order. Never a transcript - identical spoken and written sentences compete
  for one channel and reduce learning.
- **Nothing arrives after 70% of the scene.**
- **Nothing sits empty while its sibling is populated.**
- **Hold rule: nothing re-layouts after it has been revealed.** Reflow after arrival is the single most
  amateur-looking failure available to you.
- **Reading time is arithmetic:** ~180-220 wpm = 3-4 words/s. Dwell >= `characters / 12 + 0.5` seconds,
  rounded up to a beat. Add time, never subtract, for stylised type or second-language viewers. Text stays
  legible >=0.5 s after it settles.

| move | duration | easing |
|---|---|---|
| Entrance | 400-700 ms | ease-out |
| Positional move | 250-450 ms | ease-in-out |
| Exit | 200-300 ms - faster than entrances, **not a reversed entrance** | ease-in |
| Full-frame transition | 700-1200 ms | never front-loaded |
| Micro state change | 70-150 ms | ease-out |
| Stagger | 60-120 ms per item for <=6 items; whole cascade under ~500 ms | - |

Duration scales with distance and size. Follow-through: give the primary property a secondary that
resolves slightly after it. Overshoot 2-4% reads alive; 10%+ reads cartoonish. Paths respect the grid -
stagger horizontal and vertical components rather than moving on a diagonal.

**Transitions and joins** are designs too. Pick from a grammar: **cut** (default, costs nothing),
**shared-element continuity** (carry a title, container or mark across the boundary - the strongest
way-finding device), **match cut**, **dissolve** (time passing), **push/slide on one axis**. Finish every
sequence with the important content resting on screen.

### Pass D · Stress test - attack every candidate

1. **Apprehension at 1x** - perceivable once, first viewing, no rewind?
2. **Element budget** - working memory holds ~4±1 chunks; max 5-6 revealed elements.
3. **Reading-time arithmetic** on every text element.
4. **Late arrivals** past 70%.
5. **Travel paths** - trace every moving element against every resting one. *Does anything fly over
   anything?* Static review never catches this; viewers always see it.
6. **Empty siblings / half-built comparisons** at every moment, not just at rest.
7. **Hold rule** - does anything reflow after arrival?
8. **Reduced motion** - with staging removed, does it still teach? If not, the meaning was living in the
   motion and the design is fragile.
9. **Motion safety** - nothing flashes more than 3 times per second; no large-area parallax, full-frame
   zoom, spin or rapid reversal; more than 5 s of automatic motion needs a pause affordance in an
   interactive player; nothing loops in a reading zone.
10. **Phone legibility** - smallest type as % of frame height, against the role-aware floors.
11. **Colour-only meaning**, contrast computed, off-palette accents.
12. **Seductive detail** - richness is zoned: welcome on openers, dividers, transitions and payoffs;
    restrained on definitions and worked examples; effectively banned on dense explanation, data,
    comparison and anything assessed. Asked to "go crazy", put the spectacle where it costs nothing and say
    that is what you are doing.
13. **Cost** - full-canvas blurs and per-frame filters belong on the ~15% of scenes that are openers,
    dividers and payoffs.

### Pass E · Converge, then loop again

Four lines: the treatment · why it beat the others · what you are deliberately not doing · the risk that
remains. **Then loop** - B to D at least once more; the second pass is where the beat sheet stops being a
plan and starts being right. Minimum two iterations, stop at four. Nothing gets built until the gate is
clear.

---

## 2. CONTRACT - what must be adjustable

A visual that hard-codes what should be adjustable is a defect even when it looks perfect, because it
cannot be reused, re-themed or re-timed. Declare the contract **before** building - whether the visual is
a code template, a motion-graphics template (MOGRT), a slide master, or a reusable scene.

### The iron law

> **Every declaration must have a consumer on day one.** A declared rule that nothing reads is decoration
> that rots. If you add a setting, field or rule, add the thing that honours or checks it in the same
> change - or do not add it.

### Fixed versus adjustable

**Fixed (structural, not settings):** layout geometry, the grid, safe margins, reading order, the semantic
grammar of the component, its natural size. Someone who needs these changed needs a different visual.

**Adjustable - declared as a mini-schema, every one with type, default, and range or choices:**

```
label   : text,    default ""
z_crit  : number,  default 1.645, min -3.5, max 3.5
tail    : choice,  one of left | right | two, default right
shade   : on/off,  default on
layers  : list,    default ["Hardware", "Operating system", "You"]
```

- **Every setting gets a type, a default, and a range or choices,** plus one line in your rationale on
  what changing it does to the learner. Choosing defaults is a design act: the default must be right for a
  general audience meeting the content for the first time.
- **Motion settings are settings too** - entrance duration, stagger, draw lead, overshoot. If the visual
  honours one, declare it; a knob that works but is undeclared is invisible to everyone who reuses it.
- **Declare every setting you honour, and reject or flag ones you do not.** A template that silently
  ignores an unknown setting turns a typo into a missing feature nobody notices.
- **Defaults are placeholders, never invented content.** A default label of "refund policy" or a default
  statistic will eventually appear on a real video where someone forgot to fill it in. Use neutral
  placeholders ("Item 1", "Label"), or mark deliberate fixed copy explicitly as intentional.

**Colour - theme values only.** Read every colour from the theme (background, surface, ink, muted text,
line, accents, positive, negative, text-on-accent). Never a literal colour value inside the design: it
works in exactly one theme. Choose the text colour on a filled shape by computed contrast against that
fill, not by pairing theme names by eye.

**Timing - never absolute seconds inside elements.** Give each element its ORDER (a step number) and let
the delay be computed from shared timing settings, so the scene duration and a global motion intensity
still govern it. A hard-coded 3-second animation on one element stops responding to every global change.
The only sanctioned exception is an intentional ambient loop, marked as such.

**Step numbers must form a contiguous run.** Steps `0, 2, 3, 4, 5` mean the cascade has a hole and the
reveal visibly hitches while it waits out the missing step.

**Layers.** Mark decorative furniture (rules, background motifs, brand marks) as furniture, so it is
excluded from narration sync and never mistaken for content; furniture may dress whitespace, never add
content. Mark on-screen chrome the narrator never reads (axis titles, faint quadrant labels) so nothing
waits for it to be spoken - and do NOT mark things that are spoken (a speaker's name plate), or they will
lag behind the voice.

**One logical label, one text element.** Tools that build word anchors from text content glue adjacent
text pieces together ("1Sensing") and lose the anchor.

**A self-test ships with every reusable template.** Render it at three content sizes including a
degenerate one (empty, one item, the maximum); check the steps are contiguous; check the geometry does
what the design claims (bars rise, a tree descends); check that a supplied setting beats its default; and
check that two renders of the same input are identical.

### Manim scenes - the same contract, a different renderer

| Concern | Do not hard-code | Make it |
|---|---|---|
| Content | Strings inside `construct` | A parameter, injected (e.g. from JSON) |
| Colour | `BLUE`, `"#2f6fed"`, a mood dict | A lookup from an injected palette |
| Type size | `font_size=42` | Derived from a declared parameter, then `scale_to_fit_width/height` against the frame |
| Timing | `run_time=1.4` sprinkled inline | Derived from the scene duration and a declared setting |
| Easing | The default | An explicit `rate_func` per the table below |
| Stagger | A literal `lag_ratio=0.1` | `stagger_seconds / run_time`, computed |
| Randomness | Bare `random` / `np.random` | A seeded generator with the seed as a declared parameter |
| Scene structure | One monolithic `construct` | `self.next_section()` at scene boundaries |

A good Manim template also caches by a hash of (source, scene, parameters, palette, fps, quality), renders
transparent frames when it will be composited (`-t`), and declares its parameters and palette tokens the
same way any other template does.

**Easing translation - and the trap.** Manim's default `rate_func` is `smooth`, which is symmetric
ease-in-out. So **every entrance in a default scene starts slowly**, violating ease-out-for-entrances
unless you override it. That one default is responsible for most "why does this feel sluggish".

| beat sheet says | Manim |
|---|---|
| entrance, ease-out | `rate_func=rate_functions.ease_out_cubic` |
| positional move, ease-in-out | `rate_func=rate_functions.ease_in_out_cubic` (or `smooth`) |
| exit, ease-in | `rate_func=rate_functions.ease_in_cubic` |
| continuous drift | `rate_func=linear` |
| duration 400-700 ms | `run_time=0.4...0.7` |
| stagger 80 ms over a 600 ms move | `LaggedStart(..., lag_ratio=0.08/0.6)` - a **fraction of run_time, not milliseconds** |
| scene boundary | `self.next_section()` |

**Manim-specific defects to check for deliberately:**
- `scale_to_fit_width` / `scale_to_fit_height` never called, so long content silently leaves the frame.
- A mobject placed with `.next_to()` / `.shift()` that lands on top of another after a later `.play()` moves
  its neighbour - the Manim form of "flying over".
- LaTeX / `MathTex` overflowing its region at large content sizes.
- The sum of `run_time` across a scene not matching the narration length.
- `lag_ratio` so small the cascade reads simultaneous, or so large the scene overruns.
- Caching (on by default, and correct) hiding a change you believe you made - verify by hash, not by eye.
- Opaque output where the compositor needs transparency: render with `-t`.

---

## 3. BUILD - rendering invariants

These matter most when video is rendered from code (HTML, SVG, CSS, a headless browser capturing frames,
Manim); the principle behind each applies in any tool.

- **Determinism.** The same input produces the same video. In code, every frame is a pure function of
  `(scene, frame)`: no wall clock, no unseeded randomness, no accumulated state, no network. Two renders are
  byte-identical - which is what lets you split a render across machines, resume one, and trust a re-render.
- **Seekability.** If frames are captured by setting an absolute time and taking a screenshot, use only
  constructs that can be seeked: CSS animations and the Web Animations API. **Avoid SMIL** - it does not
  appear in `document.getAnimations()` and cannot be posed. Never `requestAnimationFrame` state, never JS
  timers. The same applies to embedded players: a Lottie layer plays on rAF, so drive it with
  `goToAndStop(frame, true)` and its SVG renderer if you want the text to stay inspectable.
- **One property, one animation, per element.** With several CSS animations on one property the last
  declared wins outright and the others are dropped silently. Put drift on the parent, morph on the child.
- **Multi-waypoint loops:** `ease-in-out` decelerates to near zero at *every* waypoint, so an 8-stop loop is
  nearly stationary. Use `linear` for continuous drift.
- **Loops seamless and period-locked:** 100% identical to 0%, and the period divides the scene duration
  exactly, so duplicate frames can be reused rather than re-rendered.
- **Text never inside a gooey, threshold or displacement filter.** Filtered artwork and crisp type are
  separate sibling groups.
- **`color-interpolation-filters="sRGB"`** on every SVG filter.
- **Generated files are not edited by hand.** If an index, catalogue or bundle is produced by a build step,
  change its source and regenerate it; hand edits are lost on the next build.
- **Do not fork.** When near-duplicate copies of a template exist, confirm which one the real render uses
  before editing, or you will change nothing.

---

## 4. PROVE - three layers, each measuring what only it can

This is what makes a claim of quality checkable. The layering is not bureaucracy: measuring the same
visual three ways shows each layer blind where another sees.

| Layer | How | Sees | Blind to |
|---|---|---|---|
| **Source** (the file itself: SVG/XML, project file, scene code) | read or lint it | exact type size, spacing and rhythm, alignment, safe area, literal colours, hard-coded seconds, step contiguity, glued labels | anything that only exists while animating; composited colour |
| **Timeline** (a browser or player, sampled across time) | e.g. a headless browser (Playwright/Puppeteer) seeking to N times | real text boxes at each time: collisions, container overflow, late arrival, overlap in flight | nothing about the source contract |
| **Pixels** (rendered frames) | contrast and ink checks on exported frames | contrast as composited, something drawn across text, blur, ink outside the frame | type size, and anything mid-animation a still cannot show |

**Why all three:**
- **A raster cannot tell you a font size.** OCR measures ink extent - cap height or x-height, depending on
  which letters the word contains. Measuring type from pixels produces false failures on correct designs.
- **The font-size value alone is also wrong** whenever content is drawn at a natural size inside a scaled
  group: a 16-24 px attribute can render at 22-36 px. Effective size = `font-size x cumulative scale`. A check
  that reads the attribute without resolving transforms is lying.
- **Collisions that exist only in flight are invisible to source and stills.** An element flying in from the
  right passes over anything resting in the middle; at rest the frame is clean and every static check passes,
  while for ~160 ms it is unreadable. Only sampling the timeline finds it.

Manim has no DOM, so the timeline layer does not apply. Review the source against section 2, render single
frames at scene boundaries, and run the pixel checks on them. If you cannot render a still, fix that first -
a visual you cannot inspect frame by frame cannot be checked.

### 4.1 Your own eyes, on four frames

Render and **look**: the first frame, one mid-build frame, the settle, the last frame. Automated checks miss
what is obvious to a viewer, and they also report defects that are not real. **When a check and the picture
disagree, the picture wins and the check gets fixed.**

Then verify **end states** - first and last frames both intentional; a transition resolves to exactly the
source at t=0 and exactly the target at t=1 - and **determinism**: render twice, compare.

**Add two frames that the four above miss:**
- **one from the middle of each transition,** where double exposures live;
- **one from the end of the reading window of every line,** so a line that leaves before it can be read is
  caught.

When the engine can render a technique in isolation (a lab or filmstrip harness), prove a NEW primitive
there first, in at least two styles, before any lesson depends on it.

### 4.2 Calibration discipline

**A finding on a shipped, reviewed design is a candidate tool bug before it is a design bug.** A single global
type floor applied to every string once failed 12 of 20 correct captions; the test was wrong, not the
captions. Hence role-aware floors - 2.6% of frame height for a body run of >=25 characters, 2.22% for a short
label.

Before acting on a new check, run it across known-good designs and look at what fires. If it lights up
everything, it is miscalibrated. **Any new check ships with a self-test that deliberately breaks each rule and
confirms it fires, plus a clean example that stays clean.** A gate that has never been shown able to fail is
not a gate.

**Estimators are advisory, never gates.** Glyph widths estimated from a per-character constant are guesses
(different tools use 0.50, 0.52, 0.55, 0.58 of the font size). Never quote an estimated width as a
measurement, and never block on one.

### 4.3 Report

State what you ran, what it found, what you fixed, and **what is still unverified**. "The design is built but
no frame has been rendered from it" is a useful sentence. Silence is not. Never loosen a threshold to make a
check pass without stating the visual change that justifies it.

### 4.4 If a check fails

Go back to the **beat sheet or the contract**, not to a patch. A collision is a choreography error - two
things asked to occupy one place at one time - and nudging a coordinate hides it until the content changes. A
type-size failure is usually a composition error, not a font-size error.

---

## 5. Record the rationale

Every visual ships a short note a reviewer can argue with: outcome and cognitive job · why it moves or does
not · the treatments considered and why this one won · the reveal order and its reason · the declared settings
with defaults and why those defaults · theme values used · known costs and fences · verification results and
gaps.

---

## 6. Never justify a decision with these

- **Learning styles / VARK matching.** The meshing hypothesis is unsupported.
- **Retention percentages by modality** ("10% of what we read, 90% of what we do") - a fabrication.
- **"Attention span is 10-15 minutes."** Not supported. Segment for working-memory reasons.
- **"More animation means more engagement."** See section 0 and the seductive-detail fence.
- **"It looks better with the bounce."** Name the cognitive job it serves, or cut it.
- **"The tool says so."** See 4.2. Tools are evidence, not authority.

---

## The one-page check

```
BRIEF     outcome · one cognitive job · prior knowledge · scene duration · narration · register
GATE      is the taught thing a change over time?   no -> static + signalling
LOOP      >=3 treatments, one static · composed on the grid · beat sheet with a clock
          stress test all 13 · converge · GO ROUND AGAIN (min 2, max 4)
COMPOSE   12 col · 96 px margins · proximity ratio 1:2 · one focal point · title-safe 90%
          body run >=2.6% of frame height, label >=2.22% · contrast computed
CHOREO    frame -> structure -> focus -> detail -> consequence
          overlapping in flight · anchored to narration · nothing after 70% · nothing reflows
          entrance 400-700 · move 250-450 · exit 200-300 · stagger 60-120 · dwell >= chars/12+0.5 s
CONTRACT  every setting declared with type + default + range · colour from the theme, never literal
          no absolute seconds inside elements · steps contiguous · furniture and chrome marked
          one label one text element · defaults are placeholders · self-test · every declaration has a consumer
MANIM     params injected not inlined · palette injected · scale_to_fit_* called · rate_func explicit
          (default smooth is ease-in-out and makes every entrance sluggish)
          lag_ratio is a fraction of run_time · seeded randomness · next_section per scene · -t for alpha
RENDER    deterministic · seekable (no SMIL, no rAF) · one property one animation
          loops period-locked · text outside filters · generated files regenerated, not edited
PROVE     source -> timeline -> pixels -> four frames by eye
          a finding on a shipped design is a candidate tool bug · estimators never gate
          a new check ships with a self-test · say what is still unverified
```
