// @design lit_object_follows_dark: a dark room lit by one lamp on a screen that already says yes; the thing typed into it lifts out as a lit object and drifts toward a far row of closed doors while the camera slowly pushes the same way
/* Treatments considered: (1) static composition, monitor lit + doors far, card signalled by glow only; (2) the card
 * lifts and floats right on its own element while the camera pushes (chosen: the object becomes followable);
 * (3) a title card over the room (rejected: text belongs outside the stage and the screen already says it). */
Loom.scene("b02", {
  build(ctx) {
    const { kit, m } = ctx;
    const c = (t) => ctx.c(t);
    const svg = (tag, a, p) => Loom.svg(tag, a, p);
    const st = ctx.depth("night_stage", { dolly: [ctx.start, ctx.end], push: 0.06, drift: -26, focus: 0.55, dof: 5, atmosphere: 0.45, cx: 1060, cy: 620 });

    // ---- far (z 0.1): back wall and floor, one flat value each
    const wallL = st.layer(0.1);
    const OFF = ctx.el("night_office", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede", parent: wallL });
    svg("rect", { x: -200, y: -200, width: 2320, height: 1480, fill: st.tone("surface2", 0.1) }, OFF.inner);
    svg("rect", { x: -200, y: 760, width: 2320, height: 520, fill: st.tone("surface2", 0.3) }, OFF.inner);
    st.haze(0.4, 620, "accent3");

    // ---- the far wall of doors (z 0.2): appears on "two habits"
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
    svg("rect", { x: -10, y: 262 - 0, width: 620, height: 3, fill: c("line"), opacity: 0.35 }, FD.inner);
    m.reveal(FD, ctx.cue("two habits"));

    // ---- the focus plane (z 0.55): the monitor on its desk with its lamp (the part draws lamp, cone and pool)
    const mid = st.layer(0.55);
    const SX = 120, SY = 170;
    const LS = ctx.el("login_screen", { x: SX, y: SY, w: 1100, h: 704, kind: "instrument", exit: "recede", parent: mid });
    const scr = Loom.lesson.login_screen(ctx, LS.inner, { w: 1100, state: "empty" });
    const tOk = ctx.cue("Nobody broke in") + 0.95;
    scr.setState("typing", ctx.start + 0.1);
    scr.setState("success", tOk);

    // the key light rides the lamp's own layer (R2b): the bulb's bloom at the part's bulb, in a screen layer at z 0.55
    const kl = st.layer(0.55, "screen"), kid = Loom.uid("b02k"), kd = svg("defs", {}, kl);
    const blur = (id, sd) => { const f = svg("filter", { id: kid + id, x: "-100%", y: "-100%", width: "300%", height: "300%" }, kd); svg("feGaussianBlur", { stdDeviation: sd }, f); return `url(#${kid}${id})`; };
    const bx = SX + 192 * 1.1, by = SY + 226 * 1.1, br = 8;
    const bloom = svg("g", { opacity: 0 }, kl);
    svg("circle", { cx: bx, cy: by, r: br * 2.8, fill: c("ink"), opacity: 0.12, filter: blur("g1", 7) }, bloom);
    svg("circle", { cx: bx, cy: by, r: br * 1.5, fill: c("ink"), opacity: 0.35, filter: blur("g2", 3) }, bloom);
    Loom.tween(bloom, { opacity: 0 }, { opacity: 1, duration: ctx.style.dur("enter") }, ctx.start, { kind: "reveal", beat: ctx.beat.id, name: "lamp_bloom", content: true });

    // the status line and the clock: a hairline lit under each when the sign-in succeeds
    const st1 = scr.at.status, ck = scr.at.clock;
    const LST = ctx.el("login_status", { x: SX + st1.x, y: SY + st1.y + 20, w: 380, h: 8, kind: "icon", exit: "recede", parent: mid });
    svg("rect", { x: 0, y: 0, width: 380, height: 2, fill: c("ink"), opacity: 0.4 }, LST.inner);
    m.reveal(LST, tOk + 0.1);
    const CLK = ctx.el("clock", { x: SX + ck.x - 110, y: SY + ck.y + 22, w: 110, h: 8, kind: "icon", exit: "recede", parent: mid });
    svg("rect", { x: 0, y: 0, width: 110, height: 2, fill: c("ink"), opacity: 0.4 }, CLK.inner);
    m.reveal(CLK, tOk + 0.1);

    // ---- the card (z 0.6): lifts from the password field, floats right, turns toward the doors
    const cardL = st.layer(0.6);
    const pw = scr.at.password, p0x = SX + pw.x, p0y = SY + pw.y;
    const KC = ctx.el("keycard", { x: p0x - 110, y: p0y - 70, w: 220, h: 140, kind: "token", exit: "recede", parent: cardL });
    const cg = svg("g", {}, KC.inner);
    Loom.lesson.keycard(ctx, cg, { x: 0, y: 0, w: 220, state: "lit", seed: "dana" });
    const setCard = (s, r) => cg.setAttribute("transform", `translate(110 70) rotate(${r}) scale(${s}) translate(-110 -70)`);
    setCard(0.47, 0);
    const tLift = ctx.cue("Follow that one password"), tDoors = ctx.cue("two habits");
    m.reveal(KC, tLift);
    Loom.drive((e) => setCard(0.47 + 0.53 * e, 0), tLift, 1.5, "editorial");
    m.travel(KC, tLift, { x: 1340 - p0x, y: 330 - p0y, scale: 1, dur: 1.8 });
    Loom.drive((e) => setCard(1 - 0.2 * e, -12 * e), tDoors, 2.2, "editorial");   // the card turns toward the doors
    m.travel(KC, tDoors, { x: 1500 - p0x, y: 385 - p0y, scale: 1, dur: 2.2 });

    // ---- near (z 1.0): the back of a chair, out of focus, bottom right: foreground depth with no seam
    const near = st.layer(1.0);
    svg("rect", { x: 1500, y: 920, width: 520, height: 420, rx: 90, fill: c("shadow") }, near);
    kit.path(near, "M1520 950 Q1700 910 1890 960", { stroke: "accent3", sw: 4, opacity: 0.3 });
  },
});
