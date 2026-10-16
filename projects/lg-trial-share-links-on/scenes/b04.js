// @design travelling_token: a small object becomes a transferable permission
// Treatments: static key and label; moving key handoff; accumulating marker diagram. Choose accumulating diagram with a short handoff arrow.
Loom.scene("b04", {
 build(ctx) {
 const W=ctx.engine,B=W.board(ctx,{marker:true}),kit=ctx.kit;
 const tp=ctx.cue("paste links"),tk=ctx.cue("as a key"),th=ctx.cue("whoever holds it");
 // @form folded_page: the shared object at the centre of the later boundaries
 const page=ctx.el("page",{x:685,y:400,w:150,h:200,kind:"card",exit:"recede"});
 page.handle=Loom.lesson.budget_page(ctx,page.inner,{w:150,h:200,name:"budget_core",marker:true});
 page.handle.draw(tp,{by:ctx.cue("every week")});
 // @form travelling_key: a reusable permission beside the shared object
 const key=ctx.el("key",{x:850,y:525,w:160,h:70,kind:"icon",exit:"recede"});
 key.handle=Loom.lesson.link_key(ctx,key.inner,{w:160,h:70,name:"link_core",pen:"ink",marker:true});
 key.handle.draw(tk,{by:tk+ctx.style.dur("draw")});
 const keyAccent=ctx.el("key_accent",{x:850,y:588,w:160,h:20,kind:"mark",exit:"recede"});
 B.draw(keyAccent,W.line(8,8,150,8),{at:tk+ctx.style.dur("draw"),dur:ctx.style.dur("draw")*.35,pen:"accent"});
 // @form analogy_heading: words give the object its meaning
 const words=ctx.el("key_words",{x:1080,y:270,w:640,h:115,kind:"text",exit:"wipe"});
 kit.fit("A link is a key",{role:"title",w:620,h:105,maxLines:1});
 B.heading(words,"A link is a key",{role:"title",at:tk,by:th-ctx.style.dur("draw")*.3,pen:"ink"});
 // @form holder_pictogram: a generic holder, not a cast character
 const holder=ctx.el("holder",{x:1210,y:455,w:100,h:100,kind:"icon",exit:"recede"});
 kit.icon(holder.inner,"user",{x:50,y:50,size:96,stroke:24*3.6/96,color:"ink"});
 ctx.m.draw(holder,th,{dur:ctx.style.dur("draw")*.55});
 // @form handoff_arrow: permission can reach another holder
 const arrow=ctx.el("handoff_arrow",{x:1020,y:505,w:180,h:90,kind:"connector",exit:"recede"});
 B.draw(arrow,W.arrow(8,60,165,10,{bend:24}),{at:th,by:ctx.speechEnd-ctx.style.dur("exit"),pen:"ink"});
 }
});
