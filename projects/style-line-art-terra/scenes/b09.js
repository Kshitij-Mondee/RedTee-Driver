// @design sort_pause: three unresolved documents hold above colour-coded destinations
Loom.scene("b09", {
  build(ctx) {
    // Treatment A: static row of documents over trays. Treatment B: documents fall into trays. Treatment C: staggered documents hold unresolved while a pause ring sweeps. Chosen C, the empty destinations and pause invite a decision without revealing one.
    const traysAt = ctx.cue("Try three.");
    const jobAt = ctx.cue("A posted job advert.");
    const orgAt = ctx.cue("The org chart.");
    const payrollAt = ctx.cue("The payroll file.");
    const pauseAt = payrollAt + 1.46;

    // @form trays: three coloured but empty classification destinations
    const trays = ctx.el("trays", { x: 240, y: 680, w: 1440, h: 224, kind: "instrument", exit: "none" });
    const trayArt = Loom.lesson.trays(ctx, trays.inner, { x: 0, y: 0, w: 1440, h: 224 });
    trayArt.drawIn(traysAt, 0.25, 0.8);

    // Explicit unresolved resting positions, left to right: payroll, job advert, org chart.
    // @form payroll: dashed payroll document awaiting classification
    const payroll = ctx.el("payroll", { x: 260, y: 190, w: 280, h: 360, kind: "card", exit: "none" });
    const payrollArt = Loom.lesson.item(ctx, payroll.inner, { x: 0, y: 0, w: 280, h: 360, variant: "payroll", cls: "none", tick: false });
    payrollArt.drawIn(payrollAt, 0.55);
    ctx.m.drop(payroll, payrollAt, { dur: 0.55 });

    // @form job_advert: dashed job advert awaiting classification
    const job_advert = ctx.el("job_advert", { x: 820, y: 190, w: 280, h: 360, kind: "card", exit: "none" });
    const jobArt = Loom.lesson.item(ctx, job_advert.inner, { x: 0, y: 0, w: 280, h: 360, variant: "job_advert", cls: "none", tick: false });
    jobArt.drawIn(jobAt, 0.55);
    ctx.m.drop(job_advert, jobAt, { dur: 0.55 });

    // @form org_chart: dashed organisation chart awaiting classification
    const org_chart = ctx.el("org_chart", { x: 1380, y: 190, w: 280, h: 360, kind: "card", exit: "none" });
    const orgArt = Loom.lesson.item(ctx, org_chart.inner, { x: 0, y: 0, w: 280, h: 360, variant: "org_chart", cls: "none", tick: false });
    orgArt.drawIn(orgAt, 0.55);
    ctx.m.drop(org_chart, orgAt, { dur: 0.55 });

    // @form pause_ring: muted three-part thinking ring during the silent decision pause
    const pause_ring = ctx.el("pause_ring", { x: 900, y: 575, w: 120, h: 80, kind: "icon", exit: "iris" });
    const ring = ctx.kit.path(pause_ring.inner, "M38 40A22 22 0 0 1 62 19M70 24A22 22 0 0 1 79 52M70 61A22 22 0 0 1 43 60", { fill: "none", stroke: ctx.c("muted"), sw: 3 });
    ctx.m.draw(ring, pauseAt, { dur: 2.7 });
    ctx.m.emphasis(pause_ring, pauseAt + 0.5);
  },
});
