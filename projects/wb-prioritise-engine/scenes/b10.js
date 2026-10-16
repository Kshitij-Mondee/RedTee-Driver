// @design priority_reason_turns_no_into_options
Loom.scene("b10", {
  build(ctx) {
    // Treatments: a reply card, a bare sentence with leader, or a stacked note. Chosen: stacked note makes the reason and two options legible.
    const { m } = ctx;
    const W = ctx.engine, B = W.board(ctx);
    ["q_impact","q_effort","axis_impact","axis_effort","card_reply","card_budget","card_expenses","card_deck","divider_v","divider_h","tick_reply","zone_quick","zone_major","zone_fill","zone_thankless","later_tag","week_strip","budget_block"].forEach((name) => ctx.held(name));
    const tNo = ctx.cue("Saying no isn't refusing.");
    const tPriority = ctx.cue("Tie it to your priority:");
    const tReason = ctx.cue("I'm on the budget report this week.");
    const tOptions = ctx.cue("Then offer a date, or a smaller version.");

    // @form reply_note: rough reply note under the week strip
    const note = ctx.el("reply_note", { x: 1270, y: 365, w: 510, h: 395, kind: "card", exit: "recede" });
    const outline = W.line(8, 6, 500, 6).concat(W.line(500, 6, 500, 384)).concat(W.line(500, 384, 8, 384)).concat(W.line(8, 384, 8, 6));
    B.draw(note, outline, { at: tNo, dur: 0.7, pen: "ink" });
    B.write(note, "To: deck request", { role: "label", at: tNo + 0.2, color: "muted" });

    // @form reply_line: priority sentence with the single accent underline
    const line = ctx.el("reply_line", { x: 1300, y: 465, w: 455, h: 58, kind: "text", exit: "recede" });
    B.write(line, "I'm on the budget report this week.", { role: "lead", at: tNo + 0.3, dur: 3.0, color: "ink" });
    const underline = W.line(2, 52, 440, 52);
    B.draw(line, underline, { at: tReason + 0.55, dur: 0.35, pen: "accent" });

    // @form reply_link: hand arrow from the budget card into the priority sentence
    const link = ctx.el("reply_link", { x: 1020, y: 290, w: 300, h: 200, kind: "connector", exit: "recede" });
    const arrow = W.line(20, 20, 150, 52).concat(W.line(150, 52, 265, 170)).concat(W.line(265, 170, 238, 160)).concat(W.line(265, 170, 252, 142));
    B.draw(link, arrow, { at: tReason + 0.2, dur: 0.45, pen: "ink" });

    // @form option_date: first offered date in a rough box
    const date = ctx.el("option_date", { x: 1300, y: 565, w: 285, h: 70, kind: "text", exit: "recede" });
    const dateBox = W.line(0, 4, 260, 4).concat(W.line(260, 4, 260, 62)).concat(W.line(260, 62, 0, 62)).concat(W.line(0, 62, 0, 4));
    B.draw(date, dateBox, { at: tNo + 0.45, dur: 0.32, pen: "ink" });
    ctx.kit.text(date.inner, "Next Thursday?", { role: "label", x: 12, y: 13, w: 236, h: 40, color: "ink" });
    m.unmask(date, tOptions - 0.9, { dir: "ltr" });

    // @form option_smaller: smaller alternative in a rough box
    const smaller = ctx.el("option_smaller", { x: 1300, y: 660, w: 285, h: 70, kind: "text", exit: "recede" });
    const smallBox = W.line(0, 4, 260, 4).concat(W.line(260, 4, 260, 62)).concat(W.line(260, 62, 0, 62)).concat(W.line(0, 62, 0, 4));
    B.draw(smaller, smallBox, { at: tNo + 0.7, dur: 0.32, pen: "ink" });
    const smallText = ctx.kit.text(smaller.inner, "Just two slides?", { role: "label", x: 12, y: 13, w: 240, h: 40, color: "ink" });
    m.unmask(smaller, tReason + 0.1, { dir: "ltr" });
  },
});
