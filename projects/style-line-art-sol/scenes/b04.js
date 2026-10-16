// @design outline_permission: a dashed outline becomes continuous, then travels without losing its identity
// Treatments considered: static page with approval signalling; page crossing a doorway; line redraw followed by a calm rightward slide. Chosen: redraw and slide, because classification travels with the object.
Loom.scene("b04", {
  build(ctx) {
    const kit = ctx.kit;
    const m = ctx.m;
    const drawDur = ctx.style.dur("draw");
    const moveDur = ctx.style.dur("move");
    const arrival = ctx.cue("A published press release");
    const approval = ctx.cue("approved for release");
    const classify = ctx.cue("Public");
    const share = ctx.cue("Share it freely");

    // @form shelf_baseline: the shared sheet's resting edge
    const baseline = ctx.el("baseline", {x:120, y:758, w:1680, h:4, kind:"scenery", exit:"none"});
    const edge = kit.line(baseline.inner, 0, 2, 1680, 2, {stroke:"ink", sw:3});
    m.draw(edge, arrival, {dur:drawDur * 0.8});

    // @form approved_document: the kit page carries approval and its own class
    // Final held geometry: element (1380,418), page (1384,436), scale 0.9, bottom 760.
    // Tick extends above and right of the page, included in this element's box.
    const page = ctx.el("press_release", {x:1050, y:418, w:274, h:344, kind:"card", exit:"none"});
    const handle = Loom.lesson.item(ctx, page.inner, {x:4, y:18, scale:0.9, variant:"press_release", cls:"none", tick:false});
    page.handle = handle;
    handle.drawIn(arrival, drawDur);
    handle.setTick(true, approval, drawDur * 0.4);
    handle.setClass("public", classify, drawDur * 0.6);

    // @form open_boundary: a gap rather than a closed barrier at the sharing edge
    const arc = ctx.el("open_arc", {x:1696, y:396, w:108, h:368, kind:"scenery", exit:"recede"});
    const open = kit.path(arc.inner, "M4 4C100 4 104 98 104 184C104 270 100 364 4 364", {stroke:"ink", sw:3, fill:"none"});
    m.draw(open, arrival, {dur:drawDur});
    m.travel(page, share, {x:330, y:0, scale:1, dur:moveDur * 2});
  }
});
