// @design identity_stays: a shared page can move while an identity cannot
// Treatments: static rule; passing key; chosen small showing-on note and rest rule.
Loom.scene("b17",{build(ctx){
const W=ctx.engine,B=W.board(ctx);const R=ctx.held("rings").handle;ctx.held("team");ctx.held("manager");ctx.held("anyone_ring");ctx.held("named_ring");ctx.held("door");ctx.held("list");ctx.held("forward4");ctx.held("shut_cross");
// @form quiet_door: previous emphasis becomes ink
const door=ctx.el("door_ink",{x:340,y:140,w:720,h:720,kind:"mark",exit:"recede"});R.door.draw("ink",ctx.start,{state:"shut",parent:door.inner});
const t=ctx.cue("show it on"),r=ctx.cue("The link travels"),n=ctx.cue("A name does not");
// @form showing_on: a listed holder can show the content to another
const note=ctx.el("shoulder_note",{x:1200,y:180,w:390,h:200,kind:"card",exit:"recede"});B.draw(note,W.rect(8,8,374,184),{at:t,by:t+0.35,pen:"ink"});
for(let i=0;i<2;i++){const p=ctx.el("shoulder_user_"+i,{x:55+i*210,y:45,w:70,h:90,kind:"icon",parent:note.inner,exit:"recede"});ctx.kit.icon(p.inner,"user",{x:35,y:40,size:66,stroke:24*3.6/66,color:"ink"});ctx.m.draw(p,t+0.35+i*0.2,{dur:ctx.style.dur("draw")*0.3});}
const page=ctx.el("shown_page",{x:165,y:80,w:60,h:80,kind:"icon",parent:note.inner,exit:"recede"});ctx.kit.icon(page.inner,"file-text",{x:30,y:40,size:56,stroke:24*3.6/56,color:"ink"});ctx.m.draw(page,t+0.75,{dur:ctx.style.dur("draw")*0.35});
// @form pocket_rule: travelling access is not travelling identity
const rule=ctx.el("rule_words",{x:1200,y:445,w:580,h:195,kind:"text",exit:"wipe"});
B.write(rule,"The link travels.",{x:10,y:10,w:560,h:70,size:44,at:r,by:n,pen:"ink"});
B.write(rule,"A name does not.",{x:10,y:105,w:560,h:70,size:44,at:n,by:ctx.speechEnd-ctx.style.dur("draw")*0.3,pen:"ink"});
const u=ctx.el("rule_underline",{x:1280,y:640,w:450,h:25,kind:"mark",exit:"recede"});B.draw(u,W.line(10,10,400,12),{at:ctx.speechEnd-ctx.style.dur("draw")*0.3,by:ctx.speechEnd,pen:"accent"});
}});
