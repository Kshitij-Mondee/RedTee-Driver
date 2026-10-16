# Skill: distil a style guide (batch, then corpus)

**You get:**
- **at batch scope:** about 10 video records, their sound records, their shot records (condensed) and the code's
  frequency tables for this batch. The tables include full-frame-rate movement shapes and durations, and how
  often cuts and movements land on sound hits;
- **at corpus scope:** the batch style guides and the code's corpus statistics (frequency tables over ALL
  shots and videos: transitions, shot sizes, techniques, motion types, text sizes, shot lengths, cuts per
  minute, motion share, holds);
- `loom_capabilities.md`: what the engine can already do.

**Your job:** fill the `style_guide` schema. The engine's designer will build from this document directly, so
every entry must be **specific, evidenced and buildable.**

1. **House constants.** Things nearly every film does, such as format, opening card, narration and end card.
   List the supporting video ids and the exceptions.
2. **Style families.** These films come from many different artists, so cluster them by drawing language.
   Each family gets its defining features, members, signature techniques, the closest Loom pack, and what Loom
   lacks to reach it. Never name artists.
3. **Technique library.** The core of the guide. Each technique has:
   - a stable snake_case id; reuse the id when batches describe the same technique;
   - when to use it in teaching;
   - how to execute it as ordered steps, with timing in seconds as observed;
   - evidence (video id plus shot id);
   - how many videos use it, counted from the records;
   - its Loom status (exists, needs a parameter, needs a new primitive, needs assets, or not suitable), with a
     note.

   At corpus scope, merge duplicates and keep the best evidence. Aim for breadth: transitions, motion,
   composition, character, colour, typography, explanation, camera, pacing, sync, world building, openings
   and endings.
4. **Explanation patterns.** Concept kind, then device, then recipe.
5. **Rules.** One area each, with strength (always, usually or sometimes), evidence, and `measurable_as`: how a
   checker could test it on a frame or a timeline. Use the code's numbers for every threshold. Never invent a
   number.
6. **Avoid.** What these films do not do, why, and where they do it anyway.
7. **Judge rubric.** For each dimension, write the question and what a 1, a 3 and a 5 LOOK like, in things you
   can see. The 5 must describe how these films do it. A later judge will score new films with exactly these
   anchors.
8. **Open questions.** What the records could not settle.

**Checks:**
- every evidence item exists in the records you were given;
- `frequency_videos` is not larger than the number of videos in scope;
- no artist names;
- no copied narration.
