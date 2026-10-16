// @design reach_stops_at_edge: a reaching gesture stops while the source stays unchanged
// Treatments: static two-row comparison with signalling; moving sheet; drawn reach. Choose drawn reach, it makes the boundary visible.
Loom.scene("b09", {build(ctx) {
 const W=ctx.engine, B=W.board(ctx,{marker:true});
 const page=ctx.el("page",{x:220,y:270,w:320,h:430,kind:"object",exit:"recede"});
 page.handle=Loom.lesson.budget_page(ctx,page.inner,{w:320,h:430,name:"access_budget",marker:true});
 page.handle.draw(ctx.cue("what can they do"),{by:ctx.cue("With view")});
 // @form reading_row: the eye identifies the read-only option
 const eye=ctx.el("eye",{x:720,y:300,w:100,h:90,kind:"icon",exit:"recede"});
 ctx.kit.icon(eye.inner,"eye",{x:50,y:45,size:80,stroke:24*3.6/80,color:"ink"});
 const tv=ctx.cue("With view"); ctx.m.draw(eye,tv,{dur:ctx.style.dur("draw")*.4});
 const view=ctx.el("view_words",{x:850,y:280,w:180,h:110,kind:"text",exit:"wipe"});
 B.heading(view,"View",{role:"title",at:tv+ctx.style.dur("draw")*.4,by:ctx.cue("they read the budget")+ctx.style.dur("draw")*.7});
 // @form stopped_reach: an open hand cannot alter the source
 const reach=ctx.el("reach",{x:555,y:485,w:135,h:170,kind:"icon",exit:"recede"});
 ctx.kit.icon(reach.inner,"hand",{x:80,y:55,size:80,stroke:24*3.6/80,color:"ink"});
 const tr=ctx.cue("cannot change");ctx.m.draw(reach,tr,{dur:ctx.style.dur("draw")*.3});
 B.draw(reach,W.arrow(120,130,10,130),{at:tr+ctx.style.dur("draw")*.3,by:tr+ctx.style.dur("draw")*.55});
 const read=ctx.el("read_only",{x:1080,y:310,w:300,h:70,kind:"text",exit:"wipe"});
 const end=B.write(read,"Read only",{size:44,at:tr+ctx.style.dur("draw")*.55,by:ctx.speechEnd-ctx.style.dur("draw")*.3});
 const u=ctx.el("read_only_underline",{x:1080,y:385,w:280,h:25,kind:"mark",exit:"recede"});
 B.draw(u,W.line(5,10,245,9),{pen:"accent",at:end,by:ctx.speechEnd});
}});
