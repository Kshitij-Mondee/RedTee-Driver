// @design week_later_overrun: the same room a week on; a paper tag drops by the clock, the hand sweeps past the end mark while the face of the listener falls
/* Treatments considered: (A) a static composition: tag + clock + two faces, signalled by the accent arc alone;
 * (B) a calendar page flips to next week (rejected: a new object, the room must hold);
 * (C) CHOSEN: hold the room and the two people, drop a paper tag by the clock, seat two muted colleagues,
 *     sweep the hand, change two faces. Everything is time, nothing new in the room but the tag and the extras.
 * Layers (as b01): set (whole room, table included) < extras_sit (clipped above the table edge) < busts < tag. */
Loom.scene("b02", {
  build(ctx) {
    const { kit, m } = ctx;
    const L = Loom.lesson, R = L.meeting_room.anchors;
    const SIZE = 560;
    const tWeek = ctx.cue("Next week");
    const tOver = ctx.cue("runs over again");
    const tBeh = ctx.cue("Behaviour didn't");

    // ---- the room (held from b01; drawn again only if it is not there) ----
    let set = ctx.held("set");
    if (!set) {
      set = ctx.el("set", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
      L.meeting_room(ctx, set.inner, { layer: "all", state: "two_shot" });
    }

    // ---- the extras: two muted colleagues seated behind the table (fade up on "Next week") ----
    // The held set keeps its chairs hidden, so the chairs come from a copy of the room clipped to the two chair
    // rectangles (identical wall and floor around them, so only the chairs appear); the people are clipped at the
    // table edge and around the mug, so the table and the mug stay in front of them.
    const extras = ctx.el("extras_sit", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    const defs = Loom.svg("defs", {}, extras.inner);
    const cp = Loom.svg("clipPath", { id: "b02chairs" }, defs);
    [[686, 686, 168, 211.5], [1066, 686, 168, 211.5]].forEach((r) => Loom.svg("rect", { x: r[0], y: r[1], width: r[2], height: r[3] }, cp));
    const cp2 = Loom.svg("clipPath", { id: "b02people" }, defs);
    Loom.svg("path", { d: "M0 0H1920V897.5H0Z M1004 846H1094V897.5H1004Z", "clip-rule": "evenodd" }, cp2);
    const chairG = Loom.svg("g", { "clip-path": "url(#b02chairs)" }, extras.inner);
    const chairs = L.meeting_room(ctx, chairG, { layer: "back" });
    chairs.setState("extras_space", tWeek + 0.2, 0.6);
    const crowdG = Loom.svg("g", { "clip-path": "url(#b02people)" }, extras.inner);
    ctx.crowd("extras_people", { x: 800, y: 1115, w: 320, count: 2, rows: 1, scale: 0.65, tone: "muted", parent: crowdG });
    m.reveal(extras, tWeek + 0.35, { dy: 0 });

    // ---- the two people (held; faces switched by one drive each) ----
    const asha = ctx.held("asha") || ctx.el("asha", { x: R.asha.x - SIZE / 2, y: R.asha.y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "recede" });
    const ben = ctx.held("ben") || ctx.el("ben", { x: R.ben.x - SIZE / 2, y: R.ben.y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "recede" });
    const fa = {}, fb = {};
    fa.happy = kit.peep(asha.inner, "woman", "happy", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: false, cloth: "cloth", skin: 2 });
    fa.surprised = kit.peep(asha.inner, "woman", "surprised", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: false, cloth: "cloth", skin: 2 });
    fb.happy = kit.peep(ben.inner, "man", "happy", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: true, cloth: "cloth2", skin: 1 });
    fb.explaining = kit.peep(ben.inner, "man", "explaining", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: true, cloth: "cloth2", skin: 1 });
    const T0 = ctx.start, T1 = ctx.end;
    const drv = (name, F, wantAt) => Loom.drive((e, raw) => {
      const want = wantAt(T0 + raw * (T1 - T0));
      for (const k in F) F[k].style.visibility = k === want ? "visible" : "hidden";
    }, T0, Math.max(0.1, T1 - T0), "linear", { kind: "character", beat: ctx.beat.id, name, content: true });
    drv("asha", fa, (t) => (t >= tBeh ? "surprised" : "happy"));
    drv("ben", fb, (t) => (t >= tOver ? "explaining" : "happy"));

    // ---- the clock (held; same box as b01: x1590 y80 180x180, on_time at open); the accent of the beat ----
    let clockE = ctx.held("clock");
    if (!clockE) clockE = ctx.el("clock", { x: R.clock.x, y: R.clock.y, w: 180, h: 180, kind: "instrument", exit: "recede" });
    const clk = L.wall_clock(ctx, clockE.inner, { w: 180, state: "on_time" });
    clk.setState("overrun_arc", tOver, 1.1);

    // ---- the tag: a small paper tag drops in by the clock on "Next week", then settles ----
    // (a no-break space keeps "over again" together, so the tag breaks after the colon)
    const tag = ctx.el("week_tag", { x: 1236, y: 106, w: 320, h: 120, kind: "card", exit: "recede" });
    const lt = L.label_tag(ctx, tag.inner, { w: 320, text: "Next week: over again" });
    m.drop(tag, tWeek, { dy: -160 });
    lt.setState("stuck", tWeek + 0.5, 0.4);
  },
});
