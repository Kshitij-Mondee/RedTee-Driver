// @design meeting_question_parking: a facilitator keeps one question visible while a side topic is given a named corner
/* Treatments considered: (A) a full meeting table, rejected because the spoken steering action gets lost; (B) cards, rejected because it reads as slides; (C) chosen, one facilitator, question and parking corner accumulating on one board. */
Loom.scene("b07", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const DRAW = S.dur("draw");
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const drawDur = (len) => DRAW * clamp(len / 900, 0.3, 1.4);
    const writeDur = (str) => DRAW * clamp(String(str).length / 14, 0.45, 1.8);
    const hand = (g, d, o) => kit.sketch(g, "path", [d], Object.assign({ fill: "none", stroke: "ink" }, o || {}));

    // @form steps: the persistent three-move meeting checklist
    const steps = ctx.el("steps", { x: 1420, y: 96, w: 380, h: 300, kind: "instrument", exit: "recede" });
    const stepList = Loom.lesson.step_list(ctx, steps.inner, { name: "steps", current: 0, ticked: [true, false, false] });
    stepList.appear();
    stepList.setCurrent(1, ctx.cue("During."));

    const tOpen = ctx.cue("Open by saying");
    // @form desk: hand-drawn line grounding the facilitator
    const desk = ctx.el("desk", { x: 120, y: 750, w: 460, h: 20, kind: "scenery", exit: "recede" });
    hand(desk.inner, "M0 10 L460 8");
    m.draw(desk, tOpen - 0.25, { dur: drawDur(460) });

    // @form sam: Sam explaining from the left third of the board
    const sam = Loom.lesson.team_table.person(ctx, "Sam", "explaining", { x: 175, y: 430, size: 330, name: "sam" });
    m.reveal(sam, tOpen, { dy: 0 });

    const tQuestion = ctx.cue("the question again");
    // @form question: the meeting question written large across the board
    const question = ctx.el("question", { x: 620, y: 150, w: 700, h: 130, kind: "text", exit: "wipe" });
    kit.text(question.inner, "May or June?", { role: "title", x: 0, y: 0, w: 700, h: 130, maxLines: 1, align: "center", valign: "middle", color: "ink" });
    m.unmask(question, tQuestion, { dur: writeDur("May or June?") });

    const tSide = ctx.cue("A side topic comes up");
    // @form side_bubble: a rough spoken side-topic bubble beside the question
    const sideBubble = ctx.el("side_bubble", { x: 760, y: 335, w: 390, h: 150, kind: "bubble", exit: "iris" });
    hand(sideBubble.inner, "M10 8 L380 5 L382 112 L230 114 L198 142 L170 114 L8 116 Z");
    const sideWords = ctx.el("side_bubble_words", { x: 20, y: 28, w: 350, h: 62, kind: "text", exit: "wipe", parent: sideBubble.inner });
    kit.text(sideWords.inner, "side topic", { role: "lead", x: 0, y: 0, w: 350, h: 62, maxLines: 1, align: "center", valign: "middle", color: "ink" });
    m.draw(sideBubble, tSide, { dur: drawDur(980) });
    m.unmask(sideWords, tSide + 0.4, { dur: writeDur("side topic") });

    const tPark = ctx.cue("in a corner of the board");
    // @form parking_lot: a named rough corner box that holds the parked topic
    const parkingLot = ctx.el("parking_lot", { x: 1100, y: 610, w: 610, h: 250, kind: "card", exit: "recede" });
    hand(parkingLot.inner, "M4 4 L606 2 L608 246 L2 248 Z");
    hand(parkingLot.inner, "M4 72 L606 70");
    const parkTitle = ctx.el("parking_lot_title", { x: 28, y: 12, w: 380, h: 52, kind: "text", exit: "wipe", parent: parkingLot.inner });
    kit.text(parkTitle.inner, "Parking lot", { role: "lead", x: 0, y: 0, w: 380, h: 52, maxLines: 1, valign: "middle", color: "ink" });
    const parkedItem = ctx.el("parking_lot_item", { x: 38, y: 112, w: 320, h: 62, kind: "text", exit: "wipe", parent: parkingLot.inner });
    kit.text(parkedItem.inner, "side topic", { role: "lead", x: 0, y: 0, w: 320, h: 62, maxLines: 1, valign: "middle", color: "ink" });
    m.draw(parkingLot, tPark - 0.3, { dur: drawDur(1700) });
    m.unmask(parkTitle, tPark + 0.25, { dur: writeDur("Parking lot") });
    m.unmask(parkedItem, tPark + 0.72, { dur: writeDur("side topic") });
    Loom.tween(sideBubble.life, { opacity: 1 }, { opacity: 0 }, tPark + 0.3, { dur: S.dur("exit") });

    const tName = ctx.cue("with a name");
    // @form parked_name: the one accent, naming who will pick up the parked item
    const parkedName = ctx.el("parked_name", { x: 390, y: 112, w: 180, h: 62, kind: "label", exit: "wipe", parent: parkingLot.inner });
    kit.text(parkedName.inner, "Lena", { role: "lead", x: 0, y: 0, w: 180, h: 62, maxLines: 1, valign: "middle", color: "accent" });
    m.unmask(parkedName, tName, { dur: writeDur("Lena") });
  },
});
