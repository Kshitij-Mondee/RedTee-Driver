// @design same_shot_nothing_opens: the opening shot again with the same lit object, but every lock refuses it and the room stays dark; a small second lit window answers once and goes out
/* Treatments considered: (1) static b02 composition with status line only; (2) b02 shot replayed, card dims at the field,
 * small inset answers, slow pull back (chosen: same night, different outcome); (3) split screen (rejected: competes). */
Loom.scene("b14", {
  build(ctx) {
    const { kit, m } = ctx;
    const c = (t) => ctx.c(t);
    const svg = (tag, a, p) => Loom.svg(tag, a, p);
    const st = ctx.depth("night_stage", { dolly: [ctx.start, ctx.end], push: -0.05, drift: 20, focus: 0.55, dof: 5, atmosphere: 0.45, cx: 1060, cy: 620 });

    // ---- far: back wall and floor
    const wallL = st.layer(0.1);
    const OFF = ctx.el("night_office", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede", parent: wallL });
    svg("rect", { x: -200, y: -200, width: 2320, height: 1480, fill: st.tone("surface2", 0.1) }, OFF.inner);
    svg("rect", { x: -200, y: 760, width: 2320, height: 520, fill: st.tone("surface2", 0.3) }, OFF.inner);
    st.haze(0.4, 620, "accent3");

    // ---- far doors (z 0.2): dark and shut throughout
    const farL = st.layer(0.2);
    svg("rect", { x: 1200, y: 420, width: 920, height: 330, fill: st.tone("surface2", 0.2) }, farL);
    const FD = ctx.el("far_doors", { x: 1270, y: 480, w: 600, h: 300, kind: "scenery", exit: "recede", parent: farL });
    const ws = [124, 104, 88, 74, 62, 52];
    let dx = 0;
    // @form closed_doors_row: systems as shut doors receding into the dark
    ws.forEach((w, i) => {
      const hh = w * 620 / 400, base = 262 - (124 - w) * 0.55;
      Loom.lesson.door(ctx, FD.inner, { x: dx, y: base - hh, w, shade: 0.62 + i * 0.05, state: "shut" });
      dx += w + 22 - i * 2;
    });
    svg("rect", { x: -10, y: 262, width: 620, height: 3, fill: c("line"), opacity: 0.35 }, FD.inner);

    // ---- the monitor
    const mid = st.layer(0.55);
    const SX = 120, SY = 170;
    const LS = ctx.el("login_screen", { x: SX, y: SY, w: 1100, h: 704, kind: "instrument", exit: "recede", parent: mid });
    const scr = Loom.lesson.login_screen(ctx, LS.inner, { w: 1100, state: "empty" });
    const tTried = ctx.cue("The leaked password is tried");
    const tFits = ctx.cue("fits nothing");
    const tReq = ctx.cue("A request arrives");
    const tDen = ctx.cue("denied, and reported");
    const tShut = ctx.cue("Every door stays shut");
    scr.setState("typing", tTried + 0.3);
    scr.setState("denied", tShut);

    // key light bloom at the lamp
    const kl = st.layer(0.55, "screen"), kid = Loom.uid("b14k"), kd = svg("defs", {}, kl);
    const blur = (id, sd) => { const f = svg("filter", { id: kid + id, x: "-100%", y: "-100%", width: "300%", height: "300%" }, kd); svg("feGaussianBlur", { stdDeviation: sd }, f); return `url(#${kid}${id})`; };
    const bx = SX + 192 * 1.1, by = SY + 226 * 1.1, br = 8;
    const bloom = svg("g", { opacity: 0 }, kl);
    svg("circle", { cx: bx, cy: by, r: br * 2.8, fill: c("ink"), opacity: 0.12, filter: blur("g1", 7) }, bloom);
    svg("circle", { cx: bx, cy: by, r: br * 1.5, fill: c("ink"), opacity: 0.35, filter: blur("g2", 3) }, bloom);
    Loom.tween(bloom, { opacity: 0 }, { opacity: 1, duration: ctx.style.dur("enter") }, ctx.start, { kind: "reveal", beat: ctx.beat.id, name: "lamp_bloom", content: true });

    // status hairline (accent line) and clock hairline
    const st1 = scr.at.status, ck = scr.at.clock;
    const tClock = ctx.cue("Replay the night");
    const LST = ctx.el("login_status", { x: SX + st1.x, y: SY + st1.y + 20, w: 380, h: 8, kind: "icon", exit: "recede", parent: mid });
    svg("rect", { x: 0, y: 0, width: 380, height: 2, fill: c("pos"), opacity: 0.5 }, LST.inner);
    m.reveal(LST, tShut + 0.1);
    const CLK = ctx.el("clock", { x: SX + ck.x - 110, y: SY + ck.y + 22, w: 110, h: 8, kind: "icon", exit: "recede", parent: mid });
    svg("rect", { x: 0, y: 0, width: 110, height: 2, fill: c("ink"), opacity: 0.4 }, CLK.inner);
    m.reveal(CLK, tClock);

    // ---- the leaked card (z 0.6): appears at the password field, tried, dims
    const cardL = st.layer(0.6);
    const pw = scr.at.password, p0x = SX + pw.x, p0y = SY + pw.y;
    const KC = ctx.el("keycard", { x: p0x - 110, y: p0y - 70, w: 220, h: 140, kind: "token", exit: "recede", parent: cardL });
    const cg = svg("g", {}, KC.inner);
    const kcard = Loom.lesson.keycard(ctx, cg, { x: 0, y: 0, w: 220, state: "lit", seed: "dana" });
    cg.setAttribute("transform", "translate(110 70) rotate(-6) scale(0.6) translate(-110 -70)");
    kcard.setState("lit", ctx.start);
    kcard.setState("dim", tFits);
    m.reveal(KC, tTried);

    // ---- bedroom inset: small, top right, clear of the status line
    const insL = st.layer(0.7);
    const BI = ctx.el("bedroom_inset", { x: 1580, y: 70, w: 220, h: 340, kind: "panel", exit: "recede", parent: insL });
    svg("rect", { x: 0, y: 0, width: 220, height: 340, rx: 10, fill: c("field"), stroke: c("line"), "stroke-width": 2 }, BI.inner);
    const ph = Loom.lesson.bedside_phone(ctx, BI.inner, { x: 20, y: 14, w: 180, stand: false, state: "dark" });
    ph.setState("dark", ctx.start);
    ph.setState("prompt", tReq);
    ph.setState("pressed", tDen - 0.1);
    ph.setState("denied", tDen + 0.7);
    ph.setState("dark", tDen + 2.6);
    m.reveal(BI, tReq - 0.2);
    m.exit && m.exit(BI, tDen + 3.0);

    // ---- near: the back of a chair
    const near = st.layer(1.0);
    svg("rect", { x: 1500, y: 920, width: 520, height: 420, rx: 90, fill: c("shadow") }, near);
    kit.path(near, "M1520 950 Q1700 910 1890 960", { stroke: "accent3", sw: 4, opacity: 0.3 });
  },
});
