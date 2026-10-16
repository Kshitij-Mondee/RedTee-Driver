// @design the_answer_and_the_pin: Leo's bubble answers, a pin drops on Tuesday, both nod
Loom.scene("b10", {
  build(ctx) {
    const { kit, m } = ctx;

    const setE = ctx.held("set");
    const youE = ctx.held("you");
    const leoE = ctx.held("leo");
    const plannerE = ctx.held("planner");
    const railE = ctx.held("rail");
    const mark1E = ctx.held("mark_1");
    const mark2E = ctx.held("mark_2");
    const mark3E = ctx.held("mark_3");

    const plannerSlots = plannerE.ui.slots(640, 20, 640, 297);

    // 1. Leo's answer bubble, tail toward Leo (screen right)
    const abE = ctx.el("answer_bubble", { x: 760, y: 400, w: 440, h: 150, kind: "bubble" });
    const ab = Loom.lesson.speech_bubble(ctx, abE.inner, {
      w: 440, h: 150, tone: "leo", tailSide: "right",
      text: "A midpoint check-in?",
    });
    abE.ui = ab;

    // 2. the check-in pin, centred on the planner's Tuesday slot, held onward by b11
    const tue = plannerSlots.tue;
    const pinW = 120, pinH = 120;
    const pinE = ctx.el("tue_pin", { x: tue.x - pinW / 2, y: tue.y - pinH / 2, w: pinW, h: pinH, kind: "token", exit: "none" });
    const pin = Loom.lesson.tue_pin(ctx, pinE.inner, { w: pinW, h: pinH });
    pinE.ui = pin;

    // 3. the next-step sign: on the wall beside the planner, left of it and beside
    // the Tuesday pin, clear of both heads (heads start around y300+) and the window.
    // @form next_step_sign: the agreed next step, written down
    const nsE = ctx.el("next_step_sign", { x: 190, y: 120, w: 430, h: 100, kind: "card" });
    kit.rect(nsE.inner, 0, 0, 430, 100, { fill: "surface", stroke: "ink", sw: 4, r: 10 });
    kit.text(nsE.inner, "Next step: midpoint check-in", {
      role: "label", x: 16, y: 8, w: 398, h: 84, align: "center", valign: "middle", maxLines: 2, color: "ink",
    });

    // --- choreography on the words ---
    const t1 = ctx.cue("knows his week");
    leoE.ui.face("explaining", t1);

    const t2 = ctx.cue("suggests a midpoint check-in");
    ab.setState("in", t2);

    const t3 = ctx.cue("midpoint check-in");
    pin.setState("drop", t3);
    mark3E.ui.setState("plain", t3);
    m.pop(nsE, t3);

    const t4 = ctx.cue("agree it together");
    youE.ui.face("happy", t4);
    leoE.ui.face("happy", t4);
    const nodDur = ctx.style.dur("move") || 0.34;
    [youE, leoE].forEach((E, i) => {
      Loom.tween(E.mover, { y: 0 }, { y: 10, duration: nodDur / 2, ease: "move" }, t4, { kind: "gesture", beat: "b10", name: "nod_down_" + i });
      Loom.tween(E.mover, { y: 10 }, { y: 0, duration: nodDur / 2, ease: "move" }, t4 + nodDur / 2, { kind: "gesture", beat: "b10", name: "nod_up_" + i });
    });
  },
});
