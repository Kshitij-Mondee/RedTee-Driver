// @design limit_note_pinned: the held picture gets one caveat pinned beside it on a leader, and the camera pulls back so picture and caveat read as one frame
/* b28, "What it does not tell you, is how useful the computing is. Useful number, not the whole story."
 * (station: pue; continues b27's fraction)
 *
 * Three treatments considered (animation gate: this beat is staging, the fraction does not change):
 *   A. Replace the fraction with a text card. Rejected: the limit must sit on the fraction it qualifies (storyboard
 *      upgrade_reason); a separate frame pulls them apart.
 *   B. Put the caveat inside the stack as a label. Rejected: the stack's labels are the kit's words (Total facility
 *      energy, IT energy); a third word on the blocks says "this block is not computing efficiency".
 *   C. (wins) The fraction holds untouched. A leader draws from the end of the fraction bar to a note card; the card
 *      settles; its words print on "how useful the computing is" and the cross mark pops; on "Useful number" the
 *      camera pulls back a little (scale 0.94) so the fraction and its note sit together. The blue that b27 gave the
 *      1.0 moves to the note (R3: the accent moves, one owner at a time): 1.0 settles to ink.
 *
 * Kit use: Loom.lesson.energy_fraction (built in b27, held here as E.kit).
 * Held from b27: energy_fraction (E.kit is the energy_fraction handle) and the 1.0 readout. The keep list names
 * overhead_blocks and floor_line, which are pieces of the kit part and not elements: see the report.
 */
Loom.scene("b28", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;

    const tTell = ctx.cue("What it does not tell you");
    const tUse = ctx.cue("how useful the computing is");
    const tComp = ctx.cue("computing");
    const tNum = ctx.cue("Useful number");

    // ---- held from b27: the fraction (with its kit handle) and the 1.0 beside it
    const E = ctx.held("energy_fraction");
    const frac = E && E.kit;
    if (!frac) throw new Error("b28: energy_fraction was not held with its kit handle (E.kit)");
    const has = (n) => Loom.report.elements.some((e) => e.beat === "b27" && e.name === n);
    const readoutName = ["readout", "readout_pue_floor"].find(has);
    const R = readoutName ? ctx.held(readoutName) : null;

    // ---- geometry, in the fraction element's own coordinates (E.inner)
    const bar = frac.anchors.bar;
    const barEnd = bar.x + bar.w, barY = bar.y + bar.h / 2;
    const cardX = 1110 - E.x;                                   // the card's left edge at screen x 1110
    const INSET = 44, CW = 648;
    const f = kit.fit("Not computing efficiency", { role: "title", w: CW - 2 * INSET, maxLines: 2, weight: 700 });
    const CH = Math.ceil(f.height) + 2 * INSET;
    const TOP = 40;                                             // room above the card for the cross mark on its corner
    const cardY = barY - TOP - CH / 2;                          // the card is level with the bar

    // ---- the leader: from the end of the bar to the card (draws INTO what follows)
    // @form leader_to_note: a thin line from the thing a caveat qualifies to the card that carries the caveat
    const lx = barEnd + 20, lw = cardX - lx;
    const leader = ctx.el("note_leader", { x: lx, y: barY - 4, w: lw, h: 8, kind: "connector", parent: E.inner });
    kit.line(leader.inner, 0, 4, lw, 4, { stroke: "line", sw: 3 });

    // ---- the note card; its words and its cross are their own elements so each can arrive on its own words
    // @form caveat_note_card: a white card pinned beside a picture that says what the picture does not show, with a cross on its corner
    const note = ctx.el("limit_note", { x: cardX, y: cardY, w: CW + 44, h: CH + TOP + 8, kind: "card", parent: E.inner });
    kit.rect(note.inner, 0, TOP, CW, CH, { fill: "surface", r: 20 });
    const words = ctx.el("limit_words", { x: INSET, y: TOP + INSET, w: CW - 2 * INSET, h: Math.ceil(f.height), kind: "text", parent: note.inner });
    kit.text(words.inner, "Not computing efficiency", { role: "title", weight: 700, x: 0, y: 0, w: CW - 2 * INSET, h: Math.ceil(f.height), align: "left", valign: "middle", maxLines: 2, color: "accent" });
    const cross = ctx.el("cross_mark", { x: CW - 56, y: TOP - 40, w: 96, h: 96, kind: "mark", parent: note.inner });
    kit.mark(cross.inner, "no", 48, 48, 84);

    // ================================================================ the timeline
    // "What it does not tell you": the leader draws from the fraction, the note card settles where it ends
    m.reveal(leader, tTell + 0.1, { dy: 0, dur: 0.05 });
    m.draw(leader.inner, tTell + 0.1, { dur: 0.7 });
    m.settle(note, tTell + 0.55, { dy: 20 });
    // the blue moves from the 1.0 to the note: one owner at a time
    if (R) {
      const tx = R.inner.querySelector("text");
      const acc = ctx.c("accent"), ink = ctx.c("ink");
      Loom.drive((e) => tx.setAttribute("fill", S.mix(acc, ink, e)), tTell + 0.55, 0.5, "move", { key: "b28.readout.ink", kind: "kit", content: true });
    }
    // "how useful the computing is": the note's words print, then the cross mark pops on the corner
    m.unmask(words, tUse, { dur: 0.9 });
    m.pop(cross, tComp + 0.15, { dur: 0.35 });
    // "Useful number, not the whole story": the camera pulls back a little; fraction and note sit as one frame.
    // The fraction (and the note inside it) moves with m.travel on its mover. The 1.0 is moved by b27's own drive on ITS
    // mover (an L-shaped path), so the camera is written on the 1.0's outer group instead: the same similarity, composed
    // above whatever its mover does (screen = pivot + s * (point - pivot) for both).
    const PIV = { x: 960, y: 500 }, SC = 0.94;
    const cur = E.__pos || { x: 0, y: 0, s: 1 };
    m.travel(E, tNum, { x: PIV.x * (1 - SC) + SC * (E.x + cur.x) - E.x, y: PIV.y * (1 - SC) + SC * (E.y + cur.y) - E.y, scale: cur.s * SC, dur: 1.2 });
    if (R) {
      R.__cam = { x: PIV.x * (1 - SC), y: PIV.y * (1 - SC), s: SC };
      const a = { x: 0, y: 0, s: 1 }, b = R.__cam;
      Loom.drive((e) => R.outer.setAttribute("transform", `translate(${(a.x + (b.x - a.x) * e).toFixed(3)} ${(a.y + (b.y - a.y) * e).toFixed(3)}) scale(${(a.s + (b.s - a.s) * e).toFixed(4)}) translate(${R.x} ${R.y})`),
        tNum, 1.2, "editorial", { key: "cam:" + R.name, kind: "travel", beat: R.beat, name: R.name, content: true });
    }
  },
});
