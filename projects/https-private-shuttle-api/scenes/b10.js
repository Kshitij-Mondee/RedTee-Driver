// @design key_transform: a readable bundle lifts out, crosses a lit key on a doubled channel and leaves as unreadable blocks
// Treatments considered: (1) static tube with a caption; (2) tube doubles, packet lifts, crosses the lit key and morphs to blocks (chosen); (3) zoom into the key only.
Loom.scene("b10", {
  build(ctx) {
    const { m } = ctx;
    const T = Loom.treat;

    const tHttps = ctx.cue("HTTPS is that request");
    const tChannel = ctx.cue("protected channel");
    const tScr = ctx.cue("The key scrambles");
    const tForm = ctx.cue("the form");

    const bleed = ctx.start.toFixed(2) + "-" + ctx.end.toFixed(2);
    const mark = (e) => {
      if (!e) return;
      const t = e.outer || e.el || e;
      if (t && t.setAttribute) t.setAttribute("data-bleed", bleed);
      [e.mover, e.inner, e.life].forEach((g) => { if (g && g.setAttribute) g.setAttribute("data-bleed", bleed); });
    };

    const B = ctx.held("board");
    const CE = ctx.held("cert");
    const KS = ctx.held("key_slots");
    const KB = ctx.held("key_browser");
    const KV = ctx.held("key_server");
    const KW = ctx.held("key_watcher");
    const TV = ctx.held("tray_values");
    const LW = ctx.held("label_watcher_b");
    [B, KS, KB, KV, KW, TV, LW].forEach(mark);

    // b09 pieces retire
    [TV].forEach((e) => { if (e) m.exit(e, tHttps, "recede"); });

    // badge returns to its 120 px home
    if (CE && CE.ui) {
      CE.ui.to("big", 0, tHttps, 0.8);
      m.travel(CE, tHttps, { x: 0, y: 0, scale: 1 }, { dur: 0.8 });
    }

    // the path doubles into a protected tube
    if (B && B.ui) B.ui.setState("tube", tHttps + 0.2);
    T.label(ctx, "label_https", { x: 620, y: 650, text: "HTTPS", to: [620, 525], t: tHttps + 0.9 });

    // the Watcher pill slides left so its word clears the frame edge
    if (LW) m.travel(LW, tHttps, { x: -110, y: 0, scale: 1 }, { dur: 0.8 });

    // the browser key brightens as a lens
    if (KB && KB.ui) KB.ui.setState("lens_browser", tScr);

    // @form packet_morph: the readable form packet, same object every crossing
    const PW = 290, PH = 174;
    const startC = [610, 426], midC = [680, 390], endC = [775, 480];
    const PE = ctx.el("packet", { x: startC[0] - PW / 2, y: startC[1] - PH / 2, w: PW, h: PH, kind: "token", exit: "recede" });
    const pk = Loom.lesson.packet(ctx, PE.inner, { scale: 1.5 });
    PE.setBox && PE.setBox({ w: pk.w, h: pk.h });
    PE.ui = pk;
    m.reveal(PE, tScr + 0.1);
    m.travel(PE, tScr + 0.3, { x: midC[0] - startC[0], y: midC[1] - startC[1], scale: 1 }, { dur: 0.5 });
    pk.setState("morphing", tForm - 0.45, 0.85);
    pk.setState("scrambled", tForm + 0.45, 0.05);
    m.travel(PE, tForm - 0.5, { x: endC[0] - startC[0] + 0.45 * pk.w / 2, y: endC[1] - startC[1] + 0.45 * pk.h / 2, scale: 0.55 }, { dur: 1.05 });

    T.label(ctx, "label_scrambled", { x: 640, y: 575, text: "Scrambled with the key", to: [690, 515], t: tForm - 0.1 });
  },
});
