// @design place_push_into_screen: a lived-in place at a changing hour, a new item lands on a screen, and the camera pushes in until it can be read there
/* b02 - Jo at the end of a long day, a message lands, the camera pushes into her laptop screen.
 *
 * Treatments considered:
 *  (A) a headshot card of Jo with the message beside it (rejected: a card stands in for the office and the day);
 *  (B) a cut to a full-size inbox (rejected: the push IS entering the message, a cut loses that);
 *  (C) CHOSEN: the open-plan office at dusk, wide. The window light cools from amber to blue (the day ending),
 *      desks empty one by one, the message slides into Jo's laptop screen, then Loom.cam.push carries the camera in
 *      until the subject line and its deadline read on the screen itself. The push is the entry into b03.
 *
 * Shared with b03 (do not change here without changing there):
 *  - the laptop screen is exactly the station rect {x:1180, y:430, w:480, h:270}; st_msg is nested there;
 *  - the message layout (all in screen units, 480 x 270; b03 draws the same x4): title bar 0-22, sender row
 *    (disc at 30,44), subject 64-105, deadline chip 111-151, body line 160-187, two grey bars 198 and 210, the
 *    link bar at 221, a button silhouette at 336-456 x 196-228;
 *  - at the join the camera eases back (cam.pull) as the world camera zooms, so the floor screen and st_msg meet.
 * The office is Loom.place.office("office", side right); desk, chair and window are the place's own.
 */
Loom.scene("b02", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style, svg = Loom.svg, tc = (t) => S.c(t);
    const meta = (kind, name, content) => ({ kind, beat: ctx.beat.id, name, content: !!content });

    // ---- cues: every change rides a spoken phrase
    const tTag = ctx.cue("Jo"), tDay = ctx.cue("at the end of a long day"), tLands = ctx.cue("A message lands");
    const tConfirm = ctx.cue("Confirm your password"), tHour = ctx.cue("within the hour"), tDrive = ctx.cue("or lose access to the shared drive");
    const jt0 = ctx.speechEnd + (ctx.beat.pause_after || 0) + 0.02;     // when the world camera starts the zoom into b03

    // ---- the place: an open-plan office, window on the left wall, the clock at the end of the day
    const P = Loom.place.office(ctx, "office", { side: "right", time: 5.4 });
    P.E.place = P;
    const far = P.layers.far.g, mid = P.layers.mid.g;
    const heroLap = mid.querySelectorAll('g[data-object="laptop"]')[1];
    if (heroLap) heroLap.parentNode.removeChild(heroLap);               // the hero desk gets the big storyline laptop below

    // ---- the day ending: window light and floor light are amber, then cool to blue as the sentence says it (Loom.hold.heat)
    const OV = 700, vp = P.vp, bw = { x0: 400, y0: 150, y1: 700 }, H = 1080;
    const yAt = (x, y) => vp[1] + (y - vp[1]) * ((x - vp[0]) / (bw.x0 - vp[0]));
    const wsx = -OV * 0.1, wex = bw.x0 - 60;
    const wash = svg("rect", { x: -OV, y: -OV, width: 1920 + 2 * OV, height: H + 2 * OV, fill: tc("field"), opacity: 0 }, far);
    const lights = svg("g", {}, far);
    const lq = (pts, op) => svg("path", { d: "M" + pts.map((q) => q.join(" ")).join(" L") + " Z", fill: tc("accent"), opacity: op }, lights);
    lq([[wsx, yAt(wsx, 230)], [wex, yAt(wex, 230)], [wex, yAt(wex, 560)], [wsx, yAt(wsx, 560)]], 0.5);     // the window itself
    lq([[wex, yAt(wex, 560)], [wsx, yAt(wsx, 560)], [wsx + 560, H + 80], [wex + 260, bw.y1 + 40]], 0.2);      // its light on the floor
    lq([[wex + 120, bw.y0 + 120], [wex + 300, bw.y0 + 120], [wex + 420, bw.y1], [wex + 180, bw.y1]], 0.13);   // and on the back wall
    Loom.hold.heat([lights], tDay, { from: "accent", to: "accent3", dur: 4, name: "window_light" });
    Loom.tween(wash, { opacity: 0 }, { opacity: 0.34, duration: 4, ease: Loom.ease.editorial }, tDay, meta("grade", "dusk_wash", true));

    // ---- dust turning in that light (period-locked)
    // @form window_dust: slow motes drifting up through a shaft of window light
    const dust = ctx.el("dust", { x: 40, y: 300, w: 480, h: 560, kind: "scenery", parent: far });
    const motes = Array.from({ length: 16 }, (_, i) => ({ x: 20 + (Loom.hash("d" + i) % 420), y: Loom.hash("e" + i) % 500, ph: i / 16, el: svg("circle", { r: 1.8 + (i % 3) * 0.9, fill: tc("accent4"), opacity: 0 }, dust.inner) }));
    Loom.drive((e, raw) => motes.forEach((o) => { const q = (raw * 4 + o.ph) % 1; o.el.setAttribute("cx", (o.x + 14 * Math.sin(6.283 * (raw * 4 + o.ph))).toFixed(1)); o.el.setAttribute("cy", (o.y - 100 * q).toFixed(1)); o.el.setAttribute("opacity", (0.7 * Math.sin(3.1416 * q)).toFixed(2)); }), ctx.start, ctx.end - ctx.start + 1.4, "linear", meta("ambient", "dust"));

    // ---- a floor of desks behind her: Loom.array, two receding rows (world, not counted); lit screens go dark one by one
    const screens = [];
    const ROWS = [{ y: 742, k: 0.5, xs: [120, 470, 820] }, { y: 832, k: 0.68, xs: [150, 560] }];
    // @form desk_row_array: a row of seeded desks with a lit screen each, receding by scale, as a place's population
    const rows = Loom.array(ctx, "desk_rows", { x: 0, y: 0, cols: 3, rows: 2, dx: 0, dy: 0, parent: mid, seed: "b02:desks", order: "centre", t: ctx.start + 0.1, stagger: 0.07,
      skew: (r, c) => [ROWS[r].xs[c] == null ? -999 : ROWS[r].xs[c], ROWS[r].y],
      draw: (g, i, r, c, rnd) => {
        if (ROWS[r].xs[c] == null) return;
        const k = ROWS[r].k, W = 620 * k, top = -250 * k, wood = S.darken(tc("accent"), 0.42), leg = S.darken(tc("muted"), 0.45);
        svg("ellipse", { cx: 0, cy: 4 * k, rx: W * 0.5, ry: 11 * k, fill: tc("shadow"), opacity: 0.32 }, g);
        svg("rect", { x: -W / 2 + 22 * k, y: top + 26 * k, width: 14 * k, height: 224 * k, fill: leg }, g);
        svg("rect", { x: W / 2 - 36 * k, y: top + 26 * k, width: 14 * k, height: 224 * k, fill: leg }, g);
        svg("rect", { x: 40 * k, y: top - 118 * k, width: 70 * k, height: 130 * k, rx: 22 * k, fill: tc("surface2") }, g);     // a chair back behind the desk
        svg("rect", { x: -W / 2, y: top, width: W, height: 28 * k, rx: 5 * k, fill: wood }, g);
        svg("path", { d: `M${-W / 2} ${top} h${W} l${-46 * k} ${-22 * k} h${-W} Z`, fill: S.lighten(wood, 0.12) }, g);
        const mx = (rnd() - 0.5) * W * 0.3, lit = rnd() < 0.78;
        svg("rect", { x: mx - 8 * k, y: top - 24 * k, width: 16 * k, height: 26 * k, fill: leg }, g);
        svg("rect", { x: mx - 82 * k, y: top - 134 * k, width: 164 * k, height: 112 * k, rx: 8 * k, fill: tc("shadow") }, g);
        const sc = svg("rect", { x: mx - 74 * k, y: top - 126 * k, width: 148 * k, height: 96 * k, rx: 4 * k, fill: tc(i % 2 ? "accent3" : "accent4"), opacity: lit ? 0.85 : 0.1 }, g);
        if (lit) screens.push(sc);
        svg("rect", { x: -W / 2 + 70 * k, y: top - 8 * k, width: 60 * k, height: 10 * k, rx: 3 * k, fill: tc("surface") }, g);   // papers
      } });
    mid.insertBefore(rows.outer, mid.firstChild);
    screens.slice(0, 4).forEach((sc, i) => Loom.tween(sc, { opacity: 0.85 }, { opacity: 0.1, duration: 0.7, ease: Loom.ease.editorial }, tDay + 0.5 + i * 1.3, meta("lights_out", "desk_rows.screen" + i, true)));

    // ---- grey extras, packing up and leaving behind the desks
    const extra = (nm, x, y, s, pose) => { const e = ctx.character(nm, "extra", { x, y, scale: s, pose, parent: mid }); mid.insertBefore(e.E.outer, mid.firstChild); return e; };
    const x1 = extra("extra_a", 470, 744, 0.31, "idle"), x2 = extra("extra_b", 820, 744, 0.31, "think"), x3 = extra("extra_c", 600, 836, 0.42, "idle");
    x1.walk(tDay, tDay + 5.5, 520, 7); x2.pose("wave", tDay + 0.4, { dur: 0.4 }); x2.gesture("wave", tDay + 0.5, tDay + 1.6); x2.walk(tDay + 2.2, tDay + 7, 380, 6);
    x3.walk(tDay + 1, tDay + 6.5, -560, 8);

    // ---- Jo, at the hero desk: front view, lower body hidden by the clip (and the caption band)
    const cid = Loom.uid("jo_clip");
    svg("clipPath", { id: cid }, mid).appendChild(svg("rect", { x: -300, y: -300, width: 2800, height: 1275 }));
    const jg = svg("g", { "clip-path": `url(#${cid})` }, mid);
    const jo = ctx.character("jo", "ava", { x: 1032, y: 1147, scale: 0.7, skin: 1, top: "accent3", bottom: "muted", pose: "idle", emotion: "focused", parent: jg });
    jo.look(1, 0.25, tDay);
    jo.gesture("beat", tLands + 0.2, tLands + 1.0);                      // a small stir as the message arrives; her face stays calm
    jo.gesture("nod", tConfirm + 0.4, tConfirm + 1.4);
    // @form name_tag_on_figure: a solid tag that wipes in beside a person the narration names, then wipes out before the camera moves
    const tagJo = Loom.data.tag(ctx, "tag_jo", { x: 930, y: 596, text: "Jo", color: "accent", textColor: "onAccent", t: tTag });
    m.exit(tagJo, tConfirm - 0.35, "wipe");

    // ---- the laptop: the screen sits EXACTLY on the station rect (1180, 430, 480 x 270); b03's st_msg lives there
    const SX = 1180, SY = 430, SW = 480, SH = 270, PADX = 24, PADT = 16;
    const glow = ctx.el("screen_glow", { x: SX - 150, y: SY - 100, w: SW + 300, h: SH + 260, kind: "scenery", parent: mid });
    Loom.glow.glowDisc(glow.inner, 150 + SW / 2, 100 + SH / 2 + 20, 250, "accent3", { rings: 6, spread: 1.9, opacity: 0.14, core: false });
    Loom.tween(glow.inner, { opacity: 0.25 }, { opacity: 1, duration: 3, ease: Loom.ease.editorial }, tDay, meta("grade", "screen_glow", true));
    // @form laptop_screen_portal: a laptop whose screen is an exact rect, so a nested station can be entered through it
    const lap = ctx.el("laptop", { x: SX - PADX, y: SY - PADT, w: SW + 2 * PADX, h: SH + PADT + 62, kind: "instrument", parent: mid });
    kit.rect(lap.inner, 0, 0, SW + 2 * PADX, SH + 2 * PADT, { fill: "shadow", r: 14, shade: "recipe" });
    svg("path", { d: `M-14 ${SH + 2 * PADT} H${SW + 2 * PADX + 14} L${SW + 2 * PADX - 10} ${SH + 2 * PADT + 34} H10 Z`, fill: tc("surface") }, lap.inner);
    svg("rect", { x: SW / 2 + PADX - 70, y: SH + 2 * PADT, width: 140, height: 8, rx: 4, fill: S.darken(tc("surface"), 0.35) }, lap.inner);
    svg("ellipse", { cx: SW / 2 + PADX, cy: SH + 2 * PADT + 38, rx: SW * 0.5, ry: 8, fill: tc("shadow"), opacity: 0.35 }, lap.inner);
    svg("rect", { x: PADX, y: PADT, width: SW, height: SH, fill: tc("field2") }, lap.inner);
    const scrId = Loom.uid("scr_clip");
    svg("clipPath", { id: scrId }, lap.inner).appendChild(svg("rect", { x: PADX, y: PADT, width: SW, height: SH }));
    const scr = svg("g", { "clip-path": `url(#${scrId})`, transform: `translate(${PADX} ${PADT})` }, lap.inner);
    // what she was working on: a quiet document and a bar chart, dim
    svg("rect", { x: 40, y: 34, width: 400, height: 206, rx: 6, fill: tc("surface2") }, scr);
    [0.8, 0.62, 0.72, 0.5].forEach((f, i) => svg("rect", { x: 60, y: 52 + i * 16, width: 330 * f, height: 6, rx: 3, fill: tc("muted"), opacity: 0.4 }, scr));
    [0.5, 0.75, 0.6, 0.9, 0.7].forEach((v, i) => svg("rect", { x: 64 + i * 34, y: 232 - 100 * v, width: 20, height: 100 * v, rx: 3, fill: tc("accent4"), opacity: 0.4 }, scr));

    // ---- the message: it slides into the screen (clipped by it) with a soft ping, laid out as b03 will draw it x4
    const msg = ctx.el("screen_message", { x: 0, y: 0, w: SW, h: SH, kind: "card", parent: scr });
    svg("rect", { x: 0, y: 0, width: SW, height: SH, fill: tc("surface") }, msg.inner);
    svg("rect", { x: 0, y: 0, width: SW, height: 22, fill: tc("surface2") }, msg.inner);
    ["neg", "accent4", "pos"].forEach((tk, i) => svg("circle", { cx: 14 + i * 14, cy: 11, r: 3.5, fill: tc(tk), opacity: 0.85 }, msg.inner));
    svg("circle", { cx: 30, cy: 44, r: 11, fill: tc("line") }, msg.inner);
    svg("rect", { x: 50, y: 37, width: 96, height: 6, rx: 3, fill: tc("muted"), opacity: 0.8 }, msg.inner);
    svg("rect", { x: 50, y: 49, width: 150, height: 5, rx: 2.5, fill: tc("line"), opacity: 0.8 }, msg.inner);
    svg("circle", { cx: 456, cy: 44, r: 5, fill: tc("accent") }, msg.inner);
    [[198, 280], [210, 190]].forEach(([y, w]) => svg("rect", { x: 24, y, width: w, height: 6, rx: 3, fill: tc("line"), opacity: 0.7 }, msg.inner));
    svg("rect", { x: 24, y: 221, width: 120, height: 5, rx: 2.5, fill: tc("accent3") }, msg.inner);
    svg("rect", { x: 336, y: 196, width: 120, height: 32, rx: 8, fill: tc("line"), opacity: 0.55 }, msg.inner);
    m.converge(msg, tLands, { from: "right", dist: 300, dur: 0.7, content: true });
    Loom.sfx("pop", tLands);

    // the three lines print on their words (subject, then the deadline, then the body), each in its own element
    const subjF = kit.fit("Confirm your password", { role: "label", w: 432, maxLines: 1, weight: 700 });
    const subj = ctx.el("subject_line", { x: 24, y: 64, w: 432, h: Math.ceil(subjF.height) + 2, kind: "text", parent: msg.inner });
    kit.text(subj.inner, "Confirm your password", { role: "label", x: 0, y: 0, w: 432, h: Math.ceil(subjF.height) + 2, maxLines: 1, weight: 700 });
    m.unmask(subj, tConfirm, { dur: 0.9, content: true });
    const hrF = kit.fit("within the hour", { role: "caption", w: 360, maxLines: 1, weight: 700 }), inset = Math.max(8, Math.ceil(0.25 * hrF.size));
    const chipW = Math.ceil(hrF.width) + 2 * inset + 30, chipH = Math.ceil(hrF.height) + 2 * inset;
    const chip = ctx.el("deadline_chip", { x: 24, y: 111, w: chipW, h: chipH, kind: "card", parent: msg.inner });
    kit.rect(chip.inner, 0, 0, chipW, chipH, { fill: "accent", r: 8, flat: true });
    kit.icon(chip.inner, "clock", { x: inset + 10, y: chipH / 2, size: 20, color: "onAccent" });
    kit.text(chip.inner, "within the hour", { role: "caption", x: inset + 28, y: inset, w: chipW - 2 * inset - 28, h: chipH - 2 * inset, maxLines: 1, weight: 700, color: "onAccent", valign: "middle" });
    m.unmask(chip, tHour, { dur: 0.6, content: true });
    const bdF = kit.fit("or lose access to the shared drive", { role: "caption", w: 432, maxLines: 1 });
    const body = ctx.el("body_line", { x: 24, y: 160, w: 432, h: Math.ceil(bdF.height) + 2, kind: "text", parent: msg.inner });
    kit.text(body.inner, "or lose access to the shared drive", { role: "caption", x: 0, y: 0, w: 432, h: Math.ceil(bdF.height) + 2, maxLines: 1 });
    m.unmask(body, tDrive, { dur: 1.0, content: true });

    // ---- the one camera move: a parallax push from the wide room into the screen, then it eases back as b03's zoom takes over
    Loom.cam.push(P, { to: [SX + SW / 2, SY + SH / 2], scale: 2.2, t0: tConfirm, t1: tConfirm + 2.5 });
    Loom.cam.pull(P, { t0: jt0, t1: jt0 + 0.9 });
  },
});
