// @design passed_and_parked: one subject proceeds while a neutral counterpart stops beside the same gate
// Treatments: static contrasting trays with signalling; two parallel travelling cards; chosen retained checks and a short side-slide, since passing and holding are different outcomes at one place.
Loom.scene("b06", {
  build(ctx) {
    const board=ctx.held("board"), world=board.handle, B=world.B;
    world.frame('office',ctx.start,{zoom:5,dur:0.001});
    const lamp=ctx.held("lamp"), checks=ctx.held("check_card");
    const fraud=ctx.cue("Fraud"), address=ctx.cue("address checks"), hold=ctx.cue("hold an order");
    // @form retained_check_rows: new rows occupy the existing card on this beat's clock
    const rows=Loom.svg("g",{opacity:0},checks.inner), k=ctx.kit;
    k.rect(rows,8,8,524,189,{fill:"surface",r:6});
    k.fit("Address check",{role:"body",w:390,h:52,maxLines:1});
    k.text(rows,"Fraud check",{x:90,y:26,w:420,h:52,role:"body",color:"ink",maxLines:1});
    const second=Loom.svg("g",{opacity:0},rows);
    k.text(second,"Address check",{x:90,y:118,w:420,h:52,role:"body",color:"ink",maxLines:1});
    Loom.tl.set(rows,{opacity:0},ctx.start);
    Loom.tl.set(rows,{opacity:1},fraud);
    Loom.tl.set(second,{opacity:0},ctx.start);
    Loom.tl.set(second,{opacity:1},address);
    Loom.treat.mark(ctx,"fraud_tick",{x:324,y:358,size:42,kind:"yes",on:checks,t:fraud});
    Loom.treat.mark(ctx,"address_tick",{x:324,y:450,size:42,kind:"yes",on:checks,t:address});
    checks.exit="displace";
    lamp.handle.item.move(address,{by:[0.9,0,0],dur:ctx.style.dur("move")});
    // @form parked_counterpart: the other order diverts into a side tray
    const ghost=ctx.el("ghost_order",{x:720,y:540,w:300,h:260,kind:"token",exit:"sink"});
    const tray=B.put("plate",{name:"held_tray",x:4.2,y:10.9,w:1.2,d:0.8,h:0.1,tok:"steel",top:"surface",dashed:true,at:hold,enter:"rise"});
    const order=B.put("slab",{name:"ghost_order_item",x:4.3,y:12.3,z:0.15,w:0.65,d:0.45,h:0.05,tok:"steel",at:hold,enter:"draw"});
    order.move(hold,{by:[0,-1.2,0],dur:ctx.style.dur("move")});
    ghost.handle={item:order,tray:tray};
    // @form hold_location: a pause belongs to a place, never to a person
    const mark=ctx.el("held_mark",{x:1250,y:730,w:390,h:200,kind:"instrument",exit:"iris"});
    mark.handle=Loom.lesson.held_mark(ctx,mark.inner,{label:"Held"});
    ctx.m.reveal(mark,hold+ctx.style.dur("move"),{dur:ctx.style.dur("enter")});
    order.exit(ctx.end,{kind:"sink"});
    tray.exit(ctx.end,{kind:"sink"});
  }
});
