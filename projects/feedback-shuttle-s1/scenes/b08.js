// @design question_completes_the_shape: a third row grows under impact, the closing question that finishes the three-part card

Loom.scene("b08", {
  build(ctx, props) {
    const kit = ctx.kit;
    const m = ctx.m;

    // THREE TREATMENTS (choosing B):
    // A) static: show all three rows (behaviour, impact, question) from frame one.
    //    Rejected: the storyboard's beat sheet calls for the question row to visibly grow in on
    //    its own cue; showing it from t=0 loses the teaching beat, and the continue join from
    //    b07 already has behaviour and impact settled on screen.
    // B) chosen: hold the card and its two settled rows exactly as b07 left them (no re-entrance,
    //    the camera has not moved), then on "end with a question" grow a second connecting arrow
    //    and the question row below impact, in the same accent-fill system, with the card's single
    //    strongest accent treatment since the question is the one teaching point of this beat.
    // C) morph: have the impact row stretch downward into a taller box holding both lines.
    //    Rejected: impact and the question are two separately cued, independently read rows; a
    //    single row standing in for both would fake a text-split primitive the engine does not have.

    const tEnd = ctx.cue("end with a question");
    const tQuestion = ctx.cue("What got left out, from your side");
    const dur = ctx.style.dur("enter");
    const drawDur = ctx.style.dur("draw");
    const stagger = ctx.style.dur("stagger");

    // the card and its two settled rows, held exactly as b07 left them: same station, no camera
    // move, so there is no re-entrance for any of them
    const card = ctx.held("phrase_card");
    const behaviour = ctx.held("behaviour_label");
    const impact = ctx.held("impact_label");
    const connector1 = ctx.held("connector_arrow_1");

    // connector_arrow_2: the second link, from impact down to the new question row, drawing in
    // just as the question row begins to grow (connector draws INTO its target)
    const connector2 = ctx.el("connector_arrow_2", { x: 290, y: 510, w: 20, h: 40, kind: "connector", parent: card.inner, exit: "recede" });
    // @form question_connector: the short link from impact down to the closing question
    const arrow2 = kit.arrow(connector2.inner, 10, 2, 10, 34, { stroke: "ink" });
    if (arrow2.head) arrow2.head.style.opacity = 0;
    m.draw(arrow2.path, tEnd, { dur: drawDur });
    if (arrow2.head) {
      Loom.tween(arrow2.head, { opacity: 0 }, { opacity: 1 }, tEnd + drawDur, { dur: 0.12 });
    }

    // question_label: the closing row that completes the card, the beat's one teaching point,
    // given the card's strongest accent treatment: the same accent fill as the rows above it,
    // now with a crisp ink outline, so it reads as the one the eye should land on
    const question = ctx.el("question_label", { x: 40, y: 550, w: 520, h: 130, kind: "card", parent: card.inner, exit: "recede" });
    // @form question_fill: the closing row's accent background, outlined for the card's strongest emphasis
    kit.rect(question.inner, 0, 0, 520, 130, { fill: "accent", r: 10, stroke: "ink" });
    // @form question_text: the closing question, in Priya's words
    kit.text(question.inner, "What got left out, from your side?", {
      role: "lead", x: 24, y: 0, w: 472, h: 130, align: "center", valign: "middle", maxLines: 2, color: "field",
    });
    m.grow(question, tEnd + stagger, { axis: "y" });
    m.emphasis(question, tQuestion);

    // this is the last beat that holds this card piece by piece: the next beat cuts away to a
    // different station, and a later beat redraws this exact settled state by hand, so every row
    // gets a real exit now rather than lingering with exit:"none"
    if (card) card.exit = "recede";
    if (behaviour) behaviour.exit = "recede";
    if (impact) impact.exit = "recede";
    if (connector1) connector1.exit = "recede";
  },
});
