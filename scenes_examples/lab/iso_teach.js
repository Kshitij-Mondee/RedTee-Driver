// @lab {"title": "isometric ENGINE, the teaching register: calm floating plates that explain (a three-step flow in one screen row joined by ground arrows that turn one corner, map pins, a note card with its legend chip, a gentle pan to iso bars whose numbers count as they grow)", "styles": ["isometric"], "dur": 20.0, "times": [1.6, 4.2, 7.6, 10.0, 12.6, 15.4, 19.2]}
/* The isometric engine's TEACHING register (2026-10-16): most beats of a 5 to 10 minute lesson. No diorama here: a few
 * station plates float on the pale ground (plinth: false), in one screen row, joined by one route; words on map pins and
 * one note card: one idea a frame. The camera moves only to the next idea (a calm pan), never through it. Built only
 * from the engine's calls and the kit, as a lesson scene would be. Compare within the style only (D-122). */
Loom.scene("iso_teach", {
  build(ctx) {
    const W = ctx.engine, kit = ctx.kit;

    // ---- the frame's title (the pack's display face); pins fade before they reach its band
    const head = ctx.el("heading", { x: 96, y: 64, w: 1100, h: 92, kind: "title", exit: "wipe" });
    kit.text(head.inner, "How an order reaches the customer", { role: "title", x: 0, y: 0, w: 1100, h: 92, maxLines: 1 });
    ctx.m.reveal(head, 0.3, { dy: 12 });

    const B = W.board(ctx, { name: "ops", size: [11, 11], plinth: false, centre: [960, 590], unit: 92, at: 0.2, topSafe: 170 });

    // ---- a three-step flow in one screen row: Order, Pack, Ship (one object each, a pin each, ground arrows between)
    B.flow("steps", {
      axis: "row", x: 0, y: 8.4, w: 2.6, d: 2.6, gap: 1.6, at: 1.0, by: 7.0, until: 10.3,
      steps: [
        { label: "Order placed", kind: "laptop", tok: "accent2", role: "customer side", obj: { w: 1.3, d: 0.9 } },
        { label: "Packed", kind: "crate", tok: "accent4", role: "warehouse", obj: { s: 1.0 } },
        { label: "Shipped", kind: "van", tok: "accent3", role: "delivery", obj: { stripe: "accent3" } },
      ],
    });

    // ---- one note card: the idea of this frame, its chip in the hue of the step it names
    const note = ctx.el("note", { x: 1250, y: 180, w: 560, h: 180, kind: "card", exit: "recede" });
    B.note(note, { title: "Each step hands one thing to the next", body: "An order, a parcel, a delivery.", tok: "accent4", index: 1, at: 7.6, place: "auto" });
    ctx.m.exit(note, 10.1);

    // ---- the next idea further along the same row: parcels packed per hour, as iso bars
    const bars = B.bars("perhour", {
      axis: "row", x: 14.2, y: -3.2, w: 1.1, d: 1.1, gap: 0.65, height: 3.4, at: 12.2, by: 14.6, tok: "accent4", role: "warehouse",
      values: [{ label: "Mon", value: 120 }, { label: "Tue", value: 135 }, { label: "Wed", value: 128 }, { label: "Thu", value: 150 }, { label: "Fri", value: 240 }],
    });
    B.camera(10.4, bars.bars, { margin: 170, dur: 1.6, dy: -20, dx: 110 });
    const note2 = ctx.el("note2", { x: 96, y: 190, w: 560, h: 180, kind: "card", exit: "recede" });
    B.note(note2, { title: "Friday doubles", body: "Plan the packing shift for it.", tok: "accent4", index: 2, at: 16.4, from: "left", place: "auto" });
  },
});
