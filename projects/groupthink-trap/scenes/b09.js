// @design hanging_doubts_gap: held objects hang above a group on strings while drop lines fall towards the shared surface and stop short of it
/* b09 - nobody was foolish, every doubt was right, none reached the table.
 * Treatments considered:
 *  (A) a verdict card "every doubt was right" over a dark frame (rejected: tells; the refutation must be SEEN in the
 *      room, with the people calm, so "foolish" is answered by the picture, not by a sentence);
 *  (B) the four objects drop onto the table and bounce off (rejected: shows an event that never happened; the point is
 *      that they never landed, so nothing may touch the table);
 *  (C) CHOSEN, a held picture with one change: the doubts (carried back from b08 by the motif, still marked red) hang
 *      on strings above their owners, the five sit calm under the dark veil; a strip clips on; four dashed drop lines
 *      draw down and stop short of the tabletop, one per step. The drawn gap is the lesson.
 * Rules taken from the references (TED-Ed s7, colour_and_tone): a still camera on a moving drawing; people small and
 * posed, emotion in posture (calm, arms down); hold the layout, change its state; joins from the material in the
 * frame (the travel is carried by the doubts themselves); the dark band continues from b08 as a veil on the room;
 * the accent sits only on the four drop lines (and the failure marks the objects carry from b08).
 * Continuity: redraws the set bible (station 'room') at frame 0 with no entrance; the group is switched on just
 * before the travel so it never shows under the other room beats. Adopts the motif 'doubts' and travels it to
 * (695, 30) at scale 0.5, which lands the objects on (830, 1060, 1290, 1520; 290). Everything leaves at the dip.
 */
Loom.scene("b09", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const svg = (tag, a, p) => Loom.svg(tag, a, p);

    // ------------------------------------------------------------------ the room (set bible), drawn at frame 0
    // Loom.gt.room (b01.js): the room exactly as b01 draws it (C2 pass: this beat's own copy had swapped two
    // colleagues' hair, a legless table, another clock and cloud, and no goal on the board)
    const room = (o) => Loom.gt.room(ctx, { t0: o.t0, t1: o.t1, sheet: "plain", sheetX: o.sheetX });

    // ------------------------------------------------------------------ times
    const tAppear = ctx.start - 0.6;            // the camera is still on b08's station: the room appears unseen
    const tJoin = ctx.start - 0.5;              // the travel join window (compose: max(prev speech end + 0.02, start - 0.525))
    const tRight = ctx.cue("Every doubt was right");
    const tNone = ctx.cue("None of them reached the table");
    const tDip = Math.max(ctx.speechEnd + (ctx.beat.pause_after || 0) + 0.02, ctx.end - 0.5) + 0.5;   // middle of the dip to black
    Loom.set(ctx.g, { opacity: 0 }, 0);
    Loom.set(ctx.g, { opacity: 1 }, tAppear);

    const R = room({ t0: tAppear, t1: ctx.end + 0.4, sheetX: 1065 });
    // the first meeting's decision is still on the table: the Agreed stamp on the drifted plan (b07's end state)
    // @form verdict_stamp: a short label stamped as a pill or tilted note, coloured to carry its valence
    // the same stamp treatment as b02 and b07 (C2: the hand-drawn copy left 6.0 px where the inset check needs 7.6)
    Loom.treat.label(ctx, "stamp", { x: 125, y: 62, text: "Agreed", as: "stamp", tone: "accent2", rot: -8, role: "label", parent: R.sheet.inner });
    // the first meeting's goal is still on the board (b07's end state)
    // @form board_goal_lines: two hand-lettered lines written onto a held board, the second after the first
    const goal = ctx.el("board_goal", { x: 330, y: 180, w: 360, h: 210, kind: "text" });
    kit.text(goal.inner, "Launch:", { role: "lead", x: 28, y: 8, w: 300, h: 56, align: "left", valign: "middle", maxLines: 1, color: "accent2" });
    kit.text(goal.inner, "end of quarter", { role: "lead", x: 28, y: 64, w: 310, h: 56, align: "left", valign: "middle", maxLines: 1, color: "accent2" });
    svg("path", { d: "M30 124 q120 6 250 -2", fill: "none", stroke: S.c("accent2"), "stroke-width": 4, "stroke-linecap": "round" }, goal.inner);
    Object.values(R.people).forEach((p) => { p.pose("idle", ctx.start); p.emotion("neutral", ctx.start); p.look(0, 0.5, ctx.start); });

    // the dark band continues: a night veil over the room (people, table and wall alike)
    // @form night_veil: a translucent dark layer that carries a dark break into a held set
    const veil = ctx.el("night_veil", { x: -40, y: -40, w: 2000, h: 1160, kind: "scenery" });
    svg("rect", { x: 0, y: 0, width: 2000, height: 1160, fill: S.c("ink"), opacity: 0.56 }, veil.inner);

    // ------------------------------------------------------------------ the doubts come back (travel join)
    const doubts = ctx.adopt("doubts");
    const HANG = [830, 1060, 1290, 1520], TOPS = [216, 210, 236, 250];
    if (doubts) ctx.travelTo(doubts, { x: 695, y: 30, scale: 0.5 }, tJoin, 1.05);

    // the strings: drawn down from the top of the frame as the objects arrive, then they sway with them
    // @form hanging_string: a thin string from the top of the frame that an object hangs on
    const strings = ctx.el("strings", { x: 0, y: -20, w: 1920, h: 300, kind: "scenery" });
    const sl = HANG.map((x, i) => svg("path", { d: `M${x} 0 V${TOPS[i] + 20}`, fill: "none", stroke: S.c("field2"), "stroke-width": 3 }, strings.inner));
    Loom.stepped.wrap(() => sl.forEach((p, i) => m.draw(p, tJoin + 0.75 + i * 0.06, { dur: 0.3 })), { hz: 6 });
    const swayT0 = ctx.start + 0.7, swayT1 = swayT0 + 8;   // two whole periods of 4 s: period-locked
    if (doubts) m.drift(doubts, swayT0, swayT1, { amp: 3, period: 4 });
    m.drift(strings, swayT0, swayT1, { amp: 3, period: 4 });
    // the objects keep their hand-drawn boil while they hang
    if (doubts) Array.from(doubts.inner.querySelectorAll("[data-part]")).forEach((g, i) => Loom.stepped.boil(g, ctx.start + 0.6, ctx.end, { hz: 8, amp: 1.0, seed: "b09:boil" + i }));

    // ------------------------------------------------------------------ "Every doubt was right": a strip clips onto the middle strings
    // @form clipped_strip: a paper strip clipped across hanging strings, its words written on
    const SW = 470, SH = 78, SX = 1175 - SW / 2, SY = 112;
    const strip = ctx.el("strip_right", { x: SX, y: SY - 14, w: SW, h: SH + 14, kind: "label" });
    kit.rect(strip.inner, 0, 14, SW, SH, { fill: "surface", r: 6, shadow: false, stroke: "ink", sw: 4 });
    [1060, 1290].forEach((x) => kit.rect(strip.inner, x - SX - 14, 0, 28, 30, { fill: "muted", r: 4, shadow: false, stroke: "ink", sw: 3 }));
    const words = ctx.el("strip_words", { x: SX + 20, y: SY + 6, w: SW - 40, h: SH - 12, kind: "text" });
    kit.text(words.inner, "every doubt was right", { role: "lead", x: 0, y: 0, w: SW - 40, h: SH - 12, align: "center", valign: "middle", maxLines: 1, color: "ink" });
    m.drop(strip, tRight);
    m.unmask(words, tRight + 0.3, { dur: 0.7 });
    m.drift(strip, tRight + 0.6, tRight + 0.6 + 8, { amp: 3, period: 4, phase: 2 * Math.PI * ((tRight + 0.6 - swayT0) / 4) });
    m.drift(words, tRight + 0.6, tRight + 0.6 + 8, { amp: 3, period: 4, phase: 2 * Math.PI * ((tRight + 0.6 - swayT0) / 4) });

    // ------------------------------------------------------------------ "None of them reached the table": four drop lines stop short
    // Each line leaves its object's lower edge, steps clear of its owner's head, and drops to y 590: the tabletop
    // starts at 640, so a 50 px gap stays open. One per step (on fours), drawn top down.
    // @form drop_line_short: a dashed line falling from an item towards a surface and stopping short of it
    const BOT = [366, 372, 352, 350];
    HANG.forEach((x, i) => {
      const X = x + 75;
      const E = ctx.el("drop_" + ["date", "test", "support", "client"][i], { x: x - 6, y: BOT[i] - 6, w: 90, h: 600 - BOT[i] + 12, kind: "connector" });
      const g = E.inner, ox = x - 6, oy = BOT[i] - 6;
      svg("path", { d: `M${x - ox} ${BOT[i] - oy} L${X - ox} ${BOT[i] + 38 - oy} V${590 - oy}`, fill: "none", stroke: S.c("accent"), "stroke-width": 6, "stroke-dasharray": "14 11", "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
      svg("path", { d: `M${X - ox - 14} ${590 - oy} H${X - ox + 14}`, fill: "none", stroke: S.c("accent"), "stroke-width": 6, "stroke-linecap": "round" }, g);
      Loom.stepped.on(E, { hz: 6 });
      m.unmask(E, tNone + i * 0.28, { dir: "ttb", dur: 0.5 });
    });

    // ------------------------------------------------------------------ everything leaves at the dip to black
    // A motif is not switched off by the engine (it may travel on), so it is put away under the closed cover.
    if (doubts) Loom.set(doubts.outer, { opacity: 0 }, tDip);
    void R; void veil;
  },
});
