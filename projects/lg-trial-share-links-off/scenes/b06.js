// @design middle_boundary: membership excludes holders beyond a closer boundary
// Three treatments: static membership diagram; an arriving outsider; a new boundary and stopping mark.
// Chosen: new boundary then stopping mark makes the contrast without extra movement.
Loom.scene("b06",{build(ctx,props){
 const W=ctx.engine,B=W.board(ctx),D=ctx.style.dur("draw");
 const tr=ctx.cue("people in the company"),tp=ctx.cue("Anyone signed in"),te=ctx.cue("Outsiders stay out");
 ["page","key","key_ink","crowd","anyone_label"].forEach(n=>ctx.held(n));
 const rings=ctx.held("rings");
 // @form company_boundary: a closer boundary requires membership
 const ring=ctx.el("company_ring",{x:370,y:110,w:780,h:780,kind:"instrument",exit:"none"});
 ring.handle=rings.handle;
 rings.handle.showRing("company",tr,{by:tr+D});
 // @form company_scope_label: the scope is wider than one team
 const label=ctx.el("company_label",{x:1150,y:285,w:570,h:75,kind:"text",exit:"none"});
 B.draw(label,W.line(6,50,46,35),{at:tr+D,by:tr+D*1.2,pen:"ink"});
 const words=ctx.el("company_words",{x:60,y:0,w:500,h:65,kind:"text",exit:"none",parent:label.inner});
 ctx.kit.fit("People in the company",{role:"lead",w:490,h:60,maxLines:1});
 B.write(words,"People in the company",{role:"lead",at:tr+D*1.2,by:tp,pen:"ink",maxLines:1});
 // @form company_holders: membership is not limited to the nearby team
 const people=ctx.el("company_people",{x:540,y:285,w:440,h:440,kind:"icon",exit:"none"});
 [[185,0],[0,160],[350,160],[185,350]].forEach((p,i)=>{
 const e=ctx.el("company_user_"+i,{x:p[0],y:p[1],w:64,h:64,kind:"icon",exit:"none",parent:people.inner});
 ctx.kit.icon(e.inner,"user",{x:32,y:32,size:56,stroke:24*3.6/56,color:"ink"});
 ctx.m.draw(e,tp+i*D*.65,{dur:D*.65});
 });
 // @form exclusion_edge: the outside holder stops at company scope
 const edge=ctx.el("edge_mark",{x:550,y:285,w:70,h:70,kind:"mark",exit:"recede"});
 B.draw(edge,W.line(10,58,57,10),{at:te,by:te+D*.55,pen:"accent"});
}});
