// @design running_system: the whole chain moves while reserve members wait visibly outside the duty path
Loom.scene("b25", {
  build(ctx) {
    // Treatments: static sheet with signalling; tracking along the pipe;
    // chosen: whole-sheet overview with staggered flows, motion makes the chain legible.
    const back = ctx.cue("Back in the quiet hall");
    const moving = ctx.cue("you can see the heat moving out");
    const spares = ctx.cue("with spares standing by");
    const hall = ctx.held("hall_section");
    const crah = ctx.held("crah_row");
    const water = ctx.held("water_loop");
    const roof = ctx.held("roof_cooler");
    const chain = ctx.held("heat_chain");
    ctx.held("containment");
    hall.handle.setState("contained", back);
    crah.handle.setUnit(1,"running",back);
    crah.handle.setUnit(2,"running",back);
    crah.handle.setUnit(3,"standby",back);
    water.handle.setPump("a","running",back);
    water.handle.setPump("b","standby",back);
    water.handle.setLevel(1,back,ctx.style.dur("move"));
    chain.handle.setCount(7,back);
    chain.handle.setState("lit",back);
    roof.handle.setState("running",moving);
    // @form all_flows: independent routes make the full machine visibly continuous
    const all = ctx.el("all_flows",{x:0,y:0,w:1920,h:960,kind:"connector",exit:"none"});
    const f = Loom.lesson.flows(ctx,all.inner,{name:"payoff_flows",demo:false,drafted:true,at:ctx.start});
    all.handle = f;
    const A = f.anchors;
    const supply = f.airArrow(A.floorPlenum,{running:false,speed:85});
    const left = f.colourChange([[850,555],[780,555],[700,555],[560,555],[560,375]],{running:false,speed:75});
    const right = f.colourChange([[850,600],[920,600],[1000,600],[1140,600],[1140,400]],{running:false,speed:75});
    const ret = f.warmAir(A.ceilingReturn,{running:false,speed:95});
    const coolWater = f.waterMarks(A.supply,{running:false,speed:100});
    const warmWater = f.waterMarks(A.returnPipe,{running:false,warm:true,speed:100});
    const riser = f.waterMarks(A.riser,{running:false,warm:true,speed:75});
    const sky = f.heatMarks([1440,85,280,40],{running:false,speed:55});
    supply.start(back);
    left.start(moving); right.start(moving);
    left.setWarm(moving); right.setWarm(moving);
    ret.start(moving);
    coolWater.start(moving+ctx.style.dur("stagger"));
    warmWater.start(moving+ctx.style.dur("stagger"));
    riser.start(moving+ctx.style.dur("move"));
    sky.start(moving+ctx.style.dur("move"));
    // @form spare_outlines: the existing dashed reserve states receive the closing emphasis
    const spare = ctx.el("spare_outlines",{x:0,y:0,w:1920,h:960,kind:"mark",exit:"none"});
    spare.handle = {setState:function(state,t){crah.handle.setUnit(3,"standby",t);water.handle.setPump("b","standby",t);}};
    spare.handle.setState("standby",spares);
    crah.handle.bracket(spares);
    [crah.handle.units[2].states.standby,water.handle.pumps[1].states.standby].forEach(E=>{
      Loom.tl.set(E.inner,{opacity:0.35},back);
      Loom.tween(E.inner,{opacity:0.35},{opacity:1,duration:ctx.style.dur("enter")},spares);
    });
  }
});
