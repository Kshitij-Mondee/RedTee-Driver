// @design swap_and_ledger_cost: a held slot swaps its work for the interruption while a two-column ledger beside it books the visible part and stamps the hidden part as units, named last
/* b03 - the ledger is ruled; the plan is put down for the question; the first hidden cost is stamped and named.
 *
 * Treatments considered (lnd-motion-choreography-loop, pass A):
 *  (A) static composition + signalling: the ledger already ruled, the slip already in the slot, 'switch cost'
 *      highlighted. Rejected: the swap IS the taught event (the plan put down), and the cost must appear when it is
 *      named, so both are changes over time.
 *  (B) a split-screen before/after of the slot. Rejected: two slots on screen says "both at once", the exact
 *      misconception b06 refutes.
 *  (C) CHOSEN: the storyboard's spread re-set exactly as b01 left it (no entrances; the dip join hides the re-set),
 *      the ledger ruled in the bare right half, one ink unit on "To answer", the plan slides down out of the slot
 *      while the corner slip itself travels into the slot (one slip only), three dashed empty runs on "That swap
 *      costs something", the experiment note, then two red units and 'switch cost' on "Switch cost".
 * Converge: the slot keeps one held place; the ledger pre-reserves rows 1 to 3 so nothing re-lays out in b04 to b06.
 * Deliberately not doing: Loom.data.stamp for the units (it creates its own named element per call, and b04/b05/b06
 * hold the ledger by the names visible_units and hidden_units; a child element would be retired at the next join).
 * The cells use the same unit shape and the same stamp motion (1.35x to 1, ease out). Risk: 6 s with no change
 * between "In experiments" and "Switch cost"; the frame is complete and the voice is reading the note.
 *
 * Geometry (storyboard world note): strip y 100 to 140; slot work [200,150,760,780]; ledger x 1040 to 1760, headers
 * y 160 to 230, header rule y 250, column rule x 1400; visible cells from (1060, 280), hidden cells from (1450, 280),
 * cell 48, gap 8, a run per row every 120 px; footnote [1040, 880, 720, 36].
 * Names held by b04: strip, ledger, visible_units, hidden_units, note, footnote. The slot "work" is not kept.
 */
Loom.scene("b03", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const T = Loom.treat;
    const P01 = { plan_title: "The plan", plan_lines: ["Goals for the quarter", "Who owns each step", "Risks we still carry", "Next: the budget"], slip_text: "Quick question?", end_label: "Lunch" };

    const SLOT = { x: 200, y: 150, w: 760, h: 780 };
    const SLIP = { x: 760, y: 190, w: 420, h: 150 };
    const ST = { x: 200, y: 96, w: 1520, h: 48, lineY: 24, len: 1400, step: 50 };
    const LG = { x: 1040, y: 150, w: 720, h: 720, colX: 360, ruleY: 100 };
    const CELL = 48, GAP = 8, ROW = 120;
    const HID = { x: 1440, y: 270 };            // hidden_units origin; cells start at local (10, 10) = station (1450, 280)
    const enter = ctx.style.dur("enter");

    /* ---------------- helpers (the same drawing as b01) ---------------- */
    function wipe(node, box, t, dur) {
      const id = Loom.uid("qqw");
      const defs = Loom.svg("defs", {}, node.parentNode);
      const cp = Loom.svg("clipPath", { id, clipPathUnits: "userSpaceOnUse" }, defs);
      const r = Loom.svg("rect", { x: box.x - 6, y: box.y - 6, width: 0, height: box.h + 12 }, cp);
      node.setAttribute("clip-path", `url(#${id})`);
      Loom.tween(r, { attr: { width: 0 } }, { attr: { width: box.w + 12 }, duration: dur, ease: Loom.ease.move }, t, { kind: "unmask", beat: ctx.beat.id, content: true });
    }
    function stampIn(node, t, name) {
      Loom.tween(node, { opacity: 0, scale: 1.35, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: enter * 0.7, ease: Loom.ease.enter }, t, { kind: "stamp", beat: ctx.beat.id, name, content: true });
    }
    function drawPlan(g, lines) {
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
      kit.rect(g, 50 + F.width + 8, top + 2, 4, F.height - 4, { fill: "field", r: 1, shadow: false, flat: true });   // the caret, where b01 left it
    }
    function drawSlip(g) {
      kit.rect(g, 0, 0, SLIP.w, SLIP.h, { fill: "surface", r: 6 });
      kit.polygon(g, [[SLIP.w - 34, 0], [SLIP.w, 34], [SLIP.w - 34, 34]], { fill: "surface2", flat: true, shadow: false });
      const tx = kit.text(g, P01.slip_text, { role: "body", x: 30, y: 18, w: 300, h: SLIP.h - 36, maxLines: 1, valign: "middle", weight: 700, color: "ink" });
      const ts = tx.lastChild, s = ts.textContent;
      if (s.endsWith("?")) { ts.textContent = s.slice(0, -1); Loom.svg("tspan", { fill: S.c("accent") }, ts, "?"); }
      T.markShape(Loom.svg("g", {}, g), true, 372, SLIP.h / 2, 52, "ink");   // answered (b01)
    }
    // a label in the seed's underline treatment, left-aligned at x, its top at y (drawn into a group, no element)
    function underlineLabel(g, text, x, y, tone) {
      const G = T.labelGeom(0, 0, text, { as: "underline", role: "label" });
      const cx = x + G.tw / 2 - G.padX / 2, cy = y + G.h / 2;
      const lg = Loom.svg("g", {}, g);
      T.labelShape(lg, cx, cy, text, { as: "underline", role: "label", tone });
      return { g: lg, box: { x: x - 4, y, w: G.tw, h: G.h } };
    }

    /* ---------------- cues ---------------- */
    const tAnswer = ctx.cue("To answer");
    const tDown = ctx.cue("you put the plan down");
    const tSwap = ctx.cue("That swap costs something");
    const tExp = ctx.cue("In experiments");
    const tName = ctx.cue("Switch cost");

    /* ---------------- the page re-set exactly as b01 left it (no entrances: the join's cover hides the re-set) ---------------- */
    // an element with no entrance tween is visible from frame 0 on its station, i.e. under b01 on the same page:
    // switch it on at this beat's start (on life, so exits on inner and travels on mover stay untouched)
    const presentFrom = (E, t) => { Loom.set(E.life, { opacity: 0 }, 0); Loom.set(E.life, { opacity: 1 }, t); };
    const strip = ctx.el("strip", { x: ST.x, y: ST.y, w: ST.w, h: ST.h, kind: "instrument", exit: "recede" });
    presentFrom(strip, ctx.start);
    kit.line(strip.inner, 0, ST.lineY, ST.len, ST.lineY, { stroke: "line", sw: 2, crisp: true });
    for (let x = 0; x <= ST.len; x += ST.step) {
      const major = x % 200 === 0;
      kit.line(strip.inner, x, ST.lineY - (major ? 10 : 6), x, ST.lineY + (major ? 10 : 6), { stroke: major ? "line" : "muted", sw: major ? 2.5 : 1.6, crisp: true });
    }
    kit.text(strip.inner, P01.end_label, { role: "label", x: ST.len + 26, y: 0, w: ST.w - ST.len - 26, h: ST.h, maxLines: 1, valign: "middle", weight: 700, color: "ink" });
    // the marker set back to the first tick: we trace that one question
    kit.disc(strip.inner, 0, ST.lineY, 12, { fill: "field", flat: true, shadow: false });
    kit.disc(strip.inner, 0, ST.lineY, 8, { fill: "ink", flat: true, shadow: false });

    const work = Loom.slot(ctx, "work", { x: SLOT.x, y: SLOT.y, w: SLOT.w, h: SLOT.h, frame: "none", pad: 0, t: false });
    const plan = (g) => drawPlan(g, P01.plan_lines);
    plan.slotLabel = "the plan"; plan.floor = 0.8;
    work.show(plan, ctx.start, { how: "recolour", speed: 0.02 });

    /* ---------------- the ledger is ruled as the page clears (structure first) ---------------- */
    // @form two_column_ledger: a header rule and a column rule drawn, two serif column heads dropped above them, each with a short rule under it
    const ledger = ctx.el("ledger", { x: LG.x, y: LG.y, w: LG.w, h: LG.h, kind: "scenery", exit: "recede" });
    const tRule = Math.max(ctx.start + 0.25, tAnswer - 0.25);
    const hRule = kit.line(ledger.inner, 0, LG.ruleY, LG.w, LG.ruleY, { stroke: "line", sw: 3, crisp: true });
    const cRule = kit.line(ledger.inner, LG.colX, 10, LG.colX, 710, { stroke: "line", sw: 2, crisp: true });
    m.draw(hRule, tRule, { dur: 0.55 });
    m.draw(cRule, tRule + 0.2, { dur: 0.7 });
    const heads = [[props.visible_header, 20], [props.hidden_header, 410]].map(([txt, x], i) => {
      const hg = Loom.svg("g", {}, ledger.inner);
      const te = kit.text(hg, txt, { role: "title", x, y: 8, w: 300, h: 76, maxLines: 1, valign: "middle", color: "ink" });
      kit.rect(hg, x, 86, te.__fit.width, 6, { fill: "line", r: 3, shadow: false, flat: true });
      Loom.tween(hg, { opacity: 0, y: -24 }, { opacity: 1, y: 0, duration: enter, ease: Loom.ease.enter }, tRule + 0.35 + i * 0.12, { kind: "drop", beat: ctx.beat.id, name: "ledger.head" + i });
      return hg;
    });
    void heads;

    // the slip lies on top of the page (and over the Visible head) until it is picked up into the slot
    const slip = ctx.el("slip", { x: SLIP.x, y: SLIP.y, w: SLIP.w, h: SLIP.h, kind: "card", exit: "recede" });
    drawSlip(slip.inner);
    presentFrom(slip, ctx.start);

    /* ---------------- you put the plan down: the plan slides down out; the corner slip travels into the slot ---------------- */
    const outEnd = work.clear(tDown, { how: "slide", dir: "down" });
    const sc = SLOT.w / SLIP.w, sh = SLIP.h * sc, sy = SLOT.y + (SLOT.h - sh) / 2;
    const travelEnd = m.travel(slip, tDown + 0.15, { x: SLOT.x - SLIP.x, y: sy - SLIP.y, scale: sc, dur: Math.max(0.8, outEnd - tDown + 0.45) });
    Loom.sfx("card", tDown + 0.2);
    // hand the same drawing to the slot where the slip landed (one slip on screen at every frame)
    const question = (g) => { const k = Loom.svg("g", { transform: `translate(0 ${(sy - SLOT.y).toFixed(2)}) scale(${sc.toFixed(4)})` }, g); drawSlip(k); };
    question.slotLabel = "the question"; question.floor = 0.8;
    work.show(question, travelEnd, { how: "recolour", speed: 0.02 });
    Loom.set(slip.outer, { opacity: 0 }, travelEnd + 0.03);

    /* ---------------- the answer: one ink unit under Visible, lettered, once the slip has been picked up off that column ---------------- */
    // @form ledger_unit: one flat square cell stamped into a ledger column, a run is several in a row
    const vis = ctx.el("visible_units", { x: 1060, y: 280, w: 320, h: 110, kind: "data", exit: "recede" });
    const v0 = Loom.svg("g", {}, vis.inner);
    kit.rect(v0, 0, 0, CELL, CELL, { fill: "ink", r: 6, shadow: false, flat: true });
    const tUnit = Math.max(tAnswer + 0.3, travelEnd - 0.1);   // the travelling slip sweeps over (1060, 280) until it lands
    stampIn(v0, tUnit, "visible_units.0");
    Loom.sfx("tick", tUnit + 0.1);
    const vl = underlineLabel(vis.inner, props.answer_label, 0, CELL + 6, "line");
    wipe(vl.g, vl.box, tUnit + 0.3, enter);

    /* ---------------- That swap costs something: three dashed empty runs (a cost with parts, not yet named) ---------------- */
    // @form dashed_reserved_run: an empty dashed outline holding the place of a run of units still to come
    const hid = ctx.el("hidden_units", { x: HID.x, y: HID.y, w: 320, h: 4 * ROW, kind: "data", exit: "recede" });
    const runW = 4 * CELL + 3 * GAP;
    const dashed = [];
    for (let r = 0; r < 3; r++) {
      const d = kit.rect(hid.inner, 4, 4 + r * ROW, runW + 12, CELL + 12, { fill: "none", stroke: "muted", sw: 2, r: 8, shadow: false, flat: true });
      d.setAttribute("stroke-dasharray", "8 7");
      Loom.tween(d, { opacity: 0 }, { opacity: 1, duration: enter * 0.8, ease: Loom.ease.enter }, tSwap + 0.1 + r * 0.15, { kind: "reveal", beat: ctx.beat.id, name: "hidden_units.slot" + r });
      dashed.push(d);
    }
    // "after a switch": the first reserved run is singled out (muted to ink), the place the named cost will land
    const row1 = dashed[0].querySelector("rect");
    const tAfter = ctx.cue("after a switch");
    Loom.drive((e) => row1.setAttribute("stroke", S.mix(S.c("muted"), S.c("ink"), e)), tAfter, 0.5, "editorial",
      { kind: "recolour", beat: ctx.beat.id, name: "hidden_units.slot0", key: "b03.row1", content: true });

    /* ---------------- In experiments: the note settles beside the dashed rows, on a short leader ---------------- */
    // @form leader_note: a short muted caption beside a group, joined to it by a thin leader ending in a dot
    // the note sits under the visible column; a bracket along the dashed rows says it speaks of all of them
    const note = ctx.el("note", { x: 1060, y: 270, w: 384, h: 330, kind: "label", exit: "recede" });
    const nt = kit.text(note.inner, props.note, { role: "label", x: 0, y: 236, w: 300, h: 84, maxLines: 2, valign: "middle", color: "muted" });
    const ly = 278, bx = 374;
    const leader = kit.path(note.inner, `M${Math.min(300, nt.__fit.width + 14)} ${ly} H${bx} M${bx - 6} 4 H${bx} V306 H${bx - 6}`, { stroke: "muted", sw: 2 });
    m.settle(note, tExp, { dy: 12 });
    m.draw(leader, tExp + 0.2, { dur: 0.5 });

    /* ---------------- Switch cost: two red units stamp into row 1 and are lettered; the footnote ---------------- */
    for (let k = 0; k < 2; k++) {
      const u = Loom.svg("g", {}, hid.inner);
      kit.rect(u, 10 + k * (CELL + GAP), 10, CELL, CELL, { fill: "accent", r: 6, shadow: false, flat: true });
      stampIn(u, tName + k * 0.4, "hidden_units.r1." + k);
      Loom.sfx("tick", tName + k * 0.4 + 0.1);
    }
    const sl = underlineLabel(hid.inner, props.switch_label, 10, 10 + CELL + 6, "accent");
    wipe(sl.g, sl.box, tName + 0.55, enter);

    const foot = ctx.el("footnote", { x: 1040, y: 880, w: 720, h: 36, kind: "text", exit: "recede" });
    kit.text(foot.inner, props.footnote, { role: "label", x: 0, y: 0, w: 720, h: 36, maxLines: 1, valign: "middle", color: "muted", size: 26 });
    m.reveal(foot, tName + 0.7, { dy: 0 });
  },
});
