// @design relit_badge_tie: the enlarged ticked badge is tied by a thin line to the shared key it vouches for, then its ticks light one by one
// Treatments considered: (1) static badge beside key with caption; (2) badge enlarges, line draws to key, ticks re-light on the words (chosen); (3) zoom on the key.
Loom.scene("b09", {
  build(ctx) {
    const { m, kit } = ctx;
    const T = Loom.treat;

    const tChecks = ctx.cue("Those checks");
    const tTrusted = ctx.cue("key is trusted");
    const tName = ctx.cue("Name them");

    const bleed = ctx.start.toFixed(2) + "-" + ctx.end.toFixed(2);
    const board = ctx.held("board");
    if (board) {
      (board.outer || board.el || board).setAttribute("data-bleed", bleed);
      [board.mover, board.inner, board.life].forEach((g) => { if (g && g.setAttribute) g.setAttribute("data-bleed", bleed); });
    }
    const CE = ctx.held("cert");
    const KB = ctx.held("key_browser");
    ctx.held("key_server");
    ctx.held("key_watcher");
    ctx.held("key_slots");
    ctx.held("tray_values");
    const LW = ctx.held("label_watcher_b");
    [LW, ctx.held("key_slots")].forEach((e) => { if (e && e.setAttribute) e.setAttribute("data-bleed", bleed); else if (e && (e.outer || e.el)) (e.outer || e.el).setAttribute("data-bleed", bleed); });

    ["label_watcher"].forEach((n) => {
      const e = ctx.held(n);
      if (!e) return;
      const t = e.setAttribute ? e : (e.outer || e.el);
      if (t && t.setAttribute) t.setAttribute("data-bleed", bleed);
      [e.mover, e.inner, e.life].forEach((g) => { if (g && g.setAttribute) g.setAttribute("data-bleed", bleed); });
    });

    // the Watcher pill is cropped by the camera push on purpose: bleed on the groups holding its words
    const svgRoot = ctx.station && ctx.station.svg;
    if (svgRoot && svgRoot.querySelectorAll) {
      Array.from(svgRoot.querySelectorAll("text")).forEach((tx) => {
        if ((tx.textContent || "").indexOf("Watcher") < 0) return;
        tx.setAttribute("data-bleed", bleed);
        let p = tx.parentNode;
        while (p && p !== svgRoot && p.setAttribute) { p.setAttribute("data-bleed", bleed); p = p.parentNode; }
      });
    }

    // the b08 tie retires
    ["label_same", "label_same_leaders"].forEach((n) => {
      const e = ctx.held(n);
      if (e) {
        m.exit(e, tChecks, "recede");
        if (e.lead) m.exit(e.lead, tChecks, "recede");
      }
    });

    // badge moves clear of the card words, enlarges
    if (CE && CE.ui) {
      m.travel(CE, tChecks, { x: -59, y: -168, scale: 0.8 }, { dur: 0.8 });
      CE.ui.to("big", 1, tChecks, 0.8);
      CE.ui.relight(tName + 0.25, 0.45);
    }

    // connector draws from the badge down into the browser key
    const LK = ctx.el("link_badge_key", { x: 632, y: 320, w: 16, h: 118, kind: "token", exit: "recede" });
    kit.line(LK.inner, 8, 0, 8, 118, { stroke: ctx.c("line"), sw: 3 });
    m.draw(LK, tChecks + 0.6, { dur: 0.6 });

    // the browser key brightens once
    if (KB && KB.ui && KB.ui.pulse) KB.ui.pulse("browser", tTrusted + 0.3);

    // pill beside the badge
    T.label(ctx, "label_checks", { x: 600, y: 362, text: "Three checks", to: [600, 362], t: tName + 0.05 });
  },
});
