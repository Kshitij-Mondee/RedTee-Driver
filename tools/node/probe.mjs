// Load a composed build in headless Chrome, wait for Loom to finish building, dump the runtime report.
// usage: node probe.mjs <build/index.html> <out.json>
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { pathToFileURL, fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const here = path.dirname(fileURLToPath(import.meta.url));
const engine = path.resolve(here, "..", "..");
function chromePath() {
  if (process.env.HYPERFRAMES_BROWSER_PATH) return process.env.HYPERFRAMES_BROWSER_PATH;
  const bin = path.join(engine, "node_modules", "hyperframes", "bin", "hyperframes.mjs");
  const out = execFileSync(process.execPath, [bin, "browser", "path"], { encoding: "utf8" }).trim().split(/\r?\n/).pop();
  return out;
}
// Count pixels that differ between two PNG screenshots. sharp (a HyperFrames dependency, so present wherever
// HyperFrames is) decodes them; without it a blank page decodes them (slower, more browser memory).
let _sharp;
async function decodePng(buf) {
  if (_sharp === undefined) { try { _sharp = (await import("sharp")).default; } catch (e) { _sharp = null; } }
  if (!_sharp) return null;
  const { data, info } = await _sharp(buf).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  return { data, w: info.width, h: info.height, ch: info.channels };
}
function countDiff(A, B) {
  let n = 0, L = A.w, T = A.h, R = -1, Bt = -1;
  const a = A.data, b = B.data, ch = A.ch;
  for (let i = 0, k = 0; i < a.length; i += ch, k++) {
    if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 40) {
      n++; const px = k % A.w, py = (k / A.w) | 0; if (px < L) L = px; if (px > R) R = px; if (py < T) T = py; if (py > Bt) Bt = py;
    }
  }
  return { n, w: A.w, h: A.h, box: n ? [L, T, R, Bt] : null };
}
async function pngDiff(dec, a, b) {
  const A = await decodePng(a), B = A && await decodePng(b);
  if (A && B) return countDiff(A, B);
  return dec.evaluate(async (a, b) => {
    const load = async (s) => createImageBitmap(await (await fetch("data:image/png;base64," + s)).blob());
    const A = await load(a), B = await load(b);
    const w = A.width, h = A.height, c = new OffscreenCanvas(w, h), x = c.getContext("2d", { willReadFrequently: true });
    x.drawImage(A, 0, 0); const da = x.getImageData(0, 0, w, h).data;
    x.clearRect(0, 0, w, h); x.drawImage(B, 0, 0); const db = x.getImageData(0, 0, w, h).data;
    A.close(); B.close();
    let n = 0, L = w, T = h, R = -1, Bt = -1;
    for (let i = 0, k = 0; i < da.length; i += 4, k++) {
      if (Math.abs(da[i] - db[i]) + Math.abs(da[i + 1] - db[i + 1]) + Math.abs(da[i + 2] - db[i + 2]) > 40) {
        n++; const px = k % w, py = (k / w) | 0; if (px < L) L = px; if (px > R) R = px; if (py < T) T = py; if (py > Bt) Bt = py;
      }
    }
    return { n, w, h, box: n ? [L, T, R, Bt] : null };
  }, a.toString("base64"), b.toString("base64"));
}

// LOOM_PROBE_BEATS="b01-b20" or "b03,b07": probe only those beats (a slow machine can probe a lesson in parts and
// merge the rows; every row names its beat). Unset: every beat.
function pickBeats(beats) {
  const spec = process.env.LOOM_PROBE_BEATS;
  if (!spec) return beats;
  const ids = beats.map((b) => b.id), want = new Set();
  for (const part of spec.split(",")) {
    const [a, c] = part.split("-");
    if (c && ids.includes(a) && ids.includes(c)) ids.slice(ids.indexOf(a), ids.indexOf(c) + 1).forEach((x) => want.add(x));
    else if (ids.includes(a)) want.add(a);
  }
  return beats.filter((b) => want.has(b.id));
}

async function foreignPixels(p, browser) {
  const dec = await browser.newPage();
  const res = [];
  try {
    const beats = pickBeats(await p.evaluate(() => (window.Loom && Loom.manifest ? Loom.manifest.beats.map((b) => ({ id: b.id, t: Math.max(b.speech_start + 0.3, b.speech_end - 0.25) })) : [])));
    // the photographs are taken at half resolution by default (a software-rendered 1080p page of 50 scenes crashed
    // the renderer in a 4 GB sandbox, and four times fewer pixels are four times faster); counts are reported as
    // 1080p pixels. LOOM_PROBE_FOREIGN_DPR=1 photographs at full size.
    const dpr = Math.min(1, Math.max(0.25, +(process.env.LOOM_PROBE_FOREIGN_DPR || 0.5)));
    const k = 1 / (dpr * dpr);
    await p.setViewport({ width: 1920, height: 1080, deviceScaleFactor: dpr });
    // a screenshot right after a DOM change can capture a frame the compositor has not finished (measured: the same DOM
    // gave 0 or 13120 foreign px depending on what was toggled before, quick-question-cost b14, 2026-10-07). Two
    // animation frames first, so every shot shows the DOM as it is.
    const settle = () => p.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))));
    const shot = async () => { await settle(); return Buffer.from(await p.screenshot({ type: "png", captureBeyondViewport: false })); };
    for (const b of beats) {
      const info = await p.evaluate((t, id) => {
        window.__timelines.main.seek(t, false);
        const rec = (Loom.world.sceneRecs || []).find((r) => r.beat && r.beat.id === id);
        // every element this beat owns or holds stays visible, wherever it sits in the DOM: scenes legitimately build
        // INTO a held element's group (feedback-that-lands b24 draws its thought around b23's held word; phishing b05
        // puts its inbox rows beside b03's held message), and hiding by group counted those as another beat's picture
        const keep = ((rec && rec.els) || []).map((E) => E.outer).filter(Boolean);
        const groups = Array.from(document.querySelectorAll("#lm-world .lm-scene"));
        const stationOn = (g) => { const d = g.closest(".lm-station"); return !d || getComputedStyle(d).visibility !== "hidden"; };
        // a foreign group that could show: on a visible station and not switched off
        const cand = groups.filter((g) => g.getAttribute("data-beat") !== id && stationOn(g) && getComputedStyle(g).display !== "none");
        window.__lmForeign = { groups, keep };
        return { foreign: [...new Set(cand.map((g) => g.getAttribute("data-beat")))], held: keep.map((o) => o.getAttribute("data-name")) };
      }, b.t, b.id);
      const row = { beat: b.id, t: b.t, px: 0, by: {}, held: info.held, candidates: info.foreign.length };
      if (info.foreign.length) {
        const hide = (list) => p.evaluate((list) => {
          const { groups, keep } = window.__lmForeign; const H = new Set(list);
          for (const g of groups) g.style.visibility = H.has(g.getAttribute("data-beat")) ? "hidden" : "";
          for (const o of keep) {
            if (list.length) { if (o.__lmPv === undefined) o.__lmPv = o.style.visibility; o.style.visibility = "visible"; }
            else if (o.__lmPv !== undefined) { o.style.visibility = o.__lmPv; o.__lmPv = undefined; }
          }
        }, list);
        const A = await shot();
        await hide(info.foreign); const B = await shot();
        const d = await pngDiff(dec, A, B);
        row.px = Math.round(d.n * k); row.box = d.box && d.box.map((v) => Math.round(v / dpr)); row.dpr = dpr;
        if (row.px > 300) {   // name the beats the pixels belong to: those whose group reaches the changed box (at most 6)
          const near = await p.evaluate((list, box) => {   // largest overlap with the changed box first
            const { groups } = window.__lmForeign;
            const area = (id) => { let a = 0; for (const g of groups) { if (g.getAttribute("data-beat") !== id) continue;
              const r = g.getBoundingClientRect(); const w = Math.min(r.right, box[2] + 1) - Math.max(r.left, box[0]), h = Math.min(r.bottom, box[3] + 1) - Math.max(r.top, box[1]);
              if (w > 0 && h > 0) a += w * h; } return a; };
            return list.map((id) => [id, area(id)]).filter((x) => x[1] > 0).sort((x, y) => y[1] - x[1]).map((x) => x[0]);
          }, info.foreign, row.box);
          for (const fb of near.slice(0, 6)) {
            await hide([fb]); const C = await shot();
            const e = await pngDiff(dec, A, C);
            if (e.n * k > 50) row.by[fb] = Math.round(e.n * k);
          }
        }
        await hide([]);
      }
      res.push(row);
    }
    // a count over the threshold at half resolution is confirmed at full resolution before it is believed: a filtered
    // region re-rasterised a little differently whenever ANY group was toggled (mfa-explained b18: the same 1876 px
    // "from" each of six beats, 0 at full size). The full-size count is the one reported.
    const over = res.filter((r) => r.px > 300);
    if (over.length && dpr < 1) {
      await p.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
      for (const row of over) {
        const info = await p.evaluate((t, id) => {
          window.__timelines.main.seek(t, false);
          const rec = (Loom.world.sceneRecs || []).find((r) => r.beat && r.beat.id === id);
          const keep = ((rec && rec.els) || []).map((E) => E.outer).filter(Boolean);
          const groups = Array.from(document.querySelectorAll("#lm-world .lm-scene"));
          window.__lmForeign = { groups, keep };
          return groups.filter((g) => g.getAttribute("data-beat") !== id).map((g) => g.getAttribute("data-beat"));
        }, row.t, row.beat);
        const hide = (list) => p.evaluate((list) => {
          const { groups, keep } = window.__lmForeign; const H = new Set(list);
          for (const g of groups) g.style.visibility = H.has(g.getAttribute("data-beat")) ? "hidden" : "";
          for (const o of keep) {
            if (list.length) { if (o.__lmPv === undefined) o.__lmPv = o.style.visibility; o.style.visibility = "visible"; }
            else if (o.__lmPv !== undefined) { o.style.visibility = o.__lmPv; o.__lmPv = undefined; }
          }
        }, list);
        const A = await shot(); await hide([...new Set(info)]); const B = await shot(); await hide([]);
        const d = await pngDiff(dec, A, B);
        row.half_px = row.px; row.px = d.n; row.dpr = 1; row.box = d.box;
        if (row.px <= 300) row.by = {};
      }
    }
  } finally {
    await dec.close();
  }
  return res;
}

// ---------------------------------------------------------------- Loom's own layout checker (D-154, 2026-10-10)
// The overlap and contrast checks HyperFrames' `check` runs, with its rules (content_overlap: two solid text blocks
// overlapping by more than a fifth of the smaller one, an error once held across 2 samples for 500 ms; contrast: WCAG AA
// on the background behind the text with its glyphs hidden, an error once the same text fails at 2 sampled times),
// measured in this one page load: only the text elements (found once), sampled every LAYOUT_STEP seconds over the whole
// film, plus Loom's painted test (both texts seen at a point of the overlap: tools/node/overlap_paint.mjs). HyperFrames
// walks every node of the page at every sample; a page with a 96,000-dot background made each check 13 minutes
// (docs/research/2026-10-10-why-checks-are-slow.md).
const LAYOUT_STEP = +(process.env.LOOM_LAYOUT_STEP || 0.5);
const VEIL_HELD_MS = 10000, VEIL_CHANGE = 0.15;   // a translucent full-frame shape changing this much, held this long, is a second background (L-412)
const HELD_MS = 500, GAP_MS = 1000, COVER_EVERY = Math.max(LAYOUT_STEP, 1.0), SAMPLE_BATCH = +(process.env.LOOM_LAYOUT_BATCH || 20);

async function layoutAudit(p) {
  const t0 = Date.now();
  const meta = await p.evaluate(() => {
    const root = document.querySelector("[data-composition-id]") || document.body;
    const SKIP = new Set(["SCRIPT", "STYLE", "AUDIO", "VIDEO", "NOSCRIPT", "TEMPLATE", "DEFS", "CLIPPATH", "MASK", "PATTERN", "SYMBOL", "TITLE", "DESC"]);
    const cands = [];
    const tw = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
    for (let n = tw.nextNode(); n; n = tw.nextNode()) {
      if (SKIP.has(String(n.tagName).toUpperCase())) continue;
      if (n.closest("defs,clipPath,mask,pattern,symbol")) continue;
      if (Array.from(n.childNodes).some((c) => c.nodeType === 3 && c.textContent.trim())) cands.push(n);
    }
    const beatOf = (n) => { const s = n.closest && n.closest("[data-beat]"); if (s) return s.getAttribute("data-beat");
      for (let x = n; x && x.nodeType === 1; x = x.parentNode) if (x.__E && x.__E.beat) return x.__E.beat; return null; };
    const nameOf = (n) => { const e = n.closest && n.closest(".lm-el"); return e ? e.getAttribute("data-name") : null; };
    window.__lc = { cands, info: cands.map((n) => ({ text: (n.textContent || "").replace(/\s+/g, " ").trim().slice(0, 60), beat: beatOf(n), el: nameOf(n), tag: String(n.tagName).toLowerCase(),
      svg: n instanceof SVGElement, allow: n.hasAttribute("data-layout-allow-overlap") || !!n.closest("[data-layout-ignore]") })) };
    const dur = window.__timelines && window.__timelines.main ? window.__timelines.main.duration() : 0;
    const beats = window.Loom && Loom.manifest ? Loom.manifest.beats.map((b) => ({ id: b.id, start: b.start, end: b.end, s0: b.speech_start, s1: b.speech_end })) : [];
    return { n: cands.length, dur, beats, info: window.__lc.info };
  });
  const tMeta = Date.now() - t0;
  // with LOOM_PROBE_BEATS (a scene author's look): only those beats' windows, a second before to half a second after
  const wins = process.env.LOOM_PROBE_BEATS ? pickBeats(meta.beats).map((b) => [b.start - 1, b.end + 0.5]) : null;
  const times = [];
  for (let t = 0; t <= meta.dur + 1e-6; t += LAYOUT_STEP) if (!wins || wins.some(([a, z]) => t >= a && t <= z)) times.push(+t.toFixed(3));
  const pairs = new Map(), covered = new Map(), heldMap = new Map(), prof = [0, 0, 0, 0];   // ms in: seek, texts, covered and cards and lines, pairs
  let wall = 0;   // ms the sample calls took, seen from outside the page
  const doCoverAt = (t) => Math.abs(t / COVER_EVERY - Math.round(t / COVER_EVERY)) < 1e-6;
  // one sample's audit, defined in the page once; the samples then run SAMPLE_BATCH to a call, because the browser
  // paints a frame after every call (v3: 28 of 41 s were those paints between 288 one-sample calls)
  await p.evaluate(() => {
    window.__lcSample = (t, doCover) => {
      const L = window.__lc;
      const root0 = document.querySelector("[data-composition-id]") || document.body;
      const P0 = performance.now();
      window.__timelines.main.seek(t, false);
      document.body.offsetHeight;   // the seek's style and layout, timed apart from the audit
      const P1 = performance.now();
      const alpha = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c || ""); if (!m) return 1; const b = m[1];
        const parts = b.includes(",") ? b.split(",") : b.split("/"); const i = b.includes(",") ? 3 : 1; if (parts.length <= i) return 1;
        const raw = parts[i].trim(); return raw.endsWith("%") ? parseFloat(raw) / 100 : parseFloat(raw); };
      const clipsV = (v) => v === "hidden" || v === "clip" || v === "scroll" || v === "auto";
      // the opacity of an element's whole chain at this moment, 0 when it or an ancestor is not displayed or hidden
      const chainMemo = new Map();
      const chainOf = (x) => { if (!x || x.nodeType !== 1) return 1; if (chainMemo.has(x)) return chainMemo.get(x);
        const cs = getComputedStyle(x); const v = cs.display === "none" || cs.visibility === "hidden" ? 0 : parseFloat(cs.opacity || "1") * chainOf(x.parentElement);
        chainMemo.set(x, v); return v; };
      // the blur over an element (its own and its ancestors' CSS blur() or SVG feGaussianBlur): a text under a real blur
      // is a backdrop nobody is meant to read (budget-fix 338 to 367 s: a focus pull behind the agreed plan card)
      const blurMemo = new Map(), filterBlur = new Map();
      const blurOwn = (x) => { const f = getComputedStyle(x).filter; if (!f || f === "none") return 0; let b = 0;
        for (const m of f.matchAll(/blur\(([\d.]+)px\)/g)) b = Math.max(b, +m[1]);
        for (const m of f.matchAll(/url\("?#([^")]+)"?\)/g)) { if (!filterBlur.has(m[1])) { const fe = document.getElementById(m[1]);
          filterBlur.set(m[1], fe ? Math.max(0, ...Array.from(fe.querySelectorAll("feGaussianBlur")).map((g) => parseFloat(String(g.getAttribute("stdDeviation") || "0").split(/[ ,]+/)[0]) || 0)) : 0); }
          b = Math.max(b, filterBlur.get(m[1])); } return b; };
      const blurOf = (x) => { if (!x || x.nodeType !== 1) return 0; if (blurMemo.has(x)) return blurMemo.get(x); const v = Math.max(blurOwn(x), blurOf(x.parentElement)); blurMemo.set(x, v); return v; };
      const blocks = [];
      for (let i = 0; i < L.cands.length; i++) {
        const el = L.cands[i];
        if (!el.isConnected || L.info[i].allow) continue;
        if (el.checkVisibility && !el.checkVisibility({ opacityProperty: true, visibilityProperty: true })) continue;
        // seen at all: no hidden ancestor, the opacity of the whole chain at least 0.05 (HyperFrames' rule); each
        // ancestor's chain is worked out once per sample (sibling texts share them)
        const ch = chainOf(el);
        if (ch < 0.05 || blurOf(el) >= 1.5) continue;
        // a solid text: its paint at least 0.35 alpha. HyperFrames reads the CSS color only, which an SVG text does
        // not paint with, so a faint SVG label (a 0.2 fill watermark) counted as solid; an SVG text is read by its fill
        const ecs = getComputedStyle(el);
        const fillA = !ecs.fill || ecs.fill === "none" || ecs.fill === "transparent" ? 0 : ecs.fill.startsWith("rgb") ? alpha(ecs.fill) : 1;   // url(#gradient): solid
        // the whiteboard engine's words (D-179) are a shadow <text> at fill-opacity 0, painted by the engine's strokes: they
        // are words on the board, so every layout check reads them (they were skipped: Kshitij, 2026-10-15, film A's overlaps)
        const engineText = el.getAttribute && el.getAttribute("data-engine-text");
        const paint = engineText ? 1 : L.info[i].svg ? fillA * parseFloat(ecs.fillOpacity || "1") : alpha(ecs.color);
        if (paint < 0.35) continue;
        let rects = [];
        for (const tn of el.childNodes) {
          if (tn.nodeType !== 3 || !tn.textContent.trim()) continue;
          const r = document.createRange(); r.selectNodeContents(tn);
          for (const q of r.getClientRects()) if (q.width > 0.5 && q.height > 0.5) rects.push({ l: q.left, t: q.top, r: q.right, b: q.bottom });
          r.detach();
        }
        for (let a = el.parentElement; a && rects.length; a = a.parentElement) {
          const cs = getComputedStyle(a); const cx = clipsV(cs.overflowX || cs.overflow), cy = clipsV(cs.overflowY || cs.overflow);
          if (!cx && !cy) continue;
          const c = a.getBoundingClientRect();
          rects = rects.map((q) => ({ l: cx ? Math.max(q.l, c.left) : q.l, r: cx ? Math.min(q.r, c.right) : q.r, t: cy ? Math.max(q.t, c.top) : q.t, b: cy ? Math.min(q.b, c.bottom) : q.b }))
            .filter((q) => q.r - q.l > 0.5 && q.b - q.t > 0.5);
        }
        if (!rects.length) continue;
        const u = rects.reduce((m, q) => ({ l: Math.min(m.l, q.l), t: Math.min(m.t, q.t), r: Math.max(m.r, q.r), b: Math.max(m.b, q.b) }), { l: 1e9, t: 1e9, r: -1e9, b: -1e9 });
        if (u.r < 0 || u.b < 0 || u.l > 1920 || u.t > 1080) continue;
        blocks.push({ i, el, rects, u, area: rects.reduce((s, q) => s + (q.r - q.l) * (q.b - q.t), 0) });
      }
      const P2 = performance.now();
      blocks.sort((a, b) => a.u.l - b.u.l);
      const inter = (a, b) => { const w = Math.min(a.r, b.r) - Math.max(a.l, b.l), h = Math.min(a.b, b.b) - Math.max(a.t, b.t); return w > 0 && h > 0 ? w * h : 0; };
      const inFlow = (e) => { const pos = getComputedStyle(e).position; return pos === "static" || pos === "relative" || pos === "sticky"; };
      const flexGrid = (e) => { for (let x = e.parentElement; x; x = x.parentElement) { const d = getComputedStyle(x).display; if (d.includes("flex") || d.includes("grid")) return x; } return null; };
      const SHAPES = new Set(["rect", "path", "circle", "ellipse", "polygon", "polyline", "image", "use", "foreignobject", "canvas", "img", "video"]);   // not line: no fill area (its computed fill is black by default), only a stroke: feedback-shuttle-v3's crossing-out X
      // the occluder's opacity below the layer it shares with the text: a group fading out fades the card and the text
      // under it together, so inside it the card still hides the text (https-private fixture b3, 2026-10-10)
      const opac = (e, T) => { let o = 1; for (let n = e; n && n.nodeType === 1 && !(T && n.contains(T)); n = n.parentElement) o *= +getComputedStyle(n).opacity; return o; };
      const opaque = (e, T) => { const tg = String(e.tagName).toLowerCase(); if (!SHAPES.has(tg)) return false; if (e.closest && e.closest(".lm-wb-marker")) return false; /* the writing hand covers the words it writes, by design */ const cs = getComputedStyle(e);
        if (!["image", "img", "video", "canvas"].includes(tg) && (cs.fill === "none" || cs.fill === "transparent" || +cs.fillOpacity < 0.95)) return false; return opac(e, T) >= 0.95; };
      const mine = (T, e) => e === T || T.contains(e) || (e.contains && e.contains(T) && String(e.tagName).toLowerCase() === "text");
      const seen = (T, stack) => { for (const e of stack) { if (mine(T, e)) return true; if (opaque(e, T)) return false; } return false; };
      // seen at any of 7 x 3 points over the text's own lines (once per text per sample)
      const seenMemo = new Map();
      const seenAnywhere = (X) => { if (seenMemo.has(X.i)) return seenMemo.get(X.i); let ok = false;
        for (const q of X.rects) { for (let a = 1; a <= 7 && !ok; a++) for (let b = 1; b <= 3 && !ok; b++) {
          const x = q.l + (q.r - q.l) * a / 8, y = q.t + (q.b - q.t) * b / 4; if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) continue;
          if (seen(X.el, document.elementsFromPoint(x, y))) ok = true; } if (ok) break; }
        seenMemo.set(X.i, ok); return ok; };
      // partly covered: an opaque shape over part of a text that is seen elsewhere, its words cut (budget-fix 49 to 55 s:
      // "Corrective feedback" between two cards that hide its top and bottom; neither checker had the rule). A 3 x 3
      // look first (top, middle and bottom: that text's middle was clear); the full 7 x 3 grid only for a text covered
      // at one of them. Every COVER_EVERY seconds: a cut held 500 ms is still seen twice
      const coverAt = (X, x, y) => { if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) return 0; const st = document.elementsFromPoint(x, y);
        for (let k = 0; k < st.length; k++) { const e = st[k]; if (mine(X.el, e)) return 1; if (opaque(e, X.el)) return st.slice(k + 1).some((e2) => mine(X.el, e2)) ? 2 : 0; } return 0; };
      const cov = [];
      for (const X of (doCover ? blocks : [])) {
        const u = X.u;
        if (![0.2, 0.5, 0.8].some((f) => [0.25, 0.5, 0.75].some((g) => coverAt(X, u.l + (u.r - u.l) * f, u.t + (u.b - u.t) * g) === 2))) continue;
        let seenN = 0, covN = 0;
        for (const q of X.rects) for (let a = 1; a <= 7; a++) for (let b = 1; b <= 3; b++) {
          const v = coverAt(X, q.l + (q.r - q.l) * a / 8, q.t + (q.b - q.t) * b / 4); if (v === 1) seenN++; else if (v === 2) covN++; }
        if (covN >= 2 && seenN >= 2) cov.push({ i: X.i, share: +(covN / (covN + seenN)).toFixed(2), rect: [u.l, u.t, u.r, u.b].map(Math.round) });
      }
      // OFF CARD: a text on its own element's card that runs past the card's edge (mixed-value 90 s: "noted." below the
      // OMISSION box; HyperFrames' text_box_overflow). The card: a filled shape of the text's own element, painted before
      // it, as tall as its lines, under at least half of the text's points; a point is off when no such shape is under it.
      const offCard = [];
      const NOSHAPE = "defs,clipPath,mask,pattern,symbol,marker";
      const opaqueFill = (e) => { const cs = getComputedStyle(e); return cs.fill && cs.fill !== "none" && cs.fill !== "transparent" && !/rgba\([^)]*,\s*0\)/.test(cs.fill) && +cs.fillOpacity >= 0.5; };
      const cardMemo = new Map();
      const cardsOf = (el) => { if (cardMemo.has(el)) return cardMemo.get(el);
        const list = [];
        for (const sh of el.querySelectorAll("rect,path,circle,ellipse,polygon")) {
          if (sh.closest(NOSHAPE) || !opaqueFill(sh) || chainOf(sh) < 0.5) continue;
          const r = sh.getBoundingClientRect(); if (r.width < 4 || r.height < 4) continue;
          list.push({ sh, l: r.left, t: r.top, r: r.right, b: r.bottom, area: r.width * r.height });
        }
        cardMemo.set(el, list); return list; };
      // one SVG <text> with all its lines is one unit (mixed-value 90 s: the third line, "noted.", is the one that spills)
      const groups = new Map();
      for (const X of (doCover ? blocks : [])) {
        const k = X.el.parentNode && String(X.el.parentNode.tagName).toLowerCase() === "text" ? X.el.parentNode : X.el;
        if (!groups.has(k)) groups.set(k, { el: X.el, i: X.i, rects: [], u: { l: 1e9, t: 1e9, r: -1e9, b: -1e9 } });
        const G = groups.get(k); G.rects.push(...X.rects);
        G.u = { l: Math.min(G.u.l, X.u.l), t: Math.min(G.u.t, X.u.t), r: Math.max(G.u.r, X.u.r), b: Math.max(G.u.b, X.u.b) };
      }
      for (const G of groups.values()) {
        const el = G.el.closest && G.el.closest(".lm-el"); if (!el) continue;
        // a rotated text or card: axis-aligned boxes do not describe it (v2's tilted "You ramble" tag); not judged
        const gm = G.el.getScreenCTM && G.el.getScreenCTM(); if (gm && Math.abs(gm.b) > 0.02 * Math.hypot(gm.a, gm.b)) continue;
        const lineH = Math.min(...G.rects.map((q) => q.b - q.t));
        // the shapes of the text's own element drawn before it; a card face is at least as tall as one of its lines (not a
        // badge behind one word); a band is a second fill that spans the text and has an edge running through it
        const under0 = cardsOf(el).filter((c) => c.r - c.l >= 40 && (c.sh.compareDocumentPosition(G.el) & Node.DOCUMENT_POSITION_FOLLOWING));
        const cards = under0.filter((c) => c.b - c.t >= lineH * 0.9 || (c.r - c.l >= (G.u.r - G.u.l) * 0.9 &&
          ((c.t > G.u.t + 2 && c.t < G.u.b - 2) || (c.b > G.u.t + 2 && c.b < G.u.b - 2))));
        if (!cards.some((c) => c.b - c.t >= lineH * 0.9)) continue;
        // under each point: the topmost card containing it (cards are in document order), or none (off the card)
        const under = new Map(); let off = 0, n = 0;
        for (const q of G.rects) for (let a = 1; a <= 7; a++) for (let b = 1; b <= 3; b++) {
          const x = q.l + (q.r - q.l) * a / 8, y = q.t + (q.b - q.t) * b / 4; n++;
          let top = null; for (const c of cards) if (x >= c.l + 1 && x <= c.r - 1 && y >= c.t + 1 && y <= c.b - 1) top = c;
          if (!top) off++; else under.set(top, (under.get(top) || 0) + 1);
        }
        const ranked = Array.from(under.entries()).sort((x, y) => y[1] - x[1]);
        const main = ranked[0], minor = ranked.slice(1).find(([c, m]) => m >= 2 && getComputedStyle(c.sh).fill !== getComputedStyle(main[0].sh).fill);
        // off its card, or across from the card's face onto another fill of it (a band, a strip, a header)
        if (main && main[1] >= n * 0.5 && (off >= 2 || minor))
          offCard.push({ i: G.i, share: +((off >= 2 ? off : minor[1]) / n).toFixed(2), across: off < 2, rect: [G.u.l, G.u.t, G.u.r, G.u.b].map(Math.round) });
      }
      // LINE THROUGH AN OBJECT: a leader or connector line drawn on top of, and straight through, a small object of
      // another element. An object: an icon-sized group (160 px or less) holding a filled shape, or that shape, outside
      // characters, scenery, ambience and bubbles (a desk edge in front of a person is the set, by design: v3, relay-v2).
      const lines = [], veils = [], throughText = [];
      if (doCover) {
        const ids = window.__lcIds || (window.__lcIds = { map: new WeakMap(), n: 0, info: [] });
        const idOf = (e, extra) => { if (!ids.map.has(e)) { ids.map.set(e, ids.n++); ids.info.push(extra()); } return ids.map.get(e); };
        const objs = new Map();
        for (const sh of root0.querySelectorAll("rect,path,circle,ellipse,polygon")) {
          if (sh.closest(NOSHAPE) || !opaqueFill(sh) || chainOf(sh) < 0.5) continue;
          const r = sh.getBoundingClientRect(); if (r.width < 8 || r.height < 8 || r.width > 160 || r.height > 160) continue;
          const par = sh.parentElement; const pr = par && par.getBoundingClientRect();
          const ob = par && String(par.tagName).toLowerCase() === "g" && !par.classList.contains("lm-in") && pr.width <= 160 && pr.height <= 160 ? par : sh;
          const oel = ob.closest(".lm-el"), ok = oel ? oel.getAttribute("data-kind") : null;
          if (["character", "scenery", "ambient", "bubble"].includes(ok)) continue;   // a desk edge in front of a person is the set, by design
          if (!objs.has(ob)) { const R = ob.getBoundingClientRect(); objs.set(ob, { l: R.left, t: R.top, r: R.right, b: R.bottom, el: oel }); }
        }
        const strokes = [];
        for (const ln of root0.querySelectorAll("line,polyline,path")) {
          if (ln.closest(NOSHAPE) || chainOf(ln) < 0.5) continue;
          const cs = getComputedStyle(ln); if (!cs.stroke || cs.stroke === "none") continue;
          if (String(ln.tagName).toLowerCase() !== "line" && opaqueFill(ln)) continue;
          const m = ln.getScreenCTM(); if (!m) continue; const k = Math.hypot(m.a, m.b);
          if (parseFloat(cs.strokeWidth) * k < 1.5) continue;
          let len = 0; try { len = ln.getTotalLength() * k; } catch (e) { continue; }
          if (len < 60) continue;
          const lel = ln.closest(".lm-el");
          if (!lel || !["connector", "label"].includes(lel.getAttribute("data-kind"))) continue;   // leaders and connectors only
          const r = ln.getBoundingClientRect();
          strokes.push({ ln, m, len: len / k, r, el: lel });
        }
        for (const S of strokes) for (const [ob, O] of objs) {
          if (S.el && O.el && S.el === O.el) continue;
          if (ob.contains(S.ln) || S.r.right < O.l || S.r.left > O.r || S.r.bottom < O.t || S.r.top > O.b) continue;
          const ix = (O.r - O.l) * 0.2, iy = (O.b - O.t) * 0.2; let inside = 0, before = false, after = false, seenIn = false;
          const N = Math.min(300, Math.max(24, Math.round(S.len * Math.hypot(S.m.a, S.m.b) / 4)));   // a point every 4 screen px
          for (let q = 0; q <= N; q++) {
            const pt = S.ln.getPointAtLength(S.len * q / N); const x = S.m.a * pt.x + S.m.c * pt.y + S.m.e, y = S.m.b * pt.x + S.m.d * pt.y + S.m.f;
            const outFull = x < O.l || x > O.r || y < O.t || y > O.b;
            if (outFull) { if (seenIn) after = true; else before = true; }
            if (x < O.l + ix || x > O.r - ix || y < O.t + iy || y > O.b - iy) continue;
            // seen: the line comes before the object and before any opaque shape at this point (https-private 85 s: b01's
            // own disc copies over its line, which runs behind them)
            for (const e of document.elementsFromPoint(x, y)) { if (e === S.ln) { inside++; seenIn = true; break; } if (ob.contains(e) || e === ob || opaque(e, S.ln)) break; }
          }
          // THROUGH it: seen inside, with the line outside the object both before and after (a line that ends on its
          // target, such as a flag's pole standing on its part, is how T.label points)
          if (inside >= 3 && before && after) {
            const nm = (e) => { const x = e && e.closest && e.closest(".lm-el"); return x ? x.getAttribute("data-name") : null; };
            const bt = (e) => { const x = e && e.closest && e.closest("[data-beat]"); if (x) return x.getAttribute("data-beat"); for (let y = e; y && y.nodeType === 1; y = y.parentNode) if (y.__E && y.__E.beat) return y.__E.beat; return null; };
            const li = idOf(S.ln, () => ({ el: nm(S.ln), beat: bt(S.ln), tag: String(S.ln.tagName).toLowerCase() }));
            const oi = idOf(ob, () => ({ el: nm(ob), beat: bt(ob), tag: String(ob.tagName).toLowerCase() }));
            lines.push({ li, oi, inside, rect: [O.l, O.t, O.r, O.b].map(Math.round) });
          }
        }
        // LINE THROUGH WORDS: a drawn line (a box edge, a divider, an arrow, a hatch) running through the letters of a text
        // (Kshitij, 2026-10-15, whiteboard film A: "there are still overlaps", "the entire canvas looks a lot messy": the
        // week strip's cell lines through "Budget report", an arrow through "Block time", the reply box's edge through
        // "To: deck request"). A fill never shows it (the board is all strokes). The core of each line of the text is
        // tested (the outer 18 % above and 22 % below are left to underlines and ascenders); a text's own strokes (the
        // engine's glyphs: nearly all of the stroke inside the text) and a mark made on the word (a strike-through, a cross)
        // are not reported.
        for (const X of blocks) {
          const tel = X.el.closest && X.el.closest(".lm-el"); if (!tel) continue;
          const tk = tel.getAttribute("data-kind"); if (["character", "ambient", "scenery"].includes(tk)) continue;
          const U = X.u, uw = U.r - U.l, uh = U.b - U.t; if (uw < 8 || uh < 6) continue;
          for (const ln of root0.querySelectorAll("line,polyline,path,rect,ellipse,circle,polygon")) {
            if (ln.closest(NOSHAPE) || ln.closest(".lm-wb-marker") || chainOf(ln) < 0.5) continue;
            const cs = getComputedStyle(ln); if (!cs.stroke || cs.stroke === "none" || +cs.strokeOpacity < 0.3) continue;
            const r = ln.getBoundingClientRect(); if (r.right < U.l || r.left > U.r || r.bottom < U.t || r.top > U.b) continue;
            const lel = ln.closest(".lm-el"); if (lel && ["character", "ambient", "scenery"].includes(lel.getAttribute("data-kind"))) continue;
            const m = ln.getScreenCTM(); if (!m) continue; const k = Math.hypot(m.a, m.b);
            if (parseFloat(cs.strokeWidth) * k < 1.2) continue;
            let len = 0; try { len = ln.getTotalLength(); } catch (e) { continue; }
            if (!(len * k > 6)) continue;
            // only the drawn part (the engine reveals a stroke by its dash offset)
            const da = cs.strokeDasharray, off = parseFloat(cs.strokeDashoffset) || 0;
            const drawn = da && da !== "none" && da.split(/[ ,]+/).length === 2 ? Math.max(0, Math.min(len, len - off)) : len;
            if (drawn * k < 6) continue;
            const N = Math.min(400, Math.max(12, Math.round(drawn * k / 3)));
            let inU = 0, core = 0;
            for (let q = 0; q <= N; q++) {
              const pt = ln.getPointAtLength(drawn * q / N), x = m.a * pt.x + m.c * pt.y + m.e, y = m.b * pt.x + m.d * pt.y + m.f;
              if (x >= U.l - uh * 0.25 && x <= U.r + uh * 0.25 && y >= U.t - uh * 0.25 && y <= U.b + uh * 0.25) inU++;
              for (const q2 of X.rects) { const h = q2.b - q2.t;
                if (x > q2.l + 2 && x < q2.r - 2 && y > q2.t + h * 0.18 && y < q2.b - h * 0.22) {
                  // seen: the line is reached before any opaque shape at this point (a card drawn over a grid hides the
                  // grid's lines under its words: feedback-shuttle-opus's planner, "Next week")
                  for (const e of document.elementsFromPoint(x, y)) { if (e === ln) { core++; break; } if (e === X.el || X.el.contains(e)) continue; if (opaque(e, ln)) break; }
                  break; } }
            }
            if (core < 3) continue;
            if (lel === tel && inU >= 0.85 * (N + 1)) continue;          // the text's own strokes
            // a mark ON the word, on purpose: a strike-through or a cross no bigger than the word itself (the whole stroke within
            // the word's box widened by 40 % of its width and by its height); a box edge, a divider, a grid line or an arrow
            // runs on past the word, and that is a collision
            if (r.left >= U.l - uw * 0.4 && r.right <= U.r + uw * 0.4 && r.top >= U.t - uh && r.bottom <= U.b + uh) continue;
            const nm = (e) => { const x = e && e.closest && e.closest(".lm-el"); return x ? x.getAttribute("data-name") : null; };
            const bt = (e) => { const x = e && e.closest && e.closest("[data-beat]"); if (x) return x.getAttribute("data-beat"); for (let y = e; y && y.nodeType === 1; y = y.parentNode) if (y.__E && y.__E.beat) return y.__E.beat; return null; };
            const ids = window.__lcIds || (window.__lcIds = { map: new WeakMap(), n: 0, info: [] });
            const idOf = (e, extra) => { if (!ids.map.has(e)) { ids.map.set(e, ids.n++); ids.info.push(extra()); } return ids.map.get(e); };
            const li = idOf(ln, () => ({ el: nm(ln), beat: bt(ln), tag: String(ln.tagName).toLowerCase() }));
            throughText.push({ i: X.i, li, points: core, rect: [U.l, U.t, U.r, U.b].map(Math.round) });
          }
        }
        // FULL-FRAME VEIL: a translucent shape of a scene element over most of the frame, or across it (as wide or as tall
        // as the frame and over 40 % of it), re-tints the whole field: a second background over the style's fx layer
        // (gps-position b21, L-412: a 0.25 to 0.75 "dusk" rect for 40 s; Kshitij: "a completely different shade dividing the
        // entire canvas"). An opaque one is a set's backdrop (story-cartoon), by design; alpha 0.2 to 0.9 is a veil.
        const VW = innerWidth, VH = innerHeight, veilSeen = new Set();
        for (const sh of root0.querySelectorAll(".lm-el rect, .lm-el path, .lm-el ellipse, .lm-el polygon, .lm-el image")) {
          if (sh.closest(NOSHAPE)) continue;
          const vel = sh.closest(".lm-el"); if (veilSeen.has(vel) || vel.getAttribute("data-kind") === "ambient") continue;
          const r = sh.getBoundingClientRect();
          const w = Math.min(r.right, VW) - Math.max(r.left, 0), h = Math.min(r.bottom, VH) - Math.max(r.top, 0);
          if (w <= 0 || h <= 0) continue;
          const share = (w * h) / (VW * VH);
          if (!(share >= 0.7 || (share >= 0.4 && (w >= VW * 0.9 || h >= VH * 0.9)))) continue;
          let fa = 1;
          if (String(sh.tagName).toLowerCase() !== "image") { const cs = getComputedStyle(sh);
            if (!cs.fill || cs.fill === "none" || cs.fill === "transparent") continue;
            fa = (cs.fill.startsWith("rgb") ? alpha(cs.fill) : 1) * parseFloat(cs.fillOpacity || "1"); }
          const a = fa * chainOf(sh);
          if (a < 0.2 || a > 0.9) continue;   // under 0.2 a faint wash of a set (feedback-relay-v3 b03 room wall at 0.14)
          veilSeen.add(vel);
          const bt = (e) => { const x = e.closest("[data-beat]"); if (x) return x.getAttribute("data-beat"); for (let y = e; y && y.nodeType === 1; y = y.parentNode) if (y.__E && y.__E.beat) return y.__E.beat; return null; };
          const vi = idOf(vel, () => ({ el: vel.getAttribute("data-name"), beat: bt(vel), tag: String(sh.tagName).toLowerCase() }));
          veils.push({ vi, share: +share.toFixed(2), alpha: +a.toFixed(2), rect: [Math.max(r.left, 0), Math.max(r.top, 0), Math.min(r.right, VW), Math.min(r.bottom, VH)].map(Math.round) });
        }
      }
      const P3 = performance.now();
      const out = [];
      for (let x = 0; x < blocks.length; x++) {
        const A = blocks[x];
        for (let y = x + 1; y < blocks.length && blocks[y].u.l < A.u.r; y++) {
          const B = blocks[y];
          if (B.u.t >= A.u.b || B.u.b <= A.u.t) continue;
          if (A.el.contains(B.el) || B.el.contains(A.el)) continue;
          // two lines of one SVG text block: laid out together; rotated, their axis-aligned boxes overlap while the glyphs
          // do not (feedback-shuttle-v3 29 s: the tilted "You're / disorganised" tag)
          if (A.el.parentNode === B.el.parentNode && String(A.el.parentNode && A.el.parentNode.tagName).toLowerCase() === "text") continue;
          if (!L.info[A.i].svg && !L.info[B.i].svg && inFlow(A.el) && inFlow(B.el)) { const fa = flexGrid(A.el); if (fa && fa === flexGrid(B.el)) continue; }
          let area = 0; for (const qa of A.rects) for (const qb of B.rects) area += inter(qa, qb);
          if (area <= Math.min(A.area, B.area) * 0.2) continue;
          const x0 = Math.max(A.u.l, B.u.l), x1 = Math.min(A.u.r, B.u.r), y0 = Math.max(A.u.t, B.u.t), y1 = Math.min(A.u.b, B.u.b);
          // a text seen nowhere ends it at once (remembered per text per sample); else the 9 points of the overlap
          const visible = seenAnywhere(A) && seenAnywhere(B);
          let both = 0;
          if (visible) for (let a = 1; a <= 3 && !both; a++) for (let b = 1; b <= 3 && !both; b++) { const st = document.elementsFromPoint(x0 + (x1 - x0) * a / 4, y0 + (y1 - y0) * b / 4); if (seen(A.el, st) && seen(B.el, st)) both++; }
          // a clash: both texts seen at one point of the overlap. A cut: no shared point, but both texts seen somewhere,
          // so one is partly covered where they meet (mixed-value 86 s: a card over the lower half of the "Feedback
          // draft" title, the tops of its letters showing). A text seen nowhere (under a page, a cell, a replacing disc)
          // is neither (feedback-relay-sb 124 to 129 s: HyperFrames' six errors there were clean frames).
          const kind = both > 0 ? "clash" : visible ? "cut" : null;
          const [i, j] = A.i < B.i ? [A.i, B.i] : [B.i, A.i];
          // the two boxes' overlap over their union: about 1 when one text is drawn again on the other
          const ua = (A.u.r - A.u.l) * (A.u.b - A.u.t), ub = (B.u.r - B.u.l) * (B.u.b - B.u.t), ui = (x1 - x0) * (y1 - y0);
          out.push({ i, j, painted: !!kind, kind, iou: +(ui / (ua + ub - ui)).toFixed(2), rect: [x0, y0, x1, y1].map(Math.round) });
        }
      }
      return { out, cov, offCard, lines, veils, throughText, prof: [P1 - P0, P2 - P1, P3 - P2, performance.now() - P3] };
    };
  });
  for (let c0 = 0; c0 < times.length; c0 += SAMPLE_BATCH) {
    const ts = times.slice(c0, c0 + SAMPLE_BATCH);
    const w0 = Date.now();
    const res = await p.evaluate((ts, cv) => ts.map((t, k) => window.__lcSample(t, cv[k])), ts, ts.map(doCoverAt));
    wall += Date.now() - w0;
    res.forEach((got, n) => {
      const t = ts[n];
      got.prof.forEach((v, k) => { prof[k] += v; });
      for (const c of got.cov) { if (!covered.has(c.i)) covered.set(c.i, []); covered.get(c.i).push({ t, share: c.share, rect: c.rect }); }
      for (const c of got.offCard) { const k = "off|" + c.i; if (!heldMap.has(k)) heldMap.set(k, { code: "text_off_card", i: c.i, list: [] }); heldMap.get(k).list.push({ t, share: c.share, rect: c.rect, across: c.across }); }
      for (const c of got.veils) { const k = "veil|" + c.vi; if (!heldMap.has(k)) heldMap.set(k, { code: "full_frame_veil", vi: c.vi, list: [] }); heldMap.get(k).list.push({ t, share: c.share, alpha: c.alpha, rect: c.rect }); }
      for (const c of got.throughText) { const k = "thru|" + c.i + "|" + c.li; if (!heldMap.has(k)) heldMap.set(k, { code: "line_through_text", i: c.i, li: c.li, list: [] }); heldMap.get(k).list.push({ t, share: c.points, rect: c.rect }); }
      for (const c of got.lines) { const k = "line|" + c.li + "|" + c.oi; if (!heldMap.has(k)) heldMap.set(k, { code: "line_into_object", li: c.li, oi: c.oi, list: [] }); heldMap.get(k).list.push({ t, share: c.inside, rect: c.rect }); }
      for (const h of got.out) {
        const k = h.i + "|" + h.j;
        if (!pairs.has(k)) pairs.set(k, { i: h.i, j: h.j, samples: [] });
        pairs.get(k).samples.push({ t, painted: h.painted, kind: h.kind, iou: h.iou, rect: h.rect });
      }
    });
  }
  const findings = [], redrawn = new Map();
  for (const pr of pairs.values()) {
    const s = pr.samples.sort((a, b) => a.t - b.t);
    // the longest run of samples no more than GAP_MS apart, and whether both texts were painted in it
    const runs = []; let run = [s[0]];
    for (let k = 1; k < s.length; k++) { if ((s[k].t - s[k - 1].t) * 1000 > GAP_MS) { runs.push(run); run = [s[k]]; } else run.push(s[k]); }
    runs.push(run);
    const span = (r) => (r.length ? r[r.length - 1].t - r[0].t : 0);
    const best = runs.reduce((m, r) => (span(r) > span(m) || (span(r) === span(m) && r.length > m.length) ? r : m), runs[0]);
    const heldMs = (best[best.length - 1].t - best[0].t) * 1000;
    // an error only when the overlap is SEEN for HELD_MS: the painted samples themselves held (a held overlap seen at one
    // moment, as a card fades, is a warning)
    const ps = s.filter((q) => q.painted), pruns = [];
    for (let k = 0; k < ps.length; k++) { if (k && (ps[k].t - ps[k - 1].t) * 1000 <= GAP_MS) pruns[pruns.length - 1].push(ps[k]); else pruns.push([ps[k]]); }
    const paintedRun = pruns.reduce((m, r) => (span(r) > span(m) || (span(r) === span(m) && r.length > m.length) ? r : m), pruns[0] || []);
    const held = s.length >= 2 && heldMs >= HELD_MS;
    const seenHeld = paintedRun.length >= 2 && span(paintedRun) * 1000 >= HELD_MS;
    const severity = seenHeld ? "error" : (ps.length ? "warning" : "info");
    const A = meta.info[pr.i], B = meta.info[pr.j];
    // the same words drawn again on themselves (boxes 0.8 alike or more) for HELD_MS: a later beat redrawing what an
    // earlier beat still shows, instead of carrying it (L-319's "redrawn sets": feedback-shuttle-opus's first kit, every
    // calendar label drawn twice; clean while the copies coincide, a pop or a ghost when one moves or leaves). HyperFrames
    // reported these as overlaps; Loom names them. Within one beat it is a warning.
    const same = best.filter((q) => q.iou >= 0.8);
    if (A.text && A.text === B.text && same.length >= 2 && (same[same.length - 1].t - same[0].t) * 1000 >= HELD_MS) {
      // one finding per pair of beats (feedback-shuttle-v3: b12 rebuilt b11's whole desk part, 66 texts, one defect)
      const bs = [A.beat || "?", B.beat || "?"].sort(), key = bs.join(">");
      const r = redrawn.get(key) || { bs, texts: new Set(), t0: same[0].t, t1: same[same.length - 1].t, rect: same[0].rect, els: new Set() };
      r.texts.add(A.text); r.els.add(A.el || A.tag); r.els.add(B.el || B.tag);
      r.t0 = Math.min(r.t0, same[0].t); r.t1 = Math.max(r.t1, same[same.length - 1].t);
      redrawn.set(key, r);
      continue;
    }
    const at = (paintedRun[0] || best[0]);
    findings.push({ code: "content_overlap", severity, time: at.t, t0: best[0].t, t1: best[best.length - 1].t, held_ms: Math.round(heldMs), occurrences: s.length,
      painted: paintedRun.length, kind: paintedRun.some((q) => q.kind === "clash") ? "clash" : paintedRun.length ? "cut" : null, a: { text: A.text, beat: A.beat, el: A.el, tag: A.tag }, b: { text: B.text, beat: B.beat, el: B.el, tag: B.tag }, rect: at.rect,
      seen_ms: Math.round(span(paintedRun) * 1000),
      why: severity === "error" ? (paintedRun.some((q) => q.kind === "clash") ? `both texts seen overlapping for ${Math.round(span(paintedRun) * 1000)} ms` : `one text partly covered where the other sits, both seen, for ${Math.round(span(paintedRun) * 1000)} ms`) : held ? (ps.length ? "held, but both texts are seen together only briefly" : "held, but one text is under an opaque layer throughout") : "a passing crossing (under 500 ms)" });
  }
  for (const r of redrawn.values()) {
    // a warning in the check: the copies coincide, so the frames are clean, and a later beat often cannot reach the
    // earlier beat's kit instance (https-private b14's address bar, feedback-shuttle-v3 b12's desk), so no worker could
    // clear it as an error (L-335). pilot_check makes a redraw across the pilot join an error: then the kit can still
    // be changed to carry its parts (L-319). `across` says which kind it is
    const later = r.bs[0] !== r.bs[1] && !r.bs.includes("?"), texts = Array.from(r.texts);
    findings.push({ code: "text_redrawn", severity: "warning", across: later, time: r.t0, t0: r.t0, t1: r.t1, held_ms: Math.round((r.t1 - r.t0) * 1000),
      count: texts.length, a: { text: texts[0], beat: r.bs[0], el: null, tag: null }, b: { text: texts.slice(1, 4).join(" / "), beat: r.bs[1], el: null, tag: null },
      texts: texts.slice(0, 12), elements: Array.from(r.els).filter(Boolean).slice(0, 8), rect: r.rect,
      why: later ? `${r.bs[1]} draws again ${texts.length} text(s) ${r.bs[0]} still shows ("${texts.slice(0, 3).join('", "')}"): carry the element (hold it) instead of redrawing it`
                 : `${texts.length} text(s) drawn twice on themselves in one beat ("${texts.slice(0, 3).join('", "')}")` });
  }
  // a text covered for HELD_MS (samples no more than GAP_MS apart) is an error; covered at one moment, a warning
  for (const [i, list] of covered) {
    const rs = [];
    for (let k = 0; k < list.length; k++) { if (k && (list[k].t - list[k - 1].t) * 1000 <= Math.max(GAP_MS, COVER_EVERY * 1000 + 1)) rs[rs.length - 1].push(list[k]); else rs.push([list[k]]); }
    const sp = (r) => r[r.length - 1].t - r[0].t;
    const best = rs.reduce((m, r) => (sp(r) > sp(m) ? r : m), rs[0]);
    const worst = best.reduce((m, c) => (c.share > m.share ? c : m), best[0]);
    const I = meta.info[i];
    findings.push({ code: "text_covered", severity: best.length >= 2 && sp(best) * 1000 >= HELD_MS ? "error" : "warning", time: worst.t, t0: best[0].t, t1: best[best.length - 1].t,
      held_ms: Math.round(sp(best) * 1000), share: worst.share, text: I.text, beat: I.beat, el: I.el, tag: I.tag, rect: worst.rect, samples: list.length });
  }
  // off card and line into an object: an error once held HELD_MS (samples COVER_EVERY apart are contiguous)
  const lineInfo = heldMap.size ? await p.evaluate(() => (window.__lcIds ? window.__lcIds.info : [])) : [];
  for (const h of heldMap.values()) {
    const list = h.list, rs = [];
    for (let k = 0; k < list.length; k++) { if (k && (list[k].t - list[k - 1].t) * 1000 <= Math.max(GAP_MS, COVER_EVERY * 1000 + 1)) rs[rs.length - 1].push(list[k]); else rs.push([list[k]]); }
    const sp = (r) => r[r.length - 1].t - r[0].t;
    const best = rs.reduce((m, r) => (sp(r) > sp(m) ? r : m), rs[0]);
    const sev = best.length >= 2 && sp(best) * 1000 >= HELD_MS ? "error" : "warning";
    const base = { code: h.code, severity: sev, time: best[0].t, t0: best[0].t, t1: best[best.length - 1].t, held_ms: Math.round(sp(best) * 1000), rect: best[0].rect, samples: list.length };
    // off its card: an error once held; onto another fill of it (a band, a strip, a progress fill): a warning, shown to
    // the author, never holding a scene (the frames: v3's tag lines on a faint strip read fine; a progress fill behind its
    // label is the design)
    if (h.code === "text_off_card") { const I = meta.info[h.i]; const across = best.every((q) => q.across);
      findings.push({ ...base, severity: across ? "warning" : sev, across, share: Math.max(...best.map((q) => q.share)), text: I.text, beat: I.beat, el: I.el, tag: I.tag }); }
    // a veil: one that CHANGES while held (its alpha or the share of the frame it covers moves by VEIL_CHANGE or more, its
    // first and last samples, the fade in and out, set aside when there are four or more) is a tone shift in motion: an
    // error once held VEIL_HELD_MS, a warning shorter. A steady one is a set's wall wash, by design, not reported (the scan of
    // six lessons: dc-cooling's room at 0.6 and feedback-relay-v2's meeting room at 0.82 read as walls; gps-position's dusk
    // went 0.25 to 0.75 over 37 s). One sample is an opaque backdrop passing through on its fade, not reported
    else if (h.code === "full_frame_veil") { const V = lineInfo[h.vi] || {}; if (best.length < 2) continue;
      const core = best.length >= 4 ? best.slice(1, -1) : best;
      const span = (k) => Math.max(...core.map((q) => q[k])) - Math.min(...core.map((q) => q[k]));
      const change = +Math.max(span("alpha"), span("share")).toFixed(2); if (change < VEIL_CHANGE) continue;
      findings.push({ ...base, severity: sp(best) * 1000 >= VEIL_HELD_MS ? "error" : "warning", share: Math.max(...best.map((q) => q.share)),
                      alpha: Math.max(...best.map((q) => q.alpha)), change, text: "", beat: V.beat, el: V.el, tag: V.tag }); }
    else if (h.code === "line_through_text") { const I = meta.info[h.i], A = lineInfo[h.li] || {};
      findings.push({ ...base, points: Math.max(...best.map((q) => q.share)), text: I.text, beat: I.beat, el: I.el, tag: I.tag, line: A }); }
    else { const A = lineInfo[h.li] || {}, B = lineInfo[h.oi] || {}; findings.push({ ...base, points: Math.max(...best.map((q) => q.share)), text: "", beat: A.beat || B.beat, line: A, object: B }); }
  }
  return { step: LAYOUT_STEP, samples: times.length, texts: meta.n, ms: Date.now() - t0, findings,
           ms_by: { setup: tMeta, seek: Math.round(prof[0]), texts: Math.round(prof[1]), covered: Math.round(prof[2]), pairs: Math.round(prof[3]), calls: Math.round(wall) } };
}

// THE BOARD AT A NEW SECTION (Kshitij, 2026-10-15, whiteboard: "You can carry text and designs over from previous
// frames/sections but not too many so there is enough place for new text and explanation. The rest gets wiped off at the
// end of the section"): for a style whose pack sets board.carry, at each section's first spoken moment, what is still on
// screen from earlier sections (characters and ambience aside) may cover at most max_share of the frame and hold at most
// max_words words. Film A carried its whole matrix board through four sections (27 words at b09).
async function boardAudit(p) {
  return await p.evaluate(() => {
    const pk = window.Loom && Loom.style && Loom.style.pack, rule = pk && pk.board && pk.board.carry;
    const M = window.Loom && Loom.manifest;
    if (!rule || !M || !M.beats) return { checked: 0, findings: [] };
    const secOf = new Map(M.beats.map((b) => [b.id, b.section]));
    const order = []; for (const b of M.beats) if (!order.includes(b.section)) order.push(b.section);
    const beatOf = (e) => { for (let n = e; n && n.nodeType === 1; n = n.parentNode) { const v = (n.getAttribute && n.getAttribute("data-beat")) || (n.__E && n.__E.beat); if (v) return v; } return null; };
    const chain = (x) => { let v = 1; for (let n = x; n && n.nodeType === 1; n = n.parentElement) { const cs = getComputedStyle(n); if (cs.display === "none" || cs.visibility === "hidden") return 0; v *= parseFloat(cs.opacity || "1"); } return v; };
    const findings = []; let checked = 0;
    for (let i = 1; i < M.beats.length; i++) {
      const B = M.beats[i]; if (B.section === M.beats[i - 1].section) continue;
      const earlier = new Set(order.slice(0, order.indexOf(B.section)));
      const t = Math.min(B.end - 0.05, Math.max(B.start + 0.8, (B.speech_start || B.start) + 0.3));
      window.__timelines.main.seek(t, false); checked++;
      const G = 24, cols = Math.ceil(1920 / G), rows = Math.ceil(1080 / G), cell = new Uint8Array(cols * rows);
      let words = 0; const names = [];
      for (const el of document.querySelectorAll(".lm-el")) {
        if (el.parentElement && el.parentElement.closest(".lm-el")) continue;          // the top element only
        const k = el.getAttribute("data-kind"); if (["character", "ambient", "bubble"].includes(k)) continue;
        const bid = beatOf(el); if (!bid || !earlier.has(secOf.get(bid))) continue;
        if (chain(el) < 0.3) continue;
        const r = el.getBoundingClientRect();
        const x0 = Math.max(0, r.left), y0 = Math.max(0, r.top), x1 = Math.min(1920, r.right), y1 = Math.min(1080, r.bottom);
        if (x1 - x0 < 2 || y1 - y0 < 2) continue;
        let n = 0;
        for (const tx of el.querySelectorAll("text")) { if (tx.parentElement && tx.parentElement.closest("text")) continue; if (chain(tx) < 0.3) continue; n += (tx.textContent || "").trim().split(/\s+/).filter(Boolean).length; }
        words += n; names.push(el.getAttribute("data-name"));
        for (let cy = Math.floor(y0 / G); cy < Math.ceil(y1 / G); cy++) for (let cx = Math.floor(x0 / G); cx < Math.ceil(x1 / G); cx++) cell[cy * cols + cx] = 1;
      }
      const share = cell.reduce((a, v) => a + v, 0) / (cols * rows);
      if (share > rule.max_share || words > rule.max_words)
        findings.push({ code: "board_carry", severity: "error", time: +t.toFixed(2), t0: +t.toFixed(2), t1: +t.toFixed(2), held_ms: 0, beat: B.id, section: B.section,
          share: +share.toFixed(2), words, max_share: rule.max_share, max_words: rule.max_words, elements: names.slice(0, 10), text: "", rect: [0, 0, 1920, 1080] });
    }
    return { checked, findings };
  });
}

async function contrastAudit(p) {
  const t0 = Date.now();
  const beats = pickBeats(await p.evaluate(() => (window.Loom && Loom.manifest ? Loom.manifest.beats.map((b) => ({ id: b.id, s0: b.speech_start, s1: b.speech_end })) : [])));
  const times = [];
  for (const b of beats) { times.push(+((b.s0 + b.s1) / 2).toFixed(3)); times.push(+Math.max(b.s0 + 0.3, b.s1 - 0.25).toFixed(3)); }
  const entries = [];
  for (const t of times) {
    const cands = await p.evaluate((t) => {
      const L = window.__lc; window.__timelines.main.seek(t, false);
      const parse = (c) => { const m = /rgba?\(([^)]+)\)/.exec(c || ""); if (!m) return null; const p = m[1].includes(",") ? m[1].split(",") : m[1].replace("/", " ").split(/\s+/).filter(Boolean);
        const v = p.map((x) => parseFloat(x)); return [v[0], v[1], v[2], v.length > 3 ? (String(p[3]).includes("%") ? v[3] / 100 : v[3]) : 1]; };
      const SHAPES = new Set(["rect", "path", "circle", "ellipse", "polygon", "polyline", "image", "use", "foreignobject", "canvas", "img", "video"]);   // not line: no fill area (its computed fill is black by default), only a stroke: feedback-shuttle-v3's crossing-out X
      // the occluder's opacity below the layer it shares with the text: a group fading out fades the card and the text
      // under it together, so inside it the card still hides the text (https-private fixture b3, 2026-10-10)
      const opac = (e, T) => { let o = 1; for (let n = e; n && n.nodeType === 1 && !(T && n.contains(T)); n = n.parentElement) o *= +getComputedStyle(n).opacity; return o; };
      const opaque = (e, T) => { const tg = String(e.tagName).toLowerCase(); if (!SHAPES.has(tg)) return false; if (e.closest && e.closest(".lm-wb-marker")) return false; /* the writing hand covers the words it writes, by design */ const cs = getComputedStyle(e);
        if (!["image", "img", "video", "canvas"].includes(tg) && (cs.fill === "none" || cs.fill === "transparent" || +cs.fillOpacity < 0.95)) return false; return opac(e, T) >= 0.95; };
      const mine = (T, e) => e === T || T.contains(e) || (e.contains && e.contains(T) && String(e.tagName).toLowerCase() === "text");
      // 7 x 3 points over the text: where it is seen (no opaque shape above it) and where it is covered (an opaque shape
      // above it, the text under it at that point)
      const cover = (T, r) => { let seen = 0, covered = 0, n = 0;
        for (const fy of [0.25, 0.5, 0.75]) for (let a = 1; a <= 7; a++) {
          const x = r.left + r.width * a / 8, y = r.top + r.height * fy; if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) continue;
          n++; const st = document.elementsFromPoint(x, y);
          for (let k = 0; k < st.length; k++) { const e = st[k]; if (mine(T, e)) { seen++; break; }
            if (opaque(e, T)) { if (st.slice(k + 1).some((x2) => mine(T, x2))) covered++; break; } } }
        return { seen, covered, n }; };
      const out = []; window.__lcRestore = [];
      for (let i = 0; i < L.cands.length; i++) {
        const el = L.cands[i];
        if (!el.isConnected || (el.closest && el.closest("[data-layout-ignore]"))) continue;
        let hid = false; for (let x = el; x && x.nodeType === 1; x = x.parentElement) { const cs = getComputedStyle(x); if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) <= 0.01) { hid = true; break; } }
        if (hid) continue;
        const r = el.getBoundingClientRect();
        const onX = Math.min(r.right, innerWidth) - Math.max(r.left, 0), onY = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0);
        if (onX < 8 || onY < 8 || r.width < 8 || r.height < 8) continue;
        const cs = getComputedStyle(el); const svg = el instanceof SVGElement;
        const fg = svg ? (parse(cs.fill) || parse(cs.color)) : parse(cs.color);
        if (!fg || fg[3] <= 0.01) continue;
        // a text under an opaque shape at every probe point is not seen, so its contrast is not judged (https-private:
        // a step number under the check disc that replaced it, a button label under a card, read as 1:1 failures)
        if (!cover(el, r).seen) continue;
        let blur = 0; for (let x = el; x && x.nodeType === 1; x = x.parentElement) { const f = getComputedStyle(x).filter;
          if (f && f !== "none") { const m = /blur\(([\d.]+)px\)/.exec(f); if (m) blur = Math.max(blur, +m[1]);
            const u = /url\("?#([^")]+)"?\)/.exec(f); const fe = u && document.getElementById(u[1]);
            if (fe) for (const g of fe.querySelectorAll("feGaussianBlur")) blur = Math.max(blur, parseFloat(String(g.getAttribute("stdDeviation") || "0").split(/[ ,]+/)[0]) || 0); } }
        if (blur >= 1.5) continue;   // a backdrop under a real blur is not meant to be read
        const fs = parseFloat(cs.fontSize), fw = Number(cs.fontWeight) || 400;
        window.__lcRestore.push([el, el.style.getPropertyValue("fill"), el.style.getPropertyPriority("fill"), el.style.getPropertyValue("color"), el.style.getPropertyPriority("color")]);
        el.style.setProperty("transition", "none", "important"); el.style.setProperty("color", "transparent", "important"); if (svg) el.style.setProperty("fill", "transparent", "important");
        out.push({ i, fg, large: fs >= 24 || (fs >= 19 && fw >= 700), bbox: { x: r.x, y: r.y, w: r.width, h: r.height } });
      }
      return out;
    }, t);
    const shot = await p.screenshot({ type: "png", encoding: "base64", optimizeForSpeed: true });   // lighter compression, the same pixels
    const res = await p.evaluate(async (img, cands) => {
      for (const [el, f, fp, c, cp] of window.__lcRestore || []) { if (f) el.style.setProperty("fill", f, fp); else el.style.removeProperty("fill"); if (c) el.style.setProperty("color", c, cp); else el.style.removeProperty("color"); el.style.removeProperty("transition"); }
      const bmp = await createImageBitmap(await (await fetch("data:image/png;base64," + img)).blob());
      const cv = new OffscreenCanvas(bmp.width, bmp.height); const cx = cv.getContext("2d"); cx.drawImage(bmp, 0, 0);
      const W = bmp.width, H = bmp.height, px = cx.getImageData(0, 0, W, H).data;
      const lum = (r, g, b) => { const ch = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * ch(r) + 0.7152 * ch(g) + 0.0722 * ch(b); };
      const ratio = (a, b) => { const l1 = lum(...a), l2 = lum(...b); return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05); };
      const med = (a) => { const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
      const out = [];
      for (const c of cands) {
        const x0 = Math.max(0, Math.round(c.bbox.x) + 1), x1 = Math.min(W - 1, Math.round(c.bbox.x + c.bbox.w) - 1), y0 = Math.max(0, Math.round(c.bbox.y) + 1), y1 = Math.min(H - 1, Math.round(c.bbox.y + c.bbox.h) - 1);
        if (x1 <= x0 || y1 <= y0) continue;
        const sx = Math.max(1, Math.floor((x1 - x0) / 12)), sy = Math.max(1, Math.floor((y1 - y0) / 6)), R = [], G = [], B = [], A = [];
        for (let y = y0; y <= y1; y += sy) for (let x = x0; x <= x1; x += sx) { const k = (y * W + x) * 4; R.push(px[k]); G.push(px[k + 1]); B.push(px[k + 2]); A.push(px[k + 3]); }
        if (!R.length || med(A) < 255) continue;
        const bg = [med(R), med(G), med(B)], f = c.fg;
        const comp = [0, 1, 2].map((q) => Math.round(f[q] * f[3] + bg[q] * (1 - f[3])));
        const rt = +ratio(comp, bg).toFixed(2);
        out.push({ i: c.i, ratio: rt, aa: c.large ? rt >= 3 : rt >= 4.5, large: c.large, fg: `rgb(${comp})`, bg: `rgb(${bg})`, bbox: c.bbox });
      }
      return out;
    }, shot, cands);
    for (const e of res) entries.push({ ...e, time: t });
  }
  const info = await p.evaluate(() => window.__lc.info);
  const fails = new Map();
  for (const e of entries) if (!e.aa) { const k = e.i; if (!fails.has(k)) fails.set(k, []); fails.get(k).push(e); }
  const findings = [];
  for (const [i, list] of fails) {
    const held = new Set(list.map((e) => e.time)).size >= 2;
    const worst = list.reduce((m, e) => (e.ratio < m.ratio ? e : m), list[0]);
    findings.push({ code: "contrast_aa_failure", severity: held ? "error" : "warning", time: worst.time, ratio: worst.ratio, required: worst.large ? 3 : 4.5,
      fg: worst.fg, bg: worst.bg, text: info[i].text, beat: info[i].beat, el: info[i].el, samples: list.length });
  }
  return { samples: times.length, checked: entries.length, passed: entries.filter((e) => e.aa).length, ms: Date.now() - t0, findings };
}

const [, , page, outFile] = process.argv;
const browser = await puppeteer.launch({ executablePath: chromePath(), headless: "shell",
  args: ["--no-sandbox", "--disable-gpu", "--allow-file-access-from-files", "--autoplay-policy=no-user-gesture-required"] });
try {
  const p = await browser.newPage();
  await p.setViewport({ width: 1920, height: 1080 });
  const logs = [];
  p.on("console", (m) => { if (["error", "warning"].includes(m.type())) logs.push(`${m.type()}: ${m.text()}`.slice(0, 400)); });
  p.on("pageerror", (e) => logs.push(`pageerror: ${String(e).slice(0, 400)}`));
  await p.goto(pathToFileURL(path.resolve(page)).href, { waitUntil: "load", timeout: 120000 });
  await p.waitForFunction("window.__loom_ready === true || (window.__loom_report && window.__loom_report.errors.length > 0 && window.__loom_report.scenes.length > 0)", { timeout: 120000 }).catch(() => logs.push("timeout: Loom never became ready"));
  const rep = await p.evaluate(() => {
    const r = window.__loom_report || {};
    const els = (r.elements || []).map((e) => ({ beat: e.beat, name: e.name, kind: e.kind, revealT: e.revealT, exitT: e.exitT, exitKind: e.exitKind || null, ...("lifeT" in e ? { lifeT: e.lifeT } : {}), ...("heldBy" in e ? { heldBy: e.heldBy } : {}) }));
    return { ready: !!window.__loom_ready, errors: r.errors, warnings: r.warnings, elements: els, tweens: r.tweens, treatments: r.treatments || [], radii: r.radii || {}, cues: r.cues,
             texts: r.texts, scenes: r.scenes, sfx: r.sfx || [], fx: r.fx || null, overlays: r.overlays || [], objects: r.objects || [], figures: r.figures || [], lottie: r.lottie || [], build_ms: r.build_ms, duration: r.duration,
             timeline: window.__timelines && window.__timelines.main ? window.__timelines.main.duration() : null };
  });
  // the page's size: every browser step that walks the DOM pays for every node (D-154: 98,958 nodes, 96,163 of them
  // background dots, made each HyperFrames check 13 minutes)
  rep.nodes = await p.evaluate(() => document.querySelectorAll("*").length);
  // Loom's own layout checker (overlap and contrast with HyperFrames' rules, one page load; see layoutAudit)
  if (process.env.LOOM_PROBE_LAYOUT !== "0") {
    // hit-testing on for every element while the audits run (pointer-events:none hides an element from
    // elementsFromPoint, both the text probed and its occluder; HyperFrames does the same), off again after: the
    // probe's own passes below rely on layers that take no pointer events being skipped
    await p.evaluate(() => { const s = document.createElement("style"); s.id = "__lc_hit"; s.textContent = "#lm-root, #lm-root * { pointer-events: auto !important; }"; document.head.appendChild(s); });
    try { rep.layout = await layoutAudit(p); } catch (e) { rep.layout_error = String(e).slice(0, 300); }
    try { rep.contrast = await contrastAudit(p); } catch (e) { rep.contrast_error = String(e).slice(0, 300); }
    try { const b = await boardAudit(p); rep.board_checked = b.checked; if (rep.layout && b.findings.length) rep.layout.findings.push(...b.findings); }
    catch (e) { rep.layout_error = (rep.layout_error ? rep.layout_error + "; " : "") + "board: " + String(e).slice(0, 200); }
    await p.evaluate(() => { const s = document.getElementById("__lc_hit"); if (s) s.remove(); });
  }
  // D-100: the type size the viewer actually SEES. Seek to each beat's settled moment and measure every visible
  // text line on screen (station scale, camera zoom and any travel scale included). Step 7 shipped labels that were
  // specks at 1080p while every layout check passed (L-172).
  // 2026-10-07 (bench audit): three blind spots closed here.
  //  (a) a word WHOLLY outside the frame was skipped (only partly cut words counted), so a compare.two whose whole
  //      left column sat off-frame passed (openai-balanced b05). The beat's OWN wholly-off words now count
  //      (`off_text`); a held element's wholly-off words are a warning (`held_off`).
  //  (b) the occlusion hit-test took an empty station root <svg> or a <g> (computed fill black) as paint, so every
  //      word in some lessons was "occluded" and n was 0: a zero denominator that read as a pass.
  //  (c) an element pass (`off`): each of the beat's own and held top-level elements visible >= 0.6 at the settled
  //      time, more than 15 % outside the frame or carrying a wholly-off word; a character (rig, figure) may be
  //      cropped at the bottom (a framing choice) but not more than 24 px at the top or the sides.
  if (process.env.LOOM_PROBE_TEXT !== "0") try {
    const beats = pickBeats(await p.evaluate(() => (window.Loom && Loom.manifest ? Loom.manifest.beats.map((b) => ({ id: b.id, t: Math.max(b.speech_start + 0.3, b.speech_end - 0.25) })) : [])));
    rep.screen_text = [];
    for (const b of beats) {
      const got = await p.evaluate((t, id) => {
        window.__timelines.main.seek(t, false);
        const out = [];
        const vis = (el) => { let o = 1; for (let n = el; n && n.nodeType === 1; n = n.parentNode) { const cs = getComputedStyle(n); if (cs.display === "none" || cs.visibility === "hidden") return 0; o *= parseFloat(cs.opacity || "1"); } return o; };
        // a deliberate bleed declares itself with data-bleed on any ancestor; data-bleed="a-b" declares the crop for a
        // time window only (an insert push into part of a page)
        const bleeding = (el) => { const bl = el.closest && el.closest("[data-bleed]"), bv = bl && bl.getAttribute("data-bleed");
          return !!bl && (!bv || ((([a, c]) => t >= +a && t <= +c)(bv.split("-")))); };
        const wholly = (r) => r.right < 0 || r.bottom < 0 || r.left > 1920 || r.top > 1080;
        const rec = ((window.Loom && Loom.world && Loom.world.sceneRecs) || []).find((r) => r.beat && r.beat.id === id);
        const heldOuter = new Set(((rec && rec.claimedFrom) || []).map((E) => E.outer).filter(Boolean));
        const ownOuter = new Set(((rec && rec.els) || []).map((E) => E.outer).filter((o) => o && !heldOuter.has(o)));
        // whose a node is: the nearest element of THIS beat above it (own or held), wherever the scene put it in the DOM
        // (a scene may build inside a held element's group: ownership by DOM group called those words "other")
        const ownerOf = (n) => { for (let x = n; x && x.nodeType === 1; x = x.parentNode) { if (heldOuter.has(x)) return "held"; if (ownOuter.has(x)) return "own"; } return "other"; };
        const elementOf = (n) => { for (let x = n; x && x.nodeType === 1; x = x.parentNode) if (heldOuter.has(x) || ownOuter.has(x)) return x; return null; };
        // (c) the element pass: the beat's own and held top-level elements, measured on screen
        const EXEMPT = { scenery: 1, presenter: 1, motif: 1, chapter: 1 };
        const LEAF = "path,rect,circle,ellipse,line,polyline,polygon,text,image,use,foreignObject";
        // a clip-path's area on screen (userSpaceOnUse clips: the magnify lens shows a scaled copy of its source cut to a
        // circle; measured unclipped, the copy read as "78 % outside the frame", mfa-explained b07)
        const clipRect = (el) => {
          const cp = (el.getAttribute && el.getAttribute("clip-path")) || "";
          const m = /url\(["']?#([^"')]+)["']?\)/.exec(cp); if (!m) return null;
          const node = document.getElementById(m[1]);
          if (!node || node.getAttribute("clipPathUnits") === "objectBoundingBox") return null;
          const M = el.getScreenCTM && el.getScreenCTM(); if (!M) return null;
          let L = Infinity, T = Infinity, R = -Infinity, B = -Infinity;
          for (const c of node.children) {
            let bb; try { bb = c.getBBox(); } catch (e) { continue; }
            for (const [x, y] of [[bb.x, bb.y], [bb.x + bb.width, bb.y], [bb.x, bb.y + bb.height], [bb.x + bb.width, bb.y + bb.height]]) {
              const px = M.a * x + M.c * y + M.e, py = M.b * x + M.d * y + M.f;
              L = Math.min(L, px); T = Math.min(T, py); R = Math.max(R, px); B = Math.max(B, py);
            }
          }
          return isFinite(L) ? { left: L, top: T, right: R, bottom: B } : null;
        };
        const clipped = (leaf, g, q) => {   // a leaf's screen rect cut by every clip-path between it and its element
          let r = { left: q.left, top: q.top, right: q.right, bottom: q.bottom };
          for (let x = leaf; x && x.nodeType === 1; x = x.parentNode) {
            const c = clipRect(x);
            if (c) r = { left: Math.max(r.left, c.left), top: Math.max(r.top, c.top), right: Math.min(r.right, c.right), bottom: Math.min(r.bottom, c.bottom) };
            if (x === g) break;
          }
          return r;
        };
        const paintBox = (g) => {   // the union of what actually paints (an invisible hit rect or hidden pose part is not the element)
          let L = Infinity, T = Infinity, R = -Infinity, B = -Infinity, n = 0;
          for (const leaf of g.querySelectorAll(LEAF)) {
            if (leaf.closest("defs,clipPath,mask,pattern,symbol,filter")) continue;
            const q0 = leaf.getBoundingClientRect(); if (q0.width < 0.5 && q0.height < 0.5) continue;
            const q = clipped(leaf, g, q0); if (q.right - q.left < 0.5 || q.bottom - q.top < 0.5) continue;
            if (vis(leaf) < 0.15) continue;
            const tg = String(leaf.tagName).toLowerCase();
            if (tg !== "image" && tg !== "use" && tg !== "foreignobject") { const cs = getComputedStyle(leaf); if (cs.fill === "none" && cs.stroke === "none") continue; }
            L = Math.min(L, q.left); T = Math.min(T, q.top); R = Math.max(R, q.right); B = Math.max(B, q.bottom); n++;
          }
          return n ? { left: L, top: T, right: R, bottom: B, width: R - L, height: B - T } : null;
        };
        const outShare = (q) => { const inW = Math.max(0, Math.min(1920, q.right) - Math.max(0, q.left)), inH = Math.max(0, Math.min(1080, q.bottom) - Math.max(0, q.top));
          return 1 - (inW * inH) / Math.max(1, q.width * q.height); };
        // an element its own motion carried away (a travel or fly-out on its mover, life) is leaving on purpose, not
        // cropped, when its HOME place is in the frame or it has left the frame entirely (stress-signal b10's envelope
        // "flies up and out"; phishing b05's tip fan slides off). A layout or a camera that puts it outside is still
        // measured: it has no motion of its own (the openai-balanced compare.two cropped by a focus).
        const movedOff = (E) => {
          const ls = [E.mover, E.life].filter((n) => n && n.getAttribute);
          if (!ls.some((n) => n.getAttribute("transform") || n.style.transform)) return false;
          const saved = ls.map((n) => [n.getAttribute("transform"), n.style.transform]);
          ls.forEach((n) => { n.removeAttribute("transform"); n.style.transform = ""; });
          const home = paintBox(E.outer);
          ls.forEach((n, i) => { const [a, st] = saved[i]; if (a != null) n.setAttribute("transform", a); n.style.transform = st; });
          // its home was in the frame, or it has now left the frame entirely (an exit is invisible, not cropped)
          return !!home && (outShare(home) <= 0.15 || outShare(paintBox(E.outer) || home) >= 0.95);
        };
        // the beat's elements that no other element of the beat contains (they may sit in another beat's group)
        const mine = new Set([...ownOuter, ...heldOuter]);
        const topLevel = (g) => { for (let x = g.parentNode; x && x.nodeType === 1; x = x.parentNode) if (mine.has(x)) return false; return true; };
        const movedOffWord = (E) => movedOff(E);
        for (const tx of document.querySelectorAll("#lm-world text")) {
          const parts = tx.querySelectorAll("tspan").length ? tx.querySelectorAll("tspan") : [tx];
          for (const sp of parts) {
            const str = (sp.textContent || "").trim();
            if (str.length < 2) continue;
            const r = sp.getBoundingClientRect();
            if (r.width < 1 || r.height < 1) continue;
            const o = vis(sp); if (o < 0.6) continue;
            const bleeds = bleeding(sp);
            const rect = [Math.round(r.left), Math.round(r.top), Math.round(r.right), Math.round(r.bottom)];
            if (wholly(r)) {
              // (a) a word the viewer cannot see at all, on an element this beat shows: cut, not skipped (unless its
              // element left on purpose: see movedOff below)
              const host = elementOf(sp), hostE = host && host.__E;
              if (hostE && movedOffWord(hostE)) continue;
              const who = bleeds ? "other" : ownerOf(sp);
              if (who === "own") out.push({ offText: true, text: str.slice(0, 40), rect });
              else if (who === "held") out.push({ offText: true, held: true, text: str.slice(0, 40), rect });
              continue;
            }
            // visible words cut by the frame edge at the settled time (a card or chat that runs off the bottom)
            if ((r.left < -2 || r.top < -2 || r.right > 1922 || r.bottom > 1082) && !bleeds)
              out.push({ cut: true, text: str.slice(0, 40), rect });
            // occluded text (a portal's content behind the screen that covers it) is not seen: hit-test its centre,
            // ignoring layers that take no pointer events (the fx canvas, captions)
            const cx = Math.min(1919, Math.max(0, (r.left + r.right) / 2)), cy = Math.min(1079, Math.max(0, (r.top + r.bottom) / 2));
            // the first hit that actually paints: invisible full-frame rects (a chapter's dim at opacity 0, clip
            // rects, an unrevealed backplate) are hit-testable but cover nothing; (b) neither does a station's root
            // <svg> or a <g> (their computed fill is black by default, which read as paint)
            const paints = (h) => { if (h.tagName === "CANVAS" || (h.closest && h.closest(".lm-captions"))) return false;
              if (!(h instanceof SVGElement)) return false;
              const tg = String(h.tagName).toLowerCase(); if (tg === "svg" || tg === "g") return false;
              if (vis(h) < 0.15) return false;
              const cs = getComputedStyle(h); return !(cs.fill === "none" && cs.stroke === "none"); };
            const top = document.elementsFromPoint(cx, cy).find(paints);
            if (top && !(top === sp || top === tx || tx.contains(top) || (top.closest && top.closest("text") === tx))) continue;
            out.push({ px: Math.round(r.height / 1.22 * 10) / 10, text: str.slice(0, 40), own: ownerOf(sp) === "own", rect });
          }
        }
        // (d) the beat's OWN picture (B4, 2026-10-08): how many of its own top-level elements are seen in the frame
        // (visible >= 0.6, painting, at most half outside, or a declared bleed). gemini b16 and b31 laid their whole
        // picture outside the frame and the edge-density "empty" measure saw the held background, not the blank beat.
        let ownMeasured = 0, ownIn = 0; const absent = [];
        for (const E of rec ? rec.els : []) {
          const g = E.outer;
          if (g && ownOuter.has(g) && !EXEMPT[E.kind] && !E.motif && (!g.parentNode || topLevel(g))) {
            ownMeasured++;
            const v = g.parentNode ? vis(g) : 0, q0 = v >= 0.6 ? paintBox(g) : null;
            if (q0 && (bleeding(g) || outShare(q0) <= 0.5)) ownIn++;
            else if (absent.length < 6) absent.push({ name: E.name, kind: E.kind, why: !g.parentNode ? "removed" : v < 0.6 ? "not visible" : !q0 ? "paints nothing" : "off frame" });
          }
          if (!g || !g.parentNode || !topLevel(g) || EXEMPT[E.kind] || E.motif) continue;
          if (bleeding(g) || vis(g) < 0.6) continue;
          const q = paintBox(g); if (!q || q.width < 8 || q.height < 8) continue;
          if (outShare(q) > 0.15 && movedOff(E)) continue;
          const held = heldOuter.has(g);
          const share = outShare(q);
          const words = [...g.querySelectorAll("text")].filter((t2) => { const r2 = t2.getBoundingClientRect(); return r2.width > 0 && vis(t2) >= 0.6 && wholly(r2); }).length;
          const box = [q.left, q.top, q.right, q.bottom].map(Math.round);
          if (E.kind === "character") {
            const topCrop = Math.max(0, -q.top), sideCrop = Math.max(0, -q.left) + Math.max(0, q.right - 1920);
            if (topCrop > 24 || sideCrop > 24) out.push({ off: true, held, name: E.name, kind: E.kind, share: Math.round(share * 100) / 100, crop: { top: Math.round(topCrop), side: Math.round(sideCrop) }, words, rect: box });
          } else if (share > 0.15 || words) {
            out.push({ off: true, held, name: E.name, kind: E.kind, share: Math.round(share * 100) / 100, words, rect: box });
          }
        }
        return { out, els: rec ? rec.els.length : 0, ownMeasured, ownIn, absent };
      }, b.t, b.id);
      const all = got.out;
      const cut = all.filter((g) => g.cut).slice(0, 6), seen = all.filter((g) => g.px != null);
      const off = all.filter((g) => g.off && !g.held).slice(0, 8);
      const offText = all.filter((g) => g.offText && !g.held).slice(0, 8);
      const heldOff = all.filter((g) => g.held && (g.off || g.offText)).slice(0, 8);
      const small = seen.filter((g) => g.px < 30).sort((a, c) => a.px - c.px).slice(0, 6);
      // the beat's own readable text boxes (for the blur measure on the frames, loom/checks/film.py)
      const boxes = seen.filter((g) => g.own).slice(0, 16).map((g) => g.rect);
      rep.screen_text.push({ beat: b.id, t: b.t, n: seen.length, n_own: seen.filter((g) => g.own).length, els: got.els,
        min_px: seen.length ? Math.min(...seen.map((g) => g.px)) : null, small, cut, off, off_text: offText, held_off: heldOff, boxes,
        own_measured: got.ownMeasured, own_in_frame: got.ownIn, absent: got.absent });
    }
  } catch (e) { rep.screen_text_error = String(e).slice(0, 300); }
  // Foreign pixels (2026-10-07, bench audit): at each beat's settled moment, photograph the frame, then hide every
  // scene group that is not the active beat's (the elements it holds stay) and photograph again. Pixels that change
  // belong to another beat: stuck (an earlier beat that never left) or preshown (a later one that never hid). The
  // claude-balanced bench showed b52's picture under b01 to b04 (22 % of the frame) with every check green.
  if (process.env.LOOM_PROBE_FOREIGN !== "0") {
    try {
      rep.foreign = await foreignPixels(p, browser);
    } catch (e) { rep.foreign_error = String(e).slice(0, 300); }
  }
  rep.console = logs;
  fs.writeFileSync(outFile, JSON.stringify(rep, null, 1));
  console.log(`probe: ready=${rep.ready} errors=${(rep.errors || []).length} warnings=${(rep.warnings || []).length} scenes=${(rep.scenes || []).length}`);
} finally {
  await browser.close();
}
