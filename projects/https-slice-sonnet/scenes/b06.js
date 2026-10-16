// @design empty_slots_for_unsent_key: a big checked card shrinks to a badge while empty dashed slots mark where a key will sit
// Treatments: (1) static slots + label, (2) badge shrinks, slots draw in on the spoken words, path dims (chosen), (3) camera push to the slots.
Loom.scene("b06", {
  build(ctx, props) {
    const m = ctx.m, c = ctx.c;
    const T = Loom.treat;

    const B = ctx.held("board");
    const cert = ctx.held("cert");
    const tNext = ctx.cue("Next");
    if (cert && cert.handle) {
      cert.handle.setState("badge", tNext, 0.8);
      if (typeof cert.x === "number" && typeof cert.y === "number" && (Math.abs(cert.x - 130) > 2 || Math.abs(cert.y - 110) > 2)) m.travel(cert, tNext, { x: 130 - cert.x, y: 110 - cert.y, dur: 0.8 });
    }

    // key slots, all three, empty, drawn in on the spoken words
    const K = ctx.el("key_slots", { x: 0, y: 0, w: 1920, h: 1080, kind: "instrument", exit: "recede" });
    // @form key_slots: swap slots at both ends and by the watcher, empty
    const slots = Loom.lesson.key_slots(ctx, K.inner, { which: "all", startHidden: true });
    const tKey = ctx.cue("shared key");
    slots.show("browser", tKey, 0.5);
    slots.show("server", tKey + 0.25, 0.5);
    // @form label_pill: Shared key tag on a leader
    T.label(ctx, "label_key", { x: 690, y: 385, text: "Shared key", to: [640, 438], tone: "accent", role: "label", t: tKey + 0.5, as: "pill" });

    const tNever = ctx.cue("never sent");
    B.handle.to("pathDim", 1, tNever, 0.6);
    slots.show("watcher", tNever + 0.3, 0.5);
  },
});
