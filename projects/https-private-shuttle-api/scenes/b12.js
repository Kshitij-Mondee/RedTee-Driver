// @design same_key_reverse: the unreadable blocks cross the far-end key and turn readable inside the receiving card
// Treatments considered: (1) static server card with a caption; (2) blocks cross the server key lens and morph back to readable rows in the card (chosen); (3) zoom on the key only.
Loom.scene("b12", {
  build(ctx) {
    const { m } = ctx;
    const T = Loom.treat;

    const tUn = ctx.cue("The server unscrambles");
    const tSame = ctx.cue("same key");

    const bleed = ctx.start.toFixed(2) + "-" + ctx.end.toFixed(2);
    const mark = (e) => {
      if (!e) return;
      const t = e.outer || e.el || e;
      if (t && t.setAttribute) t.setAttribute("data-bleed", bleed);
      [e.mover, e.inner, e.life].forEach((g) => { if (g && g.setAttribute) g.setAttribute("data-bleed", bleed); });
    };

    const B = ctx.held("board");
    const KS = ctx.held("key_slots");
    const KB = ctx.held("key_browser");
    const KV = ctx.held("key_server");
    const PE = ctx.held("packet");
    const CP = ctx.held("copy");
    const LN = ctx.held("label_noise");
    const LW = ctx.held("label_watcher_b");
    const LH = ctx.held("label_https");
    const CE0 = ctx.held("cert");
    [B, KS, KB, KV, PE, CP, LN, LW, LH, CE0].forEach(mark);

    // the noise caption retires
    if (LN) {
      m.exit(LN, tUn - 0.1, "recede");
      if (LN.lead) m.exit(LN.lead, tUn - 0.1, "recede");
    }

    // server key lights as a lens
    if (KV && KV.ui && KV.ui.setState) KV.ui.setState("lens_server", tUn);

    // the scrambled packet crosses the server key and settles in the card body
    if (PE) {
      m.travel(PE, tUn, { x: 994, y: 169, scale: 0.7 }, { dur: 1.4 });
      if (PE.ui && PE.ui.setState) PE.ui.setState("readable", tUn + 0.5, 0.7);
    }

    // both end keys pulse together once
    const pulser = [KS, KV, KB].find((e) => e && e.ui && e.ui.pulse && e.ui !== (PE && PE.ui));
    if (pulser) pulser.ui.pulse("both", tSame);
    if (PE && PE.ui && PE.ui.setState) PE.ui.setState("readable", tSame + 0.5, 0.01);

    // the shared board text keeps only the last beat's window: one wide window on every word node and its ancestors
    { const sv = ctx.station && ctx.station.svg;
      const wide = "0.00-" + ctx.end.toFixed(2);
      if (sv && sv.querySelectorAll) Array.from(sv.querySelectorAll("text")).filter((x) => /accounts|Sunrise|User:|Watcher|Password/.test(x.textContent)).forEach((x) => {
        x.setAttribute("data-bleed", wide);
        let p = x.parentNode;
        while (p && p.setAttribute && p.nodeName && p.nodeName.toLowerCase() !== "svg") { p.setAttribute("data-bleed", wide); p = p.parentNode; }
      }); }

    // @form unscrambled_pill: the pill sits under the readable packet, inside the card
    T.label(ctx, "label_unscrambled", { x: 1450, y: 664, text: "Unscrambled", to: [1450, 632], t: tSame + 0.25 });
  },
});
