// @design open_path_copy: a copy drops into a tray while the original packet carries on, nothing stopping it
// Treatments considered: (1) static callouts only; (2) packet passes, copy drops into tray (chosen: the copy being made is the point); (3) zoom into the tray contents.
Loom.scene("b02", {
  build(ctx) {
    const M = ctx.m, T = Loom.treat, c = ctx.c;

    // held from b01: the board, the packet and the watcher label stay as b01 left them
    const board = ctx.held("board");
    const packet = ctx.held("packet");
    ctx.held("label_watcher");

    // the push crops the board's outer cards on purpose (medium shot on the watcher): declare the bleed
    const bi = (board.E || board).inner;
    if (bi && bi.querySelectorAll) bi.querySelectorAll("text").forEach((n) => n.setAttribute("data-bleed", "1"));

    const tAny = ctx.cue("Anyone on the path");
    const tReadable = ctx.cue("readable text");
    const tCopy = ctx.cue("copy it");

    // same size rule as the packet b01 drew
    let PW = 200; const PH = 120;
    try { const f = ctx.kit.fit("Password: Sunrise42", { role: "caption", weight: 500, maxLines: 1, w: 4000, h: 200 }); if (f && f.width && f.size) PW = Math.max(200, Math.ceil(f.width * 18 / f.size + 28)); } catch (e) { PW = 200; }
    const X0 = 350 - PW / 2, Y0 = 366;
    const leftNow = 740 - PW / 2;          // where b01 leaves the packet (left edge)
    const leftEnd = 1120;                  // where the original ends

    // @form copy_readable: the watcher's tray copy, the same card and ring as the original, hidden until the copy is made
    const cE = ctx.el("copy", { x: 860, y: 420, w: PW, h: PH, kind: "card", exit: "none" });
    const copy = Loom.lesson.packet(ctx, cE.inner, {});
    copy.setState("copy_readable", ctx.start);
    Loom.svg("rect", { x: -4, y: -4, width: PW + 8, height: PH + 8, rx: 18, fill: "none", stroke: c("accent"), "stroke-width": 4 }, cE.inner);

    // 1. "readable text": rows pulse, pill attaches under the packet
    packet.handle.setState("pulse", tReadable);
    // @form label_readable: pill naming what the packet is
    const lr = T.label(ctx, "label_readable", { x: leftNow + PW / 2, y: 590, text: "Readable text", to: [leftNow + PW / 2, 542], tone: "accent", role: "label", t: tReadable, as: "pill" });

    // 2. "Anyone on the path": watcher outline highlights (aperture opens)
    board.handle.setState("router_highlight", tAny);

    // 3. "copy it": the box duplicates the packet, the copy drops into the tray, the original moves on
    M.exit(lr, tCopy - 0.2, "recede");
    M.travel(packet.E || packet, tCopy - 0.2, { x: leftEnd - X0, y: 54, scale: 1, dur: 1.1 });
    M.reveal(cE, tCopy + 0.3);
    M.travel(cE, tCopy + 0.35, { x: 0, y: 190, scale: 1, dur: 0.7 });
    // @form label_copy: pill naming the tray content
    T.label(ctx, "label_copy", { x: 1190, y: 670, text: "Copy", to: [1066, 670], tone: "accent2", role: "label", t: tCopy + 0.5, as: "pill" });
  },
});
