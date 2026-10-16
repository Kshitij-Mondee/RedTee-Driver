// @lab {"title": "hologram V2: a server rack as projected light (the WebGL hero): scanned onto its pad, the door opens, the switch and the power feeds are read, a hot unit slides out", "styles": ["hologram"], "fx": {}, "dur": 13.0, "times": [2.0, 9.3, 11.9], "hero3d": {"rack": {"rect": [500, 60, 1000, 880], "dur": 13.0, "fps": 12, "params": {"model": "server_rack", "opts": {"units": 8, "empty": [1, 5], "load": 1, "alertUnit": 2}, "yaw": -0.95, "turn": [0.6, 5.2, 0.5], "build": [0.6, 2.8], "elevation": 14, "zoom": 0.8, "states": [{"key": "door", "from": 0, "to": 1, "at": 5.6, "dur": 1.2}, {"key": "alert", "from": 0, "to": 1, "at": 9.4, "dur": 0.4}, {"key": "slide", "from": 0, "to": 1, "at": 9.8, "dur": 1.2}], "hot": [{"part": "switch", "t0": 7.0, "t1": 8.3}, {"part": "pdus", "t0": 8.4, "t1": 9.6}, {"part": "unit3", "t0": 9.8, "t1": 13}]}}}}
/* The redo of the wow pass's rack (hologram v2, 2026-10-16), on the WebGL route: the library's server_rack (door,
 * units, switch, A and B power strips) as projected light, rendered by runtime/three/presets/holo_hero.js and laid
 * behind the SVG HUD by H.hero3d. The HUD is readings, not panels: a small sentence-case label, one large value, dim
 * micro detail, a leader to the part. One lock at a time names the part as it turns hot.
 * Render: py -c "from loom import three_bridge as T; print(T.hero_lab_strip('docs/research/2026-10-16-style-stress/hologram_v2_rack.js', out_dir=..., frames_dir=...))"
 * Every number is illustrative (a hypothetical rack); in a lesson each comes from the knowledge sheet. */
Loom.scene("hologram_v2_rack", {
  build(ctx) {
    const W = ctx.engine, H = W.hud(ctx, { name: "hud" });
    H.stage("stage", { focus: [1000, 600], lift: 0.7, at: 0.0 });
    const R = H.hero3d("rack", { at: 0.4 });

    H.title("head", { x: 120, y: 92, w: 760, h: 120, kicker: "Data hall B, row 4", caps: false, text: "What one rack holds", role: "lead", at: 0.3 });
    H.reading("rack_id", { x: 120, y: 820, w: 380, label: "Rack R4-07", value: "8 units, 2 empty", size: "minor", micro: ["front: cold aisle"], at: 3.4 });

    // one lock at a time; each leaves a reading with a leader to its part
    const L1 = H.lock(R.part("switch", 7.0), { at: 7.0, label: "Top-of-rack switch", caps: false, pad: 8 });
    L1.release(8.3);
    H.reading("uplink", { x: 1500, y: 230, w: 330, label: "Uplink, top-of-rack switch", value: 38.4, decimals: 1, unit: "Gb/s",
      micro: ["2 links of 25 Gb/s", "sampled 09:41:07"], to: R.anchor("switch", 7.2, [1, 0.5]), at: 7.3 });
    const L2 = H.lock(R.part("pdus", 8.4), { at: 8.4, label: "Power strips A and B", caps: false, pad: 8 });
    L2.release(9.6);
    H.reading("power", { x: 120, y: 470, w: 340, label: "Power, feeds A and B", value: 6.1, decimals: 1, unit: "kW",
      micro: ["A 3.1 kW, B 3.0 kW", "one feed can carry it"], to: R.anchor("pdus", 8.6, [0, 0.45]), at: 8.7 });
    H.reading("inlet", { x: 1500, y: 560, w: 330, label: "Unit 3, inlet air", value: 41.2, decimals: 1, unit: "°C", tone: "warn",
      micro: ["limit 35 °C", "pulled for service"], to: R.anchor("unit3", 11.0, [0.9, 0.5]), at: 11.0 });
  },
});
