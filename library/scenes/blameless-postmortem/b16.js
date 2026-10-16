// @design strike_and_replace: a held item is struck out, a better version is written beside it, and an arrow from each drops into what it yields
/* b16 - the rewrite, made in front of the viewer, on the very bubble the room just heard.
 * Treatments considered:
 *   (A) both questions side by side as a static two-column card (rejected: it tells the swap, it does
 *       not show an edit being made, and it throws away the bubble the viewer just heard),
 *   (B) the old bubble morphs into the new wording (rejected: morphing hides that one is REPLACED and
 *       the other is kept as evidence; the strike is the lesson),
 *   (C) CHOSEN: strike the held bubble, write the better one beside it, draw an arrow from each down to
 *       what it yields. Motion is content: the order strike -> write -> consequence IS the move taught.
 * Held from b15 (never animated here): line_1, the manager's bubble at x 540, y 150 (560 x 150, tail down-left).
 * Build grammar: strike (edit) -> replacement unmasks like handwriting -> each yield's arrow draws INTO its
 * card, then the card lands (name = settle, fix = stamp, the consequence, last).
 */
Loom.scene("b16", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const dEnter = ctx.style.dur("enter");

    // ---- geometry (station coords, matched to b15's held line_1)
    const OLD = { x: 540, y: 150, w: 560, h: 150 };           // line_1, drawn by b15
    const NEW = { x: 1180, y: 150, w: 560, h: 150 };          // the better question, same size
    const CARD = { w: 440, h: 120, y: 470 };
    const NAME = { x: 600, y: CARD.y };                        // centre x 820 = under line_1
    const FIX = { x: 1240, y: CARD.y };                        // centre x 1460 = under the new bubble

    // ---- times (all from narration)
    const tStrike = ctx.cue("Here is the rewrite");
    const tWrite = ctx.cue("What did the deploy screen show you");
    const tNameArrow = ctx.cue("One question gets a name");
    const tNameCard = ctx.cue("gets a name");
    const tFixArrow = ctx.cue("The other gets");
    const tFixCard = ctx.cue("something to fix");

    // ---- 1. the strike: one hand-drawn stroke across the held bubble (line_1 itself does not move)
    // @form strike_out_stroke: one hand-drawn stroke struck across an item to cancel it
    const strike = ctx.el("strike", { x: OLD.x, y: OLD.y, w: OLD.w, h: OLD.h, kind: "mark", exit: "recede" });
    kit.path(strike.inner, "M20 84 C 150 64, 300 102, 540 68", { stroke: "neg", sw: 11 });
    m.draw(strike, tStrike, { dur: dEnter * 1.5 });

    // ---- 2. the better question is written beside it (unmasks left to right like handwriting)
    // @form speech_bubble: a rounded bubble with a tail carrying one spoken or recalled line
    const what = ctx.el("what_q", { x: NEW.x, y: NEW.y, w: NEW.w, h: 210, kind: "bubble", exit: "recede" });
    kit.rect(what.inner, 0, 0, NEW.w, NEW.h, { fill: "accent2", r: 34, shadow: false });
    kit.polygon(what.inner, [[NEW.w - 130, NEW.h - 10], [NEW.w - 40, NEW.h + 50], [NEW.w - 70, NEW.h - 10]], { fill: "accent2" });
    kit.text(what.inner, "What did the deploy screen show you?", { role: "body", x: 30, y: 0, w: NEW.w - 60, h: NEW.h, maxLines: 3, valign: "middle", color: "field", weight: 800 });
    m.unmask(what, tWrite, { dur: dEnter * 3 });

    // ---- 3. what each question gets you: an arrow draws down from its bubble INTO the card, then the card lands
    const yieldOf = (key, arrowX, tArrow, card, o) => {
      const link = ctx.el("link_" + key, { x: 0, y: 0, w: 1, h: 1, kind: "connector", exit: "recede" });
      // @form arrow_into_target: an arrow drawn from a source into a target, its head landing as the stroke arrives
      const a = kit.arrow(link.inner, arrowX, OLD.y + OLD.h + 12, arrowX, CARD.y - 8, { stroke: o.arrow, sw: 5 });
      const dDraw = ctx.style.dur("draw") * 0.9;
      m.draw(a.path, tArrow, { dur: dDraw });
      Loom.tween(a.head, { opacity: 0 }, { opacity: 1, duration: ctx.style.dur("stagger") }, tArrow + dDraw - ctx.style.dur("stagger"), { kind: "draw", beat: ctx.beat.id, content: true });
      link.revealT = tArrow;

      // @form icon_label_card: a rounded card pairing an icon with a short label naming one item
      const E = ctx.el("gets_" + key, { x: card.x, y: card.y, w: CARD.w, h: CARD.h, kind: "card", exit: "recede" });
      kit.rect(E.inner, 0, 0, CARD.w, CARD.h, { fill: "surface", r: 24, stroke: o.frame, sw: o.sw, shadow: false });
      kit.icon(E.inner, o.icon, { x: 68, y: CARD.h / 2, size: 60, color: o.iconColor });
      kit.text(E.inner, o.label, { role: "lead", x: 120, y: 0, w: CARD.w - 120 - 24, h: CARD.h, maxLines: 1, valign: "middle", color: o.text, weight: 800 });
      return E;
    };

    const nameCard = yieldOf("name", NAME.x + CARD.w / 2, tNameArrow, NAME, { arrow: "muted", frame: "muted", sw: 3.2, icon: "user", iconColor: "muted", label: "a name", text: "muted" });
    m.settle(nameCard, tNameCard);

    const fixCard = yieldOf("fix", FIX.x + CARD.w / 2, tFixArrow, FIX, { arrow: "accent4", frame: "accent4", sw: 5, icon: "wrench", iconColor: "accent4", label: "something to fix", text: "ink" });
    m.stamp(fixCard, tFixCard);

    void S;
  },
});
