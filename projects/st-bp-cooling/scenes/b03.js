// @design unresolved_escape: rising output gathers beneath a boundary while an unfinished route asks where it can leave
Loom.scene("b03", {
  build(ctx) {
    /* Treatments: static ceiling band with signalling; marks gather beneath a boundary;
       a camera follows a single mark. Choose gathering to show the unresolved destination. */
    const W=ctx.engine, D=ctx._coolingSheet||(ctx._coolingSheet=W.sheet(ctx));
    ctx.held("hall_section");
    ctx.held("title_note");
    const oldHeat=ctx.held("heat_marks");
    const power=ctx.held("power_lines");
    const gatherAt=ctx.cue("where does that heat go");
    const unknownAt=ctx.cue("what if it stopped going");
    ctx.m.exit(power,gatherAt,"recede");
    ctx.m.exit(oldHeat,ctx.start,"recede");
    // @form accumulating_output: the shared heat vocabulary rises above both racks
    const pool=ctx.el("heat_pool",{x:0,y:0,w:1920,h:960,kind:"scenery",exit:"none"});
    const restartAt=ctx.start+ctx.style.dur("exit");
    ctx.m.reveal(pool,restartAt,{dy:0,dur:ctx.style.dur("enter")});
    const flow=Loom.lesson.flows(ctx,pool.inner,{name:"pooled_heat",demo:false,drafted:true,at:restartAt});
    pool.handle=flow;
    const left=flow.heatMarks([632,330,116,75],{running:true,speed:60});
    const right=flow.heatMarks([952,330,116,75],{running:true,speed:60});
    left.start(restartAt);right.start(restartAt);
    left.gather(gatherAt);right.gather(gatherAt);
    // @form unresolved_route: a hidden route leads right without claiming a destination
    const path=ctx.el("path_unknown",{x:1040,y:286,w:720,h:100,kind:"connector",exit:"recede"});
    const routeEnd=D.draw(path,W.hidden([[0,0],[200,0],[200,74],[620,74]]),{at:unknownAt,by:unknownAt+ctx.style.dur("draw"),pen:"muted",parallel:true});
    // @form question_terminal: lettering follows the unfinished route
    const question=ctx.el("unknown_terminal",{x:1690,y:330,w:70,h:60,parent:pool.inner,kind:"text",exit:"recede"});
    ctx.kit.fit("?",{role:"lead",w:70,h:60,maxLines:1});
    D.letter(question,"?",{role:"lead",at:routeEnd,by:routeEnd+ctx.style.dur("enter"),quick:true,align:"center",valign:"middle",pen:"ink"});
  }
});
