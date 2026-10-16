// @design b08_listening_sky: three overhead broadcasters send downward while an upward path fails
// Treatments: 1) static sky diagram with signal paths, 2) satellite close-up, 3) arrow refutation. Chosen: 3, because the stalled arrow is the argument.
Loom.scene("b08", {
  build(ctx) {
    const { kit, m } = ctx;
    const listen = ctx.cue("Your phone only listens.");
    const nothing = ctx.cue("Nothing goes up.");
    const quiet = ctx.cue("The satellites never learn where you are.");

    // @form ground: night cross-section and curved earth surface
    const ground = ctx.el("ground", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
    kit.rect(ground.inner, 0, 0, 1920, 1080, { fill: "field", r: 0 });
    [[150,150,3],[280,320,4],[610,180,3],[770,430,3],[1130,280,4],[1320,470,3],[1680,130,4],[1770,400,3]].forEach((s) => {
      // @form star: quiet night reference point
      kit.disc(ground.inner, s[0], s[1], s[2], { fill: "muted" });
    });
    const earth = Loom.lesson.earth(ctx, ground.inner, { form: "arc", point: false });
    earth.setState("arc", ctx.start, { dur: 0.01 });

    // @form phone_pt: teal listening point fixed at the earth crest
    const phone = ctx.el("phone_pt", { x: 912, y: 764, w: 96, h: 96, kind: "node", exit: "none" });
    kit.disc(phone.inner, 48, 48, 34, { fill: "accent4" });
    kit.disc(phone.inner, 48, 48, 13, { fill: "accent4" });
    m.pop(phone, listen, { dur: ctx.style.dur("enter") });

    // @form sats: three idle GPS satellites held in the sky diagram
    const sats = ctx.el("sats", { x: 0, y: 0, w: 1920, h: 450, kind: "instrument", exit: "none" });
    const aG = Loom.svg("g", { transform: "translate(250 120)" }, sats.inner);
    const bG = Loom.svg("g", { transform: "translate(1310 90)" }, sats.inner);
    const cG = Loom.svg("g", { transform: "translate(800 0)" }, sats.inner);
    const satA = Loom.lesson.gps_satellite(ctx, aG, {});
    const satB = Loom.lesson.gps_satellite(ctx, bG, {});
    const satC = Loom.lesson.gps_satellite(ctx, cG, {});
    satA.setState("idle", ctx.start, { dur: 0.01 });
    satB.setState("idle", ctx.start, { dur: 0.01 });
    satC.setState("idle", ctx.start, { dur: 0.01 });

    // @form incoming: three warm pulses travel only from satellite to phone
    const incoming = ctx.el("incoming", { x: 0, y: 0, w: 1920, h: 900, kind: "connector", exit: "iris" });
    const sigA = Loom.lesson.signal(ctx, incoming.inner, { from: { x: 430, y: 230 }, to: { x: 960, y: 812 } });
    const sigB = Loom.lesson.signal(ctx, incoming.inner, { from: { x: 1490, y: 200 }, to: { x: 960, y: 812 } });
    const sigC = Loom.lesson.signal(ctx, incoming.inner, { from: { x: 980, y: 110 }, to: { x: 960, y: 812 } });
    sigA.setState("pulse", listen, { dur: 1.15 });
    sigB.setState("pulse", listen + 0.16, { dur: 1.15 });
    sigC.setState("pulse", listen + 0.32, { dur: 1.15 });
    // @form pulse_fallback: visible travelling wavefront while the kit pulse is repaired
    [[430,230],[1490,200],[980,110]].forEach((from, i) => {
      const wave = Loom.svg("g", {}, incoming.inner);
      kit.disc(wave, 0, 0, 22, { fill: "accent2" });
      kit.disc(wave, 0, 0, 8, { fill: "ink" });
      const t0 = listen + i * 0.16;
      const travelDur = ctx.style.dur("draw") * 1.4;
      Loom.drive((p) => {
        const x = from[0] + (960 - from[0]) * p;
        const y = from[1] + (812 - from[1]) * p;
        wave.setAttribute("transform", "translate(" + x + " " + y + ")");
      }, t0, travelDur, "linear");
    });
    m.exit(incoming, nothing - 0.08, "iris");

    // @form up_arrow: upward route begins, stops, then is crossed out
    const up = ctx.el("up_arrow", { x: 890, y: 490, w: 140, h: 310, kind: "connector", exit: "iris" });
    const arrow = kit.arrow(up.inner, 70, 300, 70, 45, { stroke: "accent" });
    const strike = kit.line(up.inner, 24, 170, 116, 105, { stroke: "neg", sw: 12 });
    m.draw(arrow, nothing, { dur: 0.52, headAt: 0.9, headDur: 0.12 });
    m.draw(strike, nothing + 0.62, { dur: 0.24 });
    m.emphasis(up, nothing + 0.62);
    m.exit(up, nothing + 1.15, "iris");

    // Quiet hold preserves the teal point and idle satellites.
    quiet;
  },
});
