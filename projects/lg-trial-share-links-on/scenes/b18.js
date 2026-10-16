// @design choose_scope_and_power: an unchanged sheet and three holders frame a two-part choice
// Treatments: static board with signalling; travelling sheet; sequential scenario and choices. Choose sequential board so the unresolved choice can hold.
Loom.scene('b18',{build(ctx){
 const W=ctx.engine,B=W.board(ctx,{marker:false}),d=ctx.style.dur('draw');
 const h=ctx.cue('Your turn'),p=ctx.cue('three teammates need to read the budget'),v=ctx.cue('not change it'),q=ctx.cue('Which setting, and which permission'),pause=ctx.cue('Pause, and decide');
 // @form turn_heading: a fresh practice board
 const H=ctx.el('turn_head',{x:140,y:110,w:620,h:150,kind:'text',exit:'wipe'});
 ctx.kit.fit('Your turn',{role:'display',w:600,h:140,maxLines:1});
 B.heading(H,'Your turn',{role:'display',at:h,by:h+.45});
 // @form scenario_page: the same budget in miniature
 const P=ctx.el('budget_mini',{x:260,y:330,w:150,h:200,kind:'card',exit:'recede'});
 P.handle=Loom.lesson.budget_page(ctx,P.inner,{w:150,h:200,name:'quiz_budget',marker:false});
 P.handle.draw(p,{by:p+d*1.5});
 // @form team_pictograms: three holders use the established marker pictograms
 const T=ctx.el('team',{x:245,y:570,w:180,h:68,kind:'icon',exit:'recede'});
 [30,90,150].forEach(x=>ctx.kit.icon(T.inner,'user',{x:x,y:34,size:52,stroke:24*3.6/52,color:'ink'}));
 ctx.m.draw(T,p+d*1.5,{dur:d*.65});
 // @form view_not_edit: reading is allowed and alteration is not
 const V=ctx.el('view_marks',{x:460,y:350,w:180,h:175,kind:'icon',exit:'recede'});
 const eye=ctx.el('quiz_eye',{x:0,y:0,w:74,h:74,kind:'icon',exit:'recede',parent:V.inner});
 ctx.kit.icon(eye.inner,'eye',{x:37,y:37,size:60,stroke:24*3.6/60,color:'ink'});
 ctx.m.draw(eye,v,{dur:d*.3});
 B.draw(V,W.line(93,36,108,51).concat(W.line(108,51,136,17)),{at:v+d*.3,by:v+d*.55,pen:'ink'});
 const pencil=ctx.el('quiz_pencil',{x:0,y:92,w:74,h:74,kind:'icon',exit:'recede',parent:V.inner});
 ctx.kit.icon(pencil.inner,'pencil',{x:37,y:37,size:60,stroke:24*3.6/60,color:'ink'});
 ctx.m.draw(pencil,v+d*.55,{dur:d*.3});
 B.draw(V,W.line(94,111,129,146).concat(W.line(129,111,94,146)),{at:v+d*.85,by:v+d*1.15,pen:'ink'});
 // @form two_part_question: one question above three unmarked choices
 const Q=ctx.el('question',{x:745,y:290,w:1000,h:76,kind:'text',exit:'wipe'});
 ctx.kit.fit('Which setting, and which permission?',{role:'lead',w:976,h:64,maxLines:1});
 W.board(ctx,{marker:false}).write(Q,'Which setting, and which permission?',{x:12,y:6,w:976,h:64,role:'lead',maxLines:1,at:q,by:q+.5,pen:'ink'});
 const O=ctx.el('options',{x:745,y:395,w:1000,h:310,kind:'card',exit:'recede'});
 ['Anyone with the link, edit','People in the company, view','Named people, view'].forEach((s,i)=>{
  const a=q-.15+i*.2,y=12+i*110;
  const rowBoard=W.board(ctx,{marker:false});
  rowBoard.draw(O,W.rect(14,y+5,38,38),{at:a,by:a+.08,pen:'ink'});
  ctx.kit.fit(s,{role:'lead',w:880,h:65,maxLines:1});
  rowBoard.write(O,s,{x:80,y:y-6,w:880,h:65,role:'lead',maxLines:1,at:a+.08,by:a+.5,pen:'ink'});
 });
 // @form pause_circle: the only accent invites a decision without giving the answer
 const A=ctx.el('pause_mark',{x:1650,y:755,w:104,h:104,kind:'mark',exit:'recede'});
 B.draw(A,W.circle(52,52,40).concat(W.line(41,34,41,70),W.line(63,34,63,70)),{at:pause,by:pause+.45,pen:'accent'});
}});
