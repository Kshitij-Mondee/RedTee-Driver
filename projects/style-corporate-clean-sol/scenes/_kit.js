Loom.lesson = Loom.lesson || {};

// The 3-2-1 backup kit (corporate-clean). Parts draw, beats choreograph.
// Every part: Loom.lesson.<id>(ctx, parent, opts) -> handle; Loom.lesson.<id>.size(opts) -> {w, h} (natural box).
// States are pure functions of time: each setState(name, t) registers one Loom.drive that blends the
// previous state's numbers/colours into the next one's (colours recoloured from token to token, never faded).
(function () {
  "use strict";
  const sv = (tag, attrs, parent) => Loom.svg(tag, attrs, parent);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const smooth = (p) => p * p * (3 - 2 * p);
  const f3 = (v) => (Math.round(v * 1000) / 1000).toString();

  function R(p, x, y, w, h, r, fill, extra) {
    const a = { x: x, y: y, width: w, height: h, rx: r, fill: fill };
    if (extra) for (const k in extra) a[k] = extra[k];
    return sv("rect", a, p);
  }
  function parseColor(s) {
    s = String(s).trim();
    let m = /^#([0-9a-f]{6})$/i.exec(s);
    if (m) { const n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
    m = /^rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/i.exec(s);
    if (m) return [+m[1], +m[2], +m[3]];
    return null;
  }
  function mixColor(a, b, p) {
    if (a === b || p <= 0) return a;
    if (p >= 1) return b;
    const A = parseColor(a), B = parseColor(b);
    if (!A || !B) return p < 0.5 ? a : b;
    const q = (i) => Math.round(A[i] + (B[i] - A[i]) * p);
    return "rgb(" + q(0) + "," + q(1) + "," + q(2) + ")";
  }
  function blend(a, b, raw, delays) {
    const o = {};
    for (const k in b) {
      const d = (delays && delays[k]) || 0;
      const p = smooth(clamp((raw - d) / (1 - d), 0, 1));
      o[k] = typeof b[k] === "number" ? a[k] + (b[k] - a[k]) * p : mixColor(a[k], b[k], p);
    }
    return o;
  }
  let uid = 0;
  // one state machine per part (or per tile): go(state, t, {dur}); t == null applies the state at once.
  function machine(ctx, table, init, apply, o) {
    o = o || {};
    const key = "lesson_sm_" + (++uid);
    let cur = init;
    apply(table[init]);
    function go(state, t, opts) {
      const to = table[state];
      if (!to) throw new Error("unknown state " + state);
      const from = table[cur];
      cur = state;
      if (t == null) { apply(to); return; }
      const dur = (opts && opts.dur) || (o.durs && o.durs[state]) || ctx.style.dur("move") * 0.6;
      const delays = (o.delays && o.delays[state]) || null;
      Loom.drive(function (e, raw) { apply(blend(from, to, clamp(raw, 0, 1), delays)); }, t, dur, "linear", { key: key });
    }
    go.state = function () { return cur; };
    return go;
  }
  function setFill(el, col) { el.setAttribute("fill", col); if (el.style) el.style.fill = col; }
  function shadowOf(g, c, x, y, w, h, r, dy) { return R(g, x, y + dy, w, h, r, c("shadow"), { opacity: 0.08 }); }

  // ---------------------------------------------------------------- report_file
  // portrait card (w = 0.75 h). Layers: shadow, card, label/title, 3 lines, dashed outline (empty), slate (locked), accent edge (restored).
  // Handle: g, w, h, setState(state, t, {dur}), state(), layers.
  Loom.lesson.report_file = function (ctx, parent, opts) {
    opts = opts || {};
    const c = ctx.c, kit = ctx.kit;
    const H = opts.size || opts.h || 220, W = Math.round(H * 0.75);
    const k = H / 220;
    const rad = Math.max(8, Math.round(20 * k)), pad = Math.round(W * 0.12);
    const g = sv("g", {}, parent);
    const sh = shadowOf(g, c, 0, 0, W, H, rad, Math.max(4, 10 * k));
    const gCard = sv("g", {}, g);
    R(gCard, 1, 1, W - 2, H - 2, rad, c("surface"), { stroke: c("surface2"), "stroke-width": Math.max(1.5, 2 * k) });
    const innerW = W - 2 * pad;
    const lh = Math.max(3, 0.036 * H), ly = [0.44, 0.57, 0.70].map((v) => v * H), lw = [1, 0.84, 0.6].map((v) => v * innerW);
    let wantLabel = opts.label !== false && H >= 140;
    const labBox = { role: "label", x: pad, y: 0.09 * H, w: innerW, h: 0.2 * H, align: "left", valign: "middle", weight: 700, size: 28 };
    if (wantLabel) {
      const fit = kit.fit("Report", { role: "label", w: labBox.w, h: labBox.h, maxLines: 1, weight: 700 });
      if (!fit || fit.fitted === false) wantLabel = false;
    }
    const gT = sv("g", {}, g);
    if (wantLabel) { const lab = kit.text(gT, "Report", Object.assign({ color: "ink" }, labBox)); delete labBox.size; }
    else R(gT, pad, 0.12 * H, innerW * 0.55, Math.max(4, 0.06 * H), Math.max(2, 3 * k), c("ink"), { opacity: 0.9 });
    const gL = [0, 1, 2].map((i) => {
      const gg = sv("g", {}, g);
      R(gg, pad, ly[i], lw[i], lh, Math.max(1.5, lh / 2), c("ink"), { opacity: 0.8 });
      return gg;
    });
    const gDash = sv("g", {}, g);
    R(gDash, 1.5, 1.5, W - 3, H - 3, rad, "none", { stroke: c("line"), "stroke-width": 3, "stroke-dasharray": "12 10" });
    const gSlate = sv("g", {}, g);
    R(gSlate, 0, 0, W, H, rad, c("accent3"));
    if (wantLabel) kit.text(gSlate, "Report", { role: "label", x: pad, y: 0.09 * H, w: innerW, h: 0.2 * H, align: "left", valign: "middle", weight: 700, size: 28, color: "onAccent" });
    else R(gSlate, pad, 0.12 * H, innerW * 0.55, Math.max(4, 0.06 * H), Math.max(2, 3 * k), c("surface"), { opacity: 0.7 });
    [0, 1, 2].forEach((i) => R(gSlate, pad, ly[i], lw[i], lh, Math.max(1.5, lh / 2), c("surface"), { opacity: 0.35 }));
    const lr = 0.17 * H, lcx = W / 2, lcy = 0.62 * H;
    sv("circle", { cx: lcx, cy: lcy, r: lr, fill: c("surface") }, gSlate);
    const bw = lr * 0.95, bh = lr * 0.7, bx = lcx - bw / 2, by = lcy - lr * 0.08, shw = bw * 0.62;
    sv("path", { d: "M " + (lcx - shw / 2) + " " + by + " V " + (by - lr * 0.3) + " A " + (shw / 2) + " " + (shw / 2) + " 0 0 1 " + (lcx + shw / 2) + " " + (by - lr * 0.3) + " V " + by, fill: "none", stroke: c("accent3"), "stroke-width": Math.max(2, lr * 0.16), "stroke-linecap": "round" }, gSlate);
    R(gSlate, bx, by, bw, bh, Math.max(2, lr * 0.14), c("accent3"));
    const gEdge = sv("g", {}, g);
    R(gEdge, 1.5, 1.5, W - 3, H - 3, rad, "none", { stroke: c("accent"), "stroke-width": 3 });

    const TB = {
      whole: { sh: 0.08, card: 1, t: 1, l0: 1, l1: 1, l2: 1, dash: 0, slate: 0, edge: 0 },
      empty: { sh: 0, card: 0, t: 0, l0: 0, l1: 0, l2: 0, dash: 1, slate: 0, edge: 0 },
      locked: { sh: 0.08, card: 1, t: 0, l0: 0, l1: 0, l2: 0, dash: 0, slate: 1, edge: 0 },
      restored: { sh: 0.08, card: 1, t: 1, l0: 1, l1: 1, l2: 1, dash: 0, slate: 0, edge: 1 },
    };
    const refill = { card: 0, sh: 0, t: 0.2, l0: 0.3, l1: 0.45, l2: 0.6, edge: 0.55 };
    const els = { card: gCard, t: gT, l0: gL[0], l1: gL[1], l2: gL[2], dash: gDash, slate: gSlate, edge: gEdge };
    const go = machine(ctx, TB, opts.state || "whole", function (v) {
      sh.setAttribute("opacity", f3(v.sh));
      for (const key in els) els[key].setAttribute("opacity", f3(v[key]));
    }, { delays: { whole: refill, restored: refill }, durs: { whole: ctx.style.dur("enter") * 0.8, restored: ctx.style.dur("enter") * 1.4, locked: ctx.style.dur("move") * 0.5 } });
    return { g: g, w: W, h: H, setState: go, state: go.state, layers: { card: gCard, label: gT, lines: gL, dash: gDash, slate: gSlate, edge: gEdge } };
  };
  Loom.lesson.report_file.size = function (o) { o = o || {}; const H = o.size || o.h || 220; return { w: Math.round(H * 0.75), h: H }; };

  // ---------------------------------------------------------------- laptop
  // natural 640 x 386 (lid 580 x 364, base 640 x 22). opts.w scales. Handle: g, w, h, slot {x,y,w,h}, screen, fault {x,y}, setState.
  Loom.lesson.laptop = function (ctx, parent, opts) {
    opts = opts || {};
    const c = ctx.c, kit = ctx.kit;
    const s = (opts.w || 640) / 640;
    const g = sv("g", {}, parent);
    const k = sv("g", { transform: "scale(" + s + ")" }, g);
    R(k, 30, 10, 580, 364, 14, c("shadow"), { opacity: 0.08 });
    R(k, 0, 374, 640, 22, 10, c("shadow"), { opacity: 0.08 });
    R(k, 30, 0, 580, 364, 14, c("ink"));
    R(k, 0, 364, 640, 22, 10, c("accent3"));
    R(k, 250, 364, 140, 8, 4, c("ink"), { opacity: 0.3 });
    R(k, 46, 16, 548, 332, 6, c("surface2"));
    R(k, 46, 16, 548, 22, 6, c("surface"));
    [0, 1, 2].forEach((i) => sv("circle", { cx: 62 + i * 16, cy: 27, r: 4, fill: c("line") }, k));
    const ink = R(k, 46, 16, 548, 332, 6, c("ink"), { opacity: 0 });
    const gX = sv("g", { opacity: 0 }, k);
    kit.mark(gX, "no", 540, 316, 46);
    const TB = { on: { ink: 0, x: 0 }, failed: { ink: 1, x: 1 } };
    const go = machine(ctx, TB, opts.state || "on", function (v) {
      ink.setAttribute("opacity", f3(v.ink)); gX.setAttribute("opacity", f3(v.x));
    }, { delays: { failed: { x: 0.5 }, on: {} }, durs: { failed: ctx.style.dur("move") * 0.6, on: ctx.style.dur("move") * 0.6 } });
    const sw = 202.5, sh2 = 270;
    return {
      g: g, w: 640 * s, h: 386 * s, base: 386 * s,
      slot: { x: (46 + (548 - sw) / 2) * s, y: 47 * s, w: sw * s, h: sh2 * s },
      screen: { x: 46 * s, y: 16 * s, w: 548 * s, h: 332 * s },
      fault: { x: 540 * s, y: 316 * s }, cross: gX, scale: s,
      setState: go, state: go.state,
    };
  };
  Loom.lesson.laptop.size = function (o) { o = o || {}; const w = o.w || 640; return { w: w, h: Math.round(386 * w / 640) }; };

  // ---------------------------------------------------------------- ext_drive
  // natural 380 x 258: slab at y 170 (h 88), two report slots above it. opts.w scales; opts.cableTo {x,y} in the element's coordinates.
  Loom.lesson.ext_drive = function (ctx, parent, opts) {
    opts = opts || {};
    const c = ctx.c;
    const s = (opts.w || 380) / 380;
    const g = sv("g", {}, parent);
    const k = sv("g", { transform: "scale(" + s + ")" }, g);
    const ty0 = 170, port = { x: 0, y: ty0 + 46 };
    // cable (under the slab)
    const to = opts.cableTo ? { x: opts.cableTo.x / s, y: opts.cableTo.y / s } : { x: -170, y: port.y };
    const mx = (port.x + to.x) / 2;
    const cable = sv("path", { d: "M " + port.x + " " + port.y + " C " + mx + " " + port.y + ", " + mx + " " + to.y + ", " + to.x + " " + to.y, fill: "none", stroke: c("line"), "stroke-width": 4, "stroke-linecap": "round", pathLength: 1, "stroke-dasharray": "1 1", "stroke-dashoffset": 1, opacity: 0 }, k);
    R(k, 0, ty0 + 10, 380, 88, 20, c("shadow"), { opacity: 0.08 });
    R(k, 0, ty0, 380, 88, 20, c("accent3"));
    R(k, 10, ty0 + 34, 12, 24, 4, c("ink"), { opacity: 0.5 });
    const light = sv("circle", { cx: 44, cy: ty0 + 24, r: 8, fill: c("surface") }, k);
    [0, 1, 2].forEach((i) => R(k, 262, ty0 + 26 + i * 14, 90, 6, 3, c("surface"), { opacity: 0.25 }));
    const slotsLocal = [{ x: 50, y: 4, w: 120, h: 160 }, { x: 210, y: 4, w: 120, h: 160 }];
    slotsLocal.forEach((sl) => R(k, sl.x + 8, ty0 + 6, sl.w - 16, 7, 3, c("ink"), { opacity: 0.35 }));
    const TB = {
      idle: { cable: 0, on: 1 },
      connected: { cable: 1, on: 1 },
      unplugged: { cable: 0, on: 0 },
    };
    const lc = { on: c("surface"), off: c("ink") };
    const go = machine(ctx, TB, opts.state || "idle", function (v) {
      cable.setAttribute("stroke-dashoffset", f3(1 - v.cable));
      cable.setAttribute("opacity", v.cable > 0.001 ? 1 : 0);
      setFill(light, mixColor(lc.off, lc.on, v.on));
      light.setAttribute("opacity", f3(0.45 + 0.55 * v.on));
    }, { durs: { connected: ctx.style.dur("draw") * 0.8, unplugged: ctx.style.dur("move") * 0.6, idle: ctx.style.dur("move") * 0.6 } });
    return {
      g: g, w: 380 * s, h: 258 * s, base: 258 * s, scale: s,
      slots: slotsLocal.map((sl) => ({ x: sl.x * s, y: sl.y * s, w: sl.w * s, h: sl.h * s })),
      port: { x: port.x * s, y: port.y * s }, cable: cable, light: light,
      setState: go, state: go.state,
    };
  };
  Loom.lesson.ext_drive.size = function (o) { o = o || {}; const w = o.w || 380; return { w: w, h: Math.round(258 * w / 380) }; };

  // ---------------------------------------------------------------- usb_drive
  // natural 300 x 130: the stick lies at the bottom left (170 x 60), one report slot to its right. opts.w scales.
  Loom.lesson.usb_drive = function (ctx, parent, opts) {
    opts = opts || {};
    const c = ctx.c;
    const s = (opts.w || 300) / 300;
    const g = sv("g", {}, parent);
    const k = sv("g", { transform: "scale(" + s + ")" }, g);
    R(k, 0, 80, 190, 60, 14, c("shadow"), { opacity: 0.08 });
    R(k, 0, 78, 52, 44, 8, c("surface"), { stroke: c("surface2"), "stroke-width": 2 });
    R(k, 14, 90, 8, 8, 2, c("ink"), { opacity: 0.55 });
    R(k, 14, 102, 8, 8, 2, c("ink"), { opacity: 0.55 });
    R(k, 40, 70, 150, 60, 14, c("accent3"));
    sv("circle", { cx: 168, cy: 100, r: 7, fill: c("field") }, k);
    return {
      g: g, w: 300 * s, h: 130 * s, base: 130 * s, scale: s,
      slot: { x: 198 * s, y: 0, w: 98 * s, h: 130 * s },
      setState: function () {},
    };
  };
  Loom.lesson.usb_drive.size = function (o) { o = o || {}; const w = o.w || 300; return { w: w, h: Math.round(130 * w / 300) }; };

  // ---------------------------------------------------------------- cloud
  // natural 382 x 266: cloud 382 x 214, label Cloud under it. opts.w scales; opts.label false hides the label (handle.labelG for a reveal).
  Loom.lesson.cloud = function (ctx, parent, opts) {
    opts = opts || {};
    const c = ctx.c, kit = ctx.kit;
    const s = (opts.w || 382) / 382;
    const g = sv("g", {}, parent);
    const k = sv("g", { transform: "scale(" + s + ")" }, g);
    const shapes = (p, extra) => {
      [[84, 150, 60], [190, 100, 86], [296, 150, 62]].forEach((a) => sv("circle", Object.assign({ cx: a[0], cy: a[1], r: a[2] }, extra), p));
      sv("rect", Object.assign({ x: 84, y: 150, width: 212, height: 61 }, extra), p);
    };
    const gs = sv("g", { transform: "translate(0 10)" }, k);
    shapes(gs, { fill: c("shadow"), opacity: 0.08 });
    shapes(k, { fill: c("surface2"), stroke: c("surface2"), "stroke-width": 4 });
    shapes(k, { fill: c("surface") });
    const labelG = sv("g", {}, k);
    if (opts.label !== false) kit.text(labelG, "Cloud", { role: "label", size: 28, x: 0, y: 222, w: 382, h: 42, align: "center", valign: "middle", weight: 700, color: "muted" });
    return {
      g: g, w: 382 * s, h: 266 * s, scale: s, labelG: labelG,
      slot: { x: 137 * s, y: 58 * s, w: 105 * s, h: 140 * s },
      setState: function () {},
    };
  };
  Loom.lesson.cloud.size = function (o) { o = o || {}; const w = o.w || 382; return { w: w, h: Math.round(266 * w / 382) }; };

  // ---------------------------------------------------------------- bag
  // natural 640 x 440, cutaway. Contents are NOT drawn by the bag: parent the laptop and usb to the same element E.
  Loom.lesson.bag = function (ctx, parent, opts) {
    opts = opts || {};
    const c = ctx.c;
    const s = (opts.w || 640) / 640;
    const g = sv("g", {}, parent);
    const k = sv("g", { transform: "scale(" + s + ")" }, g);
    sv("path", { d: "M 190 80 C 190 -4, 450 -4, 450 80", fill: "none", stroke: c("line"), "stroke-width": 14, "stroke-linecap": "round" }, k);
    R(k, 0, 80, 640, 360, 20, c("shadow"), { opacity: 0.08 });
    R(k, 0, 70, 640, 370, 20, c("surface2"));
    R(k, 36, 100, 568, 250, 14, c("ink"), { opacity: 0.12 });
    R(k, 14, 358, 612, 68, 14, c("surface"));
    R(k, 40, 388, 560, 5, 3, c("line"), { opacity: 0.6 });
    return {
      g: g, w: 640 * s, h: 440 * s, scale: s,
      inner: { x: 36 * s, y: 100 * s, w: 568 * s, h: 250 * s },
      spots: { laptop: { x: 50 * s, y: (350 - 181) * s, w: 300 * s }, usb: { x: 380 * s, y: (350 - 94) * s, w: 216 * s } },
      setState: function () {},
    };
  };
  Loom.lesson.bag.size = function (o) { o = o || {}; const w = o.w || 640; return { w: w, h: Math.round(440 * w / 640) }; };

  // ---------------------------------------------------------------- rule_rail
  const RAIL = {
    large: { w: 280, h: 190, gap: 36, role: "hero", lab: 76 },
    normal: { w: 320, h: 112, gap: 36, role: "title", lab: 42 },
    small: { w: 130, h: 84, gap: 24, role: "title", lab: 0 },
  };
  const RAIL_LABELS = ["3 copies", "2 kinds of storage", "1 offsite"];
  Loom.lesson.rule_rail = function (ctx, parent, opts) {
    opts = opts || {};
    const c = ctx.c, kit = ctx.kit;
    const size = RAIL[opts.size] ? opts.size : "normal";
    const G = RAIL[size];
    let labels = opts.labels === undefined ? size === "normal" : opts.labels;
    if (size === "small") labels = false;
    const g = sv("g", {}, parent);
    const col = { surface2: c("surface2"), accent: c("accent"), ink: c("ink"), muted: c("muted"), onAccent: c("onAccent") };
    const TB = {
      unlit: { fill: col.surface2, fillOp: 1, sh: 0.08, num: col.muted, dash: 0, tick: 0 },
      named: { fill: col.accent, fillOp: 1, sh: 0.08, num: col.onAccent, dash: 0, tick: 0 },
      lit: { fill: col.ink, fillOp: 1, sh: 0.08, num: col.onAccent, dash: 0, tick: 0 },
      missing: { fill: col.surface2, fillOp: 0, sh: 0, num: col.muted, dash: 1, tick: 0 },
      ticked: { fill: col.ink, fillOp: 1, sh: 0.08, num: col.onAccent, dash: 0, tick: 1 },
    };
    const tiles = [];
    ["3", "2", "1"].forEach((n, i) => {
      const x = i * (G.w + G.gap);
      const tg = sv("g", { transform: "translate(" + x + " 0)" }, g);
      const sh = R(tg, 0, size === "large" ? 12 : 8, G.w, G.h, 20, c("shadow"), { opacity: 0.08 });
      const fill = R(tg, 0, 0, G.w, G.h, 20, col.surface2);
      const dash = R(tg, 1.5, 1.5, G.w - 3, G.h - 3, 19, "none", { stroke: c("accent"), "stroke-width": 3, "stroke-dasharray": "12 10", opacity: 0 });
      const num = kit.text(tg, n, { role: G.role, x: 0, y: 0, w: G.w, h: G.h, align: "center", valign: "middle", weight: 700, color: "muted" });
      const tick = sv("g", { opacity: 0 }, tg);
      kit.mark(tick, "yes", G.w - 6, 6, size === "small" ? 32 : 42);
      const labelG = sv("g", { opacity: labels === "hidden" ? 0 : 1 }, tg);
      if (labels) kit.text(labelG, RAIL_LABELS[i], { role: "label", size: 28, x: -10, y: G.h + 12, w: G.w + 20, h: G.lab, align: "center", valign: "top", maxLines: 2, weight: 700, color: "muted" });
      const go = machine(ctx, TB, "unlit", function (v) {
        setFill(fill, v.fill); fill.setAttribute("opacity", f3(v.fillOp));
        sh.setAttribute("opacity", f3(v.sh)); dash.setAttribute("opacity", f3(v.dash));
        setFill(num, v.num); tick.setAttribute("opacity", f3(v.tick));
      }, { delays: { ticked: { tick: 0.4 } } });
      const lab = machine(ctx, { hidden: { o: 0 }, shown: { o: 1 } }, labels === "hidden" ? "hidden" : "shown", function (v) { labelG.setAttribute("opacity", f3(v.o)); });
      tiles.push({ g: tg, x: x, y: 0, w: G.w, h: G.h, cx: x + G.w / 2, cy: G.h / 2, bottom: G.h, labelG: labelG, go: go, showLabel: lab });
    });
    const W = 3 * G.w + 2 * G.gap, Ht = G.h + (labels ? 12 + G.lab : 0);
    return {
      g: g, w: W, h: Ht, tiles: tiles, size: size,
      setState: function (i, state, t, o) {
        if (typeof i === "string") { const st = (typeof state === "number") ? state : null; this.setAll(i, st, t); return; }
        tiles[i].go(state, t, o);
      },
      setAll: function (state, t, o) {
        const st = (o && o.stagger) || 0;
        tiles.forEach((tl, i) => tl.go(state, t == null ? null : t + i * st, o));
      },
      showLabel: function (i, t, o) { tiles[i].showLabel("shown", t, o); },
      state: function (i) { return tiles[i].go.state(); },
    };
  };
  Loom.lesson.rule_rail.size = function (o) {
    o = o || {};
    const size = RAIL[o.size] ? o.size : "normal", G = RAIL[size];
    let labels = o.labels === undefined ? size === "normal" : o.labels;
    if (size === "small") labels = false;
    return { w: 3 * G.w + 2 * G.gap, h: G.h + (labels ? 12 + G.lab : 0) };
  };

  // ---------------------------------------------------------------- place_boundary
  // opts {w, h} = the dashed rectangle; the element box is w x (h + 26) (the pill hangs from the top edge). opts.text, opts.faint.
  const PB_TOP = 26;
  Loom.lesson.place_boundary = function (ctx, parent, opts) {
    opts = opts || {};
    const c = ctx.c, kit = ctx.kit;
    const W = opts.w || 400, H = opts.h || 240, text = opts.text || "Same place";
    const g = sv("g", {}, parent);
    const wash = R(g, 0, PB_TOP + H, W, 0, 20, c("accent3"), { opacity: 0 });
    const dash = R(g, 1.5, PB_TOP + 1.5, W - 3, H - 3, 20, "none", { stroke: c("line"), "stroke-width": 3, "stroke-dasharray": "12 10" });
    const fit = kit.fit(text, { role: "label", w: 400, h: 44, maxLines: 1, weight: 700 });
    const pw = Math.round(((fit && fit.width) || 150) + 64);
    const gp = sv("g", {}, g);
    const pill = R(gp, 28, 0, pw, 52, 26, c("accent"));
    kit.text(gp, text, { role: "label", size: 28, x: 28, y: 0, w: pw, h: 52, align: "center", valign: "middle", weight: 700, color: "onAccent" });
    const TB = {
      drawn: { p: 0, d: 1, pill: c("accent"), po: 1 },
      filled: { p: 1, d: 1, pill: c("accent"), po: 1 },
      cleared: { p: 0, d: 1, pill: c("accent"), po: 1 },
      faint: { p: 0, d: 0.4, pill: c("accent3"), po: 0.8 },
    };
    const go = machine(ctx, TB, opts.faint ? "faint" : (opts.state || "drawn"), function (v) {
      const hh = H * v.p;
      wash.setAttribute("y", f3(PB_TOP + H - hh)); wash.setAttribute("height", f3(hh));
      wash.setAttribute("rx", f3(Math.min(20, hh / 2)));
      wash.setAttribute("opacity", v.p > 0.001 ? 0.55 : 0);
      dash.setAttribute("opacity", f3(v.d)); setFill(pill, v.pill); gp.setAttribute("opacity", f3(v.po));
    }, { durs: { filled: ctx.style.dur("enter") * 1.6, cleared: ctx.style.dur("enter"), faint: ctx.style.dur("move") } });
    return {
      g: g, w: W, h: H + PB_TOP, rect: { x: 0, y: PB_TOP, w: W, h: H }, dash: dash, wash: wash, pill: gp,
      top: { x: W / 2, y: PB_TOP }, setState: go, state: go.state,
    };
  };
  Loom.lesson.place_boundary.size = function (o) { o = o || {}; return { w: o.w, h: o.h + PB_TOP }; };
  // element box (parent coordinates) for a boundary drawn round a rect, with padding: {x, y, w, h, dashW, dashH}
  Loom.lesson.place_boundary.around = function (rect, o) {
    const pad = (o && o.pad != null) ? o.pad : 28;
    return { x: rect.x - pad, y: rect.y - pad - PB_TOP, w: rect.w + 2 * pad, h: rect.h + 2 * pad + PB_TOP, dashW: rect.w + 2 * pad, dashH: rect.h + 2 * pad };
  };
})();
