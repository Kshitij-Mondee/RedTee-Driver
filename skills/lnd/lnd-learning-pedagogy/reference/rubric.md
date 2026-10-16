# Teaching plan - rubric (hard rules, size guide, verbs, flags, traps)

## Hard rules (violating any makes the plan invalid)

1. **ONE STRATEGY.** Exactly one `strategy.name` from the closed set. A "blend", or a second strategy
   smuggled into the rationale, is invalid. The video keeps one dominant move; variety comes from the arc.
2. **NO CONTENT INVENTION.** Goals, hooks, misconceptions, prompts, scenarios and payoffs may only reference
   material the source contains, or scenes explicitly framed as invented ("say", "imagine"). A hook that needs
   a fact the source does not assert is invalid - flag `HOOK-NEEDS-FACT` and pick another kind.
3. **PERFORMANCE FIRST.** `performance` names what the learner will DO differently. If the plan is
   awareness-only, `performance` says so and why.
4. **OBSERVABLE GOALS.** Every section goal starts "the viewer can ...". "Understands / appreciates / knows
   about / is aware of" are forbidden.
5. **HOOK DISCIPLINE.** The hook defines nothing, uses <= 2 sentences (<= 45 words), is answerable by the
   payoff, and its essence survives compression to about 8 on-screen words. A hook that restates the title is
   invalid.
6. **GENRE HONESTY.** If a third or more of the substance is numeric or formulaic, the genre is `quantitative`
   or `mixed`.
7. **RETRIEVAL IS PRESENT, TIED AND BUILDABLE.** At least one recall moment in any video; each is tied to a
   section that already taught what it asks, and never tests later material. `quiz` needs a statable answer and
   an explanation of why the most tempting wrong option is wrong; `pause_predict` needs a genuine predictable
   fork; `recall_prompt` is spoken reinforcement only. A quiz whose honest answer is "it depends" is invalid.
8. **THE STOPPING-CHECK BUDGET HOLDS.** `quiz` + `pause_predict` together stay within about one per five
   minutes (table below). `recall_prompt`s are not capped - use them for spacing and reinforcement.
9. **FRAMEWORKS AUDITED, NOT DECORATED.** `framework_audit` POINTS at fields ("practice -> recall after sec1"),
   never restates theory. Gagne events 1, 3, 4, 5, 6, 9 map; Merrill's five principles all appear (at most ONE
   marked absent, with a reason); `bloom_path` matches the sections' declared levels in order; Mayer and ARCS
   each get their lines.
10. **BLOOM VERB DISCIPLINE.** Each goal's verb belongs to its declared level (table below). The peak section
    reaches >= `apply` for student, practitioner and expert audiences; a purely descriptive source may cap at
    `understand` with flag `BLOOM-CAP`. The path never jumps more than one level between adjacent sections.
11. **LOAD BUDGETED.** No section introduces more than about four new terms without an interior rest or a split;
    `slowdown_at` is scarce (caps below) and lands on the genuinely hardest ideas. The energy curve shows real
    valleys: at least one `rest` over 3 minutes, no `peak -> peak`, and the last section is never `peak`.
12. **DEVICES EARN THEIR LOAD.** Every engagement device (story frame, running gag, dramatic reveal, scenario)
    serves a named section goal. A device you cannot tie to a goal is extraneous load; cut it.
13. **MISCONCEPTIONS ARE REFUTED, NOT IGNORED.** Every entry in `misconceptions[]` has a section that states it,
    shows why it is tempting, and breaks it - and each comes from the source, the brief or the requester, never
    from imagination.
14. **TRANSFER IS PLANNED.** At least one `transfer_tasks` entry applies the skill to the learner's own context.
15. **VARIED CARRIERS.** No more than two consecutive sections share the same `carrier`.

## Size guide (a RATE guide, never a ceiling)

Length is EMERGENT from what the source supports and what the pedagogy needs; never cut a key idea or a check
to hit a number. A richer source runs longer and carries proportionally more.

| video length | sections | stopping checks (quiz + pause_predict), max | slowdown_at |
|---|---|---|---|
| <= 3 min | 2-3 | 1 | <= 1 |
| 3-6 min | 3-4 | 1 | <= 2 |
| 6-10 min | 4-5 | 1-2 | <= 3 |
| 10-15 min | 5-6 | 2-3 | <= 4 |
| 15-25 min | 6-8 | 3-5 | <= 5 |
| ~30 min | 7-9 | 6 | <= 6 |

- `signature_move` <= 30 words and contains a verb sequence (do X, then Y). `payoff` <= 35 words.
- `words_per_minute` in [130, 160]. If a target length was given and the source supports a different honest
  length, flag `DURATION-MISMATCH` and plan the honest length.

## Bloom verb table (revised taxonomy)

| level | verbs |
|---|---|
| remember | state, list, name, recall, identify |
| understand | explain, summarise, classify, compare informally, give an example of |
| apply | compute, use, run, solve, carry out, follow the procedure |
| analyze | distinguish, decompose, attribute, contrast formally, diagnose |
| evaluate | judge, justify, critique, choose between and defend |
| create | design, construct, compose, plan |

## Flags

- `HOOK-NEEDS-FACT: <what was missing>`
- `SOURCE-SHAPELESS: <why>` - the source has no teachable order; you imposed one (say which, in one line).
- `DURATION-MISMATCH: source supports <n> s` - honest sizing against a target.
- `BLOOM-CAP: <level> because <reason>` - the source cannot support `apply`.
- `GAGNE-ABSENT: <event> because <reason>` - a non-mandatory event skipped.
- `MERRILL-ABSENT: <principle> because <reason>` - the one allowed absence.
- `LOAD-HEAVY: <section> carries <n> new terms` - you kept a heavy section intact (say why splitting hurts more).
- `AWARENESS-ONLY: <reason>` - the requester wants recall, not a skill.

## Traps

- The kitchen-sink arc: six devices, three strategies, zero identity.
- Coverage mistaken for teaching: every point in the source, in the source's order, at equal weight.
- Recall moments that quiz trivia instead of the section goal.
- A stopping check after every section.
- A quiz whose honest answer is "it depends".
- A persona described with adjectives no narrator could act on ("engaging", "dynamic").
- Sections that partition PAGES of the source instead of IDEAS.
- Framework name-dropping ("we gain attention per Gagne") instead of pointing ("attention -> the suspicious-coin
  hook").
- Bloom inflation: labelling "can state the definition" as `apply`.
- `slowdown_at` used as a highlighter pen.
- Fully worked examples for experts (expertise reversal), or bare problems for novices.
- An analogy with no stated breaking point.
- A payoff that summarises instead of returning to the hook's situation.
