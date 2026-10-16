// @design empty_hands_flat_line: a warm feeling held in open hands beside an empty slot and a line that stays flat
Loom.scene("b02", {
  build(ctx, props) {
    const kit = ctx.kit;
    const R = (p, x, y, w, h, fill, stroke, r) => Loom.svg("rect", Object.assign({ x, y, width: w, height: h, rx: r || 0, fill: ctx.c(fill) }, stroke ? { stroke: ctx.c(stroke), "stroke-width": 4 } : {}), p);
    const S = ctx.el("stage_room", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    const room = ctx.scenery("room", "r2", { wall: "surface2", floorFill: "field2", floor: 0.8, window: false });
    S.inner.appendChild(room.E.outer);
    const floorY = room.floorY || 864;
    // projector screen with grey text lines
    R(S.inner, 1392, 94, 436, 22, "muted", null, 6);
    R(S.inner, 1400, 120, 420, 300, "surface", "ink", 6);
    for (let i = 0; i < 8; i++) R(S.inner, 1424, 156 + i * 30, i === 0 ? 200 : 300, 6, "muted", null, 3);
    // audience extras behind tables
    const rows = [{ feetY: 740, tableTop: 630, xs: [875, 1045] }, { feetY: 840, tableTop: 740, xs: [790, 960, 1130] }];
    rows.forEach((r, ri) => {
      const rg = Loom.svg("g", {}, S.inner);
      r.xs.forEach((cx, i) => ctx.crowd("r2_ex" + ri + i, { x: cx, y: r.feetY, w: 1, count: 1, rows: 1, scale: 0.34, tone: "muted", parent: rg }));
      R(S.inner, 700, r.tableTop, 560, 22, "muted", null, 6);
      R(S.inner, 712, r.tableTop + 22, 536, floorY + 36 - (r.tableTop + 22), "field2");
    });
    R(S.inner, -40, 780, 740, 26, "muted", null, 8);
    R(S.inner, -40, 806, 740, 300, "field2");
    const mayaSlot = Loom.svg("g", {}, S.inner);
    R(S.inner, 1200, 800, 200, 22, "muted", null, 6);
    R(S.inner, 1212, 822, 176, 120, "field2");
    const maya = ctx.character("Maya", "maya", { x: 1300, y: floorY + 6, scale: 0.3, skin: 0, top: "cloth", parent: mayaSlot, pose: "idle", emotion: "happy" });
    const s1 = 1.4, tx1 = 1400 - 1300 * s1, ty1 = 900 - 876 * s1;
    const tPush = ctx.cue("So what is she left holding");
    const apply = (e) => {
      const s = 1 + (s1 - 1) * e;
      S.inner.setAttribute("transform", "translate(" + (e * tx1) + " " + (e * ty1) + ") scale(" + s + ")");
    };
    apply(0);
    Loom.drive(apply, tPush, 0.8, "editorial", { kind: "reveal", beat: "b02", name: "push", content: true });
    maya.pose("present", tPush + 0.2, { dur: 0.5 });
    const HX = 1230, HY = 490;
    const B = ctx.el("natural_bubble", { x: HX - 104, y: HY - 40, w: 208, h: 80, kind: "bubble", exit: "recede" });
    Loom.lesson.natural_bubble(ctx, B.inner, { name: "nb2", state: "held", scale: 0.8, x: -52, y: -20 });
    const tHeart = ctx.cue("A kind feeling");
    Loom.set(B.outer, { opacity: 0 }, 0);
    Loom.set(B.outer, { opacity: 1 }, tHeart);
    const L1 = ctx.el("lbl_feeling", { x: HX - 330, y: HY - 190, w: 320, h: 140, kind: "card", exit: "recede" });
    R(L1.inner, 0, 0, 320, 70, "surface", "ink", 12);
    kit.text(L1.inner, "A kind feeling", { role: "label", x: 10, y: 4, w: 300, h: 62, maxLines: 1, align: "center", valign: "middle", color: "ink" });
    Loom.set(L1.outer, { opacity: 0 }, 0);
    Loom.set(L1.outer, { opacity: 1 }, tHeart + 0.2);
    const SL = ctx.el("empty_action_slot", { x: 300, y: 250, w: 520, h: 300, kind: "card", exit: "recede" });
    Loom.svg("rect", { x: 8, y: 8, width: 504, height: 284, rx: 14, fill: ctx.c("surface"), "fill-opacity": 0.4, stroke: ctx.c("ink"), "stroke-width": 5, "stroke-dasharray": "18 12", "stroke-linecap": "round" }, SL.inner);
    kit.text(SL.inner, "Nothing to repeat", { role: "label", x: 30, y: 100, w: 460, h: 100, maxLines: 1, align: "center", valign: "middle", color: "ink" });
    const tSlot = ctx.cue("nothing to repeat");
    Loom.set(SL.outer, { opacity: 0 }, 0);
    Loom.set(SL.outer, { opacity: 1 }, tSlot);
    const tSlip = ctx.cue("Here is where people slip");
    maya.emotion("neutral", tSlip);
    const C = ctx.el("nod_vs_change_card", { x: 300, y: 620, w: 620, h: 190, kind: "card", exit: "recede" });
    R(C.inner, 0, 0, 620, 190, "surface", "ink", 12);
    kit.text(C.inner, "Warm nod", { role: "label", x: 24, y: 20, w: 240, h: 60, maxLines: 1, align: "left", valign: "middle", color: "ink" });
    kit.text(C.inner, "Change", { role: "label", x: 24, y: 110, w: 200, h: 56, maxLines: 1, align: "left", valign: "middle", color: "muted" });
    Loom.svg("line", { x1: 240, y1: 140, x2: 590, y2: 140, stroke: ctx.c("ink"), "stroke-width": 5, "stroke-linecap": "round" }, C.inner);
    const tCard = ctx.cue("A warm nod is not change");
    Loom.set(C.outer, { opacity: 0 }, 0);
    Loom.set(C.outer, { opacity: 1 }, tCard);
  },
});
