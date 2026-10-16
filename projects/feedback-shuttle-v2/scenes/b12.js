// @design report_then_options: one message arrives on a screen, the screen steps back, and three answers are laid out in turn
// Treatments: (1) static laptop + three cards with signalling; (2) laptop pops, email pops, laptop shrinks upward, cards slide in on their letters (chosen: each option arrives on its own words); (3) one full-screen email, cards replace it.
Loom.scene("b12", {
  build(ctx) {
    const kit = ctx.kit, m = ctx.m, sv = Loom.svg;

    // ---- the laptop: ink outline, paper fills; the held element "inbox" ----
    const LW = 1000, LH = 650, LX = 460, LY = 160;
    const inbox = ctx.el("inbox", { x: LX, y: LY, w: LW, h: LH, kind: "instrument", exit: "none" });
    kit.rect(inbox.inner, 40, 0, 920, 590, { fill: "field2", r: 28 });           // @form laptop_lid: the screen's frame
    kit.rect(inbox.inner, 70, 28, 860, 534, { fill: "surface", r: 12, flat: true }); // @form laptop_screen: the paper screen
    kit.rect(inbox.inner, 0, 590, LW, 56, { fill: "field2", r: 22 });             // @form laptop_base: the keyboard base
    kit.rect(inbox.inner, 400, 590, 200, 14, { fill: "surface2", r: 7, flat: true }); // @form laptop_notch: the thumb notch
    kit.icon(inbox.inner, "moon", { x: 846, y: 48, size: 64, color: "ink" });      // @form night_moon: it is night

    // the new email: its own element on the screen, pops on "A report lands Friday night"
    const row = ctx.el("mail_row", { x: 110, y: 190, w: 780, h: 210, kind: "card", parent: inbox, exit: "none" });
    kit.rect(row.inner, 0, 0, 780, 210, { fill: "field", r: 18 });                // @form email_row: the arriving message
    kit.disc(row.inner, 100, 105, 54, { fill: "field2" });
    kit.icon(row.inner, "mail", { x: 70, y: 75, size: 60, color: "ink" });        // @form envelope: a message
    kit.text(row.inner, "Weekly report", { role: "title", x: 190, y: 20, w: 570, h: 100, align: "left", valign: "middle", maxLines: 1, color: "ink" });
    kit.text(row.inner, "Friday 11:40 pm", { role: "lead", x: 190, y: 126, w: 570, h: 56, align: "left", valign: "middle", maxLines: 1, color: "ink" });

    // ---- the three answer cards: one kit part, held as card_a; card_b and card_c are thin markers ----
    const S = 0.9, CX = 204, CY = 510;
    const cardsEl = ctx.el("card_a", { x: CX, y: CY, w: 1680 * S, h: 420 * S, kind: "card", exit: "none" });
    const AC = Loom.lesson.answer_cards(ctx, cardsEl.inner, { scale: S });
    const mk = (name) => {
      const E = ctx.el(name, { x: CX + 1680 * S - 12, y: CY + 420 * S - 12, w: 8, h: 8, kind: "token", exit: "none" });
      sv("rect", { x: 0, y: 0, width: 8, height: 8, fill: "none", opacity: 0 }, E.inner);
      return E;
    };
    const cardB = mk("card_b"), cardC = mk("card_c");
    [cardsEl, cardB, cardC].forEach((E) => { E.ui = AC; E.cards = AC; });

    // ---- the clock ----
    const tOpen = ctx.speechStart + 0.05;
    m.pop(inbox, tOpen);
    const tMail = ctx.cue("A report lands");
    m.pop(row, tMail);

    const tA = ctx.cue("A. Be more organised");
    const tB = ctx.cue("B. It came Friday night");
    const tC = ctx.cue("C. Same facts");

    // the laptop steps up and back just before card A, so the cards have the stage (travel is relative to its placement)
    m.travel(inbox, tA - 0.75, { x: 685 - LX, y: 60 - LY, scale: 0.55 });

    AC.in(0, true, tA);
    AC.in(1, true, tB);
    AC.in(2, true, tC);
  },
});
