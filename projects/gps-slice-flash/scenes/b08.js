// @design passive_reception: incoming pulses arrive at a passive terminal while an outgoing transmission attempt stalls and is struck through
Loom.scene("b08", {
  build(ctx, props) {
    // 1. Ground - Earth's curved arc across the bottom
    // @form earth_surface: curved ground arc representing planetary boundary
    const ground = ctx.el("ground", { x: 0, y: 0, w: 1920, h: 1080 });
    Loom.lesson.earth(ctx, ground.inner, { form: "arc", point: false });

    // 2. Phone Point - teal listening dot on the Earth's crest
    // @form phone_terminal: passive receiver dot on the ground crest
    const phonePt = ctx.el("phone_pt", { x: 910, y: 762, w: 100, h: 100 });
    const halo = Loom.svg("circle", { cx: 50, cy: 50, r: 34, fill: ctx.c("accent4"), opacity: 0.25 }, phonePt.inner);
    const ring = Loom.svg("circle", { cx: 50, cy: 50, r: 20, fill: "none", stroke: ctx.c("accent4"), "stroke-width": 4, opacity: 0 }, phonePt.inner);
    const core = Loom.svg("circle", { cx: 50, cy: 50, r: 13, fill: ctx.c("accent4"), stroke: ctx.c("ink"), "stroke-width": 3 }, phonePt.inner);

    // 3. Satellites - A (430, 230), B (1490, 200), C (980, 110) idle in orbit
    // @form satellite_array: constellation transmitters in orbit positions
    const sats = ctx.el("sats", { x: 0, y: 0, w: 1920, h: 1080 });

    const satA_g = Loom.svg("g", { transform: "translate(430 230) scale(0.55) translate(-180 -110)" }, sats.inner);
    const satA = Loom.lesson.gps_satellite(ctx, satA_g, { state: "idle" });

    const satB_g = Loom.svg("g", { transform: "translate(1490 200) scale(0.55) translate(-180 -110)" }, sats.inner);
    const satB = Loom.lesson.gps_satellite(ctx, satB_g, { state: "idle" });

    const satC_g = Loom.svg("g", { transform: "translate(980 110) scale(0.55) translate(-180 -110)" }, sats.inner);
    const satC = Loom.lesson.gps_satellite(ctx, satC_g, { state: "idle" });

    // 4. Incoming signal pulses from satellites arriving at phone point
    // @form incoming_broadcasts: inbound radio pulses converging on receiver
    const incoming = ctx.el("incoming", { x: 0, y: 0, w: 1920, h: 1080, exit: "fade" });
    const sigA = Loom.lesson.signal(ctx, incoming.inner, { from: [430, 274], to: [960, 812] });
    const sigB = Loom.lesson.signal(ctx, incoming.inner, { from: [1490, 244], to: [960, 812] });
    const sigC = Loom.lesson.signal(ctx, incoming.inner, { from: [980, 154], to: [960, 812] });

    // 5. Upward transmission attempt that stalls and is struck through
    // @form blocked_transmission: upward transmission arrow stalled and struck through
    const upArrow = ctx.el("up_arrow", { x: 920, y: 640, w: 80, h: 180, exit: "fade" });
    upArrow.inner.setAttribute("opacity", "0");

    // Shaft from (40, 172) to (40, 40)
    const shaft = Loom.svg("line", {
      x1: 40, y1: 172, x2: 40, y2: 172,
      stroke: ctx.c("accent"), "stroke-width": 4, "stroke-linecap": "round"
    }, upArrow.inner);

    const head = Loom.svg("polygon", {
      points: "40,24 32,44 48,44",
      fill: ctx.c("accent")
    }, upArrow.inner);
    head.setAttribute("opacity", "0");

    // Cross / strike mark in neg
    const strike = Loom.svg("g", {}, upArrow.inner);
    strike.setAttribute("opacity", "0");
    Loom.svg("line", { x1: 24, y1: 76, x2: 56, y2: 108, stroke: ctx.c("neg"), "stroke-width": 5, "stroke-linecap": "round" }, strike);
    Loom.svg("line", { x1: 56, y1: 76, x2: 24, y2: 108, stroke: ctx.c("neg"), "stroke-width": 5, "stroke-linecap": "round" }, strike);

    // --- Choreography ---
    const tListen = ctx.cue("Your phone only listens");
    const travelDur = 1.0;
    const tArrive = tListen + travelDur;

    sigA.travel(tListen, travelDur);
    sigB.travel(tListen, travelDur);
    sigC.travel(tListen, travelDur);

    // Phone point pulse reaction on arrival
    Loom.drive(function (e) {
      ring.setAttribute("r", (18 + 50 * e).toFixed(2));
      ring.setAttribute("opacity", ((1 - e) * 0.9).toFixed(2));
    }, tArrive, 0.7, "linear");

    // Incoming pulses absorb at arrival and exit cleanly before phrase 2
    sigA.absorb(tArrive);
    sigB.absorb(tArrive);
    sigC.absorb(tArrive);
    ctx.m.exit(incoming, tArrive + 0.2, "recede");

    // Cue 2: "Nothing goes up"
    const tNothing = ctx.cue("Nothing goes up");
    const drawDur = 0.55;

    // Arrow appears and draws upward
    Loom.tl.set(upArrow.inner, { opacity: 1 }, tNothing);
    Loom.drive(function (e) {
      const y2 = 172 - (172 - 40) * e;
      shaft.setAttribute("y2", y2.toFixed(2));
      if (e > 0.8) {
        head.setAttribute("opacity", ((e - 0.8) / 0.2).toFixed(2));
      }
    }, tNothing, drawDur, "move");

    // Strike through appears on stall
    const tStrike = tNothing + drawDur + 0.2;
    Loom.drive(function (e) {
      strike.setAttribute("opacity", Math.min(1, e * 3).toFixed(2));
    }, tStrike, 0.2, "linear");

    // Struck arrow exits before phrase 3
    const tFade = tNothing + 1.4;
    ctx.m.exit(upArrow, tFade, "recede");

    // Cue 3: "never learn where you are"
    const tQuiet = ctx.cue("never learn where you are");
    // Satellites remain idle, phone point holds steady
  }
});
