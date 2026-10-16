// @design week_on_ends_on_time: the same room a week on; the pinned agenda sits by the clock, the hand reaches the end mark and stops, the guests leave on time, a specific line is said and both faces ease
/* Treatments considered:
 * (A) a static composition with the clock ringed in the accent and the tag fixed (rejected: nothing changes, the payoff is the change);
 * (B) a time-lapse of the clock face alone (rejected: loses the people and the easy relationship);
 * (C) CHOSEN: hold the room as b01, pin the agenda by the clock, sweep the hand to the mark with a soft accent ring, drop the tag,
 *     two muted colleagues (ctx.crowd, as the seated attendees of b02) slide out and fade before they reach the busts, Asha's specific line, then both faces settle to happy.
 * Layers: set < extras (chairs + muted crowd clipped above the table edge) < busts < clock < agenda < tag < bubble. */
Loom.scene("b16", {
  build(ctx) {
    const { kit, m } = ctx;
    const L = Loom.lesson, T = Loom.treat;
    const A = L.meeting_room.anchors;
    const SIZE = 560, Y = 620;
    const tNext = ctx.cue("Next week");
    const tEnds = ctx.cue("ends on time");
    const tSay = ctx.cue("The timed agenda got us");
    const tBeh = ctx.cue("Behaviour changed");
    const tRel = ctx.cue("Relationship intact");

    // 1. the room, whole
    const set = ctx.el("set", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
    L.meeting_room(ctx, set.inner, { layer: "all", state: "two_shot" });
    m.reveal(set, ctx.start + 0.02, { dy: 0 });

    // 2. two muted extras seated behind the table (ctx.crowd, as b02), leaving on time.
    // The chairs come from a copy of the room clipped to the two chair rectangles; the people are clipped at the
    // table edge and around the mug, so the table and the mug stay in front. Each slides outward and fades before a bust.
    const extras = ctx.el("extras", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    const defs = Loom.svg("defs", {}, extras.inner);
    const cp = Loom.svg("clipPath", { id: "b16chairs" }, defs);
    [[686, 686, 168, 211.5], [1066, 686, 168, 211.5]].forEach((r) => Loom.svg("rect", { x: r[0], y: r[1], width: r[2], height: r[3] }, cp));
    const cp2 = Loom.svg("clipPath", { id: "b16people" }, defs);
    Loom.svg("path", { d: "M0 0H1920V897.5H0Z M1004 846H1094V897.5H1004Z", "clip-rule": "evenodd" }, cp2);
    const chairG = Loom.svg("g", { "clip-path": "url(#b16chairs)" }, extras.inner);
    L.meeting_room(ctx, chairG, { layer: "back", state: "extras_space" });
    const crowdG = Loom.svg("g", { "clip-path": "url(#b16people)" }, extras.inner);
    const gA = Loom.svg("g", {}, crowdG), gB = Loom.svg("g", {}, crowdG);
    ctx.crowd("extra_left", { x: 800, y: 1115, w: 160, count: 1, rows: 1, scale: 0.65, tone: "muted", parent: gA });
    ctx.crowd("extra_right", { x: 1120, y: 1115, w: 160, count: 1, rows: 1, scale: 0.65, tone: "muted", parent: gB });
    L.meeting_room(ctx, extras.inner, { layer: "front", state: "two_shot" });
    m.reveal(extras, ctx.start + 0.05, { dy: 0 });
    const tWa = tEnds + 0.4, tWb = tEnds + 0.55;
    const slide = (g, t0, dir, nm) => Loom.drive((e, raw) => {
      const p = Math.min(1, raw), q = p * p * (3 - 2 * p);
      g.setAttribute("transform", "translate(" + (dir * 380 * q).toFixed(2) + " 0)");
      g.setAttribute("opacity", Math.max(0, Math.min(1, 1 - (p - 0.35) / 0.6)).toFixed(3));
    }, t0, 2.0, "linear", { key: "b16slide_" + nm, kind: "scenery", beat: ctx.beat.id, name: "extras", content: true });
    slide(gA, tWa, -1, "a");
    slide(gB, tWb, 1, "b");

    // 3. the two people, one look each (CAST)
    const asha = ctx.el("asha", { x: 380 - SIZE / 2, y: Y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "none" });
    const ben = ctx.el("ben", { x: 1540 - SIZE / 2, y: Y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "none" });
    const EM = ["explaining", "happy"];
    const fa = {}, fb = {};
    for (const em of EM) {
      fa[em] = kit.peep(asha.inner, "woman", em, { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: false, cloth: "cloth", skin: 2 });
      fb[em] = kit.peep(ben.inner, "man", em, { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: true, cloth: "cloth2", skin: 1 });
    }
    m.reveal(asha, ctx.start + 0.1, { dy: 0 });
    m.reveal(ben, ctx.start + 0.2, { dy: 0 });
    const T0 = ctx.start, T1 = ctx.end, D = Math.max(0.1, T1 - T0);
    const faceDrive = (name, F, fn) => Loom.drive((e, raw) => {
      const want = fn(T0 + raw * D);
      for (const k in F) F[k].style.visibility = k === want ? "visible" : "hidden";
    }, T0, D, "linear", { kind: "character", beat: ctx.beat.id, name, content: true });
    faceDrive("asha", fa, (t) => (t >= tRel ? "happy" : t >= tSay ? "explaining" : "happy"));
    faceDrive("ben", fb, (t) => (t >= tBeh ? "happy" : "explaining"));

    // 4. the clock: the hand reaches the end mark and stops, the one accent
    const clock = ctx.el("clock", { x: A.clock.x, y: A.clock.y, w: 180, h: 180, kind: "instrument", exit: "none" });
    const ringG = Loom.svg("g", { opacity: 0 }, clock.inner);
    const ring = Loom.svg("circle", { cx: 90, cy: 90, r: 88, fill: "none", stroke: ctx.c("accent"), "stroke-width": 7 }, ringG);
    const clk = L.wall_clock(ctx, clock.inner, { w: 180 });
    m.settle(clock, ctx.start + 0.12, { dy: 12 });
    clk.setState("at_end", tEnds, 1.0);
    Loom.drive((e, raw) => {
      ringG.setAttribute("opacity", (Math.sin(Math.PI * Math.min(1, raw)) * 0.85).toFixed(3));
      ring.setAttribute("r", (88 + 22 * raw).toFixed(2));
    }, tEnds + 0.8, 1.2, "linear", { key: "b16ring", kind: "instrument", beat: ctx.beat.id, name: "clock", content: true });

    // 5. the timed agenda, pinned beside the clock (left of it, clear of the clock's rim)
    const agenda = ctx.el("agenda", { x: 1266, y: 80, w: 360, h: 300, kind: "card", exit: "recede" });
    const ta = L.timed_agenda(ctx, agenda.inner, { w: 360 });
    ta.setState("pinned", ctx.start, 0);
    m.drop(agenda, tNext, { dy: -140 });

    // 6. the paper tag
    const tag = ctx.el("end_tag", { x: 990, y: 92, w: 300, h: 112, kind: "card", exit: "recede" });
    const lt = L.label_tag(ctx, tag.inner, { w: 300, text: "Ended on time" });
    m.drop(tag, tEnds + 0.5, { dy: -160 });
    lt.setState("stuck", tEnds + 1.0, 0.4);

    // 7. Asha's specific line (paper fill: the accent stays on the clock); x and y are the bubble's centre
    T.bubble(ctx, "praise_bubble", { x: 860, y: 340, w: 660, text: "The timed agenda got us out on time.", tail: [440, 450], kind: "speech", fill: "surface", t: tSay });
  },
});
