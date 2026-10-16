// @design cutaway_spread: a building whose front lifts away to show many desks, then a calm ring spreads from one desk and marks every desk it reaches
/* b13 - the early warning reaching everyone else.
 * Treatments: (A) a network graph of dots lighting up (rejected: no people, nothing to protect), (B) a plain
 * "alert sent" banner (rejected: tells, does not show), (C) CHOSEN: hold and transform. The office block from the
 * funnel, close: its facade lifts away to show five floors of desks and people at inboxes; the security desk
 * glows on the top floor; a soft ring spreads from its lamp, and every inbox it passes gets a shield tick.
 * Elements other beats hold by name: building_set (text-free: shell, floors, desks, people).
 */
Loom.scene("b13", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const tags = (props && props.tags) || ["early warning", "sooner: limit the harm", "one company"];
    const BX = 380, BW = 980, BY = 190, FH = 142, NF = 5, BH = FH * NF, GROUND = BY + BH, DX = 192.5, OFF = 30;
    const colX = (c) => BX + 105 + c * DX;                 // station x of a desk centre
    const floorY = (r) => BY + (r + 1) * FH;               // station y of a floor's base
    const LAMP = [colX(2) + 40, floorY(0) - 98];           // the security lamp head: the ring starts here
    const meta = (name) => ({ kind: "fade", beat: ctx.beat.id, name, content: true });
    const tagW = (s) => kit.fit(s, { role: "label", w: 900, maxLines: 1, weight: 800, tracking: 1 }).width * 1.06 + 32;
    const tagH = (s) => kit.fit(s, { role: "label", w: 900, maxLines: 1, weight: 800, tracking: 1 }).height + 19.2;

    // ---- the night behind: a bloom of warm light and a skyline of other buildings (this one is one company)
    const night = ctx.el("night_glow", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" });
    Loom.glow.glowDisc(night.inner, 870, 480, 330, "accent", { rings: 9, spread: 2.6, opacity: 0.1, core: false });
    m.reveal(night, ctx.start + 0.05, { dy: 0 });
    // @form seeded_skyline: a row of blocks of seeded height with a few lit windows, as the many that surround one
    const city = Loom.array(ctx, "skyline_blocks", { x: 20, y: GROUND - 500, w: 1920, h: 500, cols: 15, rows: 1, dx: 128, dy: 0, order: "centre", t: ctx.start + 0.05, stagger: 0.03, rise: 0,
      draw: (g, i, r, c, rnd) => {
        const w = 96 + rnd() * 26, h = 170 + rnd() * 330;
        kit.rect(g, 0, 500 - h, w, h, { fill: "field2", flat: true, crisp: true });
        for (let k = 0; k < 14; k++) if (rnd() < 0.42) kit.rect(g, 12 + (k % 4) * 22, 500 - h + 22 + Math.floor(k / 4) * 34, 9, 13, { fill: "accent4", flat: true, crisp: true, opacity: 0.35 + rnd() * 0.3 });
      } });
    m.drift(city, ctx.start, ctx.end, { amp: 5, period: 6 });
    const street = ctx.el("street", { x: 0, y: GROUND, w: 1920, h: 150, kind: "scenery" });
    kit.rect(street.inner, 0, 0, 1920, 150, { fill: "field2", flat: true, crisp: true });
    kit.line(street.inner, 0, 2, 1920, 2, { stroke: "line", sw: 3 });
    for (let x = 60; x < 1920; x += 180) kit.line(street.inner, x, 76, x + 90, 76, { stroke: "line", sw: 4, opacity: 0.5 });
    m.reveal(street, ctx.start + 0.05, { dy: 0 });

    // ---- the building: shell, five floors, desks with people at inboxes (children never leave on their own)
    const set = ctx.el("building_set", { x: BX, y: BY - OFF, w: BW, h: BH + OFF, kind: "scenery" });
    const L = set.inner;
    kit.rect(L, 0, OFF, BW, BH, { fill: "surface2", flat: true, crisp: true });
    kit.rect(L, 0, OFF, BW, BH, { fill: "accent", flat: true, crisp: true, opacity: 0.05 });
    for (let r = 0; r < NF; r++) {
      const fb = OFF + (r + 1) * FH;
      kit.rect(L, 40, fb - 128, BW - 80, 70, { fill: "field", flat: true, crisp: true, opacity: 0.55 });          // the night in a window band
      for (let x = 40; x <= BW - 40; x += 120) kit.line(L, x, fb - 128, x, fb - 58, { stroke: "line", sw: 3, opacity: 0.45 });
      kit.rect(L, 0, fb - 10, BW, 10, { fill: "line", flat: true, crisp: true });                                 // the slab
    }
    kit.rect(L, -14, OFF, 14, BH, { fill: "line", flat: true, crisp: true });
    kit.rect(L, BW, OFF, 14, BH, { fill: "line", flat: true, crisp: true });
    kit.rect(L, -24, OFF - 18, BW + 48, 18, { fill: "surface", flat: true, crisp: true });                       // the roof
    kit.rect(L, 90, OFF - 46, 96, 28, { fill: "surface2", flat: true, crisp: true });
    kit.rect(L, BW - 230, OFF - 38, 70, 20, { fill: "surface2", flat: true, crisp: true });
    kit.line(L, 250, OFF - 18, 250, OFF - 82, { stroke: "line", sw: 4 });
    const beacon = kit.disc(L, 250, OFF - 84, 7, { fill: "accent", flat: true });                                // a slow beacon
    Loom.drive((e, raw) => beacon.setAttribute("opacity", (0.45 + 0.55 * (0.5 + 0.5 * Math.cos(2 * Math.PI * raw * Math.round((ctx.end - ctx.start) / 2.4)))).toFixed(3)), ctx.start, ctx.end - ctx.start, "linear", { kind: "ambient", beat: ctx.beat.id, name: "beacon" });

    // the security desk (top floor, middle): two figures, twin monitors, one lamp
    const secDesk = (g) => {
      ctx.character("security_pip", "pip", { x: -78, y: -2, scale: 0.135, parent: g, exit: "none" });
      ctx.character("security_tess", "tess", { x: 78, y: -2, scale: 0.135, parent: g, exit: "none", flip: true });
      kit.rect(g, -96, -56, 192, 12, { fill: "surface", flat: true, crisp: true });
      kit.rect(g, -96, -44, 192, 44, { fill: "line", flat: true, crisp: true, opacity: 0.55 });
      kit.rect(g, -28, -112, 56, 44, { fill: "field", shade: "recipe", r: 6 });
      for (let k = 0; k < 3; k++) kit.rect(g, -20, -104 + k * 11, 40 - k * 8, 6, { fill: "accent3", flat: true, crisp: true, opacity: 0.7 });
      kit.line(g, 40, -56, 40, -92, { stroke: "muted", sw: 4 });
      kit.polygon(g, [[30, -106], [52, -106], [48, -92], [34, -92]], { fill: "accent" });
      kit.disc(g, 41, -90, 5, { fill: "accent", shade: "recipe" });
    };
    // @form seeded_desk_array: one desk drawn many times, each with its own seeded person, inbox rows and unread dot
    Loom.array(ctx, "desks", { x: 105, y: OFF + FH, w: BW, h: BH, cols: 5, rows: 5, dx: DX, dy: FH, order: "centre", t: ctx.start + 0.05, stagger: 0.025, rise: 0, parent: L, exit: "none",
      draw: (g, i, r, c, rnd) => {
        if (r === 0 && c === 2) return secDesk(g);
        const side = rnd() < 0.5 ? -1 : 1;
        const top = ["muted", "line", "muted", "accent4"][Math.floor(rnd() * 4)];
        if (rnd() < 0.82) ctx.character(`staff_${r}_${c}`, "extra", { x: 38 * side, y: -2, scale: 0.118, parent: g, exit: "none", flip: side > 0, top });
        kit.rect(g, -76, -50, 152, 10, { fill: "surface", flat: true, crisp: true });
        kit.rect(g, -70, -40, 140, 40, { fill: "surface", flat: true, crisp: true, opacity: 0.92 });
        kit.rect(g, -6, -62, 12, 14, { fill: "line", flat: true, crisp: true });
        kit.rect(g, -32, -108, 64, 48, { fill: "field", flat: true, crisp: true, r: 4 });
        for (let k = 0; k < 3; k++) kit.rect(g, -26, -100 + k * 12, 52 - rnd() * 16, 6, { fill: "accent3", flat: true, crisp: true, opacity: 0.55 });
        if (rnd() < 0.6) kit.disc(g, 26, -102, 4, { fill: "accent", flat: true });
      } });

    // ---- the facade: the lid of the cutaway (a window grid over everything), lifted away in the first words
    const facade = ctx.el("facade", { x: BX - 14, y: BY, w: BW + 28, h: BH, kind: "scenery", exit: "none" });
    kit.rect(facade.inner, 0, 0, BW + 28, BH, { fill: "surface", flat: true, crisp: true });
    const rf = Loom.rng("facade");
    for (let r = 0; r < NF; r++) for (let c = 0; c < 8; c++) {
      if (r === NF - 1 && (c === 3 || c === 4)) continue;
      const lit = rf() < 0.5;
      kit.rect(facade.inner, 28 + c * 118, 26 + r * FH, 82, 78, { fill: lit ? "accent4" : "field2", flat: true, crisp: true, opacity: lit ? 0.5 : 1 });
      kit.line(facade.inner, 28 + c * 118, 26 + r * FH + 78, 110 + c * 118, 26 + r * FH + 78, { stroke: "line", sw: 3 });
    }
    kit.rect(facade.inner, (BW + 28) / 2 - 62, BH - 96, 124, 96, { fill: "field", flat: true, crisp: true });
    kit.rect(facade.inner, (BW + 28) / 2 - 2, BH - 96, 4, 96, { fill: "line", flat: true, crisp: true });
    Loom.hold.lift(ctx, facade, ctx.start + 0.45, { dy: -300, dur: 1.3 });

    // ---- "early warning": the tag over the roof and the security lamp waking
    const tEarly = ctx.cue("early warning");
    Loom.data.tag(ctx, "tag_early_warning", { x: colX(2) - tagW(tags[0]) / 2, y: BY - 28 - tagH(tags[0]) - 4, text: tags[0], color: "accent", t: tEarly });
    const glow = ctx.el("security_glow", { x: LAMP[0] - 150, y: LAMP[1] - 150, w: 300, h: 300, kind: "light" });
    Loom.glow.glowDisc(glow.inner, 150, 150, 30, "accent", { rings: 8, spread: 3.8, opacity: 0.26, core: false });
    Loom.tween(glow.inner, { opacity: 0 }, { opacity: 1, duration: 1.0, ease: Loom.ease.enter }, tEarly + 0.6, meta("security_glow"));
    glow.revealT = tEarly + 0.6;
    Loom.hold.breathe(glow, tEarly + 1.6, ctx.end - 0.4, { amp: 0.05, period: 3.6 });

    // ---- "for everyone else": a calm ring spreads from the lamp, clipped to the building, a wake behind it
    const tr0 = ctx.cue("for everyone else"), V = 175, durR = 5.2;
    const ring = ctx.el("warning_ring", { x: BX, y: BY, w: BW, h: BH, kind: "scenery" });
    const clip = Loom.svg("clipPath", { id: Loom.uid("clip"), clipPathUnits: "userSpaceOnUse" }, Loom.svg("defs", {}, ring.outer));
    Loom.svg("rect", { x: 0, y: 0, width: BW, height: BH }, clip);
    const cg = Loom.svg("g", { "clip-path": `url(#${clip.getAttribute("id")})` }, ring.inner);
    const lx = LAMP[0] - BX, ly = LAMP[1] - BY;
    const wake = Loom.svg("circle", { cx: lx, cy: ly, r: 0, fill: Loom.style.c("accent"), opacity: 0 }, cg);
    const rim = Loom.svg("circle", { cx: lx, cy: ly, r: 0, fill: "none", stroke: Loom.style.c("accent"), "stroke-width": 6, opacity: 0 }, cg);
    const rim2 = Loom.svg("circle", { cx: lx, cy: ly, r: 0, fill: "none", stroke: Loom.style.c("accent"), "stroke-width": 3, opacity: 0 }, cg);
    Loom.drive((e, raw) => {
      const T = raw * (durR + 0.9), R = V * T, out = 1 - Math.max(0, Math.min(1, (T - durR) / 0.9));
      wake.setAttribute("r", R.toFixed(1)); wake.setAttribute("opacity", (T < 0.05 ? 0 : 0.07 * out).toFixed(3));
      rim.setAttribute("r", R.toFixed(1)); rim.setAttribute("opacity", (T < 0.05 ? 0 : 0.85 * (1 - 0.5 * Math.min(1, T / durR)) * out).toFixed(3));
      rim2.setAttribute("r", Math.max(0, R - 38).toFixed(1)); rim2.setAttribute("opacity", (T < 0.05 ? 0 : 0.45 * out).toFixed(3));
    }, tr0, durR + 0.9, "linear", { kind: "draw", beat: ctx.beat.id, name: "warning_ring", content: true });
    ring.revealT = tr0;

    // each inbox the ring reaches gets a small shield tick, on the moment it passes
    // @form arrival_marks: a mark placed on each member of an array at the moment a spreading front reaches it
    const marks = [];
    const ticks = Loom.array(ctx, "shield_ticks", { x: colX(0), y: floorY(0) - 120, w: BW, h: BH, cols: 5, rows: 5, dx: DX, dy: FH,
      draw: (g, i, r, c) => {
        if (r === 0 && c === 2) return;
        const w = Loom.svg("g", {}, g);
        kit.icon(w, "shield-check", { x: 0, y: 0, size: 28, color: "pos" });
        marks.push({ w, d: Math.hypot(colX(c) - LAMP[0], floorY(r) - 120 - LAMP[1]) });
      } });
    m.reveal(ticks, tr0, { dy: 0, dur: 0.1 });
    marks.forEach((k, i) => Loom.tween(k.w, { opacity: 0, scale: 0.3, transformOrigin: "0px 0px" }, { opacity: 1, scale: 1, duration: 0.4, ease: Loom.ease.enter }, tr0 + k.d / V, { kind: "pop", beat: ctx.beat.id, name: "shield_ticks." + i, content: true }));

    // ---- "the more harm it can limit": the tag is set on the ring where it crosses the wall
    const tS = ctx.cue("the more harm");
    const dxw = BX + BW - LAMP[0], Rs = V * (tS - tr0);
    const yR = Math.min(GROUND - 60, LAMP[1] + Math.sqrt(Math.max(0, Rs * Rs - dxw * dxw)));
    const lead = ctx.el("ring_lead", { x: BX + BW - 6, y: yR - 20, w: 90, h: 40, kind: "connector" });
    kit.line(lead.inner, 6, 20, 86, 20, { stroke: "accent", sw: 4 });
    m.draw(lead, tS - 0.1, { dur: 0.5 });
    const node = kit.disc(lead.inner, 6, 20, 9, { fill: "accent", flat: true });
    Loom.tween(node, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: Loom.ease.enter }, tS - 0.15, meta("ring_lead"));
    Loom.data.tag(ctx, "tag_sooner_limit_harm", { x: BX + BW + 84, y: yR - tagH(tags[1]) / 2, text: tags[1], color: "accent", t: tS + 0.25 });

    // ---- "One company": one building, not every building. The roof edge is drawn and the others dim behind it
    const tC = ctx.cue("One company");
    const edge = ctx.el("roof_edge", { x: BX - 24, y: BY - 28, w: BW + 48, h: 10, kind: "connector" });
    kit.line(edge.inner, 0, 5, BW + 48, 5, { stroke: "accent", sw: 6 });
    m.draw(edge, tC - 0.1, { dur: 0.9 });
    Loom.data.tag(ctx, "tag_one_company", { x: BX + BW + 24 - tagW(tags[2]), y: BY - 28 - tagH(tags[2]) - 4, text: tags[2], color: "accent4", t: tC + 0.1 });
    Loom.tween(city.inner, { opacity: 1 }, { opacity: 0.4, duration: 1.4, ease: Loom.ease.editorial }, tC, meta("skyline_blocks"));
  },
});
