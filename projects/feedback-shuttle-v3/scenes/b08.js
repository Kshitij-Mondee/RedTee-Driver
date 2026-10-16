// @design impact_lands_late: the second fact settles in slowly while two people behind the table hurry out late; the listener's face turns from shock to thought
/* Treatments considered:
 * (A) a static two-shot with line 2 simply there and a highlight (rejected: the impact has no cause, nobody is affected);
 * (B) a close-up of the card alone (rejected: loses the room and the people who were affected);
 * (C) CHOSEN: hold the room, the clock and both people from b07; line 1 settles, slot 2 pulses, two muted colleagues
 *     hurry out behind the table, line 2 writes in slowly as the one accent, Ben turns from surprised to thoughtful.
 * Layers: set (table included) < extras_late (+ a copy of the table front on top) < busts < clock < card.
 * The card is held from b07 under its own name "card7" (the storyboard's keep list name). Each held element is taken and redrawn identically under the same name. */
Loom.scene("b08", {
  build(ctx) {
    const { kit, m } = ctx;
    const L = Loom.lesson, A = L.meeting_room.anchors;
    const SIZE = 560, Y = 620;
    const tImpact = ctx.cue("Then the impact");
    const tMissed = ctx.cue("Two people missed");
    const tCall = ctx.cue("their next call");
    const redo = (name, spec) => {
      const h = ctx.held(name);
      if (h && h.outer) Loom.set(h.outer, { opacity: 0 }, ctx.start);
      return ctx.el(name, spec);
    };

    const set = redo("set7", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
    L.meeting_room(ctx, set.inner, { layer: "all", state: "two_shot" });

    const extras = ctx.el("extras_late", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    const eg = Loom.svg("g", {}, extras.inner);
    const exA = ctx.character("extra_left", "extra", { x: 800, y: 1050, scale: 0.7, parent: eg });
    const exB = ctx.character("extra_right", "extra", { x: 1120, y: 1050, scale: 0.7, parent: eg });
    L.meeting_room(ctx, extras.inner, { layer: "front", state: "two_shot" });
    m.reveal(extras, tMissed - 0.05, { dy: 0 });
    exB.walk(tMissed + 0.1, tMissed + 1.9, 1000, 8);
    exA.walk(tMissed + 0.35, tMissed + 2.3, 1300, 8);

    const asha = redo("asha7", { x: A.asha.x - SIZE / 2, y: Y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "none" });
    const ben = redo("ben7", { x: A.ben.x - SIZE / 2, y: Y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "none" });
    kit.peep(asha.inner, "woman", "explaining", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: false, cloth: "cloth", skin: 2 });
    const fb = {};
    fb.surprised = kit.peep(ben.inner, "man", "surprised", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: true, cloth: "cloth2", skin: 1 });
    fb.explaining = kit.peep(ben.inner, "man", "explaining", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: true, cloth: "cloth2", skin: 1 });
    const T0 = ctx.start, T1 = ctx.end, D = Math.max(0.1, T1 - T0);
    Loom.drive((e, raw) => {
      const want = (T0 + raw * D) >= tCall ? "explaining" : "surprised";
      for (const k in fb) fb[k].style.visibility = k === want ? "visible" : "hidden";
    }, T0, D, "linear", { kind: "character", beat: ctx.beat.id, name: "ben7", content: true });

    const clockE = redo("clock7", { x: A.clock.x, y: A.clock.y, w: 180, h: 180, kind: "instrument", exit: "none" });
    const clk = L.wall_clock(ctx, clockE.inner, { w: 180, muted: true });
    clk.setState("overrun_arc_muted", ctx.start, 0);

    const card = redo("card7", { x: A.card.cx - 410, y: A.card.cy - 210, w: 820, h: 420, kind: "bubble", exit: "none" });
    const mc = L.message_card(ctx, card.inner, {});
    mc.setState("line1", ctx.start, 0);
    const ring = Loom.svg("rect", { x: 28, y: 158, width: 764, height: 104, rx: 10, fill: "none", stroke: ctx.c("ink"), "stroke-width": 5, "stroke-dasharray": "14 10", "stroke-linecap": "round", opacity: 0 }, card.inner);
    Loom.drive((e, raw) => {
      const f = raw * 2 - Math.floor(raw * 2), pr = Math.sin(Math.PI * f);
      ring.setAttribute("opacity", (0.9 * pr).toFixed(3));
      ring.setAttribute("x", (28 - 12 * f).toFixed(2)); ring.setAttribute("y", (158 - 12 * f).toFixed(2));
      ring.setAttribute("width", (764 + 24 * f).toFixed(2)); ring.setAttribute("height", (104 + 24 * f).toFixed(2));
    }, tImpact + 0.5, 1.6, "linear", { key: "b08ring" });
    mc.setState("line2", tMissed, 2.3);
  },
});
