/* Loom isometric kit (D-60): isometric diagrams drawn in the page as SVG, in the style's tokens.
 *
 * The projection is true isometric (30 degree axes): screen x = x0 + (x - y) * cos30 * u, screen y =
 * y0 + (x + y) * sin30 * u - z * u. A box has three faces shaded from ONE token (top as is, left darker,
 * right darker still), so every box in every style is lit from the same side. Things are depth-sorted
 * (painter's order) when the plane is finished, so build order never breaks occlusion.
 *
 *   const iso = ctx.iso({ x0: 960, y0: 330, unit: 70 });
 *   const db = iso.box("db", 0, 0, 0, 2, 2, 1.4, { fill: "accent" });   m.spring(db, t);
 *   iso.tile("floor", -1, -1, 6, 5, { fill: "surface2" });  iso.arrow("a1", [2, 1, 0.2], [4, 1, 0.2]);
 *   iso.label("db_label", 1, 1, 1.4, "Orders DB");  iso.done();
 * Outlined styles (sketch, line) draw strokes instead of shaded fills.
 */
// @capability isometric | world | ctx.iso({x0, y0, unit}): box, tile, grid, arrow, label, done | Isometric | an isometric diagram of a system, a building or a flow (boxes extrude on their words)
(function () {
  "use strict";
  const Loom = window.Loom;
  const S = () => Loom.style;
  const C30 = Math.cos(Math.PI / 6), S30 = 0.5;
  const I = (Loom.iso = {});

  I.plane = function (ctx, o) {
    o = o || {};
    const x0 = o.x0 == null ? 960 : o.x0, y0 = o.y0 == null ? 380 : o.y0, u = o.unit || 64;
    const host = Loom.svg("g", { class: "lm-iso" }, o.parent ? (o.parent.inner || o.parent) : ctx.g);
    const items = [];
    const P = (x, y, z) => [x0 + (x - y) * C30 * u, y0 + (x + y) * S30 * u - (z || 0) * u];
    const pts = (arr) => arr.map((p) => P(...p).map((v) => v.toFixed(1)).join(",")).join(" ");
    const outlined = S().outlined ? S().outlined() : false;
    const sw = S().pack.shape.stroke || 3;
    const face = (g, poly, fill, dark) => {
      const col = S().c(fill);
      if (outlined) Loom.svg("polygon", { points: pts(poly), fill: S().c("field"), stroke: S().c("ink"), "stroke-width": sw, "stroke-linejoin": "round" }, g);
      else Loom.svg("polygon", { points: pts(poly), fill: dark ? S().darken(col, dark) : col, stroke: S().darken(col, (dark || 0) + 0.18), "stroke-width": 1, "stroke-linejoin": "round" }, g);
    };
    const el = (name, depth, kind) => {
      // an element in SCREEN space (the plane's host), so motion (spring, reveal, exit) works as anywhere
      const E = Loom.kit.element(host, name, { x: 0, y: 0, w: 1, h: 1, kind: kind || "shape" });
      items.push({ E, depth });
      return E;
    };
    const api = {
      P,
      /** a box: position (x, y, z) of its back-left-bottom corner, size (w along x, d along y, h up) */
      box(name, x, y, z, w, d, h, bo) {
        bo = bo || {};
        const E = el(name, x + y + z + (w + d) / 2 + h * 0.01, "node");
        const g = E.inner, f = bo.fill || "accent";
        face(g, [[x, y + d, z], [x + w, y + d, z], [x + w, y + d, z + h], [x, y + d, z + h]], f, 0.14);     // front-left face
        face(g, [[x + w, y, z], [x + w, y + d, z], [x + w, y + d, z + h], [x + w, y, z + h]], f, 0.28);    // front-right face
        face(g, [[x, y, z + h], [x + w, y, z + h], [x + w, y + d, z + h], [x, y + d, z + h]], f, 0);        // top
        if (bo.icon) { const [cx, cy] = P(x + w / 2, y + d / 2, z + h); Loom.kit.icon(g, bo.icon, { x: cx, y: cy, size: u * Math.min(w, d) * 0.55, color: S().pickTokenOn ? S().pickTokenOn(f) : "field" }); }
        const [bx, by] = P(x + w / 2, y + d / 2, z + h); E.__top = { x: bx, y: by };
        return E;
      },
      /** a flat tile on the ground (or at height z) */
      tile(name, x, y, w, d, to) {
        to = to || {};
        const E = el(name, x + y - 100 + (to.z || 0), "scenery");
        face(E.inner, [[x, y, to.z || 0], [x + w, y, to.z || 0], [x + w, y + d, to.z || 0], [x, y + d, to.z || 0]], to.fill || "surface2", 0);
        return E;
      },
      /** a ground grid (a planning board) */
      grid(name, x, y, w, d, step, go) {
        const E = el(name, -50, "scenery"); const g = E.inner; step = step || 1;   // above ground tiles, below everything standing on them
        const col = S().c((go && go.stroke) || "line");
        for (let i = 0; i <= w; i += step) Loom.svg("line", { x1: P(x + i, y, 0)[0], y1: P(x + i, y, 0)[1], x2: P(x + i, y + d, 0)[0], y2: P(x + i, y + d, 0)[1], stroke: col, "stroke-width": 2, opacity: 0.85 }, g);
        for (let j = 0; j <= d; j += step) Loom.svg("line", { x1: P(x, y + j, 0)[0], y1: P(x, y + j, 0)[1], x2: P(x + w, y + j, 0)[0], y2: P(x + w, y + j, 0)[1], stroke: col, "stroke-width": 2, opacity: 0.85 }, g);
        return E;
      },
      /** an arrow between two iso points (draw it with m.draw(E.path, t)) */
      arrow(name, a, b, ao) {
        ao = ao || {};
        const E = el(name, Math.max(a[0] + a[1] + a[2], b[0] + b[1] + b[2]) + 0.5, "connector");
        const [ax, ay] = P(...a), [bx, by] = P(...b);
        const col = S().c(ao.stroke || "ink");
        const path = Loom.svg("path", { d: `M${ax.toFixed(1)} ${ay.toFixed(1)} L${bx.toFixed(1)} ${by.toFixed(1)}`, stroke: col, "stroke-width": ao.sw || 6, fill: "none", "stroke-linecap": "round" }, E.inner);
        const ang = Math.atan2(by - ay, bx - ax), hl = 22;
        const head = Loom.svg("path", { d: `M${bx} ${by} L${(bx - hl * Math.cos(ang - 0.45)).toFixed(1)} ${(by - hl * Math.sin(ang - 0.45)).toFixed(1)} L${(bx - hl * Math.cos(ang + 0.45)).toFixed(1)} ${(by - hl * Math.sin(ang + 0.45)).toFixed(1)} Z`, fill: col }, E.inner);
        E.path = path; E.head = head;
        return E;
      },
      /** a screen-space label above an iso point, with a short leader */
      label(name, x, y, z, text, lo) {
        lo = lo || {};
        const E = el(name, 10000, "text");
        const [px, py] = P(x, y, z);
        // the pill hugs its text: measured at the role's size, plus a real inset (the reading floor)
        const role = lo.role || "label", size = S().size(role);
        const w = lo.w || Math.ceil(Loom.kit.measure(text, role, size, 700) + 64), h = lo.h || Math.round(size * 2.1), ly = py - (lo.lift == null ? 100 : lo.lift);
        Loom.svg("line", { x1: px, y1: py, x2: px, y2: ly + h / 2, stroke: S().c("muted"), "stroke-width": 2 }, E.inner);
        Loom.kit.rect(E.inner, px - w / 2, ly - h / 2, w, h, { fill: lo.fill || "surface", r: h / 2, crisp: true });
        Loom.kit.text(E.inner, text, { role, size, weight: 700, x: px - w / 2 + 24, y: ly - h / 2, w: w - 48, h, align: "center", valign: "middle", maxLines: 1 });
        return E;
      },
      /** sort everything back to front (call once, after building) */
      done() {
        items.sort((a, b) => a.depth - b.depth);
        for (const it of items) host.appendChild(it.E.outer);
        return api;
      },
    };
    return api;
  };
})();
