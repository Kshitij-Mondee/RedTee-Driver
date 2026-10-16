// @design reverse_packet_lens: scrambled information crosses the server lens and returns as readable rows
Loom.scene("b12", {
  build(ctx) {
    const { m } = ctx;
    // Treatments considered: static server card with a state swap, a travelling packet through a lens, and a camera push with a reverse morph. Chosen: camera push with a reverse morph, because the transformation is the teaching action.
    const tServer = ctx.cue("The server unscrambles");
    const tSame = ctx.cue("same key");
    const board = ctx.held("board");
    const packet = ctx.held("packet");
    const keys = ctx.held("key_slots");
    const copy = ctx.held("copy");
    ctx.held("cert");
    ctx.held("label_https");

    // @form server_focus: the server-side board area where unreadable blocks become the original form
    Loom.cam.frame(board, { x: 120, y: 260, w: 1680, h: 640 }, ctx.start, 0.55, { margin: 24, ease: "editorial" });

    // The watcher has only noise. It recedes before the endpoint makes the packet readable again.
    m.exit(copy, tServer, "recede");

    // @form server_lens: the blue server key acts as the lens for the reverse transformation
    // The preceding held group exposes no key-slot handle, so its visible server key remains the lens.
    m.exit(packet, tServer, "recede");
    const serverPacket = ctx.el("server_packet", { x: 1100, y: 470, w: 200, h: 120, kind: "card", exit: "recede" });
    const serverPacketHandle = Loom.lesson.packet(ctx, serverPacket.inner, {});
    serverPacketHandle.setState("scrambled", ctx.start);
    m.reveal(serverPacket, tServer + 0.04, { dy: 0 });
    m.travel(serverPacket, tServer + 0.08, { x: 370, y: 60, dur: 0.9 });
    serverPacketHandle.morph(0, tServer + 0.22, 0.9);

    // @form readable_packet: the original two readable form rows resting in the server inbox
    Loom.treat.label(ctx, "unscrambled_label_treat", { x: 1480, y: 516, text: "Unscrambled", to: [1570, 590], tone: "pos", role: "label", t: tSame + 0.04 });

    // @form shared_key_pulse: both matching endpoint keys pulse once to show that the same secret works at each end
    // The visible endpoint keys remain in place while the readable packet is named.
  },
});
