// @design temporary_values_cross: two visible temporary values cross in opposite directions, while the watcher records copies but cannot fill its slot
Loom.scene("b07", {
  build(ctx) {
    const { kit, m } = ctx;
    // Treatment A: static values beside the watcher. Treatment B: a camera crop of the slot. Treatment C, chosen: two values cross the open path and leave evidence in the tray.
    const tSend = ctx.cue("Each side sends a temporary value.");
    const tCopy = ctx.cue("The watcher copies both,");
    const tFail = ctx.cue("yet cannot practically work out the key.");

    // Continue the established board. The medium board view avoids cropping held browser and certificate words.
    const board = ctx.held("board");
    const cert = ctx.held("cert");
    const keySlots = ctx.held("key_slots");
    const watcherSlot = ctx.held("watcher_key_slot");
    const watcherLabel = ctx.held("label_watcher");
    const keyLabel = ctx.held("label_key");
    board.handle.setState("band_mid", tSend);
    Loom.set(board.inner, { attr: { "data-bleed": "41.171-49.707" } }, ctx.start);
    m.exit(keyLabel, tSend, "wipe");

    // @form token_a: slate temporary-value pill moving from the browser end to the server end
    const tokenA = ctx.el("token_a", { x: 510, y: 452, w: 260, h: 56, kind: "token", exit: "recede" });
    kit.pill(tokenA.inner, 0, 0, 260, 56, { fill: "accent3", shadow: false });
    kit.text(tokenA.inner, "Temporary value", { role: "label", x: 12, y: 0, w: 236, h: 56, align: "center", valign: "middle", weight: 700, color: "onAccent" });

    // @form token_b: slate temporary-value pill moving from the server end to the browser end
    const tokenB = ctx.el("token_b", { x: 1150, y: 452, w: 260, h: 56, kind: "token", exit: "recede" });
    kit.pill(tokenB.inner, 0, 0, 260, 56, { fill: "accent3", shadow: false });
    kit.text(tokenB.inner, "Temporary value", { role: "label", x: 12, y: 0, w: 236, h: 56, align: "center", valign: "middle", weight: 700, color: "onAccent" });
    m.reveal(tokenA, tSend, { dy: 0, dur: 0.3 });
    m.reveal(tokenB, tSend + 0.12, { dy: 0, dur: 0.3 });
    m.travel(tokenA, tSend + 0.45, { x: 640, y: 0, dur: 1.65 });
    m.travel(tokenB, tSend + 0.45, { x: -640, y: 0, dur: 1.65 });

    // @form tray_values: two quiet slate copies held in the watcher's existing tray
    const trayValues = ctx.el("tray_values", { x: 860, y: 610, w: 200, h: 120, kind: "value", exit: "recede" });
    kit.pill(trayValues.inner, 18, 30, 76, 28, { fill: "accent3", shadow: false });
    kit.pill(trayValues.inner, 106, 62, 76, 28, { fill: "accent3", shadow: false });
    kit.icon(trayValues.inner, "copy", { x: 42, y: 34, size: 20, color: "onAccent" });
    kit.icon(trayValues.inner, "copy", { x: 130, y: 66, size: 20, color: "onAccent" });
    m.reveal(trayValues, tCopy + 0.08, { dy: 8, dur: 0.45 });

    // The watcher has both values, but its own slot receives no key.
    // b06 did not expose the kit handle needed for watcher_shake, so the held empty slot is given the scene's one emphasis instead.
    m.emphasis(watcherSlot, tFail + 0.1);
  },
});
