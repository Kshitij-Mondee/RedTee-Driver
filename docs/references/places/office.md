# Reference board: office interior (for `Loom.place.office`, D-87)

STATUS: USED 2026-10-01. Built from: `runtime/places.js` (`P.office`). Before/after: `office_before_after.jpg`
(preview).

## What was searched
- Web: "flat office illustration", "cartoon office space illustration vector", "server room illustration"
  (Dribbble search pages, looked at in the browser on 2026-10-01; nothing downloaded).
- Our studies: the Kurzgesagt and TED-Ed interiors in `docs/research/kurz/` and `docs/research/teded/`, for the
  value plan on dark grounds.

## References
1. **"Cartoon office space illustration in vector style"** by Beehaya on Dribbble:
   <https://dribbble.com/shots/26774658-Cartoon-office-space-illustration-in-vector-style>
   - Take:
     - a one-point perspective room (back wall, two side walls, a tiled ceiling and the floor all recede to one
       point), so the room has depth before anything is in it;
     - furniture in 3/4, showing front, top and one side; desks with drawer pedestals and handles; task chairs
       with seat, back, lift and a five-star base on casters;
     - a tall bookshelf of binders of different heights and colours, with a plant on one shelf;
     - a wall clock in the open wall;
     - a window on the side wall that throws light shapes on the floor;
     - soft contact shadows under everything;
     - a limited palette: wall tints, warm wood, dark chairs and screens, one terracotta accent.
   - Do not take: its exact layout, its colours (the style pack decides colour), its drawings.
2. **Dribbble search, "flat office illustration"** (<https://dribbble.com/search/flat-office-illustration>):
   - Isometric desk vignettes and flat office rooms dominate.
   - Take: objects grouped on a desk to tell what the work is (screen, papers, keyboard). A person always sits or
     stands at the desk, never floats.
3. **Dribbble search, "server room illustration"** (<https://dribbble.com/search/server-room-illustration>): for
   the server place, later.
   - Take: rows of racks in isometric, colour-coded cable runs, LEDs as the life of the scene.

## Design rules derived (in the code header)
1. A room is a perspective box first; objects go into it, not onto a wall plane.
2. Every box (desk, cabinet, shelf) shows its front, its top when it is below the eye line, and its side facing
   away from the vanishing point.
3. Values: the side walls are darker than the back wall, the ceiling is lighter, wood is mid and warm, and chairs
   and screens are dark.
4. There is one light (the window), with pale light shapes on the floor and the back wall.
5. Each object has 3 to 6 parts: drawers with handles, binders of mixed heights, a chair with casters.
6. There are soft contact shadows under everything that stands.
7. Composition:
   - the tall element anchors the wall on the window side;
   - the open wall holds the clock and calendar;
   - a smaller second desk recedes and the hero desk comes forward;
   - a dark plant in the near layer frames the shot.

## What it still lacks (honest)
- The reference has more colour range and lighter walls. Our walls follow the pack (dark in flat-cosmos and
  glow-flat), which is right for the style but reads heavier.
- There is no cable, lamp or bin yet, and the chairs are simpler than the reference's.
