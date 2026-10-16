// @design quick_verdict_lands: a teammate's honest update gets a verdict that leaves him deflated
// Treatments: (A) avatar talking heads (rejected: no desk world, no artefacts to point at);
// (B) single shot on Leo only, You as a voice (rejected: the verdict needs both faces in one frame);
// (C) CHOSEN: the desk two-shot with nameplates, the planner above carrying the date, the laptop on the
// table between them carrying his words, the verdict bubble over the laptop. Build order: set, then
// people (all four emotions baked in, face() swaps which shows), planner, laptop, bubble.
Loom.scene("b02", {
  build(ctx) {
    const { kit, m } = ctx;

    // 1. scaffold: the shared office set, full frame
    const setEl = ctx.el("set", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
    const set = Loom.lesson.desk_set(ctx, setEl.inner, { w: 1920, h: 1080 });
    set.setState("two_shot", ctx.start);
    set.setState("nameplates", ctx.start);
    setEl.ui = set;
    m.reveal(setEl, ctx.start + 0.02, { dy: 0 });

    // people: four baked emotions each (neutral, happy, surprised, explaining); face(name, t) swaps
    // which one shows via Loom.tl.set on display. E.ui = { face } per the continuity contract.
    function makeFace(E, member, opts) {
      const emotions = ["neutral", "happy", "surprised", "explaining"];
      const groups = {};
      emotions.forEach((e) => {
        const g = Loom.svg("g", { style: "display:none" }, E.inner);
        kit.peep(g, member, e, opts);
        groups[e] = g;
      });
      Loom.tl.set(groups.neutral, { display: "inline" }, ctx.start);
      function face(name, t) {
        emotions.forEach((e) => {
          Loom.tl.set(groups[e], { display: e === name ? "inline" : "none" }, t);
        });
      }
      return { face };
    }

    // @form you_bust: You, neutral then explaining as the verdict lands
    const youEl = ctx.el("you", {
      x: 260, y: 320, w: 600, h: 600, kind: "character", exit: "none", parent: set.peepLayer,
    });
    youEl.ui = makeFace(youEl, "woman", { x: 300, y: 300, size: 600, flip: false, cloth: "cloth", skin: 3 });
    m.pop(youEl, ctx.start + 0.05);
    m.drift(youEl, ctx.start + 0.3, ctx.end, { amp: 3, period: 3.0 });

    // @form leo_bust: Leo, neutral throughout, nods then sinks (E.mover carries the gesture)
    const leoEl = ctx.el("leo", {
      x: 1060, y: 320, w: 600, h: 600, kind: "character", exit: "none", parent: set.peepLayer,
    });
    leoEl.ui = makeFace(leoEl, "man", { x: 300, y: 300, size: 600, flip: true, cloth: "cloth2", skin: 1 });
    m.pop(leoEl, ctx.start + 0.1);
    m.drift(leoEl, ctx.start + 0.3, ctx.end, { amp: 3, period: 3.2 });

    // 3. the planner: reference, above and between the heads
    const plannerEl = ctx.el("planner", { x: 640, y: 20, w: 640, h: 297, kind: "card", exit: "none" });
    plannerEl.ui = Loom.lesson.week_planner(ctx, plannerEl.inner, { w: 640, h: 297 });
    m.reveal(plannerEl, ctx.start + 0.15, { dy: -10 });

    // 4. the laptop: on the table between the two people, lowered and centred so it reads clear of
    // either face (not in the peep layer, so it sits on the table top)
    const laptopEl = ctx.el("laptop", { x: 780, y: 640, w: 420, h: 300, kind: "instrument", exit: "none" });
    laptopEl.ui = Loom.lesson.leo_laptop_message(ctx, laptopEl.inner, { w: 420, h: 300 });
    m.reveal(laptopEl, ctx.start + 0.2, { dy: 0 });

    // 5. the verdict bubble: over the laptop, between the heads, narrowed so it clears both hairlines;
    // created now, invisible until its cue. exit: "recede" (it does not continue into b03): the engine
    // fades it at the next join, no manual out.
    const bubbleEl = ctx.el("verdict_bubble", { x: 680, y: 300, w: 480, h: 150, kind: "bubble", exit: "recede" });
    bubbleEl.ui = Loom.lesson.speech_bubble(ctx, bubbleEl.inner, { w: 480, h: 150, text: "Be more proactive.", tone: "you", tailSide: "left" });

    // --- choreography on the words ---
    const t1 = ctx.cue("Leo messages you");
    laptopEl.ui.setState("message_thu", t1);

    const t2 = ctx.cue("Thursday");
    plannerEl.ui.setState("due_thu", t2);

    const t3 = ctx.cue("will be late");
    youEl.ui.face("explaining", t3);

    const t4 = ctx.cue("be more proactive");
    bubbleEl.ui.setState("in", t4);

    const t5 = ctx.cue("He nods");
    Loom.tween(leoEl.mover, { y: 0 }, { y: -15, duration: 0.16, ease: "enter" }, t5, { kind: "gesture", beat: "b02", name: "leo_nod_down" });
    Loom.tween(leoEl.mover, { y: -15 }, { y: 0, duration: 0.22, ease: "move" }, t5 + 0.16, { kind: "gesture", beat: "b02", name: "leo_nod_up" });

    const t6 = ctx.cue("feels bad");
    Loom.tween(leoEl.mover, { y: 0, rotation: 0 }, { y: 20, rotation: -4, duration: 0.5, ease: "move" }, t6, { kind: "gesture", beat: "b02", name: "leo_sink" });
  },
});
