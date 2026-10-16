// @design demand_slip_stalled_work: authoritative order dropped on desk with surface acknowledgement while core work remains stalled
/*
 * Three treatments considered:
 * 1. Animated dialogue bubbles with moving character gestures (rejected: character nod anatomy is explicitly prohibited by the asset note, and shifting poses distract from the core distinction).
 * 2. Static composition with signalling: static rigs for colleague and Jordan, order slip dropped on desk, brief acknowledgement mark drawn above Jordan, unresolved document unchanged (CHOSEN: adheres strictly to the storyboard spec, keeps rigs neutral, proves superficial compliance through lack of document change).
 * 3. Split-screen before-and-after panels (rejected: tells rather than shows the immediate failure of the command on the existing desk).
 */
Loom.scene("b11", {
  build(ctx, props) {
    const { kit, m } = ctx;
    const S = Loom.style;

    // Incoming desk setting anchoring the shared workspace
    // @form office_desk: wooden work desk surface anchoring the collaboration space
    const desk = ctx.el("office_desk", { x: 420, y: 700, w: 1080, h: 180, kind: "scenery", exit: "recede" });
    kit.card(desk.inner, 0, 0, 1080, 180, { fill: "surface2", stroke: "line", r: 10 });
    kit.line(desk.inner, 20, 24, 1060, 24, { stroke: "line", sw: 3 });
    kit.rect(desk.inner, 360, 40, 360, 120, { fill: "field2", r: 8 });
    m.reveal(desk, ctx.start);

    // @form calendar_bay: background office calendar grid on bay wall representing unresolved schedule
    const calendar = ctx.el("calendar_bay", { x: 860, y: 90, w: 200, h: 100, kind: "scenery", exit: "recede" });
    kit.card(calendar.inner, 0, 0, 200, 100, { fill: "surface", stroke: "line", r: 8 });
    kit.rect(calendar.inner, 0, 0, 200, 24, { fill: "muted", r: 4 });
    for (let c = 0; c < 5; c++) {
      for (let r = 0; r < 2; r++) {
        kit.rect(calendar.inner, 16 + c * 36, 36 + r * 28, 24, 20, { fill: "surface2", r: 4 });
      }
    }
    m.reveal(calendar, ctx.start);

    // Cast: colleague on left and Jordan on right facing desk
    // @form colleague_figure: neutral adult colleague standing on left of desk
    const colleague = ctx.el("colleague", { x: 480, y: 410, w: 300, h: 490, kind: "character", exit: "recede" });
    kit.peep(colleague.inner, "man", "neutral", { x: 10, y: 20, size: 400, cloth: "field2", skin: 0 });
    m.settle(colleague, ctx.start, { dy: 20 });

    // @form jordan_figure: neutral adult collaborator Jordan standing on right of desk
    const jordan = ctx.el("Jordan", { x: 1220, y: 430, w: 310, h: 470, kind: "character", exit: "recede" });
    kit.peep(jordan.inner, "woman", "neutral", { x: 10, y: 10, size: 400, flip: true, cloth: "surface2", skin: 1 });
    const fitJordan = kit.fit("Jordan", { role: "label", w: 290, maxLines: 1 });
    void fitJordan;
    kit.text(jordan.inner, "Jordan", { role: "label", x: 10, y: 420, w: 290, h: 40, align: "center", color: "muted" });
    m.settle(jordan, ctx.start, { dy: 20 });

    // Work document sitting in queue
    // @form unresolved_document: unchanged work queue sheet remaining in incomplete state
    const doc = ctx.el("unresolved_document", { x: 830, y: 560, w: 320, h: 200, kind: "document", exit: "recede" });
    kit.card(doc.inner, 0, 0, 320, 200, { fill: "surface", stroke: "muted", r: 8 });
    kit.icon(doc.inner, "file-text", { x: 24, y: 24, size: 36, color: "muted" });
    kit.line(doc.inner, 76, 36, 280, 36, { stroke: "muted", sw: 4 });
    kit.line(doc.inner, 76, 52, 230, 52, { stroke: "muted", sw: 4 });
    kit.line(doc.inner, 24, 90, 290, 90, { stroke: "surface2", sw: 3 });
    kit.line(doc.inner, 24, 115, 290, 115, { stroke: "surface2", sw: 3 });
    kit.line(doc.inner, 24, 140, 220, 140, { stroke: "surface2", sw: 3 });
    kit.line(doc.inner, 24, 165, 260, 165, { stroke: "surface2", sw: 3 });
    m.settle(doc, ctx.start, { dy: 15 });

    // 1. Unilateral demand arrives on the desk
    // @form demand_slip: directive note demanding earlier submission
    const demand = ctx.el("unilateral_demand", { x: 650, y: 220, w: 610, h: 160, kind: "card", exit: "recede" });
    kit.card(demand.inner, 0, 0, 610, 160, { fill: "surface", stroke: "accent", r: 10 });
    kit.rect(demand.inner, 0, 0, 16, 160, { fill: "accent", r: 4 });
    kit.icon(demand.inner, "alert-circle", { x: 44, y: 56, size: 48, color: "accent" });
    const fitDemand = kit.fit("Submit earlier", { role: "lead", w: 460, maxLines: 1 });
    void fitDemand;
    kit.text(demand.inner, "Submit earlier", {
      role: "lead",
      x: 110,
      y: 0,
      w: 460,
      h: 160,
      valign: "middle",
      weight: 700,
      color: "accent"
    });
    const tDemand = ctx.cue("Picture ordering Jordan to submit earlier");
    m.drop(demand, tDemand, { dy: 30 });

    // 2. Acknowledgement appears above Jordan
    // @form acknowledgement_mark: neutral confirmation badge acknowledging receipt without action
    const ack = ctx.el("acknowledgement", { x: 1280, y: 380, w: 130, h: 70, kind: "stamp", exit: "recede" });
    kit.pill(ack.inner, 0, 0, 130, 70, { fill: "surface2", stroke: "muted", r: 14 });
    const ackCheck = kit.path(ack.inner, "M 36 36 L 54 50 L 94 20", {
      stroke: "ink",
      sw: 5,
      fill: "none"
    });
    const tAck = ctx.cue("Jordan nods quickly just to escape");
    m.pop(ack, tAck, { overshoot: false });
    m.draw(ackCheck, tAck + 0.08, { dur: 0.32 });

    // 3. Document remains unchanged
    const tQuestion = ctx.cue("Did that order fix anything");
    void tQuestion;

    // 4. Demand remains disconnected from completion
    const tCompliance = ctx.cue("superficial compliance");
    void tCompliance;

    void props;
    void S;
  },
});
