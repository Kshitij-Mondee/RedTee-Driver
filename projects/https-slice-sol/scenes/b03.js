// @design open_promise_above_route: a single unlocked object arrives above an unchanged journey as a future-state promise
Loom.scene("b03", {
  build(ctx, props) {
    const {kit, m} = ctx;
    // Three treatments: static board with signalling; route wipe and open object; travelling full-frame lock.
    // Choose route wipe and open object: it promises a change without prematurely changing the readable message.
    const tFollow = ctx.cue("Follow this request");
    const tNoise = ctx.cue("turns to noise");
    const board = ctx.held("board");
    const packet = ctx.held("packet");
    const copy = ctx.held("copy");
    const watcherLabel = ctx.held("label_watcher");
    // The shared station camera supplies the pull to wide; no local board transform can drift its endpoints.
    packet.handle.setState("pulse", tFollow);
    // Compensate the wide shot's small scale reduction while retaining the exact shared kit instances.
    m.travel(packet,tFollow,{x:870,y:54,scale:1.08,dur:ctx.style.dur("move")});
    m.travel(copy,tFollow,{x:0,y:190,scale:1.08,dur:ctx.style.dur("move")});
    board.handle.hide("path",tFollow,ctx.style.dur("exit"));
    // Restore the same solid path during the join so the certificate beat inherits the board's idle route.
    board.handle.show("path",ctx.speechEnd,ctx.style.dur("exit"));
    board.handle.highlight("watcher", 0, tFollow);
    // @form expected_route: dashed visible spans trace the existing path without drawing over objects
    const route = ctx.el("route", {x:580,y:476,w:760,h:8,kind:"connector",exit:"recede"});
    kit.line(route.inner, 0,4,263,4,{stroke:"line",sw:3,dash:"12 10"});
    kit.line(route.inner, 497,4,530,4,{stroke:"line",sw:3,dash:"12 10"});
    kit.line(route.inner, 752,4,760,4,{stroke:"line",sw:3,dash:"12 10"});
    m.unmask(route,tFollow,{dir:"ltr",dur:ctx.style.dur("draw")});
    // @form open_promise: a generic open shackle is the sole new focal object, not an encryption claim yet
    const padlock = ctx.el("padlock",{x:910,y:200,w:100,h:130,kind:"icon",exit:"recede"});
    padlock.handle = Loom.lesson.padlock(ctx,padlock.inner,{open:true});
    m.unmask(padlock,tNoise,{dir:"ttb",dur:ctx.style.dur("enter")});
    // @form attached_promise_name: the name sits alongside the open object and clear of the watcher label
    kit.fit("Padlock",{role:"label",w:180,h:56,maxLines:1,weight:700});
    Loom.treat.label(ctx,"label_padlock",{x:1100,y:220,text:"Padlock",to:[1010,265],tone:"surface",role:"label",as:"pill",t:tNoise});
  }
});
