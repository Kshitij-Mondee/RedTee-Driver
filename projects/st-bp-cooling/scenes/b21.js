// @design stored_reserve: an alarm identifies the failed source while a slowly falling reserve sustains the route
// Treatments: static alarm and reserve signalling; close crop on stored capacity;
// chosen: held full sheet with local alarm and moving water, preserving the failure context.
Loom.scene("b21", { build(ctx) {
  const W=ctx.engine, D=ctx._coolingSheet||(ctx._coolingSheet=W.sheet(ctx)), m=ctx.m;
  const alarm=ctx.cue("Sensors raise an alarm for repair");
  const reserve=ctx.cue("cold water in the pipes buys time");
  const ride=ctx.cue("That is ride-through");
  ctx.held("hall_section"); ctx.held("crah_row");
  const water=ctx.held("water_loop");
  ctx.held("roof_cooler"); ctx.held("heat_chain"); ctx.held("containment");
  ctx.held("spare_air"); const takeover=ctx.held("label_takeover");
  m.exit(takeover,alarm,"wipe");
  const oldCount=ctx.held("label_n1");
  m.exit(oldCount,ctx.start,"recede");
  // @form monitoring_alarm: the failed cabinet is identified by its monitoring row
  const panel=ctx.el("monitor_panel",{x:0,y:0,w:1920,h:960,kind:"instrument",exit:"recede"});
  const monitor=Loom.lesson.monitor_panel(ctx,panel.inner,{name:"b21_monitor",at:alarm,drafted:true});
  panel.handle=monitor;
  m.reveal(panel,alarm,{dy:0,dur:ctx.style.dur("enter")});
  // @form fault_pointer: a persistent named handle preserves the alarm leader for the next beat
  const pointer=ctx.el("alarm_leader",{x:190,y:100,w:330,h:330,kind:"connector",exit:"recede"});
  pointer.handle=monitor.leader("crah 1",[190,430],alarm+ctx.style.dur("draw"));
  // @form reserve_flow: cool supply and warm return keep moving as stored water is used
  const tank=ctx.el("tank_level",{x:0,y:0,w:1920,h:960,kind:"scenery",exit:"recede"});
  const flows=Loom.lesson.flows(ctx,tank.inner,{name:"b21_water",at:reserve,demo:false});
  tank.handle=water.handle;
  flows.waterMarks(water.handle.anchors.supply,{speed:105});
  flows.waterMarks(water.handle.anchors.returnPipe,{warm:true,speed:105});
  m.reveal(tank,reserve,{dy:0,dur:ctx.style.dur("enter")});
  water.handle.setLevel(0.7,reserve,ctx.speechEnd-reserve);
  // @form ride_through_note: the term points to the stored reserve rather than to the failed unit
  const note=ctx.el("label_ride",{x:1450,y:350,w:370,h:375,kind:"label",exit:"wipe"});
  D.draw(note,[].concat(W.path([[280,36],[360,36],[360,270]]),W.path([[360,330],[360,360],[335,360]])),{at:ride,by:ride+ctx.style.dur("move"),parallel:true,pen:"line"});
  const words=ctx.el("ride_words",{x:8,y:0,w:264,h:48,parent:note.inner,kind:"text",exit:"wipe"});
  ctx.kit.fit("ride-through",{role:"label",w:248,h:48,maxLines:1});
  D.letter(words,"ride-through",{role:"label",size:28,align:"center",valign:"middle",at:ride,by:ride+ctx.style.dur("enter"),quick:true,pen:"ink"});
  m.reveal(note,ride,{dy:0,dur:ctx.style.dur("enter")});
} });
