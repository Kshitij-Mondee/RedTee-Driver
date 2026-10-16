// @design promise_route: a dashed route leads to an open padlock above the watcher
Loom.scene("b03", {
  build(ctx, props) {
    // Treatment A: a static wide board with the padlock already present. Treatment B: a route wipes across the held board and the padlock arrives as a promise. Treatment C: a close view of the watcher with an oversized lock. Chosen B because the route leads the eye to the promise without changing the board.
    const { kit, m } = ctx;
    const tFollow = ctx.cue("Follow this request");
    const tNoise = ctx.cue("turns to noise");

    // @form board: held board pulls back from the watcher to the full route
    const board = ctx.held("board");
    Loom.cam.frame(board, { x: 120, y: 260, w: 1680, h: 640 }, ctx.start, 1.2, { margin: 0, maxScale: 1, cy: 500 });

    // @form watcher_label: held label remains with the watcher
    ctx.held("label_watcher");

    // @form packet: held readable request pulses once as its route is named
    const packet = ctx.held("packet");
    packet.handle.setState("readable", ctx.start);
    packet.handle.setState("pulse", tFollow);

    // @form copied_packet: held readable copy remains in the watcher tray
    const copy = ctx.held("copy");
    copy.handle.setState("copy_readable", ctx.start);

    // @form route: dashed expected route wipes from browser toward server
    const route = ctx.el("route", { x: 420, y: 468, w: 1120, h: 24, kind: "connector", exit: "wipe" });
    kit.line(route.inner, 0, 12, 1120, 12, { stroke: "line", sw: 4, dash: "16 14" });
    m.unmask(route, tFollow, { dur: 1.15 });

    // @form padlock: open generic padlock arrives above the watcher as the named promise
    const padlock = ctx.el("padlock", { x: 910, y: 200, w: 100, h: 130, kind: "icon", exit: "iris" });
    const padlockH = Loom.lesson.padlock(ctx, padlock.inner, { open: true });
    padlockH.setState("open", tNoise);
    m.reveal(padlock, tNoise, { dy: 12, dur: ctx.style.dur("enter") });

    // @form padlock_label: pill names the open padlock beside its body
    const label = ctx.el("label_padlock", { x: 1026, y: 225, w: 180, h: 56, kind: "bubble", exit: "wipe" });
    kit.pill(label.inner, 0, 0, 180, 56, { fill: "surface", stroke: "surface2", sw: 2 });
    kit.text(label.inner, "Padlock", { role: "label", size: 28, x: 14, y: 0, w: 152, h: 56, align: "center", valign: "middle", weight: 700, color: "accent" });
    m.reveal(label, tNoise + 0.2, { dy: 8, dur: ctx.style.dur("enter") });
  }
});
