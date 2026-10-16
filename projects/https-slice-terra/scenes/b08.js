// @design ends_only_shared_key: two matching blue keys occupy the end slots while the watcher remains empty
/* Treatments considered: (A) static wide board with a caption, rejected because it hides the reveal. (B) a close key comparison, rejected because it loses the watcher. (C) chosen: pull to the whole path as both end keys arrive together, making the empty watcher slot the comparison. */
Loom.scene("b08", {
  build(ctx) {
    const { kit, m } = ctx;
    const T = Loom.treat;
    const tBoth = ctx.cue("Both ends");
    const tKey = ctx.cue("same key");

    // The inherited board is the stable world. It is deliberately not redrawn.
    const board = ctx.held("board");
    const cert = ctx.held("cert");
    const slots = ctx.held("key_slots");
    const watcherLabel = ctx.held("label_watcher");
    Loom.cam.frame(board, { x: 0, y: 0, w: 1680, h: 640 }, ctx.start, 1.25, { margin: 36, cy: 510, maxScale: 1 });

    // @form shared_keys: the two end slots fill as a single blue family, with no key at the watcher
    slots.handle.setState("ends_filled", tBoth + 0.12, 0.56);
    slots.handle.pulse("both", tKey - 0.08);

    // @form watcher_values: the inherited copied values dim into neutral unreadable blocks.
    const trayValues = ctx.held("tray_values");
    trayValues.handle.setState("copy_noise", tKey - 0.10, 0.35);

    // @form same_key_leaders: thin neutral leaders connect one compact label to both matching keys
    const leaders = ctx.el("same_key_leaders", { x: 610, y: 390, w: 630, h: 62, kind: "connector", exit: "recede" });
    kit.line(leaders.inner, 350, 0, 0, 62, { stroke: "muted", sw: 2 });
    kit.line(leaders.inner, 350, 0, 630, 62, { stroke: "muted", sw: 2 });
    m.draw(leaders, tKey - 0.16, { dur: 0.38 });

    // @form same_key_label: a pill names the shared result directly above the path
    T.label(ctx, "label_same", { x: 850, y: 350, text: "Same key", to: [960, 420], tone: "accent", role: "label", t: tKey - 0.08 });

    // The held certificate and watcher label remain visible as context for the next recall beat.
    void cert;
    void watcherLabel;
  },
});
