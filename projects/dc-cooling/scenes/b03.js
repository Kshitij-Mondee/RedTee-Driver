// @design route_promise: a faint dashed route drawn left to right across a real place; the two ends are named, the middle stays unlit and unlabelled
/* b03 - "You can follow it, from one chip to the outside."   Station: route (the heat path map, kit heat_route).
 *
 * Look first: corporate-clean guide R1 (a process as a route across a real place, one accent owner at a time) and the
 * TED-Ed data-centre film (one map that the film keeps adding to). Rules taken: the route is dashed because it is
 * "expected, not yet" (guide s4); it is wiped in with a clip over the whole map (the kit's wipeFaint, so the dashes
 * stay dashed); the accent is on the route only while it draws, then it goes back to the line token; no text but the two
 * labels the narration names (Chip, Outside).
 *
 * Three treatments considered (animation gate: motion only where the taught thing changes over time):
 *   A. A template card "chip -> outside" with an arrow. Rejected: it would lose the map the close (b30 to b32) returns to.
 *   B. The map built stage by stage, every middle stage labelled. Rejected: that is the close, and the narration here
 *      names only the two ends; labelling the middle now would spend the payoff early.
 *   C. CHOSEN: the whole map is there, pale, and the dashed route DRAWS across it left to right on "follow it" (the
 *      change over time is the promise); the chip and the outside settle at the two ends on their own words, the camera
 *      eases right as the route reaches the outside. Everything else holds still.
 *
 * Beat sheet (words from the task's phrase timings):
 *   "You can follow it"      the dashed route wipes in left to right over 1.2 s (accent while it draws)
 *   "from one chip"          the chip settles at the left end, then its label Chip
 *   "to the outside"         the building edge and outdoor unit settle at the right end, then Outside; the camera eases
 *                            right inside the place, 90 px (Loom.cam.frame on the route element)
 */
Loom.scene("b03", {
  build(ctx) {
    const { m } = ctx;

    // the map is the kit part at its natural size (1720 x 760), placed at (100, 120) INSIDE a full-frame element, because
    // Loom.cam.frame moves the element's mover and assumes the element sits at the frame origin
    const E = ctx.el("route", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    const route = Loom.lesson.heat_route(ctx, E.inner, { x: 100, y: 120, hide: ["chip", "outside", "server"] });
    E.kit = route;

    const tFollow = ctx.cue("You can follow it");
    const tChip = ctx.cue("from one chip");
    const tChipWord = ctx.cue("chip");
    const tOut = ctx.cue("to the outside");
    const tOutWord = ctx.cue("outside");

    // the place is there from the first frame (a still map, then the route draws over it)
    m.reveal(E, ctx.start + 0.05, { dy: 0, dur: Loom.style.dur("exit") });

    // the promise: the dashed route wipes in left to right; the dashes lean to the accent while they draw
    const tDone = route.wipeFaint(tFollow, { dur: 1.2 });
    route.faintAccent(1, tFollow, 0.3);
    route.faintAccent(0, tDone - 0.2, 0.6);

    // the two ends, each on its own words: the object settles from below, its label follows
    route.reveal("chip", tChip, { dy: 24 });
    route.showLabel("chip", tChipWord + 0.1);
    route.reveal("outside", tOut, { dy: 24 });
    route.showLabel("outside", tOutWord + 0.05);

    // the camera eases right inside the place as the route reaches the outside (a pure pan, scale 1). The storyboard asks
    // for 140 px; 90 px keeps the dashed stub at the map's left end (it starts 6 px inside the map) inside the frame
    Loom.cam.frame(E, "all", tOut, 1.4, { margin: 0, cx: 870 });
  },
});
