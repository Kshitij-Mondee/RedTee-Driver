// @design evidence_board_real_message_continued: the held board; the next sign is marked on the message and carried to its card
/* b18: "It also claims to be IT support. Phishing likes to borrow authority." The sender name is marked where it
 * is written and joins the pressure card as its second row: borrowed authority is pressure too (b22 names three
 * kinds of sign). Layout and parts come from b17 (board.ui). */
Loom.scene("b18", {
  build(ctx) {
    const U = Loom.ui;
    const board = ctx.held("board");
    if (!board || !board.ui) return;
    board.ui.names.forEach((n) => ctx.held(n));
    const { mail, cards: C } = board.ui;
    const tIT = ctx.cue("claims to be IT support");
    const r = U.mark(ctx, mail, "sender", "IT support", tIT, { tone: "accent2" });
    U.wire(ctx, "wire_sender", board.ui.edge(r), C.pressure.port(1), tIT + 0.5, { tone: "accent2", parent: board.inner, hold: 1.6 });
    C.pressure.add(1, "authority", "claims to be IT support", ctx.cue("borrow authority"));
  },
});
