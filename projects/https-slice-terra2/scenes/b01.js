// @design exposed_login_packet: a readable login packet leaves a form and crosses an open path toward a watcher
Loom.scene("b01", {
  build(ctx) {
    const { kit, m } = ctx;
    // Treatments considered: static board with a highlighted route; a close crop on the submitted form; chosen, a wide board where the packet travels into the watcher’s territory.
    const tImagine = ctx.cue("Imagine");
    const tSubmit = ctx.cue("press Submit");
    const tWatcher = ctx.cue("A watcher sits");
    const tPath = ctx.cue("on the path");
    const tQuestion = ctx.cue("What does it see");

    // @form path_board: fixed open route between the browser and server
    const board = ctx.el("board", { x: 120, y: 260, w: 1680, h: 640, kind: "scenery", exit: "none" });
    const boardH = Loom.lesson.path_board(ctx, board.inner, { startHidden: true });
    boardH.setState("idle", tImagine);
    boardH.show("browser", tImagine, 0.42);
    boardH.show("path", tImagine + 0.35, 0.42);
    boardH.show("watcher", tImagine + 0.70, 0.42);
    boardH.show("tray", tImagine + 0.93, 0.36);
    boardH.show("server", tImagine + 1.16, 0.42);
    boardH.setState("submit_pressed", tSubmit);
    boardH.setState("router_highlight", tWatcher);
    boardH.aperture(1, tWatcher + 0.10);
    boardH.look(-0.55, tQuestion);

    // @form readable_packet: the two readable login rows carried over the open path
    const packet = ctx.el("packet", { x: 250, y: 366, w: 200, h: 120, kind: "token", exit: "none" });
    const packetH = Loom.lesson.packet(ctx, packet.inner, { scale: 1.05 });
    packetH.setState("readable", tSubmit);
    m.reveal(packet, tSubmit + 0.08, { dy: 18, dur: 0.46 });
    m.travel(packet, tSubmit + 0.08, { x: 390, y: 54, dur: 0.55 });
    m.emphasis(packet, tQuestion + 0.05);

    // @form watcher_label: a white name pill on a leader attached to the watcher box
    const label = ctx.el("label_watcher", { x: 830, y: 292, w: 260, h: 100, kind: "bubble", exit: "none" });
    kit.line(label.inner, 130, 62, 130, 100, { stroke: "muted", sw: 3 });
    kit.pill(label.inner, 24, 4, 212, 58, { fill: "surface", shadow: true });
    kit.text(label.inner, "Watcher", { role: "label", x: 42, y: 4, w: 176, h: 58, align: "center", valign: "middle", weight: 700, color: "ink" });
    m.reveal(label, tWatcher + 0.16, { dy: 10, dur: 0.46 });
  },
});
