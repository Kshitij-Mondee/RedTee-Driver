# Reference first: look at existing work before drawing anything (D-87)

STATUS: ACTIVE 2026-10-01. Kshitij's direction, and the rule for every scene, place, object, template, blueprint
and asset the engine draws from now on:

> For any scene, background or asset you compose, direct, plan or design, first search for graphic, cartoon,
> drawn, line-art or similar references that already exist. Always take a design and composing idea from
> existing work, then make it. Use more of the available tooling and open-source work to design better.

**Why:** the first places (D-84) were designed from memory. They read as "a child drew it for the first time":
- a flat wall and a floor line, with no room;
- objects stuck on the wall;
- no light, no value plan, no perspective.

The office rebuilt from a single reference board (D-87) shows what looking first buys:
`docs/references/places/office_before_after.jpg`.

**The skill:** `lnd-reference-research` (`skills/lnd/lnd-reference-research/SKILL.md`, and the account copy)
carries this loop to any agent; it fires for complex scenes, settings, situations, assets and anything unsure how
to picture. Every resource is indexed in `docs/references/RESOURCES.md` (D-88).

## The loop (every time, before any code)
1. **Search.** Use at least two kinds of source:
   - **Web:** search for "<subject> flat illustration", "<subject> isometric illustration", "<subject> line art",
     "<subject> cartoon background", "<subject> explainer animation scene". Dribbble, Behance and ArtStation
     search pages are good for looking. Open them in the browser and look; do not download.
   - **Our own studies:** the reference channels already measured frame by frame (`docs/research/`: Kurzgesagt,
     TED-Ed, Crayon Capital, Cleo Abram, Lucas's Lab), and their contact sheets.
   - **Open-source libraries:** the CC0 and MIT sets in `docs/references/SOURCES.md`, as references and (once
     downloaded with approval) as assets.
2. **Look at 3 to 6 references and write a board** with `py tools/ref_board.py new <area>/<topic>`, which writes
   `docs/references/<area>/<topic>.md`. For each reference, record the link, then what to TAKE:
   - composition and camera (perspective, horizon, framing);
   - the value plan (what is light, what is dark);
   - the palette ratio;
   - detail density (parts per object);
   - light and shadow;
   - shape language;
   - how it moves, if it is animated.

   Also record what NOT to take.
3. **Derive 4 to 8 design rules** from the board, and write them at the top of the code that draws it. The
   office's rules are in the header of `P.office` in `runtime/places.js`.
4. **Build, then compare side by side** with the board: a before/after sheet, then the Chrome strip. A person
   looks. If it does not hold up next to the references, iterate.
5. **Cite it.** The storyboard scene's `design.references` names the board, URLs or study frames. The storyboard
   gate notes drawn beats with no reference (a suggestion that names the beats, like the other story notes).
   `py tools/ref_board.py check` lists the places and objects the runtime draws that have no board yet; it fails
   only if that number grows.

## Copyright and downloads (unchanged rules)
- **References give ideas, never drawings.** Do not trace, copy, re-colour or embed a reference. Take the
  composition, the value plan, the detail density and the light, and draw your own.
- **Links only.** Reference images are not saved into the engine without Kshitij's approval (downloads need his
  approval). Looking in the browser is fine.
- **Assets are another matter.** CC0 and MIT assets may be used as assets after approval and intake; their
  licences go into `docs/STACK.md`. Attribution-only or share-alike sets (CC BY, CC BY-SA, OpenMoji, Twemoji,
  Storyset) need their credit carried; unDraw's licence forbids packing its art into a library, so it is a
  reference only.

## Which tool for which job (use more of what exists)
| need | reach for |
|---|---|
| a room, a street, a machine room | `Loom.place.*` rebuilt from a board (perspective room, 3/4 furniture, light), or the depth stage |
| a system as a model | the iso kit (`ctx.iso`); the references for server rooms and data centres are nearly all isometric |
| a named thing (document, phone, heart...) | `Loom.obj` grammars, or an open-source set after approval |
| people | rigs; Maya v2 from Claude Design; Open Peeps (CC0, already bundled); Humaaans (free) after approval |
| maths, graphs, geometric proof | Manim (`kind: manim`) |
| soft light, blur, painterly texture | Skia clips (`kind: skia`) or the WebGL fx layer |
| a 3D prop that turns | Three.js clips (`kind: three`) |
| a designer-made motion | Lottie (`ctx.lottie`), re-coloured to tokens |
| a bespoke hero set or character | Claude Design (Prompt R in `docs/ASSET_WISHLIST.md`), reviewed with `tools/rig_review.py` |
