/* Loom vendor art (D-88): free, licence-checked illustration sets, placed by reference.
 *
 *   Loom.art.place(ctx, "cup", "fluent:hot-beverage", { x, y, size: 160, colors: "keep", t })   // an element
 *   Loom.art.shape(g, "fluent:laptop", cx, cy, size, { colors: "auto" })                        // into a group
 *
 * The approved sets and their licences are in assets/vendor/SOURCES.json; compose embeds only the art that the
 * scene sources name with a LITERAL reference (`set:name`). colors: "keep" draws the art as made; "auto" maps
 * each of its colours to the nearest token of the style pack (so the art follows the style, like Lottie's auto
 * mode). A missing reference is an error, never a silent gap.
 */
// @capability vendor_art | assets | Loom.art.place(ctx, name, "set:name", {x, y, size, colors, t}) | Vendor art | a licence-checked illustration (a plant, a cup, a food) when no kit object fits; literal set:name references only
(function () {
  "use strict";
  const Loom = window.Loom;
  const S = () => Loom.style;
  const svg = (...a) => Loom.svg(...a);
  const A = (Loom.art = {});
  const f = (v) => Math.round(v * 100) / 100;
  let n = 0;
  function rgb(h) { h = h.replace("#", ""); if (h.length === 3) h = h.split("").map((c) => c + c).join(""); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); }
  function nearestToken(hex) {
    const p = S().pack.palette, c = rgb(hex);
    let best = null, bd = 1e9;
    for (const k in p) {
      if (k === "field" || !/^#/.test(p[k])) continue;
      const q = rgb(p[k]), d = (c[0] - q[0]) ** 2 * 0.3 + (c[1] - q[1]) ** 2 * 0.59 + (c[2] - q[2]) ** 2 * 0.11;
      if (d < bd) { bd = d; best = p[k]; }
    }
    return best || hex;
  }
  A.has = (ref) => !!((Loom.assets.art || {})[ref]);
  /** draw a piece of art centred at (cx, cy), its longer side `size` px */
  A.shape = function (g, ref, cx, cy, size, o) {
    o = o || {};
    const a = (Loom.assets.art || {})[ref];
    if (!a) { Loom.error("art_missing", `no art "${ref}" in this build (approved sets: assets/vendor/SOURCES.json; name it with a literal reference)`); return null; }
    const k = size / Math.max(a.w, a.h);
    const grp = svg("g", { "data-art": ref, transform: `translate(${f(cx - (a.w * k) / 2)} ${f(cy - (a.h * k) / 2)}) scale(${f(k)})` }, g);
    if (a.href) { svg("image", { href: a.href, width: a.w, height: a.h }, grp); }
    else {
      const uid = "art" + (n++) + "_";
      let body = a.body.replace(/id="([^"]+)"/g, (m, id) => `id="${uid}${id}"`).replace(/url\(#([^)]+)\)/g, (m, id) => `url(#${uid}${id})`).replace(/href="#([^"]+)"/g, (m, id) => `href="#${uid}${id}"`);
      // "auto": map every colour in the markup to the nearest style token, before it is parsed (works in any DOM)
      if (o.colors === "auto") body = body.replace(/(fill|stroke|stop-color)="(#[0-9a-fA-F]{3,6})"/g, (m, at, hex) => `${at}="${nearestToken(hex)}"`);
      grp.innerHTML = body;
    }
    (Loom.report.treatments = Loom.report.treatments || []).push({ beat: Loom.ctxBeat && Loom.ctxBeat.id, axis: "art", as: ref, name: o.name || ref, seeded: false });
    return grp;
  };
  /** a piece of art as its own element, with the seed's entrance */
  A.place = function (ctx, name, ref, o) {
    o = o || {};
    const size = o.size || 160, pad = 8;
    const E = ctx.el(name, { x: o.x - size / 2 - pad, y: o.y - size / 2 - pad, w: size + 2 * pad, h: size + 2 * pad, kind: "art", parent: o.parent });
    if (o.shadow !== false) svg("ellipse", { cx: f(size / 2 + pad), cy: f(size + pad), rx: f(size * 0.36), ry: f(size * 0.05), fill: S().c("shadow"), opacity: 0.3 }, E.inner);
    A.shape(E.inner, ref, size / 2 + pad, size / 2 + pad, size, Object.assign({}, o, { name }));
    if (Loom.treat) Loom.treat.enter(E, o.t, "badge", o);
    return E;
  };
})();
