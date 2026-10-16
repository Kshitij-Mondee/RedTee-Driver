/* Loom layout guard (D-169): the engine, not an agent, keeps flexible elements clear of each other, of text and of the
 * frame edge. Kshitij, 2026-10-15: "overlapping and text fitting was very nicely tackled by my deterministic and fully
 * offline engine the last time in redtee_v1_video ... make something like this here as well so AI agents are not really
 * required to fix small things like text fitting and overlapping."
 *
 * RedTee prevented collisions by construction (a resolver turned declared layouts into boxes) and fitted text before it
 * drew. Loom's scenes are bespoke code with motion and a camera, so their geometry is only known by running them. The
 * guard therefore works in two steps, both pure functions of the build:
 *   1. solve(): on a built page, seek the timeline every `step` seconds, record the screen boxes of every element's
 *      text and opaque shapes, and for each FLEXIBLE element (labels, tags, stamps, badges, callouts; or any element
 *      declared {layout: "flex"}) that is held in a conflict, pick the nearest offset from a fixed candidate list that
 *      clears it at every sample. An EDGE element (kind text, card, list, document, panel, or {layout: "edge"}) moves
 *      only to come back inside the frame. Nothing random, no clock: the same build gives the same plan.
 *   2. the plan ({"<beat>/<name>": {dx, dy}}, in the element's parent units) goes into the manifest (compose), and
 *      kit.element and treat.label apply it when the element is made, so a label's lead is drawn to its new place.
 * The plan is data written by the engine (projects/<id>/layout/plan.json), logged and replayable; the scene files are
 * never edited. Without a plan in the manifest nothing changes (the classic way, kept: CLAUDE.md rule 11).
 *
 * Overlap that is meant stays: objects (a mug, a table, a character, a set) are never moved, and objects touching or
 * overlapping each other is never a conflict; only a flexible element's words and body are judged. An author says an
 * overlap is meant with ctx.el(name, {overlaps: ["table"]}) (or "*"), keeps an element where it is with {layout: "fixed"},
 * and the existing data-layout-allow-overlap and data-layout-ignore marks are honoured as the checker honours them.
 */
// @capability layout_guard | layout | Loom.layout.solve, plan offsets in kit.element and treat.label | Layout | the engine moves labels, tags and edge-crossing texts clear of collisions and the frame edge, deterministically (D-169)
(function () {
  "use strict";
  const Loom = window.Loom;
  const Ly = (Loom.layout = { plan: {}, applied: [] });
  /** kinds moved to clear any held conflict, and kinds moved only to come back inside the frame */
  Ly.FLEX = new Set(["label", "tag", "stamp", "badge", "callout", "note", "pill", "chip"]);
  Ly.EDGE = new Set(["text", "card", "list", "document", "panel", "title", "kicker"]);
  /** shapes of these kinds are objects a label should not sit on (a soft conflict) */
  Ly.OBJECT = new Set(["icon", "instrument", "object", "character", "device", "figure", "prop", "document", "token", "card"]);
  // gap: the breathing room a flexible element keeps from words and other labels (a label that only just clears a pill
  // still reads as crowded: zz-guard-cc-sol b10, 2026-10-15). Objects, by the author's intent: a label the author put
  // mostly ON an object (half of it or more) is meant there (a stamp on a device, a name on a mug) and may not straddle its
  // edge (less than `straddle[1]` on); any other label must end clear of every object (no more than `straddle[0]` on),
  // so the guard never moves a label onto a drive or a document (zz-guard-cc-sol b06, b09 in the first version).
  // captionBand: where the captions sit (about 960 to 1010 px; 150 pushed a label clear of them up onto a document).
  // maxMove: a label stays near where its author put it; the way back inside the frame is not limited
  Ly.DEFAULTS = { step: 0.5, pad: 4, gap: 12, edge: 12, captionBand: 110, held: 2, minArea: 30, maxMove: 160,
    rings: [16, 28, 44, 64, 88, 116, 150, 190, 230], straddle: [0.04, 0.85] };

  Ly.key = (beat, name) => `${beat}/${name}`;
  Ly.init = function (manifest) {
    Ly.on = !!(manifest && manifest.layout_guard);   // the guard's draw-time help (kit.text grows a short box) only when it is on
    Ly.plan = (manifest && manifest.layout_plan) || {};
    Ly.applied = [];
    Loom.report.layout = { entries: Object.keys(Ly.plan).length, applied: Ly.applied };
  };
  /** the planned offset for an element made now (null without one); recorded as applied */
  Ly.offset = function (beat, name) {
    const m = Ly.plan[Ly.key(beat, name)];
    if (!m || (!m.dx && !m.dy)) return null;
    Ly.applied.push({ beat, name, dx: m.dx, dy: m.dy });
    return m;
  };

  /* ---------------- the solver (runs on a built page; reads the DOM, moves nothing) ---------------- */
  const LEAF = "text, rect, path, circle, ellipse, polygon, image, use";
  const inter = (a, b, pad) => {
    const w = Math.min(a.r, b.r) + pad - (Math.max(a.l, b.l) - pad), h = Math.min(a.b, b.b) + pad - (Math.max(a.t, b.t) - pad);
    return w > 0 && h > 0 ? w * h : 0;
  };
  const shift = (q, dx, dy) => ({ l: q.l + dx, t: q.t + dy, r: q.r + dx, b: q.b + dy });
  const union = (rs) => rs.reduce((m, q) => ({ l: Math.min(m.l, q.l), t: Math.min(m.t, q.t), r: Math.max(m.r, q.r), b: Math.max(m.b, q.b) }),
    { l: 1e9, t: 1e9, r: -1e9, b: -1e9 });
  const area = (q) => Math.max(0, q.r - q.l) * Math.max(0, q.b - q.t);

  function modeOf(E) {
    const o = E.outer.getAttribute("data-layout");
    if (o === "flex" || o === "edge" || o === "fixed") return o;
    if (E.outer.closest("[data-layout-ignore]")) return "fixed";
    return Ly.FLEX.has(E.kind) ? "flex" : Ly.EDGE.has(E.kind) ? "edge" : "fixed";
  }

  Ly.solve = function (opts) {
    const O = Object.assign({}, Ly.DEFAULTS, opts || {});
    const P0 = performance.now();
    const tl = window.__timelines && window.__timelines.main;
    const man = Loom.manifest || {};
    if (!tl) return { error: "no timeline" };
    // every element, in document order; each leaf belongs to its nearest element
    const els = Array.from(document.querySelectorAll("g.lm-el")).map((g) => g.__E).filter(Boolean);
    const idx = new Map(els.map((E, i) => [E.outer, i]));
    const anc = els.map((E) => { const s = new Set(); for (let p = E.outer.parentElement; p; p = p.parentElement) if (idx.has(p)) s.add(idx.get(p)); return s; });
    const related = (i, j) => i === j || anc[i].has(j) || anc[j].has(i);
    const leaves = [];
    let z = 0;
    for (const n of document.querySelectorAll(LEAF)) {
      z++;
      if (n.closest("defs,clipPath,mask,pattern,symbol")) continue;
      const host = n.closest("g.lm-el");
      if (!host || !idx.has(host)) continue;
      if (n.tagName !== "text" && n.closest("text")) continue;
      leaves.push({ n, e: idx.get(host), z, text: n.tagName === "text" });
    }
    // drawn lines (a box edge, a divider, an arrow, a grid line): on a whiteboard the board is all strokes, so a label
    // moved onto one would be a line through its words, which the probe's line_through_text fails (L-462). Long strokes
    // only (60 screen px or more): a letter's strokes are short, and words are judged by their text boxes
    const SKIPK = new Set(["character", "ambient", "scenery"]);
    const strokes = [];
    for (const n of document.querySelectorAll("line,polyline,path,rect,ellipse,circle,polygon")) {
      if (n.closest("defs,clipPath,mask,pattern,symbol") || n.closest(".lm-wb-marker") || n.closest("text")) continue;
      const host = n.closest("g.lm-el");
      if (!host || !idx.has(host) || SKIPK.has(host.__E && host.__E.kind)) continue;
      let len = 0; try { len = n.getTotalLength(); } catch (e) { continue; }
      if (!(len > 20)) continue;
      strokes.push({ n, e: idx.get(host), len, pts: null });
    }
    const mode = els.map(modeOf);
    const capOn = !!(man.captions && man.captions.enabled);
    const leadOf = new Map();
    els.forEach((E, i) => { if (E.lead && E.lead.outer && idx.has(E.lead.outer)) leadOf.set(i, idx.get(E.lead.outer)); });
    const allow = els.map((E) => E.outer.hasAttribute("data-layout-allow-overlap") || !!E.outer.closest("[data-layout-ignore]"));
    // meant to touch (Kshitij: "there will always be objects that will need to overlap or collide like a mug on a table"):
    // an element names the partners it may sit on or against ({overlaps: ["table"]}); either side naming the other is enough
    const withOf = els.map((E) => new Set(String(E.outer.getAttribute("data-layout-with") || "").split(",").map((s) => s.trim()).filter(Boolean)));
    const meant = (i, j) => withOf[i].has(els[j].name) || withOf[j].has(els[i].name) || withOf[i].has("*") || withOf[j].has("*");

    const dur = tl.duration();
    const times = [];
    // only some beats' windows (a scene author's look), a second before to half a second after, as the probe samples them
    const wins = O.beats && O.beats.length ? (man.beats || []).filter((b) => O.beats.includes(b.id)).map((b) => [b.start - 1, b.end + 0.5]) : null;
    for (let t = O.step / 2; t < dur; t += O.step) if (!wins || wins.some(([a, z]) => t >= a && t <= z)) times.push(+t.toFixed(3));
    const S = [];   // per sample: {t, items: [{e, z, text, opaque, r}], lin: Map(e -> [a,b,c,d])}
    const movables = els.map((E, i) => i).filter((i) => mode[i] !== "fixed");
    for (const t of times) {
      tl.seek(t, false);
      const memo = new Map();
      const chain = (x) => { if (!x || x.nodeType !== 1) return 1; if (memo.has(x)) return memo.get(x);
        const cs = getComputedStyle(x); const v = cs.display === "none" || cs.visibility === "hidden" ? 0 : parseFloat(cs.opacity || "1") * chain(x.parentElement);
        memo.set(x, v); return v; };
      const vis = (i) => chain(els[i].inner) >= 0.3;
      if (!movables.some(vis)) { S.push(null); continue; }
      const items = [];
      for (const L of leaves) {
        if (!vis(L.e) || chain(L.n) < 0.3) continue;
        const q = L.n.getBoundingClientRect();
        if (q.width < 0.5 || q.height < 0.5) continue;
        const r = { l: q.left, t: q.top, r: q.right, b: q.bottom };
        if (r.r < 0 || r.b < 0 || r.l > 1920 || r.t > 1080) continue;
        let opaque = false;
        if (!L.text) {
          const cs = getComputedStyle(L.n);
          opaque = cs.fill !== "none" && cs.fill !== "transparent" && !/rgba\([^)]*,\s*0(\.0+)?\)/.test(cs.fill) && +cs.fillOpacity >= 0.95 && chain(L.n) >= 0.9;
          if (!opaque && !Ly.OBJECT.has(els[L.e].kind)) continue;
        }
        items.push({ e: L.e, z: L.z, text: L.text, opaque, r });
      }
      for (const L of strokes) {
        if (!vis(L.e) || chain(L.n) < 0.5) continue;
        const cs = getComputedStyle(L.n);
        if (!cs.stroke || cs.stroke === "none" || +cs.strokeOpacity < 0.3) continue;
        const m = L.n.getScreenCTM(); if (!m) continue;
        const k = Math.hypot(m.a, m.b);
        if (parseFloat(cs.strokeWidth) * k < 1.2) continue;
        // only the drawn part (a stroke is revealed by its dash offset, as the probe reads it)
        const da = cs.strokeDasharray, off = parseFloat(cs.strokeDashoffset) || 0;
        const drawn = da && da !== "none" && da.split(/[ ,]+/).length === 2 ? Math.max(0, Math.min(L.len, L.len - off)) : L.len;
        if (drawn * k < 60) continue;
        if (!L.pts) { const N = Math.min(160, Math.max(12, Math.round(L.len / 4))); L.pts = [];
          for (let q = 0; q <= N; q++) { const pt = L.n.getPointAtLength(L.len * q / N); L.pts.push([L.len * q / N, pt.x, pt.y]); } }
        const pts = L.pts.filter((p) => p[0] <= drawn).map((p) => [m.a * p[1] + m.c * p[2] + m.e, m.b * p[1] + m.d * p[2] + m.f]);
        const q = L.n.getBoundingClientRect();
        items.push({ e: L.e, z: 0, text: false, opaque: false, line: true, pts, r: { l: q.left, t: q.top, r: q.right, b: q.bottom } });
      }
      const lin = new Map();
      for (const i of movables) {
        if (!vis(i)) continue;
        const m = els[i].outer.parentNode.getScreenCTM && els[i].outer.parentNode.getScreenCTM();
        if (m) lin.set(i, [m.a, m.b, m.c, m.d]);
      }
      S.push({ t, items, lin });
    }
    tl.seek(0, false);

    // the conflicts of element i in sample s, its items moved by (dx, dy) screen px. Returns {score, codes}
    const frameBox = (i) => ({ l: O.edge, t: O.edge, r: 1920 - O.edge, b: 1080 - (capOn && mode[i] === "flex" ? O.captionBand : O.edge) });
    function conflicts(i, s, dx, dy) {
      const own = s.items.filter((it) => it.e === i);
      if (!own.length) return null;
      const mine = own.map((it) => Object.assign({}, it, { r: shift(it.r, dx, dy) }));
      const body = union(mine.map((it) => it.r)), texts = mine.filter((it) => it.text);
      let score = 0; const codes = new Set();
      const lead = leadOf.get(i);
      for (const it of s.items) {
        if (it.e === i || related(i, it.e) || it.e === lead || allow[it.e] || meant(i, it.e)) continue;
        if (it.text) {
          const a = inter(body, it.r, mode[i] === "flex" ? O.gap : O.pad);
          if (a > 0) { score += a; codes.add("covers_text"); }
          continue;
        }
        if (it.line) {
          // a line through my words: points of it inside the core of a text box (the probe's band: the outer 18 % above
          // and 22 % below are left to underlines and ascenders), with a few px of air
          let n = 0;
          for (const [x, y] of it.pts) for (const q of texts) { const h = q.r.b - q.r.t;
            if (x > q.r.l - 4 && x < q.r.r + 4 && y > q.r.t + h * 0.18 - 4 && y < q.r.b - h * 0.22 + 4) { n++; break; } }
          if (n >= 3) { score += 25 * n; codes.add("line_through"); }
          continue;
        }
        if (it.opaque && texts.length) {
          // another element's opaque shape drawn above my words
          for (const q of texts) if (it.z > q.z) { const a = inter(q.r, it.r, 0); if (a > 0) { score += a; codes.add("text_covered"); } }
        }
        if (mode[it.e] === "flex" && mode[i] === "flex") {
          const a = inter(body, it.r, O.gap); if (a > 0) { score += 0.6 * a; codes.add("label_on_label"); }
        }
      }
      // objects, judged against each object's whole outline (its shapes and those of the elements inside it: a drive and
      // the copy it holds are one thing), and by the author's intent (DEFAULTS)
      if (mode[i] === "flex") {
        if (!s.objU) {
          s.objU = new Map();
          const add = (e, r) => s.objU.set(e, s.objU.has(e) ? union([s.objU.get(e), r]) : r);
          for (const it of s.items) {
            if (it.text) continue;
            if (Ly.OBJECT.has(els[it.e].kind)) add(it.e, it.r);
            for (const a of anc[it.e]) if (Ly.OBJECT.has(els[a].kind)) add(a, it.r);
          }
        }
        const A = area(body), body0 = union(own.map((it) => it.r));
        for (const [e, u] of s.objU) {
          if (e === i || related(i, e) || e === lead || allow[e] || meant(i, e) || area(u) > 0.25 * 1920 * 1080) continue;
          const share = inter(body, u, 0) / Math.max(1, A), share0 = inter(body0, u, 0) / Math.max(1, area(body0));
          const bad = share0 >= 0.5 ? share < O.straddle[1] : share > O.straddle[0];
          if (bad) { score += 0.5 * Math.max(share, 0.05) * A; codes.add(share0 >= 0.5 ? "on_object_edge" : "on_object"); }
        }
      }
      const F = frameBox(i), out = area(body) - area({ l: Math.max(body.l, F.l), t: Math.max(body.t, F.t), r: Math.min(body.r, F.r), b: Math.min(body.b, F.b) });
      const edge = out > 0.5 ? 2 * out : 0;
      if (edge) { score += edge; codes.add("off_frame"); }
      return { score, codes, edge };
    }
    // a whole life's verdict for element i under a local offset (lx, ly): samples held in conflict, total score, codes
    // part: "all", "edge" (only the frame edge) or "rest" (everything but the frame edge)
    function verdict(i, lx, ly, part) {
      let held = 0, total = 0; const codes = new Set();
      for (const s of S) {
        if (!s || !s.lin.has(i)) continue;
        const [a, b, c, d] = s.lin.get(i);
        const C = conflicts(i, s, a * lx + c * ly, b * lx + d * ly);
        if (!C) continue;
        const sc = part === "edge" ? C.edge : part === "rest" ? C.score - C.edge : C.score;
        if (part === "edge") C.codes = new Set(C.edge ? ["off_frame"] : []);
        if (part === "rest") C.codes.delete("off_frame");
        if (sc > O.minArea) { held++; total += sc; C.codes.forEach((k) => codes.add(k)); }
      }
      return { held, total, codes: [...codes] };
    }
    const moves = [], residual = [], checked = [];
    // the order: first seen, then document order (deterministic)
    const firstSeen = (i) => { for (const s of S) if (s && s.lin.has(i)) return s.t; return Infinity; };
    const order = movables.filter((i) => isFinite(firstSeen(i))).sort((p, q) => firstSeen(p) - firstSeen(q) || p - q);
    for (const i of order) {
      const E = els[i], edgeOnly = mode[i] === "edge";
      const before = verdict(i, 0, 0, edgeOnly ? "edge" : "all"), restBefore = edgeOnly ? verdict(i, 0, 0, "rest") : null;
      checked.push(i);
      if (before.held < O.held) continue;
      // a screen offset is turned into the element's parent units with the scale it is seen at most
      const ref = S.find((s) => s && s.lin.has(i)).lin.get(i);
      const det = ref[0] * ref[3] - ref[1] * ref[2] || 1;
      const toLocal = (sx, sy) => [(ref[3] * sx - ref[2] * sy) / det, (-ref[1] * sx + ref[0] * sy) / det];
      const cands = [];
      // the smallest move that brings the element back inside the frame comes first
      if (before.codes.includes("off_frame")) {
        let need = { x: 0, y: 0 };
        for (const s of S) {
          if (!s || !s.lin.has(i)) continue;
          const own = s.items.filter((it) => it.e === i); if (!own.length) continue;
          const u = union(own.map((it) => it.r)), F = frameBox(i);
          if (u.l < F.l) need.x = Math.max(need.x, F.l - u.l); if (u.r > F.r) need.x = Math.min(need.x, F.r - u.r);
          if (u.t < F.t) need.y = Math.max(need.y, F.t - u.t); if (u.b > F.b) need.y = Math.min(need.y, F.b - u.b);
        }
        // rounded away from the edge, a pixel past it (rounded to the nearest, 311.17 px became 311 and left 0.17 px out)
        const away = (v) => (v > 0 ? Math.ceil(v) + 1 : v < 0 ? Math.floor(v) - 1 : 0);
        cands.push({ sx: away(need.x), sy: away(need.y), r: Math.hypot(need.x, need.y), clamp: true });
      }
      const DIRS = [[1, 0], [-1, 0], [0, -1], [0, 1], [0.7071, -0.7071], [-0.7071, -0.7071], [0.7071, 0.7071], [-0.7071, 0.7071]];
      for (const r of O.rings) for (const [ux, uy] of DIRS) cands.push({ sx: Math.round(ux * r), sy: Math.round(uy * r), r });
      let best = null;
      for (const c of cands) {
        // back inside the frame is always the safe way, however far; any other move stays near where the author put it
        if ((c.r > O.maxMove && !c.clamp) || (c.sx === 0 && c.sy === 0)) continue;
        const [lx, ly] = toLocal(c.sx, c.sy);
        // a label keeps its lead short and never sits on the point it names
        if (E.__to) {
          const L = E.__to, cx = E.x + E.w / 2 + lx, cy = E.y + E.h / 2 + ly;
          if (cx > E.x + lx && cx < E.x + lx + E.w && L[0] > E.x + lx && L[0] < E.x + lx + E.w && L[1] > E.y + ly && L[1] < E.y + ly + E.h) continue;
          if (Math.hypot(cx - L[0], cy - L[1]) > Math.hypot(E.x + E.w / 2 - L[0], E.y + E.h / 2 - L[1]) + 160) continue;
        }
        // an edge element is judged by the edge, and may not trade it for a collision it did not have
        const v = verdict(i, lx, ly, edgeOnly ? "edge" : "all");
        if (edgeOnly) { const r2 = verdict(i, lx, ly, "rest"); if (r2.total > restBefore.total + 1e-6) continue; }
        const key = [v.held, v.total, c.r];
        if (!best || key[0] < best.key[0] || (key[0] === best.key[0] && (key[1] < best.key[1] - 1e-6 || (Math.abs(key[1] - best.key[1]) <= 1e-6 && key[2] < best.key[2])))) best = { c, lx, ly, v, key };
        if (v.held === 0) break;   // candidates are in order of distance: the first clear one is the nearest
      }
      const name = E.name, beat = E.beat;
      // only a move that clears everything: a half fix can land the label on something the checker then fails
      // (zz-guard-cc-sol b06, 2026-10-15), and what the engine cannot clear stays where the author put it, for the author
      if (!best || best.v.held > 0) {
        residual.push({ beat, name, kind: E.kind, held: before.held, codes: before.codes, tried: cands.length,
          best: best ? { held: best.v.held, codes: best.v.codes, screen: [best.c.sx, best.c.sy] } : null, clamp: cands[0] && cands[0].clamp ? [cands[0].sx, cands[0].sy] : null });
        continue;
      }
      const dx = Math.round(best.lx * 2) / 2, dy = Math.round(best.ly * 2) / 2;
      moves.push({ beat, name, kind: E.kind, mode: mode[i], dx, dy, screen: [best.c.sx, best.c.sy], before: { held: before.held, codes: before.codes },
        after: { held: best.v.held, codes: best.v.codes } });
      // later elements see this one where it now is
      for (const s of S) {
        if (!s || !s.lin.has(i)) continue;
        const [a, b, c, d] = s.lin.get(i), sx = a * best.lx + c * best.ly, sy = b * best.lx + d * best.ly;
        for (const it of s.items) if (it.e === i) { it.r = shift(it.r, sx, sy); if (it.pts) it.pts = it.pts.map(([x, y]) => [x + sx, y + sy]); }
        s.objU = null;   // an object's outline is worked out again with the moved element where it now is
      }
    }
    return { moves, residual, checked: checked.length, movables: movables.length, samples: S.filter(Boolean).length, step: O.step,
      ms: Math.round(performance.now() - P0) };
  };
})();
