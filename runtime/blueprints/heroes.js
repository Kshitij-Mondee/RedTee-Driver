/* Motion-hero blueprints: parameterised scenes where the MOTION is the content (a value travels,
 * a character's head empties, a journey advances, a signal crosses a network). Filled by the
 * storyboard with a small JSON spec; rendered deterministically.
 */
(function () {
  "use strict";
  const Loom = window.Loom;
  const H = Loom.th;

  /* ======================= hero.meter ======================= */
  Loom.blueprint("hero.meter", {
    doc: "An instrument whose reading changes over time (memory strength, risk, progress, confidence). Instrument law: the scale exists first with the pointer at its MINIMUM or start value, then the pointer TRAVELS to each stop ON its words (instrument speed), the reading is marked the instant it stops, the number is named last. kind ring | bar | gauge. Optional target band = supplied context, thin and early.",
    job: ["quantify", "relate", "demonstrate"], register: "productive", motion_is: "content",
    props: {
      kicker: { type: "str" }, title: { type: "str", max_words: 9 }, say_title: { type: "anchor" },
      kind: { type: "enum", choices: ["ring", "bar", "gauge"], default: "ring" },
      label: { type: "str", required: true, max_words: 4 }, unit: { type: "str", default: "" }, show_value: { type: "bool", default: false },
      start: { type: "number", default: 0 }, min: { type: "number", default: 0 }, max: { type: "number", default: 100 },
      stops: { type: "list", min: 1, max: 6, required: true, of: { value: { type: "number", required: true }, say: { type: "anchor", required: true }, note: { type: "str", max_words: 6 }, tone: { type: "enum", choices: ["pos", "neg", "neutral"] } } },
      target: { type: "number" }, target_label: { type: "str", max_words: 3 },
      icon: { type: "icon" },
      anchor: { type: "enum", choices: ["center", "left", "right"], default: "center" },
    },
    build(ctx, p) {
      const { kit, m } = ctx; const B = ctx.box; const S = Loom.style;
      const y0 = p.title ? H.header(ctx, p, { align: "center" }) : B.y + 40;
      const kind = p.kind || "ring";
      const anchor = p.anchor || "center";
      const lo = p.min || 0, hi = p.max == null ? 100 : p.max;
      const frac = (v) => Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
      const times = p.stops.map((s, i) => H.when(ctx, s.say, 0.2 + (0.7 * i) / p.stops.length, "stop " + (i + 1)));
      H.ordered(ctx, times, "meter");
      const tScale = Math.max(ctx.start + 0.1, Math.min(times[0] - 1.1, H.structAt(ctx)));   // the scale is structure (D-100)
      const fillCol = (tone) => S.c(tone === "neg" ? "neg" : tone === "pos" ? "pos" : "accent2");
      let setVal;
      const cx = anchor === "right" ? 1380 : anchor === "left" ? 540 : kind === "bar" ? 960 : 700, cy = Math.max(y0 + 320, 540);
      const inst = ctx.el("instrument", { x: 0, y: 0, w: 1920, h: 1080, kind: "instrument", exit: kind === "bar" ? "collapse" : "iris" });
      const noteX = anchor === "right" ? 1000 : kind === "bar" ? 960 : 1140;
      if (kind === "ring" || kind === "gauge") {
        const R = 250, sw = 54;
        const sweep = kind === "gauge" ? 240 : 360, a0 = kind === "gauge" ? 150 : -90;
        const arcD = (f) => { const a1 = (a0 + sweep * Math.max(0.0001, f)) * Math.PI / 180, s = a0 * Math.PI / 180; const large = sweep * f > 180 ? 1 : 0; return `M${cx + Math.cos(s) * R} ${cy + Math.sin(s) * R} A${R} ${R} 0 ${large} 1 ${cx + Math.cos(a1) * R} ${cy + Math.sin(a1) * R}`; };
        kit.disc(inst.inner, cx, cy, R + sw * 0.9, { fill: "surface" });
        Loom.svg("path", { d: arcD(0.9999), fill: "none", stroke: S.c("surface2"), "stroke-width": sw, "stroke-linecap": "round" }, inst.inner);
        if (p.target != null) {
          const ta = (a0 + sweep * frac(p.target)) * Math.PI / 180;
          kit.line(inst.inner, cx + Math.cos(ta) * (R - sw * 0.7), cy + Math.sin(ta) * (R - sw * 0.7), cx + Math.cos(ta) * (R + sw * 0.7), cy + Math.sin(ta) * (R + sw * 0.7), { stroke: "muted", sw: 5, crisp: true });
        }
        const fill = Loom.svg("path", { d: arcD(frac(p.start || lo)), fill: "none", stroke: fillCol(p.stops[0].tone), "stroke-width": sw, "stroke-linecap": "round" }, inst.inner);
        if (p.icon) kit.icon(inst.inner, p.icon, { x: cx, y: cy - (p.show_value ? 60 : 0), size: 150, color: "ink" });
        const vt = p.show_value ? kit.text(inst.inner, "", { role: "display", x: cx - 220, y: cy - 20, w: 440, h: 170, maxLines: 1, align: "center", size: 120 }) : null;
        setVal = (v, tone) => { fill.setAttribute("d", arcD(frac(v))); fill.setAttribute("stroke", fillCol(tone)); if (vt) vt.querySelector("tspan").textContent = Math.round(v) + (p.unit || ""); };
      } else {
        const bw = 1100, bh = 110, bx = 960 - bw / 2, by = cy - bh / 2;
        kit.rect(inst.inner, bx - 14, by - 14, bw + 28, bh + 28, { fill: "surface", r: (bh + 28) / 2 });
        kit.rect(inst.inner, bx, by, bw, bh, { fill: "surface2", r: bh / 2, shadow: false });
        if (p.target != null) kit.line(inst.inner, bx + bw * frac(p.target), by - 30, bx + bw * frac(p.target), by + bh + 30, { stroke: "muted", sw: 5, crisp: true });
        const fill = Loom.svg("rect", { x: bx, y: by, width: Math.max(bh, bw * frac(p.start || lo)), height: bh, rx: bh / 2, fill: fillCol(p.stops[0].tone) }, inst.inner);
        const vt = p.show_value ? kit.text(inst.inner, "", { role: "hero", x: bx, y: by - 170, w: bw, h: 150, maxLines: 1, align: "center" }) : null;
        setVal = (v, tone) => { fill.setAttribute("width", Math.max(bh, bw * frac(v))); fill.setAttribute("fill", fillCol(tone)); if (vt) vt.querySelector("tspan").textContent = Math.round(v) + (p.unit || ""); };
      }
      const lab = ctx.el("label", { x: kind === "bar" ? 560 : cx - 300, y: kind === "bar" ? cy + 110 : cy - 420, w: 800, h: 60, kind: "text", exit: "sink" });
      kit.text(lab.inner, p.label, { role: "lead", x: 0, y: 0, w: kind === "bar" ? 800 : 600, h: 60, maxLines: 1, align: "center", weight: 800 });
      m.iris(inst, tScale, { dur: 0.6 });
      m.reveal(lab, tScale + 0.25);
      if (p.target != null && p.target_label) {
        const tl = ctx.el("target_label", { x: kind === "bar" ? 960 - 550 + 1100 * frac(p.target) - 150 : cx + 280, y: kind === "bar" ? cy - 150 : cy - 330, w: 300, h: 44, kind: "text" });
        kit.text(tl.inner, p.target_label, { role: "label", x: 0, y: 0, w: 300, h: 44, maxLines: 1, align: "center", color: "muted" });
        m.reveal(tl, tScale + 0.35);
      }
      // the reading travels between stops: one progress drives the value (and its colour on arrival)
      let prev = p.start == null ? lo : p.start;
      setVal(prev, p.stops[0].tone);
      p.stops.forEach((s, i) => {
        const from = prev, to = s.value, tone = s.tone;
        const dur = Math.max(0.7, Math.min(1.6, Math.abs(to - from) / (hi - lo) * 2.2));
        const t0 = times[i] - 0.1;
        Loom.drive((e) => setVal(from + (to - from) * e, tone), t0, dur, "editorial", { kind: "value_travel", beat: ctx.beat.id, content: true });
        prev = to;
        if (s.note) {
          const ny = anchor === "right" && kind !== "bar" ? cy + 300 : kind === "bar" ? cy - 250 : cy - 150 + i * 96;
          const nx = anchor === "right" && kind !== "bar" ? cx - 320 : kind === "bar" ? 960 - 500 : noteX;
          const nE = ctx.el("note_" + (i + 1), { x: nx, y: ny, w: kind === "bar" ? 1000 : 640, h: 80, kind: "text", exit: "recede" });
          kit.pill(nE.inner, 0, 0, kind === "bar" ? 1000 : 640, 80, { fill: tone === "neg" ? "neg" : tone === "pos" ? "pos" : "surface2", shadow: false });
          kit.text(nE.inner, s.note, { role: "body", x: 30, y: 0, w: (kind === "bar" ? 1000 : 640) - 60, h: 80, maxLines: 1, valign: "middle", weight: 800, align: kind === "bar" ? "center" : "left", color: Loom.style.pickTokenOn(tone === "neg" ? "neg" : tone === "pos" ? "pos" : "surface2") });
          // the note lands ON its words, not after the needle has finished travelling (a note that waited for the
          // travel arrived in the last 0.3 s of a beat, L-75). A note it replaces leaves FIRST, never before it has
          // been readable, and the new one enters only once the old has gone: no double exposure (D-48).
          let at = t0 + Math.min(dur * 0.35, 0.4);
          if ((kind === "bar" || anchor === "right") && i > 0) {
            const pe = Loom.ctxScene.els.find((e) => e.name === "note_" + i);
            if (pe) {
              const out = Math.max(t0 - 0.05, (pe.revealT || 0) + 1.25);   // entrance (~0.45 s) + the 0.8 s reading floor
              m.exit(pe, out, "recede", { dur: 0.25 });
              at = Math.max(at, out + 0.27);
            }
          }
          m.settle(nE, at);
        }
      });
    },
  });

  /* ======================= hero.character_moment ======================= */
  Loom.blueprint("hero.character_moment", {
    doc: "One character in a moment, with a thought or memory bubble whose contents CHANGE over time (ideas arriving, fading, being recalled). The character's expression changes on cue. Illustrative and warm: ideal for hooks, scenarios and making an abstract process personal. bubble items: each arrives ON its say and may fade ON its fade_say (fading = forgetting / doubt).",
    job: ["hook", "scenario", "demonstrate", "refute"], register: "expressive", motion_is: "content",
    props: {
      cast: { type: "str", max_words: 3 }, member: { type: "enum", choices: ["woman", "man", "girl", "boy", "elder_woman", "elder_man"], required: true },
      name: { type: "str", max_words: 3 }, cloth: { type: "token", default: "accent" },
      side: { type: "enum", choices: ["left", "right"], default: "left" },
      moods: { type: "list", max: 4, of: { emotion: { type: "enum", choices: ["neutral", "happy", "surprised", "explaining"], required: true }, say: { type: "anchor", required: true } } },
      bubble: { type: "enum", choices: ["thought", "speech", "memory"], default: "thought" },
      items: { type: "list", min: 1, max: 5, required: true, of: { icon: { type: "icon", required: true }, label: { type: "str", max_words: 3 }, say: { type: "anchor", required: true }, fade_say: { type: "anchor" } } },
      caption: { type: "str", max_words: 8 }, say_caption: { type: "anchor" },
      prop: { type: "enum", choices: ["none", "desk", "calendar", "laptop"], default: "desk" },
      day_label: { type: "str", max_words: 3 }, say_day: { type: "anchor" },
      days: { type: "list", max: 4, of: { label: { type: "str", required: true, max_words: 3 }, say: { type: "anchor", required: true } } },
    },
    build(ctx, p) {
      const { kit, m } = ctx; const S = Loom.style;
      const left = (p.side || "left") === "left";
      const px = left ? 520 : 1400, py = 560;
      if ((p.prop || "desk") !== "none") {
        const dk = ctx.el("desk", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
        kit.rect(dk.inner, px - 360, 800, 720, 30, { fill: "surface2", r: 15, shadow: false });
        kit.rect(dk.inner, px - 300, 828, 26, 100, { fill: "surface2", r: 8, shadow: false });
        kit.rect(dk.inner, px + 274, 828, 26, 100, { fill: "surface2", r: 8, shadow: false });
        if (p.prop === "laptop") { kit.rect(dk.inner, px + 90, 690, 220, 112, { fill: "surface", r: 10 }); kit.rect(dk.inner, px + 60, 796, 280, 10, { fill: "line", r: 5, shadow: false }); }
        if (p.prop === "calendar") { kit.rect(dk.inner, px + 120, 650, 170, 150, { fill: "ink", r: 16 }); kit.rect(dk.inner, px + 120, 650, 170, 42, { fill: "accent3", r: 16, shadow: false }); }
        m.reveal(dk, ctx.start + 0.05, { dy: 24 });
      }
      const person = ctx.el("person", { x: px - 250, y: py - 250, w: 500, h: 500, kind: "character", exit: "sink" });
      const emos = new Set(["neutral"].concat((p.moods || []).map((x) => x.emotion)));
      const v = {};
      const who = H.person(ctx, p, { cloth: "accent" });   // the cast's look when the props name a cast member
      for (const e of emos) v[e] = kit.peep(person.inner, who.member, e, { x: 250, y: 250, size: 500, flip: !left, cloth: who.cloth, skin: who.skin });
      Object.keys(v).forEach((k) => { v[k].style.visibility = k === "neutral" ? "visible" : "hidden"; });
      m.settle(person, ctx.start + 0.1, { dy: 50 });
      (p.moods || []).forEach((md) => {
        const t = H.cue(ctx, md.say) - 0.05;
        Loom.tl.set(Object.values(v), { visibility: "hidden" }, t);
        Loom.tl.set(v[md.emotion], { visibility: "visible" }, t);
      });
      if (p.name) { const nm = ctx.el("name", { x: px - 200, y: 950 - 90, w: 400, h: 44, kind: "text" }); kit.text(nm.inner, p.name, { role: "label", x: 0, y: 0, w: 400, h: 44, maxLines: 1, align: "center", color: "muted" }); m.reveal(nm, ctx.start + 0.4); }
      const days = p.days || (p.day_label ? [{ label: p.day_label, say: p.say_day }] : []);
      days.forEach((d, k) => {
        // a day stamp: each new day replaces the last (the calendar page turns)
        const dl = ctx.el("day_" + (k + 1), { x: left ? 1240 : 120, y: 96, w: 560, h: 90, kind: "stamp", exit: "recede" });
        kit.pill(dl.inner, 0, 0, 560, 90, { fill: "accent3" });
        kit.icon(dl.inner, "calendar", { x: 60, y: 45, size: 44, color: S.pickTokenOn("accent3") });
        kit.text(dl.inner, d.label, { role: "lead", x: 90, y: 0, w: 450, h: 90, maxLines: 1, align: "center", valign: "middle", weight: 800, color: S.pickTokenOn("accent3") });
        const t = d.say ? H.cue(ctx, d.say) : ctx.start + 0.3;
        m.stamp(dl, t);
        const nx = days[k + 1];
        if (nx) m.exit(dl, (nx.say ? H.cue(ctx, nx.say) : t + 2) - 0.12, "recede", { dur: 0.18 });
      });
      // the bubble: a cloud of circles (thought) or a rounded card (speech/memory)
      const bx = left ? px + 190 : px - 190 - 760, by = 190, bw = 760, bh = 400;
      const bub = ctx.el("bubble", { x: bx, y: by, w: bw, h: bh, kind: "bubble", exit: "iris" });
      if ((p.bubble || "thought") === "thought") {
        const rr = Loom.rng("bubble:" + ctx.beat.id);
        const puffs = [];
        for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; puffs.push([bw / 2 + Math.cos(a) * (bw / 2 - 60), bh / 2 + Math.sin(a) * (bh / 2 - 50), 70 + rr() * 30]); }
        if (S.outlined()) {
          // a marker cloud: draw every lobe's outline, then cover the inside with paper so only the
          // cloud's silhouette reads (overlapping outlines inside a cloud look like a pile of plates)
          for (const [cx, cy, r] of puffs) kit.disc(bub.inner, cx, cy, r, { fill: "none", shadow: false });
          const sw = S.pack.shape.stroke * 2.2;
          kit.rect(bub.inner, 30, 40, bw - 60, bh - 80, { fill: "surface", r: 150, crisp: true, shadow: false });
          for (const [cx, cy, r] of puffs) kit.disc(bub.inner, cx, cy, r - sw, { fill: "surface", crisp: true, flat: true, shadow: false });
        } else {
          kit.rect(bub.inner, 30, 40, bw - 60, bh - 80, { fill: "ink", r: 150, shadow: false });
          for (const [cx, cy, r] of puffs) kit.disc(bub.inner, cx, cy, r, { fill: "ink", flat: true, shadow: false });
        }
        const tx = left ? -40 : bw + 40;
        kit.disc(bub.inner, tx + (left ? 30 : -30), bh + 10, 26, { fill: "ink", flat: true, shadow: false });
        kit.disc(bub.inner, tx, bh + 60, 16, { fill: "ink", flat: true, shadow: false });
      } else {
        kit.rect(bub.inner, 0, 0, bw, bh, { fill: "ink", r: 40, shadow: false });
      }
      const tFirst = H.cue(ctx, p.items[0].say);
      m.iris(bub, tFirst - 0.45, { dur: 0.55 });
      const n = p.items.length;
      const cols = Math.min(n, 3), rows = Math.ceil(n / cols);
      p.items.forEach((it, i) => {
        const c = i % cols, r = Math.floor(i / cols);
        const cw = (bw - 160) / cols, chh = (bh - 120) / rows;
        const x = bx + 80 + c * cw + cw / 2, y = by + 60 + r * chh + chh / 2 - 10;
        // the declared box covers the label (wider than the disc): truthful box, contents shifted by 30 (L-50)
        const E = ctx.el("idea_" + (i + 1), { x: x - 120, y: y - 90, w: 240, h: 200, kind: "icon", exit: "recede" });
        kit.disc(E.inner, 120, 70, 66, { fill: ["accent", "accent4", "accent2", "accent3", "accent"][i % 5], shadow: false });
        kit.icon(E.inner, it.icon, { x: 120, y: 70, size: 70, color: S.pickTokenOn(["accent", "accent4", "accent2", "accent3", "accent"][i % 5]) });
        if (it.label) kit.text(E.inner, it.label, { role: "label", x: 0, y: 146, w: 240, h: 40, maxLines: 1, align: "center", color: "field", weight: 800 });
        let t = H.cue(ctx, it.say);
        // peers named in one breath still arrive in reading order, a beat apart (H.cue asks ctx.cue once per anchor)
        const prevT = p.items.slice(0, i).map((q) => H.cue(ctx, q.say));
        if (prevT.length && t <= Math.max(...prevT) + 0.08) t = Math.max(...prevT) + 0.12;
        m.pop(E, t, { overshoot: false });
        if (it.fade_say) {
          const tf = H.cue(ctx, it.fade_say);
          // forgetting is shown, not stated: the idea greys, drifts and dissolves
          Loom.tween(E.life, { opacity: 1, y: 0, scale: 1, transformOrigin: "50% 50%" }, { opacity: 0.08, y: 26, scale: 0.86, duration: 1.1, ease: Loom.ease.editorial }, tf, { kind: "fade_out", beat: ctx.beat.id, content: true });
        }
      });
      if (p.caption) {
        const c = ctx.el("caption", { x: left ? 1000 : 120, y: 660, w: 800, h: 70, kind: "text", exit: "sink" });
        kit.text(c.inner, p.caption, { role: "lead", x: 0, y: 0, w: 800, h: 70, maxLines: 1, align: "center", weight: 800, color: "accent2" });
        m.settle(c, H.when(ctx, p.say_caption, 0.85, "caption"));
      }
    },
  });

  /* ======================= hero.journey ======================= */
  Loom.blueprint("hero.journey", {
    doc: "A traveller moves along a path through waypoints (days, stages, attempts) ON their words. The route draws ahead of the traveller, each waypoint stamps as it is reached, and its label settles. Use for schedules, progressions, customer journeys. The motion of the traveller IS the sequence.",
    job: ["sequence", "demonstrate", "practice"], register: "productive", motion_is: "content",
    props: {
      kicker: { type: "str" }, title: { type: "str", max_words: 9 }, say_title: { type: "anchor" },
      traveller: { type: "obj", of: { icon: { type: "icon" }, cast: { type: "str", max_words: 3 }, member: { type: "enum", choices: ["woman", "man", "girl", "boy", "elder_woman", "elder_man"] } } },
      waypoints: { type: "list", min: 2, max: 6, required: true, of: { label: { type: "str", required: true, max_words: 4 }, sub: { type: "str", max_words: 6 }, icon: { type: "icon" }, say: { type: "anchor", required: true } } },
      shape: { type: "enum", choices: ["wave", "straight", "climb"], default: "wave" },
    },
    build(ctx, p) {
      const { kit, m } = ctx; const B = ctx.box; const S = Loom.style;
      const y0 = H.header(ctx, p);
      const n = p.waypoints.length;
      const xs = p.waypoints.map((_, i) => B.x + 140 + (i * (B.w - 280)) / (n - 1));
      const mid = Math.max(y0 + 250, 560);
      const ys = p.waypoints.map((_, i) => (p.shape === "straight" ? mid : p.shape === "climb" ? 760 - i * ((760 - Math.max(y0 + 140, 360)) / (n - 1)) : mid + (i % 2 ? -90 : 90)));
      let d = `M${xs[0]} ${ys[0]}`;
      for (let i = 1; i < n; i++) { const cx = (xs[i - 1] + xs[i]) / 2; d += ` C${cx} ${ys[i - 1]}, ${cx} ${ys[i]}, ${xs[i]} ${ys[i]}`; }
      const route = ctx.el("route", { x: 0, y: 0, w: 1, h: 1, kind: "connector", exit: "recede" });
      const rp = kit.path(route.inner, d, { stroke: "line", sw: 6 });
      const guide = kit.path(ctx.g, d, { stroke: "none" }); guide.setAttribute("opacity", "0");
      const times = p.waypoints.map((w, i) => H.when(ctx, w.say, 0.1 + (0.8 * i) / n, "waypoint " + (i + 1)));
      H.ordered(ctx, times, "journey");
      const L1 = p.title ? null : H.lead(ctx, times[0]);   // with no title the first waypoint leads (D-100)
      const t1 = L1 ? L1.at : times[0];
      const L = guide.getTotalLength();
      // fraction of the route at each waypoint
      const fr = [0]; { let acc = 0, prevPt = guide.getPointAtLength(0); let k = 1; for (let s = 1; s <= 400 && k < n; s++) { const pt = guide.getPointAtLength((L * s) / 400); if (Math.abs(pt.x - xs[k]) < (xs[1] - xs[0]) / 200 + 2 || pt.x >= xs[k]) { fr.push(s / 400); k++; } prevPt = pt; acc++; } while (fr.length < n) fr.push(1); }
      rp.setAttribute("stroke-dasharray", `${L} ${L + 14}`);   // gap outruns the round cap (L-225)
      const offAt = (f) => (f <= 0 ? L + 8 : L * (1 - f));   // undrawn sits past L: GSAP rounds to whole px (L-225)
      Loom.tween(rp, { strokeDashoffset: L + 8 }, { strokeDashoffset: offAt(fr[0]), duration: 0.01 }, ctx.start, { kind: "draw" });
      p.waypoints.forEach((w, i) => {
        const above = p.shape === "wave" ? i % 2 === 1 : false;
        // the declared box covers the labels (wider than the disc, above or below it): the truth that the
        // camera, joins and layout checks measure (L-50). Contents are shifted by (ox, oy) to match.
        const ox = 130, top = above ? -130 : 0, oy = -top;
        const E = ctx.el("waypoint_" + (i + 1), { x: xs[i] - 60 - ox, y: ys[i] - 60 + top, w: 380, h: above ? 250 : 228, kind: "node", exit: "recede" });
        kit.disc(E.inner, 60 + ox, 60 + oy, 46, { fill: "surface" });
        if (w.icon) kit.icon(E.inner, w.icon, { x: 60 + ox, y: 60 + oy, size: 48, color: "accent2" });
        else kit.text(E.inner, String(i + 1), { role: "lead", x: ox, y: 28 + oy, w: 120, h: 60, maxLines: 1, align: "center", weight: 800 });
        const wl = kit.text(E.inner, w.label, { role: "lead", x: -130 + ox, y: (above ? -130 : 130) + oy, w: 380, h: 54, maxLines: 1, align: "center", weight: 800 });
        if (i === 0) H.mark(ctx, wl, L1);
        if (w.sub) kit.text(E.inner, w.sub, { role: "label", x: -130 + ox, y: (above ? -76 : 184) + oy, w: 380, h: 44, maxLines: 1, align: "center", color: "muted" });
        if (i > 0) {
          const t0 = Math.max(times[i - 1] + 0.3, times[i] - 0.9);
          Loom.tween(rp, { strokeDashoffset: offAt(fr[i - 1]) }, { strokeDashoffset: offAt(fr[i]), duration: times[i] - t0, ease: Loom.ease.move }, t0, { kind: "draw", beat: ctx.beat.id, content: true });
        }
        m.stamp(E, i ? times[i] + 0.02 : t1);
      });
      const trav = ctx.el("traveller", { x: 0, y: 0, w: 1, h: 1, kind: "token", exit: "recede" });
      const tg = Loom.svg("g", { transform: "translate(0 -96)" }, trav.inner);
      if (p.traveller && (p.traveller.member || p.traveller.cast)) { const who = H.person(ctx, p.traveller, { cloth: "accent" }); kit.peep(tg, who.member, "happy", { x: 0, y: 0, size: 150, cloth: who.cloth, skin: who.skin }); }
      else { kit.disc(tg, 0, 0, 40, { fill: "accent", shadow: false }); kit.icon(tg, (p.traveller && p.traveller.icon) || "user", { x: 0, y: 0, size: 44, color: S.pickTokenOn("accent") }); }
      m.along(trav, guide, Math.min(times[0] - 0.4, t1 - 0.1), { from: 0, to: 0, dur: 0.01 });
      m.reveal(trav, Math.max(ctx.start + 0.05, Math.min(times[0] - 0.3, t1)), { dy: 0 });
      for (let i = 1; i < n; i++) {
        const t0 = Math.max(times[i - 1] + 0.3, times[i] - 0.9);
        m.along(trav, guide, t0, { from: fr[i - 1], to: fr[i], dur: times[i] - t0, ease: "move" });
      }
    },
  });

  /* ======================= hero.hub ======================= */
  Loom.blueprint("hero.hub", {
    doc: "A system with a centre and satellites (a GDS and airlines, a manager and a team, a brain and its cues). The hub irises open, spokes draw OUT to each satellite ON its word, satellites pop, and signals travel along spokes to show flow.",
    job: ["relate", "orient", "demonstrate"], register: "productive", motion_is: "content",
    props: {
      kicker: { type: "str" }, title: { type: "str", max_words: 9 }, say_title: { type: "anchor" },
      hub: { type: "obj", required: true, of: { label: { type: "str", required: true, max_words: 3 }, icon: { type: "icon" }, say: { type: "anchor", required: true } } },
      satellites: { type: "list", min: 2, max: 8, required: true, of: { label: { type: "str", required: true, max_words: 3 }, icon: { type: "icon" }, say: { type: "anchor", required: true } } },
      signals: { type: "list", max: 8, of: { to: { type: "int", required: true, index_of: "satellites" }, say: { type: "anchor", required: true }, inbound: { type: "bool" } } },
    },
    build(ctx, p) {
      const { kit, m } = ctx; const S = Loom.style;
      const y0 = p.title ? H.header(ctx, p, { align: "center" }) : ctx.box.y;
      const cx = 960, cy = Math.max(y0 + 300, 520), rx = 620, ry = Math.min(300, 880 - cy);
      const n = p.satellites.length;
      const LH = H.leadStruct(ctx, H.cue(ctx, p.hub.say));   // the hub is structure: on screen by the lead (D-100)
      const pos = p.satellites.map((_, i) => { const a = -Math.PI / 2 + (i / n) * Math.PI * 2 + (n % 2 ? 0 : Math.PI / n); return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
      const spokes = [];
      p.satellites.forEach((s, i) => {
        const [x, y] = pos[i];
        const sp = ctx.el("spoke_" + (i + 1), { x: 0, y: 0, w: 1, h: 1, kind: "connector", exit: "recede" });
        const ang = Math.atan2(y - cy, x - cx);
        const x0 = cx + Math.cos(ang) * 150, y0s = cy + Math.sin(ang) * 150, x1 = x - Math.cos(ang) * 78, y1 = y - Math.sin(ang) * 78;
        const path = kit.path(sp.inner, `M${x0} ${y0s} L${x1} ${y1}`, { stroke: "line", sw: 5 });
        spokes.push({ path, x0, y0: y0s, x1, y1 });
        const t = H.cue(ctx, s.say);
        m.draw(path, t - 0.35, { dur: 0.4 });
        // the declared box covers the label under the disc (wider and lower than it): the truth the layout checks
        // measure (L-50); contents shifted by 80 to match (the label left its 144 px box: text_outside_element)
        const E = ctx.el("sat_" + (i + 1), { x: x - 152, y: y - 72, w: 304, h: 200, kind: "node", exit: "recede" });
        H.iconDisc(ctx, E.inner, 152, 72, 70, s.icon, "surface", "accent2");
        kit.text(E.inner, s.label, { role: "label", x: 0, y: 150, w: 304, h: 44, maxLines: 1, align: "center", weight: 800 });
        m.pop(E, t, { overshoot: false });
      });
      const hub = ctx.el("hub", { x: cx - 150, y: cy - 150, w: 300, h: 300, kind: "node", exit: "iris" });
      kit.disc(hub.inner, 150, 150, 150, { fill: "accent4" });
      if (p.hub.icon) kit.icon(hub.inner, p.hub.icon, { x: 150, y: 110, size: 96, color: S.pickTokenOn("accent4") });
      const hl = kit.text(hub.inner, p.hub.label, { role: "lead", x: 20, y: p.hub.icon ? 170 : 110, w: 260, h: 70, maxLines: 1, align: "center", weight: 800, color: S.pickTokenOn("accent4") });
      m.iris(hub, Math.max(ctx.start + 0.05, LH.at - 0.1));
      H.mark(ctx, hl, LH);
      (p.signals || []).forEach((sg, k) => {
        const s = spokes[sg.to]; if (!s) return;
        const E = ctx.el("signal_" + (k + 1), { x: 0, y: 0, w: 1, h: 1, kind: "token", exit: "recede" });
        kit.disc(E.inner, 0, 0, 16, { fill: "accent2", shadow: false });
        const t = H.cue(ctx, sg.say);
        const a = sg.inbound ? [s.x1, s.y1] : [s.x0, s.y0], b = sg.inbound ? [s.x0, s.y0] : [s.x1, s.y1];
        Loom.tween(E.mover, { x: a[0], y: a[1], opacity: 0 }, { x: b[0], y: b[1], opacity: 1, duration: 0.7, ease: Loom.ease.move }, t, { kind: "signal", beat: ctx.beat.id, content: true });
        Loom.tween(E.inner, { opacity: 1 }, { opacity: 0, duration: 0.25 }, t + 0.72, { kind: "signal" });
      });
    },
  });

  /* ======================= hero.portal ======================= */
  Loom.blueprint("hero.portal", {
    doc: "Draws a frame (screen, lens or card) that the NEXT station is nested inside, so a 'zoom' join flies the camera through it - an infinite-canvas move that reads as going deeper. The next station must declare parent = this station and rect = this portal's rect. Optional label and surrounding context icons.",
    job: ["transition", "orient", "relate"], register: "expressive", motion_is: "staging",
    props: {
      kind: { type: "enum", choices: ["screen", "lens", "card"], default: "screen" },
      rect: { type: "list", required: true, min: 4, max: 4 },
      label: { type: "str", max_words: 6 }, say_label: { type: "anchor" },
      context: { type: "list", max: 4, of: { icon: { type: "icon", required: true }, label: { type: "str", max_words: 3 }, say: { type: "anchor" } } },
    },
    build(ctx, p) {
      const { kit, m } = ctx; const [x, y, w, h] = p.rect;
      const fr = ctx.el("portal", { x: x - 30, y: y - 30, w: w + 60, h: h + 60, kind: "portal", exit: "none" });
      if (p.kind === "lens") { kit.disc(fr.inner, (w + 60) / 2, (h + 60) / 2, Math.max(w, h) / 2 + 30, { fill: "ink" }); kit.disc(fr.inner, (w + 60) / 2, (h + 60) / 2, Math.max(w, h) / 2, { fill: "field", flat: true, shadow: false }); }
      else { kit.rect(fr.inner, 0, 0, w + 60, h + 60, { fill: p.kind === "card" ? "surface" : "ink", r: 40 }); kit.rect(fr.inner, 30, 30, w, h, { fill: "field", r: 14, shadow: false, flat: true }); }
      if (p.kind === "screen") kit.rect(fr.inner, (w + 60) / 2 - 90, h + 60, 180, 70, { fill: "ink", r: 10 });
      const tl = p.say_label ? H.cue(ctx, p.say_label) : ctx.at(0.05);
      m.iris(fr, Math.max(ctx.start + 0.05, Math.min(tl - 0.3, H.structAt(ctx))));   // the frame is structure (D-100)
      if (p.label) { const L = ctx.el("portal_label", { x: x, y: y - 110, w: w, h: 60, kind: "text", exit: "sink" }); kit.text(L.inner, p.label, { role: "lead", x: 0, y: 0, w, h: 60, maxLines: 1, align: "center", weight: 800 }); m.drop(L, tl); }
      (p.context || []).forEach((c, i) => {
        const cx = i % 2 ? x + w + 200 : x - 200, cy = y + 120 + Math.floor(i / 2) * 220;
        const E = ctx.el("context_" + (i + 1), { x: cx - 70, y: cy - 70, w: 140, h: 200, kind: "icon", exit: "recede" });
        H.iconDisc(ctx, E.inner, 70, 70, 64, c.icon, "surface", "accent2");
        if (c.label) kit.text(E.inner, c.label, { role: "label", x: -60, y: 150, w: 260, h: 40, maxLines: 1, align: "center" });
        m.pop(E, c.say ? H.cue(ctx, c.say) : tl + 0.3 + i * 0.1, { overshoot: false });
      });
    },
  });
})();
