// @design answer_carried_back: a hypothetical answer is carried backward along a held timeline, dips over each moment and finds nothing to land on
/* b13 - hindsight bias. The held timeline (b11 spine/markers/frames, b12 screens and sense ticks) stays;
 * the hindsight answer is drawn as a grey dashed card at "now" and carried back along the night.
 * It finds itself on no screen.
 * Treatments considered:
 *  (A) a definition card for "hindsight bias" over the timeline (rejected: it asserts, and the timeline
 *      under it would be decoration),
 *  (B) a second timeline drawn as "what we know now" (rejected: doubles the element count and the
 *      viewer must compare two timelines instead of watching one answer fail to land),
 *  (C) CHOSEN: carry the answer itself. A dashed grey card drops at the right end (now), hops right to
 *      left and dips over screen 3, 2, 1; nothing lands on any frame. Right
 *      to left is backwards in time, which is exactly the claim. Then the term is printed under the
 *      card, the bad outcome is stamped at the spine's end, and the held ticks pulse once on the
 *      closing line (the ONE emphasis).
 * Elements created (all on st_timeline): hindsight_card, term, outcome.
 * Elements held from b11/b12 (keep): rule_header, step_tag, spine, markers, frames, caption,
 *   screen_1..3, sense_ticks. Nothing held is redrawn.
 */
Loom.scene("b13", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const beat = ctx.beat.id;

    // geometry as b11/b12 drew it: frames 300x200 at y 380 above markers at x 520 / 960 / 1400
    const FY = 380, FW = 300;
    const FX = [370, 810, 1250];
    const MX = [520, 960, 1400];

    // ------------------------------------------------------------------ hindsight_card
    // resting position: above the right end of the spine ("now"), x 1400-1720, y 200-290
    const CX = 1400, CY = 190, CW = 320, CH = 76;   // CH 76 (was 90) buys a 24 px gap above the term without touching frame 3
    // @form ghost_card: a grey dashed card carrying a hypothetical idea that is not real
    const card = ctx.el("hindsight_card", { x: CX, y: CY, w: CW, h: CH, kind: "card", exit: "recede" });
    const r = 16, x0 = 2, y0 = 2, x1 = CW - 2, y1 = CH - 2;
    kit.path(card.inner,
      `M${x0 + r} ${y0} H${x1 - r} Q${x1} ${y0} ${x1} ${y0 + r} V${y1 - r} Q${x1} ${y1} ${x1 - r} ${y1} H${x0 + r} Q${x0} ${y1} ${x0} ${y1 - r} V${y0 + r} Q${x0} ${y0} ${x0 + r} ${y0} Z`,
      { stroke: "muted", sw: 3.2, dash: "13 10", fill: "surface" });
    kit.icon(card.inner, "lightbulb", { x: 46, y: CH / 2, size: 46, color: "muted" });
    kit.text(card.inner, "Obvious now", { role: "lead", x: 82, y: 0, w: 222, h: CH, maxLines: 1, valign: "middle", color: "muted" });
    m.drop(card, ctx.cue("looks obvious now"));

    // ------------------------------------------------------------------ the carry: right to left, back in time
    // one progress drives x and y (value travel: the motion IS the claim). Offsets from the resting position.
    const DIP_DY = 50;                                   // dip lowers the card 50 px toward the frame
    const dip = MX.map((mx) => ({ dx: mx - (CX + CW / 2), dy: DIP_DY }));   // centred over each marker
    const REST = { dx: 0, dy: 0 };
    const s = ctx.cue("It was not");                     // "It was not on anyone's screen then."
    const hops = [                                       // [start, end] seconds after s (each ~0.55 s, air between)
      { a: 0.05, b: 0.60, from: REST,   to: dip[2], lift: 0 },     // rest -> over screen 3
      { a: 0.72, b: 1.27, from: dip[2], to: dip[1], lift: 40 },    // hop to screen 2
      { a: 1.38, b: 1.93, from: dip[1], to: dip[0], lift: 40 },    // hop to screen 1
      { a: 2.15, b: 2.95, from: dip[0], to: REST,   lift: 34 },    // lift back to rest, "now"
    ];
    const D = hops[hops.length - 1].b;
    const ease = Loom.ease.editorial;
    Loom.drive((e, raw) => {
      const lt = raw * D;
      let x = 0, y = 0;
      for (const h of hops) {
        if (lt >= h.b) { x = h.to.dx; y = h.to.dy; continue; }
        if (lt > h.a) {
          const u = (lt - h.a) / (h.b - h.a), q = ease(u);
          x = h.from.dx + (h.to.dx - h.from.dx) * q;
          y = h.from.dy + (h.to.dy - h.from.dy) * q - h.lift * Math.sin(Math.PI * u);
        } else { x = h.from.dx; y = h.from.dy; }
        break;
      }
      card.mover.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
    }, s, D, "linear", { kind: "value_travel", beat, name: "hindsight_card", content: true });

    // (miss marks removed after review: a grey ban badge on each frame corner read as an unexplained
    // "X" beside b11's eye badge, and the narration never names it. The carry itself is the refutation:
    // the card dips over each screen and lifts away with nothing landed.)

    // ------------------------------------------------------------------ term: printed under the card
    // card bottom is y 266; term box starts at 290 (24 px clear), glyphs end ~y 364, frame 3 top is 380
    const term = ctx.el("term", { x: 1400, y: 290, w: 400, h: 84, kind: "text", exit: "wipe" });
    kit.text(term.inner, "hindsight bias", { role: "title", x: 0, y: 0, w: 400, h: 84, maxLines: 1, color: "accent" });
    m.unmask(term, ctx.cue("hindsight bias"));

    // ------------------------------------------------------------------ outcome: the bad ending, stamped at the spine's end
    // sits ON the spine line, ending flush with the arrowhead (chevron starts x 1690): x 1460-1680, ends 240 px from the right edge
    // @form verdict_stamp: a short label stamped as a pill or tilted note, coloured to carry its valence
    const out = ctx.el("outcome", { x: 1460, y: 612, w: 220, h: 56, kind: "stamp", exit: "recede" });
    kit.pill(out.inner, 0, 0, 220, 56, { fill: "neg", crisp: true, shadow: false });
    kit.text(out.inner, "Orders stopped", { role: "label", x: 10, y: 0, w: 200, h: 56, maxLines: 1, align: "center", valign: "middle", weight: 800, color: S.pickTokenOn("neg") });
    m.stamp(out, ctx.cue("a bad ending"));

    // ------------------------------------------------------------------ the ONE emphasis: the held sense ticks pulse once, left to right
    const tPulse = ctx.cue("why each move made sense");
    const rec = Loom.ctxScene;
    const ticks = rec && rec.els.find((e) => e.name === "sense_ticks");
    if (!ticks) {
      Loom.error("sense_ticks_missing", `${beat}: sense_ticks was not held from b12`, { beat });
    } else {
      let kids = Array.from(ticks.inner.children).filter((n) => n.tagName === "g");
      if (kids.length !== 3) {
        Loom.warn("sense_ticks_shape", `${beat}: expected 3 tick groups in sense_ticks, found ${kids.length}; pulsing the element as one`);
        m.emphasis(ticks, tPulse, { amount: 0.15 });
      } else {
        kids.forEach((g, i) => m.emphasis(g, tPulse + i * 0.12, { amount: 0.15 }));
      }
    }
  },
});
