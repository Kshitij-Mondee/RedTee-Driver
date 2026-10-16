// T-035 ai_context_window: a model's context window as a budget (hand-off sheet, Family C). Built on _app_kit.js and
// _dev_kit.js. One long bar for the limit, filled with labelled segments in distinct tones (system prompt, history,
// retrieved documents, the answer's reserve), each with its token count; the total against the limit; what does not
// fit drawn past the limit's end, hatched in the failure tone, and the oldest history sliding out at the left when it is
// truncated. Labels too wide for their segment sit in rows above it on a leader, never over another label.
Loom.component("ai_context_window", {
  version: 1,
  idea: "A context window as a budget: one bar for the model's limit, filled with labelled segments (system prompt, instructions, history, retrieved documents, the answer's reserve) with their token counts, the total against the limit, an overflow drawn past the end, and the oldest tokens sliding out at the left when the history is truncated.",
  outline: ["the limit's bar with its end marked", "segments in distinct tones, each with its label and count (above it, hung on a leader, when it is narrow)", "the total against the limit", "overflow past the end, hatched in the failure tone", "the truncated part sliding out at the left"],
  family: "ai",
  tags: ["context window", "tokens", "llm", "prompt", "rag", "memory", "truncation", "token budget", "long documents", "cost"],
  commissioned_by: "Kshitij 2026-10-16 (hand-off sheet T-035)",
  styles: ["corporate-clean", "engineering", "line-art", "editorial-paper", "presenter-pop", "dark-technical", "whiteboard", "blueprint", "chalk-lab"],
  params: {
    limit: { type: "number", content: true },      // the model's limit in tokens (128000)
    segments: { type: "list", content: true },     // [{label, tokens, tone?, history?: true (the part truncate() takes from)}]
    unit: { type: "str", content: true },          // "tokens"
    totalLabel: { type: "str" },                   // the total's words: {n} the total, {limit} the limit, {unit} ("{n} of {limit} {unit}"); "{n} / {limit} {unit}" when omitted
    compact: { type: "bool", default: true },      // counts as 12.4k, 128k
    w: { type: "number", default: 1600 },
    at: { type: "number", default: -1 },
    steps: { type: "list", default: [] },          // [{do: "add", seg, at} | {do: "overflow", at} | {do: "truncate", n, at} | {do: "resize", i, tokens, at}]
    engine: { type: "enum", choices: ["auto", "off"], default: "auto" },
  },
  slots: {},
  parts: ["bar", "segments[]", "total", "overflowG", "add(seg, t)", "overflow(t)", "truncate(n, t)", "resize(i, tokens, t)"],
  example: 'ctx.use("ai_context_window", { limit: 8000, unit: "tokens", segments: [{ label: "System prompt", tokens: 600 }, { label: "Chat so far", tokens: 5200, history: true }, { label: "Reply reserve", tokens: 1000 }], at: ctx.cue("the window fills") }, { x: 160, y: 420, name: "ctxwin" })',
  size: (p) => ({ w: p.w, h: Loom.devKit.ctxLayout(p).h }),
  build(ctx, g, p) {
    const AK = Loom.appKit, DK = Loom.devKit, S = Loom.style, K = Loom.kit, svg = (t, a, q) => Loom.svg(t, a, q), f1 = DK.f1;
    const L = DK.ctxLayout(p), Z = L.Z;
    const animated = p.at != null && p.at >= 0;
    const eng = DK.engine(ctx, g, p), pen = DK.pen(ctx, eng);
    const field = S.c("field"), surface = S.c("surface"), ink = S.c("ink");
    const fmt = L.fmt;
    const TONES = DK.tones();
    let segs = L.segs.map((s0, i) => Object.assign({}, s0, { tone: s0.tone && s0.tone in S.pack.palette ? s0.tone : TONES[i % TONES.length] }));
    const parts = { segments: [] };
    const X = L.X, by = L.barY, bh = L.barH;
    // the limit's bar: a track to the limit, the limit's end marked
    const track = svg("g", {}, g);
    svg("rect", { x: 0, y: f1(by), width: f1(X(p.limit)), height: bh, rx: 10, fill: S.mix(S.c("line"), field, 0.85) }, track);
    K.rect(track, 0, by, X(p.limit), bh, { fill: "none", r: 10, stroke: "line", sw: 2 });
    const endX = X(p.limit);
    svg("line", { x1: f1(endX), y1: f1(by - 18), x2: f1(endX), y2: f1(by + bh + 18), stroke: ink, "stroke-width": 3 }, track);
    const limW = DK.word(ctx, track, `${fmt(p.limit)}`, { x: endX - 80, y: by + bh + 20, w: 160, h: L.lhS, size: Z.small, weight: 700, align: "center", at: animated ? p.at : -1, eng, pen, name: "limit", kind: "label" });
    parts.bar = track;
    // segments, in order; overflow hatched past the end
    const segG = svg("g", {}, g), wordG = svg("g", {}, g), leadG = svg("g", {}, g);
    const hatchId = Loom.uid ? Loom.uid("ctxhatch") : "ctxhatch";
    const pat = svg("pattern", { id: hatchId, width: 12, height: 12, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, svg("defs", {}, g));
    svg("rect", { x: 0, y: 0, width: 12, height: 12, fill: S.mix(S.c("neg"), surface, 0.75) }, pat);
    svg("rect", { x: 0, y: 0, width: 5, height: 12, fill: DK.legible("neg", surface, ink, 3) }, pat);
    // a segment's label and count: inside when they fit, else in its row above on a leader
    function drawLabel(sg, i, x0, x1, at, lab) {
      lab = lab || { inside: true };
      const tc = S.c(sg.tone), shown = at != null && at >= 0 ? at : -1, nm = `seg_${i}_${Math.round((at || 0) * 100)}`;
      const words = `${sg.label}  ${fmt(sg.tokens)}`;
      const fitsIn = AK.measure(words, "caption", Z.fs, 600) * L.engK + 24 <= x1 - x0;
      if (lab.inside && fitsIn) return DK.word(ctx, wordG, words, { x: x0 + 10, y: by, w: Math.max(20, x1 - x0 - 20), h: bh, size: Z.fs, weight: 600, color: AK.onHex(S.mix(tc, surface, 0.35)), at: shown, eng, pen, name: nm, kind: "label" });
      const lw = lab.w || Math.min(p.w, Math.max(AK.measure(sg.label, "caption", Z.small, 700), AK.measure(fmt(sg.tokens), "caption", Z.small, 400)) * L.engK + 20);
      const ly = L.rowY(lab.row || 0), cx = (x0 + x1) / 2;
      // the label hangs on its leader, which runs up its edge to its top (the side the layout chose; a segment drawn
      // somewhere else than planned, after a truncation, takes the right side when it fits)
      const side = lab.side && Math.abs(lab.cx - cx) < 1 ? lab.side : cx + lw <= p.w ? "r" : "l";
      const lx = side === "r" ? cx + 8 : cx - lw, al = side === "r" ? "left" : "right";
      const ld = svg("path", { d: `M${f1(cx)} ${f1(by - 2)} L${f1(cx)} ${f1(ly + 2)}`, stroke: tc, "stroke-width": 2, fill: "none" }, leadG);
      const a = DK.word(ctx, wordG, sg.label, { x: lx, y: ly, w: lw - 8, h: L.lhS, size: Z.small, weight: 700, align: al, at: shown, eng, pen, name: nm + "l", kind: "label" });
      const b = DK.word(ctx, wordG, fmt(sg.tokens), { x: lx, y: ly + L.lhS, w: lw - 8, h: L.lhS, size: Z.small, color: "muted", align: al, at: shown, eng, pen, name: nm + "n", kind: "label" });
      if (shown >= 0) AK.show(ld, shown, 0.25);
      return { a, b, lead: ld };
    }
    const dropLabel = (w, t) => { if (!w) return; if (w.lead) { DK.fadeOut(w.a, t); DK.fadeOut(w.b, t); Loom.tween(w.lead, { opacity: 1 }, { opacity: 0, duration: 0.2 }, t, DK.meta("state", "ctx.label")); } else DK.fadeOut(w, t); };
    function drawSeg(sg, i, x0, at) {
      const x1 = x0 + (X(sg.tokens) - X(0)), G = svg("g", {}, segG), tc = S.c(sg.tone);
      const inside = Math.max(0, Math.min(x1, endX) - x0), over = Math.max(0, x1 - Math.max(x0, endX));
      const r1 = svg("rect", { x: f1(x0), y: f1(by + 3), width: f1(Math.max(0, inside - 2)), height: bh - 6, rx: 6, fill: S.mix(tc, surface, 0.35), stroke: tc, "stroke-width": 2 }, G);
      const r2 = over ? svg("rect", { x: f1(Math.max(x0, endX) + 2), y: f1(by + 3), width: f1(over - 2), height: bh - 6, rx: 6, fill: `url(#${hatchId})`, stroke: DK.legible("neg", surface, ink, 3), "stroke-width": 2 }, G) : null;
      const w = drawLabel(sg, i, x0, x1, at, L.place[i]);
      const S0 = { g: G, rect: r1, over: r2, x0, x1, label: w, i, tokens: sg.tokens };
      if (at != null && at >= 0) {
        // it grows in from its left edge
        const full = Math.max(0, inside - 2);
        Loom.drive((e) => { r1.setAttribute("width", f1(full * e)); if (r2) r2.setAttribute("opacity", e >= 1 ? 1 : 0); }, at, 0.5, "move", DK.meta("reveal", "ctx.segment"));
        AK.show(G, at, 0.05);
      }
      return S0;
    }
    let x = 0;
    segs.forEach((sg, i) => { const S0 = drawSeg(sg, i, x, animated ? p.at + 0.3 + i * 0.45 : -1); parts.segments.push(S0); x = S0.x1; });
    // the total against the limit
    const total = () => segs.reduce((a, s0) => a + s0.tokens, 0);
    const tl = (n) => String(p.totalLabel || "{n} / {limit} {unit}").replace(/\{n\}/g, fmt(n)).replace(/\{limit\}/g, fmt(p.limit)).replace(/\{unit\}/g, p.unit);
    const totG = svg("g", {}, g);
    const TOT = { w: DK.word(ctx, totG, tl(total()), { x: 0, y: L.totY, w: p.w * 0.7, h: L.lh, size: Z.fs, weight: 700, fill: total() > p.limit ? DK.legible("neg", field, ink) : null, at: animated ? p.at + 0.3 + segs.length * 0.45 : -1, eng, pen, name: "total", kind: "label" }) };
    parts.total = totG;
    void limW;
    // ---- state functions
    const flash = svg("rect", { x: f1(endX), y: f1(by - 6), width: f1(Math.max(0, p.w - endX)), height: bh + 12, rx: 8, fill: "none", stroke: DK.legible("neg", field, ink, 3), "stroke-width": 3, opacity: 0 }, g);
    parts.overflowG = flash;
    parts.overflow = function (t) { Loom.tween(flash, { opacity: 0 }, { opacity: 1, duration: 0.25 }, t, DK.meta("state", "ctx.overflow")); Loom.tween(flash, { opacity: 1 }, { opacity: 0.35, duration: 0.6 }, t + 0.5, DK.meta("state", "ctx.overflow")); return t + 1.1; };
    const relayout = (t, dur) => {
      // every segment moves to its place from the left, as a pure drive per segment
      let xx = 0;
      parts.segments.forEach((S0, k) => {
        const sg = segs[k], nx = xx, nx1 = nx + (X(sg.tokens) - X(0)), a0 = S0.x0, a1 = S0.x1;
        if (Math.abs(nx - a0) > 0.5 || Math.abs(nx1 - a1) > 0.5) {
          Loom.drive((e) => {
            const u0 = a0 + (nx - a0) * e, u1 = a1 + (nx1 - a1) * e, ins = Math.max(0, Math.min(u1, endX) - u0), ov = Math.max(0, u1 - Math.max(u0, endX));
            S0.rect.setAttribute("x", f1(u0)); S0.rect.setAttribute("width", f1(Math.max(0, ins - 2)));
            if (S0.over) { S0.over.setAttribute("x", f1(Math.max(u0, endX) + 2)); S0.over.setAttribute("width", f1(Math.max(0, ov - 2))); }
          }, t, dur || 0.6, "move", DK.meta("travel", "ctx.relayout"));
          S0.x0 = nx; S0.x1 = nx1;
          // its label leaves and is set again in its new place, with its new count
          dropLabel(S0.label, t);
          S0.label = drawLabel(sg, k, nx, nx1, t + (dur || 0.6), L.place[k]);
        } else if (S0.tokens != null && S0.tokens !== sg.tokens) { dropLabel(S0.label, t); S0.label = drawLabel(sg, k, nx, nx1, t + (dur || 0.6), L.place[k]); }
        S0.tokens = sg.tokens;
        xx = nx1;
      });
      const nt = tl(total());
      DK.swapWord(ctx, totG, TOT, nt, { x: 0, y: L.totY, w: p.w * 0.7, h: L.lh, size: Z.fs, weight: 700, fill: total() > p.limit ? DK.legible("neg", field, ink) : null, eng, pen, name: "total", kind: "label" }, t + (dur || 0.6) - 0.2);
      return t + (dur || 0.6);
    };
    parts.truncate = function (n, t) {
      // the oldest tokens of the history slide out at the left, the rest close up
      const k = segs.findIndex((s0) => s0.history) >= 0 ? segs.findIndex((s0) => s0.history) : 0, S0 = parts.segments[k];
      if (!S0) return t;
      const cut = Math.min(n, segs[k].tokens), wCut = X(cut) - X(0);
      const ghost = svg("rect", { x: f1(S0.x0), y: f1(by + 3), width: f1(wCut), height: bh - 6, rx: 6, fill: S.mix(S.c(segs[k].tone), surface, 0.35), stroke: S.c(segs[k].tone), "stroke-width": 2, opacity: 0 }, g);
      Loom.drive((e, raw) => { ghost.setAttribute("x", f1(S0.x0 - 120 * e)); ghost.setAttribute("opacity", raw > 0 && raw < 1 ? (1 - e).toFixed(3) : 0); }, t, 0.7, "move", DK.meta("travel", "ctx.truncate"));
      segs = segs.map((s0, j) => (j === k ? Object.assign({}, s0, { tokens: s0.tokens - cut }) : s0));
      return relayout(t + 0.2, 0.6);
    };
    parts.resize = function (i, tokens, t) { if (!segs[i]) return t; segs = segs.map((s0, j) => (j === i ? Object.assign({}, s0, { tokens: +tokens }) : s0)); return relayout(t, 0.6); };
    parts.add = function (seg, t) {
      if (!seg) return t;
      const i = segs.length, sg = Object.assign({ tone: TONES[i % TONES.length] }, seg, { label: String(seg.label || ""), tokens: +seg.tokens || 0 });
      segs.push(sg);
      const S0 = drawSeg(sg, i, parts.segments.length ? parts.segments[parts.segments.length - 1].x1 : 0, t);
      parts.segments.push(S0);
      return relayout(t + 0.5, 0.01);
    };
    for (const st of p.steps || []) {
      if (!st || st.at == null) continue;
      if (st.do === "add") parts.add(st.seg, st.at);
      else if (st.do === "overflow") parts.overflow(st.at);
      else if (st.do === "truncate") parts.truncate(st.n, st.at);
      else if (st.do === "resize") parts.resize(st.i, st.tokens, st.at);
      else Loom.error("component_params", `ai_context_window: step "${st.do}" is not add, overflow, truncate or resize`);
    }
    return parts;
  },
});

// the window's geometry, shared by size() and build(): the scale (the limit at 80 % of the width when the content
// overflows it), and the label rows for segments too narrow for their words
Loom.devKit.ctxLayout = function (p) {
  const AK = Loom.appKit, DK = Loom.devKit, Z = DK.ui().Z;
  let engK = 1;
  try { const e = p.engine !== "off" && Loom.engines && Loom.engines.current && Loom.engines.current(); if (e && e.id === "whiteboard") engK = 1.6; else if (e && e.id === "blueprint") engK = 1.35; } catch (e) { engK = 1; }
  const fmt = (n) => { n = +n; if (p.compact === false) return n.toLocaleString("en-US"); const a = Math.abs(n); return a >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : a >= 1e3 ? `${+(n / 1e3).toFixed(a >= 1e5 ? 0 : 1)}k` : String(Math.round(n)); };
  const segs = (p.segments || []).map((s) => Object.assign({}, s, { label: String(s.label == null ? "" : s.label), tokens: Math.max(0, +s.tokens || 0) }));
  const extra = (p.steps || []).reduce((a, s) => a + (s && s.do === "add" && s.seg ? +s.seg.tokens || 0 : 0), 0);
  const sum = segs.reduce((a, s) => a + s.tokens, 0) + extra;
  const span = Math.max(p.limit, sum), scaleW = sum > p.limit ? (p.w - 10) * Math.max(0.6, p.limit / span) / p.limit : (p.w - 10) / p.limit;
  const X = (n) => n * scaleW;
  const lh = AK.lineH(Z.fs, "caption", 700), lhS = AK.lineH(Z.small, "caption", 700), barH = Math.max(lh + 20, 64);
  // labels: inside a segment when "label  count" fits, else in the lowest row above that clears the others
  // segments added later get their label row planned too, so they never land on a label already there
  const added = (p.steps || []).filter((s) => s && s.do === "add" && s.seg).map((s) => ({ label: String(s.seg.label || ""), tokens: Math.max(0, +s.seg.tokens || 0) }));
  // a label outside its segment hangs like a flag on its leader: right of it, or left of it near the right end. Rows
  // are chosen from the right so that (1) no two labels in a row touch, (2) no leader from a higher label runs through
  // a lower one and (3) a label's own leader runs through no lower label. A centred label had been struck through by
  // its neighbour's leader ("Sy|stem prompt", 2026-10-16 review).
  const place = [], rows = [], all = segs.concat(added), cxs = [], ws = [], out = [];
  let x = 0;
  all.forEach((s, i) => {
    const w = X(s.tokens), want = AK.measure(`${s.label}  ${fmt(s.tokens)}`, "caption", Z.fs, 600) * engK + 24;
    cxs[i] = x + w / 2;
    if (want <= w) place[i] = { inside: true };
    else { ws[i] = Math.min(p.w, Math.max(AK.measure(s.label, "caption", Z.small, 700), AK.measure(fmt(s.tokens), "caption", Z.small, 400)) * engK + 20); out.push(i); }
    x += w;
  });
  const order = out.slice().sort((u, v) => cxs[v] - cxs[u] || v - u), done = [], spanOf = [];
  const MAXR = 6;
  for (const i of order) {
    const cx = cxs[i], lw = ws[i];
    let best = null;
    for (const sd of ["r", "l"]) {
      const a = sd === "r" ? cx - 2 : cx - lw - 2, b = sd === "r" ? cx + lw + 2 : cx + 2;
      if (a < -2 || b > p.w + 2) continue;
      for (let r = 0; r < MAXR; r++) {
        let ok = true;
        for (const j of done) {
          const [u, v] = spanOf[j];
          if (place[j].row === r && a < v + 10 && b > u - 10) { ok = false; break; }
          if (place[j].row > r && cxs[j] > a - 4 && cxs[j] < b + 4) { ok = false; break; }
          if (place[j].row < r && cx > u - 4 && cx < v + 4) { ok = false; break; }
        }
        // a label hung left over leaders still to place leaves each a row below it: more of them than rows is a dead end
        if (ok && sd === "l" && out.filter((j) => !done.includes(j) && j !== i && cxs[j] > a - 4 && cxs[j] < b).length > r) ok = false;
        if (ok) { const sc = r * 10 + (sd === "l" ? 1 : 0); if (!best || sc < best.sc) best = { r, sd, a, b, sc }; break; }
      }
    }
    if (!best) {
      const right = cx + lw <= p.w, a = right ? cx - 2 : cx - lw - 2, b = right ? cx + lw + 2 : cx + 2;
      let r = 0; while (done.some((j) => place[j].row === r && a < spanOf[j][1] + 10 && b > spanOf[j][0] - 10)) r++;
      best = { r, sd: right ? "r" : "l", a, b };
      Loom.warn("dev_ctx_crowded", `ai_context_window: no row keeps "${all[i].label}" clear of the other leaders (widen w)`);
    }
    place[i] = { inside: false, row: best.r, w: lw, side: best.sd, cx };
    spanOf[i] = [best.a, best.b];
    (rows[best.r] = rows[best.r] || []).push([best.a, best.b, i]);
    done.push(i);
  }
  const nRows = rows.filter(Boolean).length ? rows.length : 0, rowH = lhS * 2 + 14;
  const barY = nRows * rowH + (nRows ? 12 : 0) + 4;
  const rowY = (r) => barY - 12 - (r + 1) * rowH + 4;
  const totY = barY + barH + 20 + lhS + 8;
  return { Z, engK, lh, lhS, fmt, segs, X, place, rowY, barY, barH, totY, h: totY + lh + 6 };
};
