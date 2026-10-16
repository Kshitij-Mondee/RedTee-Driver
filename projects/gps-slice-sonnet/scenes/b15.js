// @design two_reaches_one_overlap: a second reach grows from a new centre until it crosses the first at two places, and a thin tilted loop lights through both
// Treatments: (1) static pair of circles with a lit loop; (2) second circle grows from its centre, crossings pulse, loop draws through them (chosen: the overlap exists only when the second arrives); (3) first circle slides to meet the second.
Loom.scene("b15", {
  build(ctx) {
    const { m } = ctx;
    const S = (tag, a, p) => Loom.svg(tag, a, p);
    // shared constants with b08 / b14
    const A = { x: 430, y: 230 };
    const B = { x: 1490, y: 200 };
    const PHONE = { x: 960, y: 812 };
    const RA = Math.hypot(PHONE.x - A.x, PHONE.y - A.y);
    const RB = Math.hypot(PHONE.x - B.x, PHONE.y - B.y);

    // the real intersection of the two circles
    const dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy);
    const ux = dx / d, uy = dy / d;
    const aa = (RA * RA - RB * RB + d * d) / (2 * d);
    const hh = Math.sqrt(Math.max(0, RA * RA - aa * aa));
    const mx = A.x + aa * ux, my = A.y + aa * uy;
    const p1 = { x: mx - hh * uy, y: my + hh * ux };
    const p2 = { x: mx + hh * uy, y: my - hh * ux };
    const dist = (p, q) => Math.hypot(p.x - q.x, p.y - q.y);
    const X1 = dist(p1, PHONE) < dist(p2, PHONE) ? p1 : p2; // the phone point
    const X2 = X1 === p1 ? p2 : p1;                          // the other crossing

    const t1 = ctx.cue("Add a second satellite");
    const tMeet = ctx.cue("Where the two spheres meet");
    const tTrace = ctx.cue("they trace a circle");

    // satellite B named: a ring marks it
    const tag = ctx.el("b_tag", { x: B.x - 110, y: B.y - 110, w: 220, h: 220, kind: "node" });
    // @form named_mark: a ring that marks the satellite just added
    const tr = S("circle", { cx: 110, cy: 110, r: 62, fill: "none", stroke: ctx.c("accent"), "stroke-width": 6, opacity: 0.9 }, tag.inner);
    m.reveal(tag, t1);
    Loom.drive((e) => { tr.setAttribute("r", (58 + 10 * Math.sin(e * Math.PI * 3)).toFixed(2)); }, t1, 1.8, "linear");
    tag.exit = "recede";
    m.exit(tag, t1 + 1.9, "recede");

    // circle_b: grows outward from B, accent while growing, then settles to line colour like circle_a
    const cb = ctx.el("circle_b", { x: 0, y: 0, w: 1920, h: 1080, kind: "connector" });
    [cb.inner, cb.E, cb, cb.inner.parentNode].forEach((n) => { if (n && n.setAttribute) n.setAttribute("data-bleed", "1"); });
    // @form range_circle: the second sphere drawn flat around satellite B, through the phone point
    const cid = "b15clip", cdefs = S("defs", {}, cb.inner), ccp = S("clipPath", { id: cid }, cdefs);
    S("rect", { x: 0, y: 0, width: 1920, height: 1080 }, ccp);
    const cbg = S("g", { "clip-path": "url(#" + cid + ")" }, cb.inner);
    const grow = S("circle", { cx: B.x, cy: B.y, r: 1, fill: "none", stroke: ctx.c("accent"), "stroke-width": 7, opacity: 0 }, cbg);
    const settled = S("circle", { cx: B.x, cy: B.y, r: RB, fill: "none", stroke: ctx.c("line"), "stroke-width": 4, opacity: 0 }, cbg);
    m.reveal(cb, t1 + 0.2);
    const gDur = Math.max(1.4, tMeet - t1 - 0.5);
    Loom.drive((e) => {
      grow.setAttribute("r", Math.max(1, RB * e).toFixed(2));
      grow.setAttribute("opacity", e > 0 ? 1 : 0);
    }, t1 + 0.3, gDur, "move");
    const tSet = t1 + 0.3 + gDur;
    Loom.drive((e) => {
      grow.setAttribute("opacity", (1 - e).toFixed(3));
      settled.setAttribute("opacity", (0.6 * e).toFixed(3));
    }, tSet + 0.1, 0.7, "move");

    // crossings brighten: a pulse and a steady ring at the phone point
    const cr = ctx.el("crossing", { x: X1.x - 100, y: X1.y - 100, w: 200, h: 200, kind: "node" });
    // @form crossing_mark: the place the two spheres meet, lit
    const crHalo = S("circle", { cx: 100, cy: 100, r: 30, fill: ctx.c("accent2"), opacity: 0 }, cr.inner);
    const crRing = S("circle", { cx: 100, cy: 100, r: 20, fill: "none", stroke: ctx.c("accent2"), "stroke-width": 5, opacity: 0 }, cr.inner);
    m.reveal(cr, tMeet);
    Loom.drive((e) => {
      crRing.setAttribute("r", (20 + 60 * e).toFixed(2));
      crRing.setAttribute("opacity", (e > 0 && e < 1 ? 0.9 * (1 - e) : 0).toFixed(3));
      crHalo.setAttribute("opacity", (0.4 * Math.min(1, e * 3)).toFixed(3));
    }, tMeet, 0.9, "move");

    // ring: a thin tilted ellipse through both crossings, accent, drawn from the phone point outward
    const rg = ctx.el("ring", { x: 0, y: 0, w: 1920, h: 1080, kind: "connector" });
    [rg.inner, rg.E, rg, rg.inner.parentNode].forEach((n) => { if (n && n.setAttribute) n.setAttribute("data-bleed", "1"); });
    const cx = (X1.x + X2.x) / 2, cy = (X1.y + X2.y) / 2;
    const rx = dist(X1, X2) / 2, ry = 84;
    const ang = Math.atan2(X1.y - X2.y, X1.x - X2.x) * 180 / Math.PI; // +x of the ellipse points at the phone point
    const tf = "rotate(" + ang.toFixed(3) + " " + cx.toFixed(2) + " " + cy.toFixed(2) + ")";
    // @form overlap_ring: the circle where the two spheres meet, seen as a thin tilted ellipse
    const rid = "b15rclip", rdefs = S("defs", {}, rg.inner), rcp = S("clipPath", { id: rid }, rdefs);
    S("rect", { x: 0, y: 0, width: 1920, height: 1080 }, rcp);
    const rgc = S("g", { "clip-path": "url(#" + rid + ")" }, rg.inner);
    const glow = S("ellipse", { cx, cy, rx, ry, fill: "none", stroke: ctx.c("accent"), "stroke-width": 18, opacity: 0, pathLength: 1000, "stroke-dasharray": "1000 1000", "stroke-dashoffset": 1000, transform: tf }, rgc);
    const line = S("ellipse", { cx, cy, rx, ry, fill: "none", stroke: ctx.c("accent"), "stroke-width": 7, "stroke-linecap": "round", opacity: 0, pathLength: 1000, "stroke-dasharray": "1000 1000", "stroke-dashoffset": 1000, transform: tf }, rgc);
    m.reveal(rg, tTrace);
    const rDur = Math.max(1.2, Math.min(1.8, ctx.speechEnd - tTrace - 0.2));
    Loom.drive((e) => {
      const o = (1000 * (1 - e)).toFixed(2);
      line.setAttribute("opacity", e > 0 ? 1 : 0); glow.setAttribute("opacity", e > 0 ? 0.22 : 0);
      line.setAttribute("stroke-dashoffset", o); glow.setAttribute("stroke-dashoffset", o);
    }, tTrace, rDur, "move");
  },
});
