/* Loom treatments (D-80, D-81): the ESSENTIALS drawn in the lesson's own form.
 *
 * A lesson keeps needing the same kinds of things: a label on a part, a speech or thought bubble, a panel, an
 * icon standing for an object, a tick or a cross. Those are never dropped for having appeared before (D-80).
 * What must not repeat from lesson to lesson is their FORM. The lesson's design seed (style.seed, written by
 * `py -m loom seed <id>`, chosen from its subject and away from the recent lessons) names one treatment per
 * axis, and every builder here draws in that treatment:
 *
 *   const T = Loom.treat;
 *   T.label(ctx, "lbl", { x, y, text: "Cortisol", to: [px, py], tone: "accent", t })     // label on a part
 *   T.bubble(ctx, "say", { x, y, w: 520, text: "Can you send it tonight?", tail: [sx, sy], t })
 *   T.bubble(ctx, "think", { x, y, kind: "thought", text: "...", tail: [hx, hy], t })
 *   const P = T.panel(ctx, "card", { x, y, w, h, title: "What it does", t });  // draw content into P.inner at P.content
 *   T.badge(ctx, "cal", { x, y, icon: "calendar", size: 120, tone: "accent4", t })      // an icon as an object
 *   T.mark(ctx, "ok", { x, y, size: 72, kind: "yes", t })                               // tick (yes) or cross (no)
 *   T.enter(E, t, "panel")        // the seed's entrance family, per role
 *
 * Every builder takes `as` to force one treatment for one call (the person's override), returns an element, and
 * records what it drew in Loom.report.treatments (read by the variety ledger). With no seed, every builder draws
 * the classic treatment, so a lesson without a seed looks exactly as it did (D-70).
 * Option names must match packs/seeds/treatments.json (a test checks both lists).
 */
// @capability treatments | essentials | Loom.treat.label, bubble, panel, badge, mark | Treatments | labels, speech or thought bubbles, panels, badges and ticks drawn in the lesson's own seeded form
(function () {
  "use strict";
  const Loom = window.Loom;
  const S = () => Loom.style;
  const K = () => Loom.kit;
  const svg = (...a) => Loom.svg(...a);
  const T = (Loom.treat = {});
  const f = (v) => Math.round(v * 10) / 10;

  T.OPTIONS = {
    shape: ["round", "angular", "organic", "architectural"],
    label: ["pill", "tag", "ribbon", "underline", "stamp", "flag"],
    bubble: ["round", "comic", "cloud", "note", "chat", "wobble"],
    panel: ["card", "paper", "glass", "frame", "cutout", "bare"],
    icon: ["disc", "bare", "tile", "duotone", "ring", "seal"],
    mark: ["disc", "box", "brush", "stamp"],
    texture: ["none", "grain", "halftone", "hatch", "paper"],
    entrance: ["pop", "draw", "slide", "unfold", "drop", "typeset"],
    camera: ["push", "pan", "cut"],
  };
  T.DEFAULTS = { shape: "round", label: "pill", bubble: "round", panel: "card", icon: "disc", mark: "disc", texture: "none", entrance: "pop", camera: "cut" };
  T.seed = () => (S().pack && S().pack.seed) || null;
  /** D-100: icons are ONE family. A drawn object (Loom.obj) replaces a hero icon only when the lesson opts in
   *  (storyboard `icon_objects: true`) or the call asks (`object: true`). Before, a template mixed a detailed drawn
   *  clock with flat line icons in the same row (phishing b22; L-174). */
  T.iconObjects = () => !!(Loom.manifest && Loom.manifest.icon_objects);
  /** a short stable string for the active seed ("classic" without one): objects and places pick families by it */
  T.seedKey = () => { const s = T.seed(); return s ? Object.keys(s).sort().map((k) => k + "=" + s[k]).join(",") : "classic"; };

  /** the treatment for one axis: the call's `as`, else the seed, else the classic default */
  T.pick = function (axis, o) {
    const want = (o && o.as) || (T.seed() || {})[axis] || T.DEFAULTS[axis];
    if (!T.OPTIONS[axis] || !T.OPTIONS[axis].includes(want)) {
      Loom.error("unknown_treatment", `no ${axis} treatment "${want}" (have: ${(T.OPTIONS[axis] || []).join(", ")})`);
      return T.DEFAULTS[axis];
    }
    return want;
  };
  function record(axis, as, name) {
    (Loom.report.treatments = Loom.report.treatments || []).push({ beat: Loom.ctxBeat && Loom.ctxBeat.id, axis, as, name, seeded: !!T.seed() });
  }

  /* ---------------- tokens and colours ---------------- */
  const FB = { onAccent: "field", surface2: "surface", accent4: "accent", accent3: "accent", accent2: "accent" };
  const tk = (t) => { const p = S().pack.palette; if (t && t in p) return t; return (t && FB[t] && FB[t] in p) ? FB[t] : "accent"; };
  const col = (t) => S().c(tk(t));
  const onCol = (t) => S().on(tk(t));
  /** the lighter and darker of the pack's ink and field: a paper sheet is the light one in every pack */
  function lightDark() {
    const p = S().pack.palette;
    const li = S().contrast(p.ink, "#000000") > S().contrast(p.field, "#000000");
    return li ? { light: p.ink, dark: p.field } : { light: p.field, dark: p.ink };
  }

  T.lightDark = function () { return lightDark(); };
  T.tk = tk;

  /* ---------------- shape language ---------------- */
  function rrD(x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    if (!r) return `M${f(x)} ${f(y)} H${f(x + w)} V${f(y + h)} H${f(x)} Z`;
    return `M${f(x + r)} ${f(y)} H${f(x + w - r)} A${f(r)} ${f(r)} 0 0 1 ${f(x + w)} ${f(y + r)} V${f(y + h - r)} A${f(r)} ${f(r)} 0 0 1 ${f(x + w - r)} ${f(y + h)} H${f(x + r)} A${f(r)} ${f(r)} 0 0 1 ${f(x)} ${f(y + h - r)} V${f(y + r)} A${f(r)} ${f(r)} 0 0 1 ${f(x + r)} ${f(y)} Z`;
  }
  T.rr = function (x, y, w, h, r) { return rrD(x, y, w, h, r); };
  /** the silhouette of a box in a shape language. key seeds the organic wobble (same key, same shape). */
  T.outline = function (x, y, w, h, lang, key, rWant) {
    const R = S().pack.shape.radius || 16;
    lang = lang || T.pick("shape");
    if (w >= 40 && h >= 40) { const RR = (Loom.report.radii = Loom.report.radii || {}), kk = lang === "round" ? "round:" + Math.round(rWant != null ? rWant : Math.min(h / 2, Math.max(R * 1.3, 18))) : lang; RR[kk] = (RR[kk] || 0) + 1; }
    if (lang === "angular") { const c = Math.min(24, h * 0.3, w * 0.2); return `M${f(x + c)} ${f(y)} H${f(x + w)} V${f(y + h - c)} L${f(x + w - c)} ${f(y + h)} H${f(x)} V${f(y + c)} Z`; }
    if (lang === "architectural") return rrD(x, y, w, h, 2);
    if (lang === "organic") {
      const rng = Loom.rng("org:" + (key || "") + ":" + w + "x" + h);
      const r = Math.min(h / 2.4, R * 1.5 + 10), j = () => (rng() - 0.3) * Math.min(30, h * 0.22, w * 0.12);
      return `M${f(x + r)} ${f(y)} Q${f(x + w / 2)} ${f(y - j())} ${f(x + w - r)} ${f(y)} Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)}`
        + ` Q${f(x + w + j())} ${f(y + h / 2)} ${f(x + w)} ${f(y + h - r)} Q${f(x + w)} ${f(y + h)} ${f(x + w - r)} ${f(y + h)}`
        + ` Q${f(x + w / 2)} ${f(y + h + j())} ${f(x + r)} ${f(y + h)} Q${f(x)} ${f(y + h)} ${f(x)} ${f(y + h - r)}`
        + ` Q${f(x - j())} ${f(y + h / 2)} ${f(x)} ${f(y + r)} Q${f(x)} ${f(y)} ${f(x + r)} ${f(y)} Z`;
    }
    return rrD(x, y, w, h, rWant != null ? rWant : Math.min(h / 2, Math.max(R * 1.3, 18)));
  };

  /** fill a silhouette with the pack's shading model (gloss band and rim, toon outline, crescent band, paper edge,
   *  outlined styles draw the edge only). box = the silhouette's bounds, for the shading band. */
  T.body = function (g, d, fillTok, box, o) {
    o = o || {};
    const sh = S().pack.shape, shading = sh.shading;
    const hollow = fillTok === "none";
    if (S().outlined() && !o.crisp) {
      if (shading === "sketch" && window.rough) return K().sketch(g, "path", [d], { fill: hollow ? "none" : fillTok, stroke: o.stroke });
      const neutral = { surface: 1, surface2: 1, field: 1, field2: 1 }[fillTok];
      svg("path", { d, fill: hollow ? "none" : S().c(neutral ? fillTok : "field"), stroke: S().c(o.stroke || (hollow || neutral ? "ink" : tk(fillTok))), "stroke-width": o.sw || sh.stroke, "stroke-linejoin": "round" }, g);
      return g;
    }
    const fill = hollow ? "none" : (o.hex || col(fillTok));
    if (sh.shadow === "offset" && !hollow && o.shadow !== false)
      svg("path", { d, fill: S().c("shadow"), opacity: sh.shadow_opacity || 0.35, transform: `translate(${sh.shadow_dx || 0} ${sh.shadow_dy || 10})`, class: "lm-shadow" }, g);
    svg("path", { d, fill, opacity: o.opacity, stroke: o.stroke ? S().c(o.stroke) : (shading === "toon" && !hollow ? S().c(sh.outline || "ink") : "none"), "stroke-width": o.sw || sh.stroke, "stroke-linejoin": "round" }, g);
    if (hollow || o.flat || !box) return g;
    const id = Loom.uid("lmtr"), cp = svg("clipPath", { id }, g);
    svg("path", { d }, cp);
    const band = Math.min(box.h * 0.22, 24);
    if (shading === "gloss" || shading === "toon" || shading === "crescent")
      svg("rect", { x: box.x - 30, y: box.y + box.h - band, width: box.w + 60, height: band + 30, fill: S().darken(fill, shading === "toon" ? 0.13 : 0.2), opacity: shading === "crescent" ? 0.55 : o.opacity, "clip-path": `url(#${id})` }, g);
    if (shading === "gloss") svg("path", { d, fill: "none", stroke: S().lighten(fill, 0.35), "stroke-width": 2, opacity: 0.45, transform: "translate(0 1)" }, g);
    if (shading === "paper") svg("path", { d, fill: "none", stroke: S().darken(fill, 0.22), "stroke-width": 2, opacity: 0.6 }, g);
    if (shading === "toon") svg("path", { d, fill: "none", stroke: S().c(sh.outline || "ink"), "stroke-width": sh.stroke, "stroke-linejoin": "round" }, g);
    g.__clip = id;
    return g;
  };

  /** the seed's texture inside a filled silhouette (deterministic: seeded by key) */
  T.texture = function (g, d, box, fillHex, key, as) {
    const kind = as || T.pick("texture");
    if (kind === "none" || !box || box.w < 90 || box.h < 50 || S().outlined()) return null;
    const id = Loom.uid("lmtx"), cp = svg("clipPath", { id }, g); svg("path", { d }, cp);
    const tg = svg("g", { "clip-path": `url(#${id})`, class: "lm-texture" }, g);
    const rng = Loom.rng("tex:" + key + ":" + kind);
    const dk = S().darken(fillHex, 0.28), lt = S().lighten(fillHex, 0.3);
    if (kind === "grain") {
      const n = Math.min(260, Math.round(box.w * box.h / 900));
      for (let i = 0; i < n; i++) svg("circle", { cx: f(box.x + rng() * box.w), cy: f(box.y + rng() * box.h), r: f(0.8 + rng() * 1.3), fill: rng() > 0.5 ? dk : lt, opacity: 0.35 }, tg);
    } else if (kind === "halftone") {
      const step = 14;
      for (let y = box.y + box.h; y > box.y + box.h * 0.35; y -= step) for (let x = box.x + box.w; x > box.x + box.w * 0.45; x -= step) {
        const dd = Math.hypot((box.x + box.w - x) / box.w, (box.y + box.h - y) / box.h);
        const r = Math.max(0, 4.2 * (1 - dd * 1.6));
        if (r > 0.4) svg("circle", { cx: f(x), cy: f(y), r: f(r), fill: dk, opacity: 0.5 }, tg);
      }
    } else if (kind === "hatch") {
      const y0 = box.y + box.h * 0.8;
      for (let x = box.x - box.h; x < box.x + box.w; x += 11) svg("line", { x1: f(x), y1: f(box.y + box.h), x2: f(x + box.h * 0.4), y2: f(y0), stroke: dk, "stroke-width": 1.6, opacity: 0.45 }, tg);
    } else if (kind === "paper") {
      const n = Math.round(box.w * box.h / 2600);
      for (let i = 0; i < n; i++) {
        const x = box.x + rng() * box.w, y = box.y + rng() * box.h, l = 6 + rng() * 14, a = rng() * Math.PI;
        svg("path", { d: `M${f(x)} ${f(y)} q${f(Math.cos(a) * l / 2)} ${f(Math.sin(a) * l / 2 - 2)} ${f(Math.cos(a) * l)} ${f(Math.sin(a) * l)}`, fill: "none", stroke: rng() > 0.5 ? dk : lt, "stroke-width": 1, opacity: 0.3 }, tg);
      }
    }
    return tg;
  };

  /* ---------------- entrances: the seed's family, per role ---------------- */
  const FAMILY = {
    pop: { any: "pop", mark: "stamp" },
    draw: { any: "unmask", bubble: "iris", badge: "iris", mark: "stamp", panel: "unmask" },
    slide: { any: "converge", mark: "stamp" },
    unfold: { any: "unmask", panel: "unmaskTTB", bubble: "iris", badge: "pop", mark: "stamp" },
    drop: { any: "drop", panel: "settle", mark: "stamp" },
    typeset: { any: "reveal", label: "unmask", mark: "stamp", badge: "reveal" },
  };
  T.enter = function (E, t, role, o) {
    if (t == null || !E) return;
    o = o || {};
    const fam = T.pick("entrance", o.entrance ? { as: o.entrance } : null);
    const verb = FAMILY[fam][role] || FAMILY[fam].any;
    const M = Loom.motion, opt = { content: o.content !== false, from: o.from };
    if (verb === "unmaskTTB") M.unmask(E, t, Object.assign(opt, { dir: "ttb" }));
    else M[verb](E, t, opt);
    return verb;
  };

  /* ---------------- leads: the line from a label to the part it names ---------------- */
  function lead(ctx, name, as, from, to, tone, t, parent, onPart) {
    const E = ctx.el(name, { x: 0, y: 0, w: 0, h: 0, kind: "connector", parent });
    const [x1, y1] = from, [x2, y2] = to, g = E.inner;
    let shaft;
    if (as === "tag") {
      const mx = (x1 + x2) / 2, my = Math.max(y1, y2) + 40;
      shaft = svg("path", { d: `M${f(x1)} ${f(y1)} Q${f(mx)} ${f(my)} ${f(x2)} ${f(y2)}`, fill: "none", stroke: S().c("line"), "stroke-width": 3, "stroke-linecap": "round" }, g);
      svg("circle", { cx: x2, cy: y2, r: 6, fill: S().c("line") }, g);
    } else if (as === "underline") {
      const ex = x1 + (x2 > x1 ? 30 : -30);
      shaft = svg("path", { d: `M${f(x1)} ${f(y1)} L${f(ex)} ${f(y1)} L${f(x2)} ${f(y2)}`, fill: "none", stroke: col(tone), "stroke-width": 4, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
    } else if (as === "stamp") {
      shaft = svg("path", { d: `M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}`, fill: "none", stroke: col(tone), "stroke-width": 3, "stroke-dasharray": "2 9", "stroke-linecap": "round" }, g);
      svg("path", { d: `M${x2 - 9} ${y2 - 9} L${x2 + 9} ${y2 + 9} M${x2 + 9} ${y2 - 9} L${x2 - 9} ${y2 + 9}`, stroke: col(tone), "stroke-width": 4, "stroke-linecap": "round" }, g);
    } else if (as === "ribbon") {
      shaft = svg("path", { d: `M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}`, fill: "none", stroke: col(tone), "stroke-width": 3, "stroke-linecap": "round" }, g);
      const a = Math.atan2(y2 - y1, x2 - x1), s = 14;
      svg("path", { d: `M${f(x2)} ${f(y2)} L${f(x2 - s * Math.cos(a - 0.45))} ${f(y2 - s * Math.sin(a - 0.45))} L${f(x2 - s * Math.cos(a + 0.45))} ${f(y2 - s * Math.sin(a + 0.45))} Z`, fill: col(tone) }, g);
    } else if (as === "flag") {
      shaft = svg("path", { d: `M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}`, fill: "none", stroke: S().c("ink"), "stroke-width": 5, "stroke-linecap": "round" }, g);
      // the contact shadow belongs to a pole standing on the ground; on a part it capped the part (https-private 92 s:
      // a dark ellipse over the padlock's shackle, D-154)
      if (!onPart) svg("ellipse", { cx: x2, cy: y2 + 2, rx: 16, ry: 5, fill: S().c("shadow"), opacity: 0.4 }, g);
    } else {
      shaft = svg("path", { d: `M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}`, fill: "none", stroke: col(tone), "stroke-width": 4, "stroke-linecap": "round" }, g);
      svg("circle", { cx: x2, cy: y2, r: 7, fill: col(tone) }, g);
    }
    if (t != null) Loom.motion.draw(shaft, t, { dur: 0.32 });
    if (t != null) Array.from(g.children).filter((c) => c !== shaft).forEach((c) => Loom.tween(c, { opacity: 0 }, { opacity: 1, duration: 0.12 }, t + 0.28, { kind: "draw", beat: E.beat, name }));
    return E;
  }

  /* ---------------- label ---------------- */
  /** Draw a label's shape and words into p, centred at (cx, cy). Returns { g, box, anchor } in p's coords; anchor
   *  is where a lead to the part should start. Used by T.label and by Loom.glow.pill when a seed is set. */
  /** the geometry of a label (draws nothing): its box, its full extent (ribbon tails, tilt) and the lead anchor */
  T.labelGeom = function (cx, cy, text, o) {
    o = o || {};
    const as = T.pick("label", o), role = o.role || "label", weight = o.weight || 700;
    const words = as === "stamp" ? String(text).toUpperCase() : String(text);
    const F = K().fit(words, { role, w: o.maxW || 520, maxLines: 1, weight, tracking: as === "stamp" ? "0.08em" : undefined });
    // a stamp's inner rule sits 6 px inside its edge and its caps are tracked: it needs more room (L-150, a Chrome
    // render measured 2 to 5 px where the preview's estimated widths said it fitted)
    const padX = Math.max(18, F.size * 0.6) + (as === "stamp" ? Math.max(12, F.size * 0.45) : 0);
    // stamp height: the inner rule takes 6 px a side, so the words need 6 px more above and below it (L-150: the
    // first fix left 5.9 px vertically, which Chrome reported as "6px, needs 6px")
    const h = Math.round(F.size * 1.55 + 10 + (as === "stamp" ? 18 : 0)), tw = Math.round(F.width + padX * 2);
    // the lead leaves from the edge that faces the part, so it never crosses the words
    const up = o.to && o.to[1] < cy;
    let w = tw, x = cx - tw / 2, y = cy - h / 2, tx = x + padX * 0.5, anchor = [cx, up ? cy - h / 2 : cy + h / 2];
    if (as === "tag") { const notch = h * 0.5; w = tw + notch; x = cx - w / 2; tx = x + notch + padX * 0.5; anchor = [x + notch * 0.62, cy]; }
    if (as === "ribbon") anchor = [cx, up ? y : y + h];
    if (as === "underline") anchor = [x + (o.toSide === "left" ? padX * 0.5 : tw - padX * 0.5), y + h - 5.5];
    if (as === "flag") { w = tw + h * 0.3; anchor = [x, y + 2]; }
    const ext = { x, y, w, h };
    if (as === "ribbon") { ext.x -= h * 0.55; ext.w += h * 1.1; ext.h = h * 1.2; }
    if (as === "stamp") { const m = w * 0.05 + 4; ext.x -= m; ext.y -= m; ext.w += 2 * m; ext.h += 2 * m; }
    return { as, role, weight, words, F, padX, h, tw, w, x, y, tx, anchor, ext };
  };
  T.labelShape = function (p, cx, cy, text, o) {
    o = o || {};
    const k = K(), lang = T.pick("shape"), tone = tk(o.tone || "accent");
    const G0 = T.labelGeom(cx, cy, text, o);
    const { as, role, weight, words, padX, h, tw, w } = G0;
    let { x, y, tx, anchor } = G0, color = onCol(tone);
    const g = svg("g", { class: "lm-label", "data-treatment": as }, p);
    if (as === "pill") {
      T.body(g, rrD(x, y, w, h, h / 2), tone, { x, y, w, h });
    } else if (as === "tag") {
      const notch = h * 0.5;
      const r = lang === "architectural" || lang === "angular" ? 2 : 10;
      const d = `M${f(x)} ${f(cy)} L${f(x + notch)} ${f(y)} H${f(x + w - r)} Q${f(x + w)} ${f(y)} ${f(x + w)} ${f(y + r)} V${f(y + h - r)} Q${f(x + w)} ${f(y + h)} ${f(x + w - r)} ${f(y + h)} H${f(x + notch)} Z`;
      T.body(g, d, tone, { x, y, w, h });
      svg("circle", { cx: f(x + notch * 0.62), cy: f(cy), r: f(h * 0.11), fill: S().c("field") }, g);
    } else if (as === "ribbon") {
      const tail = h * 0.55;
      const dk = S().darken(col(tone), 0.3);
      svg("path", { d: `M${f(x - tail)} ${f(y + h * 0.28)} H${f(x + 8)} V${f(y + h * 1.18)} H${f(x - tail)} L${f(x - tail * 0.55)} ${f(y + h * 0.73)} Z`, fill: dk }, g);
      svg("path", { d: `M${f(x + w + tail)} ${f(y + h * 0.28)} H${f(x + w - 8)} V${f(y + h * 1.18)} H${f(x + w + tail)} L${f(x + w + tail * 0.55)} ${f(y + h * 0.73)} Z`, fill: dk }, g);
      T.body(g, rrD(x, y, w, h, lang === "round" || lang === "organic" ? 6 : 0), tone, { x, y, w, h });
    } else if (as === "underline") {
      color = S().c("ink");
      svg("rect", { x: f(x + padX * 0.5), y: f(y + h - 9), width: f(tw - padX), height: 7, rx: 3.5, fill: col(tone) }, g);
    } else if (as === "stamp") {
      color = col(tone);
      const rot = o.rot != null ? o.rot : -5;
      g.setAttribute("transform", `rotate(${rot} ${f(cx)} ${f(cy)})`);
      svg("rect", { x: f(x), y: f(y), width: f(w), height: f(h), rx: 3, fill: "none", stroke: col(tone), "stroke-width": 4 }, g);
      svg("rect", { x: f(x + 6), y: f(y + 6), width: f(w - 12), height: f(h - 12), rx: 2, fill: "none", stroke: col(tone), "stroke-width": 1.6 }, g);
    } else if (as === "flag") {
      const notch = h * 0.3;
      T.body(g, `M${f(x)} ${f(y)} H${f(x + w)} L${f(x + w - notch)} ${f(cy)} L${f(x + w)} ${f(y + h)} H${f(x)} Z`, tone, { x, y, w, h });
    }
    k.text(g, words, { role, x: tx, y: y + 4, w: tw - padX, h: h - 8, align: "center", valign: "middle", weight, color: as === "underline" ? "ink" : undefined, maxLines: 1, tracking: as === "stamp" ? "0.08em" : undefined });
    const tEl = g.lastChild; if (tEl && as !== "underline") tEl.setAttribute("fill", color);
    g.__box = { x, y, w, h };
    return { g, box: { x, y, w, h }, anchor, as, ext: G0.ext };
  };

  T.label = function (ctx, name, o) {
    o = o || {};
    // the layout guard's planned offset (D-169) moves the label before its lead is drawn, so the lead still meets the part
    const mv = Loom.layout ? Loom.layout.offset(ctx.beat.id, name) : null;
    if (mv) o = Object.assign({}, o, { x: o.x + mv.dx, y: o.y + mv.dy });
    const as = T.pick("label", o);
    record("label", as, name);
    let L = null;
    if (as === "flag" && o.to) {   // a flag's pole stands upright on the part: the flag moves over it, keeping its height
      const g0 = T.labelGeom(o.x, o.y, o.text, Object.assign({}, o, { as }));
      o = Object.assign({}, o, { x: o.to[0] + g0.tw / 2 });
    }
    const oo = Object.assign({}, o, { as, toSide: o.to && o.to[0] < o.x ? "left" : "right" });
    const G0 = T.labelGeom(o.x, o.y, o.text, oo), b = G0.ext;
    // the lead first, so it sits under the label; the flag's pole stands ON the part
    if (o.to) L = lead(ctx, name + ".lead", as, G0.anchor, o.to, o.tone || "accent", o.t, o.parent, true);
    if (as === "flag" && !o.to) L = lead(ctx, name + ".lead", as, G0.anchor, [G0.anchor[0], G0.y + G0.h + 70], o.tone || "accent", o.t, o.parent);
    const pad = 12;
    const E = ctx.el(name, { x: b.x - pad, y: b.y - pad, w: b.w + 2 * pad, h: b.h + 2 * pad, kind: "label", parent: o.parent,
      layoutApplied: true, overlaps: o.overlaps, layout: o.layout });
    T.labelShape(E.inner, o.x - E.x, o.y - E.y, o.text, oo);
    E.lead = L;
    if (o.to) E.__to = o.to;   // the point it names: the guard keeps the label near it and never on it
    T.enter(E, o.t == null ? null : o.t + (L ? 0.22 : 0), "label", o);
    return E;
  };

  /* ---------------- bubble ---------------- */
  function cloudD(x, y, w, h, key) {
    const rng = Loom.rng("cloud:" + key), n = Math.max(7, Math.round((w + h) / 70));
    const cx = x + w / 2, cy = y + h / 2, rx = w / 2, ry = h / 2, pts = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; pts.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
    let d = `M${f(pts[0][0])} ${f(pts[0][1])}`;
    for (let i = 0; i < n; i++) {
      const a = pts[i], b = pts[(i + 1) % n], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      const nx = mx - cx, ny = my - cy, L = Math.hypot(nx, ny) || 1, bulge = (Math.hypot(b[0] - a[0], b[1] - a[1]) * (0.42 + rng() * 0.18));
      d += ` Q${f(mx + nx / L * bulge)} ${f(my + ny / L * bulge)} ${f(b[0])} ${f(b[1])}`;
    }
    return d + " Z";
  }
  T.bubble = function (ctx, name, o) {
    o = o || {};
    const k = K(), thought = o.kind === "thought";
    let as = T.pick("bubble", o);
    record("bubble", as, name);
    const lang = T.pick("shape"), role = o.role || "body";
    const pad = Math.max(26, (S().pack.type[role] || [30])[0] * 0.9) + (as === "cloud" || thought ? 22 : 0);
    const F = k.fit(o.text, { role, w: (o.w || 560) - 2 * pad, maxLines: o.maxLines || 3, weight: o.weight });
    const bw = Math.max(F.width + 2 * pad, 160), bh = F.height + 2 * pad;
    const tail = o.tail || [o.x - bw * 0.3, o.y + bh / 2 + 70];
    if (![o.x, o.y, tail[0], tail[1]].every(Number.isFinite)) Loom.error("treat_bad_point", `bubble "${name}": x, y and tail must be numbers (got ${o.x}, ${o.y}, ${tail})`);
    const M = 30, L0 = o.x - bw / 2, T0 = o.y - bh / 2;
    const ex0 = Math.min(L0, tail[0]) - M, ey0 = Math.min(T0, tail[1]) - M, ex1 = Math.max(L0 + bw, tail[0]) + M, ey1 = Math.max(T0 + bh, tail[1]) + M;
    const E = ctx.el(name, { x: ex0, y: ey0, w: ex1 - ex0, h: ey1 - ey0, kind: "bubble", parent: o.parent });
    const g = E.inner, x = L0 - ex0, y = T0 - ey0, tx = tail[0] - E.x, ty = tail[1] - E.y;
    const fillTok = o.fill || (as === "note" ? "accent2" : as === "chat" ? (o.tone || "accent4") : "surface");
    let d, textColor = null;
    const root = svg("g", { "data-treatment": as }, g);
    // the tail's base: two points on the edge nearest the tail
    const bxm = Math.min(Math.max(tx, x + bw * 0.22), x + bw * 0.78), below = ty > y + bh / 2;
    const ey = below ? y + bh : y, bw2 = Math.min(34, bw * 0.12);
    if (thought) {
      const n = 3;
      for (let i = 0; i < n; i++) {
        const q = (i + 1) / (n + 1), px = bxm + (tx - bxm) * q, py = ey + (ty - ey) * q, r = 16 - i * 4.5;
        T.body(root, `M${f(px - r)} ${f(py)} A${f(r)} ${f(r)} 0 1 0 ${f(px + r)} ${f(py)} A${f(r)} ${f(r)} 0 1 0 ${f(px - r)} ${f(py)} Z`, fillTok, { x: px - r, y: py - r, w: 2 * r, h: 2 * r }, { flat: true });
      }
    }
    if (as === "cloud" || (thought && (as === "round" || as === "wobble"))) {
      d = cloudD(x, y, bw, bh, name);
      T.body(root, d, fillTok, { x, y, w: bw, h: bh });
      as = "cloud";
    } else if (as === "comic") {
      d = T.outline(x, y, bw, bh, lang === "round" || lang === "organic" ? "angular" : lang, name);
      const tailD = `M${f(bxm - bw2)} ${f(ey)} L${f(tx)} ${f(ty)} L${f(bxm + bw2 * 0.6)} ${f(ey)} Z`;
      if (!thought) svg("path", { d: tailD, fill: col(fillTok), stroke: S().c("ink"), "stroke-width": 5, "stroke-linejoin": "round" }, root);
      svg("path", { d, fill: col(fillTok), stroke: S().c("ink"), "stroke-width": 5, "stroke-linejoin": "round" }, root);
      if (!thought) svg("rect", { x: f(bxm - bw2 + 4), y: f(below ? ey - 6 : ey - 2), width: f(bw2 * 1.6 - 6), height: 8, fill: col(fillTok) }, root);
    } else if (as === "note") {
      const rot = o.rot != null ? o.rot : (Loom.hash(name) % 2 ? 2.5 : -2.5), fold = 30;
      root.setAttribute("transform", `rotate(${rot} ${f(x + bw / 2)} ${f(y + bh / 2)})`);
      d = `M${f(x)} ${f(y)} H${f(x + bw)} V${f(y + bh - fold)} L${f(x + bw - fold)} ${f(y + bh)} H${f(x)} Z`;
      svg("path", { d, fill: S().c("shadow"), opacity: 0.3, transform: "translate(6 8)" }, root);
      T.body(root, d, fillTok, { x, y, w: bw, h: bh }, { flat: true });
      svg("path", { d: `M${f(x + bw)} ${f(y + bh - fold)} L${f(x + bw - fold)} ${f(y + bh - fold)} L${f(x + bw - fold)} ${f(y + bh)} Z`, fill: S().darken(col(fillTok), 0.22) }, root);
      svg("rect", { x: f(x + bw / 2 - 46), y: f(y - 14), width: 92, height: 28, fill: S().lighten(col("surface"), 0.5), opacity: 0.55, transform: `rotate(${-rot * 1.6} ${f(x + bw / 2)} ${f(y)})` }, root);
      if (!thought) svg("path", { d: `M${f(bxm)} ${f(ey)} L${f(tx)} ${f(ty)}`, stroke: S().c("line"), "stroke-width": 3, "stroke-dasharray": "3 8", "stroke-linecap": "round", fill: "none" }, g);
    } else if (as === "chat") {
      const r = Math.min(30, bh / 2), sq = 6, left = tx < x + bw / 2;
      d = left
        ? `M${f(x + r)} ${f(y)} H${f(x + bw - r)} A${r} ${r} 0 0 1 ${f(x + bw)} ${f(y + r)} V${f(y + bh - r)} A${r} ${r} 0 0 1 ${f(x + bw - r)} ${f(y + bh)} H${f(x + sq)} Q${f(x)} ${f(y + bh)} ${f(x)} ${f(y + bh - sq)} V${f(y + r)} A${r} ${r} 0 0 1 ${f(x + r)} ${f(y)} Z`
        : `M${f(x + r)} ${f(y)} H${f(x + bw - r)} A${r} ${r} 0 0 1 ${f(x + bw)} ${f(y + r)} V${f(y + bh - sq)} Q${f(x + bw)} ${f(y + bh)} ${f(x + bw - sq)} ${f(y + bh)} H${f(x + r)} A${r} ${r} 0 0 1 ${f(x)} ${f(y + bh - r)} V${f(y + r)} A${r} ${r} 0 0 1 ${f(x + r)} ${f(y)} Z`;
      const cxp = left ? x : x + bw, s = left ? -1 : 1;
      if (!thought) svg("path", { d: `M${f(cxp - s * 2)} ${f(y + bh - 22)} Q${f(cxp + s * 4)} ${f(y + bh)} ${f(cxp + s * 18)} ${f(y + bh + 4)} Q${f(cxp + s * 2)} ${f(y + bh + 2)} ${f(cxp - s * 14)} ${f(y + bh - 2)} Z`, fill: col(fillTok) }, root);
      T.body(root, d, fillTok, { x, y, w: bw, h: bh });
      for (let i = 0; i < 2; i++) svg("path", { d: `M${f((left ? x + 14 : x + bw - 40) + i * 10)} ${f(y + bh + 22)} l5 5 l9 -10`, stroke: S().c("muted"), "stroke-width": 2.6, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round" }, root);
    } else if (as === "wobble") {
      d = T.outline(x, y, bw, bh, "organic", name);
      if (!thought) svg("path", { d: `M${f(bxm - bw2)} ${f(ey)} Q${f((bxm + tx) / 2 - 10)} ${f((ey + ty) / 2)} ${f(tx)} ${f(ty)} Q${f((bxm + tx) / 2 + 14)} ${f((ey + ty) / 2)} ${f(bxm + bw2)} ${f(ey)} Z`, fill: col(fillTok), stroke: S().c("ink"), "stroke-width": 3.2, "stroke-linejoin": "round" }, root);
      svg("path", { d, fill: col(fillTok), stroke: S().c("ink"), "stroke-width": 3.2, "stroke-linejoin": "round" }, root);
      if (!thought) svg("rect", { x: f(bxm - bw2 + 3), y: f(below ? ey - 5 : ey - 2), width: f(bw2 * 2 - 6), height: 7, fill: col(fillTok) }, root);
    } else {   // round (the classic)
      d = rrD(x, y, bw, bh, Math.min(bh / 2, lang === "angular" || lang === "architectural" ? 10 : 34));
      if (!thought) T.body(root, `M${f(bxm - bw2)} ${f(ey)} Q${f(bxm)} ${f(ey + (ty - ey) * 0.5)} ${f(tx)} ${f(ty)} Q${f(bxm + bw2 * 0.4)} ${f(ey + (ty - ey) * 0.4)} ${f(bxm + bw2)} ${f(ey)} Z`, fillTok, null, { flat: true });
      T.body(root, d, fillTok, { x, y, w: bw, h: bh });
    }
    if (d) T.texture(root, d, { x, y, w: bw, h: bh }, col(fillTok), name);
    textColor = S().outlined() ? "ink" : null;
    const tt = k.text(root, o.text, { role, x: x + pad, y: y + pad, w: bw - 2 * pad, h: bh - 2 * pad, align: o.align || "center", valign: "middle", maxLines: o.maxLines || 3, weight: o.weight, color: textColor || undefined });
    if (!textColor) tt.setAttribute("fill", onCol(fillTok));
    E.box = { x: E.x + x, y: E.y + y, w: bw, h: bh };
    T.enter(E, o.t, "bubble", o);
    return E;
  };

  /* ---------------- panel ---------------- */
  T.panel = function (ctx, name, o) {
    o = o || {};
    const k = K(), as = T.pick("panel", o), lang = T.pick("shape");
    record("panel", as, name);
    const { x, y, w, h } = o;
    const E = ctx.el(name, { x, y, w, h, kind: "card", parent: o.parent });
    const g = svg("g", { "data-treatment": as }, E.inner);
    const tone = tk(o.tone || "accent"), fillTok = o.fill || "surface";
    let d = T.outline(0, 0, w, h, lang, name), titleColor = "accent2", ink = null, top = 28;
    if (as === "card") {
      T.body(g, d, fillTok, { x: 0, y: 0, w, h });
      T.texture(g, d, { x: 0, y: 0, w, h }, col(fillTok), name);
    } else if (as === "paper") {
      const LD = lightDark(), fold = Math.min(56, w * 0.14, h * 0.2);
      d = lang === "organic" ? d : `M0 0 H${f(w - fold)} L${f(w)} ${f(fold)} V${f(h)} H0 Z`;
      svg("path", { d, fill: S().c("shadow"), opacity: 0.3, transform: "translate(6 8)" }, g);
      svg("path", { d, fill: S().mix(LD.light, LD.dark, 0.06) }, g);
      if (lang !== "organic") svg("path", { d: `M${f(w - fold)} 0 V${f(fold)} H${f(w)} Z`, fill: S().mix(LD.light, LD.dark, 0.22) }, g);
      for (let yy = 96; yy < h - 30; yy += 46) svg("line", { x1: 30, y1: yy, x2: w - 30, y2: yy, stroke: S().mix(LD.light, LD.dark, 0.14), "stroke-width": 1.5 }, g);
      T.texture(g, d, { x: 0, y: 0, w, h }, S().mix(LD.light, LD.dark, 0.06), name);
      ink = LD.dark; titleColor = null;
    } else if (as === "glass") {
      svg("path", { d, fill: col(fillTok), opacity: 0.38 }, g);
      const id = Loom.uid("lmgl"), cp = svg("clipPath", { id }, g); svg("path", { d }, cp);
      svg("path", { d: `M${f(-w * 0.1)} ${f(h * 0.55)} L${f(w * 0.45)} ${f(-h * 0.1)} L${f(w * 0.62)} ${f(-h * 0.1)} L${f(w * 0.07)} ${f(h * 0.55 + h * 0.2)} Z`, fill: "#FFFFFF", opacity: 0.07, "clip-path": `url(#${id})` }, g);
      svg("path", { d, fill: "none", stroke: S().lighten(col(fillTok), 0.55), "stroke-width": 2.5, opacity: 0.8 }, g);
    } else if (as === "frame") {
      const fy = o.title ? 24 : 0;
      d = T.outline(0, fy, w, h - fy, lang, name);
      svg("path", { d, fill: "none", stroke: S().c("line"), "stroke-width": 1.6, opacity: 0.85 }, g);
      svg("path", { d: T.outline(9, fy + 9, w - 18, h - fy - 18, lang, name + "i"), fill: "none", stroke: S().c("line"), "stroke-width": 1.2, opacity: 0.5 }, g);
      const c = 34;
      [[0, fy, 1, 1], [w, fy, -1, 1], [0, h, 1, -1], [w, h, -1, -1]].forEach(([px, py, sx, sy]) =>
        svg("path", { d: `M${f(px)} ${f(py + sy * c)} V${f(py)} H${f(px + sx * c)}`, fill: "none", stroke: col(tone), "stroke-width": 5, "stroke-linecap": "square" }, g));
    } else if (as === "cutout") {
      svg("path", { d, fill: S().darken(col("field"), 0.35), transform: "translate(8 8)" }, g);
      svg("path", { d, fill: col(tone) }, g);
      T.texture(g, d, { x: 0, y: 0, w, h }, col(tone), name);
      ink = onCol(tone); titleColor = null;
    } else if (as === "bare") {
      svg("rect", { x: 0, y: 0, width: 72, height: 8, rx: 4, fill: col(tone) }, g);
      svg("line", { x1: 0, y1: h, x2: w * 0.6, y2: h, stroke: S().c("line"), "stroke-width": 1.5, opacity: 0.4 }, g);
      top = 26;
    }
    let contentTop = 24;
    if (o.title) {
      const tg = svg("g", {}, g);
      if (as === "frame") {
        const F = k.fit(String(o.title).toUpperCase(), { role: "label", w: w - 120, maxLines: 1, tracking: "0.16em" });
        const pad = Math.max(20, F.size * 0.6), extra = F.size * 0.2;   // tracked caps run wider than the estimate (L-150)
        svg("rect", { x: 40, y: 24 - F.height / 2 - 6, width: F.width + extra + 2 * pad, height: F.height + 12, fill: S().c("field") }, tg);
        k.text(tg, String(o.title).toUpperCase(), { role: "label", x: 40 + pad, y: 24 - F.height / 2, w: F.width + extra, h: F.height + 2, maxLines: 1, tracking: "0.16em", color: tone });
        contentTop = 64;
      } else {
        const tt = k.text(tg, o.title, { role: o.titleRole || "lead", x: 32, y: top, w: w - 64, h: 70, maxLines: 1, color: titleColor || undefined });
        if (ink) tt.setAttribute("fill", ink);
        contentTop = top + (tt.__fit ? tt.__fit.height : 50) + 18;
      }
    }
    E.content = { x: 32, y: contentTop, w: w - 64, h: h - contentTop - 26 };
    E.ink = ink;   // the colour text drawn ON this panel should use (null = the pack's normal choice)
    E.fillHex = as === "paper" ? S().mix(lightDark().light, lightDark().dark, 0.06) : as === "cutout" ? col(tone) : (as === "frame" || as === "bare") ? S().c("field") : col(fillTok);
    E.treatment = as;
    T.enter(E, o.t, "panel", o);
    return E;
  };

  /* ---------------- badge: an icon standing for an object ---------------- */
  function sealD(cx, cy, r, n) {
    let d = "";
    for (let i = 0; i < n * 2; i++) {
      const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.86 : r;
      d += (i ? " L" : "M") + f(cx + Math.cos(a) * rr) + " " + f(cy + Math.sin(a) * rr);
    }
    return d + " Z";
  }
  /** the icon treatment drawn into a group, centred at (cx, cy): used by T.badge and by the templates' icon discs */
  T.badgeShape = function (p, cx, cy, size, icon, toneIn, o) {
    o = o || {};
    const k = K(), as = T.pick("icon", o), lang = T.pick("shape"), name = o.name || icon;
    const r = size / 2, tone = tk(toneIn || "accent");
    const g = svg("g", { "data-treatment": as }, p);
    const c = 0;
    g.setAttribute("transform", `translate(${f(cx)} ${f(cy)})`);
    const ic = (color, sz, stroke) => k.icon(g, icon, { x: c, y: c, size: sz, color, stroke });
    if (as === "disc") {
      k.disc(g, c, c, r, { fill: tone });
      ic(S().outlined() ? "ink" : tk("onAccent"), size * 0.52);
    } else if (as === "bare") {
      svg("ellipse", { cx: c, cy: c + r * 0.86, rx: r * 0.62, ry: r * 0.12, fill: S().c("shadow"), opacity: 0.45 }, g);
      ic(tone, size * 0.86, (S().pack.icons.stroke || 2) * 1.35);
    } else if (as === "tile") {
      const d = T.outline(c - r, c - r, size, size, lang === "organic" ? "round" : lang, name, size * 0.22);
      svg("path", { d, fill: S().darken(col("field"), 0.3), transform: "translate(8 10)" }, g);
      T.body(g, d, o.fill || "surface2", { x: c - r, y: c - r, w: size, h: size });
      ic(tone, size * 0.56);
    } else if (as === "duotone") {
      const bl = Loom.glow && Loom.glow.blobPath ? Loom.glow.blobPath(c + r * 0.14, c + r * 0.12, r * 0.86, { lobes: 6, seed: name, wobble: 0.16 }) : sealD(c, c, r * 0.9, 9);
      svg("path", { d: typeof bl === "string" ? bl : sealD(c, c, r * 0.9, 9), fill: col(tone), opacity: 0.55 }, g);
      ic("ink", size * 0.62, (S().pack.icons.stroke || 2) * 1.25);
    } else if (as === "ring") {
      const C = 2 * Math.PI * (r - 4);
      svg("circle", { cx: c, cy: c, r: r - 4, fill: "none", stroke: col(tone), "stroke-width": 5, "stroke-dasharray": `${f(C * 0.86)} ${f(C * 0.14)}`, transform: `rotate(-60 ${c} ${c})`, "stroke-linecap": "round" }, g);
      svg("circle", { cx: f(c + Math.cos(-0.3) * (r - 4)), cy: f(c + Math.sin(-0.3) * (r - 4)), r: 7, fill: col(tone) }, g);
      ic(tone, size * 0.5);
    } else if (as === "seal") {
      T.body(g, sealD(c, c, r, 12), tone, { x: c - r, y: c - r, w: size, h: size });
      svg("circle", { cx: c, cy: c, r: r * 0.7, fill: "none", stroke: onCol(tone), "stroke-width": 2, opacity: 0.5 }, g);
      ic(S().outlined() ? "ink" : tk("onAccent"), size * 0.44);
    }
    return g;
  };
  T.badge = function (ctx, name, o) {
    o = o || {};
    // a HERO-size icon that stands for an object becomes the drawn object in a seeded lesson (D-83): stock icons
    // stay for small marks. `object: false` keeps the icon; with no seed nothing changes (D-70).
    const objKind = Loom.obj && Loom.obj.forIcon(o.icon);
    if (objKind && T.seed() && (o.object === true || (T.iconObjects() && o.object !== false)) && !o.as && (o.size || 120) >= 100) {
      record("icon", "object", name);
      return Loom.obj.draw(ctx, name, objKind, Object.assign({}, o, { size: (o.size || 120) * 1.15 }));
    }
    const as = T.pick("icon", o);
    record("icon", as, name);
    const size = o.size || 120, r = size / 2, tone = tk(o.tone || "accent");
    const E = ctx.el(name, { x: o.x - r - 16, y: o.y - r - 16, w: size + 32, h: size + 32, kind: "icon", parent: o.parent });
    T.badgeShape(E.inner, r + 16, r + 16, size, o.icon, tone, { as, fill: o.fill, name });
    T.enter(E, o.t, "badge", o);
    return E;
  };

  /* ---------------- mark: tick (yes) or cross (no); the SHAPE differs, never colour alone ---------------- */
  /** a tick or cross drawn into a group, centred at (cx, cy): used by T.mark and by kit.mark in a seeded lesson */
  T.markShape = function (p, yes, cx, cy, size, toneIn, o) {
    o = o || {};
    const as = T.pick("mark", o), s = size / 2, tone = toneIn || (yes ? "pos" : "neg");
    const g = svg("g", { "data-treatment": as, transform: `translate(${f(cx)} ${f(cy)})` }, p), c = 0;
    const under = o.on && o.on.fillHex;
    if (under && as !== "disc" && S().contrast(col(tone), under) < 2.6) svg("circle", { cx: c, cy: c, r: s * 1.05, fill: S().c("field") }, g);
    const tick = (k) => yes ? `M${f(c - k)} ${f(c)} L${f(c - k * 0.2)} ${f(c + k * 0.8)} L${f(c + k * 1.1)} ${f(c - k * 0.8)}` : `M${f(c - k)} ${f(c - k)} L${f(c + k)} ${f(c + k)} M${f(c + k)} ${f(c - k)} L${f(c - k)} ${f(c + k)}`;
    if (as === "disc") {
      K().markClassic(g, yes ? "yes" : "no", c, c, size, { fill: toneIn });
    } else if (as === "box") {
      svg("rect", { x: f(c - s * 0.72), y: f(c - s * 0.72), width: f(s * 1.44), height: f(s * 1.44), rx: 4, fill: "none", stroke: S().c("ink"), "stroke-width": 3.5 }, g);
      svg("path", { d: tick(s * 0.62), fill: "none", stroke: col(tone), "stroke-width": size * 0.14, "stroke-linecap": "round", "stroke-linejoin": "round", transform: `translate(${f(s * 0.12)} ${f(-s * 0.12)}) rotate(-4 ${c} ${c})` }, g);
    } else if (as === "brush") {
      // a tapered stroke: the same path drawn three times, thinner and longer each time (reads as a brush)
      [[0.2, 1], [0.14, 0.92], [0.08, 0.78]].forEach(([wf, op], i) => svg("path", { d: tick(s * (0.66 + i * 0.06)), fill: "none", stroke: col(tone), "stroke-width": f(size * wf), "stroke-linecap": "round", "stroke-linejoin": "round", opacity: op }, g));
    } else if (as === "stamp") {
      const sg = svg("g", { transform: `rotate(${yes ? -8 : 8} ${c} ${c})` }, g);
      svg("circle", { cx: c, cy: c, r: s, fill: "none", stroke: col(tone), "stroke-width": 4 }, sg);
      svg("circle", { cx: c, cy: c, r: s - 7, fill: "none", stroke: col(tone), "stroke-width": 1.6 }, sg);
      svg("path", { d: tick(s * 0.42), fill: "none", stroke: col(tone), "stroke-width": size * 0.1, "stroke-linecap": "round", "stroke-linejoin": "round" }, sg);
    }
    return g;
  };
  T.mark = function (ctx, name, o) {
    o = o || {};
    const as = T.pick("mark", o), yes = o.kind !== "no";
    record("mark", as, name);
    const size = o.size || 72, s = size / 2;
    const E = ctx.el(name, { x: o.x - s - 12, y: o.y - s - 12, w: size + 24, h: size + 24, kind: "mark", parent: o.parent });
    T.markShape(E.inner, yes, s + 12, s + 12, size, o.tone, Object.assign({}, o, { as }));
    T.enter(E, o.t, "mark", o);
    return E;
  };

  /** a card's surface drawn into a group in the seed's panel treatment, restricted to the ones that keep the
   *  caller's text legible (kit.card in a seeded lesson; templates colour their own text): paper and cutout
   *  become a card with their texture or hard shadow, never a light sheet or a saturated block */
  T.surfaceShape = function (p, x, y, w, h, o) {
    o = o || {};
    let as = T.pick("panel", o);
    const lang = T.pick("shape"), fillTok = o.fill || "surface", key = o.key || `${f(x)},${f(y)},${f(w)}`;
    // the classic card in the classic shape language with no texture is exactly kit.rect: a default seed changes nothing here
    if (as === "card" && lang === "round" && T.pick("texture") === "none") return K().rect(p, x, y, w, h, Object.assign({}, o, { fill: fillTok }));
    const d = T.outline(x, y, w, h, lang, key, o.r);
    const g = svg("g", { "data-treatment": "surface:" + as }, p);
    if (as === "glass") {
      svg("path", { d, fill: col(fillTok), opacity: 0.5 }, g);
      svg("path", { d, fill: "none", stroke: S().lighten(col(fillTok), 0.55), "stroke-width": 2.5, opacity: 0.8 }, g);
    } else if (as === "frame") {
      svg("path", { d, fill: S().mix(col(fillTok), S().c("field"), 0.6) }, g);
      svg("path", { d, fill: "none", stroke: S().c("line"), "stroke-width": 1.8, opacity: 0.85 }, g);
      const c = Math.min(30, w * 0.15, h * 0.2);
      [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(([px, py, sx, sy]) =>
        svg("path", { d: `M${f(px)} ${f(py + sy * c)} V${f(py)} H${f(px + sx * c)}`, fill: "none", stroke: col("accent"), "stroke-width": 4, "stroke-linecap": "square" }, g));
    } else if (as === "bare") {
      svg("rect", { x: f(x), y: f(y), width: f(Math.min(72, w * 0.3)), height: 7, rx: 3.5, fill: col("accent") }, g);
      svg("path", { d, fill: col(fillTok), opacity: 0.25 }, g);
    } else {
      if (as === "cutout") svg("path", { d, fill: S().darken(col("field"), 0.35), transform: "translate(8 8)" }, g);
      T.body(g, d, fillTok, { x, y, w, h }, { shadow: o.shadow });
      T.texture(g, d, { x, y, w, h }, col(fillTok), key, as === "paper" ? "paper" : undefined);
    }
    return g;
  };
})();
