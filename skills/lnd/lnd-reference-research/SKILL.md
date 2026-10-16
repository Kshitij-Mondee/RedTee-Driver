---
name: lnd-reference-research
description: Look at existing drawn work before designing anything complex or unfamiliar - search the web, studied reference channels and open-source illustration sets for flat, cartoon, isometric, line-art or explainer references, look at 3 to 6, write a reference board of what to take and what not to take, derive design rules, then build and compare side by side. Also covers which free asset sets may be used as assets (licence check) versus looked at only. Use whenever composing a complex scene, a setting, place or background, a situation with people or objects, any complex asset, character or illustration, or when visualising something you are not sure how to draw; whenever a design is coming out flat, empty or "like a first attempt"; and before drawing any place, object or scene from memory.
---

# Reference research: look at existing work before you draw

Designs drawn from memory come out like a first attempt:
- a wall and a floor line instead of a room;
- objects stuck on a wall;
- no light, no value plan, no perspective;
- one radius and one weight everywhere.

Illustrators do not work like that. They gather references, decide what to borrow, then draw their own.
This skill is that habit, made into steps you can check.

**When it fires:**
- a complex scene, setting or background;
- a situation (people doing something somewhere);
- a complex asset, character or illustration;
- anything you are not sure how to picture.

A simple chart or a text card does not need it.

## The loop (before any code or drawing)

### 1. Name what you need, precisely
Write it in one line, as a viewer would see it, not as a concept. For example: "an open-plan office seen
from the door, three desks, one person stuck at a laptop", not "workplace". Also note:
- the style family (flat 2D, cartoon, isometric, line art, 2.5D);
- the slot (full frame, or a panel beside text).

### 2. Search at least two kinds of source
| source | how | queries |
|---|---|---|
| **Web search pages** | Dribbble, Behance, ArtStation, Pinterest search pages, opened in a browser and *looked at* | "<subject> flat illustration", "<subject> isometric", "<subject> line art", "<subject> cartoon background", "<subject> explainer animation scene", "<subject> vector scene" |
| **Studied channels** | your own frame-by-frame notes of reference channels (Kurzgesagt, TED-Ed, Vox, Crayon Capital, Cleo Abram...) | find the closest scene type |
| **Open-source sets** | CC0 and MIT illustration and icon sets (below) | the same subject, as a style and detail reference, or as a usable asset |

Search for the *setting* and the *object* separately ("server room isometric", "server rack flat icon"). The
best composition and the best object drawing rarely come from the same picture.

### 3. Look at 3 to 6 references and write a board
For each reference, record its link and what to TAKE:

| aspect | what to note |
|---|---|
| composition and camera | perspective (one-point, isometric, flat elevation), horizon height, crop, where the subject sits |
| value plan | what is lightest, what is darkest, where the eye goes first |
| palette ratio | about 60 / 30 / 10; how many hues; where the one accent is |
| detail density | parts per object (desk: top, side, drawers, legs, shadow); what is left out |
| light and shadow | the source direction, contact shadows, one highlight edge, flat or graded |
| shape language | corner radius, line weight or no lines, round versus angular, the one recurring motif |
| depth | foreground, middle and background layers; overlap; scale falloff; haze |
| motion (if animated) | what moves, what holds, how the camera travels |

Then record **what NOT to take**: the drawing itself, its characters, its exact palette, anything branded.

### 4. Derive 4 to 8 rules, then build
Turn the board into rules a builder can follow, and put them at the top of the code or design file. For example:
- "one-point perspective, horizon at 42%";
- "every object has a contact shadow";
- "3 to 6 parts per object";
- "the window is the light source, top left";
- "one accent colour, on the subject only".

### 5. Compare side by side, then iterate
- Put your result next to the references: a before/after sheet, then the real render.
- Ask whether it holds up beside them. If it reads as poorer (flatter, emptier, less light), find the aspect
  that is missing and fix that.
- A person looks at the picture; a passing check is not enough.

### 6. Cite it
The design or storyboard names the board, so the next person can see where the idea came from.

## Copyright: ideas, never drawings
- **Do not trace, copy, re-colour or embed a reference picture.** Take the composition, the value plan, the
  density, the light and the shape language, and draw your own.
- **Links, not downloads.** Looking in a browser is fine. Saving reference images needs the owner's approval.
- **Never reproduce a known character, mascot, logo or a specific artwork**, however it is restyled.

## Using free asset sets AS assets (the licence check)
Some sets can be used as assets, not just looked at. **Before you use any set**, read its licence on the
creator's own page and copy the exact sentence into your sources list. Then classify it:

| class | rule | examples (verified 2026-10-02; re-check before use) |
|---|---|---|
| **Use freely** | CC0 or MIT/ISC, no paid licence, no attribution, no share-alike, no "do not redistribute" | Microsoft Fluent Emoji (MIT); Open Doodles and Open Peeps (CC0); Lukasz Adam free illustrations (CC0; not the "premium" ones); Kenney asset packs (CC0); Lucide icons (ISC) |
| **Use with credit** | CC BY, CC BY-SA (share-alike spreads to your work) | Twemoji, OpenMoji, Streamline free |
| **Look only** | the licence forbids packs or redistribution, needs a subscription, or is unclear | unDraw (no compiling into a library), Storyset and Blush (attribution or subscription), Humaaans (no formal licence), Illlustrations.co (premium mixed in) |

Downloads still need the owner's approval. Keep a licence file and a checksum with every downloaded set.

When an asset set is used, make it belong:
- map its colours to the style's palette, or keep them on purpose;
- give it the same shadow and entrance as your own elements;
- size it to the slot.

## Which tool for which job
| need | reach for |
|---|---|
| a room, street or machine room | a perspective or isometric build from the board, with layered depth |
| a system as a model | isometric; the references for server rooms and data centres are nearly all isometric |
| a named everyday thing | a free MIT/CC0 set (Fluent Emoji has about 3,000 objects), or a drawn grammar from the board |
| people | CC0 people sets (Open Peeps, Open Doodles), or a commissioned character |
| maths, graphs, proofs | Manim |
| soft light, blur, painterly texture | Skia or a WebGL effect layer |
| a 3D prop that turns | Three.js |
| a designer-made motion | Lottie, re-coloured to the palette |

## Done means
- [ ] the need is written in one line, with a style family and a slot;
- [ ] two kinds of source were searched, and 3 to 6 references were looked at;
- [ ] a board records take / do not take for each reference;
- [ ] 4 to 8 rules are written into the build;
- [ ] a side-by-side comparison was looked at by a person;
- [ ] the design cites the board;
- [ ] every asset used comes from a set whose licence was read at its source.

## Companions
- `lnd-visual-storyteller`: the visual metaphor and the shot plan.
- `lnd-visual-design`: the standard every visual passes.
- `lnd-explainer-craft`: how full the frame should be.

**In the Loom engine**, this skill is bound to:
- `docs/REFERENCE_FIRST.md` and `py tools/ref_board.py new|check` (boards and their ratchet);
- `docs/references/RESOURCES.md` (every resource);
- `assets/vendor/SOURCES.json`, `py tools/fetch_assets.py` and `py -m loom art <words>` (approved sets, used
  with `Loom.art.place`);
- the storyboard field `design.references`.
