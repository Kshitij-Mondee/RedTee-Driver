// @design write_first_read_together: in the held room, the old habit is greyed and struck, one person going first alone is shown and withdrawn, then everyone writes at once and all turn their cards together
/* b19 - the next meeting: speaking last is gone, asking again asks someone to go first, so everyone writes why it
 * could fail and they read them out together.
 * Treatments considered:
 *  (A) a three-row list "speak last: gone / ask again: no / write first: yes" (rejected: a tip list; the claim is about
 *      TIMING in a live room and needs the people);
 *  (B) a split screen, one lone raised hand vs five cards (rejected: two pictures compete; the room is the device and
 *      it should change state in place);
 *  (C) CHOSEN: the held room in station 'meet'. Dana at the board, her view as ink scribbles (the next plan is not
 *      named, so no words); the old habit greys out and its teal tag is struck; one colleague's arm half rises alone
 *      under a narrowing light with a tag 'go first?' and comes back down (going first alone is the cost); Dana writes
 *      the prompt on the board, five cards slide out together and are written at once; on 'read them out' all five
 *      turn up at the same moment, the four colleagues' cards each carrying a small red mark (the doubts arrive
 *      together and nobody goes first).
 * Rules taken from the references (TED-Ed s7, style guide): recurring home station; state steps in place; a radial
 * wedge spotlight for the one person; people small and posed, emotion in posture; hand-made time on fours for the
 * arm and the cards; the board is a slot whose content changes on the spoken word.
 * Continuity: redraws the set bible in 'meet' (same coordinates as 'room'), shown from the cut only. b20 pulls out of
 * this frame: the end state (Dana standing at the board, five cards up, four red marks, a clear board) is what b20's
 * miniature copies, so the board's words leave before the pull-out and the cards are props (they ride the camera).
 */
Loom.scene("b19", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const svg = (tag, a, p) => Loom.svg(tag, a, p);

    // ------------------------------------------------------------------ the room (set bible), drawn at frame 0
    // Loom.gt.room (b01.js) draws the room exactly as b01 does, so the next meeting is the same room and the same people
    // (C2 pass: this beat's own copy had swapped two colleagues' hair, a legless table and another clock and cloud)
    const room = (o) => Loom.gt.room(ctx, { pre: o.pre, parent: o.parent, t0: o.t0, t1: o.t1, standing: o.danaStanding ? ["dana"] : [], sheet: o.noSheet ? null : "plain" });
    // ------------------------------------------------------------------ the five cards (shared drawing with b20's miniature)
    const cardUp = (g, cx, cy, marked) => Loom.gt.cardUp(ctx, g, cx, cy, marked);
    const SEATS = [["dana", 560, false], ["p_date", 790, true], ["p_test", 1020, true], ["p_support", 1250, true], ["p_client", 1480, true]];

    // ------------------------------------------------------------------ times
    const tSpeak = ctx.cue("Speaking last is gone");
    const tGone = ctx.cue("gone");
    const tSpoke = ctx.cue("She spoke");
    const tAsk = ctx.cue("Asking again asks someone to go first");
    const tGo = ctx.cue("go first");
    const tInstead = ctx.cue("Instead");
    const tEvery = ctx.cue("everyone writes why it could fail");
    const tWrites = ctx.cue("writes why it could fail");
    const tRead = ctx.cue("Then they read them out");
    Loom.set(ctx.g, { opacity: 0 }, 0);
    Loom.set(ctx.g, { opacity: 1 }, ctx.start);   // a cut: shown from the cut only (the station holds other room beats)

    const R = room({ t0: ctx.start - 0.6, t1: ctx.end + 2.6, danaStanding: true, noSheet: true });   // the next plan is not named: no sheet
    const P = R.people;
    Object.values(P).forEach((p) => { p.pose("idle", ctx.start); p.emotion("neutral", ctx.start); });
    P.dana.look(-0.6, -0.4, ctx.start);   // she faces her board
    ["p_date", "p_test", "p_support", "p_client"].forEach((n) => P[n].look(-0.5, -0.2, ctx.start));

    // ------------------------------------------------------------------ the board: her view, as scribbles (no words: the plan is not named)
    const board = Loom.slot(ctx, "board_slot", { x: 330, y: 180, w: 360, h: 210, frame: "none", token: "ink", t: ctx.start - 0.6 });
    // @form scribble_view: ink scribble lines standing for an opinion whose words are not the point
    const view = (g) => {
      [[18, 30, 300], [18, 70, 250], [18, 110, 280]].forEach(([x, y, w], i) => {
        let d = `M${x} ${y}`; for (let k = 0; k < w; k += 24) d += ` q6 ${i % 2 ? -10 : -12} 12 0 t12 0`;
        svg("path", { d, fill: "none", stroke: S.c("ink"), "stroke-width": 5, "stroke-linecap": "round" }, g);
      });
    };
    view.slotLabel = "her view";
    board.show(view, ctx.start - 0.6);

    // "Speaking last is gone": the habit's teal tag beside the board, struck through on "gone"
    // (Loom.gt.tag, a measured tag: T.label's tag left 8 px where the inset check needs 9.2 px, C2 pass)
    const tag = Loom.gt.tag(ctx, "tag_speak_last", { x: 880, y: 262, text: "speak last", fill: "accent3", role: "lead", to: [722, 250], t: tSpeak });
    const strike = ctx.el("tag_speak_last_strike", { x: tag.x + 10, y: tag.y + 4, w: tag.w - 14, h: tag.h - 8, kind: "label" });
    const sp = svg("path", { d: `M6 ${tag.h - 16} L${tag.w - 20} 6`, fill: "none", stroke: S.c("ink"), "stroke-width": 7, "stroke-linecap": "round" }, strike.inner);
    // @form strike_out_stroke: one hand-drawn stroke struck across an item to cancel it
    Loom.set(strike.inner, { opacity: 0 }, 0); Loom.set(strike.inner, { opacity: 1 }, tGone);
    Loom.stepped.wrap(() => m.draw(sp, tGone, { dur: 0.35 }), { hz: 6 });
    m.exit(tag, tInstead - 0.1, "recede"); m.exit(strike, tInstead - 0.1, "recede");
    // "She spoke": her view greys out, the board stays where it is
    board.recolour("muted", tSpoke);

    // ------------------------------------------------------------------ "Asking again asks someone to go first": one arm, alone, under a narrowing light
    // @form wedge_spotlight: the room dims except a wedge of light falling on one person
    const LX = 1020;
    const spot = ctx.el("spot_go_first", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" });
    const dim = svg("path", { d: `M-40 -40 H1960 V1120 H-40 Z M${LX - 46} -40 L${LX + 46} -40 L${LX + 170} 846 L${LX - 170} 846 Z`, "fill-rule": "evenodd", fill: S.c("ink"), opacity: 0 }, spot.inner);
    const glow = svg("path", { d: `M${LX - 46} -40 L${LX + 46} -40 L${LX + 170} 846 L${LX - 170} 846 Z`, fill: S.c("surface"), opacity: 0 }, spot.inner);
    const tDown = tGo + 0.75, tUp = tDown + 0.35;
    Loom.drive((e, raw) => {
      const T = tAsk + raw * (tUp + 0.45 - tAsk);
      const k = T < tAsk + 0.45 ? (T - tAsk) / 0.45 : T > tUp ? Math.max(0, 1 - (T - tUp) / 0.45) : 1;
      const s = k * k * (3 - 2 * k);
      dim.setAttribute("opacity", (0.42 * s).toFixed(3)); glow.setAttribute("opacity", (0.16 * s).toFixed(3));
    }, tAsk, tUp + 0.45 - tAsk, "linear", { kind: "state", beat: ctx.beat.id, name: "spot_go_first", content: true });
    Loom.stepped.on(P.p_test.E, { hz: 6 });
    P.p_test.look(0, -0.4, tAsk + 0.2);
    P.p_test.pose("present", tAsk + 0.35, { dur: 0.5 });   // the arm half rises
    P.p_test.pose("wave", tGo - 0.15, { dur: 0.4 });        // and on "go first" it is up, alone
    P.p_test.emotion("concerned", tGo);
    const goTag = Loom.gt.tag(ctx, "tag_go_first", { x: LX + 4, y: 352, text: "go first?", role: "lead", t: tGo });
    P.p_test.pose("idle", tDown, { dur: 0.45 });         // and comes back down: going first alone is the cost
    P.p_test.emotion("neutral", tDown + 0.3);
    m.exit(goTag, tUp, "recede");

    // ------------------------------------------------------------------ "Instead, everyone writes why it could fail"
    // Dana writes the prompt on the board (the slot relabels in her hand); five cards slide out together
    const prompt = (g, b) => kit.text(g, "write: why could it fail?", { role: "label", x: 6, y: 0, w: b.w - 12, h: 120, align: "center", valign: "top", maxLines: 2, color: "ink" });
    prompt.slotLabel = "write: why could it fail?"; prompt.floor = 1.6;
    board.show(prompt, tWrites, { how: "relabel" });
    P.dana.pose("wave", tWrites - 0.25, { dur: 0.35 });   // her hand up on the board while the words write on
    P.dana.pose("idle", tWrites + 1.3, { dur: 0.4 });
    // @form note_card_flat: a blank card lying flat on a table in perspective, written on with scribbles
    const flats = SEATS.map(([n, x], i) => {
      const E = ctx.el("card_flat_" + n, { x: x - 76, y: 686, w: 152, h: 44, kind: "prop" });
      svg("polygon", { points: "14,4 134,4 146,38 4,38", fill: S.c("surface"), stroke: S.c("ink"), "stroke-width": 4, "stroke-linejoin": "round" }, E.inner);
      const sc = svg("g", {}, E.inner);
      svg("path", { d: "M30 16 q8 -6 16 0 t16 0 t16 0 t16 0 t14 0", fill: "none", stroke: S.c("muted"), "stroke-width": 4, "stroke-linecap": "round" }, sc);
      svg("path", { d: "M26 28 q8 -6 16 0 t16 0 t16 0 t12 0", fill: "none", stroke: S.c("muted"), "stroke-width": 4, "stroke-linecap": "round" }, sc);
      Loom.stepped.on(E, { hz: 6 });
      m.reveal(E, tEvery + i * 0.06, { dy: 46, dur: 0.42 });
      return { E, sc, i };
    });
    // heads down, all at once; the scribbles appear on all five cards at the same moment
    Object.values(P).forEach((p) => p.look(0, 1, tWrites - 0.1));
    Loom.stepped.wrap(() => flats.forEach((f) => m.draw(f.sc, tWrites, { dur: 0.9, together: true })), { hz: 6 });

    // ------------------------------------------------------------------ "Then they read them out": all five turn up at once
    const ups = SEATS.map(([n, x, marked]) => {
      const E = ctx.el("card_" + n, { x: x - 66, y: 604, w: 132, h: 96, kind: "prop" });
      cardUp(E.inner, 66, 48, marked);
      Loom.stepped.on(E, { hz: 6 });
      m.grow(E, tRead + 0.12, { axis: "y", dur: 0.34, origin: "50% 100%" });
      return E;
    });
    flats.forEach((f) => m.exit(f.E, tRead, "collapse", { dur: 0.14 }));
    Object.values(P).forEach((p) => p.look(0, -0.1, tRead));
    // the words on the board leave before the camera pulls out (they would shrink below the type floor)
    board.clear(Math.min(ctx.speechEnd - 0.25, tRead + 1.2));
    Loom.stepped.boil(R.table, tRead + 0.5, ctx.end, { hz: 8, amp: 1.0 });
    void ups;
  },
});
