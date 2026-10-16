Loom.lesson = Loom.lesson || {};
(function () {
  "use strict";
  // HTTPS lesson kit. Parts: padlock, packet, key_slots, cert_card, address_bar, path_board.
  // Every part draws at its natural size at (0,0) of `parent`, returns a handle with setState(name, t, dur?).
  const sv = (tag, a, p) => Loom.svg(tag, a, p);
  const G = (p, a) => sv("g", a || {}, p);
  const n2 = (v) => Math.round(v * 100) / 100;
  const cl = (v, a, b) => Math.max(a == null ? 0 : a, Math.min(b == null ? 1 : b, v));
  const sm = (v) => { v = cl(v); return v * v * (3 - 2 * v); };
  const op = (g, v) => g.setAttribute("opacity", n2(cl(v)));
  const tf = (g, s) => g.setAttribute("transform", s);
  let UID = 0;

  function machine(defaults, render, label) {
    const key = (label || "m") + "_" + (++UID);
    let cur = Object.assign({}, defaults);
    render(cur);
    return {
      cur: () => Object.assign({}, cur),
      go(t, target, dur, ease) {
        const from = Object.assign({}, cur), to = Object.assign({}, cur, target);
        cur = to;
        const d = dur == null ? 0.02 : Math.max(0.02, dur);
        Loom.drive((e) => {
          const v = {};
          for (const k in to) v[k] = from[k] + (to[k] - from[k]) * e;
          render(v);
        }, t, d, ease || "editorial", { key });
      },
      bump(t, dur, name, fn) {
        const base = Object.assign({}, cur);
        Loom.drive((e) => { const v = Object.assign({}, base); v[name] = fn(e); render(v); }, t, Math.max(0.05, dur), "linear", { key });
      },
    };
  }
  function setter(M, STATES) {
    return function (name, t, dur) {
      const tgt = {};
      let d = dur;
      (Array.isArray(name) ? name : [name]).forEach((nm) => {
        if (nm && typeof nm === "object") { Object.assign(tgt, nm); return; }
        const s = STATES[nm];
        if (!s) throw new Error("unknown state: " + nm);
        Object.assign(tgt, s.v);
        if (d == null && s.dur != null) d = s.dur;
      });
      M.go(t, tgt, d);
    };
  }
  function startVars(STATES, base, init) {
    const v = Object.assign({}, base);
    if (init == null) return v;
    (Array.isArray(init) ? init : [init]).forEach((nm) => {
      if (nm && typeof nm === "object") Object.assign(v, nm);
      else if (STATES[nm]) Object.assign(v, STATES[nm].v);
    });
    return v;
  }
  const rngFn = (seed) => {
    const R = Loom.rng(seed);
    if (typeof R === "function") return R;
    let s = 1234567;
    for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
    return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };

  // ============================================================================================
  // padlock: natural 100 x 130.
  // ============================================================================================
  function lockBuild(ctx, parent) {
    const c = ctx.c;
    const g = G(parent);
    const mk = (tok) => {
      const gg = G(g);
      const sh = G(gg);
      sv("path", { d: "M 26 62 V 40 A 24 24 0 0 1 74 40 V 62", fill: "none", stroke: c(tok), "stroke-width": 14, "stroke-linecap": "round", "stroke-linejoin": "round" }, sh);
      sv("rect", { x: 0, y: 58, width: 100, height: 72, rx: 14, fill: c(tok) }, gg);
      sv("circle", { cx: 50, cy: 88, r: 9, fill: c("surface") }, gg);
      sv("rect", { x: 46, y: 92, width: 8, height: 20, rx: 4, fill: c("surface") }, gg);
      return { g: gg, sh };
    };
    const neutral = mk("muted"), blue = mk("accent");
    const render = (v) => {
      const ang = (1 - cl(v.lock)) * 30;
      neutral.sh.setAttribute("transform", `rotate(${n2(ang)} 74 62)`);
      blue.sh.setAttribute("transform", `rotate(${n2(ang)} 74 62)`);
      op(neutral.g, 1 - cl(v.blue));
      op(blue.g, v.blue);
      tf(g, `translate(50 80) scale(${n2(1 + 0.14 * v.pulse)}) translate(-50 -80)`);
    };
    return { g, render };
  }
  const LOCK_STATES = {
    open: { v: { lock: 0, blue: 0 } },
    closed: { v: { lock: 1, blue: 1 }, dur: 0.5 },
    closed_neutral: { v: { lock: 1, blue: 0 }, dur: 0.5 },
  };
  Loom.lesson.padlock = function (ctx, parent, opts) {
    opts = opts || {};
    const root = G(parent);
    const s = opts.w ? opts.w / 100 : (opts.scale || 1);
    tf(root, `scale(${n2(s)})`);
    const L = lockBuild(ctx, root);
    const M = machine(startVars(LOCK_STATES, { lock: 0, blue: 0, pulse: 0 }, opts.state || "open"), L.render, "padlock");
    return {
      g: root, w: 100, h: 130,
      setState(name, t, dur) {
        if (name === "pulse") { M.bump(t, dur || 0.6, "pulse", (e) => Math.sin(Math.PI * e)); return; }
        setter(M, LOCK_STATES)(name, t, dur);
      },
      pulse(t, dur) { M.bump(t, dur || 0.6, "pulse", (e) => Math.sin(Math.PI * e)); },
    };
  };

  // ============================================================================================
  // packet: natural 200 x 120 card <-> six angular blocks (240 x 60 row, same centre).
  // ============================================================================================
  function valueMark(ctx, p, text, x, y, w, h, align) {
    const c = ctx.c, g = G(p);
    if (text && text.charAt(0) !== "@") {
      ctx.kit.text(g, text, { role: "caption", size: h >= 50 ? 28 : 20, weight: 500, color: "ink", x, y, w, h, valign: "middle", align: align || "left" });
      return g;
    }
    const cy = y + h / 2;
    if (text === "@dots") {
      const r = h >= 50 ? 6 : 4, gap = h >= 50 ? 20 : 10, n = h >= 50 ? 6 : 4, tot = (n - 1) * gap;
      const x0 = align === "right" ? x + w - tot - r : x + r;
      for (let i = 0; i < n; i++) sv("circle", { cx: n2(x0 + i * gap), cy, r, fill: c("ink") }, g);
      return g;
    }
    const bh = h >= 50 ? 14 : 10, bw = h >= 50 ? 170 : Math.min(w, 70);
    const bx = align === "right" ? x + w - bw : x;
    sv("rect", { x: n2(bx), y: n2(cy - bh / 2), width: bw, height: bh, rx: bh / 2, fill: c("ink"), opacity: 0.8 }, g);
    return g;
  }
  function packetBuild(ctx, parent, O) {
    O = O || {};
    const K = ctx.kit, c = ctx.c;
    const g = G(parent);
    const outline = G(g);
    sv("rect", { x: -4, y: -4, width: 208, height: 128, rx: 18, fill: "none", stroke: c("accent"), "stroke-width": 4 }, outline);
    const card = G(g);
    K.rect(card, 0, 0, 200, 120, { fill: "surface", r: 14, stroke: "surface2", sw: 2 });
    const form = G(g), reply = G(g);
    const row = (p, y, label, value, lw, vw, lweight) => {
      K.rect(p, 10, y, 180, 44, { fill: "field2", r: 6, shadow: false });
      K.text(p, label, { role: "caption", size: 24, weight: lweight, color: lweight === 700 ? "muted" : "ink", x: 16, y, w: lw, h: 44, valign: "middle", align: "left" });
      valueMark(ctx, p, value, 180 - vw, y, vw, 44, "right");
    };
    row(form, 12, "User", O.userText || "@bars", 70, 80, 700);
    row(form, 64, "Password", O.passText || "@dots", 120, 50, 700);
    K.rect(reply, 10, 12, 180, 44, { fill: "field2", r: 6, shadow: false });
    valueMark(ctx, reply, O.replyText1 || "@bars", 20, 12, 160, 44, "left");
    K.rect(reply, 10, 64, 180, 44, { fill: "field2", r: 6, shadow: false });
    valueMark(ctx, reply, O.replyText2 || "@bars", 20, 64, 160, 44, "left");
    const rnd = rngFn("https-noise");
    const blocks = [];
    const tones = ["muted", "accent3", "muted", "accent3", "accent3", "muted"];
    const markTones = ["surface2", "ink", "surface", "line"];
    for (let i = 0; i < 6; i++) {
      const b = G(g);
      const hw = 17.5, hh = 30;
      const a = 5 + rnd() * 6, bb = 5 + rnd() * 6, cc = 5 + rnd() * 6, d = 5 + rnd() * 6;
      const pts = [[-hw + a, -hh], [hw - bb, -hh], [hw, -hh + bb], [hw, hh - cc], [hw - cc, hh], [-hw + d, hh], [-hw, hh - d], [-hw, -hh + a]];
      sv("polygon", { points: pts.map((q) => n2(q[0]) + "," + n2(q[1])).join(" "), fill: c(tones[i]) }, b);
      for (let k = 0; k < 6; k++) {
        const w = 4 + rnd() * 9, h = 3 + rnd() * 8;
        const x = -hw + 5 + rnd() * (2 * hw - 10 - w), y = -hh + 8 + rnd() * (2 * hh - 16 - h);
        sv("rect", { x: n2(x), y: n2(y), width: n2(w), height: n2(h), fill: c(markTones[Math.floor(rnd() * 4)]), opacity: 0.85 }, b);
      }
      blocks.push(b);
    }
    const render = (v) => {
      const p = cl(v.p), r = cl(v.reply);
      const fo = 1 - sm(p / 0.45);
      op(form, fo * (1 - r)); op(reply, fo * r);
      const sc = `translate(100 60) scale(1 ${n2(1 - 0.5 * sm(p / 0.7))}) translate(-100 -60)`;
      tf(card, sc); tf(form, sc); tf(reply, sc);
      op(card, 1 - sm((p - 0.25) / 0.4));
      op(outline, (v.ol || 0) * (1 - sm(p / 0.3)));
      blocks.forEach((b, i) => {
        const pi = sm((p - 0.28 - i * 0.04) / 0.5);
        const col = i % 3, rw = Math.floor(i / 3);
        const x0 = 100 + (col - 1) * 58, y0 = 60 + (rw - 0.5) * 44;
        const x1 = 100 + (i - 2.5) * 41, y1 = 60;
        tf(b, `translate(${n2(x0 + (x1 - x0) * pi)} ${n2(y0 + (y1 - y0) * pi)}) scale(${n2(0.8 + 0.2 * pi)} ${n2(0.5 + 0.5 * pi)})`);
        op(b, pi * (1 - 0.45 * cl(v.grey)));
      });
    };
    return { g, render };
  }
  const PKT_STATES = {
    readable: { v: { p: 0, reply: 0 } },
    morphing: { v: { p: 1 }, dur: 0.9 },
    scrambled: { v: { p: 1 } },
    reply_readable: { v: { p: 0, reply: 1 } },
    reply_scrambled: { v: { p: 1, reply: 1 } },
    unmorphing: { v: { p: 0 }, dur: 0.9 },
    greyed: { v: { grey: 1 }, dur: 0.4 },
    outlined: { v: { ol: 1 }, dur: 0.3 },
    unoutlined: { v: { ol: 0 }, dur: 0.3 },
  };
  Loom.lesson.packet = function (ctx, parent, opts) {
    opts = opts || {};
    const root = G(parent);
    const s = opts.w ? opts.w / 200 : (opts.scale || 1);
    tf(root, `scale(${n2(s)})`);
    const P = packetBuild(ctx, root, opts);
    const M = machine(startVars(PKT_STATES, { p: 0, reply: 0, grey: 0, ol: 0 }, opts.state || "readable"), P.render, "packet");
    const set = setter(M, PKT_STATES);
    return {
      g: root, w: 200, h: 120, scrambledW: 240, scrambledH: 60,
      setState: set,
      morph(t, dur) { set("morphing", t, dur); },
      unmorph(t, dur) { set("unmorphing", t, dur); },
      render: (v) => P.render(Object.assign({ p: 0, reply: 0, grey: 0, ol: 0 }, v)),
    };
  };

  // ============================================================================================
  // key_slots: ONE swap slot, natural 80 x 80.
  // ============================================================================================
  function keyGlyph(ctx, parent) {
    const c = ctx.c, g = G(parent), f = c("accent");
    sv("circle", { cx: 25, cy: 40, r: 13, fill: f }, g);
    sv("circle", { cx: 25, cy: 40, r: 5, fill: c("surface2") }, g);
    sv("rect", { x: 36, y: 36.5, width: 32, height: 7, rx: 3, fill: f }, g);
    sv("rect", { x: 54, y: 42, width: 6, height: 11, rx: 2, fill: f }, g);
    sv("rect", { x: 63, y: 42, width: 6, height: 8, rx: 2, fill: f }, g);
    return g;
  }
  const SLOT_STATES = {
    empty: { v: { key: 0, lens: 0 }, dur: 0.3 },
    browser_server_filled: { v: { key: 1 }, dur: 0.45 },
    lens_active: { v: { lens: 1 }, dur: 0.4 },
    lens_off: { v: { lens: 0 }, dur: 0.4 },
  };
  Loom.lesson.key_slots = function (ctx, parent, opts) {
    opts = opts || {};
    const c = ctx.c;
    const root = G(parent);
    const s = opts.w ? opts.w / 80 : (opts.scale || 1);
    tf(root, `scale(${n2(s)})`);
    const inner = G(root);
    sv("rect", { x: 0, y: 0, width: 80, height: 80, rx: 10, fill: c("surface2") }, inner);
    sv("rect", { x: 1.5, y: 1.5, width: 77, height: 77, rx: 9, fill: "none", stroke: c("line"), "stroke-width": 3, "stroke-dasharray": "9 7", "stroke-linecap": "round" }, inner);
    const lens = G(inner);
    sv("ellipse", { cx: 40, cy: 40, rx: 30, ry: 68, fill: c("accent"), "fill-opacity": 0.16, stroke: c("accent"), "stroke-width": 4 }, lens);
    const keyG = G(inner);
    keyGlyph(ctx, keyG);
    const render = (v) => {
      const sh = 8 * Math.sin(cl(v.shake) * Math.PI * 6) * (1 - cl(v.shake));
      tf(inner, `translate(${n2(40 + sh)} 40) scale(${n2(1 + 0.12 * v.pulse)}) translate(-40 -40)`);
      op(lens, v.lens);
      op(keyG, v.key);
      tf(keyG, `translate(0 ${n2(-34 * (1 - cl(v.key)))})`);
    };
    const M = machine(startVars(SLOT_STATES, { key: 0, lens: 0, pulse: 0, shake: 0 }, opts.state || "empty"), render, "slot");
    const set = setter(M, SLOT_STATES);
    return {
      g: root, w: 80, h: 80, lens, key: keyG,
      setState(name, t, dur) {
        if (name === "watcher_shake") { M.bump(t, dur || 0.6, "shake", (e) => e); return; }
        if (name === "pulse") { M.bump(t, dur || 0.6, "pulse", (e) => Math.sin(Math.PI * e)); return; }
        if (name === "key_glow") { M.bump(t, dur || 0.7, "lens", (e) => Math.sin(Math.PI * e)); return; }
        set(name, t, dur);
      },
      shake(t, dur) { M.bump(t, dur || 0.6, "shake", (e) => e); },
      pulse(t, dur) { M.bump(t, dur || 0.6, "pulse", (e) => Math.sin(Math.PI * e)); },
      glow(t, dur) { M.bump(t, dur || 0.7, "lens", (e) => Math.sin(Math.PI * e)); },
    };
  };

  // ============================================================================================
  // cert_card: natural 380 x 280. The badge (120 x 120) lives at the element's (0,0).
  // ============================================================================================
  const CERT_RESET = { seal: 0, t1: 0, t2: 0, t3: 0, range: 0, red: 0, other: 0, shrink: 0, bt1: 1, bt2: 1, bt3: 1, dash: 0 };
  const CERT_STATES = {
    arriving: { v: Object.assign({}, CERT_RESET) },
    full: { v: Object.assign({}, CERT_RESET, { seal: 1 }), dur: 0.4 },
    tick1: { v: { seal: 1, t1: 1 }, dur: 0.35 },
    tick2: { v: { seal: 1, t1: 1, t2: 1, range: 0.62 }, dur: 0.5 },
    tick3: { v: { seal: 1, t1: 1, t2: 1, t3: 1, range: 0.62 }, dur: 0.35 },
    badge: { v: { seal: 1, t1: 1, t2: 1, t3: 1, range: 0.62, shrink: 1, bt1: 1, bt2: 1, bt3: 1 }, dur: 0.8 },
    name_red: { v: { seal: 1, t1: 1, t2: 1, t3: 1, range: 0.62, red: 1, other: 1, shrink: 0 }, dur: 0.45 },
    badge_dashed: { v: { shrink: 1, dash: 1 }, dur: 0.4 },
    badge_solid: { v: { dash: 0 }, dur: 0.4 },
  };
  Loom.lesson.cert_card = function (ctx, parent, opts) {
    opts = opts || {};
    const K = ctx.kit, c = ctx.c;
    const root = G(parent);
    const s = opts.w ? opts.w / 380 : (opts.scale || 1);
    tf(root, `scale(${n2(s)})`);
    const cardG = G(root), badgeG = G(root);
    K.rect(cardG, 0, 0, 380, 280, { fill: "surface", r: 20, stroke: "surface2", sw: 2 });
    K.text(cardG, "Certificate", { role: "lead", size: 36, weight: 700, color: "ink", x: 24, y: 14, w: 250, h: 46, valign: "middle" });
    K.rect(cardG, 24, 64, 56, 5, { fill: "accent", r: 3, shadow: false });
    const rowTop = (i) => 78 + i * 62;
    for (let i = 1; i < 3; i++) K.rect(cardG, 24, rowTop(i) - 3, 332, 2, { fill: "surface2", r: 1, shadow: false });
    const lab = (i, str) => K.text(cardG, str, { role: "caption", size: 22, weight: 500, color: "muted", x: 24, y: rowTop(i) - 2, w: 250, h: 30, valign: "middle" });
    lab(0, "Site name"); lab(1, "Valid until"); lab(2, "Issued by");
    const nameN = G(cardG), nameO = G(cardG);
    const nameText = K.text(nameN, "accounts.example", { role: "label", size: 26, weight: 700, color: "ink", x: 24, y: rowTop(0) + 24, w: 290, h: 38, valign: "middle" });
    const otherText = K.text(nameO, "other-site.example", { role: "label", size: 26, weight: 700, color: "neg", x: 24, y: rowTop(0) + 24, w: 290, h: 38, valign: "middle" });
    K.rect(cardG, 24, rowTop(1) + 36, 250, 14, { fill: "surface2", r: 6, shadow: false });
    const rangeG = G(cardG);
    const rangeRect = K.rect(rangeG, 24, rowTop(1) + 36, 250, 14, { fill: "accent3", r: 6, shadow: false });
    const rangeClip = sv("clipPath", { id: "certrange_" + (++UID) }, root);
    const rangeClipRect = sv("rect", { x: 24, y: rowTop(1) + 30, width: 0, height: 26 }, rangeClip);
    rangeG.setAttribute("clip-path", "url(#" + rangeClip.getAttribute("id") + ")");
    K.text(cardG, "Example Authority", { role: "label", size: 24, weight: 700, color: "ink", x: 24, y: rowTop(2) + 24, w: 240, h: 38, valign: "middle" });
    const redG = G(cardG);
    sv("rect", { x: 14, y: rowTop(0) - 4, width: 352, height: 60, rx: 10, fill: "none", stroke: c("neg"), "stroke-width": 3 }, redG);
    const tickCY = (i) => rowTop(i) + 31;
    const ticks = [0, 1, 2].map((i) => { const gg = G(cardG); K.mark(gg, "yes", 348, tickCY(i), 32); return gg; });
    const crossG = G(cardG);
    K.mark(crossG, "no", 348, tickCY(0), 32);
    const sealG = G(cardG);
    sv("circle", { cx: 292, cy: 233, r: 24, fill: c("accent2") }, sealG);
    sv("circle", { cx: 292, cy: 233, r: 19, fill: "none", stroke: c("onAccent"), "stroke-width": 2, opacity: 0.7 }, sealG);
    K.icon(sealG, "badge-check", { x: 278, y: 219, size: 28, color: "onAccent" });
    K.rect(badgeG, 0, 0, 120, 120, { fill: "surface", r: 14, stroke: "surface2", sw: 2 });
    const bt = [0, 1, 2].map((i) => {
      const gg = G(badgeG);
      K.mark(gg, "yes", 30, 28 + i * 32, 24);
      return gg;
    });
    for (let i = 0; i < 3; i++) K.rect(badgeG, 52, 24 + i * 32, 52, 8, { fill: "surface2", r: 4, shadow: false });
    const dashG = G(badgeG);
    sv("rect", { x: -6, y: -6, width: 132, height: 132, rx: 18, fill: "none", stroke: c("line"), "stroke-width": 3, "stroke-dasharray": "9 7", "stroke-linecap": "round" }, dashG);
    const pop = (g, cx, cy, v, from) => { op(g, v); tf(g, `translate(${cx} ${cy}) scale(${n2(from + (1 - from) * cl(v))}) translate(${-cx} ${-cy})`); };
    const render = (v) => {
      const sh = cl(v.shrink);
      tf(cardG, `scale(${n2(1 - sh * (1 - 0.316))})`);
      op(cardG, 1 - sm((sh - 0.35) / 0.45));
      op(badgeG, sm((sh - 0.55) / 0.45));
      pop(sealG, 292, 233, v.seal, 0.6);
      const red = cl(v.red);
      pop(ticks[0], 348, tickCY(0), cl(v.t1) * (1 - red), 0.5);
      pop(ticks[1], 348, tickCY(1), v.t2, 0.5);
      pop(ticks[2], 348, tickCY(2), v.t3, 0.5);
      op(crossG, red); op(redG, red);
      op(nameN, 1 - cl(v.other)); op(nameO, v.other);
      rangeClipRect.setAttribute("width", n2(250 * cl(v.range)));
      bt.forEach((g, i) => op(g, 0.18 + 0.82 * cl(v["bt" + (i + 1)])));
      op(dashG, v.dash);
    };
    const M = machine(startVars(CERT_STATES, Object.assign({}, CERT_RESET), opts.state || "arriving"), render, "cert");
    const set = setter(M, CERT_STATES);
    return {
      g: root, w: 380, h: 280, badgeW: 120, badgeH: 120, card: cardG, badge: badgeG, nameText, otherText, seal: sealG, ticks, rangeRect,
      setState(name, t, dur) {
        if (name === "badge_relit") {
          const total = dur || 1.8, st = total / 3;
          M.go(t, { shrink: 1, seal: 1, bt1: 0, bt2: 0, bt3: 0 }, 0.02);
          for (let i = 1; i <= 3; i++) M.go(t + 0.2 + (i - 1) * st, { ["bt" + i]: 1 }, 0.3);
          return;
        }
        set(name, t, dur);
      },
    };
  };

  // ============================================================================================
  // address_bar: natural 1600 x 120; the warning slot hangs below (x140 y150 900 x 80).
  // ============================================================================================
  const BAR_STATES = {
    plain: { v: { hl: 0, slot: 0, ul: 0 } },
    name_underline: { v: { ul: 1 }, dur: 0.6 },
    name_highlight: { v: { hl: 99 }, dur: 2.2 },
    warning_slot_empty: { v: { slot: 1 }, dur: 0.5 },
  };
  Loom.lesson.address_bar = function (ctx, parent, opts) {
    opts = opts || {};
    const K = ctx.kit, c = ctx.c;
    const NAME = opts.text || "accounts.example";
    const CW = 33.6, X0 = 140, FS = 56;
    const N = NAME.length;
    BAR_STATES.name_highlight.v.hl = N + 1.5;
    const root = G(parent);
    const s = opts.w ? opts.w / 1600 : (opts.scale || 1);
    tf(root, `scale(${n2(s)})`);
    K.rect(root, 0, 0, 1600, 120, { fill: "surface", r: 60, stroke: "surface2", sw: 2 });
    const lockHost = G(root, { transform: "translate(34 13) scale(0.72)" });
    const lock = Loom.lesson.padlock(ctx, lockHost, { state: opts.lock || "closed" });
    sv("line", { x1: 126, y1: 30, x2: 126, y2: 90, stroke: c("surface2"), "stroke-width": 3, "stroke-linecap": "round" }, root);
    const ulRect = sv("rect", { x: X0, y: 98, width: N * CW, height: 4, rx: 2, fill: c("accent") }, root);
    const hl = [], chars = [];
    for (let i = 0; i < N; i++) hl.push(sv("rect", { x: n2(X0 + i * CW - 1), y: 28, width: n2(CW + 2), height: 68, rx: 6, fill: c("accent") }, root));
    for (let i = 0; i < N; i++) {
      const t = sv("text", { x: n2(X0 + i * CW), y: 80, "font-family": "JetBrains Mono, monospace", "font-size": FS, "font-weight": 700, fill: c("ink") }, root);
      t.textContent = NAME[i];
      chars.push(t);
    }
    K.icon(root, "ellipsis", { x: 1528, y: 40, size: 40, color: "muted" });
    const slot = G(root);
    sv("rect", { x: X0 + 1.5, y: 151.5, width: 897, height: 77, rx: 10, fill: c("field2"), stroke: c("line"), "stroke-width": 3, "stroke-dasharray": "10 8", "stroke-linecap": "round" }, slot);
    K.text(slot, "Certificate warning: none", { role: "label", size: 30, weight: 500, color: "muted", x: X0 + 28, y: 150, w: 840, h: 80, valign: "middle" });
    const render = (v) => {
      for (let i = 0; i < N; i++) {
        const a = cl(v.hl - i), lead = 1 - cl((v.hl - i - 1) / 1.5);
        op(hl[i], a * (0.14 + 0.26 * lead));
      }
      op(slot, v.slot);
      ulRect.setAttribute("opacity", n2(0.45 * cl(v.ul)));
    };
    const M = machine(startVars(BAR_STATES, { hl: 0, slot: 0, ul: 0 }, opts.state || "plain"), render, "bar");
    const set = setter(M, BAR_STATES);
    return {
      g: root, w: 1600, h: 120, padlock: lock, chars, highlights: hl, slot,
      charX: (i) => X0 + i * CW, charW: CW, textX: X0, baseline: 80, fontSize: FS,
      setState(name, t, dur) { if (name === "pulse") { lock.pulse(t, dur); return; } set(name, t, dur); },
      pulse(t, dur) { lock.pulse(t, dur); },
    };
  };

  // ============================================================================================
  // path_board: natural 1680 x 640. Origin = station (120,160).
  // ============================================================================================
  function unit3(ctx, p, x, y, w, h, gap) {
    const c = ctx.c;
    for (let i = 0; i < 3; i++) {
      const yy = y + i * (h + gap);
      sv("rect", { x, y: yy, width: w, height: h, rx: 10, fill: c("accent3") }, p);
      sv("circle", { cx: x + 26, cy: yy + h / 2, r: 6, fill: c("surface") }, p);
      sv("circle", { cx: x + 50, cy: yy + h / 2, r: 6, fill: c("surface"), opacity: 0.55 }, p);
      for (let k = 0; k < 3; k++) sv("line", { x1: x + w - 80 + k * 24, y1: yy + h / 2 - 8, x2: x + w - 80 + k * 24, y2: yy + h / 2 + 8, stroke: c("surface"), "stroke-width": 3, "stroke-linecap": "round", opacity: 0.5 }, p);
    }
  }
  function serverWide(ctx, parent) {
    const K = ctx.kit;
    const g = G(parent);
    K.rect(g, 0, 0, 420, 200, { fill: "surface", r: 20, stroke: "surface2", sw: 2 });
    K.text(g, "accounts.example", { role: "label", size: 28, weight: 700, color: "ink", x: 24, y: 12, w: 372, h: 44, valign: "middle" });
    unit3(ctx, g, 24, 70, 150, 34, 8);
    return { g, packetSlot: { x: 200, y: 66 } };
  }
  const BOARD_BASE = { trVd: 0, press: 0, hi: 0, trR: 0, trV: 0, trN: 0, dark: 0, tube: 0, dim: 0, eye: 1, look: 0, warn: 0 };
  const BOARD_STATES = {
    idle: { v: { press: 0, hi: 0, trR: 0, trV: 0, trN: 0, tube: 0, dim: 0 }, dur: 0.3 },
    submit_pressed: { v: { press: 1 }, dur: 0.25 },
    submit_released: { v: { press: 0 }, dur: 0.25 },
    tray_empty: { v: { trR: 0, trV: 0, trN: 0 }, dur: 0.3 },
    tray_readable: { v: { trR: 1, trV: 0, trN: 0 }, dur: 0.4 },
    tray_readable_soft: { v: { trR: 0.55, trV: 0, trN: 0 }, dur: 0.5 },
    tray_values: { v: { trR: 0, trV: 1, trN: 0, trVd: 0 }, dur: 0.4 },
    tray_values_dim: { v: { trR: 0, trV: 1, trN: 0, trVd: 1 }, dur: 0.5 },
    tray_noise: { v: { trR: 0, trV: 0, trN: 1 }, dur: 0.4 },
    dark_band: { v: { dark: 1 }, dur: 0.8 },
    light_band: { v: { dark: 0 }, dur: 0.8 },
    router_highlight: { v: { hi: 1 }, dur: 0.35 },
    router_normal: { v: { hi: 0 }, dur: 0.35 },
    watcher_closed: { v: { eye: 0.06, look: 0 }, dur: 0.3 },
    watcher_open: { v: { eye: 1, look: 0 }, dur: 0.5 },
    watcher_look: { v: { eye: 1, look: -1 }, dur: 0.5 },
    tube: { v: { tube: 1 }, dur: 0.6 },
    tube_off: { v: { tube: 0 }, dur: 0.4 },
    path_dim: { v: { dim: 1 }, dur: 0.5 },
    path_bright: { v: { dim: 0 }, dur: 0.5 },
    warning_strip: { v: { warn: 1 }, dur: 0.4 },
    warning_off: { v: { warn: 0 }, dur: 0.3 },
  };
  Loom.lesson.path_board = function (ctx, parent, opts) {
    opts = opts || {};
    const K = ctx.kit, c = ctx.c;
    const nm = (opts.name || "board") + "_";
    const root = G(parent);
    if (opts.only === "server") {
      const s0 = opts.w ? opts.w / 420 : (opts.scale || 1);
      tf(root, `scale(${n2(s0)})`);
      const S = serverWide(ctx, root);
      return { g: root, w: 420, h: 200, server: S.g, packetSlot: S.packetSlot, setState() {} };
    }
    const s = opts.w ? opts.w / 1680 : (opts.scale || 1);
    tf(root, `scale(${n2(s)})`);
    const addr = opts.addressText || "accounts.example";

    const PT = ctx.el(nm + "path", { x: 460, y: 300, w: 760, h: 40, kind: "connector", parent: root });
    const lineN = G(PT.inner), lineL = G(PT.inner), tubeG = G(PT.inner);
    sv("line", { x1: 0, y1: 20, x2: 760, y2: 20, stroke: c("line"), "stroke-width": 4, "stroke-linecap": "round" }, lineN);
    sv("line", { x1: 0, y1: 20, x2: 760, y2: 20, stroke: c("field2"), "stroke-width": 4, "stroke-linecap": "round" }, lineL);
    sv("rect", { x: 0, y: 2, width: 760, height: 36, rx: 18, fill: c("surface2"), stroke: c("line"), "stroke-width": 3 }, tubeG);

    const B = ctx.el(nm + "browser", { x: 0, y: 100, w: 460, h: 440, kind: "card", parent: root });
    K.rect(B.inner, 0, 0, 460, 440, { fill: "surface", r: 20 });
    sv("path", { d: "M 0 20 Q 0 0 20 0 H 440 Q 460 0 460 20 V 56 H 0 Z", fill: c("field2") }, B.inner);
    [30, 52, 74].forEach((x) => sv("circle", { cx: x, cy: 28, r: 6, fill: c("line"), opacity: 0.55 }, B.inner));
    K.rect(B.inner, 100, 6, 336, 44, { fill: "surface", r: 10, shadow: false });
    const addressText = K.text(B.inner, addr, { role: "caption", size: 22, weight: 500, color: "ink", x: 118, y: 12, w: 300, h: 32, valign: "middle" });
    const field = (y, label, value) => {
      K.text(B.inner, label, { role: "label", size: 26, weight: 500, color: "muted", x: 32, y: y - 42, w: 300, h: 40, valign: "middle" });
      K.rect(B.inner, 32, y, 396, 60, { fill: "field2", r: 6, shadow: false });
      return valueMark(ctx, B.inner, value, 50, y, 360, 60, "left");
    };
    const fUser = field(112, "User", opts.userText || "@bars");
    const fPass = field(226, "Password", opts.passText || "@dots");
    const submitG = G(B.inner);
    K.rect(submitG, 32, 322, 396, 58, { fill: "accent", r: 10, shadow: false });
    K.text(submitG, "Submit", { role: "label", size: 30, weight: 700, color: Loom.style.pickTokenOn("accent"), x: 32, y: 322, w: 396, h: 58, align: "center", valign: "middle" });
    const pressOv = sv("rect", { x: 32, y: 322, width: 396, height: 58, rx: 10, fill: c("ink") }, submitG);
    // warning strip (b14): a small outlined strip under Submit, only when asked for
    const warnG = G(B.inner);
    sv("path", { d: "M 44 388 H 416 Q 426 388 426 398 V 428 Q 426 438 416 438 H 44 Q 34 438 34 428 V 398 Q 34 388 44 388 Z", fill: c("surface"), stroke: c("neg"), "stroke-width": 3 }, warnG);
    K.text(warnG, "Certificate warning", { role: "label", size: 24, weight: 700, color: "neg", x: 44, y: 395, w: 372, h: 36, align: "center", valign: "middle" });

    const S = ctx.el(nm + "server", { x: 1220, y: 100, w: 460, h: 440, kind: "card", parent: root });
    if (opts.bleed !== false) S.inner.setAttribute("data-bleed", typeof opts.bleed === "string" ? opts.bleed : "0-9999");
    K.rect(S.inner, 0, 0, 460, 440, { fill: "surface", r: 20 });
    unit3(ctx, S.inner, 80, 40, 300, 64, 20);
    K.rect(S.inner, 32, 322, 396, 70, { fill: "field2", r: 10, shadow: false });
    K.text(S.inner, "accounts.example", { role: "label", size: 28, weight: 700, color: "ink", x: 32, y: 322, w: 396, h: 70, align: "center", valign: "middle" });

    const R = ctx.el(nm + "router", { x: 730, y: 250, w: 220, h: 140, kind: "node", parent: root });
    const hiRect = sv("rect", { x: -10, y: -10, width: 240, height: 160, rx: 22, fill: "none", stroke: c("accent"), "stroke-width": 5 }, R.inner);
    K.rect(R.inner, 0, 0, 220, 140, { fill: "accent3", r: 14 });
    for (let i = 0; i < 4; i++) sv("rect", { x: 30 + i * 42, y: 112, width: 28, height: 10, rx: 3, fill: c("surface"), opacity: 0.55 }, R.inner);
    const eyeG = G(R.inner);
    sv("path", { d: "M -56 0 Q 0 -46 56 0 Q 0 46 -56 0 Z", fill: c("surface") }, eyeG);
    const iris = G(eyeG);
    sv("circle", { cx: 0, cy: 0, r: 21, fill: c("ink") }, iris);
    sv("circle", { cx: -7, cy: -7, r: 5, fill: c("surface") }, iris);

    const T = ctx.el(nm + "tray", { x: 700, y: 390, w: 280, h: 250, kind: "card", parent: root });
    const stubN = G(T.inner), stubL = G(T.inner);
    sv("line", { x1: 140, y1: 0, x2: 140, y2: 40, stroke: c("line"), "stroke-width": 3, "stroke-linecap": "round" }, stubN);
    sv("line", { x1: 140, y1: 0, x2: 140, y2: 40, stroke: c("field2"), "stroke-width": 3, "stroke-linecap": "round" }, stubL);
    K.rect(T.inner, 0, 40, 280, 150, { fill: "surface", r: 14, stroke: "surface2", sw: 2 });
    const hint = G(T.inner);
    sv("rect", { x: 16, y: 56, width: 248, height: 118, rx: 10, fill: "none", stroke: c("line"), "stroke-width": 2, "stroke-dasharray": "9 7", opacity: 0.55 }, hint);
    const trayR = G(T.inner), trayV = G(T.inner), trayN = G(T.inner);
    const pr = packetBuild(ctx, G(trayR, { transform: "translate(40 55)" }));
    pr.render({ p: 0, reply: 0, grey: 0, ol: 0 });
    const pn = packetBuild(ctx, G(trayN, { transform: "translate(40 55)" }));
    pn.render({ p: 1, reply: 0, grey: 1, ol: 0 });
    const trayVs = G(trayV), trayVd = G(trayV);
    [20, 148].forEach((tx) => {
      Loom.lesson.path_board.valueToken(ctx, G(trayVs, { transform: "translate(" + tx + " 91)" }));
      Loom.lesson.path_board.valueToken(ctx, G(trayVd, { transform: "translate(" + tx + " 91)" }), true);
    });
    const serverTag = G(T.inner, { opacity: 0 });
    K.rect(serverTag, -50, 202, 380, 46, { fill: "accent3", r: 10, shadow: false });
    K.text(serverTag, "Server: accounts.example", { role: "label", size: 24, weight: 700, color: Loom.style.pickTokenOn("accent3"), x: -30, y: 202, w: 340, h: 46, align: "center", valign: "middle" });

    const render = (v) => {
      const p = cl(v.press);
      tf(submitG, `translate(230 351) scale(${n2(1 - 0.04 * p)}) translate(-230 -351)`);
      op(pressOv, 0.22 * p);
      op(warnG, v.warn);
      op(hiRect, v.hi);
      tf(eyeG, `translate(110 62) scale(1 ${n2(Math.max(0.06, cl(v.eye)))})`);
      tf(iris, `translate(${n2(16 * v.look)} 0)`);
      op(trayR, v.trR); op(trayV, v.trV); op(trayN, v.trN);
      op(trayVs, 1 - cl(v.trVd)); op(trayVd, cl(v.trVd));
      op(hint, 1 - Math.max(cl(v.trR), cl(v.trV), cl(v.trN)));
      const base = 1 - 0.5 * cl(v.dim), d = cl(v.dark), tb = cl(v.tube);
      op(lineN, (1 - d) * (1 - tb) * base); op(lineL, d * (1 - tb) * base); op(tubeG, tb * base);
      op(stubN, 1 - d); op(stubL, d);
    };
    const M = machine(startVars(BOARD_STATES, BOARD_BASE, opts.state || "idle"), render, "board");
    const set = setter(M, BOARD_STATES);
    return {
      g: root, w: 1680, h: 640,
      browser: B, server: S, path: PT, router: R, tray: T,
      eye: eyeG, iris, submit: submitG, addressText, fieldUser: fUser, fieldPass: fPass, warnStrip: warnG,
      trayReadable: trayR, trayValues: trayV, trayNoise: trayN, serverTag, hiRect,
      anchors: {
        origin: { x: 120, y: 160 },
        pathY: 320,
        formCenter: { x: 230, y: 340 },
        router: { x: 730, y: 250, w: 220, h: 140 },
        tray: { x: 700, y: 430, w: 280, h: 150 },
        trayCopy: { x: 740, y: 445 },
        slotBrowser: { x: 480, y: 280 }, slotServer: { x: 1120, y: 280 }, slotWatcher: { x: 990, y: 470 },
        serverCenter: { x: 1450, y: 320 },
      },
      toLocal: (x, y) => ({ x: x - 120, y: y - 160 }),
      setState: set,
      pulseRouter(t, dur) { M.bump(t, dur || 0.7, "hi", (e) => Math.sin(Math.PI * e)); },
    };
  };
  Loom.lesson.path_board.valueToken = function (ctx, parent, dim) {
    const g = G(parent);
    const fill = dim ? "surface2" : "accent3";
    ctx.kit.rect(g, 0, 0, 112, 48, { fill, r: 6, shadow: false, stroke: dim ? "line" : undefined, sw: 2 });
    ctx.kit.text(g, "Value", { role: "label", size: 26, weight: 700, color: dim ? "muted" : Loom.style.pickTokenOn("accent3"), x: 0, y: 0, w: 112, h: 48, align: "center", valign: "middle" });
    return g;
  };
})();
