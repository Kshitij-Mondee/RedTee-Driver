// @lab {"title": "Glow: a living place (push through layers, swarm, light) then a comparison pair that returns with one new value", "styles": ["glow-flat", "flat-cosmos"], "dur": 10.0, "times": [0.6, 2.2, 3.8, 5.4, 6.6, 8.0, 9.6], "words": [{"w": "A", "s": 0.4, "e": 0.5}, {"w": "healthy", "s": 0.52, "e": 0.9}, {"w": "team", "s": 0.92, "e": 1.2}, {"w": "is", "s": 1.22, "e": 1.3}, {"w": "busy", "s": 1.32, "e": 1.7}, {"w": "everywhere", "s": 1.72, "e": 2.4}, {"w": "compare", "s": 5.6, "e": 6.0}, {"w": "week", "s": 6.1, "e": 6.3}, {"w": "one", "s": 6.32, "e": 6.5}, {"w": "with", "s": 7.4, "e": 7.55}, {"w": "week", "s": 7.6, "e": 7.8}, {"w": "six", "s": 7.82, "e": 8.1}]}
// A lab scene for the glow-flat register (docs/styles/SATURATED_FLAT_PLAN.md, moment type 3). Shot 1: a place that
// is alive everywhere: layered organic shapes, a swarm on its own paths, light shafts, and a slow push through it.
// Shot 2 (a cut at the idea boundary): the frame RESTS on a labelled comparison pair, and each value lands on its
// word. Original content; absolute times; the values are illustrative.
Loom.scene("lab_glow_world", {
  build(ctx) {
    const G = Loom.glow, K = Loom.kit;
    // shot 1: a reef-like place built from seeded organic shapes, in three depth layers
    const s1 = ctx.el("place", { x: 0, y: 0, w: 1920, h: 1080, kind: "group" });
    G.ground(ctx, "bg", { parent: s1.inner, bloom: "accent4", bx: 0.5, by: 0.1, br: 0.7, dust: 60, floor: false, t0: 0, t1: 5.2, fieldTones: ["surface2", "violet", "field2", "plum"] });
    G.shafts(ctx, "light", { parent: s1.inner, n: 6, opacity: 0.2, t0: 0, t1: 5.2 });
    // a reef in three depth layers: branching coral, fan coral, kelp that sways, rounded rocks (seeded, original)
    const layer = (nm, y, n, size, tones, kind) => {
      const E = K.element(s1.inner, nm, { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" });
      const rng = Loom.rng(nm);
      for (let i = 0; i < n; i++) {
        const x = (1920 / (n - 1)) * i + (rng() - 0.5) * 120, tone = tones[i % tones.length], s2 = size * (0.8 + rng() * 0.45);
        const pick = kind[i % kind.length];
        if (pick === "coral") G.coral(E.inner, x, y + 40, s2 * 1.9, { fill: tone, seed: `${nm}${i}` });
        else if (pick === "fan") G.fan(E.inner, x, y + 30, s2 * 0.9, { fill: tone, seed: `${nm}${i}` });
        else if (pick === "kelp") G.kelp(E.inner, x, y + 60, s2 * 2.6, { fill: tone, t0: 0, t1: 5.2, phase: i });
        G.rock(E.inner, x + (rng() - 0.5) * 140, y + 70, s2 * 0.9, { fill: i % 2 ? "surface" : "plum", seed: `${nm}r${i}` });
      }
      return E;
    };
    const far = layer("far", 720, 9, 80, ["plum", "violet", "surface"], ["kelp", "fan", "coral"]);
    const mid = layer("mid", 820, 7, 120, ["accent3", "accent", "violet", "accent4"], ["coral", "fan", "coral", "kelp"]);
    G.swarm(ctx, "fish", { parent: s1.inner, kind: "fish", n: 22, area: { x: 100, y: 160, w: 1700, h: 480 }, t0: 0, t1: 5.2, size: [12, 26], drift: 14 });
    const near = layer("near", 960, 5, 170, ["accent2", "pos", "accent3"], ["coral", "fan", "coral"]);
    // the push: each layer scales about the centre at its own rate (parallax), the swarm with the middle layer
    [[far, 1.04], [mid, 1.1], [near, 1.24]].forEach(([E, k]) => Loom.tween(E.inner, { scale: 1, transformOrigin: "50% 60%" }, { scale: k, duration: 5.2, ease: Loom.ease.editorial }, 0, { kind: "camera", beat: ctx.beat.id, name: E.name }));
    [far, mid, near].forEach((E, i) => G.idle(E, 0, 5.2, { bob: 3 + i * 2, sway: 0, period: 3.4 + i * 0.6, phase: i }));
    G.sparkles(s1.inner, { x: 200, y: 140, w: 1500, h: 300, n: 9, t0: 0, t1: 5.2, seed: "reef" });
    Loom.set(s1.outer, { opacity: 0 }, 5.2);
    // shot 2: the comparison pair, labelled, each value on its word
    const s2 = ctx.el("compare", { x: 0, y: 0, w: 1920, h: 1080, kind: "group" });
    Loom.set(s2.outer, { opacity: 0 }, 0); Loom.set(s2.outer, { opacity: 1 }, 5.2);
    G.ground(ctx, "bg2", { parent: s2.inner, bloom: "violet", dust: 70, floor: false, t0: 5.2, t1: 10 });
    const cmp = G.compare(ctx, "pair", { parent: s2.inner, left: "Week 1", right: "Week 6", y: 190, h: 560, leftTone: "accent3", rightTone: "pos" });
    // inside each panel: the actual work, as tickets. Week 1: nine open tickets piled up. Week 6: seven done
    // (grey, ticked, stacked neatly) and two still open.
    const rngA = Loom.rng("wk1");
    for (let i = 0; i < 9; i++) G.ticket(cmp.L.g, cmp.L.x + 120 + (i % 3) * 230 + (rngA() - 0.5) * 50, cmp.L.y + 120 + Math.floor(i / 3) * 150 + (rngA() - 0.5) * 30, { tone: "accent3", rot: (rngA() - 0.5) * 22 });
    for (let i = 0; i < 7; i++) G.ticket(cmp.R.g, cmp.R.x + 100 + (i % 2) * 150, cmp.R.y + 90 + Math.floor(i / 2) * 105, { state: "done", w: 130, h: 84 });
    G.ticket(cmp.R.g, cmp.R.x + 530, cmp.R.y + 200, { tone: "pos", rot: -4 });
    G.ticket(cmp.R.g, cmp.R.x + 530, cmp.R.y + 360, { tone: "pos", rot: 5 });
    Loom.motion.settle(cmp.E, 5.2);
    cmp.value("left", "9 open", 6.3, { tone: "accent3" });
    cmp.value("right", "2 open", 7.8, { tone: "pos" });
  },
});
