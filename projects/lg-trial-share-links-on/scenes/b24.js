// @design bounded_return: a forward reaches a shut boundary beside three deliberate choices
// Treatments: static recall with signals; token travels into a door; drawn arrow stops short. Choose drawn arrow to preserve marker logic.
Loom.scene("b24",{build(ctx){
 const W=ctx.engine,B=W.board(ctx,{marker:true}),D=ctx.style.dur("draw"),S=ctx.style.dur("stagger");
 const a=ctx.cue("Back to the budget"), b=ctx.cue("Named people"), c=ctx.cue("view only"), d=ctx.cue("switched off after"), f=ctx.cue("A forwarded link");
 // @form recalled_boundaries: all access choices remain visible
 const rings=ctx.el("rings",{x:300,y:160,w:680,h:680,kind:"instrument",exit:"recede"});
 const rh=Loom.lesson.access_rings(ctx,rings.inner,{w:680,h:680,radius:330,cx:340,cy:340,labels:false,name:"payoff_rings",marker:true}); rings.handle=rh;
 rh.showRing("anyone",a,{by:a+2*S,pen:"muted"});
 rh.showRing("company",a+2*S,{by:a+4*S,pen:"muted"});
 rh.showRing("named",a+4*S,{by:a+6*S,pen:"ink"});
 // @form recalled_document: the same budget page
 const page=ctx.el("page",{x:585,y:409,w:110,h:147,kind:"instrument",exit:"recede"});
 const ph=Loom.lesson.budget_page(ctx,page.inner,{w:110,h:147,name:"payoff_budget",marker:true});page.handle=ph;
 ph.draw(a+6*S,{by:a+D});
 // @form named_team: the permitted holders
 const team=ctx.el("team",{x:575,y:557,w:140,h:44,kind:"icon",exit:"recede"});
 [22,70,118].forEach(x=>ctx.kit.icon(team.inner,"user",{x:x,y:22,size:38,stroke:24*3.6/38,color:"ink"}));
 ctx.m.draw(team,a+D,{dur:ctx.style.dur("move")});
 // @form deliberate_settings: three recalled decisions
 const settings=ctx.el("settings",{x:1190,y:295,w:570,h:390,kind:"text",exit:"wipe"});
 B.write(settings,"Named people",{x:65,y:0,w:490,h:80,role:"lead",at:b,by:c-S});
 B.draw(settings,W.tick(25,40,38),{at:c-S,by:c,pen:"ink"});
 B.write(settings,"View only",{x:65,y:130,w:490,h:80,role:"lead",at:c,by:d-S});
 B.draw(settings,W.tick(25,170,38),{at:d-S,by:d,pen:"ink"});
 B.write(settings,"Switched off after",{x:65,y:260,w:490,h:80,role:"lead",at:d,by:d+D});
 B.draw(settings,W.tick(25,300,38),{at:d+D,by:d+D+S,pen:"ink"});
 // @form returned_key: the original holder retains control
 const sender=ctx.el("payoff_sender",{x:160,y:780,w:88,h:88,kind:"icon",exit:"recede"});
 ctx.kit.icon(sender.inner,"user",{x:44,y:44,size:80,stroke:24*3.6/80,color:"ink"});ctx.m.draw(sender,d,{dur:ctx.style.dur("move")});
 const key=ctx.el("key",{x:265,y:795,w:160,h:70,kind:"instrument",exit:"recede"});
 const kh=Loom.lesson.link_key(ctx,key.inner,{w:160,h:70,name:"payoff_key",marker:true});key.handle=kh;
 kh.draw(d+D+S,{by:f});
 // @form checked_door: the named boundary is the only accent
 const door=ctx.el("door",{x:300,y:160,w:680,h:680,kind:"mark",exit:"recede"});
 rh.door.draw("accent",f,{by:f+ctx.style.dur("move"),state:"shut",parent:door.inner});
 // @form stopped_forward: a forward cannot cross the named door
 const arrow=ctx.el("forward_arrow",{x:795,y:480,w:300,h:240,kind:"connector",exit:"recede"});
 B.draw(arrow,W.arrow(270,200,15,20,{bend:35}),{at:f+ctx.style.dur("move"),by:f+D,pen:"ink"});
}});
