// @design planned_block_replaces_scattered_budget_work
Loom.scene("b08", {
  build(ctx) {
    // Treatments: static week, scattered scraps crossed into a block, or an arrow-led schedule. Chosen: scraps resolve into one block.
    const W = ctx.engine, B = W.board(ctx);
    const tMajor = ctx.cue("Major projects: block time for them.");
    const tSwitch = ctx.cue("Switching tasks tends to cost time and accuracy.");
    ["q_impact", "q_effort", "axis_impact", "axis_effort", "card_reply", "card_budget", "card_expenses", "card_deck", "divider_v", "divider_h", "tick_reply", "zone_quick", "move_quick"].forEach((n) => ctx.held(n));
    const quick = ctx.held("zone_quick");
    Loom.lesson.matrix_board.recolor(ctx, quick, "ink", tMajor - 0.1);

    // @form zone_major: major projects quadrant heading
    const matrix = Loom.lesson.matrix_board(ctx, null, { build: ["zone_major"] });
    ctx.m.unmask(matrix.zone_major, tMajor, { dir: "ltr", dur: ctx.style.dur("draw") * 0.9 });
    // @form move_major: major projects action
    const moveMajor = ctx.el("move_major", { x: 1015, y: 305, w: 165, h: 54, kind: "text", exit: "recede" });
    B.write(moveMajor, "Block time", { role: "lead", at: tMajor + 0.5, by: tMajor + 1.15 });

    // @form week_strip: weekday cells
    // @form budget_scraps: scattered budget scraps
    // @form scrap_strikes: strike-throughs on scraps
    // @form budget_block: clean outlined budget report time block
    const week = Loom.lesson.week_strip(ctx, null, { build: ["days", "strip", "scraps", "strikes"] });
    week.setState("strip", tMajor + 0.35);
    week.setState("scraps", tMajor + 1.25);
    week.setState("strikes", tSwitch + 0.1);
    const budgetBlock = ctx.el("budget_block", { x: 1370, y: 194, w: 216, h: 138, kind: "card", exit: "recede" });
    const budgetAt = B.draw(budgetBlock, W.rect(10, 10, 196, 118), { at: tSwitch + 1.55, pen: "accent" });
    B.write(budgetBlock, "Budget report", { role: "lead", at: budgetAt, by: budgetAt + 0.5, x: 16, y: 20, w: 184, h: 98, align: "center" });

    // @form budget_link: hand arrow from budget report to its block
    const link = ctx.el("budget_link", { x: 1040, y: 300, w: 225, h: 95, kind: "connector", exit: "recede" });
    B.draw(link, W.arrow(5, 58, 212, 15, { bend: -18 }), { at: tSwitch + 2.15, pen: "accent" });
  },
});
