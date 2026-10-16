// @design signs_mark_themselves_in_order: three empty rings fill one by one as the narration finds each sign, each with a flag planted on the part of the message it names
/* b26 - "Today is the pressure. New bank details, the payment request, and that unexpected attachment. Most work
 *        attachments are genuine, so unexpected is what makes you check." (station st_supplier, continues b25).
 * Treatments considered:
 *  (A) three callout boxes listing the signs beside the message (rejected: words standing in for the places; the
 *      viewer checks their own answers against WHERE on the message each sign sits),
 *  (B) circling the parts with a marker (rejected: a hand-drawn scribble is another register, and nothing counts
 *      them against the three rings the viewer was just given),
 *  (C) CHOSEN: nothing is replaced, three small additions to the held picture. Each sign lights on its words (a
 *      band behind the word, a heat on the chip), a flag is planted on it (the pole stands on the part), a
 *      lead runs from the flag to its empty ring and the ring fills. Then a short grey row of ordinary
 *      attachments arrives beside the lit one, and on "so unexpected is what makes you check" the lit chip
 *      glows once while the grey ones stay quiet.
 * Beat sheet (anchors are spoken words):
 *   "Today is the pressure"                       today's lights, flag 1 plants, lead, ring 1 fills
 *   "New bank details, the payment request"       bank details lights, flag 2, lead, ring 2 fills (on "payment request")
 *   "and that unexpected attachment"              the chip heats, flag 3, lead, ring 3 fills
 *   "Most work attachments are genuine"           the grey row arrives (Loom.array)
 *   "so unexpected is what makes you check"       the lit chip glows once (m.glow)
 * All additions are children of supplier_msg (exit: "none"): flag_pressure, flag_request, flag_attachment (with
 * their .lead poles), signal_lead_1..3, pin_fill_1..3, ordinary_attachments. b27 holds supplier_msg and gets all of it.
 */
Loom.scene("b26", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const S = Loom.style, O = Loom.obj, T = Loom.treat, svg = Loom.svg, bid = ctx.beat.id;
    const P = Object.assign({ flags: ["pressure: today", "request: payment", "unexpected attachment"] }, props || {});

    // ---- geometry (window-local, the same numbers as b24 and b25)
    const WIN = { x: 170, y: 120, w: 1010, h: 760 };
    const RING = { x: 1045, r: 28, ys: [182, 327, 481] };
    const TY = [234, 379, 533];                                           // top of the part each flag stands on
    const dEnter = S.dur("enter"), dMove = S.dur("move");
    const tToday = ctx.cue("Today is the pressure"), tBank = ctx.cue("New bank details, the payment request"), tReq = ctx.cue("the payment request"), tAtt = ctx.cue("and that unexpected attachment");
    const tGen = ctx.cue("Most work attachments are genuine"), tCheck = ctx.cue("so unexpected is what makes you check");
    const pin = (E) => { E.exit = "none"; if (E.outer.querySelectorAll) E.outer.querySelectorAll(".lm-el").forEach((n) => { if (n.__E) n.__E.exit = "none"; }); return E; };

    // ---- held from b25: the room, the screen, the message (everything inside it), its avatar
    ["desk_world", "key_light", "mail_window", "inbox", "new_message_row", "inbox_veil", "contact_avatar"].forEach((n) => ctx.held(n));
    const msg = ctx.held("supplier_msg"), mi = msg.inner;
    const L1 = ctx.held("line_1"), L2 = ctx.held("line_2"), chip = ctx.held("attachment_chip");
    const n1 = L1.inner.querySelector("text"), n2 = L2.inner.querySelector("text");
    const f1 = n1 && n1.__fit ? n1.__fit.size : 44, f2 = n2 && n2.__fit ? n2.__fit.size : 44;
    // where the two words sit inside their lines (measured with the same face and size the lines were printed in)
    const pre1 = kit.measure("Please pay ", "lead", f1, 500), w1 = kit.measure("today's", "lead", f1, 500);
    const pre2 = kit.measure("to our new ", "lead", f2, 500), w2 = kit.measure("bank details", "lead", f2, 500);
    const POLE = [50 + pre1 + w1 / 2, 50 + pre2 + w2 / 2, 50 + 215];     // x of each pole (window-local)

    // ---- one sign: the part lights, the flag is planted on it, a lead runs to the ring, the ring fills
    // @form sign_flag_to_ring: a flag planted on a part of the picture with a lead to an empty ring that then fills, counting the signs off
    const sign = (i, name, t, tRing) => {
      const cy = RING.ys[i], to = [POLE[i], TY[i]];
      const F = T.label(ctx, name, { x: to[0], y: cy, text: P.flags[i], to, tone: "accent", t, parent: mi });
      pin(F); if (F.lead) pin(F.lead);
      const G = T.labelGeom(0, 0, P.flags[i], { as: T.pick("label") });
      const x0 = to[0] + G.w + 10, x1 = RING.x - RING.r - 10;
      const ld = ctx.el("signal_lead_" + (i + 1), { parent: mi, x: 0, y: 0, w: 0, h: 0, kind: "connector", exit: "none" });
      const ln = kit.line(ld.inner, x0, cy, x1, cy, { stroke: "accent", sw: 3, dash: "3 9", crisp: true });
      m.draw(ln, t + 0.75, { dur: dMove });
      const fill = ctx.el("pin_fill_" + (i + 1), { parent: mi, x: RING.x - 24, y: cy - 24, w: 48, h: 48, kind: "token", exit: "none" });
      kit.disc(fill.inner, 24, 24, 21, { fill: "accent", flat: true, shadow: false });
      kit.icon(fill.inner, "flag", { x: 24, y: 24, size: 24, color: "onAccent" });
      m.pop(fill, tRing, { overshoot: false });
    };

    // ---- 1. "Today is the pressure": the word lights in its line
    m.highlight(n1, tToday, { x: pre1, w: w1, color: "accent", opacity: 0.34 });
    sign(0, "flag_pressure", tToday + 0.3, tToday + 1.35);

    // ---- 2. "New bank details, the payment request": the words light, the flag plants, the ring fills on "payment request"
    m.highlight(n2, tBank, { x: pre2, w: w2, color: "accent", opacity: 0.34 });
    sign(1, "flag_request", tBank + 0.3, tReq + 0.45);

    // ---- 3. "and that unexpected attachment": the chip heats (fill and outline), flag 3 plants, ring 3 fills
    Loom.hold.heat([chip], tAtt, { from: "surface2", to: "accent4", dur: dMove * 2, name: "attachment_chip" });
    Loom.hold.heat([chip], tAtt, { from: "line", to: "accent", dur: dMove * 2, attr: "stroke", name: "attachment_chip.edge" });
    sign(2, "flag_attachment", tAtt + 0.3, tAtt + 1.35);

    // ---- 4. "Most work attachments are genuine": a grey row of ordinary attachments beside the lit one
    // @form ordinary_attachment_row: a short seeded row of grey document chips standing for the ordinary, expected files
    const ord = Loom.array(ctx, "ordinary_attachments", { parent: mi, x: 505, y: 533, w: 476, h: 90, cols: 4, rows: 1, dx: 122, dy: 0, order: "row", t: tGen + 0.1, stagger: 0.14, rise: 14, seed: "supplier_ordinary",
      draw: (g, i, r, c, rnd) => {
        kit.rect(g, 0, 0, 110, 90, { fill: "surface2", r: 10, stroke: "line", sw: 2, crisp: true, opacity: 0.6 });
        const d = svg("g", { opacity: 0.5 }, g);
        O.shape(d, "document", 34, 45, 50, { detail: 1, key: "ord_" + i, shadow: false });
        kit.rect(g, 62, 30 + rnd() * 6, 34, 10, { fill: "line", r: 5, crisp: true });
        kit.rect(g, 62, 50, 22 + rnd() * 10, 9, { fill: "line", r: 4, crisp: true, opacity: 0.7 });
        if (i % 2 === 1) kit.icon(g, "paperclip", { x: 90, y: 74, size: 18, color: "muted" });
      } });
    pin(ord);

    // ---- 5. "so unexpected is what makes you check": the one lit chip glows once; the grey ones stay quiet
    m.glow(chip, tCheck, { color: "accent", dur: 1.1, pad: 14 });
  },
});
