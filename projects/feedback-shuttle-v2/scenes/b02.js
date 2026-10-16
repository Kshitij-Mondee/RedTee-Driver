// @design same_room_time_passes: the same two people and wall, a week on, where one wall clock and one stack of cards show the repeat running over
/* Treatments considered: (A) a static comparison card "week 1 / week 2" (rejected: a slide, no room);
 * (B) a split screen of two weeks (rejected: breaks the held room);
 * (C) CHOSEN: the held room continues; the calendar page turns, the cards stack, the clock sweeps past the hour,
 *     the Budget card lands last in the one accent. Static composition with signalling: the accent ring on the card.
 * The previous beat hands on set (wall, table with nameplates, both busts), so nothing of the room is redrawn.
 * Theo already ends that beat smiling and keeps it (a face change would be a pop); Nina's face falls on the last words.
 * If a held element is missing the room is drawn here with the same names and literals.
 */
Loom.scene("b02", {
  build(ctx) {
    const { kit, m } = ctx;
    const R = Loom.lesson.meeting_room.K.ROOM;
    const SIZE = R.nina.size;

    // 1. the room, Nina and Theo: held from b01 (same position, no entrance)
    let set = ctx.held("set");
    let nina = ctx.held("nina");
    let theo = ctx.held("theo");
    if (!set) {
      set = ctx.el("set", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
      Loom.lesson.meeting_room(ctx, set.inner, { layer: "back" });
      nina = ctx.el("nina", { x: R.nina.x - SIZE / 2, y: R.nina.y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "recede", parent: set.inner });
      theo = ctx.el("theo", { x: R.theo.x - SIZE / 2, y: R.theo.y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "recede", parent: set.inner });
      kit.peep(theo.inner, "man", "happy", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: true, cloth: "cloth2", skin: 1 });
      Loom.lesson.meeting_room(ctx, set.inner, { layer: "front" }).setState("nameplates", ctx.start);
    }

    // 2. Nina's two faces over the held bust (same literals as b01): happy to start, neutral on the last words
    const fNina = {
      happy: kit.peep(nina.inner, "woman", "happy", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: false, cloth: "cloth", skin: 2 }),
      neutral: kit.peep(nina.inner, "woman", "neutral", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: false, cloth: "cloth", skin: 2 }),
    };

    // 3. the wall, same anchors as b01: screen blank, clock on time, calendar plain
    const slidesEl = ctx.el("slides", { x: R.screen.x, y: R.screen.y, w: R.screen.w, h: R.screen.h, kind: "instrument", exit: "recede" });
    const screen = Loom.lesson.wall_screen(ctx, slidesEl.inner, {});
    const clockEl = ctx.el("clock", { x: R.clock.x, y: R.clock.y, w: R.clock.w, h: R.clock.h, kind: "instrument", exit: "recede" });
    const clock = Loom.lesson.wall_clock(ctx, clockEl.inner, {});
    const calEl = ctx.el("calendar_flip", { x: R.calendar.x, y: R.calendar.y, w: R.calendar.w, h: R.calendar.h + 70, kind: "scenery", exit: "recede" });
    const cal = Loom.lesson.wall_calendar(ctx, calEl.inner, {});
    // the Budget card's place on the screen: the accent element (its card is drawn by the screen part)
    ctx.el("budget_slide", { x: 30, y: 21 + 4 * 53, w: 480, h: 60, kind: "card", exit: "recede", parent: slidesEl.inner });

    // 4. timings, every one from a spoken phrase
    const tWeek = ctx.cue("Next week");
    const tRuns = ctx.cue("the update runs");
    const tLong = ctx.cue("just as long");
    const tNone = ctx.cue("Nothing changed");
    ctx.cue("Theo smiles");

    // 5. a week passes: the page turns with its tab; cards stack; the hands sweep; the Budget card lands last
    cal.setState("flip", tWeek);
    [0, 1, 2, 3].forEach((i) => screen.showCard(i, tRuns + i * 0.4));
    clock.setState("past_hour", tLong);
    screen.showCard(4, tNone);

    // 6. ambient life, continuing b01's sway
    m.drift(nina, ctx.start, ctx.end, { amp: 5, period: 3 });
    m.drift(theo, ctx.start, ctx.end, { amp: 5, period: 3.4 });

    // 7. Nina's face: ONE drive, a pure function of time
    const tFall = tNone + 0.3;
    const T0 = ctx.start, T1 = ctx.end;
    Loom.drive((e, raw) => {
      const neutral = T0 + raw * (T1 - T0) >= tFall;
      fNina.happy.style.visibility = neutral ? "hidden" : "visible";
      fNina.neutral.style.visibility = neutral ? "visible" : "hidden";
    }, T0, Math.max(0.1, T1 - T0), "linear", { kind: "character", beat: ctx.beat.id, name: "nina", content: true });
  },
});
