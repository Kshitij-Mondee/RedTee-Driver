// @design confirmed_behaviour_replaces_verdict: the struck verdict fades as the lower row fills with the concrete, confirmed behaviour

Loom.scene("b05", {
  build(ctx, props) {
    const kit = ctx.kit;
    const m = ctx.m;

    // THREE TREATMENTS (choosing B):
    // A) static: redraw the whole card fresh with its final text.
    //    Rejected: breaks the held join (keep=["phrase_card"]) and repeats work b04 already put on screen.
    // B) chosen: hold the card and its two rows; the verdict row fades as the behaviour row's dim
    //    placeholder is covered by the concrete detail, then a freshly drawn accent layer settles on top.
    // C) morph: have the verdict box literally turn into the behaviour box.
    //    Rejected: they are two separate rows already on screen by b04's own design; nothing should
    //    travel between boxes, only each row's own content should change.

    const tDetail = ctx.cue("the timeline and the blockers");
    const tConfirm = ctx.cue("that's a behaviour");
    const dur = ctx.style.dur("enter");
    const stagger = ctx.style.dur("stagger");

    const card = ctx.held("phrase_card");
    const quote = ctx.held("quote_text");
    const verdict = ctx.held("verdict_label");
    const behaviour = ctx.held("behaviour_label");

    // the verdict row (wrong read) fades away as the concrete detail arrives
    if (verdict) {
      Loom.tween(verdict.inner, { opacity: 1 }, { opacity: 0 }, tDetail, { dur });
    }

    if (behaviour) {
      // @form behaviour_fill: covers the dim placeholder row with the concrete read's plain background
      const fill = kit.rect(behaviour.inner, 0, 0, 520, 190, { fill: "surface2", r: 10 });
      fill.style.opacity = 0;
      // @form behaviour_detail_text: the concrete detail from Priya's actual update
      const detail = kit.text(behaviour.inner, "Timeline and blockers, same paragraph", {
        role: "lead", x: 24, y: 0, w: 472, h: 190, align: "center", valign: "middle", maxLines: 2, color: "ink",
      });
      detail.style.opacity = 0;

      Loom.tween(fill, { opacity: 0 }, { opacity: 1 }, tDetail, { dur });
      Loom.tween(detail, { opacity: 0 }, { opacity: 1 }, tDetail + stagger, { dur });

      // on "that's a behaviour": a fresh accent-filled layer settles on top (toon shading needs a
      // real draw, not a colour mutated after the fact); same words, now confirmed
      // @form behaviour_confirm_fill: the confirmed row's accent background
      const confirmFill = kit.rect(behaviour.inner, 0, 0, 520, 190, { fill: "accent", r: 10 });
      confirmFill.style.opacity = 0;
      // @form behaviour_confirm_text: the confirmed label, same words, now on the accent
      const confirmText = kit.text(behaviour.inner, "Timeline and blockers, same paragraph", {
        role: "lead", x: 24, y: 0, w: 472, h: 190, align: "center", valign: "middle", maxLines: 2, color: "field",
      });
      confirmText.style.opacity = 0;

      Loom.tween(confirmFill, { opacity: 0 }, { opacity: 1 }, tConfirm, { dur });
      Loom.tween(confirmText, { opacity: 0 }, { opacity: 1 }, tConfirm, { dur });
      m.emphasis(behaviour, tConfirm);
    }

    // nothing on this card continues past this beat (the next beat cuts to a different station)
    if (card) card.exit = "recede";
    if (quote) quote.exit = "recede";
    if (verdict) verdict.exit = "recede";
    if (behaviour) behaviour.exit = "recede";
  },
});
