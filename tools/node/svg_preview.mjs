// An APPROXIMATE preview of a lab page without a browser: the real runtime and scene run in Node against a
// small DOM shim, a stand-in timeline is seeked, and each frame is written as an SVG file (rasterised by
// tools/lab_preview.py with cairosvg).
//   node svg_preview.mjs <lab dir with lab.html and rt/> <out dir>
// It exists because the sandbox has no Chrome (its allowlist blocks every browser download, L-135). It is a
// design aid for composition, colour and layout ONLY:
//   - text is measured with an average glyph width (0.55 x size), not the real font;
//   - filters (blur, glow), masks, WebGL fx and CSS blend modes are not rendered by cairosvg;
//   - tweens are re-implemented here (fromTo/set, eases), not GSAP; transformOrigin uses an approximate box.
// The headless-Chrome render (`py -m loom lab`) is the truth; nothing is approved from a preview.
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const [, , dir, outDir] = process.argv;
fs.mkdirSync(outDir, { recursive: true });
const html = fs.readFileSync(path.join(dir, "lab.html"), "utf8");
const srcs = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
const inline = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((m) => m[1]);

/* ------------------------------------------------------------------ DOM shim */
const CHAR_W = 0.55;
// a monospace face advances 0.6 em (JetBrains Mono, every pack's mono face): measured at 0.55 its words drew 9 % past their
// boxes in the preview while Chrome fitted them (hologram study, 2026-10-16)
const charW = (font) => (/mono/i.test(String(font || "")) ? 0.6 : CHAR_W);
function fontSize(font) { const m = String(font || "").match(/([\d.]+)px/); return m ? +m[1] : 16; }
class Node {
  constructor(tag) { this.tagName = tag; this.attrs = {}; this.children = []; this.parentNode = null; this.style = {}; this._text = null; this._html = null; this._gs = null; this._orig = null; }
  get nodeName() { return this.tagName.toUpperCase(); }
  setAttribute(k, v) { this.attrs[k] = String(v); }
  getAttribute(k) { return k in this.attrs ? this.attrs[k] : null; }
  hasAttribute(k) { return k in this.attrs; }
  removeAttribute(k) { delete this.attrs[k]; }
  appendChild(c) { if (c.parentNode) c.parentNode.removeChild(c); c.parentNode = this; this.children.push(c); return c; }
  insertBefore(c, ref) { if (!ref) return this.appendChild(c); if (c.parentNode) c.parentNode.removeChild(c); const i = this.children.indexOf(ref); c.parentNode = this; this.children.splice(i < 0 ? this.children.length : i, 0, c); return c; }
  removeChild(c) { const i = this.children.indexOf(c); if (i >= 0) this.children.splice(i, 1); c.parentNode = null; return c; }
  remove() { if (this.parentNode) this.parentNode.removeChild(this); }
  get firstChild() { return this.children[0] || null; }
  get lastChild() { return this.children[this.children.length - 1] || null; }
  get firstElementChild() { return this.firstChild; }
  get childNodes() { return this.children; }
  get nextSibling() { if (!this.parentNode) return null; const s = this.parentNode.children; return s[s.indexOf(this) + 1] || null; }
  set textContent(v) { this.children = []; this._text = String(v); }
  get textContent() { return this._text != null ? this._text : this.children.map((c) => c.textContent).join(""); }
  set innerHTML(v) { this.children = []; this._html = String(v); }
  get innerHTML() { return this._html || ""; }
  get classList() {
    const self = this, list = () => (self.attrs.class || "").split(/\s+/).filter(Boolean);
    return { contains: (c) => list().includes(c), add: (...c) => { self.attrs.class = [...new Set([...list(), ...c])].join(" "); }, remove: (...c) => { self.attrs.class = list().filter((x) => !c.includes(x)).join(" "); } };
  }
  addEventListener() {} removeEventListener() {}
  get ownerSVGElement() { let n = this.parentNode; while (n && n.tagName !== "svg") n = n.parentNode; return n; }
  matches(sel) { return sel.split(",").some((s) => matchChain(this, s.trim())); }
  closest(sel) { let n = this; while (n) { if (n.matches && n.matches(sel)) return n; n = n.parentNode; } return null; }
  querySelectorAll(sel) { const out = []; const walk = (n) => { for (const c of n.children) { if (c.matches(sel)) out.push(c); walk(c); } }; walk(this); return out; }
  querySelector(sel) { return this.querySelectorAll(sel)[0] || null; }
  getContext() { return ctx2d; }
  getBBox() { return bbox(this); }
  getTotalLength() { const b = bbox(this); return Math.max(1, 2 * (b.width + b.height)); }
  getComputedTextLength() { return bbox(this).width; }
}
function matchSimple(n, s) {
  const m = s.match(/^([a-zA-Z*][\w-]*)?((?:[.#][\w-]+)*)((?:\[[^\]]+\])*)$/);
  if (!m) return false;
  if (m[1] && m[1] !== "*" && m[1] !== n.tagName) return false;
  for (const part of (m[2] || "").match(/[.#][\w-]+/g) || []) {
    if (part[0] === "." && !n.classList.contains(part.slice(1))) return false;
    if (part[0] === "#" && n.attrs.id !== part.slice(1)) return false;
  }
  for (const a of (m[3] || "").match(/\[[^\]]+\]/g) || []) {
    const q = a.slice(1, -1).match(/^([\w-]+)(?:=["']?([^"']*)["']?)?$/);
    if (!q) return false;
    if (q[2] == null ? !(q[1] in n.attrs) : n.attrs[q[1]] !== q[2]) return false;
  }
  return true;
}
function matchChain(n, sel) {
  const parts = sel.split(/\s+/).filter(Boolean);
  if (!matchSimple(n, parts[parts.length - 1])) return false;
  let p = n.parentNode;
  for (let i = parts.length - 2; i >= 0; i--) { while (p && !(p.matches && matchSimple(p, parts[i]))) p = p.parentNode; if (!p) return false; p = p.parentNode; }
  return true;
}
const ctx2d = { font: "16px sans-serif", measureText(str) { const s = fontSize(this.font); return { width: String(str).length * s * charW(this.font), fontBoundingBoxAscent: s * 0.8, fontBoundingBoxDescent: s * 0.22 }; } };
const num = (v, d = 0) => (v == null || v === "" || isNaN(+v) ? d : +v);
function parseT(t) {   // translate / scale only, for bbox unions
  let tx = 0, ty = 0, sx = 1, sy = 1;
  for (const m of String(t || "").matchAll(/(translate|scale)\(([^)]*)\)/g)) {
    const a = m[2].split(/[\s,]+/).filter(Boolean).map(Number);
    if (m[1] === "translate") { tx += (a[0] || 0) * sx; ty += (a[1] || 0) * sy; } else { sx *= a[0]; sy *= a[1] == null ? a[0] : a[1]; }
  }
  return { tx, ty, sx, sy };
}
function bbox(n) {
  const A = n.attrs, t = n.tagName;
  const empty = { x: 0, y: 0, width: 0, height: 0 };
  if (t === "rect" || t === "image" || t === "foreignObject") return { x: num(A.x), y: num(A.y), width: num(A.width), height: num(A.height) };
  if (t === "circle") { const r = num(A.r); return { x: num(A.cx) - r, y: num(A.cy) - r, width: 2 * r, height: 2 * r }; }
  if (t === "ellipse") { const rx = num(A.rx), ry = num(A.ry); return { x: num(A.cx) - rx, y: num(A.cy) - ry, width: 2 * rx, height: 2 * ry }; }
  if (t === "line") { const x = [num(A.x1), num(A.x2)], y = [num(A.y1), num(A.y2)]; return { x: Math.min(...x), y: Math.min(...y), width: Math.abs(x[1] - x[0]), height: Math.abs(y[1] - y[0]) }; }
  if (t === "polygon" || t === "polyline" || t === "path") {
    const nums = String(t === "path" ? A.d : A.points || "").match(/-?[\d.]+(?:e-?\d+)?/g) || [];
    const xs = [], ys = [];
    for (let i = 0; i + 1 < nums.length; i += 2) { xs.push(+nums[i]); ys.push(+nums[i + 1]); }
    if (!xs.length) return empty;
    return { x: Math.min(...xs), y: Math.min(...ys), width: Math.max(...xs) - Math.min(...xs), height: Math.max(...ys) - Math.min(...ys) };
  }
  if (t === "text") {
    const s = num(A["font-size"], 16), lines = n.children.filter((c) => c.tagName === "tspan");
    const texts = lines.length ? lines.map((c) => c.textContent) : [n.textContent];
    const cw = charW(A["font-family"] || ((A.style || "").match(/font-family:\s*([^;]+)/) || [])[1]);
    const w = Math.max(0, ...texts.map((x) => x.length * s * cw));
    const x0 = num(A.x), anchor = A["text-anchor"] || "start";
    const ys = lines.length ? lines.map((c) => num(c.attrs.y, num(A.y))) : [num(A.y)];
    const left = anchor === "middle" ? x0 - w / 2 : anchor === "end" ? x0 - w : x0;
    return { x: left, y: Math.min(...ys) - s * 0.8, width: w, height: Math.max(...ys) - Math.min(...ys) + s * 1.02 };
  }
  if (t === "tspan") return empty;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const c of n.children) {
    if (["clipPath", "defs", "mask", "linearGradient", "radialGradient", "filter", "style"].includes(c.tagName)) continue;
    const b = bbox(c); if (!b.width && !b.height) continue;
    const T = parseT(c.attrs.transform);
    const bx = T.tx + b.x * T.sx, by = T.ty + b.y * T.sy, bw = b.width * T.sx, bh = b.height * T.sy;
    x0 = Math.min(x0, bx); y0 = Math.min(y0, by); x1 = Math.max(x1, bx + bw); y1 = Math.max(y1, by + bh);
  }
  return isFinite(x0) ? { x: x0, y: y0, width: x1 - x0, height: y1 - y0 } : empty;
}
const docRoot = new Node("html"), head = new Node("head"), body = new Node("body");
docRoot.appendChild(head); docRoot.appendChild(body);
const rootDiv = new Node("div"); rootDiv.setAttribute("id", "root"); body.appendChild(rootDiv);
const document = {
  documentElement: docRoot, head, body,
  createElementNS: (ns, tag) => new Node(tag),
  createElement: (tag) => new Node(tag),
  createTextNode: (s) => { const n = new Node("#text"); n._text = String(s); return n; },
  getElementById: (id) => docRoot.querySelector(`#${id}`),
  querySelector: (s) => docRoot.querySelector(s), querySelectorAll: (s) => docRoot.querySelectorAll(s),
  fonts: { load: async () => [], ready: Promise.resolve(), check: () => true },
};

/* ------------------------------------------------------------------ timeline stand-in */
const EASES = {
  none: (p) => p, linear: (p) => p,
  "power1.out": (p) => 1 - (1 - p) ** 2, "power2.out": (p) => 1 - (1 - p) ** 3, "power3.out": (p) => 1 - (1 - p) ** 4,
  "power1.in": (p) => p ** 2, "power2.in": (p) => p ** 3, "power1.inOut": (p) => (p < 0.5 ? 2 * p * p : 1 - 2 * (1 - p) ** 2),
  "sine.inOut": (p) => -(Math.cos(Math.PI * p) - 1) / 2, "sine.out": (p) => Math.sin((p * Math.PI) / 2),
};
const easeOf = (e) => (typeof e === "function" ? e : EASES[e] || EASES["power1.out"]);
const SKIP = new Set(["duration", "ease", "immediateRender", "onUpdate", "onComplete", "onStart", "overwrite", "delay", "transformOrigin", "svgOrigin", "attr", "css", "repeat", "yoyo", "stagger"]);
const DEF = { opacity: 1, x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1, rotation: 0, autoAlpha: 1 };
function propsOf(v) {
  const o = {};
  for (const k in v) if (!SKIP.has(k)) o[k] = v[k];
  if (v.attr) for (const k in v.attr) o["attr:" + k] = v.attr[k];
  if (v.transformOrigin != null) o.transformOrigin = v.transformOrigin;
  return o;
}
function lerpV(a, b, p) {
  if (typeof a === "number" && typeof b === "number") return a + (b - a) * p;
  const na = parseFloat(a), nb = parseFloat(b);
  if (/^#[0-9a-f]{6}$/i.test(a) && /^#[0-9a-f]{6}$/i.test(b)) {
    const ca = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16)), cb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
    return "#" + ca.map((v, i) => Math.round(v + (cb[i] - v) * p).toString(16).padStart(2, "0")).join("");
  }
  if (!isNaN(na) && !isNaN(nb) && String(a).replace(/[-\d.]/g, "") === String(b).replace(/[-\d.]/g, "")) return na + (nb - na) * p;
  return p >= 1 ? b : a;
}
class TL {
  constructor() { this.items = []; }
  _push(target, from, to, pos, isSet) {
    for (const t of Array.isArray(target) ? target : [target]) {
      if (!t) continue;
      this.items.push({ target: t, from: propsOf(from || {}), to: propsOf(to), raw: to, start: +pos || 0, dur: isSet ? 0 : (to.duration == null ? 0.5 : +to.duration),
        imm: !isSet && to.immediateRender !== false, ease: easeOf(to.ease), ord: this.items.length });
    }
    return this;
  }
  fromTo(t, f, to, pos) { return this._push(t, f, to, pos, false); }
  to(t, to, pos) { return this._push(t, {}, Object.assign({ immediateRender: false }, to), pos, false); }
  from(t, f, pos) { return this._push(t, f, { duration: f.duration }, pos, false); }
  set(t, v, pos) { return this._push(t, {}, v, pos, true); }
  add() { return this; } call(fn, a, pos) { return this._push({}, { p: 0 }, { p: 1, duration: 0, onUpdate: fn }, pos, true); }
  duration() { return Math.max(0, ...this.items.map((i) => i.start + i.dur)); }
  seek(t) { apply(this.items, t); return this; }
  pause() { return this; } play() { return this; } progress() { return this; } kill() {}
}
function apply(items, t) {
  const sorted = items.slice().sort((a, b) => a.start - b.start || a.ord - b.ord);
  const byTarget = new Map();
  for (const it of sorted) { if (!byTarget.has(it.target)) byTarget.set(it.target, []); byTarget.get(it.target).push(it); }
  // DOM targets: each property from the latest tween that has started (or the first tween's from-state)
  for (const [tg, list] of byTarget) {
    if (!(tg instanceof Node)) continue;
    if (tg._orig) { for (const k in tg._orig) { if (tg._orig[k] == null) delete tg.attrs[k]; else tg.attrs[k] = tg._orig[k]; } }
    const keys = new Set(); list.forEach((i) => Object.keys(i.to).forEach((k) => keys.add(k)));
    const gs = {};
    for (const k of keys) {
      const tw = list.filter((i) => k in i.to);
      const valAt = (time, before) => {
        let cur; let have = false;
        for (const i of tw) {
          if (before && i === before) break;
          if (i.start > time) { if (!have && i.imm && k in i.from) { cur = i.from[k]; have = true; } break; }
          const p = i.dur > 0 ? Math.min(1, Math.max(0, (time - i.start) / i.dur)) : 1;
          const a = k in i.from ? i.from[k] : (have ? cur : (k in DEF ? DEF[k] : i.to[k]));
          cur = k === "transformOrigin" ? i.to[k] : lerpV(a, i.to[k], i.ease(p)); have = true;
        }
        return have ? cur : undefined;
      };
      const v = valAt(t);
      if (v !== undefined) gs[k] = v;
    }
    tg._gs = gs;
    for (const k in gs) if (k.startsWith("attr:")) { const a = k.slice(5); tg._orig = tg._orig || {}; if (!(a in tg._orig)) tg._orig[a] = a in tg.attrs ? tg.attrs[a] : null; tg.attrs[a] = String(gs[k]); }
  }
  // plain objects (Loom.drive / Loom.call proxies). A tween not started yet was rendered once at p=0 when it was
  // created (GSAP immediateRender), BEFORE anything else played: apply those first, then the started ones in order.
  for (const it of items) {
    if (it.target instanceof Node || it.start <= t || !it.imm) continue;
    for (const k in it.from) it.target[k] = it.from[k];
    if (typeof it.raw.onUpdate === "function") { try { it.raw.onUpdate.call({ progress: () => 0 }); } catch (e) { errors.push("onUpdate: " + String(e && e.stack || e).slice(0, 300)); } }
  }
  for (const it of sorted) {
    if (it.target instanceof Node) continue;
    if (it.start > t) continue;
    const p = it.dur > 0 ? Math.min(1, Math.max(0, (t - it.start) / it.dur)) : 1;
    for (const k in it.to) { if (k.startsWith("attr:") || k === "transformOrigin") continue; const a = k in it.from ? it.from[k] : it.target[k]; it.target[k] = lerpV(a == null ? 0 : a, it.to[k], it.ease(p)); }
    if (typeof it.raw.onUpdate === "function") { try { it.raw.onUpdate.call({ progress: () => p }); } catch (e) { errors.push("onUpdate: " + String(e && e.stack || e).slice(0, 300)); } }
  }
}
const errors = [];

/* ------------------------------------------------------------------ serialise */
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const kebab = (k) => k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
function originOf(n, o) {
  const b = bbox(n); if (o == null) return [0, 0];
  const w = String(o).trim().split(/\s+/);
  const f = (s, size, base, isX) => { if (s == null) return base + size / 2; if (s.endsWith("%")) return base + size * parseFloat(s) / 100; if (s === "left" || s === "top") return base; if (s === "right" || s === "bottom") return base + size; if (s === "center") return base + size / 2; return parseFloat(s) || 0; };
  return [f(w[0], b.width, b.x, true), f(w[1] == null ? "50%" : w[1], b.height, b.y, false)];
}
function ser(n) {
  if (n.tagName === "#text") return esc(n._text);
  if (["style", "script", "canvas"].includes(n.tagName)) return "";
  const A = Object.assign({}, n.attrs);
  const g = n._gs || {};
  const tx = num(g.x), ty = num(g.y), sc = g.scale == null ? 1 : +g.scale, sx = (g.scaleX == null ? 1 : +g.scaleX) * sc, sy = (g.scaleY == null ? 1 : +g.scaleY) * sc, rot = num(g.rotation);
  if (tx || ty || sx !== 1 || sy !== 1 || rot) {
    const [ox, oy] = originOf(n, g.transformOrigin || "0 0");
    A.transform = `translate(${tx + ox} ${ty + oy}) rotate(${rot}) scale(${sx} ${sy}) translate(${-ox} ${-oy}) ${A.transform || ""}`.trim();
  }
  if (n.style && n.style.display === "none") return "";
  const st = Object.assign({}, n.style);
  for (const k in g) if (!(k in DEF) && !k.startsWith("attr:") && k !== "transformOrigin") st[k] = g[k];
  if (g.opacity != null) st.opacity = Math.max(0, Math.min(1, +g.opacity));
  if (g.autoAlpha != null) { st.opacity = Math.max(0, Math.min(1, +g.autoAlpha)); if (+g.autoAlpha === 0) st.visibility = "hidden"; }
  const css = Object.entries(st).filter(([, v]) => v != null && v !== "").map(([k, v]) => `${kebab(k)}:${v}`).join(";");
  if (css) A.style = (A.style ? A.style + ";" : "") + css;
  const at = Object.entries(A).map(([k, v]) => ` ${k}="${esc(v)}"`).join("");
  const inner = n._html != null ? n._html : (n._text != null ? esc(n._text) : n.children.map(ser).join(""));
  return `<${n.tagName}${at}>${inner}</${n.tagName}>`;
}

/* ------------------------------------------------------------------ run */
const ctx = { console: { log() {}, warn() {}, error: (...a) => errors.push("console.error: " + a.join(" ").slice(0, 300)) }, document, Math, JSON, Object, Array, String, Number, Boolean, Date: undefined,
  Promise, WeakMap, Map, Set, Symbol, Error, TypeError, RegExp, parseFloat, parseInt, isNaN, isFinite, Infinity, NaN, Uint8Array, Float32Array,
  setTimeout: () => 0, clearTimeout() {}, getComputedStyle: () => ({ getPropertyValue: () => "" }), performance: { now: () => 0 },
  navigator: { userAgent: "node-preview" }, location: { href: "file:///lab.html" } };
ctx.window = ctx; ctx.self = ctx; ctx.globalThis = ctx;
ctx.gsap = { timeline: () => new TL(), registerPlugin() {}, set() {}, to() {}, utils: { interpolate: lerpV } };
vm.createContext(ctx);
for (const s of srcs) {
  if (/gsap/.test(s)) continue;          // the stand-in timeline above replaces GSAP
  try { vm.runInContext(fs.readFileSync(path.join(dir, s), "utf8"), ctx, { filename: s }); }
  catch (e) { errors.push(`load ${s}: ${String(e && e.stack || e).slice(0, 400)}`); }
}
const M = JSON.parse(inline[0].replace(/^\s*window\.__LAB\s*=\s*/, "").replace(/;\s*$/, ""));
if (M.fx) { errors.push("note: the WebGL fx layer is not previewed"); M.fx = null; }
ctx.__LAB = M;
try { vm.runInContext(inline[1], ctx, { filename: "lab_js" }); } catch (e) { errors.push("lab: " + String(e && e.stack || e).slice(0, 400)); }
for (let i = 0; i < 200 && !ctx.__sheet_ready; i++) await new Promise((r) => setImmediate(r));
if (!ctx.__sheet_ready) errors.push("timeout: the lab page never became ready");
const shots = [];
for (const t of (ctx.__times || [])) {
  try { ctx.__show(0, t); } catch (e) { errors.push(`seek ${t}: ${String(e && e.stack || e).slice(0, 300)}`); }
  const svgEl = rootDiv.children.find((c) => c.tagName === "svg");
  const body = svgEl ? ser(svgEl).replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"') : "<svg/>";
  const f = path.join(outDir, `t${t.toFixed(2)}.svg`);
  fs.writeFileSync(f, body);
  shots.push({ t, file: f });
}
const R = ctx.Loom ? ctx.Loom.report : { errors: [], warnings: [] };
fs.writeFileSync(path.join(outDir, "report.json"), JSON.stringify({ shots, preview_errors: errors, errors: R.errors, warnings: R.warnings.slice(0, 50), treatments: R.treatments || [], radii: R.radii || {}, data: R.data || [], geo: R.geo || [], arrays: R.arrays || [], objects: R.objects || [], figures: R.figures || [], tweens: (R.tweens || []).filter((t) => t.kind === "camera") }, null, 1));
console.log(`preview: ${shots.length} frames, ${R.errors.length} runtime errors, ${errors.length} preview notes`);
