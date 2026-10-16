// @design unit_grid_ledger: a span of time drawn as a grid of unit cells read like a page, each event stamped into the next free cells in reading order, its count riding a pile in the margin
/* b08 - the morning page opens (hard cut, chapter). A whole morning as 72 time units (12 x 6, read row by row like
 * a page); the plan's own work fills the first row in green as the strip's marker runs; the first question stamps
 * one ink unit (visible) and a red run of three (hidden); its slip lands on the margin pile, counter 0 to 1.
 *
 * Treatments considered:
 *  (A) a bar chart of minutes, visible vs hidden (rejected: a chart of one hypothetical, nothing accumulates, and
 *      the next beats need to keep adding to the same picture);
 *  (B) a clock face with wedges eaten by questions (rejected: a ring cannot show the work broken into pieces,
 *      which b10 needs, nor re-flow into one block, which b14 needs);
 *  (C) CHOSEN: the storyboard's unit grid. Time is reading order, every cost is a countable cell, and later beats
 *      stamp into the next free cells, lens a row, squeeze the runs and re-flow them on the same held picture.
 * Gate: motion only where the taught thing changes over time (cells filling = time passing, the pile = questions
 * arriving); the strip, the neutral grid and the note are staging, revealed once and held.
 *
 * Continuity contract (b09 to b14 rely on it):
 *  - morning_grid: element at (195, 175), cell pitch 98, cell 88, 12 columns; cell i centre in element coords is
 *    ((i % 12 + 0.5) * 98, (floor(i / 12) + 0.5) * 98). G.qq = { layer, cells: {i: {place, kind}} } records every
 *    coloured cell (kind work | ink | red). A cell is a placement group (translate to its centre, owned by later
 *    beats for squeeze and re-flow, drive key "qq.cell.<i>") holding a stamp group (entrance only).
 *  - strip: S.qq = { marker, c } ; marker x = 1390 * c / 72 in strip coords; drives keyed "qq.marker".
 *  - slips: P.qq = { k, slips: [...], step(t, dur, beatId) } ; the counter rides the pile (drives keyed).
 * All sizes are hypothetical ("Say"); the margin note says so on screen.
 * Text on the morning page is >= 30 px because b12 shows this page at 0.6 scale (film check floor 18 px).
 */
Loom.scene("b08", {
  build(ctx, props) {
    // T.label's lead is drawn by a dash offset with a round cap, which paints a dot at its start before the draw;
    // hide the lead's element until the label's own time (runtime defect logged in RUN_LOG.scenes-B.md)
    const label = (name, o) => { const E = Loom.treat.label(ctx, name, o); if (E.lead && o.t != null) Loom.tween(E.lead.inner, { opacity: 0 }, { opacity: 1, duration: 0.05 }, o.t, { kind: "reveal", beat: ctx.beat.id, name: name + ".lead" }); return E; };
    const { kit, m } = ctx;
    const S = Loom.style, T = Loom.treat;
    const B = ctx.beat.id;
    const P = 98, H = 44, COLS = 12, N = 72;
    const ctr = (i) => [(i % COLS + 0.5) * P, (Math.floor(i / COLS) + 0.5) * P];

    const tNow = ctx.cue("Now a whole morning");
    const tSay = ctx.cue("Say five questions");
    const tMin = ctx.cue("a minute each");
    const tFew = ctx.cue("and a few more to get back in");
    const tVar = ctx.cue("The real figure varies");

    // ---- strip: the time strip across the top, running to Lunch (structure first)
    // @form time_strip: a hairline time axis with row ticks, an end label and a small marker that travels along it
    const strip = ctx.el("strip", { x: 200, y: 92, w: 1520, h: 56, kind: "scenery", exit: "recede" });
    const LW = 1390, LY = 30;
    const axis = Loom.svg("path", { d: `M0 ${LY} H${LW}`, fill: "none", stroke: S.c("line"), "stroke-width": 3, "stroke-linecap": "round" }, strip.inner);
    const ticks = Loom.svg("g", {}, strip.inner);
    for (let k = 0; k <= 6; k++) Loom.svg("line", { x1: (LW * k) / 6, y1: LY - 9, x2: (LW * k) / 6, y2: LY + 9, stroke: S.c("line"), "stroke-width": 2 }, ticks);
    const lunch = kit.text(strip.inner, props.end_label || "Lunch", { role: "body", size: 32, x: LW + 20, y: 4, w: 1520 - LW - 20, h: 48, maxLines: 1, valign: "middle", color: "ink", weight: 700 });
    const marker = Loom.svg("g", { transform: `translate(0 ${LY})` }, strip.inner);
    Loom.svg("path", { d: "M-11 -26 H11 L0 -8 Z", fill: S.c("ink") }, marker);
    Loom.svg("circle", { cx: 0, cy: 0, r: 7, fill: S.c("ink") }, marker);
    m.draw(axis, tNow, { dur: 0.9 });
    Loom.tween(ticks, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: Loom.ease.enter }, tNow + 0.3, { kind: "reveal", beat: B, name: "strip.ticks" });
    Loom.tween(lunch, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: Loom.ease.enter }, tNow + 0.6, { kind: "reveal", beat: B, name: "strip.lunch" });
    Loom.tween(marker, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: Loom.ease.enter }, tNow + 0.2, { kind: "reveal", beat: B, name: "strip.marker" });
    strip.qq = { marker, c: 0, LW, LY };
    const markTo = (c, t, dur) => {
      const c0 = strip.qq.c;
      Loom.drive((e) => marker.setAttribute("transform", `translate(${((LW * (c0 + (c - c0) * e)) / N).toFixed(2)} ${LY})`), t, dur, "move",
        { kind: "value_travel", beat: B, name: "strip.marker", content: true, key: "qq.marker" });
      strip.qq.c = c;
    };

    // ---- morning_grid: 72 neutral cells, one calm reveal; the plan's work stamps the first row in green
    // @form unit_cell: a square time unit, a muted outline when free and a flat colour once stamped with what filled it
    const cellUnit = (g, s, tok) => {
      if (tok === "muted") Loom.svg("rect", { x: -H, y: -H, width: 2 * H, height: 2 * H, rx: 6, fill: "none", stroke: S.c("muted"), "stroke-width": 2 }, g);
      else Loom.svg("rect", { x: -H, y: -H, width: 2 * H, height: 2 * H, rx: 6, fill: S.c(tok) }, g);
    };
    const tWork = tNow + 0.7, WORK0 = 8;
    const G = Loom.data.stamp(ctx, "morning_grid", { x: 195, y: 175, w: COLS * P, h: 6 * P, n: N, cols: COLS, share: WORK0 / N, unit: cellUnit,
      token: "accent4", off: "muted", offOpacity: 0.55, gridT: tNow + 0.15, t: tWork, stagger: 0.11 });
    G.exit = "recede";
    const layer = Loom.svg("g", { "data-qq-layer": "1" }, G.inner);
    G.qq = { layer, cells: {} };
    // the stamp primitive's green cells become addressable placement groups like every later cell
    Array.from(G.inner.querySelectorAll('[data-loom-grid="stamped"] > g')).forEach((place, i) => {
      place.setAttribute("data-qq-i", i); place.setAttribute("data-qq-kind", "work");
      G.qq.cells[i] = { place, kind: "work" };
    });
    markTo(WORK0, tWork, 0.11 * (WORK0 - 1) + 0.4);
    const TOK = { work: "accent4", ink: "ink", red: "accent" };
    const stampCell = (i, kind, t, sd) => {
      const [cx, cy] = ctr(i);
      const place = Loom.svg("g", { transform: `translate(${cx} ${cy})`, "data-qq-i": i, "data-qq-kind": kind }, layer);
      const g = Loom.svg("g", {}, place);
      Loom.svg("rect", { x: -H, y: -H, width: 2 * H, height: 2 * H, rx: 6, fill: S.c(TOK[kind]) }, g);
      Loom.tween(g, { opacity: 0, scale: 1.35, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: sd || 0.42, ease: Loom.ease.enter }, t,
        { kind: "stamp", beat: B, name: `morning_grid.${kind}.${i}`, content: true });
      G.qq.cells[i] = { place, kind };
      return place;
    };

    // ---- slips: the pile of question slips in the margin, its counter riding on top (0 -> 1 in this beat)
    // A local pile with the semantics of Loom.data.pile (one eased progress drives the number, the counter's height
    // and the landing unit) because the pile must advance on separate cue words across b08 and b09, and
    // Loom.data.pile runs from -> to in one call.
    // @form slip_pile: paper slips stacked a little askew in a margin, a running count sitting on the top slip
    const PX = 1480, PY = 288, PW = 340, PH = 380, BASE = 318, SW = 300, SH = 66, STEP = 16;
    const pile = ctx.el("slips", { x: PX, y: PY, w: PW, h: PH, kind: "data", exit: "recede" });
    const rnd = Loom.rng("qq:slips");
    const slipsG = Loom.svg("g", {}, pile.inner);
    const slips = [];
    for (let k = 0; k < 5; k++) {
      const jx = (rnd() - 0.5) * 18, rot = (rnd() - 0.5) * 4.4;
      const x0 = (PW - SW) / 2 + jx, y0 = BASE - SH - k * STEP;
      const place = Loom.svg("g", { transform: `translate(${(x0 + SW / 2).toFixed(1)} ${(y0 + SH / 2).toFixed(1)}) rotate(${rot.toFixed(2)})`, "data-qq-slip": k }, slipsG);
      const g = Loom.svg("g", { opacity: 0 }, place);
      // @form question_slip: a small paper note with an offset shadow carrying a one-line question
      Loom.svg("rect", { x: -SW / 2 + 6, y: -SH / 2 + 6, width: SW, height: SH, rx: 4, fill: S.c("shadow"), opacity: 0.12 }, g);
      Loom.svg("rect", { x: -SW / 2, y: -SH / 2, width: SW, height: SH, rx: 4, fill: S.c("surface"), stroke: S.c("line"), "stroke-width": 1.5 }, g);
      kit.text(g, "Quick question?", { role: "body", size: 32, x: -SW / 2 + 16, y: -SH / 2 + 6, w: SW - 32, h: SH - 12, maxLines: 1, align: "center", valign: "middle", color: "ink", weight: 500 });
      slips.push({ place, g, x: x0 + SW / 2, y: y0 + SH / 2, rot });
    }
    const pileLabel = kit.text(pile.inner, props.pile_label || "questions, say", { role: "body", size: 32, x: 0, y: BASE + 8, w: PW, h: 44, maxLines: 1, align: "center", color: "muted", weight: 500 });
    const NUMH = 84;
    const cg = Loom.svg("g", {}, pile.inner);
    const num = kit.text(cg, "5", { role: "title", size: 76, x: 0, y: 0, w: PW, h: NUMH, maxLines: 1, align: "center", valign: "bottom", color: "ink", weight: 800 });
    const tn = num.querySelector("tspan") || num;
    const topOf = (k) => (k === 0 ? BASE : BASE - SH - (k - 1) * STEP);
    const cgY = (k) => topOf(k) - NUMH - 10;
    tn.textContent = "0";
    cg.setAttribute("transform", `translate(0 ${cgY(0)})`);
    pile.qq = {
      k: 0, slips,
      /** one more slip lands; the counter runs k-1 -> k and rises with the pile (one eased progress) */
      step(t, dur, beatId) {
        const k0 = pile.qq.k, k1 = k0 + 1;
        Loom.drive((e) => {
          tn.textContent = String(Math.round(k0 + e));
          cg.setAttribute("transform", `translate(0 ${(cgY(k0) + (cgY(k1) - cgY(k0)) * e).toFixed(2)})`);
        }, t, dur, "move", { kind: "count", beat: beatId, name: "slips.count", content: true, key: "qq.pile.count" });
        const s = slips[k0];
        Loom.tween(s.g, { opacity: 0, y: -34 }, { opacity: 1, y: 0, duration: 0.24, ease: Loom.ease.exit }, Math.max(0, t + dur - 0.24),
          { kind: "drop", beat: beatId, name: `slips.${k0}`, content: true });
        Loom.sfx("card", t + dur - 0.05);
        pile.qq.k = k1;
        return t + dur;
      },
    };
    Loom.tween(pile.inner, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: Loom.ease.enter }, tSay - 0.35, { kind: "reveal", beat: B, name: "slips" });
    pile.qq.step(tSay, 0.7, B);
    void pileLabel;

    // ---- the first question: one ink unit (visible), then a red run of three (hidden)
    const Q1 = { ink: 8, red: [9, 10, 11] };
    stampCell(Q1.ink, "ink", tMin);
    Loom.sfx("tick", tMin + 0.15);
    markTo(Q1.ink + 1, tMin, 0.45);
    Q1.red.forEach((i, k) => { stampCell(i, "red", tFew + 0.1 + k * 0.4); Loom.sfx("tick", tFew + 0.25 + k * 0.4); });
    markTo(Q1.red[2] + 1, tFew + 0.1, 0.4 * 2 + 0.42);

    // tags lettered on the first question's units, set to the outside of their leads so a lead never crosses its word; (cleared at b09's join: the narrator stops naming the parts)
    const cx = (i) => 195 + ctr(i)[0], rowBottom = 175 + P - 5;
    label("tag_visible", { x: cx(Q1.ink) - 84, y: rowBottom + 58, text: props.visible_label || "visible", to: [cx(Q1.ink), rowBottom + 4], tone: "ink", role: "label", t: tMin + 0.45 });
    label("tag_hidden", { x: cx(Q1.red[1]) + 84, y: rowBottom + 58, text: props.hidden_label || "hidden", to: [cx(Q1.red[1]), rowBottom + 4], tone: "accent", role: "label", t: tFew + 1.35 });

    // ---- margin_note: the size is a hypothetical, said on the page
    // @form margin_note: a short printed aside in the page margin that frames the numbers beside it
    const note = ctx.el("margin_note", { x: PX, y: 176, w: PW, h: 96, kind: "text", exit: "wipe" });
    kit.text(note.inner, props.note || "Say. The real figure varies.", { role: "lead", size: 34, x: 0, y: 0, w: PW, h: 96, maxLines: 2, color: "muted", weight: 700 });
    m.unmask(note, tVar, { dir: "ltr" });
  },
});
