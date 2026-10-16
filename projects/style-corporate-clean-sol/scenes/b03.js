// @design named_gap_and_number_family: name the absence, then stage a three-part promise beside it
Loom.scene("b03", {
  build(ctx) {
    // Treatments considered: static object with term signalling; rail sliding beside the gap; staggered family reveal below-right.
    // Choose the staggered family: absence stays fixed and the promise arrives in narration order.
    const K = ctx.kit, M = ctx.m;
    const tTerm = ctx.cue("single point of failure");
    const tRail = ctx.cue("three numbers");
    // Runtime continuity takes precedence over the pilot's empty-arrival metadata.
    // @form failed_device: retain the exact device drawn by the previous beat
    const laptop = ctx.held("laptop");
    const slot = laptop.handle.slot;
    // @form absent_document: retain the outline inside its unchanged device
    const report = ctx.held("report_main");
    // @form attached_term: the term is tethered to the absence, not a floating headline
    K.fit("Single point of failure",{role:"label",w:500,h:56,maxLines:1,weight:700});
    const term = Loom.treat.label(ctx,"label_spof",{x:740,y:220,text:"Single point of failure",to:[420+slot.x+slot.w/2,300+slot.y],tone:"accent2",role:"label",t:tTerm});
    term.exit = "wipe";
    M.exit(term,ctx.speechEnd-ctx.style.dur("exit"),"wipe");
    // @form number_family: the three promises occupy one rail, clear of the failed device and captions
    const railSize = Loom.lesson.rule_rail.size({size:"large",labels:"hidden"});
    const rail = ctx.el("rail",{x:880,y:730,w:railSize.w,h:railSize.h,kind:"value",exit:"none"});
    rail.handle = Loom.lesson.rule_rail(ctx,rail.inner,{size:"large",labels:"hidden"});
    rail.handle.setAll("named");
    rail.handle.tiles.forEach((tile,i) => {
      M.reveal({inner:tile.g},tRail+i*ctx.style.dur("stagger"),{dy:12,dur:ctx.style.dur("enter")});
    });
    rail.handle.setAll("unlit",ctx.speechEnd,{dur:ctx.style.dur("move")*0.6});
  }
});
