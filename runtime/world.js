/* Loom world: ONE canvas for the whole video.
 * Stations are regions of a large world plane (optionally nested inside each other for
 * zoom-throughs). A camera travels between them. Elements persist across beats by SEMANTIC
 * name (held / travelling / retiring / incoming - lnd-visual-design s7b), so the video reads as
 * one continuous film instead of a slide deck.
 *
 * Camera, captions, presenter and ambient layers are CLOCK layers: pure functions of time,
 * evaluated from a single timeline-spanning driver, so any seek order lands on the right frame.
 */
// @capability world_and_joins | world | storyboard stations, join_in (camera, travel, zoom, cut, iris, wipe, dip, fade), keep, ctx.held, ctx.motif | Screen joins | one canvas for the film: stations, camera joins and zoom-throughs, held elements, motifs that travel between stations
(function () {
  "use strict";
  const Loom = window.Loom;
  const W = Loom.W, H = Loom.H;
  const Wd = (Loom.world = { stations: {}, clocks: [], shots: [], motifs: {} });
  const S = () => Loom.style;

  Loom.clock = function (fn) { Wd.clocks.push(fn); };

  /* ---------------- stage ---------------- */
  Wd.buildStage = function (root) {
    root.style.position = "relative"; root.style.overflow = "hidden";
    Wd.root = root;
    Wd.field = Loom.html("div", { id: "lm-field", style: `position:absolute;inset:0;background:${S().c("field")}` }, root);
    Wd.ambient = Loom.html("div", { id: "lm-ambient", style: "position:absolute;left:0;top:0;width:1920px;height:1080px;pointer-events:none" }, root);
    Wd.cam = Loom.html("div", { id: "lm-cam", style: "position:absolute;left:0;top:0;width:1920px;height:1080px" }, root);
    Wd.world = Loom.html("div", { id: "lm-world", style: "position:absolute;left:0;top:0;width:1920px;height:1080px;transform-origin:0 0" }, Wd.cam);
    Wd.overlay = Loom.html("div", { id: "lm-overlay", style: "position:absolute;left:0;top:0;width:1920px;height:1080px;pointer-events:none" }, root);
  };

  /* ---------------- stations (world coords; nesting for zoom-throughs) ---------------- */
  Wd.addStations = function (list) {
    const byId = {};
    for (const s of list) byId[s.id] = s;
    function resolve(s) {
      if (s.__w) return s.__w;
      // A nested station's OWN coordinates are always one full frame: templates and blueprints lay out in kit.SAFE of
      // 1920x1080, so a declared w/h of 960x540 drew them twice too big and off the frame (bench gemini-balanced
      // s_impact, s_future_plan, s_camera_lens, 2026-10-07). Its size inside the parent is rect.w/h.
      const w = s.parent ? W : (s.w || W), h = s.parent ? H : (s.h || H);
      if (s.parent && ((s.w && s.w !== W) || (s.h && s.h !== H))) {
        Loom.warn("station_size_ignored", `station ${s.id}: w/h ${s.w || W}x${s.h || H} ignored on a nested station (its local space is ${W}x${H}; rect sets its size in ${s.parent})`, { station: s.id });
      }
      if (s.parent) {
        const P = resolve(byId[s.parent]);
        if (!P) { Loom.error("bad_station_parent", s.id); return null; }
        const r = s.rect; // rect in the parent's local coords
        const sc = (r.w / w) * P.s;
        s.__w = { x: P.x + r.x * P.s, y: P.y + r.y * P.s, s: sc, w, h };
      } else {
        s.__w = { x: s.x || 0, y: s.y || 0, s: s.scale || 1, w, h };
      }
      return s.__w;
    }
    for (const s of list) {
      const w = resolve(s); if (!w) continue;
      const div = Loom.html("div", { class: "lm-station", "data-station": s.id, style: `position:absolute;left:${w.x}px;top:${w.y}px;width:${w.w}px;height:${w.h}px;transform:scale(${w.s});transform-origin:0 0;visibility:hidden` }, Wd.world);
      const root = Loom.svg("svg", { width: w.w, height: w.h, viewBox: `0 0 ${w.w} ${w.h}`, overflow: "visible", style: "position:absolute;left:0;top:0;overflow:visible" }, div);
      Wd.stations[s.id] = { id: s.id, def: s, div, svg: root, wx: w.x, wy: w.y, ws: w.s, w: w.w, h: w.h, windows: [] };
    }
    // world-space motif layer (travelling objects live here so they can cross stations)
    Wd.motifSvg = Loom.svg("svg", { width: 10, height: 10, style: "position:absolute;left:0;top:0;overflow:visible", overflow: "visible" }, Wd.world);
  };
  /** station-local rect -> world rect */
  Wd.toWorld = function (stId, r) {
    const st = Wd.stations[stId];
    return { x: st.wx + r.x * st.ws, y: st.wy + r.y * st.ws, w: r.w * st.ws, h: r.h * st.ws };
  };

  /* ---------------- camera: a pure function of time ---------------- */
  function shotRect(shot) {
    const st = Wd.stations[shot.station];
    if (!st) { Loom.error("shot_unknown_station", shot.station); return { x: 0, y: 0, w: W, h: H }; }
    let r = shot.focus ? { x: shot.focus[0], y: shot.focus[1], w: shot.focus[2], h: shot.focus[3] } : { x: 0, y: 0, w: st.w, h: st.h };
    const z = shot.zoom || 1;
    if (z !== 1) { const cx = r.x + r.w / 2, cy = r.y + r.h / 2; r = { x: cx - r.w / z / 2, y: cy - r.h / z / 2, w: r.w / z, h: r.h / z }; }
    return Wd.toWorld(shot.station, r);
  }
  function camFor(R) {
    // aspect-correct: fit R into the frame, centred
    const s = Math.min(W / R.w, H / R.h);
    return { s, cx: R.x + R.w / 2, cy: R.y + R.h / 2 };
  }
  function pushPivot(r, cam, f) {
    const SF = Loom.kit.SAFE, st = r.def.station;
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const E of r.els) {
      const par = E.outer && E.outer.parentNode;
      if (!par || !par.getAttribute || par.getAttribute("class") !== "lm-scene" || !(E.w > 0 && E.h > 0)) continue;
      const R = Wd.toWorld(st, { x: E.x, y: E.y, w: E.w, h: E.h });
      const sx = W / 2 + (R.x - cam.cx) * cam.s, sy = H / 2 + (R.y - cam.cy) * cam.s;
      x0 = Math.min(x0, sx); y0 = Math.min(y0, sy); x1 = Math.max(x1, sx + R.w * cam.s); y1 = Math.max(y1, sy + R.h * cam.s);
    }
    if (!isFinite(y0) || f <= 1) return { f, px: W / 2, py: H / 2 };
    const axis = (a0, a1, lo, hi, mid, ff) => {
      // pivot p keeps [a0,a1] inside [lo,hi]:  p + (a0-p)ff >= lo  and  p + (a1-p)ff <= hi
      const pMax = (a0 * ff - lo) / (ff - 1), pMin = (a1 * ff - hi) / (ff - 1);
      return pMin <= pMax ? Math.min(pMax, Math.max(pMin, mid)) : null;
    };
    for (let ff = f; ff > 1.004; ff = 1 + (ff - 1) * 0.6) {
      const py = axis(y0, y1, SF.y, SF.y + SF.h, H / 2, ff), px = axis(x0, x1, SF.x, SF.x + SF.w, W / 2, ff);
      if (py != null && px != null) return { f: ff, px, py };
    }
    return { f: 1, px: W / 2, py: H / 2 };
  }
  function lerp(a, b, e) { return a + (b - a) * e; }
  function camLerp(A, B, e) {
    // zoom in log space so big zooms feel linear; keep the centre path weighted towards the
    // tighter shot so a zoom-through stays locked on its target
    const ls = lerp(Math.log(A.s), Math.log(B.s), e);
    const s = Math.exp(ls);
    const wgt = A.s === B.s ? e : (1 / A.s - 1 / s) / (1 / A.s - 1 / B.s);
    const k = Math.max(0, Math.min(1, isFinite(wgt) ? wgt : e));
    return { s, cx: lerp(A.cx, B.cx, k), cy: lerp(A.cy, B.cy, k) };
  }
  /** keys: [{t0, t1, from:cam, to:cam, ease}] sorted; between keys the camera holds. */
  Wd.camKeys = [];
  Wd.cameraAt = function (t) {
    const K = Wd.camKeys;
    if (!K.length) return { s: 1, cx: W / 2, cy: H / 2 };
    if (t <= K[0].t0) return K[0].from;
    for (let i = 0; i < K.length; i++) {
      const k = K[i];
      if (t < k.t0) return K[i - 1] ? K[i - 1].to : k.from;
      if (t <= k.t1) { const p = k.t1 > k.t0 ? (t - k.t0) / (k.t1 - k.t0) : 1; return camLerp(k.from, k.to, k.ease(p)); }
    }
    return K[K.length - 1].to;
  };
  function applyCam(c) {
    const tx = W / 2 - c.cx * c.s, ty = H / 2 - c.cy * c.s;
    Wd.world.style.transform = `translate(${tx.toFixed(3)}px, ${ty.toFixed(3)}px) scale(${c.s.toFixed(6)})`;
    Wd.__cam = { tx, ty, s: c.s };
    for (const L of Wd.parallax) L.el.style.transform = `translate(${(tx * L.f).toFixed(2)}px, ${(ty * L.f).toFixed(2)}px)`;
  }
  Wd.parallax = [];

  /* ---------------- ambient field (style-driven, period-locked, deterministic) ---------------- */
  Wd.buildAmbient = function (duration) {
    // a lesson may override the pack's ambient field (storyboard `ambient`, merged over the pack's)
    const AMB = Object.assign({}, S().pack.ambient || {}, (Loom.manifest && Loom.manifest.ambient) || {});
    const kind = AMB.kind || "none";
    const rng = Loom.rng("ambient:" + kind);
    const mk = (f) => { const d = Loom.html("div", { style: "position:absolute;left:-2000px;top:-2000px;width:24000px;height:12000px" }, Wd.ambient); const sv = Loom.svg("svg", { width: 24000, height: 12000, viewBox: "-2000 -2000 24000 12000" }, d); Wd.parallax.push({ el: d, f }); return sv; };
    const dens = AMB.density || 1;
    if (kind === "stars") {
      const layers = [[0.05, 1.4, 0.35, 900], [0.14, 2.4, 0.6, 260]];
      const tw = [];
      for (const [f, sz, op, n] of layers) {
        const sv = mk(f);
        for (let i = 0; i < n * dens; i++) {
          const c = Loom.svg("circle", { cx: rng() * 22000 - 1000, cy: rng() * 10000 - 1000, r: sz * (0.5 + rng()), fill: S().c("ink"), opacity: (op * (0.4 + 0.6 * rng())).toFixed(2) }, sv);
          if (i % 7 === 0) tw.push({ c, base: +c.getAttribute("opacity"), ph: rng() * 6.283, per: 3 + Math.floor(rng() * 4) });
        }
      }
      Loom.clock((t) => { for (const s of tw) s.c.setAttribute("opacity", (s.base * (0.55 + 0.45 * Math.cos((t / s.per) * 6.283 + s.ph))).toFixed(3)); });
    } else if (kind === "dots" && AMB.nodes !== "each") {
      // one tiled pattern, not one circle per dot: the grid is regular, so a 48 px tile with one dot draws the same
      // picture. Drawn dot by dot it was 95,931 circles (https-private, 2026-10-10), and every browser step that walks
      // the page paid for them: HyperFrames' layout audit took 8 to 13 s a sample instead of 0.2 s, a check 13 minutes
      // (docs/research/2026-10-10-why-checks-are-slow.md). `ambient.nodes: "each"` keeps the old drawing.
      const sv = mk(0.08);
      const id = "lm-amb-dots";
      const pat = Loom.svg("pattern", { id, x: -1024, y: -1024, width: 48, height: 48, patternUnits: "userSpaceOnUse" }, Loom.svg("defs", {}, sv));
      Loom.svg("circle", { cx: 24, cy: 24, r: 2.2, fill: S().c("line"), opacity: 0.22 }, pat);
      // the dots ran from -1000 to 20984 (x) and to 8984 (y): the rect covers exactly those cells
      Loom.svg("rect", { x: -1024, y: -1024, width: 459 * 48, height: 209 * 48, fill: `url(#${id})` }, sv);
    } else if (kind === "paper" || kind === "dots") {
      const sv = mk(kind === "dots" ? 0.08 : 0.02);
      const step = kind === "dots" ? 48 : 22;
      if (kind === "paper" && AMB.nodes !== "each") {
        // the specks keep their seeded places and sizes, drawn as ONE path (one element instead of about 82,000;
        // they share fill and opacity); `ambient.nodes: "each"` keeps one circle per speck
        let d = "";
        const f = (v) => +v.toFixed(3);
        for (let y = -1000; y < 9000; y += step) for (let x = -1000; x < 21000; x += step) {
          if (rng() > 0.18) continue;
          const cx = x + rng() * step, cy = y + rng() * step, r = 0.9 + rng() * 1.2;
          d += `M${f(cx - r)} ${f(cy)}a${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0a${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0`;
        }
        Loom.svg("path", { d, fill: S().c("muted"), opacity: 0.10 }, sv);
      } else for (let y = -1000; y < 9000; y += step) for (let x = -1000; x < 21000; x += step) {
        if (kind === "paper" && rng() > 0.18) continue;
        Loom.svg("circle", { cx: x + (kind === "paper" ? rng() * step : 0), cy: y + (kind === "paper" ? rng() * step : 0), r: kind === "dots" ? 2.2 : 0.9 + rng() * 1.2, fill: S().c(kind === "dots" ? "line" : "muted"), opacity: kind === "dots" ? 0.22 : 0.10 }, sv);
      }
    } else if (kind === "grid") {
      const sv = mk(0.1);
      for (let x = -1000; x < 21000; x += 80) Loom.svg("line", { x1: x, y1: -1000, x2: x, y2: 9000, stroke: S().c("line"), "stroke-width": x % 400 === 0 ? 1.6 : 0.8, opacity: 0.16 }, sv);
      for (let y = -1000; y < 9000; y += 80) Loom.svg("line", { x1: -1000, y1: y, x2: 21000, y2: y, stroke: S().c("line"), "stroke-width": y % 400 === 0 ? 1.6 : 0.8, opacity: 0.16 }, sv);
    }
    // vignette / glow washes are style data too
    const wash = AMB.wash;
    if (wash) Loom.html("div", { style: `position:absolute;inset:0;background:${wash};pointer-events:none` }, Wd.field);
    void duration;
  };

  /* ---------------- scenes ---------------- */
  class SceneRec {
    constructor(def, beat, index) { this.def = def; this.beat = beat; this.index = index; this.els = []; this.station = def.station; }
    register(E) { E.order = this.els.length; this.els.push(E); Loom.report.elements.push({ beat: this.beat.id, name: E.name, kind: E.kind, get revealT() { return E.revealT; }, get exitT() { return E.exitT; }, get exitKind() { return E.exitKind || null; }, get lifeT() { return E.lifeT || null; }, get heldBy() { return E.heldBy || []; }, get partId() { return E.partId || null; } }); }
  }
  Wd.sceneRecs = [];

  function makeCtx(rec, manifest) {
    const beat = rec.beat;
    const st = Wd.stations[rec.def.station];
    const g = Loom.svg("g", { class: "lm-scene", "data-beat": beat.id }, st.svg);
    const cues = (manifest.cues || {})[beat.id] || {};
    const prevRec = Wd.sceneRecs[rec.index - 1];
    const ctx = {
      beat, def: rec.def, props: rec.def.props || {}, station: st, g, box: Object.assign({}, Loom.kit.SAFE),
      kit: Loom.kit, m: Loom.motion, style: S(), c: (t) => S().c(t),
      start: beat.start, end: beat.end, speechStart: beat.speech_start, speechEnd: beat.speech_end,
      cue(anchor, lead) {
        const key = String(anchor);
        if (!(key in cues)) { Loom.error("cue_unresolved", `beat ${beat.id}: cue "${key}" was not resolved by compose`, { beat: beat.id }); return beat.speech_start; }
        const t = cues[key] - (lead == null ? ((manifest.grid && manifest.grid.cue_lead) != null ? manifest.grid.cue_lead : 0.08) : lead);
        Loom.report.cues.push({ beat: beat.id, anchor: key, t: cues[key] });
        return t;
      },
      has(anchor) { return String(anchor) in cues; },
      // the timing grid (D-173, runtime/grid.js): named hits, bar lines and music beats the mix shares
      // the style's engine (D-175, runtime/engines.js): its api, or null with an error when the style has none
      get engine() {
        const e = Loom.engines && Loom.engines.current();
        if (!e) { Loom.error("engine_missing", `beat ${beat.id}: the style "${(S().pack || {}).id}" has no engine (runtime/engines/<style id>.js)`, { beat: beat.id }); return null; }
        return e.api;
      },
      hit(id) { return Loom.grid.hit(id); },
      bar(t, dir) { return Loom.grid.bar(t, dir); },
      onBeat(t, sub) { return Loom.grid.onBeat(t, sub); },
      at(f) { return beat.speech_start + f * (beat.speech_end - beat.speech_start); },
      phrase(i) { return beat.phrases[i]; },
      word(i, j) { return beat.phrases[i].words[j]; },
      el(name, o) {
        // `parent` is a DOM group (an element's .inner). An element object passed whole drew into nothing and threw
        // "appendChild is not a function" with no beat (bench claude-balanced b17, 2026-10-07): take its .inner.
        // a held element is THE thing on screen: a new one under its name is a second copy over it, and the next beat's
        // held(name) could take either (https-private-relay b04, b07, b11, b12 drew a new "board" over the held one)
        const dup = rec.def.kind === "bespoke" && (rec.claimedFrom || []).find((E) => E.name === name && E.outer && E.outer.isConnected);
        if (dup) {
          Loom.error("kept_element_redrawn", `${beat.id}: ctx.el("${name}") draws a new element under the name of the one it holds from ${dup.beat}, ` +
            `which is still on screen: change the held one (ctx.held("${name}")` + (dup.handle ? `.handle.setState(state, t), its ${dup.partId} part` : ", draw into its .inner") +
            `) and never draw it again; a new thing takes a new name`, { beat: beat.id });
        }
        let par = (o && o.parent) || g;
        if (par && !par.appendChild) {
          if (par.inner && par.inner.appendChild) par = par.inner;
          else throw new Error(`${beat.id}: ctx.el("${name}") parent is not a DOM group: pass an element's .inner (or the element itself)`);
        }
        return Loom.kit.element(par, name, o);
      },
      /** reuse a library component: ctx.use("cause_card", { label: "...", icon: "flask" }, { x, y, name }) */
      use(ref, params, opts) { return Loom.useComponent(ctx, ref, params, opts); },
      /** a layout group: build a block inside it, measure, then ctx.shift(grp, dx, dy) before play */
      group() { return Loom.svg("g", { class: "lm-block" }, g); },
      shift(grp, dx, dy) { grp.setAttribute("transform", `translate(${dx} ${dy})`); },
      /** claim an element from the previous scene on the SAME station: it is held (no animation). An element a kit part
       *  drew carries that part's handle: ctx.held(name).handle.setState(state, t) drives the same drawing. */
      held(name) {
        if (!prevRec || prevRec.def.station !== rec.def.station) { Loom.error("held_needs_same_station", `${beat.id}: held("${name}") but previous scene is on another station`); return null; }
        // each element once: a held element is in the previous scene's els AND its claimedFrom, and the case match below
        // counted it twice and refused it a beat later (claude fork b03 held "Dev" from b02, 2026-10-07)
        const pool = [...new Set(prevRec.els.concat(prevRec.claimedFrom || []))];
        let E = pool.find((e) => e.name === name);
        if (!E) {
          // names differ only in case: "Priya" held where the beat before drew "priya" (bench claude-balanced b02/b03,
          // 2026-10-07): take it, and say so, so the author can make the names agree
          const lc = String(name).toLowerCase(), alt = pool.filter((e) => String(e.name).toLowerCase() === lc);
          if (alt.length === 1) { E = alt[0]; Loom.warn("held_name_case", `${beat.id}: held("${name}") took "${E.name}" (the names differ only in case); use the same name`, { beat: beat.id }); }
        }
        if (!E) { Loom.error("held_missing", `${beat.id}: no element "${name}" in previous scene`); return null; }
        E.claimed = true; (rec.claimedFrom = rec.claimedFrom || []).push(E); rec.els.push(E);
        // the beats that held it (keep or ctx.held), on its record: the film audit read only the storyboard's keep, so a
        // scene's own ctx.held read as "lingering" (B5, 2026-10-08)
        (E.heldBy = E.heldBy || []).push(beat.id);
        // what the earlier beat drew in it, as it is now: Wd.auditHeld checks after this beat's build that it is all still
        // there and not hidden (L-372)
        if (E.inner && !(rec.heldSnap || []).some((s) => s.E === E)) {
          (rec.heldSnap = rec.heldSnap || []).push({ E, kids: Array.from(E.inner.childNodes), display: E.outer ? E.outer.style.display : "" });
        }
        return E;
      },
      /** a world-level motif (can travel between stations). pos in THIS station's local coords. */
      motif(name, o) {
        const w = Wd.toWorld(rec.def.station, { x: o.x || 0, y: o.y || 0, w: 1, h: 1 });
        const E = Loom.kit.element(Wd.motifSvg, name, { x: 0, y: 0, w: o.w, h: o.h, kind: "motif" });
        E.__pos = { x: w.x, y: w.y, s: st.ws * (o.scale || 1) };
        E.mover.setAttribute("transform", `translate(${w.x} ${w.y}) scale(${E.__pos.s})`);
        // placed by its transform attribute only: travel writes the same matrix directly (L-166), so GSAP never owns it
        Wd.motifs[name] = E;
        E.motif = true;
        return E;
      },
      /** take over an existing motif (by name). travelTo moves it (world coords computed from this station). */
      adopt(name) {
        const E = Wd.motifs[name];
        if (!E) { Loom.error("motif_missing", `${beat.id}: adopt("${name}") before it was created`); return null; }
        E.claimed = true; (rec.claimedFrom = rec.claimedFrom || []).push(E);
        (E.heldBy = E.heldBy || []).push(beat.id);
        return E;
      },
      /** a rigged 2D character that acts (rig.js): ctx.character(name, rigId, {x, y (feet), scale, skin, top, bottom, hair}) */
      character(name, rigId, o) { return Loom.rig.place(ctx, name, rigId, o); },
      /** a 2.5D depth stage (depth.js) and the isometric kit (iso.js) */
      depth(name, o) { return Loom.depth.stage(ctx, name, o); },
      iso(o) { return Loom.iso.plane(ctx, o); },
      /** a set that fills the frame (scenery.js): ctx.scenery("room" | "stage" | "street", name, o) -> {E, floorY} */
      scenery(kind, name, o) {
        const fn = Loom.scenery[kind];
        if (!fn || ["desk", "sign", "crowd", "narrationCard"].includes(kind)) { Loom.error("scenery_missing", `${beat.id}: no scenery "${kind}" (have: room, stage, street)`); return null; }
        return fn(ctx, name, o);
      },
      /** grey background extras in rows (scenery.js + rigs/beans.js "extra") */
      crowd(name, o) { return Loom.scenery.crowd(ctx, name, o); },
      /** a black turn card typed in at t (scenery.js); returns when the line is complete */
      narrationCard(name, text, t, o) { return Loom.scenery.narrationCard(ctx, name, text, t, o); },
      /** a Lottie animation as an element, driven by the timeline and re-coloured to tokens (lottie.js) */
      lottie(name, id, o) { return Loom.lottie.place(ctx, name, id, o); },
      /** a timed screen-space moment (fx.js): "light" sweeps across the rect, "spotlight" dims everything
       *  else. rect is in THIS station's coordinates; it is placed with the camera as it is at t0. */
      fxMoment(kind, t0, t1, rect) {
        const r = rect || [ctx.box.x, ctx.box.y, ctx.box.w, ctx.box.h];
        const wr = Wd.toWorld(rec.def.station, { x: r[0], y: r[1], w: r[2], h: r[3] });
        // The screen rect is resolved when it is READ (draw time), not here: scenes are built before planJoins fills
        // the camera keys, so cameraAt(t0) was the identity at build time and a station away from the world origin
        // got a hole off screen while the spotlight dimmed the whole frame (2026-10-07). Same camera-at-t0 contract.
        (manifest.fx_moments = manifest.fx_moments || []).push({
          kind, t0, t1, beat: beat.id, worldRect: [wr.x, wr.y, wr.w, wr.h],
          get rect() {
            const c = Wd.cameraAt(t0); const s = c.s, tx = W / 2 - c.cx * s, ty = H / 2 - c.cy * s;
            return [wr.x * s + tx, wr.y * s + ty, wr.w * s, wr.h * s];
          },
        });
        return t1;
      },
      travelTo(E, o, t, dur) {
        const w = Wd.toWorld(rec.def.station, { x: o.x || 0, y: o.y || 0, w: 1, h: 1 });
        return Loom.motion.travel(E, t, { x: w.x, y: w.y, scale: st.ws * (o.scale || 1), dur });
      },
    };
    // ctx.engine is read only when a scene asks for it: a recipe that copies ctx (Object.assign) must not read it, or a
    // style with no engine logs engine_missing for a scene that never used one
    Object.defineProperty(ctx, "engine", { enumerable: false });
    return ctx;
  }

  Wd.BP_BLUR = 9;   // px of blur on the picture under a backplated template (L-229)
  Wd.buildScene = function (def, manifest, index) {
    const beat = manifest.beats.find((b) => b.id === def.beat);
    if (!beat) { Loom.error("scene_unknown_beat", def.beat); return; }
    const rec = new SceneRec(def, beat, index);
    Wd.sceneRecs.push(rec);
    Loom.ctxScene = rec; Loom.ctxBeat = beat;
    const ctx = makeCtx(rec, manifest);
    rec.ctx = ctx;
    // storyboard-level continuity: elements named in `keep` stay exactly where they are (held)
    const kept = (def.keep || []).map((name) => ctx.held(name)).filter(Boolean);
    // storyboard-level fx moments: {kind: light|spotlight, at: "spoken words", dur, rect} (D-52)
    for (const mo of def.fx || []) {
      const t0 = mo.at ? ctx.cue(mo.at) : ctx.speechStart;
      ctx.fxMoment(mo.kind || "light", t0, t0 + (mo.dur || 1.2), mo.rect);
    }
    // D-100: a template that continues on a station whose last scene drew a world (not a template) gets a backplate
    // first, so its words never sit on a busy picture (phishing b14 recap over the building, b37 list over the room;
    // L-172). `keep` (the author builds on what is held) or props.backplate === false opts out.
    const prevRec = Wd.sceneRecs[Wd.sceneRecs.length - 2];
    // With `keep` the held world stays visible but steps back (a dim veil), so the template still reads.
    // A template that follows a template which drew INTO the picture (its own backplate off) and keeps that picture
    // needs the veil too: without it its words print over the held page (quick-question-cost b05 over b04's page,
    // 2026-10-06). Only names that RESOLVED to an element count as kept (a misspelt keep is an error, not a picture).
    // Any template that KEEPS something a template drew is backplated too, also when that template was itself
    // backplated: openai fork b10 kept b08's dark page through b09 and drew its panels on the bare card (b10, b11,
    // b12, b49, 2026-10-08). The kept part is veiled (0.94 for words) and blurred, never shown bare under new words.
    const prevWasPicture = !["template", "avatar"].includes(prevRec ? prevRec.def.kind : "template")
      || (prevRec && prevRec.def.kind === "template" && kept.length > 0);
    const backplated = def.kind === "template" && prevRec && prevRec.def.station === def.station
        && !(def.props && def.props.backplate === false) && prevWasPicture;
    // The lighter 0.82 veil is for a held PICTURE only. A held page, card or line of words (anything a template built,
    // or a word/annotation kind) under a 0.82 veil printed through the new template at 18%: words over words
    // (bench ghost veil, 2026-10-07). Then the full 0.94 veil.
    const TEXTLIKE = { text: 1, card: 1, page: 1, panel: 1, row: 1, label: 1, tag: 1, chapter: 1, bubble: 1, quote: 1, token: 1, value: 1, data: 1, thought: 1 };
    const textLike = (E) => !!(TEXTLIKE[E.kind] || (E.scene && E.scene.def && E.scene.def.kind === "template"));
    const veil = kept.length && !kept.some(textLike) ? 0.82 : 0.94;
    // The picture under a backplate is BLURRED as well as veiled (L-229: a 0.8 veil alone left quick-question-cost's
    // page lines and unit grid readable through the definition and list cards, words over words). ONE blur filter per
    // scene group, raised only while a LATER backplate covers that group. A single shared filter per station put the
    // blur on every earlier group statically, so a second backplated beat blurred the first one's words for its whole
    // own window (bench self-blur, 2026-10-07). The raised filters of a station are lowered together when a beat that
    // is not a backplated template on that station takes over.
    const stn = Wd.stations[def.station];
    if (prevRec && prevRec.blurOn && !(backplated && prevRec.def.station === def.station)) {
      const pst = Wd.stations[prevRec.def.station];
      for (const F of pst.__bpRaised || []) Loom.tween(F, { attr: { stdDeviation: Wd.BP_BLUR } }, { attr: { stdDeviation: 0 }, duration: 0.3, ease: Loom.ease.exit }, Math.max(0, beat.start - 0.05), { kind: "exit", beat: beat.id, name: "backplate_unblur" });
      pst.__bpRaised = [];
      for (const w of Wd.bpCover || []) if (w.st === prevRec.def.station && w.b == null) w.b = beat.start + 0.3;
    }
    if (backplated) {
      const bp = ctx.el("template_backplate", { x: -400, y: -400, w: 2720, h: 1880, kind: "scenery", exit: "recede" });
      Loom.svg("rect", { x: 0, y: 0, width: 2720, height: 1880, fill: S().c("field"), opacity: veil }, bp.inner);
      Loom.tween(bp.inner, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: Loom.ease.enter }, Math.max(0, beat.start - 0.05), { kind: "reveal", beat: beat.id, name: "template_backplate" });
      rec.backplate = true;
      if (!stn.__bpDefs) stn.__bpDefs = Loom.svg("defs", {}, stn.svg);
      stn.__bpRaised = stn.__bpRaised || [];
      for (const r of Wd.sceneRecs) {
        if (r === rec || r.def.station !== def.station || !r.ctx) continue;
        if (!r.bpBlur) {
          const fid = Loom.uid("lmbpblur");
          const filt = Loom.svg("filter", { id: fid, x: "-5%", y: "-5%", width: "110%", height: "110%" }, stn.__bpDefs);
          r.bpBlur = Loom.svg("feGaussianBlur", { stdDeviation: 0 }, filt);
          // attached by Wd.planCover's clock inside the cover window only: a group carrying the filter for the whole
          // film stopped painting in HyperFrames' capture once the camera zoomed in (https-private-relay's b01 group,
          // with the board held to 88 s, vanished from b02's push on while the DOM said visible, 2026-10-12)
          r.ctx.g.__bpFilter = `url(#${fid})`;
        }
        if (!stn.__bpRaised.includes(r.bpBlur)) {
          Loom.tween(r.bpBlur, { attr: { stdDeviation: 0 } }, { attr: { stdDeviation: Wd.BP_BLUR }, duration: 0.35, ease: Loom.ease.enter }, Math.max(0, beat.start - 0.05), { kind: "reveal", beat: beat.id, name: "backplate_blur" });
          stn.__bpRaised.push(r.bpBlur);
          (Wd.bpCover = Wd.bpCover || []).push({ g: r.ctx.g, st: def.station, a: Math.max(0, beat.start - 0.05), b: null });
        }
      }
      rec.blurOn = true;
    }
    try {
      if (def.kind === "template") {
        const T = Loom.templates[def.template];
        if (!T) Loom.error("unknown_template", def.template, { beat: beat.id });
        else T.build(ctx, Object.assign({}, T.defaults || {}, def.props || {}));
      } else if (def.kind === "blueprint") {
        const B = Loom.blueprints[def.blueprint];
        if (!B) Loom.error("unknown_blueprint", def.blueprint, { beat: beat.id });
        else B.build(ctx, Object.assign({}, B.defaults || {}, def.props || {}));
      } else if (def.kind === "bespoke") {
        const sc = Loom.scenes[def.scene || beat.id];
        if (!sc) Loom.error("bespoke_scene_missing", def.scene || beat.id, { beat: beat.id });
        else sc.build(ctx, def.props || {});
      } else if (def.kind === "redtee") {
        Loom.redtee.scene(ctx, def);
      } else if (def.kind === "avatar") {
        Loom.presenter.scene(ctx, def.props || {});
      } else if (def.kind === "manim" || def.kind === "skia" || def.kind === "three" || def.kind === "page" || def.kind === "media") {
        Loom.media.scene(ctx, def);
        if (def.props && def.props.overlay_template) {
          const T = Loom.templates[def.props.overlay_template]; if (T) T.build(ctx, def.props.overlay || {});
        }
      } else Loom.error("unknown_scene_kind", def.kind, { beat: beat.id });
    } catch (err) {
      const em = String(err && err.message);
      Loom.error("scene_threw", em.startsWith(`${beat.id}:`) ? em : `${beat.id}: ${em}`, { beat: beat.id, stack: String(err && err.stack).slice(0, 600) });
      rec.broken = true;
      // Never a silent frozen beat: a scene that threw before drawing anything of its own (the backplate does not
      // count) gets a plain card of its own spoken words (the narration itself, so nothing is invented). The error
      // stays an ERROR, so check and render still refuse it; the card only makes every preview show WHERE it broke
      // (bench claude b03/b17, openai b02 held the previous picture for the whole beat, 2026-10-07).
      const drew = rec.els.some((E) => E.name !== "template_backplate" && !(rec.claimedFrom || []).includes(E));
      if (!drew) {
        try {
          const words = (beat.phrases || []).map((p) => p.text || "").join(" ").split(/\s+/).filter(Boolean).slice(0, 14).join(" ");
          // inside what this beat's camera shows: a bespoke beat's focus (or zoom) frames part of the station, and a
          // card across the safe area was cropped by it (openai fork b02, 2026-10-07: 29 % off the frame)
          const sh = (def && def.shot) || {};
          const fo = Array.isArray(sh.focus) && sh.focus.length === 4 ? sh.focus
            : (sh.zoom && sh.zoom > 1 ? [W / 2 - W / (2 * sh.zoom), H / 2 - H / (2 * sh.zoom), W / sh.zoom, H / sh.zoom] : null);
          const cb = fo ? { x: fo[0] + 0.06 * fo[2], y: fo[1] + 0.3 * fo[3], w: 0.88 * fo[2], h: 0.4 * fo[3] }
            : { x: ctx.box.x, y: ctx.box.y + 260, w: ctx.box.w, h: 300 };
          const F = ctx.el("scene_error_fallback", { x: cb.x, y: cb.y, w: cb.w, h: cb.h, kind: "text", exit: "recede" });
          if (words) Loom.kit.text(F.inner, words, { role: "title", x: 0, y: 0, w: cb.w, h: cb.h, align: "center", valign: "middle" });
          Loom.motion.reveal(F, beat.speech_start);
          rec.fallback = true;
        } catch (e2) { Loom.error("scene_fallback_threw", `${beat.id}: ${e2 && e2.message}`, { beat: beat.id }); }
      }
    }
    Wd.auditHeld(rec);
    Wd.auditParts(rec);
    Loom.report.scenes.push({ beat: beat.id, kind: def.kind, template: def.template || def.blueprint || def.scene || null, station: def.station, elements: rec.els.length });
    Loom.ctxScene = null; Loom.ctxBeat = null;
    return rec;
  };

  /* One drawing per thing. A beat that holds an element a kit part drew, and draws the same part again while the held one
   * still shows, puts two of the thing on screen: https-private-relay (2026-10-12) held b01's board to 87 s while seven
   * beats drew their own board over it, in other states (the doubled words, the piled tags, a line into a packet). What
   * each call DREW is compared (its nodes' boxes in the owner's place), not the elements' declared boxes: gps-position
   * b15 drew one satellite's circle per full-frame layer, and the declared boxes read 100 % (a false copy). Two drawings
   * of one part covering nearly the same region (at least 60 % of their union) is an error; anywhere else, or not
   * measurable, a warning; after the held one has left it is a hand-over and fine. */
  Wd.auditParts = function (rec) {
    const held = (rec.claimedFrom || []).filter((E) => E.partId && E.outer && E.outer.isConnected);
    if (!held.length || !rec.parts) return;
    const top = (E) => E.outer.parentNode && E.outer.parentNode.classList && E.outer.parentNode.classList.contains("lm-scene");
    // the drawn region in the station's coordinates: the nodes' boxes through their transforms up to the owner's inner,
    // then the owner's place (the mover and life groups above inner carry entrance from-states and are left out)
    const drawn = (E, nodes) => {
      if (!top(E) || !nodes || !nodes.length) return null;
      try {
        const inv = E.inner.getCTM().inverse();
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const n of nodes) {
          if (!n.getBBox || !n.getCTM) continue;
          const bb = n.getBBox(), cm = n.getCTM();
          if (!cm || !(bb.width || bb.height)) continue;
          const m = inv.multiply(cm);
          for (const [px, py] of [[bb.x, bb.y], [bb.x + bb.width, bb.y], [bb.x, bb.y + bb.height], [bb.x + bb.width, bb.y + bb.height]]) {
            const X = m.a * px + m.c * py + m.e, Y = m.b * px + m.d * py + m.f;
            x0 = Math.min(x0, X); y0 = Math.min(y0, Y); x1 = Math.max(x1, X); y1 = Math.max(y1, Y);
          }
        }
        return x1 > x0 && y1 > y0 ? { x: E.x + x0, y: E.y + y0, w: x1 - x0, h: y1 - y0 } : null;
      } catch (e) { return null; }
    };
    const seen = new Set();
    for (const p of rec.parts) {
      const N = p.owner;
      if (!N || held.includes(N) || seen.has(N)) continue;
      for (const E of held) {
        if (E.partId !== p.id || (E.exitT != null && N.revealT != null && E.exitT + 0.05 <= N.revealT)) continue;
        seen.add(N);
        const A = drawn(E, E.partNodes), B = drawn(N, p.nodes);
        let ov = null;
        if (A && B) {
          const ix = Math.max(0, Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x)), iy = Math.max(0, Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y));
          const inter = ix * iy;
          ov = inter / (A.w * A.h + B.w * B.h - inter);
        }
        const what = `${rec.beat.id}: draws kit part "${p.id}" again as "${N.name}" while it holds "${E.name}" (the ${p.id} ${E.beat} drew, still on screen)`;
        if (ov != null && ov >= 0.6) {
          Loom.error("part_drawn_twice", `${what}, over it (the two drawings share ${Math.round(ov * 100)} % of their area): drive the held one with ` +
            `ctx.held("${E.name}").handle.setState(state, t) on your own time, or exit it before the new one appears; never a second copy`, { beat: rec.beat.id });
        } else {
          Loom.warn("part_drawn_again", `${what}, ` + (ov == null ? "drawings not comparable (nested, or nothing measurable)" : "elsewhere on screen") +
            `: a second ${p.id} is fine only when the film shows two; to change the held one use ctx.held("${E.name}").handle`, { beat: rec.beat.id });
        }
        break;
      }
    }
  };

  /* A held element is SHARED with the beats before: whatever a scene does to it at load (outside the timeline) changes
   * those beats' frames too. feedback-shuttle-v3 (2026-10-09, L-372): b05, b08 and b09 hid held elements at load
   * (style.display) and b10 removed what b07 had drawn in its held card, clock and people, then drew its own copies:
   * b07's animations ran on drawings no longer on screen while b10's copy showed in b07's time (its vague bubble over the
   * card for the whole beat). The check passed it; the critic found it, and it took three storyboard reopens. Each
   * beat's holds are checked after its build: nothing the earlier beat drew in the element may be gone, and the element
   * may not be hidden at load. A change belongs on the beat's own time (a tween, or new children revealed then). */
  Wd.auditHeld = function (rec) {
    for (const h of rec.heldSnap || []) {
      const E = h.E, by = rec.beat.id, from = E.beat || "an earlier beat";
      const gone = h.kids.filter((n) => n.parentNode !== E.inner).length;
      if (gone) {
        Loom.error("held_content_removed", `${by}: "${E.name}" is held from ${from} and ${by} removed ${gone} of the ${h.kids.length} things ` +
          `${from} drew in it, at load: a held element is shared, so ${from}'s own frames lost them too (its animation then runs on ` +
          `nothing on screen). Add your change as new children revealed at your beat's time, or create a new element with its own name ` +
          `(and do not keep this one)`, { beat: by, name: E.name, from });
      }
      if (E.outer && E.outer.style.display === "none" && h.display !== "none") {
        // a warning: element lives are set on the timeline (planLife), so this does nothing on screen; the earlier copy
        // stays under the new one through this beat (seen in feedback-shuttle-v3's b08: both cards drawn in one place)
        Loom.warn("held_hidden_at_load", `${by}: "${E.name}" is held from ${from} and ${by} hid it at load (style.display): that does ` +
          `nothing (a held element shows for its whole life on the timeline), so ${from}'s copy stays under yours. Hide it at your ` +
          `beat's time (m.exit or a tween), or do not keep it and create your own element under a new name`, { beat: by, name: E.name, from });
      }
    }
  };

  /* ---------------- joins between scenes ---------------- */
  // material and motif joins (D-114: torn, page, scroll, motif, handoff, fill) are declared in runtime/material.js
  const MAT = (Loom.material && Loom.material.DUR) || {};
  const JOIN_DUR = Object.assign({ cut: 0, camera: 0.95, travel: 1.05, zoom: 1.25, canvas: 0.9, continue: 0, iris: 1.1, wipe: 0.9, dip: 1.0, fade: 0.8 }, MAT);
  // screen joins (D-90, CINEMA_PLAN B7): a screen-space cover hides the change; the camera jumps at its middle
  const SCREEN = Object.assign({ iris: 1, wipe: 1, dip: 1, fade: 1 }, ...Object.keys(MAT).map((k) => ({ [k]: 1 })));
  Wd.covers = [];
  Wd.planJoins = function (manifest) {
    const recs = Wd.sceneRecs;
    // the grid's join table wins (one table, loom/timing.py JOIN_DUR, D-173); the constants above serve older builds
    const JD = Object.assign({}, JOIN_DUR, (manifest && manifest.grid && manifest.grid.join_dur) || {});
    // Templates, blueprints, RedTee scenes and the presenter lay out in kit.SAFE of a FULL 1920x1080 station
    // (ctx.box): a focus or zoom on them crops their own layout (bench openai-balanced compare.two in 17 beats,
    // 2026-10-07). The framing is dropped and said; a push or pull (shot.move) still applies.
    const FRAME_LAYOUT = { template: 1, blueprint: 1, redtee: 1, avatar: 1 };
    const shots = recs.map((r) => {
      const sh = Object.assign({ station: r.def.station }, r.def.shot || {});
      if (FRAME_LAYOUT[r.def.kind] && (sh.focus || (sh.zoom && sh.zoom !== 1))) {
        Loom.warn("shot_framing_ignored", `${r.beat.id}: shot.focus/zoom ignored on a ${r.def.kind} beat (it lays out in the whole frame)`, { beat: r.beat.id });
        delete sh.focus; delete sh.zoom;
      }
      return sh;
    });
    // camera keys
    let prevCam = null;
    recs.forEach((r, i) => {
      const cam = camFor(shotRect(shots[i]));
      const beat = r.beat;
      const join = (r.def.join_in || {}).type || (i === 0 ? "cut" : S().pack.join_default || "camera");
      r.join = join;
      if (i === 0 || !prevCam) {
        Wd.camKeys.push({ t0: 0, t1: 0, from: cam, to: cam, ease: Loom.ease.linear });
      } else {
        const prevEnd = recs[i - 1].beat.speech_end + (recs[i - 1].beat.pause_after || 0);
        const d = (r.def.join_in && r.def.join_in.dur) || JD[join] || 0.9;
        if (join === "camera" || join === "travel" || join === "zoom") {
          const jw = r.def.join_window;
          const t0 = jw ? jw[0] : Math.max(prevEnd + 0.02, beat.start - d * 0.5);
          const t1 = jw ? jw[1] : t0 + d;
          Wd.camKeys.push({ t0, t1, from: prevCam, to: cam, ease: Loom.ease.editorial });
          r.joinWindow = [t0, t1];
        } else if (SCREEN[join]) {
          const jw = r.def.join_window;
          const t0 = jw ? jw[0] : Math.max(prevEnd + 0.02, beat.start - d * 0.5);
          const t1 = jw ? jw[1] : t0 + d, mid = (t0 + t1) / 2;
          Wd.camKeys.push({ t0: mid, t1: mid, from: cam, to: cam, ease: Loom.ease.linear });
          r.joinWindow = [t0, t1];
          Wd.covers.push({ kind: join, t0, t1, mid, def: r.def.join_in || {}, beat: beat.id });
        } else {
          // cut / canvas / continue: camera jumps (or stays) at the boundary.
          // A cut happens when the new picture starts: cut at the boundary to a beat whose first drawing arrives later and
          // the frame is empty in between (st-holo-ai b10, b12, b16, b21: 0.3 to 1.1 s of nothing while the voice went on,
          // D-190). The cut waits for the new beat's first arrival (at most CUT_WAIT), and the old picture holds until then.
          let tc = beat.start;
          if (join === "cut") {
            const nf = Wd.firstArrival(r);
            if (nf != null && nf > beat.start + 0.1) tc = Math.min(nf, beat.start + Wd.CUT_WAIT);
          }
          Wd.camKeys.push({ t0: tc, t1: tc, from: cam, to: cam, ease: Loom.ease.linear });
          r.joinWindow = [tc, tc];
        }
      }
      // one optional camera move INSIDE the scene (lnd-motion-craft: at most one per scene)
      const mv = (r.def.shot || {}).move;
      if (mv === "push" || mv === "pull") {
        const a = (r.joinWindow ? r.joinWindow[1] : beat.start) + 0.1;
        const b = a + Math.min(6, (beat.speech_end - a) * 0.6);
        let f = mv === "push" ? 1.05 : 1 / 1.05;
        // a push scales about the frame centre, which drives top-aligned content up into the section
        // chrome (and bottom content into the captions). Pivot so the scene's content stays inside the
        // safe box; if no pivot can, push less.
        const piv = pushPivot(r, cam, f);
        f = piv.f;
        const to = { s: cam.s * f, cx: cam.cx + (piv.px - W / 2) / cam.s * (1 - 1 / f), cy: cam.cy + (piv.py - H / 2) / cam.s * (1 - 1 / f) };
        Wd.camKeys.push({ t0: a, t1: b, from: cam, to, ease: Loom.ease.editorial });
        prevCam = to;
      } else prevCam = cam;
    });
    Wd.camKeys.sort((a, b) => a.t0 - b.t0);
    // An element the camera (or a screen cover) carried away is out of frame, not gone: it stays on its station.
    // Once it is out of sight it is switched off, so a later beat that RETURNS to the station finds it empty
    // instead of printing over the old words (phishing-report b42 over b01, L-164). Motifs may be taken over later.
    // kinds that are words or annotations ON a picture (they leave before a camera move); everything else is the
    // picture itself and is carried away by the camera
    const ANNOT = { text: 1, card: 1, token: 1, row: 1, icon: 1, mark: 1, stamp: 1, connector: 1, chapter: 1, bubble: 1, label: 1, tag: 1, thought: 1, value: 1, data: 1 };
    const hideAfter = (els, t) => els.forEach((E) => { if (!E.motif && E.outer) Loom.set(E.outer, { opacity: 0 }, t); });
    // Parts drawn as their own elements (a label's lead line, a page's lines and highlight bars declared as
    // `E.followers`) leave WITH their leader: Loom.motion.exit cascades to them. So a pass exits only the leaders and
    // skips their followers; exiting a follower again later restarted it from full opacity, and a follower on its own
    // stagger slot floated after its page had gone (document.page highlight bars 0.5 s, 2026-10-07).
    const partsOf = (E) => [E.lead].concat(E.followers || []).filter((F) => F && F !== E);
    const leadersOf = (own) => {
      const inOwn = new Set(own), led = new Set();
      for (const E of own) for (const F of partsOf(E)) if (inOwn.has(F)) led.add(F);
      // a cycle (A follows B follows A) must not leave both behind
      for (const E of own) if (led.has(E) && !own.some((L) => !led.has(L) && partsOf(L).includes(E))) led.delete(E);
      return own.filter((E) => !led.has(E));
    };
    Wd.resolveHeldExits(recs, SCREEN);
    // retiring elements: everything not claimed by the next scene leaves, in reading order
    recs.forEach((r, i) => {
      const next = recs[i + 1];
      const until = next ? next.beat.start : manifest.duration - 0.2;
      const speechEnd = r.beat.speech_end + (r.beat.pause_after || 0);
      // an element the scene already sent away (a lead with `hold`, an explicit exit) is not retired twice: a second
      // exit restarts from full opacity and flashes it back for a frame (D-100)
      const gone = (E) => E.exitT != null && E.exitKind !== "camera" && E.exitT < (next ? next.beat.start : manifest.duration);
      // a piece drawn inside an element the next scene holds (a kit part's browser, path and server inside the board)
      // rides with it: retiring it faded the held board's whole drawing at the join, leaving an empty frame that the DOM
      // reported as shown (https-private-relay run 2, 2026-10-12; the life clock half of this is in planLife)
      const insideHeld = (E) => {
        if (!next || !E.outer) return false;
        for (let o = E.outer.parentNode && E.outer.parentNode.closest ? E.outer.parentNode.closest(".lm-el") : null; o;
          o = o.parentNode && o.parentNode.closest ? o.parentNode.closest(".lm-el") : null) {
          if (o.__E && (next.claimedFrom || []).includes(o.__E)) return true;
        }
        return false;
      };
      const leavers = r.els.filter((E) => !gone(E) && !insideHeld(E) && (!E.claimed || (next && !(next.claimedFrom || []).includes(E))));
      const own = leavers.filter((E) => !E.motif || !next || !(next.claimedFrom || []).includes(E));
      const leaders = leadersOf(own);
      if (!next) {
        // final scene: the frame holds and leaves as one, with the camera's outro fade (boot.js). Each element used to
        // recede on its own from duration - 0.9, so the room and the people were gone while cards still floated on bare
        // paper and the last label drifted out alone (feedback-relay-v3's last half second, R-48). Every scene element
        // lives under the camera (lm-cam); the overlay holds only captions, the logo, section labels and fx.
        return;
      }
      const j = next.join;
      if (j === "camera" || j === "travel" || j === "zoom") {
        // the camera carries the old station out of frame: displacement is the exit for the PLACE. But the words
        // and annotations on it (titles, tags, bubbles, cards, chips) leave first, so they never ride a zoom or sit
        // over the move into the next picture (Kshitij, 2026-10-03; phishing b06 to b07, feedback b05 to b06, L-172).
        const jt0 = next.joinWindow ? next.joinWindow[0] : until;
        const lead = Math.max(speechEnd + 0.02, jt0 - 0.3);
        leaders.forEach((E) => {
          if (ANNOT[E.kind] && !E.motif) Loom.motion.exit(E, lead, "recede", { dur: Math.max(0.15, Math.min(0.3, jt0 + 0.1 - lead)) });
          else for (const X of [E].concat(partsOf(E))) if (X === E || X.exitT == null) { X.exitT = jt0; X.exitKind = "camera"; }
        });
        hideAfter(own, (next.joinWindow ? next.joinWindow[1] : until) + 0.05);
        return;
      }
      if (SCREEN[j]) {
        // a screen join: the cover IS the exit; everything stays put until the cover is closed
        const mid = next.joinWindow ? (next.joinWindow[0] + next.joinWindow[1]) / 2 : until;
        own.forEach((E) => { E.exitT = mid; E.exitKind = "camera"; });
        hideAfter(own, mid + 0.02);
        return;
      }
      if (j === "cut") {
        // a cut is one frame: the old picture holds to the cut (the new beat's first arrival, planJoins above) and is gone
        // on it. Exiting in reading order before the boundary emptied the frame for the length of the exits (D-190)
        const tc = next.joinWindow ? next.joinWindow[0] : until;
        own.forEach((E) => { if (!E.motif) { E.exitT = tc; E.exitKind = "camera"; } });
        hideAfter(own, tc);
        return;
      }
      // continue / canvas: per-element exits in reading order, before the boundary.
      // An old element the new beat draws AGAIN on the same spot (its own copy, not held) stays until the copy is in and
      // then fades under it: leaving first emptied the place and the same picture rebuilt from nothing, which read as the
      // old beat flashing back (st-sc-2fa b24 window, st-holo-ai b05 and b06 token rows; D-190)
      const swapped = new Set();
      for (const E of leaders) {
        const N = Wd.redrawOf(E, next);
        if (!N) continue;
        swapped.add(E);
        Loom.motion.exit(E, Math.max(until, N.revealT) + Wd.SWAP_HOLD, "fade", { dur: 0.2, planned: true });
        (Loom.report.swaps = Loom.report.swaps || []).push({ beat: next.beat.id, old: E.name, new: N.name, how: "redrawn" });
      }
      if (swapped.size) leaders.splice(0, leaders.length, ...leaders.filter((E) => !swapped.has(E)));
      const n = leaders.length;
      const exitDur = S().dur("exit");
      let t0 = Math.max(speechEnd + 0.02, until - 0.28 - exitDur - n * 0.05);
      // ...only when the new beat holds nothing: a held element already fills the frame, and waiting kept the rest of the
      // old picture (a crowd, a chair) up to 4 s into the next beat (claude fork b01 to b02, post-style proof)
      const holds = (next.claimedFrom || []).some((E) => !E.motif && E.outer && E.outer.isConnected);
      if (j === "continue" && !holds) {
        // the frame is never empty while the voice speaks: on a continue join the old elements finish leaving just after
        // the new beat's first element arrives (a short crossfade). They left before the boundary while the new beat's
        // structure waited for its lead, so speaking frames went blank (openai fork 3.4 % of speaking time, 2026-10-08)
        const arr = next.els.filter((E) => !(next.claimedFrom || []).includes(E) && E.name !== "template_backplate" && E.revealT != null);
        const nf = arr.length ? Math.min(...arr.map((E) => E.revealT)) : null;
        if (nf != null && nf > until) t0 = Math.max(t0, nf + 0.1 - exitDur - n * 0.05);
      } else if (j === "canvas" && !holds) {
        // a canvas join clears the board, but an empty board for a second reads as a dropped frame: the old picture
        // sank 0.4 s before the boundary and the new one arrived 0.8 s after it (st-holo-ai b07 to b08, 1.2 s of nothing
        // while the voice went on; D-190). The old one finishes sinking as the new one starts to arrive.
        const arr = next.els.filter((E) => !(next.claimedFrom || []).includes(E) && E.name !== "template_backplate" && E.revealT != null);
        const nf = arr.length ? Math.min(...arr.map((E) => E.revealT)) : null;
        if (nf != null && nf > until) t0 = Math.max(t0, nf - exitDur - n * 0.05);
      }
      // exit "none" / "held" means "no exit while the story continues". Nobody holds it past THIS join, so it leaves
      // like everything else; before, Loom.motion.exit returned with no tween and it stayed under every later beat on
      // the station (bench claude b17 board_slot_one, mixed b09/b11/b13, budget b14; L-165 asked authors to fix it).
      const kindOf = (E) => (E.exit && E.exit !== "none" && E.exit !== "held") ? E.exit : (j === "canvas" ? "sink" : "recede");
      leaders.forEach((E, k) => Loom.motion.exit(E, t0 + k * 0.05, kindOf(E)));
    });
    Wd.planLife(manifest);
    Wd.auditMotion(manifest);
  };

  /* ---------------- the motion audit (D-190) ----------------
   * Kshitij on the 2026-10-16 test films: "places where elements or things move - the motion is handled very awkwardly".
   * What the frames showed, as warnings for the scene's author and the critic:
   *  motion_two_at_once  two things travelling at once in one beat (st-holo-ai b22: a card in from the left while the
   *                      policy page slid right): the eye follows one mover; stagger them, the second after the first lands
   *  motion_crosses      an element sliding across another on its way (b21: the policy page through the chat window):
   *                      route it around, or let the other step aside first
   *  motion_shrinks_words a group with words shrunk below 70 % (b06: the token row squeezed until it could not be read):
   *                      frame it with the camera, or make room, instead of shrinking the words
   *  camera_restless     the camera moving for more than 60 % of a beat (st-iso-order b07, b17, b18 drifting across the
   *                      board): hold the frame while things happen, move between ideas */
  Wd.auditMotion = function (manifest) {
    const T = (Wd.travels || []).filter((q) => q.E && q.E.outer && q.E.outer.isConnected && q.t1 - q.t0 > 0.05);
    const said = new Set();
    const warn = (code, beat, msg) => { const k = code + beat; if (said.has(k)) return; said.add(k); Loom.warn(code, `${beat}: ${msg}`, { beat }); };
    const dist = (q) => Math.hypot(q.to.x - q.from.x, q.to.y - q.from.y);
    const isTopEl = (E) => !!(E.outer && E.outer.parentNode && E.outer.parentNode.classList && E.outer.parentNode.classList.contains("lm-scene"));
    const related = (a, b) => a === b || a.lead === b || b.lead === a || (a.followers || []).includes(b) || (b.followers || []).includes(a)
      || (a.outer && b.outer && (a.outer.contains(b.outer) || b.outer.contains(a.outer)));
    for (let i = 0; i < T.length; i++) {
      const a = T[i];
      if (dist(a) < 80 && Math.abs(a.to.s - a.from.s) < 0.1) continue;
      for (let j = i + 1; j < T.length; j++) {
        const b = T[j];
        if (b.beat !== a.beat || related(a.E, b.E) || (dist(b) < 80 && Math.abs(b.to.s - b.from.s) < 0.1)) continue;
        const ov = Math.min(a.t1, b.t1) - Math.max(a.t0, b.t0);
        // two parts of ONE gesture (they start and land together: a pair splitting, a group carried) are one mover
        if (Math.abs(a.t0 - b.t0) < 0.06 && Math.abs(a.t1 - b.t1) < 0.06) continue;
        if (ov > 0.3) warn("motion_two_at_once", a.beat, `"${a.E.name}" and "${b.E.name}" travel at once (${Math.max(a.t0, b.t0).toFixed(2)} to ` +
          `${Math.min(a.t1, b.t1).toFixed(2)} s): the eye follows one mover. Start the second as the first lands`);
      }
      if (a.to.s < 0.7 * a.from.s && a.E.inner && a.E.inner.querySelector("text"))
        warn("motion_shrinks_words", a.beat, `"${a.E.name}" shrinks to ${Math.round(100 * a.to.s / a.from.s)} % with its words in it (${a.t0.toFixed(2)} s): ` +
          "frame it with the camera or make room; never squeeze words to fit");
      // crossing: the element's box swept along its path over another element of the same station on screen then
      if (!isTopEl(a.E) || !(a.E.w > 0 && a.E.h > 0) || dist(a) < 120) continue;
      const st = a.E.scene && a.E.scene.def && a.E.scene.def.station;
      const boxAt = (u) => ({ x: a.E.x + a.from.x + (a.to.x - a.from.x) * u, y: a.E.y + a.from.y + (a.to.y - a.from.y) * u,
        w: a.E.w * (a.from.s + (a.to.s - a.from.s) * u), h: a.E.h * (a.from.s + (a.to.s - a.from.s) * u) });
      const over = (A, B) => Math.max(0, Math.min(A.x + A.w, B.x + B.w) - Math.max(A.x, B.x)) * Math.max(0, Math.min(A.y + A.h, B.y + B.h) - Math.max(A.y, B.y));
      for (const r of Wd.sceneRecs) {
        if (r.def.station !== st) continue;
        for (const O of r.els) {
          if (O === a.E || related(O, a.E) || !isTopEl(O) || !(O.w > 0 && O.h > 0) || O.kind === "scenery" || O.motif) continue;
          const life = O.lifeT || [0, Infinity];
          if (life[1] < a.t0 || life[0] > a.t1) continue;
          const ob = O.matchBox && O.matchBox.w > 0 ? O.matchBox : O, area = Math.min(ob.w * ob.h, a.E.w * a.E.h * Math.min(a.from.s, a.to.s));
          const s0 = over(boxAt(0), ob) / area, s1 = over(boxAt(1), ob) / area, mid = over(boxAt(0.5), ob) / area;
          if (mid > 0.25 && s0 < 0.1 && s1 < 0.1) warn("motion_crosses", a.beat, `"${a.E.name}" slides across "${O.name}" on its way ` +
            `(${a.t0.toFixed(2)} to ${a.t1.toFixed(2)} s): route it around, or let "${O.name}" step aside first`);
        }
      }
    }
    // the camera: world camera moves plus each engine's own camera moves, as a share of each beat
    const camT = (Loom.report.tweens || []).filter((x) => x.kind === "camera" && x.t1 - x.t0 > 0.05);
    const wcam = (Wd.camKeys || []).filter((k) => k.t1 - k.t0 > 0.05).map((k) => ({ t0: k.t0, t1: k.t1 }));
    for (const b of manifest.beats || []) {
      const len = b.end - b.start;
      if (len < 4) continue;
      const iv = camT.concat(wcam).map((x) => [Math.max(b.start, x.t0), Math.min(b.end, x.t1)]).filter(([u, v]) => v > u).sort((p, q) => p[0] - q[0]);
      let busy = 0, cur = null;
      for (const [u, v] of iv) { if (!cur || u > cur[1]) { if (cur) busy += cur[1] - cur[0]; cur = [u, v]; } else cur[1] = Math.max(cur[1], v); }
      if (cur) busy += cur[1] - cur[0];
      if (busy / len > 0.6) warn("camera_restless", b.id, `the camera moves for ${Math.round(100 * busy / len)} % of the beat: hold the frame while ` +
        "things happen and move between ideas (a move is a sentence, not the whole paragraph)");
    }
  };

  /* ---------------- held elements that their holder sends away (D-190) ----------------
   * A scene that holds an element (storyboard keep or ctx.held) and exits it at once never needed it: the hold took it
   * out of the join's exit. Under a screen join the cover closed on it, opened on it again and it left after
   * (st-sc-2fa b14: seven surfaces of b13 back for 0.4 s); on a continue join it receded while the scene's own copy built
   * from nothing (st-holo-ai b05, b06). Motion.exit defers such exits (rec.heldExits) and this resolves them:
   *  - an exit later than the beat's opening (settled join + SWAP_EARLY) is the scene's choice and is placed as written;
   *  - an earlier one RELEASES the hold, so the join retires the element as it retires everything else, except when the
   *    beat draws its own copy on the same spot (Wd.redrawOf): then the old one stays until the copy is in and fades
   *    under it (no empty frame, no rebuild from nothing). Under a screen join the cover is always the exit. */
  Wd.CUT_WAIT = 1.2;     // s a cut may wait past the boundary for the new beat's first drawing
  /** the time the beat's own first element (not held, not a backplate) starts to arrive, or null */
  Wd.firstArrival = function (r) {
    const own = r.els.filter((E) => !(r.claimedFrom || []).includes(E) && E.name !== "template_backplate" && E.revealT != null && !E.motif);
    return own.length ? Math.min(...own.map((E) => E.revealT)) : null;
  };
  Wd.SWAP_EARLY = 0.8;   // s after the join settles (or the first words) that still counts as "at once"
  Wd.SWAP_HOLD = 0.45;   // s the old drawing stays under its new copy after the copy starts to arrive
  const kindBase = (E) => String(E.name || "").replace(/(_b\d+|_\d+|_new|_v\d+)$/i, "").toLowerCase();
  const isTop = (E) => !!(E && E.outer && E.outer.parentNode && E.outer.parentNode.classList && E.outer.parentNode.classList.contains("lm-scene"));
  /** the new beat's own element drawn on the place of old element E (same station, same kind or name, nearly the same
   *  box, arriving at the join), or null */
  // an element's own drawn place when its declared box is wider (a screencast app is full frame, its window is not)
  const boxOf = (E) => (E.matchBox && E.matchBox.w > 0 ? E.matchBox : E);
  // a copy, not a different thing in the same place: the same words (most of them), or with no words a drawing of about
  // the same make. Two different texts on one spot kept the old under the new and printed words over words (the layout
  // checker's planted cases, D-190)
  const wordsOf = (E) => String((E.inner && E.inner.textContent) || "").toLowerCase().split(/\s+/).filter(Boolean);
  function sameDrawing(E, N) {
    const a = wordsOf(E), b = wordsOf(N);
    if (a.length || b.length) {
      if (!a.length || !b.length) return false;
      const A = new Set(a), B = new Set(b);
      let both = 0; for (const w of A) if (B.has(w)) both++;
      return both / (A.size + B.size - both) >= 0.6;
    }
    const n = (X) => (X.inner ? X.inner.querySelectorAll("*").length : 0), na = n(E), nb = n(N);
    return Math.max(na, nb) <= 1.5 * Math.max(1, Math.min(na, nb));
  }
  Wd.redrawOf = function (E, next) {
    if (!next || !isTop(E) || E.motif || !(E.w > 0 && E.h > 0)) return null;
    const P = boxOf(E);
    const st = E.scene && E.scene.def && E.scene.def.station;
    if (st !== next.def.station) return null;
    const t0 = next.joinWindow ? next.joinWindow[0] : next.beat.start;
    const t1 = Math.max(next.joinWindow ? next.joinWindow[1] : next.beat.start, next.beat.speech_start) + 1.5;
    let best = null, bestOv = 0;
    for (const N of next.els) {
      if (N === E || (next.claimedFrom || []).includes(N) || !isTop(N) || N.revealT == null || !(N.w > 0 && N.h > 0)) continue;
      if (N.revealT < t0 - 0.3 || N.revealT > t1) continue;
      if (N.kind !== E.kind && kindBase(N) !== kindBase(E)) continue;
      if (!sameDrawing(E, N)) continue;
      const Q = boxOf(N);
      const ix = Math.max(0, Math.min(P.x + P.w, Q.x + Q.w) - Math.max(P.x, Q.x));
      const iy = Math.max(0, Math.min(P.y + P.h, Q.y + Q.h) - Math.max(P.y, Q.y));
      const a = P.w * P.h, b = Q.w * Q.h, ov = (ix * iy) / Math.min(a, b);
      if (ov >= 0.7 && Math.max(a, b) / Math.min(a, b) <= 2 && ov > bestOv) { best = N; bestOv = ov; }
    }
    return best;
  };
  Wd.resolveHeldExits = function (recs, SCREEN) {
    for (const r of recs) {
      const list = r.heldExits || [];
      if (!list.length) continue;
      const settled = Math.max(r.joinWindow ? r.joinWindow[1] : r.beat.start, r.beat.speech_start);
      for (const h of list) {
        const E = h.E;
        E.exitT = null; E.exitKind = null;
        if (h.t > settled + Wd.SWAP_EARLY) { Loom.motion.exit(E, h.t, h.k, Object.assign({}, h.o, { planned: true })); continue; }
        const N = SCREEN[r.join] ? null : Wd.redrawOf(E, r);
        if (N) {
          Loom.motion.exit(E, Math.max(h.t, N.revealT) + Wd.SWAP_HOLD, "fade", { dur: 0.2, planned: true });
          (Loom.report.swaps = Loom.report.swaps || []).push({ beat: r.beat.id, old: E.name, new: N.name, how: "held_redrawn" });
          continue;
        }
        // released: no longer held by this beat, so the join retires it
        r.claimedFrom = (r.claimedFrom || []).filter((X) => X !== E);
        r.els = r.els.filter((X) => X !== E);
        if (E.heldBy) E.heldBy = E.heldBy.filter((b) => b !== r.beat.id);
        (Loom.report.swaps = Loom.report.swaps || []).push({ beat: r.beat.id, old: E.name, how: "released" });
      }
    }
  };

  /* ---------------- element life: every element exists only inside the beats that own it ----------------
   * A station holds the content of EVERY beat placed on it, built at load and stacked in build order. Only an entrance
   * tween hid an element before its beat and only an exit tween removed it after, so an element with no entrance
   * (sets, characters, held-or-create fallbacks, a scene that threw before animating) showed from t=0 whenever its
   * station was visible (nested stations too, whenever their parent was), and one that never got an exit stayed
   * (bench, 2026-10-07: foreign pixels from other beats in 12 to 43% of some frames). This clock switches each
   * element's outer group off outside [its beat's join start (the cover's middle for a screen join), the end of the
   * join after its LAST holder (held / keep extend it)]. Not gated: motifs (they travel between stations), the
   * presenter, an element marked `E.persist = true`, and the scenery of a station declared `persistent: true`.
   * A pure function of t; the window is in the report as lifeT. */
  Wd.PRESENTER_KINDS = { presenter: 1 };
  Wd.planLife = function (manifest) {
    const recs = Wd.sceneRecs, D = manifest.duration;
    const lastHolder = new Map();
    recs.forEach((r, i) => r.els.forEach((E) => lastHolder.set(E, i)));
    const lives = [];
    recs.forEach((r, i) => {
      const own = r.els.filter((E) => !(r.claimedFrom || []).includes(E));
      const jw = r.joinWindow, scr = SCREEN[r.join];
      const enter = i === 0 ? 0 : (jw ? (scr ? (jw[0] + jw[1]) / 2 : jw[0]) : r.beat.start);
      const stDef = (Wd.stations[r.def.station] || {}).def || {};
      for (const E of own) {
        if (E.motif || !E.outer || !E.outer.style || E.persist || Wd.PRESENTER_KINDS[E.kind]) continue;
        if (stDef.persistent && E.kind === "scenery" && E.name !== "template_backplate") continue;
        const j = lastHolder.get(E), nx = recs[j + 1];
        const a = Math.max(0, Math.min(enter, E.revealT == null ? Infinity : E.revealT) - 0.06);
        let b = nx ? Math.max(nx.beat.start, nx.joinWindow ? nx.joinWindow[1] : nx.beat.start) + 0.1 : D;
        // an exit the scene itself placed later than that (it still owns the element until then)
        if (E.exitT != null && E.exitKind !== "camera" && isFinite(E.exitT)) b = Math.max(b, Math.min(D, E.exitT + 1.0));
        lives.push({ el: E.outer, a, b, v: null, E });
        E.lifeT = [+a.toFixed(3), +b.toFixed(3)];
      }
    });
    // an element drawn inside another (a kit part's pieces inside the board) lives as long as the one it sits in: the
    // board held by eleven beats stayed while its browser, path and server switched off at the end of the beat that drew
    // them, an empty frame to 88 s (https-private-relay run 2, 2026-10-12; run 1's redrawn boards hid it)
    const byEl = new Map(lives.map((L) => [L.el, L]));
    const hostOf = (el) => (el.parentNode && el.parentNode.closest ? el.parentNode.closest(".lm-el") : null);
    for (const L of lives) {
      let b = L.b;
      for (let o = hostOf(L.el); o; o = hostOf(o)) { const H = byEl.get(o); if (H && H.b > b) b = H.b; }
      if (b > L.b) { L.b = b; L.E.lifeT = [L.E.lifeT[0], +b.toFixed(3)]; }
    }
    Loom.clock((t) => {
      for (const L of lives) {
        const v = t >= L.a && t <= L.b;
        if (L.v !== v) { L.v = v; L.el.style.display = v ? "" : "none"; }
      }
    });
    Wd.planCover(manifest);
  };

  /* Words under a backplate are layering, not a collision: while a later template's backplate covers a beat's group
   * (veiled 0.94 and blurred 9 px), its texts carry data-layout-allow-overlap, which the HyperFrames layout audit reads
   * on the text element itself. quick-question-cost b05's definition over b04's kept page read as 3 content_overlap
   * errors once the page's lines stayed with it (2026-10-07). Outside the cover the mark is removed (a pure function
   * of t), so a real overlap in the beat's own time is still reported. */
  Wd.planCover = function (manifest) {
    const wins = (Wd.bpCover || []).map((w) => ({ g: w.g, a: w.a, b: w.b == null ? manifest.duration : w.b }));
    if (!wins.length) return;
    const groups = new Map();
    for (const w of wins) {
      if (!groups.has(w.g)) groups.set(w.g, { g: w.g, texts: Array.from(w.g.querySelectorAll("text, tspan")), wins: [], v: null });
      groups.get(w.g).wins.push(w);
    }
    Loom.clock((t) => {
      for (const G of groups.values()) {
        const v = G.wins.some((w) => t >= w.a && t <= w.b);
        if (G.v === v) continue;
        G.v = v;
        for (const e of G.texts) { if (v) e.setAttribute("data-layout-allow-overlap", ""); else e.removeAttribute("data-layout-allow-overlap"); }
        if (G.g.__bpFilter) { if (v) G.g.setAttribute("filter", G.g.__bpFilter); else G.g.removeAttribute("filter"); }
      }
    });
  };

  /* ---------------- station visibility (clock) ---------------- */
  Wd.planVisibility = function () {
    const recs = Wd.sceneRecs;
    for (const r of recs) {
      const st = Wd.stations[r.def.station];
      const a = (r.joinWindow ? r.joinWindow[0] : r.beat.start) - 1.2;
      const nx = recs[r.index + 1];
      const b = (nx && nx.joinWindow ? nx.joinWindow[1] : r.beat.end) + 1.2;
      st.windows.push([a, b]);
      // nested stations are visible whenever their parent is (zoom-through needs both)
      let p = st.def.parent;
      while (p) { Wd.stations[p].windows.push([a, b]); p = Wd.stations[p].def.parent; }
    }
    // children must be visible while a parent is (you can see the portal)
    for (const id in Wd.stations) {
      const st = Wd.stations[id];
      if (st.def.parent) for (const w of Wd.stations[st.def.parent].windows.slice()) st.windows.push(w);
    }
    Loom.clock((t) => {
      for (const id in Wd.stations) {
        const st = Wd.stations[id];
        const vis = st.windows.some((w) => t >= w[0] && t <= w[1]);
        const v = vis ? "visible" : "hidden";
        if (st.div.style.visibility !== v) st.div.style.visibility = v;
      }
    });
  };

  /* ---------------- screen joins: the cover (D-90, B7) ---------------- */
  // iris  : black closes on a point of the old shot, opens on a point of the new one ("into this")
  // wipe  : a field-colour matte crosses the frame in join_in.dir (default right: the direction of time)
  // dip   : through black (a change of era or mood); fade: through the field colour ("meanwhile")
  // A pure function of t; captions and chrome stay above it.
  const io3 = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
  /** the cover of a screen join at progress p (0..1): {d, fill, opacity}. Pure; the lab draws it too. */
  Wd.coverAt = function (kind, p, def, pal) {
    def = def || {}; pal = pal || {};
    const field = pal.field || "#000", matte = pal.field2 || field;
    const closing = p < 0.5, u = closing ? p * 2 : (p - 0.5) * 2;
    const box = `M0 0H${W}V${H}H0Z`, R = Math.hypot(W, H) / 2 + 60;
    if (kind === "dip" || kind === "fade") {
      // fully covered only at the middle, where the camera jumps: the cover accelerates into it and out of it, so a
      // frame either side is about 92 % covered (the jump is not seen) and only about one frame is fully covered. It
      // was held fully covered from 0.42 to 0.58 on steep ramps, 0.3 to 0.5 s of bare paper or black that read as the
      // film stopping (R-41, feedback-relay-v3 R-51, L-407)
      const a = closing ? u * u : (1 - u) * (1 - u);
      return { d: box, fill: kind === "dip" ? "#000" : field, opacity: a };
    }
    if (kind === "iris") {
      const from = def.from || def.at || [W / 2, H / 2], to = def.at || [W / 2, H / 2];
      const [cx, cy] = closing ? from : to;
      const r = closing ? R * (1 - io3(Math.min(1, u / 0.9))) : R * io3(Math.max(0, (u - 0.1) / 0.9));
      const hole = r > 0.5 ? `M${(cx - r).toFixed(1)} ${cy}a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(2 * r).toFixed(1)} 0a${r.toFixed(1)} ${r.toFixed(1)} 0 1 0 ${(-2 * r).toFixed(1)} 0Z` : "";
      return { d: box + hole, fill: "#000", opacity: 1 };
    }
    if (kind === "wipe") {
      const dir = def.dir || "right", e = io3(p);
      const L = dir === "left" || dir === "right" ? W : H, sgn = dir === "right" || dir === "down" ? 1 : -1;
      const off = (sgn * (e * 2 - 1) * L).toFixed(1);   // -L (off screen) .. 0 (covering, the middle) .. +L (gone)
      // the matte is field2, so it reads against a field-coloured world instead of erasing it unseen
      return { d: dir === "left" || dir === "right" ? `M${off} 0h${W}v${H}h${-W}Z` : `M0 ${off}h${W}v${H}h${-W}Z`, fill: matte, opacity: 1 };
    }
    // D-114: a material or motif join is drawn by Loom.material (same contract: pure, covered from 0.42 to 0.58)
    if (Loom.material && Loom.material.has(kind)) return Loom.material.coverAt(kind, p, def, pal);
    Loom.error("join_unknown", `screen join "${kind}" (have: iris, wipe, dip, fade, ${Object.keys(MAT).join(", ")})`);
    return { d: "", fill: "none", opacity: 0 };
  };
  Wd.installCovers = function () {
    if (!Wd.covers.length) return;
    const sv = Loom.svg("svg", { id: "lm-join-cover", width: W, height: H, viewBox: `0 0 ${W} ${H}`,
      style: `position:absolute;left:0;top:0;width:${W}px;height:${H}px;pointer-events:none;visibility:hidden` });
    if (Wd.overlay && Wd.overlay.parentNode) Wd.overlay.parentNode.insertBefore(sv, Wd.overlay); else Wd.root.appendChild(sv);
    const path = Loom.svg("path", { "fill-rule": "evenodd" }, sv);
    const shade = Loom.material && Loom.material.layerGroup ? Loom.material.layerGroup(sv) : null;   // D-114: page flap, fold and roll shading
    (Loom.report.joins = Loom.report.joins || []).push(...Wd.covers.map((c) => ({ beat: c.beat, kind: c.kind, t0: c.t0, t1: c.t1 })));
    Loom.clock((t) => {
      const c = Wd.covers.find((k) => t >= k.t0 && t <= k.t1);
      if (!c) { if (sv.style.visibility !== "hidden") sv.style.visibility = "hidden"; return; }
      sv.style.visibility = "visible";
      const C = Wd.coverAt(c.kind, (t - c.t0) / Math.max(0.001, c.t1 - c.t0), c.def, S().pack.palette);
      path.setAttribute("d", C.d); path.setAttribute("fill", C.fill); path.setAttribute("opacity", Number(C.opacity).toFixed(3));
      if (shade) Loom.material.drawLayers(shade, C.layers);
    });
  };

  Wd.installClock = function (duration) {
    Wd.installCovers();
    Loom.clock((t) => applyCam(Wd.cameraAt(t)));
    const proxy = { t: 0 };
    Loom.tl.fromTo(proxy, { t: 0 }, { t: duration, duration, ease: "none", onUpdate: () => { for (const f of Wd.clocks) f(proxy.t); } }, 0);
  };
})();
