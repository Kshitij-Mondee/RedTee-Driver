// @design paired_scan: a second device frames the first device's pattern
// Treatments considered: static paired devices with signalling; a travelling pattern; a phone sliding in and changing to camera. Choose the last: the scan links the devices without moving the source.
Loom.scene("b09", {
  build(ctx) {
    const app = ctx.held("app");
    const chapters = ctx.held("chapters");
    const qr = ctx.held("qr");
    const A = app ? ctx.engine.resume(ctx, "app") : null;
    const open = ctx.cue("open the authenticator app");
    const tap = ctx.cue("tap Add account");
    const scan = ctx.cue("point the camera at the code");
    if (A) {
      A.zoomOut({at: ctx.start});
      A.pointerOut(ctx.start);
    }
    // @form authenticator_device: the companion device opens before its camera is used
    const phone = ctx.el("phone", {x:1450,y:180,w:340,h:692,kind:"instrument",exit:"displace"});
    const H = Loom.lesson.phone(ctx, phone.inner, {state:"home", code:"482159"});
    phone.kit = H;
    phone.handle = H;
    ctx.m.reveal(phone, open);
    H.slideIn(open);
    H.tap("addAccount", tap);
    H.setState("camera", scan);
    // @form scan_signal: a teaching outline distinguishes the camera's active region
    const viewfinder = ctx.el("viewfinder", {x:1476,y:330,w:288,h:368,kind:"icon",exit:"recede"});
    Loom.svg("rect", {x:2,y:2,width:284,height:364,rx:14,fill:"none",stroke:ctx.c("accent2"),"stroke-width":3}, viewfinder.inner);
    ctx.m.reveal(viewfinder, scan);
  }
});
