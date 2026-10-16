// @design middle_boundary: a smaller boundary separates insiders from the wider population
// Treatments: static nested circles with signal; animated inward sorting; sequential nested marker board. Choose the accumulating nested board.
Loom.scene("b06",{
 build(ctx){
 const W=ctx.engine,B=W.board(ctx,{marker:true}),kit=ctx.kit;
 const page=ctx.held("page"),key=ctx.held("key"),rings=ctx.held("rings"),crowd=ctx.held("crowd"),anyone=ctx.held("anyone_label");
 const tr=ctx.cue("people in the company"),tp=ctx.cue("Anyone signed in"),te=ctx.cue("Outsiders stay out");
 // Keep the travelling key safely between the future inner boundary and this boundary.
 ctx.m.travel(key,ctx.start,{x:-60,y:85,scale:1});
 // @form company_boundary: extend the existing kit drawing, never instantiate a copy
 rings.handle.showRing("company",tr,{by:tr+ctx.style.dur("draw")});
 // The named company_ring element is its separate leader and geometry handle; the painted boundary remains in the held kit.
 const companyRing=ctx.el("company_ring",{x:1005,y:358,w:168,h:50,kind:"connector",exit:"recede"});
 companyRing.handle=rings.handle;
 B.draw(companyRing,W.line(4,44,162,8),{at:tr+ctx.style.dur("draw"),by:tr+ctx.style.dur("draw")*1.3,pen:"ink"});
 // @form company_label: the second boundary's label, stacked below the first
 const label=ctx.el("company_label",{x:1185,y:340,w:575,h:64,kind:"text",exit:"wipe"});
 kit.fit("People in the company",{role:"lead",w:555,h:58,maxLines:1});
 B.write(label,"People in the company",{role:"lead",at:tr+ctx.style.dur("draw")*1.3,by:tp+ctx.style.dur("draw")*.5,pen:"ink",maxLines:1});
 // @form signed_in_holders: pictograms lie between inner and company boundaries
 const people=ctx.el("company_people",{x:525,y:295,w:450,h:415,kind:"icon",exit:"recede"});
 const spots=[[185,0],[0,165],[360,80],[125,310]];
 spots.forEach((p,i)=>{
 const u=ctx.el("company_holder_"+i,{x:p[0],y:p[1],w:70,h:70,kind:"icon",exit:"recede",parent:people.inner});
 kit.icon(u.inner,"user",{x:35,y:35,size:64,stroke:24*3.6/64,color:"ink"});
 ctx.m.draw(u,tp+i*ctx.style.dur("stagger")*3,{dur:ctx.style.dur("draw")*.5});
 });
 // @form outsider_stop: a single short accent on the company edge beside the outer holder
 const edge=ctx.el("edge_mark",{x:515,y:420,w:24,h:70,kind:"mark",exit:"recede"});
 B.draw(edge,W.line(9,5,9,64),{at:te,by:te+ctx.style.dur("draw")*.4,pen:"accent"});
 }
});
