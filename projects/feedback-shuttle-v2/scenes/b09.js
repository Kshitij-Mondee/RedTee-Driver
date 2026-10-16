// @design slipping_on_the_wall_calendar: a dated card on a wall calendar slides one column on while the second slot of a note fills with the same fact
/* Treatments considered: (A) a static caption card "Budget decision moved to next week" (rejected: says it, no movement);
 * (B) a timeline bar with the decision sliding along it (rejected: a new device beside the room the lesson already built);
 * (C) CHOSEN: the held room; the wall calendar shows a Budget decision card in This week, it slides into Next week on
 *     "slipped a week", and the bubble's second slot writes on the same fact. Static composition with signalling: the
 *     accent outline on the card is the one accent.
 * The calendar IS the element budget_card (b10 holds it); the bubble's second row is effect_row, drawn over the held
 * dashed slot at the bubble's b01 geometry (x 610, y 250, 700 wide). Nina's explaining face is a peep added on top of
 * the held bust, as b02 does. If a held element is missing it is drawn here with the same names and literals. */
Loom.scene("b09", {
  build(ctx) {
    const { kit, m } = ctx;
    const K = Loom.lesson.meeting_room.K, R = K.ROOM;
    const SIZE = R.nina.size;
    const rnd = (v) => Math.round(v * 100) / 100;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

    // 0. timings, every one a spoken phrase of this beat
    const tCaused = ctx.cue("What it caused");
    const tRan = ctx.cue("ran out of time");
    const tSlip = ctx.cue("slipped a week");

    // 1. the room, Nina, Theo, the bubble: held (same position, no entrance); drawn here only if missing
    let set = ctx.held("set");
    let nina = ctx.held("nina");
    let theo = ctx.held("theo");
    let bub = ctx.held("bubble");
    try { ctx.held("slots"); } catch (e) { /* keep only: carries the slots on to b10 */ }
    if (!set) {
      set = ctx.el("set", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
      Loom.lesson.meeting_room(ctx, set.inner, { layer: "back" });
      nina = ctx.el("nina", { x: R.nina.x - SIZE / 2, y: R.nina.y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "recede", parent: set.inner });
      theo = ctx.el("theo", { x: R.theo.x - SIZE / 2, y: R.theo.y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "recede", parent: set.inner });
      kit.peep(nina.inner, "woman", "neutral", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: false, cloth: "cloth", skin: 2 });
      kit.peep(theo.inner, "man", "neutral", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: true, cloth: "cloth2", skin: 1 });
      Loom.lesson.meeting_room(ctx, set.inner, { layer: "front" }).setState("nameplates", ctx.start);
    }
    if (!bub) {
      bub = ctx.el("bubble", { x: R.bubble.x, y: R.bubble.y, w: 700, h: 430, kind: "bubble", exit: "recede" });
      Loom.lesson.comment_bubble(ctx, bub.inner, { w: 700 }).setState("slots", ctx.start, { pulse: 0 });
    }

    // 2. the question mark and the replay leave quietly (held from b08)
    const qm = ctx.held("question_mark");
    const replay = ctx.held("replay");
    if (qm) m.exit(qm, ctx.start + 0.05, "recede");
    if (replay) m.exit(replay, ctx.start + 0.1, "recede");

    // 3. the wall: a blank screen fades in as the replay goes, the clock on time, the calendar (the element budget_card)
    const scrEl = ctx.el("wall_screen", { x: R.screen.x, y: R.screen.y, w: R.screen.w, h: R.screen.h, kind: "scenery", exit: "recede" });
    Loom.lesson.wall_screen(ctx, scrEl.inner, {}).setState("blank", ctx.start);
    m.reveal(scrEl, ctx.start + 0.15, { dy: 0 });
    const clkEl = ctx.el("wall_clock", { x: R.clock.x, y: R.clock.y, w: R.clock.w, h: R.clock.h, kind: "scenery", exit: "recede" });
    Loom.lesson.wall_clock(ctx, clkEl.inner, {}).setState("on_time", ctx.start);
    const calEl = ctx.el("budget_card", { x: R.calendar.x, y: R.calendar.y, w: R.calendar.w, h: R.calendar.h, kind: "scenery", exit: "recede" });
    const cal = Loom.lesson.wall_calendar(ctx, calEl.inner, {});
    cal.setState("plain", ctx.start);
    cal.setState("budget_card", tCaused);     // the Budget decision card pops in This week
    cal.setState("moved", tSlip);             // and slides into Next week on "slipped a week"

    // 4. the effect row: slot 2 of the bubble fills (written on, left to right) on the same words
    const s = 700 / 760, OX = 14, OY = 134;   // bubble units -> screen, relative to the row's own box
    const L = (v, o) => rnd((v - o) * s);
    const effEl = ctx.el("effect_row", { x: R.bubble.x + OX * s, y: R.bubble.y + OY * s, w: 732 * s, h: 134 * s, kind: "card", exit: "recede" });
    const clipId = Loom.uid("b09eff");
    const cp = Loom.svg("clipPath", { id: clipId }, effEl.inner);
    const clipRect = Loom.svg("rect", { x: -10, y: -20, width: 0, height: 134 * s + 40 }, cp);
    const content = Loom.svg("g", { "clip-path": "url(#" + clipId + ")" }, effEl.inner);
    const EY = 172;   // the row's top, as in the kit
    kit.rect(content, L(20, OX), L(EY, OY), rnd(720 * s), rnd(90 * s), { fill: "field", r: 12, flat: true, sw: 4 });
    kit.text(content, "Budget decision moved to next week", { role: "body", weight: 700, x: L(38, OX), y: L(EY + 30, OY), w: rnd(690 * s), h: rnd(48 * s), maxLines: 1, align: "left", valign: "middle", color: "ink" });
    const tabW = rnd(160 * s), tabH = rnd(62 * s);
    kit.rect(content, L(30, OX), L(EY - 32, OY), tabW, tabH, { fill: "accent4", r: 10, flat: true, sw: 4 });
    kit.text(content, "Effect", { role: "label", weight: 400, color: Loom.style.pickTokenOn("accent4"), x: L(42, OX), y: L(EY - 32 + 9, OY), w: rnd((160 - 24) * s), h: rnd(44 * s), maxLines: 1, align: "center", valign: "middle" });
    const writeAt = (v) => {
      clipRect.setAttribute("width", rnd(clamp(v, 0, 1) * (732 * s + 20)));
      content.style.visibility = v > 0.001 ? "visible" : "hidden";
    };
    writeAt(0);
    Loom.drive((e) => writeAt(e), tSlip + 0.3, 0.6, "move", { key: "b09.effect_write" });

    // 5. ambient life, continuing the sway
    m.drift(nina, ctx.start, ctx.end, { amp: 5, period: 3 });
    m.drift(theo, ctx.start, ctx.end, { amp: 5, period: 3.4 });

    // 6. Nina's explaining face, a peep over the held bust: ONE drive, a pure function of time, kept on after the beat
    const fExp = kit.peep(nina.inner, "woman", "explaining", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: false, cloth: "cloth", skin: 2 });
    fExp.style.visibility = "hidden";
    const T0 = ctx.start, T1 = ctx.end, DUR = Math.max(0.1, T1 - T0);
    Loom.drive((e, raw) => {
      fExp.style.visibility = T0 + raw * DUR >= tRan ? "visible" : "hidden";
    }, T0, DUR, "linear", { kind: "character", beat: ctx.beat.id, name: "nina", content: true });
  },
});
