# Lesson craft rubric (D-116, 2026-10-06)

STATUS: DRAFT from one night's practice. Kshitij asked that the way the showcase lessons were approached be turned
into a rubric. It is distilled from the three showcase RUN_LOGs (`projects/groupthink-trap`, `quick-question-cost`,
`mfa-explained`), the gates, and what the contact sheets showed. It is a reference for judging a plan or a build,
not a checklist that replaces looking at frames (D-64). It is also the seed of the module evals in the agent
architecture (D-115, section 12 step 10).

**Scoring:** each line is 0 (missing or wrong), 1 (present but weak), 2 (clearly right). A stage passes at 2 on every
starred line and at least 1 elsewhere. Every score names its evidence (a field, a beat id, a frame time).

## 1. Brief: what the lesson is
| # | criterion | evidence | 2 looks like |
|---|---|---|---|
| 1.1* | The through-line is a MECHANISM, not a topic | `through_line` | "every doubter thinks they are the only one, so silence looks like agreement" (not "groupthink is bad") |
| 1.2 | The arc is built to be re-run or replayed | `arc` | the failing meeting and the fixed meeting are the same room (groupthink); the same login run four times (mfa) |
| 1.3* | must-cover items are fact-free or anchored | `must_cover` | every item `from_knowledge: true` or with an anchor |
| 1.4 | The look is translated into kinds of picture, not engine names | `visual_direction` | "a held page whose contents swap", never a template id |

## 2. Knowledge: what is true
| # | criterion | evidence | 2 looks like |
|---|---|---|---|
| 2.1* | Every number has a named owner and its limit in the same sentence | facts with digits | "Microsoft researchers, their own accounts: 99.22 percent, not a guarantee" |
| 2.2* | Popular but unsourced claims are listed under `not_claimed` | `not_claimed` | the "23 minutes to refocus", the "99.9 percent" headline |
| 2.3 | Each remedy carries its own honest limit | facts | the devil's advocate role works less than real dissent |
| 2.4* | Sources were read this session, or the sheet says they were not | provenance, RUN_LOG | mfa fetched every source; the other two say "from memory, spot-check" |

## 3. Pedagogy: how it teaches
| # | criterion | evidence | 2 looks like |
|---|---|---|---|
| 3.1* | One dominant strategy that fits the skill | `strategy` | scenario_led for a judgement skill; contrast_led for a mechanism |
| 3.2 | The one stopping check makes the obvious answer wrong or costly | the quiz or predict beat | "MFA is on, you typed the code into a look-alike: does the thief get in?" |
| 3.3 | Misconceptions are refuted by what is SHOWN, not only said | misconceptions vs beats | "silence means yes" refuted by the bubbles the viewer can see |
| 3.4 | Energy build, peak, rest; Bloom climbs without jumps | plan | understand, apply, apply |

## 4. Script: what is said
| # | criterion | evidence | 2 looks like |
|---|---|---|---|
| 4.1* | Length is cut to the plan before the gate forces it | words, estimated seconds | all three were cut by about a third (448 to 375, 567 to 366, about 277 s to about 171 s) |
| 4.2* | The term is named after it has been shown | the naming beat | groupthink named at b10, after the failure at b08 |
| 4.3 | One running motif carries the lesson | beats that reuse it | four doubts as objects; one bench; one ledger |
| 4.4* | Hypothetical sizes are framed in the words ("say") and never read as measured | narration, on-screen | "Say five questions", footnote "unit sizes are illustrative" |
| 4.5 | A colleague's voice, not a teacher's | persona rules | no "today we will learn" |

## 5. Storyboard: what is shown
| # | criterion | evidence | 2 looks like |
|---|---|---|---|
| 5.1* | One held picture changes state instead of stations rebuilt per beat | devices, `continue` joins | 13 of 18 joins `continue` (quick-question); one bench for 22 beats (mfa) |
| 5.2* | A device set of 3 to 5 plus ONE join material, each named and used | `devices` | torn paper only for time jumps (groupthink); fill joins as bookends (quick-question) |
| 5.3* | A value script with deliberate breaks for meaning | `value_script` | dark break at the failure; light lift at the payoff |
| 5.4* | One accent with a fixed meaning, placed on what the narration names | `accent_on`, palette roles | red means hidden cost, nothing else |
| 5.5 | Numbers live on things | the data beats | a meter on the door, a counter riding a pile, stamped units |
| 5.6 | Templates sit over the held picture, not instead of it | `keep`, backplate | mfa cards over the dimmed bench |
| 5.7* | Element-name contracts are written for the scene authors | designs, continuity notes | "HELD ELEMENT CONTRACT: door.swing(t, open), tally.verdict(i, word, tone, t)" |
| 5.8 | The animatic was looked at and the plan changed because of it | RUN_LOG | five wide shots in a row broken by an insert and an establishing shot |
| 5.9 | The look family's rules are respected | pack `look_family` | stepped time and torn paper only in the illustrated lesson; no overshoot in technical |

## 6. Scenes: the build
| # | criterion | evidence | 2 looks like |
|---|---|---|---|
| 6.1* | Three treatments considered, the chosen one justified in the file header | scene header | "(A) a card, rejected because...; (C) CHOSEN: the same bench, one change" |
| 6.2* | Held elements are used by name and their methods, never redrawn | `ctx.held` | b06 reuses b01's `door.swing` and b04's `tally.verdict` |
| 6.3* | Every reveal is on a spoken word; nothing arrives after about 85 percent of the speech | cues | `ctx.cue("The replay stops")` drives the stamp |
| 6.4* | Text fits at the floors with insets; nothing leaves its element | check errors | 0 `text_overflow`, 0 `tight_inset`, 0 `text_outside_element` |
| 6.5* | Anything a beat opens, it closes (lenses, overlays) unless the next beat holds it | frames of the NEXT beats | mfa b07's lens was left open through b20 until the sheets showed it |
| 6.6 | The frames were looked at, and the scene changed after looking | RUN_LOG | the two chips that did not fit side by side were stacked |
| 6.7 | Determinism and tokens only | the scenes gate | accepted |

## 7. Check and review: proof
| # | criterion | evidence | 2 looks like |
|---|---|---|---|
| 7.1* | The overview sheet was read beat by beat before calling anything done | `qa/sheets/_overview.jpg` | findings listed per beat |
| 7.2* | Every remaining error is either fixed or named as deliberate with its reason | `qa/report.json`, RUN_LOG | "content_overlap at 156 to 158 s: the stacked prompts, deliberate" |
| 7.3 | A forced render records why it was forced | ledger `override` | `--force` with the reason |

## Lessons the night taught (for the next run)
- Plans are cheap to fix and builds are not: the three storyboards were accepted in two rounds each; the first mfa
  build had 14 runtime errors and a lens that never closed.
- Writing the held-element contract into the storyboard is what let several scene authors work at once.
- The gate counts and the picture disagree in both directions: content-overlap errors on deliberate stacks, and no
  error at all for a lens left open for two minutes. The picture wins (Rule 0).

## 8. Does it explain? (added after the mfa-explained render, L-227)
Ask these before accepting a storyboard; each was a "no" on mfa-explained.
- **Register by audience, not topic.** Who watches, and how should they feel? A security topic for all staff is not a
  security-team look.
- **Can the idea be read in one look?** If the viewer must learn a diagram's grammar first, use the real thing (the
  real screen, the real phone) at a size that fills the frame.
- **Is there someone to root for and someone to fear?** An invented, hypothetical person is allowed; "no invented
  facts" never meant "no people".
- **Does each repeat change the picture?** Runs, rounds or examples that look the same read as repetition.
- **Does the hardest idea get the biggest picture?** The payoff beat deserves the most frame, not a lens on clipped text.
- **Does every card earn its place?** Count the beats that dim the world to show a card. More than a third reads as a deck.
- **Was the film watched?** Stills do not show rhythm, repetition or stray marks. If the film cannot be watched here,
  say so as an unverified risk.

