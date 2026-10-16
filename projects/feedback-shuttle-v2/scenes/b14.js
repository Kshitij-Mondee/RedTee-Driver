// @design gap_in_a_complete_looking_row: the same cards stay put while the missing third slot of one is circled, so the gap is shown where it is
/* Treatments: (A) static composition with a caption (rejected: tells), (B) cards re-laid as a table of ticks (rejected: loses the held cards),
 * (C) CHOSEN: the same cards, held in place; two ticks stamp on C, its empty third slot is circled in the accent with a No step tag; a Label tag lands on A. */
Loom.scene("b14", {
  build(ctx) {
    const { kit, m } = ctx;
    const t0 = ctx.start;
    const S0 = 0.9, CX = 204, CY = 510;   // the same placement and scale as b12 and b13

    // held from b13: the card markers and lift/tick elements are switched off (we redraw one instance in the same place, no doubled words)
    ["card_a", "card_b", "card_c", "b_lift", "b_ticks"].forEach((n) => {
      let h = null;
      try { h = ctx.held ? ctx.held(n) : null; } catch (e) { h = null; }
      if (h && h.life) Loom.tl.set(h.life, { opacity: 0, visibility: "hidden" }, t0);
    });

    // the laptop and its mail row stay exactly as b12 and b13 left them, to the end of the beat (b14 cuts into b15)
    const inbox = ctx.held("inbox"), row = ctx.held("mail_row");

    const E = ctx.el("answer_cards", { x: CX, y: CY, w: 1680 * S0, h: 420 * S0, kind: "scenery", exit: "none" });
    const ac = Loom.lesson.answer_cards(ctx, E.inner, { scale: S0 });
    const snap = { dur: 0.001 };
    ["in_a", "in_b", "in_c", "lifted_b"].forEach((s) => ac.setState(s, t0, snap));
    // B's three ticks are already in place when the beat opens (the kit staggers its ticks, so start them before the beat)
    ac.setState("ticks_b", t0 - 1, snap);

    // B stays lifted with its three ticks and its ring, quietly: a light veil over it (the kit's lifted box, natural coords)
    const sg = Loom.svg("g", { transform: "scale(" + S0 + ")" }, E.inner);
    Loom.svg("rect", { x: 556, y: 26, width: 568, height: 440, rx: 26, fill: "none", stroke: ctx.c("pos"), "stroke-width": 9 }, sg);
    const veil = kit.rect(sg, 569.6, 40.1, 540.8, 411.8, { fill: "field2", r: 16, flat: true, shadow: false, sw: 0 });
    veil.setAttribute("opacity", 0);
    Loom.tween(veil, { opacity: 0 }, { opacity: 0.32, duration: 0.5, ease: Loom.ease.move }, t0 + 0.1, { kind: "travel", beat: ctx.beat.id, content: true });

    // 1. C sounds complete: two ticks, the third slot stays empty
    ac.setState("ticks_c", ctx.cue("C sounds complete"));
    // 2. no real step: the empty third slot is circled in the accent, No step tag
    const tNo = ctx.cue("no real step");
    ac.setState("circle_c", tNo);
    ac.setState("no_step_c", tNo + 0.35);
    // 3. A is only a label: the Label tag lands on A
    const tLab = ctx.cue("A is only a label");
    ac.setState("label_a", tLab);
  },
});
