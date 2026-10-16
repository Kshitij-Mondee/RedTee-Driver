// @lab {"title": "hologram V2: how a language model picks the next word. Tokens on a baseline, attention as weighted arcs rising into three translucent layers, the next-word distribution measured to three places, the pick lit", "styles": ["hologram"], "fx": {}, "dur": 9.0, "times": [3.2, 5.6, 8.4]}
/* The redo of stress frame 2 (29.0 s) in the pushed SVG route (hologram v2, 2026-10-16). Before: a 28-node hexagon
 * lattice in three labelled pills, empty bar outlines, mono caps everywhere. After: what attention is (weighted links
 * from one token back to the others), where it happens (layers as translucent planes in depth, the far one out of
 * focus), and what it produces (a measured distribution, the pick lit). One reading leads; the rest is dimmer.
 * Every number is illustrative (a hypothetical model); in a lesson each comes from the knowledge sheet. */
Loom.scene("hologram_v2_llm", {
  build(ctx) {
    const W = ctx.engine, H = W.hud(ctx, { name: "hud" });
    H.stage("stage", { focus: [820, 520], lift: 0.8, at: 0.0 });

    H.title("head", { x: 120, y: 92, w: 1100, h: 120, kicker: "Inside the triage assistant", caps: false, text: "How a language model picks the next word", role: "lead", at: 0.3 });

    // three layers as floors of light, the deepest highest and softest
    const floors = [["Layer 3", 330, 0.2, "far"], ["Layer 2", 448, 0.16, "mid"], ["Layer 1", 566, 0.12, "mid"]].map(([lab, y, top, depth], i) =>
      H.plane("layer" + (3 - i), { x: 480 - i * 30, y, w: 820 + i * 60, h: 96, top, lit: "bottom", label: lab, depth, at: 0.6 + i * 0.2 }));

    // the sentence as the model reads it
    const TK = H.tokens("tokens", { x: 470, y: 756, w: 860, tokens: ["Why", "is", "Frank", "furt", "running", "hot", "?"], focus: 5, at: 1.0, by: 2.2 });

    // attention: every token looks back at the ones before it; "hot" looks hardest at "Frank" and "furt"
    const pts = {}; for (let i = 0; i < 7; i++) pts["t" + i] = TK.top(i);
    const links = [
      { from: "t5", to: "t2", w: 0.41 }, { from: "t5", to: "t3", w: 0.3 }, { from: "t5", to: "t4", w: 0.12 }, { from: "t5", to: "t1", w: 0.08 }, { from: "t5", to: "t0", w: 0.05 },
      { from: "t3", to: "t2", w: 0.22 }, { from: "t4", to: "t3", w: 0.1 }, { from: "t2", to: "t0", w: 0.06 }, { from: "t6", to: "t5", w: 0.14 }, { from: "t6", to: "t0", w: 0.07 },
      { from: "t1", to: "t0", w: 0.09 }, { from: "t4", to: "t2", w: 0.08 }, { from: "t6", to: "t3", w: 0.05 },
    ];
    H.arcs("attention", { points: pts, links, at: 2.4, by: 4.0, lift: 0.72, label: 0.3, strong: 0.28 });

    // the one reading: how much of "hot"'s attention goes to the city it is about
    H.reading("focus", { x: 120, y: 380, w: 320, label: "Attention from “hot” to Frank, furt", value: 0.71, decimals: 2, size: "major",
      micro: ["layer 2, head 5", "sum of two weights"], at: 3.8 });

    // the state of "hot" rises through the three layers and becomes the next-word scores
    const hot = TK.top(5);
    H.trace("rise", { points: [[hot[0], hot[1] - 4], [hot[0] - 6, 614], [hot[0] - 22, 496], [hot[0] - 44, 378], [1300, 370], [1392, 392]], at: 4.0, dur: 1.2,
      label: { at: 3, text: "“hot” after 3 layers", side: "left" } });

    // what it produces: the next word, measured
    const D = H.dist("next", { x: 1400, y: 330, w: 420, title: "Next word, after “hot ?”", rows: [["load", 0.618], ["traffic", 0.207], ["heat", 0.094], ["demand", 0.051], ["other", 0.03]],
      note: "sampled at temperature 0.7", at: 4.6, by: 5.6 });
    D.pick(0, 6.6);
    H.reading("picked", { x: 1400, y: 762, w: 420, label: "Picked", value: "load", size: "minor", micro: ["p = 0.618, the most likely"], at: 6.8 });
    void floors;
  },
});
