// @design lens_transform: a readable object crosses a narrow gate and becomes opaque blocks
Loom.scene("b10", {
  build(ctx) {
    // Treatments considered: static before/after with signalling; travelling packet with lens morph; split inset magnifier.
    // Chosen: travelling packet, because crossing the shared gate causes the transformation.
    const m = ctx.m, kit = ctx.kit;
    const tHTTPS = ctx.cue("HTTPS");
    const tChannel = ctx.cue("protected channel");
    const tKey = ctx.cue("The key scrambles");
    const tForm = ctx.cue("the form");
    const board = ctx.held("board");
    const cert = ctx.held("cert");
    const slots = ctx.held("key_slots");
    const values = ctx.held("tray_values");
    board.handle.setState("tube", tHTTPS, ctx.style.dur("draw"));
    if (cert && cert.handle) cert.handle.setState("badge", tHTTPS, ctx.style.dur("enter"));
    if (values) m.exit(values, tHTTPS, "recede");
    slots.handle.setState("lens_browser", tKey, ctx.style.dur("move"));
    // @form tube_name: a neutral pill sits above the protected route, not over its travelling contents
    kit.fit("HTTPS", {role:"label", w:180, h:60, maxLines:1, weight:700});
    const label = Loom.treat.label(ctx, "label_https", {x:700, y:358, text:"HTTPS", tone:"muted", role:"label", as:"pill", to:[758,440], t:tHTTPS});
    label.exit = "recede";
    // @form travelling_form: one packet retains its identity through the gate
    const packet = ctx.el("packet", {x:470, y:366, w:240, h:128, kind:"token", exit:"recede"});
    const inset = Loom.svg("g", {}, packet.inner);
    packet.handle = Loom.lesson.packet(ctx, inset, {scale:1});
    inset.setAttribute("transform", "translate(" + ((240-packet.handle.w)/2) + " 0)");
    packet.handle.setState("readable", tKey);
    m.reveal(packet, tKey, {dy:0, dur:ctx.style.dur("enter")});
    m.travel(packet, tKey + ctx.style.dur("enter"), {x:230, y:54, dur:ctx.style.dur("draw")*2});
    packet.handle.setState("morphing", tForm, ctx.style.dur("enter"));
    packet.handle.setState("scrambled", tForm + ctx.style.dur("enter"));
    // @form transformation_name: the result is labelled directly under the waiting blocks
    kit.fit("Scrambled with the key", {role:"label", w:380, h:64, maxLines:1, weight:700});
    Loom.treat.label(ctx, "label_scrambled", {x:650, y:550, text:"Scrambled with the key", tone:"muted", role:"label", as:"pill", t:tForm});
  }
});
