/* Loom template skins (D-198): each style draws the shared templates its own way.
 *
 * A template is a teaching contract: its parts, their order and the spoken word each one lands on (frame -> structure
 * -> focus -> detail -> consequence, D-100's lead time). How a part is MADE belongs to the style: on a whiteboard the hand
 * draws it, on a blueprint the nib drafts it, in a hologram it is projected as light, on an isometric board it stands up
 * out of the board, in a screencast the product renders it. A style engine supplies that as a skin:
 *
 *   Loom.skins.define("<style id>", {
 *     version: "1", summary: "what a template becomes here",
 *     kit: { rect(S, p, x, y, w, h, o) { ... }, text(S, p, str, o) { ... }, ... },   // the material (record parts)
 *     m:   { count(S, textEl, t, o) { ... } },                                        // verbs it re-reads (optional)
 *     perform(S, items) { ... },                                                     // the entrance, in time order
 *     emphasis(S, textEl, t, o) { ... },                                             // a word marked when spoken
 *     refuse: ["scenario.dialogue"],                                                 // forms that contradict it
 *   });
 *
 * Record, then perform. Under a skin a kit call records a PART on the element that owns its parent node (S.add), and an
 * entrance verb records an ITEM (that element, its time, the verb). When the template has built, every item is handed to
 * the skin's perform in time order, with its parts, so the style's one performer (the hand, the nib) makes the parts in
 * reading order and each one finishes before the next is due (S.schedule). The template's layout moves (kit.vcenter,
 * ctx.shift) happen before the performance, so the performer works where the parts really are.
 *
 * Kept from the classic way: the props, the anchors and the reveal moment (a part STARTS when it appeared before), the
 * elements (exits, holds, joins, the camera, the backplate), real measured text for the checks (a skin hides or reveals
 * the classic text node; it never drops it). A primitive or verb a skin does not cover is drawn the classic way and
 * logged (`skin_fallthrough`); an element with nothing a skin made enters by its classic verb. Loom.report.skins says, per
 * template beat, what each element became (read by the skin_formed check, loom/checks/skins.py).
 *
 * The switch (keep both ways, D-198): the manifest's `template_skin` ("style" on a lesson planned with skins, absent on a
 * lesson made before them) and a scene's own `skin: "classic"`. A skin exists only when its style's engine is in the
 * build, so `"engine": "off"` is the classic templates as before.
 */
// @capability template_skins | style | Loom.skins.define (in an engine file) | The style's engine | a style draws the catalog templates its own way (the hand, the nib, light, the board, the product); templates are unchanged
(function () {
  "use strict";
  const Loom = window.Loom;
  const reg = {};
  // the kit calls that put marks on the page (the rest measure or lay out, and stay the kit's own)
  const DRAWERS = ["rect", "card", "pill", "disc", "line", "path", "arrow", "mark", "icon", "peep", "polygon", "sketch", "kicker", "text", "recipe"];
  // the motion verbs that bring a part on (exits, moves, counts and highlights are not entrances)
  const ENTER = ["reveal", "settle", "pop", "stamp", "drop", "converge", "grow", "draw", "unmask", "iris", "assemble"];
  const MOVERS = ["travel", "along"];

  const owner = (node) => {
    for (let n = node; n && n.nodeType === 1; n = n.parentNode) if (n.__E) return n.__E;
    return null;
  };
  const parentEl = (E) => (E && E.outer && E.outer.parentNode ? owner(E.outer.parentNode) : null);

  Loom.skins = {
    DRAWERS, ENTER,
    define(id, skin) {
      if (!id || typeof id !== "string") throw new Error("Loom.skins.define: a skin needs its style id");
      if (!skin || typeof skin.perform !== "function") throw new Error(`skin ${id}: define(id, {perform(S, items), kit: {...}}) needs a perform function`);
      if (reg[id]) throw new Error(`skin ${id} is defined twice`);
      reg[id] = Object.freeze(Object.assign({ id, version: "1", kit: {}, m: {}, refuse: [] }, skin));
      return reg[id];
    },
    get(id) { return reg[id] || null; },
    list() { return Object.keys(reg).sort(); },
    current() { const pk = Loom.style && Loom.style.pack; return pk && pk.id ? reg[pk.id] || null : null; },
    /** is this template scene drawn by the style's skin? */
    on(def) {
      if (def && def.skin === "classic") return false;
      if (((Loom.manifest || {}).template_skin || "classic") !== "style") return false;
      return !!Loom.skins.current();
    },
    /** build a template: under the skin when it is on, else exactly as before */
    build(ctx, T, props, def, id) {
      const skin = Loom.skins.on(def) ? Loom.skins.current() : null;
      if (!skin) return T.build(ctx, props);
      if (id && skin.refuse.includes(id)) Loom.warn("template_not_this_style", `${ctx.beat.id}: ${id} is a form the ${skin.id} style does not use (its essence avoids it); drawn the ${skin.id} way as far as it goes`, { beat: ctx.beat.id });
      const S = session(ctx, skin, id);
      const keep = { kit: ctx.kit, m: ctx.m }, before = new Set(ctx.g.childNodes);
      ctx.kit = S.kit; ctx.m = S.m;
      try { T.build(ctx, props); } finally { ctx.kit = keep.kit; ctx.m = keep.m; }
      S.added = Array.from(ctx.g.childNodes).filter((n) => !before.has(n));   // what the template put in the scene
      finish(S);
      return S;
    },
  };

  function session(ctx, skin, id) {
    const baseK = Loom.kit, baseM = Loom.motion;
    const S = {
      ctx, skin, id, beat: ctx.beat, baseK, baseM,
      items: [], parts: new Map(), moving: new Set(), taken: new Set(), fall: {}, seq: 0, data: {},
      /** the element that owns a node (the nearest ctx.el) */
      owner,
      /** a part on an element: {kind, node?, ...} in the element's own inner coordinates; returns the part */
      add(E, part) {
        if (!E) return null;
        part.seq = S.seq++;
        if (!S.parts.has(E)) S.parts.set(E, []);
        S.parts.get(E).push(part);
        return part;
      },
      /** where a node's local (0, 0) sits in its element's inner group: the template draws into nested groups too */
      offset(E, node) {
        let x = 0, y = 0;
        for (let n = node; n && n !== E.inner && n.nodeType === 1; n = n.parentNode) {
          const tr = n.getAttribute && n.getAttribute("transform"), mm = tr && /^\s*translate\(\s*([-\d.e]+)[ ,]+([-\d.e]+)\s*\)\s*$/.exec(tr);
          if (mm) { x += +mm[1]; y += +mm[2]; }
        }
        return [x, y];
      },
      /** an item with its own parts at time t (an emphasis, or a part moved off its element's entrance to its word) */
      item(E, t, parts, verb) {
        const it = { E, t, verb: verb || "part", o: {}, seq: S.seq++, fixed: parts.filter(Boolean) };
        for (const p of it.fixed) if (p.seq == null) p.seq = S.seq++;
        S.items.push(it);
        return it;
      },
      /** take a recorded part off its element (to perform it at another time) */
      take(E, pred) {
        const L = S.parts.get(E) || [], i = L.findIndex(pred);
        if (i < 0) return null;
        S.taken.add(E);
        return L.splice(i, 1)[0];
      },
      /** a primitive this skin leaves classic: drawn as before, counted once per beat */
      fallthrough(name) { S.fall[name] = (S.fall[name] || 0) + 1; },
    };
    // ---- the material: the skin's kit over the classic one
    const K = Object.create(baseK);
    for (const name of DRAWERS) {
      if (typeof baseK[name] !== "function" && !skin.kit[name]) continue;
      if (skin.kit[name]) K[name] = (...a) => skin.kit[name](S, ...a);
      else if (typeof baseK[name] === "function") K[name] = (...a) => { S.fallthrough("kit." + name); return baseK[name](...a); };
    }
    for (const [name, fn] of Object.entries(skin.kit)) if (!K.hasOwnProperty(name)) K[name] = (...a) => fn(S, ...a);
    S.kit = K;
    // ---- the entrances: recorded, performed at the end in time order
    const M = Object.create(baseM);
    for (const verb of ENTER) {
      M[verb] = function (target, t, o) {
        if (skin.m[verb]) return skin.m[verb](S, target, t, o);
        return S.enter(target, t, verb, o);
      };
    }
    for (const verb of MOVERS) M[verb] = function (E, ...a) { if (E && E.inner) S.moving.add(E); return baseM[verb](E, ...a); };
    M.highlight = function (textEl, t, o) { return skin.emphasis ? skin.emphasis(S, textEl, t, o || {}) : baseM.highlight(textEl, t, o); };
    for (const [verb, fn] of Object.entries(skin.m)) if (!ENTER.includes(verb)) M[verb] = (...a) => fn(S, ...a);
    S.m = M;
    /** record an entrance; returns when it is expected to end (as the classic verbs' callers expect) */
    S.enter = function (target, t, verb, o) {
      o = o || {};
      const E = target && target.inner ? target : (target && target.__skinE) || owner((target && (target.g || target)) || null);
      if (!E) { S.fallthrough("m." + verb); return baseM[verb](target, t, o); }
      if (E.revealT == null || t < E.revealT) E.revealT = t;
      E.revealKind = skin.id;
      S.items.push({ E, t, verb, o, seq: S.seq++ });
      return t + (o.dur || Loom.style.dur("draw"));
    };
    return S;
  }

  function finish(S) {
    const { ctx, skin } = S;
    // an element with parts and no entrance of its own is made with the nearest element above it that has one
    const own = new Map();
    for (const it of S.items) if (!it.fixed && !own.has(it.E)) own.set(it.E, it);
    for (const [E, parts] of S.parts) {
      if (own.has(E)) continue;
      let up = parentEl(E);
      while (up && !own.has(up)) up = parentEl(up);
      if (up) { for (const p of parts) p.from = E; S.parts.get(up) ? S.parts.get(up).push(...parts) : S.parts.set(up, parts.slice()); S.parts.delete(E); continue; }
      // never revealed by a verb (the template set revealT itself, or nothing): made at its reveal time, said
      const t = E.revealT != null ? E.revealT : ctx.speechStart;
      if (E.revealT == null) Loom.warn("skin_unrevealed", `${ctx.beat.id}: "${E.name}" has parts but no entrance; the ${skin.id} skin makes it at ${t.toFixed(2)}s`, { beat: ctx.beat.id });
      const it = { E, t, verb: "none", o: {}, seq: S.seq++ };
      S.items.push(it); own.set(E, it);
    }
    // a second entrance verb on one element (rare) keeps the first; its parts are already on the first
    // an item with its own parts (an emphasis, a part moved to its word) stands beside its element's entrance
    const items = S.items.filter((it) => it.fixed ? it.fixed.length : own.get(it.E) === it).sort((a, b) => a.t - b.t || a.seq - b.seq);
    const classic = [];
    for (const it of items) {
      it.parts = (it.fixed || S.parts.get(it.E) || []).sort((a, b) => a.seq - b.seq);
      it.moving = S.moving.has(it.E);
      if (!it.parts.length) classic.push(it);
    }
    // an element nothing of the skin's made enters the classic way (an image, a peep, a lottie): said, not hidden
    for (const it of classic) {
      if (S.taken.has(it.E)) continue;   // its parts were moved to their own words: nothing is left to bring on here
      if (it.verb !== "none") Loom.motion[it.verb](it.E, it.t, it.o);
      S.fallthrough("element." + (it.E.kind || "shape"));
    }
    const performed = items.filter((it) => it.parts.length);
    // what the skin did not draw in a performed element (a direct Loom.svg, a classic primitive) comes on with it
    for (const it of performed) if (!it.fixed) it.rest = rest(it.E);
    skin.perform(S, performed);
    for (const it of performed) if (it.rest && it.at != null) {
      for (const g of it.rest) Loom.tween(g, { opacity: 0 }, { opacity: 1, duration: 0.25 }, it.at, { kind: skin.id, beat: ctx.beat.id, name: it.E.name, content: true });
      S.fallthrough("rest");
    }
    const fall = Object.keys(S.fall).filter((k) => k !== "rest");
    if (fall.length) Loom.warn("skin_fallthrough", `${ctx.beat.id}: the ${skin.id} skin drew these the classic way: ${fall.map((k) => `${k} x${S.fall[k]}`).join(", ")}`, { beat: ctx.beat.id });
    (Loom.report.skins = Loom.report.skins || []).push({
      beat: ctx.beat.id, template: S.id, style: skin.id,
      elements: items.map((it) => ({ name: it.E.name, kind: it.E.kind, verb: it.verb, t: +it.t.toFixed(3),
        at: it.at != null ? +it.at.toFixed(3) : null, by: it.by != null ? +it.by.toFixed(3) : null,
        made: it.parts.length ? (it.made || skin.id) : "classic", parts: it.parts.length, light: !!it.light, late: it.at != null ? +(it.at - (it.asked != null ? it.asked : it.t)).toFixed(3) : 0 })),
      fallthrough: Object.assign({}, S.fall),
    });
  }

  /** an element's classic nodes the skin did not make, each wrapped where it is (so the drawing order stays the
   *  template's: an icon drawn on a disc stays on top of the skin's token); the wrappers enter with the element */
  function rest(E) {
    const kids = Array.from(E.inner.childNodes).filter((n) => n.nodeType === 1 && !n.hasAttribute("data-skin") && !(n.classList && n.classList.contains("lm-el")) && n.tagName !== "defs");
    if (!kids.length) return null;
    return kids.map((n) => { const g = Loom.svg("g", { "data-skin": "rest" }, E.inner); E.inner.insertBefore(g, n); g.appendChild(n); return g; });
  }

  /** The one-performer schedule (a hand, a nib): items in time order, each starts at its time (or when the performer is
   *  free), and is fitted to end before the next is due. `natural(it)` is its time at the style's own pace; `light(it)`
   *  (optional) swaps in a lighter form when the window is too short and returns its natural time. Never slower than
   *  natural, at most `maxSpeed` faster; a part that cannot fit starts late and says so. Sets it.at, it.by, it.light. */
  Loom.skins.schedule = function (S, items, o) {
    o = o || {};
    const gap = o.gap == null ? 0.06 : o.gap, maxSpeed = o.maxSpeed || 1.8, end = S.ctx.end;
    let cursor = o.free == null ? -1 : o.free;
    // `open`: a performer that draws starts the first part as the beat's join ends, not at the lead time: a hand needs a
    // second to put a title on an empty board, and the frame read as empty after the join (blameless proof b09, b10,
    // join_blank, 2026-10-16). Only a first part due within 1.5 s of it (the lead time and the speech's offset); a join that continues the frame
    // is left
    if (o.open && items.length) {
      const def = S.ctx.def || {}, jt = (def.join_in || {}).type, jw = def.join_window;
      const at = Math.max(S.ctx.start || 0, 0, jw && jw[1] > jw[0] ? jw[1] : (S.ctx.start || 0)) + 0.05;
      const first = items[0];
      if (jt !== "continue" && first.t > at && first.t - at < 1.5) { first.asked = first.t; first.t = at; }
    }
    items.forEach((it, i) => {
      const start = Math.max(it.t, cursor + gap, S.ctx.start || 0, 0);   // never before the beat (a template may ask for t < 0)
      let next = end;
      for (let j = i + 1; j < items.length; j++) if (items[j].t > start + 0.05) { next = items[j].t; break; }
      const avail = Math.max(0.05, next - start - gap);
      let nat = o.natural(it);
      if (nat > avail * 1.15 && o.light) {
        const ln = o.light(it);
        if (ln != null) { it.light = true; nat = ln; }
      }
      const dur = nat <= avail ? nat : Math.max(avail, nat / maxSpeed);
      it.at = start; it.by = start + dur; it.nat = nat;
      if (dur > avail + 0.02 && i < items.length - 1) Loom.warn("skin_squeezed", `${S.ctx.beat.id}: "${it.E.name}" needs ${nat.toFixed(2)}s to be ${S.skin.id === "whiteboard" ? "drawn" : "made"} and has ${avail.toFixed(2)}s before the next part; it runs into the next`, { beat: S.ctx.beat.id });
      if (start - (it.asked != null ? it.asked : it.t) > 0.4) Loom.warn("skin_late", `${S.ctx.beat.id}: "${it.E.name}" starts ${(start - it.t).toFixed(2)}s after its word (the ${S.skin.id} performer was busy)`, { beat: S.ctx.beat.id });
      cursor = it.by;
    });
    return cursor;
  };

  /** helpers the skins share */
  Loom.skins.textOf = function (node) { return node && node.tagName === "text" ? node : node && node.querySelector ? node.querySelector("text") : null; };
  /** hide a classic text node's paint while keeping it for the checks (the words are drawn another way) */
  Loom.skins.ghostText = function (tn, mark) {
    if (!tn) return;
    tn.setAttribute("fill-opacity", 0);
    tn.setAttribute("data-skin", "text");
    if (mark) tn.setAttribute(mark, "1");
  };
})();
