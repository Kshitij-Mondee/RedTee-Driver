// @design drawn_system_funnel_continued: a share of a held grid lights up in order with a small mark each, the rest stay grey, and one pointer settles over part of the lit group
// b11 - 25 of the 50 reported. The camera pushes gently on the grid (the storyboard's shot push). A dashed frame marks the 50 that got
// past the filters, then on "Staff reported 25" 25 of the 50 envelopes light one after another (amber, a small tick badge each) while
// the other 25 go grey, a report button is pressed, and on "Some of them after clicking" ONE cursor settles over part of the lit
// group with a tag: the script says "some", so no number of clicked envelopes is drawn or countable.
// Treatments: (A) a pie of 25 and 25 (rejected: loses the 50 envelopes b10 made), (B) a second grid beside the first (rejected:
// two grids to compare), (C) CHOSEN: light the held grid itself, so the count accumulates on the things already there.
Loom.scene("b11", {
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
    const KEEP = ["dusk_haze", "skyline", "ground_band", "office_block", "annex_lobby", "inbox_frame", "funnel", "funnel_edge", "filter_mesh", "staff_1", "staff_2", "staff_3", "move_three", "grid50"]
      .concat([0, 1, 2, 3, 4].map((i) => "tray_row_" + i), [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => "pile_" + i));
    const H = {}; KEEP.forEach((n) => { H[n] = ctx.held(n); });

    const tFilters = ctx.cue("Filters catch most");
    const tNotAll = ctx.cue("Not all");
    const tReported = ctx.cue("Staff reported");
    const tTag = ctx.cue("with a report button");
    const tButton = ctx.cue("report button");
    const tSome = ctx.cue("Some of them after clicking");

    // "Filters catch most": the hot mesh breathes once, the heap beside it already holds the caught ones
    const pulse = ctx.el("mesh_pulse", { x: 0, y: 0, w: 0, h: 0, kind: "connector" });
    const pe = svg("ellipse", { cx: G.cx, cy: G.meshY, rx: hw(G.meshY) + 14, ry: 29, fill: c("accent"), opacity: 0 }, pulse.inner);
    clock(tFilters, tFilters + 1.7, (t, p) => pe.setAttribute("opacity", (0.26 * Math.sin(Math.PI * p)).toFixed(3)), "mesh_pulse");
    // "Not all": a dashed frame draws round the 50 that got past
    // @form dashed_frame_drawn: a dashed outline that draws itself round a group of things to say these ones
    const lf = ctx.el("leak_frame", { x: 0, y: 0, w: 0, h: 0, kind: "connector" });
    const fx = G.wall.x - 24, fy = G.wall.y - 24, fw = 548, fh = 298, rr = 14;
    kit.path(lf.inner, `M${fx + rr} ${fy} H${fx + fw - rr} Q${fx + fw} ${fy} ${fx + fw} ${fy + rr} V${fy + fh - rr} Q${fx + fw} ${fy + fh} ${fx + fw - rr} ${fy + fh} H${fx + rr} Q${fx} ${fy + fh} ${fx} ${fy + fh - rr} V${fy + rr} Q${fx} ${fy} ${fx + rr} ${fy}`, { stroke: "accent2", sw: 3, dash: "14 10" });
    m.draw(lf, tNotAll, { dur: 1.3 });

    // "Staff reported 25": 25 of the 50 light one after another with a small tick badge; the other 25 go grey (one clock, 1.1 s)
    const cells = Array.from(H.grid50.inner.querySelectorAll("[data-cell]"));
    const envs = cells.map((cg) => ({ cg, g: cg.firstChild, body: cg.querySelector("rect"), paths: cg.querySelectorAll("path") }));
    const marks = ctx.el("report_marks", { x: 0, y: 0, w: 0, h: 0, kind: "mark" });
    const badges = [];
    for (let i = 0; i < 25; i++) {
      const p = cellXY(i), g = svg("g", { opacity: 0 }, svg("g", {}, marks.inner));   // the outer group is left for b12, which hands each badge on
      svg("circle", { cx: 0, cy: 0, r: 10, fill: c("pos") }, g);
      svg("path", { d: "M-4.5 0.5 L-1.5 3.8 L5 -3.6", fill: "none", stroke: c("field"), "stroke-width": 2.8, "stroke-linecap": "round", "stroke-linejoin": "round" }, g);
      badges.push({ g, x: p.x + 16, y: p.y - 10 });
    }
    const amber = c("accent"), grey = c("muted"), tan = c("accent4");
    clock(tReported, tReported + 1.5, (t) => {
      envs.forEach((e, i) => {
        const q = i < 25 ? smooth(clamp01((t - (tReported + i * 0.04)) / 0.3)) : smooth(clamp01((t - tReported) / 0.6));
        const col = S.mix(tan, i < 25 ? amber : grey, q);
        e.body.setAttribute("fill", col);
        if (e.paths[0]) e.paths[0].setAttribute("fill", S.darken(col, 0.22));
        e.g.setAttribute("opacity", (i < 25 ? 1 : 1 - 0.5 * q).toFixed(2));
      });
      badges.forEach((b, i) => {
        const q = smooth(clamp01((t - (tReported + i * 0.04 + 0.12)) / 0.25));
        b.g.setAttribute("opacity", q.toFixed(2));
        b.g.setAttribute("transform", `translate(${b.x.toFixed(1)} ${b.y.toFixed(1)}) scale(${(0.4 + 0.6 * q).toFixed(3)})`);
      });
    }, "grid50");

    // "with a report button": the button is drawn and pressed, the tag wipes in
    // @form pill_button_press: a small pill button with an icon and one word, pressed once to show where an action happens
    const lbl = kit.fit("REPORT", { role: "label", w: 220, maxLines: 1, weight: 800 });
    const bw = lbl.width + 100, bh = lbl.height + 22;
    const btn = ctx.el("report_button", { x: G.wall.x + 500 - bw, y: 566, w: bw, h: bh, kind: "icon" });
    kit.pill(btn.inner, 0, 0, bw, bh, { fill: "surface", stroke: "accent", sw: 3 });
    kit.icon(btn.inner, "flag", { x: 36, y: bh / 2, size: 36, color: "accent" });
    kit.text(btn.inner, "REPORT", { role: "label", x: 66, y: 0, w: lbl.width + 12, h: bh, maxLines: 1, valign: "middle", weight: 800, color: "ink" });
    m.settle(btn, tButton - 0.1, { dy: 14 });
    m.press(btn, tButton + 0.5);
    Loom.data.tag(ctx, "reported_tag", { x: G.wall.x, y: 578, text: "25 REPORTED", color: "accent", textColor: "field", t: tTag });

    // "Some of them after clicking": one pointer settles over part of the lit group, with its tag
    // @form pointer_over_group: one pointer glyph hovering over part of a lit group, standing for an action by some of them
    const cur = ctx.el("cursor_glyph", { x: 1296, y: 700, w: 72, h: 72, kind: "icon" });
    kit.icon(cur.inner, "mouse-pointer-2", { x: 36, y: 36, size: 64, color: "field", stroke: 6 });
    kit.icon(cur.inner, "mouse-pointer-2", { x: 36, y: 36, size: 64, color: "ink", stroke: 2.4 });
    m.settle(cur, tSome, { dy: -26 });
    m.drift(cur, tSome + 0.8, ctx.end - 0.4, { amp: 3, period: 2.4 });
    const some = Loom.data.tag(ctx, "some_tag", { x: 1534, y: 704, lines: ["SOME AFTER", "CLICKING"], color: "accent2", textColor: "field", t: tSome + 0.25 });
    const sl = ctx.el("some_lead", { x: 0, y: 0, w: 0, h: 0, kind: "connector" });
    kit.line(sl.inner, 1526, 704 + some.h / 2, 1372, 736, { stroke: "accent2", sw: 3, dash: "10 8" });
    m.draw(sl, tSome + 0.45, { dur: 0.5 });
  },
});
