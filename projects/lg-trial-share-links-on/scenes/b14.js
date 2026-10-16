// @design travelling_boundary_continued: a second handoff meets the boundary
// Treatments: static stop marker; travelling page; drawn forward ending at a bar. Choose drawn forward, the limit must be seen.
Loom.scene("b14",{build(ctx){
 const W=ctx.engine,B=W.board(ctx,{marker:false});
 const rings=ctx.held("rings"),team=ctx.held("team"),manager=ctx.held("manager"),a=ctx.held("forward_arrow");
 const t=ctx.cue("She opens it"),p=ctx.cue("The link itself is the permission"),f=ctx.cue("It can travel on");
 // @form carried_forward_ink: the previous emphasis becomes ordinary ink
 const ink=ctx.el("forward_arrow_ink",{x:0,y:0,w:189,h:72,kind:"connector",exit:"recede",parent:a.inner});
 B.draw(ink,W.line(12,60,12,12).concat(W.line(12,12,177,12),W.arrow(177,12,177,54)),{at:ctx.start,by:ctx.start,pen:"ink"});
 // @form opened_page: a small document beside the recipient
 const page=ctx.el("small_page",{x:875,y:552,w:48,h:64,kind:"icon",exit:"recede"});
 const pageMarks=W.line(6,4,31,4).concat(W.line(31,4,42,15),W.line(42,15,42,59),W.line(42,59,6,59),W.line(6,59,6,4),W.line(31,4,31,15),W.line(31,15,42,15),W.line(13,29,34,29),W.line(13,41,34,41));
 B.draw(page,pageMarks,{at:t,by:t+ctx.style.dur("draw"),pen:"ink"});
 // @form permission_note: the link grants access without a new request
 const words=ctx.el("permission_words",{x:1150,y:330,w:650,h:300,kind:"text",exit:"wipe"});
 ctx.kit.fit("The link is the permission",{role:"lead",w:630,h:140,maxLines:2});
 B.write(words,"The link is the permission",{x:10,y:10,w:630,h:140,role:"lead",at:p,by:p+ctx.style.dur("draw")*2,pen:"ink",maxLines:2});
 // @form second_forward: the new forward reaches only the boundary
 const forward=ctx.el("forward2",{x:935,y:476,w:28,h:48,kind:"connector",exit:"recede"});
 B.draw(forward,W.arrow(5,24,15,24),{at:f,by:f+ctx.style.dur("draw")*.6,pen:"ink"});
 // @form outside_holder: a person outside this permission area
 const out=ctx.el("outsider",{x:974,y:458,w:84,h:132,kind:"icon",exit:"recede"});
 ctx.kit.icon(out.inner,"user",{x:42,y:42,size:60,stroke:24*3.6/60,color:"ink"});
 ctx.m.draw(out,f+ctx.style.dur("draw")*.6,{dur:ctx.style.dur("draw")*.6});
 B.draw(out,W.arrow(62,110,16,110),{at:f+ctx.style.dur("draw")*.6,by:f+ctx.style.dur("draw")*1.2,pen:"ink"});
 // @form edge_stop: the company boundary blocks this forward
 const stop=ctx.el("edge_stop",{x:938,y:474,w:24,h:52,kind:"mark",exit:"recede"});
 B.draw(stop,W.line(12,6,12,46),{at:f+ctx.style.dur("draw")*1.2,by:f+ctx.style.dur("draw")*1.5,pen:"accent"});
 B.write(words,"Edge of the company",{x:10,y:210,w:630,h:80,role:"lead",at:f+ctx.style.dur("draw")*1.5,by:f+ctx.style.dur("draw")*3,pen:"ink"});
}});
