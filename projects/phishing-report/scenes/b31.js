// @design drawn_system_funnel_recalled: the remembered picture returns whole, with the one part this section is about lit, then a chapter title dims it
// b31 - back to the funnel. The camera pans up to the same funnel world as b09 to b12 (same geometry), already built: the mesh warm,
// the grid of 50 with its 25 lit report marks and the one cursor, tagged "25 reports". A chapter sting "After a click" dims it,
// and on "This story goes there" the lit group glows once (Loom.hold.heat), ready for the story to dip into it.
// Treatments: (A) a still frame with a title (rejected: it forgets it is a place), (B) rebuild it step by step (rejected: it is
// remembered, not taught again), (C) CHOSEN: the picture settles in at once as it was, and only the lit part changes.
Loom.scene("b31", {
  build(ctx) {
    const { kit, m } = ctx;
    // ---- the funnel world: geometry and helpers shared by b09 to b12 and b31 (the same numbers in each file) ----
    const S = Loom.style, svg = Loom.svg, c = (t) => ctx.c(t);
    const G = { gy: 905, cx: 820, mouthY: 150, mouthHW: 330, mouthRY: 30, neckY: 470, neckHW: 60, spoutY: 528, meshY: 380, towerSize: 410,
      wall: { x: 970, y: 650, cell: 50, cols: 10, rows: 5 }, heap: { x: 130, w: 330 } };
    const hw = (y) => G.mouthHW + (G.neckHW - G.mouthHW) * (y - G.mouthY) / (G.neckY - G.mouthY);   // half width of the cone at y
    const cellXY = (i) => ({ x: G.wall.x + (i % G.wall.cols) * G.wall.cell + G.wall.cell / 2, y: G.wall.y + Math.floor(i / G.wall.cols) * G.wall.cell + G.wall.cell / 2 });
    const clamp01 = (v) => Math.max(0, Math.min(1, v));
    const smooth = (p) => p * p * (3 - 2 * p);
    // a pure function of time: fn(t, progress) runs every frame between t0 and t1
    const clock = (t0, t1, fn, name, kind) => Loom.drive((e, raw) => fn(t0 + raw * (t1 - t0), raw), t0, Math.max(0.05, t1 - t0), "linear", { kind: kind || "drive", beat: ctx.beat.id, name, content: kind !== "ambient" });
    // an envelope about (0, 0); its body and flap are returned so a scene can recolour them
    function envelope(parent, w, tok) {
      const h = w * 0.64, g = svg("g", {}, parent), col = c(tok);
      const body = svg("rect", { x: -w / 2, y: -h / 2, width: w, height: h, rx: w * 0.08, fill: col }, g);
      const flap = svg("path", { d: `M${-w / 2} ${-h / 2} L0 ${h * 0.12} L${w / 2} ${-h / 2} Z`, fill: S.darken(col, 0.22) }, g);
      const seam = svg("path", { d: `M${-w / 2} ${h / 2} L${-w * 0.12} ${-h * 0.02} M${w / 2} ${h / 2} L${w * 0.12} ${-h * 0.02}`, fill: "none", stroke: S.darken(col, 0.34), "stroke-width": Math.max(1, w * 0.035), "stroke-linecap": "round", opacity: 0.55 }, g);
      return { g, body, flap, seam };
    }
    const paint = (env, col) => { env.body.setAttribute("fill", col); env.flap.setAttribute("fill", S.darken(col, 0.22)); env.seam.setAttribute("stroke", S.darken(col, 0.34)); };
    // ---- the world itself: dusk, a far skyline, the office block with its mail wall, the glass funnel and its mesh ----
    // o.draw: true draws the funnel and the block on their words (b09); false lets the remembered picture settle in at once (b31)
    function buildWorld(o) {
      const out = {};
      const tIn = o.tIn;
      // @form dusk_skyline: far buildings in silhouette with a few lit windows twinkling, so the empty sky has life
      const haze = ctx.el("dusk_haze", { x: 0, y: 0, w: 0, h: 0, kind: "scenery" });
      [[760, 0.05], [520, 0.05], [300, 0.06]].forEach(([r, op]) => svg("ellipse", { cx: G.cx, cy: 700, rx: r * 1.5, ry: r * 0.6, fill: c("accent"), opacity: op }, haze.inner));
      m.reveal(haze, tIn, { dy: 0, dur: 1.2 });
      const sky = ctx.el("skyline", { x: 0, y: 0, w: 0, h: 0, kind: "scenery" });
      const R = Loom.rng("funnel-skyline"), wins = [];
      for (let i = 0; i < 17; i++) {
        const bw = 92 + R() * 70, bx = -50 + i * 122 + R() * 18, bh = (i < 4 || i > 11 ? 190 : 120) + R() * (i > 11 ? 300 : 120);
        svg("rect", { x: bx, y: G.gy - bh, width: bw, height: bh, fill: c("field2") }, sky.inner);
        svg("rect", { x: bx, y: G.gy - bh, width: bw, height: 3, fill: c("line"), opacity: 0.35 }, sky.inner);
        for (let wy = G.gy - bh + 22; wy < G.gy - 30; wy += 30) for (let wx = bx + 14; wx < bx + bw - 18; wx += 24) {
          if (R() < 0.2) wins.push({ n: svg("rect", { x: wx, y: wy, width: 9, height: 13, rx: 1.5, fill: c("accent"), opacity: 0.5 }, sky.inner), ph: R() * 6.28, per: 2.4 + R() * 3 });
        }
      }
      m.reveal(sky, tIn, { dy: 0, dur: 1.2 });
      clock(o.tTwinkle0, o.tTwinkle1, (t) => wins.forEach((w) => w.n.setAttribute("opacity", (0.5 * (0.55 + 0.45 * Math.sin(2 * Math.PI * t / w.per + w.ph))).toFixed(3))), "skyline", "ambient");
      const ground = ctx.el("ground_band", { x: 0, y: 0, w: 0, h: 0, kind: "scenery" });
      svg("rect", { x: 0, y: G.gy, width: 1920, height: 180, fill: c("field2") }, ground.inner);
      svg("rect", { x: 0, y: G.gy, width: 1920, height: 3, fill: c("line"), opacity: 0.6 }, ground.inner);
      for (let i = 0; i < 9; i++) svg("rect", { x: 40 + i * 230, y: G.gy + 40, width: 120, height: 5, rx: 2, fill: c("line"), opacity: 0.35 }, ground.inner);
      m.reveal(ground, tIn, { dy: 0, dur: 1.0 });

      // the office block: a tower drawn as an object, its lit windows warm, a door at its foot
      // @form tower_block_lit: a tall office tower drawn as an object with warm lit windows and a door
      const block = ctx.el("office_block", { x: G.cx - 150, y: G.gy - 420, w: 300, h: 420, kind: "scenery" });
      Loom.obj.shape(block.inner, "building", 150, 420 - G.towerSize * 0.47, G.towerSize, { family: "tower", tone: "surface", state: { lit: true }, detail: 3, shadow: false, key: "office_block" });
      const hot = c("accent2").toLowerCase();
      block.inner.querySelectorAll("rect").forEach((r) => { if ((r.getAttribute("fill") || "").toLowerCase() === hot) r.setAttribute("fill", c("accent")); });
      svg("rect", { x: 150 - 24, y: 420 - 62, width: 48, height: 62, rx: 3, fill: c("field") }, block.inner);
      svg("rect", { x: 150 - 24, y: 420 - 62, width: 48, height: 62, rx: 3, fill: c("accent"), opacity: 0.22 }, block.inner);
      svg("rect", { x: 150 + 107 - 3, y: 420 - 385 + 8, width: 3, height: 385 - 8, fill: c("accent"), opacity: 0.35 }, block.inner);   // the key light on its edge
      out.block = block;
      // the annex that holds the mail wall, with a row of warm lamps over the trays
      const annex = ctx.el("annex_lobby", { x: 940, y: 590, w: 570, h: 315, kind: "scenery" });
      svg("rect", { x: 0, y: 14, width: 570, height: 301, fill: c("surface2") }, annex.inner);
      svg("rect", { x: -6, y: 0, width: 582, height: 16, rx: 3, fill: c("surface") }, annex.inner);
      svg("rect", { x: 0, y: 14, width: 570, height: 3, fill: c("accent"), opacity: 0.35 }, annex.inner);
      [70, 285, 500].forEach((x) => { svg("ellipse", { cx: x, cy: 34, rx: 70, ry: 20, fill: c("accent"), opacity: 0.07 }, annex.inner); svg("circle", { cx: x, cy: 30, r: 7, fill: c("accent") }, annex.inner); });
      out.annex = annex;
      // @form wall_of_empty_slots: a framed wall of small empty trays waiting to be filled
      const frame = ctx.el("inbox_frame", { x: G.wall.x - 14, y: G.wall.y - 14, w: 528, h: 278, kind: "scenery" });
      svg("rect", { x: 0, y: 0, width: 528, height: 278, rx: 8, fill: c("field"), stroke: c("line"), "stroke-width": 3 }, frame.inner);
      out.frame = frame;
      for (let r = 0; r < G.wall.rows; r++) {
        Loom.array(ctx, "tray_row_" + r, { x: G.wall.x, y: G.wall.y + r * G.wall.cell, cols: G.wall.cols, rows: 1, dx: G.wall.cell, dy: G.wall.cell, w: G.wall.cols * G.wall.cell, h: G.wall.cell, kind: "scenery",
          order: "row", seed: "tray" + r, t: o.tTrays + r * o.trayGap, stagger: o.trayStagger,
          draw: (g) => {
            svg("rect", { x: 4, y: 7, width: 42, height: 36, rx: 4, fill: c("field2") }, g);
            svg("rect", { x: 4, y: 7, width: 42, height: 8, rx: 3, fill: c("field"), opacity: 0.7 }, g);
            svg("rect", { x: 3, y: 39, width: 44, height: 4, rx: 2, fill: c("line"), opacity: 0.85 }, g);
          } });
      }
      // staff at the foot of the block: grey extras, so the people it protects are in the picture
      out.staff = [[548, 0.2, false], [598, 0.215, true], [646, 0.19, false]].map(([x, sc, fl], i) => ctx.character("staff_" + (i + 1), "extra", { x, y: G.gy, scale: sc, top: "muted", flip: fl }));

      // the glass funnel: a translucent cone with a dark mouth, a spout into the roof, its edge drawn separately
      // @form glass_funnel: a translucent cone with a dark mouth whose outline draws itself from the rim down
      const FX = G.cx - 350, FY = 110, FW = 700, FH = 430;
      const pts = (a) => a.map(([x, y]) => `${(x - FX).toFixed(1)},${(y - FY).toFixed(1)}`).join(" ");
      const funnel = ctx.el("funnel", { x: FX, y: FY, w: FW, h: FH, kind: "scenery" });
      svg("polygon", { points: pts([[G.cx - 330, 150], [G.cx + 330, 150], [G.cx + 60, 470], [G.cx + 38, 472], [G.cx + 38, G.spoutY], [G.cx - 38, G.spoutY], [G.cx - 38, 472], [G.cx - 60, 470]]), fill: c("surface"), opacity: 0.55 }, funnel.inner);
      svg("polygon", { points: pts([[G.cx, 150], [G.cx + 330, 150], [G.cx + 60, 470], [G.cx + 38, 472], [G.cx + 38, G.spoutY], [G.cx, G.spoutY]]), fill: c("field"), opacity: 0.28 }, funnel.inner);
      svg("polygon", { points: pts([[G.cx - 296, 158], [G.cx - 262, 158], [G.cx - 50, 458], [G.cx - 76, 458]]), fill: c("ink"), opacity: 0.07 }, funnel.inner);
      svg("ellipse", { cx: G.cx - FX, cy: 150 - FY, rx: G.mouthHW, ry: G.mouthRY, fill: c("field"), opacity: 0.92 }, funnel.inner);
      const edge = ctx.el("funnel_edge", { x: FX, y: FY, w: FW, h: FH, kind: "scenery" });
      const a = (x, y) => `${(x - FX).toFixed(1)} ${(y - FY).toFixed(1)}`;
      const stroke = (d, col, sw, op) => svg("path", { d, fill: "none", stroke: c(col), "stroke-width": sw, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: op }, edge.inner);
      stroke(`M${a(G.cx - 330, 150)} A330 30 0 0 1 ${a(G.cx + 330, 150)}`, "muted", 3, 0.8);
      stroke(`M${a(G.cx - 330, 150)} A330 30 0 0 0 ${a(G.cx + 330, 150)}`, "accent3", 4, 1);
      stroke(`M${a(G.cx - 330, 150)} L${a(G.cx - 60, 470)} L${a(G.cx - 38, 472)} L${a(G.cx - 38, G.spoutY)}`, "accent3", 4, 1);
      stroke(`M${a(G.cx + 330, 150)} L${a(G.cx + 60, 470)} L${a(G.cx + 38, 472)} L${a(G.cx + 38, G.spoutY)}`, "accent3", 4, 1);
      out.funnel = funnel; out.edge = edge;

      // the filter mesh across the cone: a disc of strands, a hidden glow that comes up when it heats
      // @form filter_mesh_disc: a disc of crossing strands across a throat, with a glow layer held back for later
      const mtone = o.meshTone || "accent3";
      const mesh = ctx.el("filter_mesh", { x: G.cx - 150, y: G.meshY - 32, w: 300, h: 64, kind: "scenery" });
      const mrx = hw(G.meshY) - 4, mry = 15;
      svg("ellipse", { cx: 150, cy: 32, rx: mrx + 18, ry: mry + 14, fill: c("accent"), opacity: o.meshGlow || 0, "data-role": "glow" }, mesh.inner);
      const mfill = svg("g", {}, mesh.inner);
      svg("ellipse", { cx: 150, cy: 32, rx: mrx, ry: mry, fill: c(mtone), opacity: 0.12 }, mfill);
      const ms = (d, w) => svg("path", { d, fill: "none", stroke: c(mtone), "stroke-width": w, "stroke-linecap": "round" }, mesh.inner);
      for (let k = -5; k <= 5; k++) { const dx = k * mrx / 5.5, hh = mry * Math.sqrt(Math.max(0, 1 - (dx / mrx) ** 2)); ms(`M${(150 + dx).toFixed(1)} ${(32 - hh).toFixed(1)} L${(150 + dx).toFixed(1)} ${(32 + hh).toFixed(1)}`, 2.5); }
      [-0.55, 0, 0.55].forEach((t) => { const yy = 32 + t * mry, half = mrx * Math.sqrt(1 - t * t); ms(`M${(150 - half).toFixed(1)} ${yy.toFixed(1)} Q150 ${(yy + 5).toFixed(1)} ${(150 + half).toFixed(1)} ${yy.toFixed(1)}`, 2.5); });
      ms(`M${150 - mrx} 32 A${mrx} ${mry} 0 0 1 ${150 + mrx} 32`, 4); ms(`M${150 - mrx} 32 A${mrx} ${mry} 0 0 0 ${150 + mrx} 32`, 4);
      out.mesh = mesh; out.meshFill = mfill;

      if (o.draw) {
        m.grow(block, o.tBlock - 0.1, { axis: "y", dur: 1.1 });
        m.settle(annex, o.tBlock + 0.35); m.settle(frame, o.tBlock + 0.5);
        out.staff.forEach((p, i) => m.settle(p.E, o.tBlock + 0.95 + i * 0.1));
        m.unmask(funnel, o.tFunnel, { dir: "ttb", dur: 1.6 });
        m.draw(edge, o.tFunnel, { dur: 1.7, together: true });
        m.draw(mesh, o.tFunnel + 1.5, { dur: 1.0 });
        Loom.tween(mfill, { opacity: 0 }, { opacity: 1, duration: ctx.style.dur("enter") * 0.75 }, o.tFunnel + 2.0, { kind: "reveal", beat: ctx.beat.id, name: "filter_mesh.fill", content: true });
      } else {
        [block, annex, frame, funnel, edge, mesh].forEach((E) => m.reveal(E, tIn + 0.1, { dy: 0, dur: 0.6 }));
        out.staff.forEach((p) => m.reveal(p.E, tIn + 0.15, { dy: 0, dur: 0.6 }));
      }
      return out;
    }
    const tRem = ctx.cue("Remember the funnel");
    const tReports = ctx.cue("Some of those 25 reports");
    const tClick = ctx.cue("came after a click");
    const tThere = ctx.cue("This story goes there");
    const tIn = ctx.start - 0.2;

    // the funnel world as it was left at the end of b12: nothing is drawn on a word, it is simply there (remembered)
    buildWorld({ draw: false, tIn, tTrays: tIn + 0.2, trayGap: 0.05, trayStagger: 0.01, tTwinkle0: ctx.start, tTwinkle1: ctx.end, meshTone: "accent", meshGlow: 0.42 });

    // the grid of 50: 25 lit amber, 25 grey, each lit one with its small tick badge
    // @form quantity_as_things: a grid with exactly as many small objects as the quantity, a share of them lit
    const cells = [];
    let cell = 0;
    const grid = Loom.data.unitGrid(ctx, "grid50", { x: G.wall.x, y: G.wall.y, w: 500, h: 250, n: 50, cols: 10, lit: 25, color: "accent", off: "muted", t: tRem + 0.1, stagger: 0.008,
      unit: (g, s, fill) => { g.setAttribute("data-cell", String(cell++)); cells.push(envelope(g, s * 0.8, fill)); } });
    const marks = ctx.el("report_marks", { x: 0, y: 0, w: 0, h: 0, kind: "mark" });
    for (let i = 0; i < 25; i++) {
      const p = cellXY(i), g = svg("g", { transform: `translate(${(p.x + 16).toFixed(1)} ${(p.y - 10).toFixed(1)})` }, marks.inner);
      svg("circle", { cx: 0, cy: 0, r: 10, fill: c("pos") }, g);
      svg("path", { d: "M-4.5 0.5 L-1.5 3.8 L5 -3.6", fill: "none", stroke: c("field"), "stroke-width": 2.8, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
    }
    m.reveal(marks, tRem + 0.5, { dy: 0, dur: 0.5 });

    // the one cursor, and the tag that names the 25
    const cur = ctx.el("cursor_glyph", { x: 1296, y: 700, w: 72, h: 72, kind: "icon" });
    kit.icon(cur.inner, "mouse-pointer-2", { x: 36, y: 36, size: 64, color: "field", stroke: 6 });
    kit.icon(cur.inner, "mouse-pointer-2", { x: 36, y: 36, size: 64, color: "ink", stroke: 2.4 });
    m.reveal(cur, tRem + 0.6, { dy: 0, dur: 0.5 });
    m.drift(cur, tRem + 1.2, ctx.end - 0.4, { amp: 3, period: 2.4 });
    Loom.data.tag(ctx, "reports_tag", { x: G.wall.x, y: 578, text: "25 REPORTS", color: "accent", textColor: "field", t: tReports });

    // the chapter sting dims the picture ("after a click"), then the lit group glows once as the story turns there
    Loom.data.chapter(ctx, "chapter_after_a_click", { title: "After a click", t: tClick, dur: 1.7 });
    const lit = cells.slice(0, 25);
    Loom.hold.heat(lit.map((e) => e.body), tThere, { from: "accent", to: "ink", attr: "fill", dur: 0.8, name: "lit_group" });
    const halo = ctx.el("lit_halo", { x: 0, y: 0, w: 0, h: 0, kind: "connector" });
    [0, 1, 2].forEach((k) => svg("rect", { x: G.wall.x - 6 - k * 8, y: G.wall.y - 6 - k * 8, width: 500 + 12 + k * 16, height: 150 + 12 + k * 16, rx: 14 + k * 6, fill: c("accent"), opacity: 0 }, halo.inner));
    const rings = Array.from(halo.inner.childNodes);
    clock(tThere, tThere + 1.5, (t, p) => rings.forEach((r, k) => r.setAttribute("opacity", ([0.2, 0.12, 0.06][k] * Math.sin(Math.PI * p)).toFixed(3))), "lit_halo");
  },
});
