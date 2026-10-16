// @design travelling_boundary_continued: the next handoff runs beyond both boundaries
// Treatments: static long arrow; a travelling icon; a marker route beyond the circles. Choose the route, it visibly exceeds the old limit.
Loom.scene("b15",{build(ctx){
 const W=ctx.engine,B=W.board(ctx,{marker:false});
 const rings=ctx.held("rings"),team=ctx.held("team"),manager=ctx.held("manager"),arrow=ctx.held("forward_arrow"),page=ctx.held("small_page");
 ctx.held("forward2");ctx.held("outsider");const stop=ctx.held("edge_stop");
 const t=ctx.cue("Anyone with the link"),f=ctx.cue("no such edge");
 // @form anyone_boundary: the widest boundary added without redrawing the held company ring
 const anyone=ctx.el("anyone_ring",{x:310,y:110,w:780,h:780,kind:"instrument",exit:"recede"});
 const R=Loom.lesson.access_rings(ctx,anyone.inner,{name:"travel_anyone",w:780,h:780,radius:380,cx:390,cy:390,labels:false,marker:false});anyone.handle=R;
 R.showRing("anyone",t,{by:t+ctx.style.dur("draw")*.6});
 // The prior stop is no longer the limit of this different setting.
 ctx.m.exit(stop,t,"recede");
 // @form unbounded_forward: a short route past the outer ring, below the words
 const forward=ctx.el("forward3",{x:1030,y:620,w:160,h:110,kind:"connector",exit:"recede"});
 const marks=W.arrow(10,15,145,85);

 // @form no_edge_note: short words clear of the route
 const words=ctx.el("no_edge_words",{x:1150,y:330,w:650,h:230,kind:"text",exit:"wipe"});
 ctx.kit.fit("Anyone with the link: no edge",{role:"lead",w:630,h:210,maxLines:2});
 B.write(words,"Anyone with the link: no edge",{x:10,y:10,w:630,h:210,role:"lead",maxLines:2,at:t+ctx.style.dur("draw")*.6,by:f,pen:"ink"});
 B.draw(forward,marks,{at:f,by:ctx.speechEnd,pen:"accent"});
}});
