// @design copy_is_noise: the same copy action as before, but what drops into the tray is an unreadable pattern
// Treatments considered: (1) static tray with a caption; (2) packet slides past, copy drops into tray and greys (chosen: mirrors the earlier copy so the contrast carries); (3) zoom into the tray.
Loom.scene("b11", {
  build(ctx) {
    const M = ctx.m, T = Loom.treat, c = ctx.c;

    const board = ctx.held("board");
    ctx.held("cert");
    ctx.held("key_slots");
    const packet = ctx.held("packet");
    ctx.held("label_https");
    const lblScr = ctx.held("label_scrambled");

    // the push crops the board's outer cards on purpose: declare the bleed
    const bi = (board.E || board).inner;
    const bo = board.E || board;
    const win = Math.floor(ctx.start) + "-" + Math.ceil(ctx.end);
    [bo.inner].forEach((n) => { if (n && n.setAttribute) n.setAttribute("data-bleed", win); });
    const bg = board.handle && board.handle.g;
    if (bg && bg.setAttribute) bg.setAttribute("data-bleed", win);
    

    // declare the push's deliberate crop on every ancestor of the board's texts
    const root = ctx.station && ctx.station.svg;
    if (root && root.querySelectorAll) root.querySelectorAll("text").forEach((tn) => { if (/accounts|Password|User|Submit/.test(tn.textContent || "")) { for (let n = tn; n; n = n.parentNode) if (n.setAttribute) n.setAttribute("data-bleed", win); } });
    const tCopy = ctx.cue("The watcher copies");
    const tRead = ctx.cue("cannot read them");

    let PW = 200; const PH = 120;
    try { const f = ctx.kit.fit("Password: Sunrise42", { role: "caption", weight: 500, maxLines: 1, w: 4000, h: 200 }); if (f && f.width && f.size) PW = Math.max(200, Math.ceil(f.width * 18 / f.size + 28)); } catch (e) { PW = 200; }
    const X0 = 350 - PW / 2, Y0 = 366;       // packet's base box from b10
    const YE = 420;
    const endLeft = 1115 - PW / 2;           // blocks end just before the server key

    if (packet && packet.handle) packet.handle.setState("scrambled", ctx.start);
    // 1. the label retires, the scrambled packet slides on past the box
    if (lblScr) M.exit(lblScr, tCopy - 0.1, "recede");
    M.travel(packet.E || packet, tCopy, { x: 1160 - 0.3 * PW - X0, y: 78, scale: 0.6, dur: 1.2 });

    // @form copy: the watcher's tray copy, same card as b02 but noise
    const cE = ctx.el("copy", { x: 860, y: 420, w: PW, h: PH, kind: "card", exit: "none" });
    const copy = Loom.lesson.packet(ctx, cE.inner, {});
    copy.setState("scrambled", ctx.start);
    const ring = Loom.svg("rect", { x: -4, y: 26, width: PW + 8, height: 68, rx: 14, fill: "none", stroke: c("accent"), "stroke-width": 4 }, cE.inner);
    M.reveal(cE, tCopy + 0.45);
    M.travel(cE, tCopy + 0.5, { x: 0, y: 190, scale: 1, dur: 0.7 });

    // @form label_watcher2: pill naming the box, above it and clear of the tube label
    T.label(ctx, "label_watcher2", { x: 960, y: 392, text: "Watcher", to: [960, 366], tone: "accent3", role: "label", t: tCopy + 0.3, as: "pill" });

    // 2. "cannot read them": the copy greys, the ring lets go, 'Noise' names it
    copy.setState("copy_noise", tRead, 0.5);
    Loom.drive((e) => ring.setAttribute("opacity", String(1 - e)), tRead, 0.5, "move");
    // @form label_noise: pill naming what the tray holds
    T.label(ctx, "label_noise", { x: 720, y: 700, text: "Noise", to: [742, 680], tone: "accent3", role: "label", t: tRead + 0.1, as: "pill" });
  },
});
