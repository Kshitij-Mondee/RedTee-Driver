// @design indifferent_card_stream_tests_login_doors: an even automated stream tries copied credentials until Dana's amber card reaches Work
/* Treatments: 1) a static row of doors. 2) cards advancing in a steady sequence. 3) a person choosing a door. Chosen: steady cards, because the automation is the definition. */
Loom.scene("b05", {
  build(ctx) {
    const { kit, m } = ctx;
    const tTries = ctx.cue("Software tries every leaked pair on other logins.");
    const tTerm = ctx.cue("That is credential stuffing.");
    const tDana = ctx.cue("Nobody chose Dana.");
    const wall = ctx.held("door_wall");
    const shop = ctx.held("door_shop");
    const work = ctx.held("door_work");
    const card = ctx.held("keycard");
    const workDoor = work.handle;
    const cardPart = card.handle;
    // @form door_row: additional login doors extend the corridor's test targets
    const row = ctx.el("door_row", { x: 130, y: 300, w: 1480, h: 420, kind: "scenery", exit: "recede" });
    const rowA = Loom.lesson.door(ctx, row.inner, { x: 0, y: 80, w: 210, name: "Login", shade: 0.5, state: "shut" });
    const rowB = Loom.lesson.door(ctx, row.inner, { x: 270, y: 80, w: 210, name: "Login", shade: 0.4, state: "shut" });
    const rowC = Loom.lesson.door(ctx, row.inner, { x: 540, y: 80, w: 210, name: "Login", shade: 0.3, state: "shut" });
    const rowD = Loom.lesson.door(ctx, row.inner, { x: 810, y: 80, w: 210, name: "Login", shade: 0.2, state: "shut" });
    rowA.setState("refused", tTries + 0.6);
    rowB.setState("refused", tTries + 1.35);
    rowC.setState("refused", tTries + 2.1);
    rowD.setState("refused", tTries + 2.85);
    // @form card_stream: copies queue at rest after their indifferent attempts
    const stream = ctx.el("card_stream", { x: 130, y: 760, w: 1120, h: 120, kind: "token", exit: "none" });
    const attempt1 = ctx.el("attempt_one", { x: 130, y: 760, w: 130, h: 90, kind: "token", exit: "recede" });
    const attempt2 = ctx.el("attempt_two", { x: 320, y: 760, w: 130, h: 90, kind: "token", exit: "recede" });
    const attempt3 = ctx.el("attempt_three", { x: 510, y: 760, w: 130, h: 90, kind: "token", exit: "recede" });
    Loom.lesson.keycard(ctx, attempt1.inner, { x: 0, y: 0, w: 130, seed: "other-one", state: "copy" });
    Loom.lesson.keycard(ctx, attempt2.inner, { x: 0, y: 0, w: 130, seed: "other-two", state: "copy" });
    Loom.lesson.keycard(ctx, attempt3.inner, { x: 0, y: 0, w: 130, seed: "other-three", state: "copy" });
    m.settle(attempt1, tTries);
    m.travel(attempt1, tTries + 0.2, { x: 150, y: 490, scale: 0.7 });
    m.settle(attempt2, tTries + 0.75);
    m.travel(attempt2, tTries + 0.95, { x: 420, y: 490, scale: 0.7 });
    m.settle(attempt3, tTries + 1.5);
    m.travel(attempt3, tTries + 1.7, { x: 690, y: 490, scale: 0.7 });
    // @form term: definition title above the automated rhythm
    const term = ctx.el("term", { x: 180, y: 115, w: 1040, h: 120, kind: "text", exit: "wipe" });
    kit.text(term.inner, "credential stuffing", { role: "title", x: 0, y: 0, w: 1040, h: 105, maxLines: 1, color: "ink", weight: 800 });
    kit.line(term.inner, 0, 110, 440, 110, { stroke: "accent", sw: 5 });
    m.unmask(term, tTerm);
    cardPart.setState("lit", tDana);
    m.travel(card, tDana, { x: 130, y: 15, scale: 0.72 });
    workDoor.setState("shut", tDana);
  },
});
