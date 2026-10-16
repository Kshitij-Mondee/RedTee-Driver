# Review: office meeting room pilot (Claude Design), 2026-10-09

STATUS: REVIEWED 2026-10-09; corrected 2026-10-10 (Kshitij found two confusing points, see below).

**Verdict: none of the three sets is approved. The layout is right and the object craft is wrong.**
- **2.5D lit, attempt C:** the one to fix now. It has a matching style pack (cinematic-dawn), so a fixed set can be used
  in a lesson.
- **2.5D lit, attempt A:** dropped.
- **Painterly:** parked. Its quality verdict is "needs a revision round", but no lesson can use a painterly set yet,
  because the engine has no painterly style pack (packs/styles/: fonts, captions, overlay colours and motion for a
  painterly lesson). Fixing the room before that pack exists is effort spent ahead of need. Do it after the pack.
- **Flat editorial:** not delivered.

**Decision (2026-10-10, D-151):** Kshitij accepts the box-built furniture ("they look enough chair like in the human
eyes"). 2.5D attempt C is accepted as delivered and needs no revision; the intake notes box-built sets instead of failing
them.

**Corrections (2026-10-10):**
- The intake column below is a structural contract check (palette, layers, canvas, curves). It is not a quality
  judgement. The painterly set "passes" that check and still fails on quality.
- The painterly fix message was offered as if it were the next step. It is not; it is kept for when the painterly
  style pack exists.

## What came in

Three .zip files were placed in `C:\Users\Admin\Pictures\Assets`. Each was taken in with `tools/asset_intake.py`
(`assets/incoming/meeting-lit-a`, `meeting-lit-c`, `meeting-painterly`) and rendered from its SVG with cairosvg. The
index.html and the generator scripts in the zips were not run. Chromium may differ slightly on gradients; the structure
is the same.

| batch | from zip | style | contract check (structure only, not quality) | quality verdict |
|---|---|---|---|---|
| meeting-lit-a | Meeting room set review.zip | 2.5D lit | first PASS. Now FAIL under the new curve check: 930 straight-edged shapes, 0 curves | dropped |
| meeting-lit-c | Office meeting room setup.zip | 2.5D lit | first PASS. Now FAIL: 3,076 straight-edged shapes, 0 curves | fix now (base for one revision) |
| meeting-painterly | Office meeting room painterly.zip | painterly | PASS (621 paths, all with curves) | not approved; parked until a painterly style pack exists |

## What worked (the prompt's structure held)

- **Composition and perspective match the brief within a few pixels in all three.** The screen box, window B's edge at
  x 1307, the presenter's head in front of the green felt at (940, 262), the seated head against window B's blind at
  (1412, 439), the table's far end and the horizon line all land where specified (`overlay_and_base.jpg`). The engine
  can place characters on these sets.
- **The contract was met:**
  - exact palette;
  - far, mid and near layers, with walls drawn complete behind the furniture (the parallax view shows no holes,
    `parallax.jpg`);
  - classed light groups (without them the room still reads, `overlay_and_base.jpg` right column);
  - slots and anchors present, no text, no people.
- **The place reads as the mill:**
  - bare brick end wall;
  - 20-pane window with a deep sill and a cup on it;
  - radiator;
  - green felt;
  - brass wall light;
  - a dark screen that is the focal shape;
  - sun patches across the oak table.

## What failed

1. **The furniture was modelled from boxes, not drawn.** The 2.5D files are 930 and 3,076 straight-edged polygons with
   no curves at all. Claude Design wrote a JavaScript program that projects 3D boxes using the plan's camera. The
   result:
   - chairs are slabs: the near-left chair in attempt C is a stacked block shape that is not a real chair;
   - the cardigan in the painterly set is a flat board;
   - everything has the low-poly "generated" look Kshitij does not want (`defect_crops.jpg`).

   The precise plan and camera numbers in the prompt probably invited this method.
2. **Unexplained shapes in the painterly set:**
   - grey slabs on two chair seats;
   - a grey parallelogram on the floor at the lower right.

   Neither is an object the brief names.
3. **Large soft ellipses on the near table in both 2.5D sets** read as stains, not shadows.
4. **Brick:**
   - attempt A: faint stripes with scattered dark bricks, which reads as a striped panel;
   - painterly: horizontal brush streaks that read as planks;
   - attempt C: brick is correct.
5. **Window:**
   - attempt A: the sash grid is almost invisible behind the blind, so it reads as a blank panel;
   - attempt C: shows the 20 panes;
   - painterly: shows the 20 panes.
6. **Style quality within each style:**
   - the 2.5D light is gentle, but the value structure is weak for a "colour key" (the quality bar);
   - the painterly set is hard-edged flat vector with a few streaks: no lost edges, little brush texture.

## What changed in the engine because of this

- **Every set prompt now has a DRAWING METHOD section** (`tools/world_packs.py`, regenerated). It says:
  - draw by hand, object by object;
  - use the plan and numbers to place things, never to model them;
  - draw soft things with curves;
  - every shape belongs to a named object;
  - shadows take the shape of what casts them.

  The quality check repeats these rules.
- **The meeting chair and cardigan construction notes are exact** (`packs/worlds/office.json`): the seat pad, a shaped
  back shell with a gap, slim legs, and the view from behind; cloth in curved folds.
- **The intake refuses a set drawn only with straight-edged shapes** (`tools/asset_intake.py`, test in
  `tests/suites/world_sets.py`). Attempts A and C now fail it, the painterly set passes.

  Limit: this is a floor, not a judgement of quality. The painterly set passes it and is still not right.

## What to do next

- **2.5D (attempt C, "Office meeting room setup"):** paste the fix message below into the same Claude Design session.
  If the revision is still built from boxes, run the regenerated prompt
  (`docs/assets/world_prompts/office/lit_25d/meeting_room.md`) in a fresh session instead.
- **Painterly:** parked. No lesson can use it until the engine has a painterly style pack. Its fix message below is kept
  for then.
- **Flat editorial:** run `docs/assets/world_prompts/office/flat_editorial/meeting_room.md` (regenerated) in a fresh
  session.
- **Attempt A:** drop it; C is the better base.

### Fix message, 2.5D (attempt C)

```
Keep the camera, the composition, every position, the palette, the layers and the light setup exactly as they are.
Redraw these by hand, as an illustrator, with curved paths where the real thing is curved. Do not generate them from
projected boxes.
1. All eight chairs. A meeting chair is an upholstered seat pad 6 to 8 cm thick with a rounded front edge, and a
   separate backrest: a shaped shell, gently curved across, about 45 cm tall and 4 to 6 cm thick, with rounded top
   corners. There is a visible gap between seat and back, and four slim steel legs about 2 cm thick. From behind you
   see the curved back shell, the seat edge below it and the legs. The near-left chair must read as exactly this
   chair seen from behind.
2. The cardigan over the window-side chair: knitted cloth hanging in soft curved folds, with a sleeve and a hem.
3. The plant: a real monstera (big split leaves on long stems) in a round ceramic pot, drawn with curves.
4. The jug and tumblers: round, with elliptical rims and bases in perspective.
5. Remove the large soft oval on the near half of the table. Shadows take the shape of what casts them: chair legs and
   seat edges, the jug's round base, the laptop's edge.
6. Strengthen the value plan for the 2.5D style: the window wall brightest, the brick end wall a clear middle, the near
   chair back and the screen the darkest; the sun patches on the table warm and crisp.
Then run the quality check again and tell me what you redrew.
```

### Fix message, painterly (PARKED: use only after a painterly style pack exists)

```
Keep the camera, the composition, every position, the palette and the layers exactly as they are.
1. Remove the grey slabs on the two left chair seats and the grey shape on the floor at the lower right. Every shape
   must belong to a named object.
2. Redraw the chairs as real meeting chairs: an upholstered seat pad with a rounded front edge, a separate curved
   back shell with a gap between seat and back, and four slim legs. No slabs.
3. The cardigan: soft cloth hanging in curved folds from the chair back, with a sleeve and a hem, not a board.
4. The end wall must read as BRICK: paint the courses as broken horizontal strokes with the mortar suggested, not as
   long planks.
5. Make it gouache: lost and found edges (let the far chairs and the plant soften into the wall in places, keep crisp
   edges only around the screen and the sunlit table edge); brush-shaped contours; brush texture in lm-texture that
   follows the surfaces (brick courses, wood grain, the felt), dense in the light and sparse in shadow.
Then run the quality check again and tell me what you changed.
```

## Evidence

All images are in `docs/assets/reviews/office-meeting-pilot/`:
- the three frames: `lit_a_frame.jpg`, `lit_c_frame.jpg`, `painterly_frame.jpg`;
- the expected positions overlaid, with the no-light version beside each: `overlay_and_base.jpg`;
- layers shifted for parallax: `parallax.jpg`;
- the chair, floor and window defects: `defect_crops.jpg`.

The intake reports are `assets/incoming/<batch>/INTAKE.md`.
