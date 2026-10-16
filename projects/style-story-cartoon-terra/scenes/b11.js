// @design calm_note_callback: Maya returns to her desk, sends a note, and pins a concise rule to the wall
/*
 * Treatments considered: (A) a floating summary card, rejected because the message belongs on Maya's laptop;
 * (B) a close-up of the screen, rejected because the relaxed callback to the opening desk would be lost;
 * (C) chosen, the opening medium desk shot returns, with one calm send, a wall note, and a closing smile.
 */
Loom.scene("b11", {
  build(ctx) {
    const { kit, m } = ctx;
    const backAt = ctx.cue("Back at her desk, Maya sends a calm note.");
    const ruleAt = ctx.cue("Notice it. Weigh it. Speak up.");
    const closeAt = ctx.cue("Honesty, not proof.");

    // @form office_callback: the same warm office wall and window as the opening desk shot
    const back = Loom.lesson.desk_set(ctx, ctx.g, { framing: "medium", layer: "back" });
    const room = back.room;

    // @form maya_relaxed: Maya is calm at her familiar desk
    const maya = ctx.character("maya", "maya", {
      x: back.anchors.maya.x, y: back.anchors.maya.y, scale: back.anchors.maya.scale,
      pose: "idle", skin: 0, cloth: "cloth"
    });
    maya.emotion("neutral", backAt);
    maya.emotion("smile", closeAt + 0.18);
    maya.gesture("nod", closeAt + 0.34, closeAt + 1.05);

    // @form desk_callback: the original desk returns without the warning ring
    const front = Loom.lesson.desk_set(ctx, ctx.g, {
      framing: "medium", layer: "front", laptop: "mail", ring: false, magnifier: false
    });
    const desk = front.desk;
    const receipts = front.receipts;
    const phone = front.phone;
    const laptop = front.laptop;
    front.setState("sent_on", backAt + 1.55);
    front.setState("laptop_closed", closeAt + 0.12);

    // @form pocket_rule: a paper sticky note lands in the free left wall space and writes the three actions
    const pocket_rule = Loom.treat.panel(ctx, "pocket_rule", {
      x: back.anchors.wall_left.x + 20, y: back.anchors.wall_left.y + 45, w: 370, h: 210,
      title: "", fill: "surface", tone: "ink", t: ruleAt
    });
    const notice = ctx.el("notice_words", { x: 30, y: 20, w: 310, h: 55, kind: "text", parent: pocket_rule.inner });
    kit.text(notice.inner, "Notice.", { role: "lead", x: 0, y: 0, w: 310, h: 55, align: "center", valign: "middle", maxLines: 1, color: "accent" });
    const weigh = ctx.el("weigh_words", { x: 30, y: 77, w: 310, h: 55, kind: "text", parent: pocket_rule.inner });
    kit.text(weigh.inner, "Weigh.", { role: "lead", x: 0, y: 0, w: 310, h: 55, align: "center", valign: "middle", maxLines: 1, color: "accent" });
    const speak = ctx.el("speak_words", { x: 30, y: 134, w: 310, h: 55, kind: "text", parent: pocket_rule.inner });
    kit.text(speak.inner, "Speak up.", { role: "lead", x: 0, y: 0, w: 310, h: 55, align: "center", valign: "middle", maxLines: 1, color: "accent" });
    m.unmask(notice, ruleAt + 0.12);
    m.unmask(weigh, ruleAt + 0.52);
    m.unmask(speak, ruleAt + 0.92);
  },
});
