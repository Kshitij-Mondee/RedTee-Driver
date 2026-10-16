// @design onward_route: a moving trace carries a signal from one enclosure to the next
// Treatments: static route with signalling; travelling marks on the shared sheet; a close tracking shot. Choose travelling marks so the cause remains visible beside its destination.
Loom.scene("b14", {
  build(ctx) {
    const W=ctx.engine, D=W.sheet(ctx);
    const tWater=ctx.cue("Second link: the water");
    const tLeave=ctx.cue("Leaving the coil");
    const tWarm=ctx.cue("warmer now");
    // @form shared_section: equipment returns already drafted in one coordinate system
    const sheet=ctx.el("section_sheet",{x:0,y:0,w:1920,h:960,kind:"scenery",exit:"recede"});
    function group(name,kind){return ctx.el(name,{x:0,y:0,w:1920,h:960,parent:sheet.inner,kind:kind||"scenery",exit:"none"});}
    const hallE=group("hall_section");
    const hall=Loom.lesson.hall_section(ctx,hallE.inner,{drafted:true,state:"contained"});hallE.handle=hall;
    const containment=group("containment");
    containment.inner.appendChild(hall.containment.outer);
    containment.handle={root:hall.containment,setState:function(s,t){hall.setState(s,t);}};
    const crahE=group("crah_row");crahE.handle=Loom.lesson.crah_row(ctx,crahE.inner,{drafted:true});
    const waterE=group("water_loop");
    const water=Loom.lesson.water_loop(ctx,waterE.inner,{drafted:true});waterE.handle=water;
    const roofE=group("roof_cooler");roofE.handle=Loom.lesson.roof_cooler(ctx,roofE.inner,{drafted:true,state:"running"});
    const chainE=group("heat_chain");
    const chain=Loom.lesson.heat_chain(ctx,chainE.inner,{drafted:true});chainE.handle=chain;
    chain.setState("outlined",ctx.start);
    chain.highlight(2,tWater,tLeave-ctx.style.dur("exit"));
    // @form quiet_air: the earlier links remain in motion without a new emphasis
    const airE=group("quiet_air","connector");
    const air=Loom.lesson.flows(ctx,airE.inner,{demo:false});
    air.airArrow(air.anchors.floorPlenum,{running:true,speed:90});
    air.warmAir(air.anchors.ceilingReturn,{running:true,speed:90});
    air.colourChange([[850,560],[780,560],[700,560],[560,560]],{running:true}).setWarm(ctx.start);
    air.colourChange([[850,610],[930,610],[1010,610],[1140,610]],{running:true}).setWarm(ctx.start);
    // @form warm_return: the existing pipe changes emphasis beneath travelling amber marks
    const pipeE=group("return_pipe","connector");
    const flow=Loom.lesson.flows(ctx,pipeE.inner,{demo:false});
    const route=flow.waterMarks(water.anchors.returnPipe,{warm:true,running:false,speed:180});
    route.start(tLeave);
    ctx.m.reveal(pipeE,tLeave,{dy:0,dur:ctx.style.dur("enter")});
    water.returnPipe.inner.querySelectorAll("path").forEach(p=>Loom.tl.set(p,{stroke:ctx.c("accent")},tLeave));
    pipeE.handle={root:pipeE,route:route,setState:function(s,t){if(s==="running")route.start(t);else route.stop(t);}};
    // @form pipe_note: a short leader ends on the long unobstructed return run
    ctx.kit.fit("warmer water",{role:"label",w:280,h:48,maxLines:1});
    const label=ctx.el("label_warmer",{x:1450,y:355,w:280,h:48,parent:sheet.inner,kind:"text",exit:"wipe"});
    D.letter(label,"warmer water",{role:"label",size:24,align:"center",valign:"middle",at:tWarm,by:tWarm+ctx.style.dur("enter"),quick:true,pen:"ink"});
    const leader=ctx.el("warmer_leader",{x:1730,y:379,w:70,h:161,parent:sheet.inner,kind:"connector",exit:"wipe"});
    D.draw(leader,W.path([[0,0],[70,21],[70,161]]),{at:tWarm,by:tWarm+ctx.style.dur("enter"),parallel:true,pen:"muted"});
    Loom.cam.frame(sheet,{x:0,y:0,w:1920,h:1080},ctx.start,ctx.style.dur("move"),{margin:0});
  }
});
