// T-023 ops_metric_tile: a monitoring metric tile (hand-off sheet, Family B). Built on _app_kit.js and _dev_kit.js.
// The metric's name, its value large with its unit, a sparkline with the warning and critical thresholds, and a state
// shown three ways (a tone, an icon shape and the bar at the tile's edge), never by hue alone. Lay 4 to 8 out as a grid.
Loom.component("ops_metric_tile", {
  version: 1,
  idea: "A monitoring metric tile: the metric's name, its current value large with its unit, a sparkline of recent values with warning and critical threshold lines, and a state (ok, warning, critical) shown by tone, icon and edge bar; new points push in and the value counts.",
  outline: ["tile", "metric name at the top left", "state icon at the top right (an optional state word)", "the value large, its unit after it", "sparkline with dashed threshold lines, each labelled with its value at the right", "edge bar in the state's tone"],
  family: "ops",
  kind: "screen",
  tags: ["metric", "monitoring", "dashboard", "observability", "sli", "golden signals", "latency", "error rate", "saturation", "kpi tile"],
  commissioned_by: "Kshitij 2026-10-16 (hand-off sheet T-023)",
  // a dashboard tile is a product screen: the screen styles, plus the technical drawing styles (D-193)
  styles: ["screencast", "corporate-clean", "engineering", "line-art", "editorial-paper", "presenter-pop", "dark-technical", "whiteboard", "blueprint"],
  params: {
    name: { type: "str", content: true },
    unit: { type: "str", content: true },
    series: { type: "list", content: true },       // recent values, oldest first (numbers; null is a gap)
    value: { type: "str" },                        // the value as shown ("1.2k"); the last point when omitted
    threshold: { type: "obj", default: {} },       // {warn, crit} on the series' scale
    worse: { type: "enum", choices: ["up", "down"], default: "up" },   // which way is bad (latency: up; availability: down)
    decimals: { type: "int", default: -1 },        // digits after the point (-1: as the data has them)
    stateLabels: { type: "obj" },                  // the state's word, as the product says it: {ok, warn, crit}
    w: { type: "number", default: 420 }, h: { type: "number", default: 240 },
    at: { type: "number", default: -1 },
    steps: { type: "list", default: [] },          // [{do: "push", v, at} | {do: "state", s: "ok"|"warn"|"crit", at}]
    engine: { type: "enum", choices: ["auto", "off"], default: "auto" },
  },
  slots: {},
  parts: ["tile", "name", "value", "unit", "spark", "threshold", "thresholdTags", "state", "push(v, t)", "state(s, t)"],
  example: 'ctx.use("ops_metric_tile", { name: "Checkout p95", unit: "ms", series: [210, 230, 220, 260, 410, 480], threshold: { warn: 300, crit: 450 }, at: ctx.cue("latency jumps") }, { x: 120, y: 160, name: "p95" })',
  size: (p) => ({ w: p.w, h: p.h }),
  build(ctx, g, p) {
    const AK = Loom.appKit, DK = Loom.devKit, S = Loom.style, K = Loom.kit, svg = (t, a, q) => Loom.svg(t, a, q), f1 = DK.f1;
    const { Z } = DK.ui();
    const W = p.w, H = p.h, pad = 20;
    const animated = p.at != null && p.at >= 0;
    const num = (v) => (v == null || v === "" ? null : +v);
    let series = (p.series || []).map(num);
    const dec = p.decimals >= 0 ? p.decimals : Math.max(0, ...series.filter((v) => v != null).map((v) => (String(v).split(".")[1] || "").length));
    const fmt = (v) => (v == null ? "" : (+v).toFixed(dec));
    const th = p.threshold || {};
    const stateOf = (v) => {
      if (v == null) return "ok";
      const bad = (lim) => lim != null && (p.worse === "down" ? v <= lim : v >= lim);
      return bad(th.crit) ? "crit" : bad(th.warn) ? "warn" : "ok";
    };
    const TOK = { ok: "pos", warn: DK.warnTok(), crit: "neg" }, ICON = { ok: "circle-check", warn: "triangle-alert", crit: "octagon-x" };
    const surface = S.c("surface"), ink = S.c("ink");
    const tone = (s) => DK.legible(TOK[s], surface, ink, 3);
    const last = () => { for (let i = series.length - 1; i >= 0; i--) if (series[i] != null) return series[i]; return null; };
    let state = stateOf(last());
    const parts = {};

    // ---- the tile, its edge bar and the name
    const tile = svg("g", {}, g);
    K.rect(tile, 0, 0, W, H, { fill: "surface", r: 14, stroke: "line", sw: 1.5, shadow: true });
    const bars = {};
    for (const s of ["ok", "warn", "crit"]) bars[s] = svg("rect", { x: 1.5, y: 14, width: 6, height: H - 28, rx: 3, fill: tone(s), opacity: s === state ? 1 : 0 }, tile);
    parts.tile = tile;
    const lh = AK.lineH(Z.fs, "caption", 600);
    const icons = {}, icG = svg("g", {}, tile);
    for (const s of ["ok", "warn", "crit"]) { icons[s] = svg("g", { opacity: s === state ? 1 : 0 }, icG); AK.icon(icons[s], ICON[s], W - pad - 14, pad + lh / 2, 28, TOK[s]); }
    let stateWord = null;
    const SL = p.stateLabels || {};
    const swW = Math.max(0, ...["ok", "warn", "crit"].map((s) => (SL[s] ? AK.measure(SL[s], "caption", Z.small, 600) + 8 : 0)));
    const wordsG = {};
    // the name wraps to two lines beside the state; when two lines still cut it, the state word moves down to the value's
    // row (the icon stays at the top right) so the name has the row's width: names are never cut while there is room
    const nameO = (w) => AK.clampText(p.name, { role: "caption", size: Z.fs, w, maxLines: 2, weight: 600 });
    let nameW = W - 2 * pad - 50 - swW, NC = nameO(nameW), wordDown = false;
    if (swW && NC.cut) { const N2 = nameO(W - 2 * pad - 50); if (!N2.cut || N2.lines.join(" ").length > NC.lines.join(" ").length) { nameW = W - 2 * pad - 50; NC = N2; wordDown = true; } }
    const nameH = NC.n > 1 ? NC.h : lh;
    parts.name = NC.n > 1 ? DK.para(tile, p.name, { role: "caption", x: pad + 6, y: pad, w: nameW, maxLines: 2, size: Z.fs, weight: 600, color: "muted" })
      : AK.T(tile, p.name, { x: pad + 6, y: pad, w: nameW, h: lh, size: Z.fs, weight: 600, color: "muted" });

    // ---- the value, large, and its unit
    const vTop = pad + nameH + 4, vH = Math.max(60, Math.round((H - vTop - pad) * 0.48));
    if (swW) for (const s of ["ok", "warn", "crit"]) if (SL[s]) {
      wordsG[s] = svg("g", { opacity: s === state ? 1 : 0 }, tile);
      const wy = wordDown ? vTop + vH - lh - 4 : pad, wx = wordDown ? W - pad - swW : W - pad - 36 - swW;
      AK.T(wordsG[s], SL[s], { x: wx, y: wy, w: swW, h: lh, size: Z.small, weight: 600, align: "right", fill: tone(s) });
    }
    const wordRoom = wordDown ? swW + 12 : 0;
    const vStr = p.value != null ? String(p.value) : fmt(last());
    const unitW = AK.measure(p.unit, "caption", Z.fs, 600) + 10;
    let role = "title";
    const vW = W - 2 * pad - 6 - unitW - wordRoom;
    const fitsAs = (r) => { const F = K.fit(vStr || "0", { role: r, w: vW, h: vH, maxLines: 1 }); return F.fitted ? F : null; };
    let F = fitsAs("title"); if (!F) { role = "lead"; F = fitsAs("lead"); }
    if (!F) { role = "body"; F = K.fit(vStr || "0", { role, w: vW, h: vH, maxLines: 1 }); }
    const vg = svg("g", {}, tile);
    const valT = K.text(vg, vStr, { role, x: pad + 6, y: vTop, w: vW, h: vH, maxLines: 1, valign: "bottom", weight: 700 });
    const vw = AK.measure(vStr, role, valT.__fit ? valT.__fit.size : F.size, K.weightOf(role, 700));
    const unitT = AK.T(tile, p.unit, { x: pad + 6 + vw + 8, y: vTop + vH - lh - 4, w: unitW, h: lh, size: Z.fs, weight: 600, color: "muted" });
    parts.value = valT; parts.unit = unitT;

    // ---- the sparkline and its thresholds
    // the thresholds are labelled with their values in a gutter at the right, in their tones (a dashed line alone says
    // nothing about which limit it is)
    const thKeys = ["warn", "crit"].filter((k) => th[k] != null);
    const tagSize = Z.small, tagLh = AK.lineH(tagSize, "caption", 600);
    const tagW = thKeys.length ? Math.max(...thKeys.map((k) => AK.measure(fmt(th[k]), "caption", tagSize, 600))) + 4 : 0;
    const gutter = tagW ? tagW + 12 : 0;
    const sx = pad + 6, sw = W - 2 * pad - 6 - gutter, sy = vTop + vH + 12, sh = H - sy - pad;
    const all = series.filter((v) => v != null).concat([th.warn, th.crit].filter((v) => v != null));
    const steps = (p.steps || []).filter((s) => s && s.do === "push").map((s) => +s.v);
    let lo = Math.min(...all, ...steps), hi = Math.max(...all, ...steps);
    if (!(hi > lo)) { hi = lo + 1; }
    const padV = (hi - lo) * 0.12; lo -= padV; hi += padV;
    const n = Math.max(2, series.length);
    const X = (i) => sx + (i / (n - 1)) * sw, Y = (v) => sy + sh - ((v - lo) / (hi - lo)) * sh;
    const spark = svg("g", {}, tile);
    const thG = svg("g", {}, spark);
    for (const [k, s] of [["warn", "warn"], ["crit", "crit"]]) if (th[k] != null) svg("line", { x1: f1(sx), x2: f1(sx + sw), y1: f1(Y(th[k])), y2: f1(Y(th[k])), stroke: tone(s), "stroke-width": 2, "stroke-dasharray": "6 6", opacity: 0.9 }, thG);
    const tagG = svg("g", {}, tile), tags = thKeys.map((k) => ({ k, y: Y(th[k]) - tagLh / 2 }));
    // two limits close together: their labels are pushed apart (the line keeps its true height)
    tags.sort((a, b) => a.y - b.y);
    for (let i = 1; i < tags.length; i++) if (tags[i].y - tags[i - 1].y < tagLh) { const mid = (tags[i].y + tags[i - 1].y) / 2; tags[i - 1].y = mid - tagLh / 2; tags[i].y = mid + tagLh / 2; }
    for (const tg of tags) { tg.y = Math.min(sy + sh - tagLh / 2, Math.max(sy - tagLh / 2, tg.y)); AK.T(tagG, fmt(th[tg.k]), { x: sx + sw + 12, y: tg.y, w: tagW, h: tagLh, size: tagSize, weight: 600, align: "left", fill: tone(tg.k) }); }
    parts.threshold = thG; parts.thresholdTags = tagG;
    const lineCol = S.c("accent");
    const area = svg("path", { d: "", fill: S.mix(lineCol, surface, 0.86), opacity: S.outlined() ? 0 : 1 }, spark);
    const line = svg("path", { d: "", fill: "none", stroke: lineCol, "stroke-width": 3.5, "stroke-linejoin": "round", "stroke-linecap": "round" }, spark);
    const dot = svg("circle", { r: 6, cx: 0, cy: 0, fill: tone(state), stroke: surface, "stroke-width": 2.5 }, spark);
    function draw(vals, shift) {
      // shift (0..1): the line moves one step left as a new point arrives
      let d = "", first = true, lx = 0, ly = 0;
      vals.forEach((v, i) => { if (v == null) { first = true; return; } const x = X(i - shift), y = Y(v); d += (first ? "M" : " L") + `${f1(x)} ${f1(y)}`; first = false; lx = x; ly = y; });
      line.setAttribute("d", d);
      const pts = vals.map((v, i) => (v == null ? null : [X(i - shift), Y(v)])).filter(Boolean);
      area.setAttribute("d", pts.length > 1 ? `M${f1(pts[0][0])} ${f1(sy + sh)} L` + pts.map((q) => `${f1(q[0])} ${f1(q[1])}`).join(" L") + ` L${f1(pts[pts.length - 1][0])} ${f1(sy + sh)} Z` : "");
      dot.setAttribute("cx", f1(lx)); dot.setAttribute("cy", f1(ly));
    }
    const clipId = Loom.uid ? Loom.uid("tileclip") : "tileclip" + Loom.hash(p.name);
    const cp = svg("clipPath", { id: clipId }, g); svg("rect", { x: sx - 8, y: sy - 10, width: sw + 16, height: sh + 20 }, cp);
    spark.setAttribute("clip-path", `url(#${clipId})`);
    draw(series, 0);
    parts.spark = spark;
    parts.stateNow = () => state;

    // ---- motion: the tile appears, the line draws in and the value counts up to its figure
    if (animated) {
      AK.show(tile, p.at, 0.3);
      const L0 = 2000;
      line.setAttribute("stroke-dasharray", `${L0} ${L0}`);
      Loom.tween(line, { strokeDashoffset: L0 }, { strokeDashoffset: 0, duration: 0.9, ease: Loom.ease.move }, p.at + 0.25, DK.meta("draw", "tile.spark"));
      AK.show(area, p.at + 0.6, 0.4); AK.show(dot, p.at + 1.1, 0.2);
      if (p.value == null && last() != null && /^[-\d.]+$/.test(vStr)) {
        const v1 = last(), v0 = series.find((v) => v != null);
        Loom.drive((e) => { valT.firstChild.textContent = fmt(v0 + (v1 - v0) * e); }, p.at + 0.25, 0.9, "move", DK.meta("count", "tile.value"));
      }
    }

    // ---- state functions
    parts.state = function (s, t) {
      if (!(s in TOK) || s === state) return t;
      DK.cross(bars[state], bars[s], t); DK.cross(icons[state], icons[s], t);
      if (wordsG[state] || wordsG[s]) DK.cross(wordsG[state] || null, wordsG[s] || null, t);
      Loom.tween(dot, { fill: tone(state) }, { fill: tone(s), duration: 0.25 }, t, DK.meta("state", "tile.dot"));
      state = s;
      return t + 0.3;
    };
    parts.push = function (v, t) {
      const a = series.slice(), b = series.slice(1).concat([num(v)]);
      const both = a.concat([num(v)]);
      Loom.drive((e) => draw(both, e), t, 0.6, "move", DK.meta("travel", "tile.push"));
      const v0 = last(), v1 = num(v);
      if (p.value == null && v0 != null && v1 != null) Loom.drive((e) => { valT.firstChild.textContent = fmt(v0 + (v1 - v0) * e); }, t, 0.6, "move", DK.meta("count", "tile.value"));
      series = b;
      // the line after the push: drawn from the shifted points (the drive above holds it until then)
      Loom.drive(() => draw(b, 0), t + 0.6, 0.01, "linear", DK.meta("state", "tile.push"));
      parts.state(stateOf(v1), t + 0.3);
      return t + 0.6;
    };
    for (const st of p.steps || []) {
      if (!st || st.at == null) continue;
      if (st.do === "push") parts.push(st.v, st.at);
      else if (st.do === "state") parts.state(st.s, st.at);
      else Loom.error("component_params", `ops_metric_tile: step "${st.do}" is not push or state`);
    }
    return parts;
  },
});
