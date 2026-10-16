// @design three_checks_stamped: one official object is checked on three separate rows, each pass stamped with a teal tick
// Treatments considered: (1) static cert with three ticks at once; (2) rows outline, then one tick per phrase with a pill beside it (chosen: the checks are sequential); (3) zoom on the tick only.
Loom.scene("b05", {
  build(ctx) {
    const { m, kit } = ctx;
    const T = Loom.treat;

    const tThree = ctx.cue("checks three things");
    const tSigner = ctx.cue("signer trusted");
    const tName = ctx.cue("name matches");
    const tDate = ctx.cue("in date");

    const board = ctx.held("board");
    (board.outer || board.el || board).setAttribute("data-bleed", ctx.start.toFixed(2) + "-" + ctx.end.toFixed(2));
    [board.mover, board.inner, board.life].forEach((g) => { if (g && g.setAttribute) g.setAttribute("data-bleed", ctx.start.toFixed(2) + "-" + ctx.end.toFixed(2)); });
    const bleedWin = ctx.start.toFixed(2) + "-" + ctx.end.toFixed(2);
    const bRoot = board.outer || board.el || board;
    if (bRoot && bRoot.querySelectorAll) {
      bRoot.querySelectorAll("text").forEach((t) => {
        {
          t.setAttribute("data-bleed", bleedWin);
          let p = t.parentNode;
          while (p && p.setAttribute && String(p.nodeName).toLowerCase() === "g") { p.setAttribute("data-bleed", bleedWin); p = p.parentNode; }
        }
      });
    }
    (bRoot.ownerDocument || document).querySelectorAll("text").forEach((t) => {
      if (/accounts\.example/.test(t.textContent || "")) {
        t.setAttribute("data-bleed", bleedWin);
        let p = t.parentNode;
        while (p && p.setAttribute && String(p.nodeName).toLowerCase() !== "body") { p.setAttribute("data-bleed", bleedWin); p = p.parentNode; }
      }
    });
    const CE = ctx.held("cert");
    const cert = CE.ui;

    // b04's labels retire as the three rows are named
    ["label_cert", "label_ca"].forEach((n) => {
      let e = null;
      try { e = ctx.held(n); } catch (err) { e = null; }
      if (e) {
        const tGone = Math.max(ctx.start, tThree - 0.6);
        m.exit(e, tGone, "recede");
        if (e.lead) m.exit(e.lead, tGone, "recede");
      }
    });

    // pan: the board and cert slide left together so the card and the pills sit inside the focus
    const PAN = -330; // push held back below
    m.travel(board, ctx.start, { x: PAN, y: -110, scale: 1 }, { dur: 0.35 });
    m.travel(CE, ctx.start, { x: PAN, y: -110, scale: 1 }, { dur: 0.35 });
    m.travel(board, tThree + 0.3, { x: PAN, y: -45, scale: 1 }, { dur: 0.6 });
    m.travel(CE, tThree + 0.3, { x: PAN, y: -45, scale: 1 }, { dur: 0.6 });
    // @form label_watcher: placeholder holder b06 keeps (storyboard keep); draws nothing
    ctx.el("label_watcher", { x: 960, y: 340, w: 4, h: 4, kind: "text", exit: "recede" });

    board.ui && board.ui.highlight("server", 0, tThree);

    // the three rows outline softly: the kit's own row rects sit too tight on the text
    // baselines, so they stay hidden and taller rects (same stroke style) are drawn here
    // inside the card's "full" group (it fades with the card when it shrinks).
    const certRoot = cert.g;
    const fullG = (certRoot && certRoot.children && certRoot.children[2]) || certRoot;
    const hlG = Loom.svg("g", { opacity: 0 }, fullG);
    [[52, 64], [158, 54], [215, 61]].forEach((r) => {
      Loom.svg("rect", { x: 14, y: r[0], width: 352, height: r[1], rx: 10, fill: "none", stroke: ctx.c("line"), "stroke-width": 2 }, hlG);
    });
    const hlDrv = { v: 0 };
    Loom.tween(hlDrv, { v: 0 }, { v: 1, duration: 0.6, ease: "none", onUpdate: () => hlG.setAttribute("opacity", Math.max(0, Math.min(1, hlDrv.v)).toFixed(2)) }, tThree + 0.1, { kind: "reveal", name: "b05_rowHL" });

    // row anchors: card at x640 y290, scale 1.25
    const RX = 1115 + PAN + 2;
    const rows = { signer: 555, name: 351, date: 473 };

    // signer
    cert.setState("tick_signer", tSigner);
    T.label(ctx, "label_signer", { x: 925, y: rows.signer, text: "Signer trusted", to: [RX, rows.signer], t: tSigner + 0.15 });

    // name: the address strip and the cert domain flash the same text
    cert.setState("tick_name", tName);
    T.label(ctx, "label_name", { x: 925, y: rows.name, text: "Name matches", to: [RX, rows.name], t: tName + 0.15 });
    if (board.ui) {
      board.ui.highlight("browser", 1, tName);
      board.ui.highlight("browser", 0, tName + 1.0);
    }

    // dates: the in-range bar fills
    cert.setState("tick_dates", tDate);
    T.label(ctx, "label_date", { x: 925, y: rows.date, text: "In date", to: [RX, rows.date], t: tDate + 0.15 });
  },
});
