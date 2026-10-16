// @lab {"title": "hologram V2: the Earth as projected light (the WebGL hero): real coastlines, four regions pinned, traffic arcs drawing on", "styles": ["hologram"], "fx": {}, "dur": 7.0, "times": [6.0], "hero3d": {"earth": {"rect": [460, 110, 1000, 860], "dur": 7.0, "fps": 12, "params": {"model": "earth", "geo": true, "opts": {"pins": [[50.1, 8.7], [38.9, -77.5], [19.1, 72.8], [1.35, 103.8]], "arcs": [[0, 1], [0, 2], [2, 3]]}, "yaw": 0, "build": [0.3, 1.8], "elevation": 10, "zoom": 0.74, "states": [{"key": "spin", "from": -0.3, "to": -0.95, "at": 0, "dur": 5}, {"key": "pins", "from": 0, "to": 1, "at": 2.0, "dur": 1.0}, {"key": "arcs", "from": 0, "to": 1, "at": 3.0, "dur": 1.8}], "look": {"parts": {"pins": "accent2", "arcs": "accent2", "pin0": "accent2", "pin1": "accent2", "pin2": "accent2", "pin3": "accent2"}}}}}}
/* The Earth hero (hologram v2): real Natural Earth coastlines on a sphere of light, four regions pinned in amber,
 * arcs of traffic between them, one reading pointed at the Frankfurt pin. Every number is illustrative. */
Loom.scene("hologram_v2_earth", {
  build(ctx) {
    const H = ctx.engine.hud(ctx, { name: "hud" });
    H.stage("stage", { focus: [960, 560], lift: 0.7, at: 0.0 });
    const G = H.hero3d("earth", { at: 0.2 });
    H.title("head", { x: 120, y: 92, w: 900, h: 120, kicker: "Global operations", caps: false, text: "Traffic between our regions", role: "lead", at: 0.3 });
    H.reading("fra", { x: 1480, y: 300, w: 340, label: "Frankfurt, requests", value: 41.7, decimals: 1, unit: "k/s", tone: "warn",
      micro: ["92 % of capacity", "5 minute mean"], to: G.anchor("pin0", 4.6), at: 4.6 });
    H.reading("arcs", { x: 120, y: 640, label: "Routes carrying traffic", value: 3, size: "minor", w: 420, micro: ["Frankfurt to Virginia", "Frankfurt to Mumbai", "Mumbai to Singapore"], at: 5.0 });
  },
});
