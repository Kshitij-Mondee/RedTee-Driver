// @design converging_hand_arrows: three voices visibly converge on one decision owner
// Treatments considered: (A) a rule written as a sentence, (B) a static table portrait, (C) chosen, three voices converge on the person who calls it.
Loom.scene("b08", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const DRAW = S.dur("draw");
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const drawDur = (len) => DRAW * clamp(len / 900, 0.3, 1.4);
    const writeDur = (str) => DRAW * clamp(String(str).length / 14, 0.45, 1.8);
    const hand = (g, d, o) => kit.sketch(g, "path", [d], Object.assign({ fill: "none", stroke: "ink" }, o || {}));
    const arrow = (name, x1, y1, x2, y2, bend) => {
      const L = Math.hypot(x2 - x1, y2 - y1) || 1;
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const cx = mx - ((y2 - y1) / L) * bend, cy = my + ((x2 - x1) / L) * bend;
      const a = Math.atan2(y2 - cy, x2 - cx), hs = 18;
      const h1 = [x2 - hs * Math.cos(a - 0.5), y2 - hs * Math.sin(a - 0.5)];
      const h2 = [x2 - hs * Math.cos(a + 0.5), y2 - hs * Math.sin(a + 0.5)];
      const xs = [x1, cx, x2, h1[0], h2[0]], ys = [y1, cy, y2, h1[1], h2[1]], p = 12;
      const bx = Math.floor(Math.min(...xs) - p), by = Math.floor(Math.min(...ys) - p);
      const E = ctx.el(name, { x: bx, y: by, w: Math.ceil(Math.max(...xs) + p) - bx, h: Math.ceil(Math.max(...ys) + p) - by, kind: "connector", exit: "recede" });
      const X = (v) => (v - bx).toFixed(1), Y = (v) => (v - by).toFixed(1);
      hand(E.inner, `M${X(x1)} ${Y(y1)} Q${X(cx)} ${Y(cy)} ${X(x2)} ${Y(y2)}`);
      hand(E.inner, `M${X(h1[0])} ${Y(h1[1])} L${X(x2)} ${Y(y2)} L${X(h2[0])} ${Y(h2[1])}`);
      return { E, len: L * 1.1 };
    };

    const steps = ctx.held("steps");
    ctx.held("sam");
    ctx.held("desk");
    ctx.held("question");
    ctx.held("parking_lot");

    const tRule = ctx.cue("say how it's decided");
    const tCaller = ctx.cue("who calls it");
    const tHear = ctx.cue("after hearing the group");
    const tDecides = ctx.cue("Priya decides");
    const tGroup = ctx.cue("the group");

    // @form group: three compact voices below the held question
    const group = ctx.el("group", { x: 500, y: 430, w: 300, h: 104, kind: "icon", exit: "recede" });
    [50, 150, 250].forEach((x) => kit.icon(group.inner, "user", { x, y: 52, size: 58, stroke: 24 * 3.6 / 58, color: "ink" }));
    m.draw(group, tRule - 0.25, { dur: drawDur(270) });

    // @form priya: the named decision owner, placed on the existing desk line
    const priya = Loom.lesson.team_table.person(ctx, "Priya", "neutral", { x: 820, y: 460, size: 300, name: "priya" });
    m.reveal(priya, tCaller - 0.1, { dy: 0 });

    // @form group_arrow_top: a hand arrow carries one voice into Priya
    const a1 = arrow("group_arrow_top", 550, 462, 835, 540, -28);
    // @form group_arrow_middle: a hand arrow carries one voice into Priya
    const a2 = arrow("group_arrow_middle", 650, 482, 835, 585, 0);
    // @form group_arrow_bottom: a hand arrow carries one voice into Priya
    const a3 = arrow("group_arrow_bottom", 750, 500, 835, 630, 22);
    [a1, a2, a3].forEach((a, i) => m.draw(a.E, tHear + i * 0.12, { dur: Math.min(0.45, drawDur(a.len)) }));

    // @form priya_circle: one marker-colour loop makes the caller unmistakable
    const circle = ctx.el("priya_circle", { x: 796, y: 436, w: 348, h: 338, kind: "mark", exit: "recede" });
    hand(circle.inner, "M174 8 C270 8 336 72 338 166 C340 260 274 328 174 330 C74 330 8 262 10 166 C12 74 76 8 174 8 C220 4 258 8 282 18", { stroke: "accent", sw: 5.5 });
    m.draw(circle, tDecides, { dur: drawDur(1010) });

    // @form priya_words: the decision rule written beneath the owner
    const words = ctx.el("priya_words", { x: 790, y: 770, w: 380, h: 64, kind: "text", exit: "wipe" });
    kit.text(words.inner, "Priya decides", { role: "lead", x: 0, y: 0, w: 380, h: 64, maxLines: 1, align: "center", valign: "middle", color: "ink" });
    m.unmask(words, tDecides + 0.12, { dur: writeDur("Priya decides") });

    steps.handle.tick(1, tGroup, { tone: "ink" });
  },
});
