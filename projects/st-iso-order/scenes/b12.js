// @design trouble_at_stations: three interruptions occupy separate locations while the subject waits
// Treatments: static signalled cutaway; three isolated insets; chosen sequential solids and rings on the retained warehouse, since accumulation is the failure.
Loom.scene("b12", {
  build(ctx) {
    const open=ctx.cue("What goes wrong here"), wrong=ctx.cue("picks the wrong item"), empty=ctx.cue("shelf slot is empty"), backlog=ctx.cue("backlog builds at peak");
    const board=ctx.held("board"), world=board.handle, B=world.B;
    const lamp=ctx.held("lamp");
    world.frame("warehouseAisle",open,{zoom:3.1,dur:ctx.style.dur("move")*3});
    lamp.handle.item.move(open,{to:world.points.warehouseDoor,dur:ctx.style.dur("move")});
    // The prior beat has already retired the staff role.
    // @form wrong_load: a neutral handling vehicle carries a differently shaped parcel
    const cart=ctx.el("wrong_cart",{x:96,y:84,w:1728,h:846,kind:"token",exit:"sink"});
    cart.handle=B.put("forklift",{x:8.1,y:8.65,z:0.15,l:0.8,w:0.45,lift:0.4,load:false,tok:"steel",inside:world.warehouse,at:wrong,enter:"drop"});
    const odd=B.put("crate",{x:8.1,y:9.2,z:0.55,s:0.4,h:0.65,tok:"steel",inside:world.warehouse,at:wrong,enter:"drop"});
    odd.exit(ctx.end-ctx.style.dur("exit"),{kind:"sink"});
    // @form vacant_shelf: a short empty rack exposes its bare decks
    const vacant=B.put("shelf",{x:6.5,y:8.15,z:0.15,l:0.65,d:0.4,h:1.2,levels:2,goods:"steel",stock:function(){return false;},tok:"steel",inside:world.warehouse,at:empty,enter:"rise"});
    vacant.exit(ctx.end-ctx.style.dur("exit"),{kind:"sink"});
    // @form distinct_holds: three separated rings identify locations rather than staff
    function mark(name,label,x,y,t){
      ctx.kit.fit(label,{role:"label",w:192,h:40,maxLines:1});
      const E=ctx.el(name,{x:x,y:y,w:390,h:200,kind:"instrument",exit:"recede"});
      E.handle=Loom.lesson.held_mark(ctx,E.inner,{label:label});
      ctx.m.reveal(E,t,{dur:ctx.style.dur("enter")});
      ctx.m.exit(E,ctx.end-ctx.style.dur("exit"),"recede");
      return E;
    }
    mark("wrong_item_mark","Wrong item",875,490,wrong);
    mark("empty_slot_mark","Empty slot",700,550,empty);
    mark("peak_backlog_mark","Peak backlog",1120,620,backlog);
    // @form accelerating_backlog: neutral parcels arrive at shortening intervals beside packing
    const stack=ctx.el("backlog_stack",{x:96,y:84,w:1728,h:846,kind:"token",exit:"sink"});
    const units=[];
    for(let i=0;i<6;i++){
      const t=backlog+ctx.style.dur("move")*2*Math.sqrt(i/5);
      const item=B.put("crate",{x:10.15+(i%2)*0.36,y:8.7,z:0.15+Math.floor(i/2)*0.34,s:0.32,h:0.32,tok:"steel",inside:world.warehouse,at:t,enter:"drop"});
      item.exit(ctx.end-ctx.style.dur("exit"),{kind:"sink"});
      units.push(item);
    }
    stack.handle={units:units};
    cart.handle.exit(ctx.end-ctx.style.dur("exit"),{kind:"sink"});
    // The engine has no cutaway restore. Keep the real held board for the next camera flight.
  }
});
