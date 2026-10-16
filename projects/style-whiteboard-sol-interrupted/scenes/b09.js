// @design three_fields_read_back: one written line accumulates three matched signals, then a correction points back to it
// Treatments considered: static composition with signalling; three separate cards; chosen continuous marker line with timed underlines, preserving one reading path.
Loom.scene("b09", {
  build(ctx) {
    const {kit, m} = ctx;
    const DRAW = ctx.style.dur("draw");
    const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
    const drawDur = len => DRAW * clamp(len/900,0.3,1.4);
    const writeDur = str => DRAW * clamp(str.length/14,0.45,1.8);
    const hand = (g,d,o) => kit.sketch(g,"path",[d],Object.assign({fill:"none",stroke:"ink"},o || {}));
    const tClose = ctx.cue("At the close");
    const tRead = ctx.cue("read each decision back");
    const tWhat = ctx.cue("What");
    const tWho = ctx.cue("who owns it");
    const tWhen = ctx.cue("by when");
    const tCorrect = ctx.cue("correct it in the room");

    // @form corner_checklist: completed stages remain visible while the final stage becomes current
    const steps = ctx.el("steps",{x:1420,y:96,w:380,h:300,kind:"instrument",exit:"recede"});
    steps.handle = Loom.lesson.step_list(ctx,steps.inner,{name:"steps",current:1,ticked:[true,true,false]});
    steps.handle.appear();
    steps.handle.setCurrent(2,tClose);

    // @form presenter_at_line: a consistent cast bust sits on one marker stroke
    const desk = ctx.el("desk",{x:110,y:670,w:420,h:20,kind:"scenery",exit:"recede"});
    hand(desk.inner,"M10 10 L410 8");
    m.draw(desk,tRead - ctx.style.dur("move"),{dur:drawDur(400)});
    const sam = Loom.lesson.team_table.person(ctx,"Sam","explaining",{x:140,y:340,size:340,name:"sam"});
    m.reveal(sam,tRead,{dy:0});

    // @form continuous_written_statement: each field stays on the same baseline and receives its own read-back signal
    const decision = ctx.el("decision",{x:620,y:480,w:1100,h:150,kind:"text",exit:"recede"});
    decision.handle = Loom.lesson.decision_line(ctx,decision.inner,{name:"decision",w:1100});
    decision.handle.write(tRead);
    decision.handle.underline(0,tWhat,{tone:"accent"});
    decision.handle.label(0,"What",tWhat);
    decision.handle.underline(1,tWho,{tone:"accent"});
    decision.handle.label(1,"Who",tWho);
    decision.handle.underline(2,tWhen,{tone:"accent"});
    decision.handle.label(2,"By when",tWhen);

    // @form correction_return: a muted note leads into the existing written statement, not into a new branch
    const text = "correct it now";
    const fit = kit.fit(text,{role:"label",w:280,h:60,maxLines:1});
    const note = ctx.el("correct_note",{x:870,y:337,w:Math.ceil(fit.width)+24,h:60,kind:"label",exit:"wipe"});
    kit.text(note.inner,text,{role:"label",x:12,y:6,w:Math.ceil(fit.width),h:48,maxLines:1,valign:"middle",color:"muted"});
    m.unmask(note,tCorrect,{dir:"ltr",dur:writeDur(text)});
    const arrow = ctx.el("correct_arrow",{x:1098,y:382,w:126,h:96,kind:"connector",exit:"recede"});
    hand(arrow.inner,"M12 12 Q100 18 110 76",{stroke:"muted"});
    hand(arrow.inner,"M96 60 L110 76 L116 55",{stroke:"muted"});
    m.draw(arrow,tCorrect,{dur:drawDur(170)});
  }
});
