// @design decision_critical_guest_row: retain the decision owner and essential input, then route everyone else to the notes
/* Treatments considered: (A) redraw a smaller invite, rejected because this beat continues the existing card; (B) replace guests with text, rejected because the pictograms make the trim immediate; (C) chosen, keep the invite and mark the two needed guests before crossing the rest toward its envelope. */
Loom.scene("b06", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const drawDur = (len) => S.dur("draw") * clamp(len / 900, 0.3, 1.4);
    const writeDur = (str) => S.dur("draw") * clamp(String(str).length / 14, 0.45, 1.8);

    // The held card owns the six pictograms. New marks are parented to that same card, using its measured local boxes.
    const steps = ctx.held("steps");
    const invite = ctx.held("invite");
    const ownerAt = ctx.cue("whoever owns that decision");
    const inputAt = ctx.cue("can't be made without");
    const notesAt = ctx.cue("Everyone else gets the notes");
    const g0 = invite.handle.guestBox(0);
    const g1 = invite.handle.guestBox(1);

    // @form owner_circle: accent marker loop around the decision owner's pictogram
    const pad = 14;
    const ownerCircle = ctx.el("owner_circle", { x: g0.x - pad, y: g0.y - pad, w: g0.w + pad * 2, h: g0.h + pad * 2, kind: "mark", exit: "recede", parent: invite.inner });
    kit.sketch(ownerCircle.inner, "path", [`M${(g0.w + pad * 2) / 2} 2 C${g0.w + pad * 2 - 4} 2 ${g0.w + pad * 2 - 2} ${(g0.h + pad * 2) / 2} ${g0.w + pad * 2 - 4} ${g0.h + pad * 2 - 4} C${g0.w + pad * 2 - 12} ${g0.h + pad * 2 - 1} 8 ${g0.h + pad * 2 - 1} 3 ${(g0.h + pad * 2) / 2} C1 12 8 3 ${(g0.w + pad * 2) / 2} 2`], { fill: "none", stroke: "accent", sw: 5 });
    m.draw(ownerCircle, ownerAt - 0.12, { dur: drawDur(2 * Math.PI * Math.max(g0.w, g0.h) / 2) });

    // @form owner_label: handwritten ownership label directly below the first kept guest
    const ownerLabel = ctx.el("owner_label", { x: g0.x - 18, y: g0.y + g0.h + 8, w: g0.w + 36, h: 48, kind: "label", exit: "wipe", parent: invite.inner });
    // The invite kit writes this label, preserving its pictogram-to-label spacing.
    m.unmask(ownerLabel, ownerAt + 0.16, { dur: writeDur("Owner") });
    invite.handle.markGuest(0, "Owner", ownerAt + 0.12, { tone: "ink" });

    // @form needed_input_label: handwritten label below the second decision-critical guest
    const inputLabel = ctx.el("needed_input_label", { x: g1.x - 44, y: g1.y + g1.h + 8, w: g1.w + 88, h: 48, kind: "label", exit: "wipe", parent: invite.inner });
    // The invite kit writes this label, preserving its pictogram-to-label spacing.
    m.unmask(inputLabel, inputAt, { dur: writeDur("Needed input") });
    invite.handle.markGuest(1, "Needed input", inputAt, { tone: "ink" });

    // The crossed guests stay visible as a record of the trim, then the kit's arrow leads into its envelope.
    [2, 3, 4, 5].forEach((i) => invite.handle.crossGuest(i, notesAt + (i - 2) * 0.13));
    invite.handle.envelope(notesAt + 0.45);

    // The check mark is last, following the completed before-work and landing before the narration ends.
    steps.handle.tick(0, notesAt + 0.74, { tone: "ink" });
  },
});
