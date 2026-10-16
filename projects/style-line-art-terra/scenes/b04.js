// @design class_line: a page outline changes from dashed grey to blue, then travels to an open sharing arc
// Treatments considered: a static approved page with colour signalling; a moving page beside an open arc; a page passed through a literal door. Chosen: moving page beside an open arc, because the colour decision and free sharing both read without extra words.
Loom.scene("b04", {
  build(ctx) {
    const tPage = ctx.cue("A published press release?");
    const tApproved = ctx.cue("approved for release");
    const tPublic = ctx.cue("Public");
    const tShare = ctx.cue("Share it freely");

    // @form baseline: long ink shelf line that grounds the documents
    const baseline = ctx.el("baseline", { x: 96, y: 730, w: 1728, h: 12, kind: "connector", exit: "none" });
    const shelfLine = ctx.kit.line(baseline.inner, 0, 0, 1728, 0, { stroke: "ink", sw: 3 });
    ctx.m.draw(shelfLine, tPage, { dur: 0.8 });

    // @form press_release: published document whose outline carries its class
    const pressRelease = ctx.el("press_release", { x: 1060, y: 406, w: 252, h: 324, kind: "instrument", exit: "none" });
    const page = Loom.lesson.item(ctx, pressRelease.inner, { x: 0, y: 0, scale: 0.9, variant: "press_release", cls: "none", tick: false });
    page.drawIn(tPage + 0.12, 1.0);
    page.setTick(true, tApproved, 0.4);
    page.setClass("public", tPublic, 0.6);

    // @form open_arc: an open line arc at the frame edge, the page's sharing destination
    const openArc = ctx.el("open_arc", { x: 1662, y: 468, w: 116, h: 210, kind: "scenery", exit: "recede" });
    const arc = ctx.kit.path(openArc.inner, "M18 18C112 46 112 164 18 192", { stroke: "accent", sw: 3, fill: "none" });
    ctx.m.draw(arc, tShare, { dur: 0.6 });
    ctx.m.travel(pressRelease, tShare, { x: 302, y: 0, scale: 1, dur: 0.8 });
  },
});
