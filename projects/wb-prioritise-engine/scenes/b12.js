// @design placed_project_makes_the_tradeoff_visible
Loom.scene("b12", {
  build(ctx) {
    // Treatments: card snaps to matrix, calendar alone, or card-to-calendar with a trade-off arrow. Chosen: card-to-calendar makes placement and consequence one argument.
    const { m } = ctx;
    const W = ctx.engine, B = W.board(ctx);
    ["q_impact","q_effort","axis_impact","axis_effort","card_reply","card_budget","card_expenses","card_deck","divider_v","divider_h","tick_reply","zone_quick","zone_major","zone_fill","zone_thankless","later_tag","week_strip","budget_block"].forEach((name) => ctx.held(name));
    const newCard = ctx.held("card_new");
    m.exit(ctx.held("new_notes"), ctx.start, "recede");
    m.exit(ctx.held("q_where"), ctx.start, "recede");
    const tMajor = ctx.cue("Major projects.");
    const tBlock = ctx.cue("She blocks time and asks which task gives way.");
    m.travel(newCard, tMajor, { x: -545, y: -10 });

    // @form second_block: a second solid work block over Thursday and Friday
    const week = Loom.lesson.week_strip(ctx, null, { build: ["second"], secondColor: "ink" });
    week.setState("second", tBlock - 0.15);

    // @form giveway_arrow: hand arrow from the placed project toward the competing work
    const arrow = ctx.el("giveway_arrow", { x: 1070, y: 400, w: 160, h: 125, kind: "connector", exit: "recede" });
    const path = W.line(8, 22, 72, 60).concat(W.line(72, 60, 142, 104)).concat(W.line(142, 104, 116, 101)).concat(W.line(142, 104, 124, 80));
    B.draw(arrow, path, { at: tBlock + 0.35, dur: 0.38, pen: "ink" });

    // @form gives_way: the single accented question beside the arrow
    const question = ctx.el("gives_way", { x: 1260, y: 585, w: 500, h: 70, kind: "text", exit: "recede" });
    ctx.kit.text(question.inner, "Which task gives way?", { role: "lead", size: 38, x: 0, y: 0, w: 500, h: 70, align: "left", valign: "middle", maxLines: 1, color: "accent" });
    m.unmask(question, tBlock - 0.10, { dir: "ltr", dur: 1.45 });
  },
});
