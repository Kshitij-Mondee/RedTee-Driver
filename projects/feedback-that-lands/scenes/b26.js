// @design consequence_as_props_on_table: a consequence told as plain objects arriving on a shared table (a reply lands, a calendar loses a day), with a checklist ticking in the corner
/* b26 - the impact, as plain facts. This opens the station st_room_b: a fresh copy of the meeting room that b19 to b21
 * drew (same call, same options, same furniture, Maya at the same x, the report and the update in the same places),
 * present at once because the viewer has been here before. The camera is back up in the whole room.
 * It builds everything b27 and b28 reuse, and leaves their handles on the elements:
 *   room.__R (the place and its camera), maya.actor (the character), report.parts / report.lean (posture), card.rows.
 * The place, Maya, the report's breath and the motes run to the end of b28 (read from the manifest), so the later beats
 * can act on them after this beat has ended.
 * Treatments considered: (A) a split card of "reply" and "a day lost" (rejected: words standing in for things),
 * (B) a timeline strip (rejected: this lesson's time is told by props), (C) CHOSEN: the same table, a reply arrives on
 * it, a desk calendar loses a page, and the card in the corner ticks Impact.
 */
Loom.scene("b26", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style, T = Loom.treat, O = Loom.obj, D = Loom.data, C = Loom.cam, svg = Loom.svg;
    const bid = ctx.beat.id, f = (v) => Math.round(v * 10) / 10;
    const meta = (kind, name) => ({ kind, beat: bid, name, content: true });
    const tImpact = ctx.cue("the impact");
    const tReply = ctx.cue("client wrote back");
    const tAsk = ctx.cue("asking when the change starts");
    const tDay = ctx.cue("another day");
    // the three room beats are one continuous shot: the actors' clocks run to the end of the last of them
    const span = ((Loom.manifest && Loom.manifest.beats) || []).filter((b) => ["b26", "b27", "b28"].includes(b.id));
    const endAll = span.length ? span[span.length - 1].end : ctx.end + 20;
    const lenAll = endAll + 1 - ctx.start;
    const rigCtx = Object.assign({}, ctx, { end: endAll });

    // ---- the room (name "room", the same options as every room station)
    const R = Loom.place.meeting(rigCtx, "room", {});
    const far = R.layers.far.g, mid = R.layers.mid.g, near = R.layers.near.g;
    const tt = R.floorY + 110, tb = R.floorY + 300;
    R.E.__R = R;
    // the wall carries more than the screen: a low cabinet under the window with a plant and a mug, window light on the floor
    svg("path", { d: "M140 440 L480 440 L760 1000 L220 1000 Z", fill: S.c("surface"), opacity: 0.2 }, far);
    svg("rect", { x: 110, y: 560, width: 390, height: 112, rx: 4, fill: S.darken(S.c("surface2"), 0.14) }, far);
    svg("rect", { x: 104, y: 548, width: 402, height: 16, rx: 4, fill: S.lighten(S.c("surface2"), 0.2) }, far);
    [0, 1].forEach((i) => { svg("rect", { x: 122 + i * 190, y: 576, width: 176, height: 84, rx: 3, fill: "none", stroke: S.c("line"), "stroke-width": 2.5, opacity: 0.6 }, far); svg("rect", { x: 190 + i * 190, y: 612, width: 40, height: 6, rx: 3, fill: S.c("line") }, far); });
    for (let i = 0; i < 6; i++) svg("ellipse", { cx: 400 + (i - 2.5) * 16, cy: 518 - (i % 2) * 14, rx: 10, ry: 30, fill: S.c(i % 2 ? "pos" : "accent4"), transform: `rotate(${(i - 2.5) * 12} ${400 + (i - 2.5) * 16} 546)` }, far);
    svg("path", { d: "M384 546 H420 L416 568 H388 Z", fill: S.c("accent2") }, far);
    svg("rect", { x: 160, y: 520, width: 22, height: 28, rx: 4, fill: S.c("surface") }, far);
    // the wall clock, where b20 left it: the same afternoon, two hours on
    O.shape(far, "clock", 1380, 250, 150, { family: "wall", detail: 3, state: { time: 16.17 }, key: "clock_room", shadow: false });

    // ---- Maya: across the table, standing behind its edge; the table drawn again over her lower body hides her legs
    const maya = Loom.rig.place(rigCtx, "maya", "maya", { x: 900, y: 1215, scale: 0.5, pose: "neutral", emotion: "focus", parent: mid });
    maya.E.actor = maya;
    maya.gesture("tilt", tAsk, tAsk + 1.3);
    T.body(mid, `M600 ${tt} H1320 L1560 ${tb} H360 Z`, "surface", { x: 360, y: tt, w: 1200, h: tb - tt }, { shadow: false });
    svg("rect", { x: 372, y: tb, width: 1176, height: 260, fill: S.darken(S.c("surface"), 0.24) }, mid);   // the table's solid front
    svg("rect", { x: 372, y: tb, width: 1176, height: 14, fill: S.darken(S.c("surface"), 0.34), opacity: 0.6 }, mid);
    svg("path", { d: `M600 ${tt} H1320`, stroke: S.darken(S.c("surface"), 0.12), "stroke-width": 2, fill: "none" }, mid);

    // ---- the update: the one sheet lying on the table, seen in perspective (as in b19)
    // @form sheet_on_table: a single document drawn in perspective on a tabletop, ink bars on paper
    const upd = ctx.el("update", { x: 840, y: 806, w: 240, h: 112, kind: "document", parent: mid });
    const xl = (v) => 46 - 30 * v, xr = (v) => 194 + 30 * v, px = (u, v) => xl(v) + (xr(v) - xl(v)) * u, py = (v) => 4 + v * 100;
    const quad = (u0, u1, v0, v1) => [[px(u0, v0), py(v0)], [px(u1, v0), py(v0)], [px(u1, v1), py(v1)], [px(u0, v1), py(v1)]];
    kit.polygon(upd.inner, [[xl(0) + 6, py(0) + 8], [xr(0) + 6, py(0) + 8], [xr(1) + 6, py(1) + 8], [xl(1) + 6, py(1) + 8]], { fill: "shadow", opacity: 0.1 });
    kit.polygon(upd.inner, quad(0, 1, 0, 1), { fill: "surface", stroke: "line", sw: 2 });
    kit.polygon(upd.inner, quad(0.08, 0.5, 0.08, 0.2), { fill: "accent" });
    [[0.3, 0.9], [0.38, 0.8], [0.46, 0.86], [0.54, 0.6], [0.62, 0.8], [0.7, 0.72], [0.78, 0.5]].forEach(([v, w]) => kit.polygon(upd.inner, quad(0.08, 0.08 + 0.62 * w, v, v + 0.05), { fill: "ink" }));
    kit.polygon(upd.inner, quad(0.74, 0.92, 0.3, 0.62), { fill: "accent4" });

    // ---- the desk calendar: the top page is torn off on "another day", the next page is under it
    const CS = 124, g0 = CS * 0.9;   // the object's centre in its own element (size / 2 + 0.4 x size of padding)
    const cal = O.draw(ctx, "daytile", "calendar", { x: 640, y: 858, size: CS, family: "desk", tone: "muted", detail: 2, key: "cal_desk_room", parent: mid });
    const cw = CS * 0.9, ch = CS * 0.7, cpx = g0 - cw / 2 + 6, cpy = g0 - ch / 2 + ch * 0.34, cpw = cw - 12, cph = ch * 0.62 - 6;
    const LD = T.lightDark(), paper = S.mix(LD.light, LD.dark, 0.03);
    const pageUnder = svg("g", {}, cal.inner), pageTop = svg("g", {}, cal.inner);
    const drawPage = (g, day) => {
      svg("rect", { x: cpx, y: cpy, width: cpw, height: cph, rx: 4, fill: paper }, g);
      svg("line", { x1: cpx, y1: cpy + cph, x2: cpx + cpw, y2: cpy + cph, stroke: S.c("line"), "stroke-width": 2, opacity: 0.5 }, g);
      for (let i = 0; i < 5; i++) {
        const cwid = (cpw - 22) / 5, cx0 = cpx + 8 + i * (cwid + 1.5);
        svg("rect", { x: f(cx0), y: f(cpy + cph * 0.3), width: f(cwid - 3), height: f(cph * 0.4), rx: 3, fill: i === day ? S.c("accent2") : S.mix(LD.light, LD.dark, 0.16) }, g);
      }
    };
    drawPage(pageUnder, 3); drawPage(pageTop, 2);
    // @form torn_off_page: the top page of a desk calendar tears away and falls, showing the next day under it
    Loom.tween(pageTop, { x: 0, y: 0, rotation: 0, opacity: 1, transformOrigin: "0% 0%" }, { x: 40, y: 46, rotation: 16, opacity: 0, duration: 0.8, ease: Loom.ease.exit }, tDay + 0.1, meta("tear", "daytile"));

    // ---- the client's reply: an open envelope that drops onto the table beside the update; the question mark settles on the letter
    const reply = O.draw(ctx, "reply", "envelope", { x: 1180, y: 850, size: 150, family: "flap", tone: "accent2", state: { open: true }, detail: 2, parent: mid });
    m.drop(reply, tReply + 0.1, { dur: 0.55, content: true });
    const rq = ctx.el("reply_q", { x: 1180 - 40, y: 774, w: 80, h: 80, kind: "icon", parent: mid });
    // @form unknown_ring: a bold question mark with a paper halo marking something not yet known
    const qd = "M-12 -12 C-12 -30 14 -30 14 -12 C14 0 0 0 0 11";
    svg("path", { d: qd, transform: "translate(40 34)", fill: "none", stroke: paper, "stroke-width": 15, "stroke-linecap": "round", "stroke-linejoin": "round" }, rq.inner);
    svg("path", { d: qd, transform: "translate(40 34)", fill: "none", stroke: S.c("accent"), "stroke-width": 7, "stroke-linecap": "round", "stroke-linejoin": "round" }, rq.inner);
    svg("circle", { cx: 40, cy: 53, r: 5, fill: S.c("accent") }, rq.inner);
    m.settle(rq, tAsk + 0.2, { dy: -18, content: true });

    // tags ride in the same layer as the things they name, so the camera push never separates them
    const inLayer = (g) => Object.assign({}, ctx, { el: (n, o) => ctx.el(n, Object.assign({ parent: g }, o)) });
    const tagW = (s) => kit.fit(s, { role: "label", w: 900, maxLines: 1, weight: 800, tracking: 1 }).width * 1.06 + 24;
    D.tag(inLayer(mid), "tag_reply", { text: "Client wrote back", x: 1180 - tagW("Client wrote back") / 2, y: 708, pad: 12, t: tReply + 0.55, color: "accent2" });
    D.tag(inLayer(mid), "tag_day", { text: "Another day", x: 640 - tagW("Another day") / 2, y: 760, pad: 12, t: tDay + 0.35, color: "muted" });

    // ---- the report, from behind, in the near layer at the bottom right: over the shoulder, cropped by the frame (as in b19)
    const rx = 1610, sy = 880, s = 1.1, jacket = S.mix(S.c("line"), S.c("surface2"), 0.55), jdk = S.darken(jacket, 0.1);
    const skin = S.mix(S.pack.characters.skin[1], S.c("surface2"), 0.4);
    const ox = rx - 100 * s, oy = sy - 115 * s;
    const rep = ctx.el("report", { x: ox, y: oy, w: 200 * s, h: 280 * s, kind: "character", parent: near });
    const body = svg("g", {}, rep.inner), lean = svg("g", {}, body);
    const fig = svg("g", { transform: `translate(${-ox} ${-oy}) translate(${rx} ${sy}) scale(${s}) translate(${-rx} ${-sy})` }, lean);
    const sh = svg("g", {}, fig), hd = svg("g", {}, fig);
    const seat = sy + 160;
    // @form seated_back_figure: a seated person seen from behind as a head, neck and jacket in muted tokens, no face
    svg("rect", { x: rx - 94, y: sy + 8, width: 26, height: 120, rx: 13, fill: jdk }, sh);
    svg("rect", { x: rx + 68, y: sy + 8, width: 26, height: 120, rx: 13, fill: jdk }, sh);
    svg("path", { d: `M${rx - 74} ${sy + 30} Q${rx - 78} ${sy + 2} ${rx - 40} ${sy - 4} L${rx + 40} ${sy - 4} Q${rx + 78} ${sy + 2} ${rx + 74} ${sy + 30} L${rx + 66} ${seat} L${rx - 66} ${seat} Z`, fill: jacket }, sh);
    svg("line", { x1: rx, y1: sy + 10, x2: rx, y2: seat, stroke: S.c("line"), "stroke-width": 2.5, opacity: 0.5 }, sh);
    svg("path", { d: `M${rx - 50} ${sy + 34} Q${rx - 30} ${sy + 52} ${rx - 8} ${sy + 46} M${rx + 50} ${sy + 34} Q${rx + 30} ${sy + 52} ${rx + 8} ${sy + 46}`, fill: "none", stroke: S.c("line"), "stroke-width": 2.5, opacity: 0.35, "stroke-linecap": "round" }, sh);
    svg("rect", { x: rx - 15, y: sy - 24, width: 30, height: 30, rx: 8, fill: skin }, sh);
    svg("path", { d: `M${rx - 30} ${sy - 4} Q${rx} ${sy + 12} ${rx + 30} ${sy - 4} L${rx + 22} ${sy - 12} L${rx - 22} ${sy - 12} Z`, fill: jdk }, sh);
    svg("ellipse", { cx: rx - 7, cy: sy - 66, rx: 36, ry: 40, fill: skin }, hd);
    svg("path", { d: `M${rx - 44} ${sy - 62} C${rx - 48} ${sy - 112} ${rx + 32} ${sy - 112} ${rx + 30} ${sy - 62} C${rx + 28} ${sy - 40} ${rx + 12} ${sy - 28} ${rx - 7} ${sy - 30} C${rx - 26} ${sy - 28} ${rx - 42} ${sy - 40} ${rx - 44} ${sy - 62} Z`, fill: S.c("muted") }, hd);
    svg("ellipse", { cx: rx - 41, cy: sy - 58, rx: 6, ry: 11, fill: skin }, hd);
    svg("path", { d: `M${rx - 26} ${sy - 96} Q${rx - 4} ${sy - 106} ${rx + 18} ${sy - 94}`, fill: "none", stroke: S.lighten(S.c("muted"), 0.3), "stroke-width": 3, opacity: 0.5, "stroke-linecap": "round" }, hd);
    // posture u: 0 = the report as b19 drew it (a little braced), 0.25 = where b21 left it (shoulders down 5, head up 3), 1 = leaning in
    const piv = [rx - ox, sy + 176 - oy];
    rep.post = (u) => {
      sh.setAttribute("transform", `translate(0 ${f(20 * u)})`);
      hd.setAttribute("transform", `translate(${f(8 * u)} ${f(-12 * u)})`);
      lean.setAttribute("transform", `translate(${f(-14 * Math.max(0, u - 0.25))} ${f(-8 * Math.max(0, u - 0.25))}) rotate(${f(-5 * Math.max(0, u - 0.25))} ${f(piv[0])} ${f(piv[1])})`);
    };
    rep.post(0.25);
    Loom.drive((e, p) => body.setAttribute("transform", `translate(0 ${(1.8 * Math.sin((2 * Math.PI * p * lenAll) / 4.2)).toFixed(2)})`), ctx.start, lenAll, "linear", meta("ambient", "report.breath"));

    // ---- the four-move card, top right: Situation and Behaviour already ticked, Impact ticked on "the impact"
    // @form checklist_card: a plain paper card of ruled lines, each with a box at its left that a tick lands in
    const CX = 1516, CY = 100, CW = 308, CH = 336, labels = ["Situation", "Behaviour", "Impact", "Ask, then agree"];
    const card = ctx.el("card", { x: CX, y: CY, w: CW, h: CH, kind: "card", exit: "recede" });
    kit.rect(card.inner, 0, 0, CW, CH, { fill: "surface", r: 8, stroke: "line", sw: 2 });
    kit.text(card.inner, "Four moves", { role: "label", x: 24, y: 14, w: CW - 48, h: 46, weight: 800, color: "muted", tracking: 1, valign: "middle", maxLines: 1 });
    card.rows = [];
    labels.forEach((str, i) => {
      const y = 76 + i * 64;
      const hl = svg("rect", { x: 10, y: y - 2, width: CW - 20, height: 54, rx: 6, fill: S.c("accent"), opacity: 0 }, card.inner);
      svg("rect", { x: 24, y: y + 10, width: 30, height: 30, rx: 3, fill: "none", stroke: S.c("ink"), "stroke-width": 3.5 }, card.inner);
      if (i < 2) T.markShape(card.inner, true, 39, y + 25, 42, "pos", {});
      kit.text(card.inner, str, { role: "label", x: 70, y, w: CW - 90, h: 50, valign: "middle", maxLines: 1, color: "ink", weight: 600 });
      kit.line(card.inner, 24, y + 56, CW - 24, y + 56, { stroke: "line", sw: 1.5, opacity: 0.5 });
      card.rows.push({ hl, x: CX + 39, y: CY + y + 25 });
    });
    T.mark(ctx, "tick_impact", { x: card.rows[2].x, y: card.rows[2].y, size: 42, kind: "yes", t: tImpact });

    // ---- ambient: dust turning in the window light (as in b19)
    const rng = Loom.rng("b26:motes"), motes = [];
    for (let i = 0; i < 14; i++) motes.push({ c: svg("circle", { r: 1.6 + rng() * 2.2, fill: S.c("surface"), opacity: 0.6 }, far), x: 220 + rng() * 480, y: 300 + rng() * 360, ph: rng(), per: 5 + rng() * 4 });
    Loom.drive((e, p) => { const t = p * lenAll; motes.forEach((o) => { const a = 2 * Math.PI * (t / o.per + o.ph); o.c.setAttribute("cx", (o.x + 16 * Math.sin(a)).toFixed(1)); o.c.setAttribute("cy", (o.y - 10 * Math.cos(a * 0.7)).toFixed(1)); }); }, ctx.start, lenAll, "linear", meta("ambient", "motes"));

    // ---- the camera: back up in the room, then a push toward the table as the reply's question settles
    C.push(R, { to: [1040, 860], scale: 1.3, t0: tAsk, t1: tAsk + 1.8 });
  },
});
