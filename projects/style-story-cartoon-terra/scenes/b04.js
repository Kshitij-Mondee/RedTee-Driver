// @design belief_not_proof_card: a desk-side magnifier lands as a wall notice distinguishes honest belief from proof
Loom.scene("b04", {
  build(ctx) {
    const { kit, m } = ctx;
    // Treatments considered: (A) a floating definition card, rejected because the rule belongs on Maya's wall. (B) a close-up of the receipts, rejected because the turn is about her role, not more evidence. (C) chosen: a pinned wall notice and the magnifier settling on the desk.
    const room = ctx.held("room");
    const desk = ctx.held("desk");
    const receipts = ctx.held("receipts");
    const phone = ctx.held("phone");
    const laptop = ctx.held("laptop");
    const maya = ctx.held("maya");
    // The b03 thought bubbles are not held here. Their owner recedes them at its join.

    // @form desk_magnifier: the investigation tool settles by the duplicate receipts
    const glassKit = Loom.lesson.desk_set(ctx, ctx.station.svg, {
      framing: "medium", only: ["magnifier"], magnifier: false
    });
    const magnifier = glassKit.magnifier;
    glassKit.setState("magnifier_lying", ctx.cue("Investigating isn't"));
    m.drop(magnifier, ctx.cue("Investigating isn't"));

    // @form pinned_rule_card: a paper notice belongs to the free wall, not a floating panel
    const ruleCard = ctx.el("rule_card", { x: 92, y: 138, w: 396, h: 316, kind: "card", exit: "recede" });
    kit.card(ruleCard.inner, 0, 0, 396, 316, { fill: "surface", r: 10 });
    kit.disc(ruleCard.inner, 198, 22, 11, { fill: "muted" });
    kit.line(ruleCard.inner, 34, 106, 362, 106, { stroke: "muted", sw: 3 });
    kit.text(ruleCard.inner, "Good faith means", { role: "body", x: 30, y: 48, w: 336, h: 46, maxLines: 1, align: "center", valign: "middle", color: "ink" });

    // @form belief_words: the named standard stamps in as the notice settles
    const beliefWords = ctx.el("belief_words", { x: 30, y: 120, w: 336, h: 76, kind: "text", parent: ruleCard.inner, exit: "recede" });
    kit.text(beliefWords.inner, "Honest belief", { role: "lead", x: 0, y: 0, w: 336, h: 76, maxLines: 1, align: "center", valign: "middle", color: "accent" });

    // @form proof_word: proof is a lower standard, visibly crossed out
    const proofWord = ctx.el("proof_word", { x: 30, y: 210, w: 336, h: 62, kind: "text", parent: ruleCard.inner, exit: "recede" });
    kit.text(proofWord.inner, "not proof", { role: "lead", x: 0, y: 0, w: 336, h: 56, maxLines: 1, align: "center", valign: "middle", color: "ink" });
    const strike = kit.line(proofWord.inner, 88, 30, 248, 30, { stroke: "ink", sw: 5 });

    m.drop(ruleCard, ctx.cue("you don't need proof"));
    m.draw(strike, ctx.cue("you don't need proof"));
    m.stamp(beliefWords, ctx.cue("honest belief"));
    Loom.tween(proofWord.life, { opacity: 1 }, { opacity: 0.3 }, ctx.cue("your job"), { dur: ctx.style.dur("move") });
    m.exit(ruleCard, ctx.speechEnd + 0.04, "recede");
  },
});
