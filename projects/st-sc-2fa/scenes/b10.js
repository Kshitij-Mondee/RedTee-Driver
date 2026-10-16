// @design renewal_clock: one transfer becomes a changing value beside a clock
// Treatments considered: a static paired view with signalling; a travelling key token; a one-time dashed connection followed by a renewing value. Choose the last because renewal is the point.
Loom.scene("b10", {
  build(ctx) {
    const app = ctx.held("app");
    const chapters = ctx.held("chapters");
    const qr = ctx.held("qr");
    const phone = ctx.held("phone");
    const viewfinder = ctx.held("viewfinder");
    const A = ctx.engine.resume(ctx, "app");
    const H = phone.handle || phone.kit;
    const share = ctx.cue("shares a secret key once");
    const show = ctx.cue("Now the app shows");
    const codeCue = ctx.cue("six-digit code");
    const renew = ctx.cue("about every thirty seconds");
    A.pointerOut(ctx.start);
    // @form transfer_trace: the connection is used once, then removed
    const keyline = ctx.el("keyline", {x:1036,y:500,w:414,h:148,kind:"connector",exit:"recede"});
    const path = ctx.kit.line(keyline.inner, 2,144,412,2,{stroke:"accent2",sw:3,dash:"8 8"});
    ctx.m.draw(path, share, {dur:ctx.style.dur("draw")});
    ctx.m.exit(keyline, show, "recede");
    ctx.m.exit(qr, show, "recede");
    ctx.m.exit(viewfinder, show, "recede");
    H.setState("code", show);
    H.setCode("482193", show);
    H.countdown(renew - 3, 0.9, "731604");
    // @form code_annotation: the held device supplies the digits, not a duplicate
    const code = Loom.treat.label(ctx, "code", {x:1100,y:394,w:240,text:"6-digit code",to:[1494,449],tone:"ink",role:"label",as:"pill",t:codeCue});
    // The default entrance clip truncates the wider badge. Preserve its fade
    // while allowing the complete pill and its label to render.
    code.life.removeAttribute("clip-path");
    ctx.m.exit(code, renew, "recede");
    // @form renewal_annotation: the small product clock is the one focus, with an illustrative refresh from 482193 to 731604
    const ring = Loom.treat.label(ctx, "ring", {x:1190,y:548,text:"30 s",to:[1734,493],tone:"accent2",role:"label",as:"pill",t:renew});
    ctx.m.emphasis(ring, renew);
    ring.life.removeAttribute("clip-path");
  }
});
