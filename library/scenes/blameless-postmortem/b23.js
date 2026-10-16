// @design fix_leaves_causes_standing: a proposed fix is written, struck out and dimmed while the problems it should address stand untouched at full strength beside it
/* b23 - "be more careful" is not an action item: it leaves every condition standing.
 * Treatments considered:
 *  (A) a text-only crossed-out sentence (rejected: it tells the refutation but never sets the card
 *      against what it fails to touch, and the viewer has just sorted the three conditions in b21-b22),
 *  (B) the card and the conditions with a "does not fix" arrow between them (rejected: an arrow is a
 *      claim of causation, and here the point is the ABSENCE of any link),
 *  (C) CHOSEN: perform the refutation on the card. The card is written, one hand-drawn stroke strikes
 *      the words out and the card dims, the three conditions from b20 then stand beside it at full ink,
 *      and a Training tag is clipped inside the card's lower corner. Motion is content: the strike is
 *      the change the viewer must see.
 *
 * Beat sheet (anchors are spoken words; every one is verbatim in b23's narration):
 *   "your action card"   action_card settles (header strip, empty checkbox)
 *   "be more careful"    card_text unmasks left to right like handwriting
 *   "Every condition"    strike draws across the words only (inside the card body), card dims to 55%
 *   "would still be"     conditions (three peers + ground line) pop, tight stagger
 *   "standing"           the ground label settles
 *   "Training can help"  training_tag drops into the card's lower-right corner
 *
 * Elements on screen: action_card (+ card_text written on it), strike, conditions (one element
 * holding the three peers, ground line and label), training_tag: four chunks, not eight.
 * Clearances (station px): strike spans the text width only, y about 528-548; tag sits at
 * x 610-870, y 600-670, so it is 30px inside the card border and >50px below the strike.
 */
Loom.scene("b23", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;

    // ---- geometry (station coords, storyboard)
    const CX = 200, CY = 300, CW = 700, CH = 400;            // action card
    const NX = 1200, NW = 560, NH = 140;                     // conditions column
    const NYS = [0, 200, 400];                                // row tops, local to the conditions element
    const GROUND = 560;                                       // ground line, local

    const conds = [
      { key: "test",    icon: "flask-conical",      label: "no checkout test" },
      { key: "staging", icon: "sliders-horizontal", label: "staging setting differs" },
      { key: "alert",   icon: "bell-off",           label: "unwatched alert" },
    ];

    // ---- 1. the action card: frame first (structure before content)
    // @form checklist_card: a card with a header strip, a kicker and an empty checkbox holding one written item
    const card = ctx.el("action_card", { x: CX, y: CY, w: CW, h: CH, kind: "card", exit: "recede" });
    kit.rect(card.inner, 0, 0, CW, CH, { fill: "surface", r: 18, crisp: true });     // solid backing
    kit.rect(card.inner, 0, 0, CW, CH, { fill: "none", r: 18 });                      // sketched outline
    kit.line(card.inner, 0, 88, CW, 88, { stroke: "ink", sw: 3 });                    // header divider
    kit.kicker(card.inner, "Action item", { x: 34, y: 22, w: 420, h: 44, color: "muted" });
    kit.rect(card.inner, CW - 34 - 46, 21, 46, 46, { fill: "none", r: 8 });           // the empty checkbox
    m.settle(card, ctx.cue("your action card"));

    // ---- 2. what is written on it: printed left to right like handwriting (a child of the card)
    const TX = 40, TY = 128, TW = CW - 80, TH = 200;
    const txt = ctx.el("card_text", { parent: card.inner, x: TX, y: TY, w: TW, h: TH, kind: "text", exit: "none" });
    const tnode = kit.text(txt.inner, "be more careful", { role: "title", x: 0, y: 0, w: TW, h: TH, maxLines: 1, size: 84, valign: "middle" });
    m.unmask(txt, ctx.cue("be more careful"), { dur: S.dur("enter") * 1.6 });

    // ---- 3. the strike: one stroke across the words only, both ends inside the card body.
    // It runs from the text's left edge to its right edge (measured), nearly level, and is finished
    // before the tag or the conditions arrive.
    const fitW = Math.min((tnode && tnode.__fit && tnode.__fit.width) || 560, TW);
    const sx0 = CX + TX - 10, sx1 = CX + TX + fitW + 10;     // station x, left to right edge of the words
    const sy = CY + TY + TH / 2;                              // vertical middle of the text line (station)
    const SPAD = 20;
    const SW_ = sx1 - sx0 + SPAD * 2, SH_ = 60;
    // @form strike_out_stroke: one hand-drawn stroke struck across an item to cancel it
    const strike = ctx.el("strike", { x: sx0 - SPAD, y: sy - SH_ / 2, w: SW_, h: SH_, kind: "mark", exit: "recede" });
    kit.sketch(Loom.svg("g", {}, strike.inner), "path",
      ["M" + SPAD + " " + (SH_ / 2 + 8) + " L" + (SW_ - SPAD) + " " + (SH_ / 2 - 8)], { fill: "none", stroke: "neg", sw: 12 });
    const tStrike = ctx.cue("Every condition");
    const dStrike = S.dur("draw") * 0.6;
    m.draw(strike, tStrike, { dur: dStrike, together: true });

    // the card (card + its text) dims on its wrapper (life), so no entrance tween is disturbed;
    // the conditions are never touched and stay at full ink
    Loom.tween(card.life, { opacity: 1 }, { opacity: 0.55, duration: S.dur("move"), ease: Loom.ease.enter },
      tStrike + dStrike * 0.55, { kind: "dim", beat: ctx.beat.id, name: "action_card", content: true });

    // ---- 4. the three conditions from b20, still standing: ONE element, peers pop in a tight stagger
    const conditions = ctx.el("conditions", { x: NX, y: 240, w: NW, h: 660, kind: "node", exit: "recede" });
    const tCond = ctx.cue("would still be");
    conds.forEach((c, i) => {
      // @form icon_label_card: a rounded card pairing an icon with a short label naming one item
      const g = Loom.svg("g", {}, conditions.inner);
      kit.rect(g, 0, NYS[i], NW, NH, { fill: "surface", r: 18, crisp: true });
      kit.rect(g, 0, NYS[i], NW, NH, { fill: "none", r: 18 });
      Loom.th.iconDisc(ctx, g, 82, NYS[i] + NH / 2, 40, c.icon, "accent2", "ink");
      kit.text(g, c.label, { role: "label", x: 150, y: NYS[i] + 14, w: NW - 150 - 24, h: NH - 28, maxLines: 2, valign: "middle", weight: 700 });
      Loom.tween(g, { opacity: 0, scale: 0.6, transformOrigin: (NW / 2) + "px " + (NYS[i] + NH / 2) + "px" },
        { opacity: 1, scale: 1, duration: S.dur("enter") * 0.8, ease: Loom.ease.enter },
        tCond + i * S.dur("stagger"), { kind: "pop", beat: ctx.beat.id, name: "conditions", content: true });
    });

    // ---- 5. the ground they stand on, and its label (same element, settles on "standing")
    const stand = Loom.svg("g", {}, conditions.inner);
    kit.line(stand, 0, GROUND, NW, GROUND, { stroke: "ink", sw: 4 });
    kit.text(stand, "conditions still standing", { role: "label", x: 0, y: GROUND + 24, w: NW, h: 56, maxLines: 1, align: "center", valign: "middle", color: "muted", weight: 700 });
    Loom.tween(stand, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: S.dur("enter"), ease: Loom.ease.enter },
      ctx.cue("standing"), { kind: "settle", beat: ctx.beat.id, name: "conditions", content: true });

    // ---- 6. training, clipped inside the card's lower-right corner (own element: stays at full ink)
    const TGW = 260, TGH = 70;
    const TGX = CX + CW - 30 - TGW, TGY = CY + CH - 30 - TGH;   // 30px inside the card border
    // @form clipped_corner_tag: a small icon tag clipped onto the corner of a card
    const tag = ctx.el("training_tag", { x: TGX, y: TGY, w: TGW, h: TGH, kind: "token", exit: "recede" });
    kit.rect(tag.inner, 0, 0, TGW, TGH, { fill: "surface", r: 16, crisp: true });
    kit.rect(tag.inner, 0, 0, TGW, TGH, { fill: "accent4", r: 16 });
    kit.icon(tag.inner, "graduation-cap", { x: 46, y: TGH / 2, size: 40, color: "ink" });
    kit.text(tag.inner, "Training", { role: "label", x: 86, y: 0, w: 140, h: TGH, maxLines: 1, valign: "middle", weight: 700 });
    kit.icon(tag.inner, "paperclip", { x: TGW - 30, y: 12, size: 36, color: "ink" });   // the clip on the tag's corner
    m.drop(tag, ctx.cue("Training can help"));
  },
});
