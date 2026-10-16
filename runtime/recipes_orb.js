/* Orb recipes (D-139): an AI assistant at work in a lesson's own words, on Loom.orb (runtime/orbs.js), for the topic
 * packs in docs/research/2026-10-08-topic-asset-needs.md section 12. States change on spoken words; every card, tool
 * and chat line is an input.
 *
 *   Loom.orb.toolLoop(ctx, "agent", {x, y, size, tools: ["Search", "Calendar", "Email"], icons: [...],
 *       steps: [{at, state: "solving"}, {at, state: "working", tool: "Calendar"}, {at, state: "searching", tool: 1}],
 *       until, tint, ring, caption})
 *   Loom.orb.retrieval(ctx, "rag", {x, y, size, question, answer, citation, chunks: [{text, source}], cite: 0,
 *       at: {listen, search, compose}, chat: {x, y, w, title, name}, stack: {x, y, w}, from: {x, y}, captions})
 *   Loom.orb.unsure(ctx, "check", {x, y, size, question, answer, flag, at: {compose, check, unsure}, chat, captions})
 *   Loom.orb.approval(ctx, "draft", {x, y, size, title, draft, button, at: {compose, pause, press, work},
 *       panel: {x, y, w}, cursor: true, captions})
 *
 * x, y, size are the orb's square, as Loom.orb. Every word on screen (tool names, chat lines, chunk texts, the citation,
 * the flag, the button label, captions) comes from opts; a recipe draws no word of its own. Captions are optional:
 * steps[i].caption (toolLoop) or captions: {phase: text} (the others), one line under the orb, swapped on the phase.
 * Each recipe keeps one clock (a single Loom.drive from its first time to `until`) that sets every card, light, band
 * and caption from t alone, so any frame is a pure function of t in any seek order. Returns a handle: {orb, ...parts}.
 */
// @capability orb_recipes | motion | Loom.orb.toolLoop, retrieval, unsure, approval (ctx, name, opts) | AI thinking orb | ready AI-assistant moments: an agent's plan, act, observe loop with its tool cards, an answer retrieved from documents with a citation, a fluent answer checked and found unsure, a draft paused for a person's approval
(function () {
  "use strict";
  const Loom = window.Loom;
  if (!Loom || !Loom.orb) return;
  const O = Loom.orb;
  const K = () => Loom.kit;
  const S = () => Loom.style;
  const svg = (t, a, p) => Loom.svg(t, a, p);
  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const smooth = (x) => { x = clamp01(x); return x * x * (3 - 2 * x); };
  const beatOf = (ctx) => ctx.beat && ctx.beat.id;

  /** one clock for a recipe: fn(now) from t0 to t1, a pure function of t; plus a no-op content mark per event, so the
   *  report sees a change where something on screen changes (the clock itself is ambient) */
  function clock(ctx, name, t0, t1, fn, events) {
    fn(t0);
    Loom.drive((_e, p) => fn(t0 + p * (t1 - t0)), t0, Math.max(0.05, t1 - t0), "linear",
      { kind: "ambient", beat: beatOf(ctx), name, key: `orbrecipe.${name}`, content: false });
    for (const t of events || []) if (t != null && isFinite(t)) Loom.drive(() => {}, t, 0.3, "linear", { kind: "swap", beat: beatOf(ctx), name, content: true });
  }
  /** a fade window: 0 before a, up over `fi`, 1 until b, down over `fo` (b null: never down) */
  function win(t, a, b, fi, fo) {
    const up = smooth((t - a) / (fi || 0.25));
    const down = b == null ? 1 : 1 - smooth((t - b) / (fo || 0.2));
    return Math.min(up, down);
  }
  /** an optional caption line under the orb: list [{at, text}] in time order, each shown until the next */
  function captionLine(ctx, name, list, box) {
    list = (list || []).filter((c) => c && c.text);
    if (!list.length) return null;
    const E = ctx.el(name, { x: box.x, y: box.y, w: box.w, h: box.h, kind: "label", exit: "recede" });
    const nodes = list.map((c) => {
      const g = svg("g", { opacity: 0 }, E.inner);
      K().text(g, c.text, { x: 0, y: 0, w: box.w, h: box.h, role: "label", align: "center", valign: "middle", color: "muted" });
      return g;
    });
    return {
      E, times: list.map((c) => c.at),
      // one line at a time: the old one leaves in 0.15 s, then the new one arrives (a crossfade printed both, first strip)
      set(now) { list.forEach((c, i) => { const nx = list[i + 1]; nodes[i].setAttribute("opacity", win(now, c.at + (i ? 0.15 : 0), nx ? nx.at : null, 0.2, 0.15).toFixed(3)); }); },
    };
  }
  function phaseCaptions(o, order, at) {
    const C = o.captions || {};
    return order.filter((k) => C[k] && at[k] != null).map((k) => ({ at: at[k], text: C[k] }));
  }
  function capBox(o, size) {
    const w = Math.max(size, 520);
    return Object.assign({ x: (o.x || 0) + size / 2 - w / 2, y: (o.y || 0) + size + 18, w, h: 56 }, o.caption || {});
  }
  /** the chat's background, redrawn at a new height (the chat hugs its content; a citation chip under the answer
   *  needs more room). Same rect hug() draws; the radius tally is kept honest. */
  function regrowChat(A, H) {
    const bg = A.E.inner.querySelector(".lm-ui-bg");
    if (!bg) return;
    while (bg.firstChild) bg.removeChild(bg.firstChild);
    const R = Loom.report.radii; if (R && R["22"]) R["22"] -= 1;
    K().rect(bg, 0, 0, A.E.w, Math.ceil(H), { fill: "surface", r: 22, crisp: true });
    A.E.h = Math.ceil(H); A.E.outer.setAttribute("data-h", A.E.h);
  }
  function hideUntil(ctx, node, t, name) {
    Loom.tween(node, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: Loom.ease.enter }, t, { kind: "reveal", beat: beatOf(ctx), name, content: true });
  }
  function typeAnswer(ctx, A, key, t, o) {
    const g = A.nodes[key]; if (!g) return t;
    hideUntil(ctx, g, t, `${A.E.name}.${key}`);
    const tx = g.querySelector("text");
    return tx ? Loom.motion.typewriter(tx, t + 0.15, { cps: o.cps || 34 }) : t + 0.3;
  }

  /* ---------------- toolLoop: plan, act, observe, decide again ---------------- */
  O.toolLoop = function (ctx, name, o) {
    o = o || {};
    const size = o.size || 300, x = o.x || 0, y = o.y || 0, cx = x + size / 2, cy = y + size / 2;
    const tools = o.tools || [];
    const steps = (o.steps || []).slice().sort((a, b) => a.at - b.at);
    if (!steps.length) { Loom.error("orb_recipe_empty", `${name}: toolLoop needs steps: [{at, state, tool}]`); return null; }
    const t0 = o.t == null ? steps[0].at : o.t, t1 = o.until == null ? ctx.end : o.until;
    const orb = O(ctx, name, { x, y, size, t: t0, until: t1, tint: o.tint || "accent", speed: o.speed,
      states: steps.map((s) => ({ at: s.at, state: s.state || "working" })) });
    const idx = (v) => (v == null ? -1 : typeof v === "number" ? v : tools.indexOf(v));
    steps.forEach((s) => { if (s.tool != null && idx(s.tool) < 0) Loom.error("orb_recipe_tool", `${name}: step at ${s.at} names tool ${s.tool}, not one of ${tools.join(", ")}`); });
    const lab = S().size("label", o.labelSize || 30), ch = Math.round(lab * 2.3), icS = Math.round(lab * 1.05);
    const beams = ctx.el(name + "_beams", { x: 0, y: 0, w: 1920, h: 1080, kind: "connector", exit: "recede" });
    const n = tools.length;
    const cards = tools.map((label, i) => {
      const ic = o.icons && o.icons[i];
      const w = Math.ceil(K().measure(label, "label", lab, 600) + (ic ? icS + 20 : 0) + 56);
      const a = -Math.PI / 2 + (i / Math.max(1, n)) * Math.PI * 2 + (o.turn || 0);
      const gap = o.ring == null ? 96 : o.ring;
      // the card sits outside the orb on the line from its centre, its nearest edge `gap` from the orb's circle
      const dx = Math.cos(a), dy = Math.sin(a);
      const reach = Math.min(Math.abs(dx) > 1e-6 ? (w / 2) / Math.abs(dx) : Infinity, Math.abs(dy) > 1e-6 ? (ch / 2) / Math.abs(dy) : Infinity);
      const D = size / 2 + gap + reach;
      const ccx = cx + dx * D, ccy = cy + dy * D;
      const E = ctx.el(`${name}_tool_${i}`, { x: Math.round(ccx - w / 2), y: Math.round(ccy - ch / 2), w, h: ch, kind: "card", exit: "recede" });
      const g = svg("g", {}, E.inner);
      K().rect(g, 0, 0, w, ch, { fill: "surface", stroke: "line", sw: 2, r: ch / 2, crisp: true, shadow: false });
      const glow = svg("rect", { x: 0, y: 0, width: w, height: ch, rx: ch / 2, fill: S().c(o.tint || "accent"), opacity: 0 }, g);
      const ring = svg("rect", { x: -3, y: -3, width: w + 6, height: ch + 6, rx: ch / 2 + 3, fill: "none", stroke: S().c(o.tint || "accent"), "stroke-width": 5, opacity: 0 }, g);
      if (ic) K().icon(g, ic, { x: 28 + icS / 2, y: ch / 2, size: icS, color: "ink" });
      K().text(g, label, { x: ic ? 28 + icS + 14 : 28, y: 0, w: w - (ic ? icS + 42 : 28) - 24, h: ch, role: "label", valign: "middle", weight: 600, color: "ink" });
      Loom.motion.reveal(E, t0 + 0.2 + i * 0.12, { dy: 8 });
      // the call: a dotted lead from the orb's edge to the card
      const p0 = [cx + dx * size * 0.38, cy + dy * size * 0.38], p1 = [ccx - dx * (reach + 6), ccy - dy * (reach + 6)];
      const beam = svg("line", { x1: p0[0], y1: p0[1], x2: p1[0], y2: p1[1], stroke: S().c(o.tint || "accent"), "stroke-width": 4, "stroke-linecap": "round", "stroke-dasharray": "2 12", opacity: 0 }, beams.inner);
      return { E, g, glow, ring, beam, len: Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) };
    });
    const cap = captionLine(ctx, name + "_caption", steps.map((s) => ({ at: s.at, text: s.caption })), capBox(o, size));
    const act = (i, now) => {   // how lit tool i is at now: up 0.25 s after its step, down 0.25 s after the next
      let k = -1; for (let j = 0; j < steps.length; j++) if (now >= steps[j].at - 1e-6) k = j;
      if (k < 0) return 0;
      const on = idx(steps[k].tool) === i, was = k > 0 && idx(steps[k - 1].tool) === i;
      const u = (now - steps[k].at) / 0.25;
      if (on) return was ? 1 : smooth(u);
      return was ? 1 - smooth(u) : 0;
    };
    clock(ctx, name, t0, t1, (now) => {
      const a = cards.map((_c, i) => act(i, now)), any = Math.max(0, ...a);
      cards.forEach((c, i) => {
        c.glow.setAttribute("opacity", (0.16 * a[i]).toFixed(3));
        c.ring.setAttribute("opacity", a[i].toFixed(3));
        c.g.setAttribute("opacity", (1 - 0.45 * any * (1 - a[i])).toFixed(3));
        c.beam.setAttribute("opacity", (0.9 * a[i]).toFixed(3));
        c.beam.setAttribute("stroke-dashoffset", (-(now * 40) % 14).toFixed(2));   // the call flows out to the tool
      });
      if (cap) cap.set(now);
    }, steps.map((s) => s.at));
    return { orb, cards: cards.map((c) => c.E), beams, caption: cap && cap.E };
  };

  /* ---------------- retrieval: listen, search the documents, compose with a citation ---------------- */
  O.retrieval = function (ctx, name, o) {
    o = o || {};
    const size = o.size || 300, x = o.x || 0, y = o.y || 0;
    const at = Object.assign({}, o.at || {});
    at.listen = at.listen == null ? (o.t == null ? ctx.start + 0.2 : o.t) : at.listen;
    at.search = at.search == null ? at.listen + 1.2 : at.search;
    const chunks = (o.chunks || []).map((c) => (typeof c === "string" ? { text: c } : c));
    const gap = o.chunkGap || 0.45;
    at.compose = at.compose == null ? at.search + 0.8 + chunks.length * gap : at.compose;
    const t1 = o.until == null ? ctx.end : o.until;
    const orb = O(ctx, name, { x, y, size, t: at.listen, until: t1, tint: o.tint || "accent", speed: o.speed,
      states: [{ at: at.listen, state: "listening" }, { at: at.search, state: "searching" }, { at: at.compose, state: "composing" }] });
    const cb = capBox(o, size);
    const cap = captionLine(ctx, name + "_caption", phaseCaptions(o, ["listen", "search", "compose"], at), cb);
    // the chat: the question, then the answer typed in when the orb composes, then the citation chip under it
    const ch = Object.assign({ x: x + size + 90, y, w: Math.min(1100, 1920 - (x + size + 90) - 96) }, o.chat || {});
    const msgs = [{ side: "me", text: o.question || "" }, { side: "them", name: ch.name, text: o.answer || "" }];
    const A = Loom.ui.chat(ctx, name + "_chat", { x: ch.x, y: ch.y, w: ch.w, title: ch.title, messages: msgs, display: ch.display });
    Loom.motion.reveal(A.E, at.listen, { dy: 10 });
    const typed = typeAnswer(ctx, A, "msg_1", at.compose + 0.3, o);
    let chip = null;
    if (o.citation) {
      const bub = A.parts.msg_1, cs = S().size("label", 27), chH = Math.round(cs * 1.9), icS = Math.round(cs * 0.95);
      const cw = Math.min(A.E.w - 2 * bub.x, Math.ceil(K().measure(o.citation, "label", cs, 600) + icS + 64));
      const cyy = bub.y + bub.h + 14;
      chip = svg("g", { class: "lm-ui-part", "data-part": "citation" }, A.E.inner);
      K().rect(chip, bub.x, cyy, cw, chH, { fill: "surface2", stroke: o.tint || "accent", sw: 2, r: chH / 2, crisp: true, shadow: false });
      K().icon(chip, o.citeIcon || "file-text", { x: bub.x + 24 + icS / 2, y: cyy + chH / 2, size: icS, color: o.tint || "accent" });
      K().text(chip, o.citation, { x: bub.x + 36 + icS, y: cyy, w: cw - icS - 52, h: chH, role: "label", valign: "middle", weight: 600, size: cs, color: "ink" });
      A.parts.citation = { x: bub.x, y: cyy, w: cw, h: chH }; A.nodes.citation = chip;
      regrowChat(A, cyy + chH + Math.round(A.E.w * 0.05));
      Loom.tween(chip, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.35, ease: Loom.ease.enter }, typed + 0.15, { kind: "reveal", beat: beatOf(ctx), name: name + "_chat.citation", content: true });
    }
    // the chunks: each flies in from `from` (the scene's cabinet or library) to its place in the stack
    const st = Object.assign({ x: x + size / 2 - 260, y: cb.y + cb.h + 22, w: 520 }, o.stack || {});
    const from = Object.assign({ x: -420, y: st.y + 40 }, o.from || {});
    const cS = S().size("label", 26), sS = S().size("label", 24);
    let yy = st.y;
    const parts = chunks.map((c, i) => {
      const f = K().fit(c.text, { role: "label", size: cS, w: st.w - 92, maxLines: 2 });
      const h = Math.round(f.height + (c.source ? sS * 1.4 : 0) + 30);
      const E = ctx.el(`${name}_chunk_${i}`, { x: st.x, y: yy, w: st.w, h, kind: "card", exit: "recede" });
      const g = svg("g", { opacity: 0 }, E.inner);
      K().rect(g, 0, 0, st.w, h, { fill: "surface", stroke: "line", sw: 2, r: 12, crisp: true, shadow: false });
      const hi = svg("rect", { x: -3, y: -3, width: st.w + 6, height: h + 6, rx: 14, fill: "none", stroke: S().c(o.tint || "accent"), "stroke-width": 5, opacity: 0 }, g);
      K().icon(g, "file-text", { x: 40, y: 15 + cS * 0.7, size: cS * 1.1, color: "muted" });
      K().text(g, c.text, { x: 70, y: 14, w: st.w - 92, h: f.height + 4, role: "label", size: cS, maxLines: 2, color: "ink" });
      if (c.source) K().text(g, c.source, { x: 70, y: 14 + f.height + 2, w: st.w - 92, h: sS * 1.35, role: "label", size: sS, color: "muted" });
      const t = at.search + 0.35 + i * gap;
      const ox = from.x - st.x, oy = from.y - yy;
      Loom.drive((e, raw) => {
        const u = 1 - e, mx = ox * 0.45, my = oy * 0.45 - 160;   // a gentle arc over the top
        const px = u * u * ox + 2 * u * e * mx, py = u * u * oy + 2 * u * e * my, s = 0.7 + 0.3 * e;
        g.setAttribute("transform", `translate(${px.toFixed(1)} ${py.toFixed(1)}) scale(${s.toFixed(3)})`);
        g.setAttribute("opacity", clamp01(raw * 4).toFixed(3));
      }, t, 0.7, "move", { kind: "travel", beat: beatOf(ctx), name: `${name}_chunk_${i}`, key: `orbrecipe.${name}.chunk${i}`, content: true });
      yy += h + 18;
      return { E, hi, h };
    });
    const citeAt = typed + 0.15;
    let wire = null;
    // cite: the index (or indices) of the chunk(s) the citation comes from; they light when the chip arrives
    const cites = (o.cite == null ? (o.citation && parts.length ? [0] : []) : [].concat(o.cite)).filter((i) => parts[i]);
    const ci = cites.length ? cites[0] : -1;
    if (chip && parts[ci] && o.wire !== false) {
      const P = parts[ci].E, c0 = A.parts.citation;
      wire = Loom.ui.wire(ctx, name + "_wire", { x: P.x + P.w, y: P.y + parts[ci].h / 2 }, { x: A.E.x + c0.x, y: A.E.y + c0.y + c0.h / 2 }, citeAt + 0.2, { tone: o.tint || "accent", hold: o.wireHold == null ? 1.4 : o.wireHold });
    }
    clock(ctx, name, at.listen, t1, (now) => {
      parts.forEach((p, i) => p.hi.setAttribute("opacity", (cites.includes(i) ? win(now, citeAt + 0.1 * cites.indexOf(i), null, 0.3) : 0).toFixed(3)));
      if (cap) cap.set(now);
    }, [at.search, at.compose, citeAt]);
    return { orb, chat: A, chunks: parts.map((p) => p.E), wire, caption: cap && cap.E, typedAt: typed, citeAt };
  };

  /* ---------------- unsure: fluent, checked, not grounded ---------------- */
  O.unsure = function (ctx, name, o) {
    o = o || {};
    const size = o.size || 300, x = o.x || 0, y = o.y || 0;
    const at = Object.assign({}, o.at || {});
    at.compose = at.compose == null ? (o.t == null ? ctx.start + 0.2 : o.t) : at.compose;
    const t1 = o.until == null ? ctx.end : o.until;
    let A = null, typed = at.compose + 1;
    if (o.answer) {
      const ch = Object.assign({ x: x + size + 90, y, w: Math.min(1100, 1920 - (x + size + 90) - 96) }, o.chat || {});
      const msgs = (o.question ? [{ side: "me", text: o.question }] : []).concat([{ side: "them", name: ch.name, text: o.answer }]);
      A = Loom.ui.chat(ctx, name + "_chat", { x: ch.x, y: ch.y, w: ch.w, title: ch.title, messages: msgs, display: ch.display });
      Loom.motion.reveal(A.E, at.compose - 0.1, { dy: 10 });
      typed = typeAnswer(ctx, A, `msg_${msgs.length - 1}`, at.compose + 0.2, o);
    }
    at.check = at.check == null ? typed + 0.6 : at.check;
    at.unsure = at.unsure == null ? at.check + 2.6 : at.unsure;
    const scan = o.scan || 2.6;
    const orb = O(ctx, name, { x, y, size, t: at.compose, until: t1, tint: o.tint || "accent", speed: o.speed, scan,
      states: [{ at: at.compose, state: "composing" }, { at: at.check, state: "checking" }, { at: at.unsure, state: "unsure" }] });
    const cap = captionLine(ctx, name + "_caption", phaseCaptions(o, ["compose", "check", "unsure"], at), capBox(o, size));
    let band = null, outline = null, flag = null, key = null, claim = null;
    if (A) {
      key = `msg_${(o.question ? 1 : 0)}`;
      const b = A.parts[key], g = A.nodes[key];
      claim = { x: A.E.x + b.x, y: A.E.y + b.y, w: b.w, h: b.h };
      // the check: a band that sweeps the answer in step with the orb's scan ring, clipped to the bubble
      const id = Loom.uid("orbck");
      const cp = svg("clipPath", { id }, svg("defs", {}, A.E.inner)); svg("rect", { x: b.x, y: b.y, width: b.w, height: b.h, rx: 22 }, cp);
      const bg = svg("g", { "clip-path": `url(#${id})` }, null); g.insertBefore(bg, g.firstChild.nextSibling);
      band = svg("rect", { x: b.x, y: b.y, width: b.w, height: Math.max(24, b.h * 0.34), fill: S().c(o.tint || "accent"), opacity: 0 }, bg);
      outline = svg("rect", { x: b.x - 6, y: b.y - 6, width: b.w + 12, height: b.h + 12, rx: 26, fill: "none", stroke: S().c(o.flagTone || "muted"), "stroke-width": 3, "stroke-dasharray": "10 8", opacity: 0 }, A.E.inner);
      if (o.flag) {   // the flag sits under the answer (the chat grows to hold it), like a citation chip
        const fs = S().size("label", 26), fh = Math.round(fs * 1.8), fic = Math.round(fs * 0.95);
        const fw = Math.min(A.E.w - 2 * b.x, Math.ceil(K().measure(o.flag, "label", fs, 600) + fic + 56));
        flag = svg("g", { opacity: 0 }, A.E.inner);
        const fx = b.x, fy = b.y + b.h + 14;
        K().rect(flag, fx, fy, fw, fh, { fill: "surface", stroke: o.flagTone || "muted", sw: 2, r: fh / 2, crisp: true, shadow: false });
        K().icon(flag, o.flagIcon || "help-circle", { x: fx + 20 + fic / 2, y: fy + fh / 2, size: fic, color: o.flagTone || "muted" });
        K().text(flag, o.flag, { x: fx + 30 + fic, y: fy, w: fw - fic - 44, h: fh, role: "label", valign: "middle", weight: 600, size: fs, color: "ink" });
        A.parts.flag = { x: fx, y: fy, w: fw, h: fh }; A.nodes.flag = flag;
        regrowChat(A, fy + fh + Math.round(A.E.w * 0.05));
      }
    }
    const textG = A && A.nodes[key] ? A.nodes[key].querySelector("text") : null;
    clock(ctx, name, at.compose, t1, (now) => {
      if (band) {
        const on = now >= at.check && now < at.unsure;
        const loc = Math.max(0, now - at.check), u = loc / scan - Math.floor(loc / scan), env = Math.sin(Math.PI * u);
        const b = A.parts[key], bh = +band.getAttribute("height");
        band.setAttribute("y", (b.y - bh + (b.h + bh) * smooth(u)).toFixed(1));
        band.setAttribute("opacity", (on ? 0.22 * env : 0).toFixed(3));
        const k = win(now, at.unsure, null, 0.5);
        outline.setAttribute("opacity", k.toFixed(3));
        if (textG) textG.setAttribute("opacity", (1 - 0.4 * k).toFixed(3));
        if (flag) flag.setAttribute("opacity", win(now, at.unsure + 0.3, null, 0.3).toFixed(3));
      }
      if (cap) cap.set(now);
    }, [at.check, at.unsure]);
    return { orb, chat: A, claim, caption: cap && cap.E, verdictAt: at.unsure + 0.8, at };
  };

  /* ---------------- approval: the assistant drafts, a person decides ---------------- */
  O.approval = function (ctx, name, o) {
    o = o || {};
    const size = o.size || 300, x = o.x || 0, y = o.y || 0;
    const at = Object.assign({}, o.at || {});
    at.compose = at.compose == null ? (o.t == null ? ctx.start + 0.2 : o.t) : at.compose;
    const t1 = o.until == null ? ctx.end : o.until;
    const pn = Object.assign({ x: x + size + 90, y, w: Math.min(1000, 1920 - (x + size + 90) - 96) }, o.panel || {});
    const D = Loom.ui.doc(ctx, name + "_draft", { x: pn.x, y: pn.y, w: pn.w, title: o.title, paragraphs: o.draft ? [o.draft] : [], display: pn.display });
    Loom.motion.reveal(D.E, at.compose - 0.1, { dy: 10 });
    const typed = D.nodes.para_0 ? typeAnswer(ctx, D, "para_0", at.compose + 0.2, o) : at.compose + 0.5;
    at.pause = at.pause == null ? typed + 0.4 : at.pause;
    at.press = at.press == null ? at.pause + 2.2 : at.press;
    at.work = at.work == null ? at.press + 0.45 : at.work;
    const orb = O(ctx, name, { x, y, size, t: at.compose, until: t1, tint: o.tint || "accent", speed: o.speed,
      states: [{ at: at.compose, state: "composing" }, { at: at.pause, state: "paused" }, { at: at.work, state: "working" }] });
    const cap = captionLine(ctx, name + "_caption", phaseCaptions(o, ["compose", "pause", "press", "work"], at), capBox(o, size));
    // the approve button: below the draft, appears when the orb pauses; a soft ring waits with it until the press
    const bh = o.buttonH || 76;
    const est = Math.ceil(K().measure(o.button || "", "label", S().size("label", Math.round(bh * 0.42)), 700) + bh * 0.9);
    const bp = Object.assign({ x: D.E.x, y: D.E.y + D.E.h + 28 }, o.buttonAt || {});
    const BE = ctx.el(name + "_button", { x: bp.x, y: bp.y, w: est, h: bh, kind: "control", exit: "recede" });
    const btn = Loom.ui.button(ctx, BE.inner, { x: 0, y: 0, h: bh, label: o.button || "" });
    BE.w = btn.w; BE.outer.setAttribute("data-w", btn.w);
    const wait = svg("rect", { x: -8, y: -8, width: btn.w + 16, height: bh + 16, rx: Math.min(S().pack.shape.radius || 12, bh / 2) + 8, fill: "none", stroke: S().c(o.tint || "accent"), "stroke-width": 4, opacity: 0 }, BE.inner);
    BE.inner.insertBefore(wait, BE.inner.firstChild);
    const okR = bh * 0.36, ok = svg("g", { opacity: 0 }, BE.inner);
    K().disc(ok, btn.w + 22 + okR, bh / 2, okR, { fill: "pos", shadow: false });
    K().icon(ok, "check", { x: btn.w + 22 + okR, y: bh / 2, size: okR * 1.2, color: S().pickTokenOn ? S().pickTokenOn("pos") : "field", stroke: 3 });
    Loom.motion.pop(BE, at.pause + 0.1);
    let cursor = null;
    if (o.cursor !== false) {
      const from = Object.assign({ x: bp.x + btn.w + 260, y: bp.y + bh + 180 }, o.cursorFrom || {});
      cursor = Loom.ui.cursor(ctx, { name: name + "_cursor", x: from.x, y: from.y });
      Loom.motion.cursorIn(cursor, at.press - 1.0);
      Loom.motion.cursorTo(cursor, bp.x + btn.w * 0.55, bp.y + bh * 0.55, at.press - 0.75, { dur: 0.7 });
      Loom.motion.tap(cursor, BE, at.press, { x: bp.x + btn.w * 0.55, y: bp.y + bh * 0.55 });
      // then the hand moves off the button, so its label and the tick read again
      Loom.motion.cursorTo(cursor, bp.x + btn.w + 2.4 * bh, bp.y + bh * 1.9, at.press + 0.45, { dur: 0.6 });
    } else {
      Loom.motion.press(BE, at.press);
    }
    clock(ctx, name, at.compose, t1, (now) => {
      const waiting = now >= at.pause + 0.4 && now < at.press;
      const ph = (now - at.pause) * Math.PI * 2 / 1.6;
      wait.setAttribute("opacity", (waiting ? 0.25 + 0.3 * (0.5 + 0.5 * Math.sin(ph)) : 0).toFixed(3));
      ok.setAttribute("opacity", win(now, at.press + 0.15, null, 0.25).toFixed(3));
      if (cap) cap.set(now);
    }, [at.pause, at.press, at.work]);
    return { orb, draft: D, button: BE, cursor, caption: cap && cap.E, at };
  };
})();
