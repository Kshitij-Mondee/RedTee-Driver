// @design held_place_forgetting: one place seen again from a new angle while a single object fades, so forgetting is drawn as change over time
/* b10 - days late, in a corridor. The office from the walkway: the report from behind at the end of the hero desk,
 * the calendar on the back wall with its gone days crossed, the update on their screen. The camera pushes toward the
 * screen while the narration asks how much they remember, and the update's bars fade to the field colour.
 * Treatments considered: (A) a card that says "forgotten" (rejected: words standing in for a picture), (B) a gauge
 * draining (rejected: the update itself is the thing that is forgotten), (C) CHOSEN: hold the place, push in, let the
 * document on the screen go faint (hold and transform), then the report's shoulders brace.
 */
Loom.scene("b10", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style, O = Loom.obj, svg = Loom.svg, D = Loom.data;
    const bid = ctx.beat.id;
    const meta = (kind, name) => ({ kind, beat: bid, name, content: true });

    // ---- the place: the same office as b04, seen from the aisle on the other side (mirrored furniture, a new angle)
    const R = Loom.place.office(ctx, "walkway", { side: "left", screenFamily: "laptop", screen: "text" });
    const far = R.layers.far.g, mid = R.layers.mid.g;
    const A = R.anchors;

    // a carpet runner down the aisle, in the room's perspective (lines through the vanishing point), with chevrons
    const vp = R.vp, fyb = 700, fyt = 1080, k = (fyt - vp[1]) / (fyb - vp[1]);
    const runner = ctx.el("aisle_runner", { x: 0, y: 0, w: 1, h: 1, kind: "scenery", parent: far });
    const edge = (x) => vp[0] + (x - vp[0]) * k;
    svg("path", { d: `M1300 ${fyb} L1400 ${fyb} L${edge(1400)} ${fyt} L${edge(1300)} ${fyt} Z`, fill: S.mix(S.c("field2"), S.c("surface"), 0.5), opacity: 0.9 }, runner.inner);
    [1300, 1400].forEach((x) => svg("line", { x1: x, y1: fyb, x2: edge(x), y2: fyt, stroke: S.c("line"), "stroke-width": 3, opacity: 0.55 }, runner.inner));
    for (let i = 0; i < 4; i++) {   // chevrons walking toward us, larger as they come
      const q = 0.18 + i * 0.22, y = fyb + (fyt - fyb) * q, w = 100 * (1 + (k - 1) * q), cx = vp[0] + (1350 - vp[0]) * (1 + (k - 1) * q);
      svg("path", { d: `M${cx - w * 0.3} ${y - 14} L${cx} ${y + 6} L${cx + w * 0.3} ${y - 14}`, fill: "none", stroke: S.c("line"), "stroke-width": 3 + i, "stroke-linecap": "round", "stroke-linejoin": "round", opacity: 0.45 }, runner.inner);
    }

    // ---- the calendar on the back wall: a wall calendar with three gone days crossed (no digits)
    const calC = [A.calendar[0], A.calendar[1] + 6], cs = 190;
    // @form wall_calendar_crossed: a wall calendar whose gone days are struck through one by one
    const cal = ctx.el("calendar", { x: calC[0] - 110, y: calC[1] - 110, w: 220, h: 220, kind: "object", parent: far });
    O.shape(cal.inner, "calendar", 110, 110, cs, { family: "wall", key: "cal_b10", detail: 3, shadow: false });
    const cw = (0.8 * 0.86 * cs) / 7, gx = 110 - 0.43 * cs + 0.086 * cs, gy = 110 - 0.45 * cs + 0.04 * cs + 0.2 * 0.9 * cs + 0.1 * cs;
    [8, 9, 10].forEach((cell, i) => {
      const px = gx + (cell % 7) * cw + cw / 2, py = gy + Math.floor(cell / 7) * cw * 0.95 + cw / 2, d = cw * 0.32;
      const x = svg("path", { d: `M${px - d} ${py - d} L${px + d} ${py + d} M${px + d} ${py - d} L${px - d} ${py + d}`, fill: "none", stroke: S.c("neg"), "stroke-width": 3.4, "stroke-linecap": "round" }, cal.inner);
      m.draw(x, ctx.start + 0.5 + i * 0.35, { dur: 0.35 });
    });

    // ---- the report, from behind, seated in the chair at the end of the hero desk, turned a little toward the screen
    const cx = 815, sy = 770, seat = 930, jacket = S.mix(S.c("line"), S.c("surface2"), 0.55), jdk = S.darken(jacket, 0.1);
    const skin = S.mix(S.pack.characters.skin[1], S.c("surface2"), 0.4);
    // @form figure_from_behind: a seated colleague drawn from behind in muted tones, no face, so the viewer reads the posture
    const rep = ctx.el("report", { x: cx - 110, y: 640, w: 220, h: 310, kind: "character", parent: mid });
    const body = svg("g", { transform: `translate(${-(cx - 110)} ${-640})` }, rep.inner);
    const sh = svg("g", {}, body), hd = svg("g", {}, body);
    svg("rect", { x: cx - 94, y: sy + 8, width: 26, height: 120, rx: 13, fill: jdk }, sh);
    svg("rect", { x: cx + 68, y: sy + 8, width: 26, height: 120, rx: 13, fill: jdk }, sh);
    svg("path", { d: `M${cx - 74} ${sy + 30} Q${cx - 78} ${sy + 2} ${cx - 40} ${sy - 4} L${cx + 40} ${sy - 4} Q${cx + 78} ${sy + 2} ${cx + 74} ${sy + 30} L${cx + 66} ${seat} L${cx - 66} ${seat} Z`, fill: jacket }, sh);
    svg("line", { x1: cx, y1: sy + 10, x2: cx, y2: seat, stroke: S.c("line"), "stroke-width": 2.5, opacity: 0.5 }, sh);
    svg("path", { d: `M${cx - 50} ${sy + 34} Q${cx - 30} ${sy + 52} ${cx - 8} ${sy + 46} M${cx + 50} ${sy + 34} Q${cx + 30} ${sy + 52} ${cx + 8} ${sy + 46}`, fill: "none", stroke: S.c("line"), "stroke-width": 2.5, opacity: 0.35, "stroke-linecap": "round" }, sh);
    svg("rect", { x: cx - 15, y: sy - 24, width: 30, height: 30, rx: 8, fill: skin }, sh);
    svg("path", { d: `M${cx - 30} ${sy - 4} Q${cx} ${sy + 12} ${cx + 30} ${sy - 4} L${cx + 22} ${sy - 12} L${cx - 22} ${sy - 12} Z`, fill: jdk }, sh);
    svg("ellipse", { cx: cx - 7, cy: sy - 66, rx: 36, ry: 40, fill: skin }, hd);
    svg("path", { d: `M${cx - 44} ${sy - 62} C${cx - 48} ${sy - 112} ${cx + 32} ${sy - 112} ${cx + 30} ${sy - 62} C${cx + 28} ${sy - 40} ${cx + 12} ${sy - 28} ${cx - 7} ${sy - 30} C${cx - 26} ${sy - 28} ${cx - 42} ${sy - 40} ${cx - 44} ${sy - 62} Z`, fill: S.c("muted") }, hd);
    svg("ellipse", { cx: cx - 41, cy: sy - 58, rx: 6, ry: 11, fill: skin }, hd);
    svg("path", { d: `M${cx - 26} ${sy - 96} Q${cx - 4} ${sy - 106} ${cx + 18} ${sy - 94}`, fill: "none", stroke: S.lighten(S.c("muted"), 0.3), "stroke-width": 3, opacity: 0.5, "stroke-linecap": "round" }, hd);
    // breathing: a slow period-locked lift of the shoulders; the braced posture is a separate drive on the same groups
    const brace = (e) => { sh.setAttribute("transform", `translate(0 ${(-7 * e).toFixed(2)})`); hd.setAttribute("transform", `translate(${(-2 * e).toFixed(2)} ${(1 * e).toFixed(2)})`); };
    Loom.drive((e, p) => { const dur = ctx.end + 1 - ctx.start; body.setAttribute("transform", `translate(${-(cx - 110)} ${-640 + 1.6 * Math.sin((2 * Math.PI * p * dur) / 4.2)})`); }, ctx.start, ctx.end + 1 - ctx.start, "linear", meta("ambient", "report.breath"));

    // ---- the update on their screen (the same document as b04): a page with a title and grey text bars, in ink
    const ls = 190, lcx = A.screen[0], lcy = A.screen[1] + 36;
    const scr = { x: lcx - 0.45 * ls + 0.035 * ls, y: lcy - 0.4 * ls + 0.035 * ls, w: 0.9 * ls - 0.07 * ls, h: 0.56 * ls - 0.07 * ls };
    // @form document_on_screen: a page of ink bars on a screen that can be recoloured to fade it
    const upd = ctx.el("update", { x: scr.x, y: scr.y, w: scr.w, h: scr.h, kind: "document", parent: mid });
    kit.rect(upd.inner, 0, 0, scr.w, scr.h, { fill: "surface", r: 2, shadow: false, flat: true });
    kit.rect(upd.inner, 8, 8, scr.w * 0.46, 9, { fill: "accent", r: 2, shadow: false, flat: true });
    [0.92, 0.8, 0.86, 0.62, 0.8, 0.7].forEach((f, i) => kit.rect(upd.inner, 8, 26 + i * 11.5, (scr.w - 16) * f, 6, { fill: "ink", r: 2, shadow: false, flat: true }));
    svg("rect", { x: scr.w - 46, y: 8, width: 38, height: 9, rx: 2, fill: S.c("accent4") }, upd.inner);

    // ---- ambient life: window light with dust, a colleague passing along the back of the aisle
    const rng = Loom.rng("b10:motes"), motes = [];
    for (let i = 0; i < 14; i++) motes.push({ c: svg("circle", { r: 1.6 + rng() * 2.2, fill: S.c("surface"), opacity: 0.55 }, far), x: 1150 + rng() * 520, y: 330 + rng() * 420, ph: rng(), per: 5 + rng() * 4 });
    Loom.drive((e, p) => { const t = p * (ctx.end + 1 - ctx.start); motes.forEach((o) => { const a = 2 * Math.PI * (t / o.per + o.ph); o.c.setAttribute("cx", (o.x + 16 * Math.sin(a)).toFixed(1)); o.c.setAttribute("cy", (o.y - 10 * Math.cos(a * 0.7)).toFixed(1)); }); }, ctx.start, ctx.end + 1 - ctx.start, "linear", meta("ambient", "motes"));
    const pass = svg("g", { opacity: 0.8 }, far), legs = [svg("rect", { x: -6, y: 0, width: 12, height: 62, rx: 6, fill: S.c("muted") }, pass), svg("rect", { x: -6, y: 0, width: 12, height: 62, rx: 6, fill: S.darken(S.c("muted"), 0.15) }, pass)];
    svg("rect", { x: -18, y: -76, width: 36, height: 80, rx: 14, fill: S.c("line") }, pass);
    svg("circle", { cx: 0, cy: -96, r: 15, fill: S.c("muted") }, pass);
    Loom.drive((e, p) => {
      const t = p * (ctx.end + 1 - ctx.start), x = 1790 - 520 * p, ph = t * 5.2;
      pass.setAttribute("transform", `translate(${x.toFixed(1)} ${(614 - Math.abs(Math.sin(ph)) * 3).toFixed(1)}) scale(1.3)`);
      legs[0].setAttribute("transform", `translate(0 4) rotate(${(22 * Math.sin(ph)).toFixed(1)})`);
      legs[1].setAttribute("transform", `translate(0 4) rotate(${(-22 * Math.sin(ph)).toFixed(1)})`);
    }, ctx.start, ctx.end + 1 - ctx.start, "linear", meta("ambient", "colleague.passing"));

    // ---- tags that name what is drawn, wiped on at the words; they ride the far layer so the push keeps them in place
    const tLate = D.tag(ctx, "tag_late", { x: calC[0] - 86, y: calC[1] + 100, text: "Days late", color: "accent2", t: ctx.cue("days late") });
    const tCor = D.tag(ctx, "tag_corridor", { x: 1420, y: 900, text: "Corridor", color: "muted", t: ctx.cue("in a corridor") });
    far.appendChild(tLate.outer); far.appendChild(tCor.outer);

    // ---- the push toward the report's screen while the question is asked; then the update goes faint
    const tAsk = ctx.cue("How much of the update");
    Loom.cam.push(R, { to: [700, 800], scale: 1.5, t0: tAsk, t1: tAsk + 3.0 });
    const tNot = ctx.cue("Not much");
    Loom.hold.heat([upd], tNot, { from: "ink", to: "field2", attr: "fill", dur: 2.6, name: "update.fades" });

    // ---- "it got defended": the shoulders rise slightly and the head sinks toward them, braced
    Loom.drive((e) => brace(e), ctx.cue("it got defended"), 0.9, "editorial", meta("posture", "report.braced"));
  },
});
