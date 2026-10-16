/* Loom swap-in-place slot (D-114): HOLD THE LAYOUT, CHANGE ITS STATE.
 *
 * TED-Ed films keep one panel, cutaway or held object on screen and change its CONTENTS on the spoken word (one
 * diagram was held 44 s this way). Loom habitually rebuilt a station per beat instead. A slot is a fixed region (an
 * element in the station) whose frame stays still while what is inside it is replaced:
 *
 *   const s = Loom.slot(ctx, "state", { x, y, w: 640, h: 300, frame: "card" | "none" | "badge", align: "center", t })
 *   s.show({ text: "Draft", token: "accent" }, 1.2)                         // first content (the frame arrives with it)
 *   s.show({ text: "In review", token: "accent4" }, 3.0, { how: "flip" })   // old leaves FIRST, then the new arrives
 *   s.show((g, box) => kit.rect(g, box.x, box.y, 80, 80, {}), 5.0, { how: "slide", dir: "left" })   // a drawing
 *   s.show({ object: "document", text: "Signed" }, 6.4, { how: "stamp" })   // Loom.obj object (or icon: "check")
 *   s.relabel("Approved", 8.0)            // same state colour, new words (erase left to right, write left to right)
 *   s.recolour("pos", 9.0)                // the state colour changes; frame and content stay
 *   s.sequence([{ at: 2, content: "One" }, { at: 3.4, content: "Two" }], { rhythm: "accelerate", how: "swap" })
 *   s.clear(t) / s.exit(t)                // content leaves (frame stays) / the whole slot leaves, content first
 *
 * hows: swap (fade with a small rise), flip (card turn about the vertical axis), slide (out one side, in from the
 * other, clipped by the slot), recolour (a plain fade while the state colour carries the change), relabel (wipe),
 * stamp (lands from 1.3x). Every change: the old content's exit takes about 0.6x the new content's entrance and
 * ENDS before the entrance begins, so two contents are never visible at once (lnd-motion-craft "no double
 * exposure"). Exits ease in, entrances ease out; durations come from the pack's motion (S().dur("enter")).
 * Reading floor: a content shown for less than its floor warns `slot_too_fast` (a label of 1 to 3 words 0.8 s; more
 * words 0.3 s a word, at least 1.2 s; a drawing 0.8 s; or the content's own `floor`). The clock runs from the end
 * of its entrance to the start of its exit. A change that would interrupt an entrance is pushed back to the end of
 * that entrance (`slot_overlap`).
 *
 * Report: Loom.report.slots = [{ beat, name, frame, box, contents: [{ i, label, how, words, floor, t_in0, t_in1,
 * t_out0, t_out1, shown }], changes: [{ kind, t, token }] }] so a check can see what each slot showed and when.
 *
 * Determinism: every change is a Loom.tween / Loom.drive at an absolute time. Each content has two nested groups,
 * the outer for its exit and the inner for its entrance, so an exit can never cancel the tween that hides the
 * content before it arrives; the state colour is one keyed drive chain (only the first renders at load). Nothing
 * reads the clock, nothing is random: seeking to any time in any order gives the same picture.
 */
// @capability swap_slot | primitive | Loom.slot(ctx, name, {x, y, w, h}).show, sequence | Primitives from the TED-Ed study | hold the layout and change its contents on the spoken word (swap, flip, slide, recolour, relabel, stamp)
(function () {
  "use strict";
  const Loom = window.Loom;
  const S = () => Loom.style;
  const K = () => Loom.kit;
  const svg = (...a) => Loom.svg(...a);
  const beat = () => (Loom.ctxBeat && Loom.ctxBeat.id) || null;
  const r3 = (v) => (v == null ? null : Math.round(v * 1000) / 1000);
  const HOWS = ["swap", "flip", "slide", "recolour", "relabel", "stamp"];
  // entrance length per how, as a factor of the pack's "enter" duration (the exit is ~0.6x of this)
  const ENTER = { swap: 1, flip: 0.8, slide: 1.1, recolour: 0.9, relabel: 1.2, stamp: 0.7 };
  const FRAMES = ["card", "none", "badge"];

  const countWords = (s) => String(s || "").trim().split(/\s+/).filter(Boolean).length;
  /** the reading floor of one content (lnd-motion-craft "Fast in, then HOLD") */
  function floorOf(words, own) {
    if (own != null) return own;
    if (!words) return 0.8;
    return words <= 3 ? 0.8 : Math.max(1.2, 0.3 * words);
  }
  /** the text TOKEN that reads best on a fill token (kit.text takes tokens, never hex) */
  function onTok(fillTok) {
    if (S().outlined && S().outlined()) return "ink";
    const p = S().pack.palette, fill = S().c(fillTok);
    let best = "ink", bc = 0;
    for (const t of ["ink", "field", "onAccent"]) { if (!(t in p)) continue; const c = S().contrast(fill, p[t]); if (c > bc) { bc = c; best = t; } }
    return best;
  }
  function lc(v) { return String(v || "").trim().toLowerCase(); }

  Loom.slot = function (ctx, name, o) {
    o = o || {};
    const w = o.w || 600, h = o.h || 320;
    let frame = o.frame || "card";
    if (!FRAMES.includes(frame)) { Loom.error("slot_bad_frame", `slot ${name}: frame "${frame}" (use ${FRAMES.join(", ")})`); frame = "card"; }
    const E = ctx.el(name, { x: o.x || 0, y: o.y || 0, w, h, kind: "slot", exit: o.exit || "recede", parent: o.parent });
    const sh = S().pack.shape || {};
    const radius = o.r != null ? o.r : (frame === "badge" ? Math.min(h / 2, (sh.radius || 12) * 2.5) : (sh.radius || 12));
    let curTok = o.token || "accent";

    /* ---- the frame (drawn once, never replaced) ---- */
    const frameG = svg("g", { class: "lm-slot-frame" }, E.inner);
    const accents = [];   // nodes whose fill IS the state colour
    const stripe = frame === "card" && o.stripe !== false ? 12 : 0;
    if (frame === "card") {
      K().card(frameG, 0, 0, w, h, { fill: o.fill || "surface" });
      if (stripe) {
        const id = Loom.uid("slotc");
        const cp = svg("clipPath", { id }, frameG);
        svg("rect", { x: 0, y: 0, width: w, height: h, rx: radius }, cp);
        accents.push(svg("rect", { x: 0, y: 0, width: stripe, height: h, fill: S().c(curTok), "clip-path": `url(#${id})` }, frameG));
      }
    } else if (frame === "badge") {
      const toon = sh.shading === "toon" || sh.shading === "ink" || sh.shading === "line" || sh.shading === "sketch";
      accents.push(svg("rect", { x: 0, y: 0, width: w, height: h, rx: radius, fill: S().c(curTok),
        stroke: toon ? S().c(sh.outline || "ink") : "none", "stroke-width": toon ? (sh.stroke || 3) : 0 }, frameG));
    }
    const pad = o.pad != null ? o.pad : (frame === "none" ? 0 : Math.max(24, Math.round(Math.min(w, h) * 0.09)));
    const box = { x: pad + stripe, y: pad, w: Math.max(10, w - 2 * pad - stripe), h: Math.max(10, h - 2 * pad) };

    /* ---- the content layer, clipped to the slot (a slide never leaves the frame) ---- */
    const cid = Loom.uid("slotk");
    const cdefs = svg("defs", {}, E.inner);
    const ccp = svg("clipPath", { id: cid, clipPathUnits: "userSpaceOnUse" }, cdefs);
    const inset = frame === "none" ? 0 : Math.max(2, (sh.stroke || 2));
    svg("rect", { x: inset, y: inset, width: w - 2 * inset, height: h - 2 * inset, rx: Math.max(0, radius - inset) }, ccp);
    const contentG = svg("g", { class: "lm-slot-content", "clip-path": `url(#${cid})` }, E.inner);

    const rec = { beat: beat(), name, frame, box: { x: E.x, y: E.y, w, h }, contents: [], changes: [] };
    (Loom.report.slots = Loom.report.slots || []).push(rec);

    const st = { cur: null, n: 0, lastT: -Infinity, framed: o.t === false, end: ctx.end };
    if (o.t != null && o.t !== false) { Loom.motion.settle(E, o.t); st.framed = true; }

    /* ---- the state colour: one keyed drive chain ---- */
    function setStateNow(tok) { curTok = tok; for (const a of accents) a.setAttribute("fill", S().c(tok)); }
    function recolourNodes(fromTok, toTok, t, dur, extra) {
      if (fromTok === toTok) return;
      const a = S().c(fromTok), b = S().c(toTok), targets = [];
      for (const n of accents) targets.push([n, "fill", a, b]);
      // anything in the visible content drawn in the state colour follows it (an object, an underline)
      if (st.cur) st.cur.ig.querySelectorAll("[fill],[stroke]").forEach((x) => {
        for (const at of ["fill", "stroke"]) if (lc(x.getAttribute(at)) === lc(a)) targets.push([x, at, a, b]);
      });
      for (const e of extra || []) targets.push(e);
      Loom.drive((e) => { for (const [n, at, c0, c1] of targets) n.setAttribute(at, S().mix(c0, c1, e)); }, t, dur, "editorial",
        { kind: "recolour", beat: beat(), name: name + ".state", content: true, key: name + ".state" });
      curTok = toTok;
    }

    /* ---- drawing one content into its own two groups ---- */
    function draw(content, i) {
      const cg = svg("g", { class: "lm-slot-item", "data-slot": name, "data-slot-i": i }, contentG);
      const ig = svg("g", {}, cg);
      let words = 0, label = "", tok = null, own = null, role = null;
      if (typeof content === "function") {
        content(ig, Object.assign({}, box));
        label = content.slotLabel || "drawing"; own = content.floor == null ? null : content.floor;
      } else {
        const c = typeof content === "string" ? { text: content } : (content || {});
        tok = c.token || null; own = c.floor == null ? null : c.floor; role = c.role || o.role || "title";
        const hasPic = !!(c.object || c.icon || c.draw);
        // a picture with words: side by side in a wide slot, stacked (smaller type) in a tall one
        const wide = box.w >= 1.6 * box.h, both = hasPic && c.text != null && c.text !== "";
        const pw = Math.min(box.h, box.w * 0.36), gap = 24;
        let tb = box, pb = box;
        if (both && wide) { pb = { x: box.x, y: box.y, w: pw, h: box.h }; tb = { x: box.x + pw + gap, y: box.y, w: box.w - pw - gap, h: box.h }; }
        else if (both) { pb = { x: box.x, y: box.y, w: box.w, h: box.h * 0.58 }; tb = { x: box.x, y: box.y + box.h * 0.6, w: box.w, h: box.h * 0.4 }; if (!c.role && role === "hero") role = "title"; }
        if (hasPic) {
          const size = Math.min(pb.w, pb.h) * (c.object ? 0.82 : 0.7), cx = pb.x + pb.w / 2, cy = pb.y + pb.h / 2;
          if (c.draw) c.draw(ig, pb);
          else if (c.object && Loom.obj) Loom.obj.shape(ig, c.object, cx, cy, size, { tone: c.tone || tok || undefined, state: c.state, key: name + "." + i });
          else if (c.icon) K().icon(ig, c.icon, { x: cx, y: cy, size, color: frame === "badge" ? onTok(tok || curTok) : (c.tone || tok || "ink") });
          label = c.object || c.icon || "drawing";
        }
        if (c.text != null && c.text !== "") {
          const col = c.color || (frame === "badge" ? onTok(tok || curTok) : (o.color || "ink"));
          K().text(ig, String(c.text), { x: tb.x, y: tb.y, w: tb.w, h: tb.h, role, align: c.align || (both && wide ? "left" : (o.align || "center")), valign: "middle",
            color: col, maxLines: c.maxLines || o.maxLines || 3, weight: c.weight || o.weight });
          words = countWords(c.text); label = String(c.text);
        }
        if (c.label) label = c.label;
      }
      return { i, cg, ig, words, label, tok, role, floor: floorOf(words, own) };
    }

    const m = (kind, i) => ({ kind, beat: beat(), name: `${name}.${i}`, content: true });
    function clipRect(target, idp) {
      const id = Loom.uid(idp);
      const cp = svg("clipPath", { id, clipPathUnits: "userSpaceOnUse" }, cdefs);
      const pad2 = 12;
      const r = svg("rect", { x: box.x - pad2, y: box.y - pad2, width: box.w + 2 * pad2, height: box.h + 2 * pad2 }, cp);
      r.__b = { x: box.x - pad2, w: box.w + 2 * pad2 };
      target.setAttribute("clip-path", `url(#${id})`);
      return r;
    }
    function dirVec(dir) {
      const d = dir || "left";   // the direction the contents MOVE
      const dx = d === "left" ? -1 : d === "right" ? 1 : 0, dy = d === "up" ? -1 : d === "down" ? 1 : 0;
      return [dx * w * 0.6, dy * h * 0.6];
    }
    function enter(c, t, d, how, so) {
      const E_ = Loom.ease, ig = c.ig;
      if (how === "swap") Loom.tween(ig, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: d, ease: E_.enter }, t, m("reveal", c.i));
      else if (how === "flip") Loom.tween(ig, { opacity: 0, scaleX: 0, transformOrigin: "50% 50%" }, { opacity: 1, scaleX: 1, duration: d, ease: E_.enter }, t, m("reveal", c.i));
      else if (how === "slide") { const [dx, dy] = dirVec(so.dir); Loom.tween(ig, { opacity: 0, x: -dx, y: -dy }, { opacity: 1, x: 0, y: 0, duration: d, ease: E_.enter }, t, m("reveal", c.i)); }
      else if (how === "recolour") Loom.tween(ig, { opacity: 0 }, { opacity: 1, duration: d, ease: E_.enter }, t, m("reveal", c.i));
      else if (how === "relabel") { const r = clipRect(ig, "slotw"); Loom.tween(r, { attr: { width: 0 } }, { attr: { width: r.__b.w }, duration: d, ease: E_.move }, t, m("reveal", c.i)); }
      else if (how === "stamp") Loom.tween(ig, { opacity: 0, scale: 1.3, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: d, ease: E_.enter }, t, m("reveal", c.i));
    }
    function leave(c, t, d, how, so) {
      const E_ = Loom.ease, cg = c.cg, mm = Object.assign(m("exit", c.i), { name: `${name}.${c.i}.out` });
      if (how === "swap") Loom.tween(cg, { opacity: 1, y: 0 }, { opacity: 0, y: -14, duration: d, ease: E_.exit, immediateRender: false }, t, mm);
      else if (how === "flip") Loom.tween(cg, { scaleX: 1, transformOrigin: "50% 50%" }, { scaleX: 0, duration: d, ease: E_.exit, immediateRender: false }, t, mm);
      else if (how === "slide") { const [dx, dy] = dirVec(so.dir); Loom.tween(cg, { opacity: 1, x: 0, y: 0 }, { opacity: 0, x: dx, y: dy, duration: d, ease: E_.exit, immediateRender: false }, t, mm); }
      else if (how === "relabel") { const r = clipRect(cg, "slotx"); Loom.tween(r, { attr: { x: r.__b.x, width: r.__b.w } }, { attr: { x: r.__b.x + r.__b.w, width: 0 }, duration: d, ease: E_.exit, immediateRender: false }, t, mm); }
      else if (how === "stamp") Loom.tween(cg, { opacity: 1, scale: 1, transformOrigin: "50% 50%" }, { opacity: 0, scale: 0.92, duration: d, ease: E_.exit, immediateRender: false }, t, mm);
      else Loom.tween(cg, { opacity: 1 }, { opacity: 0, duration: d, ease: E_.exit, immediateRender: false }, t, mm);
    }
    function closeOut(prev, t, xd) {
      const r = prev.rec;
      r.t_out0 = r3(t); r.t_out1 = r3(t + xd);
      r.shown = r3(t - r.t_in1);
      if (r.shown < prev.floor - 1e-6) Loom.warn("slot_too_fast", `slot ${name}: "${String(prev.label).slice(0, 40)}" is readable for ${r.shown.toFixed(2)} s, under its ${prev.floor.toFixed(2)} s reading floor`, { beat: beat(), slot: name, i: prev.i, shown: r.shown, floor: prev.floor });
    }

    const api = {
      E, box, name,
      get token() { return curTok; },
      /** schedule a content change at t; returns the time the new content has landed */
      show(content, t, so) {
        so = so || {};
        let how = so.how || o.how || "swap";
        if (!HOWS.includes(how)) { Loom.warn("slot_unknown_how", `slot ${name}: how "${how}" (use ${HOWS.join(", ")})`); how = "swap"; }
        if (!(t >= 0)) { Loom.error("bad_time", `slot ${name}: show at non-finite time`); t = 0; }
        if (t < st.lastT) Loom.warn("slot_out_of_order", `slot ${name}: show at ${t} s comes before an earlier change at ${st.lastT} s (schedule changes in time order)`);
        if (!st.framed) { Loom.motion.settle(E, t); st.framed = true; t += S().dur("enter") * 0.5; }   // the frame arrives first
        const ed = S().dur("enter") * ENTER[how] * (so.speed || 1);
        const xd = so.exitDur || ed * 0.6;
        const prev = st.cur;
        let tIn = t;
        if (prev) {
          if (t < prev.rec.t_in1 - 1e-6) {
            Loom.warn("slot_overlap", `slot ${name}: change at ${t.toFixed(2)} s would interrupt the entrance of "${String(prev.label).slice(0, 30)}"; moved to ${prev.rec.t_in1.toFixed(2)} s`, { beat: beat(), slot: name });
            t = prev.rec.t_in1;
          }
          leave(prev, t, xd, how, so);
          closeOut(prev, t, xd);
          tIn = t + xd;   // the old content has GONE before the new begins: no double exposure
        }
        const c = draw(content, st.n);
        enter(c, tIn, ed, how, so);
        // the state colour: the first content sets it; a later one with another token changes it during the swap
        const newTok = c.tok || so.token || null;
        if (!prev && newTok) setStateNow(newTok);
        else if (newTok && newTok !== curTok) { recolourNodes(curTok, newTok, t, (tIn + ed) - t); rec.changes.push({ kind: "recolour", t: r3(t), token: newTok }); }
        c.rec = { i: c.i, label: String(c.label).slice(0, 80), how, words: c.words, floor: r3(c.floor), t_in0: r3(tIn), t_in1: r3(tIn + ed), t_out0: null, t_out1: null, shown: null };
        rec.contents.push(c.rec);
        rec.changes.push({ kind: prev ? how : "first", t: r3(t), token: newTok });
        // a content that cannot reach its floor even if nothing replaces it (the scene ends first)
        // the end that matters is the beat scheduling this change (a slot held into a later beat outlives the beat that
        // built it; comparing with the builder's end warned on every later relabel, found on mfa-explained, 2026-10-06)
        const endNow = Loom.ctxBeat && Loom.ctxBeat.end != null ? Loom.ctxBeat.end : st.end;
        if (endNow != null && endNow - (tIn + ed) < c.floor - 1e-6) Loom.warn("slot_too_fast", `slot ${name}: "${String(c.label).slice(0, 40)}" lands at ${(tIn + ed).toFixed(2)} s and the beat ends at ${endNow} s, under its ${c.floor.toFixed(2)} s floor`, { beat: beat(), slot: name, i: c.i });
        st.cur = c; st.n += 1; st.lastT = t;
        return tIn + ed;
      },
      /** a run of changes on cue words. items: [{at, content, how}]; without `at`, the run is spread over
       *  [so.from, so.to] by rhythm (even | accelerate | decelerate); with `at`, rhythm shapes the swap speed. */
      sequence(items, so) {
        so = so || {};
        const n = items.length, rh = so.rhythm || "even";
        if (!n) return [];
        let times = items.map((it) => it.at);
        if (times.some((v) => v == null)) {
          const a = so.from != null ? so.from : (times[0] != null ? times[0] : 0), b = so.to != null ? so.to : a + n * 1.6;
          const ratio = rh === "accelerate" ? 0.75 : rh === "decelerate" ? 1 / 0.75 : 1;
          const gaps = Array.from({ length: Math.max(0, n - 1) }, (_, k) => Math.pow(ratio, k));
          const tot = gaps.reduce((x, y) => x + y, 0) || 1;
          let acc = a; times = [a];
          for (const g of gaps) { acc += (b - a) * g / tot; times.push(acc); }
        }
        items.forEach((it, k) => {
          const f = n > 1 ? k / (n - 1) : 0;
          const speed = rh === "accelerate" ? 1 - 0.35 * f : rh === "decelerate" ? 1 + 0.35 * f : 1;
          api.show(it.content, times[k], Object.assign({}, so.each || {}, { how: it.how || so.how, dir: it.dir || so.dir, speed: (it.speed || 1) * speed }));
        });
        return times.map(r3);
      },
      /** the state colour changes; the frame and the content stay */
      recolour(token, t, so) {
        so = so || {};
        if (!st.cur) { Loom.warn("slot_empty", `slot ${name}: recolour before any content`); setStateNow(token); return t; }
        const dur = so.dur || S().dur("move") * 2;
        const extra = [];
        if (frame === "badge") {   // text on the badge follows to the colour that reads on the new fill
          const a = S().c(onTok(curTok)), b = S().c(onTok(token));
          if (lc(a) !== lc(b)) st.cur.ig.querySelectorAll("text").forEach((x) => extra.push([x, "fill", a, b]));
        }
        recolourNodes(curTok, token, t, dur, extra);
        rec.changes.push({ kind: "recolour", t: r3(t), token });
        return t + dur;
      },
      /** new words in the same state (erase left to right, then write left to right) */
      relabel(text, t, so) {
        const c = st.cur;
        return api.show({ text, token: null, role: c ? c.role : undefined }, t, Object.assign({ how: "relabel" }, so || {}));
      },
      /** the content leaves; the frame stays (empty) */
      clear(t, so) {
        so = so || {};
        const prev = st.cur; if (!prev) return t;
        const how = so.how || "swap";
        const xd = so.exitDur || S().dur("enter") * ENTER[how] * 0.6;
        if (t < prev.rec.t_in1) t = prev.rec.t_in1;
        leave(prev, t, xd, how, so);
        closeOut(prev, t, xd);
        rec.changes.push({ kind: "clear", t: r3(t), token: null });
        st.cur = null; st.lastT = t;
        return t + xd;
      },
      /** the whole slot leaves: the content first, then the frame (members before their container) */
      exit(t, kind) {
        const t1 = api.clear(t);
        Loom.motion.exit(E, Math.max(t, t1 - S().dur("exit") * 0.3), kind || E.exit);
        return t1 + S().dur("exit");
      },
    };
    return api;
  };
  Loom.slot.HOWS = HOWS;
  Loom.slot.floor = floorOf;
})();
