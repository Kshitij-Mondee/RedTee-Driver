// @design evidence_board_real_message_continued: the last sign joins the request card and the board is complete
/* b21: "Last, what does it want from you? Your password, the request sign. Banks and other official sources do not
 * ask for this by email." The request card arrives; the word in the subject line is marked and carried to it. The
 * whole board, three families around one message, is the picture b22's summary stands on. */
Loom.scene("b21", {
  build(ctx) {
    const U = Loom.ui, M = Loom.motion;
    const board = ctx.held("board");
    if (!board || !board.ui) return;
    board.ui.names.forEach((n) => ctx.held(n));
    const { mail, cards: C } = board.ui;
    C.request = board.ui.card(ctx, "request");
    board.ui.names.push("card_request");
    M.reveal(C.request.E, ctx.cue("what does it want"), { dy: 12 });
    const tPw = ctx.cue("Your password");
    const r = U.mark(ctx, mail, "subject", "password", tPw, { tone: "accent" });
    U.wire(ctx, "wire_password", board.ui.edge(r), C.request.port(0), tPw + 0.4, { tone: "accent", parent: board.inner, hold: 1.8 });
    C.request.add(0, "asks for", "your password", tPw + 0.9);
    C.request.add(1, "by email", "official sources do not ask", ctx.cue("do not ask"));
  },
});
