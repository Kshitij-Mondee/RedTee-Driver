// @design sentence_said_kindly: a vague sentence is spoken warmly and printed on the board in plain ink
/* Treatments: (A) static two-shot with a bubble fade (B) zoom on the board (C) CHOSEN: held room, bubble unfolds from Priya, the sentence prints in bubble and on board as she says it. */
Loom.scene("b02", {
  build(ctx) {
    const { kit, m } = ctx;
    const T = Loom.treat;
    ctx.held("room_set");
    ctx.held("Priya");
    ctx.held("Dev");
    ctx.held("wall_board");
    const tKind = ctx.cue("so she says it kindly");
    const tSay = ctx.cue("you need to be more professional");
    ctx.cue("Priya wants to help");
    T.bubble(ctx, "speech_bubble", { x: 700, y: 170, w: 620, text: "Dev, you need to be more professional.", tail: [560, 420], kind: "speech", maxLines: 2, t: tKind });
    const BW = 560;
    const fit = kit.fit("you need to be more professional", { role: "label", w: BW, maxLines: 2 });
    const h = fit.height + 24;
    const sb = ctx.el("sentence_on_board", { x: 1180, y: 250, w: BW, h: h, kind: "text", exit: "none" });
    kit.text(sb.inner, "you need to be more professional", { role: "label", x: 0, y: 12, w: BW, h: fit.height, maxLines: 2, color: "ink" });
    m.unmask(sb, tSay);
  },
});
