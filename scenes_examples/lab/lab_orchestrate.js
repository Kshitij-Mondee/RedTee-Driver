// @lab {"title": "Orchestration: parent first, centre-out stagger, one shake, reverse exit (runtime/expressive.js)", "styles": ["flat-cosmos", "line-art"], "dur": 5.6, "times": [0.25, 0.55, 0.85, 1.3, 2.3, 2.5, 3.9, 4.25, 4.6]}
// A lab scene: absolute times, no narration.
Loom.scene("lab_orchestrate", {
  build(ctx) {
    const { kit, m } = ctx;
    // the parent panel arrives first, its five peers start halfway through it (framer's when: "beforeChildren")
    const panel = ctx.el("panel", { x: 160, y: 200, w: 1600, h: 560, kind: "card", exit: "recede" });
    kit.rect(panel.inner, 0, 0, 1600, 560, { fill: "surface" });
    const title = kit.text(panel.inner, "Five conditions, one outage", { role: "title", x: 60, y: 40, w: 1480, h: 100, valign: "middle" });
    void title;
    const words = ["No test", "Old setting", "Quiet alert", "Late deploy", "One reviewer"];
    const cards = words.map((w, i) => {
      const E = ctx.el(`cond_${i + 1}`, { x: 60 + i * 300, y: 200, w: 270, h: 300, kind: "card", exit: "sink" });
      kit.rect(E.inner, 0, 0, 270, 300, { fill: i === 2 ? "accent2" : "surface2" });
      kit.text(E.inner, w, { role: "label", x: 20, y: 0, w: 230, h: 300, align: "center", valign: "middle", color: i === 2 ? (ctx.style.pickTokenOn ? ctx.style.pickTokenOn("accent2") : "field") : "ink" });
      return E;
    });
    for (const E of cards) panel.inner.appendChild(E.outer);
    const landed = m.group(cards, 0.2, { enter: "spring", order: "center", parent: { E: panel, enter: "settle" }, sfx: "card", each: { preset: "snappy", dy: 40 } });
    // one peer is wrong: shake it (and it says so with its sound); another is the point: nudge it
    m.shake(cards[4], landed + 0.7);
    m.nudge(cards[2], landed + 1.9, { dy: -14 });
    // everything leaves in REVERSE order, faster than it came, then the parent
    m.groupExit(cards, 3.9, { parent: panel });
  },
});
