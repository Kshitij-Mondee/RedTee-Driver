// @design reasoning_drawn_in_speech_order_continued: a correction remains visible while a useful question is written beneath
/* Treatments: static question with signalling; replacement card; chosen strike and rewrite on the existing card, so the correction itself is the move. Card and checklist continue unchanged in position. */
Loom.scene("b05", {
  build(ctx) {
    const {kit,m}=ctx;
    const steps=ctx.held("steps");
    const invite=ctx.held("invite");
    const circle=ctx.held("subject_circle");
    const note=ctx.held("subject_note");
    m.exit(circle,ctx.start,"recede");
    m.exit(note,ctx.start,"wipe");
    invite.handle.strike(ctx.cue("Write the decision as a question"));
    invite.handle.rewrite("May or June?",ctx.cue("Write the decision as a question"));
    const b=invite.handle.rewriteBox;
    // @form question_signal: the one marker emphasis sits under the rewritten question
    const underline=ctx.el("question_underline",{x:240+b.x-6,y:220+b.y+b.h-16,w:b.w+30,h:30,kind:"mark",exit:"recede"});
    kit.sketch(underline.inner,"path",[`M8 16 C${b.w*0.3} 10 ${b.w*0.66} 20 ${b.w+16} 12`],{fill:"none",stroke:"accent",sw:5});
    m.draw(underline,ctx.cue("Write the decision as a question")+ctx.style.dur("draw")*0.85,{dur:ctx.style.dur("draw")*0.5});
    invite.handle.guests(ctx.cue("people come ready to answer"));
  }
});
