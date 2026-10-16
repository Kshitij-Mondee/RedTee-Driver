// @design backup_failure_to_rule_promise: a failed device anchors a named risk while a three-tile rule arrives as the remedy
Loom.scene("b03", {
  keep: ["laptop", "report_main", "rail"],
  build(ctx) {
    const kit = ctx.kit;
    const m = ctx.m;
    const tFailure = ctx.cue("single point of failure");
    const tNumbers = ctx.cue("three numbers");
    // Treatment options: label-led static composition, a camera pullback with the rule arriving, or a rail-first reveal. Chosen: camera-like wide staging, because the label identifies the loss before the remedy arrives.

    // @form board_ground: quiet surface under the device system
    const ground = ctx.el("board_ground", { x: 96, y: 692, w: 1728, h: 74, kind: "scenery", exit: "none" });
    kit.rect(ground.inner, 0, 34, 1728, 4, { fill: "surface2", r: 2, shadow: false });

    // @form failed_laptop: hold the failed local home of the only report from b02
    const laptop = ctx.held("laptop");

    // @form empty_report: hold the missing content inside the failed laptop from b02
    const report = ctx.held("report_main");

    // @form failure_term: amber term label attached to the empty report
    Loom.treat.label(ctx, "label_spof", { x: 760, y: 200, text: "Single point of failure", to: [laptop.x + report.x + report.w / 2, laptop.y + report.y + report.h / 2], tone: "accent2", role: "label", t: tFailure });

    // @form three_number_rail: a single blue family that promises the rule
    const railSize = Loom.lesson.rule_rail.size({ size: "large", labels: "hidden" });
    const rail = ctx.el("rail", { x: 1100, y: 330, w: railSize.w, h: railSize.h, kind: "value", exit: "none" });
    const railHandle = Loom.lesson.rule_rail(ctx, rail.inner, { size: "large", labels: "hidden" });
    m.settle(rail, tNumbers, { dy: 20, dur: ctx.style.dur("enter") });
    railHandle.setState(0, "named", tNumbers, { dur: ctx.style.dur("enter") });
    railHandle.setState(1, "named", tNumbers + 0.16, { dur: ctx.style.dur("enter") });
    railHandle.setState(2, "named", tNumbers + 0.32, { dur: ctx.style.dur("enter") });
    railHandle.setState(0, "unlit", 16.55, { dur: ctx.style.dur("move") });
    railHandle.setState(1, "unlit", 16.63, { dur: ctx.style.dur("move") });
    railHandle.setState(2, "unlit", 16.71, { dur: ctx.style.dur("move") });
  },
});
