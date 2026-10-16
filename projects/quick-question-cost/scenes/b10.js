// @design lens_on_held_detail: a lens on a leader line opens over a detail of the held picture, lettered with what the detail shows and tagged with its source
/* b10 - field studies found work fragmented, much like this. The fragmentation is already in the grid (b09 left
 * the plan's green work in one- and two-cell pieces between the runs); a magnifier makes it legible without
 * cutting away: annotate in place.
 *
 * Treatments considered:
 *  (A) cut to a chart of field-study data (rejected: the knowledge sheet carries no figure to chart, and a cut
 *      throws away the picture the claim is about);
 *  (B) recolour every green fragment at once (rejected: the green is already the plan's colour; a recolour would
 *      change what green means one beat later);
 *  (C) CHOSEN: Loom.magnify on row two (a red run, a single green cell, an ink unit), the lens over the empty
 *      lower rows of the morning, 'fragmented' lettered at its rim, a 'Field studies' tag at the leader's root.
 * The lens is a live copy of morning_grid, so it shows exactly the held cells. Lens and tags leave before b11.
 */
Loom.scene("b10", {
  build(ctx, props) {
    // T.label's lead is drawn by a dash offset with a round cap, which paints a dot at its start before the draw;
    // hide the lead's element until the label's own time (runtime defect logged in RUN_LOG.scenes-B.md)
    const label = (name, o) => { const E = Loom.treat.label(ctx, name, o); if (E.lead && o.t != null) Loom.tween(E.lead.inner, { opacity: 0 }, { opacity: 1, duration: 0.05 }, o.t, { kind: "reveal", beat: ctx.beat.id, name: name + ".lead" }); return E; };
    const strip = ctx.held("strip"), G = ctx.held("morning_grid"), pile = ctx.held("slips"), note = ctx.held("margin_note");
    void strip; void pile; void note;
    if (!G) return;
    const tField = ctx.cue("Field studies of office workers");
    const tFrag = ctx.cue("found work fragmented");

    // row two, columns 5 to 7: red run | one green cell | ink unit (station coordinates of the held grid)
    const focus = { x: 832, y: 322, r: 140 };
    const at = { x: 1130, y: 680, r: 215 };

    // the source first: its tag settles at the leader's root, then the ring, leader and lens draw into each other
    label("source_tag", { x: 600, y: 520, text: props.source_tag || "Field studies", to: [focus.x - 99, focus.y + 99], tone: "ink", role: "label", t: tField });
    const mg = Loom.magnify(ctx, "lens", { source: G, focus, at, t: tField + 0.6, ring: "accent" });
    // 'fragmented' lettered at the lens rim, lower right
    label("lens_label", { x: 1440, y: 846, text: props.lens_label || "fragmented", to: [at.x + at.r * 0.76, at.y + at.r * 0.62], tone: "accent", role: "label", t: tFrag + 0.1 });
    // hold through "much like this"; the lens closes as the line ends (magnify elements do not retire by themselves)
    mg.exit(ctx.speechEnd - 0.05);
  },
});
