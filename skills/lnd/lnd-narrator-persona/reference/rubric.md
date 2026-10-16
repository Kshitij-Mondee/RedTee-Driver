# Narrator persona - rubric (hard rules, obey exactly)

A persona file that fails any numbered rule should be rejected before a human reviews it. Rules 1-6 are
mechanical and checkable; 7-10 are read by the human reviewer and used to judge the finished script.

1. **COMPLETE.** Every key in `persona-format.md` is present with its stated type: `id` (slug), `name`,
   `blurb`, `for`, `character` (3-6 sentences), `voice_rules` (6-12 strings), `rhythm` (all five numbers),
   `signature_moves` (3-6 objects with `name`, `when`, `shape`), `refuses` (3-8), `openers` (4-8),
   `closers` (3-8), `examples` (5-8), `anti_examples` (5-8 objects with `text`, `why`), `pace_bias` (with
   `default`), `voice_casting` (`instructions` 2-4 sentences), `provenance`.
2. **NO FACT-MAKING.** No `voice_rule`, `signature_move.shape`, `example` or `opener` may direct the
   teacher to add a statistic, source, date, study or claim that is not in the source. Words that fail
   this on sight: "cite", "studies show", "research finds", "percent of" outside an invented-scene frame.
   Scenes, war stories and analogies are allowed only when a rule frames them as invented ("say",
   "imagine", "framed as illustration").
3. **NO TEMPLATE OR TOOL NAMES.** No specific template, visual asset or tool name anywhere. `visual_bias`
   is plain words.
4. **HUMAN RANGES.** `sentences_per_beat` lo >= 1, hi <= 8, lo < hi; `words_per_sentence.mean` in [8, 24],
   `sd_min` in [3, 10]; `question_rate_min` and `you_rate_min` in [0, 1]; `opener_repeat_max` in [1, 5].
5. **POLICY PEACE.** `refuses` and the moves may not contradict the video's content policy: a persona for a
   no-quiz genre may not have a move that quizzes; a persona that refuses analogies may not be paired with
   a genre that relies on them without saying so in `provenance.inferred`.
6. **NOTHING VERBATIM.** No `example` or `anti_example.text` equals a sentence from the requester's samples.
7. **A WRITER CAN OBEY IT.** Each `voice_rule` is testable by reading one sentence or one beat. "Be
   engaging" fails; "never three sentences of the same length in a row" passes. Each `signature_move` has
   a `when` a writer can recognise from the video's structure.
8. **THE NEAR-MISS TEACHES.** `anti_examples` are close to the voice and wrong for a stated reason; a
   cartoonishly bad sentence teaches nothing. At least three `why`s must name a specific rule broken.
9. **CHARACTER BEFORE ADJECTIVES.** `character` describes a specific person and what they care about; a
   list of adjectives ("warm, clear, engaging") fails.
10. **INFERENCE IS LABELLED.** Every field filled without direct evidence from the brief, the interview or
    the samples is named in `provenance.inferred[]`.
