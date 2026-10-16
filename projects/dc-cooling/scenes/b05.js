// @design closed_air_loop: a moving stream is followed to the device that changes its temperature, then back to where it started, closing a loop
/* b05 - "So where does the warm air go? To a cooling unit. It takes the heat out, and sends the air back cool."
 * Station: air_section, held from b04 (air_world and everything in it, see b04). The picture is added to, never rebuilt:
 *   return_stream   the server's three warm lanes merge, rise behind the server, arc right and land on the unit's top
 *   cooling_unit    a floor-standing cabinet with a cutaway window (surface, accent3) and a coil; its label hangs below it
 *   coil            the coil inside the window and the stream crossing it, where the beads turn from warm to cool
 *   supply_stream   one cool trunk leaves the unit low, runs along the floor, rises left of the server and splits into
 *                   the server's three front lanes
 * (A first version drew all three lanes nested all the way round; nine rows of beads read as a lattice, so each stream is
 * ONE trunk with a short merge or split at the server.)
 *
 * Look first: the TED-Ed data-centre reference (one map the film keeps adding to) and corporate-clean R1 (one named thing
 * at a time): the cooling unit is the one accent element here, named on "cooling unit" (accent ring and accent label), the
 * air keeps only its temperature colours.
 *
 * Three treatments considered (animation gate: motion only where the taught thing changes over time):
 *   A. A template card "warm air -> cooling unit -> cool air". Rejected: no place, and the loop would not close on the
 *      same server the viewer has just watched breathe.
 *   B. Cut to a floor plan with the unit. Rejected: that is the next section (b08 on); this one follows ONE stream.
 *   C. CHOSEN: the camera eases out so server and unit share the frame; a bead front travels along the return arcs and
 *      lands on the unit just as it settles ("To a cooling unit"); inside the cutaway the beads turn warm to cool as they
 *      cross the coil ("takes the heat out") while the coil takes the colour; a cool front runs back along the floor and
 *      into the server's front ("sends the air back cool"). Everything arrives on its own words and then keeps flowing.
 *
 * Beat sheet (words from the task's phrase timings):
 *   "So where does the warm air go"   labels retire; camera eases out (1.4 s); the return front starts along the arcs
 *   "To a cooling unit"               the unit and its coil settle where the stream lands; label Cooling unit (named)
 *   "It takes the heat out"           beads cross the coil and change colour; the coil takes on the warm colour
 *   "sends the air back cool"         the cool front runs low along the floor and into the front: the loop closes
 */
Loom.scene("b05", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const D = (k, f) => S.dur(k) * (f || 1);

    // ---- take over the held picture (b05's keep claims server_side, cool_stream and warm_stream)
    const W = ctx.held("air_world");
    ctx.held("room");
    ctx.held("label_front");
    ctx.held("label_back");
    const G = W.geo, srv = W.srv, P = W.inner;
    const { SX, SY, FLOOR, LY, UX, UY, UW, UH } = G;
    const cool = ctx.c("accent4"), warm = ctx.c("accent2");

    // ---- small helpers, stored on the world so b06 and b07 use the same ones
    // @form bead_stream: small beads travelling along a path, a front revealing them and a colour that follows position
    const dc = W.dc = {};
    // a value that is sent to a new value at an absolute time (a pure function of t, seek-safe)
    dc.tw = (initial, apply) => {
      const key = Loom.uid("dct"), T = { v: initial };
      apply(initial);
      T.to = (v, t, d, ease) => {
        const a = T.v; T.v = v;
        if (t == null) { apply(v); return t; }
        const dd = d > 0 ? d : 0.0001;
        Loom.drive((e) => apply(a + (v - a) * e), t, dd, ease || "move", { key, kind: "kit", content: true });
        return t + dd;
      };
      return T;
    };
    // a polyline through points with rounded corners (a corner never uses more than half of a shared segment)
    dc.rounded = (pts, r) => {
      const f = (v) => Math.round(v * 100) / 100;
      let d = "M" + f(pts[0][0]) + " " + f(pts[0][1]);
      for (let i = 1; i < pts.length - 1; i++) {
        const a = pts[i - 1], b = pts[i], c = pts[i + 1];
        const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]), l2 = Math.hypot(c[0] - b[0], c[1] - b[1]);
        const rr = Math.min(r, i === 1 ? l1 : l1 / 2, i === pts.length - 2 ? l2 : l2 / 2);
        const u1 = [(b[0] - a[0]) / l1, (b[1] - a[1]) / l1], u2 = [(c[0] - b[0]) / l2, (c[1] - b[1]) / l2];
        d += " L" + f(b[0] - u1[0] * rr) + " " + f(b[1] - u1[1] * rr) + " Q" + f(b[0]) + " " + f(b[1]) + " " + f(b[0] + u2[0] * rr) + " " + f(b[1] + u2[1] * rr);
      }
      return d + " L" + f(pts[pts.length - 1][0]) + " " + f(pts[pts.length - 1][1]);
    };
    // a wrapper element with a true box around world-coordinate content: draw into the returned group in WORLD coordinates
    dc.layer = (name, kind, box, o) => {
      o = o || {};
      const E = ctx.el(name, { x: box.x, y: box.y, w: box.w, h: box.h, kind, parent: P, exit: "none" });
      const g = Loom.svg("g", { transform: "translate(" + (-box.x) + " " + (-box.y) + ")" }, E.inner);
      return { E, g };
    };
    const bboxOf = (paths, pad) => {
      let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      paths.forEach((pts) => pts.forEach((p) => { x0 = Math.min(x0, p[0]); y0 = Math.min(y0, p[1]); x1 = Math.max(x1, p[0]); y1 = Math.max(y1, p[1]); }));
      return { x: Math.floor(x0 - pad), y: Math.floor(y0 - pad), w: Math.ceil(x1 - x0 + 2 * pad), h: Math.ceil(y1 - y0 + 2 * pad) };
    };
    // beads along a path (the kit's own bead look), revealed by a front that travels along the path, then flowing.
    // o: {gap, r, fill (token), colorAt(pt, f) -> hex, head, fadeStart, fadeEnd}
    dc.stream = (parent, d, o) => {
      o = o || {};
      const g = Loom.svg("g", {}, parent);
      const ruler = Loom.svg("path", { d, fill: "none", stroke: "none" }, g);
      const L = ruler.getTotalLength(), n = Math.max(2, Math.round(L / (o.gap || 34))), gap = L / n;
      const r0 = o.r || 6, rimCol = ctx.c("surface"), hs = 15;
      const dots = [];
      for (let i = 0; i < n; i++) dots.push(Loom.svg("circle", { r: r0, cx: -50, cy: -50, fill: "none", stroke: rimCol, "stroke-width": 6, "paint-order": "stroke", opacity: 0 }, g));
      const hd = o.head ? Loom.svg("polygon", { points: "", fill: "none", opacity: 0 }, g) : null;
      const LUT = [];
      for (let k = 0; k <= 32; k++) LUT.push(o.fill ? ctx.c(o.fill) : o.colorAt(ruler.getPointAtLength(L * k / 32), k / 32));
      const colAt = (f) => LUT[Math.max(0, Math.min(32, Math.round(f * 32)))];
      const st = { phase: 0, front: 0 };
      const render = () => {
        const lim = st.front * L;
        for (let i = 0; i < n; i++) {
          const pos = ((i + 0.5 + st.phase) % n) * gap;
          let a = 1;
          if (o.fadeStart !== false) a = Math.min(a, pos / (gap * 0.8));
          if (o.fadeEnd !== false) a = Math.min(a, (L - pos) / (gap * (hd ? 1.5 : 0.8)));
          if (st.front < 0.9999) a = Math.min(a, (lim - pos) / (gap * 0.6));
          const p = ruler.getPointAtLength(pos), dt = dots[i];
          dt.setAttribute("cx", Math.round(p.x * 100) / 100); dt.setAttribute("cy", Math.round(p.y * 100) / 100);
          dt.setAttribute("fill", colAt(pos / L));
          dt.setAttribute("opacity", Math.round(Math.max(0, Math.min(1, a)) * 100) / 100);
        }
        if (hd) {
          const tip = ruler.getPointAtLength(L), b = ruler.getPointAtLength(Math.max(0, L - hs));
          const ang = Math.atan2(tip.y - b.y, tip.x - b.x), nx = -Math.sin(ang), ny = Math.cos(ang), w = hs * 0.62;
          const bx = tip.x - Math.cos(ang) * hs, by = tip.y - Math.sin(ang) * hs;
          hd.setAttribute("points", tip.x.toFixed(1) + "," + tip.y.toFixed(1) + " " + (bx + nx * w).toFixed(1) + "," + (by + ny * w).toFixed(1) + " " + (bx - nx * w).toFixed(1) + "," + (by - ny * w).toFixed(1));
          hd.setAttribute("fill", colAt(1));
          hd.setAttribute("opacity", Math.round(Math.max(0, Math.min(1, (st.front - 0.95) / 0.05)) * 100) / 100);
        }
      };
      render();
      const fkey = Loom.uid("dcf");
      const S_ = {
        L,
        // the front travels from the start of the path to its end between t and t + d (beads appear as it passes)
        reveal: null,
        flow(t0, t1, fo) {
          const k = Math.max(1, Math.round((t1 - t0) * ((fo && fo.speed) || 120) / gap));
          Loom.drive((e, raw) => { st.phase = (raw * k) % 1; render(); }, t0, t1 - t0, "linear", { key: fkey, kind: "flow", content: true });
          return t1;
        },
      };
      const frontT = dc.tw(0, (v) => { st.front = v; render(); });
      S_.reveal = (t, d, ease) => frontT.to(1, t, d, ease || "linear");
      S_.setFront = (v) => frontT.to(v, null);
      return S_;
    };
    // the kit's label look: a white pill on a thin muted leader to the thing it names; `named` turns it accent
    // @form hung_pill_label: a white pill label on a thin leader hung from the thing it names, turning accent while named
    dc.label = (name, text, cx, cy, to, o) => {
      o = o || {};
      const size = o.size || 30, pad = 26, h = 54;
      const w = Math.ceil(kit.measure(text, "label", size, 700)) + 2 * pad;
      const x0 = cx - w / 2, y0 = cy - h / 2;
      const box = { x: Math.floor(Math.min(x0, to.x - 8)), y: Math.floor(Math.min(y0, to.y - 8)) };
      box.w = Math.ceil(Math.max(x0 + w + 6, to.x + 8) - box.x); box.h = Math.ceil(Math.max(y0 + h + 12, to.y + 8) - box.y);
      const L = dc.layer(name, "label", box), g = L.g;
      const sy = to.y > cy ? y0 + h : y0, sx = Math.max(x0 + h / 2, Math.min(to.x, x0 + w - h / 2));
      kit.line(g, sx, sy, to.x, to.y, { stroke: "muted", sw: 2 });
      kit.disc(g, to.x, to.y, 5, { fill: "muted", shadow: false });
      kit.pill(g, x0, y0, w, h, { fill: "surface" });
      const over = Loom.svg("g", {}, g);
      kit.pill(over, x0, y0, w, h, { fill: "accent", shadow: false });
      over.setAttribute("opacity", 0);
      const tx = kit.text(g, text, { role: "label", size, weight: 700, x: x0 + 8, y: y0, w: w - 16, h, align: "center", valign: "middle", maxLines: 1, color: "ink" });
      const ink = ctx.c("ink"), onA = ctx.c("onAccent");
      const named = dc.tw(0, (v) => { over.setAttribute("opacity", Math.round(v * 100) / 100); tx.setAttribute("fill", S.mix(ink, onA, v)); });
      return { E: L.E, named, w, h };
    };
    // the camera on the world (set in b04); the same call as there
    dc.cam = W.cam;

    // ---- geometry: ONE trunk per stream. The server's three air lanes merge into the return trunk behind the server and the
    // supply trunk splits into three lanes in front of it, so the loop reads as one band, not nine rows of beads.
    const R = 22;
    const xMid = UX + UW / 2;                            // the unit's centre line: the return lands on its top, the beads go down it
    const xRise = SX + 980;                              // the return trunk rises here, between the server and the unit
    const yTop = 300;                                    // top of the return arc
    const yLow = UY + 348;                               // where the beads leave the unit, low on its left face
    const xUpC = SX - 74;                                // the supply trunk rises here, left of the server
    const retTrunk = [[SX + 906, LY[1]], [xRise, LY[1]], [xRise, yTop], [xMid, yTop], [xMid, UY]];
    const retMerge = [0, 2].map((k) => "M" + (SX + 906) + " " + LY[k] + " C" + (SX + 934) + " " + LY[k] + " " + (SX + 934) + " " + LY[1] + " " + (SX + 962) + " " + LY[1]);
    const inTrunk = [[xMid, UY + 4], [xMid, yLow], [UX + 4, yLow]];
    const supTrunk = [[UX - 4, yLow], [xUpC, yLow], [xUpC, LY[1]], [SX - 4, LY[1]]];
    const supSplit = [0, 2].map((k) => "M" + (SX - 58) + " " + LY[1] + " C" + (SX - 34) + " " + LY[1] + " " + (SX - 34) + " " + LY[k] + " " + (SX - 4) + " " + LY[k]);
    const COIL0 = UY + 110, COIL1 = UY + 250;            // the coil's rows lie between these y's

    // ---- the cooling unit: a cabinet with a top intake, a cutaway window and low louvres on its left face
    // @form floor_standing_cabinet: a tall white cabinet with a top intake grille, a cutaway window onto its inner part and low louvres
    const unit = ctx.el("cooling_unit", { x: UX - 16, y: UY - 16, w: UW + 32, h: UH + 32, kind: "instrument", parent: P, exit: "none" });
    const U = Loom.svg("g", { transform: "translate(16 16)" }, unit.inner);
    kit.rect(U, 0, 0, UW, UH, { fill: "surface", r: 16 });
    kit.rect(U, 24, 12, 152, 26, { fill: "surface2", r: 8, shadow: false });
    [19, 25, 31].forEach((y) => kit.line(U, 44, y, 156, y, { stroke: "line", sw: 2 }));
    kit.rect(U, 22, 90, 156, 180, { fill: "field2", r: 12, shadow: false });
    kit.rect(U, 14, UH - 16, UW - 28, 10, { fill: "accent3", r: 4, shadow: false });
    kit.rect(U, 0, 306, 16, 76, { fill: "surface2", r: 4, shadow: false });
    [320, 348, 376].forEach((y) => kit.rect(U, 0, y - 3, 16, 6, { fill: "muted", r: 2, shadow: false }));
    // the named state: an accent ring around the whole cabinet while the narration names it
    const ring = Loom.svg("rect", { x: -12, y: -12, width: UW + 24, height: UH + 24, rx: 24, fill: "none", stroke: ctx.c("accent"), "stroke-width": 5, opacity: 0 }, U);
    const ringT = dc.tw(0, (v) => ring.setAttribute("opacity", Math.round(v * 100) / 100));
    W.ringT = ringT;

    // ---- the coil inside the window, and the beads that cross it (one element: the stream recolours AT the coil)
    const cb = bboxOf([inTrunk], 20);
    const coil = dc.layer("coil", "instrument", cb);
    const cg = coil.g;
    for (let x = UX + 44; x <= UX + 156; x += 14) kit.line(cg, x, UY + 100, x, UY + 260, { stroke: "surface", sw: 4 });
    const cx0 = UX + 44, cx1 = UX + 156, yr = [UY + 120, UY + 160, UY + 200, UY + 240];
    const coilD = "M" + cx1 + " " + yr[0] + " H" + cx0 + " a20 20 0 0 0 0 40 H" + cx1 + " a20 20 0 0 1 0 40 H" + cx0 + " a20 20 0 0 0 0 40 H" + cx1;
    const coilPath = kit.path(cg, coilD, { stroke: "accent3", sw: 8 });
    const coilCol0 = ctx.c("accent3"), coilCol1 = S.mix(ctx.c("accent3"), warm, 0.8);
    const coilT = dc.tw(0, (v) => coilPath.setAttribute("stroke", S.mix(coilCol0, coilCol1, v)));
    // beads in the unit: warm above the coil, cooling across it, cool below
    const inColor = (p) => S.mix(warm, cool, Math.max(0, Math.min(1, (p.y - COIL0) / (COIL1 - COIL0))));
    const inStreams = [dc.stream(cg, dc.rounded(inTrunk, R), { colorAt: inColor, fadeStart: false, fadeEnd: false })];

    // ---- the return stream (warm) arcs into the unit's top; the supply stream (cool) runs low back to the server
    const ret = dc.layer("return_stream", "token", bboxOf([retTrunk, [[SX + 906, LY[0]], [SX + 962, LY[2]]]], 20));
    const retStreams = [dc.stream(ret.g, dc.rounded(retTrunk, R), { fill: "accent2", head: true })]
      .concat(retMerge.map((d) => dc.stream(ret.g, d, { fill: "accent2", fadeEnd: false })));
    const sup = dc.layer("supply_stream", "token", bboxOf([supTrunk, [[SX - 58, LY[0]], [SX - 4, LY[2]]]], 20));
    const supStreams = [dc.stream(sup.g, dc.rounded(supTrunk, R), { fill: "accent4", head: true, fadeStart: false })]
      .concat(supSplit.map((d) => dc.stream(sup.g, d, { fill: "accent4", head: true })));

    // ---- label hung below the unit (the leader meets the cabinet's base)
    const uLab = dc.label("unit_label", "Cooling unit", UX + UW / 2, FLOOR + 62, { x: UX + UW / 2, y: FLOOR }, {});

    // store what b06 and b07 need
    dc.unit = { unit, coil: coil.E, ret: ret.E, sup: sup.E, ringT, coilT, inStreams, retStreams, supStreams, uLab, ring };

    // ---- times, all from the narration
    const t0 = ctx.cue("So where does the warm air go");
    const tUnit = ctx.cue("To a cooling unit");
    const tUnitWord = ctx.cue("cooling unit");
    const tTake = ctx.cue("It takes the heat out");
    const tBack = ctx.cue("sends the air back cool");

    // "So where does the warm air go": the face labels retire, the camera eases out to hold server and unit, and the
    // warm front leaves the back and travels the arcs, landing on the unit's top as it settles
    srv.hide("label_front", t0, { dur: D("exit") });
    srv.hide("label_back", t0, { dur: D("exit") });
    dc.cam({ x: 70, y: 270, w: 1340, h: 630 }, t0, 1.4, { margin: 0, maxScale: 1.3, cx: 960, cy: 478 });
    retStreams[0].reveal(t0 + 0.2, tUnit - (t0 + 0.2), "linear");
    retStreams.slice(1).forEach((s) => s.reveal(t0 + 0.2, 0.5, "linear"));

    // "To a cooling unit": the unit and its coil settle where the stream lands; the label is the one named thing
    m.settle(unit, tUnit, { dy: 24 });
    m.settle(coil.E, tUnit, { dy: 24 });
    m.reveal(uLab.E, tUnitWord + 0.1, { dy: 10 });
    uLab.named.to(1, tUnitWord + 0.15, 0.3);
    ringT.to(1, tUnitWord + 0.1, 0.35);

    // "It takes the heat out": the beads cross the coil and change colour, the coil takes the heat
    inStreams.forEach((s) => s.reveal(tTake, 1.5, "linear"));
    coilT.to(1, tTake + 0.6, 1.0);

    // "sends the air back cool": the cool front runs low along the floor and into the front: the loop closes
    supStreams[0].reveal(tBack, 1.9, "linear");
    supStreams.slice(1).forEach((s) => s.reveal(tBack + 1.75, 0.45, "linear"));

    // everything flows to the end of the beat (period-locked); the server's own beads flow on as well
    srv.flow(ctx.start, ctx.end, { speed: 120 });
    retStreams.forEach((s) => s.flow(t0 + 0.2, ctx.end, { speed: 120 }));
    inStreams.forEach((s) => s.flow(tTake, ctx.end, { speed: 120 }));
    supStreams.forEach((s) => s.flow(tBack, ctx.end, { speed: 120 }));
  },
});
