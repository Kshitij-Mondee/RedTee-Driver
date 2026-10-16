// @design urgency_splits_into_time_and_importance
Loom.scene("b03", {
  build(ctx) {
    const { m } = ctx;
    const W = ctx.engine, B = W.board(ctx);
    const listTitle = ctx.held("list_title");
    const cardDeck = ctx.held("card_deck");
    const cardExpenses = ctx.held("card_expenses");
    const cardReply = ctx.held("card_reply");
    const cardBudget = ctx.held("card_budget");
    const urgentTags = ctx.held("urgent_tags");
    const tickDeck = ctx.held("tick_deck");
    const tickExpenses = ctx.held("tick_expenses");
    const tickReply = ctx.held("tick_reply");
    const budgetBox = ctx.held("budget_box");
    const clock = ctx.held("clock");
    const friday = ctx.held("friday_label");
    m.exit(clock, ctx.start, "recede");
    m.exit(friday, ctx.start, "recede");

    const tUrgent = ctx.cue("Urgent says how soon,");
    const tMatters = ctx.cue("not how much it matters.");
    const tDeadline = ctx.cue("Research suggests we lean toward the nearer deadline.");

    // @form word_urgent: urgent title
    const urgent = ctx.el("word_urgent", { x: 1080, y: 135, w: 610, h: 120, kind: "text", exit: "recede" });
    B.write(urgent, "urgent", { role: "title", at: tUrgent, by: tUrgent + 0.75 });

    // @form split_arrows: two hand arrows from urgent
    const arrows = ctx.el("split_arrows", { x: 1085, y: 260, w: 600, h: 185, kind: "connector", exit: "recede" });
    const aSoon = B.draw(arrows, W.arrow(175, 6, 80, 155, { bend: 20 }), { at: tUrgent + 0.15, dur: 0.4 });
    B.draw(arrows, W.arrow(245, 6, 510, 155, { bend: -32 }), { at: tMatters - 0.25, dur: 0.4 });

    // @form label_soon: how soon label
    const soon = ctx.el("label_soon", { x: 1050, y: 420, w: 280, h: 68, kind: "text", exit: "recede" });
    B.write(soon, "how soon", { role: "lead", at: aSoon, align: "center" });

    // @form label_matters: importance label with accent underline
    const matters = ctx.el("label_matters", { x: 1335, y: 420, w: 440, h: 68, kind: "text", exit: "recede" });
    const aMatters = B.write(matters, "how much it matters", { role: "lead", at: tMatters + 0.05, align: "center" });
    const underline = ctx.el("matters_underline", { x: 1360, y: 486, w: 390, h: 20, kind: "mark", exit: "recede" });
    B.draw(underline, W.underline(0, 370, 6), { at: aMatters, pen: "accent" });

    // @form balance: tilted balance that leans toward time
    const balance = ctx.el("balance", { x: 1080, y: 560, w: 660, h: 270, kind: "diagram", exit: "recede" });
    const tb = tDeadline + 0.15;
    let drawn = B.draw(balance, W.line(330, 235, 330, 100).concat(W.line(270, 235, 390, 235)), { at: tb, dur: 0.3, pen: "ink" });
    drawn = B.draw(balance, W.line(95, 112, 565, 72), { at: drawn, dur: 0.4, pen: "ink" });
    drawn = B.draw(balance, W.line(115, 115, 85, 185).concat(W.line(115, 115, 150, 182)).concat(W.line(85, 185, 150, 182)), { at: drawn, dur: 0.3, pen: "ink" });
    B.draw(balance, W.line(545, 75, 515, 135).concat(W.line(545, 75, 580, 132)).concat(W.line(515, 135, 580, 132)), { at: drawn, dur: 0.3, pen: "ink" });

    // @form deadline_mark: flag on the lowered how soon pan
    const flag = ctx.el("deadline_mark", { x: 1140, y: 635, w: 100, h: 120, kind: "icon", exit: "recede" });
    B.draw(flag, W.line(28, 105, 28, 15).concat(W.line(28, 18, 76, 30)).concat(W.line(76, 30, 28, 50)), { at: tb + 0.45, dur: 0.3, pen: "accent" });
  },
});
