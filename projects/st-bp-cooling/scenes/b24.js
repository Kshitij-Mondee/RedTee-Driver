// @design reserve_answer: a failed branch remains marked while a spare and stored flow sustain the shared route
Loom.scene("b24", {
  build(ctx) {
    // Treatments: static signalling on the sheet; a tight pump crop; chosen three-step activation on the held sheet.
    const W=ctx.engine, D=ctx._coolingSheet||(ctx._coolingSheet=W.sheet(ctx)), m=ctx.m;
    const start=ctx.cue("The standby pump starts"), alarm=ctx.cue("The alarm calls an operator"), gap=ctx.cue("Water in the loop covers the gap");
    ctx.held("hall_section"); ctx.held("crah_row"); ctx.held("roof_cooler"); ctx.held("heat_chain"); ctx.held("containment");
    const water=ctx.held("water_loop");
    const stop=ctx.held("pump_stop");
    const question=ctx.held("question");
    if(question)m.exit(question,start,"recede");
    if(stop)m.exit(stop,start,"recede");
    water.handle.setPump("b","starting",start);
    water.handle.setPump("b","running",start+ctx.style.dur("enter"));
    // @form active_spare: a single cyan outline locates the starting reserve
    const pump=ctx.el("pump_b",{x:1467,y:697,w:86,h:86,kind:"mark",exit:"recede"});
    pump.handle=water.handle;
    D.draw(pump,W.circle(43,43,40),{at:start,by:start+ctx.style.dur("move"),parallel:true,pen:"accent"});
    m.reveal(pump,start,{dy:0,dur:ctx.style.dur("enter")});
    m.exit(pump,alarm,"recede");
    // @form standby_note: the healthy replacement is named in empty space above the plant
    Loom.treat.label(ctx,"label_standby",{x:1320,y:355,text:"standby starts",to:[1510,706],tone:"accent4",role:"label",t:start});
    // @form alarm_panel: the failed pump stays the alarm source
    const panel=ctx.el("monitor_panel",{x:0,y:0,w:1920,h:960,kind:"instrument",exit:"recede"});
    panel.handle=Loom.lesson.monitor_panel(ctx,panel.inner,{name:"pump_monitor",at:alarm,drafted:true});
    panel.handle.alarm("pump a",alarm);
    m.reveal(panel,alarm,{dy:0,dur:ctx.style.dur("enter")});
    // @form alarm_route: a leader reaches the failed pump without crossing rack labels
    const alarmLabel=ctx.el("label_alarm",{x:980,y:190,w:360,h:550,kind:"connector",exit:"recede"});
    D.draw(alarmLabel,W.path([[0,5],[270,5],[270,550],[356,550]]),{at:alarm,by:alarm+ctx.style.dur("draw"),parallel:true,pen:"accent3"});
    // @form operator_role: a role marker, not a new cast member
    const operator=ctx.el("operator_marker",{x:1030,y:90,w:170,h:145,kind:"icon",exit:"recede"});
    ctx.kit.icon(operator.inner,"user-round",{x:45,y:0,size:80,color:"ink"});
    const role=ctx.el("operator_role_words",{x:8,y:96,w:154,h:40,parent:operator.inner,kind:"text",exit:"recede"});
    ctx.kit.fit("operator",{role:"label",w:154,h:40,maxLines:1});
    D.letter(role,"operator",{role:"label",size:24,at:alarm,by:alarm+ctx.style.dur("enter"),quick:true,align:"center",valign:"middle"});
    m.reveal(operator,alarm,{dy:0,dur:ctx.style.dur("enter")});
    // @form operator_call: the alarm reaches the role marker
    const call=ctx.el("operator_call",{x:980,y:150,w:96,h:20,kind:"connector",exit:"recede"});
    D.draw(call,W.arrow(0,10,88,10),{at:alarm,by:alarm+ctx.style.dur("move"),parallel:true});
    // @form continuing_water: warm return and cool supply continue on the existing pipe geometry
    const flow=ctx.el("loop_flow",{x:0,y:0,w:1920,h:960,kind:"connector",exit:"recede"});
    flow.handle=Loom.lesson.flows(ctx,flow.inner,{name:"answer_water",demo:false,at:ctx.start,drafted:true});
    flow.handle.waterMarks(water.handle.anchors.supply,{speed:100});
    flow.handle.waterMarks(water.handle.anchors.returnPipe,{warm:true,speed:100});
    water.handle.setLevel(1,gap,ctx.style.dur("count"));
    // @form stored_water_note: a note reaches the loop through the clear service gap
    const gapNote=ctx.el("label_gap",{x:770,y:350,w:500,h:440,kind:"label",exit:"recede"});
    D.draw(gapNote,W.path([[410,35],[480,35],[480,440]]),{at:gap,by:gap+ctx.style.dur("move"),parallel:true,pen:"muted"});
    const gapWords=ctx.el("gap_words",{x:8,y:0,w:400,h:40,parent:gapNote.inner,kind:"text",exit:"recede"});
    ctx.kit.fit("water covers the gap",{role:"label",w:400,h:40,maxLines:1});
    D.letter(gapWords,"water covers the gap",{role:"label",size:24,at:gap,by:gap+ctx.style.dur("enter"),quick:true,pen:"ink"});
    m.reveal(gapNote,gap,{dy:0,dur:ctx.style.dur("enter")});
    const clearNotes=ctx.speechEnd-ctx.style.dur("exit");
    [operator,call,alarmLabel,gapNote].forEach(E=>m.exit(E,clearNotes,"recede"));
  }
});
