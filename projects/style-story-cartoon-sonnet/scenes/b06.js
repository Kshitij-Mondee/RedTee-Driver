// @design ticks_against_the_evidence: three ticks land beside the written questions while the highlighted evidence is traced once more at full strength
// Treatments: (A) static pad with ticks, (B) CHOSEN: ring redraws, ticks pop staggered, Maya nods, (C) ticks fly from the receipt to the pad.
Loom.scene("b06", {
  build(ctx) {
    const { m } = ctx;

    const mh = ctx.held("maya");
    const maya = mh && (mh.handle || mh);

    const tRing = ctx.cue("A dinner claimed twice");
    // the duplicate receipts (kit part, prefixed names, kit ring off: the accent ring below is the one ring)
    const dupLayer = ctx.el("dup_layer", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    const dup = Loom.lesson.desk_set(ctx, dupLayer.inner, { only: ["receipts"], prefix: "dup_", ring: false });
    m.pop(dup.receiptA, tRing);
    m.pop(dup.receiptB, tRing + 0.25);
    const ringEl = ctx.el("receipt_ring", { x: 0, y: 0, w: 1920, h: 1080, kind: "connector", exit: "recede" });
    {
      const n = 40, a0 = -2.2, turn = 6.2832 * 1.06, cx = 807, cy = 736, rx = 98, ry = 30, p = [];
      for (let i = 0; i <= n; i++) {
        const u = i / n, a = a0 + turn * u, k = 1 + 0.06 * u + 0.02 * Math.sin(u * 9);
        p.push((cx + rx * k * Math.cos(a)).toFixed(1) + " " + (cy + ry * k * Math.sin(a)).toFixed(1));
      }
      Loom.svg("path", { d: "M" + p.join(" L"), fill: "none", stroke: ctx.c("accent"), "stroke-width": 7, "stroke-linecap": "round", "stroke-linejoin": "round" }, ringEl.inner);
    }
    m.draw(ringEl, tRing + 0.5, { dur: 0.9 });

    const wrap = ctx.el("pad_ticks_layer", { x: 0, y: 0, w: 1920, h: 1080, kind: "icon", exit: "recede" });
    const part = Loom.lesson.question_pad(ctx, wrap.inner, { x: 1075, y: 540, only: ["ticks"] });
    const tTick = ctx.cue("enough to raise it");
    part.ticks.forEach((tk, i) => {
      m.pop(tk, tTick + i * 0.38);
      part.setState("line" + (i + 1) + "_ticked", tTick + i * 0.38);
    });

    const tNod = ctx.cue("raise it");
    if (maya) {
      if (typeof maya.emotion === "function") maya.emotion("focused", tTick);
      if (typeof maya.gesture === "function") maya.gesture("nod", tNod - 0.1, tNod + 0.8);
    }
  },
});
