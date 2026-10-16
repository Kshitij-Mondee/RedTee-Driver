// @design reflow_answer_in_place: the answer to a prediction is played on the held unit grid itself, its cells travelling to new reading-order places so the counts can be checked by eye
/* b14 - the answer: the hidden one shrinks. Same answers, same minutes, but one switch and one return. Every question
 * still gets asked: it is timing, not silence.
 *
 * Treatments considered:
 *  (A) a fresh 'after' grid beside the 'before' (rejected: two grids at half size, and the viewer predicted on THIS
 *      picture; a new one asks them to re-read instead of watch the change);
 *  (B) recolour four of the five runs to neutral (rejected: the units would vanish in place, so the green would
 *      still be in pieces and nothing would show that the work closes up);
 *  (C) CHOSEN: re-flow on the held grid. The morning travels back to full size; a box mark rings the red runs
 *      ('hidden'); the five ink units pulse together ('same minutes'); then one progress re-packs the morning:
 *      the red runs collapse into one run, the ink units gather at the agreed time, the green pieces close up into
 *      one block. Nothing pops; every unit is seen travelling, so the counts (14 green, 5 ink, 3 red) check by eye.
 *      The five slips move from the pile into a batch slot ('agreed time'), each gets a tick, and the slot is
 *      relabelled 'timing, not silence'.
 * Continuity: ends with green 0-13, ink 14-18, red 19-21 in reading order, five ticked slips in batch_slot.
 * b15 keeps strip, morning_grid, batch_slot; the batch slips and ticks are drawn inside batch_slot so they stay.
 * The freed cells (22 to 33) are left free: time given back, before the strip's marker.
 */
Loom.scene("b14", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const B = ctx.beat.id;
    const S = Loom.style, T = Loom.treat;
    const label = (name, o) => { const E = T.label(ctx, name, o); if (E.lead && o.t != null) Loom.tween(E.lead.inner, { opacity: 0 }, { opacity: 1, duration: 0.05 }, o.t, { kind: "reveal", beat: B, name: name + ".lead" }); return E; };
    const held = ["strip", "morning_grid", "slips", "margin_note"].map((n) => ctx.held(n));
    const [strip, G, pile, note] = held;
    void strip; void note;
    if (held.some((E) => !E) || !G.qq || !pile.qq) { Loom.error("qq_held_state", "b14 needs the morning page from b08 to b13"); return; }
    const P = 98, H = 44, COLS = 12;
    const ctr = (i) => [(i % COLS + 0.5) * P, (Math.floor(i / COLS) + 0.5) * P];
    const RUNS = G.qq.runs || [[9, 10, 11], [15, 16, 17], [20, 21, 22], [26, 27, 28], [31, 32, 33]];

    const tHidden = ctx.cue("The hidden one");
    const tSame = ctx.cue("Same answers, same minutes");
    const tSwitch = ctx.cue("But one switch, and one return");
    const tEvery = ctx.cue("Every question still gets asked");
    const tTiming = ctx.cue("It is timing, not silence");

    // ---- the morning travels back to full size as the quiz veil clears (same keyed drive as b12's travel)
    held.forEach((E) => {
      const cur = E.__pos || { x: 0, y: 0, s: 1 };
      Loom.drive((e) => E.mover.setAttribute("transform",
        `translate(${(cur.x * (1 - e)).toFixed(2)} ${(cur.y * (1 - e)).toFixed(2)}) scale(${(cur.s + (1 - cur.s) * e).toFixed(4)})`),
        tHidden, 0.9, "editorial", { kind: "travel", beat: B, name: E.name, key: "qq.mv." + E.name });
      E.__pos = { x: 0, y: 0, s: 1 };
    });

    // ---- a box mark rings each red run (seed mark: box), and 'hidden' is lettered under them
    // @form box_ring: a thin ink box drawn round a run of units to single it out before it changes
    const boxes = Loom.svg("g", {}, G.qq.layer);
    RUNS.forEach((run, r) => {
      const lx = (run[0] % COLS) * P + 5 - 9, ty = Math.floor(run[0] / COLS) * P + 5 - 9;
      const d = `M${lx} ${ty} H${lx + 3 * P - 10 + 18} V${ty + 2 * H + 18} H${lx} Z`;
      const pth = Loom.svg("path", { d, fill: "none", stroke: S.c("ink"), "stroke-width": 4, "stroke-linejoin": "round" }, boxes);
      m.draw(pth, tHidden + 0.75 + r * 0.06, { dur: 0.5 });
    });
    const runCx = (r) => 195 + (RUNS[r][1] % COLS + 0.5) * P, runBottom = (r) => 175 + Math.floor(RUNS[r][0] / COLS) * P + P + 4;
    const lblHidden = label("hidden_label", { x: runCx(3) + 110, y: 812, text: props.answer_label || "hidden", to: [runCx(3), runBottom(3) + 4], tone: "accent", role: "label", t: tHidden + 1.0 });

    // ---- same answers, same minutes: the five ink units pulse together; 'same minutes' lettered beside the last one
    const inks = Object.keys(G.qq.cells).map(Number).filter((i) => G.qq.cells[i].kind === "ink").sort((a, b) => a - b);
    inks.forEach((i) => {
      const [cx, cy] = ctr(i), c = G.qq.cells[i];
      Loom.drive((e) => c.place.setAttribute("transform", `translate(${cx} ${cy}) scale(${(1 + 0.16 * Math.sin(Math.PI * e)).toFixed(4)})`),
        tSame + 0.1, 0.7, "editorial", { kind: "emphasis", beat: B, name: `morning_grid.ink.${i}.pulse`, content: true, key: "qq.cell." + i });
    });
    const lastInk = inks[inks.length - 1];
    const lblSame = label("same_label", { x: 195 + ctr(lastInk)[0] + 150, y: 812, text: props.same_label || "same minutes", to: [195 + ctr(lastInk)[0], 175 + ctr(lastInk)[1] + H + 6], tone: "ink", role: "label", t: tSame + 0.5 });

    // ---- the re-pack: one progress; red collapses first, the ink gathers, then the green closes up
    const tR = tSwitch + 0.35, DR = 2.0;
    // marks and labels that point at the old places leave first
    Loom.tween(boxes, { opacity: 1 }, { opacity: 0, duration: 0.3, ease: Loom.ease.exit }, tSwitch, { kind: "exit", beat: B, name: "morning_grid.boxes" });
    m.exit(lblHidden, tSwitch, "recede");
    m.exit(lblSame, tSwitch + 0.05, "recede");
    (G.qq.badges || []).forEach((s, r) => Loom.tween(s.E.life, { opacity: 1 }, { opacity: 0, duration: 0.35, ease: Loom.ease.exit }, tSwitch + 0.1 + r * 0.04, { kind: "exit", beat: B, name: `badge_${r + 1}.out` }));
    const sub = (e, a, b) => Math.max(0, Math.min(1, (e - a) / (b - a)));
    const ez = Loom.ease.editorial;
    const moves = [];
    // targets in reading order: green 0..13, ink 14..18, red 19..21
    const order = Object.keys(G.qq.cells).map(Number).sort((a, b) => a - b);
    const greens = order.filter((i) => G.qq.cells[i].kind === "work");
    greens.forEach((i, j) => moves.push({ i, to: j, ph: [0.5, 1.0], kind: "work" }));
    inks.forEach((i, j) => moves.push({ i, to: greens.length + j, ph: [0.25, 0.75], kind: "ink" }));
    const redBase = greens.length + inks.length;
    RUNS.forEach((run, r) => run.forEach((i, k) => moves.push({ i, to: redBase + k, ph: [0, 0.5], kind: "red", keep: r === 0, k, r })));
    // where each cell is now (b11 squeezed the red units toward their run's start)
    const runLeft = (r) => (RUNS[r][0] % COLS) * P + 5;
    moves.forEach((mv) => {
      const c = G.qq.cells[mv.i];
      if (!c) { Loom.error("qq_cell_missing", `b14: no cell ${mv.i}`); return; }
      const [x0n, y0] = ctr(mv.i);
      const sx0 = mv.kind === "red" && c.squeezed ? 0.5 : 1;
      const x0 = mv.kind === "red" && c.squeezed ? runLeft(mv.r) + mv.k * 47 + 22 : x0n;
      const [x1, y1] = ctr(mv.to);
      const sx1 = mv.kind === "red" && !mv.keep ? 0.5 : 1;
      Loom.drive((E) => {
        const e = ez(sub(E, mv.ph[0], mv.ph[1]));
        const x = x0 + (x1 - x0) * e, y = y0 + (y1 - y0) * e, sx = sx0 + (sx1 - sx0) * e;
        c.place.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${sx.toFixed(4)} 1)`);
        if (mv.kind === "red" && !mv.keep) c.place.setAttribute("opacity", (1 - sub(E, mv.ph[0] + 0.25, mv.ph[1])).toFixed(3));
      }, tR, DR, "linear", { kind: "transform", beat: B, name: `morning_grid.reflow.${mv.i}`, content: true, key: "qq.cell." + mv.i });
    });
    // the hatch (stress) collapses with its runs into the single run and goes
    (G.qq.hatch || []).forEach((h, r) => {
      const dx = ctr(redBase)[0] - (runLeft(r) + 1.5 * P), dy = ctr(redBase)[1] - (Math.floor(RUNS[r][0] / COLS) * P + P / 2);
      Loom.drive((E) => {
        const e = ez(sub(E, 0, 0.5));
        h.g.setAttribute("transform", `translate(${(dx * e).toFixed(2)} ${(dy * e).toFixed(2)})`);
        h.g.setAttribute("opacity", (1 - sub(E, 0.1, 0.45)).toFixed(3));
      }, tR, DR, "linear", { kind: "transform", beat: B, name: `morning_grid.hatch.${r}.collapse`, content: true, key: "qq.hatch." + r });
    });
    Loom.sfx("whoosh", tR + 0.1);

    // ---- the batch slot opens under the pile; the five slips move into it
    // @form batch_slot: a card in the margin that gathers several small items into one agreed place, its label rewritten in place
    const BX = 1480, BY = 690, BW = 340, BH = 190;
    const slot = Loom.slot(ctx, "batch_slot", { x: BX, y: BY, w: BW, h: BH, frame: "card", token: "ink", role: "label", align: "center" });
    const tSlot = tSwitch + 0.05;
    slot.show({ text: props.batch_label || "agreed time", role: "label", maxLines: 2 }, tSlot);
    const SWb = 50, SHb = 44, GAPb = 8, x0b = (BW - (5 * SWb + 4 * GAPb)) / 2 + 6, y0b = 130;
    const batch = Loom.svg("g", {}, slot.E.inner);
    const slipsArr = pile.qq.slips || [];
    slipsArr.forEach((s, k) => {
      const tk = tR + 0.2 + k * 0.14;
      const bx = x0b + k * (SWb + GAPb), by = y0b;
      // the pile slip slides toward its batch place and fades as it arrives (its words never shrink below the floor)
      const tgx = BX + bx + SWb / 2 - 1480, tgy = BY + by + SHb / 2 - 288;
      const dx = tgx - s.x, dy = tgy - s.y;
      Loom.tween(s.g, { x: 0, y: 0, opacity: 1 }, { x: dx * 0.8, y: dy * 0.8, opacity: 0, duration: 0.55, ease: Loom.ease.move, immediateRender: false }, tk,
        { kind: "travel", beat: B, name: `slips.${k}.move`, content: true });
      // its batch counterpart lands in the slot as it arrives
      const g = Loom.svg("g", { transform: `translate(${bx + SWb / 2} ${by + SHb / 2})` }, batch);
      const gi = Loom.svg("g", {}, g);
      Loom.svg("rect", { x: -SWb / 2 + 3, y: -SHb / 2 + 3, width: SWb, height: SHb, rx: 3, fill: S.c("shadow"), opacity: 0.14 }, gi);
      Loom.svg("rect", { x: -SWb / 2, y: -SHb / 2, width: SWb, height: SHb, rx: 3, fill: S.c("surface"), stroke: S.c("line"), "stroke-width": 1.5 }, gi);
      const qm = kit.text(gi, "?", { role: "body", size: 30, x: -SWb / 2 + 2, y: -SHb / 2 + 1, w: SWb - 4, h: SHb - 2, maxLines: 1, align: "center", valign: "middle", color: "ink", weight: 700 });
      Loom.tween(gi, { opacity: 0, y: -14 }, { opacity: 1, y: 0, duration: 0.3, ease: Loom.ease.enter }, tk + 0.4, { kind: "settle", beat: B, name: `batch_slot.slip.${k}`, content: true });
      // every question still gets asked: a tick on each slip, left to right
      const mk = Loom.svg("g", { transform: `translate(${bx + SWb / 2} ${by + SHb / 2})` }, batch);   // the tick replaces the question mark on its own slip (it sat over the label before)
      const mki = Loom.svg("g", {}, mk);
      T.markShape(mki, true, 0, 0, 26, "accent4", {});
      Loom.tween(mki, { opacity: 0, scale: 1.3, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.3, ease: Loom.ease.enter }, tEvery + 0.1 + k * 0.15,
        { kind: "stamp", beat: B, name: `batch_slot.tick.${k}`, content: true });
      Loom.tween(qm, { opacity: 1 }, { opacity: 0, duration: 0.15, ease: "none" }, tEvery + 0.1 + k * 0.15, { kind: "state", beat: B, name: `batch_slot.q.${k}`, content: true });
    });
    Loom.sfx("card", tR + 0.6);
    Loom.sfx("tick", tEvery + 0.2);
    Loom.sfx("tick", tEvery + 0.8);
    // the emptied pile (its counter and label) leaves once the slips have gone
    m.exit(pile, tR + 0.2 + 4 * 0.14 + 0.6, "recede");

    // ---- it is timing, not silence: the slot keeps its place and its slips, and is relabelled
    slot.relabel(props.rule || "timing, not silence", tTiming);
  },
});
