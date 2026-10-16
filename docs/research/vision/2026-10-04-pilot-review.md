# TED-Ed vision-lab pilot: review of the 5-film bundle (2026-10-04)

**Bundle:** `docs/research/vision/inbox/bundle_pilot.zip`. It holds 1,339 files and no media.

## What is good (read, not assumed)

**Shot records** (451, 0 failed). They are specific, use production terms and are tied to time. For example,
`JJdoAMiaLZo/s021` records:
- the transition and how it works;
- framing: wide, rule of thirds, a subject box, 2 depth layers;
- style: flat vector, thin dark outline, flat cel shading;
- palette and accent logic;
- character design proportions;
- 3 timed motion events with easing and meaning;
- the narration link, as a metaphor that coincides with the words;
- the teaching function, as an analogy;
- 4 concrete craft notes;
- a Loom mapping.

This is the level of detail the study needs.

**The one whole-film record** (`IpaVpMFBwAE`):
- it gives the style family as concrete descriptors, with `editorial-paper` as the closest pack;
- its pacing quotes the measured cut rate and names the slow and fast sections with times;
- its steal list is buildable (accent isolation, a fixed hero object, picture 0.2 to 0.5 s ahead of the word,
  chapter punctuation devices, morph chains).

**The style guide** (from 1 film, so a format check only). Each technique in its library has:
- what it is and when to use it;
- timings taken from the measured medians;
- Loom status: exists, needs a parameter, needs assets, or needs a new primitive.

The "Loom lacks" lists are actionable.

## What failed
- **Whole-film records: only 1 of 5 films.**
  - `usage_videos.json`: 780k prompt and 219k completion tokens, about 13.7k completion tokens per attempt against
    a 16k cap.
  - Probable cause: thinking plus a large schema ran out of tokens, and the JSON was cut off.
  - Fix (L-204):
    - `videos` max_tokens is now 32k and judge 16k;
    - raw records now keep `finish_reason`;
    - `validate` now fails below 95 % film-record coverage. It passed this pilot.
  - The cause is a hypothesis until the raw records are read on the pod.
- **Minor:**
  - 6 warnings for implausible `text height_frac` values (0.5 to 0.8, or 0);
  - 40 strings overlap the narration verbatim, and `pack` redacted them as designed.

## Verdict
- The shot pass is good enough to run on all 96 films unchanged.
- The whole-film pass needs the token fix, which is shipped. The failed films are retried by the full run.

## Update (same day): the cause, from the raw records
- **Not truncation.** Attempts 2 to 4 used 6 to 7k completion tokens.
- **The real cause:** validation failed on array limits (the error quotes a long `corporate_translation` list). The
  prompt schema had lost every `maxItems` (L-205).
- **Fixed:**
  - the prompt now carries the full schema with its limits;
  - over-long arrays are trimmed and counted.
