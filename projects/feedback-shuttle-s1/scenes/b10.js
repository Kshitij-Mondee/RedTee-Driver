// @design behaviour_impact_question_held_whole: the camera returns once more to find the three-part card complete, the lesson's own device shown whole and at rest

Loom.scene("b10", {
  build(ctx, props) {
    const kit = ctx.kit;
    const m = ctx.m;

    // THREE TREATMENTS (choosing B):
    // A) static: just redraw the finished card with zero motion at all, frame one to last.
    //    Rejected: a camera return with zero settle reads as a mistake, not a held beat; the
    //    storyboard's own beat sheet calls for "settle, no new motion" on arrival.
    // B) chosen: redraw the card and its three confirmed rows exactly as b08 left them (same
    //    geometry, same words, same accent fills), the whole card gives one light settle as the
    //    camera arrives, then holds dead still for all four phrases ("Behaviour.", "Impact.",
    //    "Question.", "In that order."), with the scene's one emphasis on the whole card at the
    //    close, since accent_on is the assembled object, not any one row.
    // C) re-animate each row growing in again in sequence.
    //    Rejected: this is the rest beat, the device already built across b04/b05/b07/b08; redoing
    //    the build motion here would contradict "nothing should grow or change" and would cost the
    //    viewer the calm, settled read this callback-image beat needs.

    const tOrder = ctx.cue("In that order.");

    // the base card: same 600x720 card at x=660,y=150 established in b04, restated whole here
    const card = ctx.el("phrase_card", { x: 660, y: 150, w: 600, h: 720, kind: "card", exit: "recede" });
    kit.card(card.inner, 0, 0, 600, 720, { fill: "surface" });
    m.settle(card, ctx.start, { dur: ctx.style.dur("enter") });

    // behaviour_label: restated exactly as b07/b08 left it, confirmed, accent-filled, same words
    const behaviour = ctx.el("behaviour_label", { x: 40, y: 40, w: 520, h: 190, kind: "card", parent: card.inner, exit: "recede" });
    // @form behaviour_confirm_fill: the confirmed row's accent background, restated whole
    kit.rect(behaviour.inner, 0, 0, 520, 190, { fill: "accent", r: 10 });
    // @form behaviour_confirm_text: the confirmed label, same words as b05/b07/b08
    kit.text(behaviour.inner, "Timeline and blockers, same paragraph", {
      role: "lead", x: 24, y: 0, w: 472, h: 190, align: "center", valign: "middle", maxLines: 2, color: "field",
    });

    // connector_arrow_1: the first link, behaviour down to impact, restated whole (no draw-in)
    const connector1 = ctx.el("connector_arrow_1", { x: 290, y: 230, w: 20, h: 90, kind: "connector", parent: card.inner, exit: "recede" });
    // @form impact_connector: the short link from behaviour down to impact, restated
    kit.arrow(connector1.inner, 10, 2, 10, 84, { stroke: "ink" });

    // impact_label: restated exactly as b07/b08 left it, same words
    const impact = ctx.el("impact_label", { x: 40, y: 320, w: 520, h: 190, kind: "card", parent: card.inner, exit: "recede" });
    // @form impact_fill: the confirmed row's accent background, restated whole
    kit.rect(impact.inner, 0, 0, 520, 190, { fill: "accent", r: 10 });
    // @form impact_text: the concrete impact, in Priya's words, restated
    kit.text(impact.inner, "I couldn't tell what was blocking us", {
      role: "lead", x: 24, y: 0, w: 472, h: 190, align: "center", valign: "middle", maxLines: 2, color: "field",
    });

    // connector_arrow_2: the second link, impact down to question, restated whole (no draw-in)
    const connector2 = ctx.el("connector_arrow_2", { x: 290, y: 510, w: 20, h: 40, kind: "connector", parent: card.inner, exit: "recede" });
    // @form question_connector: the short link from impact down to the closing question, restated
    kit.arrow(connector2.inner, 10, 2, 10, 34, { stroke: "ink" });

    // question_label: restated exactly as b08 left it, the card's strongest accent treatment,
    // outlined, same words
    const question = ctx.el("question_label", { x: 40, y: 550, w: 520, h: 130, kind: "card", parent: card.inner, exit: "recede" });
    // @form question_fill: the closing row's accent background, outlined, restated whole
    kit.rect(question.inner, 0, 0, 520, 130, { fill: "accent", r: 10, stroke: "ink" });
    // @form question_text: the closing question, in Priya's words, restated
    kit.text(question.inner, "What got left out, from your side?", {
      role: "lead", x: 24, y: 0, w: 472, h: 130, align: "center", valign: "middle", maxLines: 2, color: "field",
    });

    // accent_on is the whole assembled card, not any one row: the scene's one emphasis lands on
    // the full card as the narration closes with "In that order."
    m.emphasis(card, tOrder);
  },
});
