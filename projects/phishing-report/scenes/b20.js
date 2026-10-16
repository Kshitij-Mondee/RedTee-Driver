// @design evidence_board_real_message_continued: the camera pulls back to the whole board; the address and the link join the mismatch card
/* b20: "Then the link. It is shortened, so it hides where it goes. So you have the mismatch sign, not who, or where,
 * it claims to be." The board pulls back from b19's push; the mismatch card arrives and takes the changed address
 * first, then the link, marked where it is written. */
Loom.scene("b20", {
  build(ctx) {
    const U = Loom.ui, M = Loom.motion, bid = ctx.beat.id;
    const board = ctx.held("board");
    if (!board || !board.ui) return;
    board.ui.names.forEach((n) => ctx.held(n));
    const { mail, cards: C } = board.ui;
    const t0 = ctx.start + 0.05;
    // the pull back: b19's push run backwards (board.ui.cam is that one camera, a function of its progress)
    if (board.ui.cam) Loom.drive((e) => board.ui.cam(1 - e), t0, 1.2, "editorial", { kind: "camera", beat: bid, name: "board.pull", key: "board.camera" });
    const ex = ctx.held("expected_row");
    if (ex) { M.exit(ex, t0, "recede"); board.ui.names = board.ui.names.filter((n) => n !== "expected_row"); }
    if (mail.nodes.time) Loom.tween(mail.nodes.time, { opacity: 0 }, { opacity: 1, duration: 0.3 }, t0 + 0.3, { kind: "reveal", beat: bid, name: "message.time", content: true });
    C.mismatch = board.ui.card(ctx, "mismatch");
    board.ui.names.push("card_mismatch");
    M.reveal(C.mismatch.E, t0 + 1.0, { dy: 12 });
    const ad = U.phrase(mail, "address", "yourcompeny");
    U.wire(ctx, "wire_address", board.ui.edge(ad), C.mismatch.port(0), t0 + 1.3, { tone: "accent3", parent: board.inner, hold: 1.4 });
    C.mismatch.add(0, "address", "one letter changed", t0 + 1.8);
    const tLink = ctx.cue("Then the link");
    const r = U.mark(ctx, mail, "link", "lnk.example/shared-drv", tLink, { tone: "accent3" });
    const tShort = ctx.cue("hides where it goes");
    U.wire(ctx, "wire_link", board.ui.edge(r), C.mismatch.port(1), tShort - 0.4, { tone: "accent3", parent: board.inner, hold: 1.6 });
    C.mismatch.add(1, "link", "shortened, hides where it goes", tShort + 0.2);
  },
});
