// @design callback_annotate_same_object: an object from the opening returns, grows out of its screen to fill the frame, and is annotated part by part in step with the words
Loom.scene("b40", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const S = Loom.style, svg = Loom.svg, rr = Loom.treat.rr, ui = Loom.ui;
    const f = (v) => Math.round(v * 10) / 10;
    const tint = (tok, p) => (p >= 0 ? S.lighten(S.c(tok), p) : S.darken(S.c(tok), -p));
    const flags = props.flags && props.flags.length ? props.flags : ["within the hour", "one letter off", "shortened link", "password"];

    // ---------------------------------------------------------------- the place (dusk): the same office_set as b02 and b07
    const R = Loom.place.office(ctx, "office_set", { side: "right", time: 17.4 });
    const FAR = R.layers.far.g, MID = R.layers.mid.g;
    R.layers.mid.depth = 0;       // the desk cluster holds still: the laptop screen is a fixed portal in the station
    R.layers.near.depth = 0.6;
    const vp = R.vp, yAt = (x, y) => vp[1] + (y - vp[1]) * ((x - vp[0]) / (400 - vp[0]));
    // dusk light: the pane takes a cool evening sky with a warm band on the horizon; a cool spill falls from the window.
    // Everything in this group is drawn in accent3 so b41 can warm it (the window light settling)
    const dusk = svg("g", { class: "lm-winlight" }, FAR);
    svg("path", { d: `M-70 ${f(yAt(-70, 230))} L340 ${f(yAt(340, 230))} L340 ${f(yAt(340, 395))} L-70 ${f(yAt(-70, 395))} Z`, fill: S.c("accent3"), opacity: 0.3 }, dusk);
    svg("path", { d: "M340 571 L-70 648 L490 1160 L600 740 Z", fill: S.c("accent3"), opacity: 0.1 }, dusk);
    svg("path", { d: "M460 270 L640 270 L760 700 L520 700 Z", fill: S.c("accent3"), opacity: 0.06 }, dusk);
    svg("path", { d: `M-70 ${f(yAt(-70, 500))} L340 ${f(yAt(340, 500))} L340 ${f(yAt(340, 560))} L-70 ${f(yAt(-70, 560))} Z`, fill: S.c("accent"), opacity: 0.34 }, FAR);

    // ---------------------------------------------------------------- the hero desk cluster (same geometry as b07)
    const glow = ctx.el("screen_glow", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", parent: MID });
    MID.insertBefore(glow.outer, MID.firstChild);
    [[640, 360, 0.02], [560, 310, 0.025], [470, 260, 0.03], [390, 210, 0.04]].forEach(([rx, ry, o]) =>
      svg("ellipse", { cx: 1420, cy: 590, rx, ry, fill: S.c("accent3"), opacity: o }, glow.inner));
    Loom.hold.breathe(glow, ctx.start, ctx.end + 1.5, { amp: 0.012, period: 6 });
    svg("path", { d: rr(930, 548, 190, 230, 36), fill: tint("surface2", -0.15) }, MID);
    svg("path", { d: rr(948, 566, 154, 130, 26), fill: tint("surface2", 0.04) }, MID);
    const jo = ctx.character("jo", "ava", { x: 1030, y: 1020, scale: 0.78, skin: 1, top: "accent3", bottom: "ink", parent: MID, pose: "idle", emotion: "focused" });
    jo.look(1, 0.1, ctx.start);
    const cover = svg("g", { class: "lm-desk-cover" }, MID);
    svg("path", { d: "M926 784 H1430 V1000 H926 Z", fill: tint("accent", -0.5) }, cover);
    svg("path", { d: "M926 784 H1430 V818 H926 Z", fill: S.c("shadow"), opacity: 0.45 }, cover);
    svg("path", { d: "M900 750 L840.6 705.9 L840.6 739.9 L900 784 Z", fill: tint("accent", -0.18) }, cover);
    svg("path", { d: "M840.6 705.9 H1235 V750 H900 Z", fill: tint("accent", 0.12) }, cover);
    svg("path", { d: "M900 750 H1235 V784 H900 Z", fill: S.c("accent") }, cover);
    svg("rect", { x: 926, y: 784, width: 18, height: 216, fill: tint("accent", -0.25) }, cover);
    Loom.obj.shape(MID, "folder", 1164, 628, 130, { key: "b07:fold", detail: 2, shadow: false });
    Loom.obj.shape(MID, "document", 1150, 672, 72, { key: "b07:doc", detail: 1, shadow: false });
    // @form device_screen_portal: a device whose screen opening is where a nested picture shows through
    const lap = ctx.el("hero_laptop", { x: 1120, y: 350, w: 600, h: 400, kind: "instrument", parent: MID });
    svg("ellipse", { cx: 300, cy: 392, rx: 300, ry: 18, fill: S.c("shadow"), opacity: 0.35 }, lap.inner);
    svg("path", { d: "M10 342 H590 L574 390 H26 Z", fill: tint("surface", 0.04) }, lap.inner);
    svg("path", { d: "M10 342 H590 L586 354 H14 Z", fill: tint("surface", 0.2) }, lap.inner);
    for (let r = 0; r < 3; r++) svg("rect", { x: 70, y: 364 + r * 7, width: 460, height: 3, rx: 1.5, fill: tint("surface", -0.3) }, lap.inner);
    svg("rect", { x: 255, y: 376, width: 90, height: 8, rx: 4, fill: tint("surface", -0.15) }, lap.inner);
    kit.rect(lap.inner, 42, 10, 516, 344, { fill: "field", r: 14, stroke: "line", sw: 2, flat: true });
    kit.rect(lap.inner, 60, 80, 480, 270, { fill: "field2", r: 4, flat: true, crisp: true });
    svg("circle", { cx: 300, cy: 45, r: 3.2, fill: S.c("line") }, lap.inner);
    // two grey colleagues still at their desks, left of Jo (the day is ending)
    [[470, 940, 0.46, false], [700, 902, 0.38, true]].forEach(([x, y, sc, fl], i) =>
      ctx.character("bg_extra_" + (i + 1), "extra", { x, y, scale: sc, flip: fl, top: i ? "line" : "muted", parent: MID, pose: "idle" }));

    // ---------------------------------------------------------------- the message: same layout as b03 and b15, drawn large
    // (station coords: the window is 1160 x 826 at (380, 100); local coords below are relative to it)
    const WX = 380, WY = 100, WW = 1160, WH = 826, T0 = ctx.cue("Back to Jo's message");
    const veil = ctx.el("veil", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" });
    svg("rect", { x: -40, y: -40, width: 2000, height: 1160, fill: S.c("field"), opacity: 0.86 }, veil.inner);
    Loom.tween(veil.inner, { opacity: 0 }, { opacity: 1, duration: 1.3, ease: Loom.ease.editorial }, T0 + 0.1, { kind: "grade", beat: ctx.beat.id, name: "veil", content: true });

    const W = ui.window(ctx, { name: "message", x: WX, y: WY, w: WW, h: WH });
    const msg = W.E, MI = msg.inner;
    // the sender row: a disc, the name, and the address as a row of grey glyph tiles (no readable invented domain)
    kit.disc(MI, 96, 134, 34, { fill: "accent3", flat: true });
    kit.icon(MI, "headset", { x: 96, y: 134, size: 34, color: "field" });
    kit.text(MI, "IT support", { role: "lead", x: 150, y: 104, w: 360, h: 50, weight: 700, maxLines: 1 });
    const ODD = 15;
    let oddTile = null;
    for (let i = 0; i < 18; i++) {
      const tg = svg("g", {}, MI);
      kit.rect(tg, 150 + i * 28, 158, 22, 22, { fill: "muted", r: 3, flat: true, crisp: true });
      svg("rect", { x: 150 + i * 28 + 6, y: 158 + 9, width: 10, height: 4, rx: 2, fill: S.c("field"), opacity: 0.45 }, tg);
      if (i === ODD) oddTile = tg;
    }
    // the subject line and its deadline chip
    kit.text(MI, "Confirm your password", { role: "title", x: 60, y: 206, w: 1040, h: 84, weight: 800, maxLines: 1, size: 72 });
    const fh = kit.fit("within the hour", { role: "lead", w: 600, maxLines: 1, weight: 700 }), CH = Math.ceil(fh.height + 26), CW = Math.ceil(18 + 32 + 12 + fh.width + 26);
    const chip = svg("g", {}, MI);
    kit.pill(chip, 60, 400, CW, CH, { fill: "surface2", flat: true, crisp: true });
    kit.icon(chip, "clock", { x: 60 + 18 + 16, y: 400 + CH / 2, size: 32, color: "accent" });
    kit.text(chip, "within the hour", { role: "lead", x: 60 + 18 + 32 + 12, y: 400, w: fh.width + 6, h: CH, valign: "middle", weight: 700, maxLines: 1, color: "ink" });
    kit.text(MI, "or lose access to the shared drive", { role: "body", x: 60, y: 510, w: 1000, h: 52, maxLines: 1, color: "muted" });
    // the link (a short chip of glyph tiles), the button, the password box
    const link = svg("g", {}, MI);
    kit.rect(link, 60, 650, 380, 56, { fill: "surface2", r: 8, flat: true, crisp: true });
    kit.icon(link, "link", { x: 92, y: 678, size: 28, color: "accent3" });
    for (let i = 0; i < 11; i++) kit.rect(link, 126 + i * 28, 667, 22, 22, { fill: "accent3", r: 3, flat: true, crisp: true });
    ui.button(ctx, msg, { x: 860, y: 646, label: "Act now", h: 64, fill: "accent2" });
    const pass = ui.field(ctx, msg, { x: 60, y: 742, w: 520, h: 64 });
    kit.icon(MI, "key-round", { x: 96, y: 774, size: 30, color: "muted" });
    for (let i = 0; i < 9; i++) kit.disc(MI, 150 + i * 28, 774, 7, { fill: "ink", flat: true });
    void pass;

    // the message grows out of the laptop screen to fill the frame (the push IS entering the message)
    const mt = (n) => ({ kind: "push", beat: ctx.beat.id, name: n, content: true });
    Loom.tween(msg.inner, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: Loom.ease.enter }, T0, mt("message.in"));
    Loom.tween(msg.mover, { x: 1180 - WX, y: 430 - WY, scaleX: 480 / WW, scaleY: 270 / WH, transformOrigin: "0 0" }, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration: 1.5, ease: Loom.ease.editorial }, T0, mt("message.grow"));
    Loom.cam.push(R, { to: [1420, 565], scale: 1.6, t0: T0, t1: T0 + 1.5 });
    // Jo's cursor is already on the link, as it was at the start
    const cur = ui.cursor(ctx, { name: "cursor", x: WX + 250, y: WY + 676 });
    m.cursorIn(cur, T0 + 1.5);

    // ---------------------------------------------------------------- the four signs mark themselves: a flag and a lit outline each
    // @form callout_flag_on_part: a small flag planted on the part of a shown object that the narration names
    const outline = (x, y, w, h) => svg("rect", { x: x - 6, y: y - 6, width: w + 12, height: h + 12, rx: 8, fill: "none", stroke: S.c("line"), "stroke-width": 3.5, opacity: 0 }, MI);
    const marks = [outline(60, 400, CW, CH), outline(150 + ODD * 28, 158, 22, 22), outline(60, 650, 380, 56), outline(60, 742, 520, 64)];
    const flagAt = (i, to, t) => {
      const g0 = Loom.treat.labelGeom(0, 0, flags[i], { as: "flag", to }), rise = 78;
      const cy = to[1] - rise + g0.h / 2 - 2;
      Loom.treat.label(ctx, "flag_" + i, { x: to[0] + g0.tw / 2, y: cy, text: flags[i], to, tone: "accent", t, as: "flag" });
      Loom.tween(marks[i], { opacity: 0 }, { opacity: 1, duration: 0.3 }, t, { kind: "highlight", beat: ctx.beat.id, name: "mark_" + i, content: true });
      Loom.hold.heat(marks[i], t, { from: "line", to: "accent", attr: "stroke", dur: 0.4, name: "mark_" + i });
    };
    const tHour = ctx.cue("within the hour"), tLetter = ctx.cue("one letter off"), tLink = ctx.cue("a shortened link"), tPass = ctx.cue("a password");
    flagAt(0, [WX + 60 + CW - 34, WY + 400], tHour);
    flagAt(1, [WX + 150 + ODD * 28 + 11, WY + 158], tLetter);
    Loom.hold.heat(oddTile, tLetter + 0.1, { from: "muted", to: "accent2", dur: 0.4, name: "odd_tile" });
    flagAt(2, [WX + 60 + 330, WY + 650], tLink);
    flagAt(3, [WX + 60 + 460, WY + 742], tPass);

    // the hold through the question: the lit outlines breathe on a slow period-locked cycle
    const tAsk = ctx.cue("what does Jo do");
    Loom.drive((e, raw) => { const t = tPass + 0.8 + raw * (ctx.end + 1.5 - tPass - 0.8); marks.forEach((mk, i) => mk.setAttribute("stroke-width", f(4.2 + 1.4 * Math.sin(2 * Math.PI * t / 3 + i * 0.9)))); }, tPass + 0.8, ctx.end + 1.5 - tPass - 0.8, "linear", { kind: "ambient", beat: ctx.beat.id, name: "marks" });
    m.nudge(cur, tAsk, { dx: 0, dy: -3 });
  },
});
