// @design held_page_returns_changed: the opening page comes back set the same way, now carrying the habit on its time strip and the batched cost in its ledger
/* b16 - habit two, on the page we started from: focus time on the strip, a lane left open for the urgent, the habit
 * fading and re-inked.
 *
 * Treatments considered:
 *  (A) a list card "focus time / urgent route". Rejected: b15 is already a list; the payoff is the opening page,
 *      changed (callback), so the habit is drawn ON the page's own time device.
 *  (B) a calendar with a blocked slot. Rejected: a new object; the strip IS the morning in this lesson.
 *  (C) CHOSEN: the camera pans back to the spread, re-set exactly as b01/b03 drew it (no entrances, the pan lands
 *      on it): the plan in its slot with the caret, the strip, the ledger now holding the batched morning (five ink
 *      units, one short red run), and the tray of five answered slips. On the words, a hatched block fills part of
 *      the strip ("focus time"), a narrow lane parts at its edge ("urgent route"), the trial tag sits on the strip,
 *      the hatch thins when the habit fades and is re-inked on "Keep it up".
 *
 * Geometry (storyboard): strip x 200 y 96 w 1520 h 48 (axis at y 120, 1400 long); slot work [200,150,760,780];
 * ledger x 1040 to 1760 from y 150; visible cells from (1060, 280); hidden cells from (1450, 280); footnote
 * [1040, 880, 720, 36]; tray [1040, 760, 720, 110] (b19's fill grows from it).
 * Names kept by b17 and b18: strip, ledger, visible_units, hidden_units, footnote, tray, focus_block.
 */
Loom.scene("b16", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const T = Loom.treat;
    const B = ctx.beat.id;
    const P01 = { plan_title: "The plan", plan_lines: ["Goals for the quarter", "Who owns each step", "Risks we still carry", "Next: the budget"], end_label: "Lunch" };
    const SLOT = { x: 200, y: 150, w: 760, h: 780 };
    const ST = { x: 200, y: 96, w: 1520, h: 48, lineY: 24, len: 1400, step: 50 };
    const LG = { x: 1040, y: 150, w: 720, h: 600, colX: 360, ruleY: 100 };
    const CELL = 48, GAP = 8;
    const enter = ctx.style.dur("enter");

    const presentFrom = (E, t) => { Loom.set(E.life, { opacity: 0 }, 0); Loom.set(E.life, { opacity: 1 }, t); };
    function wipe(node, box, t, dur) {
      const id = Loom.uid("qqw");
      const defs = Loom.svg("defs", {}, node.parentNode);
      const cp = Loom.svg("clipPath", { id, clipPathUnits: "userSpaceOnUse" }, defs);
      const r = Loom.svg("rect", { x: box.x - 6, y: box.y - 6, width: 0, height: box.h + 12 }, cp);
      node.setAttribute("clip-path", `url(#${id})`);
      Loom.tween(r, { attr: { width: 0 } }, { attr: { width: box.w + 12 }, duration: dur, ease: Loom.ease.move }, t, { kind: "unmask", beat: B, content: true });
      return r;
    }
    function underlineLabel(g, text, x, y, tone) {
      const G = T.labelGeom(0, 0, text, { as: "underline", role: "label" });
      const lg = Loom.svg("g", {}, g);
      T.labelShape(lg, x + G.tw / 2 - G.padX / 2, y + G.h / 2, text, { as: "underline", role: "label", tone });
      return lg;
    }
    function drawPlan(g) {
      const lines = P01.plan_lines;
      kit.rect(g, 0, 0, SLOT.w, SLOT.h, { fill: "ink", r: 18 });
      kit.rect(g, 0, 0, SLOT.w, 92, { fill: "accent4", r: 18, shadow: false, flat: true });
      kit.rect(g, 0, 60, SLOT.w, 32, { fill: "accent4", r: 0, shadow: false, flat: true });
      kit.icon(g, "notebook-pen", { x: 52, y: 46, size: 40, color: S.pickTokenOn("accent4") });
      kit.text(g, P01.plan_title, { role: "lead", x: 90, y: 0, w: SLOT.w - 120, h: 92, maxLines: 1, valign: "middle", weight: 800, color: S.pickTokenOn("accent4") });
      const lh = Math.min(118, (SLOT.h - 150) / lines.length);
      lines.forEach((ln, i) => kit.text(g, ln, { role: "body", x: 50, y: 130 + i * lh, w: SLOT.w - 100, h: lh - 16, maxLines: 2, valign: "middle", color: "field" }));
      const last = lines.length - 1;
      const F = kit.fit(lines[last], { role: "body", w: SLOT.w - 100, h: lh - 16, maxLines: 2 });
      const top = 130 + last * lh + (lh - 16 - F.height) / 2;
      kit.rect(g, 50 + F.width + 8, top + 2, 4, F.height - 4, { fill: "field", r: 1, shadow: false, flat: true });
    }

    const tFocus = ctx.cue("Agree focus time");
    const tUrgent = ctx.cue("a route for the truly urgent");
    const tTrial = ctx.cue("One team tried quiet hours");
    const tFaded = ctx.cue("Then the habit faded");
    const tKeep = ctx.cue("Keep it up");
    const t0 = ctx.start;

    /* ---------------- the page, re-set as b01 and b03 drew it (the pan lands on it) ---------------- */
    const strip = ctx.el("strip", { x: ST.x, y: ST.y, w: ST.w, h: ST.h, kind: "instrument", exit: "recede" });
    presentFrom(strip, t0);
    kit.line(strip.inner, 0, ST.lineY, ST.len, ST.lineY, { stroke: "line", sw: 2, crisp: true });
    for (let x = 0; x <= ST.len; x += ST.step) {
      const major = x % 200 === 0;
      kit.line(strip.inner, x, ST.lineY - (major ? 10 : 6), x, ST.lineY + (major ? 10 : 6), { stroke: major ? "line" : "muted", sw: major ? 2.5 : 1.6, crisp: true });
    }
    kit.text(strip.inner, P01.end_label, { role: "label", x: ST.len + 26, y: 0, w: ST.w - ST.len - 26, h: ST.h, maxLines: 1, valign: "middle", weight: 700, color: "ink" });

    const work = Loom.slot(ctx, "work", { x: SLOT.x, y: SLOT.y, w: SLOT.w, h: SLOT.h, frame: "none", pad: 0, t: false });
    const plan = (g) => drawPlan(g);
    plan.slotLabel = "the plan"; plan.floor = 0.8;
    work.show(plan, t0, { how: "recolour", speed: 0.02 });

    const ledger = ctx.el("ledger", { x: LG.x, y: LG.y, w: LG.w, h: LG.h, kind: "scenery", exit: "recede" });
    presentFrom(ledger, t0);
    kit.line(ledger.inner, 0, LG.ruleY, LG.w, LG.ruleY, { stroke: "line", sw: 3, crisp: true });
    kit.line(ledger.inner, LG.colX, 10, LG.colX, LG.h - 10, { stroke: "line", sw: 2, crisp: true });
    [["Visible", 20], ["Hidden", 410]].forEach(([txt, x]) => {
      const te = kit.text(ledger.inner, txt, { role: "title", x, y: 8, w: 300, h: 76, maxLines: 1, valign: "middle", color: "ink" });
      kit.rect(ledger.inner, x, 86, te.__fit.width, 6, { fill: "line", r: 3, shadow: false, flat: true });
    });

    // the batched morning: the same five answers (ink), one short hidden run (red), lettered
    const vis = ctx.el("visible_units", { x: 1060, y: 280, w: 320, h: 110, kind: "data", exit: "recede" });
    presentFrom(vis, t0);
    for (let k = 0; k < 5; k++) kit.rect(vis.inner, k * (CELL + GAP), 0, CELL, CELL, { fill: "ink", r: 6, shadow: false, flat: true });
    underlineLabel(vis.inner, props.same_label || "same minutes", 0, CELL + 6, "line");
    const hid = ctx.el("hidden_units", { x: 1440, y: 270, w: 320, h: 120, kind: "data", exit: "recede" });
    presentFrom(hid, t0);
    for (let k = 0; k < 3; k++) kit.rect(hid.inner, 10 + k * (CELL + GAP), 10, CELL, CELL, { fill: "accent", r: 6, shadow: false, flat: true });
    underlineLabel(hid.inner, "one switch, one return", 10, 10 + CELL + 6, "accent");

    const foot = ctx.el("footnote", { x: 1040, y: 880, w: 720, h: 36, kind: "text", exit: "recede" });
    presentFrom(foot, t0);
    kit.text(foot.inner, "Unit sizes are illustrative", { role: "label", x: 0, y: 0, w: 720, h: 36, maxLines: 1, valign: "middle", color: "muted", size: 26 });

    // @form answer_tray: a shallow tray holding several small answered notes, labelled with the time they are answered
    const tray = ctx.el("tray", { x: 1040, y: 760, w: 720, h: 110, kind: "card", exit: "recede" });
    presentFrom(tray, t0);
    kit.rect(tray.inner, 0, 0, 720, 110, { fill: "surface", stroke: "line", sw: 2, r: 10 });
    kit.text(tray.inner, props.tray_label || "agreed time", { role: "label", x: 24, y: 0, w: 240, h: 110, maxLines: 1, valign: "middle", weight: 700, color: "ink" });
    for (let k = 0; k < 5; k++) {
      const sx = 290 + k * 82;
      kit.rect(tray.inner, sx, 22 + (k % 2) * 6, 70, 60, { fill: "surface2", stroke: "line", sw: 1.5, r: 4, shadow: false });
      T.markShape(Loom.svg("g", {}, tray.inner), true, sx + 35, 52 + (k % 2) * 6, 30, "ink");
    }

    /* ---------------- focus time: a hatched block fills part of the strip ---------------- */
    const FB = { w: 760, h: ST.h };
    const focus = ctx.el("focus_block", { x: ST.x, y: ST.y, w: 1220, h: ST.h, kind: "data", exit: "recede" });
    const pid = Loom.uid("hatch");
    const defs = Loom.svg("defs", {}, focus.inner);
    const pat = Loom.svg("pattern", { id: pid, width: 14, height: 14, patternUnits: "userSpaceOnUse", patternTransform: "rotate(45)" }, defs);
    Loom.svg("rect", { x: 0, y: 0, width: 5, height: 14, fill: S.c("ink") }, pat);
    // @form hatched_block: a block of a time axis shaded in ink hatch and lettered, a protected stretch of time
    const block = Loom.svg("g", {}, focus.inner);
    const hatch = Loom.svg("rect", { x: 0, y: 0, width: FB.w, height: FB.h, rx: 6, fill: `url(#${pid})`, opacity: 0.55 }, block);
    kit.rect(block, 0, 0, FB.w, FB.h, { fill: "none", stroke: "ink", sw: 2.5, r: 6, shadow: false });
    const fl = Loom.svg("g", {}, block);
    const flw = Math.ceil(kit.measure(props.focus_label || "focus time", "label", 24, 700)) + 48;
    kit.rect(fl, FB.w / 2 - flw / 2, 2, flw, FB.h - 4, { fill: "field", r: 6, shadow: false, flat: true });
    kit.text(fl, props.focus_label || "focus time", { role: "label", size: 24, x: FB.w / 2 - flw / 2 + 12, y: 2, w: flw - 24, h: FB.h - 4, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "ink" });
    focus.revealT = tFocus;
    Loom.set(block, { opacity: 0 }, 0);
    Loom.set(block, { opacity: 1 }, tFocus);
    wipe(block, { x: 0, y: 0, w: FB.w, h: FB.h }, tFocus, 0.9);
    Loom.sfx("reveal", tFocus);

    /* ---------------- a route for the truly urgent: a narrow lane parts at the block's edge ---------------- */
    const lane = Loom.svg("g", {}, focus.inner);
    const ln = kit.rect(lane, FB.w + 6, 2, 40, FB.h - 4, { fill: "none", stroke: "accent", sw: 2.5, r: 6, shadow: false });
    ln.setAttribute("stroke-dasharray", "6 5");
    const ul = props.urgent_label || "urgent route";
    const ulw = Math.ceil(kit.measure(ul, "label", 24, 700)) + 48;
    kit.rect(lane, FB.w + 58, 2, ulw, FB.h - 4, { fill: "field", stroke: "accent", sw: 2, r: 6, shadow: false, flat: true });
    kit.text(lane, ul, { role: "label", size: 24, x: FB.w + 70, y: 2, w: ulw - 24, h: FB.h - 4, align: "center", valign: "middle", maxLines: 1, weight: 700, color: "ink" });
    m.reveal({ inner: lane, name: "focus_block.lane" }, tUrgent + 0.1, { dy: 0 });

    /* ---------------- one team's trial: the tag sits on the strip ---------------- */
    const tag = Loom.svg("g", {}, focus.inner);
    const tt = props.trial_tag || "One team's trial";
    const ttw = Math.ceil(kit.measure(tt, "label", 24, 400)) + 48;
    const tx = FB.w + 58 + ulw + 16;
    kit.rect(tag, tx, 2, ttw, FB.h - 4, { fill: "surface", stroke: "line", sw: 1.5, r: 6, shadow: false, flat: true });
    kit.text(tag, tt, { role: "label", size: 24, x: tx + 12, y: 2, w: ttw - 24, h: FB.h - 4, align: "center", valign: "middle", maxLines: 1, color: "muted" });
    m.reveal({ inner: tag, name: "focus_block.tag" }, tTrial + 0.1, { dy: 0 });

    /* ---------------- the habit fades, then is re-inked ---------------- */
    Loom.drive((e) => hatch.setAttribute("opacity", (0.55 - 0.4 * e).toFixed(3)), tFaded + 0.3, 1.2, "editorial", { kind: "recolour", beat: B, name: "focus_block", key: "b16.hatch", content: true });
    Loom.drive((e) => hatch.setAttribute("opacity", (0.15 + 0.4 * e).toFixed(3)), tKeep + 0.05, 0.8, "enter", { kind: "recolour", beat: B, name: "focus_block", key: "b16.hatch", content: true });
    Loom.sfx("tick", tKeep + 0.1);
    void enter;
  },
});
