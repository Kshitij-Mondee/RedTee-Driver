// @design lone_point_on_planet: a single glowing point on a dark planet, the camera easing back to show how small it is
// Treatments considered: (1) static planet with a pulsing point and a caption-free field; (2) planet that rises from below the frame; (3) chosen: planet settles, point glows once, slow pull back as the question lands.
Loom.scene("b02", {
  build(ctx) {
    const { kit, m } = ctx;
    const tPoint = ctx.cue("where it is");
    const tAsk = ctx.cue("So how does it know");
    const tSettle = ctx.cue("Your phone hasn't told anyone");

    // stars: two twinkling layers, parallax on the pull back
    const SK = ctx.el("stars", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    const rnd = Loom.rng("b02stars");
    const layers = [0, 1].map(() => kit.rect ? null : null);
    const sg = [0, 1].map((i) => {
      const gg = Loom.svg("g", {}, SK.inner);
      for (let k = 0; k < 34; k++) {
        const x = 30 + rnd() * 1860, y = 30 + rnd() * 900;
        Loom.svg("circle", { cx: x.toFixed(1), cy: y.toFixed(1), r: (i ? 2.6 : 1.7) + rnd() * 1.4, fill: ctx.c(i ? "accent2" : "muted"), opacity: (0.45 + rnd() * 0.4).toFixed(2) }, gg);
      }
      return gg;
    });
    const span = ctx.end - ctx.start;
    Loom.drive((e) => {
      sg[0].setAttribute("opacity", (0.65 + 0.35 * Math.sin(e * 6.283 * 1.5)).toFixed(3));
      sg[1].setAttribute("opacity", (0.6 + 0.4 * Math.sin(e * 6.283 * 2 + 1.7)).toFixed(3));
    }, ctx.start, span, "linear");
    Loom.drive((e) => {
      const s0 = 1 + 0.03 * e, s1 = 1 + 0.07 * e;
      sg[0].setAttribute("transform", "translate(960 440) scale(" + s0.toFixed(4) + ") translate(-960 -440)");
      sg[1].setAttribute("transform", "translate(960 440) scale(" + s1.toFixed(4) + ") translate(-960 -440)");
    }, tAsk, ctx.end - tAsk, "move");

    // earth: night side towards us
    const W = 620, ES = ctx.el("earth", { x: 650, y: 130, w: W, h: W, kind: "scenery", exit: "recede" });
    Loom.lesson.earth(ctx, ES.inner, { form: "disc", w: W, showPoint: false });
    m.settle(ES, ctx.start + 0.05, { dy: 40 });

    // the phone's point: a child of earth so it scales with it (kit anchor 470,300 in 800 space)
    const k = W / 800, px = 470 * k, py = 300 * k;
    const PT = ctx.el("earth_point", { x: px - 40, y: py - 40, w: 80, h: 80, kind: "icon", exit: "recede", parent: ES });
    const halo = Loom.svg("circle", { cx: 40, cy: 40, r: 26, fill: ctx.c("accent4"), opacity: 0.28 }, PT.inner);
    const ring = Loom.svg("circle", { cx: 40, cy: 40, r: 14, fill: "none", stroke: ctx.c("accent4"), "stroke-width": 4, opacity: 0 }, PT.inner);
    Loom.svg("circle", { cx: 40, cy: 40, r: 11, fill: ctx.c("accent4"), stroke: ctx.c("ink"), "stroke-width": 3 }, PT.inner);
    m.pop(PT, tPoint);
    Loom.drive((e) => {
      ring.setAttribute("r", (12 + 26 * e).toFixed(1));
      ring.setAttribute("opacity", (0.9 * (1 - e)).toFixed(3));
      halo.setAttribute("r", (26 + 8 * Math.sin(e * 3.14159)).toFixed(1));
    }, tPoint + 0.1, 1.0, "move");

    // slow pull back as the question lands; the point stays steady on the planet
    Loom.drive((e) => {
      const sc = 1 - 0.16 * e;
      ES.inner.setAttribute("transform", "translate(" + (W / 2) + " " + (W / 2) + ") scale(" + sc.toFixed(4) + ") translate(" + (-W / 2) + " " + (-W / 2) + ")");
    }, tAsk, ctx.end - tAsk + 0.4, "move");
  },
});
