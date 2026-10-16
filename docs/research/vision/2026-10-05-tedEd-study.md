# TED-Ed vision study: what Qwen saw in 96 films, and what it changes for Loom (2026-10-05)

**Status:** findings and proposals. Nothing here is decided. The person chooses what Loom builds (D-70).

## 1. What we have and how it was made
- **Watching (on the pod, Qwen3.8-27B-FP8):**
  - 96 films, 6,307 shot records, 96 whole-film records;
  - code measurements of every film (cuts, holds, motion, speech rate);
  - a self-consistency re-run on 630 shots;
  - a planted-defect test on 10 films (590 judge windows).
- **Distilling (off the pod, by Claude sub-agents, D-110):**
  - eight batch guides of 12 films each, then six merges;
  - every count comes from code or from the records;
  - every evidence item was checked by code against the shot records: 0 missing out of 4,757 in the batch guides
    and in the corpus guide.
- **Files:**
  - in `docs/research/vision/tedEd_2026-10/`:
    - `style_guide.json`: the corpus guide in the lab's schema, 60 techniques chosen for breadth;
    - `style_guide.md`: readable, with all 175 merged techniques;
    - `technique_library_full.json`;
    - `rules_extended.json`: 99 rules;
    - `stats_code.json`: the code's tables;
  - raw responses and logs: `cache/vision_raw/` (gitignored, never published);
  - batch work: `cache/vision_study/`.
- **A caution on counts:** a technique's "films" count is the sum of what each batch reported. Those counts were
  not recounted against every shot record. Treat them as close, not exact.

## 2. How far the records can be trusted (measured)
| check | result | what it means |
|---|---|---|
| coverage | 96/96 films, 6,307/6,307 shots, 0 unmatched | complete |
| code hard cut vs model "hard_cut" | 4,055 of 4,150 (97.7 %) | the model sees cuts |
| self-consistency, 630 shots re-described | 0.82 field agreement (transition 0.74, narration relation 0.74, teaching function 0.76, sync 0.96) | about one label in four can flip; trust patterns across many films, not one shot's tag |
| planted defects found, gross | 0.846 (gate 0.85) | black 7/7, placeholder 6/6, freeze 4/7, seam 3/6 |
| planted defects found, subtle | 0.75 (gate 0.60) | tiny text, low contrast and grain at 5/6 each |
| clean windows of real TED-Ed films called major | 174 of 493 (35 %) | it condemns professional work |
| clean windows given the verdict "fix" | 391 of 493 (79 %) | same |
| shot records listing a flaw | 2 of 6,307 | asked to describe, it finds nothing wrong |

**Reading.** As a describer, the model is good and consistent. As a judge, it is not usable without heavy
filtering: the same model calls 79 % of a professional film "fix" when asked to judge it. Its main false alarms:
- "double exposure" at the films' own crossfades (161);
- "style mix" (87);
- "jank" (138);
- static holds.

This agrees with E3 (D-109): it does not share Kshitij's taste, and its condemnations are not reliable. It may only
be used for the defect types it measurably finds: black frames, placeholder text, cut-off and tiny text, low
contrast, grain. Even then, a human or a code check confirms what it finds.

**Measurement caveats found during the distillation:**
- `sync_offset_s` is a field the model writes, not a measurement. It wrote 0.0 for 6,116 shots, so "lands on the
  word" is observed, never measured.
- The code's "linear" moves (8,272, median 0.13 s) are jitter.
- 470 sub-shots exist because shots over 20 s are split, so a join between two sub-shots is not a real join.
- One hand-drawn film (jLOuMXnM5wk) has 0 detected cuts.
- My batch inputs showed only the first six holds of each film (L-211). The corpus figure: the longest still per
  film has a median of 5 s and a maximum of 24 s.

## 3. What the films do (the findings that recur across all batches)
1. **One skeleton under many looks.**
   - A silent branded open of about 6 s: the first word comes at 5.97 to 8.69 s in 84 films.
   - A held closing image over a thin credits bar (96 of 96).
   - Hard cuts as the default join.
   - A locked camera (5,158 of 6,307 shots are static).
2. **One saturated accent on the named thing, on a muted field.** All 96 whole-film records state it. It is the only
   rule every batch called "always". It is also the cheapest check Loom could add.
3. **The camera is still, the drawing moves.**
   - Motion share is 0.61 to 0.90 per film.
   - Entrances are short and eased, and morphs take about 1 s.
   - One slow ambient loop keeps a hold alive (94 films).
   - Camera moves are single and slow: a push in to isolate, a pull out to reveal scale (54 films).
4. **Pictures arrive when they are named.** The records say so in 81 films. This is observed, not measured.
5. **Text is labels, numbers, signs and stamped terms, never sentences.**
   - Labels sit at about 0.05 of frame height and are never below about 0.03.
   - Quantities are repeated objects (23 films), not axis charts.
6. **Joins are built from what is in the frame:**
   - a zoom through a portal (64 films);
   - an outline morph (45);
   - material wipes, such as torn paper or a page turn, in the collage and storybook families;
   - hard cuts on the beat.
   Dissolves are rare but deliberate, and several films hold a brief ghost of the previous frame on purpose.
7. **A visible finish (paper, grain, brush) over flat fills, in about 60 films.** Part of it may be compression at
   854x480 (an open question).
8. **People are reduced and few:**
   - a median of one per shot;
   - minimal faces, with emotion in posture (36 films);
   - no lip sync on drawn characters;
   - a disembodied hand that enters to act on objects (39 films).
9. **Twelve drawing families, one grammar.** They differ in outline, surface, field, join habit and tempo (about 4 to
   19 cuts a minute; slow and fast films both work). They keep the skeleton and the accent rule.

   | family | films | closest pack |
   |---|---|---|
   | wobbly outline, grain, flat | 12 | story-cartoon |
   | rounded outline, bright field | 11 | story-cartoon |
   | dark void, single light | 10 | cinematic-noir |
   | outlined period storybook | 10 | story-cartoon |
   | live-action hybrid | 10 | presenter-pop |
   | sketch line on paper | 9 | line-art |
   | cut paper and collage | 8 | editorial-paper |
   | outline-free grain flat | 7 | editorial-paper |
   | brush wash on paper | 6 | editorial-paper |
   | glow technical 3D | 6 | glow-flat |
   | geometric primitive fields | 4 | presenter-pop |
   | print, comic, halftone | 3 | story-cartoon |

## 4. What it could change in Loom (proposals, ordered by how many films need them)
**Conflicts first:** two Loom gates flag what these films do on purpose. These need a decision, not a build.
- **Double exposure at joins** (`loom/qa.py`, a warning). It exempts only `continue` joins, so it flags deliberate
  ghost holds and dissolves. Proposal: a declared `ghost` or `dissolve` join intent that the check accepts, so an
  accidental overlap still warns.
- **Empty frame** (`loom/checks/film.py`, an error). A rest beat passes only when its intent is hold, sparse or dark.
  That is already right: the storyboard must declare rest beats. No change, only guidance.

**Then, by reach:**

| # | proposal | films | kind |
|---|---|---|---|
| 1 | Accent lock: one saturated accent per frame on the named element, one colour keeps one meaning for the film, checked on frames | 96 | check + storyboard field |
| 2 | Finish strength as a film-wide setting, judged on the encoded MP4 (the near-off default from D-100 is weaker than these films) | about 60 | pack parameter |
| 3 | Outline-to-outline path morph between two SVG shapes (morph joins, hold-then-transform, morph chains) | 45 + 19 + 9 | new primitive |
| 4 | A hand prop family per pack (enter, act on an object, leave) | 39 | assets |
| 5 | Section colour script: a field colour per section or idea | 40 | storyboard and seed parameter |
| 6 | Split-screen comparison as a layout parameter | 38 | template parameter |
| 7 | Credits bar over the held last image as an end template | 84 | template variant |
| 8 | Hand-lettered and rounded display faces (licensed) | about 24 to 48 | assets, needs download approval |
| 9 | Material wipe masks (torn, scalloped, page turn) | about 21 | parameter + primitive |
| 10 | A magnifier lens, a crack or shatter builder, a cutaway mask | 3 to 24 | primitives |

**Not for Loom unless a client brings it:** live footage (10 films), true line boil, and painterly wash.

**How this sits with D-102:**
- It supports lever (b), finish, on the non-figurative path: proposals 2 and 5 to 7 are non-figurative.
- Proposal 4 (hands) is figurative and stays under the code-drawing freeze until E2 settles the designed source.

## 4b. Colour and tone
Covered in its own file: `tedEd_2026-10/colour_and_tone.md`. It holds:
- code-measured brightness, saturation, warm/cool and accent numbers per family;
- the tonal arc through a lesson: a pale open, a slightly darker middle and a lift at the close;
- Qwen's colour scripts.

## 5. Not settled
- **The two caveats above:** whether "lands on the word" holds when measured (picture-change times against Whisper
  word times, a code check run on the pod), and whether the finish is texture or compression.
- **The model's labels:** its pack mapping and some labels (`3d_render`, `world_consistency`) look like default
  values.
- **The judge:** whether the style-aware rubric in the guide lowers the 35 % false-condemnation rate. That would mean
  re-running the 493 clean windows, at pod cost, so only if wanted.
- **The second-model check:** the cross-model agreement gate was not run, because there was no second model on the
  pod.
