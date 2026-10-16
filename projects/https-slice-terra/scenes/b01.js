// @design path_exposure: a readable request travels from a login form toward a watcher
// Treatment A: a static wide board with the watcher called out.
// Treatment B: the selected route, the board assembles then a readable packet moves into exposure.
// Treatment C: a close watcher-first reveal, rejected because it hides the everyday action.
Loom.scene("b01", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const tImagine = ctx.cue("Imagine");
    const tSubmit = ctx.cue("press Submit");
    const tWatcher = ctx.cue("A watcher sits");
    const tPath = ctx.cue("on the path");
    const tQuestion = ctx.cue("What does it see");

    // @form path_board: fixed login, path, watcher and server station
    const board = ctx.el("board", { x: 120, y: 260, w: 1680, h: 640, kind: "scenery", exit: "none" });
    const boardHandle = Loom.lesson.path_board(ctx, board.inner, { startHidden: ["browser", "path", "watcher", "tray", "server"] });
    boardHandle.setState("idle", tImagine);
    boardHandle.setState("band_light", tImagine);
    boardHandle.show("browser", tImagine, 0.5);
    boardHandle.show("path", tImagine + 0.48, 0.55);
    boardHandle.show("watcher", tImagine + 1.02, 0.48);
    boardHandle.show("tray", tImagine + 1.42, 0.42);
    boardHandle.show("server", tImagine + 1.78, 0.5);
    boardHandle.setState("submit_pressed", tSubmit);

    // @form readable_packet: login rows lifted as one travelling card
    const packet = ctx.el("packet", { x: 450, y: 366, w: 200, h: 120, kind: "token", exit: "none" });
    const packetHandle = Loom.lesson.packet(ctx, packet.inner, { scale: 1.1 });
    packetHandle.setState("readable", tSubmit);
    m.reveal(packet, tSubmit, { dy: 0, dur: 0.18 });
    m.travel(packet, tSubmit + 0.16, { x: 190, y: 54, scale: 1, dur: 3.0 });

    // @form watcher_label: named pill on a muted leader
    const labelWatcher = ctx.el("label_watcher", { x: 760, y: 292, w: 200, h: 84, kind: "label", exit: "none" });
    kit.line(labelWatcher.inner, 100, 50, 100, 84, { stroke: "muted", sw: 2 });
    kit.pill(labelWatcher.inner, 0, 0, 200, 50, { fill: "surface", shadow: true });
    kit.text(labelWatcher.inner, "Watcher", { role: "label", x: 20, y: 0, w: 160, h: 50, align: "center", valign: "middle", weight: 700, color: "ink" });
    m.reveal(labelWatcher, tWatcher, { dy: 10, dur: 0.45 });
    boardHandle.highlight("watcher", 1, tWatcher);
    boardHandle.aperture(1, tWatcher);
    boardHandle.look(-1, tQuestion);
  }
});
