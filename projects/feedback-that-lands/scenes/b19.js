// @design replayed_scene_calm: the same conversation reopened in a quiet room, one document on the table, the working card waiting in the corner
/* b19 - same update, same Maya, the afternoon it went out. A quiet meeting room (the wipe to the left was the rewind).
 * Maya stands behind the table so its edge hides her below the waist and she reads as seated; the report is in the
 * foreground from behind, small and lower in the frame; one sheet lies on the table; the four-move card waits top right.
 * Treatments considered: (A) a title card "same afternoon" (rejected: words standing in for the place), (B) a split
 * of the corridor and the room (rejected: that is the payoff in b45), (C) CHOSEN: reopen the room, everything already
 * present (the viewer has been here), one push from the wide room to the two-shot, tags naming what is drawn.
 * Held through b20 and b21 by name: room, maya, report, update, card, clock.
 */
Loom.scene("b19", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style, O = Loom.obj, T = Loom.treat, D = Loom.data, svg = Loom.svg;
    const bid = ctx.beat.id;
    const meta = (kind, name) => ({ kind, beat: bid, name, content: true });
    // the three room beats are one continuous shot: the actors' clocks run to the end of the last of them
    const span = ((Loom.manifest && Loom.manifest.beats) || []).filter((b) => ["b19", "b20", "b21"].includes(b.id));
    const endAll = span.length ? span[span.length - 1].end : ctx.end;
    const lenAll = endAll + 1 - ctx.start;

    // ---- the room (name "room", the same options in every room station)
    const R = Loom.place.meeting(ctx, "room", {});
    const far = R.layers.far.g, mid = R.layers.mid.g, near = R.layers.near.g;
    const tt = R.floorY + 110, tb = R.floorY + 300;
    R.E.layers = R.layers;   // the later room beats add to the same layers and ride the same camera

    // the wall carries more than the screen: a low cabinet under the window with a plant and a mug, window light on the floor
    svg("path", { d: "M140 440 L480 440 L760 1000 L220 1000 Z", fill: S.c("surface"), opacity: 0.2 }, far);
    svg("rect", { x: 110, y: 560, width: 390, height: 112, rx: 4, fill: S.darken(S.c("surface2"), 0.14) }, far);
    svg("rect", { x: 104, y: 548, width: 402, height: 16, rx: 4, fill: S.lighten(S.c("surface2"), 0.2) }, far);
    [0, 1].forEach((i) => { svg("rect", { x: 122 + i * 190, y: 576, width: 176, height: 84, rx: 3, fill: "none", stroke: S.c("line"), "stroke-width": 2.5, opacity: 0.6 }, far); svg("rect", { x: 190 + i * 190, y: 612, width: 40, height: 6, rx: 3, fill: S.c("line") }, far); });
    for (let i = 0; i < 6; i++) svg("ellipse", { cx: 400 + (i - 2.5) * 16, cy: 518 - (i % 2) * 14, rx: 10, ry: 30, fill: S.c(i % 2 ? "pos" : "accent4"), transform: `rotate(${(i - 2.5) * 12} ${400 + (i - 2.5) * 16} 546)` }, far);
    svg("path", { d: "M384 546 H420 L416 568 H388 Z", fill: S.c("accent2") }, far);
    svg("rect", { x: 160, y: 520, width: 22, height: 28, rx: 4, fill: S.c("surface") }, far);

    // ---- the clock on the back wall: reads afternoon (b20 lets the hands run on)
    // @form wall_clock_state: a wall clock set to a time of day, its hands held for a later sweep
    const clk = O.draw(ctx, "clock", "clock", { x: 1380, y: 250, size: 150, family: "wall", detail: 3, state: { time: 14.17 }, key: "clock_room", shadow: false, parent: far });

    // ---- Maya: across the table, standing behind its edge; the table drawn again over her lower body hides her legs
    const rigCtx = Object.assign({}, ctx, { end: endAll, beat: Object.assign({}, ctx.beat, { phrases: span.length ? span.reduce((a, b) => a.concat(b.phrases), []) : ctx.beat.phrases }) });
    const cast = { character: (name, rigId, o) => Loom.rig.place(rigCtx, name, rigId, o) };   // ctx.character with the long-running clock
    const maya = cast.character("maya", "maya", { x: 900, y: 1215, scale: 0.5, pose: "neutral", emotion: "neutral", parent: mid });
    maya.E.actor = maya;
    T.body(mid, `M600 ${tt} H1320 L1560 ${tb} H360 Z`, "surface", { x: 360, y: tt, w: 1200, h: tb - tt }, { shadow: false });
    svg("rect", { x: 372, y: tb, width: 1176, height: 260, fill: S.darken(S.c("surface"), 0.24) }, mid);   // the table's solid front: nothing of her below it shows
    svg("rect", { x: 372, y: tb, width: 1176, height: 14, fill: S.darken(S.c("surface"), 0.34), opacity: 0.6 }, mid);
    svg("path", { d: `M600 ${tt} H1320`, stroke: S.darken(S.c("surface"), 0.12), "stroke-width": 2, fill: "none" }, mid);

    // ---- the update: one sheet lying on the table, seen in perspective (title, grey text bars, a small chart block)
    // @form sheet_on_table: a single document drawn in perspective on a tabletop, ink bars on paper
    const upd = ctx.el("update", { x: 840, y: 806, w: 240, h: 112, kind: "document", parent: mid });
    const xl = (v) => 46 - 30 * v, xr = (v) => 194 + 30 * v, px = (u, v) => xl(v) + (xr(v) - xl(v)) * u, py = (v) => 4 + v * 100;
    const quad = (u0, u1, v0, v1) => [[px(u0, v0), py(v0)], [px(u1, v0), py(v0)], [px(u1, v1), py(v1)], [px(u0, v1), py(v1)]];
    kit.polygon(upd.inner, [[xl(0) + 6, py(0) + 8], [xr(0) + 6, py(0) + 8], [xr(1) + 6, py(1) + 8], [xl(1) + 6, py(1) + 8]], { fill: "shadow", opacity: 0.1 });
    kit.polygon(upd.inner, quad(0, 1, 0, 1), { fill: "surface", stroke: "line", sw: 2 });
    kit.polygon(upd.inner, quad(0.08, 0.5, 0.08, 0.2), { fill: "accent" });
    [[0.3, 0.9], [0.38, 0.8], [0.46, 0.86], [0.54, 0.6], [0.62, 0.8], [0.7, 0.72], [0.78, 0.5]].forEach(([v, w]) => kit.polygon(upd.inner, quad(0.08, 0.08 + 0.62 * w, v, v + 0.05), { fill: "ink" }));
    kit.polygon(upd.inner, quad(0.74, 0.92, 0.3, 0.62), { fill: "accent4" });

    // ---- the report, from behind, in the near layer at the bottom right: over the shoulder, cropped by the frame
    const rx = 1610, sy = 880, s = 1.1, jacket = S.mix(S.c("line"), S.c("surface2"), 0.55), jdk = S.darken(jacket, 0.1);
    const skin = S.mix(S.pack.characters.skin[1], S.c("surface2"), 0.4);
    const rep = ctx.el("report", { x: rx - 100 * s, y: sy - 115 * s, w: 200 * s, h: 280 * s, kind: "character", parent: near });
    const body = svg("g", {}, rep.inner);
    const fig = svg("g", { transform: `translate(${-(rx - 100 * s)} ${-(sy - 115 * s)}) translate(${rx} ${sy}) scale(${s}) translate(${-rx} ${-sy})` }, body);
    const sh = svg("g", {}, fig), hd = svg("g", {}, fig);
    const seat = sy + 160;
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
    rep.parts = { sh, hd };
    Loom.drive((e, p) => body.setAttribute("transform", `translate(0 ${(1.8 * Math.sin((2 * Math.PI * p * lenAll) / 4.2)).toFixed(2)})`), ctx.start, lenAll, "linear", meta("ambient", "report.breath"));

    // ---- the four-move card, waiting in the top right corner: four ruled lines, an empty box at the left of each
    // @form checklist_card: a plain paper card of ruled lines, each with an empty box that can be ticked on its words
    const CX = 1516, CY = 100, CW = 308, labels = ["Situation", "Behaviour", "Impact", "Ask, then agree"];
    const card = ctx.el("card", { x: CX, y: CY, w: CW, h: 336, kind: "card", exit: "recede" });
    kit.rect(card.inner, 0, 0, CW, 336, { fill: "surface", r: 8, stroke: "line", sw: 2 });
    kit.text(card.inner, "Four moves", { role: "label", x: 24, y: 14, w: CW - 48, h: 46, weight: 800, color: "muted", tracking: 1, valign: "middle", maxLines: 1 });
    card.ticks = [];
    labels.forEach((str, i) => {
      const y = 76 + i * 64;
      svg("rect", { x: 24, y: y + 10, width: 30, height: 30, rx: 3, fill: "none", stroke: S.c("ink"), "stroke-width": 3.5 }, card.inner);
      kit.text(card.inner, str, { role: "label", x: 70, y, w: CW - 90, h: 50, valign: "middle", maxLines: 1, color: "ink", weight: 600 });
      kit.line(card.inner, 24, y + 56, CW - 24, y + 56, { stroke: "line", sw: 1.5, opacity: 0.5 });
      card.ticks.push([CX + 39, CY + y + 25]);
    });

    // ---- ambient: dust turning in the window light
    const rng = Loom.rng("b19:motes"), motes = [];
    for (let i = 0; i < 14; i++) motes.push({ c: svg("circle", { r: 1.6 + rng() * 2.2, fill: S.c("surface"), opacity: 0.6 }, far), x: 220 + rng() * 480, y: 300 + rng() * 360, ph: rng(), per: 5 + rng() * 4 });
    Loom.drive((e, p) => { const t = p * lenAll; motes.forEach((o) => { const a = 2 * Math.PI * (t / o.per + o.ph); o.c.setAttribute("cx", (o.x + 16 * Math.sin(a)).toFixed(1)); o.c.setAttribute("cy", (o.y - 10 * Math.cos(a * 0.7)).toFixed(1)); }); }, ctx.start, lenAll, "linear", meta("ambient", "motes"));

    // ---- the beats
    maya.pose("listen", ctx.cue("Same Maya"), { dur: 0.7 });
    maya.emotion("focus", ctx.cue("Same Maya"));
    const tAft = ctx.cue("the afternoon it went out");
    const tagAft = D.tag(ctx, "tag_afternoon", { x: 1196, y: 332, text: "Same afternoon", color: "accent2", t: tAft });
    far.appendChild(tagAft.outer);
    const tRoom = ctx.cue("A quiet room");
    Loom.cam.push(R, { to: [1150, 800], scale: 1.3, t0: tRoom, t1: tRoom + 2.8 });
    const tagRoom = D.tag(ctx, "tag_room", { x: 130, y: 470, text: "Quiet room", color: "muted", t: tRoom + 0.2 });
    far.appendChild(tagRoom.outer);
    const tWork = ctx.cue("this one piece of work");
    const tagWork = D.tag(ctx, "tag_work", { x: 1086, y: 842, text: "One piece of work", color: "accent", t: tWork });
    mid.appendChild(tagWork.outer);
    m.emphasis(upd, tWork + 0.35);
  },
});
