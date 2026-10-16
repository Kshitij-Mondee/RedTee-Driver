// @design identity_gate: the returning route meets a door checked against a list
// Treatments: static identity sign; key animation; chosen door and checked list.
Loom.scene("b16",{build(ctx){
const W=ctx.engine,B=W.board(ctx),R=ctx.held("rings").handle;ctx.held("team");ctx.held("manager");ctx.held("forward_arrow");ctx.held("small_page");ctx.held("anyone_ring");
const t=ctx.cue("Same forward"),q=ctx.cue("asks who she is"),s=ctx.cue("it stays shut");
// @form named_boundary: small scope contains the team
const named=ctx.el("named_ring",{x:340,y:140,w:720,h:720,kind:"instrument",exit:"recede"});R.showRing("named",t,{by:t+0.65});
// @form identity_door: closed gate is the single emphasis
const door=ctx.el("door",{x:340,y:140,w:720,h:720,kind:"instrument",exit:"recede"});door.handle=R.door;
const accent=ctx.el("door_accent",{x:340,y:140,w:720,h:720,kind:"mark",exit:"recede"});R.door.draw("accent",t+0.65,{by:t+1.2,state:"shut",parent:accent.inner});
const words=ctx.el("named_words",{x:1190,y:365,w:560,h:250,kind:"text",exit:"wipe"});B.write(words,"Named people",{x:10,y:10,w:540,h:70,size:44,at:t+1.2,by:ctx.cue("The door"),pen:"ink"});
// @form identity_list: three listed holders, no invented names
const list=ctx.el("list",{x:1090,y:620,w:170,h:170,kind:"instrument",exit:"recede"});const L=Loom.lesson.name_list(ctx,list.inner,{w:170,h:170,name:"travel_list",marker:true});list.handle=L;L.draw(ctx.cue("The door"),{by:q});
// @form returning_forward: route from manager into the identity gate
const arrow=ctx.el("forward4",{x:817,y:408,w:72,h:100,kind:"connector",exit:"recede"});B.draw(arrow,W.arrow(65,40,39,80,{bend:25}),{at:q,by:q+0.4,pen:"ink"});
L.check(0,q+0.4,{by:q+0.65});L.check(1,q+0.65,{by:q+0.9});L.check(2,q+0.9,{by:q+1.15});
// @form denied_forward: identity is not forwarded
const cross=ctx.el("shut_cross",{x:845,y:490,w:34,h:34,kind:"mark",exit:"recede"});B.draw(cross,W.line(5,5,27,27).concat(W.line(27,5,5,27)),{at:s,by:s+0.25,pen:"ink"});
B.write(words,"Not on the list",{x:10,y:135,w:540,h:70,size:40,at:s+0.25,by:ctx.speechEnd,pen:"ink"});
}});
