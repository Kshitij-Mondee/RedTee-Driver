// @design held_slot_answer_reveal: mark target item, dim non-chosen items, bracket tempting distractor, and restore single focus
/* b18 - Option C revealed, with B's compliment dilution explained.
 * Treatments considered:
 * (A) Static callout cards with colored badges (rejected: right/wrong stamps fail to explain why B misleads).
 * (B) Full replacement of options with analytical panels (rejected: destroys continuity of the held sheet).
 * (C) CHOSEN: Held-slot answer reveal - mark C, dim peer options, bracket B's tempting praise to expose flaw, then return focus to C.
 * Motion is content: the shifting emphasis explains why superficial praise dilutes actionable clarity.
 */
Loom.scene("b18", {
  build(ctx, props) {
    const { kit, m } = ctx;

    const desktop = ctx.held("learner desktop");
    const sheet = ctx.held("option_sheet");
    void desktop;
    void sheet;

    const optA = ctx.held("option_A") || ctx.el("option_A", { x: 780, y: 330, w: 880, h: 130, kind: "card", exit: "none" });
    const optB = ctx.held("option_B") || ctx.el("option_B", { x: 780, y: 510, w: 880, h: 130, kind: "card", exit: "none" });
    const optC = ctx.held("option_C") || ctx.el("option_C", { x: 780, y: 690, w: 880, h: 170, kind: "card", exit: "none" });

    if (!ctx.held("option_A")) {
      kit.rect(optA.inner, 0, 0, 880, 130, { fill: "surface", r: 10, stroke: "line" });
      kit.text(optA.inner, "Option A", { role: "lead", x: 30, y: 20, w: 820, h: 44, color: "ink" });
    }
    if (!ctx.held("option_B")) {
      kit.rect(optB.inner, 0, 0, 880, 130, { fill: "surface", r: 10, stroke: "line" });
      kit.text(optB.inner, "Option B", { role: "lead", x: 30, y: 20, w: 820, h: 44, color: "ink" });
    }
    if (!ctx.held("option_C")) {
      kit.rect(optC.inner, 0, 0, 880, 170, { fill: "surface", r: 10, stroke: "line" });
      kit.text(optC.inner, "Option C", { role: "lead", x: 30, y: 20, w: 820, h: 44, color: "ink" });
    }

    // 1. Mark Option C as the clear answer; dim peer options A and B
    const tClear = ctx.cue("Option C is the clear answer");

    // @form boxed_check: square border with drawn tick
    const answerMark = ctx.el("boxed_answer_mark", {
      x: 1665,
      y: 740,
      w: 65,
      h: 65,
      kind: "mark",
      exit: "recede",
    });
    kit.rect(answerMark.inner, 0, 0, 65, 65, { fill: "surface", r: 8, stroke: "accent" });
    const checkPath = Loom.svg("path", {
      d: "M 16 33 L 28 47 L 50 18",
      fill: "none",
      stroke: ctx.c("accent"),
      "stroke-width": 6,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }, answerMark.inner);
    m.pop(answerMark, tClear, { overshoot: true });
    m.draw(checkPath, tClear + 0.1, { dur: 0.35 });

    Loom.tween(optA.inner, { opacity: 1 }, { opacity: 0.35, duration: 0.4, ease: Loom.ease.move }, tClear, { kind: "dim", beat: ctx.beat.id, content: true });
    Loom.tween(optB.inner, { opacity: 1 }, { opacity: 0.35, duration: 0.4, ease: Loom.ease.move }, tClear, { kind: "dim", beat: ctx.beat.id, content: true });

    // 2. Underline Option C factual clause on observable actions
    const tActions = ctx.cue("observable actions");
    const cUnderline = Loom.svg("path", {
      d: "M 32 136 L 560 136",
      fill: "none",
      stroke: ctx.c("accent"),
      "stroke-width": 5,
      "stroke-linecap": "round",
    }, optC.inner);
    m.draw(cUnderline, tActions, { dur: 0.4 });

    // 3. Option B becomes spoken focus; accent transfers from C to B
    const tTempting = ctx.cue("Why is Option B tempting");
    Loom.tween(optB.inner, { opacity: 0.35 }, { opacity: 1, duration: 0.35, ease: Loom.ease.move }, tTempting, { kind: "focus", beat: ctx.beat.id, content: true });
    Loom.tween(optC.inner, { opacity: 1 }, { opacity: 0.6, duration: 0.35, ease: Loom.ease.move }, tTempting, { kind: "transfer", beat: ctx.beat.id, content: true });

    // 4. Bracket B praise phrase: superficial compliments feel polite
    const tCompliments = ctx.cue("Superficial compliments feel polite");

    // @form compliment_bracket: annotation bracket identifying superficial praise phrase
    const bracket = ctx.el("compliment_bracket", {
      x: 990,
      y: 560,
      w: 540,
      h: 60,
      kind: "annotation",
      exit: "recede",
    });
    const bracketPath = Loom.svg("path", {
      d: "M 8 14 L 8 28 L 260 28 L 270 38 L 280 28 L 532 28 L 532 14",
      fill: "none",
      stroke: ctx.c("accent2"),
      "stroke-width": 3,
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    }, bracket.inner);
    kit.text(bracket.inner, "Superficial compliments", {
      role: "caption",
      x: 0,
      y: 28,
      w: 540,
      h: 26,
      align: "center",
      color: "muted",
      weight: 600,
    });
    m.draw(bracketPath, tCompliments, { dur: 0.45 });
    m.reveal(bracket, tCompliments + 0.05, { dy: 4, dur: 0.35 });

    // 5. Option C regains single accent and holds until beat end
    const tChoose = ctx.cue("Choose Option C every time");
    Loom.tween(optB.inner, { opacity: 1 }, { opacity: 0.35, duration: 0.4, ease: Loom.ease.move }, tChoose, { kind: "dim", beat: ctx.beat.id, content: true });
    Loom.tween(optC.inner, { opacity: 0.6 }, { opacity: 1, duration: 0.4, ease: Loom.ease.move }, tChoose, { kind: "focus", beat: ctx.beat.id, content: true });
    m.emphasis(optC, tChoose);

    void props;
  },
});
