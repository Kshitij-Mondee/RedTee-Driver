// @design three_cards_complete_the_effort_impact_map
Loom.scene("b06", {
  build(ctx) {
    // Treatments: A place each card in a matrix slot. B list the remaining work. C fan cards outward. Choose A because position carries the impact and effort judgment.
    const { m } = ctx;
    const W = ctx.engine, B = W.board(ctx);
    const qImpact = ctx.held("q_impact");
    const qEffort = ctx.held("q_effort");
    const axisImpact = ctx.held("axis_impact");
    const axisEffort = ctx.held("axis_effort");
    const cardReply = ctx.held("card_reply");
    const tBudget = ctx.cue("The budget report: big impact, days of work.");
    const tExpenses = ctx.cue("Expenses: small and quick.");
    const tDeck = ctx.cue("A deck redesign: small, but slow.");
    const slots = Loom.lesson.matrix_board.geom.slots;

    // @form card_budget: budget report in the top-right slot
    const budget = Loom.lesson.task_card(ctx, null, {
      key: "budget", name: "card_budget", x: slots.TR.x, y: slots.TR.y, build: ["card"], boxSide: "right",
    });
    budget.setState("card", tBudget - 0.15);
    // @form budget_emphasis: accent underline for budget report
    const budgetMark = ctx.el("budget_emphasis", { x: slots.TR.x, y: slots.TR.y + 100, w: 290, h: 18, kind: "mark", exit: "recede" });
    B.draw(budgetMark, W.underline(0, 270, 6), { at: tBudget + 1.05, pen: "accent" });

    // @form card_expenses: expenses in the bottom-left slot
    const expenses = Loom.lesson.task_card(ctx, null, {
      key: "expenses", name: "card_expenses", x: slots.BL.x, y: slots.BL.y, build: ["card"], boxSide: "right",
    });
    expenses.setState("card", tExpenses - 0.3);

    // @form card_deck: deck redesign in the bottom-right slot
    const deck = Loom.lesson.task_card(ctx, null, {
      key: "deck", name: "card_deck", x: slots.BR.x, y: slots.BR.y, build: ["card"], boxSide: "right",
    });
    deck.setState("card", tDeck - 0.3);
  },
});
