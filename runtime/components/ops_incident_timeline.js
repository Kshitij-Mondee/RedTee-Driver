// T-025 ops_incident_timeline: an incident on a time axis (hand-off sheet, Family B). Built on _app_kit.js and
// _dev_kit.js. Extends the `timeline` template (a general lesson timeline) with what an incident review needs: phases as
// bands, events as pins with their time and kind, duration brackets (time to detect, time to resolve), long quiet gaps
// shown as a break in the axis, and labels set in rows so close events never collide. In the whiteboard and blueprint
// styles every word is written by the hand or lettered by the pen.
Loom.component("ops_incident_timeline", {
  version: 1,
  idea: "An incident timeline: a time axis with the incident's phases as bands, events as pins with their time, kind and label set in rows so they never collide, long quiet gaps drawn as a break in the axis, and brackets for durations such as time to detect and time to resolve; the events reveal in time order.",
  outline: ["phase bands along the axis with their names", "the axis, with a break mark for a long gap", "event pins: a dot on the axis, a stem to its label row, an icon for its kind, its time and its label", "duration brackets under the axis with their labels"],
  family: "ops",
  tags: ["incident", "postmortem", "timeline", "mttr", "mttd", "outage", "on-call", "blameless review", "incident response", "sre"],
  commissioned_by: "Kshitij 2026-10-16 (hand-off sheet T-025)",
  // incident tools show it as a screen, and the drawing styles teach it as a diagram (D-193)
  styles: ["screencast", "corporate-clean", "engineering", "line-art", "editorial-paper", "presenter-pop", "dark-technical", "whiteboard", "blueprint", "chalk-lab"],
  params: {
    events: { type: "list", content: true },       // [{t (a number on one scale: minutes from the start), time? ("14:02"), label, kind?: alert|detect|action|comms|resolve|note}]
    phases: { type: "list", content: true },       // [{from, to, label}] on the same scale
    brackets: { type: "list", default: [] },       // [{from, to, label}] durations under the axis (content when given)
    w: { type: "number", default: 1700 },
    at: { type: "number", default: -1 },
    gap: { type: "number", default: 0.35 },        // seconds between events when they reveal
    breakAfter: { type: "number", default: 0 },    // a quiet gap longer than this (on the scale) is drawn as a break; 0: four times the median gap
    steps: { type: "list", default: [] },          // [{do: "play", at, dur} | {do: "focus", i, at}]
    engine: { type: "enum", choices: ["auto", "off"], default: "auto" },
  },
  slots: {},
  parts: ["axis", "bands[]", "pins[]", "brackets[]", "play(t, dur)", "focus(i, t)"],
  example: 'ctx.use("ops_incident_timeline", { phases: [{ from: 0, to: 9, label: "Detect" }, { from: 9, to: 40, label: "Mitigate" }], events: [{ t: 0, time: "09:12", label: "Error rate alert", kind: "alert" }, { t: 9, time: "09:21", label: "Rollback started", kind: "action" }, { t: 40, time: "09:52", label: "Errors back to normal", kind: "resolve" }], at: ctx.cue("nine minutes") }, { x: 110, y: 300, name: "incident" })',
  size: (p) => { const L = Loom.devKit.incidentLayout(p); return { w: p.w, h: L.h }; },
  build(ctx, g, p) {
    const AK = Loom.appKit, DK = Loom.devKit, S = Loom.style, K = Loom.kit, svg = (t, a, q) => Loom.svg(t, a, q), f1 = DK.f1;
    const L = DK.incidentLayout(p), Z = L.Z;
    const animated = p.at != null && p.at >= 0;
    const eng = DK.engine(ctx, g, p), pen = DK.pen(ctx, eng);
    const field = S.c("field"), ink = S.c("ink");
    const KIND = { alert: ["bell-ring", "neg"], detect: ["scan-search", DK.warnTok()], action: ["wrench", "accent"], comms: ["megaphone", "accent3"], resolve: ["circle-check", "pos"], note: ["circle-dot", "muted"] };
    const parts = { bands: [], pins: [], brackets: [] };
    const stemG = svg("g", {}, g), bandG = svg("g", {}, g), axisG = svg("g", {}, g), pinG = svg("g", {}, g), wordG = svg("g", {}, g);
    const BT = DK.tones().filter((t) => t !== "muted");
    const t0 = animated ? p.at : -1;
    // ---- phase bands, their names inside at the left
    L.phases.forEach((ph, i) => {
      const x0 = L.X(ph.from), x1 = L.X(ph.to), tok = BT[i % BT.length];
      const bg = svg("g", {}, bandG);
      svg("rect", { x: f1(x0), y: L.bandY, width: f1(Math.max(2, x1 - x0)), height: L.bandH, rx: 8, fill: S.mix(S.c(tok), field, 0.82), stroke: S.mix(S.c(tok), field, 0.4), "stroke-width": 1.5 }, bg);
      // a band too narrow for its name has the name under the axis, centred on the band
      const w = L.narrow[i]
        ? DK.word(ctx, wordG, ph.label, { x: Math.max(0, (x0 + x1) / 2 - L.phW[i] / 2), y: L.axisY + 14, w: L.phW[i], h: L.lhS, size: Z.small, weight: 700, color: "muted", align: "center", at: t0, eng, pen, name: `phase_${i}`, kind: "label" })
        : DK.word(ctx, wordG, ph.label, { x: x0 + 10, y: L.bandY, w: Math.max(10, x1 - x0 - 20), h: L.bandH, size: Z.fs, weight: 700, color: "ink", at: t0, eng, pen, name: `phase_${i}`, kind: "label" });
      if (animated) AK.show(bg, p.at + i * 0.1, 0.3);
      parts.bands.push({ g: bg, label: w });
    });
    // ---- the axis, with a break mark at each compressed gap
    const ax = svg("g", {}, axisG);
    L.segs.forEach((sg) => K.line(ax, sg.x0, L.axisY, sg.x1, L.axisY, { stroke: "line", sw: 3, crisp: true }));
    L.breaks.forEach((bx) => {
      svg("path", { d: `M${f1(bx - 10)} ${f1(L.axisY + 12)} L${f1(bx - 2)} ${f1(L.axisY - 12)} M${f1(bx + 2)} ${f1(L.axisY + 12)} L${f1(bx + 10)} ${f1(L.axisY - 12)}`, stroke: ink, "stroke-width": 3, fill: "none", "stroke-linecap": "round" }, ax);
    });
    parts.axis = ax;
    if (animated) AK.show(ax, p.at, 0.3);
    // ---- pins: a dot on the axis, a stem to the label's row, the kind's icon, the time, the label
    L.events.forEach((ev, i) => {
      const x = L.X(ev.t), row = L.rows[i], y = L.rowY(row), [ic, tok] = KIND[ev.kind] || KIND.note;
      const col = DK.legible(tok, field, ink, 3);
      const pg = svg("g", {}, pinG);
      // the stem runs under the phase bands, so it never crosses a band's name
      // the stem runs from the axis up the label's edge to its top, like a flag on its pole
      const stem = svg("path", { d: L.stemSegs[i].map(([u, v]) => `M${f1(x)} ${f1(u)} L${f1(x)} ${f1(v)}`).join(" "), stroke: col, "stroke-width": 2, opacity: 0.8, fill: "none" }, stemG);
      svg("circle", { cx: f1(x), cy: f1(L.axisY), r: 9, fill: col, stroke: field, "stroke-width": 3 }, pg);
      const R = L.side[i] === "r", lw = L.labW(i);
      AK.icon(pg, ic, R ? x + 14 : x - 14, y + L.lhS / 2 + 2, 22, tok);
      const tW = ev.time ? DK.word(ctx, wordG, ev.time, { x: R ? x + 30 : x - lw, y, w: lw - 30, h: L.lhS, size: Z.small, weight: 700, fill: col, color: "muted", align: R ? "left" : "right", at: -1, eng, pen, name: `time_${i}`, kind: "label" }) : null;
      const lW = DK.word(ctx, wordG, ev.label, { x: R ? x + 6 : x - lw, y: y + (ev.time ? L.lhS : 0) + 2, w: lw - 6, h: L.lh * L.labLines[i] + 4, size: Z.fs, maxLines: L.labLines[i], align: R ? "left" : "right", at: -1, eng, pen, name: `event_${i}`, kind: "label" });
      parts.pins.push({ g: pg, stem, x, row, time: tW, label: lW, i });
    });
    // ---- brackets under the axis
    L.brackets.forEach((br, i) => {
      const x0 = L.X(br.from), x1 = L.X(br.to), y = L.brY(i), bg = svg("g", {}, axisG);
      svg("path", { d: `M${f1(x0)} ${f1(y - 10)} L${f1(x0)} ${f1(y)} L${f1(x1)} ${f1(y)} L${f1(x1)} ${f1(y - 10)}`, stroke: S.c("accent"), "stroke-width": 2.5, fill: "none" }, bg);
      // the label as wide as its words, centred on its bracket, kept inside the timeline
      const lw = Math.max(x1 - x0, AK.measure(br.label, "caption", Z.small, 700) * L.engK + 16), lx = Math.max(0, Math.min(p.w - lw, (x0 + x1) / 2 - lw / 2));
      const w = DK.word(ctx, wordG, br.label, { x: lx, y: y + 4, w: lw, h: L.lhS, size: Z.small, weight: 700, align: "center", fill: DK.legible("accent", field, ink), at: -1, eng, pen, name: `bracket_${i}`, kind: "label" });
      parts.brackets.push({ g: bg, label: w });
    });
    // ---- motion: events in time order, then the brackets
    const pinNodes = (P) => [P.g, P.stem, P.time && P.time.nodeType ? P.time : null, P.label && P.label.nodeType ? P.label : null].filter(Boolean);
    parts.play = function (t, dur) {
      const n = parts.pins.length, step = dur ? dur / Math.max(1, n) : p.gap;
      parts.pins.forEach((P, k) => { for (const nd of pinNodes(P)) AK.show(nd, t + k * step, 0.25); });
      const te = t + n * step;
      parts.brackets.forEach((B, k) => { AK.show(B.g, te + k * 0.2, 0.3); if (B.label && B.label.nodeType) AK.show(B.label, te + k * 0.2, 0.3); });
      return te + parts.brackets.length * 0.2 + 0.3;
    };
    parts.focus = function (i, t) {
      parts.pins.forEach((P, k) => { const op = k === i ? 1 : 0.3; for (const nd of pinNodes(P)) Loom.tween(nd, { opacity: 1 }, { opacity: op, duration: 0.3 }, t, DK.meta("state", "incident.focus")); });
      return t + 0.3;
    };
    if (animated && !pen) parts.play(p.at + 0.4 + 0.1 * L.phases.length);
    for (const st of p.steps || []) {
      if (!st || st.at == null) continue;
      if (st.do === "play") parts.play(st.at, st.dur);
      else if (st.do === "focus") parts.focus(st.i, st.at);
      else Loom.error("component_params", `ops_incident_timeline: step "${st.do}" is not play or focus`);
    }
    return parts;
  },
});

// the timeline's geometry, shared by size() and build(): a piecewise time scale (a long gap compressed to a break),
// label rows assigned greedily so no two labels overlap
Loom.devKit.incidentLayout = function (p) {
  const AK = Loom.appKit, DK = Loom.devKit, Z = DK.ui().Z;
  let engK = 1;
  try { const e = p.engine !== "off" && Loom.engines && Loom.engines.current && Loom.engines.current(); if (e && e.id === "whiteboard") engK = 1.6; else if (e && e.id === "blueprint") engK = 1.35; } catch (e) { engK = 1; }
  const events = (p.events || []).map((e, i) => Object.assign({}, e, { t: +e.t, i, label: String(e.label == null ? "" : e.label), time: e.time == null ? null : String(e.time) })).sort((a, b) => a.t - b.t || a.i - b.i);
  const phases = (p.phases || []).map((q) => ({ from: +q.from, to: +q.to, label: String(q.label == null ? "" : q.label) }));
  const brackets = (p.brackets || []).map((q) => ({ from: +q.from, to: +q.to, label: String(q.label == null ? "" : q.label) }));
  const lh = AK.lineH(Z.fs), lhS = AK.lineH(Z.small, "caption", 700);
  // the time scale: every distinct time, with any gap longer than the limit drawn as a fixed-width break
  const ts = [...new Set([].concat(events.map((e) => e.t), phases.flatMap((q) => [q.from, q.to]), brackets.flatMap((q) => [q.from, q.to])))].sort((a, b) => a - b);
  const gaps = ts.slice(1).map((t, i) => t - ts[i]).filter((d) => d > 0).sort((a, b) => a - b);
  const med = gaps.length ? gaps[Math.floor(gaps.length / 2)] : 1;
  const lim = p.breakAfter > 0 ? p.breakAfter : Math.max(med * 4, 1e-9);
  const BREAK = 60, left = 30, right = 40;
  const span = gaps.reduce((a, d) => a + (d > lim ? 0 : d), 0) || 1, nBreak = gaps.filter((d) => d > lim).length;
  const k = (p.w - left - right - (nBreak * BREAK)) / span;
  const knots = [{ t: ts[0] || 0, x: left }];
  const breaks = [];
  const segs = [];
  for (let i = 1; i < ts.length; i++) {
    const d = ts[i] - ts[i - 1], prev = knots[knots.length - 1];
    if (d > lim) { breaks.push(prev.x + BREAK / 2); segs.push({ x0: knots[0].x === prev.x && !segs.length ? left - 10 : null, x1: null }); knots.push({ t: ts[i], x: prev.x + BREAK, brk: true }); }
    else knots.push({ t: ts[i], x: prev.x + d * k });
  }
  // the axis is drawn in pieces, broken at each compressed gap
  segs.length = 0;
  let sx = left - 10;
  knots.forEach((kn) => { if (kn.brk) { segs.push({ x0: sx, x1: kn.x - BREAK + BREAK / 2 - 14 }); sx = kn.x - BREAK / 2 + 14; } });
  segs.push({ x0: sx, x1: p.w - 10 });
  const X = (t) => {
    if (!knots.length) return left;
    if (t <= knots[0].t) return knots[0].x;
    for (let i = 1; i < knots.length; i++) if (t <= knots[i].t) {
      const a = knots[i - 1], b = knots[i];
      return b.brk ? (t === b.t ? b.x : a.x + BREAK / 2) : a.x + ((t - a.t) / Math.max(1e-9, b.t - a.t)) * (b.x - a.x);
    }
    return knots[knots.length - 1].x;
  };
  // labels: each event's label is tried on one line or wrapped to two (the narrower break), right of its pin or left of
  // it, and takes the lowest row where (1) it overlaps no label in that row, (2) no stem of a higher label passes
  // through it and (3) its own stem passes through no lower label. Placed from the right, so a run of close events
  // climbs as a staircase. Stems then never cross a word (they had struck through "Latency alert fires" and most of
  // the 14-event case, 2026-10-16 review).
  const maxLab = 300;
  const M = (s, size, wt) => AK.measure(s, "caption", size, wt) * engK;
  const timeW = events.map((e) => (e.time ? M(e.time, Z.small, 700) + 30 : 0));
  const one = events.map((e, i) => Math.max(M(e.label, Z.fs, 400) + 24, timeW[i] + 6));
  const two = events.map((e, i) => {
    const ws = e.label.split(/\s+/).filter(Boolean);
    let best = Infinity;
    for (let c = 1; c < ws.length; c++) best = Math.min(best, Math.max(M(ws.slice(0, c).join(" "), Z.fs, 400), M(ws.slice(c).join(" "), Z.fs, 400)));
    return ws.length > 1 ? Math.max(best + 32, timeW[i] + 6) : Infinity;
  });
  // a label longer than maxLab on one line always wraps (and past two lines it is clamped by the word drawer)
  const opts = events.map((e, i) => (one[i] > maxLab ? [[2, Math.min(Math.max(two[i], maxLab * 0.6), maxLab)]] : [[1, one[i]], [2, two[i]]]).filter(([, w]) => isFinite(w)));
  const labW = [], labLines = [], rows = [], side = [], spans = [];
  const xs = events.map((e) => X(e.t));
  const order = events.map((_, i) => i).sort((a, b) => xs[b] - xs[a] || b - a);
  const placed = [];
  const MAXR = 7;   // past seven rows the timeline grows taller than a frame holds: the fallback below breaks a stem instead
  for (const i of order) {
    const x = xs[i];
    let best = null;
    for (const [ln, w] of opts[i]) for (const sd of ["r", "l"]) {
      const a = sd === "r" ? x : x - w - 16, b = sd === "r" ? x + w + 16 : x;
      if (a < 0 || b > p.w) continue;
      for (let r = 0; r < MAXR; r++) {
        let ok = true;
        for (const j of placed) {
          const [u, v] = spans[j];
          if (rows[j] === r && a < v + 8 && b > u - 8) { ok = false; break; }           // (1) same row, overlapping
          if (rows[j] > r && xs[j] > a - 4 && xs[j] < b + 4) { ok = false; break; }     // (2) a higher stem through this label
          if (rows[j] < r && x > u - 4 && x < v + 4) { ok = false; break; }             // (3) this stem through a lower label
        }
        // a label hung left over pins not yet placed leaves each of them a row below it to climb to: more pins under it
        // than rows below it is a dead end (an early pin would find no row that keeps its stem clear)
        if (ok && sd === "l") { const under = order.filter((j) => !placed.includes(j) && j !== i && xs[j] > a - 4 && xs[j] < b - 4).length; if (under > r) ok = false; }
        if (ok) {
          // the lowest row wins; then one line before two, then the right side
          const score = r * 10 + (ln - 1) * 3 + (sd === "l" ? 1 : 0);
          if (!best || score < best.score) best = { r, ln, w, sd, a, b, score };
          break;
        }
      }
    }
    if (!best) {
      // no room that clears every stem: the lowest free row, its stem broken where it passes behind a label
      const [ln, w] = opts[i][opts[i].length - 1] || [1, one[i]];
      const right = x + w + 16 <= p.w, a = right ? x : Math.max(0, x - w - 16), b = right ? x + w + 16 : x;
      let r = 0;
      while (placed.some((j) => rows[j] === r && a < spans[j][1] + 8 && b > spans[j][0] - 8)) r++;
      best = { r, ln, w, sd: right ? "r" : "l", a, b };
      Loom.warn("dev_incident_crowded", `ops_incident_timeline: "${e0(i)}" has no row clear of the other stems (its stem passes behind a label; widen w or space the events)`);
    }
    rows[i] = best.r; labLines[i] = best.ln; labW[i] = best.w; side[i] = best.sd; spans[i] = [best.a, best.b];
    placed.push(i);
  }
  function e0(i) { return events[i].label; }
  const cardH = Math.max(lh, ...events.map((e, i) => (e.time ? lhS : 0) + 2 + lh * labLines[i] + 4));
  const rowSpans = [];
  events.forEach((_, i) => { (rowSpans[rows[i]] = rowSpans[rows[i]] || []).push(spans[i]); });
  // each row as tall as its tallest label (a row of one-line labels is not held at the two-line height)
  const nRows = Math.max(1, rowSpans.length);
  const labH = (i) => (events[i].time ? lhS : 0) + 2 + lh * labLines[i] + 4;
  const rowHs = Array.from({ length: nRows }, (_, r) => Math.max(lh, ...events.map((_, i) => (rows[i] === r ? labH(i) : 0))) + 18);
  const top = 6, rowsH = rowHs.reduce((a, b) => a + b, 0);
  const rowY = (r) => top + rowHs.slice(r + 1).reduce((a, b) => a + b, 0);   // row 0 sits nearest the axis
  const bandY = top + rowsH + 8, bandH = Math.max(lh + 16, 48), axisY = bandY + bandH + 18;
  // a band too narrow for its name: the name goes under the axis (and the brackets one row lower)
  const phW = phases.map((q) => AK.measure(q.label, "caption", Z.fs, 700) * engK + 24);
  const narrow = phases.map((q, i) => X(q.to) - X(q.from) < phW[i]);
  const under = narrow.some(Boolean) ? lhS + 10 : 0;
  const brY = (i) => axisY + 34 + under + i * (lhS + 22);
  const h = (brackets.length ? brY(brackets.length - 1) + lhS + 10 : axisY + 24 + under);
  // each label's box, and each stem's pieces: from the axis up to its label's top, broken where it would pass behind a
  // lower label (only when the rows could not keep it clear)
  const boxes = events.map((e, i) => ({ x0: spans[i][0], x1: spans[i][1], y0: rowY(rows[i]) - 4, y1: rowY(rows[i]) + (e.time ? lhS : 0) + 2 + lh * labLines[i] + 6 }));
  const stemSegs = events.map((e, i) => {
    const x = xs[i];
    let segs2 = [[rowY(rows[i]) + 2, axisY - 8]];
    events.forEach((_, j) => {
      if (j === i || rows[j] >= rows[i] || !(x > boxes[j].x0 - 4 && x < boxes[j].x1 + 4)) return;
      const B = boxes[j];
      segs2 = segs2.flatMap(([u, v]) => (B.y1 <= u || B.y0 >= v ? [[u, v]] : [[u, B.y0], [B.y1, v]].filter(([a, b]) => b - a > 2)));
    });
    return segs2;
  });
  return { Z, engK, narrow, phW: phW.map((w) => w * 0.8), lh, lhS, events: events.map((e) => Object.assign({}, e)), phases, brackets, X, segs, breaks, rows, rowY, labW: (i) => labW[i], side, labLines, cardH, bandY, bandH, axisY, brY, h, stemSegs };
};
