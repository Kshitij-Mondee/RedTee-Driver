// @design sequential_readback_marks: one written line gains three spoken signals, then a correction route
/* Treatments: A, static line with sequential signalling, chosen because reading order is the point.
   B, three separate cards, rejected because they break the single decision.
   C, travelling words, rejected because movement would interrupt read-back.
   The station camera join is supplied by the storyboard. */
Loom.scene("b09", {
  build(ctx, props) {
    const {kit, m} = ctx;
    const DRAW = ctx.style.dur("draw");
    const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
    const drawDur = len => DRAW * clamp(len / 900,0.3,1.4);
    const writeDur = str => DRAW * clamp(str.length / 14,0.45,1.8);
    const hand = (g,d,o) => kit.sketch(g,"path",[d],Object.assign({fill:"none",stroke:"ink"},o || {}));
    const tClose = ctx.cue("At the close");
    const tRead = ctx.cue("read each decision back");
    const tWhat = ctx.cue("What");
    const tWho = ctx.cue("who owns it");
    const tWhen = ctx.cue("by when");
    const tCorrect = ctx.cue("correct it in the room");

    // @form progress_checklist: the board's established scaffold
    const steps = ctx.el("steps",{x:1420,y:96,w:380,h:300,kind:"instrument",exit:"recede"});
    const stepHandle = Loom.lesson.step_list(ctx,steps.inner,{name:"steps",current:1,ticked:[true,true,false]});
    stepHandle.appear();
    m.reveal(steps,ctx.start,{dy:0});
    stepHandle.setCurrent(2,tClose);

    // @form facilitator_desk: ground the bust on a single marker stroke
    const desk = ctx.el("desk",{x:120,y:610,w:430,h:24,kind:"scenery",exit:"recede"});
    hand(desk.inner,"M10 12 L420 10");
    m.draw(desk,tRead,{dur:drawDur(410)});
    // @form facilitator_bust: Sam uses the shared cast look
    const sam = Loom.lesson.team_table.person(ctx,"Sam","explaining",{name:"sam",x:156,y:282,size:340});
    m.reveal(sam,tRead,{dy:0});

    // @form readback_line: one decision, written left to right
    const decision = ctx.el("decision",{x:600,y:460,w:1100,h:150,kind:"text",exit:"recede"});
    const line = Loom.lesson.decision_line(ctx,decision.inner,{name:"decision",w:1100});
    line.write(tRead);
    // @form sequential_underlines: the single accent treatment is shared across all three parts
    line.underline(0,tWhat,{tone:"accent"});
    line.label(0,"What",tWhat);
    line.underline(1,tWho,{tone:"accent"});
    line.label(1,"Who",tWho);
    line.underline(2,tWhen,{tone:"accent"});
    line.label(2,"By when",tWhen);

    // @form correction_route: muted arrow points into the written line, away from resting labels
    const arrow = ctx.el("correct_arrow",{x:1110,y:616,w:124,h:116,kind:"connector",exit:"recede"});
    hand(arrow.inner,"M112 104 Q38 96 16 12",{stroke:"muted"});
    hand(arrow.inner,"M10 34 L16 12 L34 26",{stroke:"muted"});
    m.draw(arrow,tCorrect,{dur:drawDur(150)});
    // @form correction_note: a brief chance to amend before leaving
    const noteText = "correct it now";
    const fit = kit.fit(noteText,{role:"label",w:320,h:56,maxLines:1});
    const correct = ctx.el("correct_note",{x:1250,y:696,w:Math.ceil(fit.width)+24,h:56,kind:"label",exit:"wipe"});
    kit.text(correct.inner,noteText,{role:"label",x:12,y:0,w:Math.ceil(fit.width),h:56,maxLines:1,valign:"middle",color:"muted"});
    m.unmask(correct,tCorrect,{dur:writeDur(noteText)});
  }
});
