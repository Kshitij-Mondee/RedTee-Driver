/* Loom magnifier inset and cutaway mask (D-114).
 *
 * TED-Ed films point at a detail without cutting away from the whole: a ring lands on the detail, a leader line
 * runs out of it, and a round inset opens with the detail magnified, while the object stays where it is. And they
 * open a WINDOW in an object to show its inside (the inside of a machine, a cell, a wall) instead of cutting to a
 * new picture. Both here act on things a scene has already drawn, in the station's coordinates:
 *
 *   const mg = Loom.magnify(ctx, "chip", { source: boardE, focus: { x: 620, y: 410, r: 40 }, at: { x: 1300, y: 380, r: 220 },
 *                                          t: 2.0, ring: "accent", out: 7.5 })     // zoom defaults to at.r / focus.r
 *   mg.exit(9.0)                                  // or `out` above: the lens closes, then the leader retracts
 *   const cw = Loom.magnify.cutaway(ctx, "inside", { source: machineE, shape: "rect", win: { x, y, w, h },
 *                                                   reveal: (g, box) => { ...draw the inside in station coords... }, t: 3 })
 *   cw.close(8)                                   // shape: "rect" | "circle" (win {x, y, r}) | an SVG path d (win = its box)
 *
 * The lens shows a LIVE copy of the source: an SVG <use> of the source group, so whatever the source does (an
 * entrance, a recolour, a counter) is seen magnified at the same moment. The copy is clipped by a circle and scaled
 * about the focus point. It is marked data-loom-copy="1" and never goes through kit.text, so the text audits and
 * Loom.report.texts do not count it as new text (and screen-text probes do not see into a <use>).
 * Entrance (motion grammar, connectors draw INTO what follows): the focus ring draws, the leader draws from the
 * ring into the lens, the lens irises open. Exit reverses the order, faster (about 0.6x): the lens closes, the
 * leader retracts into the ring, the ring fades.
 * Report: Loom.report.magnify = [{ beat, name, kind: "lens" | "cutaway", focus, at, zoom, t, out }].
 * Errors: magnify_no_source, magnify_self (the lens would be inside its own source: a <use> of an ancestor).
 *
 * Determinism: every change is a Loom.tween / Loom.drive at an absolute time (the cutaway opening is one keyed
 * drive chain); the <use> is a pure reference, so the copy is whatever the source is at that seek time.
 */
// @capability magnifier_and_cutaway | primitive | Loom.magnify(ctx, name, {source, focus, zoom, t}), Loom.magnify.cutaway | Primitives from the TED-Ed study | point at a detail without cutting away (a lens with a leader line), or open a window into an object
(function () {
  "use strict";
  const Loom = window.Loom;
  const S = () => Loom.style;
  const svg = (...a) => Loom.svg(...a);
  const beat = () => (Loom.ctxBeat && Loom.ctxBeat.id) || null;
  const f1 = (v) => Math.round(v * 10) / 10;
  const XLINK = "http://www.w3.org/1999/xlink";

  function nodeOf(src) { return src && src.outer ? src.outer : src; }
  /** a matrix that maps the source's PARENT space into ctx.g space (identity when the source sits in ctx.g) */
  function parentMatrix(ctx, n) {
    if (!n.parentNode || n.parentNode === ctx.g) return null;
    try {
      const a = ctx.g.getCTM(), b = n.parentNode.getCTM();
      if (!a || !b) return null;
      const m = a.inverse().multiply(b);
      if (Math.abs(m.a - 1) < 1e-6 && Math.abs(m.d - 1) < 1e-6 && Math.abs(m.b) < 1e-6 && Math.abs(m.c) < 1e-6 && Math.abs(m.e) < 1e-6 && Math.abs(m.f) < 1e-6) return null;
      return `matrix(${[m.a, m.b, m.c, m.d, m.e, m.f].map((v) => +v.toFixed(5)).join(" ")})`;
    } catch (e) { return null; }
  }
  // the record itself is pushed (not a copy): exit() fills in `out` later, and a copy would never see it
  const rec = (r) => { r.beat = beat(); (Loom.report.magnify = Loom.report.magnify || []).push(r); };

  Loom.magnify = function (ctx, name, o) {
    o = o || {};
    const src = nodeOf(o.source);
    const a = Object.assign({ x: 1400, y: 400, r: 200 }, o.at || {});
    const f = Object.assign({ x: 0, y: 0 }, o.focus || {});
    if (f.r == null) f.r = a.r / (o.zoom || 3);
    const zoom = o.zoom || a.r / f.r;
    const sw = o.sw || Math.max(4, ((S().pack.shape || {}).stroke || 3) + 2);
    const ringTok = o.ring || "accent";
    const x0 = Math.min(f.x - f.r, a.x - a.r) - sw, y0 = Math.min(f.y - f.r, a.y - a.r) - sw;
    const x1 = Math.max(f.x + f.r, a.x + a.r) + sw, y1 = Math.max(f.y + f.r, a.y + a.r) + sw;
    const E = ctx.el(name, { x: f1(x0), y: f1(y0), w: f1(x1 - x0), h: f1(y1 - y0), kind: "magnify", exit: "none", parent: o.parent });
    const root = svg("g", { transform: `translate(${f1(-x0)} ${f1(-y0)})` }, E.inner);   // station coordinates inside
    if (!src) Loom.error("magnify_no_source", `magnify ${name}: no source element or group`);
    else if (src.contains(E.outer)) Loom.error("magnify_self", `magnify ${name}: the lens is inside its own source; draw the source in its own element`);

    // the focus ring and the leader (drawn into what follows: ring -> lens)
    const focusRing = svg("circle", { cx: f.x, cy: f.y, r: f.r, fill: "none", stroke: S().c(ringTok), "stroke-width": sw, opacity: 0 }, root);
    const dx = a.x - f.x, dy = a.y - f.y, L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L;
    const p0 = [f.x + ux * f.r, f.y + uy * f.r], p1 = [a.x - ux * a.r, a.y - uy * a.r];
    const leader = svg("path", { d: `M${f1(p0[0])} ${f1(p0[1])}L${f1(p1[0])} ${f1(p1[1])}`, fill: "none", stroke: S().c(ringTok), "stroke-width": Math.max(3, sw - 1), "stroke-linecap": "round", opacity: 0 }, root);
    if (L <= f.r + a.r) Loom.warn("magnify_overlap", `magnify ${name}: the lens covers its own focus (move "at" further away)`);

    // the lens: an iris clip around everything; a backing disc, the clipped live copy, the ring
    const defs = svg("defs", {}, root);
    const irisId = Loom.uid("mgi"), clipId = Loom.uid("mgc");
    const iris = svg("circle", { cx: a.x, cy: a.y, r: 0 }, svg("clipPath", { id: irisId, clipPathUnits: "userSpaceOnUse" }, defs));
    svg("circle", { cx: a.x, cy: a.y, r: a.r }, svg("clipPath", { id: clipId, clipPathUnits: "userSpaceOnUse" }, defs));
    const lens = svg("g", { class: "lm-lens", "clip-path": `url(#${irisId})` }, root);
    const sh = S().pack.shape || {};
    if (sh.shadow === "offset") svg("circle", { cx: a.x + (sh.shadow_dx || 0), cy: a.y + (sh.shadow_dy || 10), r: a.r, fill: S().c("shadow"), opacity: sh.shadow_opacity || 0.35, class: "lm-shadow" }, lens);
    svg("circle", { cx: a.x, cy: a.y, r: a.r, fill: S().c(o.backing || "field") }, lens);
    const view = svg("g", { "clip-path": `url(#${clipId})` }, lens);
    const zoomG = svg("g", { transform: `translate(${f1(a.x)} ${f1(a.y)}) scale(${+zoom.toFixed(4)}) translate(${f1(-f.x)} ${f1(-f.y)})` }, view);
    if (src) {
      if (!src.id) src.setAttribute("id", Loom.uid("mgsrc"));
      const pm = parentMatrix(ctx, src);
      const host = pm ? svg("g", { transform: pm }, zoomG) : zoomG;
      const use = svg("use", { href: "#" + src.id, "data-loom-copy": "1" }, host);
      use.setAttributeNS(XLINK, "xlink:href", "#" + src.id);
    }
    const ring = svg("circle", { cx: a.x, cy: a.y, r: a.r, fill: "none", stroke: S().c(ringTok), "stroke-width": sw }, lens);
    if (sh.shading === "toon" || sh.shading === "ink") svg("circle", { cx: a.x, cy: a.y, r: a.r + sw * 0.5, fill: "none", stroke: S().c(sh.outline || "ink"), "stroke-width": Math.max(2, sw * 0.4) }, lens);
    void ring;

    const t = o.t == null ? ctx.start + 0.5 : o.t;
    const k = o.dur ? o.dur / (S().dur("draw") + S().dur("enter") * 1.2) : 1;
    const dRing = S().dur("draw") * 0.45 * k, dLead = S().dur("draw") * 0.55 * k, dIris = S().dur("enter") * 1.2 * k;
    const meta = (kind, part) => ({ kind, beat: beat(), name: `${name}.${part}`, content: kind !== "exit" });
    Loom.motion.draw(focusRing, t, { dur: dRing });
    Loom.motion.draw(leader, t + dRing, { dur: dLead });
    // a dash pattern of "L L" puts a zero-length dash at the far end when hidden, and a round cap paints it as a dot
    // (seen at the lens end before the draw and after the retract): the gap is made longer than the line
    { const Ll = leader.getTotalLength ? leader.getTotalLength() : L; leader.setAttribute("stroke-dasharray", `${Ll} ${Ll + 4 * sw}`); }
    const tLens = t + dRing + dLead * 0.85;
    Loom.tween(iris, { attr: { r: 0 } }, { attr: { r: a.r + sw * 2 }, duration: dIris, ease: Loom.ease.enter }, tLens, meta("iris", "lens"));
    E.revealT = t; E.revealKind = "draw";
    const r = { name, kind: "lens", focus: { x: f.x, y: f.y, r: f1(f.r) }, at: { x: a.x, y: a.y, r: a.r }, zoom: +zoom.toFixed(3), t: +t.toFixed(3), landed: +(tLens + dIris).toFixed(3), out: null };
    rec(r);

    const api = {
      E, lens, leader, focusRing, zoom, landed: tLens + dIris,
      /** the lens closes, then the leader retracts into the ring, then the ring fades; returns when all have gone */
      exit(tx) {
        if (r.out != null) { Loom.warn("magnify_twice", `magnify ${name}: exit called twice`); return tx; }
        // an exit scheduled before the lens has landed is overwritten by the later entrance tween, and the lens then
        // stays open for the rest of the lesson (L-226: mfa-explained b07, open from 62 s to the end). Clamp it to
        // a reading hold after landing and say so.
        const minOut = tLens + dIris + 0.8;
        if (tx < minOut) {
          Loom.warn("magnify_exit_early", `magnify ${name}: exit at ${tx.toFixed(2)} s is before the lens has landed and been read (${minOut.toFixed(2)} s); moved to ${minOut.toFixed(2)} s. Open the lens earlier or hold it into the next beat`);
          tx = minOut;
        }
        const xi = dIris * 0.6, xl = dLead * 0.6, xr = dRing * 0.6;
        Loom.tween(iris, { attr: { r: a.r + sw * 2 } }, { attr: { r: 0 }, duration: xi, ease: Loom.ease.exit }, tx, meta("exit", "lens.out"));
        const Ll = leader.getTotalLength ? leader.getTotalLength() : L;
        Loom.tween(leader, { strokeDashoffset: 0 }, { strokeDashoffset: Ll + sw + 2, duration: xl, ease: Loom.ease.exit }, tx + xi, meta("exit", "leader.out"));
        Loom.tween(focusRing, { opacity: 1 }, { opacity: 0, duration: xr, ease: Loom.ease.exit }, tx + xi + xl * 0.7, meta("exit", "ring.out"));
        E.exitT = tx; E.exitKind = "magnify";
        r.out = +tx.toFixed(3);
        return tx + xi + xl * 0.7 + xr;
      },
    };
    if (o.out != null) api.exit(o.out);
    return api;
  };

  /** a window opens in an object and shows its inside, with an edge outline and a recessed inner rim */
  Loom.magnify.cutaway = function (ctx, name, o) {
    o = o || {};
    const shape = o.shape || "rect";
    const win = Object.assign({}, o.win || {});
    let bx, by, bw, bh;
    if (shape === "circle") { if (win.r == null) win.r = 120; bx = win.x - win.r; by = win.y - win.r; bw = bh = win.r * 2; }
    else { bx = win.x || 0; by = win.y || 0; bw = win.w || 300; bh = win.h || 200; }
    const cx = bx + bw / 2, cy = by + bh / 2;
    const sw = o.sw || Math.max(4, ((S().pack.shape || {}).stroke || 3) + 1);
    const E = ctx.el(name, { x: f1(bx - sw), y: f1(by - sw), w: f1(bw + 2 * sw), h: f1(bh + 2 * sw), kind: "cutaway", exit: "none", parent: o.parent });
    const src = nodeOf(o.source);
    // z order: straight above the source, so whatever was drawn over the object stays over it
    if (src && src.parentNode === E.outer.parentNode && src.nextSibling !== E.outer) src.parentNode.insertBefore(E.outer, src.nextSibling);
    const root = svg("g", { transform: `translate(${f1(-(bx - sw))} ${f1(-(by - sw))})` }, E.inner);
    const radius = o.r != null ? o.r : ((S().pack.shape || {}).radius || 8);
    const mk = (parent, attrs) => {
      if (shape === "circle") return svg("circle", Object.assign({ cx: win.x, cy: win.y, r: win.r }, attrs), parent);
      if (shape === "rect") return svg("rect", Object.assign({ x: bx, y: by, width: bw, height: bh, rx: radius }, attrs), parent);
      return svg("path", Object.assign({ d: shape }, attrs), parent);
    };
    const id = Loom.uid("cut");
    const cpShape = mk(svg("clipPath", { id, clipPathUnits: "userSpaceOnUse" }, svg("defs", {}, root)), {});
    const inside = svg("g", { "clip-path": `url(#${id})` }, root);
    mk(inside, { fill: S().c(o.inside || "surface2") });
    const content = svg("g", { class: "lm-cutaway-inside" }, inside);
    if (typeof o.reveal === "function") o.reveal(content, { x: bx, y: by, w: bw, h: bh });
    else if (o.reveal && o.reveal.outer) content.appendChild(o.reveal.outer);   // an element drawn in station coords
    else if (o.reveal && o.reveal.nodeType === 1) content.appendChild(o.reveal);
    // a recessed rim: a wide soft stroke whose outer half the clip removes (the opening has depth)
    mk(inside, { fill: "none", stroke: S().c(o.rim || "shadow"), "stroke-width": Math.max(14, sw * 3), opacity: 0.35 });
    const edge = mk(root, { fill: "none", stroke: S().c(o.edge || "ink"), "stroke-width": sw, "stroke-linejoin": "round" });
    const scaleAbout = (s) => `translate(${f1(cx)} ${f1(cy)}) scale(${Math.max(0.0001, s).toFixed(4)}) translate(${f1(-cx)} ${f1(-cy)})`;
    const setOpen = (s) => { cpShape.setAttribute("transform", scaleAbout(s)); edge.setAttribute("transform", scaleAbout(s)); edge.setAttribute("opacity", s <= 0.001 ? 0 : 1); };
    const t = o.t == null ? ctx.start + 0.5 : o.t;
    const dur = o.dur || S().dur("enter") * 1.6;
    Loom.drive((e) => setOpen(e), t, dur, "enter", { kind: "cutaway", beat: beat(), name: name + ".open", content: true, key: name + ".cut" });
    E.revealT = t; E.revealKind = "cutaway";
    const r = { name, kind: "cutaway", shape: shape === "rect" || shape === "circle" ? shape : "path", win: { x: f1(bx), y: f1(by), w: f1(bw), h: f1(bh) }, t: +t.toFixed(3), landed: +(t + dur).toFixed(3), out: null };
    rec(r);
    const api = {
      E, inside: content, landed: t + dur,
      /** the window closes (faster than it opened), the object is whole again */
      close(tx) {
        const d = dur * 0.6;
        Loom.drive((e) => setOpen(1 - e), tx, d, "exit", { kind: "exit", beat: beat(), name: name + ".close", key: name + ".cut" });
        E.exitT = tx; E.exitKind = "cutaway"; r.out = +tx.toFixed(3);
        return tx + d;
      },
    };
    if (o.out != null) api.close(o.out);
    return api;
  };
})();
