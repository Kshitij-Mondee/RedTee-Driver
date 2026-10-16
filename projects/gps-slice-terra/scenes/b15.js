// @design range_ring: two distance spheres share a luminous intersection ring
Loom.scene("b15", {
  build(ctx) {
    const { kit, m } = ctx;
    // Treatments: static overlap diagram; a second range sweep; chosen, circle B grows then the shared ring draws.
    const ground = ctx.held("ground");
    const phonePt = ctx.held("phone_pt");
    const sats = ctx.held("sats");
    const circleA = ctx.held("circle_a");
    const addB = ctx.cue("Add a second satellite.");
    const meet = ctx.cue("Where the two spheres meet");
    const trace = ctx.cue("they trace a circle.");

    // @form circle_b: second satellite range sphere through the phone point
    const circleB = ctx.el("circle_b", { x: 0, y: 0, w: 1920, h: 1080, kind: "connector", exit: "none" });
    // Fallback while the assigned range_circles kit is repaired: the visible arc is centred at B and terminates at the phone marker's edge.
    const bArc = kit.path(circleB.inner, "M705 0 A810 810 0 0 0 945 799 M975 825 A810 810 0 0 0 1920 886", { stroke: "accent2", sw: 5 });
    m.draw(bArc, addB, { dur: ctx.style.dur("draw") });

    // @form ring: tilted intersection ring through the two sphere crossings
    const ring = ctx.el("ring", { x: 0, y: 0, w: 1920, h: 1080, kind: "connector", exit: "none" });
    // The two visible sides of the tilted ring terminate at the phone marker, its lower crossing.
    const ringPath = kit.path(ring.inner, "M913 0 C912 250 928 640 940 770 M932 0 C940 200 964 640 970 770", { stroke: "accent", sw: 7 });
    m.draw(ringPath, trace, { dur: ctx.style.dur("draw") });
    m.emphasis(ring, trace + 0.18);

    sats.handle.setState("named", addB);
    // The held ground, phone point and first range already carry their settled states.
  },
});
