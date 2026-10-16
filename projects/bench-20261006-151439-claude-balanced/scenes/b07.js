// @design guessing_with_no_pick: question marks hover over different moments of a timeline and never land
/* Treatments: (A) static Dev + one big ? (rejected: no sense of none chosen), (B) text list of options (rejected: lesson nouns, no motion),
 * (C) CHOSEN: marks drift between timeline ticks and never settle; motion is the guessing. */
Loom.scene("b07", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;

    // Dev: held from the previous beat on this station if present, else a posed rig
    let dev = null;
    try { dev = ctx.held("dev"); } catch (e) { dev = null; }
    if (!dev) {
      dev = ctx.character("dev", "pip", { x: 560, y: 700, scale: 1.5, pose: "think" });
    }

    // timeline strip beneath Dev
    const TX = 300, TY = 800, TW = 1320, TH = 90;
    const tl = ctx.el("meeting_timeline", { x: TX, y: TY, w: TW, h: TH, kind: "scenery", exit: "wipe" });
    // @form timeline_strip: a line with ticks for moments of a meeting
    const line = kit.rect(tl.inner, 0, 40, TW, 10, { fill: "ink", r: 5 });
    const ticks = [];
    for (let i = 0; i < 7; i++) {
      const tx = 40 + i * ((TW - 80) / 6);
      kit.rect(tl.inner, tx - 5, 14, 10, 62, { fill: "ink", r: 4 });
      ticks.push(TX + tx);
    }
    m.unmask(tl, ctx.cue("Be more professional"), { dur: 1.0 });

    // marks: drawn as hand-lettered question marks, accent colour
    function mark(name, label, x, y, w, size) {
      const f = kit.fit(label, { role: "label", w, maxLines: 1 });
      const h = f.height + 24;
      const E = ctx.el(name, { x, y, w, h, kind: "bubble", exit: "recede" });
      kit.text(E.inner, label, { role: "label", x: 0, y: 12, w, h: f.height, maxLines: 1, align: "center", color: "accent", size });
      return E;
    }

    // How? pops by Dev
    const how = mark("how_mark", "How?", 760, 380, 220, 38);
    m.pop(how, ctx.cue("how"), { overshoot: true });

    // Which moment? drifts between ticks, never settles
    const wm = mark("which_moment_mark", "Which moment?", ticks[1] - 150, 690, 300, 38);
    const tw = ctx.cue("in which moment");
    m.pop(wm, tw, { overshoot: true });
    const pts = [ticks[1], ticks[4], ticks[2], ticks[5], ticks[3]];
    Loom.drive((e) => {
      const k = e * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(k)), f = k - i;
      const s = f * f * (3 - 2 * f);
      const x = pts[i] + (pts[i + 1] - pts[i]) * s - pts[0];
      wm.life.setAttribute("transform", `translate(${x.toFixed(1)} ${(-8 * Math.sin(e * 12)).toFixed(1)})`);
    }, tw + 0.3, Math.max(1.5, ctx.speechEnd - tw - 0.4), "editorial", { kind: "drift", beat: ctx.beat.id, content: true });

    // question marks multiply and circle, none chosen
    const tg = ctx.cue("Dev is left to guess");
    const rng = Loom.rng("b07");
    for (let i = 0; i < 5; i++) {
      const q = mark("question_mark_" + (i + 1), "?", 700 + i * 150 + Math.floor(rng() * 40), 330 + (i % 2) * 120, 90, 38);
      m.pop(q, tg + i * 0.12, { overshoot: true });
      const ph = i * 1.3;
      Loom.drive((e) => {
        const a = e * 6.28 * 0.6 + ph;
        q.life.setAttribute("transform", `translate(${(Math.cos(a) * 40).toFixed(1)} ${(Math.sin(a) * 30).toFixed(1)})`);
      }, tg + i * 0.12 + 0.3, 4, "editorial", { kind: "float", beat: ctx.beat.id, content: true });
    }
  },
});
