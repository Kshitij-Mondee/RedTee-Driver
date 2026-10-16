# Golden set, first ratings (Kshitij, 2026-10-03)

**Source.** `ratings/kshitij.jsonl`: 66 of 66 rated, median 8 s a frame, no notes.
**How the numbers were made.** Every number below comes from `py -m loom golden report` and a short script over
`report_kshitij.json`, both run on 2026-10-03. **One rater and 60 frames: these are findings, not laws.**

## By class
| class | n | mean | median |
|---|---|---|---|
| reference (studios) | 20 | 3.77 | 4 |
| external AI tool | 4 | 3.00 | 3 |
| new (golden segments and lab, after D-100) | 16 | 2.75 | 3 |
| rejected (step 7 and older) | 20 | 2.30 | 2 |

- **Studio against rejected:**
  - a studio frame outscores a rejected one 90 % of the time;
  - Mann-Whitney p = 8e-6.
- **The new work closes about a third of the gap** ((2.75 - 2.30) / (3.77 - 2.30) = 0.31).
- **No Loom frame reached 4.** The best was the noir UI lab frame, rated 4 then 3 on its repeat.

## The split that matters: what the frame is OF
Loom frames, split by what they show. The split was labelled by me after the ratings, so it is a hypothesis to test
in E2, not a proof.
| what | n | mean |
|---|---|---|
| figurative: people, rooms, a building, a reef (code-drawn) | 14 | 1.93 |
| non-figurative: UI, documents, data, type, diagrams | 22 | 2.86 |

- **The split:** Mann-Whitney p = 3e-5.
- **The three 1s are all code-drawn offices with a person.** One of them is the D-100 office (`new_lab_office_people`),
  built AFTER the frame audit. The engine fixes did not lift figurative drawing at all.
- **Non-figurative Loom work sits at 3:** "passable, nothing wrong, nothing good". It is the floor of a usable
  path, not a ceiling anyone would sell.

## What his 4s and 5s have in common (studio frames)
- **5s:**
  - TED-Ed greek town, platform, castle with a label, chip diagram;
  - the Kurzgesagt core comparison (5, then 4).
  - What they share: light, texture, depth, a composed setting. Where there are people, they are small in a wide,
    lit place.
- **A diagram can reach 5:** the TED-Ed chip diagram, a lit, glowing technical illustration. So the editorial and
  diagram route is not capped at 3; the missing part is finish.
- **Studio close-ups of cartoon people mostly got 3:**
  - TED-Ed scientist, TED-Ed puzzle table, Kurzgesagt office, Kurzgesagt desk;
  - Crayon Capital's meeting got 2.
  - So even professionals get only "passable" from him with a big cartoon face. For corporate work, people work
    best small and in a place, or not drawn.

## What drove the scores (tags, all frames)
| tag | count |
|---|---|
| layout | 17 |
| drawing | 14 |
| finish | 14 |
| people | 14 |
| colour | 11 |
| slides | 8 |
| type | 5 |
| density | 3 |

- "slides" was ticked only on Loom frames.

## His own consistency
- **Repeats:** 6 frames were shown twice. 1 of 6 got the same score both times, and 6 of 6 were within one point.
- **Most drifts were upward on Loom forms** (2 then 3, three times), seen later in the set.
- **What this means for the judge:**
  - a one-point difference on a single frame is noise;
  - the judge is held to RANK agreement (Spearman >= 0.7), never to exact scores.

## What this changes in D-102
1. **The diagnosis holds and is now measured.** Code-drawn figurative content is the bottom of the scale, even
   after D-100. The freeze on new figurative code-drawing stays.
2. **There are two levers, and E2 must test both:**
   - (a) a designed source for people and places, to lift 1-2 to 4;
   - (b) finish (light, depth, texture, composed setting) on the non-figurative path, to lift 3 to 4 or more.
3. **Shot grammar for people:** wide and in a place, or absent. Big cartoon faces are out for corporate work, even
   designed ones, unless E2 shows otherwise.

## E3, first try: the vision judge against these ratings (2026-10-04)

**Setup.** Qwen3.8-27B-FP8 on the pod rated all 60 frames twice (`vl.py maturity`, skill `45_maturity_rater` after the
study rules). Scores: `docs/research/vision/inbox/maturity_scores_fp8.json`.

**Result:**
- **Overall:** rho = 0.054. That is no agreement, so the judge may not gate.
- **The model is consistent with itself:** the same score on the repeat for 73 % of frames, within 1 point for 97 %.
  It is consistent and wrong.
- **It inverts the classes:**

  | class | model | Kshitij |
  |---|---|---|
  | rejected | 3.80 | 2.30 |
  | new | 3.72 | 2.75 |
  | reference | 3.05 | 3.77 |
  | external AI | 4.12 | 3.00 |

- **Most disagreement:**
  - it gave 3.5 to 4 to the code-drawn offices he rated 1;
  - it gave 1 to TED-Ed's virus cartoon and Kurzgesagt's history timeline, which he rated 4.
- **Within Loom frames alone:** rho = 0.46. Within studio frames alone: 0.27.

**Reading (a hypothesis, to test):**
- The model rated genre, not craft: clean flat corporate frames counted as "mature", cartoons as "childish".
- My prompt pushed it there:
  - the study rules tell it the audience is "adult professionals... no childish gags";
  - the rubric said "a busy cartoon can be a 2".

**Next (D-106), two variants run on the same 60 frames:**
1. **`--variant styled`** (rewritten after Kshitij's direction, D-107): name the style first, then judge execution
   on one bar for every style (`46_maturity_styled`, `RATING_INTENT.md`), without the study rules.
2. **`--variant pairs`:** pairwise comparisons, each pair in both orders. Bradley-Terry turns them into one strength
   per frame. Position bias and order consistency are measured.

Neither variant sees his ratings. If both stay below 0.7, the next option is few-shot anchors from half of his
ratings, scored on the other half only.

## E3, second try: style-aware rubric (2026-10-04)

**Setup.** `vl.py maturity --variant styled` (skill `46_maturity_styled`, D-107, no study rules), on all 60 frames,
twice each. Scores: `docs/research/vision/inbox/maturity_scores_styled.json`.

**Result:**
- **rho = 0.344** (v1: 0.054). Better, still below the 0.7 gate.
- **Self-agreement:** 57 % the same score, 95 % within 1 point.
- **Grammar runaways:** 4, all recovered by the L-199 fallback.
- **By class:** the studio and rejected frames are now close together. Before, they were inverted.

  | class | model | Kshitij |
  |---|---|---|
  | rejected | 3.08 | 2.30 |
  | new | 3.38 | 2.75 |
  | reference | 3.12 | 3.77 |
  | external AI | 3.88 | 3.00 |

- **By the style the model named:**

  | style | n | rho |
  |---|---|---|
  | editorial / UI | 13 | 0.68 |
  | infographic / diagram | 9 | 0.27 |
  | cartoon / character | 14 | 0.21 |
  | corporate flat | 15 | -0.03 |

  It cannot yet tell a weak corporate-flat frame from a good one: it gave 2.5 to 3.5 to the code-drawn offices he
  rated 1.
- **Largest misses:**
  - too low on TED-Ed's greek town (5 against 2) and the Kurzgesagt core comparison (4.5 against 2);
  - too high on the code-drawn offices and on the external AI's candle room (2 against 4).

**Reading:** naming the style removed the genre inversion. The judge still does not see the gap between
"designed" and "assembled" inside a style. Next: the pairwise run (in progress). If pairs also stay below 0.7, try
few-shot anchors (half his ratings shown, the other half scored).

## E3, third try: pairwise, style-aware (2026-10-04)

**Setup.** `--variant pairs`: 346 pairs, each in both orders, 692 comparisons, Bradley-Terry.
Scores: `docs/research/vision/inbox/maturity_scores_pairs.json`.

**Result:**
- **rho = 0.276.** That is below the styled rubric (0.344).
- **Bias and consistency are healthy:** Frame A won 51.7 % of decided comparisons (no position bias); 80 % of pairs got
  the same verdict in both orders.
- **Combining the styled and pairs ranks:** rho 0.344, no gain.
- **By style:** editorial / UI 0.70; corporate flat 0.12; cartoon 0.10; diagram -0.08.

**What it prizes:**
- **Frames with large, legible text and UI rise to the top:** the phishing b19 close-up, the noir UI lab frame, the
  Cleo article, the Lucas qubit card.
- **Dense illustrated studio frames sink:** greek town, the Kurzgesagt core comparison, the chip diagram, the Cleo
  three cards.
- **Reading:** at 640 x 310, the model reads "clean" as "clearly legible" and cannot see craft in dense
  illustration.

**Across all three tries:**
- the judge agrees with Kshitij on editorial / UI frames (0.68 to 0.70);
- it does not agree on figurative, illustrated or corporate-flat frames;
- prompt wording alone has plateaued near 0.3.

**Next (D-108):** few-shot anchors.
- Six of his rated frames go in front of every call (`anchors` in `golden_set.json`): one per level, across styles,
  and deliberately not the worst misses.
- The judge is scored only on the 54 held-out frames.
- If that also stays below 0.7, the vision judge does not gate taste. Taste stays with Kshitij's look, and the model
  is used for what it measurably does: describing, measuring, and planted-defect detection (still to be
  calibrated).

## E3, fourth try: few-shot anchors, held out (2026-10-04)

**Setup.** `--variant anchored`:
- the six anchors with his scores go in front of every call;
- it is scored on the 54 frames it never saw rated.

Scores: `docs/research/vision/inbox/maturity_scores_anchored.json`.

**Result:**
- **rho = 0.296 on the 54 held-out frames.** The 95 % bootstrap interval is 0.02 to 0.54.
- **On the same 54 frames:** v1 0.052, styled 0.259, pairs 0.233. Anchors add a little, nowhere near 0.7.
- **Self-agreement:** 61 % the same score, 100 % within 1 point.
- **By style:**

  | style | n | rho |
  |---|---|---|
  | editorial / UI | 14 | 0.57 |
  | corporate flat | 15 | 0.35 (was -0.03 in styled) |
  | cartoon | 9 | 0.33 |
  | diagram | 10 | -0.71 |

- **The same studio frames are missed in every version:**
  - greek town (5, model 2.5);
  - chip diagram (5, model 2.5);
  - Cleo three cards (4, model 2);
  - Kurzgesagt core comparison (4.5, model 2.5).

## Conclusion of E3 (D-109)

Four versions of the judge, none near the 0.7 gate:

| version | rho |
|---|---|
| v1 | 0.05 |
| styled | 0.34 |
| pairs | 0.28 |
| anchored, held out | 0.30 |

- **Taste:** Qwen3.8-27B-FP8, at this frame size, does not share Kshitij's judgement of quality outside editorial and
  UI frames. It does not gate taste. His look is the taste gate (D-102 part 5).
- **What the model is used for:**
  - describing films (the TED-Ed study);
  - measuring;
  - defect detection, once the planted-defect calibration has passed.
- **Not tried (possible later):**
  - the 122B model as judge (needs volume space);
  - higher-resolution frames (limited by the 360p reference videos);
  - fine-tuning on more ratings.
