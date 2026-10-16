// @design suspended_choices: neutral outlines wait above coloured destinations
// Treatments: static row with signalling; serial page arrivals; moving carousel.
// Choose serial arrivals, the unchanged row holds a genuine sorting question.
Loom.scene("b09", {
  build(ctx) {
    const {kit,m} = ctx;
    // @form class_trays: three outlined destinations form the scaffold
    const trays = ctx.el("trays", {x:330,y:680,w:1260,h:196,kind:"instrument",exit:"recede"});
    trays.handle = Loom.lesson.trays(ctx,trays.inner,{x:0,y:0,scale:1});
    trays.handle.drawIn(ctx.cue("Try three"),ctx.style.dur("stagger"),ctx.style.dur("draw"));
    function page(name,variant,index,t) {
      const d = trays.handle.drop[index];
      // @form waiting_page: an unclassified page waits clear of its destination
      const E = ctx.el(name,{x:d.x-140,y:d.restY-360,w:280,h:360,kind:"card",parent:trays.handle.mid,exit:"recede"});
      E.handle = Loom.lesson.item(ctx,E.inner,{x:0,y:0,scale:1,variant:variant,cls:"none"});
      m.drop(E,t,{dur:ctx.style.dur("enter")});
      return E;
    }
    page("job_advert","job_advert",1,ctx.cue("A posted job advert"));
    page("org_chart","org_chart",2,ctx.cue("The org chart"));
    page("payroll","payroll",0,ctx.cue("The payroll file"));
    // @form pause_ring: a quiet circular sweep marks the learner's turn
    const R = ctx.el("pause_ring",{x:924,y:156,w:72,h:72,kind:"instrument",exit:"recede"});
    const ring = kit.path(R.inner,"M36 6A30 30 0 1 1 35.99 6",{fill:"none",stroke:"accent",sw:3});
    ring.setAttribute("pathLength","1");
    Loom.drive(function(e) {
      ring.setAttribute("opacity",e<=0?0:1);
      ring.setAttribute("stroke-dasharray",e+" 2");
    },ctx.speechEnd,ctx.end-ctx.speechEnd,"linear");
  }
});
