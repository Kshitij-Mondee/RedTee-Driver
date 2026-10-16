// @design afterwards_talk: the room empties, two people talk, the agreed marker lands, the nod now means something
/* Treatments: (A) static pair + marker (signalled only), (B) CHOSEN: extras leave, pair talk, marker drops, springy nod,
 * (C) split compare with b03 (rejected: no new facts). Motion is content: the nod echoes b03 with new meaning.
 */
Loom.scene("b52", {
  build(ctx) {
    const { kit, m } = ctx;
    const room = ctx.scenery("room", "room_set", {});
    const fy = room.floorY || 800;

    const priya = ctx.character("priya", "tess", { x: 800, y: fy + 40, scale: 1.5, flip: false });
    const dev = ctx.character("dev", "pip", { x: 1120, y: fy + 40, scale: 1.5, flip: true });

    // extras who leave
    const e1 = ctx.character("extra_1", "extra", { x: 560, y: fy + 20, scale: 1.3 });
    const e2 = ctx.character("extra_2", "extra", { x: 1400, y: fy + 20, scale: 1.3, flip: true });
    const tEmpty = ctx.cue("Afterwards");
    e1.walk(tEmpty, tEmpty + 1.4, -700, 5);
    e2.walk(tEmpty, tEmpty + 1.4, 700, 5);
    priya.look(0.6, 0, tEmpty + 0.6);
    dev.look(-0.6, 0, tEmpty + 0.6);

    // the talk
    const tTalk = ctx.cue("they talk");
    priya.pose("explain", tTalk, { dur: 0.4 });
    priya.talk(tTalk, tTalk + 1.0);
    dev.gesture("beat", tTalk + 0.6, tTalk + 1.2);
    dev.emotion("focused", tTalk);

    // the talk-after marker drops in beside them
    const tAgreed = ctx.cue("as agreed");
    const cal = Loom.obj.draw(ctx, "talk_after_marker", "calendar", { x: 960, y: 330, size: 190, tone: "accent", family: "wall", state: { mark: 1 }, t: tAgreed });
    if (cal && cal.mover) m.pop(cal, tAgreed, { overshoot: false });

    // the nod with something behind it
    const tNod = ctx.cue("the nod has something behind it");
    dev.emotion("happy", tNod);
    dev.gesture("nod", tNod, tNod + 0.9);
    priya.emotion("happy", tNod + 0.2);
  },
});
