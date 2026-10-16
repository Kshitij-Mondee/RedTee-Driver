// @design lower_quadrants_make_batching_and_parking_visible
Loom.scene("b09", {
  build(ctx) {
    // Treatments: static lower labels, bracket then later tag, or a dual-zone reveal. Chosen: each zone receives its action as it is named.
    const W = ctx.engine, B = W.board(ctx);
    const tFill = ctx.cue("Fill-ins: batch them into one spare slot.");
    const tThanks = ctx.cue("Thankless tasks: decline or park them, openly.");
    ["q_impact", "q_effort", "axis_impact", "axis_effort", "card_reply", "card_budget", "card_expenses", "card_deck", "divider_v", "divider_h", "tick_reply", "zone_quick", "move_quick", "zone_major", "move_major", "week_days", "week_strip", "budget_scraps", "scrap_strikes", "budget_block", "budget_link"].forEach((n) => ctx.held(n));

    // @form zone_fill: fill-ins quadrant heading
    const matrix = Loom.lesson.matrix_board(ctx, null, { build: ["zone_fill", "zone_thankless"] });
    ctx.m.unmask(matrix.zone_fill, tFill, { dir: "ltr", dur: ctx.style.dur("draw") * 0.7 });
    // @form move_fill: fill-ins action
    const moveFill = ctx.el("move_fill", { x: 570, y: 675, w: 115, h: 50, kind: "text", exit: "recede" });
    B.write(moveFill, "Batch", { role: "lead", at: tFill + 0.45, by: tFill + 0.9 });

    // @form batch_bracket: bracket and Friday slot around expenses
    const bracket = ctx.el("batch_bracket", { x: 220, y: 575, w: 350, h: 190, kind: "mark", exit: "recede" });
    ctx.kit.sketch(bracket.inner, "path", ["M32 8 L8 8 L8 128 L32 128 M318 8 L342 8 L342 128 L318 128"], { fill: "none", stroke: "ink" });
    const bt = tFill + 1.0;
    ctx.m.draw(bracket, bt, { dur: ctx.style.dur("draw") * 0.7 });
    B.write(bracket, "Fri, one slot", { role: "label", at: bt, by: bt + 0.65, x: 78, y: 142, w: 200, h: 38, align: "center" });

    // @form zone_thankless: thankless tasks quadrant heading
    ctx.m.unmask(matrix.zone_thankless, tThanks, { dir: "ltr", dur: ctx.style.dur("draw") * 0.9 });
    // @form move_thankless: thankless tasks action
    const moveThankless = ctx.el("move_thankless", { x: 985, y: 690, w: 195, h: 56, kind: "text", exit: "recede" });
    B.write(moveThankless, "Decline or park", { role: "lead", at: tThanks + 0.5, by: tThanks + 1.2, size: 30 });

    // @form later_tag: later marker on deck redesign
    const later = ctx.el("later_tag", { x: 1035, y: 620, w: 104, h: 58, kind: "label", exit: "recede" });
    const lt = B.draw(later, W.rect(4, 4, 94, 48), { at: tThanks + 2.0, pen: "accent" });
    B.write(later, "later", { role: "label", at: lt, by: lt + 0.42, x: 12, y: 10, w: 78, h: 36, align: "center", pen: "accent" });
  },
});
