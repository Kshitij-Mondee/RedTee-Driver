// @design decision_rule_drawn: many voices point at one person, who is circled and named
/* Treatments considered: (A) a text rule "group advises, owner decides" (rejected: a slide), (B) static board
 * with all arrows (rejected: no order), (C) CHOSEN: group pictograms drawn, Priya arrives, circled and named,
 * arrows from the group converge on her, During ticked. */
Loom.scene("b08", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const DRAW = S.dur("draw");
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const drawDur = (len) => DRAW * clamp(len / 900, 0.3, 1.4);
    const writeDur = (str) => DRAW * clamp(String(str).length / 14, 0.45, 1.8);
    const hand = (g, d, o) => kit.sketch(g, "path", [d], Object.assign({ fill: "none", stroke: "ink" }, o || {}));

    const steps = ctx.held("steps");
    ctx.held("sam"); ctx.held("desk"); ctx.held("question"); ctx.held("parking_lot"); ctx.held("parked_name");

    // ---- the group: three small user pictograms under the question
    const tSay = ctx.cue("say how it's decided");
    const GX = 540, GY = 296;
    const group = ctx.el("group", { x: GX, y: GY, w: 440, h: 290, kind: "scenery", exit: "recede" });
    const cxs = [600, 720, 840];
    cxs.forEach((cx, i) => {
      const P = ctx.el("group_user_" + i, { x: cx - 45 - GX, y: 302 - GY, w: 90, h: 96, kind: "icon", exit: "recede", parent: group.inner });
      kit.icon(P.inner, "user", { x: 45, y: 48, size: 76, stroke: 24 * 3.6 / 76, color: "ink" });
      m.draw(P, tSay + i * 0.25, { dur: 0.4 });
    });

    // ---- Priya on the desk line, centre right
    const tCalls = ctx.cue("who calls it");
    const priya = Loom.lesson.team_table.person(ctx, "Priya", "neutral", { x: 990, y: 340, size: 360, name: "priya" });
    m.reveal(priya, tCalls, { dy: 0 });

    // ---- the circle (accent) and her words, on "Priya decides"
    const tDec = ctx.cue("Priya decides");
    const cx = 1182, cy = 520, rx = 205, ry = 212, k = 0.5523;
    const cbx = cx - rx - 12, cby = Math.floor(cy - ry * 1.16 - 12);
    const lx = cx - cbx, ly = cy - cby;
    const loop = `M${lx} ${ly - ry}` +
      ` C${lx + k * rx} ${ly - ry} ${lx + rx} ${ly - k * ry} ${lx + rx} ${ly}` +
      ` C${lx + rx} ${ly + k * ry} ${lx + k * rx} ${ly + ry} ${lx} ${ly + ry}` +
      ` C${lx - k * rx} ${ly + ry} ${lx - rx} ${ly + k * ry} ${lx - rx} ${ly}` +
      ` C${lx - rx} ${ly - k * ry} ${lx - k * rx} ${ly - ry * 1.06} ${lx} ${ly - ry * 1.06}` +
      ` C${lx + rx * 0.2} ${ly - ry * 1.06} ${lx + rx * 0.4} ${ly - ry * 1.12} ${lx + rx * 0.5} ${ly - ry * 1.16}`;
    const circle = ctx.el("priya_circle", { x: cbx, y: cby, w: 2 * rx + 24, h: Math.ceil(cy + ry + 12) - cby, kind: "mark", exit: "recede" });
    hand(circle.inner, loop, { stroke: "accent", sw: 5 });
    m.draw(circle, tDec, { dur: drawDur(2 * Math.PI * 208) });
    const words = ctx.el("priya_words", { x: 962, y: 765, w: 440, h: 110, kind: "text", exit: "wipe" });
    kit.text(words.inner, "Priya decides", { role: "title", x: 0, y: 0, w: 440, h: 110, maxLines: 1, align: "center", valign: "middle" });
    m.unmask(words, tDec + 0.5, { dur: writeDur("Priya decides") });

    // ---- hand arrows from the group converge on Priya, after hearing the group
    const tHear = ctx.cue("after hearing");
    const ends = [545, 515, 485];
    cxs.forEach((sx, i) => {
      const x1 = sx + 10 - GX, y1 = 410 - GY, x2 = 962 - GX, y2 = ends[i] - GY;
      const bend = -20;
      const L = Math.hypot(x2 - x1, y2 - y1) || 1, mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const qx = mx - ((y2 - y1) / L) * bend, qy = my + ((x2 - x1) / L) * bend;
      const a = Math.atan2(y2 - qy, x2 - qx), hs = 22;
      const h1 = [x2 - hs * Math.cos(a - 0.5), y2 - hs * Math.sin(a - 0.5)], h2 = [x2 - hs * Math.cos(a + 0.5), y2 - hs * Math.sin(a + 0.5)];
      const xs = [x1, qx, x2, h1[0], h2[0]], ys = [y1, qy, y2, h1[1], h2[1]], P = 12;
      const bx = Math.floor(Math.min(...xs) - P), by = Math.floor(Math.min(...ys) - P);
      const E = ctx.el("group_arrow_" + i, { x: bx, y: by, w: Math.ceil(Math.max(...xs) + P) - bx, h: Math.ceil(Math.max(...ys) + P) - by, kind: "connector", exit: "recede", parent: group.inner });
      const X = (v) => (v - bx).toFixed(1), Y = (v) => (v - by).toFixed(1);
      hand(E.inner, `M${X(x1)} ${Y(y1)} Q${X(qx)} ${Y(qy)} ${X(x2)} ${Y(y2)}`);
      hand(E.inner, `M${X(h1[0])} ${Y(h1[1])} L${X(x2)} ${Y(y2)} L${X(h2[0])} ${Y(h2[1])}`);
      m.draw(E, tHear + i * 0.2, { dur: Math.min(0.5, drawDur(L * 1.1)) });
    });

    // ---- During ticked in ink
    const tGroup = ctx.cue("the group");
    const sl = steps.handle;
    if (sl && sl.tick) sl.tick(1, tGroup);
    else {
      const tk = ctx.el("during_tick", { x: 1420, y: 196, w: 76, h: 100, kind: "mark", exit: "recede" });
      hand(tk.inner, "M19 52 L31 67 L59 26", { sw: 5 });
      m.draw(tk, tGroup, { dur: 0.4 });
    }
  },
});
