# The golden set (E1 of D-102)

**What it is for.** "Mature" is defined by Kshitij's ratings, not by my judgement. Every later change is measured
on these frames. The vision judge's maturity score may gate a lesson only after it ranks these frames the way
he does (Spearman 0.7 or better, `py -m loom golden report --judge <scores.json>`).

## How to rate (about 10 minutes)
In Git Bash:
```bash
cd /c/Users/Admin/Desktop/Video-Engine
py -m loom golden serve
```
- The page opens at http://127.0.0.1:8830/. It runs only on this PC; nothing is uploaded.
- Keys:
  - `1` to `5` rates the frame and moves on;
  - `A` to `K` ticks what drove the score (optional);
  - `N` adds a note;
  - the left arrow goes back.
- If you stop part way, the page starts at the first frame you have not rated.
- Close the server with `Ctrl+C` when done.
- Then run `py -m loom golden report` to see the summary.

## What is in it (66 presentations of 60 frames)
| class | n | source |
|---|---|---|
| reference | 20 | TED-Ed 8, Kurzgesagt 6, Crayon Capital 2, Cleo Abram 2, Lucas's Lab 2: local study videos |
| rejected | 20 | the step-7 renders (phishing 8, feedback 8, outside the golden segments), spacing-sticks 2, blameless-postmortem 2 |
| new | 16 | the rebuilt golden segments (phishing b17 to b21: 6; feedback b37 to b41: 4) and 6 lab scenes made after D-100 |
| external_ai | 4 | the two videos made by the external explainer-video skill (D-102's "another tool" comparison) |

- Six frames are shown twice, 28 to 59 places apart, to measure the rater's own consistency. A judge cannot be
  asked to agree with a person more closely than the person agrees with himself.
- **Change from the D-102 plan:** 16 new frames, not 20, plus 4 frames from another AI tool. The sandbox has no
  browser today, so no new lab frames could be rendered. Six lab frames were cut from the lab strip sheets
  instead; they are already 640x360, the reference size.

## Fairness, and what remains a tell
- **Same treatment for every frame:**
  - brought to 640x360 (the reference videos' size);
  - re-encoded once with h264 (CRF 26) unless the frame already came out of a 360p video;
  - the bottom 14 % is cut from EVERY frame, because Loom renders burn in captions and the references have none.
- **The page is blind:**
  - it receives opaque entry ids only, never a key, class, source or which frames repeat (checked by test 83);
  - the order is a seeded shuffle, kept across rebuilds while the frame set is unchanged.
- **Tells that remain, unverified:**
  - the studio frames have painterly texture;
  - our frames share a few palettes, so a rater may recognise Loom's look;
  - this cannot be removed, and it is part of what "mature" means.

## Files
- **`golden_set.json`:** the spec (sources, times, classes). Times are where a frame really is.
  - A contact sheet made with ffmpeg's `fps=1/N` labels its frames half a step early (L-188).
- **`manifest.json`:** built. It holds frame ids, classes and the presentation order. There is no media in it.
- **`ratings/<rater>.jsonl`:** append-only. The latest line for a presentation wins.
- **`report_<rater>.json`:** written by `golden report`.
- **`cache/golden/frames/`:** the frames themselves, local only (cache/ is gitignored).
  - Reference stills are study material: never publish or commit them.
  - `cache/golden/sheet.jpg` shows every frame with its key. It is for the builder; do not open it before rating.

## Rebuild
`py -m loom golden build` reads the reference videos from `C:/Users/Admin/Documents`. Use
`--root docs=<folder>` elsewhere. Existing frames are kept unless `--force` is passed. The `qa/frames` PNGs of the
golden segments are overwritten by the next `check`, so a forced rebuild after that changes those frames.

## Next (E3)
- The vision lab gets a maturity pass over these 60 frames on the pod.
- Its scores go through `golden report --judge`.
- Below rho 0.7, the judge stays advisory.
