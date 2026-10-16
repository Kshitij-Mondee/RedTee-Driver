// @design own_desk_pause: an empty desk at a slow push; a sticky of praise sits above a dashed space where the action would be
/* Treatments considered:
 * (A) static composition: sticky, gap and label all up at once, signalled by a pulse (rejected: no reason to look, the gap has no cause);
 * (B) fast zoom to the sticky (rejected: the pause needs calm, not a jolt);
 * (C) CHOSEN: cut in on the empty desk, sticky drops on its words, the label writes in beside it, the dashed gap draws under the
 *     thumbs-up on "what to repeat", the push ends before the speech does so the frame is still through the pause.
 */
Loom.scene("b06", {
  build(ctx) {
    const { kit, m } = ctx;
    const L = Loom.lesson;

    // 1. the desk: one element, pushed slowly toward the empty space (a pure function of time)
    const desk = ctx.el("desk", { x: 0, y: 0, w: 1920, h: 1080, kind: "scenery", exit: "recede" });
    const push = Loom.svg("g", {}, desk.inner);
    const ds = L.desk_set(ctx, push, {});
    ds.setState("card_space", ctx.start, 0);
    m.reveal(desk, ctx.start + 0.02, { dy: 0 });
    const tNote = ctx.cue("Think of your last");
    const tGap = ctx.cue("what to repeat");
    const tPushEnd = ctx.speechEnd - 0.5;
    const FX = 570, FY = 400, TX = 640, TY = 430, S1 = 1.2;
    Loom.drive((e, raw) => {
      const p = raw < 0 ? 0 : raw > 1 ? 1 : raw * raw * (3 - 2 * raw);
      const s = 1 + (S1 - 1) * p;
      const x = FX + (TX - FX) * p, y = FY + (TY - FY) * p;
      push.setAttribute("transform", "translate(" + x.toFixed(2) + " " + y.toFixed(2) + ") scale(" + s.toFixed(4) + ") translate(" + (-FX) + " " + (-FY) + ")");
    }, ctx.start, Math.max(0.5, tPushEnd - ctx.start), "linear", { key: "b06push", kind: "scenery", beat: ctx.beat.id, name: "desk", content: true });

    // 2. the sticky (the accent) lands on its words, then the dashed space draws under the thumbs-up
    ds.setState("note_only", tNote, 0.5);
    ds.setState("thumbs_note", tGap - 0.5, 0.8);

    // 3. the small paper label, in screen space, writes in on "good job"
    const lab = ctx.el("prompt_label", { x: 900, y: 330, w: 600, h: 130, kind: "label", exit: "recede" });
    const g = Loom.svg("g", { transform: "rotate(-2 300 65)" }, lab.inner);
    Loom.svg("rect", { x: 6, y: 8, width: 588, height: 114, rx: 12, fill: ctx.c("shadow"), opacity: 0.5 }, g);
    Loom.svg("rect", { x: 0, y: 0, width: 588, height: 114, rx: 12, fill: ctx.c("surface"), stroke: ctx.c("ink"), "stroke-width": 5 }, g);
    Loom.svg("rect", { x: 232, y: -14, width: 124, height: 30, rx: 5, fill: ctx.c("field2"), opacity: 0.8 }, g);
    kit.text(g, "Your last \"good job\"", { role: "label", x: 24, y: 14, w: 540, h: 88, align: "center", valign: "middle", maxLines: 1, color: "ink", weight: 400 });
    m.reveal(lab, ctx.cue("good job"), { dy: 14 });
  },
});
