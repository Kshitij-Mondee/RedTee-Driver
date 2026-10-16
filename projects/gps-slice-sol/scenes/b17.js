// @design resolved_candidate: a remote alternative recedes while the grounded point brightens and hesitates
// Treatments: static signalled candidates; a drifting remote alternative; a crossfade into the grounded point. Choose drift because rejection is spatial.
Loom.scene("b17", {
  build(ctx) {
    const space = ctx.cue("One is usually far out in space");
    const you = ctx.cue("on the ground, is you");
    const principle = ctx.cue("In principle");
    const ground = ctx.held("ground");
    const phone = ctx.held("phone_pt");
    const sats = ctx.held("sats");
    const a = ctx.held("circle_a");
    const b = ctx.held("circle_b");
    const c = ctx.held("circle_c");
    const pts = ctx.held("pts");
    // @form rejected_candidate: animate b16's actual marker, never a copied point.
    const markers = pts.handle;
    const driftDur = ctx.cue("The other") - space - ctx.style.dur("move");
    Loom.drive(function(e){
      markers.space.setAttribute("opacity",1-e);
      markers.space.setAttribute("transform","translate(0 "+(-160*e)+")");
    },space,driftDur,"move");
    // Ground and phone share (960,812): the gold candidate dissolves into teal.
    Loom.drive(function(e){
      markers.ground.setAttribute("opacity",1-e);
      markers.ground.setAttribute("transform","translate(42 554) scale("+(1-0.65*e)+") translate(-42 -554)");
    },you,ctx.style.dur("move"),"move");
    ctx.m.exit(pts,you+ctx.style.dur("move"),"recede");
    phone.handle.setState("arc",you,{dur:ctx.style.dur("move")});
    phone.handle.pulse(you,ctx.style.dur("draw"));
    // @form conditional_glow: one small hesitation in the existing receiver glow
    const point = phone.handle.point;
    Loom.drive(function(e){point.setAttribute("opacity",1-0.35*Math.sin(Math.PI*e));},principle,ctx.style.dur("move"),"linear");
  }
});
