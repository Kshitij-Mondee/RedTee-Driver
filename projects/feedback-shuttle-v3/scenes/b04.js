// @design emptied_nod_two_shot: the same easy moment returns frozen; the friendly line loses its words and is left an empty outline, and a small tag names what the nod was
/* Treatments considered:
 * (A) a static two-shot with the empty bubble and the tag already placed (rejected: the emptying is the argument);
 * (B) a close-up of the bubble only (rejected: loses the two people and the nod that the lesson returns to);
 * (C) CHOSEN: the b01 room held frozen, Ben dips once with the tag drop, the bubble lifts its words and dashes
 *     hollow, one pulse on "what to repeat", a slow push toward the bubble. The card is the one accent.
 * Layers (as b01): set (whole room) < clock < busts < card < tag. The set, clock and busts continue into b05.
 * The bubble element is named "card_b04": the plain name "card" is used by the message card of b07 to b10. */
Loom.scene("b04", {
  build(ctx) {
    const { kit, m } = ctx;
    const L = Loom.lesson;
    const A = L.meeting_room.anchors;
    const SIZE = 560, Y = 620;
    const tNod = ctx.cue("A nod");
    const tGen = ctx.cue("General feedback");
    const tRep = ctx.cue("what to repeat");

    // 1. the set and the clock (continue into b05)
    const set = ctx.el("set", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
    L.meeting_room(ctx, set.inner, { layer: "all", state: "two_shot" });
    m.reveal(set, ctx.start + 0.02, { dy: 0 });

    const clock = ctx.el("clock", { x: A.clock.x, y: A.clock.y, w: 180, h: 180, kind: "instrument", exit: "none" });
    const clk = L.wall_clock(ctx, clock.inner, { w: 180, state: "on_time" });
    clk.setState("on_time", ctx.start, 0);
    m.reveal(clock, ctx.start + 0.05, { dy: 0 });

    // 2. the two people, happy, as in b01 (the table edge hides their bases)
    const asha = ctx.el("asha", { x: A.asha.x - SIZE / 2, y: Y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "none" });
    const ben = ctx.el("ben", { x: A.ben.x - SIZE / 2, y: Y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "none" });
    kit.peep(asha.inner, "woman", "happy", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: false, cloth: "cloth", skin: 2 });
    kit.peep(ben.inner, "man", "happy", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: true, cloth: "cloth2", skin: 1 });
    m.reveal(asha, ctx.start + 0.08, { dy: 0 });
    m.reveal(ben, ctx.start + 0.1, { dy: 0 });

    // 3. Ben's last small nod, on "A nod": the head dips once, the base stays on the table edge
    Loom.drive((e, raw) => {
      const s = 1 - 0.04 * Math.sin(raw * Math.PI);
      ben.inner.setAttribute("transform", "translate(0 " + SIZE + ") scale(1 " + s.toFixed(4) + ") translate(0 " + (-SIZE) + ")");
    }, tNod, 0.6, "linear", { key: "b04nod", kind: "character", beat: ctx.beat.id, name: "ben", content: true });

    // 4. the bubble: words lift off, the outline goes dashed and hollow, one pulse; a slow push toward it
    const card = ctx.el("card_b04", { x: A.card.cx - 410, y: A.card.cy - 210, w: 820, h: 420, kind: "bubble", exit: "recede" });
    const wrap = Loom.svg("g", {}, card.inner);
    const mc = L.message_card(ctx, wrap, {});
    mc.setState("vague", ctx.start, 0);
    m.reveal(card, ctx.start + 0.15, { dy: 0 });
    mc.setState("empty", tGen, 0.9);
    const T0 = ctx.start, T1 = ctx.end, DUR = Math.max(0.1, T1 - T0);
    Loom.drive((e, raw) => {
      const t = T0 + raw * DUR;
      const p = Math.min(1, Math.max(0, (t - T0) / DUR));
      const push = 1 + 0.12 * (p * p * (3 - 2 * p));
      const q = Math.min(1, Math.max(0, (t - tRep) / 0.6));
      const pulse = 1 + 0.05 * Math.sin(q * Math.PI);
      const s = push * pulse;
      wrap.setAttribute("transform", "translate(410 210) scale(" + s.toFixed(4) + ") translate(-410 -210)");
    }, T0, DUR, "linear", { key: "b04push", kind: "bubble", beat: ctx.beat.id, name: "card_b04", content: true });

    // 5. the paper tag drops under Ben on "A nod", resting on the table edge below his chin
    const tag = ctx.el("nod_tag", { x: A.ben.x - 170, y: 768, w: 340, h: 128, kind: "card", exit: "recede" });
    const lt = L.label_tag(ctx, tag.inner, { w: 340, text: "A nod is not a change" });
    m.drop(tag, tNod, { dy: -160 });
    lt.setState("stuck", tNod + 0.5, 0.4);
  },
});
