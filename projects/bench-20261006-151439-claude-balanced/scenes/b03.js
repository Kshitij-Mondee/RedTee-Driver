// @design false_success_signal: a warm nod and a glowing exit that read as it worked
/* Treatments: (A) static room with tag (rejected: no signal), (B) text card (rejected), (C) CHOSEN: Dev nods, Priya walks out under a pale glow. */
Loom.scene("b03", {
  build(ctx) {
    const { kit, m } = ctx;
    const room = ctx.held("room_set");
    const dev = ctx.held("Dev");
    const priya = ctx.held("Priya");
    ctx.held("sentence_on_board");
    const tNod = ctx.cue("Dev nods warmly");
    const tTag = ctx.cue("fair point");
    const tWalk = ctx.cue("Priya walks out");
    const tGlow = ctx.cue("feeling good about it");
    const D = dev.E || dev;
    if (dev.gesture) { dev.gesture("nod", tNod, tNod + 1.0); dev.emotion("happy", tNod); dev.talk && dev.talk(); }
    const tag = ctx.el("fair_point_tag", { x: 1000, y: 330, w: 330, h: 90, kind: "text", exit: "recede" });
    // @form tag: dev's remark
    kit.rect(tag.inner, 0, 0, 330, 90, { fill: "accent4", r: 16 });
    kit.text(tag.inner, "fair point", { role: "label", x: 0, y: 0, w: 330, h: 90, maxLines: 1, align: "center", valign: "middle", color: Loom.style.pickTokenOn("accent4") });
    m.pop(tag, tNod + 0.8 > tTag ? tTag : tTag);
    if (priya.walk) priya.walk(tWalk, tWalk + 2.2, 520, 5);
    const glow = ctx.el("pale_glow", { x: 1100, y: 250, w: 220, h: 220, kind: "icon", exit: "recede" });
    // @form glow: pale halo
    kit.disc(glow.inner, 110, 110, 100, { fill: "accent4", shadow: false, flat: true });
    m.pop(glow, tGlow, { overshoot: false });
  },
});
