// @design subject_is_not_a_decision: a single invite title is circled to show that it names a topic, not a choice
// Treatments: (A) a centred document, rejected because it competes with the persistent checklist. (B) a slide-like title card, rejected because it hides the weak invite line. (C) chosen, a rough invite is drawn while its single subject line receives one accent circle.
Loom.scene("b04", {
  build(ctx) {
    const { kit, m } = ctx;
    const DRAW = ctx.style.dur("draw");
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const drawDur = (len) => DRAW * clamp(len / 900, 0.3, 1.4);
    const writeDur = (str) => DRAW * clamp(String(str).length / 14, 0.45, 1.8);
    const hand = (g, d, o) => kit.sketch(g, "path", [d], Object.assign({ fill: "none", stroke: "ink" }, o || {}));

    // @form checklist: the three moves remain available for the following invite edits
    const steps = ctx.el("steps", { x: 1420, y: 96, w: 380, h: 300, kind: "list", exit: "recede" });
    const stepList = Loom.lesson.step_list(ctx, steps.inner, { current: 0, ticked: [false, false, false], name: "steps" });
    stepList.draw(ctx.cue("Before."));

    // @form meeting_invite: a roomy card that preserves clear separation from the checklist
    const invite = ctx.el("invite", { x: 150, y: 220, w: 1160, h: 600, kind: "card", exit: "recede" });
    const inviteCard = Loom.lesson.invite_card(ctx, invite.inner, { name: "invite" });
    const tInvite = ctx.cue("Sam's invite says");
    inviteCard.draw(tInvite - 0.35);
    inviteCard.setTitle("Pilot update", ctx.cue("Pilot update"));

    // @form subject_circle: the only marker-colour emphasis, fitted to the kit title bounds
    const title = inviteCard.titleBox;
    const padX = 22, padY = 18;
    const x = title.x - padX, y = title.y - padY, w = title.w + padX * 2, h = title.h + padY * 2;
    const subjectCircle = ctx.el("subject_circle", { x: 150 + x, y: 220 + y, w, h, kind: "mark", exit: "recede" });
    const rx = w / 2 - 7, ry = h / 2 - 7, cx = w / 2, cy = h / 2, k = 0.5523;
    const loop = `M${cx} ${cy - ry} C${cx + k * rx} ${cy - ry} ${cx + rx} ${cy - k * ry} ${cx + rx} ${cy} C${cx + rx} ${cy + k * ry} ${cx + k * rx} ${cy + ry} ${cx} ${cy + ry} C${cx - k * rx} ${cy + ry} ${cx - rx} ${cy + k * ry} ${cx - rx} ${cy} C${cx - rx} ${cy - k * ry} ${cx - k * rx} ${cy - ry * 1.06} ${cx} ${cy - ry * 1.06} C${cx + rx * 0.22} ${cy - ry * 1.06} ${cx + rx * 0.38} ${cy - ry * 1.12} ${cx + rx * 0.5} ${cy - ry * 1.14}`;
    hand(subjectCircle.inner, loop, { stroke: "accent", sw: 5.5 });
    m.draw(subjectCircle, ctx.cue("That's a subject"), { dur: drawDur(2 * Math.PI * Math.sqrt((rx * rx + ry * ry) / 2)) });

    // @form subject_note: a muted annotation that names the weakness without competing with the accent
    const noteX = Math.min(1310, 150 + x + w + 30);
    const subjectNote = ctx.el("subject_note", { x: noteX, y: 220 + y + h + 12, w: 190, h: 52, kind: "label", exit: "wipe" });
    kit.text(subjectNote.inner, "a subject", { role: "label", x: 0, y: 0, w: 190, h: 52, maxLines: 1, valign: "middle", color: "muted" });
    m.unmask(subjectNote, ctx.cue("not a decision"), { dir: "ltr", dur: writeDur("a subject") });
  },
});
