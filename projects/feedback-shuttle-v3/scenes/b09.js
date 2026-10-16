// @design sbi_parts_then_gap: the finished card gets its parts named on its own lines, one small heading writes in once, then the empty third slot pulses open as the one accent
/* Treatments considered:
 * (A) a static card with the three words printed and a highlight (rejected: nothing points at what is missing);
 * (B) a close-up of the card alone (rejected: loses the two people in the room);
 * (C) CHOSEN: hold the room from b08; small tags stick on line 1 then line 2, the heading fades up above the card,
 *     then slot 3 pulses open in the accent. Everything held stays; only the heading retires (b10 takes it off).
 * Layers: set < busts < clock < card. Held elements are claimed, hidden and redrawn under the same name
 * (the card keeps the storyboard's keep-list name "card7"). */
Loom.scene("b09", {
  build(ctx) {
    const { kit } = ctx;
    const L = Loom.lesson, A = L.meeting_room.anchors;
    const SIZE = 560, Y = 620;
    const tSit = ctx.cue("Situation, behaviour");
    const tStruct = ctx.cue("one known structure");
    const tAdd = ctx.cue("so add a step");
    const redo = (name, spec) => {
      const h = ctx.held(name);
      if (h && h.outer) Loom.set(h.outer, { opacity: 0 }, ctx.start);
      return ctx.el(name, spec);
    };

    // the room, as b08 left it
    const set = redo("set7", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
    L.meeting_room(ctx, set.inner, { layer: "all", state: "two_shot" });

    // the two people: Asha explaining; Ben thoughtful, back to neutral as the gap opens (b10 opens neutral)
    const asha = redo("asha7", { x: A.asha.x - SIZE / 2, y: Y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "none" });
    const ben = redo("ben7", { x: A.ben.x - SIZE / 2, y: Y - SIZE / 2, w: SIZE, h: SIZE, kind: "character", exit: "none" });
    kit.peep(asha.inner, "woman", "explaining", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: false, cloth: "cloth", skin: 2 });
    const fb = {};
    fb.explaining = kit.peep(ben.inner, "man", "explaining", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: true, cloth: "cloth2", skin: 1 });
    fb.neutral = kit.peep(ben.inner, "man", "neutral", { x: SIZE / 2, y: SIZE / 2, size: SIZE, flip: true, cloth: "cloth2", skin: 1 });
    const T0 = ctx.start, D = Math.max(0.1, ctx.end - T0);
    Loom.drive((e, raw) => {
      const want = (T0 + raw * D) >= tAdd ? "neutral" : "explaining";
      for (const k in fb) fb[k].style.visibility = k === want ? "visible" : "hidden";
    }, T0, D, "linear", { kind: "character", beat: ctx.beat.id, name: "ben7", content: true });

    // the clock, muted arc as before
    const clockE = redo("clock7", { x: A.clock.x, y: A.clock.y, w: 180, h: 180, kind: "instrument", exit: "none" });
    const clk = L.wall_clock(ctx, clockE.inner, { w: 180, muted: true });
    clk.setState("overrun_arc_muted", ctx.start, 0);

    // the card: lines 1 and 2 as built; tags land one by one, heading fades up, then slot 3 pulses open
    const card = redo("card7", { x: A.card.cx - 410, y: A.card.cy - 210, w: 820, h: 420, kind: "bubble", exit: "none" });
    const mc = L.message_card(ctx, card.inner, {});
    mc.setState("line2", ctx.start, 0);
    // tags state staggers Situation+Behaviour at 0, Impact at 0.25 D, heading at 0.5 D: heading lands on "one known structure"
    const dur = Math.max(2.4, 2 * (tStruct - tSit));
    mc.setState("tags", tSit, dur);
    mc.setState("slot3_open", tAdd, 1.2);
  },
});
