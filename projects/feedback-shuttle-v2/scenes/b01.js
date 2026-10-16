// @design hush_after_the_update: a kind sentence lands in a room, and the listener smiles at nothing
/* Treatments considered: (A) a static two-shot with a caption card of the line (rejected: nothing moves, no turn);
 * (B) a chat window with the line (rejected: this is a spoken comment between people, and the room is the lesson's
 * station); (C) CHOSEN: the room, Theo looks up after his update, Nina's bubble pops between them.
 * The table (front layer) is drawn after the busts inside the 'set' element so b02 can hold set, nina and theo. */
Loom.scene("b01", {
  build(ctx) {
    const { kit, m } = ctx;
    const K = Loom.lesson.meeting_room.K, R = K.ROOM;
    const SIZE = 560;
    const tUpd = ctx.cue("project update");
    const tGreat = ctx.cue("Great job");
    const tTight = ctx.cue("Maybe tighten");

    // 1. the set: wall behind (back layer), then busts, then the table in front (front layer)
    const set = ctx.el("set", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    const room = Loom.lesson.meeting_room(ctx, set.inner, { layer: "back" });

    // 2. the people (cast: Nina woman skin 2 cloth, screen left; Theo man skin 1 cloth2, flip, screen right)
    const EMOS = ["neutral", "happy", "explaining"];
    const nina = ctx.el("nina", { x: R.nina.x - SIZE / 2, y: R.nina.y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "recede", parent: set.inner });
    const theo = ctx.el("theo", { x: R.theo.x - SIZE / 2, y: R.theo.y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "recede", parent: set.inner });
    const faces = { nina: {}, theo: {} };
    for (const em of EMOS) {
      faces.nina[em] = kit.peep(nina.inner, "woman", em, { x: SIZE / 2, y: SIZE / 2, size: 560, flip: false, cloth: "cloth", skin: 2 });
      faces.theo[em] = kit.peep(theo.inner, "man", em, { x: SIZE / 2, y: SIZE / 2, size: 560, flip: true, cloth: "cloth2", skin: 1 });
    }

    // 3. the table in front of the busts' lower halves, with nameplates
    const table = Loom.lesson.meeting_room(ctx, set.inner, { layer: "front" });
    table.setState("nameplates", ctx.start + 0.1);

    // 4. the wall: screen blank, clock on time, calendar plain
    const scr = ctx.el("wall_screen", { x: R.screen.x, y: R.screen.y, w: R.screen.w, h: R.screen.h, kind: "scenery", exit: "recede" });
    Loom.lesson.wall_screen(ctx, scr.inner, {}).setState("blank", ctx.start);
    const clk = ctx.el("wall_clock", { x: R.clock.x, y: R.clock.y, w: R.clock.w, h: R.clock.h, kind: "scenery", exit: "recede" });
    Loom.lesson.wall_clock(ctx, clk.inner, {}).setState("on_time", ctx.start);
    const cal = ctx.el("wall_calendar", { x: R.calendar.x, y: R.calendar.y, w: R.calendar.w, h: R.calendar.h, kind: "scenery", exit: "recede" });
    Loom.lesson.wall_calendar(ctx, cal.inner, {}).setState("plain", ctx.start);

    // 5. the bubble (scaled to 700 wide so it clears Theo's head) pops on "Great job"; its outline is the one accent
    const bub = ctx.el("bubble", { x: R.bubble.x, y: R.bubble.y, w: 700, h: 430, kind: "bubble", exit: "recede" });
    const cb = Loom.lesson.comment_bubble(ctx, bub.inner, { w: 700 });
    cb.setState("vague", tGreat);
    const ringG = Loom.svg("g", { transform: "scale(0.92)" }, bub.inner);
    const ring = Loom.svg("rect", { x: -4, y: 206, width: 768, height: 198, rx: 32, fill: "none", stroke: ctx.c("accent"), "stroke-width": 7, opacity: 0 }, ringG);
    Loom.drive((e) => ring.setAttribute("opacity", Math.round(Math.max(0, Math.min(1, e * 1.6)) * 100) / 100), tGreat + 0.1, 0.4, "enter", { key: "b01.ring" });

    // 6. ambient life: a slow sway so a face never holds a still frame
    m.drift(nina, ctx.start, ctx.end, { amp: 5, period: 3 });
    m.drift(theo, ctx.start, ctx.end, { amp: 5, period: 3.4 });

    // 7. faces: ONE drive per person, a pure function of time. Theo stays calm: neutral until his update ends
    //    (under 4 s, so the eyes are not closed for long), then a mild smile (happy) to the end.
    const words = [];
    for (const ph of (ctx.beat && ctx.beat.phrases) || []) for (const w of ph.words || []) words.push(w);
    const flap = (t) => { const w = words.find((x) => t >= x.s && t < x.e); return !!w && Math.floor((t - w.s) / 0.12) % 2 === 0; };
    const faceAt = {
      nina: (t) => (t >= tGreat ? (flap(t) ? "explaining" : "happy") : t >= tUpd ? "happy" : "neutral"),
      theo: (t) => (t >= tUpd ? "happy" : "neutral"),
    };
    for (const who of ["nina", "theo"]) {
      const F = faces[who], T0 = ctx.start, T1 = ctx.end;
      Loom.drive((e, raw) => {
        const want = faceAt[who](T0 + raw * (T1 - T0));
        for (const em of EMOS) F[em].style.visibility = em === want ? "visible" : "hidden";
      }, T0, Math.max(0.1, T1 - T0), "linear", { kind: "character", beat: ctx.beat.id, name: who, content: true });
    }
  },
});
