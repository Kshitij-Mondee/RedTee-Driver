Loom.lesson = Loom.lesson || {};
(function () {
  var NS = "http://www.w3.org/2000/svg";
  var uid = 0;
  var CLS = { none: "muted", public: "accent", internal: "accent2", confidential: "accent3" };
  function mk(p, tag, a) {
    var e = document.createElementNS(NS, tag);
    for (var k in a) e.setAttribute(k, a[k]);
    p.appendChild(e);
    return e;
  }
  function rr(x, y, w, h, r) {
    return "M" + (x + r) + " " + y + "H" + (x + w - r) + "A" + r + " " + r + " 0 0 1 " + (x + w) + " " + (y + r) +
      "V" + (y + h - r) + "A" + r + " " + r + " 0 0 1 " + (x + w - r) + " " + (y + h) + "H" + (x + r) +
      "A" + r + " " + r + " 0 0 1 " + x + " " + (y + h - r) + "V" + (y + r) + "A" + r + " " + r + " 0 0 1 " + (x + r) + " " + y + "Z";
  }
  function rpoly(pts, r) {
    var n = pts.length, d = "";
    for (var i = 0; i < n; i++) {
      var p = pts[i], a = pts[(i + n - 1) % n], b = pts[(i + 1) % n];
      var la = Math.hypot(a[0] - p[0], a[1] - p[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
      var q = Math.min(r, la / 2, lb / 2);
      var p1 = [p[0] + (a[0] - p[0]) / la * q, p[1] + (a[1] - p[1]) / la * q];
      var p2 = [p[0] + (b[0] - p[0]) / lb * q, p[1] + (b[1] - p[1]) / lb * q];
      d += (i === 0 ? "M" : "L") + p1[0].toFixed(1) + " " + p1[1].toFixed(1) + "Q" + p[0] + " " + p[1] + " " + p2[0].toFixed(1) + " " + p2[1].toFixed(1);
    }
    return d + "Z";
  }
  function pageD(W, H) { return rpoly([[0, 0], [W / 2, 0], [W, 0], [W, H / 2], [W, H], [W / 2, H], [0, H], [0, H / 2]], 16); }
  function folderD(W, H) { return rpoly([[0, 0], [0.4 * W, 0], [0.48 * W, 0.12 * H], [W, 0.12 * H], [W, H], [0.5 * W, H], [0, H], [0, 0.5 * H]], 16); }
  function screenD(W, H) { return rpoly([[0, 0], [W, 0], [W, 0.8 * H], [0.62 * W, 0.8 * H], [0.62 * W, H], [0.38 * W, H], [0.38 * W, 0.8 * H], [0, 0.8 * H]], 16); }
  function ln(ctx, p, d, color, o) {
    o = o || {};
    var e = mk(p, "path", { d: d, fill: o.fill ? ctx.c(o.fill) : "none", stroke: ctx.c(color || "ink"), "stroke-width": o.sw || 3, "stroke-linecap": "round", "stroke-linejoin": "round" });
    if (o.dash) e.setAttribute("stroke-dasharray", o.dash); else e.setAttribute("pathLength", "1");
    return e;
  }
  function dp(e, p) {
    p = Math.max(0, Math.min(1, p));
    e.setAttribute("stroke-dasharray", p + " 2");
    e.setAttribute("stroke-dashoffset", "0");
    e.setAttribute("opacity", p <= 0.001 ? 0 : 1);
  }
  function fade(el, t, dur, a, b, ease) {
    Loom.drive(function (e) { el.setAttribute("opacity", a + (b - a) * e); }, t, dur || 0.4, ease || "enter");
  }
  function draw(el, t, dur) { Loom.drive(function (e) { dp(el, e); }, t, dur || 1.0, "move"); }
  function txt(ctx, p, s, x, y, w, h, o) {
    o = o || {};
    return ctx.kit.text(p, s, { role: o.role || "label", x: x, y: y, w: w, h: h, align: o.align || "left", valign: "middle", color: o.color || "ink" });
  }
  function circ(ctx, p, cx, cy, r, color) {
    return ln(ctx, p, "M" + (cx - r) + " " + cy + "a" + r + " " + r + " 0 1 0 " + (2 * r) + " 0a" + r + " " + r + " 0 1 0 " + (-2 * r) + " 0", color);
  }
  function place(parent, o, W, H) {
    var sc = o.scale || (o.w && o.h ? Math.min(o.w / W, o.h / H) : o.w ? o.w / W : o.h ? o.h / H : 1);
    var g = mk(parent, "g", { transform: "translate(" + (o.x || 0) + " " + (o.y || 0) + ") scale(" + sc + ")" });
    return { g: g, sc: sc };
  }
  // class outline: grey dashed under-layer plus a class-colour layer that draws on along the same path
  function clsLine(ctx, g, d, o) {
    o = o || {};
    var cur = o.cls || "none";
    var under = ln(ctx, g, d, CLS[cur], { dash: "10 9" });
    var top = ln(ctx, g, d, CLS[cur], {});
    var mask = null, mpath = null;
    if (o.mask) {
      var id = "lkm" + (uid++);
      mask = mk(g, "mask", { id: id, maskUnits: "userSpaceOnUse", x: -30, y: -30, width: o.mask[0] + 60, height: o.mask[1] + 60 });
      mpath = mk(mask, "path", { d: d, fill: "none", stroke: "white", "stroke-width": 12, pathLength: 1 });
      under.setAttribute("mask", "url(#" + id + ")");
    }
    function show(c) {
      if (c === "none") { under.setAttribute("opacity", 1); dp(top, 0); }
      else { under.setAttribute("opacity", 0); top.setAttribute("stroke", ctx.c(CLS[c])); top.removeAttribute("stroke-dasharray"); top.setAttribute("opacity", 1); }
    }
    show(cur);
    var api = {
      under: under, top: top, mask: mpath,
      cls: function () { return cur; },
      set: function (cls, t, dur) {
        var from = cur; if (cls === from) return; cur = cls;
        Loom.drive(function (e) {
          if (from === "none") under.setAttribute("stroke-dasharray", "10 9"); else under.setAttribute("stroke-dasharray", "none");
          under.setAttribute("stroke", ctx.c(CLS[from]));
          under.setAttribute("opacity", e >= 1 ? 0 : 1);
          top.setAttribute("stroke", ctx.c(CLS[cls]));
          if (cls === "none") { top.setAttribute("opacity", 0); } else { dp(top, e); if (e >= 1) top.removeAttribute("stroke-dasharray"); }
        }, t, dur || 0.6, "move");
      }
    };
    return api;
  }
  var LAB = { press_release: "Press release", meeting_notes: "Meeting notes", customer_list: "Customer list", job_advert: "Job advert", org_chart: "Org chart", payroll: "Payroll file", plain: "" };

  // ITEM: a document page, 280 x 360 natural. Variants draw their own rows; outline is the class carrier.
  Loom.lesson.item = function (ctx, parent, opts) {
    opts = opts || {};
    var W = 280, H = 360, v = opts.variant || "plain";
    var pl = place(parent, opts, W, H), g = pl.g;
    var d = pageD(W, H);
    var fill = mk(g, "path", { d: d, fill: ctx.c("surface"), stroke: "none" });
    var body = mk(g, "g", {});
    var rows = [];
    function R() { var r = mk(body, "g", {}); rows.push(r); return r; }
    function L(r, x1, y, x2, col) { return ln(ctx, r, "M" + x1 + " " + y + "H" + x2, col || "muted"); }
    function B(r, x, y, w, h, col) { return ln(ctx, r, rr(x, y, w, h, 8), col || "ink"); }
    var i, r;
    if (v === "press_release") {
      B(R(), 24, 52, 232, 40);
      var wd = [232, 232, 232, 232, 150];
      for (i = 0; i < 5; i++) L(R(), 24, 124 + i * 30, 24 + wd[i]);
    } else if (v === "meeting_notes") {
      var bw = [190, 150, 200, 120, 170];
      for (i = 0; i < 5; i++) { r = R(); circ(ctx, r, 34, 62 + i * 44, 6, "ink"); L(r, 56, 62 + i * 44, 56 + bw[i] * 0.95); }
    } else if (v === "customer_list") {
      L(R(), 24, 56, 256, "ink");
      var nw = [110, 90, 120, 80, 100, 115], cw = [50, 66, 42, 58, 46, 62];
      for (i = 0; i < 6; i++) { r = R(); circ(ctx, r, 34, 96 + i * 34, 6, "ink"); L(r, 54, 96 + i * 34, 54 + nw[i], "ink"); L(r, 256 - cw[i], 96 + i * 34, 256); }
    } else if (v === "job_advert") {
      L(R(), 24, 58, 190, "ink"); L(R(), 24, 90, 130);
      for (i = 0; i < 4; i++) L(R(), 24, 134 + i * 30, i === 3 ? 160 : 256);
      B(R(), 24, 258, 110, 34, "ink");
    } else if (v === "org_chart") {
      r = R(); B(r, 100, 40, 80, 40);
      r = R(); ln(ctx, r, "M140 80V110M70 110H210M70 110V130M210 110V130", "ink");
      r = R(); B(r, 30, 130, 80, 40); B(r, 170, 130, 80, 40);
      r = R(); ln(ctx, r, "M70 170V200M24 200H116M24 200V220M116 200V220M210 170V220", "ink");
      r = R(); B(r, 0 + 4, 220, 40, 34); B(r, 96, 220, 40, 34); B(r, 190, 220, 40, 34);
    } else if (v === "payroll") {
      L(R(), 24, 56, 256, "ink");
      for (i = 0; i < 6; i++) { r = R(); L(r, 24, 98 + i * 34, 24 + (i % 2 ? 90 : 120)); L(r, 200, 98 + i * 34, 256, "ink"); }
      L(R(), 160, 292, 256, "ink");
    } else {
      for (i = 0; i < 6; i++) L(R(), 24, 60 + i * 34, i % 3 === 2 ? 170 : 256);
    }
    var labS = LAB[v] || "";
    var label = mk(g, "g", {});
    if (labS) txt(ctx, label, labS, 14, 304, 252, 44, { align: "center" });
    if (opts.label === false) label.setAttribute("opacity", 0);
    var co = clsLine(ctx, g, d, { cls: opts.cls || "none", mask: [W, H] });
    // tick: small pos tick on the top right corner
    var tick = mk(g, "g", { transform: "translate(" + (W - 4) + " 4)" });
    var tc = ln(ctx, tick, "M-20 0a20 20 0 1 0 40 0a20 20 0 1 0 -40 0", "pos", { fill: "surface" });
    var tp = ln(ctx, tick, "M-9 1L-3 8L10 -8", "pos");
    if (!opts.tick) { tick.setAttribute("opacity", 0); }
    var api = {
      g: g, scale: pl.sc, w: W * pl.sc, h: H * pl.sc, natural: { w: W, h: H },
      variant: v, page: fill, rows: rows, label: label, tick: tick,
      outline: co.top, grey: co.under, pageOutline: d, folderOutline: folderD(W, H), screenOutline: screenD(W, H),
      setClass: function (cls, t, dur) { co.set(cls, t, dur); },
      setTick: function (on, t, dur) {
        Loom.drive(function (e) { var p = on ? e : 1 - e; tick.setAttribute("opacity", p <= 0.001 ? 0 : 1); dp(tp, p); tc.setAttribute("opacity", p); }, t, dur || 0.4, "move");
      },
      setLabel: function (on, t, dur) { fade(label, t, dur || 0.4, on ? 0 : 1, on ? 1 : 0); },
      printRows: function (t, stagger, dur) {
        rows.forEach(function (row, k) {
          var ps = row.querySelectorAll("path");
          Loom.drive(function (e) { for (var q = 0; q < ps.length; q++) dp(ps[q], e); }, t + k * (stagger === undefined ? 0.09 : stagger), dur || 0.35, "move");
        });
      },
      drawIn: function (t, dur) {
        dur = dur || 1.0;
        if (co.mask) Loom.drive(function (e) { dp(co.mask, e); fill.setAttribute("opacity", e); body.setAttribute("opacity", Math.max(0, (e - 0.4) / 0.6)); label.setAttribute("opacity", opts.label === false ? 0 : Math.max(0, (e - 0.4) / 0.6)); }, t, dur, "move");
      },
      setState: function (name, t) { if (CLS[name]) co.set(name, t); }
    };
    return api;
  };

  // TRAYS: three open trays, 380 x 196 each, gap 60 (natural 1260 x 196). back / mid / front layers; items go in `mid`.
  Loom.lesson.trays = function (ctx, parent, opts) {
    opts = opts || {};
    var TW = 380, GAP = 60, TH = 196, W = 3 * TW + 2 * GAP;
    var pl = place(parent, opts, W, TH), g = pl.g;
    var back = mk(g, "g", {}), mid = mk(g, "g", {}), front = mk(g, "g", {});
    var names = ["Public", "Internal", "Confidential"], cols = ["accent", "accent2", "accent3"];
    var trays = [], drop = [];
    for (var i = 0; i < 3; i++) {
      var ox = i * (TW + GAP);
      var bg = mk(back, "g", { transform: "translate(" + ox + " 0)" });
      var bl = ln(ctx, bg, "M16 46L0 0H380L364 46", cols[i]);
      var fg = mk(front, "g", { transform: "translate(" + ox + " 0)" });
      var ff = mk(fg, "path", { d: rr(16, 46, 348, 150, 16), fill: ctx.c("surface"), stroke: "none" });
      var fl = ln(ctx, fg, rr(16, 46, 348, 150, 16), cols[i]);
      var lab = mk(fg, "g", {});
      txt(ctx, lab, names[i], 30, 100, 320, 56, { align: "center" });
      trays.push({ back: bl, face: fl, fill: ff, label: lab, g: bg, faceG: fg, name: names[i], color: cols[i] });
      drop.push({ x: ox + TW / 2, y: 96, restY: -40 });
    }
    return {
      g: g, back: back, mid: mid, front: front, trays: trays, drop: drop, scale: pl.sc, w: W * pl.sc, h: TH * pl.sc, natural: { w: W, h: TH },
      drawIn: function (t, stagger, dur) {
        trays.forEach(function (tr, k) {
          var t0 = t + k * (stagger === undefined ? 0.25 : stagger);
          Loom.drive(function (e) { dp(tr.back, e); dp(tr.face, e); tr.fill.setAttribute("opacity", e); tr.label.setAttribute("opacity", Math.max(0, (e - 0.5) / 0.5)); }, t0, dur || 0.8, "move");
        });
      },
      highlight: function (i, on, t, dur) {
        var tr = trays[i];
        Loom.drive(function (e) { var w = 3 + 2 * (on ? e : 1 - e); tr.back.setAttribute("stroke-width", w); tr.face.setAttribute("stroke-width", w); }, t, dur || 0.3, "move");
      },
      setState: function () {}
    };
  };
  // MAIL: laptop front view, 1100 x 664 natural. Geometry identical in every state; layers hidden at rest are shown by the beat.
  Loom.lesson.mail = function (ctx, parent, opts) {
    opts = opts || {};
    var W = 1100, H = 664;
    var pl = place(parent, opts, W, H), g = pl.g;
    mk(g, "path", { d: rr(50, 0, 1000, 620, 28), fill: ctx.c("surface"), stroke: "none" });
    var laptop = mk(g, "g", {});
    ln(ctx, laptop, rr(50, 0, 1000, 620, 28), "ink");
    ln(ctx, laptop, rr(76, 26, 948, 568, 10), "line");
    mk(laptop, "path", { d: rr(0, 620, 1100, 44, 22), fill: ctx.c("surface"), stroke: ctx.c("ink"), "stroke-width": 3, "stroke-linejoin": "round" });
    ln(ctx, laptop, "M480 620Q480 636 500 636H600Q620 636 620 620", "ink");
    var email = mk(g, "g", {});
    txt(ctx, email, "To", 110, 62, 60, 48, { color: "muted" });
    var toText = txt(ctx, email, "Contractor (new)", 190, 62, 330, 48, {});
    var underline = ln(ctx, email, "M190 114H440", "ink");
    ln(ctx, email, "M110 134H990", "line");
    var subject = ln(ctx, email, "M190 180H640", "ink");
    ln(ctx, email, "M110 214H990", "line");
    var body1 = ln(ctx, email, "M110 266H800", "muted");
    var body2 = ln(ctx, email, "M110 304H620", "muted");
    // attachment chip
    var att = mk(g, "g", {});
    mk(att, "path", { d: rr(110, 350, 340, 92, 16), fill: ctx.c("surface"), stroke: "none" });
    var chip = clsLine(ctx, att, rr(110, 350, 340, 92, 16), { cls: "none" });
    var icon = mk(att, "g", {});
    ln(ctx, icon, "M134 368H156L168 380V418H134Z", "ink");
    ln(ctx, icon, "M156 368V380H168", "ink");
    ln(ctx, icon, "M142 394H160M142 404H160", "muted");
    txt(ctx, att, "Customer list", 184, 366, 256, 60, {});
    // send button
    var send = mk(g, "g", {});
    mk(send, "path", { d: rr(790, 500, 200, 72, 16), fill: ctx.c("surface"), stroke: "none" });
    ln(ctx, send, rr(790, 500, 200, 72, 16), "ink");
    txt(ctx, send, "Send", 790, 504, 200, 64, { align: "center" });
    // hidden layers
    var need = mk(g, "g", { opacity: 0 });
    txt(ctx, need, "Need it?", 540, 62, 200, 48, { color: "accent3" });
    var chRow = mk(g, "g", { opacity: 0 });
    mk(chRow, "path", { d: rr(490, 350, 420, 92, 16), fill: ctx.c("surface"), stroke: "none" });
    var chOut = clsLine(ctx, chRow, rr(490, 350, 420, 92, 16), { cls: "none" });
    var lk = mk(chRow, "g", { transform: "translate(516 372)" });
    ln(ctx, lk, rr(0, 18, 36, 28, 6), "accent");
    ln(ctx, lk, "M8 18V10A10 10 0 0 1 28 10V18", "accent");
    txt(ctx, chRow, "Approved channel", 568, 366, 330, 60, {});
    var ownerNote = mk(g, "g", { opacity: 0 });
    txt(ctx, ownerNote, "Ask the owner", 500, 452, 300, 44, { color: "muted" });
    // cursor (tip at its origin)
    var T = { send: [890, 540], above_send: [880, 450], channel: [760, 410], start: [300, 520] };
    var cur = mk(g, "g", {});
    var curShape = mk(cur, "path", { d: "M0 0L0 34L9 26L15 40L21 37L15 24L27 24Z", fill: ctx.c("surface"), stroke: ctx.c("ink"), "stroke-width": 3, "stroke-linejoin": "round" });
    var cp = T.start;
    function at(p) { cur.setAttribute("transform", "translate(" + p[0].toFixed(1) + " " + p[1].toFixed(1) + ")"); }
    at(cp);
    var chCls = "none";
    var api = {
      g: g, scale: pl.sc, w: W * pl.sc, h: H * pl.sc, natural: { w: W, h: H },
      laptop: laptop, email: email, toText: toText, underline: underline, subject: subject, body: [body1, body2],
      attachment: att, chip: chip.top, chipGrey: chip.under, send: send, cursor: cur, channelRow: chRow, need: need, ownerNote: ownerNote,
      targets: T,
      anchor: function (n) { var p = T[n]; return { x: (opts.x || 0) + p[0] * pl.sc, y: (opts.y || 0) + p[1] * pl.sc }; },
      drawUnderline: function (t, dur) { draw(underline, t, dur || 1.0); },
      setClass: function (cls, t, dur) { chip.set(cls, t, dur); },
      moveCursor: function (name, t, dur) {
        var a = cp, b = T[name]; cp = b;
        Loom.drive(function (e) { at([a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e]); }, t, dur || 0.6, "move");
      },
      dimSend: function (on, t, dur) { fade(send, t, dur || 0.4, on ? 1 : 0.35, on ? 0.35 : 1); },
      show: function (name, t, dur) { var el = name === "need" ? need : name === "owner" ? ownerNote : chRow; fade(el, t, dur || 0.4, 0, 1); },
      lightChannel: function (t, dur) { chOut.set("public", t, dur); },
      setState: function (name, t) {
        if (name === "plain") { return; }
        if (name === "classified") { chip.set("confidential", t); }
        if (name === "channel") {
          chip.set("confidential", t);
          fade(chRow, t, 0.4, 0, 1); api.moveCursor("channel", t, 0.6); api.dimSend(true, t, 0.4); chOut.set("public", t + 0.4, 0.6);
        }
      }
    };
    return api;
  };
  // HARM_MARK: one-line question mark, 160 x 300 natural, with a small Harm? label under it.
  Loom.lesson.harm_mark = function (ctx, parent, opts) {
    opts = opts || {};
    var W = 160, H = 300;
    var pl = place(parent, opts, W, H), g = pl.g;
    var hov = mk(g, "g", {});
    var mark = ln(ctx, hov, "M30 84C30 34 130 34 130 84C130 124 80 128 80 170V192", "ink");
    var dot = mk(hov, "circle", { cx: 80, cy: 238, r: 7, fill: ctx.c("ink"), stroke: "none" });
    var label = mk(hov, "g", {});
    if (opts.label === false) label.setAttribute("opacity", 0);
    txt(ctx, label, "Harm?", 0, 256, 160, 44, { align: "center", color: "muted" });
    return {
      g: g, hover: hov, mark: mark, dot: dot, label: label, scale: pl.sc, w: W * pl.sc, h: H * pl.sc, natural: { w: W, h: H },
      drawOn: function (t, dur) {
        dur = dur || 1.0;
        Loom.drive(function (e) { dp(mark, e / 0.85); dot.setAttribute("opacity", Math.max(0, (e - 0.85) / 0.15)); }, t, dur, "move");
      },
      showLabel: function (t, dur) { fade(label, t, dur || 0.4, 0, 1); },
      hoverFor: function (t0, t1, amp) {
        var n = Math.max(1, Math.round((t1 - t0) / 2.4)), a = amp === undefined ? 6 : amp;
        Loom.drive(function (e) { hov.setAttribute("transform", "translate(0 " + (a * Math.sin(2 * Math.PI * n * e)).toFixed(2) + ")"); }, t0, t1 - t0, "linear");
      },
      fadeOut: function (t, dur) { fade(g, t, dur || 0.5, 1, 0); },
      setState: function () {}
    };
  };
  // PEOPLE_ROW: n plain monoline heads and shoulders, 76 wide each.
  Loom.lesson.people_row = function (ctx, parent, opts) {
    opts = opts || {};
    var n = opts.n || 3, W = n * 76, H = 80;
    var pl = place(parent, opts, W, H), g = pl.g, heads = [];
    for (var i = 0; i < n; i++) {
      var h = mk(g, "g", { transform: "translate(" + (38 + i * 76) + " 0)" });
      circ(ctx, h, 0, 16, 16, opts.color || "ink");
      ln(ctx, h, "M-28 76C-28 44 28 44 28 76", opts.color || "ink");
      heads.push(h);
    }
    return {
      g: g, heads: heads, scale: pl.sc, w: W * pl.sc, h: H * pl.sc, natural: { w: W, h: H },
      drawIn: function (t, stagger, dur) {
        heads.forEach(function (h, k) {
          var ps = h.querySelectorAll("path");
          Loom.drive(function (e) { for (var q = 0; q < ps.length; q++) dp(ps[q], e); }, t + k * (stagger === undefined ? 0.15 : stagger), dur || 0.45, "move");
        });
      },
      setState: function () {}
    };
  };
  // HANDLING: confidential handling props. Build one with opts.only = channel | folder | shredder | file, or all in a row.
  // natural sizes: channel 560 x 80, folder 300 x 240, shredder 300 x 390 (page feeds from above), file 120 x 150.
  Loom.lesson.handling = function (ctx, parent, opts) {
    opts = opts || {};
    var only = opts.only || null;
    var SZ = { channel: [560, 80], folder: [300, 240], shredder: [300, 390], file: [120, 150] };
    var OFF = { channel: [0, 150], folder: [640, 100], shredder: [1010, 0], file: [1400, 120] };
    var W = only ? SZ[only][0] : 1520, H = only ? SZ[only][1] : 390;
    var pl = place(parent, opts, W, H), g = pl.g;
    var out = { g: g, scale: pl.sc, w: W * pl.sc, h: H * pl.sc, natural: { w: W, h: H }, setState: function () {} };
    function sub(n) { var o = only ? [0, 0] : OFF[n]; return mk(g, "g", { transform: "translate(" + o[0] + " " + o[1] + ")" }); }
    function lockD(p, x, y, col) {
      var lg = mk(p, "g", { transform: "translate(" + x + " " + y + ")" });
      var sh = mk(lg, "g", {});
      ln(ctx, sh, "M-11 -14V-26A11 11 0 0 1 11 -26V-14", col);
      mk(lg, "path", { d: rr(-21, -14, 42, 34, 6), fill: ctx.c("surface"), stroke: ctx.c(col), "stroke-width": 3, "stroke-linejoin": "round" });
      mk(lg, "circle", { cx: 0, cy: 3, r: 3, fill: ctx.c(col), stroke: "none" });
      return { g: lg, shackle: sh };
    }
    function want(n) { return !only || only === n; }
    if (want("channel")) {
      var cg = sub("channel");
      var line = ln(ctx, cg, "M12 40H548", "accent");
      var ea = circ(ctx, cg, 8, 40, 6, "accent"), eb = circ(ctx, cg, 552, 40, 6, "accent");
      var lk = lockD(cg, 280, 40, "accent");
      var copy = mk(cg, "g", { opacity: 0 });
      mk(copy, "path", { d: rr(-16, -21, 32, 42, 6), fill: ctx.c("surface"), stroke: ctx.c("accent3"), "stroke-width": 3, "stroke-linejoin": "round" });
      ln(ctx, copy, "M-8 -8H8M-8 2H8M-8 12H2", "muted");
      out.channel = {
        g: cg, line: line, lock: lk.g, copy: copy, A: [0, 40], B: [560, 40],
        drawIn: function (t, dur) {
          Loom.drive(function (e) { dp(ea, e * 6); dp(line, e); dp(eb, (e - 0.9) * 10); lk.g.setAttribute("opacity", e < 0.5 ? 0 : Math.min(1, (e - 0.5) * 6)); }, t, dur || 1.0, "move");
        },
        travel: function (t, dur) {
          Loom.drive(function (e) { copy.setAttribute("transform", "translate(" + (8 + 544 * e).toFixed(1) + " 40)"); copy.setAttribute("opacity", e <= 0 || e >= 1 ? 0 : 1); }, t, dur || 1.0, "move");
        }
      };
    }
    if (want("folder")) {
      var fg = sub("folder");
      var fb = fg;
      mk(fb, "path", { d: folderD(300, 240), fill: ctx.c("surface"), stroke: "none" });
      ln(ctx, fb, folderD(300, 240), "ink");
      var fmid = mk(fg, "g", {});
      mk(fg, "path", { d: rr(0, 80, 300, 160, 16), fill: ctx.c("surface"), stroke: "none" });
      ln(ctx, fg, rr(0, 80, 300, 160, 16), "ink");
      var fl = lockD(fg, 150, 165, "accent3");
      fl.shackle.setAttribute("transform", "translate(0 -12)");
      out.folder = {
        g: fg, mid: fmid, lock: fl.g, slot: [150, 120],
        close: function (t, dur) { Loom.drive(function (e) { fl.shackle.setAttribute("transform", "translate(0 " + (-12 * (1 - e)).toFixed(2) + ")"); }, t, dur || 0.4, "move"); }
      };
    }
    if (want("shredder")) {
      var sg = sub("shredder");
      var PY = 130;
      var page = mk(sg, "g", { transform: "translate(95 -130)", opacity: 0 });
      mk(page, "path", { d: rr(0, PY, 110, 110, 8), fill: ctx.c("surface"), stroke: ctx.c("accent3"), "stroke-width": 3, "stroke-linejoin": "round" });
      ln(ctx, page, "M20 " + (PY + 30) + "H90M20 " + (PY + 52) + "H90M20 " + (PY + 74) + "H64", "muted");
      page.setAttribute("transform", "translate(95 -130)");
      var body = mk(sg, "g", { transform: "translate(0 " + PY + ")" });
      mk(body, "path", { d: rr(0, 0, 300, 90, 16), fill: ctx.c("surface"), stroke: "none" });
      ln(ctx, body, rr(0, 0, 300, 90, 16), "ink");
      ln(ctx, body, "M50 30H250", "ink");
      circ(ctx, body, 262, 64, 6, "ink");
      ln(ctx, body, "M30 90L46 260H254L270 90", "ink");
      var strips = [];
      for (var s = 0; s < 7; s++) strips.push(ln(ctx, body, "M" + (74 + s * 25) + " 120V" + (190 + (s % 3) * 24), "accent3"));
      strips.forEach(function (p) { dp(p, 0); });
      out.shredder = {
        g: sg, page: page, strips: strips, slit: [150, PY + 30],
        feed: function (t, dur) {
          Loom.drive(function (e) { page.setAttribute("transform", "translate(95 " + (-130 + 80 * e).toFixed(2) + ")"); page.setAttribute("opacity", e <= 0 ? 0 : e > 0.7 ? Math.max(0, 1 - (e - 0.7) / 0.3) : 1); }, t, dur || 1.0, "move");
        },
        shred: function (t, dur) {
          strips.forEach(function (p, k) { Loom.drive(function (e) { dp(p, e); }, t + k * 0.08, dur || 0.5, "move"); });
        }
      };
      page.setAttribute("transform", "translate(95 -130)");
    }
    if (want("file")) {
      var ig = sub("file");
      var fd = "M0 16Q0 0 16 0H80L120 40V134Q120 150 104 150H16Q0 150 0 134Z";
      var ghost = mk(ig, "g", { opacity: 0 });
      ln(ctx, ghost, fd, "muted", { dash: "8 8" });
      var solid = mk(ig, "g", {});
      mk(solid, "path", { d: fd, fill: ctx.c("surface"), stroke: "none" });
      var sp = [ln(ctx, solid, fd, "ink"), ln(ctx, solid, "M80 0V40H120", "ink"), ln(ctx, solid, "M24 78H96M24 100H96M24 122H70", "muted")];
      out.file = {
        g: ig, solid: solid, ghost: ghost,
        erase: function (t, dur) {
          Loom.drive(function (e) {
            ghost.setAttribute("opacity", e > 0 ? 0.7 : 0);
            solid.setAttribute("opacity", e >= 1 ? 0 : 1);
            sp.forEach(function (p) { p.setAttribute("stroke-dasharray", "1 2"); p.setAttribute("stroke-dashoffset", String(-e)); });
          }, t, dur || 0.6, "move");
        },
        gone: function (t, dur) { fade(ghost, t, dur || 0.4, 0.7, 0); }
      };
    }
    return out;
  };
  // DOOR: building front, 900 x 560 natural, no fill (drawn around an item already on the page). Doorway at the lower right.
  Loom.lesson.door = function (ctx, parent, opts) {
    opts = opts || {};
    var W = 900, H = 560, DH = 230;
    var pl = place(parent, opts, W, H), g = pl.g;
    var roof = ln(ctx, g, "M-24 60L450 0L924 60", "ink");
    var walls = ln(ctx, g, "M" + W + " " + (H - DH) + "V60H0V" + H + "H" + W, "ink");
    var thr = ln(ctx, g, "M" + W + " " + (H - DH) + "V" + H, "accent2");
    var lab = mk(g, "g", { opacity: 0 });
    txt(ctx, lab, "Stays inside", W - 340, 110, 300, 56, { align: "center" });
    var A = { floor: [W - 150, H], threshold: [W, H - DH / 2], door_top: [W, H - DH], label: [W - 190, 138] };
    return {
      g: g, roof: roof, walls: walls, threshold: thr, stays: lab, scale: pl.sc, w: W * pl.sc, h: H * pl.sc, natural: { w: W, h: H }, floorY: H, thresholdX: W,
      anchor: function (n) { var p = A[n]; return { x: (opts.x || 0) + p[0] * pl.sc, y: (opts.y || 0) + p[1] * pl.sc }; },
      drawIn: function (t, dur) {
        dur = dur || 1.0;
        Loom.drive(function (e) { dp(walls, e / 0.8); dp(roof, (e - 0.6) / 0.4); dp(thr, (e - 0.8) / 0.2); }, t, dur, "move");
      },
      thicken: function (t, dur) { Loom.drive(function (e) { thr.setAttribute("stroke-width", 3 + 5 * e); }, t, dur || 0.4, "move"); },
      showLabel: function (t, dur) { fade(lab, t, dur || 0.4, 0, 1); },
      setState: function () {}
    };
  };
  /*END*/
})();
