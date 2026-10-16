// @design decision_rule_made_visible: several voices drawn as small figures, arrows converge on the one person who is circled
// Treatments: (A) static row of labelled boxes (rejected, no causal flow); (B) a vote tally (rejected, the rule is not a count);
// (C) CHOSEN: three pictograms, one person fades in, arrows converge, one accent circle.
Loom.scene("b08", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const DRAW = S.dur("draw");
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const drawDur = (len) => DRAW * clamp(len / 900, 0.3, 1.4);
    const writeDur = (str) => DRAW * clamp(String(str).length / 14, 0.45, 1.8);
    const hand = (g, d, o) => kit.sketch(g, "path", [d], Object.assign({ fill: "none", stroke: "ink" }, o || {}));
    const arrowEl = (name, x1, y1, x2, y2, bend, o) => {
      const L = Math.hypot(x2 - x1, y2 - y1) || 1, mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const cx = mx - ((y2 - y1) / L) * bend, cy = my + ((x2 - x1) / L) * bend;
      const a = Math.atan2(y2 - cy, x2 - cx), hs = 22;
      const h1 = [x2 - hs * Math.cos(a - 0.5), y2 - hs * Math.sin(a - 0.5)], h2 = [x2 - hs * Math.cos(a + 0.5), y2 - hs * Math.sin(a + 0.5)];
      const xs = [x1, cx, x2, h1[0], h2[0]], ys = [y1, cy, y2, h1[1], h2[1]], P = 12;
      const bx = Math.floor(Math.min(...xs) - P), by = Math.floor(Math.min(...ys) - P);
      const E = ctx.el(name, { x: bx, y: by, w: Math.ceil(Math.max(...xs) + P) - bx, h: Math.ceil(Math.max(...ys) + P) - by, kind: "connector", exit: "recede" });
      const X = (v) => (v - bx).toFixed(1), Y = (v) => (v - by).toFixed(1);
      hand(E.inner, `M${X(x1)} ${Y(y1)} Q${X(cx)} ${Y(cy)} ${X(x2)} ${Y(y2)}`, o);
      hand(E.inner, `M${X(h1[0])} ${Y(h1[1])} L${X(x2)} ${Y(y2)} L${X(h2[0])} ${Y(h2[1])}`, o);
      return { E, len: L * 1.1 };
    };

    // held board from b07 (their positions are b07's; the desk line y is read when exposed)
    let deskY = 720;
    try {
      const d = ctx.held("desk");
      const b = d && (d.box || d.rect);
      if (b && typeof b.y === "number") deskY = b.y + (b.h || 0) / 2;
    } catch (e) { /* b07 author builds it */ }

    // ---- 1. "how it's decided": three small user pictograms under the question
    const tGroup = ctx.cue("how it's decided");
    const GX = [590, 710, 830], GY = 365;
    const group = ctx.el("group", { x: GX[0] - 48, y: GY - 48, w: GX[2] - GX[0] + 96, h: 96, kind: "icon", exit: "recede" });
    const gl = [];
    GX.forEach((cx, i) => {
      const P = ctx.el("group_" + i, { x: cx - 48, y: GY - 48, w: 96, h: 96, kind: "icon", exit: "recede", parent: group.inner });
      kit.icon(P.inner, "user", { x: 48, y: 48, size: 76, stroke: 24 * 3.6 / 76, color: "ink" });
      m.draw(P, tGroup + i * 0.22, { dur: 0.4 });
    });
    // (the group element only carries the three; its box is their true bounds)

    // ---- 2. "who calls it": Priya fades in on the desk line, centre right
    const tWho = ctx.cue("who calls it");
    const PS = 300, PXL = 960, PYT = deskY - PS;
    const priya = Loom.lesson.team_table.person(ctx, "Priya", "explaining", { x: PXL, y: PYT, size: PS, name: "priya" });
    m.reveal(priya, tWho, { dy: 0 });

    // ---- 3. "Priya decides": the one accent circle round her, words under
    const tDecides = ctx.cue("Priya decides");
    const cx = PXL + 160, cy = deskY - 135, rx = 205, ry = 185, k = 0.5523;
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
    m.draw(circle, tDecides, { dur: drawDur(2 * Math.PI * Math.sqrt((rx * rx + ry * ry) / 2)) });

    const wy = Math.ceil(cy + ry + 22);
    const pw = ctx.el("priya_words", { x: cx - 210, y: wy, w: 420, h: 70, kind: "text", exit: "wipe" });
    kit.text(pw.inner, "Priya decides", { role: "lead", x: 0, y: 0, w: 420, h: 70, maxLines: 1, align: "center", valign: "middle" });
    m.unmask(pw, tDecides + 0.55, { dur: writeDur("Priya decides") });

    // ---- 4. "after hearing": hand arrows from the pictograms to the circle's left edge
    const tHear = ctx.cue("after hearing");
    const ex = cx - rx - 14;
    const targets = [[ex + 6, cy - 70], [ex - 2, cy - 5], [ex + 6, cy + 60]];
    GX.forEach((gx, i) => {
      const A = arrowEl("group_arrow_" + i, gx + 6, GY + 50, targets[i][0], targets[i][1], i === 1 ? -18 : 28);
      m.draw(A.E, tHear + i * 0.25, { dur: Math.min(0.55, drawDur(A.len)) });
    });

    // ---- 5. "the group": During ticked in ink
    const tTick = ctx.cue("the group");
    try { ctx.held("steps").handle.tick(1, tTick); } catch (e) { /* b07 author builds steps */ }
  },
});
