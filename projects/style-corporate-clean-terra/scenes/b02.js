// @design one_copy_fails: a single laptop loses its only visible document, leaving an empty outline
Loom.scene("b02", {
  keep: ["laptop", "report_main"],
  build(ctx) {
    const { m } = ctx;
    const T = Loom.treat;
    // Treatments considered: a static laptop with a status tag, a close device failure, or a document fading into an outline. Chosen: the device failure, because the loss happens on the spoken words.
    const tTonight = ctx.cue("Tonight, the drive dies.");
    const tFail = ctx.cue("the drive dies");
    const tGone = ctx.cue("goes with it");

    // @form laptop: the one neutral device that holds the only copy
    const laptop = ctx.el("laptop", { x: 300, y: 274, w: 640, h: 386, kind: "instrument", exit: "none" });
    const laptopHandle = Loom.lesson.laptop(ctx, laptop.inner, { w: 640, state: "on" });

    // @form report_main: the only Report, placed directly in the laptop's document slot
    const report_main = ctx.el("report_main", {
      x: laptopHandle.slot.x, y: laptopHandle.slot.y,
      w: laptopHandle.slot.w, h: laptopHandle.slot.h,
      kind: "card", exit: "none", parent: laptop.inner,
    });
    const reportHandle = Loom.lesson.report_file(ctx, report_main.inner, { size: laptopHandle.slot.h, state: "whole" });

    m.settle(laptop, tTonight - 0.28);
    m.reveal(report_main, tTonight - 0.12, { dy: 10, dur: ctx.style.dur("enter") * 0.7 });

    laptopHandle.setState("failed", tFail, { dur: ctx.style.dur("move") * 0.6 });
    // @form tag_failed: a short red status tag hung from the laptop's fault mark
    const tag_failed = T.label(ctx, "tag_failed", {
      x: 900, y: 510, text: "Drive failed",
      to: [laptop.x + laptopHandle.fault.x, laptop.y + laptopHandle.fault.y],
      tone: "neg", role: "label", t: tFail,
    });
    reportHandle.setState("empty", tGone, { dur: ctx.style.dur("move") * 0.8 });
    m.exit(tag_failed, ctx.speechEnd - 0.22, "recede");
  },
});
