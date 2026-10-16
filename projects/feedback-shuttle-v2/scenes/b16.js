// @design same_room_decision_first: the opening room again, now the decision lands first and the clock sits early
/* Treatments considered: (A) a static two-shot with a caption of the line (rejected: no change visible in place);
 * (B) a before and after split (rejected: the room is the lesson's station, the change must happen in it);
 * (C) CHOSEN: the same room as b01; a paper sign drops, the budget card lands first, a Decided stamp lands
 * beside the screen (so no slide title is covered), the clock goes early. The full comment was shown in b11;
 * here the payoff is the changed slide order. */
Loom.scene("b16", {
  build(ctx) {
    const { kit, m } = ctx;
    const K = Loom.lesson.meeting_room.K, R = K.ROOM;
    const SIZE = 560;
    const tBack = ctx.cue("Back to Theo");
    const tFirst = ctx.cue("the decision comes first");
    const tEasier = ctx.cue("makes change easier");

    const set = ctx.el("set", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    Loom.lesson.meeting_room(ctx, set.inner, { layer: "back" });

    const EMOS = ["neutral", "happy", "surprised", "explaining"];
    const nina = ctx.el("nina", { x: R.nina.x - SIZE / 2, y: R.nina.y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "recede", parent: set.inner });
    const theo = ctx.el("theo", { x: R.theo.x - SIZE / 2, y: R.theo.y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "recede", parent: set.inner });
    const faces = { nina: {}, theo: {} };
    for (const em of EMOS) {
      faces.nina[em] = kit.peep(nina.inner, "woman", em, { x: SIZE / 2, y: SIZE / 2, size: 560, flip: false, cloth: "cloth", skin: 2 });
      faces.theo[em] = kit.peep(theo.inner, "man", em, { x: SIZE / 2, y: SIZE / 2, size: 560, flip: true, cloth: "cloth2", skin: 1 });
    }

    Loom.lesson.meeting_room(ctx, set.inner, { layer: "front" });

    const scr = ctx.el("wall_screen", { x: R.screen.x, y: R.screen.y, w: R.screen.w, h: R.screen.h, kind: "scenery", exit: "recede" });
    const screen = Loom.lesson.wall_screen(ctx, scr.inner, {});
    screen.setState("blank", ctx.start);
    screen.setState("budget_first", tFirst);

    // own Decided stamp: pos fill, ink outline, tick on a paper disc (a pos tick on pos fill would vanish)
    const dec = ctx.el("decided", { x: 830, y: 96, w: 340, h: 96, kind: "label", exit: "recede" });
    kit.rect(dec.inner, 0, 0, 340, 96, { fill: "pos", r: 14 });
    kit.disc(dec.inner, 52, 48, 32, { fill: "surface" });
    kit.mark(dec.inner, "yes", 52, 48, 40);
    kit.text(dec.inner, "Decided", { role: "label", weight: 700, color: Loom.style.pickTokenOn("pos"), x: 96, y: 20, w: 226, h: 56, align: "center", valign: "middle" });
    m.stamp(dec, tEasier);

    const clk = ctx.el("wall_clock", { x: R.clock.x, y: R.clock.y, w: R.clock.w, h: R.clock.h, kind: "scenery", exit: "recede" });
    const clock = Loom.lesson.wall_clock(ctx, clk.inner, {});
    clock.setState("on_time", ctx.start);
    clock.setState("early", tEasier + 0.2);

    const cal = ctx.el("wall_calendar", { x: R.calendar.x, y: R.calendar.y, w: R.calendar.w, h: R.calendar.h, kind: "scenery", exit: "recede" });
    Loom.lesson.wall_calendar(ctx, cal.inner, {}).setState("plain", ctx.start);

    const sign = ctx.el("next_sign", { x: 740, y: 320, w: 500, h: 130, kind: "label", exit: "recede" });
    // @form paper_sign: a hand-lettered paper sign with an ink outline
    kit.rect(sign.inner, 0, 0, 500, 130, { fill: "surface", r: 14 });
    kit.text(sign.inner, "Next update", { role: "lead", weight: 400, x: 30, y: 15, w: 440, h: 100, align: "center", valign: "middle" });
    m.drop(sign, tBack);

    m.drift(nina, ctx.start, ctx.end, { amp: 5, period: 3 });
    m.drift(theo, ctx.start, ctx.end, { amp: 5, period: 3.4 });

    for (const who of ["nina", "theo"]) {
      const F = faces[who], T0 = ctx.start, T1 = ctx.end;
      Loom.drive((e, raw) => {
        for (const em of EMOS) F[em].style.visibility = em === "happy" ? "visible" : "hidden";
      }, T0, Math.max(0.1, T1 - T0), "linear", { kind: "character", beat: ctx.beat.id, name: who, content: true });
    }
  },
});
