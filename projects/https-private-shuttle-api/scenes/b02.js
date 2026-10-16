// @design copy_on_path: a readable bundle passes a watcher that duplicates it unchanged into a tray, so original and copy read identically
// Treatments considered: (1) static board with two labelled packets; (2) packet passes the watcher and a copy drops into the tray (chosen: the copy being made is the point); (3) zoom on the tray only.
Loom.scene("b02", {
  build(ctx) {
    const { m } = ctx;
    const T = Loom.treat;

    const tReadable = ctx.cue("readable text");
    const tAnyone = ctx.cue("Anyone on the path");
    const tCan = ctx.cue("can copy");
    const tCopy = ctx.cue("copy it");

    // held from b01: the board, the packet and the watcher label stay as they were
    const board = ctx.held("board");
    const PE = ctx.held("packet");
    ctx.held("label_watcher");
    // the camera push crops the board's outer cards on purpose: declare that bleed
    const bleed = ctx.start.toFixed(2) + "-" + ctx.end.toFixed(2);
    [board.outer, board.el, board.inner, board, PE, PE && PE.outer, PE && PE.el, PE && PE.inner].forEach((n) => { if (n && n.setAttribute) n.setAttribute("data-bleed", bleed); });
    // the text-bearing groups inside the board (browser strip, form text, server strip) carry it too
    [board.el, board.inner, board.outer].forEach((root) => { if (root && root.querySelectorAll) root.querySelectorAll("g, text").forEach((n) => n.setAttribute("data-bleed", bleed)); });

    // @form packet_morph: the packet rows pulse once as it is called readable
    // the held packet sits centred (618,480) placement; b01 left it at (676,480)
    const startC = [618, 480];
    const endC = [1222, 480];
    m.emphasis && m.emphasis(PE, tReadable);

    // label 'Readable text' attaches above the packet where b01 left it (top edge y393)
    const LR = T.label(ctx, "label_readable", { x: 676, y: 345, text: "Readable text", to: [676, 393], t: tReadable });

    // the watcher box highlights with the kit's own highlight
    board.ui.setState("router_highlight", tAnyone);
    // b01 already opened the kit highlight, so add a bold accent ring that lands on the voice
    const WR = ctx.el("watcher_ring", { x: 836, y: 396, w: 248, h: 168, kind: "scenery", exit: "recede" });
    const ring = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    ring.setAttribute("x", 3); ring.setAttribute("y", 3); ring.setAttribute("width", 242); ring.setAttribute("height", 162); ring.setAttribute("rx", 24);
    ring.setAttribute("fill", "none"); ring.setAttribute("stroke", ctx.c("accent")); ring.setAttribute("stroke-width", 6);
    WR.inner.appendChild(ring);
    m.reveal(WR, tAnyone);

    // the packet moves on past the watcher; its label goes with it
    const dx = endC[0] - startC[0], dy = endC[1] - startC[1];
    const tGo = tCan - 0.6;
    const dur = 1.1;
    m.travel(PE, tGo, { x: dx, y: dy, scale: 1 }, { dur });
    m.exit(LR, tGo - 0.1, "recede");
    if (LR.lead) m.exit(LR.lead, tGo - 0.1, "recede");

    // @form watcher_tray: the copy, identical and readable, is made at the watcher box and drops into the tray
    const CS = 1.2, CW = 200 * CS, CH = 120 * CS;
    const CE = ctx.el("copy", { x: 960 - CW / 2, y: 480 - CH / 2, w: CW, h: CH, kind: "token", exit: "recede" });
    const cp = Loom.lesson.packet(ctx, CE.inner, { scale: CS });
    cp.setState("copy_readable", ctx.start);
    m.reveal(CE, tCopy);
    m.travel(CE, tCopy + 0.1, { x: 0, y: 160, scale: 1 }, { dur: 0.6 });

    T.label(ctx, "label_copy", { x: 1160, y: 615, text: "Copy", to: [1100, 640], t: tCopy + 0.5 });
  },
});
