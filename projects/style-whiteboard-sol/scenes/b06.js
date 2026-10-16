// @design reasoning_drawn_in_speech_order_continued: the guest row is trimmed while the retained decision roles stay legible
/* Treatments: static guest selection with signalling; guests moving into bins; chosen labelled row with crosses and an arrow to the notes, keeping the existing invite. The Before tick completes this board. */
Loom.scene("b06", {
  build(ctx) {
    const {kit,m}=ctx;
    const steps=ctx.held("steps");
    const invite=ctx.held("invite");
    const underline=ctx.held("question_underline");
    m.exit(underline,ctx.start,"recede");
    const c=invite.handle.guestCentre(0);
    // @form owner_signal: the one accent marks the role that owns the decision
    const owner=ctx.el("owner_circle",{x:240+c.x-52,y:220+c.y-54,w:104,h:108,kind:"mark",exit:"recede"});
    kit.sketch(owner.inner,"path",["M52 8 C78 8 96 27 96 54 C96 81 78 100 52 100 C26 100 8 81 8 54 C8 27 26 8 52 8"],{fill:"none",stroke:"accent",sw:5});
    const tOwner=ctx.cue("whoever owns that decision");
    m.draw(owner,tOwner,{dur:ctx.style.dur("draw")*0.5});
    invite.handle.markGuest(0,"Owner",tOwner+ctx.style.dur("draw")*0.3);
    invite.handle.markGuest(1,"Needed input",ctx.cue("can't be made without"));
    const tNotes=ctx.cue("Everyone else gets the notes");
    invite.handle.crossGuest(2,tNotes);
    invite.handle.crossGuest(3,tNotes+ctx.style.dur("stagger"));
    invite.handle.crossGuest(4,tNotes+ctx.style.dur("stagger")*2);
    invite.handle.crossGuest(5,tNotes+ctx.style.dur("stagger")*3);
    invite.handle.envelope(tNotes+ctx.style.dur("draw")*0.25);
    steps.handle.tick(0,ctx.cue("the notes"),{tone:"ink"});
  }
});
