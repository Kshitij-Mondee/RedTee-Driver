// @design draft_strips_continued: connector ties entry to reference while target slot remains unlinked
/*
 * Beat b11: Consequence strip linked to planning note, showing work impact without motive.
 *
 * Treatments considered:
 * 1. Treatment A (Static card layout with signaling badges): Both consequence and motive
 *    slots placed statically with a checkmark and cross mark from the start.
 *    Rejected: Fails the animation gate (motion_is: content) and fails to show the causal
 *    grounding as an active process.
 * 2. Treatment B (Two-column comparison layout): A split screen showing "Work planning"
 *    vs "Colleague motive" with side-by-side reveals.
 *    Rejected: Breaks the held station layout and sheet continuity established in b09.
 * 3. Treatment C (CHOSEN - Motion as content): The consequence strip drops into place
 *    on the draft sheet directly beneath the situation strip. A connector thread draws
 *    from the consequence strip into the unchanged planning note, which pulses once to
 *    confirm the concrete workplace impact. An unconnected motive gap appears with no
 *    thread reaching the colleague side, proving that consequence does not establish motive.
 */
Loom.scene("b11", {
  build(ctx) {
    const { kit, m } = ctx;

    // Station continuity: take over elements held from b09 if present
    const heldDraft = ctx.held("draft_sheet") || ctx.held("draft");
    const heldUpdate = ctx.held("update_message") || ctx.held("update");
    const heldSituation = ctx.held("situation_strip") || ctx.held("situation");
    let planningNote = ctx.held("planning_note");

    // Base background layout if not already held on the station
    if (!heldUpdate) {
      // @form update_message: colleague project update card on left
      const updateEl = ctx.el("update_message", { x: 100, y: 120, w: 780, h: 760, kind: "card", exit: "none" });
      kit.card(updateEl.inner, 0, 0, 780, 760, { fill: "surface", stroke: "line", r: 10 });
      kit.kicker(updateEl.inner, "PROJECT UPDATE", { x: 36, y: 32, w: 700, h: 28, color: "muted" });
      kit.text(updateEl.inner, "Project update", { role: "lead", x: 36, y: 64, w: 700, h: 48, color: "ink", weight: 700 });
    }

    if (!heldDraft) {
      // @form draft_sheet: feedback draft sheet on right
      const draftEl = ctx.el("draft_sheet", { x: 960, y: 120, w: 840, h: 760, kind: "card", exit: "none" });
      kit.card(draftEl.inner, 0, 0, 840, 760, { fill: "surface", stroke: "line", r: 10 });
      kit.kicker(draftEl.inner, "FEEDBACK DRAFT", { x: 36, y: 32, w: 760, h: 28, color: "muted" });
      kit.text(draftEl.inner, "Feedback draft", { role: "lead", x: 36, y: 64, w: 760, h: 48, color: "ink", weight: 700 });
    }

    // Situation strip: position reference for the consequence strip
    let sitX = 1000;
    let sitY = 230;
    let sitW = 760;
    let sitH = 120;

    if (heldSituation) {
      sitX = heldSituation.x;
      sitY = heldSituation.y;
      sitW = heldSituation.w;
      sitH = heldSituation.h;
    } else {
      // @form situation_strip: context strip held from prior beat
      const sitEl = ctx.el("situation_strip", { x: sitX, y: sitY, w: sitW, h: sitH, kind: "card", exit: "none" });
      kit.card(sitEl.inner, 0, 0, sitW, sitH, { fill: "surface", stroke: "line", r: 10 });
      kit.pill(sitEl.inner, 24, 18, 140, 36, { fill: "surface2" });
      kit.text(sitEl.inner, "SITUATION", { role: "caption", x: 24, y: 18, w: 140, h: 36, align: "center", valign: "middle", color: "ink", weight: 700 });
      kit.text(sitEl.inner, "In yesterday's release planning meeting,", { role: "lead", x: 180, y: 18, w: sitW - 204, h: sitH - 36, valign: "middle", color: "ink" });
    }

    // 1. Planning note: the grounded workplace reference on the desk
    const noteX = 140;
    const noteY = 340;
    const noteW = 700;
    const noteH = 180;

    if (!planningNote) {
      // @form planning_note: memo card prop on desk representing concrete work plan
      planningNote = ctx.el("planning_note", { x: noteX, y: noteY, w: noteW, h: noteH, kind: "card", exit: "none" });
      kit.card(planningNote.inner, 0, 0, noteW, noteH, { fill: "surface", stroke: "line", r: 10 });
      kit.pill(planningNote.inner, 24, 18, 170, 36, { fill: "surface2" });
      kit.text(planningNote.inner, "PLANNING NOTE", { role: "caption", x: 24, y: 18, w: 170, h: 36, align: "center", valign: "middle", color: "ink", weight: 700 });
      kit.text(planningNote.inner, "I used the old date to plan my work.", { role: "body", x: 24, y: 68, w: noteW - 48, h: noteH - 84, color: "ink" });
    }

    // 2. Consequence strip: drops in directly beneath situation strip
    const conX = sitX;
    const conY = sitY + sitH + 20;
    const conW = sitW;
    const conH = 120;

    // @form consequence_strip: feedback strip card with type pill and work consequence
    const consequenceStrip = ctx.el("consequence_strip", { x: conX, y: conY, w: conW, h: conH, kind: "card", exit: "recede" });
    kit.card(consequenceStrip.inner, 0, 0, conW, conH, { fill: "surface", stroke: "line", r: 10 });
    // Saturated accent only on consequence line (accent_on)
    kit.rect(consequenceStrip.inner, 0, 0, 8, conH, { fill: "accent", r: 0 });
    kit.pill(consequenceStrip.inner, 24, 18, 180, 38, { fill: "accent" });
    kit.text(consequenceStrip.inner, "CONSEQUENCE", { role: "caption", x: 24, y: 18, w: 180, h: 38, align: "center", valign: "middle", color: "surface", weight: 700 });
    kit.text(consequenceStrip.inner, "I used the old date to plan my work.", { role: "lead", x: 220, y: 18, w: conW - 240, h: conH - 36, valign: "middle", color: "ink" });

    const tDrop = ctx.cue("I used the old date");
    m.drop(consequenceStrip, tDrop);

    // 3. Thread: connector draws into its target (planning note)
    const startX = conX;
    const startY = conY + conH / 2;
    const targetX = planningNote.x + planningNote.w;
    const targetY = planningNote.y + planningNote.h / 2;

    const bX = Math.min(startX, targetX);
    const bY = Math.min(startY, targetY) - 10;
    const bW = Math.max(Math.abs(startX - targetX), 20);
    const bH = Math.max(Math.abs(startY - targetY) + 20, 20);

    const lx1 = startX - bX;
    const ly1 = startY - bY;
    const lx2 = targetX - bX;
    const ly2 = targetY - bY;

    // @form thread_connector: connector line drawing into target planning note
    const thread = ctx.el("thread", { x: bX, y: bY, w: bW, h: bH, kind: "connector", exit: "recede" });
    const threadPath = `M ${lx1} ${ly1} C ${lx1 - 80} ${ly1}, ${lx2 + 80} ${ly2}, ${lx2} ${ly2}`;
    kit.path(thread.inner, threadPath, { stroke: "accent2", sw: 4, fill: "none" });

    const tThread = ctx.cue("to plan my work");
    m.draw(thread, tThread, { dur: 0.55 });

    // 4. Planning note pulse: single pulse on spoken anchor
    const tPulse = ctx.cue("why it mattered at work");
    m.emphasis(planningNote, tPulse);

    // 5. Motive gap: unconnected dotted outline on colleague side; no thread reaches it
    const gapX = noteX;
    const gapY = noteY + noteH + 30;
    const gapW = noteW;
    const gapH = 140;

    // @form motive_gap: unconnected dashed boundary card representing absent motive
    const motiveGap = ctx.el("motive_gap", { x: gapX, y: gapY, w: gapW, h: gapH, kind: "card", exit: "recede" });
    kit.rect(motiveGap.inner, 0, 0, gapW, gapH, { fill: "surface2", stroke: "muted", sw: 3, r: 10, dash: [8, 6] });
    kit.pill(motiveGap.inner, 24, 18, 190, 36, { fill: "field2" });
    kit.text(motiveGap.inner, "COLLEAGUE MOTIVE", { role: "caption", x: 24, y: 18, w: 190, h: 36, align: "center", valign: "middle", color: "muted", weight: 700 });
    kit.text(motiveGap.inner, "Does not establish motive", { role: "body", x: 24, y: 70, w: gapW - 48, h: gapH - 84, color: "muted" });

    const tMotive = ctx.cue("does not establish motive");
    m.reveal(motiveGap, tMotive, { dy: 10 });
  },
});
