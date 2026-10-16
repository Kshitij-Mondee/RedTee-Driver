// @design lock_turns_door_holds: a stolen card turns the first lock while a second lock, with a phone glyph waiting, keeps the door shut
/* Three treatments considered: (1) static pair of doors labelled "1 lock / 2 locks" (no motion, rejected: no cause);
 * (2) split-screen card vs phone (rejected: the phone is b12's); (3) push in on one door, second plate lights, card turns lock 1,
 * door holds (chosen: the turn and the hold are the argument). */
Loom.scene("b11", {
  build(ctx) {
    const { kit, m } = ctx;
    const c = (t) => ctx.c(t);
    const svg = (tag, a, p) => Loom.svg(tag, a, p);

    // ---- the wall and the floor of the corridor (dark field, hard key light from the left)
    const WALL = ctx.el("door_wall", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    svg("rect", { x: 0, y: 0, width: 1920, height: 1080, fill: c("field") }, WALL.inner);
    svg("rect", { x: 0, y: 900, width: 1920, height: 180, fill: c("surface2"), opacity: 0.5 }, WALL.inner);
    svg("rect", { x: 0, y: 900, width: 1920, height: 3, fill: c("ink"), opacity: 0.18 }, WALL.inner);
    for (let x = 60; x < 1920; x += 240) svg("rect", { x, y: 0, width: 2, height: 900, fill: c("line"), opacity: 0.25 }, WALL.inner);
    svg("polygon", { points: "0,0 420,0 820,900 0,900", fill: c("ink"), opacity: 0.035 }, WALL.inner);   // the corridor lamp's hard wedge

    // ---- the Work door, pushed in slowly; the kit part is composed, never redrawn
    const S = 1.25, DW = 400 * S, DH = 620 * S;
    const CX = 640, CY = 490, PUSH = 1.07;
    const DOOR = ctx.el("door_work", { x: 0, y: 0, w: DW, h: DH, kind: "scenery", exit: "recede" });
    const door = Loom.lesson.door(ctx, DOOR.inner, { x: 0, y: 0, w: DW, name: "Work", state: "shut" });
    const sc = S;
    const lockAt = door.lockAt;
    m.travel(DOOR, ctx.start, { x: CX - DW / 2, y: CY - DH / 2, scale: 1, dur: 0.01 });
    m.travel(DOOR, ctx.speechStart + 0.5, { x: CX - PUSH * DW / 2, y: CY - PUSH * DH / 2, scale: PUSH, dur: ctx.speechEnd - ctx.speechStart - 0.5 });

    const tSecond = ctx.cue("multi-factor authentication");
    const tTerm = ctx.cue("or MFA");
    const tCardIn = ctx.cue("It asks for");
    const tTurn = ctx.cue("something more") + 0.2;
    const tHold = ctx.cue("not enough");

    // the second lock lights: a soft warm patch behind the plate, then the state swap
    const gid = Loom.uid("b11l");
    const rg = svg("radialGradient", { id: gid, cx: "50%", cy: "50%", r: "50%" }, svg("defs", {}, DOOR.inner));
    svg("stop", { offset: "0", "stop-color": c("ink"), "stop-opacity": 0.28 }, rg);
    svg("stop", { offset: "1", "stop-color": c("ink"), "stop-opacity": 0 }, rg);
    const lit = svg("ellipse", { cx: 303 * sc, cy: 470 * sc, rx: 80 * sc, ry: 100 * sc, fill: `url(#${gid})`, opacity: 0 }, DOOR.inner);
    Loom.tween(lit, { opacity: 0 }, { opacity: 1, duration: ctx.style.dur("enter") }, tSecond, { kind: "reveal", beat: ctx.beat.id, name: "second_light", content: true });
    door.setState("second_lock", tSecond);
    door.setState("second_turning", tTurn);

    // the accent: a ring around the second lock when it holds
    const ring = svg("rect", { x: 266 * sc, y: 408 * sc, width: 74 * sc, height: 124 * sc, rx: 12 * sc, fill: "none", stroke: c("accent"), "stroke-width": 4, opacity: 0 }, DOOR.inner);
    Loom.tween(ring, { opacity: 0 }, { opacity: 1, duration: ctx.style.dur("enter") }, tHold, { kind: "reveal", beat: ctx.beat.id, name: "second_lock", content: true });

    // ---- the stolen card: a group inside the door element, slides in from the left to the first slot
    const cardG = svg("g", { opacity: 0 }, DOOR.inner);
    Loom.lesson.keycard(ctx, cardG, { x: 0, y: 0, scale: 1, state: "lit", seed: "dana" });
    const a = { x: -300, y: lockAt.y - 70 * 0.8, s: 0.8 };
    const b = { x: lockAt.x - 64 * sc + 4, y: lockAt.y - 21, s: 68 / 220 };
    const place = (p) => cardG.setAttribute("transform", `translate(${a.x + (b.x - a.x) * p} ${a.y + (b.y - a.y) * p}) scale(${a.s + (b.s - a.s) * p})`);
    place(0);
    Loom.tween(cardG, { opacity: 0 }, { opacity: 1, duration: 0.3 }, tCardIn, { kind: "reveal", beat: ctx.beat.id, name: "stolen_card", content: true });
    Loom.drive((e) => place(e), ctx.cue("asks for") + 0.2, Math.max(0.6, tTurn - ctx.cue("asks for") - 0.2), "move");
    Loom.tween(cardG, { opacity: 1 }, { opacity: 0, duration: 0.2 }, tTurn + 0.05, { kind: "exit", beat: ctx.beat.id, name: "card_done" });

    // ---- the term, on the dark field to the right
    const T = ctx.el("term", { x: 1160, y: 330, w: 640, h: 240, kind: "text", exit: "wipe" });
    kit.text(T.inner, "MFA", { role: "title", x: 0, y: 0, w: 640, h: 110, maxLines: 1, weight: 800, color: "ink" });
    kit.text(T.inner, "Multi-factor authentication", { role: "lead", x: 0, y: 130, w: 640, h: 60, maxLines: 1, color: "muted" });
    m.unmask(T, tTerm);
  },
});
