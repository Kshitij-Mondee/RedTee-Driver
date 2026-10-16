Loom.lesson = Loom.lesson || {};
(function () {
  "use strict";
  const svg = (...a) => Loom.svg(...a);
  const LAY = {
    browser: { x: 110, y: 150, w: 520, h: 550 },
    server: { x: 1430, y: 170, w: 380, h: 530 },
    pathY: 430, nodesX: [810, 1000, 1190, 1380],
  };
  function ease(p) { p = p < 0 ? 0 : p > 1 ? 1 : p; return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; }
  function Ch(init) { this.init = init; this.k = []; }
  Ch.prototype.to = function (v, t, d) { this.k.push({ t, v, d: d || 0 }); this.k.sort((a, b) => a.t - b.t); return this; };
  Ch.prototype.at = function (T) {
    let cur = this.init;
    for (const k of this.k) { if (T < k.t) break; if (k.d > 0 && T < k.t + k.d) return cur + (k.v - cur) * ease((T - k.t) / k.d); cur = k.v; }
    return cur;
  };
  // a mover: keyframed routes (polylines of [x, y]); position is a pure function of time
  function Mv(x, y) { this.x = x; this.y = y; this.k = []; }
  Mv.prototype.go = function (pts, t0, t1) { this.k.push({ t0, t1, pts }); this.k.sort((a, b) => a.t0 - b.t0); return this; };
  Mv.prototype.at = function (T) {
    let cur = [this.x, this.y];
    for (const k of this.k) {
      if (T < k.t0) break;
      const p = k.pts;
      if (T >= k.t1 || p.length < 2) { cur = p[p.length - 1]; continue; }
      const L = [0]; for (let i = 1; i < p.length; i++) L.push(L[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]));
      const s = ease((T - k.t0) / (k.t1 - k.t0)) * L[L.length - 1];
      let i = 1; while (i < p.length - 1 && L[i] < s) i++;
      const f = L[i] - L[i - 1] > 0 ? (s - L[i - 1]) / (L[i] - L[i - 1]) : 1;
      return [p[i - 1][0] + (p[i][0] - p[i - 1][0]) * f, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * f];
    }
    return cur;
  };
  function clock(ctx, render, name) {
    // the tween runs from time 0, so render(T) is a pure function of T for every T: before an instance's first key it shows its
    // INITIAL state, and a state set at ctx.start - 1.2 can never leak into earlier time (P9 fix)
    const T0 = Number.isFinite(ctx.start) ? ctx.start : 0;
    const end = Number.isFinite(ctx.end) ? ctx.end + 2 : T0 + 8;
    const dur = Math.max(end, T0 + 40);
    const o = { t: 0 };
    render(0);
    Loom.tween(o, { t: 0 }, { t: dur, duration: dur, ease: "none", onUpdate: () => render(o.t) }, 0, { kind: "state", beat: (ctx.beat && ctx.beat.id) || "kit", name, content: true });
  }
  const dur = (ctx, n, d) => { try { const v = ctx.style.dur(n); return Number.isFinite(v) ? v : d; } catch (e) { return d; } };
  const setOp = (n, v) => n.setAttribute("opacity", Math.max(0, Math.min(1, v)).toFixed(3));
  const mix = (ctx, a, b, k) => Loom.style.mix(ctx.c(a), ctx.c(b), k);
  const GLY = "@%&*+=?~<>/|{}[]()0123456789abcdefghjkmnpqrstuvwxyzXYZ";
  function noiseStr(seed, n) { const r = Loom.rng(seed); let s = ""; for (let i = 0; i < n; i++) s += GLY[Math.floor(r() * GLY.length)]; return s; }
  function mono(ctx, g, str, x, y, o) {
    o = o || {}; const s = o.size || 28;
    const t = svg("text", { x, y: y + s * 0.78, "font-family": "JetBrains Mono, monospace", "font-size": s, "font-weight": o.weight || 400, fill: ctx.c(o.color || "ink") }, g);
    t.textContent = str; return t;
  }
  function lab(ctx, g, str, x, y, w, h, o) {
    o = o || {};
    return ctx.kit.text(g, str, { role: o.role || "label", size: o.size || 28, x, y, w, h, align: o.align || "left", valign: "middle", maxLines: 1, weight: o.weight || 500, color: o.color || "ink" });
  }
  // apply a partial override table of channel targets at time t
  function applyState(ctx, chans, table, name, t, d) {
    const row = table[name];
    if (!row) { Loom.error("kit_state", "unknown state " + name); return; }
    Object.keys(row).forEach((k) => chans[k].to(row[k], t, d == null ? dur(ctx, "move", 0.36) : d));
  }
  const stub = (id, w, h, states) => function (ctx, parent, opts) {
    const g = svg("g", {}, parent);
    svg("rect", { x: 0, y: 0, width: w, height: h, rx: 20, fill: ctx.c("surface"), stroke: ctx.c("line"), "stroke-width": 2 }, g);
    ctx.kit.text(g, id, { role: "label", size: 28, x: 10, y: 10, w: w - 20, h: 40, weight: 700, color: "ink", maxLines: 1 });
    const mono = svg("text", { x: 20, y: 100, "font-family": "JetBrains Mono, monospace", "font-size": 28, fill: ctx.c("ink") }, g);
    mono.textContent = "password: harbour";
    return { root: g, setState() {} };
  };
  /* ---------------- browser_window (local 520 x 550; canonical station origin 110,150) */
  Loom.lesson.browser_window = function (ctx, parent, opts) {
    opts = opts || {};
    const kit = ctx.kit, c = (t) => ctx.c(t);
    const o0 = opts.origin || [LAY.browser.x, LAY.browser.y];
    const W = 520, H = 550;
    const g = svg("g", {}, parent);
    kit.card(g, 0, 0, W, H, { fill: "surface" });
    svg("path", { d: "M0 20 Q0 0 20 0 H" + (W - 20) + " Q" + W + " 0 " + W + " 20 V56 H0 Z", fill: c("ink") }, g);
    [0, 1, 2].forEach((i) => svg("circle", { cx: 30 + i * 24, cy: 28, r: 7, fill: c("muted") }, g));
    svg("rect", { x: 20, y: 74, width: 480, height: 64, rx: 10, fill: c("field"), stroke: c("surface2"), "stroke-width": 2 }, g);
    const slot = svg("rect", { x: 32, y: 84, width: 44, height: 44, rx: 10, fill: "none", stroke: c("muted"), "stroke-width": 2, "stroke-dasharray": "6 6" }, g);
    const addr = (scheme, host) => {
      const ag = svg("g", {}, g), sz = 28;
      const fs = kit.fit(scheme, { role: "label", w: 2000, h: 40, maxLines: 1, size: sz, weight: 500 });
      lab(ctx, ag, scheme, 88, 74, fs.width + 8, 64, { color: "muted" });
      lab(ctx, ag, host, 88 + fs.width, 74, 404 - fs.width, 64, { weight: 700 });
      return ag;
    };
    const aHttp = addr("http://", "login.example.com"), aHttps = addr("https://", "login.example.com"), aLook = addr("https://", "login-example.co");
    const form = svg("g", {}, g);
    const field = (y, label) => {
      svg("rect", { x: 32, y, width: 456, height: 68, rx: 6, fill: c("field"), stroke: c("surface2"), "stroke-width": 2 }, form);
      lab(ctx, form, label, 52, y, 400, 68, { color: "muted" });
    };
    field(168, "user"); field(256, "password");
    svg("rect", { x: 32, y: 352, width: 210, height: 66, rx: 10, fill: c("muted") }, form);
    lab(ctx, form, "Log in", 32, 352, 210, 66, { align: "center", weight: 700, color: "onAccent" });
    const wp = svg("g", {}, g);
    svg("rect", { x: 24, y: 156, width: 472, height: 372, rx: 20, fill: c("surface"), stroke: c("neg"), "stroke-width": 3 }, wp);
    kit.mark(wp, "no", 96, 252, 72);
    kit.text(wp, "Warning", { role: "lead", size: 42, x: 152, y: 216, w: 320, h: 72, valign: "middle", maxLines: 1, weight: 700, color: "ink" });
    lab(ctx, wp, "Name does not match", 52, 330, 420, 44, { color: "muted" });
    const A = { a0: new Ch(1), a1: new Ch(0), a2: new Ch(0), w: new Ch(0), s: new Ch(0) };
    const render = (T) => {
      setOp(aHttp, A.a0.at(T)); setOp(aHttps, A.a1.at(T)); setOp(aLook, A.a2.at(T)); setOp(slot, A.s.at(T));
      const w = A.w.at(T); setOp(wp, w); wp.setAttribute("transform", "translate(0 " + ((1 - w) * 12).toFixed(2) + ")");
      wp.setAttribute("display", w <= 0.001 ? "none" : "inline");
    };
    const TABLE = {
      login_form: { a0: 1, a1: 0, a2: 0, w: 0, s: 0 },
      http: { a0: 1, a1: 0, a2: 0, w: 0, s: 0 },
      https: { a0: 0, a1: 1, a2: 0, w: 0, s: 1 },
      warning: { w: 1 },
      lookalike_address: { a0: 0, a1: 0, a2: 1, s: 0 },
    };
    clock(ctx, render, "browser_window");
    const P = (x, y) => ({ x: o0[0] + x, y: o0[1] + y });
    return {
      root: g, form, warning: wp,
      anchors: { address: { x: o0[0] + 20, y: o0[1] + 74, w: 480, h: 64 }, padlock: P(54, 106), key_slot: P(420, 522), packet_out: P(520, 280), address_join: P(500, 138), check_panel: { x: 660, y: 150, w: 640, h: 490 } },
      setState(name, t) { applyState(ctx, A, TABLE, name, t); },
      /** slot(on, t): the dashed padlock slot beside the address (on in https, off once the padlock part sits there) */
      slot(on, t) { A.s.to(on ? 1 : 0, t, 0.3); },
      /** address("http" | "https" | "lookalike", t): the address alone, a crossfade */
      address(mode, t) { applyState(ctx, A, { http: { a0: 1, a1: 0, a2: 0 }, https: { a0: 0, a1: 1, a2: 0 }, lookalike: { a0: 0, a1: 0, a2: 1 } }, mode, t); },
    };
  };
  /* ---------------- server_box (local 380 x 530; canonical origin 1430,170) */
  Loom.lesson.server_box = function (ctx, parent, opts) {
    opts = opts || {};
    const kit = ctx.kit, c = (t) => ctx.c(t);
    const o0 = opts.origin || [LAY.server.x, LAY.server.y];
    const g = svg("g", {}, parent);
    const recs = [], dots3 = [];
    [0, 104, 208].forEach((y, i) => {
      kit.rect(g, 0, y, 380, 96, { fill: "surface", r: 14, shadow: true, stroke: "surface2", sw: 3 });
      [0, 1, 2].forEach((k) => svg("rect", { x: 28, y: y + 28 + k * 16, width: 150, height: 6, rx: 3, fill: c("surface2") }, g));
      [0, 1, 2].forEach((k) => { const d = svg("circle", { cx: 262 + k * 32, cy: y + 48, r: 8, fill: c("muted") }, g); if (i === 2) dots3.push(d); });
    });
    const edge = svg("rect", { x: 0, y: 208, width: 380, height: 96, rx: 14, fill: "none", stroke: c("ink"), "stroke-width": 4 }, g);
    svg("line", { x1: 190, y1: 304, x2: 190, y2: 336, stroke: c("muted"), "stroke-width": 2, "stroke-linecap": "round" }, g);
    kit.pill(g, 30, 336, 320, 52, { fill: "surface", stroke: "surface2", sw: 2 });
    lab(ctx, g, "login.example.com", 30, 336, 320, 52, { align: "center", weight: 700 });
    // data store drum, slate; dashed outline version for the not-covered state
    const dsx = 222, dsy = 436, dw = 140, dh = 92, ry = 16;
    const drum = svg("g", {}, g);
    svg("path", { d: "M" + dsx + " " + (dsy + ry) + " V" + (dsy + dh - ry) + " A" + dw / 2 + " " + ry + " 0 0 0 " + (dsx + dw) + " " + (dsy + dh - ry) + " V" + (dsy + ry) + " Z", fill: c("accent3") }, drum);
    svg("ellipse", { cx: dsx + dw / 2, cy: dsy + ry, rx: dw / 2, ry, fill: mix(ctx, "accent3", "surface", 0.35) }, drum);
    const dash = svg("g", {}, g);
    const dp = "M" + dsx + " " + (dsy + ry) + " V" + (dsy + dh - ry) + " A" + dw / 2 + " " + ry + " 0 0 0 " + (dsx + dw) + " " + (dsy + dh - ry) + " V" + (dsy + ry);
    svg("path", { d: dp, fill: "none", stroke: c("muted"), "stroke-width": 3, "stroke-dasharray": "10 8", "stroke-linecap": "round" }, dash);
    svg("ellipse", { cx: dsx + dw / 2, cy: dsy + ry, rx: dw / 2, ry, fill: "none", stroke: c("muted"), "stroke-width": 3, "stroke-dasharray": "10 8" }, dash);
    const A = { rec: new Ch(0), ds: new Ch(0) };
    const render = (T) => {
      const r = A.rec.at(T), d = A.ds.at(T);
      setOp(edge, r); dots3.forEach((x) => x.setAttribute("fill", r > 0.5 ? c("ink") : c("muted")));
      setOp(drum, 1 - d); setOp(dash, d);
    };
    const TABLE = { idle: { rec: 0, ds: 0 }, receiving: { rec: 1 }, data_store_outlined: { ds: 1 } };
    clock(ctx, render, "server_box");
    const P = (x, y) => ({ x: o0[0] + x, y: o0[1] + y });
    return {
      root: g, drum, dashed: dash,
      anchors: { packet_in: P(0, 260), cert_out: P(0, 260), key_slot: P(90, 502), key_cell: P(10, 425), data_store: P(292, 482), name: P(190, 362) },
      setState(name, t) { applyState(ctx, A, TABLE, name, t); },
    };
  };
  /* ---------------- network_path (local 800 x 120; canonical origin 630,370; line at local y 60) */
  Loom.lesson.network_path = function (ctx, parent, opts) {
    opts = opts || {};
    const kit = ctx.kit, c = (t) => ctx.c(t);
    const o0 = opts.origin || [630, 370];
    const g = svg("g", {}, parent);
    const bandInk = svg("rect", { x: 0, y: 60, width: 800, height: 0, rx: 6, fill: c("ink") }, g);
    const bandAcc = svg("rect", { x: 0, y: 60, width: 800, height: 0, rx: 6, fill: c("accent") }, g);
    svg("line", { x1: 0, y1: 60, x2: 800, y2: 60, stroke: c("line"), "stroke-width": 3, "stroke-linecap": "round" }, g);
    const nx = LAY.nodesX.map((x) => x - 630);
    nx.forEach((x) => svg("circle", { cx: x, cy: 60, r: 24, fill: c("surface2"), stroke: c("line"), "stroke-width": 2 }, g));
    lab(ctx, g, "Shared wifi", nx[0] - 130, 88, 260, 36, { align: "center", color: "muted" });
    // two Hello chips (slate goes right, amber comes back) and the label Handshake first
    const chip = (col) => { const h = svg("g", {}, g); svg("rect", { x: -70, y: -24, width: 140, height: 48, rx: 24, fill: c(col) }, h); lab(ctx, h, "Hello", -70, -24, 140, 48, { align: "center", weight: 700, color: "onAccent" }); return h; };
    const chipA = chip("accent3"), chipB = chip("accent2");
    const hsLab = svg("g", {}, g);
    lab(ctx, hsLab, "Handshake first", 250, 126, 300, 40, { align: "center", weight: 700 });
    const mvA = new Mv(56, 60), mvB = new Mv(744, 60);
    const A = { b: new Ch(0), acc: new Ch(0), ha: new Ch(0), hb: new Ch(0), hl: new Ch(0) };
    const render = (T) => {
      const pa = mvA.at(T), pb = mvB.at(T);
      chipA.setAttribute("transform", "translate(" + pa[0].toFixed(2) + " " + pa[1].toFixed(2) + ")"); chipB.setAttribute("transform", "translate(" + pb[0].toFixed(2) + " " + pb[1].toFixed(2) + ")");
      setOp(chipA, A.ha.at(T)); setOp(chipB, A.hb.at(T)); setOp(hsLab, A.hl.at(T));
      const b = A.b.at(T), a = A.acc.at(T), h = 3 + 15 * b;
      [bandInk, bandAcc].forEach((r) => { r.setAttribute("y", (60 - h / 2).toFixed(2)); r.setAttribute("height", h.toFixed(2)); });
      setOp(bandInk, b * (1 - a)); setOp(bandAcc, b * a);
    };
    const TABLE = { plain: { b: 0, acc: 0 }, trip_band: { b: 1 } };
    clock(ctx, render, "network_path");
    const P = (x, y) => ({ x: o0[0] + x, y: o0[1] + y });
    const point = (u) => ({ x: 630 + 800 * u, y: LAY.pathY });
    return {
      root: g,
      anchors: { node1: P(nx[0], 60), node2: P(nx[1], 60), node3: P(nx[2], 60), node4: P(nx[3], 60), browser_end: P(0, 60), server_end: P(800, 60), y: LAY.pathY },
      point,
      setState(name, t) { applyState(ctx, A, TABLE, name, t); },
      /** band colour for the private trip: "accent" when named, "ink" when held */
      bandColor(tone, t) { A.acc.to(tone === "accent" ? 1 : 0, t, dur(ctx, "move", 0.36)); },
      /** hello(t0, t1): a slate Hello chip crosses browser to server, an amber one comes back; the label Handshake first stays until clearHello */
      hello(t0, t1) {
        const m = (t0 + t1) / 2;
        mvA.go([[56, 60], [744, 60]], t0, m); A.ha.to(1, t0, 0.15).to(0, m, 0.15);
        mvB.go([[744, 60], [56, 60]], m, t1); A.hb.to(1, m, 0.15).to(0, t1, 0.15);
        A.hl.to(1, t0, 0.3);
      },
      clearHello(t) { A.hl.to(0, t, 0.3); },
    };
  };
  /* ---------------- watcher (local 400 x 420; canonical origin 800,150; disc centre local 200,280 = node 2) */
  Loom.lesson.watcher = function (ctx, parent, opts) {
    opts = opts || {};
    const kit = ctx.kit, c = (t) => ctx.c(t);
    const o0 = opts.origin || [800, 150];
    const g = svg("g", {}, parent);
    const panel = svg("g", {}, g);
    kit.card(panel, 0, 0, 400, 206, { fill: "surface" });
    lab(ctx, panel, "Watcher", 24, 10, 240, 40, { weight: 700, color: "muted" });
    const cop = svg("g", {}, panel), sig = svg("g", {}, panel), noi = svg("g", {}, panel);
    mono(ctx, cop, "user: alex", 24, 56); mono(ctx, cop, "password: harbour", 24, 92);
    lab(ctx, cop, "Plain HTTP: readable", 24, 152, 352, 40, { weight: 700 });
    svg("rect", { x: 24, y: 66, width: 56, height: 56, rx: 6, fill: c("accent3") }, sig);
    svg("rect", { x: 96, y: 66, width: 56, height: 56, rx: 6, fill: c("accent2") }, sig);
    svg("rect", { x: 196, y: 56, width: 180, height: 80, rx: 10, fill: "none", stroke: c("muted"), "stroke-width": 3, "stroke-dasharray": "10 8" }, sig);
    kit.text(sig, "?", { role: "title", size: 64, x: 196, y: 56, w: 180, h: 80, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "ink" });
    lab(ctx, sig, "Watcher: no key", 24, 152, 352, 40, { weight: 700 });
    [0, 1, 2].forEach((i) => mono(ctx, noi, noiseStr("watcher-noise-" + i, 17), 24, 52 + i * 34, { color: "muted" }));
    lab(ctx, noi, "Watcher: noise", 24, 158, 352, 40, { weight: 700 });
    svg("line", { x1: 200, y1: 206, x2: 200, y2: 246, stroke: c("muted"), "stroke-width": 3, "stroke-linecap": "round" }, g);
    const disc = svg("g", {}, g);
    const dsc = svg("g", {}, disc);
    svg("circle", { cx: 0, cy: 0, r: 36, fill: c("ink") }, dsc);
    const eyeO = svg("g", {}, dsc), eyeC = svg("g", {}, dsc);
    kit.icon(eyeO, "eye", { x: 0, y: 0, size: 40, color: "surface" });
    kit.icon(eyeC, "eye-off", { x: 0, y: 0, size: 40, color: "surface" });
    const A = { vis: new Ch(0), pn: new Ch(0), c: new Ch(0), s: new Ch(0), n: new Ch(0), eye: new Ch(1), pl: new Ch(0), q: new Ch(0) };
    const render = (T) => {
      const q = A.q.at(T), vis = A.vis.at(T), pn = A.pn.at(T);
      setOp(disc, vis * (1 - 0.65 * q)); disc.setAttribute("transform", "translate(200 280)");
      dsc.setAttribute("transform", "scale(" + (1 + 0.16 * A.pl.at(T)).toFixed(3) + ")");
      setOp(eyeO, A.eye.at(T)); setOp(eyeC, 1 - A.eye.at(T));
      setOp(panel, pn); panel.setAttribute("transform", "translate(0 " + ((1 - pn) * 14).toFixed(2) + ")");
      panel.setAttribute("display", pn <= 0.001 ? "none" : "inline");
      setOp(cop, A.c.at(T)); setOp(sig, A.s.at(T)); setOp(noi, A.n.at(T));
    };
    const TABLE = {
      hidden: { vis: 0, pn: 0, c: 0, s: 0, n: 0 },
      eye_open: { vis: 1, eye: 1, pn: 0, c: 0, s: 0, n: 0 },
      copied: { vis: 1, eye: 1, pn: 1, c: 1, s: 0, n: 0 },
      signals: { vis: 1, eye: 1, pn: 1, c: 0, s: 1, n: 0 },
      noise: { vis: 1, eye: 1, pn: 1, c: 0, s: 0, n: 1 },
    };
    clock(ctx, render, "watcher");
    const P = (x, y) => ({ x: o0[0] + x, y: o0[1] + y });
    return {
      root: g, panel, disc,
      anchors: { node: P(200, 280), panel: { x: o0[0], y: o0[1], w: 400, h: 206 }, panel_bottom: P(200, 206) },
      setState(name, t) { applyState(ctx, A, TABLE, name, t); },
      /** eye("open" | "closed", t) */
      eye(mode, t) { A.eye.to(mode === "closed" ? 0 : 1, t, 0.15); },
      /** the eye opens once: a single pulse of the disc */
      pulse(t) { A.eye.to(1, t, 0.15); A.pl.to(1, t, 0.2).to(0, t + 0.2, 0.35); },
      /** quiet(true, t): the disc steps back (b05 to b07, behind the check panel) */
      quiet(on, t) { A.q.to(on ? 1 : 0, t, dur(ctx, "move", 0.36)); },
    };
  };
  /* ---------------- login_packet (local 400 x 270; the card is 330 x 150 at local 35,44; centre local 200,119) */
  Loom.lesson.login_packet = function (ctx, parent, opts) {
    opts = opts || {};
    const kit = ctx.kit, c = (t) => ctx.c(t);
    const org = opts.origin || [0, 0];
    const g = svg("g", {}, parent), body = svg("g", {}, g);
    const CX = 35, CY = 44, CW = 330, CH = 150;
    const card = svg("g", {}, body);
    kit.rect(card, CX, CY, CW, CH, { fill: "surface", r: 14, shadow: true, stroke: "surface2", sw: 2 });
    const plain = svg("g", {}, card);
    lab(ctx, plain, "Login", CX + 24, CY + 10, 200, 40, { weight: 700 });
    mono(ctx, plain, "user: alex", CX + 24, CY + 54); mono(ctx, plain, "password: harbour", CX + 24, CY + 90);
    const rows = [0, 1, 2].map((i) => svg("g", {}, card));
    const S1 = noiseStr("packet-noise-0", 17), S2 = noiseStr("packet-noise-1", 17), S3 = noiseStr("packet-noise-2", 17), ALT = noiseStr("packet-noise-alt", 6);
    const ADV = 16.8, NX = CX + 24;
    mono(ctx, rows[0], S1, NX, CY + 22, { color: "muted" });
    mono(ctx, rows[1], S2.slice(0, 6), NX, CY + 58, { color: "muted" });
    const blockA = mono(ctx, rows[1], S2.slice(6, 12), NX + 6 * ADV, CY + 58, { color: "muted" });
    mono(ctx, rows[1], S2.slice(12), NX + 12 * ADV, CY + 58, { color: "muted" });
    const alt = svg("g", {}, rows[1]);
    svg("rect", { x: NX + 6 * ADV - 3, y: CY + 56, width: 6 * ADV + 6, height: 34, rx: 6, fill: c("surface2") }, alt);
    mono(ctx, alt, ALT, NX + 6 * ADV, CY + 58, { color: "ink", weight: 700 });
    mono(ctx, rows[2], S3, NX, CY + 94, { color: "muted" });
    // the TLS wrap: outline drawn round the card, tab, and the label
    const wrapA = svg("rect", { x: 22, y: 32, width: 356, height: 174, rx: 20, fill: "none", stroke: c("accent"), "stroke-width": 4, pathLength: 1000, "stroke-dasharray": 1000 }, body);
    const wrapI = svg("rect", { x: 22, y: 32, width: 356, height: 174, rx: 20, fill: "none", stroke: c("ink"), "stroke-width": 4, pathLength: 1000, "stroke-dasharray": 1000 }, body);
    const tab = svg("g", {}, body);
    svg("rect", { x: 44, y: 2, width: 84, height: 40, rx: 10, fill: c("accent") }, tab);
    lab(ctx, tab, "TLS", 44, 2, 84, 40, { align: "center", weight: 700, color: "onAccent" });
    const tlsTxt = "HTTPS = HTTP inside TLS";
    const lf = kit.fit(tlsTxt, { role: "label", w: 2000, h: 40, maxLines: 1, size: 28, weight: 700 });
    const lw = Math.min(388, Math.round(lf.width + 40));
    const tlsLab = svg("g", {}, body);
    svg("rect", { x: 200 - lw / 2, y: 214, width: lw, height: 48, rx: 10, fill: c("surface"), stroke: c("surface2"), "stroke-width": 2 }, tlsLab);
    lab(ctx, tlsLab, tlsTxt, 200 - lw / 2, 214, lw, 48, { align: "center", weight: 700 });
    const rej = svg("g", {}, body);
    kit.mark(rej, "no", CX + CW - 8, CY + 8, 60);
    const tamTxt = "Tampering detected";
    const tf = kit.fit(tamTxt, { role: "label", w: 2000, h: 40, maxLines: 1, size: 28, weight: 500 });
    const tw2 = Math.min(300, Math.round(tf.width + 32));
    const tamper = svg("g", {}, body);
    svg("rect", { x: 200 - tw2 / 2, y: 214, width: tw2, height: 48, rx: 10, fill: c("neg") }, tamper);
    lab(ctx, tamper, tamTxt, 200 - tw2 / 2, 214, tw2, 48, { align: "center", weight: 500, color: "onAccent" });
    const A = { nz: new Ch(0), wr: new Ch(0), wt: new Ch(0), lb: new Ch(0), al: new Ch(0), rj: new Ch(0), tm: new Ch(0) };
    const ix = opts.x || 0, iy = opts.y || 0;
    const M = new Mv(ix, iy);
    const render = (T) => {
      const nz = A.nz.at(T), wr = A.wr.at(T), wt = A.wt.at(T), al = A.al.at(T), rj = A.rj.at(T);
      setOp(plain, 1 - nz);
      rows.forEach((r, i) => setOp(r, nz * 1.7 - i * 0.35));
      setOp(alt, al); setOp(blockA, 1 - al); // the original mid block gives way to the altered one
      const off = (1000 * (1 - wr)).toFixed(1);
      wrapA.setAttribute("stroke-dashoffset", off); wrapI.setAttribute("stroke-dashoffset", off);
      setOp(wrapA, wr > 0 ? 1 - wt : 0); setOp(wrapI, wr > 0 ? wt : 0);
      setOp(tab, A.lb.at(T) * (1 - wt)); setOp(tlsLab, A.lb.at(T));
      setOp(rej, rj); setOp(tamper, A.tm.at(T)); setOp(card, 1 - 0.45 * rj);
      const p = M.at(T); g.setAttribute("transform", "translate(" + p[0].toFixed(2) + " " + p[1].toFixed(2) + ")");
    };
    const TABLE = {
      plain: { nz: 0, wr: 0, lb: 0, al: 0, rj: 0, tm: 0 },
      wrapped: { wr: 1, lb: 1 },
      noise: { nz: 1, al: 0 },
      altered: { nz: 1, al: 1 },
      rejected: { rj: 1 },
    };
    clock(ctx, render, "login_packet");
    // the card centre in the parent's coordinates for a STATION point
    const loc = (pt) => [pt.x - org[0] - 200, pt.y - org[1] - 119];
    return {
      root: g, card, plain,
      setState(name, t) { applyState(ctx, A, TABLE, name, t); },
      /** travel({x,y} from, {x,y} to, t0, t1): the card CENTRE goes along the path, in station coordinates; more points via via: [{x,y}] */
      travel(from, to, t0, t1, via) { M.go([loc(from)].concat((via || []).map(loc), [loc(to)]), t0, t1); },
      /** place(pt, t): jump the card centre to a station point */
      place(pt, t) { M.go([loc(pt)], t, t); },
      /** the tampering tag (neg, under the card) as the packet is rejected: tag(true, t) */
      tag(on, t) { A.tm.to(on ? 1 : 0, t, dur(ctx, "enter", 0.5)); },
      /** wrapTone("accent" | "ink", t): the TLS outline blue when named, ink when held */
      wrapTone(tone, t) { A.wt.to(tone === "ink" ? 1 : 0, t, dur(ctx, "move", 0.36)); },
      /** a wrap draws on its word: wrap(t, dur) */
      wrap(t, d) { A.wr.to(1, t, d || dur(ctx, "draw", 0.8)); A.lb.to(1, t + 0.5 * (d || 0.8), 0.3); },
    };
  };
  /* ---------------- certificate_card (local 620 x 420 = the large form; canonical origin 670,180, centre station 980,390) */
  Loom.lesson.certificate_card = function (ctx, parent, opts) {
    opts = opts || {};
    const kit = ctx.kit, c = (t) => ctx.c(t);
    const org = opts.origin || [670, 180];
    const PC = { x: 670 + 310, y: 180 + 210 }; // the panel centre, station
    const g = svg("g", {}, parent);
    const join = svg("g", {}, g);
    const jd = "M0 266 H-20 V108 H-58";
    const jM = svg("path", { d: jd, fill: "none", stroke: c("line"), "stroke-width": 3, "stroke-linecap": "round", "stroke-linejoin": "round", pathLength: 1000, "stroke-dasharray": 1000 }, join);
    const jA = svg("path", { d: jd, fill: "none", stroke: c("accent"), "stroke-width": 4, "stroke-linecap": "round", "stroke-linejoin": "round", pathLength: 1000, "stroke-dasharray": 1000 }, join);
    const card = svg("g", {}, g);
    kit.card(card, 0, 0, 620, 420, { fill: "surface" });
    svg("path", { d: "M48 82 L42 108 L58 98 L60 82 Z M72 82 L78 108 L62 98 L60 82 Z", fill: c("accent3") }, card);
    svg("circle", { cx: 60, cy: 64, r: 26, fill: c("accent3") }, card);
    svg("circle", { cx: 60, cy: 64, r: 15, fill: "none", stroke: c("surface"), "stroke-width": 3 }, card);
    const txt = svg("g", {}, card), skel = svg("g", {}, card);
    kit.text(txt, "login.example.com", { role: "lead", size: 40, x: 104, y: 30, w: 484, h: 70, valign: "middle", maxLines: 1, weight: 700, color: "ink" });
    svg("line", { x1: 32, y1: 126, x2: 588, y2: 126, stroke: c("line"), "stroke-width": 2, opacity: 0.5 }, card);
    const RY = [134, 224, 314], names = ["Issuer", "Name", "Date"], vals = ["Trusted authority", "login.example.com", null];
    const hlI = [], hlA = [], tick = [], cross = [];
    RY.forEach((y, i) => {
      const my = y + 42;
      hlI.push(lab(ctx, txt, names[i], 32, y, 150, 84, { weight: 700 }));
      hlA.push(lab(ctx, txt, names[i], 32, y, 150, 84, { weight: 700, color: "accent" }));
      if (vals[i]) lab(ctx, txt, vals[i], 196, y, 310, 84, { weight: 500 });
      svg("rect", { x: 196, y: my - 24, width: 220, height: 10, rx: 5, fill: c("surface2") }, skel);
      svg("circle", { cx: 566, cy: my, r: 28, fill: "none", stroke: c("line"), "stroke-width": 2, "stroke-dasharray": "6 6", opacity: 0.6 }, txt);
      const tg = svg("g", {}, txt); kit.mark(tg, "yes", 566, my, 52); tick.push(tg);
      const cg = svg("g", {}, txt); kit.mark(cg, "no", 566, my, 52); cross.push(cg);
    });
    // the validity bar of the Date row, with a today marker
    const dy = RY[2] + 42;
    svg("rect", { x: 196, y: dy - 7, width: 300, height: 14, rx: 6, fill: c("surface2") }, txt);
    svg("rect", { x: 266, y: dy - 7, width: 180, height: 14, rx: 6, fill: c("accent3") }, txt);
    const mk = svg("rect", { x: -5, y: dy - 20, width: 10, height: 40, rx: 5, fill: c("ink") }, txt);
    const A = { sc: new Ch(1), tx: new Ch(0), hl0: new Ch(0), hl1: new Ch(0), hl2: new Ch(0), tk0: new Ch(0), tk1: new Ch(0), tk2: new Ch(0), cx1: new Ch(0), mk: new Ch(0), nl: new Ch(0), nla: new Ch(0) };
    const M = new Mv(PC.x - org[0], PC.y - org[1]);
    const render = (T) => {
      const s = A.sc.at(T), p = M.at(T), tx = Math.max(0, Math.min(1, (s - 0.8) / 0.2));
      card.setAttribute("transform", "translate(" + (p[0] - 310 * s).toFixed(2) + " " + (p[1] - 210 * s).toFixed(2) + ") scale(" + s.toFixed(4) + ")");
      setOp(txt, tx); setOp(skel, 1 - tx);
      for (let i = 0; i < 3; i++) { const h = A["hl" + i].at(T); setOp(hlA[i], h); setOp(hlI[i], 1 - h); setOp(tick[i], A["tk" + i].at(T)); }
      setOp(cross[0], 0); setOp(cross[2], 0); setOp(cross[1], A.cx1.at(T));
      mk.setAttribute("x", (196 + 14 + A.mk.at(T) * 160 - 5).toFixed(2));
      const nl = A.nl.at(T), nla = A.nla.at(T);
      join.setAttribute("transform", "translate(" + (p[0] - 310).toFixed(2) + " " + (p[1] - 210).toFixed(2) + ")");
      const off = (1000 * (1 - nl)).toFixed(1);
      jM.setAttribute("stroke-dashoffset", off); jA.setAttribute("stroke-dashoffset", off);
      setOp(jM, nl > 0 ? 1 - nla : 0); setOp(jA, nl > 0 ? nla : 0);
    };
    const D = () => dur(ctx, "move", 0.36);
    const set = (o, t, d) => Object.keys(o).forEach((k) => A[k].to(o[k], t, d == null ? D() : d));
    const HL = (i) => ({ hl0: i === 0 ? 1 : 0, hl1: i === 1 ? 1 : 0, hl2: i === 2 ? 1 : 0 });
    clock(ctx, render, "certificate_card");
    const st = {
      small(t) { set({ sc: 0.4 }, t, dur(ctx, "enter", 0.5)); },
      in_panel(t) { const cur = M.at(t); M.go([cur, [PC.x - org[0], PC.y - org[1]]], t, t + 0.8); set({ sc: 1 }, t, 0.8); },
      row_issuer(t) { set(HL(0), t); },
      row_name(t) { set(HL(1), t); set({ nl: 1, nla: 1 }, t, 0.6); },
      row_date(t) { set(HL(2), t); set({ mk: 1 }, t, 0.8); },
      tick_issuer(t) { set({ tk0: 1, hl0: 0 }, t); },
      tick_name(t) { set({ tk1: 1, cx1: 0, hl1: 0, nla: 0 }, t); },
      tick_date(t) { set({ tk2: 1, hl2: 0 }, t); },
      name_fail(t) { set({ tk1: 0, cx1: 1, hl1: 0, nla: 0 }, t); },
      all_pass(t) { set({ tk0: 1, tk1: 1, tk2: 1, cx1: 0, hl0: 0, hl1: 0, hl2: 0, mk: 1, nl: 1, nla: 0 }, t); },
    };
    const P = (x, y) => ({ x: PC.x - 310 + x, y: PC.y - 210 + y });
    return {
      root: g, card, join,
      anchors: { centre: PC, title: P(104, 65), row_issuer: P(0, 176), row_name: P(0, 266), row_date: P(0, 356), panel: { x: 660, y: 150, w: 640, h: 490 } },
      setState(name, t) { if (!st[name]) { Loom.error("kit_state", "unknown state " + name); return; } st[name](t); },
      /** travel(from, to, t0, t1): the card CENTRE moves along the path (station points), at its current scale */
      travel(from, to, t0, t1, via) { const L = (p) => [p.x - org[0], p.y - org[1]]; M.go([L(from)].concat((via || []).map(L), [L(to)]), t0, t1); },
      /** place(pt, t): jump the card centre to a station point (the server's cert_out) */
      place(pt, t) { M.go([[pt.x - org[0], pt.y - org[1]]], t, t); },
    };
  };
  /* ---------------- key_exchange (both ends in one band; local box 1170 x 330, canonical origin 440,380) */
  const KEY_D = "M24 2 a22 22 0 1 0 0.01 0 Z M24 16 a8 8 0 1 1 -0.01 0 Z M44 19 H124 V40 H114 V30 H106 V44 H96 V30 H44 Z";
  Loom.lesson.key_exchange = function (ctx, parent, opts) {
    opts = opts || {};
    const kit = ctx.kit, c = (t) => ctx.c(t);
    const org = opts.origin || [440, 380];
    const g = svg("g", {}, parent);
    const lc = (x, y) => [x - org[0], y - org[1]];
    const ends = {}, signals = {};
    const mkEnd = (side, cx0, cy0, own) => {
      const e = svg("g", { transform: "translate(" + lc(cx0, cy0).join(" ") + ")" }, g);
      const slot = svg("path", { d: KEY_D, transform: "translate(18 52)", fill: "none", stroke: c("muted"), "stroke-width": 3, "stroke-dasharray": "8 6", "fill-rule": "evenodd" }, e);
      const om = svg("rect", { x: 28, y: 0, width: 44, height: 44, rx: 6, fill: c(own) }, e);
      const merge = svg("path", { d: "M50 44 L80 54 M110 44 L80 54", fill: "none", stroke: c("line"), "stroke-width": 3, "stroke-linecap": "round", pathLength: 1000, "stroke-dasharray": 1000 }, e);
      const kA = svg("path", { d: KEY_D, transform: "translate(18 52)", fill: c("accent"), "fill-rule": "evenodd" }, e);
      const kI = svg("path", { d: KEY_D, transform: "translate(18 52)", fill: c("ink"), "fill-rule": "evenodd" }, e);
      ends[side] = { g: e, slot, own: om, merge, kA, kI, cx: cx0, cy: cy0 };
    };
    mkEnd("browser", 450, 595, "accent3");
    mkEnd("server", 1440, 595, "accent2");
    const mkSig = (name, col, laneY) => {
      const s = svg("g", {}, g); svg("rect", { x: -22, y: -22, width: 44, height: 44, rx: 6, fill: c(col) }, s); signals[name] = { g: s, laneY };
    };
    mkSig("browser", "accent3", 408); mkSig("server", "accent2", 452);
    const A = { sl: new Ch(1), om: new Ch(0), sg: new Ch(0), kf: new Ch(0), kc: new Ch(0), mg: new Ch(0), sx: new Ch(0) };
    const mvB = new Mv(0, 0), mvS = new Mv(0, 0);
    const render = (T) => {
      const sl = A.sl.at(T), om = A.om.at(T), kf = A.kf.at(T), kc = A.kc.at(T), mg = A.mg.at(T);
      Object.keys(ends).forEach((k) => {
        const e = ends[k]; setOp(e.slot, sl * (1 - kf)); setOp(e.own, om);
        setOp(e.kA, kf * (1 - kc)); setOp(e.kI, kf * kc);
        e.merge.setAttribute("stroke-dashoffset", (1000 * (1 - mg)).toFixed(1)); setOp(e.merge, mg > 0 ? 1 : 0);
      });
      const sg = A.sg.at(T);
      [[signals.browser, mvB], [signals.server, mvS]].forEach(([s, m]) => { const p = m.at(T); s.g.setAttribute("transform", "translate(" + p[0].toFixed(2) + " " + p[1].toFixed(2) + ")"); setOp(s.g, sg); });
    };
    // the routes in station points: own mark, out beside the window, along its lane, in beside the server, to the far arrival spot
    const bOwn = [500, 617], bArr = [560, 617], sOwn = [1490, 617], sArr = [1550, 617];
    const routeB = [bOwn, [660, 617], [660, 408], [1405, 408], [1405, 617], sArr];
    const routeS = [sOwn, [1405, 617], [1405, 452], [660, 452], [660, 617], bArr];
    const L = (r) => r.map((p) => lc(p[0], p[1]));
    mvB.x = lc.apply(null, bOwn)[0]; mvB.y = lc.apply(null, bOwn)[1]; mvS.x = lc.apply(null, sOwn)[0]; mvS.y = lc.apply(null, sOwn)[1];
    const D = () => dur(ctx, "move", 0.36);
    const set = (o, t, d) => Object.keys(o).forEach((k) => A[k].to(o[k], t, d == null ? D() : d));
    const send = (t0, t1) => { set({ sg: 1 }, t0, 0.15); mvB.go(L(routeB), t0, t1); mvS.go(L(routeS), t0, t1); };
    clock(ctx, render, "key_exchange");
    const API = {
      slots_empty(t) { set({ sl: 1, om: 0, sg: 0, kf: 0, kc: 0, mg: 0 }, t); },
      own_marks(t) { set({ sl: 1, om: 1 }, t); },
      signals_travel(t) { send(t, t + 2.4); },
      combine(t) { set({ mg: 1 }, t, 0.5); set({ kf: 1, kc: 0 }, t + 0.35, 0.6); set({ sg: 0 }, t + 0.9, 0.4); set({ mg: 0 }, t + 0.9, 0.4); },
      key_named(t) { set({ kf: 1, kc: 0 }, t, 0.5); set({ sg: 0, mg: 0 }, t, 0.3); },
      key_held(t) { set({ kf: 1, kc: 1 }, t, 0.6); set({ sg: 0, mg: 0 }, t, 0.3); },
    };
    const S = (side, dx, dy) => ({ x: ends[side].cx + dx, y: ends[side].cy + dy });
    return {
      root: g, ends, signals,
      anchors: { browser: { own_mark: S("browser", 50, 22), arrival: S("browser", 110, 22), key_slot: S("browser", 80, 75) }, server: { own_mark: S("server", 50, 22), arrival: S("server", 110, 22), key_slot: S("server", 80, 75) }, lanes: { browser_signal: 408, server_signal: 452 } },
      setState(name, t) { if (!API[name]) { Loom.error("kit_state", "unknown state " + name); return; } API[name](t); },
      /** signals(t0, t1): the slate signal goes right and the amber signal goes left, crossing at the watcher; arrive at t1 */
      signals(t0, t1) { send(t0, t1); },
    };
  };
  /* ---------------- padlock (96 x 96 natural; opts.size scales it: 44 in the bar, 96 for the close) */
  Loom.lesson.padlock = function (ctx, parent, opts) {
    opts = opts || {};
    const kit = ctx.kit, c = (t) => ctx.c(t);
    const sz = opts.size || 96, k = sz / 96;
    const g = svg("g", { transform: "scale(" + k.toFixed(4) + ")" }, parent);
    const mk = (tone) => {
      const v = svg("g", {}, g), sh = svg("g", {}, v);
      svg("path", { d: "M32 46 V32 A16 16 0 0 1 64 32 V46", fill: "none", stroke: c(tone), "stroke-width": 9, "stroke-linecap": "round" }, sh);
      svg("rect", { x: 16, y: 44, width: 64, height: 46, rx: 10, fill: c(tone) }, v);
      svg("circle", { cx: 48, cy: 64, r: 6, fill: c("surface") }, v);
      svg("rect", { x: 45, y: 66, width: 6, height: 12, rx: 3, fill: c("surface") }, v);
      return { v, sh };
    };
    const L = { open: mk("muted"), named: mk("accent"), held: mk("ink") };
    const A = { cl: new Ch(0), m: new Ch(1), n: new Ch(0), h: new Ch(0) };
    const render = (T) => {
      const cl = A.cl.at(T);
      [L.open, L.named, L.held].forEach((l) => l.sh.setAttribute("transform", "translate(0 " + (-16 * (1 - cl)).toFixed(2) + ")"));
      setOp(L.open.v, A.m.at(T)); setOp(L.named.v, A.n.at(T)); setOp(L.held.v, A.h.at(T));
    };
    const D = () => dur(ctx, "enter", 0.5);
    const TABLE = { open: { cl: 0, m: 1, n: 0, h: 0 }, closed_named: { cl: 1, m: 0, n: 1, h: 0 }, closed_held: { cl: 1, m: 0, n: 0, h: 1 } };
    clock(ctx, render, "padlock");
    return { root: g, setState(name, t) { applyState(ctx, A, TABLE, name, t, D()); } };
  };
  /* ---------------- step_bar (local 1200 x 90; canonical origin 360,780; three tiles 384 wide, gap 24) */
  Loom.lesson.step_bar = function (ctx, parent, opts) {
    opts = opts || {};
    const kit = ctx.kit, c = (t) => ctx.c(t);
    const g = svg("g", {}, parent);
    const names = ["Prove who", "Agree a key", "Scramble"], tiles = [];
    names.forEach((nm, i) => {
      const x = i * 408, tg = svg("g", {}, g);
      const base = svg("g", {}, tg);
      kit.card(base, x, 0, 384, 90, { fill: "surface" });
      const acc = svg("rect", { x, y: 0, width: 384, height: 90, rx: 20, fill: c("accent") }, tg);
      const tI = lab(ctx, tg, nm, x + 92, 0, 280, 90, { weight: 700 });
      const tW = lab(ctx, tg, nm, x + 92, 0, 280, 90, { weight: 700, color: "onAccent" });
      const dN = svg("g", {}, tg), dW = svg("g", {}, tg), dD = svg("g", {}, tg);
      svg("circle", { cx: x + 50, cy: 45, r: 28, fill: c("accent3") }, dN);
      kit.text(dN, String(i + 1), { role: "label", size: 28, x: x + 22, y: 17, w: 56, h: 56, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "onAccent" });
      svg("circle", { cx: x + 50, cy: 45, r: 28, fill: c("surface") }, dW);
      kit.text(dW, String(i + 1), { role: "label", size: 28, x: x + 22, y: 17, w: 56, h: 56, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "accent" });
      svg("circle", { cx: x + 50, cy: 45, r: 28, fill: c("ink") }, dD);
      kit.mark(dD, "yes", x + 50, 45, 36);
      tiles.push({ tg, acc, tI, tW, dN, dW, dD, vis: new Ch(0), nm: new Ch(0), dn: new Ch(0) });
    });
    const render = (T) => {
      tiles.forEach((t) => {
        const v = t.vis.at(T), n = t.nm.at(T), d = t.dn.at(T);
        setOp(t.tg, v); t.tg.setAttribute("transform", "translate(0 " + ((1 - v) * 12).toFixed(2) + ")");
        // the label colour swaps LATE (no mid-blend frame has white on pale blue): the fill is full by n 0.5, the ink label and
        // slate disc are gone by n 0.4, the white label and disc only fade in from n 0.6
        const cl = (v) => Math.max(0, Math.min(1, v));
        const inkK = 1 - cl((n - 0.15) / 0.25), whiteK = cl((n - 0.6) / 0.3);
        setOp(t.acc, cl(n / 0.5)); setOp(t.tI, inkK); setOp(t.tW, whiteK);
        setOp(t.dN, inkK * (1 - d)); setOp(t.dW, whiteK); setOp(t.dD, (1 - cl(n / 0.4)) * d);
      });
    };
    const TABLE = { hidden: { vis: 0, nm: 0, dn: 0 }, shown: { vis: 1, nm: 0, dn: 0 }, named: { vis: 1, nm: 1, dn: 0 }, done: { vis: 1, nm: 0, dn: 1 }, all_done: { vis: 1, nm: 0, dn: 1 } };
    clock(ctx, render, "step_bar");
    const tile = (i, name, t) => {
      const row = TABLE[name]; if (!row) { Loom.error("kit_state", "unknown state " + name); return; }
      Object.keys(row).forEach((k) => tiles[i][k].to(row[k], t, dur(ctx, "enter", 0.5)));
    };
    return {
      root: g, tiles: tiles.map((t) => t.tg),
      anchors: { tile1: { x: 360, y: 780, w: 384, h: 90 }, tile2: { x: 768, y: 780, w: 384, h: 90 }, tile3: { x: 1176, y: 780, w: 384, h: 90 } },
      /** setState(name, t, i): i = 0, 1, 2 for one tile; leave i out for all three (hidden, shown, done, all_done). named needs i. */
      setState(name, t, i) { if (i == null) tiles.forEach((_, k) => tile(k, name === "named" ? "shown" : name, t)); else tile(i, name, t); },
      tile(i, name, t) { tile(i, name, t); },
    };
  };
})();
