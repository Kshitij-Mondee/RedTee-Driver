// @lab {"title": "One becomes many, and a chapter over the world (D-90, CINEMA_PLAN B9, B10): a seeded hall of racks fills, a tag names it, a chapter sting dims the world", "styles": ["glow-flat", "cinematic-noir"], "dur": 6.0, "times": [1.2, 2.6, 4.4]}
// Loom.array draws 40 instances, each with its own seeded variation (lit lights), arriving from the centre out.
// Loom.data.tag names the thing that is drawn. Loom.data.chapter dims the world and sets a title over it.
Loom.scene("lab_world", {
  build(ctx) {
    const { kit } = ctx;
    kit.rect(ctx.el("floor", { x: 0, y: 0, w: 1920, h: 1080, kind: "ground" }).inner, 0, 640, 1920, 440, { fill: "field2", flat: true });
    Loom.array(ctx, "racks", { x: 150, y: 250, cols: 10, rows: 4, dx: 165, dy: 150, order: "centre", t: 0.2, stagger: 0.05,
      skew: (r) => [r * -36, 0],
      draw: (g, i, r, c, rnd) => {
        const s = 1 - r * 0.06;
        kit.rect(g, 0, 0, 110 * s, 230 * s, { fill: "surface2", r: 10 });
        for (let k = 0; k < 6; k++) kit.rect(g, 12 * s, (18 + k * 34) * s, 86 * s, 22 * s, { fill: "field", r: 4, flat: true });
        for (let k = 0; k < 6; k++) if (rnd() < 0.65) kit.disc(g, 26 * s, (29 + k * 34) * s, 5 * s, { fill: rnd() < 0.8 ? "accent3" : "accent4", flat: true });
      } });
    Loom.data.tag(ctx, "hall_tag", { x: 120, y: 120, lines: ["A HALL OF SERVERS", "40 RACKS (SAMPLE)"], color: "accent3", textColor: "ink", t: 1.6 });
    Loom.data.chapter(ctx, "chapter", { kicker: "CHAPTER TWO", title: "THE HALL", sub: "where the work happens", t: 3.4, dur: 2.2 });
  },
});
