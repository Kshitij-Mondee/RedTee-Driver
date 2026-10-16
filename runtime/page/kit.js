// Loom page kit (D-176): what a kind "page" scene gets as P, around the approved libraries.
//
// A page scene is an ES module exporting `async build(ctx, P)` that returns `{ render(t) }` (render may be async).
// It draws into P.root (a div of the clip's size) with any of Canvas 2D, SVG, DOM or the libraries below, and the
// renderer (runtime/page/render.mjs) screenshots P.root for every frame. Frames are a pure function of t: no
// Math.random (P.rng), no clock, no timers, no network (P.data serves the local files below).
//
//   core       P.w, P.h, P.root, P.params, P.duration, P.speech, P.cue(a), P.c(token), P.font(role), P.seg, P.ease, P.rng,
//              P.canvas(), P.svg(), P.el(tag, attrs, parent)
//   data/maps  d3, topojson, world-atlas (Natural Earth), Observable Plot: P.world(), P.plot(spec)
//   diagrams   dagre: P.layout(graph), P.drawGraph(svg, layout, k)
//   formulas   KaTeX: P.tex(latex, opts)
//   code       Shiki (tokens made before the render, params.code): P.code(block, opts) -> {el, show(k)}
//   terminal   xterm.js: P.terminal(opts) -> {show(text)}
//   lettering  single-stroke fonts (hersheytext's EMS and Hershey fonts): P.strokeFont(name), P.strokeText(...),
//              P.drawStrokes(...); outline glyphs with opentype.js: P.glyphs(text, role, size)
//   vector     paper.js: P.morph(dA, dB, k)
// Libraries load only when the storyboard's page.libs names them; a helper whose library is not loaded says which.

const need = (g, lib) => { if (!window[g]) throw new Error(`page: library '${lib}' is not loaded: add it to the beat's page.libs`); return window[g]; };

export async function make(C, root) {
  const reads = { palette: {}, fonts: {} };
  const [W, H] = C.size;
  const P = { root, w: W, h: H, params: C.params || {}, duration: C.duration, speech: C.speech, reads };
  P.cue = (a) => { if (!(a in (C.cues || {}))) throw new Error("cue not resolved: " + a); return C.cues[a]; };
  P.c = (tok) => { const v = (C.palette || {})[tok]; reads.palette[tok] = v === undefined ? null : v; if (!v) throw new Error("unknown token " + tok); return v; };
  P.font = (role) => { const k = role === "title" || role === "display" ? "display" : role === "mono" ? "mono" : "body"; reads.fonts[k] = (C.fonts || {})[k]; return (C.fonts || {})[k] || "sans-serif"; };
  P.ctx = { params: P.params, duration: P.duration, speech: P.speech, size: C.size, cue: P.cue, c: P.c, hex: P.c, font: P.font };

  // ---- core helpers ----
  P.clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
  P.lerp = (a, b, k) => a + (b - a) * k;
  P.seg = (t, a, b) => P.clamp((t - a) / (b - a));
  P.ease = {
    linear: (k) => k,
    in: (k) => k * k * k,
    out: (k) => 1 - Math.pow(1 - k, 3),
    inOut: (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2),
  };
  P.rng = (seed) => { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const SVGNS = "http://www.w3.org/2000/svg";
  P.el = (tag, attrs, parent) => {
    const svgTags = /^(svg|g|path|line|polyline|polygon|circle|ellipse|rect|text|tspan|defs|clipPath|mask|linearGradient|radialGradient|stop|use)$/;
    const e = svgTags.test(tag) ? document.createElementNS(SVGNS, tag) : document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "text") e.textContent = v; else if (k === "style" && typeof v === "object") Object.assign(e.style, v); else e.setAttribute(k, v);
    }
    (parent || root).appendChild(e);
    return e;
  };
  P.canvas = () => { const cv = P.el("canvas", { width: W, height: H, style: { position: "absolute", left: "0", top: "0" } }); return cv.getContext("2d"); };
  P.svg = (parent) => P.el("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}`, style: { position: "absolute", left: "0", top: "0", overflow: "visible" } }, parent);
  P.data = async (name) => {
    const r = await fetch("/data/" + name);
    if (!r.ok) throw new Error("page: no data file " + name);
    return name.endsWith(".svg") || name.startsWith("hershey/") ? r.text() : r.json();
  };

  // ---- data and maps (d3, topojson, world-atlas, Plot) ----
  // the world as GeoJSON: which "countries" | "land", res "110m" | "50m" | "10m"
  P.world = async (which = "countries", res = "110m") => {
    const topo = need("topojson", "topojson");
    const t = await P.data(`world/${which}-${res}.json`);
    return topo.feature(t, t.objects[which]);
  };
  // one Plot per frame: spec is Observable Plot's options; the frame size and a transparent ground are set here
  P.plot = (spec) => {
    const Plot = need("Plot", "plot");
    const el = Plot.plot(Object.assign({ width: W, height: H, style: { background: "transparent", fontFamily: P.font("body"), fontSize: "18px" } }, spec));
    root.replaceChildren(el);
    return el;
  };

  // ---- diagrams (dagre) ----
  // graph: {nodes: [{id, label, w?, h?}], edges: [{from, to}], rankdir: "TB"|"LR", nodesep, ranksep}; sizes from the
  // measured label when not given. Returns {nodes: [{id, label, x, y, w, h}], edges: [{from, to, points}], width, height}
  P.layout = (graph, opts = {}) => {
    const dagre = need("dagre", "dagre");
    const g = new dagre.graphlib.Graph();
    g.setGraph({ rankdir: graph.rankdir || "TB", nodesep: graph.nodesep ?? 40, ranksep: graph.ranksep ?? 60, marginx: 0, marginy: 0 });
    g.setDefaultEdgeLabel(() => ({}));
    const mc = document.createElement("canvas").getContext("2d");
    const size = opts.fontSize || 26;
    mc.font = `600 ${size}px ${P.font("body")}`;
    for (const n of graph.nodes) {
      const tw = mc.measureText(String(n.label ?? n.id)).width;
      g.setNode(String(n.id), { label: String(n.label ?? n.id), width: n.w || Math.ceil(tw + size * 1.6), height: n.h || Math.ceil(size * 2.4) });
    }
    for (const e of graph.edges) g.setEdge(String(e.from), String(e.to));
    dagre.layout(g);
    const gg = g.graph();
    return {
      width: gg.width, height: gg.height,
      nodes: g.nodes().map((id) => { const n = g.node(id); return { id, label: n.label, x: n.x, y: n.y, w: n.width, h: n.height }; }),
      edges: g.edges().map((e) => ({ from: e.v, to: e.w, points: g.edge(e).points.map((p) => [p.x, p.y]) })),
    };
  };
  // draw a laid-out graph into an svg, revealed by k (0..1) in the order given (default: as laid out, node then its
  // in-edges). Fitted and centred in the frame. style: {fill, stroke, text, edge} tokens or hexes.
  P.drawGraph = (svg, L, k, style = {}) => {
    svg.replaceChildren();
    const pad = 40, s = Math.min((W - 2 * pad) / Math.max(1, L.width), (H - 2 * pad) / Math.max(1, L.height), 1.6);
    const ox = (W - L.width * s) / 2, oy = (H - L.height * s) / 2;
    const col = (v, d) => (v && v.startsWith("#") ? v : v ? P.c(v) : d);
    const fill = col(style.fill, "#ffffff"), stroke = col(style.stroke, "#222222"), text = col(style.text, stroke), edge = col(style.edge, stroke);
    const order = style.order || L.nodes.map((n) => n.id);
    const step = 1 / Math.max(1, order.length);
    const g = P.el("g", { transform: `translate(${ox},${oy}) scale(${s})` }, svg);
    order.forEach((id, i) => {
      const kk = P.ease.out(P.seg(k, i * step, (i + 1) * step));
      if (kk <= 0) return;
      for (const e of L.edges.filter((e) => e.to === id && order.indexOf(e.from) < i)) {
        const d = "M" + e.points.map((p) => p.join(",")).join(" L");
        const p = P.el("path", { d, fill: "none", stroke: edge, "stroke-width": 3 / s * 1.5, "stroke-linecap": "round" }, g);
        const len = p.getTotalLength(); p.setAttribute("stroke-dasharray", len); p.setAttribute("stroke-dashoffset", len * (1 - kk));
      }
      const n = L.nodes.find((x) => x.id === id);
      const ng = P.el("g", { opacity: kk, transform: `translate(${n.x},${n.y}) scale(${0.92 + 0.08 * kk})` }, g);
      P.el("rect", { x: -n.w / 2, y: -n.h / 2, width: n.w, height: n.h, rx: 10, fill, stroke, "stroke-width": 2.5 }, ng);
      P.el("text", { "text-anchor": "middle", "dominant-baseline": "central", fill: text, "font-family": P.font("body"), "font-weight": 600, "font-size": 26, text: n.label }, ng);
    });
  };

  // ---- formulas (KaTeX) ----
  P.tex = (latex, opts = {}) => {
    const katex = need("katex", "katex");
    const div = P.el("div", { style: Object.assign({ position: "absolute", left: "0", top: "0", fontSize: (opts.size || 64) + "px", color: opts.color ? P.c(opts.color) : "inherit" }, opts.style || {}) }, opts.parent);
    katex.render(String(latex), div, { displayMode: opts.display !== false, throwOnError: true, output: "html" });
    return div;
  };

  // ---- code (Shiki tokens, made by the bridge from params.code) ----
  // block: one entry of ctx.params.code ({lines, fg, bg}); show(k) reveals the first k of its characters (typing)
  P.code = (block, opts = {}) => {
    const pre = P.el("pre", { style: Object.assign({ position: "absolute", left: "0", top: "0", margin: "0", padding: (opts.pad ?? 28) + "px",
      background: opts.background === false ? "transparent" : block.bg, color: block.fg, borderRadius: "14px",
      fontFamily: P.font("mono"), fontSize: (opts.size || 30) + "px", lineHeight: 1.45, whiteSpace: "pre" }, opts.style || {}) }, opts.parent);
    const spans = [];
    block.lines.forEach((line, li) => {
      for (const tk of line) {
        const sp = P.el("span", { style: { color: tk.c, fontStyle: tk.s & 1 ? "italic" : "normal", fontWeight: tk.s & 2 ? "700" : "400" } }, pre);
        spans.push([sp, tk.t]);
      }
      if (li < block.lines.length - 1) spans.push([pre.appendChild(document.createTextNode("")), "\n"]);
    });
    const total = spans.reduce((a, [, t]) => a + t.length, 0);
    return {
      el: pre, total,
      show(k) {
        let left = Math.round(P.clamp(k) * total);
        for (const [sp, t] of spans) { const n = Math.min(t.length, Math.max(0, left)); sp.textContent = t.slice(0, n); left -= t.length; }
      },
    };
  };

  // ---- terminal (xterm.js) ----
  // show(text): the terminal as it is after `text` (ANSI escapes allowed) was written from empty; a frame is the
  // state after its own text, never the previous frame's
  P.terminal = (opts = {}) => {
    const T = window.Terminal || (window.xterm && window.xterm.Terminal);
    if (!T) throw new Error("page: library 'xterm' is not loaded: add it to the beat's page.libs");
    const host = P.el("div", { style: Object.assign({ position: "absolute", left: "0", top: "0", width: W + "px", height: H + "px" }, opts.style || {}) }, opts.parent);
    // a terminal is a dark window by default (the style's ink as its ground, its field as the text); xterm paints its
    // viewport black in CSS whatever the theme says, so the viewport takes the theme's ground
    const theme = Object.assign({ background: P.c("ink"), foreground: P.c("field"), cursor: P.c("accent") }, opts.theme || {});
    const term = new T({ cols: opts.cols || 80, rows: opts.rows || 20, fontFamily: P.font("mono"), fontSize: opts.size || 24, cursorBlink: false,
      disableStdin: true, allowTransparency: false, theme });
    P.el("style", { text: `.xterm .xterm-viewport,.xterm .xterm-screen{background-color:${theme.background}!important}` }, document.head);
    host.style.background = theme.background; host.style.padding = (opts.pad ?? 24) + "px"; host.style.boxSizing = "border-box";
    host.style.borderRadius = "14px";
    term.open(host);
    return {
      term, el: host,
      async show(text) {
        term.reset();
        await new Promise((r) => term.write(String(text), r));
        term.refresh(0, term.rows - 1);
        await settle();
      },
    };
  };

  // ---- lettering: single-stroke fonts (written stroke by stroke) and outline glyphs ----
  const fonts = {};
  // name: an SVG font of hersheytext ("EMSReadability", "EMSTech", "HersheySans1", "HersheyScript1", ...)
  P.strokeFont = async (name) => {
    if (fonts[name]) return fonts[name];
    const svg = new DOMParser().parseFromString(await P.data(`hershey/${name}.svg`), "image/svg+xml");
    const face = svg.querySelector("font-face"), font = svg.querySelector("font");
    const F = { name, upm: +(face.getAttribute("units-per-em") || 1000), adv: +(font.getAttribute("horiz-adv-x") || 500),
      cap: +(face.getAttribute("cap-height") || 700), glyphs: {} };
    for (const g of svg.querySelectorAll("glyph")) {
      const u = g.getAttribute("unicode");
      if (u != null) F.glyphs[u] = { d: g.getAttribute("d") || "", adv: +(g.getAttribute("horiz-adv-x") || F.adv) };
    }
    // the cap height as drawn (the top of "H"): the fonts' declared cap-height can be far off (EMS Readability says 500
    // and draws its capitals 674 high), which made text 1.35 times the size asked for
    const hy = ((F.glyphs.H && F.glyphs.H.d) || "").replace(/[A-Za-z]/g, " ").trim().split(/[\s,]+/).map(Number).filter((v, i) => i % 2 === 1);
    if (hy.length) F.cap = Math.max(...hy);
    return (fonts[name] = F);
  };
  // strokes of `text` set at (x, y baseline) and `size` px cap height: [{d}] in writing order (glyph by glyph, each
  // glyph's strokes in the font's order)
  P.strokeText = (F, text, o = {}) => {
    const s = (o.size || 60) / F.cap, out = [];
    let x = o.x || 0;
    const y = o.y || 0, gap = (o.spacing || 0) * s;
    for (const ch of String(text)) {
      const g = F.glyphs[ch] || F.glyphs["?"];
      if (g && g.d) {
        for (const sub of g.d.split(/(?=M)/)) {
          const pts = sub.replace(/[ML]/g, " ").trim().split(/[\s,]+/).map(Number);
          const xy = [];
          for (let i = 0; i + 1 < pts.length; i += 2) xy.push([x + pts[i] * s, y - pts[i + 1] * s]);
          if (xy.length) out.push({ d: "M" + xy.map((p) => p[0].toFixed(2) + "," + p[1].toFixed(2)).join(" L") });
        }
      }
      x += ((g && g.adv) || F.adv) * s + gap;
    }
    out.width = x - (o.x || 0);
    return out;
  };
  // draw strokes into an svg revealed by k (0..1), stroke after stroke at an even pen speed (each stroke's share of
  // the time is its length)
  P.drawStrokes = (svg, strokes, k, style = {}) => {
    const col = style.color ? (style.color.startsWith("#") ? style.color : P.c(style.color)) : "#222222";
    const g = P.el("g", {}, svg);
    const ps = strokes.map((st) => P.el("path", { d: st.d, fill: "none", stroke: col, "stroke-width": style.width || 4, "stroke-linecap": "round", "stroke-linejoin": "round" }, g));
    const lens = ps.map((p) => p.getTotalLength() || 0.001), tot = lens.reduce((a, b) => a + b, 0);
    let left = P.clamp(k) * tot;
    ps.forEach((p, i) => {
      const show = Math.max(0, Math.min(lens[i], left)); left -= lens[i];
      p.setAttribute("stroke-dasharray", `${lens[i]} ${lens[i]}`); p.setAttribute("stroke-dashoffset", String(lens[i] - show));
      if (show <= 0) p.setAttribute("visibility", "hidden");
    });
    return g;
  };
  // outline glyphs in the style's own face (opentype.js): an SVG path d for `text` at `size` px, baseline at y 0
  const otf = {};
  P.glyphs = async (text, role = "display", size = 80) => {
    const opentype = need("opentype", "opentype");
    const fam = P.font(role);
    const face = (C.faces || []).findIndex((f) => f.family === fam);
    if (face < 0) throw new Error(`page: no font file for ${fam}`);
    if (!otf[face]) otf[face] = opentype.parse(await (await fetch(`/face-sfnt/${face}`)).arrayBuffer());
    return otf[face].getPath(String(text), 0, 0, size).toPathData(2);
  };

  // ---- vector morphs (paper.js) ----
  // a shape between two shapes at k (0..1). Each contour is resampled along its length; contours are paired left to
  // right, and a shape with fewer contours grows the missing ones from a point, so letters stay separate shapes
  let paperReady = false;
  P.morph = (dA, dB, k, n = 160) => {
    const paper = need("paper", "paper");
    if (!paperReady) { paper.setup(new paper.Size(W, H)); paperReady = true; }
    const contours = (d) => {
      const item = paper.PathItem.create(d);
      const parts = (item.children ? item.children : [item]).filter((p) => p.length > 0);
      const out = parts.map((p) => {
        const pts = [];
        for (let i = 0; i < n; i++) { const q = p.getPointAt(p.length * i / n); pts.push([q.x, q.y]); }
        return pts;
      });
      item.remove();
      return out.sort((u, v) => u.reduce((a, q) => a + q[0], 0) / n - v.reduce((a, q) => a + q[0], 0) / n);
    };
    const A = contours(dA), B = contours(dB), m = Math.max(A.length, B.length);
    const dot = (cs) => { const c = cs[cs.length - 1] || [[0, 0]]; const cx = c.reduce((a, q) => a + q[0], 0) / c.length, cy = c.reduce((a, q) => a + q[1], 0) / c.length; return Array.from({ length: n }, () => [cx, cy]); };
    while (A.length < m) A.push(dot(A));
    while (B.length < m) B.push(dot(B));
    return A.map((ca, j) => "M" + ca.map((p, i) => [P.lerp(p[0], B[j][i][0], k).toFixed(2), P.lerp(p[1], B[j][i][1], k).toFixed(2)].join(",")).join(" L") + " Z").join(" ");
  };

  return P;
}

// after a frame's DOM changes, let layout and any library renderer finish before the screenshot (not frame state:
// the picture depends only on t)
export async function settle() {
  await document.fonts.ready;
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
}
