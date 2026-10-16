// @design untouched_sheet: an unchanged sheet contrasts reading with alteration
// Three treatments: static icons with signalling; a hand stops at a page; a split comparison. Choose the stopped hand because the unchanged page carries the argument.
Loom.scene("b09", {
 build(ctx) {
  const W=ctx.engine, B=W.board(ctx), m=ctx.m;
  const tp=ctx.cue("what can they do"), tv=ctx.cue("With view"), tr=ctx.cue("cannot change");
  // @form original_page: a stable original is the reference
  const page=ctx.el("page",{x:150,y:250,w:320,h:430,kind:"card",exit:"recede"});
  page.handle=Loom.lesson.budget_page(ctx,page.inner,{w:320,h:430,name:"access_budget",marker:true});
  page.handle.draw(tp,{by:tv});
  // @form reading_eye: reading without alteration
  const eye=ctx.el("eye",{x:690,y:290,w:112,h:112,kind:"icon",exit:"recede"});
  ctx.kit.icon(eye.inner,"eye",{x:56,y:56,size:96,stroke:24*3.6/96,color:"ink"});
  m.draw(eye,tv,{dur:ctx.style.dur("draw")*.5});
  // @form view_heading: permission heading follows its icon
  const view=ctx.el("view_words",{x:830,y:286,w:260,h:100,kind:"text",exit:"wipe"});
  ctx.kit.fit("View",{role:"title",w:240,h:90,maxLines:1});
  B.heading(view,"View",{role:"title",at:tv+ctx.style.dur("draw")*.5,by:tv+ctx.style.dur("draw")*1.4});
  // @form stopped_reach: the original remains untouched
  const reach=ctx.el("reach",{x:485,y:620,w:260,h:130,kind:"icon",exit:"recede"});
  const hand=ctx.el("reach_hand",{x:145,y:15,w:100,h:100,kind:"icon",exit:"recede",parent:reach.inner});
  ctx.kit.icon(hand.inner,"hand",{x:50,y:50,size:80,stroke:24*3.6/80,color:"ink"});
  m.draw(hand,tr,{dur:ctx.style.dur("draw")*.4});
  const arrow=ctx.el("reach_arrow",{x:0,y:0,w:145,h:130,kind:"connector",exit:"recede",parent:reach.inner});
  B.draw(arrow,W.arrow(140,65,8,65),{at:tr+ctx.style.dur("draw")*.4,by:tr+ctx.style.dur("draw")*.8,pen:"ink"});
  // @form read_only_label: explicit consequence of view
  const ro=ctx.el("read_only",{x:1130,y:312,w:480,h:68,kind:"text",exit:"wipe"});
  ctx.kit.fit("Read only",{role:"lead",w:460,h:64,maxLines:1});
  B.write(ro,"Read only",{role:"lead",at:tr,by:tr+ctx.style.dur("draw"),maxLines:1});
  // @form read_only_underline: the one accent stresses the unchanged original
  const u=ctx.el("read_only_underline",{x:1130,y:388,w:335,h:22,kind:"mark",exit:"recede"});
  B.draw(u,W.line(6,10,310,8),{at:tr+ctx.style.dur("draw"),by:tr+ctx.style.dur("draw")*1.35,pen:"accent"});
 }
});
