// @design three_moves_named: three labelled tiles arrive in spoken order under a system that stays put
// Treatments considered: (1) static bar with all three tiles at once (signalled by none),
// (2) tiles arrive one by one, each blue while named then neutral (chosen: order = order taught),
// (3) tiles fly in from the system parts (implies wrong mapping).
Loom.scene("b03", {
  build(ctx, props) {
    const { m } = ctx;

    // held system from b01/b02: nothing redrawn, it stays above
    ctx.held("browser");
    ctx.held("server");
    ctx.held("path");
    ctx.held("watcher");

    const tThree = ctx.cue("three moves");
    const t1 = ctx.cue("prove who");
    const t2 = ctx.cue("agree a key");
    const t3 = ctx.cue("scramble");

    // the step bar: its row appears, then each tile arrives named and settles to neutral
    const SB = ctx.el("step_bar", { x: 360, y: 780, w: 1200, h: 90, kind: "card", exit: "none" });
    // @form step_bar: three numbered tiles along the bottom, lit one at a time
    const s = Loom.lesson.step_bar(ctx, SB.inner, { origin: [360, 780] });
    s.setState("hidden", 0);
    m.reveal(SB, tThree);
    s.setState("shown", t1, 0);
    s.setState("shown", t2, 1);
    s.setState("shown", t3, 2);
  },
});
