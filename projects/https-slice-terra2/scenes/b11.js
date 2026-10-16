// @design watcher_noise_copy: a watcher duplicates scrambled blocks into its tray, where they become noise
Loom.scene("b11", {
  build(ctx) {
    const { kit, m } = ctx;
    // Treatments considered: static noisy tray, moving packet beside watcher, and a tray close-up. Chosen: moving packet beside watcher, because the repeated copy action makes the contrast with b02 visible.
    const tCopies = ctx.cue("The watcher copies the bytes,");
    const tNoise = ctx.cue("but cannot read them.");

    // @form path_board: fixed network route held from the prior protected-channel scene
    const board = ctx.held("board");
    const cert = ctx.held("cert");
    const keySlots = ctx.held("key_slots");
    const packet = ctx.held("packet");
    const priorHttps = ctx.held("label_https");
    const priorScrambled = ctx.held("label_scrambled");


    board.handle.setState("tube", ctx.start, 0.01);
    packet.handle.setState("scrambled", ctx.start, 0.01);
    if (cert && cert.handle) cert.handle.setState("badge", ctx.start, 0.01);
    if (keySlots && keySlots.handle) keySlots.handle.setState("ends_filled", ctx.start, 0.01);
    if (priorHttps) m.travel(priorHttps, tCopies + 0.05, { x: -245, y: 0, dur: 0.4 });
    if (priorScrambled) m.exit(priorScrambled, ctx.start + 0.05, "recede");


    // @form label_watcher2: pill names the box that makes the copy
    const watcherLabel = ctx.el("label_watcher2", { x: 810, y: 350, w: 180, h: 54, kind: "label", exit: "recede" });
    kit.pill(watcherLabel.inner, 0, 0, 180, 54, { fill: "accent2", shadow: true });
    kit.text(watcherLabel.inner, "Watcher", { role: "label", x: 12, y: 0, w: 156, h: 54, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "onAccent", size: 28 });

    // @form copy: a second packet becomes the watcher's grey noise evidence in the tray
    const copy = ctx.el("copy", { x: 860, y: 610, w: 200, h: 120, kind: "token", exit: "none" });
    const copyHandle = Loom.lesson.packet(ctx, copy.inner, { variant: "noise", startHidden: true });
    copyHandle.setState("scrambled", tCopies + 0.18, 0.01);
    copyHandle.setState("copy_noise", tNoise + 0.08, 0.32);

    // @form label_noise: pill identifies the grey copy only after it has settled
    const noiseLabel = ctx.el("label_noise", { x: 880, y: 550, w: 160, h: 54, kind: "label", exit: "recede" });
    kit.pill(noiseLabel.inner, 0, 0, 160, 54, { fill: "accent3", shadow: true });
    kit.text(noiseLabel.inner, "Noise", { role: "label", x: 12, y: 0, w: 136, h: 54, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "onAccent", size: 28 });

    m.reveal(watcherLabel, tCopies + 0.04, { dy: 8, dur: 0.35 });
    board.handle.highlight("watcher", 1, tCopies + 0.08);
    board.handle.aperture(1, tCopies + 0.12);
    m.travel(packet, tCopies + 0.12, { x: 400, y: -112, dur: 0.9 });
    m.drop(copy, tCopies + 0.18, { dy: -54, dur: 0.42 });
    m.reveal(noiseLabel, tNoise + 0.34, { dy: 8, dur: 0.35 });
  },
});
