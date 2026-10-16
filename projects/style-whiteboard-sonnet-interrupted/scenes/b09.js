// @design read_back_underlined_by_part: one written line is read back part by part, each part underlined in the marker colour as it is named, then corrected by hand
// Treatments considered: (A) static line with all three underlines at once (rejected: no link between word and mark), (B) three cards (rejected: no accumulation), (C) CHOSEN: one line written, three underlines landing on their spoken words, a muted note and arrow last.
Loom.scene("b09", {
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

    const tClose = ctx.cue("At the close");
    // a hold
    const tRead = ctx.cue("read each decision back");
    const tWhat = ctx.cue("What");
    const tWho = ctx.cue("who owns it");
    const tWhen = ctx.cue("by when");
    const tCorrect = ctx.cue("correct it in the room");

    // ---- the checklist, top right: Before and During ticked, Close turns ink
    const stepsWrap = ctx.el("steps", { x: 1420, y: 96, w: 380, h: 300, kind: "list", exit: "recede" });
    const steps = Loom.lesson.step_list(ctx, stepsWrap.inner, { current: 1, ticked: [true, true, false] });
    steps.appear();
    steps.setCurrent(2, tClose);

    // ---- Sam over a hand desk line, left
    const desk = ctx.el("desk", { x: 100, y: 840, w: 440, h: 20, kind: "scenery", exit: "recede" });
    hand(desk.inner, "M0 10 L440 8");
    m.draw(desk, tClose + 0.2, { dur: drawDur(440) });
    const sam = Loom.lesson.person(ctx, "Sam", "explaining", { name: "sam", x: 160, y: 540 });
    m.reveal(sam, tRead - 0.1, { dy: 0 });

    // ---- the decision line, written centre
    const wrap = ctx.el("decision", { x: 600, y: 500, w: 1100, h: 150, kind: "text", exit: "recede" });
    const dec = Loom.lesson.decision_line(ctx, wrap.inner, { w: 1100, name: "decision" });
    dec.write(tRead + 0.05);

    // ---- the three underlines (the one accent group) with their labels
    const cues = [tWhat, tWho, tWhen], labs = ["What", "Who", "By when"];
    cues.forEach((t, i) => {
      dec.underline(i, t, { tone: "accent" });
      dec.label(i, labs[i], t + 0.3);
    });

    // ---- the muted note and a short hand arrow to the line
    const note = ctx.el("correct_note", { x: 1400, y: 730, w: 400, h: 60, kind: "label", exit: "wipe" });
    kit.text(note.inner, "correct it now", { role: "label", x: 0, y: 0, w: 400, h: 60, maxLines: 1, valign: "middle", align: "center", color: "muted" });
    const A = arrowEl("correct_arrow", 1620, 715, 1660, 560, 30, { stroke: "muted" });
    m.draw(A.E, tCorrect - 0.1, { dur: 0.45 });
    m.unmask(note, tCorrect + 0.3, { dur: writeDur("correct it now") });
  },
});
