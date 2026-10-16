// @design impact_pushes_a_call: the second mark lands and a card physically slides off its day
Loom.scene("b08", {
  build(ctx) {
    const setE = ctx.held("set");
    const youE = ctx.held("you");
    const leoE = ctx.held("leo");
    const plannerE = ctx.held("planner");
    const railE = ctx.held("rail");
    const mark1E = ctx.held("mark_1");

    const railSlots = railE.ui.slots(460, 760, 1000, 120);
    const plannerSlots = plannerE.ui.slots(640, 20, 640, 297);

    // Leo: closed mouth, listening, through most of this beat (he carries "explaining"
    // from b07's close; reset it here so he is not seen mouthing words while You speaks).
    leoE.ui.face("neutral", ctx.start);

    // 1. new mark 2, in its rail slot, held onward by b09
    const slot2 = railSlots.mark_2;
    const mark2E = ctx.el("mark_2", { x: slot2.x, y: slot2.y, w: slot2.w, h: slot2.h, kind: "card", exit: "none" });
    const mark2 = Loom.lesson.mark_card(ctx, mark2E.inner, { i: 2, w: slot2.w, h: slot2.h });
    mark2E.ui = mark2;

    // 2. the call card, centred on the planner's Thursday slot, held onward by b09
    const thu = plannerSlots.thu;
    const nextWeekTab = plannerSlots.nextWeekTab;
    const ccW = 200, ccH = 70;
    const callCardE = ctx.el("call_card", { x: thu.x - ccW / 2, y: thu.y - ccH / 2, w: ccW, h: ccH, kind: "card", exit: "none" });
    const callCard = Loom.lesson.call_card(ctx, callCardE.inner, { w: ccW, h: ccH });
    callCardE.ui = callCard;

    // --- choreography on the words ---
    const t1 = ctx.cue("the impact");
    mark1E.ui.setState("plain", t1);
    mark2.setState("drop", t1);
    mark2.setState("lit", t1 + 0.5);

    const t2 = ctx.cue("move the client call");
    callCard.setState("in", t2);
    const enterDur = ctx.style.dur("enter") || 0.42;
    const moveDur = ctx.style.dur("move") || 0.34;
    const tMoveStart = t2 + enterDur;
    const dx = nextWeekTab.x - thu.x;
    const dy = nextWeekTab.y - thu.y;
    Loom.tween(
      callCardE.mover,
      { x: 0, y: 0 },
      { x: dx, y: dy, duration: moveDur, ease: "move" },
      tMoveStart,
      { kind: "card", beat: "b08", name: "call_card_slide" }
    );
    const tCallDone = tMoveStart + moveDur;
    callCard.setState("moved", tCallDone);

    // Leo reacts to the call moving off its day: a brief surprised beat, then back to
    // listening neutral before You's impact line finishes (never held over 4s).
    leoE.ui.face("surprised", tCallDone);
    leoE.ui.face("neutral", tCallDone + 0.4);

    const t3 = ctx.cue("short notice");
    youE.ui.face("explaining", t3);
    Loom.tween(
      youE.mover,
      { x: 0 },
      { x: 15, duration: 0.3, ease: "move" },
      t3,
      { kind: "gesture", beat: "b08", name: "you_lean" }
    );
  },
});
