/* Loom geography (D-90, CINEMA_PLAN B4): real coastlines, so a map or a globe is TRUE.
 *
 * Data: Natural Earth 1:110m countries and populated places (public domain), as assets/geo/world110m.json. Compose
 * and the lab embed it only when a scene uses Loom.geo (as Loom.assets.geo). Countries are found by ISO A3 code or
 * by name (Natural Earth marks a few, such as France and Norway, with iso "-99", so use the name for those).
 *
 *   Loom.geo.map(ctx, "m", {x, y, w, h, bounds: [lonW, latS, lonE, latN], fill: "surface2", land: "muted",
 *                           graticule: 30, flood: [{c: "IDN", color: "neg", t}], cities: true, t})
 *   Loom.geo.globe(ctx, "g", {cx, cy, r, lon0, lat0, spin: deg/s, flood: [...], arcs: [{from: [lon, lat], to: [lon, lat], t, dur, color}], t})
 *   Loom.geo.point(lon, lat) -> [lon, lat] (for anchors), Loom.geo.city("London") -> [lon, lat]
 * The globe is an orthographic projection redrawn from ONE progress driver (a pure function of time); the far side
 * is culled. Flooding a country fills it with the colour at its time (a map that floods country by country).
 */
// @capability geography | data | Loom.geo.map, Loom.geo.globe, Loom.geo.city | Real geography | a true map or globe: countries flood, cities mark, arcs travel (where in the world it happens)
(function () {
  "use strict";
  const Loom = window.Loom;
  const S = () => Loom.style;
  const svg = (...a) => Loom.svg(...a);
  const G = (Loom.geo = {});
  const RAD = Math.PI / 180;
  const f1 = (v) => Math.round(v * 10) / 10;
  function data() {
    const d = (Loom.assets || {}).geo;
    if (!d) { Loom.error("geo_missing", "no geography in this build (Loom.geo needs assets/geo/world110m.json; compose embeds it when a scene uses Loom.geo)"); return null; }
    if (!d.__rings) d.__rings = d.rings.map(([o, flat]) => { const pts = []; for (let i = 0; i < flat.length; i += 2) pts.push([flat[i] / d.scale, flat[i + 1] / d.scale]); return { owner: o, pts }; });
    return d;
  }
  G.data = data;
  G.find = function (c) {
    const d = data(); if (!d) return -1;
    const k = d.countries.findIndex((x) => x.iso === c || x.name.toLowerCase() === String(c).toLowerCase());
    if (k < 0) Loom.error("geo_unknown", `no country "${c}" in Natural Earth 1:110m (use the ISO A3 code or the name)`);
    return k;
  };
  G.city = function (name) {
    const d = data(); const c = d && d.cities.find((x) => x.name.toLowerCase() === String(name).toLowerCase());
    if (!c) { Loom.error("geo_unknown", `no city "${name}" in the 243 Natural Earth places`); return [0, 0]; }
    return [c.lon, c.lat];
  };
  const floodOf = (list) => { const m = {}; (list || []).forEach((f) => { const k = G.find(f.c); if (k >= 0) m[k] = f; }); return m; };
  const rec = (kind, name, o) => (Loom.report.geo = Loom.report.geo || []).push({ beat: Loom.ctxBeat && Loom.ctxBeat.id, kind, name, flood: (o.flood || []).map((f) => f.c), arcs: (o.arcs || []).length });

  /** a flat map (equirectangular) inside a box, with a graticule and countries that flood in order */
  G.map = function (ctx, name, o) {
    o = o || {}; const d = data(); if (!d) return null;
    const [w0, s0, e0, n0] = o.bounds || [-180, -60, 180, 84], w = o.w || 1600, h = o.h || w * (n0 - s0) / (e0 - w0);
    const X = (lon) => (lon - w0) / (e0 - w0) * w, Y = (lat) => (n0 - lat) / (n0 - s0) * h;
    const E = ctx.el(name, { x: o.x || 0, y: o.y || 0, w, h, kind: "map", exit: o.exit || "recede" });
    const cid = "geoclip_" + name.replace(/\W/g, "_");
    Loom.svg("rect", { x: 0, y: 0, width: w, height: h }, svg("clipPath", { id: cid }, svg("defs", {}, E.inner)));
    const g = svg("g", { "clip-path": `url(#${cid})` }, E.inner);
    svg("rect", { x: 0, y: 0, width: w, height: h, fill: S().c(o.sea || "field2") }, g);
    if (o.graticule) for (let lo = -180; lo <= 180; lo += o.graticule) svg("line", { x1: f1(X(lo)), y1: 0, x2: f1(X(lo)), y2: h, stroke: S().c("line"), "stroke-width": 1.5, opacity: 0.35 }, g);
    if (o.graticule) for (let la = -60; la <= 80; la += o.graticule) svg("line", { x1: 0, y1: f1(Y(la)), x2: w, y2: f1(Y(la)), stroke: S().c("line"), "stroke-width": 1.5, opacity: 0.35 }, g);
    const flood = floodOf(o.flood), land = S().c(o.land || "muted"), edge = S().c(o.edge || "field");
    const byCountry = {};
    for (const r of d.__rings) {
      const dd = r.pts.map((p, i) => `${i ? "L" : "M"}${f1(X(p[0]))} ${f1(Y(p[1]))}`).join("") + "Z";
      const p = svg("path", { d: dd, fill: land, stroke: edge, "stroke-width": o.edgeW || 1.2, "stroke-linejoin": "round" }, g);
      (byCountry[r.owner] = byCountry[r.owner] || []).push(p);
    }
    for (const k in flood) {
      const f = flood[k], col = S().c(f.color || "accent");
      for (const p of byCountry[k] || []) Loom.tween(p, { attr: { fill: land } }, { attr: { fill: col }, duration: f.dur || 0.6, ease: Loom.ease.move }, f.t == null ? ctx.start + 0.5 : f.t, { kind: "fill", beat: Loom.ctxBeat && Loom.ctxBeat.id, name: `${name}.${d.countries[k].iso}` });
    }
    if (o.cities) {
      const cs = o.cities === true ? d.cities : o.cities.map((n) => d.cities.find((c) => c.name === n)).filter(Boolean);
      cs.forEach((c) => svg("circle", { cx: f1(X(c.lon)), cy: f1(Y(c.lat)), r: o.cityR || 3, fill: S().c(o.cityColor || "accent4") }, g));
    }
    E.project = (lon, lat) => [X(lon), Y(lat)];
    if (o.t != null) Loom.motion.reveal(E, o.t, { dy: 0 });
    rec("map", name, o);
    return E;
  };

  function rotFor(lon0, lat0) {
    const a = -lon0 * RAD, b = lat0 * RAD, ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
    return (lon, lat) => {
      const lo = lon * RAD, la = lat * RAD;
      let x = Math.cos(la) * Math.sin(lo), y = Math.sin(la), z = Math.cos(la) * Math.cos(lo);
      const x1 = x * ca + z * sa, z1 = -x * sa + z * ca;          // spin about the pole
      const y2 = y * cb - z1 * sb, z2 = y * sb + z1 * cb;         // tilt toward the viewer
      return [x1, y2, z2];
    };
  }
  /** a globe that turns (orthographic, far side culled), with countries that flood and arcs that travel */
  G.globe = function (ctx, name, o) {
    o = o || {}; const d = data(); if (!d) return null;
    const r = o.r || 360, E = ctx.el(name, { x: (o.cx || 960) - r, y: (o.cy || 540) - r, w: 2 * r, h: 2 * r, kind: "globe", exit: o.exit || "recede" });
    const cx = r, cy = r, g = E.inner;
    svg("circle", { cx, cy, r: r + (o.atmo == null ? 14 : o.atmo), fill: S().c(o.atmoColor || "accent4"), opacity: 0.18 }, g);
    svg("circle", { cx, cy, r, fill: S().c(o.sea || "surface") }, g);
    const landG = svg("g", {}, g), arcG = svg("g", {}, g);
    svg("ellipse", { cx: cx - r * 0.32, cy: cy - r * 0.38, rx: r * 0.42, ry: r * 0.22, fill: "#FFFFFF", opacity: 0.1, transform: `rotate(-30 ${cx - r * 0.32} ${cy - r * 0.38})` }, g);
    svg("circle", { cx, cy, r, fill: "none", stroke: S().c(o.rim || "line"), "stroke-width": o.rimW || 4 }, g);
    const flood = floodOf(o.flood), land = S().c(o.land || "accent4"), edge = S().c(o.edge || "surface");
    const paths = d.__rings.map((ring) => ({ ring, p: svg("path", { fill: land, stroke: edge, "stroke-width": 1, "stroke-linejoin": "round" }, landG) }));
    const arcs = (o.arcs || []).map((a) => ({ a, p: svg("path", { fill: "none", stroke: S().c(a.color || "accent4"), "stroke-width": a.w || 5, "stroke-linecap": "round" }, arcG),
      head: svg("circle", { r: (a.w || 5) * 1.6, fill: S().c(a.color || "accent4"), opacity: 0 }, arcG) }));
    const t0 = o.t == null ? ctx.start : o.t, T = Math.max(0.5, (ctx.end || t0 + 10) - t0);
    const slerp = (A, B, u) => {   // great-circle interpolation in lon/lat, lifted off the surface by the arc height
      const v = (q) => [Math.cos(q[1] * RAD) * Math.sin(q[0] * RAD), Math.sin(q[1] * RAD), Math.cos(q[1] * RAD) * Math.cos(q[0] * RAD)];
      const a = v(A), b = v(B), dot = Math.max(-1, Math.min(1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2])), om = Math.acos(dot);
      let q = a;
      if (om >= 1e-4) { const k1 = Math.sin((1 - u) * om) / Math.sin(om), k2 = Math.sin(u * om) / Math.sin(om); q = [0, 1, 2].map((i) => k1 * a[i] + k2 * b[i]); }
      return [Math.atan2(q[0], q[2]) / RAD, Math.asin(Math.max(-1, Math.min(1, q[1]))) / RAD];
    };
    const drawAt = (t) => {
      const lon0 = (o.lon0 || 0) + (o.spin || 0) * (t - t0), R = rotFor(lon0, o.lat0 || 0);
      for (const { ring, p } of paths) {
        let dd = "", pen = false, vis = 0;
        for (const q of ring.pts) {
          const [x, y, z] = R(q[0], q[1]);
          if (z > 0) { dd += `${pen ? "L" : "M"}${f1(cx + r * x)} ${f1(cy - r * y)}`; pen = true; vis++; } else pen = false;
        }
        p.setAttribute("d", vis > 2 ? dd + "Z" : "");
        const f = flood[ring.owner];
        if (f) { const u = Math.max(0, Math.min(1, (t - (f.t == null ? t0 + 0.5 : f.t)) / (f.dur || 0.6))); p.setAttribute("fill", u > 0 ? S().mix(land, S().c(f.color || "neg"), u) : land); }
      }
      for (const { a, p, head } of arcs) {
        const u = Math.max(0, Math.min(1, (t - (a.t == null ? t0 + 1 : a.t)) / (a.dur || 1.6)));
        if (u <= 0) { p.setAttribute("d", ""); head.setAttribute("opacity", 0); continue; }
        const n = 40, m = Math.max(1, Math.round(n * u)); let dd = "", last = null;
        for (let k = 0; k <= m; k++) {
          const s = k / n, [lo, la] = slerp(a.from, a.to, s), lift = 1 + (a.lift == null ? 0.18 : a.lift) * Math.sin(Math.PI * s);
          const [x, y, z] = R(lo, la);
          if (z > -0.15) { const X = cx + r * lift * x, Y = cy - r * lift * y; dd += `${dd ? "L" : "M"}${f1(X)} ${f1(Y)}`; last = [X, Y]; }
        }
        p.setAttribute("d", dd);
        if (last) { head.setAttribute("cx", f1(last[0])); head.setAttribute("cy", f1(last[1])); head.setAttribute("opacity", u < 1 ? 1 : 0); }
      }
    };
    Loom.drive((e, p) => drawAt(t0 + p * T), t0, T, "linear", { kind: "ambient", beat: Loom.ctxBeat && Loom.ctxBeat.id, name: name + ".turn" });
    drawAt(t0);
    if (o.t != null) Loom.motion.reveal(E, o.t, { dy: 0 });
    rec("globe", name, o);
    return E;
  };
})();
