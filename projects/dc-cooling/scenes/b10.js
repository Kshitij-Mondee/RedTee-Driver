// @design exhaust_chain: each unit of a line breathes what the one before it gave off, one shade warmer at every step
/* b10 (station floor_plan, continue): "The back row. Each row breathes the exhaust ahead. So the room gets
 * over-cooled, and that wastes energy."
 *
 * Three treatments considered (animation gate: this beat IS a change over time, the heat handed on row by row):
 *   A. Colour the four rows cool to warm and say it. A static ramp tells the viewer a result and never shows the cause.
 *   B. Run the plan: short streams cross each aisle from one row's back into the next row's front, each a shade
 *      warmer than the last (accent4 shading to accent2), so the viewer WATCHES the exhaust feed the next row; row 4
 *      is marked first as the answer to b09, and the units pushing harder tints the floor cool: over-cooled.
 *   C. A thermometer per row. Numbers the knowledge sheet does not give, and a second picture to read.
 *   B wins.
 *
 * Held from b09 (the plan is the b08 Loom.lesson.floor_plan handle, never rebuilt): floor_plan (E.kit, so its calls stay in time order: markRow then overcool), rows, front_arrows,
 * row_numbers. New here: the four streams (four lanes each), their two tags. The streams and tags are not held, so the
 * engine retires them in reading order at the join, before b11 turns the rows; b11 clears the floor tint itself.
 * Stage 0 is the cool supply from the units into row 1's front; stage s (1..3) is row s's back into row s+1's front.
 * Lanes sit over the cooling units' fans and clear of the front arrows (x 750 in plan coordinates).
 */
Loom.scene("b10", {
  build(ctx) {
    const { kit, m } = ctx;
    const T = Loom.treat;
    const OX = 210, OY = 107;                       // the plan's frame position
    const S = Loom.style;
    const FAST = ctx.style.dur("exit") / 2;          // a short fade, from the pack's exit time

    // ---- times, all from the narration
    const tBack = ctx.cue("The back row");
    const tEach = ctx.cue("Each row breathes the exhaust ahead");
    const tExh = ctx.cue("the exhaust ahead");
    const tSo = ctx.cue("So the room gets");
    const tOver = ctx.cue("over-cooled");

    // ---- the held plan, its numbers and the named boxes
    const E = ctx.held("floor_plan");
    const plan = E.kit;
    ctx.held("rows"); ctx.held("front_arrows"); ctx.held("row_numbers");

    // "The back row": row 4 is the answer, ringed and its number disc turned accent
    plan.markRow(4, 1, tBack, 0.4);

    // ---- the streams: plan coordinates (part x, y) -> the stream element's local coordinates
    const BX = 440, BY = 100;                       // the streams element's origin in plan coordinates
    const streams = ctx.el("row_streams", { x: OX + BX, y: OY + BY, w: 620, h: 660, kind: "connector" });
    const LANES = [524, 596, 904, 976];              // over the four unit fans, clear of the arrows at 750
    // stage: [y start, y end] in plan coordinates (the head lands on the next row's front edge)
    const STAGES = [[748, 704], [618, 512], [426, 320], [234, 128]];
    const WARM = [0, 1 / 3, 2 / 3, 1];               // accent4 (cool) shading to accent2 (warm), the back row's inlet the warmest
    const cool = ctx.c("accent4"), warm = ctx.c("accent2"), halo = ctx.c("surface");
    const SW = 8, SW_PUSH = 15;
    const stageEls = [];                             // leave with the streams element, in one go
    const supply = [];                               // the supply lanes, thickened on "over-cooled"

    // @form exhaust_stream: a short bead stream that crosses a gap from one thing's back into the next thing's front
    STAGES.forEach((st, k) => {
      const colour = S.mix(cool, warm, WARM[k]);
      const t0 = tEach + 0.4 * k;
      const stage = ctx.el("stream_" + (k + 1), { x: 0, y: 0, w: 620, h: 660, kind: "connector", parent: streams.inner });
      stageEls.push(stage); stage.followers = [];
      LANES.forEach((px, li) => {
        const x = px - BX, y0 = st[0] - BY, y1 = st[1] - BY;
        const g = Loom.svg("g", {}, stage.inner);
        // a white halo under the coloured line so the stream reads over the units and the dark rows
        const under = Loom.svg("path", { d: `M${x} ${y0} L${x} ${y1 + 12}`, fill: "none", stroke: halo, "stroke-width": SW + 8, "stroke-linecap": "round" }, g);
        const line = Loom.svg("path", { d: `M${x} ${y0} L${x} ${y1 + 12}`, fill: "none", stroke: colour, "stroke-width": SW, "stroke-linecap": "round" }, g);
        const hs = 22, dir = y1 < y0 ? -1 : 1;
        const head = Loom.svg("polygon", { points: `${x},${y1} ${x - hs * 0.62},${y1 - dir * hs} ${x + hs * 0.62},${y1 - dir * hs}`, fill: colour, stroke: halo, "stroke-width": 3, "stroke-linejoin": "round", "paint-order": "stroke" }, g);
        m.draw(under, t0 + 0.05 * li, { dur: 0.5 });
        m.draw(line, t0 + 0.05 * li, { dur: 0.5 });
        Loom.tween(head, { opacity: 0 }, { opacity: 1, duration: FAST }, t0 + 0.05 * li + 0.42, { kind: "draw", name: "stream_" + (k + 1) });
        Loom.tween(g, { opacity: 0 }, { opacity: 1, duration: FAST }, t0 + 0.05 * li, { kind: "reveal", name: "stream_" + (k + 1), content: true });
        if (k === 0) supply.push([line, under]);
        // the packet that rides it: m.along on a bead element, centred on the ruler (shifted by its radius)
        const R = 10, ruler = Loom.svg("path", { d: `M${x - R} ${y0 - R} L${x - R} ${y1 - R}`, fill: "none", stroke: "none" }, stage.inner);
        const bead = ctx.el(`bead_${k + 1}_${li + 1}`, { x: 0, y: 0, w: 2 * R, h: 2 * R, kind: "token", parent: stage.inner });
        stage.followers.push(bead);
        kit.disc(bead.inner, R, R, R, { fill: "surface", shadow: false });
        Loom.svg("circle", { cx: R, cy: R, r: R * 0.62, fill: colour }, bead.inner);
        Loom.tween(bead.inner, { opacity: 0 }, { opacity: 1, duration: FAST }, t0 + 0.3 + 0.05 * li, { kind: "reveal", name: bead.name, content: true });
        m.along(bead, ruler, t0 + 0.35 + 0.05 * li, { dur: 0.7, ease: "linear" });
        Loom.tween(bead.inner, { opacity: 1 }, { opacity: 0, duration: FAST, immediateRender: false }, t0 + 1.0 + 0.05 * li, { kind: "exit", name: bead.name });
      });
    });
    streams.followers = stageEls;
    m.reveal(streams, tEach, { dy: 0, dur: 0.2 });

    // ---- the tags: planted beside the streams and on the cooling units (plan flags per the lesson's seed)
    // @form note_flag: a short flag planted on the thing it describes, naming what the viewer is watching change
    const tagWarmer = T.label(ctx, "tag_warmer", { x: 1280 + 160, y: 470, text: "Warmer row by row", to: [1280, 524], tone: "accent2", t: tExh });
    const tagOver = T.label(ctx, "tag_overcooled", { x: 1292 + 120, y: 784, text: "Over-cooled", to: [1292, 856], tone: "accent4", t: tOver });

    // ---- "So the room gets over-cooled": the units push harder (supply thickens) and the floor tints cool
    plan.overcool(1, tSo, 0.8);
    supply.forEach(([ln, ul]) => {
      Loom.drive((e) => {
        const w = SW + (SW_PUSH - SW) * e;
        ln.setAttribute("stroke-width", w.toFixed(2)); ul.setAttribute("stroke-width", (w + 8).toFixed(2));
      }, tSo, 0.7, "move", { kind: "emphasis", name: "supply_push", content: true });
    });

    // retire in reading order once the voice has finished, before b11's rows turn: streams, then the two tags
    const tEnd = ctx.speechEnd + 0.03;
    m.exit(streams, tEnd, "recede");
    m.exit(tagWarmer, tEnd + 0.12, "recede");
    m.exit(tagOver, tEnd + 0.24, "recede");
  },
});
