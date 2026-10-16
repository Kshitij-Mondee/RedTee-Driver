// @design written_summary_converges: a decision folds into one envelope, reaches four colleagues, and their four bubbles resolve to the same line
// Treatments considered: (A) a mail interface, rejected because it breaks the hand-drawn board. (B) four separate notes, rejected because it weakens one version. (C) chosen: a written decision folds into one envelope, then hand arrows fan out to the team.
Loom.scene("b12", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const drawDur = (len) => S.dur("draw") * Math.max(0.3, Math.min(1.4, len / 900));
    const hand = (g, d, o) => kit.sketch(g, "path", [d], Object.assign({ fill: "none", stroke: "ink" }, o || {}));
    const arrow = (name, parent, x1, y1, x2, y2, bend) => {
      const L = Math.hypot(x2 - x1, y2 - y1) || 1, mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const cx = mx - ((y2 - y1) / L) * bend, cy = my + ((x2 - x1) / L) * bend;
      const a = Math.atan2(y2 - cy, x2 - cx), hs = 18;
      const h1 = [x2 - hs * Math.cos(a - 0.5), y2 - hs * Math.sin(a - 0.5)], h2 = [x2 - hs * Math.cos(a + 0.5), y2 - hs * Math.sin(a + 0.5)];
      const xs = [x1, cx, x2, h1[0], h2[0]], ys = [y1, cy, y2, h1[1], h2[1]], P = 12;
      const bx = Math.floor(Math.min(...xs) - P), by = Math.floor(Math.min(...ys) - P);
      const E = ctx.el(name, { x: bx, y: by, w: Math.ceil(Math.max(...xs) + P) - bx, h: Math.ceil(Math.max(...ys) + P) - by, kind: "connector", exit: "recede", parent });
      const X = (v) => (v - bx).toFixed(1), Y = (v) => (v - by).toFixed(1);
      hand(E.inner, `M${X(x1)} ${Y(y1)} Q${X(cx)} ${Y(cy)} ${X(x2)} ${Y(y2)}`);
      hand(E.inner, `M${X(h1[0])} ${Y(h1[1])} L${X(x2)} ${Y(y2)} L${X(h2[0])} ${Y(h2[1])}`);
      return { E, len: L * 1.1 };
    };

    const tSend = ctx.cue("Then send it in writing, ideally the same day,");
    const tWriting = ctx.cue("in writing");
    const tDay = ctx.cue("the same day");
    const tEveryone = ctx.cue("to everyone there and anyone affected.");
    const tOne = ctx.cue("One version of the meeting.");

    // @form steps: the persistent three-move checklist, complete through the close step
    const steps = ctx.el("steps", { x: 1420, y: 96, w: 380, h: 300, kind: "list", exit: "none" });
    const checklist = Loom.lesson.step_list(ctx, steps.inner, { name: "steps", current: 2, ticked: [true, true, false] });
    checklist.appear();

    // @form table: the callback meeting table, freshly drawn at this station
    const table = ctx.el("table", { x: 90, y: 210, w: 1400, h: 700, kind: "scenery", exit: "none" });
    const team = Loom.lesson.team_table(ctx, table.inner, { name: "team", ox: 90, oy: 210 });
    team.draw(tSend - 0.28);
    team.arrive(tSend + 0.18);
    team.emotion(0, "explaining", tSend + 0.55);
    team.emotion(1, "happy", tOne - 0.1);
    team.emotion(2, "happy", tOne + 0.08);
    team.emotion(3, "happy", tOne + 0.26);

    // @form email: the three-part decision written above the table, then folded into an envelope
    const email = ctx.el("email", { x: 430, y: 300, w: 760, h: 250, kind: "document", exit: "recede" });
    const decision = Loom.lesson.decision_line(ctx, email.inner, { name: "email_decision", w: 700, parts: ["Pilot ships in June", "Priya", "by Friday"] });
    decision.write(tWriting - 0.12);
    decision.fold(tDay - 0.1, { x: 110, y: 84, scale: 0.45 });
    Loom.tween(decision.el.line.life, { opacity: 1 }, { opacity: 0 }, tDay + 0.45, { dur: 0.2 });
    // @form envelope: rough hand envelope that receives the folded decision
    const envelope = ctx.el("email_envelope", { x: 92, y: 66, w: 290, h: 160, kind: "icon", exit: "recede", parent: email.inner });
    kit.sketch(envelope.inner, "rectangle", [8, 14, 274, 128], { fill: "none" });
    hand(envelope.inner, "M8 14 L145 104 L282 14");
    m.draw(envelope, tDay + 0.08, { dur: drawDur(620) });

    // @form sent_today: the one accent mark, beside the sent envelope
    const sentToday = ctx.el("sent_today", { x: 1160, y: 382, w: 250, h: 80, kind: "text", exit: "recede" });
    kit.text(sentToday.inner, "Sent today", { role: "lead", x: 0, y: 0, w: 250, h: 60, maxLines: 1, valign: "middle", color: "ink" });
    m.unmask(sentToday, tDay + 0.22, { dur: S.dur("draw") * 0.7 });
    // @form sent_today_underline: accent underline is the focal point
    const underline = ctx.el("sent_today_underline", { x: 1160, y: 440, w: 230, h: 24, kind: "mark", exit: "recede" });
    hand(underline.inner, "M4 14 C68 5 154 20 223 10", { stroke: "accent", sw: 5.5 });
    m.draw(underline, tDay + 0.62, { dur: drawDur(223) });

    // @form delivery_arrows: four open-headed hand arrows end above each face, never through it
    const starts = [
      [665, 450, 250, 365, -28], [665, 450, 590, 365, -18], [665, 450, 930, 365, 18], [665, 450, 1270, 365, 30],
    ];
    starts.forEach((a, i) => {
      const A = arrow("delivery_arrow_" + i, email.inner, a[0] - 430, a[1] - 300, a[2] - 430, a[3] - 300, a[4]);
      m.draw(A.E, tEveryone + i * 0.18, { dur: Math.min(0.45, drawDur(A.len)) });
      Loom.tween(A.E.life, { opacity: 1 }, { opacity: 0 }, tOne - 0.08 + i * 0.03, { dur: 0.22 });
    });

    // The envelope has delivered its message, so it clears before the shared bubbles use this band.
    Loom.tween(email.life, { opacity: 1 }, { opacity: 0 }, tOne - 0.4, { dur: 0.2 });

    // @form bubbles: one identical, compact bubble over each teammate after the summary arrives
    const bubbles = ctx.el("bubbles", { x: 90, y: 210, w: 1400, h: 220, kind: "group", exit: "recede" });
    [0, 1, 2, 3].forEach((i) => team.bubble(i, "June. Priya. Friday.", tOne + i * 0.18));
  },
});
