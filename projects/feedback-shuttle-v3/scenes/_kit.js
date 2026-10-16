Loom.lesson = Loom.lesson || {};
(function () {
  const L = Loom.lesson;
  let UID = 0;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const ease = (p) => (p <= 0 ? 0 : p >= 1 ? 1 : p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
  const svg = (tag, attrs, parent) => Loom.svg(tag, attrs || {}, parent);
  const dd = (ctx, n, d) => { try { const v = ctx.style.dur(n); return typeof v === "number" && v > 0 ? v : d; } catch (e) { return d; } };
  function rgb(h) { const m = /^#([0-9a-fA-F]{6})$/.exec(String(h)); if (!m) return null; const n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function mixc(ctx, a, b, p) {
    const ca = ctx.c(a), cb = ctx.c(b), ra = rgb(ca), rb = rgb(cb);
    if (p <= 0) return ca; if (p >= 1) return cb;
    if (!ra || !rb) return p > 0.5 ? cb : ca;
    return "rgb(" + [0, 1, 2].map((i) => Math.round(ra[i] + (rb[i] - ra[i]) * p)).join(",") + ")";
  }
  function machine(ctx, P0, defs, draw, dflt) {
    const kfs = {}; const key = "kit" + (++UID);
    const val = (k, T) => {
      let v = P0[k]; const a = kfs[k]; if (!a) return v;
      for (const f of a) { if (T >= f.t1) v = f.to; else if (T > f.t0) { v = f.from + (f.to - f.from) * ease((T - f.t0) / (f.t1 - f.t0)); break; } else break; }
      return v;
    };
    const at = (T) => { const P = {}; for (const k in P0) P[k] = val(k, T); draw(P); };
    const apply = (name, t, dur) => {
      const d = defs[name]; if (!d) return false;
      const D = dur === undefined || dur === null ? dflt : dur;
      for (const k in d) {
        let s = d[k], to = s, a = 0, b = 1;
        if (Array.isArray(s)) { to = s[0]; a = s[1]; b = s[2]; }
        const t0 = t + a * D, t1 = Math.max(t + b * D, t0 + 1e-4);
        const from = val(k, t0);
        (kfs[k] = kfs[k] || []).push({ t0, t1, from, to });
        kfs[k].sort((x, y) => x.t0 - y.t0);
      }
      return D;
    };
    const setState = (name, t, dur) => {
      const D = apply(name, t, dur); if (D === false) return;
      const D2 = Math.max(D, 0.02);
      Loom.drive((e, raw) => at(t + raw * D2), t, D2, "linear", { key });
    };
    return { setState, at, init(name) { if (name) apply(name, -1000, 0); at(-1e6); } };
  }

  Loom.lesson.wall_clock = function (ctx, parent, opts) {
    const o = opts || {};
    const g = svg("g", { transform: "scale(" + ((o.w || 180) / 180) + ")" }, parent);
    svg("circle", { cx: 90, cy: 90, r: 80, fill: ctx.c("surface"), stroke: ctx.c("ink"), "stroke-width": 5 }, g);
    for (let i = 1; i < 12; i++) { if (i % 3 === 0) { const a = i * 30 * Math.PI / 180; svg("line", { x1: 90 + 66 * Math.sin(a), y1: 90 - 66 * Math.cos(a), x2: 90 + 74 * Math.sin(a), y2: 90 - 74 * Math.cos(a), stroke: ctx.c("muted"), "stroke-width": 4, "stroke-linecap": "round" }, g); } }
    const arc = svg("path", { d: "", fill: ctx.c("muted") }, g);
    svg("line", { x1: 90, y1: 8, x2: 90, y2: 28, stroke: ctx.c("ink"), "stroke-width": 8, "stroke-linecap": "round" }, g);
    svg("line", { x1: 90, y1: 90, x2: 90, y2: 56, stroke: ctx.c("ink"), "stroke-width": 7, "stroke-linecap": "round", transform: "rotate(-150 90 90)" }, g);
    const min = svg("line", { x1: 90, y1: 90, x2: 90, y2: 28, stroke: ctx.c("ink"), "stroke-width": 5, "stroke-linecap": "round" }, g);
    svg("circle", { cx: 90, cy: 90, r: 7, fill: ctx.c("ink") }, g);
    const mut = o.muted ? 0 : 1;
    const P0 = { ang: -14, arc: 0, arcAcc: mut, hAcc: 0 };
    const defs = {
      on_time: { ang: -14, arc: 0, hAcc: 0 },
      over: { ang: 120, arc: 0, hAcc: 0 },
      overrun_arc: { ang: 120, arc: 1, arcAcc: mut, hAcc: 0 },
      overrun_arc_muted: { ang: 120, arc: 1, arcAcc: 0, hAcc: 0 },
      at_end: { ang: 0, arc: 0, hAcc: 1 },
    };
    const pt = (a, r) => { const q = a * Math.PI / 180; return [90 + r * Math.sin(q), 90 - r * Math.cos(q)]; };
    const M = machine(ctx, P0, defs, (P) => {
      min.setAttribute("transform", "rotate(" + P.ang.toFixed(2) + " 90 90)");
      min.setAttribute("stroke", mixc(ctx, "ink", "accent", P.hAcc));
      const end = Math.min(120 * P.arc, Math.max(P.ang, 0));
      if (end < 0.5) arc.setAttribute("d", ""); else {
        const a = pt(0, 66), b = pt(end, 66);
        arc.setAttribute("d", "M90 90 L" + a[0].toFixed(2) + " " + a[1].toFixed(2) + " A66 66 0 " + (end > 180 ? 1 : 0) + " 1 " + b[0].toFixed(2) + " " + b[1].toFixed(2) + " Z");
      }
      arc.setAttribute("fill", mixc(ctx, "muted", "accent", P.arcAcc));
      arc.setAttribute("fill-opacity", (0.5 + 0.35 * P.arcAcc).toFixed(2));
    }, dd(ctx, "move", 0.9));
    M.init(o.state || "on_time");
    return { g, minute: min, arc, setState: M.setState, at: M.at, states: Object.keys(defs) };
  };

  Loom.lesson.label_tag = function (ctx, parent, opts) {
    const o = opts || {};
    const out = svg("g", { transform: "scale(" + ((o.w || 320) / 320) + ")" }, parent);
    const g = svg("g", {}, out);
    svg("rect", { x: 0, y: 0, width: 320, height: 120, rx: 10, fill: ctx.c("surface"), stroke: ctx.c("ink"), "stroke-width": 5 }, g);
    svg("rect", { x: 5, y: 92, width: 310, height: 23, rx: 6, fill: ctx.c("field2"), opacity: 0.55 }, g);
    svg("circle", { cx: 32, cy: 60, r: 9, fill: ctx.c("field"), stroke: ctx.c("ink"), "stroke-width": 3 }, g);
    const tx = ctx.kit.text(g, o.text || "You're disorganised", { role: "label", x: 56, y: 10, w: 244, h: 100, align: "center", valign: "middle", maxLines: 2, color: "ink", weight: 400 });
    const peelCorner = svg("path", { d: "M320 80 L284 120 L320 120 Z", fill: ctx.c("field2"), stroke: ctx.c("ink"), "stroke-width": 4, "stroke-linejoin": "round", opacity: 0 }, g);
    const cross = svg("g", { opacity: 0 }, g);
    const c1 = svg("line", { x1: 120, y1: 14, x2: 200, y2: 106, stroke: ctx.c("neg"), "stroke-width": 12, "stroke-linecap": "round", pathLength: 1, "stroke-dasharray": 1, "stroke-dashoffset": 1 }, cross);
    const c2 = svg("line", { x1: 200, y1: 14, x2: 120, y2: 106, stroke: ctx.c("neg"), "stroke-width": 12, "stroke-linecap": "round", pathLength: 1, "stroke-dasharray": 1, "stroke-dashoffset": 1 }, cross);
    const P0 = { rot: -7, sc: 1, dy: 0, dx: 0, op: 1, cross: 0, curl: 0 };
    const defs = {
      in_hand: { rot: -7, sc: 1, dy: 0, dx: 0, op: 1, cross: 0, curl: 0 },
      stuck: { rot: 4, sc: 0.94, dy: 0, dx: 0, op: 1, curl: [0.25, 0.4, 1] },
      crossed: { cross: 1 },
      peeling: { rot: 34, dy: 260, dx: 40, op: [0, 0.55, 1], curl: [1, 0, 0.3], cross: [0, 0.7, 1] },
    };
    const M = machine(ctx, P0, defs, (P) => {
      g.setAttribute("transform", "translate(" + (160 + P.dx).toFixed(2) + " " + (60 + P.dy).toFixed(2) + ") rotate(" + P.rot.toFixed(2) + ") scale(" + P.sc.toFixed(3) + ") translate(-160 -60)");
      g.setAttribute("opacity", P.op.toFixed(3));
      peelCorner.setAttribute("opacity", P.curl.toFixed(3));
      const a = clamp(P.cross * 2, 0, 1), b = clamp(P.cross * 2 - 1, 0, 1);
      cross.setAttribute("opacity", P.cross > 0 ? 1 : 0);
      c1.setAttribute("stroke-dashoffset", (1 - a).toFixed(3)); c2.setAttribute("stroke-dashoffset", (1 - b).toFixed(3));
    }, dd(ctx, "move", 0.6));
    M.init(o.state || "in_hand");
    return { g, text: tx, setState: M.setState, at: M.at, states: Object.keys(defs) };
  };

  Loom.lesson.timed_agenda = function (ctx, parent, opts) {
    const o = opts || {};
    const out = svg("g", { transform: "scale(" + ((o.w || 360) / 360) + ")" }, parent);
    const g = svg("g", {}, out);
    const sheet = svg("rect", { x: 0, y: 0, width: 360, height: 300, rx: 10, fill: ctx.c("surface"), stroke: ctx.c("ink"), "stroke-width": 5 }, g);
    const title = svg("g", {}, g);
    ctx.kit.text(title, o.title || "Agenda", { role: "label", x: 28, y: 16, w: 300, h: 56, align: "left", valign: "middle", maxLines: 1, color: "ink", weight: 400 });
    svg("line", { x1: 28, y1: 78, x2: 332, y2: 78, stroke: ctx.c("muted"), "stroke-width": 3, "stroke-linecap": "round" }, g);
    const titleBar = svg("line", { x1: 28, y1: 40, x2: 150, y2: 40, stroke: ctx.c("ink"), "stroke-width": 10, "stroke-linecap": "round", opacity: 0 }, g);
    const fr = [0.42, 0.72, 0.3], fills = [], tracks = [];
    [112, 168, 224].forEach((y, i) => {
      svg("circle", { cx: 44, cy: y + 18, r: 9, fill: ctx.c("ink") }, g);
      tracks.push(svg("rect", { x: 78, y: y, width: 254, height: 36, rx: 8, fill: ctx.c("surface"), stroke: ctx.c("ink"), "stroke-width": 4 }, g));
      fills.push(svg("rect", { x: 82, y: y + 4, width: 0, height: 28, rx: 5, fill: ctx.c("accent3") }, g));
    });
    const pin = svg("g", { opacity: 0 }, g);
    svg("circle", { cx: 180, cy: 6, r: 12, fill: ctx.c("muted"), stroke: ctx.c("ink"), "stroke-width": 4 }, pin);
    const P0 = { f1: 0, f2: 0, f3: 0, sc: 1, rot: 0, pin: 0, thumb: 0 };
    const defs = {
      blank: { f1: 0, f2: 0, f3: 0, sc: 1, rot: 0, pin: 0, thumb: 0 },
      filling: { f1: [1, 0, 0.4], f2: [1, 0.3, 0.7], f3: [1, 0.6, 1] },
      pinned: { f1: 1, f2: 1, f3: 1, sc: 0.62, rot: -2, pin: 1, thumb: 0 },
      thumb: { f1: 1, f2: 1, f3: 1, sc: 0.42, rot: 0, pin: 0, thumb: 1 },
    };
    const M = machine(ctx, P0, defs, (P) => {
      const sc = P.sc, k = Math.max(1, Math.min(1 / sc, 2));
      g.setAttribute("transform", "translate(180 0) rotate(" + P.rot.toFixed(2) + ") scale(" + sc.toFixed(3) + ") translate(-180 0)");
      sheet.setAttribute("stroke-width", (5 * k).toFixed(2));
      tracks.forEach((t) => t.setAttribute("stroke-width", (4 * k).toFixed(2)));
      [P.f1, P.f2, P.f3].forEach((f, i) => fills[i].setAttribute("width", Math.max(0, 246 * fr[i] * f).toFixed(2)));
      title.setAttribute("opacity", (1 - P.thumb).toFixed(2)); titleBar.setAttribute("opacity", P.thumb.toFixed(2));
      pin.setAttribute("opacity", P.pin.toFixed(2));
    }, dd(ctx, "move", 0.9));
    M.init(o.state || "blank");
    return { g, fills, setState: M.setState, at: M.at, states: Object.keys(defs) };
  };

  Loom.lesson.message_card = function (ctx, parent, opts) {
    const o = opts || {};
    const TXT = { vague: o.vague || "Maybe tighten it up?", l1: o.line1 || "Tuesday's meeting ran twenty minutes over.", l2: o.line2 || "Two people missed their next call.", l3: o.line3 || "Could we try a timed agenda?", rw: o.rewrite || null };
    const id = "mc" + (++UID);
    const g = svg("g", {}, parent);
    const defsEl = svg("defs", {}, g);
    const INK = ctx.c("ink");
    let fs = 32;
    try { fs = Math.min.apply(null, [TXT.l1, TXT.l2, TXT.l3].map((s) => ctx.kit.fit(s, { role: "body", w: 520, h: 92, maxLines: 2 }).size)); } catch (e) { fs = 32; }
    const tailD = svg("path", { d: "M190 305 L108 376 L266 305", fill: "none", stroke: INK, "stroke-width": 5, "stroke-dasharray": "14 11", "stroke-linecap": "round", "stroke-linejoin": "round", opacity: 0 }, g);
    const tailG = svg("g", {}, g);
    svg("path", { d: "M190 305 L108 376 L266 305 Z", fill: ctx.c("surface"), stroke: INK, "stroke-width": 5, "stroke-linejoin": "round" }, tailG);
    const body = svg("rect", { x: 130, y: 115, width: 560, height: 190, rx: 44, fill: ctx.c("surface"), stroke: INK, "stroke-width": 5 }, g);
    svg("line", { x1: 194, y1: 305, x2: 262, y2: 305, stroke: ctx.c("surface"), "stroke-width": 8 }, tailG);
    const dash = svg("rect", { x: 130, y: 115, width: 560, height: 190, rx: 44, fill: "none", stroke: INK, "stroke-width": 5, "stroke-dasharray": "18 12", "stroke-linecap": "round", opacity: 0 }, g);
    const vagG = svg("g", {}, g);
    const vagT = ctx.kit.text(vagG, TXT.vague, { role: "lead", x: 150, y: 115, w: 520, h: 190, align: "center", valign: "middle", maxLines: 2, color: "ink" });
    const rows = svg("g", { opacity: 0 }, g), RY = [42, 158, 274], RH = 104, RX = 28, RW = 764;
    const R = [], texts = [], txtG = [];
    RY.forEach((y) => {
      const dsh = svg("rect", { x: RX, y, width: RW, height: RH, rx: 10, fill: "none", stroke: ctx.c("muted"), "stroke-width": 4, "stroke-dasharray": "14 10", "stroke-linecap": "round" }, rows);
      const sol = svg("rect", { x: RX, y, width: RW, height: RH, rx: 10, fill: ctx.c("field"), stroke: INK, "stroke-width": 3.5, opacity: 0 }, rows);
      R.push({ dsh, sol });
    });
    const ring = svg("rect", { x: RX, y: RY[2], width: RW, height: RH, rx: 10, fill: "none", stroke: ctx.c("accent"), "stroke-width": 5, opacity: 0 }, rows);
    const clips = [];
    [0, 1, 2].forEach((i) => {
      const cp = svg("clipPath", { id: id + "c" + i }, defsEl);
      clips.push(svg("rect", { x: RX + 16, y: RY[i], width: 0, height: RH }, cp));
    });
    [TXT.l1, TXT.l2, TXT.l3].forEach((s, i) => {
      const cg = svg("g", { "clip-path": "url(#" + id + "c" + i + ")" }, rows);
      const tg = svg("g", {}, cg);
      texts.push(ctx.kit.text(tg, s, { role: "body", x: RX + 24, y: RY[i] + 6, w: 520, h: RH - 12, align: "left", valign: "middle", maxLines: 2, size: fs, color: "ink" }));
      txtG.push(tg);
    });
    const strike = svg("line", { x1: RX + 20, y1: RY[2] + RH / 2, x2: RX + 20, y2: RY[2] + RH / 2, stroke: ctx.c("muted"), "stroke-width": 6, "stroke-linecap": "round" }, rows);
    const rwG = svg("g", { opacity: 0 }, rows);
    const rcp = svg("clipPath", { id: id + "r" }, defsEl);
    const rwClip = svg("rect", { x: RX + 16, y: RY[2], width: 0, height: RH }, rcp);
    const rwC = svg("g", { "clip-path": "url(#" + id + "r)" }, rwG);
    if (TXT.rw) ctx.kit.text(rwC, TXT.rw, { role: "body", x: RX + 24, y: RY[2] + 6, w: 520, h: RH - 12, align: "left", valign: "middle", maxLines: 2, size: fs, color: "accent" });
    else { let d = "M" + (RX + 28) + " " + (RY[2] + 52); for (let k = 0; k < 12; k++) d += " q 20 -22 40 0 t 40 0"; svg("path", { d, fill: "none", stroke: ctx.c("accent"), "stroke-width": 6, "stroke-linecap": "round", "stroke-linejoin": "round" }, rwC); }
    const chip = (x, y, s) => { const c = svg("g", { opacity: 0 }, rows); svg("rect", { x, y, width: 180, height: 60, rx: 10, fill: ctx.c("field2"), stroke: INK, "stroke-width": 3 }, c); ctx.kit.text(c, s, { role: "label", x: x + 8, y: y + 7, w: 164, h: 46, align: "center", valign: "middle", maxLines: 1, color: "ink", weight: 400 }); return c; };
    const cs1 = chip(600, RY[0] - 14, "Situation"), cb1 = chip(600, RY[0] + 48, "Behaviour"), ci2 = chip(600, RY[1] + 22, "Impact");
    const head = svg("g", { opacity: 0 }, g);
    ctx.kit.text(head, "Situation, Behaviour, Impact (SBI)", { role: "label", x: 0, y: -62, w: 820, h: 52, align: "center", valign: "middle", maxLines: 1, color: "ink", weight: 400 });
    const tick = svg("g", { opacity: 0 }, rows);
    svg("circle", { cx: 706, cy: RY[2] + RH / 2, r: 31, fill: ctx.c("surface"), stroke: ctx.c("pos"), "stroke-width": 6 }, tick);
    svg("path", { d: "M690 " + (RY[2] + 52) + " l12 13 l22 -26", fill: "none", stroke: ctx.c("pos"), "stroke-width": 10, "stroke-linecap": "round", "stroke-linejoin": "round" }, tick);
    const m4 = svg("g", { opacity: 0 }, g), Y4 = [38, 122, 206, 290], F4 = ["Behaviour", "Impact", "Next step", "Ask"], q4 = [];
    Y4.forEach((y, i) => {
      const r = svg("rect", { x: 28, y, width: 764, height: 72, rx: 10, fill: "none", stroke: ctx.c("muted"), "stroke-width": 4, "stroke-dasharray": "14 10", "stroke-linecap": "round" }, m4);
      const dsl = svg("rect", { x: 330, y: y + 14, width: 440, height: 44, rx: 8, fill: "none", stroke: ctx.c("muted"), "stroke-width": 3, "stroke-dasharray": "8 9", "stroke-linecap": "round", opacity: 0.7 }, m4);
      const t = ctx.kit.text(m4, F4[i], { role: "label", x: 52, y, w: 270, h: 72, align: "left", valign: "middle", maxLines: 1, color: "ink", weight: 400 });
      q4.push({ r, dsl, t });
    });
    const base = { morph: 1, tail: 0, vag: 0, vagDy: 0, vagAcc: 1, hollow: 0, hAcc: 1, rowsOp: 0, s1: 0, s2: 0, s3: 0, a1: 0, a2: 0, a3: 0, r1: 0, r2: 0, r3: 0, o3: 0, pu: 0, tg1: 0, tg2: 0, hd: 0, tick: 0, st: 0, rw: 0, tx3: 1, sc: 1, m4: 0, l1: 0, l2: 0, l3: 0, l4: 0 };
    const S = {};
    S.vague = Object.assign({}, base, { morph: 0, tail: 1, vag: 1 });
    S.empty = Object.assign({}, S.vague, { vag: [0, 0, 0.45], vagDy: [-18, 0, 0.45], hollow: [1, 0.35, 1] });
    S.card = Object.assign({}, base, { tail: [0, 0, 0.4], vag: [0, 0, 0.3], rowsOp: [1, 0.45, 1], morph: [1, 0, 0.7] });
    S.line1 = Object.assign({}, S.card, { rowsOp: 1, s1: [1, 0, 0.3], a1: 1, r1: [1, 0.1, 1] });
    S.line2 = Object.assign({}, S.line1, { a1: [0, 0, 0.3], s2: [1, 0, 0.3], a2: 1, r2: [1, 0.1, 1] });
    S.tags = Object.assign({}, S.line2, { a2: [0, 0, 0.3], tg1: [1, 0, 0.4], tg2: [1, 0.25, 0.65], hd: [1, 0.5, 1] });
    S.slot3_open = Object.assign({}, S.tags, { tg1: 1, tg2: 1, hd: 1, o3: [1, 0, 0.4], pu: [1, 0, 1] });
    S.line3 = Object.assign({}, S.slot3_open, { hd: [0, 0, 0.4], o3: [0, 0, 0.3], s3: [1, 0, 0.3], a3: 1, r3: [1, 0.1, 1] });
    S.agreed = Object.assign({}, S.line3, { a3: [0, 0.3, 1], tick: [1, 0, 0.5] });
    S.small = Object.assign({}, S.agreed, { sc: 0.634, tg1: 0, tg2: 0, hd: 0, tick: 0, a3: 0 });
    S.strike3 = Object.assign({}, S.small, { st: [1, 0, 0.7], a3: [0, 0, 0.5] });
    S.rewrite3 = Object.assign({}, S.strike3, { st: [0, 0, 0.3], tx3: [0, 0, 0.3], rw: [1, 0.2, 1] });
    S.small_agreed = Object.assign({}, S.rewrite3, { tick: [1, 0, 0.5] });
    S.blank_four = Object.assign({}, base, { m4: 1 });
    [1, 2, 3, 4].forEach((n) => { const d = Object.assign({}, S.blank_four); [1, 2, 3, 4].forEach((k) => { d["l" + k] = k === n ? 1 : 0; }); S["light_" + n] = d; });
    S.settle_four = Object.assign({}, S.blank_four);
    const lerp = (a, b, v) => a + (b - a) * v;
    const M = machine(ctx, base, S, (P) => {
      const k = o.w ? o.w / 820 : 1;
      g.setAttribute("transform", (k !== 1 ? "scale(" + k + ") " : "") + "translate(410 210) scale(" + P.sc.toFixed(4) + ") translate(-410 -210)");
      const m = P.morph, a = [lerp(130, 0, m), lerp(115, 0, m), lerp(560, 820, m), lerp(190, 420, m), lerp(44, 10, m)];
      [body, dash].forEach((e) => { e.setAttribute("x", a[0].toFixed(2)); e.setAttribute("y", a[1].toFixed(2)); e.setAttribute("width", a[2].toFixed(2)); e.setAttribute("height", a[3].toFixed(2)); e.setAttribute("rx", a[4].toFixed(2)); });
      body.setAttribute("fill-opacity", (1 - P.hollow).toFixed(3)); body.setAttribute("stroke-opacity", (1 - P.hollow).toFixed(3));
      dash.setAttribute("opacity", P.hollow.toFixed(3)); dash.setAttribute("stroke", mixc(ctx, "ink", "accent", P.hAcc));
      tailG.setAttribute("opacity", (P.tail * (1 - P.hollow)).toFixed(3)); tailD.setAttribute("opacity", (P.tail * P.hollow).toFixed(3)); tailD.setAttribute("stroke", mixc(ctx, "ink", "accent", P.hAcc));
      vagG.setAttribute("opacity", P.vag.toFixed(3)); vagG.setAttribute("transform", "translate(0 " + P.vagDy.toFixed(2) + ")");
      vagT.setAttribute("fill", mixc(ctx, "ink", "accent", P.vagAcc));
      rows.setAttribute("opacity", P.rowsOp.toFixed(3));
      const s = [P.s1, P.s2, P.s3], ac = [P.a1, P.a2, P.a3], rv = [P.r1, P.r2, P.r3];
      for (let i = 0; i < 3; i++) {
        R[i].sol.setAttribute("opacity", s[i].toFixed(3)); R[i].sol.setAttribute("stroke", mixc(ctx, "ink", "accent", ac[i])); R[i].sol.setAttribute("stroke-width", (3.5 + 1.5 * ac[i]).toFixed(2));
        const open = i === 2 ? P.o3 : 0;
        R[i].dsh.setAttribute("opacity", (1 - s[i]).toFixed(3)); R[i].dsh.setAttribute("stroke", mixc(ctx, "muted", "accent", open)); R[i].dsh.setAttribute("stroke-width", (4 + 2 * open).toFixed(2));
        clips[i].setAttribute("width", (RW - 32) * rv[i]);
        texts[i].setAttribute("fill", mixc(ctx, "ink", "accent", ac[i]));
      }
      txtG[2].setAttribute("opacity", P.tx3.toFixed(3));
      texts[2].setAttribute("fill", P.st > 0.001 ? mixc(ctx, "ink", "muted", P.st) : mixc(ctx, "ink", "accent", P.a3));
      const f = P.pu - Math.floor(P.pu), pr = Math.sin(Math.PI * f);
      ring.setAttribute("opacity", (0.9 * pr).toFixed(3)); ring.setAttribute("x", RX - 14 * f); ring.setAttribute("y", RY[2] - 14 * f); ring.setAttribute("width", RW + 28 * f); ring.setAttribute("height", RH + 28 * f);
      const sw = Math.min(((texts[2].__fit && texts[2].__fit.width) || 400), 520);
      strike.setAttribute("x2", (RX + 20 + (sw + 8) * clamp(P.st, 0, 1)).toFixed(2)); strike.setAttribute("opacity", P.st > 0.001 ? 1 : 0);
      rwG.setAttribute("opacity", P.rw > 0.001 ? 1 : 0); rwClip.setAttribute("width", (RW - 32) * P.rw);
      const tg = (e, v) => { e.setAttribute("opacity", v.toFixed(3)); e.setAttribute("transform", "translate(0 " + ((1 - v) * -14).toFixed(2) + ")"); };
      tg(cs1, P.tg1); tg(cb1, P.tg1); tg(ci2, P.tg2); tg(head, P.hd);
      tick.setAttribute("opacity", P.tick.toFixed(3)); tick.setAttribute("transform", "translate(706 " + (RY[2] + 52) + ") scale(" + (0.6 + 0.4 * P.tick).toFixed(3) + ") translate(-706 " + -(RY[2] + 52) + ")");
      m4.setAttribute("opacity", P.m4.toFixed(3));
      const L4 = [P.l1, P.l2, P.l3, P.l4];
      q4.forEach((q, i) => { q.r.setAttribute("stroke", mixc(ctx, "muted", "accent", L4[i])); q.r.setAttribute("stroke-width", (4 + 2 * L4[i]).toFixed(2)); q.dsl.setAttribute("stroke", mixc(ctx, "muted", "accent", L4[i])); q.t.setAttribute("fill", mixc(ctx, "ink", "accent", L4[i])); });
    }, dd(ctx, "move", 0.8));
    M.init(o.state || "vague");
    return { g, body, rows, heading: head, setState: M.setState, at: M.at, states: Object.keys(S) };
  };

  // ---------- meeting_room (1920 x 1080). opts.layer: "back" (wall), "front" (the table that hides the bust bases), "all" ----------
  const ROOM = { asha: { x: 380, y: 620, size: 560 }, ben: { x: 1540, y: 620, size: 560 }, clock: { x: 1590, y: 80, w: 180, cx: 1680, cy: 170 }, card: { x: 550, y: 150, w: 820, h: 420, cx: 960, cy: 360 }, agenda_pin: { x: 1455, y: 80, w: 223 }, table_top: 900, extras: [{ x: 800, y: 900 }, { x: 1120, y: 900 }] };
  Loom.lesson.meeting_room = function (ctx, parent, opts) {
    const o = opts || {}, layer = o.layer || "all";
    const g = svg("g", {}, parent), INK = ctx.c("ink");
    const back = svg("g", {}, g), front = svg("g", {}, g);
    let chairs = null;
    if (layer !== "front") {
      svg("rect", { x: 0, y: 0, width: 1920, height: 1080, fill: ctx.c("surface2") }, back);
      svg("rect", { x: 0, y: 650, width: 1920, height: 260, fill: ctx.c("field") }, back);
      svg("line", { x1: 0, y1: 650, x2: 1920, y2: 650, stroke: INK, "stroke-width": 5 }, back);
      svg("rect", { x: 90, y: 100, width: 330, height: 200, rx: 8, fill: ctx.c("surface"), stroke: INK, "stroke-width": 5 }, back);
      svg("line", { x1: 255, y1: 100, x2: 255, y2: 300, stroke: INK, "stroke-width": 4 }, back);
      svg("line", { x1: 90, y1: 200, x2: 420, y2: 200, stroke: INK, "stroke-width": 4 }, back);
      svg("rect", { x: 78, y: 296, width: 354, height: 18, rx: 6, fill: ctx.c("field2"), stroke: INK, "stroke-width": 4 }, back);
      chairs = svg("g", { opacity: 0 }, back);
      [[690, 160], [1070, 160]].forEach((c) => {
        svg("rect", { x: c[0], y: 690, width: c[1], height: 230, rx: 34, fill: ctx.c("muted"), stroke: INK, "stroke-width": 5 }, chairs);
      });
      svg("rect", { x: 1830, y: 660, width: 90, height: 250, fill: ctx.c("field2"), stroke: INK, "stroke-width": 5 }, back);
    }
    if (layer !== "back") {
      svg("rect", { x: -20, y: 900, width: 1960, height: 56, fill: ctx.c("surface"), stroke: INK, "stroke-width": 5 }, front);
      svg("rect", { x: -20, y: 956, width: 1960, height: 140, fill: ctx.c("field2"), stroke: INK, "stroke-width": 5 }, front);
      svg("rect", { x: 1010, y: 850, width: 54, height: 50, rx: 8, fill: ctx.c("accent3"), stroke: INK, "stroke-width": 4 }, front);
      svg("path", { d: "M1064 862 q 22 0 22 18 q 0 18 -22 18", fill: "none", stroke: INK, "stroke-width": 4, "stroke-linecap": "round" }, front);
    }
    const P0 = { ch: 0 };
    const defs = { two_shot: { ch: 0 }, extras_space: { ch: 1 } };
    const M = machine(ctx, P0, defs, (P) => { if (chairs) chairs.setAttribute("opacity", P.ch.toFixed(3)); }, dd(ctx, "move", 0.6));
    M.init(o.state || "two_shot");
    return { g, back, front, anchors: ROOM, setState: M.setState, at: M.at, states: Object.keys(defs) };
  };
  Loom.lesson.meeting_room.anchors = ROOM;

  // ---------- quiet_corner (1920 x 1080), layers as the room ----------
  const CORNER = { asha: { x: 380, y: 620, size: 560 }, ben: { x: 1540, y: 620, size: 560 }, card: { cx: 960, cy: 667, w: 520, h: 266 }, sign: { x: 1370, y: 140, w: 300, h: 90 }, table_top: 900 };
  Loom.lesson.quiet_corner = function (ctx, parent, opts) {
    const o = opts || {}, layer = o.layer || "all";
    const g = svg("g", {}, parent), INK = ctx.c("ink");
    const back = svg("g", {}, g), front = svg("g", {}, g);
    if (layer !== "front") {
      svg("rect", { x: 0, y: 0, width: 1920, height: 1080, fill: ctx.c("surface2") }, back);
      svg("rect", { x: 0, y: 800, width: 1920, height: 280, fill: ctx.c("field2") }, back);
      svg("line", { x1: 0, y1: 800, x2: 1920, y2: 800, stroke: INK, "stroke-width": 5 }, back);
      svg("rect", { x: 770, y: 80, width: 380, height: 380, rx: 10, fill: ctx.c("surface"), stroke: INK, "stroke-width": 5 }, back);
      svg("line", { x1: 960, y1: 80, x2: 960, y2: 460, stroke: INK, "stroke-width": 4 }, back);
      svg("line", { x1: 770, y1: 270, x2: 1150, y2: 270, stroke: INK, "stroke-width": 4 }, back);
      svg("rect", { x: 756, y: 456, width: 408, height: 20, rx: 6, fill: ctx.c("field2"), stroke: INK, "stroke-width": 4 }, back);
      svg("rect", { x: 690, y: 70, width: 84, height: 420, rx: 10, fill: ctx.c("accent3"), stroke: INK, "stroke-width": 5 }, back);
      svg("rect", { x: 1146, y: 70, width: 84, height: 420, rx: 10, fill: ctx.c("accent3"), stroke: INK, "stroke-width": 5 }, back);
      svg("polygon", { points: "800,830 1010,830 1260,1080 930,1080", fill: ctx.c("surface"), opacity: 0.55 }, back);
      svg("rect", { x: 80, y: 360, width: 600, height: 560, rx: 70, fill: ctx.c("field2"), stroke: INK, "stroke-width": 5, transform: "rotate(5 380 900)" }, back);
      svg("rect", { x: 1240, y: 360, width: 600, height: 560, rx: 70, fill: ctx.c("field2"), stroke: INK, "stroke-width": 5, transform: "rotate(-5 1540 900)" }, back);
      svg("ellipse", { cx: 960, cy: 810, rx: 190, ry: 22, fill: ctx.c("shadow"), stroke: INK, "stroke-width": 5 }, back);
      svg("rect", { x: 938, y: 826, width: 44, height: 174, fill: ctx.c("shadow"), stroke: INK, "stroke-width": 5 }, back);
      svg("ellipse", { cx: 960, cy: 1004, rx: 120, ry: 16, fill: ctx.c("shadow"), stroke: INK, "stroke-width": 5 }, back);
    }
    if (layer !== "back") {
      svg("rect", { x: 60, y: 900, width: 660, height: 200, rx: 36, fill: ctx.c("field2"), stroke: INK, "stroke-width": 5 }, front);
      svg("rect", { x: 40, y: 800, width: 130, height: 300, rx: 44, fill: ctx.c("field2"), stroke: INK, "stroke-width": 5 }, front);
      svg("rect", { x: 620, y: 800, width: 130, height: 300, rx: 44, fill: ctx.c("field2"), stroke: INK, "stroke-width": 5 }, front);
      svg("rect", { x: 1200, y: 900, width: 660, height: 200, rx: 36, fill: ctx.c("field2"), stroke: INK, "stroke-width": 5 }, front);
      svg("rect", { x: 1170, y: 800, width: 130, height: 300, rx: 44, fill: ctx.c("field2"), stroke: INK, "stroke-width": 5 }, front);
      svg("rect", { x: 1750, y: 800, width: 130, height: 300, rx: 44, fill: ctx.c("field2"), stroke: INK, "stroke-width": 5 }, front);
    }
    return { g, back, front, anchors: CORNER, setState() {}, at() {}, states: ["corner"] };
  };
  Loom.lesson.quiet_corner.anchors = CORNER;

  // ---------- desk_set (1920 x 1080): nobody at it. note / gap / bubble / specific note by state ----------
  const DESK = { monitor: { x: 130, y: 170, w: 510, h: 340 }, card_space: { cx: 1010, cy: 510, w: 820, h: 420 }, note: { x: 420, y: 150, w: 300, h: 170 }, specific: { x: 700, y: 170, w: 580, h: 330 } };
  Loom.lesson.desk_set = function (ctx, parent, opts) {
    const o = opts || {}, INK = ctx.c("ink");
    const g = svg("g", {}, parent);
    const R = (a, par) => svg("rect", Object.assign({ stroke: INK, "stroke-width": 5 }, a), par || g);
    R({ x: 0, y: 0, width: 1920, height: 1080, fill: ctx.c("surface2"), stroke: "none" });
    R({ x: 1690, y: 330, width: 170, height: 340, rx: 50, fill: ctx.c("muted") });
    R({ x: 0, y: 650, width: 1920, height: 110, fill: ctx.c("surface") });
    R({ x: -10, y: 760, width: 1940, height: 340, fill: ctx.c("field2") });
    R({ x: 1260, y: 810, width: 520, height: 190, rx: 14, fill: ctx.c("field2") });
    svg("line", { x1: 1440, y1: 850, x2: 1600, y2: 850, stroke: INK, "stroke-width": 8, "stroke-linecap": "round" }, g);
    R({ x: 130, y: 170, width: 510, height: 340, rx: 18, fill: INK });
    R({ x: 150, y: 190, width: 470, height: 300, rx: 8, fill: ctx.c("surface2"), "stroke-width": 3 });
    R({ x: 355, y: 510, width: 60, height: 180, fill: INK });
    R({ x: 285, y: 690, width: 200, height: 26, rx: 12, fill: INK });
    R({ x: 1380, y: 626, width: 84, height: 90, rx: 14, fill: ctx.c("accent3") });
    svg("path", { d: "M1464 646 q 34 0 34 26 q 0 26 -34 26", fill: "none", stroke: INK, "stroke-width": 5, "stroke-linecap": "round" }, g);
    [[1600, 590, 24, 56, 0], [1556, 612, 22, 46, -30], [1644, 612, 22, 46, 30]].forEach((l) => svg("ellipse", { cx: l[0], cy: l[1], rx: l[2], ry: l[3], fill: ctx.c("accent4"), stroke: INK, "stroke-width": 4, transform: "rotate(" + l[4] + " " + l[0] + " " + (l[1] + 40) + ")" }, g));
    svg("path", { d: "M1540 716 L1560 636 L1640 636 L1660 716 Z", fill: ctx.c("muted"), stroke: INK, "stroke-width": 5, "stroke-linejoin": "round" }, g);
    // sticky note (Good job + thumbs-up) and the dashed gap under it
    const gap = svg("rect", { x: 430, y: 345, width: 280, height: 110, rx: 10, fill: "none", stroke: ctx.c("accent"), "stroke-width": 5, "stroke-dasharray": "14 10", "stroke-linecap": "round", opacity: 0 }, g);
    const note = svg("g", { opacity: 0 }, g);
    const ni = svg("g", { transform: "translate(420 150) rotate(-4 150 85)" }, note);
    R({ x: 0, y: 0, width: 300, height: 170, rx: 8, fill: ctx.c("surface") }, ni);
    try { ctx.kit.icon(ni, "thumbs-up", { x: 22, y: 50, size: 70, color: "ink" }); } catch (e) { svg("circle", { cx: 57, cy: 85, r: 30, fill: "none", stroke: INK, "stroke-width": 5 }, ni); }
    ctx.kit.text(ni, o.note || "Good job", { role: "label", x: 110, y: 40, w: 175, h: 90, align: "center", valign: "middle", maxLines: 2, color: "ink", weight: 400 });
    // plain speech bubble on the monitor
    const bub = svg("g", { opacity: 0 }, g);
    const bi = svg("g", { transform: "translate(190 250)" }, bub);
    svg("path", { d: "M70 190 L40 240 L130 190 Z", fill: ctx.c("surface"), stroke: INK, "stroke-width": 5, "stroke-linejoin": "round" }, bi);
    const bb = R({ x: 0, y: 0, width: 360, height: 190, rx: 40, fill: ctx.c("surface") }, bi);
    svg("line", { x1: 74, y1: 190, x2: 126, y2: 190, stroke: ctx.c("surface"), "stroke-width": 8 }, bi);
    const bt = ctx.kit.text(bi, o.bubble || "Great job", { role: "lead", x: 10, y: 14, w: 340, h: 90, align: "center", valign: "middle", maxLines: 1, color: "ink" });
    const hole = svg("rect", { x: 50, y: 116, width: 260, height: 50, rx: 10, fill: "none", stroke: ctx.c("muted"), "stroke-width": 4, "stroke-dasharray": "12 9", "stroke-linecap": "round", opacity: 0 }, bi);
    // the specific note, its agenda thumb and the joining line
    const sp = svg("g", { opacity: 0 }, g);
    const spb = R({ x: 700, y: 170, width: 580, height: 330, rx: 10, fill: ctx.c("surface"), stroke: ctx.c("accent") }, sp);
    ctx.kit.text(sp, o.heading || "What worked, so keep it", { role: "label", x: 730, y: 190, w: 520, h: 100, align: "left", valign: "middle", maxLines: 2, color: "ink", weight: 400 });
    const thumb = svg("g", { transform: "translate(950 320)", opacity: 0 }, g);
    L.timed_agenda(ctx, thumb, { state: "thumb" });
    const link = svg("path", { d: "M770 296 C770 380 900 395 1050 392", fill: "none", stroke: ctx.c("accent"), "stroke-width": 5, "stroke-linecap": "round", pathLength: 1, "stroke-dasharray": 1, "stroke-dashoffset": 1, opacity: 0 }, g);
    const z = { nt: 0, gp: 0, bb: 0, bm: 0, bh: 0, sn: 0, lk: 0, th: 0 };
    const st = (a) => Object.assign({}, z, a);
    const defs = {
      note_only: st({ nt: [1, 0, 1] }),
      thumbs_note: st({ nt: [1, 0, 0.5], gp: [1, 0.5, 1] }),
      great_bubble: st({ bb: [1, 0, 0.6], bh: [1, 0.6, 1] }),
      specific_note: st({ bb: 1, bh: 1, bm: [1, 0, 0.3], sn: [1, 0.1, 0.5], lk: [1, 0.55, 0.85], th: [1, 0.6, 1] }),
      card_space: st({}),
    };
    const M = machine(ctx, z, defs, (P) => {
      note.setAttribute("opacity", P.nt.toFixed(3)); note.setAttribute("transform", "translate(0 " + ((1 - P.nt) * -70).toFixed(2) + ")");
      gap.setAttribute("opacity", P.gp.toFixed(3));
      bub.setAttribute("opacity", P.bb.toFixed(3)); bub.setAttribute("transform", "translate(230 490) scale(" + (0.7 + 0.3 * P.bb).toFixed(3) + ") translate(-230 -490)");
      hole.setAttribute("opacity", P.bh.toFixed(3));
      bb.setAttribute("stroke", mixc(ctx, "ink", "muted", P.bm)); bt.setAttribute("fill", mixc(ctx, "ink", "muted", P.bm));
      sp.setAttribute("opacity", P.sn.toFixed(3)); sp.setAttribute("transform", "translate(0 " + ((1 - P.sn) * -70).toFixed(2) + ")");
      link.setAttribute("opacity", P.lk > 0.001 ? 1 : 0); link.setAttribute("stroke-dashoffset", (1 - P.lk).toFixed(3));
      thumb.setAttribute("opacity", P.th.toFixed(3));
    }, dd(ctx, "move", 0.8));
    M.init(o.state || "card_space");
    return { g, note, gap, bubble: bub, specific: sp, thumb, link, anchors: DESK, setState: M.setState, at: M.at, states: Object.keys(defs) };
  };
  Loom.lesson.desk_set.anchors = DESK;

  // ---------- handover_check (1920 x 1080): desk top, handover note left, A B C one even column right ----------
  // Cards x 840 w 780, y 214/446/678 h 156 (labels under each at y+160). Verdict zone x 1640-1800. Question strip y 100. Ring at (770,142).
  const HC = { note: { x: 110, y: 290, w: 600, h: 420 }, gap: { x: 140, y: 570, w: 540, h: 100 }, question: { x: 840, y: 100, w: 780, h: 84 }, cards: [{ x: 840, y: 214, w: 780, h: 156 }, { x: 840, y: 446, w: 780, h: 156 }, { x: 840, y: 678, w: 780, h: 156 }], ring: { cx: 770, cy: 142, r: 30 } };
  Loom.lesson.handover_check = function (ctx, parent, opts) {
    const o = opts || {}, INK = ctx.c("ink");
    const g = svg("g", {}, parent);
    const R = (a, par) => svg("rect", Object.assign({ stroke: INK, "stroke-width": 5 }, a), par || g);
    R({ x: 0, y: 0, width: 1920, height: 1080, fill: ctx.c("field2"), stroke: "none" });
    R({ x: 60, y: 60, width: 1800, height: 900, rx: 28, fill: ctx.c("surface2") });
    // the handover note
    const noteG = svg("g", { opacity: 0 }, g);
    const nin = svg("g", { transform: "rotate(-1.5 410 500)" }, noteG);
    R({ x: 110, y: 290, width: 600, height: 420, rx: 12, fill: ctx.c("surface") }, nin);
    svg("circle", { cx: 410, cy: 290, r: 16, fill: ctx.c("muted"), stroke: INK, "stroke-width": 4 }, nin);
    [["Client", 330], ["Open tasks", 450]].forEach((r) => {
      R({ x: 140, y: r[1], width: 540, height: 100, rx: 10, fill: ctx.c("surface2"), "stroke-width": 3 }, nin);
      ctx.kit.text(nin, r[0], { role: "body", x: 160, y: r[1] + 10, w: 200, h: 80, align: "left", valign: "middle", maxLines: 1, color: "ink" });
      svg("line", { x1: 390, y1: r[1] + 36, x2: 650, y2: r[1] + 36, stroke: ctx.c("muted"), "stroke-width": 10, "stroke-linecap": "round" }, nin);
      svg("line", { x1: 390, y1: r[1] + 64, x2: 570, y2: r[1] + 64, stroke: ctx.c("muted"), "stroke-width": 10, "stroke-linecap": "round" }, nin);
    });
    const gapR = svg("rect", { x: 140, y: 570, width: 540, height: 100, rx: 10, fill: "none", stroke: ctx.c("accent"), "stroke-width": 5, "stroke-dasharray": "14 10", "stroke-linecap": "round" }, nin);
    const pulse = svg("rect", { x: 140, y: 570, width: 540, height: 100, rx: 10, fill: "none", stroke: ctx.c("accent"), "stroke-width": 5, opacity: 0 }, g);
    // question
    const qG = svg("g", { opacity: 0 }, g);
    R({ x: 840, y: 100, width: 780, height: 84, rx: 12, fill: ctx.c("surface") }, qG);
    ctx.kit.text(qG, o.question || "Which line changes what happens next?", { role: "lead", x: 860, y: 108, w: 740, h: 68, align: "center", valign: "middle", maxLines: 1, color: "ink" });
    // pause ring
    const ringG = svg("g", { opacity: 0 }, g);
    svg("circle", { cx: 770, cy: 142, r: 30, fill: "none", stroke: ctx.c("muted"), "stroke-width": 8 }, ringG);
    const ringA = svg("circle", { cx: 770, cy: 142, r: 30, fill: "none", stroke: INK, "stroke-width": 8, "stroke-linecap": "round", pathLength: 1, "stroke-dasharray": 1, "stroke-dashoffset": 0, transform: "rotate(-90 770 142)" }, ringG);
    // options
    const T = { A: o.a || "You're not very detail-minded.", B: o.b || "The handover could have been better.", Cs: o.c || ["Your note skipped the deadline;", "it slipped.", "List it next time?"] };
    let fs = 32;
    try { fs = Math.min.apply(null, [T.A, T.B].concat(T.Cs).map((s) => ctx.kit.fit(s, { role: "body", w: 640, h: 44, maxLines: 1 }).size)); } catch (e) { fs = 30; }
    const cards = [], cardR = [], labs = [], und = [], TX = 954;
    ["A", "B", "C"].forEach((L2, i) => {
      const c = HC.cards[i], cg = svg("g", { opacity: 0 }, g), cy = c.y + c.h / 2;
      cardR.push(R({ x: c.x, y: c.y, width: c.w, height: c.h, rx: 14, fill: ctx.c("surface") }, cg));
      svg("circle", { cx: c.x + 54, cy, r: 36, fill: ctx.c("surface2"), stroke: INK, "stroke-width": 4 }, cg);
      ctx.kit.text(cg, L2, { role: "label", x: c.x + 26, y: cy - 28, w: 56, h: 56, align: "center", valign: "middle", maxLines: 1, color: "ink", weight: 400 });
      if (L2 === "C") {
        T.Cs.forEach((s, k) => {
          const y0 = c.y + 14 + 44 * k;
          const tt = ctx.kit.text(cg, s, { role: "body", x: TX, y: y0, w: 640, h: 44, align: "left", valign: "middle", maxLines: 1, size: fs, color: "ink" });
          const w = Math.min((tt.__fit && tt.__fit.width) || 300, 640);
          und.push({ el: svg("line", { x1: TX, y1: y0 + 40, x2: TX, y2: y0 + 40, stroke: ctx.c("accent"), "stroke-width": 6, "stroke-linecap": "round" }, cg), x: TX, w });
        });
      } else ctx.kit.text(cg, T[L2], { role: "body", x: TX, y: c.y + 8, w: 640, h: c.h - 16, align: "left", valign: "middle", maxLines: 1, size: fs, color: "ink" });
      cards.push(cg);
    });
    // verdict marks (right zone x 1640-1800) and labels under cards
    const cy = (i) => HC.cards[i].y + HC.cards[i].h / 2, MX = 1710;
    const tickG = svg("g", { opacity: 0 }, g);
    svg("circle", { cx: MX, cy: cy(2), r: 40, fill: ctx.c("surface"), stroke: ctx.c("pos"), "stroke-width": 7 }, tickG);
    svg("path", { d: "M" + (MX - 18) + " " + cy(2) + " l13 15 l25 -31", fill: "none", stroke: ctx.c("pos"), "stroke-width": 11, "stroke-linecap": "round", "stroke-linejoin": "round" }, tickG);
    const crossG = svg("g", { opacity: 0 }, g);
    svg("circle", { cx: MX, cy: cy(0), r: 40, fill: ctx.c("surface"), stroke: ctx.c("neg"), "stroke-width": 7 }, crossG);
    const xa = svg("line", { x1: MX - 20, y1: cy(0) - 20, x2: MX + 20, y2: cy(0) + 20, stroke: ctx.c("neg"), "stroke-width": 11, "stroke-linecap": "round", pathLength: 1, "stroke-dasharray": 1, "stroke-dashoffset": 1 }, crossG);
    const xb = svg("line", { x1: MX + 20, y1: cy(0) - 20, x2: MX - 20, y2: cy(0) + 20, stroke: ctx.c("neg"), "stroke-width": 11, "stroke-linecap": "round", pathLength: 1, "stroke-dasharray": 1, "stroke-dashoffset": 1 }, crossG);
    const slG = svg("g", { opacity: 0 }, g), slots = [];
    [0, 1, 2].forEach((k) => slots.push(R({ x: 1650 + 52 * k, y: cy(1) - 40, width: 40, height: 80, rx: 8, fill: "none", stroke: ctx.c("muted"), "stroke-width": 4, "stroke-dasharray": "9 8", "stroke-linecap": "round" }, slG)));
    const LT = { C: o.labelC || "C: behaviour, impact, next step", B: o.labelB || "B: polite, nothing to act on", A: o.labelA || "A: about the person" };
    const lab = (key, i) => { const l = svg("g", { opacity: 0 }, g); ctx.kit.text(l, LT[key], { role: "label", x: 880, y: HC.cards[i].y + 160, w: 720, h: 46, align: "left", valign: "middle", maxLines: 1, color: "ink", weight: 400 }); return l; };
    const lA = lab("A", 0), lB = lab("B", 1), lC = lab("C", 2);
    const z = { nt: 0, gAcc: 1, pu: 0, qo: 0, ao: 0, bo: 0, co: 0, rv: 0, rd: 0, tc: 0, aC: 0, u1: 0, u2: 0, u3: 0, bd: 0, sl: 0, xa: 0, lc: 0, lb: 0, la: 0 };
    const S = {};
    S.note = { nt: [1, 0, 0.7], gAcc: 1 };
    S.note_pulse = Object.assign({}, S.note, { nt: 1, pu: [1, 0, 1] });
    S.options = Object.assign({}, S.note, { nt: 1, pu: [0, 0, 0], gAcc: [0, 0.3, 1], qo: [1, 0, 0.35], ao: [1, 0.1, 0.5], bo: [1, 0.2, 0.6], co: [1, 0.3, 0.7] });
    S.pause = Object.assign({}, S.options, { rv: [1, 0, 0.08], rd: [1, 0, 1] });
    S.c_right = Object.assign({}, S.pause, { tc: [1, 0, 0.25], aC: [1, 0, 0.25], u1: [1, 0.3, 0.5], u2: [1, 0.5, 0.7], u3: [1, 0.7, 0.9] });
    S.b_hollow = Object.assign({}, S.c_right, { aC: [0, 0, 0.3], bd: [1, 0.1, 0.5], sl: [1, 0.4, 1] });
    S.a_wrong = Object.assign({}, S.b_hollow, { xa: [1, 0, 0.7] });
    S.labels = Object.assign({}, S.a_wrong, { lc: [1, 0, 0.4], lb: [1, 0.25, 0.65], la: [1, 0.5, 0.9] });
    // verdict states do not mention the labels, so a label set earlier stays; these cumulative label states are for jumping in
    S.label_c = Object.assign({}, S.c_right, { lc: [1, 0, 1] });
    S.label_b = Object.assign({}, S.b_hollow, { lc: 1, lb: [1, 0, 1] });
    S.label_a = Object.assign({}, S.labels, { lc: 1, lb: 1, la: [1, 0, 1] });
    const M = machine(ctx, z, S, (P) => {
      noteG.setAttribute("opacity", P.nt.toFixed(3)); noteG.setAttribute("transform", "translate(0 " + ((1 - P.nt) * -90).toFixed(2) + ")");
      gapR.setAttribute("stroke", mixc(ctx, "ink", "accent", P.gAcc)); gapR.setAttribute("stroke-width", (4 + P.gAcc).toFixed(2));
      const f = P.pu - Math.floor(P.pu), pr = Math.sin(Math.PI * f);
      pulse.setAttribute("opacity", (0.9 * pr * P.nt).toFixed(3)); pulse.setAttribute("x", 140 - 14 * f); pulse.setAttribute("y", 570 - 14 * f); pulse.setAttribute("width", 540 + 28 * f); pulse.setAttribute("height", 100 + 28 * f);
      qG.setAttribute("opacity", P.qo.toFixed(3)); qG.setAttribute("transform", "translate(0 " + ((1 - P.qo) * -20).toFixed(2) + ")");
      const arr = [P.ao, P.bo, P.co];
      cards.forEach((c, i) => {
        const dim = i === 1 ? 1 - 0.55 * P.bd : 1;
        c.setAttribute("opacity", (arr[i] * dim).toFixed(3)); c.setAttribute("transform", "translate(" + ((1 - arr[i]) * 80).toFixed(2) + " 0)");
      });
      cardR[2].setAttribute("stroke", mixc(ctx, "ink", "accent", P.aC)); cardR[2].setAttribute("stroke-width", (5 + 2 * P.aC).toFixed(2));
      [P.u1, P.u2, P.u3].forEach((u, k) => { und[k].el.setAttribute("x2", (und[k].x + und[k].w * u).toFixed(2)); und[k].el.setAttribute("opacity", u > 0.001 ? 1 : 0); und[k].el.setAttribute("stroke", mixc(ctx, "ink", "accent", P.aC)); });
      ringG.setAttribute("opacity", (P.rv * (P.rd < 0.999 ? 1 : 0)).toFixed(3)); ringA.setAttribute("stroke-dashoffset", clamp(P.rd, 0, 1).toFixed(3));
      tickG.setAttribute("opacity", P.tc.toFixed(3)); tickG.setAttribute("transform", "translate(" + MX + " " + cy(2) + ") scale(" + (0.6 + 0.4 * P.tc).toFixed(3) + ") translate(" + (-MX) + " " + (-cy(2)) + ")");
      slG.setAttribute("opacity", P.sl.toFixed(3));
      crossG.setAttribute("opacity", P.xa > 0.001 ? 1 : 0);
      xa.setAttribute("stroke-dashoffset", (1 - clamp(P.xa * 2, 0, 1)).toFixed(3)); xb.setAttribute("stroke-dashoffset", (1 - clamp(P.xa * 2 - 1, 0, 1)).toFixed(3));
      [[lC, P.lc], [lB, P.lb], [lA, P.la]].forEach((q) => { q[0].setAttribute("opacity", q[1].toFixed(3)); q[0].setAttribute("transform", "translate(0 " + ((1 - q[1]) * 10).toFixed(2) + ")"); });
    }, dd(ctx, "move", 0.8));
    M.init(o.state || null);
    return { g, note: noteG, gap: gapR, question: qG, cards, ring: ringG, tick: tickG, cross: crossG, labels: [lA, lB, lC], anchors: HC, setState: M.setState, at: M.at, states: ["note", "note_pulse", "options", "pause", "c_right", "b_hollow", "a_wrong", "labels", "label_c", "label_b", "label_a"] };
  };
  Loom.lesson.handover_check.anchors = HC;
})();
