// @design unlinked_verdict: equal claims stand apart from their absent source
// Treatments: static paired claims with a distant sheet and empty sockets; a camera pull revealing the missing source; competing paths stopping short of the sheet.
// Choose the static composition with signalling: distance and identical light make the missing relationship visible without suggesting a link.
Loom.scene("b16", {
  build(ctx) {
    const H = ctx.engine.hud(ctx, { name: "verdict_hud" });
    const cardsAt = ctx.cue("which is true");
    const policyAt = ctx.cue("never saw her policy");
    const blockY = H.vcenter(400);

    // @form equal_claim_left: the first assertion has no source connection
    const reply30 = ctx.el("reply_30", { x: 200, y: blockY + 125, w: 420, h: 175, kind: "card", exit: "recede" });
    reply30.handle = Loom.lesson.reply_card(ctx, reply30.inner, { w: 420, h: 175, text: "30 days", state: "unlinked" });
    reply30.replyKit = reply30.handle;
    ctx.m.assemble(reply30, cardsAt, { dur: ctx.style.dur("enter") });

    // @form equal_claim_right: the conflicting assertion has exactly the same light and scale
    const reply60 = ctx.el("reply_60", { x: 700, y: blockY + 125, w: 420, h: 175, kind: "card", exit: "recede" });
    reply60.handle = Loom.lesson.reply_card(ctx, reply60.inner, { w: 420, h: 175, text: "60 days", state: "unlinked" });
    reply60.replyKit = reply60.handle;
    ctx.m.assemble(reply60, cardsAt, { dur: ctx.style.dur("enter") });

    // @form distant_source: a dim sheet is physically separated from both claims, with no connecting mark
    const policy = ctx.el("policy", { x: 1480, y: blockY, w: 300, h: 400, kind: "card", exit: "recede" });
    policy.handle = Loom.lesson.policy_doc(ctx, policy.inner, { w: 300, h: 400, state: "outside_dim" });
    policy.policyKit = policy.handle;
    ctx.m.reveal(policy, policyAt, { dur: ctx.style.dur("enter") });
  }
});
