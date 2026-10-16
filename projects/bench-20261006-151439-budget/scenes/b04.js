// @design layered_slips_reveal: layered outer covers obscure central record until folded away for direct focus
/* b04 - Compliment slips covering a corrective-feedback slip.
 * Treatments considered:
 * (A) Static diagram with signalling: Three stacked layers labelled praise, correction, praise.
 *     Rejected: fails the animation gate (congruence principle). The lesson teaches a dynamic process:
 *     how superficial praise physically obscures and dilutes the core critique, and how folding them away
 *     restores directness. A static asset cannot demonstrate the masking and unmasking sequence.
 * (B) Gauge showing message dilution vs clarity.
 *     Rejected: cognitive budget and seductive details fence; introduces an arbitrary meter instead of
 *     using the lesson's established phrasing-bay paper slips.
 * (C) CHOSEN: Bespoke paper-stack swap and fold. The right paper anchor holds the work record slip,
 *     which swaps in place to corrective feedback. Two praise slips land above and below, physically
 *     sandwiching and obscuring the corrective text. On the dilution cue, both praise slips fold away
 *     and retire. The direct correction is underlined in rust and held.
 */
Loom.scene("b04", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;

    // Continuity: station phrasing_bay holds the main board and base from b03
    const phrasingBoard = ctx.held("phrasing_board");
    const phrasingBase = ctx.held("phrasing_base");
    void phrasingBoard;
    void phrasingBase;

    // 1. Right paper anchor: corrective feedback slip (held anchor [1040, 340, 500, 250])
    // @form corrective_slip: central feedback paper slip held at right anchor
    const feedbackCard = ctx.el("corrective_feedback", {
      x: 1040,
      y: 340,
      w: 500,
      h: 250,
      kind: "card",
      exit: "recede",
    });

    kit.card(feedbackCard.inner, 0, 0, 500, 250, {
      fill: "surface",
      r: 10,
      stroke: "line",
    });

    kit.kicker(feedbackCard.inner, "RECORD", {
      x: 32,
      y: 24,
      w: 436,
      h: 24,
      color: "muted",
    });

    // Retiring prior wording at fixed anchor
    const priorGroup = Loom.svg("g", {}, feedbackCard.inner);
    const fitPrior = kit.fit("Observable record", { role: "lead", w: 436, maxLines: 1 });
    kit.text(priorGroup, "Observable record", {
      role: "lead",
      x: 32,
      y: 84,
      w: 436,
      h: Math.max(fitPrior.height, 50),
      valign: "middle",
      color: "muted",
    });

    // Incoming corrective feedback wording
    const directGroup = Loom.svg("g", { opacity: 0 }, feedbackCard.inner);
    const fitCorrection = kit.fit("Corrective feedback", { role: "lead", w: 436, maxLines: 1 });
    kit.text(directGroup, "Corrective feedback", {
      role: "lead",
      x: 32,
      y: 84,
      w: 436,
      h: Math.max(fitCorrection.height, 50),
      valign: "middle",
      color: "ink",
      weight: 700,
    });

    // Underline for direct delivery (saturated accent token rust)
    // @form direct_underline: rust emphasis line under exposed message
    const underlineW = Math.min(fitCorrection.width + 10, 436);
    const underline = kit.line(directGroup, 32, 146, 32 + underlineW, 146, {
      stroke: "accent",
      sw: 5,
    });

    // Cue 1: in-place text swap from prior evidence to corrective feedback
    const tCritique = ctx.cue("corrective critique");
    Loom.tween(
      priorGroup,
      { opacity: 1, y: 0 },
      { opacity: 0, y: -12, duration: 0.28, ease: Loom.ease.exit },
      tCritique,
      { kind: "text_swap_out", beat: ctx.beat.id, content: true }
    );
    Loom.tween(
      directGroup,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.32, ease: Loom.ease.enter },
      tCritique + 0.12,
      { kind: "text_swap_in", beat: ctx.beat.id, content: true }
    );

    // 2. Peer praise slips covering the correction
    // @form compliment_slip_top: upper praise layer covering feedback
    const upperCompliment = ctx.el("upper_compliment", {
      x: 1010,
      y: 280,
      w: 530,
      h: 160,
      kind: "card",
      exit: "recede",
    });

    kit.card(upperCompliment.inner, 0, 0, 530, 160, {
      fill: "surface2",
      r: 10,
      stroke: "line",
    });
    kit.kicker(upperCompliment.inner, "PRAISE", {
      x: 35,
      y: 20,
      w: 240,
      h: 24,
      color: "muted",
    });
    const fitUpper = kit.fit("Superficial compliments", { role: "lead", w: 460, maxLines: 1 });
    kit.text(upperCompliment.inner, "Superficial compliments", {
      role: "lead",
      x: 35,
      y: 60,
      w: 460,
      h: Math.max(fitUpper.height, 52),
      valign: "middle",
      color: "ink",
      weight: 600,
    });
    // @form fold_crease_top: crease mark on praise slip
    kit.line(upperCompliment.inner, 35, 128, 495, 128, {
      stroke: "shadow",
      sw: 2,
      dash: [6, 4],
    });

    // @form compliment_slip_bottom: lower praise layer covering feedback
    const lowerCompliment = ctx.el("lower_compliment", {
      x: 1040,
      y: 470,
      w: 530,
      h: 160,
      kind: "card",
      exit: "recede",
    });

    kit.card(lowerCompliment.inner, 0, 0, 530, 160, {
      fill: "surface2",
      r: 10,
      stroke: "line",
    });
    kit.kicker(lowerCompliment.inner, "PRAISE", {
      x: 35,
      y: 20,
      w: 240,
      h: 24,
      color: "muted",
    });
    const fitLower = kit.fit("Superficial compliments", { role: "lead", w: 460, maxLines: 1 });
    kit.text(lowerCompliment.inner, "Superficial compliments", {
      role: "lead",
      x: 35,
      y: 60,
      w: 460,
      h: Math.max(fitLower.height, 52),
      valign: "middle",
      color: "ink",
      weight: 600,
    });
    // @form fold_crease_bottom: crease mark on praise slip
    kit.line(lowerCompliment.inner, 35, 128, 495, 128, {
      stroke: "shadow",
      sw: 2,
      dash: [6, 4],
    });

    // Cue 2: peer slips arrive and sandwich the central correction
    const tPraise = ctx.cue("two superficial compliments");
    m.settle(upperCompliment, tPraise, { dy: -28 });
    m.settle(lowerCompliment, tPraise + 0.08, { dy: 28 });

    // Cue 3: praise slips fold away outwards and retire
    const tDilute = ctx.cue("Superficial compliments dilute corrective feedback completely");
    Loom.tween(
      upperCompliment.inner,
      { opacity: 1, y: 0 },
      { opacity: 0, y: -64, duration: 0.46, ease: Loom.ease.exit },
      tDilute,
      { kind: "fold_away_top", beat: ctx.beat.id, content: true }
    );
    Loom.tween(
      lowerCompliment.inner,
      { opacity: 1, y: 0 },
      { opacity: 0, y: 64, duration: 0.46, ease: Loom.ease.exit },
      tDilute + 0.08,
      { kind: "fold_away_bottom", beat: ctx.beat.id, content: true }
    );

    // Cue 4: corrective feedback remains exposed with rust underline
    const tDirect = ctx.cue("Deliver corrective feedback directly");
    m.draw(underline, tDirect, { dur: 0.42 });
    m.emphasis(feedbackCard, tDirect + 0.22);
  },
});
