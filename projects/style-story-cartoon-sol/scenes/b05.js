// @design sequential_paper_questions: a desk page lands before three measured lines appear in spoken order
/* Treatments: A static page with sequential signals; B floating question cards; C chosen, a physical desk pad whose lines unmask as the colleague weighs each question. */
Loom.scene("b05", {
  build(ctx) {
    const {m} = ctx;
    const room = ctx.held("room");
    const desk = ctx.held("desk");
    const receipts = ctx.held("receipts");
    const phone = ctx.held("phone");
    const laptop = ctx.held("laptop");
    const maya = ctx.held("maya");
    const magnifier = ctx.held("magnifier");
    const landing = ctx.cue("three questions");
    const first = ctx.cue("break a rule");
    const second = ctx.cue("harm someone");
    const third = ctx.cue("fine in public");
    // @form quiet_duplicate: the existing ring child yields emphasis without taking a missing held name
    const ringInk = receipts.inner.querySelector('path[stroke="' + ctx.c("accent") + '"]');
    if(ringInk) Loom.tween(ringInk,{opacity:1},{opacity:0.5},ctx.start,{dur:ctx.style.dur("move"),ease:"move"});
    // @form question_notepad: fixed kit children ride their shared physical page
    const padCtx = Object.create(ctx);
    padCtx.el = (name,opts) => {
      if(name === "pad") return ctx.el("pad",opts);
      if(name === "pad_heading") return ctx.el("pad_heading",opts);
      if(name === "pad_line1") return ctx.el("pad_line1",opts);
      if(name === "pad_line2") return ctx.el("pad_line2",opts);
      if(name === "pad_line3") return ctx.el("pad_line3",opts);
      return ctx.el(name,opts);
    };
    const page = Loom.lesson.question_pad(padCtx,ctx.g,{x:1075,y:540,only:["pad"]});
    m.drop(page.pad,landing);
    m.unmask(page.lines[0],first,{dir:"ltr"});
    m.unmask(page.lines[1],second,{dir:"ltr"});
    m.unmask(page.lines[2],third,{dir:"ltr"});
    page.pad.followers = [page.heading,...page.lines];
    if(maya && maya.handle) {
      maya.handle.emotion("focus",landing);
      maya.handle.gesture("tilt",first,first + ctx.style.dur("move"));
      maya.handle.gesture("tilt",second,second + ctx.style.dur("move"));
      maya.handle.gesture("tilt",third,third + ctx.style.dur("move"));
    }
  }
});
