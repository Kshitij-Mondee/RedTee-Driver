// @design stamped_signal_leaves: transmitter is highlighted while others dim and a stamped wave pulse begins its journey toward the receiver
Loom.scene("b09", {
  build(ctx, props) {
    // 1. Satellite focus overlays: highlight A at (430, 230), dim B (1490, 200) and C (980, 110)
    // @form satellite_emphasis: focus highlight on transmitter A while dimming other transmitters
    const satOverlay = ctx.el("sat_overlay", { x: 0, y: 0, w: 1920, h: 1080, exit: "none" });

    // Satellite A glow and edge ring centred at (430, 230)
    const glowA = Loom.svg("rect", {
      x: 340, y: 175, width: 180, height: 110, rx: 20,
      fill: "none", stroke: ctx.c("accent"), "stroke-width": 8, opacity: 0
    }, satOverlay.inner);

    const ringA = Loom.svg("rect", {
      x: 345, y: 180, width: 170, height: 100, rx: 16,
      fill: "none", stroke: ctx.c("accent"), "stroke-width": 3.5, opacity: 0
    }, satOverlay.inner);

    // Dimming overlays for B (1490, 200) and C (980, 110)
    const dimB = Loom.svg("rect", {
      x: 1390, y: 140, width: 200, height: 120, rx: 16,
      fill: ctx.c("field"), opacity: 0
    }, satOverlay.inner);

    const dimC = Loom.svg("rect", {
      x: 880, y: 50, width: 200, height: 120, rx: 16,
      fill: ctx.c("field"), opacity: 0
    }, satOverlay.inner);

    // 2. Pulse element - radio signal pulse leaving satellite A towards the phone
    // @form signal_pulse: propagating radio wavefront from transmitter A
    const pulse = ctx.el("pulse", { x: 0, y: 0, w: 1920, h: 1080 });
    pulse.inner.setAttribute("opacity", "0");
    const sig = Loom.lesson.signal(ctx, pulse.inner, { from: [430, 274], to: [607, 453] });

    // 3. Stamp element - time stamp chip riding the pulse (a tiny clock, no words)
    // @form timestamp_chip: hardware clock stamp attached to propagating wavefront
    const stamp = ctx.el("stamp", { x: 0, y: 0, w: 1920, h: 1080 });
    const chipG = Loom.svg("g", { transform: "translate(430 274)", opacity: 0 }, stamp.inner);

    // Chip shadow and body
    Loom.svg("rect", {
      x: -24, y: -11, width: 48, height: 26, rx: 13,
      fill: ctx.c("shadow"), opacity: 0.4
    }, chipG);

    Loom.svg("rect", {
      x: -24, y: -13, width: 48, height: 26, rx: 13,
      fill: ctx.c("surface"), stroke: ctx.c("accent2"), "stroke-width": 2
    }, chipG);

    // Clock face
    Loom.svg("circle", {
      cx: 0, cy: 0, r: 8,
      fill: ctx.c("field"), stroke: ctx.c("ink"), "stroke-width": 1.5
    }, chipG);

    // Clock hands
    Loom.svg("line", {
      x1: 0, y1: 0, x2: -2.5, y2: -3,
      stroke: ctx.c("ink"), "stroke-width": 1.5, "stroke-linecap": "round"
    }, chipG);

    Loom.svg("line", {
      x1: 0, y1: 0, x2: 3, y2: -3.5,
      stroke: ctx.c("accent2"), "stroke-width": 1.5, "stroke-linecap": "round"
    }, chipG);

    Loom.svg("circle", {
      cx: 0, cy: 0, r: 1.5,
      fill: ctx.c("accent2")
    }, chipG);

    // --- Choreography ---
    // Cue 1: "A signal leaves"
    const tSignal = ctx.cue("A signal leaves");

    // Sat A highlight appears; B and C dim; pulse pops in
    Loom.drive(function (e) {
      ringA.setAttribute("opacity", (e * 0.95).toFixed(2));
      glowA.setAttribute("opacity", (e * 0.35).toFixed(2));
      dimB.setAttribute("opacity", (e * 0.45).toFixed(2));
      dimC.setAttribute("opacity", (e * 0.45).toFixed(2));
      pulse.inner.setAttribute("opacity", Math.min(1, e * 3).toFixed(2));
    }, tSignal, 0.35, "move");

    // Cue 2: "stamped with its sending time"
    const tStamp = ctx.cue("stamped with its sending time");

    // Stamp chip clips onto the pulse
    Loom.drive(function (e) {
      const s = e < 0.7 ? (e / 0.7) * 1.15 : 1.15 - ((e - 0.7) / 0.3) * 0.15;
      chipG.setAttribute("opacity", Math.min(1, e * 3).toFixed(2));
      chipG.setAttribute("transform", "translate(430 274) scale(" + s.toFixed(2) + ")");
    }, tStamp, 0.35, "overshoot");

    // Cue 3: "and heads for your phone"
    const tHeads = ctx.cue("and heads for your phone");
    const travelDur = 1.1;

    // Signal travels 1/3 of the way from A to phone point
    sig.travel(tHeads, travelDur);

    // Stamp chip rides the pulse to the 1/3 point
    Loom.drive(function (e) {
      const x = 430 + (607 - 430) * e;
      const y = 274 + (453 - 274) * e;
      chipG.setAttribute("transform", "translate(" + x.toFixed(1) + " " + y.toFixed(1) + ") scale(1)");
    }, tHeads, travelDur, "move");
  }
});
