// @design own_seat_push: an empty everyday desk where the same kind, empty comment lands, and a slow push brings the viewer into the seat
/* Treatments considered: (A) a static desk with the chat line and a caption (rejected: a static slide);
 * (B) the chat line as a big card over a blurred desk (rejected: loses the "your own desk" place);
 * (C) CHOSEN: the desk fully drawn from t=0 (it is a cut from b02), the chat line pops on the monitor on the first
 * phrase, and the whole desk group pushes in about the monitor over the second phrase. No people; the chair stays empty. */
Loom.scene("b03", {
  build(ctx) {
    const tPop = ctx.cue("You have probably been Theo");
    const tPush = ctx.cue("Kind words");

    const deskEl = ctx.el("desk_set", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    // the push group: scales about the monitor centre; the kit desk lives inside it
    const push = Loom.svg("g", {}, deskEl.inner);
    const desk = Loom.lesson.viewer_desk(ctx, push, {});

    // the chat message (the accent) pops on the first phrase
    desk.setState("chat", tPop);

    // the slow push: a tiny settle from the start, then the real push on "Kind words"
    const T0 = ctx.start, T1 = ctx.end, CX = 620, CY = 300;
    const sm = (v) => { v = Math.max(0, Math.min(1, v)); return v * v * (3 - 2 * v); };
    const num = (v) => Math.round(v * 1000) / 1000;
    const scaleAt = (t) => 1 + 0.02 * sm((t - T0) / Math.max(0.1, tPush - T0)) + 0.10 * sm((t - tPush) / Math.max(0.1, T1 - tPush));
    Loom.drive((e, raw) => {
      const s = scaleAt(T0 + raw * (T1 - T0));
      push.setAttribute("transform", "translate(" + CX + " " + CY + ") scale(" + num(s) + ") translate(" + (-CX) + " " + (-CY) + ")");
    }, T0, Math.max(0.1, T1 - T0), "linear", { key: "b03.push" });
  },
});
