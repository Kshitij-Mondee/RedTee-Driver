# Office sets review: the 2.5D lit batches and the story-cartoon meeting room (2026-10-13)

Kshitij's delivery: four Claude Design exports in `C:\Users\Admin\Pictures\Assets`:
- `Office illustration sets review.zip`: open_plan, desk_close and evening_floor.
- `Office interior SVG designs.zip`: one_to_one, exec_office and training_room.
- `Office environment design review.zip`: break_room, reception and corridor_lift.
- `Meeting room story cartoon.zip`: meeting_room in story_cartoon.

**Intake:** `py tools/asset_intake.py <zip> --batch office-floor | office-rooms | office-circulation | office-meeting-cartoon`.
- All 10 sets pass: exact palette, far, mid and near, frame_safe, anchor_floor_y, and the 2400 x 1350 canvas.
- The notes are curves on 12 to 22 percent of shapes (drawn, not modelled) and linear gradients, which the 2.5D style
  allows for light shafts.

**How the sets were viewed:**
- Rendered with cairosvg. No set uses a filter, mask or blend mode, so the render matches a browser.
- The frame (1920 x 1080) is outlined in red on each image in `office-sets-2026-10-13/`.
- Light groups were switched off one at a time to find where the ghosting comes from.

Judged against each set's own brief and style (D-122), never across styles.

## Verdicts

| set | verdict | notes |
|---|---|---|
| open_plan | **library** | The mill reads at once: joists, black columns, 20-pane windows, the walking line and the printer island. Room for two people on the walking line. |
| desk_close | **library** | Window light on the desk run, a radiator, a green divider. Two clear chairs for a seated person. |
| break_room | **library** | The strongest of the batch: brick, counter, coffee machine, high table and stools, an exit door with its sign and an extinguisher. |
| reception | **library** | The entrance, desk and speed gates read in the right order (door, desk, gates, then the office). The column at the left edge is heavy but outside the free zone. |
| corridor_lift | **library** | A lift, a stair door with its exit sign, a notice board and an extinguisher. Low reuse (kept for evacuation lessons, D-156). |
| exec_office | **library** | Desk, visitor chairs and a window wall. Two thin pale lines at the bottom right are light-shaft edges and only show in the overscan. |
| meeting_room (story cartoon) | **library** | Outlined, warm and readable: a brick wall, a wall screen (dark, the slot), a jug and glasses, a plant and a radiator. The first set in this style. |
| one_to_one | **held: fix below** | Light and shadow shapes in the far layer are painted over the near armchair. It reads as glass, and the side table's leg and the lamp base show through it. With the lm groups hidden, the armchair is solid (`zoom_one_to_one_no_light_groups.jpg`), so the drawing is right and the light is laid on top of it. |
| training_room | **held: fix below** | Each chair's cast shadow (lm-shadow) is drawn across the front edge of the table in front of it, as pale rectangles (`zoom_training_room_shadows.jpg`). They disappear when lm-shadow is hidden. |
| evening_floor | **held: fix below** | Two pale bands run across the whole frame at about y 250 and y 570 and haze the left half. They read as a glass wall between the camera and the floor, which the brief does not have. The distant city-light dots also sit on the felt divider and over the desks, not only in the window glass. The column in the middle is in the brief: not a defect. |

## Library

Seven sets were added, approved by "Kshitij (2026-10-13: delivered as done; agent review found no blocker)", using the
new `--only` option for the batches that hold a set:

```
py -m loom sets add office-circulation --by "..."
py -m loom sets add office-floor --only open_plan,desk_close --by "..."
py -m loom sets add office-rooms --only exec_office --by "..."
py -m loom sets add office-meeting-cartoon --by "..."
```

`py -m loom sets check`: 9 sets, 0 problems. The look is Kshitij's call (D-151). If he accepts a held set as it is,
add it the same way with `--only <scene>`.

## Fix prompts (paste into the same Claude Design project; each keeps everything else)

**one_to_one (Office interior SVG designs):**
> In the far layer, the light and shadow shapes are painted across the near armchair and the side table. The armchair
> reads as glass, and the side table's leg and the lamp's base show through it. Cut every lm-light, lm-shadow and
> lm-atmos shape to the surface it lands on: where the armchairs, the side table and the lamp stand on the floor and the
> rug, the shape stops at their outline. Light that falls on an armchair is drawn on the armchair's own shapes, in its
> hi tone. Keep everything else exactly as it is, and show the base check (light groups hidden) and the full set again.

**training_room (Office interior SVG designs):**
> The chairs' cast shadows in lm-shadow are drawn over the table tops in front of them, as pale rectangles across each
> table's front edge. A chair's shadow falls on the floor, away from the window, and never on a nearer table. Cut every
> shadow shape to the floor it lands on, stopping at the outline of any table or chair that stands on it. Keep
> everything else exactly as it is.

**evening_floor (Office illustration sets review):**
> Two pale horizontal bands run across the whole frame (about y 250 and y 570 in the visible frame) and haze the left
> half: they read as a glass wall between the camera and the floor. The brief has none; the camera stands on the open
> floor. Remove them and the haze they bring. The small dots for distant city lights appear on the felt divider and over
> the desks: keep them only inside the window glass. Keep everything else exactly as it is.

## What changed in the prompts

The defect in the first two held sets is one class: a light or shadow shape painted across an object that stands on the
lit surface. The set contract (`tools/world_packs.py`, LIGHTS AND LIT THINGS) now says so for every future prompt.

The intake cannot see this yet; it is checked by eye at review (unverified by any tool). A measurement was tried and
does not catch it: base shapes of solid materials at under 0.9 opacity number 0 to 4 per set, mostly paper. The ghost
comes from the classed light groups, not from the base shapes.
