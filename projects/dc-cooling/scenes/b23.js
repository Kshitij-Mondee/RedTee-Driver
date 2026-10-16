// @design two_loops_exchanger: two closed loops meet only at a plate stack; heat crosses it while each fluid stays in its own loop
/* b23, inside the CDU: a clean schematic, no cabinet detail.
 * Three treatments considered (animation gate: motion only where the taught thing changes over time):
 *   A. a cutaway of the CDU cabinet with pipes and a pump (rejected: the film wants the two loops, not the cabinet);
 *   B. two side-by-side cards "rack side" and "facility side" with an arrow between (rejected: it hides that the
 *      liquids are physically separate; a card pair reads as two lists, not as one machine);
 *   C. WINNER: one schematic. Closed rack loop on the left, closed facility loop on the right, a plate stack with a
 *      plain strip down its middle between them. Beads circulate in each loop (cool/warm by position), warm chevrons
 *      cross the plates left to right. Only the beads and the chevrons move: that is the change over time.
 * Accuracy rules kept: no bead ever leaves its own loop; heat (chevrons) is the only thing that crosses the plates;
 * the rack loop arrives warm (accent2) and leaves cool (accent4); the facility loop arrives cool and leaves warm.
 * The accent follows the narration: rack loop, then facility loop, then the heat exchanger (one at a time).
 * Loop beads run counter-flow through the exchanger (rack channel flows down, facility channel flows up).
 */
Loom.scene("b23", {
  build(ctx) {
    const { kit, m } = ctx;
    const c = (t) => ctx.c(t);
    const S = Loom.style;
    const tWatch = ctx.cue("Here is the part to watch");
    const tTwo = ctx.cue("Two loops");
    const tRack = ctx.cue("The rack loop");
    const tFac = ctx.cue("The facility water loop");
    const tHX = ctx.cue("A heat exchanger passes heat across");
    const tNever = ctx.cue("The liquids never mix");
    const tEnd = ctx.end;

    // a value that is sent to a new value at an absolute time (pure function of time; same pattern as the lesson kit)
    const track = (init, apply) => {
      const key = Loom.uid("b23t");
      const T = { v: init };
      apply(init);
      T.to = (v, t, d) => {
        const a = T.v, dd = d > 0 ? d : 0.4;
        T.v = v;
        Loom.drive((e) => apply(a + (v - a) * e), t, dd, "move", { key, kind: "kit", content: true });
        return t + dd;
      };
      return T;
    };

    // ---- geometry (E-local; the whole schematic is shifted by (OX, OY) so the safe area holds it)
    const OX = 96, OY = 100;
    const E = ctx.el("cdu_schematic", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    const G = Loom.svg("g", { transform: `translate(${OX} ${OY})` }, E.inner);
    const RX = 690, FX = 1038, TOP = 190, BOT = 610, RL = 130, FR = 1598;   // channel x of each loop, pipe rows, outer edges
    const warm = c("accent2"), cool = c("accent4");
    const mixc = (a, b, v) => S.mix(a, b, Math.max(0, Math.min(1, v)));

    // ---- the heat exchanger: body, six thin plates in two groups, a plain strip between them
    // @form plate_stack: a body of thin parallel plates with a plain strip down its middle
    const HX = ctx.el("heat_exchanger", { parent: G, x: 620, y: 120, w: 488, h: 560, kind: "instrument", exit: "recede" });
    kit.rect(HX.inner, 0, 0, 488, 560, { fill: "surface", stroke: "line", r: 24 });
    const plates = [];
    [136, 162, 188, 300, 326, 352].forEach((x) => plates.push(Loom.svg("rect", { x, y: 30, width: 12, height: 500, rx: 5, fill: c("accent3") }, HX.inner)));
    const stripEl = ctx.el("gap_strip", { parent: HX.inner, x: 212, y: 30, w: 64, h: 500, kind: "scenery", exit: "recede" });
    const stripFill = Loom.svg("rect", { x: 0, y: 0, width: 64, height: 500, fill: c("field"), stroke: c("line"), "stroke-width": 2 }, stripEl.inner);
    const stripT = track(0, (v) => {
      stripFill.setAttribute("fill", mixc(c("field"), c("accent"), 0.16 * v));
      stripFill.setAttribute("stroke", mixc(c("line"), c("accent"), v));
    });
    const platesT = track(0, (v) => plates.forEach((p) => p.setAttribute("fill", mixc(c("accent3"), c("accent"), v))));

    // ---- the two ends the loops run out to: a rack on the left, the building on the right (both small, plain)
    // @form loop_end_rack: a slim cabinet of server bars that a pipe runs through
    const rackEnd = ctx.el("rack_end", { parent: G, x: RL - 62, y: 270, w: 124, h: 260, kind: "scenery", exit: "recede" });
    kit.rect(rackEnd.inner, 0, 0, 124, 260, { fill: "ink", r: 10, shadow: false });
    for (let i = 0; i < 5; i++) kit.rect(rackEnd.inner, 12, 14 + i * 47, 100, 38, { fill: "surface", r: 6, shadow: false });
    const bld = Loom.obj.draw(ctx, "building_end", "building", { x: FR, y: 400, size: 190, tone: "accent3", detail: 1, parent: G });

    // ---- the pipes: an outline stroke and a plain inner stroke, drawn outward from the exchanger in two halves
    const PW = 30, PI = 20;
    const halves = (x0, x1, up) => {
      // half A goes to the top row then out and round to the middle of the outer edge; half B does the same below
      const a = `M ${x0} 400 V ${TOP} H ${x1} V 400`, b = `M ${x0} 400 V ${BOT} H ${x1} V 400`;
      return [a, b];
    };
    const mkLoop = (name, x0, x1, outlineTok) => {
      const L = ctx.el(name, { parent: G, x: 0, y: 0, w: 1728, h: 800, kind: "connector", exit: "recede" });
      const pipeG = Loom.svg("g", {}, L.inner);
      const ds = halves(x0, x1);
      const outlines = ds.map((d) => Loom.svg("path", { d, fill: "none", stroke: c(outlineTok), "stroke-width": PW, "stroke-linecap": "round", "stroke-linejoin": "round" }, pipeG));
      ds.forEach((d) => Loom.svg("path", { d, fill: "none", stroke: c("surface"), "stroke-width": PI, "stroke-linecap": "round", "stroke-linejoin": "round" }, pipeG));
      return { E: L, pipeG, outlines, base: c(outlineTok) };
    };
    // @form closed_loop_pipe: a closed pipe loop drawn in two halves that meet at its far end, with beads inside
    const rack = mkLoop("rack_loop", RX, RL, "accent3");
    const fac = mkLoop("facility_loop", FX, FR, "muted");

    // ---- beads: one closed path per loop; colour by position (warm to cool, cool to warm), period-locked
    const colRack = (f) => (f < 0.214 ? mixc(warm, cool, f / 0.214) : f < 0.5 ? cool : f < 0.714 ? mixc(cool, warm, (f - 0.5) / 0.214) : warm);
    const colFac = (f) => (f < 0.214 ? mixc(cool, warm, f / 0.214) : f < 0.5 ? warm : f < 0.714 ? mixc(warm, cool, (f - 0.5) / 0.214) : cool);
    const beadLoop = (parentE, d, colorAt) => {
      const g = Loom.svg("g", { opacity: 0 }, parentE.inner);
      const ruler = Loom.svg("path", { d, fill: "none", stroke: "none" }, g);
      const L = ruler.getTotalLength(), n = Math.round(L / 40), gap = L / n;
      const dots = [];
      for (let i = 0; i < n; i++) dots.push(Loom.svg("circle", { r: 6.5, cx: -50, cy: -50, fill: "none" }, g));
      const render = (phase) => {
        for (let i = 0; i < n; i++) {
          const pos = ((i + 0.5 + phase) % n) * gap, p = ruler.getPointAtLength(pos);
          dots[i].setAttribute("cx", Math.round(p.x * 100) / 100);
          dots[i].setAttribute("cy", Math.round(p.y * 100) / 100);
          dots[i].setAttribute("fill", colorAt(pos / L));
        }
      };
      render(0);
      const op = track(0, (v) => g.setAttribute("opacity", Math.round(v * 100) / 100));
      const key = Loom.uid("b23b");
      return {
        show: (t) => op.to(1, t, 0.5),
        flow: (t0, t1, speed) => {
          const k = Math.max(1, Math.round((t1 - t0) * speed / gap));
          Loom.drive((e, raw) => render((raw * k) % 1), t0, t1 - t0, "linear", { key, kind: "flow", content: true });
        },
      };
    };
    const beadsRack = beadLoop(rack.E, `M ${RX} ${TOP} V ${BOT} H ${RL} V ${TOP} H ${RX}`, colRack);
    const beadsFac = beadLoop(fac.E, `M ${FX} ${BOT} V ${TOP} H ${FR} V ${BOT} H ${FX}`, colFac);

    // ---- heat pulses: warm chevrons cross the plates left to right (the one thing that crosses)
    // @form heat_across_wall: small warm chevrons that cross a wall from the hot side to the cool side
    const pulsesE = ctx.el("heat_pulses", { parent: G, x: RX + 18, y: 150, w: FX - RX - 36, h: 500, kind: "token", exit: "recede" });
    const PL = FX - RX - 36, rows = [90, 175, 260, 345, 430];
    const chev = [];
    rows.forEach((y, r) => {
      for (let i = 0; i < 2; i++) chev.push({ y, off: i / 2 + r * 0.17, el: Loom.svg("path", { d: "M -8 -12 L 5 0 L -8 12", fill: "none", stroke: warm, "stroke-width": 7, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: 0 }, pulsesE.inner) });
    });
    const renderChev = (phase) => chev.forEach((q) => {
      const u = (q.off + phase) % 1, a = Math.max(0, Math.min(1, u * 7, (1 - u) * 7));
      q.el.setAttribute("transform", `translate(${Math.round(u * PL * 10) / 10} ${q.y})`);
      q.el.setAttribute("opacity", Math.round(a * 100) / 100);
    });
    renderChev(0.5);
    const chevKey = Loom.uid("b23c");
    const pulseStart = tHX + 0.35;
    const chevLaps = Math.max(1, Math.round((tEnd - pulseStart) * 110 / PL));
    Loom.drive((e, raw) => renderChev((raw * chevLaps) % 1), pulseStart, tEnd - pulseStart, "linear", { key: chevKey, kind: "flow", content: true });

    // ---- labels: white pills hung on the part they name, a thin leader to it; `named` turns one accent
    const tag = (name, text, cx, cy, toY) => {
      const size = 30, w = Math.ceil(kit.measure(text, "label", size, 700)) + 52, h = 54;
      const E2 = ctx.el(name, { parent: G, x: cx - w / 2, y: cy - h / 2, w, h: toY - (cy - h / 2) + 8, kind: "node", exit: "recede" });
      const g = E2.inner;
      kit.line(g, w / 2, h, w / 2, toY - (cy - h / 2), { stroke: "muted", sw: 2 });
      kit.disc(g, w / 2, toY - (cy - h / 2), 5, { fill: "muted", shadow: false });
      kit.pill(g, 0, 0, w, h, { fill: "surface" });
      const over = Loom.svg("g", {}, g);
      kit.pill(over, 0, 0, w, h, { fill: "accent", shadow: false });
      over.setAttribute("opacity", 0);
      const tx = kit.text(g, text, { role: "label", size, weight: 700, x: 8, y: 0, w: w - 16, h, align: "center", valign: "middle", maxLines: 1, color: "ink" });
      const named = track(0, (v) => { over.setAttribute("opacity", Math.round(v * 100) / 100); tx.setAttribute("fill", mixc(c("ink"), c("onAccent"), v)); });
      return { E: E2, named };
    };
    const tagRack = tag("label_rack_loop", "Rack loop", 400, 118, TOP - PW / 2 - 2);
    const tagFac = tag("label_facility_loop", "Facility water loop", 1330, 118, TOP - PW / 2 - 2);
    const tagHX = tag("label_heat_exchanger", "Heat exchanger", 864, 58, 120);

    const rackT = track(0, (v) => rack.outlines.forEach((p) => p.setAttribute("stroke", mixc(rack.base, c("accent"), v))));
    const facT = track(0, (v) => fac.outlines.forEach((p) => p.setAttribute("stroke", mixc(fac.base, c("accent"), v))));

    // ================================================================ the timeline (every time from a spoken word)
    // "Here is the part to watch": the exchanger settles in the centre, with the two ends beside it
    m.settle(HX, tWatch);
    m.reveal(rackEnd, tWatch + 0.2, { dy: 0 });
    m.reveal(bld, tWatch + 0.2, { dy: 0 });
    // "Two loops": both pipes draw out from the exchanger at once, left and right
    m.draw(rack.pipeG, tTwo, { dur: 0.9, together: true });
    m.draw(fac.pipeG, tTwo, { dur: 0.9, together: true });
    // "The rack loop": its outline takes the accent, its beads start, its label arrives (accent on its pill too)
    m.reveal(tagRack.E, tRack, { dy: 8 });
    rackT.to(1, tRack, 0.4);
    tagRack.named.to(1, tRack, 0.4);
    beadsRack.show(tRack);
    beadsRack.flow(tRack, tEnd, 95);
    // "The facility water loop": the accent moves to the right loop, the left returns to its slate
    m.reveal(tagFac.E, tFac, { dy: 8 });
    rackT.to(0, tFac, 0.5);
    tagRack.named.to(0, tFac, 0.5);
    facT.to(1, tFac, 0.4);
    tagFac.named.to(1, tFac, 0.4);
    beadsFac.show(tFac);
    beadsFac.flow(tFac, tEnd, 95);
    // "A heat exchanger passes heat across": the accent moves to the plates, the chevrons cross, the camera eases in
    m.reveal(tagHX.E, tHX, { dy: 8 });
    facT.to(0, tHX, 0.5);
    tagFac.named.to(0, tHX, 0.5);
    platesT.to(1, tHX, 0.4);
    tagHX.named.to(1, tHX, 0.4);
    m.reveal(pulsesE, pulseStart, { dy: 0 });
    Loom.cam.frame(E, { x: 192, y: 68, w: 1536, h: 864 }, tHX, 1.4, { margin: 0 });
    // "The liquids never mix": the strip between the loops brightens, the accent leaves, the frame runs calmly
    stripT.to(1, tNever, 0.4);
    platesT.to(0, tNever, 0.5);
    tagHX.named.to(0, tNever, 0.5);
  },
});
