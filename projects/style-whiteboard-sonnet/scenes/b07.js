// @design steering_by_parking: the one who runs the room restates the question and moves stray topics to a named corner
/* Treatments considered: (A) a bulleted list of tips (rejected: a slide), (B) a static board with every part
 * already there (rejected: no steering), (C) CHOSEN: Sam at the board; the question is written, a side topic
 * floats in as a bubble and is carried into a drawn corner box, then a name is written beside it. */
Loom.scene("b07", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const DRAW = S.dur("draw");
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const drawDur = (len) => DRAW * clamp(len / 900, 0.3, 1.4);
    const writeDur = (str) => DRAW * clamp(String(str).length / 14, 0.45, 1.8);
    const hand = (g, d, o) => kit.sketch(g, "path", [d], Object.assign({ fill: "none", stroke: "ink" }, o || {}));

    // ---- the checklist: complete from the first frame, Before ticked, During turns ink on its word
    const steps = ctx.el("steps", { x: 1420, y: 96, w: 380, h: 300, kind: "list", exit: "recede" });
    const sl = Loom.lesson.step_list(ctx, steps.inner, { current: 0, ticked: [true, false, false] });
    steps.handle = sl;
    sl.appear();
    const tDuring = ctx.cue("During");
    sl.setCurrent(1, tDuring);

    // ---- the desk line, then Sam over it
    const tOpen = ctx.cue("Open by saying");
    const desk = ctx.el("desk", { x: 100, y: 690, w: 1290, h: 24, kind: "scenery", exit: "recede" });
    hand(desk.inner, "M0 12 L1290 9");
    m.draw(desk, tOpen - 0.2, { dur: 0.8 });
    const sam = Loom.lesson.team_table.person(ctx, "Sam", "explaining", { x: 110, y: 340, size: 360, name: "sam" });
    m.reveal(sam, tOpen + 0.3, { dy: 0 });

    // ---- the question, written across the top centre
    const tQ = ctx.cue("the question again");
    const question = ctx.el("question", { x: 560, y: 100, w: 800, h: 170, kind: "text", exit: "wipe" });
    kit.text(question.inner, "May or June?", { role: "hero", x: 0, y: 0, w: 800, h: 170, maxLines: 1, align: "center", valign: "middle" });
    m.unmask(question, tQ, { dur: writeDur("May or June?") + 0.3 });

    // ---- a side topic floats in as a bubble near the question
    const tSide = ctx.cue("A side topic comes up");
    const bubble = ctx.el("side_bubble", { x: 700, y: 300, w: 300, h: 170, kind: "bubble", exit: "recede" });
    hand(bubble.inner, "M8 6 L292 4 L292 130 L120 131 L56 162 L76 132 L8 132 Z");
    m.draw(bubble, tSide, { dur: 0.6 });
    const bw = ctx.el("side_bubble_words", { x: 20, y: 40, w: 260, h: 60, kind: "text", exit: "wipe", parent: bubble.inner });
    kit.text(bw.inner, "side topic", { role: "body", x: 0, y: 0, w: 260, h: 60, maxLines: 1, align: "center", valign: "middle" });
    m.unmask(bw, tSide + 0.45, { dur: writeDur("side topic") });

    // ---- the corner box is drawn bottom right; the bubble is carried into it
    const tCorner = ctx.cue("in a corner of the board");
    const PX = 1416, PY = 650, PW = 400, PH = 230;
    const lot = ctx.el("parking_lot", { x: PX, y: PY, w: PW, h: PH, kind: "card", exit: "recede" });
    kit.sketch(lot.inner, "rectangle", [4, 4, PW - 8, PH - 8], { fill: "none" });
    m.draw(lot, tCorner - 0.1, { dur: 0.8 });
    const head = ctx.el("parking_lot_head", { x: 24, y: 20, w: 350, h: 64, kind: "text", exit: "wipe", parent: lot.inner });
    kit.text(head.inner, "Parking lot", { role: "lead", x: 0, y: 0, w: 350, h: 64, maxLines: 1, valign: "middle" });
    m.unmask(head, tCorner + 0.5, { dur: writeDur("Parking lot") });
    m.travel(bubble, tCorner + 0.9, { x: PX + 16, y: PY + 118, scale: 0.35 });
    m.exit(bubble, tCorner + 1.3, "recede");
    const item = ctx.el("parking_lot_item", { x: 24, y: 112, w: 180, h: 80, kind: "text", exit: "wipe", parent: lot.inner });
    kit.text(item.inner, "side topic", { role: "body", x: 0, y: 0, w: 180, h: 80, maxLines: 1, valign: "middle" });
    m.unmask(item, tCorner + 1.6, { dur: writeDur("side topic") });

    // ---- the name, the one accent of the board
    const tName = ctx.cue("with a name");
    const name = ctx.el("parked_name", { x: PX + 206, y: PY + 102, w: 190, h: 110, kind: "text", exit: "wipe" });
    kit.text(name.inner, "Lena", { role: "title", x: 0, y: 0, w: 190, h: 110, maxLines: 1, valign: "middle", color: "accent" });
    m.unmask(name, tName, { dur: writeDur("Lena") });
  },
});
