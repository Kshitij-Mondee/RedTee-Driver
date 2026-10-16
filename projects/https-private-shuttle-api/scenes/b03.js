// @design promise_padlock: the same board holds while a dashed route traces the request and an open padlock appears where the outcome will close
// Treatments considered: (1) static board with a padlock icon; (2) route wipes along the path, then padlock draws in above the watcher (chosen: the route is what we follow); (3) zoom on the watcher only.
Loom.scene("b03", {
  build(ctx) {
    const { m, kit } = ctx;
    const T = Loom.treat;

    const tFollow = ctx.cue("Follow this request");
    const tNoise = ctx.cue("turns to noise");

    // held from b02: layout holds
    const board = ctx.held("board");
    const PE = ctx.held("packet");
    ctx.held("copy");
    ctx.held("label_watcher");
    (board.outer || board.el || board).setAttribute("data-bleed", ctx.start.toFixed(2) + "-" + ctx.end.toFixed(2));

    // @form dashed_route: the request's path from browser to server, wiped in
    const R = ctx.el("route", { x: 580, y: 470, w: 440, h: 20, kind: "connector", exit: "recede" });
    kit.line(R.inner, 0, 10, 440, 10, { stroke: ctx.c("ink"), sw: 6, dash: "16 14" });
    m.unmask(R, tFollow, { dir: "ltr", dur: 1.1 });

    // the packet pulses once as the route reaches it
    m.emphasis(PE, tFollow + 0.9);

    // @form padlock_open: the promised outcome, open, slate
    const PL = ctx.el("padlock", { x: 915, y: 192, w: 90, h: 117, kind: "icon", exit: "recede" });
    const pl = Loom.lesson.padlock(ctx, PL.inner, { open: true, scale: 0.9 });
    PL.ui = pl;
    m.reveal(PL, tNoise);

    T.label(ctx, "label_padlock", { x: 1135, y: 235, text: "Padlock", to: [1012, 245], t: tNoise + 0.4 });
  },
});
