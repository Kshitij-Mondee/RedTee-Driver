// @lab {"title": "Hands kit (D-114) with the PLACEHOLDER set: enter from the bottom, count, point at a card, exit; a second hand carries a card in from the right and leaves it", "styles": ["story-cartoon", "corporate-clean"], "dur": 5.6, "times": [0.45, 1.0, 1.7, 2.5, 3.3, 3.9, 4.5, 5.3]}
// A lab scene for Loom.hands. The art is the deliberately abstract placeholder family (mittens and capsules with a
// PLACEHOLDER label; real art is commissioned per docs/ASSET_WISHLIST.md, "Hands kit"), so this strip proves the
// STAGING: anchors land where asked, the sleeve reaches the frame edge, poses step, the carried card rides the hand
// and stays where it is put. The cross on each pose is its anchor; the dashed ring marks the target.
Loom.scene("lab_hands", {
  build(ctx) {
    const { kit } = ctx;
    // the target the first hand points at
    const T = { x: 1380, y: 330 };
    const tgt = ctx.el("target", { x: T.x - 170, y: T.y - 90, w: 340, h: 180, kind: "card" });
    kit.rect(tgt.inner, 0, 0, 340, 180, { fill: "surface", r: 24 });
    kit.text(tgt.inner, "the point", { x: 20, y: 0, w: 300, h: 180, role: "label", align: "center", valign: "middle", weight: 700 });
    ctx.m.reveal(tgt, 0.1);
    Loom.svg("circle", { cx: T.x - 120, cy: T.y, r: 26, fill: "none", stroke: ctx.c("accent"), "stroke-width": 4, "stroke-dasharray": "8 6" }, ctx.g);

    const guide = Loom.hands.enter(ctx, "guide", { family: "placeholder", pose: "open", from: "bottom", to: { x: 640, y: 620 }, t: 0.2, dur: 0.6 });
    guide.pose("count2", 1.3);
    guide.point({ x: T.x - 120, y: T.y }, 1.9, { dur: 0.45 });
    guide.exit(2.9);

    // a card the second hand carries in: its own place is where it ends up (no entrance of its own)
    const card = ctx.el("parcel", { x: 900, y: 560, w: 300, h: 190, kind: "card" });
    kit.rect(card.inner, 0, 0, 300, 190, { fill: "accent3", r: 20 });
    kit.text(card.inner, "placed", { x: 20, y: 0, w: 260, h: 190, role: "label", align: "center", valign: "middle", weight: 700, color: "field" });
    const carrier = Loom.hands.make(ctx, "carrier", { family: "placeholder", pose: "hold", from: "right", sleeve: "accent2" });
    carrier.place(card, 3.1, { dur: 0.8 });
  },
});
