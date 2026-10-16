// @design arrival_order_failure: a completed top-to-bottom list leaves the bottom task unticked as Friday arrives
Loom.scene("b02", {
  build(ctx, props) {
    // Treatments: 1) static list with a circled bottom card. 2) cards tick in arrival order while a clock reaches Friday. 3) a winding arrow through cards. Choose 2 because the completed ticks and passing time make the failure visible.
    const m = ctx.m;
    const tStart = ctx.speechStart;
    const tDown = ctx.cue("She works down from the top.");
    const tFriday = ctx.cue("By Friday, what mattered most is still waiting.");

    // @form list_title: handwritten list heading
    const title = ctx.el("list_title", { x: 160, y: 108, w: 570, h: 100, kind: "text", exit: "recede" });
    ctx.kit.text(title.inner, "Maya's Monday", { role: "title", size: 72, x: 0, y: 0, w: 570, h: 100, maxLines: 1, valign: "middle", color: "ink" });
    m.unmask(title, tDown, { dir: "ltr", dur: ctx.style.dur("draw") });

    const cards = [
      { key: "deck", name: "card_deck", y: 270, tick: "tick_deck" },
      { key: "expenses", name: "card_expenses", y: 390, tick: "tick_expenses" },
      { key: "reply", name: "card_reply", y: 510, tick: "tick_reply" },
      { key: "budget", name: "card_budget", y: 630, box: "budget_box" }
    ];
    const handles = cards.map((card) => Loom.lesson.task_card(ctx, null, {
      key: card.key, name: card.name, x: 340, y: card.y, boxSide: "left",
      names: Object.assign({}, card.tick ? { tick: card.tick } : {}, card.box ? { box: card.box } : {}),
      build: card.tick ? ["card", "box", "tick"] : ["card", "box"]
    }));
    handles.forEach((H, i) => {
      H.setState("card", tStart + i * 0.12);
      H.setState("box", tStart + 0.35 + i * 0.12);
    });

    // @form urgent_tags: four arrival-order urgency labels
    const tags = Loom.lesson.task_card.urgentTags(ctx, null, { name: "urgent_tags", cards: cards.map((card) => ({ key: card.key, x: 340, y: card.y, boxSide: "left" })) });
    tags.setState("urgent", tStart + 0.55);

    handles.slice(0, 3).forEach((H, i) => H.setState("tick", tDown + 0.35 + i * 0.48));

    // @form clock: hand-drawn clock marking the passing week
    const clock = ctx.el("clock", { x: 1080, y: 395, w: 230, h: 230, kind: "icon", exit: "recede" });
    Loom.svg("circle", { cx: 115, cy: 115, r: 92, fill: "none", stroke: ctx.c("ink"), "stroke-width": 4 }, clock.inner);
    Loom.svg("path", { d: "M115 115 L115 58 M115 115 L158 145", fill: "none", stroke: ctx.c("ink"), "stroke-width": 4, "stroke-linecap": "round" }, clock.inner);
    m.draw(clock, tFriday, { dur: ctx.style.dur("draw") });

    // @form friday_label: handwritten end-of-week label
    const friday = ctx.el("friday_label", { x: 1080, y: 635, w: 230, h: 54, kind: "text", exit: "recede" });
    ctx.kit.text(friday.inner, "Friday", { role: "lead", size: 38, x: 0, y: 0, w: 230, h: 54, align: "center", valign: "middle", maxLines: 1, color: "ink" });
    m.unmask(friday, tFriday + 0.42, { dir: "ltr", dur: 0.45 });

    // @form budget_emphasis: single accent circle around the unticked budget box
    const ring = ctx.el("budget_emphasis", { x: 238, y: 642, w: 82, h: 82, kind: "mark", exit: "recede" });
    Loom.svg("circle", { cx: 41, cy: 41, r: 35, fill: "none", stroke: ctx.c("accent"), "stroke-width": 6 }, ring.inner);
    m.draw(ring, tFriday + 1.85, { dur: 0.45 });
  }
});
