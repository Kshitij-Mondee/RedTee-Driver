// @design promise_route: a dashed request route leads to an open padlock that will later close
Loom.scene("b03", {
  build(ctx) {
    const { kit, m } = ctx;
    // Treatments considered: a headline promise, a static icon, a route that resolves at an open lock. Chosen: the route and lock, because the same board remains the argument.
    const tFollow = ctx.cue("Follow this request");
    const tNoise = ctx.cue("turns to noise");

    // @form path_board: fixed network board held exactly at its station coordinates
    const board = ctx.held("board");
    const hBoard = board.handle;
    hBoard.setState("router_highlight", ctx.start);

    // @form readable_packet: original request held from the prior beat and pulsed once
    const packet = ctx.held("packet");
    const hPacket = packet.handle;
    hPacket.setState("readable", ctx.start);

    // @form watcher_copy: readable tray copy held as the exposure evidence
    const copy = ctx.held("copy");
    const hCopy = copy.handle;
    hCopy.setState("copy_readable", ctx.start);

    // @form watcher_label: existing watcher label remains attached to the board
    const labelWatcher = ctx.held("label_watcher");

    // @form request_route: dashed expected route, wiped into the server direction
    const route = ctx.el("route", { x: 560, y: 458, w: 920, h: 44, kind: "connector", exit: "recede" });
    kit.line(route.inner, 0, 22, 920, 22, { stroke: "line", sw: 4, dash: "14 12" });
    m.unmask(route, tFollow, { dir: "ltr", dur: ctx.style.dur("draw") });

    // @form promise_padlock: generic open lock, placed above the watcher for the later payoff
    const padlock = ctx.el("padlock", { x: 910, y: 200, w: 100, h: 130, kind: "instrument", exit: "recede" });
    const hPadlock = Loom.lesson.padlock(ctx, padlock.inner, { open: true });
    hPadlock.setState("open", tNoise);
    m.settle(padlock, tNoise, { dy: 18 });

    // @form padlock_label: treated pill names the lock beside its body
    const T = Loom.treat;
    T.label(ctx, "label_padlock", { x: 1028, y: 238, text: "Padlock", to: [1008, 264], tone: "accent2", role: "label", as: "pill", t: tNoise + 0.16 });

    hPacket.setState("pulse", tFollow + 0.12);
    Loom.cam.frame(board, { x: 118, y: 60, w: 1684, h: 947 }, ctx.start, 1.2, { margin: 0, cy: 500, maxScale: 1.14 });
  },
});
