// @design widest_boundary: possession opens the largest possible audience
// Three treatments: static ring with a signal; a spreading token; a boundary drawn before its holders.
// Chosen: boundary then holders makes the scope explicit.
Loom.scene("b05",{build(ctx,props){
 const W=ctx.engine,B=W.board(ctx),D=ctx.style.dur("draw");
 const tr=ctx.cue("anyone with the link"),tc=ctx.cue("Whoever holds it"),tu=ctx.cue("no sign-in needed");
 ctx.held("page");
 const oldKey=ctx.held("key");ctx.m.exit(oldKey,ctx.start,"recede");
 // @form neutral_key: retain the token in ink as the underline takes emphasis
 const keyInk=ctx.el("key_ink",{x:1190,y:820,w:160,h:70,kind:"icon",exit:"none"});
 keyInk.handle=Loom.lesson.link_key(ctx,keyInk.inner,{w:160,h:70,pen:"ink",name:"rings_key_ink",marker:false});
 keyInk.handle.draw(ctx.start+ctx.style.dur("exit"));
 // @form widest_ring: the broadest access boundary
 const rings=ctx.el("rings",{x:370,y:110,w:1280,h:780,kind:"instrument",exit:"none"});
 rings.handle=Loom.lesson.access_rings(ctx,rings.inner,{w:1280,h:780,radius:380,cx:390,cy:390,labels:false,name:"access_board",marker:true});
 rings.handle.showRing("anyone",tr,{by:tr+D});
 // @form broad_label: explicit generic setting name beside the boundary
 const label=ctx.el("anyone_label",{x:1150,y:170,w:570,h:75,kind:"text",exit:"none"});
 B.draw(label,W.line(6,50,46,35),{at:tr+D,by:tr+D*1.2,pen:"ink"});
 ctx.kit.fit("Anyone with the link",{role:"lead",w:490,h:60,maxLines:1});
 const words=ctx.el("anyone_words",{x:60,y:0,w:500,h:65,kind:"text",exit:"none",parent:label.inner});
 B.write(words,"Anyone with the link",{role:"lead",at:tr+D*1.2,by:tc,pen:"ink",maxLines:1});
 // @form outer_holders: equal pictograms scattered in the widest band
 const crowd=ctx.el("crowd",{x:400,y:150,w:710,h:690,kind:"icon",exit:"none"});
 [[320,25],[100,110],[10,330],[100,530],[320,610],[590,110]].forEach((p,i)=>{
 const e=ctx.el("outer_user_"+i,{x:p[0],y:p[1],w:64,h:64,kind:"icon",exit:"none",parent:crowd.inner});
 ctx.kit.icon(e.inner,"user",{x:32,y:32,size:56,stroke:24*3.6/56,color:"ink"});
 ctx.m.draw(e,tc+i*D*.42,{dur:D*.42});
 });
 // @form single_scope_emphasis: the unrestricted label is the only accent
 const u=ctx.el("anyone_underline",{x:1210,y:236,w:430,h:20,kind:"mark",exit:"recede"});
 B.draw(u,W.line(4,8,420,6),{at:tu,by:tu+D*.45,pen:"accent"});
}});
