# The persona file

A persona is the voice that writes and speaks a video: how it opens, how it handles a hard idea,
whether it asks, what it refuses, how it sounds when spoken. It is a FILE, written once, reviewed by a
human, and then handed verbatim to everyone who writes for the video. The same persona and the same
source should give the same kind of script every time.

**Why it exists.** Without one, measured on real AI-written training scripts: 2.6 sentences per beat,
16-17 words per sentence with almost no variance, 4-6 questions in 40-60 beats, one flat delivery for
nearly every beat, and one recurring opener ("Quick check"). A one-paragraph "tone" note was the only
voice direction, and nothing graded for voice. The result sounded like a spec read aloud.

Every key below is required unless marked optional. Numbers are TARGETS a reviewer compares the finished
script against, not hard gates.

| key | what it is |
|---|---|
| `id`, `name`, `blurb` | slug, display name, one line |
| `for` | the audience this persona serves, in plain words |
| `character` | 3-6 sentences: who this teacher is, what they care about, how they treat the learner |
| `voice_rules[]` | 6-12 imperative writing rules ("open a section with the consequence, not the definition") |
| `rhythm` | `sentences_per_beat [lo,hi]`, `words_per_sentence {mean, sd_min}`, `question_rate_min` (share of beats that ask), `you_rate_min` (share of beats addressing the learner), `opener_repeat_max` (the same two-word opener, max times per video) |
| `signature_moves[]` | 3-6 named moves, each `{name, when, shape}` (e.g. "the heads-up: one sentence before the slippery point") |
| `refuses[]` | 3-8 things this voice never does (hedging, filler, "in this section we will") |
| `openers[]`, `closers[]` | 4-8 each: how a section starts / lands - patterns, not fixed strings |
| `examples[]` | 5-8 sentences in the voice, ideally each showing a move |
| `anti_examples[]` | 5-8 `{text, why}`: sentences that sound close but are wrong for this voice |
| `pace_bias` | delivery (`calm | energetic | neutral | urgent | warm`) per kind of beat, with a `default` |
| `voice_casting` | `instructions` (the spoken delivery, 2-4 sentences a voice actor could follow); optional `example_tts_voice` |
| `visual_bias` (optional) | the kinds of visuals this teacher reaches for, in plain words |
| `provenance` | `authored_by` (`human` / the tool or model that drafted it), `date`, optional `from_brief`, `inferred[]` |

**Hard limits:** the persona never adds FACTS (facts belong to the source); it never names a specific
template or visual asset; its `refuses` may not contradict the genre's content policy (a no-quiz genre
wins over a persona that loves quizzes).

**How to measure a script against it.** Count, per beat: sentences, words per sentence (mean and
standard deviation), whether the beat asks a question, whether it addresses the learner as "you", and the
first two words of each beat. Compare with `rhythm`. A script that misses the targets widely is a script
in some other voice.
