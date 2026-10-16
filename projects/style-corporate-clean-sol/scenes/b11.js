// @design shared_container_check: two intact sources sit within one enclosure above a neutral test rail
Loom.scene("b11", {
  build(ctx, props) {
    // Treatments considered: static enclosure with question signalling; sequential staged contents; moving sources into enclosure.
    // Choose staged contents with a static settled check, movement only establishes narration order.
    const kit = ctx.kit, m = ctx.m;
    const tCheck = ctx.cue("Quick check");
    const tLaptop = ctx.cue("A laptop");
    const tUSB = ctx.cue("a USB backup");
    const tBag = ctx.cue("in the same bag");
    const tQuestion = ctx.cue("Which part breaks?");
    // @form check_ground: a quiet chapter field
    const ground = ctx.el("check_ground", {x:0,y:0,w:1920,h:1080,kind:"scenery",exit:"none"});
    kit.rect(ground.inner,0,0,1920,1080,{fill:"field2",r:0,shadow:false});
    // @form rule_choices: familiar neutral alternatives remain available
    const railOpts = {size:"normal",labels:true};
    const railSize = Loom.lesson.rule_rail.size(railOpts);
    const rail = ctx.el("rail", {x:(1920-railSize.w)/2,y:752,w:railSize.w,h:railSize.h,kind:"instrument",exit:"none"});
    rail.handle = Loom.lesson.rule_rail(ctx,rail.inner,railOpts);
    m.reveal(rail,tCheck,{dy:8});
    // @form shared_bag: one parent carries both sources at the next beat
    const bagOpts = {w:720};
    const bagSize = Loom.lesson.bag.size(bagOpts);
    const bag = ctx.el("bag",{x:600,y:140,w:bagSize.w,h:bagSize.h,kind:"node",exit:"none"});
    bag.handle = Loom.lesson.bag(ctx,bag.inner,bagOpts);
    m.settle(bag,tLaptop);
    const lp = bag.handle.spots.laptop;
    const laptopSize = Loom.lesson.laptop.size({w:lp.w});
    // @form contained_laptop: the first source stays inside the shared enclosure
    const laptop = ctx.el("laptop_b",{parent:bag,x:lp.x,y:lp.y,w:laptopSize.w,h:laptopSize.h,kind:"node",exit:"none"});
    laptop.handle = Loom.lesson.laptop(ctx,laptop.inner,{w:lp.w,state:"on"});
    m.settle(laptop,tLaptop);
    const slot = laptop.handle.slot;
    const reportSize = Loom.lesson.report_file.size({size:slot.h});
    // @form first_report: intact file on the laptop screen
    const report = ctx.el("report_b",{parent:bag,x:lp.x+slot.x,y:lp.y+slot.y,w:reportSize.w,h:reportSize.h,kind:"card",exit:"none"});
    report.handle = Loom.lesson.report_file(ctx,report.inner,{size:slot.h,state:"whole"});
    m.reveal(report,tLaptop,{dy:0});
    const up = bag.handle.spots.usb;
    const usbSize = Loom.lesson.usb_drive.size({w:up.w});
    // @form contained_backup: a second storage object inside the same bag
    const usb = ctx.el("usb",{parent:bag,x:up.x,y:up.y,w:usbSize.w,h:usbSize.h,kind:"node",exit:"none"});
    usb.handle = Loom.lesson.usb_drive(ctx,usb.inner,{w:up.w});
    m.settle(usb,tUSB);
    const us = usb.handle.slot;
    const copySize = Loom.lesson.report_file.size({size:us.h});
    // @form second_report: the same intact file beside the USB stick
    const copy = ctx.el("copy_usb",{parent:bag,x:up.x+us.x,y:up.y+us.y,w:copySize.w,h:copySize.h,kind:"card",exit:"none"});
    copy.handle = Loom.lesson.report_file(ctx,copy.inner,{size:us.h,state:"whole"});
    m.reveal(copy,tUSB,{dy:0});
    // @form bag_boundary: a neutral shared-location boundary
    const bb = Loom.lesson.place_boundary.around({x:600,y:140,w:bagSize.w,h:bagSize.h},{pad:28});
    const boundary = ctx.el("boundary_bag",{x:bb.x,y:bb.y,w:bb.w,h:bb.h,kind:"instrument",exit:"none"});
    boundary.handle = Loom.lesson.place_boundary(ctx,boundary.inner,{w:bb.dashW,h:bb.dashH,text:"Same bag",faint:true});
    m.unmask(boundary,tBag,{dir:"ltr"});
    // @form check_question: only saturated focal point in the held setup
    const question = ctx.el("question",{x:440,y:680,w:1040,h:56,kind:"text",exit:"wipe"});
    const fit = kit.fit("Which part breaks?",{role:"lead",w:1008,h:48,maxLines:1,weight:700});
    kit.text(question.inner,"Which part breaks?",{x:16,y:4,w:1008,h:48,role:"lead",size:fit.size,maxLines:1,weight:700,color:"accent",align:"center",valign:"middle"});
    m.reveal(question,tQuestion,{dy:8});
  }
});
