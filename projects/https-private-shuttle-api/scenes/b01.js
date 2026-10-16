// @design exposed_journey: a readable bundle leaves its origin along an open path and stops short of the thing that watches the path
// Treatments considered: (1) static board with labels and a pulsing arrow; (2) board builds, packet travels the path to the watcher (chosen: exposure is a journey); (3) zoom on the watcher only.
Loom.scene("b01", {
  build(ctx) {
    const { m } = ctx;
    const T = Loom.treat;

    const tImagine = ctx.cue("Imagine");
    const tSubmit = ctx.cue("press Submit");
    const tWatcher = ctx.cue("A watcher sits");
    const tPath = ctx.cue("on the path");
    const tSee = ctx.cue("What does it see");

    // @form path_board: browser, path with watcher, server on one light board
    const B = ctx.el("board", { x: 120, y: 260, w: 1680, h: 640, kind: "scenery", exit: "recede" });
    const board = Loom.lesson.path_board(ctx, B.inner, { w: 1680, h: 640, startHidden: true });
    const t0 = Math.max(ctx.start + 0.1, tImagine);
    B.ui = board;
    board.show("browser", t0, 0.5);
    board.show("path", t0 + 0.25, 0.45);
    board.show("watcher", t0 + 0.45, 0.45);
    board.show("tray", t0 + 0.65, 0.45);
    board.show("server", t0 + 0.85, 0.5);

    // Submit presses; the readable packet lifts out of the form
    board.setState("submit_pressed", tSubmit);

    // @form packet_morph: the readable form packet, same object every crossing
    const PW = 290, PH = 174;
    const startC = [618, 480], midC = [650, 480], endC = [676, 480];
    const PE = ctx.el("packet", { x: startC[0] - PW / 2, y: startC[1] - PH / 2, w: PW, h: PH, kind: "token", exit: "recede" });
    const pk = Loom.lesson.packet(ctx, PE.inner, { scale: 1.5 });
    const pw = pk.w, ph = pk.h;
    PE.ui = pk;
    PE.setBox && PE.setBox({ w: pw, h: ph });
    m.reveal(PE, tSubmit + 0.3);
    // travel offsets are relative to the element's own placement (startC)
    m.travel(PE, tSubmit + 0.9, { x: midC[0] - startC[0], y: midC[1] - startC[1], scale: 1 }, { dur: 0.9 });
    m.travel(PE, tPath, { x: endC[0] - startC[0], y: endC[1] - startC[1], scale: 1 }, { dur: 1.3 });

    // watcher: aperture opens, label draws in
    board.setState("router_highlight", tWatcher);
    T.label(ctx, "label_watcher", { x: 960, y: 340, text: "Watcher", to: [960, 408], t: tWatcher + 0.2 });

    // hold; aperture turns toward the packet
    board.look(-1, tSee);
  },
});
