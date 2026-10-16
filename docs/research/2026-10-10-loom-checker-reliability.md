# Loom's own layout checker: is it reliable enough to replace HyperFrames' check? (2026-10-10)

Kshitij: "make sure that we first check our checker and make sure our checker is reliable. We don't have to use
hyperframes checker and our checker both once our checker is good enough." And, mid-way: "even the previous motion
graphics video had a lot of flaws and some issues. Don't take it as the prime example for overlapping or gap
measurement."

So no single film and no single checker is the reference. The checker was graded three ways, and where they disagreed
**the frames won** (CLAUDE.md rule 12):

1. **Planted defects** (ground truth by construction): one lesson on the real runtime, one case per beat
   (`tests/suites/checks_layout_checker.py`).
2. **The corpus**: every past lesson whose `qa/hf_check.json` and `qa/report.json` still belong to the build on disk,
   compared finding by finding with HyperFrames' gating errors (`tools/checker_agreement.py`; read only, nothing written
   into a lesson).
3. **The frames**: every disagreement photographed with `hyperframes snapshot` on a scratch copy of the build and looked
   at.

The why-it-was-slow write-up is `docs/research/2026-10-10-why-checks-are-slow.md`.

## What the checker is

`tools/node/probe.mjs` `layoutAudit` and `contrastAudit`, inside the page load the runtime probe already makes:

- **Text overlap** (HyperFrames' rule): solid text blocks (paint alpha 0.35 or more; an SVG text by its fill, which
  HyperFrames does not read), boxes overlapping by more than a fifth of the smaller one, sampled every 0.5 s over the
  whole film. Loom's addition: **seen**, tested by hit-testing (both texts at one point of the overlap: a *clash*; no
  shared point but both texts seen somewhere: a *cut*, one partly covered where they meet). An error once seen for
  500 ms.
- **Text partly covered** (new, `text_covered`; neither checker had it): an opaque filled shape over part of a text that
  is seen elsewhere, its words cut. Every 1 s; an error once held 500 ms.
- **Redrawn text** (new, `text_redrawn`): the same words drawn again on themselves (boxes 0.8 alike) for 500 ms, one
  finding per pair of beats. A warning in the check (the copies coincide, so the frames are clean, and a later beat
  often cannot reach the earlier beat's kit instance); an error in `pilot_check` across the pilot join, where the kit
  can still change to carry its parts (L-319's redrawn sets).
- **Contrast** (HyperFrames' rule): WCAG AA (4.5, or 3 for large text) on the background behind the text with its
  glyphs hidden, at each beat's speech middle and settled moment (2 per beat; HyperFrames takes 5 per film); an error
  when the same text fails at 2 times.
- **Not judged**: a text seen nowhere (under a page, a cell, a replacing disc), a text under a blur of 1.5 px or more
  (a focus pull's backdrop), `data-layout-allow-overlap`, nested texts. A `line` never covers (no fill area).

## 1. Planted defects: 15 cases, all right

| Beat | Case | Expected | Got |
|---|---|---|---|
| b1 | two texts on one spot, whole beat | overlap error | error (clash, 3.5 s) |
| b2 | a text sweeping across another in 0.3 s | not an error | warning |
| b3 | a text wholly under an opaque card | quiet | quiet |
| b4 | the b1 pair with allow-overlap | quiet | quiet |
| b5 | a 0.2-alpha watermark under a label | no overlap; a contrast error | as expected |
| b6 | a tspan in its own text | quiet | quiet |
| b7 | pale grey on white | contrast error | error, 1.13:1 |
| b8 | the pale text wholly under a card | quiet | quiet |
| b9 | ink on white | quiet | quiet |
| b10 | a card over the lower half of a title | overlap error (cut) and covered error | both |
| b11 | another element's card over half a sentence | covered error | error, 43 % |
| b12 | a blurred backdrop sentence half under a card | quiet | quiet |
| b13 | a sentence crossed out by two thick lines | quiet | quiet |
| b14 | one label drawn twice on itself in one beat | redrawn warning | warning |
| b15 | a two-line text tilted 14 degrees | quiet | quiet |

Across beats the redrawn rule is proved on a real lesson: `pipeline_pilot_check_catches_the_kit_that_cannot_carry_continuity`
(feedback-shuttle-opus's first kit, b03 drawing again 8 calendar labels b02 still shows: the pilot fails; the shipped
kit: it passes). That test went red when Loom's checker first became the default, before the rule existed (L-391).

Each correction below was first a red run of this test (b3 failed on the opacity rule, b13 on `line`).

## 2 and 3. The corpus, judged on the frames

12 lessons had a check that still matched their build (15 others were rebuilt after their last check and were skipped:
a comparison with a stale HyperFrames verdict proves nothing).

HyperFrames made **25** overlap or contrast errors in them (after Loom's painted filter). Loom names **12** of them as
errors directly. The other **13**, on the frames:

| Lesson | HyperFrames errors | The frame shows | Verdict |
|---|---|---|---|
| feedback-relay-sb, 124 to 129 s | 6 | "Next week" wholly under the calendar page; table cells drawn twice, the top copy's cell covering the lower | clean frames: HyperFrames wrong, Loom right (not seen) |
| feedback-shuttle-s1, 39 to 45 s | 6 | the new card fades in over "A behaviour" for about half a second; at 41 and 43.8 s the card hides it | a crossfade: HyperFrames wrong (held by box, not by sight); Loom a warning |
| budget-fix1007, 49 to 55 s | 1 ("RECORD") | "Corrective feedback" squeezed between two cards, its top and bottom cut | real; Loom names the cut text (`text_covered`, error) |

Two misses on the way were real and fixed: mixed-value's "Feedback draft" title cut by a card (the first version only
asked whether both texts showed at one point), and the cut above (the first covered test looked along the middle line,
which was clear).

Loom also raises errors HyperFrames never did, all looked at on frames unless marked:

- **Real defects HyperFrames missed** (it samples contrast 5 times a film): claude-balanced 143.9 s, the card's sentence
  "In today's meeting, you interrupted Sam twice" drawn in nearly the card's own red (1.07:1) while the voice speaks it,
  and "SLOT ONE" brown on red (1.02:1); budget-fix 217.7 s "Next week" near white on beige (1.42:1); "AGREED HABIT /
  Anchor..." under a teal bookmark card; "...need to be more professional" cut by a character's body and a disc;
  "Delivery date: no..." under the "An omission" pill; https-private "Shared wifi" cut by the ciphertext card; mixed-value
  "noted." spilling onto the card's strip (2.95:1); "Jordan" (2.62:1); a dimmed card's "A" (1.86:1).
- **Real but marginal, from the style**: muted eyebrows over the story-cartoon vignette (first written here as editorial-paper), "01 Kind but vague" 2.7:1
  where 3:1 is needed (the pixels measured on the frame agree: background rgb(184,177,166)). Six of these (the same
  eyebrow and label pattern) were measured, not each photographed.
- **Wrong at first, fixed**: "Onboarding schedule" in a blurred focus-pull backdrop (now not judged); v3's "You're
  disorganised" crossed out on purpose by two `line` strokes (a line no longer covers); the two lines of v3's tilted tag
  read as overlapping (a text block's lines are no longer paired).
- **Redraws, a judgement call**: feedback-shuttle-v3's b12 rebuilds b11's whole desk part on top of b11's held copy
  (its author's note: "identical pixels, so nothing flashes"), and https-private's b14 draws the address bar again
  over the held window to swap in the look-alike host. Both frames are clean; both were done because the later beat
  cannot reach the earlier beat's kit instance. They are warnings in the check (an error there would be a gate no
  worker could clear, L-335); the same pattern at the pilot join is an error (feedback-shuttle-opus's first kit, L-319),
  when the kit can still change. Seen in passing on https-private at 91 s: the network line runs through the padlock
  (not a text defect; no checker looks for it).

## Speed

| Page | Nodes | Samples | Layout | Contrast | Whole probe |
|---|---|---|---|---|---|
| https-private with the one-node background | 3,107 | 280 | 4.4 s | 5.0 s | 14 s |
| feedback-shuttle-v3 | 4,405 | 288 | 28 s | 15 s | about 50 s |
| HyperFrames' check, https-private (old background) | 98,958 | 24 plus passes | | | about 13 min |

v3's cost is the browser painting each sample before hit-testing (about 95 ms a sample on that page, however the calls
are batched); `LOOM_LAYOUT_STEP` trades density for time. Old builds with the 96,000-dot background are slow for every
browser pass (Loom's included); their next compose draws one pattern.

## What "loom" mode does not cover

HyperFrames' other findings over every past check: `text_box_overflow` (1 error, on a build since rebuilt; 37 info),
`rotation_pivot_drift` (10 warnings), `container_overflow` (3 info). The probe already records console warnings and page
errors. Text that spills past a card drawn separately (mixed-value's "noted.") is caught today only by its contrast; a
"text leaves its card" rule is the open item.

## Verdict (final run, `docs/research/2026-10-10-checker-agreement.json`)

- **HyperFrames' 25 gating errors:** 13 are real on the frames and Loom raises every one (12 under the same text, 1 by
  naming the text that is actually cut); the other 12 are clean frames (6) or a half-second crossfade (6).
- **Loom's 21 errors HyperFrames never raised:** all real. 15 looked at on frames; 6 are the same muted eyebrow or label
  pattern, measured on the pixels, not each photographed.
- **Planted defects:** 15 of 15, each correction run red first; the existing pilot test on a real kit passes.
- **Speed:** seconds to tens of seconds a lesson instead of minutes (table above).

So Loom's checker is the default (D-154): `qa.CHECKER_DEFAULT = "loom"`. HyperFrames' check stays a choice, as the
standing direction asks (keep both ways): `LOOM_CHECKER=hyperframes` or `shadow`, or the lesson's `project.json`
`"check": {"checker": ...}`. Shadow runs both, lets HyperFrames gate, and appends the agreement to
`qa/checker_shadow.json` once per build.

Closed since (D-157): text off its card (`text_off_card`) and a line through an object (`line_into_object`); the eyebrows
are story-cartoon's (not editorial-paper's, as first written here), now a pack role the lint measures in the vignette's
corner. Still open: the 15 lessons rebuilt since their last check were not compared.
