// @design open_path_exposure: a submitted form travels readable along an open path toward a watcher box
// Treatments considered: (1) static board with a label only, (2) board builds in reading order then the packet travels (chosen: motion is the content), (3) zoom on the watcher.
Loom.scene("b01", {
  build(ctx, props) {
    const m = ctx.m, c = ctx.c;
    const T = Loom.treat;

    // board: the whole path board, built in reading order
    const B = ctx.el("board", { x: 120, y: 260, w: 1680, h: 640, kind: "scenery", exit: "recede" });
    // @form path_board: the fixed diagram board
    const board = Loom.lesson.path_board(ctx, B.inner, { startHidden: true });
    const tBuild = ctx.cue("Imagine");
    board.show("browser", tBuild, 0.5);
    board.show("path", tBuild + 0.35, 0.5);
    board.show("watcher", tBuild + 0.7, 0.5);
    board.show("tray", tBuild + 1.0, 0.5);
    board.show("server", tBuild + 1.3, 0.5);
    board.setState("idle", tBuild);

    // packet: starts inside the form, lifts out on Submit
    let PW = 200; let PH = 120;
    try { const f = ctx.kit.fit("Password: Sunrise42", { role: "caption", weight: 500, maxLines: 1, w: 4000, h: 200 }); if (f && f.width && f.size) PW = Math.max(200, Math.ceil(f.width * 18 / f.size + 28)); } catch (e) { PW = 200; }
    PW = Math.ceil(PW * 1.04); const X0 = 350 - PW / 2, Y0 = 366;
    const P = ctx.el("packet", { x: X0, y: Y0, w: 260, h: PH, kind: "card", exit: "recede" });
    // @form packet_readable: the form data as readable rows
    const packet = Loom.lesson.packet(ctx, P.inner, { scale: 1.04 });
    PW = packet.w; PH = packet.h;
    // accent ring on the readable packet
    const ring = Loom.svg("rect", { x: 2, y: 2, width: packet.w - 4, height: packet.h - 4, rx: 14, fill: "none", stroke: c("accent"), "stroke-width": 3 }, P.inner);
    const tSub = ctx.cue("press Submit");
    board.setState("submit_pressed", tSub);
    m.reveal(P, tSub + 0.3);
    m.travel(P, tSub + 0.3, { x: 700 - PW / 2 - X0 + 20, y: 54, scale: 1, dur: 0.9 });
    packet.setState("pulse", tSub + 1.3);

    // watcher wakes up
    const tWatch = ctx.cue("A watcher sits");
    board.setState("router_highlight", tWatch);
    // @form label_pill: the Watcher tag on a leader
    T.label(ctx, "label_watcher", { x: 960, y: 340, text: "Watcher", to: [960, 408], tone: "ink", role: "label", t: tWatch + 0.2, as: "pill" });

    // packet slides along the path
    const tPath = ctx.cue("on the path");
    m.travel(P, tPath, { x: 730 - PW / 2 - X0, y: 480 - packet.h / 2 - Y0, scale: 1, dur: 1.0 });

    // aperture turns toward the packet
    const tSee = ctx.cue("What does it see");
    board.look(-1, tSee);
  },
});
