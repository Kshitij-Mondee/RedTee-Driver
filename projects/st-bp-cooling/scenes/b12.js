// @design separate_passages: a returning path is blocked by a closing boundary
// Treatments considered: static before and after signals; shared-sheet flowing leak then closure; paired cutaways. Choose shared-sheet closure because stopping the crossing is the argument.
Loom.scene("b12", {
  build(ctx) {
    const W=ctx.engine, D=W.sheet(ctx), m=ctx.m;
    const tKeep=ctx.cue("Keep the aisles apart");
    const tLeak=ctx.cue("Hot air leaking back");
    const tHot=ctx.cue("makes hot spots");
    const tClose=ctx.cue("Closing one aisle off");
    const tName=ctx.cue("containment");
    // @form shared_sheet: all equipment occupies the same section coordinates
    const sheet=ctx.el("section_sheet",{x:0,y:0,w:1920,h:960,kind:"scenery",exit:"recede"});
    const hallE=ctx.el("hall_section",{x:0,y:0,w:1920,h:960,parent:sheet.inner,kind:"scenery",exit:"none"});
    const hall=Loom.lesson.hall_section(ctx,hallE.inner,{drafted:true,state:"running"}); hallE.handle=hall;
    const crahE=ctx.el("crah_row",{x:0,y:0,w:1920,h:960,parent:sheet.inner,kind:"scenery",exit:"none"});
    crahE.handle=Loom.lesson.crah_row(ctx,crahE.inner,{drafted:true});
    const waterE=ctx.el("water_loop",{x:0,y:0,w:1920,h:960,parent:sheet.inner,kind:"scenery",exit:"none"});
    waterE.handle=Loom.lesson.water_loop(ctx,waterE.inner,{drafted:true});
    const roofE=ctx.el("roof_cooler",{x:0,y:0,w:1920,h:960,parent:sheet.inner,kind:"scenery",exit:"none"});
    roofE.handle=Loom.lesson.roof_cooler(ctx,roofE.inner,{drafted:true,state:"running"});
    const chainE=ctx.el("heat_chain",{x:0,y:0,w:1920,h:960,parent:sheet.inner,kind:"scenery",exit:"none"});
    chainE.handle=Loom.lesson.heat_chain(ctx,chainE.inner,{drafted:true});
    chainE.handle.setState("outlined",ctx.start);
    // @form running_air: supply and return stay on opposite sides of the racks
    function flowGroup(name) {return ctx.el(name,{x:0,y:0,w:1920,h:960,parent:sheet.inner,kind:"connector",exit:"none"});}
    const supplyE=flowGroup("air_supply");
    const supply=Loom.lesson.flows(ctx,supplyE.inner,{demo:false});
    supply.airArrow(supply.anchors.floorPlenum,{running:true});
    const throughE=flowGroup("air_through");
    const through=Loom.lesson.flows(ctx,throughE.inner,{demo:false});
    through.colourChange([[850,560],[780,560],[700,560],[560,560]],{running:true}).setWarm(tKeep);
    through.colourChange([[850,610],[930,610],[1010,610],[1140,610]],{running:true}).setWarm(tKeep);
    const returnE=flowGroup("air_return");
    const ret=Loom.lesson.flows(ctx,returnE.inner,{demo:false});
    ret.warmAir(ret.anchors.ceilingReturn,{running:true});
    // @form crossing_leak: amber crosses the rack tops without crossing the slots
    const leakE=flowGroup("leak");
    const leak=Loom.lesson.flows(ctx,leakE.inner,{demo:false});
    leak.warmAir([[560,470],[560,375],[660,350],[790,350],[815,390],[815,485]],{running:true});
    leak.warmAir([[1140,470],[1140,375],[1040,350],[910,350],[885,390],[885,485]],{running:true});
    m.reveal(leakE,tLeak,{dy:0,dur:ctx.style.dur("enter")});
    leak.setState("stopped",tClose);
    Loom.tween(leakE.inner,{opacity:1},{opacity:0,duration:ctx.style.dur("exit")},tClose);
    // @form upper_slot_warning: only the upper server slots carry the heat warning
    const spots=ctx.el("upper_hot_slots",{x:632,y:438,w:436,h:74,parent:sheet.inner,kind:"mark",exit:"none"});
    D.draw(spots,[].concat(W.rect(0,0,116,30),W.rect(0,44,116,30),W.rect(320,0,116,30),W.rect(320,44,116,30)),{at:tLeak,by:tHot,parallel:true,pen:"accent2"});
    Loom.tween(spots.inner,{opacity:1},{opacity:0,duration:ctx.style.dur("exit")},tClose);
    // @form warning_note: a coral leader identifies the affected upper slots
    ctx.kit.fit("hot spots",{role:"label",w:220,h:48,maxLines:1});
    const hotLab=ctx.el("label_hot_spots",{x:1180,y:350,w:230,h:52,parent:sheet.inner,kind:"text",exit:"wipe"});
    D.letter(hotLab,"hot spots",{role:"label",size:30,at:tHot,by:tHot+ctx.style.dur("enter"),quick:true,pen:"accent3"});
    const hotLeader=ctx.el("hot_spots_leader",{x:1068,y:390,w:112,h:60,parent:sheet.inner,kind:"connector",exit:"none"});
    D.draw(hotLeader,W.path([[112,0],[40,0],[0,60]]),{at:tHot,by:tHot+ctx.style.dur("enter"),parallel:true,pen:"accent3"});
    [hotLab,hotLeader].forEach(E=>Loom.tween(E.inner,{opacity:1},{opacity:0,duration:ctx.style.dur("exit")},tClose));
    // @form closed_boundary: the kit panels close the route that previously crossed
    hall.setState("contained",tClose);
    // The named containment node is the kit's own panel group, not a duplicate.
    m.draw(hall.containment,tClose,{dur:ctx.style.dur("draw")});
    // @form boundary_note: the cyan term stays on the new roof boundary
    ctx.kit.fit("containment",{role:"label",w:280,h:48,maxLines:1});
    const label=ctx.el("label_containment",{x:710,y:330,w:280,h:48,parent:sheet.inner,kind:"text",exit:"wipe"});
    D.letter(label,"containment",{role:"label",size:24,align:"center",valign:"middle",at:tName,by:tName+ctx.style.dur("enter"),quick:true,pen:"accent"});
    const leader=ctx.el("containment_leader",{x:850,y:378,w:12,h:32,parent:sheet.inner,kind:"connector",exit:"none"});
    D.draw(leader,W.line(0,0,0,32),{at:tName,by:tName+ctx.style.dur("enter"),parallel:true,pen:"accent"});
    Loom.cam.frame(sheet,{x:0,y:0,w:1920,h:1080},ctx.start,ctx.style.dur("move"),{margin:0});
  }
});
