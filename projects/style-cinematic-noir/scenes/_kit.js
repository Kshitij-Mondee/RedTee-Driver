Loom.lesson = Loom.lesson || {};
// shared helper layer (cinematic-noir: flat shapes, tokens only)
Loom.lesson._h = function (ctx) {
  const sv = (t, a, p) => Loom.svg(t, a, p);
  const c = (t) => ctx.c(t);
  const col = (v) => (v.indexOf("#") === 0 || v.indexOf("rgb") === 0 || v.indexOf("url") === 0 ? v : c(v));
  const mix = (a, b, k) => Loom.style.mix(c(a), c(b), k);
  const el = (t, a, p, o) => {
    o = o || {};
    a.fill = o.f ? col(o.f) : "none";
    if (o.s) { a.stroke = col(o.s); a["stroke-width"] = o.sw || 2; a["stroke-linejoin"] = "round"; a["stroke-linecap"] = "round"; }
    if (o.o != null) a.opacity = o.o;
    if (o.d) a["stroke-dasharray"] = o.d;
    return sv(t, a, p);
  };
  const R = (p, x, y, w, h, o) => el("rect", { x, y, width: w, height: h, rx: (o && o.r) || 0 }, p, o);
  const P = (p, d, o) => el("path", { d }, p, o);
  const L = (p, x1, y1, x2, y2, o) => el("line", { x1, y1, x2, y2 }, p, o);
  const C = (p, cx, cy, r, o) => el("circle", { cx, cy, r }, p, o);
  const E = (p, cx, cy, rx, ry, o) => el("ellipse", { cx, cy, rx, ry }, p, o);
  const G = (p, a) => sv("g", a || {}, p);
  const T = (p, s, x, y, size, fill, anchor) => {
    const t = sv("text", { x, y, "font-family": "Inter, sans-serif", "font-weight": 700, "font-size": size, fill: col(fill), "text-anchor": anchor || "start" }, p);
    t.textContent = s; return t;
  };
  // state machine: map name -> groups visible; t == null sets the attribute (initial), else a timeline set
  const states = (map, init) => {
    const all = [];
    Object.keys(map).forEach((k) => map[k].forEach((g) => { if (all.indexOf(g) < 0) all.push(g); }));
    const fn = (name, t) => {
      const on = map[name] || [];
      all.forEach((g) => {
        const v = on.indexOf(g) >= 0 ? 1 : 0;
        if (t == null) g.setAttribute("opacity", v); else Loom.tl.set(g, { opacity: v }, t);
      });
    };
    fn(init, null);
    return fn;
  };
  const root = (parent, opts, W, H) => {
    const s = opts.w ? opts.w / W : (opts.scale || 1);
    return { s, g: sv("g", { transform: `translate(${opts.x || 0} ${opts.y || 0}) scale(${s})` }, parent) };
  };
  const rnd = (seed) => { const r = Loom.rng(seed); return () => (typeof r === "function" ? r() : r.next()); };
  return { sv, c, col, mix, el, R, P, L, C, E, G, T, states, root, rnd };
};

// ---------------- keycard: 220 x 140, origin top-left. opts {w|scale, rotation, seed, state}
Loom.lesson.keycard = function (ctx, parent, opts) {
  opts = opts || {};
  const h = Loom.lesson._h(ctx), { R, P, C, E, G, sv } = h;
  const r = h.root(parent, opts, 220, 140);
  const g = G(r.g, opts.rotation ? { transform: `rotate(${opts.rotation} 110 70)` } : {});
  const cuts = (seed) => { const n = h.rnd(seed); const a = []; for (let i = 0; i < 11; i++) a.push(Math.floor(n() * 4) * 9); return a; };
  const body = (p, cs, fill, stroke, sw, chip, op) => {
    let d = "M2 2 H218";
    for (let i = 10; i >= 0; i--) d += ` V${138 - cs[i]} H${i * 20}`;
    d += " Z";
    const w = G(p), q = G(w, op ? { opacity: op } : {});
    P(q, d, { f: fill, s: stroke, sw });
    R(q, 20, 28, 46, 34, { r: 5, f: chip, o: 0.9 });
    R(q, 20, 78, 150, 14, { r: 3, f: "field", o: 0.55 });
    return w;
  };
  const a = cuts(opts.seed || "dana"), b = cuts((opts.seed || "dana") + "-fresh");
  const glow = G(g), gid = Loom.uid("kcg"), rg = sv("radialGradient", { id: gid, cx: "50%", cy: "50%", r: "50%" }, sv("defs", {}, glow));
  sv("stop", { offset: "0", "stop-color": h.c("accent"), "stop-opacity": 0.5 }, rg);
  sv("stop", { offset: "1", "stop-color": h.c("accent"), "stop-opacity": 0 }, rg);
  E(glow, 110, 72, 98, 68, { f: `url(#${gid})` });
  const lit = body(g, a, "surface", "accent", 4, "accent");
  const copy = body(g, a, "surface2", "muted", 3, "line", 0.75);
  const dim = body(g, a, "surface2", "line", 2, "line");
  const fresh = body(g, b, "surface", "ink", 3, "muted");
  const set = h.states({ lit: [glow, lit], copy: [copy], dim: [dim], fresh: [fresh] }, opts.state || "lit");
  return { g: r.g, w: 220 * r.s, h: 140 * r.s, glow, setState: set };
};

// ---------------- door: 400 x 620 (heavy 520 x 620), origin top-left. opts {w|scale, name, heavy, shade, state}
Loom.lesson.door = function (ctx, parent, opts) {
  opts = opts || {};
  const h = Loom.lesson._h(ctx), { R, P, L, C, E, G, T, mix } = h;
  const W = opts.heavy ? 520 : 400, H = 620;
  const r = h.root(parent, opts, W, H), g = r.g;
  const x0 = 48, x1 = W - 48, fy = 556;
  R(g, 0, 0, W, H, { f: "field2" });
  R(g, 0, fy, W, H - fy, { f: "shadow", o: 0.8 });
  R(g, x0 - 8, 28, x1 - x0 + 16, fy - 28, { f: "shadow", s: "line", sw: 2 });
  const lw = opts.heavy ? 78 : 46, lh = opts.heavy ? 130 : 96, lx = x1 - lw - 26, ly = 290;
  const sx = lx + lw / 2, sy = ly + lh / 2;
  const lock = (p, y) => {
    R(p, lx, y, lw, lh, { r: 8, f: "surface2", s: "line", sw: 2 });
    R(p, sx - 4, y + lh / 2 - 20, 8, 40, { r: 3, f: "shadow" });
  };
  const base = G(g);
  R(base, x0, 36, x1 - x0, fy - 36, { f: "surface" });
  R(base, x0 + 28, 70, x1 - x0 - 56, 200, { r: 4, f: "surface2" });
  R(base, x0 + 28, 330, x1 - x0 - 56, 190, { r: 4, f: "surface2" });
  if (opts.heavy) for (let i = 0; i < 4; i++) R(base, x0, 110 + i * 105, x1 - x0, 20, { f: "shadow", o: 0.7 });
  L(base, x0 + 1, 36, x0 + 1, fy, { s: "ink", sw: 3, o: 0.4 });
  lock(base, ly);
  const knob = (p) => { C(p, sx, ly - 22, 13, { s: "ink", sw: 3 }); L(p, sx, ly - 22, sx + 10, ly - 32, { s: "ink", sw: 3 }); };
  const sliver = (p, stroke) => R(p, sx - 64, sy - 10, 68, 20, { r: 3, f: stroke === "accent" ? "surface" : "surface2", s: stroke, sw: 3 });
  const turning = G(g); sliver(turning, "accent"); knob(turning);
  const cracked = G(g);
  const cx1 = x1 - 30;
  P(cracked, `M${x0} 36 L${cx1} 52 L${cx1} 540 L${x0} ${fy} Z`, { f: "surface" });
  P(cracked, `M${cx1} 52 L${x1} 36 L${x1} ${fy} L${cx1} 540 Z`, { f: "ink", o: 0.88 });
  P(cracked, `M${cx1 - 4} ${fy} L${x1} ${fy} L${x1 - 6} ${H} L${x1 - 190} ${H} Z`, { f: mix("surface2", "ink", 0.34) });
  const forced = G(g);
  P(forced, `M${x0} 36 L${x1} 36 L${x1} 62 Z`, { f: "shadow" });
  let zz = `M${x1} 62`; for (let i = 1; i <= 12; i++) zz += ` L${x1 - (i % 2 ? 10 : 0) - (i > 6 ? 6 : 0)} ${62 + i * 41}`;
  P(forced, `M${x0} 36 L${x1} 62 L${x1 - 6} ${fy} L${x0} ${fy} Z`, { f: "surface" });
  R(forced, x0 + 28, 110, x1 - x0 - 56, 160, { r: 4, f: "surface2" });
  P(forced, zz, { s: "neg", sw: 4 });
  L(forced, lx - 10, ly + 6, lx + lw + 6, ly - 14, { s: "neg", sw: 5 }); L(forced, lx - 10, ly + 40, lx + lw + 6, ly + 20, { s: "neg", sw: 5 });
  const refused = G(g); sliver(refused, "muted");
  L(refused, sx - 14, ly - 36, sx + 14, ly - 8, { s: "neg", sw: 6 }); L(refused, sx + 14, ly - 36, sx - 14, ly - 8, { s: "neg", sw: 6 });
  const second = G(g), ly2 = ly + lh + 36;
  lock(second, ly2);
  R(second, sx - 15, ly2 + 22, 30, 52, { r: 7, s: "ink", sw: 3 }); C(second, sx, ly2 + 66, 2.5, { f: "ink" });
  const second_turning = G(g); sliver(second_turning, "accent"); knob(second_turning);
  const top = G(g);
  if (opts.name) {
    R(top, x0 + 40, 76, x1 - x0 - 80, 50, { r: 6, f: "surface2", s: "line", sw: 2 });
    T(top, opts.name, (x0 + x1) / 2, 112, 32, "ink", "middle");
  }
  if (opts.shade) R(top, 0, 0, W, H, { f: "field", o: opts.shade });
  const set = h.states({ shut: [], turning: [turning], cracked: [cracked], forced: [forced], refused: [refused], second_lock: [second], second_turning: [second, second_turning] }, opts.state || "shut");
  return { g, w: W * r.s, h: H * r.s, lockAt: { x: sx * r.s, y: sy * r.s }, setState: set };
};

// ---------------- login_screen: 1000 x 640 monitor on a desk, lamp left. opts {w|scale, state}
Loom.lesson.login_screen = function (ctx, parent, opts) {
  opts = opts || {};
  const h = Loom.lesson._h(ctx), { R, P, L, C, E, G, T, mix } = h;
  const r = h.root(parent, opts, 1000, 640), g = r.g;
  // desk, lamp, flat cone and pool (hard shapes)
  R(g, 0, 540, 1000, 100, { f: "surface" });
  L(g, 0, 541, 1000, 541, { s: "ink", sw: 2, o: 0.25 });
  P(g, "M180 222 L206 222 L350 556 L10 556 Z", { f: "ink", o: 0.07 });
  E(g, 190, 592, 190, 24, { f: mix("surface", "ink", 0.14) });
  E(g, 120, 548, 52, 9, { f: "shadow" });
  P(g, "M120 546 L92 340 L176 196", { s: "line", sw: 7 });
  P(g, "M132 168 L222 156 L252 214 L150 230 Z", { f: "surface2", s: "ink", sw: 2 });
  C(g, 192, 226, 8, { f: "ink" });
  // monitor, three-quarter: the whole face skewed a little, side slab at right
  E(g, 640, 548, 120, 10, { f: "shadow", o: 0.8 });
  R(g, 610, 470, 60, 70, { f: "surface2" });
  R(g, 530, 530, 220, 16, { r: 6, f: "surface2", s: "line", sw: 2 });
  const m = G(g, { transform: "translate(300 60) skewY(2.5)" });
  P(m, "M660 8 L690 20 L690 402 L660 410 Z", { f: "surface2", s: "line", sw: 2 });
  R(m, 0, 0, 660, 410, { r: 10, f: "shadow", s: "line", sw: 2 });
  L(m, 2, 10, 2, 400, { s: "ink", sw: 3, o: 0.4 });
  const s = G(m, { transform: "translate(24 22)" });
  R(s, 0, 0, 612, 366, { f: "surface2" });
  R(s, 0, 0, 612, 56, { f: "surface" });
  T(s, "02:00", 584, 39, 32, "muted", "end");
  R(s, 46, 78, 520, 268, { r: 10, f: "surface" });
  T(s, "Work sign-in", 74, 128, 36, "ink");
  R(s, 74, 146, 464, 54, { r: 6, f: "surface2", s: "line", sw: 2 });
  T(s, "dana", 94, 184, 32, "ink");
  R(s, 74, 212, 464, 54, { r: 6, f: "surface2", s: "line", sw: 2 });
  const dots = []; for (let i = 0; i < 9; i++) dots.push(C(s, 100 + i * 30, 239, 8, { f: "ink", o: 1 }));
  dots.forEach((d) => d.setAttribute("opacity", 0));
  const ok = G(s), no = G(s);
  P(ok, "M78 312 L92 326 L116 298", { s: "muted", sw: 5 });
  T(ok, "Login successful", 130, 322, 34, "ink");
  T(no, "Access denied", 74, 322, 34, "ink");
  R(no, 74, 334, 252, 5, { r: 2, f: "pos" });
  const set = h.states({ empty: [], typing: [], success: [ok], denied: [no] }, "empty");
  const sk = (x, y) => ({ x: (300 + 24 + x) * r.s, y: (60 + 22 + y + 0.0437 * (24 + x)) * r.s });
  const setState = (name, t) => {
    set(name, t);
    dots.forEach((d, i) => {
      const on = name === "empty" ? 0 : 1, at = name === "typing" ? t + i * 0.12 : t;
      if (t == null) d.setAttribute("opacity", on); else Loom.tl.set(d, { opacity: on }, at);
    });
  };
  if (opts.state) setState(opts.state, null);
  return { g, w: 1000 * r.s, h: 640 * r.s, at: { password: sk(300, 239), username: sk(300, 173), status: sk(74, 316), clock: sk(584, 28) }, dots, setState };
};
// ---------------- bedside_phone: with nightstand 560 x 820, without (opts.stand === false) 360 x 660. opts {w|scale, stand, tilt, state}
Loom.lesson.bedside_phone = function (ctx, parent, opts) {
  opts = opts || {};
  const h = Loom.lesson._h(ctx), { R, P, L, C, E, G, T, mix } = h;
  const stand = opts.stand !== false, W = stand ? 560 : 360, H = stand ? 820 : 660;
  const r = h.root(parent, opts, W, H), g = r.g;
  if (stand) {
    E(g, 280, 706, 190, 16, { f: "shadow", o: 0.8 });
    P(g, "M70 610 L490 610 L560 706 L0 706 Z", { f: "surface" });
    L(g, 70, 610, 0, 706, { s: "ink", sw: 3, o: 0.35 });
    R(g, 0, 706, 560, 114, { f: "surface2" });
    R(g, 60, 736, 440, 56, { r: 6, s: "line", sw: 2, o: 0.7 });
  }
  const tilt = opts.tilt != null ? opts.tilt : (stand ? -5 : 0);
  const ph = G(g, { transform: `translate(${stand ? 100 : 0} ${stand ? 40 : 0}) rotate(${tilt} 180 330)` });
  R(ph, 0, 0, 360, 660, { r: 38, f: "surface2", s: "line", sw: 2 });
  L(ph, 3, 40, 3, 620, { s: "ink", sw: 3, o: 0.4 });
  R(ph, 18, 18, 324, 624, { r: 24, f: "shadow" });
  const lit = G(ph), card = G(ph), p1 = G(ph), p2 = G(ph), press = G(ph), den = G(ph), mfa = G(ph);
  R(lit, 18, 18, 324, 624, { r: 24, f: mix("surface2", "accent3", 0.22) });
  R(p2, 76, 98, 208, 44, { r: 12, f: "surface", s: "line", sw: 2, o: 0.6 });
  R(p1, 58, 122, 244, 44, { r: 12, f: "surface", s: "line", sw: 2, o: 0.85 });
  R(card, 40, 150, 280, 372, { r: 18, f: "surface", s: "line", sw: 2 });
  T(card, "Approve?", 180, 236, 46, "ink", "middle");
  R(card, 62, 300, 236, 76, { r: 12, f: "surface2", s: "line", sw: 2 });
  T(card, "Approve", 180, 350, 32, "ink", "middle");
  R(card, 62, 408, 236, 76, { r: 12, f: "accent" });
  T(card, "Deny", 180, 458, 32, "onAccent", "middle");
  R(press, 56, 402, 248, 88, { r: 16, s: "ink", sw: 4 });
  C(den, 180, 280, 46, { f: "pos" });
  P(den, "M158 280 L174 296 L204 262", { s: "onAccent", sw: 8 });
  T(den, "Reported", 180, 398, 46, "pos", "middle");
  R(mfa, 18, 18, 324, 624, { r: 24, f: "ink" });
  C(mfa, 180, 280, 50, { f: "pos" });
  P(mfa, "M156 280 L173 297 L206 260", { s: "onAccent", sw: 9 });
  T(mfa, "MFA on", 180, 410, 56, "field", "middle");
  const set = h.states({ dark: [], prompt: [lit, card], prompt2: [lit, p1, card], prompt3: [lit, p1, p2, card], pressed: [lit, card, press], denied: [lit, den], mfa_on: [mfa] }, opts.state || "dark");
  const o = stand ? { x: 100, y: 40 } : { x: 0, y: 0 };
  return { g, w: W * r.s, h: H * r.s, at: { deny: { x: (o.x + 180) * r.s, y: (o.y + 446) * r.s }, screen: { x: (o.x + 180) * r.s, y: (o.y + 330) * r.s } }, setState: set };
};
// ---------------- password_vault: 440 x 260, safe at left, a fresh card slides out of the right slot. opts {w|scale, seed, state}
Loom.lesson.password_vault = function (ctx, parent, opts) {
  opts = opts || {};
  const h = Loom.lesson._h(ctx), { R, L, C, G } = h;
  const r = h.root(parent, opts, 440, 260), g = r.g;
  const half = G(g), out = G(g);
  Loom.lesson.keycard(ctx, half, { x: 188, y: 108, w: 132, state: "fresh", seed: opts.seed || "fresh" });
  Loom.lesson.keycard(ctx, out, { x: 290, y: 108, w: 132, state: "fresh", seed: opts.seed || "fresh" });
  R(g, 0, 20, 250, 220, { r: 14, f: "surface", s: "line", sw: 2 });
  L(g, 4, 34, 4, 226, { s: "ink", sw: 3, o: 0.4 }); L(g, 14, 22, 236, 22, { s: "ink", sw: 3, o: 0.4 });
  R(g, 20, 42, 190, 176, { r: 8, f: "surface2" });
  C(g, 112, 130, 46, { f: "surface", s: "line", sw: 4 });
  L(g, 112, 130, 112, 98, { s: "ink", sw: 4 }); C(g, 112, 130, 6, { f: "ink" });
  R(g, 238, 104, 12, 92, { r: 3, f: "shadow" });
  R(g, 40, 236, 170, 10, { r: 4, f: "shadow", o: 0.8 });
  const set = h.states({ closed: [], issuing: [half], done: [out] }, opts.state || "closed");
  return { g, w: 440 * r.s, h: 260 * r.s, cardAt: { x: 290 * r.s, y: 108 * r.s }, setState: set };
};
