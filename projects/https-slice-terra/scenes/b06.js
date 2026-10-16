// @design certificate_to_key_slots: a verified certificate reduces to a compact badge, making room for three empty places where a shared secret will belong
Loom.scene("b06", {
  build(ctx) {
    const { kit, m } = ctx;
    // Treatment A: hold the full certificate and overlay slots, rejected because the next idea has no room.
    // Treatment B: pull back as the checked certificate becomes a badge, then reveal the three empty slots, chosen.
    // Treatment C: cut to an isolated key diagram, rejected because it breaks the continuous board.
    const tNext = ctx.cue("Next, both ends need a shared key.");
    const tShared = ctx.cue("shared key");
    const tNever = ctx.cue("never sent");

    const board = ctx.held("board");
    const cert = ctx.held("cert");
    board.handle.setState("band_mid", ctx.start);
    cert.handle.setState("badge", tNext);
    m.travel(cert, tNext, { x: -260, y: -207, dur: 0.72 });

    // @form key_slots: three empty swap positions, one at each endpoint and one for the watcher
    const slots = ctx.el("key_slots", { x: 0, y: 0, w: 1920, h: 1080, kind: "instrument", exit: "recede" });
    const slotsHandle = Loom.lesson.key_slots(ctx, slots.inner, { which: "all" });
    slotsHandle.setState("empty", tShared);
    m.reveal(slots, tShared, { dy: 8, dur: 0.55 });

    // @form shared_key_label: a compact pill names the blue secret that will occupy the end slots
    const keyLabel = ctx.el("label_key", { x: 540, y: 380, w: 200, h: 52, kind: "bubble", exit: "recede" });
    kit.pill(keyLabel.inner, 0, 0, 200, 52, { fill: "accent2", shadow: false });
    kit.text(keyLabel.inner, "Shared key", { role: "label", x: 14, y: 0, w: 172, h: 52, align: "center", valign: "middle", color: "onAccent", weight: 700, size: 30 });
    m.reveal(keyLabel, tShared + 0.14, { dy: 8, dur: 0.45 });

    // The watcher label is already a held board label from b01 and remains with its empty slot.
    const watcherLabel = ctx.held("label_watcher");

    board.handle.to("pathDim", 0.3, tNever, ctx.style.dur("move"));
  },
});
