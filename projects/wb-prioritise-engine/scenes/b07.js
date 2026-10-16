// @design matrix_quadrant_labels_turn_placement_into_action
Loom.scene("b07", {
  build(ctx) {
    // Treatments: static labels, dividers then action, or a complete quadrant stamp. Chosen: dividers then action follows the spoken sort.
    const W = ctx.engine, B = W.board(ctx);
    const tZones = ctx.cue("Four zones, four moves.");
    const tQuick = ctx.cue("Quick wins: do them first,");
    const tToday = ctx.cue("so the client hears back today.");
    ["q_impact", "q_effort", "axis_impact", "axis_effort", "card_reply", "card_budget", "card_expenses", "card_deck"].forEach((n) => ctx.held(n));
    ctx.held("card_reply");

    // @form divider_v: vertical matrix divider
    // @form divider_h: horizontal matrix divider
    // @form zone_quick: quick wins quadrant heading
    // @form move_quick: quick wins action
    const matrix = Loom.lesson.matrix_board(ctx, null, {
      build: ["divider_v", "divider_h", "zone_quick"],
      colors: { quick: "accent" }
    });
    matrix.setState("dividers", tZones - 0.2);
    ctx.m.unmask(matrix.zone_quick, tQuick, { dir: "ltr", dur: ctx.style.dur("draw") * 0.7 });
    // @form move_quick: quick wins action
    const moveQuick = ctx.el("move_quick", { x: 550, y: 302, w: 145, h: 54, kind: "text", exit: "recede" });
    B.write(moveQuick, "Do first", { role: "lead", at: tQuick + 0.38, by: tQuick + 0.85 });

    // @form tick_reply: positive tick on client reply
    const tick = ctx.el("tick_reply", { x: 195, y: 275, w: 58, h: 58, kind: "icon", exit: "recede" });
    B.draw(tick, W.line(8, 32, 23, 46).concat(W.line(23, 46, 51, 9)), { at: tToday + 0.1, pen: "pos" });
  },
});
