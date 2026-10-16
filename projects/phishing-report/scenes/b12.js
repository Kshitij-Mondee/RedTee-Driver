// @design report_lights_rise_to_team: small lights lift off the lit items, travel one curved route past a barrier to a desk, and a lamp comes on as the first one arrives
// b12 - the reports reached the security team first. From the 25 lit envelopes 25 small lights rise, travel one curved route up past
// the filter mesh and across to a security desk drawn top right (two ordinary figures, pip and tess, at an ordinary desk), and the
// desk lamp switches on as the first light arrives. A tag "first sign" marks the arrival and a second, "past the filters", the mesh.
// Treatments: (A) an arrow from the grid to a box labelled security (rejected: no cause and effect in time), (B) one big light
// (rejected: loses the 25), (C) CHOSEN: 25 lights on one route, staggered, so the order of events (reports first) is what you watch.
Loom.scene("b12", {
  build(ctx) {
    const { kit, m } = ctx;
    // ---- the funnel world: geometry and helpers shared by b09 to b12 and b31 (the same numbers in each file) ----
    const S = Loom.style, svg = Loom.svg, c = (t) => ctx.c(t);
    const G = { gy: 905, cx: 820, mouthY: 150, mouthHW: 330, mouthRY: 30, neckY: 470, neckHW: 60, spoutY: 528, meshY: 380, towerSize: 410,
      wall: { x: 970, y: 650, cell: 50, cols: 10, rows: 5 }, heap: { x: 130, w: 330 } };
    const hw = (y) => G.mouthHW + (G.neckHW - G.mouthHW) * (y - G.mouthY) / (G.neckY - G.mouthY);   // half width of the cone at y
    const cellXY = (i) => ({ x: G.wall.x + (i % G.wall.cols) * G.wall.cell + G.wall.cell / 2, y: G.wall.y + Math.floor(i / G.wall.cols) * G.wall.cell + G.wall.cell / 2 });
    const clamp01 = (v) => Math.max(0, Math.min(1, v));
    const smooth = (p) => p * p * (3 - 2 * p);
    // a pure function of time: fn(t, progress) runs every frame between t0 and t1
    const clock = (t0, t1, fn, name, kind) => Loom.drive((e, raw) => fn(t0 + raw * (t1 - t0), raw), t0, Math.max(0.05, t1 - t0), "linear", { kind: kind || "drive", beat: ctx.beat.id, name, content: kind !== "ambient" });
    // an envelope about (0, 0); its body and flap are returned so a scene can recolour them
    function envelope(parent, w, tok) {
      const h = w * 0.64, g = svg("g", {}, parent), col = c(tok);
      const body = svg("rect", { x: -w / 2, y: -h / 2, width: w, height: h, rx: w * 0.08, fill: col }, g);
      const flap = svg("path", { d: `M${-w / 2} ${-h / 2} L0 ${h * 0.12} L${w / 2} ${-h / 2} Z`, fill: S.darken(col, 0.22) }, g);
      const seam = svg("path", { d: `M${-w / 2} ${h / 2} L${-w * 0.12} ${-h * 0.02} M${w / 2} ${h / 2} L${w * 0.12} ${-h * 0.02}`, fill: "none", stroke: S.darken(col, 0.34), "stroke-width": Math.max(1, w * 0.035), "stroke-linecap": "round", opacity: 0.55 }, g);
      return { g, body, flap, seam };
    }
    const paint = (env, col) => { env.body.setAttribute("fill", col); env.flap.setAttribute("fill", S.darken(col, 0.22)); env.seam.setAttribute("stroke", S.darken(col, 0.34)); };
    const KEEP = ["dusk_haze", "skyline", "ground_band", "office_block", "annex_lobby", "inbox_frame", "funnel", "funnel_edge", "filter_mesh", "staff_1", "staff_2", "staff_3", "move_three", "grid50", "report_marks"]
      .concat([0, 1, 2, 3, 4].map((i) => "tray_row_" + i), [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => "pile_" + i));
    const H = {}; KEEP.forEach((n) => { H[n] = ctx.held(n); });

    const tDepart = ctx.cue("Those reports");
    const tSign = ctx.cue("first sign");
    const tPast = ctx.cue("past the filters");
    const FLY = 1.4, GAP = 0.035;
    const tFirst = tSign - FLY;           // the first light leaves so that it arrives on "first sign"

    // the security desk, top right: an ordinary office desk with two ordinary people and a lamp (still dark)
    // @form lit_room_cutaway: a small lit room cut away from a building, a desk, two people and a lamp
    const RX = 1486, RY = 138, RW = 340, RH = 300;
    const room = ctx.el("security_room", { x: RX, y: RY, w: RW, h: RH, kind: "scenery" });
    const ri = room.inner;
    svg("rect", { x: 0, y: 0, width: RW, height: RH, rx: 10, fill: c("surface2"), stroke: c("line"), "stroke-width": 3 }, ri);
    svg("rect", { x: 3, y: RH - 50, width: RW - 6, height: 47, rx: 8, fill: c("field2") }, ri);
    svg("rect", { x: 26, y: 34, width: 96, height: 84, rx: 4, fill: c("field"), stroke: c("line"), "stroke-width": 3 }, ri);
    [[44, 100, 18], [66, 90, 28], [92, 98, 20]].forEach(([x, y, h]) => svg("rect", { x, y: y - h + 14, width: 14, height: h, fill: c("field2") }, ri));
    [[52, 78], [74, 70], [98, 80]].forEach(([x, y]) => svg("rect", { x, y, width: 4, height: 5, fill: c("accent"), opacity: 0.55 }, ri));
    const wash = svg("ellipse", { cx: 205, cy: 150, rx: 190, ry: 130, fill: c("accent"), opacity: 0 }, ri);   // the lamp's warm wash on the wall, up when it lights
    const pip = ctx.character("pip", "pip", { x: 140, y: RH - 48, scale: 0.215, parent: ri, top: "accent3", skin: 1 });
    const tess = ctx.character("tess", "tess", { x: 270, y: RH - 48, scale: 0.215, parent: ri, top: "accent4", skin: 2 });
    const desk = ctx.el("security_desk", { x: 36, y: 168, w: 270, h: 84, kind: "scenery", parent: ri });
    svg("rect", { x: 0, y: 22, width: 270, height: 62, fill: c("surface"), stroke: c("line"), "stroke-width": 3 }, desk.inner);
    svg("rect", { x: -6, y: 16, width: 282, height: 12, rx: 3, fill: c("line") }, desk.inner);
    [76, 206].forEach((x) => {   // two screens facing the people
      svg("rect", { x, y: -8, width: 56, height: 36, rx: 4, fill: c("field"), stroke: c("line"), "stroke-width": 3 }, desk.inner);
      svg("rect", { x: x + 8, y: 0, width: 28, height: 4, rx: 2, fill: c("accent3"), opacity: 0.7 }, desk.inner);
      svg("rect", { x: x + 8, y: 9, width: 38, height: 4, rx: 2, fill: c("accent3"), opacity: 0.4 }, desk.inner);
    });
    const lamp = ctx.el("desk_lamp", { x: 177, y: 112, w: 56, h: 74, kind: "scenery", parent: ri });
    const glows = [34, 24, 15].map((r) => svg("circle", { cx: 28, cy: 26, r, fill: c("accent"), opacity: 0 }, lamp.inner));
    svg("rect", { x: 14, y: 66, width: 28, height: 8, rx: 3, fill: c("muted") }, lamp.inner);
    svg("path", { d: "M28 66 L28 38", stroke: c("muted"), "stroke-width": 4, "stroke-linecap": "round", fill: "none" }, lamp.inner);
    const shade = svg("path", { d: "M12 36 L44 36 L38 14 L18 14 Z", fill: c("muted") }, lamp.inner);
    m.settle(room, ctx.start + 0.1, { dy: 24, dur: 0.9 });

    // the 25 lights: each leaves its lit envelope, rises to the funnel's right side and follows one route up past the mesh to the lamp
    // @form lights_on_one_route: many small lights following one curved route in a staggered line, each leaving from its own origin
    const LX = RX + 177 + 28, LY = RY + 112 + 26;
    const trunk = `C1075 400 1090 330 1130 280 C1190 215 1480 230 ${LX} ${LY}`;
    const rt = ctx.el("report_route", { x: 0, y: 0, w: 0, h: 0, kind: "connector" });
    const rtp = kit.path(rt.inner, `M1100 470 ${trunk}`, { stroke: "accent", sw: 3, dash: "6 10", opacity: 0.45 });
    m.draw(rt, tFirst - 0.1, { dur: FLY + 0.6 });
    void rtp;
    const lights = [];
    for (let i = 0; i < 25; i++) {
      const p0 = cellXY(i), E = ctx.el("report_light_" + (i + 1), { x: 0, y: 0, w: 0, h: 0, kind: "token" });
      [26, 16].forEach((r, k) => svg("circle", { cx: 0, cy: 0, r, fill: c("accent"), opacity: k ? 0.3 : 0.12 }, E.inner));
      svg("circle", { cx: 0, cy: 0, r: 7, fill: c("accent") }, E.inner);
      svg("circle", { cx: -2, cy: -2, r: 2.5, fill: c("ink"), opacity: 0.8 }, E.inner);
      const path = svg("path", { d: `M${p0.x} ${p0.y} C${p0.x} ${p0.y - 110} 1100 600 1100 470 ${trunk}`, fill: "none", stroke: "none" }, E.outer);
      const t0 = tFirst + i * GAP;
      m.reveal(E, t0 - 0.05, { dy: 0, dur: 0.2, content: true });
      m.along(E, path, t0, { dur: FLY });
      Loom.tween(E.inner, { opacity: 1 }, { opacity: 0, duration: ctx.style.dur("exit") * 0.36, immediateRender: false }, t0 + FLY - 0.1, { kind: "exit", beat: ctx.beat.id, name: E.name });
      lights.push({ E, t0 });
    }
    // the marks on the lit envelopes hand their light on
    clock(tFirst, tFirst + 25 * GAP + 0.4, (t) => Array.from(H.report_marks.inner.childNodes).forEach((b, i) => { b.setAttribute("opacity", (1 - smooth(clamp01((t - (tFirst + i * GAP)) / 0.25))).toFixed(2)); }), "report_marks");

    // the lamp comes on as the first light arrives; the room takes the warm wash; the two people notice
    Loom.hold.heat([shade], tSign, { from: "muted", to: "accent", dur: 0.7, name: "desk_lamp" });
    clock(tSign, tSign + 0.9, (t, p) => { glows.forEach((g, i) => g.setAttribute("opacity", ([0.12, 0.22, 0.4][i] * smooth(p)).toFixed(3))); wash.setAttribute("opacity", (0.1 * smooth(p)).toFixed(3)); }, "desk_lamp");
    pip.emotion("surprised", tSign); pip.look(-1, -0.2, tSign); pip.emotion("focused", tSign + 1.3);
    tess.gesture("nod", tSign + 0.5, tSign + 1.7); tess.emotion("focused", tSign + 0.3);
    Loom.data.tag(ctx, "first_sign_tag", { x: RX, y: RY + RH + 24, text: "FIRST SIGN", color: "accent", textColor: "field", t: tSign + 0.1 });

    // "past the filters": a ring pings out of the mesh and the tag leads to it
    const ping = ctx.el("mesh_ping", { x: 0, y: 0, w: 0, h: 0, kind: "connector" });
    const ring = svg("ellipse", { cx: G.cx, cy: G.meshY, rx: 140, ry: 17, fill: "none", stroke: c("accent"), "stroke-width": 4, opacity: 0 }, ping.inner);
    clock(tPast, tPast + 1.2, (t, p) => { const k = smooth(p); ring.setAttribute("rx", (140 + 90 * k).toFixed(1)); ring.setAttribute("ry", (17 + 14 * k).toFixed(1)); ring.setAttribute("opacity", (0.8 * (1 - k)).toFixed(3)); }, "mesh_ping");
    const pf = Loom.data.tag(ctx, "past_filters_tag", { x: 0, y: 352, text: "PAST THE FILTERS", color: "accent3", textColor: "field", t: tPast });
    kit.place(pf, 640 - pf.w, 352);
    const pl = ctx.el("past_lead", { x: 0, y: 0, w: 0, h: 0, kind: "connector" });
    kit.line(pl.inner, 646, 352 + pf.h / 2, G.cx - 140, 380, { stroke: "accent3", sw: 3 });
    m.draw(pl, tPast + 0.3, { dur: 0.4 });
  },
});
