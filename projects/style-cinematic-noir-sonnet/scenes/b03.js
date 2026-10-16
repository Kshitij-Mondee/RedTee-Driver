// @design one_key_two_locks: a lit wall with two doors side by side and one small bright object that is shown fitting both of them in turn
/* Treatments considered: (1) static pair of doors with the card between them, signalled by glow only; (2) the card
 * travels to each lock, the lock turns, the card withdraws (chosen: one object fitting two locks IS the reuse);
 * (3) a caption card saying "same password" (rejected: the picture says it, no words needed). */
Loom.scene("b03", {
  build(ctx) {
    const { kit, m } = ctx;
    const c = (t) => ctx.c(t);
    const svg = (tag, a, p) => Loom.svg(tag, a, p);
    const mix = (a, b, k) => Loom.style.mix(c(a), c(b), k);

    // ---- the wall of doors (scenery): a lit wall at dusk, floor, one key-light pool between the doors
    const WALL = ctx.el("door_wall", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
    const gid = Loom.uid("b03w"), defs = svg("defs", {}, WALL.inner);
    const rg = svg("radialGradient", { id: gid, cx: "50%", cy: "50%", r: "50%" }, defs);
    svg("stop", { offset: "0", "stop-color": c("ink"), "stop-opacity": 0.2 }, rg);
    svg("stop", { offset: "1", "stop-color": c("ink"), "stop-opacity": 0 }, rg);
    const lg = svg("linearGradient", { id: gid + "c", x1: "0", y1: "0", x2: "0", y2: "1" }, defs);
    svg("stop", { offset: "0", "stop-color": c("ink"), "stop-opacity": 0.13 }, lg);
    svg("stop", { offset: "1", "stop-color": c("ink"), "stop-opacity": 0 }, lg);
    svg("rect", { x: -40, y: -40, width: 2000, height: 800, fill: mix("field2", "surface2", 0.55) }, WALL.inner);
    svg("rect", { x: -40, y: 752, width: 2000, height: 400, fill: mix("field", "surface2", 0.35) }, WALL.inner);
    svg("rect", { x: -40, y: 746, width: 2000, height: 6, fill: c("line"), opacity: 0.5 }, WALL.inner);
    // @form key_light_cone: one warm light from above, the only source in the room
    svg("path", { d: "M900 -40 L1020 -40 L1330 752 L590 752 Z", fill: `url(#${gid}c)` }, WALL.inner);
    const pool = svg("ellipse", { cx: 960, cy: 770, rx: 560, ry: 70, fill: `url(#${gid})` }, WALL.inner);
    const halo = svg("ellipse", { cx: 960, cy: 520, rx: 420, ry: 300, fill: `url(#${gid})`, opacity: 0.8 }, WALL.inner);
    m.drift(WALL, ctx.start, ctx.end, { amp: 3, period: 6 });

    // ---- the two doors, side by side, centred: Shop and Work
    const DW = 360, DY = 250, XS = 500, XW = 1060;
    // @form door_pair: two separate systems, two doors with name plates
    const DS = ctx.el("door_shop", { x: XS, y: DY, w: DW, h: 558, kind: "instrument", exit: "none" });
    const shop = Loom.lesson.door(ctx, DS.inner, { x: 0, y: 0, w: DW, name: "Shop", state: "shut" });
    const DK = ctx.el("door_work", { x: XW, y: DY, w: DW, h: 558, kind: "instrument", exit: "none" });
    const work = Loom.lesson.door(ctx, DK.inner, { x: 0, y: 0, w: DW, name: "Work", state: "shut" });

    // ---- the kicker, top left, outside the stage art
    const RT = ctx.el("rewind_tag", { x: 96, y: 96, w: 460, h: 60, kind: "text", exit: "wipe" });
    kit.kicker(RT.inner, "Months ago", { role: "label", x: 0, y: 0, w: 460, h: 60, color: "accent4", align: "left", valign: "middle" });
    m.unmask(RT, ctx.cue("Months ago"), { dir: "ltr" });

    // ---- the card: appears between the doors, fits each lock in turn, comes back
    const CX = 960, CY = DY + shop.lockAt.y;       // rest centre, level with the locks
    const KC = ctx.el("keycard", { x: CX - 110, y: CY - 70, w: 220, h: 140, kind: "token", exit: "none" });
    const cg = svg("g", {}, KC.inner);
    Loom.lesson.keycard(ctx, cg, { x: 0, y: 0, w: 220, state: "lit", seed: "dana" });
    const REST = 0.8, NEAR = 0.3, SLOT = 34;
    const tIn = ctx.cue("used one password twice");
    const tShop = ctx.cue("Once on a shopping site"), tWork = ctx.cue("Once at work");
    const T1 = 0.7, TURN1 = 0.5, T2 = 0.62, TURN2 = 0.5;
    const lockS = { x: XS + shop.lockAt.x - SLOT, y: DY + shop.lockAt.y };
    const lockW = { x: XW + work.lockAt.x - SLOT, y: DY + work.lockAt.y };
    m.settle(KC, tIn);
    // the card's size and visibility, one pure function of time (no competing tweens)
    const ss = (a) => { a = Math.max(0, Math.min(1, a)); return a * a * (3 - 2 * a); };
    const segs = [
      { a: tShop, b: tShop + T1, s0: REST, s1: NEAR },
      { a: tShop + T1 + TURN1, b: tShop + 2 * T1 + TURN1, s0: NEAR, s1: REST },
      { a: tWork, b: tWork + T2, s0: REST, s1: NEAR },
      { a: tWork + T2 + TURN2, b: ctx.end, s0: NEAR, s1: REST },
    ];
    const hid = [[tShop + T1, tShop + T1 + TURN1], [tWork + T2, tWork + T2 + TURN2]];
    const pose = (tt) => {
      let s = REST, v = 1;
      segs.forEach((g) => { if (tt >= g.a) s = g.s0 + (g.s1 - g.s0) * ss((tt - g.a) / (g.b - g.a)); });
      hid.forEach((h) => { if (tt >= h[0] && tt < h[1]) v = 0; });
      cg.setAttribute("transform", `translate(110 70) scale(${s}) translate(-110 -70)`);
      cg.setAttribute("opacity", v);
    };
    pose(ctx.start);
    Loom.drive((e, raw) => pose(ctx.start + raw * (ctx.end - ctx.start)), ctx.start, ctx.end - ctx.start, "linear");
    // position: travel to each lock (the card's own box moves; deltas from its rest box)
    const mv = (t, p, dur) => m.travel(KC, t, { x: p.x - CX, y: p.y - CY, scale: 1, dur });
    mv(tShop, lockS, T1);
    mv(tShop + T1 + TURN1, { x: CX, y: CY }, T1);
    mv(tWork, lockW, T2);
    mv(tWork + T2 + TURN2, { x: CX, y: CY }, ctx.end - (tWork + T2 + TURN2));
    // the lock turns while the card is in the slot (the state lives on the door, driven from here)
    shop.setState("turning", tShop + T1);
    shop.setState("shut", tShop + T1 + TURN1);
    work.setState("turning", tWork + T2);
    work.setState("shut", tWork + T2 + TURN2);
  },
});
