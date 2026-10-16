// @design checked_inner_boundary: the smallest opening checks identity against a list
// Three treatments: static checked doorway; a moving holder; sequential inner boundary and checklist.
// Chosen: inner boundary and checklist expose the limit of possession alone.
Loom.scene("b07",{build(ctx,props){
 const W=ctx.engine,B=W.board(ctx),D=ctx.style.dur("draw");
 const tr=ctx.cue("named people"),td=ctx.cue("the door checks you"),tt=ctx.cue("Only accounts you added");
 ["page","key","key_ink","crowd","anyone_label","company_ring","company_label"].forEach(n=>ctx.held(n));
 const people=ctx.held("company_people");
 ctx.m.travel(people,tr,{x:40,y:0});
 const rings=ctx.held("rings");
 // @form named_boundary: the closest boundary surrounds the shared object
 const named=ctx.el("named_ring",{x:370,y:110,w:780,h:780,kind:"instrument",exit:"none"});
 named.handle=rings.handle;
 rings.handle.showRing("named",tr,{by:tr+D*.75});
 // @form named_scope_label: the narrowest generic setting
 const label=ctx.el("named_label",{x:1150,y:400,w:570,h:75,kind:"text",exit:"none"});
 B.draw(label,W.line(6,50,46,35),{at:tr+D*.75,by:tr+D*.95,pen:"ink"});
 const words=ctx.el("named_words",{x:60,y:0,w:500,h:65,kind:"text",exit:"none",parent:label.inner});
 ctx.kit.fit("Named people",{role:"lead",w:490,h:60,maxLines:1});
 B.write(words,"Named people",{role:"lead",at:tr+D*.95,by:td,pen:"ink",maxLines:1});
 // @form checked_doorway: identity rather than token possession is checked
 const door=ctx.el("door",{x:370,y:110,w:780,h:780,kind:"instrument",exit:"none"});
 door.handle=rings.handle;
 const accent=ctx.el("door_accent",{x:370,y:110,w:780,h:780,kind:"mark",exit:"recede"});
 rings.handle.door.draw("accent",td,{by:td+D*.65,state:"shut",parent:accent.inner});
 // @form account_list: unlettered rows stand for the accounts explicitly added
 const list=ctx.el("list",{x:1170,y:495,w:160,h:160,kind:"card",exit:"none"});
 list.handle=Loom.lesson.name_list(ctx,list.inner,{w:160,h:160,name:"named_accounts",marker:true});
 list.handle.draw(td+D*.65,{by:td+D*1.05});
 for(let i=0;i<3;i++)list.handle.check(i,tt+i*D*.6,{by:tt+(i+1)*D*.6,pen:"ink"});
}});
