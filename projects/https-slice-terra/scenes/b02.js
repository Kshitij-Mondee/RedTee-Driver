// @design watcher_copy: readable request enters a watcher and leaves an identical card in its tray
Loom.scene("b02", {
  build(ctx, props) {
    // Treatment A: a static board with two cards and labels. Treatment B: a moving original splits into a tray copy. Treatment C: an oversized watcher fills the frame. Chosen B because the duplicate is the visual argument.
    const { kit, m } = ctx;
    const tReadable = ctx.cue("readable text");
    const tPath = ctx.cue("Anyone on the path");
    const tCopy = ctx.cue("copy it");

    // @form board: held path board with a watcher-centred camera push
    const board = ctx.held("board");
    const boardH = board.handle;
    boardH.setState("idle", ctx.start);
    Loom.cam.frame(board, { x: 640, y: 160, w: 1120, h: 630 }, tReadable, 1.2, { margin: 0, maxScale: 1 });

    // @form watcher_label: held label remains attached to the watcher
    const labelWatcher = ctx.held("label_watcher");

    // @form packet: held readable login rows travelling across the path
    const packet = ctx.held("packet");
    const packetH = packet.handle;
    packetH.setState("readable", ctx.start);
    packetH.setState("pulse", tReadable);

    // @form readable_label: pill attached beneath the readable packet
    const readableLabel = ctx.el("label_readable", { x: 620, y: 548, w: 220, h: 76, kind: "bubble", exit: "wipe" });
    kit.line(readableLabel.inner, 110, 0, 110, 28, { stroke: "muted", sw: 2 });
    kit.pill(readableLabel.inner, 0, 28, 220, 48, { fill: "surface", stroke: "surface2", sw: 2 });
    kit.text(readableLabel.inner, "Readable text", { role: "label", size: 28, x: 14, y: 28, w: 192, h: 48, align: "center", valign: "middle", weight: 700, color: "accent2" });
    m.reveal(readableLabel, tReadable, { dy: 10, dur: ctx.style.dur("enter") });

    boardH.setState("router_highlight", tPath);
    boardH.highlight("watcher", 1, tPath);
    boardH.aperture(1, tCopy);

    // @form copied_packet: identical readable card held in the watcher tray
    const copy = ctx.el("copy", { x: 860, y: 610, w: 200, h: 120, kind: "card", exit: "none" });
    const copyH = Loom.lesson.packet(ctx, copy.inner, {});
    copyH.setState("copy_readable", tCopy);
    m.drop(copy, tCopy + 0.12, { dy: -34, dur: 0.55 });

    // @form copy_label: pill naming the card retained by the tray
    const copyLabel = ctx.el("label_copy", { x: 1100, y: 600, w: 220, h: 76, kind: "bubble", exit: "wipe" });
    kit.line(copyLabel.inner, 110, 0, 110, 28, { stroke: "muted", sw: 2 });
    kit.pill(copyLabel.inner, 0, 28, 220, 48, { fill: "surface", stroke: "surface2", sw: 2 });
    kit.text(copyLabel.inner, "Copy", { role: "label", size: 28, x: 16, y: 28, w: 188, h: 48, align: "center", valign: "middle", weight: 700, color: "ink" });
    m.reveal(copyLabel, tCopy + 0.42, { dy: 10, dur: ctx.style.dur("enter") });

    m.travel(packet, tCopy, { x: 480, y: 0, dur: 0.9 });
  }
});
