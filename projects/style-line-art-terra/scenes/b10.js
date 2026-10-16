// @design b10_sorting_hesitation: three document outlines find their coloured trays, with one pause correcting the tempting choice.
Loom.scene("b10", {
  build(ctx, props) {
    // Treatment A: static three-tray comparison with colour changes.
    // Treatment B: items drop into their class trays, while the org chart hesitates above Public. Chosen.
    // Treatment C: a moving scan line sorts each document in turn.
    const tPublic = ctx.cue("Public");
    const tInternal = ctx.cue("internal");
    const tConfidential = ctx.cue("confidential");
    const tHarmless = ctx.cue("looks harmless");
    const tStays = ctx.cue("it stays internal");

    // @form held_sorting_trays: the three destinations continue from the practice setup
    const trayE = ctx.held("trays");
    const trays = trayE.handle;
    // @form held_job_advert: the existing job advert drops into the Public tray
    const jobE = ctx.held("job_advert");
    const job = jobE.handle;
    // @form held_org_chart: the existing org chart hesitates before the Internal tray
    const orgE = ctx.held("org_chart");
    const org = orgE.handle;
    // @form held_payroll: the existing payroll file drops into the Confidential tray
    const payrollE = ctx.held("payroll");
    const payroll = payrollE.handle;

    // The class words cause each held outline to take its lasting class colour.
    ctx.m.travel(jobE, tPublic, { x: -503, y: 130, scale: 1, dur: 0.62 });
    job.setClass("public", tPublic, 0.6);
    trays.highlight(0, true, tPublic, 0.28);
    trays.highlight(0, false, tPublic + 0.78, 0.28);

    // The first internal is deliberately tempting: hover over Public rather than settle.
    ctx.m.travel(orgE, tInternal, { x: -1063, y: 130, scale: 1, dur: 0.42 });
    trays.highlight(0, true, tInternal, 0.25);
    ctx.m.drift(orgE, tHarmless, tStays, { amp: 8, period: 0.72 });

    ctx.m.travel(payrollE, tConfidential, { x: 1063, y: 130, scale: 1, dur: 0.62 });
    payroll.setClass("confidential", tConfidential, 0.6);
    trays.highlight(2, true, tConfidential, 0.28);
    trays.highlight(2, false, tConfidential + 0.78, 0.28);

    // @form internal_settle: the org chart crosses to Internal only when the correction is spoken
    ctx.m.travel(orgE, tStays, { x: -560, y: 130, scale: 1, dur: 0.6 });
    org.setClass("internal", tStays, 0.6);
    trays.highlight(0, false, tStays, 0.2);
    trays.highlight(1, true, tStays + 0.34, 0.24);
    trays.highlight(1, false, tStays + 1.05, 0.24);
    ctx.m.emphasis(orgE, tStays + 0.58);
  }
});
