// @design phrase_splits_into_two_reads: a vague verdict phrase splits into a wrong character judgment and a still-empty specific-behaviour slot

Loom.scene("b04", {
  build(ctx, props) {
    const kit = ctx.kit;
    const m = ctx.m;

    // THREE TREATMENTS (choosing B):
    // A) static: card with quote on top and two rows below, all visible from the first frame.
    //    Rejected: loses the teaching beat where the single phrase visibly breaks into two readings.
    // B) chosen: the quote arrives alone, then on "isn't a behaviour" two rows grow in below it;
    //    on "verdict on who she is" the top row visibly turns into the wrong, struck-through read.
    // C) morph: the quote text itself physically reshapes into the two labels.
    //    Rejected: that would fake a text-split primitive the engine does not have; a label
    //    reads as one fixed box, never a shape that becomes another (Loom.morph is for shapes,
    //    not for one sentence becoming two independent rows).

    const t0 = ctx.cue("Communicate better");
    const tSplit = ctx.cue("isn't a behaviour");
    const tVerdict = ctx.cue("verdict on who she is");
    const stagger = ctx.style.dur("stagger");

    // the base card: a plain paper card, away from the two-person scene
    // layout (for later beats to reproduce by hand): a 600x720 vertical card at x=660,y=150;
    // quote band at local (40,40,520,180); verdict row at local (40,260,520,190);
    // behaviour row at local (40,490,520,190).
    const card = ctx.el("phrase_card", { x: 660, y: 150, w: 600, h: 720, kind: "card", exit: "none" });
    kit.card(card.inner, 0, 0, 600, 720, { fill: "surface" });
    m.pop(card, t0);

    // @form quoted_phrase: the vague feedback phrase that will read two ways
    const quote = ctx.el("quote_text", { x: 40, y: 40, w: 520, h: 180, kind: "text", parent: card.inner });
    kit.text(quote.inner, "\"Communicate better\"", { role: "title", x: 0, y: 0, w: 520, h: 180, align: "center", valign: "middle", maxLines: 2, color: "ink" });
    m.reveal(quote, t0 + 0.1);

    // verdict_label: the wrong read, a verdict on who she is (struck, coloured neg on its own cue)
    const verdict = ctx.el("verdict_label", { x: 40, y: 260, w: 520, h: 190, kind: "card", parent: card.inner });
    kit.rect(verdict.inner, 0, 0, 520, 190, { fill: "surface2", r: 10 });
    // @form verdict_wrong_overlay: fades in to show this reading is the wrong one
    const verdictOverlay = kit.rect(verdict.inner, 0, 0, 520, 190, { fill: "neg", r: 10 });
    verdictOverlay.style.opacity = 0;
    const verdictText = kit.text(verdict.inner, "A verdict on who she is", { role: "lead", x: 24, y: 0, w: 472, h: 190, align: "center", valign: "middle", maxLines: 2, color: "ink" });
    m.grow(verdict, tSplit, { axis: "y" });

    // behaviour_label: the right read, present now but dim; filled in on its own beat
    const behaviour = ctx.el("behaviour_label", { x: 40, y: 490, w: 520, h: 190, kind: "card", parent: card.inner });
    kit.rect(behaviour.inner, 0, 0, 520, 190, { fill: "surface2", r: 10 });
    kit.text(behaviour.inner, "A behaviour", { role: "lead", x: 24, y: 0, w: 472, h: 190, align: "center", valign: "middle", maxLines: 1, color: "muted" });
    m.grow(behaviour, tSplit + stagger, { axis: "y" });

    // at its own cue, the verdict row settles into the wrong, struck-through colouring
    Loom.tween(verdictOverlay, { opacity: 0 }, { opacity: 1 }, tVerdict, { dur: ctx.style.dur("enter") });
    Loom.tl.set(verdictText, { fill: ctx.c("field") }, tVerdict);
    m.emphasis(verdict, tVerdict);
    // @form verdict_strike: the strike line across the wrong reading
    const strike = kit.line(verdict.inner, 24, 95, 496, 95, { stroke: "field", sw: 5 });
    m.draw(strike, tVerdict + stagger, { dur: ctx.style.dur("draw") });
  },
});
