/* More templates: checks (quiz), data (bars), scenarios (dialogue), recap, peers (icon grid), cycle, timeline, quote. */
(function () {
  "use strict";
  const Loom = window.Loom;
  const H = Loom.th;

  /* ======================= quiz.question ======================= */
  Loom.template("quiz.question", {
    doc: "A stopping check, part 1 of 2. The question prints, the options arrive as PEERS (tight stagger, no option favoured), then a pause ring counts down through the script's silent pause_after_s. The answer is NEVER shown here; quiz.answer follows in the next beat.",
    job: ["check"], register: "productive", motion_is: "staging",
    props: {
      kicker: { type: "str", default: "Your turn", chrome: true },
      question: { type: "str", required: true, max_words: 18 }, say_question: { type: "anchor", required: true },
      options: { type: "list", min: 2, max: 4, required: true, of: { text: { type: "str", required: true, max_words: 10 }, say: { type: "anchor" } } },
      pause_label: { type: "str", default: "Pause and decide", chrome: true },
    },
    build(ctx, p) {
      const { kit, m } = ctx; const B = ctx.box;
      const tQ = H.lead(ctx, H.when(ctx, p.say_question, 0, "question")).at;   // never an empty frame (D-100)
      const k = ctx.el("kicker", { x: B.x, y: 110, w: B.w, h: 36, kind: "text", exit: "sink" });
      kit.kicker(k.inner, p.kicker || "Your turn", { x: 0, y: 0, w: B.w, h: 36, align: "center" });
      m.drop(k, Math.max(ctx.start + 0.05, tQ - 0.3));
      const n = p.options.length;
      const cols = n <= 2 ? n : 2, rows = Math.ceil(n / cols);
      // MEASURE, THEN DRAW (L-51): the option cards are as tall as their longest option needs, plus an inset,
      // so no option's words can touch the card edge in any style's fonts
      const INSET = 20, cw = (B.w - 320 - 40 * (cols - 1)) / cols;
      const optH = Math.max(...p.options.map((o) => kit.fit(o.text, { role: "lead", w: cw - 160, maxLines: 2 }).height));
      const cellH = Math.max(128, Math.ceil(optH + 2 * INSET)), gapY = 28;
      const qProbe = kit.measure(p.question, "title", 72) > B.w - 240 ? 2 : 1;
      const blockH = 60 + qProbe * 82 + 70 + rows * (cellH + gapY) + 110;
      const top = Math.max(100, 84 + (846 - blockH) / 2);
      kit.place(k, k.x, top);
      const q = ctx.el("question", { x: B.x + 120, y: top + 60, w: B.w - 240, h: 190, kind: "text", exit: "wipe" });
      const qt = kit.text(q.inner, p.question, { role: "title", x: 0, y: 0, w: B.w - 240, h: 190, maxLines: 2, align: "center", size: 72 });
      q.h = qt.__fit.height + 8; q.w = B.w - 240;
      m.unmask(q, tQ, { dir: "ttb" });
      const gridY = top + 60 + qt.__fit.height + 70;
      const cells = kit.row({ x: B.x + 160, y: gridY, w: B.w - 320, h: cellH }, cols, 40);
      const letters = "ABCD";
      const tOpts = p.options.map((o, i) => o.say ? H.cue(ctx, o.say) : null);
      const firstOpt = tOpts.find((t) => t != null) || (tQ + 1.0);
      p.options.forEach((o, i) => {
        const c = cells[i % cols]; const y = gridY + Math.floor(i / cols) * (cellH + gapY);
        const E = ctx.el("option_" + letters[i], { x: c.x, y, w: c.w, h: cellH, kind: "card", exit: "recede" });
        kit.card(E.inner, 0, 0, c.w, cellH, { fill: "surface" });
        const qt = Loom.style.role("quiz_letter", "accent2");
        kit.disc(E.inner, 64, cellH / 2, 40, { fill: qt, shadow: false });
        kit.text(E.inner, letters[i], { role: "lead", x: 24, y: cellH / 2 - 30, w: 80, h: 60, maxLines: 1, align: "center", color: Loom.style.pickTokenOn(qt), weight: 800 });
        kit.text(E.inner, o.text, { role: "lead", x: 128, y: INSET, w: c.w - 160, h: cellH - 2 * INSET, maxLines: 2, valign: "middle" });
        m.pop(E, (tOpts[i] != null ? tOpts[i] : firstOpt + i * 0.09), { overshoot: false });
      });
      // pause ring: sweeps through the silent pause (instrument law: the track exists, then the sweep)
      const pause = ctx.beat.pause_after || 0;
      if (pause > 0.5) {
        const ry = Math.min(900 - 70, gridY + rows * (cellH + gapY) + 50);
        // tall enough that the label keeps its inset inside the sweeping bar at every style's label size (L-51)
        // 88 high (it was 80): the label kept 6 px from the bar's edge where the check needs 0.2 x its size (tight_inset)
        const ring = ctx.el("pause_ring", { x: 960 - 260, y: ry - 44, w: 520, h: 88, kind: "instrument", exit: "recede" });
        kit.pill(ring.inner, 0, 0, 520, 88, { fill: "surface2", shadow: false });
        const bar = Loom.svg("rect", { x: 8, y: 8, width: 504, height: 72, rx: 36, fill: Loom.style.c("accent4"), opacity: 0.55 }, ring.inner);
        kit.text(ring.inner, p.pause_label || "Pause and decide", { role: "label", x: 24, y: 8, w: 472, h: 72, maxLines: 1, align: "center", valign: "middle", weight: 800 });
        const t0 = ctx.speechEnd + 0.05;
        m.reveal(ring, ctx.speechEnd - 0.4, { dy: 10 });
        Loom.tween(bar, { scaleX: 1, transformOrigin: "0% 50%" }, { scaleX: 0, duration: pause - 0.2, ease: "none" }, t0, { kind: "instrument", beat: ctx.beat.id, content: true });
      } else Loom.warn("quiz_without_pause", `${ctx.beat.id}: a quiz question needs pause_after_s in the script`);
    },
  });

  /* ======================= quiz.answer ======================= */
  Loom.template("quiz.answer", {
    doc: "A stopping check, part 2 of 2. The options return (held look), the right one is marked ON the spoken answer and the others dim; the tempting wrong option gets its own 'why not' note. Feedback is the teaching.",
    job: ["check"], register: "productive", motion_is: "staging",
    chrome: ["Why not"],   // structural words this template draws itself (the sample-text audit allows them)
    props: {
      question: { type: "str", required: true, max_words: 18 },
      options: { type: "list", min: 2, max: 4, required: true, of: { text: { type: "str", required: true, max_words: 10 } } },
      answer: { type: "int", required: true, index_of: "options" }, say_answer: { type: "anchor", required: true },
      explanation: { type: "str", required: true, max_words: 22 }, say_explanation: { type: "anchor", required: true },
      tempting: { type: "int", index_of: "options", not: ["answer"] }, why_not: { type: "str", max_words: 16, requires: "tempting" }, say_why_not: { type: "anchor", requires: "why_not" },
      // optional (2026-10-02, L-163): a second wrong option's note, and a takeaway that replaces the question on its words
      also: { type: "int", index_of: "options", not: ["answer", "tempting"] }, also_why: { type: "str", max_words: 14, requires: "also" }, say_also_why: { type: "anchor", requires: "also_why" },
      takeaway: { type: "str", max_words: 12 }, say_takeaway: { type: "anchor", requires: "takeaway" },
    },
    build(ctx, p) {
      const { kit, m } = ctx; const B = ctx.box;
      const q = ctx.el("question", { x: B.x + 120, y: 110, w: B.w - 240, h: 110, kind: "text", exit: "wipe" });
      kit.text(q.inner, p.question, { role: "lead", x: 0, y: 0, w: B.w - 240, h: 110, maxLines: 2, align: "center", color: "muted" });
      m.reveal(q, ctx.start + 0.1, { dy: 0 });
      const n = p.options.length, cols = n <= 2 ? n : 2;
      const letters = "ABCD";
      const INSET = 20, cw = (B.w - 320 - 40 * (cols - 1)) / cols;   // measure, then draw (L-51)
      const optH = Math.max(...p.options.map((o, i) => kit.fit(`${letters[i]}   ${o.text}`, { role: "body", w: cw - 120, maxLines: 2 }).height));
      const cellH = Math.max(104, Math.ceil(optH + 2 * INSET)), gridY = 250;
      const cells = kit.row({ x: B.x + 160, y: gridY, w: B.w - 320, h: cellH }, cols, 40);
      const tA = H.when(ctx, p.say_answer, 0.2, "answer");
      p.options.forEach((o, i) => {
        const c = cells[i % cols]; const y = gridY + Math.floor(i / cols) * (cellH + 24);
        const right = i === p.answer;
        const E = ctx.el("option_" + letters[i], { x: c.x, y, w: c.w, h: cellH, kind: "card", exit: "recede" });
        const g = Loom.svg("g", {}, E.inner);
        kit.card(g, 0, 0, c.w, cellH, { fill: "surface" });
        kit.text(g, `${letters[i]}   ${o.text}`, { role: "body", x: 32, y: INSET, w: c.w - 120, h: cellH - 2 * INSET, maxLines: 2, valign: "middle" });
        m.reveal(E, ctx.start + 0.15 + i * 0.06, { dy: 0, dur: 0.3 });
        if (right) {
          const ring = Loom.svg("rect", { x: -6, y: -6, width: c.w + 12, height: cellH + 12, rx: 30, fill: "none", stroke: Loom.style.c("pos"), "stroke-width": 7, opacity: 0 }, E.inner);
          Loom.tween(ring, { opacity: 0 }, { opacity: 1, duration: 0.25 }, tA, { kind: "stamp", beat: ctx.beat.id, content: true });
          const mk = Loom.svg("g", {}, E.inner); kit.mark(mk, "yes", c.w - 56, cellH / 2, 58);
          Loom.tween(mk, { opacity: 0, scale: 1.4, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.35, ease: Loom.ease.enter }, tA, { kind: "stamp", beat: ctx.beat.id, content: true });
        } else {
          Loom.tween(g, { opacity: 1 }, { opacity: 0.38, duration: 0.3 }, tA + 0.1, { kind: "dim", beat: ctx.beat.id });
        }
      });
      const rows = Math.ceil(n / cols);
      let y = gridY + rows * (cellH + 24) + 30;
      const exH = Math.max(140, Math.ceil(kit.fit(p.explanation, { role: "body", w: B.w - 392, maxLines: 3 }).height + 2 * INSET));
      const ex = ctx.el("explanation", { x: B.x + 160, y, w: B.w - 320, h: exH + 10, kind: "text", exit: "wipe" });
      kit.card(ex.inner, 0, 0, B.w - 320, exH, { fill: "surface2", shadow: false });
      kit.text(ex.inner, p.explanation, { role: "body", x: 36, y: INSET, w: B.w - 392, h: exH - 2 * INSET, maxLines: 3, valign: "middle" });
      m.settle(ex, H.when(ctx, p.say_explanation, 0.45, "explanation"));
      if (p.why_not && p.tempting != null) {
        y += exH + 20;
        const wn = ctx.el("why_not", { x: B.x + 160, y, w: B.w - 320, h: 90, kind: "text", exit: "sink" });
        kit.text(wn.inner, `Why not ${letters[p.tempting]}? ${p.why_not}`, { role: "body", x: 36, y: 0, w: B.w - 392, h: 90, maxLines: 2, color: "muted" });
        m.reveal(wn, H.when(ctx, p.say_why_not, 0.75, "why not"));
        y += 70;
      }
      if (p.also_why && p.also != null) {
        y += p.why_not ? 0 : exH + 20;
        const an = ctx.el("also_why", { x: B.x + 160, y, w: B.w - 320, h: 90, kind: "text", exit: "sink" });
        kit.text(an.inner, `Why not ${letters[p.also]}? ${p.also_why}`, { role: "body", x: 36, y: 0, w: B.w - 392, h: 90, maxLines: 2, color: "muted" });
        m.reveal(an, H.when(ctx, p.say_also_why, 0.85, "also why"));
      }
      if (p.takeaway) {
        // the question has been answered: on the takeaway's words it gives its place to the rule to keep
        const tk = H.when(ctx, p.say_takeaway, 0.9, "takeaway");
        Loom.tween(q.inner, { opacity: 1 }, { opacity: 0, duration: 0.3 }, tk - 0.3, { kind: "exit", beat: ctx.beat.id });
        const tw = ctx.el("takeaway", { x: B.x + 120, y: 110, w: B.w - 240, h: 110, kind: "text", exit: "wipe" });
        kit.text(tw.inner, p.takeaway, { role: "lead", x: 0, y: 0, w: B.w - 240, h: 110, maxLines: 2, align: "center", color: "accent" });
        m.reveal(tw, tk, { dy: 0 });
      }
    },
  });

  /* ======================= chart.bars ======================= */
  Loom.template("chart.bars", {
    doc: "Compare quantities. Axis and baseline first, then bars GROW from zero in axis order, each ON its spoken value, value label with its bar. Every value must be grounded. Optional highlight marks the bar that matters.",
    job: ["quantify", "distinguish"], register: "productive", motion_is: "content",
    props: {
      kicker: { type: "str" }, title: { type: "str", max_words: 9 }, say_title: { type: "anchor" },
      unit: { type: "str", max_words: 3 }, max: { type: "number" },
      series: { type: "list", min: 2, max: 6, required: true, of: { cat: { type: "str", required: true, max_words: 3 }, value: { type: "number", required: true }, say: { type: "anchor", required: true }, label: { type: "str" } } },
      highlight: { type: "int", index_of: "series" },
    },
    build(ctx, p) {
      const { kit, m } = ctx; const B = ctx.box;
      const y0 = H.header(ctx, p);
      const top = y0 + 30, base = 800, left = B.x + 140, right = B.x + B.w - 80;
      const vmax = p.max || Math.max(...p.series.map((s) => s.value)) * 1.12;
      const axis = ctx.el("axis", { x: 0, y: 0, w: 1, h: 1, kind: "structure", exit: "recede" });
      kit.line(axis.inner, left - 20, base, right, base, { stroke: "line", sw: 4, crisp: true });
      m.draw(axis, Math.max(ctx.start + 0.1, Math.min((p.say_title ? H.cue(ctx, p.say_title) : ctx.at(0.02)) + 0.2, H.structAt(ctx))), { dur: 0.5 });
      if (p.unit) { const u = ctx.el("unit", { x: left - 20, y: top - 10, w: 400, h: 40, kind: "text" }); kit.text(u.inner, p.unit, { role: "label", x: 0, y: 0, w: 400, h: 36, maxLines: 1, color: "muted" }); m.reveal(u, ctx.at(0.05)); }
      const n = p.series.length;
      const slots = kit.row({ x: left, y: top, w: right - left, h: base - top }, n, 60);
      const times = [];
      p.series.forEach((s, i) => {
        const c = slots[i];
        const h = Math.max(4, ((base - top - 60) * s.value) / vmax);
        const hi = p.highlight === i;
        const bar = ctx.el("bar_" + (i + 1), { x: c.x, y: base - h, w: c.w, h, kind: "bar", exit: "collapse" });
        kit.rect(bar.inner, 0, 0, c.w, h, { fill: hi ? "accent" : "accent4", r: Math.min(18, c.w / 6), shadow: false });
        const t = H.when(ctx, s.say, 0.2 + (0.6 * i) / n, "bar " + (i + 1)); times.push(t);
        m.grow(bar, t - 0.1, { dur: 0.7 });
        const lab = ctx.el("value_" + (i + 1), { x: c.x, y: base - h - 64, w: c.w, h: 56, kind: "text" });
        const vt = kit.text(lab.inner, s.label || String(s.value), { role: "lead", x: 0, y: 0, w: c.w, h: 56, maxLines: 1, align: "center", weight: 800, color: hi ? "accent" : "ink" });
        m.reveal(lab, t + 0.45, { dy: 8 });
        void vt;
        const cat = ctx.el("cat_" + (i + 1), { x: c.x - 20, y: base + 16, w: c.w + 40, h: 70, kind: "text" });
        kit.text(cat.inner, s.cat, { role: "label", x: 0, y: 0, w: c.w + 40, h: 70, maxLines: 2, align: "center", color: "muted" });
        m.reveal(cat, t - 0.1, { dy: 0 });
      });
      H.ordered(ctx, times, "bars");
    },
  });

  /* ======================= scenario.dialogue ======================= */
  Loom.template("scenario.dialogue", {
    doc: "Two characters in a moment (manager/employee, customer/agent...). Characters settle in, then speech bubbles appear ON their lines, alternating sides; the speaker leans in, the listener reacts. For scenario_led teaching and misconception moments. Lines are SHORT (the narration carries the rest).",
    job: ["scenario", "demonstrate", "hook", "refute"], register: "expressive", motion_is: "content",
    props: {
      left: { type: "obj", required: true, of: { cast: { type: "str", max_words: 3 }, member: { type: "enum", choices: ["woman", "man", "girl", "boy", "elder_woman", "elder_man"], required: true }, name: { type: "str", max_words: 3 }, emotion: { type: "enum", choices: ["neutral", "happy", "surprised", "explaining"] }, cloth: { type: "token" } } },
      right: { type: "obj", required: true, of: { cast: { type: "str", max_words: 3 }, member: { type: "enum", choices: ["woman", "man", "girl", "boy", "elder_woman", "elder_man"], required: true }, name: { type: "str", max_words: 3 }, emotion: { type: "enum", choices: ["neutral", "happy", "surprised", "explaining"] }, cloth: { type: "token" } } },
      lines: { type: "list", min: 1, max: 4, required: true, of: { who: { type: "enum", choices: ["left", "right"], required: true }, text: { type: "str", required: true, max_words: 12 }, say: { type: "anchor", required: true }, emotion: { type: "enum", choices: ["neutral", "happy", "surprised", "explaining"] } } },
      setting: { type: "enum", choices: ["none", "desk", "meeting", "call"], default: "desk" },
      caption: { type: "str", max_words: 8 }, say_caption: { type: "anchor" },
    },
    build(ctx, p) {
      const { kit, m } = ctx;
      const people = { left: { x: 420, def: p.left }, right: { x: 1500, def: p.right } };
      if ((p.setting || "desk") !== "none") {
        const set = ctx.el("setting", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
        kit.rect(set.inner, 180, 780, 1560, 34, { fill: "surface2", r: 17, shadow: false });
        if (p.setting === "desk" || p.setting === "meeting") { kit.rect(set.inner, 300, 812, 30, 110, { fill: "surface2", r: 8, shadow: false }); kit.rect(set.inner, 1590, 812, 30, 110, { fill: "surface2", r: 8, shadow: false }); }
        if (p.setting === "call") { kit.rect(set.inner, 860, 560, 200, 130, { fill: "surface", r: 14 }); kit.rect(set.inner, 945, 690, 30, 90, { fill: "surface2", r: 6, shadow: false }); }
        m.reveal(set, ctx.start + 0.05, { dy: 20 });
      }
      const heads = {};
      ["left", "right"].forEach((side, si) => {
        const P = people[side]; const d = P.def;
        // a cast member keeps one look whichever side they stand on; the side colours apply only without a cast entry
        const who = H.person(ctx, d, { cloth: si ? "accent4" : "accent", skin: si ? 2 : 0, slot: si });
        const E = ctx.el(side + "_person", { x: P.x - 230, y: 330, w: 460, h: 460, kind: "character", exit: "sink" });
        const variants = {};
        const emos = new Set([d.emotion || "neutral", ...p.lines.filter((l) => l.who === side && l.emotion).map((l) => l.emotion)]);
        for (const emo of emos) { variants[emo] = kit.peep(E.inner, who.member, emo, { x: 230, y: 230, size: 460, flip: side === "right", cloth: who.cloth, skin: who.skin }); }
        Object.values(variants).forEach((v, i) => { if (i > 0) v.style.visibility = "hidden"; });
        heads[side] = { E, variants, cur: d.emotion || "neutral" };
        m.settle(E, ctx.start + 0.1 + si * 0.12, { dy: 40 });
        if (who.name) { const nm = ctx.el(side + "_name", { x: P.x - 200, y: 830, w: 400, h: 50, kind: "text" }); kit.text(nm.inner, who.name, { role: "label", x: 0, y: 0, w: 400, h: 44, maxLines: 1, align: "center", color: "muted" }); m.reveal(nm, ctx.start + 0.4 + si * 0.1); }
      });
      const times = [];
      p.lines.forEach((ln, i) => {
        const side = ln.who; const P = people[side];
        const t = H.when(ctx, ln.say, 0.1 + (0.8 * i) / p.lines.length, "line " + (i + 1)); times.push(t);
        const bw = 560, bx = side === "left" ? P.x + 120 : P.x - 120 - bw, by = 150 + (i % 2) * 20;
        const bub = ctx.el("line_" + (i + 1), { x: bx, y: by, w: bw, h: 170, kind: "bubble", exit: "recede" });
        kit.rect(bub.inner, 0, 0, bw, 150, { fill: side === "left" ? "ink" : "accent2", r: 34, shadow: false });
        const tail = side === "left" ? [[70, 140], [40, 200], [130, 140]] : [[bw - 130, 140], [bw - 40, 200], [bw - 70, 140]];
        kit.polygon(bub.inner, tail, { fill: side === "left" ? "ink" : "accent2" });
        kit.text(bub.inner, ln.text, { role: "body", x: 30, y: 0, w: bw - 60, h: 150, maxLines: 3, valign: "middle", color: "field", weight: 800 });
        m.pop(bub, t - 0.05, { overshoot: false });
        // the previous bubble recedes so only the live line is loud (one focal point)
        if (i > 0) { const prevE = Loom.ctxScene.els.find((e) => e.name === "line_" + i); if (prevE) Loom.tween(prevE.inner, { opacity: 1 }, { opacity: 0.35, duration: 0.25 }, t - 0.05, { kind: "dim" }); }
        // speaker's expression change (hard swap: characters do not cross-fade faces)
        if (ln.emotion && heads[side].variants[ln.emotion]) {
          const vs = heads[side].variants; const want = ln.emotion;
          Loom.call(() => {}, t);
          Loom.tl.set(Object.values(vs), { visibility: "hidden" }, t - 0.05);
          Loom.tl.set(vs[want], { visibility: "visible" }, t - 0.05);
        }
        Loom.tween(heads[side].E.life, { y: 0 }, { y: -10, duration: 0.25, ease: Loom.ease.move, yoyo: true, repeat: 1 }, t - 0.05, { kind: "lean", content: true });
      });
      if (p.caption) {
        const c = ctx.el("caption", { x: 460, y: 880, w: 1000, h: 50, kind: "text" });
        kit.kicker(c.inner, p.caption, { x: 0, y: 0, w: 1000, h: 40, align: "center" });
        m.drop(c, H.when(ctx, p.say_caption, 0.85, "caption"));
      }
      H.ordered(ctx, times, "dialogue");
    },
  });

  /* ======================= recap ======================= */
  Loom.template("recap", {
    doc: "Consolidate: 3-5 tokens (icon + short label) light up one by one ON their words, joined by a thread that draws through them. Ends on the pocket rule if given (stamp). An item without an icon shows a check mark, which reads as 'do this': for a mistake or a myth give it an icon that says so (for example circle-x).",
    job: ["consolidate", "payoff"], register: "expressive", motion_is: "staging",
    props: {
      kicker: { type: "str" }, title: { type: "str", max_words: 9 }, say_title: { type: "anchor" },
      items: { type: "list", min: 2, max: 5, required: true, of: { label: { type: "str", required: true, max_words: 3 }, icon: { type: "icon" }, say: { type: "anchor", required: true } } },
      rule: { type: "str", max_words: 12 }, say_rule: { type: "anchor" },
    },
    build(ctx, p) {
      const { kit, m } = ctx; const B = ctx.box;
      const y0 = H.header(ctx, Object.assign({}, p), { align: "center" });
      const n = p.items.length; const cy = Math.max(y0 + 150, 440);
      const cells = kit.row({ x: B.x + 40, y: cy - 110, w: B.w - 80, h: 220 }, n, 40);
      const cs = cells.map((c) => c.x + c.w / 2);
      const thread = ctx.el("thread", { x: 0, y: 0, w: 1, h: 1, kind: "connector", exit: "recede" });
      const d = `M${cs[0]} ${cy} ` + cs.slice(1).map((x, i) => `Q${(cs[i] + x) / 2} ${cy + (i % 2 ? 90 : -90)} ${x} ${cy}`).join(" ");
      const th = kit.path(thread.inner, d, { stroke: "line", sw: 4, dash: "3 14" });
      th.setAttribute("stroke-dasharray", "3 14");
      const times = p.items.map((it, i) => H.when(ctx, it.say, 0.1 + (0.75 * i) / n, "item " + (i + 1)));
      if (!p.title) times[0] = H.lead(ctx, times[0]).at;   // with no title the first token leads (D-100)
      Loom.tween(thread.inner, { opacity: 0 }, { opacity: 1, duration: 0.6 }, times[0] - 0.3, { kind: "reveal" });
      p.items.forEach((it, i) => {
        // declared box includes the label, which is wider than the disc (L-50); contents shifted by 60 to match
        const E = ctx.el("token_" + (i + 1), { x: cs[i] - 160, y: cy - 100, w: 320, h: 320, kind: "token", exit: "recede" });
        H.iconDisc(ctx, E.inner, 160, 100, 94, it.icon || "check", "surface", "accent2");
        const lab = kit.text(E.inner, it.label, { role: "lead", x: 0, y: 220, w: 320, h: 60, maxLines: 1, align: "center", weight: 800 });
        m.pop(E, times[i], { overshoot: false });
        Loom.tween(lab, { fill: Loom.style.c("accent2") }, { fill: Loom.style.c("ink"), duration: 0.6 }, times[i] + 0.4, { kind: "emphasis" });
      });
      if (p.rule) {
        const r = ctx.el("rule", { x: B.x + B.w / 2 - 620, y: 770, w: 1240, h: 96, kind: "stamp", exit: "recede" });
        const rt = Loom.style.role("recap_rule", "accent2");
        kit.pill(r.inner, 0, 0, 1240, 96, { fill: rt });
        kit.text(r.inner, p.rule, { role: "lead", x: 30, y: 0, w: 1180, h: 96, maxLines: 1, align: "center", valign: "middle", weight: 800, color: Loom.style.pickTokenOn(rt) });
        m.stamp(r, H.when(ctx, p.say_rule, 0.85, "rule"));
      }
    },
  });

  /* ======================= icon.grid ======================= */
  Loom.template("icon.grid", {
    doc: "A set of PEERS (3-6 members of one category). They pop left to right with a tight stagger ON their words; peers never get a serial slow build (that implies rank).",
    job: ["orient", "distinguish", "consolidate"], register: "productive", motion_is: "staging",
    props: {
      kicker: { type: "str" }, title: { type: "str", max_words: 9 }, say_title: { type: "anchor" },
      items: { type: "list", min: 2, max: 6, required: true, of: { icon: { type: "icon", required: true }, label: { type: "str", required: true, max_words: 4 }, sub: { type: "str", max_words: 8 }, say: { type: "anchor" } } },
    },
    build(ctx, p) {
      const { kit, m } = ctx; const B = ctx.box;
      const y0 = H.header(ctx, p, { align: "center" });
      const n = p.items.length; const cols = n <= 3 ? n : Math.ceil(n / 2); const rows = Math.ceil(n / cols);
      const cellH = 300; const top = y0 + Math.max(20, (900 - y0 - rows * cellH) / 2);
      p.items.forEach((it, i) => {
        const r = Math.floor(i / cols), c = i % cols;
        const cells = kit.row({ x: B.x + 60, y: top + r * cellH, w: B.w - 120, h: cellH }, cols, 50);
        const cell = cells[c];
        const E = ctx.el("item_" + (i + 1), { x: cell.x, y: cell.y, w: cell.w, h: cellH - 20, kind: "card", exit: "recede" });
        H.iconDisc(ctx, E.inner, cell.w / 2, 90, 80, it.icon, "surface", ["accent", "accent2", "accent4", "accent3"][i % 4]);
        kit.text(E.inner, it.label, { role: "lead", x: 0, y: 186, w: cell.w, h: 50, maxLines: 1, align: "center", weight: 800 });
        if (it.sub) kit.text(E.inner, it.sub, { role: "label", x: 10, y: 236, w: cell.w - 20, h: 60, maxLines: 2, align: "center", color: "muted" });
        let t = it.say ? H.cue(ctx, it.say) : H.when(ctx, p.say_title, 0.1, "items") + 0.4 + i * 0.09;
        if (i === 0 && !p.title) t = H.lead(ctx, t).at;   // with no title the first peer leads (D-100)
        m.pop(E, t, { overshoot: false });
      });
    },
  });

  /* ======================= cycle ======================= */
  Loom.template("cycle", {
    doc: "A loop that returns (3-6 stages). Nodes arrive clockwise from twelve ON their words; each arc draws as its pair exists; the CLOSING arc draws last - a loop is only a loop once it closes.",
    job: ["sequence", "relate"], register: "productive", motion_is: "content",
    props: {
      kicker: { type: "str" }, title: { type: "str", max_words: 9 }, say_title: { type: "anchor" },
      nodes: { type: "list", min: 3, max: 6, required: true, of: { label: { type: "str", required: true, max_words: 3 }, icon: { type: "icon" }, say: { type: "anchor", required: true } } },
      center: { type: "str", max_words: 3 }, say_center: { type: "anchor" }, say_close: { type: "anchor" },
    },
    build(ctx, p) {
      const { kit, m } = ctx; const B = ctx.box;
      const y0 = p.title ? H.header(ctx, p, { align: "left" }) : B.y;
      const cx = 960, cy = Math.max(y0 + 330, 520), R = Math.min(300, (900 - y0) / 2 - 90);
      const n = p.nodes.length;
      const pos = p.nodes.map((_, i) => { const a = -Math.PI / 2 + (i / n) * Math.PI * 2; return [cx + Math.cos(a) * R, cy + Math.sin(a) * R, a]; });
      const times = p.nodes.map((nd, i) => H.when(ctx, nd.say, 0.1 + (0.75 * i) / n, "node " + (i + 1)));
      H.ordered(ctx, times, "cycle");
      const L1 = p.title ? null : H.lead(ctx, times[0]);   // with no title the first node leads (D-100)
      const nr = 74;
      for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const a0 = pos[i][2] + 0.34, a1 = pos[j][2] - 0.34 + (j === 0 ? Math.PI * 2 : 0);
        const x0 = cx + Math.cos(a0) * R, y0a = cy + Math.sin(a0) * R, x1 = cx + Math.cos(a1) * R, y1 = cy + Math.sin(a1) * R;
        const arc = ctx.el("arc_" + (i + 1), { x: 0, y: 0, w: 1, h: 1, kind: "connector", exit: "recede" });
        const path = kit.path(arc.inner, `M${x0} ${y0a} A${R} ${R} 0 0 1 ${x1} ${y1}`, { stroke: j === 0 ? "accent2" : "line", sw: 6 });
        const tDraw = j === 0 ? (p.say_close ? H.cue(ctx, p.say_close) : times[n - 1] + 0.8) : Math.max(times[i] + 0.3, times[j] - 0.55);
        m.draw(path, tDraw, { dur: j === 0 ? 0.8 : 0.5 });
        arc.revealT = tDraw;
      }
      p.nodes.forEach((nd, i) => {
        const [x, y] = pos[i];
        const below = Math.sin(pos[i][2]) > 0.2, above = Math.sin(pos[i][2]) < -0.2;
        const lx = Math.cos(pos[i][2]) > 0.3 ? 2 * nr + 14 : Math.cos(pos[i][2]) < -0.3 ? -334 : -110;
        const ly = above ? -64 : below ? 2 * nr + 10 : nr - 28;
        const al = lx > 0 ? "left" : lx < -200 ? "right" : "center";
        const lw = al === "center" ? 2 * nr + 220 : 320;
        // the declared box covers the label beside the disc: the truth the layout checks measure (L-50); the label
        // left its 148 px box (text_outside_element). Contents are shifted by (ox, oy) to match.
        const bx0 = Math.min(0, lx), by0 = Math.min(0, ly), ox = -bx0, oy = -by0;
        const E = ctx.el("node_" + (i + 1), { x: x - nr + bx0, y: y - nr + by0, w: Math.max(2 * nr, lx + lw) - bx0, h: Math.max(2 * nr, ly + 56) - by0, kind: "node", exit: "recede" });
        H.iconDisc(ctx, E.inner, nr + ox, nr + oy, nr, nd.icon, "surface", "accent2");
        const lt = kit.text(E.inner, nd.label, { role: "lead", x: lx + ox, y: ly + oy, w: lw, h: 56, maxLines: 1, align: al, weight: 800 });
        if (i === 0) H.mark(ctx, lt, L1);
        m.pop(E, i === 0 && L1 ? L1.at : times[i], { overshoot: false });
      });
      if (p.center) {
        const c = ctx.el("center", { x: cx - 200, y: cy - 50, w: 400, h: 100, kind: "text", exit: "recede" });
        kit.text(c.inner, p.center, { role: "title", x: 0, y: 0, w: 400, h: 100, maxLines: 1, align: "center", valign: "middle", color: "accent2", size: 64 });
        m.stamp(c, H.when(ctx, p.say_center, 0.9, "center"));
      }
    },
  });

  /* ======================= timeline ======================= */
  Loom.template("timeline", {
    doc: "Events in time. The spine draws left to right first, then events settle in date order ON their words, each tick with its label.",
    job: ["sequence"], register: "productive", motion_is: "staging",
    props: {
      kicker: { type: "str" }, title: { type: "str", max_words: 9 }, say_title: { type: "anchor" },
      events: { type: "list", min: 2, max: 6, required: true, of: { when: { type: "str", required: true, max_words: 3 }, label: { type: "str", required: true, max_words: 8 }, say: { type: "anchor", required: true } } },
    },
    build(ctx, p) {
      const { kit, m } = ctx; const B = ctx.box;
      const y0 = H.header(ctx, p);
      const y = Math.max(y0 + 240, 520), x0 = B.x + 40, x1 = B.x + B.w - 40;
      const sp = ctx.el("spine", { x: 0, y: 0, w: 1, h: 1, kind: "structure", exit: "recede" });
      kit.arrow(sp.inner, x0, y, x1, y, { stroke: "line", sw: 5 });
      const times = p.events.map((e, i) => H.when(ctx, e.say, 0.15 + (0.7 * i) / p.events.length, "event " + (i + 1)));
      m.draw(sp, Math.max(ctx.start + 0.1, Math.min(times[0] - 0.9, H.structAt(ctx))), { dur: 0.8 });   // the spine is structure (D-100)
      const n = p.events.length;
      p.events.forEach((ev, i) => {
        const x = x0 + ((i + 0.5) / n) * (x1 - x0 - 40);
        const up = i % 2 === 0;
        const E = ctx.el("event_" + (i + 1), { x: x - 150, y: up ? y - 250 : y + 30, w: 300, h: 220, kind: "card", exit: "sink" });
        kit.line(E.inner, 150, up ? 220 : 0, 150, up ? 170 : 50, { stroke: "line", sw: 4, crisp: true });
        const dt = Loom.style.role("date", "accent2");
        kit.disc(E.inner, 150, up ? 250 : -30, 14, { fill: dt, shadow: false });
        kit.text(E.inner, ev.when, { role: "lead", x: 0, y: up ? 0 : 60, w: 300, h: 50, maxLines: 1, align: "center", weight: 800, color: dt });
        kit.text(E.inner, ev.label, { role: "body", x: 0, y: up ? 52 : 112, w: 300, h: 110, maxLines: 2, align: "center" });
        m.settle(E, times[i], { dy: up ? 20 : -20 });
      });
      H.ordered(ctx, times, "timeline");
    },
  });

  /* ======================= quote ======================= */
  Loom.template("quote", {
    doc: "A line worth hearing exactly: the quote mark drops, the words print (unmask), attribution settles last. Only for genuine quotes from the source or a clearly framed invented line ('imagine someone says').",
    job: ["hook", "define", "scenario"], register: "productive", motion_is: "staging",
    props: {
      quote: { type: "str", required: true, max_words: 30 }, say: { type: "anchor", required: true },
      attribution: { type: "str", max_words: 8 }, say_attribution: { type: "anchor" },
    },
    build(ctx, p) {
      const { kit, m } = ctx; const B = ctx.box;
      const LQ = H.lead(ctx, H.when(ctx, p.say, 0.05, "quote"));   // never an empty frame (D-100)
      const t = LQ.at;
      // the element's box is the glyph's box (it was 40 px shorter, so check flagged the quote mark leaving it)
      const mk = ctx.el("mark", { x: B.x + 140, y: 180, w: 160, h: 200, kind: "text", exit: "sink" });
      kit.text(mk.inner, "“", { role: "display", x: 0, y: 0, w: 160, h: 200, maxLines: 1, color: "accent", size: 200 });
      m.drop(mk, t - 0.3);
      const q = ctx.el("quote", { x: B.x + 300, y: 260, w: B.w - 440, h: 420, kind: "text", exit: "wipe" });
      const qt = kit.text(q.inner, p.quote, { role: "title", x: 0, y: 0, w: B.w - 440, h: 420, maxLines: 5, size: 70 });
      q.h = qt.__fit.height + 10; q.w = B.w - 440;
      m.unmask(q, t, { dir: "ttb", dur: Math.min(2.2, 0.5 + qt.__fit.lines.length * 0.4) });
      if (p.attribution) {
        const a = ctx.el("attribution", { x: B.x + 300, y: 260 + qt.__fit.height + 40, w: 900, h: 50, kind: "text", exit: "sink" });
        kit.text(a.inner, p.attribution, { role: "lead", x: 0, y: 0, w: 900, h: 50, maxLines: 1, color: "muted" });
        m.settle(a, H.when(ctx, p.say_attribution, 0.8, "attribution"));
      }
    },
  });
})();
