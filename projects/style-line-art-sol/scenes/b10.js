// @design suspended_choices_continued: uncertain destination resolves without replacing the object
// Treatments: static destination signals; direct parallel drops; one hovering exception.
// Choose one hovering exception, the wrong destination visibly resolves to the right one.
Loom.scene("b10", {
  build(ctx) {
    const {m} = ctx;
    const trays = ctx.held("trays");
    const job = ctx.held("job_advert");
    const org = ctx.held("org_chart");
    const payroll = ctx.held("payroll");
    const publicT = ctx.cue("Public");
    const internalT = ctx.cue("internal");
    const confidentialT = ctx.cue("confidential");
    const resolveT = ctx.cue("it stays internal");
    const drops = trays.handle.drop;
    const enter = ctx.style.dur("enter");
    const move = ctx.style.dur("move");
    // Clear the Public shelf first, using a lower lane beneath the waiting pages.
    m.travel(payroll,publicT,{x:0,y:384,scale:1,dur:enter});
    m.travel(payroll,publicT+enter,{x:880,y:384,scale:1,dur:move});
    const jobT = publicT+enter+move;
    job.handle.setState("public",publicT);
    m.travel(job,jobT,{x:-440,y:136,scale:1,dur:enter});
    // Lift in the original column, then cross above the settled advert.
    m.travel(org,internalT,{x:0,y:-196,scale:0.9,dur:move});
    m.travel(org,Math.max(internalT+move,jobT+enter),{x:-866,y:-196,scale:0.9,dur:move});
    payroll.handle.setState("confidential",confidentialT);
    m.travel(payroll,confidentialT,{x:880,y:136,scale:1,dur:enter});
    org.handle.setState("internal",resolveT);
    // Clear the advert horizontally before lowering into Internal.
    m.travel(org,resolveT,{x:-440,y:-196,scale:0.9,dur:move});
    m.travel(org,resolveT+move,{x:-440,y:136,scale:1,dur:enter});
  }
});
