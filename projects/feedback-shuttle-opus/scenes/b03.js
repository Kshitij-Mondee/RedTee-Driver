// @design callback_repeats: the same weekly event returns, landing as surprise the second time
// Treatments: (A) hard cut to a new calendar card (rejected: breaks the continuity contract, the
// desk world must persist); (B) redraw the whole desk fresh (rejected: these elements are HELD,
// never redrawn); (C) CHOSEN: take over the held set/you/leo/planner/laptop and drive them through
// their own ui and mover: the planner flips two weeks, Leo untenses, the same message pops again,
// You's face goes surprised. The repetition is the content: nothing new is built, the same rig replays.
Loom.scene("b03", {
  build(ctx) {
    const { m } = ctx;

    const setE = ctx.held("set");
    const you = ctx.held("you");
    const leo = ctx.held("leo");
    const planner = ctx.held("planner");
    const laptop = ctx.held("laptop");

    const missing = [];
    if (!setE) missing.push("set");
    if (!you) missing.push("you");
    if (!leo) missing.push("leo");
    if (!planner) missing.push("planner");
    if (!laptop) missing.push("laptop");
    if (missing.length) {
      Loom.error("held_missing", "b03: ctx.held returned nothing for " + missing.join(", "));
    }

    // --- choreography on the words ---
    const t0 = ctx.cue("Two weeks later");
    if (planner) planner.ui.setState("flip", t0);
    if (leo) {
      Loom.tween(
        leo.mover,
        { y: 20, rotation: -4 },
        { y: 0, rotation: 0, duration: ctx.style.dur("move"), ease: "move" },
        t0,
        { kind: "gesture", beat: "b03", name: "leo_upright" }
      );
    }
    if (laptop) laptop.ui.setState("idle", t0 + 0.1);

    const t1 = ctx.cue("Thursday again");
    if (planner) planner.ui.setState("due_thu", t1);

    const t2 = ctx.cue("Same message");
    if (laptop) {
      laptop.ui.setState("message_thu", t2);
    }

    const t3 = ctx.cue("Same surprise");
    if (you) you.ui.face("surprised", t3);

    // b04 cuts to a different station: every held element really leaves now
    [setE, you, leo, planner, laptop].forEach((E) => {
      if (E) E.exit = "recede";
    });
  },
});
