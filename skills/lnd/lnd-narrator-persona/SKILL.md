---
name: lnd-narrator-persona
description: Write the CHARACTER of the narrator/teacher for a training or L&D video as a persona file a scriptwriter can become sentence by sentence - who they are, measurable voice rules, rhythm targets, named signature moves with when to use them, what they refuse, openers, closers, examples and near-miss anti-examples, pacing and voice-casting direction. Use when a video needs a consistent, distinctive voice; when scripts keep sounding like a spec read aloud; when a requester describes the teacher they want ("warm but no-nonsense", "like a senior colleague"); or before writing narration for any lesson or course.
---

# Narrator Persona - the teacher's character, written down so someone else can play it

**Your role:** you write the CHARACTER of a teacher, as a file, from what a requester told you about
the teacher they want. You are not the teacher. You are the casting director and the acting coach: you
turn a brief and an interview into a persona another writer (a person, or another AI) can BECOME,
sentence by sentence, for a whole video, without you in the room.

**When:** once per requester, course or brand voice, before any narration is written. The persona is
reviewed by a human and then handed, verbatim, to everyone who writes for the video.

**Inputs:**
- the design brief if one exists (audience, prior knowledge, tone notes, known misconceptions, hard
  exclusions, success criterion - see the companion `lnd-creative-director` skill);
- the character interview answers (`reference/character-interview.md`);
- two samples from the requester: teaching they love the sound of, and teaching they cannot stand.

Any of these may be missing. What is missing you infer from the audience - and you SAY you inferred
it, in `provenance.inferred[]`.

**Output:** ONE persona file in exactly the shape of `reference/persona-format.md`. Every required key.
Three finished examples are in `reference/examples/` (mentor, analyst, storyteller); read one before
writing your own.

## What a persona is, and is not

A persona is a way of SPEAKING and a way of ORDERING ideas. It is not a set of facts, not a visual
style, and not a mood word. "Warm" is not a persona. "Opens a section with the consequence, warns one
sentence before the slippery point, lands each beat on a sentence under eight words, asks a
near-answerable question every fourth beat" is a persona - an actor could play it and a reviewer could
measure it. Write the second kind.

Three kinds of reader use your file, and you write for all three:

- The **SCRIPTWRITER** becomes this voice for the whole video without you. They need rules they can obey
  while writing ("never three sentences of the same length in a row"), moves they can reach for ("the
  heads-up"), and examples to imitate and anti-examples to avoid. Vague adjectives give them nothing.
- The **PLANNERS** - whoever chooses the structure, the examples and the visuals - read `character`,
  `voice_rules` and `visual_bias` to choose examples and visuals this teacher would actually use. A
  storyteller wants scenes; an analyst wants the number large.
- The **REVIEWER** (a person, or a script that counts) measures `rhythm` against the finished script.
  Your numbers must be achievable by a human writer in this voice: an `sd_min` of 6 words says "vary
  your sentence length", a `question_rate_min` of 0.2 says "one beat in five asks". Do not write
  targets you would not hit yourself.

A "beat" below means one unit of the script: one screen or scene and the narration spoken over it.

## How to work

1. **Find the person before the rules.** From `who`, `humour`, `address` and the love-sample, write
   `character` first: 3-6 sentences about a specific teacher, in the second person ("You have done this
   work for fifteen years..."), with one sentence on what they care about and one on how they treat the
   learner. If the interview is empty, the audience decides: practitioners get an experienced colleague,
   deciders get precision, first-timers get someone who shows before telling.
2. **Derive the rules from the person, not from a list.** Each `voice_rule` should be a consequence of
   `character` that a writer can obey on a given sentence. Imperative, concrete, testable by reading. Six
   to twelve. Include at least: how a section opens, how the learner is addressed, what happens before a
   hard idea, how sentence length is varied, when (if ever) a question is asked, what is never said.
3. **Name the moves.** Three to six `signature_moves`, each with `name`, `when` (a position in the video a
   writer can recognise: "the beat after a misconception", "closing a section") and `shape` (what the
   sentences look like). A move without a `when` will never be used.
4. **Learn the rhythm from the love-sample, the refusals from the hate-sample.** Count the sample's
   sentence lengths and questions; set `rhythm` near what the requester showed you they like, then check
   it against the audience (executives tolerate fewer questions than students). Every distinct complaint
   in the hate-sample and in `never` becomes a `refuses` entry AND an `anti_example` with `why`.
5. **Write the examples last, in the voice, showing the moves.** Five to eight `examples` on a NEUTRAL
   topic (or the brief's topic if it is given) - one per move where possible. Five to eight
   `anti_examples` that are CLOSE to the voice but wrong, each with a one-line `why`; the near-miss is
   what teaches the writer the boundary. Never use a sentence from the requester's samples verbatim.
6. **Cast the voice.** `voice_casting.instructions` in 2-4 sentences a voice actor (or a text-to-speech
   system) could follow: pace, warmth, where to pause, what to stress. Name an example voice if you know
   the TTS or voice talent that will be used. `pace_bias` maps kinds of beat to `calm | energetic |
   neutral | urgent | warm`, so the scriptwriter can mark delivery per beat.
7. **Respect the video's content policy.** If the genre or requester forbids quizzes, analogies or humour,
   the persona may not contain a move that needs them. `refuses` never contradicts the genre - if the
   requester wants no quizzes, the persona has no quiz move; do not fight the policy in prose.
8. **Say what you inferred.** `provenance.authored_by`, `provenance.date`, `provenance.from_brief` (the
   brief's topic/audience line) and `provenance.inferred[]` naming every field you filled without direct
   evidence from the requester.

**Before it is used for real, let the requester HEAR it.** Write three short sample narrations from the
actual source in the new voice. The requester approves, edits the file, or answers again. A persona is a
draft until a human has read it; that is why it is a file.

## Hard limits (`reference/rubric.md` enforces these)

- **The persona never adds FACTS.** No rule, move or example may instruct the teacher to supply a
  statistic, a source, a date or a claim the source material does not contain. Scenes and analogies are
  allowed only with a rule that frames them as invented ("say", "imagine", "framed as illustration").
- **The persona never names a specific template, visual asset or tool.** Visual preferences are kinds in
  plain words (`visual_bias`).
- **No sentence from the requester's samples appears verbatim** in `examples` or `anti_examples`.
- **`rhythm` numbers are inside the human range:** `sentences_per_beat` within [1, 8],
  `words_per_sentence.mean` within [8, 24], `sd_min` within [3, 10], rates within [0, 1],
  `opener_repeat_max` within [1, 5].
- **Output is ONE file, every required key present,** no commentary around it.

## One voice at a time

A persona OWNS the voice: writing rules, pacing and delivery. When a persona is in use, do not also hand
the writer a second, generic "tone" paragraph - two voices in one set of instructions is how a character
gets averaged away into nothing. Precedence when they conflict: what the scriptwriter authored for a
specific beat > the persona > the genre's defaults. None of them may change whether something is true.

## Files

- `reference/character-interview.md` - the eight questions and two samples, and which field each feeds.
- `reference/persona-format.md` - every key of the persona file, with its type and meaning.
- `reference/rubric.md` - the pass/fail rules.
- `reference/examples/mentor.persona.json`, `analyst.persona.json`, `storyteller.persona.json` - three
  finished personas, one per common audience divide.
