// @design decision_readback_marked_part_by_part: a written decision is read across, each accountable part gaining its marker underline
// Treatments: (A) three cards, rejected because the sentence must stay one decision. (B) a static line with labels, rejected because it misses the spoken read-back. (C) chosen, Sam and a single decision line accumulate marker underlines in speech order.
Loom.scene("b09", {
  build(ctx) {
    const { kit, m } = ctx;
    const DRAW = ctx.style.dur("draw");
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const drawDur = (len) => DRAW * clamp(len / 900, 0.3, 1.4);
    const hand = (g, d, o) => kit.sketch(g, "path", [d], Object.assign({ fill: "none", stroke: "ink" }, o || {}));

    const tClose = ctx.cue("At the close");
    const tRead = ctx.cue("read each decision back");
    const tWhat = ctx.cue("What");
    const tWho = ctx.cue("who owns it");
    const tWhen = ctx.cue("by when");
    const tCorrect = ctx.cue("correct it in the room");

    // @form step_list: the completed three-step meeting checklist
    const steps = ctx.el("steps", { x: 1420, y: 96, w: 380, h: 300, kind: "instrument", exit: "recede" });
    const stepList = Loom.lesson.step_list(ctx, steps.inner, { name: "steps", current: 1, ticked: [true, true, false] });
    stepList.appear();
    stepList.setCurrent(2, tClose);
    stepList.tick(2, tClose + 0.15, { tone: "ink" });

    // @form desk_line: Sam's drawn desk edge
    const desk = ctx.el("desk", { x: 120, y: 658, w: 390, h: 24, kind: "scenery", exit: "recede" });
    hand(desk.inner, "M0 13 Q190 5 390 12");
    m.draw(desk, tRead - 0.32, { dur: drawDur(390) });

    // @form sam_bust: Sam listens beside the written decision
    const sam = ctx.el("sam", { x: 138, y: 320, w: 350, h: 350, kind: "character", exit: "recede" });
    kit.peep(sam.inner, "man", "explaining", { x: 175, y: 175, size: 340, cloth: "accent2", skin: 1 });
    m.reveal(sam, tRead - 0.12, { dy: 0 });

    // @form decision_line: the one written decision, kept as one accountable sentence
    const decision = ctx.el("decision", { x: 560, y: 430, w: 780, h: 160, kind: "text", exit: "wipe" });
    const line = Loom.lesson.decision_line(ctx, decision.inner, { name: "decision", w: 780, parts: ["Pilot ships in June", "Priya", "by Friday"] });
    line.write(tRead);

    // @form accent_underlines: the existing decision is marked, never copied
    line.underline(0, tWhat, { tone: "accent" });
    line.label(0, "What", tWhat + 0.12);
    line.underline(1, tWho, { tone: "accent" });
    line.label(1, "Who", tWho + 0.12);
    line.underline(2, tWhen, { tone: "accent" });
    line.label(2, "By when", tWhen + 0.12);

    // @form correction_note: a muted opportunity to correct the decision before leaving
    const correct_note = ctx.el("correct_note", { x: 785, y: 700, w: 430, h: 110, kind: "label", exit: "wipe" });
    kit.text(correct_note.inner, "correct it now", { role: "label", x: 80, y: 42, w: 330, h: 54, maxLines: 1, color: "muted", valign: "middle" });
    hand(correct_note.inner, "M64 45 Q34 18 8 4 M8 4 L24 8 M8 4 L14 20", { stroke: "muted", sw: 3.6 });
    m.unmask(correct_note, tCorrect - 0.15, { dir: "ltr", dur: 0.7 });
    m.draw(correct_note, tCorrect - 0.15, { dur: drawDur(95) });
  },
});
