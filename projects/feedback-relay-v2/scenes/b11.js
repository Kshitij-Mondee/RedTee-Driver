// @design reread_lights_parts: a complete comment is read aloud and each of its three parts lights in turn, then settles
Loom.scene("b11", {
  build(ctx) {
    const { kit } = ctx;
    const W = ctx.el("world", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" });
    const room = Loom.lesson.meeting_room(ctx, W.inner, {});
    room.setState("replay", null);

    const people = ctx.el("people", { x: 0, y: 0, w: 1920, h: 1080, kind: "character", parent: W });
    kit.peep(people.inner, "man", "neutral", { x: 700, y: 780, size: 420, skin: 2, cloth: "cloth" });
    kit.peep(people.inner, "woman", "neutral", { x: 1240, y: 790, size: 400, skin: 3, cloth: "cloth2", flip: true });

    const B = ctx.el("comment_bubble", { x: 260, y: 120, w: 1400, h: 467, kind: "bubble", parent: W });
    const cb = Loom.lesson.comment_bubble(ctx, B.inner, { w: 1400 });
    cb.setState("step_open", null);

    // held placeholder from b10 in the third slot, replaced by the full wording
    const ph = Loom.svg("g", { opacity: 1 }, cb.slots.step.g);
    kit.text(ph, "One small step", { role: "body", x: 46, y: 180, w: 808, h: 56, align: "left", valign: "middle", maxLines: 1, color: "ink" });

    const tB = ctx.cue("You spoke over Priya mid-point");
    const tE = ctx.cue("so she could not finish");
    const tN = ctx.cue("Next time");
    const tS = ctx.cue("let her finish first");
    cb.light("behaviour", tB, { dur: 0.8, settleAt: tE });
    cb.light("effect", tE, { dur: 0.8, settleAt: tN + 1.2 });
    cb.setState("complete", tN);
    Loom.tl.set(ph, { opacity: 0 }, tN);
    Loom.tl.set(cb.slots.behaviour.underline.g, { opacity: 0 }, tN);
    Loom.tl.set(cb.slots.effect.underline.g, { opacity: 0 }, tN);
    Loom.tl.set(cb.slots.step.underline.g, { opacity: 1 }, tS);
    ctx.m.draw(cb.slots.step.underline.line, tS, { dur: 0.8 });
    Loom.cam.frame(W, { x: 160, y: 60, w: 1600, h: 900 }, tS, 2.4);
  },
});
