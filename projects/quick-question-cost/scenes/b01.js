// @design held_work_against_running_time: one piece of work sits still in a held slot while a time strip runs to its end; an interruption lands on the work, is answered, and the work has not moved
/* b01 - the hook. The plan held in its slot, a quick question lands on it, time runs to lunch, the plan is where it was.
 *
 * Treatments considered (lnd-motion-choreography-loop, pass A):
 *  (A) static composition + signalling: the page, the slip and 'Lunch' all present, one underline at the end.
 *      Rejected: the hook IS a contrast between two things changing at different rates (time runs, the work does
 *      not); a still frame cannot show "the plan did not move while the morning did".
 *  (B) a clock face beside the plan whose hands sweep to noon. Rejected: a second object competing with the plan
 *      for the focal point, and the strip is the lesson's returning time device (b08, b16, b18 reuse it).
 *  (C) CHOSEN: the storyboard's spread. Camera static. The plan settles into the slot (Loom.slot "work", frame none),
 *      the strip draws underneath; the slip slides in and lands on the page's corner; its words print with the
 *      accent on the "?"; one tick of the strip (the minute) and an answer tick; the marker runs to Lunch; the
 *      caret has not moved; one underline points at it. Right half left as bare paper on purpose (b03 rules the
 *      ledger there).
 * Converge: what moves is time and the interruption; what holds is the work. Not doing: no ambient drift on the
 * page (its stillness is the point), no person. Risk: the right half reads empty; mitigated by the strip spanning
 * the full width and the slip overlapping into the right half (composed negative space, value script "light").
 *
 * Geometry contract (storyboard continuity): slot "work" [200,150,760,780] = document.page side left; the plan is
 * drawn exactly like document.page (ink page r18, accent4 header 92 px, notebook-pen icon at (52,46) size 40, title
 * at x 90, body lines at y 130 + i*118, h 102, x 50, w 660). The slip ends at [760,190,420,150] with its tick (b02's
 * fill join grows from that box). Names: strip, work, slip.
 */
Loom.scene("b01", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const T = Loom.treat;

    const SLOT = { x: 200, y: 150, w: 760, h: 780 };
    const SLIP = { x: 760, y: 190, w: 420, h: 150 };
    const ST = { x: 200, y: 96, w: 1520, h: 48, lineY: 24, len: 1400, step: 50 };

    /* ---------------- helpers (local; the same drawing is repeated in b03, b06, b16) ---------------- */
    // a clip-rect wipe on one node (unmask on a part of an element, never the whole element)
    function wipe(node, box, t, dur) {
      const id = Loom.uid("qqw");
      const defs = Loom.svg("defs", {}, node.parentNode);
      const cp = Loom.svg("clipPath", { id, clipPathUnits: "userSpaceOnUse" }, defs);
      const r = Loom.svg("rect", { x: box.x - 6, y: box.y - 6, width: 0, height: box.h + 12 }, cp);
      node.setAttribute("clip-path", `url(#${id})`);
      Loom.tween(r, { attr: { width: 0 } }, { attr: { width: box.w + 12 }, duration: dur, ease: Loom.ease.move }, t, { kind: "unmask", beat: ctx.beat.id, content: true });
    }
    // @form plan_page: a dark notes page with a coloured header band, an icon and a title, and body lines in the light colour
    function drawPlan(g, lines) {
      kit.rect(g, 0, 0, SLOT.w, SLOT.h, { fill: "ink", r: 18 });
      kit.rect(g, 0, 0, SLOT.w, 92, { fill: "accent4", r: 18, shadow: false, flat: true });
      kit.rect(g, 0, 60, SLOT.w, 32, { fill: "accent4", r: 0, shadow: false, flat: true });
      kit.icon(g, "notebook-pen", { x: 52, y: 46, size: 40, color: S.pickTokenOn("accent4") });
      kit.text(g, props.plan_title, { role: "lead", x: 90, y: 0, w: SLOT.w - 120, h: 92, maxLines: 1, valign: "middle", weight: 800, color: S.pickTokenOn("accent4") });
      const lh = Math.min(118, (SLOT.h - 150) / lines.length);
      lines.forEach((ln, i) => kit.text(g, ln, { role: "body", x: 50, y: 130 + i * lh, w: SLOT.w - 100, h: lh - 16, maxLines: 2, valign: "middle", color: "field" }));
      // where the writing stopped: the end of the last line
      const last = lines.length - 1;
      const F = kit.fit(lines[last], { role: "body", w: SLOT.w - 100, h: lh - 16, maxLines: 2 });
      const top = 130 + last * lh + (lh - 16 - F.height) / 2;
      return { x: 50 + F.width, top, bottom: top + F.height, size: F.size };
    }
    // @form question_slip: a small paper note with an offset shadow carrying one short question, and a box for a tick
    function drawSlip(g) {
      kit.rect(g, 0, 0, SLIP.w, SLIP.h, { fill: "surface", r: 6 });
      kit.polygon(g, [[SLIP.w - 34, 0], [SLIP.w, 34], [SLIP.w - 34, 34]], { fill: "surface2", flat: true, shadow: false });
      const tx = kit.text(g, props.slip_text, { role: "body", x: 30, y: 18, w: 300, h: SLIP.h - 36, maxLines: 1, valign: "middle", weight: 700, color: "ink" });
      // the accent sits on the question mark only (accent_on): split the last glyph into its own tspan
      const ts = tx.lastChild, s = ts.textContent;
      if (s.endsWith("?")) {
        ts.textContent = s.slice(0, -1);
        Loom.svg("tspan", { fill: S.c("accent") }, ts, "?");
      }
      const tick = Loom.svg("g", {}, g);
      T.markShape(tick, true, 372, SLIP.h / 2, 52, "ink");
      return { text: tx, tick, textBox: { x: 30, y: 18, w: 300, h: SLIP.h - 36 } };
    }

    /* ---------------- cues (all spoken in this beat) ---------------- */
    const tPlan = ctx.cue("Say you are deep in a plan");
    const tLands = ctx.cue("A message lands");
    const tQuick = ctx.cue("Quick question");
    const tMinute = ctx.cue("It takes a minute to answer");
    const tAnswer = ctx.cue("to answer");
    const tLunch = ctx.cue("by lunch");
    const tLeft = ctx.cue("where you left it");

    /* ---------------- the work: the plan settles into its slot (scaffold first) ---------------- */
    let caret = null, under = null, endAt = null;
    const work = Loom.slot(ctx, "work", { x: SLOT.x, y: SLOT.y, w: SLOT.w, h: SLOT.h, frame: "none", pad: 0 });
    const planContent = (g) => {
      endAt = drawPlan(g, props.plan_lines);
      // @form text_caret: a thin upright bar at the end of a written line, blinking where the writing stopped
      caret = kit.rect(g, endAt.x + 8, endAt.top + 2, 4, endAt.bottom - endAt.top - 4, { fill: "field", r: 1, shadow: false, flat: true });
      // @form pointing_underline: one stroke drawn under a line of text to point at it
      under = kit.line(g, 50, endAt.bottom + 10, endAt.x + 14, endAt.bottom + 10, { stroke: "field", sw: 4 });
      Loom.set(under, { opacity: 0 }, 0);
    };
    planContent.slotLabel = "the plan"; planContent.floor = 0.8;
    // the hook opens on the page itself (a cut from black): the plan is in place within the first half second
    const tIn = ctx.start + 0.02;
    work.show(planContent, tIn, { how: "swap" });

    /* ---------------- the time strip draws underneath, quiet staging ---------------- */
    // @form time_strip: a hairline axis of the hours with short ticks, a marker on it and the end of the run named at the right
    const strip = ctx.el("strip", { x: ST.x, y: ST.y, w: ST.w, h: ST.h, kind: "instrument", exit: "recede" });
    const axis = Loom.svg("g", {}, strip.inner);
    kit.line(axis, 0, ST.lineY, ST.len, ST.lineY, { stroke: "line", sw: 2, crisp: true });
    for (let x = 0; x <= ST.len; x += ST.step) {
      const major = x % 200 === 0;
      kit.line(axis, x, ST.lineY - (major ? 10 : 6), x, ST.lineY + (major ? 10 : 6), { stroke: major ? "line" : "muted", sw: major ? 2.5 : 1.6, crisp: true });
    }
    const lunchG = Loom.svg("g", {}, strip.inner);
    const lunchBox = { x: ST.len + 26, y: 0, w: ST.w - ST.len - 26, h: ST.h };
    kit.text(lunchG, props.end_label, Object.assign({ role: "label", maxLines: 1, valign: "middle", weight: 700, color: "ink" }, lunchBox));
    const marker = Loom.svg("g", {}, strip.inner);
    kit.disc(marker, 0, ST.lineY, 12, { fill: "field", flat: true, shadow: false });
    kit.disc(marker, 0, ST.lineY, 8, { fill: "ink", flat: true, shadow: false });
    m.reveal(strip, Math.max(ctx.start + 0.1, tPlan + 0.1), { dy: 0, dur: 0.3 });
    wipe(axis, { x: 0, y: 0, w: ST.len, h: ST.h }, Math.max(ctx.start + 0.1, tPlan + 0.1), ctx.style.dur("draw") * 1.6);
    Loom.set(lunchG, { opacity: 0 }, 0);
    // the marker's position along the strip: one keyed drive chain (only the first renders its start state)
    let mx = 0;
    const moveMarker = (to, t, dur, ease) => {
      const a = mx, b = to; mx = to;
      Loom.drive((e) => marker.setAttribute("transform", `translate(${(a + (b - a) * e).toFixed(2)} 0)`), t, dur, ease,
        { kind: "value_travel", beat: ctx.beat.id, name: "strip.marker", key: "strip.marker", content: true });
    };

    /* ---------------- the slip lands on the plan's top right corner ---------------- */
    const slip = ctx.el("slip", { x: SLIP.x, y: SLIP.y, w: SLIP.w, h: SLIP.h, kind: "card", exit: "recede" });
    const sl = drawSlip(slip.inner);
    m.converge(slip, tLands + 0.1, { from: "right", dist: 980, dur: ctx.style.dur("enter") * 1.4 });
    Loom.sfx("card", tLands + 0.35);
    // its words print on "Quick question", the question mark already in the accent
    Loom.set(sl.text, { opacity: 0 }, 0);
    Loom.set(sl.text, { opacity: 1 }, tQuick);
    wipe(sl.text, sl.textBox, tQuick, ctx.style.dur("enter") * 1.2);

    /* ---------------- the minute: one tick on the strip, a tick on the slip ---------------- */
    moveMarker(ST.step, tMinute + 0.2, 0.5, "move");
    Loom.tween(sl.tick, { opacity: 0, scale: 1.3, transformOrigin: "50% 50%" }, { opacity: 1, scale: 1, duration: ctx.style.dur("enter") * 0.7, ease: Loom.ease.enter }, tAnswer, { kind: "stamp", beat: ctx.beat.id, name: "slip.tick", content: true });
    Loom.sfx("tick", tAnswer + 0.1);

    /* ---------------- by lunch: the marker runs to the end, 'Lunch' sets as it arrives ---------------- */
    const runDur = 2.0;
    moveMarker(ST.len, tLunch, runDur, "editorial");
    Loom.set(lunchG, { opacity: 1 }, tLunch + runDur * 0.8);
    wipe(lunchG, lunchBox, tLunch + runDur * 0.8, ctx.style.dur("enter"));

    /* ---------------- the caret: blinking at fixed times (period-locked, 1 Hz), steady once it is pointed at ---------------- */
    const tPoint = Math.max(tLeft + 0.1, tLunch + runDur + 0.1);
    const t0 = tIn + 0.9;
    for (let t = t0 + 0.5; t < tPoint; t += 1.0) {
      Loom.set(caret, { opacity: 0 }, t);
      Loom.set(caret, { opacity: 1 }, Math.min(t + 0.5, tPoint));
    }
    // nothing in the plan has moved: one stroke under the last line points at where it stopped
    Loom.set(under, { opacity: 1 }, tPoint);
    m.draw(under, tPoint, { dur: 0.6 });
  },
});
