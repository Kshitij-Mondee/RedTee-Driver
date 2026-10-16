// @design question_parking_corner: a meeting board turns a drifting side topic into a named parking-lot entry
// Treatments considered: (A) a dense agenda grid, rejected because it reads as a slide. (B) a speech-bubble debate, rejected because steering is invisible. (C) chosen, Sam, the repeated question, and one side topic moving into a named corner.
Loom.scene("b07", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const drawDur = (len) => S.dur("draw") * clamp(len / 900, 0.3, 1.1);
    const writeDur = (str) => S.dur("draw") * clamp(String(str).length / 14, 0.45, 1.1);
    const hand = (g, d, o) => kit.sketch(g, "path", [d], Object.assign({ fill: "none", stroke: "ink" }, o || {}));
    const tDuring = ctx.cue("During.");
    const tOpen = ctx.cue("Open by saying");
    const tQuestion = ctx.cue("the question again");
    const tSide = ctx.cue("A side topic comes up");
    const tPark = ctx.cue("in a corner of the board");
    const tName = ctx.cue("with a name");

    // @form steps: the persistent three-step meeting checklist
    const steps = ctx.el("steps", { x: 1420, y: 96, w: 380, h: 300, kind: "instrument", exit: "recede" });
    const stepHandle = Loom.lesson.step_list(ctx, steps.inner, { current: 0, ticked: [true, false, false], name: "steps" });
    stepHandle.appear();
    stepHandle.setCurrent(1, tDuring);

    // @form desk: one hand-drawn meeting desk line
    const desk = ctx.el("desk", { x: 118, y: 720, w: 455, h: 24, kind: "scenery", exit: "recede" });
    hand(desk.inner, "M4 13 Q220 5 450 12");
    m.draw(desk, tOpen - 0.28, { dur: drawDur(455) });

    // @form sam: Sam explains from the left side of the board
    const sam = ctx.el("sam", { x: 150, y: 380, w: 370, h: 350, kind: "character", exit: "recede" });
    Loom.lesson.team_table.person(ctx, "Sam", "explaining", { x: 185, y: 175, size: 330, name: "sam_person", parent: sam.inner });
    m.reveal(sam, tOpen, { dy: 0 });

    // @form question: the repeated meeting question at the board's top centre
    const question = ctx.el("question", { x: 560, y: 155, w: 690, h: 150, kind: "text", exit: "wipe" });
    kit.text(question.inner, "May or June?", { role: "title", x: 15, y: 0, w: 660, h: 105, maxLines: 1, align: "center", valign: "middle" });
    hand(question.inner, "M110 130 Q345 142 580 128", { stroke: "accent2", sw: 4 });
    m.unmask(question, tQuestion - 0.15, { dur: writeDur("May or June?") });

    // @form side_bubble: the side topic arrives near the current question
    const side_bubble = ctx.el("side_bubble", { x: 770, y: 340, w: 310, h: 130, kind: "bubble", exit: "iris" });
    kit.sketch(side_bubble.inner, "rectangle", [12, 8, 286, 94], { fill: "surface" });
    hand(side_bubble.inner, "M65 102 L85 122 L105 100");
    kit.text(side_bubble.inner, "side topic", { role: "lead", x: 35, y: 29, w: 240, h: 55, maxLines: 1, align: "center", valign: "middle" });
    m.reveal(side_bubble, tSide - 0.12, { dy: 0 });

    // @form parking_lot: a rough corner box turns the side topic into a parked item
    const parking_lot = ctx.el("parking_lot", { x: 1190, y: 575, w: 555, h: 270, kind: "card", exit: "recede" });
    kit.sketch(parking_lot.inner, "rectangle", [0, 0, 555, 270], { fill: "none" });
    hand(parking_lot.inner, "M18 82 Q275 74 537 82", { stroke: "muted", sw: 3.6 });
    kit.text(parking_lot.inner, "Parking lot", { role: "lead", x: 30, y: 18, w: 330, h: 52, maxLines: 1, valign: "middle" });
    kit.text(parking_lot.inner, "side topic", { role: "body", x: 55, y: 125, w: 270, h: 60, maxLines: 1, valign: "middle" });
    m.draw(parking_lot, tPark - 0.28, { dur: drawDur(1650) });
    m.unmask(parking_lot, tPark + 0.18, { dur: writeDur("Parking lot side topic") });

    // @form parked_name: the accountable name sits beside the item in the parking lot
    const parked_name = ctx.el("parked_name", { x: 1480, y: 692, w: 155, h: 66, kind: "label", exit: "wipe" });
    kit.text(parked_name.inner, "Lena", { role: "lead", x: 0, y: 0, w: 155, h: 60, maxLines: 1, color: "accent", align: "center", valign: "middle" });
    m.unmask(parked_name, tName - 0.12, { dur: writeDur("Lena") });
    m.exit(side_bubble, tPark + 0.2, "iris");
  },
});
