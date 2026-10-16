// @design held_floor_plan_continued: the one change made on the held plan, two rows turn round in place and the aisles are named
/* b11 (station floor_plan, continue): "Same room. One change. Fronts face across a cold aisle. Backs face across a hot
 * aisle."
 *
 * Three treatments considered:
 *   A. Cut to a second plan with the rows already alternating. The viewer is told the layout and never sees that it is
 *      the SAME room with one change: rejected.
 *   B. Hold the plan from b10 and make the change on it: rows 1 and 3 turn round in place with their arrows (the
 *      kit's flip, 0.8 s, 0.2 s apart), then the aisles between fronts wash cool and take their label on "cold aisle",
 *      the aisle between backs washes warm on "hot aisle". The rotation is the lesson: watching it is how the layout is
 *      understood (motion_is: content).
 *   C. Rotate the whole plan 180 degrees. A move that changes nothing about the rows' relation to each other.
 *   B wins. Everything else holds: no stream, no tag, nothing new before the turn.
 *
 * The plan is the held Loom.lesson.floor_plan handle from b08 (E.kit); nothing is rebuilt here.
 * End frame is the b12 handover: the washes span plan x 430..1070 = frame x 640..1280, rows 1 and 2 and the lower cold
 * aisle sit inside the aisle_3d portal (frame x 640..1280, y 520..880); nothing in this beat moves them.
 * The floor tint from b10 is cleared first (the kit keeps its calls in time order through the shared handle).
 */
Loom.scene("b11", {
  build(ctx) {
    const { kit, m } = ctx;

    // ---- times, all from the narration
    const tOne = ctx.cue("One change");
    const tCold = ctx.cue("a cold aisle");
    const tHot = ctx.cue("a hot aisle");

    // ---- the held plan, numbers and named boxes
    const E = ctx.held("floor_plan");
    const plan = E.kit;
    ctx.held("rows"); ctx.held("front_arrows"); ctx.held("row_numbers");

    // "Same room": the over-cooled tint of b10 unwinds, so the aisles can take their own colours
    plan.overcool(0, ctx.start + 0.15, 0.5);
    // the row numbers are no longer needed to answer anything: the discs go back to white
    plan.markRow(4, 0, ctx.start + 0.15, 0.4);

    // kit gap, worked around here: the kit centres both aisle labels at the arrows' x, so "Cold aisle" sat on top of the
    // two arrow tips that face each other across it. The labels' own pieces (no dy, so the kit never writes a transform
    // on them) are moved 210 px right, still inside the washes and the b12 portal. Static, not a tween.
    ["label_cold", "label_hot"].forEach((n) => plan.piece(n).setAttribute("transform", "translate(210 0)"));

    // "One change": rows 1 and 3 turn round in place, their arrows with them
    plan.turnRows(tOne, { dur: 0.8, stagger: 0.2 });
    // "a cold aisle": both cold aisles wash cool from their centres, then the label; "a hot aisle": the hot one warm
    plan.aisle("cold", tCold, { dur: 0.7 });
    plan.aisle("hot", tHot, { dur: 0.7 });
    plan.state = "alternating";
  },
});
