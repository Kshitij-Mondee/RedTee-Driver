// @design packet_through_key: readable card crosses a blue lens and resolves into slate noise
Loom.scene("b10", {
  build(ctx) {
    const { kit, m } = ctx;
    // Treatments: A, a static before-and-after card pair. B, a tube that fills with blocks. C, chosen, one readable packet travels through the key and changes state.
    const tHTTPS = ctx.cue("HTTPS is that request inside a protected channel.");
    const tChannel = ctx.cue("protected channel");
    const tKey = ctx.cue("The key scrambles the form.");
    const tForm = ctx.cue("the form");

    const board = ctx.held("board");
    const cert = ctx.held("cert");
    const keySlots = ctx.held("key_slots");
    const trayValues = ctx.held("tray_values");

    board.handle.setState("tube", tHTTPS, 0.9);
    if (cert && cert.handle) cert.handle.setState("badge", tHTTPS, 0.45);
    if (trayValues) m.exit(trayValues, tHTTPS + 0.15, "recede");
    if (keySlots && keySlots.handle) {
      keySlots.handle.setState("ends_filled", tHTTPS, 0.01);
      keySlots.handle.setState("lens_browser", tKey, 0.45);
    }

    // @form label_https: term pill anchored on the protected tube
    const labelHttps = ctx.el("label_https", { x: 855, y: 398, w: 150, h: 56, kind: "label", exit: "none" });
    kit.pill(labelHttps.inner, 0, 0, 150, 56, { fill: "accent2" });
    kit.text(labelHttps.inner, "HTTPS", { role: "label", x: 12, y: 0, w: 126, h: 56, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "onAccent" });
    m.reveal(labelHttps, tHTTPS + 0.35, { dy: 8, dur: 0.35 });

    // @form packet: readable request card becomes one row of six scrambled slate blocks
    const packet = ctx.el("packet", { x: 250, y: 366, w: 240, h: 120, kind: "value", exit: "none" });
    const packetHandle = Loom.lesson.packet(ctx, packet.inner, { w: 240, h: 120 });
    packetHandle.setState("readable", tHTTPS, 0.01);
    m.reveal(packet, tKey + 0.08, { dy: 12, dur: 0.4 });
    m.travel(packet, tKey + 0.18, { x: 450, y: 54, dur: 1.1 });
    packetHandle.setState("morphing", tForm - 0.9, 0.55);
    packetHandle.setState("scrambled", tForm - 0.35, 0.01);

    // @form label_scrambled: explanatory pill directly below the transformed packet
    const scrambledLabel = ctx.el("label_scrambled", { x: 680, y: 548, w: 400, h: 56, kind: "label", exit: "recede" });
    kit.pill(scrambledLabel.inner, 0, 0, 400, 56, { fill: "surface", stroke: "surface2", sw: 2 });
    kit.text(scrambledLabel.inner, "Scrambled with the key", { role: "label", x: 16, y: 0, w: 368, h: 56, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "ink" });
    m.reveal(scrambledLabel, tForm + 0.05, { dy: 8, dur: 0.35 });

    Loom.cam.frame(board, { x: 60, y: 160, w: 1040, h: 585 }, tChannel, 1.35, { margin: 40, cy: 470, maxScale: 1.25 });
  },
});
