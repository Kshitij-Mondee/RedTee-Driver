// @design direction_then_limit: an arrow reads the order across the bars, then one plain line says what it does not mean
/* b16 - Their accounts, so read the direction. Nothing here is unbreakable, but any second factor beats none.
 * Treatments considered: (A) a caveat card (rejected: a slide over the bars); (B) CHOSEN: the bars hold; an arrow
 * draws across their tops (the direction); one line settles under them. A static composition with signalling.
 */
Loom.scene("b16", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style, svg = Loom.svg;
    const H = {};
    for (const n of ["google_bg", "google_title", "bars_g", "bar_name_0", "bar_name_1", "bar_name_2", "bar_val_0", "bar_val_1", "bar_val_2"]) H[n] = ctx.held(n);
    const tDir = ctx.cue("read the direction");
    const tAny = ctx.cue("any second factor beats none");
    const ar = ctx.el("direction_arrow", { x: 0, y: 0, w: 1, h: 1, kind: "connector", exit: "recede" });
    const BASE = 760, TOP = 330;
    const y = (v) => BASE - (BASE - TOP) * v - 100;
    const p = kit.path(ar.inner, `M530 ${y(0.76)} Q 960 ${y(0.9) - 30} 1390 ${y(1.0) - 10}`, { stroke: "accent2", sw: 5 });
    m.draw(p, tDir + 0.05, { dur: 0.9 });
    const hd = kit.path(ar.inner, `M1366 ${y(1.0) - 26} L1392 ${y(1.0) - 10} L1370 ${y(1.0) + 12}`, { stroke: "accent2", sw: 5 });
    m.draw(hd, tDir + 0.9, { dur: 0.25 });
    const ln = ctx.el("any_line", { x: 300, y: 840, w: 1320, h: 70, kind: "label", exit: "recede" });
    svg("rect", { x: 0, y: 0, width: 1320, height: 70, rx: 35, fill: S.c("surface"), stroke: S.c("accent"), "stroke-width": 3 }, ln.inner);
    kit.text(ln.inner, "Any second factor beats none", { role: "lead", size: 40, x: 0, y: 0, w: 1320, h: 70, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "ink" });
    m.reveal(ln, tAny + 0.05, { dy: 10 });
    void H;
  },
});
