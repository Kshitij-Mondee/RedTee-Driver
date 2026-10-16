// @design two_equal_vessels_fill: two identical vessels take the same units; one reaches its brim after a few, the other is still far from full
/* b19, air and water. "Air can only carry so much. Water carries far more heat, in the same space." No numbers anywhere:
 * the counts are a picture of far more, not a measurement (knowledge F12, said as a comparison only). Corporate-clean.
 *
 * Three treatments considered:
 *   A. two bars, one tall one short (a chart of a number the lesson does not give, and bars read as a ranking);
 *   B. two icons with a "more than" sign between them (a statement, nothing the viewer can watch);
 *   C. (chosen) two EQUAL clear boxes, the same heat blocks dropping into both. In each box the blocks are taken up
 *      by a warm level that rises: in the Air box each block lifts it a quarter of the way, so four blocks fill it to the
 *      brim and the rim marks full; in the Water box each block barely moves it, so far more blocks arrive and it is
 *      still far from full. A bracket under both boxes says they are the same size. Motion is the content: filling
 *      is a change over time and the two boxes fill at different rates.
 * Why the blocks are taken up by a level instead of stacking: the blocks are the same size in both boxes, so stacked
 * blocks could only show the same count in the same space; a rising level shows how much each block changes the box.
 */
Loom.scene("b19", {
  build(ctx) {
    const { kit, m } = ctx;
    const T = Loom.treat;

    const tAir = ctx.cue("Air can only carry so much");
    const tWater = ctx.cue("Water carries far more heat");
    const tSame = ctx.cue("in the same space");

    // ---- the set: a shelf and two identical boxes (same outline, same size), centred in the frame
    const BW = 500, BH = 480, OY = 80;                 // box size; OY = headroom above a box for the blocks as they fall in
    const BT = 262;                                    // frame y of a box's top rim
    const XA = 330, XW = 1090;                         // frame x of the Air box and the Water box (a 260 px gap)
    const root = ctx.el("boxes", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" });
    kit.rect(root.inner, XA - 100, BT + BH, XW + BW - XA + 200, 28, { fill: "surface2", r: 8, shadow: false });   // the bench they stand on
    m.reveal(root, ctx.start + 0.1, { dy: 0 });

    const BLOCK_W = 56, BLOCK_H = 38, PAD = 12;
    const IH = BH - 2 * PAD;                            // inside height: the most a box can hold
    const FALL = 0.34, MELT = 0.16, RISE = 0.25;

    // @form fill_level_vessel: a clear vessel whose warm level rises by a set step for each unit that drops in
    const makeBox = (name, x, o) => {
      const E = ctx.el(name, { x, y: BT - OY, w: BW, h: BH + OY, kind: "vessel", parent: root.inner });
      const g = E.inner;
      kit.rect(g, 0, OY, BW, BH, { fill: "surface", r: 18, stroke: o.stroke, sw: o.sw });
      const clipId = Loom.uid("b19clip");
      const cp = Loom.svg("clipPath", { id: clipId }, Loom.svg("defs", {}, g));
      Loom.svg("rect", { x: PAD, y: OY + PAD, width: BW - 2 * PAD, height: BH - 2 * PAD, rx: 10 }, cp);
      const inside = Loom.svg("g", { "clip-path": "url(#" + clipId + ")" }, g);
      if (o.tint) Loom.svg("rect", { x: PAD, y: OY + PAD, width: BW - 2 * PAD, height: BH - 2 * PAD, fill: ctx.c("accent"), opacity: 0.07 }, inside);
      const level = Loom.svg("rect", { x: PAD, y: OY + BH - PAD, width: BW - 2 * PAD, height: 0, fill: ctx.c("accent2"), opacity: 0.75 }, inside);
      return { E, g, level };
    };
    const air = makeBox("box_air", XA, { stroke: "line", sw: 5, tint: false });
    const water = makeBox("box_water", XW, { stroke: "accent", sw: 7, tint: true });

    // ---- the blocks: each falls in, lands on the level, and is taken up by it (the level rises by `step` of the inside height)
    const eio = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
    const fillBox = (box, seedKey, n, t0, gap, step, onLand) => {
      const rnd = Loom.rng(seedKey);
      const bl = [];
      for (let j = 0; j < n; j++) {
        const node = Loom.svg("rect", { width: BLOCK_W, height: BLOCK_H, rx: 6, fill: ctx.c("accent2"), opacity: 0 }, box.g);
        // right part of the box only: the label flag stands on the left corner above it
        const x = 200 + Math.round(rnd() * (BW - PAD - BLOCK_W - 200));
        const tj = t0 + j * gap;
        bl.push({ node, x, tj, land: OY + BH - PAD - j * step * IH - BLOCK_H });
        if (onLand) onLand(tj + FALL, j);
      }
      const tEnd = bl[n - 1].tj + FALL + MELT + RISE + 0.05;
      const lvAt = (t) => bl.reduce((s, b) => s + step * eio((t - (b.tj + FALL)) / RISE), 0);
      const apply = (t) => {
        const L = Math.min(1, lvAt(t)), h = L * IH;
        box.level.setAttribute("y", (OY + BH - PAD - h).toFixed(2));
        box.level.setAttribute("height", h.toFixed(2));
        for (const b of bl) {
          const u = (t - b.tj) / FALL;
          let y = -BLOCK_H - 30, op = 0;
          if (u > 0 && u < 1) { y = (-BLOCK_H - 30) + (b.land - (-BLOCK_H - 30)) * Loom.ease.enter(u); op = Math.min(1, u * 5); }
          else if (u >= 1) { y = b.land; op = Math.max(0, 1 - (t - b.tj - FALL) / MELT); }
          b.node.setAttribute("transform", "translate(" + b.x + " " + y.toFixed(2) + ")");
          b.node.setAttribute("opacity", op.toFixed(3));
        }
      };
      apply(t0 - 0.05);
      Loom.drive((e, raw) => apply(t0 - 0.05 + raw * (tEnd - (t0 - 0.05))), t0 - 0.05, tEnd - (t0 - 0.05), "linear", { kind: "drop", name: box.E.name, content: true });
      return { tEnd, last: bl[n - 1].tj + FALL + RISE };
    };

    // "Air can only carry so much": four blocks, 0.45 s apart, each lifts the level a quarter; the fourth fills it to the brim
    const a = fillBox(air, "b19:air", 4, tAir + 0.25, 0.45, 0.25, (t) => Loom.sfx("land", t));
    // "Water carries far more heat": far more blocks, 0.1 s apart, each barely lifts the level (still far from full at the end)
    const w = fillBox(water, "b19:water", 28, tWater + 0.05, 0.1, 0.0125);

    // ---- the rim marks full the moment the Air box reaches its brim
    // @form full_rim_mark: a thick warm line drawn along a vessel's rim when it is full
    const rim = Loom.svg("path", { d: "M 26 " + OY + " H " + (BW - 26), fill: "none", stroke: ctx.c("accent2"), "stroke-width": 9, "stroke-linecap": "round" }, air.g);
    m.draw(rim, a.last - 0.05, { dur: 0.4 });
    Loom.sfx("chime", a.last + 0.1);

    // ---- the labels, on their words: flags planted on each box's rim
    const flag = (name, text, boxX, tone, t) => {
      const G = T.labelGeom(0, 0, text, { role: "label" });
      const to = [boxX + 40, BT];
      return T.label(ctx, name, { x: to[0] + G.tw / 2, y: to[1] - 24 - G.h / 2, text, to, tone, role: "label", t, parent: root.inner });
    };
    flag("label_air", "Air", XA, "accent3", tAir - 0.1);
    flag("label_water", "Water", XW, "accent", tWater - 0.1);

    // ---- "in the same space": a bracket under each box and an equals sign between them, drawn on the words
    // @form same_size_bracket: a bracket under each of two things of equal width with an equals sign between them
    const br = ctx.el("same_bracket", { x: XA, y: BT + BH + 56, w: XW + BW - XA, h: 84, kind: "connector", parent: root.inner });
    const bg = br.inner, by = 22;
    const U = (x0) => "M " + x0 + " " + (by - 16) + " V " + by + " H " + (x0 + BW) + " V " + (by - 16);
    const p1 = kit.path(bg, U(0), { stroke: "line", sw: 4 }), p2 = kit.path(bg, U(XW - XA), { stroke: "line", sw: 4 });
    const mid = (XW - XA) / 2 + BW / 2 + 0;       // centre of the gap between the boxes
    const e1 = kit.line(bg, mid - 28, by - 12, mid + 28, by - 12, { stroke: "line", sw: 6 });
    const e2 = kit.line(bg, mid - 28, by + 12, mid + 28, by + 12, { stroke: "line", sw: 6 });
    m.draw(p1, tSame, { dur: 0.6 });
    m.draw(p2, tSame, { dur: 0.6 });
    m.draw(e1, tSame + 0.35, { dur: 0.3 });
    m.draw(e2, tSame + 0.35, { dur: 0.3 });
  },
});
