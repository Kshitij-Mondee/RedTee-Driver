# Narration review: why it sounds flat and choppy, and what to change (2026-10-16)

STATUS: REVIEW AND PROPOSAL (2026-10-16). Nothing in the pipeline is changed yet. UPDATE (later the same day): Kshitij says the voice and
narration are taken care of (the speed work is D-196 and D-197); keep this as a reference. The mp3 files are
gitignored, so they live only on this machine. Kshitij: "check the narration and the
generation of it. I feel like the narration is very lacking ... It doesn't feel interesting or smooth at all."

Listen first: `docs/research/2026-10-16-narration/`. These are the first 8 beats of `st-holo-ai`, made with Kokoro
af_heart in the sandbox, in three versions:

| File | What it is |
|---|---|
| `A_today_per_phrase.mp3` | the way Loom does it today: every phrase its own TTS call, with fixed silences between phrases and beats |
| `B_same_words_per_beat.mp3` | the same words, one TTS call per beat |
| `C_rewritten_per_beat.mp3` | the same claims rewritten for the ear (no new facts), one call per beat |

## 1. What is wrong, measured (all numbers from commands run this session)

### The writing is staccato

| Lesson | Sentences | Mean words per sentence | Spread (sd) | Longest |
|---|---|---|---|---|
| st-holo-ai | 64 | 5.7 | 2.2 | 11 |
| st-iso-order | 58 | 6.5 | 3.2 | 16 |
| st-sc-2fa | 40 | 9.3 | 4.3 | 18 |
| st-bp-cooling | 46 | 8.4 | 4.5 | 18 |

- Across 85 saved scripts with at least 8 beats, the mean is 6.5 words per sentence, and 42 % of sentences have 5
  words or fewer.
- The persona these lessons used (`plan/persona.json`) asks for a mean of 11 with an sd of at least 5. No code
  checks it: `grep sentence_words_mean loom` finds nothing. The target is written down and never enforced.
- The same tics recur across the 85 scripts:

  | Tic | Count |
  |---|---|
  | "Say ..." | 105 |
  | "Now ..." | 108 |
  | "Then ..." | 95 |
  | "Here is ..." | 64 |
  | "That is ..." | 45 |

  Fragment lists such as "Order, pick, pack, hub, delivery route." and "Her question, the chat, its own reply." stand
  in for sentences.
- Beats rarely join to each other. Few beats open with "but" or "so"; most start a fresh statement, so the film reads
  as a list of true things.

### Why the writing comes out this way

The script contract conflates a breath with a sentence.

- `prompts/script.md` says: "Each phrase is one breath, ideally <= 9 words, never > 14. The engine synthesises each
  phrase separately".
- The script gate warns over 10 words and fails over 14 (`gates.py`).
- Writers obey by making every phrase a full sentence of under 9 words, so a 10-second beat becomes three sentences
  of 5 words each.

### The generation resets every 2.3 seconds

`loom/narrate/__init__.py` makes one Kokoro call per phrase. It then trims each phrase and joins them with fixed
silences:
- 0.20 s after a comma;
- 0.34 s after a full stop;
- 0.55 to 1.25 s before each beat.

Each call is a separate utterance. The voice starts fresh and lands with a full-stop fall at the end of every phrase,
so the pitch and energy cannot carry across a sentence.

| Lesson | Phrases | Median phrase length | Speech share |
|---|---|---|---|
| st-holo-ai | 61 | 2.37 s | 82 % |
| st-iso-order | 68 | 2.13 s | 83 % |
| st-sc-2fa | 62 | 2.61 s | 84 % |
| st-bp-cooling | 67 | 2.31 s | 83 % |

So in these lessons the voice stops roughly every 2.3 seconds and starts over. In the A/B the gaps are similar in
number, but A's runs between pauses are shorter (1.38 s against 1.67 s for B and C). The difference that matters is
heard rather than counted (the pitch resets), so listen to the files.

### Delivery is never used

- The script writes `delivery` per beat (warm, curious, brisk, calm, urgent), and the persona has voice-casting notes.
- Kokoro (the default) receives only the text, a voice id and a speed.
- Only the `openai` provider passes `instructions`, and nothing fills them from the persona or the beat.
- The ElevenLabs path does not send `previous_text` or `next_text`, which that API uses to keep prosody continuous
  across chunks (found by the research agent; I confirmed by grep that neither appears in `loom/narrate`).

## 2. What to borrow (researched today; sources at the end)

**Writing**
- **Lines as reveal cues, with delivery kept separate** (HyperFrames faceless-explainer, Apache-2.0):
  - every line carries its own delivery note;
  - the voice says rounded numbers while the screen shows the exact figure;
  - silence is allowed.
- **"But" or "therefore" between beats, never "and then".** This is already in `packs/genres/explainer.md`, and no
  check enforces it.
- **An "AI tell" pass** (blader/humanizer, MIT): it targets "not X but Y", staged run-ups ("Here's the thing"),
  forced threes, one-line closers and fragment rows. Every kept sentence must add something, and sentence length must
  vary. It adds no facts, which fits grounding.
- **Swap test and read-aloud check** (coreyhaines31 copywriting skill, MIT):
  - if a line would work unchanged in another film, rewrite it;
  - read every sentence over 20 words aloud;
  - mark missing proof `[NEED: ...]`, never invent it.
- **Open on the misconception, then turn it** (Derek Muller's research, via secondary coverage, unverified).
  `lnd-learning-pedagogy` already plans misconceptions; the script should voice them.

**Generation**
- **Synthesise a sentence, a beat or a whole section in one call, then find the words by alignment.** Do not stitch
  phrases.
  - Loom already runs faster-whisper locally for the speech check (`loom/narrate/asr.py`). Its word timestamps can
    place the reveal anchors on audio made in longer pieces.
  - One published skill sends all segments in a single call with long pause markers and splits them again at the
    silences (memex-lab product-launch-video-skill, MIT).
- **Request stitching** for ElevenLabs (`previous_text`, `next_text`), from elevenlabs/skills (MIT).
- **Delivery mapped per provider:**
  - OpenAI: a labelled 4 to 8 line spec (affect, tone, pacing, emotion, pauses, emphasis), from openai/skills
    `speech` (Apache-2.0);
  - ElevenLabs v3: audio tags, and its "Enhance" step adds tags without changing words;
  - Kokoro: punctuation and pause control only, so the writing must carry the melody.

## 3. Proposed changes (ranked; each needs Kshitij's go-ahead because it changes defaults)

1. **Separate the breath from the TTS unit.**
   - Phrases stay as reveal anchors and caption lines.
   - The narrate stage synthesises one call per sentence by default, with "beat" and "section" as options. It places
     phrase and word times with the existing phoneme weighting inside each call, refined by the faster-whisper word
     timestamps where they are present.
   - The cache key becomes the sentence.
   - Prove it on st-holo-ai: the speech check passes, cue drift stays within 1 frame of the old anchors or is
     reported, and Kshitij picks the version by ear.
2. **Rewrite the script contract.**
   - A phrase is a breath inside a sentence, not a sentence.
   - Sentences run 4 to 25 words, and the persona's `sentence_words_mean` and `sd_min` become a script gate warning
     (enforced at last), measured over the whole script.
   - A short sentence earns its place by landing something.
3. **A "for the ear" pass after the script gate:** one cheap model call that rewrites for rhythm and joins only. It
   adds no claims, numbers or ids; a diff check proves it changed only wording, and grounding is re-run. It applies the
   tic list ("Here is", "Say" outside hypotheticals, fragment rows) and adds "but" or "so" joins between beats.
4. **Delivery reaches the voice.**
   - The persona compiles to a provider spec: OpenAI `instructions`, ElevenLabs tags and stitching, Kokoro speed per
     beat within 0.9 to 1.1.
   - The beat's `delivery` sets the per-beat variation.
5. **Silence by meaning, not by beat.** Inside a section, a `continue` join uses a 0.3 to 0.4 s gap, not 0.55 s. A
   turn ("but") gets the longer pause before it, and the aha moment gets the held silence after it.
6. **A narration rubric for the critic,** listened to rather than read:
   - motivation within 30 s;
   - one surprising, sourced thing per section;
   - every beat joined to the last by "but" or "therefore";
   - no tic more than twice per film.

## Unverified

- **How the three versions sound.** I cannot listen. The A/B files are for Kshitij's ear; the pause counts are a
  weak proxy.
- **Whether faster-whisper word timestamps are tight enough** for frame-exact reveals. It runs on Kshitij's PC, not
  in this sandbox.
- **Whether Kokoro internally re-splits a long beat in a way that recreates the resets.** Version B is the test; it
  is one call per beat.

## Sources

- [heygen-com/hyperframes](https://github.com/heygen-com/hyperframes) (faceless-explainer story design, narration,
  script format; Apache-2.0)
- [blader/humanizer](https://github.com/blader/humanizer) (MIT)
- [coreyhaines31/marketingskills, copywriting](https://github.com/coreyhaines31/marketingskills/tree/main/skills/copywriting) (MIT)
- [ElevenLabs TTS best practices](https://elevenlabs.io/docs/overview/capabilities/text-to-speech/best-practices)
- [elevenlabs/skills](https://github.com/elevenlabs/skills) (MIT)
- [openai/skills, speech](https://github.com/openai/skills/tree/main/skills/.curated/speech) (Apache-2.0)
- [memex-lab/product-launch-video-skill](https://github.com/memex-lab/product-launch-video-skill) (MIT)
- [THE Journal on Muller's misconception study](https://thejournal.com/articles/2015/05/05/watching-videos-does-not-necessarily-lead-to-learning.aspx) (secondary)
- [3Blue1Brown SoME1 criteria](https://www.3blue1brown.com/blog/some1)
- [PyKokoro docs](https://pykokoro.readthedocs.io/) (pause markup ideas)
- [NPR: writing for the ear](https://www.npr.org/2023/02/17/1156597697/how-to-write-script-speech-podcast-voice) (snippets only, unverified)
