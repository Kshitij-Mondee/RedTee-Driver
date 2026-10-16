// @design paired_reveal: matching secrets land only at the two ends, with an empty third slot.
Loom.scene("b08", {
  build(ctx, props) {
    // Treatments considered: static pair with signalling; travelling values; simultaneous slot reveal.
    // Choose simultaneous slot reveal: the two ends acquire the same thing together, not by sending it.
    const kit = ctx.kit;
    const tEnds = ctx.cue("Both ends");
    const tKey = ctx.cue("same key");
    const board = ctx.held("board");
    const cert = ctx.held("cert");
    const slots = ctx.held("key_slots");
    const a = ctx.held("token_a");
    const b = ctx.held("token_b");
    const tray = ctx.held("tray_values");
    const watcher = ctx.held("label_watcher");
    // Board framing belongs to the shared station camera, not a local transform of the board.
    if (a) ctx.m.exit(a, tEnds, "recede");
    if (b) ctx.m.exit(b, tEnds, "recede");
    if (slots && slots.handle) slots.handle.setState("ends_filled", tKey, ctx.style.dur("enter"));
    if (tray && tray.handle) tray.handle.to("dim", 1, tKey, ctx.style.dur("move"));
    // Only the shared keys keep the saturated accent. Recolour the held context, never redraw it.
    if (board) Loom.hold.heat(board, ctx.start, {from:"accent", to:"accent3", dur:ctx.style.dur("move"), name:"submit_context"});
    // @form twin_leaders: two neutral leaders end at the two slots and avoid the watcher.
    const leads = ctx.el("same_key_leaders", {x:638,y:332,w:644,h:110,kind:"connector",exit:"recede"});
    kit.path(leads.inner, "M242 2 L2 108 M402 2 L642 108", {fill:"none",stroke:"muted",sw:2,shadow:false});
    ctx.m.draw(leads, tKey, {dur:ctx.style.dur("move")});
    // @form shared_key_label: one neutral pill names the matching pair above the watcher label.
    kit.fit("Same key", {role:"label",w:220,h:60,maxLines:1,weight:700});
    Loom.treat.label(ctx, "label_same", {x:860,y:272,text:"Same key",tone:"muted",role:"label",as:"pill",t:tKey});
  }
});
