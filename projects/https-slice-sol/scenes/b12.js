// @design reverse_gate: an opaque carrier crosses the matching gate and becomes readable again
Loom.scene("b12", {
  build(ctx) {
    // Treatments: static paired states with signalling; reverse gate crossing; enlarged inset.
    // Choose reverse gate crossing to preserve the carrier and demonstrate the inverse action.
    const {kit, m} = ctx;
    const tServer = ctx.cue("The server unscrambles");
    const tReverse = ctx.cue("unscrambles");
    const tSame = ctx.cue("same key");
    const board = ctx.held("board");
    const cert = ctx.held("cert");
    const slots = ctx.held("key_slots");
    const packet = ctx.held("packet");
    const copy = ctx.held("copy");
    const https = ctx.held("label_https");
    const noise = ctx.held("label_noise");
    const watcherLabel = ctx.held("label_watcher2");
    if (noise) m.exit(noise, tServer, "recede");
    if (watcherLabel) m.exit(watcherLabel, tServer, "recede");
    board.handle.highlight("watcher", 0, tServer);
    slots.handle.setState("lens_server", tServer, ctx.style.dur("move"));
    // The carrier's origin remains (230,366); travel offsets put its centre through the gate.
    m.travel(packet, tServer, {x:930, y:54, dur:ctx.style.dur("move")});
    packet.handle.morph(0, tReverse, ctx.style.dur("draw"));
    m.travel(packet, tReverse, {x:1220, y:164, dur:ctx.style.dur("draw")});
    slots.handle.to("lensS", 0, tSame, ctx.style.dur("exit"));
    slots.handle.pulse("both", tSame);
    // @form recovered_verdict: an outcome pill sits below the rack and above the recovered rows
    kit.fit("Unscrambled", {role:"label", w:250, h:52, maxLines:1, weight:700});
    const verdict = Loom.treat.label(ctx, "label_unscrambled", {x:1464, y:470, text:"Unscrambled", tone:"pos", role:"label", as:"pill", t:tSame});
    verdict.exit = "recede";
    [board, cert, slots, packet, copy, https].forEach(E => { if (E) E.exit = "recede"; });
  }
});
