// @design unbounded_forward: a route passes beyond every boundary
// Treatments: static no-edge label; travelling key; chosen extended marker route.
Loom.scene("b15",{build(ctx){
const W=ctx.engine,B=W.board(ctx);const base=ctx.held("rings");ctx.held("team");ctx.held("manager");ctx.held("forward_arrow");ctx.held("small_page");ctx.held("forward2");ctx.held("edge_stop");ctx.held("outsider");
const t=ctx.cue("Anyone with the link"),f=ctx.cue("no such edge");
// @form wider_scope: outer boundary is not a restriction on a holder
const ring=ctx.el("anyone_ring",{x:340,y:140,w:720,h:720,kind:"instrument",exit:"recede"});
base.handle.showRing("anyone",t,{by:t+0.65});
const words=ctx.el("no_edge_words",{x:1180,y:450,w:580,h:210,kind:"text",exit:"wipe"});B.write(words,"Anyone with the link: no edge",{x:10,y:10,w:560,h:190,size:34,maxLines:2,at:t+0.65,by:f,pen:"ink"});
// @form onward_route: same bent forward continues beyond the drawing
const arrow=ctx.el("forward3",{x:908,y:160,w:890,h:255,kind:"connector",exit:"recede"});B.draw(arrow,W.arrow(4,238,870,12,{bend:-70}),{at:f,by:f+0.4,pen:"accent"});
// @form scope_note: no edge is the point
// Words are laid down before the final travelling stroke so the short beat can settle.
}});
