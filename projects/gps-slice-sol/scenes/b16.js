// @design narrowing_locus: a closed path reduces to two isolated candidates
// Treatments: static candidates with signalling; traced shell then fading ring; filled overlap. Choose traced shell because narrowing is the content.
Loom.scene("b16", {build(ctx) {
const t=ctx.cue("A third sphere");
const E=ctx.el("circle_c",{x:0,y:0,w:1920,h:1080,kind:"connector",exit:"none"});
// The existing range machinery owns all shells; circle_c is its handoff anchor.
const h=ctx.held("circle_a").handle; E.handle=h;
const cut=ctx.cue("cuts that circle");
const two=ctx.cue("at just two points");
ctx.held("ground"); ctx.held("phone_pt");
const sats=ctx.held("sats");
ctx.held("circle_a"); ctx.held("circle_b");
const ring=ctx.held("ring");
if(sats && sats.handle && sats.handle.members) sats.handle.members[2].setState("named",t,{dur:ctx.style.dur("move")});
// @form third_shell: one more range restricts the shared locus
ctx.m.reveal(E,t,{dur:ctx.style.dur("enter")});
h.setState("circle",t,{id:"C",dur:ctx.style.dur("draw")});
if(ring) ctx.m.exit(ring,cut,"recede");
// The locus lives inside circle_a's kit, not inside the ring handoff anchor.
const locus=Array.from(h.g.querySelectorAll("path,ellipse")).filter(function(node){return node.getAttribute("stroke")===ctx.c("accent") || node.getAttribute("stroke")===ctx.c("accent2");});
Loom.drive(function(v){locus.forEach(function(node){node.style.opacity=String(1-v);});},cut,ctx.style.dur("exit"),"exit");
// @form shared_shells: continuity anchor for the held pair
const ab=ctx.el("circles_ab",{x:0,y:0,w:1920,h:1080,kind:"connector",exit:"none"});
ab.handle={a:ctx.held("circle_a"),b:ctx.held("circle_b")};
// @form isolated_candidates: schematic surface and sky candidates survive the ring
const pts=ctx.el("pts",{x:918,y:258,w:84,h:596,kind:"node",exit:"none"});
const markers=[42,554].map(function(y){
 const g=Loom.svg("g",{},pts.inner);
 Loom.svg("circle",{cx:42,cy:y,r:34,fill:ctx.c("accent2"),opacity:0.12},g);
 Loom.svg("circle",{cx:42,cy:y,r:24,fill:ctx.c("accent2"),opacity:0.25},g);
 Loom.svg("circle",{cx:42,cy:y,r:12,fill:ctx.c("accent2"),stroke:ctx.c("ink"),"stroke-width":3},g);
 return g;
});
pts.handle={g:pts.inner,space:markers[0],ground:markers[1],dimSpace:function(at){Loom.drive(function(v){markers[0].setAttribute("opacity",1-0.78*v);},at,ctx.style.dur("move"),"move");},glowGround:function(at){Loom.drive(function(v){markers[1].firstChild.setAttribute("opacity",0.12+0.2*v);},at,ctx.style.dur("move"),"move");}};
ctx.m.reveal(pts,two,{dur:ctx.style.dur("move")});
}});
