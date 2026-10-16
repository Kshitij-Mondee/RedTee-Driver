// @design carried_token: one emitted mark gains a clock and follows one route
// Treatments: static signalled path; tagged travelling pulse; expanding rings. Choose the travelling pulse because displacement is the content.
Loom.scene("b09", {
  build(ctx) {
    const leave = ctx.cue("A signal leaves");
    const tagged = ctx.cue("stamped with its sending time");
    const travel = ctx.cue("heads for your phone");
    const ground = ctx.held("ground");
    const point = ctx.held("phone_pt");
    const sats = ctx.held("sats");
    sats.handle.members[0].setState("named",leave);
    sats.handle.members[1].setState("dim",leave);
    sats.handle.members[2].setState("dim",leave);
    // @form travelling_front: one warm wavefront leaves the established broadcaster
    const pulse = ctx.el("pulse",{x:350,y:180,w:380,h:320,kind:"connector",exit:"none"});
    const h = Loom.lesson.signal(ctx,pulse.inner,{from:[80,50],to:[257,244],state:"pulse"});
    pulse.handle = h;
    // @form riding_clock: the kit's own time chip rides the same wavefront
    const stamp = ctx.el("stamp",{x:350,y:180,w:380,h:320,kind:"token",exit:"none"});
    stamp.inner.appendChild(h.chips[1].g);
    h.chips[0].g.style.display = "none";
    if (h.chips[1].tx) h.chips[1].tx.style.display = "none";
    if (h.chips[1].ta) h.chips[1].ta.style.display = "none";
    stamp.handle = h;
    ctx.m.pop(pulse,leave,{dur:ctx.style.dur("enter")});
    h.setState("pulse_tagged",tagged);
    ctx.m.stamp(stamp,tagged,{dur:ctx.style.dur("enter")});
    h.travel(travel,ctx.style.dur("draw"));
  }
});
