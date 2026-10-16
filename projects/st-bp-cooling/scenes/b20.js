// @design spare_path_restored: an idle parallel source starts and restores the interrupted route
// Treatments: static paired states with signalling; replacement cutaway; held mechanism with returning flow.
// Chosen: held mechanism, because the same spare must visibly take over without a cut.
Loom.scene("b20", { build(ctx) {
  const m=ctx.m, W=ctx.engine, D=ctx._coolingSheet||(ctx._coolingSheet=W.sheet(ctx));
  const intro=ctx.cue("In a well designed system");
  const start=ctx.cue("the spare starts by itself");
  const full=ctx.cue("and the hall keeps its capacity");
  const hall=ctx.held("hall_section");
  const crah=ctx.held("crah_row");
  ctx.held("water_loop"); ctx.held("roof_cooler"); ctx.held("heat_chain");
  ctx.held("containment");
  const bracket=ctx.held("spare_bracket"), count=ctx.held("label_n1");
  m.exit(bracket,start,"recede");
  m.exit(count,intro,"recede");
  const dim=ctx.held("air_dim");
  if(crah && crah.handle){
    crah.handle.highlight(3,intro,start);
    crah.handle.setUnit(3,"starting",start);
    crah.handle.setUnit(3,"running",start+ctx.style.dur("draw"));
  }
  // @form restored_air_route: the spare's output joins the common floor plenum
  const air=ctx.el("spare_air",{x:0,y:0,w:1920,h:960,kind:"scenery",exit:"recede"});
  const flows=Loom.lesson.flows(ctx,air.inner,{name:"b20_air",at:ctx.start,demo:false});
  air.handle=flows;
  flows.airArrow([[430,710],[500,738],[850,738],[850,720],[850,500]],{speed:130});
  flows.airArrow([[310,710],[310,728],[820,728],[820,720],[820,500]],{speed:100});
  flows.airArrow([[1140,400],[1140,300],[430,300],[430,420]],{speed:110});
  m.reveal(air,start,{dy:0,dur:ctx.style.dur("enter")});
  Loom.tween(air.inner,{opacity:0.24},{opacity:1,duration:ctx.style.dur("move")},full);
  if(dim)m.exit(dim,full,"recede");
  // @form takeover_note: a healthy verdict sits above the spare clear of the counting bracket
  const note=ctx.el("label_takeover",{x:330,y:340,w:340,h:80,kind:"label",exit:"wipe"});
  ctx.kit.fit("spare takes over",{role:"label",w:316,h:40,maxLines:1});
  D.draw(note,[].concat(W.path([[100,80],[100,58],[12,58]]),W.path([[3,22],[11,30],[25,10]])), {at:full,by:full+ctx.style.dur("move"),parallel:true,pen:"pos"});
  D.letter(note,"spare takes over",{role:"label",size:24,at:full,by:full+ctx.style.dur("enter"),quick:true,pen:"pos",align:"center",valign:"top"});
  m.reveal(note,full,{dy:0,dur:ctx.style.dur("enter")});
} });
