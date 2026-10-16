// @design outlined_slot_transfer: one occupied position becomes empty while the same token occupies a later position
/* Treatments considered:
 * A. Static paired positions with signalling. Rejected: it does not show identity surviving the change.
 * B. Shallow dimensional paper planes. Valid alternative, retained in the storyboard, not selected.
 * C. Selected: held outlined scaffold with a single stepped transfer. Movement is the argument.
 * No camera move: this beat holds a layout in the same place.
 * Dependencies: predecessor owns all held geometry. Do not reconstruct or reposition it.
 * The supplied API does not expose Treatments signatures or component search.
 * Documented kit drawing is the flagged fallback for these incoming small forms.
 */
Loom.scene("b02", {
  build(ctx, props) {
    const {kit, m} = ctx;
    // FORK REPAIR (post-fix proof, 2026-10-07): b01 is the presenter and drew none of these, so ctx.held returned null
    // and the scene threw (render --force refuses a thrown scene, D-124). As the scene card says: when a held element
    // is not there, draw the thing from THIS beat, with no new words. Plain shapes stand in for the page, its gap and
    // the review strip; nothing else in the scene changed.
    const stand = (name, x, y, w, h, kind, draw) => {
      const E = ctx.el(name, {x, y, w, h, kind, exit: "recede"});
      draw(E);
      m.reveal(E, ctx.at(0.02));
      return E;
    };
    const desk = ctx.held("desk_world");
    const draft = ctx.held("draft");
    const page = ctx.held("page") || stand("page", 240, 150, 620, 470, "card", (E) => {
      kit.card(E.inner, 0, 0, E.w, E.h, {fill: "surface", stroke: "line", r: 14});
      [0, 1, 2, 3].forEach((i) => kit.rect(E.inner, 48, 60 + i * 92, i === 2 ? 0 : E.w - 96, 14, {fill: "line", r: 7}));
    });
    const gap = ctx.held("file_gap") || stand("file_gap", 288, 150 + 60 + 2 * 92 - 8, 524, 30, "mark", (E) => {
      kit.rect(E.inner, 0, 0, E.w, E.h, {fill: "surface2", stroke: "muted", r: 8});
    });
    const strip = ctx.held("review_strip") || stand("review_strip", 240, 700, 1440, 150, "card", (E) => {
      kit.card(E.inner, 0, 0, E.w, E.h, {fill: "surface2", stroke: "line", r: 14});
    });
    // Retiring presenter is not held: its existing exit is owned by the join engine.
    // Literal anchors map directly to the four storyboard rows.
    const tAssumption = ctx.cue("Imagine that information was available to your colleague");
    const tBooked = ctx.cue("you booked a review without it");
    const tGap = ctx.cue("then discovered the gap");
    const tMove = ctx.cue("and moved the review");
    const moveDur = ctx.style.dur("move");

    // @form imagined_information_note: qualified assumption attached beside the held page
    const assumptionWords = "information available, imagined";
    const aw = 520;
    const af = kit.fit(assumptionWords, {role:"label", w:aw - 32, maxLines:2});
    const ai = Math.max(16, 0.2 * af.size);
    const ah = af.height + 2 * ai;
    const ax = Math.min(ctx.box.x + ctx.box.w - aw, page.x + page.w + 48);
    const ay = Math.max(ctx.box.y, Math.min(page.y + 32, strip.y - ah - 48));
    const assumption = ctx.el("information_assumption", {x:ax, y:ay, w:aw, h:ah, kind:"text", exit:"wipe"});
    kit.card(assumption.inner, 3, 3, aw - 6, ah - 6, {fill:"surface", stroke:"ink", r:10});
    kit.text(assumption.inner, assumptionWords, {role:"label", x:ai, y:ai, w:aw - 2 * ai, h:af.height, maxLines:2, size:af.size, color:"ink"});
    m.reveal(assumption, tAssumption);

    // @form assumption_underline: calm qualification signal under the attached note
    const assumptionLine = ctx.el("information_assumption_underline", {x:ax + ai, y:ay + ah + 8, w:aw - 2 * ai, h:8, kind:"mark", exit:"wipe"});
    const aStroke = kit.line(assumptionLine.inner, 3, 4, assumptionLine.w - 3, 4, {stroke:"muted", sw:3});
    m.draw(aStroke, tAssumption, {dur:ctx.style.dur("draw")});

    // Widths are compositional, not measurements of time. Both occupancy footprints are equal.
    const tw = Math.min(240, (strip.w - 96) / 2);
    const tf = kit.fit("review", {role:"label", w:tw - 32, maxLines:1});
    const ti = Math.max(16, 0.2 * tf.size);
    const th = tf.height + 2 * ti;
    const originalX = strip.x + 32;
    const laterX = strip.x + strip.w - 32 - tw;
    const tileY = strip.y + (strip.h - th) / 2;

    // @form original_slot_trace: the original occupancy outline remains after the transfer
    const trace = ctx.el("original_slot_trace", {x:originalX, y:tileY, w:tw, h:th, kind:"mark", exit:"recede"});
    kit.rect(trace.inner, 3, 3, tw - 6, th - 6, {fill:"surface2", stroke:"muted", r:10});
    m.reveal(trace, tBooked);

    // @form review_token: one outlined scheduling token retains its identity throughout
    const tile = ctx.el("review_tile", {x:originalX, y:tileY, w:tw, h:th, kind:"token", exit:"recede"});
    kit.card(tile.inner, 3, 3, tw - 6, th - 6, {fill:"accent", stroke:"ink", r:10});
    kit.text(tile.inner, "review", {role:"label", x:ti, y:ti, w:tw - 2 * ti, h:tf.height, maxLines:1, size:tf.size, align:"center", color:"surface"});
    m.settle(tile, tBooked, {dur:ctx.style.dur("enter"), dy:8, overshoot:false});

    // @form empty_file_underline: attention moves to the existing omission without moving the object
    const gapLine = ctx.el("file_gap_underline", {x:gap.x, y:gap.y + gap.h + 8, w:gap.w, h:8, kind:"mark", exit:"wipe"});
    const gStroke = kit.line(gapLine.inner, 3, 4, gap.w - 3, 4, {stroke:"ink", sw:4});
    m.draw(gStroke, tGap, {dur:ctx.style.dur("draw")});

    // Native stepped-time primitive. Travel is absolute, on the same token, in the held strip.
    Loom.stepped.on(tile, {hz:6});
    m.travel(tile, tMove, {x:laterX, y:tileY, scale:1, dur:moveDur});
    m.emphasis(tile, tMove + moveDur);

    // Stress test: no text lies in the horizontal transfer corridor. No reflow on reveal.
    // The original note reads throughout the move; the tile remains readable through the final phrase.
    // Continuity retains the scaffold, empty original trace and single moved tile. No second move.
    void desk; void draft; void props;
  }
});
