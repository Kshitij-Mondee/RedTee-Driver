// @design walk_up_mark_and_tag: the camera walks up to one object in a row of look-alikes, outlines the odd one out and hangs a tag on it
/* b17, the walk-through. "Say you spot an open slot. Tell the team who runs the floor." (a hypothetical walk-through:
 * no person is drawn, and the tag only says tell the floor team, never fix it yourself). Corporate-clean.
 *
 * Three treatments considered:
 *   A. a template card: "Open slot? Tell the floor team" on a plain field (the instruction without the slot);
 *   B. a first-person aisle in full perspective (a 3D look: the 3D clips already carry b13 and b15);
 *   C. (chosen) the rack from b13 face-on (kit rack, front view, state gap), the row of racks dimmed to either side in a
 *      gentle perspective on a tiled floor; the camera walks up to it (a push), an accent outline DRAWS round the open
 *      slot on "an open slot", then a tag hangs from the slot rim and a short arrow leads toward the end of the aisle.
 * Why C: the viewer has to recognise the slot as it looks from the aisle, with the tag on the thing itself. Motion is
 * staging only (guide: a held layout, one push, two things that arrive on their words).
 */
Loom.scene("b17", {
  build(ctx) {
    const { kit, m } = ctx;
    const T = Loom.treat;

    const tWalk = ctx.cue("Say you spot an open slot");
    const tSlot = ctx.cue("an open slot");
    const tTag = ctx.cue("Tell the team who runs the floor");

    // ---- the set: one element, so the camera carries the floor, the row and the rack together
    const PX = 610, PY = 70;                 // the kit rack (natural 700 x 860, front view) in the frame
    const E = ctx.el("aisle_view", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    const g = E.inner;
    const VY = 340;                           // eye height: the vanishing line sits at the open slot
    const TOP = PY + 30, BOT = PY + 770;      // the cabinet's top and base in the frame
    // the rows to either side, each narrower and lower toward the frame edge (kIn, kOut: how far it has shrunk)
    const NB = [
      { xIn: PX + 102, xOut: PX - 298, kIn: 1, kOut: 0.9 },
      { xIn: PX - 306, xOut: PX - 690, kIn: 0.9, kOut: 0.8 },
      { xIn: PX + 598, xOut: PX + 998, kIn: 1, kOut: 0.9 },
      { xIn: PX + 1006, xOut: PX + 1390, kIn: 0.9, kOut: 0.8 },
    ];
    const baseY = (k) => VY + (BOT - VY) * k;
    // @form tiled_floor_row: a perspective tile floor under a row of look-alike cabinets, the row dimmed away from the subject
    const floorPts = [[NB[1].xOut, baseY(0.8)], [NB[0].xOut, baseY(0.9)], [PX + 102, baseY(1)], [PX + 598, baseY(1)], [NB[2].xOut, baseY(0.9)], [NB[3].xOut, baseY(0.8)], [NB[3].xOut, 1090], [NB[1].xOut, 1090]];
    kit.rect(g, 0, TOP - 34, 1920, 18, { fill: "surface2", r: 0, shadow: false });            // an overhead cable tray
    for (let i = 0; i < 24; i++) kit.rect(g, 40 + i * 80, TOP - 34, 6, 18, { fill: "field2", r: 0, shadow: false });
    const clipId = Loom.uid("b17floor");
    const cp = Loom.svg("clipPath", { id: clipId }, Loom.svg("defs", {}, g));
    Loom.svg("polygon", { points: floorPts.map((q) => q.join(",")).join(" ") }, cp);
    kit.polygon(g, floorPts, { fill: "field2" });
    const fl = Loom.svg("g", { "clip-path": "url(#" + clipId + ")" }, g);
    for (let i = -7; i <= 7; i++) {
      const xb = 960 + i * 230, xt = 960 + (xb - 960) * (baseY(1) - VY) / (1080 - VY);
      kit.line(fl, xt, baseY(1) - 4, xb, 1090, { stroke: "line", sw: 2, opacity: 0.28 });
    }
    [0.9, 0.8, 0.7].forEach((z) => kit.line(fl, 0, VY + (BOT - VY) / z, 1920, VY + (BOT - VY) / z, { stroke: "line", sw: 2, opacity: 0.28 }));
    const dim = Loom.svg("g", { opacity: 0.42 }, g);
    NB.forEach((r) => {
      const kk = (u) => r.kIn + (r.kOut - r.kIn) * u;
      const P = (u, v) => { const k = kk(u), t = VY + (TOP - VY) * k, b = VY + (BOT - VY) * k; return [r.xIn + (r.xOut - r.xIn) * u, t + v * (b - t)]; };
      const quad = (u0, u1, v0, v1, fill) => kit.polygon(dim, [P(u0, v0), P(u1, v0), P(u1, v1), P(u0, v1)], { fill });
      quad(0, 1, 0, 1, "ink");
      quad(0.05, 0.95, 0.02, 0.985, "line");
      for (let i = 0; i < 8; i++) quad(0.1, 0.9, 0.04 + i * 0.1175, 0.04 + i * 0.1175 + 0.1, "surface2");
    });

    // ---- the rack from b13, face-on: the kit's front view, state gap (the open slot third from the top)
    const rack = Loom.lesson.rack(ctx, g, { x: PX, y: PY, view: "front", state: "gap" });
    m.reveal(E, ctx.start + 0.05, { dy: 0 });

    // ---- the walk: a push toward the rack over 1.4 s, as the sentence starts
    Loom.cam.frame(E, { x: 600, y: 200, w: 720, h: 500 }, tWalk, 1.4, { margin: 60, maxScale: 1.22, cx: 960, cy: 490 });

    // ---- the open slot, outlined in the one accent: the outline DRAWS round it on "an open slot"
    const s = rack.anchors.slot, M = 12, R = 14;
    const OW = s.w + 2 * M, OH = s.h + 2 * M;
    const outline = ctx.el("slot_outline", { x: s.x - M, y: s.y - M, w: OW, h: OH, kind: "instrument", parent: g });
    const d = "M " + R + " 0 H " + (OW - R) + " A " + R + " " + R + " 0 0 1 " + OW + " " + R + " V " + (OH - R) + " A " + R + " " + R + " 0 0 1 " + (OW - R) + " " + OH +
      " H " + R + " A " + R + " " + R + " 0 0 1 0 " + (OH - R) + " V " + R + " A " + R + " " + R + " 0 0 1 " + R + " 0";
    const ol = kit.path(outline.inner, d, { stroke: "accent", sw: 6 });
    m.draw(ol, tSlot, { dur: 0.6 });

    // ---- the tag hangs from the slot rim on "Tell the team who runs the floor", and its arrow leads toward the aisle end
    const TXT = "Open slot? Tell the floor team";
    const G = T.labelGeom(0, 0, TXT, { as: "flag", role: "label", maxW: 640 });
    const toPt = [s.x + 56, s.y + s.h];                                  // where the tag's cord is fixed: the slot's lower rim
    const cy = toPt[1] + 56 + G.h / 2;
    const tag = T.label(ctx, "tag", { x: toPt[0] + G.tw / 2, y: cy, text: TXT, to: toPt, tone: "ink", as: "flag", role: "label", maxW: 640, t: tTag, parent: g });
    const ax = toPt[0] + G.tw + G.h * 0.3 + 26;
    // @form short_arrow_to_side: a short line arrow leaving a tag toward where the reader should go next
    const arrow = ctx.el("tag_arrow", { x: ax - 8, y: cy - 30, w: 140, h: 60, kind: "connector", parent: g });
    const A = kit.arrow(arrow.inner, 8, 30, 132, 30, { stroke: "muted", sw: 5 });
    m.reveal(arrow, tTag + 0.5, { dy: 0, dur: 0.01 });
    m.draw(A, tTag + 0.55, { dur: 0.5 });
  },
});
