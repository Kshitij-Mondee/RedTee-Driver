/* Loom depth stage (D-61): 2.5D in the page - flat layers that read as deep.
 *
 * A stage holds LAYERS at a depth z (0 = far, 1 = near). Over a dolly window the camera pushes in and
 * drifts; each layer scales and slides by an amount that grows with z, so near things move more (parallax).
 * Depth also sets the look: far layers are toned toward the field colour (aerial perspective) and every
 * layer away from the FOCUS depth is blurred (depth of field). Light is part of the stage: a glowing body
 * (bloom), a light cone and rim lines. Film grain and grade come from the style's fx layer.
 *
 *   const st = ctx.depth("night", { dolly: [ctx.start, ctx.end], push: 0.1, drift: -40, focus: 0.55 });
 *   st.sky();  st.glow(960, 220, 70);  st.ridge(0.2, [[0,600],[500,470],...], "surface");
 *   st.cone(960, 220, 520, 620);  const hill = st.ridge(0.55, [...], "field");  st.haze(0.7);  st.ridge(1, [...], "field2");
 * Every colour is a token; toned and blurred by depth, never hand-mixed.
 */
// @capability depth_25d | world | ctx.depth(name, {dolly, push, drift, focus, dof, atmosphere}) | Depth stage | a 2.5D landscape or room in parallax layers with depth of field (cinematic packs); keep text out of the stage
(function () {
  "use strict";
  const Loom = window.Loom;
  const S = () => Loom.style;
  const D = (Loom.depth = {});

  function mix(a, b, k) {
    const pa = a.replace("#", ""), pb = b.replace("#", "");
    const ch = (s, i) => parseInt(s.slice(i, i + 2), 16);
    return "#" + [0, 2, 4].map((i) => Math.round(ch(pa, i) + (ch(pb, i) - ch(pa, i)) * k).toString(16).padStart(2, "0")).join("");
  }

  D.stage = function (ctx, name, o) {
    o = o || {};
    const E = ctx.el(name, { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: o.exit || "recede", parent: o.parent ? (o.parent.inner || o.parent) : undefined });
    const defs = Loom.svg("defs", {}, E.inner);
    const uid = Loom.uid("dp");
    if (o.clip) {
      // a stage seen THROUGH something (a window, a screen, a door): clip every layer to a rounded rect
      const [kx, ky, kw, kh, kr] = o.clip;
      const cp = Loom.svg("clipPath", { id: `${uid}clip` }, defs);
      Loom.svg("rect", { x: kx, y: ky, width: kw, height: kh, rx: kr || 0 }, cp);
      E.inner.setAttribute("clip-path", `url(#${uid}clip)`);
    }
    const focus = o.focus == null ? 0.55 : o.focus, atmo = o.atmosphere == null ? 0.55 : o.atmosphere;
    const cx = o.cx || 960, cy = o.cy || 640;
    const layers = [];
    const filters = {};
    const blurFor = (z) => {
      const sd = Math.round(Math.abs(z - focus) * (o.dof == null ? 9 : o.dof) * 2) / 2;
      if (sd < 0.5) return null;
      if (!filters[sd]) {
        const f = Loom.svg("filter", { id: `${uid}b${String(sd).replace(".", "_")}`, x: "-10%", y: "-10%", width: "120%", height: "120%" }, defs);
        Loom.svg("feGaussianBlur", { stdDeviation: sd }, f);
        filters[sd] = f.getAttribute("id");
      }
      return `url(#${filters[sd]})`;
    };
    const tone = (token, z) => mix(S().c(token), S().c("field"), Math.max(0, (1 - z)) * atmo);
    const layer = (z, blend) => {
      const g = Loom.svg("g", { class: "lm-depth-layer", "data-z": z, style: blend ? `mix-blend-mode:${blend}` : null }, E.inner);
      const inner = Loom.svg("g", { filter: blend ? null : blurFor(z) }, g);
      layers.push({ z, g });
      return inner;
    };
    // every gradient and filter id is unique per call: two cones (or two hazes at one z) shared one id and so one
    // colour (cinematic-noir guide s15, 2026-10-08)
    let gn = 0;
    const nid = (p) => `${uid}${p}${gn++}`;
    const api = {
      E, tone,
      /** a raw layer group at depth z: draw anything into it */
      layer,
      /** the sky: field2 at the top to field at the horizon */
      sky(top, bottom) {
        const gid = `${uid}sky`;
        const lg = Loom.svg("linearGradient", { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
        Loom.svg("stop", { offset: "0", "stop-color": S().c(top || "field2") }, lg); Loom.svg("stop", { offset: "1", "stop-color": S().c(bottom || "field") }, lg);
        Loom.svg("rect", { x: -200, y: -200, width: 2320, height: 1480, fill: `url(#${gid})` }, layer(0));
        return api;
      },
      /** a glowing body (moon, sun, lamp) with bloom: a sharp core and two soft halos */
      glow(x, y, r, token, o) {
        // o.z: the depth the light rides at, so a lamp's bloom moves with its lamp (default 0.05, the sky)
        const g = layer(o && o.z != null ? o.z : 0.05, "screen"); const col = S().c(token || "ink");
        const bf = (sd) => { const fid = nid("g"); const f = Loom.svg("filter", { id: fid, x: "-100%", y: "-100%", width: "300%", height: "300%" }, defs); Loom.svg("feGaussianBlur", { stdDeviation: sd }, f); return `url(#${fid})`; };
        Loom.svg("circle", { cx: x, cy: y, r: r * 2.8, fill: col, opacity: 0.12, filter: bf(Math.round(r * 0.9)) }, g);
        Loom.svg("circle", { cx: x, cy: y, r: r * 1.5, fill: col, opacity: 0.35, filter: bf(Math.round(r * 0.35)) }, g);
        Loom.svg("circle", { cx: x, cy: y, r, fill: col }, g);
        return api;
      },
      /** a silhouette ridge at depth z from points [[x, y], ...], optionally with a lit rim */
      ridge(z, pts, token, ro) {
        ro = ro || {};
        const g = layer(z);
        let d = `M${pts[0][0] - 400} 1400 L${pts[0][0] - 400} ${pts[0][1]} L${pts[0][0]} ${pts[0][1]}`;
        for (let i = 1; i < pts.length; i++) { const [px, py] = pts[i - 1], [x, y] = pts[i]; d += ` Q${px} ${py} ${(px + x) / 2} ${(py + y) / 2}`; }
        const last = pts[pts.length - 1]; d += ` L${last[0]} ${last[1]} L${last[0] + 400} ${last[1]} L${last[0] + 400} 1400 Z`;
        Loom.svg("path", { d, fill: tone(token, z) }, g);
        if (ro.rim) {
          let r = `M${pts[0][0]} ${pts[0][1]}`;
          for (let i = 1; i < pts.length; i++) { const [px, py] = pts[i - 1], [x, y] = pts[i]; r += ` Q${px} ${py} ${(px + x) / 2} ${(py + y) / 2}`; }
          Loom.svg("path", { d: r, fill: "none", stroke: S().c(ro.rim), "stroke-width": ro.rimWidth || 2.5, opacity: ro.rimOpacity || 0.6, "stroke-linecap": "round" }, g);
        }
        return g;
      },
      /** a cone of light from (x, y) spreading to width w over length len, additive */
      cone(x, y, w, len, token, o) {
        const g = layer(o && o.z != null ? o.z : 0.3, "screen"); const gid = nid("cone"), cbid = nid("cb");
        const lg = Loom.svg("linearGradient", { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
        const col = S().c(token || "ink");
        [[0, 0.0], [0.08, 0.34], [0.7, 0.12], [1, 0]].forEach(([off, a]) => Loom.svg("stop", { offset: off, "stop-color": col, "stop-opacity": a }, lg));
        const f = Loom.svg("filter", { id: cbid, x: "-20%", y: "-5%", width: "140%", height: "110%" }, defs); Loom.svg("feGaussianBlur", { stdDeviation: 14 }, f);
        Loom.svg("path", { d: `M${x - w * 0.06} ${y} L${x + w * 0.06} ${y} L${x + w / 2} ${y + len} L${x - w / 2} ${y + len} Z`, fill: `url(#${gid})`, filter: `url(#${cbid})` }, g);
        return g;
      },
      /** a band of haze in front of depth z */
      haze(z, top, token) {
        const g = layer(z); const gid = nid("hz");
        const lg = Loom.svg("linearGradient", { id: gid, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
        const col = S().c(token || "ink");
        Loom.svg("stop", { offset: "0", "stop-color": col, "stop-opacity": 0 }, lg); Loom.svg("stop", { offset: "1", "stop-color": col, "stop-opacity": 0.16 }, lg);
        Loom.svg("rect", { x: -200, y: top || 700, width: 2320, height: 1480 - (top || 700), fill: `url(#${gid})` }, g);
        return g;
      },
    };
    // the dolly: push in and drift, parallax by depth; a pure function of time
    const [t0, t1] = o.dolly || [ctx.start, ctx.end];
    const push = o.push == null ? 0.1 : o.push, drift = o.drift == null ? -40 : o.drift, lift = o.lift || 0;
    Loom.drive((e) => {
      for (const L of layers) {
        const s = 1 + push * e * (0.25 + L.z), dx = drift * e * L.z, dy = lift * e * L.z;
        L.g.setAttribute("transform", `translate(${(cx + dx).toFixed(2)} ${(cy + dy).toFixed(2)}) scale(${s.toFixed(5)}) translate(${-cx} ${-cy})`);
      }
    }, t0, Math.max(0.1, t1 - t0), "editorial", { kind: "camera", beat: E.beat, name: E.name });
    return api;
  };
})();
