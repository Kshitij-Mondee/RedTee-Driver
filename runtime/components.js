/* Loom components: small, reusable ELEMENTS (not scenes, not beats).
 *
 * A component fixes an IDEA and a rough OUTLINE (what the element is and how its parts are arranged)
 * and leaves everything else adjustable at the point of use, so a scene author reuses it by passing
 * params instead of regenerating code:
 *   - params    : declared, validated, with defaults for geometry/tokens/timing. CONTENT params (the words
 *                 and numbers shown on screen) never have defaults, so a component can never print
 *                 sample text into a real lesson (RedTee shipped 48 designs doing exactly that).
 *   - slots     : named sub-parts the caller may redraw ({ slots: { icon: (g, p, ctx) => ... } }).
 *   - handles   : use() returns the element and its named parts, so a scene can animate or restyle
 *                 any part afterwards.
 *   - variants  : Loom.component.variant(base, id, { defaults, slots }) makes a local variant inside a
 *                 scene file without touching the library.
 *   - versions  : "id" resolves to the newest version; "id@1" pins one. A breaking change registers a
 *                 new version and keeps the old one, so older lessons re-compose unchanged.
 *
 * Library components live in runtime/components/*.js and are PROMOTED from scene forms that have been
 * built at least `library.promote_after` times AND passed a reuse assessment (see loom/library.py).
 */
// @capability components | library | ctx.use(id, params, {x, y, name}) | ctx | a small library element (a card, a chip) reused instead of redrawn; see catalog_search(query, "component")
(function () {
  "use strict";
  const Loom = window.Loom;
  const REG = (Loom.components = {});            // "id@v" -> def
  const LATEST = {};                              // "id"   -> "id@v"
  const TYPES = { str: "string", number: "number", int: "number", bool: "boolean", token: "string", anchor: "string", enum: "string", list: "object", obj: "object", fn: "function" };

  function checkDef(id, def) {
    const bad = [];
    if (!def.idea) bad.push("idea (one sentence: what the element says)");
    if (!Array.isArray(def.outline) || !def.outline.length) bad.push("outline (the fixed structure, part by part)");
    if (typeof def.build !== "function") bad.push("build(ctx, g, p, slots)");
    for (const [k, spec] of Object.entries(def.params || {})) {
      if (spec.content && spec.default !== undefined)
        Loom.error("component_content_default", `${id}.${k} is content (words/numbers on screen) and must not have a default`);
      if (!TYPES[spec.type]) Loom.error("component_param_type", `${id}.${k}: unknown type ${spec.type}`);
    }
    if (bad.length) Loom.error("component_incomplete", `${id} is missing: ${bad.join(", ")}`);
  }

  /** Register a library component. */
  Loom.component = function (id, def) {
    const v = def.version || 1;
    def.id = id; def.version = v; def.key = `${id}@${v}`;
    checkDef(id, def);
    REG[def.key] = def;
    if (!LATEST[id] || REG[LATEST[id]].version < v) LATEST[id] = def.key;
    return def;
  };
  Loom.component.resolve = function (ref) {
    const key = String(ref).includes("@") ? String(ref) : LATEST[ref];
    return key ? REG[key] : null;
  };
  Loom.component.list = function () { return Object.keys(LATEST).map((k) => REG[LATEST[k]]); };
  /** A local variant: new defaults and/or slots over a base, same idea and outline. */
  Loom.component.variant = function (baseRef, id, o) {
    const base = Loom.component.resolve(baseRef);
    if (!base) { Loom.error("component_unknown", `variant of unknown component ${baseRef}`); return null; }
    o = o || {};
    const params = {};
    for (const [k, spec] of Object.entries(base.params || {})) {
      params[k] = Object.assign({}, spec);
      if (o.defaults && k in o.defaults && !spec.content) params[k].default = o.defaults[k];
    }
    const def = Object.assign({}, base, { id, version: 1, key: `${id}@1`, params, variantOf: base.key, slotDefaults: Object.assign({}, base.slotDefaults || {}, o.slots || {}) });
    REG[def.key] = def; LATEST[id] = def.key;
    return def;
  };

  function resolveParams(def, given) {
    const p = {}, errs = [];
    const spec = def.params || {};
    for (const k of Object.keys(given || {})) {
      if (k === "slots") continue;
      if (!(k in spec)) errs.push(`unknown param "${k}" (declared: ${Object.keys(spec).join(", ")})`);
    }
    for (const [k, s] of Object.entries(spec)) {
      let v = given && given[k] !== undefined ? given[k] : s.default;
      if (v === undefined) { if (s.required || s.content) errs.push(`"${k}" is required`); continue; }
      const want = TYPES[s.type];
      if (want && typeof v !== want) errs.push(`"${k}" must be ${s.type}, got ${typeof v}`);
      if (s.type === "enum" && s.choices && !s.choices.includes(v)) errs.push(`"${k}" = ${v} not in ${s.choices.join("|")}`);
      if (s.type === "token" && typeof v === "string" && !(v in Loom.style.pack.palette) && v !== "none") errs.push(`"${k}" = ${v} is not a style token`);
      p[k] = v;
    }
    return { p, errs };
  }

  /** ctx.use(ref, params, opts) -> { el, parts, p, def }. opts: { name, x, y, w, h, kind, exit, parent }.
   *  With opts.parent (an element or a <g>), the component draws INTO it and no new element is made. */
  Loom.useComponent = function (ctx, ref, params, opts) {
    opts = opts || {};
    const def = Loom.component.resolve(ref);
    if (!def) { Loom.error("component_unknown", `${ctx.beat ? ctx.beat.id + ": " : ""}unknown component ${ref}`); return null; }
    // a component made for some styles only (D-193): an email client is a screencast or an editorial thing, not a hologram
    // one. Used in another style, it is the shared vocabulary a distinct style must not borrow (packs/essence)
    const sid = Loom.style && Loom.style.pack && Loom.style.pack.id;
    if (Array.isArray(def.styles) && def.styles.length && sid && !def.styles.includes(sid))
      Loom.error("component_off_style", `${ctx.beat ? ctx.beat.id + ": " : ""}${def.key} is made for ${def.styles.join(", ")}, not ${sid}: ` +
        `show it in ${sid}'s own way (packs/essence/${sid}.json) instead`);
    const { p, errs } = resolveParams(def, params);
    for (const e of errs) Loom.error("component_params", `${ctx.beat ? ctx.beat.id + ": " : ""}${def.key}: ${e}`);
    const size = def.size ? def.size(p) : { w: p.w || 0, h: p.h || 0 };
    let el = null, g;
    if (opts.parent) g = opts.parent.inner || opts.parent;
    else {
      el = ctx.el(opts.name || def.id, { x: opts.x || 0, y: opts.y || 0, w: opts.w || size.w, h: opts.h || size.h, kind: opts.kind || def.kind || "component", exit: opts.exit || def.exit || "recede", parent: opts.within });
      g = el.inner;
    }
    const slots = Object.assign({}, def.slotDefaults || {}, (params && params.slots) || {});
    for (const k of Object.keys(slots)) if (def.slots && !(k in def.slots)) Loom.error("component_slot", `${def.key}: unknown slot "${k}" (declared: ${Object.keys(def.slots).join(", ")})`);
    // invalid params: report and draw NOTHING (never print "undefined" or a half-built element on a slide)
    const parts = errs.length ? {} : (def.build(ctx, g, p, slots) || {});
    (Loom.report.components = Loom.report.components || []).push({ beat: ctx.beat ? ctx.beat.id : null, component: def.key, variantOf: def.variantOf || null, name: el ? el.name : null });
    return { el, parts, p, def, size };
  };
})();
