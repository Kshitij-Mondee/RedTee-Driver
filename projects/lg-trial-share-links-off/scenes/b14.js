// @design bounded_forward_continued: a second route meets the boundary
// Treatments: static edge signal; moving key; chosen drawn route to a stop.
Loom.scene("b14",{build(ctx){
const W=ctx.engine,B=W.board(ctx);const R=ctx.held("rings");ctx.held("team");ctx.held("manager");ctx.held("forward_arrow");
const t=ctx.cue("She opens it"),p=ctx.cue("is the permission"),e=ctx.cue("only inside the company");
// @form opened_page: opening does not need another grant
const page=ctx.el("small_page",{x:835,y:575,w:54,h:68,kind:"icon",exit:"recede"});ctx.kit.icon(page.inner,"file-text",{x:27,y:34,size:48,stroke:24*3.6/48,color:"ink"});ctx.m.draw(page,t,{dur:ctx.style.dur("draw")*0.5});
// @form margin_principle: the permission travels with the link
const words=ctx.el("permission_words",{x:1180,y:340,w:580,h:290,kind:"text",exit:"wipe"});
B.write(words,"The link is the permission",{x:10,y:10,w:560,h:130,size:40,at:p,by:ctx.cue("It can travel on"),pen:"ink",maxLines:2});
// @form second_route: route ends on company scope
const arrow=ctx.el("forward2",{x:880,y:385,w:65,h:65,kind:"connector",exit:"recede"});B.draw(arrow,W.arrow(10,55,27,12,{bend:-20}),{at:e,by:e+0.35,pen:"ink"});
const stop=ctx.el("edge_stop",{x:893,y:382,w:40,h:40,kind:"mark",exit:"recede"});
const Q=W.board(ctx,{marker:false});Q.draw(stop,W.line(4,7,30,30),{at:e+0.35,by:e+0.6,pen:"ink"});
const accent=ctx.el("edge_accent",{x:893,y:382,w:40,h:40,kind:"mark",exit:"recede"});B.draw(accent,W.line(4,7,30,30),{at:e+0.35,by:e+0.6,pen:"accent"});
const outsider=ctx.el("outsider",{x:960,y:360,w:140,h:115,kind:"icon",exit:"recede"});ctx.kit.icon(outsider.inner,"user",{x:75,y:45,size:58,stroke:24*3.6/58,color:"ink"});ctx.m.draw(outsider,e+0.6,{dur:ctx.style.dur("draw")*0.35});Q.draw(outsider,W.arrow(45,88,12,88,{bend:22}),{at:e+0.85,by:e+1.1,pen:"ink"});
B.write(words,"Edge of the company",{x:10,y:205,w:560,h:65,size:36,at:e+1.1,by:ctx.speechEnd,pen:"ink"});
}});
