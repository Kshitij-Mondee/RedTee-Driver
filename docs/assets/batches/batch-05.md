# Batch 05: Family L, hologram hero models (T-137 laptop, T-138 GPU, T-146 building)

Made in a Claude Code on the web session on 2026-10-16. Inputs:
- the hand-off sheet (`docs/assets/HANDOFF_TEMPLATE_LIBRARY.md`, sections 0 to 6 and Family L);
- the cloud route (`docs/assets/HANDOFF_CLOUD_START.md`): batch 05 is "T-137 laptop, T-138 GPU, T-146 building".

Family L's work goes only into new files in `assets/models3d/` (section 0), proved with `python3 -m loom models sheet <id>`.
The sheets that tool writes (`docs/assets/models3d/<id>__<style>.jpg`) are committed with them. Nothing else changed.

| id | file | what it is | parts | keys |
|---|---|---|---|---|
| T-137 | `holo_laptop.js` | a generic 14-inch class laptop: bottom case (a tray on rubber feet, exhaust slots, screws, intake under it), the keyboard deck with its well and speaker slots, a full key layout (function row, five rows on a 15-unit grid, inverted-T arrows), a glass trackpad, the hinge barrel, the lid with bezel, display glass and camera, and an I/O module of five sockets on the left side | base, keyboard_deck, keys, trackpad, hinge, lid, screen, ports | lid, explode, turn |
| T-138 | `holo_gpu.js` | a generic dual-slot, triple-fan graphics card standing on its edge connector: the shroud with three fan openings and ribs, three fans of eleven swept, pitched blades in their rims, three fin stacks with four heat pipes bending over the top edge, the board (gold fingers with the key notch, the GPU package, eight memory chips, power stages), two 8-pin power connectors, the I/O bracket with four display outputs and vent slots, and a backplate | shroud, fans, heatsink, pcb, power, bracket, backplate | spin, explode, turn |
| T-146 | `holo_building.js` | a generic ten-storey office over a double-height lobby: the core with its lift overrun, ten floors (each a named part, `floor1` to `floor10`), perimeter columns, a curtain wall on the long sides and solid end walls with a glazed stair strip (each side a named part), a colonnade lobby with canopy and revolving-door drum, and the roof plant (parapet, louvred screen, two cooling towers, two air-handling units, ducts) | core, floors, structure, facade, lobby, roof_plant (and floor1..floor10, facade_front, facade_back, facade_left, facade_right) | explode, turn (opts.plates) |

Each model's card (its first line) carries the library's fields (id, pack, what, parts, keys, best_for, not_for, size, sheet)
and two more for authors: `explode` (each part's offset, so an exploded view is a known move) and `hero` (the
`H.hero3d` settings I found read best in the hologram, with the reason).

## Gate results

`python3 -m loom models check` (the library gate: cards, determinism, token colours, no words, no dashes), after the
last change to each file:

```
models: 51 checked, 0 errors, 0 warnings
```

`python3 -m loom models sheet <id> --style <style>`, final runs after the last change to each file:

```
models: holo_laptop [corporate-clean] -> docs/assets/models3d/holo_laptop__corporate-clean.jpg
models: holo_laptop [hologram] -> docs/assets/models3d/holo_laptop__hologram.jpg
models: holo_laptop [dark-technical] -> docs/assets/models3d/holo_laptop__dark-technical.jpg
models: holo_gpu [corporate-clean] -> docs/assets/models3d/holo_gpu__corporate-clean.jpg
models: holo_gpu [hologram] -> docs/assets/models3d/holo_gpu__hologram.jpg
models: holo_gpu [dark-technical] -> docs/assets/models3d/holo_gpu__dark-technical.jpg
models: holo_building [corporate-clean] -> docs/assets/models3d/holo_building__corporate-clean.jpg
models: holo_building [hologram] -> docs/assets/models3d/holo_building__hologram.jpg
models: holo_building [dark-technical] -> docs/assets/models3d/holo_building__dark-technical.jpg
```

## The hologram route (proved outside the sheet)

`models sheet` renders a lit studio turntable (the `model_turntable` preset), not the hologram. So each model was also
rendered as the hologram engine shows it, through the `holo_hero` preset (`three_bridge.hero`, the same renderer
`H.hero3d` uses), with the fixtures Family L asks for: scanned in from the pad, a turntable through three angles, one
part hot, then exploded. Stills at 1.2, 3.0, 4.6, 6.3, 7.6 and 8.8 s, each about 7 s to render. Then each model went
through the engine itself: a scratch lab scene per model (`python3 -m loom lab --file ... --style hologram`) with
`H.stage`, `H.hero3d`, a title and an `H.reading` whose leader goes to a part's anchor:

```
lab: holo_gpu_lab [hologram] 2 frames, 0 problem(s)
lab: holo_laptop_lab [hologram] 2 frames, 0 problem(s)
lab: holo_building_lab [hologram] 2 frames, 0 problem(s)
```

Every part exports its screen box (anchors), so locks and readings can point at it: for example the GPU's `power` at
[701, 208, 128, 51] and the laptop's `ports` at [208, 546, 122, 108] in a 1080 x 820 clip. The scratch scenes and the
hologram strips are not committed (only `assets/models3d/` is Family L's to write).

## What I looked at

Every frame of the nine sheets, and every hologram still at full size (1000 x 880), with crops of the exploded and
face-on views. I checked:
- silhouette and proportion at a glance;
- CAD-like detail where the real object has it, and quiet large faces (no grids, no moire);
- parts physically connected, each explode moving along an axis that makes sense;
- front, middle and back depth in the fog;
- nothing washed to a white sheet by the hologram's additive light;
- no marks, logos or words.

Fixed after looking:
- **all three: built at their real size, drawn at a display scale.** At real metres the laptop was a small object on
  a large pad (the hologram's pad and framing are sized for models about a unit or more). The geometry stays in real
  metres; the laptop and the GPU are shown at 5x, the building at 1:20, and the card's `size` is the shown size;
- **laptop:**
  - face-on, the deck washed white. The bottom case was a solid slab under the deck and the keys, and additive light
    stacked through all three. It is now an open tray (a floor and walls), as a real bottom case is;
  - the explode sank the base into the pad. The base now stays as the floor of the view and the layers rise off it;
  - the hinge axis sat inside the keys, so the closed lid passed through them. It sits just above the deck;
  - the display glass was a thin box (four faces of light). It is one plane;
  - the pad's beam washes a flat object, so the card's `hero` asks for a smaller pad and a low beam (`padR` 1.08,
    `beam` 0.35);
- **GPU:**
  - the fin stacks and heat pipes passed through the shroud. The stack-up is now fins, then fans, then the shroud;
  - the shroud's top rail is open between its ends, so the heat pipes show bending over the fins, as on real cards;
  - exploded, the fans read as loose blades. Each fan has its rim and band;
- **building:**
  - ten full floor plates, seen edge-on through glass, washed the hologram white. A floor is now its slab edge and
    the band round the core, and the full plate is an option (`opts.plates`, on by default for the lit styles, off in
    the card's `hero`);
  - the curtain-wall mullions (3 m) and the plant screen's louvres (0.6 m) merged into bright sheets at an angle. They
    are 4 m and 1 m apart, and shallower;
  - the exploded floors were too close to read, and the risen roof plant left the frame. They spread further, and the
    card's `hero` uses zoom 0.66;
  - I tried a see-through sheet for each floor so a hot floor fills with light: it washed the whole building, so it
    was reverted (decision 6).

## Decisions (made without asking, as the brief says)

1. **WebGL heroes, not SVG `H.object` models.** Family L's block describes `H.object`'s built-ins, which live inside
   `runtime/engines/hologram.js`. Section 0 says Family L writes new files in `assets/models3d/` only, following the
   contract of the models there, and the hologram engine's own doc (hologram v2) says complex objects should be WebGL
   heroes (`H.hero3d`). So the three are library models; the `holo_hero` preset turns any of them into projected light,
   and their parts are `part(id, t)` lock targets and `anchor(id, t)` leader ends, as `H.object`'s are. Nothing in
   the engine was changed.
2. **Real dimensions, generic shapes.** From the public dimensions of each class, not one product:
   - laptop: 312 x 221 mm, 10.5 mm base, 16:10 display;
   - GPU: 305 mm cooler on a 270 mm board, 126 mm tall over the fingers, 50 mm thick, 90 mm fans;
   - building: 40 x 28 m plate, 3.8 m floor to floor, 12 x 8 m core, 8 m column grid.
3. **Ids and packs.** Ids as the table names them (`holo_laptop`, `holo_gpu`, `holo_building`). Packs from the
   library's list: devices, ai_ml, workplace. Each card's `best_for` names its lessons (endpoint security, AI compute,
   facilities and workplace security, as the table says), and `not_for` points to the library's other laptop, GPU server
   and building models.
4. **An `explode` key on each model**, rather than leaving it to the preset's explode vectors alone. A key lets the
   building spread floor by floor and the facade open on four sides; the card also lists the offsets for a scene that
   drives the preset's explode instead.
5. **No words, no marks.** Sockets are generic outlines, and the cards name them by shape (no standard's or maker's
   name). The building has no signs.
6. **A hot floor in the hologram is its bright rim.** Filling it with light needs a plate, and plates wash the
   hologram. The card says to pair it with a lock or a reading on the floor's anchor, which the lab proved.
7. **Sheets in three styles:** corporate-clean (the tool's default), hologram (these models' style) and dark-technical.
8. **Branch.** This batch is on `assets/batch-05`, branched from batch 04's head, and pushed there and to the session's
   branch, as before. No pull request, no merge.

## Left open

1. **The studio sheet does not show the hologram.** `models sheet` is a lit turntable; the hologram strips (scan, three
   angles, hot part, exploded) were rendered and looked at but not committed, as Family L writes only to
   `assets/models3d/`. I can add them wherever Kshitij wants hologram sheets kept.
2. **A reading's leader goes to where a part was when it was sampled.** Sample `anchor(id, t)` after an explode (or
   stop the turntable first), as the engine doc already says.
3. **Render cost.** A hologram hero is a WebGL clip: about 0.2 s a frame in software GL, cached in the clip store after
   its first render.
4. **Not in this batch:** Family L's P2 and P3 models (T-139 to T-145, T-147, T-148), and the drawn art (A-18, A-19),
   by the cloud plan's order.
