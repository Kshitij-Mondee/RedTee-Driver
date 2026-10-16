// @design paired_claims: a second equally bright card contradicts the first under one shared question
// Treatments: static pair with a signalled rim; sequential cards in shared wells; a branching connector.
// Choose sequential cards: the second arrival creates the contradiction without a verdict.
Loom.scene("b02", {
  build(ctx) {
    const H = ctx.engine.hud(ctx, {name:"b02_hud"});
    const chat = ctx.held("chat_panel");
    const name = ctx.held("name_tag");
    const question = ctx.held("question_line");
    const panel = chat.chatKit;
    const t30 = ctx.cue("Thirty days");
    const resend = ctx.cue("asks again");
    const t60 = ctx.cue("Sixty days");
    const hold = ctx.cue("completely sure");
    panel.setState("two_replies", t30);
    // @form reply_30: the first assured answer in the shared question's first well
    const first = ctx.el("reply_30", {x:50,y:266,w:360,h:150,kind:"card",exit:"none",parent:panel.g});
    first.handle = Loom.lesson.reply_card(ctx, first.inner, {text:"30 days",state:"plain"});
    ctx.m.reveal(first,t30,{dur:ctx.style.dur("enter")});
    ctx.m.draw(first.handle.frame.brackets,t30,{dur:ctx.style.dur("draw")});
    ctx.m.typewriter(first.handle.text,t30,{dur:ctx.style.dur("move")});
    H.flash({E:question},resend);
    // @form reply_60: the equally bright second answer, not a correction or a verdict
    const second = ctx.el("reply_60", {x:490,y:266,w:360,h:150,kind:"card",exit:"none",parent:panel.g});
    second.handle = Loom.lesson.reply_card(ctx, second.inner, {text:"60 days",state:"plain"});
    ctx.m.reveal(second,t60,{dur:ctx.style.dur("enter")});
    ctx.m.draw(second.handle.frame.brackets,t60,{dur:ctx.style.dur("draw")});
    ctx.m.typewriter(second.handle.text,t60,{dur:ctx.style.dur("move")});
    first.handle.setState("plain",hold);
    second.handle.setState("plain",hold);
  }
});
