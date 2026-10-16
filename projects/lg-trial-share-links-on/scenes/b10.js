// @design shared_correction: one correction propagates to every reader's sheet
// Three treatments: static paired rows with signalling; correction repeated across sheets; animated travelling pencil. Choose repeated correction because the common original is the point.
Loom.scene("b10", {
 build(ctx) {
  const W=ctx.engine, B=W.board(ctx), m=ctx.m;
  const te=ctx.cue("Edit is different"), tc=ctx.cue("change the original"), ta=ctx.cue("Everyone sees");
  const page=ctx.held("page");
  ctx.held("eye"); ctx.held("view_words"); ctx.held("read_only");
  // @form edit_pencil: the second permission adds alteration
  const pencil=ctx.el("pencil",{x:690,y:490,w:112,h:112,kind:"icon",exit:"recede"});
  ctx.kit.icon(pencil.inner,"pencil",{x:56,y:56,size:96,stroke:24*3.6/96,color:"ink"});
  m.draw(pencil,te,{dur:ctx.style.dur("draw")*.5});
  // @form edit_heading: permission heading aligned with View
  const words=ctx.el("edit_words",{x:830,y:486,w:260,h:100,kind:"text",exit:"wipe"});
  ctx.kit.fit("Edit",{role:"title",w:240,h:90,maxLines:1});
  B.heading(words,"Edit",{role:"title",at:te+ctx.style.dur("draw")*.5,by:te+ctx.style.dur("draw")*1.4});
  // @form original_change_label: the action affects the common original
  const consequence=ctx.el("edit_consequence",{x:1130,y:512,w:610,h:68,kind:"text",exit:"wipe"});
  ctx.kit.fit("Changes the original",{role:"lead",w:590,h:64,maxLines:1});
  B.write(consequence,"Changes the original",{role:"lead",at:tc,by:tc+ctx.style.dur("draw"),maxLines:1});
  // @form correction_anchor: kept geometry anchor, painted accent is an unkept sibling
  ctx.el("edit_mark",{x:150,y:250,w:320,h:430,kind:"mark",exit:"recede"});
  const overlay=ctx.el("edit_accent",{x:150,y:250,w:320,h:430,kind:"mark",exit:"recede"});
  page.handle.edit.draw("accent",tc,{by:tc+ctx.style.dur("draw")*.55,parent:overlay.inner});
  // @form common_copies: repeated sheets gain the identical correction
  const copies=ctx.el("copies",{x:1080,y:610,w:720,h:300,kind:"card",exit:"recede"});
  for(let i=0;i<3;i++) {
   const e=ctx.el("reader_page_"+i,{x:i*240,y:0,w:220,h:294,kind:"card",exit:"recede",parent:copies.inner});
   const h=Loom.lesson.budget_page(ctx,e.inner,{w:220,h:294,name:"reader_budget_"+i,marker:false});
   const t=ta+i*ctx.style.dur("draw")*.3;
   h.draw(t);
   h.edit.draw("ink",t);
   m.unmask(e,t,{dir:"ltr",dur:ctx.style.dur("draw")*.55});
  }
 }
});
