// @design single_point_of_failure: one empty thing is named as the weak point, then the fix appears as three blank slots
// Treatments: (1) static board with a term tag and rail (chosen base); (2) camera pull back then tag; (3) rail slides in from the right.
// Chosen: board stays put (held), tag drops from above onto the empty outline, rail tiles pop in one by one.
Loom.scene("b03", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const c = ctx.c;
    const L = Loom.lesson;

    // ---- geometry (station 1920x1080), shared with b02 and b04
    const LAP = { x: 150, y: 330, w: 620 };
    const lapSize = L.laptop.size({ w: LAP.w });
    const RAILPOS = { x: 872, y: 422 };
    const railSize = L.rule_rail.size({ size: "large", labels: false });

    // ---- laptop (held from b02 if it exists there, else drawn here with the same box)
    let laptopH, lapE;
    const heldLap = ctx.held("laptop");
    if (heldLap) {
      lapE = heldLap;
      laptopH = heldLap.handle;
    } else {
      lapE = ctx.el("laptop", { x: LAP.x, y: LAP.y, w: lapSize.w, h: lapSize.h, kind: "instrument", exit: "none" });
      laptopH = L.laptop(ctx, lapE.inner, { w: LAP.w, state: "failed" });
    }
    const slot = laptopH.slot;

    // ---- report (held, empty outline)
    let repE;
    const heldRep = ctx.held("report_main");
    if (heldRep) {
      repE = heldRep;
    } else {
      const rs = L.report_file.size({ size: slot.h });
      repE = ctx.el("report_main", { x: LAP.x + slot.x, y: LAP.y + slot.y, w: rs.w, h: rs.h, kind: "card", exit: "none" });
      L.report_file(ctx, repE.inner, { size: slot.h, state: "empty" });
    }
    const repBox = { x: LAP.x + slot.x, y: LAP.y + slot.y, w: Math.round(slot.h * 0.75), h: slot.h };

    // ---- term label hangs from the empty outline (above the laptop, stem into the outline top)
    const cSpof = ctx.cue("single point of failure");
    const lab = Loom.treat.label(ctx, "label_spof", {
      x: LAP.x + LAP.w / 2, y: 210, text: "Single point of failure",
      to: [repBox.x + repBox.w / 2, repBox.y], tone: "accent2", role: "label", t: cSpof,
    });

    // ---- rail (large, no labels): tiles arrive staggered in accent, then settle to unlit
    const cNum = ctx.cue("three numbers");
    const railE = ctx.el("rail", { x: RAILPOS.x, y: RAILPOS.y, w: railSize.w, h: railSize.h, kind: "instrument", exit: "none" });
    const rail = L.rule_rail(ctx, railE.inner, { size: "large", labels: false });
    rail.tiles.forEach((tl, i) => {
      const tt = cNum + i * 0.2;
      tl.g.setAttribute("opacity", 0);
      Loom.tween(tl.g, { opacity: 0 }, { opacity: 1 }, tt, { dur: 0.3 });
      rail.setState(i, "named", tt, { dur: 0.3 });
    });
    rail.setAll("unlit", Math.max(cNum + 0.8, ctx.end - 0.55), { dur: 0.4 });
  },
});
