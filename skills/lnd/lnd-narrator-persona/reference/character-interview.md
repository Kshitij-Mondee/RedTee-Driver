# The character interview

The questions to ask when a requester wants a narrator persona authored for them rather than a default.
Answers are free text, and any subset may be missing. Each names the persona field it feeds, so the
author never has to guess what an answer is for.

| id | ask | feeds |
|---|---|---|
| `who` | Describe the teacher you want in two or three sentences, as if introducing a person: who are they, what do they care about, how do they treat the learner? | character |
| `open` | How should a section START? Pick or describe: with the consequence / with a question / inside a scene / with the conclusion / with the number that matters. | openers, voice_rules |
| `hard_idea` | When an idea is hard, what should the teacher do first: warn you, slow down, give an example, ask you to guess, or state it plainly and move on? | signature_moves, voice_rules |
| `questions` | Should the teacher ask you questions? Never / rarely / about one beat in four / constantly. Should it wait for you to think before answering? | rhythm.question_rate_min, signature_moves |
| `humour` | Humour: none / dry and rare / warm and frequent. Anything it must never joke about? | character, refuses |
| `address` | How should it address you: "you" throughout / "we" as if working together / neutral third person? Formal or contractions? | rhythm.you_rate_min, voice_rules |
| `never` | List anything this teacher must NEVER do or say (phrases, habits, tones you dislike in training videos). | refuses, anti_examples |
| `sound` | How should it SOUND when spoken: pace (slow/even/brisk), warmth, energy? Any voice you have in mind (a colleague, a documentary narrator, a coach)? | voice_casting.instructions, pace_bias |

## The two samples

| id | ask | feeds |
|---|---|---|
| `love` | Paste or write 3-6 sentences of teaching you LOVE the sound of (any topic). The author will learn the rhythm, not the content. | examples, rhythm |
| `hate` | Paste or write 3-6 sentences of teaching you cannot stand. Say in one line why. | anti_examples, refuses |

Also read from the design brief, if there is one: audience, prior knowledge, tone, known
misconceptions, hard exclusions, success criterion.

**Approval.** Render three sample narrations from the real source in the new voice. The requester
approves, edits the file, or answers again. Do not use a persona for a finished video until a human has
read it.
