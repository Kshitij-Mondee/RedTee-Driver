// @design decision_readback_anchors: one written decision becomes actionable as its what, owner and deadline are underlined
// Treatments considered: (A) a three-card summary, rejected because it reads as a slide. (B) a static line with labels, rejected because the spoken read-back has no rhythm. (C) chosen, one written line with underlines arriving on the spoken anchors.
Loom.scene("b09", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const DRAW = S.dur("draw");
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const drawDur = (len) => DRAW * clamp(len / 900, 0.3, 1.4);
    const hand = (g, d, o) => kit.sketch(g, "path", [d], Object.assign({ fill: "none", stroke: "ink" }, o || {}));

    const tClose = ctx.cue("At the close");
    const tRead = ctx.cue("read each decision back");
    const tWhat = ctx.cue("What");
    const tWho = ctx.cue("who owns it");
    const tWhen = ctx.cue("by when");
    const tCorrect = ctx.cue("correct it in the room");

    // @form steps: the persistent three move checklist at the top of the board
    const steps = ctx.el("steps", { x: 1420, y: 96, w: 380, h: 300, kind: "list", exit: "recede" });
    const stepList = Loom.lesson.step_list(ctx, steps.inner, { name: "steps", current: 1, ticked: [true, true, false] });
    stepList.appear();
    stepList.setCurrent(2, tClose);

    // @form desk: a hand-drawn desk line grounds Sam at the left edge
    const desk = ctx.el("desk", { x: 110, y: 660, w: 420, h: 20, kind: "scenery", exit: "recede" });
    hand(desk.inner, "M0 10 L420 8");
    m.draw(desk, tRead - 0.28, { dur: drawDur(420) });

    // @form sam: Sam listens beside the written decision
    const sam = ctx.el("sam", { x: 140, y: 320, w: 360, h: 350, kind: "character", exit: "recede" });
    kit.peep(sam.inner, "man", "explaining", { x: 180, y: 175, size: 340, cloth: "accent2", skin: 1 });
    m.reveal(sam, tRead - 0.12, { dy: 0 });

    // @form decision: the three-part written decision is read from left to right
    const decision = ctx.el("decision", { x: 590, y: 440, w: 1100, h: 150, kind: "statement", exit: "recede" });
    const line = Loom.lesson.decision_line(ctx, decision.inner, { name: "decision", w: 1100, parts: ["Pilot ships in June", "Priya", "by Friday"] });
    line.write(tRead);
    line.underline(0, tWhat, { tone: "accent" });
    line.label(0, "What", tWhat);
    line.underline(1, tWho, { tone: "accent" });
    line.label(1, "Who", tWho);
    line.underline(2, tWhen, { tone: "accent" });
    line.label(2, "By when", tWhen);

    // @form correct_note: a muted correction prompt points back to the decision before the room moves on
    const correctNote = ctx.el("correct_note", { x: 1190, y: 650, w: 350, h: 58, kind: "label", exit: "recede" });
    kit.text(correctNote.inner, "correct it now", { role: "label", x: 0, y: 0, w: 350, h: 58, maxLines: 1, valign: "middle", color: "muted" });
    m.unmask(correctNote, tCorrect - 0.16, { dur: S.dur("draw") * 0.9 });

    // @form correction_arrow: a short hand arrow links the correction prompt to the deadline
    const correctionArrow = ctx.el("correction_arrow", { x: 1430, y: 574, w: 122, h: 92, kind: "connector", exit: "recede" });
    hand(correctionArrow.inner, "M98 80 Q76 48 30 18 M42 17 L30 18 L34 30", { stroke: "muted", sw: 3.6 });
    m.draw(correctionArrow, tCorrect, { dur: drawDur(100) });
  },
});
