// @design limit_reached_then_left: a stack falls onto its floor line and the one value is read there, then a little returns above it
/* b27, the PUE fraction: the overhead shrinks to the 1.0 floor, then returns above it.
 * Three treatments considered (animation gate: motion only where the taught thing changes over time):
 *   A. a counter that runs from 1.6 down to 1.0 (rejected: it would print a number the knowledge sheet does not carry,
 *      and the lesson says only the floor, 1.0);
 *   B. a gauge needle that falls to a mark (rejected: the fraction made of energy blocks is already on screen and is
 *      the idea; a needle would be a second picture of the same thing);
 *   C. WINNER: the kit energy_fraction, built. The overhead blocks shrink away one by one and the top stack drops to
 *      equal the bottom (the change over time IS the meaning), the floor line draws, 1.0 appears beside the bar,
 *      then a little overhead returns (the cooling block, smaller) and 1.0 travels up to label the floor line.
 * The only number on screen is 1.0 (spoken in the beat); the part itself prints none.
 */
Loom.scene("b27", {
  build(ctx) {
    const { kit, m } = ctx;
    const tAll = ctx.cue("If it all went to IT");
    const tFloor = ctx.cue("PUE would be 1.0");
    const tReal = ctx.cue("Real sites sit above it");

    // ---- the fraction (kit energy_fraction), natural 900 x 760, drawn at 1.05 and left of centre
    const K = 1.05, FW = 900 * K, FH = 760 * K, FX = 150, FY = 104;
    const E = ctx.el("energy_fraction", { x: FX, y: FY, w: FW, h: FH, kind: "instrument", exit: "none" });
    const frac = Loom.lesson.energy_fraction(ctx, E.inner, { w: FW, h: FH, state: "built", hide: ["floor_line"] });
    E.kit = frac;
    const A = frac.anchors;

    // the pieces b28 and b29 keep by name, each with the box of what it stands for (element coords = kit anchors)
    // @form named_region_box: an element with the true box of a region that a kit part draws, so a storyboard can keep it by name
    const mkPart = (name, r) => {
      const P = ctx.el(name, { x: r.x, y: r.y, w: Math.max(4, r.w), h: Math.max(4, r.h), kind: "scenery", parent: E.inner });
      kit.rect(P.inner, 0, 0, Math.max(4, r.w), Math.max(4, r.h), { fill: "none", shadow: false });
      return P;
    };
    mkPart("overhead_blocks", A.topStack);
    mkPart("floor_line", A.floorLine);

    // ---- the readout: 1.0 beside the bar, then it labels the floor line (the one number on screen)
    // @form value_on_a_limit_line: the single spoken value sits beside the part, then moves to label the limit line
    const RW = 190, RH = 96;
    const rx = FX + A.readout.x + 24, ry = FY + A.readout.y - RH / 2;
    const R = ctx.el("readout", { x: rx, y: ry, w: RW, h: RH, kind: "value", exit: "recede" });
    kit.text(R.inner, "1.0", { role: "title", weight: 700, x: 0, y: 0, w: RW, h: RH, align: "left", valign: "middle", maxLines: 1, color: "accent" });
    // where it ends up: just above the floor line at its right end (clear of the stack and the labels)
    const endX = FX + A.floorLine.x + A.floorLine.w - 170, endY = FY + A.floorY - RH - 6;

    // ================================================================ the timeline
    // "If it all went to IT": the fraction settles (built), then the overhead blocks shrink away one by one
    m.settle(E, ctx.start + 0.05, { dur: 0.45 });
    const tShrink = Math.max(tAll + 0.15, ctx.start + 0.65);
    frac.setState("ideal", tShrink, { dur: 0.5, stagger: 0.2 });
    // "PUE would be 1.0": 1.0 appears beside the bar and the floor line draws
    m.reveal(R, tFloor, { dy: 8 });
    frac.reveal("floor_line", tFloor + 0.1, { dur: 0.6, dy: 0 });
    // "Real sites sit above it": a little overhead returns, the top settles just above the floor line, 1.0 moves to it
    frac.setState("real", tReal, { dur: 0.6 });
    // an L-shaped path (right along the bar level, then up) so it never crosses the "Total facility energy" label
    const dx = endX - rx, dy = endY - ry, lenA = Math.abs(dx), lenB = Math.abs(dy), tot = lenA + lenB;
    Loom.drive((e) => {
      const d = e * tot, px = Math.min(d, lenA) * Math.sign(dx), py = Math.max(0, d - lenA) * Math.sign(dy);
      R.mover.setAttribute("transform", `translate(${Math.round(px * 10) / 10} ${Math.round(py * 10) / 10})`);
    }, tReal + 0.25, 1.1, "editorial", { kind: "travel", beat: R.beat, name: R.name, content: true });
  },
});
