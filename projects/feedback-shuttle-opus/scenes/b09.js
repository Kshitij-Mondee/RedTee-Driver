// @design the_third_mark_and_the_question: mark 3 completes the rail, You asks instead of tells
Loom.scene("b09", {
  build(ctx) {
    const setE = ctx.held("set");
    const youE = ctx.held("you");
    const leoE = ctx.held("leo");
    const plannerE = ctx.held("planner");
    const railE = ctx.held("rail");
    const mark1E = ctx.held("mark_1");
    const mark2E = ctx.held("mark_2");
    const callCardE = ctx.held("call_card");

    // retire the call card at the b09 to b10 join (not held forward from here)
    callCardE.exit = "recede";

    const railSlots = railE.ui.slots(460, 760, 1000, 120);
    const slot3 = railSlots.mark_3;
    const mark3E = ctx.el("mark_3", { x: slot3.x, y: slot3.y, w: slot3.w, h: slot3.h, kind: "card", exit: "none" });
    const mark3 = Loom.lesson.mark_card(ctx, mark3E.inner, { i: 3, w: slot3.w, h: slot3.h });
    mark3E.ui = mark3;

    const qbE = ctx.el("question_bubble", { x: 660, y: 380, w: 520, h: 160, kind: "bubble" });
    const qb = Loom.lesson.speech_bubble(ctx, qbE.inner, {
      w: 520, h: 160, tone: "you", tailSide: "left",
      text: "What would help you flag a slip sooner?",
    });
    qbE.ui = qb;

    // --- choreography on the words ---
    const t1 = ctx.cue("and ask");
    mark2E.ui.setState("plain", t1);
    mark3.setState("drop", t1);
    mark3.setState("lit", t1 + 0.5);

    const t2 = ctx.cue("What would help you");
    qb.setState("in", t2);

    const t3 = ctx.cue("flag a slip sooner");
    leoE.ui.face("surprised", t3);
    Loom.tween(
      leoE.mover,
      { y: 0 },
      { y: -15, duration: 0.3, ease: "move" },
      t3,
      { kind: "gesture", beat: "b09", name: "leo_rise" }
    );

    const t4 = ctx.end - 0.3;
    leoE.ui.face("explaining", t4);
  },
});
