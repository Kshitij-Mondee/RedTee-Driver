// @design cost_changes_form: labelled runs on a held unit grid squeeze to half, the freed cells refill in a hatched form of the same colour, and each label is rewritten in place
/* b11 - going faster does not fix it. In one experiment people sped up and reported more stress: the cost moved.
 *
 * Treatments considered:
 *  (A) the runs shrink and the grid gets its time back (rejected: that is the misconception the beat corrects);
 *  (B) a stress gauge beside the grid that rises as the runs shrink (rejected: a new instrument for one beat, and it
 *      separates the cost from the time it occupies, which is the very link to show);
 *  (C) CHOSEN: before and after in place. Every red run carries a 'time' badge (Loom.slot, frame badge); one
 *      progress squeezes all five runs to half width toward their start; the freed cells refill with red hatch, so
 *      the red on the page does not shrink; each badge is relabelled 'stress' (slot relabel) left to right.
 * Value script: the one break, the most red in the film, kept for this turn.
 * Continuity: badges (exit none, inside morning_grid) and hatch stay on the grid through b14; G.qq.badges and
 * G.qq.hatch record them. Red cells are squeezed through their placement groups (drive key "qq.cell.<i>").
 */
Loom.scene("b11", {
  build(ctx, props) {
    // T.label's lead is drawn by a dash offset with a round cap, which paints a dot at its start before the draw;
    // hide the lead's element until the label's own time (runtime defect logged in RUN_LOG.scenes-B.md)
    const label = (name, o) => { const E = Loom.treat.label(ctx, name, o); if (E.lead && o.t != null) Loom.tween(E.lead.inner, { opacity: 0 }, { opacity: 1, duration: 0.05 }, o.t, { kind: "reveal", beat: ctx.beat.id, name: name + ".lead" }); return E; };
    const B = ctx.beat.id;
    const S = Loom.style, T = Loom.treat;
    const strip = ctx.held("strip"), G = ctx.held("morning_grid"), pile = ctx.held("slips"), note = ctx.held("margin_note");
    void strip; void pile; void note;
    if (!G || !G.qq) { Loom.error("qq_held_state", "b11 needs b08's morning_grid"); return; }
    const P = 98, COLS = 12;
    const RUNS = [[9, 10, 11], [15, 16, 17], [20, 21, 22], [26, 27, 28], [31, 32, 33]];
    const tFix = ctx.cue("Going faster does not fix it");
    const tExp = ctx.cue("In one experiment");
    const tSped = ctx.cue("people sped up");
    const tStress = ctx.cue("reported more stress");
    const tMoved = ctx.cue("The cost moved");

    const runLeft = (r) => (RUNS[r][0] % COLS) * P + 5;            // element coords of a run's left edge
    const runTop = (r) => Math.floor(RUNS[r][0] / COLS) * P + 5;
    const RW = 3 * P - 10, PITCH2 = 47, HALF = 44;                   // a run is 284 wide; squeezed units are 44 on a 47 pitch

    // ---- badges: one 'time' badge pinned across the top edge of each run (inside the grid, so it travels with it)
    // @form state_badge: a small pill pinned across the edge of a run, its word rewritten in place when the state changes
    const BW = 170, BH = 60;
    const badges = RUNS.map((run, r) => {
      const s = Loom.slot(ctx, "badge_" + (r + 1), { x: runLeft(r) + RW / 2 - BW / 2, y: runTop(r) - BH / 2, w: BW, h: BH, frame: "badge", token: "ink",
        role: "label", pad: 10, parent: G.inner, exit: "none" });
      s.show({ text: props.from_label || "time", role: "label" }, tFix + 0.1 + r * 0.08, { how: "stamp" });
      return s;
    });

    // ---- the squeeze: one progress drives all fifteen red units toward their run's start, each to half width
    const reds = [];
    RUNS.forEach((run, r) => run.forEach((i, k) => {
      const c = G.qq.cells[i];
      if (!c) { Loom.error("qq_cell_missing", `b11: no red cell ${i}`); return; }
      const cy = Math.floor(i / COLS) * P + P / 2, cx0 = (i % COLS + 0.5) * P, cx1 = runLeft(r) + k * PITCH2 + HALF / 2;
      reds.push({ c, i, cy, cx0, cx1 });
    }));
    reds.forEach(({ c, i, cy, cx0, cx1 }) => {
      Loom.drive((e) => c.place.setAttribute("transform", `translate(${(cx0 + (cx1 - cx0) * e).toFixed(2)} ${cy}) scale(${(1 - 0.5 * e).toFixed(4)} 1)`),
        tSped, 1.0, "editorial", { kind: "transform", beat: B, name: `morning_grid.squeeze.${i}`, content: true, key: "qq.cell." + i });
      c.squeezed = true;
    });

    // ---- the freed cells refill with red hatch: the same colour, a different form (unmask left to right, per run)
    // @form hatch_fill: freed space refilled with a hatched version of the same colour, so the total stays while its form changes
    const defs = Loom.svg("defs", {}, G.qq.layer);
    const pid = Loom.uid("qqhatch");
    const pat = Loom.svg("pattern", { id: pid, patternUnits: "userSpaceOnUse", width: 14, height: 14, patternTransform: "rotate(45)" }, defs);
    Loom.svg("rect", { x: 0, y: 0, width: 6, height: 14, fill: S.c("accent") }, pat);
    const hatch = RUNS.map((run, r) => {
      const x0 = runLeft(r) + 3 * PITCH2 - 3 + 5, y0 = runTop(r), w = RW - (x0 - runLeft(r));
      const cid = Loom.uid("qqhc");
      const cr = Loom.svg("rect", { x: x0 - 2, y: y0 - 2, width: 0, height: 2 * HALF + 4 }, Loom.svg("clipPath", { id: cid, clipPathUnits: "userSpaceOnUse" }, defs));
      const g = Loom.svg("g", { "clip-path": `url(#${cid})`, "data-qq-hatch": r }, G.qq.layer);
      for (let k = 0; k < 3; k++) {
        const hx = x0 + k * PITCH2;
        Loom.svg("rect", { x: hx, y: y0, width: HALF, height: 2 * HALF, rx: 4, fill: S.c("field") }, g);
        Loom.svg("rect", { x: hx, y: y0, width: HALF, height: 2 * HALF, rx: 4, fill: `url(#${pid})`, stroke: S.c("accent"), "stroke-width": 3 }, g);
      }
      Loom.tween(cr, { attr: { width: 0 } }, { attr: { width: w + 4 }, duration: 0.7, ease: Loom.ease.move }, tStress + 0.05 + r * 0.12,
        { kind: "unmask", beat: B, name: `morning_grid.hatch.${r}`, content: true });
      return { g, x0, y0, w };
    });
    // the badges were drawn before the hatch: keep them on top of the cells
    badges.forEach((s) => s.E.outer.parentNode.appendChild(s.E.outer));

    // ---- the source: one lab finding, said as one
    label("source_tag", { x: 330, y: 820, text: props.source_tag || "One experiment", tone: "ink", role: "label", t: tExp + 0.1 });

    // ---- the cost moved: each badge is rewritten 'time' -> 'stress', left to right
    badges.forEach((s, r) => s.relabel(props.to_label || "stress", tMoved + r * 0.1));

    G.qq.badges = badges;
    G.qq.hatch = hatch;
    G.qq.runs = RUNS;
  },
});
