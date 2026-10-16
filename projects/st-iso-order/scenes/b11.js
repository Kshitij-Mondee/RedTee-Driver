// @design seal_and_identify: a carried object becomes a sealed shipment at a work surface
// Treatments: static bench with signalling; isolated before/after cards; chosen retained camera slide and state swap, because object continuity is the argument.
Loom.scene("b11", {
  build(ctx) {
    const packing=ctx.cue("At packing"), scanned=ctx.cue("scanned"), boxed=ctx.cue("boxed"), labelled=ctx.cue("labelled");
    const board=ctx.held("board"), lamp=ctx.held("lamp"), picker=ctx.held("picker");
    const world=board.handle, B=world.B;
    // @form packing_detail: the retained hall slides to its work surface
    world.frame("packingBench",packing,{zoom:5,dur:1.2,fly:true});
    // @form carried_subject: the same lamp moves along grid axes to the bench
    lamp.handle.item.move(packing,{to:[10.1,7.6,1.8],dur:(scanned-packing)/2});
    lamp.handle.item.move(packing+(scanned-packing)/2,{to:[10.1,9.3,1.8],dur:(scanned-packing)/2});
    lamp.handle.item.move(scanned,{to:world.anchors.packing,dur:ctx.style.dur("move")});
    lamp.handle.setState("box",boxed);
    picker.handle.exit(labelled,{kind:"sink"});
    // @form scanning_pass: a short scanning stroke crosses the subject then clears
    const scan=ctx.el("scan_line",{x:1010,y:480,w:180,h:210,kind:"instrument",exit:"wipe"});
    ctx.kit.line(scan.inner,12,18,168,18,{stroke:"accent2",sw:3});
    Loom.tl.set(scan.outer,{opacity:0},ctx.start);
    Loom.tl.set(scan.outer,{opacity:1},scanned);
    Loom.tween(scan.inner,{y:0},{y:160},scanned,{dur:ctx.style.dur("move")});
    Loom.tl.set(scan.outer,{opacity:0},boxed);
    // @form label_identification: the kit's white parcel label is named clear of the bench
    ctx.kit.fit("Label",{role:"label",w:180,h:54,maxLines:1});
    const label=Loom.treat.label(ctx,"label",{x:1360,y:460,text:"Label",to:[1140,585],tone:"line",role:"label",t:labelled});
    label.exit="recede";
  }
});
