// @design shape_as_one_row: the rail is named card by card with one accent bar walking under it, then the Tuesday pin pulses as the agreed step
Loom.scene("b11", {
  build(ctx) {
    const { kit, m } = ctx;
    const meta = (n) => ({ kind: "gesture", beat: "b11", name: n });
    const names = ["set", "you", "leo", "planner", "rail", "mark_1", "mark_2", "mark_3", "tue_pin"];
    const H = {};
    names.forEach((n) => { H[n] = ctx.held(n); });

    const t1 = ctx.cue("What he did");
    const t2 = ctx.cue("What it caused");
    const t3 = ctx.cue("Then a question");
    const t4 = ctx.cue("one next step you agree");

    // @form lit_mark: one accent bar under the card being named (rail at 460,760,1000,120; cards 300 wide at x 460, 810, 1160)
    const litEl = ctx.el("lit_mark", { x: 460, y: 872, w: 300, h: 12, kind: "token", exit: "recede" });
    kit.rect(litEl.inner, 0, 0, 300, 12, { fill: "accent", r: 6 });
    m.pop(litEl, t1);
    m.travel(litEl, t2, { x: 350, y: 0 });
    m.travel(litEl, t3, { x: 700, y: 0 });

    // each card lifts while it is named, then settles (inner group only; movers untouched)
    function lift(E, tUp, tDown) {
      if (!E || !E.ui || !E.ui.root) return;
      Loom.tween(E.ui.root, { scale: 1 }, { scale: 1.08, duration: 0.3, ease: "move" }, tUp, meta("lift"));
      if (tDown != null) Loom.tween(E.ui.root, { scale: 1.08 }, { scale: 1, duration: 0.3, ease: "move" }, tDown, meta("settle"));
    }
    lift(H.mark_1, t1, t2);
    lift(H.mark_2, t2, t3);
    lift(H.mark_3, t3, t4);

    if (H.tue_pin && H.tue_pin.ui) H.tue_pin.ui.setState("pulse", t4);

    // b12 is a page join to the quiz: everything held here leaves with this beat
    names.forEach((n) => { if (H[n]) H[n].exit = "recede"; });
  },
});
