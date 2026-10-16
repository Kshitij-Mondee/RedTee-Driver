// @design stopped_sequence: a visible sequence ends before the waiting choices resolve
// Treatments: static composition with signalling; fade and replace the whole card; retain the card and shorten only its sequence. Choose the retained sequence, avoiding a flash and preserving a still question.
Loom.scene("b21", {
  build(ctx) {
    const now = ctx.cue("Now you");
    const nothing = ctx.cue("Then nothing");
    const question = ctx.cue("Where do you look first");
    // @form retained_choices: the same five places remain available without signalling an answer
    const board = ctx.held("board");
    const pins = ctx.held("station_pins");
    // @form shortened_sequence: only the trailing rows change, not the card or its earlier scans
    const phone = ctx.held("phone_card");
    const trail = phone.handle;
    trail.setState("trail", now);
    trail.setTrail(3, now, false);
    // Fit the retained card to three scans and one explicit missing-record row.
    const frame = trail.group.querySelector("rect");
    Loom.drive(function(e,p){frame.setAttribute("height",p>0?380:560);},now,ctx.style.dur("enter"),"linear");
    trail.gap.setAttribute("transform", "translate(110 -160)");
    const missingRow = ctx.kit.rect(trail.gap,-82,425,374,85,{fill:"none",stroke:"line",r:6});
    missingRow.setAttribute("stroke-dasharray", "8 8");
    trail.setTrail(3, nothing, true);
    // The question cue anchors the deliberate hold through the remaining viewer-response window. No camera, pin or board movement interrupts it.
    // The board and station_pins are passed unchanged to b22; the phone alone leaves.
    phone.exit = "displace";
  }
});
