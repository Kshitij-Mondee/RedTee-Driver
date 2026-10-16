// @lab {"title": "Hold and transform (D-90, CINEMA_PLAN B8): one shot changes instead of cutting. A box's lid lifts off and the hall inside lights up, then the racks heat up; on the right, layers peel past the camera", "styles": ["glow-flat", "cinematic-noir"], "dur": 9.0, "times": [0.8, 3.4, 6.2, 8.6]}
// Left: an isometric-ish box whose lid lifts (Loom.hold.lift), revealing a seeded hall of racks (Loom.array) that
// then heats from accent4 to neg (Loom.hold.heat). Right: three nested layers peel one by one (Loom.hold.peel).
Loom.scene("lab_hold", {
  build(ctx) {
    const { kit } = ctx;
    const hall = Loom.array(ctx, "racks", { x: 150, y: 420, cols: 6, rows: 3, dx: 120, dy: 120, order: "centre", t: 1.6, stagger: 0.05,
      draw: (g, i, r, c, rnd) => { kit.rect(g, 0, 0, 80, 100, { fill: "surface", r: 8 }); for (let k = 0; k < 4; k++) kit.rect(g, 10, 12 + k * 21, 60, 12, { fill: "accent4", r: 3, flat: true }); } });
    const walls = ctx.el("walls", { x: 110, y: 380, w: 780, h: 420, kind: "group" });
    kit.rect(walls.inner, 0, 0, 780, 420, { fill: "none", stroke: "line", sw: 6, r: 12 });
    const lid = ctx.el("lid", { x: 110, y: 380, w: 780, h: 420, kind: "group" });
    kit.rect(lid.inner, 0, 0, 780, 420, { fill: "surface2", r: 12 });
    kit.text(lid.inner, "a plain box", { x: 40, y: 170, w: 700, h: 80, role: "title", align: "center", color: "muted" });
    Loom.hold.lift(ctx, lid, 1.2, { dy: -260, dur: 1.4 });
    Loom.hold.heat([hall], 4.4, { from: "accent4", to: "neg", dur: 3.0 });
    Loom.data.tag(ctx, "heat_tag", { x: 120, y: 840, text: "HEAT RISES (SAMPLE)", color: "neg", textColor: "ink", t: 5.0 });
    const L = ["outer", "middle", "inner"].map((nm, i) => {
      const E = ctx.el("layer_" + nm, { x: 1180 + i * 70, y: 220 + i * 70, w: 560 - i * 140, h: 560 - i * 140, kind: "group" });
      kit.disc(E.inner, (560 - i * 140) / 2, (560 - i * 140) / 2, (560 - i * 140) / 2, { fill: ["accent3", "accent", "accent2"][i] });
      return E;
    });
    const core = ctx.el("core", { x: 1390, y: 430, w: 140, h: 140, kind: "group" });
    kit.disc(core.inner, 70, 70, 70, { fill: "accent4" });
    Loom.hold.peel(ctx, L, 2.4, { gap: 1.6, scale: 2.4 });
  },
});
