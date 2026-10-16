// @design open_question_listening_space: neutral figures yield speaking turn to an open question leaving reply space unfilled
/* Three treatments considered:
 * (A) Split diagram with static callout boxes (rejected: static composition that misses the active shift from speaking to listening).
 * (B) Scrolling chat stream with animated countdown timer (rejected: invents timer mechanics and reply timing not present in script).
 * (C) CHOSEN: Neutral adult rigs at a shared table. Colleague's speaking cue retires quietly on the pause,
 *     the open question card unfolds from the colleague's side, Jordan gently turns to face the work page,
 *     and the response space remains unfilled during the listening hold.
 */
Loom.scene("b08", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;

    // Table scaffold grounding the interlocutors
    // @form listening_desk: table anchor for two interlocutors
    const table = ctx.el("table", { x: 340, y: 720, w: 1240, h: 80, kind: "scenery", exit: "recede" });
    kit.rect(table.inner, 0, 0, 1240, 26, { fill: "surface2", r: 6, stroke: "line" });
    kit.rect(table.inner, 40, 26, 1160, 16, { fill: "field2", r: 2 });
    kit.rect(table.inner, 80, 42, 28, 38, { fill: "surface2", r: 4, stroke: "line" });
    kit.rect(table.inner, 1132, 42, 28, 38, { fill: "surface2", r: 4, stroke: "line" });

    // Colleague rig on the left
    // @form character_colleague: adult bust in speaking-then-listening posture
    const colleague = ctx.el("colleague", { x: 400, y: 330, w: 330, h: 460, kind: "character", exit: "recede" });
    kit.rect(colleague.inner, 26, 80, 36, 280, { fill: "surface2", r: 8, stroke: "line" });
    kit.peep(colleague.inner, "woman", "neutral", { x: 15, y: 40, size: 300, cloth: "surface2", skin: 1 });
    m.settle(colleague, ctx.start, { dy: 8 });

    // Jordan rig on the right
    // @form character_jordan: adult bust oriented toward shared work artifact
    const jordan = ctx.el("Jordan", { x: 1190, y: 330, w: 330, h: 460, kind: "character", exit: "recede" });
    kit.rect(jordan.inner, 268, 80, 36, 280, { fill: "surface2", r: 8, stroke: "line" });
    kit.peep(jordan.inner, "man", "neutral", { x: 15, y: 40, size: 300, flip: true, cloth: "muted", skin: 0 });
    m.settle(jordan, ctx.start, { dy: 8 });

    // Shared consequence page on the table between them
    // @form shared_deliverable_page: consequence document resting between interlocutors
    const sharedPage = ctx.el("shared_page", { x: 760, y: 520, w: 420, h: 230, kind: "document", exit: "recede" });
    kit.rect(sharedPage.inner, 0, 0, 420, 230, { fill: "surface", r: 8, stroke: "line" });
    kit.rect(sharedPage.inner, 24, 18, 220, 34, { fill: "surface2", r: 4 });
    const fitImpact = kit.fit("Operational impact", { role: "caption", w: 200, maxLines: 1 });
    kit.text(sharedPage.inner, "Operational impact", {
      role: "caption",
      x: 32,
      y: 20,
      w: 200,
      h: 30,
      maxLines: 1,
      size: fitImpact.size,
      color: "ink",
      weight: 700,
    });
    kit.rect(sharedPage.inner, 24, 68, 372, 36, { fill: "field2", r: 4 });
    kit.rect(sharedPage.inner, 24, 116, 372, 36, { fill: "surface2", r: 4 });
    kit.rect(sharedPage.inner, 24, 164, 372, 36, { fill: "surface2", r: 4 });
    m.settle(sharedPage, ctx.cue("After stating operational impact"), { dy: 16 });

    // Speaking cue near colleague's mouth: quiet removal on pause
    // @form speaking_cue_burst: acoustic sound wave indicator retiring on pause
    const speakingCue = ctx.el("speaking_cue", { x: 730, y: 390, w: 90, h: 60, kind: "indicator", exit: "none" });
    const waveColor = ctx.c("muted");
    Loom.svg("path", {
      d: "M 20 18 Q 32 30 20 42",
      stroke: waveColor,
      "stroke-width": 4,
      "stroke-linecap": "round",
      fill: "none",
    }, speakingCue.inner);
    Loom.svg("path", {
      d: "M 42 12 Q 58 30 42 48",
      stroke: waveColor,
      "stroke-width": 4,
      "stroke-linecap": "round",
      fill: "none",
    }, speakingCue.inner);
    Loom.svg("path", {
      d: "M 64 6 Q 84 30 64 54",
      stroke: waveColor,
      "stroke-width": 4,
      "stroke-linecap": "round",
      fill: "none",
    }, speakingCue.inner);

    const tPause = ctx.cue("pause");
    Loom.tween(
      speakingCue.inner,
      { opacity: 1, scale: 1 },
      { opacity: 0, scale: 0.8, duration: 0.35, ease: Loom.ease.exit },
      tPause,
      { kind: "quiet_removal", beat: ctx.beat.id, content: true }
    );

    // Open question card unfolding from colleague's side, with unfilled reply space
    // @form open_question_panel: unfolded question card beside unfilled listening slot
    const openQuestion = ctx.el("open_question", { x: 550, y: 170, w: 820, h: 190, kind: "card", exit: "recede" });

    // Left card body with the saturated accent
    kit.rect(openQuestion.inner, 0, 0, 520, 190, { fill: "surface", r: 12, stroke: "line" });
    kit.rect(openQuestion.inner, 0, 0, 12, 190, { fill: "accent", r: 6 });

    const qText = "What blocked your progress on this deliverable?";
    const qFit = kit.fit(qText, { role: "lead", w: 460, maxLines: 2 });
    kit.text(openQuestion.inner, qText, {
      role: "lead",
      x: 32,
      y: 45,
      w: 460,
      h: 100,
      maxLines: 2,
      size: qFit.size,
      color: "ink",
      weight: 700,
    });

    // Right side: unfilled listening reply space
    kit.rect(openQuestion.inner, 540, 0, 280, 190, { fill: "surface2", r: 12, stroke: "muted", dash: "6 6" });
    kit.rect(openQuestion.inner, 560, 20, 240, 150, { fill: "none", r: 8, stroke: "field2", strokeWidth: 2, dash: "4 4" });

    const tQuestion = ctx.cue("What blocked your progress on this deliverable");
    Loom.tween(
      openQuestion.inner,
      { scaleX: 0.05, opacity: 0, transformOrigin: "0% 50%" },
      { scaleX: 1, opacity: 1, duration: 0.65, ease: Loom.ease.move },
      tQuestion,
      { kind: "paper_unfold", beat: ctx.beat.id, content: true }
    );

    // Jordan orients whole rig toward the page
    const tJordan = ctx.cue("Inviting perspective sharing lowers defensiveness");
    Loom.tween(
      jordan.inner,
      { rotation: 0, transformOrigin: "50% 100%" },
      { rotation: -3, duration: 0.5, ease: Loom.ease.move },
      tJordan,
      { kind: "small_whole_rig_rotation", beat: ctx.beat.id, content: true }
    );

    // Hold through final line and trailing silence
    const tListen = ctx.cue("Listen before you speak");
    void tListen;
  },
});
