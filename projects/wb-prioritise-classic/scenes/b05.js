// @design matrix_axes_card: two questions become a coordinate frame, then the first card proves the placement
Loom.scene("b05", {
  build(ctx) {
    const { m, kit } = ctx;
    // Treatments considered: static matrix with a card already placed; axes drawn into held questions; a travelling card. Chosen: axes drawn, then card written in place, because placement is the teaching move.
    const qImpact = ctx.held("q_impact");
    const qEffort = ctx.held("q_effort");

    // @form matrix_board: the quiet scaffold that turns the two held questions into axes
    const board = ctx.el("matrix_board", { x: 0, y: 0, w: 1220, h: 930, kind: "scenery", exit: "recede" });
    const H = Loom.lesson.matrix_board(ctx, board.inner, { build: [] });
    const impactArt = Loom.lesson.matrix_board(ctx, null, { build: ["axis_impact"] });
    m.draw(impactArt.axis_impact, ctx.cue("Impact runs up") - 0.08, { dur: ctx.style.dur("draw") * 0.8 });
    const effortArt = Loom.lesson.matrix_board(ctx, null, { build: ["axis_effort"] });
    m.draw(effortArt.axis_effort, ctx.cue("effort across") - 0.08, { dur: ctx.style.dur("draw") * 1.1 });

    // @form task_card: the named client request, placed in the high-impact, low-effort slot
    const reply = Loom.lesson.task_card(ctx, board.inner, {
      key: "reply",
      name: "card_reply",
      x: H.slots.TL.x,
      y: H.slots.TL.y,
      build: ["card"],
      boxSide: "right"
    });
    reply.setState("card", ctx.cue("The client reply") - 0.08);

    // @form card_reply_accent: one marker underline makes the placed request the focal point
    const accent = ctx.el("card_reply_accent", { x: H.slots.TL.x + 16, y: H.slots.TL.y + 96, w: 220, h: 24, kind: "mark", exit: "recede" });
    kit.sketch(accent.inner, "path", ["M0 15 Q104 4 214 13"], { fill: "none", stroke: "accent", sw: 5.5 });
    m.draw(accent, ctx.cue("big impact, ten minutes") - 0.05, { dur: ctx.style.dur("draw") * 0.35 });
  },
});
