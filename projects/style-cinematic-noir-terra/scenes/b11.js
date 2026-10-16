// @design second_lock_holds_after_first_turns: a stolen card turns the upper lock on Work while the lower phone lock keeps the door shut
Loom.scene("b11", {
  build(ctx) {
    const { kit, m } = ctx;
    const tMfa = ctx.cue("multi-factor authentication");
    const tTerm = ctx.cue("or MFA");
    const tMore = ctx.cue("something more");
    const tEnough = ctx.cue("not enough");

    // Treatment A: one large door and two locks. Treatment B: a phone diagram. Treatment C: two equal doors. Chosen A, because the first lock moving while the second holds is the proof.
    // @form door_wall: a dark corridor wall that keeps the Work door isolated
    const wall = ctx.el("door_wall", { x: 96, y: 120, w: 1728, h: 760, kind: "scenery", exit: "recede" });
    kit.rect(wall.inner, 0, 0, 1728, 760, { fill: "field2", r: 6 });
    kit.rect(wall.inner, 0, 608, 1728, 152, { fill: "surface2", r: 0 });
    kit.line(wall.inner, 0, 608, 1728, 608, { stroke: "line", sw: 2, opacity: 0.45 });
    kit.line(wall.inner, 220, 720, 1510, 720, { stroke: "accent3", sw: 3, opacity: 0.22 });
    m.reveal(wall, ctx.start + 0.05);

    // @form work_door: the Work door with its lower lock waiting for Dana's phone
    const work = ctx.el("door_work", { x: 920, y: 150, w: 520, h: 806, kind: "instrument", exit: "recede" });
    const workDoor = Loom.lesson.door(ctx, work.inner, { x: 0, y: 0, w: 520, name: "Work", heavy: true, state: "shut" });
    m.reveal(work, ctx.start + 0.16);

    // @form stolen_card: the copied credential aimed at the first lock
    const card = ctx.el("keycard", { x: 690, y: 474, w: 198, h: 126, kind: "token", exit: "iris" });
    const cardHandle = Loom.lesson.keycard(ctx, card.inner, { x: 0, y: 0, w: 198, seed: "b10-shop", state: "copy" });

    // @form mfa_term: the term kept sharp on the dark field
    const term = ctx.el("term", { x: 210, y: 282, w: 550, h: 190, kind: "text", exit: "wipe" });
    kit.text(term.inner, "MFA", { role: "title", x: 0, y: 0, w: 550, h: 120, maxLines: 1, color: "ink", weight: 800 });
    kit.text(term.inner, "multi-factor authentication", { role: "label", x: 0, y: 126, w: 520, h: 40, maxLines: 1, color: "muted" });

    // @form waiting_phone_mark: a lead that points to the phone glyph in the lower lock
    const waiting = ctx.el("second_lock", { x: 210, y: 600, w: 490, h: 74, kind: "text", exit: "wipe" });
    kit.text(waiting.inner, "something more", { role: "lead", x: 0, y: 0, w: 360, h: 58, maxLines: 1, color: "ink" });
    kit.line(waiting.inner, 350, 30, 548, -4, { stroke: "line", sw: 3, opacity: 0.9 });

    m.unmask(term, tTerm);
    m.settle(waiting, tMore);
    m.reveal(card, tMore - 0.06);
    m.travel(card, tMore + 0.1, { x: 1118, y: 505, scale: 1 });
    workDoor.setState("second_lock", tMfa + 0.12);
    workDoor.setState("second_turning", tMore + 0.64);
    cardHandle.setState("dim", tEnough);
    m.emphasis(work, tEnough + 0.08);
  },
});
