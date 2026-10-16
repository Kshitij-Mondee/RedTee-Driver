// T-036 ai_token_distribution: next-token probabilities and sampling (hand-off sheet, Family C). Built on _app_kit.js
// and _dev_kit.js. The context so far in the mono face, the candidate next tokens as bars with their percentages, a
// temperature dial and a top-p cut. The numbers are the scene's (from its grounded content), never invented here: a
// temperature reshapes them deterministically (p^(1/T), normalised), a top-p cut greys the bars past it, and the
// sampled token is marked and appended to the context.
Loom.component("ai_token_distribution", {
  version: 1,
  idea: "Next-token probabilities: the context so far, the candidate next tokens as bars with their percentages, a temperature dial that sharpens or flattens them, a top-p cut that greys out the tail, and the sampled token marked and appended to the context.",
  outline: ["context line in mono with a caret", "candidate rows: the token, its bar, its percentage", "temperature dial with its value", "top-p cut line across the bars, its value on a tag on the line", "the sampled row marked, its token flying to the context"],
  family: "ai",
  tags: ["next token", "probability", "sampling", "temperature", "top-p", "nucleus sampling", "llm", "logits", "determinism", "decoding"],
  commissioned_by: "Kshitij 2026-10-16 (hand-off sheet T-036)",
  styles: ["corporate-clean", "engineering", "line-art", "editorial-paper", "presenter-pop", "dark-technical", "whiteboard", "blueprint", "chalk-lab"],
  params: {
    context: { type: "str", content: true },       // the text so far
    candidates: { type: "list", content: true },   // [{token, p}] at temperature 1 (the scene's numbers)
    temperature: { type: "number", default: 1.0 },
    topP: { type: "number", default: 1.0 },
    pick: { type: "int", default: -1 },           // the sampled candidate (-1: none)
    labels: { type: "obj" },                       // the product's words: {temperature, topP}
    w: { type: "number", default: 1300 },
    at: { type: "number", default: -1 },
    steps: { type: "list", default: [] },          // [{do: "temperature", v, at} | {do: "topP", v, at} | {do: "sample", i, at}]
    engine: { type: "enum", choices: ["auto", "off"], default: "auto" },
  },
  slots: {},
  parts: ["context", "bars[]", "dial", "cut", "pick", "setTemperature(v, t)", "setTopP(v, t)", "sample(i, t)"],
  example: 'ctx.use("ai_token_distribution", { context: "The invoice is due on", candidates: [{ token: " Friday", p: 0.46 }, { token: " the", p: 0.31 }, { token: " receipt", p: 0.09 }], pick: 0, at: ctx.cue("the most likely word") }, { x: 300, y: 260, name: "next" })',
  size: (p) => ({ w: p.w, h: Loom.devKit.tokLayout(p).h }),
  build(ctx, g, p) {
    const AK = Loom.appKit, DK = Loom.devKit, S = Loom.style, K = Loom.kit, svg = (t, a, q) => Loom.svg(t, a, q), f1 = DK.f1;
    const L = DK.tokLayout(p), Z = L.Z;
    const animated = p.at != null && p.at >= 0;
    const eng = DK.engine(ctx, g, p), pen = DK.pen(ctx, eng);
    const field = S.c("field"), surface = S.c("surface"), ink = S.c("ink");
    const LB = p.labels || {};
    const base = L.cands.map((c) => Math.max(0, +c.p || 0));
    const shape = (T) => { const t = Math.max(0.05, +T); const q = base.map((v) => Math.pow(v, 1 / t)); const s = q.reduce((a, b) => a + b, 0) || 1; return q.map((v) => v / s); };
    let T = p.temperature, P = p.topP, probs = shape(T);
    const pct = (v) => `${(v * 100).toFixed(1)}%`;
    const parts = { bars: [] };
    // ---- the context line
    const cg = svg("g", {}, g);
    svg("rect", { x: 0, y: 0, width: p.w, height: L.ctxH, rx: 12, fill: S.mix(S.c("surface2"), surface, 0.4) }, cg);
    K.rect(cg, 0, 0, p.w, L.ctxH, { fill: "none", r: 12, stroke: "line", sw: 1.5 });
    const CS = L.CS;
    const ctxRows = L.ctxRows;
    // with the whiteboard hand or the blueprint pen, the context and the tokens are written by it (the board's face rule);
    // else they are set in the mono face
    const handW = (str) => AK.measure(String(str), "caption", Z.fs, 400) * (pen && pen.kind === "wb" ? 1.6 : 1.35);
    const CM = ctxRows.map((row, k) => (pen ? (row ? (DK.word(ctx, cg, row, { x: 22, y: 14 + k * L.cLH, w: p.w - 44, h: L.cLH, size: Z.fs, at: animated ? p.at : -1, eng, pen, name: `ctx_${k}`, kind: "label" }), { w: handW(row) }) : { w: 0 })
      : AK.mono(cg, [[row, ink]], { x: 22, y: 14 + k * L.cLH, h: L.cLH, size: CS })));
    const last = CM[CM.length - 1];
    const caretX = last ? (last.colX ? last.colX(last.cols) : 22 + last.w) + 2 : 22, caretY = 14 + (ctxRows.length - 1) * L.cLH;
    const caret = svg("rect", { x: f1(caretX), y: f1(caretY + L.cLH * 0.15), width: 3, height: f1(L.cLH * 0.7), fill: S.c("accent") }, cg);
    parts.context = cg;
    // ---- the bars
    const top = L.ctxH + 26, rowH = L.rowH;
    const bx = L.tokW + 24, bw = p.w - bx - L.pctW - L.dialW - 40;
    const rowsG = svg("g", {}, g), cutG = svg("g", {}, g);
    const accent = DK.legible("accent", field, ink, 3), muted = S.mix(S.c("line"), field, 0.5);
    const kitWord = (w) => w && w.nodeType;
    L.cands.forEach((c, i) => {
      const y = top + i * rowH, rg = svg("g", {}, rowsG);
      const mark = svg("rect", { x: -8, y: f1(y - 4), width: f1(bx + bw + L.pctW + 24), height: rowH - 4, rx: 10, fill: "none", stroke: accent, "stroke-width": 3, opacity: 0 }, rg);
      const tokStr = `"${String(c.token).replace(/ /g, "␣")}"`;
      if (pen) DK.word(ctx, rg, tokStr, { x: 6, y, w: L.tokW, h: rowH - 12, size: Z.fs, weight: 700, at: animated ? p.at + 0.3 : -1, eng, pen, name: `tok_${i}`, kind: "label" });
      else AK.mono(rg, [[tokStr, ink, 700]], { x: 6, y, h: rowH - 12, size: CS, w: L.tokW });
      svg("rect", { x: f1(bx), y: f1(y + 6), width: f1(bw), height: rowH - 24, rx: 6, fill: S.mix(S.c("line"), field, 0.86) }, rg);
      const bar = svg("rect", { x: f1(bx), y: f1(y + 6), width: f1(bw * (animated ? 0 : probs[i])), height: rowH - 24, rx: 6, fill: accent }, rg);
      const pw = DK.word(ctx, rg, pct(probs[i]), { x: bx + bw + 12, y, w: L.pctW, h: rowH - 12, size: Z.fs, weight: 700, at: animated ? p.at + 0.5 + i * 0.08 : -1, eng, pen, name: `p_${i}`, kind: "label" });
      parts.bars.push({ g: rg, bar, pct: { w: pw }, mark, y });
    });
    // ---- the top-p cut: a dashed line under the last bar that the cut keeps
    const cutAt = (pp) => { let s = 0; for (let i = 0; i < probs.length; i++) { s += probs[i]; if (s >= pp - 1e-9) return i; } return probs.length - 1; };
    const cutY = (k) => top + (k + 1) * rowH - 8;
    const cutLine = svg("line", { x1: -8, x2: f1(bx + bw + L.pctW + 16), y1: f1(cutY(cutAt(P))), y2: f1(cutY(cutAt(P))), stroke: DK.legible("neg", field, ink, 3), "stroke-width": 2.5, "stroke-dasharray": "8 6", opacity: P < 1 ? 1 : 0 }, cutG);
    const cutLab = { w: null };
    const cutText = (v) => (LB.topP ? `${LB.topP} ${v}` : `p ${v}`);
    // the cut's value on a tag that sits on the line at the right of the track (it had been squeezed onto the last kept
    // row's track, 2026-10-16 review); the tag is as wide as the widest value the scene sets
    const cutVals = [P].concat((p.steps || []).filter((st) => st && st.do === "topP").map((st) => +st.v)).filter((v) => v < 1);
    const engKc = pen ? (pen.kind === "wb" ? 1.6 : 1.35) : 1;
    const tagW = Math.max(60, ...cutVals.map((v) => AK.measure(cutText(v), "caption", Z.small, 700) * engKc + 24)), tagH = AK.boxH(Z.small, "caption", 700, L.lhS + 12);   // the inset the checks ask, above and below
    const tagX = bx + bw - tagW - 6, negC = DK.legible("neg", field, ink, 3);
    const tag = svg("rect", { x: f1(tagX), y: f1(cutY(cutAt(P)) - tagH / 2), width: f1(tagW), height: f1(tagH), rx: f1(tagH / 2), fill: field, stroke: negC, "stroke-width": 2, opacity: P < 1 ? 1 : 0 }, cutG);
    const cutO = () => ({ x: tagX, y: cutY(cutAt(P)) - tagH / 2, w: tagW, h: tagH, size: Z.small, weight: 700, align: "center", fill: DK.legible("neg", field, ink), eng, pen, name: "cut", kind: "label" });
    if (P < 1) cutLab.w = DK.word(ctx, cutG, cutText(P), Object.assign(cutO(), { at: animated ? p.at + 0.9 : -1 }));
    if (P < 1 && animated) AK.show(tag, p.at + 0.9, 0.25);
    const greyRows = (k, t) => parts.bars.forEach((B, i) => { const op = i <= k ? 1 : 0.32; if (t == null || t < 0) B.g.setAttribute("opacity", op); else Loom.tween(B.g, { opacity: +(B.g.getAttribute("opacity") || 1) }, { opacity: op, duration: 0.3 }, t, DK.meta("state", "tokens.topP")); B.g.setAttribute("data-op", op); });
    if (P < 1) greyRows(cutAt(P), -1);
    parts.cut = cutG;
    // ---- the temperature dial: a half circle from 0 to 2, the needle at T, the value under it
    const dg = svg("g", {}, g), dcx = p.w - L.dialW / 2, dcy = top + 30 + L.dialR, R = L.dialR;
    const arc = (a0, a1, r) => `M${f1(dcx + r * Math.cos(a0))} ${f1(dcy + r * Math.sin(a0))} A${r} ${r} 0 0 1 ${f1(dcx + r * Math.cos(a1))} ${f1(dcy + r * Math.sin(a1))}`;
    svg("path", { d: arc(Math.PI, 2 * Math.PI, R), fill: "none", stroke: S.mix(S.c("line"), field, 0.6), "stroke-width": 10, "stroke-linecap": "round" }, dg);
    svg("path", { d: arc(Math.PI, 1.5 * Math.PI, R), fill: "none", stroke: S.mix(S.c("accent"), field, 0.55), "stroke-width": 10, "stroke-linecap": "round" }, dg);
    AK.icon(dg, "thermometer", dcx, dcy - R - 22, 26, "muted");
    const needle = svg("line", { x1: f1(dcx), y1: f1(dcy), x2: f1(dcx), y2: f1(dcy - R + 14), stroke: ink, "stroke-width": 4, "stroke-linecap": "round" }, dg);
    svg("circle", { cx: f1(dcx), cy: f1(dcy), r: 8, fill: ink }, dg);
    const angOf = (v) => Math.PI + Math.max(0, Math.min(2, v)) / 2 * Math.PI;
    const setNeedle = (v) => { const a = angOf(v); needle.setAttribute("x2", f1(dcx + (R - 14) * Math.cos(a))); needle.setAttribute("y2", f1(dcy + (R - 14) * Math.sin(a))); };
    setNeedle(T);
    const tTxt = (v) => (LB.temperature ? `${LB.temperature} ${(+v).toFixed(1)}` : `T ${(+v).toFixed(1)}`);
    const tO = { x: dcx - L.dialW / 2, y: dcy + 14, w: L.dialW, h: L.lh, size: Z.fs, weight: 700, align: "center", eng, pen, name: "temp", kind: "label" };
    const TL = { w: DK.word(ctx, dg, tTxt(T), Object.assign({}, tO, { at: animated ? p.at + 0.4 : -1 })) };
    parts.dial = dg;
    // ---- motion and state functions
    const setBars = (to, t, dur) => {
      const from = probs.slice();
      parts.bars.forEach((B, i) => {
        Loom.drive((e) => B.bar.setAttribute("width", f1(bw * (from[i] + (to[i] - from[i]) * e))), t, dur, "move", DK.meta("count", "tokens.bar"));
        if (kitWord(B.pct.w)) Loom.drive((e) => { const n = B.pct.w.querySelector("tspan") || B.pct.w; n.textContent = pct(from[i] + (to[i] - from[i]) * e); }, t, dur, "move", DK.meta("count", "tokens.pct"));
        else DK.swapWord(ctx, B.g, B.pct, pct(to[i]), { x: bx + bw + 12, y: B.y, w: L.pctW, h: rowH - 12, size: Z.fs, weight: 700, eng, pen, name: `p_${i}`, kind: "label" }, t + dur - 0.2);
      });
      probs = to;
      return t + dur;
    };
    parts.setTemperature = function (v, t) {
      const a = T; T = +v;
      Loom.drive((e) => setNeedle(a + (T - a) * e), t, 0.6, "move", DK.meta("travel", "tokens.dial"));
      DK.swapWord(ctx, dg, TL, tTxt(T), tO, t + 0.4);
      const te = setBars(shape(T), t, 0.6);
      if (P < 1) parts.setTopP(P, te);
      return te;
    };
    parts.setTopP = function (v, t) {
      P = +v;
      const k = cutAt(P), y = cutY(k);
      if (P >= 1) {
        // no cut: the line, its tag and its value go
        for (const nd of [cutLine, tag]) Loom.tween(nd, { opacity: +nd.getAttribute("opacity") }, { opacity: 0, duration: 0.25 }, t, DK.meta("state", "tokens.cut"));
        if (cutLab.w && cutLab.w.nodeType) DK.fadeOut(cutLab.w, t);
        cutLab.w = null;
        greyRows(probs.length, t); return t + 0.3;
      }
      for (const nd of [cutLine, tag]) Loom.tween(nd, { opacity: +nd.getAttribute("opacity") }, { opacity: 1, duration: 0.25 }, t, DK.meta("state", "tokens.cut"));
      const y0 = +cutLine.getAttribute("y1");
      Loom.drive((e) => { const yy = y0 + (y - y0) * e; cutLine.setAttribute("y1", f1(yy)); cutLine.setAttribute("y2", f1(yy)); tag.setAttribute("y", f1(yy - tagH / 2)); }, t, 0.4, "move", DK.meta("travel", "tokens.cut"));
      cutLine.setAttribute("y1", f1(y)); cutLine.setAttribute("y2", f1(y)); tag.setAttribute("y", f1(y - tagH / 2));
      if (cutLab.w) DK.swapWord(ctx, cutG, cutLab, cutText(P), cutO(), t + 0.3); else cutLab.w = DK.word(ctx, cutG, cutText(P), Object.assign(cutO(), { at: t + 0.3 }));
      greyRows(k, t + 0.2);
      return t + 0.6;
    };
    parts.sample = function (i, t) {
      const B = parts.bars[i], c = L.cands[i];
      if (!B) return t;
      AK.show(B.mark, t, 0.25);
      // the token flies from its row to the end of the context, then stays there marked
      const fly = svg("g", { opacity: 0 }, g), tok = String(c.token);
      const M = pen ? (DK.word(ctx, fly, tok, { x: 0, y: 0, w: handW(tok) + 20, h: L.cLH, size: Z.fs, weight: 700, at: t + 0.3, eng, pen, parentG: fly, name: "pick", kind: "label" }), { w: handW(tok) }) : AK.mono(fly, [[tok, accent, 700]], { x: 0, y: 0, h: L.cLH, size: CS });
      const x1 = caretX, y1 = caretY, x0 = 6, y0 = B.y;
      Loom.drive((e, raw) => { fly.setAttribute("transform", `translate(${f1(x0 + (x1 - x0) * e)} ${f1(y0 + (y1 - y0) * e)})`); fly.setAttribute("opacity", raw > 0 ? 1 : 0); }, t + 0.3, 0.7, "move", DK.meta("travel", "tokens.sample"));
      Loom.drive((e) => caret.setAttribute("x", f1(caretX + (M.w + 2) * e)), t + 0.95, 0.05, "linear", DK.meta("state", "tokens.caret"));
      parts.pick = fly;
      return t + 1.0;
    };
    if (animated) {
      AK.show(cg, p.at, 0.3);
      parts.bars.forEach((B, i) => Loom.drive((e) => B.bar.setAttribute("width", f1(bw * probs[i] * e)), p.at + 0.4 + i * 0.08, 0.5, "move", DK.meta("reveal", "tokens.bar")));
      if (p.pick >= 0) parts.sample(p.pick, p.at + 1.2 + L.cands.length * 0.08);
    } else if (p.pick >= 0 && parts.bars[p.pick]) {
      // still: the pick marked, its token already at the end of the context
      parts.bars[p.pick].mark.setAttribute("opacity", 1);
      const fly = svg("g", { transform: `translate(${f1(caretX)} ${f1(caretY)})` }, g);
      const tk = String(L.cands[p.pick].token);
      const M = pen ? (DK.word(ctx, fly, tk, { x: 0, y: 0, w: handW(tk) + 20, h: L.cLH, size: Z.fs, weight: 700, at: -1, eng, pen, parentG: fly, name: "pick", kind: "label" }), { w: handW(tk) }) : AK.mono(fly, [[tk, accent, 700]], { x: 0, y: 0, h: L.cLH, size: CS });
      caret.setAttribute("x", f1(caretX + M.w + 2));
      parts.pick = fly;
    }
    for (const st of p.steps || []) {
      if (!st || st.at == null) continue;
      if (st.do === "temperature") parts.setTemperature(st.v, st.at);
      else if (st.do === "topP") parts.setTopP(st.v, st.at);
      else if (st.do === "sample") parts.sample(st.i, st.at);
      else Loom.error("component_params", `ai_token_distribution: step "${st.do}" is not temperature, topP or sample`);
    }
    void muted;
    return parts;
  },
});

// the geometry, shared by size() and build()
Loom.devKit.tokLayout = function (p) {
  const AK = Loom.appKit, DK = Loom.devKit, Z = DK.ui().Z;
  const CS = DK.codeSize(24), cLH = DK.codeLH(CS);
  const lh = AK.lineH(Z.fs, "caption", 700), lhS = AK.lineH(Z.small, "caption", 700);
  const cands = (p.candidates || []).map((c) => ({ token: String(c.token == null ? "" : c.token), p: +c.p || 0 }));
  // the context wraps in the mono face, at most 3 rows; room is kept on its last row for a sampled token
  const longest = Math.max(4, ...cands.map((c) => c.token.length));
  const cols = DK.cols(p.w - 44, CS);
  let rows = DK.wrapCols(String(p.context), cols);
  if (rows[rows.length - 1].length + longest + 1 > cols) rows = rows.concat([""]).slice(-4);
  rows = rows.slice(0, 3);
  const ctxH = 28 + rows.length * cLH;
  const tokW = Math.min(p.w * 0.3, (longest + 2) * AK.monoW(CS) + 12);

  // the dial's column is as wide as its words ("temperature 1.4"), the hand's lettering wider still
  let engK = 1;
  try { const e = p.engine !== "off" && Loom.engines && Loom.engines.current && Loom.engines.current(); if (e && e.id === "whiteboard") engK = 1.6; else if (e && e.id === "blueprint") engK = 1.35; } catch (e) { engK = 1; }
  const tl = `${(p.labels || {}).temperature || "T"} 0.0`;
  const pctW = AK.measure("100.0%", "caption", Z.fs, 700) * engK + 10;
  const dialR = 70, dialW = Math.max(2 * dialR + 50, AK.measure(tl, "caption", Z.fs, 700) * engK + 30);
  const rowH = Math.max(cLH + 20, 56);
  const barsH = cands.length * rowH;
  const h = ctxH + 26 + Math.max(barsH, 30 + 2 * dialR + lh + 40) + 6;
  return { Z, CS, cLH, lh, lhS, cands, ctxRows: rows, ctxH, tokW, pctW, dialR, dialW, rowH, h };
};
