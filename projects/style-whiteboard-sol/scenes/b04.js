// @design reasoning_drawn_in_speech_order: a weak line circled inside an accumulating board
/* Treatments: static card with signalling; separate topic and question cards; chosen accumulating invite with a marker correction across the next beats. Motion locates the weak line as spoken. Join keeps the same card and checklist. */
Loom.scene("b04", {
  build(ctx) {
    const {kit,m}=ctx;
    // @form corner_checklist: three moves remain visible as a reference
    const steps=ctx.el("steps",{x:1420,y:96,w:380,h:300,kind:"instrument",exit:"recede"});
    steps.handle=Loom.lesson.step_list(ctx,steps.inner,{name:"steps",current:0,ticked:[false,false,false]});
    steps.handle.draw(ctx.cue("Before"));
    // @form invite_artefact: the meeting's existing subject line
    const invite=ctx.el("invite",{x:240,y:220,w:1160,h:600,kind:"card",exit:"recede"});
    invite.handle=Loom.lesson.invite_card(ctx,invite.inner,{name:"invite"});
    invite.handle.draw(ctx.cue("Sam's invite says"));
    invite.handle.setTitle("Pilot update",ctx.cue("Pilot update"));
    const b=invite.handle.titleBox;
    // @form subject_signal: one marker loop distinguishes subject from decision
    const circle=ctx.el("subject_circle",{x:240+b.x-20,y:220+b.y-8,w:b.w+40,h:86,kind:"mark",exit:"recede"});
    const rx=(b.w+24)/2, cx=(b.w+40)/2;
    const loop=`M${cx} 8 C${cx+rx*0.56} 8 ${cx+rx} 24 ${cx+rx} 43 C${cx+rx} 63 ${cx+rx*0.56} 78 ${cx} 78 C${cx-rx*0.56} 78 ${cx-rx} 63 ${cx-rx} 43 C${cx-rx} 24 ${cx-rx*0.56} 8 ${cx} 8`;
    kit.sketch(circle.inner,"path",[loop],{fill:"none",stroke:"accent",sw:5});
    m.draw(circle,ctx.cue("That's a subject"),{dur:ctx.style.dur("draw")*0.6});
    // @form subject_annotation: the diagnosis sits beside the existing words
    kit.fit("a subject",{role:"label",w:220,h:58,maxLines:1});
    const note=ctx.el("subject_note",{x:240+b.x+b.w+48,y:220+b.y+6,w:220,h:58,kind:"label",exit:"wipe"});
    kit.text(note.inner,"a subject",{role:"label",x:8,y:0,w:204,h:58,maxLines:1,valign:"middle",color:"muted"});
    m.unmask(note,ctx.cue("not a decision"),{dur:ctx.style.dur("draw")*0.5});
  }
});
