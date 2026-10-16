// @design set_down_and_keep_belief: a tool is laid aside while the useful words remain on a pinned note
/* Treatments: A, static pinned note with signalling; B, a floating contrast panel; C, chosen, a pinned note and a tool lowered to the shared desk. The lowering makes the refutation visible. */
Loom.scene("b04", {
  build(ctx) {
    const {kit, m} = ctx;
    const room = ctx.held("room");
    const desk = ctx.held("desk");
    const receipts = ctx.held("receipts");
    const phone = ctx.held("phone");
    const laptop = ctx.held("laptop");
    const maya = ctx.held("maya");
    const proofCue = ctx.cue("you don't need proof");
    const beliefCue = ctx.cue("honest belief");
    const lowerCue = ctx.cue("Investigating isn't");
    const releaseCue = ctx.cue("your job");

    // @form pinned_rule_note: the rule is a physical notice on the free left wall
    const card = Loom.treat.panel(ctx, "rule_card", {x:100, y:150, w:390, h:310, fill:"surface", tone:"ink"});
    kit.disc(card.inner, 195, 18, 8, {fill:"muted", flat:true});
    m.drop(card, proofCue);
    // @form belief_stamp: the positive words carry the single teaching accent
    const belief = ctx.el("belief_words", {x:30, y:48, w:330, h:150, kind:"text", parent:card.inner, exit:"recede"});
    const bf = kit.fit("Honest belief", {role:"title", w:330, h:150, maxLines:2, weight:400});
    kit.text(belief.inner, "Honest belief", {role:"title", size:bf.size, x:0, y:0, w:330, h:150, maxLines:2, align:"center", valign:"middle", color:"accent", weight:400});
    m.stamp(belief, beliefCue);
    // @form rejected_requirement: the unnecessary word is struck before it dims
    const proof = ctx.el("proof_word", {x:40, y:214, w:310, h:64, kind:"text", parent:card.inner, exit:"recede"});
    const pf = kit.fit("not proof", {role:"lead", w:310, h:64, maxLines:1});
    const proofContent = Loom.svg("g", {}, proof.inner);
    kit.text(proofContent, "not proof", {role:"lead", size:pf.size, x:0, y:0, w:310, h:64, maxLines:1, align:"center", valign:"middle", color:"ink"});
    const strike = kit.line(proofContent, 128, 34, 262, 34, {stroke:"ink", sw:4});
    m.draw(strike, proofCue);
    Loom.drive((e) => { proofContent.setAttribute("opacity", 1 - 0.7 * e); }, releaseCue, ctx.style.dur("move"), "move");

    // @form laid_aside_tool: only the missing prop is added to the held set
    const glass = Loom.lesson.desk_set(ctx, ctx.g, {framing:"medium", only:["magnifier"]});
    const magnifier = glass.magnifier;
    Loom.drive((e) => {
      magnifier.inner.firstChild.setAttribute("transform", "translate(" + (650 * (1-e)) + " " + (-110 * (1-e)) + ")");
    }, lowerCue, ctx.style.dur("move"), "move");
    if (maya && maya.handle) {
      maya.handle.pose("present", ctx.start);
      maya.handle.pose("idle", lowerCue);
      maya.handle.emotion("smile", beliefCue);
    }
    card.followers = [belief, proof];
    m.exit(card, ctx.speechEnd, "recede");
  }
});
