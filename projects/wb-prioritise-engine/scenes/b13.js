// @design arrival_order_becomes_a_reasoned_sequence
Loom.scene("b13", {
  build(ctx) {
    // Treatments considered: static sorted checklist with an underline; cards sliding between numbered slots; initial arrival list that rearranges into a working order. Chosen: the rearrangement makes the payoff visible.
    const { m } = ctx;
    const W = ctx.engine, B = W.board(ctx);
    const tPlace = ctx.cue("New request? Place it, then sort again.");
    const tQuick = ctx.cue("Tomorrow, start with one quick win.");

    // @form resort_title: closing instruction heading
    const title = ctx.el("resort_title", { x: 150, y: 110, w: 860, h: 128, kind: "text", exit: "wipe" });
    B.write(title, "Place it. Sort again.", { role: "title", at: tPlace, by: tPlace + 0.9 });

    const startRows = [
      { key: "deck", name: "row_deck", y: 630, target: 630, build: ["card", "later"] },
      { key: "expenses", name: "row_expenses", y: 500, target: 500, build: ["card"] },
      { key: "reply", name: "row_reply", y: 370, target: 240, build: ["card", "box", "tick"] },
      { key: "budget", name: "row_budget", y: 240, target: 370, build: ["card"] },
    ];
    const cards = {};
    startRows.forEach((r) => {
      cards[r.key] = Loom.lesson.task_card(ctx, null, {
        key: r.key, name: r.name, x: 280, y: r.y, build: r.build,
        names: r.key === "reply" ? { tick: "reply_tick" } : r.key === "deck" ? { later: "deck_later" } : {},
      });
      cards[r.key].setState("card", tPlace + 0.2);
    });

    // @form row_notes: muted timing and deferral notes beside their sorted cards
    const notes = ctx.el("row_notes", { x: 650, y: 0, w: 220, h: 750, kind: "text", exit: "wipe" });
    const budgetNote = ctx.el("budget_note", { x: 0, y: 384, w: 180, h: 58, kind: "text", exit: "wipe", parent: notes });
    const expensesNote = ctx.el("expenses_note", { x: 0, y: 514, w: 120, h: 58, kind: "text", exit: "wipe", parent: notes });
    const deckNote = ctx.el("deck_note", { x: 0, y: 644, w: 130, h: 58, kind: "text", exit: "wipe", parent: notes });
    B.write(budgetNote, "Tue-Wed", { role: "label", pen: "muted", at: tPlace + 1.25, by: tPlace + 1.7 });
    B.write(expensesNote, "Fri", { role: "label", pen: "muted", at: tPlace + 1.65, by: tPlace + 2.0 });
    B.write(deckNote, "later", { role: "label", pen: "muted", at: tPlace + 2.05, by: tPlace + 2.45 });

    // @form sorted_rows: cards travel one at a time into the work order
    m.travel(cards.reply.root, tPlace + 0.35, { x: 0, y: -130 });
    m.travel(cards.budget.root, tPlace + 0.75, { x: 0, y: 130 });
    m.travel(cards.expenses.root, tPlace + 1.15, { x: 0, y: 0 });
    m.travel(cards.deck.root, tPlace + 1.55, { x: 0, y: 0 });
    cards.reply.setState("box", tPlace + 0.72);
    cards.reply.setState("tick", tPlace + 0.95);
    cards.deck.setState("later", tPlace + 2.05);

    // @form start_line: practical closing prompt
    const startLine = ctx.el("start_line", { x: 1060, y: 680, w: 620, h: 100, kind: "text", exit: "wipe" });
    B.write(startLine, "Start with a quick win", { role: "lead", at: tQuick, by: tQuick + 0.85 });
    // @form quickwin_underline: sole accent emphasis mark
    const underline = ctx.el("quickwin_underline", { x: 1230, y: 772, w: 315, h: 32, kind: "mark", exit: "recede" });
    B.draw(underline, W.line(8, 18, 300, 13), { at: tQuick + 0.78, pen: "accent", dur: ctx.style.dur("draw") * 0.45 });
  },
});
