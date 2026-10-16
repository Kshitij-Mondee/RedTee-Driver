// @design slot_swap_revision: replacing broad clause with concrete omission linked to evidence gap
/* Treatments considered:
 * 1. Static callout cards with persistent arrows (rejected: static signaling fails to convey the active process of revision).
 * 2. Full page flip between draft versions (rejected: disrupts desk continuity and the slotted strip architecture).
 * 3. CHOSEN: Slot swap in place. The broad request strip lifts off and the situation and omission strip unfolds into its slot,
 *    followed by a directional connector tracing into the gap in the project update. Motion embodies the revision.
 */
Loom.scene("b09", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;

    // ---- Station continuity: held cards from b08 (or created if running standalone)
    let updateMsg = ctx.held("update_message");
    if (!updateMsg) {
      updateMsg = ctx.el("update_message", { x: 120, y: 150, w: 760, h: 720, kind: "card", exit: "none" });
      kit.rect(updateMsg.inner, 0, 0, 760, 720, { fill: "surface", stroke: "line", r: 16 });
      kit.kicker(updateMsg.inner, "PROJECT UPDATE", { x: 36, y: 36, w: 680, h: 32, color: "muted" });
      kit.text(updateMsg.inner, "Project update", { role: "title", x: 36, y: 76, w: 680, h: 72, maxLines: 1, color: "ink", weight: 700 });
      kit.rect(updateMsg.inner, 36, 170, 688, 110, { fill: "surface2", r: 10 });
      kit.text(updateMsg.inner, "Status: completed on track", { role: "body", x: 60, y: 205, w: 640, h: 40, maxLines: 1, color: "ink" });
    }

    let draftSheet = ctx.held("draft_sheet");
    if (!draftSheet) {
      draftSheet = ctx.el("draft_sheet", { x: 960, y: 150, w: 840, h: 720, kind: "card", exit: "none" });
      kit.rect(draftSheet.inner, 0, 0, 840, 720, { fill: "surface", stroke: "line", r: 16 });
      kit.kicker(draftSheet.inner, "FEEDBACK DRAFT", { x: 40, y: 36, w: 760, h: 32, color: "muted" });
      kit.text(draftSheet.inner, "Feedback draft", { role: "title", x: 40, y: 76, w: 760, h: 72, maxLines: 1, color: "ink", weight: 700 });
      kit.rect(draftSheet.inner, 40, 560, 760, 110, { fill: "surface2", r: 10 });
      kit.text(draftSheet.inner, "Next: consequence and request", { role: "body", x: 64, y: 595, w: 710, h: 40, maxLines: 1, color: "muted" });
    }

    // Broad request strip leaves the upper slot
    let broadStrip = ctx.held("broad_request_strip");
    if (!broadStrip) {
      broadStrip = ctx.el("broad_request_strip", { x: 1000, y: 260, w: 760, h: 250, kind: "card", exit: "recede" });
      kit.rect(broadStrip.inner, 0, 0, 760, 250, { fill: "surface2", stroke: "line", r: 12 });
      kit.kicker(broadStrip.inner, "INITIAL CLAUSE", { x: 30, y: 24, w: 700, h: 28, color: "muted" });
      kit.text(broadStrip.inner, "Broad request", { role: "lead", x: 30, y: 70, w: 700, h: 50, maxLines: 1, color: "ink", weight: 700 });
      kit.text(broadStrip.inner, "Please be more communicative.", { role: "body", x: 30, y: 130, w: 700, h: 44, maxLines: 1, color: "muted" });
    }

    // // @form gap_span: highlighted placeholder in the update message for the omitted date
    const gapSpan = ctx.el("gap_span", { x: 156, y: 480, w: 688, h: 140, kind: "node", exit: "recede" });
    kit.rect(gapSpan.inner, 0, 0, 688, 140, { fill: "surface2", stroke: "line", r: 10, dash: "6 4" });
    kit.kicker(gapSpan.inner, "GAP IN UPDATE", { x: 24, y: 18, w: 640, h: 28, color: "muted" });
    kit.text(gapSpan.inner, "Delivery date: not noted", { role: "lead", x: 24, y: 56, w: 640, h: 56, maxLines: 1, color: "muted", weight: 700 });

    // 1. Broad request strip lifts off on cue
    const tSwap = ctx.cue("In the last project update");
    Loom.tween(
      broadStrip.inner,
      { y: 0, opacity: 1 },
      { y: -45, opacity: 0, duration: 0.32, ease: Loom.ease.exit },
      tSwap,
      { kind: "slot_lift", beat: ctx.beat.id, content: true }
    );

    // // @form situation_strip: unfolding strip presenting situation and omission clauses
    const sitStrip = ctx.el("situation_strip", { x: 1000, y: 260, w: 760, h: 270, kind: "card", exit: "recede" });
    kit.rect(sitStrip.inner, 0, 0, 760, 270, { fill: "surface", stroke: "line", r: 12 });

    // Top clause: situation
    kit.kicker(sitStrip.inner, "SITUATION", { x: 24, y: 18, w: 712, h: 26, color: "muted" });
    kit.text(sitStrip.inner, "In the last project update,", { role: "lead", x: 24, y: 46, w: 712, h: 48, maxLines: 1, color: "ink", weight: 700 });

    // Bottom clause: omission span (accent_on)
    kit.rect(sitStrip.inner, 20, 110, 720, 136, { fill: "surface2", stroke: "accent", r: 8 });
    kit.kicker(sitStrip.inner, "OMISSION", { x: 38, y: 122, w: 680, h: 26, color: "accent" });
    kit.text(sitStrip.inner, "the changed delivery date was not noted.", { role: "lead", x: 38, y: 156, w: 680, h: 52, maxLines: 1, color: "accent", weight: 700 });

    // Strip unfolds in the slot
    Loom.tween(
      sitStrip.inner,
      { scaleY: 0.15, opacity: 0 },
      { scaleY: 1, opacity: 1, duration: 0.44, ease: Loom.ease.overshoot },
      tSwap + 0.16,
      { kind: "unfold", beat: ctx.beat.id, content: true }
    );

    // // @form omission_link: directional connector targeting the unnoted gap in the update
    const linkEl = ctx.el("omission_link", { x: 844, y: 430, w: 176, h: 140, kind: "connector", exit: "recede" });
    const connectorArrow = kit.arrow(linkEl.inner, 160, 10, 16, 120, { stroke: "accent", bend: -18 });
    const tLink = ctx.cue("the changed delivery date was not noted");
    m.draw(connectorArrow, tLink, { dur: 0.65 });

    // // @form omission_tag: badge identifying the gap as an omission rather than character
    const omissionTag = ctx.el("omission_tag", { x: 500, y: 532, w: 260, h: 64, kind: "stamp", exit: "recede" });
    kit.pill(omissionTag.inner, 0, 0, 260, 64, { fill: "accent" });
    kit.text(omissionTag.inner, "An omission", {
      role: "lead",
      x: 0,
      y: 0,
      w: 260,
      h: 64,
      align: "center",
      valign: "middle",
      weight: 700,
      color: S.pickTokenOn("accent")
    });
    const tTag = ctx.cue("an omission");
    m.settle(omissionTag, tTag, { dy: -14 });

    // 4. Update message holds as the sole annotated object, distinct from character
    const tChar = ctx.cue("not character");
    const charTag = ctx.el("character_note", { x: 156, y: 640, w: 240, h: 50, kind: "stamp", exit: "recede" });
    kit.pill(charTag.inner, 0, 0, 240, 50, { fill: "surface2", stroke: "line" });
    kit.text(charTag.inner, "Not character", {
      role: "label",
      x: 0,
      y: 0,
      w: 240,
      h: 50,
      align: "center",
      valign: "middle",
      weight: 700,
      color: "muted"
    });
    m.settle(charTag, tChar, { dy: -10 });
  }
});
