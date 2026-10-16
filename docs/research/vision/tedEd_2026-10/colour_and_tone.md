# Colour and tone across 96 TED-Ed films (2026-10-05)

**Sources.** Two kinds, kept apart:
- **Measured by code**, on every one of 6,307 shots (`measures/<film>.json`):
  - the 6-colour palette with shares;
  - mean brightness, saturation and detail.
- **Described by Qwen:**
  - a colour script per film: up to 10 sections, each with a mood, dominant colours and why;
  - a palette mood and an accent note per shot.

Families are the 12 from the corpus guide.

**Not measured:**
- grading in the strict sense: lift, gamma, curves, vignette, contrast curves;
- the tone of the voice (the sound pass was not run).

Everything was analysed at 854x480.

## 1. The corpus in numbers (code)
Values are the film median, with p10 to p90 in brackets.

| measure | value |
|---|---|
| mean brightness | 0.53 (0.37 to 0.77) |
| brightness spread across shots (sd) | 0.16 (0.10 to 0.25) |
| mean saturation | 0.39 (0.10 to 0.50) |
| saturation spread across shots (sd) | 0.17 (0.10 to 0.24) |
| share of dark shots (brightness < 0.25) | 5 % (0 to 30 %) |
| share of light shots (brightness > 0.7) | 21 % (4 to 79 %) |
| share of the palette that is warm (reds, oranges, yellows) | 0.38 (0.06 to 0.76) |
| share of the palette that is cool (blues, teals) | 0.14 (0 to 0.50) |
| colours over 5 % of a frame | 5 (4 to 6) |
| shots with a small, highly saturated colour (a heuristic for an accent) | 28 % (7 to 67 %) |

**Reading:**
- **Mid-bright and moderately saturated, leaning warm.** Saturation is never pushed: the p90 is 0.50.
- **About five working colours a frame.**
- **The tone moves inside a film.** Brightness and saturation each vary by about 0.16 to 0.17 across shots, so a
  film is not one flat grade.

## 2. Each family has its own tonal signature (code)
| family | films | bright | sat | dark shots | light shots | warm | cool | accent shots | colours | detail |
|---|---|---|---|---|---|---|---|---|---|---|
| sketch line on paper | 9 | 0.82 | 0.08 | 0 % | 86 % | 0.05 | 0.07 | 9 % | 4.7 | 0.085 |
| brush wash on paper | 6 | 0.62 | 0.26 | 7 % | 44 % | 0.33 | 0.17 | 24 % | 4.8 | 0.066 |
| rounded outline, bright field | 11 | 0.62 | 0.36 | 5 % | 36 % | 0.41 | 0.23 | 38 % | 5.0 | 0.080 |
| wobbly outline, grain, flat | 12 | 0.60 | 0.39 | 9 % | 37 % | 0.46 | 0.19 | 38 % | 5.0 | 0.074 |
| geometric primitive fields | 4 | 0.59 | 0.53 | 2 % | 31 % | 0.53 | 0.29 | 66 % | 3.0 | 0.042 |
| cut paper, collage | 8 | 0.55 | 0.38 | 10 % | 26 % | 0.35 | 0.28 | 41 % | 5.0 | 0.079 |
| outline-free grain flat | 7 | 0.53 | 0.44 | 5 % | 18 % | 0.49 | 0.24 | 48 % | 5.0 | 0.056 |
| live-action hybrid | 10 | 0.53 | 0.41 | 5 % | 9 % | 0.51 | 0.25 | 29 % | 5.8 | 0.077 |
| print, comic, halftone | 3 | 0.50 | 0.33 | 32 % | 34 % | 0.11 | 0.37 | 37 % | 4.7 | 0.125 |
| glow technical 3D | 6 | 0.48 | 0.47 | 17 % | 22 % | 0.36 | 0.44 | 36 % | 5.8 | 0.056 |
| outlined period storybook | 10 | 0.47 | 0.36 | 11 % | 10 % | 0.60 | 0.09 | 22 % | 5.9 | 0.097 |
| dark void, single light | 10 | 0.37 | 0.30 | 37 % | 11 % | 0.23 | 0.15 | 27 % | 5.3 | 0.077 |

**What the table says:**
- **Sketch on paper is nearly monochrome.** Saturation is 0.08 and 86 % of shots are light. Its one accent is rare
  (9 % of shots), so it is loud when it comes.
- **Geometric fields are the opposite.** They have the highest saturation (0.53), the fewest colours (3) and an
  accent in 66 % of shots: a few bold flat fields, not a palette.
- **Period storybook is the warmest** (0.60 warm, 0.09 cool), mid-dark (0.47) and the most detailed of the
  illustrated families (0.097).
- **Dark void is the darkest** (0.37), with 37 % of shots dark: light is the subject.
- **Glow technical is the coolest** (0.44 cool) and saturated (0.47).
- **Print and comic** mixes extremes, with 32 % dark and 34 % light shots. It has the most texture detail (0.125:
  halftone and hatching).

**The same finding as the guide, now measured:** the families differ in tone far more than in grammar. A Loom
pack is a tone setting as much as a drawing setting.

## 3. How tone moves through a film
**By the part of the lesson (code).** These are brightness differences against each film's own mean, from the shot
times mapped onto Qwen's structure sections:

| part | shots | brightness vs film mean | saturation |
|---|---|---|---|
| hook (the branded card and quote) | 208 | +0.20 | 0.23 |
| credits | 109 | +0.08 | 0.29 |
| recap | 97 | +0.05 | 0.33 |
| question | 207 | +0.03 | 0.38 |
| call to action | 209 | +0.03 | 0.38 |
| analogy | 143 | +0.02 | 0.35 |
| example | 752 | 0.00 | 0.40 |
| explain mechanism | 1,671 | -0.01 | 0.40 |
| turn | 369 | -0.02 | 0.36 |
| story | 1,192 | -0.02 | 0.33 |
| data | 246 | -0.03 | 0.41 |

- The open is pale and quiet: a near-white card, saturation 0.23.
- The middle, where the story, data and mechanism sit, is slightly darker and richer.
- The film lifts again for the advice, the recap and the credits.

By film tenths, the brightness shift runs from +0.06 at the start, through -0.01 to -0.03 in the middle, to +0.03
at the end. It is a shallow U.

The differences are small (a few hundredths), except at the open. The arc is a habit, not a dramatic grade.

**Colour script (Qwen).**
- **Sections:** Qwen split every film into 6 to 10 colour sections, with a median of 10. 10 is the schema limit, so
  the true number of tonal shifts is at least about 1.6 a minute and probably more.
- **The moods it named most often:** warm 66, calm 55, neutral 40, tense 28, clean 27, playful 22, intimate 21,
  historical 21, clinical 20, cool 20, focused 18, quiet 18.
- **The dominant colours it named most often:** red 339, white 182, pink 171, blue 152, cream 150, yellow 145,
  black 129, orange 127, green 120, grey 113, teal 99.
- **Per-shot palette moods:** warm 4,568, muted 3,016, earth 1,814, blue 1,745, red 1,594, saturated 1,553,
  cool 1,362. Neon appears 29 times and vivid 6.
- **Reading:** the house register is warm and muted with a red accent. Tension is shown by shifting the field, not
  by pushing saturation; neon is almost absent.
- **A typical section's "why" ties a palette shift to meaning:**
  - darker and enclosed for "inside the mind" or a loop;
  - flat cream with coded cards for evidence;
  - a red flood for a turn.

## 4. What this means for Loom (proposals)
1. **Tone presets per pack, taken from the table.** Brightness, saturation, warm/cool balance, colour count and the
   share of accent shots, as numbers a pack can be checked against on rendered frames.
2. **A colour-script field in the storyboard.**
   - **What:** the field and tone per section (light open, a richer middle, a lift for the close), with a reason
     per shift, as these films do. This joins proposal 5 of the study (section colour script).
3. **A check on rendered frames:** measure the same numbers (brightness, saturation, warm share, colours over 5 %,
   accent share) on a Loom lesson and compare them with its declared family's range. These are cheap code
   measurements; the vision model is not needed.
4. **Grading in the strict sense** (curves, vignette, contrast) would need a new measurement: say a luminance
   histogram per shot. It was not part of this run and can be computed on the PC from the reference videos we
   already have, without a pod.
