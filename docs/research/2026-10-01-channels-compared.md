# Three channels, measured side by side (2026-10-01)

STATUS: SHIPPED 2026-10-01. Research reference, not a rule. Built from the three per-channel studies:
`docs/research/crayon/2026-10-01-crayon-capital-study.md` (7 videos), `docs/research/cleo/2026-10-01-cleo-abram-study.md`
(5), `docs/research/lucas/2026-10-01-lucas-lab-study.md` (2). All numbers are from `tools/video_study.py` on the
requester's own copies; speech rates are pocketsphinx readings corrected down by about 10% (an estimate, not
calibrated per channel). Three different ways to be interesting, not one right answer.

| | Crayon Capital (cartoon biography) | Cleo Abram (host-led documentary) | Lucas's Lab (math-first explainer) |
|---|---|---|---|
| cuts a minute, first minute | 10 to 27 | 24 to 51 | 14 to 16 |
| cuts a minute, after | 9 to 17 | 14 to 22 | 3 to 7 (a floor: see its study) |
| median shot | 2.6 to 5.7 s | 1.4 to 2.4 s | 1.8 to 2.2 s |
| seconds with motion | 85 to 92% (49% in the older video) | 82 to 96% | 41 to 51% |
| longest hold (not end card) | 3 to 8 s | 4 to 21 s, on a diagram | 43 and 53 s, on one board |
| speech (corrected) | about 142 to 150 wpm | about 137 to 161 wpm | about 170 wpm |
| pauses over 1.5 s | 3 to 6 | 2 to 23 | 0 to 1 |
| where the frame rests | nowhere for long | a flat diagram | the diagram being built |
| what carries the idea | people deciding things, props with numbers | a proxy learner, real sources, one returning diagram | one board changed by additions, real hardware between |
| the hook | a paradox or the end state | a big claim with its caveat | the real machine, then the law |
| the payoff | the opening image returns | the stakes, or the proxy completes the journey | the current state, then the next video |

## What the comparison says
- **The frame rests where the learner has to read.** In both explainers the longest holds checked were diagrams (Cleo 7 to
  21 s on a 2x2, a timeline or a map; Lucas about 20 to 50 s on one board), while footage and the host keep moving.
  The cartoon never rests for long, and carries its information on props inside moving scenes instead. For
  Loom that points to holding on the diagram being built, which is also what the reading floor asks for.
- **Pace follows the subject within a channel,** not only across channels: Cleo's reflective womb video is her
  slowest; Crayon's older doodle video moves least.
- **Every channel returns to something.** Crayon returns to the opening image, Cleo to a diagram and the
  proxy's journey, Lucas to a running symbol (the spin sphere). A return is the cheapest device of the three
  and the one most tied to recall (spaced re-exposure).
- **None of them uses the fastest pace for the hardest content.** Lucas's densest math sits on the slowest
  picture; Cleo's diagrams hold longer than her footage.

## For Loom, by register (the person chooses)
- **Story cartoon** (Crayon-like): running character, props that carry numbers, black narration cards, bookend.
- **Presenter documentary** (Cleo-like): presenter proxy, source highlight cards from the lesson's own
  document, one diagram that builds and returns, a tight brand label kit.
- **Math or system explainer** (Lucas-like): one board changed by additions, a running symbol, real
  equipment or real screenshots between boards, `kind: manim` for the math.
The storyboard can name the register in `story` and mix them per beat; the storyteller skill keeps all three
as options (see its section 9).

## Later the same day: TED-Ed and Kurzgesagt added (five channels)

Sources:
- TED-Ed: `docs/research/teded/2026-10-01-teded-study.md` (7 lessons).
- Kurzgesagt: `docs/research/kurz/2026-10-01-kurzgesagt-study.md` (5 newer, 2 older).

Same tools. One caveat for both: in animation the cut detector counts designed transitions and in-shot
changes, so these rates are upper bounds. A hand check found 5 of 8 were hard cuts in each channel.

| | TED-Ed (a different studio per lesson) | Kurzgesagt, newer (one house style) |
|---|---|---|
| length | 5:26 to 6:36 | 7:25 to 15:14 |
| visual events a minute (upper bound) | 7.6 to 16.1 | 9.8 to 16.4 |
| median shot | 1.2 to 4.8 s | 2.0 to 4.2 s |
| seconds with motion | 77 to 95% | 92 to 99% |
| holds in total | 10 to 56 s per lesson | 4 to 42 s per video |
| where the frame rests | a term card, a labelled diagram, a quiet character beat | a labelled comparison: two panels, a before/after with a % |
| speech (corrected, rough ASR) | about 120 to 141 wpm | about 152 to 162 wpm |
| explanation cues a minute (rough) | 0.9 to 2.3, it narrates | 2.0 to 3.9, it argues |
| drawn / covered / vivid | 0.20-0.49 / 0.71-0.91 / 0.02-0.43 | 0.28-0.33 / 0.62-0.84 / 0.71-0.95 |
| what carries the idea | a personified mechanism; one object transformed in place; a term card | pill labels on things; a running comparison pair; simulated interfaces |
| the close | the opening returns, changed | the comparison resolves; then a sponsor |

What the five channels say together (references, not rules):
- **The frame rests where the learner has to read,** now seen in all five channels. The rests are on a
  diagram, a board, a term card, a labelled comparison. Footage, hosts and story scenes keep moving.
- **Full frames come from more than line work.**
  - Crayon fills with props and outlines (drawn 0.40 to 0.50).
  - Kurzgesagt fills with saturated colour fields and glow (drawn about 0.30, vivid up to 0.95).
  - TED-Ed fills with a textured ground (covered 0.71 to 0.91, grain about 1.0).

  For a code-drawn engine, colour fields and texture are the cheaper of the three.
- **The look can follow the subject.** TED-Ed shows a fixed shell (opening card, credits) around a style
  chosen per topic. That is the "person chooses the pack per lesson" model, with the organisation's brand in
  the shell.
- **The pace is set by the channel's audience.** TED-Ed is the calmest (about 130 wpm), Kurzgesagt the
  fastest (about 155). For corporate teaching, TED-Ed and Lucas are the nearer references for pace; Crayon,
  Cleo and Kurzgesagt for how ideas become pictures.
- **Every channel returns to something** (five of five): an opening image, a diagram, a symbol, a comparison
  pair, a chart redrawn.
