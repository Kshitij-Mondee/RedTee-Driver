// @design impact_grows_under_confirmed_behaviour: the card is restated with its confirmed behaviour row, then a new impact row grows below it, joined by a short arrow, in the same accent system

Loom.scene("b07", {
  build(ctx, props) {
    const kit = ctx.kit;
    const m = ctx.m;

    // THREE TREATMENTS (choosing B):
    // A) static: show card with behaviour and impact both present from frame one.
    //    Rejected: the storyboard's beat sheet calls for the impact row to visibly grow in
    //    on its own cue; showing it from t=0 loses that teaching beat.
    // B) chosen: redraw the card and the confirmed behaviour row exactly as b05 left them
    //    (no entrance, simply present, since the camera is returning to a held place), then
    //    grow a connecting arrow and the new impact row on "add the impact", confirming with
    //    an accent fill from the moment it appears so the card reads as one consistent system.
    // C) morph: have the behaviour row stretch downward into a taller box containing both lines.
    //    Rejected: behaviour and impact are two separate, independently cued readings; a single
    //    row standing in for two labels would fake a text-split primitive the engine does not have.

    const tAdd = ctx.cue("add the impact");
    const tQuote = ctx.cue("I couldn't tell what was blocking us");
    const dur = ctx.style.dur("enter");
    const drawDur = ctx.style.dur("draw");
    const stagger = ctx.style.dur("stagger");

    // the base card, restated: same 600x720 card at x=660,y=150 established in b04/b05.
    // the camera is returning to a held place, so there is no entrance for the card or the
    // behaviour row below: they are simply present from the first frame of this beat.
    const card = ctx.el("phrase_card", { x: 660, y: 150, w: 600, h: 720, kind: "card", exit: "none" });
    kit.card(card.inner, 0, 0, 600, 720, { fill: "surface" });

    // behaviour_label: restated exactly as b05 left it, confirmed, accent-filled, same words
    const behaviour = ctx.el("behaviour_label", { x: 40, y: 40, w: 520, h: 190, kind: "card", parent: card.inner, exit: "none" });
    // @form behaviour_confirm_fill: the confirmed row's accent background, restated
    kit.rect(behaviour.inner, 0, 0, 520, 190, { fill: "accent", r: 10 });
    // @form behaviour_confirm_text: the confirmed label, same words as b05
    kit.text(behaviour.inner, "Timeline and blockers, same paragraph", {
      role: "lead", x: 24, y: 0, w: 472, h: 190, align: "center", valign: "middle", maxLines: 2, color: "field",
    });

    // connector_arrow_1: a short vertical arrow linking behaviour's row to the new impact row,
    // drawing in just as the impact row begins to grow (connector draws INTO its target)
    const connector = ctx.el("connector_arrow_1", { x: 290, y: 230, w: 20, h: 90, kind: "connector", parent: card.inner, exit: "none" });
    // @form impact_connector: the short link from behaviour down to impact
    const arrow = kit.arrow(connector.inner, 10, 2, 10, 84, { stroke: "ink" });
    if (arrow.head) arrow.head.style.opacity = 0;
    m.draw(arrow.path, tAdd, { dur: drawDur });
    if (arrow.head) {
      Loom.tween(arrow.head, { opacity: 0 }, { opacity: 1 }, tAdd + drawDur, { dur: 0.12 });
    }

    // impact_label: the new row, born directly in the confirmed accent style (same system as
    // behaviour, not a dim placeholder first) so the card reads as one consistent, growing whole
    const impact = ctx.el("impact_label", { x: 40, y: 320, w: 520, h: 190, kind: "card", parent: card.inner, exit: "none" });
    // @form impact_fill: the new row's accent background, same treatment as behaviour's
    kit.rect(impact.inner, 0, 0, 520, 190, { fill: "accent", r: 10 });
    // @form impact_text: the concrete impact, in Priya's words
    kit.text(impact.inner, "I couldn't tell what was blocking us", {
      role: "lead", x: 24, y: 0, w: 472, h: 190, align: "center", valign: "middle", maxLines: 2, color: "field",
    });
    m.grow(impact, tAdd + stagger, { axis: "y" });
    m.emphasis(impact, tQuote);
  },
});
