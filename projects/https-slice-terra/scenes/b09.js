// @design trusted_key_recall: a re-lit certificate badge connects its completed checks to the browser's shared key
/*
Three treatments:
1. Static recall card, badge and key are labelled side by side.
2. Drawn recall, badge expands and a connector makes the trust relationship visible.
3. Full certificate returns beside the key.
Chosen: drawn recall, because the connection is the content and the compact badge preserves the board.
*/
Loom.scene("b09", {
  build(ctx) {
    const { kit, m } = ctx;
    const tChecks = ctx.cue("Those checks are why the key is trusted.");
    const tTrusted = ctx.cue("key is trusted");
    const tName = ctx.cue("Name them.");

    // The prior board is the world. These holds retain the exact objects made in b08.
    const board = ctx.held("board");
    const cert = ctx.held("cert");
    const keySlots = ctx.held("key_slots");
    const trayValues = ctx.held("tray_values");
    ctx.held("token_a");
    ctx.held("token_b");
    ctx.held("label_watcher");

    // The certificate changes state in place, rather than being copied over the held badge.
    cert.handle.setState("badge_relit", tChecks, 0.7);

    // @form trust_connector: a quiet line from the completed checks into the browser key
    const connector = ctx.el("trust_connector", { x: 340, y: 245, w: 270, h: 200, kind: "connector", exit: "recede" });
    const link = kit.path(connector.inner, "M 0 5 C 95 15, 165 135, 260 185", { stroke: "line", sw: 3, fill: "none" });
    m.draw(link, tChecks + 0.24, { dur: 0.72 });

    // The browser key is the named shared secret. Its one pulse comes after the line reaches it.
    keySlots.handle.pulse("browser", tTrusted + 0.05);

    // @form three_checks_label: a compact named pill under the expanded certificate badge
    Loom.treat.label(ctx, "label_checks", {
      x: 155, y: 330, text: "Three checks", to: [230, 310], tone: "accent2", role: "label", t: tName,
    });

    // The kit owns the tick sequence, including its reading hold through the recall pause.
    cert.handle.relight(tName + 0.12, 0.18);

    // The next beat keeps these exact held elements: board, cert, key_slots and tray_values.
    void board;
    void trayValues;
  },
});
