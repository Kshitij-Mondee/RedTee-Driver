// @design single_copy_loss: one object on a bare field loses its only holder, and the thing it held empties to an outline
// FOR b03's AUTHOR (held, same positions and sizes):
//   laptop      : x=240, y=250, w=620, h=374 (Loom.lesson.laptop {w:620}, scale 0.96875); state at end: failed
//   report_main : x=240+slot.x, y=250+slot.y = (240+ (46+(548-202.5)/2)*0.96875, 250+47*0.96875) ~ (452.9, 295.5);
//                 size = laptop slot.h (261.6 px tall, 196 wide); state at end: empty (dashed outline)
//   tag_failed leaves at the end of b02 (not held).
// Treatments considered: (1) static composition with a red tag, (2) laptop dies, tag wipes in, report fades to outline (chosen:
// the loss happens over time), (3) report drifting off (rejected: nothing else may bring it back or take it elsewhere).
Loom.scene("b02", {
  build(ctx, props) {
    const m = ctx.m, kit = ctx.kit;
    const LX = 240, LY = 250, LW = 620;
    const ls = Loom.lesson.laptop.size({ w: LW });
    const L = ctx.el("laptop", { x: LX, y: LY, w: ls.w, h: ls.h, kind: "instrument" });
    const lap = Loom.lesson.laptop(ctx, L.inner, { w: LW });

    const RH = lap.slot.h;
    const rs = Loom.lesson.report_file.size({ size: RH });
    const R = ctx.el("report_main", { x: LX + lap.slot.x, y: LY + lap.slot.y, w: rs.w, h: rs.h, kind: "card" });
    const rep = Loom.lesson.report_file(ctx, R.inner, { size: RH });

    // arrival: laptop settles, the Report is revealed on it, all inside the first half second
    m.settle(L, ctx.start + 0.05);
    m.reveal(R, ctx.start + 0.3, { dy: 0 });

    // "the drive dies": laptop fails, tag hangs from the fault mark
    const tDie = ctx.cue("the drive dies");
    lap.setState("failed", tDie);
    const fx = LX + lap.fault.x, fy = LY + lap.fault.y;
    const tag = Loom.data.tag(ctx, "tag_failed", { x: fx - 120, y: LY + lap.h + 24, text: "Drive failed", color: "neg", t: tDie + 0.35 });

    // "goes with it": the Report empties to its dashed outline
    const tGone = ctx.cue("goes with it");
    rep.setState("empty", tGone);
  },
});
