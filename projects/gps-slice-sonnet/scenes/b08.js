// @design listen_only_diagram: signals arrive at a point, an arrow toward the sky draws, stalls, is struck out; the sources stay quiet
// Treatments: (1) static diagram with three arrows in and one crossed out up; (2) pulses travel in, arrow stalls and is struck (chosen: the arrow that never completes is the refutation); (3) split before/after panels.
Loom.scene("b08", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = (tag, a, p) => Loom.svg(tag, a, p);
    // shared constants: b09 repeats these exactly
    const PHONE = { x: 960, y: 812 };
    const SATS = [
      { id: "A", x: 430, y: 230 },
      { id: "B", x: 1490, y: 200 },
      { id: "C", x: 980, y: 110 },
    ];
    const SAT_SCALE = 0.5; // 360x220 natural -> 180x110

    // ground: the earth arc across the bottom
    const ground = ctx.el("ground", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" });
    const earth = Loom.lesson.earth(ctx, ground.inner, { form: "arc", point: false });
    m.reveal(ground, ctx.start + 0.05);

    // phone_pt: the teal point on the crest (accent4 only here)
    const pt = ctx.el("phone_pt", { x: PHONE.x - 60, y: PHONE.y - 60, w: 120, h: 120, kind: "node" });
    const pg = S("g", { transform: "translate(60 60) scale(1.15)" }, pt.inner);
    const halo = S("circle", { cx: 0, cy: 0, r: 34, fill: ctx.c("accent4"), opacity: 0.25 }, pg);
    const ring = S("circle", { cx: 0, cy: 0, r: 20, fill: "none", stroke: ctx.c("accent4"), "stroke-width": 4, opacity: 0 }, pg);
    S("circle", { cx: 0, cy: 0, r: 13, fill: ctx.c("accent4"), stroke: ctx.c("ink"), "stroke-width": 3 }, pg);
    m.pop(pt, ctx.start + 0.3);

    // sats: three satellites, idle, small, at fixed places
    const sats = ctx.el("sats", { x: 0, y: 0, w: 1920, h: 400, kind: "scenery" });
    const sh = [];
    SATS.forEach((s) => {
      const gg = S("g", { transform: "translate(" + (s.x - 90) + " " + (s.y - 55) + ") scale(" + SAT_SCALE + ")" }, sats.inner);
      const h = Loom.lesson.gps_satellite(ctx, gg, {});
      h.setState("idle", 0);
      sh.push(h);
    });
    m.reveal(sats, ctx.start + 0.2);

    // incoming: three pulses, one per satellite, each absorbed at the point
    const incoming = ctx.el("incoming", { x: 0, y: 0, w: 1920, h: 1080, kind: "connector" });
    const t0 = ctx.cue("Your phone only listens");
    const sig = SATS.map((s) => Loom.lesson.signal(ctx, incoming.inner, { from: [s.x, s.y + 48], to: [PHONE.x, PHONE.y - 6] }));
    m.reveal(incoming, t0);
    const dur = 1.35;
    sig.forEach((g, i) => {
      const ts = t0 + 0.1 + i * 0.28;
      g.setState("pulse", ts);
      g.travel(ts + 0.05, dur, 1);
      g.setState("absorbed", ts + 0.05 + dur);
    });
    // the point takes each pulse in: a soft ring, no light leaves it
    sig.forEach((g, i) => {
      const ta = t0 + 0.1 + i * 0.28 + 0.05 + dur - 0.1;
      Loom.drive((e) => { ring.setAttribute("r", 18 + 40 * e); ring.setAttribute("opacity", e > 0 && e < 1 ? 0.8 * (1 - e) : 0); }, ta, 0.55, "move");
    });

    // up_arrow: draws up from the point, stalls, struck through in neg, fades (the accent element)
    const tUp = ctx.cue("Nothing goes up");
    const up = ctx.el("up_arrow", { x: PHONE.x - 90, y: 520, w: 180, h: 280, kind: "connector" });
    const bx = 90, by0 = 266, byTop = 40; // local: base near the point, full tip
    const shaft = S("line", { x1: bx, y1: by0, x2: bx, y2: by0, stroke: ctx.c("accent"), "stroke-width": 12, "stroke-linecap": "round" }, up.inner);
    const head = S("polygon", { points: "-26,0 26,0 0,-40", fill: ctx.c("accent"), transform: "translate(" + bx + " " + by0 + ")" }, up.inner);
    const reach = 0.8; // stalls here
    Loom.drive((e) => {
      const y = by0 - (by0 - byTop) * reach * e;
      shaft.setAttribute("y2", y + 8);
      head.setAttribute("transform", "translate(" + bx + " " + y + ")");
    }, tUp, 0.8, "move");
    m.reveal(up, tUp);
    // the strike, neg only here
    const tStrike = tUp + 1.25;
    const sy = by0 - (by0 - byTop) * reach * 0.55;
    const strike = S("path", { d: "M" + (bx - 62) + " " + (sy + 40) + " L" + (bx + 62) + " " + (sy - 40), fill: "none", stroke: ctx.c("neg"), "stroke-width": 12, "stroke-linecap": "round" }, up.inner);
    m.draw(strike, tStrike, { dur: 0.3 });
    const tFade = tStrike + 0.7;
    up.exit = "recede";
    m.exit(up, tFade, "recede");
    m.exit(incoming, tUp + 0.2, "recede");

    // the satellites never learn where you are: they hold quiet, the point holds teal (slow breath only)
    const tQuiet = ctx.cue("never learn where you are");
    Loom.drive((e) => { halo.setAttribute("r", 34 * (0.9 + 0.2 * Math.sin(e * Math.PI * 2 * 2))); }, tQuiet, ctx.speechEnd - tQuiet, "linear");
    sh.forEach((h) => h.setState("idle", tQuiet));
  },
});
