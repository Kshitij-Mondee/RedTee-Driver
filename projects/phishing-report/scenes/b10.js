// @design drawn_system_funnel_continued: the quantity as a picture: a count runs while many small items pour through a filter that heats, most fall away, a remainder lands in a grid
// b10 - 1,800 phishing emails meet the filters. The counter at the rim runs to 1,800 as envelopes pour in and the funnel fills;
// on "stopped" the mesh heats and the caught envelopes fall away sideways into a dim heap while the counter runs down; on
// "That left 50" a few slip through the spout and a grid of 50 envelopes lands in the trays at the door.
// Treatments: (A) two bars, 1,800 and 1,750 (rejected: a card, not a change), (B) a counter and a heap only (rejected: the 50
// would have no place to land), (C) CHOSEN: the whole mail system as the chart: pile, mesh, heap and trays, each number drawn.
Loom.scene("b10", {
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
    // the picture from b09 stays; only what is new is drawn here
    const KEEP = ["dusk_haze", "skyline", "ground_band", "office_block", "annex_lobby", "inbox_frame", "funnel", "funnel_edge", "filter_mesh", "staff_1", "staff_2", "staff_3", "move_three"]
      .concat([0, 1, 2, 3, 4].map((i) => "tray_row_" + i));
    const H = {}; KEEP.forEach((n) => { H[n] = ctx.held(n); });

    const tNum = ctx.cue("1,800");
    const tArr = ctx.cue("arrived");
    const tStop = ctx.cue("stopped");
    const tStopped = ctx.cue("1,750");
    const tLeft = ctx.cue("That left");
    const tFifty = ctx.cue("50");
    const tInbox = ctx.cue("in staff inboxes");

    // 1. the counter at the funnel's rim runs to 1,800 (the count is the event)
    const up = Loom.data.counter(ctx, "emails_counter", { x: 1160, y: 150, w: 600, to: 1800, caption: "PHISHING EMAILS", t: tNum - 0.1, dur: tArr - tNum });

    // 2. the funnel fills: rows of envelopes (Loom.array, seeded, random order), the bottom row first, resting on the mesh
    // @form pile_of_small_items: rows of small items filling a vessel from the bottom in random order, each one slightly turned
    const ROWS = 9, sprites = [], rowT0 = tNum + 0.35, rowSpan = tArr - tNum - 0.95;
    for (let r = 0; r < ROWS; r++) {
      const y = 205 + r * 20, width = 2 * hw(y) - 40, n = Math.floor(width / 37), dx = width / n;
      Loom.array(ctx, "pile_" + r, { x: G.cx - width / 2, y: y - 12, cols: n, rows: 1, dx, dy: 24, w: width, h: 24, kind: "scenery", order: "random", seed: "pile" + r,
        t: rowT0 + (ROWS - 1 - r) / (ROWS - 1) * rowSpan, stagger: 0.035,
        draw: (g, i, rr, cc, rnd) => {
          const px = dx / 2 + (rnd() - 0.5) * 8, py = 12 + (rnd() - 0.5) * 6;
          const home = svg("g", { transform: `translate(${px.toFixed(1)} ${py.toFixed(1)})` }, g);
          const anim = svg("g", {}, home);
          const env = envelope(svg("g", { transform: `rotate(${((rnd() - 0.5) * 34).toFixed(1)})` }, anim), 32, "accent4");
          sprites.push({ anim, env, hx: G.cx - width / 2 + cc * dx + px, hy: y - 12 + py, r, cc, spin: (rnd() - 0.5) * 320 });
        } });
    }
    // the pour: envelopes fall into the mouth from above while the count runs (one clock, every frame a pure function of time)
    const stream = ctx.el("stream_in", { x: 0, y: 0, w: 0, h: 0, kind: "scenery" });
    const Rs = Loom.rng("stream"), drops = [];
    for (let i = 0; i < 36; i++) {
      const g = svg("g", { opacity: 0 }, stream.inner);
      envelope(g, 28, "accent4");
      drops.push({ g, sx: G.cx + (Rs() - 0.5) * 470, t0: tNum + 0.05 + (i / 36) * (tArr - tNum - 0.55) + Rs() * 0.1, d: 0.7 + Rs() * 0.25, tilt: (Rs() - 0.5) * 44, land: 188 + Rs() * 26, lean: (Rs() - 0.5) * 70 });
    }
    clock(tNum, tArr + 0.8, (t) => drops.forEach((d) => {
      const p = (t - d.t0) / d.d;
      if (p <= 0 || p >= 1) { d.g.setAttribute("opacity", 0); return; }
      d.g.setAttribute("transform", `translate(${(d.sx + d.lean * p).toFixed(1)} ${(-30 + (d.land + 30) * p * p).toFixed(1)}) rotate(${(d.tilt * p).toFixed(1)})`);
      d.g.setAttribute("opacity", (p < 0.12 ? p / 0.12 : p > 0.82 ? (1 - p) / 0.18 : 1).toFixed(2));
    }), "stream_in");

    // 3. "stopped": the mesh heats as it catches, and the caught envelopes fall away sideways into a dim heap
    const meshE = H.filter_mesh;
    Loom.hold.heat([meshE], tStop, { from: "accent3", to: "accent", attr: "stroke", dur: 1.8, name: "filter_mesh" });
    const glow = meshE.inner.querySelector('[data-role="glow"]');
    clock(tStop, tStop + 1.8, (t, p) => glow.setAttribute("opacity", (0.42 * smooth(p)).toFixed(3)), "filter_mesh");
    const fall = sprites.slice().sort((a, b) => b.r - a.r || a.cc - b.cc);
    const Rh = Loom.rng("heap"), mid = G.heap.x + G.heap.w / 2, spots = [];
    fall.forEach(() => {
      const x = G.heap.x + 16 + Rh() * (G.heap.w - 32), peak = 82 * Math.pow(Math.max(0, 1 - Math.pow((x - mid) / (G.heap.w / 2), 2)), 0.7);
      spots.push({ x, y: G.gy - 12 - Rh() * peak, rot: (Rh() - 0.5) * 120 });
    });
    spots.sort((a, b) => b.y - a.y);   // the lowest places fill first
    const N = fall.length, tFall0 = tStop + 0.25, FALL = 1.9, FLIGHT = 0.95;
    const dim = S.mix(c("accent4"), c("field"), 0.55);
    fall.forEach((s, k) => { s.k = k; s.t0 = tFall0 + (k / N) * FALL; s.to = spots[k]; });
    clock(tFall0, tFall0 + FALL + FLIGHT + 0.1, (t) => fall.forEach((s) => {
      const p = clamp01((t - s.t0) / FLIGHT), dxs = s.to.x - s.hx, dys = s.to.y - s.hy;
      const x = dxs * (1 - (1 - p) * (1 - p)), y = dys * p * p - 34 * Math.sin(Math.PI * p) * (1 - p);
      s.anim.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(s.spin * p + s.to.rot * p).toFixed(1)})`);
      const k = smooth(clamp01((p - 0.55) / 0.45));
      paint(s.env, S.mix(c("accent4"), dim, k));
      s.anim.setAttribute("opacity", (1 - 0.3 * k).toFixed(2));
    }), "pile_fall");

    // 4. the counter runs back down from 1,800 to 50; the same number in the same place, so the swap cannot be seen
    const down = Loom.data.counter(ctx, "emails_left", { x: 1160, y: 150, w: 600, from: 1800, to: 50, caption: "PHISHING EMAILS", t: tStop - 0.15, dur: tFifty - tStop });
    Loom.tween(up.mover, { opacity: 1 }, { opacity: 0, duration: ctx.style.dur("exit") * 0.08, immediateRender: false }, tStop + 0.3, { kind: "exit", beat: ctx.beat.id, name: "emails_counter" });
    Loom.data.tag(ctx, "stopped_tag", { x: G.heap.x, y: 770, text: "1,750 STOPPED", color: "accent3", textColor: "field", t: tStopped });

    // 5. "That left 50": a few slip through the spout, then the 50 land in the trays, in order, within 1.2 s
    const leak = ctx.el("leakers", { x: 0, y: 0, w: 0, h: 0, kind: "scenery" });
    const Rl = Loom.rng("leak"), slips = [];
    for (let i = 0; i < 8; i++) { const g = svg("g", { opacity: 0 }, leak.inner); envelope(g, 22, "accent4"); slips.push({ g, t0: tLeft + i * 0.1, jx: (Rl() - 0.5) * 30 }); }
    clock(tLeft, tFifty + 0.2, (t) => slips.forEach((s) => {
      const p = (t - s.t0) / 0.62;
      if (p <= 0 || p >= 1) { s.g.setAttribute("opacity", 0); return; }
      s.g.setAttribute("transform", `translate(${(G.cx + s.jx * (1 - p)).toFixed(1)} ${(G.meshY + 10 + (G.spoutY - 8 - G.meshY - 10) * p * p).toFixed(1)}) rotate(${(s.jx * 2 * p).toFixed(1)})`);
      s.g.setAttribute("opacity", (p > 0.85 ? (1 - p) / 0.15 : 1).toFixed(2));
    }), "leakers");
    let cell = 0;
    // @form quantity_as_things: a grid with exactly as many small objects as the quantity, landing in order
    Loom.data.unitGrid(ctx, "grid50", { x: G.wall.x, y: G.wall.y, w: 500, h: 250, n: 50, cols: 10, lit: 50, color: "accent4", t: tFifty, stagger: 0.018,
      unit: (g, s, fill) => { g.setAttribute("data-cell", String(cell++)); envelope(g, s * 0.8, fill); } });
    Loom.data.tag(ctx, "inbox_tag", { x: G.wall.x, y: 578, text: "50 IN INBOXES", color: "accent2", textColor: "field", t: tInbox });
    m.emphasis(down, tFifty + 0.1);
  },
});
