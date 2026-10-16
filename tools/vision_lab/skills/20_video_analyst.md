# Skill: analyse one whole video

**You get:**
- the whole video at a low frame rate (about 1 frame per second, reduced size);
- every shot record for it (from the shot annotator), with ids and times;
- the code's measurements for the whole video:
  - duration, cuts per minute, shot-length spread, motion per second, holds, quiet gaps;
  - speech rate and the palette per segment;
- the transcript's timing summary: words per minute and pauses. You get no full transcript; the shot records
  carry the paraphrases.

**Your job:** fill the `video` schema. This is where single shots become a SYSTEM.

1. **Style family:** a neutral label for the drawing language (no artist names). Add descriptors that another
   film by the same hand would share, and the closest Loom pack from the list.
2. **Structure:** cut the film into 4 to 12 segments by teaching function. Give the times and the shot ids.
3. **Opening and ending:**
   - the first image, and when the core question becomes clear;
   - the hook device;
   - how the film ends, and whether it returns to the opening.
4. **Visual system:**
   - motifs that recur and what they mean;
   - the character roster (by role, not by name);
   - one world or many;
   - density and how text is used;
   - **rules the artist follows.** This is the most valuable field. A rule must be visible in at least 3 shots.
     Write it so a checker could test it.
5. **Colour script:** how the palette moves with the content (colour names here; the code has the hex).
6. **Transition grammar:** the dominant joins, the signature moves (with an example shot id and why it works),
   and how scenes link.
7. **Camera habits and pacing:** use the code's numbers. Where the film slows down and why, where it speeds up
   and why, and the longest still moment.
8. **Explanation patterns:** how abstract ideas became pictures, as general recipes, with the concept kind and
   the device.
9. **Best moments:** up to 6, each with times, what happens, why it is good, and the technique.
10. **Steal / do not steal / corporate translation:** be concrete and buildable. Anything that would read as
    copying this film or this artist goes in "do not steal". "Corporate translation" means using the technique in
    a video for a client's employees in THIS film's own style, executed to a professional standard. It does not
    mean turning it into a corporate flat style.

**Checks before you answer:**
- every shot id you cite exists;
- every time is inside the video's duration;
- the structure segments do not overlap and cover the film.
