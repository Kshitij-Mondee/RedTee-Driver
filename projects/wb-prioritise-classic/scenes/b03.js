// @design urgent_split: one urgent label branches into timing and importance, then a deadline-weighted balance
Loom.scene("b03", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const S = ctx.style, DRAW = S.dur("draw");
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const drawDur = (len) => DRAW * clamp(len / 900, 0.3, 1.4);
    const hand = (g, d, o) => kit.sketch(g, "path", [d], Object.assign({ fill: "none", stroke: "ink" }, o || {}));

    // Treatments considered: static split diagram, branching labels, or a balance argument. Chosen: branching labels into a tipping balance; the contracted list remains held.
    ["list_title", "card_deck", "card_expenses", "card_reply", "card_budget", "urgent_tags", "tick_deck", "tick_expenses", "tick_reply", "budget_box"].forEach((name) => ctx.held(name));

    const tUrgent = ctx.cue("Urgent says how soon,");
    const tMatters = ctx.cue("not how much it matters.");
    const tDeadline = ctx.cue("Research suggests we lean toward the nearer deadline.");

    // @form word_urgent: the bundled priority signal
    const urgent = ctx.el("word_urgent", { x: 1050, y: 148, w: 620, h: 116, kind: "text", exit: "wipe" });
    kit.text(urgent.inner, "urgent", { role: "title", x: 0, y: 0, w: 620, h: 116, maxLines: 1, valign: "middle" });
    m.unmask(urgent, tUrgent - 0.08, { dir: "ltr", dur: 0.7 });

    const arrowEl = (name, x1, y1, x2, y2, bend) => {
      const L = Math.hypot(x2 - x1, y2 - y1) || 1;
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const cx = mx - ((y2 - y1) / L) * bend, cy = my + ((x2 - x1) / L) * bend;
      const a = Math.atan2(y2 - cy, x2 - cx), hs = 22;
      const h1 = [x2 - hs * Math.cos(a - 0.5), y2 - hs * Math.sin(a - 0.5)];
      const h2 = [x2 - hs * Math.cos(a + 0.5), y2 - hs * Math.sin(a + 0.5)];
      const xs = [x1, cx, x2, h1[0], h2[0]], ys = [y1, cy, y2, h1[1], h2[1]], P = 12;
      const bx = Math.floor(Math.min(...xs) - P), by = Math.floor(Math.min(...ys) - P);
      const E = ctx.el(name, { x: bx, y: by, w: Math.ceil(Math.max(...xs) + P) - bx, h: Math.ceil(Math.max(...ys) + P) - by, kind: "connector", exit: "recede" });
      const X = (v) => (v - bx).toFixed(1), Y = (v) => (v - by).toFixed(1);
      hand(E.inner, `M${X(x1)} ${Y(y1)} Q${X(cx)} ${Y(cy)} ${X(x2)} ${Y(y2)}`);
      hand(E.inner, `M${X(h1[0])} ${Y(h1[1])} L${X(x2)} ${Y(y2)} L${X(h2[0])} ${Y(h2[1])}`);
      return { E, len: L * 1.1 };
    };

    // @form split_arrows: open headed hand-drawn question split
    const soonArrow = arrowEl("split_arrows_soon", 1215, 270, 1170, 348, -14);
    m.draw(soonArrow.E, tUrgent + 0.34, { dur: Math.min(0.45, drawDur(soonArrow.len)) });
    const mattersArrow = arrowEl("split_arrows_matters", 1390, 270, 1575, 348, 18);
    m.draw(mattersArrow.E, tMatters - 0.34, { dur: Math.min(0.45, drawDur(mattersArrow.len)) });

    // @form label_soon: the time question
    const soon = ctx.el("label_soon", { x: 1010, y: 365, w: 330, h: 76, kind: "text", exit: "wipe" });
    kit.text(soon.inner, "how soon", { role: "lead", x: 0, y: 0, w: 330, h: 76, maxLines: 1, valign: "middle" });
    m.unmask(soon, tUrgent + 0.65, { dir: "ltr", dur: 0.5 });

    // @form label_matters: the importance question
    const matters = ctx.el("label_matters", { x: 1425, y: 365, w: 360, h: 76, kind: "text", exit: "wipe" });
    kit.text(matters.inner, "how much it matters", { role: "lead", x: 0, y: 0, w: 360, h: 76, maxLines: 1, valign: "middle" });
    m.unmask(matters, tMatters - 0.02, { dir: "ltr", dur: 0.95 });
    const underline = ctx.el("matters_underline", { x: 1425, y: 440, w: 350, h: 22, kind: "mark", exit: "recede" });
    hand(underline.inner, "M4 13 Q145 3 345 12", { stroke: "accent", sw: 6 });
    m.draw(underline, tMatters + 0.48, { dur: drawDur(345) });

    // @form balance: a balance with a central pivot and two pans
    const balance = ctx.el("balance", { x: 1290, y: 525, w: 480, h: 300, kind: "instrument", exit: "recede" });
    hand(balance.inner, "M240 154 L198 265 M240 154 L282 265 M174 265 L306 265");
    hand(balance.inner, "M240 154 L240 118");
    m.draw(balance, tDeadline - 0.35, { dur: drawDur(380) });

    const beam = ctx.el("balance_beam", { x: 1310, y: 618, w: 450, h: 150, kind: "instrument", exit: "recede" });
    hand(beam.inner, "M0 32 L450 32 M18 32 L54 112 M132 32 L96 112 M18 112 Q75 132 132 112 M318 32 L354 112 M432 32 L396 112 M318 112 Q375 132 432 112");
    m.draw(beam, tDeadline - 0.05, { dur: drawDur(900) });
    Loom.tween(beam.inner, { rotation: 0, transformOrigin: "225px 32px" }, { rotation: -9, transformOrigin: "225px 32px" }, tDeadline + 0.85, { dur: S.dur("move"), ease: "editorial" });

    // @form deadline_mark: small flag carried by the nearer-deadline pan
    const flag = ctx.el("deadline_mark", { x: 1350, y: 708, w: 110, h: 92, kind: "icon", exit: "recede" });
    hand(flag.inner, "M36 76 L36 16 L82 26 L36 38 M18 76 L56 76");
    m.draw(flag, tDeadline + 0.38, { dur: drawDur(180) });
  },
});
