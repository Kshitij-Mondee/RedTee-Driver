// @design task_cards_land_in_quadrants: three named requests complete the impact-effort map
Loom.scene("b06", {
  build(ctx) {
    const { m } = ctx;
    // Treatments considered: static finished matrix, cards sliding from a stack, and card outlines written on their spoken names. Chosen: written cards, so each placement is read as a reasoned location.
    const qImpact = ctx.held("q_impact");
    const qEffort = ctx.held("q_effort");
    const axisImpact = ctx.held("axis_impact");
    const axisEffort = ctx.held("axis_effort");
    ctx.held("matrix_board");
    const reply = ctx.held("card_reply");

    const tBudget = ctx.cue("The budget report");
    // @form card_budget: high-impact work with a larger effort
    const budget = Loom.lesson.task_card(ctx, null, {
      key: "budget", name: "card_budget", x: 745, y: 260,
      boxSide: "right", build: ["card"]
    });
    budget.setState("card", tBudget);
    m.emphasis(budget.E, tBudget + 0.7);

    const tExpenses = ctx.cue("Expenses");
    // @form card_expenses: small quick task
    const expenses = Loom.lesson.task_card(ctx, null, {
      key: "expenses", name: "card_expenses", x: 250, y: 610,
      boxSide: "right", build: ["card"]
    });
    expenses.setState("card", tExpenses);

    const tDeck = ctx.cue("A deck redesign");
    // @form card_deck: small slow task
    const deck = Loom.lesson.task_card(ctx, null, {
      key: "deck", name: "card_deck", x: 745, y: 610,
      boxSide: "right", build: ["card"]
    });
    deck.setState("card", tDeck);
  },
});
