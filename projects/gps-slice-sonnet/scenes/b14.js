// @design sweep_to_ring: one arm pivots on a fixed point and sweeps a full turn, the track it leaves behind is every place at that reach
// Treatments: (1) static circle with a radius tick; (2) arm sweeps a full turn drawing the circle, then arm fades and circle settles (chosen: the sweep shows that every point at that range fits); (3) circle grows from the point outward.
Loom.scene("b14", {
  build(ctx) {
    const { m } = ctx;
    const S = (tag, a, p) => Loom.svg(tag, a, p);
    // shared constants with b08 / b13
    const A = { x: 430, y: 230 };
    const PHONE = { x: 960, y: 812 };
    const dx = PHONE.x - A.x, dy = PHONE.y - A.y;
    const R = Math.hypot(dx, dy);
    const a0 = Math.atan2(dy, dx); // radians, screen coords (y down): positive = clockwise
    const a0deg = a0 * 180 / Math.PI;

    const t0 = ctx.cue("So the phone sits somewhere on a sphere");
    const tClose = ctx.cue("around that satellite");
    const tSettle = ctx.cue("at exactly that range");

    // the circle (the sphere drawn flat), behind the arm
    const circ = ctx.el("circle_a", { x: 0, y: 0, w: 1920, h: 1080, kind: "connector" });
    // @form range_circle: the sphere drawn flat around the satellite, through the phone point
    // the circle is large: only its in-frame arcs are drawn (frame left edge to frame top edge), the rest is off frame
    const thL = Math.acos(-A.x / R), thT = -Math.asin(A.y / R);
    const pAt = (th) => (A.x + R * Math.cos(th)).toFixed(2) + " " + (A.y + R * Math.sin(th)).toFixed(2);
    const arcD = (t1, t2) => "M" + pAt(t1) + " A" + R.toFixed(2) + " " + R.toFixed(2) + " 0 0 1 " + pAt(t2);
    const mk = (d, extra) => S("path", Object.assign({ d: d, fill: "none", stroke: ctx.c("accent"), "stroke-width": 7, "stroke-linecap": "butt", pathLength: 1000, "stroke-dasharray": "1000 1000", "stroke-dashoffset": 1000 }, extra || {}), circ.inner);
    const gd = 92 / R; // half-gap (radians) so no stroke runs into the phone point
    const seg1 = mk(arcD(a0 + gd, thL)); // phone point round to the frame's left edge
    const seg2 = mk(arcD(thT, a0 - gd)); // frame's top edge round to the phone point
    const sAttr = { fill: "none", stroke: ctx.c("line"), "stroke-width": 4, opacity: 0 };
    const settled1 = S("path", Object.assign({ d: arcD(a0 + gd, thL) }, sAttr), circ.inner);
    const settled2 = S("path", Object.assign({ d: arcD(thT, a0 - gd) }, sAttr), circ.inner);
    const settled = { setAttribute: (k, v) => { settled1.setAttribute(k, v); settled2.setAttribute(k, v); } };
    const ring = { setAttribute: (k, v) => { seg1.setAttribute(k, v); seg2.setAttribute(k, v); } };
    const clamp01 = (v) => Math.max(0, Math.min(1, v));

    // the arm: same line b13 left, from A to the phone point, pivoting on A
    const arm = ctx.el("sweep_arm", { x: 0, y: 0, w: 1920, h: 1080, kind: "connector" });
    // @form range_arm: the range line from the satellite, rotating about it
    const line = S("line", { x1: A.x, y1: A.y, x2: PHONE.x, y2: PHONE.y, stroke: ctx.c("accent"), "stroke-width": 6, "stroke-linecap": "round" }, arm.inner);
    arm.exit = "recede";

    // hand over from b13's line: identical line underneath, then it leaves
    let old = null;
    try { old = ctx.held("range_line"); } catch (e) { old = null; }
    if (old) { old.exit = "recede"; m.exit(old, t0 + 0.12, "recede"); }

    const sweepDur = Math.max(1.2, tClose - t0 + 0.3);
    Loom.drive((e) => {
      const ang = a0 + e * Math.PI * 2;
      line.setAttribute("x2", (A.x + R * Math.cos(ang)).toFixed(2));
      line.setAttribute("y2", (A.y + R * Math.sin(ang)).toFixed(2));
      const th = e * Math.PI * 2;
      seg1.setAttribute("stroke-dashoffset", (1000 * (1 - clamp01((th - gd) / (thL - a0 - gd)))).toFixed(2));
      seg2.setAttribute("stroke-dashoffset", (1000 * (1 - clamp01((th - (thT + Math.PI * 2 - a0)) / (a0 - gd - thT)))).toFixed(2));
    }, t0 + 0.15, sweepDur, "linear");
    m.reveal(circ, t0 + 0.1);

    // closes through the phone point: arm fades, accent circle settles to line colour
    const tEnd = t0 + 0.15 + sweepDur;
    const ts = Math.max(tSettle, tEnd);
    m.exit(arm, ts, "recede");
    Loom.drive((e) => {
      ring.setAttribute("opacity", (1 - e).toFixed(3));
      settled.setAttribute("opacity", (0.6 * e).toFixed(3));
    }, ts + 0.1, 0.7, "move");
  },
});
