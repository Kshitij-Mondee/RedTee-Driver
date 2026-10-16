// @design line_to_question: a quiet console opens and one line becomes the focal point
// Treatments: static console with signalling; line boot with typed request; camera push into a request.
// Choose line boot and typing: the arrival itself expresses the question being asked.
Loom.scene("b01", {
  build(ctx) {
    const H = ctx.engine.hud(ctx, {name:"question_hud"});
    const bootAt = ctx.cue("Say Priya");
    const nameAt = ctx.cue("Priya asks");
    const questionAt = ctx.cue("When are expense claims due");
    const x = 510, y = H.vcenter(560);
    // @form projected_chat: the single artefact followed through the film
    const E = ctx.el("chat_panel", {x:x,y:y,w:900,h:560,kind:"panel",exit:"none"});
    E.chatKit = Loom.lesson.chat_panel(ctx,E.inner,{state:"asked",question:"When are expense claims due?"});
    E.handle = E.chatKit;
    const C = E.chatKit;
    // @form named_sender: a semantic held anchor for the existing kit name tag
    const N = ctx.el("name_tag", {x:x+32,y:y+106,w:108,h:48,kind:"text",exit:"none"});
    N.handle = C;
    N.chatKit = C;
    // @form typed_question: a semantic held anchor for the existing kit question line
    const Q = ctx.el("question_line", {x:x+32,y:y+163,w:822,h:55,kind:"text",exit:"none"});
    Q.handle = C;
    Q.chatKit = C;
    // These anchors refer to kit anatomy, never a second drawing of it.
    N.part = C.nameTag;
    Q.part = C.question;
    H.power({E:E},"up",bootAt);
    C.nameTag.attr({opacity:0});
    C.question.attr({opacity:0});
    Loom.tween(C.nameTag.node,{attr:{opacity:0}},{attr:{opacity:1}},nameAt,{dur:ctx.style.dur("enter"),ease:"enter"});
    C.setState("typing",questionAt);
    C.setState("asked",questionAt+ctx.style.dur("move"));
    Loom.tl.set(C.question.node,{attr:{opacity:1}},questionAt+ctx.style.dur("move"));
  }
});
