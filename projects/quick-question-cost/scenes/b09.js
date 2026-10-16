// @design unit_grid_ledger_continued: the held morning grid takes questions two to five, faster each time
/* b09 - questions two to five stamp into the held morning, faster and faster. The tags from b08 have gone (the
 * narrator stops naming the parts; the stamps carry it: a faded worked example). Each question: its slip lands on
 * the pile (counter to 5), the plan gets only one or two green cells, then one ink unit and a red run of three.
 *
 * Treatments considered:
 *  (A) all four questions as one group stamp on "Again" (rejected: no rhythm, and the acceleration IS the meaning);
 *  (B) a speed-up of the strip marker only, cells unchanged (rejected: the cost would stop being countable);
 *  (C) CHOSEN: the storyboard's accelerating stamp cadence on the held grid, 0.4 s, then 0.25 s, then 0.1 to 0.15 s
 *      between units, so the red visibly outgrows the ink while the green barely advances.
 * Holds everything b08 recorded: morning_grid.qq (cell layer, cells), strip.qq (marker), slips.qq (pile step).
 * The last red run lands about 0.9 s after the 85 % point of the speech: the accelerating close is the content and
 * b10 continues on the same picture, so nothing new is introduced late.
 */
Loom.scene("b09", {
  build(ctx) {
    const B = ctx.beat.id;
    const S = Loom.style;
    const strip = ctx.held("strip"), G = ctx.held("morning_grid"), pile = ctx.held("slips"), note = ctx.held("margin_note");
    void note;
    if (!G || !G.qq || !strip || !strip.qq || !pile || !pile.qq) { Loom.error("qq_held_state", "b09 needs b08's morning_grid, strip and slips"); return; }
    const P = 98, H = 44, COLS = 12, N = 72;
    const ctr = (i) => [(i % COLS + 0.5) * P, (Math.floor(i / COLS) + 0.5) * P];
    const TOK = { work: "accent4", ink: "ink", red: "accent" };
    const stampCell = (i, kind, t, sd) => {
      const [cx, cy] = ctr(i);
      const place = Loom.svg("g", { transform: `translate(${cx} ${cy})`, "data-qq-i": i, "data-qq-kind": kind }, G.qq.layer);
      const g = Loom.svg("g", {}, place);
      Loom.svg("rect", { x: -H, y: -H, width: 2 * H, height: 2 * H, rx: 6, fill: S.c(TOK[kind]) }, g);
      Loom.tween(g, { opacity: 0, scale: 1.35, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: sd, ease: Loom.ease.enter }, t,
        { kind: "stamp", beat: B, name: `morning_grid.${kind}.${i}`, content: true });
      G.qq.cells[i] = { place, kind };
    };
    const markTo = (c, t, dur) => {
      const c0 = strip.qq.c, mk = strip.qq.marker, LW = strip.qq.LW, LY = strip.qq.LY;
      Loom.drive((e) => mk.setAttribute("transform", `translate(${((LW * (c0 + (c - c0) * e)) / N).toFixed(2)} ${LY})`), t, dur, "move",
        { kind: "value_travel", beat: B, name: "strip.marker", content: true, key: "qq.marker" });
      strip.qq.c = c;
    };
    // one question: slip lands, green work cells, then the ink unit, then the red run, at a cadence
    const question = (q, t0, tInk, tRed, cad, sd, pileDur) => {
      pile.qq.step(t0, pileDur, B);
      q.work.forEach((i, k) => stampCell(i, "work", t0 + k * Math.min(0.12, cad), sd));
      stampCell(q.ink, "ink", tInk, sd);
      q.red.forEach((i, k) => stampCell(i, "red", tRed + k * cad, sd));
      Loom.sfx("tick", tInk + 0.1);
      Loom.sfx("tick", tRed + 2 * cad + 0.1);
      markTo(q.red[2] + 1, t0, tRed + 2 * cad + sd - t0);
    };

    const tVis = ctx.cue("Visible, one unit");
    const tUnit = ctx.cue("one unit");
    const tHid = ctx.cue("Hidden, a run");
    const tAgain = ctx.cue("Again");
    const tAnd = ctx.cue("And again");

    // question 2: named slowly, at b08's cadence (0.4 s)
    question({ work: [12, 13], ink: 14, red: [15, 16, 17] }, tVis, tUnit, tHid + 0.05, 0.4, 0.42, 0.6);
    // question 3: quicker (0.25 s)
    question({ work: [18], ink: 19, red: [20, 21, 22] }, tAgain, tAgain + 0.18, tAgain + 0.36, 0.25, 0.34, 0.45);
    // questions 4 and 5: quickest, back to back
    question({ work: [23, 24], ink: 25, red: [26, 27, 28] }, tAnd, tAnd + 0.14, tAnd + 0.24, 0.1, 0.28, 0.36);
    question({ work: [29], ink: 30, red: [31, 32, 33] }, tAnd + 0.44, tAnd + 0.52, tAnd + 0.62, 0.1, 0.28, 0.36);
  },
});
