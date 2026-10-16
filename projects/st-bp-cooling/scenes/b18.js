// @design sequential_callback: a longer chain reconnects familiar parts, then one mark crosses the whole.
Loom.scene("b18", {
  build(ctx) {
    /* Three treatments: static sheet with sequential signalling; a camera tracking every part; seven replacement close-ups.
       Choose static signalling: the chain and its source remain visible together, with no unnecessary camera travel. */
    const hall = ctx.held("hall_section");
    const crah = ctx.held("crah_row");
    const water = ctx.held("water_loop");
    const roof = ctx.held("roof_cooler");
    const chain = ctx.held("heat_chain");
    ctx.held("containment");
    ctx.held("riser_flow");
    ctx.held("heat_to_sky");
    const server = ctx.cue("Server");
    const air = ctx.cue("air");
    const handler = ctx.cue("air handler");
    const waterT = ctx.cue("water");
    const pump = ctx.cue("pump");
    const chiller = ctx.cue("chiller");
    const outside = ctx.cue("outdoors");
    const handoff = ctx.cue("Each link hands the heat on");
    const flash = ctx.style.dur("enter") * 0.3;
    chain.handle.setCount(7, server);
    chain.handle.setState("lit", server);
    // @form callback_chain: one named link and its corresponding machine are a single highlighted family.
    [server,air,handler,waterT,pump,chiller,outside].forEach((t,i) => {
      chain.handle.highlight(i,t,t+flash);
    });
    hall.handle.highlight(server,server+flash);
    hall.handle.highlight(air,air+flash);
    crah.handle.highlight(1,handler,handler+flash);
    water.handle.highlight("water",waterT,waterT+flash);
    water.handle.highlight("pump",pump,pump+flash);
    water.handle.highlight("chiller",chiller,chiller+flash);
    roof.handle.highlight(outside,outside+flash);
    // @form running_section: the complete sheet remains quietly in operation through recall, with renewed route clocks.
    const sheet = ctx.el("recall_flow_sheet",{x:0,y:0,w:1920,h:960,kind:"scenery",exit:"recede"});
    const flows = Loom.lesson.flows(ctx,sheet.inner,{name:"recall_flows",demo:false,at:ctx.start});
    const A = flows.anchors;
    flows.airArrow(A.floorPlenum,{speed:90});
    flows.warmAir(A.ceilingReturn,{speed:90});
    flows.waterMarks(A.supply,{speed:90});
    flows.waterMarks(A.returnPipe,{warm:true,speed:90});
    flows.waterMarks(A.riser,{warm:true,speed:90});
    flows.heatMarks([1440,70,280,40],{speed:90});
    ctx.m.exit(sheet,ctx.speechEnd-ctx.style.dur("exit"),"recede");
    // @form chain_pulse: a single amber heat mark passes above the labels and disappears at the far end.
    const pulse = ctx.el("chain_pulse",{x:120,y:831,w:18,h:16,kind:"token",exit:"recede"});
    const W = ctx.engine, D = ctx._coolingSheet || (ctx._coolingSheet = W.sheet(ctx));
    D.draw(pulse,W.path([[4,15],[11,11],[4,7],[11,3]]),{at:handoff,by:handoff+ctx.style.dur("enter")*0.3,parallel:true,pen:"accent2"});
    ctx.m.reveal(pulse,handoff,{dy:0,dur:ctx.style.dur("enter")*0.3});
    ctx.m.travel(pulse,handoff,{x:1680,y:0,dur:ctx.speechEnd-handoff-ctx.style.dur("exit")});
    ctx.m.exit(pulse,ctx.speechEnd-ctx.style.dur("exit"),"recede");
  }
});
