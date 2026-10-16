Loom.lesson = Loom.lesson || {};

/* dc-cooling lesson kit (corporate-clean, tokens only, no people).
 * Five parts that two or more beats show: heat_route, server_side, floor_plan, rack, energy_fraction.
 *
 * Contract: a part DRAWS, it never reveals itself. It builds into `parent` at its natural size (opts.w / opts.h
 * scale it uniformly, opts.x / opts.y offset it) and returns a handle. Everything that changes is a pure function of
 * time: handle methods schedule drives on the master timeline at an ABSOLUTE time t (null = set while building).
 * Calls for one thing must be made in time order (the part remembers where each thing was last sent).
 *
 * Shared vocabulary of every handle:
 *   h.root                the part's group (transform it with m.* through the element you put it in)
 *   h.size                {w, h}: the drawn size (natural size times the scale)
 *   h.anchors             named points and rects in the PARENT's coordinates (scaled, offset)
 *   h.pieces              names of the pieces a beat may bring in and out
 *   h.reveal(name, t, {dur, dy})   h.hide(name, t, {dur})   h.set(name, 0|1)   piece visibility (own opacity)
 *   h.setState(name, t, {dur})     move the whole part to a declared state (returns the end time)
 * Temperature code: cool = accent4, warm = accent2, the thing being named = accent, neutral = surface / ink / line.
 */
(function () {
  "use strict";
  const sv = (tag, attrs, p, text) => Loom.svg(tag, attrs, p, text);
  const grp = (p, attrs) => sv("g", attrs || {}, p);
  const f2 = (v) => Math.round(v * 100) / 100;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const S = () => Loom.style;
  const dur = (k, f) => { try { const v = S().dur(k); return typeof v === "number" ? v : f; } catch (e) { return f; } };

  // ---------------------------------------------------------------------------------------------
  // value trackers: a number (or a record of numbers) that is sent to a new value at an absolute time.
  // The drive writes straight to attributes, so any seek lands on the same frame. t == null sets it while building.
  // ---------------------------------------------------------------------------------------------
  function track(initial, apply) {
    const key = Loom.uid("dck");
    const T = { v: initial, key };
    apply(initial);
    T.to = function (v, t, d, ease) {
      const a = T.v;
      T.v = v;
      if (t == null) { apply(v); return t; }
      const dd = d > 0 ? d : 0.0001;
      Loom.drive((e) => apply(a + (v - a) * e), t, dd, ease || "move", { key, kind: "kit", content: true });
      return t + dd;
    };
    return T;
  }
  // a record of numbers where each field has its own timeline (e.g. the height of each energy block)
  function trackN(initial, apply) {
    const key = Loom.uid("dckn");
    const live = Object.assign({}, initial), cur = Object.assign({}, initial);
    apply(live);
    const T = { live, cur, key };
    T.to = function (field, v, t, d, ease) {
      const a = cur[field];
      cur[field] = v;
      if (t == null) { live[field] = v; apply(live); return t; }
      const dd = d > 0 ? d : 0.0001;
      Loom.drive((e) => { live[field] = a + (v - a) * e; apply(live); }, t, dd, ease || "move", { key, kind: "kit", content: true });
      return t + dd;
    };
    return T;
  }

  // a piece: a group a beat may bring in and out (opacity, and an optional small drop from `dy` px below)
  function piece(parent, o) {
    o = o || {};
    const g = grp(parent);
    const P = { g, dy: o.dy || 0 };
    P.T = track(1, (v) => {
      g.setAttribute("opacity", f2(v));
      if (P.dy) g.setAttribute("transform", "translate(0 " + f2(P.dy * (1 - v)) + ")");
    });
    return P;
  }

  function base(ctx, parent, opts, NW, NH) {
    opts = opts || {};
    let s = 1;
    if (opts.w && opts.h) s = Math.min(opts.w / NW, opts.h / NH);
    else if (opts.w) s = opts.w / NW;
    else if (opts.h) s = opts.h / NH;
    const ox = opts.x || 0, oy = opts.y || 0;
    const root = grp(parent, { transform: "translate(" + ox + " " + oy + ") scale(" + f2(s * 1000) / 1000 + ")" });
    const B = { root, s, ox, oy, NW, NH, w: NW * s, h: NH * s, pieces: {} };
    B.A = (x, y) => ({ x: ox + s * x, y: oy + s * y });
    B.R = (x, y, w, h) => ({ x: ox + s * x, y: oy + s * y, w: s * w, h: s * h });
    B.mk = function (name, p, o) { const pc = piece(p, o); B.pieces[name] = pc; return pc; };
    const need = (name) => { const pc = B.pieces[name]; if (!pc) throw new Error("unknown piece '" + name + "' (have: " + Object.keys(B.pieces).join(", ") + ")"); return pc; };
    B.set = function (name, v) { need(name).T.to(v ? 1 : 0, null); };
    B.reveal = function (name, t, o) { o = o || {}; const pc = need(name); if (o.dy != null) pc.dy = o.dy; return pc.T.to(1, t, o.dur != null ? o.dur : dur("enter", 0.5), "enter"); };
    B.hide = function (name, t, o) { o = o || {}; return need(name).T.to(0, t, o.dur != null ? o.dur : dur("exit", 0.3), "exit"); };
    B.finish = function (h) {
      h.root = root; h.size = { w: B.w, h: B.h }; h.scale = s;
      h.pieces = Object.keys(B.pieces);
      h.reveal = B.reveal; h.hide = B.hide; h.set = B.set;
      h.piece = (name) => need(name).g;
      (opts.hide || []).forEach((n) => B.set(n, 0));
      return h;
    };
    return B;
  }

  // ---------------------------------------------------------------------------------------------
  // streams: a chain of beads along a path, flowing, recoloured by position. Cool and warm come from the tokens.
  // opts: {d, gap, r, color(f) -> hex, fill (token, constant), head (bool), fadeStart, fadeEnd, rim}
  // ---------------------------------------------------------------------------------------------
  function stream(ctx, parent, d, o) {
    o = o || {};
    const g = grp(parent);
    const ruler = sv("path", { d, fill: "none", stroke: "none" }, g);
    const L = ruler.getTotalLength();
    const want = o.gap || 34;
    const n = Math.max(2, Math.round(L / want));
    const gap = L / n;
    const rim = o.rim === false ? 0 : (o.rimW || 6);
    const rimCol = ctx.c("surface");
    const dots = [];
    for (let i = 0; i < n; i++) {
      dots.push(sv("circle", { r: o.r || 6, cx: -50, cy: -50, fill: "none", stroke: rim ? rimCol : "none", "stroke-width": rim, "paint-order": "stroke" }, g));
    }
    const hs = o.headSize || 15;
    const hd = o.head === false ? null : sv("polygon", { points: "", fill: "none" }, g);
    const fadeStart = o.fadeStart !== false, fadeEnd = o.fadeEnd !== false;
    // colour: a lookup table over the path, optionally pulled toward a tint colour
    const LUT = [];
    const col0 = o.fill ? ctx.c(o.fill) : null;
    for (let k = 0; k <= 32; k++) LUT.push(col0 || (o.color ? o.color(k / 32) : ctx.c("accent4")));
    const tintCol = ctx.c(o.tintTo || "accent2");
    const st = { phase: 0, tint: 0, r: o.r || 6, op: 1 };
    const colAt = (f) => {
      const c = LUT[clamp(Math.round(f * 32), 0, 32)];
      return st.tint > 0.001 ? S().mix(c, tintCol, st.tint) : c;
    };
    function render() {
      for (let i = 0; i < n; i++) {
        const pos = ((i + 0.5 + st.phase) % n) * gap;
        const p = ruler.getPointAtLength(pos);
        let a = 1;
        if (fadeStart) a = Math.min(a, pos / (gap * 0.8));
        if (fadeEnd) a = Math.min(a, (L - pos) / (gap * (hd ? 1.5 : 0.8)));
        const dt = dots[i];
        dt.setAttribute("cx", f2(p.x)); dt.setAttribute("cy", f2(p.y));
        dt.setAttribute("r", f2(st.r));
        dt.setAttribute("fill", colAt(pos / L));
        dt.setAttribute("opacity", f2(clamp(a, 0, 1)));
      }
      if (hd) {
        const tip = ruler.getPointAtLength(L), b = ruler.getPointAtLength(Math.max(0, L - hs));
        const ang = Math.atan2(tip.y - b.y, tip.x - b.x), nx = -Math.sin(ang), ny = Math.cos(ang);
        const bx = tip.x - Math.cos(ang) * hs, by = tip.y - Math.sin(ang) * hs, w = hs * 0.62;
        hd.setAttribute("points", f2(tip.x) + "," + f2(tip.y) + " " + f2(bx + nx * w) + "," + f2(by + ny * w) + " " + f2(bx - nx * w) + "," + f2(by - ny * w));
        hd.setAttribute("fill", colAt(1));
      }
    }
    render();
    const key = Loom.uid("dcks");
    const S_ = {
      g, L, n, gap, ruler,
      point: (f) => ruler.getPointAtLength(L * f),
      setPhase(p) { st.phase = p; render(); },
      setTint(v) { st.tint = v; render(); },
      setR(v) { st.r = v; render(); },
      // flow: the beads travel along the path between t0 and t1, a whole number of gaps, so it ends where it began
      flow(t0, t1, fo) {
        fo = fo || {};
        const k = Math.max(1, Math.round((t1 - t0) * (fo.speed || 120) / gap));
        Loom.drive((e, raw) => { st.phase = (raw * k) % 1; render(); }, t0, t1 - t0, "linear", { key, kind: "flow", content: true });
        return t1;
      },
      tintTo(v, t, dd) { return S_.tintT.to(v, t, dd); },
      radiusTo(v, t, dd) { return S_.radT.to(v, t, dd); },
    };
    S_.tintT = track(0, (v) => { st.tint = v; render(); });
    S_.radT = track(o.r || 6, (v) => { st.r = v; render(); });
    return S_;
  }

  // ---------------------------------------------------------------------------------------------
  // pill label hung on a thing: a white pill with a thin leader to the thing. `named` turns the pill accent (the one
  // thing the narration is naming). Words come from the caller only.
  // ---------------------------------------------------------------------------------------------
  function pill(ctx, parent, text, cx, cy, o) {
    o = o || {};
    const kit = ctx.kit, size = o.size || 30, pad = 26, h = 54;
    const w = Math.ceil(kit.measure(text, "label", size, 700)) + 2 * pad;
    const x0 = cx - w / 2, y0 = cy - h / 2;
    const g = grp(parent);
    if (o.to) {
      const tx = o.to.x, ty = o.to.y;
      const sy = ty > cy ? y0 + h : y0;
      const sx = clamp(tx, x0 + h / 2, x0 + w - h / 2);
      kit.line(g, sx, sy, tx, ty, { stroke: "muted", sw: 2 });
      kit.disc(g, tx, ty, 5, { fill: "muted", shadow: false });
    }
    kit.pill(g, x0, y0, w, h, { fill: "surface" });
    const over = grp(g);
    kit.pill(over, x0, y0, w, h, { fill: "accent", shadow: false });
    over.setAttribute("opacity", 0);
    const tx = kit.text(g, text, { role: "label", size, weight: 700, x: x0 + 8, y: y0, w: w - 16, h, align: "center", valign: "middle", maxLines: 1, color: "ink" });
    const ink = ctx.c("ink"), onA = ctx.c("onAccent");
    const named = track(0, (v) => { over.setAttribute("opacity", f2(v)); tx.setAttribute("fill", S().mix(ink, onA, v)); });
    return { g, w, h, x: x0, y: y0, cx, cy, named, text: tx };
  }

  // a small inline arrow head (filled triangle) at (x, y) pointing along angle a
  function headAt(parent, x, y, a, size, fill) {
    const nx = -Math.sin(a), ny = Math.cos(a), bx = x - Math.cos(a) * size, by = y - Math.sin(a) * size, w = size * 0.62;
    return sv("polygon", { points: f2(x) + "," + f2(y) + " " + f2(bx + nx * w) + "," + f2(by + ny * w) + " " + f2(bx - nx * w) + "," + f2(by - ny * w), fill }, parent);
  }

  // a fan module seen from the side: a rounded block with a chevron for the direction of the air
  function fanModule(ctx, p, x, y, w, h) {
    const kit = ctx.kit;
    kit.rect(p, x, y, w, h, { fill: "muted", r: 8, shadow: false });
    const cx = x + w / 2, cy = y + h / 2, a = Math.min(w, h) * 0.2;
    kit.path(p, "M" + f2(cx - a * 0.7) + " " + f2(cy - a * 1.4) + " L" + f2(cx + a * 0.7) + " " + f2(cy) + " L" + f2(cx - a * 0.7) + " " + f2(cy + a * 1.4), { stroke: "surface", sw: 4 });
  }


  // a fan seen from the front: a disc, three blades, a hub (a guard ring when `guard`)
  function fanGlyph(ctx, p, cx, cy, r, guard) {
    const kit = ctx.kit;
    kit.disc(p, cx, cy, r, { fill: "surface2", shadow: false });
    if (guard) kit.disc(p, cx, cy, r * 0.92, { fill: "none", stroke: "line", sw: 3, shadow: false });
    for (let k = 0; k < 3; k++) {
      sv("ellipse", { cx, cy: cy - r * 0.46, rx: r * 0.2, ry: r * 0.4, fill: ctx.c("accent3"), transform: "rotate(" + (k * 120 + 20) + " " + cx + " " + cy + ")" }, p);
    }
    kit.disc(p, cx, cy, r * 0.17, { fill: "muted", shadow: false });
  }

  // =============================================================================================
  // server_side, natural 900 x 360. One server in side view, front (intake) on the LEFT, back (exhaust) on the RIGHT.
  //
  // Anatomy, back to front: chassis (surface, soft shadow) > bay (surface2) > fan columns (muted modules with a
  // chevron for the air) > board strip (accent3) > memory (4 slim modules), chip (ink) under a heatsink (air form) or a
  // cold plate (liquid form), two power supplies > heat zones (accent2 wash over the hot parts) > air lanes (three
  // bead streams, each in an intake half and an exhaust half, cool turning warm over the hot parts) > hoses (liquid
  // form: cool in at the top, warm out of the back) > labels (hung below the chassis, hidden until revealed).
  //
  // States: air (heatsink, three air lanes), liquid (cold plate on the chip, the two hoses, ONE thinner air lane).
  // opts: {state: "air" | "liquid", labels: {front, back, air} or false, hoses: false (no hoses), streams: false
  //        (no air beads), hide: [piece names]}
  // Pieces: intake (cool halves of the air lanes), exhaust (warm halves), hoses, label_front, label_back, label_air.
  // Handle: setState(name, t, {dur}), flow(t0, t1, {speed}), chipHeat(v, t, dur) (chip ink -> warm), tintIntake(v, t),
  //   streams {intake:[3], exhaust:[3]}, anchors {front, back, chip, plate, lanes:[y,y,y], chassis (rect)}.
  // =============================================================================================
  Loom.lesson.server_side = function (ctx, parent, opts) {
    opts = opts || {};
    const kit = ctx.kit;
    const B = base(ctx, parent, opts, 900, 360);
    const g = B.root;
    const lab = opts.labels === false ? {} : Object.assign({ front: "Front: cool in", back: "Back: warm out", air: "Still needs air" }, opts.labels || {});
    const withStreams = opts.streams !== false, withHoses = opts.hoses !== false;
    const liquid0 = opts.state === "liquid" ? 1 : 0;

    // chassis and bay
    const body = grp(g);
    kit.rect(body, 70, 70, 760, 230, { fill: "surface", r: 16, stroke: "surface2", sw: 2 });
    kit.rect(body, 82, 82, 736, 206, { fill: "surface2", r: 10, shadow: false });
    // fan columns: front (intake) left, back (exhaust) right
    [94, 158, 222].forEach((y) => { fanModule(ctx, body, 90, y, 40, 56); fanModule(ctx, body, 770, y, 40, 56); });
    // board, memory, chip, power supplies
    kit.rect(body, 140, 272, 620, 12, { fill: "accent3", r: 3, shadow: false });
    for (let i = 0; i < 4; i++) kit.rect(body, 236 + i * 22, 196, 14, 76, { fill: "muted", r: 3, shadow: false });
    [590, 678].forEach((x) => {
      kit.rect(body, x, 206, 78, 66, { fill: "accent3", r: 8, shadow: false });
      [222, 236, 250].forEach((y) => kit.line(body, x + 14, y, x + 64, y, { stroke: "surface2", sw: 3 }));
    });
    const chip = sv("rect", { x: 400, y: 254, width: 100, height: 18, rx: 4, fill: ctx.c("ink") }, body);
    const chipHeat = track(0, (v) => chip.setAttribute("fill", S().mix(ctx.c("ink"), ctx.c("accent2"), v)));

    // heat zones (a soft warm wash over what gets hot)
    const zones = grp(g);
    const zoneHS = grp(zones);
    kit.rect(zoneHS, 372, 160, 156, 116, { fill: "accent2", r: 14, shadow: false, opacity: 0.1 });
    kit.rect(zones, 226, 184, 118, 92, { fill: "accent2", r: 14, shadow: false, opacity: 0.08 });
    kit.rect(zones, 580, 194, 178, 82, { fill: "accent2", r: 14, shadow: false, opacity: 0.08 });

    // heatsink (air form) and cold plate (liquid form) sit on the chip
    const sink = grp(g);
    kit.rect(sink, 384, 242, 132, 12, { fill: "muted", r: 3, shadow: false });
    for (let i = 0; i < 9; i++) kit.rect(sink, 392 + i * 14, 176, 8, 66, { fill: "accent3", r: 2, shadow: false });
    const plate = grp(g);
    kit.rect(plate, 392, 228, 116, 26, { fill: "muted", r: 5, shadow: false });
    kit.rect(plate, 408, 212, 20, 16, { fill: "accent4", r: 3, shadow: false });
    kit.rect(plate, 472, 212, 20, 16, { fill: "accent2", r: 3, shadow: false });

    // air lanes: three, each an intake half (x 0..450) and an exhaust half (450..900); cool turns warm over x 240..640
    const cool = ctx.c("accent4"), warm = ctx.c("accent2");
    const ramp = (x) => S().mix(cool, warm, clamp((x - 240) / 400, 0, 1));
    const LANES = [122, 186, 250];
    const intakeP = B.mk("intake", g), exhaustP = B.mk("exhaust", g);
    const streams = { intake: [], exhaust: [] }, laneG = { intake: [], exhaust: [] };
    if (withStreams) {
      LANES.forEach((y, k) => {
        const gi = grp(intakeP.g), ge = grp(exhaustP.g);
        laneG.intake.push(gi); laneG.exhaust.push(ge);
        const r = k === 2 && liquid0 ? 4.5 : 6;
        streams.intake.push(stream(ctx, gi, "M 0 " + y + " H 450", { gap: 450 / 13, r, head: false, fadeEnd: false, color: (f) => ramp(f * 450) }));
        streams.exhaust.push(stream(ctx, ge, "M 450 " + y + " H 898", { gap: 450 / 13, r, head: true, fadeStart: false, color: (f) => ramp(450 + f * 450) }));
      });
    }

    // hoses (liquid form): the cool one in along the top, the warm one out of the back
    const hosesP = B.mk("hoses", g);
    const hosesS = grp(hosesP.g);
    const coolD = "M 900 104 H 418 V 214", warmD = "M 482 214 V 140 H 900";
    const hoseCool = kit.path(hosesS, coolD, { stroke: "accent4", sw: 12 });
    const hoseWarm = kit.path(hosesS, warmD, { stroke: "accent2", sw: 12 });
    const beads = [];
    if (withHoses) {
      beads.push(stream(ctx, hosesS, coolD, { gap: 40, r: 3.6, rim: false, head: false, fill: "surface", fadeStart: true, fadeEnd: true }));
      beads.push(stream(ctx, hosesS, warmD, { gap: 40, r: 3.6, rim: false, head: false, fill: "surface", fadeStart: true, fadeEnd: true }));
    }

    // labels hung below the chassis (hidden until revealed), words only from opts.labels
    const pills = {};
    const mkLabel = (key, text, cx, tx, ty) => {
      if (!text) return;
      const pc = B.mk("label_" + key, g);
      pills[key] = pill(ctx, pc.g, text, cx, 332, { to: { x: tx, y: ty } });
      B.set("label_" + key, 0);
    };
    mkLabel("front", lab.front, 150, 100, 280);
    mkLabel("air", lab.air, 450, 450, 256);
    mkLabel("back", lab.back, 740, 800, 280);

    // state: 0 = air, 1 = liquid (one tracker moves heatsink, plate, hoses, the two spare lanes and the lane radius)
    const stateT = track(liquid0, (v) => {
      sink.setAttribute("opacity", f2(1 - v)); zoneHS.setAttribute("opacity", f2(1 - v));
      plate.setAttribute("opacity", f2(v));
      hosesS.setAttribute("opacity", f2(withHoses ? Math.min(1, v * 1.2) : 0));
      [0, 1].forEach((k) => { laneG.intake[k] && laneG.intake[k].setAttribute("opacity", f2(1 - v)); laneG.exhaust[k] && laneG.exhaust[k].setAttribute("opacity", f2(1 - v)); });
      if (streams.intake[2]) { streams.intake[2].setR(6 - 1.5 * v); streams.exhaust[2].setR(6 - 1.5 * v); }
    });
    const h = {
      streams, hoses: { cool: hoseCool, warm: hoseWarm, beads },
      nodes: { chip, sink, plate, body, zones },
      pills,
      state: () => (stateT.v >= 0.5 ? "liquid" : "air"),
      setState(name, t, o) {
        if (name !== "air" && name !== "liquid") throw new Error("server_side: unknown state '" + name + "' (air | liquid)");
        return stateT.to(name === "liquid" ? 1 : 0, t, (o && o.dur) != null ? o.dur : dur("enter", 0.5) * 1.2);
      },
      // all visible beads travel between t0 and t1 (period-locked: ends where it began)
      flow(t0, t1, o) {
        o = o || {};
        const all = streams.intake.concat(streams.exhaust);
        all.forEach((s) => s.flow(t0, t1, o));
        beads.forEach((s) => s.flow(t0, t1, { speed: (o.speed || 120) * 0.8 }));
        return t1;
      },
      chipHeat: (v, t, d) => chipHeat.to(v, t, d),
      // pull the intake beads toward warm (recirculated air breathed in), 0 = as built
      tintIntake: (v, t, d) => { streams.intake.forEach((s) => s.tintTo(v, t, d)); return t; },
      namePill: (key, v, t, d) => (pills[key] ? pills[key].named.to(v, t, d) : t),
      anchors: {
        front: B.A(70, 186), back: B.A(830, 186), chip: B.A(450, 263), plate: B.A(450, 241),
        lanes: LANES.map((y) => B.A(0, y).y), chassis: B.R(70, 70, 760, 230),
        hoseIn: B.A(900, 104), hoseOut: B.A(900, 140),
      },
    };
    if (opts.state && opts.state !== "air" && opts.state !== "liquid") throw new Error("server_side: unknown state '" + opts.state + "'");
    return B.finish(h);
  };

  // =============================================================================================
  // rack, natural 700 x 860. One rack of 8 slots with ONE empty slot (opts.empty, index from the top, default 2 =
  // third from the top), seven servers in the others.
  //
  // opts.view "side" (default): the section. Cabinet (ink rails, surface2 interior); front (cold aisle) on the LEFT,
  //   back (hot aisle) on the RIGHT; each server a slim chassis with a fan at both ends; cool intake beads on the left,
  //   warm exhaust beads on the right; a warm band behind the back; a power feed along the back; the open slot as a
  //   dashed outline; the blanking panel as a thin plate at the front of the slot; the leak stream (back, through the
  //   gap, out of the front, down into the intake of the servers below).
  // opts.view "front": the same rack face to face from the aisle: server faces with grilles, the open slot a dark
  //   recess, the blanking panel a flat plate, a perforated floor tile in front.
  // States: gap (slot open), blanked (panel in), ai (seven taller AI servers, accelerators glowing warm, the exhaust
  //   band several times wider, the power feed thick). opts.state picks the start (default gap).
  // Pieces (side): intake, exhaust, leak (hidden until revealed), label none. Handle: setState(name, t, {dur}),
  //   slidePanel(t, {dur}), swapAI(k, t, {dur}) (k = 0..6 top to bottom), heatBand(v, t, dur), powerFeed(v, t, dur),
  //   leakFlow(t0, t1), flow(t0, t1), tintIntake(v, t, dur, {slots: [..]} | {count}), anchors.
  // =============================================================================================
  Loom.lesson.rack = function (ctx, parent, opts) {
    opts = opts || {};
    const kit = ctx.kit;
    const view = opts.view === "front" ? "front" : "side";
    const state0 = opts.state || "gap";
    if (state0 !== "gap" && state0 !== "blanked" && state0 !== "ai") throw new Error("rack: unknown state '" + state0 + "' (gap | blanked | ai)");
    const N = 8, EMPTY = Array.isArray(opts.empty) ? opts.empty[0] : (opts.empty != null ? opts.empty : 2);
    const B = base(ctx, parent, opts, 700, 860);
    const g = B.root;
    const slots = []; for (let i = 0; i < N; i++) if (i !== EMPTY) slots.push(i);   // the servers' slots, top to bottom
    const K = slots.length;
    const cool = ctx.c("accent4"), warm = ctx.c("accent2");
    const targets = (name) => ({ panel: name === "blanked" ? 1 : 0, swap: name === "ai" ? 1 : 0, band: name === "ai" ? 1 : 0, power: name === "ai" ? 1 : 0, outline: name === "gap" ? 1 : name === "blanked" ? 0.35 : 0 });
    const T0 = targets(state0);
    const h = { slotIndex: EMPTY, view, K };

    // ------------------------------------------------------------------ side section
    if (view === "side") {
      const TOP0 = 62, PITCH = 92, X0 = 174, SW = 352, SH = 76;
      const yTop = (i) => TOP0 + PITCH * i, yc = (i) => yTop(i) + 46;
      const AIP = 736 / K, aiTop = (k) => TOP0 + AIP * k, aiH = AIP - 7, aiC = (k) => aiTop(k) + aiH / 2 + 3.5;

      // cabinet
      kit.rect(g, 150, 40, 400, 780, { fill: "ink", r: 10 });
      kit.rect(g, 166, 58, 368, 744, { fill: "surface2", r: 4, shadow: false });

      // warm band and power feed behind the back (state: ai makes the band several times wider)
      const band = sv("rect", { x: 538, y: 58, width: 28, height: 744, rx: 10, fill: warm, opacity: 0.16 }, g);
      const power = sv("line", { x1: 566, y1: 40, x2: 566, y2: 820, stroke: ctx.c("muted"), "stroke-width": 6, "stroke-linecap": "round" }, g);
      const bandT = track(T0.band, (v) => { band.setAttribute("width", f2(28 + 134 * v)); band.setAttribute("opacity", f2(0.16 + 0.12 * v)); });
      const powerT = track(T0.power, (v) => power.setAttribute("stroke-width", f2(6 + 12 * v)));

      // the empty slot: a dashed outline of the server that is not there
      const outline = grp(g);
      const ol = kit.rect(outline, X0, yTop(EMPTY) + 8, SW, SH, { fill: "none", stroke: "line", sw: 3, r: 8, shadow: false });
      ol.querySelectorAll("rect").forEach((r) => r.setAttribute("stroke-dasharray", "12 10"));
      const outlineT = track(T0.outline, (v) => outline.setAttribute("opacity", f2(v)));

      // servers: a normal and an AI drawing per server, swapped by one tracker each
      const intakeP = B.mk("intake", g), exhaustP = B.mk("exhaust", g);
      const mini = (p, x, y, w, hh) => {
        kit.rect(p, x, y, w, hh, { fill: "surface", r: 8, shadow: false });
        fanModule(ctx, p, x + 8, y + 9, 18, hh - 18); fanModule(ctx, p, x + w - 26, y + 9, 18, hh - 18);
        kit.rect(p, x + 40, y + hh - 14, w - 80, 6, { fill: "accent3", r: 2, shadow: false });
        for (let j = 0; j < 3; j++) kit.rect(p, x + 78 + j * 14, y + hh - 50, 8, 36, { fill: "muted", r: 2, shadow: false });
        kit.rect(p, x + 168, y + hh - 24, 40, 10, { fill: "ink", r: 2, shadow: false });
        kit.rect(p, x + 162, y + hh - 44, 52, 20, { fill: "accent3", r: 3, shadow: false });
        for (let j = 0; j < 4; j++) kit.line(p, x + 170 + j * 12, y + hh - 42, x + 170 + j * 12, y + hh - 26, { stroke: "surface2", sw: 3 });
        kit.rect(p, x + 250, y + hh - 50, 56, 36, { fill: "accent3", r: 6, shadow: false });
      };
      const aiServer = (p, x, y, w, hh) => {
        kit.rect(p, x, y, w, hh, { fill: "surface", r: 8, shadow: false });
        fanModule(ctx, p, x + 8, y + 9, 20, hh - 18); fanModule(ctx, p, x + w - 28, y + 9, 20, hh - 18);
        kit.rect(p, x + 44, y + hh - 14, w - 88, 6, { fill: "accent3", r: 2, shadow: false });
        for (let j = 0; j < 4; j++) {
          const ax = x + 62 + j * 64;
          kit.rect(p, ax - 7, y + 14 - 7, 58, hh - 38 + 14, { fill: "accent2", r: 10, shadow: false, opacity: 0.22 });
          kit.rect(p, ax, y + 14, 44, hh - 38, { fill: "accent2", r: 6, shadow: false });
        }
      };
      const swapT = [], normG = [], aiG = [], intakeN = [], intakeA = [], exhN = [], exhA = [];
      slots.forEach((si, k) => {
        const nG = grp(g), aG = grp(g);
        mini(nG, X0, yTop(si) + 8, SW, SH);
        aiServer(aG, X0, aiTop(k) + 3.5, SW, aiH);
        normG.push(nG); aiG.push(aG);
        const inN = grp(intakeP.g), inA = grp(intakeP.g), exN = grp(exhaustP.g), exA = grp(exhaustP.g);
        intakeN.push(stream(ctx, inN, "M 22 " + yc(si) + " H 164", { gap: 36, r: 5, head: true, headSize: 13, color: () => cool }));
        intakeA.push(stream(ctx, inA, "M 22 " + aiC(k) + " H 164", { gap: 36, r: 7, head: true, headSize: 17, color: () => cool }));
        exhN.push(stream(ctx, exN, "M 540 " + yc(si) + " H 690", { gap: 36, r: 5, head: true, headSize: 13, color: () => warm, fadeStart: false }));
        exhA.push(stream(ctx, exA, "M 540 " + aiC(k) + " H 696", { gap: 40, r: 9, head: true, headSize: 20, color: () => warm, fadeStart: false }));
        const st = track(T0.swap, (v) => {
          nG.setAttribute("opacity", f2(1 - v)); inN.setAttribute("opacity", f2(1 - v)); exN.setAttribute("opacity", f2(1 - v));
          aG.setAttribute("opacity", f2(v)); inA.setAttribute("opacity", f2(v)); exA.setAttribute("opacity", f2(v));
        });
        swapT.push(st);
      });

      // blanking panel: a thin plate at the front of the open slot
      const panelG = grp(g);
      kit.rect(panelG, 168, yTop(EMPTY) + 12, 16, SH - 8, { fill: "muted", r: 4, shadow: false });
      const panelT = track(T0.panel, (v) => { panelG.setAttribute("opacity", f2(clamp(v * 1.6, 0, 1))); panelG.setAttribute("transform", "translate(" + f2(-90 * (1 - v)) + " 0)"); });

      // leak: back -> through the gap -> out of the front -> down into the intake of the servers below
      const leakP = B.mk("leak", g);
      const ly = yc(EMPTY), below = yc(EMPTY + 1);
      const leak = stream(ctx, leakP.g, "M 548 " + ly + " H 166 C 100 " + ly + " 92 " + below + " 146 " + below, { gap: 34, r: 6, head: true, color: () => warm });
      B.set("leak", 0);

      const slotRect = B.R(X0, yTop(EMPTY) + 8, SW, SH);
      Object.assign(h, {
        streams: { intakeN, intakeA, exhaustN: exhN, exhaustA: exhA, leak },
        nodes: { cabinet: g, band, power, panel: panelG, outline },
        swapT,
        setState(name, t, o) {
          if (name !== "gap" && name !== "blanked" && name !== "ai") throw new Error("rack: unknown state '" + name + "' (gap | blanked | ai)");
          const d0 = o && o.dur != null ? o.dur : 0.6, T1 = targets(name);
          const swapping = T1.swap !== swapT[0].v;
          swapT.forEach((st, k) => { st.to(T1.swap, t == null ? null : t + 0.2 * k, 0.4); });
          const tAfter = t == null ? null : t + (swapping && T1.swap ? 0.2 * (K - 1) + 0.2 : 0);
          panelT.to(T1.panel, t, d0); outlineT.to(T1.outline, t, d0);
          bandT.to(T1.band, tAfter, d0 * 1.5); powerT.to(T1.power, tAfter, d0);
          if (name !== "gap") B.pieces.leak.T.to(0, t, 0.3);
          return tAfter == null ? null : tAfter + d0 * 1.5;
        },
        slidePanel: (t, o) => panelT.to(1, t, (o && o.dur) != null ? o.dur : 0.7, "editorial"),
        swapAI: (k, t, o) => swapT[k].to(1, t, (o && o.dur) != null ? o.dur : 0.4),
        heatBand: (v, t, d) => bandT.to(v, t, d != null ? d : 0.9),
        powerFeed: (v, t, d) => powerT.to(v, t, d != null ? d : 0.6),
        leakFlow: (t0, t1, o) => leak.flow(t0, t1, o),
        flow(t0, t1, o) { [].concat(intakeN, intakeA, exhN, exhA).forEach((s) => s.flow(t0, t1, o)); return t1; },
        tintIntake(v, t, d, o) {
          o = o || {};
          const list = o.slots || Array.from({ length: o.count || 2 }, (_, i) => EMPTY + 1 + i);
          list.forEach((si) => { const k = slots.indexOf(si); if (k >= 0) { intakeN[k].tintTo(v, t, d); intakeA[k].tintTo(v, t, d); } });
          return t;
        },
        anchors: {
          slot: slotRect, front: B.A(166, 430), back: B.A(534, 430), top: B.A(350, 40), bottom: B.A(350, 820),
          frontX: B.A(166, 0).x, backX: B.A(534, 0).x, slotCenterY: B.A(0, ly).y,
          cabinet: B.R(150, 40, 400, 780), band: B.R(538, 58, 162, 744), power: B.A(566, 430),
          intake: slots.map((si) => B.A(22, yc(si))), exhaust: slots.map((si) => B.A(690, yc(si))),
          leakStart: B.A(548, ly), leakEnd: B.A(146, below),
        },
      });
      if (state0 === "ai") { /* trackers were built at their ai values */ }
      return B.finish(h);
    }

    // ------------------------------------------------------------------ front view
    const FTOP = 50, FP = 88, FX = 134, FW = 432;
    const fTop = (i) => FTOP + FP * i;
    kit.rect(g, 110, 30, 480, 740, { fill: "ink", r: 10 });
    kit.rect(g, 126, 48, 448, 706, { fill: "surface2", r: 4, shadow: false });
    // perforated floor tile in front of the rack
    kit.rect(g, 70, 786, 560, 64, { fill: "surface2", r: 6, shadow: false });
    for (let r = 0; r < 3; r++) for (let c = 0; c < 17; c++) sv("circle", { cx: 100 + c * 31.2, cy: 802 + r * 19, r: 5, fill: ctx.c("field") }, g);

    const face = (p, x, y, w, hh, big) => {
      kit.rect(p, x, y, w, hh, { fill: "surface", r: 8, shadow: false });
      kit.rect(p, x + 10, y + hh / 2 - 16, 10, 32, { fill: "muted", r: 4, shadow: false });
      kit.rect(p, x + w - 20, y + hh / 2 - 16, 10, 32, { fill: "muted", r: 4, shadow: false });
      const n = 14, x0 = x + 44, span = w - 88;
      for (let j = 0; j < n; j++) kit.rect(p, x0 + (span / (n - 1)) * j - 3, y + 14, 6, hh - 28, { fill: "surface2", r: 3, shadow: false });
      if (big) for (let j = 0; j < 4; j++) kit.rect(p, x + 50 + j * 90, y + hh - 22, 66, 12, { fill: "accent2", r: 4, shadow: false });
    };
    const AIP = 704 / K, aiTop = (k) => FTOP + AIP * k;
    const fNorm = [], fAI = [], swapT = [];
    slots.forEach((si, k) => {
      const nG = grp(g), aG = grp(g);
      face(nG, FX, fTop(si) + 6, FW, 76, false);
      face(aG, FX, aiTop(k) + 3, FW, AIP - 6, true);
      fNorm.push(nG); fAI.push(aG);
      swapT.push(track(T0.swap, (v) => { nG.setAttribute("opacity", f2(1 - v)); aG.setAttribute("opacity", f2(v)); }));
    });
    // the open slot: a dark recess; the blanking panel: a flat plate with four screws
    const recess = grp(g);
    kit.rect(recess, FX, fTop(EMPTY) + 6, FW, 76, { fill: "ink", r: 8, shadow: false });
    const panelG = grp(g);
    kit.rect(panelG, FX, fTop(EMPTY) + 6, FW, 76, { fill: "accent3", r: 8, shadow: false });
    [[14, 14], [FW - 14, 14], [14, 62], [FW - 14, 62]].forEach((q) => kit.disc(panelG, FX + q[0], fTop(EMPTY) + 6 + q[1], 5, { fill: "surface", shadow: false }));
    const panelT = track(T0.panel, (v) => { panelG.setAttribute("opacity", f2(clamp(v * 1.6, 0, 1))); panelG.setAttribute("transform", "translate(0 " + f2(-30 * (1 - v)) + ")"); });
    const recessT = track(T0.swap ? 0 : 1, (v) => recess.setAttribute("opacity", f2(v)));
    Object.assign(h, {
      nodes: { recess, panel: panelG },
      swapT,
      setState(name, t, o) {
        if (name !== "gap" && name !== "blanked" && name !== "ai") throw new Error("rack: unknown state '" + name + "' (gap | blanked | ai)");
        const d0 = o && o.dur != null ? o.dur : 0.6, T1 = targets(name);
        let end = t;
        if (T1.swap !== swapT[0].v) swapT.forEach((st, k) => { end = Math.max(end, st.to(T1.swap, t == null ? null : t + 0.2 * k, 0.4)); });
        panelT.to(T1.panel, t, d0);
        recessT.to(name === "ai" ? 0 : 1, t, d0);
        return Math.max(end || 0, (t || 0) + d0);
      },
      slidePanel: (t, o) => panelT.to(1, t, (o && o.dur) != null ? o.dur : 0.7, "editorial"),
      swapAI: (k, t, o) => swapT[k].to(1, t, (o && o.dur) != null ? o.dur : 0.4),
      anchors: {
        slot: B.R(FX, fTop(EMPTY) + 6, FW, 76), cabinet: B.R(110, 30, 480, 740), tile: B.R(70, 786, 560, 64),
        faces: slots.map((si) => B.R(FX, fTop(si) + 6, FW, 76)),
      },
    });
    return B.finish(h);
  };

  // =============================================================================================
  // floor_plan, natural 1500 x 800. The room from above.
  //
  // Anatomy, back to front: floor (surface2 with a raised-floor tile grid in field), walls (a stroked accent3 frame,
  // draw it with m.draw(h.walls, t)), washes (cold accent4 / hot accent2, hidden until a state asks), two cooling units
  // on the bottom wall (accent3 cabinets with a cool accent4 outlet strip), four rows of racks (ink bars of six rack
  // tiles, a lighter strip along the FRONT edge and one accent arrow that points the way the front faces), the row
  // numbers 1 to 4 from the bottom (white discs at the left end, hidden until numbered), the aisle labels.
  // Rows: row 1 is the front row (bottom, nearest the cooling units), row 4 the back row (top). Fronts start facing
  // DOWN. Rows 1 and 3 turn round IN PLACE and the arrow flips with them. opts.turn "flip" (default) turns a row over its own long axis (it narrows to a line and opens the other way, so it never sweeps through its neighbours); opts.turn "rotate" is a true 180 degree rotation about the row's centre (a 600 px bar then sweeps across the rows beside it while it turns).
  // Rows 1 and 2 and the aisle between them sit at part x 450..1050, y 432..696 (anchors.portal): placed with the
  // part at frame (210, 107) they fall inside frame x 640..1280, y 520..880.
  //
  // States: same_way, numbered, alternating. opts.state picks the start (default same_way). opts.labels
  // {cold, hot} (defaults: Cold aisle, Hot aisle) are the aisle words; opts.hide: pieces to start hidden.
  // Pieces: floor, walls, units, row_1..row_4 (the whole row with its arrow), arrow_1..arrow_4 (the arrows, as
  //   separate pieces INSIDE the rows for a stamp), number_1..number_4, wash_cold_a (lower), wash_hot, wash_cold_b
  //   (upper), label_cold, label_hot.
  // Handle: setState(name, t, {dur}); showNumbers(t, {stagger}); turnRows(t, {dur, stagger}) (rows 1 and 3);
  //   aisle("cold" | "hot", t, {dur}); markRow(i, v, t, d) (row i ring + number disc to accent, i = 1..4);
  //   overcool(v, t, d) (floor tint cool); rowRect(i), aisleRect("cold_a"|"hot"|"cold_b"), anchors.
  // =============================================================================================
  Loom.lesson.floor_plan = function (ctx, parent, opts) {
    opts = opts || {};
    const kit = ctx.kit;
    const state0 = opts.state || "same_way";
    if (state0 !== "same_way" && state0 !== "numbered" && state0 !== "alternating") throw new Error("floor_plan: unknown state '" + state0 + "' (same_way | numbered | alternating)");
    const lab = Object.assign({ cold: "Cold aisle", hot: "Hot aisle" }, opts.labels || {});
    const B = base(ctx, parent, opts, 1500, 800);
    const g = B.root;
    const RX = 450, RW = 600, RH = 72, RY = [624, 432, 240, 48];      // row 1 (front, bottom) .. row 4 (back, top)
    const cx = RX + RW / 2;
    const MODE = opts.turn === "rotate" ? "rotate" : "flip";
    const T0 = { numbers: state0 === "same_way" ? 0 : 1, turn: state0 === "alternating" ? 1 : 0, wash: state0 === "alternating" ? 1 : 0 };

    // floor, tile grid, walls
    const floorP = B.mk("floor", g);
    kit.rect(floorP.g, 24, 24, 1452, 752, { fill: "surface2", r: 6, shadow: false });
    const tint = sv("rect", { x: 24, y: 24, width: 1452, height: 752, rx: 6, fill: ctx.c("accent4"), opacity: 0 }, floorP.g);
    for (let x = 84; x < 1476; x += 60) kit.line(floorP.g, x, 24, x, 776, { stroke: "field", sw: 2, opacity: 0.85 });
    for (let y = 84; y < 776; y += 60) kit.line(floorP.g, 24, y, 1476, y, { stroke: "field", sw: 2, opacity: 0.85 });
    const overcoolT = track(0, (v) => tint.setAttribute("opacity", f2(0.2 * v)));

    // aisle washes: between rows 1-2 (cold), 2-3 (hot), 3-4 (cold)
    const AIS = { cold_a: [RY[1] + RH, RY[0]], hot: [RY[2] + RH, RY[1]], cold_b: [RY[3] + RH, RY[2]] };   // [y0, y1]
    const washes = {};
    [["cold_a", "accent4"], ["hot", "accent2"], ["cold_b", "accent4"]].forEach(([k, tok]) => {
      const pc = B.mk("wash_" + k, g);
      const y0 = AIS[k][0], y1 = AIS[k][1], cy = (y0 + y1) / 2;
      const inner = grp(pc.g);
      kit.rect(inner, RX - 20, y0 + 6, RW + 40, y1 - y0 - 12, { fill: tok, r: 10, shadow: false, opacity: 0.28 });
      const T = track(T0.wash, (v) => {
        inner.setAttribute("opacity", f2(clamp(v * 1.6, 0, 1)));
        inner.setAttribute("transform", "translate(0 " + f2(cy) + ") scale(1 " + f2(Math.max(v, 0.001)) + ") translate(0 " + f2(-cy) + ")");
      });
      washes[k] = { T, g: inner, y0, y1, cy };
    });

    // cooling units on the bottom wall: cabinets with a cool outlet strip along the top and two fans
    const unitsP = B.mk("units", g);
    [[470, 650], [850, 1030]].forEach(([x0, x1]) => {
      kit.rect(unitsP.g, x0, 710, x1 - x0, 66, { fill: "accent3", r: 8 });
      kit.rect(unitsP.g, x0 + 12, 714, x1 - x0 - 24, 6, { fill: "accent4", r: 3, shadow: false });
      [0.3, 0.7].forEach((f) => fanGlyph(ctx, unitsP.g, x0 + (x1 - x0) * f, 748, 20));
    });

    // walls: a stroked frame (m.draw can draw it)
    const wallsP = B.mk("walls", g);
    const walls = kit.path(wallsP.g, "M 12 12 H 1488 V 788 H 12 Z", { stroke: "accent3", sw: 24 });

    // rows
    const rows = [], rowT = [], ringT = [];
    for (let i = 0; i < 4; i++) {
      const y = RY[i], cy = y + RH / 2;
      const shell = B.mk("row_" + (i + 1), g);
      const turnG = grp(shell.g);
      kit.rect(turnG, RX, y, RW, RH, { fill: "ink", r: 6, shadow: false });
      for (let k = 1; k < 6; k++) kit.line(turnG, RX + k * 100, y + 5, RX + k * 100, y + RH - 5, { stroke: "field", sw: 3, opacity: 0.9 });
      kit.rect(turnG, RX + 6, y + RH - 12, RW - 12, 7, { fill: "accent3", r: 3, shadow: false });   // the front edge
      const arrowP = B.mk("arrow_" + (i + 1), turnG);
      kit.polygon(arrowP.g, [[cx - 6, y + RH + 6], [cx + 6, y + RH + 6], [cx + 6, y + RH + 22], [cx + 20, y + RH + 22], [cx, y + RH + 44], [cx - 20, y + RH + 22], [cx - 6, y + RH + 22]], { fill: "accent" });
      // ring for "this is the row" (accent outline), hidden until marked
      const ring = sv("rect", { x: RX - 10, y: y - 10, width: RW + 20, height: RH + 20, rx: 12, fill: "none", stroke: ctx.c("accent"), "stroke-width": 5, opacity: 0 }, shell.g);
      const turn = track(i % 2 === 0 ? T0.turn : 0, (v) => {
        if (MODE === "rotate") turnG.setAttribute("transform", "rotate(" + f2(180 * v) + " " + cx + " " + cy + ")");
        else { const c = Math.cos(Math.PI * v), sy = Math.abs(c) < 0.002 ? 0.002 : c; turnG.setAttribute("transform", "translate(0 " + cy + ") scale(1 " + f2(sy * 1000) / 1000 + ") translate(0 " + (-cy) + ")"); }
      });
      rows.push(shell); rowT.push(turn);
      ringT.push(track(0, (v) => ring.setAttribute("opacity", f2(v))));
    }

    // row numbers: white discs at the left end, row 1 at the bottom
    const numbers = [], numFill = [];
    for (let i = 0; i < 4; i++) {
      const pc = B.mk("number_" + (i + 1), g, { dy: 8 });
      const ny = RY[i] + RH / 2;
      const d = sv("circle", { cx: RX - 44, cy: ny, r: 26, fill: ctx.c("surface") }, pc.g);
      const tx = kit.text(pc.g, String(i + 1), { role: "label", size: 30, weight: 700, x: RX - 70, y: ny - 22, w: 52, h: 44, align: "center", valign: "middle", maxLines: 1, color: "ink" });
      const ink = ctx.c("ink"), onA = ctx.c("onAccent"), sur = ctx.c("surface"), acc = ctx.c("accent");
      numFill.push(track(0, (v) => { d.setAttribute("fill", S().mix(sur, acc, v)); tx.setAttribute("fill", S().mix(ink, onA, v)); }));
      numbers.push(pc);
      if (!T0.numbers) pc.T.to(0, null);
    }

    // aisle labels (in the lower cold aisle and the hot aisle)
    const lblC = B.mk("label_cold", g), lblH = B.mk("label_hot", g);
    const pC = pill(ctx, lblC.g, lab.cold, cx, (AIS.cold_a[0] + AIS.cold_a[1]) / 2);
    const pH = pill(ctx, lblH.g, lab.hot, cx, (AIS.hot[0] + AIS.hot[1]) / 2);
    if (!T0.wash) { lblC.T.to(0, null); lblH.T.to(0, null); }

    const aisleRect = (k) => B.R(RX - 20, AIS[k][0] + 6, RW + 40, AIS[k][1] - AIS[k][0] - 12);
    const h = {
      walls, rows, numbers, labels: { cold: pC, hot: pH }, washes,
      state: null,
      nodes: { walls, floor: floorP.g, units: unitsP.g },
      setState(name, t, o) {
        if (name !== "same_way" && name !== "numbered" && name !== "alternating") throw new Error("floor_plan: unknown state '" + name + "' (same_way | numbered | alternating)");
        const d0 = o && o.dur != null ? o.dur : 0.8;
        let end = t;
        if (name !== "same_way" && !h._numbers) end = h.showNumbers(t);
        if (name === "alternating") {
          const e1 = h.turnRows(end, { dur: d0 });
          h.aisle("cold", e1 - 0.1, { dur: 0.6 }); end = h.aisle("hot", e1 + 0.3, { dur: 0.6 });
        }
        h.state = name;
        return end;
      },
      showNumbers(t, o) {
        const st = (o && o.stagger != null) ? o.stagger : 0.15;
        let e = t;
        numbers.forEach((pc, i) => { e = pc.T.to(1, t == null ? null : t + st * i, dur("enter", 0.5), "enter"); });
        h._numbers = true;
        return e;
      },
      turnRows(t, o) {
        const d0 = o && o.dur != null ? o.dur : 0.8, st = o && o.stagger != null ? o.stagger : 0.2;
        const a = rowT[0].to(1, t, d0, "editorial"), b = rowT[2].to(1, t == null ? null : t + st, d0, "editorial");
        return t == null ? null : Math.max(a, b);
      },
      aisle(kind, t, o) {
        const d0 = o && o.dur != null ? o.dur : 0.7;
        let e = t;
        if (kind === "cold") { e = washes.cold_a.T.to(1, t, d0, "enter"); washes.cold_b.T.to(1, t == null ? null : t + 0.2, d0, "enter"); lblC.T.to(1, t == null ? null : t + 0.3, dur("enter", 0.5), "enter"); }
        else if (kind === "hot") { e = washes.hot.T.to(1, t, d0, "enter"); lblH.T.to(1, t == null ? null : t + 0.3, dur("enter", 0.5), "enter"); }
        else throw new Error("floor_plan.aisle: 'cold' or 'hot'");
        return e;
      },
      // ring a row and fill its number disc with the accent (the one row the narration names); v 0 clears it
      markRow(i, v, t, d) { ringT[i - 1].to(v, t, d != null ? d : 0.4); return numFill[i - 1].to(v, t, d != null ? d : 0.4); },
      overcool: (v, t, d) => overcoolT.to(v, t, d != null ? d : 0.6),
      rowRect: (i) => B.R(RX, RY[i - 1], RW, RH),
      aisleRect,
      anchors: {
        room: B.R(24, 24, 1452, 752), rows: [1, 2, 3, 4].map((i) => B.R(RX, RY[i - 1], RW, RH)),
        portal: B.R(RX, RY[1], RW, RY[0] + RH - RY[1]),
        aisles: { cold_a: aisleRect("cold_a"), hot: aisleRect("hot"), cold_b: aisleRect("cold_b") },
        units: [B.R(470, 710, 180, 66), B.R(850, 710, 180, 66)],
        rowLeft: [1, 2, 3, 4].map((i) => B.A(RX - 44, RY[i - 1] + RH / 2)), rowRight: [1, 2, 3, 4].map((i) => B.A(RX + RW, RY[i - 1] + RH / 2)),
        right: B.A(1476, 400), left: B.A(24, 400), top: B.A(750, 24), bottom: B.A(750, 776),
        rowCentre: cx, rowStart: RX, rowEnd: RX + RW,
      },
    };
    h.state = state0; h._numbers = !!T0.numbers;
    return B.finish(h);
  };

  // =============================================================================================
  // energy_fraction, natural 900 x 760. PUE as a fraction of energy blocks.
  //
  // Anatomy: the top stack (x 70..330): four IT blocks in accent3 at the base, overhead blocks stacked above them
  // (pale surface2 blocks with a line outline: the cooling block the largest, two smaller ones, and an extra block
  // that only exists in `grown`); the fraction bar (ink, y 470); the bottom stack: the same four IT blocks; a bracket
  // and a label for each stack on the right (the top bracket follows the top of the stack as it changes); a thin floor
  // line at the height the top stack has when there is no overhead (the top equals the bottom).
  //
  // States: built (all three overhead blocks), ideal (no overhead, the top is ON the floor line), real (the cooling
  // block back at about a third, the top just above the floor line), grown (real plus the extra block).
  // opts: {state, labels: {total, it}} defaults "Total facility energy" and "IT energy" (the storyboard's words).
  // Handle: setState(name, t, {dur, stagger}); overhead(i, frac, t, dur) (i 0 cooling, 1, 2, 3 extra; frac 0..1
  //   of its full height); blockAccent(i, v, t, d) (an overhead block toward accent); anchors {readout, bar, floorLine,
  //   topStack, bottomStack, overhead:[rect], top (live y of the stack top at build state)}.
  // Pieces: labels, floor_line. Overhead blocks are drawn in handle.blocks[i] (raw groups) for m.* by the beat only
  //   through setState / overhead, never tween them directly.
  // =============================================================================================
  Loom.lesson.energy_fraction = function (ctx, parent, opts) {
    opts = opts || {};
    const kit = ctx.kit;
    const state0 = opts.state || "built";
    const FR = { built: [1, 1, 1, 0], ideal: [0, 0, 0, 0], real: [0.4, 0, 0, 0], grown: [0.4, 0, 0, 1] };
    if (!FR[state0]) throw new Error("energy_fraction: unknown state '" + state0 + "' (built | ideal | real | grown)");
    const lab = Object.assign({ total: "Total facility energy", it: "IT energy" }, opts.labels || {});
    const B = base(ctx, parent, opts, 900, 760);
    const g = B.root;
    const SX = 70, SW = 260, BH = 56, GAP = 6, BAR = 470;
    const topBase = BAR - 24, floorY = topBase - (4 * BH + 3 * GAP);          // 204: top of the IT blocks in the top stack
    const OH = [96, 40, 32, 36];                                                // full heights of the overhead blocks (cooling first)
    const botTop = BAR + 24;

    // floor line (behind the stacks)
    const floorP = B.mk("floor_line", g);
    kit.line(floorP.g, 30, floorY, 880, floorY, { stroke: "line", sw: 3 });

    // IT blocks, top stack and bottom stack (accent3, the same four)
    for (let k = 0; k < 4; k++) {
      kit.rect(g, SX, topBase - (k + 1) * BH - k * GAP, SW, BH, { fill: "accent3", r: 6, shadow: false });
      kit.rect(g, SX, botTop + k * (BH + GAP), SW, BH, { fill: "accent3", r: 6, shadow: false });
    }
    // the fraction bar
    kit.line(g, 40, BAR, 360, BAR, { stroke: "ink", sw: 8 });

    // overhead blocks: pale blocks with a line outline, heights driven
    const blocks = OH.map(() => { const r = sv("rect", { x: SX, y: floorY - 20, width: SW, height: 0, rx: 6, fill: ctx.c("surface2"), stroke: ctx.c("line"), "stroke-width": 3 }, g); return r; });
    const fillBase = ctx.c("surface2"), acc = ctx.c("accent");
    const accT = blocks.map((b) => track(0, (v) => b.setAttribute("fill", S().mix(fillBase, acc, v))));
    const topBracket = grp(g), topLabelG = grp(g);
    const bracketTop = sv("line", { x1: 350, y1: floorY, x2: 350, y2: topBase, stroke: ctx.c("line"), "stroke-width": 4, "stroke-linecap": "round" }, topBracket);
    kit.line(g, 350, botTop, 350, botTop + 4 * BH + 3 * GAP, { stroke: "line", sw: 4 });
    const labelsP = B.mk("labels", g);
    const builtTop = floorY - (OH[0] + OH[1] + OH[2] + 3 * GAP);
    const midBuilt = (builtTop + topBase) / 2, midBottom = botTop + (4 * BH + 3 * GAP) / 2;
    const tLab = kit.text(labelsP.g, lab.total, { role: "label", size: 30, weight: 700, x: 376, y: midBuilt - 22, w: 500, h: 44, valign: "middle", maxLines: 1, color: "ink" });
    kit.text(labelsP.g, lab.it, { role: "label", size: 30, weight: 700, x: 376, y: midBottom - 22, w: 500, h: 44, valign: "middle", maxLines: 1, color: "ink" });
    let topNow = floorY;
    const stackT = trackN({ a: FR[state0][0], b: FR[state0][1], c: FR[state0][2], d: FR[state0][3] }, (L) => {
      const fr = [L.a, L.b, L.c, L.d];
      let y = floorY;
      for (let i = 0; i < 4; i++) {
        const hh = OH[i] * clamp(fr[i], 0, 1);
        if (hh > 1.5) {
          y -= GAP + hh;
          blocks[i].setAttribute("y", f2(y)); blocks[i].setAttribute("height", f2(hh)); blocks[i].setAttribute("opacity", 1);
        } else { blocks[i].setAttribute("height", 0); blocks[i].setAttribute("opacity", 0); blocks[i].setAttribute("y", f2(y)); }
      }
      topNow = y === floorY ? floorY : y;
      bracketTop.setAttribute("y1", f2(topNow));
      tLab.setAttribute("transform", "translate(0 " + f2(((topNow + topBase) / 2) - midBuilt) + ")");
    });
    const KEYS = ["a", "b", "c", "d"];
    const h = {
      blocks, stack: stackT,
      state: state0,
      setState(name, t, o) {
        if (!FR[name]) throw new Error("energy_fraction: unknown state '" + name + "' (built | ideal | real | grown)");
        o = o || {};
        const d0 = o.dur != null ? o.dur : 0.5, st = o.stagger != null ? o.stagger : 0.2;
        const target = FR[name];
        const cur = KEYS.map((k) => stackT.cur[k]);
        let end = t;
        // shrinking goes top block first; growing goes bottom block first
        const down = [3, 2, 1, 0].filter((i) => target[i] < cur[i]), up = [0, 1, 2, 3].filter((i) => target[i] > cur[i]);
        let n = 0;
        down.forEach((i) => { const e = stackT.to(KEYS[i], target[i], t == null ? null : t + st * n, d0, "enter"); end = e == null ? end : Math.max(end == null ? 0 : end, e); n++; });
        n = 0;
        up.forEach((i) => { const e = stackT.to(KEYS[i], target[i], t == null ? null : t + (down.length ? st * down.length : 0) + st * n, d0 * 1.2, "enter"); end = e == null ? end : Math.max(end == null ? 0 : end, e); n++; });
        h.state = name;
        return end;
      },
      overhead(i, frac, t, d) { return stackT.to(KEYS[i], frac, t, d != null ? d : 0.5, "enter"); },
      blockAccent(i, v, t, d) { return accT[i].to(v, t, d != null ? d : 0.4); },
      anchors: {
        readout: B.A(400, BAR), bar: B.R(40, BAR - 4, 320, 8), floorLine: B.R(30, floorY - 2, 850, 4),
        topStack: B.R(SX, builtTop, SW, topBase - builtTop), bottomStack: B.R(SX, botTop, SW, 4 * BH + 3 * GAP),
        itTop: B.R(SX, floorY, SW, topBase - floorY), floorY: B.A(0, floorY).y,
        overheadBase: B.A(SX + SW / 2, floorY), labelTotal: B.A(376, midBuilt), labelIt: B.A(376, midBottom),
        newBlock: B.R(SX, floorY - GAP - OH[3] - 0, SW, OH[3]),
      },
    };
    return B.finish(h);
  };

  // =============================================================================================
  // heat_route, natural 1720 x 760. The heat path map: one server at the left, the building wall and one outdoor
  // unit at the right, two lanes between them.
  //
  //   upper, LIQUID lane (y 200):  chip > cold plate > rack loop > CDU > facility water > outside
  //   lower, AIR lane (y 590):     front > back > hot aisle > cooling unit > (water line) > outside
  //
  // Each stage is a small neutral object (or a pipe) with its label hung on it. A stage is FAINT (dashed line token,
  // pale object, no label), LIT (the segment draws in its temperature colour, the object takes a tone bar, the label
  // appears) or NAMED (accent ring / accent pill while the narration names it; it settles when the next one is named).
  // Temperature of each stage (opts.temps overrides): cool = accent4 (cold plate, front), warm = accent2 (the rest).
  //
  // States: faint, liquid_lit, air_lit, both_lit (opts.state picks the start, default faint).
  // Stage ids: chip, cold_plate, rack_loop, cdu, facility_water, outside (liquid lane);
  //            front, back, hot_aisle, cooling_unit, air_water (air lane, air_water has no label), outside.
  // Labels: opts.labels {id: text}; defaults are the storyboard's own words (Chip, Cold plate, Rack loop, CDU,
  //   Facility water, Outside, Front, Back, Hot aisle, Cooling unit).
  // Pieces: server (the small cutaway with its chip), wall, plume, and every object stage by id (chip, cold_plate,
  //   cdu, outside, hot_aisle, cooling_unit): use h.reveal(id, t) to bring one in (opts.hide starts them hidden).
  // Handle:
  //   setState(name, t, {stagger})        faint / liquid_lit / air_lit / both_lit (lit stage by stage, in lane order)
  //   light(id, t, {label: false})        light one stage (its segment draws, its label comes)
  //   unlight(id, t)                      back to faint
  //   name(id, t)                         light it if needed and NAME it (accent); the previously named one settles
  //   settle(id, t)                       named -> lit, without naming another
  //   showLabel(id, t) / hideLabel(id, t) the label alone
  //   wipeFaint(t, {dur})                 the faint dashed route wipes in left to right (hidden until t)
  //   faintAccent(v, t, dur)              the faint dashes toward accent while they draw (b03), back to line
  //   release(t0, t1)                     warm beads leave the outdoor unit (period-locked)
  //   server                              the embedded server_side handle (its chip, plate, anchors)
  //   anchors.stage[id] {x, y}, anchors.server (rect), anchors.lanes {liquid, air}, anchors.outside (rect), anchors.wall
  // =============================================================================================
  Loom.lesson.heat_route = function (ctx, parent, opts) {
    opts = opts || {};
    const kit = ctx.kit;
    const STATES = ["faint", "liquid_lit", "air_lit", "both_lit"];
    const state0 = opts.state || "faint";
    if (STATES.indexOf(state0) < 0) throw new Error("heat_route: unknown state '" + state0 + "' (" + STATES.join(" | ") + ")");
    const lab = Object.assign({ chip: "Chip", cold_plate: "Cold plate", rack_loop: "Rack loop", cdu: "CDU", facility_water: "Facility water", outside: "Outside", front: "Front", back: "Back", hot_aisle: "Hot aisle", cooling_unit: "Cooling unit" }, opts.labels || {});
    const temp = Object.assign({ chip: "warm", cold_plate: "cool", rack_loop: "warm", cdu: "warm", facility_water: "warm", outside: "warm", front: "cool", back: "warm", hot_aisle: "warm", cooling_unit: "warm", air_water: "warm" }, opts.temps || {});
    const toneCol = (id) => ctx.c(temp[id] === "cool" ? "accent4" : "accent2");
    const B = base(ctx, parent, opts, 1720, 760);
    const g = B.root;
    const YL = 200, YA = 590;
    const DIM = 0.5;

    // ---- ground: the inside of the building (a pale panel), the wall
    const ground = grp(g);
    kit.rect(ground, 0, 28, 1396, 716, { fill: "field2", r: 0, shadow: false, opacity: 0.6 });
    const wallP = B.mk("wall", g);
    kit.rect(wallP.g, 1396, 40, 28, 704, { fill: "accent3", r: 6, shadow: false });

    // ---- layers
    const faintG = grp(g), serverP = B.mk("server", g), objG = grp(g), litG = grp(g), plumeP = B.mk("plume", g), labG = grp(g);
    const faintClip = sv("clipPath", { id: Loom.uid("dcfc") }, sv("defs", {}, g));
    const faintRect = sv("rect", { x: -20, y: -20, width: 1760, height: 800 }, faintClip);
    faintG.setAttribute("clip-path", "url(#" + faintClip.getAttribute("id") + ")");
    const faintW = track(1, (v) => faintRect.setAttribute("width", f2(Math.max(0.01, 1760 * v))));
    const faintA = [], faintH = [];
    const lineCol = ctx.c("line"), accCol = ctx.c("accent");
    const faintAcc = track(0, (v) => { const c = S().mix(lineCol, accCol, v); faintA.forEach((p) => p.setAttribute("stroke", c)); faintH.forEach((p) => p.setAttribute("fill", c)); });

    // ---- the embedded server (small cutaway) and its tie to the chip stage
    const SRV = { x: 70, y: 296, w: 396, h: 158 };
    const srv = Loom.lesson.server_side(ctx, serverP.g, { x: SRV.x, y: SRV.y, w: SRV.w, h: SRV.h, state: "liquid", hoses: false, streams: false, labels: false });
    kit.line(serverP.g, 268, 242, 268, 404, { stroke: "muted", sw: 2, dash: "4 8", opacity: 0.8 });

    // ---- stages
    const S_ = {};                       // id -> record
    const order = { liquid: ["chip", "cold_plate", "rack_loop", "cdu", "facility_water", "outside"], air: ["front", "back", "hot_aisle", "cooling_unit", "air_water", "outside"] };
    let namedNow = null;
    const LP = {                         // label placement: pill centre and the point it hangs from
      chip: [268, 80, 268, 160], cold_plate: [450, 80, 450, 176], rack_loop: [654, 80, 654, 196], cdu: [880, 80, 880, 128],
      facility_water: [1218, 80, 1218, 196], outside: [1560, 80, 1540, 290],
      front: [100, 522, 52, 388], back: [400, 522, 440, 388], hot_aisle: [740, 724, 740, 662], cooling_unit: [1060, 724, 1060, 662],
    };

    function mkLabel(id) {
      if (!lab[id] || !LP[id]) return null;
      const L = LP[id];
      const pc = B.mk("label_" + id, labG);
      const p = pill(ctx, pc.g, lab[id], L[0], L[1], { to: { x: L[2], y: L[3] } });
      pc.T.to(0, null);
      return { pc, p };
    }

    // an object stage: neutral drawing in `face` (dimmed until lit), a tone bar under it, an accent ring when named
    function objStage(id, box, draw, extra) {
      const pc = B.mk(id, objG);
      const face = grp(pc.g);
      draw(face);
      const tone = sv("rect", { x: box.x + box.w * 0.18, y: box.y + box.h + 12, width: box.w * 0.64, height: 9, rx: 4.5, fill: toneCol(id), opacity: 0 }, pc.g);
      const ring = sv("rect", { x: box.x - 12, y: box.y - 12, width: box.w + 24, height: box.h + 24 + 14, rx: 22, fill: "none", stroke: accCol, "stroke-width": 5, opacity: 0 }, pc.g);
      const rec = { id, pc, face, tone, ring, box, kind: "obj", extra };
      rec.apply = (v) => { face.setAttribute("opacity", f2(DIM + (1 - DIM) * v)); tone.setAttribute("opacity", f2(v)); if (extra && extra.onLit) extra.onLit(v); };
      rec.applyNamed = (v) => ring.setAttribute("opacity", f2(v));
      rec.apply(0);
      return rec;
    }

    // a segment stage: faint dashed path + a lit path that draws in its temperature colour + a named overlay
    function segment(d, id, o) {
      o = o || {};
      const faint = kit.path(faintG, d, { stroke: "line", sw: 4, dash: "14 12" });
      faintA.push(faint);
      const lit = kit.path(litG, d, { stroke: temp[id] === "cool" ? "accent4" : "accent2", sw: 9 });
      const nm = kit.path(litG, d, { stroke: "accent", sw: 11 });
      const L = lit.getTotalLength(), sw = 9;
      lit.setAttribute("stroke-dasharray", L + " " + (L + 3 * sw + 6));
      const tip = lit.getPointAtLength(L), bk = lit.getPointAtLength(Math.max(0, L - 14));
      const ang = Math.atan2(tip.y - bk.y, tip.x - bk.x);
      const hs = 20;
      const hFaint = headAt(faintG, tip.x, tip.y, ang, hs, lineCol); faintH.push(hFaint);
      const hLit = headAt(litG, tip.x, tip.y, ang, hs, toneCol(id));
      const hNm = headAt(litG, tip.x, tip.y, ang, hs + 2, accCol);
      const rec = { faint, lit, nm, hFaint, hLit, hNm, L, kind: "seg", d };
      rec.apply = (v) => {
        lit.setAttribute("stroke-dashoffset", f2((L + sw + 2) * (1 - v)));
        faint.setAttribute("opacity", f2(1 - v)); hFaint.setAttribute("opacity", f2(1 - v));
        hLit.setAttribute("opacity", f2(clamp((v - 0.8) / 0.2, 0, 1)));
      };
      rec.applyNamed = (v) => {
        nm.setAttribute("opacity", f2(v)); hNm.setAttribute("opacity", f2(v));
        nm.setAttribute("stroke-dasharray", L + " " + (L + 40)); nm.setAttribute("stroke-dashoffset", 0);
      };
      rec.apply(0); rec.applyNamed(0);
      return rec;
    }

    // ---- drawings of the objects
    const chipBox = { x: 228, y: 160, w: 80, h: 80 };
    const chipObj = objStage("chip", chipBox, (f) => {
      [180, 194, 208].forEach((y) => { kit.rect(f, 228, y, 12, 6, { fill: "accent3", r: 2, shadow: false }); kit.rect(f, 296, y, 12, 6, { fill: "accent3", r: 2, shadow: false }); });
      [250, 264, 278].forEach((x) => { kit.rect(f, x, 160, 6, 12, { fill: "accent3", r: 2, shadow: false }); kit.rect(f, x, 228, 6, 12, { fill: "accent3", r: 2, shadow: false }); });
      kit.rect(f, 240, 172, 56, 56, { fill: "ink", r: 8 });
      kit.rect(f, 257, 189, 22, 22, { fill: "line", r: 4, shadow: false });
    });

    const plateBox = { x: 390, y: 160, w: 120, h: 80 };
    const plateObj = objStage("cold_plate", plateBox, (f) => {
      kit.rect(f, 422, 218, 56, 22, { fill: "ink", r: 5, shadow: false });
      kit.rect(f, 402, 190, 96, 30, { fill: "muted", r: 6 });
      kit.rect(f, 418, 172, 16, 18, { fill: "accent3", r: 3, shadow: false });
      kit.rect(f, 466, 172, 16, 18, { fill: "accent3", r: 3, shadow: false });
    });

    const cduBox = { x: 800, y: 128, w: 160, h: 144 };
    const cduObj = objStage("cdu", cduBox, (f) => {
      kit.rect(f, 800, 128, 160, 144, { fill: "surface", r: 14 });
      [150, 164, 178].forEach((y) => kit.line(f, 822, y, 938, y, { stroke: "surface2", sw: 4 }));
      // a pump: a disc with a hub, a pipe stub in on the left and out on the right (the two loops meet in the CDU)
      kit.rect(f, 806, 214, 40, 12, { fill: "accent3", r: 4, shadow: false });
      kit.rect(f, 914, 214, 40, 12, { fill: "accent3", r: 4, shadow: false });
      kit.disc(f, 880, 220, 36, { fill: "surface2", shadow: false });
      kit.disc(f, 880, 220, 18, { fill: "accent3", shadow: false });
      kit.disc(f, 880, 220, 6, { fill: "surface2", shadow: false });
    });

    const haBox = { x: 600, y: 520, w: 280, h: 140 };
    let haWash = null;
    const haObj = objStage("hot_aisle", haBox, (f) => {
      haWash = sv("rect", { x: 600, y: 546, width: 280, height: 88, rx: 8, fill: ctx.c("accent2"), opacity: 0 }, f);
      kit.rect(f, 600, 520, 280, 24, { fill: "ink", r: 6, shadow: false });
      kit.rect(f, 600, 636, 280, 24, { fill: "ink", r: 6, shadow: false });
      for (let k = 1; k < 3; k++) { kit.line(f, 600 + k * 93.3, 524, 600 + k * 93.3, 540, { stroke: "field", sw: 3 }); kit.line(f, 600 + k * 93.3, 640, 600 + k * 93.3, 656, { stroke: "field", sw: 3 }); }
    }, { onLit: (v) => haWash && haWash.setAttribute("opacity", f2(0.28 * v)) });

    const cuBox = { x: 980, y: 520, w: 160, h: 140 };
    const cuObj = objStage("cooling_unit", cuBox, (f) => {
      kit.rect(f, 980, 520, 160, 140, { fill: "surface", r: 14 });
      [538, 550].forEach((y) => kit.line(f, 1000, y, 1120, y, { stroke: "surface2", sw: 4 }));
      fanGlyph(ctx, f, 1060, 606, 40);
    });

    const outBox = { x: 1500, y: 290, w: 200, h: 180 };
    const outObj = objStage("outside", outBox, (f) => {
      kit.rect(f, 1500, 290, 200, 180, { fill: "surface", r: 16 });
      fanGlyph(ctx, f, 1600, 380, 68, true);
    });

    // plume: warm beads leaving the outdoor unit to the open air
    const plumeS = grp(plumeP.g);
    const plume = stream(ctx, plumeS, "M 1600 282 C 1600 236 1640 204 1706 184", { gap: 34, r: 6, head: true, color: () => ctx.c("accent2") });
    const plumeFollow = track(0, (v) => plumeS.setAttribute("opacity", f2(v)));

    // segments
    const segs = {
      link: segment("M 312 200 H 386", "chip"),
      rack_loop: segment("M 516 200 H 792", "rack_loop"),
      facility_water: segment("M 966 200 H 1470 V 340 H 1494", "facility_water"),
      front: segment("M 6 381 H 96", "front"),
      back: segment("M 432 381 C 520 381 548 590 594 590", "back"),
      conn: segment("M 886 590 H 974", "cooling_unit"),
      air_water: segment("M 1146 590 H 1470 V 420 H 1494", "air_water"),
    };

    // stage records
    const reg = (id, parts) => { S_[id] = Object.assign({ id, lit: null, named: null, label: mkLabel(id), litV: 0 }, parts); };
    reg("chip", { obj: chipObj });
    reg("cold_plate", { obj: plateObj, seg: segs.link });
    reg("rack_loop", { seg: segs.rack_loop });
    reg("cdu", { obj: cduObj });
    reg("facility_water", { seg: segs.facility_water });
    reg("outside", { obj: outObj });
    reg("front", { seg: segs.front });
    reg("back", { seg: segs.back });
    reg("hot_aisle", { obj: haObj });
    reg("cooling_unit", { obj: cuObj, seg: segs.conn });
    reg("air_water", { seg: segs.air_water });
    Object.keys(S_).forEach((id) => {
      const R = S_[id];
      R.lit = track(0, (v) => {
        if (R.obj && R.seg) { R.seg.apply(clamp(v / 0.55, 0, 1)); R.obj.apply(clamp((v - 0.45) / 0.55, 0, 1)); }
        else if (R.obj) R.obj.apply(v);
        else R.seg.apply(v);
      });
      R.named = track(0, (v) => {
        if (R.obj) R.obj.applyNamed(v);
        if (R.seg) R.seg.applyNamed(v);
        if (R.label) R.label.p.named.to(v, null);
      });
    });
    const need = (id) => { const R = S_[id]; if (!R) throw new Error("heat_route: unknown stage '" + id + "' (" + Object.keys(S_).join(", ") + ")"); return R; };
    const dLit = (R) => (R.obj && R.seg ? 0.85 : R.seg ? 0.7 : 0.45);
    const h = {
      server: srv, stages: S_, state: state0,
      nodes: { ground, wall: wallP.g, faint: faintG, lit: litG },
      setState(name, t, o) {
        if (STATES.indexOf(name) < 0) throw new Error("heat_route: unknown state '" + name + "' (" + STATES.join(" | ") + ")");
        const st = o && o.stagger != null ? o.stagger : 0.25;
        const want = { liquid: name === "liquid_lit" || name === "both_lit", air: name === "air_lit" || name === "both_lit" };
        let end = t, n = 0;
        const done = {};
        ["liquid", "air"].forEach((lane) => order[lane].forEach((id) => {
          if (done[id]) return; done[id] = 1;
          const on = id === "outside" ? (want.liquid || want.air) : want[lane];
          const R = need(id);
          if (on && R.litV < 1) { end = h.light(id, t == null ? null : t + st * n); n++; }
          else if (!on && R.litV > 0) { end = h.unlight(id, t == null ? null : t + st * n, { dur: 0.3 }); }
        }));
        h.state = name;
        return end;
      },
      light(id, t, o) {
        o = o || {}; const R = need(id);
        const d0 = o.dur != null ? o.dur : dLit(R);
        R.litV = 1;
        const e = R.lit.to(1, t, d0, "move");
        if (R.label && o.label !== false) R.label.pc.T.to(1, t == null ? null : t + d0 * 0.35, dur("enter", 0.5), "enter");
        if (id === "outside") plumeFollow.to(1, t, d0);
        if (id === "chip") srv.chipHeat(1, t, d0);
        return e;
      },
      unlight(id, t, o) {
        o = o || {}; const R = need(id);
        const d0 = o.dur != null ? o.dur : 0.3;
        R.litV = 0;
        R.named.to(0, t, d0);
        if (R.label && !o.keepLabel) R.label.pc.T.to(0, t, d0);
        if (id === "outside") plumeFollow.to(0, t, d0);
        if (id === "chip") srv.chipHeat(0, t, d0);
        return R.lit.to(0, t, d0);
      },
      name(id, t, o) {
        o = o || {}; const R = need(id);
        let e = t;
        if (R.litV < 1) e = h.light(id, t, o);
        if (namedNow && namedNow !== id) need(namedNow).named.to(0, t, 0.4);
        namedNow = id;
        R.named.to(1, t == null ? null : t + 0.05, 0.3);
        return e;
      },
      settle(id, t, d) { const R = need(id); if (namedNow === id) namedNow = null; return R.named.to(0, t, d != null ? d : 0.5); },
      showLabel(id, t, o) { const R = need(id); return R.label ? R.label.pc.T.to(1, t, o && o.dur != null ? o.dur : dur("enter", 0.5), "enter") : t; },
      hideLabel(id, t, o) { const R = need(id); return R.label ? R.label.pc.T.to(0, t, o && o.dur != null ? o.dur : dur("exit", 0.3), "exit") : t; },
      wipeFaint(t, o) {
        o = o || {};
        if (!h._wiped) { faintW.to(0, null); h._wiped = true; }
        return faintW.to(1, t, o.dur != null ? o.dur : 1.2, "editorial");
      },
      faintAccent: (v, t, d) => faintAcc.to(v, t, d != null ? d : 0.4),
      release(t0, t1, o) { return plume.flow(t0, t1, o); },
      anchors: {
        stage: {
          chip: B.A(268, 200), cold_plate: B.A(450, 200), rack_loop: B.A(654, 200), cdu: B.A(880, 200), facility_water: B.A(1218, 200), outside: B.A(1600, 380),
          front: B.A(52, 381), back: B.A(440, 395), hot_aisle: B.A(740, 590), cooling_unit: B.A(1060, 590), air_water: B.A(1300, 590),
        },
        server: B.R(SRV.x, SRV.y, SRV.w, SRV.h), outside: B.R(1500, 290, 200, 180), wall: B.R(1396, 40, 28, 704),
        lanes: { liquid: B.A(0, YL).y, air: B.A(0, YA).y }, serverChip: srv.anchors.chip,
        start: B.A(0, 380), end: B.A(1720, 380),
      },
    };
    // build-time start state
    if (state0 !== "faint") h.setState(state0, null);
    return B.finish(h);
  };

})();
