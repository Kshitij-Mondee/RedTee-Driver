// @design lock_turns_door_opens: a push in on one door as a lit card turns its lock and a hard wedge of light spills across the floor, one tag naming the cause
/* Three treatments considered: (a) static wall with a tag only (no consequence shown); (b) a glow bloom around the door
 * (soft, reads as decoration); (c) chosen: slow push, card into the lock, door cracks, hard-edged light wedge on the floor,
 * a neg tag leads to the card. Held names are built here because the previous beat left nothing to take. */
Loom.scene("b06", {
  build(ctx) {
    const { kit, m } = ctx;
    const c = (t) => ctx.c(t);
    const svg = (tag, a, p) => Loom.svg(tag, a, p);
    const mix = (a, b, k) => Loom.style.mix(c(a), c(b), k);
    const bid = ctx.beat.id;

    // geometry in wall coordinates; the camera push ends so the crack sits in the station rect of b07
    const DX = 1000, DY = 138, DW = 360, DS = DW / 400;
    const cam = { x: 211, y: 100, w: 1477, h: 831, k: 1477 ? 1920 / 1477 : 1 };
    const toScreen = (p) => ({ x: (p.x - cam.x) * cam.k, y: (p.y - cam.y) * cam.k });

    // ---- door_wall: dark wall, floor, faint seams
    const wall = ctx.el("door_wall", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    svg("rect", { x: 0, y: 0, width: 1920, height: 1080, fill: c("field") }, wall.inner);
    for (let x = 120; x < 1920; x += 260) svg("rect", { x, y: 0, width: 3, height: 700, fill: c("line"), opacity: 0.35 }, wall.inner);
    svg("rect", { x: 0, y: 696, width: 1920, height: 384, fill: mix("field2", "surface", 0.18) }, wall.inner);
    svg("rect", { x: 0, y: 696, width: 1920, height: 3, fill: c("ink"), opacity: 0.12 }, wall.inner);
    for (let i = 1; i < 5; i++) svg("rect", { x: 0, y: 696 + i * i * 22, width: 1920, height: 2, fill: c("line"), opacity: 0.3 }, wall.inner);

    // ---- card_stream: copy cards queued at rest, all refused
    const stream = ctx.el("card_stream", { parent: wall.inner, x: 100, y: 400, w: 700, h: 100, kind: "token", exit: "recede" });
    for (let i = 0; i < 4; i++) {
      Loom.lesson.keycard(ctx, stream.inner, { x: i * 170, y: 14 + (i % 2) * 6, w: 120, state: "copy", seed: "dana", rotation: i % 2 ? 3 : -3 });
    }

    // ---- door_work
    const work = ctx.el("door_work", { parent: wall.inner, x: DX, y: DY, w: DW, h: 620 * DS, kind: "scenery", exit: "recede" });
    const door = Loom.lesson.door(ctx, work.inner, { w: DW, name: "Work", state: "shut" });

    // ---- spill: a hard wedge of ink light on the floor, continuing the door's own wedge
    const spill = ctx.el("spill", { parent: wall.inner, x: 0, y: 696, w: 1920, h: 384, kind: "scenery", exit: "recede" });
    svg("polygon", { points: "1146,0 1311,0 1380,384 560,384", fill: c("ink"), opacity: 0.2 }, spill.inner);
    svg("polygon", { points: "1230,0 1311,0 1340,384 900,384", fill: c("ink"), opacity: 0.22 }, spill.inner);
    svg("polygon", { points: "1286,-58 1317,-58 1311,0 1146,0", fill: c("ink"), opacity: 0 }, spill.inner);

    // ---- keycard: Dana's lit card, at rest left of the door
    const slotX = DX + door.lockAt.x, slotY = DY + door.lockAt.y;
    const KW = 132, KH = 84;
    const rest = { x: 800, y: 396 }, atLock = { x: slotX - 64 * DS * 0 - 40 - KW, y: slotY - KH / 2 }, back = { x: 860, y: slotY - KH / 2 };
    const card = ctx.el("keycard", { parent: wall.inner, x: rest.x, y: rest.y, w: KW, h: KH, kind: "token", exit: "recede" });
    Loom.lesson.keycard(ctx, card.inner, { w: KW, state: "lit", seed: "dana", rotation: -4 });

    // ---- timings
    const c1 = ctx.cue("one reason"), c2 = ctx.cue("password was reused"), c3 = ctx.cue("reused");
    const meta = (name) => ({ kind: "reveal", beat: bid, name, content: true });

    // slow dolly push over the whole beat
    Loom.cam.frame(wall, { x: cam.x, y: cam.y, w: cam.w, h: cam.h }, ctx.start, Math.max(2.6, c2 + 0.9 - ctx.start), { margin: 0 });

    // one reason: the card goes into the slot and the lock turns
    const tIn = Math.min(0.6, Math.max(0.3, (c2 - c1) - 0.3));
    m.travel(card, c1, { x: atLock.x - rest.x, y: atLock.y - rest.y, scale: 1 });
    door.setState("turning", c1 + tIn);
    Loom.tween(card.inner, { opacity: 1 }, { opacity: 0, duration: 0.15 }, c1 + tIn, meta("card_in_slot"));

    // password was reused: the door cracks, the wedge of light falls on the floor, the card withdraws
    door.setState("cracked", c2);
    m.unmask(spill, c2, { dir: "ttb" });
    const bk = ctx.el("keycard_back", { parent: wall.inner, x: atLock.x, y: atLock.y, w: KW, h: KH, kind: "token", exit: "recede" });
    Loom.lesson.keycard(ctx, bk.inner, { w: KW, state: "lit", seed: "dana", rotation: -4 });
    Loom.tween(bk.inner, { opacity: 0 }, { opacity: 1, duration: 0.3 }, c2 + 0.2, meta("card_withdrawn"));
    m.travel(bk, c2 + 0.2, { x: back.x - atLock.x, y: back.y - atLock.y, scale: 1 });

    // reused: a neg tag on the dark side, its lead to the card
    const cs = toScreen({ x: back.x, y: back.y + KH / 2 });
    Loom.treat.label(ctx, "reused_tag", { x: 520, y: cs.y - 150, text: "reused", to: [cs.x - 10, cs.y], tone: "neg", role: "label", t: c3 });
  },
});
