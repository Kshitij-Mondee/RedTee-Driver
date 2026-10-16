// @design held_place_label_board_continued: the same held place, the pan carries on to the last two strips and the board completes
Loom.scene("b08", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const S = Loom.style, svg = Loom.svg;
    const f = (v) => Math.round(v * 10) / 10;
    const words = (props.moves && props.moves.length ? props.moves : ["3 Report it", "4 Already clicked? Report at once"]).map((s) => String(s).replace(/^\d+\s+/, ""));

    // ---------------------------------------------------------------- hold the whole of b07's picture, by name
    const H = {};
    ["office_set", "dust", "screen_glow", "jo", "hero_laptop", "board_frame", "strip_1", "strip_2", "strip_3", "strip_4",
      "move1_num", "move1_text", "move2_num", "move2_text"].forEach((n) => { H[n] = ctx.held(n); });

    // the camera: rebuild the place's camera over the held layers, replay b07's pan as already done, then add this beat's
    const layers = {}, depth = { far: 0.35, board: 0.5, mid: 0, near: 0.5 };
    Array.from(H.office_set.inner.children).forEach((c) => { const nm = c.getAttribute("data-layer"); if (nm) layers[nm] = { cam: c, g: c.firstChild, depth: depth[nm] }; });
    const R = { E: H.office_set, W: 1920, H: 1080, layers, cams: [], ctx };
    const MID = layers.mid.g;
    R.cams.push({ kind: "pan", dx: -440, dy: 0, t0: ctx.start - 4, t1: ctx.start - 2, ease: Loom.ease.editorial });
    const BOARD = layers.board.g;

    // ambient carried on from b07 (absolute time, same periods): dust in the window spill, the skyline's flicker
    const D = ctx.end + 1.5 - ctx.start;
    const dr = Loom.rng("b07:dust");   // the same seeded sequence b07 drew the motes from
    const motes = Array.from(H.dust.inner.children).map((c) => { dr(); return { c, x: 160 + dr() * 470, y: 330 + dr() * 420, ax: 8 + dr() * 16, ay: 10 + dr() * 18, per: 6 + dr() * 5, ph: dr() * 6.28 }; });
    Loom.drive((e, raw) => { const t = ctx.start + raw * D; motes.forEach((o) => { o.c.setAttribute("cx", f(o.x + o.ax * Math.sin(2 * Math.PI * t / o.per + o.ph))); o.c.setAttribute("cy", f(o.y + o.ay * Math.sin(2 * Math.PI * t / (o.per * 1.3) + o.ph))); o.c.setAttribute("opacity", f(0.16 + 0.12 * Math.sin(2 * Math.PI * t / o.per + o.ph))); }); }, ctx.start + 1.5, D - 1.5, "linear", { kind: "ambient", beat: ctx.beat.id, name: "dust" });
    Loom.hold.breathe(H.screen_glow, ctx.start + 1.5, ctx.end + 1.5, { amp: 0.012, period: 6 });

    // ---------------------------------------------------------------- move three: the pan, the strip lights and prints
    const Y = 112, SW = 500, SH = 190, XS = [150, 670, 1190, 1790];
    const tThree = ctx.cue("Move three"), tReport = ctx.cue("report it with your company's");
    const tPanEnd = tThree + 2.0;
    Loom.cam.pan(R, { dx: -860, t0: tThree, t1: tPanEnd });
    const halo = (E) => [E.inner.children[0], E.inner.children[3]];
    const light = (i, t, strong) => {
      const E = H["strip_" + i], mt = { kind: "heat", beat: ctx.beat.id, name: `strip_${i}.light`, content: true };
      Loom.hold.heat(E, t, { from: "line", to: "accent", dur: 0.6, attr: "fill", name: `strip_${i}.lamp` });
      Loom.hold.heat(E, t, { from: "line", to: "accent4", dur: 0.6, attr: "stroke", name: `strip_${i}.edge` });
      Loom.hold.heat(E, t, { from: "field", to: "surface", dur: 0.6, attr: "fill", name: `strip_${i}.plate` });
      const [wash, ha] = halo(E);
      Loom.tween(wash, { opacity: 0 }, { opacity: strong ? 0.12 : 0.07, duration: 0.8, ease: Loom.ease.enter }, t, mt);
      Loom.tween(ha, { opacity: 0 }, { opacity: strong ? 0.42 : 0.32, duration: 0.6, ease: Loom.ease.enter }, t, mt);
    };
    const num = (i, t) => {
      const E = ctx.el(`move${i}_num`, { x: XS[i - 1] + 28, y: Y + 54, w: 92, h: 92, kind: "value", parent: BOARD });
      kit.text(E.inner, String(i), { role: "title", x: 0, y: 0, w: 92, h: 92, align: "center", valign: "middle", weight: 800, color: "ink", size: 64 });
      m.pop(E, t, { overshoot: false });
      return E;
    };
    const letter = (i, t) => {
      const E = ctx.el(`move${i}_text`, { x: XS[i - 1] + 134, y: Y + 22, w: 350, h: 146, kind: "text", parent: BOARD });
      kit.text(E.inner, words[i - 3], { role: "lead", x: 0, y: 0, w: 350, h: 146, valign: "middle", weight: 700, color: "ink", maxLines: 3 });
      m.unmask(E, t, { dur: 0.8 });
      return E;
    };
    light(3, tReport); const n3 = num(3, tReport + 0.1); const l3 = letter(3, tReport + 0.15);

    // strip three becomes the motif the next beat carries into the funnel: once the pan has landed, the lit strip is
    // swapped for an identical one that lives in the world (final screen place: board x - 650, same y)
    const mv3 = ctx.motif("move_three", { x: XS[2] - 650, y: Y, w: SW, h: SH });
    kit.rect(mv3.inner, 0, 0, SW, SH, { fill: "surface", r: 4, flat: true });
    svg("rect", { x: 1, y: 1, width: SW - 2, height: SH - 2, rx: 4, fill: "none", stroke: S.c("accent4"), "stroke-width": 2.5 }, mv3.inner);
    svg("circle", { cx: 26, cy: 26, r: 22, fill: S.c("accent"), opacity: 0.32 }, mv3.inner);
    svg("circle", { cx: 26, cy: 26, r: 9, fill: S.c("accent") }, mv3.inner);
    svg("circle", { cx: 74, cy: 100, r: 46, fill: "none", stroke: S.c("accent4"), "stroke-width": 3 }, mv3.inner);
    kit.text(mv3.inner, "3", { role: "title", x: 28, y: 54, w: 92, h: 92, align: "center", valign: "middle", weight: 800, color: "ink", size: 64 });
    kit.text(mv3.inner, words[0], { role: "lead", x: 134, y: 22, w: 350, h: 146, valign: "middle", weight: 700, color: "ink", maxLines: 3 });
    Loom.set(mv3.inner, { opacity: 0 }, 0);
    Loom.set(mv3.inner, { opacity: 1 }, tPanEnd + 0.1);
    [H.strip_3, n3, l3].forEach((E) => Loom.set(E.mover, { opacity: 0 }, tPanEnd + 0.1));

    // ---------------------------------------------------------------- the report button, drawn on the laptop's top bezel
    // @form device_control_chip: a small labelled control drawn onto the device the narration names
    const tBtn = ctx.cue("report button");
    const btn = ctx.el("report_button", { x: 1494, y: 369, w: 164, h: 52, kind: "instrument", parent: MID });   // 52 tall: the label needs its inset (check, orchestrator fix)
    kit.rect(btn.inner, 0, 0, 164, 52, { fill: "accent", r: 6, flat: true });
    kit.icon(btn.inner, "flag", { x: 28, y: 26, size: 26, color: S.pickTokenOn("accent") });
    kit.text(btn.inner, "Report", { role: "label", x: 50, y: 0, w: 104, h: 52, valign: "middle", weight: 700, color: S.pickTokenOn("accent"), maxLines: 1 });
    m.unmask(btn, tBtn, { dur: 0.5 });
    Loom.sfx("click", tBtn + 0.5);

    // ---------------------------------------------------------------- move four: lit a little apart, then lettered
    const tFour = ctx.cue("Move four"), tClicked = ctx.cue("if you already clicked");
    light(4, tFour, true); num(4, tFour + 0.1);
    letter(4, tClicked);

    // the one quiet accent on the board: the seed's box mark, stamped in the gap before strip four, as it is said
    const tHide = ctx.cue("do not hide it");
    Loom.treat.mark(ctx, "move4_mark", { x: 1090, y: 207, size: 84, tone: "accent", kind: "yes", t: tHide, parent: MID });
  },
});
