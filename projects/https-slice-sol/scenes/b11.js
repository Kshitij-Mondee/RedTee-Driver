// @design opaque_duplicate: the same branching motion now leaves an unreadable retained twin
Loom.scene("b11", {
  build(ctx) {
    // Treatments: static twins with signalling; moving split into tray; magnified noise inset.
    // Choose moving split to mirror the earlier readable copy without changing the board.
    const {kit, m} = ctx;
    const tWatch = ctx.cue("The watcher copies");
    const tCopy = ctx.cue("copies the bytes");
    const tNoise = ctx.cue("cannot read them");
    const board = ctx.held("board");
    const cert = ctx.held("cert");
    const slots = ctx.held("key_slots");
    const packet = ctx.held("packet");
    const https = ctx.held("label_https");
    const scrambled = ctx.held("label_scrambled");
    if (scrambled) m.exit(scrambled, tWatch, "recede");
    // The medium watcher shot deliberately crops endpoint cards, never the copied pattern.
    board.inner.setAttribute("data-bleed", ctx.start + "-" + ctx.end);
    board.handle.highlight("watcher", 1, tWatch);
    slots.handle.to("lensB", 0, tWatch, ctx.style.dur("exit"));
    // @form attached_observer: one neutral name belongs to the aperture box
    kit.fit("Watcher", {role:"label", w:190, h:56, maxLines:1, weight:700});
    Loom.treat.label(ctx, "label_watcher2", {x:882, y:350, text:"Watcher", tone:"surface", role:"label", as:"pill", to:[960,410], t:tWatch});
    // The held source travels by offsets from its original (230,366) box.
    m.travel(packet, tWatch, {x:630, y:54, dur:ctx.style.dur("move")});
    m.travel(packet, tCopy, {x:870, y:54, dur:ctx.style.dur("move")});
    // @form retained_noise: the copied pattern branches downward into the same tray
    const copy = ctx.el("copy", {x:860, y:420, w:200, h:128, kind:"token", exit:"recede"});
    const inset = Loom.svg("g", {transform:"translate(0 10)"}, copy.inner);
    copy.handle = Loom.lesson.packet(ctx, inset, {scale:200/240, variant:"noise"});
    copy.handle.setState("scrambled", tCopy, ctx.style.dur("exit"));
    m.reveal(copy, tCopy, {dy:0, dur:ctx.style.dur("exit")});
    m.travel(copy, tCopy, {x:0, y:190, dur:ctx.style.dur("move")});
    copy.handle.setState("copy_noise", tNoise, ctx.style.dur("enter"));
    m.emphasis(copy, tNoise);
    // @form unreadable_verdict: the label sits at the tray rim, above its retained pattern
    kit.fit("Noise", {role:"label", w:150, h:52, maxLines:1, weight:700});
    Loom.treat.label(ctx, "label_noise", {x:900, y:592, text:"Noise", tone:"surface", role:"label", as:"pill", t:tNoise});
  }
});
