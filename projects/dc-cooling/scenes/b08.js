// @design held_floor_plan: a room built from above, structure first, then the direction each row faces stamped on its front edge
/* b08 (station floor_plan, chapter cut): "Now a room, from above. Every row faces the same way."
 *
 * Three treatments considered (animation gate: motion only where the taught thing changes over time):
 *   A. Whole plan fades in as one picture, arrows already on it. Fast, but a plan that is simply "there" tells the
 *      viewer nothing about how it is made, and the arrows (the one thing this beat teaches) get no moment.
 *   B. Plan built in reading order: floor, walls DRAW round the room, cooling units and rows settle bottom to top on
 *      "from above"; then the arrows stamp row by row on "faces the same way", one tag names the rule. Structure
 *      first, content last (lnd-motion-fit s9); the only accent in the frame arrives last, on the spoken word.
 *   C. Camera starts high above and pushes down onto the plan. A move for its own sake: the station already IS the
 *      overhead view, and the next beats need the frame still.
 *   B wins. Motion here is staging only (motion_is: staging): nothing in this beat changes over time as a fact.
 *
 * Held to b09 to b11 (storyboard keep): floor_plan (the kit part, E.kit is its handle), rows, front_arrows. The kit
 * draws rows and arrows INSIDE its own plan group, so `rows` and `front_arrows` are the named boxes that hug them
 * (no drawing of their own, revealed with the kit's pieces); they exist so the storyboard's `keep` can claim them.
 * The plan sits at frame (210, 107): rows 1 and 2 and the aisle between them fall inside x 640..1280, y 520..880
 * (the aisle_3d portal b12 zooms into).
 */
Loom.scene("b08", {
  build(ctx) {
    const { kit, m } = ctx;
    const T = Loom.treat;
    const OX = 210, OY = 107;                       // the plan's frame position (kit_api.md: b12 zoom lands on it)

    // ---- times, all from the narration
    const tRoom = ctx.cue("Now a room");
    const tAbove = ctx.cue("from above");
    const tEvery = ctx.cue("Every row");
    const tFaces = ctx.cue("faces the same way");

    // ---- the plan (kit floor_plan, state same_way): drawn hidden, brought in piece by piece
    const E = ctx.el("floor_plan", { x: OX, y: OY, w: 1500, h: 800, kind: "scenery" });
    const plan = Loom.lesson.floor_plan(ctx, E.inner, {
      state: "same_way",
      hide: ["units", "row_1", "row_2", "row_3", "row_4", "arrow_1", "arrow_2", "arrow_3", "arrow_4"],
    });
    E.kit = plan;
    m.reveal(E, ctx.start + 0.05, { dy: 0, dur: 0.4 });                 // the tiled floor comes in under the cut

    // named boxes that hug what the kit draws (rows: x 450..1050, y 48..696; arrows: x 930..990, y 126..740)
    const rowsBox = ctx.el("rows", { x: OX + 450, y: OY + 48, w: 600, h: 648, kind: "scenery" });
    const arrowsBox = ctx.el("front_arrows", { x: OX + 930, y: OY + 126, w: 60, h: 614, kind: "scenery" });

    // "Now a room": the walls draw round it (0.8 s)
    m.draw(plan.walls, tRoom, { dur: 0.8 });

    // "from above": the cooling units, then the rows settle bottom to top (0.12 s apart)
    plan.reveal("units", tAbove, { dy: 16 });
    [1, 2, 3, 4].forEach((i) => plan.reveal("row_" + i, tAbove + 0.12 * i, { dy: 28 }));
    m.reveal(rowsBox, tAbove + 0.12, { dy: 0, dur: 0.5 });

    // "Every row faces the same way": the one tag, then the arrows stamp row by row on "faces"
    // @form rule_flag: a short flag planted on the thing it names, stating the rule in the lesson's own words
    const words = "Every row faces one way";
    const as = T.pick("label", {});
    const G = T.labelGeom(0, 0, words, { as, tone: "accent3" });
    const toX = 960 - (as === "flag" ? G.w : G.tw) / 2;
    const flagY = 74;                                                 // above the room, planted on the top row
    T.label(ctx, "tag_one_way", {
      x: toX + G.tw / 2, y: flagY, text: words, to: [toX, OY + 48], tone: "accent3", t: tEvery,
    });
    [1, 2, 3, 4].forEach((i) => plan.reveal("arrow_" + i, tFaces + 0.15 * (i - 1), { dy: 0, dur: 0.4 }));
    m.reveal(arrowsBox, tFaces, { dy: 0, dur: 0.4 });
  },
});
