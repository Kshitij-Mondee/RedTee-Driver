// @design table_note_built_line_by_line_continued: Thursday is written on the note, the camera returns to the two-shot and the note crosses to the other side
// Holds the room and the next-step note. "Thursday" is written in a box on the note's top corner (still the table close-up),
// the camera pulls back to the two-shot, then the note slides across the table to Maya's side (a little smaller, as it is
// further away) and a tag names it.
Loom.scene("b35", {
  build(ctx) {
    const { kit, m } = ctx;
    const svg = Loom.svg;

    const room = ctx.held("room");
    ["report", "update", "card", "tick_ask", "question", "note_confirm"].forEach((n) => ctx.held(n));
    const note = ctx.held("nextstep");
    ["nextstep.line1", "nextstep.line2", "nextstep.line3"].forEach((n) => ctx.held(n));   // the written lines are elements of their own
    const maya = ctx.held("maya").__api;
    const R = room.__R, mid = R.layers.mid.g;

    const tThu = ctx.cue("on Thursday");
    const tSmall = ctx.cue("Small, concrete");
    const tTogether = ctx.cue("something they chose together");
    const tChose = ctx.cue("chose together");

    // Thursday, written on the note's top corner and boxed
    // @form boxed_word_tab: one word in a ruled box on the corner of a note, written in by hand
    const f = kit.fit("Thursday", { role: "label", w: 150, maxLines: 1, weight: 800 });
    const TW = Math.ceil(f.width + 28), TH = Math.ceil(f.height + 16);
    const tab = ctx.el("thursday", { x: note.w - TW - 20, y: -TH / 2 - 6, w: TW, h: TH, kind: "label", parent: note.inner });
    kit.rect(tab.inner, 0, 0, TW, TH, { fill: "surface", r: 4, flat: true, crisp: true, shadow: false });
    svg("rect", { x: 1.5, y: 1.5, width: TW - 3, height: TH - 3, rx: 4, fill: "none", stroke: ctx.c("ink"), "stroke-width": 3 }, tab.inner);
    kit.text(tab.inner, "Thursday", { role: "label", x: 14, y: 0, w: TW - 28, h: TH, valign: "middle", align: "center", maxLines: 1, weight: 800, color: "ink" });
    m.unmask(tab, tThu, { dur: 0.8, content: true });

    // the camera pulls back to the medium two-shot on "small, concrete"
    Loom.cam.pull(R, { t0: tSmall, t1: tSmall + 1.7 });

    // the agreement changes hands: the note slides across the table to Maya's side and stays; Maya smiles
    const S2 = 0.8, tx = 650, ty = 848;                                  // target centre on the table, in the room's coordinates
    m.travel(note, tTogether, { x: tx - note.x - (S2 * note.w) / 2, y: ty - note.y - (S2 * note.h) / 2, scale: S2, dur: 1.4 });
    maya.emotion("smile", tTogether + 0.3);

    // the tag names what makes it work; it sits against the note's near edge, on the table
    // @form owner_chip: a solid tag that wipes in against the thing it names
    const tag = Loom.data.tag(ctx, "tag_together", { x: 500, y: 920, text: "chose together", color: "accent", t: tChose });
    mid.appendChild(tag.outer);
  },
});
