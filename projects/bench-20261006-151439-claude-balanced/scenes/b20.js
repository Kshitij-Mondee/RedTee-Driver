// @design objection_beside_done: a calm finished board, a shrug, a bubble that asks why
/* Treatments: (A) text only (rejected), (B) static board with signalling (too flat), (C) CHOSEN: board settles, Dev shrugs, bubble pops and gains a Why line. */
Loom.scene("b20", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const T = Loom.treat;

    const board = ctx.el("board_slot_one_filled", { x: 220, y: 230, w: 760, h: 520, kind: "board", exit: "recede" });
    kit.rect(board.inner, 0, 0, 760, 520, { fill: "surface", r: 22 });
    const filled = ctx.el("slot_one", { x: 270, y: 290, w: 300, h: 180, kind: "slot", exit: "recede" });
    kit.rect(filled.inner, 0, 0, 300, 180, { fill: "pos", r: 18 });
    const empty = ctx.el("slot_two", { x: 620, y: 290, w: 300, h: 180, kind: "slot", exit: "recede" });
    kit.rect(empty.inner, 0, 0, 300, 180, { fill: "surface2", r: 18, shadow: false });
    m.reveal(board, ctx.cue("Slot one is filled") - 0.1, { dy: 12 });
    m.reveal(filled, ctx.cue("Slot one is filled") + 0.1, { dy: 8 });
    m.reveal(empty, ctx.cue("Slot one is filled") + 0.2, { dy: 8 });

    const dev = ctx.character("dev", "pip", { x: 1250, y: 800, scale: 1.5, pose: "idle" });
    const tThink = ctx.cue("Dev might still think");
    dev.pose("shrug", tThink, { dur: 0.4 });
    dev.gesture("shrug", tThink, tThink + 1.2);
    dev.emotion("concerned", tThink);
    dev.talk();

    const tSo = ctx.cue("so what");
    T.bubble(ctx, "so_what_bubble", { x: 1100, y: 200, w: 420, text: "So what?", tail: [1230, 400], kind: "speech", fill: "accent", maxLines: 1, t: tSo });

    const tWhy = ctx.cue("Why does it matter");
    const why = ctx.el("why_line", { x: 1180, y: 380, w: 260, h: 84, kind: "stamp", exit: "recede" });
    kit.pill(why.inner, 0, 0, 260, 84, { fill: "surface" });
    kit.text(why.inner, "Why?", { role: "lead", x: 0, y: 0, w: 260, h: 84, maxLines: 1, align: "center", valign: "middle", weight: 800 });
    m.pop(why, tWhy, { overshoot: false });
  },
});
