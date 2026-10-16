// @design seat_switch_spread: the held picture travels aside and shrinks into one page of a two-page spread, the other party's small page settles opposite, and one thin line carries the exchange across the fold to where its cost lands
/* b12 - switch seats. For the asker it is one small message and it gets them unstuck; the hidden column lands on
 * someone else. Nobody is careless; now is just the default.
 *
 * Treatments considered:
 *  (A) cut to a new station with two people (rejected: no code-drawn people in an editorial pack, D-102, and a cut
 *      loses the morning the viewer has just watched fill up);
 *  (B) split the screen with a hard vertical wipe over the morning (rejected: covers half the evidence);
 *  (C) CHOSEN: the storyboard's magazine spread without a cut. The held morning travels right and shrinks to 0.6
 *      (the right-hand page); a gutter draws down the fold; the asker's smaller page settles left with their work
 *      drawn in the SAME unit at the SAME apparent size (so one small ink unit is honestly small next to fifteen red
 *      units and their hatch); a thin line carries a slip across the fold into the right page, and the red runs
 *      take the accent once as it lands. Then the finished spread rests (nobody is careless: nothing new arrives).
 * Scale is 0.6, not 0.55: every word on the morning page is >= 30 px, so it stays >= 18 px on screen.
 * Travel is a keyed drive (key "qq.mv.<name>"), not m.travel: the morning travels again in b14, and only the first
 * drive on a key may render its start state at load, or the page would show shrunken from the start of b08.
 * Continuity: strip, morning_grid, slips, margin_note stay at this reduced transform through b13 (keep); asker_page,
 * gutter, message_line and the labels leave at b13's join.
 */
Loom.scene("b12", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const B = ctx.beat.id;
    const S = Loom.style, T = Loom.treat;
    const label = (name, o) => { const E = T.label(ctx, name, o); if (E.lead && o.t != null) Loom.tween(E.lead.inner, { opacity: 0 }, { opacity: 1, duration: 0.05 }, o.t, { kind: "reveal", beat: B, name: name + ".lead" }); return E; };
    const held = ["strip", "morning_grid", "slips", "margin_note"].map((n) => ctx.held(n));
    const [strip, G, pile, note] = held;
    void strip; void pile; void note;
    if (held.some((E) => !E) || !G.qq) { Loom.error("qq_held_state", "b12 needs the morning page from b08 to b11"); return; }
    const P = 98, COLS = 12;

    const tSwitch = ctx.cue("Now switch seats");
    const tMsg = ctx.cue("one small message");
    const tUnstuck = ctx.cue("it gets them unstuck");
    const tLands = ctx.cue("The hidden column lands on someone else");
    const tElse = ctx.cue("someone else");

    // ---- the morning becomes the right-hand page: one global transform p -> O + s p for every held element
    const SC = 0.6, OX = 720, OY = 251;
    const toPage = (x, y) => [OX + SC * x, OY + SC * y];
    const travel = (E, t, dur) => {
      const cur = E.__pos || { x: 0, y: 0, s: 1 };
      const to = { x: OX + (SC - 1) * E.x, y: OY + (SC - 1) * E.y, s: SC };
      Loom.drive((e) => E.mover.setAttribute("transform",
        `translate(${(cur.x + (to.x - cur.x) * e).toFixed(2)} ${(cur.y + (to.y - cur.y) * e).toFixed(2)}) scale(${(cur.s + (to.s - cur.s) * e).toFixed(4)})`),
        t, dur, "editorial", { kind: "travel", beat: B, name: E.name, key: "qq.mv." + E.name });
      E.__pos = to;
    };
    held.forEach((E) => travel(E, tSwitch, 1.1));

    // ---- the gutter: the spread's fold draws down the middle as the page moves over
    // @form spread_gutter: a fold line with a soft shadow band down the middle of a two-page spread
    const gut = ctx.el("gutter", { x: 688, y: 250, w: 24, h: 520, kind: "scenery", exit: "recede" });
    const band = Loom.svg("rect", { x: 0, y: 0, width: 24, height: 520, fill: S.c("field2"), opacity: 0.9 }, gut.inner);
    const fold = Loom.svg("path", { d: "M12 0 V520", fill: "none", stroke: S.c("line"), "stroke-width": 2, "stroke-linecap": "round" }, gut.inner);
    Loom.tween(band, { opacity: 0 }, { opacity: 0.9, duration: 0.6, ease: Loom.ease.enter }, tSwitch + 0.4, { kind: "reveal", beat: B, name: "gutter.band" });
    m.draw(fold, tSwitch + 0.4, { dur: 0.9 });

    // ---- the asker's page: their work, stopped; drawn in the same unit at the right page's apparent size
    // @form small_ledger_page: a small paper page holding one row of time units for the other party's work
    const AX = 120, AY = 306, AW = 560, AH = 403;   // ends at 680: clear of the right page, which starts at 720 (the user saw them overlap)
    const A = T.panel(ctx, "asker_page", { x: AX, y: AY, w: AW, h: AH, title: props.asker_title || "Their work", t: tSwitch + 0.7 });
    const cs = 88 * SC, cp = P * SC, n = 9;
    const rowX = (AW - (n * cp - (cp - cs))) / 2, rowY = A.content.y + (A.content.h - cs) / 2 - 10;
    const cellX = (k) => rowX + k * cp;
    const base = Loom.svg("g", {}, A.inner);
    for (let k = 0; k < n; k++) Loom.svg("rect", { x: cellX(k), y: rowY, width: cs, height: cs, rx: 4, fill: "none", stroke: S.c("muted"), "stroke-width": 1.6, opacity: 0.6 }, base);
    for (let k = 0; k < 4; k++) Loom.svg("rect", { x: cellX(k), y: rowY, width: cs, height: cs, rx: 4, fill: S.c("accent4") }, A.inner);
    // their one minute: the message they write
    const inkG = Loom.svg("g", { transform: `translate(${(cellX(4) + cs / 2).toFixed(1)} ${(rowY + cs / 2).toFixed(1)})` }, A.inner);
    const ink = Loom.svg("g", {}, inkG);
    Loom.svg("rect", { x: -cs / 2, y: -cs / 2, width: cs, height: cs, rx: 4, fill: S.c("ink") }, ink);
    Loom.tween(ink, { opacity: 0, scale: 1.35, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: 0.42, ease: Loom.ease.enter }, tMsg + 0.2,
      { kind: "stamp", beat: B, name: "asker_page.ink", content: true });
    Loom.sfx("tick", tMsg + 0.3);
    // unstuck: the work advances one step, growing from the left edge of the next cell
    const step = Loom.svg("rect", { x: cellX(5), y: rowY, width: cs, height: cs, rx: 4, fill: S.c("accent4") }, A.inner);
    Loom.tween(step, { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: 0.6, ease: Loom.ease.move }, tUnstuck + 0.1,
      { kind: "grow", beat: B, name: "asker_page.step", content: true });
    const stepCx = AX + cellX(5) + cs / 2, rowBottom = AY + rowY + cs;
    label("unstuck_label", { x: stepCx + 70, y: rowBottom + 70, text: props.unstuck_label || "unstuck", to: [stepCx, rowBottom + 6], tone: "accent4", role: "label", t: tUnstuck + 0.5 });

    // ---- the message line: from their ink unit, over the fold, into the right page's grid (first question's ink unit)
    // @form carried_line: a thin line drawn from one page into another, carrying a small object along it as it draws
    const p0 = [AX + cellX(4) + cs / 2, AY + rowY - 6];
    const c8 = toPage(195 + (8 % COLS + 0.5) * P, 175 + 5);
    const p1 = [c8[0], c8[1] - 6];
    const ml = ctx.el("message_line", { x: 0, y: 0, w: 0, h: 0, kind: "connector", exit: "recede" });
    const mid = [(p0[0] + p1[0]) / 2, Math.min(p0[1], p1[1]) - 150];
    const path = Loom.svg("path", { d: `M${p0[0].toFixed(1)} ${p0[1].toFixed(1)} Q${mid[0].toFixed(1)} ${mid[1].toFixed(1)} ${p1[0].toFixed(1)} ${p1[1].toFixed(1)}`,
      fill: "none", stroke: S.c("ink"), "stroke-width": 3, "stroke-dasharray": "none", "stroke-linecap": "butt" }, ml.inner);
    const tLine = tLands + 0.1, dLine = 1.1;
    m.draw(path, tLine, { dur: dLine });
    const carry = ctx.el("message_slip", { x: 0, y: 0, w: 0, h: 0, kind: "token", exit: "recede" });
    Loom.svg("rect", { x: -28 + 4, y: -22 + 4, width: 56, height: 44, rx: 3, fill: S.c("shadow"), opacity: 0.14 }, carry.inner);
    Loom.svg("rect", { x: -28, y: -22, width: 56, height: 44, rx: 3, fill: S.c("surface"), stroke: S.c("line"), "stroke-width": 1.5 }, carry.inner);
    kit.text(carry.inner, "?", { role: "body", size: 32, x: -26, y: -21, w: 52, h: 42, maxLines: 1, align: "center", valign: "middle", color: "ink", weight: 700 });
    Loom.tween(carry.inner, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: Loom.ease.enter }, tLine, { kind: "reveal", beat: B, name: "message_slip" });
    m.along(carry, path, tLine, { dur: dLine });
    Loom.sfx("whoosh", tLine + 0.1);

    // ---- the red runs take the accent once as the line arrives (an accent outline round each run, in and out)
    const runs = G.qq.runs || [];
    const flashG = Loom.svg("g", {}, G.qq.layer);
    runs.forEach((run, r) => {
      const lx = (run[0] % COLS) * P + 5 - 8, ty = Math.floor(run[0] / COLS) * P + 5 - 8;
      const o = Loom.svg("rect", { x: lx, y: ty, width: 3 * P - 10 + 16, height: 88 + 16, rx: 8, fill: "none", stroke: S.c("accent"), "stroke-width": 8, opacity: 0 }, flashG);
      const tf = tLine + dLine + r * 0.06;
      Loom.tween(o, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: Loom.ease.enter }, tf, { kind: "emphasis", beat: B, name: `morning_grid.flash.${r}`, content: true });
      Loom.tween(o, { opacity: 1 }, { opacity: 0, duration: 0.6, ease: Loom.ease.exit }, tf + 0.7, { kind: "emphasis", beat: B, name: `morning_grid.flash.${r}.out`, content: true });
    });
    Loom.sfx("reveal", tLine + dLine);

    // ---- 'someone else', lettered under the right page, pointing at its last red run
    const q5 = toPage(195 + (32 % COLS + 0.5) * P, 175 + Math.floor(32 / COLS) * P + P - 5);
    label("someone_label", { x: q5[0] + 120, y: 790, text: props.someone_label || "someone else", to: [q5[0], q5[1] + 6], tone: "accent", role: "label", t: Math.max(tElse, tLine + dLine + 0.2) });
  },
});
