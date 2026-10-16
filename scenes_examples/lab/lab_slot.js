// @lab {"title": "Swap-in-place slot (D-114): one held panel, its contents change on the cue (swap, flip, slide, stamp, recolour), then a relabel and a recolour. The frame never moves; the old content is gone before the new one arrives", "styles": ["story-cartoon", "corporate-clean"], "dur": 13.0, "times": [1.2, 2.15, 2.45, 3.0, 3.85, 4.2, 5.55, 5.9, 7.0, 7.25, 8.6, 8.95, 10.2, 10.55, 11.6, 12.6]}
// A lab scene: absolute times, no narration. Left: a "card" slot holding the state of one document (sample states,
// not facts). Right, top: a "badge" slot run with an accelerating rhythm. Right, bottom: a frameless slot holding
// drawn objects. Timeline marks under the panel show when each change was cued.
Loom.scene("lab_slot", {
  build(ctx) {
    const { kit } = ctx;
    kit.text(ctx.g, "ONE PANEL, HELD", { x: 120, y: 90, w: 900, h: 60, role: "label", color: "muted", tracking: 2 });
    const s = Loom.slot(ctx, "doc_state", { x: 120, y: 170, w: 940, h: 420, frame: "card", role: "hero", token: "accent" });
    s.show({ text: "Draft", token: "accent" }, 0.4);
    s.show({ text: "In review", token: "accent4" }, 2.0, { how: "swap" });
    s.show({ text: "Changes asked", token: "neg" }, 3.6, { how: "flip" });
    s.show({ object: "document", text: "Revised", token: "accent3" }, 5.2, { how: "slide", dir: "left" });
    s.show({ text: "Signed", token: "accent2" }, 6.8, { how: "stamp" });
    s.show({ text: "Approved", token: "pos" }, 8.4, { how: "recolour" });
    s.relabel("Published", 10.0);
    s.recolour("accent", 11.4);
    // cue marks: when each change was asked for (the slot's own report holds the measured intervals)
    [0.4, 2.0, 3.6, 5.2, 6.8, 8.4, 10.0, 11.4].forEach((t, i) => {
      const x = 120 + (t / 13) * 940;
      kit.line(ctx.g, x, 640, x, 668, { stroke: "muted", sw: 3, crisp: true });
      kit.text(ctx.g, ["first", "swap", "flip", "slide", "stamp", "recolour", "relabel", "recolour"][i], { x: x - 70, y: 676, w: 140, h: 40, role: "caption", align: "center", color: "muted" });
    });
    kit.line(ctx.g, 120, 654, 1060, 654, { stroke: "line", sw: 2, crisp: true });

    const b = Loom.slot(ctx, "count_badge", { x: 1200, y: 170, w: 560, h: 170, frame: "badge", role: "title", token: "accent2" });
    b.sequence([{ content: { text: "Step one" } }, { content: { text: "Step two" } }, { content: { text: "Step three", token: "accent4" } }, { content: { text: "Done", token: "pos" } }],
      { from: 0.6, to: 7.6, rhythm: "accelerate", how: "swap" });

    const p = Loom.slot(ctx, "held_object", { x: 1200, y: 420, w: 560, h: 380, frame: "none" });
    p.show({ object: "envelope", state: { open: false } }, 1.0, { how: "swap" });
    p.show({ object: "envelope", state: { open: true } }, 4.0, { how: "flip" });
    p.show({ object: "lock", tone: "pos" }, 7.0, { how: "stamp" });
    p.show((g, bx) => { kit.rect(g, bx.x + bx.w / 2 - 120, bx.y + bx.h / 2 - 90, 240, 180, { fill: "accent3" }); }, 10.0, { how: "slide", dir: "up" });
  },
});
