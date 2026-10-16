// @lab {"title": "Stepped time (D-114): the same entrance and travel smooth vs on fours (6 Hz), the eased curve vs its staircase, and line boil (8 Hz) with a x3 detail", "styles": ["story-cartoon", "whiteboard"], "dur": 3.0, "times": [0.5, 1.0, 1.1, 1.2, 1.5, 1.6, 2.2, 2.6]}
// A lab scene: absolute times, no narration. Two identical cards settle in at 0.2 s and travel at 0.8 s for 1.2 s;
// the lower one is switched to stepped time with ONE call (Loom.stepped.on), the scene code is otherwise the same.
// Read the strip in pairs: 1.0 / 1.1 and 1.5 / 1.6 fall inside one step, so the stepped card has not moved while the
// smooth one has. Right: an outlined shape boils (a new seeded drawing every 0.125 s); the inset repeats one edge at
// x3 so the boil is visible at strip size.
Loom.scene("lab_stepped", {
  build(ctx) {
    const { kit, m } = ctx;
    const lanes = [["smooth", 0], ["on fours (6 Hz)", 6]];
    lanes.forEach(([label, hz], i) => {
      const y = 150 + i * 200;
      kit.line(ctx.g, 140, y + 156, 1240, y + 156, { stroke: "line", sw: 2, dash: "6 10", crisp: true });
      const E = ctx.el("card_" + i, { x: 140, y, w: 420, h: 140, kind: "card" });
      kit.rect(E.inner, 0, 0, 420, 140, { fill: "surface" });
      kit.disc(E.inner, 70, 70, 38, { fill: i ? "accent" : "accent3" });
      kit.text(E.inner, label, { role: "label", x: 122, y: 0, w: 280, h: 140, valign: "middle", maxLines: 2 });
      if (hz) Loom.stepped.on(E, { hz });
      m.settle(E, 0.2, { dy: 60 });
      m.travel(E, 0.8, { x: 680, dur: 1.2 });
    });

    // the curve: position against time for a 1 s move, smooth (thin) and stepped at 6 Hz (thick staircase)
    const G = { x: 160, y: 620, w: 1060, h: 340 };
    kit.rect(ctx.g, G.x - 30, G.y - 30, G.w + 60, G.h + 60, { fill: "surface", crisp: true });
    const Y = (v) => G.y + G.h - v * G.h;
    const curve = (f) => { let d = ""; for (let k = 0; k <= 300; k++) { const pp = k / 300; d += `${k ? "L" : "M"}${(G.x + pp * G.w).toFixed(1)} ${Y(f(pp)).toFixed(1)} `; } return d; };
    kit.path(ctx.g, curve(Loom.ease.move), { stroke: "accent3", sw: 4 });
    kit.path(ctx.g, curve(Loom.stepped.ease("move", 1.0, 6)), { stroke: "accent", sw: 7 });
    kit.text(ctx.g, "the same ease, quantised to 6 drawings a second", { role: "caption", x: G.x + 280, y: G.y + G.h - 50, w: 760, h: 40, align: "right", color: "muted" });

    // boil: an outlined shape whose line is redrawn on every step
    const B = ctx.el("boil_shape", { x: 1400, y: 140, w: 360, h: 360, kind: "shape" });
    kit.disc(B.inner, 180, 180, 150, { fill: "accent2" });
    kit.path(B.inner, "M90 190 C130 120 230 120 270 190", { stroke: "ink", sw: 8 });
    m.pop(B, 0.1);
    Loom.stepped.boil(B, 0.0, 3.0, { hz: 8, amp: 1.6 });
    kit.text(ctx.g, "line boil, 8 Hz", { role: "caption", x: 1400, y: 516, w: 360, h: 40, align: "center", color: "muted" });

    // the x3 detail: a live <use> copy of the shape's upper-left edge, clipped to a frame
    B.outer.setAttribute("id", "lab_boil_src");
    const I = { x: 1330, y: 600, w: 470, h: 380 };
    kit.rect(ctx.g, I.x - 10, I.y - 10, I.w + 20, I.h + 20, { fill: "surface", crisp: true });
    const defs = Loom.svg("defs", {}, ctx.g);
    Loom.svg("rect", { x: I.x, y: I.y, width: I.w, height: I.h }, Loom.svg("clipPath", { id: "lab_boil_clip" }, defs));
    const zg = Loom.svg("g", { "clip-path": "url(#lab_boil_clip)" }, ctx.g);
    // focus point (1500, 300): the start of the ink arc and the disc edge behind it,, magnified 3x into the inset centre
    const fx = 1500, fy = 300, s = 3;
    Loom.svg("use", { href: "#lab_boil_src", transform: `translate(${I.x + I.w / 2 - fx * s} ${I.y + I.h / 2 - fy * s}) scale(${s})` }, zg);
    kit.text(ctx.g, "x3", { role: "caption", x: I.x + 12, y: I.y + 8, w: 80, h: 40, color: "muted" });
  },
});
