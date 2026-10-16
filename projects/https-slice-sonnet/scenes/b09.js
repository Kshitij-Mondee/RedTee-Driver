// @design recall_by_connection: a small ticked summary object is enlarged and wired to the thing it justifies, then its marks re-light in turn
// Treatments: (1) static composition with pill + connector all shown, (2) badge enlarges, connector draws into the key, ticks relight on the ask [chosen: the tie is a connection drawn on the words], (3) split-screen badge and key side by side.
Loom.scene("b09", {
  build(ctx, props) {
    const m = ctx.m, kit = ctx.kit, c = ctx.c;
    const tThose = ctx.cue("Those checks");
    const tTrust = ctx.cue("key is trusted");
    const tName = ctx.cue("Name them");

    const held = (n) => { try { return ctx.held(n) || null; } catch (e) { return null; } };
    const board = held("board");
    const cert = held("cert");
    const slots = held("key_slots");
    const tray = held("tray_values");
    const same = held("label_same");

    // 'Same key' retires; the badge enlarges to 200 px (x130-330, y110-310)
    if (same) m.exit(same, tThose - 0.1, "recede");
    if (cert && cert.handle) cert.handle.to("big", 1, tThose, 0.6);

    // connector: badge right edge -> above the browser card -> down into the browser key slot
    const CN = ctx.el("connector", { x: 0, y: 0, w: 1920, h: 1080, kind: "connector", exit: "recede" });
    // @form recall_connector: a thin elbow line wiring the badge to the browser key
    const d = "M 336 210 L 640 210 L 640 432";
    const path = kit.path(CN.inner, d, { stroke: "muted", sw: 4, fill: "none" });
    m.draw(path, tThose + 0.35, { dur: 0.9 });

    // the browser key brightens once on "key is trusted"
    if (slots && slots.handle) slots.handle.pulse("browser", tTrust);

    // @form recall_label: pill naming the three checks, beside the badge (clear of the browser card)
    Loom.treat.label(ctx, "label_checks", { x: 470, y: 160, text: "Three checks", tone: "accent", role: "label", as: "pill", t: tName - 0.1 });
    if (cert && cert.handle) cert.handle.relight(tName, 0.35);
  },
});
