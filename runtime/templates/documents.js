/* Workplace artefacts as templates: a document/notes page, and a calendar plan. */
(function () {
  "use strict";
  const Loom = window.Loom;
  const H = Loom.th;

  /* ======================= document.page ======================= */
  Loom.template("document.page", {
    doc: "A page the learner recognises (notes, an email, a policy excerpt, a form). The page is on screen by the lead time (its title marked ON its words), then each line appears or is HIGHLIGHTED on its words (reading along). A line with `empty: true` is a blank ruled slot (no words), shown with the page: use it for a missing reply, a blank field or an unwritten line, never placeholder words like 'blank'. Every other line needs `text`. The lines are the page's followers: they leave with it. Optional character beside it. Name it 'page' so later beats can keep it (storyboard keep: [\"page\"]). `stance: myth` tags the page MYTH and strikes its title (a claim the lesson refutes); `stance: fact` tags it FACT.",
    job: ["demonstrate", "scenario", "define"], register: "productive", motion_is: "staging",
    chrome: ["Myth", "Fact"],   // the stance tags this template draws itself
    props: {
      kind: { type: "enum", choices: ["notes", "email", "policy", "form"], default: "notes" },
      title: { type: "str", required: true, max_words: 6 }, say_title: { type: "anchor" },
      lines: { type: "list", min: 2, max: 6, required: true, of: { text: { type: "str", max_words: 9 }, say: { type: "anchor" }, empty: { type: "bool" } } },
      mode: { type: "enum", choices: ["appear", "highlight"], default: "highlight" },
      stance: { type: "enum", choices: ["myth", "fact", "none"] },
      side: { type: "enum", choices: ["left", "center"], default: "left" },
      variant: { type: "enum", choices: ["card", "paper"] },
      person: { type: "obj", of: { cast: { type: "str", max_words: 3 }, member: { type: "enum", choices: ["woman", "man", "girl", "boy", "elder_woman", "elder_man"], required: true }, emotion: { type: "enum", choices: ["neutral", "happy", "surprised", "explaining"] }, name: { type: "str", max_words: 3 } } },
    },
    build(ctx, p) {
      const { kit, m } = ctx;
      const pw = 760, ph = 780, px = (p.side || "left") === "center" ? 960 - pw / 2 : 200, py = 150;
      const page = ctx.el("page", { x: px, y: py, w: pw, h: ph, kind: "document", exit: "displace" });
      // the paper variant (story-cartoon guide s15 E7, 2026-10-08): a light page with ink words, for light
      // illustrated packs; `variant` prop, else the pack's templates["document.page"].variant, else the dark card
      const paper = (p.variant || ((Loom.style.pack.templates || {})["document.page"] || {}).variant) === "paper";
      kit.rect(page.inner, 0, 0, pw, ph, { fill: paper ? "surface" : "ink", r: 18 });
      if (Loom.style.pack.shape.shading === "sketch") {
        // a marker band (whiteboard guide s15): ONE rough path, round top corners and a square bottom, so no
        // second rect's edge crosses the title
        kit.sketch(page.inner, "path", ["M18 0 H" + (pw - 18) + " A18 18 0 0 1 " + pw + " 18 V92 H0 V18 A18 18 0 0 1 18 0 Z"], { fill: "accent4", stroke: "ink" });
      } else {
        // the header band is pure fill: crisp, so an outlining pack (toon, line) does not draw the extension's
        // top edge straight through the title (groupthink-trap b11, 2026-10-06)
        kit.rect(page.inner, 0, 0, pw, 92, { fill: "accent4", r: 18, shadow: false, flat: true, crisp: true });
        kit.rect(page.inner, 0, 60, pw, 32, { fill: "accent4", r: 0, shadow: false, flat: true, crisp: true });
      }
      const ic = { notes: "notebook-pen", email: "mail", policy: "scroll-text", form: "clipboard-list" }[p.kind || "notes"];
      kit.icon(page.inner, ic, { x: 52, y: 46, size: 40, color: Loom.style.pickTokenOn("accent4") });
      const tagW = H.stanceTag(ctx, page.inner, p.stance, pw, 92, 24);
      const tEl = kit.text(page.inner, p.title, { role: "lead", x: 90, y: 0, w: pw - 120 - tagW, h: 92, maxLines: 1, valign: "middle", weight: 800, color: Loom.style.pickTokenOn("accent4") });
      if (p.stance === "myth") H.strike(tEl);
      // the page is the structure: on screen by the lead time even when its title is spoken later (D-100); the title's
      // words are marked when they are spoken (fix_tpl 2026-10-07: pages waited up to 7.7 s for a late title)
      const LP = H.leadStruct(ctx, p.say_title ? H.cue(ctx, p.say_title) : ctx.start + 0.1);
      const t0 = LP.at;
      m.settle(page, Math.max(ctx.start + 0.05, t0 - 0.3), { dy: 40 });
      H.mark(ctx, tEl, LP);
      const n = p.lines.length;
      const lh = Math.min(118, (ph - 150) / n);
      const times = [];
      const lines = [];
      let firstSpoken = true;
      p.lines.forEach((ln, i) => {
        const y = 130 + i * lh;
        const L = ctx.el("line_" + (i + 1), { x: px + 50, y: py + y, w: pw - 100, h: lh - 16, kind: "text", exit: "displace" });
        lines.push(L);
        if (ln.empty) {
          // a blank slot: a ruled line, no words; it is part of the page, so it arrives with the page
          kit.line(L.inner, 0, (lh - 16) * 0.72, pw - 100, (lh - 16) * 0.72, { stroke: "muted", sw: 4, dash: "14 12", crisp: true });
          m.reveal(L, Math.max(ctx.start + 0.2, t0) + 0.05 * i, { dy: 0, dur: 0.3 });
          return;
        }
        if (!ln.text) Loom.error("document_line_without_text", `${ctx.beat.id}: line ${i + 1} has no text: give text, or empty: true for a blank slot`, { beat: ctx.beat.id });
        const t = ln.say ? H.cue(ctx, ln.say) : ctx.at(0.2 + (0.7 * i) / n);
        times.push(t);
        const tx = kit.text(L.inner, ln.text || "", { role: "body", x: 0, y: 0, w: pw - 100, h: lh - 16, maxLines: 2, valign: "middle", color: paper ? "ink" : "field" });
        if ((p.mode || "highlight") === "highlight") {
          m.reveal(L, Math.max(ctx.start + 0.2, t0) + 0.05 * i, { dy: 0, dur: 0.3 });
          m.highlight(tx, t, { color: "accent2", opacity: 0.55 });
        } else if (firstSpoken) {
          // appear mode: the first written line leads with its page, its words marked when spoken
          const LT = H.lead(ctx, t);
          m.reveal(L, Math.max(LT.at, t0 + 0.1), { dy: 10 });
          if (LT.at < t - 0.4) m.highlight(tx, t, { color: "accent2", opacity: 0.55 });
        } else m.reveal(L, t, { dy: 10 });
        firstSpoken = false;
      });
      // the lines (and their highlight bars) leave WITH the page: M.exit takes an element's followers at its own exit
      // time. As siblings they left in build order, 0.05 s apart, so the page faded first and the lines floated (~0.5 s).
      page.followers = lines;
      H.ordered(ctx, times, "lines");
      if (p.person) {
        const pe = ctx.el("person", { x: 1200, y: 360, w: 520, h: 520, kind: "character", exit: "sink" });
        const who = H.person(ctx, p.person, { cloth: "accent" });   // the cast's look when the props name a cast member
        kit.peep(pe.inner, who.member, p.person.emotion || "neutral", { x: 260, y: 260, size: 520, flip: true, cloth: who.cloth, skin: who.skin });
        m.settle(pe, ctx.start + 0.15, { dy: 40 });
        // 48 high: a 40 px box was under the label floor of the larger packs (story-cartoon 30 px x 1.36 leading)
        if (who.name) { const nm = ctx.el("person_name", { x: 1260, y: 888, w: 400, h: 48, kind: "text" }); kit.text(nm.inner, who.name, { role: "label", x: 0, y: 0, w: 400, h: 48, maxLines: 1, align: "center", color: "muted" }); m.reveal(nm, ctx.start + 0.4); }
      }
    },
  });

  /* ======================= calendar.plan ======================= */
  Loom.template("calendar.plan", {
    doc: "A schedule the learner will copy into their own calendar. The calendar frame and day columns appear, then each entry DROPS onto its day ON its words and ticks. Use for spaced practice plans, deadlines, onboarding weeks.",
    job: ["practice", "sequence"], register: "productive", motion_is: "staging",
    props: {
      kicker: { type: "str", max_words: 4 }, title: { type: "str", max_words: 8 }, say_title: { type: "anchor" },
      days: { type: "list", min: 3, max: 7, required: true, of: { label: { type: "str", required: true, max_words: 3 } } },
      entries: { type: "list", min: 1, max: 5, required: true, of: { day: { type: "int", required: true }, label: { type: "str", required: true, max_words: 3 }, icon: { type: "icon" }, say: { type: "anchor", required: true } } },
    },
    build(ctx, p) {
      const { kit, m } = ctx; const B = ctx.box;
      const y0 = H.header(ctx, p, { align: "center" });
      const n = p.days.length;
      const top = Math.max(y0 + 10, 250), h = 900 - top, left = B.x + 20, w = B.w - 40;
      const frame = ctx.el("calendar", { x: left, y: top, w, h, kind: "document", exit: "displace" });
      kit.rect(frame.inner, 0, 0, w, h, { fill: "surface", r: 24 });
      kit.rect(frame.inner, 0, 0, w, 76, { fill: "accent3", r: 24, shadow: false, flat: true });
      kit.rect(frame.inner, 0, 48, w, 28, { fill: "accent3", r: 0, shadow: false, flat: true });
      const cw = w / n;
      p.days.forEach((d, i) => {
        kit.text(frame.inner, d.label, { role: "label", x: i * cw, y: 0, w: cw, h: 76, maxLines: 1, align: "center", valign: "middle", weight: 800, color: Loom.style.pickTokenOn("accent3") });
        if (i) kit.line(frame.inner, i * cw, 90, i * cw, h - 20, { stroke: "surface2", sw: 3, crisp: true });
      });
      const tFirst = H.cue(ctx, p.entries[0].say);
      m.settle(frame, Math.max(ctx.start + 0.05, Math.min(tFirst - 0.8, (p.say_title ? H.cue(ctx, p.say_title) : ctx.start) + 0.2, H.structAt(ctx))), { dy: 40 });   // the frame is structure (D-100)
      const times = [];
      p.entries.forEach((e, k) => {
        const x = left + e.day * cw + 14, y = top + 120 + (k % 2) * 40;
        const E = ctx.el("entry_" + (k + 1), { x, y, w: cw - 28, h: 170, kind: "card", exit: "recede" });
        kit.rect(E.inner, 0, 0, cw - 28, 170, { fill: "accent2", r: 16 });
        kit.icon(E.inner, e.icon || "brain", { x: (cw - 28) / 2, y: 52, size: 48, color: Loom.style.pickTokenOn("accent2") });
        kit.text(E.inner, e.label, { role: "label", x: 8, y: 92, w: cw - 44, h: 70, maxLines: 2, align: "center", weight: 800, color: Loom.style.pickTokenOn("accent2") });
        const t = H.cue(ctx, e.say); times.push(t);
        m.drop(E, t);
        const mk = ctx.el("tick_" + (k + 1), { x: x + cw - 70, y: y - 22, w: 60, h: 60, kind: "mark", exit: "recede" });
        kit.mark(mk.inner, "yes", 30, 30, 54);
        m.pop(mk, t + 0.45, { overshoot: false });
      });
      H.ordered(ctx, times, "entries");
    },
  });
})();
