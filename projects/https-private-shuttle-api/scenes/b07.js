// @design opposite_exchange: two small values cross a watched path in opposite directions, the watcher copies both and its own slot stays empty
// Treatments considered: (1) static tokens with a caption; (2) tokens cross, copies drop into the tray, slot shakes (chosen); (3) zoom on the tray only.
Loom.scene("b07", {
  build(ctx) {
    const { m, kit } = ctx;
    const T = Loom.treat;

    const tEach = ctx.cue("Each side");
    const tTemp = ctx.cue("temporary value");
    const tCopy = ctx.cue("copies both");
    const tNo = ctx.cue("cannot practically work out");

    // held from b06: the board (camera push crops its outer cards), the badge and the slots
    const bleed = ctx.start.toFixed(2) + "-" + ctx.end.toFixed(2);
    const board = ctx.held("board");
    if (board) {
      (board.outer || board.el || board).setAttribute("data-bleed", bleed);
      [board.mover, board.inner, board.life].forEach((g) => { if (g && g.setAttribute) g.setAttribute("data-bleed", bleed); });
    }
    const CE = ctx.held("cert");
    if (CE) {
      (CE.outer || CE.el || CE).setAttribute("data-bleed", bleed);
      [CE.mover, CE.inner, CE.life].forEach((g) => { if (g && g.setAttribute) g.setAttribute("data-bleed", bleed); });
    }
    // the browser card and its form packet words crop on the same push: bleed every ancestor of those texts
    const svgRoot = ctx.station && ctx.station.svg;
    if (svgRoot && svgRoot.querySelectorAll) {
      svgRoot.querySelectorAll("text").forEach((tx) => {
        if (!/accounts\.example|User:|Password:/.test(tx.textContent || "")) return;
        for (let n = tx; n && n !== svgRoot; n = n.parentNode) if (n.setAttribute) n.setAttribute("data-bleed", bleed);
      });
    }
    const KSE = ctx.held("key_slots");
    const KB = ctx.held("key_browser");
    const KS = ctx.held("key_server");
    const KW = ctx.held("key_watcher");
    ctx.held("label_watcher_b");

    // the shared-key label retires
    const lk = ctx.held("label_key");
    if (lk) {
      m.exit(lk, tEach, "recede");
      if (lk.lead) m.exit(lk.lead, tEach, "recede");
    }

    // @form value_token: slate pill carrying the temporary value
    const TW = 270, TH = 52;
    const A0 = [640, 392], B0 = [1280, 392];
    function token(name, c, delay) {
      const E = ctx.el(name, { x: c[0] - TW / 2, y: c[1] - TH / 2, w: TW, h: TH, kind: "token", exit: "recede" });
      kit.pill(E.inner, 0, 0, TW, TH, { fill: ctx.c("muted"), r: TH / 2 });
      kit.text(E.inner, "Temporary value", { role: "label", x: 8, y: 0, w: TW - 16, h: TH, align: "center", valign: "middle", color: ctx.c("surface"), maxLines: 1 });
      m.reveal(E, tEach + delay);
      return E;
    }
    const ta = token("token_a", A0, 0.25);
    const tb = token("token_b", B0, 0.45);
    // leg 1 (diagonal onto the lane), leg 2 (across, crossing at the watcher), leg 3 (up above the far slot)
    const LA = 418, LB = 542;
    m.travel(ta, tTemp, { x: 830 - A0[0], y: LA - A0[1], scale: 1 }, { dur: 0.5 });
    m.travel(ta, tTemp + 0.5, { x: 1090 - A0[0], y: LA - A0[1], scale: 1 }, { dur: 1.2 });
    m.travel(ta, tTemp + 1.7, { x: 1280 - A0[0], y: 392 - A0[1], scale: 1 }, { dur: 0.5 });
    m.travel(tb, tTemp, { x: 1090 - B0[0], y: LB - B0[1], scale: 1 }, { dur: 0.5 });
    m.travel(tb, tTemp + 0.5, { x: 830 - B0[0], y: LB - B0[1], scale: 1 }, { dur: 1.2 });
    m.travel(tb, tTemp + 1.7, { x: 640 - B0[0], y: 392 - B0[1], scale: 1 }, { dur: 0.5 });

    // the watcher copies both into its tray
    // @form tray_copy: small slate value copies in the tray
    const TR = ctx.el("tray_values", { x: 820, y: 590, w: 280, h: 150, kind: "token", exit: "recede" });
    const CW = 112, CH = 52;
    [[846 - 820, "a"], [970 - 820, "b"]].forEach(([lx, k], i) => {
      const C = ctx.el("value_copy_" + k, { x: lx, y: 46, w: CW, h: CH, kind: "token", exit: "recede", parent: TR.inner });
      kit.pill(C.inner, 0, 0, CW, CH, { fill: ctx.c("muted"), r: CH / 2 });
      kit.text(C.inner, "Value", { role: "label", x: 4, y: 0, w: CW - 8, h: CH, align: "center", valign: "middle", color: ctx.c("surface"), maxLines: 1 });
      m.travel(C, ctx.start, { x: 960 - (846 + CW / 2), y: -90, scale: 1 }, { dur: 0.01 });
      m.reveal(C, tCopy + 0.1 + i * 0.35);
      m.travel(C, tCopy + 0.1 + i * 0.35, { x: 0, y: 0, scale: 1 }, { dur: 0.6 });
    });

    // the watcher's own key slot shakes once and stays empty
    if (KW && KW.ui) KW.ui.setState("watcher_shake", tNo);
  },
});
