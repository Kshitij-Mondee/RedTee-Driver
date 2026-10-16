# Palette studies (research, not the render path)

`py tools/palette_study.py <video | folder> --out docs/research/palettes` writes, per video, a JSON and a
swatch PNG:
- the field (background) and its shades;
- neutrals (text, lines, cards, skin), by area;
- accents, by how many sampled frames they appear in;
- accents per frame;
- the accent pairs that appear together most often;
- ink-on-field contrast;
- a palette per shot.

`py tools/palette_study.py --aggregate docs/research/palettes` summarises across videos, grouped by the
file-name prefix before `__`, so name the files `<channel>__<title>.mp4`.

## Why it is not the K-means script as given (measured 2026-10-01)
Both were run on the first 120 s of Loom's own `spacing-sticks` lesson, whose exact palette is known (the
`flat-cosmos` style pack). A token counts as recovered when a reported colour is within delta E 8 of it.

| | K-means script (as suggested) | `palette_study.py` |
|---|---|---|
| tokens recovered (of 9) | 6 | 8 |
| orange `#FF8A3D` and yellow `#FFC94A` | merged into one colour not in the video (`#F5AD46`, delta E 14.5) | found separately (`#FC8C3C` delta E 2.0; `#FCC444` delta E 1.9) |
| per-frame slots spent on background shades | 266 of 600 (44%) | shades are labelled ground, not accents |
| characters' skin tone | reported as a muddy near-ink colour (delta E 20.5) | found (`#ECC49C`, delta E 2.2 to the pack's skin) |
| run time (120 s of video, 1 fps) | 16 s | 3 s |

**Why the numbers differ:**
- K-means averages pixels, so nearby accents blend into colours the video never shows.
- A gradient background consumes most of each frame's clusters.

**The first rebuild failed too:** splitting colours on chroma alone called the navy background an accent.
Roles are now relative to each frame's field.

**Still imperfect:**
- The thin `muted` text colour was not recovered: anti-aliasing and compression blend thin strokes into
  the background.
- The surface (card) colour is sometimes labelled an accent on frames where the field is very dark.
- YouTube files are compressed and chroma-subsampled, so hexes within about delta E 5 of each other
  should be read as the same colour.
