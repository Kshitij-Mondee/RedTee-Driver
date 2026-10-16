// @design exposed_packet_copy: a watcher duplicates a readable card into its tray while the original continues
Loom.scene("b02", {
  build(ctx) {
    const { kit, m } = ctx;
    // Treatments considered: static exposure tableau, travelling packet with copy, split-screen tray comparison. Chosen: travelling packet with copy, because duplication is the visual argument.
    const tReadable = ctx.cue("readable text");
    const tWatcher = ctx.cue("Anyone on the path");
    const tCopy = ctx.cue("copy it");

    // @form path_board: fixed network route, carried from the prior beat without redrawing
    const board = ctx.held("board");
    const hBoard = board.handle;
    Loom.set(board.inner, { attr: { "data-bleed": "8-14.251" } }, ctx.start);
    hBoard.setState("router_highlight", ctx.start);

    // @form watcher_label: the existing name pill stays attached to the watcher
    const labelWatcher = ctx.held("label_watcher");

    // @form readable_packet: the original readable form packet continues from the prior beat
    const packet = ctx.held("packet");
    const hPacket = packet.handle;
    hPacket.setState("readable", ctx.start);

    // @form readable_label: amber pill attached above the named readable rows
    const readableLabel = ctx.el("label_readable", { x: 640, y: 350, w: 200, h: 54, kind: "bubble" });
    kit.pill(readableLabel.inner, 0, 0, 200, 54, { fill: "accent2", shadow: true });
    kit.text(readableLabel.inner, "Readable text", { role: "label", x: 12, y: 0, w: 176, h: 54, align: "center", valign: "middle", color: "onAccent", weight: 700, size: 28 });

    // @form copied_packet: second readable packet held in the watcher tray as evidence of exposure
    const copy = ctx.el("copy", { x: 860, y: 610, w: 200, h: 120, kind: "token", exit: "none" });
    const hCopy = Loom.lesson.packet(ctx, copy.inner, { variant: "noise", startHidden: true });
    hCopy.setState("copy_readable", tCopy + 0.18);

    // @form copy_label: pill naming the duplicated packet in the tray
    const copyLabel = ctx.el("label_copy", { x: 880, y: 550, w: 160, h: 54, kind: "bubble" });
    kit.pill(copyLabel.inner, 0, 0, 160, 54, { fill: "accent2", shadow: true });
    kit.text(copyLabel.inner, "Copy", { role: "label", x: 12, y: 0, w: 136, h: 54, align: "center", valign: "middle", color: "onAccent", weight: 700, size: 28 });

    m.emphasis(packet, tReadable, { scale: 1.04 });
    m.reveal(readableLabel, tReadable + 0.08, { dy: 10 });
    hPacket.setState("pulse", tReadable + 0.05);
    hBoard.highlight("watcher", 1, tWatcher);
    hBoard.aperture(1, tCopy - 0.08);
    m.travel(packet, tCopy + 0.05, { x: 480, y: 0, dur: 0.9 });
    m.drop(copy, tCopy + 0.16, { dy: -70 });
    m.reveal(copyLabel, tCopy + 0.48, { dy: 8 });
  },
});
