// @design shared_loss_verdict: a missing criterion remains while one enclosure carries both intact sources away
Loom.scene("b12", {
  build(ctx, props) {
    // Treatments: static verdict signalling; enclosure travel proving shared loss; separate source exits.
    // Choose enclosure travel. One carrier proves shared failure; the static rail retains the verdict after departure.
    const m = ctx.m;
    const tOne = ctx.cue("The one");
    const tLoss = ctx.cue("one stolen bag takes both");
    const bag = ctx.held("bag");
    const laptop = ctx.held("laptop_b");
    const report = ctx.held("report_b");
    const usb = ctx.held("usb");
    const copy = ctx.held("copy_usb");
    const boundary = ctx.held("boundary_bag");
    const rail = ctx.held("rail");
    // @form check_verdict: correct counts stay neutral while the absent criterion is outlined
    rail.handle.setState(0,"ticked",tOne);
    rail.handle.setState(1,"ticked",tOne);
    rail.handle.setState(2,"missing",tOne);
    // @form missing_tag: the risk verdict hangs above its tile clear of all rail labels
    const fit = ctx.kit.fit("Missing: 1 offsite",{role:"label",w:300,h:52,maxLines:1,weight:700});
    Loom.treat.label(ctx,"tag_missing",{x:1176,y:680,text:"Missing: 1 offsite",to:[1316,752],tone:"neg",role:"label",t:tOne});
    // @form shared_departure: the parent carries both files and their storage together
    // The boundary is a sibling in b11. Both origins move 1440 px right with unchanged y and identical timing.
    m.travel(bag,tLoss,{x:1440,y:0,dur:ctx.style.dur("move")*3});
    m.travel(boundary,tLoss,{x:1440,y:0,dur:ctx.style.dur("move")*3});
    [bag,laptop,report,usb,copy,boundary,rail].forEach(E => {E.exit="recede";});
  }
});
