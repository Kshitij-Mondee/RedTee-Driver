# Skill: annotate one shot

**You get:**
- the shot clip, sampled at the frame rate set in the call;
- three still frames at full resolution (start, middle, end of the shot);
- the shot's MEASURED facts: start, end, length, motion per second, the longest still stretch, palette hex with
  shares, how the shot joins the last one (a sub-shot split is NOT a join; a "gradual" join with no colour change is
  likely the same picture continuing), and the real movements with ids (m1, m2, ...). Texture (boil, jitter) is
  named and left out of the movements: it is not an event;
- the words spoken during the shot, with times relative to the shot start;
- the previous shot's one-line summary, so you can describe the join.

**Your job:** fill the `shot` schema. Work in this order and look again at the frames for each part:

1. **The join** (`transition_in`). How did we get here from the previous picture?
   - Look at the first frames of the clip.
   - A shape that grows into the new scene is a morph or an `object_transform`.
   - The camera moving through something is `zoom_through`.
   - An instant change is a `hard_cut`.
   - Say what carries over: a colour, a line, a character.
2. **The frame** at the middle still:
   - setting, subject, shot size and composition;
   - the subject's box as fractions of the frame;
   - how many depth planes, how many nameable elements, how much empty space;
   - what makes the eye land where it lands.
3. **The look** (`style`): technique, outline, shading, texture, background, palette mood, accent use, detail
   level. In `notes`, write what a designer needs to reproduce the LANGUAGE: shape vocabulary (round or angular),
   corner radius feel, line weight relative to the frame, how shadows and light are drawn.
4. **Characters:** proportions (for example, the head about a third of the body height), eyes (dots, ovals, none),
   mouth, hands. How emotion reads and how much they move.
5. **Text on screen:** for each block, its kind, its word count (never the words), its cap height as a fraction
   of the frame height, its position, how it enters and how long it stays.
6. **Motion events,** in order: when (seconds from the shot start), how long, the type, what moves, the easing
   feel, and the motion's job. For each event say where it comes from: `source: "code"` with `code_event` set to the
   measured id when it is one of the listed movements (describe WHAT moved; the time is the code's), or
   `source: "seen"` when you see it in the clip and no id matches. Never write an event for a time where you see
   nothing, and never turn texture into an event. If a measured movement is invisible to you, leave it out:
   - `content`: the motion IS the idea;
   - `staging`: it is just arrival;
   - `ambient`: life;
   - `emphasis`: pointing;
   - `transition`: getting to the next shot.

   Include small secondary motion (blinks, sways, floating particles) as `ambient`.
7. **Camera:** move, speed, and why it moves.
8. **Narration link:**
   - paraphrase what is said in 20 words or fewer;
   - how the picture relates to the words;
   - whether the key visual change lands before, on, or after the key word, and by about how much, ONLY as you see it
     (code measures the timing too; 0 is a claim that it coincides, not a default);
   - the word it lands on (4 words at most).
9. **Teaching:** the shot's function, and what the viewer understands because of the PICTURE.
10. **Visual idea:** the general device in one sentence.
11. **Craft:** up to 5 specific, transferable techniques. Each one is observable and buildable, for example:
    "a new element arrives only when it is named, 0.2 to 0.4 s before the word".
12. **Flaws:** what does not work, if you see it. Professional films still have weak moments (a muddy frame, a label
    too small to read, a crop that cuts a word); list them plainly. An empty list means you looked and found none.
13. **loom_map:** the nearest Loom terms (see `loom_capabilities.md`).
14. **confidence:** be honest.

**Checks before you answer:**
- the motion event times are inside 0 and the shot length;
- the subject box is inside 0..1;
- no sentence of the narration is copied;
- no on-screen text is copied.
