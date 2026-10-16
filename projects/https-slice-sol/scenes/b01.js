// @design open_route_carrier: a readable card leaves its origin and stops before an observing aperture
/* Treatments considered: static route with signalling; travelling carrier on a fixed route; camera-followed carrier. Choose travelling carrier because the journey exposes the content, while the wide route preserves context. */
Loom.scene("b01", {
  build(ctx, props) {
    const {kit, m} = ctx;
    const tBuild = ctx.cue("Imagine");
    const tSubmit = ctx.cue("press Submit");
    const tWatcher = ctx.cue("A watcher sits");
    const tPath = ctx.cue("on the path");
    const tQuestion = ctx.cue("What does it see");
    const enter = ctx.style.dur("enter");
    const stagger = ctx.style.dur("stagger");
    // @form fixed_route: the browser, open path, aperture, empty tray and destination stay in one layout
    const board = ctx.el("board", {x:120,y:260,w:1680,h:640,kind:"instrument",exit:"none"});
    const bh = Loom.lesson.path_board(ctx, board.inner, {startHidden:true});
    board.handle = bh;
    bh.setState("idle", ctx.start);
    ["browser","path","watcher","tray","server"].forEach((part,i) => bh.show(part,tBuild+i*stagger,enter));
    bh.setState("submit_pressed",tSubmit);
    bh.aperture(1,tWatcher);
    bh.look(-1,tQuestion);
    // @form readable_carrier: the same two-row card lifts out of the form and travels toward the aperture
    const packet = ctx.el("packet", {x:240,y:363,w:220,h:135,kind:"card",exit:"none"});
    const ph = Loom.lesson.packet(ctx,packet.inner,{scale:1.05});
    packet.handle = ph;
    ph.setState("readable",ctx.start);
    m.reveal(packet,tSubmit,{dy:14,dur:enter});
    m.travel(packet,tSubmit,{x:340,y:57,dur:ctx.style.dur("move")});
    m.travel(packet,tPath,{x:390,y:57,dur:ctx.style.dur("draw")});
    ph.setState("pulse",tPath);
    // @form hanging_name: a white pill identifies the aperture only after its shape is visible
    kit.fit("Watcher",{role:"label",w:180,h:56,maxLines:1,weight:700});
    const watcherLabel = Loom.treat.label(ctx,"label_watcher",{x:960,y:350,text:"Watcher",to:[960,410],tone:"surface",role:"label",as:"pill",t:tWatcher});
    if (watcherLabel) {
      watcherLabel.exit = "none";
    }
  }
});
