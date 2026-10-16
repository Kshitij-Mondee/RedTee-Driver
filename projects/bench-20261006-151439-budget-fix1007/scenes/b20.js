// @design paper_morph_to_rail: expanding an evaluated single slip into a wide planning surface with unpopulated slots
/* b20 - Choice paper becoming a complete-conversation rail.
 * Treatments considered:
 * (A) Static cards side by side with directional arrows (rejected: static diagram telling rather
 * than showing transformation; fails animation gate requiring content motion).
 * (B) Direct cut to populated workflow stages (rejected: invents fictional conversational outcomes
 * before they happen, violating finish rule).
 * (C) CHOSEN: Material transformation where evaluated phrase paper unfolds into a broad shared
 * conversation page, revealing a shallow rail with unpopulated physical slots.
 * Motion is content: the scope visibly expands from an isolated phrase to a complete planning scaffold.
 */
Loom.scene("b20", {
  build(ctx) {
    const { kit, m } = ctx;

    const tAnchor1 = ctx.cue("isolated phrases");
    const tAnchor2 = ctx.cue("full conversation from scratch");
    const tAnchor3 = ctx.cue("complete workflow unfold");

    // ---- 1. evaluated_sheet: incoming reference paper from evaluated phrasing
    const evaluated_sheet = ctx.el("evaluated_sheet", {
      x: 500,
      y: 230,
      w: 920,
      h: 650,
      kind: "document",
      exit: "recede",
    });
    kit.rect(evaluated_sheet.inner, 0, 0, 920, 650, { fill: "surface", r: 16 });
    kit.kicker(evaluated_sheet.inner, "Isolated phrases", { x: 50, y: 44, w: 400, h: 32, color: "muted" });

    // @form evaluated_slip: paper speech slip retaining evaluated phrasing
    kit.rect(evaluated_sheet.inner, 50, 96, 820, 130, { fill: "surface2", r: 10 });
    const fitPhrase = kit.fit("Evaluating isolated phrases", { role: "lead", w: 680, maxLines: 1 });
    kit.text(evaluated_sheet.inner, "Evaluating isolated phrases", {
      role: "lead",
      x: 80,
      y: 96 + Math.round((130 - fitPhrase.height) / 2),
      w: 680,
      h: fitPhrase.height,
      maxLines: 1,
      color: "ink",
    });
    kit.mark(evaluated_sheet.inner, "yes", 800, 161, 44);

    // @form document_ruled_lines: physical office paper planning lines
    for (let i = 0; i < 4; i++) {
      kit.line(evaluated_sheet.inner, 50, 270 + i * 50, 870, 270 + i * 50, { stroke: "field2", sw: 2 });
    }
    m.settle(evaluated_sheet, ctx.start, { dy: 20 });

    // ---- 2. conversation_page: shared planning surface opens around the paper
    const conversation_page = ctx.el("conversation_page", {
      x: 360,
      y: 230,
      w: 1200,
      h: 650,
      kind: "document",
      exit: "displace",
    });
    kit.rect(conversation_page.inner, 0, 0, 1200, 650, { fill: "surface", r: 16 });
    kit.kicker(conversation_page.inner, "Complete workflow", { x: 50, y: 36, w: 400, h: 32, color: "muted" });
    kit.line(conversation_page.inner, 600, 0, 600, 650, { stroke: "surface2", sw: 2, dash: "8 6" });
    for (let i = 0; i < 4; i++) {
      kit.line(conversation_page.inner, 50, 100 + i * 42, 1150, 100 + i * 42, { stroke: "field2", sw: 1 });
    }

    // At tAnchor2, evaluated sheet retires and conversation page opens
    m.exit(evaluated_sheet, tAnchor2, "recede");
    m.grow(conversation_page, tAnchor2, { axis: "x" });

    // ---- 3. full_conversation_heading: primary teaching emphasis with saturated accent
    const full_conversation_heading = ctx.el("full_conversation_heading", {
      x: 450,
      y: 300,
      w: 1000,
      h: 120,
      kind: "text",
      exit: "wipe",
    });
    const fitHeading = kit.fit("Full conversation", { role: "title", w: 900, maxLines: 1 });
    kit.text(full_conversation_heading.inner, "Full conversation", {
      role: "title",
      x: 50,
      y: Math.round((120 - fitHeading.height) / 2),
      w: 900,
      h: fitHeading.height,
      maxLines: 1,
      align: "center",
      valign: "middle",
      color: "accent",
      weight: 800,
    });
    m.settle(full_conversation_heading, tAnchor2 + 0.08, { dy: 16 });
    m.emphasis(full_conversation_heading, tAnchor2 + 0.4);

    // ---- 4. conversation_rail: physical planning scaffold with empty sequential slots
    const conversation_rail = ctx.el("conversation_rail", {
      x: 440,
      y: 570,
      w: 1040,
      h: 230,
      kind: "row",
      exit: "recede",
    });
    kit.rect(conversation_rail.inner, 0, 0, 1040, 230, { fill: "surface2", r: 14 });
    kit.kicker(conversation_rail.inner, "Workflow", { x: 32, y: 16, w: 200, h: 24, color: "muted" });

    const slotCount = 4;
    const padX = 28;
    const gap = 20;
    const totalGap = (slotCount - 1) * gap;
    const slotW = Math.floor((1040 - 2 * padX - totalGap) / slotCount);
    const slotH = 144;
    const slotY = 56;

    for (let i = 0; i < slotCount; i++) {
      const sx = padX + i * (slotW + gap);
      // @form rail_slot: empty physical planning pocket on the conversation rail
      kit.rect(conversation_rail.inner, sx, slotY, slotW, slotH, { fill: "surface", r: 8, stroke: "line" });

      // @form step_indicator: sequential slot marker within the workflow rail
      const fitStep = kit.fit(String(i + 1), { role: "caption", w: 30, maxLines: 1 });
      kit.text(conversation_rail.inner, String(i + 1), {
        role: "caption",
        x: sx + 14,
        y: slotY + 12,
        w: 30,
        h: fitStep.height,
        maxLines: 1,
        color: "muted",
      });

      kit.line(conversation_rail.inner, sx + 20, slotY + slotH - 32, sx + slotW - 20, slotY + slotH - 32, {
        stroke: "field2",
        sw: 2,
        dash: "4 4",
      });

      if (i < slotCount - 1) {
        const ax1 = sx + slotW + 3;
        const ax2 = sx + slotW + gap - 3;
        const ay = slotY + Math.round(slotH / 2);
        kit.arrow(conversation_rail.inner, ax1, ay, ax2, ay, { stroke: "muted" });
      }
    }

    m.unmask(conversation_rail, tAnchor3, { dir: "ltr" });
    void tAnchor1;
  },
});
