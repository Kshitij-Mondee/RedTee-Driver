// @design watcher_noise_copy: scrambled blocks pass the watcher, whose duplicate becomes equally unreadable noise
Loom.scene("b11", {
  build(ctx) {
    // Treatments: A, static packet and tray. B, a moving packet whose copied twin lands in the tray. C, a large watcher close-up. Chosen B because the familiar copy action now makes the contrast visible.
    const { m } = ctx;
    const T = Loom.treat;
    const tCopy = ctx.cue("The watcher copies the bytes,");
    const tNoise = ctx.cue("but cannot read them.");

    // @form board_camera: the held board remains the world while the camera pushes toward the watcher
    const board = ctx.held("board");
    Loom.cam.frame(board, { x: -500, y: -150, w: 3000, h: 1200 }, tCopy, 1.2, { margin: 0, maxScale: 1 });

    // @form certificate_continuity: the compact certificate remains as prior evidence
    const cert = ctx.held("cert");
    // @form key_slots_continuity: both end keys stay filled while the watcher has none
    const keySlots = ctx.held("key_slots");
    keySlots.handle.setState("ends_filled", ctx.start, 0.2);

    // @form https_label: the held channel label stays attached to the protected route
    const labelHttps = ctx.held("label_https");

    // @form scrambled_packet: the same packet leaves the browser lens as slate blocks and passes the watcher
    const packet = ctx.held("packet");
    packet.handle.setState("scrambled", ctx.start, 0.15);
    m.travel(packet, tCopy + 0.08, { x: 400, y: 0, dur: 1.0 });

    // @form watcher_label: a label identifies the copying point on the path
    const labelWatcher2 = T.label(ctx, "label_watcher2", { x: 890, y: 395, text: "Watcher", to: [960, 500], tone: "accent3", t: tCopy + 0.1 });

    // @form noise_copy: the copied scrambled blocks land in the existing watcher tray
    const copy = ctx.el("copy", { x: 860, y: 610, w: 200, h: 120, kind: "token", exit: "none" });
    const copyHandle = Loom.lesson.packet(ctx, copy.inner, { variant: "noise" });
    copyHandle.setState("copy_noise", tCopy + 0.28);
    m.drop(copy, tCopy + 0.28, { dy: -34, dur: 0.55 });

    // @form noise_label: the tray label names what the copied bytes amount to
    const labelNoise = T.label(ctx, "label_noise", { x: 900, y: 760, text: "Noise", to: [960, 730], tone: "accent3", t: tNoise + 0.08 });
    m.emphasis(copy, tCopy + 0.72);
    void cert;
    void labelHttps;
    void labelWatcher2;
    void labelNoise;
  }
});
