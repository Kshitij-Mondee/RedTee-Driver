// @design matched_ends: identical blue keys appear at the two ends of a watched path while the watcher's own slot stays empty
// Treatments considered: (1) static keys with a caption; (2) tokens dissolve, keys drop in together, a pill ties them (chosen); (3) zoom on one key.
Loom.scene("b08", {
  build(ctx) {
    const { m, kit } = ctx;
    const T = Loom.treat;

    const tBoth = ctx.cue("Both ends");
    const tSame = ctx.cue("same key");

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
    const KB = ctx.held("key_browser");
    const KS = ctx.held("key_server");
    const KW = ctx.held("key_watcher");
    const KSE = ctx.held("key_slots");
    ctx.held("label_watcher_b");
    const TR = ctx.held("tray_values");

    // the waiting tokens dissolve into the end slots
    const ta = ctx.held("token_a");
    const tb = ctx.held("token_b");
    if (ta) m.exit(ta, tBoth + 0.05, "recede");
    if (tb) m.exit(tb, tBoth + 0.05, "recede");

    // blue keys drop in together
    if (KB && KB.ui) KB.ui.setState("ends_filled", tSame);
    if (KS && KS.ui) KS.ui.setState("ends_filled", tSame);

    // the watcher's copies go grey
    ["value_copy_a", "value_copy_b"].forEach((n) => {
      const C = ctx.held(n);
      if (C && C.inner) Loom.drive((e, raw) => { C.inner.style.opacity = String(1 - 0.6 * e); }, tSame + 0.2, 0.6, "move");
    });

    // @form same_key_pill: tie between the two blue keys
    const PW = 230, PH = 56, PX = 960 - PW / 2, PY = 215;
    const L = ctx.el("label_same_leaders", { x: 600, y: 236, w: 720, h: 204, kind: "token", exit: "recede" });
    kit.line(L.inner, 40, 204, 40, 0, { stroke: ctx.c("line"), sw: 2 });
    kit.line(L.inner, 40, 0, 680, 0, { stroke: ctx.c("line"), sw: 2 });
    kit.line(L.inner, 680, 204, 680, 0, { stroke: ctx.c("line"), sw: 2 });
    m.reveal(L, tSame + 0.55);
    T.label(ctx, "label_same", { x: 960, y: 190, text: "Same key", to: [960, 236], t: tSame + 0.25 });
  },
});
