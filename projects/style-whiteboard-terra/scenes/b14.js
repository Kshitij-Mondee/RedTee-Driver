// @design blank_agenda_question: a hand-drawn agenda waits for its first line to become a question, then a pocket rule settles beneath it
// Treatments considered: (A) a full checklist, rejected because the learner needs one calm move; (B) a busy meeting table, rejected because the viewer's own agenda is the subject; (C) chosen, one blank agenda card with a single accent question and a written pocket rule.
Loom.scene("b14", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const DRAW = S.dur("draw");
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const drawDur = (len) => DRAW * clamp(len / 900, 0.3, 1.4);
    const writeDur = (str) => DRAW * clamp(String(str).length / 14, 0.45, 1.8);

    // The card is the familiar invite, now emptied for the learner's own meeting.
    const tAgenda = ctx.cue("Before your next meeting");
    const agenda = ctx.el("agenda", { x: 380, y: 130, w: 1160, h: 600, kind: "card", exit: "wipe" });
    const invite = Loom.lesson.invite_card(ctx, agenda.inner, { blank: true, name: "agenda" });
    invite.draw(tAgenda - 0.25);

    // The kit exposes the blank first-line slot, so the accent question stays registered to it.
    const tQuestion = ctx.cue("as a question");
    const slot = invite.slotBox;
    const firstLine = ctx.el("first_line_q", {
      x: 380 + slot.x, y: 130 + slot.y, w: slot.w, h: slot.h, kind: "mark", exit: "recede"
    });
    kit.text(firstLine.inner, "?", {
      role: "title", x: 0, y: 0, w: slot.w, h: slot.h, maxLines: 1, align: "center", valign: "middle", color: "accent"
    });
    m.unmask(firstLine, tQuestion, { dur: writeDur("?") });

    // The final line writes in three spoken phrases and rests before the narration ends.
    const tRule = ctx.cue("Name it, steer it, read it back");
    const rule = ctx.el("rule", { x: 430, y: 770, w: 1080, h: 130, kind: "text", exit: "wipe" });
    const ruleText = [
      { name: "rule_name", text: "Name it", at: tRule, x: 0, w: 300 },
      { name: "rule_steer", text: "steer it", at: tRule + 0.58, x: 320, w: 300 },
      { name: "rule_read", text: "read it back", at: tRule + 1.18, x: 640, w: 440 }
    ];
    ruleText.forEach((part) => {
      const E = ctx.el(part.name, { x: part.x, y: 0, w: part.w, h: 130, kind: "text", exit: "wipe", parent: rule });
      kit.text(E.inner, part.text, { role: "title", x: 0, y: 0, w: part.w, h: 130, maxLines: 1, align: "center", valign: "middle" });
      m.unmask(E, part.at, { dur: writeDur(part.text) });
    });
  },
});
