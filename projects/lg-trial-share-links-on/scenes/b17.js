// @design portable_rule: the route persists but identity stays attached to a holder
// Treatments: static signalling; page passed between icons; small qualifying note plus a held rule. Choose hybrid rest.
Loom.scene('b17',{build(ctx){
  const W=ctx.engine,B=W.board(ctx,{marker:false}),d=ctx.style.dur('draw');
  ['rings','team','manager','anyone_ring','named_ring','door','list','forward4','shut_cross','named_words'].forEach(n=>ctx.held(n));
  // @form neutral_gate: new ink-only overlay replaces the unkept accent overlay at the join
  const I=ctx.el('door_ink',{x:310,y:110,w:780,h:780,kind:'mark',exit:'recede'});
  const H=Loom.lesson.access_rings(ctx,I.inner,{w:780,h:780,radius:380,cx:390,cy:390,labels:false,name:'travel_ink_door'});
  H.door.draw('ink',ctx.start,{state:'shut'});
  const note=ctx.cue('show it on'), first=ctx.cue('The link travels'), second=ctx.cue('A name does not');
  // @form shoulder_note: a page can still be shown by its trusted holder
  const N=ctx.el('shoulder_note',{x:1350,y:430,w:370,h:175,kind:'card',exit:'recede'});
  B.draw(N,W.rect(6,6,358,163),{at:note,by:note+d*.45,pen:'ink'});
  const users=ctx.el('shoulder_users',{x:1380,y:468,w:300,h:90,kind:'icon',exit:'recede'});
  ctx.kit.icon(users.inner,'user',{x:44,y:45,size:74,stroke:24*3.6/74,color:'ink'});
  ctx.kit.icon(users.inner,'user',{x:256,y:45,size:74,stroke:24*3.6/74,color:'ink'});
  ctx.m.draw(users,note+d*.45,{dur:d*.5});
  const page=ctx.el('shown_page',{x:1481,y:473,w:74,h:84,kind:'mark',exit:'recede'});
  B.draw(page,W.rect(5,4,58,74).concat(W.line(16,27,51,27),W.line(16,42,47,42),W.arrow(64,52,73,52)),{at:note+d*.95,by:note+d*1.5,pen:'ink'});
  // @form pocket_rule: two short lines at rest in the open lower column
  const R=ctx.el('rule_words',{x:1130,y:675,w:650,h:155,kind:'text',exit:'wipe'});
  ctx.kit.fit('The link travels.',{role:'lead',w:620,h:65,maxLines:1});
  B.write(R,'The link travels.',{x:12,y:4,w:620,h:65,role:'lead',at:first,by:second,pen:'ink'});
  B.write(R,'A name does not.',{x:12,y:82,w:620,h:65,role:'lead',at:second,by:ctx.speechEnd-d*.45,pen:'ink'});
  // @form rule_underline: the single coloured takeaway
  const U=ctx.el('rule_underline',{x:1140,y:829,w:420,h:24,kind:'mark',exit:'recede'});
  B.draw(U,W.line(5,11,403,8),{at:ctx.speechEnd-d*.45,by:ctx.speechEnd,pen:'accent'});
}});
