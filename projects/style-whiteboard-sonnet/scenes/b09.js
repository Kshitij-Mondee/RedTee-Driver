// @design read_back_underlined_by_part: the written line is read aloud and each part is underlined and named as it is spoken, then a muted note invites correction
/* Treatments: (A) three cards, one per part (rejected: breaks the one-line read-back); (B) static line with all labels
 * at once (rejected: no link between voice and part); (C) CHOSEN: the line written, then underlined part by part
 * on the spoken words, with a muted correction note and a hand arrow. */
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

    // ---- steps: complete with two ticks; Close turns ink on "At the close"
    const steps = ctx.el("steps", { x: 1420, y: 96, w: 380, h: 300, kind: "list", exit: "recede" });
    const sl = Loom.lesson.step_list(ctx, steps.inner, { current: 1, ticked: [true, true, false], name: "steps" });
    sl.appear();
    sl.setCurrent(2, ctx.cue("At the close"));

    // ---- Sam over a desk line
    const desk = ctx.el("desk", { x: 100, y: 690, w: 460, h: 20, kind: "scenery", exit: "recede" });
    hand(desk.inner, "M0 10 L460 8");
    const sam = Loom.lesson.team_table.person(ctx, "Sam", "explaining", { x: 140, y: 350, size: 340, name: "sam" });
    const tRead = ctx.cue("read each decision back");
    m.draw(desk, ctx.speechStart, { dur: drawDur(460) });
    m.reveal(sam, tRead - 0.2, { dy: 0 });

    // ---- the decision line, written centre, then read back part by part
    const dec = ctx.el("decision", { x: 620, y: 470, w: 1100, h: 150, kind: "text", exit: "wipe" });
    const dl = Loom.lesson.decision_line(ctx, dec.inner, { w: 1100, name: "decision" });
    dl.write(tRead);
    const reads = [["What", ctx.cue("What")], ["Who", ctx.cue("who owns it")], ["By when", ctx.cue("by when")]];
    reads.forEach(([lab, t], i) => {
      dl.underline(i, t, { tone: "accent" });
      dl.label(i, lab, t + 0.25);
    });

    // ---- the correction note
    const tNote = ctx.cue("correct it in the room");
    const note = ctx.el("correct_note", { x: 1180, y: 740, w: 400, h: 56, kind: "label", exit: "wipe" });
    kit.text(note.inner, "correct it now", { role: "label", x: 0, y: 0, w: 400, h: 56, maxLines: 1, valign: "middle", color: "muted" });
    m.unmask(note, tNote - 0.2, { dur: writeDur("correct it now") });
    const A = arrowEl("correct_arrow", 1372, 752, 1470, 668, 20, { stroke: "muted", sw: 4 });
    m.draw(A.E, tNote + 0.4, { dur: Math.min(0.45, drawDur(A.len)) });
  },
});
