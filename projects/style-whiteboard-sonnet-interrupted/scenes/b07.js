// @design steering_a_talk_with_a_parking_corner: the question stays on the board while an off-topic remark is lifted out and written into a corner box with an owner
/* Treatments considered: (A) static board with all parts and a signalling arrow (rejected: nothing is steered),
 * (B) side topic as a sticky note pulled across (rejected: not whiteboard hand), (C) CHOSEN: the question is
 * written, a bubble drifts in beside it, and it is carried into a corner box and given a name. */
Loom.scene("b07", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const DRAW = S.dur("draw");
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const drawDur = (len) => DRAW * clamp(len / 900, 0.3, 1.4);
    const writeDur = (str) => DRAW * clamp(String(str).length / 14, 0.45, 1.8);
    const hand = (g, d, o) => kit.sketch(g, "path", [d], Object.assign({ fill: "none", stroke: "ink" }, o || {}));

    // ---- 1. the checklist: Before already ticked; the ink moves to During
    const steps = ctx.el("steps", { x: 1420, y: 96, w: 380, h: 300, kind: "list", exit: "recede" });
    const sl = Loom.lesson.step_list(ctx, steps.inner, { current: 0, ticked: [true, false, false], name: "steps" });
    sl.appear();
    sl.setCurrent(1, ctx.cue("During"));

    // ---- 2. Sam over a hand desk line, left third
    const tSam = ctx.cue("Open by saying");
    const desk = ctx.el("desk", { x: 90, y: 810, w: 560, h: 24, kind: "scenery", exit: "recede" });
    hand(desk.inner, "M4 12 L556 9");
    m.draw(desk, tSam, { dur: drawDur(560) });
    const sam = Loom.lesson.team_table.person(ctx, "Sam", "explaining", { x: 150, y: 410, size: 400, name: "sam" });
    m.reveal(sam, tSam + 0.15, { dy: 0 });

    // ---- 3. the question, written across the top centre
    const tQ = ctx.cue("the question again");
    const q = ctx.el("question", { x: 500, y: 100, w: 860, h: 150, kind: "text", exit: "wipe" });
    kit.text(q.inner, "May or June?", { role: "hero", x: 0, y: 0, w: 860, h: 150, maxLines: 1, align: "center", valign: "middle" });
    m.unmask(q, tQ, { dur: writeDur("May or June?") });

    // ---- 4. a side topic comes up: a bubble beside the question (below it, right of Sam)
    const tB = ctx.cue("A side topic comes up");
    const bub = ctx.el("side_bubble", { x: 900, y: 300, w: 300, h: 164, kind: "bubble", exit: "recede" });
    hand(bub.inner, "M8 6 L292 4 L292 130 L172 131 L150 158 L128 131 L8 132 Z");
    m.draw(bub, tB, { dur: 0.6 });
    const bw = ctx.el("side_bubble_words", { x: 20, y: 40, w: 260, h: 64, kind: "text", exit: "wipe", parent: bub.inner });
    kit.text(bw.inner, "side topic", { role: "label", x: 0, y: 0, w: 260, h: 64, maxLines: 1, align: "center", valign: "middle" });
    m.unmask(bw, tB + 0.45, { dur: writeDur("side topic") });

    // ---- 5. the corner box, bottom right: box, heading, then the parked item; the bubble is carried into it
    const tL = ctx.cue("in a corner of the board");
    const LX = 1240, LY = 570, LW = 560, LH = 290;
    const lot = ctx.el("parking_lot", { x: LX, y: LY, w: LW, h: LH, kind: "card", exit: "recede" });
    kit.sketch(lot.inner, "rectangle", [4, 4, LW - 8, LH - 8], { fill: "none" });
    m.draw(lot, tL, { dur: 0.7 });
    const head = ctx.el("parking_lot_head", { x: 20, y: 16, w: LW - 40, h: 72, kind: "text", exit: "wipe", parent: lot.inner });
    kit.text(head.inner, "Parking lot", { role: "lead", x: 0, y: 0, w: LW - 40, h: 72, maxLines: 1, align: "center", valign: "middle" });
    m.unmask(head, tL + 0.5, { dur: writeDur("Parking lot") });
    const rule = ctx.el("parking_lot_rule", { x: 30, y: 96, w: LW - 60, h: 20, kind: "scenery", exit: "recede", parent: lot.inner });
    hand(rule.inner, "M2 10 L" + (LW - 62) + " 8");
    m.draw(rule, tL + 0.7, { dur: 0.4 });
    const itemBox = ctx.el("parked_item_box", { x: 30, y: 150, w: 260, h: 90, kind: "card", exit: "recede", parent: lot.inner });
    kit.sketch(itemBox.inner, "rectangle", [4, 4, 252, 82], { fill: "none" });
    const tItem = tL + 1.0;
    m.draw(itemBox, tItem, { dur: 0.45 });
    const item = ctx.el("parked_item", { x: 40, y: 160, w: 240, h: 70, kind: "text", exit: "wipe", parent: lot.inner });
    kit.text(item.inner, "side topic", { role: "label", x: 0, y: 0, w: 240, h: 70, maxLines: 1, align: "center", valign: "middle" });
    m.unmask(item, tItem + 0.35, { dur: writeDur("side topic") });
    // the bubble is lifted out and carried to the corner while it leaves
    m.travel(bub, tL + 0.1, { x: LX + 30, y: LY + 150, scale: 0.8 });
    m.exit(bub, tL + 0.55, "recede");

    // ---- 6. a name beside the parked item: the one accent
    const tN = ctx.cue("with a name");
    const nm = ctx.el("parked_name", { x: 320, y: 160, w: 200, h: 70, kind: "text", exit: "wipe", parent: lot.inner });
    kit.text(nm.inner, "Lena", { role: "lead", x: 0, y: 0, w: 200, h: 70, maxLines: 1, align: "center", valign: "middle", color: "accent" });
    m.unmask(nm, tN, { dur: writeDur("Lena") });
  },
});
