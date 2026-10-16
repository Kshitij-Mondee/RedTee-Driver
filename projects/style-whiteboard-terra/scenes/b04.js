// @design weak_topic_exposed_by_one_circle: a sparse workshop board makes the invite's vague topic the only focal point
/*
 * Treatments considered: (A) a full agenda as a slide, rejected because it hides the weak title.
 * (B) Sam beside an oversized card, rejected because the person adds no evidence.
 * (C) chosen, the invite is drawn in speech order and one accent loop exposes its title.
 */
Loom.scene("b04", {
  build(ctx) {
    const { kit, m } = ctx;
    const S = Loom.style;
    const DRAW = S.dur("draw");
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const drawDur = (len) => DRAW * clamp(len / 900, 0.3, 1.4);
    const writeDur = (str) => DRAW * clamp(String(str).length / 14, 0.45, 1.8);
    const hand = (g, d, o) => kit.sketch(g, "path", [d], Object.assign({ fill: "none", stroke: "ink" }, o || {}));

    const tBefore = ctx.cue("Before.");
    const tInvite = ctx.cue("Sam's invite says: Pilot update.");
    const tTitle = ctx.cue("Pilot update");
    const tSubject = ctx.cue("That's a subject");
    const tNote = ctx.cue("not a decision");

    // @form steps: the section checklist remains as a stable board reference
    const steps = ctx.el("steps", { x: 1420, y: 96, w: 380, h: 300, kind: "list", exit: "none" });
    const stepsHandle = Loom.lesson.step_list(ctx, steps.inner, { current: 0, ticked: [false, false, false], name: "steps" });
    stepsHandle.draw(tBefore);

    // @form invite: the one artefact under discussion, kept into the rewrite beat
    const invite = ctx.el("invite", { x: 230, y: 220, w: 1160, h: 600, kind: "card", exit: "none" });
    const inviteHandle = Loom.lesson.invite_card(ctx, invite.inner, { name: "invite" });
    inviteHandle.draw(tInvite - 0.35);
    inviteHandle.setTitle("Pilot update", tTitle);

    // The kit updates titleBox synchronously when setTitle is called, so the accent follows the measured title.
    const B = inviteHandle.titleBox;
    const pad = 18;
    const rx = B.w / 2 + pad, ry = B.h / 2 + pad;
    const cx = invite.x + B.x + B.w / 2, cy = invite.y + B.y + B.h / 2;
    const bx = Math.floor(cx - rx - 10), by = Math.floor(cy - ry - 14);
    const lx = cx - bx, ly = cy - by, k = 0.5523;
    const loop = `M${lx} ${ly - ry} C${lx + k * rx} ${ly - ry} ${lx + rx} ${ly - k * ry} ${lx + rx} ${ly} C${lx + rx} ${ly + k * ry} ${lx + k * rx} ${ly + ry} ${lx} ${ly + ry} C${lx - k * rx} ${ly + ry} ${lx - rx} ${ly + k * ry} ${lx - rx} ${ly} C${lx - rx} ${ly - k * ry} ${lx - k * rx} ${ly - ry * 1.05} ${lx} ${ly - ry * 1.05} C${lx + rx * 0.2} ${ly - ry * 1.05} ${lx + rx * 0.34} ${ly - ry * 1.1} ${lx + rx * 0.46} ${ly - ry * 1.13}`;
    // @form subject_circle: the only marker-colour emphasis, measured from the kit title box
    const subjectCircle = ctx.el("subject_circle", { x: bx, y: by, w: Math.ceil(2 * rx + 20), h: Math.ceil(2 * ry + 30), kind: "mark", exit: "recede" });
    hand(subjectCircle.inner, loop, { stroke: "accent", sw: 5.5 });
    m.draw(subjectCircle, tSubject, { dur: drawDur(2 * Math.PI * Math.sqrt((rx * rx + ry * ry) / 2)) });

    // @form subject_note: a muted diagnosis sits immediately beside the circled title
    const noteX = Math.min(invite.x + B.x + B.w + 34, 1230);
    const subjectNote = ctx.el("subject_note", { x: noteX, y: Math.floor(cy - 28), w: 150, h: 56, kind: "label", exit: "recede" });
    kit.text(subjectNote.inner, "a subject", { role: "label", x: 0, y: 0, w: 150, h: 56, maxLines: 1, valign: "middle", color: "muted" });
    m.unmask(subjectNote, tNote, { dur: writeDur("a subject") });
  },
});
