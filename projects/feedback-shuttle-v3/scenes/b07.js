Loom.scene("b07", {
  build(ctx) {
    const { kit, m } = ctx;
    const L = Loom.lesson;
    const A = L.meeting_room.anchors;
    const SIZE = 560, Y = 620;
    const T0 = ctx.start, D = Math.max(0.1, ctx.end - ctx.start);
    let tNow = ctx.cue("Now rebuild it");
    if (!Number.isFinite(tNow)) tNow = T0 + 0.5;
    let tSit = ctx.cue("The situation and what you saw");
    if (!Number.isFinite(tSit)) tSit = T0 + 3.6;
    let tTue = ctx.cue("Tuesday's meeting");
    if (!Number.isFinite(tTue)) tTue = T0 + 6.5;
    let tOver = ctx.cue("twenty minutes over");
    if (!Number.isFinite(tOver)) tOver = T0 + 8.2;
    const set = ctx.el("set7", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
    L.meeting_room(ctx, set.inner, { layer: "all", state: "two_shot" });
    m.reveal(set, T0 + 0.02, { dy: 0 });
    const clock = ctx.el("clock7", { x: A.clock.x, y: A.clock.y, w: 180, h: 180, kind: "instrument", exit: "none" });
    const clk = L.wall_clock(ctx, clock.inner, { w: 180, muted: true });
    clk.setState("overrun_arc_muted", T0, 0);
    m.settle(clock, T0 + 0.1, { dy: 0 });
    const asha = ctx.el("asha7", { x: 380 - SIZE / 2, y: Y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "none" });
    const ben = ctx.el("ben7", { x: 1540 - SIZE / 2, y: Y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "none" });
    const fa = {}, fb = {};
    for (const em of ["happy", "explaining"]) fa[em] = kit.peep(asha.inner, "woman", em, { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: false, cloth: "cloth", skin: 2 });
    for (const em of ["happy", "surprised"]) fb[em] = kit.peep(ben.inner, "man", em, { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: true, cloth: "cloth2", skin: 1 });
    m.reveal(asha, T0 + 0.1, { dy: 0 });
    m.reveal(ben, T0 + 0.2, { dy: 0 });
    Loom.drive((e, raw) => {
      const t = T0 + raw * D, want = t >= tSit ? "explaining" : "happy";
      for (const k in fa) fa[k].style.visibility = k === want ? "visible" : "hidden";
    }, T0, D, "linear", { kind: "character", beat: ctx.beat.id, name: "asha7", content: true });
    Loom.drive((e, raw) => {
      const t = T0 + raw * D, want = t >= tOver ? "surprised" : "happy";
      for (const k in fb) fb[k].style.visibility = k === want ? "visible" : "hidden";
    }, T0, D, "linear", { kind: "character", beat: ctx.beat.id, name: "ben7", content: true });
    const card = ctx.el("card7", { x: A.card.cx - 410, y: A.card.cy - 210, w: 820, h: 420, kind: "bubble", exit: "none" });
    const mc = L.message_card(ctx, card.inner, {});
    m.reveal(card, T0 + 0.15, { dy: 0 });
    mc.setState("card", tNow, 0.9);
    mc.setState("line1", tTue, 1.6);
  },
});
