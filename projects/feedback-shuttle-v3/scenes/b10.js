// @design second_nod_with_plan: the same room; a third line fills the open slot, a paper plan slides onto the table, its boxes fill row by row, the listener nods and a tick lands
/* Held elements are never wiped: a held element is the previous beats' drawing too (wiping it at build time put this
 * beat's first frame inside b07 for b07's whole life). Each held element is hidden from this beat's start and redrawn
 * fresh under the same name. */
Loom.scene("b10", {
  build(ctx) {
    const { kit, m } = ctx;
    const L = Loom.lesson, R = L.meeting_room.anchors;
    const SIZE = 560;
    const tAgreed = ctx.cue("agreed together");
    const tTry = ctx.cue("Could we try");
    const tAgenda = ctx.cue("a timed agenda");
    const tGoals = ctx.cue("Specific goals");
    const tBest = ctx.cue("do your best");
    const redo = (name, spec) => {
      const h = ctx.held(name);
      if (h && h.outer) Loom.set(h.outer, { opacity: 0 }, ctx.start);
      return ctx.el(name, spec);
    };

    const set = redo("set7", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    L.meeting_room(ctx, set.inner, { layer: "all", state: "two_shot" });

    const clockE = redo("clock7", { x: R.clock.x, y: R.clock.y, w: 180, h: 180, kind: "instrument", exit: "recede" });
    const clk = L.wall_clock(ctx, clockE.inner, { w: 180, muted: true });
    clk.setState("overrun_arc_muted", ctx.start, 0);

    const asha = redo("asha7", { x: R.asha.x - SIZE / 2, y: R.asha.y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "recede" });
    const ben = redo("ben7", { x: R.ben.x - SIZE / 2, y: R.ben.y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "recede" });
    const fa = {}, fb = {};
    for (const em of ["explaining", "happy"]) fa[em] = kit.peep(asha.inner, "woman", em, { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: false, cloth: "cloth", skin: 2 });
    for (const em of ["neutral", "surprised", "happy"]) fb[em] = kit.peep(ben.inner, "man", em, { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: true, cloth: "cloth2", skin: 1 });
    const T0 = ctx.start, T1 = ctx.end, D = Math.max(0.1, T1 - T0);
    const drv = (name, F, fn) => Loom.drive((e, raw) => {
      const want = fn(T0 + raw * D);
      for (const k in F) F[k].style.visibility = k === want ? "visible" : "hidden";
    }, T0, D, "linear", { kind: "character", beat: ctx.beat.id, name, content: true });
    drv("asha7", fa, (t) => (t >= tGoals ? "happy" : "explaining"));
    drv("ben7", fb, (t) => (t >= tGoals ? "happy" : t >= tAgreed ? "surprised" : "neutral"));

    Loom.drive((e, raw) => {
      const s = 1 - 0.04 * Math.abs(Math.sin(raw * Math.PI * 2));
      ben.inner.setAttribute("transform", "translate(0 " + SIZE + ") scale(1 " + s.toFixed(4) + ") translate(0 " + (-SIZE) + ")");
    }, tGoals + 0.05, 0.9, "linear", { key: "b10nod", kind: "character", beat: ctx.beat.id, name: "ben7", content: true });

    const card = redo("card7", { x: R.card.cx - 410, y: R.card.cy - 210, w: 820, h: 420, kind: "bubble", exit: "recede" });
    const mc = L.message_card(ctx, card.inner, {});
    mc.setState("slot3_open", ctx.start, 0);
    mc.setState("line3", tTry, 1.2);
    mc.setState("agreed", tBest, 0.7);

    const AW = 260, AH = 217;
    const agenda = ctx.el("agenda", { x: 1060, y: 692, w: AW, h: AH, kind: "card", exit: "recede" });
    const ag = L.timed_agenda(ctx, agenda.inner, { w: AW, state: "blank" });
    m.settle(agenda, tAgenda, { dx: 300, dy: 0 });
    ag.setState("filling", tAgenda + 0.6, 1.8);
  },
});
