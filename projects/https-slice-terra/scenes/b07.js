// @design temporary_values_cross: two copied values cross an open path while the watcher remains without a key.
// Treatments considered: (1) static values beside an empty slot, (2) values crossing through a watcher, (3) a dense certificate overlay. Chosen: crossing values, because the travel and copied tray make the watcher’s limit visible.
Loom.scene("b07", {
  build(ctx, props) {
    const kit = ctx.kit;
    const m = ctx.m;
    const tSides = ctx.cue("Each side sends a temporary value.");
    const tValue = ctx.cue("temporary value");
    const tCopies = ctx.cue("The watcher copies both,");
    const tNoKey = ctx.cue("yet cannot practically work out the key.");

    // The board, certificate and watcher label continue unchanged from b06.
    const board = ctx.held("board");
    const cert = ctx.held("cert");
    const labelWatcher = ctx.held("label_watcher");
    // The continuing board intentionally bleeds at the camera edge while the path remains centred.
    board.outer.setAttribute("data-bleed", "41.171-49.707");

    // The three empty slots continue from b06. The watcher slot is intentionally never filled.
    const keySlots = ctx.held("key_slots");
    const slots = keySlots.handle;
    slots.setState("empty", ctx.start);

    // @form token_a: browser temporary value travelling to the server slot
    const tokenA = ctx.el("token_a", { x: 495, y: 432, w: 290, h: 68, kind: "token", exit: "recede" });
    kit.pill(tokenA.inner, 0, 0, 290, 68, { fill: "accent3", shadow: false });
    kit.text(tokenA.inner, "Temporary value", { role: "label", x: 14, y: 0, w: 262, h: 68, align: "center", valign: "middle", color: "onAccent", weight: 700, size: 34, maxLines: 1 });

    // @form token_b: server temporary value travelling to the browser slot
    const tokenB = ctx.el("token_b", { x: 1095, y: 502, w: 290, h: 68, kind: "token", exit: "recede" });
    kit.pill(tokenB.inner, 0, 0, 290, 68, { fill: "accent3", shadow: false });
    kit.text(tokenB.inner, "Temporary value", { role: "label", x: 14, y: 0, w: 262, h: 68, align: "center", valign: "middle", color: "onAccent", weight: 700, size: 34, maxLines: 1 });

    // @form tray_values: the watcher keeps two small copies rather than a key
    const trayValues = ctx.el("tray_values", { x: 860, y: 610, w: 200, h: 120, kind: "value", exit: "recede" });
    const copied = Loom.lesson.packet(ctx, trayValues.inner, { variant: "tokens", w: 200, h: 120 });

    Loom.cam.frame(keySlots, { x: 0, y: 0, w: 1920, h: 1080 }, ctx.start, 1.1, { margin: 0, cy: 500, maxScale: 1 });
    m.reveal(tokenA, tSides, { dy: 10, dur: 0.35 });
    m.reveal(tokenB, tSides + 0.1, { dy: 10, dur: 0.35 });
    m.travel(tokenA, tValue + 0.15, { x: 600, y: 42, dur: 1.35 });
    m.travel(tokenB, tValue + 0.15, { x: -600, y: -42, dur: 1.35 });
    m.reveal(trayValues, tCopies + 0.08, { dy: 8, dur: 0.42 });
    copied.setState("copy_tokens", tCopies + 0.08);
    slots.setState("watcher_shake", tNoKey + 0.12);
  }
});
