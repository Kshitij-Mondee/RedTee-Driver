Loom.lesson = Loom.lesson || {};
(function () {
  const sv = (tag, a, p) => Loom.svg(tag, a, p);
  const clamp = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
  const ease = (p) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
  const lerp = (a, b, v) => a + (b - a) * v;
  const f2 = (n) => Number(n).toFixed(2);
  const fit = (o, w, h) => o.scale || ((o.w || o.h) ? Math.min(o.w ? o.w / w : 1e9, o.h ? o.h / h : 1e9) : 1);
  function rgb(h) {
    const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(String(h));
    return m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : null;
  }
  function mix(a, b, v) {
    const A = rgb(a), B = rgb(b);
    if (!A || !B) return v < 0.5 ? a : b;
    return "rgb(" + A.map((x, i) => Math.round(x + (B[i] - x) * v)).join(",") + ")";
  }
  function tx(p, s, x, y, size, fill, weight, fam, anchor) {
    const t = sv("text", { x: x, y: y, "font-family": fam || "Inter, sans-serif", "font-size": size, "font-weight": weight || 500, fill: fill, "text-anchor": anchor || "start" }, p);
    t.textContent = s;
    return t;
  }
  const MONO = "JetBrains Mono, monospace";
  function card(ctx, p, x, y, w, h, o) {
    o = o || {};
    const r = o.r == null ? 20 : o.r;
    const g = sv("g", {}, p);
    if (o.shadow !== false) sv("rect", { x: x, y: y + (o.dy || 10), width: w, height: h, rx: r, fill: ctx.c("shadow"), opacity: 0.08 }, g);
    const body = sv("rect", { x: x, y: y, width: w, height: h, rx: r, fill: ctx.c(o.fill || "surface") }, g);
    return { g: g, body: body };
  }

  // rig: named scalar tracks evaluated as a pure function of time; one tween per key re-renders
  function rig(ctx, label) {
    const P = {}, S = {}, subs = [], drv = { t: 0 };
    let cur = 0;
    const render = (x) => { cur = x; for (let i = 0; i < subs.length; i++) subs[i](x); };
    function ev(keys, i, x, init) {
      if (i < 0) return init;
      const k = keys[i];
      if (x < k.t) return ev(keys, i - 1, x, init);
      const b = ev(keys, i - 1, k.t, init);
      return b + (k.to - b) * ease(clamp((x - k.t) / k.dur));
    }
    const tick = (t, dur) => Loom.tween(drv, { t: t }, { t: t + dur, duration: dur, ease: "none", onUpdate: () => render(drv.t) }, t, { kind: "reveal", name: label });
    const R = {
      param(n, init) { P[n] = { init: init, keys: [] }; },
      v(n) { const p = P[n]; return ev(p.keys, p.keys.length - 1, cur, p.init); },
      to(n, to, t, dur) {
        const p = P[n]; if (!p) return;
        dur = dur == null ? 0.5 : Math.max(dur, 0.01);
        p.keys.push({ t: t, dur: dur, to: to });
        p.keys.sort((a, b) => a.t - b.t);
        tick(t, dur);
      },
      sub(f) { subs.push(f); f(0); },
      text(n, init) { S[n] = { init: init, list: [] }; },
      setText(n, s, t) { S[n].list.push({ t: t, s: s }); S[n].list.sort((a, b) => a.t - b.t); tick(t, 0.01); },
      str(n) { let r = S[n].init; for (const e of S[n].list) if (cur >= e.t) r = e.s; return r; },
      now() { return cur; },
    };
    R.vis = function (name, g, hidden) {
      R.param("vis_" + name, hidden ? 0 : 1);
      R.sub(() => { const v = clamp(R.v("vis_" + name)); g.setAttribute("opacity", f2(v)); g.setAttribute("transform", "translate(0 " + f2(14 * (1 - v)) + ")"); });
    };
    return R;
  }
  function base(R, root, extra) {
    return Object.assign({
      g: root,
      to: (n, v, t, d) => R.to(n, v, t, d),
      show: (n, t, d) => R.to("vis_" + n, 1, t, d == null ? 0.5 : d),
      hide: (n, t, d) => R.to("vis_" + n, 0, t, d == null ? 0.4 : d),
    }, extra);
  }
  const hiddenOf = (opts, n) => !!opts && (opts.startHidden === true || (Array.isArray(opts.startHidden) && opts.startHidden.indexOf(n) >= 0));

  function keyGlyph(p, cx, cy, s, fill, hole) {
    const g = sv("g", { transform: "translate(" + cx + " " + cy + ") rotate(-38) scale(" + s + ") translate(-2 0)" }, p);
    sv("rect", { x: -6, y: -4.5, width: 40, height: 9, rx: 4.5, fill: fill }, g);
    sv("rect", { x: 21, y: 3, width: 7, height: 12, rx: 2, fill: fill }, g);
    sv("rect", { x: 9, y: 3, width: 6, height: 9, rx: 2, fill: fill }, g);
    sv("circle", { cx: -16, cy: 0, r: 14, fill: fill }, g);
    sv("circle", { cx: -16, cy: 0, r: 5.5, fill: hole }, g);
    return g;
  }

  // ================= padlock: natural 100 x 130 =================
  Loom.lesson.padlock = function (ctx, parent, opts) {
    opts = opts || {};
    const c = ctx.c, R = rig(ctx, "padlock");
    R.param("lock", opts.open ? 0 : 1); R.param("blue", 0); R.param("pulse", 0); R.param("dim", 0);
    const sc = fit(opts, 100, 130);
    const root = sv("g", { transform: "scale(" + sc + ")" }, parent);
    const inner = sv("g", {}, root);
    const shackle = sv("g", {}, inner);
    const sh = sv("path", { d: "M26 70 V40 a24 24 0 0 1 48 0 V52", fill: "none", "stroke-width": 13, "stroke-linecap": "round", "stroke-linejoin": "round", stroke: c("ink") }, shackle);
    const body = sv("rect", { x: 0, y: 50, width: 100, height: 80, rx: 14, fill: c("ink") }, inner);
    sv("circle", { cx: 50, cy: 82, r: 9, fill: c("surface") }, inner);
    sv("rect", { x: 46, y: 88, width: 8, height: 18, rx: 4, fill: c("surface") }, inner);
    R.sub(() => {
      const k = clamp(R.v("lock")), b = clamp(R.v("blue")), pl = R.v("pulse"), d = clamp(R.v("dim"));
      const col = mix(c("ink"), c("accent"), b);
      sh.setAttribute("stroke", col); body.setAttribute("fill", col);
      const o = 1 - k;
      shackle.setAttribute("transform", "translate(0 " + f2(-16 * o) + ") translate(26 52) rotate(" + f2(-26 * o) + ") translate(-26 -52)");
      inner.setAttribute("transform", "translate(50 90) scale(" + f2(1 + 0.14 * pl) + ") translate(-50 -90)");
      inner.setAttribute("opacity", f2(1 - 0.5 * d));
    });
    const h = base(R, root, { w: 100 * sc, h: 130 * sc });
    h.setState = function (name, t, dur) {
      if (name === "open") { R.to("lock", 0, t, dur == null ? 0.4 : dur); R.to("blue", 0, t, 0.2); }
      else if (name === "closed") { R.to("lock", 1, t, dur == null ? 0.5 : dur); R.to("blue", 0, t, 0.2); }
      else if (name === "closed_blue") { R.to("lock", 1, t, dur == null ? 0.5 : dur); R.to("blue", 1, t, 0.6); }
      else if (name === "pulse") { R.to("pulse", 1, t, 0.18); R.to("pulse", 0, t + 0.18, 0.3); }
    };
    return h;
  };

  // ================= packet: readable card <-> six slate blocks =================
  Loom.lesson.packet = function (ctx, parent, opts) {
    opts = opts || {};
    const c = ctx.c, R = rig(ctx, "packet");
    const FS = 18;
    let tw = 19 * 0.56 * FS;
    try { const f = ctx.kit.fit("Password: Sunrise42", { role: "caption", weight: 500, maxLines: 1, w: 4000, h: 200 }); if (f && f.width && f.size) tw = f.width * FS / f.size; } catch (e) { tw = 19 * 0.56 * FS; }
    const W = Math.max(200, Math.ceil(tw + 28)), HH = 120;
    R.param("morph", opts.variant === "noise" ? 1 : 0); R.param("tok", opts.variant === "tokens" ? 1 : 0); R.param("dim", opts.variant === "noise" ? 1 : 0); R.param("pulse", 0);
    const sc = fit(opts, W, HH);
    const root = sv("g", { transform: "scale(" + sc + ")" }, parent);
    const cardG = sv("g", {}, root);
    const shadow = sv("rect", { x: 0, y: 8, width: W, height: HH, rx: 14, fill: c("shadow"), opacity: 0.08 }, cardG);
    const body = sv("rect", { x: 0, y: 0, width: W, height: HH, rx: 14, fill: c("surface") }, cardG);
    const rows = sv("g", {}, cardG);
    tx(rows, "User: j.doe", 14, 48, FS, c("ink"), 500);
    tx(rows, "Password: Sunrise42", 14, 88, FS, c("ink"), 500);
    const rng = Loom.rng("https-packet-glyphs");
    const bx0 = W / 2 - 119.5;
    const blocks = [];
    for (let i = 0; i < 6; i++) {
      const g = sv("g", {}, root);
      const r = sv("rect", { x: 0, y: 0, width: 34, height: 60, rx: 8, fill: c("accent3") }, g);
      const gl = sv("g", {}, g);
      for (let j = 0; j < 3; j++) {
        const w = 8 + Math.floor(rng() * 16), x = 4 + Math.floor(rng() * (26 - w + 4)), y = 12 + j * 15;
        sv("rect", { x: x, y: y, width: w, height: 6, rx: 2, fill: c("surface"), opacity: 0.7 }, gl);
      }
      blocks.push({ g: g, r: r, gl: gl });
    }
    const tokG = sv("g", {}, root);
    const tokR = [];
    for (let i = 0; i < 2; i++) {
      const g = sv("g", {}, tokG);
      const pw = Math.min(W - 16, 188);
      tokR.push(sv("rect", { x: (W - pw) / 2, y: 12 + i * 54, width: pw, height: 44, rx: 10, fill: c("accent3") }, g));
      tx(g, "Temporary value", W / 2, 41 + i * 54, 18, c("onAccent"), 700, null, "middle");
    }
    R.sub(() => {
      const p = clamp(R.v("morph")), tk = clamp(R.v("tok")), dm = clamp(R.v("dim")), pl = R.v("pulse");
      const cardO = (1 - clamp(p * 8)) * (1 - tk);
      body.setAttribute("opacity", f2(cardO)); shadow.setAttribute("opacity", f2(0.08 * cardO));
      rows.setAttribute("opacity", f2((1 - clamp(p * 3.5)) * (1 - tk)));
      rows.setAttribute("transform", "translate(0 " + f2(-2 * pl) + ")");
      const slate = mix(c("accent3"), c("field2"), 0.5 * dm);
      blocks.forEach((b, i) => {
        const q = ease(clamp((p - i * 0.04) / 0.8));
        const x = lerp(i * (W / 6), bx0 + i * 41, q), w = lerp(W / 6 + 0.6, 34, q), y = lerp(0, 30, q), h = lerp(HH, 60, q);
        b.g.setAttribute("transform", "translate(" + f2(x) + " " + f2(y) + ")");
        b.g.setAttribute("opacity", f2(clamp(p * 8) * (1 - tk)));
        b.r.setAttribute("width", f2(w)); b.r.setAttribute("height", f2(h)); b.r.setAttribute("rx", f2(lerp(14, 8, q)));
        b.r.setAttribute("fill", mix(c("surface"), slate, clamp(q * 1.6)));
        b.gl.setAttribute("opacity", f2(clamp((q - 0.6) / 0.4) * (1 - 0.4 * dm)));
        b.gl.setAttribute("transform", "translate(" + f2((w - 34) / 2) + " " + f2((h - 60) / 2) + ")");
      });
      tokG.setAttribute("opacity", f2(tk));
      tokR.forEach((r) => r.setAttribute("fill", slate));
    });
    const h = base(R, root, { w: W * sc, h: HH * sc, natural: { w: W, h: HH } });
    h.morph = (to, t, dur) => R.to("morph", to, t, dur == null ? 0.9 : dur);
    h.setState = function (name, t, dur) {
      const d0 = dur == null ? 0.01 : dur;
      if (name === "readable" || name === "copy_readable") { R.to("morph", 0, t, d0); R.to("tok", 0, t, 0.01); R.to("dim", 0, t, 0.01); }
      else if (name === "morphing") { R.to("morph", 1, t, dur == null ? 0.9 : dur); R.to("tok", 0, t, 0.01); }
      else if (name === "scrambled") { R.to("morph", 1, t, d0); R.to("tok", 0, t, 0.01); R.to("dim", 0, t, 0.01); }
      else if (name === "copy_noise") { R.to("morph", 1, t, d0); R.to("tok", 0, t, 0.01); R.to("dim", 1, t, dur == null ? 0.5 : dur); }
      else if (name === "copy_tokens") { R.to("tok", 1, t, d0); }
      else if (name === "pulse") { R.to("pulse", 1, t, 0.15); R.to("pulse", 0, t + 0.15, 0.3); }
    };
    return h;
  };

  // ================= key_slots: 80x80 swap slots; which = all (station coords) | browser | server | watcher =================
  Loom.lesson.key_slots = function (ctx, parent, opts) {
    opts = opts || {};
    const c = ctx.c, R = rig(ctx, "key_slots");
    ["keyB", "keyS", "lensB", "lensS", "shake", "pulseB", "pulseS"].forEach((n) => R.param(n, 0));
    if (opts.filled) { R.param("keyB", 1); R.param("keyS", 1); }
    const which = opts.which || "browser";
    const POS = { browser: [600, 440], server: [1240, 440], watcher: [1110, 630] };
    const dims = which === "all" ? [1920, 1080] : [80, 80];
    const root = sv("g", { transform: "scale(" + fit(opts, dims[0], dims[1]) + ")" }, parent);
    const names = which === "all" ? ["browser", "server", "watcher"] : [which];
    const S = {};
    names.forEach((n) => {
      const holder = sv("g", {}, root);
      R.vis(n, holder, hiddenOf(opts, n));
      const pos = which === "all" ? POS[n] : [0, 0];
      const g = sv("g", { transform: "translate(" + pos[0] + " " + pos[1] + ")" }, holder);
      const lens = sv("ellipse", { cx: 40, cy: 40, rx: 18, ry: 64, fill: c("accent"), opacity: 0, stroke: c("accent"), "stroke-width": 4 }, g);
      const slot = sv("rect", { x: 0, y: 0, width: 80, height: 80, rx: 10, fill: c("surface"), stroke: c("line"), "stroke-width": 3, "stroke-dasharray": "9 7", "stroke-linecap": "round" }, g);
      const ring = sv("rect", { x: -5, y: -5, width: 90, height: 90, rx: 14, fill: "none", stroke: c("accent"), "stroke-width": 4, opacity: 0 }, g);
      const key = n === "watcher" ? null : sv("g", {}, g);
      if (key) keyGlyph(key, 40, 40, 0.9, c("accent"), c("surface"));
      S[n] = { g: g, lens: lens, ring: ring, key: key, x: pos[0], y: pos[1] };
    });
    R.sub(() => {
      names.forEach((n) => {
        const s = S[n];
        if (n === "watcher") { s.g.setAttribute("transform", "translate(" + f2(s.x + 7 * R.v("shake") * Math.sin(R.now() * 46)) + " " + s.y + ")"); return; }
        const kk = n === "browser" ? "keyB" : "keyS", ll = n === "browser" ? "lensB" : "lensS", pp = n === "browser" ? "pulseB" : "pulseS";
        const v = clamp(R.v(kk)), lz = clamp(R.v(ll)), pl = R.v(pp);
        s.key.setAttribute("opacity", f2(clamp(v * 2)));
        s.key.setAttribute("transform", "translate(40 40) scale(" + f2(1 + 0.22 * pl + 0.12 * lz) + ") translate(-40 -40) translate(0 " + f2(-50 * (1 - v) + 6 * Math.sin(Math.PI * v)) + ")");
        s.lens.setAttribute("opacity", f2(0.2 * lz)); s.lens.setAttribute("stroke-opacity", f2(0.9 * lz));
        s.ring.setAttribute("opacity", f2(Math.max(lz, 0.8 * clamp(pl))));
      });
    });
    const h = base(R, root, { slots: S, anchors: { browser: [600, 440, 80, 80], server: [1240, 440, 80, 80], watcher: [1110, 630, 80, 80] } });
    h.pulse = (which2, t) => { const n = which2 === "server" ? "pulseS" : which2 === "both" ? null : "pulseB"; const go = (nn) => { R.to(nn, 1, t, 0.18); R.to(nn, 0, t + 0.18, 0.35); }; if (n) go(n); else { go("pulseB"); go("pulseS"); } };
    h.setState = function (name, t, dur) {
      if (name === "empty") { ["keyB", "keyS", "lensB", "lensS"].forEach((n) => R.to(n, 0, t, 0.01)); }
      else if (name === "ends_filled") { R.to("keyB", 1, t, dur == null ? 0.6 : dur); R.to("keyS", 1, t, dur == null ? 0.6 : dur); }
      else if (name === "lens_browser") { R.to("keyB", 1, t, 0.3); R.to("lensB", 1, t, dur == null ? 0.45 : dur); }
      else if (name === "lens_server") { R.to("keyS", 1, t, 0.3); R.to("lensS", 1, t, dur == null ? 0.45 : dur); }
      else if (name === "watcher_shake") { R.to("shake", 1, t, 0.1); R.to("shake", 0, t + 0.5, 0.2); }
    };
    return h;
  };

  // ================= cert_card: 380 x 280 =================
  Loom.lesson.cert_card = function (ctx, parent, opts) {
    opts = opts || {};
    const c = ctx.c, kit = ctx.kit, R = rig(ctx, "cert_card");
    ["seal", "tickS", "tickN", "tickD", "cross", "shrink", "big", "rowHL", "dateFill", "red"].forEach((n) => R.param(n, 0));
    if (opts.full) R.param("seal", 1);
    R.text("domain", opts.domain || "accounts.example");
    const outer = sv("g", { transform: "scale(" + fit(opts, 380, 280) + ")" }, parent);
    const root = sv("g", {}, outer);
    const shadow = sv("rect", { x: 0, y: 10, width: 380, height: 280, rx: 20, fill: c("shadow"), opacity: 0.08 }, root);
    const body = sv("rect", { x: 0, y: 0, width: 380, height: 280, rx: 20, fill: c("surface") }, root);
    const full = sv("g", {}, root);
    tx(full, "Certificate", 24, 44, 30, c("ink"), 700);
    const ROW = [62, 114, 166, 218];
    const labels = ["Domain", "Public key", "Valid dates", "Signed by"];
    labels.forEach((s, i) => tx(full, s, 24, ROW[i] + 17, 22, c("muted"), 500));
    const domT = tx(full, opts.domain || "accounts.example", 24, ROW[0] + 46, 26, c("ink"), 700);
    tx(full, "Example Authority", 24, ROW[3] + 46, 26, c("ink"), 700);
    // public key glyph (slate) and value dots
    keyGlyph(full, 44, ROW[1] + 33, 0.5, c("accent3"), c("surface"));
    for (let i = 0; i < 8; i++) sv("circle", { cx: 100 + i * 16, cy: ROW[1] + 33, r: 3.5, fill: c("accent3"), opacity: 0.6 }, full);
    // dates bar
    sv("rect", { x: 24, y: ROW[2] + 29, width: 300, height: 12, rx: 6, fill: c("surface2") }, full);
    sv("rect", { x: 84, y: ROW[2] + 29, width: 170, height: 12, rx: 6, fill: c("accent3"), opacity: 0.35 }, full);
    const dFill = sv("rect", { x: 84, y: ROW[2] + 29, width: 170, height: 12, rx: 6, fill: c("pos") }, full);
    const dMark = sv("circle", { cx: 169, cy: ROW[2] + 35, r: 8, fill: c("ink") }, full);
    // row outlines
    const hl = sv("g", {}, full);
    [0, 2, 3].forEach((i) => sv("rect", { x: 14, y: ROW[i] - 2, width: 352, height: 50, rx: 10, fill: "none", stroke: c("line"), "stroke-width": 2 }, hl));
    // seal
    function seal(p, cx, cy, r) {
      const g = sv("g", {}, p);
      sv("circle", { cx: cx, cy: cy, r: r, fill: c("accent3") }, g);
      sv("circle", { cx: cx, cy: cy, r: r * 0.7, fill: "none", stroke: c("surface"), "stroke-width": 2 }, g);
      sv("circle", { cx: cx, cy: cy, r: r * 0.25, fill: c("surface") }, g);
      return g;
    }
    const sealG = sv("g", {}, full);
    seal(sealG, 312, ROW[3] + 31, 17);
    // ticks (full)
    function tickAt(p, cx, cy, kind, size) {
      const g = sv("g", { transform: "translate(" + cx + " " + cy + ")" }, p);
      const s = sv("g", {}, g);
      kit.mark(s, kind, 0, 0, size);
      return s;
    }
    const tS = tickAt(full, 352, ROW[3] + 27, "yes", 26), tN = tickAt(full, 352, ROW[0] + 27, "yes", 26), tD = tickAt(full, 352, ROW[2] + 27, "yes", 26);
    const cr = tickAt(full, 352, ROW[0] + 27, "no", 26);
    // badge
    const badge = sv("g", {}, root);
    seal(badge, 60, 40, 22);
    const bt = [];
    [30, 60, 90].forEach((x) => { sv("circle", { cx: x, cy: 92, r: 11, fill: c("surface2") }, badge); bt.push(tickAt(badge, x, 92, "yes", 20)); });
    R.sub(() => {
      const sh = clamp(R.v("shrink")), e = ease(sh), big = clamp(R.v("big"));
      const w = lerp(380, 120, e), hh = lerp(280, 120, e);
      body.setAttribute("width", f2(w)); body.setAttribute("height", f2(hh));
      shadow.setAttribute("width", f2(w)); shadow.setAttribute("height", f2(hh));
      root.setAttribute("transform", "scale(" + f2(1 + big * 0.6667 * e) + ")");
      full.setAttribute("opacity", f2(1 - clamp(sh / 0.35)));
      badge.setAttribute("opacity", f2(clamp((sh - 0.6) / 0.4)));
      const sl = clamp(R.v("seal")), pop = (v) => { const s = v <= 0 ? 0 : 1 + 0.35 * Math.sin(Math.PI * Math.min(v, 1)) * (1 - v) * 2; return s; };
      sealG.setAttribute("opacity", f2(clamp(sl * 3)));
      sealG.setAttribute("transform", "translate(312 " + (ROW[3] + 31) + ") scale(" + f2(1 + 0.8 * (1 - sl)) + ") translate(-312 " + (-(ROW[3] + 31)) + ")");
      const tv = [clamp(R.v("tickS")), clamp(R.v("tickN")), clamp(R.v("tickD"))];
      [tS, tN, tD].forEach((t, i) => { t.setAttribute("opacity", f2(clamp(tv[i] * 3))); t.setAttribute("transform", "scale(" + f2(0.2 + 0.8 * tv[i] + 0.2 * Math.sin(Math.PI * tv[i])) + ")"); });
      bt.forEach((t, i) => { t.setAttribute("opacity", f2(clamp(tv[i] * 3))); t.setAttribute("transform", "scale(" + f2(0.2 + 0.8 * tv[i]) + ")"); });
      const crv = clamp(R.v("cross"));
      cr.setAttribute("opacity", f2(clamp(crv * 3))); cr.setAttribute("transform", "scale(" + f2(0.2 + 0.8 * crv + 0.2 * Math.sin(Math.PI * crv)) + ")");
      hl.setAttribute("opacity", f2(clamp(R.v("rowHL"))));
      const df = clamp(R.v("dateFill"));
      dFill.setAttribute("width", f2(170 * df)); dMark.setAttribute("opacity", f2(df));
      const s = R.str("domain"); if (domT.textContent !== s) domT.textContent = s;
      domT.setAttribute("fill", mix(c("ink"), c("neg"), clamp(R.v("red"))));
    });
    const h = base(R, root, { w: 380, h: 280, rows: ROW });
    h.setDomain = (s, t) => R.setText("domain", s, t);
    h.relight = function (t, gap) {
      gap = gap == null ? 0.45 : gap;
      ["tickS", "tickN", "tickD"].forEach((n) => R.to(n, 0, t, 0.2));
      ["tickS", "tickN", "tickD"].forEach((n, i) => R.to(n, 1, t + 0.3 + i * gap, 0.35));
    };
    h.setState = function (name, t, dur) {
      if (name === "arriving") { ["seal", "tickS", "tickN", "tickD", "cross", "shrink", "big", "rowHL", "dateFill", "red"].forEach((n) => R.to(n, 0, t, 0.01)); }
      else if (name === "full") { R.to("seal", 1, t, dur == null ? 0.35 : dur); }
      else if (name === "tick_signer") { R.to("tickS", 1, t, dur == null ? 0.35 : dur); }
      else if (name === "tick_name") { R.to("tickN", 1, t, dur == null ? 0.35 : dur); }
      else if (name === "tick_dates") { R.to("tickD", 1, t, dur == null ? 0.35 : dur); R.to("dateFill", 1, t, 0.7); }
      else if (name === "badge") { R.to("shrink", 1, t, dur == null ? 0.8 : dur); R.to("big", 0, t, 0.5); }
      else if (name === "badge_relit") { R.to("shrink", 1, t, 0.3); R.to("big", 1, t, dur == null ? 0.6 : dur); h.relight(t + 0.4); }
      else if (name === "name_red") { R.to("tickN", 0, t, 0.2); R.to("cross", 1, t, dur == null ? 0.4 : dur); R.to("red", 1, t, 0.4); }
    };
    return h;
  };

  // ================= address_bar: 1600 x 120 =================
  Loom.lesson.address_bar = function (ctx, parent, opts) {
    opts = opts || {};
    const c = ctx.c, R = rig(ctx, "address_bar");
    ["hl", "slot", "ul", "pulse"].forEach((n) => R.param(n, 0));
    const dom = opts.domain || "accounts.example";
    const SZ = 56, CW = SZ * 0.6, X0 = 140;
    const root = sv("g", { transform: "scale(" + fit(opts, 1600, 120) + ")" }, parent);
    card(ctx, root, 0, 0, 1600, 120, { r: 60 });
    sv("circle", { cx: 70, cy: 60, r: 40, fill: c("surface2") }, root);
    let pad = null;
    if (opts.padlock) { const pg = sv("g", { transform: "translate(" + (70 - 18.5) + " 36)" }, root); pad = Loom.lesson.padlock(ctx, pg, { h: 48 }); }
    const hlG = sv("g", {}, root), txG = sv("g", {}, root);
    const hlR = [], chars = [];
    for (let i = 0; i < dom.length; i++) {
      hlR.push(sv("rect", { x: X0 + i * CW, y: 26, width: CW, height: 70, rx: 6, fill: c("accent2"), opacity: 0 }, hlG));
      chars.push(tx(txG, dom[i], X0 + i * CW + CW / 2, 60 + SZ * 0.35, SZ, c("ink"), 700, MONO, "middle"));
    }
    const ul = sv("line", { x1: X0, y1: 104, x2: X0 + dom.length * CW, y2: 104, stroke: c("ink"), "stroke-width": 3, "stroke-linecap": "round", opacity: 0 }, root);
    const slot = sv("rect", { x: X0, y: 200, width: 900, height: 80, rx: 10, fill: "none", stroke: c("line"), "stroke-width": 3, "stroke-dasharray": "10 8", "stroke-linecap": "round", opacity: 0 }, root);
    R.sub(() => {
      const hv = R.v("hl");
      hlR.forEach((r, i) => r.setAttribute("opacity", f2(0.3 * clamp(hv - i))));
      ul.setAttribute("opacity", f2(0.45 * clamp(R.v("ul"))));
      slot.setAttribute("opacity", f2(clamp(R.v("slot"))));
      const p = R.v("pulse"), cx = X0 + dom.length * CW / 2;
      txG.setAttribute("transform", "translate(" + cx + " 60) scale(" + f2(1 + 0.05 * p) + ") translate(" + (-cx) + " -60)");
    });
    const h = base(R, root, { w: 1600, h: 120, padlock: pad, chars: { x0: X0, cw: CW, n: dom.length, size: SZ }, slotRect: [X0, 200, 900, 80] });
    h.highlight = (t, dur) => R.to("hl", dom.length, t, dur == null ? 2 : dur);
    h.setState = function (name, t, dur) {
      if (name === "plain") { ["hl", "slot", "ul"].forEach((n) => R.to(n, 0, t, 0.01)); }
      else if (name === "name_highlight") { R.to("hl", dom.length, t, dur == null ? 2 : dur); }
      else if (name === "warning_slot_empty") { R.to("slot", 1, t, dur == null ? 0.5 : dur); }
      else if (name === "pulse") { R.to("pulse", 1, t, 0.2); R.to("pulse", 0, t + 0.2, 0.3); }
      else if (name === "underline") { R.to("ul", 1, t, 0.4); }
    };
    return h;
  };

  // ================= path_board: station coords (element 1920x1080 at 0,0) or only:"server" inset 420x210 =================
  Loom.lesson.path_board = function (ctx, parent, opts) {
    opts = opts || {};
    const c = ctx.c, R = rig(ctx, "path_board");
    R.text("name", opts.name || "accounts.example");
    const ALT = opts.altName || "shop.example";
    ["band", "submit", "watchHL", "serverHL", "browserHL", "tube", "pathDim", "look"].forEach((n) => R.param(n, 0));
    R.param("ap", 0.45);
    const root = sv("g", {}, parent);
    if (opts.only !== "server") root.setAttribute("transform", "scale(" + fit(opts, 1680, 640) + ") translate(-120 -260)");
    function part(name, p) { const g = sv("g", {}, p || root); R.vis(name, g, hiddenOf(opts, name)); return g; }
    function strip(p, x, y, w, size) {
      sv("rect", { x: x, y: y, width: w, height: 44, rx: 10, fill: c("surface2") }, p);
      return tx(p, opts.name || "accounts.example", x + 18, y + 22 + size * 0.35, size, c("ink"), 700, MONO);
    }
    function serverGlyph(p, x, y, w, uh, gap) {
      for (let i = 0; i < 3; i++) {
        const yy = y + i * (uh + gap);
        sv("rect", { x: x, y: yy, width: w, height: uh, rx: 8, fill: c("surface2") }, p);
        sv("circle", { cx: x + 20, cy: yy + uh / 2, r: 5, fill: c("accent3") }, p);
        sv("rect", { x: x + 44, y: yy + uh / 2 - 4, width: w * 0.5, height: 8, rx: 4, fill: c("accent3"), opacity: 0.35 }, p);
      }
    }
    const nameEls = [];
    if (opts.only === "server") {
      const sc = fit(opts, 420, 210);
      root.setAttribute("transform", "scale(" + sc + ")");
      const g = part("server");
      card(ctx, g, 0, 0, 420, 210);
      nameEls.push(strip(g, 16, 14, 388, 24));
      serverGlyph(g, 20, 70, 90, 28, 8);
      sv("rect", { x: 140, y: 64, width: 260, height: 132, rx: 14, fill: c("surface2") }, g);
      R.sub(() => { const s = R.str("name"); nameEls.forEach((e) => { if (e.textContent !== s) e.textContent = s; }); });
      const h = base(R, root, { w: 420 * sc, h: 210 * sc, anchors: { packetCenter: [270, 130] } });
      h.setName = (s, t) => R.setText("name", s, t);
      h.setState = function (name, t) { if (name === "relabel") R.setText("name", ALT, t); };
      return h;
    }
    // plate
    const plate = sv("rect", { x: 0, y: 160, width: 1920, height: 700, fill: c("field2"), opacity: 0 }, root);
    // tube (double line) and single path
    const tubeG = sv("g", {}, root);
    const tubeFill = sv("rect", { x: 580, y: 440, width: 760, height: 80, fill: c("surface"), opacity: 0 }, tubeG);
    const tl = [440, 520].map((y) => sv("line", { x1: 580, y1: y, x2: 1340, y2: y, stroke: c("muted"), "stroke-width": 4, "stroke-linecap": "round", "stroke-dasharray": 760, "stroke-dashoffset": 760, opacity: 0 }, tubeG));
    const pathG = part("path");
    const pline = sv("line", { x1: 580, y1: 480, x2: 1340, y2: 480, stroke: c("line"), "stroke-width": 4, "stroke-linecap": "round" }, pathG);
    // browser
    const bg = part("browser");
    card(ctx, bg, 120, 260, 460, 440);
    nameEls.push(strip(bg, 140, 276, 420, 26));
    sv("rect", { x: 148, y: 352, width: 404, height: 64, rx: 10, fill: c("surface2") }, bg);
    tx(bg, "User: j.doe", 168, 394, 28, c("ink"), 500);
    sv("rect", { x: 148, y: 436, width: 404, height: 64, rx: 10, fill: c("surface2") }, bg);
    tx(bg, "Password: Sunrise42", 168, 478, 28, c("ink"), 500);
    sv("rect", { x: 148, y: 566, width: 404, height: 64, rx: 10, fill: c("shadow"), opacity: 0.22 }, bg);
    const sub = sv("g", {}, bg);
    sv("rect", { x: 148, y: 560, width: 404, height: 64, rx: 10, fill: c("accent") }, sub);
    tx(sub, "Submit", 350, 602, 28, c("onAccent"), 700, null, "middle");
    const bHL = sv("rect", { x: 114, y: 254, width: 472, height: 452, rx: 24, fill: "none", stroke: c("ink"), "stroke-width": 4, opacity: 0 }, bg);
    // watcher
    const wg = part("watcher");
    card(ctx, wg, 850, 410, 220, 140, { fill: "accent3" });
    const wHL = sv("rect", { x: 843, y: 403, width: 234, height: 154, rx: 24, fill: "none", stroke: c("ink"), "stroke-width": 4, opacity: 0 }, wg);
    sv("circle", { cx: 960, cy: 480, r: 46, fill: c("surface") }, wg);
    const seams = [];
    for (let i = 0; i < 6; i++) seams.push(sv("line", { x1: 960, y1: 480, x2: 960, y2: 480, stroke: c("line"), "stroke-width": 2, "stroke-linecap": "round" }, wg));
    const hex = sv("polygon", { points: "0,0", fill: c("ink") }, wg);
    // tray
    const tg = part("tray");
    sv("line", { x1: 960, y1: 550, x2: 960, y2: 590, stroke: c("line"), "stroke-width": 3, "stroke-linecap": "round" }, tg);
    card(ctx, tg, 820, 590, 280, 150, { fill: "surface2" });
    sv("rect", { x: 836, y: 606, width: 248, height: 118, rx: 12, fill: c("surface"), opacity: 0.55 }, tg);
    // server
    const sg = part("server");
    card(ctx, sg, 1340, 260, 460, 440);
    nameEls.push(strip(sg, 1360, 276, 420, 26));
    serverGlyph(sg, 1470, 340, 200, 36, 10);
    sv("rect", { x: 1450, y: 520, width: 240, height: 140, rx: 14, fill: c("surface2") }, sg);
    const sHL = sv("rect", { x: 1334, y: 254, width: 472, height: 452, rx: 24, fill: "none", stroke: c("ink"), "stroke-width": 4, opacity: 0 }, sg);
    R.sub(() => {
      plate.setAttribute("opacity", f2(clamp(R.v("band"))));
      const tb = clamp(R.v("tube")), dr = clamp(tb / 0.7), fl = clamp((tb - 0.5) / 0.5);
      tl.forEach((l) => { l.setAttribute("stroke-dashoffset", f2(760 * (1 - dr))); l.setAttribute("opacity", dr > 0.001 ? 1 : 0); });
      tubeFill.setAttribute("opacity", f2(0.85 * fl));
      pline.setAttribute("opacity", f2((1 - clamp(tb * 1.4)) * (1 - 0.5 * clamp(R.v("pathDim")))));
      const sp = clamp(R.v("submit")); sub.setAttribute("transform", "translate(0 " + f2(6 * sp) + ")");
      bHL.setAttribute("opacity", f2(clamp(R.v("browserHL")))); wHL.setAttribute("opacity", f2(clamp(R.v("watchHL")))); sHL.setAttribute("opacity", f2(clamp(R.v("serverHL"))));
      const ap = clamp(R.v("ap")), lk = R.v("look"), ro = 7 + 27 * ap, rot = (14 * ap + 20 * lk) * Math.PI / 180, cx = 960 + 7 * lk, cy = 480;
      const pts = [];
      for (let k = 0; k < 6; k++) {
        const a = rot + k * Math.PI / 3, a2 = a + 22 * Math.PI / 180;
        pts.push(f2(cx + ro * Math.cos(a)) + "," + f2(cy + ro * Math.sin(a)));
        const s = seams[k];
        s.setAttribute("x1", f2(cx + ro * Math.cos(a))); s.setAttribute("y1", f2(cy + ro * Math.sin(a)));
        s.setAttribute("x2", f2(960 + 44 * Math.cos(a2))); s.setAttribute("y2", f2(480 + 44 * Math.sin(a2)));
      }
      hex.setAttribute("points", pts.join(" "));
      const s = R.str("name"); nameEls.forEach((e) => { if (e.textContent !== s) e.textContent = s; });
    });
    const h = base(R, root, { w: 1920, h: 1080, anchors: { formPacketCenter: [350, 426], watcherBox: [850, 410, 220, 140], trayCopy: [860, 610, 200, 120], serverInbox: [1570, 590], path: [580, 480, 760, 0], tubeInner: [580, 440, 760, 80] } });
    h.setName = (s, t) => R.setText("name", s, t);
    h.highlight = (which, v, t) => R.to(which === "server" ? "serverHL" : which === "browser" ? "browserHL" : "watchHL", v, t, 0.3);
    h.aperture = (v, t) => R.to("ap", v, t, 0.5);
    h.look = (v, t) => R.to("look", v, t, 0.5);
    h.setState = function (name, t, dur) {
      if (name === "idle") { ["submit", "watchHL", "serverHL", "browserHL", "tube", "look"].forEach((n) => R.to(n, 0, t, 0.01)); R.to("ap", 0.45, t, 0.3); }
      else if (name === "submit_pressed") { R.to("submit", 1, t, 0.12); R.to("submit", 0, t + 0.3, 0.25); }
      else if (name === "router_highlight") { R.to("watchHL", 1, t, 0.3); R.to("ap", 1, t, 0.5); }
      else if (name === "tube") { R.to("tube", 1, t, dur == null ? 0.9 : dur); }
      else if (name === "band_light") { R.to("band", 0, t, dur == null ? 0.6 : dur); }
      else if (name === "band_mid") { R.to("band", 1, t, dur == null ? 0.8 : dur); }
      else if (name === "relabel") { R.setText("name", ALT, t); }
    };
    return h;
  };
})();
