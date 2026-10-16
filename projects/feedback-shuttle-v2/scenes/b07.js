// @design label_becomes_observed_fact: a stuck-on label falls away and the same moment is replayed as what actually happened
/* Treatments considered: (A) a static caption card with the sentence (rejected: no room, no turn);
 * (B) bubble only, wall left empty (rejected: the fact is the order of the slides, so it has to be seen);
 * (C) CHOSEN: the held room continues; the tag peels and falls, Nina's bubble pops with the Behaviour row,
 *     the wall screen replays the slides and the Budget card lands last inside one accent ring.
 *     Static composition with signalling: the accent ring on the Budget card.
 * Held from b06: set, nina, theo, tag, pane. If the room is missing it is drawn here with the same names. */
Loom.scene("b07", {
  build(ctx) {
    const { kit, m } = ctx;
    const R = Loom.lesson.meeting_room.K.ROOM;
    const SIZE = R.nina.size;
    const rnd = (v) => Math.round(v * 100) / 100;

    // timings, every one a spoken phrase
    const tSay = ctx.cue("Say what you saw");
    const tTue = ctx.cue("On Tuesday");
    const tCame = ctx.cue("came last");
    const tAfter = ctx.cue("after every other workstream");

    // 1. the room, Nina and Theo: held from b06
    let set = ctx.held("set");
    let nina = ctx.held("nina");
    let theo = ctx.held("theo");
    let tag = ctx.held("tag");
    const pane = ctx.held("pane");
    let tagKit = null;
    if (!set) {
      set = ctx.el("set", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
      Loom.lesson.meeting_room(ctx, set.inner, { layer: "back" });
      nina = ctx.el("nina", { x: R.nina.x - SIZE / 2, y: R.nina.y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "recede", parent: set.inner });
      theo = ctx.el("theo", { x: R.theo.x - SIZE / 2, y: R.theo.y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "recede", parent: set.inner });
      Loom.lesson.meeting_room(ctx, set.inner, { layer: "front" }).setState("nameplates", ctx.start);
      if (!tag) {
        tag = ctx.el("tag", { x: R.theo.x - 110, y: 800, w: 220, h: 94, kind: "card", exit: "recede" });
        tagKit = Loom.lesson.label_tag(ctx, tag.inner, { w: 220 });
        tagKit.setState("stuck", ctx.start);
      }
    }

    // 2. faces over the held busts (same literals as b01/b02): Nina speaks, Theo explains then smiles
    const F = {
      nina: {
        happy: kit.peep(nina.inner, "woman", "happy", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: false, cloth: "cloth", skin: 2 }),
        explaining: kit.peep(nina.inner, "woman", "explaining", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: false, cloth: "cloth", skin: 2 }),
      },
      theo: {
        explaining: kit.peep(theo.inner, "man", "explaining", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: true, cloth: "cloth2", skin: 1 }),
        happy: kit.peep(theo.inner, "man", "happy", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: true, cloth: "cloth2", skin: 1 }),
      },
    };

    // 3. the tag peels and falls, the pane sinks, on "Say what you saw"
    if (tagKit) tagKit.setState("peeling", tSay);
    else if (tag) {
      const life = tag.life || tag.outer;
      Loom.drive((e) => {
        life.setAttribute("transform", "translate(" + rnd(e * 40) + " " + rnd(e * e * 420) + ") rotate(" + rnd(e * 34) + ")");
        const op = Math.max(0, Math.min(1, 1 - (e - 0.6) / 0.4));
        life.setAttribute("opacity", rnd(op));
        life.setAttribute("visibility", op > 0.001 ? "inherit" : "hidden");
      }, tSay + 0.4, 0.9, "enter", { key: "b07.tagfall" });
    }
    if (pane) m.exit(pane, tSay + 0.3, "sink");

    // 4. the wall: clock and calendar still, the screen replays the slide order
    const scrEl = ctx.el("replay", { x: R.screen.x, y: R.screen.y, w: R.screen.w, h: R.screen.h, kind: "instrument", exit: "recede" });
    const screen = Loom.lesson.wall_screen(ctx, scrEl.inner, {});
    const clkEl = ctx.el("clock", { x: R.clock.x, y: R.clock.y, w: R.clock.w, h: R.clock.h, kind: "instrument", exit: "recede" });
    Loom.lesson.wall_clock(ctx, clkEl.inner, {}).setState("on_time", ctx.start);
    const calEl = ctx.el("calendar", { x: R.calendar.x, y: R.calendar.y, w: R.calendar.w, h: R.calendar.h, kind: "scenery", exit: "recede" });
    Loom.lesson.wall_calendar(ctx, calEl.inner, {}).setState("plain", ctx.start);

    [0, 1, 2, 3].forEach((i) => screen.showCard(i, tCame + i * 0.2));
    screen.showCard(4, tAfter, { marked: false });

    // the accent ring on the Budget card, its own element so b08 can retire it
    const ringEl = ctx.el("replay_budget", { x: R.screen.x + 24, y: R.screen.y + 227, w: 492, h: 72, kind: "card", exit: "recede" });
    Loom.svg("rect", { x: 6, y: 6, width: 480, height: 60, rx: 11, fill: "none", stroke: ctx.c("accent"), "stroke-width": 6 }, ringEl.inner);
    m.pop(ringEl, tAfter + 0.35);

    // 5. Nina's bubble: same place and width as b01's, Behaviour row only
    const bub = ctx.el("bubble", { x: R.bubble.x, y: R.bubble.y, w: 700, h: 430, kind: "bubble", exit: "recede" });
    const cb = Loom.lesson.comment_bubble(ctx, bub.inner, { w: 700 });
    cb.setState("behaviour", tTue);

    // 6. ambient life
    m.drift(nina, ctx.start, ctx.end, { amp: 5, period: 3 });
    m.drift(theo, ctx.start, ctx.end, { amp: 5, period: 3.4 });

    // 7. faces: ONE drive per person, a pure function of time
    const words = [];
    for (const ph of (ctx.beat && ctx.beat.phrases) || []) for (const w of ph.words || []) words.push(w);
    const flap = (t) => { const w = words.find((x) => t >= x.s && t < x.e); return !!w && Math.floor((t - w.s) / 0.12) % 2 === 0; };
    const faceAt = {
      nina: (t) => (flap(t) ? "explaining" : "happy"),
      theo: (t) => (t >= tTue ? "happy" : "explaining"),
    };
    for (const who of ["nina", "theo"]) {
      const T0 = ctx.start, T1 = ctx.end;
      Loom.drive((e, raw) => {
        const want = faceAt[who](T0 + raw * (T1 - T0));
        for (const em of Object.keys(F[who])) F[who][em].style.visibility = em === want ? "visible" : "hidden";
      }, T0, Math.max(0.1, T1 - T0), "linear", { kind: "character", beat: ctx.beat.id, name: who, content: true });
    }
  },
});
