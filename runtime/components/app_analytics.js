// T-158 app_analytics: a generic analytics workspace shell (hand-off sheet, Family M). Built on runtime/components/_app_kit.js.
Loom.component("app_analytics", {
  version: 1,
  idea: "An analytics workspace: a dashboard's filters, headline numbers, a grid of charts and a table under them, walked through by a pointer that changes a filter so every number answers, drills into one bar so the table narrows to it, and exports the view.",
  outline: ["window (or the screencast engine's app window)", "header: dashboard title and an export button", "filter bar: chips of label and value, a menu of options", "headline cards: label, value, change", "chart grid: line or bar charts with titles", "drill-down table with a breadcrumb", "export menu and toast", "pointer"],
  family: "viz",
  tags: ["analytics", "dashboard", "business intelligence", "bi", "report", "filter", "drill down", "kpi", "data", "export"],
  commissioned_by: "Kshitij 2026-10-16 (hand-off sheet T-158)",
  styles: ["screencast", "corporate-clean", "engineering", "line-art", "editorial-paper", "presenter-pop"],   // a product UI: the styles that show products as screens (D-193)
  params: {
    dashboard: { type: "str", content: true },   // the dashboard's title
    charts: { type: "list", content: true },     // one or two: [{title, type: "line"|"bar", labels, series: [{name, values, tone}], unit}]
    filters: { type: "list" },                   // [{label, value, options: [values], data: {option: {kpis: [values], charts: [[series values]], rows: [[cells]]}}}]
    kpis: { type: "list" },                      // [{label, value, delta, tone: "pos"|"neg"}]
    table: { type: "obj" },                      // {title, columns: [words], rows: [[cells]], key (the column matching a chart's labels), align: ["left"|"right"]}
    title: { type: "str" },
    labels: { type: "obj" },                     // the product's words, each optional: {export, formats: [words], exported, all}
    state: { type: "enum", choices: ["ready", "loading", "empty", "error"], default: "ready" },
    notice: { type: "str" },
    steps: { type: "list", default: [] },        // [{do: "filter"|"drillDown"|"export"|"state", at, ...}]
    theme: { type: "obj", default: {} }, layout: { type: "obj", default: {} },
    w: { type: "number", default: 1728 }, h: { type: "number", default: 856 },
    at: { type: "number", default: -1 }, cps: { type: "number", default: 14 },
    engine: { type: "enum", choices: ["auto", "off"], default: "auto" },
  },
  slots: {},
  parts: ["host", "header", "chips", "cards", "charts", "table", "rows", "breadcrumb", "states",
    "filter(i, value, at)", "drillDown(chart, index, at)", "export(at, {format})", "setState(name, at)"],
  example: 'ctx.use("app_analytics", { dashboard: "Support queue", kpis: [{ label: "Open tickets", value: "128" }], charts: [{ title: "Tickets a day", type: "bar", labels: ["Mon", "Tue", "Wed"], series: [{ values: [40, 52, 36] }] }], table: { columns: ["Day", "Tickets"], rows: [["Mon", "40"], ["Tue", "52"], ["Wed", "36"]], key: 0 }, steps: [{ do: "drillDown", chart: 0, index: 1, at: ctx.cue("Tuesday was the peak") }] }, { x: 96, y: 78, name: "bi" })',
  size: (p) => ({ w: p.w, h: p.h }),
  build(ctx, g, p) {
    const AK = Loom.appKit, svg = (t, a, q) => Loom.svg(t, a, q);
    const T = AK.theme(p.theme), Z = AK.sizes(T), tones = AK.tones(T), L = p.labels || {};
    const H = AK.host(ctx, g, p, { T, Z, title: p.title });
    const B = H.body, BW = B.w, BH = B.h, pad = Z.pad, root = B.g;
    AK.box(root, 0, 0, BW, BH, { r: 0, fill: tones.page });
    const X0 = pad * 1.4, W0 = BW - pad * 2.8;
    const PH = AK.boxH(Z.small, "caption", 600);

    // ---------------------------------------------------------------- header and filters
    const headH = Math.max(Z.lhB, Z.ctl) + 8;
    const header = svg("g", {}, root);
    const expB = AK.button(header, X0 + W0, pad * 0.8 + (headH - Z.ctl) / 2, { label: L.export, icon: "download", T, Z, align: "right" });
    AK.icon(header, "chart-no-axes-combined", X0 + 16, pad * 0.8 + headH / 2, 28, T.accent);
    AK.T(svg("g", {}, header), p.dashboard, { role: "lead", x: X0 + 44, y: pad * 0.8, w: expB.x - X0 - 60, h: headH, size: Z.big, weight: 700 });
    let y = pad * 0.8 + headH + 8;
    const chipH = AK.boxH(Z.fs, "caption", 600, Z.ctl - 4);
    const chips = [];
    let cx = X0;
    // a chip never runs past the row: its value is cut at a word to the room left, and a chip with no room is not drawn
    const rowEnd = X0 + W0;
    let full = false;
    (p.filters || []).forEach((f, i) => {
      const lab0 = f.label ? `${f.label}: ` : "";
      const fw0 = String(f.value).split(/\s+/)[0] + (/\s/.test(String(f.value)) ? "…" : "");
      if (full || cx + AK.measure(lab0, "caption", Z.fs, 400) + AK.measure(fw0, "caption", Z.fs, 700) + 78 > rowEnd) { full = true; return; }
      const cg = svg("g", {}, header);
      const lab = f.label ? `${f.label}: ` : "";
      const cy0 = y;
      const draw = (val, parent, x0, maxW) => {
        const cx = x0, y = cy0, s1 = AK.measure(lab, "caption", Z.fs, 400);
        // never below the value's first word: a word cut to its first letters reads as a word no param supplied
        const fw = String(val).split(/\s+/)[0] + (/\s/.test(String(val)) ? "…" : "");
        val = AK.fitWords(String(val), "caption", Z.fs, 700, Math.max(AK.measure(fw, "caption", Z.fs, 700), maxW - s1 - 74 - 4));
        const gg = svg("g", {}, parent), s2 = AK.measure(String(val), "caption", Z.fs, 700);
        const w = Math.ceil(s1 + s2 + 74);
        AK.box(gg, cx, y, w, chipH, { r: chipH / 2, fill: tones.card, stroke: tones.hair2 });
        AK.icon(gg, "filter", cx + 24, y + chipH / 2, 18, "muted");
        if (lab) AK.T(gg, lab.trim(), { x: cx + 40, y, w: s1 + 2, h: chipH, size: Z.fs, color: "muted" });
        AK.T(gg, String(val), { x: cx + 40 + s1, y, w: s2 + 4, h: chipH, size: Z.fs, weight: 700 });
        AK.icon(gg, "chevron-down", cx + w - 22, y + chipH / 2, 18, "muted");
        return { g: gg, w };
      };
      const first = draw(f.value, cg, cx, rowEnd - cx);
      chips.push({ g: cg, cur: first.g, x: cx, y, w: first.w, h: chipH, f, draw, value: f.value, x0: cx });
      cx += first.w + 10;
    });
    if (chips.length) y += chipH + pad * 0.7;

    // ---------------------------------------------------------------- headline cards
    const cards = [];
    const kp = (p.kpis || []).slice(0, 4);
    if (kp.length) {
      const gap = 16, cw = (W0 - gap * (kp.length - 1)) / kp.length, vh = AK.lineH(Z.big, "lead", 700), ch = Math.round(14 + Z.lhS + vh + 12);
      const ky = y;
      kp.forEach((k, i) => {
        const x = X0 + i * (cw + gap), cg = svg("g", {}, root), y = ky;
        AK.box(cg, x, y, cw, ch, { r: T.radius, fill: tones.card, stroke: tones.hair2 });
        AK.T(cg, k.label || "", { x: x + 18, y: y + 12, w: cw - 36, h: Z.lhS, size: Z.small, color: "muted" });
        const draw = (val, delta, tone, parent) => {
          const vg = svg("g", {}, parent);
          const dw = delta ? AK.measure(delta, "caption", Z.small, 700) + 46 : 0;
          AK.T(vg, String(val == null ? "" : val), { role: "lead", x: x + 18, y: y + 12 + Z.lhS, w: cw - 36 - dw, h: vh, size: Z.big, weight: 700 });
          if (delta) { const tn = tone === "neg" ? "neg" : tone === "pos" ? "pos" : "muted"; AK.pill(vg, x + cw - 16, y + 12 + Z.lhS + (vh - PH) / 2, delta, { size: Z.small, fill: AK.mix("surface", tn, 0.16), color: tn === "muted" ? "ink" : tn, weight: 700, h: PH, align: "right", icon: tone === "neg" ? "trending-down" : tone === "pos" ? "trending-up" : null }); }
          return vg;
        };
        cards.push({ g: cg, cur: draw(k.value, k.delta, k.tone, cg), draw, k });
      });
      y += ch + pad * 0.7;
    }

    // ---------------------------------------------------------------- charts and table
    const tbl = p.table || null;
    const RH = AK.boxH(Z.fs, "caption", 600, Math.round(Z.row * 0.86));
    const tableMin = tbl ? AK.boxH(Z.small, "caption", 600, 46) + Z.lh + 18 + RH * 2 + 16 : 0;
    const chartsH = Math.max(220, Math.min(340, BH - y - pad - tableMin - pad * 0.7));
    const cs = p.charts.slice(0, 2), cgap = 16, ccw = (W0 - cgap * (cs.length - 1)) / Math.max(1, cs.length);
    const charts = cs.map((c, i) => {
      const x = X0 + i * (ccw + cgap), gg = svg("g", {}, root);
      AK.box(gg, x, y, ccw, chartsH, { r: T.radius, fill: tones.card, stroke: tones.hair2 });
      if (c.title) AK.T(gg, c.title, { x: x + 20, y: y + 10, w: ccw - 40, h: Z.lh, size: Z.fs, weight: 700 });
      const alt = [];
      (p.filters || []).forEach((f) => Object.values(f.data || {}).forEach((d) => ((d.charts || [])[i] || []).forEach((sv) => [].concat(sv).forEach((v) => { if (typeof v === "number") alt.push(v); }))));
      const C = AK.chart(gg, x + 16, y + 14 + Z.lh, ccw - 32, chartsH - 28 - Z.lh, { T, Z, type: c.type, labels: c.labels, series: c.series, unit: c.unit, alt: [alt] });
      return Object.assign(C, { box: { x, y, w: ccw, h: chartsH }, spec: c, gg });
    });
    y += chartsH + pad * 0.7;
    let table = null;
    const rowsList = [];
    if (tbl) {
      const th = BH - y - pad * 0.6, tg = svg("g", {}, root);
      AK.box(tg, X0, y, W0, th, { r: T.radius, fill: tones.card, stroke: tones.hair2 });
      const titleH = Z.lh + 14;
      if (tbl.title) AK.T(svg("g", {}, tg), tbl.title, { x: X0 + 20, y: y + 6, w: W0 * 0.5, h: titleH - 6, size: Z.fs, weight: 700 });
      const crumbX = X0 + 20 + (tbl.title ? Math.min(W0 * 0.5, AK.measure(tbl.title, "caption", Z.fs, 700) + 24) : 0);
      const cols = tbl.columns || [], n = Math.max(1, cols.length || (tbl.rows[0] || []).length), cw = (W0 - 40) / n;
      const al = (i) => (tbl.align || [])[i] || (i ? "right" : "left");
      const hy = y + titleH, hh = AK.boxH(Z.small, "caption", 600, 46);
      AK.box(tg, X0 + 1, hy, W0 - 2, hh, { r: 0, fill: tones.page });
      cols.forEach((c, i) => AK.T(tg, c, { x: X0 + 20 + i * cw, y: hy, w: cw - 16, h: hh, size: Z.small, weight: 600, color: "muted", align: al(i) }));
      const bodyY = hy + hh, maxRows = Math.max(1, Math.floor((y + th - bodyY - 6) / RH));
      const drawRows = (rows, parent) => {
        const gg = svg("g", {}, parent), out = [];
        rows.slice(0, maxRows).forEach((r, k) => {
          const ry = bodyY + k * RH;
          if (k) AK.box(gg, X0 + 16, ry, W0 - 32, 1, { r: 0, fill: tones.hair });
          r.forEach((v, i) => AK.T(gg, String(v), { x: X0 + 20 + i * cw, y: ry, w: cw - 16, h: RH, size: Z.fs, weight: i === 0 ? 600 : 400, align: al(i) }));
          out.push({ y: ry, r });
        });
        return { g: gg, rows: out };
      };
      const first = drawRows(tbl.rows || [], tg);
      rowsList.push(...first.rows);
      table = { g: tg, cur: first.g, drawRows, crumbX, crumbY: y + (titleH - PH) / 2 + 2, maxRows, key: tbl.key == null ? 0 : tbl.key, rows: tbl.rows || [] };
    }
    // states (over everything under the header)
    const top0 = pad * 0.8 + headH + 4;
    const cover = (gg) => AK.box(gg, 0, top0, BW, BH - top0, { r: 0, fill: tones.page });
    const loadG = svg("g", {}, root); cover(loadG);
    for (let k = 0; k < 4; k++) AK.box(loadG, X0 + k * (W0 / 4), top0 + 20, W0 / 4 - 16, 110, { r: T.radius, fill: tones.track });
    AK.box(loadG, X0, top0 + 150, W0 / 2 - 8, 300, { r: T.radius, fill: tones.track, opacity: 0.8 });
    AK.box(loadG, X0 + W0 / 2 + 8, top0 + 150, W0 / 2 - 8, 300, { r: T.radius, fill: tones.track, opacity: 0.8 });
    const msg = (gg, icon, tone) => {
      cover(gg);
      AK.icon(gg, icon, BW / 2, top0 + (BH - top0) * 0.38, 60, tone || "muted");
      if (p.notice) AK.P(gg, p.notice, { x: BW * 0.25, y: top0 + (BH - top0) * 0.38 + 50, w: BW * 0.5, size: Z.fs, maxLines: 3, color: "muted", align: "center" });
    };
    const emptyG = svg("g", {}, root); msg(emptyG, "chart-no-axes-column");
    const errG = svg("g", {}, root); msg(errG, "circle-alert", "neg");
    const states = AK.states({ ready: svg("g", {}, root), loading: loadG, empty: emptyG, error: errG }, p.state || "ready");

    // ---------------------------------------------------------------- actions
    const at0 = (t) => (t == null ? Math.max(H.free + 0.4, p.at >= 0 ? p.at + 0.6 : 0.4) : t);
    const A = {};
    let crumb = null;
    function menu(anchor, items, t) {
      // a menu under its anchor; returns the rect of each item
      const ih = AK.boxH(Z.fs, "caption", 600, Z.ctl), mw = Math.max(anchor.w, 240, ...items.map((s) => AK.measure(String(s), "caption", Z.fs, 600) + 48));
      let mx = anchor.x; if (mx + mw > BW - 8) mx = anchor.x + anchor.w - mw;
      const my = anchor.y + anchor.h + 6, mh = items.length * ih + 12;
      const mg = svg("g", { opacity: 0 }, B.over);
      AK.box(mg, mx, my + 6, mw, mh, { r: T.radius, fill: tones.shadow, opacity: 0.12 });
      AK.box(mg, mx, my, mw, mh, { r: T.radius, fill: "surface", stroke: tones.hair2 });
      const rects = items.map((s, i) => { const iy = my + 6 + i * ih; AK.T(mg, String(s), { x: mx + 20, y: iy, w: mw - 40, h: ih, size: Z.fs, weight: 600 }); return { x: mx + 6, y: iy, w: mw - 12, h: ih }; });
      AK.show(mg, t, 0.15);
      return { g: mg, rects };
    }
    A.filter = function (i, value, at) {
      const C = chips[i];
      if (!C) { Loom.error("component_params", `app_analytics.filter: no filter ${i}` + (i < (p.filters || []).length ? " drawn (the filter row is full: shorten the chips before it)" : "")); return at0(at); }
      const tp = H.click(C, at0(at));
      const opts = C.f.options && C.f.options.length ? C.f.options : [value];
      const M = menu(C, opts, tp + 0.1);
      const k = Math.max(0, opts.indexOf(value));
      const tc = H.click(M.rects[k], tp + 0.85, { fx: 0.3 });
      AK.hide(M.g, tc + 0.1, 0.12);
      // the chip shows its new value
      // room for the new value: the row's end less the chips after it, which slide along
      const after = chips.slice(i + 1).reduce((a, N) => a + N.w + 10, 0);
      const nc = C.draw(value, C.g, C.x0, rowEnd - C.x - after);
      nc.g.setAttribute("opacity", 0);
      AK.hide(C.cur, tc + 0.12, 0.1); AK.show(nc.g, tc + 0.15, 0.15);
      C.cur = nc.g; C.value = value;
      // the chips after it close up (or make room) for the new width
      const dw = nc.w - C.w; C.w = nc.w;
      if (dw) chips.slice(i + 1).forEach((N) => { N.dx = (N.dx || 0) + dw; AK.shift(N.g, N.dx, 0, tc + 0.15, 0.25); N.x += dw; });
      // every number answers: the cards, the charts, the table
      const d = (C.f.data || {})[value];
      const t = tc + 0.3;
      if (d) {
        (d.kpis || []).forEach((v, j) => {
          const K0 = cards[j]; if (!K0 || v == null) return;
          const o = typeof v === "object" ? v : { value: v };
          const ng = K0.draw(o.value, o.delta, o.tone, K0.g); ng.setAttribute("opacity", 0);
          AK.hide(K0.cur, t, 0.12); AK.show(ng, t + 0.1, 0.2); K0.cur = ng;
        });
        (d.charts || []).forEach((vals, j) => { const Ch = charts[j]; if (Ch) Ch.set([].concat(Array.isArray(vals[0]) ? vals : [vals]), t, 0.7); });
        if (d.rows && table) {
          const nr = table.drawRows(d.rows, table.g); nr.g.setAttribute("opacity", 0);
          AK.hide(table.cur, t, 0.12); AK.show(nr.g, t + 0.15, 0.2); table.cur = nr.g; table.rows = d.rows;
        }
      }
      return t + 0.8;
    };
    A.drillDown = function (ci, index, at) {
      const Ch = charts[ci];
      if (!Ch) { Loom.error("component_params", `app_analytics.drillDown: no chart ${ci}`); return at0(at); }
      const r = Ch.type === "bar" ? Ch.bar(0, index) : Ch.col(index);
      const tp = H.click(r, at0(at), { fx: 0.5, fy: 0.5 });
      // the chosen column stays, the others step back
      const dim = svg("g", { opacity: 0 }, Ch.g);
      for (let k = 0; k < Ch.n; k++) if (k !== index) { const c = Ch.col(k); AK.box(dim, c.x, c.y - 2, c.w, c.h + 4, { r: 0, fill: tones.card, opacity: 0.7 }); }
      AK.show(dim, tp + 0.1, 0.25);
      const lab = (Ch.spec.labels || [])[index];
      let t = tp + 0.4;
      if (table && lab != null) {
        const keep = table.rows.filter((row) => String(row[table.key]) === String(lab));
        const nr = table.drawRows(keep.length ? keep : table.rows, table.g); nr.g.setAttribute("opacity", 0);
        AK.hide(table.cur, t, 0.12); AK.show(nr.g, t + 0.12, 0.2); table.cur = nr.g;
        // a breadcrumb names the slice
        if (crumb) AK.hide(crumb, t, 0.1);
        crumb = svg("g", { opacity: 0 }, table.g);
        const parts = [L.all, String(lab)].filter(Boolean);
        AK.pill(crumb, table.crumbX, table.crumbY, parts.join(" / "), { size: Z.small, icon: "list-filter", fill: tones.sel, color: T.accent, weight: 600, h: PH });
        AK.show(crumb, t + 0.15, 0.2);
        t += 0.5;
      }
      return t;
    };
    A.export = function (at, o) {
      o = o || {};
      const tp = H.click(expB, at0(at));
      const fm = L.formats && L.formats.length ? L.formats : null;
      let t = tp + 0.3;
      if (fm) {
        const M = menu(expB, fm, tp + 0.1);
        const k = Math.max(0, fm.indexOf(o.format));
        const tc = H.click(M.rects[k], tp + 0.85, { fx: 0.3 });
        AK.hide(M.g, tc + 0.1, 0.12);
        t = tc + 0.3;
      }
      return L.exported ? H.toast(L.exported, t, { icon: "file-down" }) : t;
    };
    A.setState = function (name, at) { return states.set(name, at0(at)); };
    A.state = A.setState;
    AK.reveal(g, p.at);
    AK.runSteps(A, p.steps, { filter: ["i", "value", "at"], drillDown: ["chart", "index", "at"], export: ["at", "opts"], state: ["state", "at"] });
    return Object.assign({ host: H, header, chips, cards, charts, table, rows: rowsList, breadcrumb: () => crumb, states }, A);
  },
});
