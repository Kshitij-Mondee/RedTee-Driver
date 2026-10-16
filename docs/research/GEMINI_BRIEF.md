# Brief for Gemini: studying reference explainer channels for Loom (2026-09-30)

**Who this is for:** Kshitij, to paste into Gemini. It produces the observations Claude uses to improve
Loom's skills and storyboard references.

**What happens to the results:**
- They become **references for judgement**, never checklists or fixed templates (D-64).
- **Pedagogy comes first:** these are learning videos, not attention videos.

## How to run it
1. **Tool:** use Gemini with YouTube or video input: Gemini 2.5 Pro or newer, in the Gemini app or
   Google AI Studio.
   - AI Studio is better if it lets you raise the video frame rate or media resolution. The default
     samples about 1 frame per second, which is fine for structure but misses fast motion.
2. **One video per chat:**
   - Paste PROMPT A, then the video link. Long videos lose detail when several share one chat.
   - Save the JSON it returns as `docs/research/gemini/<channel>__<short-title>.json` in the Video-Engine
     folder.
   - If Gemini writes anything outside the JSON, save that as the same name with `.md`.
3. **Per channel:** after all of a channel's videos, open a new chat.
   - Attach or paste that channel's JSON files and run PROMPT B.
   - Save the result as `docs/research/gemini/<channel>__synthesis.md`.
4. **Across channels:** once all five are done, run PROMPT C over the five syntheses.
   - Save the result as `docs/research/gemini/cross_channel.md`.
5. **Clip list:** every per-video JSON ends with `clips_worth_frames`: 3 to 5 moments of 5 to 20 seconds.
   - If you can get those short clips for private study, put them in `docs/research/clips/` named
     `<channel>__<short-title>__<start>.mp4`.
   - Claude will extract every frame and measure the motion (durations, easing, stagger, camera, joins).
     That is the part Gemini cannot see at 1 frame per second.

**A verbatim transcript is not needed.** PROMPT A asks for:
- the timing and word counts of the narration;
- a paraphrase of each segment;
- at most a few short quotes.

That gives Claude everything it measures (pace, sentence length, where the turns fall, how ideas are
worded) without copying anyone's script.

## Which videos (about 6 per channel)
Choose for **variety of kind**, not only popularity. Suggested (the research sub-agent found these; swap
any you like):

**3Blue1Brown:**
- Linear transformations and matrices (Essence of Linear Algebra, ch. 3);
- But what is a neural network?;
- But what is the Fourier Transform?;
- Bayes theorem, the geometry of changing beliefs;
- the colliding blocks that compute pi (problem video);
- Transformers, the tech behind LLMs.

**TED-Ed** (pick different studios and kinds on purpose):
- How playing an instrument benefits your brain;
- Can you solve the prisoner hat riddle?;
- How to manage your time more effectively (according to machines);
- What is imposter syndrome and how can you combat it?;
- How does the stock market work?;
- plus one history or ethics lesson animated by a different studio.

**Kurzgesagt:**
- The Immune System Explained I (bacteria infection);
- Loneliness;
- The Coronavirus Explained & What You Should Do;
- Let's Travel to The Most Extreme Place in The Universe;
- The Last Human;
- How to Make a Kurzgesagt Video in 1200 Hours (their process).

**Cleo Abram:**
- Why Elon Musk is Really Building Starlink;
- Nuclear Fusion, explained for beginners;
- Quantum Computers, explained with MKBHD;
- Would You Use An Artificial Womb?;
- I Tested NASA's New Space Suit;
- one recent explainer of your choice.
- For her videos, focus on the explanation and graphics segments. Loom cannot film on location.

**Crayon Capital** (@Crayon_Capital, "Big finance, drawn small"):
- The 2008 Financial Crisis Explained Like You're 5;
- The Great Depression Explained Like You're 5;
- The Wolf of Wall Street Scam Explained Like You're 5;
- How Jeff Bezos Actually Built Amazon;
- Rockefeller: The First Confirmed Billionaire;
- NVIDIA Explained Like You're 5.

**Optional, closer to L&D:**
- 2 or 3 videos you consider excellent corporate training, onboarding or compliance videos. They show
  what "good" looks like when attention is not the goal, which matters most for Loom.

---

## PROMPT A (one video; paste this, then the link)

```
You are a senior learning-experience designer and motion-graphics director. You are studying one
educational video so that a team building a code-rendered learning-video engine (for workplace training,
onboarding, compliance and teaching, NOT for YouTube attention) can learn from its craft.

The engine can already do: flat vector motion graphics on one continuous canvas with a moving camera;
templates for titles, lists, comparisons, charts, timelines; hand-drawn (whiteboard) and line-art looks;
2D rigged characters (poses, gestures, walk, blink, simple lip flaps); a 2.5D layered depth stage with
parallax, blur, glow, haze and light cones; isometric diagrams; simple 3D objects; mathematical animation
(Manim); shader backgrounds, grain and vignette; Lottie micro-animations; synthesised music and sound
effects; one local text-to-speech voice with word timings. It cannot film live action.

FIRST, PROVE YOU CAN SEE THIS VIDEO. If you cannot watch it (you only have the title, a description or
your memory of the channel), reply with exactly: CANNOT WATCH <url>, and nothing else. Do not fill the
JSON from general knowledge; a guessed answer is worse than none.

RULES
- Describe only what you can see and hear in THIS video. Do not use outside knowledge of the channel
  unless you label it "outside knowledge".
- Every observation gets a timestamp (mm:ss) so it can be checked against the frames.
- If you are unsure, say so in the "confidence" fields (high / medium / low) and in "could_not_see".
- Do NOT write out the transcript. Paraphrase each segment in your own words. You may quote at most 5
  short phrases in total (under 15 words each) when the exact wording is the craft being studied.
- Estimates are fine but must be marked as estimates.
- Be concrete: "the camera pushes in on the left cell over about 2 s while the rest dims" is useful;
  "engaging visuals" is not.

Return ONE JSON object with exactly these fields, then nothing else:

{
  "proof_of_watching": {"first_spoken_sentence": "the exact first sentence of narration",
                        "title_card_text": "the words on the title card, exactly",
                        "first_three_cuts": ["mm:ss", "mm:ss", "mm:ss"]},
  "video": {"title": "", "channel": "", "url": "", "published": "", "duration": "mm:ss",
            "credits_seen": "writer, director or studio, narrator, composer, as shown in the video"},
  "learning": {
    "what_the_viewer_should_understand_or_do_after": "",
    "prior_knowledge_assumed": "",
    "the_one_idea": "the through-line in one sentence",
    "misconceptions_addressed": [{"t": "mm:ss", "misconception": "", "how_corrected": ""}],
    "how_understanding_is_checked_or_invited": "questions, pauses, predictions, recaps, practice; with timestamps",
    "what_is_left_out_on_purpose": "simplifications and what the video chose not to cover",
    "pedagogy_notes": "sequence (concrete before abstract?), worked examples, analogies, cognitive load, signalling"
  },
  "structure": {
    "hook": {"t_start": "", "t_end": "", "what_happens": "", "question_or_stake_opened": ""},
    "acts": [{"name": "", "t_start": "", "t_end": "", "purpose": "", "ends_on": "the line or image that leads to the next act (paraphrased)"}],
    "turn": {"t": "", "what_changes_in_understanding": ""},
    "payoff": {"t": "", "how_the_opening_question_is_answered": "", "does_it_echo_the_opening_image": "yes/no, how"},
    "ending": "recap, call to action, or open question; how long"
  },
  "segments": [
    {
      "t_start": "mm:ss", "t_end": "mm:ss",
      "narration_paraphrase": "",
      "narration_word_count_estimate": 0,
      "role": "hook | context | example | definition | mechanism | misconception | correction | turn | practice | recap | aside | other",
      "on_screen": "what is shown: subjects, composition, where the eye goes first",
      "on_screen_text": "words shown (short), and how many words",
      "shot_size": "establishing | wide | medium | close | insert | overhead | pov | abstract",
      "camera": "static | push | pull | pan | orbit | zoom-through | cut; speed and duration estimate",
      "depth": "flat | layered | isometric | 3d | live-action; how many layers, parallax, blur",
      "light_and_colour": "key light, glow, spotlight, palette shift, what colour means here",
      "characters": "who, style, what they do (pose, gesture, expression, lip sync), why they are there",
      "motion": "what moves, whether the motion IS the explanation (the thing changing) or decoration; build order; easing feel (snappy, soft, springy); rough durations",
      "transition_out": "cut | match cut | camera move | morph | wipe | zoom into detail | fade; what carries over between the two shots",
      "sound": "music change, sound effects and what event each marks, silence",
      "numbers_shown_how": "if a number appears: as a figure, a chart, a crowd of icons, a physical comparison, a scale journey",
      "technique_worth_learning": "one sentence, or empty",
      "confidence": "high | medium | low"
    }
  ],
  "governing_metaphor": {"exists": true, "what": "", "introduced_at": "", "recurs_at": ["mm:ss"], "how_it_maps_to_the_idea": ""},
  "recurring_characters_or_motifs": [{"name": "", "role": "", "appears_at": ["mm:ss"]}],
  "pacing": {
    "narration_words_per_minute_estimate": 0,
    "average_sentence_length_words_estimate": 0,
    "average_shot_length_seconds_estimate": 0,
    "longest_hold_seconds_and_where": "",
    "where_it_slows_down_and_why": "",
    "where_it_speeds_up_and_why": ""
  },
  "style_bible": {
    "palette": "main colours (hex estimates if you can), background vs accents, what colour codes",
    "type": "fonts or font style, sizes, how much text on screen, when text appears",
    "shape_language": "rounded, geometric, hand-drawn, textured, flat, gradients, outlines",
    "texture_and_finish": "grain, paper, noise, glow, shadows",
    "character_design": "proportions, detail level, how emotion is shown",
    "motion_personality": "overall feel of the animation and how consistent it is"
  },
  "sound_bible": {"music": "style, where it changes, how it relates to the structure", "sfx": "density, what gets a sound, what never does", "voice": "tone, pace, warmth, emphasis, pauses"},
  "production_cost_signals": "what looks expensive (hand illustration, custom 3D, composed score, location filming) vs cheap to make; estimates",
  "transfer_to_workplace_learning": {
    "would_help_a_training_video": ["technique and why, with timestamp"],
    "attention_tricks_that_would_not_fit_training": ["technique and why not"],
    "what_a_policy_or_compliance_video_could_borrow": "",
    "what_a_soft_skills_video_could_borrow": "",
    "what_a_technical_or_systems_video_could_borrow": ""
  },
  "clips_worth_frames": [
    {"t_start": "mm:ss", "t_end": "mm:ss", "why": "the motion or transition craft to measure frame by frame"}
  ],
  "could_not_see": "anything you could not judge (fast motion, exact easing, small text, audio detail)",
  "confidence_overall": "high | medium | low"
}
```

**Before sending any notes:** run `py tools/check_video_notes.py <file> --online`. It rejects notes whose
URL is a different video or channel, placeholder titles, and entries that are the same text copied under
several titles (all three happened on 2026-10-01: `docs/research/gemini/VERIFICATION_2026-10-01.md`).
One video per chat; if Gemini starts returning the same text for different videos, start a new chat.

## PROMPT B (per channel; attach that channel's JSON files)

```
Here are structured observations of several videos from one channel, each produced from the video
itself. Using ONLY these files (say "not in the files" when something is missing), write a channel
study for a team building a code-rendered learning-video engine for workplace training.

1. Signature: what this channel does consistently, in structure, pedagogy, visuals, motion, sound and
   voice. Each point with the videos and timestamps that show it.
2. Variety: how its videos differ from each other (by topic, by studio or animator, by length), and
   what stays constant.
3. Pedagogy first: which of its techniques genuinely help understanding and transfer, and which exist
   mainly to hold attention on YouTube. Be honest about the second list.
4. The best moments: the 5 segments most worth learning from, why, and what makes them work
   (timestamps).
5. Craft numbers: the ranges seen across videos for words per minute, sentence length, shot length,
   holds after reveals, how often the picture changes, how much text is on screen. Mark estimates.
6. What would be costly to reproduce (human illustration, custom 3D, composed music) and what a code
   engine could reproduce well.
7. Three "if you remember one thing" lessons for someone designing a training video in this spirit.
Keep it concrete. No generic praise.
```

## PROMPT C (across channels; attach the five syntheses)

```
Here are studies of five educational channels. For a team building a code-rendered engine for
WORKPLACE learning videos (policy and compliance, onboarding, soft skills, technical and systems
teaching, explainers), where pedagogy comes first and attention-seeking is not the goal:

1. For each kind of workplace video above, which techniques from these channels would help, which
   would hurt, and how much storytelling and cinema it usually wants (low, medium, high), with reasons.
2. The techniques that appear in several channels, ranked by how much they help UNDERSTANDING (not
   views), each with its evidence.
3. Where the channels disagree (for example dense narration versus long silent holds), and what
   decides which approach suits a given lesson.
4. Production tiers: which techniques are cheap for a code engine (templates, flat motion), which are
   moderate (bespoke animation, characters, depth), which are expensive (hand illustration, 3D, composed
   music), and which kinds of workplace video justify each.
5. Anything in these studies that contradicts common instructional-design advice (Mayer's multimedia
   principles, cognitive load, worked examples, retrieval practice), and how you would resolve it.
Write this as guidance for judgement, not as a checklist.
```

---

## What Claude will do with the results
- **Read everything** into `docs/research/gemini/`. Measure the numbers across all videos (pace, shot
  length, holds, text density), per channel and per kind of video.
- **Check Gemini against the frames** wherever clips exist (rule 0: a claim is used once it has been
  checked, or it is marked unverified).
- **Measure motion from the clips:**
  - durations;
  - easing curves (position over time);
  - stagger;
  - camera paths;
  - how joins between shots carry an element across.
- **Update the skills as references, not rules:**
  - `lnd-visual-storyteller` (per kind of video);
  - `lnd-motion-craft` and `lnd-motion-fit` (measured timing ranges);
  - `lnd-learning-pedagogy` (how these channels check understanding);
  - `lnd-narrator-persona` (voice and pace);
  - the genre notes in `packs/genres/`;
  - the production-tier labels.
- **Name the gaps:** where a technique would need an asset or capability Loom lacks, it goes into
  `docs/styles/WALLS_AND_NEEDS.md` with its tier and cost.
