// @design return_route: a familiar pointer chooses a protected path instead of the obvious button
Loom.scene("b13", {
  build(ctx, props) {
    // Three treatments: static callback with signalling; cursor reroute; separate channel diagram.
    // Choose cursor reroute: its changed destination is the behaviour change.
    // Match b01's now-available base placement and scale exactly.
    const enter = ctx.cue("So, that email");
    const classify = ctx.cue("confidential");
    const need = ctx.cue("Does the contractor need it");
    const channel = ctx.cue("approved, protected channel");
    const owner = ctx.cue("ask the list's owner first");
    const drawDur = ctx.style.dur("draw");
    const moveDur = ctx.style.dur("move");
    const revealDur = ctx.style.dur("enter");
    // @form callback_mail: the familiar email returns with its class carried by the attachment outline
    const E = ctx.el("mail_screen", {x:355, y:120, w:1210, h:730.4, kind:"instrument", exit:"none"});
    const mail = Loom.lesson.mail(ctx, E.inner, {x:0, y:0, scale:1.1});
    E.handle = mail;
    // Scaffold first, then the original email. No extra scenery competes with the white sheet.
    ctx.m.reveal(E, enter, {dur:revealDur});
    ctx.m.draw(mail.laptop, enter, {dur:drawDur});
    mail.moveCursor("send", ctx.start, moveDur);
    mail.setClass("confidential", classify, moveDur);
    mail.show("need", need, revealDur);
    mail.show("channel", channel, revealDur);
    mail.dimSend(true, channel, moveDur);
    mail.moveCursor("channel", channel, moveDur);
    mail.lightChannel(channel, moveDur);
    mail.show("owner", owner, revealDur);
    // A small, centred push holds the callback geometry and leaves the caption band clear.
    ctx.m.travel(E, enter, {x:-12.1, y:-7.304, scale:1.02, dur:ctx.speechEnd-enter});
  }
});
