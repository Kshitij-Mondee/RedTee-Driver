// @design key_to_holder: a familiar object gains a transferable opening token
// Three treatments: static labelled analogy; a moving token; marker drawing followed by a handoff arrow.
// Chosen: marker sequence so the analogy builds with the spoken argument.
Loom.scene("b04", {build(ctx,props){
 const W=ctx.engine,B=W.board(ctx),D=ctx.style.dur("draw");
 const tp=ctx.cue("paste links"),tk=ctx.cue("as a key"),th=ctx.cue("whoever holds it");
 // @form small_folded_page: the object that later boundaries surround
 const page=ctx.el("page",{x:685,y:400,w:150,h:200,kind:"card",exit:"none"});
 page.handle=Loom.lesson.budget_page(ctx,page.inner,{w:150,h:200,name:"rings_page",marker:true});
 page.handle.draw(tp,{by:ctx.cue("Think of one")});
 // @form opening_token: one transferable key
 const key=ctx.el("key",{x:850,y:700,w:160,h:70,kind:"icon",exit:"none"});
 key.handle=Loom.lesson.link_key(ctx,key.inner,{w:160,h:70,pen:"accent",name:"rings_key",marker:true});
 key.handle.draw(tk,{by:tk+D*.65});
 // @form analogy_heading: words name the visual analogy
 const words=ctx.el("key_words",{x:1190,y:230,w:590,h:130,kind:"text",exit:"wipe"});
 ctx.kit.fit("A link is a key",{role:"title",w:570,h:120,maxLines:1});
 B.heading(words,"A link is a key",{role:"title",at:tk+D*.65,by:th-D*.5,pen:"ink",maxLines:1});
 // @form receiving_holder: the recipient is defined by possession
 const holder=ctx.el("holder",{x:1230,y:570,w:112,h:112,kind:"icon",exit:"recede"});
 ctx.kit.icon(holder.inner,"user",{x:56,y:56,size:96,stroke:24*3.6/96,color:"ink"});
 ctx.m.draw(holder,th-D*.3,{dur:D*.3});
 // @form short_handoff: an opening token can pass to another holder
 const arrow=ctx.el("handoff_arrow",{x:1030,y:650,w:190,h:100,kind:"connector",exit:"recede"});
 B.draw(arrow,W.arrow(8,75,175,8,{bend:20}),{at:th,by:ctx.speechEnd,pen:"ink"});
}});
