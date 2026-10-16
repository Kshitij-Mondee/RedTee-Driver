// @design checked_boundary: a returning path stops at a closed identity gate
// Treatments: static signalling; route travelling to gate; checked-list mechanism. Choose mechanism.
Loom.scene("b16", {build(ctx) {
  const W=ctx.engine, B=W.board(ctx,{marker:false});
  const d=ctx.style.dur('draw');
  ['rings','team','manager','forward_arrow','small_page','anyone_ring'].forEach(n=>ctx.held(n));
  const t=ctx.cue("Same forward"), ask=ctx.cue("asks who she is"), shut=ctx.cue("it stays shut");
  // @form inner_boundary: the narrow audience encloses the existing team
  const R=ctx.el('named_ring',{x:310,y:110,w:780,h:780,kind:'mark',exit:'recede'});
  const h=Loom.lesson.access_rings(ctx,R.inner,{w:780,h:780,radius:380,cx:390,cy:390,labels:false,name:'travel_named'});
  R.handle=h;
  h.showRing('named',t,{by:t+d});
  // @form named_annotation: words follow the inner boundary before the next drawing
  const N=ctx.el('named_words',{x:1130,y:255,w:650,h:145,kind:'text',exit:'wipe'});
  ctx.kit.fit('Named people',{role:'lead',w:620,h:60,maxLines:1});
  B.write(N,'Named people',{x:12,y:5,w:620,h:60,role:'lead',at:t+d,by:t+d+.7,pen:'ink'});
  // Stable door anchor is held. Its coloured strokes live in a separate, unkept overlay.
  const D=ctx.el('door',{x:310,y:110,w:780,h:780,kind:'mark',exit:'recede'});
  const A=ctx.el('door_accent',{x:310,y:110,w:780,h:780,kind:'mark',exit:'recede'});
  h.door.draw('accent',t+d*2,{by:t+d*2.8,state:'shut',parent:A.inner});
  // @form checked_list: identity rows next to the gate
  const L=ctx.el('list',{x:1100,y:430,w:160,h:160,kind:'card',exit:'recede'});
  const list=Loom.lesson.name_list(ctx,L.inner,{w:160,h:160,name:'travel_list'}); L.handle=list;
  list.draw(t+d*2.8,{by:t+d*3.8});
  // @form returning_forward: a bent return reaches the gate rather than another holder
  const F=ctx.el('forward4',{x:850,y:520,w:170,h:105,kind:'connector',exit:'recede'});
  B.draw(F,W.path([[115,8],[160,100],[20,100],[20,0]]).concat(W.arrow(20,60,20,0)),{at:ask,by:ask+d,pen:'ink'});
  list.check(0,ask+d,{by:ask+d*1.35});
  list.check(1,ask+d*1.35,{by:ask+d*1.7});
  list.check(2,ask+d*1.7,{by:ask+d*2.05});
  // Write the consequence during the list-enforcement phrase, before the final refusal.
  B.write(N,'Not on the list',{x:12,y:80,w:620,h:60,role:'lead',at:ctx.cue('Where the list is enforced'),by:ctx.cue('Where the list is enforced')+.75,pen:'ink'});
  // @form stopped_forward: an ink refusal at the route end clear of the accent frame
  const C=ctx.el('shut_cross',{x:852,y:502,w:36,h:36,kind:'mark',exit:'recede'});
  B.draw(C,W.line(5,5,31,31).concat(W.line(31,5,5,31)),{at:shut,by:shut+d*.4,pen:'ink'});
}});
