Loom.lesson = Loom.lesson || {};
(function () {
  var UID = 0;
  var S = function (tag, attrs, parent) { return Loom.svg(tag, attrs, parent); };
  var lerp = function (a, b, v) { return a + (b - a) * v; };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var f2 = function (v) { return Math.round(v * 100) / 100; };

  // A part keeps a parameter object P and one pure render(P). go() tweens named keys, run() drives P.T (time).
  function model(ctx, P, render) {
    var cur = {}; Object.keys(P).forEach(function (k) { cur[k] = P[k]; });
    var segs = [{ t0: -1e9, t1: 0, T0: 0, T1: 0 }];
    var D = function (k, f) { try { var v = ctx.style.dur(k); return typeof v === "number" ? v : f; } catch (e) { return f; } };
    var M = {
      P: P, D: D,
      go: function (t, dur, target, ease) {
        var from = {}; Object.keys(target).forEach(function (k) { from[k] = cur[k]; cur[k] = target[k]; });
        var keys = Object.keys(target);
        Loom.drive(function (e) { keys.forEach(function (k) { P[k] = from[k] + (target[k] - from[k]) * e; }); render(P); }, t, dur === undefined ? D("move", 0.38) : dur, ease || "move");
      },
      run: function (t0, t1, speed) {
        var last = segs[segs.length - 1], T0 = last.T1, T1 = T0 + (t1 - t0) * (speed === undefined ? 1 : speed);
        segs.push({ t0: t0, t1: t1, T0: T0, T1: T1 });
        Loom.drive(function (e) { P.T = lerp(T0, T1, e); render(P); }, t0, t1 - t0, "linear");
      },
      Tat: function (t) {
        var T = 0; segs.forEach(function (s) { if (t >= s.t1) T = s.T1; else if (t > s.t0) T = lerp(s.T0, s.T1, (t - s.t0) / (s.t1 - s.t0)); });
        return T;
      },
      render: function () { render(P); }
    };
    return M;
  }
  // a body shape with the pack's offset shadow and a crescent shade, clipped to its own outline
  function shaded(g, kind, a, fill, ctx, o) {
    o = o || {};
    var id = "kc" + (++UID);
    var mk = function (parent, extra) { return S(kind, Object.assign({}, a, extra || {}), parent); };
    if (o.shadow !== false) mk(g, { fill: ctx.c("shadow"), opacity: 0.4, transform: "translate(0 12)" });
    var body = mk(g, { fill: ctx.c(fill), stroke: o.stroke ? ctx.c(o.stroke) : "none", "stroke-width": o.sw || 4 });
    var defs = S("defs", {}, g), cp = S("clipPath", { id: id }, defs); mk(cp, {});
    var cg = S("g", { "clip-path": "url(#" + id + ")" }, g);
    var sh = Object.assign({}, a);
    var dx = o.dx === undefined ? -0.3 : o.dx, dy = o.dy === undefined ? -0.3 : o.dy;
    var sz = o.size || 100;
    S(kind, Object.assign({}, a, { fill: ctx.c("shadow"), opacity: 0.0 }), cg);
    // lit crescent: the body minus an offset copy, painted light on the top-left; dark on the bottom-right
    var lit = S("g", {}, cg);
    S(kind, Object.assign({}, a, { fill: "none", stroke: ctx.c("ink"), "stroke-width": sz * 0.07, opacity: 0.18, transform: "translate(" + f2(-dx * sz * 0.0) + " 0)" }), lit);
    var dk = S(kind, Object.assign({}, a, { fill: ctx.c("shadow"), opacity: 0.28, transform: "translate(" + f2(-dx * sz * 0.22) + " " + f2(-dy * sz * 0.22) + ")" }), cg);
    dk.setAttribute("fill-rule", "evenodd");
    return body;
  }
  function crescentDisc(g, ctx, cx, cy, r, fill, o) {
    o = o || {};
    var id = "kd" + (++UID);
    if (o.shadow !== false) S("circle", { cx: cx, cy: cy + 12, r: r, fill: ctx.c("shadow"), opacity: 0.4 }, g);
    S("circle", { cx: cx, cy: cy, r: r, fill: ctx.c(fill) }, g);
    var defs = S("defs", {}, g), cp = S("clipPath", { id: id }, defs); S("circle", { cx: cx, cy: cy, r: r }, cp);
    var cg = S("g", { "clip-path": "url(#" + id + ")" }, g);
    var d = r * 0.14;
    // lit rim: main circle minus a copy pushed to the bottom-right (evenodd)
    var p = function (x, y) { return "M" + f2(x - r) + " " + f2(y) + "a" + r + " " + r + " 0 1 0 " + f2(2 * r) + " 0a" + r + " " + r + " 0 1 0 " + f2(-2 * r) + " 0z"; };
    S("path", { d: p(cx, cy) + p(cx + d * 1.2, cy + d * 1.2), "fill-rule": "evenodd", fill: ctx.c("ink"), opacity: o.lit === undefined ? 0.22 : o.lit }, cg);
    S("path", { d: p(cx, cy) + p(cx - d * 1.6, cy - d * 1.6), "fill-rule": "evenodd", fill: ctx.c("shadow"), opacity: o.dark === undefined ? 0.38 : o.dark }, cg);
    return cg;
  }
  function tp(a) { return a * Math.PI / 180; }

  // ---------------------------------------------------------------- clock_face
  // anatomy: face disc (ink ring, surface fill, crescent), ticks, crown, hour + long hand, slot anchor for a microsecond chip
  Loom.lesson.clock_face = function (ctx, parent, opts) {
    opts = opts || {};
    var Dm = opts.size || opts.w || 300, r = Dm / 2, sw = Math.max(3, r * 0.035);
    var finish = opts.finish || "atomic";
    var root = S("g", {}, parent), g = S("g", { transform: "translate(" + r + " " + r + ")" }, root);
    var scl = S("g", {}, g);
    crescentDisc(scl, ctx, 0, 0, r - sw, "surface");
    S("circle", { cx: 0, cy: 0, r: r - sw, fill: "none", stroke: ctx.c("ink"), "stroke-width": sw }, scl);
    var tk = S("g", {}, scl);
    if (finish === "atomic") {
      for (var i = 0; i < 60; i++) { var a = tp(i * 6), big = i % 5 === 0, r1 = r - sw * 1.6 - (big ? r * 0.12 : r * 0.05), r2 = r - sw * 1.6;
        S("line", { x1: f2(Math.sin(a) * r1), y1: f2(-Math.cos(a) * r1), x2: f2(Math.sin(a) * r2), y2: f2(-Math.cos(a) * r2), stroke: ctx.c(big ? "ink" : "muted"), "stroke-width": big ? sw * 0.9 : sw * 0.45, "stroke-linecap": "round" }, tk); }
    } else {
      for (var j = 0; j < 4; j++) { var b = tp(j * 90), q1 = r - sw * 1.6 - r * 0.16, q2 = r - sw * 1.6;
        S("line", { x1: f2(Math.sin(b) * q1), y1: f2(-Math.cos(b) * q1), x2: f2(Math.sin(b) * q2), y2: f2(-Math.cos(b) * q2), stroke: ctx.c("ink"), "stroke-width": sw * 1.2, "stroke-linecap": "round" }, tk); }
    }
    // crown at the rim, its notch shows the turn
    var crown = S("g", { transform: "translate(0 " + f2(-r - sw * 0.2) + ")" }, g);
    S("circle", { cx: 0, cy: 0, r: r * 0.085, fill: ctx.c("surface2"), stroke: ctx.c("ink"), "stroke-width": sw * 0.7 }, crown);
    var notch = S("line", { x1: 0, y1: f2(-r * 0.085), x2: 0, y2: f2(r * 0.085), stroke: ctx.c("accent2"), "stroke-width": sw * 0.8, "stroke-linecap": "round" }, crown);
    var ping = S("circle", { cx: 0, cy: 0, r: r, fill: "none", stroke: ctx.c("accent2"), "stroke-width": sw, opacity: 0 }, g);
    var hr = S("line", { x1: 0, y1: 0, x2: 0, y2: f2(-r * 0.42), stroke: ctx.c("ink"), "stroke-width": sw * 2, "stroke-linecap": "round" }, g);
    var mn = S("line", { x1: 0, y1: f2(r * 0.12), x2: 0, y2: f2(-r * 0.72), stroke: ctx.c("accent2"), "stroke-width": sw * 1.3, "stroke-linecap": "round" }, g);
    S("circle", { cx: 0, cy: 0, r: sw * 1.6, fill: ctx.c("ink") }, g);
    var P = { T: 0, off: 0, adv: 0, wob: finish === "quartz" ? 0.35 : 0, knob: 0, ping: 0, scl: 1, hl: 0 };
    var rate = opts.speed || 36; // degrees per timeline second of the long hand
    var rnd = Loom.rng("clock" + finish);
    var M = model(ctx, P, function (P) {
      var T = P.T, T2 = finish === "quartz" ? Math.floor(T * 2) / 2 : T;
      var w = P.wob * (3.2 * Math.sin(T * 9.1) + 1.7 * Math.sin(T * 17.3 + 1));
      var ang = T2 * rate + P.off + P.adv + w + (opts.start || 0);
      mn.setAttribute("transform", "rotate(" + f2(ang) + ")");
      hr.setAttribute("transform", "rotate(" + f2(ang / 12 + (opts.start || 0) * 0.5 + P.off * 0.2) + ")");
      notch.setAttribute("transform", "rotate(" + f2(P.knob) + ")");
      ping.setAttribute("opacity", f2(P.ping * (1 - P.ping) * 3.2));
      ping.setAttribute("r", f2(r * (1 + P.ping * 0.18)));
      scl.setAttribute("transform", "scale(" + f2(P.scl) + ")");
    });
    M.render();
    var T0 = 0.38;
    var api = {
      g: root, root: root, hands: { long: mn, short: hr }, anchors: { center: { x: r, y: r }, chip: { x: Dm + 24, y: r }, radius: r },
      run: M.run, Tat: M.Tat,
      setState: function (name, t, o) {
        o = o || {}; var d = o.dur;
        if (name === "steady") M.go(t, d, { off: 0, adv: 0, wob: finish === "quartz" ? 0.35 : 0 });
        else if (name === "off") M.go(t, d === undefined ? 0.2 : d, { off: o.deg === undefined ? 55 : o.deg, wob: 1 });
        else if (name === "behind") M.go(t, d === undefined ? 1.6 : d, { adv: -(o.deg === undefined ? 40 : o.deg) }, "linear");
        else if (name === "ahead") M.go(t, d === undefined ? 1.6 : d, { adv: o.deg === undefined ? 90 : o.deg }, "linear");
        else if (name === "in_step") { M.go(t, d === undefined ? 0.7 : d, { off: 0, adv: 0, wob: 0 }); M.go(t + 0.5, 0.9, { ping: 1 }); M.go(t + 1.5, 0.01, { ping: 0 }, "linear"); }
        else if (name === "set_slow") M.go(t, d === undefined ? 1.0 : d, { knob: -(o.deg === undefined ? 120 : o.deg), adv: -(o.slow === undefined ? 30 : o.slow) });
        else if (name === "small") M.go(t, d, { scl: o.scale || 0.3 });
        else if (name === "large") M.go(t, d, { scl: 1 });
      }
    };
    return api;
  };

  // ---------------------------------------------------------------- stubs (replaced one by one)
  var stub = function (name, w, h) {
    return function (ctx, parent, opts) {
      opts = opts || {}; var g = S("g", {}, parent);
      S("rect", { x: 0, y: 0, width: w, height: h, rx: 26, fill: ctx.c("surface2"), stroke: ctx.c("line"), "stroke-width": 4 }, g);
      return { g: g, setState: function () {} };
    };
  };
  // ---------------------------------------------------------------- night_city
  // 1920 x 1080. plan: map from above (home (700,540) on a street crossing, 360 px = 300 m, far edge up-right).
  // skyline: towers along the lower half (ground y 900), air band y 210..350, tall tower x 750..890, bounce point on its right face.
  Loom.lesson.night_city = function (ctx, parent, opts) {
    opts = opts || {};
    var root = S("g", {}, parent);
    var planG = S("g", {}, root), skyG = S("g", { opacity: 0 }, root);
    // plan
    S("rect", { x: 0, y: 0, width: 1920, height: 1080, fill: ctx.c("field") }, planG);
    var plan = cityPlan(ctx, planG, 0, 0, 1920, 1080, "nightcity", { fine: 1 });
    var lampG = S("g", {}, planG), rl = Loom.rng("lamps");
    [220, 420, 700, 900, 1120, 1330, 1540, 1760].forEach(function (lx) { [190, 360, 540, 700, 860].forEach(function (ly) { S("circle", { cx: lx, cy: ly, r: 5, fill: ctx.c("accent2"), opacity: 0.7 }, lampG); }); });
    // skyline
    var rnd = Loom.rng("skyline");
    S("rect", { x: 0, y: 0, width: 1920, height: 1080, fill: ctx.c("field") }, skyG);
    var gid = "kg" + (++UID), gdefs = S("defs", {}, skyG), lgx = S("linearGradient", { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 }, gdefs);
    S("stop", { offset: 0, "stop-color": ctx.c("muted"), "stop-opacity": 0 }, lgx); S("stop", { offset: 0.5, "stop-color": ctx.c("muted"), "stop-opacity": 0.16 }, lgx); S("stop", { offset: 1, "stop-color": ctx.c("muted"), "stop-opacity": 0 }, lgx);
    S("rect", { x: 0, y: 170, width: 1920, height: 200, fill: "url(#" + gid + ")" }, skyG);
    var bld = S("g", {}, skyG), wl = S("g", {}, skyG), wl2 = S("g", {}, skyG);
    var x = -20, bi = 0;
    var tower = { x: 750, w: 140, top: 430 };
    var mkB = function (bx, bw, top, fill) {
      var g1 = S("g", {}, bld), h = 900 - top;
      S("rect", { x: bx, y: top + 12, width: bw, height: h, rx: 8, fill: ctx.c("shadow"), opacity: 0.4 }, g1);
      S("rect", { x: bx, y: top, width: bw, height: h, rx: 8, fill: ctx.c(fill), stroke: ctx.c("line"), "stroke-width": 3, "stroke-opacity": 0.5 }, g1);
      S("rect", { x: bx + bw * 0.62, y: top + 2, width: bw * 0.38 - 2, height: h - 2, fill: ctx.c("shadow"), opacity: 0.3 }, g1);
      S("rect", { x: bx + 2, y: top, width: bw - 4, height: 8, rx: 4, fill: ctx.c("ink"), opacity: 0.18 }, g1);
      if (rnd() < 0.4) { S("line", { x1: bx + bw / 2, y1: top, x2: bx + bw / 2, y2: top - 34 - rnd() * 40, stroke: ctx.c("line"), "stroke-width": 4, "stroke-linecap": "round" }, g1); }
      var cols = Math.max(2, Math.floor((bw - 24) / 34)), rowsN = Math.floor((h - 40) / 46);
      for (var cc = 0; cc < cols; cc++) for (var rr = 0; rr < rowsN; rr++) {
        var v = rnd(); if (v < 0.22) continue;
        S("rect", { x: f2(bx + 16 + cc * ((bw - 32) / cols)), y: top + 26 + rr * 46, width: 16, height: 22, rx: 3, fill: ctx.c("accent2") }, v < 0.58 ? wl : wl2);
      }
    };
    while (x < 1960) {
      var bw = 110 + Math.floor(rnd() * 90), top = 520 + Math.floor(rnd() * 200);
      if (x + bw > tower.x - 30 && x < tower.x + tower.w + 30) { x = tower.x + tower.w + 30; continue; }
      mkB(x, bw, top, bi % 2 ? "surface" : "surface2"); x += bw + 12 + Math.floor(rnd() * 14); bi++;
    }
    mkB(tower.x, tower.w, tower.top, "surface");
    S("line", { x1: tower.x + tower.w / 2, y1: tower.top, x2: tower.x + tower.w / 2, y2: tower.top - 70, stroke: ctx.c("line"), "stroke-width": 5, "stroke-linecap": "round" }, bld);
    S("circle", { cx: tower.x + tower.w / 2, cy: tower.top - 74, r: 7, fill: ctx.c("accent2") }, bld);
    S("rect", { x: 0, y: 900, width: 1920, height: 180, fill: ctx.c("field2") }, skyG);
    S("line", { x1: 0, y1: 900, x2: 1920, y2: 900, stroke: ctx.c("line"), "stroke-width": 3, opacity: 0.4 }, skyG);
    var glow = S("rect", { x: 0, y: 700, width: 1920, height: 200, fill: ctx.c("accent2"), opacity: 0 }, skyG);
    var P = { sky: opts.form === "skyline" ? 1 : 0, lights: opts.lights === "up" ? 1 : 0 };
    var M = model(ctx, P, function (P) {
      planG.setAttribute("opacity", f2(1 - P.sky)); skyG.setAttribute("opacity", f2(P.sky));
      var L = P.lights;
      plan.windows.setAttribute("opacity", f2(0.35 + 0.6 * L)); plan.windows2.setAttribute("opacity", f2(0.15 + 0.85 * L));
      lampG.setAttribute("opacity", f2(0.3 + 0.7 * L));
      wl.setAttribute("opacity", f2(0.4 + 0.55 * L)); wl2.setAttribute("opacity", f2(0.1 + 0.9 * L));
      glow.setAttribute("opacity", f2(0.07 * L));
    });
    M.render();
    return {
      g: root, plan: planG, skyline: skyG, windows: [plan.windows, plan.windows2, wl, wl2], run: M.run, Tat: M.Tat,
      anchors: {
        home: plan.home, scale: { px: 360, metres: 300, perMetre: 1.2 }, far: { x: 1780, y: 160 },
        band: { y0: 210, y1: 350 }, ground: 900, tower: { x: 820, left: tower.x, right: tower.x + tower.w, top: tower.top }, bounce: { x: tower.x + tower.w, y: 620 }
      },
      setState: function (name, t, o) {
        o = o || {};
        if (name === "plan") M.go(t, o.dur === undefined ? 0.6 : o.dur, { sky: 0 });
        else if (name === "skyline") M.go(t, o.dur === undefined ? 0.6 : o.dur, { sky: 1 });
        else if (name === "lights_low") M.go(t, o.dur === undefined ? 0.8 : o.dur, { lights: 0 });
        else if (name === "lights_up") M.go(t, o.dur === undefined ? 2.0 : o.dur, { lights: 1 }, "editorial");
      }
    };
  };
  // a simplified night map: streets in surface2, blocks in surface, a river in field2, a few lit windows. Draws into g over (x,y,w,h).
  function cityPlan(ctx, g, x, y, w, h, seed, o) {
    o = o || {};
    var rnd = Loom.rng(seed), sx = w / 1920, sy = h / 1080, k = o.fine || 1;
    var xs = [40, 220, 420, 700, 900, 1120, 1330, 1540, 1760, 1900].map(function (v) { return x + v * sx; });
    var ys = [30, 190, 360, 540, 700, 860, 1040].map(function (v) { return y + v * sy; });
    var rv = [[-40, 1000], [900, 880], [1960, 330]];
    var rp = function (u) { var a = (1 - u) * (1 - u), b = 2 * u * (1 - u), c = u * u; return [a * rv[0][0] + b * rv[1][0] + c * rv[2][0], a * rv[0][1] + b * rv[1][1] + c * rv[2][1]]; };
    var rs = []; for (var i = 0; i <= 40; i++) rs.push(rp(i / 40));
    var dRiver = function (px, py) { var m = 1e9; rs.forEach(function (p) { m = Math.min(m, Math.hypot(px - p[0], py - p[1])); }); return m; };
    var rg = S("g", {}, g), bl = S("g", {}, g), st = S("g", {}, g), win = S("g", {}, g), win2 = S("g", {}, g);
    var d = "M" + f2(x + rv[0][0] * sx) + " " + f2(y + rv[0][1] * sy) + " Q" + f2(x + rv[1][0] * sx) + " " + f2(y + rv[1][1] * sy) + " " + f2(x + rv[2][0] * sx) + " " + f2(y + rv[2][1] * sy);
    S("path", { d: d, fill: "none", stroke: ctx.c("field2"), "stroke-width": 120 * sx, "stroke-linecap": "round" }, rg);
    S("path", { d: d, fill: "none", stroke: ctx.c("muted"), "stroke-width": 120 * sx + 6, opacity: 0.0 }, rg);
    var sw2 = 26 * sx * k;
    for (var a = 0; a < xs.length - 1; a++) for (var b = 0; b < ys.length - 1; b++) {
      var bx = xs[a] + sw2 / 2, by = ys[b] + sw2 / 2, bw = xs[a + 1] - xs[a] - sw2, bh = ys[b + 1] - ys[b] - sw2;
      var cxs = (xs[a] + xs[a + 1]) / 2 - x, cys = (ys[b] + ys[b + 1]) / 2 - y;
      if (dRiver(cxs / sx, cys / sy) < 120) continue;
      var park = (a === 6 && b === 1);
      S("rect", { x: f2(bx), y: f2(by), width: f2(bw), height: f2(bh), rx: 8 * sx * k, fill: ctx.c(park ? "field2" : "surface"), opacity: park ? 1 : 0.55 + rnd() * 0.3 }, bl);
      if (park) { for (var t = 0; t < 8; t++) S("circle", { cx: f2(bx + 20 * sx + rnd() * (bw - 40 * sx)), cy: f2(by + 20 * sy + rnd() * (bh - 40 * sy)), r: 9 * sx * k, fill: ctx.c("surface"), opacity: 0.8 }, bl); continue; }
      var n = Math.round((bw * bh) / (2600 * sx * sx * k * k)); n = clamp(n, 1, 10);
      for (var q = 0; q < n; q++) { var wx = bx + 8 * sx + rnd() * (bw - 24 * sx), wy = by + 8 * sy + rnd() * (bh - 22 * sy); S("rect", { x: f2(wx), y: f2(wy), width: f2(9 * sx * k), height: f2(6 * sx * k), rx: 1.5, fill: ctx.c("accent2") }, q % 2 ? win2 : win); }
    }
    xs.forEach(function (v) { S("line", { x1: f2(v), y1: y, x2: f2(v), y2: y + h, stroke: ctx.c("surface2"), "stroke-width": f2(sw2), opacity: 0.0 }, st); });
    var bridges = S("g", {}, st);
    [xs, ys].forEach(function (arr, ai) { arr.forEach(function (v) { var c = ai ? "M" + x + " " + f2(v) + " H" + (x + w) : "M" + f2(v) + " " + y + " V" + (y + h); S("path", { d: c, fill: "none", stroke: ctx.c("surface2"), "stroke-width": f2(sw2), opacity: 0.0 }, st); S("path", { d: c, fill: "none", stroke: ctx.c("line"), "stroke-width": f2(Math.max(1.5, 2 * sx * k)), opacity: 0.28, "stroke-dasharray": f2(14 * sx * k) + " " + f2(18 * sx * k) }, st); }); });
    return { windows: win, windows2: win2, home: { x: x + 700 * sx, y: y + 540 * sy }, river: rg };
  }

  // ---------------------------------------------------------------- phone
  // forms: phone (380 x 760), mini (280 x 480), readout (500 x auto), quartz (380 x 560, clock slot).
  Loom.lesson.phone = function (ctx, parent, opts) {
    opts = opts || {};
    var form = opts.form || "phone";
    var root = S("g", {}, parent), g = S("g", {}, root);
    var P, M, api;
    if (form === "readout") {
      var rows = opts.rows || [], hasT = opts.timer !== false, TW = 500, padY = 20, tH = hasT ? 84 : 0, rowH = 46;
      var H = padY + tH + rows.length * rowH + padY;
      S("rect", { x: 0, y: 12, width: TW, height: H, rx: 26, fill: ctx.c("shadow"), opacity: 0.4 }, g);
      S("rect", { x: 0, y: 0, width: TW, height: H, rx: 26, fill: ctx.c("surface"), stroke: ctx.c("line"), "stroke-width": 4 }, g);
      var tIn = null, tAc = null;
      var tFmt = opts.fmt || function (v) { return v.toFixed(opts.decimals === undefined ? 2 : opts.decimals); };
      if (hasT) {
        S("rect", { x: 18, y: 16, width: TW - 36, height: 64, rx: 18, fill: ctx.c("field"), opacity: 0.9 }, g);
        tIn = S("text", { x: TW / 2, y: 64, "text-anchor": "middle", "font-size": 54, "font-weight": 700, fill: ctx.c("ink"), "font-family": "inherit" }, g);
        tAc = S("text", { x: TW / 2, y: 64, "text-anchor": "middle", "font-size": 54, "font-weight": 700, fill: ctx.c("accent"), opacity: 0, "font-family": "inherit" }, g);
      }
      var rowEls = rows.map(function (txt, i) {
        var yy = padY + tH + i * rowH, rg = S("g", {}, g);
        var bg = S("rect", { x: 18, y: yy, width: TW - 36, height: rowH - 6, rx: 14, fill: ctx.c("accent"), opacity: 0 }, rg);
        var dot = S("circle", { cx: 42, cy: yy + (rowH - 6) / 2, r: 8, fill: ctx.c("muted") }, rg);
        var dotA = S("circle", { cx: 42, cy: yy + (rowH - 6) / 2, r: 8, fill: ctx.c("accent"), opacity: 0 }, rg);
        var t1 = S("text", { x: 66, y: yy + 31, "font-size": 28, fill: ctx.c("ink"), "font-family": "inherit" }, rg); t1.textContent = txt;
        var t2 = S("text", { x: 66, y: yy + 31, "font-size": 28, "font-weight": 700, fill: ctx.c("accent"), opacity: 0, "font-family": "inherit" }, rg); t2.textContent = txt;
        return { g: rg, bg: bg, dotA: dotA, t1: t1, t2: t2 };
      });
      P = { T: 0, timer: 0, tn: 0 };
      rows.forEach(function (_, i) { P["r" + i] = 0; });
      M = model(ctx, P, function (P) {
        if (tIn) { var s = tFmt(P.timer) + (opts.unit ? " " + opts.unit : ""); tIn.textContent = s; tAc.textContent = s; tIn.setAttribute("opacity", f2(1 - P.tn)); tAc.setAttribute("opacity", f2(P.tn)); }
        rowEls.forEach(function (r, i) { var v = P["r" + i]; r.bg.setAttribute("opacity", f2(0.2 * v)); r.dotA.setAttribute("opacity", f2(v)); r.t2.setAttribute("opacity", f2(v)); r.t1.setAttribute("opacity", f2(1 - v)); });
      });
      M.render();
      api = {
        g: root, size: { w: TW, h: H }, rows: rowEls, run: M.run, Tat: M.Tat,
        anchors: { rowAt: function (i) { return { x: 18, y: padY + tH + i * rowH, w: TW - 36, h: rowH - 6 }; }, timer: { x: TW / 2, y: 48 }, left: { x: 0, y: H / 2 }, top: { x: TW / 2, y: 0 } },
        count: function (t, dur, to) { M.go(t, dur === undefined ? M.D("count", 1.2) : dur, { timer: to === undefined ? (opts.timerTo || 0) : to }, "linear"); },
        lightRow: function (i, t, on) { var o = {}; o["r" + i] = on === false ? 0 : 1; M.go(t, 0.25, o); },
        setState: function (name, t, o) {
          o = o || {};
          if (name === "readout_timer") { M.go(t, o.dur === undefined ? M.D("count", 1.2) : o.dur, { timer: o.to === undefined ? (opts.timerTo || 0) : o.to }, "linear"); if (o.stop !== false) M.go(t + (o.dur === undefined ? M.D("count", 1.2) : o.dur), 0.3, { tn: 1 }); }
          else if (name === "readout_rows") { var oo = {}; (o.rows || [o.row === undefined ? 0 : o.row]).forEach(function (i) { oo["r" + i] = 1; }); M.go(t, o.dur === undefined ? 0.25 : o.dur, oo); }
        }
      };
      return api;
    }
    var W = form === "mini" ? 280 : 380, H2 = form === "quartz" ? 560 : (form === "mini" ? 480 : 760), R = form === "mini" ? 34 : 46, bz = form === "mini" ? 12 : 18;
    var sc = { x: bz, y: bz, w: W - 2 * bz, h: H2 - 2 * bz }, sr = R - bz + 4;
    S("rect", { x: 0, y: 12, width: W, height: H2, rx: R, fill: ctx.c("shadow"), opacity: 0.4 }, g);
    S("rect", { x: 0, y: 0, width: W, height: H2, rx: R, fill: ctx.c("surface") }, g);
    var pid = "kp" + (++UID), pdefs = S("defs", {}, g), pcp = S("clipPath", { id: pid }, pdefs); S("rect", { x: 0, y: 0, width: W, height: H2, rx: R }, pcp);
    var pc = S("g", { "clip-path": "url(#" + pid + ")" }, g);
    S("path", { d: "M" + W + " 0 V" + H2 + " H" + (W * 0.4) + " Q" + (W * 0.9) + " " + (H2 * 0.5) + " " + (W * 0.55) + " 0 Z", fill: ctx.c("shadow"), opacity: 0.3 }, pc);
    S("rect", { x: 0, y: 0, width: W, height: 12, fill: ctx.c("ink"), opacity: 0.16 }, pc);
    S("rect", { x: 0, y: 0, width: W, height: H2, rx: R, fill: "none", stroke: ctx.c("line"), "stroke-width": 4 }, g);
    // screen
    var scr = S("g", {}, g), sid = "ks" + (++UID), sdefs = S("defs", {}, scr), scp = S("clipPath", { id: sid }, sdefs); S("rect", { x: sc.x, y: sc.y, width: sc.w, height: sc.h, rx: sr }, scp);
    S("rect", { x: sc.x, y: sc.y, width: sc.w, height: sc.h, rx: sr, fill: ctx.c("field") }, scr);
    var sg = S("g", { "clip-path": "url(#" + sid + ")" }, scr);
    var mapG = S("g", { opacity: 0 }, sg), plan = cityPlan(ctx, mapG, sc.x, sc.y, sc.w, sc.h, "phonemap" + form, { fine: form === "mini" ? 1.6 : 1.5 });
    var home = { x: sc.x + sc.w / 2, y: sc.y + sc.h / 2 };
    if (form !== "quartz") S("rect", { x: W / 2 - 40, y: sc.y + 12, width: 80, height: 14, rx: 7, fill: ctx.c("shadow"), opacity: 0.9 }, scr);
    var slot = S("g", {}, scr);
    if (form === "quartz") { S("circle", { cx: W / 2, cy: 230, r: 156, fill: ctx.c("field2"), stroke: ctx.c("line"), "stroke-width": 3, opacity: 0.9 }, slot); S("rect", { x: W / 2 - 50, y: H2 - 70, width: 100, height: 10, rx: 5, fill: ctx.c("line"), opacity: 0.5 }, slot); mapG.setAttribute("opacity", 0); }
    // dot with halo, drift (dx, dy), neg crossfade, pulse ring
    var dotG = S("g", {}, sg), haloC = S("circle", { cx: 0, cy: 0, r: 1, fill: ctx.c("accent4"), opacity: 0 }, dotG);
    var ringC = S("circle", { cx: 0, cy: 0, r: 20, fill: "none", stroke: ctx.c("accent4"), "stroke-width": 4, opacity: 0 }, dotG);
    var soft = S("circle", { cx: 0, cy: 0, r: 30 * (W / 380 + 0.3), fill: ctx.c("accent4"), opacity: 0.25 }, dotG);
    var dN = S("circle", { cx: 0, cy: 0, r: 15, fill: ctx.c("neg"), stroke: ctx.c("ink"), "stroke-width": 3, opacity: 0 }, dotG);
    var dT = S("circle", { cx: 0, cy: 0, r: 15, fill: ctx.c("accent4"), stroke: ctx.c("ink"), "stroke-width": 3 }, dotG);
    var trail = S("line", { x1: 0, y1: 0, x2: 0, y2: 0, stroke: ctx.c("neg"), "stroke-width": 3, "stroke-dasharray": "8 8", opacity: 0 }, sg);
    var drift = opts.drift || [W * 0.28, -H2 * 0.2];
    P = { T: 0, map: 0, dot: 0, dx: 0, dy: 0, neg: 0, halo: 0, pulse: 0 };
    M = model(ctx, P, function (P) {
      mapG.setAttribute("opacity", f2(form === "quartz" ? 0 : P.map));
      var x0 = home.x + P.dx, y0 = home.y + P.dy;
      dotG.setAttribute("transform", "translate(" + f2(x0) + " " + f2(y0) + ") scale(" + f2(Math.max(0.001, P.dot)) + ")");
      dotG.setAttribute("opacity", f2(clamp(P.dot * 3, 0, 1)));
      dN.setAttribute("opacity", f2(P.neg)); dT.setAttribute("opacity", f2(1 - P.neg));
      soft.setAttribute("fill", ctx.c(P.neg > 0.5 ? "neg" : "accent4"));
      haloC.setAttribute("r", f2(Math.max(1, P.halo))); haloC.setAttribute("opacity", f2(P.halo > 1 ? 0.28 : 0));
      var pl = P.pulse; ringC.setAttribute("r", f2(16 + 70 * pl)); ringC.setAttribute("opacity", f2(pl > 0 && pl < 1 ? 0.9 * (1 - pl) : 0));
      var L = Math.hypot(P.dx, P.dy); trail.setAttribute("x1", home.x); trail.setAttribute("y1", home.y); trail.setAttribute("x2", f2(x0)); trail.setAttribute("y2", f2(y0)); trail.setAttribute("opacity", f2(L > 4 ? 0.8 * P.dot : 0));
    });
    M.render();
    if (opts.w) root.setAttribute("transform", "scale(" + f2(opts.w / W) + ")");
    return {
      g: root, screen: sg, dot: dotG, halo: haloC, slot: slot, size: { w: W, h: H2 }, run: M.run, Tat: M.Tat,
      anchors: { dotHome: home, clockSlot: { x: W / 2, y: 230, r: 140 }, screen: sc, notch: { x: W / 2, y: sc.y + 19 }, dotAt: function (t) { return { x: home.x, y: home.y }; } },
      pulse: function (t, dur) { M.go(t, 0.01, { pulse: 0 }, "linear"); M.go(t + 0.01, dur || 0.9, { pulse: 0.999 }, "linear"); },
      setState: function (name, t, o) {
        o = o || {};
        if (name === "dark") M.go(t, o.dur, { map: 0, dot: 0, halo: 0, dx: 0, dy: 0, neg: 0 });
        else if (name === "map" || name === "mini") M.go(t, o.dur === undefined ? 0.5 : o.dur, { map: 1 });
        else if (name === "dot") { M.go(t, o.dur === undefined ? 0.6 : o.dur, { map: 1, dot: 1, dx: 0, dy: 0, neg: 0 }, "overshoot"); }
        else if (name === "dot_drift") M.go(t, o.dur === undefined ? 3 : o.dur, { map: 1, dot: 1, dx: o.dx === undefined ? drift[0] : o.dx, dy: o.dy === undefined ? drift[1] : o.dy, neg: 1 }, "linear");
        else if (name === "halo") M.go(t, o.dur === undefined ? 0.8 : o.dur, { halo: o.size === undefined ? 90 : o.size });
      }
    };
  };
  // ---------------------------------------------------------------- earth
  // forms: disc (800 x 800, centre 400,400, r 400), arc (1920 x 1080, crest (960,812)), well (800 x 800 side view)
  Loom.lesson.earth = function (ctx, parent, opts) {
    opts = opts || {};
    var form = opts.form || "disc";
    var root = S("g", {}, parent), g = S("g", {}, root);
    var rnd = Loom.rng("earth" + form);
    var pt = S("g", {}, g), anchors = {};
    var land = function (parent2, cx, cy, rad, clipR, n) {
      for (var i = 0; i < n; i++) {
        var a0 = rnd() * 6.283, dd = rnd() * rad * 0.8, bx = cx + Math.cos(a0) * dd, by = cy + Math.sin(a0) * dd, br = rad * (0.16 + rnd() * 0.2);
        var pts = [], k = 9;
        for (var j = 0; j < k; j++) { var aa = j / k * 6.283, rr = br * (0.65 + rnd() * 0.6); pts.push((f2(bx + Math.cos(aa) * rr * 1.5)) + " " + f2(by + Math.sin(aa) * rr)); }
        S("polygon", { points: pts.join(" "), fill: ctx.c("surface"), "stroke-linejoin": "round", stroke: ctx.c("surface"), "stroke-width": 14, opacity: 0.95 }, parent2);
      }
    };
    var lights = function (parent2, cx, cy, rad, n) {
      for (var i = 0; i < n; i++) { var a0 = rnd() * 6.283, dd = Math.sqrt(rnd()) * rad * 0.8; S("circle", { cx: f2(cx + Math.cos(a0) * dd), cy: f2(cy + Math.sin(a0) * dd), r: 4 + rnd() * 4, fill: ctx.c("accent2"), opacity: 0.55 + rnd() * 0.4 }, parent2); }
    };
    var P = { pt: opts.pointOn === false ? 0 : 0, pulse: 0, well: 0, mk: 0, glow: 1 };
    var dotG, haloC, ringC, mark, wellLines = [], wellLen = [], wellMk, wellTop;
    if (form === "disc") {
      var R = 400;
      crescentDisc(g, ctx, 400, 400, R, "surface2");
      var id = "ke" + (++UID), defs = S("defs", {}, g), cp = S("clipPath", { id: id }, defs); S("circle", { cx: 400, cy: 400, r: R - 6 }, cp);
      var lg = S("g", { "clip-path": "url(#" + id + ")" }, g);
      land(lg, 400, 400, R * 0.9, R, 7);
      lights(lg, 400, 400, R, 22);
      // re-apply the night shade over land and lights
      var p = function (x, y) { return "M" + f2(x - R) + " " + f2(y) + "a" + R + " " + R + " 0 1 0 " + f2(2 * R) + " 0a" + R + " " + R + " 0 1 0 " + f2(-2 * R) + " 0z"; };
      S("path", { d: p(400, 400) + p(400 - 70, 400 - 70), "fill-rule": "evenodd", fill: ctx.c("shadow"), opacity: 0.4 }, lg);
      S("path", { d: p(400, 400) + p(400 + 52, 400 + 52), "fill-rule": "evenodd", fill: ctx.c("ink"), opacity: 0.22 }, lg);
      anchors.point = { x: opts.point ? opts.point[0] : 470, y: opts.point ? opts.point[1] : 300 };
    } else if (form === "arc") {
      var RA = 2000, cy0 = 812 + RA, drop = RA - Math.sqrt(RA * RA - 960 * 960);
      var yE = 812 + drop;
      var d = "M0 1080 L0 " + f2(yE) + " A " + RA + " " + RA + " 0 0 1 1920 " + f2(yE) + " L1920 1080 Z";
      S("path", { d: d, fill: ctx.c("shadow"), opacity: 0.4, transform: "translate(0 12)" }, g);
      S("path", { d: d, fill: ctx.c("surface2") }, g);
      var id2 = "ka" + (++UID), defs2 = S("defs", {}, g), cp2 = S("clipPath", { id: id2 }, defs2); S("path", { d: d }, cp2);
      var ag = S("g", { "clip-path": "url(#" + id2 + ")" }, g);
      for (var i = 0; i < 6; i++) { var lx = 120 + i * 320 + rnd() * 60, ly = 812 + (RA - Math.sqrt(RA * RA - (lx - 960) * (lx - 960))) + 50 + rnd() * 120; S("ellipse", { cx: f2(lx), cy: f2(ly), rx: 110 + rnd() * 90, ry: 26 + rnd() * 20, fill: ctx.c("surface"), opacity: 0.9 }, ag); }
      for (var q = 0; q < 26; q++) { var qx = 30 + rnd() * 1860, qy = 812 + (RA - Math.sqrt(RA * RA - (qx - 960) * (qx - 960))) + 36 + rnd() * 160; S("circle", { cx: f2(qx), cy: f2(qy), r: 3 + rnd() * 3, fill: ctx.c("accent2"), opacity: 0.45 + rnd() * 0.45 }, ag); }
      var arcTop = "M0 " + f2(yE) + " A " + RA + " " + RA + " 0 0 1 1920 " + f2(yE);
      S("path", { d: arcTop, fill: "none", stroke: ctx.c("muted"), "stroke-width": 4, opacity: 0.55 }, g);
      S("path", { d: "M0 " + f2(yE - 22) + " A " + (RA + 22) + " " + (RA + 22) + " 0 0 1 1920 " + f2(yE - 22), fill: "none", stroke: ctx.c("line"), "stroke-width": 3, opacity: 0.18 }, g);
      S("path", { d: d, fill: ctx.c("shadow"), opacity: 0.0 }, g);
      anchors.point = { x: 960, y: 812 };
      anchors.surfaceY = function (x) { return 812 + (RA - Math.sqrt(RA * RA - (x - 960) * (x - 960))); };
    } else {
      // well: side view, grid dipping deep near the surface (bottom), shallowing with height
      var N = 8, cx = 400, W = 800;
      var depthAt = function (i) { return 260 * Math.pow(0.62, i); };
      for (var li = 0; li < N; li++) {
        var yb = 640 - li * 70, dep = depthAt(li), sig = 150 + li * 38, dpts = [];
        for (var x = 0; x <= W; x += 20) dpts.push((x ? "L" : "M") + x + " " + f2(yb + dep * Math.exp(-((x - cx) * (x - cx)) / (2 * sig * sig))));
        var pth = S("path", { d: dpts.join(" "), fill: "none", stroke: ctx.c(li === 0 ? "muted" : "line"), "stroke-width": 4, "stroke-linecap": "round", opacity: 0.35 + 0.5 * (1 - li / N) }, g);
        wellLines.push(pth);
      }
      for (var vi = -3; vi <= 3; vi++) {
        var vd = [];
        for (var l2 = 0; l2 < N; l2++) { var yb2 = 640 - l2 * 70, dep2 = depthAt(l2), sig2 = 150 + l2 * 38, xx = cx + vi * 110, x2 = cx + (xx - cx) * (1 - 0.55 * Math.exp(-((xx - cx) * (xx - cx)) / (2 * sig2 * sig2)) * (l2 < 4 ? 1 : 0.5)); vd.push((l2 ? "L" : "M") + f2(x2) + " " + f2(yb2 + dep2 * Math.exp(-((x2 - cx) * (x2 - cx)) / (2 * sig2 * sig2)))); }
        wellLines.push(S("path", { d: vd.join(" "), fill: "none", stroke: ctx.c("line"), "stroke-width": 3, opacity: 0.3 }, g));
      }
      wellMk = S("g", {}, g);
      S("line", { x1: cx, y1: 640 + depthAt(0), x2: cx, y2: 640 - (N - 1) * 70, stroke: ctx.c("accent2"), "stroke-width": 3, "stroke-dasharray": "4 10", opacity: 0.6 }, wellMk);
      var mk2 = S("g", {}, wellMk); S("circle", { cx: 0, cy: 0, r: 24, fill: ctx.c("accent2"), opacity: 0.3 }, mk2); S("circle", { cx: 0, cy: 0, r: 12, fill: ctx.c("accent2"), stroke: ctx.c("ink"), "stroke-width": 3 }, mk2);
      wellLen = wellLines.map(function (e) { return e.getTotalLength ? e.getTotalLength() : 900; });
      anchors.marker = function (v) { return { x: cx, y: lerp(640 + depthAt(0), 640 - (N - 1) * 70, v) }; };
      anchors.top = { x: cx, y: 640 - (N - 1) * 70 };
      anchors.surface = { x: cx, y: 640 + depthAt(0) };
    }
    // the phone's place: a glowing teal point (accent4 only here) with a soft halo and a pulse ring
    var ap = anchors.point;
    if (ap && form !== "well") {
      var pr = form === "arc" ? 1.15 : (opts.pointSize || 1);
      var pg = S("g", { transform: "translate(" + ap.x + " " + ap.y + ") scale(" + pr + ")" }, pt);
      haloC = S("circle", { cx: 0, cy: 0, r: 34, fill: ctx.c("accent4"), opacity: 0.25 }, pg);
      ringC = S("circle", { cx: 0, cy: 0, r: 20, fill: "none", stroke: ctx.c("accent4"), "stroke-width": 4, opacity: 0 }, pg);
      dotG = S("circle", { cx: 0, cy: 0, r: 13, fill: ctx.c("accent4"), stroke: ctx.c("ink"), "stroke-width": 3 }, pg);
    }
    var M = model(ctx, P, function (P) {
      if (dotG) {
        pt.setAttribute("opacity", f2(P.pt));
        haloC.setAttribute("r", f2(34 * (0.8 + 0.4 * P.glow)));
        haloC.setAttribute("opacity", f2(0.25 * P.glow));
        var pl = P.pulse; ringC.setAttribute("r", f2(18 + 60 * pl)); ringC.setAttribute("opacity", f2(pl > 0 && pl < 1 ? 0.9 * (1 - pl) : 0));
      }
      if (form === "well") {
        wellLines.forEach(function (e, i) { var L = wellLen[i] || 900; e.setAttribute("stroke-dasharray", L); e.setAttribute("stroke-dashoffset", f2(L * (1 - clamp(P.well * 1.4 - i * 0.04, 0, 1)))); });
        var a = anchors.marker(P.mk); wellMk.setAttribute("opacity", f2(clamp(P.well * 2 - 1, 0, 1)));
        wellMk.lastChild.setAttribute("transform", "translate(" + f2(a.x) + " " + f2(a.y) + ")");
      }
    });
    P.pt = form === "well" ? 0 : (opts.point === false ? 0 : (opts.showPoint ? 1 : 0));
    M.render();
    if (opts.w && form !== "arc") root.setAttribute("transform", "scale(" + f2(opts.w / 800) + ")");
    return {
      g: root, point: pt, anchors: anchors, run: M.run, Tat: M.Tat,
      pulse: function (t, dur) { M.go(t, 0.01, { pulse: 0 }, "linear"); M.go(t + 0.01, dur || 0.9, { pulse: 0.999 }, "linear"); },
      marker: function (t, v, dur) { M.go(t, dur === undefined ? 1.4 : dur, { mk: v }); },
      setState: function (name, t, o) {
        o = o || {};
        if (name === "disc") M.go(t, o.dur, { pt: 0 });
        else if (name === "disc_point" || name === "arc") M.go(t, o.dur === undefined ? 0.5 : o.dur, { pt: 1 });
        else if (name === "well") M.go(t, o.dur === undefined ? 1.6 : o.dur, { well: 1 }, "linear");
      }
    };
  };
  // ---------------------------------------------------------------- gps_satellite
  // natural 360 x 220: body (130..230, 62..158), panels left/right, dish below (facing Earth), clock slot on the body.
  // on_rocket: panels fold, a two-stage rocket grows below (to y ~ 600), flame fl 0..1.
  Loom.lesson.gps_satellite = function (ctx, parent, opts) {
    opts = opts || {};
    var root = S("g", {}, parent), g = S("g", {}, root);
    var fadeG = S("g", {}, g);
    var rocket = S("g", { opacity: 0 }, fadeG);
    // rocket (behind the body): two stages, fins, nozzle, flame
    S("rect", { x: 150, y: 330, width: 60, height: 150, rx: 10, fill: ctx.c("surface"), stroke: ctx.c("line"), "stroke-width": 4 }, rocket);
    S("rect", { x: 136, y: 220, width: 88, height: 130, rx: 14, fill: ctx.c("ink"), stroke: ctx.c("line"), "stroke-width": 4 }, rocket);
    S("rect", { x: 136, y: 296, width: 88, height: 14, fill: ctx.c("accent"), opacity: 0.0 }, rocket);
    S("polygon", { points: "136,420 96,500 150,470", fill: ctx.c("surface2"), stroke: ctx.c("line"), "stroke-width": 4, "stroke-linejoin": "round" }, rocket);
    S("polygon", { points: "224,420 264,500 210,470", fill: ctx.c("surface2"), stroke: ctx.c("line"), "stroke-width": 4, "stroke-linejoin": "round" }, rocket);
    S("polygon", { points: "162,480 198,480 190,500 170,500", fill: ctx.c("surface2"), stroke: ctx.c("line"), "stroke-width": 4 }, rocket);
    var flame = S("g", { opacity: 0 }, rocket);
    var fo = S("polygon", { points: "164,500 196,500 180,590", fill: ctx.c("accent") }, flame);
    var fi = S("polygon", { points: "172,500 188,500 180,550", fill: ctx.c("accent2") }, flame);
    // panels: strut + three cell columns, accent2 cell lines
    var mkPanel = function (side) {
      var pg = S("g", {}, fadeG), x0 = side < 0 ? 12 : 248, ax = side < 0 ? 130 : 230;
      S("line", { x1: ax, y1: 110, x2: side < 0 ? 124 : 236, y2: 110, stroke: ctx.c("line"), "stroke-width": 6 }, pg);
      var inner = S("g", {}, pg);
      S("rect", { x: x0, y: 112 - 40, width: 100, height: 80, rx: 8, fill: ctx.c("shadow"), opacity: 0.4, transform: "translate(0 12)" }, inner);
      S("rect", { x: x0, y: 72, width: 100, height: 80, rx: 8, fill: ctx.c("field2"), stroke: ctx.c("line"), "stroke-width": 4 }, inner);
      for (var i = 1; i < 4; i++) S("line", { x1: x0 + i * 25, y1: 74, x2: x0 + i * 25, y2: 150, stroke: ctx.c("accent2"), "stroke-width": 2.5, opacity: 0.75 }, inner);
      S("line", { x1: x0 + 2, y1: 112, x2: x0 + 98, y2: 112, stroke: ctx.c("accent2"), "stroke-width": 2.5, opacity: 0.75 }, inner);
      S("rect", { x: x0, y: 72, width: 100, height: 80, rx: 8, fill: ctx.c("surface"), opacity: 0.0 }, inner);
      S("path", { d: "M" + (x0 + 8) + " 76 H" + (x0 + 92), stroke: ctx.c("ink"), "stroke-width": 3, opacity: 0.25, "stroke-linecap": "round" }, inner);
      return { g: pg, inner: inner, ax: ax, side: side };
    };
    var pl = mkPanel(-1), pr = mkPanel(1);
    // dish and stem below the body
    var dish = S("g", {}, fadeG);
    S("line", { x1: 180, y1: 158, x2: 180, y2: 186, stroke: ctx.c("line"), "stroke-width": 6 }, dish);
    S("path", { d: "M146 190 Q180 222 214 190 Z", fill: ctx.c("surface"), stroke: ctx.c("line"), "stroke-width": 4, "stroke-linejoin": "round" }, dish);
    S("circle", { cx: 180, cy: 186, r: 6, fill: ctx.c("accent2") }, dish);
    // body with offset shadow, crescent shade, named edge
    var bodyG = S("g", {}, fadeG);
    S("rect", { x: 130, y: 62 + 12, width: 100, height: 96, rx: 18, fill: ctx.c("shadow"), opacity: 0.4 }, bodyG);
    S("rect", { x: 130, y: 62, width: 100, height: 96, rx: 18, fill: ctx.c("surface") }, bodyG);
    var bid = "kb" + (++UID), bdefs = S("defs", {}, bodyG), bcp = S("clipPath", { id: bid }, bdefs); S("rect", { x: 130, y: 62, width: 100, height: 96, rx: 18 }, bcp);
    var bc = S("g", { "clip-path": "url(#" + bid + ")" }, bodyG);
    S("path", { d: "M130 62 H230 V158 H190 Q200 100 130 62 Z", fill: ctx.c("shadow"), opacity: 0.34 }, bc);
    S("rect", { x: 130, y: 62, width: 100, height: 10, fill: ctx.c("ink"), opacity: 0.2 }, bc);
    var edge = S("rect", { x: 130, y: 62, width: 100, height: 96, rx: 18, fill: "none", stroke: ctx.c("line"), "stroke-width": 4 }, bodyG);
    var slotG = S("g", {}, bodyG);
    S("circle", { cx: 180, cy: 106, r: 30, fill: ctx.c("field2"), stroke: ctx.c("line"), "stroke-width": 3 }, slotG);
    var ringsG = S("g", {}, g), rings = [];
    for (var i = 0; i < 3; i++) rings.push(S("circle", { cx: 180, cy: 190, r: 10, fill: "none", stroke: ctx.c("accent2"), "stroke-width": 5, opacity: 0 }, ringsG));
    var P = { T: 0, op: 1, named: 0, fold: 0, rk: 0, fl: 0, bc: 0 };
    var per = opts.period || 1.5;
    var M = model(ctx, P, function (P) {
      fadeG.setAttribute("opacity", f2(P.op));
      edge.setAttribute("stroke", ctx.c(P.named > 0.5 ? "accent" : "line"));
      edge.setAttribute("stroke-width", f2(4 + P.named * 3));
      [pl, pr].forEach(function (p) { p.inner.setAttribute("transform", "translate(" + p.ax + " 0) scale(" + f2(1 - 0.72 * P.fold) + " 1) translate(" + (-p.ax) + " 0)"); });
      rocket.setAttribute("opacity", f2(clamp(P.rk * 1.6, 0, 1)));
      var lift = 0; fadeG.setAttribute("transform", "translate(0 " + f2(P.rk * 130) + ") " );
      flame.setAttribute("opacity", f2(P.fl)); var fk = 1 + 0.25 * Math.sin(P.T * 31) + 0.1 * Math.sin(P.T * 53);
      fo.setAttribute("transform", "translate(180 500) scale(1 " + f2(fk * (0.6 + 0.4 * P.fl)) + ") translate(-180 -500)");
      fi.setAttribute("transform", "translate(180 500) scale(1 " + f2(fk * 1.1) + ") translate(-180 -500)");
      rings.forEach(function (c, i) {
        var ph = P.bc ? ((P.T / per + i / 3) % 1) : 0;
        c.setAttribute("r", f2(10 + ph * 150)); c.setAttribute("opacity", f2(P.bc ? 0.85 * (1 - ph) * P.bc : 0));
        c.setAttribute("stroke-width", f2(6 - ph * 4));
      });
    });
    M.render();
    if (opts.w) root.setAttribute("transform", "scale(" + f2(opts.w / 360) + ")");
    return {
      g: root, body: bodyG, panels: [pl.g, pr.g], dish: dish, rocket: rocket, flame: flame, rings: ringsG, run: M.run, Tat: M.Tat,
      anchors: { center: { x: 180, y: 110 }, antenna: { x: 180, y: 190 }, clock: { x: 180, y: 106, r: 30 }, base: { x: 180, y: 480 } },
      setState: function (name, t, o) {
        o = o || {};
        if (name === "idle") M.go(t, o.dur, { op: 1, named: 0, bc: 0, fold: 0, rk: 0, fl: 0 });
        else if (name === "named") M.go(t, o.dur === undefined ? 0.3 : o.dur, { op: 1, named: 1 });
        else if (name === "dim") M.go(t, o.dur, { op: 0.35, named: 0, bc: 0 });
        else if (name === "broadcasting") M.go(t, o.dur === undefined ? 0.3 : o.dur, { op: 1, bc: 1 });
        else if (name === "on_rocket") M.go(t, o.dur === undefined ? 0.8 : o.dur, { fold: 1, rk: 1, bc: 0, named: 0 });
      },
      fire: function (t0, t1) { M.go(t0, 0.3, { fl: 1 }); M.go(t1, 0.4, { fl: 0 }); M.run(t0, t1, 1); },
      release: function (t, dur) { M.go(t, dur === undefined ? 0.8 : dur, { rk: 0, fold: 0, fl: 0 }); }
    };
  };
  // ---------------------------------------------------------------- orbit_rings
  // 1600 x 1000, Earth centre (800,500) radius 220. Six tilted rings (ring 0 = the one ring), 4 satellites each.
  // opts.layer: "all" | "back" | "front" (build a back and a front instance to sandwich the Earth disc).
  Loom.lesson.orbit_rings = function (ctx, parent, opts) {
    opts = opts || {};
    var layer = opts.layer || "all", CX = 800, CY = 500, ER = 220, sat = opts.satSize || 40, om = opts.omega || 0.28;
    var CFG = [{ rx: 520, ry: 150, rot: -18 }, { rx: 620, ry: 200, rot: 26 }, { rx: 700, ry: 240, rot: -42 }, { rx: 590, ry: 170, rot: 64 }, { rx: 760, ry: 270, rot: 8 }, { rx: 670, ry: 215, rot: -66 }];
    var root = S("g", {}, parent), backG = S("g", {}, root), frontG = S("g", {}, root), satG = S("g", {}, root), decG = S("g", {}, root);
    var pos = function (i, ph) { var c = CFG[i], a = tp(c.rot), x = c.rx * Math.cos(ph), y = c.ry * Math.sin(ph); return { x: CX + x * Math.cos(a) - y * Math.sin(a), y: CY + x * Math.sin(a) + y * Math.cos(a), front: Math.sin(ph) > 0 }; };
    var poly = function (i, p0, p1, n) { var s = ""; for (var k = 0; k <= n; k++) { var p = pos(i, lerp(p0, p1, k / n)); s += (k ? "L" : "M") + f2(p.x) + " " + f2(p.y); } return s; };
    var ringsB = [], ringsF = [], sats = [], bcs = [];
    CFG.forEach(function (c, i) {
      if (layer !== "front") ringsB.push(S("path", { d: poly(i, Math.PI, 2 * Math.PI, 40), fill: "none", stroke: ctx.c("line"), "stroke-width": 3, opacity: 0.3, "stroke-linecap": "round" }, backG));
      if (layer !== "back") ringsF.push(S("path", { d: poly(i, 0, Math.PI, 40), fill: "none", stroke: ctx.c("line"), "stroke-width": 3, opacity: 0.5, "stroke-linecap": "round" }, frontG));
    });
    // the trace: ring 0 full path from phase 0, drawn bright in accent
    var trD = poly(0, 0, 2 * Math.PI, 90), trace = S("path", { d: trD, fill: "none", stroke: ctx.c("accent"), "stroke-width": 7, "stroke-linecap": "round", opacity: 0 }, decG);
    var trL = trace.getTotalLength ? trace.getTotalLength() : 3000;
    var mkSat = function (g) { var s = S("g", {}, g), k = sat / 100;
      var q = S("g", { transform: "scale(" + f2(k) + ")" }, s);
      S("rect", { x: -56, y: -12, width: 36, height: 24, rx: 4, fill: ctx.c("field2"), stroke: ctx.c("accent2"), "stroke-width": 4 }, q);
      S("rect", { x: 20, y: -12, width: 36, height: 24, rx: 4, fill: ctx.c("field2"), stroke: ctx.c("accent2"), "stroke-width": 4 }, q);
      S("rect", { x: -20, y: -20, width: 40, height: 40, rx: 8, fill: ctx.c("surface"), stroke: ctx.c("line"), "stroke-width": 5 }, q);
      var h = S("circle", { cx: 0, cy: 0, r: 34, fill: ctx.c("accent"), opacity: 0 }, q);
      return { g: s, hl: h };
    };
    var ph0 = [0.4, 1.1, 2.0, 0.2, 1.6, 2.7];
    for (var i = 0; i < CFG.length; i++) for (var j = 0; j < 4; j++) {
      var sg = mkSat(satG), ring = []; for (var r2 = 0; r2 < 2; r2++) ring.push(S("circle", { cx: 0, cy: 0, r: 10, fill: "none", stroke: ctx.c("accent2"), "stroke-width": 4, opacity: 0 }, satG));
      sats.push({ i: i, j: j, el: sg, rings: ring, p0: ph0[i] + j * Math.PI / 2 + (i % 2) * 0.35 });
    }
    var hero = sats[4 * 4], heroRing = 4;
    var radius = S("line", { x1: 0, y1: 0, x2: 0, y2: 0, stroke: ctx.c("accent"), "stroke-width": 6, "stroke-linecap": "round", opacity: 0 }, decG);
    var arcP = S("path", { d: "M0 0", fill: "none", stroke: ctx.c("accent"), "stroke-width": 9, "stroke-linecap": "round", opacity: 0 }, decG);
    var P = { T: 0, r0: 1, fill: opts.filled ? 1 : 0, tr: 0, rad: 0, per: 0, bc: 0, sats: 1 };
    var satPh = function (s, T) { return s.p0 + T * om * (s.i % 2 ? -1 : 1); };
    var heroSurf = function (T) { var p = pos(heroRing, satPh(hero, T)), a = Math.atan2(p.y - CY, p.x - CX); return { x: CX + Math.cos(a) * ER, y: CY + Math.sin(a) * ER, sat: p }; };
    var perSpan = opts.arcSpan || 1.5;
    var M = model(ctx, P, function (P) {
      var T = P.T;
      CFG.forEach(function (c, i) {
        var v = i === 0 ? P.r0 : clamp(P.fill * 5.4 - (i - 1) * 0.85, 0, 1);
        if (ringsB[i]) ringsB[i].setAttribute("opacity", f2(0.3 * v * (1 - 0.55 * P.tr * (i === 0 ? 1 : 0)))); if (ringsF[i]) ringsF[i].setAttribute("opacity", f2(0.5 * v * (1 - 0.55 * P.tr * (i === 0 ? 1 : 0))));
      });
      trace.setAttribute("stroke-dasharray", trL); trace.setAttribute("stroke-dashoffset", f2(trL * (1 - P.tr))); trace.setAttribute("opacity", P.tr > 0 ? 1 : 0);
      sats.forEach(function (s) {
        var v = s.i === 0 ? P.r0 : clamp(P.fill * 5.4 - (s.i - 1) * 0.85, 0, 1); if (s.i === 0 && s.j > 0 && opts.oneSat !== false && P.fill < 0.01) v = 0;
        var ph = satPh(s, T), p = pos(s.i, ph), show = layer === "all" || (layer === "front") === p.front;
        s.el.g.setAttribute("transform", "translate(" + f2(p.x) + " " + f2(p.y) + ")"); s.el.g.setAttribute("opacity", f2(show ? v * P.sats : 0));
        s.el.hl.setAttribute("opacity", f2(s.i === 0 && s.j === 0 ? 0.4 * P.tr * (1 - 0) : 0));
        s.rings.forEach(function (c, k) { var pp = P.bc ? ((T * 0.9 + k / 2 + s.j * 0.13 + s.i * 0.21) % 1) : 0; c.setAttribute("cx", f2(p.x)); c.setAttribute("cy", f2(p.y)); c.setAttribute("r", f2(8 + pp * 54)); c.setAttribute("opacity", f2(show && P.bc ? 0.8 * (1 - pp) * P.bc * v : 0)); });
      });
      var hs = heroSurf(T), hv = clamp(P.fill * 5.4 - (heroRing - 1) * 0.85, 0, 1);
      var L = Math.hypot(hs.sat.x - hs.x, hs.sat.y - hs.y);
      radius.setAttribute("x1", f2(hs.x)); radius.setAttribute("y1", f2(hs.y)); radius.setAttribute("x2", f2(lerp(hs.x, hs.sat.x, P.rad))); radius.setAttribute("y2", f2(lerp(hs.y, hs.sat.y, P.rad))); radius.setAttribute("opacity", P.rad > 0.01 ? 1 : 0);
      var ph = satPh(hero, T), S0 = P.per * perSpan, dir = hero.i % 2 ? 1 : -1;
      arcP.setAttribute("d", S0 > 0.02 ? poly(heroRing, ph + dir * S0, ph, 30) : "M0 0"); arcP.setAttribute("opacity", S0 > 0.02 ? 1 : 0);
    });
    M.render();
    if (opts.w) root.setAttribute("transform", "scale(" + f2(opts.w / 1600) + ")");
    var api = {
      g: root, back: backG, front: frontG, sats: satG, trace: trace, radiusLine: radius, periodArc: arcP, run: M.run, Tat: M.Tat,
      center: { x: CX, y: CY, r: ER },
      satPos: function (ring, idx, t) { var s = sats[ring * 4 + idx]; return pos(ring, satPh(s, M.Tat(t))); },
      anchor: function (name, t) {
        var T = M.Tat(t === undefined ? 0 : t), hs = heroSurf(T);
        if (name === "radius") return { x: (hs.x + hs.sat.x) / 2, y: (hs.y + hs.sat.y) / 2, ax: hs.sat.x, ay: hs.sat.y };
        var ph = satPh(hero, T), dir = hero.i % 2 ? 1 : -1, p = pos(heroRing, ph - dir * 0 + dir * perSpan * 0.5 * 1);
        return { x: p.x, y: p.y };
      },
      setState: function (name, t, o) {
        o = o || {};
        if (name === "one_ring") M.go(t, o.dur, { r0: 1, fill: 0, tr: 0, rad: 0, per: 0 });
        else if (name === "trace") { var d = o.dur === undefined ? 4 : o.dur; M.go(t, d, { tr: 1 }, "linear"); M.run(t, t + d, 2 * Math.PI / (om * d)); M.go(t + d, 0.6, { tr: 0 }); }
        else if (name === "filled") M.go(t, o.dur === undefined ? 2 : o.dur, { fill: 1, r0: 1, tr: 0 }, "editorial");
        else if (name === "radius_line") M.go(t, o.dur === undefined ? M.D("draw", 0.8) : o.dur, { rad: 1 });
        else if (name === "period_arc") M.go(t, o.dur === undefined ? 1.4 : o.dur, { per: 1 }, "linear");
        else if (name === "broadcast") M.go(t, o.dur === undefined ? 0.3 : o.dur, { bc: 1 });
      }
    };
    return api;
  };
  // ---------------------------------------------------------------- signal
  // Drawn in the PARENT's coordinates: opts.from [x,y], opts.to [x,y], opts.via [[x,y],..] (a bounce point),
  // or opts.band {y0,y1} + opts.bendDeg for a refracting path. opts.pinText / opts.stampText for the riding chips.
  Loom.lesson.signal = function (ctx, parent, opts) {
    opts = opts || {};
    var fr = opts.from || [200, 100], to = opts.to || [200, 300], via = opts.via || [];
    if (opts.band) {
      var dx = to[0] - fr[0], dy = to[1] - fr[1], u0 = (opts.band.y0 - fr[1]) / dy, u1 = (opts.band.y1 - fr[1]) / dy;
      var a1 = [fr[0] + dx * u0, opts.band.y0], bend = tp(opts.bendDeg === undefined ? 9 : opts.bendDeg), ang = Math.atan2(dy, dx) + bend;
      var run = (opts.band.y1 - opts.band.y0) / Math.max(0.2, Math.sin(ang));
      via = [a1, [a1[0] + Math.cos(ang) * run, opts.band.y1]];
    }
    var pts = [fr].concat(via, [to]), lens = [0];
    for (var i = 1; i < pts.length; i++) lens.push(lens[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    var total = lens[lens.length - 1];
    var at = function (u) {
      var d = clamp(u, 0, 1) * total;
      for (var k = 1; k < pts.length; k++) if (d <= lens[k] + 1e-6) { var v = (d - lens[k - 1]) / Math.max(1e-6, lens[k] - lens[k - 1]); return { x: lerp(pts[k - 1][0], pts[k][0], v), y: lerp(pts[k - 1][1], pts[k][1], v), a: Math.atan2(pts[k][1] - pts[k - 1][1], pts[k][0] - pts[k - 1][0]), seg: k }; }
      return { x: to[0], y: to[1], a: Math.atan2(to[1] - pts[pts.length - 2][1], to[0] - pts[pts.length - 2][0]), seg: pts.length - 1 };
    };
    var g = S("g", {}, parent);
    var routeD = "M" + pts.map(function (p) { return f2(p[0]) + " " + f2(p[1]); }).join(" L");
    var trail = S("path", { d: routeD, fill: "none", stroke: ctx.c("accent2"), "stroke-width": 3, "stroke-dasharray": "6 10", opacity: 0, "stroke-linecap": "round" }, g);
    var ringsG = S("g", {}, g), rings = []; for (var q = 0; q < 3; q++) rings.push(S("circle", { cx: fr[0], cy: fr[1], r: 10, fill: "none", stroke: ctx.c("accent2"), "stroke-width": 5, opacity: 0 }, ringsG));
    var arcG = S("g", {}, g), arcGlow = S("path", { d: "M0 0", fill: "none", stroke: ctx.c("accent2"), "stroke-width": 22, opacity: 0.25, "stroke-linecap": "round" }, arcG), arc = S("path", { d: "M0 0", fill: "none", stroke: ctx.c("accent2"), "stroke-width": 8, "stroke-linecap": "round" }, arcG);
    var beamG = S("g", {}, g), bTail = S("line", { x1: 0, y1: 0, x2: 0, y2: 0, stroke: ctx.c("accent2"), "stroke-width": 4, "stroke-linecap": "round", opacity: 0.55 }, beamG), bMid = S("line", { x1: 0, y1: 0, x2: 0, y2: 0, stroke: ctx.c("accent2"), "stroke-width": 7, "stroke-linecap": "round" }, beamG);
    var bGlow = S("circle", { cx: 0, cy: 0, r: 22, fill: ctx.c("accent2"), opacity: 0.3 }, beamG), bHead = S("circle", { cx: 0, cy: 0, r: 9, fill: ctx.c("ink"), stroke: ctx.c("accent2"), "stroke-width": 4 }, beamG);
    var flash = S("circle", { cx: to[0], cy: to[1], r: 10, fill: "none", stroke: ctx.c("accent2"), "stroke-width": 6, opacity: 0 }, g);
    // chips: a pill with an icon (pin or tiny clock) and optional words
    var chipG = S("g", {}, g), chips = [];
    var mkChip = function (kind, text) {
      var cg = S("g", { opacity: 0 }, chipG), w = 56, h = 56, tw = 0;
      if (text) { var ft = ctx.kit.fit(text, { role: "label", w: 520, h: 40, maxLines: 1 }); tw = Math.ceil(ft.width) + 14; }
      w = 56 + tw + 16;
      S("rect", { x: -w / 2, y: -h / 2 + 8, width: w, height: h, rx: h / 2, fill: ctx.c("shadow"), opacity: 0.4, class: "lm-shadow" }, cg);
      S("rect", { x: -w / 2, y: -h / 2, width: w, height: h, rx: h / 2, fill: ctx.c("surface"), stroke: ctx.c("accent2"), "stroke-width": 4 }, cg);
      var ix = -w / 2 + 28;
      if (kind === "pin") { S("path", { d: "M" + ix + " " + 14 + " C " + (ix - 16) + " -2 " + (ix - 12) + " -18 " + ix + " -18 C " + (ix + 12) + " -18 " + (ix + 16) + " -2 " + ix + " 14 Z", fill: ctx.c("accent2") }, cg); S("circle", { cx: ix, cy: -6, r: 5, fill: ctx.c("surface") }, cg); }
      else { S("circle", { cx: ix, cy: 0, r: 15, fill: "none", stroke: ctx.c("accent2"), "stroke-width": 4 }, cg); S("line", { x1: ix, y1: 0, x2: ix, y2: -9, stroke: ctx.c("ink"), "stroke-width": 3.5, "stroke-linecap": "round" }, cg); S("line", { x1: ix, y1: 0, x2: ix + 7, y2: 3, stroke: ctx.c("ink"), "stroke-width": 3.5, "stroke-linecap": "round" }, cg); }
      var tx = null, ta = null;
      if (text) { tx = ctx.kit.text(cg, text, { role: "label", x: -w / 2 + 56, y: -22, w: tw, h: 44, align: "left", valign: "middle", maxLines: 1, color: "ink" }); ta = ctx.kit.text(cg, text, { role: "label", x: -w / 2 + 56, y: -22, w: tw, h: 44, align: "left", valign: "middle", maxLines: 1, color: "accent" }); ta.setAttribute("opacity", 0); }
      return { g: cg, w: w, tx: tx, ta: ta };
    };
    chips.push(mkChip("pin", opts.pinText)); chips.push(mkChip("stamp", opts.stampText));
    var P = { T: 0, prog: 0, vis: 1, sp: 1, sb: 0, sr: 0, c0: 0, c1: 0, h0: 0, h1: 0, ab: 0, trl: 0 };
    var ringR = opts.ringR || 170;
    var M = model(ctx, P, function (P) {
      var p = at(P.prog), aw = 1 - P.ab;
      // pulse: arc of the wavefront centred on the source
      var r = Math.max(24, Math.hypot(p.x - fr[0], p.y - fr[1])), th = clamp(46 / r, 0.1, 0.8), a0 = Math.atan2(to[1] - fr[1], to[0] - fr[0]), d = "";
      if (P.sp > 0.01) for (var k = 0; k <= 12; k++) { var aa = a0 - th + 2 * th * k / 12, rr = r; var px = fr[0] + Math.cos(aa) * rr, py = fr[1] + Math.sin(aa) * rr; d += (k ? "L" : "M") + f2(px) + " " + f2(py); }
      var pcx = p.x, pcy = p.y;
      arc.setAttribute("d", d || "M0 0"); arcGlow.setAttribute("d", d || "M0 0"); arcG.setAttribute("opacity", f2(P.vis * P.sp * aw));
      var back = total * 0.14 * (opts.tail || 1), tail = at(clamp(P.prog - back / total, 0, 1));
      bTail.setAttribute("x1", f2(tail.x)); bTail.setAttribute("y1", f2(tail.y)); bTail.setAttribute("x2", f2(p.x)); bTail.setAttribute("y2", f2(p.y));
      var mid = at(clamp(P.prog - back * 0.4 / total, 0, 1)); bMid.setAttribute("x1", f2(mid.x)); bMid.setAttribute("y1", f2(mid.y)); bMid.setAttribute("x2", f2(p.x)); bMid.setAttribute("y2", f2(p.y));
      bHead.setAttribute("cx", f2(p.x)); bHead.setAttribute("cy", f2(p.y)); bGlow.setAttribute("cx", f2(p.x)); bGlow.setAttribute("cy", f2(p.y));
      beamG.setAttribute("opacity", f2(P.vis * P.sb * aw));
      trail.setAttribute("stroke-dasharray", "6 10"); trail.setAttribute("opacity", f2(P.trl * P.vis * 0.7));
      ringsG.setAttribute("opacity", f2(P.sr * P.vis));
      rings.forEach(function (c, i) { var ph = (P.T * 0.8 + i / 3) % 1; c.setAttribute("r", f2(10 + ph * ringR)); c.setAttribute("opacity", f2(0.85 * (1 - ph))); c.setAttribute("stroke-width", f2(6 - 4 * ph)); });
      flash.setAttribute("r", f2(10 + P.ab * 70)); flash.setAttribute("opacity", f2(P.ab > 0 && P.ab < 1 ? 0.9 * (1 - P.ab) : 0));
      var nx = -Math.sin(p.a), ny = Math.cos(p.a), side = opts.chipSide === undefined ? 1 : opts.chipSide;
      [P.c0, P.c1].forEach(function (cv, i) { var ch = chips[i], off = 70 + i * 74; ch.g.setAttribute("transform", "translate(" + f2(pcx + nx * off * side) + " " + f2(pcy + ny * off * side) + ")"); ch.g.setAttribute("opacity", f2(cv * P.vis * aw)); if (ch.ta) { ch.ta.setAttribute("opacity", f2(i ? P.h1 : P.h0)); ch.tx.setAttribute("opacity", f2(1 - (i ? P.h1 : P.h0))); } });
    });
    M.render();
    return {
      g: g, route: pts, length: total, run: M.run, Tat: M.Tat, chips: chips,
      pointAt: function (u) { return at(u); },
      travel: function (t, dur, p1) { M.go(t, dur === undefined ? 1.2 : dur, { prog: p1 === undefined ? 1 : p1 }, "linear"); },
      seek: function (t, p) { M.go(t, 0.01, { prog: p }, "linear"); },
      hold: function (name, t, on) { var o = {}; o[name] = on === false ? 0 : 1; M.go(t, 0.25, o); },
      absorb: function (t, dur) { M.go(t, dur === undefined ? 0.7 : dur, { ab: 1 }); },
      setState: function (name, t, o) {
        o = o || {}; var d = o.dur === undefined ? 0.25 : o.dur;
        if (name === "pulse") M.go(t, d, { sp: 1, sb: 0, sr: 0, c0: 0, c1: 0, ab: 0 });
        else if (name === "pulse_tagged") { M.go(t, d, { sp: 1, sb: 0, sr: 0, ab: 0 }); var oo = {}; if (o.pin !== false) oo.c0 = 1; if (o.stamp !== false) oo.c1 = o.stamp === "later" ? 0 : 1; M.go(t, d, oo); }
        else if (name === "rings") M.go(t, d, { sr: 1, sp: 0, sb: 0 });
        else if (name === "beam") M.go(t, d, { sb: 1, sp: 0, sr: 0 });
        else if (name === "bend" || name === "bounce") M.go(t, d, { sb: 1, sp: 0, sr: 0, trl: 1 });
        else if (name === "absorbed") M.go(t, o.dur === undefined ? 0.7 : o.dur, { ab: 1 });
      }
    };
  };
  // ---------------------------------------------------------------- range_circles
  // 1920 x 1080 (diagram coordinates). opts.sats {A,B,C,D: [x,y]}, opts.point [960,812], opts.space [x,y], opts.amount (swell px),
  // opts.show ["A","B"] = circles already complete. setState(name, t, {id, dur, ...}).
  Loom.lesson.range_circles = function (ctx, parent, opts) {
    opts = opts || {};
    var SATS = opts.sats || { A: [430, 230], B: [1490, 200], C: [980, 110], D: [1720, 430] }, PT = opts.point || [960, 812], SP = opts.space || [1180, 500], AMT = opts.amount || 70;
    var ids = Object.keys(SATS), root = S("g", {}, parent);
    var cid = "kr" + (++UID), cdefs = S("defs", {}, root), ccp = S("clipPath", { id: cid }, cdefs); S("rect", { x: 0, y: 0, width: 1920, height: 1080 }, ccp);
    var fid = "kf" + (++UID), flt = S("filter", { id: fid, x: "-50%", y: "-50%", width: "200%", height: "200%" }, cdefs); S("feGaussianBlur", { stdDeviation: 12 }, flt);
    var g = S("g", { "clip-path": "url(#" + cid + ")" }, root);
    var patch = S("path", { d: "M0 0", fill: ctx.c("neg"), stroke: ctx.c("neg"), "stroke-width": 26, "stroke-linejoin": "round", opacity: 0, filter: "url(#" + fid + ")" }, g);
    var ringG = S("g", {}, g), ringE = S("path", { d: "M0 0", fill: "none", stroke: ctx.c("accent"), "stroke-width": 6, "stroke-linecap": "round", opacity: 0 }, ringG);
    var C = {};
    ids.forEach(function (id) {
      var b = S("path", { d: "M0 0", fill: "none", stroke: ctx.c("line"), "stroke-width": 4, opacity: 0.5 }, g);
      var n = S("path", { d: "M0 0", fill: "none", stroke: ctx.c("accent"), "stroke-width": 6, opacity: 0 }, g);
      var l = S("line", { x1: 0, y1: 0, x2: 0, y2: 0, stroke: ctx.c("accent"), "stroke-width": 6, "stroke-linecap": "round", opacity: 0 }, g);
      C[id] = { b: b, n: n, l: l, base: Math.hypot(SATS[id][0] - PT[0], SATS[id][1] - PT[1]), th0: Math.atan2(PT[1] - SATS[id][1], PT[0] - SATS[id][0]) };
    });
    var ptsG = S("g", {}, g);
    var spG = S("g", {}, ptsG), spGlow = S("circle", { cx: SP[0], cy: SP[1], r: 30, fill: ctx.c("accent2"), opacity: 0.3 }, spG), spDot = S("circle", { cx: SP[0], cy: SP[1], r: 14, fill: ctx.c("accent2"), stroke: ctx.c("ink"), "stroke-width": 3 }, spG);
    var gpG = S("g", {}, ptsG), gpGlow = S("circle", { cx: PT[0], cy: PT[1], r: 30, fill: ctx.c("accent2"), opacity: 0.3 }, gpG), gpDot = S("circle", { cx: PT[0], cy: PT[1], r: 14, fill: ctx.c("accent2"), stroke: ctx.c("ink"), "stroke-width": 3 }, gpG);
    var snap = S("circle", { cx: PT[0], cy: PT[1], r: 20, fill: "none", stroke: ctx.c("accent2"), "stroke-width": 6, opacity: 0 }, g);
    var snapDot = S("circle", { cx: PT[0], cy: PT[1], r: 22, fill: ctx.c("accent2"), opacity: 0 }, g);
    var P = { T: 0, swell: 0, pa: 0, ring: 0, pts: 0, pg: 0, sd: 0, sn: 0, sh: 0 };
    ids.forEach(function (id) { var on = (opts.show || []).indexOf(id) >= 0 ? 1 : 0; P["sw_" + id] = on; P["nm_" + id] = 0; P["rl_" + id] = 0; P["ld_" + id] = on ? 1 : 0; P["g_" + id] = 1; });
    var radius = function (id, Pp) { return Math.max(1, C[id].base * Pp["g_" + id] + Pp.swell); };
    var inter = function (a, b, ra, rb) {
      var dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy), aa = (ra * ra - rb * rb + d * d) / (2 * d), h2 = ra * ra - aa * aa; if (h2 < 0) return null;
      var h = Math.sqrt(h2), mx = a[0] + dx * aa / d, my = a[1] + dy * aa / d, ux = -dy / d, uy = dx / d;
      return { p1: [mx + ux * h, my + uy * h], p2: [mx - ux * h, my - uy * h], m: [mx, my], h: h, d: [dx / d, dy / d] };
    };
    var geo = function (Pp) { return inter(SATS.A, SATS.B, radius("A", Pp), radius("B", Pp)); };
    var M = model(ctx, P, function (Pp) {
      var actives = [];
      ids.forEach(function (id) {
        var c = C[id], s = SATS[id], R = radius(id, Pp), sw = Pp["sw_" + id], th0 = c.th0, d = "";
        var pt = function (a) { return f2(s[0] + R * Math.cos(a)) + " " + f2(s[1] + R * Math.sin(a)); };
        if (sw > 0.001) { if (sw >= 0.999) d = "M" + pt(th0) + " A" + f2(R) + " " + f2(R) + " 0 1 1 " + pt(th0 + Math.PI) + " A" + f2(R) + " " + f2(R) + " 0 1 1 " + pt(th0); else d = "M" + pt(th0) + " A" + f2(R) + " " + f2(R) + " 0 " + (sw * 2 > 1 ? 1 : 0) + " 1 " + pt(th0 + sw * 2 * Math.PI); }
        c.b.setAttribute("d", d || "M0 0"); c.n.setAttribute("d", d || "M0 0");
        c.b.setAttribute("opacity", f2(sw > 0.001 ? 0.55 * (1 - Pp["nm_" + id] * 0.6) : 0)); c.n.setAttribute("opacity", f2(Pp["nm_" + id] * (sw > 0.001 ? 1 : 0)));
        var th = th0 + sw * 2 * Math.PI, len = R * Pp["ld_" + id];
        c.l.setAttribute("x1", s[0]); c.l.setAttribute("y1", s[1]); c.l.setAttribute("x2", f2(s[0] + len * Math.cos(th))); c.l.setAttribute("y2", f2(s[1] + len * Math.sin(th))); c.l.setAttribute("opacity", f2(Pp["rl_" + id]));
        if (sw >= 0.999 && Pp["g_" + id] > 0.98) actives.push(id);
      });
      // ring of A and B: thin tilted ellipse through the two crossings
      var ge = geo(Pp);
      if (ge && Pp.ring > 0.001) {
        var a = ge.h, bb = Math.max(4, a * 0.24), ang = Math.atan2(ge.p2[1] - ge.p1[1], ge.p2[0] - ge.p1[0]) * 180 / Math.PI, per = Math.PI * (3 * (a + bb) - Math.sqrt((3 * a + bb) * (a + 3 * bb)));
        ringE.setAttribute("d", "M" + f2(-a) + " 0 A" + f2(a) + " " + f2(bb) + " 0 1 1 " + f2(a) + " 0 A" + f2(a) + " " + f2(bb) + " 0 1 1 " + f2(-a) + " 0");
        ringE.setAttribute("transform", "translate(" + f2(ge.m[0]) + " " + f2(ge.m[1]) + ") rotate(" + f2(ang) + ")"); ringE.setAttribute("stroke-dasharray", f2(per)); ringE.setAttribute("stroke-dashoffset", f2(per * (1 - clamp(Pp.ring, 0, 1)))); ringE.setAttribute("opacity", 1);
      } else ringE.setAttribute("opacity", 0);
      // patch: where the swollen circles no longer meet (nearest crossings to the point, as a soft region)
      var pp = [];
      for (var i = 0; i < actives.length; i++) for (var j = i + 1; j < actives.length; j++) {
        var q = inter(SATS[actives[i]], SATS[actives[j]], radius(actives[i], Pp), radius(actives[j], Pp)); if (!q) continue;
        var d1 = Math.hypot(q.p1[0] - PT[0], q.p1[1] - PT[1]), d2 = Math.hypot(q.p2[0] - PT[0], q.p2[1] - PT[1]); pp.push(d1 < d2 ? q.p1 : q.p2);
      }
      if (pp.length >= 2) {
        var cx0 = 0, cy0 = 0; pp.forEach(function (p) { cx0 += p[0]; cy0 += p[1]; }); cx0 /= pp.length; cy0 /= pp.length;
        pp.sort(function (p, q) { return Math.atan2(p[1] - cy0, p[0] - cx0) - Math.atan2(q[1] - cy0, q[0] - cx0); });
        patch.setAttribute("d", "M" + pp.map(function (p) { return f2(p[0]) + " " + f2(p[1]); }).join(" L") + " Z");
        patch.setAttribute("opacity", f2(Pp.pa * clamp(Pp.swell / (AMT * 0.3), 0, 1) * 0.55));
      } else patch.setAttribute("opacity", 0);
      ptsG.setAttribute("opacity", f2(clamp(Pp.pts * 2, 0, 1)));
      var sc = 0.5 + 0.5 * clamp(Pp.pts, 0, 1);
      gpG.setAttribute("transform", "translate(" + PT[0] + " " + PT[1] + ") scale(" + f2(sc) + ") translate(" + (-PT[0]) + " " + (-PT[1]) + ")"); gpGlow.setAttribute("r", f2(30 + 26 * Pp.pg)); gpGlow.setAttribute("opacity", f2(0.3 + 0.3 * Pp.pg));
      spG.setAttribute("transform", "translate(0 " + f2(-Pp.sd * 90) + ")"); spG.setAttribute("opacity", f2(1 - Pp.sd));
      snap.setAttribute("r", f2(20 + 70 * Pp.sn)); snap.setAttribute("opacity", f2(Pp.sn > 0 && Pp.sn < 1 ? 0.9 * (1 - Pp.sn) : 0)); snapDot.setAttribute("opacity", f2(Pp.sn >= 0.999 ? 0.35 : 0));
    });
    M.render();
    var api = {
      g: root, circles: C, patch: patch, ring: ringE, run: M.run, Tat: M.Tat,
      anchors: {
        point: { x: PT[0], y: PT[1] }, space: { x: SP[0], y: SP[1] }, sat: function (id) { return { x: SATS[id][0], y: SATS[id][1] }; },
        rangeMid: function (id) { return { x: (SATS[id][0] + PT[0]) / 2, y: (SATS[id][1] + PT[1]) / 2 }; },
        crossings: function () { var q = geo(P); return q ? { a: { x: q.p1[0], y: q.p1[1] }, b: { x: q.p2[0], y: q.p2[1] } } : null; }
      },
      setState: function (name, t, o) {
        o = o || {}; var id = o.id || "A", d = o.dur, k = {};
        if (name === "range_line") { k["ld_" + id] = 1; k["rl_" + id] = 1; M.go(t, d === undefined ? M.D("draw", 0.8) : d, k); }
        else if (name === "sweep") { d = d === undefined ? 2.4 : d; var s1 = {}; s1["ld_" + id] = 1; s1["rl_" + id] = 1; s1["nm_" + id] = 1; M.go(t, 0.15, s1); var s2 = {}; s2["sw_" + id] = 1; M.go(t + 0.15, d, s2, "linear"); var s3 = {}; s3["rl_" + id] = 0; s3["nm_" + id] = o.keepNamed ? 1 : 0; M.go(t + 0.15 + d, 0.5, s3); }
        else if (name === "circle") { k["sw_" + id] = 1; k["rl_" + id] = 0; k["nm_" + id] = 0; M.go(t, d, k); }
        else if (name === "grow") { k["sw_" + id] = 1; k["g_" + id] = 1; k["nm_" + id] = 1; var z = {}; z["g_" + id] = 0.02; z["sw_" + id] = 1; M.go(t - 0.02, 0.01, z, "linear"); M.go(t, d === undefined ? 1.6 : d, { }, "linear"); var g2 = {}; g2["g_" + id] = 1; M.go(t, d === undefined ? 1.6 : d, g2, "editorial"); var n2 = {}; n2["nm_" + id] = 0; M.go(t + (d === undefined ? 1.6 : d), 0.5, n2); }
        else if (name === "swell") M.go(t, d === undefined ? 1.8 : d, { swell: o.amount === undefined ? AMT : o.amount }, "editorial");
        else if (name === "shrink") M.go(t, d === undefined ? 1.6 : d, { swell: o.to === undefined ? 0 : o.to }, "editorial");
        else if (name === "ring") M.go(t, d === undefined ? M.D("draw", 0.8) : d, { ring: o.to === undefined ? 1 : o.to }, "linear");
        else if (name === "two_points") { M.go(t, d === undefined ? 0.5 : d, { pts: 1, ring: 0 }); }
        else if (name === "patch") M.go(t, d === undefined ? 0.9 : d, { pa: o.to === undefined ? 1 : o.to });
        else if (name === "snap") { M.go(t, d === undefined ? 1.6 : d, { swell: 0 }, "editorial"); M.go(t + (d === undefined ? 1.6 : d), 0.7, { sn: 1, pa: 0 }); }
      },
      dimSpace: function (t, dur) { M.go(t, dur === undefined ? 1.6 : dur, { sd: 1 }, "linear"); },
      glowGround: function (t, on) { M.go(t, 0.5, { pg: on === false ? 0 : 1 }); },
      reveal: function (id, t, dur) { var k = {}; k["sw_" + id] = 1; k["g_" + id] = 1; M.go(t, dur, k); }
    };
    return api;
  };
})();
