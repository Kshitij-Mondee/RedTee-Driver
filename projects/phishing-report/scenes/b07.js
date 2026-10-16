// @design held_place_label_board: a held place whose wall board lights one strip per named step while the camera pans along it
Loom.scene("b07", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const S = Loom.style, svg = Loom.svg, rr = Loom.treat.rr;
    const f = (v) => Math.round(v * 10) / 10;
    const tint = (tok, p) => (p >= 0 ? S.lighten(S.c(tok), p) : S.darken(S.c(tok), -p));
    const words = (props.moves && props.moves.length ? props.moves : ["1 Look for the signs", "2 Do not click or reply"]).map((s) => String(s).replace(/^\d+\s+/, ""));

    // ---------------------------------------------------------------- the place (night): the same office_set as b02 and b40
    const R = Loom.place.office(ctx, "office_set", { side: "right", time: 20.4 });
    const FAR = R.layers.far.g, MID = R.layers.mid.g;
    // a fourth depth layer for the wall board, between the wall and the desk. The desk cluster does not slide: the
    // laptop screen is a fixed portal in the station, so the pan travels along the wall and the board
    const boardCam = svg("g", { class: "lm-cam", "data-layer": "board" });
    R.E.inner.insertBefore(boardCam, R.layers.mid.cam);
    R.layers.board = { cam: boardCam, g: svg("g", {}, boardCam), depth: 0.5 };
    R.layers.mid.depth = 0;
    R.layers.near.depth = 0.5;
    const BOARD = R.layers.board.g;

    // night: the shell is darkened, the skyline is lit, a cool spill falls from the window
    svg("rect", { x: -700, y: -700, width: 3400, height: 2600, fill: S.c("field"), opacity: 0.46 }, FAR);
    const vp = R.vp, yAt = (x, y) => vp[1] + (y - vp[1]) * ((x - vp[0]) / (400 - vp[0]));
    const sky = Loom.rng("b07:sky"), lights = [];
    for (let i = 0; i < 16; i++) {
      const x = -52 + (i % 8) * 40 + sky() * 14, lvl = 470 + Math.floor(i / 8) * 46 - sky() * 40;
      lights.push(svg("rect", { x: f(x), y: f(yAt(x, lvl)), width: 9, height: 12, fill: S.c("accent"), opacity: f(0.55 + sky() * 0.4) }, FAR));
    }
    const spill = svg("g", { class: "lm-winlight" }, FAR);
    svg("path", { d: "M340 571 L-70 648 L490 1160 L600 740 Z", fill: S.c("accent3"), opacity: 0.07 }, spill);
    svg("path", { d: "M460 270 L640 270 L760 700 L520 700 Z", fill: S.c("accent3"), opacity: 0.05 }, spill);
    // ambient: a few windows across the street flicker on slow period-locked cycles; dust drifts in the spill
    const D = ctx.end + 1.5 - ctx.start;   // ambient motion runs on absolute time (period-locked), so b08 carries it on without a jump
    lights.forEach((n, i) => { if (i % 3 !== 0) return; const base = +n.getAttribute("opacity"), per = 5 + (i % 4) * 2;
      Loom.drive((e, raw) => n.setAttribute("opacity", f(base * (0.55 + 0.45 * Math.sin(2 * Math.PI * ((ctx.start + raw * D) / per) + i)))), ctx.start, D, "linear", { kind: "ambient", beat: ctx.beat.id, name: "skyline" }); });
    const dust = ctx.el("dust", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", parent: FAR });
    const dr = Loom.rng("b07:dust"), motes = [];
    for (let i = 0; i < 14; i++) motes.push({ c: svg("circle", { r: f(1.6 + dr() * 1.6), fill: S.c("ink"), opacity: 0.0 }, dust.inner), x: 160 + dr() * 470, y: 330 + dr() * 420, ax: 8 + dr() * 16, ay: 10 + dr() * 18, per: 6 + dr() * 5, ph: dr() * 6.28 });
    Loom.drive((e, raw) => { const t = ctx.start + raw * D; motes.forEach((o) => { o.c.setAttribute("cx", f(o.x + o.ax * Math.sin(2 * Math.PI * t / o.per + o.ph))); o.c.setAttribute("cy", f(o.y + o.ay * Math.sin(2 * Math.PI * t / (o.per * 1.3) + o.ph))); o.c.setAttribute("opacity", f(0.16 + 0.12 * Math.sin(2 * Math.PI * t / o.per + o.ph))); }); }, ctx.start, D, "linear", { kind: "ambient", beat: ctx.beat.id, name: "dust" });

    // ---------------------------------------------------------------- the hero desk cluster (mid, static)
    // a pool of cool light from the screen sits under everything in the mid layer, then the chair back, Jo, and the
    // desk drawn over her lap, then the big laptop whose screen is the st_msg portal
    const glow = ctx.el("screen_glow", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", parent: MID });
    MID.insertBefore(glow.outer, MID.firstChild);
    [[640, 360, 0.035], [560, 310, 0.04], [470, 260, 0.05], [390, 210, 0.06]].forEach(([rx, ry, o]) =>
      svg("ellipse", { cx: 1420, cy: 590, rx, ry, fill: S.c("accent3"), opacity: o }, glow.inner));
    Loom.hold.breathe(glow, ctx.start, ctx.end + 1.5, { amp: 0.012, period: 6 });
    svg("path", { d: rr(930, 548, 190, 230, 36), fill: tint("surface2", -0.15) }, MID);             // the chair back
    svg("path", { d: rr(948, 566, 154, 130, 26), fill: tint("surface2", 0.04) }, MID);

    const jo = ctx.character("jo", "ava", { x: 1030, y: 1020, scale: 0.78, skin: 1, top: "accent3", bottom: "ink", parent: MID, pose: "idle", emotion: "focused" });
    jo.look(1, 0.1, ctx.start);

    const cover = svg("g", { class: "lm-desk-cover" }, MID);
    svg("path", { d: "M926 784 H1430 V1000 H926 Z", fill: tint("accent", -0.5) }, cover);                  // the front panel
    svg("path", { d: "M926 784 H1430 V818 H926 Z", fill: S.c("shadow"), opacity: 0.45 }, cover);
    svg("path", { d: "M900 750 L840.6 705.9 L840.6 739.9 L900 784 Z", fill: tint("accent", -0.18) }, cover); // left side face
    svg("path", { d: "M840.6 705.9 H1235 V750 H900 Z", fill: tint("accent", 0.12) }, cover);               // top surface
    svg("path", { d: "M900 750 H1235 V784 H900 Z", fill: S.c("accent") }, cover);                            // front edge
    svg("rect", { x: 926, y: 784, width: 18, height: 216, fill: tint("accent", -0.25) }, cover);             // the leg
    Loom.obj.shape(MID, "folder", 1164, 628, 130, { key: "b07:fold", detail: 2, shadow: false });
    Loom.obj.shape(MID, "document", 1150, 672, 72, { key: "b07:doc", detail: 1, shadow: false });

    // @form device_screen_portal: a device whose screen opening is where a nested picture shows through
    // local coordinates are station coordinates minus (1120, 350): the lid runs 1162..1678 x 360..704, the screen
    // opening is exactly the portal rect (1180, 430, 480, 270), and the top bezel (360..430) has room for a small chip
    const lap = ctx.el("hero_laptop", { x: 1120, y: 350, w: 600, h: 400, kind: "instrument", parent: MID });
    svg("ellipse", { cx: 300, cy: 392, rx: 300, ry: 18, fill: S.c("shadow"), opacity: 0.35 }, lap.inner);
    svg("path", { d: "M10 342 H590 L574 390 H26 Z", fill: tint("surface", 0.04) }, lap.inner);              // the base
    svg("path", { d: "M10 342 H590 L586 354 H14 Z", fill: tint("surface", 0.2) }, lap.inner);
    for (let r = 0; r < 3; r++) svg("rect", { x: 70, y: 364 + r * 7, width: 460, height: 3, rx: 1.5, fill: tint("surface", -0.3) }, lap.inner);
    svg("rect", { x: 255, y: 376, width: 90, height: 8, rx: 4, fill: tint("surface", -0.15) }, lap.inner);
    kit.rect(lap.inner, 42, 10, 516, 344, { fill: "field", r: 14, stroke: "line", sw: 2, flat: true });    // the lid
    kit.rect(lap.inner, 60, 80, 480, 270, { fill: "field2", r: 4, flat: true, crisp: true });              // the screen: the portal sits here
    svg("circle", { cx: 300, cy: 45, r: 3.2, fill: S.c("line") }, lap.inner);

    // ---------------------------------------------------------------- the wall board: four strips, two lit here
    // @form label_board_strips: a rail of numbered strips on a wall that light in order as each is named
    const Y = 112, SW = 500, SH = 190, XS = [150, 670, 1190, 1790];
    const frame = ctx.el("board_frame", { x: 100, y: 92, w: 2220, h: 232, kind: "scenery", parent: BOARD });
    kit.rect(frame.inner, 0, 0, 2220, 232, { fill: "field2", r: 6, stroke: "line", sw: 2, flat: true });
    kit.rect(frame.inner, 0, 0, 2220, 10, { fill: "line", r: 3, flat: true });
    [60, 1100, 2160].forEach((x) => kit.rect(frame.inner, x, -22, 12, 30, { fill: "muted", r: 3, flat: true }));
    svg("rect", { x: 6, y: 232, width: 2208, height: 16, fill: S.c("shadow"), opacity: 0.3 }, frame.inner);
    const halos = [];
    const strips = XS.map((x0, i) => {
      const E = ctx.el(`strip_${i + 1}`, { x: x0, y: Y, w: SW, h: SH, kind: "card", parent: BOARD });
      // a dark blank until it is named: its plate, an edge, a lamp, a ring for the numeral
      svg("path", { d: `M0 ${SH} L${SW} ${SH} L${SW + 40} ${SH + 360} L-40 ${SH + 360} Z`, fill: S.c("accent4"), opacity: 0 }, E.inner);   // the wash it casts on the wall once lit
      kit.rect(E.inner, 0, 0, SW, SH, { fill: "field", r: 4, flat: true });
      svg("rect", { x: 1, y: 1, width: SW - 2, height: SH - 2, rx: 4, fill: "none", stroke: S.c("line"), "stroke-width": 2.5 }, E.inner);
      svg("circle", { cx: 26, cy: 26, r: 22, fill: S.c("accent"), opacity: 0 }, E.inner);                    // the lamp's halo
      svg("circle", { cx: 26, cy: 26, r: 9, fill: S.c("line") }, E.inner);                                   // the lamp
      svg("circle", { cx: 74, cy: 100, r: 46, fill: "none", stroke: S.c("line"), "stroke-width": 3 }, E.inner); // the numeral ring
      halos.push([E.inner.firstChild, E.inner.children[3]]);
      return E;
    });
    const num = (i, t) => {
      const E = ctx.el(`move${i}_num`, { x: XS[i - 1] + 28, y: Y + 54, w: 92, h: 92, kind: "value", parent: BOARD });
      kit.text(E.inner, String(i), { role: "title", x: 0, y: 0, w: 92, h: 92, align: "center", valign: "middle", weight: 800, color: "ink", size: 64 });
      m.pop(E, t, { overshoot: false });
    };
    const letter = (i, t) => {
      const E = ctx.el(`move${i}_text`, { x: XS[i - 1] + 134, y: Y + 22, w: 350, h: 146, kind: "text", parent: BOARD });
      kit.text(E.inner, words[i - 1], { role: "lead", x: 0, y: 0, w: 350, h: 146, valign: "middle", weight: 700, color: "ink", maxLines: 3 });
      m.unmask(E, t, { dur: 0.8 });
      return E;
    };
    const light = (i, t) => {
      const E = strips[i - 1];
      Loom.hold.heat(E, t, { from: "line", to: "accent", dur: 0.6, attr: "fill", name: `strip_${i}.lamp` });
      Loom.hold.heat(E, t, { from: "line", to: "accent4", dur: 0.6, attr: "stroke", name: `strip_${i}.edge` });
      Loom.hold.heat(E, t, { from: "field", to: "surface", dur: 0.6, attr: "fill", name: `strip_${i}.plate` });
      const [wash, halo] = halos[i - 1], mt = { kind: "heat", beat: ctx.beat.id, name: `strip_${i}.light`, content: true };
      Loom.tween(wash, { opacity: 0 }, { opacity: 0.07, duration: 0.8, ease: Loom.ease.enter }, t, mt);
      Loom.tween(halo, { opacity: 0 }, { opacity: 0.32, duration: 0.6, ease: Loom.ease.enter }, t, mt);
    };

    // ---------------------------------------------------------------- the beat
    const tOne = ctx.cue("Move one"), tSigns = ctx.cue("look for the signs");
    const tTwo = ctx.cue("Move two"), tNoClick = ctx.cue("do not click it");
    light(1, tOne); num(1, tOne + 0.1);
    letter(1, tSigns);
    // the camera pans along the board to strip 2 (2 s) as move two is named, then move two prints
    Loom.cam.pan(R, { dx: -440, t0: tTwo, t1: tTwo + 2.0 });
    light(2, tTwo + 0.2); num(2, tTwo + 0.3);
    const l2 = letter(2, tNoClick);
    m.emphasis(l2, ctx.cue("or reply to it"));
  },
});
