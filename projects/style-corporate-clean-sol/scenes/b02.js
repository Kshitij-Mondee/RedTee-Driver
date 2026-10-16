// @design solitary_loss: a solid card becomes an outline inside a darkened device
Loom.scene("b02", {
  build(ctx, props) {
    // Treatments considered: static device with a risk signal; a camera push into the screen; a timed screen failure followed by card loss.
    // Choose timed state changes, since the empty outline is the causal outcome. No camera or added scenery.
    const m = ctx.m;
    const tFail = ctx.cue("the drive dies");
    const tLoss = ctx.cue("goes with it");
    const tArrival = ctx.cue("Tonight");
    // @form failure_device: the only storage location
    const laptopOpts = { w: 620, state: "on" };
    const ls = Loom.lesson.laptop.size(laptopOpts);
    const laptop = ctx.el("laptop", { x: 420, y: 300, w: ls.w, h: ls.h, kind: "instrument", exit: "none" });
    const lh = Loom.lesson.laptop(ctx, laptop.inner, laptopOpts);
    laptop.handle = lh;
    // @form vulnerable_file: the work file inside the device
    const reportOpts = { size: lh.slot.h, state: "whole" };
    const rs = Loom.lesson.report_file.size(reportOpts);
    const report = ctx.el("report_main", { x: 420 + lh.slot.x, y: 300 + lh.slot.y, w: rs.w, h: rs.h, kind: "token", exit: "none" });
    const rh = Loom.lesson.report_file(ctx, report.inner, reportOpts);
    report.handle = rh;
    // The cut delivers both parts within its first half second. Matched settle preserves the slot relationship.
    m.settle(laptop, ctx.start, { dur: ctx.style.dur("enter") });
    m.settle(report, ctx.start, { dur: ctx.style.dur("enter") });
    lh.setState("failed", tFail, { dur: ctx.style.dur("move") * 0.6 });
    // @form failure_tag: a short outcome attached to the drive fault
    const fault = [420 + lh.fault.x, 300 + lh.fault.y];
    const tag = Loom.treat.label(ctx, "tag_failed", { x: fault[0] + 160, y: fault[1] + 32, text: "Drive failed", to: fault, tone: "neg", role: "label", as: "tag", t: tFail });
    tag.exit = "none";
    rh.setState("empty", tLoss, { dur: ctx.style.dur("move") });
  }
});
