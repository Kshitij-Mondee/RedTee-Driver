// @design reversible_consequence: a conditional loss dims a working system before the reserve restores it
Loom.scene("b22", { build(ctx) {
  // Treatments: static consequence with signalling; separate failure cutaway;
  // chosen: tracing overlay on held racks, then reverse the same visible consequence.
  const W=ctx.engine, D=ctx._coolingSheet||(ctx._coolingSheet=W.sheet(ctx)), m=ctx.m;
  const loss=ctx.cue("Lose cooling for good");
  const warm=ctx.cue("the room warms");
  const slow=ctx.cue("slow down");
  const off=ctx.cue("shut off");
  const safe=ctx.cue("Spares keep it from coming to that");
  const hall=ctx.held("hall_section"), crah=ctx.held("crah_row");
  ctx.held("water_loop"); ctx.held("roof_cooler"); ctx.held("heat_chain"); ctx.held("containment");
  ctx.held("monitor_panel");
  const previousAir=ctx.held("spare_air");
  if(previousAir) m.exit(previousAir,loss,"recede");
  const ride=ctx.held("label_ride"), leader=ctx.held("alarm_leader"), tank=ctx.held("tank_level");
  if(ride)m.exit(ride,loss,"recede");
  if(leader)m.exit(leader,loss,"recede");
  if(tank)m.exit(tank,loss,"recede");
  const takeover=ctx.held("label_takeover");
  if(takeover)m.exit(takeover,loss,"recede");
  // @form conditional_tracing: a removable sheet distinguishes the hypothetical loss
  const overlay=ctx.el("whatif_overlay",{x:590,y:285,w:520,h:440,kind:"scenery",exit:"recede"});
  D.overlay(overlay,{tag:"what if",at:loss,lift:safe});
  // @form temperature_column: a numberless amber measure rises toward a warning line
  const gauge=ctx.el("temp_readout",{x:0,y:0,w:1920,h:960,kind:"instrument",exit:"recede"});
  gauge.handle=Loom.lesson.temp_readout(ctx,gauge.inner,{name:"b22_temp",at:loss,drafted:true});
  m.reveal(gauge,loss,{dy:0,dur:ctx.style.dur("enter")});
  gauge.handle.setLevel(1,warm,ctx.style.dur("count"));
  gauge.handle.setLevel(0,safe,ctx.style.dur("count"));
  const accent=ctx.el("temperature_focus",{x:1147,y:430,w:62,h:280,kind:"mark",exit:"recede"});
  D.draw(accent,W.path([[8,0],[0,0],[0,280],[8,280]]),{at:warm,by:warm+ctx.style.dur("move"),pen:"accent",parallel:true});
  m.reveal(accent,warm,{dy:0,dur:ctx.style.dur("enter")});
  m.exit(accent,safe,"recede");
  hall.handle.setState("throttled",slow);
  hall.handle.setState("running",safe);
  crah.handle.setUnit(3,"running",safe);
  // @form rack_consequences: two short coral notes sit above the affected rack outlines
  function note(name,text,x,t,toX) {
    const E=ctx.el(name,{x:x,y:350,w:200,h:70,kind:"label",exit:"recede"});
    ctx.kit.fit(text,{role:"label",w:184,h:44,maxLines:1});
    D.draw(E,W.path([[100,50],[toX-x,68]]),{at:t,by:t+ctx.style.dur("move"),pen:"accent3",parallel:true});
    const words=ctx.el(name+"_words",{x:8,y:0,w:184,h:44,parent:E.inner,kind:"text",exit:"recede"});
    D.letter(words,text,{role:"label",size:30,align:"center",valign:"middle",quick:true,at:t,by:t+ctx.style.dur("enter"),pen:"accent3"});
    m.reveal(E,t,{dy:0,dur:ctx.style.dur("enter")});
    m.exit(E,safe+ctx.style.dur("move"),"recede");
    return E;
  }
  note("label_slow","slow down",590,slow,690);
  note("label_off","shut off",910,off,1010);
  // @form recovered_air: the reserve restores the floor supply on the same sheet
  const air=ctx.el("flows_back",{x:0,y:0,w:1920,h:960,kind:"connector",exit:"recede"});
  air.handle=Loom.lesson.flows(ctx,air.inner,{name:"b22_recovery",at:ctx.start,demo:false});
  air.handle.airArrow([[430,710],[500,738],[850,738],[850,720],[850,500]],{speed:130,running:false}).start(safe);
  air.handle.airArrow([[1140,400],[1140,300],[430,300],[430,420]],{speed:110,running:false}).start(safe);
  m.reveal(air,safe,{dy:0,dur:ctx.style.dur("enter")});
} });
