// @design b09_trust_link: verified checks visibly connect to the shared browser key
// Treatments: (A) a text list, rejected because it asks rather than recalls. (B) a large certificate, rejected because it loses the key. (C) chosen, a relit badge and a drawn link make the trust relationship visible.
Loom.scene("b09", {
  build(ctx) {
    const { kit, m } = ctx;
    const tChecks = ctx.cue("Those checks");
    const tTrusted = ctx.cue("key is trusted");
    const tName = ctx.cue("Name them");

    const board = ctx.held("board");
    const cert = ctx.held("cert");
    const keySlots = ctx.held("key_slots");
    const trayValues = ctx.held("tray_values");

    // The close view starts with the relationship, then stays perfectly still for recall.
    Loom.cam.frame(board, { x: 0, y: 0, w: 1680, h: 640 }, tChecks, 1.3, { margin: 0, ease: "editorial" });
    if (cert && cert.handle) cert.handle.setState("badge_relit", tChecks);

    if (cert && cert.handle) {
      // @form trust_connector: a thin line leads from proof to the browser key
      const connector = ctx.el("trust_connector", { x: 280, y: 190, w: 400, h: 300, kind: "connector", exit: "recede" });
      const link = kit.path(connector.inner, "M0 0 L370 170 L330 278", { stroke: "line", sw: 4, fill: "none" });
      m.draw(link, tChecks + 0.18, { dur: 0.8 });

      // @form three_checks_label: a compact recall prompt under the certificate badge
      Loom.treat.label(ctx, "three_checks_label", {
        x: 130, y: 330, text: "Three checks", to: [230, 310], tone: "pos", role: "label", t: tName
      });
    }

    if (keySlots && keySlots.handle) keySlots.handle.pulse("browser", tTrusted);
    if (cert && cert.handle) cert.handle.relight(tName, 0.18);

    void trayValues;
  },
});
