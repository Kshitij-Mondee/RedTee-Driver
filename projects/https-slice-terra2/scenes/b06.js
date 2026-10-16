// @design key_slots: a certificate folds into proof while three empty destinations define a secret that does not travel
Loom.scene("b06", {
  build(ctx) {
    const { kit, m } = ctx;
    // Treatments: (A) static slots, (B) keys travelling, (C) chosen, the certificate folds away as empty slots establish the mechanism.
    const tNext = ctx.cue("Next, both ends need a shared key.");
    const tShared = ctx.cue("shared key");
    const tNever = ctx.cue("never sent");

    const board = ctx.held("board");
    board.handle.setState("band_mid", tNext);
    const cert = ctx.held("cert");
    Loom.cam.frame(board, { x: 0, y: 0, w: 1920, h: 900 }, tNext, 1.3, { margin: 0, cy: 470, maxScale: 1 });
    cert.handle.setState("badge", tNext);
    m.travel(cert, tNext, { x: -1240, y: -260, scale: 1, dur: ctx.style.dur("enter") + 0.2 });

    // @form key_slots: three empty destinations for the future shared key
    const slots = ctx.el("key_slots", { x: 600, y: 440, w: 720, h: 270, kind: "instrument", exit: "recede" });
    const browser = ctx.el("browser_key_slot", { x: 0, y: 0, w: 80, h: 80, kind: "node", parent: slots.inner, exit: "none" });
    const server = ctx.el("server_key_slot", { x: 640, y: 0, w: 80, h: 80, kind: "node", parent: slots.inner, exit: "none" });
    const watcher = ctx.el("watcher_key_slot", { x: 510, y: 190, w: 80, h: 80, kind: "node", parent: slots.inner, exit: "none" });
    const bSlot = Loom.lesson.key_slots(ctx, browser.inner, { which: "browser" });
    const sSlot = Loom.lesson.key_slots(ctx, server.inner, { which: "server" });
    const wSlot = Loom.lesson.key_slots(ctx, watcher.inner, { which: "watcher" });
    bSlot.setState("empty", tShared);
    sSlot.setState("empty", tShared + 0.14);
    wSlot.setState("empty", tNever);
    m.reveal(browser, tShared, { dy: 8 });
    m.reveal(server, tShared + 0.14, { dy: 8 });
    m.reveal(watcher, tNever, { dy: 8 });

    // @form shared_key_label: a compact name attached to the browser destination
    const keyLabel = ctx.el("label_key", { x: 570, y: 370, w: 180, h: 48, kind: "bubble", exit: "wipe" });
    kit.pill(keyLabel.inner, 0, 0, 180, 48, { fill: "accent", shadow: false });
    kit.text(keyLabel.inner, "Shared key", { role: "label", x: 12, y: 0, w: 156, h: 48, align: "center", valign: "middle", size: 28, weight: 700, color: "onAccent" });
    m.reveal(keyLabel, tShared + 0.1, { dy: 8 });

    // @form watcher_label: the established watcher label remains with its empty destination
    const watcherLabel = ctx.held("label_watcher");
    void watcherLabel;

    board.handle.to("pathDim", 0.35, tNever, ctx.style.dur("move"));
  },
});
