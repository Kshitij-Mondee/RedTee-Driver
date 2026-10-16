// @design count_is_the_trip: a readout beside the point counts while one pulse covers the last stretch, and both stop together when the pulse lands
Loom.scene("b11", {
  build(ctx) {
    const m = ctx.m;
    const S = (tag, a, p) => Loom.svg(tag, a, p);
    // Treatments: (1) static readout with a number (rejected: no event), (2) readout counts while the pulse lands, stamp drops in (chosen: count and trip are one event), (3) a ruler of time under the path (rejected: a second diagram).
    const PHONE = { x: 960, y: 812 };
    const PX = 1300, PY = 590, PW = 500, PH = 170; // readout panel (kit readout with one slot row)

    const tOpen = ctx.cue("From straight overhead");
    const tCount = ctx.cue("the trip takes");
    const tArr = ctx.cue("about 0.07 seconds");

    // ---- held scenery and the travelling pulse
    const pulseE = ctx.held("pulse"), stampE = ctx.held("stamp"), ptE = ctx.held("phone_pt");
    ctx.held("ground"); ctx.held("sats");
    // the pulse creeps on during the first phrase, then covers the last stretch while the timer counts
    [pulseE, stampE].forEach((E) => {
      if (!E || !E.handle) return;
      E.handle.travel(ctx.speechStart, tCount - ctx.speechStart, 0.7);
      E.handle.travel(tCount, tArr - tCount, 1);
      E.handle.setState("absorbed", tArr);
      m.exit(E, tArr + 0.6, "recede");
    });
    // the point takes the pulse in: a soft ring
    if (ptE && ptE.inner) {
      const rg = S("g", { transform: "translate(60 60) scale(1.15)" }, ptE.inner);
      const ring = S("circle", { cx: 0, cy: 0, r: 18, fill: "none", stroke: ctx.c("accent4"), "stroke-width": 4, opacity: 0 }, rg);
      Loom.drive((e) => { ring.setAttribute("r", 18 + 44 * e); ring.setAttribute("opacity", e > 0 && e < 1 ? 0.85 * (1 - e) : 0); }, tArr, 0.6, "move");
    }

    // ---- readout: the phone's panel, opened beside the point
    const readout = ctx.el("readout", { x: PX, y: PY, w: PW, h: PH, kind: "instrument", exit: "none" });
    const rh = Loom.lesson.phone(ctx, readout.inner, { form: "readout", rows: [""], unit: "s", timerTo: 0.07, decimals: 2 });
    m.reveal(readout, tOpen);

    // ---- the thin link from the point to the panel
    const link = ctx.el("readout_link", { x: 960, y: 670, w: 345, h: 150, kind: "connector", exit: "none" });
    const lp = S("path", { d: "M32 138 Q150 100 338 20", fill: "none", stroke: ctx.c("muted"), "stroke-width": 3, "stroke-linecap": "round" }, link.inner);
    m.draw(lp, tOpen + 0.15, { dur: 0.6 });
    // (panel left-middle is at (1300, 675) = local (340, 5))

    // ---- timer: counts over the last stretch, stops as the pulse lands; the accent frames it
    rh.setState("readout_timer", tCount, { dur: tArr - tCount, to: 0.07 });
    const timer = ctx.el("timer", { x: PX + 18, y: PY + 16, w: PW - 36, h: 64, kind: "value", exit: "none" });
    S("rect", { x: 2, y: 2, width: PW - 40, height: 60, rx: 18, fill: "none", stroke: ctx.c("accent"), "stroke-width": 4 }, timer.inner);
    m.reveal(timer, tCount);

    // ---- stamp chip: drops into the readout's slot as the pulse lands
    const chip = ctx.el("stamp_chip", { x: PX + 28, y: PY + 104, w: 96, h: 44, kind: "token", exit: "none" });
    S("rect", { x: 0, y: 6, width: 96, height: 40, rx: 14, fill: ctx.c("shadow"), opacity: 0.4 }, chip.inner);
    S("rect", { x: 0, y: 0, width: 96, height: 40, rx: 14, fill: ctx.c("surface2"), stroke: ctx.c("accent2"), "stroke-width": 3 }, chip.inner);
    const cg = S("g", { transform: "translate(30 2)" }, chip.inner);
    Loom.lesson.clock_face(ctx, cg, { size: 36 });
    m.drop(chip, tArr + 0.1);
  },
});
