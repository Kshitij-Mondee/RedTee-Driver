// @design list_arrival_order_hides_the_priority
Loom.scene("b02", {
  build(ctx) {
    const { m } = ctx;
    const W = ctx.engine, B = W.board(ctx);
    const tWork = ctx.cue("She works down from the top.");
    const tFriday = ctx.cue("By Friday, what mattered most is still waiting.");

    // @form list_title: Maya Monday heading
    const listTitle = ctx.el("list_title", { x: 150, y: 110, w: 720, h: 120, kind: "text", exit: "recede" });
    B.write(listTitle, "Maya's Monday", { role: "title", at: tWork, by: tWork + 0.9 });

    const rows = [
      { key: "deck", name: "card_deck", y: 260, tick: "tick_deck" },
      { key: "expenses", name: "card_expenses", y: 380, tick: "tick_expenses" },
      { key: "reply", name: "card_reply", y: 500, tick: "tick_reply" },
      { key: "budget", name: "card_budget", y: 620, box: "budget_box" },
    ];
    const cards = rows.map((r) => Loom.lesson.task_card(ctx, null, {
      key: r.key, name: r.name, x: 280, y: r.y,
      names: Object.assign({}, r.tick ? { tick: r.tick } : {}, r.box ? { box: r.box } : {}),
      build: r.tick ? ["card", "box", "tick"] : ["card", "box"],
    }));
    cards.forEach((card) => card.setState("card", tWork - 0.2));
    cards.forEach((card) => card.setState("box", tWork + 0.3));
    cards[0].setState("tick", tWork + 0.55);
    cards[1].setState("tick", tWork + 0.9);
    cards[2].setState("tick", tWork + 1.25);

    // @form urgent_tags: four handwritten urgent labels
    const urgentTags = Loom.lesson.task_card.urgentTags(ctx, null, {
      name: "urgent_tags", cards: rows.map((r) => ({ key: r.key, x: 280, y: r.y })),
    });
    urgentTags.setState("urgent", tWork + 0.15);

    // @form clock: Friday clock
    const clock = ctx.el("clock", { x: 1080, y: 305, w: 210, h: 210, kind: "icon", exit: "recede" });
    let tc = B.draw(clock, W.ellipse(105, 105, 86, 86), { at: tFriday - 0.25, pen: "ink" });
    tc = B.draw(clock, W.line(105, 105, 105, 52).concat(W.line(105, 105, 151, 126)), { at: tc, pen: "ink" });
    // @form friday_label: Friday under clock
    const friday = ctx.el("friday_label", { x: 1060, y: 530, w: 250, h: 76, kind: "text", exit: "recede" });
    B.write(friday, "Friday", { role: "lead", at: tc, align: "center" });

    // @form budget_box: accent circle around empty budget box
    const circle = ctx.el("budget_circle", { x: 145, y: 610, w: 120, h: 100, kind: "mark", exit: "recede" });
    B.draw(circle, W.ellipse(60, 50, 54, 42), { at: tFriday + 1.15, pen: "accent", sound: true });
  },
});
