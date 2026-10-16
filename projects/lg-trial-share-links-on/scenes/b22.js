// @design returning_token: a crossed token points back to its origin beside a reduced list
// Treatments: static signalled board; travelling token; drawn return arrow. Choose drawn return for marker continuity.
Loom.scene("b22", {build(ctx) {
 const W=ctx.engine,B=W.board(ctx,{marker:true});
 const a=ctx.cue("until when"), b=ctx.cue("take the key back"), c=ctx.cue("Switch it off"), d=ctx.cue("remove names");
 // @form time_heading: the final choice
 const head=ctx.el("until_head",{x:140,y:120,w:700,h:120,kind:"text",exit:"wipe"});
 B.heading(head,"Until when",{role:"title",at:a,by:a+ctx.style.dur("draw")});
 // @form return_key: a reusable link token
 const key=ctx.el("key",{x:540,y:365,w:320,h:140,kind:"instrument",exit:"recede"});
 const h=Loom.lesson.link_key(ctx,key.inner,{w:320,h:140,name:"takeback_key",marker:true}); key.handle=h;
 h.draw(a+ctx.style.dur("draw"),{by:a+2*ctx.style.dur("draw")});
 const cross=ctx.el("key_cross",{x:540,y:365,w:320,h:140,kind:"mark",exit:"recede"});
 const accent=ctx.el("key_cross_accent",{x:540,y:365,w:320,h:140,kind:"mark",exit:"recede"});
 h.cross.draw("accent",b,{by:b+ctx.style.dur("move"),parent:accent.inner});
 // @form sender_icon: the origin of the link
 const sender=ctx.el("sender",{x:220,y:380,w:112,h:112,kind:"icon",exit:"recede"});
 ctx.kit.icon(sender.inner,"user",{x:56,y:56,size:104,stroke:24*3.6/104,color:"ink"});ctx.m.draw(sender,a+ctx.style.dur("draw"),{dur:ctx.style.dur("move")});
 // @form return_path: direction back to origin
 const arrow=ctx.el("return_arrow",{x:340,y:480,w:360,h:150,kind:"connector",exit:"recede"});
 B.draw(arrow,W.arrow(340,20,20,20,{bend:-80}),{at:b+ctx.style.dur("move"),by:c,pen:"ink"});
 // @form removal_list: a permission removed
 const list=ctx.el("list",{x:1170,y:330,w:270,h:270,kind:"card",exit:"recede"});
 const lh=Loom.lesson.name_list(ctx,list.inner,{w:270,h:270,name:"takeback_names",marker:true});list.handle=lh;
 
 // @form off_labels: two ways of reducing reach
 const words=ctx.el("off_words",{x:400,y:655,w:1100,h:90,kind:"text",exit:"wipe"});
 B.write(words,"Link off or narrower",{x:0,y:0,w:620,h:80,role:"lead",at:c,by:c+ctx.style.dur("draw")});
 lh.draw(c+ctx.style.dur("draw"),{by:c+ctx.style.dur("draw")+ctx.style.dur("stagger")});lh.strike(1,d,{by:d+ctx.style.dur("stagger")});
 B.write(words,"Remove names",{x:770,y:0,w:330,h:80,role:"lead",at:d,by:ctx.speechEnd});
}});
