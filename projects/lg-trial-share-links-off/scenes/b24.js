// @design closed_boundary_callback: an incoming forward stops at a shut inner boundary while a returned token rests outside
Loom.scene("b24",{build(ctx){
// Treatments: static recap with signalling; traveling key; drawn rings and stopped forward. Choose drawn callback so the opening world resolves visibly.
const W=ctx.engine,B=W.board(ctx,{marker:true});
const t0=ctx.cue("Back to the budget"),t1=ctx.cue("Named people"),t2=ctx.cue("view only"),t3=ctx.cue("switched off after"),t4=ctx.cue("stops at the door");
// @form nested_boundaries: the narrow boundary is the active one
const rings=ctx.el("rings",{x:290,y:150,w:700,h:700,kind:"scenery",exit:"recede"});
const door=ctx.el("door",{x:290,y:150,w:700,h:700,kind:"mark",exit:"recede"});
const R=Loom.lesson.access_rings(ctx,rings.inner,{w:700,h:700,radius:340,cx:350,cy:350,name:"payoff_rings",labels:false,marker:true,doorParent:door.inner});rings.handle=R;
R.showRing("anyone",t0,{by:t0+0.3,pen:"muted"});R.showRing("company",t0+0.3,{by:t0+0.55,pen:"muted"});R.showRing("named",t0+0.55,{by:t0+0.8,pen:"ink"});
// @form familiar_budget: same page at the centre of the safe group
const page=ctx.el("page",{x:580,y:390,w:120,h:160,kind:"icon",exit:"recede"});
const P=Loom.lesson.budget_page(ctx,page.inner,{w:120,h:160,name:"payoff_budget",marker:true});page.handle=P;P.draw(t0+0.8,{by:t0+1.18});
// @form named_team: exactly three teammates inside the small ring
const team=ctx.el("team",{x:577,y:552,w:130,h:52,kind:"icon",exit:"recede"});
for(let i=0;i<3;i++){
const u=ctx.el("payoff_team_"+i,{x:i*44,y:0,w:42,h:48,kind:"icon",exit:"recede",parent:team.inner});
ctx.kit.icon(u.inner,"user",{x:21,y:23,size:38,stroke:24*3.6/38,color:"ink"});ctx.m.draw(u,t0+1.18+i*0.15,{dur:ctx.style.dur("draw")*.16});
}
// @form deliberate_settings: three choices resolved in ink
const settings=ctx.el("settings",{x:1130,y:340,w:650,h:330,kind:"text",exit:"wipe"});
B.write(settings,"Named people",{x:65,y:0,w:565,h:70,role:"lead",at:t1,by:t2-0.12});
B.draw(settings,W.tick(25,35,24),{at:t2-0.12,by:t2,pen:"ink"});
B.write(settings,"View only",{x:65,y:105,w:565,h:70,role:"lead",at:t2,by:t3-0.12});
B.draw(settings,W.tick(25,140,24),{at:t3-0.12,by:t3,pen:"ink"});
B.write(settings,"Switched off after",{x:65,y:210,w:565,h:70,role:"lead",at:t3,by:t3+0.62});
B.draw(settings,W.tick(25,245,24),{at:t3+0.62,by:t3+0.75,pen:"ink"});
// @form returned_key_callback: key rests beside its sender
const key=ctx.el("key",{x:205,y:773,w:160,h:70,kind:"icon",exit:"recede"});
const K=Loom.lesson.link_key(ctx,key.inner,{w:160,h:70,name:"payoff_key",marker:true});key.handle=K;K.draw(t3+0.75,{by:t3+1.02});
const sender=ctx.el("payoff_sender",{x:130,y:775,w:60,h:64,kind:"icon",exit:"recede"});ctx.kit.icon(sender.inner,"user",{x:30,y:30,size:54,stroke:24*3.6/54,color:"ink"});ctx.m.draw(sender,t3+1.02,{dur:ctx.style.dur("draw")*.2});
// @form stopped_forward: forward reaches the closed door, never the team
R.door.draw("accent",ctx.cue("A forwarded link"),{by:ctx.cue("A forwarded link")+0.5,state:"shut",parent:door.inner});
const forward=ctx.el("forward_arrow",{x:802,y:460,w:270,h:90,kind:"connector",exit:"recede"});
B.draw(forward,W.arrow(250,40,8,40),{at:t4,by:t4+0.55,pen:"ink"});
}});
