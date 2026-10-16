// @design new_request_waits_for_its_place
Loom.scene("b11", {
  build(ctx) {
    // Treatments: a quiz card, a floating request, or a request beside the learned matrix. Chosen: request beside matrix preserves the decision context.
    const { m } = ctx;
    const W = ctx.engine, B = W.board(ctx);
    ["q_impact","q_effort","axis_impact","axis_effort","card_reply","card_budget","card_expenses","card_deck","divider_v","divider_h","tick_reply","zone_quick","zone_major","zone_fill","zone_thankless","later_tag","week_strip","budget_block"].forEach((name) => ctx.held(name));
    ["reply_note","reply_line","reply_link","option_date","option_smaller"].forEach((name) => m.exit(ctx.held(name), ctx.start, "recede"));
    const tTurn = ctx.cue("Your turn.");
    const tRequest = ctx.cue("Her manager wants a new analysis by Friday.");
    const tQuestion = ctx.cue("Big impact, two days. Where does it go?");

    // @form card_new: unplaced new analysis request
    const H = Loom.lesson.task_card(ctx, null, { key: "new", x: 1290, y: 390, name: "card_new", build: ["card"], boxSide: "right" });
    H.setState("card", tRequest - 0.2);

    // @form new_notes: muted impact and duration notes
    const notes = ctx.el("new_notes", { x: 1310, y: 510, w: 360, h: 100, kind: "text", exit: "recede" });
    B.write(notes, "big impact", { role: "label", at: tRequest + 1.0, color: "muted" });
    B.write(notes, "two days", { role: "label", at: tRequest + 1.6, color: "muted", y: 48 });

    // @form q_where: large decision prompt, the scene's one accent
    const question = ctx.el("q_where", { x: 1285, y: 655, w: 455, h: 92, kind: "text", exit: "recede" });
    B.write(question, "Where does it go?", { role: "title", at: tQuestion - 0.198, dur: 2.0, color: "accent" });
  },
});
