# Why https-private-relay is a mess (2026-10-12)

Kshitij: "the video is a mess. Were the beats not given the context of other beats in existance? Or even before and after??
Fix this. and give me a proper report of why this happened."

Short answer: each beat WAS given context about the others (the film card with every beat in one line, its own spec, the
previous and next beats' narration and element names, the kit's code). What it was not given, and what the engine could not
give it, is the one thing a continuing picture needs: control of the objects already on screen. So most beats drew those
objects again on top of themselves.

## 1. What is on screen (measured, not judged)

From the built page's element list (`qa/probe.json`), the board (the browser, the path, the watcher, the server):

| Board element | Drawn by | On screen until |
|---|---|---|
| `board` | b01 | 87.2 s (kept by every beat from b02 to b12) |
| `board_b03` | b03 | 19.2 s |
| `board` (a second one) | b04 | 30.4 s |
| `board_b06` | b06 | 45.0 s |
| `board` (a third) | b07 | 51.7 s |
| `board_b10` | b10 | 73.0 s |
| `board` (a fourth) | b11 | 80.8 s |
| `board` (a fifth) | b12 | 87.4 s |

So from b03 to b12 (15 to 87 s) there are two boards on screen most of the time, b01's and the beat's own, usually in
different states. The same for the packets (b01's, b03's, b11's held to 87.3 s, b12's own). That is the doubled text, the
piled-up tags (b02, b03, b11, b12), the cards that jump, and b12's line running into b11's packet that ended the run. Only
b02, b05, b08 and b09 held the board instead of drawing one; b08 held b01's board in a state an earlier beat left it in and
shows tiny tags on an empty field.

## 2. Why the beats did it

1. **A held element comes back without its controls.** The board is a kit part: `Loom.lesson.path_board(ctx, E.inner, opts)`
   returns a handle whose `setState(state, t)` changes it (values in the tray, the dark band, the scrambled row). Only the
   beat that drew it gets that handle. `ctx.held("board")` returns the element, not the handle (`runtime/world.js` held).
   A later beat that needs the board in a new state has no way to drive the board already on screen, so it draws another
   one, which is what 7 of the 12 board beats did.
2. **Nothing refused the second copy.** No runtime error or gate for creating an element with a name the beat holds, or
   for drawing a kit part again while the beat holds an element that already draws it. The check saw the symptoms only as
   warnings: "drawn twice on themselves" (b04), "draws again ... b11 still shows" (b12), "sparse frame" (b08), "held element
   off frame" (b09, b10, b17), elements with "no entrance" (b07's new board popping over the old). The fix rounds worked on
   the errors (24 invented words, the line into the packet) while the real mess sat in warnings.
3. **The task text invited a redraw.** The held list said "If one is not there at runtime, draw the thing yourself", and
   listed names only: no box, no state, no picture of the frame the beat continues from. Several beats wrote
   `try { held } catch { draw a new board }`.
4. **Every beat kept the whole board, and the camera pushed into it.** The storyboard kept `board` through 11 beats and
   framed close shots inside a 1680 px board (b07, b10, b11): the browser and server cards are cut by the frame edge.
   Nothing checks text cut by a camera framing.
5. **The pictures they had were not the ones they needed.** Each worker saw its own beat (snapshots) and the pilot pair's
   pictures; none was shown the previous beat's last frame, the frame it was continuing.

## 3. The fix

Engine (applied when the measured Shuttle run in flight releases the shared files; logged with tests, each shown red first):
1. **Held parts keep their controls:** a kit part's handle is stored on the element that composes it, and `ctx.held(name)`
   returns the element with `.part` (the handle), so a later beat drives the same board: `ctx.held("board").part.setState(...)`.
2. **No second copy:** runtime errors `kept_element_redrawn` (a beat creates an element with a name it holds) and
   `part_drawn_twice` (a beat draws a kit part again while it holds an element that draws it). They show in the worker's
   own snapshot, so its submit is held until it is fixed.
3. **The beat is told what is on screen when it starts:** "ON SCREEN WHEN YOUR BEAT STARTS" with each kept element's box,
   the kit part it draws and that part's states, and how to drive it; the line inviting a redraw goes. The previous beat's
   last frame (its worker's final snapshot) is attached as a picture.
4. Then the lesson's scenes are written again with these, and the film is checked, reviewed and rendered.

## 4. What this is not

- Not a model failing to read: the information each beat needed was not in its context, and the API did not allow the right
  code (driving a held part).
- Not Relay only: Shuttle's scene authors get the same task text (conductor.task_message) and the same `ctx.held`.
