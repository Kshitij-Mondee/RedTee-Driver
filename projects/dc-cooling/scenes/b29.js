// @design recap_cards_into_stack: two images from earlier drift in, shrink and drop into the held picture, which grows by exactly what they were
/* b29, "Every leak we saw, lands in that top stack."  (station: pue; intent: callback; continues b28's frame)
 *
 * Three treatments considered:
 *   A. Print "row to row" and "slot" as words that fly into the stack. Rejected: the leaks were pictures (the plan,
 *      the rack section); a recap replays the lesson's own images (lnd-explainer-craft s1.15), and no new words are
 *      allowed on screen.
 *   B. Pulse the existing overhead block. Rejected: nothing would be added; the claim is that the leaks BECOME
 *      overhead, so a block has to appear.
 *   C. (wins) The note from b28 retires. Two small cards, the plan with its warm row-to-row streams (b10) and the
 *      rack section with the stream curling through the empty slot (b14), drift in from the left on "Every leak we
 *      saw" and hover above the top stack; on "lands in that top stack" both shrink down into it and one more
 *      overhead block grows on top of the cooling block (kit energy_fraction, state grown), taking the accent. The
 *      top edge rises a little; the bottom (IT energy) does not change.
 *
 * Kit use: Loom.lesson.energy_fraction (built in b27, held here as E.kit) and two reduced copies of Loom.lesson.floor_plan and
 * Loom.lesson.rack inside the cards.
 * Held: energy_fraction (kit handle in E.kit), the 1.0 readout, and b28's note and leader, which leave first. The
 * keep list also names overhead_blocks and floor_line, which are pieces of the kit part and not elements.
 */
Loom.scene("b29", {
  build(ctx) {
    const { kit, m } = ctx;

    const tLeak = ctx.cue("Every leak we saw");
    const tLands = ctx.cue("lands in that top stack");

    // ---- held: the fraction, the 1.0, and the note b28 pinned (it retires at the start of this beat)
    const E = ctx.held("energy_fraction");
    const frac = E && E.kit;
    if (!frac) throw new Error("b29: energy_fraction was not held with its kit handle (E.kit)");
    const has = (n) => Loom.report.elements.some((e) => e.beat === "b27" && e.name === n);
    const readoutName = ["readout", "readout_pue_floor"].find(has);
    const R = readoutName ? ctx.held(readoutName) : null;
    const note = ctx.held("limit_note"), leader = ctx.held("note_leader");
    ctx.held("limit_words"); ctx.held("cross_mark");               // the note leaves as one piece: its words and cross stay with it until it fades
    m.exit(note, ctx.start + 0.05, "recede");
    m.exit(leader, ctx.start + 0.05, "recede");
    E.exit = "recede";                                            // the last beat of the section: the cut to the route takes it away
    if (R) R.exit = "recede";

    // the note is gone, so the fraction glides to the middle of the frame (b27 left the right side open for the note)
    const SHIFT = 260;
    { const cur = E.__pos || { x: 0, y: 0, s: 1 }; m.travel(E, ctx.start + 0.1, { x: cur.x + SHIFT, y: cur.y, scale: cur.s, dur: 1.0 }); }
    if (R) {   // the 1.0 carries b28's camera on its outer group (b27 drives its mover): see b28
      const a = R.__cam || { x: 0, y: 0, s: 1 }, b = { x: a.x + SHIFT, y: a.y, s: a.s };
      R.__cam = b;
      Loom.drive((e) => R.outer.setAttribute("transform", `translate(${(a.x + (b.x - a.x) * e).toFixed(3)} ${(a.y + (b.y - a.y) * e).toFixed(3)}) scale(${(a.s + (b.s - a.s) * e).toFixed(4)}) translate(${R.x} ${R.y})`),
        ctx.start + 0.1, 1.0, "editorial", { key: "cam:" + R.name, kind: "travel", beat: R.beat, name: R.name, content: true });
    }

    // ---- where the stack is on screen now (b28's pull-back and the glide above are in E.__pos): screen = E.xy + pos.xy + pos.s * local
    const P = E.__pos || { x: 0, y: 0, s: 1 };
    const scr = (lx, ly) => ({ x: E.x + P.x + P.s * lx, y: E.y + P.y + P.s * ly });
    const A = frac.anchors;
    const floorLocal = A.floorLine.y + A.floorLine.h / 2;
    const landAt = scr(A.itTop.x + A.itTop.w / 2, floorLocal - 66 * frac.scale);   // the middle of the new block's place

    // ---- two small cards, each a picture from earlier (screen coordinates, outside the held elements)
    const CWd = 280, CHt = 176, PAD = 14, CY = 92;
    const cardX = [landAt.x - 166 - CWd / 2, landAt.x + 166 - CWd / 2];
    const mkCard = (name, x) => {
      const C = ctx.el(name, { x, y: CY, w: CWd, h: CHt, kind: "card", exit: "none" });
      kit.rect(C.inner, 0, 0, CWd, CHt, { fill: "surface", r: 20 });
      return C;
    };
    // @form recap_card: a small white card holding a reduced copy of an earlier picture, for a callback
    const rowsCard = mkCard("leak_card_rows", cardX[0]);
    const plan = Loom.lesson.floor_plan(ctx, rowsCard.inner, { x: PAD, y: PAD + 7, w: CWd - 2 * PAD, h: CHt - 2 * PAD, state: "same_way" });
    // the row-to-row exhaust of b10: each row's back feeds the next row's front, drawn in the plan's own scale
    plan.anchors.rows.slice(0, 3).forEach((r, i) => {
      const nx = plan.anchors.rows[i + 1], cx = r.x + r.w / 2 + (i - 1) * 24;
      kit.arrow(rowsCard.inner, cx, r.y - 1, cx, nx.y + nx.h + 3, { stroke: "accent2", sw: 3.5, head: 9 });
    });

    const slotCard = mkCard("leak_card_slot", cardX[1]);
    const rack = Loom.lesson.rack(ctx, slotCard.inner, { view: "side", state: "gap", x: (CWd - (CHt - 2 * PAD) * 700 / 860) / 2, y: PAD, h: CHt - 2 * PAD });
    rack.set("leak", 1);                                          // the stream curling back through the empty slot (b14)

    // ================================================================ the timeline
    const arrive = (C, x, t, from) => {
      C.__pos = { x: -(x + CWd + 40) + 0, y: 0, s: 1 };           // parked off the left edge until it drifts in
      C.mover.setAttribute("transform", `translate(${C.__pos.x} 0) scale(1)`);
      m.travel(C, t, { x: 0, y: 0, scale: 1, dur: 0.8 });
    };
    arrive(rowsCard, cardX[0], tLeak, 0);
    arrive(slotCard, cardX[1], tLeak + 0.3, 0);
    rack.leakFlow(tLeak + 0.3, tLands);

    // "lands in that top stack": both shrink down into the stack, a beat apart; each fades as it arrives
    const S1 = 0.26;
    [rowsCard, slotCard].forEach((C, i) => {
      const x = cardX[i], t = tLands + 0.12 * i;
      m.travel(C, t, { x: landAt.x - x - S1 * CWd / 2, y: landAt.y - CY - S1 * CHt / 2, scale: S1, dur: 0.6 });
      m.exit(C, t + 0.38, "recede", { dur: 0.25 });
    });
    // one more overhead block lands on the cooling block; the top edge rises a little (the kit moves the top bracket and label)
    frac.setState("grown", tLands + 0.4, { dur: 0.5 });
    // the new block takes the accent: the kit tints its fill and `new_block` frames it. The frame is its own element; its
    // place is the kit's own geometry (block 3 stands on the cooling block
    // at 0.4 of its height, 6 units of gap between blocks), checked on the frames.
    const s = frac.scale, topNew = floorLocal - s * 86.4, hNew = s * 36;
    const PADR = 7, k = P.s;
    // top-level (screen coordinates), so it counts as this beat's own picture; the fraction no longer moves after the glide
    const tl = scr(A.itTop.x - PADR, topNew - PADR), NW = (A.itTop.w + 2 * PADR) * k, NH = (hNew + 2 * PADR) * k;
    // @form added_block_frame: an accent outline round the one block that was added to a held stack
    const nb = ctx.el("new_block", { x: tl.x, y: tl.y, w: NW, h: NH, kind: "mark", exit: "recede" });
    kit.rect(nb.inner, 0, 0, NW, NH, { fill: "none", stroke: "accent", sw: 5, r: 12, shadow: false });
    frac.blockAccent(3, 0.35, tLands + 0.85, 0.4);
    m.reveal(nb, tLands + 0.95, { dy: 0, dur: 0.35 });
  },
});
