// @design set_down_the_tool: a person puts down the checking tool while a note on the wall crosses out the demand and keeps the belief
// Treatments: (A) static card + glass lying, (B) CHOSEN: card drops, strike draws, belief stamps, glass lowered by hand, (C) glass in a bubble.
Loom.scene("b04", {
  build(ctx) {
    const { kit, m } = ctx;
    const sv = (t, a, p) => Loom.svg(t, a, p);

    // held from b03: room, desk, receipts, receipt_circle, phone, laptop, maya (never redrawn)
    const mh = ctx.held("maya");
    const maya = mh && (mh.handle || mh);

    // the wall card, left third (desk_set anchors.wall_left: 90,130,400,360)
    const card = ctx.el("rule_card", { x: 90, y: 130, w: 400, h: 360, kind: "card", exit: "recede" });
    kit.rect(card.inner, 0, 0, 400, 360, { fill: "surface", r: 10 });
    kit.disc(card.inner, 200, 26, 12, { fill: "muted" });

    const belief = ctx.el("belief_words", { x: 24, y: 56, w: 352, h: 170, kind: "text", parent: card.inner });
    kit.text(belief.inner, "Honest belief,", { role: "title", x: 0, y: 0, w: 352, h: 170, align: "center", valign: "middle", maxLines: 2, color: "accent" });

    const proof = ctx.el("proof_word", { x: 24, y: 250, w: 352, h: 80, kind: "text", parent: card.inner });
    kit.text(proof.inner, "not proof", { role: "lead", x: 0, y: 0, w: 352, h: 80, align: "center", valign: "middle", maxLines: 1, color: "ink" });
    const fw = Math.min(330, kit.fit("not proof", { role: "lead", w: 352, h: 80, maxLines: 1 }).width + 16);
    const strike = sv("path", { d: "M" + (176 - fw / 2) + " 42 L" + (176 + fw / 2) + " 36", fill: "none", stroke: ctx.c("ink"), "stroke-width": 6, "stroke-linecap": "round" }, proof.inner);

    m.drop(card, ctx.cue("you don't need proof"));
    m.draw(strike, ctx.cue("proof"), { dur: 0.35 });
    m.stamp(belief, ctx.cue("honest belief"));

    // the glass, added as a kit item under its own wrapper so it can be carried by Maya's hand
    const wrap = ctx.el("glass_carry", { x: 0, y: 0, w: 1920, h: 1080, kind: "instrument" });
    const part = Loom.lesson.desk_set(ctx, wrap.inner, { only: ["magnifier"] });
    const glass = part.magnifier;
    m.reveal(wrap, ctx.cue("Investigating") - 0.5, { dy: 0 });
    m.travel(wrap, ctx.cue("Investigating") - 0.5, { x: 640, y: -65, dur: 0.01 });
    m.travel(wrap, ctx.cue("Investigating"), { x: 330, y: -95, dur: 0.6 });
    m.travel(wrap, ctx.cue("Investigating") + 0.6, { x: 0, y: 0, dur: 0.7 });

    if (maya && typeof maya.pose === "function") {
      maya.pose("present", ctx.cue("Investigating") - 0.5, { dur: 0.5 });
      maya.pose("idle", ctx.cue("Investigating") + 1.3, { dur: 0.6 });
    }

    Loom.tween(proof.life, { opacity: 1 }, { opacity: 0.3 }, ctx.cue("your job"), { dur: 0.5 });
    m.exit(card, ctx.end - 0.8, "recede");
  },
});
