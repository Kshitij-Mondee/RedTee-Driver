// @lab {"title": "hologram WOW: a hero product scan. A server rack is scanned onto a projector pad, three parts are locked with their values in amber, then the rack explodes along its rails", "styles": ["hologram"], "fx": {}, "dur": 16.0, "times": [3.0, 10.9, 14.6]}
/* The hologram engine's HERO moment (2026-10-16, the wow pass), not a lesson beat. One glowing wireframe object on a
 * projector pad, on a dark stage, with HUD chrome at the frame's edges and small amber data plates beside it. In a
 * lesson this is one or two beats in the analysis register; the briefing beats stay calm.
 *   0.0 to 1.0  the stage darkens, the pad powers up, beams fall onto it, the chrome draws at the edges
 *   1.0 to 4.0  a scan plane rises through the rack and builds it while it turns on the pad
 *   6.4 to 11   three locks, one at a time: the power unit, the network switch, the fans; each leaves an amber value
 *   11.3 to 13  the values clear and the rack explodes along its rails: the six servers slide out
 *   13.2        one server is lit and measured
 * Every number is illustrative (a hypothetical rack); in a lesson each comes from the knowledge sheet. */
Loom.scene("hologram_wow", {
  build(ctx) {
    const W = ctx.engine, H = W.hud(ctx, { name: "hud" });

    H.grid("field_hex", { x: 0, y: 0, w: 1920, h: 1080, kind: "hex", cell: 34, opacity: 0.05, at: 0.0 });
    H.stage("stage", { focus: [960, 600], at: 0.0 });

    const PAD = H.pad("pad", { cx: 960, cy: 806, r: 320, beam: 600, at: 0.2, seed: "rack07" });
    const R = H.object("rack", { model: "rack", cx: 960, cy: 806, size: 590, at: 1.0, yaw: -82, spin: 9, spinFrom: 1.0, spinTo: 6.0,
      build: { at: 1.0, dur: 3.0 }, explode: [{ t: 11.3, to: 1, dur: 1.7 }], overlaps: ["pad"] });

    H.chrome("chrome", { tl: "Data hall B, row 4", tr: "Hardware scan", bl: "Rack R4-07, live", bind: R, at: 0.1 });
    H.title("head", { x: 120, y: 120, w: 760, h: 100, kicker: "Inside a server rack", text: "What one rack holds", role: "lead", at: 0.6 });

    // three locks, one at a time; each leaves its value in amber beside the rack
    const parts = [
      { id: "psu", t: 6.4, label: "Power unit", value: 6.2, decimals: 1, unit: "kW", dlabel: "Power draw", x: 250, y: 700 },
      { id: "switch", t: 8.0, label: "Network switch", value: 38, unit: "Gb/s", dlabel: "Uplink traffic", x: 1370, y: 420 },
      { id: "fans", t: 9.6, label: "Cooling fans", value: 27, unit: "°C", dlabel: "Inlet air", x: 1370, y: 250 },
    ];
    const D = parts.map((p) => {
      R.hot(p.id, p.t, p.t + 1.4);
      const L = H.lock(R.part(p.id, p.t), { at: p.t, label: p.label, status: "warn", labelPos: p.x < 960 ? "below" : "above", labelAlign: p.x < 960 ? "left" : "right" });
      L.release(p.t + 1.4);
      return H.datum("d_" + p.id, { x: p.x, y: p.y, w: 300, label: p.dlabel, value: p.value, decimals: p.decimals, unit: p.unit, to: R.anchor(p.id, p.t), at: p.t + 0.45 });
    });
    D.forEach((d, i) => H.power(d, "down", 11.0 + i * 0.06));

    // the exploded view: the servers slide out on their rails; one is lit and measured
    R.hot("srv4", 13.2);
    H.datum("d_srv4", { x: 1370, y: 560, w: 300, label: "Server 4, CPU", value: 71, unit: "%", to: R.anchor("srv4", 13.2), at: 13.4 });
    void PAD;
  },
});
