// @design intersecting_shells: a second outline creates a shared closed locus
// Treatments: static overlap with signalling; growing second shell; orbiting camera. Choose growth because the shared locus appears with the second constraint.
Loom.scene("b15", {
  build(ctx) {
    const add = ctx.cue("Add a second satellite");
    const meet = ctx.cue("Where the two spheres meet");
    const trace = ctx.cue("they trace a circle");
    const ground = ctx.held("ground");
    const phone = ctx.held("phone_pt");
    const sats = ctx.held("sats");
    const a = ctx.held("circle_a");
    // @form second_shell: a second equal range closes around its source
    const B = ctx.el("circle_b",{x:0,y:0,w:1920,h:1080,kind:"connector",exit:"none"});
    const bh = a.handle;
    B.handle = bh;
    ctx.m.reveal(B,add,{dur:ctx.style.dur("enter")});
    bh.setState("sweep",add,{id:"B",dur:ctx.style.dur("draw")});
    bh.setState("circle",meet,{id:"B",dur:ctx.style.dur("move")});
    // @form shared_locus: the two surfaces share a schematic ring
    const R = ctx.el("ring",{x:0,y:0,w:1920,h:1080,kind:"connector",exit:"none"});
    const rh = a.handle;
    R.handle = rh;
    // @form locus_label: spoken words identify the shared curved surface
    Loom.svg("text",{x:1090,y:488,"font-size":28,"font-family":"inherit",fill:ctx.c("ink")},R.inner).textContent = "a circle";
    ctx.m.reveal(R,trace,{dur:ctx.style.dur("enter")});
    rh.setState("ring",trace,{dur:ctx.style.dur("draw")});
    // Both semantic handoff handles drive the one retained ranging machine; no kit artwork is copied.
  }
});
