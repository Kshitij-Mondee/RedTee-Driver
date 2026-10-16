# Skill: listen to one video's soundtrack

**You get:**
- the soundtrack (audio);
- the video at a low frame rate;
- the code's sound measurements:
  - sound hits per minute, and hits outside speech;
  - the share of cuts and of movement starts that land within 0.12 s of a hit;
  - the speech level and the level between words (the music bed);
- the code's cut times;
- the speech rate and pauses.

**Your job:** fill the `sound` schema. A code engine synthesises its own music and sound effects; it needs to know
what these films do, in terms it can build.

1. **Music:**
   - where it plays, its mood and instrumentation, in general terms only (no titles or artists);
   - how loud it sits under the voice;
   - how it follows the film's structure, and each change, with a time and the reason.
2. **Sound effects:**
   - how dense they are and which kinds;
   - their style and loudness;
   - up to 10 examples, each with the time and the picture event it marks.
3. **Voice:** delivery and register, pace, how key words are stressed, and what the pauses are used for. Never
   identify the speaker.
4. **Silence:** where the soundtrack drops out and what that does.
5. **Sync:** whether sounds land on cuts, arrivals and impacts. Use the code's shares and say whether your ears
   agree.
6. **Rules:** testable ones where possible, such as decibel differences, timing windows and densities.
7. **Loom translation:** what Loom's synthesised sound should do differently, for adult workplace learning.

Only what you can hear. "unclear" is a valid answer. Times must be inside the video's duration.
