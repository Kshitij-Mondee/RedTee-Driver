// @design bounded_forward: a travelling mark stays within a drawn boundary
// Three treatments: static ring with signal; moving key; chosen drawn forward between holders.
Loom.scene("b13",{build(ctx){
const W=ctx.engine,B=W.board(ctx),t=ctx.cue("set to the company"),f=ctx.cue("forwards it"),a=ctx.cue("a manager elsewhere");
// @form circular_boundary: company scope
const rings=ctx.el("rings",{x:340,y:140,w:720,h:720,kind:"instrument",exit:"recede"});
const R=Loom.lesson.access_rings(ctx,rings.inner,{w:720,h:720,radius:350,cx:360,cy:360,labels:false,name:"travel_rings",marker:true});rings.handle=R;
R.showRing("company",t,{by:t+0.55});R.hatch("company",t+0.55,{by:t+0.85});
// @form holder_group: three teammates inside the narrow scope
const team=ctx.el("team",{x:620,y:440,w:160,h:90,kind:"icon",exit:"recede"});
for(let i=0;i<3;i++){const E=ctx.el("teammate_"+i,{x:i*52,y:12,w:48,h:64,kind:"icon",parent:team.inner,exit:"recede"});ctx.kit.icon(E.inner,"user",{x:24,y:30,size:44,stroke:24*3.6/44,color:"ink"});ctx.m.draw(E,t+0.85+i*0.18,{dur:ctx.style.dur("draw")*0.2});}
const words=ctx.el("note_words",{x:1190,y:360,w:540,h:220,kind:"text",exit:"wipe"});
B.write(words,"Company link",{x:10,y:10,w:520,h:70,size:44,at:t+1.4,by:f,pen:"ink"});
// @form bent_forward: same marker route on each setting
const arrow=ctx.el("forward_arrow",{x:730,y:530,w:155,h:70,kind:"connector",exit:"recede"});
const marks=W.arrow(8,8,140,8,{bend:42});const Q=W.board(ctx,{marker:false});Q.draw(arrow,marks,{at:f,by:a,pen:"ink"});
const accent=ctx.el("forward_accent",{x:730,y:530,w:155,h:70,kind:"connector",exit:"recede"});B.draw(accent,marks,{at:f,by:a,pen:"accent"});
// @form margin_notes: setting then event
const manager=ctx.el("manager",{x:846,y:446,w:64,h:80,kind:"icon",exit:"recede"});ctx.kit.icon(manager.inner,"user",{x:32,y:36,size:60,stroke:24*3.6/60,color:"ink"});ctx.m.draw(manager,a,{dur:ctx.style.dur("draw")*0.4});
B.write(words,"Forwarded once",{x:10,y:115,w:520,h:70,size:40,at:a+0.4,by:ctx.speechEnd,pen:"ink"});
}});
