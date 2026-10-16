// @lab {"title": "Places and camera: five sets drawn in the seed's language, each explored by a push or a pan with parallax", "styles": ["glow-flat", "flat-cosmos"], "dur": 20.0, "times": [0.8, 3.6, 6.8, 11.6, 14.6, 19.2], "seeds": [{"name": "classic"}, {"name": "rules", "shape": "architectural", "label": "stamp", "bubble": "note", "panel": "paper", "icon": "seal", "mark": "stamp", "texture": "paper", "entrance": "typeset", "camera": "pan"}, {"name": "tech", "shape": "angular", "label": "flag", "bubble": "chat", "panel": "frame", "icon": "tile", "mark": "box", "texture": "halftone", "entrance": "draw", "camera": "push"}]}
// A lab scene for places and the in-scene camera (D-84; docs/styles/DISTINCTNESS_PLAN.md step 5). Five places,
// four seconds each, each with one continuous camera move inside the idea: push into the laptop screen, pan along
// a vessel, push into a rack, push to the meeting screen, pan along the shelving. Original drawings.
Loom.scene("lab_places", {
  build(ctx) {
    const PL = Loom.place, C = Loom.cam;
    const show = (R, a, b) => { Loom.set(R.E.outer, { opacity: 0 }, 0); Loom.set(R.E.outer, { opacity: 1 }, a); if (b < 20) Loom.set(R.E.outer, { opacity: 0 }, b); };
    const off = PL.office(ctx, "office", { side: "right" });
    const who = ctx.character("ava", "ava", { x: off.anchors.stand[0], y: off.anchors.stand[1] + 4, scale: 0.62, skin: 1, top: "accent", parent: off.layers.mid.g });
    void who;
    C.push(off, { to: off.anchors.screen, scale: 1.7, t0: 1.2, t1: 3.6 });
    show(off, 0, 4);
    const ins = PL.inside(ctx, "inside", { t0: 4, t1: 8 });
    C.pan(ins, { dx: -260, t0: 4.4, t1: 7.6 });
    show(ins, 4, 8);
    const srv = PL.server(ctx, "server", { t0: 8, t1: 12 });
    C.push(srv, { to: srv.anchors.rack, scale: 1.6, t0: 8.6, t1: 11.4 });
    show(srv, 8, 12);
    const mt = PL.meeting(ctx, "meeting", {});
    C.push(mt, { to: mt.anchors.screen, scale: 1.45, t0: 12.4, t1: 15 });
    show(mt, 12, 16);
    const wh = PL.warehouse(ctx, "warehouse", {});
    C.pan(wh, { dx: -320, t0: 16.3, t1: 19.6 });
    show(wh, 16, 20);
  },
});
