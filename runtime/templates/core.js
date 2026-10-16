/* Core templates: the teaching forms that carry ~half of a lesson.
 * Each obeys the build grammar (frame -> structure -> focus -> detail -> consequence) and reveals
 * ON the narration word given in `say`. Props schemas are data, extracted into catalog.json.
 */
(function () {
  "use strict";
  const Loom = window.Loom;
  const H = Loom.th;

  /* ======================= title.card ======================= */
  Loom.template("title.card", {
    doc: "Opener, section divider or payoff title. Kicker drops, title prints (unmask), subtitle settles, optional hero icon irises open. The block is vertically centred. Spectacle is allowed here (expressive register).",
    job: ["orient", "transition", "consolidate", "hook", "payoff"], register: "expressive", motion_is: "staging",
    props: {
      kicker: { type: "str", max_words: 4 }, say_kicker: { type: "anchor" },
      title: { type: "str", required: true, max_words: 9 }, say_title: { type: "anchor" },
      subtitle: { type: "str", max_words: 16 }, say_subtitle: { type: "anchor" },
      icon: { type: "icon" }, say_icon: { type: "anchor" },
      align: { type: "enum", choices: ["center", "left"], default: "center" },
      accent: { type: "token", default: "accent" },
      panel: { type: "bool", default: false },
    },
    build(ctx, p) {
      const { kit, m } = ctx; const B = ctx.box;
      const center = (p.align || "center") === "center";
      const stack = [];
      // optional backing panel (for titles laid over busy content, e.g. inside a zoom-through)
      const panel = p.panel ? ctx.el("title_panel", { x: 150, y: 150, w: 1620, h: 780, kind: "panel", exit: "recede" }) : null;
      if (panel) { kit.rect(panel.inner, 0, 0, 1620, 780, { fill: "field2", r: 60, shadow: false }); m.iris(panel, ctx.start + 0.02, { dur: 0.5 }); }
      const LT = H.lead(ctx, H.when(ctx, p.say_title, 0.02, "title"));   // never an empty frame (D-100)
      const tTitle = LT.at;
      if (p.icon) {
        const ic = ctx.el("hero_icon", { x: 960 - 110, y: 0, w: 220, h: 220, kind: "icon", exit: "iris" });
        H.iconDisc(ctx, ic.inner, 110, 110, 104, p.icon, p.accent || "accent");
        m.iris(ic, Math.max(ctx.start + 0.05, H.when(ctx, p.say_icon, 0, "icon") - (p.say_icon ? 0 : 0.35)));
        stack.push([ic, 220]);
      }
      if (p.kicker) {
        const k = ctx.el("kicker", { x: B.x, y: 0, w: B.w, h: 36, kind: "text", exit: "sink" });
        kit.kicker(k.inner, p.kicker, { x: 0, y: 0, w: B.w, h: 36, align: center ? "center" : "left" });
        m.drop(k, Math.max(ctx.start + 0.1, (p.say_kicker ? H.cue(ctx, p.say_kicker) : tTitle - 0.3)));
        stack.push([k, 36]);
      }
      const t = ctx.el("title", { x: B.x + 60, y: 0, w: B.w - 120, h: 230, kind: "text", exit: "advance" });
      const tt = kit.text(t.inner, p.title, { role: "title", x: 0, y: 0, w: B.w - 120, h: 230, maxLines: 2, align: center ? "center" : "left" });
      t.h = tt.__fit.height + 10;
      m.unmask(t, tTitle);
      if (LT.early) m.highlight(tt, LT.word, { opacity: 0.22 });
      stack.push([t, tt.__fit.height]);
      const rule = ctx.el("title_rule", { x: 960 - 90, y: 0, w: 180, h: 8, kind: "shape", exit: "recede" });
      // a marker rule in sketch (whiteboard guide s15), the crisp rule elsewhere as before
      kit.line(rule.inner, 0, 4, 180, 4, { stroke: p.accent || "accent", sw: 8, crisp: Loom.style.pack.shape.shading !== "sketch" });
      m.draw(rule, tTitle + 0.35, { dur: 0.5 });
      stack.push([rule, 8]);
      if (p.subtitle) {
        const sEl = ctx.el("subtitle", { x: B.x + 160, y: 0, w: B.w - 320, h: 120, kind: "text", exit: "sink" });
        const st = kit.text(sEl.inner, p.subtitle, { role: "lead", x: 0, y: 0, w: B.w - 320, h: 120, maxLines: 2, align: center ? "center" : "left", color: "muted" });
        m.settle(sEl, H.when(ctx, p.say_subtitle, 0.45, "subtitle"));
        stack.push([sEl, st.__fit.height]);
      }
      kit.vcenter(stack, B.y, B.y + B.h, 30, 20);
    },
  });

  /* ======================= definition ======================= */
  Loom.template("definition", {
    doc: "Define one term. The term drops in, a rule draws, the definition prints line by line (unmask), an optional concrete example settles last. The block is vertically centred. Restrained register: nothing moves in the reading zone after it lands.",
    job: ["define"], register: "productive", motion_is: "staging",
    props: {
      kicker: { type: "str", max_words: 4 },
      term: { type: "str", required: true, max_words: 5 }, say_term: { type: "anchor", required: true },
      definition: { type: "str", required: true, max_words: 28 }, say_definition: { type: "anchor", required: true },
      example: { type: "str", max_words: 22 }, say_example: { type: "anchor" },
      icon: { type: "icon" },
    },
    build(ctx, p) {
      const { kit, m } = ctx; const B = ctx.box;
      const blk = ctx.group();
      const hasIcon = !!p.icon;
      const x0 = B.x + (hasIcon ? 340 : 120), w = B.w - (hasIcon ? 420 : 240);
      let y = 0;
      const LT = H.lead(ctx, H.when(ctx, p.say_term, 0, "term"));   // never an empty frame (D-100)
      const tTerm = LT.at;
      if (p.kicker) {
        const k = ctx.el("kicker", { parent: blk, x: x0, y, w, h: 36, kind: "text", exit: "sink" });
        kit.kicker(k.inner, p.kicker, { x: 0, y: 0, w, h: 36 });
        m.drop(k, Math.max(ctx.start + 0.05, tTerm - 0.3));
        y += 56;
      }
      const termTop = y;
      const term = ctx.el("term", { parent: blk, x: x0, y, w, h: 120, kind: "text", exit: "wipe" });
      const tt = kit.text(term.inner, p.term, { role: "title", x: 0, y: 0, w, h: 120, maxLines: 1, color: Loom.style.role("term", "accent2") });
      m.drop(term, tTerm);
      if (LT.early) m.highlight(tt, LT.word, { opacity: 0.22 });
      y += tt.__fit.height + 24;
      const rule = ctx.el("rule", { parent: blk, x: x0, y, w: 220, h: 8, kind: "shape", exit: "recede" });
      kit.line(rule.inner, 0, 4, 220, 4, { stroke: Loom.style.role("term", "accent"), sw: 7, crisp: Loom.style.pack.shape.shading !== "sketch" });   // follows the term role when a pack sets one
      m.draw(rule, tTerm + 0.3, { dur: 0.45 });
      y += 40;
      const def = ctx.el("definition", { parent: blk, x: x0, y, w, h: 260, kind: "text", exit: "wipe" });
      const dt = kit.text(def.inner, p.definition, { role: "lead", x: 0, y: 0, w: Math.min(w, 1180), h: 260, maxLines: 4 });
      def.h = dt.__fit.height + 8; def.w = Math.min(w, 1180);
      const tDef = H.when(ctx, p.say_definition, 0.3, "definition");
      m.unmask(def, tDef, { dir: "ttb", dur: Math.min(1.6, 0.5 + dt.__fit.lines.length * 0.35) });
      y += dt.__fit.height + 44;
      if (p.example) {
        const exW = Math.min(w, 1180);
        const ex = ctx.el("example", { parent: blk, x: x0, y, w: exW, h: 150, kind: "card", exit: "sink" });
        kit.card(ex.inner, 0, 0, exW, 150, { fill: "surface" });
        kit.text(ex.inner, "e.g.", { role: "label", x: 32, y: 24, w: 90, h: 40, maxLines: 1, color: "accent2" });
        kit.text(ex.inner, p.example, { role: "body", x: 120, y: 22, w: exW - 160, h: 110, maxLines: 2, valign: "middle" });
        const tEx = H.when(ctx, p.say_example, 0.7, "example");
        m.settle(ex, tEx); H.lateCheck(ctx, tEx, "example");
        y += 150;
      }
      if (hasIcon) {
        const ic = ctx.el("term_icon", { parent: blk, x: B.x + 60, y: termTop - 40, w: 220, h: 220, kind: "icon", exit: "iris" });
        H.iconDisc(ctx, ic.inner, 110, 110, 104, p.icon, Loom.style.role("term", "accent4"));
        m.iris(ic, Math.max(ctx.start + 0.05, tTerm - 0.25));
      }
      ctx.shift(blk, 0, B.y + (B.h - y) / 2 - 10);
      H.ordered(ctx, [tTerm, tDef], "definition");
    },
  });

  /* ======================= list.steps ======================= */
  Loom.template("list.steps", {
    doc: "An ordered procedure or checklist (3-6 items). Title first, then each item settles ON its spoken words, its number/tick arriving WITH it (never as its own step).",
    job: ["sequence", "consolidate"], register: "productive", motion_is: "staging",
    props: {
      kicker: { type: "str" }, title: { type: "str", max_words: 9 }, say_title: { type: "anchor" },
      items: { type: "list", min: 2, max: 6, required: true, of: { text: { type: "str", required: true, max_words: 12 }, say: { type: "anchor", required: true }, icon: { type: "icon" } } },
      marker: { type: "enum", choices: ["number", "tick", "icon"], default: "number" },
    },
    build(ctx, p) {
      const { kit, m } = ctx; const B = ctx.box;
      let y = H.header(ctx, p);
      const n = p.items.length;
      const avail = 900 - y;
      const rowH = Math.min(128, (avail - (n - 1) * 22) / n);
      // centre the list in the space under the title (a block floating at the top is a layout bug)
      y += Math.max(0, (avail - (n * rowH + (n - 1) * 22)) / 2 - 20);
      const times = [];
      p.items.forEach((it, i) => {
        const row = ctx.el("item_" + (i + 1), { x: B.x, y: y + i * (rowH + 22), w: B.w, h: rowH, kind: "row", exit: "sink" });
        kit.card(row.inner, 0, 0, B.w * 0.78, rowH, { fill: "surface" });
        const r = Math.min(40, rowH * 0.34);
        if ((p.marker || "number") === "number") {
          kit.disc(row.inner, 30 + r + 8, rowH / 2, r, { fill: "accent" });
          kit.text(row.inner, String(i + 1), { role: "label", x: 38, y: rowH / 2 - r * 0.72, w: 2 * r, h: r * 1.5, maxLines: 1, align: "center", color: Loom.style.pickTokenOn("accent"), weight: 800 });
        } else if (p.marker === "tick") kit.mark(row.inner, "yes", 30 + r + 8, rowH / 2, r * 2);
        else H.iconDisc(ctx, row.inner, 30 + r + 8, rowH / 2, r, it.icon || "circle", "accent");
        kit.text(row.inner, it.text, { role: "body", x: 30 + 2 * r + 44, y: 0, w: B.w * 0.78 - (2 * r + 110), h: rowH, maxLines: 2, valign: "middle" });
        let t = H.when(ctx, it.say, 0.15 + (0.7 * i) / n, "item " + (i + 1));
        if (i === 0 && !p.title) t = H.lead(ctx, t).at;   // with no title the first row leads (D-100)
        times.push(t); m.settle(row, t);
      });
      H.ordered(ctx, times, "list"); H.lateCheck(ctx, times[times.length - 1], "last item");
    },
  });

  /* ======================= compare.two ======================= */
  // a side: `valence` colours it (pos / neg / neutral), `verdict` judges it (right: a tick, wrong: a cross). They are
  // separate because a "bad thing" side (neg colour) is not a wrong answer: a red X there read as "this is the wrong
  // answer", and one lesson put the X on the CORRECT answer (fix_tpl, 2026-10-07). `tone` is the old name for valence.
  const SIDE = {
    header: { type: "str", required: true, max_words: 4 }, say: { type: "anchor", required: true },
    valence: { type: "enum", choices: ["pos", "neg", "neutral"] },
    verdict: { type: "enum", choices: ["right", "wrong", "none"] },
    tone: { type: "enum", choices: ["neg", "pos", "neutral"], deprecated: "use valence (colour only); tone draws no mark" },
    stance: { type: "enum", choices: ["myth", "fact", "none"] },
    icon: { type: "icon" },
    items: { type: "list", max: 4, of: { text: { type: "str", max_words: 10 }, say: { type: "anchor" }, empty: { type: "bool" } } },
  };
  Loom.template("compare.two", {
    doc: "Two sides as equals (before/after, do/don't, myth/fact, A vs B). The first side's panel is on screen by the lead time (its header marked ON its words), the other converges on its header's words; rows reveal on their words; an optional verdict stamps last after a hold. mode 'pairs' reveals row by row across both sides; 'columns' left block then right block. Per side: `valence` (pos/neg/neutral) only COLOURS the side; `verdict` (right/wrong) draws a tick or a cross, so use it only when one side is the correct answer and the other is not. `tone` is deprecated: it maps to valence and draws no mark. An item with `empty: true` is a blank slot (a dashed rule, no words): never write placeholder words like 'blank'. `stance: myth` tags a side MYTH and strikes its header; `stance: fact` tags it FACT (a myth/fact contrast says which is which).",
    job: ["distinguish"], register: "productive", motion_is: "staging",
    chrome: ["Myth", "Fact"],   // the stance tags this template draws itself
    props: {
      kicker: { type: "str" }, title: { type: "str", max_words: 9 }, say_title: { type: "anchor" },
      left: { type: "obj", required: true, of: SIDE },
      right: { type: "obj", required: true, of: SIDE },
      verdict: { type: "obj", of: { text: { type: "str", max_words: 10 }, say: { type: "anchor" } } },
      mode: { type: "enum", choices: ["pairs", "columns"], default: "columns" },
    },
    build(ctx, p) {
      const { kit, m } = ctx; const B = ctx.box;
      let y = H.header(ctx, p);
      const bottom = p.verdict ? 790 : 900;
      const maxItems = Math.max((p.left.items || []).length, (p.right.items || []).length);
      const rowTarget = 104;
      const want = 104 + 30 + Math.max(1, maxItems) * rowTarget + 30;
      const ph = Math.min(bottom - y, Math.max(320, want));
      const top = y + Math.max(0, (bottom - y - ph) / 2);
      const cols = kit.split({ x: B.x + 40, y: top, w: B.w - 80, h: ph }, 0.5, 56);
      const sides = [p.left, p.right];
      const valenceOf = (sd) => {
        if (sd.valence) return sd.valence;
        if (sd.tone) { Loom.warn("compare_tone_deprecated", `${ctx.beat.id}: compare.two 'tone' is deprecated: it now only colours the side (valence); use verdict: right|wrong for a tick or a cross`, { beat: ctx.beat.id }); return sd.tone; }
        return "neutral";
      };
      const toneFill = (v) => (v === "neg" ? "neg" : v === "pos" ? "pos" : "surface");
      // each header's time, asked once; the side spoken first leads (D-100): on screen by the structure time
      const tHs = sides.map((sd, si) => H.when(ctx, sd.say, 0.05 + si * 0.4, `${si ? "right" : "left"} header`));
      const first = tHs[1] < tHs[0] ? 1 : 0;
      // each item's time, asked once, BEFORE its panel: an item spoken before its side's header showed with no panel
      // and no header (openai fork b20 "Could you flag it then?", b36, 2026-10-07)
      const itemTs = sides.map((sd, si) => (sd.items || []).map((it, i) => (it.empty
        ? (it.say ? H.cue(ctx, it.say) : null)
        : H.when(ctx, it.say, 0.15 + si * 0.4 + (0.3 * (i + 1)) / ((sd.items || []).length + 1), `${si ? "right" : "left"} item ${i + 1}`))));
      const allTimes = [];
      sides.forEach((sd, si) => {
        const c = cols[si];
        const val = valenceOf(sd);
        const verdict = sd.verdict === "right" || sd.verdict === "wrong" ? sd.verdict : null;
        const panel = ctx.el(si ? "right_panel" : "left_panel", { x: c.x, y: c.y, w: c.w, h: c.h, kind: "panel", exit: "displace" });
        kit.card(panel.inner, 0, 0, c.w, c.h, { fill: "surface" });
        const hf = toneFill(val);
        const band = hf === "surface" ? "surface2" : hf;
        kit.rect(panel.inner, 0, 0, c.w, 104, { fill: band, shadow: false, flat: true });
        let hx = 36;
        if (verdict) { kit.mark(panel.inner, verdict === "right" ? "yes" : "no", 36 + 26, 52, 56, { fill: "field" }); hx = 110; }
        if (sd.icon) { kit.icon(panel.inner, sd.icon, { x: hx + 26, y: 52, size: 52, color: Loom.style.pickTokenOn(band) }); hx += 74; }
        const tagW = H.stanceTag(ctx, panel.inner, sd.stance, c.w, 104);
        const ht = kit.text(panel.inner, sd.header, { role: "lead", x: hx, y: 0, w: c.w - hx - 30 - tagW, h: 104, maxLines: 1, valign: "middle", weight: 800, color: Loom.style.pickTokenOn(band) });
        if (sd.stance === "myth") H.strike(ht);
        let tH = tHs[si];
        const firstItem = Math.min(Infinity, ...itemTs[si].filter((x) => x != null));
        if (si === first) { const LT = H.leadStruct(ctx, tH); tH = LT.at; H.mark(ctx, ht, LT); }
        if (firstItem - 0.15 < tH) {
          // the panel (its structure) is on screen before its first item; the header's words still mark ON their word
          const LT = { at: Math.max(0, firstItem - 0.15), word: tHs[si], early: tHs[si] - (firstItem - 0.15) > 0.4 };
          tH = LT.at; H.mark(ctx, ht, LT);
        }
        m.converge(panel, tH, { from: si ? "right" : "left" });
        allTimes.push(tH);
        const items = sd.items || [];
        const rowH = Math.min(rowTarget + 14, (c.h - 150) / Math.max(1, items.length));
        items.forEach((it, i) => {
          const r = ctx.el(`${si ? "right" : "left"}_item_${i + 1}`, { x: c.x + 36, y: c.y + 128 + i * rowH, w: c.w - 72, h: rowH - 12, kind: "row", exit: "displace" });
          kit.disc(r.inner, 12, (rowH - 12) / 2, 8, { fill: val === "neg" ? "neg" : val === "pos" ? "pos" : "accent", shadow: false, flat: true });
          let t;
          if (it.empty) {
            // a blank slot: a dashed rule where the words would be, revealed with its panel (it is structure)
            kit.line(r.inner, 40, (rowH - 12) * 0.62, c.w - 120, (rowH - 12) * 0.62, { stroke: "muted", sw: 4, dash: "14 12", crisp: true });
            t = itemTs[si][i] != null ? itemTs[si][i] : tH + 0.2 + 0.08 * i;
          } else {
            if (!it.text) Loom.error("compare_item_without_text", `${ctx.beat.id}: ${si ? "right" : "left"} item ${i + 1} has no text: give text, or empty: true for a blank slot`, { beat: ctx.beat.id });
            kit.text(r.inner, it.text || "", { role: "body", x: 40, y: 0, w: c.w - 120, h: rowH - 12, maxLines: 2, valign: "middle" });
            t = itemTs[si][i];
          }
          m.reveal(r, t); allTimes.push(t);
        });
      });
      if (p.verdict) {
        const v = ctx.el("verdict", { x: B.x + B.w / 2 - 520, y: 818, w: 1040, h: 96, kind: "stamp", exit: "recede" });
        const vt = Loom.style.role("verdict", "accent2");
        kit.pill(v.inner, 0, 0, 1040, 96, { fill: vt });
        kit.text(v.inner, p.verdict.text, { role: "lead", x: 30, y: 0, w: 980, h: 96, maxLines: 1, align: "center", valign: "middle", weight: 800, color: Loom.style.pickTokenOn(vt) });
        const tv = H.when(ctx, p.verdict.say, 0.85, "verdict");
        m.stamp(v, tv); allTimes.push(tv);
      }
    },
  });

  /* ======================= process.flow ======================= */
  Loom.template("process.flow", {
    doc: "A process that runs (3-5 steps). The rail exists first; step 1 settles; each connector DRAWS INTO the next step, which then arrives - all on the spoken words. Optional token travels the chain as each step is named (value travel: the motion IS the process).",
    job: ["sequence", "relate"], register: "productive", motion_is: "content",
    props: {
      kicker: { type: "str" }, title: { type: "str", max_words: 9 }, say_title: { type: "anchor" },
      steps: { type: "list", min: 2, max: 5, required: true, of: { label: { type: "str", required: true, max_words: 4 }, sub: { type: "str", max_words: 8 }, say: { type: "anchor", required: true }, icon: { type: "icon" } } },
      token: { type: "obj", of: { icon: { type: "icon" }, label: { type: "str", max_words: 2 } } },
    },
    build(ctx, p) {
      const { kit, m } = ctx; const B = ctx.box;
      const y0 = H.header(ctx, p);
      const n = p.steps.length;
      const cy = Math.max(y0 + 190, 480);
      const cells = kit.row({ x: B.x + 20, y: cy - 150, w: B.w - 40, h: 300 }, n, 120);
      const r = Math.min(104, cells[0].w / 2 - 20);
      const times = p.steps.map((s, i) => H.when(ctx, s.say, 0.1 + (0.8 * i) / n, "step " + (i + 1)));
      H.ordered(ctx, times, "process");
      // with no title the first step leads (D-100, as list.steps); its label is marked when it is spoken
      const L1 = p.title ? null : H.lead(ctx, times[0]);
      const centres = cells.map((c) => [c.x + c.w / 2, cy]);
      p.steps.forEach((s, i) => {
        const [x, y] = centres[i];
        // the declared box covers the labels too (they are wider than the disc), so it is the truth the
        // camera, joins and layout checks measure (L-50); everything inside is shifted by ox to match
        const ox = 80;
        const node = ctx.el("step_" + (i + 1), { x: x - r - ox, y: y - r, w: 2 * r + 2 * ox, h: 2 * r + 200, kind: "node", exit: "recede" });
        H.iconDisc(ctx, node.inner, r + ox, r, r, s.icon, i === n - 1 ? "accent" : "surface", i === n - 1 ? Loom.style.pickTokenOn("accent") : "accent2");
        if (!s.icon) kit.text(node.inner, String(i + 1), { role: "title", x: ox, y: r * 0.45, w: 2 * r, h: r * 1.2, maxLines: 1, align: "center" });
        // measure, then draw (L-56): a label too wide for one line in this style's face takes two, and the sub follows it
        const lf = kit.fit(s.label, { role: "lead", w: 2 * r + 120, maxLines: 2, weight: 800 });
        const lh = Math.max(60, Math.ceil(lf.height));
        const lt = kit.text(node.inner, s.label, { role: "lead", x: ox - 60, y: 2 * r + 22, w: 2 * r + 120, h: lh, maxLines: 2, align: "center", weight: 800 });
        if (i === 0) H.mark(ctx, lt, L1);
        if (s.sub) kit.text(node.inner, s.sub, { role: "label", x: ox - 80, y: 2 * r + 22 + lh, w: 2 * r + 160, h: 80, maxLines: 2, align: "center", color: "muted" });
        if (i > 0) {
          const [px] = centres[i - 1];
          const con = ctx.el("link_" + i, { x: 0, y: 0, w: 1, h: 1, kind: "connector", exit: "recede" });
          const a = kit.arrow(con.inner, px + r + 18, y, x - r - 18, y, { stroke: "line" });
          const tDraw = Math.max(times[i - 1] + 0.35, times[i] - 0.55);
          m.draw(a, tDraw, { dur: 0.5 });   // the head lands at 90% of the draw (m.draw's arrow option)
          con.revealT = tDraw;
        }
        m.pop(node, i === 0 && L1 ? L1.at : times[i]);
      });
      if (p.token) {
        const tk = ctx.el("token", { x: 0, y: 0, w: 1, h: 1, kind: "token", exit: "recede" });
        const g = Loom.svg("g", {}, tk.inner);
        kit.pill(g, -70, -30, 140, 60, { fill: "ink", shadow: false });
        if (p.token.icon) kit.icon(g, p.token.icon, { x: -36, y: 0, size: 32, color: "field" });
        if (p.token.label) kit.text(g, p.token.label, { role: "label", x: p.token.icon ? -14 : -60, y: -20, w: p.token.icon ? 80 : 120, h: 40, maxLines: 1, color: "field", weight: 800, align: p.token.icon ? "left" : "center" });
        const path = kit.path(ctx.g, `M${centres[0][0]} ${cy - r - 44} ` + centres.slice(1).map((c) => `L${c[0]} ${cy - r - 44}`).join(" "), { stroke: "none" });
        path.setAttribute("opacity", "0");
        m.reveal(tk, times[0] + 0.2, { dy: 0 });
        // the token moves one hop per step, ON each step's word
        for (let i = 1; i < n; i++) m.along(tk, path, times[i] - 0.4, { from: (i - 1) / (n - 1), to: i / (n - 1), dur: 0.6, ease: "move" });
        m.along(tk, path, times[0] + 0.2, { from: 0, to: 0, dur: 0.01 });
      }
    },
  });

  /* ======================= stat.hero ======================= */
  Loom.template("stat.hero", {
    doc: "ONE number that matters. Kicker drops, the figure counts up from zero and lands ON the spoken number, caption settles. The number must be grounded (source or knowledge sheet).",
    job: ["quantify"], register: "productive", motion_is: "content",
    props: {
      kicker: { type: "str", max_words: 4 }, value: { type: "number", required: true }, decimals: { type: "int", default: 0 },
      prefix: { type: "str" }, suffix: { type: "str" }, say: { type: "anchor", required: true },
      caption: { type: "str", max_words: 16 }, say_caption: { type: "anchor" }, icon: { type: "icon" },
    },
    build(ctx, p) {
      const { kit, m } = ctx; const B = ctx.box;
      const tNum = H.when(ctx, p.say, 0.3, "value");
      if (p.kicker) { const k = ctx.el("kicker", { x: B.x, y: 180, w: B.w, h: 40, kind: "text", exit: "sink" }); kit.kicker(k.inner, p.kicker, { x: 0, y: 0, w: B.w, h: 36, align: "center" }); m.drop(k, Math.min(tNum - 1.0, ctx.at(0.05))); }
      const fmt = (v) => (p.prefix || "") + Number(v).toFixed(p.decimals || 0) + (p.suffix || "");
      const hero = ctx.el("hero_value", { x: B.x, y: 250, w: B.w, h: 260, kind: "value", exit: "recede" });
      const tt = kit.text(hero.inner, fmt(p.value), { role: "display", x: 0, y: 0, w: B.w, h: 260, maxLines: 1, align: "center", color: Loom.style.role("stat_value", "accent2") });
      const tStart = Math.max(ctx.start + 0.1, tNum - 1.0);
      // the figure is on screen by the lead time, holding its start value (0), and counts up to land ON the number
      // (D-100: a late number left the frame empty, or a lone kicker, for seconds)
      m.reveal(hero, Math.min(tStart, H.leadAt(ctx)), { dy: 0, dur: 0.2 });
      m.count(tt, tStart, { from: 0, to: p.value, dur: tNum - tStart + 0.05, fmt });
      m.emphasis(hero, tNum + 0.08, { amount: 0.04 });
      if (p.caption) {
        const c = ctx.el("caption", { x: B.x + 200, y: 560, w: B.w - 400, h: 140, kind: "text", exit: "sink" });
        kit.text(c.inner, p.caption, { role: "lead", x: 0, y: 0, w: B.w - 400, h: 140, maxLines: 2, align: "center", color: "muted" });
        m.settle(c, H.when(ctx, p.say_caption, 0.6, "caption"));
      }
    },
  });
})();
