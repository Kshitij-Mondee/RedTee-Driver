// @design batch_boundary: a boundary separates the moving group from an arrival that must wait
// Treatments: static boundary with signalling; camera close-up of a clock; chosen late arrival sliding into a held group, because crossing the boundary changes its place.
Loom.scene("b08", {
  build(ctx) {
    const board=ctx.held("board"), lamp=ctx.held("lamp"), queue=ctx.held("pick_queue");
    const world=board.handle, B=world.B, k=ctx.kit;
    const cut=ctx.cue("Miss the cut-off"), next=ctx.cue("waits for the next cycle");
    if(queue) {
      queue.exit="recede";
      queue.handle.items.forEach(function(it){it.exit(ctx.end,{kind:"sink"});});
    }
    B.camera(ctx.start,[8.5,11.5,0.15],{zoom:2.6,dur:ctx.style.dur("draw")});
    // @form batch_divider: the queue has a visible closing boundary
    const cutoff=ctx.el("cutoff",{x:1090,y:500,w:220,h:220,kind:"connector",exit:"recede"});
    const line=k.line(cutoff.inner,200,20,20,200,{stroke:"line",sw:3,dash:"10 8"});
    ctx.m.draw(line,cut+ctx.style.dur("draw"),{dur:ctx.style.dur("draw")});
    Loom.treat.label(ctx,"cutoff_pin",{x:1300,y:360,text:"Cut-off",to:[1270,530],tone:"line",role:"label",t:cut+ctx.style.dur("draw")});
    Loom.treat.badge(ctx,"cutoff_clock",{x:1230,y:360,icon:"clock",size:56,tone:"line",t:cut+ctx.style.dur("draw")});
    // @form late_order: a neutral arrival slips into the following group
    const late=ctx.el("late_order",{x:1220,y:650,w:160,h:100,kind:"token",exit:"recede"});
    late.handle=B.put("slab",{name:"late_order",x:10.5,y:12.5,z:0.15,w:0.55,d:0.38,h:0.035,tok:"surface2",at:next,enter:"drop"});
    late.handle.move(next+ctx.style.dur("enter"),{to:[10.5,11.3,0.15],dur:ctx.style.dur("move")});
    late.handle.exit(ctx.end,{kind:"sink"});
    // @form waiting_batch: the hold belongs to the next group, never to staff
    const held=ctx.el("held_mark",{x:1120,y:510,w:390,h:200,kind:"instrument",exit:"recede"});
    held.handle=Loom.lesson.held_mark(ctx,held.inner,{label:"Next batch"});
    ctx.m.reveal(held,next,{dur:ctx.style.dur("enter")});
  }
});
