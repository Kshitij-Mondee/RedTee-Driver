// @design matrix_quick_wins: one quadrant becomes the first action
Loom.scene("b07", {
  build(ctx) {
    const { m } = ctx;
    // Treatments: dividers then title; title then tick; static labels. Choose dividers then title.
    const tZones = ctx.cue("Four zones, four moves.");
    const tQuick = ctx.cue("Quick wins: do them first,");
    const tReply = ctx.cue("so the client hears back today.");

    // The inherited board and cards remain the shared drawing.
    ctx.held("q_impact");
    ctx.held("q_effort");
    ctx.held("axis_impact");
    ctx.held("axis_effort");
    ctx.held("matrix_board");
    ctx.held("card_reply");
    ctx.held("card_budget");
    ctx.held("card_expenses");
    ctx.held("card_deck");

    // @form matrix_dividers: two quiet strokes split the existing board
    const dividers = ctx.el("matrix_divider_build", { x: 0, y: 0, w: 1200, h: 900, kind: "diagram", exit: "none" });
    const board = Loom.lesson.matrix_board(ctx, dividers.inner, {
      build: ["divider_v", "divider_h"],
      names: { divider_v: "divider_v", divider_h: "divider_h" }
    });
    board.setState("dividers", tZones - 0.25);

    // @form quick_zone: accent name and muted action identify the first move
    const quick = ctx.el("quick_zone_build", { x: 0, y: 0, w: 1200, h: 900, kind: "diagram", exit: "none" });
    const zones = Loom.lesson.matrix_board(ctx, quick.inner, {
      build: ["zone_quick", "move_quick"],
      colors: { quick: "accent" },
      names: { zone_quick: "zone_quick", move_quick: "move_quick" }
    });
    zones.setState("zones", tQuick - 0.15);
    zones.setState("moves", tQuick + 0.35);
    Loom.tl.set(zones.move_quick.mover, { y: 115 }, ctx.start);

    // @form reply_tick: a hand tick confirms the immediate client reply
    const replyTick = ctx.el("reply_tick_build", { x: 0, y: 0, w: 650, h: 400, kind: "mark", exit: "none" });
    const card = Loom.lesson.task_card(ctx, replyTick.inner, {
      key: "reply", x: 250, y: 260, name: "reply_tick_state",
      names: { box: "reply_box", tick: "tick_reply" },
      build: ["box", "tick"], boxSide: "right"
    });
    card.setState("box", tReply - 0.25);
    card.setState("tick", tReply);
  }
});
