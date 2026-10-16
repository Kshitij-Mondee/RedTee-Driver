// @design blank_agenda_question: an empty agenda line becomes a question, then resolves into a three-part pocket rule
/* Treatments considered: (A) a checklist, rejected because the learner needs one memorable rule, not steps.
 * (B) a crowded meeting table, rejected because the blank agenda must be the focal point.
 * (C) chosen, one agenda card, an accent question, then the compact rule written below it.
 */
Loom.scene("b14", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const DRAW = S.dur("draw");
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const drawDur = (len) => DRAW * clamp(len / 900, 0.3, 1.4);
    const writeDur = (str) => DRAW * clamp(String(str).length / 14, 0.45, 1.8);
    const hand = (g, d, o) => kit.sketch(g, "path", [d], Object.assign({ fill: "none", stroke: "ink" }, o || {}));

    const tAgenda = ctx.cue("Before your next meeting");
    const tQuestion = ctx.cue("as a question");
    const tName = ctx.cue("Name it");
    const tSteer = ctx.cue("steer it");
    const tRead = ctx.cue("read it back");

    // @form agenda_card: a blank agenda card, measured at the kit's natural size
    const agenda = ctx.el("agenda", { x: 380, y: 108, w: 1160, h: 600, kind: "card", exit: "recede" });
    const invite = Loom.lesson.invite_card(ctx, agenda.inner, { blank: true, name: "agenda" });
    invite.draw(tAgenda - 0.25);

    // @form first_line_question: a single hand-drawn accent question in the kit's reserved first-line slot
    const slot = invite.slotBox;
    const question = ctx.el("first_line_q", { x: 380 + slot.x, y: 108 + slot.y, w: slot.w, h: slot.h, kind: "mark", exit: "recede" });
    hand(question.inner, "M38 18 C 82 2, 116 23, 105 56 C 97 76, 72 77, 69 96 M69 105 L69 106", { stroke: "accent", sw: 6 });
    m.draw(question, tQuestion - 0.1, { dur: drawDur(155) });

    // @form rule_name: the first phrase of the pocket rule, written under the agenda
    const nameRule = ctx.el("rule_name", { x: 226, y: 766, w: 390, h: 104, kind: "text", exit: "wipe" });
    kit.text(nameRule.inner, "Name it", { role: "title", x: 0, y: 0, w: 390, h: 104, maxLines: 1, valign: "middle" });
    m.unmask(nameRule, tName - 0.05, { dur: writeDur("Name it") });

    // @form rule_comma_one: an ink separator that joins the written phrases
    const commaOne = ctx.el("rule_comma_one", { x: 607, y: 766, w: 36, h: 104, kind: "text", exit: "wipe" });
    kit.text(commaOne.inner, ",", { role: "title", x: 0, y: 0, w: 36, h: 104, maxLines: 1, valign: "middle" });
    m.unmask(commaOne, tSteer - 0.13, { dur: writeDur(",") });

    // @form rule_steer: the second phrase of the pocket rule
    const steerRule = ctx.el("rule_steer", { x: 651, y: 766, w: 410, h: 104, kind: "text", exit: "wipe" });
    kit.text(steerRule.inner, "steer it", { role: "title", x: 0, y: 0, w: 410, h: 104, maxLines: 1, valign: "middle" });
    m.unmask(steerRule, tSteer - 0.05, { dur: writeDur("steer it") });

    // @form rule_comma_two: the second ink separator
    const commaTwo = ctx.el("rule_comma_two", { x: 1056, y: 766, w: 36, h: 104, kind: "text", exit: "wipe" });
    kit.text(commaTwo.inner, ",", { role: "title", x: 0, y: 0, w: 36, h: 104, maxLines: 1, valign: "middle" });
    m.unmask(commaTwo, tRead - 0.18, { dur: writeDur(",") });

    // @form rule_read: the final phrase, completed early enough for a calm rest
    const readRule = ctx.el("rule_read", { x: 1102, y: 766, w: 592, h: 104, kind: "text", exit: "wipe" });
    kit.text(readRule.inner, "read it back", { role: "title", x: 0, y: 0, w: 592, h: 104, maxLines: 1, valign: "middle" });
    m.unmask(readRule, tRead - 0.45, { dur: writeDur("read it back") });
  },
});
