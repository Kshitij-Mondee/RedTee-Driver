// @design marks_resolve_the_choice: three marks settle beside the completed page while the circled evidence regains strength
/* Treatments: A static page with a verdict signal; B a floating verdict card; C chosen, ticks on the same desk page and a firm nod connect judgement to the evidence. */
Loom.scene("b06", {
  build(ctx) {
    const {m} = ctx;
    const room = ctx.held("room");
    const desk = ctx.held("desk");
    const receipts = ctx.held("receipts");
    const phone = ctx.held("phone");
    const laptop = ctx.held("laptop");
    const maya = ctx.held("maya");
    const magnifier = ctx.held("magnifier");
    const pad = ctx.held("pad");
    const pad_heading = ctx.held("pad_heading");
    const pad_line1 = ctx.held("pad_line1");
    const pad_line2 = ctx.held("pad_line2");
    const pad_line3 = ctx.held("pad_line3");
    const evidence = ctx.cue("A dinner claimed twice");
    const decision = ctx.cue("enough to raise it");
    // @form restored_evidence: the original ring returns to full strength without replacing its shared drawing
    const ringInk = receipts.inner.querySelector('path[stroke="' + ctx.c("accent") + '"]');
    if(ringInk) Loom.tween(ringInk,{opacity:0.5},{opacity:1},evidence,{dur:ctx.style.dur("draw"),ease:"linear"});
    Loom.drive((e) => {
      pad_heading.inner.querySelectorAll("text").forEach(t => t.setAttribute("fill",e < 0.5 ? ctx.c("accent") : ctx.c("ink")));
    },evidence,ctx.style.dur("move"),"move");
    // @form page_verdict_marks: the kit adds only the missing ticks, never another page
    const ticksCtx = Object.create(ctx);
    ticksCtx.el = (name,opts) => {
      if(name === "pad_ticks") return ctx.el("pad_ticks",opts);
      if(name === "pad_tick1") return ctx.el("pad_tick1",opts);
      if(name === "pad_tick2") return ctx.el("pad_tick2",opts);
      if(name === "pad_tick3") return ctx.el("pad_tick3",opts);
      return ctx.el(name,opts);
    };
    const marks = Loom.lesson.question_pad(ticksCtx,ctx.g,{x:1075,y:540,only:["ticks"]});
    marks.setState("line1_ticked",decision);
    marks.setState("line2_ticked",decision + ctx.style.dur("stagger"));
    marks.setState("line3_ticked",decision + 2*ctx.style.dur("stagger"));
    m.pop(marks.ticks[0],decision);
    m.pop(marks.ticks[1],decision + ctx.style.dur("stagger"));
    m.pop(marks.ticks[2],decision + 2*ctx.style.dur("stagger"));
    marks.padTicks.followers = marks.ticks;
    if(maya && maya.handle) {
      maya.handle.emotion("focus",evidence);
      maya.handle.gesture("nod",ctx.cue("raise it"),ctx.speechEnd);
      maya.handle.emotion("smile",ctx.cue("raise it"));
    }
  }
});
