// @design inward_question: one line leaves its enclosing frame and becomes the subject of a deeper space
// Treatments: static line with a signalled baseline; push through a held panel; a panel collapsing into a line.
// Choose the push through: entering the nested station is the visual argument, with a calm held baseline after it.
Loom.scene("b03", {
  build(ctx) {
    const H = ctx.engine.hud(ctx, {name:"inside_hud",balance:false});
    const questionAt = ctx.cue("which is right");
    const insideAt = ctx.cue("inside the model");
    // The nested-station join is owned by the world camera. Cross-station held calls
    // are unsupported; the outgoing reply lifetime defect is reported to storyboard.
    // @form dark_model_space: a softly lifted field behind the single question
    const stage = H.stage("stage", {focus:[960,500],dark:0.18,lift:0.12,vignette:0.25,at:ctx.start});
    stage.E.exit = "none";
    ctx.m.reveal(stage.E,ctx.start,{dur:ctx.style.dur("enter")});
    // @form floating_question: the unchanged question on one readable baseline
    const Q = ctx.el("question_float",{x:280,y:436,w:1360,h:144,kind:"text",exit:"none"});
    const fit = ctx.kit.fit("When are expense claims due?",{role:"title",w:1280,h:104,maxLines:1,weight:700});
    ctx.kit.rect(Q.inner,0,0,1360,144,{fill:"field2"});
    Q.text = ctx.kit.text(Q.inner,"When are expense claims due?",{x:40,y:20,w:1280,h:104,role:"title",size:fit.size,maxLines:1,color:"accent",weight:700});
    ctx.kit.line(Q.inner,40,126,1320,126,{stroke:"line",sw:1});
    ctx.m.reveal(Q,questionAt,{dur:ctx.style.dur("enter")});
    // The world zoom supplies the travel; keep this baseline in station coordinates.
    ctx.m.emphasis(Q,insideAt);
  }
});
