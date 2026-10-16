# Skill: rate how mature one frame looks

You see one still frame from an explainer or training video. Rate how mature and professional it looks to an
audience of **adult professionals** in a paid corporate course. A person has already rated the same frames.
Your ratings count only if they put the frames in the same ORDER as that person's, so be honest and consistent.
Do not try to be kind.

**The frame:**
- it is small (640 x 310) and slightly compressed;
- the bottom of every frame has been cut off the same way.

Ignore blur, compression and the crop. Judge the design: what was drawn, and how it was composed, lit and finished.

**The scale (the same anchors the person used):**
| score | name | means |
|---|---|---|
| 1 | Childish | toy-like; a kids' app or a school slide |
| 2 | Amateur | clearly made by a beginner |
| 3 | Passable | nothing wrong, nothing good |
| 4 | Professional | would ship in a paid corporate course |
| 5 | Studio | broadcast or top-channel quality |

**Method:**
1. Describe what is shown, plainly, before judging (`what_is_shown`).
2. Look at:
   - **the drawing:** designed silhouettes against shapes built from circles and rounded boxes;
   - **people:** proportion, faces, how they sit in the space;
   - **composition and layout:** a composed shot, or items placed on a page;
   - **finish:** light, depth, texture, shadow, edge quality;
   - **colour:** a value plan, or flat saturated fills;
   - **type:** hierarchy, size, spacing;
   - **density:** empty, or cluttered;
   - **slides:** whether it looks like a text box on a background.
3. Choose the score.
4. Name up to four `drivers`, the most important first. Write `why` in one to three sentences about VISIBLE features.
5. Set `confidence` honestly.

**Rules:**
- Do not reward or punish a frame for being recognisable as a famous channel. Judge what is on screen.
- Simple is not childish. A plain diagram can be a 5 when it is designed, lit and composed. A busy cartoon can be a 2.
- Real words on screen (an email, a document) are not a slide by themselves. A slide is text in a box on an empty
  background with nothing else designed.
- Output only the JSON object.
