// @design held_place_time_passes: the held room while one object shows time passing and another marks the day that stays the same
/* b20 - soon doesn't mean instantly. The room is held exactly as b19 left it (nothing re-enters). The wall clock's
 * hands run on steadily by a couple of hours, still the same afternoon, while a small desk calendar on the table keeps
 * today marked. Maya and the report only breathe. Held by name: room, maya, report, update, card, clock.
 * Treatments considered: (A) a stopwatch counting up (rejected: soon is a gap in the day, not a stopwatch),
 * (B) a hourglass (rejected: not a thing in this room), (C) CHOSEN: the clock that is already on the wall runs forward
 * and the day on the desk calendar does not change.
 */
Loom.scene("b20", {
  build(ctx) {
    const { m } = ctx;
    const S = Loom.style, O = Loom.obj, D = Loom.data, svg = Loom.svg;
    const bid = ctx.beat.id;
    const room = ctx.held("room"), maya = ctx.held("maya"), clk = ctx.held("clock");
    ctx.held("report"); ctx.held("update"); ctx.held("card");
    const mid = room.layers.mid.g;

    // the clock's hands run on from where b19 left them: two hours of the afternoon, steady, not fast
    const tSweep = ctx.cue("doesn't mean instantly");
    const H0 = clk.object.hands, rot = (n, a) => n.setAttribute("transform", `rotate(${a.toFixed(2)} ${H0.cx} ${H0.cy})`);
    Loom.drive((e) => { rot(H0.minute, H0.ma + 360 * 2 * e); rot(H0.hour, H0.ha + 30 * 2 * e); }, tSweep, 3.6, "linear", { kind: "ambient", beat: bid, name: "clock.runs_on", content: true });

    // the desk calendar on the table: it is new to the frame, so it settles in with the clock's first move
    // @form desk_calendar_day_mark: a small desk calendar with today marked by a disc, the day that does not change
    const today = O.draw(ctx, "today", "calendar", { x: 640, y: 858, size: 124, family: "desk", detail: 2, key: "cal_desk_room", parent: mid, shadow: true });
    m.settle(today, tSweep - 0.1, { dy: 12 });
    const mk = svg("circle", { cx: 0.9 * 124, cy: 0.9 * 124 + 0.084 * 124, r: 0.09 * 124, fill: S.c("accent2") }, today.inner);
    Loom.tween(mk, { opacity: 0, scale: 0.3, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: ctx.style.dur("enter") * 0.8, ease: Loom.ease.overshoot || "back.out" }, tSweep + 0.5, { kind: "pop", beat: bid, name: "today.mark", content: true });

    // the words that name the calendar wipe in when the day is spoken about
    const tagRem = D.tag(ctx, "tag_remember", { x: 420, y: 918, text: "While you both remember it", color: "accent4", t: ctx.cue("while you both remember it") });
    mid.appendChild(tagRem.outer);

    // Maya nods once as the second phrase lands; the actors' own clocks keep breathing and blinking
    const actor = maya.actor;
    actor.gesture("nod", ctx.cue("It means while you both remember it"), ctx.cue("It means while you both remember it") + 1.0);
  },
});
