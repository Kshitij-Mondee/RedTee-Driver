// @design listening_not_sending: the sky transmits inward; a rejected arrow turns back
// Three treatments: static signalling with converging routes; animated pulses arriving; a speech-led map reveal. Choose the pulse arrival, then the incomplete arrow refutation.
Loom.scene("b08", {
  build(ctx) {
    const { m } = ctx;
    const ground = ctx.el("ground", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
    ctx.kit.rect(ground.inner, 0, 0, 1920, 1080, { fill: "field" });
    Loom.lesson.earth(ctx, ground.inner, { form: "arc", showPoint: true });

    const phone = ctx.el("phone_pt", { x: 816, y: 640, w: 288, h: 288, kind: "node", exit: "none" });
    ctx.kit.disc(phone.inner, 144, 144, 132, { fill: "accent4", opacity: 0.3 });
    ctx.kit.disc(phone.inner, 144, 144, 82, { fill: "accent4", opacity: 0.65 });
    ctx.kit.disc(phone.inner, 144, 144, 48, { fill: "accent4" });
    Loom.svg("circle", { cx: 144, cy: 144, r: 62, fill: "none", stroke: ctx.c("accent4"), "stroke-width": 12 }, phone.inner);
    const receiverRing = Loom.svg("circle", { cx: 144, cy: 144, r: 112, fill: "none", stroke: ctx.c("accent4"), "stroke-width": 8, opacity: 0 }, phone.inner);
    m.reveal(phone, ctx.start);

    const sats = ctx.el("sats", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "none" });
    const satSpecs = [
      { key: "A", x: 250, y: 120 },
      { key: "B", x: 1310, y: 90 },
      { key: "C", x: 800, y: 0 }
    ];
    const satHandles = {};
    satSpecs.forEach((p) => {
      const slot = Loom.svg("g", { transform: `translate(${p.x} ${p.y})` }, sats.inner);
      const sat = Loom.lesson.gps_satellite(ctx, slot, { state: "idle" });
      sat.setState("idle", ctx.start);
      satHandles[p.key] = sat;
    });
    sats.handle = satHandles;

    const listenT = ctx.cue("Your phone only listens");
    const incoming = ctx.el("incoming", { x: 0, y: 0, w: 1920, h: 1080, kind: "value", exit: "recede" });
    m.pop(incoming, listenT, { overshoot: false });
    const pulseSpecs = [
      { x: 430, y: 300, cx: 500, cy: 520, delay: 0.08 },
      { x: 1490, y: 270, cx: 1400, cy: 560, delay: 0.38 },
      { x: 980, y: 210, cx: 880, cy: 500, delay: 0.68 }
    ];
    pulseSpecs.forEach((p) => {
      const d = `M${p.x} ${p.y} Q${p.cx} ${p.cy} 960 790`;
      Loom.svg("path", { d, fill: "none", stroke: ctx.c("accent2"), "stroke-width": 5, "stroke-linecap": "round", opacity: 0.5 }, incoming.inner);
      const pg = Loom.svg("g", { transform: `translate(${p.x} ${p.y}) scale(1.7)` }, incoming.inner);
      const pulse = Loom.lesson.signal(ctx, pg, { form: "pulse" });
      const depart = listenT + p.delay;
      pulse.setState("pulse", depart);
      Loom.drive((e) => {
        const u = 1 - e;
        const x = u * u * p.x + 2 * u * e * p.cx + e * e * 960;
        const y = u * u * p.y + 2 * u * e * p.cy + e * e * 790;
        pg.setAttribute("transform", `translate(${x} ${y}) scale(1.7)`);
      }, depart, 1.25, "move");
      Loom.drive((e) => pg.setAttribute("opacity", String(1 - e)), depart + 1.25, 0.18, "linear");
    });
    m.exit(incoming, listenT + 2.2, "recede");

    const up = ctx.el("up_arrow", { x: 900, y: 512, w: 120, h: 300, kind: "connector", exit: "recede" });
    const arrow = ctx.kit.arrow(up.inner, 60, 300, 60, 70, { stroke: "accent" });
    const strike = ctx.kit.line(up.inner, 18, 180, 102, 140, { stroke: "neg", sw: 10 });
    strike.setAttribute("opacity", "0");
    const nothingT = ctx.cue("Nothing goes up");
    m.draw(arrow, nothingT, { dur: 0.62, headAt: 0.55, headDur: 0.14 });
    Loom.tl.set(strike, { opacity: 1 }, nothingT + 0.76);
    m.exit(up, nothingT + 2.62, "recede");

    // Hold the quiet satellites and teal receiver through the final phrase.
    const quietT = ctx.cue("never learn where you are");
    Loom.drive((e) => {
      const pulse = Math.sin(e * Math.PI * 4);
      receiverRing.setAttribute("r", String(112 + 8 * pulse));
      receiverRing.setAttribute("opacity", String(0.6 + 0.35 * (pulse + 1) / 2));
    }, quietT, 2.8, "linear");
    Loom.tl.set(phone.outer, { opacity: 1 }, quietT);
  }
});
