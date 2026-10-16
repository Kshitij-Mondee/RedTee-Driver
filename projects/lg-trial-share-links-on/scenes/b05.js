// @design widest_boundary: a broad boundary encloses an unrestricted set of holders
// Treatments: static boundary with signal; travelling holders; sequential marker boundary. Choose sequential marker construction.
Loom.scene("b05",{
 build(ctx){
 const W=ctx.engine,B=W.board(ctx,{marker:true}),kit=ctx.kit;
 const page=ctx.held("page"),key=ctx.held("key");
 // Leave the analogy-only heading, arrow and holder at the join. Move the same key clear of the future door.
 ctx.m.travel(key,ctx.start,{x:0,y:95,scale:1});
 const tr=ctx.cue("anyone with the link"),tc=ctx.cue("Whoever holds it"),tu=ctx.cue("no sign-in needed");
 // @form widest_ring: the widest population boundary
 const rings=ctx.el("rings",{x:370,y:110,w:1280,h:780,kind:"mark",exit:"recede"});
 rings.handle=Loom.lesson.access_rings(ctx,rings.inner,{w:1280,h:780,radius:380,cx:390,cy:390,name:"access_board",labels:false,marker:true});
 rings.handle.showRing("anyone",tr,{by:ctx.cue("the link")+ctx.style.dur("draw")*.55});
 // @form boundary_label: a label sits beyond every boundary
 const label=ctx.el("anyone_label",{x:1185,y:240,w:575,h:64,kind:"text",exit:"wipe"});
 kit.fit("Anyone with the link",{role:"lead",w:555,h:58,maxLines:1});
 B.write(label,"Anyone with the link",{role:"lead",at:tr,by:tc-ctx.style.dur("draw")*.15,pen:"ink",maxLines:1});
 const leader=ctx.el("anyone_leader",{x:1108,y:267,w:65,h:40,kind:"connector",exit:"recede"});
 B.draw(leader,W.line(4,34,60,7),{at:tc-ctx.style.dur("draw")*.15,by:tc+ctx.style.dur("draw")*.2,pen:"ink"});
 // @form broad_crowd: holders throughout the widest band
 const crowd=ctx.el("crowd",{x:430,y:150,w:650,h:690,kind:"icon",exit:"recede"});
 const spots=[[30,240],[240,25],[550,160],[35,480],[445,600]];
 spots.forEach((p,i)=>{
 const u=ctx.el("wide_holder_"+i,{x:p[0],y:p[1],w:70,h:70,kind:"icon",exit:"recede",parent:crowd.inner});
 kit.icon(u.inner,"user",{x:35,y:35,size:64,stroke:24*3.6/64,color:"ink"});
 ctx.m.draw(u,tc+i*ctx.style.dur("stagger")*3,{dur:ctx.style.dur("draw")*.5});
 });
 // @form open_access_emphasis: one accent emphasizes the broadest option
 const under=ctx.el("anyone_underline",{x:1185,y:305,w:525,h:20,kind:"mark",exit:"recede"});
 B.draw(under,W.line(5,7,510,7),{at:tu-ctx.style.dur("draw")*.45,by:tu+ctx.style.dur("draw")*.25,pen:"accent"});
 }
});
