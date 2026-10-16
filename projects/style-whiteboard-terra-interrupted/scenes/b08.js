// @design group_voice_converges_on_one_owner: three group marks and hand arrows make one person's decision authority visible
/*
Treatments considered: (A) a written rule beside Sam, rejected because it does not show the group being heard.
(B) a table full of people, rejected because the board already holds Sam and the parked item.
(C) chosen: three small group marks converge on Priya, then one accent circle makes the decision owner clear.
*/
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
    ctx.held("sam");
    ctx.held("desk");
    ctx.held("question");
    ctx.held("parking_lot");

    const arrowEl = (name, x1, y1, x2, y2, bend) => {
      const L = Math.hypot(x2 - x1, y2 - y1) || 1;
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const cx = mx - ((y2 - y1) / L) * bend, cy = my + ((x2 - x1) / L) * bend;
      const a = Math.atan2(y2 - cy, x2 - cx), hs = 18;
      const h1 = [x2 - hs * Math.cos(a - 0.5), y2 - hs * Math.sin(a - 0.5)];
      const h2 = [x2 - hs * Math.cos(a + 0.5), y2 - hs * Math.sin(a + 0.5)];
      const xs = [x1, cx, x2, h1[0], h2[0]], ys = [y1, cy, y2, h1[1], h2[1]], P = 10;
      const bx = Math.floor(Math.min(...xs) - P), by = Math.floor(Math.min(...ys) - P);
      const E = ctx.el(name, { x: bx, y: by, w: Math.ceil(Math.max(...xs) + P) - bx, h: Math.ceil(Math.max(...ys) + P) - by, kind: "connector", exit: "recede" });
      const X = (v) => (v - bx).toFixed(1), Y = (v) => (v - by).toFixed(1);
      hand(E.inner, `M${X(x1)} ${Y(y1)} Q${X(cx)} ${Y(cy)} ${X(x2)} ${Y(y2)}`);
      hand(E.inner, `M${X(h1[0])} ${Y(h1[1])} L${X(x2)} ${Y(y2)} L${X(h2[0])} ${Y(h2[1])}`);
      return { E, len: L * 1.1 };
    };

    const tRule = ctx.cue("say how it's decided");
    const userXs = [610, 700, 790];
    userXs.forEach((x, i) => {
      // @form group_member: a teammate's voice in the group
      const user = ctx.el(`group_user_${i + 1}`, { x, y: 405, w: 60, h: 70, kind: "icon", exit: "recede" });
      kit.icon(user.inner, "user", { x: 30, y: 35, size: 48, color: "ink", stroke: 24 * 3.6 / 48 });
      m.draw(user, tRule + i * 0.14, { dur: drawDur(150) });
    });

    const tCaller = ctx.cue("who calls it");
    // @form priya_desk: a short desk line gives Priya her own clear place on the board
    const priyaDesk = ctx.el("priya_desk", { x: 1425, y: 760, w: 360, h: 20, kind: "scenery", exit: "recede" });
    hand(priyaDesk.inner, "M0 10 L360 8");
    m.draw(priyaDesk, tCaller - 0.25, { dur: drawDur(360) });
    // @form priya: the named decision owner, seated on the added desk line
    const priya = ctx.el("priya", { x: 1460, y: 450, w: 300, h: 300, kind: "character", exit: "recede" });
    Loom.lesson.team_table.person(ctx, "Priya", "neutral", { x: 150, y: 0, size: 270, name: "priya_person", parent: priya.inner });
    m.reveal(priya, tCaller, { dy: 0 });

    const tHear = ctx.cue("after hearing the group");
    [
      [640, 475, 1423, 565, -180],
      [730, 475, 1423, 585, -170],
      [820, 475, 1423, 605, -160],
    ].forEach((a, i) => {
      // @form group_arrow: a hand-drawn route from one group voice to Priya
      const A = arrowEl(`group_arrow_${i + 1}`, ...a);
      m.draw(A.E, tHear + i * 0.12, { dur: Math.min(0.45, drawDur(A.len)) });
    });

    const tDecides = ctx.cue("Priya decides");
    // @form priya_circle: the single accent mark identifies the decision owner
    const circle = ctx.el("priya_circle", { x: 1417, y: 420, w: 386, h: 330, kind: "mark", exit: "recede" });
    hand(circle.inner, "M193 4 C299 3 375 70 379 164 C382 257 297 321 193 326 C87 328 9 259 6 164 C4 69 86 8 193 4 C222 2 246 3 266 8", { stroke: "accent", sw: 5.5 });
    m.draw(circle, tDecides, { dur: drawDur(940) });

    // @form priya_words: the decision rule written beside its owner
    const words = ctx.el("priya_words", { x: 1565, y: 800, w: 250, h: 70, kind: "text", exit: "wipe" });
    kit.text(words.inner, "Priya decides", { role: "lead", x: 0, y: 0, w: 250, h: 70, maxLines: 1, align: "center", valign: "middle" });
    m.unmask(words, tDecides + 0.1, { dir: "ltr", dur: writeDur("Priya decides") });

    const tGroup = ctx.cue("the group");
    if (steps && steps.handle) steps.handle.tick(1, tGroup - 0.55, { tone: "ink" });
  },
});
