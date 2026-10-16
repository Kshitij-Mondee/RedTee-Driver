// @design empty_places_set: a verified identity shrinks to a badge while empty slots appear at both ends of an empty path
// Treatments considered: (1) static slots with labels; (2) pull back, badge shrinks, slots draw in order of speech (chosen); (3) zoom on one slot.
Loom.scene("b06", {
  build(ctx) {
    const { m, kit } = ctx;
    const T = Loom.treat;

    const tNext = ctx.cue("Next");
    const tKey = ctx.cue("shared key");
    const tNever = ctx.cue("never sent");

    const board = ctx.held("board");
    const bleed = ctx.start.toFixed(2) + "-" + ctx.end.toFixed(2);
    (board.outer || board.el || board).setAttribute("data-bleed", bleed);
    [board.mover, board.inner, board.life].forEach((g) => { if (g && g.setAttribute) g.setAttribute("data-bleed", bleed); });
    const CE = ctx.held("cert");
    const cert = CE.ui;

    // b05's pills retire as the camera pulls back
    ["label_signer", "label_name", "label_date", "label_watcher"].forEach((n) => {
      const e = ctx.held(n);
      if (e) {
        m.exit(e, tNext, "recede");
        if (e.lead) m.exit(e.lead, tNext, "recede");
      }
    });

    // the pull: board home, cert shrinks to a badge above the browser card
    m.travel(board, tNext, { x: 0, y: 0, scale: 1 }, { dur: 1.0 });
    cert.setState("badge", tNext + 0.1);
    m.travel(CE, tNext + 0.1, { x: -557, y: -215, scale: 0.8 }, { dur: 1.0 });

    // watcher pill back on its box
    T.label(ctx, "label_watcher_b", { x: 960, y: 340, text: "Watcher", to: [960, 408], t: tNext + 1.1 });

    // empty slots at both ends
    // @form key_slot_browser: empty dashed slot at the browser end
    const KSE = ctx.el("key_slots", { x: 600, y: 440, w: 710, h: 270, kind: "token", exit: "recede" });
    m.reveal(KSE, tKey - 0.05);
    const KB = ctx.el("key_browser", { x: 0, y: 0, w: 80, h: 80, kind: "token", exit: "recede", parent: KSE.inner });
    KB.ui = Loom.lesson.key_slots(ctx, KB.inner, { which: "browser" });
    m.reveal(KB, tKey);
    // @form key_slot_server: empty dashed slot at the server end
    const KS = ctx.el("key_server", { x: 640, y: 0, w: 80, h: 80, kind: "token", exit: "recede", parent: KSE.inner });
    KS.ui = Loom.lesson.key_slots(ctx, KS.inner, { which: "server" });
    m.reveal(KS, tKey + 0.25);
    T.label(ctx, "label_key", { x: 640, y: 380, text: "Shared key", to: [640, 440], t: tKey + 0.4 });

    // never sent: the path dims and stays empty; the watcher's slot is empty too
    board.ui && board.ui.to("pathDim", 0.5, tNever, 0.6);
    // @form key_slot_watcher: empty slot by the watcher
    const KW = ctx.el("key_watcher", { x: 510, y: 190, w: 80, h: 80, kind: "token", exit: "recede", parent: KSE.inner });
    KW.ui = Loom.lesson.key_slots(ctx, KW.inner, { which: "watcher" });
    m.reveal(KW, tNever + 0.3);
  },
});
