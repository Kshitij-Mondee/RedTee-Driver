// T-012 dev_db_table: a database table and the query that reads it (hand-off sheet, Family A). Built on _app_kit.js and
// _dev_kit.js. An optional query bar in the mono face, column headers with their types, rows of cells (numbers right
// aligned), the rows past maxRows summed up in one line, and a row count. On cue the query types and the rows arrive;
// a filter collapses the rows that do not match, a cell can be marked and a column redacted (personal data).
Loom.component("dev_db_table", {
  version: 1,
  idea: "A database table: an optional SQL query bar, column headers with their types, rows of cells with numbers right aligned, the rows past the limit summed up in one line and a row count; on cue the query types and its rows arrive, a filter collapses the rows that do not match, a cell is marked and a column of personal data is masked.",
  outline: ["query bar with the SQL in mono (optional)", "header row: column names and their types", "rows of cells", "a line for the rows not shown", "the row count"],
  family: "dev",
  kind: "screen",
  tags: ["database", "sql", "table", "query", "rows and columns", "join", "data quality", "pii", "redaction", "select"],
  commissioned_by: "Kshitij 2026-10-16 (hand-off sheet T-012)",
  styles: ["screencast", "corporate-clean", "engineering", "line-art", "editorial-paper", "presenter-pop", "dark-technical", "whiteboard", "blueprint"],
  params: {
    columns: { type: "list", content: true },      // [{name, type?}]
    rows: { type: "list", content: true },         // [[cell, ...], ...] (strings or numbers; null is shown as NULL only if given as the text)
    query: { type: "str" },                        // the SQL, shown in a query bar above the table
    title: { type: "str" },                        // the table's name, at the left of the query bar or above the table
    countLabel: { type: "str" },                   // the row count as the lesson words it, {n} the number ("{n} rows")
    moreLabel: { type: "str" },                    // the line for rows not shown, {n} the number ("and {n} more"); "+{n}" when omitted
    total: { type: "int" },                        // the table's real row count when rows is only a sample
    redact: { type: "list", default: [] },         // column indexes (or names) masked from the start
    w: { type: "number", default: 1400 }, maxRows: { type: "int", default: 8 },
    at: { type: "number", default: -1 },           // when the query types and the rows arrive; -1: drawn complete and still
    cps: { type: "number", default: 24 },
    size: { type: "number", default: 22 },
    steps: { type: "list", default: [] },          // [{do: "run", at} | {do: "filter", keep: [row indexes], at} | {do: "mark", r, c, tone, at} | {do: "redact", col, at}]
    engine: { type: "enum", choices: ["auto", "off"], default: "auto" },
  },
  slots: {},
  parts: ["query", "header[]", "cells[r][c]", "rowsG[]", "more", "count", "run(t)", "filter(keepRows, t)", "mark(r, c, tone, t)", "redact(col, t)"],
  example: 'ctx.use("dev_db_table", { title: "shipments", query: "SELECT id, city, status FROM shipments WHERE status = \'late\';", columns: [{ name: "id", type: "int" }, { name: "city", type: "text" }, { name: "status", type: "text" }], rows: [[311, "Lyon", "late"], [318, "Porto", "late"]], countLabel: "{n} rows", at: ctx.cue("only the late ones") }, { x: 260, y: 240, name: "table" })',
  size: (p) => Loom.devKit.dbLayout(p).size,
  build(ctx, g, p) {
    const AK = Loom.appKit, DK = Loom.devKit, S = Loom.style, K = Loom.kit, svg = (t, a, q) => Loom.svg(t, a, q), f1 = DK.f1;
    const L = DK.dbLayout(p), Z = L.Z;
    const animated = p.at != null && p.at >= 0;
    const eng = DK.engine(ctx, g, p), pen = DK.pen(ctx, eng);
    const SC = DK.scheme("light");
    const SYN = DK.syntax({}, S.c("surface"), SC.text);
    const parts = { query: null, header: [], cells: [], rowsG: [], more: null, count: null };
    // the frame
    const fr = pen && animated ? DK.penDraw(pen, eng, (W) => W.roundRect(0, 0, p.w, L.size.h, 14), { at: p.at, dur: 0.8 }) : null;
    const frame = svg("g", {}, g);
    if (fr == null) K.rect(frame, 0, 0, p.w, L.size.h, { fill: "surface", r: 14, stroke: "line", sw: 1.5, shadow: true });
    else svg("rect", { x: 0, y: 0, width: p.w, height: L.size.h, rx: 14, fill: S.c("surface") }, frame);
    if (animated && fr == null) AK.show(frame, p.at, 0.3);
    parts.frame = frame;
    let t = animated ? (fr != null ? fr : p.at + 0.3) : -1;
    // the query bar
    const qg = svg("g", {}, g), qMs = [];
    if (p.query) {
      svg("rect", { x: 12, y: 12, width: p.w - 24, height: L.qH - 12, rx: 10, fill: SC.band("line", 0.07) }, qg);
      AK.icon(qg, "database", 40, 12 + L.qLH / 2 + 12, 24, "muted");
      L.qRows.forEach((segsSrc, k) => { const M = AK.mono(qg, segsSrc.map(([s0, kind]) => [s0, SYN[kind] || SYN.plain]), { x: 66, y: 24 + k * L.qLH, h: L.qLH, size: L.CS }); qMs.push(M); });
      parts.query = qg;
    }
    if (p.title && !p.query) parts.title = AK.T(qg, p.title, { x: 22, y: 8, w: p.w - 44, h: L.qH - 8, size: Z.fs, weight: 700 });
    // the header
    const hg = svg("g", {}, g), y0 = L.top;
    svg("rect", { x: 1, y: f1(y0), width: p.w - 2, height: L.headH, fill: SC.band("line", 0.06) }, hg);
    svg("rect", { x: 1, y: f1(y0 + L.headH - 1), width: p.w - 2, height: 1.5, fill: SC.rule }, hg);
    L.cols.forEach((c, ci) => {
      const cg = svg("g", {}, hg);
      const nm = (c.num ? AK.T : DK.textL)(cg, c.name, { x: c.x + 12, y: y0 + 8, w: c.w - 24, h: L.lh, size: Z.fs, weight: 700, align: c.num ? "right" : "left" });
      const ty = c.type ? AK.mono(cg, [[c.type, SC.muted]], { x: c.num ? c.x + c.w - 12 - c.type.length * AK.monoW(Z.small) : c.x + 12, y: y0 + 8 + L.lh, h: L.lhS, size: Z.small, w: c.w - 24 }) : null;
      parts.header.push({ g: cg, name: nm, type: ty });
    });
    if (animated) AK.show(hg, t, 0.25);
    // rows
    const body = svg("g", {}, g);
    const redacted = new Set();
    const shown = L.rows.slice(0, L.nShow);
    shown.forEach((row, ri) => {
      const wrap = svg("g", {}, body), rg = svg("g", {}, wrap), y = L.top + L.headH + ri * L.rowH;
      const back = svg("rect", { x: 1, y: f1(y), width: p.w - 2, height: L.rowH, fill: ri % 2 ? SC.band("line", 0.035) : "none" }, rg);
      svg("rect", { x: 12, y: f1(y + L.rowH - 1), width: p.w - 24, height: 1, fill: SC.band("line", 0.18) }, rg);
      const cells = L.cols.map((c, ci) => {
        const v = row[ci] == null ? "" : String(row[ci]);
        const cg = svg("g", {}, rg);
        const band = svg("rect", { x: f1(c.x + 4), y: f1(y + 4), width: f1(c.w - 8), height: L.rowH - 8, rx: 6, fill: SC.band("accent", 0.2), opacity: 0 }, cg);
        const txt = v ? (c.num ? AK.T : DK.textL)(cg, v, { x: c.x + 12, y, w: c.w - 24, h: L.rowH, size: Z.fs, align: c.num ? "right" : "left", color: "ink" }) : null;
        const tw = txt ? Math.min(c.w - 24, txt.__w || 40) : 0;
        const mask = svg("rect", { x: f1(c.num ? c.x + c.w - 12 - Math.max(48, tw) : c.x + 12), y: f1(y + L.rowH / 2 - Z.fs * 0.42), width: f1(Math.max(48, tw)), height: f1(Z.fs * 0.84), rx: 4, fill: SC.muted, opacity: 0 }, cg);
        return { g: cg, text: txt, band, mask, y };
      });
      parts.cells.push(cells);
      parts.rowsG.push({ g: rg, wrap, back, y, dy: 0, kept: true });
    });
    // the line for the rows not shown, and the count
    const fy = L.top + L.headH + L.nShow * L.rowH;
    const fg = svg("g", {}, g);
    const fill = (s, n) => String(s).replace(/\{n\}/g, String(n));
    const hidden = L.total - L.nShow;
    if (hidden > 0) parts.more = AK.T(fg, p.moreLabel ? fill(p.moreLabel, hidden) : `+${hidden}`, { x: 22, y: fy, w: p.w * 0.6, h: L.footH, size: Z.fs, color: "muted" });
    if (p.countLabel) parts.count = AK.T(fg, fill(p.countLabel, L.total), { x: p.w * 0.6, y: fy, w: p.w * 0.4 - 22, h: L.footH, size: Z.fs, color: "muted", align: "right", weight: 600 });
    const countState = { n: L.total };

    // ---- state functions
    parts.run = function (at) {
      let te = at;
      if (qMs.length) { qMs.forEach((M) => { te = AK.typeMono(M, te, { cps: p.cps }); }); te += 0.25; }
      parts.rowsG.forEach((R, ri) => AK.show(R.g, te + ri * 0.08, 0.2));
      AK.show(fg, te + parts.rowsG.length * 0.08, 0.25);
      return te + parts.rowsG.length * 0.08 + 0.25;
    };
    parts.filter = function (keep, at) {
      const K0 = new Set((keep || []).map((x) => +x));
      let off = 0;
      parts.rowsG.forEach((R, ri) => {
        const k = K0.has(ri);
        if (!k && R.kept) Loom.tween(R.g, { opacity: 1 }, { opacity: 0, duration: 0.25 }, at, DK.meta("state", "db.filter"));
        R.kept = k && R.kept;
        if (off) { R.dy = -off; AK.shift(R.wrap, 0, -off, at + 0.25, 0.35); }
        if (!R.kept) off += L.rowH;
      });
      if (off) AK.shift(fg, 0, -off, at + 0.25, 0.35);
      if (parts.count && p.countLabel) {
        const n = parts.rowsG.filter((R) => R.kept).length;
        const nt = AK.T(fg, fill(p.countLabel, n), { x: p.w * 0.6, y: fy, w: p.w * 0.4 - 22, h: L.footH, size: Z.fs, color: "muted", align: "right", weight: 600 });
        DK.cross(parts.count, nt, at + 0.3); parts.count = nt; countState.n = n;
      }
      if (parts.more) Loom.tween(parts.more, { opacity: 1 }, { opacity: 0, duration: 0.2 }, at, DK.meta("state", "db.filter"));
      return at + 0.6;
    };
    parts.mark = function (r, c, tone, at) {
      const C = (parts.cells[r] || [])[c];
      if (!C) return at;
      if (tone && tone in S.pack.palette) C.band.setAttribute("fill", SC.band(tone, 0.22));
      if (at == null || at < 0) { C.band.setAttribute("opacity", 1); return at; }
      return DK.flash(C.band, at, { name: "db.mark" });
    };
    const colIndex = (col) => (typeof col === "number" ? col : L.cols.findIndex((c) => c.name === col));
    parts.redact = function (col, at) {
      const ci = colIndex(col);
      if (ci < 0 || redacted.has(ci)) return at;
      redacted.add(ci);
      const still = at == null || at < 0;
      parts.cells.forEach((row, ri) => {
        const C = row[ci];
        if (!C || !C.text) return;
        if (still) { C.text.setAttribute("opacity", 0); C.mask.setAttribute("opacity", 1); }
        else { DK.cross(C.text, C.mask, at + ri * 0.05, 0.2); }
      });
      // the header says the column is masked with a lock
      const H = parts.header[ci], c = L.cols[ci];
      const lk = svg("g", { opacity: still ? 1 : 0 }, H.g);
      AK.icon(lk, "lock", c.num ? c.x + 22 : c.x + c.w - 22, L.top + 8 + L.lh / 2, 20, "muted");
      if (!still) AK.show(lk, at, 0.2);
      return still ? at : at + 0.05 * parts.cells.length + 0.2;
    };
    (p.redact || []).forEach((col) => parts.redact(col, -1));
    if (animated) parts.run(t + 0.2);
    for (const st of p.steps || []) {
      if (!st || st.at == null) continue;
      if (st.do === "run") parts.run(st.at);
      else if (st.do === "filter") parts.filter(st.keep, st.at);
      else if (st.do === "mark") parts.mark(st.r, st.c, st.tone, st.at);
      else if (st.do === "redact") parts.redact(st.col, st.at);
      else Loom.error("component_params", `dev_db_table: step "${st.do}" is not run, filter, mark or redact`);
    }
    return parts;
  },
});

// the table's geometry, shared by size() and build()
Loom.devKit.dbLayout = function (p) {
  const AK = Loom.appKit, DK = Loom.devKit, Z = DK.ui().Z;
  const CS = DK.codeSize(p.size), qLH = DK.codeLH(CS);
  const cols0 = (p.columns || []).map((c) => (typeof c === "string" ? { name: c } : { name: String(c.name == null ? "" : c.name), type: c.type ? String(c.type) : null }));
  const rows = (p.rows || []).map((r) => (Array.isArray(r) ? r : cols0.map((c) => r[c.name])));
  const nShow = Math.min(rows.length, Math.max(1, p.maxRows | 0));
  const total = Math.max(rows.length, p.total || 0);
  // the query wraps to at most 4 rows at the bar's width, tokenized as one line so its colours carry
  const qCols = DK.cols(p.w - 66 - 28, CS);
  const qRows = p.query ? DK.wrapRuns(p.query, "sql", { plain: "plain", keyword: "keyword", string: "string", number: "number", comment: "comment", fn: "fn", punct: "punct", type: "type", key: "key", flag: "flag" }, qCols).slice(0, 4) : [];
  const lh = AK.lineH(Z.fs, "caption", 700), lhS = AK.lineH(Z.small, "mono");
  const qH = p.query ? 12 + 24 + qRows.length * qLH + 12 : (p.title ? lh + 22 : 12);
  const hasTypes = cols0.some((c) => c.type);
  const headH = 8 + lh + (hasTypes ? lhS : 0) + 10, rowH = Math.max(lh + 18, 52), footH = Math.max(lh + 16, 50);
  // column widths: as wide as their widest word (sampled rows and the header), scaled to fit w
  const num = cols0.map((_, ci) => rows.slice(0, nShow).every((r) => r[ci] == null || r[ci] === "" || /^[-+]?[\d.,]+%?$/.test(String(r[ci]))));
  const want = cols0.map((c, ci) => Math.max(90, AK.measure(c.name, "caption", Z.fs, 700) + 42 + (num[ci] ? 0 : 24), c.type ? c.type.length * AK.monoW(Z.small) + 30 : 0,
    ...rows.slice(0, nShow).map((r) => (r[ci] == null ? 0 : Math.min(420, AK.measure(String(r[ci]), "caption", Z.fs, 400) + 30)))));
  const avail = p.w - 24, sum = want.reduce((a, b) => a + b, 0) || 1, k = Math.min(1.6, avail / sum);
  let x = 12;
  const cols = cols0.map((c, ci) => { const w = Math.floor(want[ci] * k); const C = Object.assign({}, c, { x, w, num: num[ci] }); x += w; return C; });
  const top = qH + 6;
  const h = top + headH + nShow * rowH + ((total > nShow) || p.countLabel ? footH : 12) + 4;
  return { Z, CS, qLH, qRows, qH, lh, lhS, headH, rowH, footH, cols, rows, nShow, total, top, size: { w: p.w, h } };
};
