// @lab {"title": "hologram V2: a bicycle as projected light (the WebGL hero): built by the scan plane, wheels turning, the drivetrain lit and measured", "styles": ["hologram"], "fx": {}, "dur": 7.0, "times": [6.2], "hero3d": {"bike": {"rect": [280, 150, 1360, 800], "dur": 7.0, "fps": 12, "params": {"model": "bicycle", "yaw": -0.55, "turn": [0.4, 5.5, 0.5], "build": [0.3, 2.2], "elevation": 13, "zoom": 0.74, "states": [{"key": "spin", "from": 0, "to": 9, "at": 0, "dur": 7}, {"key": "pedal", "from": 0, "to": 3.5, "at": 0, "dur": 7}], "hot": [{"part": "drivetrain", "t0": 4.4, "t1": 7}]}}}}
/* The bicycle hero (hologram v2): the library's bicycle at real proportions as light on its pad, with one reading on
 * the drivetrain. Every number is illustrative; in a lesson each comes from the knowledge sheet. */
Loom.scene("hologram_v2_bicycle", {
  build(ctx) {
    const H = ctx.engine.hud(ctx, { name: "hud" });
    H.stage("stage", { focus: [960, 600], lift: 0.7, at: 0.0 });
    const B = H.hero3d("bike", { at: 0.2 });
    H.title("head", { x: 120, y: 92, w: 900, h: 120, kicker: "Commuting, the bike scheme", caps: false, text: "What the scheme bike is made of", role: "lead", at: 0.3 });
    H.reading("gears", { x: 1500, y: 640, w: 340, label: "Drivetrain", value: 18, unit: "gears", micro: ["2 rings, 9 sprockets", "chain checked at 500 km"], to: B.anchor("drivetrain", 4.6, [0.75, 0.4]), at: 4.6 });
    H.reading("weight", { x: 120, y: 700, w: 320, label: "Frame weight", value: 1.6, decimals: 1, unit: "kg", micro: ["aluminium, size 54"], to: B.anchor("frame", 5.0, [0.3, 0.35]), at: 5.0 });
  },
});
