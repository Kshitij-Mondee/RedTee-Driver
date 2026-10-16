// @design b08_matching_keys_at_two_ends: paired blue endpoints establish one shared secret
Loom.scene("b08", {
  build(ctx) {
    const { kit, m } = ctx;
    const T = Loom.treat;
    // Treatments considered: static endpoints with a caption, travelling keys, or paired key reveal. Chosen: paired reveal, because simultaneity is the meaning.

    const board = ctx.held("board");
    const cert = ctx.held("cert");
    const slots = ctx.held("key_slots");
    const tokenA = ctx.held("token_a");
    const tokenB = ctx.held("token_b");
    const tray = ctx.held("tray_values");
    const watcherLabel = ctx.held("label_watcher");
    const tEnds = ctx.cue("Both ends");
    const tKey = ctx.cue("same key");

    // The held board remains the fixed world. This frame opens from the close b07 view to the whole path.
    Loom.cam.frame(board, { x: 120, y: 260, w: 1680, h: 640 }, tEnds, 1.25, { margin: 80, cy: 500, maxScale: 1 });

    // The temporary values disappear together before the permanent matching state arrives.
    if (tokenA) m.exit(tokenA, tEnds, "iris");
    if (tokenB) m.exit(tokenB, tEnds, "iris");
    if (tray && tray.handle) tray.handle.setState("copy_noise", tKey);
    if (slots && slots.handle) {
      slots.handle.setState("ends_filled", tKey);
      slots.handle.pulse("both", tKey + 0.25);
    }

    // @form same_key_leader_left: thin leader connects the shared-key label to the browser key
    const leftLead = ctx.el("same_key_leader_left", { x: 664, y: 260, w: 182, h: 202, kind: "connector", exit: "recede" });
    kit.line(leftLead.inner, 182, 202, 0, 0, { stroke: "muted", sw: 2 });
    m.draw(leftLead, tKey + 0.10, { dur: 0.35 });

    // @form same_key_leader_right: thin leader connects the shared-key label to the server key
    const rightLead = ctx.el("same_key_leader_right", { x: 1074, y: 260, w: 182, h: 202, kind: "connector", exit: "recede" });
    kit.line(rightLead.inner, 0, 0, 182, 202, { stroke: "muted", sw: 2 });
    m.draw(rightLead, tKey + 0.10, { dur: 0.35 });

    // @form label_same: pill names the identical keys without covering the watcher or its empty slot
    T.label(ctx, "label_same", { x: 846, y: 212, text: "Same key", to: [936, 260], tone: "accent", role: "label", t: tKey + 0.18 });
  },
});
