// @design live_flow_halts: a steady running measure stops the instant a trigger is pressed, a person reacts, and a stamped note names the consequence
/* b01 - the hook: an invented incident as ONE event. A change goes out, a running flow of orders stops.
 * Treatments considered:
 *  (A) static "Orders stopped" card with the engineer beside it (rejected: a still flat line cannot show
 *      that the orders were running a second ago, and the running-then-stopped IS the incident);
 *  (B) a split screen, dashboard turning red (rejected: colour change without motion, and no person);
 *  (C) CHOSEN: late night at the desk, the engineer presses deploy on a "Routine change", and in the
 *      store panel a steadily ticking orders line drops and runs flat while she reacts. The flow ->
 *      flat change over time carries the meaning; the stamped note is the consequence, struck the
 *      instant the line is flat (same duration constant), and it is the motif b02 adopts.
 * Deliberately not doing: numbers, axis values, times (the incident is invented and the sheet has none),
 * a second emphasis (the stamp is the one).
 * Deviation from the storyboard sheet: the desk scaffold assembles at the beat start (it is furniture,
 * nobody names it) so the first second is not an empty board; the engineer settles ON her name.
 */
Loom.scene("b01", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const beatId = ctx.beat.id;
    const enter = S.dur("enter");

    // opaque underlay (sketch shapes are hachure lines only, so anything that must hide what is behind it
    // needs a solid fill under its outline); tokens only.
    const solid = (parent, x, y, w, h, token, r) =>
      Loom.svg("rect", { x, y, width: w, height: h, rx: r == null ? 12 : r, fill: S.c(token) }, parent);

    // ------------------------------------------------------------------ timing (all from the narration)
    const tEngineer = ctx.cue("on-call engineer");
    const tTag = ctx.cue("routine change");
    const tStore = ctx.cue("made-up online store");
    const tStop = ctx.cue("stops taking orders");
    const FLAT = 0.7;                                   // the flatline's own duration; the stamp reuses it
    const pressDown = S.dur("exit") * 0.3, pressUp = S.dur("exit") * 0.7;   // the button press, from the style
    const tPress = tTag + enter * 0.85;                 // the tag has landed, the button is pressed
    const tRun = tStore + 0.5;                          // the panel is assembling; the line starts at its left
    const tFlat = tStop + FLAT;                         // the instant the line is flat

    // ------------------------------------------------------------------ scaffold: window, engineer, desk, laptop
    // (creation order = stacking order: window behind, engineer, desk slab over her lap, laptop on the desk)
    const win = ctx.el("window", { x: 150, y: 266, w: 340, h: 200, kind: "scenery", exit: "recede" });
    solid(win.inner, 0, 0, 340, 200, "surface", 6);
    kit.rect(win.inner, 0, 0, 340, 200, { fill: "ink", r: 6 });
    kit.line(win.inner, 120, 4, 120, 196, { stroke: "surface", sw: 6 });
    Loom.svg("circle", { cx: 240, cy: 100, r: 50, fill: S.c("field") }, win.inner);
    kit.icon(win.inner, "moon", { x: 240, y: 100, size: 76, color: "ink" });
    [[52, 44], [72, 150], [178, 34], [300, 168], [296, 40]].forEach(([sx, sy]) =>
      Loom.svg("circle", { cx: sx, cy: sy, r: 4.5, fill: S.c("field") }, win.inner));

    // @form expression_swap_character: a character whose expression swaps at the instant the outcome lands
    const eng = ctx.el("engineer", { x: 150, y: 412, w: 340, h: 340, kind: "character", exit: "recede" });
    const pNeutral = kit.peep(eng.inner, "woman", "neutral", { x: 170, y: 170, size: 340, cloth: "accent2" });
    const pSurprised = kit.peep(eng.inner, "woman", "surprised", { x: 170, y: 170, size: 340, cloth: "accent2" });
    pSurprised.setAttribute("opacity", "0");

    const desk = ctx.el("desk", { x: 120, y: 722, w: 780, h: 178, kind: "scenery", exit: "recede" });
    solid(desk.inner, 0, 0, 780, 48, "surface2", 8);
    kit.rect(desk.inner, 0, 0, 780, 48, { fill: "surface2", r: 8 });
    kit.line(desk.inner, 70, 50, 70, 176, { sw: 5 });
    kit.line(desk.inner, 710, 50, 710, 176, { sw: 5 });

    const lap = ctx.el("laptop", { x: 520, y: 424, w: 380, h: 300, kind: "instrument", exit: "recede" });
    solid(lap.inner, 30, 0, 320, 262, "surface2", 16);
    kit.rect(lap.inner, 30, 0, 320, 262, { fill: "none", r: 16 });
    solid(lap.inner, 48, 18, 284, 226, "surface", 8);
    kit.rect(lap.inner, 48, 18, 284, 226, { fill: "none", r: 8, sw: 2.4 });
    kit.line(lap.inner, 70, 128, 270, 128, { stroke: "muted", sw: 3 });
    kit.line(lap.inner, 70, 148, 200, 148, { stroke: "muted", sw: 3 });
    solid(lap.inner, 0, 262, 380, 28, "surface2", 12);
    kit.rect(lap.inner, 0, 262, 380, 28, { fill: "none", r: 12 });

    // @form press_button: a round icon button that presses down and springs back
    const btn = ctx.el("deploy_button", { x: 670, y: 580, w: 80, h: 80, kind: "icon", exit: "recede" });
    Loom.svg("circle", { cx: 40, cy: 40, r: 38, fill: S.c("surface") }, btn.inner);
    kit.disc(btn.inner, 40, 40, 38, { fill: "accent" });
    kit.icon(btn.inner, "rocket", { x: 40, y: 40, size: 46, color: "ink" });

    const tag = ctx.el("change_tag", { x: 580, y: 452, w: 250, h: 74, kind: "card", exit: "recede" });
    solid(tag.inner, 0, 0, 250, 74, "surface", 8);
    kit.rect(tag.inner, 0, 0, 250, 74, { fill: "accent", r: 8 });
    kit.text(tag.inner, "Routine change", { role: "label", x: 0, y: 0, w: 250, h: 74, maxLines: 1, align: "center", valign: "middle" });

    // scaffold first (nobody names it), then the engineer on her name
    const t0 = ctx.start + 0.2;
    m.assemble(desk, t0);
    m.reveal(win, t0 + 0.15);
    m.settle(lap, t0 + 0.3);
    m.pop(btn, t0 + 0.7, { overshoot: false });
    m.settle(eng, tEngineer, { dy: 24 });

    // ------------------------------------------------------------------ the change goes out
    m.drop(tag, tTag);
    // the rocket button presses: 1 -> 0.92 -> 1
    Loom.tween(btn.inner, { scale: 1, transformOrigin: "50% 50%" }, { scale: 0.92, transformOrigin: "50% 50%", duration: pressDown, ease: Loom.ease.exit }, tPress, { kind: "press", beat: beatId, name: btn.name, content: true });
    Loom.tween(btn.inner, { scale: 0.92, transformOrigin: "50% 50%" }, { scale: 1, transformOrigin: "50% 50%", duration: pressUp, ease: Loom.ease.overshoot }, tPress + pressDown, { kind: "press", beat: beatId, name: btn.name, content: true });

    // ------------------------------------------------------------------ the store panel (scaffold before content)
    const PX = 1040, PY = 240, PW = 760, PH = 520;
    // @form metric_panel: a card with an icon and title header and plot axes framing a live value
    const panel = ctx.el("store_panel", { x: PX, y: PY, w: PW, h: PH, kind: "card", exit: "displace" });
    solid(panel.inner, 0, 0, PW, PH, "surface", 20);
    kit.rect(panel.inner, 0, 0, PW, PH, { fill: "none", r: 20 });
    kit.icon(panel.inner, "store", { x: 72, y: 62, size: 60, color: "accent2" });
    kit.text(panel.inner, "Online store", { role: "lead", x: 124, y: 22, w: 420, h: 80, maxLines: 1, valign: "middle" });
    kit.line(panel.inner, 36, 116, PW - 36, 116, { sw: 2.6 });
    kit.line(panel.inner, 56, 160, 56, 450, { sw: 2.6 });             // plot axis, no values
    kit.line(panel.inner, 56, 450, PW - 50, 450, { sw: 3.6 });        // the baseline
    m.assemble(panel, tStore);

    const lab = ctx.el("orders_label", { x: PX + 76, y: PY + 176, w: 220, h: 44, kind: "text", exit: "wipe" });
    kit.text(lab.inner, "Orders", { role: "label", x: 0, y: 0, w: 220, h: 44, maxLines: 1, color: "muted" });
    m.reveal(lab, tRun - 0.1, { dy: 8 });

    // ------------------------------------------------------------------ the orders line: ticking, then flat
    // @form flatline_trace: a steady ticking value line that drops and runs flat, with a pen dot
    const line = ctx.el("orders_line", { x: PX, y: PY, w: PW, h: PH, kind: "value", exit: "recede" });
    const LEVEL = 280, BASE = 450, X0 = 76, PERIOD = 36, TICKS = 12;
    const rng = Loom.rng("b01-orders");
    let dA = `M${X0} ${LEVEL}`;
    for (let i = 0; i < TICKS; i++) {
      const x = X0 + i * PERIOD, a = 22 + Math.round(rng() * 12);
      dA += ` L${x + 14} ${LEVEL} L${x + 20} ${LEVEL - a} L${x + 27} ${LEVEL + 6} L${x + PERIOD} ${LEVEL}`;
    }
    const xEnd = X0 + TICKS * PERIOD;
    const dB = `M${xEnd} ${LEVEL} C${xEnd + 8} ${LEVEL + 60} ${xEnd + 14} ${BASE - 50} ${xEnd + 22} ${BASE} L${PW - 60} ${BASE}`;
    const pathA = kit.path(line.inner, dA, { stroke: "pos", sw: 6 });
    const pathB = kit.path(line.inner, dB, { stroke: "neg", sw: 6 });
    const dot = Loom.svg("circle", { cx: X0, cy: LEVEL, r: 11, fill: S.c("pos"), opacity: 0 }, line.inner);
    const LA = pathA.getTotalLength(), LB = pathB.getTotalLength();
    pathA.setAttribute("stroke-dasharray", `${LA} ${LA}`); pathA.setAttribute("stroke-dashoffset", LA);
    pathB.setAttribute("stroke-dasharray", `${LB} ${LB}`); pathB.setAttribute("stroke-dashoffset", LB);
    m.reveal(line, tRun, { dy: 0, dur: S.dur("exit") * 0.4 });
    const meta = { kind: "value_travel", beat: beatId, content: true, name: line.name };
    // running flow: steady, linear (a flow does not ease), pen dot at the tip
    Loom.drive((e) => {
      pathA.setAttribute("stroke-dashoffset", (LA * (1 - e)).toFixed(2));
      const pt = pathA.getPointAtLength(LA * e);
      dot.setAttribute("cx", pt.x.toFixed(2)); dot.setAttribute("cy", pt.y.toFixed(2));
      dot.setAttribute("opacity", e > 0 ? 1 : 0);
      dot.setAttribute("fill", S.c("pos"));
    }, tRun, Math.max(0.6, tStop - tRun), "linear", meta);
    // the fall and the flat run: ease-out, so it lands and stays
    Loom.drive((e) => {
      pathB.setAttribute("stroke-dashoffset", (LB * (1 - e)).toFixed(2));
      const pt = pathB.getPointAtLength(LB * e);
      dot.setAttribute("cx", pt.x.toFixed(2)); dot.setAttribute("cy", pt.y.toFixed(2));
      dot.setAttribute("fill", S.c(e > 0 ? "neg" : "pos"));
    }, tStop, FLAT, "enter", meta);

    // the engineer reacts as the line lands
    Loom.tl.set(pNeutral, { opacity: 1 }, 0);
    Loom.tl.set(pSurprised, { opacity: 0 }, 0);
    Loom.tl.set(pNeutral, { opacity: 0 }, tFlat);
    Loom.tl.set(pSurprised, { opacity: 1 }, tFlat);

    // ------------------------------------------------------------------ the note: the ONE emphasis, and the motif b02 adopts
    // @form tilted_note: a tilted outlined note pinned to a surface, naming one fact
    const note = ctx.motif("incident_note", { x: 1180, y: 790, w: 480, h: 100 });
    const ng = Loom.svg("g", { transform: "rotate(-2.5 240 50)" }, note.inner);
    solid(ng, 0, 0, 480, 100, "surface", 14);
    kit.rect(ng, 0, 0, 480, 100, { fill: "none", stroke: "neg", sw: 5, r: 14 });
    kit.icon(ng, "shopping-cart", { x: 62, y: 50, size: 60, color: "neg" });
    kit.text(ng, "Orders stopped", { role: "lead", x: 112, y: 0, w: 350, h: 100, maxLines: 1, valign: "middle", weight: 800 });
    m.stamp(note, tFlat);
  },
});
