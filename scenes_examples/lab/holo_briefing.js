// @lab {"title": "hologram ENGINE, the briefing register: a calm HUD that explains (a title, three data cards with one read each, a four-step flow with a packet, one status change on the word)", "styles": ["hologram"], "dur": 20.0, "times": [1.6, 4.6, 7.8, 11.2, 14.6, 19.4]}
/* The hologram engine's BRIEFING register (2026-10-16): most beats of a lesson. Generous space, one read per card (the
 * value is the largest thing on it), one diagram, and a single status change on the spoken word. Nothing moves that
 * carries no information: the packet travels because the narration follows a request through the steps. The numbers
 * are illustrative for the lab; in a lesson every one comes from the knowledge sheet. Compare within the style (D-122). */
Loom.scene("holo_briefing", {
  build(ctx) {
    const W = ctx.engine, H = W.hud(ctx, { name: "hud" });

    H.title("heading", { x: 120, y: 92, w: 1300, h: 170, kicker: "Model operations", text: "What we watch once a model is live", at: 0.3 });

    // ---- three cards, one read each (the value), calm, on the mid layer
    const cards = [
      { k: "accuracy", x: 120, kicker: "Accuracy, last 7 days", value: 94.2, decimals: 1, unit: "%", label: "against labelled samples" },
      { k: "drift", x: 680, kicker: "Input drift", value: 0.08, decimals: 2, label: "distance from training data" },
      { k: "latency", x: 1240, kicker: "Latency, p95", value: 210, unit: "ms", label: "inside the 300 ms budget", status: "ok" },
    ];
    const C = {};
    let t = 2.0;
    for (const c of cards) {
      C[c.k] = H.card("card_" + c.k, { x: c.x, y: 310, w: 520, h: 270, kicker: c.kicker, value: c.value, decimals: c.decimals, unit: c.unit, label: c.label, status: c.status, at: t });
      t += 1.0;
    }

    // ---- one diagram: the monitoring loop as a flow; a request travels it
    const F = H.flow("loop", { x: 120, y: 650, w: 1640, h: 210, at: 6.6, by: 9.0, steps: [
      { label: "Inputs logged", sub: "every request kept" },
      { label: "Drift checked", sub: "hourly, per feature" },
      { label: "Alert raised", sub: "above the threshold" },
      { label: "Model reviewed", sub: "retrain or roll back" },
    ] });
    F.packet(10.2, { dur: 2.4 });

    // ---- the one change: drift crosses its threshold, the card and the step turn amber with the word
    C.drift.status("warn", 13.4);
    F.step(1, "warn", 13.4);
  },
});
