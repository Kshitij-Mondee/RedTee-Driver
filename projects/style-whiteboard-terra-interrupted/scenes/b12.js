// @design written_summary_converges_team_voice: a folded decision line sends one shared message to every person at the meeting table
// Treatments considered: (A) a mail card, rejected because it breaks the board callback; (B) four separate notes, rejected because it hides the shared outcome; (C) chosen, one hand-drawn envelope with four arrows and matching bubbles.
Loom.scene("b12", {
  build(ctx) {
    const { kit, m } = ctx;
    const T = Loom.treat;
    const S = Loom.style;
    const DRAW = S.dur("draw");
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const drawDur = (len) => DRAW * clamp(len / 900, 0.3, 1.4);
    const hand = (g, d, o) => kit.sketch(g, "path", [d], Object.assign({ fill: "none", stroke: "ink" }, o || {}));
    // @form hand_arrow: an ink connector with an open head
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

    const tTable = ctx.cue("Then send it");
    // @form checklist: the three meeting moves with Close active
    const steps = ctx.el("steps", { x: 1420, y: 96, w: 380, h: 300, kind: "list", exit: "none" });
    const stepList = Loom.lesson.step_list(ctx, steps.inner, { name: "steps", current: 2, ticked: [true, true, false] });
    stepList.appear();

    // @form meeting_table: the four named people at the callback table
    const table = ctx.el("table", { x: 90, y: 310, w: 1400, h: 620, kind: "scenery", exit: "none" });
    const team = Loom.lesson.team_table(ctx, table.inner, { name: "team", ox: 90, oy: 240 });
    team.draw(tTable - 0.3);
    team.arrive(tTable + 0.15);

    const tWrite = ctx.cue("in writing");
    // @form folded_envelope: a written decision folds into a rough ink envelope
    const email = ctx.el("email", { x: 430, y: 220, w: 800, h: 190, kind: "instrument", exit: "recede" });
    const decision = Loom.lesson.decision_line(ctx, email.inner, {
      name: "email_decision", w: 700,
      parts: ["Pilot ships in June", "Priya", "by Friday"]
    });
    const writtenEnd = decision.write(tWrite - 0.25);
    hand(email.inner, "M235 48 L565 48 L565 164 L235 164 Z");
    hand(email.inner, "M238 52 L400 128 L562 52");
    hand(email.inner, "M238 160 L350 92 M562 160 L450 92");
    m.draw(email, writtenEnd + 0.05, { dur: drawDur(980) });
    decision.fold(writtenEnd + 0.35, { x: 250, y: 55, scale: 0.42 });

    const tSent = ctx.cue("the same day");
    // @form sent_label: a plain label with the scene's only accent underline
    const sentToday = ctx.el("sent_today", { x: 1170, y: 250, w: 230, h: 110, kind: "label", exit: "recede" });
    const sentWords = kit.text(sentToday.inner, "Sent today", { role: "lead", x: 0, y: 0, w: 230, h: 70, maxLines: 1, valign: "middle" });
    hand(sentToday.inner, "M4 88 C68 76 145 76 218 84", { stroke: "accent", sw: 5 });
    m.unmask(sentToday, tSent - 0.15, { dur: 0.55 });
    m.draw(sentToday, tSent + 0.32, { dur: drawDur(218) });

    const tPeople = ctx.cue("everyone there and anyone affected");
    // @form delivery_arrows: one envelope reaches each person
    const targets = [[250, 600, -44], [590, 575, -24], [930, 575, 24], [1270, 600, 44]];
    targets.forEach((p, i) => {
      const A = arrow("delivery_" + i, 830, 405, p[0], p[1], p[2]);
      m.draw(A.E, tPeople - 0.15 + i * 0.08, { dur: Math.min(0.45, drawDur(A.len)) });
    });

    // @form shared_speech: four matching speech bubbles show one version of the meeting
    const bubbles = ctx.el("bubbles", { x: 115, y: 425, w: 1400, h: 130, kind: "bubble", exit: "recede" });
    const tBubbles = ctx.cue("One version of the meeting") - 0.18;
    const bubbleXs = [140, 480, 820, 1160];
    bubbleXs.forEach((x, i) => {
      T.bubble(ctx, "shared_bubble_" + i, {
        x, y: 425, w: 300, text: "June. Priya. Friday.", tail: [250 + i * 340, 570],
        kind: "speech", fill: "surface", maxLines: 1, t: tBubbles
      });
    });
  },
});
