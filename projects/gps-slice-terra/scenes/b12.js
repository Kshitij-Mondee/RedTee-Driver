// @design gps_readout_chain: a live calculation turns a timestamp into a measured path
Loom.scene("b12", {
  build(ctx, props) {
    // Treatment A: a static formula card with sequential accent rows.
    // Treatment B: three panel rows light as the calculation proceeds, while the stamped chip travels into its row.
    // Treatment C: a giant equation replaces the diagram. Chosen B, because operations need a visible order and the held sky remains legible.
    const arrival = ctx.cue("Your phone takes the arrival time,");
    const sending = ctx.cue("subtracts the sending time,");
    const product = ctx.cue("and multiplies by the speed of light.");
    const ground = ctx.held("ground");
    const phonePoint = ctx.held("phone_pt");
    const satellites = ctx.held("sats");
    const timer = ctx.held("timer");
    const readoutLink = ctx.held("readout_link");
    const stampChip = ctx.held("stamp_chip");

    // @form readout_rows: three calculation steps inside the phone readout
    const rows = ctx.el("rows", { x: 1270, y: 520, w: 530, h: 276, kind: "card", exit: "recede" });
    const panel = Loom.lesson.phone(ctx, rows.inner, {
      form: "readout",
      rows: ["arrival time", "sending time", "x speed of light"],
      timer: true,
      timerTo: 0.07,
      decimals: 2,
      unit: "seconds"
    });
    panel.g.setAttribute("transform", "scale(1.05)");
    ctx.m.reveal(rows, arrival, { dur: ctx.style.dur("enter") });
    panel.lightRow(0, arrival);
    panel.lightRow(1, sending);
    panel.lightRow(2, product);

    // @form product_path: a thin route begins at the completed calculation and reaches satellite A
    const path = ctx.kit.path(rows.inner, "M18 242 C-120 178 -500 24 -830 -260", {
      fill: "none", stroke: ctx.c("accent"), sw: 4
    });
    ctx.m.draw(path, product + 0.18, { dur: ctx.style.dur("draw") });

    // The incoming timestamp becomes the sending-time operand rather than a second copy of the chip.
    if (stampChip) ctx.m.travel(stampChip, sending, { x: 1312, y: 670, scale: 0.45 });
    ctx.m.emphasis(rows, product + 0.32);

    const retire = product + 2.65;
    if (timer) ctx.m.exit(timer, retire, "recede");
    if (readoutLink) ctx.m.exit(readoutLink, retire, "recede");
    if (stampChip) ctx.m.exit(stampChip, retire, "recede");
  }
});
