// @design two_axes_place_the_first_quick_win
Loom.scene("b05", {
  build(ctx) {
    // Treatments: A draw axes into held labels. B reveal a complete grid. C float cards without axes. Choose A because it makes each placement traceable.
    const { m } = ctx;
    const W = ctx.engine, B = W.board(ctx);
    const qImpact = ctx.held("q_impact");
    const qEffort = ctx.held("q_effort");
    const glossImpact = ctx.held("gloss_impact");
    const glossEffort = ctx.held("gloss_effort");
    const tAxes = ctx.cue("Impact runs up, effort across.");
    const tReply = ctx.cue("The client reply: big impact, ten minutes.");

    // @form axis_impact: vertical impact arrow
    const axisImpact = ctx.el("axis_impact", { x: 176, y: 148, w: 48, h: 724, kind: "connector", exit: "recede" });
    B.draw(axisImpact, W.line(24, 712, 24, 22).concat(W.line(12, 42, 24, 22)).concat(W.line(36, 42, 24, 22)), { at: tAxes, pen: "ink" });
    // @form axis_effort: horizontal effort arrow
    const axisEffort = ctx.el("axis_effort", { x: 188, y: 836, w: 804, h: 48, kind: "connector", exit: "recede" });
    B.draw(axisEffort, W.line(12, 24, 792, 24).concat(W.line(772, 12, 792, 24)).concat(W.line(772, 36, 792, 24)), { at: tAxes + 0.55, pen: "ink" });
    const slots = { TL: { x: 250, y: 260 } };

    // @form card_reply: client reply card in the top-left slot
    const reply = Loom.lesson.task_card(ctx, null, {
      key: "reply", name: "card_reply", x: slots.TL.x, y: slots.TL.y,
      build: ["card"], boxSide: "right",
    });
    reply.setState("card", tReply - 0.4);
    // @form reply_emphasis: accent underline below client reply
    const replyMark = ctx.el("reply_emphasis", { x: slots.TL.x, y: slots.TL.y + 100, w: 270, h: 18, kind: "mark", exit: "recede" });
    B.draw(replyMark, W.underline(0, 250, 6), { at: tReply + 1.05, pen: "accent" });
  },
});
