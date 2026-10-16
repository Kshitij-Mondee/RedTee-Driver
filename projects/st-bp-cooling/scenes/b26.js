// @design diagnostic_close: two prompts sit above a complete machine while its quiet motion continues
Loom.scene("b26", {
  build(ctx) {
    // Treatments: static whole sheet with signalling; a camera tour of each link;
    // chosen: two lettered prompts above the held drawing, preserving its finished geometry.
    const W = ctx.engine, D = ctx._coolingSheet || (ctx._coolingSheet = W.sheet(ctx));
    const begin = ctx.cue("Next cooling alarm you hear of");
    const link = ctx.cue("which link failed");
    const spare = ctx.cue("and did its spare take over");
    ctx.held("hall_section");
    ctx.held("crah_row");
    ctx.held("water_loop");
    ctx.held("roof_cooler");
    ctx.held("heat_chain");
    ctx.held("containment");
    ctx.held("spare_outlines");
    const previousFlows = ctx.held("all_flows");
    ctx.m.exit(previousFlows,ctx.start);
    const flowStart = ctx.start + ctx.style.dur("exit");
    // @form quiet_flow: the system continues at low contrast behind the take-away
    const movement = ctx.el("closing_flows",{x:0,y:0,w:1920,h:960,kind:"connector",exit:"none"});
    const f = Loom.lesson.flows(ctx,movement.inner,{name:"closing_routes",demo:false,drafted:true,at:flowStart});
    movement.handle = f;
    const A = f.anchors;
    f.airArrow(A.floorPlenum,{speed:60});
    const left = f.colourChange([[850,555],[780,555],[700,555],[560,555],[560,375]],{speed:55});
    const right = f.colourChange([[850,600],[920,600],[1000,600],[1140,600],[1140,400]],{speed:55});
    left.setWarm(ctx.start); right.setWarm(ctx.start);
    f.warmAir(A.ceilingReturn,{speed:65});
    f.waterMarks(A.supply,{speed:70});
    f.waterMarks(A.returnPipe,{warm:true,speed:70});
    f.waterMarks(A.riser,{warm:true,speed:55});
    ctx.m.reveal(movement,flowStart,{dy:0,dur:ctx.style.dur("enter")});
    Loom.tl.set(movement.inner,{opacity:0.24},flowStart);
    // @form questions: a single cyan note frame contains the two closing checks
    const Q = ctx.el("questions",{x:560,y:84,w:720,h:156,kind:"card",exit:"none"});
    D.part(Q,{outline:W.rect(0,0,720,156),paper:false},{at:begin,by:begin+ctx.style.dur("draw"),pen:"accent"});
    const q1 = ctx.el("question_link",{x:24,y:12,w:672,h:54,parent:Q.inner,kind:"text",exit:"none"});
    const q2 = ctx.el("question_spare",{x:24,y:84,w:672,h:54,parent:Q.inner,kind:"text",exit:"none"});
    ctx.kit.fit("Which link failed?",{role:"lead",w:672,h:54,maxLines:1});
    ctx.kit.fit("Did its spare take over?",{role:"lead",w:672,h:54,maxLines:1});
    D.letter(q1,"Which link failed?",{role:"lead",size:32,align:"left",valign:"middle",at:link,by:link+ctx.style.dur("enter"),pen:"ink"});
    D.letter(q2,"Did its spare take over?",{role:"lead",size:32,align:"left",valign:"middle",at:spare,by:spare+ctx.style.dur("enter"),pen:"ink"});
  }
});
