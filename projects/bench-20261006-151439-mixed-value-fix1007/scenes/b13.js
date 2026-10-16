// @design unfold_and_mark_slot: slot unfolds into empty tier and marks bind to spans
/* Treatments considered:
 * (A) Static callout cards with pointer arrows (rejected: static composition with signalling; tells rather than enacts the unfolding mechanism, failing the motion-as-content gate).
 * (B) Sliding drawer with instant stamp text (rejected: abrupt entrance lacks physical continuity with the draft strips hierarchy).
 * (C) CHOSEN: Mechanical paper unfold of the request strip with fluid accent flood, paired with live drawn annotation marks (box on occasion, underline on action). Motion directly embodies the structural completion of the feedback framework.
 */
Loom.scene("b13", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;

    // 1. Station layout: desk ground and sheet continuity
    // Take held elements from b11 or initialise fallback for standalone testing
    let sit = ctx.held("situation_strip");
    if (!sit) {
      sit = ctx.el("situation_strip", { x: 140, y: 130, w: 880, h: 160, kind: "card", exit: "recede" });
      kit.rect(sit.inner, 0, 0, 880, 160, { fill: "surface", r: 12, stroke: "line", sw: 3 });
      kit.pill(sit.inner, 24, 20, 150, 36, { fill: "surface2" });
      kit.text(sit.inner, "SITUATION", { role: "caption", x: 24, y: 20, w: 150, h: 36, align: "center", valign: "middle", color: "muted", weight: 700 });
      kit.text(sit.inner, "In yesterday's release planning meeting,", { role: "lead", x: 24, y: 72, w: 830, h: 60, valign: "middle", color: "ink" });
    }

    let con = ctx.held("consequence_strip");
    if (!con) {
      con = ctx.el("consequence_strip", { x: 140, y: 310, w: 880, h: 160, kind: "card", exit: "recede" });
      kit.rect(con.inner, 0, 0, 880, 160, { fill: "surface", r: 12, stroke: "line", sw: 3 });
      kit.pill(con.inner, 24, 20, 170, 36, { fill: "surface2" });
      kit.text(consequence_strip.inner, "CONSEQUENCE", { role: "caption", x: 24, y: 20, w: 170, h: 36, align: "center", valign: "middle", color: "muted", weight: 700 });
      kit.text(consequence_strip.inner, "the team could not confirm the delivery milestone,", { role: "lead", x: 24, y: 72, w: 830, h: 60, valign: "middle", color: "ink" });
    }

    let msg = ctx.held("update_message");
    if (!msg) {
      msg = ctx.el("update_message", { x: 1080, y: 130, w: 720, h: 340, kind: "card", exit: "recede" });
      kit.rect(msg.inner, 0, 0, 720, 340, { fill: "surface", r: 16, stroke: "line", sw: 3 });
      kit.pill(msg.inner, 28, 24, 180, 36, { fill: "surface2" });
      kit.text(msg.inner, "UPDATE MESSAGE", { role: "caption", x: 28, y: 24, w: 180, h: 36, align: "center", valign: "middle", color: "muted", weight: 700 });
      kit.rect(msg.inner, 28, 80, 664, 100, { fill: "surface2", r: 10 });
      kit.text(msg.inner, "Status update received without milestone date.", { role: "body", x: 48, y: 80, w: 624, h: 100, valign: "middle", color: "muted" });
      kit.rect(msg.inner, 28, 200, 664, 100, { fill: "field", r: 10, stroke: "line", sw: 2, dash: "4 4" });
      kit.text(msg.inner, "No action taken yet (waiting for clear request)", { role: "body", x: 48, y: 200, w: 624, h: 100, valign: "middle", color: "muted" });
    }

    let plan = ctx.held("planning_note");
    if (!plan) {
      plan = ctx.el("planning_note", { x: 1080, y: 500, w: 720, h: 330, kind: "card", exit: "recede" });
      kit.rect(plan.inner, 0, 0, 720, 330, { fill: "surface", r: 16, stroke: "line", sw: 3 });
      kit.pill(plan.inner, 28, 24, 160, 36, { fill: "surface2" });
      kit.text(plan.inner, "PLANNING NOTE", { role: "caption", x: 28, y: 24, w: 160, h: 36, align: "center", valign: "middle", color: "muted", weight: 700 });
      kit.rect(plan.inner, 28, 80, 664, 210, { fill: "surface2", r: 10 });
      kit.text(plan.inner, "Delivery date shift requires explicit flag in the update message.", { role: "body", x: 48, y: 80, w: 624, h: 210, valign: "middle", color: "ink" });
    }

    // 2. Incoming element: request_strip unfolds below consequence_strip and floods with accent
    const req = ctx.el("request_strip", { x: 140, y: 490, w: 880, h: 250, kind: "card", exit: "recede" });
    kit.rect(req.inner, 0, 0, 880, 250, { fill: "surface", r: 12, stroke: "line", sw: 3 });
    const floodLayer = kit.rect(req.inner, 0, 0, 880, 250, { fill: "accent", r: 12, stroke: "accent", sw: 3 });

    kit.pill(req.inner, 24, 18, 140, 36, { fill: "accent" });
    kit.text(req.inner, "REQUEST", { role: "caption", x: 24, y: 18, w: 140, h: 36, align: "center", valign: "middle", color: "surface", weight: 700 });

    const line1 = kit.text(req.inner, "For the next update,", { role: "lead", x: 28, y: 70, w: 820, h: 50, valign: "middle", color: "ink" });
    const line2 = kit.text(req.inner, "could you flag any changed delivery date,", { role: "lead", x: 28, y: 126, w: 820, h: 50, valign: "middle", color: "ink" });
    const line3 = kit.text(req.inner, "in the message.", { role: "lead", x: 28, y: 182, w: 820, h: 50, valign: "middle", color: "ink" });

    const tUnfold = ctx.cue("For the next update,");
    m.reveal(req, tUnfold, { dy: 24 });

    // 3. Incoming element: occasion_box draws around "For the next update,"
    // @form occasion_marker: hand-drawn bounding box highlighting temporal context
    const occ = ctx.el("occasion_box", { x: 160, y: 550, w: 370, h: 60, kind: "instrument", exit: "recede" });
    const occPath = kit.path(occ.inner, "M 6 6 H 364 V 54 H 6 Z", { stroke: "accent", sw: 4, fill: "none" });
    m.draw(occPath, tUnfold + 0.25, { dur: 0.65 });

    // 4. Incoming element: action_underline draws left-to-right under the action phrase
    // @form action_marker: dynamic underline emphasizing requested behavior
    const act = ctx.el("action_underline", { x: 300, y: 660, w: 460, h: 24, kind: "instrument", exit: "recede" });
    const actPath = kit.path(act.inner, "M 4 12 Q 230 18 456 12", { stroke: "accent", sw: 5, fill: "none" });
    const tAction = ctx.cue("could you flag any changed delivery date,");
    m.draw(actPath, tAction, { dur: 0.75 });

    // 5. Flood settles and accent marks hold focus
    const tSettle = ctx.cue("Write a recognisable request.");
    Loom.tween(floodLayer, { opacity: 0.8 }, { opacity: 0.1, duration: 0.5, ease: Loom.ease.editorial }, tSettle, { kind: "fade_out", beat: ctx.beat.id, content: true });
    m.emphasis(req, tSettle);

    void sit;
    void con;
    void msg;
    void plan;
    void line1;
    void line2;
    void line3;
    void S;
  },
});
