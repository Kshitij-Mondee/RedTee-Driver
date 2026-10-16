// @design email_reroute: a familiar outline email whose cursor takes a safer route
// Treatments considered: 1) a new confidential card, 2) a split before-and-after interface, 3) the b01 laptop geometry with the cursor rerouted to a protected option. Chosen: 3, because the identical screen makes the behaviour change legible.
Loom.scene("b13", {
  build(ctx, props) {
    const tEmail = ctx.cue("So, that email.");
    const tClass = ctx.cue("The list is confidential.");
    const tNeed = ctx.cue("Does the contractor need it?");
    const tChannel = ctx.cue("If so, use an approved, protected channel.");
    const tOwner = ctx.cue("If unsure, ask the list's owner first.");
    const mailBox = { x: 410, y: 150, w: 1100, h: 664 };
    // @form mail_laptop: the callback email decision surface
    const E = ctx.el("mail_laptop", { ...mailBox, kind: "instrument", exit: "recede" });
    const mail = Loom.lesson.mail(ctx, E.inner, { x: 0, y: 0, w: mailBox.w, h: mailBox.h });
    mail.setState("plain", tEmail);
    mail.moveCursor("send", tEmail, 0.55);
    mail.setClass("confidential", tClass, 0.6);
    mail.show("need", tNeed);
    mail.show("channel", tChannel);
    mail.dimSend(true, tChannel);
    mail.moveCursor("channel", tChannel, 0.6);
    mail.lightChannel(tChannel + 0.35);
    mail.show("owner", tOwner);
  },
});
