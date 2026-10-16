// @design mail_pause: an outline email where a cursor stops before commitment
// Treatments considered: 1) a static laptop with a highlighted Send button, 2) an email enlarged as an abstract card, 3) a centred laptop with a cursor travelling to its send control. Chosen: 3, because the stopped cursor makes the pause visible.
Loom.scene("b01", {
  build(ctx, props) {
    const tEmail = ctx.cue("Say your cursor is on Send.");
    const tAttachment = ctx.cue("A customer list is attached,");
    const tRecipient = ctx.cue("going to a contractor who started this week.");
    const tPause = ctx.cue("You pause.");
    const mailBox = { x: 410, y: 150, w: 1100, h: 664 };
    // @form mail_laptop: the email decision surface
    const E = ctx.el("mail_laptop", { ...mailBox, kind: "instrument", exit: "recede" });
    const mail = Loom.lesson.mail(ctx, E.inner, { x: 0, y: 0, w: mailBox.w, h: mailBox.h });
    mail.setState("plain", tEmail);
    mail.moveCursor("above_send", tEmail, 0.9);
    mail.drawUnderline(tRecipient, 0.8);
    // The kit already owns the Customer list chip and its grey dashed state.
    mail.setClass("none", tAttachment, 0.6);
    // The cursor has reached the space directly above Send before the spoken pause.
    Loom.tl.set(mail.cursor, { opacity: 1 }, tPause);
  },
});
