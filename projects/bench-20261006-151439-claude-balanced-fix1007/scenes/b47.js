// @design replayed_frame_one_change: the opening room returns unchanged except the board sentence
/* Treatments: (A) static room with signalling, (B) cut-in with settle then print (chosen: replay with one change is the payoff), (C) camera push (rejected: shot is wide, no move). */
Loom.scene("b47", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const tBack = ctx.cue("Back to Priya and Dev");
    const tRoom = ctx.cue("in that same room");
    const tTension = ctx.cue("Same tension");
    const tDiff = ctx.cue("Different sentence");

    const room = ctx.scenery("room", "room_set", {});
    const fy = room.floorY || 860;

    // the board on the wall
    const BX = 560, BY = 170, BW = 800, BH = 300;
    const board = ctx.el("board_rebuilt_sentence", { x: BX, y: BY, w: BW, h: BH, kind: "panel", exit: "recede" });
    kit.rect(board.inner, 0, 0, BW, BH, { fill: "surface", r: 14 });
    const words = (props && props.sentence) ? [String(props.sentence)] : ["behaviour", "effect", "request"];
    const n = words.length, gap = 24, pad = 32;
    const cw = (BW - 2 * pad - (n - 1) * gap) / n;
    const inner = Loom.svg("g", {}, board.inner);
    words.forEach((w, i) => {
      const x = pad + i * (cw + gap);
      kit.rect(inner, x, 80, cw, 140, { fill: "accent", r: 12 });
      kit.text(inner, w, { role: "label", x: x + 8, y: 80, w: cw - 16, h: 140, maxLines: 2, align: "center", valign: "middle", color: S.pickTokenOn("accent") });
    });
    m.settle(board, tBack);
    m.unmask(board, tDiff);

    // cast in their b01 seats
    const priya = ctx.character("Priya", "tess", { x: 640, y: fy, scale: 1.1, top: "accent3", pose: "idle", emotion: "concerned" });
    const dev = ctx.character("Dev", "pip", { x: 1280, y: fy, scale: 1.1, flip: true, top: "accent2", pose: "idle", emotion: "concerned" });
    priya.look(1, 0, tRoom);
    dev.look(-1, 0, tRoom);
    priya.emotion("concerned", tTension);
    dev.emotion("concerned", tTension);
    priya.talk && priya.talk();
  },
});
