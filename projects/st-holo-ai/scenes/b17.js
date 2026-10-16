// @design steady_light_fracture: a confident surface reveals a hidden fault before its name appears
// Treatments: static paired plates with a shared verdict label; cracks drawing under unchanged light; a camera approach through one fracture.
// Choose cracks drawing under unchanged light: the change names the distinction without choosing a winning claim.
Loom.scene("b17", {
  build(ctx) {
    const H = ctx.engine.hud(ctx, { name: "verdict_term_hud" });
    const crackAt = ctx.cue("not checked text");
    const completeAt = ctx.cue("has a name");
    const termAt = ctx.cue("A hallucination");

    // @form paired_fractures: both assertions retain the same steady rim while a fault draws through each
    const reply30 = ctx.held("reply_30");
    const reply60 = ctx.held("reply_60");
    const policy = ctx.held("policy");
    reply30.handle.setState("cracked", crackAt);
    reply60.handle.setState("cracked", crackAt);
    ctx.m.draw(reply30.handle.crackPath, crackAt, { dur: completeAt - crackAt });
    ctx.m.draw(reply60.handle.crackPath, crackAt, { dur: completeAt - crackAt });
    reply30.exit = "recede";
    reply60.exit = "recede";
    policy.exit = "recede";

    // @form named_fault: the term arrives only after the visual fault has completed
    const termFit = ctx.kit.fit("hallucination", { role: "title", w: 840, h: 96, maxLines: 1 });
    const term = H.frame("term", { x: 200, y: 660, w: 920, h: 144, tone: "accent", plate: true, at: termAt });
    const word = ctx.kit.text(term.E.inner, "hallucination", { x: 40, y: 24, w: 840, h: 96, role: "title", size: termFit.size, color: "accent", maxLines: 1 });
    ctx.m.typewriter(word, termAt, { dur: ctx.style.dur("enter") });
  }
});
