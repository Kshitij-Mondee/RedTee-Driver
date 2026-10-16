/* Loom Lottie (D-54): designer-made After Effects / Lottie animations as elements of a scene.
 *
 * lottie-web (MIT) renders the animation as SVG INSIDE the element, so the camera, joins and exits carry it
 * like anything else. It never plays on its own: every frame is goToAndStop(frame) from the timeline, so a
 * Lottie is a pure function of time like the rest of Loom. Its colours are re-mapped to the style's TOKENS
 * (a brand re-colours it too): either an explicit map {"#2EC4B6": "accent4"} or "auto", which assigns the
 * animation's distinct colours, most used first, to the style's accents.
 *
 *   const E = ctx.lottie("badge", "check_success", { x, y, w: 300, h: 300, at: ctx.cue("it passed"), colors: "auto" });
 *
 * Animations live in assets/lottie/<id>.json (compose bundles the ones a lesson uses into the manifest).
 */
// @capability lottie | media | ctx.lottie(name, id, {at, speed, loop, colors}) | Expressive motion | a designer-made Lottie animation as an element, seeked by the timeline, recoloured to tokens
(function () {
  "use strict";
  const Loom = window.Loom;
  const S = () => Loom.style;
  const L = (Loom.lottie = {});

  const toHex = (k) => "#" + [0, 1, 2].map((i) => Math.round(Math.max(0, Math.min(1, k[i])) * 255).toString(16).padStart(2, "0")).join("").toUpperCase();
  const toVec = (hex) => { const h = hex.replace("#", ""); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255); };

  /** every static colour in the animation: {hex: count}. Animated colours are left as they are (reported). */
  function colours(data) {
    const found = {};
    const walk = (o) => {
      if (Array.isArray(o)) return o.forEach(walk);
      if (!o || typeof o !== "object") return;
      if ((o.ty === "fl" || o.ty === "st" || o.ty === "gf" || o.ty === "gs") && o.c && o.c.a === 0 && Array.isArray(o.c.k)) {
        const hx = toHex(o.c.k); found[hx] = (found[hx] || 0) + 1;
      }
      for (const k in o) if (k !== "c") walk(o[k]);
    };
    walk(data);
    return found;
  }
  L.colours = colours;

  function recolour(data, map) {
    const walk = (o) => {
      if (Array.isArray(o)) return o.forEach(walk);
      if (!o || typeof o !== "object") return;
      if ((o.ty === "fl" || o.ty === "st") && o.c && o.c.a === 0 && Array.isArray(o.c.k)) {
        const tok = map[toHex(o.c.k)];
        if (tok) { const v = toVec(S().c(tok)); o.c.k = [v[0], v[1], v[2], o.c.k[3] == null ? 1 : o.c.k[3]]; }
      }
      for (const k in o) if (k !== "c") walk(o[k]);
    };
    walk(data);
  }

  /** ctx.lottie(name, id, {x, y, w, h, at, speed, loop, colors, exit, parent}) -> element (E.anim is the player). */
  L.place = function (ctx, name, id, o) {
    o = o || {};
    const src = ((Loom.manifest && Loom.manifest.lottie) || {})[id] || (Loom.assets && Loom.assets.lottie && Loom.assets.lottie[id]);
    if (!src) { Loom.error("lottie_missing", `${ctx.beat ? ctx.beat.id + ": " : ""}Lottie "${id}" is not bundled (assets/lottie/${id}.json)`); return null; }
    if (!window.lottie) { Loom.error("lottie_unavailable", "lottie-web is not loaded"); return null; }
    const data = JSON.parse(JSON.stringify(src));
    let map = o.colors;
    if (map === "auto" || map == null) {
      const toks = o.tokens || ["accent", "accent4", "accent2", "accent3", "ink"];
      map = {};
      Object.entries(colours(data)).sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : 1)).forEach(([hx], i) => { map[hx] = toks[i % toks.length]; });
    }
    if (map) recolour(data, map);
    const w = o.w || data.w, h = o.h || data.h;
    const E = ctx.el(name, { x: o.x || 0, y: o.y || 0, w, h, kind: o.kind || "icon", exit: o.exit || "recede", parent: o.parent });
    const holder = Loom.svg("g", { class: "lm-lottie" }, E.inner);
    const anim = window.lottie.loadAnimation({ container: holder, renderer: "svg", loop: false, autoplay: false, animationData: data,
      rendererSettings: { preserveAspectRatio: "xMidYMid meet", progressiveLoad: false, hideOnTransparent: true } });
    const svgEl = holder.querySelector("svg");
    if (svgEl) { svgEl.setAttribute("width", w); svgEl.setAttribute("height", h); svgEl.setAttribute("overflow", "visible"); svgEl.removeAttribute("style"); }
    E.anim = anim;
    const fr = data.fr || 30, frames = (data.op || 60) - (data.ip || 0);
    const speed = o.speed || 1;
    const at = o.at == null ? ctx.speechStart : o.at;
    const dur = frames / fr / speed;
    const loops = o.loop ? Math.max(1, Math.ceil(((o.until || ctx.end) - at) / dur)) : 1;
    anim.goToAndStop(0, true);
    Loom.drive((e, raw) => {
      const f = (raw * loops * frames) % frames;
      anim.goToAndStop(Math.min(frames - 0.001, o.loop ? f : raw * frames), true);
    }, at, dur * loops, "linear", { kind: "lottie", beat: E.beat, name: E.name, content: true });
    Loom.motion.reveal(E, at - 0.05, { dy: 0, dur: 0.15 });
    (Loom.report.lottie = Loom.report.lottie || []).push({ beat: ctx.beat ? ctx.beat.id : null, id, colours: map, frames, fps: fr });
    return E;
  };
})();
