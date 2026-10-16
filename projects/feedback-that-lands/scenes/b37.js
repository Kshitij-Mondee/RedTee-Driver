// @design card_on_desk_filled_in_steps: a blank ruled card lies on a desk seen from above; later beats write into it one line at a time
/* b37 - your own week. The viewer's own desk, drawn plainly from above: a pale wood top with a few plank seams,
 * the edge of a laptop, a mug, a closed notebook, a pen. Treatments considered: (A) a bare title card (the
 * template alternative, rejected: it names the task but shows no place to do it), (B) a whiteboard with four
 * boxes (rejected: this is a private desk, not a room), (C) CHOSEN: a desk with a blank four-line card the
 * viewer will fill. The card is built ONCE here (frame, then rules, then header) and held through b41, so
 * b38 to b41 only ever ADD a line to it. Everything below is nested in `desk`, so the small push is one tween
 * on one element and the later beats inherit it.
 */
Loom.scene("b37", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const svg = Loom.svg;
    const meta = (name) => ({ kind: "travel", beat: ctx.beat.id, name, content: false });

    // quiet material tones, mixed from tokens (no literals): pale wood, its seams, a coffee, a notebook cover
    const wood = S.mix(S.c("accent2"), S.c("field"), 0.7);
    const woodSeam = S.darken(wood, 0.12);
    const woodGrain = S.darken(wood, 0.05);
    const coffee = S.mix(S.c("ink"), S.c("accent2"), 0.45);
    const cover = S.mix(S.c("accent"), S.c("surface2"), 0.6);
    const ruleTone = S.mix(S.c("line"), S.c("surface"), 0.45);

    // ---- the desk: a pale wood top seen from above, with seams and a faint grain (the world, first)
    const desk = ctx.el("desk", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    svg("rect", { x: -60, y: -60, width: 2040, height: 1200, fill: wood }, desk.inner);
    [270, 560, 850].forEach((y) => svg("rect", { x: -60, y, width: 2040, height: 4, fill: woodSeam, opacity: 0.55 }, desk.inner));
    const rng = Loom.rng("desk37");
    for (let i = 0; i < 34; i++) {
      const y = 20 + rng() * 1040, x0 = -40 + rng() * 1200, len = 260 + rng() * 620, bow = (rng() - 0.5) * 14;
      svg("path", { d: `M${x0.toFixed(0)} ${y.toFixed(0)} q${(len / 2).toFixed(0)} ${bow.toFixed(1)} ${len.toFixed(0)} 0`, fill: "none", stroke: woodGrain, "stroke-width": 2, "stroke-linecap": "round", opacity: 0.5 }, desk.inner);
    }
    svg("rect", { x: -60, y: 1010, width: 2040, height: 120, fill: S.darken(wood, 0.1) }, desk.inner);   // the front edge of the desk
    svg("rect", { x: -60, y: 1006, width: 2040, height: 6, fill: S.darken(wood, 0.2), opacity: 0.6 }, desk.inner);

    // window light across the wood: two pale bands that drift very slowly (ambient, period-locked)
    const light = ctx.el("window_light", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none", parent: desk.inner });
    svg("path", { d: "M150 -40 L560 -40 L1180 1100 L760 1100 Z", fill: S.c("surface"), opacity: 0.16 }, light.inner);
    svg("path", { d: "M700 -40 L840 -40 L1460 1100 L1320 1100 Z", fill: S.c("surface"), opacity: 0.1 }, light.inner);
    m.drift(light, ctx.start, ctx.end, { amp: 7, period: 6 });

    // a laptop at the left, seen from above like everything on this desk (step 7 drew its screen facing the camera
    // in a top-down shot, L-172): the deck and keys, the lid edge-on
    // @form desk_prop_laptop: a laptop drawn as a quiet prop beside the work surface
    const lap = ctx.el("laptop", { x: 40, y: 330, w: 500, h: 380, kind: "scenery", exit: "recede", parent: desk.inner });
    svg("ellipse", { cx: 262, cy: 340, rx: 200, ry: 22, fill: S.c("shadow"), opacity: 0.14 }, lap.inner);
    Loom.obj.shape(lap.inner, "laptop", 262, 200, 440, { key: "laptop37", detail: 3, state: { facing: "top" }, shadow: false });

    // a mug seen from above: saucer, cup, coffee, a highlight, the handle
    // @form desk_prop_mug: a mug seen from above, as a small prop beside the work surface
    const mug = ctx.el("mug", { x: 1610, y: 100, w: 230, h: 210, kind: "scenery", exit: "recede", parent: desk.inner });
    svg("ellipse", { cx: 108, cy: 118, rx: 92, ry: 88, fill: S.c("shadow"), opacity: 0.14 }, mug.inner);
    kit.disc(mug.inner, 100, 104, 86, { fill: "surface2", shadow: false, flat: true });
    kit.disc(mug.inner, 100, 104, 66, { fill: "surface", shadow: false, flat: true });
    svg("path", { d: "M164 80 q50 24 0 48", fill: "none", stroke: S.c("surface"), "stroke-width": 20, "stroke-linecap": "round" }, mug.inner);
    svg("circle", { cx: 100, cy: 104, r: 52, fill: coffee }, mug.inner);
    svg("ellipse", { cx: 82, cy: 86, rx: 22, ry: 10, fill: S.c("surface"), opacity: 0.22, transform: "rotate(-30 82 86)" }, mug.inner);

    // a closed notebook, turned a little
    // @form desk_prop_notebook: a closed notebook with a spine and an elastic band, turned a little on the surface
    const nb = ctx.el("notebook", { x: 1600, y: 360, w: 250, h: 330, kind: "scenery", exit: "recede", parent: desk.inner });
    const nbg = svg("g", { transform: "rotate(-5 125 165)" }, nb.inner);
    svg("rect", { x: 22, y: 20, width: 214, height: 300, rx: 12, fill: S.c("shadow"), opacity: 0.14 }, nbg);
    svg("rect", { x: 14, y: 10, width: 214, height: 300, rx: 12, fill: cover }, nbg);
    svg("rect", { x: 14, y: 10, width: 36, height: 300, rx: 12, fill: S.darken(cover, 0.14) }, nbg);
    svg("rect", { x: 188, y: 10, width: 10, height: 300, fill: S.darken(cover, 0.22) }, nbg);
    svg("rect", { x: 78, y: 70, width: 100, height: 14, rx: 7, fill: S.c("surface"), opacity: 0.8 }, nbg);

    // ---- the card: frame first (draws), then its ruled lines (draw), then the header (writes)
    const CX = 620, CY = 96, CW = 900, CH = 790;
    const tFrame = ctx.cue("Which piece of a report's work");
    // @form ruled_numbered_card: a paper card with a header rule and numbered ruled lines, blank until filled
    const card = ctx.el("pcard", { x: CX, y: CY, w: CW, h: CH, kind: "card", exit: "recede", parent: desk.inner });
    kit.rect(card.inner, 0, 0, CW, CH, { fill: "surface", r: 12 });
    m.settle(card, tFrame, { dy: 20 });
    const frame = ctx.el("pcard_frame", { x: CX, y: CY, w: CW, h: CH, kind: "card", exit: "recede", parent: desk.inner });
    svg("path", { d: `M12 0 H${CW - 12} Q${CW} 0 ${CW} 12 V${CH - 12} Q${CW} ${CH} ${CW - 12} ${CH} H12 Q0 ${CH} 0 ${CH - 12} V12 Q0 0 12 0 Z`, fill: "none", stroke: S.c("line"), "stroke-width": 3, opacity: 0.6 }, frame.inner);
    m.draw(frame, tFrame, { dur: 0.9 });

    // rows: three single lines and a fourth that holds two (4a and 4b)
    const rowY = [150, 280, 410, 540];
    const rules = ctx.el("pcard_rules", { x: CX, y: CY, w: CW, h: CH, kind: "connector", exit: "recede", parent: desk.inner });
    const ruleAt = (y) => svg("line", { x1: 130, y1: y, x2: 850, y2: y, stroke: ruleTone, "stroke-width": 3, "stroke-linecap": "round" }, rules.inner);
    svg("line", { x1: 56, y1: 124, x2: 844, y2: 124, stroke: S.c("ink"), "stroke-width": 3, "stroke-linecap": "round", opacity: 1 }, rules.inner);
    rowY.forEach((y0) => ruleAt(y0 + 96));
    ruleAt(rowY[3] + 186);
    const tRules = tFrame + 0.45, dRules = 2.1;
    m.draw(rules, tRules, { dur: dRules });

    // the four numerals pop as their own rule draws
    rowY.forEach((y0, i) => {
      const n = ctx.el("num_" + (i + 1), { x: CX + 44, y: CY + y0 + 34, w: 56, h: 56, kind: "node", exit: "recede", parent: desk.inner });
      kit.disc(n.inner, 28, 28, 28, { fill: "surface2", shadow: false, flat: true });
      kit.text(n.inner, String(i + 1), { role: "label", x: 0, y: 0, w: 56, h: 56, align: "center", valign: "middle", maxLines: 1, color: "ink", weight: 700 });
      m.pop(n, tRules + (1 + i) * (dRules / 6) - 0.05, { overshoot: false });
    });

    // the header writes across the top on "Pick just one"
    const hd = ctx.el("header", { x: CX + 56, y: CY + 26, w: 788, h: 84, kind: "text", exit: "wipe", parent: desk.inner });
    const hdT = kit.text(hd.inner, "One piece of work", { role: "title", x: 0, y: 0, w: 788, h: 84, maxLines: 1, size: 64, color: "ink", valign: "middle" });
    const tHead = ctx.cue("Pick just one");
    m.reveal(hd, tHead, { dy: 0, dur: 0.1 });
    m.typewriter(hdT, tHead, { cps: 15 });

    // the pen rests to the right of the card; its tip is at the element's left-bottom. b38 moves it to line 1.
    // @form pen_that_travels: a pen drawn from above whose tip travels to the line being written
    const pen = ctx.el("pen", { x: 1580, y: 720, w: 240, h: 140, kind: "scenery", exit: "recede", parent: desk.inner });
    const pg = svg("g", { transform: "translate(8 128) rotate(-28)" }, pen.inner);
    svg("rect", { x: 6, y: -2, width: 226, height: 20, rx: 10, fill: S.c("shadow"), opacity: 0.16 }, pg);
    svg("polygon", { points: "0,0 34,-7 34,7", fill: S.c("ink") }, pg);
    svg("rect", { x: 34, y: -8, width: 44, height: 16, fill: S.c("ink") }, pg);
    svg("rect", { x: 78, y: -9, width: 136, height: 18, rx: 9, fill: S.c("accent") }, pg);
    svg("rect", { x: 78, y: -9, width: 12, height: 18, fill: S.c("surface") }, pg);
    svg("rect", { x: 196, y: -9, width: 24, height: 18, rx: 9, fill: S.c("ink") }, pg);
    svg("rect", { x: 100, y: -4, width: 80, height: 3, rx: 1.5, fill: S.c("surface"), opacity: 0.5 }, pg);

    // ---- a small push toward the card as the narration opens: one tween on `desk`, held by every later beat
    const tPush = ctx.cue("your own week");
    const sc = 1.035, px = CX + CW / 2, py = CY + CH / 2;
    Loom.tween(desk.mover, { x: 0, y: 0, scale: 1, transformOrigin: "0 0" }, { x: px * (1 - sc), y: py * (1 - sc), scale: sc, duration: Math.max(2, ctx.speechEnd - tPush), ease: Loom.ease.editorial }, tPush, meta("desk"));
    desk.__pos = { x: 0, y: 0, s: sc };
  },
});
