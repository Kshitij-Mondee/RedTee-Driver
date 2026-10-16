// @design fixed_radius: a pivot preserves separation while tracing every allowed location
// Treatments: static ring with signalling; pivoting radius; growing disc. Choose pivoting radius because motion demonstrates equal separation.
Loom.scene("b14", {
  build(ctx) {
    const sweep = ctx.cue("So the phone sits somewhere on a sphere");
    const close = ctx.cue("at exactly that range");
    const ground = ctx.held("ground");
    const point = ctx.held("phone_pt");
    const sats = ctx.held("sats");
    const range = ctx.held("range_line");
    const handoff = sweep + ctx.style.dur("exit");
    ctx.m.exit(range,sweep,"recede");
    // @form equal_radius_locus: the kit traces every endpoint of one fixed length
    const E = ctx.el("circle_a", {x:0,y:0,w:1920,h:1080,kind:"connector",exit:"none"});
    const h = Loom.lesson.range_circles(ctx,E.inner,{});
    E.handle = h;
    ctx.m.reveal(E,handoff,{dur:ctx.style.dur("move")});
    h.setState("sweep",handoff,{id:"A",dur:ctx.style.dur("draw") * 3});
    h.setState("circle",close,{id:"A",dur:ctx.style.dur("move")});
  }
});
