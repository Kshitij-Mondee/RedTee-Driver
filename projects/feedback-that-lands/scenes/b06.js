// @design over_the_shoulder_thought: the viewer sits behind a person at their desk and a quiet aside fills one line at a time
// b06 - Their seat: the report from behind, the update ahead, three lines of thinking.
// Treatments considered: (A) a text list of the three defences (rejected: words stand in for a person), (B) a face
// close-up (rejected: the report is deliberately unnamed and faceless), (C) CHOSEN: over the shoulder at the desk, an
// opaque close-up of the same desk as b04/b05, the update ahead, and a thought aside that fills one line per beat of
// the narration, ending with the shoulders rising a little. The order of the lines is the order of the thinking.
Loom.scene("b06", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style, T = Loom.treat, svg = Loom.svg;
    const tc = (tok) => S.c(tok);
    const meta = (kind, name) => ({ kind, beat: ctx.beat.id, name, content: true });
    const tSeat = ctx.cue("sit in their seat"), t1 = ctx.cue("it was fine"), t2 = ctx.cue("nobody said anything"), t3 = ctx.cue("what does she mean");

    const world = svg("g", {}, ctx.g);               // one wrapper so the whole close-up can lean in together
    // ---- the seat: an opaque close-up of the same desk (wall, panel edge, desk top, monitor, keyboard, mug, papers)
    const seat = ctx.el("seat", { parent: world, x: 0, y: 0, w: 1920, h: 1080, kind: "scenery" });
    const sg = seat.inner;
    svg("rect", { x: -60, y: -60, width: 2040, height: 1200, fill: tc("field2") }, sg);
    svg("rect", { x: 1480, y: -60, width: 520, height: 760, fill: S.mix(tc("surface2"), tc("line"), 0.18) }, sg);        // the edge of the partition
    svg("rect", { x: 1480, y: -60, width: 520, height: 22, fill: tc("line"), opacity: 0.5 }, sg);
    for (let i = 0; i < 6; i++) svg("rect", { x: 1560 + i * 100, y: -40, width: 3, height: 740, fill: tc("line"), opacity: 0.14 }, sg);
    svg("rect", { x: 0, y: 640, width: 1920, height: 460, fill: S.mix(tc("accent"), tc("field"), 0.66) }, sg);             // desk top
    svg("rect", { x: 0, y: 640, width: 1920, height: 14, fill: S.mix(tc("accent"), tc("surface"), 0.5) }, sg);
    svg("path", { d: "M0 1080 V900 Q960 860 1920 900 V1080 Z", fill: tc("shadow"), opacity: 0.06 }, sg);
    // @form desk_props_close: keyboard, mug with steam, papers and a pen laid on a desk top, seen from above-behind
    svg("path", { d: "M740 800 H1200 L1230 880 H710 Z", fill: tc("surface2") }, sg);
    for (let r = 0; r < 3; r++) for (let c = 0; c < 12; c++) svg("rect", { x: 752 + c * 36 + r * 8, y: 810 + r * 22, width: 28, height: 15, rx: 3, fill: tc("surface"), opacity: 0.9 }, sg);
    svg("ellipse", { cx: 1385, cy: 790, rx: 62, ry: 14, fill: tc("shadow"), opacity: 0.12 }, sg);
    svg("path", { d: "M1330 700 V770 Q1330 792 1385 792 Q1440 792 1440 770 V700 Z", fill: tc("surface") }, sg);
    svg("ellipse", { cx: 1385, cy: 700, rx: 55, ry: 12, fill: tc("line"), opacity: 0.4 }, sg);
    svg("path", { d: "M1440 716 q40 6 28 38 q-8 18 -28 14", fill: "none", stroke: tc("surface"), "stroke-width": 14, "stroke-linecap": "round" }, sg);
    const steam = [0, 1, 2].map((i) => svg("path", { d: `M${1362 + i * 22} 690 q-12 -26 0 -48 q12 -22 0 -46`, fill: "none", stroke: tc("surface"), "stroke-width": 6, "stroke-linecap": "round", opacity: 0.55 }, sg));
    Loom.drive((e, raw) => steam.forEach((p, i) => { const q = (raw * 6 + i / 3) % 1; p.setAttribute("transform", `translate(${(Math.sin(6.283 * q) * 6).toFixed(1)} ${(-q * 16).toFixed(1)})`); p.setAttribute("opacity", (0.55 * Math.sin(3.1416 * q)).toFixed(2)); }), ctx.start, ctx.end - ctx.start, "linear", { kind: "ambient", beat: ctx.beat.id, name: "steam" });
    Loom.obj.shape(sg, "document", 1620, 820, 190, { key: "b06doc", detail: 2 });
    svg("rect", { x: 1520, y: 905, width: 150, height: 9, rx: 4.5, fill: tc("ink"), opacity: 0.7, transform: "rotate(-8 1595 910)" }, sg);

    // ---- the monitor, and the update on it (same look as b04/b05, the soft line still soft); its screen is st_screen's rect
    const mon = ctx.el("monitor", { parent: world, x: 664, y: 164, w: 632, h: 520, kind: "instrument" });
    svg("rect", { x: 306, y: 360, width: 40, height: 150, fill: tc("line") }, mon.inner);
    svg("path", { d: "M250 520 h152 l-14 -34 h-124 Z", fill: tc("muted") }, mon.inner);
    svg("ellipse", { cx: 326, cy: 522, rx: 130, ry: 14, fill: tc("shadow"), opacity: 0.18 }, mon.inner);
    svg("rect", { x: 0, y: 0, width: 632, height: 372, rx: 18, fill: tc("ink") }, mon.inner);
    svg("rect", { x: 36, y: 36, width: 560, height: 315, rx: 6, fill: tc("surface") }, mon.inner);
    const upd = ctx.el("update", { parent: world, x: 720, y: 218, w: 520, h: 280, kind: "document" });
    svg("rect", { x: 0, y: 0, width: 520, height: 46, rx: 6, fill: tc("surface2") }, upd.inner);
    [0, 1, 2].forEach((i) => svg("circle", { cx: 26 + i * 26, cy: 23, r: 7, fill: tc(i === 0 ? "neg" : "line"), opacity: i === 0 ? 0.7 : 0.6 }, upd.inner));
    kit.text(upd.inner, "Update", { role: "caption", x: 150, y: 3, w: 220, h: 40, align: "center", valign: "middle", maxLines: 1, color: "muted" });
    const widths = [0.92, 0.78, 0.86, 0.7, 0.84, 0.46];
    widths.forEach((wf, i) => {
      const y = 82 + i * 32, w = 484 * wf;
      if (i === 3) { const rng = Loom.rng("b06:smudge"); for (let k = 0; k < 5; k++) svg("rect", { x: 18 + rng() * 30, y: y - 8 + (rng() - 0.5) * 14, width: w * (0.4 + rng() * 0.5), height: 14 + rng() * 8, rx: 8, fill: tc("muted"), opacity: 0.2 + rng() * 0.12 }, upd.inner); }
      else kit.path(upd.inner, `M18 ${y} H${18 + w}`, { stroke: "line", sw: 14, opacity: 0.6 });
    });
    const caret = svg("rect", { x: 18, y: 82 + 5 * 32 - 11, width: 4, height: 22, fill: tc("accent") }, upd.inner);
    Loom.drive((e, raw) => caret.setAttribute("opacity", Math.floor(raw * (ctx.end - ctx.start) / 0.5) % 2 ? 0 : 1), ctx.start, ctx.end - ctx.start, "linear", { kind: "ambient", beat: ctx.beat.id, name: "update.caret" });

    // ---- the report, from behind, large in the near layer; the shoulders rise a little at the last line
    // @form figure_from_behind: an unnamed person drawn from behind in muted tokens (back of head, neck, shoulders)
    const K = 2.6, rep = ctx.el("report", { parent: world, x: 208, y: 531, w: 650, h: 549, kind: "character" });
    const rg = svg("g", { transform: `scale(${K})` }, rep.inner), skin = S.mix(S.pack.characters.skin[1], tc("field"), 0.35);
    const body = svg("g", {}, rg);
    svg("path", { d: "M8 196 C8 128 40 108 86 100 L154 100 C204 108 232 128 232 196 L232 215 L8 215 Z", fill: tc("line") }, body);
    svg("path", { d: "M30 150 C46 120 80 110 120 110 C160 110 194 120 210 150 C190 128 160 122 120 122 C80 122 50 128 30 150 Z", fill: tc("surface2"), opacity: 0.55 }, body);
    svg("path", { d: "M120 112 V228", stroke: tc("muted"), "stroke-width": 3, opacity: 0.35 }, body);
    const head = svg("g", {}, rg);
    svg("rect", { x: 100, y: 78, width: 40, height: 34, rx: 10, fill: skin }, head);
    svg("ellipse", { cx: 120, cy: 42, rx: 46, ry: 54, fill: tc("muted") }, head);
    svg("path", { d: "M156 30 Q172 52 158 78 Q166 52 156 30 Z", fill: skin }, head);
    svg("path", { d: "M84 74 Q120 94 156 74 Q150 96 120 98 Q90 96 84 74 Z", fill: tc("ink"), opacity: 0.35 }, head);
    Loom.tween(body, { y: 0 }, { y: -9, duration: ctx.style.dur("enter") * 1.6, ease: Loom.ease.move }, t3, meta("posture", "report.shoulders"));
    Loom.tween(head, { y: 0 }, { y: -3, duration: ctx.style.dur("enter") * 1.6, ease: Loom.ease.move }, t3, meta("posture", "report.head"));
    m.drift(rep, ctx.start, ctx.end, { amp: 1.4, period: 4 });

    // ---- the aside: a thought that fills one line at a time (shell in the seed's shape, three lines, puffs to the head)
    // @form thought_aside_lines: a thought bubble whose lines type in one at a time, in the order of the thinking
    const lines = [["It was fine", t1], ["Nobody said anything", t2], ["What does she mean?", t3]];
    const pad = 34, fits = lines.map(([s]) => kit.fit(s, { role: "body", w: 480, maxLines: 1 }));
    const lh = Math.max(...fits.map((f) => f.height)) + 6, SW = Math.max(...fits.map((f) => f.width)) + 2 * pad, SH = lh * 3 + 2 * pad;
    const SX = 110, SY = 120;
    const th = ctx.el("thought", { parent: world, x: SX, y: SY, w: SW + 60, h: SH + 240, kind: "bubble" });
    T.body(th.inner, T.outline(0, 0, SW, SH), "surface", { x: 0, y: 0, w: SW, h: SH });
    [[SW * 0.78, SH + 34, 17], [SW * 0.84, SH + 80, 12], [SW * 0.88, SH + 118, 8]].forEach(([px, py, r]) => T.body(th.inner, `M${px - r} ${py} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`, "surface", { x: px - r, y: py - r, w: 2 * r, h: 2 * r }, { flat: true }));
    m.reveal(th, t1 - 0.15, { dy: 10 });
    lines.forEach(([s, t], i) => {
      const L = ctx.el("line_" + (i + 1), { parent: world, x: SX + pad, y: SY + pad + i * lh, w: SW - 2 * pad, h: lh, kind: "text" });
      kit.text(L.inner, s, { role: "body", x: 0, y: 0, w: SW - 2 * pad, h: lh, maxLines: 1, valign: "middle", color: "ink" });
      m.unmask(L, t, { dur: 0.7 });
    });

    // ---- the close-up leans in very slowly toward the monitor (a continuing push after the zoom lands)
    Loom.drive((e) => world.setAttribute("transform", `translate(900 480) scale(${(1 + 0.05 * e).toFixed(4)}) translate(-900 -480)`), tSeat, ctx.end - tSeat, "linear", { kind: "camera", beat: ctx.beat.id, name: "seat.push", content: true });
  },
});
