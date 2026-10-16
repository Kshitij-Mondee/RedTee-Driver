// @design poised_action: a pointer approaches a consequential control and holds without committing
Loom.scene("b01", {
  build(ctx, props) {
    // Treatments: static email with signalling; cursor-led approach; close crop of the control.
    // Choose cursor-led approach: movement makes the withheld action visible, while the full context remains readable.
    const drawDur = ctx.style.dur("draw");
    const enterDur = ctx.style.dur("enter");
    const opening = ctx.cue("Say your cursor is on Send");
    const attached = ctx.cue("A customer list is attached");
    const recipient = ctx.cue("contractor who started this week");
    const pause = ctx.cue("You pause");
    // @form mail_screen: one fixed laptop composition, shared visually with the closing callback
    const E = ctx.el("mail_screen", { x:355, y:120, w:1210, h:730.4, kind:"instrument", exit:"recede" });
    const mail = Loom.lesson.mail(ctx, E.inner, { x:0, y:0, scale:1.1 });
    E.handle = mail;
    // All drawing is the kit's geometry; no replacement attachment or cursor is created.
    mail.cursor.querySelector("path").setAttribute("stroke", ctx.c("accent"));
    ctx.m.draw(mail.laptop, ctx.start, { dur:drawDur });
    [mail.email, mail.send, mail.cursor].forEach(function(layer) {
      Loom.drive(function(p) { layer.setAttribute("opacity", p); }, opening, enterDur, "enter");
    });
    // A gradual print preserves the dashed unclassified outline without changing kit geometry.
    Loom.drive(function(p) { mail.attachment.setAttribute("opacity", p); }, attached, drawDur, "move");
    mail.drawUnderline(recipient, drawDur);
    // A continuous approach arrives just as the final phrase asks for the pause.
    mail.moveCursor("above_send", opening + drawDur, pause - opening - drawDur);
    // A restrained in-scene push keeps the natural mail geometry unchanged for b13.
    Loom.drive(function(p) {
      E.inner.setAttribute("transform", "translate(" + (-12.1*p) + " " + (-7.304*p) + ") scale(" + (1+0.02*p) + ")");
    }, opening, ctx.speechEnd-opening, "linear");
  }
});
