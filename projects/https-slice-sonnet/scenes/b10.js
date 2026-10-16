// @design readable_to_scrambled: a card of readable rows slides through a lit lens and leaves as slate blocks inside a doubled tube
// Treatments considered: (1) static tube with a before/after pair; (2) packet travels through the lens and morphs (chosen: the transformation is the point); (3) zoom into the key.
Loom.scene("b10", {
  build(ctx) {
    const M = ctx.m, T = Loom.treat, c = ctx.c;

    const board = ctx.held("board");
    const cert = ctx.held("cert");
    const keys = ctx.held("key_slots");
    const tray = ctx.held("tray_values");
    const hs = (h, s, t, d) => { if (h && h.handle) h.handle.setState(s, t, d); };

    // push crops the outer cards on purpose: declare the bleed
    const bi = (board.E || board).inner;
    if (bi && bi.querySelectorAll) bi.querySelectorAll("text").forEach((n) => n.setAttribute("data-bleed", "1"));

    const tHttps = ctx.cue("HTTPS");
    const tChan = ctx.cue("protected channel");
    const tKey = ctx.cue("The key scrambles");
    const tForm = ctx.cue("the form");

    // 1. HTTPS: badge back to 120, tray values retire, path doubles into a tube, pill on it
    hs(cert, "badge", tHttps, 0.6);
    if (tray) M.exit(tray, tHttps, "recede");
    board.handle.setState("tube", tHttps + 0.1, 1.4);
    // @form label_https: pill naming the protected tube
    T.label(ctx, "label_https", { x: 740, y: 372, text: "HTTPS", to: [740, 350], tone: "accent2", role: "label", t: tHttps + 0.5, as: "pill" });

    // 3. The key scrambles: browser key becomes a lens, the packet lifts from the form
    hs(keys, "lens_browser", tKey);

    let PW = 200; const PH = 120;
    try { const f = ctx.kit.fit("Password: Sunrise42", { role: "caption", weight: 500, maxLines: 1, w: 4000, h: 200 }); if (f && f.width && f.size) PW = Math.max(200, Math.ceil(f.width * 18 / f.size + 28)); } catch (e) { PW = 200; }
    const X0 = 350 - PW / 2, Y0 = 366;
    const XE = 785 - PW / 2, YE = 420;
    // @form packet: the form packet, readable then morphing then scrambled
    const pE = ctx.el("packet", { x: X0, y: Y0, w: PW, h: PH, kind: "card", exit: "none" });
    const packet = Loom.lesson.packet(ctx, pE.inner, {});
    packet.setState("readable", ctx.start);
    M.reveal(pE, tKey);
    M.travel(pE, tKey + 0.25, { x: XE - X0, y: YE - Y0, scale: 1, dur: 1.2 });

    // 4. the form: passes the key and morphs
    packet.setState("morphing", tKey + 0.6, 0.8);
    // @form label_scrambled: pill naming the result
    T.label(ctx, "label_scrambled", { x: 725, y: 600, text: "Scrambled with the key", to: [725, 562], tone: "accent3", role: "caption", t: tKey + 1.3, as: "pill" });
  },
});
