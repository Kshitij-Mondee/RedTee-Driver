// @design line_decides_class: a grey dashed page on a long ink line takes its colour from one spoken word, then slides to an open arc
Loom.scene("b04", {
  build(ctx, props) {
    const m = ctx.m, kit = ctx.kit;
    // Treatments: (1) static page + stamp, (2) page redraws colour then slides to the arc [chosen], (3) arc first, page walks in.
    const t0 = ctx.start + 0.1;
    const tPage = ctx.cue("A published press release");
    const tArc = ctx.cue("anyone may read it");
    const tTick = ctx.cue("approved for release");
    const tPub = ctx.cue("Public");
    const tSlide = ctx.cue("Share it freely");

    const BASE_Y = 720;
    // baseline: long ink line, long enough to hold the notes page (b05) left of the press release
    const B = ctx.el("baseline", { x: 96, y: BASE_Y - 8, w: 1728, h: 16, kind: "scenery", exit: "recede" });
    // @form baseline: one long ink line the items stand on
    const bl = kit.line(B.inner, 0, 8, 1728, 8, { stroke: ctx.c("ink"), sw: 3 });
    m.draw(bl, t0, { dur: 0.8 });

    // open arc near the right edge: a gateway the page comes to rest beside
    const A = ctx.el("open_arc", { x: 1670, y: BASE_Y - 330, w: 200, h: 340, kind: "scenery", exit: "recede" });
    // @form open_arc: an open gateway on the baseline, the way out of the sheet
    const arc = kit.path(A.inner, "M20 330V170A80 80 0 0 1 180 170V330", { stroke: ctx.c("ink"), sw: 3, fill: "none" });
    m.draw(arc, tArc, { dur: 0.7 });

    // press release page, right of centre, standing on the baseline
    const S = 1.5;
    const P = ctx.el("press_release", { x: 960, y: BASE_Y - 540 - 30, w: 480, h: 600, kind: "card", exit: "recede" });
    const item = Loom.lesson.item(ctx, P.inner, { x: 30, y: 30, scale: S, variant: "press_release", cls: "none", tick: false });
    item.drawIn(tPage, 1.0);
    item.setTick(true, tTick, 0.4);
    item.setClass("public", tPub, 0.6);
    // slide right to rest beside the arc, fully in frame
    m.travel(P, tSlide, { x: 220, y: 0, scale: 1 }); // moves 220 px right, rests beside the arc
  }
});
