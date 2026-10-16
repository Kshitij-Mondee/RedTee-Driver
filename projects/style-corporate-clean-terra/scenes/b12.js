// @design b12_missing_offsite: a checked rule rail exposes one absent safeguard before its shared bag leaves
Loom.scene("b12", {
  build(ctx, props) {
    const kit = ctx.kit;
    const m = ctx.m;
    const T = Loom.treat;
    // Treatment options: 1) static verdict rail, 2) bag loss replay, 3) chosen, verdict then shared travel proves it.
    const tOne = ctx.cue("The one.");
    const tLoss = ctx.cue("one stolen bag takes both");

    // @form bag: the continuing cutaway container, including every copy it carries
    const bag = ctx.held("bag");
    // @form laptop_b: continuing laptop inside the shared bag
    const laptop_b = ctx.held("laptop_b");
    // @form report_b: continuing Report copy on the laptop
    const report_b = ctx.held("report_b");
    // @form usb: continuing USB backup in the same bag
    const usb = ctx.held("usb");
    // @form copy_usb: continuing Report copy beside the USB
    const copy_usb = ctx.held("copy_usb");
    // @form boundary_bag: continuing shared-location boundary
    const boundary_bag = ctx.held("boundary_bag");
    // @form rail: continuing three-tile check rail
    const rail = ctx.held("rail");
    rail.handle.setState(0, "ticked", tOne, { dur: ctx.style.dur("move") });
    rail.handle.setState(1, "ticked", tOne + 0.08, { dur: ctx.style.dur("move") });
    rail.handle.setState(2, "missing", tOne + 0.16, { dur: ctx.style.dur("move") });

    // @form tag_missing: negative offsite verdict hanging from the missing tile
    T.label(ctx, "tag_missing", { x: 1270, y: 642, text: "Missing: 1 offsite", to: [1316, 720], tone: "neg", role: "label", t: tOne + 0.25 });

    // Bag is the sole travel parent, so laptop, USB, and both Report copies cannot remain behind.
    m.travel(bag, tLoss, { x: 2020, y: 190, dur: 1.1 });
    m.travel(boundary_bag, tLoss, { x: 1992, y: 136, dur: 1.1 });
  }
});
