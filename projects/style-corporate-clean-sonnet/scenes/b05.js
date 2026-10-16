// @design copy_count_by_survival: one thing is copied twice, then one copy is struck and the others carry on
// Treatments: (1) static trio with ticks; (2) copies fan out from the original, one is struck, ghost refills it (chosen); (3) counter only.
Loom.scene("b05", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const c = ctx.c;
    const L = Loom.lesson;

    const lapE = ctx.held("laptop");
    const repE = ctx.held("report_main");
    const railE = ctx.held("rail");
    const lap = lapE.handle, rail = railE.handle;
    const slot = lap.slot;
    const repX = lapE.x + slot.x, repY = lapE.y + slot.y, repH = slot.h, repW = Math.round(repH * 0.75);

    const cThree = ctx.cue("Start with three");
    const cTwo = ctx.cue("plus two backups");
    const cFail = ctx.cue("One failure");
    const cZero = ctx.cue("leaves you with zero");

    lap.setState("on", ctx.start + 0.05);
    repE.handle.setState("whole", ctx.start + 0.15);
    const RS = 0.62, RX = Math.round((1920 - 912 * RS) / 2), RY = 745;
    m.travel(railE, ctx.start + 0.1, { x: RX - railE.x, y: RY - railE.y, scale: RS, dur: 0.7 });

    const CH = 160, CW = 120;
    const sx = repX + (repW - CW) / 2, sy = repY + (repH - CH) / 2;
    const homes = { copy_a: { x: 1010, y: 340 }, copy_b: { x: 1170, y: 340 } };
    const mk = (name, t) => {
      const E = ctx.el(name, { x: sx, y: sy, w: CW, h: CH, kind: "card", exit: "none" });
      const h = L.report_file(ctx, E.inner, { size: CH });
      m.pop(E, t, { dur: 0.3 });
      m.travel(E, t + 0.3, { x: homes[name].x - sx, y: homes[name].y - sy, dur: 0.8 });
      return { E, h };
    };
    // @form copy_file: a smaller Report copy
    const A = mk("copy_a", cThree);
    // @form copy_file: a second copy
    const B = mk("copy_b", cTwo);

    repE.handle.setState("empty", cFail);
    const mk2 = ctx.el("mark_struck", { x: repX + repW / 2 - 40, y: repY + repH / 2 - 40, w: 80, h: 80, kind: "mark", exit: "fade" });
    kit.mark(mk2.inner, "no", 40, 40, 80);
    m.pop(mk2, cFail + 0.3, { dur: 0.3 });

    rail.setState(0, "named", cZero, { dur: 0.35 });
    const tcx = RX + RS * rail.tiles[0].cx;
    const labE = ctx.el("label_copies", { x: Math.round(tcx - 160), y: RY + Math.round(RS * 190) + 12, w: 320, h: 44, kind: "label", exit: "none" });
    kit.text(labE.inner, "3 copies", { role: "label", size: 28, x: 0, y: 0, w: 320, h: 44, align: "center", valign: "middle", weight: 700, color: "accent2" });
    m.pop(labE, cZero + 0.2, { dur: 0.3 });

    const tG = cZero + 0.25;
    const ghost = ctx.el("ghost_copy", { x: homes.copy_a.x, y: homes.copy_a.y, w: CW, h: CH, kind: "card", exit: "fade" });
    L.report_file(ctx, ghost.inner, { size: CH });
    m.pop(ghost, tG, { dur: 0.2 });
    m.travel(ghost, tG + 0.15, { x: repX - homes.copy_a.x, y: repY - homes.copy_a.y, scale: repH / CH, dur: 0.5 });
    m.exit(mk2, tG + 0.5);
    m.exit(ghost, tG + 0.8);
    repE.handle.setState("restored", tG + 0.65, { dur: 0.5 });
  },
});
