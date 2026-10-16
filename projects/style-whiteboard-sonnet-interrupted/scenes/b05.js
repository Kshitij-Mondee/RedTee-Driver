// @design correction_by_strike: a wrong line is struck through and the right one written beneath, never erased
// Treatments considered: (1) erase and retype the title (rejected: corrections are struck, never erased);
// (2) static finished card with a callout (rejected: the move is watching it written); (3) strike, rewrite under, underline, guests (chosen).
Loom.scene("b05", {
  build(ctx, props) {
    const m = ctx.m, kit = ctx.kit;
    let inv = ctx.held("invite");
    let steps = ctx.held("steps");
    let circle = ctx.held("subject_circle");
    let note = ctx.held("subject_note");
    // preview stand-in ONLY when b04's elements are not built yet (never used once b04 exists)
    if (!inv) {
      inv = ctx.el("invite", { x: 260, y: 220, w: 1160, h: 600, kind: "card", exit: "recede" });
      inv.handle = Loom.lesson.invite_card(ctx, inv.inner, { name: "invite" });
      inv.handle.draw(ctx.start - 8);
      inv.handle.setTitle("Pilot update", ctx.start - 6);
      inv.x = 260; inv.y = 220;
    }
    if (!steps) {
      steps = ctx.el("steps", { x: 1420, y: 96, w: 380, h: 300, kind: "list", exit: "recede" });
      steps.handle = Loom.lesson.step_list(ctx, steps.inner, { name: "steps", current: 0 });
      steps.handle.draw(ctx.start - 9);
    }
    const H = inv.handle;
    const ox = (inv.x != null ? inv.x : 260), oy = (inv.y != null ? inv.y : 220);
    console.log("INVITE origin " + ox + "," + oy + " keys " + Object.keys(inv).join(","));

    // b04's circle and note leave first
    const tLeave = ctx.start + 0.1;
    if (circle) m.exit(circle, tLeave);
    if (note) m.exit(note, tLeave);

    // 1. strike through the topic
    H.strike(ctx.cue("Write the decision as a question"));
    // 2. the question written under the struck line
    const tQ = ctx.cue("May or June");
    H.rewrite("May or June?", tQ);
    // 3. the one accent: an underline under the question
    const rb = H.rewriteBox;
    const UL = ctx.el("question_underline", { x: ox + rb.x - 8, y: oy + rb.y + 100, w: rb.w + 40, h: 30, kind: "mark", exit: "recede" });
    kit.sketch(UL.inner, "path", ["M4 16 C " + Math.round((rb.w + 40) * 0.3) + " 8, " + Math.round((rb.w + 40) * 0.65) + " 22, " + (rb.w + 34) + " 12"], { fill: "none", stroke: "accent", sw: 6 });
    m.draw(UL, tQ + 0.7, { dur: ctx.style.dur("draw") * 0.6 });
    // 4. the guest row
    H.guests(ctx.cue("people come ready to answer"));
  }
});
