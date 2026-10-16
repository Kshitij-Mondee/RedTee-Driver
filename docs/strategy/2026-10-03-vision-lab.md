# Vision lab: a vision model studies the films, code measures, Claude reads the results (D-101)

STATUS: BUILT and tested end to end against a mock server on 2026-10-03. Not yet run with a real model. The code is
in `tools/vision_lab/` and the runbook is `tools/vision_lab/README.md`.

## Why
Kshitij, 2026-10-03: "you are not good with visuals. You cannot see the videos."

That is partly right:
- I can look at stills, but I judged lessons from stills and gates (L-172).
- I cannot watch motion at full speed.
- Sandbox calls are capped at about 3 minutes.

The fix is a lab that runs on his GPU pod:
- an open vision-language model watches 100 TED-Ed films, and later every Loom film;
- the model writes structured records;
- code measures and checks every claim the model makes;
- what comes back is one zip of JSON and Markdown.

From then on, I grow from those records, never from re-watching the films.

## Principles
1. **Code measures, the model describes, code checks.**
   - Cuts, motion per second, holds, black and frozen frames, palette hex, brightness, detail and speech timing
     are measured by code (`vl.py prepare`) and handed to the model.
   - The model never invents a number the code could measure.
   - Every shot id, time and evidence item the model cites is checked against the records (`vl.py validate`).
2. **Three levels, each with a strict schema** (`tools/vision_lab/schemas/`):
   - **shot:** the join, frame, look, characters, text sizes, timed motion events, camera, how the picture meets
     the words, teaching function, the visual idea, craft and the Loom mapping;
   - **video:** structure, opening, ending, the visual system and the rules the artist follows, colour script,
     transition grammar, pacing, explanation patterns, best moments, what to steal and how it translates to
     corporate learning;
   - **style guide:** per batch of 10, then for the corpus. It holds house constants, style families,
     techniques, rules, an avoid list and the judge rubric. It is backed by frequency tables computed by code
     (`stats.json`).
3. **The study feeds the judge.** The corpus writes the rubric, with anchors for 1, 3 and 5. The judge then
   scores Loom films beat by beat, with defects (type, time, box, severity, fix route).
4. **Trust is measured, not assumed.** The calibration gates (thresholds in `config.yaml`) are:
   - the same model with another seed;
   - a second model (Qwen3.8-27B);
   - planted defects in TED-Ed films (8 kinds, from black frames to tiny text);
   - the step-7 beats that the frame audit called broken (`ground_truth/loom_step7_findings.json`, 133 major
     findings);
   - style families compared with the hidden animation credits.

   A failed gate marks the related outputs as opinions, not facts.
5. **Pilot first.** Five films go through every level and come back to me before the full run spends money.
6. **No copying.** No narration over 20 words of paraphrase, no on-screen text (counted, never copied), no
   artist names. The validator redacts any string that shares 8 consecutive words with a transcript. The bundle
   refuses media and transcripts. This is consistent with "study reference videos, never republish them".

## The model (sources checked 2026-10-03)
- **A: `Qwen/Qwen3.5-122B-A10B-FP8`** (Apache 2.0).
  - Model card video scores: VideoMME 87.3 with subtitles and 83.9 without; MLVU 87.3; LVBench 74.4. These are
    level with the 397B flagship (87.5 / 83.7 / 86.7 / 75.5) at a third of the size.
  - The vLLM recipe gives FP8 on 2x H200 or 4x H100, int4 on one 80 GB GPU, and vLLM 0.17 or newer.
- **B: `Qwen/Qwen3.8-27B`** (Apache 2.0, 2026-08-14).
  - The newest open Qwen, native image and video.
  - Its card publishes no video benchmarks; Qwen3.5-27B, the same architecture, has VideoMME 87.0 / 82.8.
  - Used as the second rater.
- **Not chosen:**
  - Kimi K2.5 (open, VideoMMME 87.4, VideoMMMU 86.6) needs 8x H200;
  - Qwen3.5-397B gains about 0.2 points for about 3x the cost;
  - closed models were out of scope, since Kshitij asked for RunPod.

**Kshitij's pod (2026-10-03): one H100 80GB.** The roles swap:
- A is Qwen3.8-27B in BF16;
- B is Qwen3.5-122B-A10B-GPTQ-Int4, served after A.

`config.yaml` and `serve.sh` ship this profile. The 2x H200 profile is kept beside it.

## Added 2026-10-03, from another session's suggestions (levels 1 to 3: instruments, ears, omni critic)
- **Full-frame-rate motion curves.** Optical flow, 99th percentile per frame, measured on every frame. From them:
  movements (start, duration, peak, where the peak falls, so the easing shape), stutters, flicker and one-frame
  flashes. On synthetic tests the flash is found, smooth motion gives 0 stutters and a stepped move gives 9.
  These numbers go into every shot prompt, every judge prompt and the corpus statistics.
- **Sound hits** by spectral flux (on a synthetic test: 6 of 6 clicks, no extras). From them: hits per minute,
  and the share of cuts and of movement starts within 0.12 s of a hit. Also the music bed level against speech.
- **An optional ears pass:** `Qwen/Qwen3-Omni-30B-A3B-Instruct` (open weights; the newer Qwen3.8-Omni-Flash is
  API-only), with the `sound` schema and the `25_sound_listener` skill. `selftest --model c` checks audio.
  vLLM's audio input for it is not verified until that runs.

## What I will do with the bundle
- **Ingest:** `vl.py ingest` validates the bundle again and writes `INGEST.md`.
- **Read the gates first.** Only trusted outputs become rules.
- **Turn the technique library and rules into general Loom work:**
  - checks: measurable rules become film checks;
  - pack and builder parameters;
  - new primitives where `loom_status` says one is needed;
  - skill references.

  Never lesson-specific rules (Kshitij's direction, 2026-10-03).
- **Use the judge on every golden segment and lesson,** before Kshitij watches. His verdict stays final. The
  judge's agreement with him is tracked in the decision ledger.

## Not verified yet (Rule 0)
- **Real model behaviour:** quality, labelling noise and how well it judges small text. The mock test proves the
  plumbing only; the calibration gates will measure the rest.
- **The exact vLLM flags** for video sampling (`--media-io-kwargs`, `mm_processor_kwargs` fps) and structured
  output combined with thinking. They come from the Qwen3.8 card and the vLLM recipe; `vl.py selftest` checks
  each on the real server and falls back where possible.
- **Throughput and cost** (2-4 h for the shots, roughly $70-100 for the whole run on 2x H200 at about
  $4.6/GPU-hour): estimates, not measurements.
- **Shot segmentation over-splits** continuous TED-Ed transformations into "gradual" units (checked on one film
  in the sandbox). That is acceptable: the units are visual beats, and the model labels the join
  `none_continuous`.
