// @design sum_on_readout: three working rows light in turn on the panel that already holds the measured time, the stamp slides into its row, and the product reaches back up towards its source
Loom.scene("b12", {
  build(ctx, props) {
    const m = ctx.m;
    const S = (tag, a, p) => Loom.svg(tag, a, p);
    // Treatments: (1) static panel with one highlight bar (rejected: no order), (2) rows light in turn, the chip slides into its row, a line reaches up (chosen: three operations, each on its word), (3) a floating equation over the sky (rejected: loses the panel the timer lives in).
    const PX = 1300, PY = 590, PW = 500;          // b11's readout panel (timer + one empty row), x 1300..1800
    const ROW0 = PY + 104, ROWH = 46;              // kit readout rows start here (694)
    const PB = PY + 20 + 84 + 3 * ROWH + 20;       // panel bottom after three rows (852)
    const LABELS = ["arrival", "sending", "x speed of light"];

    const tArr = ctx.cue("takes the arrival time");
    const tSub = ctx.cue("subtracts the sending time");
    const tMul = ctx.cue("multiplies by the speed of light");

    // ---- held from the beat before
    ctx.held("ground"); ctx.held("phone_pt"); ctx.held("sats");
    const readoutE = ctx.held("readout");
    const timerE = ctx.held("timer");
    const linkE = ctx.held("readout_link");
    const chipE = ctx.held("stamp_chip");

    // ---- rows: the panel grows downward to hold three rows (timer and chip do not move)
    const top = ROW0 - 2;                          // 692, inside the old panel's row area
    const rows = ctx.el("rows", { x: PX, y: top, w: PW, h: PB + 20 - top, kind: "instrument", exit: "recede" });
        // the panel's extension is drawn INSIDE the held readout (new children, local coords 0..500 x 0..), so the chip, a later element, stays above it
    if (readoutE && readoutE.inner) {
      const Y0 = 106, HL = PB - PY;                // from just under the timer; panel bottom in readout coords
      const ext = S("g", { opacity: 0 }, readoutE.inner);
      S("rect", { x: 0, y: HL - 70, width: PW, height: 82, rx: 26, fill: ctx.c("shadow"), opacity: 0.4 }, ext);
      const edge = "M0 " + Y0 + " V" + (HL - 26) + " A26 26 0 0 0 26 " + HL + " H" + (PW - 26) + " A26 26 0 0 0 " + PW + " " + (HL - 26) + " V" + Y0;
      S("path", { d: edge + " Z", fill: ctx.c("surface") }, ext);
      S("path", { d: edge, fill: "none", stroke: ctx.c("line"), "stroke-width": 4, "stroke-linecap": "round" }, ext);
      Loom.drive((e) => { ext.setAttribute("opacity", e); }, ctx.start + 0.05, 0.3, "move");
    }
    const rowEls = LABELS.map((txt, i) => {
      const y = ROW0 + i * ROWH - top;
      const g = S("g", {}, rows.inner);
      const bg = S("rect", { x: 132, y: y, width: PW - 150, height: ROWH - 6, rx: 14, fill: ctx.c("accent"), opacity: 0 }, g);
      const t1 = S("text", { x: 150, y: y + 31, "font-size": 28, fill: ctx.c("ink"), "font-family": "inherit" }, g); t1.textContent = txt;
      const t2 = S("text", { x: 150, y: y + 31, "font-size": 28, "font-weight": 700, fill: ctx.c("accent"), opacity: 0, "font-family": "inherit" }, g); t2.textContent = txt;
      return { bg: bg, t1: t1, t2: t2 };
    });
    // one drive per row: up on its word, down when the next row takes over (the last stays lit)
    const light = (r, tIn, tOut) => {
      const up = 0.25, end = tOut === null ? tIn + up : tOut + up;
      Loom.drive((e, raw) => {
        const T = tIn + raw * (end - tIn);
        let v = Math.min(1, Math.max(0, (T - tIn) / up));
        if (tOut !== null) v = Math.min(v, 1 - Math.min(1, Math.max(0, (T - tOut) / up)));
        r.bg.setAttribute("opacity", 0.2 * v); r.t2.setAttribute("opacity", v); r.t1.setAttribute("opacity", 1 - v);
      }, tIn, end - tIn, "linear");
    };
    light(rowEls[0], tArr, tSub);
    light(rowEls[1], tSub, tMul);
    light(rowEls[2], tMul, null);
    m.reveal(rows, ctx.start + 0.05);

    // ---- the stamp slides from its resting slot into the sending row
    if (chipE) m.travel(chipE, tSub, { x: 0, y: ROWH });

    // ---- a thin line reaches up from the readout towards the satellite it came from
    const reach = ctx.el("sum_line", { x: 0, y: 0, w: 1920, h: 1080, kind: "connector", exit: "recede" });
    const rp = S("path", { d: "M1340 " + PY + " L560 332", fill: "none", stroke: ctx.c("accent"), "stroke-width": 3, "stroke-linecap": "round" }, reach.inner);
    m.draw(rp, tMul + 0.15, { dur: 1.6 });

    // ---- retire: the working leaves in the last half second
    const tOut = ctx.end - 0.5;
    [timerE, linkE, chipE, readoutE].forEach((E) => { if (E) m.exit(E, tOut, "recede"); });
    m.exit(rows, tOut, "recede");
    m.exit(reach, tOut, "recede");
  }
});
