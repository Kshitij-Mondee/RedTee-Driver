// @design empty_endpoints: a verified document contracts into a receipt while vacant sockets mark a secret that does not travel
// Three treatments: static sockets with a path signal; a socket close-up; a continuous document contraction on the wide board. Choose continuous contraction so the checked object stays the same object.
Loom.scene("b06", {
  build(ctx) {
    const tNext = ctx.cue("Next");
    const tKey = ctx.cue("shared key");
    const tNever = ctx.cue("never sent");
    const board = ctx.held("board");
    const cert = ctx.held("cert");
    const watcher = ctx.held("label_watcher");
    // The row annotations leave as their document contracts, rather than riding into the badge.
    ctx.m.exit(ctx.held("label_signer"), tNext, "wipe");
    ctx.m.exit(ctx.held("label_name"), tNext, "wipe");
    ctx.m.exit(ctx.held("label_date"), tNext, "wipe");
    const moveDur = ctx.style.dur("move");
    if (watcher) Loom.tween(watcher.life, {x:0,y:0}, {x:-190,y:-115,duration:moveDur,ease:"editorial"}, tNext, {kind:"travel",name:"watcher_label_clearance"});
    // @form checked_receipt: the checked card becomes a small retained badge
    if (cert && cert.handle) {
      cert.handle.setState("badge", tNext, ctx.style.dur("draw"));
      Loom.tween(cert.life, {x:0,y:0}, {x:-470,y:-10,duration:ctx.style.dur("draw"),ease:"editorial"}, tNext, {kind:"travel",name:"cert_badge_position"});
    }
    // @form empty_sockets: only the two endpoints can hold the shared secret
    const slots = ctx.el("key_slots", {x:0,y:0,w:1920,h:1080,kind:"instrument",exit:"none"});
    const h = Loom.lesson.key_slots(ctx, slots.inner, {which:"all",startHidden:true});
    slots.handle = h;
    h.setState("empty", ctx.start);
    h.show("browser", tKey, moveDur);
    h.show("server", tKey, moveDur);
    // @form goal_label: the name is adjacent to its still vacant socket
    ctx.kit.fit("Shared key", {role:"label",w:240,h:60,maxLines:1,weight:700});
    Loom.treat.label(ctx, "label_key", {x:640,y:365,text:"Shared key",to:[640,440],tone:"ink",role:"label",as:"pill",t:tKey});
    // @form unused_route: nothing crosses the route when the absence is named
    if (board && board.handle) board.handle.to("pathDim", 0.45, tNever, moveDur);
    h.show("watcher", tNever, moveDur);
  }
});
