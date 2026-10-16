// @design driven_closed_path: one moving hub drives two opposing routes
// Treatments: static sheet with a signalled hub; path tracking; full sheet with moving hub and circulating marks. Choose the third to retain the complete route.
Loom.scene("b15", {
  build(ctx) {
    const W = ctx.engine, D = W.sheet(ctx);
    ctx.held('section_sheet');
    const pumpTime = ctx.cue("Pumps push it");
    const flowTime = ctx.cue("round a closed loop");
    const labelTime = ctx.cue("to the plant room and back");
    ["hall_section", "crah_row", "roof_cooler", "heat_chain", "containment", "return_pipe"].forEach(n => ctx.held(n));
    const loop = ctx.held("water_loop").handle;
    loop.setPump('a', 'running', pumpTime);
    loop.returnPipe.inner.querySelectorAll('path').forEach(p => Loom.tl.set(p,{stroke:ctx.c('line')},pumpTime));
    loop.setPump('b', 'standby', pumpTime);
    // Extend the held impeller's existing drawing, not a second pump.
    Loom.drive((p, raw) => {
      loop.pumps[0].fan.el.inner.setAttribute('transform', 'rotate(' + (raw * (ctx.end-pumpTime) * 240) + ')');
    }, pumpTime, ctx.end-pumpTime, 'linear');
    // @form pump_a: cyan focus ring on the driving hub
    const pump = ctx.el('pump_a', {x:1330,y:700,w:80,h:80,kind:'mark',exit:'recede'});
    D.draw(pump, W.circle(40,40,39), {at:pumpTime,by:pumpTime+ctx.style.dur('enter'),pen:'accent',parallel:true});
    // @form label_pump: leader ends at the hub
    const lp = ctx.el('label_pump', {x:1270,y:610,w:160,h:130,kind:'label',exit:'wipe'});
    ctx.kit.fit('pump',{role:'label',w:136,h:40,maxLines:1});
    D.draw(lp,W.path([[80,50],[80,80],[100,96]]),{at:pumpTime,by:pumpTime+ctx.style.dur('enter'),pen:'accent',parallel:true});
    const pumpWords=ctx.el('pump_words',{x:1282,y:616,w:136,h:40,kind:'text',exit:'wipe'});
    D.letter(pumpWords,'pump',{role:'label',size:24,at:pumpTime,by:pumpTime+ctx.style.dur('enter'),quick:true,parallel:true});
    // @form loop_flow: two exact pipe routes, warm return and cool supply
    const flowEl=ctx.el('loop_flow',{x:0,y:0,w:1920,h:960,kind:'scenery',exit:'recede'});
    const flows=Loom.lesson.flows(ctx,flowEl.inner,{name:'b15_water',demo:false,at:flowTime});
    const supply=flows.waterMarks(loop.anchors.supply,{running:false,speed:150});
    const ret=flows.waterMarks(loop.anchors.returnPipe,{warm:true,running:false,speed:150});
    ctx.m.reveal(flowEl,flowTime,{dy:0,dur:ctx.style.dur('enter')});
    supply.start(flowTime); ret.start(flowTime);
    // @form label_loop: the route named clear of the pipes
    const label=ctx.el('label_loop',{x:670,y:722,w:400,h:40,kind:'text',exit:'wipe'});
    ctx.kit.fit('chilled water loop',{role:'label',w:376,h:40,maxLines:1});
    D.letter(label,'chilled water loop',{role:'label',size:24,at:labelTime,by:labelTime+ctx.style.dur('enter'),quick:true,parallel:true,align:'center'});
  }
});
