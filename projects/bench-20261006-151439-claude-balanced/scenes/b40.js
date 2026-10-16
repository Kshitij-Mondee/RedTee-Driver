// @design quiet_desk_single_note: one note alone on a calm desk, its name turned away, an empty board waiting
/* Treatments: (A) static desk with a pulse only, (B) note flies in from off-screen (too busy),
 * (C) CHOSEN: room settles, note drops softly, one small pulse. Calm, so the viewer can think. */
Loom.scene("b40", {
  build(ctx) {
    const { kit, m } = ctx;

    // empty board on the wall (scaffold first)
    const board = ctx.el("empty_board", { x: 560, y: 110, w: 800, h: 420, kind: "scenery", exit: "recede" });
    kit.rect(board.inner, 0, 0, 800, 420, { fill: "surface", r: 20 });
    kit.rect(board.inner, 24, 24, 752, 372, { fill: "field", r: 12, shadow: false });
    m.settle(board, ctx.cue("Now yours"), { dy: 20 });

    // desk surface
    const desk = ctx.el("desk", { x: 0, y: 640, w: 1920, h: 290, kind: "scenery", exit: "recede" });
    kit.rect(desk.inner, 0, 0, 1920, 290, { fill: "accent4", r: 0, shadow: false });
    kit.rect(desk.inner, 0, 0, 1920, 14, { fill: "ink", r: 0, shadow: false });
    m.settle(desk, ctx.cue("Now yours") + 0.2, { dy: 30 });

    // the sticky note, its face turned away (blank back with a curled corner)
    const S = 220;
    const note = ctx.el("sticky_note", { x: 850, y: 610, w: S, h: S, kind: "card", exit: "recede" });
    // @form sticky_note_back: blank paper square, name turned away
    kit.rect(note.inner, 0, 0, S, S, { fill: "accent", r: 8 });
    kit.rect(note.inner, 0, S - 46, 46, 46, { fill: "surface", r: 6, shadow: false });
    m.drop(note, ctx.cue("one conversation you have been putting off"));

    // alone: one small pulse
    m.emphasis(note, ctx.cue("Just one"));
  },
});
