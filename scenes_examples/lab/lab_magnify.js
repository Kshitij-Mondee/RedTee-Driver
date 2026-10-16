// @lab {"title": "Magnifier inset and cutaway (D-114): a ring lands on a small gauge, the leader draws into a lens that irises open on a LIVE magnified copy (the needle moves in both); a window opens in a tank to show the gears inside. Exits reverse: lens closes, leader retracts, window closes", "styles": ["flat-cosmos", "engineering"], "dur": 9.0, "times": [1.35, 1.75, 2.15, 3.0, 3.75, 5.0, 6.2, 6.6, 7.0, 7.85, 8.8]}
// A lab scene: absolute times, no narration. A machine is drawn as its own element; the lens references it with an
// SVG <use>, so the copy is the machine itself, magnified 4x about the gauge.
Loom.scene("lab_magnify", {
  build(ctx) {
    const { kit, m } = ctx;
    const M = ctx.el("machine", { x: 120, y: 300, w: 720, h: 520, kind: "object" });
    kit.rect(M.inner, 0, 60, 720, 460, { fill: "surface2" });
    kit.rect(M.inner, 40, 100, 300, 180, { fill: "surface" });
    for (let i = 0; i < 4; i++) kit.rect(M.inner, 380 + i * 80, 120, 56, 140, { fill: ["accent", "accent3", "accent4", "accent2"][i], r: 6 });
    kit.rect(M.inner, 60, 330, 600, 40, { fill: "line", r: 20 });
    kit.rect(M.inner, 60, 410, 260, 70, { fill: "accent3", r: 10 });
    kit.rect(M.inner, 360, 410, 300, 70, { fill: "accent4", r: 10 });
    kit.rect(M.inner, 280, 0, 160, 70, { fill: "surface2", r: 8 });
    // the small detail: a gauge with ticks and a needle (local coords)
    const gx = 130, gy = 190, gr = 40;
    kit.disc(M.inner, gx, gy, gr, { fill: "field", flat: true, stroke: "ink", sw: 4 });
    for (let k = 0; k <= 6; k++) {
      const a = Math.PI * (0.8 + k * 1.4 / 6);
      kit.line(M.inner, gx + Math.cos(a) * gr * 0.62, gy + Math.sin(a) * gr * 0.62, gx + Math.cos(a) * gr * 0.86, gy + Math.sin(a) * gr * 0.86, { stroke: k > 4 ? "neg" : "ink", sw: 3, crisp: true });
    }
    const needle = Loom.svg("line", { x1: gx, y1: gy, x2: gx, y2: gy - gr * 0.78, stroke: ctx.c("neg"), "stroke-width": 4, "stroke-linecap": "round" }, M.inner);
    kit.disc(M.inner, gx, gy, 6, { fill: "ink", flat: true });
    Loom.drive((e) => needle.setAttribute("transform", `rotate(${(-110 + 200 * e).toFixed(2)} ${gx} ${gy})`), 0.6, 7.6, "editorial", { kind: "ambient", name: "needle" });
    m.settle(M, 0.1);
    kit.text(ctx.g, "MACHINE", { x: 120, y: 840, w: 720, h: 50, role: "label", color: "muted", align: "center", tracking: 2 });

    // the lens: focus on the gauge (station coords), lens up and to the right
    Loom.magnify(ctx, "gauge_lens", { source: M, focus: { x: 120 + gx, y: 300 + gy, r: 52 }, at: { x: 1120, y: 330, r: 230 }, t: 1.2, ring: "accent", out: 6.0 });

    // a tank with a window cut into it, showing the gears inside
    const T = ctx.el("tank", { x: 1360, y: 600, w: 440, h: 330, kind: "object" });
    kit.rect(T.inner, 0, 0, 440, 330, { fill: "accent3" });
    kit.rect(T.inner, 30, 30, 380, 30, { fill: "surface2", r: 8 });
    m.settle(T, 0.3);
    const gear = (g, cx, cy, r, tok, sign) => {
      const G = Loom.svg("g", {}, g);
      for (let k = 0; k < 10; k++) { const a = k * Math.PI / 5; kit.rect(G, cx + Math.cos(a) * r - 12, cy + Math.sin(a) * r - 12, 24, 24, { fill: tok, r: 4, flat: true, crisp: true }); }
      kit.disc(G, cx, cy, r * 0.92, { fill: tok, flat: true });
      kit.disc(G, cx, cy, r * 0.3, { fill: "surface2", flat: true });
      Loom.drive((e) => G.setAttribute("transform", `rotate(${(sign * 220 * e).toFixed(2)} ${cx} ${cy})`), 3.2, 5.0, "linear", { kind: "ambient", name: "gear" });
    };
    Loom.magnify.cutaway(ctx, "tank_inside", { source: T, shape: "circle", win: { x: 1580, y: 780, r: 128 },
      reveal: (g) => { gear(g, 1540, 760, 62, "accent", 1); gear(g, 1640, 830, 44, "accent2", -1.4); }, t: 3.4, out: 7.6 });
    kit.text(ctx.g, "TANK, CUT AWAY", { x: 1360, y: 950, w: 440, h: 50, role: "label", color: "muted", align: "center", tracking: 2 });
  },
});
