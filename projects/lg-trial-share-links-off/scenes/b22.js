// @design return_and_remove: a disabled token points back to its owner while one entry is struck
Loom.scene("b22", {build(ctx) {
// Treatments: static key with signalling; physical key travel; drawn return arrow. Choose drawn return to preserve the marker world.
const W=ctx.engine, B=W.board(ctx,{marker:true});
const t0=ctx.cue("until when"), t1=ctx.cue("take the key back"), t2=ctx.cue("Switch it off"), t3=ctx.cue("remove names");
// @form until_heading: third choice
const head=ctx.el("until_head",{x:120,y:110,w:760,h:110,kind:"text",exit:"wipe"});
B.heading(head,"Until when",{role:"title",at:ctx.speechStart,by:t0+0.4});
// @form returned_key: key disabled independently of its base
const key=ctx.el("key",{x:570,y:395,w:320,h:140,kind:"icon",exit:"recede"});
const cross=ctx.el("key_cross",{x:570,y:395,w:320,h:140,kind:"mark",exit:"recede"});
const accent=ctx.el("key_cross_accent",{x:570,y:395,w:320,h:140,kind:"mark",exit:"recede"});
const K=Loom.lesson.link_key(ctx,key.inner,{w:320,h:140,name:"takeback_key",marker:true,crossParent:accent.inner});key.handle=K;cross.handle=K;
K.draw(t0+0.4,{by:t0+1.05});
// @form sender_icon: owner receives the link back
const sender=ctx.el("sender",{x:285,y:405,w:112,h:112,kind:"icon",exit:"recede"});
ctx.kit.icon(sender.inner,"user",{x:56,y:56,size:96,stroke:24*3.6/96,color:"ink"});ctx.m.draw(sender,t0+1.05,{dur:ctx.style.dur("draw")*.4});
K.cross.draw("accent",t1,{by:t1+0.35,parent:accent.inner});
const arrow=ctx.el("return_arrow",{x:400,y:425,w:160,h:80,kind:"connector",exit:"recede"});
B.draw(arrow,W.arrow(150,35,10,35),{at:t1+0.35,by:t1+0.7,pen:"ink"});
// @form removal_list: a name no longer has access
const list=ctx.el("list",{x:1170,y:345,w:260,h:260,kind:"card",exit:"recede"});
const L=Loom.lesson.name_list(ctx,list.inner,{w:260,h:260,name:"takeback_names",marker:true});list.handle=L;
const words=ctx.el("off_words",{x:430,y:625,w:1070,h:100,kind:"text",exit:"wipe"});
B.write(words,"Link off or narrower",{x:0,y:0,w:580,h:65,role:"lead",at:t2,by:t3-0.25});
L.draw(t3-0.25,{by:t3+0.25});L.strike(1,t3+0.25,{by:t3+0.43,pen:"ink"});
B.write(words,"Remove names",{x:690,y:0,w:370,h:65,role:"lead",at:t3+0.43,by:ctx.speechEnd});
}});
